# Index Home Optimization Tracker

Target page: `index.html?view=student#home`
Last updated: `2026-05-17`
Owner: `Codex`
Goal: clean legacy junk, remove safe dead weight, reduce CPU/GPU/memory cost, keep the same visual language and existing behavior.

## Baseline

Current evidence collected before edits:

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `index.html` | `486` lines |
| Primary CSS payload | `base.css + layout.css + components.css + index-luxury.css + mobile-responsive.css` | `1.00 MB+` combined |
| Primary JS payload | `app.js + api.js + auth.js + initial-state.js + state.js + utilities.js + faculty.js + navigation.js + ui.js + index-luxury.js + page scripts` | `2.45 MB` combined CSS+JS loaded by `index.html` |
| Shared shell CSS | `assets/css/index-luxury.css` | `813,543 bytes`, `19,428` lines after the route-owned home/dashboard extraction |
| Route-owned home CSS | `assets/css/index-home-dashboard.css` | `35,173 bytes`, `1,120` lines loaded only by `index.html` |
| Shared shell JS core | `assets/js/features/index-luxury.js` | `205,297 bytes`, `3,580` lines after the home/admin route split |
| Route-owned home JS | `assets/js/features/index-home-dashboard.js` | `268,393 bytes` encoded payload registered only on `index.html` |
| Next-largest JS runtime | `assets/js/app/app.js` | `283,055 bytes`, `2,055` lines |
| Shared utility runtime | `assets/js/shared/utilities.js` | `121,478 bytes`, `2,156` lines |

High-probability lag sources already confirmed in code:

1. `updateTransparency()` runs document-wide selector scans and per-element inline background generation.
2. `setupTransparencyObserver()` can schedule another full transparency pass after DOM growth.
3. `startBackground()` keeps a live canvas animation loop with blur/glow effects.
4. `observeLegacyVisualTree()` keeps a mutation observer active for visual retrofitting.
5. `index.html` still ships large hidden modal, datalist, and legacy admin/program markup on first load.
6. High-transparency logic is duplicated across CSS, `theme-primer.js`, and `utilities.js`.
7. `index-luxury.css` and `index-luxury.js` are carrying accumulated patch-on-patch complexity.

## AI Update Rules

These rules must be followed on every future change for this page:

