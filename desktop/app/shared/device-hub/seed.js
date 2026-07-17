import { createDefaultHub, createDevice, createSetup } from "./schemas.js";

function profile(overrides) {
  return createDevice({
    connectionState: "disconnected",
    integrationStatus: "registered",
    dataSource: "simulated",
    history: [],
    upcomingUpdates: [],
    ...overrides,
  });
}

export function createSeedHub() {
  const hub = createDefaultHub();
  const now = new Date().toISOString();
  const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();

  const devices = [
    profile({
      id: "dev-seestar-s50",
      customName: "Seestar S50",
      brand: "ZWO",
      model: "S50",
      category: "seestar",
      imageKey: "seestar_s50",
      serial: "ZWO-S50-2024-0847",
      connection: { type: "Wi-Fi", adapterId: "zwo-seestar", driver: "Seestar" },
      capabilities: ["connect", "disconnect", "goto", "capture", "liveView", "readBattery"],
      telemetry: {
        power: { state: "standby", batteryPct: 92 },
        temperature: { celsius: 18, sensor: "ambiente" },
        firmware: { version: "1.8.4", channel: "stable" },
      },
      ports: ["Wi-Fi 2.4/5 GHz", "USB-C"],
      usb: [],
      compatibility: ["ASIAIR", "Seestar App", "NovaSky Seestar Adapter"],
      upcomingUpdates: ["Telemetria live stack", "Sync Mission Map"],
      manualUrl: "https://astronomy-imaging-camera.com/manuals/seestar",
      lastUsedAt: ago(3),
      history: [{ at: ago(3), event: "Sessione M31 — 45 min" }],
      layout: { zone: "pier-east", x: 72, y: 38, scale: 1.1 },
      notes: "Smart telescope principale — pier est.",
    }),
    profile({
      id: "dev-seestar-s30-pro",
      customName: "Seestar S30 Pro",
      brand: "ZWO",
      model: "S30 Pro",
      category: "seestar",
      imageKey: "seestar_s30",
      serial: "ZWO-S30P-2025-0112",
      connection: {
        type: "ASCOM Alpaca",
        adapterId: "seestar-alpaca",
        driver: "Seestar.Alpaca / Telescope V3",
        port: "32323",
      },
      capabilities: ["connect", "disconnect", "readBattery"],
      telemetry: {
        power: { state: "standby", batteryPct: 100 },
        firmware: { version: "1.2.0-3", channel: "alpaca" },
        mount: null,
        cameras: null,
      },
      ports: ["Wi-Fi hotspot", "Alpaca :32323"],
      compatibility: ["ASCOM Alpaca", "Seestar App", "NovaSky SeestarAdapter v0 read-only"],
      layout: { zone: "mobile", x: 22, y: 68, scale: 0.9 },
      notes:
        "LIVE Alpaca read-only (GET). Disattiva simulazione e Connetti sull'hotspot Seestar. Nessun GOTO/park/capture in v0.",
      dataSource: "live",
      integrationStatus: "live",
    }),
    profile({
      id: "dev-canon-80d",
      customName: "Canon EOS 80D",
      brand: "Canon",
      model: "EOS 80D",
      category: "camera_main",
      imageKey: "canon_80d",
      serial: "Canon-80D-298104",
      connection: { type: "USB", adapterId: "canon-edsdk", driver: "Canon EDSDK" },
      telemetry: {
        power: { state: "off", drawWatts: 0 },
        firmware: { version: "1.1.3", channel: "stable" },
      },
      ports: ["USB", "HDMI", "Remote"],
      usb: ["Eagle Core USB3 #2"],
      compatibility: ["Canon EDSDK", "NINA", "ASCOM"],
      layout: { zone: "imaging-train", x: 50, y: 28, scale: 0.85 },
      notes: "Camera principale imaging train DEEP SKY.",
    }),
    profile({
      id: "dev-canon-2000d",
      customName: "Canon EOS 2000D",
      brand: "Canon",
      model: "EOS 2000D",
      category: "camera_main",
      imageKey: "canon_2000d",
      serial: "Canon-2000D-551902",
      connection: { type: "USB", adapterId: "canon-edsdk", driver: "Canon EDSDK" },
      telemetry: { power: { state: "off" }, firmware: { version: "1.0.1" } },
      ports: ["USB", "HDMI"],
      usb: [],
      compatibility: ["Canon EDSDK", "NINA"],
      layout: { zone: "storage", x: 18, y: 82, scale: 0.75 },
      notes: "Riserva — non assegnata a setup attivo.",
    }),
    profile({
      id: "dev-mount-eq6",
      customName: "Montatura EQ6-R Pro",
      brand: "Sky-Watcher",
      model: "EQ6-R Pro",
      category: "mount",
      imageKey: "eq6",
      serial: "SW-EQ6R-2019-4421",
      connection: { type: "USB", adapterId: "skywatcher", driver: "SynScan / EQMOD" },
      capabilities: ["connect", "disconnect", "goto", "sync", "park", "unpark"],
      telemetry: {
        power: { state: "standby", drawWatts: 12 },
        firmware: { version: "4.39.12", channel: "SynScan" },
      },
      ports: ["USB-B", "ST-4", "Snap port"],
      usb: ["Eagle Core USB3 #1"],
      compatibility: ["EQMOD", "ASCOM", "SynScan", "NINA"],
      upcomingUpdates: ["ASCOM Alpaca bridge"],
      layout: { zone: "pier", x: 50, y: 52, scale: 1.2 },
    }),
    profile({
      id: "dev-eagle-core",
      customName: "Eagle Core",
      brand: "PrimaLuceLab",
      model: "Eagle Core",
      category: "controller",
      imageKey: "eagle_core",
      serial: "PLL-EAGLE-2021-0093",
      connection: { type: "Ethernet", adapterId: "eagle", driver: "Eagle Manager" },
      telemetry: {
        power: { state: "on", drawWatts: 28 },
        temperature: { celsius: 34, sensor: "interno" },
        firmware: { version: "3.2.1", channel: "stable" },
      },
      ports: ["Ethernet", "Wi-Fi", "12× USB", "Power out"],
      usb: ["EQ6", "Canon 80D", "Guida ZWO", "EFW", "Focuser"],
      compatibility: ["Eagle Manager", "NINA", "PHD2", "NovaSky Eagle Adapter"],
      layout: { zone: "rack", x: 82, y: 58, scale: 1 },
    }),
    profile({
      id: "dev-guide-camera",
      customName: "ZWO ASI 290 Mini",
      brand: "ZWO",
      model: "ASI 290 Mini",
      category: "camera_guide",
      imageKey: "guide_camera",
      serial: "ZWO-290M-2020-7712",
      connection: { type: "USB", adapterId: "zwo-asi", driver: "ASI SDK" },
      telemetry: {
        power: { state: "standby" },
        temperature: { celsius: -5, sensor: "sensore" },
        firmware: { version: "2.1", channel: "stable" },
      },
      ports: ["USB3", "ST-4"],
      usb: ["Eagle Core USB3 #4"],
      compatibility: ["PHD2", "NINA", "ASCOM", "ZWO ASI"],
      layout: { zone: "guide-scope", x: 38, y: 22, scale: 0.7 },
    }),
    profile({
      id: "dev-focuser",
      customName: "Sesto Senso 2",
      brand: "PrimaLuceLab",
      model: "Sesto Senso 2",
      category: "focuser",
      imageKey: "focuser",
      serial: "PLL-SS2-2022-0188",
      connection: { type: "USB", adapterId: "primelucelab", driver: "PLM SDK" },
      telemetry: { power: { state: "standby" }, firmware: { version: "1.4.0" } },
      ports: ["USB-C"],
      usb: ["Eagle Core USB3 #5"],
      compatibility: ["NINA", "ASCOM", "Eagle"],
      layout: { zone: "imaging-train", x: 52, y: 32, scale: 0.6 },
    }),
    profile({
      id: "dev-filter-wheel",
      customName: "ZWO EFW 7×36mm",
      brand: "ZWO",
      model: "EFW 7×36mm",
      category: "filter_wheel",
      imageKey: "filter_wheel",
      serial: "ZWO-EFW7-2021-3309",
      connection: { type: "USB", adapterId: "zwo-asi", driver: "EFW SDK" },
      telemetry: { power: { state: "standby" }, firmware: { version: "1.0.8" } },
      ports: ["USB2"],
      usb: ["Eagle Core USB3 #3"],
      compatibility: ["NINA", "ASCOM", "ZWO EFW"],
      layout: { zone: "imaging-train", x: 48, y: 30, scale: 0.65 },
    }),
    profile({
      id: "dev-telescope-ota",
      customName: "Sky-Watcher Esprit 100ED",
      brand: "Sky-Watcher",
      model: "Esprit 100ED",
      category: "telescope",
      imageKey: "ota_deep_sky",
      serial: "SW-ESP100-2018-1204",
      connection: { type: "Non definita", adapterId: "simulation" },
      specs: { aperture: "100mm", focalLength: "550mm", fRatio: "f/5.5" },
      telemetry: { power: { state: "off" } },
      compatibility: ["OTA ottico — nessun driver"],
      layout: { zone: "pier", x: 50, y: 35, scale: 1.15 },
    }),
  ];

  const setups = [
    createSetup({
      id: "setup-deep-sky",
      name: "DEEP SKY — Imaging train",
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
      name: "SMART TELESCOPE — S50",
      slug: "smart-telescope",
      primaryDeviceId: "dev-seestar-s50",
      deviceIds: ["dev-seestar-s50"],
      notes: "Seestar S50 — osservazione e imaging integrato.",
    }),
    createSetup({
      id: "setup-seestar-s30",
      name: "SMART TELESCOPE — S30 Pro",
      slug: "smart-telescope-portable",
      primaryDeviceId: "dev-seestar-s30-pro",
      deviceIds: ["dev-seestar-s30-pro"],
      notes: "Seestar S30 Pro — setup compatto e mobile.",
    }),
  ];

  return {
    ...hub,
    version: 2,
    devices,
    setups,
    seeded: true,
    updatedAt: now,
  };
}

