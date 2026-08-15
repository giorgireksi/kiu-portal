#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${KIU_PRODUCTION_ENV_FILE:-$ROOT/.env.production}"
WEB_PORT="${KIU_WEB_PORT:-8900}"
DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"

set -a
[[ -f "$ENV_FILE" ]] && . "$ENV_FILE"
set +a
WEB_PORT="${KIU_WEB_PORT:-$WEB_PORT}"

if ! curl -fsS --max-time 8 "http://127.0.0.1:${WEB_PORT}/health" >/dev/null 2>&1 \
    || ! curl -fsS --max-time 8 "http://127.0.0.1:${WEB_PORT}/ready" >/dev/null 2>&1; then
    logger -t kiu-portal-monitor 'Portal health check failed; restarting production stack.'
    systemctl restart kiu-portal-production.service
fi

if [[ -x "$DOCKER_BIN" ]]; then
    usage="$(df -P "$ROOT" | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
    if [[ "${usage:-0}" -ge 90 ]]; then
        logger -p daemon.warning -t kiu-portal-monitor "Disk usage is ${usage}% on ${ROOT}; backups or uploads need attention."
    fi
fi

if command -v tailscale >/dev/null 2>&1 && ! tailscale funnel status 2>/dev/null | grep -Eq "proxy[[:space:]]+http://127\\.0\\.0\\.1:${WEB_PORT}([[:space:]]|$)"; then
    tailscale funnel --bg "$WEB_PORT" || logger -p daemon.warning -t kiu-portal-monitor 'Tailscale Funnel could not be restored.'
fi
