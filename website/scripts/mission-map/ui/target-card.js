import { RECOMMENDATION } from "../data/targets.js";
import { paintTargetHero } from "./target-art.js";

export class TargetCard {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.currentId = null;

    this.els = {
      empty: root.querySelector("[data-target-empty]"),
      content: root.querySelector("[data-target-content]"),
      hero: root.querySelector("[data-target-hero]"),
      heroCanvas: root.querySelector("[data-target-hero-canvas]"),
      name: root.querySelector("[data-target-name]"),
      subtitle: root.querySelector("[data-target-subtitle]"),
      reason: root.querySelector("[data-target-reason]"),
      score: root.querySelector("[data-target-score]"),
      scoreRing: root.querySelector("[data-target-score-ring]"),
      badge: root.querySelector("[data-target-badge]"),
      s50: root.querySelector("[data-target-s50]"),
      s30: root.querySelector("[data-target-s30]"),
      magnitude: root.querySelector("[data-target-magnitude]"),
      filter: root.querySelector("[data-target-filter]"),
      altitude: root.querySelector("[data-target-altitude]"),
      window: root.querySelector("[data-target-window]"),
      difficulty: root.querySelector("[data-target-difficulty]"),
      addBtn: root.querySelector("[data-add-mission]"),
    };

    this.els.addBtn?.addEventListener("click", () => {
      if (this.currentId) this.callbacks.onAddToMission(this.currentId);
    });
  }

  show(target) {
    if (!target) {
      this.root.classList.remove("is-active");
      this.els.empty?.removeAttribute("hidden");
      this.els.content?.setAttribute("hidden", "");
      this.currentId = null;
      return;
    }

    this.currentId = target.id;
    this.root.classList.remove("is-entering");
    void this.root.offsetWidth;
    this.root.classList.add("is-active", "is-entering");
    this.els.empty?.setAttribute("hidden", "");
    this.els.content?.removeAttribute("hidden");

    const rec = RECOMMENDATION[target.recommendation];

    this.els.name.textContent = target.name;
    this.els.subtitle.textContent = target.subtitle;
    this.els.reason.textContent = target.reason;
    this.els.score.textContent = String(target.novaScore);
    this.els.badge.textContent = rec.label;
    this.els.badge.dataset.level = target.recommendation;
    this.els.s50.textContent = target.seestar.s50;
    this.els.s30.textContent = target.seestar.s30;
    this.els.magnitude.textContent = String(target.magnitude);
    this.els.filter.textContent = target.filter;
    this.els.altitude.textContent = `${target.alt}°`;
    this.els.window.textContent = `${target.window.start} – ${target.window.end}`;
    this.els.difficulty.textContent = target.difficulty;

    if (this.els.scoreRing) {
      const pct = target.novaScore / 100;
      this.els.scoreRing.style.setProperty("--score-pct", String(pct));
      this.els.scoreRing.dataset.level = target.recommendation;
    }

    if (this.els.heroCanvas) {
      paintTargetHero(this.els.heroCanvas, target);
    }

    this.updateMissionButton(this.els.addBtn?.dataset.inMission === "true");
  }

  setInMission(id, inMission) {
    if (this.currentId === id) {
      if (this.els.addBtn) this.els.addBtn.dataset.inMission = String(inMission);
      this.updateMissionButton(inMission);
    }
  }

  updateMissionButton(inMission) {
    if (!this.els.addBtn) return;
    this.els.addBtn.textContent = inMission ? "In missione" : "Aggiungi alla missione";
    this.els.addBtn.disabled = inMission;
    this.els.addBtn.classList.toggle("is-added", inMission);
  }
}
