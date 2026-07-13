import {
  esc,
  formatWindow,
  heroImageUrl,
  miniImageUrl,
  addTargetToMission,
  quickConnectSeestar,
} from "./helpers.js";

function renderChips(chips, ctx) {
  if (!chips.length) return "";
  return `
    <div class="dash-chips" aria-label="Target stanotte">
      ${chips
        .map(
          (t) => `
        <button type="button" class="dash-chip" data-open-target="${t.id}" title="${esc(t.subtitle)}">
          <span>${esc(t.name)}</span>
          <em>${t.novaScore ?? "—"}</em>
        </button>`
        )
        .join("")}
    </div>
  `;
}

export function renderBriefingView(container, ctx, data, missionStore) {
  const {
    session,
    target,
    chips,
    nightStatus,
    mission,
    meta,
    plan,
    phase,
    moon,
    isDemo,
    observerLabel,
    twilight,
    windowCountdown,
    connectedCount,
    deviceTotal,
    setupLabel,
    deviceHubLabel,
    simulationMode,
    seestar,
  } = data;

  const missionLabel =
    mission.items.length === 0
      ? "Nessuna missione composta"
      : meta?.sessionActive
        ? `${mission.items.length} target · in osservazione`
        : `${mission.items.length} target · salvata oggi`;

  const firstMissionTarget =
    mission.items.length > 0
      ? plan.steps[0]?.target?.name || mission.items[0].targetId
      : null;

  container.innerHTML = `
    <section class="dash dash-v2 dash-briefing" data-dash-mode="briefing">
      <header class="dash-topbar">
        <div class="dash-topbar-main">
          <p class="dash-kicker">Stato della notte</p>
          <div class="dash-topbar-line">
            <h2 class="dash-verdict-main">${esc(session.meta?.verdict || "Calcolo del cielo completato.")}</h2>
            ${isDemo ? '<span class="dash-pill dash-pill-demo">DEMO</span>' : ""}
            <span class="dash-pill dash-pill-status dash-status dash-status-${nightStatus.tone}">${esc(nightStatus.status)}</span>
          </div>
        </div>
        <div class="dash-topbar-meta">
          <span>Crepuscolo ${esc(twilight)}</span>
          <span class="dash-moon-inline">${esc(phase.phaseName || "—")} · ${phase.illuminationPct != null ? `${Math.round(phase.illuminationPct)}%` : "—"}</span>
        </div>
      </header>

      <div class="dash-layout">
        <div class="dash-main-col">
          <article class="dash-hero-card">
            <div class="dash-hero-thumb">
              <img src="${heroImageUrl(target.id)}" alt="" loading="lazy" onerror="this.style.opacity='0.2'" />
            </div>
            <div class="dash-hero-body">
              <span class="dash-card-label">Target stanotte</span>
              <h3>${esc(target.name)} · ${esc(target.subtitle || "")}</h3>
              <p class="dash-hero-reason">${esc(target.reason || "Condizioni in aggiornamento.")}</p>
              <p class="dash-hero-metrics">${Math.round(target.alt)}° · ${formatWindow(target.window)} · Score ${target.novaScore ?? "—"}</p>
              <div class="dash-hero-actions">
                <button type="button" class="dash-btn dash-btn-primary" data-add-target="${target.id}">Aggiungi alla missione</button>
                <button type="button" class="dash-btn dash-btn-ghost" data-goto="mission-map">Apri nel cielo</button>
              </div>
            </div>
          </article>

          ${renderChips(chips, ctx)}

          <div class="dash-metrics-row">
            <article class="dash-mini-card">
              <span class="dash-card-label">Missione</span>
              <h4>${mission.items.length} target</h4>
              <p>${esc(firstMissionTarget ? `${firstMissionTarget} in lista` : missionLabel)}</p>
            </article>
            <article class="dash-mini-card">
              <span class="dash-card-label">Luna</span>
              <h4>${esc(phase.phaseName || "—")}</h4>
              <p>${phase.illuminationPct != null ? `${Math.round(phase.illuminationPct)}%` : "—"} · alt ${Math.round(moon.alt)}°</p>
            </article>
            <article class="dash-mini-card">
              <span class="dash-card-label">Attrezzatura</span>
              <h4>${connectedCount}/${deviceTotal}</h4>
              <p>${esc(deviceHubLabel || setupLabel)}</p>
            </article>
            <article class="dash-mini-card">
              <span class="dash-card-label">Seestar</span>
              <h4>${seestar ? "Online" : "Offline"}</h4>
              <p>${seestar ? esc(seestar.customName) : simulationMode ? "Pronto al collegamento" : "Simulazione disattiva"}</p>
            </article>
          </div>
        </div>

        <aside class="dash-side-card">
          <span class="dash-card-label">Prossima azione</span>
          <p class="dash-side-countdown">Finestra apre tra <strong>${esc(windowCountdown)}</strong></p>
          <p class="dash-side-hint">Miglior momento per ${esc(target.name)}: ${esc(target.window?.start || "—")}</p>
          <button type="button" class="dash-btn dash-btn-primary dash-btn-block" data-goto="mission-map">Vai alla Mission Map</button>
          ${
            mission.items.length
              ? `<button type="button" class="dash-btn dash-btn-outline dash-btn-block" data-goto="missione">Continua missione (${mission.items.length})</button>`
              : ""
          }
          ${
            !seestar
              ? `<button type="button" class="dash-btn dash-btn-outline dash-btn-block" data-connect-seestar>Collega Seestar</button>`
              : ""
          }
        </aside>
      </div>
    </section>
  `;

  bindBriefingEvents(container, ctx, missionStore);
}

function bindBriefingEvents(container, ctx, missionStore) {
  container.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => ctx.navigate(btn.dataset.goto));
  });

  container.querySelectorAll("[data-open-target]").forEach((btn) => {
    btn.addEventListener("click", () => ctx.navigate("mission-map"));
  });

  container.querySelector("[data-add-target]")?.addEventListener("click", (e) => {
    const id = e.currentTarget.dataset.addTarget;
    addTargetToMission(id, missionStore);
  });

  container.querySelector("[data-connect-seestar]")?.addEventListener("click", async () => {
    const result = await quickConnectSeestar();
    if (result.reason === "need_simulation") {
      ctx.navigate("attrezzatura");
    }
  });
}

export function renderBriefingPanel(panelBody, data) {
  if (!panelBody) return;
  const { plan, target, observerLabel, twilight } = data;
  panelBody.innerHTML = `
    <div class="nova-panel-section">
      <h3>Briefing stanotte</h3>
      <p style="margin:0;font-size:0.8125rem;line-height:1.55;color:var(--muted)">${esc(plan.eveningBriefing || "Componi la missione dalla Mission Map.")}</p>
    </div>
    <div class="nova-panel-section">
      <h3>Target in evidenza</h3>
      <p style="margin:0 0 8px;font-weight:600">${esc(target.name)}</p>
      <p style="margin:0;font-size:0.8125rem;color:var(--quiet)">${esc(target.subtitle || "")}</p>
      <div class="nova-panel-kv" style="margin-top:10px">
        <div><span>Finestra</span><strong>${esc(formatWindow(target.window))}</strong></div>
        <div><span>Posizione</span><strong>${esc(observerLabel)}</strong></div>
        <div><span>Crepuscolo</span><strong>${esc(twilight)}</strong></div>
      </div>
    </div>
  `;
}
