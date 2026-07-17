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
import { deviceModeBadge } from "../../shared/device-hub/schemas.js";

function fmtRa(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return "—";
  const h = Number(hours);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round((h - hh) * 60 * 60 - mm * 60);
  return `${hh}h ${String(mm).padStart(2, "0")}m ${String(ss).padStart(2, "0")}s`;
}

function fmtDeg(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(3)}°`;
}

function renderMountPanel(device) {
  const mount = device.telemetry?.mount;
  const mode = deviceModeBadge(device);
  if (device.dataSource !== "live" && mode === "SIM") {
    return `
      <section class="glass-panel obs-detail-panel obs-detail-panel--wide">
        <h3>Montatura · <span class="obs-tag">SIM</span></h3>
        <p class="obs-muted">Dati simulati — nessun hardware. Disattiva simulazione per LIVE Alpaca.</p>
      </section>`;
  }
  if (!mount || mount.liveState === "OFFLINE" || mount.source !== "live") {
    return `
      <section class="glass-panel obs-detail-panel obs-detail-panel--wide">
        <h3>Montatura · <span class="obs-tag">${esc(mode)}</span></h3>
        <p class="obs-muted">Nessuna telemetria LIVE. Collega il Seestar sull'hotspot (Alpaca :32323). Nessun dato inventato.</p>
        ${mount?.lastError ? `<p class="obs-muted">Ultimo errore: ${esc(mount.lastError)}</p>` : ""}
      </section>`;
  }

  const caps = mount.capabilities || {};
  const capTags = Object.entries(caps)
    .map(([k, v]) => `<span class="obs-tag ${v ? "obs-tag--cyan" : ""}">${esc(k)}=${v ? "yes" : "no"}</span>`)
    .join("");

  return `
    <section class="glass-panel obs-detail-panel obs-detail-panel--wide">
      <h3>Montatura Alpaca · <span class="obs-tag obs-tag--cyan">LIVE</span></h3>
      <dl class="obs-spec-grid">
        <div><dt>Identità</dt><dd>${esc(mount.name || "—")}</dd></div>
        <div><dt>Driver</dt><dd>${esc(mount.driverInfo || "—")} ${esc(mount.driverVersion || "")}</dd></div>
        <div><dt>Host</dt><dd>${esc(mount.host || "—")}:${esc(String(mount.alpacaPort || 32323))}</dd></div>
        <div><dt>Connected (Alpaca)</dt><dd>${mount.connected == null ? "—" : mount.connected ? "true" : "false"}</dd></div>
        <div><dt>RA</dt><dd>${esc(fmtRa(mount.ra))}</dd></div>
        <div><dt>Dec</dt><dd>${esc(fmtDeg(mount.dec))}</dd></div>
        <div><dt>Alt</dt><dd>${esc(fmtDeg(mount.altitude))}</dd></div>
        <div><dt>Az</dt><dd>${esc(fmtDeg(mount.azimuth))}</dd></div>
        <div><dt>Sidereal</dt><dd>${mount.siderealTime == null ? "—" : Number(mount.siderealTime).toFixed(4)}</dd></div>
        <div><dt>Tracking</dt><dd>${mount.tracking == null ? "—" : mount.tracking ? "on" : "off"}</dd></div>
        <div><dt>Slewing</dt><dd>${mount.slewing == null ? "—" : mount.slewing ? "on" : "off"}</dd></div>
        <div><dt>AtPark</dt><dd>${mount.atPark == null ? "—" : mount.atPark ? "yes" : "no"}</dd></div>
        <div><dt>AtHome</dt><dd>${mount.atHome == null ? "—" : mount.atHome ? "yes" : "no"}</dd></div>
        <div><dt>UTC</dt><dd>${esc(mount.utcDate || "—")}</dd></div>
        <div><dt>Sito</dt><dd>${mount.siteLatitude != null ? `${mount.siteLatitude}, ${mount.siteLongitude}` : "—"}</dd></div>
        <div><dt>Ultimo poll</dt><dd>${esc(mount.lastPollAt || "—")}</dd></div>
      </dl>
      <h4>Capability (sola lettura — non comandi)</h4>
      <div class="obs-tags">${capTags || "<span class='obs-muted'>—</span>"}</div>
    </section>`;
}

function renderCameraInventory(device) {
  const cams = device.telemetry?.cameras;
  if (!Array.isArray(cams) || !cams.length) return "";
  return `
    <section class="glass-panel obs-detail-panel obs-detail-panel--wide">
      <h3>Camera inventory (Alpaca · no exposure)</h3>
      <ul class="obs-list">
        ${cams
          .map(
            (c) => `<li>
              <strong>${esc(c.deviceName || `Camera[${c.deviceNumber}]`)}</strong>
              · driver ${esc(c.driverInfo || "—")} ${esc(c.driverVersion || "")}
              · Bayer ${c.bayerOffsetX ?? "—"}/${c.bayerOffsetY ?? "—"}
              · MaxBin ${c.maxBinX ?? "—"}×${c.maxBinY ?? "—"}
              <br/><span class="obs-muted">${esc(c.note || "")}</span>
            </li>`
          )
          .join("")}
      </ul>
    </section>`;
}

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
  const isLiveSeestar = device.category === "seestar" && !sim;
  const specs = device.specs || {};
  const specRows = Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
  const mode = deviceModeBadge(device);

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
          <span class="obs-card-status obs-card-status--${tone}">${esc(deviceStatusLabel(device))} · ${esc(mode)}</span>
          <div class="obs-detail-actions">
            ${
              connected
                ? `<button type="button" class="obs-btn" data-disconnect="${device.id}">Disconnetti</button>`
                : `<button type="button" class="obs-btn obs-btn--primary" data-connect="${device.id}">${
                    isLiveSeestar ? "Connetti LIVE (Alpaca GET)" : sim ? "Connetti (SIM)" : "Connetti"
                  }</button>`
            }
          </div>
          ${
            isLiveSeestar
              ? `<p class="obs-muted">v0 read-only: solo GET Alpaca :32323. Nessun GOTO/park/sync/capture.</p>`
              : ""
          }
        </div>
      </div>

      ${renderMountPanel(device)}
      ${renderCameraInventory(device)}

      <div class="obs-detail-grid">
        <section class="glass-panel obs-detail-panel">
          <h3>Telemetria</h3>
          <dl class="obs-spec-grid">
            <div><dt>Stato</dt><dd>${esc(deviceStatusLabel(device))}</dd></div>
            <div><dt>Modo</dt><dd>${esc(mode)}</dd></div>
            <div><dt>Connessione</dt><dd>${esc(deviceConnectionLabel(device))}</dd></div>
            <div><dt>IP</dt><dd>${esc(device.connection?.ip || "—")}</dd></div>
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
