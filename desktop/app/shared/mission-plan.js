/**
 * Desktop-only — pianificazione operativa missione (stesso payload novasky.mission.v1).
 */

import { computeSkySession } from "nova://engine/scripts/mission-map/services/sky-compute.js";
import { parseTime, formatTime } from "nova://engine/scripts/mission-map/map/projection.js";
import { addMinutes } from "nova://engine/scripts/mission-map/astro/time.js";
import { windowDurationMinutes } from "nova://engine/scripts/mission-map/services/mission-store.js";
import { RECOMMENDATION } from "nova://engine/scripts/mission-map/data/catalog.js";
import { getCategory } from "nova://engine/scripts/mission-map/data/categories.js";
import { SKY_LIMITS } from "nova://engine/scripts/mission-map/data/config.js";

export const MISSION_META_KEY = "novasky.mission.desktop-meta.v1";
export const DURATION_PRESETS = [20, 30, 45, 60, 90];

const { MIN_ALT, OPTIMAL_ALT } = SKY_LIMITS;

export function addMinutesToTime(timeStr, mins) {
  if (!timeStr) return "22:00";
  const total = parseTime(timeStr) + mins;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return formatTime(wrapped);
}

export function missionInstant(missionDate, timeStr) {
  const [y, m, d] = missionDate.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function formatDuration(mins) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r} min`;
}

export function loadMissionMeta() {
  try {
    const raw = localStorage.getItem(MISSION_META_KEY);
    return raw ? JSON.parse(raw) : { markedComplete: false, missionDate: null };
  } catch {
    return { markedComplete: false, missionDate: null };
  }
}

export function saveMissionMeta(meta) {
  localStorage.setItem(
    MISSION_META_KEY,
    JSON.stringify({ ...meta, updatedAt: new Date().toISOString() }),
  );
}

export function clearMissionMeta() {
  localStorage.removeItem(MISSION_META_KEY);
}

/** @param {import('nova://engine/scripts/mission-map/services/mission-store.js').MissionItem[]} items */
export function recalculateSchedule(items, targetsById, missionDate) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  let cursor = null;

  for (const item of sorted) {
    const target = targetsById.get(item.targetId);
    const defaultStart = target?.window?.start || "22:00";
    const duration = item.durationMinutes > 0 ? item.durationMinutes : 45;

    if (cursor === null) {
      item.plannedStart = item.plannedStart || defaultStart;
    } else {
      item.plannedStart = cursor;
    }

    item.durationMinutes = duration;
    cursor = addMinutesToTime(item.plannedStart, duration);
  }

  return sorted;
}

export function optimizeMissionOrder(items, targetsById) {
  return [...items].sort((a, b) => {
    const ta = targetsById.get(a.targetId);
    const tb = targetsById.get(b.targetId);
    const sa = ta?.window?.start ? parseTime(ta.window.start) : 24 * 60;
    const sb = tb?.window?.start ? parseTime(tb.window.start) : 24 * 60;
    return sa - sb;
  });
}

function targetAtTime(observer, when, targetId) {
  const session = computeSkySession(observer, when);
  return session.targets.find((t) => t.id === targetId) || null;
}

function minutesUntilEnd(plannedStart, duration, windowEnd) {
  if (!plannedStart || !windowEnd) return Infinity;
  const end = parseTime(addMinutesToTime(plannedStart, duration));
  const winEnd = parseTime(windowEnd);
  let diff = winEnd - end;
  if (diff < -12 * 60) diff += 24 * 60;
  return diff;
}

function windowSpanMinutes(start, end) {
  if (!start || !end || start === "—" || end === "—") return 0;
  return windowDurationMinutes(start, end);
}

/** @param {object} step */
export function validateStep(step) {
  const warnings = [];
  const { target, plannedStart, durationMinutes, altAtStart, altAtEnd, recommendation } = step;

  if (!target) return warnings;

  if (altAtStart != null && altAtStart < 0) {
    warnings.push({
      level: "error",
      text: `${target.name} non è visibile all'orario previsto (${plannedStart}).`,
    });
  } else if (altAtStart != null && altAtStart < MIN_ALT) {
    warnings.push({
      level: "warn",
      text: `All'inizio previsto ${target.name} sarà troppo basso (${Math.round(altAtStart)}°).`,
    });
  }

  if (altAtEnd != null && altAtEnd < MIN_ALT) {
    warnings.push({
      level: "warn",
      text: `Questo target scenderà sotto la soglia consigliata prima della fine prevista.`,
    });
  }

  const winMins = windowSpanMinutes(target.window?.start, target.window?.end);
  if (winMins > 0 && durationMinutes > winMins) {
    warnings.push({
      level: "warn",
      text: `La durata (${formatDuration(durationMinutes)}) supera la finestra utile (${formatDuration(winMins)}).`,
    });
  }

  const slack = minutesUntilEnd(plannedStart, durationMinutes, target.window?.end);
  if (slack < 0 && target.window?.end) {
    warnings.push({
      level: "warn",
      text: `L'osservazione termina dopo la fine della finestra utile (${target.window.end}).`,
    });
  }

  if (target.moonSeparation != null && target.moonSeparation < 35) {
    warnings.push({
      level: "warn",
      text: `Luna sfavorevole: solo ${Math.round(target.moonSeparation)}° di separazione da ${target.name}.`,
    });
  }

  if (recommendation === "discouraged") {
    warnings.push({
      level: "error",
      text: `${target.name} è sconsigliato in questo orario.`,
    });
  }

  return warnings;
}

