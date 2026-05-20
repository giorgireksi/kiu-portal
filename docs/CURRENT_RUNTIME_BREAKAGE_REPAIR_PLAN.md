# Current Runtime Breakage Repair Plan

Date: `2026-05-17`
Owner: `Codex`
Purpose: give the next AI session an execution-grade repair backlog for the current runtime breakage, not a cleanup summary.

## Read This First

### What is actually broken

- the pages are **not deleted**
- the shared shell is crashing during startup
- when that crash happens, sidebar navigation, theme controls, and route hydration stop early
- some standalone/data-heavy routes also have separate backend-session and dependency problems

### `% left` meaning in this file

- `0% left` = done
- `1-15% left` = almost done
- `16-60% left` = partly done
- `61-99% left` = mostly not done
- `100% left` = untouched implementation

Important:

- the percentages below describe **fix work still remaining**, not research completeness
- root-cause research is already largely done
- code fixes are mostly **not** done yet

### How the next LLM must use this file

If you are the next session working from this document, follow this exact process:

1. Reproduce the bug before changing code when a reproduction path is already documented here.
2. Fix one top-level task or one tightly related subset of a task at a time.
3. After each code change batch, update this same file in the same turn.
4. Lower the `% left` value only when the code changed and new evidence exists.
5. Do not mark any task `0% left` unless its verification gate was actually checked.
6. If you discover a new blocker, add it here immediately instead of hiding it in a final reply.
7. If you split a task into smaller tasks, keep the parent task and add child tasks beneath it or directly after it.

### Mandatory update protocol

Every task update must append a block in this exact format directly under the touched task:

```md
Update `YYYY-MM-DD`:
- Status: ...
- % left: `NN% left`
- Files changed: `file-a`, `file-b`
- Evidence: `command`, `artifact`, `runtime observation`
- Remaining work: ...
```

Rules:

- `Status` must say whether the task is completed, partially completed, blocked, or re-scoped.
- `Files changed` must list real files, not vague areas.
- `Evidence` must mention what was actually run or observed.
- `Remaining work` must be concrete enough that a new LLM can continue without re-discovery.

### Do not trust these signals by themselves

The following are useful, but **not sufficient alone**:

- passing unit tests
- passing static source assertions
- one route rendering partial HTML
- one route showing shell chrome
- absence of syntax errors

This is important because the repo already had a state where `npx vitest run` passed `150/150` while the live shared shell was still broken.

### Recommended session-start checklist

Before touching code in a new session:

1. Start the frontend on the documented origin you intend to use.
2. Confirm backend health on `http://127.0.0.1:48933/health`.
3. Reproduce at least these three routes first:
   - `index.html?view=student#home`
   - `admin-tools.html`
   - `social.html`
4. Capture:
   - console `pageerror`
   - whether `#lux-nav` is populated
   - whether `#lux-home-shell` is populated on home
5. Only then start changing code.

## Verified Evidence

### Commands already run

1. Frontend static servers:
   - `python tools/local_dev_server.py 8895`
   - `python tools/local_dev_server.py 8876`
2. Existing browser probes:
   - `KIU_BASE_URL=http://127.0.0.1:8895 node tools/capture_home_startup_matrix.mjs`
   - `KIU_BASE_URL=http://127.0.0.1:8895 node tools/capture_login_summary.mjs`
3. Full unit/integration suite:
   - `npx vitest run`
4. Direct Playwright route scan across root HTML pages with seeded auth state.
5. Backend health + CORS checks against `http://127.0.0.1:48933`.

### High-signal outcomes

- `tools/capture_home_startup_matrix.mjs` timed out on the home route.
- `tools/capture_login_summary.mjs` completed.
- `npx vitest run` passed:
  - `47` test files
  - `150` tests
- many live shell routes still had:
  - `topbar: true`
  - `sidebar: true`
  - `navCount: 0`

### Reproduced runtime errors

- `getDashboardVisuals is not defined`
- `isHomeEditorAvailable is not defined`
- `getStudentCompletedEctsThisSemester is not defined`
- route-level backend/session failures on some standalone pages:
  - `401 Unauthorized`
  - `Failed to fetch`
- `exams.html` export dependency failure:
  - remote `unpkg.com` library request failed / blocked

## Current Bug Inventory

### Global shell breakage

These routes all reproduced `navCount: 0` after the shell booted:

