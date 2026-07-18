# Eq6AscomAdapter v0 — READ-ONLY (ASCOM / EQMOD)

**Branch:** `cursor/mission-map-immersive-0557`  
**Checkpoint tag:** `checkpoint/pre-eq6-live-readonly-20260718-011221`  
**Driver:** EQMOD HEQ5/6 — ProgID `EQMOD.Telescope`  
**Hardware:** Sky-Watcher EQ6 / EQ6 Pro via SynScan PC Direct · **COM3 @ 9600**  
**Piattaforma:** ASCOM 7 + EQASCOM 2.00w

## Cosa fa v0

- Discovery del driver ASCOM registrato (`EQMOD.Telescope`)
- `getMountSnapshot()` via bridge PowerShell **32-bit** (SysWOW64) — solo `Connected` + letture proprietà
- Polling ~1.5s con stati **OFFLINE / CONNECTING / LIVE / ERROR**
- Separazione assoluta **LIVE** vs **SIM**
- Avviso non bloccante: *Coordinate sito EQMOD da verificare* (nessuna scrittura sul sito)

## Cosa NON fa (vietato — adapter incapace)

- GOTO / Slew / MoveAxis / Sync
- Park / Unpark / FindHome / AbortSlew
- Cambio Tracking / PulseGuide
- Scrivere coordinate o sito
- Protocollo seriale SynScan diretto dall’app

Il bridge PowerShell e `invoke()` rifiutano qualsiasi capability di movimento.

## Come usare

1. SynScan in **PC Direct Mode**, cavo su **COM3 @ 9600**
2. Apri e collega **EQASCOM / EQMOD HEQ5/6**
3. In NovaSky Device Hub: **disattiva simulazione**
4. Apri **Montatura EQ6-R Pro** → **Connetti LIVE (EQMOD)**
5. Dashboard mostra pannello **Montatura EQ6** con badge **LIVE** + AR/DEC/ALT/AZ reali

## File principali

- `desktop/bridges/eq6-ascom-readonly.ps1` — bridge ASCOM read-only
- `desktop/main-eq6-ascom.js` — IPC Electron
- `desktop/preload.js` — `novaSkyDesktop.eq6Ascom.*`
- `desktop/app/shared/device-hub/eq6-ascom-adapter.js`
- `desktop/app/shared/device-hub/eq6-ascom-bridge.js`
- `desktop/app/shared/device-hub/eq6-live-poller.js`

## Test

```bash
cd desktop
node test-eq6-adapter.js
npm run test:smoke
```

## Rollback

```bash
git checkout checkpoint/pre-eq6-live-readonly-20260718-011221
```
