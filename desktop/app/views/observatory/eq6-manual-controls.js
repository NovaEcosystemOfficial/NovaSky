/**
 * Controlli manuali EQ6 LIVE — hold-to-move N/S/E/O + STOP.
 * Nessun movimento automatico: solo eventi utente (pointerdown/up).
 */

import {
  isSimulationMode,
  getDevices,
  eq6ManualMoveAxis,
  eq6ManualStopAxes,
} from "../../shared/device-registry.js";
import { EQ6_SPEED_PRESETS, EQ6_DEFAULT_SPEED_ID } from "../../shared/device-hub/eq6-ascom-adapter.js";

const DIR_MAP = {
  N: { axis: 1, sign: 1, label: "Nord (DEC+)" },
  S: { axis: 1, sign: -1, label: "Sud (DEC−)" },
  E: { axis: 0, sign: 1, label: "Est (AR+)" },
  O: { axis: 0, sign: -1, label: "Ovest (AR−)" },
};

let activeDirection = null;
let activeSpeedId = EQ6_DEFAULT_SPEED_ID;
let stopping = false;

function getEq6Device() {
  return (
    getDevices().find((d) => d.id === "dev-mount-eq6") ||
    getDevices().find((d) => d.category === "mount" && (d.model || "").toLowerCase().includes("eq6"))
  );
}

function isLiveReady(device) {
  if (isSimulationMode()) return false;
  const m = device?.telemetry?.mount;
  return (
    device?.dataSource === "live" &&
    m?.liveState === "LIVE" &&
    m?.connected === true &&
    m?.source === "live"
  );
}

function canMove(device, axis) {
  const caps = device?.telemetry?.mount?.capabilities || {};
  if (axis === 0) return Boolean(caps.CanMoveAxis0 || caps.CanMoveAxis);
  if (axis === 1) return Boolean(caps.CanMoveAxis1 || caps.CanMoveAxis);
  return false;
}

function currentRate() {
  const preset = EQ6_SPEED_PRESETS.find((p) => p.id === activeSpeedId) || EQ6_SPEED_PRESETS[0];
  return preset.rate;
}

async function safeStop(reason) {
  if (stopping) return;
  stopping = true;
  activeDirection = null;
  try {
    const device = getEq6Device();
    if (device && !isSimulationMode() && device.dataSource === "live") {
      await eq6ManualStopAxes();
    }
  } catch {
    /* ignore */
  } finally {
    stopping = false;
    updateMovingUi(false, null, reason);
  }
}

async function startMove(dir) {
  const device = getEq6Device();
  if (!isLiveReady(device)) {
    updateMovingUi(false, null, "EQ6 non LIVE / non Connected");
    return;
  }
  const spec = DIR_MAP[dir];
  if (!spec) return;
  if (!canMove(device, spec.axis)) {
    updateMovingUi(false, null, `Asse ${spec.axis} non supportato (CanMoveAxis=false)`);
    return;
  }
  const rate = spec.sign * currentRate();
  activeDirection = dir;
  updateMovingUi(true, dir, null);
  const result = await eq6ManualMoveAxis(spec.axis, rate, dir);
  if (!result?.ok) {
    activeDirection = null;
    updateMovingUi(false, null, result?.message || result?.error || "Movimento fallito");
    await safeStop("errore move");
  }
}

function updateMovingUi(moving, dir, errorMsg) {
  const root = document.querySelector("[data-eq6-manual]");
  if (!root) return;
  root.classList.toggle("is-moving", Boolean(moving));
  const badge = root.querySelector("[data-eq6-moving-badge]");
  if (badge) {
    badge.textContent = moving ? `IN MOVIMENTO · ${dir || "—"}` : "FERMO";
    badge.classList.toggle("is-on", Boolean(moving));
  }
  const err = root.querySelector("[data-eq6-manual-error]");
  if (err) err.textContent = errorMsg || "";
  root.querySelectorAll("[data-eq6-dir]").forEach((btn) => {
    btn.classList.toggle("is-active", moving && btn.dataset.eq6Dir === dir);
  });
}

