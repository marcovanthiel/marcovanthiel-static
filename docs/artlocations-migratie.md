# artlocations.art — migratie en uitbouw

Werkinstructie voor Claude Code. Geschreven 11 september 2026, na het besluit om
de subsite `marcovanthiel.nl/kunstlocaties` te verzelfstandigen op het eigen
domein **artlocations.art** (door Marco geregistreerd op 11-9-2026).

Lees dit document helemaal voordat je begint. De beslissingen in hoofdstuk 1
staan vast — draai ze niet terug en stel ze niet opnieuw voor. Waar iets een
oordeel vraagt dat hier niet staat, vraag het aan Marco in plaats van te gokken.

---

## 1. Wat vaststaat

| Beslissing | Keuze | Reden |
|---|---|---|
| Hosting | **Nieuwe GitHub-repo `artlocations`, eigen Cloudflare Pages-project** | Eigen `_headers`, eigen CSP, eigen deploys. De Hugo-build van `marcovanthiel-static` mag dit project niet gijzelen, en het gaat divergeren: generator, duizenden pagina's, meertaligheid. |
| Talen fase 1 | **Nederlands en Engels** | Engels opent het Tier 1-verkeer dat nodig is voor advertentienetwerken en voor toerismebureaus. Duits, Frans en Italiaans komen later; bouw de structuur er wel op. |
| Wereldwijde laag | **Nog niet** | Eerst Europa goed. De Wikidata-import is een latere fase; zie hoofdstuk 9 voor wat je nu al moet openhouden. |
| Oude URL | **301 naar het nieuwe domein** | Pas omzetten nadat de nieuwe site live en compleet is. Zie fase 6. |
| Beeldtaal | **Ongewijzigd overnemen** | De reismagazine-identiteit in petrol en orchidee is op 11-9-2026 door Marco gekozen uit zestien voorstellen. Niet herontwerpen. De tokens, fonts en regels staan in `static/kunstlocaties/AGENTS.md`, sectie Beeldtaal. Neem die sectie letterlijk mee naar de nieuwe repo. |
| Catalogusnummers | **Nooit hernummeren** | `IT-01` tot en met `CZ-12` zitten in fotobestandsnamen, in het reisdossier en straks in URL's. |

---

## 2. Wat er nu staat

Bron: `marcovanthiel-static`, commit `ca050ef` of later.

```
static/kunstlocaties/
├── index.html              één pagina, alle 303 locaties in één DOM
├── AGENTS.md               werkinstructie, datamodel, beeldtaal, fotobeleid
├── TAKEN.md                openstaande punten
├── foto/                   303 × <id>.webp, 760 px breed
└── assets/
    ├── data.js             window.KUNSTLOCATIES — 303 records
    ├── mapdata.js          window.KAARTDATA — gegenereerd, ~155 kB
    ├── fotos.js            window.KUNSTFOTOS — credits per foto
    ├── app.js              kaart, zoom/pan, filters, catalogus; geen dependencies
    ├── styles.css          petrol + orchidee, één vaste donkere wereld
    ├── fonts.css           @font-face
    └── fonts/              Newsreader en Schibsted Grotesk (variabel, woff2)

scripts/kunstlocaties/
├── build-map.js            → assets/mapdata.js uit Natural Earth 1:50m
├── fetch-webfotos.js       → foto/ + assets/fotos.js uit de og:image van elke locatie
├── build-dossier.js        → docs/kunstlocaties-dossier.md
├── contactvel.js           → contactvel.html, alle foto's in een raster
└── haal-url.js             één foto handmatig vervangen
```

Velden per record in `data.js`: `id n p land reg t arch w x lo low pr u h s kern buiten ll`.
De betekenis staat in de kop van `data.js` en in de veldentabel van `AGENTS.md`.

**Het probleem dat deze migratie oplost:** 303 unieke, nergens anders beschreven
locaties zitten in één URL. Voor een zoekmachine is dat één rankingdoel. Niemand
zoekt op "kunstlocaties Midden-Europa"; mensen zoeken op "slapen in een gebouw
van Le Corbusier" of "kunst in de buurt van het Gardameer". Dat zijn pagina's
die nu niet bestaan.

---

## 3. Doelarchitectuur

Een **statische-sitegenerator in gewoon Node**, geen framework. Dat sluit aan bij
`build-map.js` en `build-dossier.js`, heeft geen dependency-onderhoud en levert
platte HTML op die Cloudflare Pages rechtstreeks serveert.

