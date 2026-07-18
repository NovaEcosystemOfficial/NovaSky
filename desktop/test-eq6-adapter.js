/**
 * Smoke test Eq6AscomAdapter — bridge discover/snapshot (read-only).
 * Non invia comandi di movimento.
 */

const path = require("path");
const { runEq6Bridge } = require("./main-eq6-ascom.js");

async function main() {
  console.log("=== EQ6 ASCOM read-only probe ===");
  console.log("bridge script:", path.join(__dirname, "bridges", "eq6-ascom-readonly.ps1"));

  const discover = await runEq6Bridge("discover", 12000);
  console.log("\n[discover]");
  console.log(JSON.stringify(discover, null, 2));

  if (!discover?.ok) {
    console.error("\nFAIL: driver EQMOD non rilevato (ok=false). Apri EQASCOM e riprova.");
    process.exitCode = 1;
    return;
  }

  const snap = await runEq6Bridge("snapshot", 15000);
  console.log("\n[snapshot]");
  console.log(JSON.stringify(snap, null, 2));

  if (snap?.motionCommandsSent) {
    console.error("\nFAIL SAFETY: motionCommandsSent=true");
    process.exitCode = 2;
    return;
  }

  if (!snap?.ok || !snap?.connected) {
    console.error("\nFAIL: snapshot non LIVE. Verifica EQMOD Connected su COM3.");
    process.exitCode = 1;
    return;
  }

  const keys = ["name", "ra", "dec", "altitude", "azimuth", "tracking", "slewing", "atPark", "siderealTime"];
  const missing = keys.filter((k) => snap[k] == null);
  console.log("\nRead keys OK:", keys.filter((k) => snap[k] != null).join(", "));
  if (missing.length) console.log("Missing (non bloccante):", missing.join(", "));
  console.log("siteWarning:", snap.siteWarning, snap.siteWarningMessage);
  console.log("motionCommandsSent:", snap.motionCommandsSent === false ? "false (PASS)" : snap.motionCommandsSent);
  console.log("\nEQ6 LIVE READ-ONLY PROBE PASS");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
