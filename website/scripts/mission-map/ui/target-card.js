import { RECOMMENDATION } from "../data/targets.js";
import { PHOTO_CREDITS } from "../data/photo-credits.js";

export class TargetCard {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.thumbnails = callbacks.thumbnails;
    this.currentId = null;

    this.els = {
      heroImg: root.querySelector("[data-target-hero-img]"),
      name: root.querySelector("[data-target-name]"),
      subtitle: root.querySelector("[data-target-subtitle]"),
      reason: root.querySelector("[data-target-reason]"),
      expectation: root.querySelector("[data-target-expectation]"),
      window: root.querySelector("[data-target-window]"),
      s50: root.querySelector("[data-target-s50]"),
      s30: root.querySelector("[data-target-s30]"),
      badge: root.querySelector("[data-target-badge]"),
      magnitude: root.querySelector("[data-target-magnitude]"),
      filter: root.querySelector("[data-target-filter]"),
      altitude: root.querySelector("[data-target-altitude]"),
      difficulty: root.querySelector("[data-target-difficulty]"),
      score: root.querySelector("[data-target-score]"),
      photoCredit: root.querySelector("[data-target-photo-credit]"),
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
    this.els.window.textContent = `${target.window.start} – ${target.window.end}`;
    this.els.s50.textContent = target.seestar.s50;
    this.els.s30.textContent = target.seestar.s30;
    this.els.badge.textContent = rec.label;
    this.els.badge.dataset.level = target.recommendation;
    this.els.magnitude.textContent = String(target.magnitude);
    this.els.filter.textContent = target.filter;
    this.els.altitude.textContent = `${target.alt}°`;
    this.els.difficulty.textContent = target.difficulty;
    if (this.els.score) this.els.score.textContent = String(target.novaScore);

    const heroPath = `../assets/targets/hero/${target.id}.jpg`;
    if (this.els.heroImg) {
      this.els.heroImg.src = heroPath;
      this.els.heroImg.alt = target.name;
    }

    const credit = PHOTO_CREDITS[target.id];
    if (this.els.photoCredit && credit?.artist) {
      this.els.photoCredit.textContent = `Foto: ${credit.artist} · ${credit.license}`;
      this.els.photoCredit.hidden = false;
    } else if (this.els.photoCredit) {
      this.els.photoCredit.hidden = true;
    }

    this.updateMissionButton(this.els.addBtn?.dataset.inMission === "true");
  }

  /** @returns {{ x: number, y: number } | null} anchor point for sky connection line */
  getAnchorPoint() {
    if (!this.root.classList.contains("is-open")) return null;
    const rect = this.root.getBoundingClientRect();
    return { x: rect.left + 12, y: rect.top + rect.height * 0.28 };
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