```
artlocations/
├── data/
│   ├── locaties.js         verhuisd uit static/kunstlocaties/assets/data.js
│   ├── fotos.js
│   ├── mapdata.js
│   ├── slugs.json          gegenereerd: id → slug, land → slug, regio → slug, per taal
│   ├── i18n/nl.json        UI-teksten
│   ├── i18n/en.json
│   ├── vertalingen/en.json vertaalde w/x/pr/low per id — zie fase 4
│   ├── sponsors.json       leeg aanleggen; zie hoofdstuk 8
│   └── affiliate.json      leeg aanleggen; zie hoofdstuk 8
├── sjablonen/              HTML-sjablonen (template literals, geen engine)
├── assets/                 styles.css, app.js, fonts.css, fonts/
├── foto/                   303 × <id>.webp
├── scripts/
│   ├── build.js            hoofdgenerator → dist/
│   ├── build-map.js        ongewijzigd overnemen
│   ├── build-slugs.js      nieuw
│   ├── fetch-webfotos.js   ongewijzigd overnemen
│   └── check-links.js      nieuw, zie fase 5
├── dist/                   buildresultaat, in .gitignore
├── AGENTS.md
├── TAKEN.md
└── package.json
```

### URL-schema

Engels is de internationale standaard en staat op de root. Nederlands staat onder
`/nl/`. Beide talen hebben eigen padsegmenten; die staan in één tabel per taal in
`data/i18n/<taal>.json` onder de sleutel `paden`.

```
/                                   Engelse homepage, hreflang x-default
/nl/                                Nederlandse homepage
/location/it-01-art-park/           locatiepagina  (nl: /nl/locatie/it-01-art-park/)
/country/italy/                     landpagina     (nl: /nl/land/italie/)
/region/tuscany/                    regiopagina    (nl: /nl/regio/toscane/)
/stay/                              alles met logeren  (nl: /nl/logeren/)
/stay/art-hotel/                    per logeercategorie (nl: /nl/logeren/kunsthotel/)
/architecture/                      de arch-vlag   (nl: /nl/architectuur/)
/map/                               de volledige kaart (nl: /nl/kaart/)
/nearby/                            afstandszoeker (nl: /nl/in-de-buurt/)
```

Slugregels, vast te leggen in `build-slugs.js`:

- Locatieslug is `<id in kleine letters>-<naam>`, bijvoorbeeld `it-01-art-park`.
  Het nummer voorop maakt de slug uniek, stabiel bij hernoemen, en sluit aan op
  de catalogusdiscipline. Diakrieten weg, `&` → `and`, alles ASCII, maximaal
  zestig tekens.
- Land- en regioslugs komen uit een handmatige tabel in `data/slugs.json`,
  niet uit transliteratie: `Italië` → `italy` / `italie`, `Zuid-Tirol` →
  `south-tyrol` / `zuid-tirol`. Genereer de tabel één keer, controleer hem met
  de hand, en check hem daarna in.
- Slugs veranderen nooit meer. Verandert een naam, dan blijft de slug staan.

### Per pagina verplicht

- `<link rel="canonical">` naar de eigen taalvariant
- `<link rel="alternate" hreflang="...">` voor elke taal plus `x-default` op de
  Engelse versie
- `<title>` en `<meta name="description">` per pagina, uit de data samengesteld,
  nooit dezelfde twee keer
- JSON-LD: `TouristAttraction` op locatiepagina's, met `Hotel` of
  `LodgingBusiness` erbij waar `lo` gevuld is; `BreadcrumbList` overal
- Open Graph met de eigen foto van de locatie
- `sitemap.xml` per taal plus een sitemap-index

---

## 4. Fasering

Elke fase eindigt met een commit en een werkende site. Ga niet door naar de
volgende fase voordat de acceptatiecriteria van de huidige gehaald zijn.

### Fase 0 — repo en hosting

1. Maak de GitHub-repo `marcovanthiel/artlocations`, privaat mag, branch `main`.
2. Kopieer dit document naar `docs/migratie.md` in de nieuwe repo.
3. Neem mee uit `marcovanthiel-static`: de hele map `static/kunstlocaties/` en
   `scripts/kunstlocaties/` volgens de indeling in hoofdstuk 3. Behoud de
   git-geschiedenis niet; begin met één commit "overgenomen uit
   marcovanthiel-static@ca050ef".
4. Neem `.claude/settings.json` en de vijf commando's uit
   `.claude/commands/` over en pas de paden aan.
5. Neem de sectie Beeldtaal uit `static/kunstlocaties/AGENTS.md` letterlijk over
   in de nieuwe `AGENTS.md`.

