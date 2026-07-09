# 18 - Product Design ed esperienza visiva

## Scopo del documento

Questo documento definisce l'identita visiva completa di NovaSky prima dello sviluppo. Non descrive codice, componenti implementativi o librerie: descrive l'esperienza che l'utente deve percepire.

Obiettivo emotivo: quando l'utente apre NovaSky deve pensare che non sta usando una semplice app astronomica, ma un piccolo centro di controllo notturno progettato con rispetto per il cielo, per il tempo dell'astrofotografo e per la precisione del lavoro sul campo.

## 1. Filosofia del design

### Emozioni da trasmettere

NovaSky deve trasmettere:

- calma;
- controllo;
- fiducia;
- meraviglia trattenuta;
- precisione;
- silenzio operativo;
- piacere tattile;
- senso di strumento premium.

Non deve trasmettere:

- caos;
- videogioco;
- app educativa per principianti;
- dashboard tecnica fredda;
- imitazione di planetario;
- estetica "spazio generico" fatta di gradienti viola e stelle decorative.

### Sensazione all'apertura

L'apertura deve sembrare l'accensione di uno strumento ottico raffinato. L'utente non deve essere investito da una mappa stellare piena di icone. Deve vedere subito una sintesi della notte:

- il cielo profondo come sfondo;
- una frase operativa breve;
- il miglior target o la migliore decisione;
- pochi dati essenziali;
- una via chiara per pianificare o continuare.

La prima sensazione deve essere: "L'app ha gia capito la notte."

### Personalita di NovaSky

NovaSky e:

- competente, ma non arrogante;
- elegante, ma non decorativa;
- poetica, ma mai vaga;
- silenziosa, ma presente;
- tecnica, ma leggibile;
- personale, ma commerciale.

Se NovaSky fosse una persona, sarebbe un assistente di osservatorio esperto: prepara prima gli strumenti, conosce il cielo, parla poco, ma quando parla dice qualcosa di utile.

### Tensione progettuale

NovaSky vive tra due poli:

- la meraviglia del cielo;
- la disciplina della sessione astrofotografica.

La soluzione visiva e non scegliere uno dei due, ma farli convivere: sfondi profondi e atmosferici, interfaccia rigorosa, dati ordinati, microinterazioni morbide.

## 2. Moodboard

### Colori

La palette deve ricordare tre materiali visivi:

- cielo profondo: neri ricchi, non grigi piatti;
- ottica professionale: superfici scure, bordi sottili, riflessi controllati;
- strumenti notturni: rosso basso, ambra, ciano tecnico.

Palette primaria:

- Deep Space Black: `#05070A`
- Optical Black: `#0A0D12`
- Carbon Surface: `#111722`
- Instrument Surface: `#171F2A`
- Thin Border: `#283241`
- Star Text: `#EEF3F8`
- Soft Text: `#AAB6C4`
- Dim Text: `#717D8A`
- Telescope Cyan: `#5CC7D8`
- Meridian Amber: `#E7B85A`
- Night Red: `#FF6258`
- Safe Green: `#67C98D`
- Alert Coral: `#E56F68`

Regola: il ciano non e decorazione, indica interazione, connessione o precisione. L'ambra indica finestre, opportunita e attenzione. Il rosso e riservato alla modalita notturna e agli stati critici.

### Materiali

NovaSky deve sembrare costruita con:

- vetro ottico molto scuro;
- metallo anodizzato nero;
- incisioni luminose sottili;
- superfici opache;
- luce radente appena visibile.

Effetto vietato: vetro glossy con blur pesante da social app. L'app deve essere premium per sottrazione.

### Effetti

Consentiti:

- glow minimo intorno a elementi attivi;
- linee sottili per orbite, timeline, reticoli e soglie;
- parallax lentissimo nello sfondo del Tonight Briefing;
- dissolvenze tra stati;
- progressi circolari o lineari con moto fluido.

Da evitare:

- stelle casuali ovunque;
- gradienti viola/blu dominanti;
- particelle decorative;
- animazioni continue senza scopo;
- ombre grandi da card marketing.

### Luci

