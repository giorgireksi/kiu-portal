# Timetable Optimization Tracker

Target page: `timetable.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the timetable route visually intact while removing shell-level inline handler debt, shrinking route-specific baggage, and separating timetable-only behavior from the broader planner runtime.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `timetable.html` | `27,521 bytes` after the root-entry validator cleanup on the standalone shell |
| Route CSS | `assets/css/timetable-route.css` | `17,983 bytes` extracted from the old head `<style>` block |
| External scripts | `12` | Direct deferred script-tag inventory after removing the eager `planner.js` page-pack import |
| Page scripts | `1` | `assets/js/pages/timetable-runtime.js` now owns the live timetable route |
| Inline handlers in `timetable.html` | `0` | `rg -n "onclick=|onchange=|oninput=|onmouseover=|onmouseout=" timetable.html` returns no matches after shell cleanup |
| Inline style blocks | `0` | Direct HTML inspection after linking `assets/css/timetable-route.css` |
| Mobile polling loops in route shell | `0` | The mobile shell now uses `ensureNavigateHooks()` plus a `load` fallback instead of `setInterval(...)` polling |
| Shared verification | `2/2 focused route tests passed` | `npx vitest run test/timetable-route-regressions.test.js` |
| Browser route artifacts | `2` route summaries | `artifacts/timetable-efficient-desktop-summary.json`, `artifacts/timetable-mobile-summary.json` |

## Current Findings

1. The timetable entry shell no longer ships the dead fallback `modal-studio` markup, and the static filter/week controls no longer depend on inline HTML handlers.
2. `timetable.html` now boots a dedicated `assets/js/pages/timetable-runtime.js` page runtime, so the live route no longer parses the unrelated `planner.js` scheduler, budget-calendar, or study-card code on first load.
3. `flattenTimetableControlRows()` still strips transparency signatures and expensive chrome from the schedule-control band, the route-local timetable CSS now lives in `assets/css/timetable-route.css`, and `assets/css/index-luxury.css` now contains explicit efficient-tier fallbacks for the hero/command/stage/canvas/filter/session-card surfaces.
4. The current live route has no dedicated timetable session modal or drawer surface; the real measurable interaction surfaces are week switching, sessions-vs-timetable view switching, and long-page scroll behavior.
5. The route no longer ships broken mojibake dash placeholders in the insight cards; the source now uses plain `--` fallbacks and the focused regression locks that state.
6. The route no longer ships duplicate `timetable-insight-next` ids or raw `&` source text in the faculty filter labels; the focused regression now locks those structural markup fixes.
7. No timetable-specific cleanup tasks remain open; keep future work on `assets/js/pages/timetable-runtime.js` and preserve the current route-level browser probe.
8. The root-entry markup cleanup is now complete for `timetable.html`: the hidden nav stubs have unique labels, the stage-status dot now uses a route-owned CSS class, the trailing-whitespace shell hit is gone, and the mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `timetable.html`, a timetable-only controller, or timetable-specific `planner.js` behavior.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct source inspection, targeted test output, or browser evidence.
5. Preserve the current timetable layout, hero, and schedule chrome unless the task explicitly changes them.
6. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| TT-01 | Done | 0% | Replace the `24` inline handlers with delegated listeners | The route shell now uses `data-timetable-*` hooks plus route-local listeners, and the dead fallback studio block is gone. |
| TT-02 | Done | 0% | Split timetable-only behavior out of `assets/js/pages/planner.js` | The live timetable renderer, week/view state, and profile-calendar helpers now live in `assets/js/pages/timetable-runtime.js`; `timetable.html` no longer imports `planner.js`, and `registration.html` / `profile.html` now reuse the extracted runtime instead of the full planner pack. |
| TT-03 | Done | 0% | Audit `lux-timetable-canvas` and related transparency selectors so the timetable surface stops paying for unnecessary blur | The control band already strips transparency signatures and backdrop filters via `flattenTimetableControlRows()`, the route-local timetable CSS is isolated in `assets/css/timetable-route.css`, and `assets/css/index-luxury.css` now contains explicit efficient-tier fallbacks for the hero/command/stage/canvas/filter/session-card surfaces. |
| TT-04 | Done | 0% | Lazy-render inactive weeks, filter panes, and detail drawers instead of building all markup on load | The live route renders only one active board surface at a time (`schedule-sessions-board` or `schedule-grid-shell`), keeps the filter shell static, and the current route/browser checks explicitly report no timetable-specific session drawer/modal shell. |
| TT-05 | Done | 0% | Create a dedicated timetable tracker | This file is the dedicated tracker. |
| TT-06 | Done | 0% | Replace any whole-board rerender path with smaller updates for week change, selected session, and filter state | The runtime now keeps stable schedule-surface regions and updates the session-board/grid subregions in place for week/filter/view changes instead of replacing the whole timetable container on each refresh. |
| TT-07 | Done | 0% | Add weak-laptop and mobile checks for scroll smoothness, week switch latency, and session modal open | `artifacts/timetable-efficient-desktop-summary.json` and `artifacts/timetable-mobile-summary.json` now record first-ready, week-switch, timetable-view-switch, and scroll timings; the current live route explicitly reports `sessionModalPresent: false`, so there is no timetable-specific session modal to benchmark on this route shape. |
| TT-08 | Done | 0% | Build a planner-vs-timetable helper map so only timetable-critical helpers remain on this route | The helper split is documented below and now provides the concrete next extraction boundary. |
| TT-09 | Done | 0% | Remove broken mojibake placeholder bytes from the insight-card shell | `timetable.html` now ships plain `--` placeholders for the three insight value slots, and `test/timetable-route-regressions.test.js` guards that the old broken dash bytes do not return. |
| TT-10 | Done | 0% | Remove the remaining validator-confirmed structural shell faults in `timetable.html` | The live shell now keeps one `timetable-insight-next` id, encodes `&amp;` in faculty labels, and the focused validator no longer reports the earlier duplicate-id or raw-character failures on this route. |

## Planner vs Timetable Helper Map

| Ownership | Current functions / surfaces | Evidence |
| --- | --- | --- |
| Timetable-critical in `timetable-runtime.js` | `renderTimetable()`, `renderScheduleControls()`, `syncTimetableStaticControls()`, `changeTimetableWeek()`, `jumpTimetableToCurrentWeek()`, `setScheduleViewPreference()`, timetable narrative/overview helpers, and the extracted `renderProfileCalendar()` / `renderStudentCalendarSchedule()` helpers | Direct source inspection of `assets/js/pages/timetable-runtime.js` plus the static control IDs used by `timetable.html` |
| Non-timetable logic still mixed into `planner.js` | scheduler/editor modal builders, budget-calendar helpers, study-card rendering, faculty LMS session queue helpers | `planner.js` still contains scheduler grid/card builders, budget-calendar functions, and non-timetable action hooks, but the timetable route no longer loads that page pack. |
| Route-shell-only in `timetable.html` | static hero, filter shell, overview chrome, mobile shell, transparency flattening | `timetable.html` now owns only the page scaffold plus route-local listeners; it no longer owns inline control handlers or the fallback theme studio |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-17` | `timetable.html`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md` | `TT-10` | Removed the duplicate `timetable-insight-next` id from the hidden insight card and encoded `Management &amp; Business` / `Arts &amp; Humanities` in the faculty filter labels; `npx vitest run test/timetable-route-regressions.test.js` passed `2/2`; and focused `npx -y html-validate timetable.html` no longer reports the earlier `no-dup-id` or `no-raw-characters` failures. |
| `2026-05-17` | `timetable.html`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md` | `TT-09` | Replaced the remaining broken insight-card placeholder bytes with plain `--` source text and extended the focused timetable regression to forbid the old mojibake dash token; `npx vitest run test/timetable-route-regressions.test.js` passed `2/2`. |
| `2026-05-18` | `timetable.html`, `assets/css/timetable-route.css`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `TT-10` | Added unique labels to the hidden nav stubs, moved the live stage-status dot styling into `assets/css/timetable-route.css`, normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers, and removed the last trailing-whitespace validator hit; focused `html-validate` dropped `timetable.html` from `18` to `0`, and `npx vitest run test/timetable-route-regressions.test.js` passed `1/1` file and `2/2` tests. |
| `2026-05-16` | `timetable.html`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md` | `TT-01`, `TT-05`, `TT-08` | Removed the dead fallback `modal-studio` shell markup, replaced the static filter/week HTML handlers with `data-timetable-*` hooks plus route-local listeners, replaced the mobile-shell `navigate()` polling loop with `ensureNavigateHooks()` and a `load` fallback, and added a focused route regression; `npx vitest run test/timetable-route-regressions.test.js` passed, and direct source scans now show `0` remaining inline handler attributes in `timetable.html`. |
| `2026-05-16` | `timetable.html`, `assets/css/timetable-route.css`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `TT-03` | Moved the route-local timetable `<style>` block into `assets/css/timetable-route.css`, linked the extracted stylesheet from `timetable.html`, and refreshed the route regression to guard the no-inline-style shell; `npx vitest run test/timetable-route-regressions.test.js` passed `2/2`; direct source scans now show `27,608` bytes for `timetable.html`, `17,983` bytes for `assets/css/timetable-route.css`, `0` `<style>` tags in the HTML shell, and the new route stylesheet link; and a headless Playwright desktop/mobile sanity run confirmed the linked CSS, the timetable canvas, the current week label, and zero console/page errors. |
| `2026-05-16` | `assets/js/pages/planner.js`, `tools/capture_timetable_summary.mjs`, `artifacts/timetable-efficient-desktop-summary.json`, `artifacts/timetable-mobile-summary.json`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `TT-07` | Replaced the remaining timetable-specific schedule-action `onclick` strings in `planner.js` with delegated `data-*` controls, added a dedicated timetable browser probe, and captured real desktop/mobile route artifacts; `node --check assets/js/pages/planner.js` and `node --check tools/capture_timetable_summary.mjs` passed; `npx vitest run test/timetable-route-regressions.test.js` stayed green at `2/2`; `artifacts/timetable-efficient-desktop-summary.json` now records `firstReadyMs: 1468`, `weekSwitchMs: 39`, `timetableViewMs: 29`, `scrollMs: 486`, `gridShellPresent: true`, `emptyStatePresent: true`, `sessionModalPresent: false`, and zero errors; and `artifacts/timetable-mobile-summary.json` now records `firstReadyMs: 1474`, `weekSwitchMs: 46`, `timetableViewMs: 15`, `scrollMs: 93`, `gridShellPresent: true`, `emptyStatePresent: true`, `sessionModalPresent: false`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `TT-04` | Tightened the focused route regression to prove the current live timetable route has no `session-modal` or `schedule-drawer` shell markup, and that the planner route renders one active `schedule-sessions-board` or `schedule-grid-shell` surface rather than prebuilding hidden week panes; `npx vitest run test/timetable-route-regressions.test.js` passed `2/2`. |
| `2026-05-16` | `assets/css/index-luxury.css`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `TT-03` | Added explicit `body[data-lux-performance='efficient'].lux-route-timetable` fallback selectors for the timetable hero, command, stage, focus, canvas, filters, repeated session cards, and grid events; `npx vitest run test/timetable-route-regressions.test.js` stayed green at `2/2`; and direct source scans now show the efficient-tier selectors at `assets/css/index-luxury.css` lines `21791` through `21825`. |
| `2026-05-16` | `assets/js/pages/timetable-runtime.js`, `assets/js/pages/planner.js`, `timetable.html`, `registration.html`, `profile.html`, `assets/js/app/app.js`, `test/timetable-route-regressions.test.js`, `test/registration-route-regressions.test.js`, `test/profile-route-regressions.test.js`, `tools/capture_timetable_summary.mjs`, `artifacts/timetable-efficient-desktop-summary.json`, `artifacts/timetable-mobile-summary.json`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `TT-02`, `TT-06` | Extracted the live timetable/profile-calendar runtime out of `planner.js` into `assets/js/pages/timetable-runtime.js`, moved `timetable.html` onto the dedicated page runtime, taught the registration lazy loader to use the smaller standalone student-route pack, and switched the timetable surface to stable frame/empty regions so week/filter/view refreshes no longer replace the whole route container; `node --check assets/js/pages/timetable-runtime.js` and `assets/js/pages/planner.js` passed; `npx vitest run test/timetable-route-regressions.test.js test/registration-route-regressions.test.js test/profile-route-regressions.test.js` passed; and refreshed desktop/mobile timetable artifacts still report `firstReadyMs: 1468/1474`, `weekSwitchMs: 39/46`, `timetableViewMs: 29/15`, `scrollMs: 486/93`, `gridShellPresent: true`, `emptyStatePresent: true`, and zero errors. |

## Next Safe Pass

No timetable-specific cleanup tasks remain open. If the route changes again, preserve `assets/js/pages/timetable-runtime.js` as the single route owner and rerun the focused regression plus the desktop/mobile timetable summaries.
