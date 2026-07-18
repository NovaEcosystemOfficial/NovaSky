/**
 * EQ6 ASCOM bridge — processo principale Electron.
 * Azioni: discover / snapshot / disconnect / moveAxis / stopAxes.
 * moveAxis e stopAxes sono gli UNICI comandi di movimento consentiti (MoveAxis ASCOM).
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PS86 = path.join(process.env.WINDIR || "C:\\Windows", "SysWOW64", "WindowsPowerShell", "v1.0", "powershell.exe");
const DEFAULT_TIMEOUT_MS = 12000;
const MOTION_ACTIONS = new Set(["moveAxis", "stopAxes", "disconnect"]);

function bridgeScriptPath() {
  return path.join(__dirname, "bridges", "eq6-ascom-readonly.ps1");
}

/**
 * @param {"discover"|"snapshot"|"disconnect"|"moveAxis"|"stopAxes"} action
 * @param {{ timeoutMs?: number, axis?: number, rate?: number }} [opts]
 */
function runEq6Bridge(action, opts = {}) {
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  const script = bridgeScriptPath();
  if (!fs.existsSync(script)) {
    return Promise.resolve({
      ok: false,
      error: "bridge_missing",
      message: "Script bridge EQ6 non trovato.",
      liveState: "ERROR",
      motionCommandsSent: false,
    });
  }
  if (!fs.existsSync(PS86)) {
    return Promise.resolve({
      ok: false,
      error: "powershell32_missing",
      message: "PowerShell 32-bit non disponibile (serve per EQMOD COM).",
      liveState: "ERROR",
      motionCommandsSent: false,
    });
  }

  // Hard deny non-allowlisted actions
  const allowed = new Set(["discover", "snapshot", "disconnect", "moveAxis", "stopAxes"]);
  if (!allowed.has(action)) {
    return Promise.resolve({
      ok: false,
      error: "action_forbidden",
      message: `Azione ASCOM non consentita: ${action}`,
      motionCommandsSent: false,
    });
  }

  return new Promise((resolve) => {
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-STA",
      "-File",
      script,
      "-Action",
      action,
    ];
    if (action === "moveAxis") {
      const axis = Number(opts.axis);
      const rate = Number(opts.rate);
      if (!(axis === 0 || axis === 1) || !Number.isFinite(rate)) {
        resolve({
          ok: false,
          error: "bad_params",
          message: "moveAxis richiede Axis 0|1 e Rate numerico.",
          motionCommandsSent: false,
        });
        return;
      }
      // Soft clamp in main too (deg/s)
      const clamped = Math.max(-0.5, Math.min(0.5, rate));
      args.push("-Axis", String(axis), "-Rate", String(clamped));
    }

    const child = spawn(PS86, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      resolve({
        ok: false,
        error: "timeout",
        message: `Timeout bridge EQ6 (${timeoutMs}ms)`,
        liveState: "ERROR",
        motionCommandsSent: false,
      });
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: false,
        error: "spawn_failed",
        message: err.message,
        liveState: "ERROR",
        motionCommandsSent: false,
      });
    });
    child.on("close", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const line = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .pop();
      if (!line) {
        resolve({
          ok: false,
          error: "empty_output",
          message: stderr || "Nessun output dal bridge EQ6",
          liveState: "ERROR",
          motionCommandsSent: false,
        });
        return;
      }
      try {
        const json = JSON.parse(line);
        // Read-only actions must never report motion; motion actions may.
        if (!MOTION_ACTIONS.has(action) && json.motionCommandsSent) {
          resolve({
            ok: false,
            error: "safety_violation",
            message: "Bridge ha segnalato movimento su azione sola-lettura — bloccato.",
            liveState: "ERROR",
            motionCommandsSent: true,
          });
          return;
        }
        resolve(json);
      } catch (e) {
        resolve({
          ok: false,
          error: "json_parse",
          message: e.message,
          raw: line.slice(0, 500),
          stderr: stderr.slice(0, 500),
          liveState: "ERROR",
          motionCommandsSent: false,
        });
      }
    });
  });
}

/**
 * @param {import('electron').IpcMain} ipcMain
 */
function registerEq6AscomIpc(ipcMain) {
  ipcMain.handle("eq6Ascom:discover", async () => runEq6Bridge("discover", { timeoutMs: 12000 }));
  ipcMain.handle("eq6Ascom:snapshot", async () => runEq6Bridge("snapshot", { timeoutMs: 20000 }));
  ipcMain.handle("eq6Ascom:disconnect", async () => runEq6Bridge("disconnect", { timeoutMs: 12000 }));
  ipcMain.handle("eq6Ascom:moveAxis", async (_e, payload = {}) =>
    runEq6Bridge("moveAxis", {
      timeoutMs: 8000,
      axis: payload.axis,
      rate: payload.rate,
    })
  );
  ipcMain.handle("eq6Ascom:stopAxes", async () => runEq6Bridge("stopAxes", { timeoutMs: 8000 }));
}

module.exports = {
  registerEq6AscomIpc,
  runEq6Bridge,
};
