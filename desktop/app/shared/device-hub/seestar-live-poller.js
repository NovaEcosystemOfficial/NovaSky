/**
 * Polling LIVE Seestar 1–2s — stati OFFLINE / CONNECTING / LIVE / ERROR.
 * Nessuno spinner infinito: timeout + backoff su errori.
 */

import { SeestarAlpacaAdapter, LIVE_STATES, createEmptyMountTelemetry } from "./seestar-alpaca-adapter.js";
import { loadHub, saveHub, updateDevice } from "./store.js";
import { ensureSeededHub } from "./seed.js";

export const SEESTAR_LIVE_EVENT = "novasky-seestar-live-updated";

const POLL_MS = 1500;
const MAX_CONSECUTIVE_FAILURES = 3;

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
/** @type {string|null} */
let activeDeviceId = null;
/** @type {SeestarAlpacaAdapter|null} */
let adapter = null;
let consecutiveFailures = 0;
let polling = false;
let pollCount = 0;

export function getSeestarLiveAdapter() {
  if (!adapter) adapter = new SeestarAlpacaAdapter();
  return adapter;
}

export function isSeestarLivePolling() {
  return Boolean(timer && activeDeviceId);
}

export function getActiveLiveDeviceId() {
  return activeDeviceId;
}

function getHub() {
  return ensureSeededHub(loadHub, saveHub);
}

function getDevices() {
  return getHub().devices;
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
      temperature: { ...(current.telemetry.temperature || {}), ...(patch.telemetry.temperature || {}) },
      firmware: { ...(current.telemetry.firmware || {}), ...(patch.telemetry.firmware || {}) },
      mount: patch.telemetry.mount !== undefined ? patch.telemetry.mount : current.telemetry.mount,
      cameras: patch.telemetry.cameras !== undefined ? patch.telemetry.cameras : current.telemetry.cameras,
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
  window.dispatchEvent(new CustomEvent(SEESTAR_LIVE_EVENT, { detail: { deviceId } }));
}

/**
 * Start LIVE session for a Seestar device id.
 * @param {string} deviceId
 */
export async function startSeestarLive(deviceId) {
  stopSeestarLive({ keepDeviceId: false, silent: true });
  activeDeviceId = deviceId;
  consecutiveFailures = 0;
  const ad = getSeestarLiveAdapter();

  patchDevice(deviceId, {
    connectionState: "connecting",
    operationalState: "connecting",
    dataSource: "live",
    integrationStatus: "live",
    telemetry: {
      mount: createEmptyMountTelemetry(LIVE_STATES.CONNECTING),
      cameras: null,
    },
    metadata: { liveState: LIVE_STATES.CONNECTING },
    errors: [],
  });

  try {
    const device = getDevices().find((d) => d.id === deviceId);
    const connected = await ad.connect(device || { id: deviceId, category: "seestar", connection: {}, telemetry: {}, metadata: {} });
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
      errors: connected.errors || [],
    });

    if (connected.connectionState !== "connected") {
      activeDeviceId = null;
      return { ok: false, state: LIVE_STATES.ERROR, error: connected.errors?.[0] || "connect_failed" };
    }

    timer = setInterval(() => {
      void pollOnce();
    }, POLL_MS);
    return { ok: true, state: LIVE_STATES.LIVE };
  } catch (err) {
    patchDevice(deviceId, {
      connectionState: "error",
      operationalState: "error",
      dataSource: "live",
      telemetry: { mount: createEmptyMountTelemetry(LIVE_STATES.ERROR, String(err?.message || err)) },
      metadata: { liveState: LIVE_STATES.ERROR },
      errors: [String(err?.message || err)],
    });
    activeDeviceId = null;
    return { ok: false, state: LIVE_STATES.ERROR, error: String(err?.message || err) };
  }
}

async function pollOnce() {
  if (polling || !activeDeviceId) return;
  polling = true;
  const deviceId = activeDeviceId;
  const ad = getSeestarLiveAdapter();
  try {
    const snap = await ad.getTelescopeSnapshot();
    if (!snap.ok) {
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        patchDevice(deviceId, {
          connectionState: "disconnected",
          operationalState: "offline",
          dataSource: "live",
          telemetry: {
            mount: createEmptyMountTelemetry(LIVE_STATES.OFFLINE, snap.error || "disconnected"),
            cameras: null,
          },
          metadata: { liveState: LIVE_STATES.OFFLINE, lastLiveError: snap.error },
          errors: [snap.error || "Disconnesso"],
        });
        stopSeestarLive({ keepDeviceId: false, silent: true });
      } else {
        patchDevice(deviceId, {
          connectionState: "attention",
          operationalState: "error",
          dataSource: "live",
          telemetry: {
            mount: {
              ...(createEmptyMountTelemetry(LIVE_STATES.ERROR, snap.error)),
              lastPollAt: new Date().toISOString(),
            },
          },
          metadata: { liveState: LIVE_STATES.ERROR, lastLiveError: snap.error },
          errors: [snap.error || "Poll error"],
        });
      }
      return;
    }

    consecutiveFailures = 0;
    pollCount += 1;
    const device = getDevices().find((d) => d.id === deviceId);
    let cameras = device?.telemetry?.cameras ?? null;
    // Refresh camera inventory every ~15s (not every poll) — no Connected PUT
    if (pollCount === 1 || pollCount % 10 === 0) {
      cameras = await ad.getCameraInventorySafe().catch(() => cameras);
    }
    patchDevice(deviceId, {
      connectionState: "connected",
      operationalState: "live",
      dataSource: "live",
      integrationStatus: "live",
      customName: snap.mount.name || device?.customName,
      connection: {
        ...(device?.connection || {}),
        type: "ASCOM Alpaca",
        adapterId: "seestar-alpaca",
        ip: snap.mount.host,
        port: String(snap.mount.alpacaPort || 32323),
        driver: snap.mount.driverInfo || "Telescope V3",
      },
      telemetry: {
        ...(device?.telemetry || {}),
        power: { ...(device?.telemetry?.power || {}), state: "on" },
        firmware: {
          version: snap.mount.driverVersion || device?.telemetry?.firmware?.version || "—",
          channel: "alpaca",
        },
        mount: snap.mount,
        cameras: cameras ?? device?.telemetry?.cameras ?? null,
      },
      metadata: {
        ...(device?.metadata || {}),
        liveState: LIVE_STATES.LIVE,
        alpacaCapabilities: snap.mount.capabilities,
        _simulated: false,
      },
      errors: [],
    });
  } finally {
    polling = false;
  }
}

/**
 * @param {{keepDeviceId?:boolean,silent?:boolean}} [opts]
 */
export function stopSeestarLive(opts = {}) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const id = activeDeviceId;
  if (!opts.keepDeviceId) activeDeviceId = null;
  consecutiveFailures = 0;
  polling = false;
  if (id && !opts.silent) {
    patchDevice(id, {
      connectionState: "disconnected",
      operationalState: "offline",
      dataSource: "live",
      telemetry: {
        mount: createEmptyMountTelemetry(LIVE_STATES.OFFLINE),
        cameras: null,
      },
      metadata: { liveState: LIVE_STATES.OFFLINE },
    });
  }
  window.dispatchEvent(new CustomEvent(SEESTAR_LIVE_EVENT));
  window.dispatchEvent(new CustomEvent("novasky-device-hub-updated"));
}

export async function reconnectSeestarLive(deviceId) {
  stopSeestarLive({ silent: true });
  return startSeestarLive(deviceId || activeDeviceId);
}
