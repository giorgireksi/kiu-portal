#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS_DIR="$ROOT/.tmp/graphify-watch"
PID_FILE="$PIDS_DIR/watch.pid"
LOG_FILE="$PIDS_DIR/watch.log"

mkdir -p "$PIDS_DIR"

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "graphify watch already running (pid $old_pid)"
    echo "log: $LOG_FILE"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

export PYTHONHASHSEED=0
cd "$ROOT"

nohup graphify watch . >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

echo "graphify watch started (pid $(cat "$PID_FILE"))"
echo "log: $LOG_FILE"