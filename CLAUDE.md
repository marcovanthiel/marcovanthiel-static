# CLAUDE.md — marcovanthiel-static

Hugo-hoofdsite (5 talen, NL/EN/DE/IT/zh-CN) + subsites (Biennale 2026,
Fundraising, Manifest, Zilvermanagement, Felix-presentatie). Zie `README.md`
voor stack en build-details.

**Deploy-gotcha (2026-07-06):** Cloudflare Pages kan een push naar `main`
missen (geen build voor die commit; controleer met
`npx wrangler pages deployment list --project-name=marcovanthiel` of de
commit-hash erbij staat). Remedie: een lege commit pushen
(`git commit --allow-empty`) — nooit handmatig uploaden, GitHub blijft de bron.
Verifieer een deploy dus altijd op de live URL, niet alleen op de groene Action.

## Subsite: /felix

**marcovanthiel.nl/felix** — een zelfstandige, schermvullende **fotopresentatie**
voor Felix Jagtenborg (Rotary, selectie 13 mei 2026). Besloten: `noindex` in de
`<head>`. Gemaakt 2026-06-04.

Het is **geen Hugo-content** maar kale static: alles staat in `static/felix/` en
Hugo kopieert die map 1-op-1 naar de siteroot, dus de presentatie is live op
`/felix` zonder template, shortcode of taalvarianten.

```
static/felix/
├── index.html                 # markup + meta (noindex), laadt css/js met ?v=-cachebust
├── assets/css/style.css       # donkere fullscreen styling
├── assets/js/slideshow.js     # vanilla JS, geen dependencies
└── photos/photo-001.jpg … photo-220.jpg   # 3-cijferig, opvolgend vanaf 001
```

**Werking** (`slideshow.js`): crossfade + Ken Burns tussen twee gestapelde lagen,
preload van ±2 foto's, autoplay (default 5 s; keuze 3/5/7/10/15 s), shuffle
(Fisher-Yates), fullscreen, voortgangsbalk + teller, idle-UI-hide, pauze bij
tab-wissel, touch-swipe. Sneltoetsen: `←`/`→`, `spatie` (pauze), `F`
(fullscreen), `S` (shuffle), `Home`/`End`, `1`–`5` (snelheid), `?` (hulp), `Esc`.

**Foto's toevoegen/vervangen:**
1. Leg de bestanden als `photo-NNN.jpg` (3-cijferig, aansluitend vanaf `001`) in `static/felix/photos/`.
2. Pas `PHOTO_COUNT` aan boven in `assets/js/slideshow.js`.
3. Bump de `?v=`-cachebust op de css/js-verwijzingen in `index.html` zodat browsers de nieuwe versie pakken.

**Deploy:** push naar `main` → Cloudflare Pages bouwt Hugo → `/felix` is live.
Geen aparte build-stap voor de subsite, geen API, geen externe afhankelijkheden.

## Subsite: /wimbledon

**marcovanthiel.nl/wimbledon** — interactief wedstrijdschema Wimbledon 2026 met
7 onderdelen (Heren, Dames, Heren dubbel, Dames dubbel, Mixed, Jongens, Meisjes),
landvlaggen, live standen, daglijst met Nederlandse tijden en tv-zender per partij;
de daglijst accentueert op kijkmoment wat nu wordt uitgezonden (goud) en wat binnen
1 resp. 2 uur begint (blauw, twee sterktes), client-side herberekend per minuut.
Gemaakt 2026-07-04. Kale static (geen Hugo-content): `static/wimbledon/`.

```
static/wimbledon/
├── index.html            # datagestuurde bracket-pagina (7 tabs), leest data.json
└── data.json             # gegenereerd — NIET met de hand bewerken
scripts/wimbledon/update.py             # generator (Python 3.12, stdlib only)
```

**Databronnen** (beide gratis, geen key, beide CORS-open):
- **ESPN scoreboard-API** (`site.api.espn.com/.../tennis/atp/scoreboard`): enkelspel
  heren/dames + speeltijden/banen/uitslagen/live standen/vlaggen. De ESPN-volgorde is
  NIET de loting-volgorde; daarom staat de laatste-32-loting van MS/LS als
  `SEED_R32` in `update.py` én in `index.html` en worden uitslagen op genormaliseerde
  naam gematcht.
