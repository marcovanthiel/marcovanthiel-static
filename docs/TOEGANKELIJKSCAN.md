# ToegankelijkScan — projectdocumentatie (bron van waarheid)

Draait sinds 10-9-2026 als **Pages Functions** in deze repo op
**https://marcovanthiel.nl/toegankelijkscan** (code: functions/toegankelijkscan/
+ lib/toegankelijkscan/). De oude losse Worker-repo `toegankelijkscan` bevat
alleen nog een 301-redirect voor oude links (workers.dev-URL).


Commerciële dienst: **gratis automatische toegankelijkheidsscan** (WCAG 2.1 / European
Accessibility Act) voor Nederlandse websites en webshops, met als verdienmodel het
**expertrapport (€ 49 excl. btw)** en **herstel-/begeleidingstrajecten op offerte**.
Een dienst van Van Thiel Management & Consultancy. Gestart 3 juli 2026.

Lees dit eerst; `git pull` voordat je begint (MacBook ⇄ Mac mini).

## Propositie en markt
- EAA van kracht sinds 28 juni 2025; ACM handhaaft en publiceert sinds oktober 2025
  overtreders; formele boetes (tot € 900.000 of 1% jaaromzet) worden in 2026 verwacht.
- Concurrenten vragen € 299 tot € 1.250 voor een quickscan van circa 5 pagina's.
- Funnel: gratis directe scan (leadmagneet) → expertrapport € 49 → herstel op offerte.
- Bestellen gaat in deze versie via mailto naar marco@marcovanthiel.nl (bewuste keuze,
  zelfde conventie als de fundraising-sites). Mollie-betaling is een latere stap.

## Stack & hosting
- **Cloudflare Worker** `toegankelijkscan`, account marco-048 (`04865fcd…`). Puur JS,
  géén framework, géén dependencies, géén D1/R2: de scan is stateless en slaat niets op
  (dat is ook de privacybelofte op de site — houd dat zo of pas de belofte aan).
- Live: https://marcovanthiel.nl/toegankelijkscan (oude workers.dev-URL redirect ernaartoe)
- Domein **toegankelijkscan.nl is vrij** (RDAP-check 3-7-2026) maar nog niet geregistreerd;
  eaa-scan.nl is ook vrij. Registratie = besluit Marco (± € 10 per jaar).
- Deploy: gewoon push naar main van deze repo (Cloudflare Pages bouwt en deployt).

## Code (src/)
- `index.js` — router (/, /scan, /toegankelijkheid, /robots.txt), security-headers
  (CSP default-src 'none', geen client-JS, geen cookies), best-effort rate-limit
  (8 scans/min/IP, per isolate).
- `scan.js` — `normalizeUrl` (SSRF-guard: alleen publieke http(s)-hosts, poort 80/443)
  en `scanPage`: fetch met 15s-timeout en 3 MB-cap, parsing via **HTMLRewriter**
  (streaming, geen DOM-lib). Verzamelt: lang/title/viewport, afbeeldingen zonder alt,
  formuliervelden + labels (for/id, nested, aria), lege links/knoppen, koppenstructuur,
  iframes, tabindex>0, autoplay, dubbele id's.
- `checks.js` — 15 checks → bevindingen met ernst (kritiek/waarschuwing/advies),
  WCAG-verwijzing, uitleg en oplossing in klare taal; score 100 minus gewichten;
  oordeel Goed/Redelijk/Onvoldoende/Slecht. Bijzonder: check op ontbrekende
  **toegankelijkheidsverklaring** (EAA-vereiste, doet vrijwel geen enkele gratis tool).
- `ui.js` — alle HTML (landing, rapport, fout, verklaring). De site is zelf het
  voorbeeld: skip-link, labels, één h1, contrastveilige kleuren (#123c63/#0c7494),
  geen scripts. **Nooit em- of en-dashes in teksten** (huisregel).

## Beperkingen (eerlijk vermeld op de site)
- Automatische scan dekt één pagina en alleen automatisch toetsbare criteria;
  contrast/toetsenbord/screenreader = handmatig werk = het betaalde rapport.
- Sites met agressieve botdetectie (bijv. bol.com) geven een nette foutmelding.

## Geverifieerd (3-7-2026)
- Landing, verklaring, robots.txt: 200. Scan van dandanshop.nl: score 100, 0 bevindingen
  (klopt, die site is WCAG-proof gebouwd). Coolblue: kritieke bevinding (lege links).
  etenbijdaan.nl: Redelijk, 2 bevindingen. SSRF-/foutpaden getest (localhost, onzin-URL,
  niet-HTML, HTTP-fout upstream).

## Openstaand (besluiten Marco)
1. Domein toegankelijkscan.nl registreren (± € 10/jaar) en aan de Worker koppelen
   (custom domain via het dashboard, niet via config; workers_dev aan laten).
2. Prijs vastgesteld op € 49 excl. btw (11-9-2026; bewust ruim onder de concurrentie € 299 tot € 1.250, volumestrategie).
3. Acquisitie starten (zie ROADMAP in dit bestand hieronder).
4. Later: Mollie-betaling voor het rapport, meertaligheid (EN), meerdere pagina's per
   scan, PDF-rapport, opvolg-e-mails (vereist opslag → privacybelofte aanpassen).

## Acquisitie-ideeën (nog niet gestart)
- Eigen netwerk: Rotary, consultancy-relaties, webbouwers in de regio (wholesale:
  bureaus laten scannen onder eigen vlag).
- Direct benaderbare doelgroep: mkb-webshops; de ACM-publicatielijst is een bellijst.
- Contentmarketing: de scan is deelbaar; elke gescande site is een gesprek.
