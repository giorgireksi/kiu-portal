# Exams Optimization Tracker

Target page: `exams.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the exams route functional while shrinking shell debt, preserving the exam-console workflow, and preparing `assets/js/pages/exams-console.js` for a real split by feature area.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `exams.html` | `14,117 bytes` after the root-entry validator cleanup on the standalone shell |
| Page runtime | `assets/js/pages/exams-console.js` | `179,773 bytes` after moving the template builder, live/results grading, and admin review/schedule surfaces into deferred companion modules |
| Deferred builder module | `assets/js/pages/exams-console-builder.js` | `23,891 bytes` lazy-loaded only when a quiz draft or template editor is opened |
| Deferred attempts module | `assets/js/pages/exams-console-attempts.js` | `15,742 bytes` lazy-loaded only when the admin opens `live` or `results` |
| Deferred admin module | `assets/js/pages/exams-console-admin.js` | `20,514 bytes` lazy-loaded only when the admin opens `review` or `schedule` |
| External scripts | `15` | Direct script inventory from `exams.html` after removing `messenger.js`, including the three export-library CDN scripts |
| Inline handlers | `0` | Source scan of `exams.html` |
| Shell `setInterval(` hits | `0` | Inline mobile shell now uses the direct `ensureNavigateHooks()` path instead of polling |
| Dead social helper imports | `0` | `social-hub.js`, `social-render.js`, and `social-media.js` are no longer in `exams.html` |
| Route-specific tracker | Present | This file is now the dedicated exams tracker |
| Dedicated route test coverage | Present but minimal | `test/exams-route-regressions.test.js` now covers the shell trim and no-polling mobile shell path |
| Browser artifacts | `2` route summaries | `artifacts/exams-efficient-desktop-summary.json`, `artifacts/exams-mobile-summary.json` |

## Current Findings

1. `exams.html` now boots the shared exams shell plus the default template-list view only; the quiz builder, admin review/schedule, and admin live/results grading surfaces no longer ship in the eager file.
2. The dead social helper trio and `messenger.js` are now gone from the shell, and the mobile shell no longer waits for `window.navigate()` through polling.
3. The share and return overlays now use one reusable modal shell plus delegated root handlers instead of duplicated inline overlay handlers and repeated style chunks.
4. The builder, results, and live surfaces now stay unmounted until their owning tab or draft state is active, and the session-selection path now exists explicitly through `window.selectExamSession(...)`.
5. Real weak-laptop/mobile artifacts now cover first-ready, builder open, and manual grading surface open on a seeded live session with one written-response attempt.
6. The route is visually important for staff/exam administration, so future performance changes must preserve the existing exam-console look and workflow.
7. The feature ownership map below now separates the main console surfaces enough to guide a safer split than the original monolith.
8. The deferred builder, admin, attempts, and eager shell now all use delegated `data-exam-*` handlers instead of inline action or field hooks, so the exams feature family no longer sits on the repo-wide inline-handler owner list.
9. The root-entry markup cleanup is now complete for `exams.html`: the hidden nav stubs have unique labels, the shell root margin now lives in `assets/css/exam-studio.css`, and the mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `exams.html` or `assets/js/pages/exams-console.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current exam-console visual language unless a task explicitly changes it.
6. If a task is blocked by shared shell or exam-console coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| EXAMS-01 | Done | 0% | Split `assets/js/pages/exams-console.js` into smaller modules for dashboard, builder, grading, and reporting | The eager runtime is now just the shared shell plus the default template-list view; the builder, admin review/schedule, and admin live/results grading surfaces each live in deferred companion modules. |
| EXAMS-02 | Done | 0% | Replace page-local `transition: all` rules with explicit properties only | Source scan now reports `0` `transition: all` hits in `assets/js/pages/exams-console.js`. |
| EXAMS-03 | Done | 0% | Replace blur-heavy overlay style strings with reusable CSS classes and cheaper visual layers | The share/return overlays now use the shared `.ex2-modal-*` class set, cheaper default blur, and an efficient-tier fallback for the route modal backdrop. |
| EXAMS-04 | Done | 0% | Lazy-create exam editor and analytics panels only when staff actually opens them | `renderWorkspace()` only mounts the active top-level tab branch, `renderTemplateBuilder()` only mounts when `runtime.templateDraft !== null`, and the live/results workspaces only mount after the operator opens those tabs or selects a session. |
| EXAMS-05 | Done | 0% | Verify whether the exams route still needs unrelated shared page modules at parse time | The shell import proof now records the keep/remove verdict for every current shared script plus the export-library CDN trio. |
| EXAMS-06 | Done | 0% | Create a dedicated exams tracker | This file is the dedicated tracker. |
| EXAMS-07 | Done | 0% | Replace repeated overlay style-string creation with one reusable overlay component and CSS class set | `renderExamModalShell()` now owns both share and return overlays, and root-level delegated handlers own close/share/return actions without embedded overlay `onclick` strings. |
| EXAMS-08 | Done | 0% | Add weak-laptop checks for exam dashboard load, builder open, and grading modal open latency | `tools/capture_exams_summary.mjs` now records efficient-desktop/mobile first-ready, builder-open, and manual grading surface open timings on a seeded live session with zero runtime errors. |
| EXAMS-09 | Done | 0% | Build a per-feature ownership map for `assets/js/pages/exams-console.js` before splitting the file | The ownership map below records the main renderers, mutable runtime buckets, and split seams for templates, review, scheduling, live monitoring, results, and export helpers. |

## Feature Ownership Map

| Feature area | Primary renderers / helpers | Main runtime state / actions | Split notes |
| --- | --- | --- | --- |
| Shared shell and boot | `renderHero()`, `renderTabBar()`, `renderWorkspace()`, `renderConsole()`, `renderExamsPageShellContext()`, `renderAdminExamSection()` | `runtime.activeTab`, `runtime.staffSubTab`, top-level faculty/role shell context | Keep thin and feature-agnostic during later splits. |
| Template library | `getTemplates()`, `getFilteredTemplates()`, `renderTemplateList()` | `runtime.templateSearch`, `runtime.templateFilter`, `runtime.staffSubTab` | Natural top-level split with low coupling to live/results tabs. |
| Template builder | `renderTemplateBuilder()`, `renderStepDetails()`, `renderStepQuestions()`, `renderStepVariants()`, `renderStepReview()`, `renderQuestionEditor()` | `runtime.templateDraft`, `runtime.templateStep`, `runtime.currentBankPage`, `runtime.autoGenVariantCount`, `runtime.autoGenQuestionsPerVariant` | Largest editor workflow; should probably split first after ownership map. |
| Sharing / review workflow | `renderShareModal()`, `renderReviewTab()`, `renderReturnModal()` | `runtime.showShareModal`, `runtime.shareSearchQuery`, `runtime.showReturnModal`, `runtime.returnTemplateId`, `runtime.returnNote` | Modal-heavy surface that can move out of the main builder module. |
| Schedule / cohort builder | `renderScheduleBoard()`, `renderCohortCard()`, `renderSessionBoardCard()` | `runtime.scheduleDraft`, `runtime.splitStudentCount`, `runtime.splitRoomLabel`, `runtime.splitTimeSlot` | Separate admin scheduling surface with room/capacity state. |
| Live monitoring | `loadAttemptsForSession()`, `renderLiveTab()`, `renderAttemptRows()` | `runtime.selectedSessionId`, `runtime.attemptsBySessionId` | Server/attempt-driven and mostly isolated from template editing. |
| Results / manual grading | `renderResultsTab()`, `renderManualGradeCell()` | `runtime.selectedSessionId`, `runtime.manualScoreDrafts` | Strong candidate for its own grading module after live-tab separation. |
| Export / preview helpers | `exportQuizAs()`, `exportQuizById()`, `previewStudentExamPortal()`, `createLocalExamTestSession()` | Depends on current template/session selection and external export libs | Can likely become a thin helper module shared by builder/review. |
| Window mutation API | `window.setExamTab`, `window.setExamTemplateSearch`, `window.beginExamTemplateCreation`, `window.updateExamScheduleField`, `window.refreshExamAttempts`, `window.saveExamManualGrade`, `window.publishExamSession`, etc. | Mutates the runtime store and re-renders | Later splits should reduce this flat global API surface into feature-owned controllers. |

## Import Verdicts

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | `exams.html` is a standalone page and still primes the shell before the deferred stack. |
| `assets/js/app/app.js` | Keep | The mobile shell in `exams.html` still calls `window.toggleMessaging()` and `window.toggleNotifications()`, and `app.js` provides those compatibility hooks. |
| `assets/js/app/api.js` | Keep | `assets/js/pages/exams-console.js` still calls `fetchProtectedQuizAttempts()`, `performProtectedQuizStudentAction()`, and `saveProtectedQuizManualGrade()`, which are API-layer helpers. |
| `assets/js/app/auth.js` | Keep | Inference from source: the standalone route still depends on authenticated user bootstrap before role-gated exam actions can succeed. |
| `assets/js/data/initial-state.js` | Keep | `exams-console.js` still reads `KIU_STATE` and `KIU_EMPTY_STATE` when resolving templates, sessions, subjects, and faculty labels. |
| `assets/js/app/state.js` | Keep | `exams-console.js` still uses `getCurrentUser()`, `getEffectiveUserRole()`, and `getCurrentFaculty()` throughout the runtime. |
| `assets/js/shared/utilities.js` | Keep | The route still depends on `saveState()` and shared shell/theme utility behavior. |
| `assets/js/shared/faculty.js` | Keep | `exams-console.js` still relies on faculty labeling/current-faculty context, and this pass did not prove the faculty shell can boot safely without it. |
| `assets/js/shared/messenger.js` | Remove | Removed from `exams.html`; the route no longer needs it on parse, and the shell still passes the regression check without it. |
| `assets/js/features/navigation.js` | Keep | The mobile shell still calls `window.navigate()`, and route actions in `renderExamsPageShellContext()` still navigate between standalone pages. |
| `assets/js/features/ui.js` | Keep for shared shell | No direct exams-runtime symbol was proven in this pass, but the standalone route still boots the shared shell utility layer and this pass did not prove safe removal. |
| `assets/js/features/index-luxury.js` | Keep | The page still depends on the shared shell token pipeline and shell affordances. |
| `assets/js/pages/exams-console.js` | Keep | Dedicated runtime for templates, review, scheduling, live monitoring, results, and export flows. |
| `assets/js/pages/exams-console-builder.js` | Defer | The quiz builder now lazy-loads from this companion file when a draft is opened or a template is edited. |
| `assets/js/pages/exams-console-attempts.js` | Defer | The admin-only live/results grading surface now lazy-loads from this companion file when `live` or `results` opens. |
| `assets/js/pages/exams-console-admin.js` | Defer | The admin-only review and schedule surfaces now lazy-load from this companion file when `review` or `schedule` opens. |
| `jspdf` CDN | Keep | `exportQuizAs()` / `exportQuizById()` still use `window.jspdf` / `window.jsPDF` for PDF export. |
| `docx` CDN | Keep | `exportQuizAs()` / `exportQuizById()` still use `window.docx` for DOCX export. |
| `file-saver` CDN | Keep | The DOCX export path still depends on the file-save helper loaded with the page. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `exams.html`, `test/exams-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-05`, `EXAMS-06`, `GLOBAL-11` | Removed the dead `social-hub.js` / `social-render.js` / `social-media.js` imports from the shell, replaced the mobile-shell `setInterval` navigate wait with the direct `ensureNavigateHooks()` path, verified the result with `npx vitest run test/exams-route-regressions.test.js`, and captured the new baseline: `14,216` bytes, `16` external scripts, `0` inline handlers, `0` shell `setInterval(` hits, and `0` dead social-helper imports. |
| `2026-05-15` | `assets/js/pages/exams-console.js`, `test/exams-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-02` | Replaced the last `transition: all` rule with explicit transition properties, `node --check assets/js/pages/exams-console.js` passed, `npx vitest run test/exams-route-regressions.test.js` stayed green, and direct source metrics now show `0` `transition: all` hits with `9` remaining `backdrop-filter: blur` hits. |
| `2026-05-15` | `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-09` | Direct source inspection of `assets/js/pages/exams-console.js` now maps the shell dispatch path, template library/builder, sharing/review flow, schedule/cohort builder, live monitoring, results/manual grading, and export helpers to explicit renderer/mutator groups before any module split starts. |
| `2026-05-15` | `exams.html`, `test/exams-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-05` | Removed the now-unproven `messenger.js` shell import from `exams.html`; `npx vitest run test/exams-route-regressions.test.js` stayed green; and direct source metrics now show `15` external scripts with no dead social-helper or messenger shell imports. |
| `2026-05-15` | `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-05` | Completed the exams-shell import proof by mapping each remaining shared shell script and each export-library CDN to concrete source usage or explicit keep/remove rationale. |
| `2026-05-16` | `assets/js/pages/exams-console.js`, `test/exams-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-03`, `EXAMS-07` | Added `renderExamModalShell()`, moved the share/return overlays onto reusable `.ex2-modal-*` CSS classes with lower-cost blur plus an efficient-tier modal fallback, replaced the modal close/share/return inline handlers with delegated root `data-exam-action` / `data-exam-input` handling, `node --check assets/js/pages/exams-console.js` passed, `npx vitest run test/exams-route-regressions.test.js` passed at `1/1`, and direct source scans now show `data-exam-input=\"share-search\"`, `data-exam-input=\"return-note\"`, `close-share-modal`, `close-return-modal`, and no remaining `onclick=\"if(event.target===this)closeShareModal()\"` or `onclick=\"if(event.target===this)closeReturnModal()\"` strings. |
| `2026-05-16` | `assets/js/pages/exams-console.js`, `test/exams-route-regressions.test.js`, `tools/capture_exams_summary.mjs`, `artifacts/exams-efficient-desktop-summary.json`, `artifacts/exams-mobile-summary.json`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-04`, `EXAMS-08` | Added `window.selectExamSession(...)`, initialized `MANUAL_TYPES` with the live written-response types, expanded the route regression to lock the active-tab/draft-gated workspace mounting contract, and added a seeded Playwright exams probe; `node --check assets/js/pages/exams-console.js` and `node --check tools/capture_exams_summary.mjs` passed, `npx vitest run test/exams-route-regressions.test.js` passed at `1/1`, `artifacts/exams-efficient-desktop-summary.json` now records `firstReadyMs: 1575`, `builderOpenMs: 173`, `gradingOpenMs: 184`, `performanceTier: efficient`, `manualGradeVisible: true`, and zero errors, and `artifacts/exams-mobile-summary.json` now records `firstReadyMs: 651`, `builderOpenMs: 29`, `gradingOpenMs: 45`, `mobileNavVisible: true`, `manualGradeVisible: true`, and zero errors. |
| `2026-05-16` | `assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-attempts.js`, `test/exams-route-regressions.test.js`, `artifacts/exams-efficient-desktop-summary.json`, `artifacts/exams-mobile-summary.json`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-01` | Moved the admin-only live/results grading surface into deferred `assets/js/pages/exams-console-attempts.js`, added `EXAMS_ATTEMPTS_MODULE_URL` / `ensureExamsAttemptsModule()` plus the shared hook bridge in the eager runtime, kept the deferred module off the HTML import list, `node --check assets/js/pages/exams-console.js` and `assets/js/pages/exams-console-attempts.js` passed, `npx vitest run test/exams-route-regressions.test.js` stayed green at `1/1`, `assets/js/pages/exams-console.js` dropped to `211,273 bytes`, and the refreshed browser artifacts still passed with zero errors. |
| `2026-05-16` | `assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, `tools/capture_exams_summary.mjs`, `test/exams-route-regressions.test.js`, `artifacts/exams-efficient-desktop-summary.json`, `artifacts/exams-mobile-summary.json`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-01` | Moved the quiz builder render surface into deferred `assets/js/pages/exams-console-builder.js`, added `EXAMS_BUILDER_MODULE_URL` / `ensureExamsBuilderModule()` plus the shared hook bridge in the eager runtime, kept the deferred builder file off the HTML import list, `node --check assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, and `tools/capture_exams_summary.mjs` passed, `npx vitest run test/exams-route-regressions.test.js` stayed green at `1/1`, `assets/js/pages/exams-console.js` dropped again to `194,282 bytes`, and the refreshed exams artifacts still passed with zero runtime errors (`firstReadyMs: 1722`, `builderOpenMs: 148`, `gradingOpenMs: 757` on efficient desktop; `firstReadyMs: 651`, `builderOpenMs: 10`, `gradingOpenMs: 68` on mobile). |
| `2026-05-16` | `assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-admin.js`, `test/exams-route-regressions.test.js`, `tools/capture_exams_summary.mjs`, `artifacts/exams-efficient-desktop-summary.json`, `artifacts/exams-mobile-summary.json`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-01` | Moved the admin-only review/schedule surface into deferred `assets/js/pages/exams-console-admin.js`, added `EXAMS_ADMIN_MODULE_URL` / `ensureExamsAdminModule()` plus the shared hook bridge in the eager runtime, kept the deferred admin file off the HTML import list, `node --check assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-admin.js`, and `tools/capture_exams_summary.mjs` passed, `npx vitest run test/exams-route-regressions.test.js` stayed green at `1/1`, `assets/js/pages/exams-console.js` dropped again to `179,773 bytes`, and the refreshed exams artifacts still passed with zero runtime errors (`firstReadyMs: 2213`, `builderOpenMs: 42`, `gradingOpenMs: 375` on efficient desktop; `firstReadyMs: 762`, `builderOpenMs: 22`, `gradingOpenMs: 42` on mobile). |
| `2026-05-17` | `assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, `assets/js/pages/exams-console-admin.js`, `assets/js/pages/exams-console-attempts.js`, `test/exams-delegation-regressions.test.js`, `test/exams-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAMS-03`, `EXAMS-07` | Added a generic delegated exam call/change/input path in `exams-console.js`, then replaced the remaining inline action and field hooks across the eager shell, deferred builder, deferred admin, and deferred attempts modules with delegated `data-exam-call`, `data-exam-input-call`, and `data-exam-change-call` controls; `node --check assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, `assets/js/pages/exams-console-admin.js`, and `assets/js/pages/exams-console-attempts.js` passed; `npx vitest run test/exams-delegation-regressions.test.js test/exams-route-regressions.test.js` passed `2/2`; and direct source scans now report `0` inline handler attributes across all four exams runtime files. |
| `2026-05-18` | `exams.html`, `assets/css/exam-studio.css`, `test/exams-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `EXAMS-05` | Added unique labels to the hidden nav stubs, moved the shell root margin onto `.exams-shell-root` in `assets/css/exam-studio.css`, and normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` dropped `exams.html` from `18` to `0`, and `npx vitest run test/exams-route-regressions.test.js` passed `1/1` file and `1/1` test. |

## Next Safe Pass

1. No exams-specific cleanup tasks remain open.
2. If this route changes again, re-run `test/exams-route-regressions.test.js` and `tools/capture_exams_summary.mjs`.
3. Keep future changes inside the deferred companion modules instead of regrowing the eager shell.