/**
 * HTML controlli — solo se LIVE + Connected.
 */
export function renderEq6ManualControls(device) {
  const sim = isSimulationMode();
  const live = isLiveReady(device);
  const caps = device?.telemetry?.mount?.capabilities || {};
  const can0 = Boolean(caps.CanMoveAxis0 || caps.CanMoveAxis);
  const can1 = Boolean(caps.CanMoveAxis1 || caps.CanMoveAxis);
  const slewing = device?.telemetry?.mount?.slewing;
  const moving = Boolean(device?.telemetry?.mount?.manualMoving) || Boolean(slewing);

  if (sim) {
    return `
      <section class="glass-panel obs-detail-panel obs-detail-panel--wide eq6-manual eq6-manual--sim">
        <h3>Controlli manuali</h3>
        <p class="obs-muted">Modalità SIM attiva — nessun comando hardware. Disattiva simulazione e connetti LIVE per N/S/E/O reali.</p>
      </section>`;
  }

  if (!live) {
    return `
      <section class="glass-panel obs-detail-panel obs-detail-panel--wide eq6-manual">
        <h3>Controlli manuali</h3>
        <p class="obs-muted">Disponibili solo con EQ6 LIVE Connected. Nessun movimento automatico alla connessione.</p>
      </section>`;
  }

  const speedOptions = EQ6_SPEED_PRESETS.map(
    (p) => `<option value="${p.id}" ${p.id === EQ6_DEFAULT_SPEED_ID ? "selected" : ""}>${p.label}</option>`
  ).join("");

  return `
    <section class="glass-panel obs-detail-panel obs-detail-panel--wide eq6-manual ${moving ? "is-moving" : ""}" data-eq6-manual>
      <header class="eq6-manual-head">
        <h3>Controlli manuali LIVE</h3>
        <span class="eq6-moving-badge ${moving ? "is-on" : ""}" data-eq6-moving-badge>${moving ? "IN MOVIMENTO" : "FERMO"}</span>
      </header>
      <p class="obs-muted">Tieni premuto N/S/E/O · rilascio = STOP. Solo MoveAxis ASCOM · nessun GOTO/Park/Sync.</p>
      <p class="obs-muted">Capability: CanMoveAxis0=${can0 ? "yes" : "no"} · CanMoveAxis1=${can1 ? "yes" : "no"}</p>

      <label class="eq6-speed">
        <span>Velocità</span>
        <select data-eq6-speed>${speedOptions}</select>
      </label>

      <div class="eq6-pad" aria-label="Pad movimento montatura">
        <button type="button" class="eq6-pad-btn" data-eq6-dir="N" ${can1 ? "" : "disabled"} title="Nord DEC+">N</button>
        <div class="eq6-pad-mid">
          <button type="button" class="eq6-pad-btn" data-eq6-dir="O" ${can0 ? "" : "disabled"} title="Ovest AR−">O</button>
          <button type="button" class="eq6-pad-btn eq6-pad-btn--stop" data-eq6-stop title="Arresto movimento">STOP</button>
          <button type="button" class="eq6-pad-btn" data-eq6-dir="E" ${can0 ? "" : "disabled"} title="Est AR+">E</button>
        </div>
        <button type="button" class="eq6-pad-btn" data-eq6-dir="S" ${can1 ? "" : "disabled"} title="Sud DEC−">S</button>
      </div>

      <button type="button" class="obs-btn eq6-stop-xl" data-eq6-stop>ARRESTO MOVIMENTO</button>
      <p class="eq6-manual-error" data-eq6-manual-error role="status"></p>
      <dl class="obs-spec-grid eq6-live-mini">
        <div><dt>AR</dt><dd data-eq6-live-ra>—</dd></div>
        <div><dt>DEC</dt><dd data-eq6-live-dec>—</dd></div>
        <div><dt>ALT</dt><dd data-eq6-live-alt>—</dd></div>
        <div><dt>AZ</dt><dd data-eq6-live-az>—</dd></div>
        <div><dt>Tracking</dt><dd data-eq6-live-track>—</dd></div>
        <div><dt>Slewing</dt><dd data-eq6-live-slew>—</dd></div>
      </dl>
    </section>`;
}

