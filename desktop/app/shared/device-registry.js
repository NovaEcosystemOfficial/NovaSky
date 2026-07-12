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
  DEVICE_CATEGORIES,
  deviceStatusLabel,
  deviceDisplayName,
  resolveDeviceImage,
  getDeviceHub,
} from "./device-hub/index.js";

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
