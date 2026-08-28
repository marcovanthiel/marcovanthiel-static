# Beeldmateriaal

Alles wat hier staat wordt via `manifest.json` op de pagina gezet. Een lege `file`
betekent: de tegel blijft staan met de gewenste opname erin. Zo is de site vanaf
vandaag te tonen en groeit hij mee.

## Een foto toevoegen

1. Zet het bestand in deze map, bijvoorbeeld `chongqing-liziba.jpg`.
2. Vul in `manifest.json` bij het juiste blok en slot de velden in:

```json
{ "slot": "1", "file": "chongqing-liziba.jpg",
  "alt": "De metro rijdt het flatgebouw binnen bij Liziba",
  "caption": "Liziba, 28 april" }
```

`alt` is voor wie de foto niet kan zien en is niet optioneel. `caption` verschijnt
onderaan de foto en mag weg.

## Een filmpje toevoegen

Eigen bestand:
```json
"video": { "file": "anshun-waterval.mp4", "poster": "anshun-waterval.jpg" }
```

Of een insluiting van YouTube of Vimeo:
```json
"video": { "embed": "https://www.youtube.com/embed/XXXXXXXX", "title": "Huangguoshu" }
```

## Formaat

- Foto's: langste zijde 1600 px, JPEG kwaliteit 80, bij voorkeur onder 300 kB.
- Filmpjes: kort houden, 15 tot 30 seconden, H.264 MP4, onder 10 MB.
  Langere films beter op YouTube of Vimeo zetten en insluiten.

## Rechten

Gebruik eigen foto's. Staat er geen eigen beeld, dan zijn Wikimedia Commons,
Unsplash en Pexels bruikbaar, maar controleer per beeld de licentie en neem de
naamsvermelding over in `caption`. Beeld van reisbureaus, hotelsites of Google
Maps is niet vrij te gebruiken.

Uit het eigen archief valt al veel te halen: de reizen van 2023 en 2025 staan in
Polarsteps, en de oudere albums op Facebook. Chongqing en Anshun kunnen daarmee
meteen gevuld worden, ook al zijn de foto's van een eerdere reis.
