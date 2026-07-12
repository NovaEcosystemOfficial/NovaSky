import { CATALOG } from "nova://engine/scripts/mission-map/data/catalog.js";
import { LocationService } from "nova://engine/scripts/mission-map/services/location-service.js";
import {
  createMissionStore,
  MISSION_STORAGE_KEY,
  localDateString,
} from "nova://engine/scripts/mission-map/services/mission-store.js";
import {
  buildMissionPlan,
  recalculateSchedule,
  optimizeMissionOrder,
  computeMissionStatus,
  formatDuration,
  recommendationLabel,
  notifyMissionUpdated,
  loadMissionMeta,
  saveMissionMeta,
  clearMissionMeta,
  heroImageUrl,
  DURATION_PRESETS,
} from "../shared/mission-plan.js";

let missionStore = null;
let locationService = null;
let onStorage = null;
let onMissionEvent = null;
let state = {
  payload: null,
  plan: null,
  meta: null,
  dirty: false,
};

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
  state.plan = buildMissionPlan(observer, state.payload, CATALOG);
}

function persistMission(items, missionDate) {
  state.payload = missionStore.save(items, missionDate || state.payload.missionDate);
  state.dirty = false;
  notifyMissionUpdated(state.payload);
  reloadPlan();
}

function renderEmpty(container, ctx) {
  container.innerHTML = `
    <section class="missione missione-empty">
      <div class="missione-empty-inner">
        <p class="missione-empty-kicker">Missione di stanotte</p>
        <h2>NESSUNA MISSIONE PIANIFICATA</h2>
        <p>Esplora la Mission Map e aggiungi i target che vuoi osservare questa sera.</p>
        <button type="button" class="missione-btn missione-btn-primary" data-goto-map>
          Apri Mission Map
        </button>
      </div>
    </section>
  `;
  container.querySelector("[data-goto-map]")?.addEventListener("click", () => ctx.navigate("mission-map"));

  if (ctx.panelBody) {
    ctx.panelBody.innerHTML = `
      <div class="nova-panel-section">
        <h3>Stato</h3>
        <p style="margin:0;color:var(--muted)">Nessuna missione attiva.</p>
      </div>
      <div class="nova-panel-section">
        <button type="button" class="missione-btn missione-btn-ghost missione-btn-block" data-goto-map-panel>
          Apri Mission Map
        </button>
      </div>
    `;
    ctx.panelBody.querySelector("[data-goto-map-panel]")?.addEventListener("click", () => ctx.navigate("mission-map"));
  }
}

function statusClass(status) {
  const map = {
    "Nessuna missione": "is-none",
    "In preparazione": "is-prep",
    Pronta: "is-ready",
    "In corso": "is-live",
    Completata: "is-done",
  };
  return map[status] || "is-prep";
}

function renderPanel(ctx, plan, status) {
  if (!ctx.panelBody) return;
  const critical = plan.warnings.filter((w) => w.level === "error" || w.level === "warn");
  const criticalTargets = [...new Set(plan.steps.filter((s) => s.warnings.length).map((s) => s.target?.name))];

  ctx.panelBody.innerHTML = `
    <div class="nova-panel-section">
      <div class="nova-panel-sync">
        <span class="nova-panel-sync-dot" aria-hidden="true"></span>
        <span>${state.dirty ? "Modifiche da salvare" : "Salvato automaticamente"}</span>
      </div>
    </div>
    <div class="nova-panel-section">
      <h3>Riepilogo</h3>
      <div class="nova-panel-kv">
        <div><span>Target</span><strong>${plan.targetCount}</strong></div>
        <div><span>Durata totale</span><strong>${formatDuration(plan.totalMinutes)}</strong></div>
        <div><span>Inizio</span><strong>${plan.firstStart || "—"}</strong></div>
        <div><span>Fine prevista</span><strong>${plan.lastEnd || "—"}</strong></div>
        <div><span>Qualità</span><strong>${plan.quality}</strong></div>
        <div><span>Stato</span><strong>${status}</strong></div>
      </div>
    </div>
    ${
      criticalTargets.length
        ? `<div class="nova-panel-section"><h3>Target critici</h3><p style="margin:0;font-size:0.8125rem;color:var(--amber)">${criticalTargets.join(", ")}</p></div>`
        : ""
    }
    <div class="nova-panel-section">
      <h3>Suggerimento NovaSky</h3>
      <p class="nova-panel-briefing" style="margin:0">${plan.suggestion}</p>
    </div>
    <div class="nova-panel-section">
      <h3>Ultimo aggiornamento</h3>
      <p style="margin:0;font-size:0.75rem;color:var(--quiet)">${
        plan.updatedAt ? new Date(plan.updatedAt).toLocaleString("it-IT") : "—"
      }</p>
    </div>
  `;
}

