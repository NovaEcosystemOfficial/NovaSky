import {
  HUB_EVENT,
  isSimulationMode,
  toggleSimulationMode,
  connectDevice,
  disconnectDevice,
} from "../../shared/device-registry.js";
import { togglePhotoRedesign, UI_PREFS_EVENT } from "../../shared/ui-preferences.js";
import { PRIMARY_SETUP_ID } from "../../shared/observatory-photo-manifest.js";
import { renderSetupDashboard } from "./setup-dashboard.js";
import { renderSetupChain } from "./setup-chain.js";
import { renderPanoramaView } from "./panorama-view.js";
import { renderDeviceDetail } from "../observatory/device-detail.js";

let view = "home";
let setupId = PRIMARY_SETUP_ID;
let detailId = null;
let hotspotsVisible = true;
let containerRef = null;
let ctxRef = null;
let onLayoutToggle = null;

function render() {
  if (!containerRef) return;

  let body = "";
  if (view === "detail" && detailId) {
    body = renderDeviceDetail(detailId);
  } else if (view === "setup") {
    body = renderSetupChain(setupId);
  } else if (view === "panorama") {
    body = renderPanoramaView(hotspotsVisible);
  } else {
    body = renderSetupDashboard();
  }

  containerRef.innerHTML = `
    <section class="observatory-photo digital-observatory device-hub-view" data-digital-observatory data-oph-root>
      ${body}
    </section>
  `;

  bindEvents(containerRef);
}

function bindEvents(root) {
  root.querySelector("[data-simulation-toggle]")?.addEventListener("change", (e) => {
    toggleSimulationMode(e.target.checked);
    render();
  });

  root.querySelector("[data-toggle-layout]")?.addEventListener("click", () => {
    togglePhotoRedesign();
    onLayoutToggle?.();
  });

  root.querySelectorAll("[data-oph-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = btn.dataset.ophTab === "panorama" ? "panorama" : "home";
      detailId = null;
      render();
    });
  });

  root.querySelectorAll("[data-oph-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = "home";
      detailId = null;
      render();
    });
  });

  root.querySelectorAll("[data-open-setup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setupId = btn.dataset.openSetup || PRIMARY_SETUP_ID;
      view = "setup";
      render();
    });
  });

  root.querySelectorAll("[data-device-detail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      detailId = btn.dataset.deviceDetail;
      view = "detail";
      render();
      ctxRef?.app?.classList.remove("is-panel-collapsed");
    });
  });

  root.querySelector("[data-toggle-hotspots]")?.addEventListener("click", () => {
    hotspotsVisible = !hotspotsVisible;
    render();
  });

  root.querySelectorAll("[data-hotspot-future]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!btn.dataset.deviceDetail) {
        // future hotspot — no action
      }
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
}

export function mountPhotoObservatory(container, ctx, options = {}) {
  containerRef = container;
  ctxRef = { ...ctx, app: document.querySelector("[data-nova-app]") };
  onLayoutToggle = options.onLayoutToggle || null;
  view = "home";
  detailId = null;
  hotspotsVisible = true;
  render();

  const onHub = () => render();
  window.addEventListener(HUB_EVENT, onHub);

  return {
    unmount: () => {
      window.removeEventListener(HUB_EVENT, onHub);
      containerRef = null;
      ctxRef = null;
      onLayoutToggle = null;
    },
  };
}

export { UI_PREFS_EVENT };
