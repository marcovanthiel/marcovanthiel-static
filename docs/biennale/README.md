# Biennale di Venezia 2026 — magazine subpagina

Een meertalig (NL · EN · IT · DE · 中文) magazine over de 61e Biennale Arte
van Venetië, *In Minor Keys* — gepubliceerd als **statische subpagina** binnen
de Hugo-site `marcovanthiel.nl/biennalevenetie2026`.

Dagelijks automatisch bijgewerkt door GitHub Actions tijdens openingsmaand
(mei – juni 2026).

## Locaties in deze repo

| Onderdeel | Pad |
|---|---|
| Magazine zelf (HTML, CSS, JS, SVG) | `static/biennalevenetie2026/` |
| Auto-update Python script | `scripts/biennale/daily-update.py` |
| Redactionele instructies voor Claude | `scripts/biennale/daily-update.prompt.md` |
| Workflow (cron) | `.github/workflows/biennale-daily-update.yml` |
| Documentatie | `docs/biennale/` |

Het magazine staat onder `static/` zodat Hugo het verbatim doorpubliceert —
geen Hugo-templates of i18n-conversie nodig. De interne taalwisselaar (JS)
draait standalone naast Hugo's eigen meertalige pagina's.

## Hoe werkt het?

1. **Cron** in GitHub Actions draait elke dag om 06:00 UTC.
2. **`scripts/biennale/daily-update.py`** roept de Claude API aan met de
   `web_search`-tool. Claude scant de Tier-1 feed (Art Newspaper ·
   `venice-biennale-2026`) en Tier-2 outlets, en genereert óf één nieuwe
   `<article class="update-entry">` in vijf talen, óf het token `NO_UPDATE`.
3. Bij een nieuwe entry: het script invoegt boven aan de live-bulletin van
   `static/biennalevenetie2026/index.html`.
4. **Commit + push** naar `main` door bot-account `biennale-bot`.
5. **Cloudflare Pages** detecteert de push en rebuildt automatisch (Hugo).
   De pagina is binnen 1–2 minuten live op
   `marcovanthiel.nl/biennalevenetie2026/`.

## Setup-instructies

- Eenmalige configuratie van GitHub-secrets: zie `docs/biennale/AUTO-UPDATE.md`.
- Handmatig een update toevoegen (bijv. tussendoor): zie `docs/biennale/UPDATE.md`.

## Lokaal testen

Na het clonen van de repo:

```bash
# 1. Hugo lokaal draaien (toont het hele marcovanthiel.nl):
hugo server --minify
# → bekijk op http://localhost:1313/biennalevenetie2026/

# 2. Of alleen de magazine-pagina als statisch bestand:
cd static/biennalevenetie2026
python3 -m http.server 8000
# → http://localhost:8000
```

## Bronnen

La Biennale, The Art Newspaper, ArtReview, Artnet, ARTnews, Il Giornale
dell'Arte, CNN, designboom, Wallpaper*, Hyperallergic, Mondriaan Fonds,
e-flux, Ocula, Museumtijdschrift.

## Credits

Redactie & ontwerp: Marco van Thiel, met assistentie van Claude (Anthropic).
Paviljoen-illustraties: redactionele SVG's — bedoeld als plaatshouder, te
vervangen door echte persfoto's met juiste credits zodra beschikbaar.
