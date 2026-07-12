/**
 * NovaSky Desktop — preload sicuro.
 * Espone solo metadati runtime; nessuna API Node diretta alla UI.
 */

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("novaSkyDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.0",
});

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.runtime = "desktop";
});
