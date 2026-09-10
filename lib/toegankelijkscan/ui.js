// Alle HTML van de site. Geen JavaScript aan de clientkant, geen cookies, geen externe assets.

const CSS = `
:root{--blauw:#123c63;--accent:#0c7494;--licht:#f4f7fa;--rand:#d7e0e8;--tekst:#1c2b3a}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--tekst);line-height:1.6;background:#fff}
.skip{position:absolute;left:-999px;top:0;background:var(--blauw);color:#fff;padding:.6rem 1rem;z-index:10}
.skip:focus{left:0}
header.site{background:var(--blauw);color:#fff;padding:1rem 1.5rem}
header.site .wrap{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}
.logo{font-size:1.3rem;font-weight:700;color:#fff;text-decoration:none}
.logo span{color:#9fd4e8}
main{max-width:960px;margin:0 auto;padding:0 1.5rem}
.hero{padding:3rem 0 2.5rem}
.hero h1{font-size:2rem;line-height:1.25;color:var(--blauw);max-width:38rem}
.hero p.sub{margin:1rem 0 1.5rem;font-size:1.1rem;max-width:38rem}
form.scan{display:flex;gap:.6rem;flex-wrap:wrap;max-width:38rem}
form.scan input[type=text]{flex:1 1 16rem;padding:.8rem 1rem;font-size:1rem;border:2px solid var(--rand);border-radius:6px}
form.scan input[type=text]:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.knop{background:var(--accent);color:#fff;border:0;border-radius:6px;padding:.8rem 1.4rem;font-size:1rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
.knop:hover{background:#095c76}
.knop.groot{font-size:1.05rem}
.gratis{font-size:.95rem;color:#41586e;margin-top:.6rem}
section{padding:2.2rem 0;border-top:1px solid var(--rand)}
section h2{color:var(--blauw);font-size:1.45rem;margin-bottom:1rem}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin-top:1.2rem}
.kaart{border:1px solid var(--rand);border-radius:8px;padding:1.2rem;background:var(--licht)}
.kaart h3{color:var(--blauw);margin-bottom:.5rem;font-size:1.1rem}
.prijs{font-size:1.5rem;font-weight:700;color:var(--blauw);margin:.4rem 0}
.prijs small{font-size:.85rem;font-weight:400;color:#41586e}
.kaart ul{margin:.6rem 0 1rem 1.1rem}
.kaart li{margin:.25rem 0}
.uitgelicht{border:2px solid var(--accent);background:#fff}
.badge{display:inline-block;background:var(--accent);color:#fff;font-size:.75rem;font-weight:700;padding:.15rem .6rem;border-radius:99px;margin-bottom:.5rem}
dl.faq dt{font-weight:700;color:var(--blauw);margin-top:1rem}
dl.faq dd{margin:.3rem 0 0}
footer.site{margin-top:3rem;background:var(--licht);border-top:1px solid var(--rand);padding:1.6rem 1.5rem;font-size:.9rem;color:#41586e}
footer.site .wrap{max-width:960px;margin:0 auto}
footer.site a{color:var(--blauw)}
.score-kop{display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;padding:2rem 0 1rem}
.score-cirkel{width:120px;height:120px;flex:0 0 auto}
.bevind{border:1px solid var(--rand);border-left-width:6px;border-radius:6px;padding:1rem 1.2rem;margin:.8rem 0;background:#fff}
.bevind h3{font-size:1.05rem;margin-bottom:.3rem}
.bevind .meta{font-size:.85rem;color:#41586e;margin-bottom:.4rem}
.bevind .fixlbl{font-weight:700}
.bevind ul{margin:.4rem 0 0 1.2rem;font-size:.9rem;color:#41586e;overflow-wrap:anywhere}
.k-kritiek{border-left-color:#b3261e}.k-waarschuwing{border-left-color:#b34700}.k-advies{border-left-color:#8a6d00}
.lbl{display:inline-block;font-size:.75rem;font-weight:700;padding:.1rem .55rem;border-radius:99px;color:#fff;text-transform:uppercase;letter-spacing:.03em}
.l-kritiek{background:#b3261e}.l-waarschuwing{background:#b34700}.l-advies{background:#8a6d00}
.cta-blok{border:2px solid var(--accent);border-radius:8px;padding:1.5rem;margin:2rem 0;background:var(--licht)}
.cta-blok h2{margin-bottom:.6rem}
.stats{display:flex;gap:1.5rem;flex-wrap:wrap;font-size:.95rem;color:#41586e;margin:.5rem 0 0}
.terug{margin:1.5rem 0}
table.wet{border-collapse:collapse;width:100%;margin-top:1rem}
table.wet th,table.wet td{border:1px solid var(--rand);padding:.55rem .8rem;text-align:left;vertical-align:top}
table.wet th{background:var(--licht);color:var(--blauw)}
@media (max-width:600px){.hero h1{font-size:1.55rem}}
`;

