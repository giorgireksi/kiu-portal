# Chancellery Optimization Tracker

Target page: `chancellery.html`
Last updated: `2026-05-17`
Owner: `Codex`
Goal: keep the chancellery route professional and functional while trimming dead helper imports and documenting the dedicated route-owned behavior that now lives in `chancellery.js`.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `chancellery.html` | `15,004 bytes` after switching to the dedicated page runtime |
| External scripts | `13` | Post-trim script inventory in the shell |
| Page runtimes | `1` | `chancellery.js` remains the only page-runtime import |
| Inline handlers | `0` | Shell scan and `0` remaining inline handler attributes in `assets/js/pages/chancellery.js` after the delegated route-controller pass |
| Mobile shell polling loops | `0` | Source scan after replacing the inline `setInterval` wait |
| Route owner note | `assets/js/pages/chancellery.js` owns the standalone chancellery workflow | Source scan shows `renderChancelleryPage()` and related helpers live there |

## Current Findings

1. `chancellery.html` is still a shared-shell route, but the dead social helper trio and the unrelated page-pack imports are now removed from the shell.
2. The mobile shell no longer polls for navigation readiness.
3. The standalone route now loads its own `assets/js/pages/chancellery.js` runtime instead of piggybacking on `registration.js`.
4. The standalone route now uses delegated `data-chancellery-*` controls for case selection, student request submit, staff filters, status changes, reply send, and student/staff tab switches, leaving `0` route-local inline handler attributes in `assets/js/pages/chancellery.js`.
5. No open chancellery cleanup tasks remain in this tracker; future passes should rerun route regression and mobile verification only when the route changes again.

## AI Update Rules

1. Update this file in the same turn as every change to `chancellery.html` or the chancellery-related helpers in `assets/js/pages/registration.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current chancellery workflow and user-facing copy unless a task explicitly changes it.
6. If a task is blocked by registration coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| CHAN-01 | Done | 0% | Remove unrelated LMS, planner, gradebook, directories, and admin-registration imports unless the chancellery route proves they are required | Only `registration.js` remains as a page-runtime import. |
| CHAN-02 | Done | 0% | Extract chancellery-only logic into a dedicated page runtime instead of piggybacking on the generic shell pack | `chancellery.html` now loads `assets/js/pages/chancellery.js` instead of `registration.js`. |
| CHAN-03 | Done | 0% | Lazy-mount submission history, request detail panes, and attachment UI instead of building them all on load | Only the selected case renders its detail/thread pane; inactive case detail panes are not prebuilt. |
| CHAN-04 | Done | 0% | Audit shared shell transparency and blur cost on chancellery panels | Efficient-tier fallbacks now soften the repeated hero, card, queue-item, and thread-entry surfaces. |
| CHAN-05 | Done | 0% | Add a page tracker for request submit, review, and history flows | This file now serves as the dedicated workflow tracker. |
| CHAN-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See the import table below. |
| CHAN-07 | Done | 0% | Replace any full-detail-pane rerender paths with smaller updates for status, reply, and history changes | The route now keeps a stable shell and refreshes hero/content regions instead of replacing `#page-chancellery` wholesale. |
| CHAN-08 | Done | 0% | Add mobile route verification for request list scroll and detail open behavior after import trimming | Verified in `artifacts/chancellery-mobile-summary.json`. |
| CHAN-09 | Done | 0% | Create a dedicated chancellery tracker | This file is the dedicated tracker. |

