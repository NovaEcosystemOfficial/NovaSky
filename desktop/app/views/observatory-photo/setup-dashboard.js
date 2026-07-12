import {
  getDeviceHub,
  getObservatory,
  getDeviceSummary,
  getUnassignedDevices,
  isSimulationMode,
} from "../../shared/device-registry.js";
import {
  PRIMARY_SETUP_ID,
  SMART_TELESCOPE_IDS,
  resolveSetupPhoto,
} from "../../shared/observatory-photo-manifest.js";
import { esc, deviceById } from "./helpers.js";
import { renderDevicePhotoCard, renderSetupHeroCard } from "./photo-card.js";

export function renderSetupDashboard() {
  const hub = getDeviceHub();
  const obs = getObservatory();
  const summary = getDeviceSummary();
  const sim = isSimulationMode();

  const deepSetup = hub.setups.find((s) => s.id === PRIMARY_SETUP_ID);
  const deepDevices = deepSetup
    ? deepSetup.deviceIds.map((id) => deviceById(hub, id)).filter(Boolean)
    : [];

  const smartDevices = SMART_TELESCOPE_IDS.map((id) => deviceById(hub, id)).filter(Boolean);
  const unassigned = getUnassignedDevices();

  return `
    <div class="oph-dash device-hub-view" data-obs-dashboard data-oph-dashboard>
      <header class="oph-header">
        <div class="oph-header-main">
          <h1>Il mio Osservatorio</h1>
          <p>${esc(obs.name)} · ${esc(obs.location)}</p>
        </div>
        <div class="oph-header-meta">
          ${sim ? '<span class="oph-pill oph-pill--amber" data-sim-badge>SIMULAZIONE</span>' : ""}
          <span class="oph-pill">${hub.setups.length} setup · ${hub.devices.length} dispositivi</span>
          <span class="oph-pill oph-pill--cyan">Device Hub attivo</span>
        </div>
      </header>

      <div class="oph-summary" data-hub-summary>
        <span>${esc(summary.label)}</span>
      </div>

      <nav class="oph-tabs" role="tablist">
        <button type="button" class="oph-tab is-active" data-oph-tab="home">Il mio Osservatorio</button>
        <button type="button" class="oph-tab" data-oph-tab="panorama">Vista Osservatorio</button>
      </nav>

      ${
        deepSetup
          ? `
      <section class="oph-block">
        ${renderSetupHeroCard(deepSetup, deepDevices, resolveSetupPhoto(PRIMARY_SETUP_ID))}
      </section>`
          : ""
      }

      ${
        smartDevices.length
          ? `
      <section class="oph-block">
        <header class="oph-block-head">
          <h2>Smart telescopes</h2>
          <p>Dispositivi integrati standalone</p>
        </header>
        <div class="oph-grid oph-grid--smart">
          ${smartDevices.map((d) => renderDevicePhotoCard(d, { compact: true })).join("")}
        </div>
      </section>`
          : ""
      }

      ${
        unassigned.length
          ? `
      <section class="oph-block device-hub-unassigned" data-obs-unassigned>
        <header class="oph-block-head">
          <h2>Dispositivi non assegnati</h2>
          <p>Disponibili nel Device Hub</p>
        </header>
        <div class="oph-grid oph-grid--free">
          ${unassigned.map((d) => renderDevicePhotoCard(d, { compact: true })).join("")}
        </div>
      </section>`
          : ""
      }

      <div data-setup-registry style="display:none" aria-hidden="true">
        ${hub.setups.map((s) => `<span data-setup-id="${s.id}"></span>`).join("")}
      </div>

      <footer class="oph-footer-controls">
        <label class="oph-sim-toggle">
          <input type="checkbox" data-simulation-toggle ${sim ? "checked" : ""} />
          Modalità simulazione
        </label>
        <button type="button" class="oph-btn oph-btn--ghost" data-toggle-layout>Layout classico</button>
      </footer>
    </div>
  `;
}
