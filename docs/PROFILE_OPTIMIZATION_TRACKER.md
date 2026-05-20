# Profile Optimization Tracker

Target page: `profile.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the self-profile route usable while trimming dead startup imports, documenting the current handler debt, and clarifying what behavior still belongs to `registration.js`, `timetable-runtime.js`, and the shared messenger shell.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `profile.html` | `18,943 bytes` after the root-entry validator cleanup on the standalone shell |
| Route stylesheet | `assets/css/profile-route.css` | `2,770 bytes` after absorbing the remaining shell-only inline style rules |
| External scripts | `13` | `12` deferred scripts plus `theme-primer.js` in the head |
| Inline handlers | `0` | Source scan of `onclick=|oninput=|onchange=|onmouseenter=|onmouseleave=` |
| Inline style blocks | `0` | Source scan of `profile.html` |
| Inline `style=` attrs in `profile.html` | `0` | Source scan after the final class-based shell cleanup |
| Mobile shell polling loops | `0` | The inline mobile shell now uses the direct `ensureNavigateHooks()` path |
| Shared verification | `2/2` focused profile regressions passed | `npx vitest run test/profile-source-regressions.test.js test/profile-route-regressions.test.js` |
| Browser artifacts | `2` route summaries | `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json` |

## Current Findings

1. `profile.html` no longer ships the dead social helper trio or the unrelated page-pack imports that had no direct profile-shell ownership.
2. The current route-specific behavior is split between:
   `profile-route.js` for `switchProfileTab(...)`
   `timetable-runtime.js` for `renderProfileCalendar(...)`
   `faculty.js` for the embedded `#portal-messenger-container` workspace
3. The old tab-switch and modal-close inline handlers are gone; the route now uses `data-profile-tab` plus a delegated `registration.js` listener and shared `data-modal-close` hooks.
4. The mobile shell no longer polls for `navigate()` readiness.
5. The overlap audit with `personal-data.html` and `profile-view.html` is complete: `profile.html` keeps the self-edit/account-management shell, `profile-view.html` keeps the viewer/admin schedule/session shell, and `personal-data.html` stays read-only.
6. The email, password, and calendar panes now stay unmounted until first selection via template-backed lazy tabs, the shell layout/card/calendar/messenger styles live in `assets/css/profile-route.css`, the mobile sheet/icon states now use route CSS classes, and `profile.html` now has `0` inline `style=` attributes left.
7. The self-profile shell source is now clean again for the visible tab labels, button copy, password placeholders, and recovery helper text; a dedicated source regression now locks those strings.
8. The root-entry markup cleanup is now complete for `profile.html`: the hidden nav stubs have unique labels, the visible update actions now declare `type="button"`, the password inputs now declare `autocomplete`, and the mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every meaningful change to `profile.html` or any directly related route-owned profile helper.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct source inspection or targeted command/test output.
5. Preserve the current self-profile workflow unless a task explicitly changes it.
6. If a task is blocked by shared route coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| PROFILE-01 | Done | 0% | Remove unrelated route imports and isolate the self-profile runtime from LMS, planner, and registration unless needed | Dead social helpers and unrelated page-pack imports are gone; `registration.js` and the extracted `timetable-runtime.js` remain because they still own live profile behavior, while the unproven `messenger.js` shell import is now removed. |
| PROFILE-02 | Done | 0% | Replace the `18` inline handlers with delegated listeners | The route now uses delegated `data-profile-tab` handling plus shared `data-modal-close` hooks; source scan now reports `0` inline handlers. |
| PROFILE-03 | Done | 0% | Audit overlap with `profile-view.html` and extract shared profile components instead of keeping two drifting large page files | The audit is complete: keep the page shells separate and limit any future sharing to thinner identity-summary/profile utility helpers only. |
| PROFILE-04 | Done | 0% | Lazy-render inactive tabs, attachments, or analytics blocks | The non-overview `email`, `password`, and `calendar` panes now lazy-mount from dedicated templates on first open; the route still has no active edit or attachment workflow beyond the messenger placeholder shell. |
| PROFILE-05 | Done | 0% | Move page-local styles and one-off shell hacks into dedicated route CSS | The remaining shell-only inline style attributes are gone from `profile.html`; the route now uses `profile-shell-tab*`, `profile-shell-action`, `profile-shell-lazy-pane`, `profile-mobile-hidden`, and `profile-sheet-icon-*` classes from `assets/css/profile-route.css`. |
| PROFILE-06 | Done | 0% | Create a dedicated profile cleanup tracker | This file is the dedicated tracker. |
| PROFILE-07 | Done | 0% | Build a handler inventory grouped by event type so inline actions can be removed in controlled batches | Inventory captured below from direct source parsing. |
| PROFILE-08 | Done | 0% | Build a keep/remove table for each eager imported runtime so self-profile stops paying for unrelated LMS and registration code | Matrix captured below with current keep/remove evidence. |
| PROFILE-09 | Done | 0% | Add weak-laptop and mobile checks for tab open, edit mode, and attachment interactions | Desktop/mobile artifacts now record first-ready plus email/password/calendar tab-open timings, and both runs explicitly report `editFlowPresent: false` and `attachmentFlowPresent: false` for the current route shape. |
| PROFILE-10 | Done | 0% | Remove remaining mojibake from the visible self-profile shell templates | `profile.html` now ships clean source text for the tab rail, section title, update buttons, password placeholders, and recovery helper copy, and `test/profile-source-regressions.test.js` guards those literals. |

