import { RECOMMENDATION } from "../data/targets.js";

export class TargetCard {
  /**
   * @param {HTMLElement} root
   * @param {{ onAddToMission: (id: string) => void }} callbacks
   */
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.currentId = null;

    this.els = {
      empty: root.querySelector("[data-target-empty]"),
      content: root.querySelector("[data-target-content]"),
      name: root.querySelector("[data-target-name]"),
      category: root.querySelector("[data-target-category]"),
      badge: root.querySelector("[data-target-badge]"),
      reason: root.querySelector("[data-target-reason]"),
      window: root.querySelector("[data-target-window]"),
      s50: root.querySelector("[data-target-s50]"),
      s30: root.querySelector("[data-target-s30]"),
      difficulty: root.querySelector("[data-target-difficulty]"),
      filter: root.querySelector("[data-target-filter]"),
      preview: root.querySelector("[data-target-preview]"),
      addBtn: root.querySelector("[data-add-mission]"),
    };

    this.els.addBtn?.addEventListener("click", () => {
      if (this.currentId) this.callbacks.onAddToMission(this.currentId);
    });
  }

  /** @param {import('../data/targets.js').TARGETS[0] | null} target */
  show(target) {
    if (!target) {
      this.root.classList.remove("is-active");
      this.els.empty?.removeAttribute("hidden");
      this.els.content?.setAttribute("hidden", "");
      this.currentId = null;
      return;
    }

    this.currentId = target.id;
    this.root.classList.add("is-active");
    this.els.empty?.setAttribute("hidden", "");
    this.els.content?.removeAttribute("hidden");

    const rec = RECOMMENDATION[target.recommendation];
    this.els.name.textContent = target.name;
    this.els.category.textContent = `${target.category} · mag ${target.magnitude}`;
    this.els.badge.textContent = rec.label;
    this.els.badge.dataset.level = target.recommendation;
    this.els.reason.textContent = target.reason;
    this.els.window.textContent = `${target.window.start} – ${target.window.end}`;
    this.els.s50.textContent = target.seestar.s50;
    this.els.s30.textContent = target.seestar.s30;
    this.els.difficulty.textContent = target.difficulty;
    this.els.filter.textContent = target.filter;

    if (this.els.preview) {
      this.els.preview.style.background = `linear-gradient(145deg, ${target.preview[0]} 0%, ${target.preview[1]} 48%, ${target.preview[2]} 100%)`;
    }

    const inMission = this.els.addBtn?.dataset.inMission === "true";
    if (this.els.addBtn) {
      this.els.addBtn.textContent = inMission ? "Già in missione" : "Aggiungi alla missione";
      this.els.addBtn.disabled = inMission;
    }
  }

  setInMission(id, inMission) {
    if (this.currentId === id && this.els.addBtn) {
      this.els.addBtn.dataset.inMission = String(inMission);
      this.els.addBtn.textContent = inMission ? "Già in missione" : "Aggiungi alla missione";
      this.els.addBtn.disabled = inMission;
    }
  }
}
