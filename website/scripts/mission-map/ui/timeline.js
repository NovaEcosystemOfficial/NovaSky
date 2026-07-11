import { sortByWindowStart, parseTime, formatTime } from "../map/projection.js";
import { RECOMMENDATION } from "../data/targets.js";

const MISSION_START = parseTime("22:00");
const MISSION_END = parseTime("03:40") + (parseTime("03:40") < MISSION_START ? 24 * 60 : 0);

export class MissionTimeline {
  /**
   * @param {HTMLElement} root
   * @param {{ targets: import('../data/targets.js').TARGETS, onRemove: (id: string) => void, onSelect: (id: string) => void }} options
   */
  constructor(root, options) {
    this.root = root;
    this.allTargets = options.targets;
    this.onRemove = options.onRemove;
    this.onSelect = options.onSelect;
    this.missionIds = [];

    this.els = {
      track: root.querySelector("[data-timeline-track]"),
      markers: root.querySelector("[data-timeline-markers]"),
      list: root.querySelector("[data-timeline-list]"),
      count: root.querySelector("[data-mission-count]"),
      empty: root.querySelector("[data-timeline-empty]"),
    };
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

    if (targets.length === 0) {
      this.els.empty?.removeAttribute("hidden");
      this.els.list?.setAttribute("hidden", "");
      this.renderTrack([]);
      return;
    }

    this.els.empty?.setAttribute("hidden", "");
    this.els.list?.removeAttribute("hidden");
    this.renderTrack(targets);
    this.renderList(targets);
  }

  renderTrack(targets) {
    if (!this.els.track) return;
    this.els.track.innerHTML = "";

    const duration = MISSION_END - MISSION_START;
    const markers = ["22:00", "23:10", "00:40", "01:20", "02:30"];

    if (this.els.markers) {
      this.els.markers.innerHTML = markers
        .map((t) => `<span>${t}</span>`)
        .join("");
    }

    for (const target of targets) {
      let start = parseTime(target.window.start);
      let end = parseTime(target.window.end);
      if (start < MISSION_START) start += 24 * 60;
      if (end < start) end += 24 * 60;

      const left = ((start - MISSION_START) / duration) * 100;
      const width = Math.max(8, ((end - start) / duration) * 100);
      const rec = RECOMMENDATION[target.recommendation];

      const block = document.createElement("button");
      block.type = "button";
      block.className = "timeline-block";
      block.style.left = `${left}%`;
      block.style.width = `${width}%`;
      block.style.setProperty("--block-color", rec.color);
      block.dataset.id = target.id;
      block.innerHTML = `<span>${target.name}</span>`;
      block.title = `${target.name} · ${target.window.start}–${target.window.end}`;
      block.addEventListener("click", () => this.onSelect(target.id));
      this.els.track.appendChild(block);
    }
  }

  renderList(targets) {
    if (!this.els.list) return;
    this.els.list.innerHTML = targets
      .map((target, index) => {
        const rec = RECOMMENDATION[target.recommendation];
        return `
          <article class="timeline-item" data-id="${target.id}">
            <div class="timeline-item-time">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <strong>${target.window.start}</strong>
            </div>
            <div class="timeline-item-body">
              <div class="timeline-item-head">
                <button type="button" class="timeline-item-select" data-select="${target.id}">
                  ${target.name}
                </button>
                <span class="timeline-item-badge" data-level="${target.recommendation}">${rec.label}</span>
              </div>
              <p>${target.subtitle}</p>
              <small>Finestra ${target.window.start} – ${target.window.end}</small>
            </div>
            <button type="button" class="timeline-item-remove" data-remove="${target.id}" aria-label="Rimuovi ${target.name}">×</button>
          </article>
        `;
      })
      .join("");

    this.els.list.querySelectorAll("[data-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-select");
        if (id) this.onSelect(id);
      });
    });

    this.els.list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove");
        if (id) this.onRemove(id);
      });
    });
  }
}

export { formatTime };
