import { getDeviceHub, getObservatory, getDeviceSummary, isSimulationMode } from "../../shared/device-registry.js";
import { groupDevicesBySection, sectionIconSvg, renderPhotoCard, esc } from "./helpers.js";

export function renderDashboard() {
  const hub = getDeviceHub();
  const obs = getObservatory();
  const summary = getDeviceSummary();
  const groups = groupDevicesBySection(hub.devices);
  const sim = isSimulationMode();

  return `
    <div class="obs-dash" data-obs-dashboard>
      <header class="obs-hero">
        <div class="obs-hero-copy">
          <p class="obs-kicker">Digital Observatory</p>
          <h2>Il mio Osservatorio</h2>
          <p class="obs-hero-sub">${esc(obs.name)} · ${esc(obs.location)}</p>
        </div>
        <div class="obs-hero-badges">
          ${sim ? '<span class="obs-pill obs-pill--amber" data-sim-badge>SIMULAZIONE</span>' : ""}
          <span class="obs-pill obs-pill--cyan">Device Hub attivo</span>
        </div>
      </header>

      <div class="obs-summary glass-panel" data-hub-summary>
        <strong>${esc(summary.label)}</strong>
        <span>${hub.setups.length} catene ottiche · ${hub.devices.length} asset registrati</span>
      </div>

      <div class="obs-profile glass-panel">
        <div class="obs-profile-fields">
          <label class="obs-field">
            <span>Osservatorio</span>
            <input type="text" value="${esc(obs.name)}" data-obs-name />
          </label>
          <label class="obs-field">
            <span>Posizione</span>
            <input type="text" value="${esc(obs.location)}" data-obs-location />
          </label>
        </div>
        <label class="obs-sim-toggle">
          <input type="checkbox" data-simulation-toggle ${sim ? "checked" : ""} />
          <span>Modalità simulazione</span>
        </label>
      </div>

      <nav class="obs-tabs" role="tablist">
        <button type="button" class="obs-tab is-active" data-obs-tab="dashboard">Il mio Osservatorio</button>
        <button type="button" class="obs-tab" data-obs-tab="floor">Vista Osservatorio</button>
      </nav>

      <div class="obs-sections">
        ${groups
          .map(
            ({ section, devices }) => `
          <section class="obs-section" data-obs-section="${section.key}">
            <header class="obs-section-head">
              <span class="obs-section-icon">${sectionIconSvg(section.icon)}</span>
              <div>
                <h3>${esc(section.label)}</h3>
                <p>${devices.length} dispositiv${devices.length === 1 ? "o" : "i"}</p>
              </div>
            </header>
            <div class="obs-card-grid">
              ${devices.map((d) => renderPhotoCard(d)).join("")}
            </div>
          </section>
        `
          )
          .join("")}
      </div>

      <div data-setup-registry style="display:none" aria-hidden="true">
        ${hub.setups.map((s) => `<span data-setup-id="${s.id}"></span>`).join("")}
      </div>

      <footer class="obs-layout-switch">
        <button type="button" class="obs-btn obs-btn--ghost" data-enable-photo-layout>Layout fotografico (beta)</button>
      </footer>
    </div>
  `;
}
