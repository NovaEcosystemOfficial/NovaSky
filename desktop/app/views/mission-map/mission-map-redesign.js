/**
 * Desktop-only: bridge UI compatto Mission Map (metriche inline, pill DEMO, toggle layout).
 */

import { toggleMissionMapRedesign, isMissionMapRedesignEnabled } from "../../shared/ui-preferences.js";

function syncInlineMetrics(cardRoot) {
  const out = cardRoot?.querySelector("[data-mm-inline-metrics]");
  if (!out) return;

  const alt = cardRoot.querySelector("[data-target-altitude]")?.textContent?.trim() || "—";
  const mag = cardRoot.querySelector("[data-target-magnitude]")?.textContent?.trim() || "—";
  const window = cardRoot.querySelector("[data-target-window]")?.textContent?.trim() || "—";
  const score = cardRoot.querySelector("[data-target-score]")?.textContent?.trim() || "—";

  const magLabel = mag === "—" ? "—" : `mag ${mag}`;
  const scoreLabel = score === "—" ? "—" : `Score ${score}`;

  out.textContent = `${alt} · ${magLabel} · ${window} · ${scoreLabel}`;
}

function syncDemoPill(root) {
  const pill = root.querySelector("[data-mm-demo-pill]");
  const location = root.querySelector("[data-location]")?.textContent?.trim() || "";
  if (!pill) return;
  const isDemo = /demo/i.test(location);
  pill.hidden = !isDemo;
}

function syncLayoutToggle(root) {
  const btn = root.querySelector("[data-mm-layout-toggle]");
  if (!btn) return;
  btn.textContent = isMissionMapRedesignEnabled()
    ? "Layout classico"
    : "Layout compatto (beta)";
}

/**
 * @param {HTMLElement} appEl
 * @param {{ onLayoutToggle?: () => void }} options
 */
export function installMissionMapRedesignBridge(appEl, options = {}) {
  if (!appEl) return () => {};

  const cardRoot = appEl.querySelector("[data-target-card]");
  syncDemoPill(appEl);
  syncLayoutToggle(appEl);
  if (cardRoot?.classList.contains("is-open")) syncInlineMetrics(cardRoot);

  const layoutBtn = appEl.querySelector("[data-mm-layout-toggle]");
  const onLayoutClick = () => {
    toggleMissionMapRedesign();
    options.onLayoutToggle?.();
  };
  layoutBtn?.addEventListener("click", onLayoutClick);

  const observers = [];

  const observe = (el, config, fn) => {
    if (!el) return;
    const obs = new MutationObserver(fn);
    obs.observe(el, config);
    observers.push(obs);
  };

  observe(
    appEl.querySelector("[data-location]"),
    { childList: true, characterData: true, subtree: true },
    () => syncDemoPill(appEl)
  );

  observe(
    cardRoot,
    { attributes: true, attributeFilter: ["class", "hidden"], childList: true, subtree: true, characterData: true },
    () => {
      if (cardRoot?.classList.contains("is-open")) syncInlineMetrics(cardRoot);
    }
  );

  return () => {
    layoutBtn?.removeEventListener("click", onLayoutClick);
    observers.forEach((o) => o.disconnect());
  };
}
