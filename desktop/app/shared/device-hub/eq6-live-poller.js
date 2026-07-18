/**
 * Polling LIVE EQ6 via ASCOM EQMOD — 1.5s, stati OFFLINE/CONNECTING/LIVE/ERROR.
 * sessionGen annulla patch da poll/connect in volo dopo Disconnetti.
 */

import { Eq6AscomAdapter, EQ6_LIVE_STATES, createEmptyEq6MountTelemetry } from "./eq6-ascom-adapter.js";
import { loadHub, saveHub, updateDevice } from "./store.js";
import { ensureSeededHub } from "./seed.js";

export const EQ6_LIVE_EVENT = "novasky-eq6-live-updated";

const POLL_MS = 1500;
const MAX_CONSECUTIVE_FAILURES = 3;

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
/** @type {string|null} */
let activeDeviceId = null;
/** @type {Eq6AscomAdapter|null} */
let adapter = null;
let consecutiveFailures = 0;
let polling = false;
/** Incrementato a ogni stop — invalida connect/poll in corso */
let sessionGen = 0;

export function getEq6LiveAdapter() {
  if (!adapter) adapter = new Eq6AscomAdapter();
  return adapter;
}

export function isEq6LivePolling() {
  return Boolean(timer && activeDeviceId);
}

export function getActiveEq6DeviceId() {
  return activeDeviceId;
}

function getHub() {
  return ensureSeededHub(loadHub, saveHub);
}

function getDevices() {
  return getHub().devices;
}

function isSessionActive(session, deviceId) {
  return session === sessionGen && activeDeviceId === deviceId;
}

function patchDevice(deviceId, patch) {
  const hub = getHub();
  const current = hub.devices.find((d) => d.id === deviceId);
  const merged = { ...patch };
  if (patch.telemetry && current?.telemetry) {
    merged.telemetry = {
      ...current.telemetry,
      ...patch.telemetry,
      power: { ...(current.telemetry.power || {}), ...(patch.telemetry.power || {}) },
      firmware: { ...(current.telemetry.firmware || {}), ...(patch.telemetry.firmware || {}) },
      mount: patch.telemetry.mount !== undefined ? patch.telemetry.mount : current.telemetry.mount,
    };
  }
  if (patch.metadata && current?.metadata) {
    merged.metadata = { ...current.metadata, ...patch.metadata };
  }
  if (patch.connection && current?.connection) {
    merged.connection = { ...current.connection, ...patch.connection };
  }
  saveHub(updateDevice(hub, deviceId, merged));
  window.dispatchEvent(new CustomEvent("novasky-device-hub-invalidate", { detail: { deviceId } }));
  window.dispatchEvent(new CustomEvent(EQ6_LIVE_EVENT, { detail: { deviceId } }));
}

export async function startEq6Live(deviceId) {
  // Pulisci timer senza soft-disconnect ASCOM ridondante se già fermi
  if (timer || activeDeviceId) {
    await stopEq6Live({ silent: true });
  }
  const session = ++sessionGen;
  activeDeviceId = deviceId;
  consecutiveFailures = 0;
  polling = false;
  const ad = getEq6LiveAdapter();

  patchDevice(deviceId, {
    connectionState: "connecting",
    operationalState: "connecting",
    dataSource: "live",
    integrationStatus: "live",
    telemetry: { mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.CONNECTING) },
    metadata: { liveState: EQ6_LIVE_STATES.CONNECTING, readOnlyV0: true },
    errors: [],
    capabilities: ["connect", "disconnect"],
  });

  try {
    const device = getDevices().find((d) => d.id === deviceId);
    const connected = await ad.connect(
      device || {
        id: deviceId,
        category: "mount",
        connection: {},
        telemetry: {},
        metadata: {},
      }
    );

    if (!isSessionActive(session, deviceId)) {
      return { ok: false, state: EQ6_LIVE_STATES.OFFLINE, error: "aborted" };
    }

    patchDevice(deviceId, {
      connectionState: connected.connectionState,
      operationalState: connected.operationalState,
      dataSource: "live",
      integrationStatus: "live",
      lastConnectedAt: connected.lastConnectedAt,
      connection: connected.connection,
      customName: connected.customName,
      telemetry: connected.telemetry,
      metadata: connected.metadata,
      capabilities: ["connect", "disconnect"],
      errors: connected.errors || [],
    });

    if (connected.connectionState !== "connected") {
      if (isSessionActive(session, deviceId)) activeDeviceId = null;
      return { ok: false, state: EQ6_LIVE_STATES.ERROR, error: connected.errors?.[0] || "connect_failed" };
    }

    if (!isSessionActive(session, deviceId)) {
      return { ok: false, state: EQ6_LIVE_STATES.OFFLINE, error: "aborted" };
    }

    timer = setInterval(() => {
      void pollOnce(session);
    }, POLL_MS);
    return { ok: true, state: EQ6_LIVE_STATES.LIVE };
  } catch (err) {
    if (!isSessionActive(session, deviceId)) {
      return { ok: false, state: EQ6_LIVE_STATES.OFFLINE, error: "aborted" };
    }
    patchDevice(deviceId, {
      connectionState: "error",
      operationalState: "error",
      dataSource: "live",
      telemetry: { mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.ERROR, String(err?.message || err)) },
      metadata: { liveState: EQ6_LIVE_STATES.ERROR },
      errors: [String(err?.message || err)],
    });
    activeDeviceId = null;
    return { ok: false, state: EQ6_LIVE_STATES.ERROR, error: String(err?.message || err) };
  }
}

