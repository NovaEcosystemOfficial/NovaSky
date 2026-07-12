import {
  HUB_STORAGE_KEY,
  HUB_VERSION,
  createDefaultHub,
  createDevice,
  createSetup,
  sanitizeHub,
} from "./schemas.js";

function readRaw() {
  try {
    const raw = localStorage.getItem(HUB_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(hub) {
  localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(hub));
}

function touch(hub) {
  return { ...hub, updatedAt: new Date().toISOString() };
}

export function loadHub() {
  const raw = readRaw();
  if (!raw) return createDefaultHub();
  return sanitizeHub(raw);
}

export function saveHub(hub) {
  const next = touch({ ...hub, version: HUB_VERSION });
  writeRaw(next);
  return next;
}

export function resetHub() {
  const hub = createDefaultHub();
  writeRaw(hub);
  return hub;
}

export function updateObservatory(hub, patch) {
  return saveHub({
    ...hub,
    observatory: {
      ...hub.observatory,
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function addDevice(hub, deviceInput) {
  const device = createDevice(deviceInput);
  return saveHub({ ...hub, devices: [...hub.devices, device] });
}

export function updateDevice(hub, deviceId, patch) {
  const devices = hub.devices.map((d) =>
    d.id === deviceId ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
  );
  return saveHub({ ...hub, devices });
}

export function removeDevice(hub, deviceId) {
  const devices = hub.devices.filter((d) => d.id !== deviceId);
  const setups = hub.setups.map((s) => ({
    ...s,
    deviceIds: s.deviceIds.filter((id) => id !== deviceId),
    updatedAt: new Date().toISOString(),
  }));
  return saveHub({ ...hub, devices, setups });
}

export function addSetup(hub, setupInput) {
  const setup = createSetup(setupInput);
  return saveHub({ ...hub, setups: [...hub.setups, setup] });
}

export function updateSetup(hub, setupId, patch) {
  const setups = hub.setups.map((s) =>
    s.id === setupId ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
  );
  return saveHub({ ...hub, setups });
}

export function assignDeviceToSetup(hub, setupId, deviceId) {
  const setups = hub.setups.map((s) => {
    if (s.id !== setupId) {
      return { ...s, deviceIds: s.deviceIds.filter((id) => id !== deviceId) };
    }
    const ids = s.deviceIds.includes(deviceId) ? s.deviceIds : [...s.deviceIds, deviceId];
    return { ...s, deviceIds: ids, updatedAt: new Date().toISOString() };
  });
  return saveHub({ ...hub, setups });
}

export function unassignDeviceFromSetup(hub, setupId, deviceId) {
  const setups = hub.setups.map((s) =>
    s.id === setupId
      ? { ...s, deviceIds: s.deviceIds.filter((id) => id !== deviceId), updatedAt: new Date().toISOString() }
      : s
  );
  return saveHub({ ...hub, setups });
}

export function setSimulationMode(hub, enabled) {
  return saveHub({
    ...hub,
    preferences: { ...hub.preferences, simulationMode: Boolean(enabled) },
    observatory: { ...hub.observatory, simulationMode: Boolean(enabled) },
  });
}

export function getSummary(hub) {
  const connected = hub.devices.filter((d) =>
    ["connected", "operational"].includes(d.connectionState)
  ).length;
  const setupCount = hub.setups.length;
  const deviceCount = hub.devices.length;
  const smartSetupCount = hub.setups.filter((s) =>
    /smart-telescope/i.test(s.slug || s.name)
  ).length;
  const hardwareCount = hub.devices.filter((d) =>
    ["seestar", "camera_main"].includes(d.category)
  ).length;
  const unassigned = hub.devices.filter(
    (d) => !hub.setups.some((s) => s.deviceIds.includes(d.id))
  ).length;
  return {
    setupCount,
    smartSetupCount,
    deviceCount,
    hardwareCount,
    connected,
    unassigned,
    total: deviceCount,
    simulationMode: hub.preferences.simulationMode,
    observatoryName: hub.observatory.name,
    label: `${smartSetupCount} setup + ${hardwareCount} dispositivi + Device Hub attivo`,
  };
}
