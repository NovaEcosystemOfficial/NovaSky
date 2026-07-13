/**
 * Desktop-only: sprite cielo con PNG sfumati — nessuna modifica al motore website/.
 */

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Pre-processa mini PNG: key nero + feather radiale + vignetta trasparente.
 * @param {CanvasImageSource} source
 */
export function buildFeatheredSkyCanvas(source) {
  const sw = source.width || source.naturalWidth || 128;
  const sh = source.height || source.naturalHeight || 100;
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, sw, sh);

  const data = ctx.getImageData(0, 0, sw, sh);
  const px = data.data;
  const cx = sw * 0.5;
  const cy = sh * 0.46;
  const maxR = Math.hypot(cx, cy) * 0.96;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      let a = px[i + 3];
      const lum = luminance(r, g, b);
      const maxCh = Math.max(r, g, b);

      if (maxCh < 22 && lum < 16) {
        px[i + 3] = 0;
        continue;
      }

      const dist = Math.hypot(x - cx, y - cy) / maxR;
      const radial = 1 - smoothstep(0.22, 1, dist);
      const fade = radial * radial * radial;
      const edgeDark = smoothstep(0, 32, lum);
      const darkFade = 0.22 + edgeDark * 0.78;

      a = a * fade * darkFade;
      px[i + 3] = Math.round(Math.min(255, a));
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

function drawFeatheredSkyImage(ctx, canvas, w, h, state) {
  if (!canvas || state.presence < 0.02) return;

  const alpha = state.presence * (state.isSelected ? 0.92 : state.isHovered ? 0.62 : 0.38);
  const bright = state.isSelected ? 1.08 + state.emerge * 0.18 : state.isHovered ? 0.95 : 0.78;
  const contrast = state.isSelected ? 1.02 + state.emerge * 0.08 : 0.9;
  const saturate = state.isSelected ? 1.05 + state.emerge * 0.12 : 0.82;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.filter = `brightness(${bright}) contrast(${contrast}) saturate(${saturate})`;
  ctx.drawImage(canvas, -w / 2, -h / 2, w, h);
  ctx.filter = "none";
  ctx.restore();
}

function enhanceSprite(sprite, thumbnails, id) {
  const source = thumbnails?.getMini?.(id);
  if (!source) return sprite;

  try {
    sprite.featheredCanvas = buildFeatheredSkyCanvas(source);
    sprite.hasSkyImage = true;
  } catch {
    /* fallback: glow only */
  }
  return sprite;
}

/**
 * @param {import('nova://engine/scripts/mission-map/app.js').ObservatoryApp} app
 */
export function installDesktopSkyEnhancement(app) {
  if (!app?.renderer || !app?.thumbnails) return () => {};

  const renderer = app.renderer;
  const thumbnails = app.thumbnails;
  const origGlow = renderer.drawSkyObjectGlow.bind(renderer);
  const origDraw = renderer.drawSuspendedTarget.bind(renderer);
  const origSetSprites = renderer.setSprites.bind(renderer);

  function enhanceAll(sprites) {
    if (!sprites) return sprites;
    for (const [id, sprite] of sprites) {
      enhanceSprite(sprite, thumbnails, id);
    }
    return sprites;
  }

  renderer.setSprites = (sprites) => {
    origSetSprites(enhanceAll(sprites));
  };

  renderer.drawSuspendedTarget = function drawWithSkyImage(target) {
    const sprite = this.sprites.get(target.id);
    const feathered = sprite?.featheredCanvas;

    this.drawSkyObjectGlow = function patchedGlow(ctx, w, h, gr, gg, gb, ar, ag, ab, state, glowBase, glowMul) {
      origGlow.call(renderer, ctx, w, h, gr, gg, gb, ar, ag, ab, state, glowBase, glowMul);
      if (feathered) {
        drawFeatheredSkyImage(ctx, feathered, w, h, state);
      }
    };

    origDraw.call(this, target);
    renderer.drawSkyObjectGlow = origGlow;
  };

  enhanceAll(app.sprites);
  origSetSprites(app.sprites);

  const origRefresh = app.refreshSky.bind(app);
  app.refreshSky = function refreshWithSprites(...args) {
    origRefresh(...args);
    enhanceAll(app.sprites);
    origSetSprites(app.sprites);
  };

  return () => {
    renderer.setSprites = origSetSprites;
    renderer.drawSuspendedTarget = origDraw;
    renderer.drawSkyObjectGlow = origGlow;
    app.refreshSky = origRefresh;
  };
}
