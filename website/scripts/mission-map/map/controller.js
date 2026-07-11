/** Pan, zoom, hover, click — natural sky camera. */

export class MapController {
  constructor(canvas, renderer, callbacks) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.callbacks = callbacks;
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.velocity = 0;
    this.hoveredId = null;
    this.selectedId = null;

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
    this.velocity = 0;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = "grabbing";
  };

  onPointerMove = (event) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isDragging) {
      const dx = event.clientX - this.lastPointer.x;
      this.velocity = dx;
      this.lastPointer = { x: event.clientX, y: event.clientY };

      const cam = this.renderer.camera;
      const w = Math.max(this.renderer.width, 1);
      const sensitivity = (cam.fov / cam.zoom) / w;
      this.renderer.setCamera({
        azCenter: cam.azCenter - dx * sensitivity * 1.15,
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
    const wasDrag = Math.abs(this.velocity) > 4;
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
    const delta = -event.deltaY * 0.0015;
    const cam = this.renderer.camera;
    const nextZoom = Math.min(2.2, Math.max(0.7, cam.zoom * (1 + delta)));
    this.renderer.setCamera({ zoom: nextZoom });
  };

  onDoubleClick = () => {
    this.renderer.setCamera({ azCenter: 25, zoom: 1, lift: 0 });
  };

  hitTest(x, y) {
    const positions = this.renderer.getTargetScreenPositions();
    let closest = null;
    let closestDist = Infinity;

    for (const pos of positions) {
      const dist = Math.hypot(x - pos.sx, y - pos.sy);
      if (dist <= pos.radius + 14 && dist < closestDist) {
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

    const target = this.renderer.targets.find((t) => t.id === id);
    if (target && Number.isFinite(target.az)) {
      const cam = this.renderer.camera;
      let dAz = target.az - cam.azCenter;
      while (dAz > 180) dAz -= 360;
      while (dAz < -180) dAz += 360;
      if (Math.abs(dAz) > 25) {
        this.renderer.setCamera({ azCenter: target.az });
      }
    }
  }

  applyInertia() {
    if (Math.abs(this.velocity) < 0.3) {
      this.velocity = 0;
      return;
    }
    const cam = this.renderer.camera;
    const w = Math.max(this.renderer.width, 1);
    const sensitivity = (cam.fov / cam.zoom) / w;
    this.renderer.setCamera({
      azCenter: cam.azCenter - this.velocity * sensitivity * 0.35,
    });
    this.velocity *= 0.9;
  }
}
