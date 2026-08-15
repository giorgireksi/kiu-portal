#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"
[[ -x "$DOCKER_BIN" ]] || { echo "Missing docker" >&2; exit 1; }
COMPOSE=("$DOCKER_BIN" compose --env-file "$ROOT/.env.production" -f "$ROOT/docker-compose.production.yml")
OUTPUT_DIR="${1:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$OUTPUT_DIR/kiu-production-$STAMP"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "Creating PostgreSQL backup..."
"${COMPOSE[@]}" exec -T postgres sh -c \
    'pg_dump --format=custom --no-owner --no-acl --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
    > "$BACKUP_DIR/postgres.dump"

echo "Creating uploads backup..."
"${COMPOSE[@]}" run --rm --no-deps portal-backend sh -c \
    'tar -czf - -C /app/kiu-realtime-bridge uploads' \
    > "$BACKUP_DIR/uploads.tar.gz"

sha256sum "$BACKUP_DIR/postgres.dump" "$BACKUP_DIR/uploads.tar.gz" > "$BACKUP_DIR/SHA256SUMS"
cat > "$BACKUP_DIR/manifest.txt" <<EOF
created_at=$STAMP
postgres_dump=postgres.dump
uploads_archive=uploads.tar.gz
sha256sums=SHA256SUMS
EOF
chmod 600 "$BACKUP_DIR"/*
find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -type d -name 'kiu-production-*' -mtime +30 -exec rm -rf {} +

echo "Production backup created: $BACKUP_DIR"
