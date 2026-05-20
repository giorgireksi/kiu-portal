# KIU Portal Production Hosting Guide

This repo is now in final-phase handoff mode. The portal runtime is expected to run with:

- static web delivery
- a PostgreSQL-backed backend
- Microsoft Entra sign-in
- externalized file storage
- TURN-ready calling config
- PostgreSQL schema for full system migration
- MinIO and coturn deployment templates
- Redis for queue/presence/retry foundation
- university-wide source-of-truth and integration mapping

## 1. Prepare environment

1. Copy [.env.example](D:/mock yo - Copy - Copy (2) - Copy/.env.example) to `.env`
2. Fill in:
   - `KIU_PUBLIC_APP_URL`
   - `KIU_PUBLIC_BACKEND_URL`
   - `KIU_PORTAL_LOGIN_URL`
   - `KIU_DATABASE_URL`
   - `KIU_SINGLE_WRITER_MODE=true`
   - `KIU_DATABASE_TABLE_NAME`
   - `KIU_ADMIN_EMAIL`
   - `KIU_ADMIN_PASSWORD`
   - `KIU_MICROSOFT_TENANT_ID`
   - `KIU_MICROSOFT_CLIENT_ID`
   - `KIU_MICROSOFT_CLIENT_SECRET`
   - `KIU_TURN_URLS`
   - `KIU_TURN_USERNAME`
   - `KIU_TURN_CREDENTIAL`

## 2. Microsoft app registration

Register a Microsoft Entra application and allow this redirect URI:

- `https://your-backend-domain/api/portal/microsoft/callback`

Scopes needed:

- `openid`
- `profile`
- `email`
- `User.Read`

## 3. Start infrastructure

Use [docker-compose.yml](D:/mock yo - Copy - Copy (2) - Copy/docker-compose.yml):

```bash
docker compose up -d
```

This starts:

- `portal-web` on `:8080`
- `portal-backend` on `:47833`
- `postgres` on `:5432`
- `minio` on `:9000` and `:9001`
- `redis` on `:6379`
- `coturn`

## 4. Database state

The runtime now expects PostgreSQL-backed persistence. The long-form schema target is still defined in:

- [001_portal_schema.sql](D:/mock yo - Copy - Copy (2) - Copy/infra/postgres/init/001_portal_schema.sql)
- [002_university_foundation.sql](D:/mock yo - Copy - Copy (2) - Copy/infra/postgres/init/002_university_foundation.sql)

Use it as the ongoing migration target for:

- users and linked Microsoft identities
- student/staff profiles
- subjects, sections, enrollments
- admissions and lifecycle state
- finance accounts, holds, scholarships, payments
- HR contracts, departments, teaching load, leave
- campus rooms, facilities tickets, housing, asset loans
- Student Service tickets/messages
- notifications
- messenger/calls
- social profiles/posts/comments/follows
- moderation, referrals, audit, and sync reconciliation

Current production constraint:

- run only one authoritative `portal-backend` writer until the shared-state store has real optimistic concurrency support

## 5. File storage

Current expectation:

- binary uploads and anti-cheat installers are published through external storage/CDN or explicit local artifact paths
- file metadata belongs in backend persistence, not legacy bridge folders

## 6. Calling and video

Current update:

- runtime ICE config can now come from backend env instead of hardcoded public STUN only

Next production step:

- deploy public TURN with real external IP and TLS
- use real domain names and certificates

## 7. What is still not fully complete

Remaining major work:

- remove remaining hidden legacy shell markup from live pages
- finish replacing compatibility page code that still assumes old shell selectors
- move all file/media storage fully to MinIO/S3
- add websocket-based realtime synchronization for every domain
- add production moderation/privacy for social
- add full presence, call history, missed-call flow, and group-call rules
- replace remaining static/demo-like page content with backend-driven data
- integrate with external SIS, finance ERP, HR, and curriculum services
- implement job runners and reconciliation workers over Redis/background queues
- add institution-grade audit, retention, and recovery procedures

## 8. Source-of-truth model

Recommended whole-university ownership:

- Microsoft Entra: identity
- SIS/registrar ERP: official student and academic truth
- finance ERP: ledger and financial truth
- HR: staff employment truth
- portal DB: collaboration, Student Service, social, notifications, messaging, calls

See:

- [UNIVERSITY_SYSTEM_ARCHITECTURE.md](D:/mock yo - Copy - Copy (2) - Copy/docs/UNIVERSITY_SYSTEM_ARCHITECTURE.md)

## 9. Recommended next migration order

1. `portal_users`, linked Microsoft identities, and student/staff profiles
2. external system registry and sync/reconciliation
3. finance + lifecycle + HR migration
4. file storage migration to MinIO
5. messenger + call persistence migration
6. registration/sections/enrollment transactions
7. Student Service + referral migration
8. notification event bus
9. full social backend + moderation migration

## 10. Final handoff docs

- [FINAL_HANDOFF_ARCHITECTURE.md](/C:/lms/good/lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy/docs/FINAL_HANDOFF_ARCHITECTURE.md)
- [FINAL_CLEANUP_MIGRATION.md](/C:/lms/good/lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy/docs/FINAL_CLEANUP_MIGRATION.md)

## 11. Protected quiz production rollout

For the anti-cheat final phase on desktop and Android, also see:

- [ANTI_CHEAT_ANDROID_DESKTOP_ROLLOUT.md](/C:/lms/good/lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy/docs/ANTI_CHEAT_ANDROID_DESKTOP_ROLLOUT.md)

Important production env vars for that rollout:

- `KIU_ANTI_CHEAT_APP_URL`
- `KIU_ANTI_CHEAT_BACKEND_URL`
- `KIU_ALLOWED_DOMAINS`
- `KIU_ANTI_CHEAT_WINDOWS_URL` or `KIU_ANTI_CHEAT_WINDOWS_PATH`
- `KIU_ANTI_CHEAT_ANDROID_URL` or `KIU_ANTI_CHEAT_ANDROID_PATH`

Important routes now exposed by the backend:

- `/download`
- `/download/windows`
- `/download/android`
- `/api/platform/downloads`