**Marco doet zelf, dit kun jij niet:** Cloudflare Pages-project aanmaken,
gekoppeld aan de nieuwe repo, buildcommando `npm run build`, uitvoermap `dist`.
Daarna `artlocations.art` als custom domain toevoegen en de nameservers bij de
registrar naar Cloudflare wijzen.

*Klaar als:* de repo staat, `npm run build` draait lokaal, en er staat een
Pages-deploy met de huidige eenpagina-site op artlocations.art.

### Fase 1 — de generator

Bouw `scripts/build.js`. Begin met de Nederlandse taal alleen; Engels komt in
fase 4 er bovenop en mag de structuur niet omgooien.

Te genereren: homepage, 303 locatiepagina's, 11 landpagina's, circa 70
regiopagina's, de logeerpagina's (één overzicht plus vier categorieën), de
architectuurpagina, de kaartpagina, de afstandszoeker, `sitemap.xml`,
`robots.txt`, `_headers`, `_redirects`, en een 404.

De locatiepagina bevat: foto met credit, naam, plaats, land, regio, `w`, `x`,
`pr`, de logeerregel als `lo` gevuld is, het architectuurmerk als `arch` waar is,
seizoen, hondenbeleid, de officiële link, een kaartfragment met alleen deze stip,
en **de vijf dichtstbijzijnde andere locaties** — die laatste statisch
gegenereerd, want dat is de interne linkstructuur waar het zoekverkeer op draait.

De regiopagina bevat: alle locaties in die regio, een kaartuitsnede, en een
inleidende alinea. Die alinea schrijf je **niet** zelf: laat hem leeg met een
`<!-- TODO: redactionele intro -->` en zet de regio's op de takenlijst. Marco
schrijft ze. Gegenereerde vultekst is precies wat deze site niet moet worden.

Neem `app.js` over voor de kaart, de filters en de zoekfunctie, maar splits hem:
de kaartlogica en de afstandszoeker blijven, de catalogusrendering vervalt voor
de gegenereerde pagina's.

*Klaar als:* `dist/` bevat alle pagina's, elke pagina heeft een eigen title en
description, geen enkele interne link is dood, en de site draait lokaal op
`python3 -m http.server` zonder console-fouten.

### Fase 2 — de afstandszoeker

Dit is de functie die het publiek bedient dat alleen komt kijken of er iets in de
buurt van hun vakantiebestemming staat. Twee vormen:

1. **Statisch**, op elke locatiepagina en regiopagina: de dichtstbijzijnde
   locaties, met afstand in kilometers. Haversine over het veld `ll`, tijdens de
   build berekend.
2. **Interactief**, op `/nearby/`: een plaatsnaam of "gebruik mijn locatie",
   daarna een gesorteerde lijst met afstand en een kaart. Voor het omzetten van
   plaatsnaam naar coördinaat gebruik je **geen** externe dienst tijdens het
   bezoek — dat breekt de CSP en de cookievrijheid. Genereer in plaats daarvan
   tijdens de build een plaatsenbestand met de 270 plaatsnamen die al in de
   dataset zitten plus de honderd grootste Europese steden, en zoek daarin.

*Klaar als:* op elke locatiepagina staan vijf buren met correcte afstand, en
`/nearby/` werkt zonder netwerkverzoek naar een derde partij.

### Fase 3 — advertentie- en affiliateplekken, nog leeg

Bouw de plekken, activeer ze niet. Zie hoofdstuk 8 voor de regels.

*Klaar als:* de sjablonen hebben de slots, `sponsors.json` en `affiliate.json`
bestaan en zijn leeg, en een lege configuratie levert een pagina op zonder enig
zichtbaar gat.

### Fase 4 — Engels

Structuur: `data/vertalingen/en.json` met per `id` de velden `w`, `x`, `pr`,
`low`. Ontbreekt een vertaling, dan valt de pagina terug op het Nederlands en
krijgt hij `<meta name="robots" content="noindex">` tot de vertaling er is.
Half-Engelse pagina's indexeren is schadelijker dan ze niet hebben.

Maak eerst de UI-vertaling compleet (`i18n/en.json`), dan de 303 records.

**Let op bij het vertalen.** De veldwaarden `x` zijn geen beschrijvingen maar
oordelen, in Marco's stem: "Eerlijk: precies het risico van een groot gebouw",
"Let op: in het hoogseizoen precies het massatoerisme waar je een hekel aan
hebt." Een machinevertaling slaat die plat tot reisbrochure. Vertaal in blokken
van vijfentwintig, lever ze aan Marco ter redactie, en verwerk zijn correcties
terug voordat je verdergaat. Ga niet in één keer alle 303 doen.

