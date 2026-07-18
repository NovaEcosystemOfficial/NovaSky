/**
 * Verify SIM→LIVE routing for EQ6 (read-only).
 * Reproduces: sim ON connect → sim OFF → must show LIVE not SIM.
 */
const { app, BrowserWindow, protocol, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { registerEq6AscomIpc } = require("./main-eq6-ascom");
const { registerAlpacaIpc } = require("./main-alpaca");

app.disableHardwareAcceleration();

const APP_SCHEME = "nova";
const desktopRoot = path.resolve(__dirname, "app");
const engineRoot = path.resolve(__dirname, "..", "website");
const outDir = path.resolve(__dirname, "..", "artifacts", "screenshots");
const reportDir = path.resolve(__dirname, "..", "artifacts", "eq6-sim-live-fix");

function resolveProtocolFile(host, pathname) {
  let requestPath = decodeURIComponent(pathname || "/");
  if (requestPath === "/" || requestPath === "") requestPath = "/index.html";
  const relative = requestPath.replace(/^\/+/, "");
  const normalized = path.normalize(relative);
  const isEngine = host === "engine" || host === "app";
  const root = path.resolve(isEngine ? engineRoot : desktopRoot);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) return path.join(root, "index.html");
  const absolute = path.resolve(root, normalized);
  if (!absolute.startsWith(root)) return path.join(root, "index.html");
  return absolute;
}

protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function registerProtocol() {
  protocol.registerFileProtocol(APP_SCHEME, (request, callback) => {
    try {
      const url = new URL(request.url);
      callback({ path: resolveProtocolFile(url.hostname || "desktop", url.pathname) });
    } catch {
      callback({ error: -2 });
    }
  });
}

async function main() {
  registerProtocol();
  registerAlpacaIpc(ipcMain);
  registerEq6AscomIpc(ipcMain);
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(reportDir, { recursive: true });

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await win.loadURL(`${APP_SCHEME}://desktop/index.html`);
  await new Promise((r) => setTimeout(r, 1500));

  const result = await win.webContents.executeJavaScript(`
    (async () => {
      const mod = await import('./shared/device-hub/index.js');

      // 1) SIM ON + connect EQ6 as mock
      mod.toggleSimulationMode(true);
      await mod.connectDevice('dev-mount-eq6');
      const afterSim = mod.getDeviceHub().devices.find(d => d.id === 'dev-mount-eq6');
      const simBadge = mod.deviceModeBadge(afterSim);
      const simLabel = mod.deviceStatusLabel(afterSim);

      // 2) SIM OFF — must demote mock and auto LIVE-reconnect EQ6
      mod.toggleSimulationMode(false);
      // Bridge ASCOM 32-bit può richiedere alcuni secondi
      let afterLive = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        afterLive = mod.getDeviceHub().devices.find(d => d.id === 'dev-mount-eq6');
        if (afterLive?.telemetry?.mount?.liveState === 'LIVE') break;
      }
      const liveBadge = mod.deviceModeBadge(afterLive);
      const liveLabel = mod.deviceStatusLabel(afterLive);
      const simMode = mod.isSimulationMode();

      return {
        simMode,
        afterSim: {
          connectionState: afterSim?.connectionState,
          dataSource: afterSim?.dataSource,
          badge: simBadge,
          label: simLabel,
        },
        afterLive: {
          connectionState: afterLive?.connectionState,
          dataSource: afterLive?.dataSource,
          liveState: afterLive?.telemetry?.mount?.liveState,
          badge: liveBadge,
          label: liveLabel,
          name: afterLive?.telemetry?.mount?.name,
          driverInfo: afterLive?.telemetry?.mount?.driverInfo,
          comPort: afterLive?.telemetry?.mount?.comPort,
          ra: afterLive?.telemetry?.mount?.ra,
          dec: afterLive?.telemetry?.mount?.dec,
          altitude: afterLive?.telemetry?.mount?.altitude,
          azimuth: afterLive?.telemetry?.mount?.azimuth,
          tracking: afterLive?.telemetry?.mount?.tracking,
          slewing: afterLive?.telemetry?.mount?.slewing,
          atPark: afterLive?.telemetry?.mount?.atPark,
          lastPollAt: afterLive?.telemetry?.mount?.lastPollAt,
          source: afterLive?.telemetry?.mount?.source,
        },
        pass:
          simMode === false &&
          afterSim?.dataSource === 'simulated' &&
          simBadge === 'SIM' &&
          afterLive?.dataSource === 'live' &&
          afterLive?.telemetry?.mount?.liveState === 'LIVE' &&
          liveBadge === 'LIVE' &&
          !/SIM/i.test(liveLabel) &&
          afterLive?.telemetry?.mount?.ra != null,
      };
    })()
  `);

  // Wait for a second poll tick
  await new Promise((r) => setTimeout(r, 2000));
  const poll2 = await win.webContents.executeJavaScript(`
    (async () => {
      const mod = await import('./shared/device-hub/index.js');
      const d = mod.getDeviceHub().devices.find(x => x.id === 'dev-mount-eq6');
      return {
        lastPollAt: d?.telemetry?.mount?.lastPollAt,
        ra: d?.telemetry?.mount?.ra,
        badge: mod.deviceModeBadge(d),
      };
    })()
  `);

  await win.webContents.executeJavaScript(`document.querySelector('[data-route="attrezzatura"]')?.click()`);
  await new Promise((r) => setTimeout(r, 800));
  await win.webContents.executeJavaScript(`document.querySelector('[data-device-detail="dev-mount-eq6"]')?.click()`);
  await new Promise((r) => setTimeout(r, 1200));
  const uiText = await win.webContents.executeJavaScript(`({
    hasLive: /LIVE/.test(document.body.innerText),
    hasSimOnline: /Online\\s*[·•]\\s*SIM/i.test(document.body.innerText),
    hasEqmod: /EQMOD/i.test(document.body.innerText),
    hasCom3: /COM3/i.test(document.body.innerText),
  })`);
  const img = await win.capturePage();
  fs.writeFileSync(path.join(outDir, "eq6-sim-to-live-fix.png"), img.toPNG());

  await win.webContents.executeJavaScript(`document.querySelector('[data-route="dashboard"]')?.click()`);
  await new Promise((r) => setTimeout(r, 1500));
  const dashImg = await win.capturePage();
  fs.writeFileSync(path.join(outDir, "eq6-sim-to-live-dashboard.png"), dashImg.toPNG());

  const report = {
    timestamp: new Date().toISOString(),
    result,
    poll2,
    uiText,
    pollUpdated: Boolean(poll2?.lastPollAt && poll2.lastPollAt !== result?.afterLive?.lastPollAt),
    motionCommandsSent: false,
    verdict: result?.pass && !uiText?.hasSimOnline ? "EQ6 SIM→LIVE ROUTING PASS" : "FAIL",
  };
  fs.writeFileSync(path.join(reportDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  await win.webContents.executeJavaScript(`
    (async () => {
      const mod = await import('./shared/device-hub/index.js');
      await mod.disconnectDevice('dev-mount-eq6');
    })()
  `);

  win.close();
  app.quit();
  process.exit(report.verdict.includes("PASS") ? 0 : 1);
}

app.whenReady().then(main).catch((err) => {
  console.error(err);
  process.exit(1);
});
