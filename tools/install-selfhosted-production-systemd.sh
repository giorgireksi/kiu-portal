#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYSTEMD_DIR="/etc/systemd/system"

if [[ $EUID -ne 0 ]]; then
    USER_DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"
    USER_DOCKER_CONFIG="${DOCKER_CONFIG:-${HOME}/.docker}"
    exec sudo env KIU_DOCKER_BIN="$USER_DOCKER_BIN" DOCKER_CONFIG="$USER_DOCKER_CONFIG" "$0" "$@"
fi
command -v systemctl >/dev/null || { echo 'systemd is required' >&2; exit 1; }
DOCKER_BIN="${KIU_DOCKER_BIN:-$(command -v docker || true)}"
DOCKER_CONFIG_DIR="${DOCKER_CONFIG:-${HOME}/.docker}"
[[ -x "$DOCKER_BIN" ]] || { echo 'Docker is required' >&2; exit 1; }
DOCKER_CONFIG="$DOCKER_CONFIG_DIR" "$DOCKER_BIN" compose version >/dev/null 2>&1 || { echo "Docker Compose plugin is unavailable for $DOCKER_BIN" >&2; exit 1; }

for template in kiu-portal-production.service kiu-portal-backup.service kiu-portal-backup.timer kiu-portal-monitor.service kiu-portal-monitor.timer; do
    sed -e "s|@KIU_ROOT@|$ROOT|g" -e "s|@DOCKER_BIN@|$DOCKER_BIN|g" -e "s|@DOCKER_CONFIG@|$DOCKER_CONFIG_DIR|g" "$ROOT/systemd/$template" > "$SYSTEMD_DIR/$template"
done
chmod 644 "$SYSTEMD_DIR/kiu-portal-production.service" "$SYSTEMD_DIR/kiu-portal-backup.service" "$SYSTEMD_DIR/kiu-portal-backup.timer" "$SYSTEMD_DIR/kiu-portal-monitor.service" "$SYSTEMD_DIR/kiu-portal-monitor.timer"
systemctl daemon-reload
systemctl enable kiu-portal-production.service kiu-portal-backup.timer kiu-portal-monitor.timer
systemctl start kiu-portal-production.service
systemctl start kiu-portal-backup.timer
systemctl start kiu-portal-monitor.timer

echo 'Installed and started KIU production service and daily backup timer.'
systemctl --no-pager --full status kiu-portal-production.service kiu-portal-backup.timer kiu-portal-monitor.timer || true
