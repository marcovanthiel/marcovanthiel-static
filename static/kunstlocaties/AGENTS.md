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
    └── fonts/          # Syne, Karla, IBM Plex Mono (Fontsource, SIL OFL)

scripts/kunstlocaties/  # buildscripts (npm, draaien lokaal)
├── build-map.js        # maakt assets/mapdata.js
├── fetch-fotos.js      # haalt de foto's op en maakt assets/fotos.js
├── foto-bron/          # eigen foto's: <catalogusnummer>.jpg gaat vóór Commons
└── package.json
```

## Beeldtaal

Richting "mozaïek", gekozen 28-08-2026. De wereld van Niki de Saint Phalle:
kobalt als grond (`--kobalt #16249B`), vermiljoen, goud en turquoise als
scherven, room als tekstkleur. Syne voor de koppen, Karla voor het lezen,
IBM Plex Mono voor alles wat label, nummer of meting is.

De pagina volgt de licht/donker-voorkeur van de bezoeker **niet**: het kobalt is
het ontwerp, en alle kleuren staan daarom expliciet in `:root`. Wie hier ooit een
lichte variant bij wil maken, moet het hele palet omzetten, niet een paar tokens.

## Foto's

Elke locatie heeft een fotovak. Staat er geen foto, dan komt er geen leeg gat maar
een mozaïekvlak in de vier kleuren, met het label "nog geen vrije foto" — vier
varianten, per locatie vast, zodat de catalogus niet dreunt.

Foto's worden opgehaald met `scripts/kunstlocaties/fetch-fotos.js`. Dat script:

- draait **op een machine met gewoon internet**; de sandbox waarin de agent werkt
  komt niet bij Wikimedia (proxy 403), dus dit is handwerk van Marco:
  `cd scripts/kunstlocaties && npm install && node fetch-fotos.js`
- zoekt eerst in `foto-bron/<nummer>.jpg` — eigen foto's gaan altijd voor
- zoekt daarna op Wikipedia in de taal van het land, dan Nederlands, dan Engels,
  en tot slot rechtstreeks op Wikimedia Commons
- aanvaardt **alleen vrije licenties** (CC0, PD, CC BY, CC BY-SA, GFDL, FAL) en
  alleen treffers waarvan de naam van de locatie ook echt in de titel voorkomt.
  Liever geen foto dan de verkeerde
- verkleint naar 760 px webp en schrijft maker, licentie en bronpagina naar
  `assets/fotos.js`; die credits staan onder elke foto op de pagina
- laat `scripts/kunstlocaties/foto-rapport.md` achter met wat gevonden is en wat niet

Opties: `--only=IT-34,FR-01`, `--force`, `--dry`.

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
  `npm i @fontsource-variable/syne @fontsource/karla @fontsource/ibm-plex-mono`
  en de woff2's uit `files/` kopiëren.
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
