# Italië 2026 — reiswebsite (marcovanthiel.nl/italie2026)

Statische, **tweetalige (NL / 中文)** REISGIDS (sinds 22-7-2026, ook voor het
thuisfront): routekaart (Leaflet, lokaal gebundeld, OpenStreetMap-tiles),
een **"Dag tot dag"-overzicht** (per reisdag waar we zijn en wat we vermoedelijk
doen; app.js markeert de rij van vandaag en de herobadge toont "dag X van 15"),
en een tijdlijn van 8 etappes met toeristische info, reisafstand, tips en het
hotel waar we slapen (naam + link, bewust ZONDER prijzen of boekingsstatussen)
+ print-CSS (A4-reisdocument). Mobiel en offline-vriendelijk: alle tekst staat
statisch in de HTML; alleen de kaarttiles hebben internet nodig.

**Taalschakelaar** rechtsboven (NL / 中文). Beide talen staan als
`<span class="lang lang-nl">` / `lang-zh` in de HTML; `app.js` zet
`body.toon-zh` en CSS toont de gekozen taal. De keuze wordt **onthouden**
in `localStorage` (`it26_lang`). Geen inline scripts (CSP `script-src 'self'`).

## Route aanpassen (tekst, hotels, highlights, tijden)

`static/italie2026/route.json` is de **enige bron van waarheid**.

**Tekstvelden zijn tweetalige objecten** `{"nl": "…", "zh": "…"}` — vul
altijd béíde talen (bv. `datum`, `rijtijd`, `afstand`, `highlights[*]`,
`honden`, `toerisme`, `info`, `hotelsuggestie.beschrijving`,
en `titel`/`periode`/`reizigers`). Plaatsnamen (`van`/`naar`), `coord`,
`hotel.naam`, `hotelsuggestie.naam` en `.url` blijven platte strings.

Per etappe extra velden:
- `afstand` — reisafstand tot de volgende locatie (bv. `{"nl":"≈ 100 km","zh":"≈ 100 公里"}`).
- `toerisme` — uitgebreide toeristische beschrijving.
- `info` — praktische/overige relevante info (verschijnt in het kader "Goed om te weten").
- `hotelsuggestie` — `{"naam", "url", "beschrijving":{nl,zh}}`: het hotel waar we slapen, met hyperlink en korte typering; géén prijzen, scores of beschikbaarheid (reisgids-toon). **Verifieer de URL** (moet 200 geven) voor je 'm toevoegt.
- `video` — `{"id":"<youtube-id>", "titel":{nl,zh}}`: sfeervideo van de omgeving. Sinds 18-7-2026 **autoplay-met-geluid bij scrollen**: de facade (self-hosted thumbnail) wordt vervangen door de youtube-nocookie-iframe zodra het blok ≥60% in beeld is; volledig uit beeld = pauze; nooit twee tegelijk (besturing via de YouTube-postMessage-API, `enablejsapi=1`, geen extern script — CSP blijft `script-src 'self'`). Kanttekening: browsers kunnen geluid-autoplay blokkeren tot de eerste klik/tik op de pagina; `app.js` probeert het spelende filmpje dan opnieuw bij de eerste interactie, en klikken op de facade werkt altijd. Het geluid start gedempt op 25% (`VOLUME` boven in sectie 2 van `app.js`; YouTube begint anders op 100%) — wie in de speler harder zet wordt niet overschreven. **Nieuwe video toevoegen/vervangen:**
  1. Kies een YouTube-video en **check dat 'ie embedbaar is** via oEmbed — moet HTTP 200 geven:
     `curl -s -o /dev/null -w "%{http_code}" "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=<ID>"` (401 = embedden uit, 404 = weg/privé → niet gebruiken).
  2. **Host de thumbnail zelf** (geen Google-request bij paginalaad): `curl -f -o static/italie2026/foto/video/<ID>.jpg "https://i.ytimg.com/vi/<ID>/maxresdefault.jpg"` (val terug op `sddefault`/`hqdefault`).
  3. Zet `video` in `route.json`. De CSP (`static/_headers`, `/italie2026/*`-blok) staat `frame-src https://www.youtube-nocookie.com` al toe.
- `lint` (alleen de ankers) — `{nl,zh}`: het rode hoek-lintje op het kaartje ("Opera"/"Hoogtepunt").

