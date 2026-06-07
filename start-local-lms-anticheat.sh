#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_DIR="$ROOT/.tmp/local-lms-anticheat"
LAN_MODE="${KIU_LOCAL_LAN_MODE:-1}"
FRONTEND_PORT="${KIU_LOCAL_LMS_PORT:-${KIU_LMS_PORT:-8876}}"
BACKEND_PORT="${KIU_LOCAL_BACKEND_PORT:-${KIU_BACKEND_PORT:-48933}}"
BRIDGE_PORT="${KIU_ANTI_CHEAT_BRIDGE_PORT:-${KIU_LOCAL_BRIDGE_PORT:-47835}}"
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/health"
FRONTEND_HEALTH_URL="http://127.0.0.1:${FRONTEND_PORT}/login.html"
BRIDGE_HEALTH_URL="http://127.0.0.1:${BRIDGE_PORT}/health"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
ANTICHEAT_PID_FILE="$PIDS_DIR/anticheat.pid"
FRONTEND_LOG="$PIDS_DIR/frontend.log"
BACKEND_LOG="$PIDS_DIR/backend.log"
ANTICHEAT_LOG="$PIDS_DIR/anticheat.log"

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

is_truthy() {
    case "${1:-}" in
        1|true|TRUE|yes|YES|on|ON) return 0 ;;
        *) return 1 ;;
    esac
}

detect_lan_ip() {
    if [[ -n "${KIU_LOCAL_LAN_IP:-}" ]]; then
        printf '%s\n' "${KIU_LOCAL_LAN_IP}"
        return 0
    fi

    node <<'NODE'
const os = require('os');
const candidates = [];
for (const entries of Object.values(os.networkInterfaces())) {
  for (const entry of entries || []) {
    if (!entry || entry.family !== 'IPv4' || entry.internal) continue;
    const address = String(entry.address || '').trim();
    if (!address || address === '127.0.0.1' || address.startsWith('169.254.')) continue;
    const isPrivate = /^10\./.test(address) ||
      /^192\.168\./.test(address) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address);
    candidates.push({ address, score: isPrivate ? 2 : 1 });
  }
}
candidates.sort((left, right) => right.score - left.score);
if (candidates[0]) {
  process.stdout.write(candidates[0].address);
}
NODE
}

if is_truthy "$LAN_MODE"; then
    FRONTEND_BIND_HOST="${KIU_LOCAL_BIND_HOST:-0.0.0.0}"
    BACKEND_BIND_HOST="${KIU_LOCAL_BACKEND_BIND_HOST:-0.0.0.0}"
    BACKEND_PROXY_HOST="${KIU_LOCAL_BACKEND_PROXY_HOST:-127.0.0.1}"
    PUBLIC_HOST="$(detect_lan_ip | tr -d '[:space:]')"
    if [[ -z "$PUBLIC_HOST" ]]; then
        PUBLIC_HOST="127.0.0.1"
        echo "No LAN IP was detected; falling back to localhost. Set KIU_LOCAL_LAN_IP manually if needed."
    fi
else
    FRONTEND_BIND_HOST="${KIU_LOCAL_BIND_HOST:-${KIU_LOCAL_LMS_HOST:-127.0.0.1}}"
    BACKEND_BIND_HOST="${KIU_LOCAL_BACKEND_BIND_HOST:-${KIU_LOCAL_BACKEND_HOST:-127.0.0.1}}"
    BACKEND_PROXY_HOST="${KIU_LOCAL_BACKEND_PROXY_HOST:-${KIU_LOCAL_BACKEND_HOST:-127.0.0.1}}"
    PUBLIC_HOST="${KIU_LOCAL_LAN_IP:-${FRONTEND_BIND_HOST}}"
fi

FRONTEND_URL="http://${PUBLIC_HOST}:${FRONTEND_PORT}/lms.html"
LOGIN_URL="http://${PUBLIC_HOST}:${FRONTEND_PORT}/login.html"
SETUP_URL="http://${PUBLIC_HOST}:${FRONTEND_PORT}/wifi-setup.html"
LOCAL_FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}/lms.html"
LOCAL_LOGIN_URL="http://127.0.0.1:${FRONTEND_PORT}/login.html"

