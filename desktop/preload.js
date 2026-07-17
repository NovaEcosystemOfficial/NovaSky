/**
 * NovaSky Desktop — preload sicuro.
 * Espone metadati runtime + bridge Alpaca READ-ONLY (GET + discovery).
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("novaSkyDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.6",
  alpaca: {
    /** UDP discovery only */
    discover: (opts) => ipcRenderer.invoke("alpaca:discover", opts || {}),
    /** HTTP GET only — main process enforces allowlist */
    httpGet: (opts) => ipcRenderer.invoke("alpaca:httpGet", opts || {}),
  },
});

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.runtime = "desktop-shell";
});
