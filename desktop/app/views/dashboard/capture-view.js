import {
  esc,
  formatWindow,
  heroImageUrl,
  targetFromCatalog,
} from "./helpers.js";
import {
  getCaptureState,
  setCaptureTarget,
  startCapture,
  stopCapture,
  gotoTarget,
  capturePhaseLabel,
} from "../../shared/seestar-capture.js";

export function renderCaptureView(container, ctx, data, captureState) {
  const { seestar, mission, meta, plan, simulationMode, activeTarget } = data;
  const targetId = captureState.targetId;
  const catalogTarget = targetFromCatalog(targetId);
  const target = activeTarget || catalogTarget;
  const targetName = target?.name || targetId || "—";
  const targetSubtitle = target?.subtitle || "";
  const battery = seestar?.telemetry?.power?.batteryPct ?? "—";
  const progress =
    captureState.phase === "capturing"
      ? Math.round((captureState.frameCount / captureState.totalFrames) * 100)
      : captureState.phase === "stacking"
        ? 96
        : captureState.phase === "complete"
          ? 100
          : 0;

  const missionStep =
    plan.steps.length > 0
      ? plan.steps.find((s) => s.item.targetId === targetId) || plan.steps[0]
      : null;
  const stepIndex = missionStep ? missionStep.index + 1 : 0;
  const stepTotal = plan.steps.length;

  container.innerHTML = `
    <section class="dash dash-v2 dash-capture" data-dash-mode="capture">
      <header class="dash-capture-bar">
        <div>
          <p class="dash-kicker">Seestar · live</p>
          <h2 class="dash-capture-title">${esc(seestar?.customName || "Seestar")} <span class="dash-live-dot" aria-hidden="true"></span></h2>
        </div>
        <div class="dash-capture-stats">
          <span>Batteria <strong>${battery}%</strong></span>
          <span>${esc(capturePhaseLabel(captureState.phase))}</span>
          ${simulationMode ? '<span class="dash-pill dash-pill-demo">SIM</span>' : ""}
        </div>
        <button type="button" class="dash-btn dash-btn-ghost" data-disconnect-view>Disconnetti</button>
      </header>

      <div class="dash-capture-layout">
        <div class="dash-live-wrap">
          <div class="dash-live-view" data-live-view>
            <img src="${heroImageUrl(targetId)}" alt="" class="dash-live-img" onerror="this.style.opacity='0.15'" />
            <div class="dash-live-overlay">
              <span class="dash-live-badge">${captureState.phase === "capturing" ? "REC" : "LIVE"}</span>
              ${simulationMode ? '<span class="dash-live-sim">Anteprima simulata</span>' : ""}
            </div>
          </div>
          <div class="dash-live-target">
            <h3>${esc(targetName)}</h3>
            <p>${esc(targetSubtitle)}</p>
            ${
              target
                ? `<p class="dash-live-metrics">${Math.round(target.alt || 0)}° · ${formatWindow(target.window)} · Score ${target.novaScore ?? "—"}</p>`
                : ""
            }
          </div>
          ${
            captureState.phase === "capturing" || captureState.phase === "stacking"
              ? `
            <div class="dash-progress">
              <div class="dash-progress-bar" style="width:${progress}%"></div>
            </div>
            <p class="dash-progress-label">${captureState.phase === "stacking" ? "Stacking in corso…" : `Frame ${captureState.frameCount} / ${captureState.totalFrames}`}</p>
          `
              : ""
          }
          <div class="dash-capture-controls">
            <button type="button" class="dash-btn dash-btn-outline" data-goto-target ${!targetId ? "disabled" : ""}>GOTO</button>
            ${
              captureState.phase === "capturing"
                ? '<button type="button" class="dash-btn dash-btn-danger" data-stop-capture>Stop</button>'
                : '<button type="button" class="dash-btn dash-btn-primary" data-start-capture>Avvia cattura</button>'
            }
            <button type="button" class="dash-btn dash-btn-ghost" data-goto="missione">Missione</button>
          </div>
        </div>

        <aside class="dash-capture-side">
          <div class="nova-panel-section">
            <h3>Prossima azione</h3>
            ${
              mission.items.length
                ? `<p style="margin:0 0 8px;font-size:0.875rem">Step ${stepIndex}/${stepTotal} · ${esc(missionStep?.target?.name || "")}</p>`
                : `<p style="margin:0;font-size:0.8125rem;color:var(--quiet)">Nessun target in missione — scegli dal cielo.</p>`
            }
            <button type="button" class="dash-btn dash-btn-outline dash-btn-block" data-goto="mission-map">Mission Map</button>
          </div>
          ${
            plan.steps.length > 1
              ? `
            <div class="nova-panel-section">
              <h3>Coda missione</h3>
              <ul class="dash-mission-queue">
                ${plan.steps
                  .map(
                    (s) => `
                  <li>
                    <button type="button" class="dash-queue-btn" data-queue-target="${s.item.targetId}">
                      <span>${esc(s.target?.name)}</span>
                      <em>${esc(s.plannedStart)}</em>
                    </button>
                  </li>`
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
          ${
            meta?.sessionActive
              ? `<p class="dash-side-note">Sessione attiva — dettagli e checklist in Missione.</p>`
              : ""
          }
          <p class="dash-side-note">${esc(data.deviceHubLabel || "")}</p>
        </aside>
      </div>
    </section>
  `;

  bindCaptureEvents(container, ctx, data, captureState);
}

function bindCaptureEvents(container, ctx, data, captureState) {
  const { seestar } = data;

  container.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => ctx.navigate(btn.dataset.goto));
  });

  container.querySelector("[data-disconnect-view]")?.addEventListener("click", () => {
    ctx.navigate("attrezzatura");
  });

  container.querySelector("[data-start-capture]")?.addEventListener("click", () => {
    startCapture({
      targetId: captureState.targetId,
      deviceId: seestar?.id,
      simulated: data.simulationMode,
    });
    ctx.onCaptureChange?.();
  });

  container.querySelector("[data-stop-capture]")?.addEventListener("click", () => {
    stopCapture();
    ctx.onCaptureChange?.();
  });

  container.querySelector("[data-goto-target]")?.addEventListener("click", async () => {
    if (!captureState.targetId) return;
    await gotoTarget(captureState.targetId, seestar?.id);
    ctx.onCaptureChange?.();
  });

  container.querySelectorAll("[data-queue-target]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.queueTarget;
      setCaptureTarget(id, seestar?.id);
      await gotoTarget(id, seestar?.id);
      ctx.onCaptureChange?.();
    });
  });
}

export function renderCapturePanel(panelBody, data, captureState) {
  if (!panelBody) return;
  const target = targetFromCatalog(captureState.targetId);
  panelBody.innerHTML = `
    <div class="nova-panel-section">
      <h3>Cattura Seestar</h3>
      <p style="margin:0;font-size:0.8125rem;line-height:1.55;color:var(--muted)">
        ${esc(capturePhaseLabel(captureState.phase))}
        ${data.simulationMode ? " · modalità simulazione" : ""}
      </p>
    </div>
    <div class="nova-panel-section">
      <h3>Target</h3>
      <p style="margin:0;font-weight:600">${esc(target?.name || "—")}</p>
      <p style="margin:8px 0 0;font-size:0.8125rem;color:var(--quiet)">${esc(target?.expectation || target?.reason || "")}</p>
    </div>
  `;
}
