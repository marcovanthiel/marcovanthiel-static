# CLAUDE.md — Cultuurmeting Koraal & Via Jeugd

Projectkennis voor Claude Code. Houd dit bestand actueel: elk besluit dat in een
chat of codesessie wordt genomen, hoort hier te landen. Dit bestand is de enige
gedeelde bron van waarheid tussen claude.ai-chats en Claude Code-sessies.

## Doel
Online OCAI-cultuurmeting (Cameron & Quinn) voor de invlechting van Via Jeugd in
Koraal (programma KAI). Live op: https://marcovanthiel.nl/koraalenviajeugd/
Medewerkersbijeenkomst: 23 juni 2026. Juridische fusiedatum: 1 maart 2027.

## Functionele eisen (afgesproken)
1. Respondent kiest eerst organisatie: Koraal of Via Jeugd (verplicht); team is optioneel.
2. Zes OCAI-dimensies, elk vier uitspraken (A=familie, B=adhocratie, C=markt,
   D=hiërarchie). Per dimensie 100 punten verdelen, twee rondes: Nu en Gewenst.
   Live-validatie: verzendknop pas actief als élke verdeling exact 100 is.
   Serverzijde wordt dit nogmaals gecontroleerd.
3. Na verzenden direct het individuele resultaat: tabel (nu/gewenst/verschil per
   type) + vliegerdiagram + korte duiding van het dominante type.
4. Adminpagina (admin.php, wachtwoord in config.php): tellers, gemiddelden per
   organisatie, totaalgrafiek, tabel met alle inzendingen, CSV-export (puntkomma,
   met BOM voor Excel).

## Architectuur (2026-06-11 herzien)
- Statisch onder `static/koraalenviajeugd/` + Cloudflare Pages Functions
  (TypeScript) onder `functions/api/koraalenviajeugd/`. Opslag in Cloudflare
  **D1** (sqlite-edge-DB), niet in een JSONL-bestand. PHP is uitgefaseerd
  omdat marcovanthiel.nl op Cloudflare Pages draait (geen PHP-runtime).
- Pagina's:
  * `/koraalenviajeugd/` — vragenlijst (`index.html`)
  * `/resultaat/?ref=O-…` — individuele uitslag voor de invuller; geen
    login (ref is onraadbaar en de data anoniem). Redirect na succesvolle
    POST.
  * `/uitleg/` — statische OCAI-uitleg (~3 A4, C1-NL).
  * `/admin/` — token-login; tellers, klikbare lijst, CSV-export, knop
    "Totaalresultaat".
  * `/admin/totaal/` — token-vereist; één stippenplaat (zwaartepunt
    Koraal + Via Jeugd, factor 3,2 vergroot) + per-organisatie vlieger
    nu+gewenst.
- Endpoints (`functions/api/koraalenviajeugd/`):
  * `POST /opslaan` — valideert (6×{nu,gewenst} som=100), insert in D1
    `OCAI_DB`, returnt `{ ok, ref, profiel }`.
  * `GET  /resultaat?ref=O-…` — publiek; één inzending op basis van ref.
  * `GET  /resultaat?summary=1&token=…` — admin; gemiddelden per org.
  * `GET  /admin/list` — admin; alle inzendingen + aggregaten.
  * `GET  /admin/export` — admin; CSV (UTF-8 BOM, ;-separator).
- Auth: admin via bearer-token in env-var `OCAI_ADMIN_TOKEN` (Cloudflare
  Pages secret). Frontend bewaart in `sessionStorage` per browser-tabblad.
- Profielberekening: gemiddelde per letter over de zes dimensies, afgerond
  op 1 decimaal; gebeurt zowel client- (preview) als serverzijde (server
  is leidend in opslag). Ruwe scores blijven bewaard als JSON in
  `scores_json`-kolom voor latere analyse.
- Geen externe JS-libraries; grafieken zijn inline SVG, zelf gegenereerd
  in `static/koraalenviajeugd/assets/diagram-vlieger.js`.
- Setup-stappen in `scripts/koraalenviajeugd/README.md` (D1-binding,
  schema.sql, OCAI_ADMIN_TOKEN, retry-deploy).

