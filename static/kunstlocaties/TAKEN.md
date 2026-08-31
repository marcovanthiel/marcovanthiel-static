# Openstaande punten — /kunstlocaties

Stand 30 augustus 2026. Afgeronde punten weghalen, niet afvinken; dit is een
werklijst, geen logboek. Het besluitenspoor staat in `AGENTS.md` en `CLAUDE.md`.

## 1. Eén locatie zonder foto

| Nr. | Locatie | Waarom het niet lukte |
|---|---|---|
| IT-26 | Fondazione Bonotto, Molvena | Cloudflare-challenge blokkeert ook hotlinks |

Oplossing: een eigen foto in `scripts/kunstlocaties/foto-bron/IT-26.jpg` en dan
`npm run fotos -- --only=IT-26 --force`, of een aangewezen beeld via
`haal-url.js`. Tot die tijd toont hij het gearceerde vlak, en dat is een nette
uitkomst — geen leeg gat, geen verzinsel. (De andere vier van 30-8 zijn 31-8
gevuld met promobeelden van officiële partijen die Marco aanwees.)

## 2. Hondenbeleid

Bij 89 van de 217 is het hondenbeleid onbekend. Dat is eerlijk zo opgeschreven —
`onbekend` betekent onbekend, niet nee. Navragen loont alleen bij de plekken die
op een reisroute staan; niet als bulkklus doen.

## 3. Openingstijden van de 27 "let op"-adressen

Die staan als onzeker in `data.js`. Voor vertrek naar een streek de betreffende
adressen bellen en `pr` bijwerken. Ook hier: per reis, niet in bulk.
