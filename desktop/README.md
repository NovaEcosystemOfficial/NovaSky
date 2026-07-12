# NovaSky Desktop

Software Windows per l'osservatorio personale. UI dedicata in `app/`; motore astronomico condiviso da `../website/` (sola lettura).

## Architettura Sprint 1

```text
NovaSky/
├── website/              ← sito Vercel + motore condiviso (engine)
└── desktop/
    ├── main.js           ← Electron, protocollo nova://
    ├── preload.js
    └── app/              ← shell software (Dashboard, Mission Map, …)
        ├── index.html
        ├── shell/
        ├── views/
        ├── styles/
        └── assets/fonts/ ← Inter offline
```

### Protocollo

| URL | Origine | Uso |
|-----|---------|-----|
| `nova://desktop/` | `desktop/app/` | UI software |
| `nova://engine/` | `website/` | Motore, catalogo, asset target |

Nessun localhost. Nessuna dipendenza da Internet (font Inter locale).

### Shell

- Sidebar: Dashboard, Mission Map, Missione, Catalogo, Attrezzatura, Diario, Impostazioni
- Header operativo (nascosto in Mission Map — mantiene look osservatorio)
- Pannello destro collassabile
- Dashboard con dati reali da `computeSkySession` + mission store

## Sviluppo

```bash
cd desktop
npm install
npm start
```

## Test

```bash
npm run test:smoke
```

## Build Windows (x64)

```bash
npm run build:win
```

Output: `desktop/dist/NovaSky-Setup-0.1.0.exe`

Su Linux: `WINEARCH=win64 wineboot --init` prima della build NSIS.

## Condivisione con website

Import ES module da `nova://engine/scripts/mission-map/…` — nessuna duplicazione del motore.

Modifica minima in `website/scripts/mission-map/app.js`: export `ObservatoryApp` + skip auto-init nella shell desktop. Il sito Vercel resta invariato.

## Limiti Sprint 1

- Attrezzatura: solo UI placeholder (8 dispositivi)
- Missione, Catalogo, Diario, Impostazioni: placeholder
- Nessun controllo hardware
