/**
 * Unit tests — Seestar Alpaca read-only helpers (no hardware required).
 * Run: node test-seestar-adapter.js
 */

const assert = require("assert");
const { isAllowedAlpacaPath, alpacaHttpGet } = require("./main-alpaca.js");

function log(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

function buildTelescopeSnapshotFromProps(map, meta = {}) {
  const g = (key) => (map[key]?.available ? map[key].value : null);
  const caps = {};
  for (const key of Object.keys(map)) {
    if (key.startsWith("can") && map[key]?.available) caps[key] = Boolean(map[key].value);
  }
  return {
    liveState: "LIVE",
    source: "live",
    host: meta.host ?? null,
    ra: g("rightascension"),
    dec: g("declination"),
    capabilities: Object.keys(caps).length ? caps : null,
  };
}

async function main() {
  try {
    assert.strictEqual(isAllowedAlpacaPath("/management/v1/configureddevices"), true);
    assert.strictEqual(isAllowedAlpacaPath("/api/v1/telescope/0/rightascension"), true);
    assert.strictEqual(isAllowedAlpacaPath("/api/v1/camera/0/bayeroffsetx"), true);
    assert.strictEqual(isAllowedAlpacaPath("/api/v1/telescope/0/slewtocoordinates"), false);
    assert.strictEqual(isAllowedAlpacaPath("/api/v1/telescope/0/park"), false);
    assert.strictEqual(isAllowedAlpacaPath("/api/v1/camera/0/startexposure"), false);
    assert.strictEqual(isAllowedAlpacaPath("/api/v1/camera/0/imagearray"), false);
    log("alpaca path allowlist", true);
  } catch (e) {
    log("alpaca path allowlist", false, e.message);
  }

  try {
    const badHost = await alpacaHttpGet({ host: "8.8.8.8", port: 32323, path: "/management/apiversions" });
    assert.strictEqual(badHost.ok, false);
    assert.strictEqual(badHost.error, "host_not_allowed");
    const badPort = await alpacaHttpGet({ host: "10.0.0.1", port: 4700, path: "/api/v1/telescope/0/name" });
    assert.strictEqual(badPort.ok, false);
    assert.strictEqual(badPort.error, "port_not_allowed");
    const badPath = await alpacaHttpGet({ host: "10.0.0.1", port: 32323, path: "/api/v1/telescope/0/park" });
    assert.strictEqual(badPath.ok, false);
    assert.strictEqual(badPath.error, "path_not_allowed");
    log("alpaca host/port/path guards", true);
  } catch (e) {
    log("alpaca host/port/path guards", false, e.message);
  }

  try {
    const map = {
      connected: { available: true, value: false },
      rightascension: { available: true, value: 12.5 },
      declination: { available: true, value: -38.2 },
      canslew: { available: true, value: true },
      canslewaltaz: { available: true, value: false },
    };
    const snap = buildTelescopeSnapshotFromProps(map, { host: "10.0.0.1" });
    assert.strictEqual(snap.liveState, "LIVE");
    assert.strictEqual(snap.source, "live");
    assert.strictEqual(snap.ra, 12.5);
    assert.strictEqual(snap.capabilities.canslew, true);
    assert.strictEqual(snap.capabilities.canslewaltaz, false);
    log("snapshot builder (LIVE vs capability flags)", true);
  } catch (e) {
    log("snapshot builder (LIVE vs capability flags)", false, e.message);
  }

  console.log(process.exitCode ? "\nFAILED" : "\nOK");
}

main();
