/**
 * Smoke test headless — avviare con: npm run test:smoke
 */

const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

const APP_SCHEME = "nova";
const websiteRoot = path.resolve(__dirname, "..", "website");
const errors = [];
const results = [];

function log(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function resolveWebsiteFile(pathname) {
  let requestPath = decodeURIComponent(pathname || "/");
  if (requestPath === "/" || requestPath === "") requestPath = "/index.html";
  const relative = requestPath.replace(/^\/+/, "");
  const normalized = path.normalize(relative);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return path.join(websiteRoot, "index.html");
  }
  const absolute = path.resolve(websiteRoot, normalized);
  if (!absolute.startsWith(websiteRoot)) {
    return path.join(websiteRoot, "index.html");
  }
  return absolute;
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function registerProtocol() {
  protocol.registerFileProtocol(APP_SCHEME, (request, callback) => {
    try {
      const { pathname } = new URL(request.url);
      callback({ path: resolveWebsiteFile(pathname) });
    } catch {
      callback({ error: -2 });
    }
  });
}

/** @param {import('electron').WebContents} wc @param {string} url */
async function loadUrl(wc, url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout loading ${url}`));
    }, timeoutMs);

    let loading = false;

    const onFinish = () => {
      if (!loading) return;
      loading = false;
      cleanup();
      resolve();
    };
    const onFail = (_event, code, desc, failedUrl) => {
      if (!loading || failedUrl !== url) return;
      loading = false;
      cleanup();
      reject(new Error(`Failed ${code}: ${desc}`));
    };
    const cleanup = () => {
      clearTimeout(timer);
      wc.removeListener("did-finish-load", onFinish);
      wc.removeListener("did-fail-load", onFail);
      wc.removeListener("did-fail-provisional-load", onFail);
    };

    wc.on("did-finish-load", onFinish);
    wc.on("did-fail-load", onFail);
    wc.on("did-fail-provisional-load", onFail);

    const startLoad = () => {
      loading = true;
      wc.loadURL(url);
    };

    const current = wc.getURL();
    if (current && !current.startsWith("about:")) {
      wc.stop();
      setTimeout(startLoad, 300);
    } else {
      startLoad();
    }
  });
}

/** @param {import('electron').WebContents} wc */
function attachConsoleCapture(wc) {
  wc.on("console-message", (_event, level, message, _line, sourceId) => {
    if (level >= 2) {
      errors.push(`${message} (${sourceId})`);
    }
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  attachConsoleCapture(win.webContents);
  return win;
}

async function runTests() {
  const win = await createWindow();
  const wc = win.webContents;

  await loadUrl(wc, `${APP_SCHEME}://app/index.html`);

  const homeTitle = await wc.executeJavaScript("document.title");
  log("Home caricata", /NovaSky/i.test(homeTitle), homeTitle);

  const isDesktop = await wc.executeJavaScript("window.novaSkyDesktop?.isDesktop === true");
  log("Runtime desktop", isDesktop);

  const runtimeAttr = await wc.executeJavaScript("document.documentElement.dataset.runtime");
  log("data-runtime=desktop", runtimeAttr === "desktop", runtimeAttr || "missing");

  const heroImg = await wc.executeJavaScript(
    `(() => {
      const img = document.querySelector('img[src*="novasky-hero"]');
      return !!(img && img.complete && img.naturalWidth > 0);
    })()`,
  );
  log("Immagine hero Home", heroImg);

  await loadUrl(wc, `${APP_SCHEME}://app/pages/mission-map.html`);

  log("Navigazione Home → Mission Map", wc.getURL().includes("mission-map"), wc.getURL());

  const mapTitle = await wc.executeJavaScript("document.title");
  log("Mission Map caricata", /NovaSky/i.test(mapTitle), mapTitle);

  const canvas = await wc.executeJavaScript("!!document.getElementById('mission-canvas')");
  log("Canvas Mission Map", canvas);

  const observatory = await wc.executeJavaScript("!!document.querySelector('[data-observatory]')");
  log("UI Mission Map presente", observatory);

  await new Promise((r) => setTimeout(r, 2000));

  const targetImages = await wc.executeJavaScript(`
    fetch('/assets/targets/mini/m31.png')
      .then((r) => r.ok)
      .catch(() => false)
  `);
  log("Immagini target presenti", targetImages === true, targetImages ? "m31.png ok" : "fetch failed");

  await wc.executeJavaScript(
    `localStorage.setItem('novasky.mission.v1', JSON.stringify({
      version: 1,
      missionDate: new Date().toISOString().slice(0, 10),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      updatedAt: new Date().toISOString(),
      items: [{ targetId: 'm31', order: 0, durationMinutes: 30, plannedStart: null, addedAt: new Date().toISOString() }]
    }));`
  );

  await loadUrl(wc, `${APP_SCHEME}://app/index.html`);
  await loadUrl(wc, `${APP_SCHEME}://app/pages/mission-map.html`);
  await new Promise((r) => setTimeout(r, 2000));

  const missionCount = await wc.executeJavaScript(
    `(() => {
      const el = document.querySelector('[data-mission-count]');
      return el ? parseInt(el.textContent, 10) : -1;
    })()`,
  );
  log("Missione persistente dopo navigazione", missionCount === 1, `count=${missionCount}`);

  win.destroy();

  const win2 = await createWindow();
  const wc2 = win2.webContents;
  await loadUrl(wc2, `${APP_SCHEME}://app/pages/mission-map.html`);
  await new Promise((r) => setTimeout(r, 2000));

  const missionAfterReopen = await wc2.executeJavaScript(
    `(() => {
      const el = document.querySelector('[data-mission-count]');
      return el ? parseInt(el.textContent, 10) : -1;
    })()`,
  );
  log("Missione persistente dopo riapertura finestra", missionAfterReopen === 1, `count=${missionAfterReopen}`);

  const pageSource = await wc2.executeJavaScript("document.documentElement.outerHTML");
  const hasLocalhost = /localhost|127\\.0\\.0\\.1/i.test(pageSource);
  log("Nessun localhost nel DOM", !hasLocalhost);

  const scriptSrcs = await wc2.executeJavaScript(
    `[...document.querySelectorAll('script[src]')].map((s) => s.src).join('\\n')`
  );
  log("Script senza localhost", !/localhost|127\\.0\\.0\\.1/i.test(scriptSrcs));

  win2.close();

  const criticalErrors = errors.filter(
    (e) =>
      !/favicon|DevTools|Autofill|Third-party cookie|ERR_FILE_NOT_FOUND.*favicon|NetworkManager|GPU process|Insecure Content-Security-Policy/i.test(
        e
      )
  );
  log("Zero errori console critici", criticalErrors.length === 0, criticalErrors.slice(0, 3).join(" | ") || "none");

  return results.every((r) => r.ok);
}

app.on("window-all-closed", () => {
  // Mantieni il processo attivo fino al termine dei test headless.
});

app.whenReady().then(async () => {
  registerProtocol();
  try {
    const ok = await runTests();
    setImmediate(() => app.exit(ok ? 0 : 1));
  } catch (err) {
    console.error("Smoke test crash:", err);
    setImmediate(() => app.exit(1));
  }
});
