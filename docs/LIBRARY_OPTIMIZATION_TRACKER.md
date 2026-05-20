# Library Optimization Tracker

Target page: `library.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the library route lightweight at the shell level while preserving the current picker-driven catalog UX and modal workflow.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `library.html` | `19,333 bytes` after removing the prebuilt hidden modal bodies |
| External scripts | `12` | Shell stack plus extracted page controller |
| Inline handlers | `0` | Shell scan after delegated listeners |
| Inline script blocks | `1` | Mobile shell block only after extracting the library controller |
| Mobile shell polling loops | `0` | Source scan after replacing the old `setInterval` wait |
| Shared verification | `library-route-regressions.test.js` passes | Route shell and shared modal fallback guard |

## Current Findings

1. `library.html` now loads the shared shell stack, one page-owned library controller, and one remaining inline mobile shell block.
2. The dead social helper trio and the eager page-pack imports are removed from the shell.
3. The route no longer carries inline event attributes or the mobile bootstrap poll.
4. The hidden syllabus/program modal surface no longer ships in `library.html`; the route now keeps only the empty overlay shell and relies on shared on-demand modal scaffolds when a fallback modal is actually needed.
5. The first root-entry markup hardening batch is now landed on `library.html`: the hidden nav landmarks have unique labels, the custom Topic/Language/Status picker groups now use neutral `<div>` wrappers instead of invalid `<label>` ownership around custom buttons, and the mobile action-sheet buttons now declare `type="button"` plus `<span class="mob-sheet-icon">`; focused `html-validate` dropped the page from `29` to `8` issues.

## AI Update Rules

1. Update this file in the same turn as every change to `library.html` or any future page-owned library module.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current library browser and modal flow unless a task explicitly changes it.
6. If a task is blocked by shared modal coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| LIB-01 | Done | 0% | Remove unrelated LMS, planner, registration, and directory imports unless library interactions prove they are required | Dead imports and social helpers are removed from the shell. |
| LIB-02 | Done | 0% | Replace the `16` inline handlers with delegated listeners | The shell now uses delegated picker and modal listeners. |
| LIB-03 | Done | 0% | Move any large inline library markup builders out of the HTML file into page-owned controller code | The route controller now lives in `assets/js/pages/library.js`. |
| LIB-04 | Done | 0% | Lazy-load detail drawers, file viewers, and filters only when users open them | Filter panels render on demand and the old hidden syllabus/program modal bodies are removed from the HTML shell. |
| LIB-05 | Done | 0% | Add a dedicated library cleanup tracker | This file is the dedicated tracker. |
| LIB-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See the import table below. |
| LIB-07 | Done | 0% | Replace any whole-page rerender path with smaller updates for filter state, selected item, and file preview | Catalog rows now render through DOM helpers instead of one large HTML string replace. |
| LIB-08 | Done | 0% | Add mobile and weak-laptop checks for list scroll, filter change, and detail open latency | Captured in `artifacts/library-efficient-desktop-summary.json` and `artifacts/library-mobile-summary.json`. |

## Import Notes

Current route-shell evidence:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/gradebook.js` | Removed | `library.html` no longer includes the gradebook page pack. |
| `assets/js/pages/lms.js` | Removed | `library.html` no longer includes the LMS page pack. |
| `assets/js/pages/registration.js` | Removed | `library.html` no longer includes the registration page pack. |
| `assets/js/pages/planner.js` | Removed | `library.html` no longer includes the planner page pack. |
| `assets/js/pages/directories.js` | Removed | `library.html` no longer includes the directories page pack. |
| `assets/js/pages/student-registration.js` | Removed | `library.html` no longer includes the student-registration page pack. |
| `assets/js/pages/admin-registration.js` | Removed | `library-route-regressions.test.js` and source scan confirm the import is gone. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/LIBRARY_OPTIMIZATION_TRACKER.md` | `LIB-05` | Baseline from the master audit and the route shell source. |
| `2026-05-15` | `library.html`, `test/library-route-regressions.test.js` | `LIB-02`, `LIB-06` | Replaced the inline picker/modal wiring with delegated listeners, removed the mobile bootstrap poll, and captured the seven-import keep/remove table; source scan now shows `11` external scripts, `0` inline handlers, and `0` `setInterval(` hits. |
| `2026-05-15` | `library.html`, `assets/js/pages/library.js`, `test/library-route-regressions.test.js` | `LIB-03` | Extracted the inline library controller into `assets/js/pages/library.js`; source scan now shows `12` external scripts, `1` remaining inline script block, `0` inline handlers, and `0` `setInterval(` hits; `node --check assets/js/pages/library.js` and `npx vitest run test/library-route-regressions.test.js` passed. |
| `2026-05-15` | `assets/js/pages/library.js`, `test/library-route-regressions.test.js`, `artifacts/library-efficient-desktop-summary.json`, `artifacts/library-mobile-summary.json` | `LIB-04`, `LIB-07`, `LIB-08` | Picker panels now render on demand, catalog rows render through DOM helpers, and desktop/mobile route artifacts now cover first-ready, filter-change, and modal-open timings with zero errors. |
| `2026-05-15` | `library.html`, `assets/js/pages/library.js`, `assets/js/features/ui.js`, `test/library-route-regressions.test.js` | `LIB-04` | Removed the prebuilt announcement/event/syllabus/program modal bodies from `library.html`, kept only the overlay shell, moved the remaining library fallback modal ownership to shared on-demand scaffolds, and re-ran `node --check assets/js/pages/library.js`, `node --check assets/js/features/ui.js`, and `npx vitest run test/library-route-regressions.test.js`. |
| `2026-05-18` | `library.html`, `test/library-route-regressions.test.js`, `docs/LIBRARY_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `LIB-02` | Added unique labels to the hidden nav stubs, converted the custom Topic/Language/Status picker wrappers from invalid `<label>` containers to neutral `<div>` groups, and normalized the visible mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">`; focused `html-validate` dropped `library.html` from `29` to `8` issues; and `npx vitest run test/library-route-regressions.test.js` stayed green. |

## Next Safe Pass

1. No open library-specific cleanup tasks remain; keep the picker panels lazy and the DOM-helper table path stable if the page changes again.
2. If a future change reintroduces library modals, keep them on-demand in shared scaffolds rather than prebuilding them in `library.html`.