La luce deve comportarsi come luce strumentale:

- puntuale;
- controllata;
- bassa;
- leggibile;
- mai abbagliante.

Le superfici non devono brillare tutte. Solo l'elemento attivo puo avere un lieve alone.

### Stile grafico

Stile: "observatory instrument interface".

Caratteristiche:

- layout puliti;
- grafici minimali;
- mappe solo quando servono;
- dati in colonne ordinate;
- radius moderato;
- separatori sottili;
- forte gerarchia del vuoto.

Il vuoto e un elemento di design. In un'app notturna, spazio libero significa calma.

### Font

Font consigliati:

- Inter per UI generale;
- Roboto Flex come alternativa Android-native;
- JetBrains Mono o Roboto Mono solo per coordinate, log e diagnostica.

Regole:

- numeri tabellari per orari, coordinate, percentuali;
- titoli brevi, mai urlati;
- corpo minimo 15sp per uso normale;
- modalita 60+ con corpo minimo 17sp;
- evitare letter spacing negativo.

### Iconografia

Icone:

- lineari;
- sottili ma non fragili;
- sempre accompagnate da tooltip o label quando ambigue;
- coerenti con strumentazione, non illustrative.

Stile:

- stroke 1.75-2dp;
- angoli leggermente arrotondati;
- nessun riempimento complesso;
- uso di badge piccoli per stato.

Icone chiave:

- target;
- telescopio;
- Luna;
- Sole;
- filtro;
- nuvola;
- vento;
- condensa;
- batteria;
- Wi-Fi;
- timer;
- log;
- warning;
- Alpaca/standard connection come porta o nodo, non logo dominante.

### Animazioni

Il movimento deve sembrare astronomico: lento quando comunica scala, rapido quando conferma azione, fluido quando mostra continuita temporale.

Ispirazioni:

- Apple Watch per sintesi immediata e profondita nera;
- Tesla/Polestar per controllo tecnico elegante;
- DJI Fly per stato dispositivo e missione;
- Halide per rispetto dell'utente esperto;
- Arc/Linear per gerarchia pulita e microinterazioni raffinate;
- Garmin/Coros per leggibilita outdoor;
- strumenti scientifici moderni per dati compatti.

Nota: queste sono ispirazioni di qualita percepita, non riferimenti da copiare.

## 3. Design Language

### Regole fondamentali

1. Nessuna schermata deve sembrare affollata.
2. Ogni schermata deve avere una decisione primaria visibile.
3. Il nero deve ricordare il cielo profondo, non un semplice tema dark.
4. Ogni animazione deve avere uno scopo.
5. L'interfaccia deve risultare elegante anche con luminosita minima.
6. La modalita notte non e un filtro rosso: e un tema progettato.
7. I dati tecnici devono essere leggibili senza diventare aggressivi.
8. Le mappe non devono dominare se non servono.
9. Ogni warning deve proporre una scelta, non solo un problema.
10. Ogni score deve essere spiegabile.

### Densita

NovaSky usa tre livelli di densita:

- Calm: per apertura, briefing, onboarding.
- Focus: per planning e target detail.
- Instrument: per sessione live, device e diagnostica.

L'utente esperto puo aumentare la densita, ma il default deve restare calmo.

### Gerarchia

Ogni schermata segue questa gerarchia:

1. Contesto: dove sono, quale notte, quale target.
2. Decisione: cosa conviene fare.
3. Dati primari: massimo 3-5 metriche.
4. Dettagli: espandibili.
5. Azioni: chiare e poche.

### Layout

Regole:

- margini esterni generosi;
- griglie stabili;
- card solo per contenuti ripetuti o pannelli separati;
- evitare card dentro card;
- usare linee e spazio prima di contenitori pesanti;
- bottom navigation sobria;
- stato Seestar sempre raggiungibile ma non invasivo.

### Colore funzionale

- Ciano: interazione, connessione, target attivo, precisione.
- Ambra: opportunita temporale, finestra migliore, attenzione lieve.
- Rosso: notte, rischio, stop, errore.
- Verde: completamento, condizione buona, conferma.
- Grigio blu: dati neutri.

