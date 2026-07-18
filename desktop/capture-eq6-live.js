/**
 * Cattura screenshot EQ6 LIVE read-only — verify UI without motion commands.
 * Usage: npx electron capture-eq6-live.js
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
const reportDir = path.resolve(__dirname, "..", "artifacts", "eq6-live-readonly");

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

  // Disable simulation, force-clear Seestar leftovers via editDevice, connect EQ6 LIVE
  const connectResult = await win.webContents.executeJavaScript(`
    (async () => {
      const mod = await import('./shared/device-hub/index.js');
      mod.toggleSimulationModeAndStopLive(false);
      let hub = mod.getDeviceHub();
      for (const d of hub.devices) {
        if (d.category === 'seestar') {
          try { await mod.disconnectDevice(d.id); } catch {}
          mod.editDevice(d.id, {
            connectionState: 'disconnected',
            operationalState: 'offline',
            dataSource: d.dataSource === 'simulated' ? 'simulated' : 'live',
          });
        }
      }
      hub = mod.getDeviceHub();
      if (!hub.devices.find(d => d.id === 'dev-mount-eq6')) return { ok: false, error: 'dev-mount-eq6 missing' };
      await mod.connectDevice('dev-mount-eq6');
      await new Promise(r => setTimeout(r, 3000));
      hub = mod.getDeviceHub();
      const d = hub.devices.find(x => x.id === 'dev-mount-eq6');
      const seestarStill = hub.devices.filter(x => x.category === 'seestar' && ['connected','operational'].includes(x.connectionState)).map(x => x.id);
      return {
        ok: d?.telemetry?.mount?.liveState === 'LIVE',
        connectionState: d?.connectionState,
        liveState: d?.telemetry?.mount?.liveState,
        mount: d?.telemetry?.mount || null,
        adapterId: d?.connection?.adapterId,
        dataSource: d?.dataSource,
        errors: d?.errors || [],
        capabilities: d?.capabilities || [],
        seestarStill,
      };
    })()
  `);

  fs.writeFileSync(path.join(reportDir, "connect-result.json"), JSON.stringify(connectResult, null, 2));

  // Dashboard briefing with EQ6 panel
  await win.webContents.executeJavaScript(`document.querySelector('[data-route="dashboard"]')?.click()`);
  await new Promise((r) => setTimeout(r, 2500));
  const dashCheck = await win.webContents.executeJavaScript(`
    ({
      hasEq6Label: /Montatura EQ6/.test(document.body.innerText),
      hasLive: /LIVE · EQMOD/.test(document.body.innerText) || /LIVE · EQMOD · COM3/.test(document.body.innerText),
      hasSiteWarning: /Coordinate sito EQMOD da verificare/.test(document.body.innerText),
      briefingMode: Boolean(document.querySelector('[data-dash-mode="briefing"]')),
    })
  `);
  const dashImg = await win.capturePage();
  fs.writeFileSync(path.join(outDir, "eq6-live-dashboard.png"), dashImg.toPNG());

  // Device Hub / attrezzatura detail
  await win.webContents.executeJavaScript(`document.querySelector('[data-route="attrezzatura"]')?.click()`);
  await new Promise((r) => setTimeout(r, 1500));
  await win.webContents.executeJavaScript(`
    (async () => {
      const btn = document.querySelector('[data-device-detail="dev-mount-eq6"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  const detailImg = await win.capturePage();
  fs.writeFileSync(path.join(outDir, "eq6-live-device-hub.png"), detailImg.toPNG());

  // Safety: ensure no motion UI buttons
  const safety = await win.webContents.executeJavaScript(`
    ({
      gotoButtons: document.querySelectorAll('[data-slew],[data-goto-mount],[data-park],[data-unpark],[data-move-axis]').length,
      motionText: Array.from(document.querySelectorAll('button')).filter(b => /slew|goto|park|unpark|moveaxis/i.test(b.textContent||'')).map(b => b.textContent.trim()),
      liveBadgePresent: /LIVE/.test(document.body.innerText),
      siteWarning: /Coordinate sito EQMOD da verificare/.test(document.body.innerText),
    })
  `);

  const report = {
    timestamp: new Date().toISOString(),
    connectResult,
    dashCheck,
    safety,
    screenshots: [
      "artifacts/screenshots/eq6-live-dashboard.png",
      "artifacts/screenshots/eq6-live-device-hub.png",
    ],
    motionCommandsSent: false,
    verdict: connectResult?.ok && safety?.gotoButtons === 0 ? "EQ6 LIVE READ-ONLY PASS" : "FAIL",
  };
  fs.writeFileSync(path.join(reportDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  // Disconnect cleanly
  await win.webContents.executeJavaScript(`
    (async () => {
      const mod = await import('./shared/device-hub/index.js');
      await mod.disconnectDevice('dev-mount-eq6');
    })()
  `);

  win.close();
  app.quit();
  process.exit(connectResult?.ok ? 0 : 1);
}

app.whenReady().then(main).catch((err) => {
  console.error(err);
  process.exit(1);
});
