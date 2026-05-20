# Final Cleanup Migration Notes

## Removed or retired

- runtime `mock-data.js` bootstrapping
- seeded portal test accounts in frontend auth/state
- local test-profile login path
- admin preview-role session model
- QA shared-course helper flow in LMS

## Replacements

- `assets/js/data/initial-state.js`
  - explicit empty-state safety bootstrap
- `GET /api/bootstrap`
  - authenticated state bootstrap
- PostgreSQL-backed store
  - `backend/platform/postgres-record-store.js`
- admin-only impersonation
  - `POST /api/session/impersonate-role`
  - `DELETE /api/session/impersonate-role`
- explicit historical import utility
  - `backend/platform/legacy-import.js`

## Storage migration

Previous runtime defaults:

- `KIU_STORAGE_DRIVER=json`
- `KIU_FILE_STORAGE_MODE=bridge`

Current runtime defaults:

- `KIU_STORAGE_DRIVER=postgres`
- `KIU_FILE_STORAGE_MODE=external`

## Operational notes

- Set `KIU_DATABASE_URL` before starting the backend.
- Set bootstrap admin credentials through env:
  - `KIU_ADMIN_EMAIL`
  - `KIU_ADMIN_PASSWORD`
- Published anti-cheat artifacts should be provided through:
  - `KIU_ANTI_CHEAT_WINDOWS_URL` or `KIU_ANTI_CHEAT_WINDOWS_PATH`
  - `KIU_ANTI_CHEAT_ANDROID_URL` or `KIU_ANTI_CHEAT_ANDROID_PATH`
