import {
  HUB_EVENT,
  isSimulationMode,
  toggleSimulationMode,
  setObservatory,
  connectDevice,
  disconnectDevice,
  getUnassignedDevices,
} from "../../shared/device-registry.js";
import { renderDashboard } from "./dashboard.js";
import { renderFloorPlan } from "./floor-plan.js";
import { renderDeviceDetail } from "./device-detail.js";
import { renderPhotoCard } from "./helpers.js";

let view = "dashboard";
let detailId = null;
let containerRef = null;
let ctxRef = null;

function renderUnassignedSection() {
  const unassigned = getUnassignedDevices();
  if (!unassigned.length || view !== "dashboard") return "";
  return `
    <section class="obs-section obs-section--hub device-hub-unassigned" data-obs-unassigned>
      <header class="obs-section-head">
        <span class="obs-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/></svg></span>
        <div><h3>Device Hub</h3><p>${unassigned.length} disponibili — non assegnati a catena ottica</p></div>
      </header>
      <div class="obs-card-grid obs-unassigned-grid">
        ${unassigned.map((d) => renderPhotoCard(d)).join("")}
      </div>
    </section>`;
}

function render() {
  if (!containerRef) return;

  let body = "";
  if (view === "detail" && detailId) {
    body = renderDeviceDetail(detailId);
  } else if (view === "floor") {
    body = renderFloorPlan();
  } else {
    body = renderDashboard() + renderUnassignedSection();
  }

  containerRef.innerHTML = `
    <section class="digital-observatory device-hub-view" data-digital-observatory>
      ${body}
    </section>
  `;

  bindEvents(containerRef);
  updatePanel();
}

function updatePanel() {
  if (!ctxRef?.panelBody || (view === "detail" && detailId)) return;
  const sim = isSimulationMode();
  ctxRef.panelBody.innerHTML = `
    <p><strong>Digital Observatory</strong></p>
    <p style="margin-top:8px;color:var(--quiet);font-size:0.8125rem">
      Centro di controllo hardware modulare.${sim ? " Modalità simulazione attiva." : ""}
    </p>
  `;
}

function bindEvents(root) {
  root.querySelector("[data-obs-name]")?.addEventListener("change", (e) => {
    setObservatory({ name: e.target.value.trim() });
  });
  root.querySelector("[data-obs-location]")?.addEventListener("change", (e) => {
    setObservatory({ location: e.target.value.trim() });
  });
  root.querySelector("[data-simulation-toggle]")?.addEventListener("change", (e) => {
    toggleSimulationMode(e.target.checked);
    render();
  });

  root.querySelectorAll("[data-obs-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = btn.dataset.obsTab === "floor" ? "floor" : "dashboard";
      detailId = null;
      render();
    });
  });

  root.querySelectorAll("[data-obs-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = "dashboard";
      detailId = null;
      render();
    });
  });

  root.querySelectorAll("[data-device-detail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      detailId = btn.dataset.deviceDetail;
      view = "detail";
      render();
      if (ctxRef?.app?.classList.contains("is-panel-collapsed")) {
        ctxRef.app.classList.remove("is-panel-collapsed");
      }
    });
  });

  root.querySelectorAll("[data-floor-device]").forEach((btn) => {
    btn.addEventListener("click", () => {
      detailId = btn.dataset.floorDevice;
      view = "detail";
      render();
    });
  });

  root.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await connectDevice(btn.dataset.connect);
    });
  });

  root.querySelectorAll("[data-disconnect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await disconnectDevice(btn.dataset.disconnect);
    });
  });

  root.querySelectorAll("[data-manual-link]").forEach((a) => {
    a.addEventListener("click", (e) => e.preventDefault());
  });
}

export function mountDigitalObservatory(container, ctx) {
  containerRef = container;
  ctxRef = { ...ctx, app: document.querySelector("[data-nova-app]") };
  view = "dashboard";
  detailId = null;
  render();

  const onHub = () => render();
  window.addEventListener(HUB_EVENT, onHub);

  return {
    unmount: () => {
      window.removeEventListener(HUB_EVENT, onHub);
      containerRef = null;
      ctxRef = null;
      view = "dashboard";
      detailId = null;
    },
  };
}