### Linguaggio dei dati

Un dato senza interpretazione e incompleto. Esempio:

- Non solo "Luna 78%".
- Ma "Luna 78%, alta dopo 23:10: preferisci nebulose a emissione."

### Personalizzazione

L'app deve imparare senza diventare opaca. Se consiglia un target perche l'utente lo ama o perche ha avuto buoni risultati, deve dirlo.

## 4. UX completa per schermata

### Welcome

Disposizione:

- sfondo nero profondo con leggero campo stellare realistico, quasi impercettibile;
- logo NovaSky centrato in alto;
- frase breve sotto: "Prepara la notte. Scegli il cielo giusto.";
- pulsante primario in basso;
- link secondario per importare configurazione futura.

Gerarchia:

- brand;
- promessa;
- azione.

Comportamento:

- prima apertura lenta e silenziosa;
- nessuna richiesta permessi immediata.

Animazioni:

- fade-in del logo 450ms;
- stelle appena visibili che emergono in 800ms;
- pulsante che appare dopo contenuto, non prima.

Feedback aptico:

- leggero tap sul pulsante primario.

### Scelta modello Seestar

Disposizione:

- due grandi selezioni: S50 e S30 Pro;
- ogni modello mostra silhouette minimale, aperture/focale/sensore in tre righe;
- selezione con bordo ciano e lieve glow.

Gerarchia:

- scelta modello;
- differenze operative;
- continua.

Comportamento:

- l'utente puo cambiare modello dopo;
- supporto a "non ho ancora deciso".

Microinterazioni:

- tocco su modello: breve espansione delle specifiche piu importanti;
- long press: spiegazione compatibilita.

### Localita principale

Disposizione:

- campo ricerca grande;
- pulsante usa posizione;
- sotto, lista localita recenti o manuali;
- indicatore Bortle opzionale.

Gerarchia:

- coordinate/localita;
- qualita cielo;
- privacy.

Comportamento:

- spiegare che la posizione resta locale;
- accesso a inserimento manuale per utenti esperti.

Animazioni:

- mappa non necessaria nel default;
- conferma posizione con linea orizzonte che si stabilizza.

### Preferenze osservazione

Disposizione:

- chip grandi: Nebulose, Galassie, Luna, Sole, Via Lattea, Outreach, Comete;
- slider discreto: "piu automatico" vs "piu controllo";
- toggle modalita esperto.

Gerarchia:

- cosa ami osservare;
- quanto controllo vuoi.

Comportamento:

- le scelte influenzano ordinamento, non nascondono contenuti.

### Permessi

Disposizione:

- lista di permessi con motivo chiaro;
- ogni permesso ha stato e azione.

Comportamento:

- chiedere solo al momento utile;
- nessun blocco totale se un permesso e negato.

### Tonight Briefing

Disposizione:

- top bar: localita, data, stato rete/dispositivo;
- grande area centrale: "Stasera: buona finestra 22:15-01:40";
- sotto, NovaScore della notte;
- tre metriche principali: Luna, nuvole, miglior target;
- timeline compatta;
- sezione "Cosa fare ora" con una sola azione primaria.

Gerarchia:

- verdetto della notte;
- finestra;
- target;
- dettagli.

Flusso:

- apri app;
- leggi verdetto;
- scegli "Pianifica" o "Vedi target";
- scendi per dettagli.

Comportamento:

- se i dati meteo mancano, mostra planning astronomico e timestamp ultimo meteo;
- se Seestar e connesso, mostra pill discreta "S30 Pro pronto".

Animazioni:

- la timeline entra da sinistra come avanzamento del tempo;
- NovaScore sale da 0 al valore in 700ms solo all'apertura, non ogni volta;
- aggiornamenti meteo con crossfade, mai lampeggi.

Feedback aptico:

- leggero su azione primaria;
- medio su warning critico.

### Condition Detail

Disposizione:

- grafico orario a bande: nuvole, trasparenza, seeing, vento, umidita;
- sotto, spiegazione "perche importa";
- target impattati.

Gerarchia:

- trend;
- rischio;
- azione.

Microinterazioni:

- trascinando sulla timeline, le metriche cambiano in sincronia;
- snap sugli orari importanti.

### Moon Detail

Disposizione:

- Luna stilizzata, non fotorealistica;
- fase, altezza, orari, separazione dai target;
- lista "target disturbati" e "target consigliati".

Comportamento:

- la Luna non e solo dato estetico, e filtro decisionale.

Animazioni:

- fase lunare con transizione morbida quando cambia data;
- nessuna rotazione decorativa continua.

### Weather Detail

Disposizione:

- pannello tecnico con dati meteo;
- fonte e timestamp sempre visibili;
- suggerimenti operativi: condensa, vento, nuvole.

Feedback:

- se fonte vecchia, badge amber "dato non recente".

### Event Alerts

Disposizione:

- lista cronologica di eventi;
- ogni evento ha tipo, finestra, compatibilita Seestar.

Comportamento:

- notifiche configurabili;
- priorita agli eventi fotografabili, non solo astronomicamente interessanti.

### Target List

Disposizione:

- ricerca in alto;
- filtri orizzontali;
- lista di Target Card;
- ogni card mostra nome, tipo, NovaScore, finestra, filtro, indicatore FOV.

Gerarchia:

- score;
- nome;
- perche ora;
- azione.

Comportamento:

- default ordinato per "migliore stasera";
- filtri persistenti ma facili da resettare.

Animazioni:

- riordinamento lista con movimento breve e leggibile;
- skeleton loading sobrio.

Microinterazioni:

- swipe leggero per preferito o aggiungi a piano;
- tap apre dettaglio;
- long press mostra quick preview.

### Target Filters

Disposizione:

- bottom sheet;
- sezioni: tipo, altezza minima, durata, filtro, modello, difficolta, Luna.

Comportamento:

- ogni filtro mostra quanti target restano;
- pulsante reset sempre visibile.

### Target Detail

Disposizione:

- header: nome, cataloghi, tipo;
- NovaScore con spiegazione;
- framing preview;
- curva visibilita;
- suggerimento sessione;
- note personali;
- azione "Aggiungi al piano".

Gerarchia:

- target;
- vale la pena?;
- come fotografarlo;
- dettagli.

Animazioni:

- framing preview entra con leggero zoom da 96% a 100%;
- curva visibilita disegnata una volta in 500ms.

Feedback aptico:

- selezione target: tap leggero;
- aggiunta al piano: doppio micro-pulse molto sottile.

### Framing Preview

Disposizione:

- area quadrata/rettangolare con campo reale;
- bordo FOV S50/S30 Pro;
- overlay target;
- controlli: modello, rotazione, mosaico, crop.

Comportamento:

- pinch zoom;
- doppio tap torna a fit;
- toggle mosaico mostra griglia.

Animazioni:

- zoom ancorato al gesto;
- griglia mosaico appare per linee, non con pop improvviso.

### Visibility Chart

Disposizione:

- asse orario;
- curva altezza;
- bande crepuscolo;
- area Luna problematica;
- marker migliore finestra.

Comportamento:

- drag per leggere valori;
- tap su finestra aggiunge slot al piano.

### Similar Targets

Disposizione:

- lista compatta;
- motivo della similarita: "stessa finestra", "migliore con Luna", "piu adatto a S30 Pro".

### Favorite Targets

Disposizione:

- raccolta personale;
- ordinamento per prossima buona notte.

Comportamento:

- non solo lista statica: ogni preferito mostra quando conviene riprovarlo.

### Night Planner

Disposizione:

- timeline centrale;
- target come blocchi temporali;
- condizioni sopra la timeline;
- pannello inferiore con suggerimenti.

Gerarchia:

- sequenza notte;
- conflitti;
- alternative.

Comportamento:

- drag target per cambiare ordine;
- auto-snap su finestre migliori;
- warning se target scende troppo o Luna entra.

Animazioni:

- blocchi timeline con inerzia minima;
- conflitti evidenziati da bordo amber pulsante una sola volta;
- transizione "ottimizza piano" come riallineamento fluido dei blocchi.

