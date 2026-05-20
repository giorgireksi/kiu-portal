# Students Admin Optimization Tracker

Target page: `students-admin.html`
Last updated: `2026-05-15`
Owner: `Codex`
Goal: keep the students-admin route anchored to its dedicated LMS adapter, prove the remaining shared shell imports, and avoid reintroducing legacy duplicate management surfaces.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `students-admin.html` | `3,126 bytes` |
| Page adapter | `assets/js/pages/students-admin-lms.js` | `105,327 bytes` |
| Page stylesheet | `assets/css/students-admin-lms.css` | `40,906 bytes` |
| External scripts | `13` | Script-tag inventory in `students-admin.html` |
| Inline handlers | `0` | Source scan of `students-admin.html` |
| Shared verification | Existing route/runtime tests remain green | `test/students-admin-lms-route.test.js`, `test/students-admin-lms-runtime.test.js`, `test/student-service-split-workspace.test.js` |
| QA artifacts | Present | `artifacts/students-admin-efficient-desktop-summary.json`, `artifacts/students-admin-mobile-summary.json` |

## Current Findings

1. `students-admin.html` is already in its dedicated LMS adapter shape and should stay the source of truth unless a replacement is formally proven.
2. The route is much cleaner than the legacy management duplicate, and the duplicate file has now been removed from the live tree.
3. The remaining shared shell imports are now provably required for shell bootstrap, utility badges, transparency refresh, and route wiring.
4. The adapter no longer depends on any legacy fade helper or old directory page-pack path; its directory/profile flow is owned locally inside `students-admin-lms.js`.
5. Efficient-tier desktop and mobile route artifacts now cover first-ready, filter-change, and modal-open timings with zero page or console errors.

## AI Update Rules

1. Update this file in the same turn as every change to `students-admin.html`, `assets/js/pages/students-admin-lms.js`, or `assets/css/students-admin-lms.css`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current adapter shape unless a task explicitly changes it.
6. If the duplicate legacy file becomes the source of truth, mark that decision explicitly and update this tracker.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| STUADM-01 | Done | 0% | Continue trimming shared shell dependencies so this route loads only the admin-students runtime it actually needs | The route remains a near-thin shell plus one dedicated adapter. |
| STUADM-02 | Done | 0% | Audit whether `messenger.js` and other shared imports are still necessary on first load | The import table now records why each remaining shared import is still required. |
| STUADM-03 | Done | 0% | Measure first paint and first interaction cost on real low-end laptops and integrated GPUs after the recent cleanup | Captured in the efficient-desktop and mobile artifacts. |
| STUADM-04 | Done | 0% | Decide whether `students_lms_management.html` is dead and remove it from maintenance if `students-admin.html` is the source of truth | The legacy duplicate had no live references and was removed. |
| STUADM-05 | Done | 0% | Create a dedicated tracker so future work does not get mixed into unrelated docs | This file is the dedicated tracker. |
| STUADM-06 | Done | 0% | Build a keep/remove table for every shared import on the page and record exact evidence for each verdict | See the import table below. |
| STUADM-07 | Done | 0% | Add weak-laptop and mobile checks for table open, filter change, and modal open latency | Captured in the route artifacts. |
| STUADM-08 | Done | 0% | Keep the HTML shell minimal and block any future route-pack imports from creeping back in | The route test now guards the dedicated adapter, required shared imports, and absence of legacy drift. |

## Import Notes

Current route-shell evidence:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/app/app.js` | Keep | Required shell bootstrap for the route. |
| `assets/js/app/api.js` | Keep | Shared auth/API layer for the shell. |
| `assets/js/app/auth.js` | Keep | Required for portal auth state. |
| `assets/js/data/initial-state.js` | Keep | Shared state bootstrap. |
| `assets/js/app/state.js` | Keep | Shared state and role wiring. |
| `assets/js/shared/faculty.js` | Keep | Faculty label/theme helpers. |
| `assets/js/shared/messenger.js` | Keep | `index-luxury.js` still calls `getMessengerSnapshot()` for shell chat badges and utility panels. |
| `assets/js/shared/utilities.js` | Keep | The route bootstrap still calls `switchFacultyTheme()`, and shared transparency refresh logic explicitly includes `#students-content`. |
| `assets/js/features/navigation.js` | Keep | Route navigation and role routing. |
| `assets/js/features/ui.js` | Keep | Shared shell UI helpers for shell panels and route-level modals. |
| `assets/js/features/index-luxury.js` | Keep | Shared shell theme pipeline, topbar chrome, and messenger badge rendering. |
| `assets/js/pages/students-admin-lms.js` | Keep | Dedicated students-admin adapter. |
| `assets/css/students-admin-lms.css` | Keep | Dedicated route stylesheet. |

## Ownership Notes

- `students-admin.html` is the live owner for the route shell.
- `assets/js/pages/students-admin-lms.js` owns the directory, profile, modal, import/export, and admin record workflows.
- `assets/css/students-admin-lms.css` owns the dedicated route presentation.
- `students_lms_management.html` is no longer a live source of truth and remains only as a historical removal record in the master audit.

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-14` | `docs/STUDENTS_ADMIN_OPTIMIZATION_TRACKER.md` | `STUADM-05` | Baseline from `students-admin.html`, `assets/js/pages/students-admin-lms.js`, `assets/css/students-admin-lms.css`, and existing route/runtime tests. |
| `2026-05-15` | `students_lms_management.html`, `docs/STUDENTS_ADMIN_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STUADM-04` | Repo-wide reference scans found `students_lms_management.html` only in docs; `assets/js/features/navigation.js` still routes `students-admin` to `students-admin.html`; `assets/js/app/auth.js` still redirects admin logins to `students-admin.html`; and `Test-Path students_lms_management.html` now returns `False` after deletion. |
| `2026-05-15` | `test/students-admin-lms-route.test.js`, `artifacts/students-admin-efficient-desktop-summary.json`, `artifacts/students-admin-mobile-summary.json`, `docs/STUDENTS_ADMIN_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STUADM-01`, `STUADM-02`, `STUADM-03`, `STUADM-06`, `STUADM-07`, `STUADM-08` | Route guards now prove the required shared imports, the absence of legacy fade/duplicate drift, and the dedicated adapter shape; artifacts record efficient-desktop (`firstReadyMs: 1725`, `filterChangeMs: 525`, `modalOpenMs: 769`) and mobile (`firstReadyMs: 1023`, `filterChangeMs: 75`, `modalOpenMs: 151`) timings with zero errors. |

## Next Safe Pass

1. Closed for now. If `students-admin.html` changes again, rerun the route/runtime tests and refresh the desktop/mobile artifact summaries.
