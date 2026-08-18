#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || exec sudo "$0" "$@"
for unit in kiu-portal-monitor.timer kiu-portal-monitor.service kiu-portal-backup.timer kiu-portal-backup.service kiu-portal-production.service; do
    systemctl disable --now "$unit" 2>/dev/null || true
    rm -f "/etc/systemd/system/$unit"
done
systemctl daemon-reload
echo 'Removed KIU production systemd units.'
