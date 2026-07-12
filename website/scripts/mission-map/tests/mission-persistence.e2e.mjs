/**
 * Playwright integration — mission persistence Tests A–E
 * Run from dir with playwright installed:
 *   cp .../mission-persistence.e2e.mjs /tmp/novasky-e2e/test.mjs && cd /tmp/novasky-e2e && node test.mjs
 */

import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.NOVA_TEST_BASE || "http://127.0.0.1:8080";
const MAP = `${BASE}/pages/mission-map.html`;
const HOME = `${BASE}/index.html`;
const KEY = "novasky.mission.v1";

const SAMPLE_MISSION = {
  version: 1,
  missionDate: new Date().toISOString().slice(0, 10),
  timezone: "Europe/Rome",
  updatedAt: new Date().toISOString(),
  items: [
    {
      targetId: "m27",
      order: 0,
      durationMinutes: 95,
      plannedStart: "22:00",
      addedAt: "2026-07-12T20:00:00.000Z",
    },
    {
      targetId: "m13",
      order: 1,
      durationMinutes: 120,
      plannedStart: "23:10",
      addedAt: "2026-07-12T20:05:00.000Z",
    },
  ],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function preparePage(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("novasky-intro-seen", "1");
  });
}

async function waitForMissionReady(page) {
  await page.waitForSelector('[data-mission-timeline][data-mission-ready="true"]', {
    timeout: 20_000,
  });
}

async function missionCount(page) {
  return Number(await page.locator("[data-mission-count]").textContent());
}

async function seedMission(page) {
  await page.evaluate(
    ({ key, payload }) => localStorage.setItem(key, JSON.stringify(payload)),
    { key: KEY, payload: SAMPLE_MISSION },
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  let passed = 0;

  try {
    // Test A
    {
      const page = await context.newPage();
      await preparePage(page);
      await page.goto(MAP);
      await seedMission(page);
      await page.reload();
      await waitForMissionReady(page);
      assert.equal(await missionCount(page), 2);

      await page.goto(HOME);
      await page.goto(MAP);
      await waitForMissionReady(page);
      assert.equal(await missionCount(page), 2);
      console.log("  ✓ Test A — persistenza dopo Home → Mission Map");
      passed++;
      await page.close();
    }

    // Test B
    {
      const page = await context.newPage();
      await preparePage(page);
      await page.goto(MAP);
      await seedMission(page);
      await page.reload();
      await waitForMissionReady(page);
      assert.equal(await missionCount(page), 2);
      await page.reload();
      await waitForMissionReady(page);
      assert.equal(await missionCount(page), 2);
      console.log("  ✓ Test B — persistenza dopo refresh");
      passed++;
      await page.close();
    }

    // Test C
    {
      const page = await context.newPage();
      await preparePage(page);
      await page.goto(MAP);
      await seedMission(page);
      await page.reload();
      await waitForMissionReady(page);
      await page.locator(".chain-remove").first().click();
      await sleep(400);
      assert.equal(await missionCount(page), 1);
      await page.goto(HOME);
      await page.goto(MAP);
      await waitForMissionReady(page);
      assert.equal(await missionCount(page), 1);
      console.log("  ✓ Test C — rimozione persistita");
      passed++;
      await page.close();
    }

    // Test D
    {
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      await preparePage(page1);
      await preparePage(page2);
      await page1.goto(MAP);
      await seedMission(page1);
      await page1.reload();
      await waitForMissionReady(page1);
      await page2.goto(MAP);
      await waitForMissionReady(page2);
      assert.equal(await missionCount(page1), 2);

      await page1.locator(".chain-remove").first().click();
      await sleep(600);
      assert.equal(await missionCount(page2), 1);
      console.log("  ✓ Test D — sync tra schede via storage event");
      passed++;
      await page1.close();
      await page2.close();
    }

    // Test E
    {
      const page = await context.newPage();
      await preparePage(page);
      await page.goto(MAP);
      await page.evaluate((k) => localStorage.setItem(k, "{not-json"), KEY);
      await page.reload();
      await waitForMissionReady(page);
      assert.equal(await missionCount(page), 0);
      console.log("  ✓ Test E — JSON corrotto → missione vuota, nessun crash");
      passed++;
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${passed}/5 browser tests passed`);
  if (passed < 5) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
