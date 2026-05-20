# All Pages Console Runtime Task Tracker

Date: `2026-05-20`
Owner: `Codex`
Purpose: record the current root-page browser-console/runtime failures, separate real page bugs from expected auth redirects, and give the next LLM or engineer an execution-grade fix backlog.

## Goal

Use this file to drive the current page-console scan from:

- one-off browser observations
- incomplete route smoke coverage
- unclear distinction between real runtime regressions and expected auth-gated behavior

to:

- one explicit all-pages console/runtime baseline
- one concrete task list for the confirmed failures
- one repeatable verification path that can be re-run after fixes

This tracker is for **root-page console/runtime failures on open**, not for broad architectural cleanup that already lives in other trackers.

## Read This First

### What is actually broken / what needs to be built

- no confirmed open root-page console/runtime failures remain in the maintained scans
- `lms.html` is now healthy again in both the maintained runtime shell smoke and the maintained all-pages console scan
- the login and social route-summary probes are now aligned with the current auth/session contract and write fresh artifacts successfully

### `% left` meaning in this file

- `0% left` = done
- `1-15% left` = almost done
- `16-60% left` = partly done
- `61-99% left` = mostly not done
- `100% left` = untouched

### How the next LLM must use this file

1. Reproduce the exact browser failure before editing code.
2. Work one top-level task at a time.
3. Update this file in the same turn as any touched runtime fix.
4. Lower `% left` only when new code and new evidence both exist.
5. Do not mark a task `0% left` unless its verification gate is actually checked.
6. If the all-pages scan finds a new real pageerror later, add a new task instead of burying it in notes.

### Mandatory update protocol

Use this exact format under any touched task:

```md
Update `YYYY-MM-DD`:
- Status: completed | partially completed | blocked | re-scoped
- % left: `NN% left`
- Files changed: `path/a`, `path/b`
- Evidence: `command`, `artifact`, `runtime observation`
- Remaining work: ...
```

### Do not trust these signals by themselves

- `npm run test`
- `npm run check`
- `npm run test:runtime-shell`
- one route summary script passing
- static `node --check` passing

Why:

- even the expanded maintained smoke commands are evidence, not proof by themselves, unless they still cover the exact page or flow being claimed
- static checks still cannot catch cross-file load-order regressions by themselves
- if a new route regresses later, this tracker must be reopened with fresh browser evidence instead of assuming current green artifacts still cover the new fault line

## Verified Evidence

### Commands already run

1. `Invoke-WebRequest http://127.0.0.1:8876/index.html`
2. `Invoke-WebRequest http://127.0.0.1:48933/health`
3. browser login probe:
   - `POST /api/portal/session/login` for `admin@kiu.local`
4. full root-page Playwright console scan:
   - artifact: [artifacts/all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>)
5. protected-launch recheck without counting network aborts:
   - `protected-launch.html` redirected to `login.html` with zero `pageerror` or console errors
6. deeper route-summary browser probe batch:
   - artifact: [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>)
7. focused probe checks:
   - `login.html?microsoft_status=success&microsoft_handoff=test-handoff` redirected to `index.html`
   - `social.html` with local auth but no `KIU_PORTAL_SESSION_TOKEN` showed `diagnosticKind: missing-session`
8. maintained commands now green:
   - `npm run test:runtime-shell`
   - `npm run test:all-pages-console`
9. direct login summary probe against the default local frontend contract:
   - `node tools/capture_login_summary.mjs`
10. direct social summary probe against the default local frontend contract:
   - `node tools/capture_social_summary.mjs`
11. focused social lazy-module regression coverage:
   - `npx vitest run test/social-mobile-runtime-regressions.test.js`
12. maintained commands rechecked after the probe/runtime fixes:
   - `npm run test:runtime-shell`
   - `npm run test:all-pages-console`

### High-signal outcomes

