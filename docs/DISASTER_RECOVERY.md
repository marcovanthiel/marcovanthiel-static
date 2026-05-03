# Disaster Recovery — marcovanthiel.nl

Statische Hugo-site op Cloudflare Pages. De inhoud zit in deze repo;
backup is daarmee deels al geregeld via Git. Wat hieronder staat dekt
de scenario's die git alleen niet oplost.

> **Eerste regel bij paniek**: niets verwijderen tot je zeker weet dat
> je een werkende backup hebt. **Tweede regel**: Cloudflare Pages
> bewaart oudere deploys — een rollback gaat sneller dan een full
> rebuild.

## Componenten en hun staat-eigenaars

| Component | Wie heeft de data | Backup-status |
|---|---|---|
| Source code | GitHub `marcovanthiel/marcovanthiel-static` | Git history |
| Hugo content + images | In de repo | Git history |
| Cloudflare Pages build | Cloudflare project `marcovanthiel-static` | Native; oude deploys via UI |
| DNS | Cloudflare zone `marcovanthiel.nl` | Geëxporteerde BIND-zone in `docs/dns-zones/` |

## RTO/RPO

- **RPO**: 0 — alle inhoud staat in git, dus we verliezen alleen wat na de laatste commit nog niet is gecommit.
- **RTO**: 30 minuten voor een complete relocatie naar een nieuwe Cloudflare Pages of Netlify, mits de DNS-zone-export beschikbaar is.

## Eenmalige off-site backup uitvoeren

Voor de Hugo-site zijn drie dingen relevant om periodiek vast te leggen:

```bash
# 1. Git-clone op een tweede machine of externe schijf — eenmalig
git clone --mirror git@github.com:marcovanthiel/marcovanthiel-static.git \
  ~/Backups/marcovanthiel-static.git

# 2. Update de mirror periodiek (bv. eens per maand)
cd ~/Backups/marcovanthiel-static.git && git remote update

# 3. Cloudflare DNS-zone export naar deze repo
./scripts/backup-once.sh
```

Het script committeert de geëxporteerde DNS-zone naar `docs/dns-zones/`
zodat de zone mee-versionet met de rest van de site.

## Restore-procedures

### Scenario 1 — Cloudflare Pages deploy stuk

1. Cloudflare dashboard → Pages → marcovanthiel-static → tab **Deployments**
2. Klik op een eerdere groene deploy → **Rollback to this deployment**
3. Live in <60 seconden.

### Scenario 2 — Cloudflare Pages-project compleet weg

1. Maak een nieuw Pages-project, gekoppeld aan dezelfde GitHub-repo.
2. Build settings (uit `cloudflare.toml`):
   - Framework preset: Hugo
   - Build command: `hugo --minify`
   - Build output: `public`
   - Hugo version env-var: `HUGO_VERSION=0.121.0` (of recenter)
3. Custom domains: `marcovanthiel.nl` + `www.marcovanthiel.nl`
4. Cloudflare DNS verandert automatisch als het project de juiste hostname claimt.

### Scenario 3 — DNS gehijackt (Cloudflare-account compromise)

1. Reset Cloudflare-wachtwoord + 2FA via mail-recovery.
2. Importeer `docs/dns-zones/marcovanthiel.nl.zone` (BIND-formaat) via Cloudflare DNS → Import.
3. Zet alle `proxied`-vlaggen terug zoals voorheen (de export bevat alleen records, niet de proxy-state).
4. Roteer SMTP-credentials, R2-keys en alle andere secrets — een Cloudflare-hack betekent ook MITM-risico.

### Scenario 4 — GitHub-repo verdwenen

1. Push de lokale clone (`~/Backups/marcovanthiel-static.git` of een werkdirectory) naar een nieuwe remote.
2. Update Cloudflare Pages → Settings → Source → Repository naar de nieuwe URL.
3. Trigger handmatige deploy.

### Scenario 5 — Hele Cloudflare-account weg + DNS bij andere registrar

1. Provisie het domein bij een nieuwe DNS-host (bv. DNSimple, Hetzner DNS).
2. Importeer `docs/dns-zones/marcovanthiel.nl.zone`.
3. Push de site naar Netlify, Vercel of een nieuwe Cloudflare-account.
4. Update nameserver-records bij de domain-registrar (één-malig handmatig).

## Tools die je moet hebben (eenmalig op je MacBook)

```bash
# curl + jq voor de Cloudflare DNS-export
brew install jq
# (curl is standaard aanwezig)

# Git is standaard aanwezig op macOS
```

## Periodiek werk

Zet in je agenda:

- **Maandelijks**: `./scripts/backup-once.sh` draaien → committeert DNS-zone export
- **Maandelijks**: `cd ~/Backups/marcovanthiel-static.git && git remote update`
- **Kwartaal**: doe een **rollback-test** in Cloudflare Pages (zie scenario 1) → bevestigt dat de UI-knop werkt

## Logging

Houd in `docs/RESTORE_TEST_LOG.md` per oefening of incident bij:
- Datum + tijd
- Scenario (1-5)
- Hoelang het herstel duurde
- Wat er beter kan
