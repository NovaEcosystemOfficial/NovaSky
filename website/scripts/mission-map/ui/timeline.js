import { sortByWindowStart, parseTime } from "../map/projection.js";
import { RECOMMENDATION } from "../data/targets.js";

const MISSION_START = parseTime("22:00");
const MISSION_END = parseTime("03:40") + 24 * 60;
const MARKERS = ["22:00", "23:10", "00:40", "01:20"];

export class MissionTimeline {
  constructor(root, options) {
    this.root = root;
    this.allTargets = options.targets;
    this.onRemove = options.onRemove;
    this.onSelect = options.onSelect;
    this.missionIds = [];
    this.selectedId = null;

    this.els = {
      track: root.querySelector("[data-timeline-track]"),
      markers: root.querySelector("[data-timeline-markers]"),
      count: root.querySelector("[data-mission-count]"),
      empty: root.querySelector("[data-timeline-empty]"),
      filled: root.querySelector("[data-timeline-filled]"),
      moonBand: root.querySelector("[data-moon-band]"),
    };

    if (this.els.markers) {
      this.els.markers.innerHTML = MARKERS.map((t) => `<span>${t}</span>`).join("");
    }
  }

  setSelected(id) {
    this.selectedId = id;
    this.render();
  }

  setMission(ids) {
    this.missionIds = [...ids];
    this.render();
  }

  render() {
    const targets = this.missionIds
      .map((id) => this.allTargets.find((t) => t.id === id))
      .filter(Boolean)
      .sort(sortByWindowStart);

    if (this.els.count) {
      this.els.count.textContent = String(targets.length);
    }

    const hasTargets = targets.length > 0;
    this.root.classList.toggle("has-mission", hasTargets);

    if (this.els.empty) this.els.empty.hidden = hasTargets;
    if (this.els.filled) this.els.filled.hidden = !hasTargets;

    this.renderTrack(targets);
  }

  renderTrack(targets) {
    if (!this.els.track) return;
    this.els.track.innerHTML = "";

    const duration = MISSION_END - MISSION_START;

    if (this.els.moonBand) {
      const moonStart = ((parseTime("23:30") - MISSION_START) / duration) * 100;
      const moonWidth = ((parseTime("01:00") - parseTime("23:30")) / duration) * 100;
      this.els.moonBand.style.left = `${moonStart}%`;
      this.els.moonBand.style.width = `${moonWidth}%`;
    }

    for (const target of targets) {
      let start = parseTime(target.window.start);
      let end = parseTime(target.window.end);
      if (start < MISSION_START) start += 24 * 60;
      if (end < start) end += 24 * 60;

      const left = ((start - MISSION_START) / duration) * 100;
      const width = Math.max(6, ((end - start) / duration) * 100);
      const rec = RECOMMENDATION[target.recommendation];
      const isSelected = target.id === this.selectedId;

      const block = document.createElement("button");
      block.type = "button";
      block.className = `mission-block${isSelected ? " is-selected" : ""}`;
      block.style.left = `${left}%`;
      block.style.width = `${width}%`;
      block.style.setProperty("--block-color", rec.color);
      block.dataset.id = target.id;
      block.innerHTML = `
        <span class="mission-block-glow" aria-hidden="true"></span>
        <span class="mission-block-name">${target.name}</span>
        <span class="mission-block-window">${target.window.start} – ${target.window.end}</span>
      `;
      block.addEventListener("click", () => this.onSelect(target.id));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mission-block-remove";
      remove.setAttribute("aria-label", `Rimuovi ${target.name}`);
      remove.textContent = "×";
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onRemove(target.id);
      });
      block.appendChild(remove);

      this.els.track.appendChild(block);
    }
  }
}
