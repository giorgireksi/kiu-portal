#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.staging.yml"
STAGING_ENV="$ROOT/.env.staging"
WEB_PORT="${KIU_PUBLIC_DEMO_WEB_PORT:-8900}"
BACKEND_PORT="${KIU_PUBLIC_DEMO_BACKEND_PORT:-47833}"
WEB_PID_FILE="${KIU_PUBLIC_DEMO_WEB_PID_FILE:-$ROOT/.public-demo-web.pid}"
WEB_PID=""
STACK_STARTED=0
FUNNEL_STARTED=0
WATCHDOG_SECONDS="${KIU_PUBLIC_DEMO_WATCHDOG_SECONDS:-5}"

read_staging_value() {
    local key="$1"
    awk -F= -v key="$key" '$1 == key {
        value = substr($0, index($0, "=") + 1);
        gsub(/^["'\'']|["'\'']$/, "", value);
        print value;
        exit;
    }' "$STAGING_ENV"
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || {
        echo "Missing required command: $1" >&2
        exit 1
    }
}

web_healthy() {
    curl --silent --fail --max-time 2 "http://127.0.0.1:${WEB_PORT}/health" >/dev/null 2>&1
}

funnel_points_here() {
    tailscale funnel status 2>/dev/null | grep -Eq "proxy[[:space:]]+http://127\\.0\\.0\\.1:${WEB_PORT}([[:space:]]|$)"
}

open_url() {
    local url="$1"
    if command -v xdg-open >/dev/null 2>&1; then
        nohup xdg-open "$url" >/dev/null 2>&1 </dev/null &
        return 0
    fi
    if command -v gio >/dev/null 2>&1; then
        nohup gio open "$url" >/dev/null 2>&1 </dev/null &
        return 0
    fi
    return 1
}

stop_web_proxy() {
    if [[ -z "$WEB_PID" && -f "$WEB_PID_FILE" ]]; then
        WEB_PID="$(<"$WEB_PID_FILE")"
    fi
    if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" >/dev/null 2>&1; then
        kill "$WEB_PID" 2>/dev/null || true
        wait "$WEB_PID" 2>/dev/null || true
    fi
    WEB_PID=""
    rm -f "$WEB_PID_FILE"
}

start_web_proxy() {
    stop_web_proxy
    echo "[public-demo] Starting portal web proxy on 127.0.0.1:${WEB_PORT}..." >&2
    KIU_LOCAL_BACKEND_PORT="$BACKEND_PORT" \
    KIU_LOCAL_BACKEND_PROXY_HOST=127.0.0.1 \
    KIU_LOCAL_BIND_HOST=127.0.0.1 \
        node "$ROOT/tools/local_dev_server.js" "$WEB_PORT" &
    WEB_PID=$!
    printf '%s\n' "$WEB_PID" > "$WEB_PID_FILE"
}

wait_for_web_healthy() {
    local attempts="${1:-30}"
    local attempt
    for attempt in $(seq 1 "$attempts"); do
        if web_healthy; then
            return 0
        fi
        sleep 1
    done
    return 1
}

ensure_funnel() {
    if funnel_points_here; then
        return 0
    fi
    echo "[public-demo] Re-publishing Tailscale Funnel on ${WEB_PORT}..." >&2
    sudo tailscale funnel --bg "$WEB_PORT"
    FUNNEL_STARTED=1
}

cleanup() {
    set +e
    stop_web_proxy
    if [[ "$FUNNEL_STARTED" == "1" ]]; then
        sudo tailscale funnel --https=443 off >/dev/null 2>&1 || true
    fi
    if [[ "$STACK_STARTED" == "1" ]]; then
        docker compose --env-file "$STAGING_ENV" -f "$COMPOSE_FILE" down
    fi
}
trap cleanup EXIT INT TERM

require_command awk
require_command curl
require_command docker
require_command node
require_command sudo
require_command tailscale
require_command grep

if [[ ! -f "$STAGING_ENV" ]]; then
    echo "Missing staging configuration: $STAGING_ENV" >&2
    exit 1
fi

PUBLIC_URL="${KIU_PUBLIC_APP_URL:-$(read_staging_value KIU_PUBLIC_APP_URL)}"
PUBLIC_URL="${PUBLIC_URL%/}"
if [[ ! "$PUBLIC_URL" =~ ^https://[^/]+$ ]]; then
    echo "KIU_PUBLIC_APP_URL must be an HTTPS origin, got: $PUBLIC_URL" >&2
    exit 1
fi

echo "Starting staging backend and PostgreSQL..."
docker compose --env-file "$STAGING_ENV" -f "$COMPOSE_FILE" up -d --build
STACK_STARTED=1

if ! web_healthy; then
    start_web_proxy
fi

if ! wait_for_web_healthy 30; then
    echo "The portal web proxy did not become healthy." >&2
    exit 1
fi

echo "Publishing portal through Tailscale Funnel..."
sudo tailscale funnel --bg "$WEB_PORT"
FUNNEL_STARTED=1

echo
echo "Public portal: $PUBLIC_URL"
echo "Login page:    $PUBLIC_URL/login.html"
echo
if open_url "$PUBLIC_URL/login.html"; then
    echo "Opened the login page in your browser."
else
    echo "Could not auto-open a browser; open the login page manually."
fi
echo "Open the login page from another network/device too."
echo "Watchdog checks /health and Funnel every ${WATCHDOG_SECONDS}s."
echo "Press Ctrl+C to stop the public demo."

while true; do
    if ! web_healthy; then
        echo "[public-demo] web proxy unhealthy; restarting..." >&2
        start_web_proxy
        if ! wait_for_web_healthy 15; then
            echo "[public-demo] web proxy still unhealthy after restart." >&2
        fi
    elif [[ -n "$WEB_PID" ]] && ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
        # Health can briefly succeed via an orphan listener; reclaim supervision.
        echo "[public-demo] supervised web proxy exited; restarting..." >&2
        start_web_proxy
        wait_for_web_healthy 15 || true
    fi
    ensure_funnel
    sleep "$WATCHDOG_SECONDS"
done
