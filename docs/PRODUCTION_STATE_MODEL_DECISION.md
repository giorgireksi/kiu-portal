# Production State Model Decision

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the remaining shared-state audit gate by explicitly classifying the current runtime persistence model and its production constraint.

## Current Runtime Decision

The current production runtime model is:

- authoritative single writer only
- monolithic state-record table is the active runtime persistence layer
- normalized PostgreSQL tables under `infra/postgres/init/*.sql` are not the live application source of truth today

## Why

Evidence in current repo state:

- `backend/platform/postgres-record-store.js` is the active runtime persistence implementation
- it stores namespace payloads in `kiu_platform_state_records`
- `tools/check-production-readiness.js` now requires `KIU_SINGLE_WRITER_MODE=true`
- `tools/migrate-postgres.js` now serializes migrations with `pg_advisory_lock(...)`
- `savePortalState(...)` and related state sync paths were narrowed, but the runtime still relies on broad shared JSON state

## What This Means Operationally

Accepted current posture:

- one backend instance is allowed to write authoritative shared state
- startup migrations must run under a single migration leader
- multi-writer deployment is not accepted for this runtime model

Not accepted today:

- horizontally scaled backend writers against the same shared state table
- treating the normalized schema as if it were the live runtime store

## Next Real Migration Boundary

There are only two honest future directions:

1. stay on the monolithic shared-state store and keep the explicit single-writer constraint
2. redesign runtime ownership onto granular normalized records with optimistic concurrency and real multi-writer semantics

Anything in between would be misleading.

## Decision

For the current codebase, the shared-state audit is complete as an audit task because:

- the production storage model is explicitly classified
- the single-writer constraint is enforced and documented
- the remaining work is a future architecture migration, not an unresolved ambiguity
