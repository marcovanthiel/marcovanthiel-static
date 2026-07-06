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
.github/workflows/wimbledon-hourly.yml  # cron elk uur (minuut 7), commit bij wijziging
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

**Onderhoud**: het script stopt zichzelf na 2026-07-13 (EINDDATUM); daarna de
workflow `wimbledon-hourly.yml` verwijderen (en evt. de hele subsite archiveren).
Bracket-fout in het enkelspel = `SEED_R32` in `update.py` corrigeren.

## Subsite: /italie2026

**marcovanthiel.nl/italie2026** — reiswebsite "Italië 2026: de pareltjesroute"
(31 jul t/m 13 aug 2026, 14 dagen, Marco + Dandan + honden; opera-ankers
Verona za 8 aug Nabucco + zo 9 aug Aida/Zeffirelli, 21:00, bron arena.it).
Gemaakt 2026-07-05. Kale static in `static/italie2026/`; `noindex`.
Herpland 2026-07-06 (2×): later vertrek op vr 31 jul, ~14 dagen, 8 etappes;
route Feldkirch → Glurns (2n) → Valeggio via Trento-stop (2n) → Portico di
Romagna via Ferrara-lunchstop (3n, Brisighella = dagtocht) → Verona (2n,
opera) → Cannobio via Bergamo-lunchstop (2n) → Bergheim → thuis; terugreis
bewust midweek (wo+do, Gotthard buiten het zwarte weekend); Polesine en
Airolo vervallen.

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
- Ankers = etappe 4 (Portico) en 5 (Verona) (rood), hardcoded in `build.py`
  én `app.js`; het opera-blok (titels/data/tijd) in `build.py` hangt aan het
  Verona-nummer.
- Na de reis: fotoronde met eigen materiaal (placeholders per etappe staan klaar).

## Verhuisde projecten

- **OCAI-cultuurmeting Koraal & Via Jeugd** (voorheen onder
  `/koraalenviajeugd/`) is per **2026-06-12** verhuisd naar het eigen
  domein **koraalenviajeugd.nl** en repo
  **`marcovanthiel/koraalenviajeugd`**. Oude URLs worden 301-geredirect
  via `static/_redirects`. Volledige project-CLAUDE.md staat in de
  nieuwe repo.
