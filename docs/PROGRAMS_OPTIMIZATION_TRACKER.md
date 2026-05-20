# Programs Optimization Tracker

Target page: `programs.html`
Last updated: `2026-05-15`
Owner: `Codex`
Goal: keep the programs route functional while trimming dead shell/runtime imports, preserving the standalone academic-program view, and separating the real program renderer from legacy route-pack carryover.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `programs.html` | `19,370 bytes` after the region-split pass |
| External scripts | `12` | Direct script inventory from `programs.html` after the social/page-pack trim |
| Page runtimes | `1` | Only `assets/js/pages/programs-page.js` remains on first load for the standalone programs view |
| Inline handlers | `0` | Source scan of `programs.html` |
| Shell `setInterval(` hits | `0` | Both the route bootstrap and the mobile shell now use direct hook paths instead of polling |
| Dead social helper imports | `0` | `social-hub.js`, `social-render.js`, and `social-media.js` are no longer in `programs.html` |
| Unproven messenger shell import | `0` | `messenger.js` is no longer in `programs.html` |
| Route-specific tracker | Present | This file is now the dedicated programs tracker |
| Dedicated route test coverage | Present but minimal | `test/programs-route-regressions.test.js` now covers the shell trim and no-polling hook paths |

## Current Findings

1. `programs.html` is still a standalone academic-program route, and the real page renderer now lives in `assets/js/pages/programs-page.js` instead of `registration.js`.
2. The dead social helper trio, `messenger.js`, and the obvious unrelated page-pack imports are now gone from the shell.
3. The old polling-based route bootstrap and nav-hook waits are gone; the standalone programs shell now relies on direct hook setup plus the deferred registration runtime.
4. The shell now seeds its own `studentEducationalProgramUiState` fallback instead of depending on `admin-registration.js` just to define that state object.
5. The programs renderer is now route-owned and delegated, with `0` generated `onclick=` / `oninput=` / `onchange=` hooks remaining in `assets/js/pages/programs-page.js`.
6. The route no longer rebuilds `student-educational-program-root` as one full blob for filter/search/module changes; it now keeps a stable stage shell with separate overview, module-rail, and subject-panel regions.
7. The hero/filter shell no longer re-renders on filter/search/module changes either; those controls are now stable HTML nodes updated in place.
8. Real desktop/mobile browser perf evidence now exists for first-ready, filter change, and module-detail updates using a seeded local curriculum because the default frontend state ships no published curriculum modules.

## AI Update Rules

1. Update this file in the same turn as every change to `programs.html` or the route-owned program renderer dependencies.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current programs route visual language and standalone route decision unless a task explicitly changes them.
6. If a task is blocked by `registration.js` coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| PROG-01 | Done | 0% | Verify which of `lms.js`, `planner.js`, `student-registration.js`, and `admin-registration.js` are actually required for the programs route and remove the rest from startup | The shell now loads none of those page-pack runtimes and no longer loads `registration.js` either. |
| PROG-02 | Done | 0% | Extract program selector, filter, and detail rendering into a dedicated page controller | The standalone route now loads `assets/js/pages/programs-page.js` as its dedicated controller. |
| PROG-03 | Done | 0% | Lazy-load modal content and curriculum detail panes | The current standalone route has no separate curriculum modal, and the subject-detail pane now mounts through a deferred `scheduleProgramsSubjectPanelRender(...)` path instead of synchronously with the other regions. |
| PROG-04 | Done | 0% | Remove any stale page-local shell markup that only exists because of old registration coupling | The remaining registration-coupled copy and boot comment were removed from the standalone programs shell/controller. |
| PROG-05 | Done | 0% | Add a programs-specific tracker | This file is the dedicated tracker. |
| PROG-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See `Import Verdicts` below. |
| PROG-07 | Done | 0% | Replace any whole-root rerender path with smaller updates for filter changes and selected program detail | Filter/search/module changes now update stable hero/filter nodes plus overview/module-rail/subject-panel regions without recreating the route root or shell chrome. |
| PROG-08 | Done | 0% | Add weak-laptop and mobile checks for list open, filter change, and curriculum modal open latency | Captured with seeded local curriculum plus the built-in admin-testing student persona; the route no longer has a separate curriculum modal, so the artifact measures module-detail pane update latency instead. |
| PROG-09 | Done | 0% | Verify whether `programs` access is intentionally shared across student, professor, TA, and admin roles | Already documented in the master audit access matrix. |

