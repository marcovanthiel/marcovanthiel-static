# Openstaande punten — /kunstlocaties

Stand 30 augustus 2026. Afgeronde punten weghalen, niet afvinken; dit is een
werklijst, geen logboek. Het besluitenspoor staat in `AGENTS.md` en `CLAUDE.md`.

## 1. Vijf locaties zonder foto

| Nr. | Locatie | Waarom het niet lukte |
|---|---|---|
| IT-26 | Fondazione Bonotto, Molvena | Cloudflare-challenge |
| IT-27 | La Marrana arteambientale, Ameglia | site heeft alleen minifoto's |
| IT-44 | Casa Dipinta, Todi | geen betrouwbare eigen site |
| IT-64 | Castello Incantato, Sciacca | geen betrouwbare eigen site |
| ES-06 | Museo Vostell Malpartida | site weigert verkeer per regio |

Oplossing per geval: een eigen foto in `scripts/kunstlocaties/foto-bron/<nr>.jpg`
en dan `npm run fotos -- --only=<nr> --force`. Marco heeft van een deel van deze
plekken zelf beeld in het Polarsteps-archief. Tot die tijd tonen ze het
gearceerde vlak, en dat is een nette uitkomst — geen leeg gat, geen verzinsel.

## 2. Monospace als broodletter

Richting B zet de hele lopende tekst in IBM Plex Mono. Dat hoort bij de richting,
maar 217 beschrijvingen in monospace leest zwaarder dan in een gewone
broodletter. Openstaande vraag aan Marco: zo laten, of alleen `.waarom` en
`.lede` omzetten naar een smalle grotesk en Plex houden voor labels, nummers,
`.praktisch` en de meta-kolom. Niet doen zonder dat hij het gezien heeft.
Stand 31-8-2026: twee vergelijkingsbeelden (huidig-plex-mono.png en
proef-grotesk.png, proef = IBM Plex Sans Condensed) staan in Marco's
Downloads-map; wacht op zijn oordeel.

## 3. Hondenbeleid

Bij 89 van de 217 is het hondenbeleid onbekend. Dat is eerlijk zo opgeschreven —
`onbekend` betekent onbekend, niet nee. Navragen loont alleen bij de plekken die
op een reisroute staan; niet als bulkklus doen.

## 4. Openingstijden van de 27 "let op"-adressen

Die staan als onzeker in `data.js`. Voor vertrek naar een streek de betreffende
adressen bellen en `pr` bijwerken. Ook hier: per reis, niet in bulk.
