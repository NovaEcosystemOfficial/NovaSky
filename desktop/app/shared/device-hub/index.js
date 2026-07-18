import { SimulationAdapter } from "./simulation-adapter.js";
import { SeestarAlpacaAdapter, LIVE_STATES, createEmptyMountTelemetry } from "./seestar-alpaca-adapter.js";
import { Eq6AscomAdapter, EQ6_LIVE_STATES, createEmptyEq6MountTelemetry } from "./eq6-ascom-adapter.js";
import { startSeestarLive, stopSeestarLive } from "./seestar-live-poller.js";
import { startEq6Live, stopEq6Live, isEq6LivePolling, getActiveEq6DeviceId, getEq6LiveAdapter } from "./eq6-live-poller.js";
import { ensureSeededHub } from "./seed.js";
import {
  deviceStatusLabel as rawDeviceStatusLabel,
  deviceModeBadge as rawDeviceModeBadge,
} from "./schemas.js";
import {
  loadHub,
  saveHub,
  resetHub,
  updateObservatory,
  addDevice,
  updateDevice,
  removeDevice,
  addSetup,
  updateSetup,
  assignDeviceToSetup,
  unassignDeviceFromSetup,
  setSimulationMode,
  getSummary,
} from "./store.js";

export { HUB_STORAGE_KEY, DEVICE_CATEGORIES, devicePowerLabel, deviceConnectionLabel, deviceDisplayName } from "./schemas.js";
export { resolveDeviceImage, DEVICE_PHOTO_CATALOG } from "./images.js";
export { startSeestarLive, stopSeestarLive, isSeestarLivePolling, getActiveLiveDeviceId } from "./seestar-live-poller.js";
export { startEq6Live, stopEq6Live, isEq6LivePolling, getActiveEq6DeviceId, getEq6LiveAdapter } from "./eq6-live-poller.js";
export { LIVE_STATES } from "./seestar-alpaca-adapter.js";
export { EQ6_LIVE_STATES, createEmptyEq6MountTelemetry, EQ6_SPEED_PRESETS } from "./eq6-ascom-adapter.js";

export const HUB_EVENT = "novasky-device-hub-updated";

let cache = null;
const adapters = new Map();

if (typeof window !== "undefined") {
  window.addEventListener("novasky-device-hub-invalidate", () => {
    cache = demoteStaleSimConnections(loadHub());
    emit();
  });
}

function emit() {
  window.dispatchEvent(new CustomEvent(HUB_EVENT, { detail: { hub: cache } }));
}

/**
 * When simulationMode is OFF, never keep mock "connected" sessions.
 * Live-capable devices return to dataSource=live + OFFLINE (not SIM).
 */
function demoteStaleSimConnections(hub) {
  if (!hub || hub.preferences?.simulationMode) return hub;
  let changed = false;
  const devices = hub.devices.map((d) => {
    const simConnected =
      d.dataSource === "simulated" &&
      ["connected", "operational", "connecting"].includes(d.connectionState);
    if (!simConnected) return d;
    changed = true;
    const liveCapable =
      d.connection?.adapterId === "eq6-ascom" ||
      d.connection?.adapterId === "seestar-alpaca" ||
      d.id === "dev-mount-eq6" ||
      d.category === "seestar";
    const clearMount =
      d.category === "mount" || d.id === "dev-mount-eq6"
        ? createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.OFFLINE)
        : d.category === "seestar"
          ? createEmptyMountTelemetry(LIVE_STATES.OFFLINE)
          : null;
    return {
      ...d,
      connectionState: "disconnected",
      operationalState: "offline",
      dataSource: liveCapable ? "live" : "simulated",
      integrationStatus: liveCapable ? "live" : d.integrationStatus,
      telemetry: clearMount
        ? {
            ...(d.telemetry || {}),
            mount: clearMount,
            power: { ...(d.telemetry?.power || {}), state: "standby" },
          }
        : d.telemetry,
      metadata: {
        ...(d.metadata || {}),
        liveState: "OFFLINE",
        _simulated: false,
      },
      errors: [],
    };
  });
  if (!changed) return hub;
  return saveHub({ ...hub, devices, updatedAt: new Date().toISOString() });
}

function refresh() {
  cache = demoteStaleSimConnections(ensureSeededHub(loadHub, saveHub));
  emit();
  return cache;
}

export function getDeviceHub() {
  if (!cache) refresh();
  return cache;
}

export function reloadDeviceHub() {
  return refresh();
}

export function persistHub(hub) {
  cache = saveHub(hub);
  emit();
  return cache;
}

export function getDeviceSummary() {
  return getSummary(getDeviceHub());
}

export function getDevices() {
  return [...getDeviceHub().devices];
}

export function getSetups() {
  return [...getDeviceHub().setups];
}

export function getObservatory() {
  return { ...getDeviceHub().observatory };
}

export function isSimulationMode() {
  return Boolean(getDeviceHub().preferences.simulationMode);
}

/** Badge/status respect global simulationMode — never show SIM when sim is OFF */
export function deviceStatusLabel(device) {
  return rawDeviceStatusLabel(device, { simulationMode: isSimulationMode() });
}

