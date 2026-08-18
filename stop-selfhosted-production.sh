#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${KIU_PRODUCTION_ENV_FILE:-$ROOT/.env.production}"
COMPOSE_FILE="$ROOT/docker-compose.production.yml"

if command -v tailscale >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    sudo tailscale funnel --https=443 off >/dev/null 2>&1 || true
fi
DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"
if [[ -x "$DOCKER_BIN" && -f "$ENV_FILE" ]]; then
    "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
fi
