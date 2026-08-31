# /kunstlocaties — werkinstructie

Verlanglijst van kunstparken, land art, kunstenaarstuinen, Gesamtkunstwerken en
andere plekken waar de locatie zelf het werk is, in elf Europese landen.
Gemaakt 28-08-2026. Kale static, geen Hugo-content, geen build.

## Bestanden

```
static/kunstlocaties/
├── index.html          # markup; laadt fonts.css, styles.css, data.js, mapdata.js, fotos.js, app.js
├── AGENTS.md           # dit bestand
├── foto/               # één foto per locatie, <catalogusnummer>.webp, 760 px breed
└── assets/
    ├── data.js         # window.KUNSTLOCATIES = [...] — de 217 locaties
    ├── mapdata.js      # window.KAARTDATA = {...} — gegenereerd, niet met de hand bewerken
    ├── fotos.js        # window.KUNSTFOTOS = {...} — gegenereerd, credits per foto
    ├── app.js          # kaart, filters, zoeken, catalogus; geen afhankelijkheden
    ├── styles.css      # palet en typografie
    ├── fonts.css       # @font-face voor de drie self-hosted families
    └── fonts/          # Anton, IBM Plex Mono (Fontsource, SIL OFL)

scripts/kunstlocaties/  # buildscripts (npm, draaien lokaal)
├── build-map.js        # maakt assets/mapdata.js
├── fetch-fotos.js      # haalt de foto's op en maakt assets/fotos.js
├── foto-bron/          # eigen foto's: <catalogusnummer>.jpg gaat vóór Commons
└── package.json
```

## Beeldtaal

Richting "machine", gekozen 29-08-2026 (na een eerdere ronde in de mozaïekstijl
van Niki de Saint Phalle, die te druk uitpakte). De wereld van Tinguely: zwart
staal (`--zwart #0E0E0D`), één vermiljoen (`--rood #D63B12`), gebroken wit voor
de tekst, en verder alleen grijstinten. Niets is rond, overal ligt een raster,
en het mechaniek is zichtbaar: millimeterpapier achter de pagina, een liniaal
langs de kaartrand, een draaiend tandwiel naast de titel.

Anton voor de koppen — smal, industrieel, in kapitalen. Sinds 31-8-2026
(besluit Marco): de beschrijvende tekst (`.lede`, `.waarom`) in **IBM Plex Sans
Condensed** (smalle grotesk uit dezelfde familie, self-hosted), al het andere —
labels, nummers, `.praktisch`, de meta-kolom, zoek en filters — in IBM Plex
Mono. Zo blijft het mechanische karakter staan zonder dat 217 beschrijvingen in
monospace gelezen hoeven te worden.

De pagina volgt de licht/donker-voorkeur van de bezoeker **niet**: het zwart is
het ontwerp, en alle kleuren staan expliciet in `:root`.

## Foto's

Elke locatie heeft een fotovak. Staat er geen foto, dan komt er geen leeg gat maar
een gearceerd vlak met het label "nog geen vrije foto".

Foto's komen sinds 28-8-2026 **van de eigen website van elke locatie**
(promobeeld, conform de beeldregel: promobeeld van een aanbevolen partij mag,
met credit en link; de credits staan in `assets/fotos.js` en onder elke foto).
Het script daarvoor is `scripts/kunstlocaties/fetch-webfotos.js` (og:image →
twitter:image → grootste echte afbeelding; eigen foto's in `foto-bron/` gaan
vóór; opties `--only`, `--force`, `--dry`). Het oudere Commons-script
`fetch-fotos.js` bestaat nog maar is niet meer de standaardroute.
Kiest og:image het verkeerde beeld (logo, affiche, portret, andere plek — dat
bleek bij de schouw van 31-8-2026 bij 16 locaties zo), zoek dan zelf een beeld
op de eigen site en haal het binnen met
`node haal-url.js <id> <beeld-url> <bronpagina>` (zelfde maat- en creditregels).