- current local frontend is reachable on `http://127.0.0.1:8876`
- current backend health is reachable on `http://127.0.0.1:48933/health`
- `30` root HTML entries were scanned through a real browser context
- `0` root pages now reproduce actual browser runtime errors on open in the maintained all-pages console scan
- `protected-launch.html` still does not reproduce a console/runtime failure on open; it remains an auth-gated redirect in the tested state
- all `13` deeper route-summary probes now complete successfully against `http://127.0.0.1:8876`
- the maintained runtime shell smoke now covers `home`, `admin-tools`, `social`, and `lms` with zero route failures
- direct `node tools/capture_login_summary.mjs` and `node tools/capture_social_summary.mjs` now both succeed against the default local frontend contract at `http://127.0.0.1:8876`
- the social mobile messages panel no longer stays stuck on `Loading Messages` after the deferred messages module finishes loading

### Reproduced errors or important observations

- historical LMS runtime regression is now fixed:
  - `renderLmsLiveQuizSection is not defined`
  - `syncLmsStudentQuizFocusChrome is not defined`
- [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>) is now refreshed to match the live browser evidence for `lms.html`
- the maintained route-summary probe batch at [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>) is now green end-to-end

## Current Inventory

### Global issues / workstreams

- no open issues remain in this tracker
- the remaining requirement is simply to keep the new maintained scans green on future changes

### Route-specific / module-specific issues

- `protected-launch.html`
  - still has no confirmed console bug in the maintained scan
  - with no valid portal session it redirects to `login.html`, so helper/network aborts remain non-fatal network observations rather than pageerror failures

### Validation or coverage gaps

- no open validation gaps remain for the scope of this tracker
- maintained coverage now exists for:
  - `npm run test:runtime-shell`
  - `npm run test:all-pages-console`
  - the route-summary probe batch artifact

## Root Causes Already Isolated

### Root cause A: LMS split owners now execute cross-file references before the provider exists

Evidence:

- [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>) loads:
  - `lms-live-quiz-workspace-runtime.js` at line `3362`
  - `lms-live-quiz-ui-runtime.js` at line `3363`
  - `lms-quiz-workspace-runtime.js` at line `3371`
  - `lms-classroom-tabs-runtime.js` at line `3372`
- [assets/js/pages/lms-live-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-workspace-runtime.js>) line `396` starts `Object.assign(window, { ... })`
- the same file references `renderLmsLiveQuizSection` at line `397`, but the function now lives in [assets/js/pages/lms-live-quiz-ui-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-ui-runtime.js>) line `917`
- [assets/js/pages/lms-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-quiz-workspace-runtime.js>) line `1251` calls `syncLmsStudentQuizFocusChrome(getLmsStudentQuizFocusState())`
- `syncLmsStudentQuizFocusChrome(...)` still lives in [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) line `2214`, which loads later than the quiz-workspace runtime
- [assets/js/pages/lms-classroom-tabs-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-classroom-tabs-runtime.js>) line `1771` calls `renderLmsLiveQuizSection(tabCourseKey)`

Consequence:

- LMS shell startup is no longer load-order safe
- browser open succeeds visually enough to hide the regression, but the quiz and tab runtime is not actually healthy

### Root cause B: current smoke coverage did not include the page that regressed

Evidence:

- [tools/runtime_shell_smoke.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/runtime_shell_smoke.mjs>) only scans `home`, `admin-tools`, and `social`
- [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>) still marks `lms.html` as `healthy`
- [artifacts/all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) proves that `lms.html` is not healthy on open anymore

Consequence:

- the regression can persist while the normal smoke command still passes
- future sessions may trust stale docs and skip reproducing the real broken route

### Root cause C: some browser probe scripts no longer match the live auth/session contract

Evidence:

