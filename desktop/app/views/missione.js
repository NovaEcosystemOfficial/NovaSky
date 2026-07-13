import { CATALOG } from "nova://engine/scripts/mission-map/data/catalog.js";
import { LocationService } from "nova://engine/scripts/mission-map/services/location-service.js";
import {
  createMissionStore,
  MISSION_STORAGE_KEY,
} from "nova://engine/scripts/mission-map/services/mission-store.js";
import {
  buildMissionPlan,
  recalculateSchedule,
  optimizeMissionOrder,
  formatDuration,
  recommendationLabel,
  notifyMissionUpdated,
  notifySessionUpdated,
  loadMissionMeta,
  saveMissionMeta,
  clearMissionMeta,
  heroImageUrl,
  DURATION_PRESETS,
  CHECKLIST_ITEMS,
  SESSION_PHASES,
  computeSessionPhase,
  remainingMinutes,
  nextTargetStep,
  buildAssistantMessage,
  buildSessionSummary,
  MISSION_META_KEY,
} from "../shared/mission-plan.js";

let missionStore = null;
let locationService = null;
let onStorage = null;
let onMissionEvent = null;
let onMetaStorage = null;
let state = { payload: null, plan: null, meta: null };

function ensureStyles() {
  if (document.querySelector('link[href*="missione.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "nova://desktop/styles/missione.css";
  document.head.appendChild(link);
}

function targetsById() {
  return new Map(CATALOG.map((t) => [t.id, t]));
}

function applySchedule(items, missionDate, resetFirstStart = false) {
  const byId = targetsById();
  const sorted = [...items].sort((a, b) => a.order - b.order);
  if (resetFirstStart && sorted[0]) {
    const t = byId.get(sorted[0].targetId);
    sorted[0].plannedStart = t?.window?.start || sorted[0].plannedStart || "22:00";
  }
  return recalculateSchedule(sorted, byId, missionDate);
}

function reloadPlan() {
  const observer = locationService.getLocation();
  state.payload = missionStore.load();
  state.meta = loadMissionMeta();
  if (state.meta.missionDate && state.meta.missionDate !== state.payload.missionDate) {
    state.meta = {
      ...state.meta,
      sessionActive: false,
      sessionEnded: false,
      markedComplete: false,
      missionDate: state.payload.missionDate,
    };
  }
  state.plan = buildMissionPlan(observer, state.payload, CATALOG);
}

function persistMeta(patch) {
  state.meta = { ...loadMissionMeta(), ...patch, missionDate: state.payload.missionDate };
  saveMissionMeta(state.meta);
  notifySessionUpdated(state.meta);
}

function persistMission(items, missionDate) {
  state.payload = missionStore.save(items, missionDate || state.payload.missionDate);
  notifyMissionUpdated(state.payload);
  reloadPlan();
}

function renderEmpty(container, ctx) {
  container.innerHTML = `
    <section class="missione missione-empty">
      <div class="missione-empty-inner">
        <p class="missione-empty-kicker">Centro di controllo</p>
        <h2>Nessuna missione pianificata</h2>
        <p>Esplora la Mission Map e aggiungi i target che vuoi osservare questa sera.</p>
        <button type="button" class="missione-btn missione-btn-primary missione-btn-lg" data-goto-map>
          Apri Mission Map
        </button>
      </div>
    </section>
  `;
  container.querySelector("[data-goto-map]")?.addEventListener("click", () => ctx.navigate("mission-map"));
  renderAssistantPanel(ctx, null);
}

function renderSessionProgress(phase) {
  return `
    <nav class="missione-phases" aria-label="Stato sessione">
      ${SESSION_PHASES.map((p, i) => `
        <div class="missione-phase${i <= phase.index ? " is-active" : ""}${i === phase.index ? " is-current" : ""}">
          <span class="missione-phase-icon" aria-hidden="true">${p.icon}</span>
          <span class="missione-phase-label">${p.label}</span>
        </div>
        ${i < SESSION_PHASES.length - 1 ? '<span class="missione-phase-line" aria-hidden="true"></span>' : ""}
      `).join("")}
    </nav>
  `;
}

function renderCriticalities(criticalities) {
  if (!criticalities?.length) return "";
  const items = criticalities
    .map((c) => `<li class="missione-crit-${c.level}">${c.text}</li>`)
    .join("");
  return `
    <aside class="missione-critical">
      <h3>Criticità della missione</h3>
      <ul>${items}</ul>
    </aside>
  `;
}

function renderChecklist(meta) {
  const items = CHECKLIST_ITEMS.map((item) => {
    const checked = Boolean(meta.checklist?.[item.id]);
    return `
      <label class="missione-check${checked ? " is-done" : ""}">
        <input type="checkbox" data-check-id="${item.id}" ${checked ? "checked" : ""} />
        <span class="missione-check-box" aria-hidden="true"></span>
        <span>${item.label}</span>
      </label>
    `;
  }).join("");

  return `
    <section class="missione-checklist">
      <h3>Preparazione osservatorio</h3>
      <div class="missione-checklist-grid">${items}</div>
    </section>
  `;
}

function renderCinematicTimeline(steps) {
  const parts = [];
  steps.forEach((step, i) => {
    const t = step.target;
    const rec = recommendationLabel(step.recommendation);
    parts.push(`
      <article class="missione-leg" data-step-id="${t.id}" style="--cat:${step.category.color}">
        <div class="missione-leg-time">${step.plannedStart}</div>
        <div class="missione-leg-node" aria-hidden="true"></div>
        <div class="missione-leg-card">
          <div class="missione-leg-visual">
            <img src="${heroImageUrl(t.id)}" alt="" loading="lazy" onerror="this.style.opacity='0.15'" />
          </div>
          <div class="missione-leg-body">
            <div class="missione-leg-top">
              <div>
                <span class="missione-leg-code">${t.name}</span>
                <h4>${t.subtitle || t.category}</h4>
              </div>
              <span class="missione-rec missione-rec-${step.recommendation}">${rec}</span>
            </div>
            <p class="missione-leg-dur">Durata prevista · <strong>${formatDuration(step.durationMinutes)}</strong></p>
            <div class="missione-leg-controls">
              <div class="missione-dur-presets">
                ${DURATION_PRESETS.map(
                  (m) =>
                    `<button type="button" class="missione-dur-btn${step.durationMinutes === m ? " is-active" : ""}" data-dur="${m}" data-id="${t.id}">${m}′</button>`,
                ).join("")}
              </div>
              <div class="missione-leg-actions">
                <button type="button" class="missione-icon-btn" data-move-up data-id="${t.id}" ${i === 0 ? "disabled" : ""} title="Su">↑</button>
                <button type="button" class="missione-icon-btn" data-move-down data-id="${t.id}" ${i === steps.length - 1 ? "disabled" : ""} title="Giù">↓</button>
                <button type="button" class="missione-icon-btn missione-icon-danger" data-remove data-id="${t.id}" title="Rimuovi">×</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `);

    if (i < steps.length - 1) {
      const gapStart = step.plannedEnd;
      parts.push(`
        <div class="missione-leg-gap" aria-hidden="true">
          <span class="missione-leg-gap-line"></span>
          <span class="missione-leg-gap-label">${gapStart} · Cambio target</span>
          <span class="missione-leg-gap-arrow">↓</span>
        </div>
      `);
    }
  });
  return `<div class="missione-cinematic">${parts.join("")}</div>`;
}

function renderSummaryOverlay(summary) {
  if (!summary) return "";
  return `
    <div class="missione-summary-overlay" data-summary-overlay>
      <div class="missione-summary-card">
        <p class="missione-summary-kicker">Sessione completata</p>
        <h3>Riepilogo della notte</h3>
        <dl class="missione-summary-dl">
          <div><dt>Target osservati</dt><dd>${summary.observedNames.join(", ") || "—"}</dd></div>
          <div><dt>Durata pianificata</dt><dd>${summary.duration}</dd></div>
          <div><dt>Target saltati</dt><dd>${summary.skippedNames.length ? summary.skippedNames.join(", ") : "Nessuno"}</dd></div>
          <div><dt>Problemi riscontrati</dt><dd>${summary.problems.length ? summary.problems.join(" · ") : "Nessuno"}</dd></div>
        </dl>
        <button type="button" class="missione-btn missione-btn-primary" data-close-summary>Chiudi</button>
      </div>
    </div>
  `;
}

function renderAssistantPanel(ctx, plan, meta) {
  if (!ctx.panelBody) return;
  if (!plan?.steps?.length) {
    ctx.panelBody.innerHTML = `<p style="margin:0;color:var(--muted)">L'assistente ti guiderà quando avrai composto la missione.</p>`;
    return;
  }

  const now = new Date();
  const phase = computeSessionPhase(plan, meta, now);
  const remaining = remainingMinutes(plan, now);
  const next = nextTargetStep(plan, now);
  const message = buildAssistantMessage(plan, meta, now);

  ctx.panelBody.innerHTML = `
    <div class="nova-panel-section">
      <h3 style="color:var(--cyan);font-size:0.75rem;letter-spacing:0.06em">Assistente NovaSky</h3>
    </div>
    <div class="nova-panel-section">
      <div class="nova-panel-kv">
        <div><span>Stato missione</span><strong>${meta.sessionActive ? "In osservazione" : phase.label}</strong></div>
        <div><span>Tempo rimanente</span><strong>${formatDuration(remaining)}</strong></div>
        <div><span>Prossimo target</span><strong>${next?.target?.name || "—"}</strong></div>
      </div>
    </div>
    <div class="nova-panel-section">
      <h3>Suggerimento</h3>
      <p class="nova-assistant-voice">${message}</p>
    </div>
    <div class="nova-panel-section">
      <p style="margin:0;font-size:0.6875rem;color:var(--quiet)">Aggiornato ${plan.updatedAt ? new Date(plan.updatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
    </div>
  `;
}

function renderMission(container, ctx) {
  const plan = state.plan;
  const meta = state.meta;
  const phase = computeSessionPhase(plan, meta);
  const showSummary = meta.sessionSummary && meta.sessionEnded;

  const canStart = !meta.sessionActive && !meta.sessionEnded;
  const canEnd = meta.sessionActive && !meta.sessionEnded;

  container.innerHTML = `
    <section class="missione">
      <header class="missione-header">
        <div>
          <p class="missione-kicker">Centro di controllo</p>
          <h2>Missione di stanotte</h2>
          <p class="missione-sub">Piano osservativo della serata</p>
        </div>
        <div class="missione-header-stats">
          <span><strong>${plan.targetCount}</strong> target</span>
          <span><strong>${formatDuration(plan.totalMinutes)}</strong></span>
          <span>${plan.firstStart || "—"} → ${plan.lastEnd || "—"}</span>
        </div>
      </header>

      ${renderSessionProgress(phase)}

      ${canStart ? `<button type="button" class="missione-btn missione-btn-start" data-start-mission>Inizia missione</button>` : ""}
      ${canEnd ? `<button type="button" class="missione-btn missione-btn-end" data-end-mission>Concludi missione</button>` : ""}

      <article class="missione-briefing">
        <h3>Briefing della serata</h3>
        <p>${plan.eveningBriefing}</p>
      </article>

      ${renderCriticalities(plan.criticalities)}
      ${renderChecklist(meta)}
      ${renderCinematicTimeline(plan.steps)}

      <footer class="missione-actions">
        <button type="button" class="missione-btn missione-btn-ghost" data-goto-map>Mission Map</button>
        <button type="button" class="missione-btn missione-btn-ghost" data-optimize>Ottimizza ordine</button>
        <button type="button" class="missione-btn missione-btn-danger" data-clear>Svuota missione</button>
      </footer>

      ${renderSummaryOverlay(showSummary ? meta.sessionSummary : null)}
    </section>
  `;

  bindEvents(container, ctx);
  renderAssistantPanel(ctx, plan, meta);
}

function bindEvents(container, ctx) {
  container.querySelector("[data-goto-map]")?.addEventListener("click", () => ctx.navigate("mission-map"));

  container.querySelector("[data-start-mission]")?.addEventListener("click", () => {
    persistMeta({
      sessionActive: true,
      sessionStartedAt: new Date().toISOString(),
      sessionEnded: false,
      markedComplete: false,
      missionDate: state.payload.missionDate,
    });
    reloadPlan();
    render(container, ctx);
  });

  container.querySelector("[data-end-mission]")?.addEventListener("click", () => {
    const summary = buildSessionSummary(state.plan, state.meta);
    persistMeta({
      sessionActive: false,
      sessionEnded: true,
      sessionEndedAt: new Date().toISOString(),
      markedComplete: true,
      sessionSummary: summary,
      missionDate: state.payload.missionDate,
    });
    reloadPlan();
    render(container, ctx);
  });

  container.querySelector("[data-close-summary]")?.addEventListener("click", () => {
    container.querySelector("[data-summary-overlay]")?.remove();
  });

  container.querySelector("[data-clear]")?.addEventListener("click", () => {
    if (!window.confirm("Svuotare la missione di stanotte? Tutti i target verranno rimossi.")) return;
    missionStore.clear();
    clearMissionMeta();
    state.payload = missionStore.load();
    state.meta = loadMissionMeta();
    notifyMissionUpdated(state.payload);
    notifySessionUpdated(state.meta);
    render(container, ctx);
  });

  container.querySelector("[data-optimize]")?.addEventListener("click", () => {
    const optimized = optimizeMissionOrder(state.payload.items, targetsById());
    optimized.forEach((item, idx) => {
      item.order = idx;
    });
    persistMission(applySchedule(optimized, state.payload.missionDate, true), state.payload.missionDate);
    render(container, ctx);
  });

  container.querySelectorAll("[data-check-id]").forEach((input) => {
    input.addEventListener("change", () => {
      const checklist = { ...state.meta.checklist, [input.dataset.checkId]: input.checked };
      persistMeta({ checklist });
      input.closest(".missione-check")?.classList.toggle("is-done", input.checked);
    });
  });

  container.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => moveTarget(container, ctx, btn.dataset.id, -1));
  });
  container.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => moveTarget(container, ctx, btn.dataset.id, 1));
  });
  container.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeTarget(container, ctx, btn.dataset.id));
  });
  container.querySelectorAll("[data-dur]").forEach((btn) => {
    btn.addEventListener("click", () => setDuration(container, ctx, btn.dataset.id, Number(btn.dataset.dur)));
  });
}

