import { altAzToSky, generateStarField } from "./projection.js";
import { getCategory } from "../data/categories.js";
import { glowStrength } from "../ui/target-art.js";
import { mixRgb, easeOutCubic } from "../ui/target-sprite.js";

const MILKY_CLOUDS = [
  { alt: 55, az: 310, rx: 0.22, ry: 0.09, alpha: 0.045 },
  { alt: 62, az: 340, rx: 0.18, ry: 0.07, alpha: 0.038 },
  { alt: 48, az: 280, rx: 0.15, ry: 0.06, alpha: 0.032 },
  { alt: 38, az: 250, rx: 0.2, ry: 0.08, alpha: 0.028 },
];

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export class ObservatoryRenderer {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.targets = data.targets;
    this.constellations = data.constellations ?? [];
    this.thumbnails = data.thumbnails;
    this.sprites = data.sprites ?? new Map();
    this.stars = generateStarField(2800, 11);
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.camera = { azCenter: 25, fov: 118, zoom: 1, lift: 0 };
    this.hoveredId = null;
    this.selectedId = null;
    this.missionIds = new Set();
    this.time = 0;
    this.cardAnchor = null;
    this.anim = {
      skyDim: 0,
      emerge: 0,
      lastSelectedId: null,
    };
    this.resize();
  }

  setSprites(sprites) {
    this.sprites = sprites;
  }

  setTargets(targets) {
    this.targets = targets;
    if (this.selectedId && !targets.find((t) => t.id === this.selectedId)) {
      this.selectedId = null;
    }
  }

  setCardAnchor(point) {
    this.cardAnchor = point;
  }

  get visibleTargets() {
    return this.targets;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setCamera(patch) {
    this.camera = { ...this.camera, ...patch };
    this.camera.azCenter = finiteOr(this.camera.azCenter, 25);
    this.camera.zoom = Math.min(2.2, Math.max(0.7, finiteOr(this.camera.zoom, 1)));
    this.camera.fov = finiteOr(this.camera.fov, 118);
    this.camera.lift = finiteOr(this.camera.lift, 0);
  }

  setHovered(id) {
    this.hoveredId = id;
  }

  setSelected(id) {
    if (id !== this.selectedId) {
      this.anim.emerge = 0;
      this.anim.lastSelectedId = id;
    }
    this.selectedId = id;
  }

  setMission(ids) {
    this.missionIds = new Set(ids);
  }

  tick(dt) {
    this.time += dt;
    const dimTarget = this.selectedId ? 1 : 0;
    this.anim.skyDim += (dimTarget - this.anim.skyDim) * Math.min(1, dt * 0.0028);
    if (this.selectedId) {
      this.anim.emerge = Math.min(1, this.anim.emerge + dt * 0.0016);
    } else {
      this.anim.emerge = Math.max(0, this.anim.emerge - dt * 0.003);
    }
  }

  parallaxShift(layer) {
    const delta = this.camera.azCenter - 25;
    const factors = [0.12, 0.06, 0.025];
    return delta * factors[layer];
  }

  targetParallaxAz(target) {
    const sprite = this.sprites.get(target.id);
    const factor = finiteOr(sprite?.parallax, 0.035);
    return (this.camera.azCenter - 25) * factor;
  }

  worldToScreen(alt, az, layer = 1, extraAz = 0) {
    const safeAlt = finiteOr(alt, 0);
    const safeAz = finiteOr(az, 0) + finiteOr(extraAz, 0);
    const parallax = this.parallaxShift(layer === 0 ? 0 : layer === 1 ? 1 : 2);
    const sky = altAzToSky(safeAlt, safeAz + parallax, this.camera);
    return {
      x: finiteOr(sky.x, 0.5) * this.width,
      y: finiteOr(sky.y, 0.5) * this.height,
      depth: finiteOr(sky.depth, 0.5),
      visible: sky.visible && Number.isFinite(sky.x) && Number.isFinite(sky.y),
    };
  }

  getTargetScreenPositions() {
    return this.visibleTargets
      .map((target) => {
        const pos = this.worldToScreen(target.alt, target.az, 2, this.targetParallaxAz(target));
        const size = this.getTargetSize(target);
        return {
          id: target.id,
          sx: pos.x,
          sy: pos.y,
          radius: size * 0.62,
          target,
          visible: pos.visible,
        };
      })
      .filter((p) => p.visible);
  }

  getTargetSize(target) {
    const sprite = this.sprites.get(target.id);
    const alt = finiteOr(target.alt, 45);
    let depth = finiteOr(sprite?.depth, 0.88 + (alt / 90) * 0.12);
    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const bias = finiteOr(sprite?.scaleBias, 1);
    let base = 50 * depth * bias;
    if (isSelected) base = 66 * depth * bias;
    else if (isHovered) base = 56 * depth * bias;
    return finiteOr(base, 50);
  }

  breathingScale(sprite, isSelected) {
    const phase = sprite?.phase ?? 0;
    const amp = isSelected ? 0.028 : 0.022;
    return 1 + Math.sin(this.time * 0.001 + phase) * amp;
  }

  targetVisualState(target) {
    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const hasSelection = Boolean(this.selectedId);
    const emerge = isSelected ? easeOutCubic(this.anim.emerge) : 0;

    let presence = 1;
    if (hasSelection && !isSelected) presence = 0.38;
    else if (isHovered && !isSelected) presence = 0.62;

    let brightness = 0.82;
    let contrast = 0.88;
    let saturate = 0.78;

    if (isHovered && !isSelected) {
      brightness = 0.92;
      contrast = 0.94;
      saturate = 0.88;
    }

    if (isSelected) {
      const e = emerge;
      presence = 0.15 + e * 0.85;
      brightness = 0.55 + e * 0.52;
      contrast = 0.82 + e * 0.2;
      saturate = 0.65 + e * 0.38;
    }

    return { isSelected, isHovered, hasSelection, emerge, presence, brightness, contrast, saturate };
  }

  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    this.drawCosmicBackground();
    this.drawMilkyWay();
    this.drawMilkyClouds();
    this.drawHorizon();
    this.drawConstellations();
    this.drawStarLayer(0);
    this.drawStarLayer(1);
    this.drawStarLayer(2);
    this.drawSkyDim();
    this.drawTargets();
    this.drawConnectionLine();
  }

  drawCosmicBackground() {
    const { ctx, width, height } = this;
    const g = ctx.createLinearGradient(0, 0, width * 0.3, height);
    g.addColorStop(0, "#04060c");
    g.addColorStop(0.35, "#05070a");
    g.addColorStop(0.7, "#030508");
    g.addColorStop(1, "#020305");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    const nebula = ctx.createRadialGradient(width * 0.62, height * 0.18, 0, width * 0.55, height * 0.35, width * 0.85);
    nebula.addColorStop(0, "rgba(35, 45, 75, 0.28)");
    nebula.addColorStop(0.45, "rgba(20, 28, 48, 0.12)");
    nebula.addColorStop(1, "transparent");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    const warm = ctx.createRadialGradient(width * 0.15, height * 0.75, 0, width * 0.15, height * 0.75, width * 0.45);
    warm.addColorStop(0, "rgba(40, 25, 18, 0.08)");
    warm.addColorStop(1, "transparent");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, width, height);
  }

  drawMilkyWay() {
    const { ctx, width, height, time } = this;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const drift = Math.sin(time * 0.00005) * 8;
    const cx = width * 0.46 + drift;
    const cy = height * 0.36;

    ctx.translate(cx, cy);
    ctx.rotate(-0.52);
    ctx.translate(-cx, -cy);

    const band = ctx.createLinearGradient(0, cy - 40, width, cy + 120);
    band.addColorStop(0, "transparent");
    band.addColorStop(0.2, "rgba(130, 150, 190, 0.018)");
    band.addColorStop(0.42, "rgba(210, 218, 235, 0.055)");
    band.addColorStop(0.52, "rgba(190, 200, 225, 0.048)");
    band.addColorStop(0.72, "rgba(120, 140, 180, 0.025)");
    band.addColorStop(1, "transparent");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  drawMilkyClouds() {
    const { ctx, time } = this;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const cloud of MILKY_CLOUDS) {
      const pos = this.worldToScreen(cloud.alt, cloud.az, 0);
      if (!pos.visible) continue;
      const breathe = 1 + Math.sin(time * 0.0004 + cloud.az) * 0.03;
      const rx = this.width * cloud.rx * breathe;
      const ry = this.height * cloud.ry * breathe;
      const neb = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, rx);
      neb.addColorStop(0, `rgba(200, 210, 230, ${cloud.alpha})`);
      neb.addColorStop(0.6, `rgba(160, 175, 210, ${cloud.alpha * 0.35})`);
      neb.addColorStop(1, "transparent");
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, rx, ry, -0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHorizon() {
    const { ctx, width, height } = this;
    const y = height * 0.935;
    const haze = ctx.createLinearGradient(0, y - 100, 0, height);
    haze.addColorStop(0, "transparent");
    haze.addColorStop(0.55, "rgba(12, 16, 22, 0.35)");
    haze.addColorStop(1, "rgba(2, 3, 5, 0.92)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, y - 100, width, height - y + 100);
  }

  drawConstellations() {
    const { ctx } = this;
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "rgba(174, 185, 197, 0.07)";
    ctx.lineCap = "round";
    for (const constellation of this.constellations) {
      const points = constellation.lines
        .map(([alt, az]) => this.worldToScreen(alt, az, 1))
        .filter((p) => p.visible);
      if (points.length < 2) continue;
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }

  drawStarLayer(layerIndex) {
    const { ctx, time } = this;
    const parallaxFactors = [0.35, 0.65, 1];

    for (const star of this.stars) {
      if (star.layer !== layerIndex) continue;
      const pos = this.worldToScreen(star.alt, star.az, star.layer);
      if (!pos.visible) continue;

      const twinkle = 0.65 + Math.sin(time * 0.0007 + star.phase) * 0.35;
      const brightness = Math.max(0.08, (7 - star.mag) / 7);
      const alpha = brightness * 0.7 * twinkle * parallaxFactors[layerIndex] * (0.35 + pos.depth * 0.65);
      const size = (star.mag < 1.8 ? 1.8 : star.mag < 3.5 ? 1.15 : star.mag < 5 ? 0.75 : 0.45) * parallaxFactors[layerIndex];

      let color = "238, 244, 248";
      if (star.tint === "warm") color = "255, 230, 210";
      if (star.tint === "cool") color = "200, 220, 255";

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${Math.min(0.9, alpha)})`;
      ctx.fill();
    }
  }

  drawSkyDim() {
    const dim = this.anim.skyDim;
    if (dim < 0.01) return;

    const { ctx, width, height } = this;
    ctx.save();

    if (this.selectedId) {
      const target = this.targets.find((t) => t.id === this.selectedId);
      if (target) {
        const pos = this.worldToScreen(target.alt, target.az, 2, this.targetParallaxAz(target));
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
          ctx.fillStyle = `rgba(2, 4, 8, ${0.38 * dim})`;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
          return;
        }
        const r = Math.max(width, height) * 0.75;
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
        g.addColorStop(0, `rgba(2, 4, 8, ${0.05 * dim})`);
        g.addColorStop(0.4, `rgba(2, 4, 8, ${0.24 * dim})`);
        g.addColorStop(1, `rgba(2, 4, 8, ${0.42 * dim})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        return;
      }
    }

    ctx.fillStyle = `rgba(2, 4, 8, ${0.38 * dim})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  drawTargets() {
    const sorted = [...this.visibleTargets].sort((a, b) => {
      const da = this.sprites.get(a.id)?.depth ?? a.alt;
      const db = this.sprites.get(b.id)?.depth ?? b.alt;
      const safeA = Number.isFinite(da) ? da : a.alt;
      const safeB = Number.isFinite(db) ? db : b.alt;
      return safeA - safeB;
    });
    for (const target of sorted) {
      if (target.id !== this.selectedId) this.drawSuspendedTarget(target);
    }
    const selected = this.visibleTargets.find((t) => t.id === this.selectedId);
    if (selected) this.drawSuspendedTarget(selected);
  }

  drawSuspendedTarget(target) {
    const { ctx, time, thumbnails, sprites } = this;
    const sprite = sprites.get(target.id);
    const img = sprite?.canvas ?? thumbnails?.getMini(target.id);
    const pos = this.worldToScreen(target.alt, target.az, 2, this.targetParallaxAz(target));
    if (!pos.visible || !img) return;

    const state = this.targetVisualState(target);
    const cat = getCategory(target);
    const glowRgb = mixRgb(sprite?.glowRgb ?? cat.rgb, cat.rgb, 0.35);
    const [gr, gg, gb] = glowRgb;

    const breath = this.breathingScale(sprite, state.isSelected);
    const baseSize = this.getTargetSize(target);
    const emergeScale = state.isSelected ? 0.88 + state.emerge * 0.14 : 1;
    const size = baseSize * breath * emergeScale;
    const aspect = img.height / img.width;
    const w = size;
    const h = size * aspect;

    const phase = sprite?.phase ?? 0;
    const floatY = Math.sin(time * 0.00065 + phase) * 2.5 * (0.6 + pos.depth * 0.4);
    const floatX = Math.cos(time * 0.00048 + phase * 0.7) * 1.8;
    const tilt = (sprite?.tilt ?? 0) + Math.sin(time * 0.0003 + phase) * 0.006;

    ctx.save();
    ctx.translate(pos.x + floatX, pos.y + floatY);
    ctx.rotate(tilt);

    const glowBase = glowStrength(target);
    const glowMul = state.isSelected ? 1.35 + state.emerge * 0.55 : state.isHovered ? 1.08 : 0.75;

    // Cosmic haze — wide soft veil behind object
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const hazeR = Math.max(w, h) * 1.85;
    const haze = ctx.createRadialGradient(0, 0, hazeR * 0.08, 0, 0, hazeR);
    haze.addColorStop(0, `rgba(190, 205, 230, ${0.06 * state.presence})`);
    haze.addColorStop(0.35, `rgba(${gr}, ${gg}, ${gb}, ${0.04 * state.presence})`);
    haze.addColorStop(1, "transparent");
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.ellipse(0, 0, hazeR, hazeR * 0.78, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dynamic multi-layer glow from dominant object colour
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glowR = Math.max(w, h) * (state.isSelected ? 1.75 : 1.35);
    const inner = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR * 0.55);
    inner.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${glowBase * 0.42 * glowMul * state.presence})`);
    inner.addColorStop(0.5, `rgba(${gr}, ${gg}, ${gb}, ${glowBase * 0.12 * glowMul * state.presence})`);
    inner.addColorStop(1, "transparent");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.ellipse(0, 0, glowR * 0.55, glowR * 0.42, 0.12, 0, Math.PI * 2);
    ctx.fill();

    const outer = ctx.createRadialGradient(0, 0, glowR * 0.2, 0, 0, glowR);
    outer.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${glowBase * 0.18 * glowMul * state.presence})`);
    outer.addColorStop(0.6, `rgba(${gr}, ${gg}, ${gb}, ${glowBase * 0.05 * glowMul * state.presence})`);
    outer.addColorStop(1, "transparent");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.ellipse(0, 0, glowR, glowR * 0.8, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Selected: soft luminous halo pulse — no hard orbit ring
    if (state.isSelected) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const pulse = 0.85 + Math.sin(time * 0.0012 + phase) * 0.15;
      const haloR = Math.max(w, h) * (0.95 + state.emerge * 0.25) * pulse;
      const halo = ctx.createRadialGradient(0, 0, haloR * 0.15, 0, 0, haloR);
      halo.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${0.22 * state.emerge})`);
      halo.addColorStop(0.55, `rgba(${gr}, ${gg}, ${gb}, ${0.06 * state.emerge})`);
      halo.addColorStop(1, "transparent");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(0, 0, haloR, haloR * 0.72, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Object image — screen blend: lo sfondo nero del PNG si fonde col cielo
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = state.presence * 0.92;
    ctx.filter = `brightness(${state.brightness}) contrast(${state.contrast}) saturate(${state.saturate})`;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // Subtle core luminance
    if (state.presence > 0.45) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const coreR = Math.min(w, h) * 0.12;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
      core.addColorStop(0, `rgba(255, 252, 248, ${0.12 * state.presence * (state.isSelected ? 1.2 : 0.7)})`);
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.missionIds.has(target.id)) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.beginPath();
      ctx.arc(w / 2 - 6, -h / 2 + 6, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(92, 199, 216, ${0.55 * state.presence})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  drawConnectionLine() {
    if (!this.selectedId || !this.cardAnchor) return;
    const target = this.targets.find((t) => t.id === this.selectedId);
    if (!target) return;
    const pos = this.worldToScreen(target.alt, target.az, 2, this.targetParallaxAz(target));
    if (!pos.visible) return;

    const { ctx } = this;
    const emerge = easeOutCubic(this.anim.emerge);
    const { x: tx, y: ty } = pos;
    const { x: cx, y: cy } = this.cardAnchor;

    ctx.save();
    ctx.globalAlpha = 0.08 + emerge * 0.14;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.bezierCurveTo(tx + (cx - tx) * 0.42, ty - 18, cx - 48, cy + 8, cx, cy);
    ctx.strokeStyle = "rgba(180, 210, 225, 0.9)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
}
