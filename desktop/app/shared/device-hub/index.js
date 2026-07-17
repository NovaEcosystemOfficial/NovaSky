import { SimulationAdapter } from "./simulation-adapter.js";
import { SeestarAlpacaAdapter } from "./seestar-alpaca-adapter.js";
import { startSeestarLive, stopSeestarLive } from "./seestar-live-poller.js";
import { ensureSeededHub } from "./seed.js";
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

export { HUB_STORAGE_KEY, DEVICE_CATEGORIES, deviceStatusLabel, devicePowerLabel, deviceConnectionLabel, deviceDisplayName, deviceModeBadge } from "./schemas.js";
export { resolveDeviceImage, DEVICE_PHOTO_CATALOG } from "./images.js";
export { startSeestarLive, stopSeestarLive, isSeestarLivePolling, getActiveLiveDeviceId } from "./seestar-live-poller.js";
export { LIVE_STATES } from "./seestar-alpaca-adapter.js";

export const HUB_EVENT = "novasky-device-hub-updated";

let cache = null;
const adapters = new Map();

if (typeof window !== "undefined") {
  window.addEventListener("novasky-device-hub-invalidate", () => {
    cache = loadHub();
    emit();
  });
}

function emit() {
  window.dispatchEvent(new CustomEvent(HUB_EVENT, { detail: { hub: cache } }));
}

function refresh() {
  cache = ensureSeededHub(loadHub, saveHub);
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

export function toggleSimulationMode(enabled) {
  if (enabled) {
    try {
      stopSeestarLive({ silent: true });
    } catch {
      /* ignore */
    }
  }
  return persistHub(setSimulationMode(getDeviceHub(), enabled));
}

function isSeestarLiveCandidate(device) {
  if (!device || device.category !== "seestar") return false;
  const id = device.connection?.adapterId;
  return id === "seestar-alpaca" || id === "ascom-alpaca" || id === "zwo-seestar" || device.model?.includes("S30");
}

/**
 * Adapter resolution:
 * - SIM mode → SimulationAdapter (explicit SIM label)
 * - LIVE Seestar (sim off) → SeestarAlpacaAdapter read-only
 * - other devices with sim off → null (not implemented)
 */
export function getAdapterForDevice(deviceId) {
  const device = getDeviceHub().devices.find((d) => d.id === deviceId);
  if (!device) return null;

  if (isSimulationMode()) {
    if (!adapters.has(deviceId)) adapters.set(deviceId, new SimulationAdapter());
    return adapters.get(deviceId);
  }

  if (isSeestarLiveCandidate(device)) {
    if (!adapters.has(deviceId) || adapters.get(deviceId)?.id !== "seestar-alpaca") {
      adapters.set(deviceId, new SeestarAlpacaAdapter());
    }
    return adapters.get(deviceId);
  }

  return null;
}

export async function connectDevice(deviceId) {
  const hub = getDeviceHub();
  const device = hub.devices.find((d) => d.id === deviceId);
  if (!device) return hub;

  // LIVE path: polling service owns connect + snapshot
  if (!isSimulationMode() && isSeestarLiveCandidate(device)) {
    const result = await startSeestarLive(deviceId);
    return getDeviceHub();
  }

  const adapter = getAdapterForDevice(deviceId);
  if (!adapter) {
    return persistHub(
      updateDevice(hub, deviceId, {
        connectionState: "attention",
        operationalState: "needs_simulation",
        errors: ["Nessun adapter disponibile. Attiva SIM oppure usa Seestar S30 Pro in modalità LIVE."],
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

  const adapter = adapters.get(deviceId);
  if (adapter && device) await adapter.disconnect(device);
  return persistHub(
    updateDevice(hub, deviceId, {
      connectionState: device?.integrationStatus === "in_development" && device?.connectionState === "configured"
        ? "configured"
        : "disconnected",
      dataSource: device?.dataSource === "live" ? "live" : "simulated",
    })
  );
}

export function toggleSimulationModeAndStopLive(enabled) {
  if (enabled) stopSeestarLive({ silent: true });
  return toggleSimulationMode(enabled);
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
