# Personal Data Optimization Tracker

Target page: `personal-data.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep the personal-data route readable and visually stable while trimming dead route-pack imports, moving page-local CSS out of the HTML shell, removing shell-level inline/polling debt, and documenting overlap with profile routes before larger behavior cleanup.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `personal-data.html` | `23,348 bytes` after removing the unproven `messenger.js` shell import |
| External scripts | `12` | `11` deferred scripts plus `theme-primer.js` in the head |
| Page runtime | `assets/js/pages/personal-data-page.js` | `9,204 bytes` |
| Inline handlers | `0` | Toolbar actions now bind through `data-personal-data-nav-target` instead of inline `onclick` |
| Inline style blocks | `0` | Route-local CSS now lives in `assets/css/personal-data-route.css` |
| Route stylesheet | `assets/css/personal-data-route.css` | `18,530 bytes` |
| Mobile shell polling loops | `0` | The mobile shell now uses `ensureNavigateHooks()` instead of a startup `setInterval(...)` wait |
| Shared/page-pack imports | Trimmed | Dead social helper imports and the seven eager page-pack imports are removed from the shell |

## Current Findings

1. `personal-data.html` is no longer paying for the dead social helper trio or the seven eager page-pack imports that had no direct personal-data ownership.
2. The page no longer keeps route-local CSS in the HTML head; that styling now lives in `assets/css/personal-data-route.css`.
3. The route-specific surface is now owned by `assets/js/pages/personal-data-page.js`, while shared shell helpers still provide theme/transparency, shell wiring, portal messenger/notification behavior through `faculty.js`, and academic-context helper functions.
4. The shell no longer has inline toolbar actions or a mobile-shell polling wait; the toolbar now uses delegated `data-personal-data-nav-target` actions and the mobile shell uses a direct `ensureNavigateHooks()` path.
5. The overlap with `profile.html` and `profile-view.html` is now clearer: `personal-data` is a read-only academic record summary, `profile.html` is the self-edit tabbed profile route, and `profile-view.html` is the viewer/admin session route.
6. The current shared-candidate layer is small: avatar fallback, faculty/program labels, identity summary strings, and academic record formatting appear reusable, while the page shells and workflows are distinct.
7. The dedicated page controller now splits the route into identity, summary, facts, and record-section renderers, and the record section already updates through keyed DOM nodes instead of a joined `innerHTML` rewrite.
8. Real desktop/mobile browser QA now exists for route open and rerender with the built-in admin-testing student persona, and those artifacts also prove the current live route has no editable form or attachment preview flow.

## AI Update Rules

1. Update this file in the same turn as every meaningful change to `personal-data.html` or any future page-owned personal-data module or stylesheet.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct source inspection or targeted command/test output.
5. Preserve the current personal-data visual hierarchy unless a task explicitly changes it.
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
| PDATA-01 | Done | 0% | Remove unrelated route imports and keep only the modules that personal data actually needs | Dead social helpers and the seven eager page-pack imports are gone from the shell. |
| PDATA-02 | Done | 0% | Split personal data, identity cards, and attachments into smaller route-owned sections that lazy-render | The route now has dedicated identity, summary, facts, and record renderers; no attachment panel exists in the live route, so no extra lazy mount is currently needed. |
| PDATA-03 | Done | 0% | Move page-local style blocks into a dedicated stylesheet so data forms stop living inside HTML | Route-local CSS now lives in `assets/css/personal-data-route.css`; the HTML shell has `0` `<style>` blocks left. |
| PDATA-04 | Done | 0% | Audit whether profile and personal-data routes duplicate the same rendering and should share a thinner runtime | The audit is complete: keep the page shells separate and limit any future sharing to thinner identity-summary helpers only. |
| PDATA-05 | Done | 0% | Create a page tracker for this route | This file is the dedicated tracker. |
| PDATA-06 | Done | 0% | Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict | See the import table below. |
| PDATA-07 | Done | 0% | Replace any whole-form or whole-tab rerender paths with smaller updates for changed fields and validation states | `renderPersonalDataPageContext(...)` now syncs `#personal-data-records-body` through keyed DOM rows instead of a joined `innerHTML` rewrite. |
| PDATA-08 | Done | 0% | Add weak-laptop and mobile checks for form open, edit, save, and attachment preview flows | The current live route has no editable form or attachment preview flow; desktop/mobile artifacts now explicitly record that absence while timing open/rerender behavior. |
| PDATA-09 | Done | 0% | Remove shell inline handlers and startup polling from the personal-data toolbar and mobile shell | Toolbar buttons now use `data-personal-data-nav-target` listeners and the mobile shell no longer waits on `navigate()` with `setInterval(...)`. |