## Import Notes

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | Shared shell theme primer. |
| `assets/js/app/app.js` | Keep | Shared shell bootstrap. |
| `assets/js/app/api.js` | Keep | Portal auth/API layer. |
| `assets/js/app/auth.js` | Keep | Portal auth state. |
| `assets/js/data/initial-state.js` | Keep | Shared state bootstrap. |
| `assets/js/app/state.js` | Keep | Shared state and role wiring. |
| `assets/js/shared/utilities.js` | Keep | Shared transparency and shell helpers. |
| `assets/js/shared/faculty.js` | Keep | Faculty labels and shell theme helpers. |
| `assets/js/shared/messenger.js` | Keep | Mobile shell utility actions still call the shared messaging/notification helpers. |
| `assets/js/features/navigation.js` | Keep | Route navigation and role routing. |
| `assets/js/features/ui.js` | Keep | Shared shell UI helpers. |
| `assets/js/features/index-luxury.js` | Keep | Shared shell runtime and page mount helpers. |
| `assets/js/pages/chancellery.js` | Keep | Owns `renderChancelleryPage()` and the standalone chancellery workflow helpers. |
| `assets/js/pages/registration.js` | Removed | The standalone chancellery route no longer loads it after the dedicated runtime extraction. |
| `assets/js/pages/gradebook.js` | Removed | No chancellery render path references after source inspection. |
| `assets/js/pages/lms.js` | Removed | No chancellery render path references after source inspection. |
| `assets/js/pages/planner.js` | Removed | No chancellery render path references after source inspection. |
| `assets/js/pages/directories.js` | Removed | No chancellery render path references after source inspection. |
| `assets/js/pages/student-registration.js` | Removed | No chancellery render path references after source inspection. |
| `assets/js/pages/admin-registration.js` | Removed | No chancellery render path references after source inspection. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md` | `CHAN-09` | Baseline from the master audit and source inspection of `assets/js/pages/registration.js`. |
| `2026-05-15` | `chancellery.html`, `test/chancellery-route-regressions.test.js` | `CHAN-01` | Removed the dead social helper trio from the shell and replaced the mobile hook wait; shell now reports `19` external scripts, `0` inline handlers, and `0` polling loops. |
| `2026-05-15` | `chancellery.html`, `test/chancellery-route-regressions.test.js`, `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CHAN-01`, `CHAN-05`, `CHAN-06` | Removed the unrelated page-pack imports so `registration.js` is the only remaining page-runtime import; the route regression test now guards the trimmed shell and the import keep/remove table is recorded here. |
| `2026-05-15` | `assets/js/pages/registration.js`, `artifacts/chancellery-mobile-summary.json`, `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CHAN-08` | Gated the registration-only startup hooks behind `#page-registration` so the trimmed chancellery shell no longer throws student-registration helper errors, then captured mobile page-scroll and detail-open verification on a seeded student request list. |
| `2026-05-15` | `assets/css/index-luxury.css`, `test/chancellery-route-regressions.test.js`, `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CHAN-04` | Added efficient-tier shadow/blur fallbacks for chancellery hero, focus card, queue item, and thread-entry surfaces using the existing `body[data-lux-performance='efficient']` contract, and pinned the selectors in the route regression test. |
| `2026-05-15` | `assets/js/pages/chancellery.js`, `chancellery.html`, `test/chancellery-route-regressions.test.js`, `artifacts/chancellery-mobile-summary.json` | `CHAN-02` | Extracted the standalone chancellery workflow into `assets/js/pages/chancellery.js`, switched `chancellery.html` off `registration.js`, and revalidated the mobile route on the dedicated runtime with zero errors. |
| `2026-05-15` | `assets/js/pages/chancellery.js`, `test/chancellery-route-regressions.test.js`, `artifacts/chancellery-mobile-summary.json`, `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CHAN-07` | Added a stable chancellery shell with dedicated hero/content regions so route updates no longer replace `#page-chancellery` wholesale; the route regression test and refreshed mobile artifact both passed with zero errors. |
| `2026-05-15` | `assets/js/pages/registration.js`, `artifacts/chancellery-mobile-summary.json`, `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CHAN-03` | Confirmed the route already mounts only the selected request detail/thread pane; the seeded mobile artifact shows a six-item queue with one selected detail case instead of six prebuilt detail panels. |
| `2026-05-17` | `assets/js/pages/chancellery.js`, `test/chancellery-route-regressions.test.js`, `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CHAN-07` | Replaced the remaining route-local inline `onclick`/`onchange` hooks with delegated `data-chancellery-*` controls for case select, tab switch, request submit, filter changes, status changes, and staff reply actions; `node --check assets/js/pages/chancellery.js` passed; `npx vitest run test/chancellery-route-regressions.test.js` passed `1/1`; and a source scan now reports `0` inline handler attributes in `assets/js/pages/chancellery.js`. |

## Next Safe Pass

1. Closed for now. If `chancellery.html` changes again, rerun the route regression test and refresh `artifacts/chancellery-mobile-summary.json`.