Feedback aptico:

- snap temporale: leggero tick;
- conflitto: medio singolo;
- completamento piano: leggero successo.

### Timeline Editor

Disposizione:

- vista piu tecnica;
- zoom orario;
- metrica selezionabile.

Comportamento:

- pinch per zoom temporale;
- drag laterale per scorrere notte.

### Add Target

Disposizione:

- ricerca contestuale;
- suggerimenti gia ordinati per slot libero.

Comportamento:

- non mostra tutti i target: mostra quelli sensati per quel buco temporale.

### Conflict Resolution

Disposizione:

- pannello chiaro: problema, impatto, opzioni.

Esempio:

- Problema: Luna troppo vicina dopo 23:30.
- Opzione 1: anticipa target.
- Opzione 2: cambia target.
- Opzione 3: usa filtro dual-band.

Animazioni:

- il blocco problematico si collega visivamente al pannello tramite linea sottile.

### Plan Summary

Disposizione:

- piano finale;
- durata totale;
- target;
- checklist;
- rischi;
- pulsante "Avvia sessione".

### Export Plan

Disposizione:

- formato;
- contenuto incluso;
- anteprima breve.

Comportamento:

- export mai nascosto dietro cloud.

### Live Session Dashboard

Disposizione:

- top: target attuale e stato Seestar;
- centro: progresso sessione;
- lato/section: condizioni live;
- basso: note rapide, prossimo target, stop.

Gerarchia:

- cosa sta accadendo;
- quanto manca;
- cosa puo andare storto;
- prossima azione.

Comportamento:

- modalita anti accidental tap;
- comandi critici con conferma;
- UI piu grande e meno densa.

Animazioni:

- progresso capture fluido ma lento;
- stato tracking con piccolo indicatore orbitale;
- warning entra dal basso, non copre il target.

Feedback aptico:

- foto/completamento sub-run: leggero;
- errore connessione: medio;
- stop confermato: netto ma non aggressivo.

### Current Target

Disposizione:

- nome target;
- immagine/preview se disponibile;
- coordinate;
- altezza;
- tempo restante;
- filtro.

Comportamento:

- tap su metrica apre dettaglio;
- long press copia/espande coordinate.

### Capture Progress

Disposizione:

- progress ring o barra orbitale;
- esposizioni valide/scartate se disponibili;
- tempo totale.

Animazioni:

- ogni esposizione valida aggiunge un piccolo segmento;
- segmento scartato non lampeggia, appare come notch attenuato.

### Quick Notes

Disposizione:

- pulsanti rapidi: seeing buono, vento, condensa, focus, nuvole, problema;
- campo testo grande.

Comportamento:

- note con timestamp automatico;
- dettatura vocale futura.

### Next Target

Disposizione:

- target successivo;
- countdown finestra;
- azione prepara.

### Session Warnings

Disposizione:

- stack massimo 2 warning;
- priorita alta visibile;
- altri in cassetto.

Regola:

- nessun warning deve bloccare la vista live se non e critico.

### End Session Review

Disposizione:

- riepilogo notte;
- target completati;
- rating risultati;
- note;
- cose da ricordare;
- prossima opportunita.

Animazioni:

- "missione completata" con linea timeline che si chiude;
- nessun fuoco d'artificio visivo.

Feedback aptico:

- successo morbido, due impulsi leggeri.

### Device Discovery

Disposizione:

- radar minimale centrale;
- dispositivi trovati sotto;
- modalita manuale sempre disponibile.

Gerarchia:

- stato ricerca;
- dispositivo;
- azione.

Animazioni:

- sweep radar lento 2.4s;
- quando trova Seestar, il punto si stabilizza e diventa pill selezionabile.

### Device Status

Disposizione:

- stato connessione grande;
- batteria, storage, modalita, temperatura;
- capability list;
- azioni disponibili.

Comportamento:

- funzioni non supportate visibili come non disponibili con spiegazione;
- nessun comando pericoloso in evidenza.

### Connection Help

Disposizione:

- passaggi brevi;
- check automatici;
- ultimo errore leggibile.

