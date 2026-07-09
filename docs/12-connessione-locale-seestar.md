# 12 - Studio della connessione locale con Seestar

## Obiettivo

Capire come NovaSky possa interagire localmente con Seestar S50 e S30 Pro in modo affidabile, legale e sostenibile.

## Dati noti

ZWO dichiara per S50:

- Wi-Fi 2.4/5 GHz;
- Bluetooth;
- USB-C;
- app control;
- modalita Stargaze, Scenery, Solar, Lunar;
- FITS/JPEG per immagini.

ZWO dichiara per S30 Pro:

- app control con GOTO/tracking;
- dual-lens 4K;
- Plan Mode;
- EQ Mode con accessori;
- storage 128 GB;
- remote control;
- supporto ASCOM Alpaca per integrazione con software terzi.

## Approccio prudente

NovaSky deve distinguere tre livelli:

### Livello 1 - Companion manuale

Nessuna connessione diretta richiesta. L'app pianifica, guida e registra.

### Livello 2 - Lettura stato

Discovery dispositivo e lettura informazioni non distruttive:

- presenza;
- modello;
- batteria;
- storage;
- modalita;
- target attuale se disponibile.

### Livello 3 - Controllo operativo

Comandi:

- slew/goto;
- avvio sessione;
- cambio filtro;
- stop;
- plan upload.

Questo livello richiede verifica rigorosa su hardware reale e rispetto dei protocolli supportati.

## Discovery locale

Possibili canali:

- Wi-Fi direct/hotspot Seestar;
- rete locale condivisa;
- mDNS/SSDP se esposti;
- endpoint Alpaca discovery per S30 Pro;
- Bluetooth solo se documentato/necessario.

## Rischi

- Firmware diversi tra S50, S30, S30 Pro.
- Differenze regionali.
- Endpoint non documentati.
- Comandi potenzialmente pericolosi durante tracking/capture.
- Conflitto con app ufficiale.

## Strategia UX

Mai promettere "controllo completo" se non verificato. Mostrare:

- "Dispositivo rilevato";
- "Controllo disponibile";
- "Solo monitoraggio";
- "Modalita manuale".

## Diagnostica

Schermata device developer/internal:

- IP;
- porta;
- protocollo rilevato;
- latency;
- ultimo errore;
- firmware;
- capabilities.

## Sicurezza operativa

Comandi critici richiedono conferma:

- stop tracking;
- park/shutdown;
- cambio target durante capture;
- movimento manuale.

## Decisione motivata

L'integrazione locale puo rendere NovaSky unica, ma non deve diventare il suo punto fragile. Il prodotto deve essere eccellente anche come planner/logbook e diventare straordinario quando il device control e stabile.

## Fonti

- S50: https://www.zwoastro.com/product/seestar-s50/
- S30 Pro: https://www.zwoastro.com/product/seestar-s30-pro/
