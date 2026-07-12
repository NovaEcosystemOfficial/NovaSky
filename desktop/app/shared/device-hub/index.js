import { SimulationAdapter } from "./simulation-adapter.js";
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

export { HUB_STORAGE_KEY, DEVICE_CATEGORIES, deviceStatusLabel, deviceDisplayName } from "./schemas.js";
export { resolveDeviceImage, DEVICE_IMAGE_CATALOG } from "./images.js";

export const HUB_EVENT = "novasky-device-hub-updated";

let cache = null;
const adapters = new Map();

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
  return persistHub(setSimulationMode(getDeviceHub(), enabled));
}

export function getAdapterForDevice(deviceId) {
  if (!isSimulationMode()) return null;
  if (!adapters.has(deviceId)) adapters.set(deviceId, new SimulationAdapter());
  return adapters.get(deviceId);
}

export async function connectDevice(deviceId) {
  const hub = getDeviceHub();
  const device = hub.devices.find((d) => d.id === deviceId);
  if (!device) return hub;

  const adapter = getAdapterForDevice(deviceId);
  if (!adapter) {
    return persistHub(
      updateDevice(hub, deviceId, {
        connectionState: "attention",
        operationalState: "needs_simulation",
      })
    );
  }

  persistHub(updateDevice(hub, deviceId, { connectionState: "connecting" }));
  const updated = await adapter.connect(device);
  return persistHub(
    updateDevice(getDeviceHub(), deviceId, {
      connectionState: updated.connectionState || "connected",
      lastConnectedAt: updated.lastConnectedAt || new Date().toISOString(),
      metadata: updated.metadata,
      dataSource: "simulated",
    })
  );
}

export async function disconnectDevice(deviceId) {
  const hub = getDeviceHub();
  const device = hub.devices.find((d) => d.id === deviceId);
  const adapter = adapters.get(deviceId);
  if (adapter && device) await adapter.disconnect(device);
  return persistHub(
    updateDevice(hub, deviceId, {
      connectionState: device?.integrationStatus === "in_development" && device?.connectionState === "configured"
        ? "configured"
        : "disconnected",
    })
  );
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
