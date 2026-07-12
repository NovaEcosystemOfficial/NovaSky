/** Registro dispositivi — architettura futura, nessuna connessione Sprint 1. */

export const DEVICE_REGISTRY = [
  { id: "seestar", name: "Seestar", icon: "🔭", category: "telescope" },
  { id: "mount", name: "Montatura", icon: "⛰", category: "mount" },
  { id: "camera-main", name: "Camera principale", icon: "📷", category: "camera" },
  { id: "camera-guide", name: "Camera guida", icon: "◎", category: "camera" },
  { id: "filter-wheel", name: "Ruota portafiltri", icon: "◉", category: "accessory" },
  { id: "focuser", name: "Focheggiatore", icon: "↕", category: "accessory" },
  { id: "eagle", name: "EAGLE", icon: "🦅", category: "controller" },
  { id: "observatory", name: "Osservatorio", icon: "🏠", category: "site" },
];

export function getDeviceSummary() {
  return {
    total: DEVICE_REGISTRY.length,
    connected: 0,
  };
}
