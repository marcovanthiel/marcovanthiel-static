# Webstijl "machine" — marcovanthiel.nl

De huisstijl van `/kunstlocaties`, vastgelegd zodat een volgende subsite er niet
opnieuw over hoeft te onderhandelen. Gekozen 29 augustus 2026, na een ronde in
een uitbundige mozaïekstijl die in de uitvoering te druk uitpakte.

De richting is Tinguely: zwart staal, één vermiljoen, blootliggend mechaniek.
Niets rond, overal een raster, het meetwerk zichtbaar.

## Kleur

| Token | Waarde | Waarvoor |
|---|---|---|
| `--zwart` | `#0E0E0D` | de grond |
| `--paneel` | `#131311` | balken, cartouche, invoervelden |
| `--plaat` | `#1A1A17` | vlakken op de kaart |
| `--diep` | `#080807` | het diepste vlak: zee, fotovak |
| `--wit` | `#F0F0EA` | koppen en nadruk |
| `--tekst` | `#D8D5CC` | lopende tekst |
| `--mat` | `#A8A49A` | tweede laag |
| `--vaag` | `#7A776E` | labels, credits |
| `--rood` | `#D63B12` | het enige accent |
| `--rood-diep` | `#8E2A0F` | achtergrond van een waarschuwing |
| `--lijn` | `#3A3730` | kaders |
| `--raster` | `#23221E` | millimeterpapier, scheidingslijnen |

Eén accent, en het is vermiljoen. Wie een tweede accentkleur nodig denkt te
hebben, heeft meestal een hiërarchieprobleem. Statuskleuren bestaan hier niet:
verschil zit in lijnstijl (doorgetrokken, gestreept) en in vulling.

## Type

- **Anton** voor koppen, in kapitalen, `letter-spacing: .012em`,
  `line-height: .88`. Smal en industrieel. Alleen op formaat 20 px en groter.
- **IBM Plex Mono** voor al het andere: lopende tekst, labels, nummers, meta.
  400 voor tekst, 500 voor nadruk.
- Self-hosted uit Fontsource, latin + latin-ext (Tsjechische en Poolse namen).
  Geen Google Fonts: de site-CSP staat op `'self'`.

Let op: mono als broodletter leest zwaarder dan een gewone letter. Dat is een
bewuste prijs van deze richting. Voor een subsite met veel lange tekst is de
afspraak: lopende tekst mag naar een smalle grotesk, Plex blijft voor labels,
nummers en praktische regels.

## Vorm

- **Geen ronde hoeken.** Nergens, ook niet op knoppen en invoervelden.
- **Haarlijnen** in plaats van vlakken: `1px solid var(--lijn)`, gestreept waar
  iets voorlopig of onzeker is.
- **Millimeterpapier** achter de pagina: raster van 40 px in `--raster`, vast
  gepositioneerd, `pointer-events: none`.
- **Meetwerk tonen**: liniaalstreepjes langs de rand van een kaart of figuur,
  langer op elke vijfde. Een schaalbalk als er afstand in het spel is.
- **Eén bewegend onderdeel** per pagina, niet meer: het tandwiel naast de titel
  draait in 26 seconden rond. Alle beweging uit bij `prefers-reduced-motion`.
- Markeringen zijn vierkanten, geen bollen. Gevuld = belangrijk, open = de rest.

## Licht en donker

Deze stijl kent geen lichte variant en volgt de voorkeur van de bezoeker niet.
Het zwart is het ontwerp. Alle kleuren staan daarom expliciet in `:root`; er is
geen `@media (prefers-color-scheme)`-blok en dat is opzet, geen omissie.

## Techniek

- Alle CSS en JS in externe bestanden, fonts en beeld op het eigen domein. Dan
  volstaat de site-brede CSP (`script-src 'self'`, `img-src 'self' data:`) en is
  er geen eigen blok in `static/_headers` nodig — alleen cacheregels.
- Cachebusters met `?v=JJJJMMDD<letter>` op elk bestand dat kan veranderen.
- Filters in de querystring, zodat een selectie deelbaar is.
- Geen framework, geen buildstap voor de pagina zelf. Buildscripts alleen voor
  data die uit een bron komt (kaart, foto's).

## Waar het staat

Werkende toepassing: `static/kunstlocaties/`. Beslissingen en datamodel:
`static/kunstlocaties/AGENTS.md`. Volgorde van bouwen:
`docs/kunstlocaties-draaiboek.md`.
