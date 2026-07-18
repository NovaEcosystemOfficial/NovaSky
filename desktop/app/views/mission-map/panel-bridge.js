/**
 * Desktop-only: ponte tra card target, pannello destro e briefing.
 */

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readBriefing(root) {
  if (!root) return null;
  return {
    observing: root.querySelector("[data-briefing-observing]")?.textContent?.trim() || "",
    tonight: root.querySelector("[data-briefing-tonight]")?.textContent?.trim() || "",
    seestar: root.querySelector("[data-briefing-seestar]")?.textContent?.trim() || "",
    curiosity: root.querySelector("[data-briefing-curiosity]")?.textContent?.trim() || "",
    levels: root.querySelector("[data-briefing-levels]")?.innerHTML || "",
    identity: root.querySelector("[data-briefing-identity]")?.innerHTML || "",
  };
}

function renderPanelIdle(panelBody, redesign = false) {
  if (redesign) {
    panelBody.innerHTML = `
      <div class="nova-panel-section">
        <p style="margin:0;color:var(--quiet);font-size:0.8125rem;line-height:1.55">
          Seleziona un target nel cielo per aprire azimut, risultato atteso e briefing qui.
        </p>
      </div>
    `;
    return;
  }

  panelBody.innerHTML = `
    <div class="nova-panel-section">
      <div class="nova-panel-sync">
        <span class="nova-panel-sync-dot" aria-hidden="true"></span>
        <span>Missione sincronizzata · localStorage</span>
      </div>
    </div>
    <div class="nova-panel-section">
      <h3>Stato vista</h3>
      <div class="nova-panel-kv">
        <div><span>Vista</span><strong>Mission Map</strong></div>
        <div><span>Motore</span><strong>Condiviso</strong></div>
      </div>
    </div>
    <div class="nova-panel-section">
      <h3>Note operative</h3>
      <p style="margin:0;color:var(--quiet);font-size:0.8125rem;line-height:1.55">
        Seleziona un target nel cielo per aprire il briefing completo qui.
        Il pannello può essere chiuso per massimizzare l'area osservatorio.
      </p>
    </div>
  `;
}

function renderBriefingBlock(briefing, showBriefing) {
  if (!showBriefing || !briefing) {
    return `
      <div class="nova-panel-section">
        <p style="margin:0;color:var(--quiet);font-size:0.8125rem">Premi <strong style="color:var(--muted)">Dettagli</strong> sulla card per aprire il briefing completo.</p>
      </div>
    `;
  }

  return `
    <div class="nova-panel-section">
      <h3>Sky Briefing</h3>
      <div class="nova-panel-briefing">
        ${briefing.observing ? `<p><strong style="color:var(--text)">Osservazione</strong><br>${escapeHtml(briefing.observing)}</p>` : ""}
        ${briefing.tonight ? `<p><strong style="color:var(--text)">Stanotte</strong><br>${escapeHtml(briefing.tonight)}</p>` : ""}
        ${briefing.seestar ? `<p><strong style="color:var(--text)">Seestar</strong><br>${escapeHtml(briefing.seestar)}</p>` : ""}
        ${briefing.curiosity ? `<p><strong style="color:var(--text)">Curiosità</strong><br>${escapeHtml(briefing.curiosity)}</p>` : ""}
        ${briefing.levels ? `<div style="margin-top:8px">${briefing.levels}</div>` : ""}
      </div>
    </div>
  `;
}

