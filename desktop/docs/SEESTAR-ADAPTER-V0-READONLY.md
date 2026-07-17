# SeestarAdapter v0 — READ-ONLY (Alpaca)

**Branch:** `cursor/mission-map-immersive-0557`  
**Checkpoint tag:** `checkpoint/pre-seestar-adapter-readonly-20260717-201102`  
**Protocollo:** STANDARD_ALPACA porta **32323**  
**Hardware di riferimento:** Seestar S30 Pro (report lab `telescope-get-20260717-200533`, `camera-connect-20260717-194005`)

## Cosa fa v0

- Discovery UDP `alpacadiscovery1` + `GET /management/v1/configureddevices`
- `getTelescopeSnapshot()` via **solo GET** sulle proprietà Telescope verificate
- Polling ~1.5s con stati **OFFLINE / CONNECTING / LIVE / ERROR**
- Camera: **solo inventory + props sicure senza Connected=true**
- Separazione assoluta **LIVE** vs **SIM**

## Cosa NON fa (vietato)

- GOTO / Slew / Park / Unpark / Sync / AbortSlew
- Exposure / Capture / ImageArray
- PUT/POST/DELETE (incluso `Connected=true` sulla Camera)
- Porte proprietarie **4700 / 4800**

## Dati LIVE dal dispositivo (Telescope)

| Campo UI | Endpoint Alpaca | Note |
|----------|-----------------|------|
| connected | `telescope/0/connected` | spesso `false` ma puntamento leggibile |
| name / driver | `name`, `description`, `driverinfo`, `driverversion` | |
| RA / Dec | `rightascension`, `declination` | ore / gradi |
| Alt / Az | `altitude`, `azimuth` | gradi |
| sidereal | `siderealtime` | |
| tracking / slewing | `tracking`, `slewing` | |
| park / home | `atpark`, `athome` | |
| utc | `utcdate` | |
| sito | `sitelatitude`, `sitelongitude` | elevation **non implementata** |
| capability can* | elenco verificato in report Telescope | solo display, **non** comandi |

## Camera (v0)

Da `configureddevices` + GET sicuri (`driverinfo`, BayerOffset, MaxBin, can* cooler flags, …).

**Non letti in v0** (richiedono `Connected=true`, non eseguito automaticamente):

- CameraX/YSize, PixelSize, Gain, CCDTemperature, CameraState, SensorType, …

Documentato in Device Hub sotto ogni camera.

## Come usare

1. PC sull’hotspot `S30 Pro_*` (rete `10.0.0.x`)
2. In Device Hub: **disattiva simulazione**
3. Apri **Seestar S30 Pro** → **Connetti LIVE (Alpaca GET)**
4. Dashboard mostra badge **LIVE** + RA/Dec/Alt/Az reali
5. Con simulazione attiva: connessione = **SIM** (nessun dato spacchettato come LIVE)

## File principali

- `desktop/main-alpaca.js` — IPC discovery + GET allowlist
- `desktop/preload.js` — `novaSkyDesktop.alpaca.*`
- `desktop/app/shared/device-hub/seestar-alpaca-adapter.js`
- `desktop/app/shared/device-hub/seestar-live-poller.js`
- `desktop/app/shared/device-hub/alpaca-bridge.js`

## Test

```bash
cd desktop
node test-seestar-adapter.js
npm run test:smoke
```

## Rollback

```bash
git checkout checkpoint/pre-seestar-adapter-readonly-20260717-201102
```
