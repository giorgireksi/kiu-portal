# Login Optimization Tracker

Target page: `login.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep `login.html` visually strong while reducing shell baggage, removing inline auth wiring, and making the redirect/auth flow explicit enough for safe future cleanup.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `login.html` | `5,972 bytes` after moving the route CSS and runtime into standalone assets and deleting the shared-shell import stack |
| External scripts | `1` | Direct script-tag inventory now shows only `assets/js/pages/login-runtime.js` |
| Route CSS | `assets/css/login-route.css` | `13,559 bytes` replacing the old inline style block plus shared shell CSS |
| Route runtime | `assets/js/pages/login-runtime.js` | `23,355 bytes` replacing the old inline auth/bootstrap script and the shared dashboard JS imports |
| Inline handlers | `0` | `rg -o "onclick=|oninput=|onchange=" login.html` now returns no matches |
| Inline script blocks | `0` | Direct HTML inspection after moving the auth/bootstrap logic into `assets/js/pages/login-runtime.js` |
| Shared verification | `1/1 focused login regression passed` | `npx vitest run test/login-route-regressions.test.js` |
| Browser artifacts | `2` route summaries | `artifacts/login-efficient-desktop-summary.json`, `artifacts/login-mobile-summary.json` |

## Current Findings

1. `login.html` is now a true standalone entry page: it keeps only Font Awesome, shared fonts, `assets/css/login-route.css`, and `assets/js/pages/login-runtime.js`.
2. The route no longer boots `app.js`, `api.js`, `auth.js`, `initial-state.js`, `state.js`, `faculty.js`, `messenger.js`, or any dashboard CSS layer; the login runtime now owns backend auth calls, existing-session restore, expired-session fallback, Microsoft start, and Microsoft callback completion.
3. The delegated `data-login-*` interaction layer remains intact, but the old inline `<script>` block and the inline `<style>` block are both gone.
4. Real desktop/mobile artifacts now cover first-ready, activate-tab open, student redirect, admin redirect, existing-session redirect, expired-session fallback, no-token fallback, Microsoft start, and Microsoft callback completion with zero runtime errors.

## AI Update Rules

1. Update this file in the same turn as every change to `login.html` or login-specific tests/probes.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection, targeted test output, or browser verification evidence.
5. Preserve the current visual identity of the login page unless a task explicitly changes it.
6. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| LOGIN-01 | Done | 0% | Decide which shared shell assets are truly needed on the login page and remove everything else | The standalone route now keeps only Font Awesome, `kiu-fonts.css`, `login-route.css`, and `login-runtime.js`; the old dashboard shell imports are gone. |
| LOGIN-02 | Done | 0% | Deduplicate login redirect logic across local auth, existing auth snapshot, and Microsoft auth paths | `getPortalRoleLanding()` and `getLoginRoleDefaultTarget()` now own the admin-versus-normal landing target used by password login, existing auth snapshot recovery, and Microsoft callback completion. |
| LOGIN-03 | Done | 0% | Replace inline handlers with delegated listeners and page-local auth controllers | The tabs, password toggles, Microsoft SSO button, password submit, and activation submit now all route through `bindLoginInteractions()`. |
| LOGIN-04 | Done | 0% | Reduce font and CSS cost so login does not pay for large route-neutral luxury styling it never uses | The route now uses one dedicated stylesheet and no longer loads `base.css`, `layout.css`, `components.css`, `index-luxury.css`, or `mobile-responsive.css`. |
| LOGIN-05 | Done | 0% | Add login-specific perf and redirect regression tests | The focused route regression plus the refreshed desktop/mobile artifacts now cover student, admin, existing-session, expired-session, no-token, Microsoft-start, and Microsoft-callback paths. |
| LOGIN-06 | Done | 0% | Record which shared shell helpers are still truly required on login and remove all others one by one | The keep/remove table is now explicit and the route no longer depends on any dashboard helper bundle. |
| LOGIN-07 | Done | 0% | Add mobile and weak-laptop checks for first paint, auth submit, and redirect latency | `tools/capture_login_summary.mjs` now records efficient-desktop/mobile first-ready, tab-open, student redirect, admin redirect, and Microsoft-start timings with zero runtime errors. |
| LOGIN-08 | Done | 0% | Ensure login no longer boots any non-auth page runtime implicitly through compatibility imports | The shell now boots one standalone runtime and no non-auth dashboard route packs or compatibility globals. |
| LOGIN-09 | Done | 0% | Build a redirect matrix test plan covering student, admin, expired auth, and Microsoft-auth branches | The refreshed probe now records student redirect, admin redirect, existing-session redirect, expired-session fallback, no-token fallback, Microsoft start, and Microsoft callback completion on desktop and mobile. |

## Import Notes

| Asset | Verdict | Evidence |
| --- | --- | --- |
| `assets/vendor/fontawesome/css/all.min.css` | Keep | The route still uses Font Awesome icons across the entry panel and stat cards. |
| `assets/css/kiu-fonts.css` | Keep | The route still uses the shared font delivery path for `Inter`, `Playfair Display`, and Georgian text coverage. |
| `assets/css/login-route.css` | Keep | This is now the only route stylesheet and owns the old inline block plus the login-specific motion/responsive rules. |
| `assets/js/pages/login-runtime.js` | Keep | This is now the only route runtime and owns auth submit, activation, existing-session restore, expired-session fallback, and Microsoft auth flows. |
| `assets/css/base.css` | Remove | No selector from this shared shell file is required once the login route owns its own reset/layout styles. |
| `assets/css/layout.css` | Remove | The standalone route now owns its own layout shell and no longer uses dashboard layout classes. |
| `assets/css/components.css` | Remove | The route now owns its own form/button/card styling and no longer relies on dashboard component selectors. |
| `assets/css/index-luxury.css` | Remove | The login page no longer pays for dashboard/home chrome, transparency surfaces, or route-family selectors. |
| `assets/css/mobile-responsive.css` | Remove | The dedicated route stylesheet now owns the login breakpoints directly. |
| `assets/js/app/app.js` | Remove | The standalone runtime no longer depends on the shared compatibility bootstrap. |
| `assets/js/app/api.js` | Remove | Login-specific backend fetch helpers now live in `assets/js/pages/login-runtime.js`. |
| `assets/js/app/auth.js` | Remove | Login-specific auth/restore helpers now live in `assets/js/pages/login-runtime.js`. |
| `assets/js/data/initial-state.js` | Remove | The standalone route no longer depends on seeded dashboard state. |
| `assets/js/app/state.js` | Remove | The standalone route no longer depends on shared page-state bootstrap. |
| `assets/js/shared/faculty.js` | Remove | Login no longer inherits faculty helpers from the dashboard shell. |
| `assets/js/shared/messenger.js` | Remove | Removed from `login.html`; no login-specific symbol usage was present. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-16` | `login.html`, `test/login-route-regressions.test.js`, `docs/LOGIN_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `LOGIN-01`, `LOGIN-03`, `LOGIN-05`, `LOGIN-06` | Removed the unneeded `assets/js/shared/messenger.js` shell import, replaced the inline auth handlers with delegated `data-login-tab` / `data-login-action` hooks through `bindLoginInteractions()`, `npx vitest run test/login-route-regressions.test.js` passed `1/1`, direct source scans now show `10` external scripts and `0` inline handlers, and the login route now exposes one focused regression plus a first-pass import matrix. |
| `2026-05-16` | `assets/js/app/auth.js`, `login.html`, `tools/capture_login_summary.mjs`, `artifacts/login-efficient-desktop-summary.json`, `artifacts/login-mobile-summary.json`, `test/login-route-regressions.test.js`, `docs/LOGIN_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `LOGIN-02`, `LOGIN-05`, `LOGIN-07`, `LOGIN-09` | Added `getPortalRoleLanding()` in `auth.js`, routed the Microsoft and existing-auth branches through `getLoginRoleDefaultTarget()` in `login.html`, and added a seeded Playwright login probe; `npx vitest run test/login-route-regressions.test.js` passed `1/1`; `node --check assets/js/app/auth.js` and `node --check tools/capture_login_summary.mjs` passed; `artifacts/login-efficient-desktop-summary.json` now records `firstReadyMs: 1152`, `activateTabOpenMs: 81`, `studentLoginRedirectMs: 860`, `adminLoginRedirectMs: 638`, `microsoftStartMs: 40`, and zero errors; and `artifacts/login-mobile-summary.json` now records `firstReadyMs: 599`, `activateTabOpenMs: 34`, `studentLoginRedirectMs: 571`, `adminLoginRedirectMs: 126`, `microsoftStartMs: 22`, and zero errors. |
| `2026-05-16` | `login.html`, `assets/css/login-route.css`, `assets/js/pages/login-runtime.js`, `tools/capture_login_summary.mjs`, `artifacts/login-efficient-desktop-summary.json`, `artifacts/login-mobile-summary.json`, `test/login-route-regressions.test.js`, `docs/LOGIN_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `LOGIN-01`, `LOGIN-04`, `LOGIN-05`, `LOGIN-06`, `LOGIN-08`, `LOGIN-09` | Converted login into a standalone route shell with one dedicated stylesheet and one dedicated runtime, removed the remaining shared dashboard CSS/JS imports, added existing-session plus expired-session plus no-token plus Microsoft-callback coverage to the Playwright probe, and refreshed the focused regression; `npx vitest run test/login-route-regressions.test.js` passed `1/1`; `node --check assets/js/pages/login-runtime.js` and `node --check tools/capture_login_summary.mjs` passed; direct source scans now show `5,972` bytes for `login.html`, `1` external script, `0` inline script blocks, and `0` inline handlers; `artifacts/login-efficient-desktop-summary.json` now records `firstReadyMs: 1102`, `studentLoginRedirectMs: 271`, `adminLoginRedirectMs: 289`, `existingSessionRedirectMs: 777`, `expiredSessionFallbackMs: 113`, `noTokenFallbackMs: 310`, `microsoftStartMs: 399`, `microsoftCallbackRedirectMs: 859`, and zero errors; and `artifacts/login-mobile-summary.json` now records `firstReadyMs: 637`, `studentLoginRedirectMs: 167`, `adminLoginRedirectMs: 104`, `existingSessionRedirectMs: 376`, `expiredSessionFallbackMs: 65`, `noTokenFallbackMs: 65`, `microsoftStartMs: 103`, `microsoftCallbackRedirectMs: 414`, and zero errors. |

## Next Safe Pass

No open login-specific cleanup tasks remain.
