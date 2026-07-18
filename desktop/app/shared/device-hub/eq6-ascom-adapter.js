/**
 * Eq6AscomAdapter — ASCOM EQMOD LIVE v1 (manuale MoveAxis).
 * ProgID: EQMOD.Telescope
 *
 * Consentito: Connected read, snapshot, MoveAxis (hold), stopAxes.
 * Vietato: GOTO / SlewToCoordinates / Sync / Park / Unpark / Tracking write / PulseGuide / Home.
 */

import { DeviceAdapter } from "./adapter-interface.js";
import {
  eq6AscomDiscover,
  eq6AscomSnapshot,
  eq6AscomDisconnect,
  eq6AscomMoveAxis,
  eq6AscomStopAxes,
  isEq6AscomBridgeAvailable,
} from "./eq6-ascom-bridge.js";

export const EQ6_LIVE_STATES = Object.freeze({
  OFFLINE: "OFFLINE",
  CONNECTING: "CONNECTING",
  LIVE: "LIVE",
  ERROR: "ERROR",
});

/** Velocità UI (deg/s) — default molto bassa */
export const EQ6_SPEED_PRESETS = Object.freeze([
  { id: "min", label: "Minima · 0.01°/s", rate: 0.01 },
  { id: "slow", label: "Lenta · 0.05°/s", rate: 0.05 },
  { id: "med", label: "Media · 0.15°/s", rate: 0.15 },
  { id: "fast", label: "Veloce · 0.35°/s", rate: 0.35 },
]);

export const EQ6_DEFAULT_SPEED_ID = "min";

const BLOCKED_CAPABILITIES = Object.freeze([
  "goto",
  "slew",
  "slewtocoordinates",
  "sync",
  "park",
  "unpark",
  "pulseguide",
  "settracking",
  "findhome",
  "abortslew",
]);

export function createEmptyEq6MountTelemetry(liveState = EQ6_LIVE_STATES.OFFLINE, lastError = null) {
  return {
    liveState,
    protocol: "ASCOM_EQMOD",
    progId: "EQMOD.Telescope",
    comPort: "COM3",
    baud: 9600,
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
    sideOfPier: null,
    siteLatitude: null,
    siteLongitude: null,
    siteElevation: null,
    siteWarning: true,
    siteWarningMessage: "Coordinate sito EQMOD da verificare",
    name: null,
    description: null,
    driverInfo: null,
    driverVersion: null,
    interfaceVersion: null,
    capabilities: null,
    axisRates0: null,
    axisRates1: null,
    manualMoving: false,
    manualDirection: null,
    lastPollAt: null,
    lastError,
    source: "none",
    readOnly: false,
  };
}

export function mapEq6SnapshotToMount(snap, extras = {}) {
  if (!snap?.ok) {
    return createEmptyEq6MountTelemetry(snap?.liveState || EQ6_LIVE_STATES.ERROR, snap?.message || snap?.error || "Snapshot fallito");
  }
  return {
    liveState: EQ6_LIVE_STATES.LIVE,
    protocol: "ASCOM_EQMOD",
    progId: snap.progId || "EQMOD.Telescope",
    comPort: snap.comPort || "COM3",
    baud: snap.baud || 9600,
    connected: snap.connected ?? true,
    ra: snap.ra ?? null,
    dec: snap.dec ?? null,
    altitude: snap.altitude ?? null,
    azimuth: snap.azimuth ?? null,
    siderealTime: snap.siderealTime ?? null,
    tracking: snap.tracking ?? null,
    slewing: snap.slewing ?? null,
    atPark: snap.atPark ?? null,
    atHome: snap.atHome ?? null,
    sideOfPier: snap.sideOfPier ?? null,
    siteLatitude: snap.siteLatitude ?? null,
    siteLongitude: snap.siteLongitude ?? null,
    siteElevation: snap.siteElevation ?? null,
    siteWarning: snap.siteWarning !== false,
    siteWarningMessage: snap.siteWarningMessage || "Coordinate sito EQMOD da verificare",
    name: snap.name ?? null,
    description: snap.description ?? null,
    driverInfo: snap.driverInfo ?? null,
    driverVersion: snap.driverVersion ?? null,
    interfaceVersion: snap.interfaceVersion ?? null,
    capabilities: snap.capabilities || null,
    axisRates0: snap.axisRates0 || null,
    axisRates1: snap.axisRates1 || null,
    manualMoving: Boolean(extras.manualMoving),
    manualDirection: extras.manualDirection || null,
    lastPollAt: snap.lastPollAt || new Date().toISOString(),
    lastError: null,
    source: "live",
    readOnly: false,
  };
}

