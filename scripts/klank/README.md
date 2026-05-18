# Vocaal Ensemble Klank — reserveringen

Backend voor `marcovanthiel.nl/vocaalensembleklank`. Eenmalig opzetten in
Cloudflare; daarna draait alles automatisch.

## Architectuur (kort)

```
Browser
  └── POST /api/klank/reserve              ──► functions/api/klank/reserve.ts
        ├─ insert in D1 KLANK_DB              (tabel `reservaties`)
        └─ Resend  → bevestigingsmail naar koper + BCC naar Marco

Admin (alleen Marco)
  └── GET  /api/klank/admin/export?token=…  ──► functions/api/klank/admin/export.ts
        └─ select uit D1 → CSV (UTF-8 + BOM) of JSON
```

## Eenmalige setup (Cloudflare-dashboard + wrangler)

1. **D1-database aanmaken** (lokaal of in Cloudflare-dashboard):
   ```sh
   npx wrangler d1 create klank
   ```
   Noteer de `database_id` uit de output.

2. **D1-binding aan Pages-project koppelen** — Cloudflare-dashboard →
   `marcovanthiel-static` → **Settings → Functions → D1 database bindings**:
   - Variable name: `KLANK_DB`
   - D1 database: de zojuist aangemaakte `klank`
   - Zet zowel voor **Production** als **Preview**.

3. **Schema laden**:
   ```sh
   npx wrangler d1 execute klank --remote --file=scripts/klank/schema.sql
   ```

4. **Env-vars toevoegen** — Cloudflare-dashboard → Pages →
   `marcovanthiel-static` → **Settings → Environment variables**:
   - `RESEND_API_KEY` — bestaand secret (al gezet voor /api/contact).
   - `KLANK_ADMIN_TOKEN` — genereer een willekeurige string (zie
     `openssl rand -hex 32`). **Encrypt** aanvinken. Production + Preview.
   - Optioneel `RESEND_FROM` — default `Vocaal Ensemble Klank <no-reply@marcovanthiel.nl>`.
   - Optioneel `KLANK_BCC`  — default `marco@marcovanthiel.nl`.

5. **DNS / mailbox** (één keer):
   - Zorg dat `klank@marcovanthiel.nl` als alias of mailbox bestaat,
     anders bouncen reply-mails.
   - `marcovanthiel.nl` is al verified bij Resend (voor /api/contact),
     dus geen extra SPF/DKIM nodig.

## Lijst exporteren

Na deploy:

```sh
# CSV-download (UTF-8 met BOM, opent goed in Excel/Numbers)
curl -L -OJ \
  "https://marcovanthiel.nl/api/klank/admin/export?token=<KLANK_ADMIN_TOKEN>"

# Of als JSON in de terminal
curl -H "Authorization: Bearer <KLANK_ADMIN_TOKEN>" \
  "https://marcovanthiel.nl/api/klank/admin/export?format=json" | jq
```

Of plak gewoon in de browser:
`https://marcovanthiel.nl/api/klank/admin/export?token=<TOKEN>`

Default-filter is `concert=midzomer-2026`. Voor een ander concert:
`...?token=…&concert=<id>`.

### Admin-pagina

`https://marcovanthiel.nl/vocaalensembleklank/admin/` — login met
`KLANK_ADMIN_TOKEN`, daarna live overzicht met totalen + tabel +
één-klik CSV-download. Token blijft in sessionStorage (alleen in dat
browser-tabblad). Pagina is `noindex, nofollow`.

## Velden in de CSV

| Kolom        | Toelichting                                     |
| ------------ | ----------------------------------------------- |
| `naam`       | Naam van de reserveerder                        |
| `woonplaats` | Woonplaats                                      |
| `email`      | E-mailadres (lowercase opgeslagen)              |
| `aantal`     | Aantal kaarten                                  |
| `bedrag_eur` | Totaal te innen aan de deur                     |
| `referentie` | Korte ref (bv. `K-7M3X-A4`) zoals in de mail    |
| `aangemaakt` | UTC-timestamp van reservering                   |
| `id`         | Interne D1-row-id                               |

Onderaan staat een samenvatting (totaal reserveringen, kaarten, bedrag).
