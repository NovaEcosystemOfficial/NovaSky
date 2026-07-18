/**
 * Alpaca HTTP/UDP bridge — processo principale Electron.
 * SOLO GET + discovery UDP. Nessun PUT/POST/DELETE.
 * Nessuna porta 4700/4800.
 */

const dgram = require("dgram");
const http = require("http");
const { URL } = require("url");

const DISCOVERY_PORT = 32227;
const DISCOVERY_MESSAGE = Buffer.from("alpacadiscovery1");
const DEFAULT_TIMEOUT_MS = 4000;
const MAX_TIMEOUT_MS = 15000;

function clampTimeout(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(n), 500), MAX_TIMEOUT_MS);
}

function isPrivateOrLinkLocal(hostname) {
  if (hostname === "localhost" || hostname === "seestar.local") return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/**
 * Allow only Alpaca device/management GET paths on private hosts.
 * @param {string} pathName
 */
function isAllowedAlpacaPath(pathName) {
  const p = String(pathName || "").toLowerCase();
  if (p.startsWith("/management/")) return true;
  // Device API GET properties only (no action verbs that mutate)
  if (!/^\/api\/v1\/(telescope|camera|focuser|filterwheel|switch)\/\d+\/[a-z0-9]+$/i.test(p)) {
    return false;
  }
  // Block known write/action endpoints even if someone GETs them by mistake
  const blocked = [
    "slewtocoordinates",
    "slewtocoordinatesasync",
    "slewtotarget",
    "slewtotargetasync",
    "slewtoaltaz",
    "slewtoaltazasync",
    "abortslew",
    "park",
    "unpark",
    "findhome",
    "synctocoordinates",
    "synctotarget",
    "synctoaltaz",
    "moveaxis",
    "pulseguide",
    "startexposure",
    "stopexposure",
    "abortexposure",
    "imagearray",
    "imagearrayvariant",
  ];
  const leaf = p.split("/").pop();
  return !blocked.includes(leaf);
}

/**
 * @param {object} opts
 * @param {string} opts.host
 * @param {number} opts.port
 * @param {string} opts.path
 * @param {number} [opts.timeoutMs]
 */
function alpacaHttpGet(opts) {
  const host = String(opts.host || "").trim();
  const port = Number(opts.port) || 32323;
  const pathName = String(opts.path || "");
  const timeoutMs = clampTimeout(opts.timeoutMs);

  if (!host || !isPrivateOrLinkLocal(host)) {
    return Promise.resolve({
      ok: false,
      error: "host_not_allowed",
      message: "Solo host locali/privati (hotspot Seestar).",
    });
  }
  if (port !== 32323 && port !== 80) {
    return Promise.resolve({
      ok: false,
      error: "port_not_allowed",
      message: "Solo porte Alpaca 32323 (e 80 management UI). 4700/4800 bloccate.",
    });
  }
  if (!isAllowedAlpacaPath(pathName.split("?")[0])) {
    return Promise.resolve({
      ok: false,
      error: "path_not_allowed",
      message: `Path non consentito in read-only: ${pathName}`,
    });
  }

  const url = new URL(`http://${host}:${port}${pathName.startsWith("/") ? pathName : `/${pathName}`}`);

  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: "GET",
        timeout: timeoutMs,
        headers: { Accept: "application/json" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {
            /* keep raw */
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            httpStatus: res.statusCode,
            url: url.toString(),
            body,
            json,
            error: res.statusCode >= 400 ? "http_error" : null,
          });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout", message: `Timeout ${timeoutMs}ms`, url: url.toString() });
    });
    req.on("error", (err) => {
      resolve({ ok: false, error: "network", message: err.message, url: url.toString() });
    });
  });
}

/**
 * UDP Alpaca discovery (alpacadiscovery1 → port 32227).
 * @param {number} [timeoutMs]
 */
function alpacaDiscover(timeoutMs = 3000) {
  const wait = clampTimeout(timeoutMs);
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    /** @type {Array<{address:string,port:number,alpacaPort:number,raw:string}>} */
    const found = [];
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      resolve({ ok: true, devices: found });
    };

    const timer = setTimeout(finish, wait);

    socket.on("message", (msg, rinfo) => {
      const raw = msg.toString("utf8");
      let alpacaPort = 32323;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.AlpacaPort) alpacaPort = Number(parsed.AlpacaPort) || 32323;
      } catch {
        /* ignore */
      }
      if (!found.some((d) => d.address === rinfo.address && d.alpacaPort === alpacaPort)) {
        found.push({
          address: rinfo.address,
          port: rinfo.port,
          alpacaPort,
          raw,
        });
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      resolve({ ok: false, error: "udp_error", message: err.message, devices: found });
    });

    socket.bind(() => {
      try {
        socket.setBroadcast(true);
        socket.send(DISCOVERY_MESSAGE, 0, DISCOVERY_MESSAGE.length, DISCOVERY_PORT, "255.255.255.255");
      } catch (err) {
        clearTimeout(timer);
        finish();
        resolve({ ok: false, error: "udp_send", message: String(err?.message || err), devices: [] });
      }
    });
  });
}

/**
 * @param {import('electron').IpcMain} ipcMain
 */
function registerAlpacaIpc(ipcMain) {
  ipcMain.handle("alpaca:discover", async (_event, opts = {}) => alpacaDiscover(opts.timeoutMs));
  ipcMain.handle("alpaca:httpGet", async (_event, opts = {}) => alpacaHttpGet(opts));
}

module.exports = {
  registerAlpacaIpc,
  alpacaDiscover,
  alpacaHttpGet,
  isAllowedAlpacaPath,
};
