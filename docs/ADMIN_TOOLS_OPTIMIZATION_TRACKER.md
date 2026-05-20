# Admin Tools Optimization Tracker

Target page: `admin-tools.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the admin tools route usable while trimming startup debt, handler debt, and standalone-artifact drift without breaking curriculum or registration workflows.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `admin-tools.html` | `30,412 bytes` after the route-owned admin-tools bundle split |
| External scripts | `16` | Current shell inventory from `admin-tools.html` |
| Inline scripts | `2` | Page-owned route guard/bootstrap script and mobile shell script |
| Page script imports | `3` | `registration.js`, `admin-registration.js`, `planner.js` |
| Static inline handlers | `0` | Source scan after modal delegation |
| `setInterval(` hits | `0` | Source scan after replacing the startup polling waits with one-shot hooks |
| Dedicated route CSS | `assets/css/admin-tools-luxury.css` | Current route-local admin tools stylesheet |
| Route-access verification | `admin` stays on `admin-tools.html`; `student` is redirected to `index.html?view=student#home` | Headless local-server Playwright check |
| Shared verification | `admin-tools-route-regressions.test.js` passes | Route-scoped CSS and startup guardrail coverage |

## Current Findings

1. The old root standalone artifacts no longer sit on the live web surface.
2. The shell no longer pays for `lms.js`, but it still legitimately needs the registration stack.
3. The admin route now rechecks access during boot, so stale direct URLs do not leave non-admin users on a broken standalone shell.
4. Static modal-close markup, the admin-tools workspace template hooks, the curriculum-library pane hooks, the active admin-registration `prog` / `free` / `conc` / `minor` controls, and the planner-owned admin-tools actions are delegated now; no admin-tools-specific cleanup tasks remain open in this tracker.
5. Route-local luxury styling is now scoped to `lux-route-admin-tools`, has no `transition: all` sites left, and ships efficient-tier fallbacks for the heaviest blur/shadow surfaces.
6. Startup is now split across `admin-tools.html`, the smaller shared `assets/js/features/index-luxury.js` shell core, the route-owned `assets/js/features/index-admin-tools.js` bundle, and the registration/planner/admin-registration stack, but the page no longer relies on polling loops to reach the mounted state.
7. Weak-device and mobile scripted QA is now recorded in artifacts, including first-ready, registration-tab switch, and studio/action-sheet open timings; the route-specific inline-handler cleanup is closed, and any remaining handler debt now lives in broader shared files outside this tracker.
8. The admin-tools shell source no longer ships mojibake-heavy comment/header blocks; the route regression now guards the cleaned HTML/CSS source markers.
9. The planner-owned admin-tools runtime is now source-clean again: the last mojibake-heavy transcript labels, weekday labels, scheduler success copy, and section-insight status copy were normalized, and a seeded admin-route browser pass now reports `visibleBroken: false` with zero console/page errors.

## Ownership Map

| Area | Current owner | Notes |
| --- | --- | --- |
| Route entry shell, fallback modals, route guard, mobile sheet | `admin-tools.html` | Still owns page boot glue and mobile shell markup. |
| Admin tools layout mount | `assets/js/features/index-admin-tools.js` | The route-owned admin-tools bundle now owns `renderLuxuryAdminToolsPage()` and related admin-only workspace scaffolding. |
| Curriculum library and subject builder | `assets/js/pages/registration.js` | Owns `renderCurriculumTable()`, subject builder helpers, and prerequisite picker logic. |
| ECTS helper dependency | Removed from admin-tools startup | `admin-registration.js` still defines `updateEctsProgress()`, but that student-only path only runs when `#student-reg-content-container` exists, which the admin tools route never mounts. |
| Registration CMS | `assets/js/pages/admin-registration.js` | Owns `bootAdminRegistrationCms()` and faculty-scoped registration structures. |
| Admin operations dashboard and system-status panes | `assets/js/pages/planner.js` | Owns `onAdminDashboardLoad()`, `renderAdminCurriculumPalette()`, and admin system-ops panels. |
| Route-local presentation | `assets/css/admin-tools-luxury.css` | Route-local styling is now scoped to `lux-route-admin-tools`; future work is startup/perf QA, not selector leakage cleanup. |
| Blocked generated artifact output | `tools/build_admin_tools_standalone.py` | Generates only to `artifacts/generated/admin-tools/`; not a live route. |

## AI Update Rules

1. Update this file in the same turn as every change to `admin-tools.html`, `assets/css/admin-tools-luxury.css`, or any admin-tools-specific runtime behavior.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct source inspection, targeted command output, or route verification.
5. Keep standalone-artifact ownership work separate from live-page performance work.
6. If a task is blocked by shared-shell coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| ADMT-01 | Done | 0% | Prove which imported page runtimes are truly required for admin tools and remove every unused eager import from the page entry | `lms.js` is removed; the registration stack remains required. |
| ADMT-02 | Done | 0% | Create a dedicated optimization tracker for `admin-tools.html` because the page is now important enough to deserve page-specific progress history | This file is the dedicated tracker. |
| ADMT-03 | Done | 0% | Audit `assets/css/admin-tools-luxury.css` for heavy blur, stacked shadows, and non-admin selectors that can move back into shared CSS or be deleted | Broad selector leakage is removed, `transition: all` is gone, and efficient-tier fallbacks now cover the repeated blur/shadow surfaces. |
| ADMT-04 | Done | 0% | Replace remaining inline handlers and DOM-string UI actions with delegated admin tools controllers | Static modal handlers, the admin-tools workspace template hooks, the curriculum-library pane hooks, the active admin-registration `prog` / `free` / `conc` / `minor` controls, and the planner-owned admin-tools actions are all delegated now; source scan of `admin-registration.js` reports `0` inline event attributes. |
| ADMT-05 | Done | 0% | Decide whether the live page and standalone artifacts should share one source path or whether the standalone output should leave the repo | Standalone output is blocked and moved to artifact-only generation. |
| ADMT-06 | Done | 0% | Add browser perf capture for the real admin tools workflows instead of only checking static load | Captured in `artifacts/admin-tools-efficient-desktop-summary.json` and `artifacts/admin-tools-mobile-summary.json`. |
| ADMT-07 | Done | 0% | Build a keep/remove table for each eager page runtime imported by the admin tools entry page | See the import table below. |
| ADMT-08 | Done | 0% | Split admin tools startup into data bootstrap, chrome render, and tool-panel mount so only the active tool mounts first | The route now uses deterministic one-shot hooks instead of startup polling loops for both the page bootstrap and mobile nav hook path. |
| ADMT-09 | Done | 0% | Add weak-laptop and mobile admin-tools checks for first paint, tool switch, and modal open latency | Recorded in `artifacts/admin-tools-efficient-desktop-summary.json` and `artifacts/admin-tools-mobile-summary.json`. |
| ADMT-10 | Done | 0% | Verify whether any non-admin role can still reach `admin-tools.html` through legacy links, compatibility routes, or stale local state | Direct unauthorized entry now redirects away. |
| ADMT-11 | Done | 0% | Remove mojibake-heavy comment/header noise from the admin-tools shell source | `admin-tools.html` and the shared `assets/css/layout.css` header comments are now source-clean, and `test/admin-tools-route-regressions.test.js` guards the old mojibake marker from returning in the route shell. |

## Import Notes

Current eager page-runtime evidence:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/registration.js` | Keep | `renderLuxuryAdminToolsPage()` calls `renderCurriculumTable()`, `populateAntiReqDropdown()`, and builder helpers owned here. |
| `assets/js/pages/student-registration.js` | Remove | `admin-tools.html` never mounts `#student-reg-content-container`, so the only `admin-registration.js` callsite for `getStudentCompletedEctsThisSemester()` is dead on this route and the shell no longer needs the student registration page pack. |
| `assets/js/pages/admin-registration.js` | Keep | `renderLuxuryAdminToolsPage()` and `onAdminDashboardLoad()` require `bootAdminRegistrationCms()` and faculty-scoped CMS helpers. |
| `assets/js/pages/planner.js` | Keep | The admin tools route still mounts the admin curriculum palette, system-ops dashboard, and admin dashboard load hooks from this file. |
| `assets/js/pages/lms.js` | Removed | The only live need was the QA-card cleanup stub; that is now covered by a tiny fallback in `assets/js/app/app.js`. |

## Verification Notes

1. `node --check assets/js/app/app.js`
2. Local-server HTTP checks confirm:
   `admin-tools.html` => `200`
   `admin-tools-standalone.html` => `404`
   `/artifacts/generated/admin-tools/admin-tools-standalone.html` => `404`
3. Headless route check confirms:
   `student` direct entry redirects to `index.html?view=student#home`
   `admin` stays on `admin-tools.html`

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-17` | `admin-tools.html`, `assets/css/layout.css`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md` | `ADMT-11` | Removed the mojibake-heavy comment/header blocks from the admin-tools shell source and the shared layout header used by the route; `npx vitest run test/admin-tools-route-regressions.test.js` passed; and direct source scans now show `0` remaining mojibake markers in `admin-tools.html`. |
| `2026-05-15` | `tools/build_admin_tools_standalone.py`, `tools/local_dev_server.py`, `infra/nginx/default.conf`, `.dockerignore`, `README.md`, `tools/README.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-05` | The standalone builder now writes only to `artifacts/generated/admin-tools/`, and both the old root filename and `/artifacts/` are blocked from the web servers. |
| `2026-05-15` | `admin-tools.html`, `assets/js/app/app.js`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-01`, `ADMT-07` | `lms.js` is removed from the entry shell; `student-registration.js` remains because `admin-registration.js` still needs `getStudentCompletedEctsThisSemester()`; admin and student headless route checks both pass. |
| `2026-05-15` | `admin-tools.html`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-10` | The route now rechecks `getAllowedPagesForRole()` during boot and redirects unauthorized direct entry to role home. |
| `2026-05-15` | `admin-tools.html`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | The five static modal `onclick` handlers are replaced with one delegated `data-close-modal` listener; admin and student headless route checks still pass. |
| `2026-05-15` | `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-02` | The page now has a dedicated tracker with a baseline, ownership map, task board, import notes, and verification notes. |
| `2026-05-15` | `assets/css/admin-tools-luxury.css`, `test/admin-tools-route-regressions.test.js` | `ADMT-03` | Scoped the route-local CSS to `lux-route-admin-tools`, replaced the remaining `transition: all` sites with property-specific transitions, and added efficient-tier blur/shadow fallbacks; the new admin-tools route regression test passes. |
| `2026-05-15` | `admin-tools.html`, `test/admin-tools-route-regressions.test.js` | `ADMT-08` | Replaced the startup polling loops with deterministic one-shot hooks for the page bootstrap and mobile nav hook path; the admin-tools route regression test passes and a headless student/admin route check still behaves correctly. |
| `2026-05-15` | `assets/js/features/index-luxury.js`, `test/admin-tools-route-regressions.test.js` | `ADMT-04` | Replaced the remaining inline action hooks emitted by `renderLuxuryAdminToolsPage()` with `data-*` attributes plus shell-scoped listeners; the route regression test now guards against the old inline template actions, and the headless student/admin route check still passes. |
| `2026-05-15` | `artifacts/admin-tools-efficient-desktop-summary.json`, `artifacts/admin-tools-mobile-summary.json`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-09` | Captured first-ready, registration-tab switch, and modal/action-sheet open timings for efficient-tier desktop and mobile admin-tools flows with zero page or console errors. |
| `2026-05-15` | `artifacts/admin-tools-efficient-desktop-summary.json`, `artifacts/admin-tools-mobile-summary.json`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-06` | Closed the real-workflow perf capture task using the same artifact runs: efficient-tier desktop and mobile admin-tools timings now exist for startup, tool switch, and studio/action-sheet open. |
| `2026-05-15` | `assets/js/pages/registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | Replaced the curriculum-library pane inline actions in `registration.js` with `data-*` hooks plus local listeners; the admin-tools route regression test now guards the delegated curriculum-library path too. |
| `2026-05-16` | `assets/js/pages/admin-registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | Added `bindAdminRegistrationCmsDelegates()` and moved the active admin-registration `prog` / `free` module actions to delegated `data-admin-reg-*` hooks for add-module, module select, edit/delete module, add subject, and edit/delete submodule; `node --check assets/js/pages/admin-registration.js` passed and `npx vitest run test/admin-tools-route-regressions.test.js` passed. |
| `2026-05-16` | `assets/js/pages/admin-registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | Extended `bindAdminRegistrationCmsDelegates()` across the active concentration/minor admin-registration UI so add-program, program select/delete, add-group, group toggle/edit/delete, and course edit/add-subject actions now use delegated `data-admin-reg-*` hooks; `node --check assets/js/pages/admin-registration.js` passed and `npx vitest run test/admin-tools-route-regressions.test.js` passed again. |
| `2026-05-16` | `assets/js/pages/planner.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | Added `bindAdminToolsPlannerDelegates()` and moved the live admin-tools planner actions onto delegated hooks for curriculum-palette subject selection and system-ops refresh; `node --check assets/js/pages/planner.js` passed and `npx vitest run test/admin-tools-route-regressions.test.js` passed again. |
| `2026-05-16` | `assets/js/pages/admin-registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md` | `ADMT-04` | Removed the dead concentration/minor subject-picker helper block down to a `loadAvailableSubjects()` compatibility stub, so the old `filterAndDisplaySubjects(...)` and `addSelectedSubject(...)` source path no longer ships in the live admin-tools code; `node --check assets/js/pages/admin-registration.js` passed and `npx vitest run test/admin-tools-route-regressions.test.js` passed with new guards against those removed helpers. |
| `2026-05-16` | `assets/js/pages/admin-registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | Removed the last live concentration-pane inline hooks in `renderConcProgramPane()` and verified that `assets/js/pages/admin-registration.js` now reports `0` inline event attributes for the admin-tools-specific route path; `node --check assets/js/pages/admin-registration.js` passed and `npx vitest run test/admin-tools-route-regressions.test.js` passed with the new global inline-handler guard. |
| `2026-05-16` | `assets/js/pages/student-registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-01` | Removed the dead admin quiz/exam studio cluster from `student-registration.js` and kept the import only for `getStudentCompletedEctsThisSemester()` plus the remaining student-side course/ECTS helpers that admin-registration still calls; `node --check assets/js/pages/student-registration.js` passed, `npx vitest run test/admin-tools-route-regressions.test.js` stayed green, and direct source scans now show `student-registration.js` reduced to `99,315` bytes with no inline event attributes. |
| `2026-05-16` | `assets/js/pages/student-registration.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-01` | Rebuilt the shared structured-form overlay in `student-registration.js` with DOM nodes and moved the section picker content off raw HTML injection, so the admin-tools-shared helper file now reports `0` `innerHTML =` / `insertAdjacentHTML(...)` sites while still keeping the admin tools regression green; `node --check assets/js/pages/student-registration.js` passed and `npx vitest run test/admin-tools-route-regressions.test.js` passed again. |
| `2026-05-17` | `admin-tools.html`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-01` | Removed `assets/js/pages/student-registration.js` from `admin-tools.html`; `npx vitest run test/admin-tools-route-regressions.test.js` passed; direct source scans now show `admin-tools.html` loading only `registration.js`, `admin-registration.js`, and `planner.js` as page packs; and the remaining `updateEctsProgress()` helper in `admin-registration.js` is now explicitly documented as dead on this route because `#student-reg-content-container` never exists in `admin-tools.html`. |
| `2026-05-17` | `assets/js/pages/planner.js`, `test/planner-legacy-delegation.test.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-04` | Replaced the remaining legacy inline hooks in `planner.js` with delegated `data-*` controls for study-card grade-detail toggles, scheduler slot/card actions, and broad-calendar navigation/day/add-event actions; `node --check assets/js/pages/planner.js` passed; `npx vitest run test/planner-legacy-delegation.test.js test/admin-tools-route-regressions.test.js` passed `2/2`; and a direct source scan now reports `0` inline handler attributes in `assets/js/pages/planner.js`. |
| `2026-05-17` | `admin-tools.html`, `assets/js/features/index-luxury.js`, `assets/js/features/index-admin-tools.js`, `test/admin-tools-route-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ADMT-01`, `ADMT-08`, `ADMT-10` | Split the admin-tools workspace mount out of the shared `index-luxury.js` shell and into the route-owned `assets/js/features/index-admin-tools.js` bundle; `admin-tools.html` now loads that route bundle directly; `node --check assets/js/features/index-luxury.js` plus `assets/js/features/index-admin-tools.js` passed; `npx vitest run test/admin-tools-route-regressions.test.js` stayed green; and the shared shell no longer carries the admin-tools workspace markup on non-admin routes. |
| `2026-05-18` | `assets/js/pages/planner.js`, `test/planner-legacy-delegation.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md` | `ADMT-04` | Removed the last mojibake-heavy user-facing planner literals still loaded through `admin-tools.html`, including the legacy transcript detail labels, admin timetable weekday labels, scheduler success copy, and section-insight status text; `node --check assets/js/pages/planner.js` passed; `npx vitest run test/planner-legacy-delegation.test.js test/admin-tools-route-regressions.test.js test/registration-route-regressions.test.js` passed `3/3`; and a seeded Playwright admin-tools check with a local admin auth snapshot reported `visibleBroken: false` plus zero console/page errors. |

## Next Safe Pass

1. Closed for now. If `admin-tools.html` changes again, rerun the route regression plus the existing desktop/mobile artifact checks before reopening this tracker.
