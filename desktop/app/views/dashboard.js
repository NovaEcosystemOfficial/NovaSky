import { MISSION_STORAGE_KEY } from "nova://engine/scripts/mission-map/services/mission-store.js";
import { HUB_EVENT } from "../../shared/device-registry.js";
import {
  CAPTURE_EVENT,
  getCaptureState,
  setCaptureTarget,
  tickCapture,
  finishStacking,
  resetCaptureState,
} from "../../shared/seestar-capture.js";
import {
  createDashboardServices,
  loadDashboardData,
  resolveCaptureTargetId,
} from "./dashboard/helpers.js";
import { renderBriefingView, renderBriefingPanel } from "./dashboard/briefing-view.js";
import { renderCaptureView, renderCapturePanel } from "./dashboard/capture-view.js";

let refreshTimer = null;
let captureTimer = null;
let locationService = null;
let missionStore = null;
let containerRef = null;
let ctxRef = null;

function ensureStyles() {
  if (document.querySelector('link[href*="dashboard.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "nova://desktop/styles/dashboard.css";
  document.head.appendChild(link);
}

function setWorkspaceMode(captureActive) {
  const workspace = containerRef?.closest("[data-workspace]");
  workspace?.classList.toggle("is-dashboard-capture", captureActive);
  document.body.classList.toggle("dashboard-capture-active", captureActive);
}

function stopCaptureTimers() {
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
}

function startCaptureTimers() {
  stopCaptureTimers();
  captureTimer = setInterval(() => {
    const state = getCaptureState();
    if (state.phase === "capturing") {
      tickCapture();
      refresh();
    } else if (state.phase === "stacking") {
      finishStacking();
      refresh();
    }
  }, 900);
}

async function refresh() {
  if (!containerRef || !ctxRef || !locationService || !missionStore) return;

  const data = await loadDashboardData(locationService, missionStore);
  let captureState = getCaptureState();

  const targetId = resolveCaptureTargetId({
    mission: data.mission,
    plan: data.plan,
    meta: data.meta,
    session: data.session,
    captureState,
  });

  if (data.seestar) {
    if (!captureState.deviceId || captureState.deviceId !== data.seestar.id) {
      captureState = resetCaptureState(data.seestar.id);
    }
    if (targetId && captureState.targetId !== targetId) {
      captureState = setCaptureTarget(targetId, data.seestar.id);
    }
    const activeTarget =
      data.session.targets.find((t) => t.id === captureState.targetId) ||
      data.session.visibleTargets.find((t) => t.id === captureState.targetId) ||
      data.target;

    setWorkspaceMode(true);
    startCaptureTimers();
    const viewCtx = { ...ctxRef, onCaptureChange: refresh };
    renderCaptureView(containerRef, viewCtx, { ...data, activeTarget }, captureState);
    renderCapturePanel(ctxRef.panelBody, data, captureState);
  } else {
    setWorkspaceMode(false);
    stopCaptureTimers();
    if (captureState.phase !== "idle") {
      captureState = resetCaptureState();
    }
    renderBriefingView(containerRef, ctxRef, data, missionStore);
    renderBriefingPanel(ctxRef.panelBody, data);
  }
}

export async function mountDashboard(container, ctx) {
  ensureStyles();
  containerRef = container;
  ctxRef = ctx;

  const services = createDashboardServices();
  locationService = services.locationService;
  missionStore = services.missionStore;

  container.innerHTML = `<p class="dash-loading">Calcolo del cielo…</p>`;
  await refresh();

  refreshTimer = setInterval(refresh, 60_000);

  const onStorage = (event) => {
    if (event.key === MISSION_STORAGE_KEY) refresh();
  };
  const onMissionEvent = () => refresh();
  const onSessionEvent = () => refresh();
  const onHubEvent = () => refresh();
  const onCaptureEvent = () => refresh();

  window.addEventListener("storage", onStorage);
  window.addEventListener("novasky-mission-updated", onMissionEvent);
  window.addEventListener("novasky-session-updated", onSessionEvent);
  window.addEventListener(HUB_EVENT, onHubEvent);
  window.addEventListener(CAPTURE_EVENT, onCaptureEvent);

  return {
    unmount: () =>
      unmountDashboard(onStorage, onMissionEvent, onSessionEvent, onHubEvent, onCaptureEvent),
  };
}

export function unmountDashboard(onStorage, onMissionEvent, onSessionEvent, onHubEvent, onCaptureEvent) {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  stopCaptureTimers();
  setWorkspaceMode(false);

  if (onStorage) window.removeEventListener("storage", onStorage);
  if (onMissionEvent) window.removeEventListener("novasky-mission-updated", onMissionEvent);
  if (onSessionEvent) window.removeEventListener("novasky-session-updated", onSessionEvent);
  if (onHubEvent) window.removeEventListener(HUB_EVENT, onHubEvent);
  if (onCaptureEvent) window.removeEventListener(CAPTURE_EVENT, onCaptureEvent);

  locationService = null;
  missionStore = null;
  containerRef = null;
  ctxRef = null;
}
