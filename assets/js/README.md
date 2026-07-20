## JS Structure

The active entry pages now load the split files in this folder directly.

The organized source layout lives here:

- `app/`: runtime bootstrap, auth, and state-related slices
- `data/`: runtime-safe bootstrap state and shared client-side defaults
- `features/`: shared UI/navigation behavior
- `pages/`: page-focused logic groups
- `shared/`: cross-page helpers and data logic
- `legacy/`: older non-canonical scripts kept for reference

The old compatibility loaders `assets/js/core.js` and the root `core.js` are retired.

Active routes now load the split files in `assets/js/` directly.

### Findability (human)

**Day 1:** [`docs/ONBOARDING.md`](../docs/ONBOARDING.md).  
**Start here to find code:** [`docs/findability-index.md`](../docs/findability-index.md) (feature → owner → HTML).  
**What loads before X:** [`docs/dependency-index.md`](../docs/dependency-index.md).  
**Naming (A/B/C only):** [`docs/js-naming-patterns.md`](../docs/js-naming-patterns.md).  
**Change locality:** [`docs/js-change-locality.md`](../docs/js-change-locality.md).  
Rubric: [`docs/human-maintainability.md`](../docs/human-maintainability.md).
Checks: `npm run check:findability` · `npm run check:readability` · `npm run check:dependency` · `npm run check:naming`.

### Engineering A+ (structure)

See [`docs/engineering-a-plus-frontend-js.md`](../docs/engineering-a-plus-frontend-js.md).

Rules of thumb:

1. **Do not grow god files** — line ceilings live in `tools/check-architecture-guardrails.js`.
2. **New work goes in new modules** (domain `*-runtime.js` / pure `*-model.js`).
3. **Social workspace peels** load before `social-workspace.js` via `ensureSocialWorkspaceModule()` (`risk` → `schedule` → `health` → `graph-desk-model` → `graph` → `portfolio` → `week-plan` → `schedule-ui` → `tab-runtime` → `events` → `panel` → `graph-runtime` → `dialogs` → `graph-render` → `task-ui` → `portfolio-runtime` → `portfolio-ui` → `project-chrome` → `dialog-route`). Desk-model must precede graph-model.
4. **Social page pure helpers** load before `social-page.js` (`social-task-model.js`, `social-form-model.js`, `social-panel-model.js`, `social-alerts-model.js`, `social-profile-model.js`, `social-fingerprint-model.js`, `social-chrome-model.js`, `social-workspace-stubs.js`, `social-dialog-router.js`, `social-overlay-chrome.js`, `social-shell-nav.js`, `social-page-events.js`, `social-page-survey-runtime.js`, `social-page-feed-runtime.js`, `social-page-shell-runtime.js` on `social.html`). Survey/feed/shell runtimes are eager before `social-page.js`.
5. **Social entity ESM leaf:** `social-entity-model.js` as `type="module"`, then `social-entity-model-bridge.js` (defer) on `social.html`. Also eager: `social-lite-project-runtime.js`.
6. **Student service** loads `student-service-model.js`, `student-service-chrome.js`, `student-service-events.js`, then `student-service-inbox-runtime.js`, `student-service-page-runtime.js`, and `student-service-modules-runtime.js` before `student-service.js`.
7. **Transparency engine** loads immediately after `utilities.js` (`shared/lux-transparency.js` on all portal HTML pages).
8. **Whiteboard** loads via `LMS_WHITEBOARD_MODULE_URLS` / tabs chain (`lms-whiteboard-model.js`, pointer/paint, `lms-whiteboard-chrome-runtime.js`, `lms-whiteboard-session-runtime.js`, then `lms-whiteboard-runtime.js`). Classroom sessions + quiz-focus + quiz-workspace-session peels load via tabs / `lms.html` as needed.
9. **English localization** loads immediately after `app/app.js` (`app/english-localization.js` on portal HTML pages).
10. **LMS quiz** loads via `LMS_QUIZ_MODULE_URLS` (`lms-quiz-model.js`, `lms-quiz-blue-runtime.js`, then workspace/protected). `lms-quiz-blue-runtime.js` also loads eagerly before `lms.js` on `lms.html`.
11. **Luxury atmosphere** loads before `index-luxury.js` (`luxury-atmosphere-runtime.js` on portal HTML pages).
12. **Luxury palette** loads before atmosphere/`index-luxury.js` (`luxury-palette-runtime.js` on portal HTML pages).
13. **Luxury shell studio** (fog profiles) loads before `luxury-shell-chrome.js` (`luxury-shell-studio-runtime.js`).
14. **Batch peels (Wave 15):** `home-dashboard-widget-data-runtime.js`, `admin-registration-seats-runtime.js` (factory peels; load before their hosts).
15. **JS ceilings only:** `npm run check:js-ceilings` (line ceilings + factory peel allowlist + hard ≥3k + size ≥2k=0 + headroom ≥1900=0).
16. **Wave 17 leave-8 peels:** `student-service-ops`, `social-lite-content`, `lms-classroom-tabs-shell`, `exams-console-workspace`, `admin-registration-cms`, `lms-quiz-workspace-session`, `social-page-interactions`, `lms-whiteboard-session` — each before its host.
17. **Wave 18 headroom:** hot hosts ≤1850; see `test/wave18-headroom-peels.test.js` for peel load order locks.