function clampRateForAxis(rate, axisRates) {
  let max = 0.5;
  if (Array.isArray(axisRates) && axisRates[0]?.Maximum != null) {
    max = Math.min(0.5, Number(axisRates[0].Maximum) || 0.5);
  }
  const abs = Math.min(Math.abs(Number(rate) || 0), max);
  if (!(abs > 0)) return 0;
  return rate < 0 ? -abs : abs;
}

export class Eq6AscomAdapter extends DeviceAdapter {
  constructor() {
    super("eq6-ascom");
    this._manualMoving = false;
    this._manualDirection = null;
  }

  supports(device) {
    const id = device?.connection?.adapterId;
    const model = (device?.model || "").toLowerCase();
    return (
      device?.id === "dev-mount-eq6" ||
      (device?.category === "mount" && model.includes("eq6")) ||
      id === "eq6-ascom" ||
      id === "eqmod" ||
      id === "ascom-eqmod"
    );
  }

  async discover() {
    if (!isEq6AscomBridgeAvailable()) {
      return { ok: false, error: "bridge_unavailable", message: "Avvia NovaSky Desktop per il bridge ASCOM EQ6." };
    }
    return eq6AscomDiscover();
  }

  async getMountSnapshot() {
    if (!isEq6AscomBridgeAvailable()) {
      return {
        ok: false,
        mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.ERROR, "Bridge ASCOM non disponibile"),
      };
    }
    const snap = await eq6AscomSnapshot();
    return {
      ok: Boolean(snap?.ok),
      mount: mapEq6SnapshotToMount(snap, {
        manualMoving: this._manualMoving,
        manualDirection: this._manualDirection,
      }),
      raw: snap,
    };
  }

  /**
   * Movimento manuale assi — solo se Connected e CanMoveAxis.
   * @param {{ axis: 0|1, rate: number, direction?: string }} params
   */
  async moveAxis(params = {}) {
    if (!isEq6AscomBridgeAvailable()) {
      return { ok: false, error: "bridge_unavailable", motionCommandsSent: false };
    }
    const axis = Number(params.axis);
    if (!(axis === 0 || axis === 1)) {
      return { ok: false, error: "bad_axis", message: "Asse non valido.", motionCommandsSent: false };
    }

    const snap = await eq6AscomSnapshot();
    if (!snap?.ok || !snap.connected) {
      this._manualMoving = false;
      this._manualDirection = null;
      return {
        ok: false,
        error: "not_connected",
        message: "Connected!=true: nessun movimento inviato.",
        motionCommandsSent: false,
      };
    }
    const caps = snap.capabilities || {};
    const canKey = axis === 0 ? "CanMoveAxis0" : "CanMoveAxis1";
    if (!caps[canKey] && !caps.CanMoveAxis) {
      return {
        ok: false,
        error: "capability_denied",
        message: `${canKey}=false: controllo disabilitato.`,
        motionCommandsSent: false,
      };
    }

    const rates = axis === 0 ? snap.axisRates0 : snap.axisRates1;
    const rate = clampRateForAxis(params.rate, rates);
    if (rate === 0) {
      return this.stopAxes();
    }

    const result = await eq6AscomMoveAxis(axis, rate);
    if (result?.ok) {
      this._manualMoving = true;
      this._manualDirection = params.direction || (axis === 1 ? (rate > 0 ? "N" : "S") : rate > 0 ? "E" : "O");
    }
    return result;
  }

  async stopAxes() {
    this._manualMoving = false;
    this._manualDirection = null;
    if (!isEq6AscomBridgeAvailable()) {
      return { ok: false, error: "bridge_unavailable", motionCommandsSent: false };
    }
    return eq6AscomStopAxes();
  }

  async connect(device) {
    this._manualMoving = false;
    this._manualDirection = null;
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
          mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.ERROR, discovery.message || discovery.error),
        },
        metadata: { ...device.metadata, liveState: EQ6_LIVE_STATES.ERROR },
        errors: [discovery.message || "Driver EQMOD non rilevato"],
      };
    }

    const snap = await this.getMountSnapshot();
    if (!snap.ok) {
      return {
        ...device,
        connectionState: "error",
        operationalState: "error",
        dataSource: "live",
        integrationStatus: "live",
        connection: {
          ...device.connection,
          type: "ASCOM",
          adapterId: "eq6-ascom",
          port: "COM3",
          driver: "EQMOD HEQ5/6",
        },
        telemetry: { ...device.telemetry, mount: snap.mount },
        metadata: { ...device.metadata, liveState: EQ6_LIVE_STATES.ERROR },
        errors: [snap.mount?.lastError || "Connessione EQ6 fallita"],
      };
    }

    return {
      ...device,
      connectionState: "connected",
      operationalState: "live",
      dataSource: "live",
      integrationStatus: "live",
      lastConnectedAt: new Date().toISOString(),
      connection: {
        ...device.connection,
        type: "ASCOM",
        adapterId: "eq6-ascom",
        port: "COM3",
        driver: snap.mount.driverInfo || "EQMOD HEQ5/6",
      },
      customName: device.customName || "Montatura EQ6-R Pro",
      telemetry: {
        ...device.telemetry,
        power: { ...(device.telemetry?.power || {}), state: "on" },
        firmware: {
          version: snap.mount.driverVersion || device.telemetry?.firmware?.version || "—",
          channel: "eqmod",
        },
        mount: snap.mount,
      },
      metadata: {
        ...device.metadata,
        liveState: EQ6_LIVE_STATES.LIVE,
        _simulated: false,
        eq6ProgId: "EQMOD.Telescope",
      },
      capabilities: ["connect", "disconnect", "moveAxis", "stopAxes"],
      errors: [],
    };
  }

  async disconnect(device) {
    try {
      await this.stopAxes();
    } catch {
      /* ignore */
    }
    try {
      await eq6AscomDisconnect();
    } catch {
      /* ignore */
    }
    this._manualMoving = false;
    this._manualDirection = null;
    return {
      ...device,
      connectionState: "disconnected",
      operationalState: "offline",
      dataSource: "live",
      telemetry: {
        ...device.telemetry,
        mount: createEmptyEq6MountTelemetry(EQ6_LIVE_STATES.OFFLINE),
        power: { ...(device.telemetry?.power || {}), state: "standby" },
      },
      metadata: { ...device.metadata, liveState: EQ6_LIVE_STATES.OFFLINE },
      errors: [],
    };
  }

  async invoke(_device, capability, params = {}) {
    const cap = String(capability || "").toLowerCase();
    if (BLOCKED_CAPABILITIES.some((b) => cap.includes(b))) {
      return {
        ok: false,
        error: "forbidden",
        message: `Comando "${capability}" non consentito in NovaSky (niente GOTO/Park/Sync/Tracking).`,
        motionCommandsSent: false,
      };
    }
    if (cap === "moveaxis") return this.moveAxis(params);
    if (cap === "stopaxes" || cap === "stop") return this.stopAxes();
    if (cap === "getmountsnapshot" || cap === "snapshot") return this.getMountSnapshot();
    if (cap === "discover") return this.discover();
    return { ok: false, error: "not_implemented", message: capability };
  }
}
