#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_DIR="$ROOT/.tmp/local-8876"
FRONTEND_PORT="${KIU_LOCAL_LMS_PORT:-8876}"
BACKEND_PORT="${KIU_LOCAL_BACKEND_PORT:-48933}"
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/health"
FRONTEND_HEALTH_URL="http://127.0.0.1:${FRONTEND_PORT}/login.html"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
FRONTEND_LOG="$PIDS_DIR/frontend.log"
BACKEND_LOG="$PIDS_DIR/backend.log"

mkdir -p "$PIDS_DIR"

read_pid_if_running() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] || return 1
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        printf '%s\n' "$pid"
        return 0
    fi
    return 1
}

cleanup_stale_pid() {
    local pid_file="$1"
    if [[ ! -f "$pid_file" ]]; then
        return
    fi
    rm -f "$pid_file"
}

wait_for_url() {
    local url="$1"
    local attempts="${2:-25}"
    local delay="${3:-1}"
    local index
    for ((index = 0; index < attempts; index += 1)); do
        if curl --silent --fail --max-time 2 "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep "$delay"
    done
    return 1
}

frontend_pid="$(read_pid_if_running "$FRONTEND_PID_FILE" || true)"
backend_pid="$(read_pid_if_running "$BACKEND_PID_FILE" || true)"

if [[ -n "$frontend_pid" && -n "$backend_pid" ]]; then
    echo "KIU local stack is already running on port ${FRONTEND_PORT}."
    echo "Login: http://127.0.0.1:${FRONTEND_PORT}/login.html"
    echo "LMS:   http://127.0.0.1:${FRONTEND_PORT}/lms.html"
    echo "Admin: http://127.0.0.1:${FRONTEND_PORT}/admin-tools.html"
    exit 0
fi

if [[ -n "$frontend_pid" || -n "$backend_pid" ]]; then
    echo "Restarting partial stack..."
    "$ROOT/stop-local-8876.sh" || true
fi

cleanup_stale_pid "$FRONTEND_PID_FILE"
cleanup_stale_pid "$BACKEND_PID_FILE"

if [[ ! -d "$ROOT/node_modules" ]]; then
    echo "Installing platform dependencies..."
    (cd "$ROOT" && npm install)
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js was not found on this machine." >&2
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required for health checks." >&2
    exit 1
fi

cd "$ROOT"

export KIU_LOCAL_BACKEND_PORT="$BACKEND_PORT"
export KIU_LOCAL_BIND_HOST="${KIU_LOCAL_BIND_HOST:-127.0.0.1}"
export KIU_LOCAL_BACKEND_BIND_HOST="${KIU_LOCAL_BACKEND_BIND_HOST:-127.0.0.1}"
export KIU_LOCAL_BACKEND_PROXY_HOST="${KIU_LOCAL_BACKEND_PROXY_HOST:-127.0.0.1}"
export KIU_LOCAL_BACKEND_HOST="$KIU_LOCAL_BACKEND_PROXY_HOST"
export KIU_REALTIME_HOST="$KIU_LOCAL_BACKEND_BIND_HOST"
export KIU_PUBLIC_APP_URL="http://127.0.0.1:${FRONTEND_PORT}"
export KIU_PUBLIC_BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"

echo "Starting backend on :${BACKEND_PORT}..."
setsid env \
    KIU_REALTIME_PORT="$BACKEND_PORT" \
    KIU_REALTIME_HOST="$KIU_LOCAL_BACKEND_BIND_HOST" \
    node backend/platform/server.js >"$BACKEND_LOG" 2>&1 < /dev/null &
echo $! >"$BACKEND_PID_FILE"

echo "Starting web app on :${FRONTEND_PORT}..."
setsid env \
    KIU_LOCAL_BIND_HOST="$KIU_LOCAL_BIND_HOST" \
    KIU_LOCAL_BACKEND_PROXY_HOST="$KIU_LOCAL_BACKEND_PROXY_HOST" \
    node tools/local_dev_server.js "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 < /dev/null &
echo $! >"$FRONTEND_PID_FILE"

if ! wait_for_url "$BACKEND_HEALTH_URL" 25 1; then
    echo "Backend did not become ready on $BACKEND_HEALTH_URL" >&2
    echo "Backend log: $BACKEND_LOG" >&2
    "$ROOT/stop-local-8876.sh" || true
    exit 1
fi

if ! wait_for_url "$FRONTEND_HEALTH_URL" 25 1; then
    echo "Frontend did not become ready on $FRONTEND_HEALTH_URL" >&2
    echo "Frontend log: $FRONTEND_LOG" >&2
    "$ROOT/stop-local-8876.sh" || true
    exit 1
fi

echo ""
echo "KIU local stack started (frontend ${FRONTEND_PORT} + backend ${BACKEND_PORT})."
echo "Login: http://127.0.0.1:${FRONTEND_PORT}/login.html"
echo "LMS:   http://127.0.0.1:${FRONTEND_PORT}/lms.html"
echo "Admin: http://127.0.0.1:${FRONTEND_PORT}/admin-tools.html"
echo "Backend: http://127.0.0.1:${BACKEND_PORT}"
echo "Stop:  $ROOT/stop-local-8876.sh"
echo "Logs:"
echo "- $FRONTEND_LOG"
echo "- $BACKEND_LOG"