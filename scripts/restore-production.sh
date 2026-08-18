#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose --env-file "$ROOT/.env.production" -f "$ROOT/docker-compose.production.yml")
BACKUP_DIR="${1:-}"

if [[ "${KIU_CONFIRM_PRODUCTION_RESTORE:-}" != "YES" ]]; then
    echo "Refusing restore. Set KIU_CONFIRM_PRODUCTION_RESTORE=YES for the intended production database." >&2
    exit 1
fi

if [[ -z "$BACKUP_DIR" || ! -f "$BACKUP_DIR/postgres.dump" || ! -f "$BACKUP_DIR/uploads.tar.gz" ]]; then
    echo "Usage: KIU_CONFIRM_PRODUCTION_RESTORE=YES $0 backups/kiu-production-<timestamp>" >&2
    exit 1
fi

restart_services() {
    "${COMPOSE[@]}" up -d portal-backend caddy >/dev/null || true
}
trap restart_services EXIT

echo "Stopping portal writers..."
"${COMPOSE[@]}" stop portal-backend caddy

echo "Restoring PostgreSQL..."
"${COMPOSE[@]}" exec -T postgres sh -c \
    'pg_restore --clean --if-exists --no-owner --no-acl --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
    < "$BACKUP_DIR/postgres.dump"

echo "Restoring uploads..."
"${COMPOSE[@]}" run --rm --no-deps portal-backend sh -c \
    'find /app/kiu-realtime-bridge/uploads -mindepth 1 -delete && tar -xzf - -C /app/kiu-realtime-bridge' \
    < "$BACKUP_DIR/uploads.tar.gz"

echo "Restore completed. Portal services will be started again."
