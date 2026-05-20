# Student Service Optimization Tracker

Target page: `student-service.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep the student-service experience functional while reducing startup cost, trimming dead page-pack imports, and preserving the live queue/account workspace split.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `student-service.html` | `14,027 bytes` after removing the unneeded `assets/js/features/ui.js` shell import |
| Page runtime | `assets/js/pages/student-service.js` | `162,172 bytes` after moving the full service-shell renderer block behind deferred module loaders |
| Deferred QA module | `assets/js/pages/student-service-qa.js` | `12,640 bytes` lazy-loaded only when the Q&A lane is opened |
| Deferred service module | `assets/js/pages/student-service-service.js` | `65,680 bytes` lazy-loaded only when the private service lane or responder lane is opened |
| External scripts | `11` | `10` deferred scripts plus `theme-primer.js` in the head |
| Page runtimes | `1` | Only `assets/js/pages/student-service.js` remains on first load |
| Inline handlers | `0` | Source scan of `student-service.html` |
| Runtime-generated action hooks | `0` | Source scan of `assets/js/pages/student-service.js` now finds `0` `onclick=`, `0` `oninput=`, and `0` `onchange=` sites after delegating the Q&A, ops-strip, and service-workbench action clusters |
| Full-root / string render writes | `0` | Source scan of `assets/js/pages/student-service.js` for `innerHTML =`; the operations strip, page chrome, student Q&A lane, private-ticket lane, responder lane, student private-support hub, and full staff workbench now all use stable shells plus smaller region updates instead of full-root rebuilds. |
| Known split-workspace state | Present | `test/student-service-split-workspace.test.js` verifies the lane split and route wiring |
| Repeated-card `content-visibility` | Present on repeated list cards | `assets/css/index-luxury.css` now applies route-scoped `content-visibility` to ticket, article, home, ops, track, and Q&A card classes |
| Permanent hidden modal/detail DOM | None route-specific | Source scan shows only the shared mobile action sheet in `student-service.html`; the runtime renders one selected ticket/question detail surface at a time instead of prebuilding hidden drawers |
| Mobile shell polling loops | `0` | Source scan after replacing the old `setInterval` navigate wait |
| Browser artifacts | `2` route summaries | `artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json` |

## Current Findings

1. `student-service.html` is now a thinner shared-shell route with only the shared shell stack plus the dedicated page runtime.
2. The page runtime is split enough to have a workspace/lane model, and the HTML shell no longer loads unrelated LMS/registration/directory packs.
3. The shared-shell import proof is now explicit enough to separate true route requirements from unproven shell carryover.
4. The route's large one-shot render debt is now closed at source level: raw `innerHTML =` writes are down to `0`, and every major student-service lane/workspace surface now reuses stable shells with smaller region updates.
5. The current runtime no longer keeps route-specific hidden modal/drawer shells mounted; selected ticket/question detail panes are rendered only for the active selection.
6. The Q&A lane shell renderers are now deferred into `assets/js/pages/student-service-qa.js`, and the full private service-shell renderer block is now deferred into `assets/js/pages/student-service-service.js`, so the main route runtime no longer pays that parse cost until those lanes are actually opened.
7. The current non-goal is redesign: the existing workspace layout should stay visually recognizable while the dependency graph shrinks.

## AI Update Rules

1. Update this file in the same turn as every change to `student-service.html` or `assets/js/pages/student-service.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the existing student-service lane split and visual language unless a task explicitly changes them.
6. If a task is blocked by hidden coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| SSVC-01 | Done | 0% | Remove unrelated LMS, planner, registration, and directory imports from the student-service route | The route shell now loads only the shared shell stack plus `student-service.js`. |
| SSVC-02 | Done | 0% | Split `student-service.js` into inbox, account, and action-specific modules | The eager runtime now holds the shared data/controller layer only, while the Q&A lane shell lazy-loads from `assets/js/pages/student-service-qa.js` and the full private service-shell renderer block lazy-loads from `assets/js/pages/student-service-service.js`. |
| SSVC-03 | Done | 0% | Audit dense account/inbox surfaces for shared shell blur and transparency cost | `assets/css/index-luxury.css` now contains explicit `body[data-lux-performance='efficient'].lux-route-student-service` fallbacks for the repeated workspace, inbox, article, Q&A, and lane-card surfaces in both dark and light mode. |
| SSVC-04 | Done | 0% | Replace large one-shot `innerHTML` render paths with smaller page-owned updates where possible | The operations strip, page chrome, student Q&A lane, private-ticket lane, responder lane, student private-support hub, and full staff workbench now all reuse stable shells with smaller region updates; the raw `innerHTML =` source count is `0`. |
| SSVC-05 | Done | 0% | Add `content-visibility` only where it is safe and test-backed on this route | Route-scoped `content-visibility` still covers repeated article, ticket, home, ops, track, and Q&A cards, and desktop/mobile browser summaries now confirm the repeated surfaces stay interactive after real scrolling and lane/panel switches. |
| SSVC-06 | Done | 0% | Create a dedicated student-service tracker | This file is the dedicated tracker. |
| SSVC-07 | Done | 0% | Build a per-import keep/remove table for the eight eager page runtimes and record exact evidence for each verdict | The current shell import list is now proven one by one below, including the standalone `theme-primer.js` head dependency. |
| SSVC-08 | Done | 0% | Add weak-laptop and mobile checks for inbox scroll, queue open, and action completion latency | Desktop/mobile artifacts now capture first-ready, service-lane open, queue/ticket open, panel-action completion, and real page scroll under seeded support-ticket load. |
| SSVC-09 | Done | 0% | Audit which student-service regions can use on-demand modal creation instead of permanent hidden DOM | No route-specific permanent hidden modal/drawer DOM remains; the only always-available hidden surface is the shared mobile action sheet, and the runtime renders one selected detail pane at a time. |
| SSVC-10 | Done | 0% | Verify whether `student-service` access is intentionally shared across all current role sets or whether some roles only inherited it by drift | Shared access is explicit in `getAllowedPagesForRole()`. |

