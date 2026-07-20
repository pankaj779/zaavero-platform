#!/usr/bin/env bash
# Restore a custom-format pg_dump into the database pointed at by DIRECT_URL.
# Usage: DIRECT_URL=... ./scripts/restore-database.sh ./backups/graphology-….dump
set -euo pipefail

DUMP="${1:-}"
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: $0 <path-to-.dump>" >&2
  exit 1
fi

URL="${DIRECT_URL:-}"
if [[ -z "$URL" ]]; then
  echo "Set DIRECT_URL to the Neon direct (non-pooled) connection string." >&2
  exit 1
fi

echo "WARNING: This will overwrite objects in the target database."
echo "Target: $URL"
read -r -p "Type RESTORE to continue: " CONFIRM
if [[ "$CONFIRM" != "RESTORE" ]]; then
  echo "Aborted."
  exit 1
fi

pg_restore "$URL" --clean --if-exists --no-owner --no-acl --dbname="$URL" "$DUMP" || true
echo "Restore attempted from $DUMP. Verify with prisma migrate status."
