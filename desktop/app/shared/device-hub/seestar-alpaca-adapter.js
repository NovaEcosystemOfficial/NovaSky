/**
 * SeestarAdapter — ASCOM Alpaca READ-ONLY (porta 32323).
 * Verificato su Seestar S30 Pro (report telescope-get / camera-connect).
 *
 * VIETATO in v0: GOTO, slew, park/unpark, sync, exposure, porte 4700/4800, PUT.
 */

import { DeviceAdapter } from "./adapter-interface.js";
import {
  alpacaDiscover,
  alpacaConfiguredDevices,
  alpacaGetProperty,
  isAlpacaBridgeAvailable,
} from "./alpaca-bridge.js";

export const LIVE_STATES = Object.freeze({
  OFFLINE: "OFFLINE",
  CONNECTING: "CONNECTING",
  LIVE: "LIVE",
  ERROR: "ERROR",
});

/** Telescope props verified readable with Connected=false on S30 Pro. */
export const TELESCOPE_SNAPSHOT_PROPS = Object.freeze([
  "connected",
  "name",
  "description",
  "driverinfo",
  "driverversion",
  "interfaceversion",
  "rightascension",
  "declination",
  "altitude",
  "azimuth",
  "siderealtime",
  "tracking",
  "slewing",
  "atpark",
  "athome",
  "utcdate",
  "sitelatitude",
  "sitelongitude",
  "canslew",
  "canslewasync",
  "canslewaltaz",
  "canslewaltazasync",
  "canpark",
  "canunpark",
  "cansync",
  "cansyncaltaz",
  "canfindhome",
  "canpulseguide",
  "cansettracking",
  "cansetpark",
  "cansetdeclinationrate",
  "cansetguiderates",
  "cansetpierside",
  "cansetrightascensionrate",
]);

/** Camera props verified without Connected=true (capability / identity). */
export const CAMERA_SAFE_PROPS = Object.freeze([
  "connected",
  "driverinfo",
  "driverversion",
  "interfaceversion",
  "bayeroffsetx",
  "bayeroffsety",
  "canabortexposure",
  "canstopexposure",
  "canasymmetricbin",
  "cangetcoolerpower",
  "cansetccdtemperature",
  "maxadu",
  "maxbinx",
  "maxbiny",
  "readoutmode",
  "readoutmodes",
  "sensorname",
]);

function emptyMountTelemetry(liveState = LIVE_STATES.OFFLINE, lastError = null) {
  return {
    liveState,
    protocol: "STANDARD_ALPACA",
    alpacaPort: 32323,
    host: null,
    telescopeNumber: null,
    connected: null,
    ra: null,
    dec: null,
    altitude: null,
    azimuth: null,
    siderealTime: null,
    tracking: null,
    slewing: null,
    atPark: null,
    atHome: null,
    utcDate: null,
    siteLatitude: null,
    siteLongitude: null,
    name: null,
    description: null,
    driverInfo: null,
    driverVersion: null,
    interfaceVersion: null,
    capabilities: null,
    lastPollAt: null,
    lastError,
    source: "none",
  };
}

/**
 * @param {Record<string, {available:boolean,value:unknown}>} map
 */
export function buildTelescopeSnapshotFromProps(map, meta = {}) {
  const g = (key) => (map[key]?.available ? map[key].value : null);
  const caps = {};
  for (const key of Object.keys(map)) {
    if (key.startsWith("can") && map[key]?.available) caps[key] = Boolean(map[key].value);
  }
  return {
    liveState: LIVE_STATES.LIVE,
    protocol: "STANDARD_ALPACA",
    alpacaPort: meta.port ?? 32323,
    host: meta.host ?? null,
    telescopeNumber: meta.telescopeNumber ?? 0,
    connected: g("connected"),
    ra: g("rightascension"),
    dec: g("declination"),
    altitude: g("altitude"),
    azimuth: g("azimuth"),
    siderealTime: g("siderealtime"),
    tracking: g("tracking"),
    slewing: g("slewing"),
    atPark: g("atpark"),
    atHome: g("athome"),
    utcDate: g("utcdate"),
    siteLatitude: g("sitelatitude"),
    siteLongitude: g("sitelongitude"),
    name: g("name"),
    description: g("description"),
    driverInfo: g("driverinfo"),
    driverVersion: g("driverversion"),
    interfaceVersion: g("interfaceversion"),
    capabilities: Object.keys(caps).length ? caps : null,
    lastPollAt: new Date().toISOString(),
    lastError: null,
    source: "live",
  };
}

export class SeestarAlpacaAdapter extends DeviceAdapter {
  constructor() {
    super("seestar-alpaca");
    this._endpoint = null;
  }

  supports(device) {
    const adapterId = device?.connection?.adapterId;
    return (
      device?.category === "seestar" ||
      adapterId === "seestar-alpaca" ||
      adapterId === "ascom-alpaca" ||
      adapterId === "zwo-seestar"
    );
  }

