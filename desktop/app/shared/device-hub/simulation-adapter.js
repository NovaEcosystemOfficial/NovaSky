import { DeviceAdapter } from "./adapter-interface.js";

/** Adapter simulazione — aggiorna solo stato locale, zero hardware. */
export class SimulationAdapter extends DeviceAdapter {
  constructor() {
    super("simulation");
  }

  supports(device) {
    return device?.dataSource !== "live";
  }

  async connect(device) {
    await delay(400);
    return {
      ...device,
      connectionState: "connected",
      lastConnectedAt: new Date().toISOString(),
      metadata: {
        ...device.metadata,
        _simulated: true,
        _simNote: "Connessione simulata — nessun hardware reale",
      },
    };
  }

  async disconnect(device) {
    return {
      ...device,
      connectionState: "configured",
      metadata: { ...device.metadata, _simulated: true },
    };
  }

  async invoke(device, capability) {
    if (capability === "readBattery") {
      return { level: 78, simulated: true };
    }
    if (capability === "readWeather") {
      return { clouds: 12, temperature: 18, simulated: true };
    }
    return { simulated: true, capability };
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
