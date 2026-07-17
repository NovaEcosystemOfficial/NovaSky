import { computeSkySession } from "nova://engine/scripts/mission-map/services/sky-compute.js";
import { LocationService } from "nova://engine/scripts/mission-map/services/location-service.js";
import {
  createMissionStore,
  createMissionItemFromTarget,
  localDateString,
} from "nova://engine/scripts/mission-map/services/mission-store.js";
import { CATALOG } from "nova://engine/scripts/mission-map/data/catalog.js";
import { moonAltAz, moonPhase } from "nova://engine/scripts/mission-map/astro/moon.js";
import { SKY_LIMITS } from "nova://engine/scripts/mission-map/data/config.js";
import {
  getDevices,
  getSetups,
  isSimulationMode,
  connectDevice,
  getDeviceSummary,
  HUB_EVENT,
} from "../../shared/device-registry.js";
import {
  buildMissionPlan,
  loadMissionMeta,
  heroImageUrl,
  miniImageUrl,
  notifyMissionUpdated,
  nextTargetStep,
} from "../../shared/mission-plan.js";

export function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatWindow(window) {
  if (!window?.start || !window?.end) return "—";
  return `${window.start} – ${window.end}`;
}

export function pickPrimaryTarget(session) {
  const { targets, visibleTargets } = session;
  const rank = (list) =>
    [...list].sort((a, b) => {
      const rec = (t) => (t.recommendation === "recommended" ? 3 : t.recommendation === "possible" ? 2 : 1);
      return rec(b) * 100 + b.novaScore - (rec(a) * 100 + a.novaScore);
    })[0];

  if (visibleTargets.length) return rank(visibleTargets);
  const tonight = targets.filter((t) => t.visibleTonight);
  if (tonight.length) return rank(tonight);
  return rank(targets);
}

export function pickTonightChips(session, limit = 6) {
  const pool = session.visibleTargets.length
    ? session.visibleTargets
    : session.targets.filter((t) => t.visibleTonight);
  return [...pool]
    .sort((a, b) => b.novaScore - a.novaScore)
    .slice(0, limit);
}

export function minutesUntilWindowStart(window, now = new Date()) {
  if (!window?.startDate) return null;
  const ms = window.startDate.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 60_000);
}

