#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose --env-file "$ROOT/.env.production" -f "$ROOT/docker-compose.production.yml")
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

cat > "$BACKUP_DIR/manifest.txt" <<EOF
created_at=$STAMP
postgres_dump=postgres.dump
uploads_archive=uploads.tar.gz
EOF
chmod 600 "$BACKUP_DIR"/*

echo "Production backup created: $BACKUP_DIR"
