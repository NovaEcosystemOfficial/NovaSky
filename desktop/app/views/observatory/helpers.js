/** Utility condivise Digital Observatory */

import {
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  deviceDisplayName,
  resolveDeviceImage,
  DEVICE_CATEGORIES,
} from "../../shared/device-registry.js";
import { groupDevicesBySection, sectionIconSvg } from "../../shared/device-hub/categories.js";
import { resolveAdapterForDevice } from "../../shared/device-hub/adapter-registry.js";

export {
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  deviceDisplayName,
  resolveDeviceImage,
  groupDevicesBySection,
  sectionIconSvg,
  resolveAdapterForDevice,
  DEVICE_CATEGORIES,
};

export function statusTone(device) {
  const s = device?.connectionState;
  if (s === "connected" || s === "operational") return "online";
  if (s === "attention" || s === "error") return "warn";
  return "idle";
}

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPhotoCard(device) {
  const tone = statusTone(device);
  const img = resolveDeviceImage(device);
  const fw = device.telemetry?.firmware?.version || "—";

  return `
    <article class="obs-card gear-card" data-device-id="${device.id}" data-obs-card>
      <div class="obs-card-glow obs-card-glow--${tone}"></div>
      <div class="obs-card-photo">
        <img src="${img}" alt="${esc(deviceDisplayName(device))}" loading="lazy" />
        <span class="obs-card-status obs-card-status--${tone}">${esc(deviceStatusLabel(device))}</span>
      </div>
      <div class="obs-card-body">
        <h3 class="obs-card-title">${esc(deviceDisplayName(device))}</h3>
        <p class="obs-card-vendor">${esc(device.brand)} · ${esc(device.model)}</p>
        <dl class="obs-card-metrics">
          <div><dt>Connessione</dt><dd>${esc(deviceConnectionLabel(device))}</dd></div>
          <div><dt>Alimentazione</dt><dd>${esc(devicePowerLabel(device))}</dd></div>
          <div><dt>Firmware</dt><dd>${esc(fw)}</dd></div>
        </dl>
        <button type="button" class="obs-btn obs-btn--glass" data-device-detail="${device.id}">Dettagli</button>
      </div>
    </article>
  `;
}