function renderPanelTargetClassic(panelBody, cardRoot, missionCount, showBriefing) {
  const name = cardRoot.querySelector("[data-target-name]")?.textContent?.trim() || "—";
  const subtitle = cardRoot.querySelector("[data-target-subtitle]")?.textContent?.trim() || "—";
  const filter = cardRoot.querySelector("[data-target-filter]")?.textContent?.trim() || "—";
  const state = cardRoot.querySelector(".desktop-card-meta [data-target-state]")?.textContent?.trim() || "—";
  const alt = cardRoot.querySelector("[data-target-altitude]")?.textContent?.trim() || "—";
  const az = cardRoot.querySelector("[data-target-azimuth]")?.textContent?.trim() || "—";
  const moon = cardRoot.querySelector("[data-target-moon-sep]")?.textContent?.trim() || "—";
  const s50 = cardRoot.querySelector("[data-target-s50]")?.textContent?.trim() || "—";
  const s30 = cardRoot.querySelector("[data-target-s30]")?.textContent?.trim() || "—";
  const expectation = cardRoot.querySelector("[data-target-expectation]")?.textContent?.trim() || "";
  const briefingRoot = cardRoot.querySelector("[data-sky-briefing]");
  const briefing = readBriefing(briefingRoot);

  panelBody.innerHTML = `
    <div class="nova-panel-section">
      <div class="nova-panel-sync">
        <span class="nova-panel-sync-dot" aria-hidden="true"></span>
        <span>Missione · ${missionCount} target</span>
      </div>
    </div>
    <div class="nova-panel-section">
      <h3>${escapeHtml(name)}</h3>
      <p style="margin:0 0 10px;color:var(--muted);font-size:0.875rem">${escapeHtml(subtitle)}</p>
      <div class="nova-panel-kv">
        <div><span>Categoria</span><strong>${escapeHtml(filter)}</strong></div>
        <div><span>Stato</span><strong>${escapeHtml(state)}</strong></div>
        <div><span>Altezza</span><strong>${escapeHtml(alt)}</strong></div>
        <div><span>Azimut</span><strong>${escapeHtml(az)}</strong></div>
        <div><span>Luna</span><strong>${escapeHtml(moon)}</strong></div>
        <div><span>S50 / S30</span><strong>${escapeHtml(s50)} / ${escapeHtml(s30)}</strong></div>
      </div>
    </div>
    ${expectation ? `
      <div class="nova-panel-section">
        <h3>Risultato atteso</h3>
        <p style="margin:0;font-size:0.8125rem;line-height:1.55">${escapeHtml(expectation)}</p>
      </div>
    ` : ""}
    ${renderBriefingBlock(briefing, showBriefing)}
  `;
}

function renderPanelTargetRedesign(panelBody, cardRoot, missionCount, showBriefing) {
  const subtitle = cardRoot.querySelector("[data-target-subtitle]")?.textContent?.trim() || "—";
  const az = cardRoot.querySelector("[data-target-azimuth]")?.textContent?.trim() || "—";
  const moon = cardRoot.querySelector("[data-target-moon-sep]")?.textContent?.trim() || "—";
  const s50 = cardRoot.querySelector("[data-target-s50]")?.textContent?.trim() || "—";
  const s30 = cardRoot.querySelector("[data-target-s30]")?.textContent?.trim() || "—";
  const culmination = cardRoot.querySelector("[data-target-culmination]")?.textContent?.trim() || "—";
  const expectation = cardRoot.querySelector("[data-target-expectation]")?.textContent?.trim() || "";
  const briefingRoot = cardRoot.querySelector("[data-sky-briefing]");
  const briefing = readBriefing(briefingRoot);

  const deepKv = `
    <div class="nova-panel-kv nova-panel-kv--deep">
      <div><span>Luna</span><strong>${escapeHtml(moon)}</strong></div>
      <div><span>Culminazione</span><strong>${escapeHtml(culmination)}</strong></div>
      <div><span>S50 / S30</span><strong>${escapeHtml(s50)} / ${escapeHtml(s30)}</strong></div>
    </div>
  `;

  const briefingBlock = showBriefing && briefing
    ? `
      <div class="nova-panel-section">
        <h3>Briefing</h3>
        <div class="nova-panel-briefing">
          ${briefing.observing ? `<p>${escapeHtml(briefing.observing)}</p>` : ""}
          ${briefing.identity ? `<dl class="briefing-quick" style="margin:10px 0 0">${briefing.identity}</dl>` : ""}
          ${briefing.seestar ? `<p style="margin-top:10px"><strong style="color:var(--muted);font-size:0.6875rem">Seestar</strong><br>${escapeHtml(briefing.seestar)}</p>` : ""}
          ${briefing.curiosity ? `<p style="margin-top:10px"><strong style="color:var(--muted);font-size:0.6875rem">Curiosità</strong><br>${escapeHtml(briefing.curiosity)}</p>` : ""}
        </div>
      </div>
    `
    : `
      <div class="nova-panel-section">
        <p style="margin:0;color:var(--quiet);font-size:0.8125rem">Apri <strong style="color:var(--muted)">Dettagli →</strong> sulla card per il briefing completo.</p>
      </div>
    `;

  panelBody.innerHTML = `
    <div class="nova-panel-section">
      <p class="nova-panel-kicker">Dettagli profondi · ${missionCount} in missione</p>
      <h3 style="margin:4px 0 2px;font-size:0.75rem;color:var(--quiet);font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Azimut</h3>
      <p style="margin:0 0 14px;font-size:1.75rem;font-weight:700;font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--text)">${escapeHtml(az)}</p>
      <p style="margin:0 0 12px;color:var(--muted);font-size:0.875rem;line-height:1.4">${escapeHtml(subtitle)}</p>
      ${deepKv}
    </div>
    ${expectation ? `
      <div class="nova-panel-section">
        <h3>Risultato atteso</h3>
        <p style="margin:0;font-size:0.8125rem;line-height:1.55;color:var(--muted)">${escapeHtml(expectation)}</p>
      </div>
    ` : ""}
    ${briefingBlock}
  `;
}

