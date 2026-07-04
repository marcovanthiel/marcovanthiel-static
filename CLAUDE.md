# CLAUDE.md — marcovanthiel-static

Hugo-hoofdsite (5 talen, NL/EN/DE/IT/zh-CN) + subsites (Biennale 2026,
Fundraising, Manifest, Zilvermanagement, Felix-presentatie). Zie `README.md`
voor stack en build-details.

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

**Databronnen** (beide gratis, geen key):
- **ESPN scoreboard-API** (`site.api.espn.com/.../tennis/atp/scoreboard`): enkelspel
  heren/dames + speeltijden/banen/uitslagen/live standen/vlaggen. De ESPN-volgorde is
  NIET de loting-volgorde; daarom staat de laatste-32-loting van MS/LS als
  `SEED_R32` in `update.py` en worden uitslagen op genormaliseerde naam gematcht.
- **wimbledon.com draw-feeds** (`/en_GB/scores/feeds/2026/draws/{MD,LD,MX,BS,GS}.json`):
  dubbels + junioren in loting-volgorde (`match_id` oplopend). De MS/LS-feeds zijn
  door Akamai afgeschermd (302 naar robots.txt) — óók voor echte browsers; niet
  proberen te scrapen, de seed + ESPN volstaat.

**Tv-logica NL** (bron: WBD-persbericht Wimbledon 2026, `tv_kanaal()` in update.py):
HBO Max streamt alle banen; Eurosport 1/2 lineair (Centre Court); **Court No. 1 is
t/m de achtste finales exclusief bij Ziggo Sport**; vanaf de halve finales alles overal.

**CSP**: de pagina heeft één inline `<script>`; `static/_headers` bevat daarom een
`/wimbledon/*`-blok dat de site-CSP vervangt (`! Content-Security-Policy` +
versie met `'unsafe-inline'`). Niet weghalen, anders doen de tabs niets.

**Onderhoud**: het script stopt zichzelf na 2026-07-13 (EINDDATUM); daarna de
workflow `wimbledon-hourly.yml` verwijderen (en evt. de hele subsite archiveren).
Bracket-fout in het enkelspel = `SEED_R32` in `update.py` corrigeren.

## Verhuisde projecten

- **OCAI-cultuurmeting Koraal & Via Jeugd** (voorheen onder
  `/koraalenviajeugd/`) is per **2026-06-12** verhuisd naar het eigen
  domein **koraalenviajeugd.nl** en repo
  **`marcovanthiel/koraalenviajeugd`**. Oude URLs worden 301-geredirect
  via `static/_redirects`. Volledige project-CLAUDE.md staat in de
  nieuwe repo.
