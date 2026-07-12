#!/usr/bin/env node
/**
 * Astronomy engine smoke tests — run: node website/scripts/mission-map/tests/run-tests.mjs
 */

import assert from "node:assert/strict";
import { raDecToAltAz } from "../astro/coords.js";
import { julianDate, gmstDegrees } from "../astro/time.js";
import { angularSeparationDeg } from "../astro/math.js";
import { classifyAltitude, TARGET_STATE } from "../astro/states.js";
import { SKY_LIMITS } from "../data/config.js";
import { computeSkySession } from "../services/sky-compute.js";
import { DEMO_OBSERVER } from "../data/config.js";
import {
  sanitizeMissionPayload,
  createMissionStore,
  MISSION_STORAGE_KEY,
  windowDurationMinutes,
} from "../services/mission-store.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log("NovaSky astronomy tests\n");

test("Julian Date J2000 ≈ 2451545.0", () => {
  const jd = julianDate(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
  assert.ok(Math.abs(jd - 2451545.0) < 0.001);
});

test("Angular separation to self is 0°", () => {
  const sep = angularSeparationDeg(12, 45, 12, 45);
  assert.ok(sep < 0.001);
});

test("classifyAltitude: below horizon", () => {
  assert.equal(classifyAltitude(-5, SKY_LIMITS), TARGET_STATE.BELOW);
});

test("classifyAltitude: optimal above 45°", () => {
  assert.equal(classifyAltitude(60, SKY_LIMITS), TARGET_STATE.OPTIMAL);
});

test("Polaris near north celestial pole: alt ≈ latitude", () => {
  const lat = 45.464;
  const polarisRA = 2.53;
  const polarisDec = 89.264;
  const date = new Date("2025-07-15T22:00:00");
  const { alt } = raDecToAltAz(polarisRA, polarisDec, lat, 9.19, date);
  assert.ok(alt > lat - 2 && alt < lat + 2, `alt=${alt} expected ~${lat}`);
});

test("M13 culminates high from Milano in summer evening", () => {
  const date = new Date("2025-07-15T23:00:00");
  const { alt } = raDecToAltAz(16.695, 36.461, DEMO_OBSERVER.lat, DEMO_OBSERVER.lon, date);
  assert.ok(alt > 25, `M13 alt=${alt} should be observable`);
});

test("computeSkySession returns visible targets at night", () => {
  const when = new Date("2025-07-15T23:30:00");
  const session = computeSkySession(DEMO_OBSERVER, when);
  assert.ok(session.visibleTargets.length > 0, "expected visible targets");
  assert.ok(session.meta.verdict.length > 10);
  const m13 = session.targets.find((t) => t.id === "m13");
  assert.ok(m13);
  assert.ok(m13.alt > 0);
  assert.ok(m13.reason.length > 20, "verdict must explain");
});

test("GMST increases with time", () => {
  const d1 = new Date("2025-01-01T00:00:00Z");
  const d2 = new Date("2025-01-01T01:00:00Z");
  assert.ok(gmstDegrees(d2) > gmstDegrees(d1));
});

test("mission store: dedupe and drop invalid targetIds", () => {
  const valid = new Set(["m27", "m13"]);
  const payload = sanitizeMissionPayload(
    {
      version: 1,
      missionDate: "2026-07-11",
      timezone: "Europe/Rome",
      items: [
        { targetId: "m27", order: 1, durationMinutes: 90, plannedStart: "22:00", addedAt: "x" },
        { targetId: "m27", order: 2, durationMinutes: 90, plannedStart: "22:00", addedAt: "y" },
        { targetId: "bogus", order: 3, durationMinutes: 10, plannedStart: "23:00", addedAt: "z" },
        { targetId: "m13", order: 0, durationMinutes: 60, plannedStart: "21:00", addedAt: "w" },
      ],
    },
    valid,
  );
  assert.equal(payload.items.length, 2);
  assert.equal(payload.items[0].targetId, "m13");
  assert.equal(payload.items[1].targetId, "m27");
});

test("mission store: corrupt JSON yields empty mission", () => {
  const store = createMissionStore(["m27"]);
  const payload = store.parse("{not-json");
  assert.deepEqual(payload.items, []);
});

test("mission store: save and load roundtrip", () => {
  globalThis.localStorage = createMemoryStorage();
  const store = createMissionStore(["m27", "m13"]);
  store.save(
    [
      {
        targetId: "m27",
        order: 0,
        durationMinutes: 95,
        plannedStart: "22:10",
        addedAt: "2026-07-12T20:00:00.000Z",
      },
    ],
    "2026-07-12",
  );
  const loaded = store.load();
  assert.equal(loaded.items.length, 1);
  assert.equal(loaded.items[0].targetId, "m27");
  assert.equal(loaded.missionDate, "2026-07-12");
  assert.equal(localStorage.getItem(MISSION_STORAGE_KEY)?.includes("m27"), true);
});

test("windowDurationMinutes handles overnight window", () => {
  assert.equal(windowDurationMinutes("22:10", "01:35"), 205);
});

function createMemoryStorage() {
  const data = new Map();
  return {
    setItem(k, v) {
      data.set(k, String(v));
    },
    getItem(k) {
      return data.has(k) ? data.get(k) : null;
    },
    removeItem(k) {
      data.delete(k);
    },
  };
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
