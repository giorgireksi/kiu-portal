# Production Deployment Runbook

Use this runbook for staging first, then production.

## 1. Configure Environment

1. Copy `.env.production.example` to `.env` on the server.
2. Fill real values for:
   - `KIU_DATABASE_URL`
   - `KIU_PUBLIC_APP_URL`
   - `KIU_PUBLIC_BACKEND_URL`
   - keep `KIU_EXTRA_CORS_ORIGINS` blank unless you intentionally trust extra frontend origins
   - keep `KIU_SINGLE_WRITER_MODE=true` until the platform has real optimistic concurrency support
   - Microsoft tenant/client/secret/redirect URI
   - `KIU_MICROSOFT_TOKEN_ENCRYPTION_KEY`
   - VAPID keys
   - anti-cheat release URLs
3. Keep `KIU_ALLOW_LOCAL_PLATFORM_FALLBACK=false`.
4. Keep `KIU_STORAGE_DRIVER=postgres`.
5. Do not scale `portal-backend` horizontally in production yet. The current state store is still constrained to one authoritative writer.

## 2. Validate Config

```bash
npm run check:production
```

This must pass before students or staff use the system.

## 3. Apply Database Migrations

```bash
npm run migrate:postgres
```

The runner applies `infra/postgres/init/*.sql` and records each applied file in
`schema_migrations`. It now takes a PostgreSQL advisory lock first so concurrent
startup jobs serialize instead of racing the same migration set.

## 4. Start Production Stack

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Then verify:

```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=100 portal-backend
```

## 5. Import University Data

Use official SIS/HR/curriculum exports. Templates live in:

- `data/import-templates/accounts.csv`
- `data/import-templates/programs.csv`
- `data/import-templates/sections.csv`
- `data/import-templates/enrollments.csv`

Imports must run as dry-run first, then commit after validation.

## 6. Backup Drill

Create a backup:

```powershell
.\scripts\backup-postgres.ps1
```

Restore it into staging, not production:

```powershell
.\scripts\restore-postgres.ps1 -BackupFile .\backups\kiu-lms-YYYYMMDD-HHMMSS.dump
```

## 7. Load Smoke

```bash
KIU_LOAD_TEST_BASE_URL=https://portal-api.kiu.edu.ge npm run load:smoke
```

Increase `KIU_LOAD_TEST_REQUESTS` and `KIU_LOAD_TEST_CONCURRENCY` for staging
load tests before rollout.

## 8. Go/No-Go

Go only when all are true:

- Microsoft sign-in works for student, professor, TA, admin, and service users.
- Students see only enrolled courses and own grades.
- Professors/TAs can access only assigned course scopes.
- Protected exam/quiz launches require anti-cheat.
- Only one `portal-backend` writer is active for the shared platform state.
- Backup and restore drill succeeded.
- Load smoke succeeded.
- Monitoring is watching `/health`, `/ready`, HTTP 5xx, DB latency, and disk.
