/**
 * Contratto adapter hardware — implementazioni future indipendenti.
 * Nessun comando reale in questo sprint.
 */

export class AdapterNotImplementedError extends Error {
  constructor(capability, adapterId) {
    super(`Capability "${capability}" non implementata per adapter "${adapterId}"`);
    this.name = "AdapterNotImplementedError";
  }
}

/**
 * @typedef {object} AdapterResult
 * @property {boolean} ok
 * @property {object} [device]
 * @property {unknown} [data]
 * @property {string} [error]
 */

export class DeviceAdapter {
  /** @param {string} id */
  constructor(id) {
    this.id = id;
  }

  /** @param {object} _device */
  supports(_device) {
    return false;
  }

  /** @param {object} device */
  async connect(device) {
    throw new AdapterNotImplementedError("connect", this.id);
  }

  /** @param {object} device */
  async disconnect(device) {
    throw new AdapterNotImplementedError("disconnect", this.id);
  }

  /**
   * @param {object} device
   * @param {string} capability
   * @param {object} [params]
   */
  async invoke(device, capability, params = {}) {
    throw new AdapterNotImplementedError(capability, this.id);
  }
}