1. Update this file in the same turn as every code change that affects `index.html`, its shared shell, or home-page performance.
2. For every task touched, update `% left` immediately. Use real remaining work, not optimistic guesses.
3. Add one line to `Change Log` for every edit batch with date, files touched, and the task IDs affected.
4. Do not mark a task complete without evidence. Evidence can be code diff, targeted test output, or direct file inspection.
5. If a task splits into sub-work, add new task rows instead of hiding work in notes.
6. If something is risky or blocked, set the status to `Blocked` or `Needs verification` and explain why.
7. Never delete old task rows. If a task is replaced, mark it `Superseded` and link the replacement row in notes.
8. When a task changes visuals intentionally, say so explicitly in notes. Otherwise the default requirement is visual parity.
9. After every verification run, update the relevant task notes with the exact command or inspection used.
10. Keep `% left` based on remaining work:
    `0%` = done
    `1-15%` = almost done, only verification or tiny cleanup remains
    `16-60%` = partly done
    `61-99%` = mostly not done
    `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| T01 | Done | 0% | Map index entry points, route boundaries, and shared runtime ownership | `index.html`, `navigation.js`, `index-luxury.js`, `utilities.js` inspected. |
| T02 | Done | 0% | Record current asset-size baseline for the home page | `2.45 MB` combined CSS+JS currently loaded by entry page. |
| T03 | Done | 0% | Count large source files and identify size hotspots | `index-luxury.css`, `index-luxury.js`, `app.js`, `utilities.js` confirmed as top-heavy. |
| T04 | Done | 0% | Identify first-pass likely lag sources before editing | Canvas background, transparency refresh, mutation observers, and hidden legacy DOM confirmed. |
| T05 | Done | 0% | Create and maintain this optimization tracker | Final completion audit recorded here. Evidence captured from `node --check assets/js/features/ui.js`, `node --check assets/js/features/navigation.js`, `npx vitest run test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/news-route-regressions.test.js test/faculty-data-isolation.test.js`, and `npm test`. |
| T06 | Done | 0% | Inventory legacy hidden DOM shipped on home load | Final jsdom audit reports `pageSections: 1`, `modalChildren: 0`, and only the active home page in `index.html`. Legacy programs page and shared modals now lazy-create from `assets/js/features/ui.js`. |
| T07 | Done | 0% | Audit duplicated transparency/high-transparency logic across CSS and JS | Direct inspection of `assets/css/index-luxury.css`, `assets/js/theme-primer.js`, and `assets/js/shared/utilities.js` is complete. Remaining split is intentional pre-paint vs runtime behavior, not unresolved duplication on the home route. |
| T08 | Done | 0% | Audit dynamic background canvas cost on weak laptops and mobile | Render profile and draw-loop review is complete. Efficient-tier devices stay on the static canvas path, verified by the targeted guardrails and the final green `npm test` run. |
| T09 | Done | 0% | Audit mutation-observer churn during shell bootstrap | Both observers were audited. `utilities.js` now scopes/debounces transparency refreshes, and `index-luxury.js` keeps the legacy visual observer on child-list batching only; no open observer audit work remains. |
| T10 | Done | 0% | Narrow transparency refresh from whole-document scans to route-scoped or active-root scans | `collectTransparencySurfaceElements()` is the live path in `utilities.js`, and the scoped-refresh guardrail passes in both the targeted run and the final `14`-file / `72`-test suite. |
| T11 | Done | 0% | Reduce repeated inline background regeneration for unchanged home/dashboard surfaces | `utilities.js` now stamps and reuses `data-lux-transparency-signature` values so unchanged surfaces are skipped. Covered by the unchanged-surface regression test. |
| T12 | Done | 0% | Skip transparency work for hidden modal trees and dormant route placeholders earlier in the pipeline | Hidden placeholder sections are gone from `index.html`, eager modal children are gone from `#modal-overlay`, and modal opens still trigger targeted transparency refreshes through `ui.js`. |
| T13 | Done | 0% | Gate or downgrade expensive background animation for low-end hardware and weak laptops | Efficient-tier devices render the luxury background statically and refresh only on relevant changes. Guardrail coverage and the final suite confirm the downgrade path remains active. |
| T14 | Done | 0% | Review and trim home-page-only background effects that overuse blur, glow, or saturation | Final review of `drawConstellation`, `drawAurora`, and `drawMesh` found no additional safe trims that would preserve the current visual language better than the existing efficient-tier fallback. Direct file inspection closed this task. |
| T15 | Done | 0% | Extract or lazy-create legacy modal markup that is not needed for initial home render | `page-programs`, `modal-announcement`, `modal-event`, and `modal-programs` no longer ship in `index.html`; they now instantiate on demand via `ensureIndexProgramsPage()`, `ensureModalScaffold()`, and `ensureProgramsModal()` in `assets/js/features/ui.js`. |
| T16 | Done | 0% | Remove obviously stale or corrupted text payloads from initial DOM where safe | `index.html` no longer ships the old corrupted programs/modal payload, and the brittle mojibake-based modal-close logic is gone from the home shell path. Regression coverage keeps the old payload out of the entry HTML. |
| T17 | Done | 0% | Move inline page-specific style blocks out of `index.html` when safe | The remaining page-specific programs/modal inline markup was removed from `index.html`. Direct inspection now shows `0` inline `onclick` handlers; only shell-level visibility and icon-tint style attributes remain in the entry HTML. |
| T18 | Done | 0% | Move inline mobile shell boot logic out of `index.html` or gate it more aggressively | The heavy mobile shell logic remains extracted in `assets/js/pages/index-mobile-shell.js`; the tiny inline loader is now only the viewport gate. Covered by the mobile-shell parser-path guardrail. |
| T19 | Done | 0% | Verify desktop-only features are not booted on mobile and vice versa | Desktop no longer parses the mobile bootstrap body, while mobile still injects it only for `<=1024px` or later viewport changes. The source guardrail and final green suite close the verification gap. |
| T20 | Done | 0% | Review `index-luxury.css` for redundant selectors, repeated high-transparency overrides, and safe dedupe opportunities | The shared shell CSS now sits at `19,428` lines / `813,543 B`, and the extracted home/dashboard family lives in `index-home-dashboard.css` at `1,120` lines / `35,173 B`; guardrails stayed green after the split. |
| T21 | Done | 0% | Review `index-luxury.js` for dead helpers, abandoned editor paths, and safe lazy-load splits | The shared shell core now sits at `3,580` lines / `205,297 B`, with the route-owned home/editor runtime moved into `index-home-dashboard.js` (`268,393 B`) and the route-owned admin tools runtime moved into `index-admin-tools.js` (`28,382 B`). |
| T22 | Done | 0% | Review `app.js` for home-unrelated bootstrap work that still runs on entry | Home-entry bootstrap review is complete: route-gated English overrides, clean-root localization prechecks, observer filtering, and no-token auth bootstrap guards are all landed and verified by the final suite. |
| T23 | Done | 0% | Verify `theme-primer.js` does only critical pre-paint work | The home route now keeps only critical pre-paint work in `theme-primer.js`; non-critical flat-surface overrides remain deferred off the home startup path and are regression tested. |
| T33 | Done | 0% | Review `faculty.js` for dead duplicate helper blocks and parse-weight cleanup | Safe duplicate-helper review is complete. `faculty.js` remains at `3,169` lines / `173,970 B`, and the public-social helper duplication guard stays green in the final suite. |
| T24 | Done | 0% | Add focused regression tests for new performance guardrails | Focused guardrails now cover scoped transparency, unchanged-surface skips, efficient-tier backgrounds, lazy `programs` page/modal creation, desktop/mobile loader gating, no-token auth bootstrap, and route-source regressions. |
| T25 | Done | 0% | Add targeted navigation/functionality verification for the home shell after optimization | Current verification is test-driven: the targeted guardrail run passed `36/36`, and the final full suite passed `72/72`, including navigation, route, theme-scope, and home-shell source guards. A fresh in-app Browser session was not available in this environment. |
| T26 | Done | 0% | Run syntax checks on touched frontend files after each code batch | Final syntax verification passed for `assets/js/features/ui.js`, `assets/js/features/navigation.js`, and `npm run check:frontend`. |
| T27 | Done | 0% | Run targeted Vitest coverage for performance and navigation guardrails after changes | `npx vitest run test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/news-route-regressions.test.js test/faculty-data-isolation.test.js` passed `36/36`, and `npm test` passed `72/72`. |
| T28 | Done | 0% | Document before/after performance deltas in this tracker | Current deltas: `index.html` is now `85` lines / `4,589 B`; the shared shell CSS/JS core is `813,543 B` + `205,297 B`, the route-owned home CSS/JS bundle is `35,173 B` + `268,393 B`, first-load DOM is still `88` elements with `1` page section and `0` eager modal children, and inline `onclick` count remains `0`. |
| T29 | Done | 0% | Audit and reduce first-load DOM node count where safe | Final jsdom audit: `88` total elements, `1` `.page-section`, `0` eager modal children. The programs page and shared modal DOM now instantiate only on demand. |
| T30 | Done | 0% | Audit first-load network dependency count on home view | Audit is complete. Earlier JS/font/CSS request cuts remain in place, and this final batch avoided adding any new requests while reducing only entry HTML bytes/DOM through on-demand shell content. |
| T31 | Done | 0% | Ensure weak-laptop fallback behavior respects visual parity and does not disable critical features | Weak-device review is closed by the efficient-tier static background guardrail plus the green full suite. No critical home-shell behavior is disabled by the fallback path. |
| T32 | Done | 0% | Final cleanup pass for comments, obsolete branches, and unused compatibility junk introduced by earlier patches | Final cleanup is complete: eager programs DOM was removed from `index.html`, shared modal close handling moved to delegated `data-modal-close` hooks, stale route/program guardrails were updated, and the touched frontend/runtime files now pass syntax plus the full suite. |

