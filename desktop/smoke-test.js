/**
 * Smoke test headless — avviare con: npm run test:smoke
 */

const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

const APP_SCHEME = "nova";
const desktopRoot = path.resolve(__dirname, "app");
const engineRoot = path.resolve(__dirname, "..", "website");
const errors = [];
const results = [];

function log(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function resolveProtocolFile(host, pathname) {
  let requestPath = decodeURIComponent(pathname || "/");
  if (requestPath === "/" || requestPath === "") requestPath = "/index.html";
  const relative = requestPath.replace(/^\/+/, "");
  const normalized = path.normalize(relative);
  const isEngine = host === "engine" || host === "app";
  const root = path.resolve(isEngine ? engineRoot : desktopRoot);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return path.join(root, "index.html");
  }
  const absolute = path.resolve(root, normalized);
  if (!absolute.startsWith(root)) return path.join(root, "index.html");
  return absolute;
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
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

    loading = true;
    const current = wc.getURL();
    if (current && !current.startsWith("about:")) {
      wc.stop();
      setTimeout(() => wc.loadURL(url), 300);
    } else {
      wc.loadURL(url);
    }
  });
}

async function clickNav(wc, route) {
  await wc.executeJavaScript(`
    document.querySelector('[data-route="${route}"]').click();
  `);
  await new Promise((r) => setTimeout(r, route === "mission-map" ? 3500 : 800));
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
  win.webContents.on("console-message", (_e, level, msg) => {
    if (level >= 2) errors.push(msg);
  });
  return win;
}