## Import Verdicts

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | `programs.html` is a standalone route and still primes the shell before the deferred stack. |
| `assets/js/app/app.js` | Keep | The mobile shell still calls `window.toggleMessaging()` and `window.toggleNotifications()`, and `app.js` provides those compatibility fallbacks. |
| `assets/js/app/api.js` | Keep for now | Direct program-view fetch usage is not present, but safe removal from the shared standalone shell/auth bootstrap path is not yet proven. |
| `assets/js/app/auth.js` | Keep | Inference from source: the standalone route still depends on authenticated session bootstrap before `getCurrentUser()` and role-aware program context can succeed. |
| `assets/js/data/initial-state.js` | Keep | `assets/js/pages/programs-page.js` still reads `KIU_STATE.curriculumLibraryModulesByFaculty` and subject state. |
| `assets/js/app/state.js` | Keep | `programs-page.js` still uses `getCurrentUser()` and route-aware session context. |
| `assets/js/shared/utilities.js` | Keep | `programs-page.js` still depends on shared helpers like `escapeHtml()` and `getActiveCurriculum()`, and the shell bootstrap still calls `updateTransparency()` / `refreshLuxuryTransparencySurfaces()`. |
| `assets/js/shared/faculty.js` | Keep | `programs-page.js` still depends on `normalizeFacultyCode()`, `getFacultyLabel()`, `getFacultyProfile()`, and `getProgramLabelForUser()`. |
| `assets/js/shared/social-hub.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/shared/social-render.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/shared/social-media.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/shared/messenger.js` | Remove | Removed from `programs.html`; the route no longer needs it on parse, and the route regression still passes without it. |
| `assets/js/features/navigation.js` | Keep | The mobile shell and the programs-specific visual nav hook still depend on `window.navigate()`. |
| `assets/js/features/ui.js` | Keep for shared shell | No direct programs-runtime symbol was proven in this pass, but safe removal from the standalone shell is not yet proven. |
| `assets/js/features/index-luxury.js` | Keep | The shell bootstrap still depends on shared background/transparency behavior and the standalone shell token pipeline. |
| `assets/js/pages/gradebook.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/pages/lms.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/pages/registration.js` | Remove | Removed from `programs.html` after extracting the route-owned programs controller. |
| `assets/js/pages/planner.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/pages/directories.js` | Remove | Removed from `programs.html`; no direct programs-route ownership remained. |
| `assets/js/pages/student-registration.js` | Remove | Removed from `programs.html`; the local programs UI state fallback replaced the old indirect dependency. |
| `assets/js/pages/admin-registration.js` | Remove | Removed from `programs.html`; the local programs UI state fallback replaced the old indirect dependency. |
| `assets/js/pages/programs-page.js` | Keep | Dedicated route-owned programs controller for the standalone academic-program view. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `programs.html`, `test/programs-route-regressions.test.js`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-01`, `PROG-05`, `GLOBAL-11` | Removed the dead `social-hub.js` / `social-render.js` / `social-media.js` imports, removed the unproven `messenger.js` and unrelated `gradebook.js` / `lms.js` / `planner.js` / `directories.js` / `student-registration.js` / `admin-registration.js` page-pack imports, replaced the polling-based route bootstrap and nav-hook waits with direct hook paths, seeded a local `studentEducationalProgramUiState` fallback, verified the result with `npx vitest run test/programs-route-regressions.test.js`, and captured the new baseline: `19,652` bytes, `12` external scripts, `0` inline handlers, `0` `setInterval(` hits, and one local programs UI-state fallback. |
| `2026-05-15` | `assets/js/pages/programs-page.js`, `programs.html`, `test/programs-route-regressions.test.js`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-01`, `PROG-02` | Extracted the standalone programs renderer cluster out of `registration.js` into `assets/js/pages/programs-page.js`, updated `programs.html` to load the new controller instead of `registration.js`, `node --check assets/js/pages/programs-page.js` passed, `npx vitest run test/programs-route-regressions.test.js` stayed green, and direct source metrics now show `assets/js/pages/programs-page.js` is the sole page runtime referenced by the shell. |
| `2026-05-15` | `assets/js/pages/programs-page.js`, `test/programs-route-regressions.test.js`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-07` | Added one delegated programs-page interaction layer for search, semester filter, search clear, semester chips, and module selection; `node --check assets/js/pages/programs-page.js` passed again; `npx vitest run test/programs-route-regressions.test.js` stayed green; and direct source metrics now show `0` `onclick=`, `0` `oninput=`, and `0` `onchange=` hits in the route-owned programs controller. |
| `2026-05-15` | `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-06` | Completed the programs-shell import proof by mapping every remaining shared shell import and every removed page-pack/runtime import to concrete keep/remove evidence after the programs controller extraction. |
| `2026-05-15` | `assets/js/pages/programs-page.js`, `test/programs-route-regressions.test.js`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-07` | Replaced the whole-root `student-educational-program-root` rebuild with a stable `ensureProgramsContentShell(...)` stage and three targeted regions (`programs-overview-region`, `programs-module-rail-region`, `programs-subject-panel-region`); `node --check assets/js/pages/programs-page.js` passed; `npx vitest run test/programs-route-regressions.test.js` stayed green; and direct source metrics now show `programs.html` at `19,370` bytes with one `39,114` byte page controller that updates the three route-owned regions separately. |
| `2026-05-15` | `programs.html`, `assets/js/pages/programs-page.js`, `test/programs-route-regressions.test.js`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-03`, `PROG-07` | Replaced the last filter/hero shell rewrites with stable HTML controls in `programs.html`, updated `programs-page.js` to mutate those nodes in place, and deferred the curriculum detail pane through `scheduleProgramsSubjectPanelRender(...)`; `node --check assets/js/pages/programs-page.js` passed again; `npx vitest run test/programs-route-regressions.test.js` stayed green; and the regression now proves the shell IDs, the lazy subject-panel scheduler, and the absence of `heroMetaEl.innerHTML` / `filterShell.innerHTML` rewrites. |
| `2026-05-15` | `programs.html`, `assets/js/pages/programs-page.js`, `test/programs-route-regressions.test.js`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-04` | Removed the last registration-coupled shell comment/copy from the standalone programs route, replacing the old Curriculum Library / before-registration wording with standalone academic-program language; `node --check assets/js/pages/programs-page.js` passed again; `npx vitest run test/programs-route-regressions.test.js` stayed green; and source scans now show the new standalone phrasing with no remaining `Boot Curriculum Library view on standalone load`, `before registration.`, or `live subject counts from the Curriculum Library.` strings. |
| `2026-05-15` | `artifacts/programs-efficient-desktop-summary.json`, `artifacts/programs-mobile-summary.json`, `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROG-08` | Captured real Playwright timings against `http://127.0.0.1:8899/programs.html` using the built-in admin-testing student persona plus a seeded local ECON curriculum/module set because the default frontend state contains no published curriculum modules: the efficient-desktop artifact reports `firstReadyMs: 1165`, `filterChangeMs: 30`, `moduleDetailMs: 15`, `filteredRows: 5`, and zero errors; the mobile artifact reports `firstReadyMs: 1162`, `filterChangeMs: 43`, `moduleDetailMs: 33`, `filteredRows: 5`, `mobileNavVisible: true`, and zero errors. |

## Next Safe Pass

No programs-specific work remains open. If the route grows again, keep future detail panes lazy and region-scoped instead of restoring root-level rewrites.
