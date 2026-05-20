# Faculty Gradebook Optimization Tracker

Target page: `faculty-gradebook.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the faculty gradebook workflow functional while proving which shared/page runtimes it actually needs, reducing inline handler debt, and separating gradebook-only behavior from the broader faculty/LMS pack.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `faculty-gradebook.html` | `23,710 bytes` after the root-entry validator cleanup on the canonical faculty gradebook shell |
| External scripts | `11` | Direct script inventory after removing the eager `lms.js` shell import |
| Page scripts | `1` | `gradebook.js` only; `lms.js` now lazy-loads only for LMS handoff actions |
| Inline handlers | `0` | Source scan after moving both the shell controls and the route runtime action markup to delegated `data-gradebook-*` hooks |
| Style blocks | `0` | Direct HTML scan |
| Shell `setInterval(` hits | `0` | Inline mobile shell now uses the direct `ensureNavigateHooks()` path instead of polling |
| Known redirect overlap | Present | `gradebook.html` already redirects to `faculty-gradebook.html` and remains covered by `test/redirect-wrapper-regressions.test.js` |
| Dedicated route test coverage | Present | `test/faculty-gradebook-route-regressions.test.js` now guards the import boundary and mobile-shell bootstrap path |
| Browser artifacts | `2` route summaries | `artifacts/faculty-gradebook-efficient-desktop-summary.json`, `artifacts/faculty-gradebook-mobile-summary.json` |

## Current Findings

1. `faculty-gradebook.html` now behaves like a real standalone faculty route again: the shell renders roster cards, opens the grading table, and opens student history detail under a seeded professor dataset without requiring `messenger.js` or eager `lms.js`.
2. The dead social helper trio and `messenger.js` are now gone from the shell, and the eager page-pack is reduced to `gradebook.js` only; `lms.js` now lazy-loads through `ensurePortalLmsRuntimeLoaded()` only when the student-preview handoff needs the LMS quiz view.
3. The shell controls and the gradebook runtime action markup are now delegated through `bindStandaloneGradebookShell()`, the gradebook roster/LMS display helpers now live in `assets/js/app/app.js`, and the grading spreadsheet shell no longer mounts until a roster is opened.
4. `faculty-schedule.html` is now a redirect alias to `timetable.html`, which removes the old gradebook-vs-schedule shell duplication entirely.
5. The redirect alias `gradebook.html` is already reduced to a zero-runtime wrapper, which means this page is the canonical faculty grading entry and should stay separate from the timetable route.
6. The root-entry markup cleanup is now complete for `faculty-gradebook.html`: the hidden nav stubs have unique labels, the remaining raw `&` source text is encoded, and the mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `faculty-gradebook.html` or its route-owned runtime dependencies.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current grading workflow and faculty visual language unless a task explicitly changes them.
6. If a task is blocked by LMS/registration coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| FGB-01 | Done | 0% | Remove unrelated route imports and make the page load only the faculty gradebook runtime it actually needs | The shell now eagerly loads only `gradebook.js`; `lms.js` is lazy-loaded through `ensurePortalLmsRuntimeLoaded()` only for the LMS quiz handoff path. |
| FGB-02 | Done | 0% | Replace remaining inline handlers with delegated listeners | The shell controls now use `data-gradebook-*` hooks and `bindStandaloneGradebookShell()` in `gradebook.js`. |
| FGB-03 | Done | 0% | Decide whether `faculty-gradebook.html` should stay separate from the broader faculty workspace or become a lighter route wrapper | Keep it separate: `gradebook.html` already aliases here, and the live route owns grading-specific roster, spreadsheet, and history workflows that do not belong on `timetable.html`. |
| FGB-04 | Done | 0% | Audit gradebook and timetable dependency overlap so the page stops paying for modules that are not used on initial load | The former overlap with `faculty-schedule.html` is eliminated because that route now redirects to `timetable.html`; the live gradebook route no longer imports `planner.js` and remains distinct from the timetable workspace. |
| FGB-05 | Done | 0% | Add a faculty-gradebook tracker and browser QA flow | This file is the dedicated tracker. |
| FGB-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See `Import Notes` below; the final eager page-runtime verdict is `gradebook.js` keep, `lms.js` lazy-only, and the remaining five route packs removed. |
| FGB-07 | Done | 0% | Split summary widgets, grading tables, and detail panes so the route can mount incrementally | The hidden spreadsheet shell is no longer prebuilt in the HTML entry; it now mounts on first roster open through `ensureGradebookSpreadsheetShell()`. |
| FGB-08 | Done | 0% | Add mobile and weak-laptop checks for grade table load, filter, and open-detail actions | The new seeded desktop/mobile artifacts now record roster-ready, semester-filter change, grade-table open, and history-modal open timings with zero errors. |

## Import Notes

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/gradebook.js` | Keep eager | The standalone shell boots `bindStandaloneGradebookShell()`, `renderGradebookRosterSelection()`, and `initGradebook()` directly from this runtime. |
| `assets/js/pages/lms.js` | Lazy only | `faculty-gradebook.html` no longer imports it eagerly; `assets/js/app/app.js` now exposes `ensurePortalLmsRuntimeLoaded()`, and `assets/js/pages/gradebook.js` calls it only for the LMS quiz handoff path in `previewGradebookStudentAccount()`. |
| `assets/js/pages/registration.js` | Removed | Absent from `faculty-gradebook.html`. |
| `assets/js/pages/planner.js` | Removed | Absent from `faculty-gradebook.html`. |
| `assets/js/pages/directories.js` | Removed | Absent from `faculty-gradebook.html`. |
| `assets/js/pages/student-registration.js` | Removed | Absent from `faculty-gradebook.html`. |
| `assets/js/pages/admin-registration.js` | Removed | Absent from `faculty-gradebook.html`. |

## Open Questions

- No open faculty-gradebook-specific cleanup questions remain in this tracker right now.

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-05` | Baseline from `faculty-gradebook.html` source inspection: `30,676` bytes, `22` external scripts, `7` page scripts, `8` inline handlers, `0` style blocks, and `1` shell `setInterval(` hit; `gradebook.html` redirect coverage already exists in `test/redirect-wrapper-regressions.test.js`. |
| `2026-05-15` | `faculty-gradebook.html`, `test/faculty-gradebook-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-01`, `GLOBAL-11` | Removed the dead `social-hub.js` / `social-render.js` / `social-media.js` imports from the shell, replaced the mobile-shell `setInterval` navigate wait with the direct `ensureNavigateHooks()` path, and verified the result with `npx vitest run test/faculty-gradebook-route-regressions.test.js`; direct source metrics now show `30,472` bytes, `19` external scripts, `8` inline handlers, `0` style blocks, `0` `setInterval(` hits, and `0` social-helper imports. |
| `2026-05-15` | `faculty-gradebook.html`, `faculty-schedule.html`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-04` | Direct route comparison now shows `faculty-schedule.html` still contains the same gradebook-oriented shell markers and handlers as `faculty-gradebook.html`: `gradebook-roster-selection`, `gradebook-body`, `renderGradebookRosterSelection()`, `initGradebook()`, `saveGrades()`, and `updateGradebookWeightInput(...)`, which proves the schedule/gradebook overlap before any runtime split. |
| `2026-05-15` | `assets/js/pages/gradebook.js`, `faculty-gradebook.html`, `faculty-schedule.html`, `test/faculty-gradebook-route-regressions.test.js`, `test/faculty-schedule-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-02`, `FSCH-02` | Added `bindStandaloneGradebookShell()` to `assets/js/pages/gradebook.js`, moved both faculty shells to delegated `data-gradebook-*` control hooks, `node --check assets/js/pages/gradebook.js` passed, and `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` passed; direct source metrics now show `0` inline handlers in both standalone faculty routes. |
| `2026-05-15` | `faculty-gradebook.html`, `faculty-schedule.html`, `test/faculty-gradebook-route-regressions.test.js`, `test/faculty-schedule-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-01`, `FSCH-01` | Removed the unused `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, and `admin-registration.js` imports from both faculty shells; `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` stayed green; and direct source metrics now show `29,968` bytes / `14` external scripts for `faculty-gradebook.html` and `29,945` bytes / `14` external scripts for `faculty-schedule.html`. |
| `2026-05-15` | `faculty-gradebook.html`, `faculty-schedule.html`, `test/faculty-gradebook-route-regressions.test.js`, `test/faculty-schedule-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-01`, `FSCH-01` | Removed the unproven `messenger.js` shell import from both faculty routes; `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` stayed green; and direct source metrics now show `13` external scripts for both faculty standalone pages. |
| `2026-05-16` | `assets/js/app/app.js`, `assets/js/pages/gradebook.js`, `faculty-gradebook.html`, `faculty-schedule.html`, `test/faculty-gradebook-route-regressions.test.js`, `test/faculty-schedule-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-01`, `FGB-06`, `FSCH-01`, `FSCH-06` | Added `ensurePortalLmsRuntimeLoaded()` to `assets/js/app/app.js`, switched `previewGradebookStudentAccount()` in `assets/js/pages/gradebook.js` to lazy-load LMS only for the quiz handoff flow, removed the eager `lms.js` shell import from both faculty standalone pages, and verified the boundary with `node --check assets/js/app/app.js`, `node --check assets/js/pages/gradebook.js`, and `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js`; direct source metrics now show `11` external scripts and `1` eager page runtime on both faculty shells. |
| `2026-05-16` | `assets/js/app/app.js`, `assets/js/pages/gradebook.js`, `faculty-gradebook.html`, `tools/capture_faculty_gradebook_summary.mjs`, `artifacts/faculty-gradebook-efficient-desktop-summary.json`, `artifacts/faculty-gradebook-mobile-summary.json`, `test/faculty-gradebook-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-03`, `FGB-04`, `FGB-08` | Moved the standalone gradebook roster helpers and LMS assessment-display fallbacks into `assets/js/app/app.js`, deferred the faculty-gradebook boot calls until `DOMContentLoaded`, added a seeded Playwright gradebook probe, and verified the route now renders rosters and opens the grading workspace without `messenger.js`; `node --check assets/js/app/app.js`, `node --check assets/js/pages/gradebook.js`, and `node --check tools/capture_faculty_gradebook_summary.mjs` passed; `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed `1/1`; `artifacts/faculty-gradebook-efficient-desktop-summary.json` now records `firstReadyMs: 1879`, `filterChangeMs: 750`, `gradeTableOpenMs: 156`, `historyOpenMs: 144`, `gradeTableRowCount: 2`, and zero errors; `artifacts/faculty-gradebook-mobile-summary.json` now records `firstReadyMs: 783`, `filterChangeMs: 133`, `gradeTableOpenMs: 99`, `historyOpenMs: 15`, `gradeTableRowCount: 2`, `mobileNavVisible: true`, and zero errors; and `faculty-schedule.html` now redirects to `timetable.html`, resolving the old shell overlap. |
| `2026-05-16` | `faculty-gradebook.html`, `assets/js/pages/gradebook.js`, `tools/capture_faculty_gradebook_summary.mjs`, `artifacts/faculty-gradebook-efficient-desktop-summary.json`, `artifacts/faculty-gradebook-mobile-summary.json`, `test/faculty-gradebook-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-07` | Removed the prebuilt hidden spreadsheet workspace from `faculty-gradebook.html`, added `getGradebookSpreadsheetShellMarkup()` plus `ensureGradebookSpreadsheetShell()` in `assets/js/pages/gradebook.js`, and now mount the summary widgets, grading table, and audit/detail pane only when a roster is opened; `node --check assets/js/pages/gradebook.js` passed; `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed `1/1`; direct source scans now show `23,663` bytes for `faculty-gradebook.html`, no `gradebook-body` or `audit-logs` in the HTML shell, and the new lazy shell helpers in `gradebook.js`; `artifacts/faculty-gradebook-efficient-desktop-summary.json` now records `firstReadyMs: 2832`, `filterChangeMs: 700`, `gradeTableOpenMs: 611`, `historyOpenMs: 241`, and zero errors; and `artifacts/faculty-gradebook-mobile-summary.json` now records `firstReadyMs: 719`, `filterChangeMs: 54`, `gradeTableOpenMs: 103`, `historyOpenMs: 13`, and zero errors. |
| `2026-05-17` | `assets/js/pages/gradebook.js`, `test/gradebook-delegation-regressions.test.js`, `test/faculty-gradebook-route-regressions.test.js`, `test/study-card-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FGB-02` | Replaced the remaining inline runtime hooks in `gradebook.js` with delegated `data-gradebook-*` controls for weight edits, roster open, history modal navigation, score edits, custom-section actions, quiz-paper opens, transcript/detail buttons, and publish/finalize/export actions; `node --check assets/js/pages/gradebook.js` passed; `npx vitest run test/gradebook-delegation-regressions.test.js test/faculty-gradebook-route-regressions.test.js test/study-card-route-regressions.test.js` passed `3/3`; and a direct source scan now reports `0` inline handler attributes in `assets/js/pages/gradebook.js`. |
| `2026-05-18` | `faculty-gradebook.html`, `test/faculty-gradebook-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `FGB-01` | Added unique labels to the hidden nav stubs, encoded the remaining raw `&amp;` source text in the page title, hero badge, and faculty options, and normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` dropped `faculty-gradebook.html` from `20` to `0`, and `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed `1/1` file and `1/1` test. |

## Next Safe Pass

1. Closed for now. If `faculty-gradebook.html` changes again, keep the spreadsheet shell lazy and rerun the focused regression plus the seeded browser probe.