function renderWarnings(warnings) {
  if (!warnings.length) return "";
  const items = warnings
    .slice(0, 6)
    .map(
      (w) =>
        `<li class="missione-warn missione-warn-${w.level}">${w.text}</li>`,
    )
    .join("");
  return `<ul class="missione-warnings" aria-label="Avvisi piano">${items}</ul>`;
}

function renderStepCard(step, total) {
  const t = step.target;
  const rec = recommendationLabel(step.recommendation);
  const recClass = step.recommendation || "possible";
  const win =
    t.window?.start && t.window?.end ? `${t.window.start}–${t.window.end}` : "—";
  const moon =
    t.moonSeparation != null ? `${Math.round(t.moonSeparation)}°` : "—";
  const alt =
    step.altAtStart != null ? `${Math.round(step.altAtStart)}°` : "—";

  const presetBtns = DURATION_PRESETS.map(
    (m) =>
      `<button type="button" class="missione-dur-btn${step.durationMinutes === m ? " is-active" : ""}" data-dur="${m}" data-id="${t.id}">${m}</button>`,
  ).join("");

  return `
    <article class="missione-step" data-step-id="${t.id}" style="--cat:${step.category.color}">
      <div class="missione-step-rail">
        <span class="missione-step-time">${step.plannedStart}</span>
        <span class="missione-step-end">→ ${step.plannedEnd}</span>
      </div>
      <div class="missione-step-card">
        <div class="missione-step-thumb">
          <img src="${heroImageUrl(t.id)}" alt="" loading="lazy" onerror="this.style.opacity='0.2'" />
        </div>
        <div class="missione-step-body">
          <div class="missione-step-head">
            <span class="missione-step-code">${t.name}</span>
            <span class="missione-rec missione-rec-${recClass}">${rec}</span>
          </div>
          <h3>${t.subtitle || t.category || "—"}</h3>
          <p class="missione-step-cat">${t.category || "—"}</p>
          <dl class="missione-step-meta">
            <div><dt>Durata</dt><dd>${formatDuration(step.durationMinutes)}</dd></div>
            <div><dt>Finestra</dt><dd>${win}</dd></div>
            <div><dt>Altezza prev.</dt><dd>${alt}</dd></div>
            <div><dt>Luna</dt><dd>${moon}</dd></div>
            <div><dt>S50</dt><dd>${t.seestar?.s50 || "—"}</dd></div>
            <div><dt>S30 Pro</dt><dd>${t.seestar?.s30 || "—"}</dd></div>
          </dl>
          ${step.warnings.length ? `<ul class="missione-step-warns">${step.warnings.map((w) => `<li>${w.text}</li>`).join("")}</ul>` : ""}
          <div class="missione-dur-presets" aria-label="Durata rapida">${presetBtns}</div>
          <label class="missione-dur-custom">
            <span>Personalizzata</span>
            <input type="number" min="5" max="300" step="5" value="${step.durationMinutes}" data-custom-dur data-id="${t.id}" />
            <span>min</span>
          </label>
        </div>
        <div class="missione-step-actions">
          <button type="button" class="missione-icon-btn" data-move-up data-id="${t.id}" ${step.index === 0 ? "disabled" : ""} title="Sposta su">↑</button>
          <button type="button" class="missione-icon-btn" data-move-down data-id="${t.id}" ${step.index === total - 1 ? "disabled" : ""} title="Sposta giù">↓</button>
          <button type="button" class="missione-icon-btn missione-icon-danger" data-remove data-id="${t.id}" title="Rimuovi">×</button>
        </div>
      </div>
    </article>
  `;
}

