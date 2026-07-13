/**
 * Screenshot layout classico vs fotografico — npx electron capture-observatory-layouts.js
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
  const root = path.resolve(host === "engine" || host === "app" ? engineRoot : desktopRoot);
  const absolute = path.resolve(root, relative.replace(/^\/+/, ""));
  if (!absolute.startsWith(root)) return path.join(root, "index.html");
  return absolute;
}

protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

async function capture(label, photoMode) {
  fs.mkdirSync(outDir, { recursive: true });
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await win.loadURL(`${APP_SCHEME}://desktop/index.html`);
  await new Promise((r) => setTimeout(r, 1200));

  if (photoMode) {
    await win.webContents.executeJavaScript(`
      localStorage.setItem('novasky.desktop.ui.v1', JSON.stringify({ digitalObservatoryRedesign: true }));
    `);
    await win.webContents.executeJavaScript(`location.reload()`);
    await new Promise((r) => setTimeout(r, 1400));
  }

  await win.webContents.executeJavaScript(`document.querySelector('[data-route="attrezzatura"]').click()`);
  await new Promise((r) => setTimeout(r, 900));

  const image = await win.capturePage();
  fs.writeFileSync(path.join(outDir, `${label}.png`), image.toPNG());
  win.close();
  console.log(`Saved ${label}.png`);
}

app.whenReady().then(async () => {
  protocol.registerFileProtocol(APP_SCHEME, (req, cb) => {
    try {
      const url = new URL(req.url);
      cb({ path: resolveProtocolFile(url.hostname || "desktop", url.pathname) });
    } catch {
      cb({ error: -2 });
    }
  });
  try {
    await capture("observatory-layout-classic", false);
    await capture("observatory-layout-photo", true);
    app.exit(0);
  } catch (err) {
    console.error(err);
    app.exit(1);
  }
});