### Capabilities

Disposizione:

- tabella pulita: funzione, stato, protocollo, note.

Uso:

- principalmente per esperti.

### Alpaca Status

Disposizione:

- endpoint;
- device type;
- connected;
- latency;
- capabilities;
- log compatto.

Comportamento:

- modalita esperto;
- copia diagnostica.

### Manual Mode

Disposizione:

- selezione target manuale;
- timer;
- note;
- checklist.

Motivo:

- NovaSky deve restare utile anche senza connessione.

### Diagnostics

Disposizione:

- log tecnico;
- filtri;
- export diagnostica.

Regola:

- non mostrare in navigazione normale.

### Session List

Disposizione:

- lista cronologica;
- ogni sessione mostra data, sito, target top, rating, condizioni.

Comportamento:

- ricerca per target, sito, mese.

### Session Detail

Disposizione:

- timeline della notte;
- target;
- note;
- condizioni;
- risultati.

Gerarchia:

- memoria narrativa;
- dati;
- file/export.

### Capture Detail

Disposizione:

- target;
- parametri;
- rating;
- note;
- collegamenti file.

### Target History

Disposizione:

- target;
- tentativi precedenti;
- migliori condizioni;
- prossimo suggerimento.

Originalita:

- "Questo target ti riesce meglio con Luna sotto 30% e altezza sopra 45 gradi."

### Site History

Disposizione:

- localita;
- notti registrate;
- qualita media;
- migliori target per quel sito.

### Statistics

Disposizione:

- metriche sobrie;
- niente gamification eccessiva.

Metriche:

- ore osservate;
- target completati;
- migliori mesi;
- categorie preferite;
- condizioni piu produttive.

### Export Data

Disposizione:

- selezione intervallo;
- formati;
- privacy.

### Settings

Disposizione:

- sezioni semplici;
- nessun labirinto.

Impostazioni principali:

- profili telescopio;
- siti;
- tema;
- densita;
- modalita notte;
- unita;
- privacy;
- font grande;
- feedback aptico.

## 5. Mockup descrittivi

### Mockup: Tonight Briefing

Schermo verticale. Sfondo nero profondo, con un gradiente appena percettibile dal basso verso l'alto. In alto a sinistra il nome della localita, in alto a destra una pill piccola con stato Seestar. Sotto, una riga sottile mostra data e crepuscolo astronomico.

Al centro, grande ma non enorme, appare il verdetto: "Buona notte per nebulose". Sotto, in ambra, la finestra migliore: "22:20-01:35". A destra del verdetto, un indicatore NovaScore circolare da 0 a 100, con ciano se buono, ambra se medio, rosso se problematico.

La parte inferiore contiene tre metriche in riga: Luna, nuvole, condensa. Ogni metrica ha icona, valore, microspiegazione. La timeline e un binario sottile con fasce di oscurita e blocchi target. Il pulsante primario "Pianifica la notte" e in basso, largo, ma non urlato.

### Mockup: Target Detail

Header compatto con "M42 - Nebulosa di Orione". Subito sotto: tipo, magnitudine, dimensione apparente. Il centro e diviso tra framing preview e score spiegato. Il framing non e una foto decorativa: e una finestra tecnica con campo del Seestar, bordo sottile e target centrato.

La curva di visibilita occupa la parte successiva. La finestra migliore e evidenziata da una banda ambra trasparente. Sotto, tre consigli: durata, filtro, rischio Luna. Le note personali stanno in fondo, per non sporcare la decisione primaria.

### Mockup: Night Planner

La schermata sembra una console temporale. La notte e una linea orizzontale grande, da crepuscolo a alba. I target sono capsule sottili, non card grandi. Sopra la timeline ci sono bande meteo e Luna. Sotto, NovaSky propone una frase: "Sposta M31 prima delle 23:10: dopo entra nella zona lunare."

Il design deve far sentire che il tempo e un materiale manipolabile.

### Mockup: Live Session Dashboard

