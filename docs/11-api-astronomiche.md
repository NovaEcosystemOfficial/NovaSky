# 11 - API astronomiche da utilizzare

## Principio

Usare API solo dove aggiungono valore dinamico. Tutto cio che puo essere calcolato localmente con buona precisione deve vivere nell'app o in cache.

## API e fonti candidate

### NASA APIs

Uso:

- APOD come contenuto opzionale, non core;
- DONKI per eventi solari/spazio meteo se si vuole alert avanzato;
- immagini e contenuti educativi in una sezione futura.

Motivo: fonte autorevole, ma non deve trasformare NovaSky in app editoriale.

Fonte: https://api.nasa.gov/

### Minor Planet Center

Uso:

- comete;
- asteroidi;
- elementi orbitali aggiornati.

Motivo: oggetti dinamici richiedono dati aggiornati; MPC e riferimento naturale.

Fonte: https://minorplanetcenter.net/

### Open-Meteo

Uso:

- copertura nuvolosa;
- temperatura;
- umidita;
- vento;
- dew point stimabile;
- previsioni orarie.

Motivo: API accessibile e utile per MVP. Per seeing/transparency serve valutare fonte specialistica o modello derivato.

Fonte: https://open-meteo.com/

### Meteoblue / Astrospheric / 7Timer

Uso:

- seeing;
- trasparenza;
- cloud layers;
- previsioni astronomiche piu specifiche.

Motivo: il valore premium richiede condizioni astronomiche, non solo meteo generico. Va verificata licenza/API commerciale.

Fonti:

- https://www.meteoblue.com/
- https://www.astrospheric.com/
- http://www.7timer.info/

### SIMBAD / VizieR

Uso:

- arricchimento target;
- identificazioni catalogo;
- dati astronomici avanzati.

Motivo: eccellente per profondita, ma non necessario in MVP se si usa catalogo curato locale.

Fonti:

- https://simbad.cds.unistra.fr/
- https://vizier.cds.unistra.fr/

### Nominatim / geocoding

Uso:

- ricerca localita;
- conversione nome luogo-coordinate.

Motivo: utile per onboarding; attenzione a policy e rate limit.

Fonte: https://nominatim.org/

## Calcoli locali consigliati

- Sole, Luna, crepuscoli.
- Alt/Az per target.
- Finestra di visibilita.
- Separazione dalla Luna.
- Airmass.
- Transit/culminazione.
- FOV e framing.

Motivo: affidabilita offline e costi bassi.

## NovaScore v1

Input:

- target altitude curve;
- darkness window;
- Moon phase/altitude/separation;
- target type;
- model Seestar;
- angular size vs FOV;
- filter suitability;
- weather;
- user history.

Output:

- score 0-100;
- label;
- motivazione;
- alternative consigliate.

## Policy API

- Ogni risposta con timestamp e fonte.
- Cache locale.
- Fallback espliciti.
- Nessuna funzione critica deve fallire completamente per mancanza rete.