- [tools/capture_login_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_login_summary.mjs>) line `342` still opens `login.html?microsoft_status=success&portal_token=microsoft-session-token`
- the live login runtime now expects `microsoft_handoff`, not `portal_token`, as shown in [assets/js/pages/login-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/login-runtime.js>)
- a focused browser check on `login.html?microsoft_status=success&microsoft_handoff=test-handoff` redirected successfully to `index.html`
- [tools/capture_social_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_social_summary.mjs>) line `229` explicitly removes `KIU_PORTAL_SESSION_TOKEN`
- the same probe then waits for feed content at line `319`, but the live API layer now surfaces `missing-session` without that token, as documented in [assets/js/app/api.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/app/api.js>)
- a focused browser check on `social.html` with local auth and no token produced `diagnosticKind: missing-session`

Consequence:

- the failing route-summary probes are currently stale-tooling failures, not newly confirmed page-open console bugs
- future sessions could waste time chasing a healthy page instead of updating the probe contract

## Execution Order

No open execution order remains in this tracker.

Reason:

- all four tracked tasks are now complete and verified

## How To Read Each Task

Every task below uses this structure:

- `Priority`
- `Depends on`
- `Why this exists`
- `Primary files`
- `Exact work`
- `Verification gate`

## Task Backlog

### `CONSOLE-01` `0% left` Restore LMS load-order safety after the runtime split

Priority: `P0`
Depends on: none

Why this exists:

- `lms.html` is the only root page from the all-pages browser sweep that currently throws real runtime errors on open
- the failure is caused by extracted LMS owners referencing functions before the provider file has executed

Primary files:

- [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>)
- [assets/js/pages/lms-live-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-workspace-runtime.js>)
- [assets/js/pages/lms-live-quiz-ui-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-ui-runtime.js>)
- [assets/js/pages/lms-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-quiz-workspace-runtime.js>)
- [assets/js/pages/lms-classroom-tabs-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-classroom-tabs-runtime.js>)
- [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>)

Exact work:

1. Reproduce the current failure on `lms.html` and confirm both reference errors still occur:
   - `renderLmsLiveQuizSection is not defined`
   - `syncLmsStudentQuizFocusChrome is not defined`
2. Decide the clean ownership boundary for each missing function:
   - either move the provider into the eager file that uses it
   - or stop executing the call until the provider file is guaranteed loaded
3. Fix the live-quiz runtime export path so `lms-live-quiz-workspace-runtime.js` does not reference `renderLmsLiveQuizSection` before [lms-live-quiz-ui-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-ui-runtime.js>) is ready.
4. Fix the focus-mode startup path so `lms-quiz-workspace-runtime.js` does not call `syncLmsStudentQuizFocusChrome(...)` before its owner is available.
5. Re-check the classroom tab switch path in [lms-classroom-tabs-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-classroom-tabs-runtime.js>) to make sure the `live-quiz` tab still reaches a valid render owner after the change.
6. Add or update LMS-specific regression coverage so the cross-file seam is locked after the fix.

Do not do this:

- do not hide the bug with a broad `try/catch` while leaving the broken ownership seam intact
- do not re-monolithically move all LMS code back into `lms.js`
- do not mark the task done only because `node --check` passes

Verification gate:

- opening `lms.html` in a real browser produces zero `pageerror` or console errors
- the `live-quiz` tab can be selected without a new reference error
- `npx vitest run` passes the LMS route/module split regressions relevant to the touched seam
- the all-pages console scan artifact no longer lists `lms.html` as failing

Update `2026-05-18`:
- Status: not started
- % left: `88% left`
- Files changed: none yet
- Evidence: [artifacts/all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) records `pageerror: renderLmsLiveQuizSection is not defined` and `pageerror: syncLmsStudentQuizFocusChrome is not defined` on `lms.html`; exact fault-line references are currently [lms-live-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-workspace-runtime.js>) line `397`, [lms-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-quiz-workspace-runtime.js>) line `1251`, [lms-live-quiz-ui-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-ui-runtime.js>) line `917`, and [lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) line `2214`
- Remaining work: make the cross-file LMS runtime seams load-order safe and prove it in browser/runtime coverage

