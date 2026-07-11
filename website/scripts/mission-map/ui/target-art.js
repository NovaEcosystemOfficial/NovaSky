/** Procedural target hero art — nebula-like previews without stock images. */

export function paintTargetHero(canvas, target) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const [c1, c2, c3] = target.preview;

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, c3);
  bg.addColorStop(0.5, c1);
  bg.addColorStop(1, "#05070a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const seed = target.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 5; i++) {
    const px = ((seed * (i + 3)) % 100) / 100;
    const py = ((seed * (i + 7)) % 100) / 100;
    const r = w * (0.18 + (i % 3) * 0.12);
    const g = ctx.createRadialGradient(w * px, h * py, 0, w * px, h * py, r);
    g.addColorStop(0, `${c2}cc`);
    g.addColorStop(0.45, `${c2}44`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const dust = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, w * 0.45);
  dust.addColorStop(0, "rgba(255,255,255,0.06)");
  dust.addColorStop(0.6, "rgba(92,199,216,0.04)");
  dust.addColorStop(1, "transparent");
  ctx.fillStyle = dust;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(5, 7, 10, 0.35)";
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  for (let s = 0; s < 28; s++) {
    const sx = ((seed + s * 17) % 97) / 97 * w;
    const sy = ((seed + s * 31) % 73) / 73 * h * 0.85;
    const sa = 0.15 + (s % 5) * 0.08;
    ctx.beginPath();
    ctx.arc(sx, sy, s % 4 === 0 ? 1.2 : 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(238, 244, 248, ${sa})`;
    ctx.fill();
  }
}
