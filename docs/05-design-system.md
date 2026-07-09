# 05 - Design System

## Direzione visiva

NovaSky deve sembrare uno strumento professionale notturno: scuro, leggibile, preciso, con accenti controllati. Evitare il classico tema "spazio viola/blu con gradienti ovunque". Il cielo e gia poetico; l'interfaccia deve restare uno strumento.

## Principi

- Leggibilita in campo prima dell'estetica.
- Modalita notte reale con rosso profondo e contrasto basso.
- Densita informativa regolabile.
- Gerarchia chiara: decisione primaria, dati di supporto, dettagli.
- Componenti stabili, senza layout che cambia durante aggiornamenti live.

## Palette

### Tema scuro principale

- Background: `#080A0E`
- Surface: `#11151B`
- Surface raised: `#181E26`
- Border: `#2A313B`
- Text primary: `#E8EDF2`
- Text secondary: `#A9B3BF`
- Text muted: `#6F7A86`
- Accent cyan: `#56C7D9`
- Accent amber: `#E6B85C`
- Success: `#6DCE8C`
- Warning: `#E6B85C`
- Danger: `#E36D6D`

### Tema notte rossa

- Background: `#050000`
- Surface: `#120303`
- Text primary: `#FF6B5F`
- Text secondary: `#B7473F`
- Border: `#3A1412`
- Accent: `#FF8A7A`

Motivo: preservare adattamento al buio e ridurre fastidio visivo. Il tema rosso deve essere completo, non un semplice filtro.

## Tipografia

- Font consigliato: Inter o Roboto Flex.
- Numeri tabellari per coordinate, ore, altitudine, percentuali.
- Titoli compatti, niente hero typography nelle schermate operative.
- Dimensioni minime leggibili in campo: 14sp corpo, 12sp solo per metadata secondari.

## Iconografia

Usare icone semplici e riconoscibili:

- telescopio;
- target;
- Luna;
- nuvole;
- vento;
- filtro;
- batteria;
- Wi-Fi;
- timer;
- log;
- mappa;
- warning.

Motivo: durante una sessione notturna il riconoscimento rapido batte il testo lungo.

## Componenti principali

### Target Card

Mostra nome, tipo, NovaScore, finestra migliore, altezza massima, filtro consigliato, durata suggerita e compatibilita S50/S30 Pro.

### Session Timeline

Linea oraria con finestre target, Luna, crepuscolo astronomico, meteo e meridiano. Deve essere il cuore del planning.

### Condition Strip

Barra compatta: nuvole, seeing, trasparenza, Luna, vento, temperatura, umidita, dew risk.

### Framing Preview

Anteprima del campo per modello Seestar selezionato. Deve indicare scala, rotazione, mosaico e margini.

### Device Status Panel

Connessione, batteria, storage, temperatura, stato tracking/capture, modalita, filtro.

## Stati UI

- Empty state: utile, non decorativo.
- Loading: sempre con dato atteso.
- Offline: mostra cosa resta disponibile.
- Degraded data: indica quando una fonte e vecchia o stimata.
- Device unavailable: proporre azione manuale o apertura app Seestar.

## Accessibilita

- Contrasto sufficiente anche in tema scuro.
- Tasti primari almeno 48dp.
- Nessuna informazione veicolata solo dal colore.
- Supporto font scale senza sovrapposizioni.

## Motion

Animazioni minime, funzionali. Transizioni morbide per timeline e aggiornamenti live, niente effetti decorativi durante uso notturno.

## Scelta motivata

Un prodotto premium non deve per forza apparire "lussuoso"; deve apparire affidabile. Per un astrofotografo, una timeline precisa vale piu di un'illustrazione cosmica.
