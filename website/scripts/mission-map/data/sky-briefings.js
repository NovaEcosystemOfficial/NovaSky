/**
 * Sky Briefing — contenuti editoriali NovaSky per ogni target del catalogo.
 * Tono: briefing osservatorio, non enciclopedia.
 *
 * @typedef {object} SkyBriefingEntry
 * @property {string|null} observing - COSA STAI GUARDANDO (4–6 righe)
 * @property {string|null} seestar - COSA ASPETTARTI CON IL SEESTAR
 * @property {string|null} curiosity - CURIOSITÀ verificata
 * @property {{ ease: number, visualImpact: number, photogenic: number, beginnerFriendly: number }|null} levels
 * @property {boolean} complete - true se tutti i campi editoriali sono compilati
 */

/** @type {Record<string, SkyBriefingEntry>} */
export const SKY_BRIEFINGS = {
  ngc7000: {
    observing:
      "Stai osservando la Nebulosa Nord America, un vasto velo di idrogeno ionizzato nel Cigno. Il suo contorno ricorda il profilo del continente americano: coste, golfo e penisole disegnate dalla luce rossa dell'Hα. È uno dei campi più ampi e gratificanti del cielo estivo.",
    seestar:
      "Con S50 ottieni l'intera sagoma continentale in un unico campo; con S30 Pro emergono i bordi più netti e le zone più scure. Non aspettarti filamenti microscopici: il Seestar restituisce struttura ampia e contrasto morbido, ideale per una prima nebulosa estesa.",
    curiosity:
      "Il \"Golfo del Messico\" al centro non è un vuoto: è una nebulosa oscura, B 352, che assorbe la luce di fronte e crea l'illusione di un mare scuro dentro il continente di gas.",
    levels: { ease: 82, visualImpact: 91, photogenic: 94, beginnerFriendly: 88 },
    complete: true,
  },
  ic1396: {
    observing:
      "Stai osservando IC 1396, la Nebulosa Elefante nel Cefeo. Un ammasso giovane di stelle ha eroso e illuminato questa nube, modellando un proboscide curva che dà il nome al target. È un laboratorio visibile di formazione stellare, con globuli scuri sparsi nel campo.",
    seestar:
      "S50 mostra bene la proboscide e il gas circostante; S30 Pro aiuta a separare i globuli Bok più piccoli ai margini. Sessioni da 60–90 minuti con dual-band restituiscono un campo ricco, non i dettagli Hubble dei tronchi interni.",
    curiosity:
      "La proboscide è una struttura di gas compresso dalla radiazione delle stelle giovani dell'ammasso: in scala temporale astronomica, tra pochi milioni di anni potrebbe dissolversi del tutto.",
    levels: { ease: 78, visualImpact: 88, photogenic: 90, beginnerFriendly: 80 },
    complete: true,
  },
  m27: {
    observing:
      "Stai osservando M 27, la Nebulosa Manubrio nella Volpe. È ciò che resta di una stella simile al Sole che ha espulso i suoi strati esterni: un nucleo caldo al centro e una conchiglia di gas in espansione. È la nebulosa planetaria più luminosa dell'emisfero nord.",
    seestar:
      "Il Seestar la cattura con facilità: nucleo brillante, conchiglia ovale e struttura interna leggibile già in pochi minuti. S30 Pro accentua il contrasto tra l'anima e i lobi; non serve un filtro per un risultato soddisfacente.",
    curiosity:
      "La Manubrio si espande a circa 30 km/s. La luce che vedi oggi ha lasciato la nebulosa quando sulla Terra esistevano ancora i neandertal.",
    levels: { ease: 90, visualImpact: 86, photogenic: 85, beginnerFriendly: 92 },
    complete: true,
  },
  m57: {
    observing:
      "Stai osservando M 57, la Nebulosa Anello nella Lira. Una stella morente ha gettato un guscio sferico di gas che ci appare come un anello perfetto visto di taglio. È piccola ma ad alto contrasto: il classico test di trasparenza e messa a fuoco.",
    seestar:
      "L'anello appare netto e simmetrico anche con S50; S30 Pro può mostrare il nucleo centrale e lievi irregolarità sul bordo. È un target ideale per sessioni brevi: 30–45 minuti bastano per un risultato pulito.",
    curiosity:
      "Il gas dell'anello non è uniforme: spettroscopi hanno misurato strati con composizione diversa, testimonianza di getti più antichi e più recenti della stella progenitrice.",
    levels: { ease: 88, visualImpact: 84, photogenic: 82, beginnerFriendly: 90 },
    complete: true,
  },
  m13: {
    observing:
      "Stai osservando M 13, l'Ammasso Globulare di Ercole. Centinaia di migliaia di stelle sono legate dalla gravità in una sfera compatta, orbita intorno alla Via Lattea da miliardi di anni. È il globulare più famoso dell'emisfero nord e visibile anche a occhio nudo in cielo limpido.",
    seestar:
      "Il Seestar non risolve le stelle fino al nucleo come un telescopio da 300 mm, ma mostra un bozzolo luminoso con grana stellare ai bordi. S30 Pro migliora la risoluzione periferica; sessioni brevi senza filtro sono sufficienti.",
    curiosity:
      "Nel 1974 l'Arecibo Observatory trasmise verso M 13 il messaggio di Arecibo: il cluster era nel cielo al momento del test, a circa 22.000 anni-luce di distanza.",
    levels: { ease: 85, visualImpact: 80, photogenic: 74, beginnerFriendly: 86 },
    complete: true,
  },
  m31: {
    observing:
      "Stai osservando M 31, la Galassia di Andromeda. È la galassia spirale più vicina alla Via Lattea visibile a occhio nudo: un disco di miliardi di stelle inclinato verso di noi. La luce che entra nel tuo strumento ha viaggiato circa 2,5 milioni di anni.",
    seestar:
      "S50 restituisce un nucleo brillante e un alone morbido; S30 Pro può suggerire la curvatura del disco e qualche regione H II ai bracci. Non aspettarti bracci spirali netti come in una foto da rifrattore grande: il risultato Seestar è elegante ma integrato.",
    curiosity:
      "M 31 e la Via Lattea si avvicinano a circa 110 km/s: tra qualche miliardo di anni la collisione formerà una galassia ellittica gigante, spesso chiamata \"Milkomeda\".",
    levels: { ease: 70, visualImpact: 92, photogenic: 88, beginnerFriendly: 75 },
    complete: true,
  },
  m51: {
    observing:
      "Stai osservando M 51, la Galassia Whirlpool nei Cani da Caccia. Una galassia spirale frontale accoppiata con una compagna più piccola: la marea gravitazionale ha compresso il gas e acceso la formazione stellare lungo i bracci. È l'icona delle galassie interagenti.",
    seestar:
      "Con cielo trasparente S50 mostra nucleo e alone; S30 Pro può far emergere la debole struttura a spirale e la compagna NGC 5195. Servono sessioni più lunghe (90+ min) e bassa illuminazione lunare per un risultato convincente.",
    curiosity:
      "La prima evidenza di una \"spirale\" nel cielo profondo risale al 1845, quando il conte di Rosse osservò M 51 con il grande telescopio di Birr Castle in Irlanda.",
    levels: { ease: 62, visualImpact: 90, photogenic: 93, beginnerFriendly: 58 },
    complete: true,
  },
  m101: {
    observing:
      "Stai osservando M 101, la Galassia del Mulino a vento nell'Orsa Maggiore. Vista quasi di fronte, mostra bracci aperti e ampi campi di stelle giovani. È grande ma debole: la luce è distribuita su un'area vasta, quindi richiede cielo scuro e pazienza.",
    seestar:
      "Il Seestar cattura il nucleo e un alone esteso; i bracci spirali restano sottili e richiedono S30 Pro, molto tempo di integrazione e assenza di Luna. È un target da intenditori, non da prima serata.",
    curiosity:
      "M 101 ha ospitato nel 2023 la supernova SN 2023ixf, osservata amatorialmente appena dopo l'esplosione: una delle supernovae più seguite del decennio.",
    levels: { ease: 45, visualImpact: 78, photogenic: 80, beginnerFriendly: 40 },
    complete: true,
  },
  m81: {
    observing:
      "Stai osservando M 81, la Galassia di Bode nell'Orsa Maggiore. Spirale brillante, quasi frontale, spesso fotografata insieme alla compatta M 82. Il suo nucleo è intenso e il disco regolare: una delle galassie più accessibili del cielo boreale.",
    seestar:
      "S50 restituisce nucleo e disco morbido; S30 Pro migliora la definizione del bulge e può includere M 82 nel campo se inquadratura ampia. Sessioni da 60 minuti con cielo limpido danno un risultato solido.",
    curiosity:
      "M 81 e M 82 interagiscono gravitazionalmente: getti di gas e braccia deformati in M 82 sono l'eco di passaggi ravvicinati tra le due galassie.",
    levels: { ease: 68, visualImpact: 85, photogenic: 87, beginnerFriendly: 72 },
    complete: true,
  },
  m17: {
    observing:
      "Stai osservando M 17, la Nebulosa Omega nel Sagittario. Una regione H II a forma di cigno o omega, dove stelle massicce giovani ionizzano il gas circostante. È parte del ricchissimo piano galattico estivo, spesso visibile anche con binocolo.",
    seestar:
      "Dual-band consigliato: S50 mostra la sagoma completa; S30 Pro evidenzia la barra centrale e le zone più brillanti. Il risultato è un campo rosso-verde ricco, non la texture fine delle immagini professionali.",
    curiosity:
      "La parte più brillante, la \"testa del cigno\", contiene stelle O che hanno meno di un milione di anni: appena nate in scala cosmica.",
    levels: { ease: 72, visualImpact: 86, photogenic: 88, beginnerFriendly: 70 },
    complete: true,
  },
  m16: {
    observing:
      "Stai osservando M 16, la Nebulosa Aquila nel Serpente. Gas e polvere avvolgono l'ammasso aperto NGC 6611: qui Hubble ha immortalato i famosi Pilastri della Creazione. È una culla stellare ancora attiva, visibile come macchia nebulosa nel cuore della Via Lattea.",
    seestar:
      "S50 cattura la nebulosa estesa e l'ammasso; S30 Pro può suggerire le strutture verticali dei pilastri come regioni più scure. Non replicare la profondità Hubble: il Seestar offre composizione ampia e contrasto credibile.",
    curiosity:
      "I globuli dentro i pilastri hanno dimensioni di anni-luce: sono incubatrici dove la gravità lotta contro la radiazione delle stelle vicine.",
    levels: { ease: 65, visualImpact: 89, photogenic: 92, beginnerFriendly: 62 },
    complete: true,
  },
  m20: {
    observing:
      "Stai osservando M 20, la Nebulosa Trifida nel Sagittario. Tre lobi di emissione separati da polvere scura, più un ammasso aperto giovane incastonato nel gas. Il contrasto tra emissione rossa, riflessione blu e lane oscure la rende una delle composizioni più riconoscibili del cielo estivo.",
    seestar:
      "Target impegnativo: la divisione a tre lobi è visibile solo con cielo eccellente e S30 Pro. S50 restituisce comunque un campo nebuloso interessante con dual-band, ma le dark lane restano sottili.",
    curiosity:
      "Il nome \"Trifida\" viene dal latino trifidus, \"diviso in tre\": fu coniato dall'osservatore italiano Giovanni Battista Hodierna nel XVII secolo.",
    levels: { ease: 48, visualImpact: 87, photogenic: 90, beginnerFriendly: 45 },
    complete: true,
  },
  m8: {
    observing:
      "Stai osservando M 8, la Nebulosa Laguna nel Sagittario. Una vasta regione H II con un ammasso aperto al centro e una dark lane che ricorda una laguna. È uno dei gioielli del cielo estivo, visibile a occhio nudo come macchia nella Via Lattea.",
    seestar:
      "S50 riempie il campo con gas rosso e stelle dell'ammasso; S30 Pro migliora la laguna scura e i bordi. Sessioni da 60–90 minuti con dual-band producono un risultato spettacolare per il livello strumentale.",
    curiosity:
      "La \"laguna\" è polvere che oscura la nebulosa di fronte: senza quella lane, il campo apparirebbe quasi uniformemente luminoso.",
    levels: { ease: 74, visualImpact: 88, photogenic: 89, beginnerFriendly: 76 },
    complete: true,
  },
  ic1805: {
    observing:
      "Stai osservando IC 1805, la Nebulosa Cuore in Cassiopea. Un cuore rosso di idrogeno ionizzato alimentato da un ammasso aperto al centro, spesso fotografato in coppia con la Nebulosa Anima (IC 1848). È un classico target autunnale del cielo profondo boreale.",
    seestar:
      "Campo ampio: S50 può richiedere mosaic per il cuore intero; S30 Pro cattura la forma centrale con buon dettaglio. Dual-band essenziale; il risultato è morbido e romantico, non chirurgico.",
    curiosity:
      "Il cuore è così grande che la luce attraversando la nebulosa da un bordo all'altro impiega anni prima di uscire — un effetto di spessore optico misurabile.",
    levels: { ease: 70, visualImpact: 90, photogenic: 95, beginnerFriendly: 72 },
    complete: true,
  },
  ngc2244: {
    observing:
      "Stai osservando NGC 2244, il nucleo stellare della Nebulosa Rosetta nel Monoceros. Stelle giovani e calde hanno scavato una cavità nel gas, lasciando un bouquet di stelle al centro di un anello nebuloso più ampio. È uno dei campi più fotogenici del cielo invernale.",
    seestar:
      "S50 mostra l'ammasso e la nebulosa circostante; S30 Pro eccelle sul contrasto rosso e sulla cavità. Con dual-band e 60+ minuti ottieni una composizione da cartolina, anche se l'analogo di Hubble resta fuori portata.",
    curiosity:
      "Le stelle centrali hanno età stimata intorno ai 2 milioni di anni: appena accese quando la nebulosa ha iniziato a brillare.",
    levels: { ease: 68, visualImpact: 91, photogenic: 96, beginnerFriendly: 70 },
    complete: true,
  },
  m92: {
    observing:
      "Stai osservando M 92, un ammasso globulare in Ercole. Spesso eclissato dal più famoso M 13, è in realtà uno dei globulari più luminosi del cielo boreale, con stelle ben concentrate verso il centro. Compagno ideale quando M 13 è basso o già in missione.",
    seestar:
      "Risultato rapido e pulito: bozzolo granulato con S50, migliore risoluzione periferica con S30 Pro. Nessun filtro necessario; 30–45 minuti bastano per un globulare soddisfacente.",
    curiosity:
      "M 92 è uno dei globulari più antichi conosciuti, con età stimata intorno a 14 miliardi di anni — quasi quanto l'universo stesso.",
    levels: { ease: 84, visualImpact: 76, photogenic: 72, beginnerFriendly: 85 },
    complete: true,
  },
  m3: {
    observing:
      "Stai osservando M 3, un ammasso globulare nei Cani Venatici. Contiene centinaia di migliaia di stelle in una sfera ordinata, con un profilo di luminosità regolare dal centro ai margini. È uno dei globulari più facili da trovare dopo M 13 e M 92.",
    seestar:
      "Il Seestar lo mostra come un disco stellare compatto con texture ai bordi. S30 Pro aiuta a separare stelle nella regione esterna; sessioni brevi senza filtro sono sufficienti.",
    curiosity:
      "M 3 ospita oltre 250 variabili RR Lyrae, stelle \"metro standard\" usate dagli astronomi per calibrare le distanze nel vicino universo.",
    levels: { ease: 83, visualImpact: 75, photogenic: 70, beginnerFriendly: 84 },
    complete: true,
  },
  m97: {
    observing:
      "Stai osservando M 97, la Nebulosa Gufo nell'Orsa Maggiore. Una nebulosa planetaria con due macchie scure simili a occhi di gufo — in realtà regioni di gas più dense che assorbono la luce. È debole ma iconica, un classico test per filtri e trasparenza.",
    seestar:
      "Con UHC o OIII e S30 Pro la nebulosa appare ovale con le due \"pupille\" suggerite; S50 la rende più difficile. Servono sessioni lunghe e Luna assente: non promettere un gufo perfetto al primo tentativo.",
    curiosity:
      "Le due macchie non sono buchi: sono proiezioni di materiale più denso visto in controluce dalla stella centrale.",
    levels: { ease: 42, visualImpact: 72, photogenic: 78, beginnerFriendly: 38 },
    complete: true,
  },
  m33: {
    observing:
      "Stai osservando M 33, la Galassia del Triangolo. Terza galassia più grande del Gruppo Locale, vista quasi di faccia ma estremamente diffusa: la luce è diluita su oltre un grado di cielo. Richiede cielo scuro e campo ampio per apprezzarla.",
    seestar:
      "S50 può mostrare il nucleo e un alone debole; S30 Pro migliora leggermente ma non trasformerà M 33 in una spirale nitida. È uno dei target più difficili del catalogo Seestar: serve pazienza e condizioni ottimali.",
    curiosity:
      "M 33 è collegata alla Andromeda da un ponte di gas e stelle: resti di interazioni passate tra membri del Gruppo Locale.",
    levels: { ease: 38, visualImpact: 70, photogenic: 68, beginnerFriendly: 35 },
    complete: true,
  },
  m42: {
    observing:
      "Stai osservando M 42, la Nebulosa di Orione. La culla stellare più famosa del cielo: gas ionizzato avvolge le Trapezio, quattro stelle giovanissime che scolpiscono la nebulosa. Visibile a occhio nudo come stella sfocata sotto il Cinturino.",
    seestar:
      "Risultato immediato e spettacolare: S50 e S30 Pro catturano il Trapezio, la nebulosa rossa e il M 43 adiacente. Dual-band migliora il contrasto; anche sessioni brevi restituiscono un'immagine iconica.",
    curiosity:
      "La nebulosa di Orione è così giovane che le stelle al centro hanno meno di un milione di anni — hanno acceso la nebulosa mentre gli ominidi camminavano ancora sulla savana.",
    levels: { ease: 92, visualImpact: 95, photogenic: 94, beginnerFriendly: 95 },
    complete: true,
  },
  m45: {
    observing:
      "Stai osservando M 45, le Pleiadi nel Toro. Un ammasso aperto giovane avvolto in polvere di riflessione blu: le Sette Sorelle dell'antichità. È uno dei pochi oggetti deep-sky che brillano anche a occhio nudo come gruppo stellare.",
    seestar:
      "Campo molto ampio: le stelle principali entrano facilmente, la nebulosità di riflessione è debole e richiede S30 Pro e cielo scuro. S50 restituisce un ammasso aperto elegante, non sempre la veste blu delle foto professionali.",
    curiosity:
      "La polvere blu non emette luce propria: è polvere che riflette la luce delle stelle calde dell'ammasso, come neve sotto la luna piena.",
    levels: { ease: 88, visualImpact: 82, photogenic: 86, beginnerFriendly: 90 },
    complete: true,
  },
  b33: {
    observing:
      "Stai osservando B 33, la Nebulosa Testa di Cavallo in Orione. Non brilla: è polvere scura che traccia il profilo di un cavallo di fronte alla nebulosa rossa IC 434. È un oggetto di contrasto, non di emissione.",
    seestar:
      "Target difficile: la siluetta emerge solo con filtri Ha/OIII, sessioni lunghe e Luna bassa. S30 Pro ha più chance di S50; aspettati un contorno suggerito, non la silhouette nitida delle immagini da rifrattore.",
    curiosity:
      "La Testa di Cavallo è una bok globule: una nube densa abbastanza da proteggere il gas interno dalla radiazione che erode la nebulosa circostante.",
    levels: { ease: 35, visualImpact: 80, photogenic: 88, beginnerFriendly: 30 },
    complete: true,
  },
  ngc6992: {
    observing:
      "Stai osservando NGC 6992, il filamento orientale della Nebulosa Velo nel Cigno. È ciò che resta dell'esplosione di una stella massiccia avvenuta circa 10.000 anni fa: filamenti di gas in espansione a centinaia di km/s.",
    seestar:
      "Debole e diffuso: filtro OIII quasi obbligatorio, S30 Pro preferito, sessioni lunghe. S50 può mostrare un alone debole in cielo eccellente. Non aspettarti l'arco complesso visibile in telescopi grandi.",
    curiosity:
      "Al centro della nebulosa c'è una pulsar: il nucleo compatto della stella esplosa che ruota 11 volte al secondo e alimenta il gas circostante.",
    levels: { ease: 40, visualImpact: 76, photogenic: 82, beginnerFriendly: 38 },
    complete: true,
  },
  m104: {
    observing:
      "Stai osservando M 104, la Galassia Sombrero nella Vergine. Una spirale vista quasi di taglio, con un bulge luminoso e un disco oscurato da una banda di polvere — da qui il cappello messicano. È uno dei profili galattici più riconoscibili del cielo.",
    seestar:
      "S50 mostra nucleo e alone; S30 Pro può suggerire la banda di polvere come regione più scura attraverso il disco. Sessioni da 60–90 minuti con bassa Luna danno un risultato distintivo.",
    curiosity:
      "Il bulge della Sombrero ospita centinaia di ammassi globulari — molti più di quanti ne possieda la Via Lattea.",
    levels: { ease: 66, visualImpact: 88, photogenic: 91, beginnerFriendly: 64 },
    complete: true,
  },
  m78: {
    observing:
      "Stai osservando M 78, una nebulosa a riflessione in Orione. La luce delle stelle giovani si diffonde nella polvere circostante, creando un bagliore bluastro invece del rosso delle nebulose a emissione. È il prototipo delle nebulose riflettive.",
    seestar:
      "Più debole di M 42 nello stesso cielo: serve cielo scuro, S30 Pro e sessioni lunghe senza Luna. S50 mostra un alone compatto; il dettaglio fine resta elusivo ma il campo è affascinante in composizioni wide.",
    curiosity:
      "M 78 è parte del complesso di Orione B: stelle ancora nascoste nella polvere stanno accendendo la nebulosa senza ionizzarla completamente.",
    levels: { ease: 44, visualImpact: 74, photogenic: 76, beginnerFriendly: 42 },
    complete: true,
  },
  saturn: {
    observing:
      "Stai osservando Saturno, il sesto pianeta dal Sole. Un gigante gassoso con anelli di ghiaccio e polvere visibili anche da modesti strumenti. La sua posizione cambia lungo l'eclittica: stasera è calcolata in tempo reale dal motore NovaSky.",
    seestar:
      "Modalità planetaria: S50 e S30 Pro restituiscono disco e anelli in pochi secondi di integrazione. Non aspettarti divisione di Cassini nitida come in un dobson 200 mm: il Seestar eccelle in outreach e registrazione rapida.",
    curiosity:
      "Gli anelli di Saturno sono spessi solo circa 10 metri in media, ma si estendono per centinaia di migliaia di chilometri — così sottili che, visti di taglio, scompaiono quasi del tutto ogni 15 anni.",
    levels: { ease: 95, visualImpact: 93, photogenic: 90, beginnerFriendly: 98 },
    complete: true,
  },
  m1: {
    observing:
      "Stai osservando M 1, la Nebulosa Crab nel Toro. Resti luminosi della supernova osservata nel 1054 d.C.: un guscio di gas in espansione alimentato oggi da una pulsar al centro. È il prototipo delle nebulose a supernova.",
    seestar:
      "S50 mostra un alone compatto e fibroso; S30 Pro migliora i filamenti esterni con UHC opzionale. Sessioni da 45–60 minuti: il risultato è suggestivo, non la rete intricata delle foto Hubble.",
    curiosity:
      "Cronache cinesi del 1054 descrissero una \"stella ospite\" visibile di giorno per settimane — la stessa esplosione che vediamo oggi come nebulosa.",
    levels: { ease: 68, visualImpact: 83, photogenic: 85, beginnerFriendly: 65 },
    complete: true,
  },
};

/** @returns {SkyBriefingEntry} */
export function getSkyBriefing(targetId) {
  return (
    SKY_BRIEFINGS[targetId] ?? {
      observing: null,
      seestar: null,
      curiosity: null,
      levels: null,
      complete: false,
    }
  );
}

/** Statistiche per report e debug. */
export function getBriefingReport() {
  const ids = Object.keys(SKY_BRIEFINGS);
  const complete = ids.filter((id) => SKY_BRIEFINGS[id].complete);
  const incomplete = ids.filter((id) => !SKY_BRIEFINGS[id].complete);
  return { total: ids.length, complete, incomplete };
}
