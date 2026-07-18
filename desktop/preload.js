/**
 * NovaSky Desktop — preload sicuro.
 * Alpaca READ-ONLY + EQ6 ASCOM (snapshot + MoveAxis manuale / stopAxes).
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("novaSkyDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.6",
  alpaca: {
    discover: (opts) => ipcRenderer.invoke("alpaca:discover", opts || {}),
    httpGet: (opts) => ipcRenderer.invoke("alpaca:httpGet", opts || {}),
  },
  eq6Ascom: {
    discover: () => ipcRenderer.invoke("eq6Ascom:discover"),
    snapshot: () => ipcRenderer.invoke("eq6Ascom:snapshot"),
    disconnect: () => ipcRenderer.invoke("eq6Ascom:disconnect"),
    /** Manual MoveAxis only — axis 0|1, rate deg/s signed */
    moveAxis: (opts) => ipcRenderer.invoke("eq6Ascom:moveAxis", opts || {}),
    /** MoveAxis(0,0) + MoveAxis(1,0) */
    stopAxes: () => ipcRenderer.invoke("eq6Ascom:stopAxes"),
  },
});

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.runtime = "desktop-shell";
});
