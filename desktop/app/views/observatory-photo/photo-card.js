import {
  esc,
  deviceDisplayName,
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  statusTone,
  photoStyle,
} from "./helpers.js";
import { resolveDevicePhoto } from "../../shared/observatory-photo-manifest.js";

export function renderDevicePhotoCard(device, { compact = false, setupName = null } = {}) {
  if (!device) return "";
  const tone = statusTone(device);
  const img = resolveDevicePhoto(device);
  const fw = device.telemetry?.firmware?.version || "—";

  return `
    <article class="oph-card gear-card ${compact ? "oph-card--compact" : ""}" data-device-id="${device.id}">
      <div class="oph-card-media" style="${photoStyle(img)}">
        <div class="oph-card-overlay"></div>
        <span class="oph-card-badge oph-card-badge--${tone}">${esc(deviceStatusLabel(device))}</span>
        <div class="oph-card-caption">
          <h3>${esc(deviceDisplayName(device))}</h3>
          <p>${esc(device.brand)} · ${esc(device.model)}</p>
        </div>
      </div>
      <div class="oph-card-meta">
        ${setupName ? `<span class="oph-card-setup">${esc(setupName)}</span>` : ""}
        <dl class="oph-card-stats">
          <div><dt>Connessione</dt><dd>${esc(deviceConnectionLabel(device))}</dd></div>
          <div><dt>Alimentazione</dt><dd>${esc(devicePowerLabel(device))}</dd></div>
          <div><dt>Firmware</dt><dd>${esc(fw)}</dd></div>
        </dl>
        <button type="button" class="oph-btn" data-device-detail="${device.id}">Dettagli</button>
      </div>
    </article>
  `;
}

export function renderSetupHeroCard(setup, devices, photoUrl) {
  const tone = devices.some((d) => ["connected", "operational"].includes(d.connectionState))
    ? "online"
    : "idle";
  const mount = devices.find((d) => d.category === "mount");
  const ota = devices.find((d) => d.category === "telescope" || d.category === "ota");
  const cam = devices.find((d) => d.category === "camera_main");

  return `
    <article class="oph-setup-hero" data-setup-hero="${setup.id}">
      <div class="oph-setup-hero-media" style="${photoStyle(photoUrl)}">
        <div class="oph-card-overlay oph-card-overlay--hero"></div>
        <span class="oph-card-badge oph-card-badge--${tone}">${devices.length} componenti</span>
        <div class="oph-setup-hero-caption">
          <p class="oph-kicker">Setup principale</p>
          <h2>${esc(setup.name)}</h2>
          <ul class="oph-setup-hero-list">
            ${mount ? `<li>${esc(deviceDisplayName(mount))}</li>` : ""}
            ${ota ? `<li>${esc(deviceDisplayName(ota))}</li>` : ""}
            ${cam ? `<li>${esc(deviceDisplayName(cam))}</li>` : ""}
            <li>+ ${Math.max(0, devices.length - 3)} componenti</li>
          </ul>
        </div>
      </div>
      <div class="oph-setup-hero-actions">
        <button type="button" class="oph-btn oph-btn--primary" data-open-setup="${setup.id}">Apri setup</button>
      </div>
    </article>
  `;
}
