#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${KIU_PRODUCTION_ENV_FILE:-$ROOT/.env.production}"
BACKUP_DIR="${KIU_BACKUP_DIR:-$ROOT/backups/postgres}"
CONTAINER="${KIU_PRODUCTION_POSTGRES_CONTAINER:-kiu-portal-postgres}"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"
[[ -x "$DOCKER_BIN" ]] || { echo "Missing docker" >&2; exit 1; }
set -a
. "$ENV_FILE"
set +a
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/kiu-portal-${STAMP}.dump"

"$DOCKER_BIN" exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl > "$TARGET"
chmod 600 "$TARGET"
find "$BACKUP_DIR" -type f -name 'kiu-portal-*.dump' -mtime +30 -delete
printf 'Created %s\n' "$TARGET"