const BASE = "/toegankelijkscan";
const MAIL = "marco@marcovanthiel.nl";

export function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout(titel, body, beschrijving) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beschrijving || "Gratis automatische toegankelijkheidsscan (WCAG en European Accessibility Act) voor Nederlandse websites en webshops.")}">
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#inhoud">Direct naar inhoud</a>
<header class="site"><div class="wrap">
<a class="logo" href="${BASE}">Toegankelijk<span>Scan</span></a>
<nav aria-label="Hoofdmenu"><a href="${BASE}#pakketten" style="color:#fff;margin-right:1.2rem">Pakketten</a><a href="${BASE}#faq" style="color:#fff">Veelgestelde vragen</a></nav>
</div></header>
<main id="inhoud">
${body}
</main>
<footer class="site"><div class="wrap">
<p><strong>ToegankelijkScan</strong> is een dienst van Van Thiel Management &amp; Consultancy.
Contact: <a href="mailto:${MAIL}">${MAIL}</a>.</p>
<p style="margin-top:.5rem">De automatische scan is een indicatie en geen volledige WCAG-audit of juridisch advies.
Wij plaatsen geen cookies en slaan gescande adressen niet op.
<a href="${BASE}/toegankelijkheid">Toegankelijkheidsverklaring</a></p>
</div></footer>
</body>
</html>`;
}

export function landingPage() {
  const body = `
<div class="hero">
<h1>Voldoet uw website aan de Europese toegankelijkheidswet?</h1>
<p class="sub">Sinds 28 juni 2025 is digitale toegankelijkheid wettelijk verplicht voor webshops en online dienstverlening.
De ACM handhaaft en publiceert overtreders. Test uw website nu, gratis en direct resultaat.</p>
<form class="scan" action="${BASE}/scan" method="get">
<label class="skip" for="url">Adres van uw website</label>
<input type="text" inputmode="url" spellcheck="false" id="url" name="url" required placeholder="https://www.uwwebsite.nl" autocomplete="url">
<button class="knop groot" type="submit">Scan mijn website</button>
</form>
<p class="gratis">Gratis. Geen account nodig, geen cookies, uw gegevens worden niet opgeslagen.</p>
</div>

<section aria-labelledby="wet-kop">
<h2 id="wet-kop">Waarom nu?</h2>
<p>De European Accessibility Act (EAA) verplicht vrijwel alle consumentgerichte websites en apps om toegankelijk te zijn
voor mensen met een beperking. Dat is niet vrijblijvend:</p>
<table class="wet">
<tr><th scope="row">Sinds 28 juni 2025</th><td>De wet is van kracht voor webshops, banken, vervoerders, telecom en andere online dienstverlening.</td></tr>
<tr><th scope="row">Toezichthouder</th><td>In Nederland handhaaft onder meer de Autoriteit Consument &amp; Markt (ACM). Sinds oktober 2025 publiceert de ACM welke organisaties niet voldoen.</td></tr>
<tr><th scope="row">Sancties</th><td>Boetes kunnen oplopen tot 900.000 euro of 1 procent van de jaaromzet. In 2026 worden de eerste formele boetes verwacht.</td></tr>
<tr><th scope="row">Uitzondering</th><td>Micro-ondernemingen (minder dan 10 medewerkers en maximaal 2 miljoen euro omzet) zijn deels uitgezonderd. Toegankelijkheid loont ook dan: circa 25 procent van uw bezoekers heeft baat bij een toegankelijke site.</td></tr>
</table>
</section>

<section aria-labelledby="hoe-kop">
<h2 id="hoe-kop">Hoe werkt de gratis scan?</h2>
<p>U vult uw webadres in en binnen enkele seconden ziet u een rapport met een score en concrete bevindingen:
ontbrekende alternatieve teksten, formuliervelden zonder label, lege knoppen en links, geblokkeerd zoomen,
ontbrekende toegankelijkheidsverklaring en meer. Per bevinding leest u wat er mis is, voor wie dat een
probleem is en hoe u het oplost.</p>
<p style="margin-top:.6rem">Een automatische scan vangt een deel van de eisen. Zaken als kleurcontrast, toetsenbordbediening en
begrijpelijkheid vragen om een handmatige controle door een specialist. Daarvoor is er het expertrapport.</p>
</section>