## Privacy
Anoniem: geen namen of e-mailadressen. Opgeslagen: tijdstip, organisatie,
optioneel team, scores, berekend profiel + IP (abuse-mitigation, niet voor
identificatie). Wachtwoorden/secrets nooit in chats plakken; secrets in
Cloudflare Pages → Environment variables (Production, Secret).

## Huisstijl (Koraal, met Via Jeugd-logo)
- Kleuren: donkerblauw #004289 (koppen/banners), #003366 (donker accent),
  cyaan #009DDF (accenten, vraag-markeringen), Via Jeugd-groen #4FAE32,
  kaartvulling #E5F1FA, zachte vulling #F2F8FD / #F4FAFD.
- Font: Arial/Helvetica. Beide logo's in de kop: Koraal links, Via Jeugd rechts.
- Logobestanden: koraal_logo.png (uit SVG gerenderd, transparant),
  vj_logo_ok.png (aangeleverde versie met transparantie — NIET de oude variant
  met zwarte achtergrond gebruiken).
- Organisatienaam altijd "Koraal" (nooit "Coraal"); alle teksten in het Nederlands.

## Grafiekconventie (definitief besloten)
Wetenschappelijke OCAI-weergave, toegepast in alle uitingen (web én documenten):
- Vier diagonale assen; profielpunten liggen óp de diagonalen; ruitvormige
  gridlijnen met schaalcijfers 10–50 (schaal 0–60).
- Kwadrantpanelen met titels FAMILIE / ADHOCRATIE / HIËRARCHIE / MARKT en
  buitenlabels FLEXIBEL / BEHEERSBAAR / INTERN GERICHT / EXTERN GERICHT.
- Kleuren: Via Jeugd groen, Koraal donkerblauw; "gewenst" gestippeld als het
  getoond wordt.
- Op de totaalplaat: VJ- en K-stip = zwaartepunt van het profiel, voor
  leesbaarheid uitvergroot met factor 3,2 (vermeld dit als voetnoot). Geen
  tekstlabels bij de stippen. Geen "gewenst richtbeeld"-lijn op de totaalplaat.
- Cijfertabel naast de grafiek, waarden in de lijnkleur.

## Indicatieve profielen (werkhypothese — géén meting)
Via Jeugd nu: familie 40, adhocratie 30, markt 10, hiërarchie 20.
Koraal nu: familie 25, adhocratie 10, markt 15, hiërarchie 50.
Gewenst richtbeeld (alleen in documenten): familie 30, adhocratie 25, markt 15,
hiërarchie 30. Altijd markeren als inschatting; vervangen door echte metingen
zodra die er zijn.

## OCAI-vraagteksten
De definitieve Nederlandse uitspraken (zorgcontext; "markt" = positie bij
opdrachtgevers/gemeenten) staan in index.html in de constante DIMS. Die teksten
zijn afgestemd met het Word-instrument — bij wijziging beide bijwerken.

## Deploy
- Repo `marcovanthiel/marcovanthiel-static` → push naar `main` triggert
  Cloudflare Pages-build (Hugo + Pages Functions) → live op
  `https://marcovanthiel.nl/koraalenviajeugd/`.
- Bindings in Cloudflare-dashboard: D1 `OCAI_DB` (database `ocai`,
  uuid in `wrangler d1 list`); env-var `OCAI_ADMIN_TOKEN` (Secret).
- Schema in `scripts/koraalenviajeugd/schema.sql` (eenmalig via
  `wrangler d1 execute ocai --remote --file=…`).
- Voor livegang: alle ref's beginnend met `O-DEMO-` of `O-DEAD0/O-BEEF0`
  uit D1 verwijderen (`DELETE FROM inzendingen WHERE ref LIKE 'O-DE%' OR ref LIKE 'O-BE%';`).

## Gerelateerde deliverables (in claude.ai-project, niet in deze repo)
Brainstorm-placemat (2×A4), presentatie 23 juni (pptx op Koraal-sjabloon),
document "Vier modellen voor cultuurintegratie", Word-versie van het
OCAI-instrument. Bij inhoudelijke wijzigingen aan vragen of profielen: ook deze
documenten laten bijwerken in de chat.

## Changelog
- 2026-06-11: eerste versie van dit bestand, op basis van de chat waarin het
  instrument is gebouwd en getest (PHP 8.3, lokaal gevalideerd).
