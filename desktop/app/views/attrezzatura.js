import {
  getDeviceHub,
  getDeviceSummary,
  getDevicesForSetup,
  getUnassignedDevices,
  getObservatory,
  isSimulationMode,
  toggleSimulationMode,
  setObservatory,
  connectDevice,
  disconnectDevice,
  registerDevice,
  HUB_EVENT,
  DEVICE_CATEGORIES,
  deviceStatusLabel,
  deviceDisplayName,
  resolveDeviceImage,
} from "../shared/device-registry.js";

let selectedDeviceId = null;
let showWizard = false;

function statusClass(device) {
  if (["connected", "operational"].includes(device.connectionState)) return "is-connected";
  if (device.connectionState === "configured") return "is-pending";
  return "";
}

function renderDeviceCard(device, { showConnect = true } = {}) {
  const name = deviceDisplayName(device);
  const status = deviceStatusLabel(device);
  const cat = DEVICE_CATEGORIES[device.category]?.label || device.category;
  const img = resolveDeviceImage(device);
  const connected = ["connected", "operational"].includes(device.connectionState);
  const sim = isSimulationMode();

  return `
    <article class="device-hub-card gear-card ${selectedDeviceId === device.id ? "is-selected" : ""}" data-device-id="${device.id}">
      <div class="device-hub-card-media">
        <img src="${img}" alt="" loading="lazy" data-device-image="${device.imageKey || "generic"}" />
      </div>
      <div class="device-hub-card-body">
        <h5>${name}</h5>
        <p>${device.brand} · ${cat}</p>
        <span class="device-hub-status ${statusClass(device)}">${status}</span>
      </div>
      <div class="device-hub-card-actions">
        <button type="button" class="device-hub-btn" data-device-detail="${device.id}">Dettagli</button>
        ${
          showConnect && sim
            ? connected
              ? `<button type="button" class="device-hub-btn" data-disconnect="${device.id}">Disconnetti</button>`
              : `<button type="button" class="device-hub-btn device-hub-btn--primary" data-connect="${device.id}">Simula</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderSetup(setup) {
  const devices = getDevicesForSetup(setup.id);
  return `
    <div class="device-hub-setup" data-setup-id="${setup.id}">
      <div class="device-hub-setup-head">
        <h4>${setup.name}</h4>
        <span class="device-hub-setup-meta">${devices.length} componenti · ${setup.status === "ready" ? "Profilo completo" : "In configurazione"}</span>
      </div>
      ${setup.notes ? `<p class="device-hub-setup-meta" style="margin:0 0 12px">${setup.notes}</p>` : ""}
      <div class="device-hub-setup-grid">
        ${devices.map((d) => renderDeviceCard(d)).join("")}
      </div>
    </div>
  `;
}

function renderWizard() {
  if (!showWizard) return "";
  const categories = Object.values(DEVICE_CATEGORIES);
  return `
    <div class="device-hub-wizard" data-wizard>
      <h4>Aggiungi dispositivo</h4>
      <div class="device-hub-wizard-grid">
        <input type="text" placeholder="Nome personalizzato" data-wizard-name />
        <input type="text" placeholder="Marca" data-wizard-brand />
        <input type="text" placeholder="Modello" data-wizard-model />
        <select data-wizard-category>
          ${categories.map((c) => `<option value="${c.key}">${c.label}</option>`).join("")}
        </select>
      </div>
      <div class="device-hub-card-actions" style="max-width:280px">
        <button type="button" class="device-hub-btn device-hub-btn--primary" data-wizard-save>Salva nel Hub</button>
        <button type="button" class="device-hub-btn" data-wizard-cancel>Annulla</button>
      </div>
    </div>
  `;
}

function renderPanel(ctx, device) {
  if (!ctx.panelBody) return;
  if (!device) {
    const summary = getDeviceSummary();
    ctx.panelBody.innerHTML = `
      <p><strong>${summary.connected}</strong> collegati su <strong>${summary.total}</strong> dispositivi.</p>
      <p style="margin-top:12px;color:var(--quiet);font-size:0.8125rem">${summary.label}</p>
      <p style="margin-top:12px;color:var(--quiet);font-size:0.8125rem">Adapter hardware modulari — Seestar, EQ6, Eagle, Canon, ZWO/QHY e futuri dispositivi.</p>
    `;
    return;
  }

  const caps = device.capabilities?.length
    ? device.capabilities.join(", ")
    : "Nessuna capability registrata";
  ctx.panelBody.innerHTML = `
    <div class="device-hub-card-media" style="max-width:180px;margin-bottom:12px">
      <img src="${resolveDeviceImage(device)}" alt="" />
    </div>
    <h3 style="margin:0 0 4px;font-size:1rem;color:var(--text)">${deviceDisplayName(device)}</h3>
    <p style="margin:0 0 8px;font-size:0.8125rem;color:var(--quiet)">${device.brand} ${device.model}</p>
    <p style="margin:0 0 12px"><span class="device-hub-status ${statusClass(device)}">${deviceStatusLabel(device)}</span></p>
    <p style="margin:0 0 8px;font-size:0.8125rem"><strong>Categoria:</strong> ${DEVICE_CATEGORIES[device.category]?.label || device.category}</p>
    <p style="margin:0 0 8px;font-size:0.8125rem"><strong>Adapter:</strong> ${device.connection?.adapterId || "simulation"}</p>
    <p style="margin:0 0 8px;font-size:0.8125rem"><strong>Capabilities:</strong> ${caps}</p>
    ${device.notes ? `<p style="margin:12px 0 0;font-size:0.8125rem;color:var(--quiet)">${device.notes}</p>` : ""}
  `;
  if (ctx.app && ctx.app.classList.contains("is-panel-collapsed")) {
    ctx.app.classList.remove("is-panel-collapsed");
  }
}

function render(container, ctx) {
  const hub = getDeviceHub();
  const obs = getObservatory();
  const summary = getDeviceSummary();
  const setups = hub.setups;
  const unassigned = getUnassignedDevices();
  const sim = isSimulationMode();

  container.innerHTML = `
    <section class="device-hub device-hub-view">
      <header class="device-hub-head">
        <div>
          <h2>Device Hub</h2>
          <p>Infrastruttura modulare NovaSky — profili, setup ottici e adapter hardware indipendenti.</p>
        </div>
        <div class="device-hub-badges">
          ${sim ? '<span class="device-hub-badge device-hub-badge--sim">Simulazione</span>' : ""}
          <span class="device-hub-badge device-hub-badge--hub">Device Hub attivo</span>
        </div>
      </header>

      <div class="device-hub-summary" data-hub-summary>
        <strong>${summary.label}</strong> · ${summary.setupCount} setup ottici registrati · ${summary.unassigned} non assegnati
      </div>

      <div class="device-hub-profile">
        <div class="device-hub-profile-fields">
          <div class="device-hub-field">
            <label for="hub-obs-name">Osservatorio</label>
            <input id="hub-obs-name" type="text" value="${obs.name}" data-obs-name />
          </div>
          <div class="device-hub-field">
            <label for="hub-obs-loc">Posizione</label>
            <input id="hub-obs-loc" type="text" value="${obs.location}" data-obs-location />
          </div>
        </div>
        <label class="device-hub-toggle">
          <input type="checkbox" data-simulation-toggle ${sim ? "checked" : ""} />
          Modalità simulazione
        </label>
      </div>

      <div class="device-hub-section">
        <h3>Setup ottici</h3>
        <p>Profili compositi per sessioni DEEP SKY e smart telescope.</p>
        <div class="device-hub-setups">
          ${setups.map(renderSetup).join("")}
        </div>
      </div>

      ${
        unassigned.length
          ? `
      <div class="device-hub-section">
        <h3>Device Hub — disponibili</h3>
        <p>Dispositivi non assegnati a nessun setup.</p>
        <div class="device-hub-unassigned">
          ${unassigned.map((d) => renderDeviceCard(d)).join("")}
        </div>
      </div>`
          : ""
      }

      <div class="device-hub-section">
        <button type="button" class="device-hub-btn device-hub-btn--primary" data-add-device>+ Aggiungi dispositivo</button>
        ${renderWizard()}
      </div>

      <div class="device-hub-arch">
        <strong>Architettura adapter</strong> — Ogni dispositivo espone capabilities indipendenti tramite adapter
        (Seestar, EQ6/ZEQ6, Eagle Core, Canon EOS, ZWO/QHY, focheggiatori, ruote portafiltri, osservatori remoti,
        meteo, alimentazione). Sostituisci i placeholder SVG con <code>imageUrl</code> per la libreria fotografica ufficiale.
      </div>
    </section>
  `;

  renderPanel(ctx, selectedDeviceId ? hub.devices.find((d) => d.id === selectedDeviceId) : null);
  bindEvents(container, ctx);
}

function bindEvents(container, ctx) {
  container.querySelector("[data-obs-name]")?.addEventListener("change", (e) => {
    setObservatory({ name: e.target.value.trim() || "Osservatorio" });
  });
  container.querySelector("[data-obs-location]")?.addEventListener("change", (e) => {
    setObservatory({ location: e.target.value.trim() || "—" });
  });
  container.querySelector("[data-simulation-toggle]")?.addEventListener("change", (e) => {
    toggleSimulationMode(e.target.checked);
    render(container, ctx);
  });
  container.querySelector("[data-add-device]")?.addEventListener("click", () => {
    showWizard = true;
    render(container, ctx);
  });
  container.querySelector("[data-wizard-cancel]")?.addEventListener("click", () => {
    showWizard = false;
    render(container, ctx);
  });
  container.querySelector("[data-wizard-save]")?.addEventListener("click", () => {
    const name = container.querySelector("[data-wizard-name]")?.value.trim();
    const brand = container.querySelector("[data-wizard-brand]")?.value.trim() || "—";
    const model = container.querySelector("[data-wizard-model]")?.value.trim() || "—";
    const category = container.querySelector("[data-wizard-category]")?.value || "accessory";
    if (!name) return;
    registerDevice({
      customName: name,
      brand,
      model,
      category,
      connectionState: "disconnected",
      integrationStatus: "in_development",
      imageKey: "generic",
    });
    showWizard = false;
    render(container, ctx);
  });

  container.querySelectorAll("[data-device-detail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDeviceId = btn.dataset.deviceDetail;
      render(container, ctx);
    });
  });

  container.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await connectDevice(btn.dataset.connect);
      render(container, ctx);
    });
  });

  container.querySelectorAll("[data-disconnect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await disconnectDevice(btn.dataset.disconnect);
      render(container, ctx);
    });
  });
}

export function mountAttrezzatura(container, ctx) {
  if (!document.querySelector('link[href*="device-hub.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "nova://desktop/styles/device-hub.css";
    document.head.appendChild(link);
  }

  const shellCtx = { ...ctx, app: document.querySelector("[data-nova-app]") };
  render(container, shellCtx);

  const onHubUpdate = () => render(container, shellCtx);
  window.addEventListener(HUB_EVENT, onHubUpdate);

  return {
    unmount: () => {
      window.removeEventListener(HUB_EVENT, onHubUpdate);
      selectedDeviceId = null;
      showWizard = false;
    },
  };
}
