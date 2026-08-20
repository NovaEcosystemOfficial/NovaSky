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
import {
  createMissionStore,
  createMissionItemFromTarget,
  localDateString,
  MISSION_STORAGE_KEY,
} from "./services/mission-store.js";
import { promptPreviousMission } from "./ui/mission-prompt.js";

export class ObservatoryApp {
  constructor() {
    this.canvas = document.getElementById("mission-canvas");
    this.canvasWrap = document.querySelector(".sky-chamber");
    this.missionStore = createMissionStore(CATALOG.map((t) => t.id));
    this.missionPayload = this.missionStore.load();
    this.mission = [...this.missionPayload.items];
    this.missionDate = this.missionPayload.missionDate;
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
    this.liveTime = true;
    this.syncTimer = null;
    this.missionReady = false;
    this._rafId = null;

    this.prehydrateMissionDeck();
  }

  async init() {
    try {
      await this.resolveMissionDate();

      await this.thumbnails.load();
      this.sprites = buildTargetSprites(this.thumbnails, CATALOG);
      this.initLocationUI();
      this.initTimeUI();
      this.initMissionUI();
      this.initRenderer();
      this.initUI();

      this.locationService.useDemo();
      this.refreshSky();
      this.startLiveSync();
      this.startLoop();
      this.markMissionReady();

      this.locationService.requestLocation().then(() => {
        this.refreshSky();
      });

      window.addEventListener("resize", () => {
        this.renderer.resize();
        this.updateCardAnchor();
      });

      window.addEventListener("storage", (event) => {
        if (event.key !== MISSION_STORAGE_KEY) return;
        this.applyExternalMission(event.newValue);
      });
    } catch (err) {
      console.error("NovaSky init failed:", err);
      const verdict = document.querySelector("[data-verdict]");
      if (verdict) verdict.textContent = "Errore di caricamento — ricarica la pagina";
      this.markMissionReady();
    }
  }

  prehydrateMissionDeck() {
    const root = document.querySelector("[data-mission-timeline]");
    const count = document.querySelector("[data-mission-count]");
    const empty = document.querySelector("[data-timeline-empty]");
    const filled = document.querySelector("[data-timeline-filled]");
    const clearBtn = document.querySelector("[data-mission-clear]");
    const has = this.mission.length > 0;

    if (count) count.textContent = String(this.mission.length);
    if (empty) empty.hidden = has;
    if (filled) filled.hidden = !has;
    if (root) root.classList.toggle("has-mission", has);
    if (clearBtn) clearBtn.hidden = !has;
  }

  markMissionReady() {
    this.missionReady = true;
    const root = document.querySelector("[data-mission-timeline]");
    if (root) root.dataset.missionReady = "true";
  }

  async resolveMissionDate() {
    const today = localDateString();
    if (!this.mission.length || this.missionDate === today) {
      if (!this.mission.length) this.missionDate = today;
      return;
    }

    const choice = await promptPreviousMission(this.missionDate);
    if (choice === "new") {
      this.mission = [];
      this.missionDate = today;
      this.missionStore.clear();
      this.prehydrateMissionDeck();
    }
  }

