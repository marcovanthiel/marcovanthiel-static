# /kunstlocaties — werkinstructie

Verlanglijst van kunstparken, land art, kunstenaarstuinen, Gesamtkunstwerken en
andere plekken waar de locatie zelf het werk is, in elf Europese landen.
Gemaakt 28-08-2026. Kale static, geen Hugo-content, geen build.

## Bestanden

```
static/kunstlocaties/
├── index.html          # markup; laadt fonts.css, styles.css, data.js, app.js
├── AGENTS.md           # dit bestand
└── assets/
    ├── data.js         # window.KUNSTLOCATIES = [...] — de 217 locaties
    ├── app.js          # filteren, zoeken, renderen; geen afhankelijkheden
    ├── styles.css      # palet en typografie, licht én donker
    ├── fonts.css       # @font-face voor de drie self-hosted families
    └── fonts/          # Bricolage Grotesque, Newsreader, IBM Plex Mono
                        # (Fontsource, latin + latin-ext; SIL OFL)
```

## Uitgangspunten

- **Geen build, geen CDN, geen inline script of style.** Daardoor past de pagina
  binnen de site-brede CSP (`script-src 'self'`) en is er in `static/_headers`
  géén eigen CSP-blok nodig — alleen een cache-regel voor de fonts.
- **Self-hosted fonts.** Google Fonts is voor de rest van de site wel toegestaan
  in de CSP, maar hier bewust lokaal, net als bij /china2027. Vervangen gaat via
  `npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/newsreader
  @fontsource/ibm-plex-mono` en de woff2's uit `files/` kopiëren.
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

Na een wijziging de `?v=` in `index.html` ophogen, zodat de 5-minutencache van
Cloudflare geen oude `data.js` blijft serveren.

## Bron

Het volledige dossier met dezelfde inhoud in tekstvorm staat in het
Claude-project **Reizen**, onder `reizen/kunstlocaties-midden-en-zuid-europa.md`.
Dat is de plek om inhoudelijke wijzigingen eerst te maken; deze pagina is de
publieke weergave ervan.

## Backlog

- [ ] Hondenbeleid van de 89 onbekende plekken navragen waar het ertoe doet
- [ ] Openingstijden van de 27 "let op"-adressen bevestigen voor een reis
- [ ] Overwegen: kaartweergave (Leaflet + OSM-tiles vraagt dan wél een eigen
      CSP-blok voor `img-src`, zie het patroon bij /italie2026)
