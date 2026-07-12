import { createDefaultHub, createDevice, createSetup } from "./schemas.js";

const PROFILE_STATUS = "in_development";

function placeholderDevice(overrides) {
  return createDevice({
    connectionState: "configured",
    integrationStatus: PROFILE_STATUS,
    dataSource: "simulated",
    ...overrides,
  });
}

export function createSeedHub() {
  const hub = createDefaultHub();

  const devices = [
    createDevice({
      id: "dev-seestar-s50",
      customName: "Seestar S50",
      brand: "ZWO",
      model: "S50",
      category: "seestar",
      imageKey: "seestar",
      connectionState: "disconnected",
      integrationStatus: "in_development",
      capabilities: ["connect", "disconnect", "goto", "capture", "liveView", "readBattery"],
      notes: "Setup smart telescope principale.",
    }),
    createDevice({
      id: "dev-seestar-s30-pro",
      customName: "Seestar S30 Pro",
      brand: "ZWO",
      model: "S30 Pro",
      category: "seestar",
      imageKey: "seestar",
      connectionState: "disconnected",
      integrationStatus: "in_development",
      capabilities: ["connect", "disconnect", "goto", "capture", "liveView", "readBattery"],
      notes: "Setup smart telescope portatile.",
    }),
    createDevice({
      id: "dev-canon-80d",
      customName: "Canon EOS 80D",
      brand: "Canon",
      model: "EOS 80D",
      category: "camera_main",
      imageKey: "canon_dslr",
      connectionState: "disconnected",
      integrationStatus: "in_development",
      capabilities: ["connect", "disconnect", "capture", "liveView"],
      notes: "Camera principale setup DEEP SKY.",
    }),
    createDevice({
      id: "dev-canon-2000d",
      customName: "Canon EOS 2000D",
      brand: "Canon",
      model: "EOS 2000D",
      category: "camera_main",
      imageKey: "canon_dslr",
      connectionState: "disconnected",
      integrationStatus: "in_development",
      capabilities: ["connect", "disconnect", "capture", "liveView"],
      notes: "Disponibile nel Device Hub — non assegnata a nessun setup.",
    }),
    placeholderDevice({
      id: "dev-mount-eq6",
      customName: "Montatura EQ6 / ZEQ6",
      brand: "Sky-Watcher",
      model: "EQ6 / ZEQ6",
      category: "mount",
      imageKey: "mount",
      capabilities: ["connect", "disconnect", "goto", "sync", "park", "unpark"],
    }),
    placeholderDevice({
      id: "dev-eagle-core",
      customName: "Eagle Core",
      brand: "PrimaLuceLab",
      model: "Eagle Core",
      category: "computer",
      imageKey: "eagle",
      capabilities: ["connect", "disconnect", "readBattery"],
    }),
    placeholderDevice({
      id: "dev-guide-camera",
      customName: "Camera guida",
      brand: "ZWO",
      model: "Guida",
      category: "camera_guide",
      imageKey: "guide_camera",
      capabilities: ["connect", "disconnect", "capture", "liveView"],
    }),
    placeholderDevice({
      id: "dev-focuser",
      customName: "Focheggiatore",
      brand: "Generic",
      model: "Elettrico",
      category: "focuser",
      imageKey: "focuser",
      capabilities: ["connect", "disconnect", "autofocus"],
    }),
    placeholderDevice({
      id: "dev-filter-wheel",
      customName: "Ruota portafiltri",
      brand: "ZWO",
      model: "EFW",
      category: "filter_wheel",
      imageKey: "filter_wheel",
      capabilities: ["connect", "disconnect"],
    }),
    placeholderDevice({
      id: "dev-telescope-ota",
      customName: "Telescopio rifrattore / newton",
      brand: "Osservatorio",
      model: "OTA DEEP SKY",
      category: "telescope",
      imageKey: "telescope",
      capabilities: ["connect", "disconnect"],
    }),
  ];

  const setups = [
    createSetup({
      id: "setup-deep-sky",
      name: "SETUP 1 — DEEP SKY",
      slug: "deep-sky",
      primaryDeviceId: "dev-telescope-ota",
      deviceIds: [
        "dev-telescope-ota",
        "dev-mount-eq6",
        "dev-canon-80d",
        "dev-guide-camera",
        "dev-focuser",
        "dev-filter-wheel",
        "dev-eagle-core",
      ],
      notes: "Sistema ottico completo per astrofotografia tradizionale.",
    }),
    createSetup({
      id: "setup-seestar-s50",
      name: "SETUP 2 — SMART TELESCOPE",
      slug: "smart-telescope",
      primaryDeviceId: "dev-seestar-s50",
      deviceIds: ["dev-seestar-s50"],
      notes: "Seestar S50 — osservazione e imaging integrato.",
    }),
    createSetup({
      id: "setup-seestar-s30",
      name: "SETUP 3 — SMART TELESCOPE PORTATILE",
      slug: "smart-telescope-portable",
      primaryDeviceId: "dev-seestar-s30-pro",
      deviceIds: ["dev-seestar-s30-pro"],
      notes: "Seestar S30 Pro — setup compatto e mobile.",
    }),
  ];

  return {
    ...hub,
    devices,
    setups,
    seeded: true,
    updatedAt: new Date().toISOString(),
  };
}

export function ensureSeededHub(loadFn, saveFn) {
  const current = loadFn();
  if (current.seeded && current.devices.length > 0) return current;
  const seeded = createSeedHub();
  return saveFn(seeded);
}
