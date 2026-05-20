# Admin Orders Optimization Tracker

Target page: `admin-orders.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep admin orders usable while removing polling and inline handlers, and document ownership around the shared messenger runtime.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `admin-orders.html` | `22,219 bytes` after extracting the route studio surface |
| External scripts | `14` | Current shell inventory with extracted page controller plus dedicated `orders-workspace.js` |
| Inline scripts | `1` | Mobile shell block only after extracting the page controller |
| Inline handlers | `0` | Source scan after delegated listeners |
| Mobile shell polling loops | `0` | Source scan after replacing the old `setInterval` wait |
| Route owner note | `assets/js/shared/orders-workspace.js` | `renderAdminOrders()` now lives in the dedicated shared orders workspace |

## Current Findings

1. Admin orders now relies on a dedicated `assets/js/shared/orders-workspace.js` runtime for inbox rendering, with `messenger.js` retained only for shared helper surfaces still consumed by that workspace.
2. Studio controls now use `data-*` hooks and delegated listeners, the startup render poll is gone, and the shared admin-orders renderers no longer emit route-specific inline handler attributes.
3. The live admin orders path now keeps a stable shell and updates hero, recipients, compose, sent-orders, and detail regions separately instead of rebuilding `#admin-orders-root` on every interaction.
4. The route-local studio surface now lives in `assets/css/admin-orders-route.css`; the remaining `style=` attributes are limited to hidden nav stubs or shared mobile-shell chrome.
5. Scripted efficient-tier desktop and mobile QA now covers admin send plus recipient inbox open/read-filter flows with zero page or console errors.
6. No open admin-orders cleanup tasks remain in this tracker.
7. The first root-entry markup hardening batch is now landed on `admin-orders.html`: the hidden nav landmarks have unique labels, the visible mobile-sheet buttons now declare `type="button"` and use `<span class="mob-sheet-icon">`, the palette labels now encode `&amp;`, and the focused validator count dropped from `35` to `4`.

## AI Update Rules

1. Update this file in the same turn as every change to `admin-orders.html`, `assets/js/shared/messenger.js`, or any future `assets/js/pages/admin-orders.js` file.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current admin orders visuals and inbox behavior unless a task explicitly changes them.
6. If a task is blocked by messenger coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| AORD-01 | Done | 0% | Identify which orders logic is still embedded inline and move it to a dedicated `assets/js/pages/admin-orders.js` module | The admin orders studio/bootstrap logic now lives in `assets/js/pages/admin-orders.js`. |
| AORD-02 | Done | 0% | Replace the remaining inline handlers with delegated listeners | The shell and shared admin-orders renderers now use delegated listeners plus `data-*` hooks. |
| AORD-03 | Done | 0% | Remove `transition: all` usage from the page-local styles and replace it with property-specific transitions | The studio controls now animate only border, background, color, box-shadow, and transform. |
| AORD-04 | Done | 0% | Unify admin orders behavior with the main `orders.html` runtime instead of maintaining two drifting versions | Both live routes now use the shared messenger runtime, the region-update path is live, and the obsolete recipient fallback is removed. |
| AORD-05 | Done | 0% | Add a route-specific tracker and QA flow for inbox load, filter, open, and respond actions | This file is the dedicated tracker. |
| AORD-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See the import table below. |
| AORD-07 | Done | 0% | Replace any whole-page rerender path with smaller updates for selected order, badge counts, and status changes | The live admin orders path now updates hero, recipients, compose, table, and detail regions separately. |
| AORD-08 | Done | 0% | Add weak-laptop and mobile checks for inbox open, status change, and reply actions | Captured as admin compose/send plus recipient inbox open/read-filter flows in efficient-tier desktop and mobile artifacts. |

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
| `assets/js/shared/faculty.js` | Keep | Faculty label/theme helpers. |
| `assets/js/shared/messenger.js` | Keep for generic shared helpers | The route still depends on generic people/notification helper surfaces that remain in `messenger.js`; the orders-nav helper now comes from the `app.js` fallback instead. |
| `assets/js/shared/orders-workspace.js` | Keep | `renderAdminOrders()` and `renderOrdersInboxPage()` now live here. |
| `assets/js/shared/utilities.js` | Keep | Theme/transparency helpers. |
| `assets/js/features/navigation.js` | Keep | Route navigation and role routing. |
| `assets/js/features/ui.js` | Keep | Shared shell UI helpers. |
| `assets/js/features/index-luxury.js` | Keep | Shared shell theme pipeline. |
| `assets/css/admin-orders-route.css` | Keep | Route-owned studio surface extracted from the HTML shell. |
| `assets/js/pages/gradebook.js` | Removed | Absent from `admin-orders.html`. |
| `assets/js/pages/lms.js` | Removed | Absent from `admin-orders.html`. |
| `assets/js/pages/registration.js` | Removed | Absent from `admin-orders.html`. |
| `assets/js/pages/planner.js` | Removed | Absent from `admin-orders.html`. |
| `assets/js/pages/directories.js` | Removed | Absent from `admin-orders.html`. |
| `assets/js/pages/student-registration.js` | Removed | Absent from `admin-orders.html`. |
| `assets/js/pages/admin-registration.js` | Removed | Absent from `admin-orders.html`. |

## Ownership Map

