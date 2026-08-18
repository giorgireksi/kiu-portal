#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec env \
    KIU_LOCAL_LMS_PORT="${KIU_LOCAL_LMS_PORT:-8888}" \
    KIU_LOCAL_LAN_MODE="${KIU_LOCAL_LAN_MODE:-1}" \
    bash "$ROOT/start-local-lms-anticheat.sh"