function fmtRa(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return "—";
  const h = Number(hours);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round((h - hh) * 60 * 60 - mm * 60);
  return `${hh}h ${String(mm).padStart(2, "0")}m ${String(ss).padStart(2, "0")}s`;
}

function fmtDeg(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(3)}°`;
}

export function refreshEq6ManualTelemetry(device) {
  const root = document.querySelector("[data-eq6-manual]");
  if (!root || !device?.telemetry?.mount) return;
  const m = device.telemetry.mount;
  const set = (sel, val) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = val;
  };
  set("[data-eq6-live-ra]", fmtRa(m.ra));
  set("[data-eq6-live-dec]", fmtDeg(m.dec));
  set("[data-eq6-live-alt]", fmtDeg(m.altitude));
  set("[data-eq6-live-az]", fmtDeg(m.azimuth));
  set("[data-eq6-live-track]", m.tracking == null ? "—" : m.tracking ? "sì" : "no");
  set("[data-eq6-live-slew]", m.slewing == null ? "—" : m.slewing ? "sì" : "no");
  const moving = Boolean(m.manualMoving) || Boolean(m.slewing) || Boolean(activeDirection);
  root.classList.toggle("is-moving", moving);
  const badge = root.querySelector("[data-eq6-moving-badge]");
  if (badge) {
    badge.textContent = moving ? `IN MOVIMENTO${activeDirection ? ` · ${activeDirection}` : ""}` : "FERMO";
    badge.classList.toggle("is-on", moving);
  }
}

/**
 * Bind pointer events — call after every detail render.
 */
export function bindEq6ManualControls(root) {
  const section = root?.querySelector?.("[data-eq6-manual]") || document.querySelector("[data-eq6-manual]");
  if (!section || section.dataset.bound === "1") {
    // Re-bind after re-render: clear flag on new DOM
  }
  const el = root?.querySelector?.("[data-eq6-manual]");
  if (!el) return;
  el.dataset.bound = "1";

  const speed = el.querySelector("[data-eq6-speed]");
  if (speed) {
    speed.value = activeSpeedId;
    speed.addEventListener("change", () => {
      activeSpeedId = speed.value || EQ6_DEFAULT_SPEED_ID;
      if (activeDirection) void safeStop("cambio velocità");
    });
  }

  const onDown = (ev) => {
    const btn = ev.currentTarget;
    if (btn.disabled) return;
    ev.preventDefault();
    const dir = btn.dataset.eq6Dir;
    if (!dir) return;
    try {
      btn.setPointerCapture?.(ev.pointerId);
    } catch {
      /* ignore */
    }
    void startMove(dir);
  };

  const onUp = (ev) => {
    ev.preventDefault();
    if (activeDirection) void safeStop("rilascio");
  };

  el.querySelectorAll("[data-eq6-dir]").forEach((btn) => {
    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
    btn.addEventListener("pointerleave", (e) => {
      if (activeDirection && e.buttons === 0) void safeStop("leave");
    });
    btn.addEventListener("lostpointercapture", () => {
      if (activeDirection) void safeStop("lostcapture");
    });
  });

  el.querySelectorAll("[data-eq6-stop]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      void safeStop("stop");
    });
  });

  const onVis = () => {
    if (document.hidden && activeDirection) void safeStop("hidden");
  };
  document.addEventListener("visibilitychange", onVis, { once: false });

  const device = getEq6Device();
  refreshEq6ManualTelemetry(device);
}

/** Emergency stop for disconnect / unmount */
export function forceEq6ManualStop() {
  return safeStop("force");
}