*Klaar als:* `/` is Engels, `/nl/` is Nederlands, hreflang klopt in beide
richtingen, en geen enkele pagina mengt talen.

### Fase 5 — controle

Schrijf `scripts/check-links.js` en draai het:

- alle 303 waarden van `u` opvragen, status loggen, dode domeinen melden
- alle interne links controleren
- alle `ll` binnen het land controleren met point-in-polygon (er zat er ooit één
  in Slovenië die in Oostenrijk hoorde)
- alle foto's aanwezig, geen dubbele bestandsnamen
- contrastcontrole op de tokens uit de Beeldtaal-sectie
- mobiel: geen horizontale overflow bij 390 px breed

Draai daarna Lighthouse op drie representatieve pagina's: de homepage, een
locatiepagina met foto en een regiopagina.

*Klaar als:* geen dode interne links, geen coördinaat buiten zijn land, en
Lighthouse boven 90 op alle vier de assen.

### Fase 6 — omzetten

1. Controleer dat artlocations.art compleet is en geïndexeerd raakt.
2. Zet in `marcovanthiel-static` een redirect in `static/_redirects`:
   `/kunstlocaties/* https://artlocations.art/nl/ 301`.
   Let op: de oude site had geen URL's per locatie, alleen ankers en
   querystrings. Een fijnmazige mapping bestaat dus niet en is geen verlies.
3. Verwijder `static/kunstlocaties/` uit `marcovanthiel-static` in dezelfde
   commit als de redirect, niet eerder.
4. Werk de vijf taalversies van de homepage van marcovanthiel.nl bij: de link
   naar `/kunstlocaties` wordt een link naar `artlocations.art`.
5. Werk `CLAUDE.md` en `docs/kunstlocaties-draaiboek.md` in de oude repo bij met
   een verwijzing naar de nieuwe repo.
6. Meld het nieuwe domein aan in Google Search Console en dien de sitemap in.

*Klaar als:* `curl -I https://marcovanthiel.nl/kunstlocaties/` geeft 301 naar
artlocations.art, en de oude map is weg.

---

## 5. Deploy en verificatie

Cloudflare Pages mist soms een push. Na elke push:

```
npx wrangler pages deployment list --project-name=artlocations
```

Staat de commit-hash er niet bij, dan is de deploy niet gestart. Remedie: een
lege commit pushen (`git commit --allow-empty`). **Nooit** handmatig uploaden —
dan loopt de repo uit de pas met wat er live staat.

Cachebusters: elk bestand dat kan veranderen krijgt `?v=JJJJMMDD<letter>` in de
HTML. Cloudflare cachet HTML 300 seconden. Bij de gegenereerde site kun je dit
automatiseren: hash de inhoud van `styles.css` en `app.js` tijdens de build en zet
de hash in de querystring. Doe dat — het handmatig ophogen is al een keer
misgegaan.

---

## 6. Grenzen van de omgeving

Wat in een Cowork-sessie niet werkt, zodat je het niet opnieuw hoeft te ontdekken:

| Wat | Status |
|---|---|
| `git push` vanuit de sandbox | Geen credentials. Marco pusht zelf. |
| Netwerk vanaf de Mac via `device_bash` | Geen. `EAI_AGAIN` op elke host. |
| Netwerk vanuit de cloudcontainer | Alleen via de proxy-allowlist. npm en GitHub mogen; RDAP, Wikimedia en willekeurige sites niet. |
| `fetch-webfotos.js` | Heeft netwerk nodig. Draait op Marco's Mac, niet in de sandbox. |
| WebFetch op Wikipedia | Geeft "cache-only". |
| Bestanden verwijderen op de Mac | Vraagt expliciete toestemming via `device_request_delete_permission`. |
| `device_bash` | Kapt af rond 45 seconden. Splits lange taken. |
| Testen | Bestanden stagen naar de container, `python3 -m http.server`, Playwright met `executablePath: '/opt/pw-browsers/chromium'`, screenshot, teruglezen. |

---

## 7. Redactionele regels die blijven gelden

Deze zijn in augustus en september vastgelegd en gelden onverkort op het nieuwe
domein.

- **Fotobijschrift.** Elk beeld is het promobeeld van de locatie zelf, overgenomen
  van de eigen website, met bron en link eronder. Schrijf nooit dat de beelden vrij
  gelicentieerd zijn — dat was de oude situatie en is al een keer ten onrechte op
  een live pagina beland.
- **`onbekend` betekent onbekend**, niet nee. Geldt voor hondenbeleid en voor
  alles wat niet te verifiëren was. Nooit invullen wat je niet weet.
- **Geen reclametaal** in `x`, `w` en `low`. Nuchter, concreet, en het mag negatief
  zijn.
