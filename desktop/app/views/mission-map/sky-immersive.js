/**
 * Desktop-only: cielo immersivo calmo — PNG sfumati + focus notte.
 * Nessuna modifica al motore website/. Reversibile al teardown.
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

  /* Immersivo: non-selezionati più quieti, selezionato più presente */
  const alpha = state.presence * (state.isSelected ? 0.95 : state.isHovered ? 0.55 : 0.26);
  const bright = state.isSelected ? 1.1 + state.emerge * 0.2 : state.isHovered ? 0.92 : 0.72;
  const contrast = state.isSelected ? 1.04 + state.emerge * 0.08 : 0.88;
  const saturate = state.isSelected ? 1.08 + state.emerge * 0.1 : 0.78;

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
 * Focus notte più deciso: il cielo intorno al target si quieta.
 */
function patchSkyDim(renderer, origSkyDim) {
  renderer.drawSkyDim = function immersiveSkyDim() {
    const dim = this.anim.skyDim;
    if (dim < 0.01) {
      origSkyDim.call(this);
      return;
    }

    const { ctx, width, height } = this;
    ctx.save();

    if (this.selectedId) {
      const target = this.targets.find((t) => t.id === this.selectedId);
      if (target) {
        const pos = this.worldToScreen(target.alt, target.az, 2, this.targetParallaxAz(target));
        if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
          const r = Math.max(width, height) * 0.82;
          const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
          g.addColorStop(0, `rgba(2, 4, 8, ${0.02 * dim})`);
          g.addColorStop(0.28, `rgba(2, 4, 8, ${0.18 * dim})`);
          g.addColorStop(0.62, `rgba(2, 4, 8, ${0.36 * dim})`);
          g.addColorStop(1, `rgba(2, 4, 8, ${0.52 * dim})`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
          return;
        }
      }
    }

    ctx.restore();
    origSkyDim.call(this);
  };
}

/**
 * Orizzonte leggermente più caldo — atmosfera, non atlante.
 */
function patchHorizon(renderer, origHorizon) {
  renderer.drawHorizon = function immersiveHorizon() {
    origHorizon.call(this);
    const { ctx, width, height } = this;
    const y = height * 0.88;
    ctx.save();
    const warm = ctx.createLinearGradient(0, y, 0, height);
    warm.addColorStop(0, "transparent");
    warm.addColorStop(0.55, "rgba(28, 22, 18, 0.06)");
    warm.addColorStop(1, "rgba(8, 6, 5, 0.18)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, y, width, height - y);

    const glow = ctx.createRadialGradient(width * 0.5, height * 0.98, 0, width * 0.5, height, width * 0.55);
    glow.addColorStop(0, "rgba(70, 90, 120, 0.07)");
    glow.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    ctx.restore();
  };
}

/**
 * Costellazioni quasi invisibili — non stile Stellarium.
 */
function patchConstellations(renderer, origConstellations) {
  renderer.drawConstellations = function immersiveConstellations() {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.35;
    origConstellations.call(this);
    ctx.restore();
  };
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
  const origSkyDim = renderer.drawSkyDim.bind(renderer);
  const origHorizon = renderer.drawHorizon.bind(renderer);
  const origConstellations = renderer.drawConstellations.bind(renderer);

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

  patchSkyDim(renderer, origSkyDim);
  patchHorizon(renderer, origHorizon);
  patchConstellations(renderer, origConstellations);

  renderer.drawSuspendedTarget = function drawWithSkyImage(target) {
    const sprite = this.sprites.get(target.id);
    const feathered = sprite?.featheredCanvas;

    this.drawSkyObjectGlow = function patchedGlow(ctx, w, h, gr, gg, gb, ar, ag, ab, state, glowBase, glowMul) {
      const quietMul = state.isSelected ? 1.05 : state.isHovered ? 0.85 : 0.55;
      origGlow.call(renderer, ctx, w, h, gr, gg, gb, ar, ag, ab, state, glowBase, glowMul * quietMul);
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
    renderer.drawSkyDim = origSkyDim;
    renderer.drawHorizon = origHorizon;
    renderer.drawConstellations = origConstellations;
    app.refreshSky = origRefresh;
  };
}
