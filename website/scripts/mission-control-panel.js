/**
 * Mission Control Panel v2 — Hero home, dati dal motore astronomico NovaSky.
 * Fallback demo espliciti solo per seeing/nuvole (non nel motore).
 */

import { computeSkySession } from "./mission-map/services/sky-compute.js";
import { LocationService } from "./mission-map/services/location-service.js";
import { sampleAltitudes } from "./mission-map/astro/visibility.js";
import { moonAltAz, moonPhase } from "./mission-map/astro/moon.js";
import { RECOMMENDATION } from "./mission-map/data/catalog.js";
import { SKY_LIMITS } from "./mission-map/data/config.js";

const STATUS_CLASS = {
  "Missione pronta": "is-ready",
  "In preparazione": "is-prep",
  "Finestra in apertura": "is-opening",
  "Osservazione consigliata": "is-optimal",
  "Finestra in chiusura": "is-closing",
};

const REC_LABEL = {
  recommended: "Consigliato",
  possible: "Possibile",
  discouraged: "Sconsigliato",
};

function formatClock(date) {
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "0m";
  const totalMin = Math.max(1, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

function pickPrimaryTarget(session) {
  const { targets, visibleTargets } = session;
  const rank = (list) =>
    [...list].sort((a, b) => {
      const rec = (t) => (t.recommendation === "recommended" ? 3 : t.recommendation === "possible" ? 2 : 1);
      return rec(b) * 100 + b.novaScore - (rec(a) * 100 + a.novaScore);
    })[0];

  if (visibleTargets.length) return rank(visibleTargets);
  const tonight = targets.filter((t) => t.visibleTonight);
  if (tonight.length) return rank(tonight);
  return rank(targets);
}

function computeMissionStatus(now, window, target) {
  const start = window?.startDate;
  const end = window?.endDate;
  if (!start || !end) return { status: "In preparazione", phase: "unknown" };

  const t = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const openLead = 45 * 60_000;
  const closeLead = 45 * 60_000;

  if (t < startMs - openLead) return { status: "In preparazione", phase: "before" };
  if (t < startMs) return { status: "Finestra in apertura", phase: "opening" };
  if (t > endMs) return { status: "Finestra in chiusura", phase: "after" };
  if (t > endMs - closeLead) return { status: "Finestra in chiusura", phase: "closing" };
  if (target.recommendation === "recommended" && target.alt >= SKY_LIMITS.MIN_ALT) {
    return { status: "Osservazione consigliata", phase: "active" };
  }
  if (target.recommendation === "possible" || target.aboveHorizon) {
    return { status: "Missione pronta", phase: "active" };
  }
  return { status: "In preparazione", phase: "active" };
}

function computeRemaining(now, window) {
  const start = window?.startDate;
  const end = window?.endDate;
  if (!start || !end) return { label: "—", ms: 0, type: "unknown" };

  const t = now.getTime();
  if (t < start.getTime()) {
    return { label: formatDuration(start.getTime() - t), ms: start.getTime() - t, type: "until-open" };
  }
  if (t <= end.getTime()) {
    return { label: formatDuration(end.getTime() - t), ms: end.getTime() - t, type: "remaining" };
  }
  return { label: "Chiusa", ms: 0, type: "closed" };
}

function shortVerdict(target) {
  if (target.recommendation === "recommended") {
    if (target.culmination?.time && target.culmination.time !== "—") {
      return `Ottima entro la finestra · picco ${target.culmination.time}`;
    }
    return "Ottima in questo momento";
  }
  if (target.recommendation === "possible") return "Buona entro la finestra";
  return "Condizioni difficili stasera";
}

function buildAdvice(statusInfo, target, remaining) {
  const { status, phase } = statusInfo;
  const moonSep = target.moonSeparation ?? 0;
  const alt = target.alt ?? 0;

  if (phase === "after" || (status === "Finestra in chiusura" && phase !== "closing")) {
    return "La finestra utile si sta chiudendo. Meglio scegliere un target alternativo.";
  }
  if (phase === "closing" && remaining.type === "remaining") {
    return `Restano ${remaining.label} di finestra utile. Se non hai iniziato, valuta un target più rapido da catturare.`;
  }
  if (phase === "before" || phase === "opening") {
    const wait = remaining.type === "until-open" ? remaining.label : "poco";
    return `Attendi circa ${wait}: il target salirà ancora e avrai una finestra più pulita.`;
  }
  if (target.recommendation === "recommended" && moonSep >= 50 && alt >= SKY_LIMITS.OPTIMAL_ALT) {
    return "Puoi iniziare subito. La Luna disturba poco e il target è già ben posizionato.";
  }
  if (target.recommendation === "recommended") {
    const lead = target.reason?.split(".")[0];
    return lead ? `${lead}.` : "Puoi iniziare ora: il NovaScore indica condizioni favorevoli.";
  }
  if (target.recommendation === "possible") {
    return moonSep < 45
      ? "Condizioni accettabili, ma la Luna è vicina: preferisci filtri o attendi un'ora più buia."
      : "Hai ancora tempo utile per una sessione breve con risultato credibile.";
  }
  return "Condizioni impegnative adesso. Apri Mission Map per confrontare alternative e orari.";
}

function moonCondition(moonIllum, moonAlt, moonSep) {
  if (moonAlt < 5) {
    return {
      value: `Bassa · ${moonIllum}%`,
      state: "good",
      hint: "Luna sotto l'orizzonte o molto bassa: ottimo per il cielo profondo.",
    };
  }
  if (moonSep >= 60 && moonIllum < 70) {
    return {
      value: `Gestibile · ${moonIllum}%`,
      state: "good",
      hint: `${Math.round(moonSep)}° dal target — interferenza contenuta.`,
    };
  }
  if (moonSep >= 35) {
    return {
      value: `Presente · ${moonIllum}%`,
      state: "warn",
      hint: `${Math.round(moonSep)}° di separazione — filtri consigliati.`,
    };
  }
  return {
    value: `In campo · ${moonIllum}%`,
    state: "bad",
    hint: "Luce lunare vicina al target: contrasto ridotto.",
  };
}

function transparencyCondition(score, moonIllum, moonSep) {
  let adj = score;
  if (moonIllum > 70 && moonSep < 45) adj -= 12;
  if (adj >= 70) {
    return { value: "Buona", state: "good", hint: "NovaScore favorevole per cielo profondo." };
  }
  if (adj >= 48) {
    return { value: "Discreta", state: "warn", hint: "Contrasto sufficiente, non al massimo." };
  }
  return { value: "Ridotta", state: "bad", hint: "Luna o bassa quota penalizzano il dettaglio." };
}

function demoSeeingCondition(targetAlt) {
  if (targetAlt >= SKY_LIMITS.OPTIMAL_ALT) {
    return { value: "Demo · Stabile", state: "good", hint: "Anteprima demo — seeing stimato da quota elevata del target." };
  }
  if (targetAlt >= SKY_LIMITS.MIN_ALT) {
    return { value: "Demo · Moderato", state: "warn", hint: "Anteprima demo — dati meteo reali in arrivo." };
  }
  return { value: "Demo · Basso", state: "bad", hint: "Anteprima demo — target basso sull'orizzonte." };
}

function demoCloudCondition() {
  return {
    value: "Demo · Assenti",
    state: "good",
    hint: "Anteprima demo — copertura nuvolosa non ancora collegata.",
  };
}

function positionAt(samples, when) {
  if (!samples?.length) return null;
  const t = when.getTime();
  if (t <= samples[0].time.getTime()) return samples[0];
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (t >= a.time.getTime() && t <= b.time.getTime()) {
      const span = b.time.getTime() - a.time.getTime();
      const f = span > 0 ? (t - a.time.getTime()) / span : 0;
      return { alt: a.alt + (b.alt - a.alt) * f, az: a.az + (b.az - a.az) * f, time: when };
    }
  }
  return samples[samples.length - 1];
}

class HorizonViz {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext("2d") ?? null;
    this.samples = [];
    this.peak = null;
    this.displayPos = null;
    this.targetPos = null;
    this.raf = null;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  setData(samples, peak) {
    this.samples = samples ?? [];
    this.peak = peak;
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  project(alt, az) {
    const clampedAz = Math.max(90, Math.min(270, az));
    const t = (clampedAz - 90) / 180;
    const x = 12 + t * (this.w - 24);
    const baseY = this.h * 0.78;
    const topY = this.h * 0.22;
    const y = baseY - (Math.max(0, alt) / 90) * (baseY - topY);
    return { x, y };
  }

  setTargetPosition(pos) {
    this.targetPos = pos;
    if (this.reducedMotion || !this.displayPos) {
      this.displayPos = pos ? { ...pos } : null;
      this.draw();
      return;
    }
    if (!this.raf) this.animate();
  }

  animate() {
    if (!this.targetPos) {
      this.raf = null;
      this.draw();
      return;
    }
    if (!this.displayPos) this.displayPos = { ...this.targetPos };
    const dx = this.targetPos.x - this.displayPos.x;
    const dy = this.targetPos.y - this.displayPos.y;
    if (Math.hypot(dx, dy) < 0.4) {
      this.displayPos = { ...this.targetPos };
      this.draw();
      this.raf = null;
      return;
    }
    this.displayPos.x += dx * 0.12;
    this.displayPos.y += dy * 0.12;
    this.draw();
    this.raf = requestAnimationFrame(() => this.animate());
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const baseY = h * 0.78;
    ctx.strokeStyle = "rgba(158, 183, 204, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, baseY);
    ctx.quadraticCurveTo(w / 2, h * 0.08, w - 8, baseY);
    ctx.stroke();

    if (this.samples.length > 1) {
      ctx.strokeStyle = "rgba(92, 199, 216, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      this.samples.forEach((s, i) => {
        const p = this.project(s.alt, s.az);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.peak) {
      const p = this.project(this.peak.alt, this.peak.az);
      ctx.fillStyle = "rgba(231, 184, 90, 0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(231, 184, 90, 0.35)";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, baseY);
      ctx.stroke();
    }

    if (this.displayPos) {
      ctx.fillStyle = "rgba(92, 199, 216, 0.95)";
      ctx.shadowColor = "rgba(92, 199, 216, 0.65)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.displayPos.x, this.displayPos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

export class MissionControlPanel {
  constructor(root) {
    this.root = root;
    this.locationService = new LocationService();
    this.horizon = new HorizonViz(root?.querySelector("[data-mcp-horizon-canvas]"));
    this.els = {
      status: root?.querySelector("[data-mcp-status]"),
      demoTag: root?.querySelector("[data-mcp-demo-tag]"),
      clock: root?.querySelector("[data-mcp-clock]"),
      windowStart: root?.querySelector("[data-mcp-window-start]"),
      windowPeak: root?.querySelector("[data-mcp-window-peak]"),
      windowEnd: root?.querySelector("[data-mcp-window-end]"),
      windowRemaining: root?.querySelector("[data-mcp-window-remaining]"),
      targetId: root?.querySelector("[data-mcp-target-id]"),
      targetName: root?.querySelector("[data-mcp-target-name]"),
      targetCategory: root?.querySelector("[data-mcp-target-category]"),
      targetVerdict: root?.querySelector("[data-mcp-target-verdict]"),
      targetRec: root?.querySelector("[data-mcp-target-rec]"),
      targetAlt: root?.querySelector("[data-mcp-target-alt]"),
      targetS50: root?.querySelector("[data-mcp-target-s50]"),
      targetS30: root?.querySelector("[data-mcp-target-s30]"),
      advice: root?.querySelector("[data-mcp-advice]"),
      conditions: root?.querySelectorAll("[data-mcp-condition]"),
    };
    this.timer = null;
    this.lastStatus = "";
  }

  async init() {
    if (!this.root) return;
    this.locationService.useDemo();
    this.locationService.requestLocation().then(() => this.refresh());
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 60_000);
    window.addEventListener("resize", () => {
      this.horizon.resize();
      this.horizon.draw();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.refresh();
    });
  }

  refresh() {
    const now = new Date();
    const observer = this.locationService.getLocation();
    const session = computeSkySession(observer, now);
    const target = pickPrimaryTarget(session);
    const window = target.window ?? {};
    const statusInfo = computeMissionStatus(now, window, target);
    const remaining = computeRemaining(now, window);

    const moonPos = moonAltAz(observer.lat, observer.lon, now);
    const phase = moonPhase(now);

    this.renderStatus(statusInfo);
    this.renderClock(now, observer);
    this.renderWindow(window, target, remaining);
    this.renderTarget(target);
    this.renderConditions(target, phase.illuminationPct, moonPos.alt, target.moonSeparation);
    this.renderAdvice(statusInfo, target, remaining);
    this.renderHorizon(observer, target, window, now);
  }

  renderStatus({ status }) {
    if (!this.els.status) return;
    if (this.lastStatus && this.lastStatus !== status) {
      this.els.status.classList.add("is-changing");
      setTimeout(() => this.els.status?.classList.remove("is-changing"), 320);
    }
    this.lastStatus = status;
    this.els.status.textContent = status;
    this.els.status.dataset.level = STATUS_CLASS[status] ?? "is-prep";
    this.root.dataset.missionStatus = status;
  }

  renderClock(now, observer) {
    if (this.els.clock) {
      this.els.clock.textContent = formatClock(now);
      this.els.clock.dateTime = now.toISOString();
    }
    if (this.els.demoTag) {
      const isDemo = observer.source === "demo";
      this.els.demoTag.hidden = !isDemo;
      this.els.demoTag.textContent = isDemo ? "Demo · Milano" : "";
    }
  }

  renderWindow(window, target, remaining) {
    if (this.els.windowStart) this.els.windowStart.textContent = window.start ?? "—";
    if (this.els.windowPeak) {
      this.els.windowPeak.textContent =
        target.culmination?.time && target.culmination.time !== "—" ? target.culmination.time : "—";
    }
    if (this.els.windowEnd) this.els.windowEnd.textContent = window.end ?? "—";
    if (this.els.windowRemaining) {
      if (remaining.type === "until-open") {
        this.els.windowRemaining.textContent = `Apre tra ${remaining.label}`;
      } else if (remaining.type === "remaining") {
        this.els.windowRemaining.textContent = remaining.label;
      } else if (remaining.type === "closed") {
        this.els.windowRemaining.textContent = "Chiusa";
      } else {
        this.els.windowRemaining.textContent = "—";
      }
    }
  }

  renderTarget(target) {
    const rec = RECOMMENDATION[target.recommendation] ?? RECOMMENDATION.possible;
    if (this.els.targetId) this.els.targetId.textContent = target.name ?? "—";
    if (this.els.targetName) this.els.targetName.textContent = target.subtitle ?? "—";
    if (this.els.targetCategory) this.els.targetCategory.textContent = target.category ?? "—";
    if (this.els.targetVerdict) this.els.targetVerdict.textContent = shortVerdict(target);
    if (this.els.targetRec) {
      this.els.targetRec.textContent = REC_LABEL[target.recommendation] ?? "Possibile";
      this.els.targetRec.style.color = rec.color;
    }
    if (this.els.targetAlt) {
      this.els.targetAlt.textContent =
        target.aboveHorizon && target.alt != null ? `${target.alt}° attuale` : "Sotto l'orizzonte";
    }
    if (this.els.targetS50) this.els.targetS50.textContent = target.seestar?.s50 ?? "—";
    if (this.els.targetS30) this.els.targetS30.textContent = target.seestar?.s30 ?? "—";
  }

  renderConditions(target, moonIllum, moonAlt, moonSep) {
    const conditions = {
      moon: moonCondition(moonIllum, moonAlt, moonSep),
      seeing: demoSeeingCondition(target.alt ?? 0),
      clouds: demoCloudCondition(),
      transparency: transparencyCondition(target.novaScore ?? 50, moonIllum, moonSep),
    };

    this.els.conditions?.forEach((el) => {
      const key = el.dataset.mcpCondition;
      const data = conditions[key];
      if (!data) return;
      const valueEl = el.querySelector("[data-mcp-condition-value]");
      if (valueEl) valueEl.textContent = data.value;
      el.dataset.state = data.state;
      el.title = data.hint;
      const hintEl = el.querySelector("[data-mcp-condition-hint]");
      if (hintEl) hintEl.textContent = data.hint;
    });
  }

  renderAdvice(statusInfo, target, remaining) {
    if (this.els.advice) {
      this.els.advice.textContent = buildAdvice(statusInfo, target, remaining);
    }
  }

  renderHorizon(observer, target, window, now) {
    if (!this.horizon.canvas) return;
    this.horizon.resize();

    let samples = [];
    if (window.startDate && window.endDate) {
      samples = sampleAltitudes(target, observer, window.startDate, window.endDate);
    }
    const peak =
      target.culmination?.alt != null
        ? { alt: target.culmination.alt, az: target.culmination.az ?? 180 }
        : null;

    this.horizon.setData(samples, peak);

    const pos = positionAt(samples, now) ?? (target.aboveHorizon ? { alt: target.alt, az: target.az } : null);
    if (pos) {
      const projected = this.horizon.project(pos.alt, pos.az);
      this.horizon.setTargetPosition(projected);
    } else {
      this.horizon.setTargetPosition(null);
    }
  }
}

export function initMissionControlPanel() {
  const root = document.querySelector("[data-mission-panel]");
  if (!root) return null;
  const panel = new MissionControlPanel(root);
  panel.init();
  return panel;
}
