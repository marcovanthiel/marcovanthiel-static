# Reiswebsite China 2027: werkinstructie

Deze map bevat de website bij het reisplan China 2027 (24 april tot en met 9 mei 2027,
acht personen, Chongqing → Anshun → Mile → Shenzhen → Guangzhou). Bedoeld voor
marcovanthiel.nl/china2027, in dezelfde lijn als marcovanthiel.nl/italie2026 en
marcovanthiel.nl/biennalevenetie2026.

## Uitgangspunten die niet mogen wijzigen zonder overleg

1. **Statisch en zonder build.** Platte HTML, CSS en JS. Geen framework, geen
   bundler, geen npm-installatie. De site moet werken door de map op een gewone
   webhost te zetten. Dat is bewust: de site wordt tijdens de reis vanaf een
   telefoon of laptop bijgewerkt, soms met slechte verbinding.
2. **Tweetalig Nederlands en Chinees.** Elk tekstelement heeft `data-nl` en
   `data-zh`. Voeg je tekst toe, dan altijd in beide talen. Laat Dandan de
   Chinese tekst nakijken voordat er iets live gaat.
3. **Mobiel eerst.** De site wordt vooral op een telefoon gelezen, ook door
   familie in China. Test op een smalle viewport voordat je iets oplevert.
4. **Geen browseropslag.** Geen localStorage of cookies. De taalkeuze geldt voor
   de sessie.
5. **Namen.** Chen Zanxi, Wu Hengxia, Austin en Brenna staan in Latijns schrift
   omdat de juiste karakters nog niet bekend zijn. Verzin ze niet. Zodra Marco of
   Dandan ze aanlevert, vervangen in beide talen.

## Structuur

```
index.html            alle inhoud, tweetalig via data-attributen
assets/styles.css     ontwerp: tokens bovenaan in :root
assets/app.js         taalwissel en het inlezen van media/manifest.json
assets/route.png      kaart, met matplotlib getekend op Natural Earth-data
media/manifest.json   welke foto's en filmpjes waar horen
media/LEESMIJ.md      hoe je beeld toevoegt
```

## Het ontwerp in het kort

- **Kleuren** komen uit de reis zelf: `--brick` #A8442A is het rode baksteen van
  Dongfengyun, `--pine` #1E6152 het groen van de Guizhou-terrassen en tegelijk de
  kleur van de treinlijn op de kaart. Papier is een koele off-white, geen crème.
- **Typografie**: Noto Serif SC voor koppen, zodat Nederlands en Chinees dezelfde
  stem hebben; Source Sans 3 voor de lopende tekst.
- **Het signatuurelement** is het verticale routelint links van de etappes. Doorgetrokken
  groen betekent trein, onderbroken rood betekent vliegtuig. Dat is dezelfde codering
  als op de kaart. Als je een etappe toevoegt of de volgorde wijzigt, klopt het lint
  alleen als de klasse `by-air` op de juiste sectie staat.

## Beeldmateriaal

Zie `media/LEESMIJ.md`. Kern: eigen foto's hebben de voorkeur, en er staat al veel
in Polarsteps (China 2023 en China 2025) en in de Facebook-albums. Gebruik geen
beeld van hotelsites, reisbureaus of Google Maps. Bij Wikimedia Commons, Unsplash
of Pexels altijd de licentie controleren en de naamsvermelding in `caption` zetten.

Zet nieuwe foto's terug naar maximaal 1600 px op de langste zijde. Filmpjes van
meer dan tien megabyte horen op YouTube of Vimeo en worden ingesloten.

## Wat er nog te doen is

- [ ] Chinese teksten laten nakijken door Dandan (ook de bijschriften en
      notities die er 28-8-2026 bij zijn gekomen).
- [x] Voorlopig beeld toegevoegd (28-8-2026): 11 Commons-foto's + Liziba-video
      met credits; de 8 overgebleven tegels vragen persoonlijke opnames.
- [ ] Eigen archieffoto's (Polarsteps 2023/2025, Facebook) in de tegels
      "archief 2025" zetten en waar gewenst de Commons-beelden vervangen.
- [ ] Hotelprijzen opvragen en per hotel een regel toevoegen; nu staan er bewust
      geen bedragen. (Sterren staan er sinds 28-8-2026 wel: Trip.com-klasse.)
- [ ] Rebrands narekenen bij het boeken: Golden View heet op Trip.com nu Botton
      Meijin, Ramada Plaza Anshun staat er als Xixiu Hotel (Wyndham-merk
      onzeker), Kapok Luohu heet nu Mumian · JdV by Hyatt.
- [ ] Zodra de vluchten geboekt zijn: aankomst- en vertrektijden in de tijdlijn.
- [ ] Overwegen of er een aftelteller bij hoort. Alleen doen als hij rustig blijft;
      geen bewegende cijfers.
- [ ] Na afloop: de tegels vullen met de echte foto's en de gewenste opnames uit
      `index.html` verwijderen.

## Werkwijze bij tekst

Volg de schrijfstijl uit de skill `my-writing-style`: korte zinnen, geen
gedachtestreepjes, geen opsommingen van drie waar twee volstaat, en geen
promotaal. De site beschrijft wat er gaat gebeuren, hij verkoopt niets.

## Publiceren

De map één op één uploaden naar de webruimte van marcovanthiel.nl, in een
submap `china2027`. Er is geen serverconfiguratie nodig. Controleer na het
uploaden of `media/manifest.json` bereikbaar is, want daar hangt de hele
beeldweergave aan.
