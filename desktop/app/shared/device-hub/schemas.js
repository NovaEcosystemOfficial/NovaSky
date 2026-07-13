/** Device Hub — schemi, enum e sanitizzazione (desktop-only). */

export const HUB_STORAGE_KEY = "novasky.device-hub.v1";
export const HUB_VERSION = 2;

export const DEVICE_CATEGORIES = {
  mount: { key: "mount", label: "Montatura", section: "mounts" },
  telescope: { key: "telescope", label: "OTA", section: "ota" },
  ota: { key: "ota", label: "OTA", section: "ota" },
  guide_scope: { key: "guide_scope", label: "Telescopio guida", section: "guide_scopes" },
  camera_main: { key: "camera_main", label: "Camera", section: "cameras" },
  camera_cooled: { key: "camera_cooled", label: "Camera refrigerata", section: "cameras" },
  camera_guide: { key: "camera_guide", label: "Camera guida", section: "guide_cameras" },
  seestar: { key: "seestar", label: "Smart telescope", section: "cameras" },
  controller: { key: "controller", label: "Controller", section: "controllers" },
  focuser: { key: "focuser", label: "Focheggiatore", section: "accessories" },
  filter_wheel: { key: "filter_wheel", label: "Ruota portafiltri", section: "accessories" },
  rotator: { key: "rotator", label: "Rotatore", section: "accessories" },
  computer: { key: "computer", label: "Computer astronomico", section: "computers" },
  weather: { key: "weather", label: "Meteo", section: "accessories" },
  power: { key: "power", label: "Alimentazione", section: "power" },
  eyepiece: { key: "eyepiece", label: "Oculare", section: "eyepieces" },
  observatory: { key: "observatory", label: "Osservatorio", section: "accessories" },
  accessory: { key: "accessory", label: "Accessorio", section: "accessories" },
};

export const CONNECTION_STATES = {
  unconfigured: { key: "unconfigured", label: "Non configurato", color: "muted" },
  configured: { key: "configured", label: "Configurato", color: "cyan" },
  disconnected: { key: "disconnected", label: "Non collegato", color: "muted" },
  connecting: { key: "connecting", label: "Collegamento in corso", color: "cyan" },
  connected: { key: "connected", label: "Collegato", color: "cyan" },
  operational: { key: "operational", label: "Operativo", color: "green" },
  attention: { key: "attention", label: "Attenzione", color: "amber" },
  error: { key: "error", label: "Errore", color: "danger" },
};

export const CONNECTION_TYPES = [
  "USB", "Seriale", "Wi-Fi", "Ethernet", "Bluetooth",
  "ASCOM", "ASCOM Alpaca", "SynScan", "Proprietaria", "Non definita",
];

export const INTEGRATION_STATUS = {
  profile_only: "Profilo configurato — connessione non ancora disponibile",
  in_development: "Integrazione in sviluppo",
  simulated: "Dati simulati",
  live: "Connessione reale",
};

export const CAPABILITIES = [
  "connect", "disconnect", "goto", "sync", "park", "unpark",
  "capture", "liveView", "autofocus", "setTemperature",
  "readBattery", "readWeather", "openRoof", "closeRoof", "emergencyStop",
];

const CATEGORY_CAPABILITIES = {
  mount: ["connect", "disconnect", "goto", "sync", "park", "unpark"],
  telescope: ["connect", "disconnect"],
  ota: ["connect", "disconnect"],
  guide_scope: ["connect", "disconnect"],
  camera_main: ["connect", "disconnect", "capture", "liveView"],
  camera_cooled: ["connect", "disconnect", "capture", "liveView", "setTemperature"],
  camera_guide: ["connect", "disconnect", "capture", "liveView"],
  seestar: ["connect", "disconnect", "goto", "capture", "liveView", "readBattery"],
  controller: ["connect", "disconnect", "readBattery"],
  focuser: ["connect", "disconnect", "autofocus"],
  filter_wheel: ["connect", "disconnect"],
  rotator: ["connect", "disconnect"],
  computer: ["connect", "disconnect", "readBattery"],
  weather: ["connect", "disconnect", "readWeather"],
  power: ["connect", "disconnect", "readBattery"],
  eyepiece: ["connect", "disconnect"],
  observatory: ["connect", "disconnect", "openRoof", "closeRoof", "emergencyStop"],
  accessory: ["connect", "disconnect"],
};

