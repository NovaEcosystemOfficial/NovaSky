/** NovaSky verdict logic — always explains, never score-only. */

import { TARGET_STATE } from "./states.js";
import { SKY_LIMITS } from "../data/config.js";

const { MIN_ALT, OPTIMAL_ALT } = SKY_LIMITS;

/**
 * @returns {{ level: 'recommended'|'possible'|'discouraged', reason: string, score: number }}
 */
export function buildVerdict(ctx) {
  const {
    entry,
    alt,
    state,
    moonSep,
    moonAlt,
    moonIllum,
    bestWindow,
    culmination,
  } = ctx;

  const parts = [];
  let score = 50;

  if (state === TARGET_STATE.BELOW) {
    return {
      level: "discouraged",
      reason: "Sotto l'orizzonte in questo momento. Avanza l'orario simulato se il target sorge più tardi stanotte.",
      score: 10,
    };
  }

  if (alt >= OPTIMAL_ALT) {
    score += 28;
    parts.push(`Alto a ${Math.round(alt)}° — condizione favorevole per Seestar.`);
  } else if (alt >= MIN_ALT) {
    score += 12;
    parts.push(`A ${Math.round(alt)}° sullo zenit locale: osservabile, ma non al massimo della finestra.`);
  } else {
    score -= 15;
    parts.push(`Basso sull'orizzonte (${Math.round(alt)}°): atmosfera e vibrazione riducono il dettaglio.`);
  }

  if (moonAlt > 5) {
    if (moonSep < 35) {
      score -= 22;
      parts.push(
        `Luna ${moonIllum}% illuminata a ${Math.round(moonAlt)}° e solo ${Math.round(moonSep)}° di separazione — contrasto penalizzato.`,
      );
    } else if (moonSep < 60) {
      score -= 10;
      parts.push(`Luna presente (${moonIllum}%) ma ${Math.round(moonSep)}° dal target: gestibile con filtri.`);
    } else {
      score += 4;
      parts.push(`Luna lontana (${Math.round(moonSep)}°): interferenza contenuta.`);
    }
  } else {
    score += 8;
    parts.push("Luna bassa o assente: cielo scuro favorevole.");
  }

  if (bestWindow?.start && bestWindow?.end) {
    const durMin = (bestWindow.end - bestWindow.start) / 60_000;
    if (durMin >= 120) {
      score += 10;
      parts.push(`Ampia finestra sopra ${MIN_ALT}° per almeno ${Math.round(durMin / 60)} ore.`);
    } else if (durMin >= 45) {
      score += 4;
      parts.push(`Finestra utile di circa ${Math.round(durMin)} minuti sopra ${MIN_ALT}°.`);
    } else {
      score -= 8;
      parts.push(`Finestra stretta (${Math.round(durMin)} min sopra ${MIN_ALT}°): serve pianificazione precisa.`);
    }
  }

  if (culmination.alt >= OPTIMAL_ALT) {
    parts.push(`Culmina alle ${formatHHMM(culmination.time)} a ${Math.round(culmination.alt)}°.`);
  }

  if (entry.magnitude > 8.5) {
    score -= 8;
    parts.push(`Magnitudine ${entry.magnitude}: target debole, richiede trasparenza.`);
  }

  score = Math.max(8, Math.min(97, Math.round(score)));

  let level = "possible";
  if (score >= 72 && alt >= MIN_ALT) level = "recommended";
  if (score < 42 || alt < 12 || state === TARGET_STATE.LOW) level = "discouraged";

  return {
    level,
    reason: parts.join(" "),
    score,
  };
}

function formatHHMM(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function buildNightVerdict(targets) {
  const visible = targets.filter((t) => t.aboveHorizon);
  const recommended = visible.filter((t) => t.recommendation === "recommended");
  if (recommended.length >= 3) {
    return `Buona notte — ${recommended.length} target ottimali sopra l'orizzonte`;
  }
  if (recommended.length >= 1) {
    return `Notte promettente — ${recommended[0].name} in condizione favorevole`;
  }
  const possible = visible.filter((t) => t.recommendation === "possible");
  if (possible.length) return "Notte selezionata — pochi target ideali, valuta le alternative";
  return "Cielo difficile in questo momento — prova un altro orario";
}

export function buildExpectation(entry) {
  const custom = {
    ngc7000:
      "Un campo ampio con struttura a continente ben visibile: una delle nebulose più soddisfacenti con Seestar.",
    ic1396: "Tronchi e globuli nel campo: S30 Pro cattura dettagli che S50 suggerisce in mosaico.",
    m27: "Nucleo brillante e conchiglia contrastata: risultato solido in 45–60 minuti.",
    m57: "Anello netto e simmetrico: ideale per valutare trasparenza e focus.",
    m31: "Nucleo galattico luminoso: ottimo banco di prova per il cielo.",
    m13: "Sciame stellare compatto con stelle risolvibili ai bordi.",
    ic1805: "Cuore e filamenti rossi ben leggibili con dual-band.",
    ngc2244: "Ammasso giovane incastonato nella nebulosa: composizione ricca.",
  };
  if (custom[entry.id]) return custom[entry.id];

  const c = entry.category;
  if (c.includes("Nebulosa a emissione"))
    return "Gas e struttura estesa: ideali per sessioni Seestar da 60–90 minuti con dual-band.";
  if (c.includes("planetaria"))
    return "Nucleo compatto e conchiglia definita: risultato rapido anche in sessioni brevi.";
  if (c.includes("Galassia"))
    return "Nucleo luminoso e struttura esterna che emerge con cielo trasparente.";
  if (c.includes("globulare")) return "Ammasso compatto con stelle risolvibili ai bordi.";
  if (c === "Pianeta") return "Disco planetario e dettagli atmosferici: sessioni brevi o outreach.";
  return "Opportunità adatta al profilo Seestar e alle condizioni calcolate.";
}