open_url() {
    local url="$1"
    if command -v xdg-open >/dev/null 2>&1; then
        nohup xdg-open "$url" >/dev/null 2>&1 < /dev/null &
        return 0
    fi
    if command -v gio >/dev/null 2>&1; then
        nohup gio open "$url" >/dev/null 2>&1 < /dev/null &
        return 0
    fi
    return 1
}

notify_ready() {
    local message="$1"
    if command -v notify-send >/dev/null 2>&1; then
        notify-send "KIU local dev" "$message" 2>/dev/null || true
    fi
}

wait_for_url() {
    local url="$1"
    local attempts="${2:-30}"
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

stop_pid_if_running() {
    local pid_file="$1"
    local pid
    pid="$(read_pid_if_running "$pid_file" || true)"
    if [[ -n "$pid" ]]; then
        kill -- "-${pid}" 2>/dev/null || kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
}

frontend_pid="$(read_pid_if_running "$FRONTEND_PID_FILE" || true)"
backend_pid="$(read_pid_if_running "$BACKEND_PID_FILE" || true)"
anticheat_pid="$(read_pid_if_running "$ANTICHEAT_PID_FILE" || true)"

if [[ -n "$frontend_pid" && -n "$backend_pid" && -n "$anticheat_pid" ]]; then
    echo "KIU LMS + anti-cheat stack is already running."
    echo "Setup:     $SETUP_URL"
    echo "LMS:        $FRONTEND_URL"
    echo "Backend:    http://${PUBLIC_HOST}:${BACKEND_PORT}"
    echo "Bridge:     $BRIDGE_HEALTH_URL"
    open_url "$SETUP_URL" || open_url "$FRONTEND_URL" || open_url "$LOCAL_FRONTEND_URL" || open_url "$LOGIN_URL" || open_url "$LOCAL_LOGIN_URL" || true
    notify_ready "Stack already running. LMS opened in browser."
    exit 0
fi

if [[ -n "$frontend_pid" || -n "$backend_pid" || -n "$anticheat_pid" ]]; then
    echo "Restarting partial stack..."
    "$ROOT/stop-local-lms-anticheat.sh" || true
fi

cleanup_stale_pid "$FRONTEND_PID_FILE"
cleanup_stale_pid "$BACKEND_PID_FILE"
cleanup_stale_pid "$ANTICHEAT_PID_FILE"

if [[ ! -d "$ROOT/node_modules" ]]; then
    echo "Installing platform dependencies..."
    (cd "$ROOT" && npm install)
fi

if [[ ! -d "$ROOT/anti-cheat/node_modules" ]]; then
    echo "Installing anti-cheat dependencies..."
    (cd "$ROOT/anti-cheat" && npm install)
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
export KIU_LOCAL_LAN_IP="$PUBLIC_HOST"
export KIU_LOCAL_BIND_HOST="$FRONTEND_BIND_HOST"
export KIU_LOCAL_BACKEND_BIND_HOST="$BACKEND_BIND_HOST"
export KIU_LOCAL_BACKEND_PROXY_HOST="$BACKEND_PROXY_HOST"
export KIU_LOCAL_BACKEND_HOST="$BACKEND_PROXY_HOST"
export KIU_REALTIME_HOST="$BACKEND_BIND_HOST"
export KIU_PUBLIC_APP_URL="http://${PUBLIC_HOST}:${FRONTEND_PORT}"
export KIU_PUBLIC_BACKEND_URL="http://${PUBLIC_HOST}:${BACKEND_PORT}"
export KIU_ANTI_CHEAT_APP_URL="$KIU_PUBLIC_APP_URL"
export KIU_ANTI_CHEAT_BACKEND_URL="$KIU_PUBLIC_BACKEND_URL"
export KIU_ANTI_CHEAT_BRIDGE_PORT="$BRIDGE_PORT"

echo "Starting backend on :${BACKEND_PORT}..."
setsid env \
    KIU_REALTIME_PORT="$BACKEND_PORT" \
    KIU_REALTIME_HOST="$BACKEND_BIND_HOST" \
    node backend/platform/server.js >"$BACKEND_LOG" 2>&1 < /dev/null &
echo $! >"$BACKEND_PID_FILE"

echo "Starting web app on :${FRONTEND_PORT}..."
setsid env \
    KIU_LOCAL_BIND_HOST="$FRONTEND_BIND_HOST" \
    KIU_LOCAL_BACKEND_PROXY_HOST="$BACKEND_PROXY_HOST" \
    node tools/local_dev_server.js "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 < /dev/null &
echo $! >"$FRONTEND_PID_FILE"

echo "Starting anti-cheat desktop app (bridge :${BRIDGE_PORT})..."
(
    cd "$ROOT/anti-cheat"
    export DISPLAY="${DISPLAY:-:0}"
    {
        npm run build
        node scripts/ensure-electron-platform.js
        exec node node_modules/electron/cli.js .
    } >"$ANTICHEAT_LOG" 2>&1 < /dev/null &
    echo $! >"$ANTICHEAT_PID_FILE"
)

if ! wait_for_url "$BACKEND_HEALTH_URL" 25 1; then
    echo "Backend did not become ready on $BACKEND_HEALTH_URL" >&2
    echo "Backend log: $BACKEND_LOG" >&2
    "$ROOT/stop-local-lms-anticheat.sh" || true
    exit 1
fi

if ! wait_for_url "$FRONTEND_HEALTH_URL" 25 1; then
    echo "Frontend did not become ready on $FRONTEND_HEALTH_URL" >&2
    echo "Frontend log: $FRONTEND_LOG" >&2
    "$ROOT/stop-local-lms-anticheat.sh" || true
    exit 1
fi

echo "Waiting for anti-cheat bridge (Electron may take a minute on first start)..."
BRIDGE_READY=true
if ! wait_for_url "$BRIDGE_HEALTH_URL" 90 2; then
    BRIDGE_READY=false
    echo "Anti-cheat bridge did not become ready on $BRIDGE_HEALTH_URL" >&2
    echo "Anti-cheat log: $ANTICHEAT_LOG" >&2
    echo "Backend and LMS are up; this is a partial stack until the desktop app starts." >&2
    echo "Recovery: run this launcher again, or start the app manually with: cd anti-cheat && npm run start" >&2
fi

echo ""
if [[ "$BRIDGE_READY" == "true" ]]; then
    echo "KIU LMS + anti-cheat local stack started."
else
    echo "KIU LMS + backend local stack started. Anti-cheat bridge still needs attention."
fi
echo "Setup:     $SETUP_URL"
echo "LMS:        $FRONTEND_URL"
echo "Login:      $LOGIN_URL"
echo "Local LMS:  $LOCAL_FRONTEND_URL"
echo "Local login: $LOCAL_LOGIN_URL"
echo "Backend:    http://${PUBLIC_HOST}:${BACKEND_PORT}"
echo "Backend local: http://127.0.0.1:${BACKEND_PORT}"
echo "LAN IP:     $PUBLIC_HOST"
echo "Bridge:     $BRIDGE_HEALTH_URL"
echo "Stop all:   $ROOT/stop-local-lms-anticheat.sh"
echo "Logs:"
echo "- $FRONTEND_LOG"
echo "- $BACKEND_LOG"
echo "- $ANTICHEAT_LOG"

open_url "$SETUP_URL" || open_url "$FRONTEND_URL" || open_url "$LOCAL_FRONTEND_URL" || open_url "$LOGIN_URL" || open_url "$LOCAL_LOGIN_URL" || true
if [[ "$BRIDGE_READY" == "true" ]]; then
    notify_ready "LMS, backend, and anti-cheat are running."
else
    notify_ready "LMS and backend are running; anti-cheat bridge still needs attention."
fi
