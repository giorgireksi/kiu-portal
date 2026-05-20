# KIU Platform Backend Foundation

This repository now runs a modular platform backend behind the existing `http://127.0.0.1:47833` contract.

## What changed

- `kiu-realtime-bridge/server.js` is now a thin wrapper over `backend/platform/server.js`.
- Legacy `kiu-realtime-bridge/state.json` is treated as migration input.
- The live backend state is stored in `kiu-realtime-bridge/platform-state.json`.
- Browser login no longer accepts local plaintext fallback passwords when the backend is offline.
- Messenger attachments are persisted to backend file storage and returned as stored file references.

## Start

```bash
npm install
npm run start:platform
```

The existing `npm run start:bridge` script still works and starts the same server.

## Current storage mode

Default:

- `KIU_STORAGE_DRIVER=postgres`
- `KIU_FILE_STORAGE_MODE=external`

This gives a stable local development backend with server-owned sessions, chats, files, social state, registration state, LMS state, and gradebook state.

## Postgres path

The Postgres schema foundation now includes:

- auth credentials
- sessions
- file objects
- chat threads and members
- message receipts
- academic terms
- assessment items
- score entries
- grade publications
- import jobs

See `infra/postgres/init/003_platform_runtime.sql`.

## Important compatibility note

The frontend still contains broad legacy `KIU_STATE` usage. This backend now owns the critical runtime paths that were converted in this slice:

- auth and activation
- session state
- messenger and calls
- backend-stored file uploads
- social persistence endpoints
- registration, LMS, and gradebook APIs

The remaining page-by-page reads still need future UI migration to remove old client-owned state completely.
