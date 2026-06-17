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

## Verhuisde projecten

- **OCAI-cultuurmeting Koraal & Via Jeugd** (voorheen onder
  `/koraalenviajeugd/`) is per **2026-06-12** verhuisd naar het eigen
  domein **koraalenviajeugd.nl** en repo
  **`marcovanthiel/koraalenviajeugd`**. Oude URLs worden 301-geredirect
  via `static/_redirects`. Volledige project-CLAUDE.md staat in de
  nieuwe repo.