function renderMission(container, ctx) {
  const plan = state.plan;
  const status = computeMissionStatus(plan, new Date(), state.meta);

  container.innerHTML = `
    <section class="missione">
      <header class="missione-header">
        <div>
          <p class="missione-kicker">Missione di stanotte</p>
          <h2>Piano osservativo della serata</h2>
        </div>
        <span class="missione-status ${statusClass(status)}">${status}</span>
      </header>

      <div class="missione-summary">
        <div><span>Target</span><strong>${plan.targetCount}</strong></div>
        <div><span>Durata totale</span><strong>${formatDuration(plan.totalMinutes)}</strong></div>
        <div><span>Inizio</span><strong>${plan.firstStart || "—"}</strong></div>
        <div><span>Fine prevista</span><strong>${plan.lastEnd || "—"}</strong></div>
        <div><span>Qualità</span><strong>${plan.quality}</strong></div>
        <div><span>Stato</span><strong>${status}</strong></div>
      </div>

      <aside class="missione-suggestion">
        <h3>Suggerimento NovaSky</h3>
        <p>${plan.suggestion}</p>
      </aside>

      ${renderWarnings(plan.warnings)}

      <div class="missione-timeline" data-timeline>
        ${plan.steps.map((s) => renderStepCard(s, plan.steps.length)).join("")}
      </div>

      <footer class="missione-actions">
        <button type="button" class="missione-btn missione-btn-ghost" data-goto-map>Apri Mission Map</button>
        <button type="button" class="missione-btn missione-btn-ghost" data-optimize>Ottimizza ordine</button>
        <button type="button" class="missione-btn missione-btn-ghost" data-save>Salva piano</button>
        <button type="button" class="missione-btn missione-btn-ghost" data-complete>Segna completata</button>
        <button type="button" class="missione-btn missione-btn-danger" data-clear>Svuota missione</button>
      </footer>
    </section>
  `;

  bindEvents(container, ctx);
  renderPanel(ctx, plan, status);
}

function bindEvents(container, ctx) {
  container.querySelector("[data-goto-map]")?.addEventListener("click", () => ctx.navigate("mission-map"));

  container.querySelector("[data-save]")?.addEventListener("click", () => {
    persistMission(state.payload.items, state.payload.missionDate);
    render(container, ctx);
  });

  container.querySelector("[data-complete]")?.addEventListener("click", () => {
    saveMissionMeta({ markedComplete: true, missionDate: state.payload.missionDate });
    state.meta = loadMissionMeta();
    render(container, ctx);
  });

  container.querySelector("[data-clear]")?.addEventListener("click", () => {
    if (!window.confirm("Svuotare la missione di stanotte? Tutti i target verranno rimossi.")) return;
    missionStore.clear();
    clearMissionMeta();
    state.payload = missionStore.load();
    state.meta = loadMissionMeta();
    notifyMissionUpdated(state.payload);
    render(container, ctx);
  });

  container.querySelector("[data-optimize]")?.addEventListener("click", () => {
    const optimized = optimizeMissionOrder(state.payload.items, targetsById());
    optimized.forEach((item, idx) => {
      item.order = idx;
    });
    const scheduled = applySchedule(optimized, state.payload.missionDate, true);
    persistMission(scheduled, state.payload.missionDate);
    render(container, ctx);
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
    btn.addEventListener("click", () =>
      setDuration(container, ctx, btn.dataset.id, Number(btn.dataset.dur)),
    );
  });
  container.querySelectorAll("[data-custom-dur]").forEach((input) => {
    input.addEventListener("change", () => {
      const val = Math.max(5, Math.min(300, Number(input.value) || 45));
      setDuration(container, ctx, input.dataset.id, val);
    });
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
  const scheduled = applySchedule(items, state.payload.missionDate, true);
  persistMission(scheduled, state.payload.missionDate);
  render(container, ctx);
}

function removeTarget(container, ctx, id) {
  const items = state.payload.items.filter((i) => i.targetId !== id);
  items.forEach((item, i) => {
    item.order = i;
  });
  const scheduled = applySchedule(items, state.payload.missionDate, items.length > 0);
  persistMission(scheduled, state.payload.missionDate);
  render(container, ctx);
}

function setDuration(container, ctx, id, minutes) {
  const items = state.payload.items.map((item) =>
    item.targetId === id ? { ...item, durationMinutes: minutes } : { ...item },
  );
  const scheduled = applySchedule(items, state.payload.missionDate, false);
  persistMission(scheduled, state.payload.missionDate);
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

  container.innerHTML = `<p class="missione-loading">Caricamento piano…</p>`;

  onStorage = (event) => {
    if (event.key !== MISSION_STORAGE_KEY) return;
    render(container, ctx);
  };
  onMissionEvent = () => render(container, ctx);
  window.addEventListener("storage", onStorage);
  window.addEventListener("novasky-mission-updated", onMissionEvent);

  render(container, ctx);

  return { unmount: unmountMissione };
}

export function unmountMissione() {
  if (onStorage) window.removeEventListener("storage", onStorage);
  if (onMissionEvent) window.removeEventListener("novasky-mission-updated", onMissionEvent);
  onStorage = null;
  onMissionEvent = null;
  missionStore = null;
  locationService = null;
  state = { payload: null, plan: null, meta: null, dirty: false };
}
