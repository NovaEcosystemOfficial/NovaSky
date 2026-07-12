/**
 * Cattura screenshot Mission Map — node capture-screenshot.js
 */
const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const fs = require("fs");

app.disableHardwareAcceleration();

const APP_SCHEME = "nova";
const desktopRoot = path.resolve(__dirname, "app");
const engineRoot = path.resolve(__dirname, "..", "website");
const outDir = path.resolve(__dirname, "..", "artifacts", "screenshots");

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

async function capture(label, route = "mission-map") {
  fs.mkdirSync(outDir, { recursive: true });
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
  await new Promise((r) => setTimeout(r, 1200));

  if (route === "missione") {
    await win.webContents.executeJavaScript(`
      localStorage.setItem('novasky.mission.v1', JSON.stringify({
        version: 1,
        missionDate: new Date().toISOString().slice(0, 10),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        updatedAt: new Date().toISOString(),
        items: [
          { targetId: 'm31', order: 0, durationMinutes: 45, plannedStart: '22:30', addedAt: new Date().toISOString() },
          { targetId: 'm51', order: 1, durationMinutes: 30, plannedStart: '23:15', addedAt: new Date().toISOString() }
        ]
      }));
    `);
  }

  await win.webContents.executeJavaScript(`document.querySelector('[data-route="${route}"]').click()`);
  await new Promise((r) => setTimeout(r, route === "mission-map" ? 4000 : 1200));

  const image = await win.capturePage();
  const file = path.join(outDir, `${label}.png`);
  fs.writeFileSync(file, image.toPNG());
  win.close();
  console.log(`Saved ${file}`);
}

app.whenReady().then(async () => {
  registerProtocol();
  try {
    const arg = process.argv[2] || "mission-map-after";
    const route = process.argv[3] || "mission-map";
    await capture(arg, route);
    app.exit(0);
  } catch (err) {
    console.error(err);
    app.exit(1);
  }
});
