# Faculty Schedule Optimization Tracker

Target page: `faculty-schedule.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep `faculty-schedule.html` as a clean alias to the real faculty timetable workspace instead of maintaining a second drifting standalone shell.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `faculty-schedule.html` | `1,472 bytes` after reducing the route to a redirect wrapper |
| External scripts | `0` | Direct source scan |
| Inline scripts | `1` | Redirect-only `window.location.replace('timetable.html')` |
| Stylesheets | `0` | Direct source scan |
| Redirect target | `timetable.html` | Meta refresh plus inline redirect script |
| Shared verification | `2` wrapper tests passed | `npx vitest run test/faculty-schedule-route-regressions.test.js test/redirect-wrapper-regressions.test.js` |
| Browser verification | `JS-enabled + no-JS checks` | Headless Playwright checks now confirm `faculty-schedule.html -> timetable.html` with a seeded professor session and the no-JS meta refresh fallback |

## Current Findings

1. The old standalone `faculty-schedule.html` shell had drifted into a gradebook-oriented duplicate instead of a timetable-specific route.
2. `timetable.html` is already the real live schedule workspace for professor/TA flows, so keeping a second large faculty-schedule shell only increased maintenance and duplication risk.
3. `faculty-schedule.html` is now a zero-runtime alias to `timetable.html`, matching the existing redirect-wrapper policy already used by `calendar.html` and `gradebook.html`.
4. No open faculty-schedule-specific cleanup tasks remain in this tracker; future work should happen on `timetable.html`.

## AI Update Rules

1. Update this file in the same turn as every change to `faculty-schedule.html`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct source inspection, targeted test output, or browser verification evidence.
5. Preserve the redirect-only contract unless the route is intentionally rebuilt as a distinct live page.
6. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| FSCH-01 | Done | 0% | Remove unrelated route imports and load only the schedule runtime required by this page | The route now loads no shared/page runtime at all. |
| FSCH-02 | Done | 0% | Replace remaining inline handlers with delegated listeners | No interactive shell remains; the wrapper contains only the redirect script. |
| FSCH-03 | Done | 0% | Decide whether faculty schedule should share a lighter timetable-only runtime instead of loading the full LMS and registration pack | Decided and implemented: `faculty-schedule.html` now aliases directly to `timetable.html`. |
| FSCH-04 | Done | 0% | Audit the faculty schedule page for duplicated UI and logic that already exists in `timetable.html` | The duplication audit is resolved by removing the duplicate shell and forwarding to the real timetable route. |
| FSCH-05 | Done | 0% | Add a faculty-schedule tracker and browser QA flow | This file remains the dedicated tracker, and the wrapper now has direct browser redirect checks. |
| FSCH-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | All seven former eager route runtimes are removed because the page is now a wrapper. |
| FSCH-07 | Done | 0% | Split week navigation, session grid, and detail drawer updates so changing week does not rebuild unrelated UI | Ownership moves to `timetable.html`; no standalone faculty-schedule shell remains to split. |
| FSCH-08 | Done | 0% | Add mobile and weak-laptop checks for week change, session open, and faculty filter changes | Wrapper-level JS-enabled/no-JS redirect checks now exist, and schedule-performance QA belongs to `timetable.html`. |

## Redirect Notes

| Property | Current verdict | Evidence |
| --- | --- | --- |
| Route type | Redirect wrapper | `faculty-schedule.html` now contains one meta refresh, one inline redirect script, and no external assets. |
| Canonical live route | `timetable.html` | The professor role already has explicit access to both `faculty-schedule` and `timetable`, and the live planner/timetable runtime is owned by `timetable.html`. |
| Shared shell assets | Removed | No `assets/js/` or `assets/css/` imports remain in `faculty-schedule.html`. |
| Mobile scaffold | Removed | No mobile nav/action-sheet markup remains in the wrapper. |
| Browser behavior | Verified | JS-enabled and no-JS checks both land on `timetable.html`; the JS-enabled run with a seeded professor session stays on the live timetable route instead of falling through to login. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `faculty-schedule.html`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FSCH-01`, `FSCH-05` | Created the dedicated tracker, removed dead social-helper imports, and replaced the old mobile-shell polling wait during the standalone-shell phase. |
| `2026-05-15` | `faculty-schedule.html`, `faculty-gradebook.html`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FSCH-04` | Direct source inspection proved the route had drifted into the same gradebook-oriented shell as `faculty-gradebook.html`, not a timetable-specific workspace. |
| `2026-05-16` | `faculty-schedule.html`, `test/faculty-schedule-route-regressions.test.js`, `test/redirect-wrapper-regressions.test.js`, `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `FSCH-01`, `FSCH-02`, `FSCH-03`, `FSCH-04`, `FSCH-06`, `FSCH-07`, `FSCH-08` | Replaced the drifting standalone shell with a zero-runtime alias to `timetable.html`; `npx vitest run test/faculty-schedule-route-regressions.test.js test/redirect-wrapper-regressions.test.js` passed `4/4`; direct source scans now show `1,472` bytes, `1` inline script, `0` external scripts, `0` stylesheets, and no shell classes/nav/mobile scaffold; a headless Playwright check with a seeded professor session lands on `timetable.html`, and a no-JS check confirms the meta-refresh fallback also lands on `timetable.html`. |

## Next Safe Pass

1. Closed for now. If faculty schedule behavior changes again, make the change on `timetable.html` first and keep `faculty-schedule.html` as the alias unless a distinct route is intentionally reintroduced.