export function ensureSeededHub(loadFn, saveFn) {
  let current = loadFn();
  if (!(current.version >= 2 && current.seeded && current.devices.length >= 10)) {
    const seeded = createSeedHub();
    return saveFn(seeded);
  }

  // Migrate S30 Pro profile to Seestar Alpaca read-only adapter (idempotent)
  const s30 = current.devices.find((d) => d.id === "dev-seestar-s30-pro");
  if (s30 && s30.connection?.adapterId !== "seestar-alpaca") {
    current = {
      ...current,
      devices: current.devices.map((d) =>
        d.id === "dev-seestar-s30-pro"
          ? {
              ...d,
              connection: {
                ...d.connection,
                type: "ASCOM Alpaca",
                adapterId: "seestar-alpaca",
                driver: "Seestar.Alpaca / Telescope V3",
                port: d.connection?.port || "32323",
              },
              capabilities: ["connect", "disconnect", "readBattery"],
              compatibility: ["ASCOM Alpaca", "Seestar App", "NovaSky SeestarAdapter v0 read-only"],
              notes:
                d.notes ||
                "LIVE Alpaca read-only (GET). Disattiva simulazione e Connetti sull'hotspot Seestar.",
              dataSource: d.dataSource === "simulated" && d.connectionState === "connected" ? "simulated" : "live",
            }
          : d
      ),
    };
    return saveFn(current);
  }
  return current;
}
