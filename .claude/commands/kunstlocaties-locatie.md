---
description: Voeg een locatie toe aan /kunstlocaties, inclusief kaart en foto
---

Voeg een nieuwe kunstlocatie toe: `$ARGUMENTS`

## Doe dit

1. Zoek de plek op en verzamel: officiële site, wie/wat (kunstenaar, architect,
   oprichter, jaar), waarom het bijzonder is, openingstijden en reservering,
   hondenbeleid, en de coördinaten van de plaats.
2. Voeg een record toe aan `static/kunstlocaties/assets/data.js`, op de juiste
   plek: de volgorde in het bestand bepaalt de volgorde op de pagina (per land,
   per regio, noord naar zuid). Velden staan in `static/kunstlocaties/AGENTS.md`.
3. Geef het een catalogusnummer dat aansluit op de reeks van dat land
   (`IT-70`, `FR-31`). Hernummer nooit bestaande records: die nummers staan in
   URL's en in het reisdossier.
4. Controleer dat de coördinaat in het goede land ligt:
   ```
   node -e "const d3=require('d3-geo'),tc=require('topojson-client');const t=require('world-atlas/countries-50m.json');const g=tc.feature(t,t.objects.countries);const p=[LON,LAT];console.log((g.features.find(f=>d3.geoContains(f,p))||{properties:{}}).properties.name)"
   ```
5. `cd scripts/kunstlocaties && node build-map.js` — kaartdata opnieuw.
6. `node fetch-webfotos.js --only=<nieuw nummer>` en schouw de foto.
7. Hoog de `?v=` in `static/kunstlocaties/index.html` op — anders serveert
   Cloudflare vijf minuten lang de oude `data.js`.
8. Werk het reisdossier bij: `reizen/kunstlocaties-midden-en-zuid-europa.md` in
   het Claude-project *Reizen* is de inhoudelijke bron, de site is de weergave.
9. Commit en draai `/deploy-check`.
