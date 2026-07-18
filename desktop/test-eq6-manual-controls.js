/**
 * Software test EQ6 manual controls — NO real motion (rate != 0).
 * Verifica capability CanMoveAxis + stopAxes (MoveAxis 0,0) + IPC wiring.
 */
const { runEq6Bridge } = require("./main-eq6-ascom.js");

async function main() {
  console.log("=== EQ6 manual controls software test (no slew) ===");

  const discover = await runEq6Bridge("discover", { timeoutMs: 12000 });
  console.log("[discover]", discover.ok, discover.label || discover.error);

  const snap = await runEq6Bridge("snapshot", { timeoutMs: 20000 });
  if (!snap.ok) {
    console.error("FAIL snapshot", snap);
    process.exitCode = 1;
    return;
  }

  const caps = snap.capabilities || {};
  console.log("[caps]", {
    CanMoveAxis0: caps.CanMoveAxis0,
    CanMoveAxis1: caps.CanMoveAxis1,
    CanMoveAxis: caps.CanMoveAxis,
    axisRates0: snap.axisRates0,
    axisRates1: snap.axisRates1,
  });

  if (!caps.CanMoveAxis0 || !caps.CanMoveAxis1) {
    console.error("FAIL: CanMoveAxis non disponibile — controlli devono restare disabilitati");
    process.exitCode = 1;
    return;
  }

  // stopAxes only (rate 0) — safe, no intentional travel
  const stop = await runEq6Bridge("stopAxes", { timeoutMs: 8000 });
  console.log("[stopAxes]", stop);

  // Reject forbidden action name if ever passed
  const forbidden = await runEq6Bridge("slew", { timeoutMs: 3000 });
  console.log("[forbidden slew]", forbidden);

  const pass =
    snap.ok &&
    caps.CanMoveAxis0 === true &&
    caps.CanMoveAxis1 === true &&
    stop.ok === true &&
    stop.motionCommandsSent === true &&
    forbidden.ok === false;

  console.log(pass ? "\nEQ6 MANUAL CONTROLS SOFTWARE PASS (no non-zero MoveAxis sent)" : "\nFAIL");
  process.exitCode = pass ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