function moveTarget(container, ctx, id, delta) {
  const items = [...state.payload.items].sort((a, b) => a.order - b.order);
  const idx = items.findIndex((i) => i.targetId === id);
  if (idx < 0) return;
  const next = idx + delta;
  if (next < 0 || next >= items.length) return;
  [items[idx], items[next]] = [items[next], items[idx]];
  items.forEach((item, i) => {
    item.order = i;
  });
  persistMission(applySchedule(items, state.payload.missionDate, true), state.payload.missionDate);
  render(container, ctx);
}

function removeTarget(container, ctx, id) {
  const items = state.payload.items.filter((i) => i.targetId !== id);
  items.forEach((item, i) => {
    item.order = i;
  });
  persistMission(applySchedule(items, state.payload.missionDate, items.length > 0), state.payload.missionDate);
  render(container, ctx);
}

function setDuration(container, ctx, id, minutes) {
  const items = state.payload.items.map((item) =>
    item.targetId === id ? { ...item, durationMinutes: minutes } : { ...item },
  );
  persistMission(applySchedule(items, state.payload.missionDate, false), state.payload.missionDate);
  render(container, ctx);
}

function render(container, ctx) {
  reloadPlan();
  if (!state.plan.steps.length) {
    renderEmpty(container, ctx);
    return;
  }
  renderMission(container, ctx);
}

