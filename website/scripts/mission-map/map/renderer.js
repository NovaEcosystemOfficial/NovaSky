import { altAzToSky, generateStarField } from "./projection.js";
import { getCategory } from "../data/categories.js";
import { glowStrength } from "../ui/target-art.js";

const MILKY_CLOUDS = [
  { alt: 55, az: 310, rx: 0.22, ry: 0.09, alpha: 0.045 },
  { alt: 62, az: 340, rx: 0.18, ry: 0.07, alpha: 0.038 },
  { alt: 48, az: 280, rx: 0.15, ry: 0.06, alpha: 0.032 },
  { alt: 38, az: 250, rx: 0.2, ry: 0.08, alpha: 0.028 },
];

export class ObservatoryRenderer {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.targets = data.targets;
    this.constellations = data.constellations;
    this.thumbnails = data.thumbnails;
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
    this.resize();
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
  }

  setHovered(id) {
    this.hoveredId = id;
  }

  setSelected(id) {
    this.selectedId = id;
  }

  setMission(ids) {
    this.missionIds = new Set(ids);
  }

  tick(dt) {
    this.time += dt;
  }

  parallaxShift(layer) {
    const delta = this.camera.azCenter - 25;
    const factors = [0.12, 0.06, 0.025];
    return delta * factors[layer];
  }

  worldToScreen(alt, az, layer = 1) {
    const parallax = this.parallaxShift(layer === 0 ? 0 : layer === 1 ? 1 : 2);
    const sky = altAzToSky(alt, az + parallax, this.camera);
    return {
      x: sky.x * this.width,
      y: sky.y * this.height,
      depth: sky.depth,
      visible: sky.visible,
    };
  }

  getTargetScreenPositions() {
    return this.visibleTargets
      .map((target) => {
        const pos = this.worldToScreen(target.alt, target.az, 2);
        const size = this.getTargetSize(target);
        return {
          id: target.id,
          sx: pos.x,
          sy: pos.y,
          radius: size * 0.55,
          target,
          visible: pos.visible,
        };
      })
      .filter((p) => p.visible);
  }

  getTargetSize(target) {
    const depth = 0.88 + (target.alt / 90) * 0.12;
    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    let base = 52 * depth;
    if (isSelected) base = 68 * depth;
    else if (isHovered) base = 58 * depth;
    return base;
  }

  breathingScale(seed, isSelected) {
    const amp = isSelected ? 0.045 : 0.04;
    return 1 + Math.sin(this.time * 0.0011 + seed * 0.13) * amp;
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
    if (!this.selectedId) return;
    const { ctx, width, height } = this;
    ctx.fillStyle = "rgba(2, 4, 7, 0.32)";
    ctx.fillRect(0, 0, width, height);
  }

  drawTargets() {
    const sorted = [...this.visibleTargets].sort((a, b) => a.alt - b.alt);
    for (const target of sorted) {
      if (target.id !== this.selectedId) this.drawSuspendedTarget(target);
    }
    const selected = this.visibleTargets.find((t) => t.id === this.selectedId);
    if (selected) this.drawSuspendedTarget(selected);
  }

  drawSuspendedTarget(target) {
    const { ctx, time, thumbnails } = this;
    const img = thumbnails?.getMini(target.id);
    const pos = this.worldToScreen(target.alt, target.az, 2);
    if (!pos.visible) return;

    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const hasSelection = Boolean(this.selectedId);
    const cat = getCategory(target);
    const [cr, cg, cb] = cat.rgb;
    const seed = seedFromId(target.id);

    const baseSize = this.getTargetSize(target);
    const breath = this.breathingScale(seed, isSelected);
    const size = baseSize * breath;
    const aspect = img ? img.height / img.width : 0.78;
    const w = size;
    const h = size * aspect;

    const floatY = Math.sin(time * 0.00075 + seed) * 3;
    const floatX = Math.cos(time * 0.00055 + seed * 0.6) * 2;

    const alpha = hasSelection && !isSelected ? 0.48 : isHovered && !isSelected ? 0.78 : 1;

    ctx.save();
    ctx.translate(pos.x + floatX, pos.y + floatY);
    ctx.globalAlpha = alpha;

    const glow = glowStrength(target) * (isSelected ? 1.4 : 1);
    const glowR = Math.max(w, h) * (isSelected ? 1.5 : 1.15);
    const outer = ctx.createRadialGradient(0, 0, size * 0.15, 0, 0, glowR);
    outer.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${glow * 0.55})`);
    outer.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, ${glow * 0.15})`);
    outer.addColorStop(1, "transparent");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.ellipse(0, 0, glowR, glowR * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      const orbitAngle = time * 0.00035;
      ctx.save();
      ctx.rotate(orbitAngle);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.72, h * 0.52, 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.45)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.82, h * 0.6, 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(92, 199, 216, 0.18)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    if (img) {
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }

    if (this.missionIds.has(target.id)) {
      ctx.beginPath();
      ctx.arc(w / 2 - 4, -h / 2 + 4, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#5cc7d8";
      ctx.fill();
    }

    ctx.restore();
  }

  drawConnectionLine() {
    if (!this.selectedId || !this.cardAnchor) return;
    const target = this.targets.find((t) => t.id === this.selectedId);
    if (!target) return;
    const pos = this.worldToScreen(target.alt, target.az, 2);
    if (!pos.visible) return;

    const { ctx } = this;
    const { x: tx, y: ty } = pos;
    const { x: cx, y: cy } = this.cardAnchor;

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.bezierCurveTo(tx + (cx - tx) * 0.45, ty - 12, cx - 40, cy, cx, cy);
    ctx.strokeStyle = "rgba(92, 199, 216, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}