export function validateSequence(steps) {
  const extra = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i];
    const b = steps[i + 1];
    if (!a.target || !b.target) continue;

    const aEnd = parseTime(addMinutesToTime(a.plannedStart, a.durationMinutes));
    const bStart = parseTime(b.plannedStart);
    if (bStart < aEnd - 5) {
      extra.push({
        level: "warn",
        text: `${a.target.name} e ${b.target.name} si sovrappongono nella timeline.`,
      });
    }

    const aWinEnd = a.target.window?.end ? parseTime(a.target.window.end) : null;
    const bWinStart = b.target.window?.start ? parseTime(b.target.window.start) : null;
    if (aWinEnd != null && bWinStart != null && aWinEnd < bWinStart) {
      const aPeak = a.target.culmination?.alt ?? a.altAtStart ?? 0;
      const bPeak = b.target.culmination?.alt ?? b.altAtStart ?? 0;
      if (aPeak < bPeak && a.target.recommendation !== "recommended" && b.target.recommendation === "recommended") {
        extra.push({
          level: "info",
          text: `Conviene osservare ${b.target.name} prima di ${a.target.name}.`,
        });
      }
    }
  }
  return extra;
}

export function buildMissionPlan(observer, missionPayload, catalog) {
  const targetsById = new Map(catalog.map((t) => [t.id, t]));
  const items = recalculateSchedule(
    missionPayload.items.map((i) => ({ ...i })),
    targetsById,
    missionPayload.missionDate,
  );

  const steps = items.map((item, index) => {
    const catalogEntry = targetsById.get(item.targetId);
    const startWhen = missionInstant(missionPayload.missionDate, item.plannedStart || "22:00");
    const endWhen = addMinutes(startWhen, item.durationMinutes || 45);
    const atStart = targetAtTime(observer, startWhen, item.targetId);
    const atEnd = targetAtTime(observer, endWhen, item.targetId);

    const target = atStart || {
      ...catalogEntry,
      window: catalogEntry ? { start: "—", end: "—" } : undefined,
      recommendation: "possible",
      stateLabel: "—",
      seestar: catalogEntry?.seestar || { s50: "—", s30: "—" },
      moonSeparation: null,
      alt: null,
    };

    return {
      index,
      item,
      target,
      plannedStart: item.plannedStart,
      plannedEnd: addMinutesToTime(item.plannedStart, item.durationMinutes),
      durationMinutes: item.durationMinutes,
      altAtStart: atStart?.alt ?? null,
      altAtEnd: atEnd?.alt ?? null,
      recommendation: atStart?.recommendation ?? "possible",
      category: getCategory(target),
      warnings: [],
    };
  });

  for (const step of steps) {
    step.warnings = validateStep(step);
  }

  const sequenceWarnings = validateSequence(steps);
  const allWarnings = [...steps.flatMap((s) => s.warnings), ...sequenceWarnings];

  const totalMinutes = steps.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const firstStart = steps[0]?.plannedStart || null;
  const lastEnd = steps.length ? steps[steps.length - 1].plannedEnd : null;

  return {
    missionDate: missionPayload.missionDate,
    updatedAt: missionPayload.updatedAt,
    steps,
    totalMinutes,
    firstStart,
    lastEnd,
    targetCount: steps.length,
    warnings: allWarnings,
    quality: computeMissionQuality(steps, allWarnings),
    suggestion: buildSuggestion(steps, allWarnings),
  };
}