Update `2026-05-19`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/pages/lms-live-quiz-workspace-runtime.js`, `assets/js/pages/lms-live-quiz-ui-runtime.js`, `assets/js/pages/lms-quiz-workspace-runtime.js`, `assets/js/pages/lms.js`, `test/lms-live-quiz-workspace-module-split.test.js`, `test/lms-quiz-workspace-module-split.test.js`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `node --check assets/js/pages/lms.js`; `node --check assets/js/pages/lms-live-quiz-workspace-runtime.js`; `node --check assets/js/pages/lms-live-quiz-ui-runtime.js`; `node --check assets/js/pages/lms-quiz-workspace-runtime.js`; `npx vitest run test/lms-live-quiz-workspace-module-split.test.js test/lms-quiz-workspace-module-split.test.js test/scheduler-and-lms-regressions.test.js`; focused browser check on `lms.html` showed zero errors; focused browser check after `openLMSCourse(...)` plus `switchLMSTab('live-quiz')` showed `activeTab: tab-live-quiz` with zero errors; maintained [all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) now records `lms.html` with `errors: []`
- Remaining work: none

### `CONSOLE-02` `0% left` Add all-pages console coverage and refresh stale route-smoke docs

Priority: `P1`
Depends on: `CONSOLE-01`

Why this exists:

- the current documented root smoke baseline is stale for `lms.html`
- the normal smoke command passed because it never checked the page that regressed

Primary files:

- [tools/runtime_shell_smoke.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/runtime_shell_smoke.mjs>)
- [docs/ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>)
- [artifacts/all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>)
- any new route-scan script or test file added for root-page console coverage

Exact work:

1. Decide the smallest sustainable browser scan that covers more than the current three-route smoke:
   - at minimum it must include `lms.html`
   - ideally it should keep or replace the all-pages open scan used for this audit
2. Update the runtime smoke tooling so a future `lms.html` startup regression fails automatically.
3. Refresh [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>) so its current status matches real browser evidence.
4. Clearly separate:
   - real page runtime failures
   - expected auth-gated redirects like `protected-launch.html` without a valid portal session
5. Save a fresh artifact after the LMS fix and record which pages still require role/session-specific scan modes.

Do not do this:

- do not leave `ROOT_ROUTE_SMOKE_MATRIX.md` saying `lms.html` is healthy if the live browser says otherwise
- do not expand smoke coverage by relying only on static assertions
- do not count plain auth redirects as console-bug failures unless they emit real console/page errors

Verification gate:

- the maintained smoke command or companion scan now includes `lms.html`
- `ROOT_ROUTE_SMOKE_MATRIX.md` matches the live browser outcome for the touched pages
- a fresh browser artifact exists and is linked from the tracker/docs

Update `2026-05-18`:
- Status: not started
- % left: `92% left`
- Files changed: none yet
- Evidence: [tools/runtime_shell_smoke.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/runtime_shell_smoke.mjs>) currently scans only `home`, `admin-tools`, and `social`, while [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>) still marks `lms.html` as `healthy`; [artifacts/all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) is the current authoritative contradiction
- Remaining work: extend the maintained browser smoke coverage and refresh the route-smoke documentation after the LMS fix lands

Update `2026-05-19`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/runtime_shell_smoke.mjs`, `tools/all_pages_console_scan.mjs`, `package.json`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `artifacts/runtime-shell-smoke.json`, `artifacts/all-pages-console-scan.json`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `node --check tools/all_pages_console_scan.mjs`; `npm run test:all-pages-console`; `npm run test:runtime-shell`; [runtime-shell-smoke.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/runtime-shell-smoke.json>) now includes `lms` with zero route failures, and [all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) now records zero console/page runtime failures across all `30` root HTML entries
- Remaining work: none

Update `2026-05-20`:
- Status: completed
- % left: `0% left`
- Files changed: `artifacts/runtime-shell-smoke.json`, `artifacts/all-pages-console-scan.json`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `npm run test:runtime-shell`; `npm run test:all-pages-console`; refreshed [runtime-shell-smoke.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/runtime-shell-smoke.json>) still records `home`, `admin-tools`, `social`, and `lms` with zero route failures, and refreshed [all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) still records zero root-page console/page runtime failures across all `30` root HTML entries
- Remaining work: none