## Handler Inventory

Historical inline-handler grouping captured from `profile.html` before the delegation cleanup:

| Event group | Count | Evidence |
| --- | ---: | --- |
| `switchProfileTab(...)` tab switches | `4` | The left-rail tab buttons for `info`, `email`, `password`, and `calendar` |
| `closeAllModals(event)` overlay and modal-close actions | `14` | The overlay wrapper, close icons, and footer buttons across the route’s prebuilt modal shells |

## Import Matrix

Current eager-runtime verdicts for `profile.html`:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | Standalone shell theme primer. |
| `assets/js/app/app.js` | Keep | Shared shell bootstrap. |
| `assets/js/app/api.js` | Keep | Shared auth/API layer. |
| `assets/js/app/auth.js` | Keep | Portal auth/session state. |
| `assets/js/data/initial-state.js` | Keep | Shared state bootstrap. |
| `assets/js/app/state.js` | Keep | Shared state and route wiring. |
| `assets/js/shared/utilities.js` | Keep | Shared shell/transparency helpers. |
| `assets/js/shared/faculty.js` | Keep | Shared profile copy helpers like `#profile-section-title` plus route theme helpers. |
| `assets/js/features/navigation.js` | Keep | Mobile shell and route navigation still rely on `navigate(...)`. |
| `assets/js/features/ui.js` | Keep | Shared shell UI helpers. |
| `assets/js/features/index-luxury.js` | Keep | Shared shell theme pipeline and messenger/topbar behavior. |
| `assets/js/pages/profile-route.js` | Keep for now | Owns `switchProfileTab(...)`, `ensureProfileTabContent(...)`, and tab-panel visibility control inside `profile.html`. |
| `assets/js/pages/registration.js` | Removed | The self-profile tab helpers now live in `assets/js/pages/profile-route.js`, so `profile.html` no longer needs the legacy multi-role registration bundle. |
| `assets/js/pages/timetable-runtime.js` | Keep for now | Owns the extracted `renderProfileCalendar(...)` calendar-tab runtime and shared schedule surface helpers. |
| `assets/js/pages/planner.js` | Removed | `profile.html` now relies on `assets/js/pages/timetable-runtime.js` for the calendar tab instead of importing the full planner pack. |
| `assets/js/shared/messenger.js` | Removed | `profile.html` no longer imports it eagerly; `faculty.js` already owns `renderPortalMessengerWorkspace()` and `openPortalMessengerChat(...)` for the embedded messenger panel. |
| `assets/js/shared/social-hub.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/shared/social-render.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/shared/social-media.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/pages/gradebook.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/pages/lms.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/pages/directories.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/pages/student-registration.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |
| `assets/js/pages/admin-registration.js` | Removed | No direct `profile.html` ownership references remain after source inspection. |

## Overlap Notes

| Route | Current ownership | Shared candidate | Key divergence |
| --- | --- | --- | --- |
| `profile.html` | Self-profile shell HTML plus `profile-route.js` tab control, `timetable-runtime.js` calendar tab, and `faculty.js` embedded messenger panel | Avatar/name/meta summary helpers, generic modal close behavior, and maybe shared calendar/profile utility helpers later | Self-edit/account route with `info`, `email`, `password`, `calendar`, and embedded messenger surfaces |
| `profile-view.html` | Standalone viewer/admin shell plus planner/directories helpers | Avatar/name/program/status presentation and generic academic-context labels | Viewer/admin route with schedule/session tools, bursar/transcript actions, and broader modal/session workflows |
| `personal-data.html` | `faculty.js#renderPersonalDataPageContext(...)` plus its own shell | Identity summary strings, avatar fallback, faculty/program labels, academic summary formatting | Read-only academic record summary rather than editable account-management UI |