export function computeMissionQuality(steps, warnings) {
  if (!steps.length) return "—";
  const errorCount = warnings.filter((w) => w.level === "error").length;
  const warnCount = warnings.filter((w) => w.level === "warn").length;
  const recommended = steps.filter((s) => s.recommendation === "recommended").length;

  if (errorCount > 0) return "Da rivedere";
  if (warnCount >= 3) return "Da rivedere";
  if (warnCount >= 1) return "Buona con avvisi";
  if (recommended === steps.length) return "Ottima";
  if (recommended >= steps.length * 0.6) return "Buona";
  return "Accettabile";
}

export function computeMissionStatus(plan, now, meta) {
  if (!plan.steps.length) return "Nessuna missione";

  if (meta?.markedComplete && meta.missionDate === plan.missionDate) {
    return "Completata";
  }

  if (!plan.firstStart || !plan.lastEnd) return "In preparazione";

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = parseTime(plan.firstStart);
  let endMins = parseTime(plan.lastEnd);
  if (endMins <= startMins) endMins += 24 * 60;
  let nowAdj = nowMins;
  if (nowAdj < startMins - 6 * 60) nowAdj += 24 * 60;

  if (nowAdj >= endMins) return "Completata";
  if (nowAdj >= startMins && nowAdj < endMins) return "In corso";
  if (startMins - nowAdj <= 90) return "Pronta";
  return "In preparazione";
}

export function buildSuggestion(steps, warnings) {
  if (!steps.length) {
    return "Esplora la Mission Map e aggiungi i target che vuoi osservare questa sera.";
  }

  const orderHint = warnings.find((w) => w.text?.startsWith("Conviene osservare"));
  if (orderHint) return orderHint.text;

  const swap = findOrderImprovement(steps);
  if (swap) {
    return `Invertendo ${swap.a} e ${swap.b} sfrutterai meglio le finestre osservative.`;
  }

  const error = warnings.find((w) => w.level === "error");
  if (error) return error.text;

  const warn = warnings.find((w) => w.level === "warn");
  if (warn) return warn.text;

  const names = steps.map((s) => s.target?.name).filter(Boolean);
  if (names.length >= 2) {
    return `La sequenza è buona. Inizia da ${names[0]} e prosegui con ${names.slice(1).join(", ")}.`;
  }
  if (names.length === 1) {
    return `Piano semplice: concentrati su ${names[0]} nella finestra indicata.`;
  }
  return "La sequenza è coerente con le finestre osservative di stanotte.";
}

function findOrderImprovement(steps) {
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i];
    const b = steps[i + 1];
    if (!a.target?.window?.start || !b.target?.window?.start) continue;
    const aStart = parseTime(a.target.window.start);
    const bStart = parseTime(b.target.window.start);
    if (bStart < aStart - 30 && b.recommendation === "recommended") {
      return { a: a.target.name, b: b.target.name };
    }
  }
  return null;
}

export function recommendationLabel(level) {
  return RECOMMENDATION[level]?.label || "—";
}

export function notifyMissionUpdated(payload) {
  window.dispatchEvent(new CustomEvent("novasky-mission-updated", { detail: payload }));
  try {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "novasky.mission.v1",
        newValue: JSON.stringify(payload),
        storageArea: localStorage,
      }),
    );
  } catch {
    /* StorageEvent non sempre costruibile */
  }
}

export function heroImageUrl(targetId) {
  return `nova://engine/assets/targets/hero/${targetId}.jpg`;
}

export function miniImageUrl(targetId) {
  return `nova://engine/assets/targets/mini/${targetId}.png`;
}
