/**
 * Persistenza locale Missione Serale — localStorage, nessun backend.
 */

import { parseTime } from "../map/projection.js";

export const MISSION_STORAGE_KEY = "novasky.mission.v1";
export const MISSION_VERSION = 1;

/** @typedef {object} MissionItem
 * @property {string} targetId
 * @property {number} order
 * @property {number} durationMinutes
 * @property {string|null} plannedStart — HH:mm locale
 * @property {string} addedAt — ISO 8601
 */

/** @typedef {object} MissionPayload
 * @property {number} version
 * @property {string} missionDate — YYYY-MM-DD locale
 * @property {string} timezone
 * @property {string} updatedAt
 * @property {MissionItem[]} items
 */

export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function windowDurationMinutes(start, end) {
  if (!start || !end) return 0;
  let s = parseTime(start);
  let e = parseTime(end);
  if (e < s) e += 24 * 60;
  return Math.max(0, e - s);
}

function emptyPayload() {
  return {
    version: MISSION_VERSION,
    missionDate: localDateString(),
    timezone: getTimezone(),
    updatedAt: new Date().toISOString(),
    items: [],
  };
}

/**
 * @param {unknown} raw
 * @param {Set<string>} validIds
 * @returns {MissionPayload}
 */
export function sanitizeMissionPayload(raw, validIds) {
  if (!raw || typeof raw !== "object") return emptyPayload();

  const obj = /** @type {Record<string, unknown>} */ (raw);
  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  const seen = new Set();
  /** @type {MissionItem[]} */
  const items = [];

  for (const entry of itemsRaw) {
    if (!entry || typeof entry !== "object") continue;
    const e = /** @type {Record<string, unknown>} */ (entry);
    const targetId = typeof e.targetId === "string" ? e.targetId : null;
    if (!targetId || !validIds.has(targetId) || seen.has(targetId)) continue;
    seen.add(targetId);

    items.push({
      targetId,
      order: typeof e.order === "number" && Number.isFinite(e.order) ? e.order : items.length,
      durationMinutes:
        typeof e.durationMinutes === "number" && e.durationMinutes >= 0
          ? Math.round(e.durationMinutes)
          : 0,
      plannedStart: typeof e.plannedStart === "string" ? e.plannedStart : null,
      addedAt: typeof e.addedAt === "string" ? e.addedAt : new Date().toISOString(),
    });
  }

  items.sort((a, b) => a.order - b.order);
  items.forEach((item, idx) => {
    item.order = idx;
  });

  return {
    version: MISSION_VERSION,
    missionDate: typeof obj.missionDate === "string" ? obj.missionDate : localDateString(),
    timezone: typeof obj.timezone === "string" ? obj.timezone : getTimezone(),
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    items,
  };
}

/**
 * @param {MissionItem[]} items
 * @param {string} [missionDate]
 * @returns {MissionPayload}
 */
export function buildMissionPayload(items, missionDate = localDateString()) {
  return {
    version: MISSION_VERSION,
    missionDate,
    timezone: getTimezone(),
    updatedAt: new Date().toISOString(),
    items: items.map((item, idx) => ({ ...item, order: idx })),
  };
}

/**
 * @param {string[]} catalogIds
 */
export function createMissionStore(catalogIds) {
  const validIds = new Set(catalogIds);
  let storageAvailable = true;

  function getStorage() {
    try {
      if (typeof localStorage === "undefined") {
        storageAvailable = false;
        return null;
      }
      const probe = "__novasky_mission_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return localStorage;
    } catch {
      storageAvailable = false;
      return null;
    }
  }

  function load() {
    const store = getStorage();
    if (!store) return emptyPayload();
    try {
      const raw = store.getItem(MISSION_STORAGE_KEY);
      if (!raw) return emptyPayload();
      return sanitizeMissionPayload(JSON.parse(raw), validIds);
    } catch {
      try {
        store.removeItem(MISSION_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return emptyPayload();
    }
  }

  /** @param {string|null} raw */
  function parse(raw) {
    if (!raw) return emptyPayload();
    try {
      return sanitizeMissionPayload(JSON.parse(raw), validIds);
    } catch {
      return emptyPayload();
    }
  }

  /** @param {MissionItem[]} items @param {string} missionDate */
  function save(items, missionDate) {
    const payload = buildMissionPayload(items, missionDate);
    const store = getStorage();
    if (!store) return payload;
    try {
      store.setItem(MISSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("NovaSky: impossibile salvare la missione.", err);
    }
    return payload;
  }

  function clear() {
    const store = getStorage();
    try {
      store?.removeItem(MISSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return {
    load,
    save,
    clear,
    parse,
    key: MISSION_STORAGE_KEY,
    isAvailable: () => storageAvailable,
  };
}

/** @param {import("../data/catalog.js").CATALOG[number]} target */
export function createMissionItemFromTarget(target) {
  return {
    targetId: target.id,
    order: 0,
    durationMinutes: windowDurationMinutes(target.window?.start, target.window?.end),
    plannedStart: target.window?.start ?? null,
    addedAt: new Date().toISOString(),
  };
}