- `index.html?view=student#home`
- `lms.html`
- `registration.html`
- `profile.html`
- `personal-data.html`
- `programs.html`
- `study-card.html`
- `timetable.html`
- `library.html`
- `orders.html`
- `news.html`
- `social.html`
- `student-service.html`
- `career-market.html`
- `chancellery.html`
- `exams.html`
- `faculty-gradebook.html`
- `admin-tools.html`
- `admin-library.html`
- `admin-orders.html`
- `admin-scheduler.html`
- `staff.html`
- `students-admin.html`
- `profile-view.html`
- redirect aliases landing on live routes:
  - `calendar.html`
  - `gradebook.html`
  - `faculty-schedule.html`

### Route-specific extra failures

- `admin-tools.html`
  - `getDashboardVisuals is not defined`
  - `getStudentCompletedEctsThisSemester is not defined`
- `social.html`
  - `getDashboardVisuals is not defined`
  - `isHomeEditorAvailable is not defined`
  - backend/session fetch failures when no valid portal session exists
- `faculty-gradebook.html`
  - `getDashboardVisuals is not defined`
  - `isHomeEditorAvailable is not defined`
  - backend/session fetch failures when no valid portal session exists
- `orders.html`
  - `getDashboardVisuals is not defined`
  - `isHomeEditorAvailable is not defined`
  - backend/session fetch failures when no valid portal session exists
- `news.html`
  - `getDashboardVisuals is not defined`
  - backend-backed feed fetch fails without usable session/backend alignment
- `student-service.html`
  - `getDashboardVisuals is not defined`
  - backend bootstrap fails without usable session/backend alignment
- `exams.html`
  - `getDashboardVisuals is not defined`
  - remote export libs loaded from `unpkg.com`
  - `docx` request reproduced failure in browser
- `login.html`
  - can show raw backend fetch failure when backend/session/config is unavailable

### Validation blind spot

- the live shell is broken
- `npx vitest run` still passed `150/150`

That means the current test suite does **not** cover the actual browser startup failure that users hit.

## Root Causes Already Isolated

### Root cause A: shared shell reads home visual helpers before the home chunk is activated

Evidence:

- `assets/js/features/index-luxury.js` line `717` defines `getThemeMode()`
- line `719` calls `getDashboardVisuals()`
- line `3698` calls `applyThemeMode(getThemeMode(), false)`
- line `3772` calls `applyThemeMode(getThemeMode(), false)` again during startup
- the route-owned home bundle is only activated later through:
  - `ensureLuxuryHomeDashboardBundle()` at lines `3747-3763`
  - initial activation path at line `3803`

Decoded payload from `assets/js/features/index-home-dashboard.js` proves the missing helpers live there:

- `function getDashboardVisuals(...)`
- `function setDashboardVisuals(...)`
- `function isHomeEditorAvailable()`
- `renderDynamicHomeShell = function (...)`

Consequence:

- the shell crashes before `syncAll()` completes
- `renderNav()` never finishes
- home shell content stays empty
- theme and palette logic never stabilizes

### Root cause B: non-home shell code still calls home-editor helpers directly

Evidence:

- `assets/js/features/index-luxury.js` line `3018`
  - `editButton.title = isHomeEditorAvailable()`
- `assets/js/features/index-luxury.js` line `3238`
  - `if (!isHomeEditorAvailable()) { ... }`

Consequence:

- non-home routes can still fail even after the first helper-order bug is fixed

### Root cause C: admin registration code consumes a helper from a file the route does not load

Evidence:

- `admin-tools.html` loads:
  - `assets/js/pages/registration.js`
  - `assets/js/pages/admin-registration.js`
- `admin-tools.html` does **not** load:
  - `assets/js/pages/student-registration.js`
- `assets/js/pages/admin-registration.js` line `69`
  - `const totalEcts = getStudentCompletedEctsThisSemester(user.id, fac);`
- `assets/js/pages/student-registration.js` line `1530`
  - defines `getStudentCompletedEctsThisSemester(...)`

Consequence:

- admin-tools throws a second hard runtime error even after shell recovery

### Root cause D: frontend origin and backend session contract are easy to misalign in local dev

Evidence:

- `GET http://127.0.0.1:48933/health` returned `200`
- preflight from `http://127.0.0.1:8895` returned `403`
- preflight from `http://127.0.0.1:8876` returned `204`
- `backend/platform/server.js` defaults app origin to `http://127.0.0.1:8876`
- `assets/js/app/auth.js` and `assets/js/app/api.js` redirect to `login.html` when backend session/token is not valid enough for protected API flows