async function runTests() {
  const win = await createWindow();
  const wc = win.webContents;

  await loadUrl(wc, `${APP_SCHEME}://desktop/index.html`);
  await new Promise((r) => setTimeout(r, 1500));

  const isShell = await wc.executeJavaScript('document.documentElement.dataset.runtime === "desktop-shell"');
  log("Shell desktop attiva", isShell);

  const sidebar = await wc.executeJavaScript('!!document.querySelector("[data-sidebar]")');
  log("Sidebar presente", sidebar);

  const dashTitle = await wc.executeJavaScript('document.querySelector("[data-view-title]")?.textContent');
  log("Dashboard predefinita", dashTitle === "Dashboard", dashTitle);

  const dashStatus = await wc.executeJavaScript('!!document.querySelector(".dash-status")');
  log("Dashboard con dati cielo", dashStatus);

  await clickNav(wc, "mission-map");

  const canvas = await wc.executeJavaScript('!!document.getElementById("mission-canvas")');
  log("Mission Map canvas", canvas);

  const compactCard = await wc.executeJavaScript('!!document.querySelector(".desktop-target-card")');
  log("Card target compatta", compactCard);

  const sidebarWidth = await wc.executeJavaScript(`
    getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w').trim()
  `);
  log("Sidebar compatta", sidebarWidth === "188px" || sidebarWidth === "172px", sidebarWidth);

  await wc.executeJavaScript(`
    document.querySelector('[data-panel-toggle]').click();
  `);
  await new Promise((r) => setTimeout(r, 300));
  const panelCollapsed = await wc.executeJavaScript(
    'document.querySelector("[data-nova-app]").classList.contains("is-panel-collapsed")'
  );
  log("Pannello destro collassabile", panelCollapsed === true);
  await wc.executeJavaScript(`
    document.querySelector('[data-panel-toggle]').click();
  `);

  const targetImg = await wc.executeJavaScript(`
    fetch('nova://engine/assets/targets/mini/m31.png').then(r => r.ok).catch(() => false)
  `);
  log("Asset target engine", targetImg === true);

  await wc.executeJavaScript(`
    localStorage.setItem('novasky.mission.v1', JSON.stringify({
      version: 1,
      missionDate: new Date().toISOString().slice(0, 10),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      updatedAt: new Date().toISOString(),
      items: [{ targetId: 'm31', order: 0, durationMinutes: 30, plannedStart: null, addedAt: new Date().toISOString() }]
    }));
  `);

  await clickNav(wc, "dashboard");
  await clickNav(wc, "mission-map");

  const missionCount = await wc.executeJavaScript(`
    (() => {
      const el = document.querySelector('[data-mission-count]');
      return el ? parseInt(el.textContent, 10) : -1;
    })()
  `);
  log("Missione persistente", missionCount === 1, `count=${missionCount}`);

  await clickNav(wc, "attrezzatura");
  const gearCards = await wc.executeJavaScript("document.querySelectorAll('.gear-card').length");
  log("Attrezzatura 8 dispositivi", gearCards === 8, `cards=${gearCards}`);

  const fontsLocal = await wc.executeJavaScript(`
    [...document.styleSheets].some(s => s.href && s.href.includes('fonts.css'))
  `);
  log("Font Inter locale", fontsLocal);

  const pageSource = await wc.executeJavaScript("document.documentElement.outerHTML");
  log("Nessun localhost", !/localhost|127\\.0\\.0\\.1/i.test(pageSource));

  win.destroy();

  const win2 = await createWindow();
  await loadUrl(win2.webContents, `${APP_SCHEME}://desktop/index.html`);
  await new Promise((r) => setTimeout(r, 1000));
  await clickNav(win2.webContents, "mission-map");

  const missionReopen = await win2.webContents.executeJavaScript(`
    (() => {
      const el = document.querySelector('[data-mission-count]');
      return el ? parseInt(el.textContent, 10) : -1;
    })()
  `);
  log("Missione dopo riapertura", missionReopen === 1, `count=${missionReopen}`);

  win2.close();

  // ── Vista Missione operativa (Test A–G) ──
  const win3 = await createWindow();
  const wc3 = win3.webContents;
  await loadUrl(wc3, `${APP_SCHEME}://desktop/index.html`);
  await new Promise((r) => setTimeout(r, 1200));

  await wc3.executeJavaScript(`
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
    localStorage.removeItem('novasky.mission.desktop-meta.v1');
  `);

  await clickNav(wc3, "missione");
  await new Promise((r) => setTimeout(r, 800));

  const missioneView = await wc3.executeJavaScript('!!document.querySelector(".missione:not(.missione-empty)")');
  const stepCount = await wc3.executeJavaScript('document.querySelectorAll(".missione-step").length');
  log("Test A: Missione con 2 target", missioneView && stepCount === 2, `steps=${stepCount}`);

  const firstBefore = await wc3.executeJavaScript(`
    document.querySelector('.missione-step')?.dataset.stepId
  `);
  await wc3.executeJavaScript(`
    document.querySelector('.missione-step[data-step-id="m31"] [data-move-down]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const firstAfter = await wc3.executeJavaScript(`
    document.querySelector('.missione-step')?.dataset.stepId
  `);
  log("Test B: Riordino aggiorna sequenza", firstBefore === "m31" && firstAfter === "m51", `${firstBefore}→${firstAfter}`);

  const totalBefore = await wc3.executeJavaScript(`
    document.querySelector('.missione-summary strong')?.textContent
  `);
  await wc3.executeJavaScript(`
    document.querySelector('.missione-step[data-step-id="m51"] [data-dur="60"]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const totalAfter = await wc3.executeJavaScript(`
    (() => {
      const cells = document.querySelectorAll('.missione-summary strong');
      return cells[1]?.textContent;
    })()
  `);
  const endTime = await wc3.executeJavaScript(`
    (() => {
      const cells = document.querySelectorAll('.missione-summary strong');
      return cells[3]?.textContent;
    })()
  `);
  log("Test C: Durata aggiorna totale", totalBefore !== totalAfter && !!endTime, `total=${totalAfter}`);

  const persisted = await wc3.executeJavaScript(`
    JSON.parse(localStorage.getItem('novasky.mission.v1')).items.length
  `);
  log("Test D: Persistenza localStorage", persisted === 2, `items=${persisted}`);

  await wc3.executeJavaScript(`
    document.querySelector('.missione-step[data-step-id="m31"] [data-remove]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const afterRemove = await wc3.executeJavaScript('document.querySelectorAll(".missione-step").length');
  const storedAfterRemove = await wc3.executeJavaScript(`
    JSON.parse(localStorage.getItem('novasky.mission.v1')).items.map(i => i.targetId).join(',')
  `);
  log("Test E: Rimozione target", afterRemove === 1 && !storedAfterRemove.includes('m31'), storedAfterRemove);

  await wc3.executeJavaScript(`
    (() => {
      const orig = window.confirm;
      window.confirm = () => true;
      document.querySelector('[data-clear]')?.click();
      window.confirm = orig;
    })();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const emptyState = await wc3.executeJavaScript('!!document.querySelector(".missione-empty")');
  const storedEmpty = await wc3.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('novasky.mission.v1');
      if (!raw) return 0;
      return JSON.parse(raw).items.length;
    })()
  `);
  log("Test F: Svuota missione", emptyState && storedEmpty === 0);

  const nanCheck = await wc3.executeJavaScript(`
    !document.body.innerText.match(/\\bNaN\\b|undefined/)
  `);
  log("Test G: Nessun NaN/undefined", nanCheck === true);

  win3.close();

  const critical = errors.filter(
    (e) => !/favicon|DevTools|NetworkManager|GPU|Insecure Content-Security/i.test(e)
  );
  log("Zero errori console critici", critical.length === 0, critical.slice(0, 2).join(" | ") || "none");

  return results.every((r) => r.ok);
}

app.on("window-all-closed", () => {});

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
