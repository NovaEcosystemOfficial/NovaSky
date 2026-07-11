import { altAzToSky, generateStarField } from "./projection.js";
import { glowStrength } from "../ui/target-art.js";

const NEBULA_PATCHES = [
  { alt: 76, az: 285, rx: 0.14, ry: 0.06, color: [92, 140, 180], alpha: 0.07 },
  { alt: 68, az: 20, rx: 0.12, ry: 0.05, color: [180, 100, 140], alpha: 0.06 },
  { alt: 55, az: 100, rx: 0.1, ry: 0.04, color: [100, 180, 160], alpha: 0.05 },
  { alt: 30, az: 180, rx: 0.16, ry: 0.07, color: [200, 120, 80], alpha: 0.055 },
  { alt: 72, az: 350, rx: 0.18, ry: 0.08, color: [80, 160, 200], alpha: 0.08 },
  { alt: 62, az: 310, rx: 0.08, ry: 0.04, color: [140, 120, 200], alpha: 0.04 },
];

export class ObservatoryRenderer {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.targets = data.targets;
    this.constellations = data.constellations;
    this.thumbnails = data.thumbnails;
    this.stars = generateStarField(480, 7);
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.camera = { azCenter: 25, fov: 118, zoom: 1, lift: 0 };
    this.hoveredId = null;
    this.selectedId = null;
    this.missionIds = new Set();
    this.filterRecommendedOnly = false;
    this.time = 0;
    this.resize();
  }

  setFilterRecommended(active) {
    this.filterRecommendedOnly = active;
  }

  get visibleTargets() {
    if (!this.filterRecommendedOnly) return this.targets;
    return this.targets.filter((t) => t.recommendation === "recommended");
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

  worldToScreen(alt, az) {
    const sky = altAzToSky(alt, az, this.camera);
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
        const pos = this.worldToScreen(target.alt, target.az);
        return {
          id: target.id,
          sx: pos.x,
          sy: pos.y,
          radius: this.getPreviewSize(target) * 0.52,
          target,
          visible: pos.visible,
        };
      })
      .filter((p) => p.visible);
  }

  getTargetRadius(target) {
    const base = this.getPreviewSize(target) * 0.55;
    if (target.id === this.selectedId) return base * 1.2;
    if (target.id === this.hoveredId) return base * 1.05;
    return base;
  }

  getPreviewSize(target) {
    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const depth = 0.85 + (target.alt / 90) * 0.15;
    let size = 40 * depth;
    if (isSelected) size = 58 * depth;
    else if (isHovered) size = 46 * depth;
    return size;
  }

  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    this.drawDeepSky();
    this.drawMilkyWay();
    this.drawNebulae();
    this.drawHorizon();
    this.drawConstellations();
    this.drawStars();
    this.drawSkyDim();
    this.drawTargets();
  }

  drawDeepSky() {
    const { ctx, width, height } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#060810");
    grad.addColorStop(0.35, "#05070a");
    grad.addColorStop(0.75, "#040608");
    grad.addColorStop(1, "#030406");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.55, height * 0.2, 0, width * 0.5, height * 0.35, width * 0.7);
    glow.addColorStop(0, "rgba(30, 40, 60, 0.35)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  drawMilkyWay() {
    const { ctx, width, height, time } = this;
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const drift = Math.sin(time * 0.00008) * 0.01;
    const cx = width * (0.42 + drift);
    const cy = height * 0.38;

    const band = ctx.createLinearGradient(cx - width * 0.5, cy, cx + width * 0.5, cy + height * 0.3);
    band.addColorStop(0, "transparent");
    band.addColorStop(0.25, "rgba(140, 160, 200, 0.025)");
    band.addColorStop(0.45, "rgba(200, 210, 230, 0.055)");
    band.addColorStop(0.55, "rgba(180, 190, 220, 0.05)");
    band.addColorStop(0.75, "rgba(120, 140, 180, 0.03)");
    band.addColorStop(1, "transparent");

    ctx.translate(cx, cy);
    ctx.rotate(-0.55);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, width, height);

    const core = ctx.createRadialGradient(width * 0.48, height * 0.42, 0, width * 0.48, height * 0.42, width * 0.22);
    core.addColorStop(0, "rgba(220, 225, 240, 0.04)");
    core.addColorStop(0.4, "rgba(160, 170, 200, 0.025)");
    core.addColorStop(1, "transparent");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  drawNebulae() {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const patch of NEBULA_PATCHES) {
      const pos = this.worldToScreen(patch.alt, patch.az);
      if (!pos.visible) continue;
      const [r, g, b] = patch.color;
      const breathe = 1 + Math.sin(this.time * 0.0006 + patch.az) * 0.04;
      const rx = this.width * patch.rx * breathe * (0.6 + pos.depth * 0.4);
      const ry = this.height * patch.ry * breathe;

      const neb = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, rx);
      neb.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${patch.alpha * pos.depth})`);
      neb.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${patch.alpha * 0.35 * pos.depth})`);
      neb.addColorStop(1, "transparent");
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, rx, ry, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHorizon() {
    const { ctx, width, height } = this;
    const y = height * 0.93;

    const haze = ctx.createLinearGradient(0, y - 80, 0, height);
    haze.addColorStop(0, "transparent");
    haze.addColorStop(0.5, "rgba(20, 25, 35, 0.25)");
    haze.addColorStop(1, "rgba(5, 7, 10, 0.85)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, y - 80, width, height - y + 80);

    ctx.beginPath();
    ctx.moveTo(0, y + 2);
    ctx.bezierCurveTo(width * 0.25, y - 8, width * 0.75, y + 12, width, y + 2);
    ctx.strokeStyle = "rgba(174, 185, 197, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawConstellations() {
    const { ctx } = this;
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = "rgba(174, 185, 197, 0.09)";
    ctx.lineCap = "round";

    for (const constellation of this.constellations) {
      const points = constellation.lines
        .map(([alt, az]) => this.worldToScreen(alt, az))
        .filter((p) => p.visible);
      if (points.length < 2) continue;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  }

  drawStars() {
    const { ctx, time } = this;
    const layers = [0.35, 0.65, 1];

    for (const star of this.stars) {
      const pos = this.worldToScreen(star.alt, star.az);
      if (!pos.visible) continue;

      const breathe = 0.7 + Math.sin(time * 0.0008 + star.phase) * 0.3;
      const layerScale = layers[star.layer];
      const brightness = (6 - star.mag) / 6;
      const alpha = brightness * 0.55 * breathe * layerScale * (0.4 + pos.depth * 0.6);
      const size = (star.mag < 2 ? 1.6 : star.mag < 4 ? 1.1 : 0.7) * layerScale;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(238, 244, 248, ${Math.min(0.85, alpha)})`;
      ctx.fill();

      if (star.mag < 2.5) {
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 4);
        glow.addColorStop(0, `rgba(200, 220, 240, ${alpha * 0.25})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawSkyDim() {
    if (!this.selectedId && !this.hoveredId) return;
    const { ctx, width, height } = this;
    const alpha = this.selectedId ? 0.38 : 0.18;
    ctx.fillStyle = `rgba(3, 5, 8, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  drawTargets() {
    const sorted = [...this.visibleTargets].sort((a, b) => {
      const score = (t) => {
        let s = t.alt;
        if (t.id === this.selectedId) s += 200;
        if (t.id === this.hoveredId) s += 100;
        return s;
      };
      return score(a) - score(b);
    });

    for (const target of sorted) {
      if (target.id !== this.selectedId) {
        this.drawFloatingPreview(target);
      }
    }
    const selected = sorted.find((t) => t.id === this.selectedId);
    if (selected) this.drawFloatingPreview(selected);
  }

  drawFloatingPreview(target) {
    const { ctx, time, thumbnails } = this;
    const thumb = thumbnails?.getMini(target.id);
    const pos = this.worldToScreen(target.alt, target.az);
    if (!pos.visible) return;

    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const inMission = this.missionIds.has(target.id);
    const hasFocus = Boolean(this.selectedId || this.hoveredId);

    const pw = this.getPreviewSize(target);
    const ph = pw * 0.72;
    const seed = target.id.charCodeAt(0);
    const floatY = Math.sin(time * 0.00085 + seed) * (isSelected ? 2 : 4);
    const floatX = Math.cos(time * 0.0006 + seed * 0.7) * 1.5;

    const alpha =
      hasFocus && !isSelected && !isHovered
        ? 0.42
        : isSelected
          ? 1
          : isHovered
            ? 0.92
            : 0.78;

    ctx.save();
    ctx.translate(pos.x + floatX, pos.y + floatY);
    ctx.globalAlpha = alpha;

    const glow = glowStrength(target) * (isSelected ? 1.35 : 1);
    const [c1, c2] = target.preview;
    const glowR = pw * (isSelected ? 1.8 : 1.35);
    const outer = ctx.createRadialGradient(0, 0, pw * 0.2, 0, 0, glowR);
    outer.addColorStop(0, `${c2}${Math.round(glow * 90).toString(16).padStart(2, "0")}`);
    outer.addColorStop(0.45, `${c1}22`);
    outer.addColorStop(1, "transparent");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.ellipse(0, 0, glowR, glowR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    const r = 10;
    const x0 = -pw / 2;
    const y0 = -ph / 2;

    ctx.shadowColor = isSelected ? "rgba(92, 199, 216, 0.35)" : "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = isSelected ? 28 : 14;
    ctx.shadowOffsetY = isSelected ? 0 : 6;

    ctx.beginPath();
    ctx.roundRect(x0, y0, pw, ph, r);
    ctx.fillStyle = "rgba(8, 10, 14, 0.92)";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (thumb) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0, y0, pw, ph, r);
      ctx.clip();
      ctx.drawImage(thumb, x0, y0, pw, ph);
      ctx.restore();
    }

    ctx.strokeStyle = isSelected
      ? "rgba(92, 199, 216, 0.55)"
      : isHovered
        ? "rgba(238, 244, 248, 0.28)"
        : "rgba(238, 244, 248, 0.12)";
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(x0, y0, pw, ph, r);
    ctx.stroke();

    if (inMission) {
      ctx.beginPath();
      ctx.arc(pw / 2 - 8, -ph / 2 + 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#5cc7d8";
      ctx.fill();
      ctx.strokeStyle = "rgba(5, 7, 10, 0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (isSelected || isHovered) {
      ctx.font = `500 11px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(238, 244, 248, 0.9)";
      ctx.fillText(target.name, 0, ph / 2 + 10);
    }

    ctx.restore();
  }
}
