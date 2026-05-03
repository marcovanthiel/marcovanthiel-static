#!/usr/bin/env bash
#
# Eenmalige off-site backup van marcovanthiel.nl:
#   - Cloudflare DNS-zone export (BIND-formaat) → docs/dns-zones/
#   - Optioneel: commit + push als de zone is gewijzigd
#
# Configuratie in ~/.config/marcovanthiel-backup.env (gitignored, 600):
#   CF_API_TOKEN=<Cloudflare API token met Zone:Read>
#   CF_ZONE_NAME=marcovanthiel.nl
#
# Een API token maak je in Cloudflare → My Profile → API Tokens
# met als permissies: Zone → DNS → Read voor zone marcovanthiel.nl.
#
# Restore-procedure: zie docs/DISASTER_RECOVERY.md.

set -euo pipefail

CONFIG_FILE="${CONFIG_FILE:-$HOME/.config/marcovanthiel-backup.env}"

# ---------- Inlezen van de credentials ----------------------------------

if [[ ! -f "$CONFIG_FILE" ]]; then
  cat <<EOF >&2
[backup-once] config-file ontbreekt: $CONFIG_FILE

Maak hem aan met:
  mkdir -p "\$(dirname "$CONFIG_FILE")"
  touch "$CONFIG_FILE" && chmod 600 "$CONFIG_FILE"

en vul in:
  CF_API_TOKEN=<Cloudflare API token met Zone:Read>
  CF_ZONE_NAME=marcovanthiel.nl

Zie docs/DISASTER_RECOVERY.md voor uitleg.
EOF
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

: "${CF_API_TOKEN:?CF_API_TOKEN ontbreekt in $CONFIG_FILE}"
: "${CF_ZONE_NAME:?CF_ZONE_NAME ontbreekt in $CONFIG_FILE}"

for tool in curl jq; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "[backup-once] $tool niet gevonden in PATH. Run: brew install $tool" >&2
    exit 1
  fi
done

# ---------- Repo-locatie -------------------------------------------------

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZONE_DIR="$REPO_ROOT/docs/dns-zones"
mkdir -p "$ZONE_DIR"

# ---------- 1. Zone-id ophalen ------------------------------------------

echo "[backup-once] (1/2) zone-id zoeken voor $CF_ZONE_NAME..."

ZONE_RESPONSE=$(curl -fsS -X GET \
  "https://api.cloudflare.com/client/v4/zones?name=$CF_ZONE_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id // empty')
if [[ -z "$ZONE_ID" ]]; then
  echo "[backup-once] geen zone gevonden voor $CF_ZONE_NAME" >&2
  echo "$ZONE_RESPONSE" | jq . >&2 || echo "$ZONE_RESPONSE" >&2
  exit 1
fi
echo "[backup-once]    zone_id: $ZONE_ID"

# ---------- 2. BIND-export -----------------------------------------------

echo "[backup-once] (2/2) zone exporteren..."

ZONE_FILE="$ZONE_DIR/$CF_ZONE_NAME.zone"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')

{
  echo "; Cloudflare DNS-zone export voor $CF_ZONE_NAME"
  echo "; Gegenereerd op $TIMESTAMP"
  echo "; Restore: Cloudflare dashboard → DNS → Records → Import en hier importeren"
  echo ";"
  curl -fsS -X GET \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/export" \
    -H "Authorization: Bearer $CF_API_TOKEN"
} > "$ZONE_FILE"

LINE_COUNT=$(grep -cv '^;' "$ZONE_FILE" || true)
echo "[backup-once]    geëxporteerd → $ZONE_FILE ($LINE_COUNT records)"

# ---------- 3. Git-status laten zien -------------------------------------

if (cd "$REPO_ROOT" && git diff --quiet -- "docs/dns-zones/$CF_ZONE_NAME.zone" 2>/dev/null); then
  echo "[backup-once] zone ongewijzigd t.o.v. vorige export."
else
  echo "[backup-once] zone GEWIJZIGD. Commit + push handmatig:"
  echo "    cd $REPO_ROOT"
  echo "    git add docs/dns-zones/$CF_ZONE_NAME.zone"
  echo "    git commit -m 'docs: dns-zone export $(date +%Y-%m-%d)'"
  echo "    git push"
fi

echo
echo "[backup-once] klaar."
