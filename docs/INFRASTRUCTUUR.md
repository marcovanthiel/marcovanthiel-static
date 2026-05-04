# marcovanthiel.nl — Infrastructuur en configuratie

> Dit document beschrijft hoe de zakelijke site `marcovanthiel.nl` is opgebouwd, waar onderdelen draaien, en wat je moet doen als er iets stuk gaat. Bedoeld als naslagwerk — geen developer-handleiding.

## In één regel

Een statische website (geen database, geen logins) die je portfolio en contactgegevens toont in vijf talen. Wijzigingen gebeuren via Markdown-bestanden in GitHub; de site bouwt zichzelf opnieuw na elke push.

## Onderdelen — wat draait er en waar?

| Onderdeel | Waar | Wat doet het |
|---|---|---|
| **De website zelf** | Cloudflare Pages — `marcovanthiel.nl` | Toont de kant-en-klare HTML/CSS aan bezoekers |
| **De broncode** | GitHub — `marcovanthiel/marcovanthiel-static` (privé) | Markdown-content, templates, afbeeldingen |
| **De build-tool** | Hugo (statische-site-generator, versie 0.140.2) | Zet jouw Markdown om naar HTML wanneer je iets verandert |
| **Contactformulier-backend** | Cloudflare Pages Function (`functions/api/contact.ts`) | Verwerkt POST van het contactformulier |
| **E-mail-API** | Resend | Verstuurt het contactbericht naar `marco@marcovanthiel.nl` |
| **Daily Biennale-update** | GitHub Actions (`.github/workflows/biennale-daily-update.yml`) | Ververst de magazine-subpagina elke ochtend om 06:00 UTC |
| **DNS** | Cloudflare | Het adres `marcovanthiel.nl` wijst naar Cloudflare Pages |
| **TLS / HTTPS** | Cloudflare (automatisch) | Veilige verbindingen |
| **E-mail (`marco@marcovanthiel.nl`)** | Microsoft 365 | Apart van de website — gewoon je zakelijke mail |

### Vereiste API-keys / secrets

| Locatie | Naam | Voor |
|---|---|---|
| Cloudflare Pages env-vars | `RESEND_API_KEY` | Contactformulier — zonder dit krijgt elke bezoeker een 503 |
| GitHub Repo Secrets | `ANTHROPIC_API_KEY` | Daily Biennale-update — zonder dit faalt de workflow elke ochtend |

**Hoe het werkt** (in normale taal): de site bestaat uit Markdown-tekstbestandjes en een paar HTML-templates. Hugo plakt die samen tot complete webpagina's. Het resultaat zijn gewoon HTML-bestanden die op Cloudflare's wereldwijde netwerk staan, dichtbij de bezoeker. Daardoor laadt de site razendsnel — er is geen database of server die elke pagina opnieuw genereert.

## Hoe je iets verandert

Alle wijzigingen lopen via GitHub:
1. Je geeft een opdracht aan Claude
2. Claude past de juiste Markdown- of template-bestanden aan en doet `git push` naar `main`
3. Cloudflare Pages ziet de push en bouwt de site opnieuw met Hugo (~30 seconden)
4. Wijziging is live op `marcovanthiel.nl`

**Wat je zelf kunt aanpassen** (zonder Claude, als je comfortabel bent met Markdown):
- Tekst van pagina's: bewerk een bestand in `content/{nl,en,de,it,cn}/`
- Klanten in het portfolio: bewerk `data/projects.json` (volgorde + inhoud)
- Logo's: vervang of plaats nieuwe in `static/images/projects/`

Je hoeft niets te "uploaden" — push naar GitHub triggert de rebuild.

## Inhoud per pagina

| Pagina | Bestand | Bevat |
|---|---|---|
| Home | `content/{lang}/_index.md` | Hero-tekst, kerncompetenties, beschikbaarheid, governance, klant-portfolio |
| Kunst | `content/{lang}/kunst.md` (NL/EN) | Beschrijving + knop naar kunstcollectie-app + kunstwerk-van-de-dag |
| Cases | `content/{lang}/cases/*.md` (auto-gegenereerd) | 20 case-pagina's per taal — `python3 scripts/gen-cases.py` regenereert ze uit `data/projects/{lang}.json` |
| Biennale | `static/biennalevenetie2026/` | Magazine-subpagina, dagelijks ververst door GitHub Action |
| Contact | `content/{lang}/contact.md` + `functions/api/contact.ts` | Contactgegevens + werkend formulier (Resend) |
| Privacy | `content/{lang}/privacy.md` | AVG-verklaring (NL/EN/DE/IT/CN) |

**Klanten op portfolio (homepage + cases):**
- Bron-data: `data/projects/{lang}.json` (per taal, identieke structuur)
- Volgorde in JSON = volgorde op de homepage
- Per klant: titel, korte beschrijving, lange beschrijving (`details`), logo-pad, optionele externe link
- Logo's staan in `static/images/projects/`
- **Bij wijziging**: na bewerken van JSON altijd `python3 scripts/gen-cases.py` draaien zodat ook de standalone case-pagina's bijwerken