function renderPanelTarget(panelBody, cardRoot, missionCount, showBriefing, redesign) {
  if (redesign) {
    renderPanelTargetRedesign(panelBody, cardRoot, missionCount, showBriefing);
  } else {
    renderPanelTargetClassic(panelBody, cardRoot, missionCount, showBriefing);
  }
}

/**
 * @param {import('nova://engine/scripts/mission-map/app.js').ObservatoryApp} app
 * @param {{ panelBody: HTMLElement, appEl: HTMLElement, redesign?: boolean }} ctx
 */
export function installPanelBridge(app, ctx) {
  const { panelBody, appEl, redesign = false } = ctx;
  if (!panelBody || !app) return () => {};

  const cardRoot = appEl.querySelector("[data-target-card]");
  const detailsBtn = appEl.querySelector("[data-desktop-details]");
  let showBriefing = false;

  renderPanelIdle(panelBody, redesign);

  const statusLabel = document.querySelector("[data-status-label]");
  const setStatus = (text) => {
    if (statusLabel) statusLabel.textContent = text;
  };

  const syncPanel = () => {
    const count = parseInt(appEl.querySelector("[data-mission-count]")?.textContent || "0", 10);
    const isOpen = cardRoot?.classList.contains("is-open");
    if (isOpen) {
      setStatus("Target selezionato");
      renderPanelTarget(panelBody, cardRoot, count, showBriefing, redesign);
    } else {
      showBriefing = false;
      setStatus(redesign ? "Pronto" : "Pronto");
      renderPanelIdle(panelBody, redesign);
    }
  };

  detailsBtn?.addEventListener("click", () => {
    showBriefing = true;
    const shell = appEl.closest(".nova-app");
    if (shell?.classList.contains("is-panel-collapsed")) {
      shell.classList.remove("is-panel-collapsed");
      document.querySelector("[data-panel-toggle]")?.setAttribute("aria-expanded", "true");
    }
    syncPanel();
  });

  const cardObserver = new MutationObserver(syncPanel);
  if (cardRoot) {
    cardObserver.observe(cardRoot, { attributes: true, attributeFilter: ["class", "hidden"] });
  }

  const missionObserver = new MutationObserver(syncPanel);
  const missionCountEl = appEl.querySelector("[data-mission-count]");
  if (missionCountEl) {
    missionObserver.observe(missionCountEl, { childList: true, characterData: true, subtree: true });
  }

  const briefingObserver = new MutationObserver(() => {
    if (showBriefing) syncPanel();
  });
  const briefingRoot = appEl.querySelector("[data-sky-briefing]");
  if (briefingRoot) {
    briefingObserver.observe(briefingRoot, { childList: true, subtree: true, characterData: true });
  }

  setStatus("Mission Map attiva");
  syncPanel();

  return () => {
    cardObserver.disconnect();
    missionObserver.disconnect();
    briefingObserver.disconnect();
  };
}