Interfaccia piu grande, piu spaziata. Target attuale in alto. Al centro un progress ring lento indica la sessione. Intorno, quattro dati: esposizioni, tempo restante, batteria, cielo. Il bottone Stop e presente ma protetto; le note rapide sono accessibili con un gesto dal basso.

Questa schermata deve essere usabile con guanti leggeri, occhi stanchi e luminosita bassa.

### Mockup: Device Discovery

Sfondo quasi nero. Al centro un cerchio radar sottilissimo. Ogni sweep non e fantascienza, e diagnostica calma. Quando il Seestar appare, il punto non esplode: si aggancia, mostra "S30 Pro trovato", e propone "Connetti". Sotto resta "Continua in manuale".

### Mockup: Logbook

Non e una galleria fotografica. E un diario tecnico elegante. Ogni sessione e una riga/card bassa con data, luogo, target e risultato. Aprendo una sessione, la notte viene ricostruita come racconto temporale: preparazione, target, note, condizioni, risultati.

## 6. Sistema animazioni

### Principi motion

- Durata breve per conferme: 120-180ms.
- Durata media per transizioni UI: 220-320ms.
- Durata lunga per apertura o contesto astronomico: 450-900ms.
- Easing: decelerazione morbida, niente rimbalzi giocosi.
- Riduci animazioni in modalita notte e accessibilita.

### Apertura app

Sequenza:

1. background appare in 300ms;
2. logo o titolo in 450ms;
3. briefing entra in 550ms;
4. timeline si disegna in 700ms;
5. azione primaria appare per ultima.

Scopo: dare sensazione di strumento che si inizializza.

### Navigazione

Transizioni:

- tra tab principali: crossfade + slide leggerissimo 12dp;
- verso dettaglio: contenuto sale da basso con continuita;
- ritorno: reverse veloce.

Regola: mai transizioni teatrali tra schermate operative.

### Zoom

Usi:

- framing preview;
- visibility chart;
- timeline planner.

Comportamento:

- zoom ancorato al punto del dito;
- inertia minima;
- doppio tap per reset;
- feedback aptico leggero al raggiungimento fit.

### Comparsa pannelli

Bottom sheet:

- entra dal basso in 260ms;
- sfondo si oscura del 20%, non blur pesante;
- handle visibile;
- snap a meta e pieno.

Dialog:

- solo per conferme critiche;
- scala 98%-100% + fade.

### Connessione Seestar

Stati:

- Searching: sweep lento.
- Found: punto si aggancia.
- Connecting: linea ciano pulsante dal telefono al device.
- Connected: breve glow verde/ciano, poi torna sobrio.
- Failed: bordo amber/rosso con messaggio operativo.

Feedback aptico:

- trovato: leggero;
- connesso: due impulsi brevi;
- fallito: medio singolo.

### Target aggiunto al piano

Animazione:

- la Target Card si comprime in una capsule;
- la capsule vola verso la timeline;
- la timeline si illumina nel punto corretto.

Durata: 450ms.

Scopo: far capire dove e stato aggiunto.

### Ottimizzazione piano

Animazione:

- i blocchi target si riallineano;
- i conflitti si dissolvono;
- il nuovo intervallo migliore si evidenzia per 1 secondo.

Feedback:

- leggero tick finale.

### Foto completata

Se l'app riceve evento o inserimento manuale:

- segmento progresso completato;
- micro glow verde;
- nota automatica "run completato".

Niente celebrazione eccessiva: l'astrofotografia e accumulo paziente.

### Missione completata

Alla fine sessione:

- timeline si chiude;
- i target completati ricevono check sottile;
- riepilogo emerge dal basso;
- haptic success morbido.

Scopo: gratificazione adulta, non gamification infantile.

### Warning

Animazione:

- warning entra dal basso o dalla zona relativa;
- bordo amber pulsa una sola volta;
- resta statico.

Regola: un warning che lampeggia continuamente peggiora la notte.

### Aggiornamenti live

- valori numerici cambiano con crossfade;
- grafici si aggiornano con interpolazione;
- nessun salto layout;
- se un dato peggiora, colore cambia gradualmente.

### Riduzione movimento

Opzione accessibilita:

