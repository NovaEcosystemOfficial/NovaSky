import { ObservatoryApp } from "nova://engine/scripts/mission-map/app.js";
import { installDesktopSkyEnhancement } from "./mission-map/sky-immersive.js";
import { installPanelBridge } from "./mission-map/panel-bridge.js";
import { installMissionMapRedesignBridge } from "./mission-map/mission-map-redesign.js";
import {
  isMissionMapRedesignEnabled,
  UI_PREFS_EVENT,
} from "../shared/ui-preferences.js";

let activeApp = null;
let teardownSky = null;
let teardownPanel = null;
let teardownRedesign = null;
let missionMapCssLoaded = false;
let engineBaseEl = null;
let hostContainer = null;
let hostCtx = null;
let onUiPref = null;

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

function loadStylesheet(href, marker) {
  if (document.querySelector(`link[${marker}]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(marker, "1");
  document.head.appendChild(link);
}

function ensureStyles() {
  if (missionMapCssLoaded) return;
  missionMapCssLoaded = true;
  loadStylesheet("nova://engine/styles/mission-map.css", "data-mm-engine-css");
  loadStylesheet("nova://desktop/styles/mission-map-host.css", "data-mm-host-css");
  loadStylesheet("nova://desktop/styles/mission-map-redesign.css", "data-mm-redesign-css");
}

function applyRedesignClass(enabled) {
  document.body.classList.toggle("is-mission-map-redesign", enabled);
  hostContainer?.closest("[data-workspace]")?.classList.toggle("is-mission-map-redesign", enabled);
}

async function mountCore(container, ctx) {
  ensureStyles();
  ensureEngineBase();
  document.body.classList.add("mission-map-page");
  applyRedesignClass(isMissionMapRedesignEnabled());

  const res = await fetch("nova://desktop/views/mission-map/observatory.html");
  const html = await res.text();
  container.innerHTML = html;

  activeApp = new ObservatoryApp();
  await activeApp.init();

  teardownSky = installDesktopSkyEnhancement(activeApp) || null;
  teardownPanel = installPanelBridge(activeApp, {
    panelBody: ctx.panelBody,
    appEl: container,
    redesign: isMissionMapRedesignEnabled(),
  });

  teardownRedesign = installMissionMapRedesignBridge(container, {
    onLayoutToggle: () => remountMissionMap(),
  });

  requestAnimationFrame(() => {
    activeApp.renderer?.resize();
    activeApp.refreshSky?.();
    window.dispatchEvent(new Event("resize"));
  });
}

async function remountMissionMap() {
  if (!hostContainer || !hostCtx) return;
  await unmountMissionMap();
  await mountCore(hostContainer, hostCtx);
}

export async function mountMissionMap(container, ctx) {
  hostContainer = container;
  hostCtx = ctx;

  if (!onUiPref) {
    onUiPref = () => {
      if (hostContainer) remountMissionMap();
    };
    window.addEventListener(UI_PREFS_EVENT, onUiPref);
  }

  await mountCore(container, ctx);

  return {
    unmount: unmountMissionMap,
  };
}

export async function unmountMissionMap() {
  if (teardownRedesign) {
    teardownRedesign();
    teardownRedesign = null;
  }
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
  document.body.classList.remove("mission-map-page", "is-mission-map-redesign");
  hostContainer?.closest("[data-workspace]")?.classList.remove("is-mission-map-redesign");
}