  getEndpoint() {
    return this._endpoint;
  }

  /**
   * Discovery + configureddevices. Nessun PUT Connected.
   */
  async discover() {
    if (!isAlpacaBridgeAvailable()) {
      return { ok: false, error: "bridge_unavailable", message: "Avvia NovaSky Desktop (Electron) per Alpaca IPC." };
    }
    const disc = await alpacaDiscover(3500);
    if (!disc.ok && (!disc.devices || disc.devices.length === 0)) {
      return { ok: false, error: disc.error || "not_found", message: disc.message || "Nessun Alpaca discovery", devices: [] };
    }
    const candidates = disc.devices?.length
      ? disc.devices
      : [{ address: "10.0.0.1", alpacaPort: 32323, raw: "fallback-hotspot" }];

    for (const c of candidates) {
      const host = c.address;
      const port = c.alpacaPort || 32323;
      const cfg = await alpacaConfiguredDevices(host, port, 4000);
      if (!cfg.ok) continue;
      const telescope = cfg.devices.find((d) => String(d.DeviceType).toLowerCase() === "telescope");
      const cameras = cfg.devices.filter((d) => String(d.DeviceType).toLowerCase() === "camera");
      if (!telescope) continue;
      this._endpoint = {
        host,
        port,
        telescopeNumber: Number(telescope.DeviceNumber) || 0,
        telescopeName: telescope.DeviceName || null,
        telescopeUniqueId: telescope.UniqueID || null,
        cameras: cameras.map((cam) => ({
          deviceNumber: Number(cam.DeviceNumber),
          deviceName: cam.DeviceName || `Camera ${cam.DeviceNumber}`,
          uniqueId: cam.UniqueID || null,
        })),
        discoveredAt: new Date().toISOString(),
        discoveryRaw: c.raw || null,
      };
      return { ok: true, endpoint: this._endpoint, configuredDevices: cfg.devices };
    }
    return { ok: false, error: "no_telescope", message: "Discovery OK ma nessun Telescope in configureddevices", devices: disc.devices || [] };
  }

  async connect(device) {
    const discovery = await this.discover();
    if (!discovery.ok) {
      return {
        ...device,
        connectionState: "error",
        operationalState: "error",
        dataSource: "live",
        integrationStatus: "live",
        telemetry: {
          ...device.telemetry,
          mount: emptyMountTelemetry(LIVE_STATES.ERROR, discovery.message || discovery.error),
          cameras: null,
        },
        metadata: {
          ...device.metadata,
          liveState: LIVE_STATES.ERROR,
          lastLiveError: discovery.message || discovery.error,
        },
        errors: [discovery.message || "Seestar non rilevato"],
      };
    }

    const snap = await this.getTelescopeSnapshot();
    if (!snap.ok) {
      return {
        ...device,
        connectionState: "error",
        operationalState: "error",
        dataSource: "live",
        integrationStatus: "live",
        connection: {
          ...device.connection,
          type: "ASCOM Alpaca",
          adapterId: "seestar-alpaca",
          ip: this._endpoint.host,
          port: String(this._endpoint.port),
          driver: snap.mount?.driverInfo || "ASCOM Alpaca",
        },
        telemetry: {
          ...device.telemetry,
          mount: snap.mount || emptyMountTelemetry(LIVE_STATES.ERROR, snap.error),
          cameras: await this.getCameraInventorySafe(),
          firmware: {
            version: snap.mount?.driverVersion || device.telemetry?.firmware?.version || "—",
            channel: "alpaca",
          },
        },
        metadata: {
          ...device.metadata,
          liveState: LIVE_STATES.ERROR,
          alpacaEndpoint: this._endpoint,
        },
        errors: [snap.error || "Snapshot telescope fallito"],
      };
    }

    const cameras = await this.getCameraInventorySafe();
    return {
      ...device,
      connectionState: "connected",
      operationalState: "live",
      dataSource: "live",
      integrationStatus: "live",
      lastConnectedAt: new Date().toISOString(),
      connection: {
        ...device.connection,
        type: "ASCOM Alpaca",
        adapterId: "seestar-alpaca",
        ip: this._endpoint.host,
        port: String(this._endpoint.port),
        driver: snap.mount.driverInfo || "Telescope V3",
      },
      customName: snap.mount.name || device.customName,
      telemetry: {
        ...device.telemetry,
        power: { ...(device.telemetry?.power || {}), state: "on" },
        firmware: {
          version: snap.mount.driverVersion || "1.2.0-3",
          channel: "alpaca",
        },
        mount: snap.mount,
        cameras,
      },
      metadata: {
        ...device.metadata,
        liveState: LIVE_STATES.LIVE,
        alpacaEndpoint: this._endpoint,
        alpacaCapabilities: snap.mount.capabilities,
        _simulated: false,
        readOnlyV0: true,
      },
      errors: [],
    };
  }