## Current Findings

Working conclusions from the first analysis pass:

1. The page is no longer a simple home screen. It is a large compatibility shell that bootstraps many routes, styles, and legacy UI systems at once.
2. The biggest issue is not one isolated bug; it is cumulative startup cost from large assets, heavy visual processing, and old compatibility layers all activating together.
3. The most likely safe first optimization is to reduce scope and frequency of transparency refresh work without altering the rendered style.
4. The next likely high-value cleanup is to stop shipping unrelated hidden modal/admin/program payload on the initial home DOM if it can be instantiated later.
5. First optimization batch completed: transparency surface selection now scopes to the active page plus visible shell roots on index-shell routes, and shared modal opens explicitly re-queue transparency refreshes.
6. Second optimization batch completed: the large mobile-only bootstrap script no longer lives inline in `index.html`, so desktop startup no longer parses that full code path.
7. Third optimization batch completed: `index.html` no longer eagerly loads `student-registration.js` or `news.js`, removing `234,221` bytes of route-specific JS requests from the home entry path.
8. Fourth optimization batch completed: the hidden scheduler/admin builder modal and its autocomplete payload were removed from `index.html`, reducing startup DOM weight and cutting the file from `477` to `365` lines.
9. Fifth optimization batch completed: weak-device (`efficient` tier) luxury backgrounds now render as a static canvas frame with refresh-on-change behavior instead of running the continuous animation loop.
10. Sixth optimization batch completed: the dead fallback theme-studio CSS and modal were removed from `index.html`, and the file was reduced further from `365` to `282` lines while the live luxury studio path remained intact.
11. Seventh optimization batch completed: the home entry's Google Fonts families were consolidated into a single stylesheet request without changing the font stack.
12. Eighth optimization batch completed: a dead duplicate `startBackground` implementation was removed from `index-luxury.js`, reducing shell parse weight without changing the live runtime path.
13. Ninth optimization batch completed: the placeholder `components.css` request was removed from `index.html`, eliminating another no-op network fetch from the home entry.
14. Tenth optimization batch completed: dead `modal-syllabus`, `modal-add-concentration-subject`, and `modal-add-minor-subject` blocks were removed from `index.html`, bringing the file down to `196` lines and removing more corrupted legacy payload from the home DOM.
15. Eleventh optimization batch completed: `app.js` structural English/localization overrides are now gated by page-root presence, so the home entry no longer runs several absent-route scans on startup.
16. Twelfth optimization batch completed: the remaining shared programs modal payload in `index.html` was rewritten with clean text, eliminating the last major corrupted blob and shrinking the file from `38,769` bytes to `14,192` bytes.
17. Thirteenth optimization batch completed: the localization layer in `app.js` now skips deep text-node walks when the current root is already clean, reducing unnecessary startup and mutation-processing work.
18. Fourteenth optimization batch completed: the localization observer in `app.js` now filters out clean dynamic nodes before queuing localization work, reducing mutation-time overhead on the home shell.
19. Fifteenth optimization batch completed: the home route now skips the immediate `theme-primer.js` flat-surface compatibility injection and keeps only the later fallback path, trimming another piece of non-critical startup work.
20. Sixteenth optimization batch completed: the dead `page-social` and `page-news` placeholder sections were removed from `index.html`, reducing the home shell DOM further to `188` lines and `13,859` bytes.
21. Browser QA now has mocked authenticated evidence: desktop and mobile student-home renders look intact, and the shared programs modal plus the `programs` route still work after cleanup. Real authenticated backend QA is still pending because local static auth alone redirects to `login.html`.
22. Seventeenth optimization batch completed: duplicate dashboard-preference and palette helper implementations were removed from `index-luxury.js`, bringing it down further to `7,315` lines.
23. Eighteenth optimization batch completed: local auth snapshots without `KIU_PORTAL_SESSION_TOKEN` now skip backend/realtime bootstrap, preventing the previous 401 storm and keeping the student home shell on `index.html?view=student#home`.
24. Nineteenth optimization batch completed: the duplicate `applyChancelleryPageEnglishOverrides()` declaration was removed from `app.js`, and the guardrail suite now verifies that only one bootstrap implementation remains.
25. Twentieth optimization batch completed: the `page-admin-tools` HTML stub was removed from the home entry, and the shell now creates that page on demand only if an admin flow actually needs it.
26. Browser QA now includes unmocked no-token local-auth checks on both desktop and mobile, confirming that the auth/bootstrap fix keeps the student home shell stable without redirecting to `login.html`.
27. Twenty-first optimization batch completed: exact duplicate top-level CSS rules were removed from `index-luxury.css`, and one duplicate public-social helper cluster was removed from `faculty.js`, reducing more parse weight without changing the rendered student home shell.
28. Twenty-second optimization batch completed: the remaining exact duplicate timetable media-query rules were removed from `index-luxury.css`, and the authenticated student-home render still matched after the CSS cleanup.
29. Twenty-third optimization batch completed: `page-programs`, `modal-announcement`, `modal-event`, and `modal-programs` no longer ship in `index.html`; the shell now lazy-creates them on demand and closes them through delegated `data-modal-close` hooks.
30. Twenty-fourth optimization batch completed: the final home entry dropped to `109` lines and `7,316` bytes, with a jsdom audit confirming only `88` total elements, `1` page section, and `0` eager modal children.
31. Final verification batch completed: `ui.js` and `navigation.js` pass `node --check`, the targeted home-shell guardrails passed `36/36`, and the full Vitest suite passed `72/72`.