Current conclusion:
- Do not force one shared page shell across `profile.html`, `profile-view.html`, and `personal-data.html`.
- A thinner shared identity-summary helper layer is plausible later, but only after the remaining self-profile/profile-view behavior cleanup is further reduced.

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-17` | `profile.html`, `test/profile-source-regressions.test.js`, `test/profile-route-regressions.test.js`, `docs/PROFILE_OPTIMIZATION_TRACKER.md` | `PROFILE-10` | Replaced the last visible mojibake in the self-profile shell templates with clean English source text for the tab rail, section title, update buttons, password placeholders, and recovery helper copy; `npx vitest run test/profile-source-regressions.test.js test/profile-route-regressions.test.js` passed `2/2`; and a seeded Playwright verification on `http://127.0.0.1:8876/profile.html` confirmed clean rendered tabs/placeholders with zero console/page errors. |
| `2026-05-18` | `profile.html`, `test/profile-route-regressions.test.js`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `PROFILE-02`, `PROFILE-10` | Added unique labels to the hidden nav stubs, added explicit `type="button"` to the visible update actions, declared password `autocomplete` on the three password fields, and normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` dropped `profile.html` from `18` to `0`, and `npx vitest run test/profile-route-regressions.test.js` passed `1/1` file and `1/1` test. |
| `2026-05-15` | `profile.html`, `test/profile-route-regressions.test.js`, `docs/PROFILE_OPTIMIZATION_TRACKER.md` | `PROFILE-01`, `PROFILE-06`, `PROFILE-07`, `PROFILE-08` | Trimmed the dead social helper trio and unrelated page-pack imports from `profile.html`; current shell now reports `132,710 bytes`, `15` external scripts, `18` historical inline handlers before cleanup, `0` `<style>` blocks, and `1` historical mobile-shell `setInterval(...)` wait; the handler inventory and import matrix were captured from direct source inspection; and `npx vitest run test/profile-route-regressions.test.js` passed. |
| `2026-05-15` | `profile.html`, `assets/js/pages/registration.js`, `test/profile-route-regressions.test.js`, `docs/PROFILE_OPTIMIZATION_TRACKER.md` | `PROFILE-02` | Replaced the four tab-switch inline handlers with `data-profile-tab` plus a delegated `registration.js` listener, replaced the modal-close inline handlers with shared `data-modal-close` hooks, removed the mobile-shell `navigate()` polling wait in favor of `ensureNavigateHooks()`, and re-ran `node --check assets/js/pages/registration.js` plus `npx vitest run test/profile-route-regressions.test.js`. |
| `2026-05-15` | `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-03` | Compared `profile.html`, `profile-view.html`, `personal-data.html`, `assets/js/pages/registration.js`, `assets/js/pages/planner.js`, `assets/js/pages/directories.js`, and `assets/js/shared/faculty.js`; current evidence shows only a small shared identity-summary/helper candidate layer, while the page shells and workflows remain distinct. |
| `2026-05-16` | `profile.html`, `test/profile-route-regressions.test.js`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-01` | Removed the unproven `assets/js/shared/messenger.js` shell import from `profile.html`; `npx vitest run test/profile-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `13` external scripts, no `messenger.js` import, and `assets/js/shared/faculty.js` still exposes `renderPortalMessengerWorkspace()` plus `openPortalMessengerChat(...)` for the embedded messenger panel. |
| `2026-05-16` | `assets/js/app/app.js`, `test/profile-route-regressions.test.js`, `tools/capture_profile_summary.mjs`, `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-09` | Added the missing `PROFILE_CALENDAR_WEEK_STORAGE_KEY` constant so the calendar tab no longer throws on desktop, added a seeded Playwright self-profile probe, and captured efficient-desktop/mobile summaries for tab-open timings; `node --check assets/js/app/app.js` and `node --check tools/capture_profile_summary.mjs` passed; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; `artifacts/profile-efficient-desktop-summary.json` now records `firstReadyMs: 1384`, `emailTabOpenMs: 186`, `passwordTabOpenMs: 608`, `calendarTabOpenMs: 508`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors; and `artifacts/profile-mobile-summary.json` now records `firstReadyMs: 639`, `emailTabOpenMs: 169`, `passwordTabOpenMs: 24`, `calendarTabOpenMs: 14`, `mobileNavVisible: true`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors. |
| `2026-05-16` | `profile.html`, `assets/js/pages/registration.js`, `tools/capture_profile_summary.mjs`, `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json`, `test/profile-route-regressions.test.js`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-04` | Replaced the inactive `email`, `password`, and `calendar` panes with template-backed lazy tabs in `profile.html`, added `ensureProfileTabContent(...)` to `assets/js/pages/registration.js`, and tightened the self-profile probe so tab-open timing waits for mounted content instead of hidden placeholders; `node --check assets/js/pages/registration.js` and `node --check tools/capture_profile_summary.mjs` passed; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; direct source scans now show `data-profile-mounted=\"1\"` on `profile-tab-info`, `data-profile-mounted=\"0\"` on the inactive panes, plus `profile-tab-template-email`, `profile-tab-template-password`, and `profile-tab-template-calendar`; `artifacts/profile-efficient-desktop-summary.json` now records `firstReadyMs: 2518`, `emailTabOpenMs: 1245`, `passwordTabOpenMs: 138`, `calendarTabOpenMs: 777`, `calendarNodeCount: 2`, and zero errors; and `artifacts/profile-mobile-summary.json` now records `firstReadyMs: 756`, `emailTabOpenMs: 101`, `passwordTabOpenMs: 32`, `calendarTabOpenMs: 292`, `calendarNodeCount: 2`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `profile.html`, `assets/css/profile-route.css`, `test/profile-route-regressions.test.js`, `tools/capture_profile_summary.mjs`, `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-05` | Linked a dedicated `assets/css/profile-route.css` stylesheet from `profile.html`, moved the shell layout/card/calendar/messenger styles behind route-owned selectors, and refreshed the self-profile probe against the updated shell; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; direct source scans now show `assets/css/profile-route.css?v=20260516-profileroute1`, `profile-shell-layout`, `profile-shell-nav`, `profile-shell-content`, `profile-shell-card`, `profile-shell-calendar`, and `profile-shell-messenger`; the inline `style=` attribute count dropped from `102` to `95`; `artifacts/profile-efficient-desktop-summary.json` now records `firstReadyMs: 2104`, `emailTabOpenMs: 998`, `passwordTabOpenMs: 515`, `calendarTabOpenMs: 331`, and zero errors; and `artifacts/profile-mobile-summary.json` now records `firstReadyMs: 685`, `emailTabOpenMs: 173`, `passwordTabOpenMs: 26`, `calendarTabOpenMs: 142`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-03` | Rechecked the current ownership split after the `profile-view` closeout and the self-profile lazy-tab/CSS passes: `profile.html` still owns the self-edit account shell plus `registration.js` tab control, `planner.js` calendar rendering, and the embedded messenger workspace; `profile-view.html` now owns the viewer/admin shell with template-backed session tools and lazy tabs; `personal-data.html` remains the read-only academic record summary; and there is still no safe evidence for one shared page shell or one shared route runtime across the three routes. |
| `2026-05-16` | `profile.html`, `assets/css/profile-route.css`, `test/profile-route-regressions.test.js`, `tools/capture_profile_summary.mjs`, `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-05` | Replaced the remaining shell-only inline style attributes in `profile.html` with route CSS classes, preserved the original `modal-overlay` markup while moving the shared close hook to `#mob-sheet-close`, and refreshed the self-profile probe; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; direct source scans now show `profile.html` at `49,066 bytes`, `assets/css/profile-route.css` at `2,770 bytes`, `0` inline `style=` attrs in `profile.html`, `data-modal-close=\"1\"` on `#mob-sheet-close`, hidden nav stubs now using `hidden`, lazy panes now using `profile-shell-lazy-pane`, and the mobile nav/sheet/icon states now using route CSS classes; `artifacts/profile-efficient-desktop-summary.json` now records `firstReadyMs: 5314`, `emailTabOpenMs: 839`, `passwordTabOpenMs: 107`, `calendarTabOpenMs: 769`, and zero errors; and `artifacts/profile-mobile-summary.json` now records `firstReadyMs: 818`, `emailTabOpenMs: 56`, `passwordTabOpenMs: 81`, `calendarTabOpenMs: 178`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `profile.html`, `assets/js/pages/timetable-runtime.js`, `timetable.html`, `registration.html`, `assets/js/app/app.js`, `test/profile-route-regressions.test.js`, `tools/capture_profile_summary.mjs`, `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-01`, `PROFILE-08`, `PROFILE-09` | Replaced the eager `planner.js` import in `profile.html` with the extracted `assets/js/pages/timetable-runtime.js` calendar owner, kept the self-profile route on the slimmer shared schedule runtime used by `timetable.html` and the standalone registration route, and refreshed the seeded desktop/mobile profile probes against the new import floor; `npx vitest run test/profile-route-regressions.test.js` passed; `node --check assets/js/pages/timetable-runtime.js` and `assets/js/app/app.js` passed; direct source scans now show `12` deferred scripts plus `theme-primer.js`, no eager `planner.js` import, and `assets/js/pages/timetable-runtime.js?v=20260516-surface-split1`; and refreshed profile artifacts still report `firstReadyMs: 5314/818`, `emailTabOpenMs: 839/56`, `passwordTabOpenMs: 107/81`, `calendarTabOpenMs: 769/178`, and zero errors. |
| `2026-05-16` | `assets/js/pages/profile-route.js`, `profile.html`, `test/profile-route-regressions.test.js`, `artifacts/profile-efficient-desktop-summary.json`, `artifacts/profile-mobile-summary.json`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PROFILE-01`, `PROFILE-08` | Extracted the self-profile tab helpers out of `registration.js` into `assets/js/pages/profile-route.js` and removed the legacy registration bundle from `profile.html`; `node --check assets/js/pages/profile-route.js` passed; `npx vitest run test/profile-route-regressions.test.js` passed; direct source scans now show `profile.html` at `49,076 bytes`, `assets/js/pages/profile-route.js?v=20260516-profiletabsplit1`, and no eager `assets/js/pages/registration.js` import; `rg -n "assets/js/pages/registration.js" -g "*.html"` now reports only `admin-tools.html`; and refreshed profile artifacts still report zero errors with `firstReadyMs: 6135/772`, `emailTabOpenMs: 352/146`, `passwordTabOpenMs: 107/38`, and `calendarTabOpenMs: 911/170`. |

## Next Safe Pass

No profile-specific cleanup tasks remain open. If the route grows again, keep future shell styling in `assets/css/profile-route.css`, preserve the lazy tab boundary, and rerun the focused regression plus the profile browser summaries.