## Import Notes

Current route-shell evidence:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | `student-service.html` is a standalone page and still applies `lux-light-mode` before the deferred shell stack. |
| `assets/js/app/app.js` | Keep | The inline mobile shell in `student-service.html` still calls `window.toggleMessaging()` and `window.toggleNotifications()`, and `app.js` defines those compatibility hooks. |
| `assets/js/app/api.js` | Keep | `assets/js/pages/student-service.js` still calls `kiuPortalFetch('/api/student-service/bootstrap')` and `studentServiceFetchJson()` still delegates to `kiuPortalFetch(...)`. |
| `assets/js/app/auth.js` | Keep for shared auth bootstrap | Inference from source: the standalone route still depends on authenticated user bootstrap before `getCurrentUser()` and role-gated student-service render paths can succeed. |
| `assets/js/data/initial-state.js` | Keep | `student-service.js` still seeds and normalizes `KIU_STATE.studentServiceArticles`, `studentServiceTickets`, `studentServiceMacros`, `studentServiceQuestions`, and `studentServiceAnswers`. |
| `assets/js/app/state.js` | Keep | `student-service.js` still uses `getCurrentUser()`, `getCurrentUserId()`, and `getEffectiveUserRole()` throughout the runtime. |
| `assets/js/shared/utilities.js` | Keep for route theme/transparency | The route still consumes the shared `--lux-*` token pipeline, and `index-luxury.css` keeps route-scoped student-service glass surfaces that depend on the shared transparency/theme layer. |
| `assets/js/shared/faculty.js` | Keep for shared shell | No direct route-local symbol was proven in this pass, but safe removal remains unproven for the faculty-aware shell. |
| `assets/js/features/navigation.js` | Keep | The inline mobile shell in `student-service.html` still calls `window.navigate(...)`, and route actions inside `student-service.js` still emit `navigate('...')` buttons. |
| `assets/js/features/index-luxury.js` | Keep | The route still depends on shared shell controls such as sidebar handling and studio/role-switch affordances, and the student-service CSS still consumes the shared shell token pipeline. |
| `assets/js/pages/student-service.js` | Keep | Dedicated runtime for the lane chooser, private ticketing, public Q&A, and service-operations workspace. |
| Removed page-pack imports | Removed | `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, `admin-registration.js`, `social-hub.js`, `social-render.js`, `social-media.js`, `messenger.js`, and `assets/js/features/ui.js` no longer appear in `student-service.html`. |

## Surface Notes

| Surface family | Current cost evidence | Follow-up |
| --- | --- | --- |
| Repeated student-service cards | `index-luxury.css` now applies route glass/fade styling plus explicit efficient-tier fallbacks to `.student-service-article-card`, `.student-service-ticket-row`, `.student-service-home-ticket`, `.student-service-home-topic`, `.student-service-ticket-card`, `.student-service-track-card`, `.student-service-ops-ticket`, `.student-service-ops-lane`, `.student-service-qa-card`, and `.student-service-qa-answer-card` | Browser QA is now captured in the new desktop/mobile summaries; remaining work is the actual module split, not more surface-proof gathering. |
| Public Q&A cards | `.student-service-qa-card` and `.student-service-qa-answer-card` now share the same route-scoped repeated-card optimization hook | Keep the current look for now; revisit only after full-root rerender debt is reduced. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md` | `SSVC-06` | Baseline from the master audit and `test/student-service-split-workspace.test.js`. |
| `2026-05-15` | `student-service.html`, `test/student-service-split-workspace.test.js` | `SSVC-01` | Removed unrelated page-pack imports; shell now reports `12` external scripts and `0` inline handlers. |
| `2026-05-15` | `student-service.html`, `test/student-service-split-workspace.test.js` | `GLOBAL-11` | Replaced the inline mobile shell polling wait with direct hook setup; `student-service.html` now reports `0` `setInterval(` hits. |
| `2026-05-15` | `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-10` | Verified the role-access intent from `assets/js/app/state.js#getAllowedPagesForRole()` and `assets/js/features/navigation.js#resolvePortalRouteUrl()`; `student-service` is explicitly present for student, professor, TA, admin, and student-service roles. |
| `2026-05-15` | `student-service.html`, `assets/css/index-luxury.css`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md` | `SSVC-03`, `SSVC-05`, `SSVC-07` | Added route-scoped `content-visibility` guards for repeated student-service cards, finished the per-import keep/remove table with exact shell/runtime evidence, and re-ran `npx vitest run test/student-service-split-workspace.test.js` with `5/5` passing. |
| `2026-05-15` | `assets/js/pages/student-service.js`, `student-service.html`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md` | `SSVC-09` | Audited the current route for permanent hidden modal/detail DOM: the shell only keeps the shared mobile action sheet, and the runtime renders one selected ticket/question detail pane at a time instead of prebuilding hidden drawers or modal trees. |
| `2026-05-15` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Added one delegated interaction layer for the student-service Q&A lane and ops strip, replaced the affected generated inline hooks with `data-*` actions, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` passed `6/6`, and the runtime-generated action-hook count dropped from `92` to `43` while `innerHTML` writes remained at `12`. |
| `2026-05-15` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Extended the same delegated interaction layer across the student-service ticket/article/workbench controls, `node --check assets/js/pages/student-service.js` passed again, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the runtime-generated action-hook count fell from `43` to `0` while `innerHTML` writes remained at `12`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the student-service operations strip into a stable shell with separate head/stats/queue/lane regions, switched the new region updates to `createContextualFragment(...)`-based markup replacement, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count dropped from `12` to `11`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the student-service page chrome into a stable shell with separate hero/switcher/workflow/summary/overview regions, kept `#student-service-page-body` as the lane container, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count dropped again from `11` to `10`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the student Q&A lane into a stable shell with separate ops/composer/feed regions, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count dropped again from `10` to `9`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the private-ticket lane into a stable shell with separate summary/list/detail regions, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count dropped again from `9` to `8`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the responder-only Student Service lane into a stable shell with separate summary/list/detail regions, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count dropped again from `8` to `7`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the student private-support hub into a stable shell with separate find/request/track regions, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count dropped again from `7` to `6`. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-04` | Reworked the staff Q&A feed and the full staff workbench into stable shells, removed the dead legacy `renderStudentServicePageChrome(...)` helper, replaced the remaining lane-chooser and unavailable-state `innerHTML` assignments with `setStudentServiceMarkup(...)`, `node --check assets/js/pages/student-service.js` passed, `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`, and the raw `innerHTML =` source count fell from `6` to `0`. |
| `2026-05-16` | `assets/css/index-luxury.css`, `test/student-service-split-workspace.test.js`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-03`, `SSVC-05` | Added explicit `body[data-lux-performance='efficient'].lux-route-student-service` blur/shadow fallbacks for the repeated workspace, inbox, article, lane, and Q&A surfaces in both dark and light mode; `npx vitest run test/student-service-split-workspace.test.js` passed at `7/7`; and direct source scans now show the efficient-tier selectors for `.student-service-summary-card`, `.student-service-article-card`, `.student-service-ops-ticket`, `.student-service-qa-card`, and `.student-service-qa-answer-card`. |
| `2026-05-16` | `tools/capture_student_service_summary.mjs`, `artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-05`, `SSVC-08` | Added a Playwright student-service probe with stubbed bootstrap data and seeded support tickets; `node --check tools/capture_student_service_summary.mjs` passed; `artifacts/student-service-efficient-desktop-summary.json` records `firstReadyMs: 1610`, `laneOpenMs: 330`, `queueOpenMs: 234`, `actionCompletionMs: 66`, `scrollYAfter: 1400`, `ticketCardCount: 6`, `articleCardCount: 6`, `performanceTier: efficient`, and zero errors; `artifacts/student-service-mobile-summary.json` records `firstReadyMs: 637`, `laneOpenMs: 105`, `queueOpenMs: 29`, `actionCompletionMs: 84`, `scrollYAfter: 1391`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `student-service.html`, `artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-07` | Removed the unneeded `assets/js/features/ui.js` shell import from `student-service.html`; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `7/7`; direct source scans now show `11` external scripts and no `ui.js` import; and the refreshed artifact pair now records `firstReadyMs: 1645`, `laneOpenMs: 378`, `queueOpenMs: 176`, `actionCompletionMs: 187` on efficient desktop plus `firstReadyMs: 695`, `laneOpenMs: 80`, `queueOpenMs: 43`, `actionCompletionMs: 30`, and `mobileNavVisible: true` on mobile, all with zero errors. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `assets/js/pages/student-service-qa.js`, `test/student-service-split-workspace.test.js`, `artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-02` | Moved the Q&A lane shell renderers into a deferred companion file, added the lazy loader in `student-service.js`, kept `student-service-qa.js` off the initial HTML import list, and verified both the lazy Q&A lane load and the existing service-lane artifact probe; `node --check assets/js/pages/student-service.js` and `node --check assets/js/pages/student-service-qa.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `7/7`; `assets/js/pages/student-service.js` dropped to `219,501` bytes; and the refreshed route artifacts still pass with zero errors. |
| `2026-05-16` | `assets/js/pages/student-service.js`, `assets/js/pages/student-service-service.js`, `test/student-service-split-workspace.test.js`, `artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`, `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `SSVC-02` | Moved the student hub, my-tickets, responder lane, and staff workbench/article-editor shell renderers into a second deferred companion file, added the matching lazy loader in `student-service.js`, and kept `student-service-service.js` off the initial HTML import list; `node --check assets/js/pages/student-service.js`, `node --check assets/js/pages/student-service-qa.js`, and `node --check assets/js/pages/student-service-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `7/7`; `assets/js/pages/student-service.js` dropped again to `162,172` bytes; and the refreshed route artifacts still pass with zero errors (`artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`). |

## Next Safe Pass

1. Reuse the new desktop/mobile route probes whenever the service lane, article lane, or repeated card surfaces change again.
2. Keep future feature work on the deferred lane modules instead of growing the eager controller again.
3. Revisit whether any repeated card surfaces can visibly downgrade on weak hardware without harming parity.
