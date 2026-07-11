import { altAzToMap } from "./projection.js";
import { RECOMMENDATION } from "../data/targets.js";

const CARDINAL = [
  { label: "N", az: 0 },
  { label: "E", az: 90 },
  { label: "S", az: 180 },
  { label: "W", az: 270 },
];

export class SkyRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ targets: import('../data/targets.js').TARGETS, stars: number[][], constellations: object[] }} data
   */
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.targets = data.targets;
    this.stars = data.stars;
    this.constellations = data.constellations;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.camera = { x: 0.5, y: 0.5, zoom: 1 };
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

  setCamera(camera) {
    this.camera = { ...this.camera, ...camera };
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

  /** @returns {Array<{ id: string, sx: number, sy: number, radius: number }>} */
  getTargetScreenPositions() {
    const positions = [];
    for (const target of this.visibleTargets) {
      const pos = this.worldToScreen(target.alt, target.az);
      positions.push({
        id: target.id,
        sx: pos.x,
        sy: pos.y,
        radius: this.getMarkerRadius(target),
        target,
      });
    }
    return positions;
  }

  worldToScreen(alt, az) {
    const map = altAzToMap(alt, az);
    const size = Math.min(this.width, this.height);
    const cx = this.width / 2;
    const cy = this.height / 2;
    const scale = size * 0.88 * this.camera.zoom;
    const wx = (map.x - 0.5) * scale + cx + (this.camera.x - 0.5) * scale;
    const wy = (map.y - 0.5) * scale + cy + (this.camera.y - 0.5) * scale;
    return { x: wx, y: wy, mapR: map.r };
  }

  getMarkerRadius(target) {
    const base = 14 + (8 - Math.min(target.magnitude, 8)) * 1.2;
    if (target.id === this.selectedId) return base + 4;
    if (target.id === this.hoveredId) return base + 2;
    return base;
  }

  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    this.drawAtmosphere();
    this.drawGrid();
    this.drawHorizon();
    this.drawCardinals();
    this.drawConstellations();
    this.drawBackgroundStars();
    this.drawTargets();
    this.drawZenithMarker();
  }

  drawAtmosphere() {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.48;

    const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.15);
    grad.addColorStop(0, "rgba(92, 199, 216, 0.06)");
    grad.addColorStop(0.45, "rgba(5, 7, 10, 0.2)");
    grad.addColorStop(1, "rgba(5, 7, 10, 0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const vignette = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.3);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  drawGrid() {
    const { ctx, width, height, camera } = this;
    const cx = width / 2;
    const cy = height / 2;
    const size = Math.min(width, height) * 0.88 * camera.zoom;

    ctx.save();
    ctx.translate(cx + (camera.x - 0.5) * size, cy + (camera.y - 0.5) * size);

    for (let alt = 30; alt <= 60; alt += 30) {
      const r = ((90 - alt) / 90) * size * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(158, 183, 204, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let az = 0; az < 360; az += 45) {
      const theta = (az - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(theta) * size * 0.5, Math.sin(theta) * size * 0.5);
      ctx.strokeStyle = "rgba(158, 183, 204, 0.04)";
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHorizon() {
    const { ctx, width, height, camera } = this;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.44 * camera.zoom;

    ctx.beginPath();
    ctx.arc(
      cx + (camera.x - 0.5) * r * 2,
      cy + (camera.y - 0.5) * r * 2,
      r,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = "rgba(92, 199, 216, 0.18)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      cx + (camera.x - 0.5) * r * 2,
      cy + (camera.y - 0.5) * r * 2,
      r - 1,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = "rgba(231, 184, 90, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawCardinals() {
    const { ctx } = this;
    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const { label, az } of CARDINAL) {
      const pos = this.worldToScreen(3, az);
      ctx.fillStyle = label === "N" ? "rgba(231, 184, 90, 0.75)" : "rgba(174, 185, 197, 0.45)";
      ctx.fillText(label, pos.x, pos.y);
    }
  }

  drawConstellations() {
    const { ctx } = this;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(174, 185, 197, 0.12)";
    ctx.lineCap = "round";

    for (const constellation of this.constellations) {
      const points = constellation.lines.map(([alt, az]) => this.worldToScreen(alt, az));
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  }

  drawBackgroundStars() {
    const { ctx } = this;
    for (let i = 0; i < this.stars.length; i++) {
      const [alt, az] = this.stars[i];
      const pos = this.worldToScreen(alt, az);
      const twinkle = 0.55 + Math.sin(this.time * 0.001 + i * 0.7) * 0.15;
      const size = i % 7 === 0 ? 1.4 : 0.9;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(238, 244, 248, ${0.12 * twinkle})`;
      ctx.fill();
    }
  }

  drawZenithMarker() {
    const { ctx } = this;
    const zenith = this.worldToScreen(90, 0);
    ctx.beginPath();
    ctx.arc(zenith.x, zenith.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(92, 199, 216, 0.35)";
    ctx.fill();
  }

  drawTargets() {
    const sorted = [...this.visibleTargets].sort((a, b) => {
      const selA = a.id === this.selectedId ? 1 : 0;
      const selB = b.id === this.selectedId ? 1 : 0;
      if (selA !== selB) return selA - selB;
      const hovA = a.id === this.hoveredId ? 1 : 0;
      const hovB = b.id === this.hoveredId ? 1 : 0;
      return hovA - hovB;
    });

    for (const target of sorted) {
      this.drawTargetMarker(target);
    }
  }

  drawTargetMarker(target) {
    const { ctx, time } = this;
    const rec = RECOMMENDATION[target.recommendation];
    const pos = this.worldToScreen(target.alt, target.az);
    const radius = this.getMarkerRadius(target);
    const isSelected = target.id === this.selectedId;
    const isHovered = target.id === this.hoveredId;
    const inMission = this.missionIds.has(target.id);
    const pulse =
      target.recommendation === "recommended"
        ? 1 + Math.sin(time * 0.003) * 0.08
        : 1;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (isSelected || isHovered) {
      const glowR = radius * 2.2 * pulse;
      const glow = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, glowR);
      glow.addColorStop(0, rec.glow);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10, 13, 18, 0.88)";
    ctx.fill();
    ctx.strokeStyle = rec.color;
    ctx.lineWidth = isSelected ? 2.5 : 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = inMission ? "#5cc7d8" : rec.color;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.35, radius * 0.55, -0.35, 0, Math.PI * 2);
    ctx.strokeStyle = `${rec.color}55`;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (inMission) {
      ctx.beginPath();
      ctx.arc(radius * 0.75, -radius * 0.75, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#5cc7d8";
      ctx.fill();
    }

    if (isHovered || isSelected) {
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const label = target.name;
      const tw = ctx.measureText(label).width;
      const lx = radius + 10;
      const ly = -2;
      ctx.fillStyle = "rgba(10, 13, 18, 0.82)";
      ctx.beginPath();
      ctx.roundRect(lx - 6, ly - 11, tw + 12, 22, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(92, 199, 216, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#eef4f8";
      ctx.fillText(label, lx, ly);
    }

    ctx.restore();
  }
}