Consequence:

- a route can look broken for two different reasons:
  - shell JS crash
  - backend auth/session failure
- current UI does not distinguish those cases clearly

### Root cause E: exams export still depends on remote CDN libraries

Evidence:

- `exams.html` lines `41-43` load:
  - `https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js`
  - `https://unpkg.com/docx@9.5.0/build/index.umd.min.js`
  - `https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js`
- `assets/js/pages/exams-console.js` expects `window.docx`, `window.jspdf`, `window.jsPDF`, and `saveAs`
- browser probe reproduced the remote dependency failure path

Consequence:

- export features can fail from network/CDN/runtime policy issues even when the page itself loads

## Execution Order

Do the tasks in this order unless a new blocker proves otherwise:

1. `RUNTIME-01`
2. `RUNTIME-02`
3. `RUNTIME-03`
4. `RUNTIME-04`
5. `AUTH-01`
6. `RUNTIME-06`
7. `EXAMS-01`
8. `DEV-01`
9. `DX-01`
10. `RUNTIME-05`

Reason:

- `RUNTIME-01` and `RUNTIME-02` are the global shell blockers
- `RUNTIME-04` is the next hard runtime blocker on admin tools
- `AUTH-01` separates actual route bugs from backend/session failures
- `RUNTIME-06` must land before another refactor hides the same regression again

## How To Read Each Task

Every task below uses the same structure:

- `Priority`
  Explains execution urgency.
- `Depends on`
  Tells the next session whether the task can run in parallel or should wait.
- `Why this exists`
  States the bug in plain language.
- `Primary files`
  Lists the most likely edit targets. The final fix may touch more files, but start here.
- `Exact work`
  The implementation checklist. Do not skip items silently.
- `Verification gate`
  The minimum evidence required before lowering `% left`.

If a later session changes the implementation strategy, it must keep the task understandable:

- update `Why this exists` if the root cause changed
- update `Primary files` if ownership changed
- update `Exact work` if the remaining steps changed
- update `% left` only after adding a dated update block

## Repair Backlog

### `RUNTIME-01` `0% left` Restore shell-safe visual helper ownership before theme boot

Priority: `P0`
Depends on: none. This is the first blocking repair.

Short problem statement:

- the shared shell starts reading home-visual state before the home chunk has loaded the functions that own that state

What the user currently sees:

- `index.html?view=student#home` shows shell chrome but the home content is empty
- sidebar navigation is empty
- console throws `getDashboardVisuals is not defined`

How to reproduce now:

1. start frontend on a valid local origin
2. open `index.html?view=student#home`
3. inspect console and DOM
4. observe:
   - `pageerror: getDashboardVisuals is not defined`
   - `#lux-home-shell` exists but has no real dashboard content
   - `#lux-nav` stays empty

Confirmed evidence already found:

- `assets/js/features/index-luxury.js` line `717` defines `getThemeMode()`
- line `719` calls `getDashboardVisuals()`
- line `3698` calls `applyThemeMode(getThemeMode(), false)`
- line `3772` calls `applyThemeMode(getThemeMode(), false)` during startup
- the home bundle is only activated later through `ensureLuxuryHomeDashboardBundle()`
- decoded payload from `assets/js/features/index-home-dashboard.js` contains:
  - `function getDashboardVisuals(...)`
  - `function setDashboardVisuals(...)`

Open these files first:

- `assets/js/features/index-luxury.js`
- `assets/js/features/index-home-dashboard.js`
- `index.html`

Search for these exact strings first:

- `getDashboardVisuals(`
- `setDashboardVisuals(`
- `applyThemeMode(getThemeMode(), false)`
- `ensureLuxuryHomeDashboardBundle()`
- `__kiuRegisterLuxuryHomeChunk`

Exact implementation sequence:

1. Identify the minimum set of functions that `index-luxury.js` needs before first shell sync.
2. Move those functions out of the deferred home chunk into code that is guaranteed to exist before shell startup.
3. If moving them is too invasive, change startup order so no shell code can call those helpers before the provider exists.
4. Re-check every direct reference to those helpers in `index-luxury.js`.
5. Make sure the final ownership is clear:
   - shell-startup helpers stay in eagerly loaded code
   - home-only rendering helpers can stay deferred

Likely safe end state:

- visual-state read/write helpers are available before first call
- home dashboard rendering can still stay route-owned and deferred
- shell startup no longer depends on decoding the entire home dashboard chunk

