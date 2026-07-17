/**
 * Renderer bridge verso IPC Alpaca (read-only).
 * Fallback offline: nessun dato inventato.
 */

const DESKTOP = typeof window !== "undefined" ? window.novaSkyDesktop : null;

export function isAlpacaBridgeAvailable() {
  return Boolean(DESKTOP?.alpaca?.discover && DESKTOP?.alpaca?.httpGet);
}

/**
 * @param {number} [timeoutMs]
 */
export async function alpacaDiscover(timeoutMs = 3000) {
  if (!isAlpacaBridgeAvailable()) {
    return { ok: false, error: "bridge_unavailable", devices: [], message: "IPC Alpaca non disponibile" };
  }
  return DESKTOP.alpaca.discover({ timeoutMs });
}

/**
 * @param {{host:string,port?:number,path:string,timeoutMs?:number}} opts
 */
export async function alpacaHttpGet(opts) {
  if (!isAlpacaBridgeAvailable()) {
    return { ok: false, error: "bridge_unavailable", message: "IPC Alpaca non disponibile" };
  }
  return DESKTOP.alpaca.httpGet(opts);
}

let txCounter = 1;
const CLIENT_ID = 42;

/**
 * GET Alpaca property with ClientID / ClientTransactionID.
 * @param {string} host
 * @param {number} port
 * @param {string} devicePath e.g. telescope/0/rightascension
 * @param {number} [timeoutMs]
 */
export async function alpacaGetProperty(host, port, devicePath, timeoutMs = 4000) {
  const qid = txCounter++;
  const path = `/api/v1/${devicePath.replace(/^\//, "")}?ClientID=${CLIENT_ID}&ClientTransactionID=${qid}`;
  const res = await alpacaHttpGet({ host, port, path, timeoutMs });
  if (!res.ok || !res.json) {
    return {
      available: false,
      value: null,
      errorNumber: null,
      errorMessage: res.message || res.error || "request_failed",
      httpStatus: res.httpStatus ?? null,
      transportError: res.error || null,
    };
  }
  const err = Number(res.json.ErrorNumber ?? 0);
  return {
    available: err === 0,
    value: res.json.Value ?? null,
    errorNumber: err,
    errorMessage: res.json.ErrorMessage || "",
    httpStatus: res.httpStatus,
    transportError: null,
  };
}

/**
 * @param {string} host
 * @param {number} port
 * @param {number} [timeoutMs]
 */
export async function alpacaConfiguredDevices(host, port, timeoutMs = 4000) {
  const res = await alpacaHttpGet({
    host,
    port,
    path: "/management/v1/configureddevices",
    timeoutMs,
  });
  if (!res.ok || !res.json) {
    return { ok: false, devices: [], error: res.error || "configureddevices_failed", message: res.message };
  }
  const list = Array.isArray(res.json.Value) ? res.json.Value : [];
  return { ok: true, devices: list };
}
