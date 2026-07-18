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

  const dashOk = await wc.executeJavaScript('!!document.querySelector(".dash-v2")');
  log("Dashboard v2 attiva", dashOk);

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
  await wc.executeJavaScript(`
    (() => {
      try {
        localStorage.setItem('novasky.desktop.ui.v1', JSON.stringify({ digitalObservatoryRedesign: false, missionMapRedesign: false }));
        const raw = localStorage.getItem('novasky.device-hub.v1');
        if (raw) {
          const hub = JSON.parse(raw);
          hub.preferences = { ...(hub.preferences || {}), simulationMode: true };
          hub.observatory = { ...(hub.observatory || {}), simulationMode: true };
          localStorage.setItem('novasky.device-hub.v1', JSON.stringify(hub));
        }
      } catch {}
    })();
    location.reload();
  `);
  await new Promise((r) => setTimeout(r, 900));
  await wc.executeJavaScript(`document.querySelector('[data-route="attrezzatura"]').click()`);
  await new Promise((r) => setTimeout(r, 800));

  const hubActive = await wc.executeJavaScript('!!document.querySelector(".device-hub-view")');
  const hubSummary = await wc.executeJavaScript(`
    document.querySelector("[data-hub-summary]")?.textContent?.trim() || ""
  `);
  const setupCount = await wc.executeJavaScript('document.querySelectorAll("[data-setup-id]").length');
  const gearCards = await wc.executeJavaScript("document.querySelectorAll('.gear-card').length");
  const simBadge = await wc.executeJavaScript('!!document.querySelector("[data-sim-badge]")');
  const canon2000dUnassigned = await wc.executeJavaScript(`
    (() => {
      const cards = [...document.querySelectorAll(".device-hub-unassigned .gear-card")];
      return cards.some(c => c.textContent.includes("2000D"));
    })()
  `);
  log(
    "Device Hub: 2 setup + 4 dispositivi + Device Hub attivo",
    hubActive && hubSummary.includes("2 setup + 4 dispositivi") && setupCount === 3 && gearCards >= 10 && simBadge,
    `summary=${hubSummary.slice(0, 60)} setups=${setupCount} cards=${gearCards}`
  );
  log("Canon EOS 2000D non assegnata", canon2000dUnassigned === true);

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
  const stepCount = await wc3.executeJavaScript('document.querySelectorAll(".missione-leg").length');
  const hasBriefing = await wc3.executeJavaScript('!!document.querySelector(".missione-briefing")');
  log("Test A: Missione con 2 target", missioneView && stepCount === 2 && hasBriefing, `steps=${stepCount}`);

  const firstBefore = await wc3.executeJavaScript(`
    document.querySelector('.missione-leg')?.dataset.stepId
  `);
  await wc3.executeJavaScript(`
    document.querySelector('.missione-leg[data-step-id="m31"] [data-move-down]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const firstAfter = await wc3.executeJavaScript(`
    document.querySelector('.missione-leg')?.dataset.stepId
  `);
  log("Test B: Riordino aggiorna sequenza", firstBefore === "m31" && firstAfter === "m51", `${firstBefore}→${firstAfter}`);

  await wc3.executeJavaScript(`
    document.querySelector('.missione-leg[data-step-id="m51"] [data-dur="60"]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const totalAfter = await wc3.executeJavaScript(`
    (() => {
      const dur = document.querySelector('.missione-leg-dur strong')?.textContent;
      return dur || '';
    })()
  `);
  log("Test C: Durata aggiorna totale", totalAfter.includes("60") || totalAfter.includes("1h"), `dur=${totalAfter}`);

  const persisted = await wc3.executeJavaScript(`
    JSON.parse(localStorage.getItem('novasky.mission.v1')).items.length
  `);
  log("Test D: Persistenza localStorage", persisted === 2, `items=${persisted}`);

  await wc3.executeJavaScript(`
    document.querySelector('.missione-leg[data-step-id="m31"] [data-remove]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 400));
  const afterRemove = await wc3.executeJavaScript('document.querySelectorAll(".missione-leg").length');
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

  await wc3.executeJavaScript(`
    localStorage.setItem('novasky.mission.v1', JSON.stringify({
      version: 1,
      missionDate: new Date().toISOString().slice(0, 10),
      timezone: 'UTC',
      updatedAt: new Date().toISOString(),
      items: [{ targetId: 'm31', order: 0, durationMinutes: 45, plannedStart: '22:30', addedAt: new Date().toISOString() }]
    }));
    localStorage.removeItem('novasky.mission.desktop-meta.v1');
  `);
  await clickNav(wc3, "dashboard");
  await clickNav(wc3, "missione");
  await new Promise((r) => setTimeout(r, 600));

  const hasStartBtn = await wc3.executeJavaScript('!!document.querySelector("[data-start-mission]")');
  if (hasStartBtn) {
    await wc3.executeJavaScript(`document.querySelector('[data-start-mission]')?.click()`);
  }
  await new Promise((r) => setTimeout(r, 400));
  const sessionActive = await wc3.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('novasky.mission.desktop-meta.v1');
      return raw ? JSON.parse(raw).sessionActive : false;
    })()
  `);
  log("Test H: Inizia missione", sessionActive === true);

  await wc3.executeJavaScript(`
    const cb = document.querySelector('[data-check-id="dome"]');
    if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
  `);
  await new Promise((r) => setTimeout(r, 200));
  const checklistSaved = await wc3.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('novasky.mission.desktop-meta.v1');
      return raw ? JSON.parse(raw).checklist?.dome === true : false;
    })()
  `);
  log("Test I: Checklist persistente", checklistSaved === true);

  win3.close();

  // ── Device Hub (Test A–I) ──
  const win4 = await createWindow();
  const wc4 = win4.webContents;
  await loadUrl(wc4, `${APP_SCHEME}://desktop/index.html`);
  await new Promise((r) => setTimeout(r, 1200));
  await wc4.executeJavaScript(`
    (() => {
      try {
        localStorage.setItem('novasky.desktop.ui.v1', JSON.stringify({ digitalObservatoryRedesign: false, missionMapRedesign: false }));
        const raw = localStorage.getItem('novasky.device-hub.v1');
        if (!raw) return;
        const hub = JSON.parse(raw);
        hub.observatory.name = 'Osservatorio Roma';
        hub.preferences = { ...(hub.preferences || {}), simulationMode: true };
        hub.observatory = { ...(hub.observatory || {}), name: 'Osservatorio Roma', simulationMode: true };
        // Evita connessioni LIVE residue da sessioni di test hardware
        hub.devices = (hub.devices || []).map((d) => ({
          ...d,
          connectionState: ['connected', 'operational', 'connecting'].includes(d.connectionState)
            ? 'disconnected'
            : d.connectionState,
        }));
        localStorage.setItem('novasky.device-hub.v1', JSON.stringify(hub));
      } catch {}
    })();
  `);
  await wc4.reload();
  await new Promise((r) => setTimeout(r, 1200));
  await clickNav(wc4, "attrezzatura");
  await new Promise((r) => setTimeout(r, 900));

  const dhA = await wc4.executeJavaScript(`
    (() => {
      const obs = localStorage.getItem('novasky.device-hub.v1');
      if (!obs) return false;
      try {
        const hub = JSON.parse(obs);
        return hub.observatory?.name === 'Osservatorio Roma' && hub.setups?.length === 3 && hub.devices?.length === 10;
      } catch { return false; }
    })()
  `);
  log("Test A: Seed osservatorio e setup", dhA === true);

  const dhB = await wc4.executeJavaScript(`
    (() => {
      try {
        const hub = JSON.parse(localStorage.getItem('novasky.device-hub.v1'));
        const deep = hub.setups.find(s => s.id === 'setup-deep-sky');
        const required = ['dev-mount-eq6','dev-eagle-core','dev-guide-camera','dev-focuser','dev-filter-wheel'];
        return required.every(id => deep?.deviceIds?.includes(id));
      } catch { return false; }
    })()
  `);
  log("Test B: DEEP SKY con placeholder", dhB === true);

  const dhC = await wc4.executeJavaScript(`
    (() => {
      try {
        const hub = JSON.parse(localStorage.getItem('novasky.device-hub.v1'));
        return !hub.setups.some(s => s.deviceIds.includes('dev-canon-2000d'));
      } catch { return false; }
    })()
  `);
  log("Test C: Canon 2000D libera nel Hub", dhC === true);

  const dhD = await wc4.executeJavaScript(`
    document.querySelectorAll('.obs-card[data-device-id]').length >= 10
  `);
  log("Test D: Card dispositivi nei setup", dhD === true);

  await wc4.executeJavaScript(`
    document.querySelector('[data-device-detail="dev-seestar-s50"]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 300));
  const dhE = await wc4.executeJavaScript(`
    document.querySelector('[data-obs-detail]')?.textContent?.includes('Seestar S50')
  `);
  log("Test E: Scheda dettaglio dispositivo", dhE === true);

  await wc4.executeJavaScript(`
    document.querySelector('[data-connect="dev-seestar-s50"]')?.click();
  `);
  await new Promise((r) => setTimeout(r, 700));
  const dhF = await wc4.executeJavaScript(`
    (() => {
      try {
        const hub = JSON.parse(localStorage.getItem('novasky.device-hub.v1'));
        const dev = hub.devices.find(d => d.id === 'dev-seestar-s50');
        return dev?.connectionState === 'connected';
      } catch { return false; }
    })()
  `);
  log("Test F: Simulazione connette dispositivo", dhF === true);

  await wc4.executeJavaScript(`document.querySelector('[data-obs-back]')?.click();`);
  await new Promise((r) => setTimeout(r, 350));
  await wc4.executeJavaScript(`
    document.querySelector('[data-obs-name]').value = 'Osservatorio Test';
    document.querySelector('[data-obs-name]').dispatchEvent(new Event('change', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 200));
  const dhG = await wc4.executeJavaScript(`
    (() => {
      try {
        return JSON.parse(localStorage.getItem('novasky.device-hub.v1')).observatory.name === 'Osservatorio Test';
      } catch { return false; }
    })()
  `);
  log("Test G: Profilo osservatorio persistente", dhG === true);

  const dhI = await wc4.executeJavaScript(`
    [...document.querySelectorAll('.obs-card img')].every(img => img.src.includes('photos/'))
  `);
  log("Test I: Asset fotografici catalogo", dhI === true);

  await clickNav(wc4, "dashboard");
  await new Promise((r) => setTimeout(r, 600));
  const dhH = await wc4.executeJavaScript(`
    document.body.innerText.includes('2 setup + 4 dispositivi')
  `);
  log("Test H: Dashboard legge Device Hub", dhH === true);

  win4.close();

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