## Import Notes

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | Standalone shell still primes route theme classes before deferred boot. |
| `assets/js/app/app.js` | Keep | Shared shell bootstrap plus page copy overrides for `#page-personal-data`. |
| `assets/js/app/api.js` | Keep | Shared auth/API layer for the shell. |
| `assets/js/app/auth.js` | Keep | Required for portal auth/session state. |
| `assets/js/data/initial-state.js` | Keep | Shared state bootstrap. |
| `assets/js/app/state.js` | Keep | Shared state and route wiring. |
| `assets/js/shared/utilities.js` | Keep | Route transparency/theme selectors explicitly include personal-data surfaces. |
| `assets/js/shared/faculty.js` | Keep for shared helpers | Still owns `program-context-select`, avatar fallback, program/academic-context helpers, and personal-data support functions, but no longer owns the live route renderer. |
| `assets/js/features/navigation.js` | Keep | Toolbar and mobile shell still rely on `navigate(...)`. |
| `assets/js/features/ui.js` | Keep | Shared shell UI helpers. |
| `assets/js/features/index-luxury.js` | Keep | Shared shell theme pipeline and messenger badge rendering. |
| `assets/js/pages/personal-data-page.js` | Keep | Dedicated route-owned controller for the identity, summary, facts, and record sections. |
| `assets/js/shared/messenger.js` | Removed | `personal-data.html` no longer imports it eagerly; `faculty.js` already owns `renderPortalMessengerWorkspace()` and `openPortalNotificationFullModal()` for the shared shell surfaces this route still exposes. |
| `assets/js/shared/social-hub.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/shared/social-render.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/shared/social-media.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/gradebook.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/lms.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/registration.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/planner.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/directories.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/student-registration.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |
| `assets/js/pages/admin-registration.js` | Removed | No direct `personal-data` selectors or route ownership references remain after source inspection. |

## Overlap Notes

| Route | Current ownership | Shared candidate | Key divergence |
| --- | --- | --- | --- |
| `personal-data.html` | `assets/js/pages/personal-data-page.js` plus route-local shell HTML | Avatar fallback, faculty/program labels, academic summary formatting | Read-only academic record summary with KPI cards and record list |
| `profile.html` | Inline/tabbed self-profile shell plus shared route packs | User identity summary strings and some academic/profile labels | Self-edit tabs (`info`, `email`, `password`, `calendar`) and account-management workflow |
| `profile-view.html` | Standalone viewer/admin shell plus planner/directories helpers | Avatar/name/program/status presentation and academic context labels | Viewer/admin route with session tools, schedule actions, and admin-only controls |

Current conclusion:
- Do not force one shared page shell across these three routes.
- A thinner shared identity-summary helper layer is plausible later, but only after the remaining personal-data/profile import cleanup is done.

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md` | `PDATA-05` | Baseline from `personal-data.html` source inspection: `49,205 bytes`, `23` external scripts, `3` inline handlers, `2` `<style>` blocks, and `1` mobile-shell `setInterval(...)` wait. |
| `2026-05-15` | `personal-data.html`, `assets/css/personal-data-route.css`, `test/personal-data-route-regressions.test.js`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md` | `PDATA-03` | Extracted the live route-local CSS into `assets/css/personal-data-route.css`, removed both HTML `<style>` blocks from `personal-data.html`, and verified the result with `npx vitest run test/personal-data-route-regressions.test.js`. |
| `2026-05-15` | `personal-data.html`, `test/personal-data-route-regressions.test.js`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md` | `PDATA-01`, `PDATA-06` | Removed the dead social helper trio and the seven eager page-pack imports from `personal-data.html`, then documented the current keep/remove table with direct selector and ownership evidence; `npx vitest run test/personal-data-route-regressions.test.js` stayed green. |
| `2026-05-15` | `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PDATA-04` | Compared `personal-data.html`, `profile.html`, `profile-view.html`, `assets/js/shared/faculty.js`, and `assets/js/pages/registration.js`; current evidence shows a small shared identity-summary candidate layer but distinct page shells and workflows. |
| `2026-05-15` | `personal-data.html`, `assets/js/shared/faculty.js`, `test/personal-data-route-regressions.test.js`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md` | `PDATA-07`, `PDATA-09` | Replaced the three toolbar `navigate(...)` inline handlers with delegated `data-personal-data-nav-target` actions, removed the mobile-shell `setInterval(...)` wait in favor of `ensureNavigateHooks()`, and rechecked the renderer: `personal-data.html` is now `23,347 bytes` with `12` external scripts, `0` inline handlers, `0` `<style>` blocks, and `0` polling waits; `renderPersonalDataPageContext(...)` already updates most fields individually and only rewrites `#personal-data-records-body`; `npx vitest run test/personal-data-route-regressions.test.js` passed. |
| `2026-05-15` | `assets/js/shared/faculty.js`, `test/personal-data-route-regressions.test.js`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PDATA-07` | Replaced the remaining `#personal-data-records-body` joined HTML rewrite with a keyed DOM-row sync path in `renderPersonalDataPageContext(...)`; `node --check assets/js/shared/faculty.js` passed; `npx vitest run test/personal-data-route-regressions.test.js` stayed green; and source scans now show `syncPersonalDataRecordItems(...)` plus `data-personal-data-record-key` markers with no `recordsBody.innerHTML = recordItems.map(...)` fallback left. |
| `2026-05-15` | `assets/js/pages/personal-data-page.js`, `personal-data.html`, `assets/js/shared/faculty.js`, `test/personal-data-route-regressions.test.js`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PDATA-02`, `PDATA-04` | Extracted the personal-data renderer out of `assets/js/shared/faculty.js` into `assets/js/pages/personal-data-page.js`, split the route into identity/summary/facts/records section renderers, kept the shared helper layer in `faculty.js`, updated `personal-data.html` to load the dedicated controller, `node --check assets/js/pages/personal-data-page.js` passed, `node --check assets/js/shared/faculty.js` passed again, and `npx vitest run test/personal-data-route-regressions.test.js` stayed green; direct source metrics now show `23,438` bytes, `13` external scripts, `1` page runtime, and a dedicated controller size of `9,204` bytes. |
| `2026-05-16` | `artifacts/personal-data-efficient-desktop-summary.json`, `artifacts/personal-data-mobile-summary.json`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PDATA-02`, `PDATA-04`, `PDATA-08` | Captured real desktop/mobile Playwright artifacts against `http://127.0.0.1:8899/personal-data.html` using the built-in admin-testing student persona: the efficient-desktop artifact reports `firstReadyMs: 1605`, `rerenderMs: 15`, `recordItems: 10`, `metricCards: 4`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors; the mobile artifact reports `firstReadyMs: 1405`, `rerenderMs: 29`, `recordItems: 10`, `metricCards: 4`, `mobileNavVisible: true`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors. The artifacts confirm the live route is already split into route-owned regions and that no attachment or save/edit flow remains to lazy-mount or QA separately. |
| `2026-05-16` | `personal-data.html`, `test/personal-data-route-regressions.test.js`, `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PDATA-01` | Removed the unproven `assets/js/shared/messenger.js` shell import from `personal-data.html`; `npx vitest run test/personal-data-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `12` external scripts, no `messenger.js` import, and `assets/js/shared/faculty.js` still exposes `renderPortalMessengerWorkspace()` plus `openPortalNotificationFullModal()` for the shared shell surfaces. |

## Next Safe Pass

No personal-data-specific cleanup tasks remain open. If the route grows again, keep new flows route-owned and only share thin identity-summary helpers with the profile family.