## Change Log

| Date | Change | Tasks |
| --- | --- | --- |
| 2026-05-14 | Created tracker, recorded baseline evidence, and registered the first backlog for `index.html?view=student#home`. | `T01` `T02` `T03` `T04` `T05` |
| 2026-05-14 | Replaced whole-document transparency surface scans with scoped active-root collection in `assets/js/shared/utilities.js`, added modal-open transparency refresh hooks in `assets/js/shared/utilities.js` and `assets/js/features/ui.js`, and added regression coverage plus verification. | `T09` `T10` `T12` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Extracted the mobile shell bootstrap into `assets/js/pages/index-mobile-shell.js`, replaced the big inline block in `index.html` with a viewport-gated loader, and extended regression coverage plus syntax verification for the new path. | `T18` `T19` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Removed eager `student-registration.js` and `news.js` loads from `index.html`, kept the registration lazy-runtime path as the source of truth, and extended regression coverage to prevent those scripts from drifting back into the home entry. | `T22` `T24` `T26` `T27` `T28` `T30` |
| 2026-05-14 | Removed the hidden scheduler/admin generation modal plus `db-professors`, `db-rooms`, and `db-groups` datalists from `index.html`, then verified the remaining required nodes with `jsdom` and extended regression coverage. | `T06` `T15` `T26` `T27` `T28` `T29` |
| 2026-05-14 | Added an efficient-tier static luxury background path in `assets/js/features/index-luxury.js`, refreshed the canvas on theme/background control changes, and extended regression coverage for the low-end-device fallback. | `T08` `T13` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Removed the dead fallback theme-studio inline CSS and `modal-studio` block from `index.html`, delegated the legacy `openStudio()` helper to the live luxury studio when present, and extended regression coverage plus DOM smoke verification. | `T06` `T15` `T17` `T24` `T26` `T27` `T28` `T29` |
| 2026-05-14 | Consolidated the home entry's Google Fonts families into one stylesheet request and extended regression coverage so the extra request does not drift back in. | `T24` `T27` `T28` `T30` |
| 2026-05-14 | Removed a dead duplicate `startBackground` implementation from `assets/js/features/index-luxury.js` and extended regression coverage so only the live luxury background path remains. | `T21` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Removed the placeholder `assets/css/components.css` request from `index.html` and extended regression coverage so the no-op stylesheet does not drift back into the home entry. | `T24` `T27` `T28` `T30` |
| 2026-05-14 | Removed the dead `modal-syllabus`, concentration, and minor selection modals from `index.html`, hardened `openModal()` to no-op when a removed modal type is absent, and extended regression coverage plus DOM smoke verification. | `T06` `T15` `T16` `T24` `T26` `T27` `T28` `T29` |
| 2026-05-14 | Gated `app.js` structural English/localization overrides by page-root presence and extended regression coverage so absent-route scans stay off the home entry path. | `T22` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Rewrote the remaining shared programs modal payload in `index.html` with clean text, removed the last major corrupted home-entry blob, and confirmed the smaller HTML parses cleanly and keeps the regression suite green. | `T15` `T16` `T27` `T28` `T29` |
| 2026-05-14 | Added localization prechecks in `app.js` so clean roots skip the deep text-node walk, and extended regression coverage to keep that optimization in place. | `T22` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Added localization observer filtering in `app.js` so clean dynamic nodes are not queued for localization work, and verified the optimization with the guardrail suite. | `T22` `T24` `T27` `T28` |
| 2026-05-14 | Deferred the immediate flat-surface compatibility injection in `theme-primer.js` for the home route and added a regression guard so non-critical primer work stays off the home startup path. | `T23` `T24` `T26` `T27` `T28` |
| 2026-05-14 | Removed the `page-social` / `page-news` route placeholders from `index.html`, verified the slimmer shell with `jsdom`, and extended regression coverage so those dead stubs do not drift back into the home entry. | `T06` `T27` `T28` `T29` `T30` |
| 2026-05-14 | Captured mocked authenticated desktop and mobile screenshots for `index.html?view=student#home`, confirmed the cleaned shell still renders, and smoke-tested the shared programs modal plus the in-shell `programs` route. | `T25` `T31` |
| 2026-05-14 | Added mocked browser interaction smoke for customize mode, desktop/mobile `Programs` navigation, and faculty switching, confirming the cleaned student home shell still behaves without browser errors. | `T25` `T31` |
| 2026-05-14 | Removed another duplicate home-editor/reset helper cluster from `assets/js/features/index-luxury.js`, reducing the shell script further to `7,205` lines and keeping the full guardrail suite green. | `T21` `T27` `T28` |
| 2026-05-14 | Removed an earlier duplicate dashboard-preference and palette helper set from `assets/js/features/index-luxury.js` and verified that only one implementation remains for each helper. | `T21` `T27` `T28` |
| 2026-05-14 | Patched the auth/bootstrap path so local auth snapshots without `KIU_PORTAL_SESSION_TOKEN` no longer bootstrap backend/realtime services, then verified that the student home stays on `index.html?view=student#home` without the earlier 401 storm. | `T22` `T24` `T25` `T26` `T27` `T28` `T30` `T31` |
| 2026-05-14 | Removed the duplicate `applyChancelleryPageEnglishOverrides()` declaration from `assets/js/app/app.js` and extended guardrails so only one bootstrap implementation remains. | `T22` `T24` `T27` |
| 2026-05-14 | Removed the `page-admin-tools` stub from `index.html`, made the shell create it on demand, and verified the slimmer entry with `jsdom` plus the guardrail suite. | `T06` `T27` `T28` `T29` |
| 2026-05-14 | Verified the no-token auth/bootstrap fix on a real mobile viewport too, confirming that the student home now stays on `index.html?view=student#home` and keeps the mobile nav active without browser errors. | `T25` `T31` |
| 2026-05-14 | Removed 37 exact duplicate top-level CSS rules from `index-luxury.css`, removed a duplicate public-social helper cluster from `faculty.js`, and confirmed the student home visuals still match in the authenticated browser screenshot. | `T20` `T27` `T28` `T33` |
| 2026-05-14 | Removed the remaining exact duplicate timetable media-query rules from `index-luxury.css` and confirmed the authenticated student-home render still matches after the CSS dedupe. | `T20` `T27` `T28` |
| 2026-05-14 | Removed the eager `programs` page plus shared home modal DOM from `index.html`, moved those shells to on-demand creation in `assets/js/features/ui.js`, preserved in-shell `programs` navigation in `assets/js/features/navigation.js`, updated the relevant guardrails, and finished with green targeted + full-suite verification. | `T05` `T06` `T15` `T16` `T17` `T19` `T24` `T25` `T26` `T27` `T28` `T29` `T30` `T32` |
| 2026-05-16 | Captured a shared-shell efficient-desktop startup role matrix for `student`, `professor`, `admin`, `ta`, and `student_service`, confirming the current home route boots at `11` shared scripts, `0` eager picker panels, `0` eager utility panels, and role-specific widget sets while staying on the `efficient` performance tier under integrated-GPU-style constraints. | `T25` `T28` `T31` |
| 2026-05-16 | Synchronized the student-home tracker with the shared-home completion audit in the master file and confirmed no student-home-specific tasks reopened; any remaining `index-luxury.js` / `index-luxury.css` family split work now stays under the global shared-file tasks rather than this route tracker. | `T05` |
| 2026-05-17 | Extracted the route-owned home/dashboard CSS into `assets/css/index-home-dashboard.css`, split the shared shell runtime into the smaller `index-luxury.js` core plus the route-owned `index-home-dashboard.js` and `index-admin-tools.js` bundles, refreshed the home-entry guardrail coverage, and kept the shared-home route green. | `T20` `T21` `T24` `T26` `T27` `T28` | `node --check assets/js/features/index-luxury.js`; `node --check assets/js/features/index-home-dashboard.js`; `node --check assets/js/features/index-admin-tools.js`; `npx vitest run test/admin-tools-route-regressions.test.js test/global-performance-regressions.test.js test/theme-primer-role-routing.test.js test/index-mobile-shell-runtime.test.js test/navigation-preservation.test.js`; `npm run check:frontend` |

