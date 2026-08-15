# Self-hosted production on this PC

The public portal is hosted by this machine through Tailscale Funnel:

```text
Tailscale Funnel -> Caddy -> Docker production stack -> PostgreSQL
```

The deployment intentionally uses **core-only mode**. It does not require Firebase, Microsoft OAuth, web push, or TURN. Email/password authentication, LMS, scheduling, assignments, and PostgreSQL persistence remain enabled.

## Operations

```bash
npm run start:production:selfhosted
npm run stop:production:selfhosted
./tools/backup-production-postgres.sh
```

The systemd installer keeps the stack available after reboot, runs a health/Funnel monitor every two minutes, runs a health/Funnel monitor every two minutes, and runs a full PostgreSQL/uploads backup every day:

```bash
./tools/install-selfhosted-production-systemd.sh
systemctl status kiu-portal-production.service
systemctl status kiu-portal-production-inhibit.service
systemctl list-timers kiu-portal-backup.timer kiu-portal-monitor.timer
```

## Backups

The scheduled backup is stored under `backups/` and includes:

- PostgreSQL custom-format dump
- uploaded files archive
- SHA-256 checksums
- a manifest

A backup on the same disk is not disaster recovery. Copy backups to another disk or machine:

```bash
rsync -a --delete backups/ /path/to/another-disk/kiu-portal-backups/
```

Test a restore on a separate PostgreSQL database before relying on it. Never delete the live database to test a restore.

## Important host requirements

- Keep the PC powered and connected to the network. Configure the desktop power settings to disable automatic suspend while hosting; this is intentionally not changed by the installer.
- Do not run the old staging/public-demo process on port 8900.
- Keep at least 15% free disk space; the monitor logs a warning at 90%.
- Change the bootstrap admin email and password in `.env.production` before inviting users.
- `.env.production` contains secrets and must never be committed or copied into public files.
- Tailscale Funnel is public access, not a backup or multi-server failover system.

The database and uploads are persistent Docker volumes. The production stack has local fallback disabled and refuses to start when required core production configuration is invalid.
