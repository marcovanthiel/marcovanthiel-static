---
description: Bouw een contactvel van alle foto's en loop ze visueel na
---

Controleer of elke foto op `/kunstlocaties` werkelijk bij zijn locatie hoort.

## Doe dit

1. `node scripts/kunstlocaties/contactvel.js` — schrijft
   `scripts/kunstlocaties/contactvel.html`: alle foto's op een rij, per land,
   met catalogusnummer, naam en plaats eronder.
2. Open dat bestand en kijk er zelf naar.
   - In een terminal op de Mac: `open scripts/kunstlocaties/contactvel.html`.
   - In een Cowork-sessie: `device_stage_files` de twijfelgevallen naar de
     container en bekijk ze met Read; het contactvel zelf kun je met een
     lokale webserver plus een browsertool in beeld brengen.
3. Let op de drie fouten die dit script structureel maakt:
   - **een logo** in plaats van een foto (og:image van de homepage),
   - **een campagnebeeld** van een tentoonstelling die niets met de plek te maken heeft,
   - **een foto van een heel andere locatie** bij koepelsites en stichtingen.
4. Wat niet deugt: verwijder de entry uit `assets/fotos.js` en het bestand uit
   `static/kunstlocaties/foto/`, en noteer de reden in
   `scripts/kunstlocaties/foto-web-rapport.md`. Of los het op met een eigen foto
   in `foto-bron/<id>.jpg` en draai `fetch-webfotos.js --only=<id> --force`.
5. Rapporteer in gewone taal wat je hebt weggegooid en waarom.

Doe dit vóór elke livegang waarin foto's zijn veranderd. Een verkeerde foto bij
een kunstlocatie is erger dan een leeg vak.