Stand na de vulronde van 28-8-2026 en de herkansing van 31-8-2026: **212 van de
217 met foto** (IT-19 Dalle Nogare lukte op 31-8 alsnog; de server was weer
bereikbaar). Vijf kunnen niet van de eigen site: ES-06 Museo Vostell (site
weigert verkeer per regio), IT-64 Castello Incantato en IT-44 Casa Dipinta
(geen betrouwbare eigen site), IT-26 Bonotto (Cloudflare-challenge),
IT-27 La Marrana (site heeft alleen minifoto's).
Die tonen het gearceerde vlak; een eigen foto in `foto-bron/<id>.jpg` lost ze op.
Alle 212 foto's zijn 31-8-2026 visueel geschouwd; de 16 vervangingen en de
bewust gehandhaafde grensgevallen staan in `scripts/kunstlocaties/foto-web-rapport.md`.
IT-01 komt bij uitzondering van PromoTurismoFVG (eigen bron ligt plat).
Bij de vulronde zijn ook dode site-URL's in `data.js` gerepareerd
(o.a. Middelheim, Scarzuola, Glaskasten Marl, Demeure du Chaos, Villa Müller).

## De kaart

Geen kaartdienst, geen tiles, geen Leaflet: de kaart is één SVG die uit Natural
Earth (`world-atlas`, 1:50 m) wordt gegenereerd en met de pagina meekomt.
Dat houdt de CSP op `'self'`, scheelt externe verzoeken en levert een plaat op
die in de huisstijl van de pagina staat in plaats van in die van een tegelserver.

- **Projectie** Mercator, venster −11,5 tot 19,5 lengte en 34,8 tot 54,2 breedte,
  uitgerekend naar een tekenvlak van 1000 × 890 eenheden. Zoomen en schuiven zijn
  een affiene transformatie op die eenheden; er wordt niet herprojecteerd.
- **Vereenvoudiging** Douglas-Peucker in schermruimte: tolerantie 0,45 voor de elf
  landen zelf, 0,9 voor de buren, en ringen onder een minimumoppervlak vallen weg.
  Zo blijft `mapdata.js` rond de 150 kB in plaats van een megabyte.
- **Stippen** staan buiten de schaal: elke stip krijgt `scale(1/k)`, zodat ze bij
  elk zoomniveau even groot blijven. Hetzelfde geldt voor de arcering
  (`patternTransform`) en voor het richtkruis van de gekozen locatie.
- **Labels** verschijnen vanaf 3,2× en worden gefilterd op botsing: wie eerst komt
  (de kern voorop) houdt zijn label. Zonder die filter is het Ruhrgebied onleesbaar.
- **Coördinaten** staan per record in `data.js` als `ll: [lengte, breedte]`, op
  plaatsniveau. Ze zijn gecontroleerd met een point-in-polygon-test tegen de
  landsgrenzen: elke stip ligt in het juiste land. Acht locaties aan de kust
  (Venetië, Ancona, Porquerolles, Cap-Ferrat, Cascais) vallen in de vereenvoudigde
  kustlijn net in zee — dat klopt, de grens is grof, de coördinaat niet.

Kaartdata opnieuw bouwen na een wijziging in `ll`:

```
cd scripts/kunstlocaties && npm install && node build-map.js
```

## Uitgangspunten

- **Geen build, geen CDN, geen inline script of style.** Daardoor past de pagina
  binnen de site-brede CSP (`script-src 'self'`) en is er in `static/_headers`
  géén eigen CSP-blok nodig — alleen een cache-regel voor de fonts.
- **Self-hosted fonts.** Google Fonts is voor de rest van de site wel toegestaan
  in de CSP, maar hier bewust lokaal, net als bij /china2027. Vervangen gaat via
  `npm i @fontsource/anton @fontsource/ibm-plex-mono` en de woff2's uit
  `files/` kopiëren.
- **Deelbare URL.** Filters staan in de querystring, bijvoorbeeld
  `/kunstlocaties/?land=Italië&kern=1`. `app.js` leest die bij het laden.

## Data bijwerken

Elk record in `data.js` heeft:

| veld | betekenis |
|---|---|
| `n` | naam van de plek |
| `p` | plaats |
| `land`, `reg` | land en regio; de volgorde in het bestand bepaalt de volgorde op de pagina |
| `t` | soort: Beeldenpark, Land art, Gesamtkunstwerk, Kunstenaarshuis, Privécollectie, Industrieel erfgoed, Architectuur, Kunst in de openbare ruimte |
| `w` | wie of wat: kunstenaar, architect, oprichter, jaar |
| `x` | waarom het bijzonder is (één of twee zinnen) |
| `pr` | praktisch: openingstijden, reservering, prijs |
| `u` | officiële URL |
| `h` | honden: `ja`, `nee` of `?` (onbekend, níét nee) |
| `s` | seizoen: `jaarrond`, `seizoen`, `afspraak` of `let op` |
| `kern` | `true` voor de vijfentwintig die eruit springen |
| `ll` | `[lengte, breedte]` in graden, voor de kaart |
| `id` | catalogusnummer, `IT-01` tot `CZ-09`; wordt ook het anker in de URL |

Na een wijziging de `?v=` in `index.html` ophogen, zodat de 5-minutencache van
Cloudflare geen oude `data.js` blijft serveren.

## Bron

Het volledige dossier met dezelfde inhoud in tekstvorm staat in het
Claude-project **Reizen**, onder `reizen/kunstlocaties-midden-en-zuid-europa.md`.
Dat is de plek om inhoudelijke wijzigingen eerst te maken; deze pagina is de
publieke weergave ervan.

## Waar wat staat

- Openstaand werk: `TAKEN.md` in deze map
- Volgorde van bouwen en wat een sandbox niet kan: `docs/kunstlocaties-draaiboek.md`
- De huisstijl los van deze subsite: `docs/webstijl-machine.md`
- Slash-commando's voor het terugkerende werk: `.claude/commands/`

## Backlog

- [ ] `fetch-fotos.js` draaien en het rapport nalopen: elke foto moet echt bij
      de locatie horen, en de credits moeten kloppen
- [ ] Eigen foto's uit het Polarsteps-archief toevoegen voor de plekken waar
      geen vrije foto van bestaat
- [ ] Hondenbeleid van de 89 onbekende plekken navragen waar het ertoe doet
- [ ] Openingstijden van de 27 "let op"-adressen bevestigen voor een reis
- [ ] Coördinaten van een handvol gehuchten nalopen; ze zijn op plaatsniveau
      gezet en alleen op land gecontroleerd, niet op adres
- [ ] Overwegen: reisroutes over de kaart, zodat clusters een volgorde krijgen
