# News Optimization Tracker

Target page: `news.html`
Last updated: `2026-05-16`
Owner: `Codex`
Goal: keep the news route visually polished while reducing shell imports, preserving the standalone page decision, and avoiding route-pack creep.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `news.html` | `13,920 bytes` after route-CSS extraction and delegated news actions |
| Page runtime | `assets/js/pages/news.js` | `49,753 bytes` after the per-post shell split plus lazy privilege loader |
| Route CSS | `assets/css/news-route.css` | `22,731 bytes` extracted from the runtime-owned style block |
| External scripts | `12` | `11` deferred scripts plus `theme-primer.js` in the head |
| Inline handlers | `0` | Source scan of `news.html` |
| Generated inline action markup | `0` | Source scan of `assets/js/pages/news.js` now finds `0` `onclick=`, `oninput=`, and `onchange=` hits |
| Full-root render writes | `1` root shell mount | Source scan now finds one `root.innerHTML =` shell bootstrap, one feed-shell mount, stable per-post shells, and region-level updates instead of one feed-wide or per-card full rewrite path |
| Privilege-pane bootstrap cost | Lazy | Privilege definitions/accounts now load only when the `Privileges` pane first opens |
| Shared verification | `5/5 targeted tests passed` | `npx vitest run test/news-route-regressions.test.js` |

## Current Findings

1. `news.html` is a standalone page and should remain visually lightweight at the shell level.
2. The shell no longer carries the dead social helper trio or messenger import.
3. The shell no longer polls for mobile navigation readiness.
4. `assets/js/pages/news.js` no longer injects a stylesheet or emit inline action hooks; route CSS now lives in `assets/css/news-route.css` and the runtime uses delegated `data-news-*` actions instead.
5. The route now keeps one stable shell, one stable feed shell, and one stable shell per post, updating sidebar, hero, filter, admin, and each post's header, audience, body, and private-reply regions separately instead of rebuilding the full root, whole feed list, or whole card body on every state change.
6. The admin privilege workspace now loads on demand instead of front-loading during every initial news bootstrap.
7. Real weak-laptop desktop and mobile artifacts are now in place; remaining idle cost on weak desktop is source-backed as shared-shell overhead rather than route-local news render churn.

## AI Update Rules

1. Update this file in the same turn as every change to `news.html` or `assets/js/pages/news.js`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current news visual language and standalone route decision unless a task explicitly changes them.
6. If a task becomes blocked by hidden coupling, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| NEWS-01 | Done | 0% | Remove unrelated route imports so `news.html` only loads what the news workspace needs | Dead social imports and messenger are removed. |
| NEWS-02 | Done | 0% | Audit `assets/js/pages/news.js` for render-once content that should mount lazily or use `content-visibility` | Repeated cards keep `content-visibility`, the privilege workspace still loads only on first pane open, and each post now mounts through a stable post shell with smaller header/audience/body/private region updates. |
| NEWS-03 | Done | 0% | Move any old inline news placeholders or layout styles fully into page-owned CSS and JS | Route CSS now lives in `assets/css/news-route.css`, placeholder blocks use route classes, and generated action markup no longer relies on inline event attributes. |
| NEWS-04 | Done | 0% | Add a dedicated tracker if the news route remains a standalone page | This file fulfills that role. |
| NEWS-05 | Done | 0% | Build a keep/remove table for every shared script on the page and record exact evidence for each verdict | See `Import Verdicts` below. |
| NEWS-06 | Done | 0% | Split story list, detail body, and sidebar widgets so a refresh does not rebuild the full root | The route now keeps a stable shell, a stable feed shell, and stable per-post shells; each post updates header, audience, body, and private-reply regions separately. |
| NEWS-07 | Done | 0% | Add weak-laptop and mobile checks for initial story paint and route idle CPU | `artifacts/news-efficient-desktop-summary.json` and `artifacts/news-mobile-summary.json` now record real CPU-throttled desktop/mobile startup, search, privilege-pane open, and idle long-task metrics with `0` errors. |

## Import Verdicts

