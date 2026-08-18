#!/usr/bin/env bash
set -Eeuo pipefail

# Compatibility entry point. Public hosting now uses the core-only production
# stack; the old staging/local_dev_server demo must not be used publicly.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Invoke through bash so this compatibility entry point also works from a
# checkout that did not preserve executable-bit metadata.
exec bash "$ROOT/start-selfhosted-production.sh" "$@"