export function formatCountdown(minutes) {
  if (minutes == null) return "—";
  if (minutes <= 0) return "ora";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function moonPhaseIcon(phaseName = "") {
  const n = phaseName.toLowerCase();
  if (n.includes("nuova")) return "○";
  if (n.includes("calante")) return "◐";
  if (n.includes("piena")) return "●";
  if (n.includes("calante") || n.includes("gibbosa")) return "◑";
  if (n.includes("calante") === false && n.includes("gibbosa")) return "◑";
  return "◔";
}

export function findPrimarySeestar() {
  return (
    getDevices().find((d) => d.id === "dev-seestar-s30-pro") ||
    getDevices().find((d) => d.id === "dev-seestar-s50") ||
    getDevices().find((d) => d.category === "seestar")
  );
}

export function findConnectedSeestar() {
  return getDevices().find(
    (d) =>
      d.category === "seestar" &&
      ["connected", "operational"].includes(d.connectionState)
  );
}

export async function quickConnectSeestar() {
  if (isSimulationMode()) {
    const simTarget =
      getDevices().find((d) => d.id === "dev-seestar-s50") || findPrimarySeestar();
    if (!simTarget) return { ok: false, reason: "no_device" };
    await connectDevice(simTarget.id);
    return { ok: true, mode: "SIM", deviceId: simTarget.id };
  }

  const liveTarget =
    getDevices().find((d) => d.id === "dev-seestar-s30-pro") || findPrimarySeestar();
  if (!liveTarget) return { ok: false, reason: "no_device" };
  await connectDevice(liveTarget.id);
  const updated = getDevices().find((d) => d.id === liveTarget.id);
  const liveOk = updated?.telemetry?.mount?.liveState === "LIVE";
  return {
    ok: liveOk,
    mode: "LIVE",
    deviceId: liveTarget.id,
    error: liveOk ? null : updated?.errors?.[0] || "Seestar non rilevato — verifica hotspot Wi-Fi",
  };
}

export function resolveCaptureTargetId({ mission, plan, meta, session, captureState }) {
  if (captureState?.targetId) return captureState.targetId;
  if (meta?.sessionActive && plan?.steps?.length) {
    const step = nextTargetStep(plan) || plan.steps[0];
    return step?.item?.targetId || step?.target?.id;
  }
  if (mission.items.length) return mission.items[0].targetId;
  return pickPrimaryTarget(session)?.id || null;
}

export function targetFromCatalog(targetId) {
  return CATALOG.find((t) => t.id === targetId) || null;
}

export function activeSetupLabel() {
  const setups = getSetups();
  const deep = setups.find((s) => s.id === "setup-deep-sky");
  const seestar = setups.find((s) => s.slug === "smart-telescope" || s.slug === "smart-telescope-portable");
  if (findConnectedSeestar()) return seestar?.name || "Seestar";
  return deep?.name || setups[0]?.name || "—";
}

export function formatMountRa(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return "—";
  const h = Number(hours);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round((((h - hh) * 60) - mm) * 60);
  return `${hh}h ${String(mm).padStart(2, "0")}m ${String(ss).padStart(2, "0")}s`;
}

export function formatMountDeg(deg, digits = 2) {
  if (deg == null || Number.isNaN(Number(deg))) return "—";
  return `${Number(deg).toFixed(digits)}°`;
}

export function addTargetToMission(targetId, missionStore) {
  const payload = missionStore.load();
  if (payload.items.some((i) => i.targetId === targetId)) return false;
  const catalogTarget = CATALOG.find((t) => t.id === targetId);
  if (!catalogTarget) return false;
  const item = createMissionItemFromTarget(catalogTarget);
  item.order = payload.items.length;
  payload.items.push(item);
  const saved = missionStore.save(payload.items, payload.missionDate || localDateString());
  notifyMissionUpdated(saved);
  return true;
}

export function computeNightStatus(now, window, target) {
  const start = window?.startDate;
  const end = window?.endDate;
  if (!start || !end) return { status: "In preparazione", tone: "prep" };

  const t = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const openLead = 45 * 60_000;

  if (t < startMs - openLead) return { status: "In preparazione", tone: "prep" };
  if (t < startMs) return { status: "Finestra in apertura", tone: "opening" };
  if (t > endMs) return { status: "Finestra chiusa", tone: "closing" };
  if (target.recommendation === "recommended" && target.alt >= SKY_LIMITS.MIN_ALT) {
    return { status: "Osservazione consigliata", tone: "optimal" };
  }
  return { status: "Missione pronta", tone: "ready" };
}

export async function loadDashboardData(locationService, missionStore) {
  const now = new Date();
  locationService.useDemo();
  const observer = locationService.getLocation();
  const session = computeSkySession(observer, now);
  const target = pickPrimaryTarget(session);
  const chips = pickTonightChips(session);
  const nightStatus = computeNightStatus(now, target.window, target);
  const mission = missionStore.load();
  const meta = loadMissionMeta();
  const plan = buildMissionPlan(observer, mission, CATALOG);
  const moon = moonAltAz(observer.lat, observer.lon, now);
  const phase = moonPhase(now);
  const seestar = findConnectedSeestar();
  const devices = getDevices();
  const connectedCount = devices.filter((d) =>
    ["connected", "operational"].includes(d.connectionState)
  ).length;

  let displayStatus = nightStatus;
  if (meta.sessionActive && mission.items.length > 0) {
    displayStatus = { status: "In osservazione", tone: "optimal" };
  }

  const observerLabel =
    observer.label || `${observer.lat.toFixed(2)}°, ${observer.lon.toFixed(2)}°`;
  const isDemo = /demo/i.test(observerLabel);
  const deviceSummary = getDeviceSummary();

  return {
    now,
    observer,
    observerLabel,
    isDemo,
    session,
    target,
    chips,
    nightStatus: displayStatus,
    mission,
    meta,
    plan,
    moon,
    phase,
    seestar,
    devices,
    connectedCount,
    deviceTotal: devices.length,
    simulationMode: isSimulationMode(),
    setupLabel: activeSetupLabel(),
    deviceHubLabel: deviceSummary.label,
    windowCountdown: formatCountdown(minutesUntilWindowStart(target.window, now)),
    twilight: formatWindow(session.meta?.twilight),
  };
}

export function createDashboardServices() {
  return {
    locationService: new LocationService(),
    missionStore: createMissionStore(CATALOG.map((t) => t.id)),
  };
}

export { HUB_EVENT, heroImageUrl, miniImageUrl };
