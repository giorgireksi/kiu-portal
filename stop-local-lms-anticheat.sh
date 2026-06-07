#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_DIR="$ROOT/.tmp/local-lms-anticheat"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
ANTICHEAT_PID_FILE="$PIDS_DIR/anticheat.pid"

stop_pid_file() {
    local pid_file="$1"
    if [[ ! -f "$pid_file" ]]; then
        return
    fi
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        kill -- "-${pid}" 2>/dev/null || kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
}

stop_pid_file "$FRONTEND_PID_FILE"
stop_pid_file "$BACKEND_PID_FILE"
stop_pid_file "$ANTICHEAT_PID_FILE"

echo "KIU LMS + anti-cheat local stack stopped."
