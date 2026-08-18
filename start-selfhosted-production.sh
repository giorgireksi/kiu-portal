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

PUBLIC_HOSTNAME="${KIU_PUBLIC_HOSTNAME:?KIU_PUBLIC_HOSTNAME is required in $ENV_FILE}"
LOCAL_WEB_ORIGIN="http://127.0.0.1:${WEB_PORT}"

# The Caddy site is host-routed. A request without the public Host header can
# receive an empty default response and falsely look healthy, while /api and
# login requests still fail through the real public hostname.
local_backend_ready() {
    curl -fsS --max-time 2 \
        -H "Host: ${PUBLIC_HOSTNAME}" \
        "${LOCAL_WEB_ORIGIN}/health" >/dev/null 2>&1 \
        && curl -fsS --max-time 2 \
        -H "Host: ${PUBLIC_HOSTNAME}" \
        "${LOCAL_WEB_ORIGIN}/ready" >/dev/null 2>&1
}

node "$ROOT/tools/check-production-readiness.js"
# This host's Docker Buildx state is root-owned. Disable Bake/BuildKit here so
# the public launcher remains usable by the normal desktop user.
COMPOSE_BAKE=false DOCKER_BUILDKIT=0 "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

# Re-resolve portal-backend after a rebuilt container gets a new Docker IP.
# Without this, an already-running Caddy can briefly keep dialing the old
# backend address and the public login/API endpoints return 502/503.
if ! local_backend_ready; then
    echo "Refreshing the public proxy backend connection..."
    "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" restart caddy
fi

for _ in $(seq 1 45); do
    if local_backend_ready; then break; fi
    sleep 2
done
if ! local_backend_ready; then
    echo "The public proxy/backend did not become ready on ${PUBLIC_HOSTNAME}." >&2
    "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps >&2 || true
    exit 1
fi

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
