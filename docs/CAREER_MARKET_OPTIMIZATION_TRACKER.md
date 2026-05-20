# Career Market Optimization Tracker

Target page: `career-market.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep the AI career analyst route usable while moving source code out of the HTML shell, proving what still belongs to the shared luxury shell, and shrinking transcript/history rerender cost before deeper feature splits.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `career-market.html` | `20,057 bytes` after extracting the giant inline `<style>` block and moving the provider/tool modals behind templates |
| Route stylesheet | `assets/css/career-market-route.css` | `79,904 bytes`, `1,922` lines |
| Route runtime | `assets/js/pages/career-market.js` | `130,355 bytes`, `2,196` lines |
| External scripts | `13` | Direct script inventory in `career-market.html` |
| Inline style blocks | `0` | Direct source scan of `career-market.html` |
| Inline handlers | `0` | Direct source scan of `career-market.html` |
| Remaining HTML `style=` attrs | `10` | Mostly nav stubs, mobile badges, and quick-action icon gradients |
| Shared-shell dependency proof | Present | `career-market.js` still calls shared-shell hooks such as `navigate(...)`, `lux-topbar-editor-btn`, `lux-studio-backdrop`, chat/notification toggles, and role-aware mobile nav wiring |
| Known rerender pressure | `22` `innerHTML` hits | Direct source scan of `assets/js/pages/career-market.js` after the history-rail DOM sync |
| Shared verification | `node --check` and route regression passed | `node --check assets/js/pages/career-market.js`, `npx vitest run test/career-market-route-regressions.test.js` |
| Browser artifacts | `2` route summaries | `artifacts/career-market-efficient-desktop-summary.json`, `artifacts/career-market-mobile-summary.json` |

## Current Findings

1. `career-market.html` no longer acts as the source of truth for route styling or route behavior; the large inline CSS now lives in `assets/css/career-market-route.css`, and the route runtime now lives in `assets/js/pages/career-market.js`.
2. The route is still intentionally a shared-shell experience right now. The extracted runtime still relies on shared luxury-shell controls and contracts such as `navigate(...)`, `lux-topbar-editor-btn`, `lux-studio-backdrop`, shared messaging/notification buttons, and role-aware mobile navigation.
3. The provider settings modal, instructions studio, and tool-info modal now start unmounted and mount only on first use from template shells in `career-market.html`; the seeded browser artifacts prove all three are absent before interaction.
4. The route-specific cleanup target is now satisfied: inactive provider/tool surfaces lazy-mount from templates, the history rail uses route-owned DOM nodes with delegated clicks, real desktop/mobile browser summaries exist, and the remaining `innerHTML` sites are confined to active route workspaces rather than the entry shell.

## AI Update Rules

1. Update this file in the same turn as every meaningful change to `career-market.html`, `assets/css/career-market-route.css`, or `assets/js/pages/career-market.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct source inspection, targeted command/test output, or browser verification evidence.
5. Preserve the current route layout and tool identity unless a task explicitly changes them.
6. If a task is blocked by shared-shell coupling or provider-integration risk, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| CARE-01 | Done | 0% | Extract the large inline career-market styles into a dedicated route stylesheet so the HTML stops acting as both markup and theme layer | `career-market.html` now links `assets/css/career-market-route.css`, and the route shell has `0` inline `<style>` blocks. |
| CARE-02 | Done | 0% | Extract the page logic into a dedicated page module instead of keeping a large inline script blob in the HTML file | The giant inline runtime now lives in `assets/js/pages/career-market.js`, and `node --check` passes. |
| CARE-03 | Done | 0% | Lazy-mount inactive chat/history/provider panels so first paint only builds the active conversation shell | Reports/vacancies render only when their view is active, and the provider settings, instructions studio, and tool-info modal roots now start unmounted and mount only on first use from templates. |
| CARE-04 | Done | 0% | Audit AI provider switching, history rendering, and suggestion lists for repeated full-panel rerenders | The rerender audit is now explicit and verified: the history rail no longer rebuilds with `innerHTML`, the remaining active-workspace hotspots are documented, and route/browser verification covers provider open/switch plus transcript behavior. |
| CARE-05 | Done | 0% | Verify whether this page really needs the shared luxury shell or whether it should become a dedicated standalone tool page | Current verification shows the extracted route still intentionally depends on shared shell contracts such as `navigate(...)`, the luxury studio trigger, shared utility buttons, and role-aware mobile nav. |
| CARE-06 | Done | 0% | Create a dedicated perf tracker because this route is large enough to justify one | This file is the dedicated tracker. |
| CARE-07 | Done | 0% | Split transcript rendering from sidebar history rendering so one new message never rebuilds both panels | The transcript append path stays on `appendMessage(...)`, while the history rail now updates through route-owned DOM nodes plus delegated selection instead of a string-built `innerHTML` rebuild; both surfaces are separate update regions. |
| CARE-08 | Done | 0% | Add weak-laptop and mobile checks for chat open, provider switch, and long transcript scroll smoothness | `artifacts/career-market-efficient-desktop-summary.json` and `artifacts/career-market-mobile-summary.json` now capture first-ready, provider-modal open, provider switch, reports/vacancies view switch, and seeded transcript scroll timings with zero errors. |
| CARE-09 | Done | 0% | Record whether this route should keep shared-shell transparency and topbar effects or opt out for better performance | Current verdict: keep the shared-shell topbar/transparency treatment for now because the route still depends on shared luxury-shell controls and still presents itself as a first-class portal workspace rather than an isolated microsite. |
| CARE-10 | Done | 0% | Verify whether `career-market` is intentionally student-only or whether any other role should be able to reach it | Already proven in the master audit role-access matrix. |