- **wimbledon.com draw-feeds** (`/en_GB/scores/feeds/2026/draws/{MD,LD,MX,BS,GS}.json`):
  dubbels + junioren in loting-volgorde (`match_id` oplopend). De MS/LS-feeds zijn
  door Akamai afgeschermd (302 naar robots.txt); niet proberen te scrapen, de seed +
  ESPN volstaat. Let op bij testen: Akamai blokkeert óók de headless-shell-TLS en de
  "HeadlessChrome"-user-agent → test met de volledige Chrome-binary + normale UA.

**Twee verversingslagen**:
1. **Elk uur server-side**: de GitHub Action regenereert `data.json` (eerste weergave
   + vangnet; beperkt de Cloudflare Pages-builds).
2. **Elke 5 minuten client-side**: `index.html` bevat een JS-port van de generator
   die dezelfde feeds rechtstreeks ophaalt (CORS staat open) en de brackets in de
   browser herberekent. Wijzig je generatorlogica, wijzig die dan op BEIDE plekken
   (Python én JS) — bewuste duplicatie voor een 9-daags project.

**Adaptieve kolommen**: lege bracketkolommen zijn smal (110/150 px), gevulde breed
(200/280 px); is kolom k+1 volledig bekend, dan verdwijnt kolom k uit beeld
(`geo()` in index.html). Zo past het geheel op een normaal scherm.

**Tv-logica NL** (bron: WBD-persbericht Wimbledon 2026, `tv_kanaal()` in update.py):
HBO Max streamt alle banen; Eurosport 1/2 lineair (Centre Court); **Court No. 1 is
t/m de achtste finales exclusief bij Ziggo Sport**; vanaf de halve finales alles overal.

**CSP**: de pagina heeft één inline `<script>`; `static/_headers` bevat daarom een
`/wimbledon/*`-blok dat de site-CSP vervangt (`! Content-Security-Policy` +
versie met `'unsafe-inline'`). Niet weghalen, anders doen de tabs niets.

**Onderhoud**: het toernooi 2026 is voorbij; de uurlijkse workflow
`wimbledon-hourly.yml` is op 2026-07-18 verwijderd (het script stopte zichzelf
al na 2026-07-13 via EINDDATUM). De subsite blijft staan als archief. Voor een
nieuwe editie (2027): workflow terugzetten uit de git-historie, jaartallen en
EINDDATUM in `update.py` en `index.html` bijwerken, en de nieuwe `SEED_R32`
(laatste-32-loting MS/LS) op beide plekken invoeren.
Bracket-fout in het enkelspel = `SEED_R32` in `update.py` corrigeren.

## Subsite: /italie2026