  async disconnect(device) {
    this._endpoint = null;
    return {
      ...device,
      connectionState: "disconnected",
      operationalState: "offline",
      dataSource: "live",
      telemetry: {
        ...device.telemetry,
        mount: emptyMountTelemetry(LIVE_STATES.OFFLINE),
        cameras: null,
        power: { ...(device.telemetry?.power || {}), state: "standby" },
      },
      metadata: {
        ...device.metadata,
        liveState: LIVE_STATES.OFFLINE,
        alpacaEndpoint: null,
      },
      errors: [],
    };
  }

  /**
   * @param {object} device
   * @param {string} capability
   */
  async invoke(device, capability) {
    if (capability === "getTelescopeSnapshot") {
      return this.getTelescopeSnapshot();
    }
    if (capability === "getCameraInventory") {
      return { ok: true, cameras: await this.getCameraInventorySafe() };
    }
    if (capability === "discover") {
      return this.discover();
    }
    // Explicitly refuse motion / capture
    const blocked = [
      "goto",
      "slew",
      "park",
      "unpark",
      "sync",
      "capture",
      "startexposure",
      "liveView",
    ];
    if (blocked.includes(capability)) {
      return { ok: false, error: "forbidden_v0", message: `Capability "${capability}" bloccata in SeestarAdapter read-only v0` };
    }
    return { ok: false, error: "not_implemented", message: capability };
  }

  async getTelescopeSnapshot() {
    if (!this._endpoint) {
      const d = await this.discover();
      if (!d.ok) {
        return {
          ok: false,
          error: d.message || d.error,
          mount: emptyMountTelemetry(LIVE_STATES.OFFLINE, d.message || d.error),
        };
      }
    }
    const { host, port, telescopeNumber } = this._endpoint;
    const map = {};
    const results = await Promise.all(
      TELESCOPE_SNAPSHOT_PROPS.map(async (prop) => {
        const result = await alpacaGetProperty(host, port, `telescope/${telescopeNumber}/${prop}`, 4000);
        return [prop, result];
      })
    );
    let transportFailures = 0;
    for (const [prop, result] of results) {
      map[prop] = result;
      if (result.transportError) transportFailures += 1;
    }
    if (transportFailures === TELESCOPE_SNAPSHOT_PROPS.length) {
      return {
        ok: false,
        error: "device_unreachable",
        mount: emptyMountTelemetry(LIVE_STATES.OFFLINE, "Seestar non raggiungibile"),
      };
    }
    const essential = ["rightascension", "declination", "altitude", "azimuth"];
    const essentialOk = essential.every((k) => map[k]?.available);
    if (!essentialOk) {
      return {
        ok: false,
        error: "incomplete_snapshot",
        mount: emptyMountTelemetry(LIVE_STATES.ERROR, "Snapshot incompleto (RA/Dec/Alt/Az)"),
      };
    }
    const mount = buildTelescopeSnapshotFromProps(map, { host, port, telescopeNumber });
    return { ok: true, mount };
  }

  /**
   * Camera inventory + safe GET props. NO PUT Connected.
   * Size/temp/gain require Connected=true — documented as TBD until explicit connect phase.
   */
  async getCameraInventorySafe() {
    if (!this._endpoint?.cameras?.length) return [];
    const { host, port } = this._endpoint;
    const out = [];
    for (const cam of this._endpoint.cameras) {
      const propResults = await Promise.all(
        CAMERA_SAFE_PROPS.map(async (prop) => {
          const r = await alpacaGetProperty(host, port, `camera/${cam.deviceNumber}/${prop}`, 3500);
          return [prop, r];
        })
      );
      const props = {};
      for (const [prop, r] of propResults) {
        if (r.available) props[prop] = r.value;
      }
      out.push({
        deviceNumber: cam.deviceNumber,
        deviceName: cam.deviceName,
        uniqueId: cam.uniqueId,
        connected: props.connected ?? null,
        driverInfo: props.driverinfo ?? null,
        driverVersion: props.driverversion ?? null,
        bayerOffsetX: props.bayeroffsetx ?? null,
        bayerOffsetY: props.bayeroffsety ?? null,
        maxBinX: props.maxbinx ?? null,
        maxBinY: props.maxbiny ?? null,
        maxAdu: props.maxadu ?? null,
        canAbortExposure: props.canabortexposure ?? null,
        canStopExposure: props.canstopexposure ?? null,
        canGetCoolerPower: props.cangetcoolerpower ?? null,
        canSetCcdTemperature: props.cansetccdtemperature ?? null,
        note:
          "Size/PixelSize/Gain/CCDTemp richiedono Connected=true (non eseguito in v0 read-only). Vedi camera-connect report.",
        props,
      });
    }
    return out;
  }
}

export function createEmptyMountTelemetry(liveState, lastError) {
  return emptyMountTelemetry(liveState, lastError);
}
