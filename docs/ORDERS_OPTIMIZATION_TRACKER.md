# Orders Optimization Tracker

Target page: `orders.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the orders experience usable while reducing shell imports, preserving the current inbox/detail flow, and documenting the shared route ownership.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `orders.html` | `28,612 bytes` after converting the remaining static fallback shell styles into local route classes |
| External scripts | `13` | Direct post-split script inventory |
| Page runtimes | `1` route workspace + shared shell dependencies | `assets/js/shared/orders-workspace.js` owns the live route, `assets/js/app/app.js` now owns the faculty-scoped people helpers used by the workspace, and `messenger.js` remains loaded only for generic portal chrome already used by the shell |
| Inline handlers | `0` | Shell scan after removing the modal/program inline attributes |
| Inline script blocks | `1` | Mobile shell block only |
| Mobile shell polling loops | `0` | Source scan after replacing the old `setInterval` wait |
| Prebuilt hidden modal bodies | `0` | Source scan no longer finds `modal-syllabus`, `modal-programs`, or `modal-program-courses` in `orders.html` |
| Existing browser perf evidence | Captured | `artifacts/orders-efficient-desktop-summary.json` and `artifacts/orders-mobile-summary.json` record explicit recipient scroll/detail/attachment-preview checks with `0` errors |
| Source corruption regression | `2/2` focused orders regressions passed | `npx vitest run test/orders-route-regressions.test.js` |
| Route owner note | Dedicated shared orders workspace | `assets/js/shared/orders-workspace.js` now contains `renderOrdersInboxPage()` and `renderAdminOrders()` |

## Current Findings

1. `orders.html` now loads the shared shell plus a dedicated `assets/js/shared/orders-workspace.js` route runtime, with generic faculty-scoped people helpers coming from `assets/js/app/app.js` and `messenger.js` retained only for shared portal chrome already used by the shell.
2. The shell modal/program controls no longer use inline handler attributes, and the shared orders/admin-orders renderers now use delegated route actions instead of route-specific inline `onclick`/`oninput`/`onchange`.
3. The live recipient inbox path keeps a stable shell and updates hero, list, and detail regions separately instead of rebuilding the full root on every search/status/open action.
4. The shell no longer ships the old hidden announcement/event/syllabus/program modal bodies; only the shared overlay shell remains, and shared fallback scaffolds can create the generic modals on demand.
5. The dead legacy recipient-inbox body is now actually removed from `renderOrdersInboxPage()`, so the shared runtime only keeps the live region-update path.
6. The main live orders/admin-orders runtime no longer lives in `messenger.js`; it now sits in `assets/js/shared/orders-workspace.js`, `assets/js/app/app.js` owns `normalizePeopleFacultyFilter()`, `isEvenSemester()`, `calculateStudentSemester()`, `getAllStaff()`, and `getAllStudents()`, and `messenger.js` no longer declares those route-adjacent people helpers.
7. The live recipient compatibility wrappers are now thin delegates only, and the active render path uses clean separators plus the `getOrderDisplayValue(...)` fallback for hero, metric, and list dates.
8. The current non-goal is redesign: the orders inbox and detail surfaces should keep their visual language while dependency weight drops.
9. The live route still has no dedicated attachment-preview workflow; the current browser artifacts explicitly record `attachmentPreviewPresent: false`, so any future preview feature should be treated as new scope rather than a hidden regression.
10. The legacy static fallback block in `orders.html` is now source-clean again for tabs, table headers, sample statuses, and PDF action labels; the live JS workspace still replaces that block during normal route startup.
11. The first root-entry markup hardening batch is now landed on `orders.html`: the hidden nav landmarks have unique labels, the visible PDF/mobile-sheet buttons now declare `type="button"`, the invalid mobile-sheet `<button><div ...></div></button>` pattern is replaced with `<span class="mob-sheet-icon">`, and the validator count dropped from `43` to `27`, leaving mostly inline-style debt in the static fallback shell.
12. The second root-entry markup batch completed the entry-page validator cleanup for `orders.html`: the remaining static tabs, table shell, table head cells, sample status chips, footer controls, and mobile action-sheet icon gradients now all use local route classes, and focused `html-validate` reports `0` issues on the page.

## AI Update Rules

1. Update this file in the same turn as every change to `orders.html`, `assets/js/shared/messenger.js`, or any future `assets/js/pages/orders*.js` file.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current orders inbox / admin-orders relationship unless a task explicitly changes it.
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
| ORD-01 | Done | 0% | Remove unrelated page imports and prove which route modules the orders view actually needs | Dead page-pack imports are gone from the shell; remaining proof work stays under `ORD-06`. |
| ORD-02 | Done | 0% | Replace the remaining inline handlers with delegated listeners | The shell and shared orders renderers now use delegated handlers plus `data-*` hooks. |
| ORD-03 | Done | 0% | Split the orders inbox, order detail, and attachment tools into smaller lazy-mounted regions | The live recipient path keeps stable hero/list/detail shells, stable detail subregions, thin compatibility wrappers only, clean date fallback output, and a dedicated `orders-workspace.js` route owner. |
| ORD-04 | Done | 0% | Unify shared order logic with `admin-orders.html` so the two pages do not drift | Both live routes share the same dedicated `orders-workspace.js` runtime and detail-region helpers, and the last faculty-helper ownership edge now lives in `app.js` instead of `messenger.js`. |
| ORD-05 | Done | 0% | Add an orders-specific tracker for desktop and mobile inbox perf | This file is the dedicated tracker. |
| ORD-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See the import table below. |
| ORD-07 | Done | 0% | Replace any whole-page rerender path with smaller updates for selected order, badge counts, and status changes | The live recipient orders path now updates hero, list, and detail regions separately. |
| ORD-08 | Done | 0% | Add weak-laptop and mobile checks for inbox scroll, detail open, and attachment preview | `artifacts/orders-efficient-desktop-summary.json` and `artifacts/orders-mobile-summary.json` now record explicit scroll, detail-open, and attachment-preview absence checks with `0` errors; the live route currently has no attachment preview workflow. |
| ORD-09 | Done | 0% | Remove remaining mojibake from the static `orders.html` fallback shell | The fallback tabs, headers, sample row titles, statuses, and PDF action labels are now clean English source text, and `test/orders-route-regressions.test.js` guards the old mojibake markers from returning. |

## Import Notes

Current route-shell evidence:

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/pages/gradebook.js` | Removed | Absent from `orders.html`. |
| `assets/js/pages/lms.js` | Removed | Absent from `orders.html`. |
| `assets/js/pages/registration.js` | Removed | Absent from `orders.html`. |
| `assets/js/pages/planner.js` | Removed | Absent from `orders.html`. |
| `assets/js/pages/directories.js` | Removed | Absent from `orders.html` after the final shell trim. |
| `assets/js/pages/student-registration.js` | Removed | Absent from `orders.html`. |
| `assets/js/pages/admin-registration.js` | Removed | Absent from `orders.html`. |