async function pollOnce(session) {
  if (polling || !activeDeviceId) return;
  if (session != null && session !== sessionGen) return;
  polling = true;
  const deviceId = activeDeviceId;
  const ad = getEq6LiveAdapter();
  try {
    const snap = await ad.getMountSnapshot();
    if (!isSessionActive(session ?? sessionGen, deviceId)) return;

    if (!snap.ok) {
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        if (!isSessionActive(session ?? sessionGen, deviceId)) return;
        patchDevice(deviceId, {
          connectionState: "disconnected",
          operationalState: "offline",
          dataSource: "live",
          telemetry: {
            mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.OFFLINE, snap.mount?.lastError || "disconnected"),
          },
          metadata: { liveState: EQ6_LIVE_STATES.OFFLINE },
          errors: [snap.mount?.lastError || "EQ6 disconnessa"],
        });
        await stopEq6Live({ silent: true });
      } else {
        patchDevice(deviceId, {
          connectionState: "attention",
          operationalState: "error",
          dataSource: "live",
          telemetry: {
            mount: {
              ...createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.ERROR, snap.mount?.lastError),
              lastPollAt: new Date().toISOString(),
            },
          },
          metadata: { liveState: EQ6_LIVE_STATES.ERROR },
          errors: [snap.mount?.lastError || "Errore poll EQ6"],
        });
      }
      return;
    }

    consecutiveFailures = 0;
    const device = getDevices().find((d) => d.id === deviceId);
    patchDevice(deviceId, {
      connectionState: "connected",
      operationalState: "live",
      dataSource: "live",
      integrationStatus: "live",
      connection: {
        ...(device?.connection || {}),
        type: "ASCOM",
        adapterId: "eq6-ascom",
        port: snap.mount.comPort || "COM3",
        driver: snap.mount.driverInfo || "EQMOD HEQ5/6",
      },
      telemetry: {
        ...(device?.telemetry || {}),
        power: { ...(device?.telemetry?.power || {}), state: "on" },
        firmware: {
          version: snap.mount.driverVersion || device?.telemetry?.firmware?.version || "—",
          channel: "eqmod",
        },
        mount: snap.mount,
      },
      metadata: {
        ...(device?.metadata || {}),
        liveState: EQ6_LIVE_STATES.LIVE,
        readOnlyV0: true,
        _simulated: false,
      },
      capabilities: ["connect", "disconnect"],
      errors: [],
    });
  } finally {
    polling = false;
  }
}

/**
 * Ferma poll e porta lo stato UI a OFFLINE.
 * @param {{keepDeviceId?:boolean,silent?:boolean}} [opts]
 */
export async function stopEq6Live(opts = {}) {
  sessionGen += 1;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const id = activeDeviceId;
  if (!opts.keepDeviceId) activeDeviceId = null;
  consecutiveFailures = 0;
  polling = false;

  if (id && !opts.silent) {
    // Soft disconnect: ferma solo NovaSky. Non spezzare la sessione EQMOD hardware.
    try {
      await getEq6LiveAdapter().disconnect(getDevices().find((d) => d.id === id) || { id });
    } catch {
      /* ignore */
    }
    patchDevice(id, {
      connectionState: "disconnected",
      operationalState: "offline",
      dataSource: "live",
      telemetry: { mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.OFFLINE) },
      metadata: { liveState: EQ6_LIVE_STATES.OFFLINE, readOnlyV0: true },
      errors: [],
    });
  }

  window.dispatchEvent(new CustomEvent(EQ6_LIVE_EVENT));
  window.dispatchEvent(new CustomEvent("novasky-device-hub-updated"));
}