- disattiva parallax;
- disattiva disegni progressivi;
- usa fade brevi;
- mantiene feedback aptico opzionale.

## 7. Accessibilita e uso over 60

### Principi

L'app deve essere utilizzabile da persone con piu di 60 anni, al buio, con vista affaticata, mani fredde e magari occhiali da lettura non sempre disponibili.

### Leggibilita

Regole:

- corpo minimo default 15sp;
- modalita Large 17sp;
- modalita Extra Large 19sp;
- numeri importanti almeno 20sp;
- contrasto sufficiente anche in tema rosso;
- non usare testo sottile per dati critici.

### Touch target

- minimo 48dp;
- consigliato 56dp per controlli live;
- spazio tra comandi critici;
- stop e delete mai vicini ad azioni comuni.

### Modalita notte

Deve includere:

- rosso profondo;
- luminosita ridotta;
- contrasto controllato;
- disattivazione glow superflui;
- grandi controlli;
- blocco tocchi accidentali.

### Riduzione complessita

Impostazione "Vista calma":

- meno metriche;
- spiegazioni piu leggibili;
- controlli principali grandi;
- dettagli avanzati collassati.

Impostazione "Esperto":

- dati completi;
- coordinate;
- log;
- diagnostica.

Le due impostazioni non devono essere "principiante vs esperto" in modo giudicante. Devono essere "calma vs strumento".

### Feedback multimodale

Ogni feedback importante deve avere:

- segnale visivo;
- testo;
- haptic opzionale.

Non affidarsi solo al colore.

### Errori

Messaggi chiari:

- cosa e successo;
- impatto;
- cosa fare.

Esempio:

"Seestar non trovato. Controlla di essere sulla sua rete Wi-Fi oppure continua in modalita manuale."

### Uso con occhiali e guanti

Durante Session:

- pulsanti piu grandi;
- gesture non obbligatorie;
- azioni principali accessibili con tap;
- long press solo come scorciatoia, mai unico modo.

### Affaticamento notturno

- evitare blocchi di testo lunghi;
- usare frasi brevi;
- evitare bianchi puri;
- evitare animazioni rapide;
- salvare automaticamente.

## 8. Originalita

### Cosa non copiare

Da Stellarium:

- non copiare la centralita della mappa planetario;
- non copiare il sovraccarico di layer celesti.

Da Seestar:

- non copiare la logica da app di controllo hardware;
- non copiare l'approccio "scegli oggetto e avvia" come unica esperienza.

Da SkySafari:

- non copiare la densita enciclopedica;
- non copiare l'estetica da planetario tecnico generalista.

### Identita NovaSky

NovaSky deve avere un'identita propria:

- la notte come timeline;
- il target come decisione;
- il Seestar come strumento integrato;
- il logbook come memoria;
- il cielo come materiale operativo.

### Elementi distintivi

#### Tonight Decision Stack

Una pila visiva di fattori:

- cielo;
- Luna;
- target;
- Seestar;
- rischio;
- azione.

Non una dashboard, ma una decisione spiegata.

#### NovaScore spiegabile

Il punteggio non e un numero magico. Ogni score si apre in contributi:

- altezza;
- buio;
- Luna;
- meteo;
- FOV;
- filtro;
- storico personale.

#### Time-first astronomy

La timeline della notte e piu importante della mappa del cielo. Questo rende NovaSky diversa: per un astrofotografo, il cielo e tempo.

#### Field Memory

NovaSky ricorda:

- cosa ha funzionato;
- dove;
- con quale Luna;
- con quale filtro;
- con quale modello.

Questa memoria rende l'app personale senza diventare social.

#### Quiet Premium

NovaSky non grida. La bellezza nasce da:

- scelte tipografiche;
- vuoto;
- dati precisi;
- transizioni morbide;
- palette controllata;
- rispetto del buio.

## Direzione finale

NovaSky deve essere l'app che un astrofotografo esperto apre con piacere perche sente che qualcuno ha capito davvero il suo modo di vivere la notte.

Non e una mappa stellare.
Non e un telecomando.
Non e un diario.

E la cabina di regia personale del suo Seestar.