## Ownership Map

| Surface | Current owner | Evidence | Planned direction |
| --- | --- | --- | --- |
| Student-facing shell root, fallback hero/widgets, and local visual shell rules | `orders.html` | `#page-orders`, local route style block, and shared-shell entry scripts | Keep shell-only; do not add admin workflow logic here. |
| Recipient inbox list, read-state filters, and recipient detail view | `assets/js/shared/orders-workspace.js` | `renderOrdersInboxPage()`, `renderRecipientOrdersListPanelV2()`, and `renderRecipientOrdersDetailRegions()` | Keep the recipient route logic here; do not move it back into `messenger.js`. |
| Admin command-center render, recipient search/filter, compose flow, sent-orders table, and detail pane | `assets/js/shared/orders-workspace.js` | `renderAdminOrders()`, `renderAdminOrdersRecipientsPanel()`, `renderAdminOrdersComposePanel()`, and `renderAdminOrdersTablePanel()` | Keep the shared route runtime here; keep admin-only shell chrome in `admin-orders.html` plus `assets/js/pages/admin-orders.js`. |
| Faculty-scoped people helpers used by both live orders routes | `assets/js/app/app.js` | `normalizePeopleFacultyFilter()`, `isEvenSemester()`, `calculateStudentSemester()`, `getAllStaff()`, and `getAllStudents()` now live in the shared app bootstrap | Keep these helpers generic and route-agnostic; do not move orders-specific logic into them. |
| Admin theme studio modal DOM and admin-only boot | `admin-orders.html` and `assets/js/pages/admin-orders.js` | `#modal-studio` plus `bindAdminOrdersStudioControls()` / `initAdminOrdersPage()` | Keep page-local to `admin-orders.html`. |
| Admin shell root and mobile shell chrome | `admin-orders.html` | `#admin-orders-root` and the remaining mobile-shell inline script block | Keep admin-specific chrome local to the admin route. |

