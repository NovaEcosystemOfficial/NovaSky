import { getDeviceHub, isSimulationMode } from "../../shared/device-registry.js";
import {
  esc,
  deviceDisplayName,
  resolveDeviceImage,
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  resolveAdapterForDevice,
  formatDate,
  statusTone,
} from "./helpers.js";

export function renderDeviceDetail(deviceId) {
  const hub = getDeviceHub();
  const device = hub.devices.find((d) => d.id === deviceId);
  if (!device) {
    return `<div class="obs-detail-empty glass-panel"><p>Dispositivo non trovato.</p><button type="button" class="obs-btn" data-obs-back>← Osservatorio</button></div>`;
  }

  const adapter = resolveAdapterForDevice(device);
  const tone = statusTone(device);
  const sim = isSimulationMode();
  const connected = ["connected", "operational"].includes(device.connectionState);
  const specs = device.specs || {};
  const specRows = Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  return `
    <div class="obs-detail" data-obs-detail data-device-id="${device.id}">
      <button type="button" class="obs-back" data-obs-back>← Il mio Osservatorio</button>

      <div class="obs-detail-hero glass-panel">
        <div class="obs-detail-photo">
          <img src="${resolveDeviceImage(device)}" alt="${esc(deviceDisplayName(device))}" />
        </div>
        <div class="obs-detail-head">
          <p class="obs-kicker">${esc(device.brand)}</p>
          <h2>${esc(deviceDisplayName(device))}</h2>
          <p class="obs-detail-model">${esc(device.model)}</p>
          <span class="obs-card-status obs-card-status--${tone}">${esc(deviceStatusLabel(device))}</span>
          ${
            sim
              ? `<div class="obs-detail-actions">
                  ${
                    connected
                      ? `<button type="button" class="obs-btn" data-disconnect="${device.id}">Disconnetti</button>`
                      : `<button type="button" class="obs-btn obs-btn--primary" data-connect="${device.id}">Connetti (simulazione)</button>`
                  }
                </div>`
              : ""
          }
        </div>
      </div>

      <div class="obs-detail-grid">
        <section class="glass-panel obs-detail-panel">
          <h3>Telemetria</h3>
          <dl class="obs-spec-grid">
            <div><dt>Stato</dt><dd>${esc(deviceStatusLabel(device))}</dd></div>
            <div><dt>Connessione</dt><dd>${esc(deviceConnectionLabel(device))}</dd></div>
            <div><dt>Alimentazione</dt><dd>${esc(devicePowerLabel(device))}</dd></div>
            <div><dt>Temperatura</dt><dd>${device.telemetry?.temperature?.celsius != null ? `${device.telemetry.temperature.celsius}°C` : "—"}</dd></div>
            <div><dt>Firmware</dt><dd>${esc(device.telemetry?.firmware?.version)}</dd></div>
            <div><dt>Seriale</dt><dd>${esc(device.serial || "—")}</dd></div>
            <div><dt>Ultimo utilizzo</dt><dd>${formatDate(device.lastUsedAt)}</dd></div>
            <div><dt>Adapter</dt><dd>${esc(adapter.label)}</dd></div>
          </dl>
        </section>

        <section class="glass-panel obs-detail-panel">
          <h3>Porte & USB</h3>
          <div class="obs-tags">
            ${(device.ports || []).map((p) => `<span class="obs-tag">${esc(p)}</span>`).join("") || "<span class='obs-muted'>Nessuna porta registrata</span>"}
          </div>
          <h4>USB collegate</h4>
          <ul class="obs-list">${(device.usb || []).map((u) => `<li>${esc(u)}</li>`).join("") || "<li class='obs-muted'>—</li>"}</ul>
        </section>

        <section class="glass-panel obs-detail-panel">
          <h3>Specifiche</h3>
          <dl class="obs-spec-grid">${specRows || "<div><dt>—</dt><dd>Profilo ottico / hardware</dd></div>"}</dl>
        </section>

        <section class="glass-panel obs-detail-panel">
          <h3>Compatibilità</h3>
          <div class="obs-tags">
            ${(device.compatibility || []).map((c) => `<span class="obs-tag obs-tag--cyan">${esc(c)}</span>`).join("") || "—"}
          </div>
          <h4>Prossimi aggiornamenti</h4>
          <ul class="obs-list">${(device.upcomingUpdates || []).map((u) => `<li>${esc(u)}</li>`).join("") || "<li class='obs-muted'>Nessun aggiornamento pianificato</li>"}</ul>
        </section>

        <section class="glass-panel obs-detail-panel obs-detail-panel--wide">
          <h3>Note</h3>
          <p class="obs-notes">${esc(device.notes || "—")}</p>
          ${device.manualUrl ? `<a class="obs-link" href="${esc(device.manualUrl)}" data-manual-link>Manuale produttore</a>` : ""}
        </section>

        <section class="glass-panel obs-detail-panel obs-detail-panel--wide">
          <h3>Cronologia</h3>
          <ul class="obs-timeline">
            ${(device.history || []).map((h) => `<li><time>${formatDate(h.at)}</time><span>${esc(h.event)}</span></li>`).join("") || "<li class='obs-muted'>Nessun evento registrato</li>"}
          </ul>
        </section>
      </div>
    </div>
  `;
}
