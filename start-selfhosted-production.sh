#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${KIU_PRODUCTION_ENV_FILE:-$ROOT/.env.production}"
COMPOSE_FILE="$ROOT/docker-compose.production.yml"
WEB_PORT="${KIU_WEB_PORT:-8900}"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"
[[ -x "$DOCKER_BIN" ]] || { echo "Missing docker" >&2; exit 1; }
"$DOCKER_BIN" compose version >/dev/null 2>&1 || { echo "Docker Compose plugin is unavailable for $DOCKER_BIN" >&2; exit 1; }
command -v tailscale >/dev/null || { echo "Missing tailscale" >&2; exit 1; }
command -v curl >/dev/null || { echo "Missing curl" >&2; exit 1; }

set -a
. "$ENV_FILE"
set +a

node "$ROOT/tools/check-production-readiness.js"
# This host's Docker Buildx state is root-owned. Disable Bake/BuildKit here so
# the public launcher remains usable by the normal desktop user.
COMPOSE_BAKE=false DOCKER_BUILDKIT=0 "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

for _ in $(seq 1 30); do
    if curl -fsS --max-time 2 "http://127.0.0.1:${WEB_PORT}/health" >/dev/null 2>&1; then break; fi
    sleep 2
done
curl -fsS --max-time 10 "http://127.0.0.1:${WEB_PORT}/health" >/dev/null

if ! tailscale funnel status 2>/dev/null | grep -Eq "proxy[[:space:]]+http://127\\.0\\.0\\.1:${WEB_PORT}([[:space:]]|$)"; then
    sudo tailscale funnel --bg "$WEB_PORT"
fi

echo "Self-hosted production is running at ${KIU_PUBLIC_APP_URL}"

# Open the public portal automatically when this is being run from a graphical
# desktop. SSH/headless launches remain non-interactive; set KIU_OPEN_BROWSER=false
# to suppress opening even from a desktop session.
if [[ "${KIU_OPEN_BROWSER:-true}" != "false" && ( -n "${DISPLAY:-}" || -n "${WAYLAND_DISPLAY:-}" ) ]]; then
    browser=""
    if [[ -n "${KIU_BROWSER_BIN:-}" ]] && command -v "$KIU_BROWSER_BIN" >/dev/null 2>&1; then
        browser="$KIU_BROWSER_BIN"
    else
        for candidate in brave chromium google-chrome firefox; do
            if command -v "$candidate" >/dev/null 2>&1; then
                browser="$candidate"
                break
            fi
        done
    fi
    if [[ -n "$browser" ]]; then
        echo "Opening ${KIU_PUBLIC_APP_URL} in ${browser}..."
        nohup "$browser" --new-tab "$KIU_PUBLIC_APP_URL" >/dev/null 2>&1 &
    elif command -v xdg-open >/dev/null 2>&1; then
        nohup xdg-open "$KIU_PUBLIC_APP_URL" >/dev/null 2>&1 &
    fi
fi
