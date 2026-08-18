#!/usr/bin/env bash
set -euo pipefail

# Start only the Electron anti-cheat browser. The LMS and backend are not touched.
# Terminal: ./open-anti-cheat-browser.sh | npm run open:anti-cheat

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=tools/local_stack_stop_helpers.sh
source "$ROOT/tools/local_stack_stop_helpers.sh"
ensure_launcher_terminal "$ROOT/$(basename "${BASH_SOURCE[0]}")" "$@"
trap pause_launcher_on_error EXIT

PIDS_DIR="$ROOT/.tmp/anti-cheat-browser"
PID_FILE="$PIDS_DIR/anticheat.pid"
STACK_PID_FILE="$ROOT/.tmp/local-lms-anticheat/anticheat.pid"
LOG_FILE="$PIDS_DIR/anticheat.log"
PUBLIC_ENV_FILE="${KIU_PUBLIC_ENV_FILE:-$ROOT/.env.staging}"
BRIDGE_PORT="${KIU_ANTI_CHEAT_BRIDGE_PORT:-${KIU_LOCAL_BRIDGE_PORT:-47835}}"
BRIDGE_HEALTH_URL="http://127.0.0.1:${BRIDGE_PORT}/health"

read_env_value() {
    local key="$1"
    [[ -f "$PUBLIC_ENV_FILE" ]] || return 1
    awk -F= -v key="$key" '$1 == key {
        value = substr($0, index($0, "=") + 1)
        gsub(/^"|"$/, "", value)
        gsub(/^'"'"'|'"'"'$/, "", value)
        print value
        exit
    }' "$PUBLIC_ENV_FILE"
}

PUBLIC_URL="${KIU_PUBLIC_APP_URL:-$(read_env_value KIU_PUBLIC_APP_URL || true)}"
PUBLIC_BACKEND_URL="${KIU_PUBLIC_BACKEND_URL:-$(read_env_value KIU_PUBLIC_BACKEND_URL || true)}"
PUBLIC_URL="${PUBLIC_URL%/}"
PUBLIC_BACKEND_URL="${PUBLIC_BACKEND_URL%/}"
if [[ ! "$PUBLIC_URL" =~ ^https://[^/]+$ ]]; then
    echo "A public HTTPS URL is required. Set KIU_PUBLIC_APP_URL or update $PUBLIC_ENV_FILE." >&2
    exit 1
fi
if [[ ! "$PUBLIC_BACKEND_URL" =~ ^https://[^/]+$ ]]; then
    PUBLIC_BACKEND_URL="$PUBLIC_URL"
fi

export KIU_PUBLIC_APP_URL="$PUBLIC_URL"
export KIU_PUBLIC_BACKEND_URL="$PUBLIC_BACKEND_URL"
export KIU_ANTI_CHEAT_APP_URL="$PUBLIC_URL"
export KIU_ANTI_CHEAT_BACKEND_URL="$PUBLIC_BACKEND_URL"
export KIU_ANTI_CHEAT_QUIZ_URL="${KIU_ANTI_CHEAT_QUIZ_URL:-$PUBLIC_URL/exam-portal.html}"

mkdir -p "$PIDS_DIR"

read_running_pid() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] || return 1
    local pid command cwd
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    command="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null \
        && [[ "$cwd" == "$ROOT/anti-cheat" ]] \
        && [[ "$command" == *"electron"* ]]; then
        printf '%s\n' "$pid"
        return 0
    fi
    rm -f "$pid_file"
    return 1
}

is_url_ready() {
    curl --silent --fail --max-time 2 "$1" >/dev/null 2>&1
}

wait_for_bridge() {
    local attempts=45
    local index
    for ((index = 0; index < attempts; index += 1)); do
        if is_url_ready "$BRIDGE_HEALTH_URL"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js was not found on this machine." >&2
    exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required for the anti-cheat bridge health check." >&2
    exit 1
fi

existing_pid="$(read_running_pid "$PID_FILE" || read_running_pid "$STACK_PID_FILE" || true)"
if [[ -n "$existing_pid" ]]; then
    running_app_url="$(tr '\0' '\n' < "/proc/$existing_pid/environ" 2>/dev/null | sed -n 's/^KIU_PUBLIC_APP_URL=//p' | head -n 1 || true)"
    if [[ "$running_app_url" == "$PUBLIC_URL" ]]; then
        echo "Anti-cheat browser is already connected to $PUBLIC_URL."
        exit 0
    fi
    echo "Restarting anti-cheat browser to connect it to $PUBLIC_URL..."
    bash "$ROOT/stop-anti-cheat-browser.sh"
fi

if is_url_ready "$BRIDGE_HEALTH_URL"; then
    echo "Anti-cheat bridge is already running without a matching launcher PID." >&2
    echo "Stop it first: bash $ROOT/stop-anti-cheat-browser.sh" >&2
    exit 1
fi

if port_in_use "$BRIDGE_PORT"; then
    echo "Anti-cheat bridge port ${BRIDGE_PORT} is already in use." >&2
    echo "Stop the anti-cheat browser first: bash $ROOT/stop-anti-cheat-browser.sh" >&2
    exit 1
fi

if [[ ! -d "$ROOT/anti-cheat/node_modules" ]]; then
    echo "Installing anti-cheat dependencies..."
    (cd "$ROOT/anti-cheat" && npm install)
fi

cd "$ROOT/anti-cheat"
echo "Building anti-cheat browser..."
npm run build
node scripts/ensure-electron-platform.js

export KIU_ANTI_CHEAT_BRIDGE_PORT="$BRIDGE_PORT"
export DISPLAY="${DISPLAY:-:0}"

if command -v setsid >/dev/null 2>&1; then
    setsid node node_modules/electron/cli.js . >"$LOG_FILE" 2>&1 < /dev/null &
else
    node node_modules/electron/cli.js . >"$LOG_FILE" 2>&1 < /dev/null &
fi
browser_pid="$!"
echo "$browser_pid" >"$PID_FILE"
disown "$browser_pid" 2>/dev/null || true

if ! wait_for_bridge; then
    echo "Anti-cheat bridge did not become ready on $BRIDGE_HEALTH_URL." >&2
    echo "Anti-cheat log: $LOG_FILE" >&2
    bash "$ROOT/stop-anti-cheat-browser.sh" || true
    exit 1
fi

echo "Anti-cheat browser started separately."
echo "Bridge: $BRIDGE_HEALTH_URL"
echo "Log:    $LOG_FILE"
echo "Stop:   $ROOT/stop-anti-cheat-browser.sh"
