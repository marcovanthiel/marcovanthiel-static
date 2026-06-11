# Cultuurmeting Koraal & Via Jeugd (OCAI) — setup

De vragenlijst draait op `https://marcovanthiel.nl/koraalenviajeugd/`.
De beheerpagina (token-beveiligd) staat op
`https://marcovanthiel.nl/koraalenviajeugd/admin/`.

Origineel is een PHP-applicatie, gepubliceerd op de Hugo-zustersite via
**Cloudflare Pages Functions** + een **D1**-database.

## Eénmalige setup in het Cloudflare-dashboard

1. **D1-database aanmaken**
   - Workers & Pages → D1 → *Create database* → naam `ocai`
   - Onthoud het database-ID (heb je niet nodig voor binding, alleen
     voor `wrangler` als je het schema vanaf de CLI wil draaien).

2. **Schema draaien**
   - Tab *Console* in de D1-database openen
   - Inhoud van `scripts/koraalenviajeugd/schema.sql` plakken en uitvoeren
   - Of CLI: `wrangler d1 execute ocai --remote --file=scripts/koraalenviajeugd/schema.sql`

3. **D1-binding op het Pages-project**
   - Pages-project `marcovanthiel` → *Settings* → *Functions* → *D1 database bindings*
   - **Variable name:** `OCAI_DB`
   - **D1 database:** `ocai`
   - Klik *Save* — geldt voor productie. Voor preview-environment
     herhalen.

4. **Admin-token instellen**
   - Pages-project → *Settings* → *Environment variables* → *Production*
   - **Type:** *Secret*
   - **Variable name:** `OCAI_ADMIN_TOKEN`
   - **Value:** een lange random string (bv. `openssl rand -base64 32`)
   - *Add variable* + *Save*

5. **Eerstvolgende deploy triggeren**
   - Push een commit (of *Deployments* → *Retry deployment*) zodat de
     nieuwe bindings worden opgepikt.

## Delen

- **Met medewerkers:** alleen `https://marcovanthiel.nl/koraalenviajeugd/`
- **Beheerpagina (intern):** `https://marcovanthiel.nl/koraalenviajeugd/admin/`
  + het admin-token van stap 4

## Privacy

De Pages Function bewaart **geen** namen of e-mailadressen — alleen
organisatie, optioneel team, de scores en het tijdstip. Het IP-adres
wordt gelogd voor abuse-mitigation, niet voor identificatie.

## Bestanden

| Wat | Waar |
|---|---|
| Vragenlijst | `static/koraalenviajeugd/index.html` |
| Admin-UI | `static/koraalenviajeugd/admin/index.html` |
| Logo's | `static/koraalenviajeugd/koraal_logo.png`, `vj_logo_ok.png` |
| POST opslaan-endpoint | `functions/api/koraalenviajeugd/opslaan.ts` |
| GET admin-lijst | `functions/api/koraalenviajeugd/admin/list.ts` |
| GET CSV-export | `functions/api/koraalenviajeugd/admin/export.ts` |
| D1-schema | `scripts/koraalenviajeugd/schema.sql` |