  initMissionUI() {
    document.querySelector("[data-mission-clear]")?.addEventListener("click", () => {
      this.clearMission();
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
      this.liveTime = false;
      const idx = Number(slider.value);
      const when = this.nightSteps[idx];
      if (when) this.refreshSky(when);
    });

    document.querySelector("[data-time-sync]")?.addEventListener("click", () => {
      this.liveTime = true;
      this.refreshSky();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.liveTime) {
        this.refreshSky();
      }
    });
  }

  startLiveSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (this.liveTime) this.refreshSky();
    }, 60_000);
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
      thumbnails: this.thumbnails,
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

    this.syncMission();
  }

  refreshSky(whenArg) {
    const observer = this.locationService.getLocation();
    let when;

    if (whenArg) {
      when = whenArg;
    } else if (this.liveTime) {
      when = new Date();
    } else {
      when = this.session?.when ?? new Date();
    }

    let session = computeSkySession(observer, when);

    if (
      !this.liveTime &&
      !whenArg &&
      session.visibleTargets.length === 0 &&
      session.meta.twilight.evening
    ) {
      when = new Date(session.meta.twilight.evening.getTime() + 90 * 60_000);
      session = computeSkySession(observer, when);
    }

    this.session = session;
    this.nightSteps = buildNightHours(when, this.session.meta.twilight);

    this.sprites = buildTargetSprites(this.thumbnails, this.session.targets);
    this.renderer.setSprites(this.sprites);

    const slider = document.querySelector("[data-time-slider]");
    if (slider) {
      slider.max = String(Math.max(0, this.nightSteps.length - 1));
      const idx = this.nightSteps.findIndex((s) => Math.abs(s - when) < 60_000);
      slider.value = String(Math.max(0, idx >= 0 ? idx : 0));
    }

    const timeLabel = document.querySelector("[data-time-label]");
    if (timeLabel) timeLabel.textContent = this.session.meta.time;

    const timeMode = document.querySelector("[data-time-mode]");
    if (timeMode) timeMode.textContent = this.liveTime ? "Ora reale" : "Ora simulata";

    const syncBtn = document.querySelector("[data-time-sync]");
    if (syncBtn) syncBtn.hidden = this.liveTime;

    this.updateHeader(this.session.meta);
    this.renderer.resize();
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
      "[data-verdict]": meta.verdict,
      "[data-window]": meta.window,
      "[data-moon]": meta.moon,
    };
    for (const [sel, text] of Object.entries(fields)) {
      const el = document.querySelector(sel);
      if (el) el.textContent = text;
    }

    const dateEl = document.querySelector("[data-date]");
    if (dateEl) {
      dateEl.textContent = meta.date;
      if (this.session?.when) {
        dateEl.dateTime = this.session.when.toISOString();
      }
    }
  }

  applySessionToMap() {
    const visible = this.session.visibleTargets;
    this.renderer.setTargets(visible);
    this.timeline.setCatalog(this.session.targets);
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
    if (target) this.targetCard.setInMission(id, this.hasMissionTarget(id));
  }

  hasMissionTarget(id) {
    return this.mission.some((item) => item.targetId === id);
  }

  getMissionTargetIds() {
    return this.mission.map((item) => item.targetId);
  }

  addToMission(id) {
    if (this.hasMissionTarget(id)) return;

    const target = this.session?.targets.find((t) => t.id === id);
    if (!target) return;

    const item = createMissionItemFromTarget(target);
    item.order = this.mission.length;
    this.mission.push(item);
    this.sortMissionByWindow();
    this.persistMission();
    this.syncMission();
    this.targetCard.setInMission(id, true);
  }

  removeFromMission(id) {
    this.mission = this.mission.filter((item) => item.targetId !== id);
    this.reindexMission();
    this.persistMission();
    this.syncMission();
    this.targetCard.setInMission(id, false);
  }

  clearMission() {
    if (!this.mission.length) return;
    const ok = window.confirm("Svuotare la missione di stanotte? Tutti i target verranno rimossi.");
    if (!ok) return;
    this.mission = [];
    this.missionDate = localDateString();
    this.missionStore.clear();
    this.syncMission();
    if (this.selectedId) this.targetCard.setInMission(this.selectedId, false);
  }

  sortMissionByWindow() {
    this.mission.sort((a, b) => {
      const ta = this.session?.targets.find((t) => t.id === a.targetId);
      const tb = this.session?.targets.find((t) => t.id === b.targetId);
      if (!ta?.window?.startDate || !tb?.window?.startDate) return a.order - b.order;
      return ta.window.startDate - tb.window.startDate;
    });
    this.reindexMission();
  }

  reindexMission() {
    this.mission.forEach((item, idx) => {
      item.order = idx;
    });
  }

  persistMission() {
    if (!this.missionDate) this.missionDate = localDateString();
    this.missionPayload = this.missionStore.save(this.mission, this.missionDate);
  }

  applyExternalMission(raw) {
    const payload = this.missionStore.parse(raw);
    this.mission = [...payload.items];
    this.missionDate = payload.missionDate;
    this.prehydrateMissionDeck();
    this.syncMission();
    if (this.selectedId) {
      this.targetCard.setInMission(this.selectedId, this.hasMissionTarget(this.selectedId));
    }
  }

  syncMission() {
    const ids = this.getMissionTargetIds();
    this.renderer.setMission(ids);
    this.timeline.setMission(this.mission);
    this.prehydrateMissionDeck();
  }

  startLoop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    const frame = (now) => {
      const dt = now - this.lastFrame;
      this.lastFrame = now;
      if (this.renderer.width < 2) this.renderer.resize();
      this.renderer.tick(dt);
      this.controller.applyInertia();
      this.renderer.render();
      this._rafId = requestAnimationFrame(frame);
    };
    this.lastFrame = performance.now();
    this._rafId = requestAnimationFrame(frame);
  }

  /** Rilascia timer e loop (shell desktop). */
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}

function shouldAutoInitMissionMap() {
  if (document.documentElement.dataset.runtime === "desktop-shell") return false;
  return Boolean(document.getElementById("mission-canvas"));
}

if (shouldAutoInitMissionMap()) {
  document.addEventListener("DOMContentLoaded", () => {
    new ObservatoryApp().init();
  });
}