## Talen

De site is volledig meertalig: Nederlands (default), Engels, Duits, Italiaans, Chinees. Per taal:
- Eigen Markdown in `content/{lang}/`
- Eigen menu in `config/_default/menus.{lang}.yaml`
- Eigen vertalingen voor UI-knoppen in `i18n/{lang}.yaml`

**Bekend issue:** menu's in DE/IT/CN verwijzen naar `/kunst/`, `/arte/`, `/艺术/` — maar die pagina's bestaan alleen voor NL en EN. Als je echt vertaalde Kunst-pagina's wil, moet er content komen in de overige talen. Geen prioriteit — geen 404-meldingen die opvallen.

## Visuele identiteit

Je zakelijke site heeft een doelbewust ingetogen, professionele uitstraling:
- Hoofdkleur: `#0077b6` (donkerblauw)
- Accent: `#90e0ef` (lichtblauw)
- Display-font: Montserrat
- Body-font: Open Sans
- Hero: jouw profielfoto met blauwe overlay
- Logo: img + descriptive tekst onder elkaar in de header

> **Belangrijk**: deze visuele stijl is door jou expliciet gekozen en niet aan te passen zonder te overleggen. Claude weet dat (ligt in zijn memory).

## Beveiligingslagen (Cloudflare-zone, gratis tier)

- **DNS proxy** — alle traffic gaat door Cloudflare voordat het Render of Pages bereikt
- **DDoS-bescherming** — automatisch
- **WAF Managed Rules** — blokkeert OWASP Top 10-aanvallen
- **Bot Fight Mode** — blokkeert eenvoudig herkenbare scrapers
- **SSL/TLS Full (strict)** — verbinding tussen Cloudflare en de origin is gevalideerd over TLS
- **HTTPS overal** — automatisch HTTP → HTTPS

In één lijn: voor een statische site die geen credentials accepteert is dit ruim voldoende. Geen extra werk nodig.

## Maandelijkse kosten

| Dienst | Kosten |
|---|---|
| Cloudflare Pages (hosting) | gratis (ruime free-tier voor statische sites) |
| Cloudflare DNS + edge | gratis |
| Microsoft 365 (mail) | (apart abonnement, niet site-gerelateerd) |
| Domein `marcovanthiel.nl` | ~€10/jaar bij je domein-registrar |

**Schatting totaal voor de site zelf:** ~€10/jaar (alleen domeinregistratie).

## Wat te doen als...

### ... een wijziging is niet zichtbaar
1. Wacht 30-60 seconden — Cloudflare moet bouwen
2. Hard-refresh in je browser: `Cmd+Shift+R` (Mac) of `Ctrl+Shift+R` (Windows)
3. Check Cloudflare → Workers & Pages → marcovanthiel → Deployments. Staat er een groene build bovenaan? Zo nee: build-log bekijken voor foutmelding.

### ... de build faalt
- Klik in Cloudflare op de gefaalde deployment → check de Hugo-foutmelding
- Meest voorkomende oorzaak: kapotte syntax in een Markdown-bestand of YAML-config
- Stuur de foutmelding naar Claude voor diagnose

### ... het Cloudflare-banner zegt "The repository cannot be accessed"
- De GitHub-app autorisatie is verlopen of de repo is verwijderd/hernoemd
- Klik "Configure installation" → herautoriseer Cloudflare voor de repo
- Daarna onder Deployments een gefaalde deployment "Retry"

### ... het kunstwerk-van-de-dag op `/kunst` toont niets
- De fetch faalt waarschijnlijk; de sectie verbergt zich dan stilletjes
- Check `https://kunstcollectie-api.onrender.com/api/public/artwork-of-the-day` direct in browser — moet JSON tonen
- Check of `kunstcollectieApiUrl` in `config.yaml` correct staat
- Open browser-console (rechts-klik → Inspect → Console) op `/kunst` — daar staat de exacte fout

## Belangrijke links

- **Live site:** https://marcovanthiel.nl
- **Cloudflare dashboard:** https://dash.cloudflare.com → marcovanthiel.nl
- **GitHub-repo:** https://github.com/marcovanthiel/marcovanthiel-static (privé)
- **Hugo documentatie** (alleen als referentie): https://gohugo.io/documentation/

## Context voor de andere site

Op de Kunst-pagina van deze site staat:
1. Een **knop "Bezoek de collectie"** die naar `kunstcollectie.marcovanthiel.nl/collectie` leidt
2. Een **"Kunstwerk van de dag"-sectie** die elke dag een ander werk uit jouw kunstcollectie toont

Beide zijn cross-domain integraties met de aparte kunstcollectie-applicatie (een React + Postgres-app op Render). Zie `kunstcollectie/docs/INFRASTRUCTUUR.md` in dat repo voor de andere kant van die brug.

De cross-link werkt via twee config-parameters in `config.yaml`:
- `kunstcollectieUrl` — voor de knop (frontend-URL)
- `kunstcollectieApiUrl` — voor de fetch (backend-URL, ander subdomein!)
