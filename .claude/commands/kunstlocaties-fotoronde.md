---
description: Draai een fotoronde voor /kunstlocaties en schouw het resultaat
---

Vul de ontbrekende foto's van de subsite `/kunstlocaties` aan.

Argument (optioneel): `$ARGUMENTS` — catalogusnummers, bijvoorbeeld `IT-19,ES-06`.
Zonder argument: alleen wat nog geen foto heeft.

## Doe dit

1. Lees eerst `static/kunstlocaties/AGENTS.md`, hoofdstuk **Foto's** — daar staat
   het beeldbeleid en de lijst met bekende uitzonderingen. Wijk daar niet van af.
2. Bepaal wat er ontbreekt: vergelijk de sleutels van `window.KUNSTFOTOS` in
   `static/kunstlocaties/assets/fotos.js` met de `id`'s in `assets/data.js`.
3. Draai eerst droog, en laat de uitkomst zien voordat je iets wegschrijft:
   ```
   cd scripts/kunstlocaties && npm install && node fetch-webfotos.js --dry
   ```
4. Ziet het er goed uit, draai dan echt (met `--only=` als er een argument is).
5. **Schouw altijd voordat je commit.** Draai `/kunstlocaties-schouwen`. Een
   og:image is vaak een logo, een campagnebeeld of een plaatje van iets anders;
   het script kan dat niet zien, jij wel.
6. Werk `scripts/kunstlocaties/foto-web-rapport.md` bij en zet de resterende
   uitzonderingen met reden in `static/kunstlocaties/AGENTS.md`.
7. Commit met een boodschap die zegt hoeveel erbij kwamen en wat er overblijft.

## Randvoorwaarden

- Netwerk nodig. In een Cowork-sandbox lukt dit niet: die komt niet buiten de
  eigen proxy. Zeg dat dan en stop, in plaats van het half te doen.
- Eigen foto's gaan vóór: `scripts/kunstlocaties/foto-bron/<id>.jpg`.
- Credits zijn verplicht. Maker = domein, licentie = "website van de locatie",
  bron = de pagina. Verzin nooit een licentie die je niet hebt gecontroleerd.
- Niets wat je niet kunt verantwoorden: liever een gearceerd vlak dan een foto
  waarvan je niet weet of hij bij de locatie hoort.
