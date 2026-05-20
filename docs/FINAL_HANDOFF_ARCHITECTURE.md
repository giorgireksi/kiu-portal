# Final Handoff Architecture

## Overview

This final-phase handoff removes the old runtime mock/test bootstrap path and makes the portal depend on:

- backend bootstrap: `GET /api/bootstrap`
- PostgreSQL-backed platform persistence
- admin-only role impersonation
- source anti-cheat UI under `anti-cheat/src/ui`

The frontend may still initialize from an explicit empty state for first render safety, but the authoritative state now comes from backend bootstrap and authenticated session data.

## Frontend bootstrap flow

1. `assets/js/data/initial-state.js` provides `KIU_EMPTY_STATE`.
2. The page loads runtime/auth scripts.
3. Auth restores the authenticated account from backend session storage.
4. `bootstrapPortalBackendState()` requests `GET /api/bootstrap`.
5. Backend returns:
   - `account`
   - `session`
   - `effectiveRole`
   - `state`
   - `social`
   - `meta`
   - `shell`
6. The frontend hydrates `KIU_STATE` from that payload and persists only the cached application snapshot.

## Admin impersonation model

- Only accounts whose real role is `admin` may impersonate another role.
- The backend session keeps:
  - `actualRole`
  - `impersonatedRole`
- Frontend effective role rules:
  - non-admin: always the authenticated role
  - admin: authenticated role unless an impersonated role is active

### Endpoints

- `POST /api/session/impersonate-role`
- `DELETE /api/session/impersonate-role`

## Backend persistence model

The backend now defaults to PostgreSQL.

- env:
  - `KIU_STORAGE_DRIVER=postgres`
  - `KIU_DATABASE_URL`
  - `KIU_DATABASE_TABLE_NAME`
- storage implementation:
  - `backend/platform/postgres-record-store.js`
- state shape source:
  - `backend/platform/state-shape.js`
- historical import utility:
  - `backend/platform/legacy-import.js`

The current persistence layer stores top-level platform namespaces as JSONB records in PostgreSQL. This removes JSON/bridge runtime dependency while preserving the existing in-memory store API during the final migration phase.

## Anti-cheat release flow

- source UI lives in `anti-cheat/src/ui`
- desktop and Android builds must be produced from source and published externally
- backend download/install endpoints expose the published artifacts
- checked-in generated UI artifacts are not the editing source of truth

## Handoff expectation

IT should deploy:

- LMS frontend on a public HTTPS domain
- backend on a public HTTPS domain
- PostgreSQL with `KIU_DATABASE_URL`
- Windows installer and Android APK through the download endpoints or external URLs
