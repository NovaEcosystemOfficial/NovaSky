import { sortByWindowStart, parseTime, formatTime } from "../map/projection.js";
import { getCategory } from "../data/categories.js";

const MARKERS = ["22:00", "23:10", "00:40", "01:20"];

function windowDuration(start, end) {
  let s = parseTime(start);
  let e = parseTime(end);
  if (e < s) e += 24 * 60;
  const mins = e - s;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export class MissionTimeline {
  constructor(root, options) {
    this.root = root;
    this.allTargets = options.targets;
    this.thumbnails = options.thumbnails;
    this.onRemove = options.onRemove;
    this.onSelect = options.onSelect;
    this.missionIds = [];
    this.selectedId = null;

    this.els = {
      chain: root.querySelector("[data-timeline-chain]"),
      markers: root.querySelector("[data-timeline-markers]"),
      count: root.querySelector("[data-mission-count]"),
      empty: root.querySelector("[data-timeline-empty]"),
      filled: root.querySelector("[data-timeline-filled]"),
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

    if (this.els.count) this.els.count.textContent = String(targets.length);

    const hasTargets = targets.length > 0;
    this.root.classList.toggle("has-mission", hasTargets);
    if (this.els.empty) this.els.empty.hidden = hasTargets;
    if (this.els.filled) this.els.filled.hidden = !hasTargets;

    this.renderChain(targets);
  }

  renderChain(targets) {
    if (!this.els.chain) return;
    this.els.chain.innerHTML = "";

    targets.forEach((target, index) => {
      const cat = getCategory(target);
      const duration = windowDuration(target.window.start, target.window.end);
      const isSelected = target.id === this.selectedId;

      const item = document.createElement("div");
      item.className = "chain-item";
      item.style.setProperty("--cat-color", cat.color);

      if (index > 0) {
        const connector = document.createElement("div");
        connector.className = "chain-connector";
        connector.setAttribute("aria-hidden", "true");
        item.appendChild(connector);
      }

      const card = document.createElement("article");
      card.className = `chain-card${isSelected ? " is-selected" : ""}`;
      card.style.setProperty("--cat-color", cat.color);
      card.dataset.id = target.id;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${target.name}, ${target.window.start} – ${target.window.end}`);

      const thumbSrc = `../assets/targets/mini/${target.id}.png`;
      card.innerHTML = `
        <div class="chain-thumb">
          <img src="${thumbSrc}" alt="" width="48" height="38" loading="lazy" />
        </div>
        <div class="chain-body">
          <span class="chain-icon" aria-hidden="true">${cat.icon}</span>
          <strong class="chain-name">${target.name}</strong>
          <span class="chain-window">${target.window.start} – ${target.window.end}</span>
          <span class="chain-duration">${duration}</span>
        </div>
        <button type="button" class="chain-remove" aria-label="Rimuovi ${target.name}">×</button>
      `;

      card.addEventListener("click", (e) => {
        if (e.target instanceof HTMLElement && e.target.closest(".chain-remove")) return;
        this.onSelect(target.id);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onSelect(target.id);
        }
      });

      card.querySelector(".chain-remove")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onRemove(target.id);
      });

      item.appendChild(card);
      this.els.chain.appendChild(item);
    });
  }
}

export { formatTime, windowDuration };