export function deviceModeBadge(device) {
  return rawDeviceModeBadge(device, { simulationMode: isSimulationMode() });
}

export function setObservatory(patch) {
  return persistHub(updateObservatory(getDeviceHub(), patch));
}

export function registerDevice(input) {
  return persistHub(addDevice(getDeviceHub(), input));
}

export function editDevice(deviceId, patch) {
  return persistHub(updateDevice(getDeviceHub(), deviceId, patch));
}

export function deleteDevice(deviceId) {
  return persistHub(removeDevice(getDeviceHub(), deviceId));
}

export function createSetupEntry(input) {
  return persistHub(addSetup(getDeviceHub(), input));
}

export function editSetup(setupId, patch) {
  return persistHub(updateSetup(getDeviceHub(), setupId, patch));
}

export function linkDeviceToSetup(setupId, deviceId) {
  return persistHub(assignDeviceToSetup(getDeviceHub(), setupId, deviceId));
}

export function unlinkDeviceFromSetup(setupId, deviceId) {
  return persistHub(unassignDeviceFromSetup(getDeviceHub(), setupId, deviceId));
}

function isSeestarLiveCandidate(device) {
  if (!device || device.category !== "seestar") return false;
  const id = device.connection?.adapterId;
  return id === "seestar-alpaca" || id === "ascom-alpaca" || id === "zwo-seestar" || device.model?.includes("S30");
}

function isEq6LiveCandidate(device) {
  if (!device || device.category !== "mount") return false;
  const id = device.connection?.adapterId;
  const model = (device.model || "").toLowerCase();
  return id === "eq6-ascom" || device.id === "dev-mount-eq6" || model.includes("eq6");
}

/**
 * SIM ON  → stop LIVE, keep SimulationAdapter path.
 * SIM OFF → demote any mock "connected" sessions; auto LIVE-reconnect EQ6 if it was SIM-connected.
 */
export function toggleSimulationMode(enabled) {
  if (enabled) {
    try {
      void getEq6LiveAdapter().stopAxes();
    } catch {
      /* ignore */
    }
    try {
      stopSeestarLive({ silent: true });
    } catch {
      /* ignore */
    }
    try {
      stopEq6Live({ silent: true });
    } catch {
      /* ignore */
    }
    adapters.clear();
    return persistHub(setSimulationMode(getDeviceHub(), true));
  }

  const before = getDeviceHub();
  const eq6WasSimConnected = before.devices.some(
    (d) =>
      isEq6LiveCandidate(d) &&
      d.dataSource === "simulated" &&
      ["connected", "operational", "connecting"].includes(d.connectionState)
  );

  adapters.clear();
  let hub = setSimulationMode(before, false);
  hub = demoteStaleSimConnections(hub);
  persistHub(hub);

  if (eq6WasSimConnected) {
    const eq6 = getDeviceHub().devices.find((d) => isEq6LiveCandidate(d));
    if (eq6) {
      // Fire LIVE reconnect; poller/HUB_EVENT aggiornano la UI a LIVE
      void startEq6Live(eq6.id).catch(() => {
        /* errori già in hub state */
      });
    }
  }

  return getDeviceHub();
}

/**
 * Adapter resolution:
 * - SIM mode → SimulationAdapter (explicit SIM label)
 * - LIVE Seestar (sim off) → SeestarAlpacaAdapter read-only
 * - LIVE EQ6 (sim off) → Eq6AscomAdapter read-only
 * - other devices with sim off → null (not implemented)
 */
export function getAdapterForDevice(deviceId) {
  const device = getDeviceHub().devices.find((d) => d.id === deviceId);
  if (!device) return null;

  if (isSimulationMode()) {
    if (!adapters.has(deviceId) || adapters.get(deviceId)?.id !== "simulation") {
      adapters.set(deviceId, new SimulationAdapter());
    }
    return adapters.get(deviceId);
  }

  // Never fall back to SimulationAdapter when sim is OFF
  if (isSeestarLiveCandidate(device)) {
    if (!adapters.has(deviceId) || adapters.get(deviceId)?.id !== "seestar-alpaca") {
      adapters.set(deviceId, new SeestarAlpacaAdapter());
    }
    return adapters.get(deviceId);
  }

  if (isEq6LiveCandidate(device)) {
    if (!adapters.has(deviceId) || adapters.get(deviceId)?.id !== "eq6-ascom") {
      adapters.set(deviceId, new Eq6AscomAdapter());
    }
    return adapters.get(deviceId);
  }

  return null;
}

