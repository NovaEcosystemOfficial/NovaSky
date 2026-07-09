# 01 - Visione del progetto

## Sintesi

NovaSky deve diventare la migliore companion app Android per utilizzatori di Seestar S50 e Seestar S30 Pro. Non deve replicare Stellarium, SkySafari o l'app ufficiale Seestar: deve colmare lo spazio tra planetario, planning, decisione astrofotografica, controllo locale e memoria delle sessioni.

## Posizionamento

NovaSky e un assistente premium per astrofotografi Seestar:

- aiuta a scegliere il target giusto per la notte giusta;
- trasforma meteo, Luna, visibilita, altezza, filtro e durata in una decisione chiara;
- accompagna la sessione con checklist, connessione locale e monitoraggio;
- conserva log, risultati, note e preferenze dell'utente;
- resta utile anche offline, quando il cielo e il campo non perdonano connessioni fragili.

## Perche non copiare Stellarium

Stellarium e eccellente come simulatore del cielo. NovaSky deve invece essere orientata all'azione. L'utente Seestar non chiede solo "dov'e M31?", ma:

- vale la pena fotografarla stasera da qui?
- per quanto tempo?
- con S50 o S30 Pro quale inquadratura ottengo?
- la Luna rovina il contrasto?
- devo usare filtro dual-band?
- quando inizia la finestra migliore?
- cosa posso fare se arrivano nuvole?

La scelta di prodotto e quindi: meno enciclopedia, piu decisione.

## Utente primario

Astrofotografo esperto, anche con 30+ anni di esperienza, che apprezza controllo, precisione, rispetto del mestiere e strumenti non infantili. NovaSky deve essere elegante ma non semplificata in modo paternalistico.

## Utente secondario

Utilizzatore Seestar evoluto o principiante ambizioso, che vuole migliorare rapidamente senza dover studiare dieci app diverse.

## Promessa

"Prima di uscire sai cosa fotografare. Durante la sessione sai cosa sta succedendo. Dopo la sessione sai cosa hai imparato."

## Criteri di successo

- L'utente apre NovaSky prima dell'app Seestar per pianificare.
- L'utente la riapre durante la notte per prendere decisioni operative.
- L'utente conserva in NovaSky il diario delle sessioni.
- L'app e considerata premium anche senza grafica spettacolare: la qualita si percepisce da precisione, calma e affidabilita.

## Decisioni motivate

- Android-first: il Play Store e l'obiettivo commerciale dichiarato; Kotlin/Compose permette una UX moderna e mantenibile.
- Companion, non sostituto totale: il controllo Seestar puo dipendere da firmware, protocollo e limiti ufficiali; NovaSky deve essere utile anche quando il controllo diretto non e disponibile.
- Offline-first: molte sessioni avvengono fuori casa o con Wi-Fi dedicata al telescopio; l'app non puo dipendere sempre da internet.
- Premium utility: evitare estetica "spaziale giocattolo"; usare densita informativa, gerarchie chiare e interazioni rapide.

## Idee distintive

1. **NovaScore**: punteggio osservativo/astrofotografico specifico per Seestar, calcolato su target, quota, Luna, meteo, stagione, filtro, campo inquadrato e modello S50/S30 Pro.
2. **Tonight Briefing**: briefing operativo della serata in 60 secondi.
3. **Session Autopilot Planner**: sequenza di target ordinata per finestre temporali, non per preferenze astratte.
4. **Field Memory**: diario intelligente che ricorda cosa ha funzionato con quel cielo, quel luogo e quel telescopio.
5. **Framing for Seestar**: anteprima campo reale per S50 e S30 Pro, con suggerimenti di mosaico e crop.

## Fonti

- ZWO S50: https://www.zwoastro.com/product/seestar-s50/
- ZWO S30 Pro: https://www.zwoastro.com/product/seestar-s30-pro/
- Stellarium: https://stellarium.org/
