# Draaiboek — subsite /kunstlocaties opnieuw bouwen

Wat je nodig hebt om de subsite van niets tot live te krijgen, in de volgorde
waarin het moet. Bedoeld voor een Claude Code-sessie die de map niet kent.

Lees eerst `static/kunstlocaties/AGENTS.md` — daar staan de beslissingen en het
datamodel. Dit draaiboek is de volgorde, dat bestand is de inhoud.

## 0. Waar het vandaan komt

De inhoudelijke bron is **niet** deze repo maar het Claude-project *Reizen*,
bestand `reizen/kunstlocaties-midden-en-zuid-europa.md`: 217 locaties met naam,
plaats, regio, soort, wie/wat, waarom bijzonder, praktische informatie, officiële
URL, hondenbeleid en seizoen. Wijzigingen in de inhoud gaan daar eerst.

De site is de weergave. Raakt `data.js` kwijt, dan is dat dossier het origineel.

## 1. Data

`static/kunstlocaties/assets/data.js` — `window.KUNSTLOCATIES`, één regel JSON
per record. Velden staan in `AGENTS.md`. Twee dingen die makkelijk misgaan:

- **De volgorde in het bestand is de volgorde op de pagina.** Gesorteerd per
  land (zoals in `LANDEN` in `app.js`), daarbinnen per regio in de volgorde
  waarin de regio's voor het eerst voorkomen, ruwweg noord naar zuid.
- **Catalogusnummers (`id`) zijn vast.** `IT-01` tot `CZ-09`. Ze staan in URL's,
  in bestandsnamen van foto's en in het reisdossier. Nooit hernummeren.

Coördinaten (`ll: [lengte, breedte]`) staan op plaatsniveau. Controleer nieuwe
coördinaten met een point-in-polygon-test tegen de landsgrenzen; acht
kustlocaties (Venetië, Ancona, Porquerolles, Cap-Ferrat, Cascais) vallen in de
vereenvoudigde kustlijn net in zee, dat klopt en hoeft niet "gerepareerd".

## 2. Kaartdata

```
cd scripts/kunstlocaties && npm install && npm run kaart
```

Schrijft `assets/mapdata.js` (~150 kB) uit Natural Earth 1:50 m. Geen kaartdienst,
geen tiles: dat houdt de CSP op `'self'` en de plaat in de eigen huisstijl.
Details in `AGENTS.md` onder **De kaart**.

## 3. Foto's

```
npm run fotos            # promobeeld van de eigen website van elke locatie
npm run fotos -- --dry   # eerst kijken wat eruit komt
npm run contactvel       # contactvel om te schouwen
```

Beeldregel: promobeeld van een aanbevolen partij mag, met credit en link. Maker =
domein, licentie = "website van de locatie", bron = de pagina. Eigen foto's in
`foto-bron/<id>.jpg` gaan vóór. Er ligt ook nog `fetch-fotos.js`, de oudere
Wikimedia Commons-route (alleen vrije licenties) — niet de standaardroute meer,
wel bruikbaar als je bewust vrij gelicentieerd beeld wilt.

**Schouw altijd.** Zie `/kunstlocaties-schouwen`.

## 4. Opmaak

Eén vaste wereld, richting "machine": zie `docs/webstijl-machine.md`. Fonts zijn
self-hosted in `assets/fonts/` (Anton, IBM Plex Mono, Fontsource, SIL OFL);
vervangen gaat met `npm i @fontsource/anton @fontsource/ibm-plex-mono` en de
woff2's uit `files/` kopiëren.

## 5. Live

`/deploy-check`. Let op de Cloudflare-gotcha bovenaan `CLAUDE.md`, en op de
`?v=`-cachebusters in `index.html`: verander je `data.js`, `mapdata.js`,
`fotos.js`, `app.js` of `styles.css`, hoog dan de versie op, anders serveert
Cloudflare vijf minuten lang het oude bestand.

## 6. Wat een Cowork-sandbox niet kan

Deze subsite is voor een groot deel gebouwd vanuit een Cowork-sessie. Wat daar
níét werkt, zodat een volgende sessie er niet opnieuw tegenaan loopt:

| Wil je | Lukt het? |
|---|---|
| `git push` | Nee — geen GitHub-credentials in de sandbox. Commit wel, laat Marco pushen |
| Wikimedia, Google Fonts, marcovanthiel.nl bereiken | Nee — proxy geeft 403 |
| npm en github.com bereiken | Ja |
| Bestanden verwijderen in de repo | Alleen na `device_request_delete_permission` |
| Lang script draaien | Nee — `device_bash` kapt af rond 45 seconden; knip het op |
| De pagina bekijken | Alleen door de bestanden te stagen naar de container en daar een lokale webserver plus Playwright te draaien |

Kun je iets niet, zeg het dan en geef het commando door. Niet half doen en
"gelukt" rapporteren.
