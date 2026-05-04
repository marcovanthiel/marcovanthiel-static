# Automatische dagelijkse update via GitHub Actions

Een GitHub Actions-workflow draait dagelijks om **06:00 UTC** (≈ 08:00
Amsterdam in de zomer, 07:00 in de winter), zoekt nieuw Biennale-nieuws via
de Claude API + `web_search`, schrijft een nieuw bulletin-item in vijf talen,
commit naar `main`, en laat Cloudflare Pages automatisch rebuilden.

## Architectuur

```
┌──────────────────────────┐
│ GitHub Actions cron      │  06:00 UTC, dagelijks
│ .github/workflows/       │
│   biennale-daily-update.yml
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ scripts/biennale/        │  Python · anthropic SDK
│   daily-update.py        │
│  ─ leest index.html      │
│  ─ leest prompt.md       │
│  ─ Claude API + web_search
│  ─ insert update-entry   │
└────────────┬─────────────┘
             │ index.html gewijzigd?
             ▼
┌──────────────────────────┐
│ git commit + push        │  bot-account "biennale-bot"
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Cloudflare Pages         │  detecteert push, runt `hugo --minify`,
│   rebuild + deploy       │  publiceert binnen ~1–2 min
└──────────────────────────┘
```

## Setup-checklist (eenmalig)

### 1. Secrets in de GitHub-repo

Ga naar **Settings → Secrets and variables → Actions → New repository secret**:

| Secret naam | Inhoud | Waar vandaan |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | https://console.anthropic.com/settings/keys |

> **Dat is alles.** Geen SSH-key, geen FTP-credentials. Cloudflare Pages
> deployt zelf zodra de bot naar `main` pusht.

### 2. (Optioneel) Variable voor het Claude-model

**Settings → Secrets and variables → Actions → Variables → New variable**:

| Variable | Voorbeeldwaarde |
|---|---|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` (default · sneller/goedkoper) of `claude-opus-4-6` (uitgebreider) |

### 3. Workflow voor het eerst handmatig draaien

In GitHub:

1. **Actions** → **Biennale daily update** in de zijbalk.
2. **Run workflow** → **Run workflow** (groene knop).
3. Wacht ~2 minuten.
4. Klik op de run → **Summary** voor het resultaat.

Vanaf dan loopt het elke dag automatisch.

## Wat gebeurt er per run?

1. Repo checkout (volledige history voor diff).
2. Python 3.11 + `anthropic` SDK installeren via `scripts/biennale/requirements.txt`.
3. **`scripts/biennale/daily-update.py`** wordt aangeroepen:
   - Leest `static/biennalevenetie2026/index.html`, isoleert de laatste 8 update-entries als context (deduplicatie).
   - Leest `scripts/biennale/daily-update.prompt.md` als instructies.
   - Roept Claude (`claude-sonnet-4-6`) aan met de `web_search`-tool, max 6 zoekacties.
   - Claude scant Tier-1 (Art Newspaper feed) eerst, daarna Tier-2.
   - Output: óf één `<article class="update-entry">`, óf het token `NO_UPDATE`.
4. Indien een nieuwe entry: invoegen bovenaan `<div class="updates">` in `index.html`.
5. **Commit & push** door `biennale-bot` naar `main`.
6. **Cloudflare Pages** detecteert de push, runt `hugo --minify`, deployt binnen 1–2 minuten.
7. **Summary** in de Actions-UI: ✅ updated of ℹ️ no update today, plus eerste 60 regels van het log.

## Verwachte kosten

- **Claude API**: ~3.000–8.000 tokens per run met `claude-sonnet-4-6` ≈ $0,02–$0,06 per dag. Web_search inbegrepen tot 6 calls.
- **GitHub Actions**: gratis voor publieke repos. Voor private: ~3 minuten per run, ruim binnen de gratis 2.000 min/maand.
- **Cloudflare Pages**: gratis tot 500 builds/maand.

Totaal: <$2 per maand.

## Troubleshooting

| Probleem | Oorzaak | Fix |
|---|---|---|
| Workflow faalt op `Run daily update` | API key ontbreekt of ongeldig | Controleer secret `ANTHROPIC_API_KEY` |
| Workflow slaagt maar geen commit | Claude gaf `NO_UPDATE` terug | Geen actie nodig — er was niks materieels |
| Workflow committeert maar de site verandert niet | Cloudflare-rebuild faalt | Cloudflare-dashboard → Pages → marcovanthiel → Deployments → bekijk de laatste build-log |
| Workflow draait niet automatisch | Scheduled workflows hebben tot 60 min vertraging | Geduld, of trigger handmatig via "Run workflow" |
| Tijdstip aanpassen | | Edit `cron: '0 6 * * *'` in `.github/workflows/biennale-daily-update.yml` (UTC) |
| PR-modus i.p.v. direct commit | Veiligheid: jij keurt eerst goed | Vervang het `Commit changes`-blok door `peter-evans/create-pull-request@v6` |

## Aan/uit zetten

**Pauzeren** zonder verwijderen:

1. **Actions** → **Biennale daily update**.
2. **`...` (meer-menu) → Disable workflow**.

Activeren via dezelfde route → **Enable workflow**.

## Lokaal testen vóór je naar GitHub pusht

```bash
# in de repo-root
export ANTHROPIC_API_KEY=sk-ant-...
pip install -r scripts/biennale/requirements.txt
python scripts/biennale/daily-update.py
```

Bekijk de output. Als `index.html` is gewijzigd, controleer met
`hugo server --minify` dat de nieuwe entry netjes verschijnt.
