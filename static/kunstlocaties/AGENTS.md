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
    ├── data.js         # window.KUNSTLOCATIES = [...] — de 303 locaties
    ├── mapdata.js      # window.KAARTDATA = {...} — gegenereerd, niet met de hand bewerken
    ├── fotos.js        # window.KUNSTFOTOS = {...} — gegenereerd, credits per foto
    ├── app.js          # kaart, filters, zoeken, catalogus; geen afhankelijkheden
    ├── styles.css      # palet en typografie (reismagazine, petrol + pruim)
    ├── fonts.css       # @font-face voor de self-hosted families
    └── fonts/          # Newsreader + Schibsted Grotesk (variabel, woff2);
                        #   Anton + IBM Plex (oude machine-stijl) staan hier nog

scripts/kunstlocaties/  # buildscripts (npm, draaien lokaal)
├── build-map.js        # maakt assets/mapdata.js
├── fetch-fotos.js      # haalt de foto's op en maakt assets/fotos.js
├── foto-bron/          # eigen foto's: <catalogusnummer>.jpg gaat vóór Commons
└── package.json
```

## Beeldtaal

**Editorial reismagazine, kleurstelling petrol + pruim** — door Marco gekozen op
11-9-2026 uit acht ontwerp- en acht kleurvoorstellen. Dit **verving** voor deze
subsite de oude machine-stijl (Anton / millimeterpapier / vermiljoen); die was
niet langer heilig, Marco wilde er juist van af. De pagina leest als een tijdschrift:
kickers, genummerde rubrieken, standfirsts, folio's, hairlines en register-/
cataloguscodes, gegoten over de functionele catalogus met kaart en filters.

Kleurtokens (`:root` in `styles.css`), één vaste donkere wereld:

| Token | Waarde | Waarvoor |
|---|---|---|
| `--papier` | `#072A31` | petrol-grond |
| `--papier2` | `#0D3B44` | panelen, secties naar voren |
| `--diep` | `#04191E` | kaartvlak |
| `--inkt` | `#EAF0F0` | gebroken wit, hoofdtekst |
| `--gedempt` | `#98AFB1` | meta, secundair |
| `--accent` | `#D89AD0` | lichte pruim / orchidee |
| `--lijn` / `--lijn-zwaar` | `rgba(234,240,240,.26)` / `.64` | hairlines |

Contrast overal minimaal 4,5:1 (laagste paar `--gedempt`/`--papier2` = 5,27:1).
De orchidee is accenttekst op de donkere grond en fungeert als vulkleur **alleen**
met donkere (`--papier`) opdruk: nooit lichte tekst op orchidee (dat haalt 4,5:1
niet). Actieve filterchips en het logeermerkje = orchidee met `--papier`-opdruk.

Type, twee variabele families (self-hosted woff2, geen Google Fonts):

- **Newsreader** (serif, `200 800`, normaal + cursief) voor koppen, standfirsts,
  body en de catalogustekst (`.waarom`, `.logeren`); de cursief draagt de
  accenten, citaten en de N&deg;-folio.
- **Schibsted Grotesk** (sans, `400 900`) voor kickers, meta, labels, cijfers
  (`.nummer-index`, de statpillen), chips, nav en de kaartlabels.
- Let op: de fractionele gewichten (420, 440, 520 ...) uit het ontwerp renderen
  alleen met de variabele fonts juist; geen statische instanties gebruiken.

De pagina volgt de licht/donker-voorkeur van de bezoeker **niet**: de petrol is
het ontwerp, en alle kleuren staan expliciet in `:root`.

Nog steeds geldig (functioneel):

- Het filterregister is op schermen tot 760 px ingeklapt achter de knop
  "filters en zoeken" (`#reg-toggle`, teller van actieve filters ernaast);
  met een filter in de querystring opent het vanzelf.
- De statpillen voor logeren, architectuur en met-foto zijn knoppen die het
  bijbehorende filter aan- en uitzetten; `syncFilters()` in `app.js` houdt
  chips, pillen en tellers gelijk.

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

