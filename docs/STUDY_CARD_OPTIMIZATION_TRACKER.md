# Study Card Optimization Tracker

Target page: `study-card.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the standalone study-card route functional while trimming dead shell/runtime imports, proving the real page-runtime ownership, and preparing the academic-record flow for extraction out of the legacy `planner.js` pack.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `study-card.html` | `15,814 bytes` after finishing the root-entry validator cleanup on the standalone shell |
| External scripts | `13` | Direct script inventory from `study-card.html` after removing the dead social/messenger and unrelated page-pack imports |
| Page runtimes | `2` | Only `assets/js/pages/gradebook.js` and `assets/js/pages/study-card-page.js` remain on first load |
| Inline handlers | `0` | Source scan of `study-card.html` after moving modal actions to delegated attributes |
| Shell `setInterval(` hits | `0` | The inline mobile shell now uses the direct `ensureNavigateHooks()` path instead of polling |
| Dead social helper imports | `0` | `social-hub.js`, `social-render.js`, and `social-media.js` are gone from `study-card.html` |
| Unproven messenger shell import | `0` | `messenger.js` is gone from `study-card.html` |
| Route-owned assessment inline hooks | `0` | `assets/js/pages/planner.js` no longer emits the study-card assessment `onclick` hooks |
| Runtime size still carried by the route | `study-card-page.js` `31,389 bytes`, `gradebook.js` `155,473 bytes` | Direct file-size check after the region-split pass |
| Route-specific tracker | Present | This file is now the dedicated study-card tracker |
| Dedicated route test coverage | Present but minimal | `test/study-card-route-regressions.test.js` now covers the shell trim, no-polling mobile shell path, and delegated study-card action hooks |

## Current Findings

1. `study-card.html` no longer loads the dead social helper trio, `messenger.js`, or the unrelated `lms.js` / `registration.js` / `directories.js` / `student-registration.js` / `admin-registration.js` page-pack files.
2. The standalone route now boots a dedicated `assets/js/pages/study-card-page.js` controller instead of the full `planner.js` pack, and that controller carries the route-local helper subset that had previously leaked in through `messenger.js` and `student-registration.js`.
3. The old static modal `onclick` hooks are gone from `study-card.html`, and the study-card assessment open/minimize buttons now use one delegated `data-study-card-assessment-*` layer inside the dedicated controller.
4. `lms.js` and `registration.js` still mention `renderStudyCard()`, but only as re-render side effects; the standalone route no longer needs either file at parse time, and the semester/assessment renderer stays owned by `assets/js/pages/study-card-page.js`.
5. `renderStudyCard()` no longer rewrites the whole `#study-card-container` for the normal loaded state; it now keeps a stable shell and updates separate summary and semester regions.
6. The old static modal payload is gone from `study-card.html`; the route now keeps only the `modal-overlay` scaffold and relies on `assets/js/features/ui.js` to create announcement, event, syllabus, and programs modal shells on demand.
7. Real desktop/mobile browser QA now exists for loaded-state open, assessment detail open, lazy syllabus-modal open, and long-page scroll using a seeded local curriculum because the default frontend state ships no study-card records for the standalone route.
8. No dedicated export flow remains on the live route; the artifacts explicitly record `exportFlowPresent: false`, so any future export-specific flow should stay lazy and route-owned if it returns.
9. The study-card entry shell no longer ships a UTF-8 BOM; the focused route regression now guards that file-level structural baseline.
10. The root-entry markup cleanup is now complete for `study-card.html`: the hidden nav stubs have unique labels, the program-view filter shell uses route classes instead of inline styles, the two icon-only view buttons now expose accessible labels, and the mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `study-card.html` or the study-card-owned parts of `planner.js` / `gradebook.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current standalone study-card visual language unless a task explicitly changes it.
6. If a task is blocked by `planner.js` or `gradebook.js` coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| SCARD-01 | Done | 0% | Remove unrelated route imports so the page stops loading the full registration and planner pack on startup | The shell now loads only `gradebook.js` plus the dedicated `study-card-page.js` controller. |
| SCARD-02 | Done | 0% | Replace inline handlers with delegated listeners | `study-card.html` now has `0` inline handlers, and the study-card assessment buttons in `planner.js` now use delegated `data-study-card-assessment-*` actions. |
| SCARD-03 | Done | 0% | Extract printable/export-heavy sections into lazy-mounted route modules | The heavy static modal payload is removed from `study-card.html` and now mounts on demand through the shared modal builders; no dedicated export flow remains on the live route. |
| SCARD-04 | Done | 0% | Audit overlap with `registration.html` and `personal-data.html` so shared card rendering moves to one place | Ownership is now resolved: `registration.js` keeps enroll/unenroll refresh side effects plus shared data contracts, `personal-data-page.js` stays on identity/snapshot content, and the live semester/assessment renderer remains route-owned in `assets/js/pages/study-card-page.js`. |
| SCARD-05 | Done | 0% | Add a study-card tracker | This file is the dedicated tracker. |
| SCARD-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See `Page Runtime Verdicts` below. |
| SCARD-07 | Done | 0% | Replace any whole-card rerender path with smaller updates for section toggle, export action, and field change states | `renderStudyCard()` now keeps a stable shell and updates `study-card-summary-region` plus `study-card-terms-region` separately instead of rewriting the loaded card root as one block. |
| SCARD-08 | Done | 0% | Add weak-laptop and mobile checks for card open, print/export entry, and section scroll smoothness | Captured with seeded local curriculum plus the built-in admin-testing student persona; no dedicated export flow remains, so the artifact measures lazy syllabus-modal entry instead. |
| SCARD-09 | Done | 0% | Remove the remaining validator-confirmed BOM fault from `study-card.html` | The entry HTML is now saved without UTF-8 BOM bytes, and `test/study-card-route-regressions.test.js` guards that baseline. |

## Page Runtime Verdicts

| Runtime | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/gradebook.js` | Keep | `assets/js/pages/study-card-page.js` still calls `getGradebookWeightProfileForRoster()`, `getAssessmentDisplayValue()`, `getAssessmentEntries()`, `getGradebookVisibleOutcome()`, `getGradebookEffectiveExamScore()`, `syncGradeRecordSummaries()`, `ensureGradeRecordHistories()`, and `renderStudyCardHistorySections()` while building the live study-card rows. |
| `assets/js/pages/lms.js` | Remove | Direct source inspection shows only one standalone re-render hook at `assets/js/pages/lms.js:4873`; `study-card.html` no longer loads it and the regression test stays green. |
| `assets/js/pages/registration.js` | Remove | Direct source inspection shows only two `renderStudyCard()` side-effect calls at `assets/js/pages/registration.js:5102` and `assets/js/pages/registration.js:5158`; `study-card.html` no longer loads it and the regression test stays green. |
| `assets/js/pages/planner.js` | Remove | `study-card.html` now loads `assets/js/pages/study-card-page.js` instead, and that dedicated controller owns the live study-card renderer, assessment-window workflow, roster-key lookup, enrollment lookup, and local ECTS parsing without the rest of the planner pack. |
| `assets/js/pages/directories.js` | Remove | No `study-card` or `renderStudyCard` ownership was found in source, and the file is now removed from `study-card.html`. |
| `assets/js/pages/student-registration.js` | Remove | No `study-card` or `renderStudyCard` ownership was found in source, and the file is now removed from `study-card.html`. |
| `assets/js/pages/admin-registration.js` | Remove | No `study-card` or `renderStudyCard` ownership was found in source, and the file is now removed from `study-card.html`. |
| `assets/js/pages/study-card-page.js` | Keep | Dedicated route-owned study-card controller for the standalone academic-record view. |

## Overlap Notes

| Route | Source-backed overlap | Shared extraction note |
| --- | --- | --- |
| `registration.html` / `assets/js/pages/registration.js` | Registration owns course/group schedule mutations, ECTS-limit enforcement, and explicitly calls `renderStudyCard()` after enroll and unenroll so the study card reflects the live registration state. | Shared extraction should stay at the data adapter level: schedule entry normalization, ECTS parsing, and enrollment-driven refresh contracts. The visual semester/assessment renderer now belongs only to `study-card-page.js`. |
| `personal-data.html` | Personal data exposes student identity and academic snapshot shell content plus direct nav actions into `study-card` and `registration`, but it does not render semester tables or assessment history. | The only plausible shared extraction is a compact student identity/academic snapshot header, not the study-card details grid or assessment window. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-17` | `study-card.html`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md` | `SCARD-09` | Removed the UTF-8 BOM from `study-card.html` and added a raw-buffer regression guard; `npx vitest run test/study-card-route-regressions.test.js` passed `2/2`; focused `npx -y html-validate study-card.html` no longer reports the earlier `no-utf8-bom` failure; and direct buffer inspection now confirms the file ships without BOM bytes. |
| `2026-05-15` | `study-card.html`, `assets/js/pages/planner.js`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-01`, `SCARD-02`, `SCARD-05`, `SCARD-06` | Removed the dead `social-hub.js` / `social-render.js` / `social-media.js` / `messenger.js` imports, removed the unrelated `lms.js` / `registration.js` / `directories.js` / `student-registration.js` / `admin-registration.js` page-pack imports, replaced the polling-based mobile-shell navigate wait with the direct `ensureNavigateHooks()` path, converted the route-local modal and assessment actions to delegated `data-*` hooks, verified `0` inline handlers in `study-card.html` and `0` remaining study-card assessment `onclick` hooks in `planner.js`, `node --check assets/js/pages/planner.js` passed, and `npx vitest run test/study-card-route-regressions.test.js` passed with the new shell/runtime assertions. |
| `2026-05-15` | `assets/js/pages/study-card-page.js`, `study-card.html`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-01`, `SCARD-06` | Extracted the live study-card controller out of `planner.js` into `assets/js/pages/study-card-page.js`, copied the route-local helper subset that had previously leaked in through `messenger.js` and `student-registration.js`, updated `study-card.html` to load the dedicated controller instead of `planner.js`, `node --check assets/js/pages/study-card-page.js` passed, `npx vitest run test/study-card-route-regressions.test.js` stayed green, and direct source metrics now show `13` external scripts, `2` page runtimes, `0` inline handlers, `0` shell `setInterval(` hits, and a dedicated study-card controller size of `25,819` bytes. |
| `2026-05-15` | `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-04` | Source inspection now proves that `registration.js` owns the live schedule/ECTS mutations and explicitly re-renders the study card after enrollment changes, while `personal-data.html` overlaps only at the identity/academic-snapshot shell level and not at the semester/assessment renderer level. |
| `2026-05-15` | `assets/js/pages/study-card-page.js`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-07` | Replaced the normal loaded-state full-container rewrite with a stable `ensureStudyCardContentShell(...)` shell plus separate `study-card-summary-region` and `study-card-terms-region` updates; `node --check assets/js/pages/study-card-page.js` passed; `npx vitest run test/study-card-route-regressions.test.js` stayed green; and direct source metrics now show `study-card.html` at `101,136` bytes with a `31,389` byte route controller that keeps the assessment cache and loaded-state regions separate. |
| `2026-05-15` | `study-card.html`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-03` | Removed the static modal payload from `study-card.html`, leaving only the `modal-overlay` scaffold so announcement/event/syllabus/program/program-courses shells now mount lazily through `assets/js/features/ui.js`; `npx vitest run test/study-card-route-regressions.test.js` stayed green; and direct source metrics now show `study-card.html` at `15,904` bytes with `0` inline handlers and `0` static modal payload IDs beyond `modal-overlay`. |
| `2026-05-16` | `assets/js/pages/study-card-page.js`, `assets/js/features/navigation.js`, `test/study-card-route-regressions.test.js`, `artifacts/study-card-efficient-desktop-summary.json`, `artifacts/study-card-mobile-summary.json`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-03`, `SCARD-08` | Added standalone fallbacks for LMS-linked assessment display helpers so the trimmed route can render in browser context without `lms.js`, confirmed the navigation runtime guard no longer re-injects the old registration pack on the standalone page, and captured real desktop/mobile Playwright artifacts with a seeded local curriculum plus the built-in admin-testing student persona: the efficient-desktop artifact reports `firstReadyMs: 1424`, `assessmentOpenMs: 7`, `syllabusOpenMs: 46`, `scrollTopAfter: 1594`, `rows: 12`, and zero errors; the mobile artifact reports `firstReadyMs: 1310`, `assessmentOpenMs: 6`, `syllabusOpenMs: 34`, `scrollTopAfter: 1372`, `rows: 12`, `mobileNavVisible: true`, and zero errors; both artifacts also record `exportFlowPresent: false`. |
| `2026-05-16` | `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SCARD-04` | Added source guards proving `assets/js/pages/registration.js` only triggers two `renderStudyCard()` refresh side effects, `assets/js/pages/personal-data-page.js` stays on identity/summary/records sections only, and the semester table plus assessment window remain owned by `assets/js/pages/study-card-page.js`; `npx vitest run test/study-card-route-regressions.test.js` passed. |
| `2026-05-18` | `study-card.html`, `assets/css/index-luxury.css`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `SCARD-02`, `SCARD-09` | Added unique labels to the hidden nav stubs, moved the program-view filter shell onto route-owned classes in `index-luxury.css`, labeled the two icon-only filter buttons, and normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` dropped `study-card.html` from `21` to `0`, and `npx vitest run test/study-card-route-regressions.test.js` passed `1/1` file and `2/2` tests. |

## Next Safe Pass

1. No study-card-specific cleanup tasks remain open.
2. If study-card gains a real export/print workflow later, keep it lazy and route-owned instead of restoring static modal payload in the HTML shell.
3. If the route gains more interaction later, keep future additions region-scoped and preserve the current ownership boundary with `registration.html` and `personal-data.html`.
