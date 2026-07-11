/** Pan, zoom, hover, click for the mission map canvas. */

export class MapController {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./renderer.js').SkyRenderer} renderer
   * @param {{ onSelect: (id: string|null) => void, onHover: (id: string|null) => void }} callbacks
   */
  constructor(canvas, renderer, callbacks) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.callbacks = callbacks;
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.selectedId = null;
    this.hoveredId = null;

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("dblclick", this.onDoubleClick);
  }

  destroy() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("dblclick", this.onDoubleClick);
  }

  onPointerDown = (event) => {
    this.isDragging = true;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.velocity = { x: 0, y: 0 };
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = "grabbing";
  };

  onPointerMove = (event) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isDragging) {
      const dx = event.clientX - this.lastPointer.x;
      const dy = event.clientY - this.lastPointer.y;
      this.velocity = { x: dx, y: dy };
      this.lastPointer = { x: event.clientX, y: event.clientY };

      const size = Math.min(this.renderer.width, this.renderer.height);
      const scale = size * 0.88 * this.renderer.camera.zoom;
      const cam = this.renderer.camera;
      this.renderer.setCamera({
        x: cam.x - dx / scale,
        y: cam.y - dy / scale,
      });
      return;
    }

    const hit = this.hitTest(x, y);
    const nextId = hit?.id ?? null;
    if (nextId !== this.hoveredId) {
      this.hoveredId = nextId;
      this.renderer.setHovered(nextId);
      this.callbacks.onHover(nextId);
      this.canvas.style.cursor = nextId ? "pointer" : "grab";
    }
  };

  onPointerUp = (event) => {
    const wasDrag = Math.hypot(this.velocity.x, this.velocity.y) > 4;
    this.isDragging = false;
    this.canvas.releasePointerCapture(event.pointerId);
    this.canvas.style.cursor = this.hoveredId ? "pointer" : "grab";

    if (!wasDrag) {
      const rect = this.canvas.getBoundingClientRect();
      const hit = this.hitTest(event.clientX - rect.left, event.clientY - rect.top);
      const nextId = hit?.id ?? null;
      this.selectedId = nextId;
      this.renderer.setSelected(nextId);
      this.callbacks.onSelect(nextId);
    }
  };

  onPointerLeave = () => {
    if (!this.isDragging) {
      this.hoveredId = null;
      this.renderer.setHovered(null);
      this.callbacks.onHover(null);
      this.canvas.style.cursor = "grab";
    }
  };

  onWheel = (event) => {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = (event.clientX - rect.left) / rect.width;
    const my = (event.clientY - rect.top) / rect.height;
    const delta = -event.deltaY * 0.0012;
    const cam = this.renderer.camera;
    const nextZoom = Math.min(2.4, Math.max(0.75, cam.zoom * (1 + delta)));

    this.renderer.setCamera({
      x: cam.x + (mx - 0.5) * (cam.zoom - nextZoom) * 0.15,
      y: cam.y + (my - 0.5) * (cam.zoom - nextZoom) * 0.15,
      zoom: nextZoom,
    });
  };

  onDoubleClick = () => {
    this.renderer.setCamera({ x: 0.5, y: 0.5, zoom: 1 });
  };

  /** @returns {{ id: string, target: object } | null} */
  hitTest(x, y) {
    const positions = this.renderer.getTargetScreenPositions();
    let closest = null;
    let closestDist = Infinity;

    for (const pos of positions) {
      const dist = Math.hypot(x - pos.sx, y - pos.sy);
      if (dist <= pos.radius + 6 && dist < closestDist) {
        closest = { id: pos.id, target: pos.target };
        closestDist = dist;
      }
    }
    return closest;
  }

  selectById(id) {
    this.selectedId = id;
    this.renderer.setSelected(id);
    this.callbacks.onSelect(id);
  }

  applyInertia() {
    if (Math.abs(this.velocity.x) < 0.3 && Math.abs(this.velocity.y) < 0.3) {
      this.velocity = { x: 0, y: 0 };
      return;
    }

    const size = Math.min(this.renderer.width, this.renderer.height);
    const scale = size * 0.88 * this.renderer.camera.zoom;
    const cam = this.renderer.camera;
    this.renderer.setCamera({
      x: cam.x - this.velocity.x / scale,
      y: cam.y - this.velocity.y / scale,
    });
    this.velocity.x *= 0.92;
    this.velocity.y *= 0.92;
  }
}
