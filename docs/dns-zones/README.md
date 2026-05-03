# DNS-zones

Geëxporteerde Cloudflare DNS-zones in BIND-formaat. Worden bijgewerkt door
`scripts/backup-once.sh`.

## Restore

In Cloudflare dashboard → DNS → Records → **Import and Export** → kies
het bestand uit deze map. Cloudflare reconstrueert alle records;
proxied-vlaggen moeten daarna handmatig worden teruggezet (de export
bevat alleen de records, niet de proxy-state).

Zie verder `docs/DISASTER_RECOVERY.md`.
