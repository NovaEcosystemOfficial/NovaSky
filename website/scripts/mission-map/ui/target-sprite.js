/** Metadati sprite cielo — sulla mappa solo glow radiali, zero PNG/canvas. */

import { getCategory } from "../data/categories.js";

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function hexToRgb(hex) {
  const h = String(hex).replace("#", "");
  if (h.length < 6) return [180, 200, 220];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function glowFromTarget(target) {
  if (target.preview?.[1]) return hexToRgb(target.preview[1]);
  return getCategory(target).rgb;
}

function accentFromTarget(target) {
  if (target.preview?.[0]) return hexToRgb(target.preview[0]);
  const [r, g, b] = glowFromTarget(target);
  return [Math.round(r * 0.72), Math.round(g * 0.72), Math.round(b * 0.72)];
}

/**
 * Sprite per la mappa — solo metadati colore/parallax (le foto restano in scheda / timeline).
 * @param {import('./thumbnail-cache.js').ThumbnailCache} _thumbnails
 * @param {object[]} targets
 */
export function buildTargetSprites(_thumbnails, targets) {
  const sprites = new Map();

  for (const target of targets) {
    const seed = seedFromId(target.id);
    const glowRgb = glowFromTarget(target);
    const accentRgb = accentFromTarget(target);
    const alt = Number.isFinite(target.alt) ? target.alt : 45 + (seed % 30);

    sprites.set(target.id, {
      glowRgb,
      accentRgb,
      procedural: true,
      depth: 0.72 + (alt / 90) * 0.28 + (seed % 9) * 0.012,
      parallax: 0.028 + (seed % 11) * 0.004 + (alt / 90) * 0.018,
      tilt: ((seed % 17) - 8) * 0.004,
      scaleBias: 0.94 + (seed % 13) * 0.008,
      phase: (seed % 100) * 0.07,
      stretch: 0.72 + (seed % 7) * 0.04,
    });
  }

  return sprites;
}

export function mixRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}
