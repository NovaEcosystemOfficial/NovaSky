# 07 - Architettura software

## Obiettivo architetturale

Costruire un'app Android premium, offline-first, estendibile e pronta per integrazione Seestar/Alpaca senza legare il prodotto a una sola implementazione di protocollo.

## Stack consigliato

- Linguaggio: Kotlin.
- UI: Jetpack Compose.
- Architettura: modular Clean Architecture pragmatica.
- Async: Coroutines + Flow.
- DI: Hilt o Koin. Preferenza: Hilt per standard Android maturo.
- Persistenza: Room.
- Key-value: DataStore.
- Networking: Ktor Client o Retrofit/OkHttp. Preferenza: Ktor se si vuole multiplatform futuro; Retrofit se si resta Android puro.
- Work scheduling: WorkManager.
- Map/sky rendering: fase 1 custom leggera; fase futura engine dedicato se serve.

## Moduli logici

- `app`: composizione Android.
- `core-model`: entita dominio.
- `core-time`: tempo, coordinate, conversioni.
- `core-astro`: calcoli astronomici.
- `core-weather`: meteo e condizioni.
- `core-database`: Room e repository locali.
- `core-network`: client API.
- `feature-tonight`
- `feature-targets`
- `feature-session`
- `feature-device`
- `feature-logbook`
- `integration-seestar`
- `integration-alpaca`

## Principio di dipendenza

Le feature dipendono da interfacce di dominio, non da API concrete. Esempio: `TelescopeController` ha implementazioni `SeestarLocalController`, `AlpacaController`, `ManualController`.

Motivo: il protocollo Seestar puo cambiare; l'app deve sopravvivere.

## Dominio principale

Entita:

- `ObservingSite`
- `TelescopeProfile`
- `Target`
- `VisibilityWindow`
- `NightPlan`
- `Session`
- `CaptureRun`
- `WeatherSnapshot`
- `MoonContext`
- `NovaScore`
- `DeviceStatus`

## Offline-first

L'app deve funzionare con:

- catalogo locale essenziale;
- effemeridi/calcoli locali per Sole, Luna, pianeti base;
- meteo cache;
- log locale;
- piano sessione locale;
- sincronizzazione futura opzionale.

Motivo: il telefono puo essere connesso alla Wi-Fi del Seestar e non a internet.

## Calcoli astronomici

Approccio:

- Fase 1: libreria/calcoli locali per coordinate, alba/tramonto, crepuscolo, Luna, alt/az, finestre.
- Fase 2: cataloghi piu ricchi e oggetti dinamici via API/cache.
- Fase 3: motore avanzato per framing, mosaici e suggerimenti.

## Integrazione dispositivo

Astrazione:

```text
TelescopeDiscovery
TelescopeConnection
TelescopeStatusReader
TelescopeCommandSender
CaptureMonitor
```

Implementazioni:

- manuale;
- Seestar locale;
- Alpaca;
- futura bridge cloud o desktop.

## Sicurezza e privacy

- Posizione salvata localmente per default.
- Nessun upload obbligatorio.
- Chiavi API in storage sicuro.
- Telemetria opt-in.
- Export dati sotto controllo dell'utente.

## Testing

- Unit test per calcoli astronomici e scoring.
- Integration test per repository e parser API.
- Fake device controller per sessioni simulate.
- Snapshot/Compose test per schermate critiche.

## Rischi tecnici

- Accuratezza calcoli: mitigare con test contro fonti note.
- Protocollo Seestar instabile: mitigare con adapter isolato.
- API rate limit: cache e fallback.
- UI live complessa: modellare stati con reducer chiari.

## Decisione motivata

L'architettura deve trattare Seestar come integrazione, non come fondazione unica. La fondazione e il dominio astrofotografico: target, notte, condizioni, sessione.
