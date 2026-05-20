# Admin Library Optimization Tracker

Target page: `admin-library.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the admin library usable while trimming shell imports, delegated controls, inline-style debt, and visible corruption.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `admin-library.html` | `45,767 bytes` after extracting the route-local style blocks |
| External scripts | `11` | Post-trim shell inventory |
| Inline scripts | `2` | Page-owned admin library logic and mobile shell |
| Inline handlers | `0` | Source scan after delegated listeners |
| Inline style blocks | `0` | Source scan after moving the route CSS into `assets/css/admin-library-route.css` |
| Mobile shell polling loops | `0` | Source scan after replacing the old `setInterval` wait |
| Mojibake markers | `0` | Source scan after comment cleanup |
| Shared verification | `admin-library-route-regressions.test.js` passes | Route regression guard still passes after the CSS extraction |
| Browser artifacts | `2` route summaries | `artifacts/admin-library-efficient-desktop-summary.json`, `artifacts/admin-library-mobile-summary.json` |

## Current Findings

1. `admin-library.html` now loads only the shared shell stack plus two inline script blocks.
2. The dead shared page-pack imports and messenger import are removed from the shell.
3. Shell actions now use `data-*` hooks and delegated listeners instead of inline attributes.
4. The large route-local style surface now lives in `assets/css/admin-library-route.css` instead of inline `<style>` blocks.
5. Hidden parameter-chip modal content now stays empty until the modal opens.
6. Real desktop/mobile QA artifacts now exist for table-ready, catalog-filter, and parameter-modal open latency on seeded admin-library data.
7. No open admin-library cleanup tasks remain in this tracker; future passes should rerun regression and visual QA only when the route changes again.
8. The first root-entry markup hardening batch is now landed on `admin-library.html`: the hidden nav landmarks have unique labels, the picker-style Topic/Language/Status groups now use neutral `<div>` wrappers instead of invalid `<label>` ownership around custom buttons, and the mobile action-sheet buttons now declare `type="button"` plus `<span class="mob-sheet-icon">`; focused `html-validate` dropped the page from `29` to `8` issues.

## AI Update Rules

1. Update this file in the same turn as every change to `admin-library.html` or any future page-owned admin-library module.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current admin library workflow unless a task explicitly changes it.
6. If a task is blocked by shell coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| ALIB-01 | Done | 0% | Remove unrelated LMS, planner, registration, and student-registration imports unless the admin library route proves they are required | Dead imports and messenger are removed from the shell. |
| ALIB-02 | Done | 0% | Replace the `16` inline handlers with delegated listeners and page-local controller functions | The shell now uses delegated picker, modal, and action listeners. |
| ALIB-03 | Done | 0% | Move large inline styling into route CSS so the admin library page stops carrying view logic and theme rules in the HTML file | Extracted to `assets/css/admin-library-route.css`. |
| ALIB-04 | Done | 0% | Audit modal and table rendering so only the active admin library region mounts at load | Hidden parameter-chip modal content now renders on demand instead of at startup. |
| ALIB-05 | Done | 0% | Add an admin-library-specific perf and regression tracker | This file is the dedicated tracker. |
| ALIB-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See the import table below. |
| ALIB-07 | Done | 0% | Replace large HTML-string table and modal rendering with page-owned render helpers that can update smaller regions | Table rows and parameter-chip groups now render through DOM helpers instead of large string templates. |
| ALIB-08 | Done | 0% | Audit repeated admin table shadows and blur surfaces inside the route and downgrade repeated card effects on weak-device mode | Efficient-tier CSS now softens the repeated table, modal, and surface shadows/blur. |

## Import Notes

Current route-shell evidence:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | Shared shell theme primer. |
| `assets/js/app/app.js` | Keep | Shared shell bootstrap. |
| `assets/js/app/api.js` | Keep | Shared auth/API layer. |
| `assets/js/app/auth.js` | Keep | Portal auth state. |
| `assets/js/data/initial-state.js` | Keep | Shared state bootstrap. |
| `assets/js/app/state.js` | Keep | Shared state and role wiring. |
| `assets/js/shared/utilities.js` | Keep | Theme/transparency helpers. |
| `assets/js/shared/faculty.js` | Keep | Faculty label/theme helpers. |
| `assets/js/features/navigation.js` | Keep | Route navigation and role routing. |
| `assets/js/features/ui.js` | Keep | Shared shell UI helpers. |
| `assets/js/features/index-luxury.js` | Keep | Shared shell theme pipeline. |
| `assets/css/admin-library-route.css` | Keep | Route-owned admin library layout and modal/table styling extracted from the HTML shell. |
| `assets/js/shared/messenger.js` | Removed | Not needed for the admin library shell after source inspection. |
| Removed page-pack imports | Removed | `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, `admin-registration.js` no longer appear in the route shell. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md` | `ALIB-05` | Baseline from the master audit and the route shell source. |
| `2026-05-15` | `admin-library.html`, `test/admin-library-route-regressions.test.js` | `ALIB-01`, `ALIB-02`, `ALIB-06` | Removed dead imports, replaced inline shell actions with delegated listeners, cleaned the corrupted comments, and captured the seven-import keep/remove table; source scan now shows `11` external scripts, `0` inline handlers, `0` `setInterval(` hits, and `0` mojibake markers. |
| `2026-05-15` | `admin-library.html`, `assets/css/admin-library-route.css` | `ALIB-03` | Moved both route-local `<style>` blocks into a dedicated stylesheet; `admin-library.html` now reports `45,767 bytes`, `0` `<style>` tags, `1` `admin-library-route.css` link, and the admin-library regression test still passes. |
| `2026-05-15` | `admin-library.html` | `ALIB-04` | Split the startup render path so hidden parameter-chip modal groups stay empty until the modal opens; the route regression test still passes, and a headless check confirmed `0/0/0` parameter-group children before open and populated groups after the open action. |
| `2026-05-15` | `admin-library.html`, `test/admin-library-route-regressions.test.js` | `ALIB-07` | Replaced the large table-row and parameter-chip string templates with DOM helper functions; the route regression test now checks the new helper path instead of the old static template. |
| `2026-05-15` | `assets/css/admin-library-route.css`, `test/admin-library-route-regressions.test.js` | `ALIB-08` | Added efficient-tier shadow/blur fallbacks for repeated admin-library surfaces and pinned the selectors in the route regression test. |
| `2026-05-16` | `tools/capture_admin_library_summary.mjs`, `artifacts/admin-library-efficient-desktop-summary.json`, `artifacts/admin-library-mobile-summary.json`, `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ALIB-05` | Added a seeded Playwright admin-library probe for table-ready, catalog-filter, and parameter-modal interactions; `node --check tools/capture_admin_library_summary.mjs` passed; `artifacts/admin-library-efficient-desktop-summary.json` now records `firstReadyMs: 3217`, `filterMs: 149`, `modalOpenMs: 416`, `rowCount: 1`, and zero errors; and `artifacts/admin-library-mobile-summary.json` now records `firstReadyMs: 793`, `filterMs: 90`, `modalOpenMs: 83`, `rowCount: 1`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-18` | `admin-library.html`, `test/admin-library-route-regressions.test.js`, `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `ALIB-02` | Added unique labels to the hidden nav stubs, converted the custom Topic/Language/Status picker wrappers from invalid `<label>` containers to neutral `<div>` groups, and normalized the visible mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">`; focused `html-validate` dropped `admin-library.html` from `29` to `8` issues; and `npx vitest run test/admin-library-route-regressions.test.js` stayed green. |

## Next Safe Pass

1. Closed for now. If `admin-library.html` changes again, rerun the route regression test plus a visual parity check on desktop, mobile, and efficient-tier performance mode.
