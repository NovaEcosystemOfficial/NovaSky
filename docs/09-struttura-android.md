# 09 - Struttura Android

## Obiettivo

Definire una struttura Android scalabile, leggibile e adatta a uno sviluppo commerciale.

## Struttura consigliata

```text
NovaSky/
  app/
  core/
    model/
    astro/
    time/
    database/
    network/
    design/
    preferences/
    testing/
  data/
    targets/
    weather/
    ephemeris/
    seestar/
    alpaca/
  domain/
    planning/
    scoring/
    session/
    device/
  feature/
    onboarding/
    tonight/
    targets/
    targetdetail/
    planner/
    session/
    device/
    logbook/
    settings/
```

## Motivazione

Separare `feature`, `domain`, `data` e `core` evita che l'app diventi un blocco unico. Le integrazioni Seestar/Alpaca devono poter cambiare senza riscrivere la UX.

## Package naming

Base:

```text
com.novasky
```

Esempi:

```text
com.novasky.feature.tonight
com.novasky.domain.scoring
com.novasky.data.seestar
com.novasky.core.astro
```

## Navigazione

Usare Navigation Compose con route tipizzate o wrapper interno.

Sezioni principali:

- Tonight
- Targets
- Planner
- Session
- Device
- Logbook
- Settings

## State management

Pattern consigliato:

- `UiState` immutabile;
- `UiEvent`;
- `ViewModel`;
- Flow da use case;
- one-shot effects per snackbar/navigation.

Motivo: schermate come Session e Device avranno stati live; serve prevedibilita.

## Design system module

`core/design` deve contenere:

- theme;
- typography;
- color tokens;
- buttons;
- cards;
- timeline;
- charts;
- condition chips;
- icons;
- night mode handling.

## Build variants

- `debug`: dati fake, logging, mock device.
- `internal`: beta testing.
- `release`: Play Store.

## Configurazione API

Chiavi e endpoint:

- build config per endpoint pubblici;
- Android Keystore/DataStore per chiavi utente se necessarie;
- mai hardcodare segreti in repository.

## Qualita

- Lint Android.
- Detekt.
- KtLint.
- Test unitari per dominio.
- Test UI per percorsi principali.

## Decisione motivata

La modularizzazione iniziale costa un po' di disciplina, ma evita un refactor doloroso quando arriveranno device control, Alpaca, database e sync.
