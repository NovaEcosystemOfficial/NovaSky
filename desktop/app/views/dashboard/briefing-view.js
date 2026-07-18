import {
  esc,
  formatWindow,
  heroImageUrl,
  miniImageUrl,
  addTargetToMission,
  quickConnectSeestar,
  formatMountRa,
  formatMountDeg,
} from "./helpers.js";
import { deviceModeBadge } from "../../shared/device-registry.js";

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
    eq6,
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

  const eq6Mount = eq6?.telemetry?.mount;
  const eq6Live = eq6?.dataSource === "live" && eq6Mount?.liveState === "LIVE";
  const eq6Sim =
    simulationMode &&
    eq6?.dataSource === "simulated" &&
    ["connected", "operational"].includes(eq6?.connectionState);

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
              <h4>${
                seestar
                  ? esc(deviceModeBadge(seestar))
                  : simulationMode
                    ? "OFFLINE"
                    : "OFFLINE"
              }</h4>
              <p>${
                seestar
                  ? seestar.dataSource === "live" && seestar.telemetry?.mount?.liveState === "LIVE"
                    ? `LIVE · ${esc(seestar.telemetry.mount.name || seestar.customName)}`
                    : seestar.dataSource === "simulated"
                      ? `SIM · ${esc(seestar.customName)}`
                      : esc(seestar.customName)
                  : simulationMode
                    ? "SIM pronta — collega in Device Hub"
                    : "LIVE — collega S30 Pro (hotspot)"
              }</p>
              ${
                seestar?.dataSource === "live" && seestar.telemetry?.mount?.liveState === "LIVE"
                  ? `<p class="dash-live-metrics">RA ${esc(formatMountRa(seestar.telemetry.mount.ra))} · Dec ${esc(formatMountDeg(seestar.telemetry.mount.dec))} · Alt ${esc(formatMountDeg(seestar.telemetry.mount.altitude))} · Az ${esc(formatMountDeg(seestar.telemetry.mount.azimuth))}</p>
                     <p class="dash-live-metrics">track ${seestar.telemetry.mount.tracking ? "on" : "off"} · slew ${seestar.telemetry.mount.slewing ? "on" : "off"} · park ${seestar.telemetry.mount.atPark ? "yes" : "no"}</p>`
                  : ""
              }
            </article>
            <article class="dash-mini-card">
              <span class="dash-card-label">Montatura EQ6</span>
              <h4>${eq6 ? esc(deviceModeBadge(eq6)) : "OFFLINE"}</h4>
              <p>${
                eq6Live
                  ? `LIVE · EQMOD · ${esc(eq6Mount.comPort || "COM3")}`
                  : eq6Sim
                    ? `SIM · ${esc(eq6.customName || "EQ6")}`
                    : eq6
                      ? esc(eq6.customName || "EQ6-R Pro")
                      : simulationMode
                        ? "SIM — collega in Device Hub"
                        : "LIVE — EQMOD su COM3"
              }</p>
              ${
                eq6Live
                  ? `<p class="dash-live-metrics">AR ${esc(formatMountRa(eq6Mount.ra))} · DEC ${esc(formatMountDeg(eq6Mount.dec))}</p>
                     <p class="dash-live-metrics">ALT ${esc(formatMountDeg(eq6Mount.altitude))} · AZ ${esc(formatMountDeg(eq6Mount.azimuth))}</p>
                     <p class="dash-live-metrics">track ${eq6Mount.tracking ? "sì" : "no"} · slew ${eq6Mount.slewing ? "sì" : "no"} · park ${eq6Mount.atPark ? "sì" : "no"} · pier ${esc(eq6Mount.sideOfPier == null ? "—" : String(eq6Mount.sideOfPier))}</p>
                     <p class="dash-live-metrics">agg. ${esc(eq6Mount.lastPollAt ? new Date(eq6Mount.lastPollAt).toLocaleTimeString() : "—")}</p>
                     ${eq6Mount.siteWarning ? `<p class="dash-live-metrics">⚠ Coordinate sito EQMOD da verificare</p>` : ""}`
                  : ""
              }
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
    const btn = container.querySelector("[data-connect-seestar]");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Connessione…";
    }
    const result = await quickConnectSeestar();
    if (btn) btn.disabled = false;
    if (!result.ok && result.error) {
      if (btn) btn.textContent = "Riprova LIVE";
      window.alert(result.error);
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
