# 13 - Analisi del protocollo Alpaca/ASCOM

## Sintesi

ASCOM nasce come standard per interoperabilita tra software astronomico e dispositivi. Alpaca porta l'idea ASCOM su rete TCP/IP con API moderne, rendendo possibile il controllo cross-platform senza dipendere dal vecchio COM Windows.

## Perche conta per NovaSky

ZWO dichiara che Seestar S30 Pro supporta ASCOM Alpaca e compatibilita con software di terze parti come NINA. Questo crea una via piu sostenibile rispetto a protocolli proprietari non documentati.

## Opportunita

- Discovery standardizzata.
- Modello a capability.
- Possibile supporto a piu dispositivi in futuro.
- Separazione tra app e hardware.
- Maggiore credibilita presso utenti esperti.

## Limiti

- Va verificato quali device type Seestar espone.
- Non tutte le funzioni Seestar potrebbero essere mappate su Alpaca.
- S50 potrebbe non avere lo stesso livello di supporto.
- Le implementazioni reali possono essere incomplete.

## Architettura proposta

Creare un modulo `integration-alpaca` con:

- discovery client;
- device registry;
- capability mapper;
- telescope client;
- camera client se disponibile;
- error mapper;
- simulator/fake server per test.

## Mapping dominio

```text
Alpaca Device -> TelescopeDevice
Alpaca Capabilities -> DeviceCapabilities
Alpaca Status -> DeviceStatus
Alpaca Commands -> TelescopeCommand
```

## Funzioni candidate

- rilevamento endpoint;
- lettura informazioni device;
- connected/disconnected;
- posizione;
- slewing;
- tracking;
- goto se esposto;
- stato camera se esposto.

## UX

L'utente non deve vedere "Alpaca" come concetto principale, salvo modalita esperto. Deve vedere:

- "Connessione standard disponibile";
- "Compatibile con protocollo aperto";
- "Funzioni supportate: monitoraggio, goto, stato".

## Testing

- Test contro simulatori Alpaca.
- Test su S30 Pro reale.
- Test perdita rete.
- Test comandi durante sessione.
- Test concorrenza con app ufficiale.

## Decisione motivata

Alpaca e la strada preferibile per integrazione profonda perche riduce reverse engineering e aumenta sostenibilita commerciale. Il controllo proprietario va considerato solo come fallback o ricerca separata.

## Fonti

- ASCOM: https://ascom-standards.org/
- ZWO S30 Pro, Open Integration: https://www.zwoastro.com/product/seestar-s30-pro/
