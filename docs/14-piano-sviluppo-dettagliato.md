# 14 - Piano di sviluppo dettagliato

## Fase A - Validazione e setup

Durata stimata: 1-2 settimane.

Attivita:

- approvare documentazione;
- definire MVP;
- scegliere stack definitivo;
- creare backlog;
- verificare API meteo/astronomiche;
- reperire S50/S30 Pro per test;
- definire criteri Play Store.

Output:

- backlog priorizzato;
- mock UX;
- rischio integrazione device classificato.

## Fase B - Fondazione Android

Durata stimata: 1-2 settimane.

Attivita:

- creare progetto Android;
- configurare moduli;
- tema/design system base;
- navigazione;
- storage preferenze;
- database iniziale;
- test setup.

Output:

- app skeleton navigabile;
- tema scuro/notte;
- pipeline test.

## Fase C - Core astronomico

Durata stimata: 2-4 settimane.

Attivita:

- modelli target;
- catalogo locale MVP;
- calcoli visibilita;
- Sole/Luna/crepuscoli;
- FOV Seestar;
- NovaScore v1.

Output:

- Tonight Briefing con dati locali;
- target ordinabili;
- test calcoli.

## Fase D - UX planning

Durata stimata: 3-5 settimane.

Attivita:

- target list;
- target detail;
- timeline;
- filtri;
- session builder;
- modalita notte completa.

Output:

- MVP usabile sul campo senza device control.

## Fase E - Logbook

Durata stimata: 2-3 settimane.

Attivita:

- sessioni;
- capture runs;
- note;
- rating;
- storico target;
- export base.

Output:

- memoria personale del cielo.

## Fase F - Meteo e API

Durata stimata: 2-3 settimane.

Attivita:

- integrazione meteo;
- cache;
- fallback;
- dew risk;
- trasparenza/seeing se fonte disponibile.

Output:

- NovaScore con condizioni reali.

## Fase G - Seestar/Alpaca research

Durata stimata: 2-6 settimane, parallela.

Attivita:

- test discovery;
- test Alpaca;
- adapter device;
- fake controller;
- UI stato device;
- verifica sicurezza.

Output:

- decisione su livello integrazione v1.

## Fase H - Beta interna

Durata stimata: 2-4 settimane.

Attivita:

- test su campo;
- correzione UX notturna;
- performance;
- crash reporting opt-in;
- preparazione listing Play Store.

## Fase I - Release

Attivita:

- privacy policy;
- store assets;
- pricing;
- closed testing;
- rollout graduale.

## Definition of Done MVP

- L'utente puo pianificare una notte con target ordinati.
- L'utente capisce perche un target e consigliato.
- L'utente puo creare e salvare una sessione.
- L'app funziona offline con dati gia presenti.
- Tema notte e leggibile.
- Nessun dato critico dipende da rete live.
