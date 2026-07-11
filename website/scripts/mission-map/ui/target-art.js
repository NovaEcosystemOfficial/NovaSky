/** Transparent astronomical placeholder art. */

import { getCategory } from "../data/categories.js";

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawCategoryStructure(ctx, target, w, h, seed) {
  const cat = getCategory(target);
  const [r, g, b] = cat.rgb;
  const cx = w * 0.5;
  const cy = h * 0.48;
  const rand = seededRand(seed);

  if (cat.key === "galaxy") {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.35 + (seed % 10) * 0.04);
    for (let arm = 0; arm < 2; arm++) {
      for (let t = 0; t < 120; t++) {
        const ang = (t / 120) * Math.PI * 2 + arm * Math.PI;
        const dist = Math.pow(t / 120, 0.65) * w * 0.3;
        const px = Math.cos(ang) * dist;
        const py = Math.sin(ang) * dist * 0.38;
        const a = 0.65 * (1 - t / 120);
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
    ctx.restore();
  } else if (cat.key === "cluster") {
    for (let i = 0; i < 140; i++) {
      const ang = (i / 140) * Math.PI * 2;
      const dist = Math.pow(rand(), 0.55) * w * 0.24;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist;
      ctx.beginPath();
      ctx.arc(px, py, 0.5 + (i % 3) * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${0.15 + (i % 5) * 0.07})`;
      ctx.fill();
    }
  } else if (cat.key === "planet") {
    const grad = ctx.createRadialGradient(cx - w * 0.03, cy - w * 0.03, 0, cx, cy, w * 0.2);
    grad.addColorStop(0, "rgba(255, 240, 220, 0.9)");
    grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.85)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 0; i < 5; i++) {
      const px = cx + ((seed * (i + 2)) % 60 - 30) / 100 * w;
      const py = cy + ((seed * (i + 5)) % 50 - 25) / 100 * h;
      const rx = w * (0.14 + (i % 2) * 0.07);
      const ry = h * (0.1 + (i % 3) * 0.04);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rx);
      g.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.75)`);
      g.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.2)`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, i * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} target
 * @param {'mini' | 'hero'} variant
 * @param {boolean} transparent
 */
export function paintTargetArt(canvas, target, variant = "hero", transparent = false) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const seed = seedFromId(target.id);

  ctx.clearRect(0, 0, w, h);

  if (!transparent && variant === "hero") {
    const [c1, , c3] = target.preview;
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, w * 0.75);
    bg.addColorStop(0, c1);
    bg.addColorStop(0.55, c3);
    bg.addColorStop(1, "#030508");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  drawCategoryStructure(ctx, target, w, h, seed);

  if (variant === "hero" && !transparent) {
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.72);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(3, 5, 8, 0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
}

export function glowStrength(target) {
  const magFactor = (8 - Math.min(target.magnitude, 8)) / 8;
  const scoreFactor = (target.novaScore ?? 60) / 100;
  return 0.4 + magFactor * 0.35 + scoreFactor * 0.25;
}
