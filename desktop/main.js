/**
 * NovaSky Desktop — processo principale Electron.
 * Serve website/ via protocollo nova:// (nessun localhost).
 */

const { app, BrowserWindow, Menu, shell, protocol } = require("electron");
const path = require("path");

const APP_SCHEME = "nova";
const WINDOW_DEFAULT = { width: 1440, height: 900, minWidth: 1024, minHeight: 700 };

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

/** @returns {string} Percorso assoluto alla cartella website */
function getWebsiteRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "website");
  }
  return path.join(__dirname, "..", "website");
}

/**
 * Risolve pathname nova:// → file system (anti path traversal).
 * @param {string} pathname
 */
function resolveWebsiteFile(pathname) {
  const websiteRoot = path.resolve(getWebsiteRoot());
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

function registerNovaProtocol() {
  protocol.registerFileProtocol(APP_SCHEME, (request, callback) => {
    try {
      const { pathname } = new URL(request.url);
      callback({ path: resolveWebsiteFile(pathname) });
    } catch {
      callback({ error: -2 });
    }
  });
}

/** @param {string} targetUrl */
function isInternalNovaUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    return parsed.protocol === `${APP_SCHEME}:`;
  } catch {
    return false;
  }
}

/** @param {import('electron').BrowserWindow} win */
function attachNavigationGuards(win) {
  const webContents = win.webContents;

  webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalNovaUrl(url)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  webContents.on("will-navigate", (event, url) => {
    if (isInternalNovaUrl(url)) return;
    if (/^https?:/i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createMainWindow() {
  const win = new BrowserWindow({
    ...WINDOW_DEFAULT,
    title: "NovaSky",
    icon: path.join(__dirname, "resources", "icon.png"),
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#05070a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  attachNavigationGuards(win);

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
    }
  });

  win.loadURL(`${APP_SCHEME}://app/index.html`);

  if (!app.isPackaged) {
    // DevTools solo in sviluppo — nessun menu tecnico visibile
    // win.webContents.openDevTools({ mode: "detach" });
  }

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerNovaProtocol();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
});
