import { getDeviceHub } from "../../shared/device-registry.js";
import { esc, deviceDisplayName, resolveDeviceImage, deviceStatusLabel, statusTone } from "./helpers.js";

const ZONE_LABELS = {
  pier: "Pier centrale",
  "pier-east": "Pier est",
  "imaging-train": "Imaging train",
  "guide-scope": "Guida",
  rack: "Rack controllo",
  storage: "Deposito",
  mobile: "Area mobile",
  floor: "Pavimento",
};

export function renderFloorPlan() {
  const hub = getDeviceHub();
  const devices = hub.devices;

  return `
    <div class="obs-floor" data-obs-floor>
      <header class="obs-hero obs-hero--compact">
        <div class="obs-hero-copy">
          <p class="obs-kicker">Digital Observatory</p>
          <h2>Vista Osservatorio</h2>
          <p class="obs-hero-sub">Layout interattivo — ogni elemento apre la scheda dispositivo</p>
        </div>
        <nav class="obs-tabs" role="tablist">
          <button type="button" class="obs-tab" data-obs-tab="dashboard">Il mio Osservatorio</button>
          <button type="button" class="obs-tab is-active" data-obs-tab="floor">Vista Osservatorio</button>
        </nav>
      </header>

      <div class="obs-floor-stage glass-panel">
        <div class="obs-floor-grid" aria-hidden="true"></div>
        <div class="obs-floor-dome"></div>
        <div class="obs-floor-pier"></div>
        ${devices
          .map((d) => {
            const l = d.layout || { x: 50, y: 50, scale: 1 };
            const tone = statusTone(d);
            return `
          <button
            type="button"
            class="obs-floor-node obs-floor-node--${tone}"
            data-floor-device="${d.id}"
            style="--fx:${l.x}%;--fy:${l.y}%;--fs:${l.scale}"
            title="${esc(deviceDisplayName(d))}"
          >
            <span class="obs-floor-node-img"><img src="${resolveDeviceImage(d)}" alt="" /></span>
            <span class="obs-floor-node-label">${esc(deviceDisplayName(d))}</span>
            <span class="obs-floor-node-status">${esc(deviceStatusLabel(d))}</span>
          </button>
        `;
          })
          .join("")}
      </div>

      <div class="obs-floor-legend">
        ${[...new Set(devices.map((d) => d.layout?.zone || "floor"))]
          .map((z) => `<span class="obs-tag">${esc(ZONE_LABELS[z] || z)}</span>`)
          .join("")}
      </div>

      <div data-setup-registry style="display:none" aria-hidden="true">
        ${hub.setups.map((s) => `<span data-setup-id="${s.id}"></span>`).join("")}
      </div>
    </div>
  `;
}