function defaultTelemetry(raw = {}) {
  return {
    power: {
      state: raw.telemetry?.power?.state || raw.powerState || "standby",
      drawWatts: raw.telemetry?.power?.drawWatts ?? null,
      batteryPct: raw.telemetry?.power?.batteryPct ?? null,
    },
    temperature: {
      celsius: raw.telemetry?.temperature?.celsius ?? null,
      sensor: raw.telemetry?.temperature?.sensor || null,
    },
    firmware: {
      version: raw.telemetry?.firmware?.version || raw.firmware || "—",
      channel: raw.telemetry?.firmware?.channel || "stable",
    },
  };
}

function defaultLayout(raw = {}) {
  const l = raw.layout || raw.metadata?.layout || {};
  return {
    zone: l.zone || "floor",
    x: typeof l.x === "number" ? l.x : 50,
    y: typeof l.y === "number" ? l.y : 50,
    scale: typeof l.scale === "number" ? l.scale : 1,
  };
}

export function capabilitiesForCategory(category) {
  return CATEGORY_CAPABILITIES[category] || ["connect", "disconnect"];
}

function emptyObservatory() {
  return {
    id: "obs-default",
    name: "Osservatorio Roma",
    location: "Roma, Italia",
    latitude: null,
    longitude: null,
    lastHealthCheck: null,
    simulationMode: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function emptyPayload() {
  return {
    version: HUB_VERSION,
    updatedAt: new Date().toISOString(),
    observatory: emptyObservatory(),
    setups: [],
    devices: [],
    preferences: { simulationMode: true },
  };
}

export function sanitizeDevice(raw) {
  if (!raw || typeof raw !== "object") return null;
  const category = DEVICE_CATEGORIES[raw.category] ? raw.category : "accessory";
  const state = CONNECTION_STATES[raw.connectionState] ? raw.connectionState : "configured";
  const imageKey =
    typeof raw.imageKey === "string"
      ? raw.imageKey
      : typeof raw.metadata?.imageKey === "string"
        ? raw.metadata.imageKey
        : "generic";
  return {
    id: typeof raw.id === "string" ? raw.id : `dev-${Date.now()}`,
    category,
    brand: String(raw.brand || "—"),
    model: String(raw.model || "—"),
    customName: String(raw.customName || raw.model || "Dispositivo"),
    connectionState: state,
    operationalState: String(raw.operationalState || "idle"),
    connection: {
      type: CONNECTION_TYPES.includes(raw.connection?.type) ? raw.connection.type : "Non definita",
      port: raw.connection?.port || null,
      ip: raw.connection?.ip || null,
      driver: raw.connection?.driver || null,
      adapterId: raw.connection?.adapterId || "simulation",
    },
    capabilities: Array.isArray(raw.capabilities)
      ? raw.capabilities.filter((c) => CAPABILITIES.includes(c))
      : capabilitiesForCategory(category),
    setupId: typeof raw.setupId === "string" ? raw.setupId : null,
    lastConnectedAt: raw.lastConnectedAt || null,
    errors: Array.isArray(raw.errors) ? raw.errors : [],
    metadata: raw.metadata && typeof raw.metadata === "object" ? { ...raw.metadata, imageKey } : { imageKey },
    imageKey,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    integrationStatus: ["profile_only", "in_development", "simulated", "live", "registered"].includes(raw.integrationStatus)
      ? raw.integrationStatus
      : "registered",
    dataSource: raw.dataSource === "live" ? "live" : "simulated",
    serial: typeof raw.serial === "string" ? raw.serial : "",
    ports: Array.isArray(raw.ports) ? raw.ports : [],
    usb: Array.isArray(raw.usb) ? raw.usb : [],
    manualUrl: typeof raw.manualUrl === "string" ? raw.manualUrl : null,
    compatibility: Array.isArray(raw.compatibility) ? raw.compatibility : [],
    upcomingUpdates: Array.isArray(raw.upcomingUpdates) ? raw.upcomingUpdates : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    lastUsedAt: raw.lastUsedAt || null,
    specs: raw.specs && typeof raw.specs === "object" ? raw.specs : {},
    telemetry: defaultTelemetry(raw),
    layout: defaultLayout(raw),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function sanitizeSetup(raw, deviceIds) {
  if (!raw || typeof raw !== "object") return null;
  const ids = Array.isArray(raw.deviceIds)
    ? raw.deviceIds.filter((id) => deviceIds.has(id))
    : [];
  const primary = ids.includes(raw.primaryDeviceId) ? raw.primaryDeviceId : ids[0] || null;
  return {
    id: typeof raw.id === "string" ? raw.id : `setup-${Date.now()}`,
    name: String(raw.name || "Setup"),
    slug: String(raw.slug || ""),
    primaryDeviceId: primary,
    deviceIds: ids,
    status: ids.length >= 2 ? (raw.status === "ready" ? "ready" : computeSetupStatus(ids, deviceIds)) : "incomplete",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function computeSetupStatus(deviceIds, allIds) {
  return deviceIds.filter((id) => allIds.has(id)).length >= 2 ? "ready" : "incomplete";
}

export function sanitizePayload(raw) {
  if (!raw || typeof raw !== "object") return emptyPayload();

  const devices = (Array.isArray(raw.devices) ? raw.devices : [])
    .map(sanitizeDevice)
    .filter(Boolean);
  const deviceIds = new Set(devices.map((d) => d.id));

  const setups = (Array.isArray(raw.setups) ? raw.setups : [])
    .map((s) => sanitizeSetup(s, deviceIds))
    .filter(Boolean);

  const obs = raw.observatory && typeof raw.observatory === "object"
    ? { ...emptyObservatory(), ...raw.observatory }
    : emptyObservatory();

  return {
    version: HUB_VERSION,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    observatory: obs,
    setups,
    devices,
    preferences: {
      simulationMode: raw.preferences?.simulationMode !== false,
    },
    seeded: Boolean(raw.seeded),
  };
}

export function migratePayload(raw) {
  if (!raw || typeof raw !== "object") return emptyPayload();
  const migrated = { ...raw, version: HUB_VERSION };
  if (!raw.version || raw.version < 2) {
    migrated.seeded = false;
    if (Array.isArray(migrated.devices)) {
      migrated.devices = migrated.devices.map((d) => ({
        ...d,
        integrationStatus: d.integrationStatus === "in_development" ? "registered" : d.integrationStatus,
        connectionState: d.connectionState === "configured" ? "disconnected" : d.connectionState,
      }));
    }
  }
  return sanitizePayload(migrated);
}

export function createDefaultHub() {
  return emptyPayload();
}

export function sanitizeHub(raw) {
  return migratePayload(raw);
}

export function createDevice(input = {}) {
  const category = DEVICE_CATEGORIES[input.category] ? input.category : "accessory";
  return sanitizeDevice({
    id: input.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category,
    brand: input.brand || "—",
    model: input.model || "—",
    customName: input.customName || input.name || input.model || "Dispositivo",
    connectionState: input.connectionState || "configured",
    operationalState: input.operationalState || "idle",
    connection: input.connection || {},
    capabilities: input.capabilities,
    setupId: input.setupId || null,
    integrationStatus: input.integrationStatus || "in_development",
    imageKey: input.imageKey || "generic",
    imageUrl: input.imageUrl || null,
    notes: input.notes || "",
    metadata: input.metadata || {},
    dataSource: input.dataSource || "simulated",
    ...input,
  });
}

export function createSetup(input = {}) {
  const deviceIds = Array.isArray(input.deviceIds) ? input.deviceIds : [];
  const idSet = new Set(deviceIds);
  return sanitizeSetup(
    {
      id: input.id || `setup-${Date.now()}`,
      name: input.name || "Setup",
      slug: input.slug || "",
      primaryDeviceId: input.primaryDeviceId || deviceIds[0] || null,
      deviceIds,
      status: input.status,
      notes: input.notes || input.description || "",
      ...input,
    },
    idSet
  );
}

export function deviceStatusLabel(device) {
  if (!device) return "—";
  if (device.connectionState === "connected" || device.connectionState === "operational") {
    return device.dataSource === "live" ? "Online" : "Online · Simulazione";
  }
  if (device.connectionState === "connecting") return "Connessione in corso";
  if (device.connectionState === "attention") return "Richiede attenzione";
  if (device.connectionState === "error") return "Errore";
  return "Standby";
}

export function devicePowerLabel(device) {
  const state = device?.telemetry?.power?.state || "standby";
  const map = { on: "Alimentato", off: "Spento", standby: "Standby", battery: "Batteria" };
  return map[state] || "Standby";
}

export function deviceConnectionLabel(device) {
  const type = device?.connection?.type;
  if (!type || type === "Non definita") return "Non collegato";
  return type;
}

export function deviceDisplayName(device) {
  if (!device) return "—";
  return device.customName || device.model || "Dispositivo";
}