- **Geen gegenereerde vultekst.** Ontbreekt er een regio-inleiding, dan blijft die
  leeg tot Marco hem schrijft.
- **Geen inline script of style**, geen CDN, self-hosted fonts. Zo blijft de CSP
  `script-src 'self'` haalbaar zonder uitzonderingen.

---

## 8. Geld verdienen — wat je nu bouwt en wat je niet aanzet

Het verdienmodel kent twee sporen, met verschillende pagina's.

**Spoor 1, de kijker.** Landt op land-, regio- en in-de-buurt-pagina's. Veel
verkeer, geen transactie. Hier hoort sponsoring. Niet van een advertentienetwerk,
maar van toerismebureaus en regionale marketingorganisaties — dat is waar het
geld in deze categorie zit. Bouw daarvoor:

- een slot in het regio- en landsjabloon, gevoed uit `data/sponsors.json`
- geen enkele externe script-tag; een sponsorblok is eigen HTML met een eigen
  afbeelding uit `foto/sponsor/`
- elk blok zichtbaar gelabeld als "mogelijk gemaakt door", nooit vermengd met de
  redactionele volgorde: **sponsoring verandert nooit welke locatie waar staat**

**Spoor 2, de boeker.** Landt op locatiepagina's met `lo` gevuld. Hier hoort de
affiliate-link en verder niets — een advertentie naast een boekknop
kannibaliseert de eigen conversie.

- `data/affiliate.json` bevat per partner het programma, het account-id en het
  linkformaat. Haal dat formaat uit het partnerdashboard; verzin het niet.
- Niet elke locatie is boekbaar. Zumthors huizen in Leis, Villa Saraceno, het
  Bauhaus-atelierhuis, Le Balcon de Belledonne en de Refuges périurbains gaan
  rechtstreeks bij de eigenaar. Bij die locaties toon je alleen de eigen link.
  Voeg per record een veld `boekbaar` toe met de partner, of laat het leeg.
- Elke affiliate-link krijgt `rel="sponsored nofollow noopener"` en
  `target="_blank"`.
- Onder elk blok met affiliate-links staat één zin: dat het een affiliatelink is,
  dat de site een vergoeding krijgt, en dat de bezoeker niets extra betaalt. Dat
  is geen nettigheid maar een verplichting.

**Wat je in fase 1 níét doet:** een advertentienetwerk aansluiten. AdSense en
soortgenoten vereisen een consent-banner en derde-partij-scripts, en dat kost
zowel de cookievrijheid als de CSP. Zolang er alleen uitgaande affiliate-links
staan is er **geen toestemmingsbanner nodig** — de tracking gebeurt pas ná de klik,
bij de andere partij. Houd dat zo lang mogelijk zo.

**Statistieken:** Cloudflare Web Analytics, want dat werkt zonder cookies. Geen
Google Analytics.

---

## 9. Openhouden voor later

Bouw deze dingen nu niet, maar zorg dat ze later passen.

- **Meer talen.** Duits, Frans en Italiaans. De padtabel per taal en de
  terugvalregel uit fase 4 moeten dat aankunnen zonder herbouw.
- **De wereldwijde laag.** Een latere import uit **Wikidata**, niet uit
  OpenStreetMap: Wikidata staat onder CC0, OpenStreetMap onder ODbL met
  share-alike, en die verplichting besmet je hele afgeleide database. Leg nu
  alvast in het datamodel een veld `bron` aan met waarde `gecureerd`, zodat een
  geïmporteerde laag er later naast kan zonder dat de twee door elkaar lopen. In
  het ontwerp moet het verschil zichtbaar worden: gecureerde records hebben een
  foto, een oordeel en een logeerregel, geïmporteerde niet.
- **Een nieuwsbrief.** De logische opstap naar merkpartnerschappen, want die
  worden verkocht op bereik en op publiek, niet op paginaweergaven.

---

## 10. Wat Marco zelf moet doen

Zet dit als eerste op zijn takenlijst, want fase 0 loopt erop vast:

1. Nameservers van `artlocations.art` naar Cloudflare
2. Cloudflare Pages-project aanmaken en koppelen aan de nieuwe repo
3. Merkencheck op "Art Locations" bij BOIP en EUIPO voordat er een logo komt
4. Partneraccount bij Booking.com aanvragen, plus een aanbieder voor huurauto's
5. Beslissen wanneer de 301 om mag

En doorlopend: de regio-inleidingen schrijven en de Engelse vertalingen redigeren.
Dat zijn de twee dingen die niemand anders kan doen en die de kwaliteit van de
hele site bepalen.
