# EQ6 controlli manuali LIVE (MoveAxis)

**Branch:** `cursor/mission-map-immersive-0557`  
**Driver:** EQMOD HEQ5/6 · COM3 @ 9600  
**Verificato:** `CanMoveAxis(0)=true`, `CanMoveAxis(1)=true`, AxisRates max ≈ 3.34°/s

## Implementato

- Pad **N / S / E / O** (hold → MoveAxis, rilascio → STOP)
- Pulsante **STOP / ARRESTO MOVIMENTO**
- Selettore velocità (default **Minima 0.01°/s**, clamp ≤ 0.5°/s)
- Telemetria LIVE AR/DEC/ALT/AZ + Tracking/Slewing
- Badge **IN MOVIMENTO / FERMO**
- Capability gate: se `CanMoveAxis*=false` bottone disabilitato
- Protezioni: no movimento a connect; STOP su rilascio/errore/disconnect/sim ON; no comandi se `Connected!=true`
- **Non** implementati: GOTO, Sync, Park/Unpark, Home

## Mapping assi ASCOM

| UI | Asse | Rate |
|----|------|------|
| N | 1 (DEC) | +v |
| S | 1 (DEC) | −v |
| E | 0 (AR) | +v |
| O | 0 (AR) | −v |

## Primo test manuale (velocità minima)

1. EQASCOM Connected su COM3.
2. Avvia NovaSky (`npm.cmd start` con PATH Node).
3. Simulazione **OFF** → EQ6 → **Connetti LIVE**.
4. Velocità = **Minima · 0.01°/s**.
5. Tieni premuto **N** 1–2 s, rilascia → deve fermarsi.
6. Ripeti S / E / O brevemente.
7. Premi **ARRESTO MOVIMENTO** in qualsiasi momento.

## Test software (nessun movimento non-zero)

```powershell
$env:PATH = "$env:TEMP\node-v22.17.0-win-x64;$env:PATH"
cd C:\Users\remo\Desktop\Novasky\desktop
npm.cmd run test:eq6-manual
npm.cmd run test:smoke
npm.cmd run build:dir
```