Stand 10-9-2026 (na de fotoronde van die avond): **302 van de 303 met foto**.
Alleen FR-51 Villa Le Rêve heeft er geen — de gemeentepagina van Vence, de
enige officiële bron, bevat geen bruikbaar beeld; de arcering blijft staan.
De 86 nieuwe logeeradressen zijn dezelfde avond geschouwd; 20 og:image-keuzes
zijn handmatig vervangen en vijf lastige sites zijn via het
schermafdruk-patroon binnengehaald (details en grensgevallen in
`scripts/kunstlocaties/foto-web-rapport.md`).
Stand 31-8-2026: alle toen bestaande 217 met foto. Na de vulronde van 28-8 zijn op 31-8
opgelost: IT-19 (server weer bereikbaar), vier op aanwijzing van Marco via
promobeelden van officiële/aanbevolen partijen — IT-27 La Marrana
(luoghidelcontemporaneo.cultura.gov.it), IT-44 Casa Dipinta (umbriatourism.it,
tevens nieuwe site-URL in data.js), IT-64 Castello Incantato (fondoambiente.it,
tevens nieuwe site-URL), ES-06 Museo Vostell (gemeente malpartidadecaceres.es) —
en IT-26 Bonotto via een door Marco gemaakte schermafdruk van
fondazionebonotto.org (de site blokkeert hotlinks met een Cloudflare-challenge;
haal-url.js accepteert daarom ook een lokaal bestand).
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
  `/kunstlocaties/?land=Italië&kern=1`. `app.js` leest die bij het laden. Voor
  logeren: `?logeren=*` (alles waar je kunt slapen) of `?logeren=kunsthotel`;
  voor architectuur `?arch=1`.

## Data bijwerken

Elk record in `data.js` heeft:

| veld | betekenis |
|---|---|
| `n` | naam van de plek |
| `p` | plaats |
| `land`, `reg` | land en regio; de volgorde in het bestand bepaalt de volgorde op de pagina |
| `t` | soort: Beeldenpark, Land art, Gesamtkunstwerk, Kunstenaarshuis, Kunsthotel, Privécollectie, Industrieel erfgoed, Architectuur, Kunst in de openbare ruimte |
| `arch` | `true` als het gebouw zelf spraakmakende architectuur is. Staat los van `t`: ook een privécollectie of een beeldenpark kan de vlag hebben. Aparte filterknop |
| `w` | wie of wat: kunstenaar, architect, oprichter, jaar |
| `x` | waarom het bijzonder is (één of twee zinnen) |
| `lo` | logeren: `werk` (slapen ín het kunstwerk of een door een kunstenaar ingerichte kamer), `kunsthotel`, `terrein` (gastenverblijf op het terrein zelf), `architectuur` (slapen in het gebouw dat de reden is om te komen). Veld ontbreekt als er niets is |
| `low` | één zin over die overnachting; verschijnt achter het merkje op de kaart |
| `pr` | praktisch: openingstijden, reservering, prijs |
| `u` | officiële URL |
| `h` | honden: `ja`, `nee` of `?` (onbekend, níét nee) |
| `s` | seizoen: `jaarrond`, `seizoen`, `afspraak` of `let op` |
| `kern` | `true` voor de plekken die eruit springen |
| `buiten` | `true` als de locatie buiten het kaartkader valt (Canarische Eilanden, Madeira). Krijgt geen stip en geen kaartknop; `build-map.js` laat hem uit het zoomkader van het land |
| `ll` | `[lengte, breedte]` in graden, voor de kaart |
| `id` | catalogusnummer; wordt ook het anker in de URL. **Nooit hernummeren** — de nummers staan in URL's, fotobestandsnamen en het reisdossier |

Na een wijziging de `?v=` in `index.html` ophogen, zodat de 5-minutencache van
Cloudflare geen oude `data.js` blijft serveren.

## Bron

`data.js` is sinds 10-9-2026 de bron; het reisdossier wordt eruit gegenereerd, en
niet meer andersom. `scripts/kunstlocaties/build-dossier.js` schrijft
`docs/kunstlocaties-dossier.md`; die inhoud gaat naar het Claude-project
**Reizen** als `reizen/kunstlocaties-midden-en-zuid-europa.md`. Daarnaast staat
`docs/kunstlocaties-logeren.md` (in het project als
`reizen/kunstlocaties-logeren.md`) met de 116 logeeradressen uitgeschreven.

Inhoudelijke wijzigingen dus in `data.js`, daarna beide documenten opnieuw
genereren en in het project zetten.

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
