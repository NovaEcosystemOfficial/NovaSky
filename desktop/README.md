# NovaSky Desktop (Windows MVP)

Applicazione Electron che riutilizza `../website/` senza duplicare asset o logica.

## Architettura

```text
NovaSky/
├── website/          ← sito statico (Vercel + sorgente UI desktop)
└── desktop/
    ├── main.js       ← processo Electron, protocollo nova://
    ├── preload.js  ← contextBridge (isDesktop)
    ├── package.json
    └── resources/    ← icona installer
```

- **Web (Vercel):** invariato, servito come static site.
- **Desktop:** carica `website/` via protocollo personalizzato `nova://app/` — **nessun localhost**, nessun Python.
- **Condivisione:** tutta l'UI, CSS, JS, immagini target restano in `website/`.

## Sicurezza

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Preload espone solo `window.novaSkyDesktop`
- Link http(s) aperti nel browser di sistema
- Navigazione interna limitata a `nova://`

## Sviluppo

```bash
cd desktop
npm install
npm start
```

## Build installer Windows (x64)

Su macOS/Linux (richiede Wine 64-bit per NSIS) oppure su Windows:

```bash
cd desktop
npm install
# Linux: wine64 + nsis (vedi nota sotto)
npm run build:win
```

**Nota Linux:** per generare l'installer NSIS serve Wine 64-bit configurato (`WINEARCH=win64 wineboot --init`) e opzionalmente `USE_SYSTEM_NSIS=true`.

Output: `desktop/dist/NovaSky-Setup-0.1.0.exe`

Build cartella non installata (test rapido):

```bash
npm run build:dir
```

## Runtime desktop vs browser

`preload.js` imposta `window.novaSkyDesktop.isDesktop` e `data-runtime="desktop"` sull'`<html>`.
La versione web ignora questi flag — nessuna rottura.

## Limiti MVP

- Nessun controllo hardware (Seestar, ASCOM, SynScan, Eagle)
- Richiede rete per Google Fonts (come il sito web)
- Geolocalizzazione opzionale via API browser (permesso OS)
