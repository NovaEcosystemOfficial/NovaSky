# Mission Map — motore astronomico (Sprint 8)

Calcoli lato browser, senza backend. Nessuna dipendenza esterna.

## Moduli

| Modulo | Ruolo |
|--------|--------|
| `astro/math.js` | Angoli, separazione angolare |
| `astro/time.js` | Data Giuliana, GMST/LST, formattazione |
| `astro/coords.js` | RA/Dec → alt/az topocentrico |
| `astro/sun.js` | Sole, crepuscolo astronomico (−18°) |
| `astro/moon.js` | Luna: posizione, fase, separazione |
| `astro/planets.js` | Saturno (elementi orbitali Schlyter) |
| `astro/states.js` | Stati altitudine (sotto/basso/osservabile/ottimale) |
| `astro/visibility.js` | Finestre, culminazione, filtro cielo |
| `astro/recommendation.js` | Verdetto NovaSky con spiegazione testuale |
| `data/catalog.js` | Catalogo curato (RA/Dec J2000, metadati) |
| `data/config.js` | Demo location, soglie altitudine |
| `services/location-service.js` | Geolocalizzazione con consenso |
| `services/sky-compute.js` | Orchestrazione sessione notturna |

## Formule principali

**Angolo orario:** \( H = \mathrm{LST} - \mathrm{RA} \)

**Altitudine:**
\[
\sin h = \sin\delta\sin\phi + \cos\delta\cos\phi\cos H
\]

**Azimut** (da nord, verso est): derivato da \( H, \delta, \phi, h \).

**Separazione angolare** (Moon–target): legge cosinusi su sfera.

**Crepuscolo astronomico:** intersezione altitudine solare = −18°.

## Limitazioni note

- Precisione ~0.1°–0.5° per Sole/Luna/pianeti (algoritmi Meeus low-precision).
- Saturno: elementi medii, adeguato al 2020–2030.
- Rifrazione atmosferica **non** applicata (target oltre 20°: errore trascurabile).
- Precessione/nutazione non modellate (catalogo J2000).
- Finestre osservative: campionamento ogni 10 minuti.
- Nessuna persistenza coordinate GPS (solo sessione corrente).

## Test

```bash
node website/scripts/mission-map/tests/run-tests.mjs
```

## Soglie (`config.js`)

- `MIN_ALT` 20° — finestra osservativa minima
- `OPTIMAL_ALT` 45° — stato “ottimale”

## Località demo

Milano (45.464°N, 9.19°E) se l’utente nega il permesso GPS.