## Shared-Shell Dependency Notes

| Dependency | Current evidence | Verdict |
| --- | --- | --- |
| Shared navigation | `career-market.js` still calls `window.navigate(...)` from both the mobile bar and the action-sheet role nav | Keep shared shell for now |
| Shared luxury studio | `career-market.js` still opens `#lux-studio-backdrop` or `.lux-topbar-editor-btn` | Keep shared shell for now |
| Shared messaging / notifications | Mobile helpers still open `#lux-chat-btn` and `#lux-notification-btn` or the shared toggle fallbacks | Keep shared shell for now |
| Shared role-aware shell state | The route still checks `getEffectiveRole()` and uses the existing shell collapse/light-mode contracts | Keep shared shell for now |

## Ownership Map

| Surface | Current owner | Evidence |
| --- | --- | --- |
| Route chrome, provider rail, history rail host, chat workspace host, and composer shell | `career-market.html` | The entry shell owns the visible two-column layout plus the always-mounted `career-history-items`, `career-empty-state`, `career-message-list`, and `career-composer` regions. |
| History persistence and history rail DOM sync | `assets/js/pages/career-market.js` | `saveCareerHistory(...)`, `handleCareerHistorySelection(...)`, `createCareerHistoryItemNode(...)`, and `renderCareerHistory(...)` now own the history list without `innerHTML` rebuilds. |
| Transcript append path and chat/report/workspace switching | `assets/js/pages/career-market.js` | `appendMessage(...)`, `setCareerView(...)`, `renderChatWorkspace(...)`, `renderReportsWorkspace(...)`, and `renderVacanciesWorkspace(...)` own the active workspace body. |
| Provider settings modal shell and first-use mount | `career-market.html` template + `assets/js/pages/career-market.js` | `career-provider-modal-template`, `ensureCareerTemplateContent(...)`, and `bindProviderModalControls()` now own the provider modal lifecycle. |
| Instructions studio modal shell and editor | `career-market.html` template + `assets/js/pages/career-market.js` | `career-instructions-modal-template`, `bindInstructionsModalControls()`, and `renderInstructionStudio(...)` own the instructions workspace. |
| Tool-info modal shell | `career-market.html` template + `assets/js/pages/career-market.js` | `career-tool-modal-template` plus `bindToolModalControls()` own the explainer modal lifecycle. |
| Composer and evidence upload workflow | `assets/js/pages/career-market.js` | `setupComposer(...)`, `sendCareerChatMessage(...)`, and `handleEvidenceFiles(...)` own the live interaction path. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-16` | `career-market.html`, `assets/css/career-market-route.css`, `assets/js/pages/career-market.js`, `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CARE-01`, `CARE-02`, `CARE-05`, `CARE-06` | Extracted the giant inline `<style>` block into `assets/css/career-market-route.css`, extracted the giant inline runtime into `assets/js/pages/career-market.js`, rewired `career-market.html` to load the route-owned assets, verified `career-market.html` now has `0` inline `<style>` blocks, and ran `node --check assets/js/pages/career-market.js`; direct source scans now show `19,396` bytes for `career-market.html`, `13` external scripts, `10` remaining HTML `style=` attrs, `24` `innerHTML` hits in the extracted runtime, and explicit shared-shell dependency callsites for `navigate(...)`, `lux-topbar-editor-btn`, `lux-studio-backdrop`, and shared chat/notification controls. |
| `2026-05-16` | `career-market.html`, `assets/js/pages/career-market.js`, `tools/capture_career_market_summary.mjs`, `artifacts/career-market-efficient-desktop-summary.json`, `artifacts/career-market-mobile-summary.json`, `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CARE-03`, `CARE-04`, `CARE-08`, `CARE-09` | Moved the provider settings modal, instructions studio, and tool-info modal behind template shells in `career-market.html`, changed the route runtime to mount and bind each modal only on first use, added a Playwright route probe, and captured real desktop/mobile browser artifacts; `node --check assets/js/pages/career-market.js` and `node --check tools/capture_career_market_summary.mjs` passed; direct source scans now show `career-provider-modal-template`, `career-instructions-modal-template`, and `career-tool-modal-template` in the HTML shell; the artifacts prove those modal roots are absent before interaction (`lazyStateBefore.providerModalMounted: false`, `toolModalMounted: false`, `instructionsModalMounted: false`); `artifacts/career-market-efficient-desktop-summary.json` now records `firstReadyMs: 4730`, `providerOpenMs: 8`, `providerSwitchMs: 1`, `reportsViewMs: 2`, `vacanciesViewMs: 1`, `transcriptScrollMs: 210`, `transcriptMessageCount: 36`, and zero errors; and `artifacts/career-market-mobile-summary.json` now records `firstReadyMs: 675`, `providerOpenMs: 4`, `providerSwitchMs: 1`, `reportsViewMs: 1`, `vacanciesViewMs: 1`, `transcriptScrollMs: 68`, `transcriptMessageCount: 36`, `mobileNavVisible: true`, and zero errors. |
| `2026-05-16` | `assets/js/pages/career-market.js`, `test/career-market-route-regressions.test.js`, `artifacts/career-market-efficient-desktop-summary.json`, `artifacts/career-market-mobile-summary.json`, `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `CARE-03`, `CARE-04`, `CARE-07` | Replaced the history-rail `innerHTML` rebuild with route-owned DOM node creation plus one delegated click listener, added a focused route regression that proves the extracted assets and lazy modal shells stay intact, and refreshed the browser artifacts to confirm the route still behaves cleanly; `node --check assets/js/pages/career-market.js` passed; `npx vitest run test/career-market-route-regressions.test.js` passed `1/1`; the route artifacts still report zero errors on both desktop and mobile; and direct source scans now show `createCareerHistoryItemNode(...)`, `handleCareerHistorySelection(...)`, `container.replaceChildren(...)`, `window.__kiuCareerDebug`, and no remaining `career-history-items` `innerHTML` assignment in `assets/js/pages/career-market.js`. |

## Next Safe Pass

No career-market-specific cleanup tasks remain open. If the route changes again, keep future behavior in `assets/js/pages/career-market.js`, preserve the lazy modal-template pattern, and rerun the dedicated route regression plus the career-market browser summaries.