### `CONSOLE-03` `0% left` Update the login browser probe to the current Microsoft handoff and session lifecycle

Priority: `P1`
Depends on: none

Why this exists:

- the login page itself did not reproduce a console/runtime failure in the page-open scan
- the maintained login summary probe now fails because it still follows an old Microsoft callback contract

Primary files:

- [tools/capture_login_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_login_summary.mjs>)
- [assets/js/pages/login-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/login-runtime.js>)
- any login summary artifact written by the updated probe

Exact work:

1. Reproduce the current probe failure from [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>).
2. Replace the stale Microsoft callback scenario in the probe:
   - stop using `portal_token`
   - use `microsoft_handoff` instead
3. Re-check the existing-session and expired-session branches so their wait conditions still match the live login runtime.
4. Confirm the probe still covers:
   - plain login submit
   - admin login redirect
   - existing session redirect
   - expired session clear/fallback
   - Microsoft login start
   - Microsoft callback completion
5. Write fresh login summary artifacts after the fix.

Do not do this:

- do not create a probe-only fake flow that the live login page no longer supports
- do not mark this as a login page bug unless the live browser route itself starts failing outside the stale probe

Verification gate:

- `node tools/capture_login_summary.mjs` exits `0`
- fresh `login-efficient-desktop-summary.json` and `login-mobile-summary.json` artifacts are written
- the Microsoft callback branch uses the current `microsoft_handoff` contract rather than the retired `portal_token` path

Update `2026-05-19`:
- Status: not started
- % left: `90% left`
- Files changed: none yet
- Evidence: [tools/capture_login_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_login_summary.mjs>) line `342` still opens `login.html?microsoft_status=success&portal_token=microsoft-session-token`, while a focused browser check on `login.html?microsoft_status=success&microsoft_handoff=test-handoff` redirected correctly to `index.html`; [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>) records the current probe failure
- Remaining work: align the login summary probe with the current Microsoft handoff/session lifecycle and refresh the summary artifacts

Update `2026-05-19`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/capture_login_summary.mjs`, `artifacts/login-efficient-desktop-summary.json`, `artifacts/login-mobile-summary.json`, `artifacts/route-summary-probe-batch.json`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `node --check tools/capture_login_summary.mjs`; `$env:KIU_BASE_URL='http://127.0.0.1:8876'; node tools/capture_login_summary.mjs`; the probe now stubs `POST /api/portal/microsoft/complete`, matches `/api/portal/session` with or without query string, and uses `microsoft_handoff`; fresh login summary artifacts were written and [route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>) now records `exit_code: 0` for `tools/capture_login_summary.mjs`
- Remaining work: none

Update `2026-05-20`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/capture_login_summary.mjs`, `artifacts/login-efficient-desktop-summary.json`, `artifacts/login-mobile-summary.json`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `node --check tools/capture_login_summary.mjs`; `node tools/capture_login_summary.mjs`; the probe now defaults to `http://127.0.0.1:8876`, so the maintained direct command succeeds without a `KIU_BASE_URL` override and refreshed login summary artifacts were written successfully
- Remaining work: none

### `CONSOLE-04` `0% left` Update the social browser probe to the current portal-session requirement

Priority: `P1`
Depends on: none

Why this exists:

- the social page did not reproduce a page-open console/runtime error in the all-pages scan
- the maintained social summary probe now fails because it intentionally removes `KIU_PORTAL_SESSION_TOKEN` but still expects a fully hydrated feed

Primary files:

- [tools/capture_social_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_social_summary.mjs>)
- [assets/js/app/api.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/app/api.js>)
- [assets/js/pages/social-page.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/social-page.js>)
- any social summary artifact written by the updated probe

Exact work:

