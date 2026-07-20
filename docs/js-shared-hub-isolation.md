# Shared-hub isolation (Wave E2)

**Goal:** danger hubs stay thin — bootstrap, session, and re-exports — so feature work does not accidentally land in files linked from ~20 HTML routes.

Related: [`js-safe-edit-surface.md`](js-safe-edit-surface.md) (blast map) · [`engineering-band-queue.md`](engineering-band-queue.md) · [`tools/safe-edit-manifest.json`](../tools/safe-edit-manifest.json).

## Rule

| Allowed in danger hubs (`api.js`, `state.js`, shell entry/chrome, …) | Not allowed |
|---------------------------------------------------------------------|-------------|
| Load guards, portal bootstrap, session/auth glue | New feature UI (drafts, drag/drop, route-only panels) |
| Thin `const x = window.x` re-exports after a peel | New domain merge/sync logic for one product surface |
| Generic helpers used by many routes | One-off fetches / CMS merges for a single admin tool |

Prefer: domain peels (`assets/js/app/*-runtime.js`, `pages/*-runtime.js`) or domain clients (e.g. [`assets/js/pages/news/news-api.js`](../assets/js/pages/news/news-api.js)).

## Proof peels (hubs already thinned)

| Peel | From hub | Owns |
|------|----------|------|
| `api-lms-portal-runtime.js` | `api.js` | LMS / exam / social portal HTTP helpers |
| `api-portal-persist-runtime.js` | `api.js` | Persist / mail / diagnostic helpers |
| `api-admin-merge-runtime.js` | `api.js` | Admin-library + registration CMS merge (E2) |
| `state-deleted-staff-runtime.js` | `state.js` | Deleted-staff helpers |
| `state-admin-exam-runtime.js` | `state.js` | Admin exam/quiz + exam-session helpers (E4) |

## Ratchets

- **AdminQuiz / AdminExam** helpers: peeled to `state-admin-exam-runtime.js` (E4); `check:e2` asserts host has none left.
- Hub line ceilings: `npm run check:js-ceilings`.

## How to check

```bash
npm run check:e2
npm run check:safeedit
```
