# Staff Optimization Tracker

Target page: `staff.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the staff command center usable and professional while trimming dead imports, removing polling, and separating the desktop command center from the mobile shell.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `staff.html` | `6,733 bytes` after the root-entry validator cleanup on the standalone shell |
| Desktop command center | `assets/js/pages/staff-command-center.js` | `124,814 bytes` with the deferred canonical-profile bridge loader |
| Route bootstrap | `assets/js/pages/staff-route-bootstrap.js` | `1,576 bytes` and now owns the mobile-shell lazy-load boundary |
| Mobile shell | `assets/js/pages/staff-mobile-shell.js` | `9,307 bytes` after polling removal |
| Directory helper | `assets/js/pages/directories.js` | lazy-loaded only when the command center opens a canonical profile handoff |
| External scripts | `11` | Script-tag inventory in `staff.html` after removing the eager `directories.js` shell import |
| Eager route scripts | `2` | `staff-command-center.js` and `staff-route-bootstrap.js`; the mobile shell and `directories.js` are both deferred |
| Inline handlers | `0` in `staff.html` | Direct source scan after modal close delegation |
| Mobile polling loops | `0` in `staff-mobile-shell.js` | Source scan after replacing interval wait with direct hook setup |
| Shared verification | `4/4` focused staff regressions passed | `npx vitest run test/staff-mobile-runtime-regressions.test.js` |
| Browser artifacts | `2` route summaries | `artifacts/staff-efficient-desktop-summary.json`, `artifacts/staff-mobile-summary.json` |

## Current Findings

1. `staff.html` is now trimmed to the staff-specific runtime set instead of the old nine-script pack.
2. `staff-mobile-shell.js` no longer polls for `navigate`; it initializes directly and waits for `load` as a fallback.
3. `directories.js` no longer loads on initial staff route startup; `staff-command-center.js` lazy-loads it only when the operator opens the canonical profile handoff.
4. `staff-mobile-shell.js` no longer loads on initial desktop startup either; `assets/js/pages/staff-route-bootstrap.js` now loads it only when the viewport is mobile-sized, while mobile still gets the full action-sheet/nav shell.
5. The canonical staff-directory creation flow now leaves missing office/phone fields empty and ships clean confirmation copy instead of persisting corrupted placeholder strings.
6. The remaining main risk is the large `staff-command-center.js` bundle; the direct duplication audit shows the profile-view route and `directories.js` only overlap on a small canonical-profile bridge plus a few admin helper actions, not on shared render ownership.
7. The root-entry markup cleanup is now complete for `staff.html`: the hidden nav stubs have unique labels, the loading shell and overlay defaults now use route-owned classes instead of inline styles, and the mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `staff.html`, `assets/js/pages/staff-command-center.js`, `assets/js/pages/staff-mobile-shell.js`, or `assets/js/pages/directories.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve staff directory behavior, admin flows, and the current UI polish unless a task explicitly changes them.
6. If a task is blocked by unresolved ownership, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| STAFF-01 | Done | 0% | Remove unrelated LMS, registration, student-registration, and admin-registration imports unless staff workflows prove they are required | `staff.html` now keeps only `staff-command-center.js` plus `staff-route-bootstrap.js` eager; both `staff-mobile-shell.js` and `directories.js` are deferred behind their route boundaries. |
| STAFF-02 | Done | 0% | Replace the interval-based hook wait in `assets/js/pages/staff-mobile-shell.js` with a deterministic runtime-ready event | The interval loop is gone; the file now hooks directly and uses the `load` fallback. |
| STAFF-03 | Done | 0% | Split desktop staff command center and mobile shell responsibilities more cleanly so each viewport loads less code | Desktop now eagerly loads only the command center plus a tiny route bootstrap, while `staff-mobile-shell.js` loads only on mobile-sized viewports and `directories.js` still lazy-loads only for the canonical profile handoff. |
| STAFF-04 | Done | 0% | Audit directory rendering and staff profile flows for duplicated logic with `profile-view.html` and `directories.js` | The audit shows no shared page shell: `staff-command-center.js` owns the directory/governance/editor workflows, `profile-view.html` owns the person-centric viewer/session tools, and `directories.js` only remains as the canonical-profile bridge plus a few admin helper actions. |
| STAFF-05 | Done | 0% | Decide whether `staff_lms_clean.html` is dead and remove it if `staff.html` is the source of truth | The legacy duplicate had no live references and was removed. |
| STAFF-06 | Done | 0% | Add a dedicated staff tracker for desktop and mobile admin workflows | This file is the dedicated tracker. |
| STAFF-07 | Done | 0% | Build a per-import keep/remove table for all nine page scripts and record exact evidence for each verdict | Import table captured below. |
| STAFF-08 | Done | 0% | Add weak-laptop and mobile checks for directory open, command-center load, and staff action-sheet latency | `artifacts/staff-efficient-desktop-summary.json` and `artifacts/staff-mobile-summary.json` now capture low-spec desktop first-ready/profile-open and mobile first-ready/action-sheet-open timings with zero runtime errors. |
| STAFF-09 | Done | 0% | Split command-center render ownership from mobile-shell ownership before any larger staff refactor | `staff-command-center.js` remains the desktop owner, `staff-route-bootstrap.js` owns the viewport gate, and `staff-mobile-shell.js` now stays fully deferred until a mobile viewport needs it. |
| STAFF-10 | Done | 0% | Prevent canonical staff-directory creation from persisting corrupted fallback placeholders | `assets/js/pages/directories.js` now leaves missing `office` / `phone` fields empty, keeps clean confirmation copy, and `test/staff-mobile-runtime-regressions.test.js` locks those defaults. |

