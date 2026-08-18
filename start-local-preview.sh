#!/usr/bin/env bash
set -euo pipefail

# Start the portal for a named Cloudflare Tunnel preview.
# Usage:
#   KIU_PREVIEW_HOSTNAME=preview.example.com ./start-local-preview.sh
# Then run the named cloudflared tunnel in a second terminal.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREVIEW_HOSTNAME="${KIU_PREVIEW_HOSTNAME:-}"

if [[ -z "$PREVIEW_HOSTNAME" || "$PREVIEW_HOSTNAME" == */* || "$PREVIEW_HOSTNAME" == *:* ]]; then
    echo "Set KIU_PREVIEW_HOSTNAME to a hostname without a scheme or path." >&2
    echo "Example: KIU_PREVIEW_HOSTNAME=preview.example.com ./start-local-preview.sh" >&2
    exit 1
fi

export KIU_LOCAL_LAN_MODE=0
export KIU_LOCAL_BIND_HOST=127.0.0.1
export KIU_LOCAL_BACKEND_BIND_HOST=127.0.0.1
export KIU_LOCAL_BACKEND_PROXY_HOST=127.0.0.1
export KIU_PUBLIC_APP_URL="https://${PREVIEW_HOSTNAME}"
export KIU_PUBLIC_BACKEND_URL="https://${PREVIEW_HOSTNAME}"
export KIU_LAUNCHER_IN_TERMINAL=1
export KIU_SKIP_ANTICHEAT="${KIU_SKIP_ANTICHEAT:-0}"

echo "Starting localhost-only portal preview for ${KIU_PUBLIC_APP_URL}"
echo "Cloudflare Tunnel target: http://127.0.0.1:${KIU_LOCAL_LMS_PORT:-8876}"
if [[ "$KIU_SKIP_ANTICHEAT" == "1" || "$KIU_SKIP_ANTICHEAT" == "true" ]]; then
    echo "Anti-cheat bridge: disabled"
else
    echo "Anti-cheat bridge: enabled"
fi
echo "Stop the stack with: npm run stop:local"

cd "$ROOT"
exec bash "$ROOT/start-local-lms-anticheat.sh"
