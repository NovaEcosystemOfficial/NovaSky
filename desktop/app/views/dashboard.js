import { computeSkySession } from "nova://engine/scripts/mission-map/services/sky-compute.js";
import { LocationService } from "nova://engine/scripts/mission-map/services/location-service.js";
import { createMissionStore, localDateString, MISSION_STORAGE_KEY } from "nova://engine/scripts/mission-map/services/mission-store.js";
import { CATALOG } from "nova://engine/scripts/mission-map/data/catalog.js";
import { moonAltAz, moonPhase } from "nova://engine/scripts/mission-map/astro/moon.js";
import { SKY_LIMITS } from "nova://engine/scripts/mission-map/data/config.js";
import { getDeviceSummary } from "../shared/device-registry.js";
import { loadMissionMeta } from "../shared/mission-plan.js";

const STATUS_CLASS = {
  "Missione pronta": "dash-status-ready",
  "In preparazione": "dash-status-prep",
  "In osservazione": "dash-status-optimal",
  "Finestra in apertura": "dash-status-opening",
  "Osservazione consigliata": "dash-status-optimal",
  "Finestra in chiusura": "dash-status-closing",
};

let refreshTimer = null;
let locationService = null;
let missionStore = null;

function pickPrimaryTarget(session) {
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

function computeMissionStatus(now, window, target) {
  const start = window?.startDate;
  const end = window?.endDate;
  if (!start || !end) return { status: "In preparazione" };

  const t = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const openLead = 45 * 60_000;
  const closeLead = 45 * 60_000;

  if (t < startMs - openLead) return { status: "In preparazione" };
  if (t < startMs) return { status: "Finestra in apertura" };
  if (t > endMs) return { status: "Finestra in chiusura" };
  if (t > endMs - closeLead) return { status: "Finestra in chiusura" };
  if (target.recommendation === "recommended" && target.alt >= SKY_LIMITS.MIN_ALT) {
    return { status: "Osservazione consigliata" };
  }
  if (target.recommendation === "possible" || target.aboveHorizon) {
    return { status: "Missione pronta" };
  }
  return { status: "In preparazione" };
}

function formatWindow(window) {
  if (!window?.start || !window?.end) return "—";
  return `${window.start} – ${window.end}`;
}

function renderDashboard(container, ctx, data) {
  const { status, target, session, mission, meta, devices, moon, phase } = data;
  const statusClass = STATUS_CLASS[status.status] || "dash-status-prep";
  const missionLabel =
    mission.items.length === 0
      ? "Nessuna missione composta"
      : meta?.sessionActive
        ? `${mission.items.length} target · in osservazione`
        : `${mission.items.length} target · salvata oggi`;

  container.innerHTML = `
    <section class="dash">
      <div class="dash-hero">
        <p class="dash-kicker">Stato della notte</p>
        <h2 class="dash-status ${statusClass}">${status.status}</h2>
        <p class="dash-verdict">${session.meta?.verdict || "Calcolo del cielo completato."}</p>
      </div>

      <div class="dash-grid">
        <article class="dash-card dash-card-primary">
          <span class="dash-card-label">Target consigliato</span>
          <h3>${target.name}</h3>
          <p>${target.subtitle || target.category || "—"}</p>
          <dl class="dash-meta">
            <div><dt>Altezza</dt><dd>${target.alt != null ? `${Math.round(target.alt)}°` : "—"}</dd></div>
            <div><dt>Finestra</dt><dd>${formatWindow(target.window)}</dd></div>
            <div><dt>NovaScore</dt><dd>${target.novaScore ?? "—"}</dd></div>
          </dl>
        </article>

        <article class="dash-card">
          <span class="dash-card-label">Missione corrente</span>
          <h3>${mission.items.length}</h3>
          <p>${missionLabel}</p>
          <button type="button" class="dash-link" data-goto="mission-map">Apri Mission Map</button>
        </article>

        <article class="dash-card">
          <span class="dash-card-label">Luna</span>
          <h3>${phase.phaseName || "—"}</h3>
          <p>${phase.illuminationPct != null ? `${Math.round(phase.illuminationPct)}% illuminata` : "—"} · alt ${Math.round(moon.alt)}°</p>
        </article>

        <article class="dash-card">
          <span class="dash-card-label">Attrezzatura</span>
          <h3>${devices.connected}/${devices.total}</h3>
          <p>${devices.label || "Dispositivi collegati"}</p>
          <button type="button" class="dash-link" data-goto="attrezzatura">Gestisci</button>
        </article>
      </div>
    </section>
  `;

  container.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => ctx.navigate(btn.dataset.goto));
  });

  if (ctx.panelBody) {
    ctx.panelBody.innerHTML = `
      <p><strong>Crepuscolo</strong><br/>${formatWindow(session.meta?.twilight)}</p>
      <p style="margin-top:12px"><strong>Posizione</strong><br/>${data.observerLabel}</p>
      <p style="margin-top:12px;color:var(--quiet);font-size:0.8125rem">Aggiornamento automatico ogni minuto.</p>
    `;
  }
}

