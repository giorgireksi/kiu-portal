#!/usr/bin/env bash
set -Eeuo pipefail

# Compatibility entry point for the old public-demo command.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/stop-selfhosted-production.sh" "$@"
