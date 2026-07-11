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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
