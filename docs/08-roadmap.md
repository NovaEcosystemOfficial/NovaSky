# 08 - Roadmap

## Fase 0 - Fondazione prodotto

Output:

- documentazione approvata;
- scope MVP;
- prototipi UX;
- validazione protocollo Seestar/Alpaca;
- scelta API.

Gate: approvazione esplicita prima di sviluppare.

## Fase 1 - MVP Premium Locale

Obiettivo: app utile senza controllo diretto Seestar.

Funzioni:

- onboarding;
- profilo S50/S30 Pro;
- localita;
- Tonight Briefing;
- catalogo target curato;
- NovaScore v1;
- timeline osservativa;
- logbook manuale;
- tema notte;
- cache dati.

Motivo: l'app deve avere valore anche se integrazione dispositivo richiede ricerca.

## Fase 2 - Planning Avanzato

Funzioni:

- planning multi-target;
- filtri avanzati;
- framing preview;
- suggerimenti filtro/durata;
- profili luogo;
- export sessione;
- meteo piu sofisticato;
- dew risk.

## Fase 3 - Integrazione Seestar

Funzioni:

- discovery locale;
- lettura stato;
- invio target se supportato;
- monitoraggio sessione;
- fallback manuale;
- diagnostica connessione.

Gate tecnico: test su dispositivo reale S50 e S30 Pro.

## Fase 4 - Alpaca/ASCOM

Funzioni:

- supporto Alpaca dove disponibile;
- rilevamento endpoint;
- compatibilita NINA-style conceptual workflows;
- adapter device generico.

Motivo: S30 Pro dichiara supporto Alpaca; usare standard riduce lock-in.

## Fase 5 - Pro Release

Funzioni:

- statistiche storiche;
- raccomandazioni personalizzate;
- import metadata/FITS companion;
- backup/sync opzionale;
- widget Android;
- notifiche eventi e finestre.

## Fase 6 - Ecosistema

Funzioni:

- community target recipes;
- piani condivisibili;
- integrazione desktop;
- citizen science;
- marketplace di preset.

## Criteri go/no-go

- MVP non deve dipendere da reverse engineering fragile.
- Premium release richiede UX notturna impeccabile.
- Integrazione device rilasciata solo se affidabile e dichiarata con limiti chiari.
