#!/usr/bin/env bash
# Backup Neon / PostgreSQL using pg_dump against DIRECT_URL (not the pooled URL).
# Usage: DATABASE_URL=... DIRECT_URL=... ./scripts/backup-database.sh [output-dir]
set -euo pipefail

OUT_DIR="${1:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"

URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [[ -z "$URL" ]]; then
  echo "Set DIRECT_URL (preferred) or DATABASE_URL before running." >&2
  exit 1
fi

FILE="$OUT_DIR/graphology-$STAMP.dump"
echo "Backing up to $FILE"
pg_dump "$URL" --format=custom --no-owner --no-acl --file="$FILE"
echo "OK: $FILE ($(du -h "$FILE" | cut -f1))"
