/** Curated astronomical placeholder art — miniatures & hero previews. */

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function drawCategoryStructure(ctx, target, w, h, seed) {
  const [c1, c2] = target.preview;
  const cx = w * 0.5;
  const cy = h * 0.48;

  if (target.category.includes("Galassia")) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.4 + (seed % 10) * 0.05);
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.28, w * 0.09, arm * Math.PI, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.3);
      g.addColorStop(0, `${c2}99`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill();
    ctx.restore();
  } else if (target.category.includes("globulare")) {
    for (let i = 0; i < 120; i++) {
      const ang = (i / 120) * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.5) * w * 0.22;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist;
      ctx.beginPath();
      ctx.arc(px, py, 0.4 + (i % 3) * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(238, 244, 248, ${0.08 + (i % 5) * 0.04})`;
      ctx.fill();
    }
  } else if (target.category.includes("planetaria")) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.2);
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(0.35, `${c2}88`);
    g.addColorStop(0.7, `${c1}44`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (target.category === "Pianeta") {
    const g = ctx.createRadialGradient(cx - w * 0.04, cy - w * 0.04, 0, cx, cy, w * 0.18);
    g.addColorStop(0, "rgba(255,240,210,0.7)");
    g.addColorStop(0.6, `${c2}`);
    g.addColorStop(1, `${c1}`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 0; i < 4; i++) {
      const px = cx + ((seed * (i + 2)) % 60 - 30) / 100 * w;
      const py = cy + ((seed * (i + 5)) % 50 - 25) / 100 * h;
      const rx = w * (0.12 + (i % 2) * 0.08);
      const ry = h * (0.08 + (i % 3) * 0.04);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rx);
      g.addColorStop(0, `${c2}aa`);
      g.addColorStop(0.5, `${c2}33`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, (i * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} target
 * @param {'mini' | 'hero'} variant
 */
export function paintTargetArt(canvas, target, variant = "hero") {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const [c1, c2, c3] = target.preview;
  const seed = seedFromId(target.id);

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, w * 0.75);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.55, c3);
  bg.addColorStop(1, "#030508");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawCategoryStructure(ctx, target, w, h, seed);

  const nebCount = variant === "hero" ? 6 : 3;
  for (let i = 0; i < nebCount; i++) {
    const px = ((seed * (i + 3)) % 100) / 100;
    const py = ((seed * (i + 7)) % 100) / 100;
    const r = w * (variant === "hero" ? 0.22 : 0.35) * (0.5 + (i % 3) * 0.25);
    const g = ctx.createRadialGradient(w * px, h * py, 0, w * px, h * py, r);
    g.addColorStop(0, `${c2}${variant === "hero" ? "bb" : "88"}`);
    g.addColorStop(0.45, `${c2}33`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const starCount = variant === "hero" ? 48 : 12;
  for (let s = 0; s < starCount; s++) {
    const sx = ((seed + s * 17) % 97) / 97 * w;
    const sy = ((seed + s * 31) % 73) / 73 * h * 0.9;
    const sa = 0.12 + (s % 5) * (variant === "hero" ? 0.06 : 0.04);
    ctx.beginPath();
    ctx.arc(sx, sy, s % 4 === 0 ? 1.4 : 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(238, 244, 248, ${sa})`;
    ctx.fill();
  }

  if (variant === "hero") {
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(3, 5, 8, 0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
}

export function paintTargetHero(canvas, target) {
  paintTargetArt(canvas, target, "hero");
}

/** @param {object[]} targets */
export function buildThumbnailCache(targets) {
  const mini = new Map();
  const hero = new Map();

  for (const target of targets) {
    const miniCanvas = document.createElement("canvas");
    miniCanvas.width = 128;
    miniCanvas.height = 96;
    paintTargetArt(miniCanvas, target, "mini");
    mini.set(target.id, miniCanvas);

    const heroCanvas = document.createElement("canvas");
    heroCanvas.width = 800;
    heroCanvas.height = 500;
    paintTargetArt(heroCanvas, target, "hero");
    hero.set(target.id, heroCanvas);
  }

  return { mini, hero };
}

export function glowStrength(target) {
  const magFactor = (8 - Math.min(target.magnitude, 8)) / 8;
  const scoreFactor = (target.novaScore ?? 60) / 100;
  return 0.35 + magFactor * 0.35 + scoreFactor * 0.25;
}
