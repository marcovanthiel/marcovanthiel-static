# marcovanthiel.nl — Hugo + Cloudflare Pages

Persoonlijke site van Marco van Thiel — interim CIO en programmamanager.
Statische Hugo-build, gehost op Cloudflare Pages, met een Cloudflare
Pages Function voor het contactformulier (Resend) en een GitHub Actions
workflow voor de dagelijkse Biennale-update.

## Stack

| Onderdeel | Keus | Waarom |
|---|---|---|
| Static-site generator | **Hugo** (`v0.140.2`+) | Snel, simpele multilang, Cloudflare-template |
| Hosting | **Cloudflare Pages** | Auto-deploy bij push naar `main` |
| Email-formulier | **Resend** via Pages Function | Geen externe form-service, AVG-vriendelijk |
| Daily updates | **GitHub Actions + Anthropic API** | Biennale-magazine wordt elke ochtend automatisch ververst |
| Talen | NL (default), EN, DE, IT, CN | hreflang correct (`zh-CN` voor Mandarijn) |

## Repo-structuur

```
.
├── config.yaml                    # Hoofdconfig (talen, params, markup)
├── config/_default/menus.<lang>.yaml   # Menu's per taal
├── cloudflare.toml                # Build-config voor Cloudflare Pages
├── content/<lang>/                # Markdown content per taal
│   ├── _index.md                  # Homepage
│   ├── kunst.md                   # /kunst/ pagina
│   ├── cases/                     # /cases/<slug>/ — auto-gegenereerd
│   ├── contact.md                 # /contact/ — met inline form
│   └── privacy.md                 # /privacy/
├── data/projects/<lang>.json      # Project/case-data per taal
├── functions/api/contact.ts       # Cloudflare Pages Function — Resend-mail
├── i18n/<lang>.yaml               # Vertaalde UI-strings
├── scripts/
│   ├── gen-cases.py               # Genereert content/<lang>/cases/*.md uit data/projects/
│   ├── biennale/                  # Daily-update scripts voor de magazine
│   └── backup-once.sh             # DR backup-script
├── static/
│   ├── _headers                   # Cache + security headers
│   ├── manifest.webmanifest       # PWA manifest
│   ├── robots.txt
│   ├── images/                    # Logo, og-cover, project-images
│   └── biennalevenetie2026/       # De magazine-subpagina
├── themes/marcotheme/
│   ├── assets/{css,js}/           # Styling + JS
│   ├── layouts/_default/          # baseof.html, single.html
│   ├── layouts/cases/{single,list}.html
│   └── layouts/contact/single.html
├── docs/
│   ├── INFRASTRUCTUUR.md
│   ├── DISASTER_RECOVERY.md
│   ├── CONTACT-FORM.md            # Resend + Pages Function uitleg
│   └── biennale/                  # Daily-update docs
└── .github/
    ├── workflows/biennale-daily-update.yml
    └── (geen Dependabot — Hugo build heeft geen npm-deps)
```

## Lokale ontwikkeling

### Vereisten

- **Hugo extended** (≥ v0.140.2) — `brew install hugo`
- **Python 3** voor `gen-cases.py` en de Biennale-scripts
- **Inkscape + Ghostscript + librsvg** als je SVG/PNG-conversies doet (`brew install inkscape ghostscript librsvg`)
- **Optioneel:** Chrome voor headless preview-renders

### Starten

```bash
git clone https://github.com/marcovanthiel/marcovanthiel-static.git
cd marcovanthiel-static
hugo server -D     # http://localhost:1313/
```

### Cases regenereren (na wijziging in `data/projects/`)

```bash
python3 scripts/gen-cases.py
```

Dit verwijdert `content/<lang>/cases/` en regenereert per project een
`.md` bestand. De slug komt uit de NL-titel zodat alle talen identieke
URL-paden krijgen.

### Logo / og-cover regenereren

Bron-EPS staat NIET in de repo (geheim) — vraag het bij Marco. Pipeline:

```bash
gs -dNOPAUSE -dBATCH -dEPSCrop -sDEVICE=pdfwrite \
   -sOutputFile=/tmp/logo.pdf "Van Thiel Logo EPS.eps"
inkscape /tmp/logo.pdf --export-plain-svg \
   --export-filename=themes/marcotheme/static/images/logo/logo.svg
npx svgo themes/marcotheme/static/images/logo/logo.svg -o ... --multipass
rsvg-convert -w 1200 -h 630 static/images/og-cover.svg -o static/images/og-cover.png
```

## Deployment

### Cloudflare Pages

- **Branch**: `main` triggert auto-deploy
- **Build command**: `hugo --minify`
- **Build output**: `public/`
- **Functions**: alles in `functions/` wordt automatisch geserveerd
  als API onder `/api/...`

### Verplichte environment variables (Cloudflare Pages → Settings → Environment variables)

| Naam | Waarde | Voor |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxx` | Contactformulier — anders error 503 |
| `RESEND_FROM` | (optioneel) `Marco van Thiel <no-reply@marcovanthiel.nl>` | Override default |
| `RESEND_TO` | (optioneel) `marco@marcovanthiel.nl` | Override default |

### GitHub Secrets (voor Biennale-workflow)

| Naam | Waarde | Voor |
|---|---|---|
| `ANTHROPIC_API_KEY` | sk-ant-xxxxxx | Daily Biennale-update workflow |

Optionele variable (geen secret):
- `ANTHROPIC_MODEL` — default `claude-sonnet-4-6`

## Inhoud aanpassen

| Verandering | Bestand(en) |
|---|---|
| Homepage hero-tekst | `content/<lang>/_index.md` |
| Case toevoegen | `data/projects/<lang>.json` → `python3 scripts/gen-cases.py` |
| Menu-volgorde / -namen | `config/_default/menus.<lang>.yaml` (weight = volgorde) |
| Privacyverklaring | `content/<lang>/privacy.md` |
| Contact-pagina + form | `content/<lang>/contact.md` + `functions/api/contact.ts` |
| og:image / metadata | `config.yaml` `params.ogImage` |
| UI-strings (knoppen) | `i18n/<lang>.yaml` |

## Recente wijzigingen — wat zit er nu in

- **Logo (SVG)** uit originele EPS-bron met custom flourishes (47 KB)
- **Header full-width** met grid-layout — logo links, nav rechts
- **Cases**: 20 case-pagina's per taal (100 totaal), auto-gegenereerd
  uit `data/projects/`
- **Contact-pagina** met Resend-backed formulier (Pages Function)
- **Biennale magazine** op `/biennalevenetie2026/` met daily-update
  via GitHub Actions
- **SEO/security**: og:image, hreflang `zh-CN`, HSTS, robots.txt,
  manifest, JSON-LD met PostalAddress + alumniOf + knowsAbout
- **Privacy-pagina** in 5 talen, gelinkt vanuit footer
- **CTA's verwijderd** uit hero — focus op rustige typografie

## License

© 2026 Marco van Thiel. Alle rechten voorbehouden.