**Top-level velden in `route.json`** (naast `titel`/`periode`/`reizigers`/`etappes`):
- `hero` — `{"bestand", "credit", "creditUrl", "onderschrift":{nl,zh}}`: de sfeerfoto bovenaan (self-hosted in `foto/`, verklein tot ~1920px). Als je 'm vervangt: nieuwe foto in `foto/`, `hero.bestand` bijwerken, credit invullen.
- `overzicht` — lijst statbalk-cijfers: `{"waarde":<getal>, "prefix"?, "suffix"?, "label":{nl,zh}}`. `app.js` telt de getallen op bij binnenkomst (count-up). Getallen met de hand bijhouden (bv. totale km = som van de `afstand`-velden).
- `dagen` — lijst van 15 reisdagen voor het "Dag tot dag"-overzicht:
  `{"datum":"2026-08-01", "etappe":<nr>, "label":{nl,zh}, "tekst":{nl,zh}}`.
  De `datum` (ISO) stuurt de vandaag-markering in app.js; `etappe` maakt de
  datum klikbaar naar het bijbehorende kaartje. Wijzigt het programma
  onderweg, werk dan de betreffende dagtekst bij (kan via github.com).
- `hotelsuggestie.foto` — zelfde structuur als `voorbeeldfoto` (klein weergegeven,
  max 420 px): foto van het aangeraden hotel. Promobeeld van het hotel zelf mag,
  mét credit + link naar de hotelsite.
- `voorbeeldfoto` — `{"bestand", "breedte", "hoogte", "onderschrift":{nl,zh}, "credit", "creditUrl"}`:
  voorbeeldfoto van de bezienswaardigheid, self-hosted in `static/italie2026/foto/`
  (de CSP staat geen externe afbeeldingen toe). Bron = Wikimedia Commons; de
  bronvermelding (auteur + licentie, gelinkt naar de Commons-pagina) is bij
  CC BY(-SA) **verplicht** en staat in `credit`/`creditUrl`. Foto's zijn 1280 px
  breed, jpegoptim-gecomprimeerd (~250-320 KB), lazy-loaded en verborgen in de
  print-versie. Ontbreekt het veld, dan verschijnt de oude placeholder
  "foto volgt na de reis" — na de reis vervangen door eigen foto's.

1. Pas `route.json` aan (beide talen!).
2. Commit + push naar `main`. De GitHub Action **italie2026-build**
   regenereert `index.html` automatisch en Cloudflare Pages deployt.
   Onderweg kan dit dus gewoon via github.com of de GitHub-app.

Lokaal bouwen (optioneel, bv. om direct te bekijken):

```bash
python3 scripts/italie2026/build.py     # route.json + template.html -> index.html
cd static/italie2026 && python3 -m http.server 8080
```

`index.html` is een **gegenereerd bestand** — niet met de hand bewerken.
Structuur- of stijlwijzigingen horen in `scripts/italie2026/template.html`,
`static/italie2026/assets/style.css` of `assets/app.js` (bump dan de
`?v=`-cachebuster op de css/js-verwijzing in het template).

## Vaste gegevens

- Ankers (visueel oranje): etappe 3 (Al Vecchio Convento) en 4 (Valpolicella/
  opera); hardcoded als `ANKERS` in `build.py` en `app.js` (ook het opera-blok
  met titels/data/aanvangstijd in `build.py` hangt aan het etappenummer).
  Schuiven de etappes of de opera-avonden, dan schuiven die mee.
- Opera-avonden (bron: officiële Arena-kalender arena.it, geverifieerd
  6-7-2026): vr 7 aug Turandot en zo 9 aug Aida (Zeffirelli), beide 21:00.
  Overnachting in een agriturismo bij Bussolengo (~20 min van de Arena);
  honden blijven tijdens de opera met de hondenoppas in het agriturismo.
- Terugreis: do 13 aug over de Grimsel-/Sustenpas naar Grindelwald
  (bergnacht), vr 14 aug via Bern en Basel naar Bergheim, za 15 aug thuis;
  rustblok vooraf = 3 nachten Cannobio. Geen Gotthard-tunnel op vrijdag.
- CSP: `/italie2026/*`-blok in `static/_headers` staat OSM-tiles toe in
  `img-src`. Leaflet staat lokaal in `static/italie2026/vendor/leaflet/`.
- Deploy = push naar `main` (Cloudflare Pages bouwt Hugo; `static/` gaat
  1-op-1 mee). Zelfde patroon als `/wimbledon` en `/felix`.
