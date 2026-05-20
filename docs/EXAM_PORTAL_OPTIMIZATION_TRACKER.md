# Exam Portal Optimization Tracker

Target page: `exam-portal.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep the protected exam surface functional while documenting the timer/heartbeat burden, inline action debt, and the work required to split the route safely.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `exam-portal.html` | `30,875 bytes` |
| Page runtime | `assets/js/pages/exam-portal.js` | `59,963 bytes` |
| External scripts | `1` | Single page script in the HTML shell |
| Timers | `3` intervals | Master-audit code scan |
| Inline action markup | `0` inline `onclick` sites | Source scan after delegated launch buttons |
| Shared verification | `3/3 targeted exam-portal assertions passed` | `npx vitest run test/exam-portal-regressions.test.js` |

## Current Findings

1. `exam-portal.html` is still a standalone protected surface, but `assets/js/pages/exam-portal.js` is now down to `59,963 bytes` and the duplicate render blocks are gone.
2. The session dashboard no longer rerenders the full list every second; `startDashboardTimer()` now drives `updateSessionCountdowns()` against `data-session-*` nodes.
3. Whole-route `root.innerHTML` writes are now limited to `4` intentional mode swaps: anti-cheat-only block, protected shell mount, protected launch error, and finalized receipt.
4. Real anti-cheat desktop and weak-mobile fallback artifacts are now in place, so no exam-portal-specific cleanup tasks remain open.

## AI Update Rules

1. Update this file in the same turn as every change to `exam-portal.html` or `assets/js/pages/exam-portal.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the protected exam workflow and anti-cheat behavior unless a task explicitly changes them.
6. If a task is blocked by hidden dependencies or security constraints, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| EXAM-01 | Done | 0% | Replace session-card inline `onclick` markup with delegated listeners | Session cards now use `data-exam-launch-session` plus a delegated document click handler. |
| EXAM-02 | Done | 0% | Split route ownership into token state, scheduled sessions, protected attempt, blocked view, and modal helpers | The runtime now has dedicated route builders for dashboard cards, anti-cheat-only block, protected ready state, protected workspace, finalized receipt, and confirm helpers. |
| EXAM-03 | Done | 0% | Record every whole-root rerender and mark the smaller update target that can replace it | `root.innerHTML` is now limited to `4` intentional route-level swaps, while countdowns, notices, autosave text, nav pills, and flag state update smaller nodes in place. |
| EXAM-04 | Done | 0% | Capture anti-cheat-browser and weak-device checks for session list open, protected attempt, and idle countdown CPU | `artifacts/exam-portal-anti-cheat-desktop-summary.json` now records `dashboardReadyMs: 1491`, `readyShellMs: 713`, `revealMs: 111`, countdown advance across one second, and `0` errors during the protected desktop attempt. |
| EXAM-05 | Done | 0% | Add a timer ownership table for session countdown, protected countdown, and heartbeat | The table below now matches the live `stopAllTimers()` / `syncTimerVisibility()` ownership and the dedicated dashboard-vs-protected timer split. |
| EXAM-06 | Done | 0% | Inventory all inline `onclick` action sites emitted by `assets/js/pages/exam-portal.js` | Source scan now reports `0` inline `onclick` sites. |
| EXAM-07 | Done | 0% | Add a timer ownership table that records start, stop, and visibility rules for every exam-portal interval | The timer table now records the new authenticated-session gating plus `pagehide` and `document.hidden` stop paths. |
| EXAM-08 | Done | 0% | Replace the page-wide loading/blocked states with smaller update zones where safe | The remaining full-page swaps are only real mode changes; countdown text, notice banners, autosave state, question-nav states, and flag toggles update without rebuilding the whole route. |
| EXAM-09 | Done | 0% | Verify exam-portal behavior on weak mobile hardware even if the protected attempt itself is desktop-focused | `artifacts/exam-portal-mobile-fallback-summary.json` now records the blocked mobile fallback title in `1118 ms` with `0` errors. |
| EXAM-10 | Done | 0% | Create a dedicated tracker for exam-portal | This file is the dedicated tracker. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-14` | `docs/EXAM_PORTAL_OPTIMIZATION_TRACKER.md` | `EXAM-10` | Baseline from `exam-portal.html` and `assets/js/pages/exam-portal.js` via master-audit source scan. |
| `2026-05-14` | `assets/js/pages/exam-portal.js`, `test/exam-portal-regressions.test.js` | `EXAM-01`, `EXAM-06` | Delegated the session launch buttons and removed the last inline `onclick` sites from the page runtime. |
| `2026-05-15` | `assets/js/pages/exam-portal.js`, `test/exam-portal-regressions.test.js`, `docs/EXAM_PORTAL_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAM-02`, `EXAM-03`, `EXAM-05`, `EXAM-07`, `EXAM-08` | `node --check assets/js/pages/exam-portal.js` passed; `npx vitest run test/exam-portal-regressions.test.js` passed all `3` assertions; the runtime is now `59,963 bytes` with `3` `setInterval(` hits, `1` `renderSessionCards()` definition, `1` `renderProtectedShell()` definition, `4` `root.innerHTML` mode swaps, and targeted `data-session-countdown` / `data-session-spotlight-countdown` update zones. |
| `2026-05-16` | `artifacts/exam-portal-anti-cheat-desktop-summary.json`, `artifacts/exam-portal-mobile-fallback-summary.json`, `docs/EXAM_PORTAL_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `EXAM-04`, `EXAM-09` | The anti-cheat desktop artifact now records `dashboardReadyMs: 1491`, `readyShellMs: 713`, `revealMs: 111`, and a live countdown tick from `00:44:57` to `00:44:56` with `0` errors; the mobile artifact records the blocked fallback title in `1118 ms` with `0` errors; `npx vitest run test/exam-portal-regressions.test.js` passed all `3` assertions. |

## Timer Ownership

| Timer | Owner | Start | Stop | Visibility rule |
| --- | --- | --- | --- | --- |
| Dashboard countdown | `startDashboardTimer()` | `renderPortalShell()`, `refreshSessions()`, or `syncTimerVisibility()` when the page is visible, authenticated, has session cards, and is not in protected mode | `document.hidden`, `pagehide`, logout, or when protected mode takes over | Pauses while hidden or sessionless; resumes on visible when a logged-in dashboard actually has sessions to count down. |
| Protected countdown | `startProtectedCountdown()` | `renderProtectedShell()` / `syncTimerVisibility()` when protected mode is active and visible | `document.hidden`, `pagehide`, submission, or loss of protected mode | Pauses while hidden; resumes on visible while protected mode remains active. |
| Protected heartbeat | `startProtectedHeartbeat()` | `bootstrapProtectedMode()` / `syncTimerVisibility()` when protected mode is active and visible | `document.hidden`, `pagehide`, submission, or loss of protected mode | Pauses while hidden; resumes on visible while protected mode remains active. |

## Whole-Root Rerender Map

| Root swap | Why it still exists | Smaller update target now used elsewhere |
| --- | --- | --- |
| Anti-cheat-only block | Full-route takeover for unsupported browsers | Not applicable; this is the entire route state. |
| Protected shell mount | Full-route mode swap between dashboard and protected exam | Countdown, autosave, question-nav state, and flag state now update in place after mount. |
| Protected launch error | Full-route fallback for invalid or expired launch state | Not applicable; this is the entire route state. |
| Finalized receipt | Full-route swap after submission or graded state | Countdown, autosave, and answer-state updates no longer force this swap during an active attempt. |

## Next Safe Pass

1. No exam-portal-specific cleanup tasks remain open.
2. If the protected exam flow changes again, rerun both artifact captures before touching timer ownership, ready-state timing, or the mobile fallback copy.
