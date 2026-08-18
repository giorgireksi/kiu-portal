#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS_DIR="$ROOT/.tmp/graphify-watch"
PID_FILE="$PIDS_DIR/watch.pid"

stop_pid() {
  local pid="$1"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || return 0
      sleep 0.25
    done
    kill -9 "$pid" 2>/dev/null || true
  fi
}

if [[ -f "$PID_FILE" ]]; then
  stop_pid "$(cat "$PID_FILE")"
  rm -f "$PID_FILE"
fi

if command -v pkill >/dev/null 2>&1; then
  pkill -f "graphify watch ${ROOT}" 2>/dev/null || true
fi

echo "graphify watch stopped"