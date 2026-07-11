import { altAzToSky, generateStarField } from "./projection.js";
import { RECOMMENDATION } from "../data/targets.js";

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
          radius: this.getTargetRadius(target),
          target,
          visible: pos.visible,
        };
      })
      .filter((p) => p.visible);
  }

  getTargetRadius(target) {
    const base = 10 + (7 - Math.min(target.magnitude, 7)) * 1.4;
    if (target.id === this.selectedId) return base + 6;
    if (target.id === this.hoveredId) return base + 3;
    return base;
  }

  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    this.drawDeepSky();
    this.drawMilkyWay();
    this.drawNebulae();
    this.drawHorizon();
    this.drawAltitudeGrid();
    this.drawConstellations();
    this.drawStars();
    this.drawTargets();
    this.drawSelectionLink();
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

  drawAltitudeGrid() {
    const { ctx, width } = this;
    for (const alt of [15, 30, 45, 60]) {
      const left = this.worldToScreen(alt, this.camera.azCenter - 70);
      const right = this.worldToScreen(alt, this.camera.azCenter + 70);
      if (!left.visible && !right.visible) continue;

      ctx.beginPath();
      ctx.moveTo(0, left.y);
      ctx.bezierCurveTo(width * 0.25, left.y - 2, width * 0.75, right.y - 2, width, right.y);
      ctx.strokeStyle = `rgba(158, 183, 204, ${alt === 30 ? 0.045 : 0.025})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
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
      this.drawLuminousTarget(target);
    }
  }

  drawLuminousTarget(target) {
    const { ctx, time } = this;
    const rec = RECOMMENDATION[target.recommendation];
    const pos = this.worldToScreen(target.alt, target.az);
    if (!pos.visible) return;

    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const inMission = this.missionIds.has(target.id);
    const radius = this.getTargetRadius(target);

    const pulseRate = target.recommendation === "recommended" ? 0.0012 : 0.0008;
    const pulse = 1 + Math.sin(time * pulseRate + target.az * 0.05) * (isSelected ? 0.12 : 0.06);
    const depthScale = 0.75 + pos.depth * 0.35;
    const r = radius * pulse * depthScale;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    const glowAlpha = isSelected ? 0.5 : isHovered ? 0.32 : 0.22;
    const outerR = r * (isSelected ? 4.5 : isHovered ? 3.2 : 2.6);
    const outerGlow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, outerR);
    const hex = rec.color;
    const rr = parseInt(hex.slice(1, 3), 16);
    const gg = parseInt(hex.slice(3, 5), 16);
    const bb = parseInt(hex.slice(5, 7), 16);
    outerGlow.addColorStop(0, `rgba(${rr}, ${gg}, ${bb}, ${glowAlpha})`);
    outerGlow.addColorStop(0.35, `rgba(${rr}, ${gg}, ${bb}, ${glowAlpha * 0.25})`);
    outerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      const callPulse = 1 + Math.sin(time * 0.002) * 0.15;
      const callR = r * 6 * callPulse;
      const call = ctx.createRadialGradient(0, 0, r, 0, 0, callR);
      call.addColorStop(0, "rgba(92, 199, 216, 0.08)");
      call.addColorStop(0.5, `${rec.color}06`);
      call.addColorStop(1, "transparent");
      ctx.fillStyle = call;
      ctx.beginPath();
      ctx.arc(0, 0, callR, 0, Math.PI * 2);
      ctx.fill();
    }

    const midGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
    midGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    midGlow.addColorStop(0.2, inMission ? "rgba(92, 199, 216, 0.85)" : rec.color);
    midGlow.addColorStop(0.55, `${rec.color}88`);
    midGlow.addColorStop(1, "transparent");
    ctx.fillStyle = midGlow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (isSelected || isHovered) {
      ctx.font = `${isSelected ? 600 : 500} ${isSelected ? 13 : 12}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const label = target.name;
      const tw = ctx.measureText(label).width;
      const lx = 0;
      const ly = -r - 14;
      ctx.fillStyle = "rgba(5, 7, 10, 0.72)";
      ctx.beginPath();
      ctx.roundRect(lx - tw / 2 - 10, ly - 18, tw + 20, 22, 8);
      ctx.fill();
      ctx.fillStyle = isSelected ? "#eef4f8" : "rgba(238, 244, 248, 0.85)";
      ctx.fillText(label, lx, ly);
    }

    ctx.restore();
  }

  drawSelectionLink() {
    if (!this.selectedId) return;
    const target = this.targets.find((t) => t.id === this.selectedId);
    if (!target) return;
    const pos = this.worldToScreen(target.alt, target.az);
    if (!pos.visible) return;

    const { ctx, width } = this;
    const cardEdgeX = width - 2;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.bezierCurveTo(pos.x + (cardEdgeX - pos.x) * 0.4, pos.y - 20, cardEdgeX - 80, pos.y, cardEdgeX, pos.y + 10);
    ctx.strokeStyle = "rgba(92, 199, 216, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
