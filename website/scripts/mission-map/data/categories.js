/** Category visual language — glow, icons, timeline accents. */

export const CATEGORY = {
  nebula: {
    key: "nebula",
    label: "Nebulosa",
    color: "#5cc7d8",
    rgb: [92, 199, 216],
    icon: "◐",
  },
  galaxy: {
    key: "galaxy",
    label: "Galassia",
    color: "#d4b978",
    rgb: [212, 185, 120],
    icon: "◎",
  },
  cluster: {
    key: "cluster",
    label: "Ammasso",
    color: "#7eb8ff",
    rgb: [126, 184, 255],
    icon: "✦",
  },
  planet: {
    key: "planet",
    label: "Pianeta",
    color: "#e7b85a",
    rgb: [231, 184, 90],
    icon: "◉",
  },
};

/** @param {object} target */
export function getCategoryKey(target) {
  const c = target.category;
  if (c === "Pianeta") return "planet";
  if (c.includes("Galassia")) return "galaxy";
  if (c.includes("globulare") || c.includes("aperto")) return "cluster";
  return "nebula";
}

export function getCategory(target) {
  return CATEGORY[getCategoryKey(target)];
}
