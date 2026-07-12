import { ObservatoryApp } from "nova://engine/scripts/mission-map/app.js";
import { installDesktopSkyEnhancement } from "./mission-map/sky-immersive.js";
import { installPanelBridge } from "./mission-map/panel-bridge.js";

let activeApp = null;
let teardownSky = null;
let teardownPanel = null;
let missionMapCssLoaded = false;
let engineBaseEl = null;

function ensureEngineBase() {
  if (engineBaseEl) return;
  engineBaseEl = document.createElement("base");
  engineBaseEl.href = "nova://engine/";
  engineBaseEl.dataset.novaEngineBase = "";
  document.head.prepend(engineBaseEl);
}

function removeEngineBase() {
  if (engineBaseEl) {
    engineBaseEl.remove();
    engineBaseEl = null;
  }
}

function ensureStyles() {
  if (missionMapCssLoaded) return;
  missionMapCssLoaded = true;

  const links = [
    "nova://engine/styles/mission-map.css",
    "nova://desktop/styles/mission-map-host.css",
  ];

  for (const href of links) {
    if (document.querySelector(`link[href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

export async function mountMissionMap(container, ctx) {
  ensureStyles();
  ensureEngineBase();
  document.body.classList.add("mission-map-page");

  const res = await fetch("nova://desktop/views/mission-map/observatory.html");
  const html = await res.text();
  container.innerHTML = html;

  activeApp = new ObservatoryApp();
  await activeApp.init();

  teardownSky = installDesktopSkyEnhancement(activeApp) || null;
  teardownPanel = installPanelBridge(activeApp, {
    panelBody: ctx.panelBody,
    appEl: container,
  });

  requestAnimationFrame(() => {
    activeApp.renderer?.resize();
    activeApp.refreshSky?.();
    window.dispatchEvent(new Event("resize"));
  });

  return {
    unmount: unmountMissionMap,
  };
}

export async function unmountMissionMap() {
  if (teardownPanel) {
    teardownPanel();
    teardownPanel = null;
  }
  if (teardownSky) {
    teardownSky();
    teardownSky = null;
  }
  if (activeApp) {
    activeApp.destroy();
    activeApp = null;
  }
  removeEngineBase();
  document.body.classList.remove("mission-map-page");
}