**marcovanthiel.nl/italie2026** — reiswebsite "Italië 2026: de pareltjesroute"
(1 t/m 15 aug 2026, Marco + Dandan + honden; opera-ankers
vr 7 aug Turandot + zo 9 aug Aida/Zeffirelli, 21:00, bron arena.it).
Gemaakt 2026-07-05. Kale static in `static/italie2026/`; `noindex`.
**Sinds 18-8-2026 verlengd met het tweede deel: Mechelen** (op verzoek Marco
géén aparte subsite): etappe 9 = Nijmegen → Mechelen (di 18 + wo 19 aug,
Hotel Vé aan de Vismarkt) met een volledig dagprogramma voor wo 19 aug
(tijdlijn met loopafstanden en de 300 m-grens, schematische SVG-plattegrond,
hemelsbrede afstanden met Google Maps-links, middagalternatieven A-D,
praktisch blok — bron: de tweetalige PDF's "mechelen-19-augustus"), en
etappe 10 = do 20 aug om 08:20 Eric ophalen op Brussels Airport en samen
terug naar Nijmegen. Het dagprogramma zit als veld `programma` in
route.json (generieke renderer in build.py); de kaart is
`assets/mechelen-kaart.svg` en wordt inline meegebouwd zodat de
taalschakelaar ook de kaartlabels omzet. De reisdag-badge en de
vandaag-markering zijn sinds die verlenging **data-gestuurd** door de
daglijst (geen hardcoded totalen meer in app.js); de thuisdagen 16/17 aug
staan als gewone dagen in `dagen`. Statbalk: 20 dagen, 16 hotelnachten,
6 landen, 10 etappes, ±2890 km. **Na thuiskomst (20-8-2026): workflow
italie2026-weer.yml verwijderen en de site naar afgeronde staat brengen
(verleden tijd, fotosectie).**
**Sinds 22-7-2026 ingericht als REISGIDS** (ook voor het thuisfront): geen
prijzen, scores of boekingsstatussen meer; hotels alleen als "We slapen in"
met link; nieuw "Dag tot dag"-overzicht (`dagen` in route.json) waarvan
app.js de rij van vandaag markeert, met "dag X van 15"-badge in de hero.
Overnachten rond de opera in een agriturismo bij Bussolengo (~20 min van de
Arena); honden tijdens de opera-avonden met een hondenoppas in het
agriturismo. Sinds 22-7-2026 toont elke etappe de verwachte gemiddelde
temperatuur (weer.json, Open-Meteo; dagelijkse Action **italie2026-weer**,
na de reis verwijderen; details in scripts/italie2026/README.md). Vormgeving sinds 21-7-2026: "Midnight Edition" (midnight
#071317, turquoise #02A0A0, pastel-oranje #FFBD65; tokens boven in
`assets/style.css`).
Route (stand 21-7-2026): Feldkirch (1n) → Valeggio via Trento-stop (2n,
Sigurtà) → Portico via Ferrara-lunchstop (3n, Brisighella = dagtocht) →
Valpolicella/Bussolengo (3n, opera vr+zo, za rustdag) → Cannobio via
Bergamo-lunchstop (3n) → Grindelwald via Grimsel-/Sustenpas (1n, Eiger) →
Bergheim via Bern/Basel (1n) → thuis za 15 (evt. gespreid tot zo 16).

**Tweetalig NL/中文** — schakelaar rechtsboven, keuze onthouden in
`localStorage` (`it26_lang`); `app.js` zet `body.toon-zh`, CSS toont de taal
(geen inline scripts). Per etappe: uitgebreide toeristische tekst (`toerisme`),
reisafstand (`afstand`), praktische info (`info`) en hotel-aanrader met
werkende link (`hotelsuggestie`).

**Volledige onderhouds-README: `scripts/italie2026/README.md`.** Kern:
- `route.json` = enige bron van waarheid. **Tekstvelden zijn `{nl,zh}`-objecten**
  (beide talen invullen). Wijzigen → push naar main → Action **italie2026-build**
  regenereert `index.html` → Pages deployt. Onderweg bij te werken via github.com.
- `index.html` is gegenereerd — nooit met de hand bewerken; structuur zit in
  `scripts/italie2026/template.html` + `build.py`, stijl in `assets/style.css`.
- Leaflet lokaal in `vendor/leaflet/`; OSM-tiles → eigen CSP-blok
  `/italie2026/*` in `static/_headers` (img-src met tile.openstreetmap.org,
  script-src 'self' — géén inline scripts gebruiken op deze pagina).
- Ankers = etappe 3 (Portico) en 4 (Valpolicella) (oranje), hardcoded in
  `build.py` (ANKERS) én `app.js`; het opera-blok (titels/data/tijd) in
  `build.py` hangt aan het Valpolicella-nummer. Bij hernummeren van etappes
  beide bijwerken.
- Elke etappe heeft een `voorbeeldfoto` (Wikimedia Commons, self-hosted in
  `static/italie2026/foto/`, credit verplicht in het veld; zie de
  subsite-README). Na de reis: vervangen door eigen materiaal (zonder het
  veld valt de "foto volgt"-placeholder terug).

## Subsite: /italiecamper2026

**marcovanthiel.nl/italiecamper2026** — campervariant van de pareltjesroute,
sinds 31-7-2026 ingericht als **reisvoorstel voor Nel** (zij boekt zelf nog).
Zelfde route, data en dagindeling als `/italie2026`, maar per etappe een
**voorgestelde camping met goede faciliteiten** (veld `camping`, incl.
`prijs` met boekingsinfo en controledatum; bewust geen camperplaatsen),
zonder honden-/oppasteksten, en etappe 4 = **Verona zelf** (stadscamping
Castel San Pietro, kwartier lopen naar de Arena). Let op: hu Altomincio
heeft geen staanplaatsen meer → vervangen door Camping Bella Italia
(Peschiera); Riviera reserveert pas vanaf 10 nachten; Eigernordwand neemt
's zomers geen reserveringen aan. Deelt stijl, foto's, vendor-assets en
`weer.json` met `/italie2026` (absolute paden; geen eigen weer-pipeline) en
wordt gebouwd door dezelfde Actions **italie2026-build** en
**italie2026-weer**. Eigen CSP-blok `/italiecamper2026/*` in
`static/_headers`. Volledige details: `scripts/italiecamper2026/README.md`.

## Subsite: /china2027

**marcovanthiel.nl/china2027** — reiswebsite "China 2027" (24 april t/m 9 mei
2027, 8 personen, Chongqing → Anshun → Mile → Shenzhen → Guangzhou). Live gezet
28-8-2026. Kale static in `static/china2027/`; aangeleverd als zip, werkinstructie
staat in `static/china2027/AGENTS.md` (uitgangspunten: statisch zonder build,
tweetalig NL/中文 via `data-nl`/`data-zh`, mobiel eerst, geen browseropslag,
namen Chen Zanxi/Wu Hengxia/Austin/Brenna niet in karakters verzinnen).

```
static/china2027/
├── index.html            # alle inhoud, tweetalig via data-attributen (?v=-cachebust op assets)
├── AGENTS.md             # werkinstructie en backlog van de subsite
├── assets/styles.css     # tokens bovenaan in :root
├── assets/app.js         # taalschakelaar + inlezen media/manifest.json
├── assets/fonts.css      # self-hosted Google-Fonts-CSS (unicode-range-subsets)
├── assets/fonts/         # 108 woff2-subsets Noto Serif SC + Source Sans 3 (~6 MB)
├── assets/route.png      # routekaart
└── media/manifest.json   # welke foto's/filmpjes waar horen (+ LEESMIJ.md)
```

**Fonts self-hosted** (28-8-2026): conform de site-standaard (CSP 'self', geen
CDN's); de Google-css2-output is gedownload met alle subsets en herschreven
naar `assets/fonts/`. Door de unicode-range-subsets laadt een bezoeker maar
enkele tientallen kB. **Doelgroep (vastgesteld 28-8-2026): de Nederlandse
reisgenoten**; "werkt het in China" is voor deze site geen argument
(YouTube-embeds zijn dus prima).

**CSP**: eigen `/china2027/*`-blok in `static/_headers` (alles 'self';
frame-src alvast open voor YouTube/Vimeo-insluitingen die `media/manifest.json`
ondersteunt) + immutable-cache op `assets/fonts/`.

**Beeld toevoegen**: zie `static/china2027/media/LEESMIJ.md` (foto's max 1600 px,
alt verplicht; video's <10 MB of insluiten). Sinds 28-8-2026 zijn `alt`,
`caption` en video-`title` in het manifest `{nl, zh}`-objecten (string mag ook,
geldt dan voor beide talen) en is er een verplicht `credit`-veld (auteur +
licentie + bronpagina) bij beeld van anderen; app.js rendert de credits als
link en vertaalt bijschriften mee bij de taalwissel.

**Media gevuld 28-8-2026**: 11 foto's + 1 video (Liziba-fragment, 13 s H.264
uit een CC BY 4.0-nieuwsvideo van 中国新闻网, geknipt met ffmpeg) van Wikimedia
Commons, alle met credit en licentie in het manifest; 8 tegels blijven bewust
leeg (persoonlijke opnames: familie, ateliers Chen Zanxi, groepsfoto,
archief-2025-beelden uit Polarsteps/Facebook). Beelden self-hosted in `media/`,
max 1600 px, ≤300 kB (ffmpeg-compressie).

**Rondgang 28-8-2026** (verzoek Marco): (1) routekaart vervangen door een
**satellietkaart**: gegenereerd met Playwright + Leaflet op EOX Sentinel-2
cloudless 2018-tiles (CC BY 4.0, bronvermelding onder de legenda; herbouwen =
`satkaart.html`-patroon: tiles + polylines + divIcon-labels, screenshot 2200px);
`assets/route.png` is vervangen door `assets/route-satelliet.jpg`. (2) 9 extra
Commons-foto's (Luohan-tempel als interim voor de ateliertegel, familietafel,
Miao-klederdracht i.p.v. de vervallen houten-tulp-tegel, wijngaard Mile,
roséglas, OCT-LOFT, 2x Dafen 2025, Canton Tower in een nieuwe 4e
Guangzhou-tegel). (3) 3 YouTube-nocookie-embeds (Huangguoshu-drone,
Dongfengyun-kunstpark, Shenzhen-skyline; oembed-geverifieerd). (4) **Hotels verplaatst van een eigen
sectie naar een `.stay`-blok per etappe** (intro + sterrenbronregel staat bij
Chongqing). Nog 1 lege tegel: de groepsfoto.

**Chinese grafische laag 28-8-2026** (verzoek Marco): vermiljoen zegelstempel
(token `--zegel` #B3352B, klasse `.zegel`, karakter 旅) bij de titel en in de
topbalk; per etappe een hoofdstuknummer in Chinese cijfers via CSS-counter
`counter(etappe, cjk-decimal)` als `h2::before` (pseudo-element, overleeft de
taalwissel die textContent vervangt); dubbele boeklijn (dik+dun) onder de
topbalk en boven de footer; verticale jaarregel 二〇二七年春·中国 rechts in de
hero (verdwijnt <820px). **Favicon** = het zegel (assets/favicon-32/180.png),
gegenereerd via Playwright-screenshot van een div met de echte Noto Serif SC
(SVG-favicons laden geen webfonts); regenereren = zegel.html-patroon in de
scratchpad. Let op: kinderen van elementen mét data-nl/data-zh worden bij de
taalwissel weggegooid; decoratie dus als sibling of pseudo-element toevoegen.

**Hotelsterren 28-8-2026**: per hotelkaart de Trip.com-klasse (geen
overheidssterren; bronregel + controledatum in de sectie-intro). Bij het checken
bleken drie hotels op Trip.com hernoemd: Golden View Chongqing → Botton Meijin,
Ramada Plaza Anshun → Xixiu Hotel (Wyndham-merk onzeker), Hotel Kapok Luohu →
Mumian · JdV by Hyatt; op de kaarten staat een notitie.

**Backlog** (in `static/china2027/AGENTS.md`): Chinese teksten laten nakijken
door Dandan (incl. de nieuwe bijschriften), hotelprijzen, vluchttijden, eigen
foto's voor de 8 lege tegels.

## Subsite: /weerstatistieken

**marcovanthiel.nl/weerstatistieken** — weerstatistieken van KNMI-meetstation
Volkel (station 375): vier interactieve daggrafieken (temperatuur, neerslag,
wind, zon) over de laatste drie jaar met synchroon zoomen/pannen, plus een
30-jaarsstaafgrafiek "warme dagen" (>27 °C) met trendlijn. Gemaakt 2026-07-10.
Kale static (geen Hugo-content): `static/weerstatistieken/`.

```
static/weerstatistieken/
├── index.html    # alles-in-één: markup, inline <style>, inline <script> met de data
└── vendor/       # self-hosted: Chart.js 4.4.1, moment 2.29.4, chartjs-adapter-moment,
                  # hammer.js, chartjs-plugin-zoom (geen CDN — site-CSP is 'self')
```

**Data**: momentopname t/m 2026-07-08, inline in `index.html`. Verversen =
nieuwe KNMI-export (`result.txt`) door het buildscript in de OneDrive-map
`_Projectmanagement/Weer analyse` halen en de nieuwe `index.html` hierheen
kopiëren (daarbij de vijf CDN-script-tags weer omzetten naar `vendor/…`).
Let op: het bron-HTML verwijst naar `cdnjs …/hammerjs/2.0.8/…` en dat pad is
een 404 (juiste cdnjs-pad is `hammer.js/2.0.8`); self-hosted vendor-map lost
dat blijvend op.

**CSP**: één inline `<script>` (data + grafieken) → eigen
`/weerstatistieken/*`-blok in `static/_headers` met `'unsafe-inline'` in
script-src (zelfde patroon als /wimbledon). Vendor-assets cachen 30 dagen.

## Subsite: /kunstlocaties

**marcovanthiel.nl/kunstlocaties** — kaart, foto's en catalogus van 217
kunstparken, land art-plekken, kunstenaarstuinen, Gesamtkunstwerken en andere
locaties waar de plek zelf het werk is, in elf Europese landen. Filterbaar op
land, soort, seizoen, hondenbeleid en of er een foto is, met zoekveld en deelbare
querystring. Gemaakt 2026-08-28; kaartlaag en beeldtaal dezelfde dag.

```
static/kunstlocaties/
├── index.html          # markup, verder niets
├── AGENTS.md           # werkinstructie, datamodel, kaartlogica en fotobeleid
├── foto/               # <catalogusnummer>.webp, 760 px breed
└── assets/
    ├── data.js         # window.KUNSTLOCATIES (217 records, incl. ll-coördinaten)
    ├── mapdata.js      # window.KAARTDATA — gegenereerd, ~150 kB
    ├── fotos.js        # window.KUNSTFOTOS — gegenereerd, credits per foto
    ├── app.js          # kaart, zoom/pan, filters, catalogus; geen afhankelijkheden
    ├── styles.css      # één vaste wereld (kobalt), geen licht/donker-schakelaar
    ├── fonts.css       # @font-face
    └── fonts/          # Syne, Karla, IBM Plex Mono (Fontsource)
scripts/kunstlocaties/  # build-map.js (kaartdata) en fetch-fotos.js (foto's)
```

**Beeldtaal**: richting "mozaïek" — Niki de Saint Phalle. Kobalt #16249B als
grond, vermiljoen/goud/turquoise als scherven, room als tekst. De landen op de
kaart zijn met een SVG-patroon van steentjes gevuld dat bij zoomen wordt
tegengeschaald. Bewust géén licht/donker-varianten: het kobalt ís het ontwerp.

**Kaart zonder kaartdienst**: één SVG uit Natural Earth 1:50 m, Mercator,
tekenvlak 1000×890, vereenvoudigd met Douglas-Peucker. Stippen, mozaïek en
richtkruis worden tegengeschaald. Labels vanaf 3,2× en gefilterd op botsing.

**Foto's**: één per locatie, `foto/<nummer>.webp`. Opgehaald met
`scripts/kunstlocaties/fetch-fotos.js` — dat draait op een machine met gewoon
internet, want de agent-sandbox komt niet bij Wikimedia. Alleen vrije licenties;
maker, licentie en bronpagina staan onder elke foto. Ontbreekt er een foto, dan
toont de pagina een mozaïekvlak, geen leeg gat. Eigen foto's gaan voor: zet ze in
`scripts/kunstlocaties/foto-bron/<nummer>.jpg`.

**CSP**: bewust géén eigen blok. Alle CSS en JS staan in externe bestanden, de
fonts zijn self-hosted en de foto's staan op het eigen domein, dus de site-brede
CSP (`script-src 'self'`, `img-src 'self' data:`) volstaat. In `static/_headers`
alleen cacheregels voor `/kunstlocaties/assets/fonts/*` en `/kunstlocaties/foto/*`.

**Indexeerbaar** (geen `noindex`), en gelinkt vanaf de homepage in alle vijf
talen — de laatste cursieve regel van `content/<taal>/_index.md`.

**Data bijwerken**: bron is het Claude-project *Reizen*, bestand
`reizen/kunstlocaties-midden-en-zuid-europa.md`. Wijzig daar, genereer `data.js`
opnieuw, draai `build-map.js` en `fetch-fotos.js`, en hoog de `?v=` in
`index.html` op.

## Verhuisde projecten

- **OCAI-cultuurmeting Koraal & Via Jeugd** (voorheen onder
  `/koraalenviajeugd/`) is per **2026-06-12** verhuisd naar het eigen
  domein **koraalenviajeugd.nl** en repo
  **`marcovanthiel/koraalenviajeugd`**. Oude URLs worden 301-geredirect
  via `static/_redirects`. Volledige project-CLAUDE.md staat in de
  nieuwe repo.
