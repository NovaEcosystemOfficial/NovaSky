import {
  TARGETS,
  BACKGROUND_STARS,
  CONSTELLATIONS,
  TONIGHT_META,
  RECOMMENDATION,
} from "./data/targets.js";
import { SkyRenderer } from "./map/renderer.js";
import { MapController } from "./map/controller.js";
import { TargetCard } from "./ui/target-card.js";
import { MissionTimeline } from "./ui/timeline.js";

class MissionMapApp {
  constructor() {
    this.canvas = document.getElementById("mission-canvas");
    this.mission = [];
    this.targetsById = new Map(TARGETS.map((t) => [t.id, t]));
    this.rafId = 0;
    this.lastFrame = 0;
    this.filterRecommendedOnly = false;

    this.initMeta();
    this.initRenderer();
    this.initUI();
    this.initLegend();
    this.startLoop();

    window.addEventListener("resize", () => {
      this.renderer.resize();
    });

    document.querySelector("[data-reset-view]")?.addEventListener("click", () => {
      this.renderer.setCamera({ x: 0.5, y: 0.5, zoom: 1 });
    });

    document.querySelector("[data-filter-recommended]")?.addEventListener("click", () => {
      this.toggleFilterRecommended();
    });
  }

  toggleFilterRecommended() {
    this.filterRecommendedOnly = !this.filterRecommendedOnly;
    document.body.classList.toggle("filter-recommended", this.filterRecommendedOnly);
    this.renderer.setFilterRecommended(this.filterRecommendedOnly);
    const btn = document.querySelector("[data-filter-recommended]");
    if (btn) {
      btn.textContent = this.filterRecommendedOnly ? "Mostra tutti" : "Solo consigliati";
      btn.setAttribute("aria-pressed", String(this.filterRecommendedOnly));
    }
  }

  initMeta() {
    const map = {
      "[data-location]": TONIGHT_META.location,
      "[data-date]": TONIGHT_META.date,
      "[data-verdict]": TONIGHT_META.verdict,
      "[data-window]": TONIGHT_META.window,
      "[data-moon]": TONIGHT_META.moon,
      "[data-sky]": TONIGHT_META.sky,
    };
    for (const [sel, text] of Object.entries(map)) {
      const el = document.querySelector(sel);
      if (el) el.textContent = text;
    }

    const counts = { recommended: 0, possible: 0, discouraged: 0 };
    for (const t of TARGETS) counts[t.recommendation]++;
    const countEl = document.querySelector("[data-target-summary]");
    if (countEl) {
      countEl.textContent = `${counts.recommended} consigliati · ${counts.possible} possibili · ${counts.discouraged} sconsigliati`;
    }
  }

  initRenderer() {
    this.renderer = new SkyRenderer(this.canvas, {
      targets: TARGETS,
      stars: BACKGROUND_STARS,
      constellations: CONSTELLATIONS,
    });

    this.controller = new MapController(this.canvas, this.renderer, {
      onSelect: (id) => this.handleSelect(id),
      onHover: (id) => this.handleHover(id),
    });
  }

  initUI() {
    this.targetCard = new TargetCard(document.querySelector("[data-target-card]"), {
      onAddToMission: (id) => this.addToMission(id),
    });

    this.timeline = new MissionTimeline(document.querySelector("[data-mission-timeline]"), {
      targets: TARGETS,
      onRemove: (id) => this.removeFromMission(id),
      onSelect: (id) => {
        this.controller.selectById(id);
        this.handleSelect(id);
      },
    });

    this.tooltip = document.querySelector("[data-map-tooltip]");
  }

  initLegend() {
    const legend = document.querySelector("[data-legend]");
    if (!legend) return;
    legend.innerHTML = Object.values(RECOMMENDATION)
      .map(
        (r) => `
        <span class="legend-item" data-level="${r.key}">
          <i style="--legend-color:${r.color}"></i>
          ${r.label}
        </span>
      `,
      )
      .join("");
  }

  handleSelect(id) {
    const target = id ? this.targetsById.get(id) : null;
    this.targetCard.show(target ?? null);
    if (target) {
      this.targetCard.setInMission(id, this.mission.includes(id));
    }
  }

  handleHover(id) {
    if (!this.tooltip) return;
    if (!id) {
      this.tooltip.hidden = true;
      return;
    }
    const target = this.targetsById.get(id);
    if (!target) return;
    const rec = RECOMMENDATION[target.recommendation];
    this.tooltip.hidden = false;
    this.tooltip.innerHTML = `
      <strong>${target.name}</strong>
      <span data-level="${target.recommendation}">${rec.label}</span>
      <small>${target.window.start} – ${target.window.end}</small>
    `;
  }

  addToMission(id) {
    if (this.mission.includes(id)) return;
    this.mission.push(id);
    this.mission.sort((a, b) => {
      const ta = this.targetsById.get(a);
      const tb = this.targetsById.get(b);
      if (!ta || !tb) return 0;
      return ta.window.start.localeCompare(tb.window.start);
    });
    this.syncMission();
    this.targetCard.setInMission(id, true);
    document.querySelector("[data-mission-panel]")?.classList.add("has-targets");
  }

  removeFromMission(id) {
    this.mission = this.mission.filter((x) => x !== id);
    this.syncMission();
    this.targetCard.setInMission(id, false);
    if (this.mission.length === 0) {
      document.querySelector("[data-mission-panel]")?.classList.remove("has-targets");
    }
  }

  syncMission() {
    this.renderer.setMission(this.mission);
    this.timeline.setMission(this.mission);
  }

  startLoop() {
    const frame = (now) => {
      const dt = now - this.lastFrame;
      this.lastFrame = now;
      this.renderer.tick(dt);
      this.controller.applyInertia();
      this.renderer.render();
      this.rafId = requestAnimationFrame(frame);
    };
    this.lastFrame = performance.now();
    this.rafId = requestAnimationFrame(frame);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MissionMapApp();
});