<section aria-labelledby="pakket-kop" id="pakketten">
<h2 id="pakket-kop">Pakketten</h2>
<div class="kaarten">
<div class="kaart">
<h3>Gratis quickscan</h3>
<p class="prijs">&euro; 0</p>
<ul>
<li>Automatische controle, direct resultaat</li>
<li>Score en concrete bevindingen</li>
<li>Oplossing per bevinding</li>
</ul>
<a class="knop" href="${BASE}#inhoud">Start de scan</a>
</div>
<div class="kaart uitgelicht">
<span class="badge">Meest gekozen</span>
<h3>Expertrapport</h3>
<p class="prijs">&euro; 195 <small>excl. btw, per website</small></p>
<ul>
<li>Handmatige controle van 5 pagina's door een specialist</li>
<li>Ook contrast, toetsenbord en voorleessoftware</li>
<li>Prioriteitenlijst: wat eerst, wat kan wachten</li>
<li>Hulp bij uw toegankelijkheidsverklaring</li>
<li>Telefonische toelichting van 30 minuten</li>
</ul>
<a class="knop" href="mailto:${MAIL}?subject=Expertrapport%20ToegankelijkScan&body=Graag%20een%20expertrapport%20voor%20website%3A%20">Bestel het expertrapport</a>
</div>
<div class="kaart">
<h3>Herstel en begeleiding</h3>
<p class="prijs">Op offerte</p>
<ul>
<li>Wij lossen de bevindingen voor u op</li>
<li>Of we begeleiden uw eigen bouwer</li>
<li>Inclusief hercontrole na afloop</li>
</ul>
<a class="knop" href="mailto:${MAIL}?subject=Offerte%20toegankelijkheid%20herstellen">Vraag een offerte aan</a>
</div>
</div>
</section>

<section aria-labelledby="faq-kop" id="faq">
<h2 id="faq-kop">Veelgestelde vragen</h2>
<dl class="faq">
<dt>Geldt de wet ook voor mijn website?</dt>
<dd>Heeft uw site een bestelfunctie, boekingsmodule, betaald abonnement of klantomgeving, dan valt u vrijwel zeker onder de EAA. Puur informatieve sites vallen er formeel buiten, maar toegankelijkheid is ook daar in uw eigen belang.</dd>
<dt>Is de gratis scan een officiële audit?</dt>
<dd>Nee. De scan is een betrouwbare eerste indicatie op basis van automatisch toetsbare criteria. Een volledige beoordeling volgens WCAG 2.1 niveau AA vraagt handmatig onderzoek; dat leveren wij met het expertrapport.</dd>
<dt>Wat gebeurt er met mijn gegevens?</dt>
<dd>Niets. De scan draait direct, wij slaan het gescande adres en het resultaat niet op en plaatsen geen cookies.</dd>
<dt>Hoe snel heb ik het expertrapport?</dt>
<dd>Binnen vijf werkdagen na opdracht ontvangt u het rapport per e-mail, gevolgd door een telefonische toelichting.</dd>
</dl>
</section>`;
  return layout("ToegankelijkScan | Gratis WCAG- en EAA-scan voor uw website", body);
}

export function reportPage(url, result) {
  const { findings, score, oordeel, kleur, stats } = result;
  const perc = score / 100;
  const r = 52, omtrek = 2 * Math.PI * r;
  const kritiek = findings.filter((f) => f.ernst === "kritiek").length;

  const items = findings.map((f) => `
<li class="bevind k-${f.ernst}">
<h3><span class="lbl l-${f.ernst}">${f.ernst}</span> ${esc(f.titel)}</h3>
<p class="meta">WCAG-criterium: ${esc(f.wcag)}</p>
<p>${esc(f.uitleg)}</p>
<p style="margin-top:.4rem"><span class="fixlbl">Oplossing:</span> ${esc(f.fix)}</p>
${f.voorbeelden && f.voorbeelden.length ? `<ul>${f.voorbeelden.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>` : ""}
</li>`).join("");

  const body = `
<div class="score-kop">
<svg class="score-cirkel" viewBox="0 0 120 120" role="img" aria-label="Score ${score} van 100, oordeel ${esc(oordeel)}">
<circle cx="60" cy="60" r="${r}" fill="none" stroke="#e3eaf1" stroke-width="12"/>
<circle cx="60" cy="60" r="${r}" fill="none" stroke="${kleur}" stroke-width="12"
 stroke-dasharray="${(omtrek * perc).toFixed(1)} ${omtrek.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 60 60)"/>