## Import Matrix

Current `staff.html` page-script verdicts:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/gradebook.js` | Remove | No direct callsite in `staff-command-center.js`; the staff shell now loads without it. |
| `assets/js/pages/lms.js` | Remove | No direct callsite in `staff-command-center.js`; the staff shell now loads without it. |
| `assets/js/pages/registration.js` | Remove | No direct callsite in `staff-command-center.js`; the staff shell now loads without it. |
| `assets/js/pages/planner.js` | Remove | No direct callsite in `staff-command-center.js`; the staff shell now loads without it. |
| `assets/js/pages/directories.js` | Defer | `staff-command-center.js` now lazy-loads it via `ensureDirectoryProfileBridge()` only when the operator opens the canonical profile handoff. |
| `assets/js/pages/student-registration.js` | Remove | No direct callsite in `staff-command-center.js`; the staff shell now loads without it. |
| `assets/js/pages/admin-registration.js` | Remove | No direct callsite in `staff-command-center.js`; the staff shell now loads without it. |
| `assets/js/pages/staff-command-center.js` | Keep | It owns the desktop staff UI and registers `window.renderStaffPage`. |
| `assets/js/pages/staff-route-bootstrap.js` | Keep | It owns the viewport gate that conditionally loads the mobile shell. |
| `assets/js/pages/staff-mobile-shell.js` | Defer | It owns the mobile staff nav and quick-actions shell, but now loads only when the viewport is mobile-sized. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-17` | `assets/js/pages/directories.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/STAFF_OPTIMIZATION_TRACKER.md` | `STAFF-10` | Removed the remaining mojibake comment/placeholder strings from the canonical staff-directory creation path, changed new staff defaults to empty `office` / `phone` values so the UI can render its existing `No office` / `No phone` fallbacks instead of persisting corrupted text, and refreshed the focused staff regression; `node --check assets/js/pages/directories.js` passed and `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed `4/4`. |
| `2026-05-14` | `staff.html`, `assets/js/pages/staff-mobile-shell.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/STAFF_OPTIMIZATION_TRACKER.md` | `STAFF-01`, `STAFF-02`, `STAFF-06`, `STAFF-07` | `npx vitest run test/staff-mobile-runtime-regressions.test.js test/social-mobile-runtime-regressions.test.js test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/profile-view-source-regressions.test.js test/social-lost-found-regressions.test.js test/redirect-wrapper-regressions.test.js`, source scans showing `0` inline handlers and `0` polling loops. |
| `2026-05-15` | `staff_lms_clean.html`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-05` | Repo-wide reference scans found `staff_lms_clean.html` only in docs; `assets/js/features/navigation.js` still routes `staff` to `staff.html`; and `Test-Path staff_lms_clean.html` now returns `False` after deletion. |
| `2026-05-16` | `staff.html`, `test/staff-mobile-runtime-regressions.test.js`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-03` | Removed the unproven `assets/js/shared/messenger.js` shell import from `staff.html`; `npx vitest run test/staff-mobile-runtime-regressions.test.js` stayed green at `3/3`; direct source scans now show `14` external scripts, no `messenger.js` import, and the same mobile-shell fallback path through `window.toggleMessaging()` / `window.toggleNotifications()` in `app.js`. |
| `2026-05-16` | `staff.html`, `test/staff-mobile-runtime-regressions.test.js`, `artifacts/staff-efficient-desktop-summary.json`, `artifacts/staff-mobile-summary.json`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-03`, `STAFF-08` | Removed the unneeded `assets/js/app/api.js` and `assets/js/features/ui.js` shell imports from `staff.html`; `npx vitest run test/staff-mobile-runtime-regressions.test.js` stayed green at `3/3`; direct source scans now show `12` external scripts with no `api.js` or `ui.js` import; `node --check tools/capture_staff_summary.mjs` passed; `artifacts/staff-efficient-desktop-summary.json` now records `firstReadyMs: 21151`, `profileOpenMs: 214`, `performanceTier: efficient`, and zero errors under the low-spec desktop probe; and `artifacts/staff-mobile-summary.json` records `firstReadyMs: 797`, `actionSheetOpenMs: 123`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `staff.html`, `assets/js/pages/staff-command-center.js`, `test/staff-mobile-runtime-regressions.test.js`, `artifacts/staff-efficient-desktop-summary.json`, `artifacts/staff-mobile-summary.json`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-03` | Removed the eager `assets/js/pages/directories.js` shell import from `staff.html`, added `ensureDirectoryProfileBridge()` so `staff-command-center.js` lazy-loads the canonical profile handoff only on demand, `node --check assets/js/pages/staff-command-center.js` passed, `npx vitest run test/staff-mobile-runtime-regressions.test.js` stayed green at `3/3`, direct source scans now show `11` external scripts and no eager `directories.js` import, and `node tools/capture_staff_summary.mjs` refreshed both staff artifacts with zero runtime errors. |
| `2026-05-16` | `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-04` | Compared `assets/js/pages/staff-command-center.js`, `profile-view.html`, and `assets/js/pages/directories.js`; current evidence shows no shared render shell, only a narrow canonical-profile handoff through `openProfilePage()` and a small set of student-focused admin helper actions (`toggleProbationForUser()`, `applyHoldForUser()`, `applyScholarshipForUser()`, `generateTranscriptForUser()`) that remain housed in `directories.js`. |
| `2026-05-16` | `tools/capture_staff_summary.mjs`, `artifacts/staff-efficient-desktop-summary.json`, `artifacts/staff-mobile-summary.json`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-03` | Extended the staff browser probe to measure the deferred canonical-profile handoff from the command center into `profile-view.html`; `node --check tools/capture_staff_summary.mjs` passed; `artifacts/staff-efficient-desktop-summary.json` now records `firstReadyMs: 21258`, `profileOpenMs: 222`, `canonicalProfileOpenMs: 924`, `canonicalProfileVisible: true`, `canonicalProfileUrl: /profile-view.html?...`, `canonicalProfileName: QA Prof Alpha`, and zero errors; and `artifacts/staff-mobile-summary.json` still records a zero-error mobile shell summary. |
| `2026-05-16` | `staff.html`, `assets/js/pages/staff-route-bootstrap.js`, `assets/js/pages/staff-mobile-shell.js`, `test/staff-mobile-runtime-regressions.test.js`, `tools/capture_staff_summary.mjs`, `artifacts/staff-efficient-desktop-summary.json`, `artifacts/staff-mobile-summary.json`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-03`, `STAFF-09` | Replaced the eager `staff-mobile-shell.js` script tag with `staff-route-bootstrap.js`, made the bootstrap defer `staff-mobile-shell.js` until a mobile-sized viewport needs it, and marked the mobile shell when it loads so the staff browser probe can prove the split; `node --check assets/js/pages/staff-route-bootstrap.js`, `node --check assets/js/pages/staff-mobile-shell.js`, and `node --check tools/capture_staff_summary.mjs` passed; `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed `3/3`; `artifacts/staff-efficient-desktop-summary.json` now records `mobileShellLoaded: false` and `mobileShellScriptPresent: false` on efficient desktop while keeping the canonical profile handoff green; and `artifacts/staff-mobile-summary.json` now records `mobileShellLoaded: true`, `mobileShellScriptPresent: true`, `mobileNavVisible: true`, `actionSheetOpenMs: 187`, and zero errors on mobile. |
| `2026-05-17` | `assets/js/pages/directories.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `STAFF-04` | Replaced the remaining `directories.js` inline click/input/change handlers with delegated `data-directory-*` hooks, keeping the canonical-profile bridge and staff admin controls intact while removing template-level inline action debt from the deferred helper; `node --check assets/js/pages/directories.js` passed; `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed; and direct source scans now show `assets/js/pages/directories.js` at `81,403` bytes with `0` inline event attributes. |
| `2026-05-18` | `staff.html`, `assets/css/staff-command-center.css`, `test/staff-mobile-runtime-regressions.test.js`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `STAFF-01` | Added unique labels to the hidden nav stubs, moved the loading shell and modal default visibility into `staff-command-center.css`, and normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` dropped `staff.html` from `19` to `0`, and `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed `1/1` file and `4/4` tests. |

## Next Safe Pass

1. Closed for now. If `staff.html` changes again, keep the desktop/mobile split intact and rerun the focused regression plus the staff browser summaries.
2. Revisit whether the remaining student-focused admin helper actions should stay in `directories.js` or move into a thinner shared admin utility layer only if the command-center bundle changes again.
3. Keep the canonical-profile handoff artifact green if the `profile-view` route or the bridge contract changes.