export async function mountMissione(container, ctx) {
  ensureStyles();
  locationService = new LocationService();
  locationService.useDemo();
  missionStore = createMissionStore(CATALOG.map((t) => t.id));

  if (ctx.panelTitle) ctx.panelTitle.textContent = "Assistente NovaSky";

  container.innerHTML = `<p class="missione-loading">Preparazione del piano…</p>`;

  onStorage = (event) => {
    if (event.key === MISSION_STORAGE_KEY || event.key === MISSION_META_KEY) render(container, ctx);
  };
  onMissionEvent = () => render(container, ctx);
  onMetaStorage = () => render(container, ctx);
  window.addEventListener("storage", onStorage);
  window.addEventListener("novasky-mission-updated", onMissionEvent);
  window.addEventListener("novasky-session-updated", onMetaStorage);

  render(container, ctx);

  return { unmount: unmountMissione };
}

export function unmountMissione() {
  if (onStorage) window.removeEventListener("storage", onStorage);
  if (onMissionEvent) window.removeEventListener("novasky-mission-updated", onMissionEvent);
  if (onMetaStorage) window.removeEventListener("novasky-session-updated", onMetaStorage);
  onStorage = null;
  onMissionEvent = null;
  onMetaStorage = null;
  missionStore = null;
  locationService = null;
  state = { payload: null, plan: null, meta: null };
}
