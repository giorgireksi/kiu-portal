# LMS Production Readiness Checklist

This checklist is the rollout gate for a Microsoft-authenticated university LMS.
Microsoft Entra ID is the identity provider; the LMS database remains the
academic authority for roles, sections, enrollments, grades, exams, and audit.

## Identity And Accounts

- Microsoft passwords are never stored by the LMS.
- Every active portal user has a linked `microsoft_oid`, email, role, faculty,
  account status, and source system.
- New Microsoft sign-ins are allowed only when the user already exists in the
  university account database or is explicitly approved by an onboarding import.
- Student records include student number, program, cohort, academic status,
  finance hold, and exam hold.
- Staff records include employee number, department, faculty, and active status.

## Authorization

- Roles are scoped through `lms_user_roles`, not only through a global account
  role.
- Professor and TA access is scoped to assigned sections.
- TA accounts may enter draft grades only when delegated.
- Publishing and finalization are restricted to professor/admin roles.
- Audit and integration endpoints are admin-only.
- File upload and file read routes require an authenticated portal session.

## Academic Data

- PostgreSQL is required in production.
- Local JSON fallback is disabled in production.
- Shared platform state is currently constrained to one authoritative writer in production.
- Legacy/local/demo state is never used as an academic authority.
- Program, subject, section, enrollment, staff assignment, assessment, and score
  records are imported or synced from official university data sources.
- All imports run through `import_jobs` with dry-run validation before commit.

## Gradebook

- Score changes are append-audited.
- Grade history records old score, new score, actor, role, reason, and timestamp.
- Grade states are explicit: draft, published, finalized.
- Finalized grades cannot be edited without a controlled exception workflow.
- Students see only published/finalized grades.
- Grade exports are timestamped and tied to an actor.

## Exams And Quizzes

- Protected exams require launch tickets.
- Protected quizzes/exams are not accessible from a normal browser.
- Anti-cheat sessions send heartbeats and incident events.
- Exam actions are audited: start, reconnect, warning, block, unblock, submit,
  force submit, manual grade, and finalize.
- Exam holds prevent launch server-side.
- Timers are server authoritative.

## Scale And Operations

- Run load tests before launch:
  - 2,000 sign-ins in a short window.
  - 500 simultaneous live quiz participants.
  - 300 simultaneous protected exam sessions.
  - 100 staff grading/publishing actions.
- All large lists use pagination.
- Database indexes cover login, sessions, enrollments, gradebook, notifications,
  exams, audit, and messages.
- Upload limits are endpoint-specific.
- Monitoring covers HTTP errors, latency, database connectivity, storage,
  active sessions, quiz/exam heartbeats, and queue failures.

## Backup And Recovery

- PostgreSQL backups are scheduled and restore-tested.
- Gradebook, exam attempts, and audit logs are included in backup policy.
- File storage has retention and recovery rules.
- Incident runbooks exist for exam outage, database outage, compromised account,
  accidental grade publish, and Microsoft login outage.

Operational scripts:

- `npm run migrate:postgres` applies all SQL migrations in `infra/postgres/init`
  to an existing PostgreSQL database and records applied files in
  `schema_migrations`. The runner now takes a PostgreSQL advisory lock before
  applying migrations so concurrent startup jobs do not race each other.
- `scripts/backup-postgres.ps1` creates a timestamped custom-format PostgreSQL
  backup using `KIU_DATABASE_URL`.
- `scripts/restore-postgres.ps1` restores a selected backup into the intended
  database. Use only after confirming the target environment.
- `npm run check:production` validates required production environment gates.
- `npm run load:smoke` runs a basic backend health/load smoke test against
  `KIU_LOAD_TEST_BASE_URL`.

Import templates:

- `data/import-templates/accounts.csv`
- `data/import-templates/programs.csv`
- `data/import-templates/sections.csv`
- `data/import-templates/enrollments.csv`

## Release Gate

- `npm run check` passes.
- `npm run check:production` passes in the production environment.
- Production environment has `KIU_DATABASE_URL`.
- Production environment has `KIU_ALLOW_LOCAL_PLATFORM_FALLBACK=false`.
- Production environment has `KIU_SINGLE_WRITER_MODE=true`.
- Microsoft OAuth tenant/client/redirect settings are configured.
- VAPID keys and mail token encryption key are configured.
- Admin bootstrap account is removed, disabled, or rotated after first setup.
- `npm run migrate:postgres` has completed against the target DB.
- At least one backup and restore drill has completed successfully.
- `npm run load:smoke` has completed against the deployed backend.
- Real accounts, programs, sections, and enrollments have been imported from
  official university data, not typed manually from screenshots.
- Anti-cheat desktop/mobile release URLs point to signed production builds.
