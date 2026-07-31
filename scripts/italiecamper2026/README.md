# Italië camper 2026 — reiswebsite (marcovanthiel.nl/italiecamper2026)

**Reisvoorstel voor Nel** (vriendin van Marco; zij moet de reis nog boeken):
zelfde route, data en dagindeling als `/italie2026`, maar de hotels zijn
vervangen door **campings met goede en mooie faciliteiten** (bewust géén
camperplaatsen/sosta's — die zijn vaak achteraf met alleen een stekker).
Toon = voorstel (label "Voorgestelde camping", blok "Voor Nel", geen
aftelbadge). Elke camping heeft een `camping.prijs`-veld {nl,zh} met prijs-
en boekingsinformatie **mét controledatum** (31-7-2026). Bijzonderheden:
Riviera Cannobio reserveert pas vanaf 10 nachten en Eigernordwand neemt in
de zomer geen reserveringen aan (vroeg aankomen); hu Altomincio bleek geen
staanplaatsen meer te hebben en is 31-7-2026 vervangen door Camping Bella
Italia (Peschiera). Gemaakt 30-7-2026; links geverifieerd (HTTP 200).

## Verschillen met /italie2026

- `route.json` heeft per etappe een veld **`camping`** `{naam, url,
  beschrijving:{nl,zh}, prijs:{nl,zh}}` in plaats van `hotel`/`hotelsuggestie`;
  het label op de pagina is "Voorgestelde camping". Honden-/oppasteksten zijn
  verwijderd (de reiziger reist zonder honden).
- **Etappe 4 is Verona zelf** (niet Valpolicella): Verona City Camping –
  Castel San Pietro ligt op de heuvel boven de stad, een kwartier lopen van
  de Arena, dus de camper blijft op de opera-avonden gewoon staan.
- Etappe 3 kampeert in **San Benedetto in Alpe** (Camping Acquacheta, 5 min
  van Portico); Al Vecchio Convento blijft als restauranttip.
- Etappe 7 kampeert in **Ribeauvillé** (Pierre de Coubertin, 5 min rijden
  van Bergheim).
- Het blok "Hitteprotocol honden" heet hier "Camperpraktisch" (vignetten,
  ver-/ontzorgen, reserveren).

## Gedeeld met /italie2026 (niet dupliceren!)

- **Assets**: `style.css`, `app.js`, Leaflet-vendor, foto's en
  videothumbnails worden geladen van `/italie2026/...` (absolute paden in
  template + build.py). Cachebust-bumps gebeuren dus in
  `scripts/italie2026/template.html` én hier in `template.html` (zelfde
  verwijzing).
- **Weer**: `build.py` leest `static/italie2026/weer.json` (zelfde plaatsen
  en data, op etappe 4 na een verwaarloosbaar verschil Bussolengo↔Verona).
  Geen eigen weer-pipeline.
- **Workflows**: `italie2026-build.yml` en `italie2026-weer.yml` bouwen ook
  deze site (extra buildstap + paden); geen eigen workflow.
- **CSP**: eigen `/italiecamper2026/*`-blok in `static/_headers`, identiek
  aan het italie2026-blok.

## Onderhoud

`static/italiecamper2026/route.json` aanpassen (beide talen!) → push →
Action bouwt `index.html`. Nooit `index.html` met de hand bewerken.
Structuurwijzigingen: `scripts/italiecamper2026/template.html` + `build.py`
(gekopieerd van italie2026; wijzigingen daar waar relevant hier ook
doorvoeren — bewuste duplicatie van een klein bestand).
