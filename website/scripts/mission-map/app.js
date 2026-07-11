import {
  TARGETS,
  CONSTELLATIONS,
  TONIGHT_META,
} from "./data/targets.js";
import { ObservatoryRenderer } from "./map/renderer.js";
import { MapController } from "./map/controller.js";
import { TargetCard } from "./ui/target-card.js";
import { MissionTimeline } from "./ui/timeline.js";

class ObservatoryApp {
  constructor() {
    this.canvas = document.getElementById("mission-canvas");
    this.mission = [];
    this.targetsById = new Map(TARGETS.map((t) => [t.id, t]));
    this.lastFrame = 0;

    this.initMeta();
    this.initRenderer();
    this.initUI();
    this.startLoop();

    window.addEventListener("resize", () => this.renderer.resize());

    const topTarget = TARGETS.find((t) => t.id === "ngc7000") ?? TARGETS[0];
    this.controller.selectById(topTarget.id);
    this.timeline.setSelected(topTarget.id);
    document.querySelector("[data-sky-prompt]")?.classList.add("is-hidden");
  }

  initMeta() {
    const fields = {
      "[data-location]": TONIGHT_META.location,
      "[data-date]": TONIGHT_META.date,
      "[data-verdict]": TONIGHT_META.verdict,
      "[data-window]": TONIGHT_META.window,
    };
    for (const [sel, text] of Object.entries(fields)) {
      document.querySelector(sel)?.replaceChildren(document.createTextNode(text));
    }
  }

  initRenderer() {
    this.renderer = new ObservatoryRenderer(this.canvas, {
      targets: TARGETS,
      constellations: CONSTELLATIONS,
    });

    this.controller = new MapController(this.canvas, this.renderer, {
      onSelect: (id) => this.handleSelect(id),
      onHover: () => {},
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
  }

  handleSelect(id) {
    const target = id ? this.targetsById.get(id) : null;
    this.targetCard.show(target ?? null);
    this.timeline.setSelected(id);

    const prompt = document.querySelector("[data-sky-prompt]");
    if (prompt) prompt.classList.toggle("is-hidden", Boolean(target));

    if (target) {
      this.targetCard.setInMission(id, this.mission.includes(id));
    }
  }

  addToMission(id) {
    if (this.mission.includes(id)) return;
    this.mission.push(id);
    this.mission.sort((a, b) => {
      const ta = this.targetsById.get(a);
      const tb = this.targetsById.get(b);
      return ta.window.start.localeCompare(tb.window.start);
    });
    this.syncMission();
    this.targetCard.setInMission(id, true);
  }

  removeFromMission(id) {
    this.mission = this.mission.filter((x) => x !== id);
    this.syncMission();
    this.targetCard.setInMission(id, false);
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
      requestAnimationFrame(frame);
    };
    this.lastFrame = performance.now();
    requestAnimationFrame(frame);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ObservatoryApp();
});
