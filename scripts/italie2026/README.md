# Italië 2026 — reiswebsite (marcovanthiel.nl/italie2026)

Statische, **tweetalige (NL / 中文)** reispagina: routekaart (Leaflet, lokaal
gebundeld, OpenStreetMap-tiles) + tijdlijn van 8 etappes met per etappe
uitgebreide toeristische info, reisafstand, praktische tips en een
hotel-aanrader (met werkende link) + praktische checklist + print-CSS
(A4-reisdocument). Mobiel en offline-vriendelijk: alle tekst staat statisch
in de HTML; alleen de kaarttiles hebben internet nodig.

**Taalschakelaar** rechtsboven (NL / 中文). Beide talen staan als
`<span class="lang lang-nl">` / `lang-zh` in de HTML; `app.js` zet
`body.toon-zh` en CSS toont de gekozen taal. De keuze wordt **onthouden**
in `localStorage` (`it26_lang`). Geen inline scripts (CSP `script-src 'self'`).

## Route aanpassen (tekst, hotelstatus, highlights, tijden)

`static/italie2026/route.json` is de **enige bron van waarheid**.

**Tekstvelden zijn tweetalige objecten** `{"nl": "…", "zh": "…"}` — vul
altijd béíde talen (bv. `datum`, `rijtijd`, `afstand`, `highlights[*]`,
`honden`, `toerisme`, `info`, `hotel.status`, `hotelsuggestie.beschrijving`,
en `titel`/`periode`/`reizigers`). Plaatsnamen (`van`/`naar`), `coord`,
`hotel.naam`, `hotelsuggestie.naam` en `.url` blijven platte strings.

Per etappe extra velden:
- `afstand` — reisafstand tot de volgende locatie (bv. `{"nl":"≈ 100 km","zh":"≈ 100 公里"}`).
- `toerisme` — uitgebreide toeristische beschrijving.
- `info` — praktische/overige relevante info (verschijnt in het groene kader "Goed om te weten").
- `hotelsuggestie` — `{"naam", "url", "beschrijving":{nl,zh}}`: aanbevolen (hondvriendelijk) hotel met hyperlink. **Verifieer de URL** (moet 200 geven) voor je 'm toevoegt.
- `video` — `{"id":"<youtube-id>", "titel":{nl,zh}}`: sfeervideo van de omgeving, als "klik-om-af-te-spelen"-facade (thumbnail eerst, dan pas de youtube-nocookie-iframe). **Nieuwe video toevoegen/vervangen:**
  1. Kies een YouTube-video en **check dat 'ie embedbaar is** via oEmbed — moet HTTP 200 geven:
     `curl -s -o /dev/null -w "%{http_code}" "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=<ID>"` (401 = embedden uit, 404 = weg/privé → niet gebruiken).
  2. **Host de thumbnail zelf** (geen Google-request bij paginalaad): `curl -f -o static/italie2026/foto/video/<ID>.jpg "https://i.ytimg.com/vi/<ID>/maxresdefault.jpg"` (val terug op `sddefault`/`hqdefault`).
  3. Zet `video` in `route.json`. De CSP (`static/_headers`, `/italie2026/*`-blok) staat `frame-src https://www.youtube-nocookie.com` al toe.
- `hotelsuggestie.prijs` — `{nl,zh}`: verwachte prijs per nacht voor de
  betreffende data, mét controledatum (bv. "vanaf ca. € 190 per nacht
  (gecheckt 6-7-2026)"). Controleren kan via de Booking.com-zoekpagina in
  headless Chrome (volledige binary + normale UA; prijs op de property-card
  is het totaal voor het verblijf) of via de boekingsengine van het hotel
  (Gabbia d'Oro = Octorate). Geen prijs verzinnen: alleen gecontroleerde
  bedragen met datum.
- `hotelsuggestie.foto` — zelfde structuur als `voorbeeldfoto` (klein weergegeven,
  max 420 px): foto van het aangeraden hotel. Promobeeld van het hotel zelf mag,
  mét credit + link naar de hotelsite. Vermeld een gecontroleerde beschikbaarheid
  (datum van de check + vanafprijs) in de `beschrijving`.
- `voorbeeldfoto` — `{"bestand", "breedte", "hoogte", "onderschrift":{nl,zh}, "credit", "creditUrl"}`:
  voorbeeldfoto van de bezienswaardigheid, self-hosted in `static/italie2026/foto/`
  (de CSP staat geen externe afbeeldingen toe). Bron = Wikimedia Commons; de
  bronvermelding (auteur + licentie, gelinkt naar de Commons-pagina) is bij
  CC BY(-SA) **verplicht** en staat in `credit`/`creditUrl`. Foto's zijn 1280 px
  breed, jpegoptim-gecomprimeerd (~250-320 KB), lazy-loaded en verborgen in de
  print-versie. Ontbreekt het veld, dan verschijnt de oude placeholder
  "foto volgt na de reis" — na de reis vervangen door eigen foto's.

1. Pas `route.json` aan. Hotelstatus (`hotel.status.nl`): laat de tekst beginnen met
   `geboekt`, `te bevestigen` of `te boeken` — dat bepaalt de kleur van
   het statuslabel (extra toelichting erachter mag, bv. `te bevestigen, +39 …`).
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

- Ankers (visueel rood): etappe 4 (Al Vecchio Convento) en 5 (Verona/opera);
  hardcoded als `ANKERS` in `build.py` en `app.js` (ook het opera-blok met
  titels/data/aanvangstijd in `build.py` hangt aan het Verona-etappenummer).
  Schuiven de etappes of de opera-avonden, dan schuiven die mee.
- Opera-avonden (bron: officiële Arena-kalender arena.it, geverifieerd
  6-7-2026): za 8 aug Nabucco en zo 9 aug Aida (Zeffirelli), beide 21:00.
- Terugreis bewust midweek (wo 12 + do 13 aug): niet in het weekend rijden;
  rustblok vooraf = 2 nachten Cannobio (Lago Maggiore).
- CSP: `/italie2026/*`-blok in `static/_headers` staat OSM-tiles toe in
  `img-src`. Leaflet staat lokaal in `static/italie2026/vendor/leaflet/`.
- Deploy = push naar `main` (Cloudflare Pages bouwt Hugo; `static/` gaat
  1-op-1 mee). Zelfde patroon als `/wimbledon` en `/felix`.
