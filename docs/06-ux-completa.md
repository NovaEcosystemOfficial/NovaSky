# 06 - UX completa

## Architettura dell'esperienza

NovaSky si organizza in cinque aree:

1. Tonight
2. Targets
3. Session
4. Device
5. Logbook

Questa struttura segue il ciclo reale: preparare, scegliere, eseguire, controllare, ricordare.

## Flusso principale

### 1. Apertura app

L'utente vede Tonight Briefing:

- localita attiva;
- finestra astronomica;
- meteo sintetico;
- Luna;
- top target;
- stato Seestar se rilevabile;
- prossima azione consigliata.

Motivo: l'apertura deve rispondere subito a "vale la pena uscire?"

### 2. Scelta target

L'utente entra in Targets:

- filtri per DSO, Luna, Sole, Via Lattea, comete, pianeti, outreach;
- ordinamento per NovaScore;
- anteprima campo S50/S30 Pro;
- spiegazione sintetica del punteggio.

Motivo: non tutti gli oggetti belli sono buoni target per quella notte.

### 3. Planning sessione

L'utente aggiunge target a una Session Timeline:

- slot temporali consigliati;
- conflitti con Luna/nuvole/altezza;
- durata suggerita;
- possibilita di sostituire target se condizioni cambiano.

Motivo: un piano notturno deve reggere imprevisti.

### 4. Connessione Seestar

Se disponibile:

- rilevamento dispositivo;
- stato;
- invio target o apertura workflow guidato;
- monitoraggio sessione.

Se non disponibile:

- modalita companion manuale;
- checklist e log.

Motivo: l'app deve avere valore anche senza controllo diretto stabile.

### 5. Sessione live

Schermata Session:

- target attuale;
- progresso;
- condizioni;
- warning;
- note rapide;
- prossima finestra.

Motivo: durante la notte non si navigano menu; si controllano segnali.

### 6. Fine sessione

L'app propone:

- completamento log;
- import manuale/metadata;
- rating risultato;
- note su seeing, focus, filtro, problemi;
- suggerimenti futuri.

Motivo: la memoria storica e un vantaggio competitivo.

## Onboarding

Deve essere breve:

1. modello Seestar;
2. localita principale;
3. livello esperienza;
4. preferenze: deep sky, sole/luna, mosaici, outreach;
5. permessi necessari spiegati al momento.

## Modalita esperto

Attiva:

- coordinate RA/Dec;
- altitude/azimuth dettagliati;
- airmass;
- separazione dalla Luna;
- FOV numerico;
- export dati;
- metriche protocollo dispositivo.

Motivo: il regalo nasce per un esperto; questa modalita non e accessoria.

## Modalita notte

Accesso sempre presente. Deve:

- ridurre luminosita;
- convertire palette;
- disabilitare animazioni forti;
- mantenere leggibilita;
- offrire blocco orientamento e anti accidental tap.

## Errori e recovery

Esempi:

- Meteo non disponibile: usare ultimo dato con timestamp e planning astronomico offline.
- Seestar non trovato: suggerire controllo Wi-Fi/Bluetooth e modalita manuale.
- Target sotto orizzonte: spiegare quando sara disponibile.
- Luna troppo vicina: suggerire filtro o target alternativo.

## Microcopy

Il testo deve essere operativo:

- "Finestra migliore: 22:40-01:10"
- "Luna a 78%, separazione bassa: preferisci nebulose a emissione"
- "S30 Pro: mosaico consigliato per M31"

Evitare:

- "Scopri la magia del cielo"
- "Wow!"
- "Non perderti l'universo"

## UX unica: Tonight Decision Stack

Una scheda spiega la decisione:

1. cielo: buono/discreto/scarso;
2. Luna: impatto;
3. target top;
4. rischio condensa;
5. piano consigliato.

Motivo: trasforma dati separati in una scelta.
