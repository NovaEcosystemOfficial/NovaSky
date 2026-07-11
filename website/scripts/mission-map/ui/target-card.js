import { RECOMMENDATION } from "../data/targets.js";

export class TargetCard {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.currentId = null;
    this.thumbnails = callbacks.thumbnails;

    this.els = {
      heroCanvas: root.querySelector("[data-target-hero-canvas]"),
      name: root.querySelector("[data-target-name]"),
      subtitle: root.querySelector("[data-target-subtitle]"),
      reason: root.querySelector("[data-target-reason]"),
      expectation: root.querySelector("[data-target-expectation]"),
      badge: root.querySelector("[data-target-badge]"),
      s50: root.querySelector("[data-target-s50]"),
      s30: root.querySelector("[data-target-s30]"),
      magnitude: root.querySelector("[data-target-magnitude]"),
      filter: root.querySelector("[data-target-filter]"),
      altitude: root.querySelector("[data-target-altitude]"),
      window: root.querySelector("[data-target-window]"),
      difficulty: root.querySelector("[data-target-difficulty]"),
      score: root.querySelector("[data-target-score]"),
      addBtn: root.querySelector("[data-add-mission]"),
    };

    this.els.addBtn?.addEventListener("click", () => {
      if (this.currentId) this.callbacks.onAddToMission(this.currentId);
    });
  }

  show(target) {
    if (!target) {
      this.root.classList.remove("is-open", "is-entering");
      this.root.setAttribute("hidden", "");
      this.currentId = null;
      return;
    }

    this.currentId = target.id;
    this.root.removeAttribute("hidden");
    this.root.classList.add("is-open");
    this.root.classList.remove("is-entering");
    void this.root.offsetWidth;
    this.root.classList.add("is-entering");

    const rec = RECOMMENDATION[target.recommendation];

    this.els.name.textContent = target.name;
    this.els.subtitle.textContent = target.subtitle;
    this.els.reason.textContent = target.reason;
    this.els.expectation.textContent = target.expectation;
    this.els.badge.textContent = rec.label;
    this.els.badge.dataset.level = target.recommendation;
    this.els.s50.textContent = target.seestar.s50;
    this.els.s30.textContent = target.seestar.s30;
    this.els.magnitude.textContent = String(target.magnitude);
    this.els.filter.textContent = target.filter;
    this.els.altitude.textContent = `${target.alt}°`;
    this.els.window.textContent = `${target.window.start} – ${target.window.end}`;
    this.els.difficulty.textContent = target.difficulty;
    if (this.els.score) this.els.score.textContent = String(target.novaScore);

    if (this.els.heroCanvas && this.thumbnails) {
      const hero = this.thumbnails.getHero(target.id);
      const ctx = this.els.heroCanvas.getContext("2d");
      if (hero && ctx) {
        ctx.clearRect(0, 0, this.els.heroCanvas.width, this.els.heroCanvas.height);
        ctx.drawImage(hero, 0, 0, this.els.heroCanvas.width, this.els.heroCanvas.height);
      }
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
