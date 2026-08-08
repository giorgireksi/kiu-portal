#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.staging.yml"
STAGING_ENV="$ROOT/.env.staging"
WEB_PORT="${KIU_PUBLIC_DEMO_WEB_PORT:-8900}"
WEB_PID_FILE="${KIU_PUBLIC_DEMO_WEB_PID_FILE:-$ROOT/.public-demo-web.pid}"

stop_proxy_pid() {
    local pid="$1"
    local command_line=""
    if [[ ! "$pid" =~ ^[0-9]+$ ]] || ! kill -0 "$pid" >/dev/null 2>&1; then
        return 0
    fi

    command_line="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    if [[ "$command_line" != *"$ROOT/tools/local_dev_server.js"* ]]; then
        return 0
    fi
    echo "[public-demo] Stopping web proxy (PID ${pid})..."
    kill "$pid" 2>/dev/null || true
}

stop_web_proxy() {
    if [[ -f "$WEB_PID_FILE" ]]; then
        stop_proxy_pid "$(<"$WEB_PID_FILE")"
        rm -f "$WEB_PID_FILE"
    fi

    if ! command -v pgrep >/dev/null 2>&1; then
        return 0
    fi
    while read -r pid command; do
        [[ -n "${pid:-}" ]] || continue
        if [[ "$command" == *"$ROOT/tools/local_dev_server.js $WEB_PORT"* ]]; then
            stop_proxy_pid "$pid"
        fi
    done < <(pgrep -af "$ROOT/tools/local_dev_server.js" || true)
}

echo "[public-demo] Disabling Tailscale Funnel..."
if command -v sudo >/dev/null 2>&1 && command -v tailscale >/dev/null 2>&1; then
    sudo tailscale funnel --https=443 off >/dev/null 2>&1 || true
else
    echo "[public-demo] sudo or tailscale is unavailable; skipping Funnel shutdown." >&2
fi

stop_web_proxy

if command -v docker >/dev/null 2>&1; then
    if [[ -f "$STAGING_ENV" ]]; then
        echo "[public-demo] Stopping staging backend and PostgreSQL..."
        docker compose --env-file "$STAGING_ENV" -f "$COMPOSE_FILE" down
    else
        echo "[public-demo] Missing $STAGING_ENV; stopping staging stack without env file..."
        docker compose -f "$COMPOSE_FILE" down
    fi
else
    echo "[public-demo] Docker is unavailable; skipping staging stack shutdown." >&2
fi

echo "[public-demo] Stopped."
