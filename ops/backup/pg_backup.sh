#!/usr/bin/env bash
set -euo pipefail
: "${PGBACKUP_URL:?PGBACKUP_URL not set}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/out}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
pg_dump "$PGBACKUP_URL" -Fc -Z6 -f "$BACKUP_DIR/hefa_${STAMP}.dump"
find "$BACKUP_DIR" -name 'hefa_*.dump' -mtime +14 -delete
echo "Backup: $BACKUP_DIR/hefa_${STAMP}.dump"
