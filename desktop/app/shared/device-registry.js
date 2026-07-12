/** Device Hub — re-export per compatibilità con moduli esistenti. */

export {
  getDevices,
  getSetups,
  getObservatory,
  getUnassignedDevices,
  getDevicesForSetup,
  isSimulationMode,
  toggleSimulationMode,
  connectDevice,
  disconnectDevice,
  setObservatory,
  registerDevice,
  editDevice,
  HUB_EVENT,
  getDeviceHub,
} from "./device-hub/index.js";

export {
  DEVICE_CATEGORIES,
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  deviceDisplayName,
} from "./device-hub/schemas.js";

export { resolveDeviceImage, DEVICE_PHOTO_CATALOG } from "./device-hub/images.js";

import { getDeviceSummary as hubGetSummary } from "./device-hub/index.js";

export function getDeviceSummary() {
  const summary = hubGetSummary();
  return {
    total: summary.deviceCount,
    connected: summary.connected,
    label: summary.label,
    setupCount: summary.setupCount,
    hardwareCount: summary.hardwareCount,
    unassigned: summary.unassigned,
    simulationMode: summary.simulationMode,
    observatoryName: summary.observatoryName,
  };
}