Notes:
- `assets/js/shared/messenger.js` no longer contains `renderOrdersInboxPage()`, `renderAdminOrders()`, `getAllStudents()`, or `getAllStaff()`.
- No open orders-specific cleanup tasks remain; reopen this tracker only for new shell/import/perf regressions or if a real attachment-preview workflow lands later.

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-17` | `orders.html`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md` | `ORD-09` | Replaced the last mojibake-heavy static fallback block in `orders.html` with clean English tabs, table headers, sample row titles, statuses, and `Open PDF` action labels; `npx vitest run test/orders-route-regressions.test.js` passed `2/2`; and a seeded Playwright verification on `http://127.0.0.1:8876/orders.html` confirmed the live `Official orders and decisions` workspace still boots with zero console/page errors and no broken mojibake markers in `#page-orders`. |
| `2026-05-18` | `orders.html`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `ORD-02` | Added unique labels to the hidden nav stubs, explicit `type="button"` attributes to the visible PDF and mobile-sheet buttons, and valid `<span class="mob-sheet-icon">` wrappers in place of the old nested `<div>`s inside the mobile action-sheet buttons; focused `html-validate` dropped `orders.html` from `43` to `27` issues; and `npx vitest run test/orders-route-regressions.test.js` stayed green. |
| `2026-05-18` | `orders.html`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `ORD-02` | Replaced the remaining static fallback tabs, table shell, sample status chips, footer controls, and mobile action-sheet icon gradients with route-owned classes in `orders.html`, removed the last trailing-whitespace validator hits, and dropped focused `html-validate` from `27` to `0`; `npx vitest run test/orders-route-regressions.test.js` passed `1/1` file and `2/2` tests. |
| `2026-05-15` | `docs/ORDERS_OPTIMIZATION_TRACKER.md` | `ORD-05` | Baseline from the master audit and source inspection of `assets/js/shared/messenger.js` showing `renderOrdersInboxPage()` and `renderAdminOrders()`. |
| `2026-05-15` | `orders.html`, `test/orders-route-regressions.test.js` | `ORD-01` | Removed dead page-pack imports and social helper imports from the shell; source scan now shows `13` external scripts. |
| `2026-05-15` | `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-04` | Documented the orders vs admin-orders ownership map with direct evidence from `orders.html`, `admin-orders.html`, `assets/js/pages/admin-orders.js`, and `assets/js/shared/messenger.js`; confirmed the student shell owns `#page-orders` while shared messenger still owns both renderers. |
| `2026-05-15` | `orders.html`, `assets/js/shared/messenger.js`, `assets/js/features/ui.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js` | `ORD-01`, `ORD-02`, `ORD-04`, `ORD-06` | Removed the final `directories.js` shell import, replaced the orders shell modal/program inline handlers with `data-*` hooks, moved the shared orders/admin-orders route actions to delegated listeners in `assets/js/shared/messenger.js`, and verified the result with `node --check assets/js/shared/messenger.js`, `node --check assets/js/features/ui.js`, and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js`; source scan now shows `12` external scripts and `0` inline handlers in `orders.html`. |
| `2026-05-15` | `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-04` | The shared source now exposes one live `renderOrdersInboxPage()` definition with no remaining legacy snapshot body, and the route regression test enforces that current count. |
| `2026-05-15` | `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-07` | Reworked the live recipient orders path to keep one shell and update hero, list, and detail regions separately; `node --check assets/js/shared/messenger.js` passed and the route regression test now asserts the region-update helper path. |
| `2026-05-15` | `assets/js/shared/messenger.js`, `test/admin-orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-04` | Reworked the live admin orders path to keep one shell and update hero, recipients, compose, sent-orders, and detail regions separately, which keeps the two live orders routes aligned on smaller region updates while the shared runtime split remains open. |
| `2026-05-15` | `orders.html`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md` | `ORD-03`, `GLOBAL-11` | Removed the prebuilt hidden announcement/event/syllabus/program modal bodies from `orders.html`, kept only the shared modal overlay shell, replaced the mobile-shell `navigate()` polling wait with the direct hook path, and re-ran `npx vitest run test/orders-route-regressions.test.js`. |
| `2026-05-15` | `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md`, `artifacts/admin-orders-efficient-desktop-summary.json`, `artifacts/admin-orders-mobile-summary.json` | `ORD-08` | Synced the existing recipient-orders browser evidence into the orders tracker: the admin-orders efficient-desktop/mobile artifact runs already include `orders.html` inbox open/read-filter/detail timings; remaining ORD-08 work is explicit scroll and attachment-preview capture. |
| `2026-05-15` | `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-03` | Removed the unreachable legacy recipient-inbox body that still sat after the live `renderOrdersInboxPage()` region-update path; `node --check assets/js/shared/messenger.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` stayed green; and direct source metrics now show one live `renderOrdersInboxPage()` definition, `0` `function renderOrdersInboxPageLegacySnapshot()` definitions, and `0` leftover `return;`-guarded unreachable recipient body patterns. |
| `2026-05-16` | `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `artifacts/orders-efficient-desktop-summary.json`, `artifacts/orders-mobile-summary.json`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-03`, `ORD-04`, `ORD-08` | Added shared order-detail region helpers, moved the live recipient route to the new detail-region path, moved the live admin route onto the same shared detail-region helpers, removed the unreachable legacy admin template block that still sat after the live `renderAdminOrders()` path, fixed the active recipient-order metadata separators, `node --check assets/js/shared/messenger.js` passed, `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed, and the new seeded desktop/mobile artifacts now record `0` errors with explicit scroll, detail-open, and `attachmentPreviewPresent: false` checks. |
| `2026-05-16` | `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-03`, `ORD-04` | Removed the dead compatibility bodies from `renderRecipientOrdersListPanel(...)` and `renderRecipientOrdersDetailPanel(...)`, leaving both as thin delegates to the live region path, and normalized the active recipient/messenger separator copy to clean `&middot;` output; `node --check assets/js/shared/messenger.js` passed and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed again. |
| `2026-05-16` | `assets/js/shared/orders-workspace.js`, `assets/js/shared/messenger.js`, `orders.html`, `admin-orders.html`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-03`, `ORD-04` | Extracted the live orders/admin-orders runtime out of `messenger.js` into `assets/js/shared/orders-workspace.js`, kept `ensureOrdersNavLinks()` in `messenger.js` as a small shared shell/helper bridge, updated both live orders pages to load the new workspace script, and re-targeted the route regressions to the new owner; `node --check assets/js/shared/orders-workspace.js` and `node --check assets/js/shared/messenger.js` passed, and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed. |
| `2026-05-16` | `assets/js/app/app.js`, `assets/js/features/navigation.js`, `assets/js/shared/messenger.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-03`, `ORD-04` | Moved the orders-nav fallback ownership to `app.js`, guarded the navigation startup call, and removed `ensureOrdersNavLinks()` from `messenger.js`, leaving only generic shared helpers behind the orders workspace dependency; `node --check assets/js/app/app.js`, `assets/js/features/navigation.js`, and `assets/js/shared/messenger.js` all passed, and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed again. |
| `2026-05-16` | `assets/js/app/app.js`, `assets/js/shared/messenger.js`, `assets/js/shared/orders-workspace.js`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `test/faculty-data-isolation.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `ORD-03`, `ORD-04` | Moved the shared faculty-scoped people helpers into `app.js`, removed those helper definitions from `messenger.js`, switched the live orders date render path to `getOrderDisplayValue(...)`, and verified the ownership boundary with `node --check assets/js/app/app.js`, `assets/js/shared/messenger.js`, and `assets/js/shared/orders-workspace.js` plus `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js test/faculty-data-isolation.test.js` (`3/3` files, `6/6` tests). |

## Next Safe Pass

1. Keep future recipient/admin orders changes inside `assets/js/shared/orders-workspace.js`, not `messenger.js`.
2. Keep faculty-scoped people helpers generic in `assets/js/app/app.js`; do not reintroduce orders-specific logic there.
3. If a real attachment workflow is added later, keep it region-scoped and update the seeded desktop/mobile artifacts to cover the new preview path explicitly.
