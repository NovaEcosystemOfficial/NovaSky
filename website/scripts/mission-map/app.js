import { CATALOG } from "./data/catalog.js";
import { ObservatoryRenderer } from "./map/renderer.js";
import { MapController } from "./map/controller.js";
import { TargetCard } from "./ui/target-card.js";
import { MissionTimeline } from "./ui/timeline.js";
import { ThumbnailCache } from "./ui/thumbnail-cache.js";
import { buildTargetSprites } from "./ui/target-sprite.js";
import { LocationService } from "./services/location-service.js";
import {
  computeSkySession,
  buildNightHours,
} from "./services/sky-compute.js";

class ObservatoryApp {
  constructor() {
    this.canvas = document.getElementById("mission-canvas");
    this.canvasWrap = document.querySelector(".sky-chamber");
    this.mission = [];
    this.catalog = CATALOG;
    this.lastFrame = 0;
    this.thumbnails = new ThumbnailCache(CATALOG);
    this.sprites = new Map();
    this.locationService = new LocationService();
    this.session = null;
    this.nightSteps = [];
    this.renderer = null;
    this.controller = null;
    this.targetCard = null;
    this.timeline = null;
    this.selectedId = null;
  }

  async init() {
    await this.thumbnails.load();
    this.sprites = buildTargetSprites(this.thumbnails, CATALOG);
    this.initLocationUI();
    this.initTimeUI();
    this.initRenderer();
    this.initUI();

    await this.locationService.requestLocation();
    this.refreshSky();

    this.startLoop();
    window.addEventListener("resize", () => {
      this.renderer.resize();
      this.updateCardAnchor();
    });
  }

  initLocationUI() {
    const btn = document.querySelector("[data-location-request]");
    btn?.addEventListener("click", async () => {
      await this.locationService.requestLocation();
      this.refreshSky();
    });
  }

  initTimeUI() {
    const slider = document.querySelector("[data-time-slider]");
    slider?.addEventListener("input", () => {
      const idx = Number(slider.value);
      const when = this.nightSteps[idx];
      if (when) this.refreshSky(when);
    });
  }

  initRenderer() {
    this.renderer = new ObservatoryRenderer(this.canvas, {
      targets: [],
      constellations: [],
      thumbnails: this.thumbnails,
      sprites: this.sprites,
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
      targets: [],
      thumbnails: this.thumbnails,
      onRemove: (id) => this.removeFromMission(id),
      onSelect: (id) => {
        this.controller.selectById(id);
        this.handleSelect(id);
      },
    });
  }

  refreshSky(whenArg) {
    const observer = this.locationService.getLocation();
    let when = whenArg ?? this.session?.when ?? new Date();

    let session = computeSkySession(observer, when);

    if (!whenArg && session.visibleTargets.length === 0 && session.meta.twilight.evening) {
      when = new Date(session.meta.twilight.evening.getTime() + 90 * 60_000);
      session = computeSkySession(observer, when);
    }

    this.session = session;
    this.nightSteps = buildNightHours(when, this.session.meta.twilight);

    const slider = document.querySelector("[data-time-slider]");
    if (slider) {
      slider.max = String(Math.max(0, this.nightSteps.length - 1));
      const idx = this.nightSteps.findIndex((s) => Math.abs(s - when) < 60_000);
      slider.value = String(Math.max(0, idx >= 0 ? idx : 0));
    }

    const timeLabel = document.querySelector("[data-time-label]");
    if (timeLabel) timeLabel.textContent = this.session.meta.time;

    this.updateHeader(this.session.meta);
    this.applySessionToMap();

    const stillVisible = this.session.visibleTargets.find((t) => t.id === this.selectedId);
    if (!stillVisible) {
      const next = this.session.defaultTarget;
      this.selectedId = next?.id ?? null;
      this.controller.selectById(this.selectedId);
      this.handleSelect(this.selectedId);
    } else {
      this.handleSelect(this.selectedId);
    }
  }

  updateHeader(meta) {
    const fields = {
      "[data-location]": meta.location,
      "[data-date]": meta.date,
      "[data-verdict]": meta.verdict,
      "[data-window]": meta.window,
      "[data-moon]": meta.moon,
    };
    for (const [sel, text] of Object.entries(fields)) {
      const el = document.querySelector(sel);
      if (el) el.textContent = text;
    }
  }

  applySessionToMap() {
    const visible = this.session.visibleTargets;
    this.renderer.setTargets(visible);
    this.timeline.setCatalog(visible);
    this.syncMission();
  }

  updateCardAnchor() {
    if (!this.renderer || !this.canvasWrap || !this.targetCard) return;
    const anchor = this.targetCard.getAnchorPoint();
    if (!anchor) {
      this.renderer.setCardAnchor(null);
      return;
    }
    const canvasRect = this.canvas.getBoundingClientRect();
    this.renderer.setCardAnchor({
      x: anchor.x - canvasRect.left,
      y: anchor.y - canvasRect.top,
    });
  }

  handleSelect(id) {
    this.selectedId = id;
    const target = id
      ? this.session?.targets.find((t) => t.id === id) ??
        this.session?.visibleTargets.find((t) => t.id === id)
      : null;
    this.targetCard.show(target ?? null);
    this.timeline.setSelected(id);
    requestAnimationFrame(() => this.updateCardAnchor());

    const prompt = document.querySelector("[data-sky-prompt]");
    if (prompt) prompt.classList.toggle("is-hidden", Boolean(target));
    if (target) this.targetCard.setInMission(id, this.mission.includes(id));
  }

  addToMission(id) {
    if (this.mission.includes(id)) return;
    this.mission.push(id);
    this.mission.sort((a, b) => {
      const ta = this.session.targets.find((t) => t.id === a);
      const tb = this.session.targets.find((t) => t.id === b);
      if (!ta?.window?.startDate || !tb?.window?.startDate) return 0;
      return ta.window.startDate - tb.window.startDate;
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
  new ObservatoryApp().init();
});
