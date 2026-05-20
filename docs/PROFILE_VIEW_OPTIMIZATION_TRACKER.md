# Profile View Optimization Tracker

Target page: `profile-view.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: stabilize `profile-view.html` for real-world use by removing corrupted source text, shrinking risky inline behavior, reducing dead imports, and preserving the existing profile UI and admin workflow.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `profile-view.html` | `109,545 bytes` after replacing the remaining static modal/template inline styles with route CSS classes |
| External scripts | `11` | Direct `rg -o "<script src="` / file inspection |
| Page-runtime scripts | `1` | `profile-view-admin-actions.js` only; the legacy page-pack imports are removed from the shell |
| Inline handler count | `0` | `rg -o "onclick=|onmouseover=|onmouseout=" profile-view.html` now returns no matches |
| Route stylesheet | `assets/css/profile-view-route.css` | `9,370 bytes` after absorbing the root-shell, modal-template, schedule-row, and mobile action-sheet class cleanup |
| Inline style blocks | `0` | `rg -o "<style" profile-view.html` now returns no matches |
| Mojibake markers | `0` | `rg -n "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢|ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡|ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½" profile-view.html` returned no matches |
| Shared verification | `5/5 focused profile-view tests passed` | `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` |
| Browser artifacts | `2` route summaries | `artifacts/profile-view-efficient-desktop-summary.json`, `artifacts/profile-view-mobile-summary.json` |

## Current Findings

1. `profile-view.html` is still a large standalone page with too much inline ownership.
2. Source corruption is now removed, inline click/hover behavior is fully delegated, route CSS now lives in a dedicated stylesheet, and the schedule/admin modal shells now mount from templates instead of raw inline modal strings.
3. The page no longer boots the old seven-runtime page pack; the remaining eager helper is the tiny `profile-view-admin-actions.js` bridge, while the route owns its local `getProfSchedule()` / `getEnrolledStudentsForGroup()` helpers instead of relying on the removed messenger layer.
4. The mobile shell no longer polls for `window.navigate()`; it now uses the same direct `ensureNavigateHooks()` path already used by the other cleaned routes.
5. The heavy non-overview tabs now stay unmounted until selected, so the first render no longer pays for schedule, groups, documents, and financial DOM all at once.
6. The page now has a clean enough source baseline to support controlled refactors, source-level regression tests, and seeded browser verification, and no profile-view-specific cleanup tasks remain open.
7. The first root-entry markup hardening batch is now landed on `profile-view.html`: the hidden nav landmarks have unique labels, the visible static inputs in the schedule and group-edit templates now declare explicit text types, and the visible `Create Session &amp; Deploy` source text is encoded correctly; focused `html-validate` dropped the page from `87` to `72` issues, leaving the remaining debt dominated by inline-style-heavy template markup.
8. The second markup hardening batch is now landed on the same route: the remaining missing button `type` attributes, icon-only delete/download button accessibility, edit-form text input types, and mobile action-sheet button structure are normalized, which drops the focused validator count further from `72` to `62`.
9. The third root-entry markup batch completed the entry-page validator cleanup for `profile-view.html`: the root loading shell, session modal template, edit-group modal template, schedule-row template, and mobile action-sheet icon gradients now all use route-owned CSS classes, and focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `profile-view.html` or its directly related cleanup tests.
2. Update `% left` for every touched task immediately after each edit batch.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection, targeted test output, or live verification evidence.
5. If a task is blocked by a larger product decision, mark it `Blocked` and explain the dependency.
6. Preserve current profile layout, role distinctions, and admin workflow unless the task explicitly changes them.
7. Any reintroduced mojibake, unreadable labels, or corrupted placeholders must be fixed immediately or blocked explicitly.
8. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| PV01 | Done | 0% | Remove visible mojibake and corrupted source text from `profile-view.html` | Source scan is clean and `test/profile-view-source-regressions.test.js` now guards the cleaned labels, placeholders, and day names. |
| PV02 | Done | 0% | Replace inline click, hover, and session-form sync handlers with delegated events | Modal close/save/create controls, the schedule-row delete control, the timetable hover behavior, and the session modal time/duration/end-time sync now all route through delegated `data-pv-*` hooks. |
| PV03 | Done | 0% | Move embedded style blocks into route-owned CSS | The head block and the three modal-local style blocks now live in `assets/css/profile-view-route.css`, and `profile-view.html` no longer contains `<style>` tags. |
| PV04 | Done | 0% | Audit and trim eager runtime imports | `profile-view.html` now keeps only the tiny `profile-view-admin-actions.js` helper as an eager page-runtime import; the unproven `messenger.js`, `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `student-registration.js`, `admin-registration.js`, and `directories.js` shell imports are gone. |
| PV05 | Done | 0% | Refactor timetable/session modal markup out of raw string HTML | The session modal, edit-group modal, and inline schedule-row editor now mount from dedicated templates instead of raw inline modal strings. |
| PV06 | Done | 0% | Audit tab rendering and lazy-mount inactive sections | Only the overview tab now mounts on first render; schedule, groups, documents, and financial panes now hydrate from per-tab templates when selected. |
| PV07 | Done | 0% | Create and maintain a dedicated page tracker | This file is the dedicated tracker for `profile-view.html`. |
| PV08 | Done | 0% | Build a handler inventory grouped by event type | Inventory captured below from direct source parsing of `onclick`, `onmouseover`, and `onmouseout` attributes. |
| PV09 | Done | 0% | Build a keep/remove matrix for each eager imported runtime | Matrix captured below with current verdicts and evidence from source references and function ownership scans. |
| PV10 | Done | 0% | Add weak-laptop and mobile verification for profile tabs and admin session tools | `tools/capture_profile_view_summary.mjs` now records efficient-desktop/mobile profile ready, schedule-tab open, session-modal open, and group-edit open timings on a seeded admin-viewed professor profile with zero runtime errors. |