<text x="60" y="57" text-anchor="middle" font-size="28" font-weight="700" fill="${kleur}">${score}</text>
<text x="60" y="78" text-anchor="middle" font-size="12" fill="#41586e">van 100</text>
</svg>
<div>
<h1 style="color:var(--blauw);font-size:1.5rem">Scanresultaat: <span style="color:${kleur}">${esc(oordeel)}</span></h1>
<p style="margin-top:.3rem;overflow-wrap:anywhere">Gescande pagina: <strong>${esc(url)}</strong></p>
<p class="stats">Gecontroleerd: ${stats.afbeeldingen} afbeeldingen &middot; ${stats.links} links &middot; ${stats.formuliervelden} formuliervelden &middot; ${stats.koppen} koppen</p>
</div>
</div>

${kritiek > 0 ? `<p style="max-width:44rem"><strong>${kritiek} ${kritiek === 1 ? "bevinding is" : "bevindingen zijn"} kritiek.</strong>
Dit zijn precies de categorie&euml;n waar de toezichthouder op let en die bezoekers met een beperking direct uitsluiten. Het goede nieuws: elke bevinding hieronder heeft een concrete oplossing.</p>` :
findings.length === 0 ? `<p style="max-width:44rem"><strong>Uitstekend.</strong> De automatische controles vonden geen problemen op deze pagina. Let op: een deel van de eisen is alleen handmatig te toetsen.</p>` : ""}

<section aria-labelledby="bevindingen-kop">
<h2 id="bevindingen-kop">Bevindingen (${findings.length})</h2>
<ul style="list-style:none">
${items || '<li class="bevind" style="border-left-color:#1e7a3c"><h3>Geen automatisch toetsbare problemen gevonden</h3><p>Goed werk. Laat de handmatige criteria toetsen om zeker te zijn.</p></li>'}
</ul>
</section>

<div class="cta-blok">
<h2>Weten waar u echt staat?</h2>
<p>Deze scan toetst &eacute;&eacute;n pagina op automatisch meetbare criteria. Kleurcontrast, toetsenbordbediening,
focusvolgorde en voorleessoftware vragen om handmatig onderzoek. Met het <strong>expertrapport (&euro; 195 excl. btw)</strong>
controleren wij 5 pagina's van uw website op alle relevante WCAG-criteria en ontvangt u een prioriteitenlijst
plus hulp bij uw toegankelijkheidsverklaring.</p>
<p style="margin-top:1rem">
<a class="knop groot" href="mailto:${MAIL}?subject=Expertrapport%20ToegankelijkScan&body=Graag%20een%20expertrapport%20voor%3A%20${encodeURIComponent(url)}">Bestel het expertrapport</a>
</p>
</div>

<div class="terug">
<form class="scan" action="${BASE}/scan" method="get">
<label class="skip" for="url">Adres van een andere pagina</label>
<input type="text" inputmode="url" spellcheck="false" id="url" name="url" required placeholder="Scan nog een pagina" autocomplete="url">
<button class="knop" type="submit">Opnieuw scannen</button>
</form>
<p style="margin-top:1rem"><a href="${BASE}">Terug naar de startpagina</a></p>
</div>`;
  return layout(`Scanresultaat ${oordeel} (${score}/100) | ToegankelijkScan`, body, `Toegankelijkheidsscore van ${url}: ${score} van 100.`);
}

export function errorPage(boodschap) {
  const body = `
<div class="hero">
<h1>De scan kon niet worden uitgevoerd</h1>
<p class="sub">${esc(boodschap)}</p>
<form class="scan" action="${BASE}/scan" method="get">
<label class="skip" for="url">Adres van uw website</label>
<input type="text" inputmode="url" spellcheck="false" id="url" name="url" required placeholder="https://www.uwwebsite.nl" autocomplete="url">
<button class="knop" type="submit">Probeer opnieuw</button>
</form>
<p style="margin-top:1rem"><a href="${BASE}">Terug naar de startpagina</a></p>
</div>`;
  return layout("Scan mislukt | ToegankelijkScan", body);
}

export function statementPage() {
  const body = `
<div class="hero">
<h1>Toegankelijkheidsverklaring</h1>
<p class="sub">ToegankelijkScan streeft naar volledige naleving van WCAG 2.1 niveau AA. Deze website is daarop ontworpen:
volledige toetsenbordbediening, skip-link, correcte labels en koppenstructuur, voldoende kleurcontrast en
geen bewegende of automatisch startende media. De site gebruikt geen cookies en geen scripts.</p>
<p>Loopt u toch ergens tegenaan? Meld het via <a href="mailto:${MAIL}?subject=Toegankelijkheid%20ToegankelijkScan">${MAIL}</a>,
dan lossen wij het op. Deze verklaring is opgesteld op 3 juli 2026.</p>
<p style="margin-top:1rem"><a href="${BASE}">Terug naar de startpagina</a></p>
</div>`;
  return layout("Toegankelijkheidsverklaring | ToegankelijkScan", body);
}
