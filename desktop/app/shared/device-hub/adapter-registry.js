/**
 * Registry adapter hardware estendibile — integrazioni future senza refactor.
 * Ogni vendor espone un adapterId, protocollo e capabilities supportate.
 */

export const ADAPTER_PROTOCOLS = [
  "native",
  "ascom",
  "ascom-alpaca",
  "indi",
  "eqmod",
  "synscan",
  "zwo-seestar",
  "zwo-asiair",
  "eagle",
  "nina",
  "phd2",
  "canon-edsdk",
  "nikon-ptp",
  "zwo-asi",
  "qhy-sdk",
  "player-one",
  "pegasus",
  "primelucelab",
  "skywatcher",
  "celestron",
  "ioptron",
  "simulation",
];

/** @type {Map<string, object>} */
const registry = new Map([
  ["simulation", { id: "simulation", label: "Simulazione NovaSky", protocol: "simulation", vendor: "NovaSky" }],
  ["seestar-alpaca", { id: "seestar-alpaca", label: "Seestar Alpaca (read-only)", protocol: "ascom-alpaca", vendor: "ZWO/ASCOM", status: "live-readonly-v0" }],
  ["zwo-seestar", { id: "zwo-seestar", label: "ZWO Seestar", protocol: "zwo-seestar", vendor: "ZWO", status: "planned" }],
  ["zwo-asiair", { id: "zwo-asiair", label: "ZWO ASIAIR", protocol: "zwo-asiair", vendor: "ZWO", status: "planned" }],
  ["eagle", { id: "eagle", label: "PrimaLuceLab Eagle", protocol: "eagle", vendor: "PrimaLuceLab", status: "planned" }],
  ["nina", { id: "nina", label: "N.I.N.A.", protocol: "nina", vendor: "NINA", status: "planned" }],
  ["phd2", { id: "phd2", label: "PHD2", protocol: "phd2", vendor: "OpenPHD", status: "planned" }],
  ["eqmod", { id: "eqmod", label: "EQMOD", protocol: "eqmod", vendor: "EQMOD", status: "planned" }],
  ["indi", { id: "indi", label: "INDI", protocol: "indi", vendor: "INDI", status: "planned" }],
  ["ascom", { id: "ascom", label: "ASCOM", protocol: "ascom", vendor: "ASCOM", status: "planned" }],
  ["ascom-alpaca", { id: "ascom-alpaca", label: "ASCOM Alpaca", protocol: "ascom-alpaca", vendor: "ASCOM", status: "live-readonly-v0" }],
  ["canon-edsdk", { id: "canon-edsdk", label: "Canon EDSDK", protocol: "canon-edsdk", vendor: "Canon", status: "planned" }],
  ["nikon-ptp", { id: "nikon-ptp", label: "Nikon PTP", protocol: "nikon-ptp", vendor: "Nikon", status: "planned" }],
  ["zwo-asi", { id: "zwo-asi", label: "ZWO ASI SDK", protocol: "zwo-asi", vendor: "ZWO", status: "planned" }],
  ["qhy-sdk", { id: "qhy-sdk", label: "QHY SDK", protocol: "qhy-sdk", vendor: "QHY", status: "planned" }],
  ["player-one", { id: "player-one", label: "Player One", protocol: "player-one", vendor: "Player One", status: "planned" }],
  ["pegasus", { id: "pegasus", label: "Pegasus Astro", protocol: "pegasus", vendor: "Pegasus", status: "planned" }],
  ["primelucelab", { id: "primelucelab", label: "PrimaLuceLab", protocol: "primelucelab", vendor: "PrimaLuceLab", status: "planned" }],
  ["skywatcher", { id: "skywatcher", label: "Sky-Watcher SynScan", protocol: "synscan", vendor: "Sky-Watcher", status: "planned" }],
  ["celestron", { id: "celestron", label: "Celestron", protocol: "ascom", vendor: "Celestron", status: "planned" }],
  ["ioptron", { id: "ioptron", label: "iOptron", protocol: "ascom", vendor: "iOptron", status: "planned" }],
]);

export function registerAdapter(definition) {
  if (!definition?.id) return null;
  registry.set(definition.id, { ...definition });
  return definition;
}

export function getAdapter(id) {
  return registry.get(id) || registry.get("simulation");
}

export function listAdapters() {
  return [...registry.values()];
}

export function resolveAdapterForDevice(device) {
  const id = device?.connection?.adapterId || "simulation";
  return getAdapter(id);
}