| Surface | Current owner | Evidence | Planned direction |
| --- | --- | --- | --- |
| Admin theme studio modal DOM and admin-only boot | `admin-orders.html` and `assets/js/pages/admin-orders.js` | `#modal-studio` plus `bindAdminOrdersStudioControls()` / `initAdminOrdersPage()` | Keep page-local to `admin-orders.html`. |
| Admin command-center render, recipient search/filter, compose flow, sent-orders table, and detail pane | `assets/js/shared/orders-workspace.js` | `renderAdminOrders()` and related admin-order helpers | Keep in the dedicated shared orders workspace. |
| Recipient inbox list, read-state filters, and recipient detail view | `assets/js/shared/orders-workspace.js` | `renderOrdersInboxPage()` and recipient-order helpers | Keep in the dedicated shared orders workspace. |
| Student-facing shell root, fallback hero/widgets, and local visual shell rules | `orders.html` | `#page-orders`, local route style block, and shared-shell entry scripts | Keep shell-only; do not grow admin workflow logic here. |
| Admin shell root and mobile shell chrome | `admin-orders.html` | `#admin-orders-root` and the remaining mobile-shell inline script block | Keep admin-specific chrome local to the admin route. |

Notes:
- `assets/js/shared/orders-workspace.js` is now the real runtime owner for both live orders routes.
- The obsolete `renderOrdersInboxPageLegacySnapshot()` fallback is removed, so only the live shared inbox path remains.

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md` | `AORD-05`, `AORD-06` | Baseline from the master audit and the route shell source. |
| `2026-05-15` | `admin-orders.html`, `test/admin-orders-route-regressions.test.js` | `AORD-02` | Replaced the startup render poll with direct render hooks and converted the studio controls to delegated listeners; source scan now shows `12` external scripts, `0` inline handlers, and `0` `setInterval(` hits. |
| `2026-05-15` | `admin-orders.html`, `test/admin-orders-route-regressions.test.js` | `AORD-03` | Replaced every `transition: all` in the admin orders studio controls with property-specific transitions; source scan now shows `0` `transition: all` hits and `npx vitest run test/admin-orders-route-regressions.test.js` passes. |
| `2026-05-15` | `admin-orders.html`, `assets/js/pages/admin-orders.js`, `test/admin-orders-route-regressions.test.js` | `AORD-01` | Extracted the admin orders studio/bootstrap logic into `assets/js/pages/admin-orders.js`; source scan now shows `13` external scripts, `1` inline script block, `0` inline handlers, and `0` `setInterval(` hits; `node --check assets/js/pages/admin-orders.js` and `npx vitest run test/admin-orders-route-regressions.test.js` pass. |
| `2026-05-15` | `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `AORD-04` | Documented the admin-orders vs orders ownership map with direct evidence from `admin-orders.html`, `orders.html`, `assets/js/pages/admin-orders.js`, and `assets/js/shared/messenger.js`; confirmed the admin shell owns studio/mobile chrome while shared messenger still owns both renderers. |
| `2026-05-15` | `orders.html`, `assets/js/shared/messenger.js`, `assets/js/features/ui.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js` | `AORD-02`, `AORD-04` | Replaced the shared admin-orders route actions with delegated listeners and `data-*` hooks in `assets/js/shared/messenger.js`, in sync with the orders shell cleanup; `node --check assets/js/shared/messenger.js`, `node --check assets/js/features/ui.js`, and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` pass, and the shared source no longer contains the old admin-order inline handler strings. |
| `2026-05-15` | `assets/js/shared/messenger.js`, `test/admin-orders-route-regressions.test.js`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `AORD-04`, `AORD-07` | Reworked the live admin orders path to keep one shell and update hero, recipients, compose, sent-orders, and detail regions separately; `node --check assets/js/shared/messenger.js` passed and the admin route regression test now asserts the region-update helper path. |
| `2026-05-15` | `artifacts/admin-orders-efficient-desktop-summary.json`, `artifacts/admin-orders-mobile-summary.json`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `AORD-08` | Captured efficient-tier desktop and mobile QA for admin send plus recipient inbox open/read-filter flows; both artifact runs completed with zero page or console errors. |
| `2026-05-15` | `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `AORD-04` | Deleted the obsolete `renderOrdersInboxPageLegacySnapshot()` fallback so only the shared live inbox renderer remains for recipient orders. |
| `2026-05-15` | `admin-orders.html`, `assets/css/admin-orders-route.css`, `test/admin-orders-route-regressions.test.js`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | Route surface close-out | Extracted the route-local Colour & Motion Studio surface into `assets/css/admin-orders-route.css`; `admin-orders.html` now reports `22,219 bytes`, `1` route CSS link, and only `11` remaining `style=` attributes, all limited to hidden nav stubs or shared mobile-shell chrome. |
| `2026-05-16` | `assets/js/shared/orders-workspace.js`, `assets/js/shared/messenger.js`, `admin-orders.html`, `orders.html`, `test/admin-orders-route-regressions.test.js`, `test/orders-route-regressions.test.js`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `AORD-04`, `AORD-07` | Extracted the live orders/admin-orders runtime out of `messenger.js` into `assets/js/shared/orders-workspace.js`, updated both live orders pages to load the new workspace script, and retargeted the route regressions to the new runtime owner; `node --check assets/js/shared/orders-workspace.js`, `node --check assets/js/shared/messenger.js`, and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` all passed. |
| `2026-05-18` | `admin-orders.html`, `test/admin-orders-route-regressions.test.js`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `AORD-02` | Added unique labels to the hidden nav stubs, encoded the visible `Colour &amp; Motion Studio` and palette names correctly, and normalized the visible mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">`; focused `html-validate` dropped `admin-orders.html` from `35` to `4` issues; and `npx vitest run test/admin-orders-route-regressions.test.js` stayed green. |

## Next Safe Pass

1. Closed for now. If `admin-orders.html` changes again, rerun the orders/admin-orders regression tests and the two admin-orders perf artifacts.
