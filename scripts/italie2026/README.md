# Italië 2026 — reiswebsite (marcovanthiel.nl/italie2026)

Statische, eentalige reispagina: routekaart (Leaflet, lokaal gebundeld,
OpenStreetMap-tiles) + tijdlijn van 12 etappes + praktische checklist +
print-CSS (A4-reisdocument). Mobiel en offline-vriendelijk: alle tekst staat
statisch in de HTML; alleen de kaarttiles hebben internet nodig.

## Route aanpassen (hotelstatus, highlights, tijden)

`static/italie2026/route.json` is de **enige bron van waarheid**.

1. Pas `route.json` aan. Hotelstatus: laat de tekst beginnen met
   `geboekt`, `te bevestigen` of `te boeken` — dat bepaalt de kleur van
   het statuslabel (extra toelichting erachter mag, bv.
   `te bevestigen, +39 …`).
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

- Ankers (visueel rood): etappe 5 (Verona/opera) en 8 (Al Vecchio Convento);
  hardcoded als `ANKERS` in `build.py` en `app.js`.
- CSP: `/italie2026/*`-blok in `static/_headers` staat OSM-tiles toe in
  `img-src`. Leaflet staat lokaal in `static/italie2026/vendor/leaflet/`.
- Deploy = push naar `main` (Cloudflare Pages bouwt Hugo; `static/` gaat
  1-op-1 mee). Zelfde patroon als `/wimbledon` en `/felix`.
