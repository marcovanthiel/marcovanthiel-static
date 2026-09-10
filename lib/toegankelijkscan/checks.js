// Zet verzamelde paginadata om in bevindingen met ernst, uitleg en oplossing.

const VAGE_TEKSTEN = [
  "klik hier", "lees meer", "lees verder", "meer info", "meer informatie",
  "hier", "meer", "bekijk", "read more", "click here", "more",
];

export function evaluate(data) {
  const findings = [];
  const add = (f) => findings.push(f);

  // 1. Taal van de pagina
  if (!data.htmlLang || !data.htmlLang.trim()) {
    add({
      ernst: "kritiek", weging: 8, wcag: "3.1.1 (A)",
      titel: "De taal van de pagina ontbreekt",
      uitleg: "Het html-element heeft geen lang-attribuut. Voorleessoftware weet daardoor niet in welke taal de pagina moet worden voorgelezen en spreekt Nederlandse tekst bijvoorbeeld op zijn Engels uit.",
      fix: 'Voeg lang="nl" toe aan het html-element.',
    });
  }

  // 2. Paginatitel
  if (!data.sawTitle || !data.title.trim()) {
    add({
      ernst: "kritiek", weging: 8, wcag: "2.4.2 (A)",
      titel: "De pagina heeft geen titel",
      uitleg: "Zonder title-element weten bezoekers met voorleessoftware niet op welke pagina ze zijn. De titel is ook wat in het browsertabblad en in zoekresultaten staat.",
      fix: "Voeg een beschrijvend title-element toe in de head van de pagina.",
    });
  }

  // 3. Zoomen geblokkeerd
  if (data.viewport) {
    const v = data.viewport.toLowerCase();
    const maxScale = v.match(/maximum-scale\s*=\s*([\d.]+)/);
    const blocked = /user-scalable\s*=\s*(no|0)/.test(v) || (maxScale && parseFloat(maxScale[1]) < 2);
    if (blocked) {
      add({
        ernst: "kritiek", weging: 8, wcag: "1.4.4 (AA)",
        titel: "Inzoomen is geblokkeerd op mobiel",
        uitleg: "De viewport-instelling verbiedt zoomen. Slechtziende bezoekers kunnen de tekst daardoor niet vergroten.",
        fix: "Verwijder user-scalable=no en maximum-scale uit de viewport-metatag.",
      });
    }
  }

  // 4. Afbeeldingen zonder alternatieve tekst
  if (data.imgs.missingAlt > 0) {
    add({
      ernst: "kritiek", weging: 12, wcag: "1.1.1 (A)", aantal: data.imgs.missingAlt,
      titel: `${data.imgs.missingAlt} ${data.imgs.missingAlt === 1 ? "afbeelding heeft" : "afbeeldingen hebben"} geen alternatieve tekst`,
      uitleg: "Afbeeldingen zonder alt-attribuut zijn onzichtbaar voor blinde en slechtziende bezoekers. Voorleessoftware leest dan de bestandsnaam voor of slaat de afbeelding over.",
      fix: 'Geef elke informatieve afbeelding een beschrijvende alt-tekst. Puur decoratieve afbeeldingen krijgen een leeg alt-attribuut (alt="").',
      voorbeelden: data.imgs.samples,
    });
  }

  // 5. Formuliervelden zonder label
  const unlabeled = data.controls.filter(
    (c) => !c.nestedLabel && !c.aria && !(c.id && data.labelFor.includes(c.id))
  );
  if (unlabeled.length > 0) {
    add({
      ernst: "kritiek", weging: 12, wcag: "1.3.1 / 3.3.2 (A)", aantal: unlabeled.length,
      titel: `${unlabeled.length} ${unlabeled.length === 1 ? "formulierveld heeft" : "formuliervelden hebben"} geen label`,
      uitleg: "Invoervelden zonder gekoppeld label zijn voor voorleessoftware naamloos. Bezoekers weten dan niet wat ze moeten invullen. Een placeholder alleen is niet voldoende.",
      fix: "Koppel aan elk veld een label-element (via for/id), of gebruik aria-label als een zichtbaar label echt niet past.",
      voorbeelden: unlabeled.slice(0, 5).map((c) => c.kind + (c.name ? ` (name=${c.name})` : "")),
    });
  }

  // 6. Lege links
  const emptyLinks = data.links.filter(
    (l) => !l.hidden && l.href && !l.href.startsWith("javascript:") &&
      !l.text.trim() && !l.aria && !l.imgAlt
  );
  if (emptyLinks.length > 0) {
    add({
      ernst: "kritiek", weging: 10, wcag: "2.4.4 (A)", aantal: emptyLinks.length,
      titel: `${emptyLinks.length} ${emptyLinks.length === 1 ? "link is" : "links zijn"} leeg voor voorleessoftware`,
      uitleg: "Links zonder tekst, zonder aria-label en zonder afbeeldings-alt worden voorgelezen als 'link' zonder verdere uitleg. Vaak zijn dit icoon-links (social media, winkelwagen, zoeken).",
      fix: "Geef icoon-links een aria-label, of een afbeelding met alt-tekst.",
      voorbeelden: emptyLinks.slice(0, 5).map((l) => l.href.slice(0, 80)),
    });
  }

  // 7. Lege knoppen
  const emptyButtons = data.buttons.filter((b) => !b.hidden && !b.text.trim() && !b.aria && !b.imgAlt);
  if (emptyButtons.length > 0) {
    add({
      ernst: "kritiek", weging: 8, wcag: "4.1.2 (A)", aantal: emptyButtons.length,
      titel: `${emptyButtons.length} ${emptyButtons.length === 1 ? "knop is" : "knoppen zijn"} leeg voor voorleessoftware`,
      uitleg: "Knoppen zonder tekst of aria-label (bijvoorbeeld een hamburger-menu of een sluitknop met alleen een icoon) zijn niet te begrijpen met voorleessoftware.",
      fix: "Geef elke icoon-knop een aria-label, bijvoorbeeld aria-label=\"Menu openen\".",
    });
  }

  // 8. Koppenstructuur
  const h1s = data.headings.filter((h) => h === 1).length;
  let skipped = false;
  let prev = 0;
  for (const h of data.headings) {
    if (prev > 0 && h > prev + 1) skipped = true;
    prev = h;
  }
  if (data.headings.length > 0 && h1s === 0) {
    add({
      ernst: "waarschuwing", weging: 5, wcag: "1.3.1 (A)",
      titel: "De pagina heeft geen hoofdkop (h1)",
      uitleg: "Bezoekers met voorleessoftware navigeren vaak via koppen. Zonder h1 ontbreekt het startpunt van de pagina.",
      fix: "Geef de pagina precies één h1 die de inhoud beschrijft.",
    });
  } else if (h1s > 1) {
    add({
      ernst: "advies", weging: 2, wcag: "1.3.1 (A)",
      titel: `De pagina heeft ${h1s} hoofdkoppen (h1)`,
      uitleg: "Meerdere h1-koppen maken de structuur onduidelijk. Gebruik er één per pagina.",
      fix: "Maak van de overige hoofdkoppen h2 of lager.",
    });
  }
  if (skipped) {
    add({
      ernst: "advies", weging: 3, wcag: "1.3.1 (A)",
      titel: "De koppenstructuur slaat niveaus over",
      uitleg: "Er wordt bijvoorbeeld van h2 direct naar h4 gesprongen. Dat verwart bezoekers die op koppen navigeren.",
      fix: "Bouw koppen logisch op: h1, daaronder h2, daaronder h3, zonder niveaus over te slaan.",
    });
  }

  // 9. Iframes zonder titel
  if (data.iframes.untitled > 0) {
    add({
      ernst: "waarschuwing", weging: 5, wcag: "4.1.2 (A)", aantal: data.iframes.untitled,
      titel: `${data.iframes.untitled} ${data.iframes.untitled === 1 ? "iframe heeft" : "iframes hebben"} geen titel`,
      uitleg: "Ingesloten inhoud (video, kaart, formulier) zonder title-attribuut is voor voorleessoftware een naamloos blok.",
      fix: 'Geef elk iframe een beschrijvende titel, bijvoorbeeld title="Videopresentatie".',
    });
  }

  // 10. Positieve tabindex
  if (data.tabindexPositive > 0) {
    add({
      ernst: "waarschuwing", weging: 4, wcag: "2.4.3 (A)", aantal: data.tabindexPositive,
      titel: "Er wordt een positieve tabindex gebruikt",
      uitleg: "tabindex-waarden groter dan 0 breken de natuurlijke toetsenbordvolgorde. Toetsenbordgebruikers springen dan onverwacht door de pagina.",
      fix: "Gebruik alleen tabindex=\"0\" of tabindex=\"-1\" en laat de volgorde uit de HTML-structuur volgen.",
    });
  }

  // 11. Autoplay
  if (data.autoplayMedia > 0) {
    add({
      ernst: "waarschuwing", weging: 4, wcag: "1.4.2 / 2.2.2 (A)",
      titel: "Media start automatisch zonder bedieningsknoppen",
      uitleg: "Automatisch startende audio of video zonder pauzeknop stoort voorleessoftware en is voor veel bezoekers hinderlijk.",
      fix: "Voeg bedieningsknoppen toe (controls) of laat media niet automatisch starten.",
    });
  }

  // 12. Dubbele id's
  if (data.ids.length > 0) {
    add({
      ernst: "advies", weging: 3, wcag: "4.1.1 (A)", aantal: data.ids.length,
      titel: `${data.ids.length} ${data.ids.length === 1 ? "id komt" : "id's komen"} meerdere keren voor`,
      uitleg: "Dubbele id's kunnen label-koppelingen en ARIA-verwijzingen breken.",
      fix: "Maak elk id uniek op de pagina.",
      voorbeelden: data.ids.slice(0, 5).map(([id, n]) => `${id} (${n} keer)`),
    });
  }

  // 13. Vage linkteksten
  const vague = data.links.filter((l) => {
    const t = l.text.trim().toLowerCase().replace(/\s+/g, " ");
    return t && VAGE_TEKSTEN.includes(t) && !l.aria;
  });
  if (vague.length > 0) {
    add({
      ernst: "advies", weging: 3, wcag: "2.4.4 (A)", aantal: vague.length,
      titel: `${vague.length} ${vague.length === 1 ? "link heeft" : "links hebben"} een nietszeggende tekst`,
      uitleg: "Teksten als 'klik hier' of 'lees meer' zeggen niets als ze los worden voorgelezen. Bezoekers met voorleessoftware bladeren vaak door een lijst met alleen de links.",
      fix: "Maak linkteksten beschrijvend, bijvoorbeeld 'Lees meer over onze retourvoorwaarden'.",
    });
  }

  // 14. Skip-link
  const firstAnchors = data.links.slice(0, 5).filter((l) => (l.href || "").startsWith("#"));
  const hasSkip = firstAnchors.some((l) =>
    /(inhoud|content|main|overslaan|skip|navigatie)/i.test(l.text + " " + l.aria + " " + l.href)
  );
  if (!hasSkip) {
    add({
      ernst: "advies", weging: 3, wcag: "2.4.1 (A)",
      titel: "Er lijkt geen snelkoppeling naar de inhoud te zijn",
      uitleg: "Een skip-link ('Direct naar inhoud') als eerste element laat toetsenbordgebruikers het menu overslaan. Zonder die link moeten ze bij elke pagina door het hele menu tabben.",
      fix: 'Plaats als eerste element in de body een link naar het hoofdinhoud-element, bijvoorbeeld <a href="#inhoud">Direct naar inhoud</a>.',
    });
  }

  // 15. Toegankelijkheidsverklaring
  const hasStatement = data.links.some((l) =>
    /toegankelijk|accessibility/i.test((l.text || "") + " " + (l.href || ""))
  );
  if (!hasStatement) {
    add({
      ernst: "waarschuwing", weging: 8, wcag: "EAA-vereiste",
      titel: "Geen link naar een toegankelijkheidsverklaring gevonden",
      uitleg: "De European Accessibility Act verplicht dienstverleners om te publiceren hoe hun dienst aan de toegankelijkheidseisen voldoet. Op deze pagina is geen link naar zo'n verklaring gevonden.",
      fix: "Publiceer een toegankelijkheidsverklaring en link ernaar vanuit de footer van elke pagina.",
    });
  }

  const ernstRang = { kritiek: 0, waarschuwing: 1, advies: 2 };
  findings.sort((a, b) => ernstRang[a.ernst] - ernstRang[b.ernst] || b.weging - a.weging);

  const score = Math.max(0, 100 - findings.reduce((s, f) => s + f.weging, 0));
  let oordeel, kleur;
  if (score >= 90) { oordeel = "Goed"; kleur = "#1e7a3c"; }
  else if (score >= 70) { oordeel = "Redelijk"; kleur = "#8a6d00"; }
  else if (score >= 45) { oordeel = "Onvoldoende"; kleur = "#b34700"; }
  else { oordeel = "Slecht"; kleur = "#b3261e"; }

  return {
    findings,
    score,
    oordeel,
    kleur,
    stats: {
      afbeeldingen: data.imgs.total,
      links: data.links.length,
      formuliervelden: data.controls.length,
      koppen: data.headings.length,
    },
  };
}