export async function connectDevice(deviceId) {
  const hub = getDeviceHub();
  const device = hub.devices.find((d) => d.id === deviceId);
  if (!device) return hub;

  // LIVE path: polling service owns connect + snapshot — never SimulationAdapter
  if (!isSimulationMode() && isSeestarLiveCandidate(device)) {
    await startSeestarLive(deviceId);
    return getDeviceHub();
  }

  if (!isSimulationMode() && isEq6LiveCandidate(device)) {
    const alreadyBusy =
      device.connectionState === "connecting" ||
      device.telemetry?.mount?.liveState === "CONNECTING" ||
      (isEq6LivePolling() && getActiveEq6DeviceId() === deviceId);
    if (alreadyBusy) {
      return getDeviceHub();
    }
    const result = await startEq6Live(deviceId);
    // Se abortita da race, non lasciare ERROR silenzioso senza messaggio
    if (result && result.ok === false && result.error && result.error !== "aborted") {
      /* stato già scritto dal poller */
    }
    return getDeviceHub();
  }

  // SIM path only
  if (!isSimulationMode()) {
    return persistHub(
      updateDevice(hub, deviceId, {
        connectionState: "attention",
        operationalState: "needs_simulation",
        dataSource: device.dataSource === "live" ? "live" : "simulated",
        errors: ["Nessun adapter LIVE disponibile. Attiva SIM oppure usa Seestar S30 Pro / EQ6 in modalità LIVE."],
      })
    );
  }

  const adapter = getAdapterForDevice(deviceId);
  if (!adapter) {
    return persistHub(
      updateDevice(hub, deviceId, {
        connectionState: "attention",
        operationalState: "needs_simulation",
        errors: ["Nessun adapter disponibile. Attiva SIM oppure usa Seestar S30 Pro / EQ6 in modalità LIVE."],
      })
    );
  }

  persistHub(updateDevice(hub, deviceId, { connectionState: "connecting" }));
  const updated = await adapter.connect(device);
  return persistHub(
    updateDevice(getDeviceHub(), deviceId, {
      connectionState: updated.connectionState || "connected",
      lastConnectedAt: updated.lastConnectedAt || new Date().toISOString(),
      metadata: { ...updated.metadata, _simulated: true },
      dataSource: "simulated",
      integrationStatus: "simulated",
      operationalState: "idle",
    })
  );
}

export async function disconnectDevice(deviceId) {
  const hub = getDeviceHub();
  const device = hub.devices.find((d) => d.id === deviceId);

  if (device && !isSimulationMode() && isSeestarLiveCandidate(device)) {
    stopSeestarLive({ silent: false });
    return getDeviceHub();
  }

  if (device && !isSimulationMode() && isEq6LiveCandidate(device)) {
    await stopEq6Live({ silent: false });
    return getDeviceHub();
  }

  // SIM disconnect (or leftover SIM while sim is somehow still on)
  const adapter = adapters.get(deviceId);
  if (adapter && device) await adapter.disconnect(device);

  const liveCapable =
    device &&
    (isEq6LiveCandidate(device) || isSeestarLiveCandidate(device) || device.dataSource === "live");

  return persistHub(
    updateDevice(hub, deviceId, {
      connectionState:
        device?.integrationStatus === "in_development" && device?.connectionState === "configured"
          ? "configured"
          : "disconnected",
      dataSource: liveCapable ? "live" : "simulated",
      metadata: { ...(device?.metadata || {}), _simulated: false, liveState: "OFFLINE" },
    })
  );
}

export function toggleSimulationModeAndStopLive(enabled) {
  return toggleSimulationMode(enabled);
}

/** Manual MoveAxis — solo LIVE, mai in SIM */
export async function eq6ManualMoveAxis(axis, rate, direction) {
  if (isSimulationMode()) {
    return {
      ok: false,
      error: "sim_blocked",
      message: "Modalità SIM: nessun movimento hardware.",
      motionCommandsSent: false,
    };
  }
  const device = getDeviceHub().devices.find((d) => isEq6LiveCandidate(d));
  if (!device || device.dataSource !== "live" || device.telemetry?.mount?.liveState !== "LIVE") {
    return {
      ok: false,
      error: "not_live",
      message: "EQ6 non in LIVE: nessun movimento inviato.",
      motionCommandsSent: false,
    };
  }
  if (device.telemetry?.mount?.connected !== true) {
    return {
      ok: false,
      error: "not_connected",
      message: "Connected!=true: nessun movimento inviato.",
      motionCommandsSent: false,
    };
  }
  return getEq6LiveAdapter().moveAxis({ axis, rate, direction });
}

export async function eq6ManualStopAxes() {
  if (isSimulationMode()) {
    return { ok: true, skipped: "sim", motionCommandsSent: false };
  }
  try {
    return await getEq6LiveAdapter().stopAxes();
  } catch (err) {
    return { ok: false, error: String(err?.message || err), motionCommandsSent: false };
  }
}

export function getUnassignedDevices() {
  const hub = getDeviceHub();
  return hub.devices.filter((d) => !hub.setups.some((s) => s.deviceIds.includes(d.id)));
}

export function getDevicesForSetup(setupId) {
  const setup = getDeviceHub().setups.find((s) => s.id === setupId);
  if (!setup) return [];
  const byId = new Map(getDeviceHub().devices.map((d) => [d.id, d]));
  return setup.deviceIds.map((id) => byId.get(id)).filter(Boolean);
}

export function factoryResetHub() {
  localStorage.removeItem("novasky.device-hub.v1");
  cache = null;
  adapters.clear();
  return refresh();
}
