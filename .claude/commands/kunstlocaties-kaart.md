---
description: Bouw de kaartdata van /kunstlocaties opnieuw
---

Genereer `static/kunstlocaties/assets/mapdata.js` opnieuw uit Natural Earth.

```
cd scripts/kunstlocaties && npm install && node build-map.js
```

Daarna: hoog de `?v=` in `static/kunstlocaties/index.html` op, en controleer in
de browser dat de kaart nog klopt — landen op hun plek, 217 stippen, zoomen en
schuiven heel, labels die bij hoge zoom verschijnen.

Wat het script doet en waarom, staat in `static/kunstlocaties/AGENTS.md` onder
**De kaart**. Twee dingen om niet te vergeten als je eraan sleutelt:

- de tolerantie van de vereenvoudiging bepaalt de bestandsgrootte; 0,45 voor de
  elf landen en 0,9 voor de buren houdt het rond de 150 kB,
- stippen, richtkruis en liniaal worden tegengeschaald zodat ze bij elk
  zoomniveau even groot blijven. Raak die berekening niet aan zonder te testen.