1. Reproduce the current social probe failure from [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>).
2. Decide which contract the maintained probe should test:
   - either seed a valid portal session token and keep the full social-workspace expectations
   - or explicitly test the `missing-session` diagnostic path instead of feed hydration
3. Update the probe’s ready condition at [tools/capture_social_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_social_summary.mjs>) line `319` so it matches the chosen contract.
4. If the probe keeps the full social-workspace path, make sure its auth bootstrap matches the live route requirement.
5. Write fresh desktop/mobile social summary artifacts after the fix.

Do not do this:

- do not keep a probe that removes the session token and still treats `missing-session` as an unexpected page failure
- do not convert this into a social route bug unless the live route starts failing even with the intended auth contract

Verification gate:

- `node tools/capture_social_summary.mjs` exits `0`
- fresh `social-efficient-desktop-summary.json` and `social-mobile-summary.json` artifacts are written
- the probe’s expected ready state matches the live auth/session contract

Update `2026-05-19`:
- Status: not started
- % left: `90% left`
- Files changed: none yet
- Evidence: [tools/capture_social_summary.mjs](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/tools/capture_social_summary.mjs>) line `229` removes `KIU_PORTAL_SESSION_TOKEN`, then line `319` waits for a feed post card; a focused browser check on `social.html` with local auth and no token returned `diagnosticKind: missing-session`; and [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>) records the current probe failure
- Remaining work: align the social summary probe with the current portal-session requirement and refresh the summary artifacts

Update `2026-05-19`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/capture_social_summary.mjs`, `artifacts/social-efficient-desktop-summary.json`, `artifacts/social-mobile-summary.json`, `artifacts/route-summary-probe-batch.json`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `node --check tools/capture_social_summary.mjs`; `$env:KIU_BASE_URL='http://127.0.0.1:8876'; node tools/capture_social_summary.mjs`; the probe now seeds `KIU_PORTAL_SESSION_TOKEN` and stubs `/api/portal/session` plus `/api/bootstrap`, so its ready state matches the live full-workspace contract instead of the `missing-session` path; fresh social summary artifacts were written and [route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>) now records `exit_code: 0` for `tools/capture_social_summary.mjs`
- Remaining work: none

Update `2026-05-20`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/capture_social_summary.mjs`, `assets/js/pages/social-page.js`, `test/social-mobile-runtime-regressions.test.js`, `artifacts/social-efficient-desktop-summary.json`, `artifacts/social-mobile-summary.json`, `docs/ALL_PAGES_CONSOLE_RUNTIME_TASK_TRACKER.md`
- Evidence: `node --check assets/js/pages/social-page.js`; `node --check tools/capture_social_summary.mjs`; `node tools/capture_social_summary.mjs`; `npx vitest run test/social-mobile-runtime-regressions.test.js`; the probe now defaults to `http://127.0.0.1:8876`, uses the current mobile tab selectors, stubs `/api/platform/config` plus `/api/portal/state`, and the social shell now invalidates the last render signature before deferred module rerenders so mobile messages no longer stall on `Loading Messages`
- Remaining work: none

## Verification Matrix

### Required routes / modules / flows

- `lms.html` open with professor or equivalent LMS staff context
- current smoke-command coverage route set after update
- root-page open scan artifact for all `30` root HTML entries
- current login summary probe
- current social summary probe

### Required checks

- no `pageerror` on `lms.html`
- no console `error` on `lms.html`
- updated smoke/docs no longer contradict the live browser outcome

### Extra checks

- `protected-launch.html`
  - confirm it is still only an auth-gated redirect in no-session mode and not a console-bug page

## Important Note For The Next Session

The contradiction that created this tracker is now resolved.

If a future console/runtime regression appears, start from:

- `npm run test:runtime-shell`
- `npm run test:all-pages-console`
- [artifacts/route-summary-probe-batch.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/route-summary-probe-batch.json>)

and open a fresh tracker only if one of those maintained checks actually fails.