async function refresh(container, ctx) {
  if (!locationService || !missionStore) return;

  const now = new Date();
  locationService.useDemo();
  const observer = locationService.getLocation();
  const session = computeSkySession(observer, now);
  const target = pickPrimaryTarget(session);
  const status = computeMissionStatus(now, target.window, target);
  const mission = missionStore.load();
  const meta = loadMissionMeta();
  const devices = getDeviceSummary();
  const moon = moonAltAz(observer.lat, observer.lon, now);
  const phase = moonPhase(now);

  let displayStatus = status;
  if (meta.sessionActive && mission.items.length > 0) {
    displayStatus = { status: "In osservazione" };
  }

  const observerLabel =
    observer.label ||
    `${observer.lat.toFixed(2)}°, ${observer.lon.toFixed(2)}°`;

  renderDashboard(container, ctx, {
    status: displayStatus,
    target,
    session,
    mission,
    meta,
    devices,
    moon,
    phase,
    observerLabel,
  });
}

export async function mountDashboard(container, ctx) {
  if (!document.querySelector('link[href*="dashboard.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "nova://desktop/styles/dashboard.css";
    document.head.appendChild(link);
  }

  locationService = new LocationService();
  missionStore = createMissionStore(CATALOG.map((t) => t.id));

  container.innerHTML = `<p class="dash-loading">Calcolo del cielo…</p>`;
  await refresh(container, ctx);

  refreshTimer = setInterval(() => refresh(container, ctx), 60_000);

  const onStorage = (event) => {
    if (event.key === MISSION_STORAGE_KEY) refresh(container, ctx);
  };
  const onMissionEvent = () => refresh(container, ctx);
  const onSessionEvent = () => refresh(container, ctx);
  const onHubEvent = () => refresh(container, ctx);
  window.addEventListener("storage", onStorage);
  window.addEventListener("novasky-mission-updated", onMissionEvent);
  window.addEventListener("novasky-session-updated", onSessionEvent);
  window.addEventListener("novasky-device-hub-updated", onHubEvent);

  return {
    unmount: () => unmountDashboard(onStorage, onMissionEvent, onSessionEvent, onHubEvent),
  };
}

export function unmountDashboard(onStorage, onMissionEvent, onSessionEvent, onHubEvent) {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (onStorage) window.removeEventListener("storage", onStorage);
  if (onMissionEvent) window.removeEventListener("novasky-mission-updated", onMissionEvent);
  if (onSessionEvent) window.removeEventListener("novasky-session-updated", onSessionEvent);
  if (onHubEvent) window.removeEventListener("novasky-device-hub-updated", onHubEvent);
  locationService = null;
  missionStore = null;
}
