#!/usr/bin/env bash
set -euo pipefail

# Double-click: use kiu-stop-local.desktop, or right-click -> Execute.
# Terminal: ./stop-local-lms-anticheat.sh  |  npm run stop:local

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=tools/local_stack_stop_helpers.sh
source "$ROOT/tools/local_stack_stop_helpers.sh"
ensure_launcher_terminal "$ROOT/$(basename "${BASH_SOURCE[0]}")" "$@"
trap pause_launcher_on_error EXIT

PIDS_DIR="$ROOT/.tmp/local-lms-anticheat"
FRONTEND_PORT="${KIU_LOCAL_LMS_PORT:-${KIU_LMS_PORT:-8876}}"
BACKEND_PORT="${KIU_LOCAL_BACKEND_PORT:-${KIU_BACKEND_PORT:-48933}}"
BRIDGE_PORT="${KIU_ANTI_CHEAT_BRIDGE_PORT:-${KIU_LOCAL_BRIDGE_PORT:-47835}}"

kill_pid_file "$PIDS_DIR/frontend.pid"
kill_pid_file "$PIDS_DIR/backend.pid"
kill_pid_file "$PIDS_DIR/anticheat.pid"

if command -v pkill >/dev/null 2>&1; then
    pkill -f "${ROOT}/tools/local_dev_server.js" 2>/dev/null || true
    pkill -f "${ROOT}/backend/platform/server.js" 2>/dev/null || true
    pkill -f "${ROOT}/anti-cheat/node_modules/electron/cli.js" 2>/dev/null || true
fi

kill_anticheat_processes "$ROOT/anti-cheat"

kill_ports "$FRONTEND_PORT" 8876 8888 "$BACKEND_PORT" "$BRIDGE_PORT"

rm -f "$ROOT/.tmp/local-8876/frontend.pid" \
      "$ROOT/.tmp/local-8876/backend.pid" \
      "$ROOT/.tmp/local-8888/frontend.pid" \
      "$ROOT/.tmp/local-8888/backend.pid"

remaining_ports=()
for port in "$FRONTEND_PORT" "$BACKEND_PORT" "$BRIDGE_PORT"; do
    if port_in_use "$port"; then
        remaining_ports+=("$port")
    fi
done

if [[ ${#remaining_ports[@]} -gt 0 ]]; then
    echo "KIU local stack stop incomplete. Ports still in use: ${remaining_ports[*]}" >&2
    echo "Retry: bash $ROOT/stop-local-lms-anticheat.sh" >&2
    exit 1
fi

echo "KIU local stack stopped."