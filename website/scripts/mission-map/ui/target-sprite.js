/** Pre-processes mini images for immersive sky integration. */

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Soft radial feather + key dello sfondo scuro PNG → dissolve nel cielo.
 * @param {CanvasImageSource} source
 */
export function buildFeatheredSprite(source) {
  const sw = source.width || source.naturalWidth;
  const sh = source.height || source.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, sw, sh);
  const px = data.data;
  const cx = sw * 0.5;
  const cy = sh * 0.48;
  const maxR = Math.hypot(cx, cy) * 0.98;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      let a = px[i + 3];

      const lum = luminance(r, g, b);
      const maxCh = Math.max(r, g, b);

      // Key out black letterbox / sfondo PNG rettangolare
      if (maxCh < 18 && lum < 14) {
        px[i + 3] = 0;
        continue;
      }

      const dist = Math.hypot(x - cx, y - cy) / maxR;
      const radial = 1 - smoothstep(0.38, 0.98, dist);

      // Bordi scuri semi-opachi → dissolve (evita il “riquadro”)
      const edgeDark = smoothstep(0, 28, lum);
      const darkFade = 0.28 + edgeDark * 0.72;

      a = a * radial * darkFade;
      px[i + 3] = Math.round(Math.min(255, a));
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

/** Weighted average of bright pixels — drives dynamic glow. */
export function extractDominantGlow(source) {
  const sw = source.width || source.naturalWidth;
  const sh = source.height || source.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, sw, sh).data;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let wSum = 0;
  const mx0 = sw * 0.15;
  const mx1 = sw * 0.85;
  const my0 = sh * 0.12;
  const my1 = sh * 0.88;

  for (let y = my0; y < my1; y++) {
    for (let x = mx0; x < mx1; x++) {
      const i = (Math.floor(y) * sw + Math.floor(x)) * 4;
      const a = data[i + 3] / 255;
      if (a < 0.08) continue;
      const lum = luminance(data[i], data[i + 1], data[i + 2]);
      if (lum < 18) continue;
      const w = a * lum;
      rSum += data[i] * w;
      gSum += data[i + 1] * w;
      bSum += data[i + 2] * w;
      wSum += w;
    }
  }

  if (wSum < 1) return [200, 210, 230];
  return [
    Math.round(rSum / wSum),
    Math.round(gSum / wSum),
    Math.round(bSum / wSum),
  ];
}

/**
 * @param {import('./thumbnail-cache.js').ThumbnailCache} thumbnails
 * @param {object[]} targets
 */
export function buildTargetSprites(thumbnails, targets) {
  const sprites = new Map();

  for (const target of targets) {
    const raw = thumbnails.getMini(target.id);
    if (!raw) continue;

    const seed = seedFromId(target.id);
    const feathered = buildFeatheredSprite(raw);
    const glowRgb = extractDominantGlow(raw);

    const alt = Number.isFinite(target.alt) ? target.alt : 45 + (seed % 30);
    sprites.set(target.id, {
      canvas: feathered,
      glowRgb,
      depth: 0.72 + (alt / 90) * 0.28 + (seed % 9) * 0.012,
      parallax: 0.028 + (seed % 11) * 0.004 + (alt / 90) * 0.018,
      tilt: ((seed % 17) - 8) * 0.004,
      scaleBias: 0.94 + (seed % 13) * 0.008,
      phase: (seed % 100) * 0.07,
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