## Handler Inventory

Current inline-handler grouping from `profile-view.html` source:

| Event group | Count | Evidence |
| --- | ---: | --- |
| Inline click/hover/form-sync handlers | `0` | Modal close/save/create controls, timetable hover affordances, and session modal sync fields now route through delegated `data-pv-*` hooks instead of inline `onclick` / `oninput` / `onchange` / `onmouseover` / `onmouseout` attributes. |

## Import Matrix

Current eager runtime verdicts for `profile-view.html`:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/gradebook.js` | Removed | No direct `gradebook.js` helper usage exists in `profile-view.html`; the page reads grade data directly from `KIU_STATE.studentGrades`. |
| `assets/js/pages/lms.js` | Removed | No direct LMS helper usage exists in the page source scan. |
| `assets/js/pages/registration.js` | Removed | No direct `registration.js` symbol usage exists in `profile-view.html`. |
| `assets/js/pages/planner.js` | Removed | `normalizeTimeString()`, `convertTimeToMinutes()`, and `minutesToTimeString()` are already exported by `assets/js/app/app.js`, and the profile-view shell has no direct `planner.js` page helper usage left. |
| `assets/js/pages/profile-view-admin-actions.js` | Keep for now | Admin bursar/transcript controls call `toggleProbationForUser()`, `applyHoldForUser()`, `applyScholarshipForUser()`, and `generateTranscriptForUser()`, all now defined in the dedicated profile-view admin helper. |
| `assets/js/pages/directories.js` | Removed | The canonical profile-view route no longer needs the full directories page pack; only the extracted bursar/transcript actions remain on the route through `profile-view-admin-actions.js`. |
| `assets/js/pages/student-registration.js` | Removed | No direct symbol usage exists in the page source scan. |
| `assets/js/pages/admin-registration.js` | Removed | No direct symbol usage exists in the page source scan. |
| `assets/js/shared/messenger.js` | Removed | `profile-view.html` does not render a messenger workspace, and shared messenger primitives now come from `faculty.js` / `app.js` where needed. |


## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-14` | `profile-view.html`, `test/profile-view-source-regressions.test.js` | `PV01` | `rg -n "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢|ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡|ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½" profile-view.html`, handler/style counts, and `npx vitest run test/profile-view-source-regressions.test.js test/social-lost-found-regressions.test.js test/redirect-wrapper-regressions.test.js` |
| `2026-05-14` | `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV07`, `PV08`, `PV09` | Inline-handler grouping extracted from `profile-view.html`, import list captured from script tags, and function-ownership scan across `assets/js` for `normalizeTimeString`, `toggleProbationForUser`, `applyHoldForUser`, `applyScholarshipForUser`, and `generateTranscriptForUser`. |
| `2026-05-16` | `profile-view.html`, `test/profile-view-route-regressions.test.js`, `test/profile-view-source-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV02` | Replaced the edit/session/group modal overlay dismiss handlers, modal close buttons, modal submit buttons, one inline schedule-row delete button, and the remaining timetable hover handlers with delegated `data-pv-*` hooks; `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `3/3`; direct source scans now show `0` remaining `onclick` / `onmouseover` / `onmouseout` handlers; and the source regression now locks the `data-pv-hover=\"slot\"` and `data-pv-hover=\"event-card\"` delegation contract. |
| `2026-05-16` | `profile-view.html`, `assets/css/profile-view-route.css`, `test/profile-view-route-regressions.test.js`, `test/profile-view-source-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV03` | Moved the head stylesheet block and the three modal-local `<style>` blocks into `assets/css/profile-view-route.css`, replaced the modal-local dynamic focus colors with `--pv-modal-accent` / `--pv-modal-soft-bg` CSS variables on the form containers, `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `3/3`, and direct source scans now show `0` remaining `<style>` tags in `profile-view.html`. |
| `2026-05-16` | `profile-view.html`, `test/profile-view-route-regressions.test.js`, `test/profile-view-source-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV04` | Removed the unproven eager `messenger.js`, `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `student-registration.js`, and `admin-registration.js` shell imports from `profile-view.html`; `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `2/2`; direct source scans now show `11` external scripts and only `directories.js` remaining as a page-runtime import. |
| `2026-05-16` | `profile-view.html`, `tools/capture_profile_view_summary.mjs`, `artifacts/profile-view-efficient-desktop-summary.json`, `artifacts/profile-view-mobile-summary.json`, `test/profile-view-route-regressions.test.js`, `test/profile-view-source-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV04`, `PV10` | Localized `getProfSchedule()` / `getEnrolledStudentsForGroup()` into `profile-view.html`, fixed the undefined `resolveDayIndex(...)` usage in the professor group-edit flow, removed the mobile-shell `setInterval` navigate polling in favor of `ensureNavigateHooks()`, and added a seeded Playwright profile-view probe; `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `4/4`; `node --check tools/capture_profile_view_summary.mjs` passed; `artifacts/profile-view-efficient-desktop-summary.json` now records `firstReadyMs: 2033`, `scheduleTabOpenMs: 910`, `sessionModalOpenMs: 91`, `groupsTabOpenMs: 39`, `groupEditOpenMs: 99`, and zero errors; and `artifacts/profile-view-mobile-summary.json` now records `firstReadyMs: 703`, `scheduleTabOpenMs: 94`, `sessionModalOpenMs: 25`, `groupsTabOpenMs: 17`, `groupEditOpenMs: 23`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `profile-view.html`, `test/profile-view-route-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV02` | Replaced the last session-modal `oninput` / `onchange` hooks with delegated `data-pv-session-sync` fields; `npx vitest run test/profile-view-route-regressions.test.js` passed; direct source scans now show `0` remaining inline `onclick` / `oninput` / `onchange` / `onmouseover` / `onmouseout` handlers; and the route regression now locks the `data-pv-session-sync=\"start\"` / `data-pv-session-sync=\"end\"` contract. |
| `2026-05-16` | `profile-view.html`, `tools/capture_profile_view_summary.mjs`, `artifacts/profile-view-efficient-desktop-summary.json`, `artifacts/profile-view-mobile-summary.json`, `test/profile-view-route-regressions.test.js`, `test/profile-view-source-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV05`, `PV06` | Replaced the session modal, edit-group modal, and inline schedule-row editor with dedicated `<template>` shells plus clone-based mounting, changed the non-overview tabs to lazy-mount from per-tab templates on first selection, and tightened the profile-view probe so tab-open timing waits for mounted content instead of only the active tab class; `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `5/5`; `node --check tools/capture_profile_view_summary.mjs` passed; direct source scans now show `id=\"pv-session-modal-template\"`, `id=\"pv-editgroup-modal-template\"`, `id=\"pv-schedule-row-template\"`, `id=\"pvtab-1-template\"`, `id=\"pvtab-2-template\"`, `id=\"pvtab-3-template\"`, `id=\"pvtab-4-template\"`, and `data-pv-mounted=\"0\"` placeholders for the inactive panes; `artifacts/profile-view-efficient-desktop-summary.json` now records `firstReadyMs: 2414`, `scheduleTabOpenMs: 960`, `sessionModalOpenMs: 345`, `groupsTabOpenMs: 59`, `groupEditOpenMs: 326`, and zero errors; and `artifacts/profile-view-mobile-summary.json` now records `firstReadyMs: 968`, `scheduleTabOpenMs: 64`, `sessionModalOpenMs: 121`, `groupsTabOpenMs: 31`, `groupEditOpenMs: 170`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-17` | `assets/js/pages/directories.js`, `test/profile-view-route-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV04` | Replaced the remaining `directories.js` inline click/input/change handlers with delegated `data-directory-*` hooks, preserving the canonical-profile bridge and the bursar/transcript admin helpers without shipping template-level inline actions; `node --check assets/js/pages/directories.js` passed; `npx vitest run test/profile-view-route-regressions.test.js` passed; and direct source scans now show `assets/js/pages/directories.js` at `81,403` bytes with `0` inline event attributes. |
| `2026-05-17` | `assets/js/pages/profile-view-admin-actions.js`, `profile-view.html`, `test/profile-view-route-regressions.test.js`, `artifacts/profile-view-efficient-desktop-summary.json`, `artifacts/profile-view-mobile-summary.json`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PV04` | Extracted the four bursar/transcript admin actions into `assets/js/pages/profile-view-admin-actions.js` and removed `directories.js` from `profile-view.html`; `node --check assets/js/pages/profile-view-admin-actions.js` passed; `npx vitest run test/profile-view-route-regressions.test.js` passed; direct source scans now show `profile-view.html` at `111,898 bytes`, `assets/js/pages/profile-view-admin-actions.js?v=20260517-profileviewadmin1`, and no eager `directories.js` import; and refreshed profile-view artifacts still report zero errors with `firstReadyMs: 5168/730`, `scheduleTabOpenMs: 739/133`, `sessionModalOpenMs: 612/25`, and `groupEditOpenMs: 165/21`. |
| `2026-05-18` | `profile-view.html`, `test/profile-view-source-regressions.test.js`, `test/profile-view-route-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `PV01` | Added unique labels to the hidden navigation stubs, explicit text input types to the visible schedule/group-edit template fields, and encoded the visible `Create Session &amp; Deploy` button label correctly; focused `html-validate` dropped `profile-view.html` from `87` to `72` issues; and `npx vitest run test/profile-view-source-regressions.test.js test/profile-view-route-regressions.test.js` stayed green. |
| `2026-05-18` | `profile-view.html`, `test/profile-view-source-regressions.test.js`, `test/profile-view-route-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `PV01` | Added the remaining missing `type="button"` attributes to the visible static document buttons, labeled the icon-only schedule-row delete and custom-document download buttons, normalized the remaining profile-edit text input types, and converted the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">`; focused `html-validate` dropped `profile-view.html` from `72` to `62` issues; and `npx vitest run test/profile-view-source-regressions.test.js test/profile-view-route-regressions.test.js` stayed green at `2/2` files and `5/5` tests. |
| `2026-05-18` | `profile-view.html`, `assets/css/profile-view-route.css`, `test/profile-view-source-regressions.test.js`, `test/profile-view-route-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `PV01`, `PV03` | Replaced the remaining static root-shell, session-modal, edit-group-modal, schedule-row, and mobile action-sheet inline styles with route CSS classes, bumped the route stylesheet cache key, and dropped focused `html-validate` for `profile-view.html` from `62` to `0`; `npx vitest run test/profile-view-source-regressions.test.js test/profile-view-route-regressions.test.js` passed `2/2` files and `5/5` tests. |

## Next Safe Pass

1. No open profile-view-specific cleanup tasks remain.
2. If the route changes again, preserve the template-backed schedule/admin modal boundary and the lazy-mounted tab contract.
3. Keep the seeded profile-view browser probe in sync if tab or modal ownership moves again.
