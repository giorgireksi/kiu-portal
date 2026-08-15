#!/usr/bin/env bash
set -euo pipefail

# Stop only the Electron anti-cheat browser. The LMS and backend are not touched.
# Terminal: ./stop-anti-cheat-browser.sh | npm run stop:anti-cheat

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=tools/local_stack_stop_helpers.sh
source "$ROOT/tools/local_stack_stop_helpers.sh"
ensure_launcher_terminal "$ROOT/$(basename "${BASH_SOURCE[0]}")" "$@"
trap pause_launcher_on_error EXIT

PIDS_DIR="$ROOT/.tmp/anti-cheat-browser"
PID_FILE="$PIDS_DIR/anticheat.pid"
STACK_PID_FILE="$ROOT/.tmp/local-lms-anticheat/anticheat.pid"
BRIDGE_PORT="${KIU_ANTI_CHEAT_BRIDGE_PORT:-${KIU_LOCAL_BRIDGE_PORT:-47835}}"

kill_owned_pid_file() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] || return 0
    local pid command cwd
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    command="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null \
        && [[ "$cwd" == "$ROOT/anti-cheat" ]] \
        && [[ "$command" == *"electron"* ]]; then
        kill_pid_tree "$pid"
    fi
    rm -f "$pid_file"
}

kill_owned_pid_file "$PID_FILE"
kill_owned_pid_file "$STACK_PID_FILE"
kill_anticheat_processes "$ROOT/anti-cheat"

# Only terminate a bridge listener when its process belongs to this checkout.
# Never kill an unrelated service that happens to use the configured port.
for pid in $(pids_on_port "$BRIDGE_PORT" | sort -u); do
    [[ -n "$pid" ]] || continue
    command="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    if [[ "$cwd" == "$ROOT/anti-cheat" ]] \
        || [[ "$command" == *"$ROOT/anti-cheat"* ]]; then
        kill_pid_tree "$pid"
    fi
done

rm -f "$PID_FILE" "$STACK_PID_FILE"

remaining_owned=false
for pid in $(pids_on_port "$BRIDGE_PORT" | sort -u); do
    [[ -n "$pid" ]] || continue
    command="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    if [[ "$cwd" == "$ROOT/anti-cheat" ]] \
        || [[ "$command" == *"$ROOT/anti-cheat"* ]]; then
        remaining_owned=true
    fi
done
if [[ "$remaining_owned" == "true" ]]; then
    echo "Anti-cheat browser stop incomplete; its bridge is still running." >&2
    echo "Retry: bash $ROOT/stop-anti-cheat-browser.sh" >&2
    exit 1
fi

echo "Anti-cheat browser stopped. LMS and backend were left running."