Do not do this:

- do not leave `getDashboardVisuals()` only inside the base64 home chunk if shared shell startup still calls it
- do not hide the error with `try/catch` while keeping the broken load order
- do not fix only one call site and leave the other early startup calls untouched

Verification gate:

- `index.html?view=student#home` loads with no `getDashboardVisuals is not defined`
- `node tools/capture_home_startup_matrix.mjs` completes instead of timing out
- `#lux-home-shell` contains real dashboard content
- `#lux-nav` contains real nav buttons

When to lower `% left`:

- lower to `60-70% left` only after the helper owner has actually moved or startup order has actually changed
- lower to `1-15% left` only after browser reproduction is clean and the startup probe completes
- set `0% left` only after verification gate is fully checked

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/features/index-luxury.js`, `test/global-performance-regressions.test.js`
- Evidence: `node tools/capture_home_startup_matrix.mjs`, `artifacts/home-role-startup-efficient-desktop-summary.json`, `npm run test:runtime-shell`, post-fix home probe showed no `getDashboardVisuals is not defined`, `#lux-home-shell` length `9951`, and `#lux-nav` count `13`
- Remaining work: none

### `RUNTIME-02` `0% left` Remove home-editor helper leakage from non-home shell paths

Priority: `P0`
Depends on: can be analyzed in parallel, but final verification depends on `RUNTIME-01`.

Short problem statement:

- non-home pages call a home-editor helper that is currently defined only inside the home chunk

What the user currently sees:

- some non-home routes partially render, but shell behavior is still broken
- console throws `isHomeEditorAvailable is not defined`

How to reproduce now:

1. open `social.html`
2. open `faculty-gradebook.html`
3. open `orders.html`
4. inspect console for `isHomeEditorAvailable is not defined`

Confirmed evidence already found:

- `assets/js/features/index-luxury.js` line `3018`
  - `editButton.title = isHomeEditorAvailable()`
- `assets/js/features/index-luxury.js` line `3238`
  - `if (!isHomeEditorAvailable()) { ... }`
- decoded home chunk contains `function isHomeEditorAvailable()`

Open these files first:

- `assets/js/features/index-luxury.js`
- `assets/js/features/index-home-dashboard.js`

Search for these exact strings first:

- `isHomeEditorAvailable()`
- `lux-dashboard-edit-btn`
- `lux-topbar-editor-btn`

Exact implementation sequence:

1. Decide whether `isHomeEditorAvailable()` is truly shared-shell logic or only a home-dashboard concern.
2. If it is shared-shell logic, move it into eagerly loaded shell code.
3. If it is home-only logic, remove direct non-home dependencies:
   - add route guards
   - add `typeof` guards
   - keep topbar sync safe on non-home routes
4. Re-check all topbar edit-button and palette entry points after the change.

Likely safe end state:

- non-home routes never depend on home-only editor helpers
- the topbar can still render and update labels safely outside the home route

Do not do this:

- do not solve this by loading the full home chunk on every route
- do not leave one guarded call and one unguarded call

Verification gate:

- no `isHomeEditorAvailable is not defined` on:
  - `social.html`
  - `faculty-gradebook.html`
  - `orders.html`
- topbar edit/palette controls no longer crash non-home shell startup

When to lower `% left`:

- lower to `60-70% left` after all direct call sites are either moved or guarded
- lower to `1-15% left` only after browser verification is clean on all listed routes

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/features/index-luxury.js`, `test/global-performance-regressions.test.js`
- Evidence: Playwright route probes on `social.html`, `orders.html`, and `faculty-gradebook.html` showed no `isHomeEditorAvailable is not defined`; non-home routes now keep the shell alive and surface backend-session diagnostics instead of crashing
- Remaining work: none

### `RUNTIME-03` `0% left` Restore actual nav rendering after shell startup succeeds

Priority: `P0`
Depends on: `RUNTIME-01`, `RUNTIME-02`

Short problem statement:

- the shell DOM exists, but the actual left navigation never gets populated for live routes

What the user currently sees:

- sidebar frame exists
- nav area is blank
- route content may partially render, but navigation is missing

How to reproduce now:

Open these routes and inspect `#lux-nav`:

- `index.html?view=student#home`
- `lms.html`
- `registration.html`
- `admin-tools.html`
- `admin-scheduler.html`
- `staff.html`
- `students-admin.html`

Current known state:

- route scan showed `navCount: 0` on all of the above
- `renderNav()` exists in `assets/js/features/index-luxury.js`
- nav definitions exist in `NAV_BY_ROLE`

Open these files first:

- `assets/js/features/index-luxury.js`
- `assets/js/features/navigation.js`
- `assets/js/app/state.js`

Search for these exact strings first:

- `function renderNav()`
- `NAV_BY_ROLE`
- `navRoot.dataset.renderSignature`
- `getAllowedPagesForRole`

Exact implementation sequence:

1. After `RUNTIME-01` and `RUNTIME-02`, confirm `syncAll()` reaches `renderNav()` without aborting.
2. Confirm `renderNav()` writes buttons into `#lux-nav`.
3. Confirm render-signature caching is not locking the nav into an empty first render.
4. Confirm role-specific nav groups still match the intended accessible routes.
5. Confirm no later route runtime wipes `#lux-nav`, replaces `#lux-shell`, or hides the nav incorrectly.

Likely failure modes to check:

- `renderNav()` never called because earlier startup crashed
- `renderNav()` runs once while role/page data is not ready and then caching prevents re-render
- route runtime later mutates shell DOM after nav render

Verification gate:

- `navCount > 0` on:
  - `index.html?view=student#home`
  - `lms.html`
  - `registration.html`
  - `admin-tools.html`
  - `admin-scheduler.html`
  - `staff.html`
  - `students-admin.html`
- nav items visually match the expected role

When to lower `% left`:

- lower only after actual browser DOM shows real nav items, not just shell frame

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/features/index-luxury.js`, `tools/runtime_shell_smoke.mjs`, `package.json`
- Evidence: post-fix route matrix showed `navCount > 0` on `index.html?view=student#home` (`13`), `lms.html` (`13`), `registration.html` (`13`), `admin-tools.html` (`11`), `admin-scheduler.html` (`11`), `staff.html` (`11`), and `students-admin.html` (`11`)
- Remaining work: none

### `RUNTIME-04` `0% left` Fix admin registration helper ownership

Priority: `P0`
Depends on: none for code analysis; final route verification is easier after `RUNTIME-01` through `RUNTIME-03`.

Short problem statement:

- the admin registration code calls a helper that is defined only in the student registration runtime

What the user currently sees:

- `admin-tools.html` opens, but the route throws `getStudentCompletedEctsThisSemester is not defined`
- admin workspace is therefore not cleanly booting

How to reproduce now:

1. open `admin-tools.html`
2. inspect console
3. confirm `getStudentCompletedEctsThisSemester is not defined`

Confirmed evidence already found:

- `assets/js/pages/admin-registration.js` line `69`
  - `const totalEcts = getStudentCompletedEctsThisSemester(user.id, fac);`
- `assets/js/pages/student-registration.js` line `1530`
  - defines `function getStudentCompletedEctsThisSemester(...)`
- `admin-tools.html` does not load `assets/js/pages/student-registration.js`

Open these files first:

- `assets/js/pages/admin-registration.js`
- `assets/js/pages/student-registration.js`
- `assets/js/pages/registration.js`
- `admin-tools.html`

Search for these exact strings first:

- `getStudentCompletedEctsThisSemester(`
- `updateEctsProgress()`
- `student-registration.js`

Exact implementation sequence:

1. Decide whether the helper is actually shared business logic or student-route-only logic.
2. If it is shared business logic, move it to a shared registration owner that both admin and student flows can load safely.
3. If admin tools does not really need it, remove or replace that dependency with admin-safe logic.
4. Re-scan `admin-registration.js` for any additional helpers that are only defined in student-only files.

Most likely good final design:

- ECTS calculation helper lives in one shared registration utility
- both student and admin registration use that utility
- `admin-tools.html` does not need to import the full student route runtime

Do not do this:

- do not "fix" by blindly loading the whole `student-registration.js` bundle into admin-tools unless no smaller safe owner exists

Verification gate:

- `admin-tools.html` no longer throws `getStudentCompletedEctsThisSemester is not defined`
- admin registration/library tools still render
- student registration still works after helper extraction

When to lower `% left`:

- lower only after the helper owner is explicit and admin-tools no longer depends on hidden student-only globals

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/pages/registration-shared.js`, `assets/js/pages/admin-registration.js`, `assets/js/pages/student-registration.js`, `admin-tools.html`, `registration.html`
- Evidence: `admin-tools.html` no longer throws `getStudentCompletedEctsThisSemester is not defined`, shared registration helpers now load through `registration-shared.js`, and `registration.html` still boots cleanly with no duplicate declaration or runtime errors
- Remaining work: none

### `AUTH-01` `0% left` Align standalone route auth behavior with backend session requirements

Priority: `P1`
Depends on: final route verification should happen after `RUNTIME-01` through `RUNTIME-03`, otherwise shell crashes can hide auth results.

Short problem statement:

- some routes are failing because auth/session expectations are unclear, not because the route file is missing

What the user currently sees:

- route may show some shell or partial content
- then route fetches fail, redirect to login, or show generic `Failed to fetch`
- this can be confused with route deletion or UI breakage

How to reproduce now:

1. seed only `KIU_AUTH_STATE`
2. do not seed a valid `KIU_PORTAL_SESSION_TOKEN`
3. open these routes:
   - `social.html`
   - `news.html`
   - `student-service.html`
   - `faculty-gradebook.html`
   - `orders.html`
4. observe backend fetch or redirect behavior

Open these files first:

- `assets/js/app/auth.js`
- `assets/js/app/api.js`
- `assets/js/pages/social-page.js`
- `assets/js/pages/news.js`
- `assets/js/pages/student-service.js`

Search for these exact strings first:

- `requireAuth()`
- `getPortalSessionToken()`
- `handleKiuUnauthorizedSession(`
- `kiuPortalFetch(`
- `window.location.assign('login.html')`

Exact implementation sequence:

1. Decide the intended dev/runtime contract in plain terms:
   - is `KIU_AUTH_STATE` enough for shell access?
   - which routes truly require backend session token before boot?
2. Make that contract consistent across route bootstraps.
3. If token is required, fail early with a clear reason.
4. If shell-only local mode is supported, avoid redirect loops that hide the true issue.
5. Make sure auth/session failure messages do not hide shell JS errors.

Verification gate:

- local dev can distinguish:
  - shell JS crash
  - missing backend token
  - unauthorized session
- standalone routes no longer silently "look deleted" when the actual issue is session state

When to lower `% left`:

- lower only after at least two affected standalone routes show clearer, differentiated failure behavior

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/app/api.js`
- Evidence: `orders.html`, `faculty-gradebook.html`, `news.html`, and `student-service.html` now stay on-route with live shell chrome and a `missing-session` diagnostic instead of clearing auth state and redirecting to `login.html`
- Remaining work: none

### `RUNTIME-05` `0% left` Complete the split-bundle ownership audit for remaining shared helper leaks

Priority: `P1`
Depends on: should be updated while completing `RUNTIME-01` through `RUNTIME-04`.

Short problem statement:

- the current helper leaks prove the bundle-split refactor was not fully audited

What this task is for:

- this is the cleanup audit that prevents more hidden startup-order bugs after the first visible ones are fixed

Already confirmed leaks:

- `getDashboardVisuals`
- `setDashboardVisuals`
- `isHomeEditorAvailable`

Open these files first:

- `assets/js/features/index-luxury.js`
- `assets/js/features/index-home-dashboard.js`
- `assets/js/features/index-admin-tools.js`

Search for these exact patterns:

- calls in `index-luxury.js` to functions not defined in the same eager shell file
- globals assigned only inside base64 chunk payloads
- route-owned helpers referenced from shared shell startup

Exact implementation sequence:

1. Build a helper ownership table with these columns:
   - helper name
   - first caller
   - current owner file
   - required before shell startup: yes/no
   - can stay lazy-loaded: yes/no
   - final owner
2. Use that table while fixing `RUNTIME-01` through `RUNTIME-04`.
3. Remove any remaining shared-shell startup dependency on route-owned chunks.
4. Record the final ownership table inside this tracker or a linked tracker.

Verification gate:

- `index-luxury.js` can bootstrap on non-home pages without the home chunk
- `index-luxury.js` can bootstrap on non-admin-tools pages without the admin-tools chunk
- ownership table exists and is understandable to a new session

When to lower `% left`:

- lower after the ownership table is written and all confirmed startup-critical leaks are resolved or tracked explicitly

Final ownership table:

| Helper | First caller | Current owner before fix | Required before shell startup | Can stay lazy-loaded | Final owner |
| --- | --- | --- | --- | --- | --- |
| `createDashboardPreferenceEntry` | `getDashboardPreferenceEntry()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `getDashboardPreferenceEntry` | `resolveHomeLayout()` / `getDashboardVisuals()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `updateDashboardPreferenceEntry` | `saveHomeEditor()` / `setDashboardVisuals()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `getDashboardVisuals` | `getThemeMode()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `setDashboardVisuals` | `applyThemeMode()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `isHomeEditorAvailable` | `syncTopbar()` / topbar editor click path | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `resolvePaletteKey` | `syncStudioUi()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `resolveCustomPalette` | `syncStudioUi()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `applyResolvedPalette` | `ready()` / `syncAll()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `applyAtmosphereSettings` | `ready()` / `syncAll()` in `index-luxury.js` | deferred `index-home-dashboard.js` | yes | no | eager `index-luxury.js` |
| `renderDynamicHomeShell` | `renderHomeShell()` in `index-luxury.js` | deferred `index-home-dashboard.js` | no | yes | deferred override from `index-home-dashboard.js` |

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/features/index-luxury.js`, `test/global-performance-regressions.test.js`
- Evidence: non-home shell routes now bootstrap without home-chunk startup failures, the ownership table above records the eager/lazy boundary, and the route matrix stayed clean across home, staff, admin, and student surfaces
- Remaining work: none

### `RUNTIME-06` `0% left` Add runtime coverage that fails on the current live bug

Priority: `P1`
Depends on: should be implemented alongside `RUNTIME-01` through `RUNTIME-04`, while the remediation context is still current.

Short problem statement:

- the current test suite is green but does not catch the live browser failure

Why this matters:

- if this task is skipped, the same class of bug can return after a future refactor and the tests may still pass

Current confirmed gap:

- `npx vitest run` passed `150/150`
- real browser routes still failed with empty nav and runtime exceptions

Open these files first:

- `test/global-performance-regressions.test.js`
- `tools/capture_home_startup_matrix.mjs`
- any existing route capture scripts under `tools/`

Exact implementation sequence:

1. Add at least one real browser smoke script or test for shell startup.
2. Make it fail when:
   - `pageerror` occurs during shell boot
   - `#lux-nav` stays empty
   - `#lux-home-shell` stays empty on home
3. Add one regression for admin-tools unresolved helper ownership.
4. Add one regression for non-home `isHomeEditorAvailable` leakage.
5. Document which checks are static-only and which are real browser/runtime checks.

Good final outcome:

- one command clearly fails on the current broken state
- the same command clearly passes only after the live shell really works

Verification gate:

- new runtime coverage fails on the broken state
- new runtime coverage passes after the fixes land

When to lower `% left`:

- lower only after the new runtime check actually proves it can catch the class of bug that static tests missed

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/runtime_shell_smoke.mjs`, `package.json`, `package-lock.json`, `test/global-performance-regressions.test.js`
- Evidence: the pre-fix route baseline on the same home/admin/social trio recorded `pageerror`, `navCount: 0`, and empty home shell content; `npm run test:runtime-shell` now exits cleanly only when those browser conditions stay healthy, and `npx vitest run` passes `150/150`
- Remaining work: none

### `EXAMS-01` `0% left` Remove remote CDN dependency from exams export

Priority: `P1`
Depends on: independent of the main shell fix for code work; browser verification is clearer after `RUNTIME-01` through `RUNTIME-03`.

Short problem statement:

- exams export currently depends on live remote libraries, so export can break from network or browser policy issues

What the user currently sees:

- export buttons can fail even if the exam page itself loaded
- DOCX/PDF features are not fully self-contained

Current confirmed evidence:

- `exams.html` loads export libraries from `unpkg.com`
- `assets/js/pages/exams-console.js` expects globals from those libraries
- browser reproduction hit the remote dependency failure path

Open these files first:

- `exams.html`
- `assets/js/pages/exams-console.js`
- local vendor candidates under `assets/vendor/export-libs/`

Search for these exact strings:

- `unpkg.com/jspdf`
- `unpkg.com/docx`
- `unpkg.com/file-saver`
- `window.docx`
- `window.jspdf`
- `saveAs`

Exact implementation sequence:

1. Replace remote CDN script tags with local pinned assets if they already exist.
2. If they must be lazy-loaded, lazy-load only local assets.
3. Make export failure messages specific and route-local.
4. Re-test both PDF and DOCX export flows after the change.

Verification gate:

- `exams.html` no longer depends on remote `unpkg.com` export libs at runtime
- PDF export path works
- DOCX export path works
- no ORB/network-policy dependency remains for basic export

When to lower `% left`:

- lower only after HTML/script source no longer depends on remote export libraries and both export paths are re-tested

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `exams.html`
- Evidence: Playwright exams probe showed `usesRemoteExportLib: false`, local script sources under `assets/vendor/export-libs/`, DOCX export saved `Microeconomics_Midterm.docx`, and the PDF save hook captured `Microeconomics_Midterm.pdf`
- Remaining work: none

### `DEV-01` `0% left` Align frontend dev origin, backend CORS, and startup docs

Priority: `P1`
Depends on: none. Can be improved in parallel with runtime fixes.

Short problem statement:

- local frontend and backend defaults do not line up cleanly, so dev runs can fail before route bugs are even diagnosed

Current confirmed evidence:

- frontend on `8895` hit preflight `403`
- frontend on `8876` hit preflight `204`
- backend default app origin is `http://127.0.0.1:8876`

Open these files first:

- `tools/local_dev_server.py`
- `backend/platform/server.js`
- `backend/start_server.bat`
- `README.md`
- `.env.example` if needed

Exact implementation sequence:

1. Decide the one default supported local frontend origin.
2. Make backend local CORS logic match that default.
3. If multiple local origins are intentionally supported, document that and configure it explicitly.
4. Add one clear "known-good local startup" section with:
   - frontend command
   - backend command
   - health-check command
   - expected response

Verification gate:

- a developer can start the supported local stack without ad hoc CORS debugging
- `OPTIONS` preflight succeeds from the documented frontend origin

When to lower `% left`:

- lower only after both code and docs agree on the supported local startup contract

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `README.md`
- Evidence: `README.md` now documents `http://127.0.0.1:8876` as the known-good frontend origin, `GET http://127.0.0.1:48933/health` returned `200`, and `OPTIONS /api/bootstrap` from `Origin: http://127.0.0.1:8876` returned `204` with `Access-Control-Allow-Origin: http://127.0.0.1:8876`
- Remaining work: none

### `DX-01` `0% left` Improve developer-visible diagnostics for backend/session failures

Priority: `P2`
Depends on: should be updated after or during `AUTH-01`.

Short problem statement:

- current error reporting makes different failure classes look the same

What needs to become easier to understand:

- shell JS crash
- backend unavailable
- unauthorized session
- missing backend config
- route-specific data failure

Open these files first:

- `assets/js/app/auth.js`
- `assets/js/app/api.js`
- `assets/js/pages/login-runtime.js`
- route bootstraps that currently surface raw `Failed to fetch`

Exact implementation sequence:

1. Replace ambiguous raw route failures with clearer diagnostics.
2. Tell the user or developer which class of problem occurred:
   - frontend shell JS
   - backend unavailable
   - backend unauthorized
   - backend configuration missing
3. Avoid immediate redirect-to-login when a clearer local-dev explanation can be shown first.
4. Keep user-facing wording simple while preserving enough detail for developers in console/log output.

Verification gate:

- login and standalone routes expose useful failure reasons instead of only `Failed to fetch`
- a developer can tell why a route failed without re-reading the source first

When to lower `% left`:

- lower only after at least one standalone route and the login route show clearer differentiated diagnostics

Update `2026-05-17`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/app/api.js`, `assets/js/pages/login-runtime.js`
- Evidence: standalone routes now show a named runtime banner with the failure class and route path (`missing-session`), and `login.html` with `KIU_PORTAL_BACKEND_URL=http://127.0.0.1:59999` shows `Portal backend is unavailable at http://127.0.0.1:59999. Start the backend service and try again.`
- Remaining work: none

## Minimal Verification Matrix After Fix

### Shared-shell smoke routes

- `index.html?view=student#home`
- `lms.html`
- `registration.html`
- `profile.html`
- `social.html`
- `admin-tools.html`
- `admin-scheduler.html`
- `staff.html`
- `students-admin.html`

### Required checks

- no uncaught `pageerror`
- `#lux-shell` exists
- `#lux-topbar` exists
- `#lux-nav` is populated
- theme/palette control exists
- home route shows non-empty dashboard shell

### Extra route checks

- `admin-tools.html`
  - no `getStudentCompletedEctsThisSemester` error
- `social.html`
  - no `isHomeEditorAvailable` error
- `exams.html`
  - export libs no longer depend on live CDN

## Important Note For The Next Session

Do **not** start by deleting pages or rewriting layouts.

The primary failure is shared-shell startup order plus leaked helper ownership. Until those are fixed, many healthy route files will keep looking blank, deleted, or theme-broken even though the HTML still exists.