| Import | Verdict | Evidence |
| --- | --- | --- |
| `assets/js/theme-primer.js` | Keep | `news.html` still primes the standalone shell in the head before the deferred stack, and the page body still boots with `kiu-shell-loading` plus `lux-light-mode` support. |
| `assets/js/app/app.js` | Keep | The inline mobile shell in `news.html` still calls `window.toggleMessaging()` and `window.toggleNotifications()`, and `app.js` owns those compatibility hooks. |
| `assets/js/app/api.js` | Keep | `assets/js/pages/news.js` still calls `kiuPortalFetch()` for feed, privilege, publish, reply, and save-privilege requests. |
| `assets/js/app/auth.js` | Keep | Inference from source: the standalone page still depends on authenticated session bootstrap before the `getCurrentUser()` and privilege-gated news actions in `news.js` can succeed. |
| `assets/js/data/initial-state.js` | Keep | `news.js` still reads `KIU_STATE` and `KIU_EMPTY_STATE` when building faculty-scope options. |
| `assets/js/app/state.js` | Keep | `news.js` still uses `getCurrentUser()`, `getEffectiveUserRole()`, `userHasPortalPrivilege()`, and role-aware access checks. |
| `assets/js/shared/utilities.js` | Keep | `assets/css/news-route.css` still consumes `--lux-*` shell tokens, and `utilities.js` still owns the route-level transparency/theme variable writes, including a `lux-route-news` branch. |
| `assets/js/shared/faculty.js` | Keep for shared shell | No direct route-local symbol remains, but this pass did not prove the shared faculty-themed shell can boot safely without it. |
| `assets/js/features/navigation.js` | Keep | The mobile shell in `news.html` still calls `window.navigate()`, and `news.js` still checks `getActivePageId()` for route visibility. |
| `assets/js/features/ui.js` | Keep for shared shell | No direct news-runtime symbol remains, but the standalone page still boots the same shared shell utility layer and this pass did not prove safe removal. |
| `assets/js/features/index-luxury.js` | Keep | The page still boots `lux-unified-shell`, shared role-switcher/studio behavior, and the shell token pipeline that the extracted route CSS consumes. |
| `assets/js/pages/news.js` | Keep | Dedicated route runtime for sections, feed, private replies, and delegated privilege/publisher actions. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `docs/NEWS_OPTIMIZATION_TRACKER.md` | `NEWS-04` | Baseline from `news.html`, `assets/js/pages/news.js`, and `test/news-route-regressions.test.js`. |
| `2026-05-15` | `news.html`, `test/news-route-regressions.test.js` | `NEWS-01` | Removed dead social helper imports and messenger from the news shell; source scan now shows `12` external scripts and `0` inline handlers. |
| `2026-05-15` | `news.html`, `test/news-route-regressions.test.js` | `GLOBAL-11` | Replaced the inline mobile shell polling wait with direct hook setup; source scan now shows `0` `setInterval(` hits. |
| `2026-05-15` | `news.html`, `assets/css/news-route.css`, `assets/js/pages/news.js`, `test/news-route-regressions.test.js` | `NEWS-02`, `NEWS-03`, `NEWS-05` | Extracted the route stylesheet out of `news.js`, replaced generated inline action hooks with delegated `data-news-*` handlers, added safe `content-visibility` for repeated cards, and locked the route with `npx vitest run test/news-route-regressions.test.js` plus source scans showing `0` `onclick=`, `oninput=`, `onchange=`, and inline `style=` hits in `news.js`. |
| `2026-05-15` | `assets/js/pages/news.js`, `test/news-route-regressions.test.js`, `docs/NEWS_OPTIMIZATION_TRACKER.md` | `NEWS-06` | Reworked the route to keep one stable shell and update sidebar, hero, filter, feed, and admin regions separately instead of rebuilding the full root; `node --check assets/js/pages/news.js` passed and `npx vitest run test/news-route-regressions.test.js` stayed green. |
| `2026-05-15` | `assets/js/pages/news.js`, `test/news-route-regressions.test.js`, `docs/NEWS_OPTIMIZATION_TRACKER.md` | `NEWS-02` | Switched the privilege workspace to an on-demand load path so definitions/accounts fetch only when the `Privileges` pane first opens; `node --check assets/js/pages/news.js` passed and `npx vitest run test/news-route-regressions.test.js` now covers the lazy privilege loader. |
| `2026-05-15` | `assets/js/pages/news.js`, `test/news-route-regressions.test.js`, `docs/NEWS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `NEWS-06` | Split the feed into a stable feed shell with per-post cached hosts, `node --check assets/js/pages/news.js` passed again, `npx vitest run test/news-route-regressions.test.js` stayed green at `5/5`, and source metrics now show `48,057` bytes, `1` `root.innerHTML =` shell mount, `1` `ensureNewsFeedShell()` definition, `1` `renderNewsFeedRegions()` definition, and `feed-post:` cache keys instead of one feed-wide markup string. |
| `2026-05-16` | `news.html`, `assets/js/pages/news.js`, `test/news-route-regressions.test.js`, `artifacts/news-efficient-desktop-summary.json`, `artifacts/news-mobile-summary.json`, `docs/NEWS_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `NEWS-02`, `NEWS-06`, `NEWS-07` | Bumped the route script cache key to `v=20260516-newsroute3`, split each feed host into stable post shells with separate header/audience/body/private region updates, `node --check assets/js/pages/news.js` passed, `npx vitest run test/news-route-regressions.test.js` stayed green at `5/5`, and the new CPU-throttled desktop/mobile artifacts recorded `0` errors with `firstReadyMs: 1904` / `2471`, `searchMs: 408` / `340`, `privilegeOpenMs: 446` / `298`, and mobile action-sheet open at `185 ms`. |

## Next Safe Pass

1. No news-specific cleanup tasks remain open.
2. If the admin pane grows again, keep future tools on the same on-demand load path instead of restoring eager bootstrap work.
3. If shared-shell work changes weak-device idle cost, rerun both `news` artifacts so the route record stays separated from shell-wide overhead.
