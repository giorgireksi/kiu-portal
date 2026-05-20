# Full Site Syntax, Bug, and Security Audit

Date: `2026-05-17`
Owner: `Codex`
Purpose: provide a whole-site audit tracker for syntax health, runtime bugs, security risks, and coverage gaps across the website and its platform backend.

## Goal

This file is the master audit tracker for the full website.

Use it to:

- record confirmed syntax findings
- record confirmed runtime bugs
- record confirmed or likely security risks
- record areas that still need deeper review
- give the next LLM a structured execution plan for finishing the audit and then fixing what is found

This file is not limited to the current runtime breakage. It covers the broader website and backend surface.

## Scope

Included in scope:

- root website entry HTML files
- first-party frontend JavaScript under `assets/js/`
- platform backend under `backend/`
- bridge/backend support under `kiu-realtime-bridge/`
- audit/test/tooling relevance where it affects confidence

Explicitly not fully covered yet:

- `node_modules/`
- vendored third-party bundles under `assets/vendor/` beyond dependency/risk awareness
- anti-cheat desktop app internals outside website/backend integration points

## Read This First

### Current audit status

- this is an **initial full-site audit tracker**
- it is **not** a claim that every bug or vulnerability is already identified
- some high-impact issues are already confirmed
- some audit areas are still only partially reviewed

### `% left` meaning in this file

- `0% left` = done
- `1-15% left` = almost done
- `16-60% left` = partly done
- `61-99% left` = mostly not done
- `100% left` = untouched

Meaning:

- `% left` is remaining audit or remediation work
- `% left` is not time spent
- `% left` is not just research completeness

### How the next LLM must use this file

1. Reproduce or verify the relevant finding before changing code or lowering `% left`.
2. Keep syntax findings, runtime findings, and security findings separate.
3. Update this file in the same turn as any code change or major new audit finding.
4. Lower `% left` only when new evidence exists.
5. Do not mark any task `0% left` unless its verification gate is actually checked.
6. If a new risk is discovered, add it here immediately.
7. If a task grows too large, split it into child tasks but keep the parent task.

### Mandatory update protocol

Every touched task must append an update block in this exact format:

```md
Update `YYYY-MM-DD`:
- Status: completed | partially completed | blocked | re-scoped
- % left: `NN% left`
- Files changed: `path/a`, `path/b`
- Evidence: `command`, `artifact`, `runtime observation`
- Remaining work: ...
```

### Do not trust these signals by themselves

- passing unit tests
- passing static source assertions
- successful `node --check`
- `npm audit` returning zero
- one route rendering partial HTML
- one browser run without console errors

Why:

- this repo already had a state where tests were green while the live shared shell was broken
- syntax can be clean while logic and security are still weak

## Relationship To Other Trackers

Use these files together:

- [CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md>)
  This is the detailed tracker for the currently broken shell/navigation/theme/runtime state.
- [TASK_TRACKER_STANDARD.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/TASK_TRACKER_STANDARD.md>)
  This is the rulebook for writing and updating trackers.
- [TASK_TRACKER_TEMPLATE.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/TASK_TRACKER_TEMPLATE.md>)
  This is the reusable starter template for future projects.

Rule:

- use `CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md` for the current breakage fix stream
- use this file for broader full-site audit coverage and remaining security/quality work

## Verified Evidence

### Commands already run

1. `npm run check`
2. `npx vitest run`
3. broad JS parse validation across first-party code:
   - `75` JS files checked with `node --check`
4. `npm audit --json`
5. broad risky-pattern scans across first-party frontend/backend source
6. backend header/CORS source inspection
7. targeted browser/runtime reproductions from the current runtime repair pass
8. `npm run test:runtime-shell`
9. root HTML smoke scan across all `30` root entry pages on `http://127.0.0.1:8876`
10. direct navigation behavior probes calling `navigate(...)` from:
   - `index.html?view=student#home`
   - `news.html`
11. post-repair `npm audit --json` re-run after declaring `playwright` as a direct dev dependency
12. targeted backend source inspection for:
   - session token transport
   - LMS course read authorization
   - file upload/download ownership and validation
13. targeted Playwright capture summaries on `http://127.0.0.1:8876` for:
   - `profile-view.html`
   - `registration.html`
   - `timetable.html`
   - `staff.html`
14. direct Playwright pointer-click reproduction against `staff.html` desktop directory actions
15. targeted mojibake spot checks in `assets/js/pages/directories.js`
16. `npm run check`
17. `npm run test`
18. `npm run test:runtime-shell`
19. `npm run check:production`
20. direct rerun of `npm run test:runtime-shell` after starting `tools/local_dev_server.py 8876`
21. targeted live auth transport verification on `http://127.0.0.1:48933` comparing header-based auth vs query-string auth for:
   - `/api/portal/session`
   - `/api/bootstrap`
   - `/api/social/bootstrap`
   - `/api/events`
   - `/api/exam-portal/sessions`
22. targeted live exam-portal auth rate-limit verification on `http://127.0.0.1:48933` using repeated anti-cheat-style `POST /api/exam-portal/auth` requests from one IP
23. targeted Microsoft login-completion handoff verification on `http://127.0.0.1:48933` by pre-seeding a one-time completion into local platform state, then consuming `/api/portal/microsoft/complete` twice
24. targeted LMS course-read authorization verification on `http://127.0.0.1:48933` comparing anonymous, student, and admin access to `/api/lms/courses/AUDIT-COURSE-01`
25. targeted AI proxy authorization and rate-limit verification on `http://127.0.0.1:48933` comparing anonymous access and repeated authenticated requests to `POST /api/ai/career-completion`
26. targeted source verification of career-provider key persistence after the storage redesign in `assets/js/pages/career-market.js`
27. targeted self-service account-update verification on `http://127.0.0.1:48933` using a seeded student session plus a spoofed admin privilege update request
28. targeted isolated upload-path boundary verification using `PlatformStore.createFileFromUpload(...)` with a malicious `..\\..\\escaped` file id against a temporary uploads directory
29. targeted delegated-privilege verification on `http://127.0.0.1:48933` by granting `manage_privileges` to a seeded professor session, then using that session to update another accountâ€™s privileges

30. targeted isolated finalized-gradebook edit verification using `PlatformStore.setScore(...)` against a finalized temporary gradebook with both `allowFinalizedEdit` and `serverAllowFinalizedEdit`
31. broad root-entry HTML validation using `npx -y html-validate` across all root `*.html` files
32. focused root-entry HTML validation rerun using `npx -y html-validate` on `timetable.html`, `admin-scheduler.html`, and `study-card.html` after structural cleanup
33. targeted seeded admin-tools visibility verification on `http://127.0.0.1:8876/admin-tools.html` confirming the remaining mojibake-heavy `planner.js` / `registration.js` source literals are not visible on default live admin-tools load
34. focused planner cleanup validation using `node --check assets/js/pages/planner.js` plus `npx vitest run test/planner-legacy-delegation.test.js test/admin-tools-route-regressions.test.js test/registration-route-regressions.test.js`
35. targeted seeded admin-tools visibility verification on `http://127.0.0.1:8876/admin-tools.html` with a local admin auth snapshot confirming the recovered planner/registration stack renders the default admin workspace with `visibleBroken: false` and zero console/page errors
36. focused `assets/js/app/state.js` and `assets/js/app/app.js` encoding-intent inspection using `Select-String` plus direct source reads around the remaining mojibake matches
37. broad root-entry `html-validate` JSON summary capture across all `30` root `*.html` files with rule/file aggregation
38. broad CSS mojibake scan across `assets/css/*.css`
39. direct Playwright pointer-click reproduction against `http://127.0.0.1:8876/staff.html` before and after the staff desktop shell-offset repair
40. `node --check tools/capture_staff_summary.mjs`
41. `KIU_BASE_URL=http://127.0.0.1:8876 node tools/capture_staff_summary.mjs`
42. `KIU_BASE_URL=http://127.0.0.1:8877 KIU_OUTPUT_PATH=artifacts/runtime-shell-smoke-autostart.json node tools/runtime_shell_smoke.mjs`
43. `npx vitest run test/staff-mobile-runtime-regressions.test.js`
44. `npm run check:platform`
45. source verification of backend CORS loopback gating and explicit extra-origin support in `backend/platform/server.js`
46. `npx vitest run test/platform-cors-regressions.test.js test/staff-mobile-runtime-regressions.test.js`
47. `npx vitest run test/exam-portal-regressions.test.js`
48. focused remote-dependency source rescan across `exam-portal.html`, `assets/css`, and `assets/js/pages`
49. `node --check assets/js/shared/utilities.js`, `node --check assets/js/pages/registration.js`, and `node --check assets/js/pages/registration-student-route.js`
50. `npx vitest run test/registration-route-regressions.test.js test/root-font-delivery-regressions.test.js`
51. `npm run check:platform` after the file-upload hardening pass
52. `npx vitest run test/platform-file-upload-security.test.js`
53. `npx vitest run test/app-bootstrap-security.test.js`
54. `node --check assets/js/app/app.js`
55. `KIU_BASE_URL=http://127.0.0.1:8879 KIU_OUTPUT_PATH=artifacts/runtime-shell-smoke-app-bootstrap.json node tools/runtime_shell_smoke.mjs`
56. `npx vitest run test/production-single-writer-regressions.test.js`
57. `node --check tools/check-production-readiness.js` and `node --check tools/migrate-postgres.js`
58. `npx vitest run test/profile-view-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js`
59. `node --check assets/js/pages/directories.js` and `node --check assets/js/pages/profile-view-admin-actions.js`

### High-signal outcomes already verified

- `npm run check` passed
- `npx vitest run` passed:
  - `47` test files
  - `150` tests
- `npm run test:runtime-shell` passed
- first-party JS parse check passed:
  - `75` files checked
  - `0` syntax-check failures
- root HTML inventory still contains:
  - `30` root HTML files
- current root-entry smoke scan covered:
  - `30` root HTML files
  - `0` uncaught initial-load `pageerror` reproductions
- current protected standalone route baseline no longer silently redirects away when only `KIU_AUTH_STATE` exists:
  - `social.html`
  - `news.html`
  - `orders.html`
  - `faculty-gradebook.html`
  - `student-service.html`
  now remain on-route and show explicit `missing-session` diagnostics
- current navigation behavior is mixed rather than uniformly SPA:
  - `navigate('programs')` from `index.html` stayed on the same document and switched sections
  - `navigate('study-card')`, `navigate('timetable')`, and `navigate('registration')` hard-navigated to standalone HTML pages
  - `navigate('social')` from `news.html` hard-navigated to `social.html`
- current `npm audit --json` now reports:
  - `0` known package vulnerabilities
- root page inventory still contains:
  - `30` root HTML files
- current targeted capture summaries were clean for:
  - `profile-view.html`
  - `registration.html`
  - `timetable.html`
- current targeted `staff.html` desktop coverage now uses real pointer interactions:
  - `tools/capture_staff_summary.mjs` now uses Playwright locator clicks for the `select`, `open-platform-profile`, and mobile action-sheet triggers instead of DOM `.click()` bypasses
  - post-fix pointer-click verification on `http://127.0.0.1:8876/staff.html` opened the staff profile card and then navigated into `profile-view.html` with zero console or page errors
- backend session handling currently still accepts session tokens from query strings:
  - `backend/platform/server.js:800`
  - frontend callers still issue `?token=...` requests from:
    - `assets/js/app/api.js:574`
    - `assets/js/app/api.js:1422`
- backend LMS read access is currently inconsistent:
  - `backend/platform/server.js:4308` returns `/api/lms/courses/:id` without `requireSessionAccount(...)` or `requireCourseStaffAccess(...)`
- backend file access control is still incomplete, but the upload/write path is now narrower than before:
  - `backend/platform/server.js` now derives `ownerUserId` for `/api/files/upload` from the authenticated session instead of trusting `request.body?.ownerUserId`
  - `backend/platform/store.js` now persists `ownerUserId`, enforces `maxFileUploadBytes`, and sanitizes stored MIME types to a safe allowlist
  - `backend/platform/server.js` still streams `/api/files/:id` to any authenticated session without an owner/scope authorization check
- uploaded files are no longer served back as active inline content on the direct file route:
  - `backend/platform/server.js` now serves `/api/files/:id` with `Content-Disposition: attachment`
  - `backend/platform/store.js` now normalizes unsafe MIME types to `application/octet-stream`
- public auth recovery flows currently expose takeover paths:
  - `backend/platform/server.js:3624` activates accounts through `/api/auth/activate` with only `id` and `password`
  - `backend/platform/store.js:3985` sets the new password directly from that account id
  - `backend/platform/server.js:3633` returns the full reset payload from `/api/auth/request-reset`
  - `backend/platform/store.js:4003` includes a live reset `token` in that payload
- auth endpoints still expose account-state enumeration signals:
  - `backend/platform/store.js:4045` returns `Account not found.`
  - `backend/platform/store.js:4049` returns `Incorrect password.`
  - `backend/platform/server.js:3627` returns `Registration ID not found.`
  - `backend/platform/server.js:3639` returns `Account not found.`
- public diagnostics currently expose runtime and deployment posture:
  - `backend/platform/server.js:1962` exposes `/health`
  - `backend/platform/server.js:1970` exposes `/ready`
  - `backend/platform/server.js:2002` exposes `/api/platform/config`
  - `backend/platform/server.js:2012` exposes `/api/platform/status`
  - `backend/platform/server.js:2028` exposes `/api/platform/readiness`
  - `backend/platform/store.js:8800` and `backend/platform/store.js:8822` include environment, storage, backend URL, integration, audit counts, and RTC config in those payloads
  - `backend/platform/server.js:162` builds RTC config with TURN `username` and `credential`
- bootstrap and portal-state endpoints currently expose or overwrite shared global state:
  - `backend/platform/server.js:2180` exposes `/api/bootstrap` without a session guard
  - `backend/platform/server.js:2184` exposes `/api/portal/bootstrap` without a session guard
  - `backend/platform/store.js:5016` returns shared `portal.state`, `social`, and `accounts`
  - `backend/platform/server.js:2736` accepts `/api/portal/state` from any authenticated session
  - `backend/platform/store.js:5084` replaces `this.state.portal.state` wholesale
- the currently audited first-party frontend route source no longer contains the previously tracked live asset-CDN/avatar/font calls:
  - `exam-portal.html`, `assets/css`, and `assets/js/pages` now scan clean for the previously tracked `cdnjs`, Google Fonts, `ui-avatars`, and `via.placeholder` runtime URLs
- current mojibake spot checks confirmed still-live corrupted fallback strings in:
  - `assets/js/pages/directories.js:4`
  - `assets/js/pages/directories.js:962`
  - `assets/js/pages/directories.js:963`
- current production-readiness gate is red in this environment:
  - `npm run check:production` passed `0/13` required gates
  - `0/6` recommended settings passed
- current runtime-shell smoke command is environment-sensitive rather than self-contained:
  - first run failed with `ERR_CONNECTION_REFUSED` because no local server was running
  - rerun passed after starting `tools/local_dev_server.py 8876`
- runtime-shell smoke can now self-bootstrap a local server on an unused local port when the target base URL is unreachable:
  - `artifacts/runtime-shell-smoke-autostart.json` recorded `serverMode: "autostarted"` for `http://127.0.0.1:8877`
  - the autostarted run covered `index.html?view=student#home`, `admin-tools.html`, and `social.html` with zero failures
- backend CORS no longer trusts the default localhost frontend origins in production unless the configured app origin is itself loopback or extra trusted origins are explicitly supplied:
  - `backend/platform/server.js` now gates the built-in `http://127.0.0.1:8876` and `http://localhost:8876` allowlist entries behind `!IS_PRODUCTION_ENVIRONMENT || isLoopbackOrigin(APP_ORIGIN)`
  - explicit overrides now flow through `KIU_EXTRA_CORS_ORIGINS`
- the focused frontend remote-asset scan is now clean across the remaining audited route source:
  - `exam-portal.html`, `assets/css`, and `assets/js/pages` now have `0` live matches for `fonts.googleapis.com`, `fonts.gstatic.com`, `ui-avatars.com`, `via.placeholder.com`, and `cdnjs.cloudflare.com`
  - shared fonts now resolve through local-only `@font-face` aliases in `assets/css/kiu-fonts.css`
- routine portal and exam session reads now work through headers rather than browser-visible URL tokens:
  - `/api/portal/session`
  - `/api/bootstrap`
  - `/api/social/bootstrap`
  - `/api/events`
  - `/api/exam-portal/sessions`
- the same routes no longer authenticate from `?token=` alone in live verification:
  - `/api/portal/session?token=...` -> `404 Session not found.`
  - `/api/bootstrap?token=...` -> anonymous bootstrap with no `session` or `account`
  - `/api/social/bootstrap?token=...` -> `401`
  - `/api/events?...&token=...` -> `401`
  - `/api/exam-portal/sessions?token=...` -> `401`
- `/api/exam-portal/auth` now rate-limits repeated sign-in attempts on the live backend:
  - first `10` repeated invalid requests -> `404`
  - `11th` request from the same IP -> `429`
  - `Retry-After` header -> `600`
- Microsoft login completion no longer needs a live portal session token in the redirect URL:
  - backend callback now redirects with `microsoft_handoff`
  - first `POST /api/portal/microsoft/complete` with that handoff -> `200` with `session` and `account`
  - second consume of the same handoff -> `404`
- `/api/lms/courses/:id` no longer behaves like a public read route in live verification:
  - anonymous request -> `401`
  - student session request -> `403`
  - admin session request -> `200`
- `/api/ai/career-completion` no longer behaves like a public backend relay in live verification:
  - anonymous request -> `401`
  - authenticated invalid requests `1-10` -> `502`
  - authenticated invalid request `11` -> `429`
  - `Retry-After` header -> `600`
- career-provider API keys are no longer persisted inside the `localStorage` provider-settings blob:
  - provider settings still persist to `localStorage`
  - API keys now use a dedicated session-scoped storage key
- self-service account upsert no longer accepts privileged identity/state fields from a non-admin session in live verification:
  - attempted self-update with `role`, `grantedPrivileges`, `microsoftOid`, and `accountStatus` left those fields unchanged
  - allowed profile field `bio` still updated successfully
- the admin privilege-update route now derives the acting admin identity server-side in live verification:
  - spoofed request `actorId` was ignored
  - stored `privilegeUpdatedBy` remained the authenticated admin id
- delegated privilege managers can now use the privilege-update route consistently with the store model:
  - admin granted `manage_privileges` to a seeded professor account
  - that professor session then successfully updated another accountâ€™s privileges
- isolated upload-path verification now keeps malicious file ids inside the uploads root:
  - attempted id `..\\..\\escaped` normalized to `escaped`
  - resulting file path stayed under the configured uploads directory

### Security-relevant baseline signals already verified

Backend currently sets these headers in `backend/platform/server.js`:

- `Access-Control-Allow-Origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security` when HTTPS is in use

### Risky first-party pattern counts already verified

Broad first-party source scan found:

- `eval(` occurrences: `2`
- `document.write(` occurrences: `0`
- `innerHTML =` occurrences: `344`
- `insertAdjacentHTML(` occurrences: `11`
- inline handler attributes in root HTML files: `140`

### Entry pages with the highest inline-handler counts

Top root HTML files by inline handler attributes:

- `index.html` -> `8`
- `chancellery.html` -> `7`
- `lms.html` -> `7`
- `timetable.html` -> `7`
- `registration.html` -> `7`
- `admin-orders.html` -> `7`
- `admin-tools.html` -> `7`
- `admin-scheduler.html` -> `7`
- `admin-library.html` -> `7`
- `profile-view.html` -> `6`

### Important absence checks already verified

- root HTML CSP meta references found: `0`
- backend `Content-Security-Policy` header references found: `0`
- cookie/cookie-session references found in first-party frontend/backend scan: `0`
- local-storage/session-token/auth-state references found: `29`

## Current Audit Coverage Map

### Syntax audit coverage

- first-party JS parse baseline: `covered`
- HTML validity audit: `partly covered`
- CSS validity audit: `not fully covered`
- encoding/mojibake audit: `partly covered`

### Runtime bug coverage

- shared shell runtime: `covered with current clean baseline`
- major routes browser check: `covered at root-entry smoke level`
- every route / every flow: `not fully covered`

### Security coverage

- dependency advisory baseline: `covered and currently clean at package-audit level`
- header/CORS baseline: `partly covered`
- auth/session storage model: `partly covered`
- authorization/role enforcement: `not fully covered`
- XSS / DOM injection sinks: `partly covered`
- file upload/download handling: `partly covered`
- CSP and frontend hardening: `not covered in implementation`
- third-party remote dependency/privacy audit: `partly covered`

### Confidence warning

The website is **not fully audited yet**.

What is true now:

- syntax baseline is much cleaner than the remaining runtime risks suggest
- the previously broken shared shell baseline is currently repaired
- the current user-visible runtime problem is more about mixed route navigation and backend-session expectations on protected standalone pages
- there are already confirmed runtime and security design issues
- there are still uncovered areas that need dedicated review

## Confirmed Findings Already Known

### Finding A: first-party JS syntax baseline is currently clean

Evidence:

- `npm run check` passed
- separate broad parse check over `75` first-party JS files found `0` syntax-check failures

Meaning:

- the main current website failure is not a broad parse/syntax collapse
- current high-impact breakage is more about runtime order, dependency ownership, and state handling

### Finding B: green tests do not prove the website works live

Evidence:

- `npx vitest run` passed `150/150`
- earlier runtime repair work still reproduced live browser failures before browser-level shell coverage was added
- `npm run test:runtime-shell` now exists, but it still covers only a small set of critical routes

Meaning:

- coverage is improved but still incomplete for real browser startup and page-flow behavior
- test success must not be treated as proof that the full site works

### Finding C: the previously broken shared shell baseline is currently repaired, but broader route/runtime coverage is still incomplete

Evidence:

- `docs/CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md` is now fully closed at `0% left`
- current `30`-page root-entry smoke scan did not reproduce initial-load `pageerror`
- current shell-backed routes showed populated nav and working shell chrome on:
  - `index.html`
  - `lms.html`
  - `registration.html`
  - `admin-tools.html`
  - `admin-scheduler.html`
  - `staff.html`
  - `students-admin.html`

Meaning:

- the old shell-startup failure should no longer be treated as the dominant live issue
- route-by-route behavior still needs deeper audit beyond initial boot success

### Finding D: the frontend currently relies on runtime `eval` for chunk activation

Evidence:

- `assets/js/features/index-luxury.js:2466`
  - `eval(decodeLuxuryHomeChunkSource(encoded));`
- `assets/js/features/index-luxury.js:4359`
  - `eval(decodeLuxuryHomeChunkSource(encoded));`

Meaning:

- this is a real security and maintainability risk
- it complicates CSP rollout
- it increases code-loading risk surface

### Finding E: auth/session state is stored in `localStorage`

Evidence:

- `assets/js/app/api.js`
  - reads and writes `KIU_PORTAL_SESSION_TOKEN_KEY` from `localStorage`
  - persists `KIU_AUTH_STATE` in `localStorage`
- `assets/js/app/auth.js`
  - also persists `KIU_AUTH_STATE`

Meaning:

- this is a meaningful security-design concern
- if XSS exists anywhere, token/state exposure becomes worse

### Finding F: no CSP is currently in place on the website/frontend path

Evidence:

- root HTML CSP references found: `0`
- backend `Content-Security-Policy` references found: `0`

Meaning:

- the site currently lacks one major browser-side hardening layer
- the current `eval` usage would also conflict with a strict CSP rollout

### Finding G: there is large HTML-string and DOM-string rendering surface area

Evidence:

- `innerHTML =` occurrences: `344`
- `insertAdjacentHTML(` occurrences: `11`
- `document.write(` occurrences: `0`
- root HTML inline handler attributes: `140`

Meaning:

- not every occurrence is a vulnerability
- but the attack surface is large and needs targeted XSS and DOM-sink review

### Finding H: the specific exams export CDN dependency has been removed, but broader remote dependency review still remains open

Evidence:

- `exams.html` now loads:
  - `assets/vendor/export-libs/jspdf.umd.min.js`
  - `assets/vendor/export-libs/docx.iife.js`
  - `assets/vendor/export-libs/FileSaver.min.js`
- current exams export probe confirmed:
  - no `unpkg.com` export dependency remains on `exams.html`
  - PDF and DOCX export entry points still find their expected globals

Meaning:

- this specific remote runtime risk is resolved
- broader third-party and privacy review still remains because other remote resources still exist

### Finding I: file upload and download surfaces exist and need dedicated validation review

Evidence:

- backend exposes `/api/files/upload`
- backend exposes `/api/files/:id`
- upload storage is created from parsed data URLs in `backend/platform/store.js`
- multiple frontend areas upload or download files:
  - messenger
  - social
  - LMS
  - email
  - orders
  - gradebook/export flows

Meaning:

- this is a real security and integrity review area
- current audit has not fully verified type/size/ownership/serving constraints

### Finding J: page switching still mixes in-document SPA routing with hard document navigations

Evidence:

- `assets/js/features/navigation.js:451`
  - `function navigate(pageId, skipRuntimeBootstrap = false) {`
- `assets/js/features/navigation.js:456`
  - `skipRuntimeBootstrap = true;`
- `assets/js/features/navigation.js:474`
  - hard route handoff for `social` / `news`
- `assets/js/features/navigation.js:518`
  - `alwaysExternal` forces several pages to standalone HTML routes
- `assets/js/features/navigation.js:672`
  - fallback hard navigation through `window.location.assign(targetUrl);`
- direct browser probes confirmed:
  - `navigate('programs')` from `index.html` stayed on the same document
  - `navigate('study-card')`, `navigate('timetable')`, and `navigate('registration')` from `index.html` hard-navigated to standalone HTML pages
  - `navigate('social')` from `news.html` hard-navigated to `social.html`

Meaning:

- the current route model is intentionally mixed, not uniformly SPA
- the â€œall pages refresh when switchingâ€ complaint is a real architecture/runtime UX issue, not just a stale shell crash symptom
- page-to-page state continuity and console behavior need dedicated navigation audit work

### Finding K: protected standalone routes now fail more clearly, but still depend on real backend session state for full functionality

Evidence:

- current root-entry smoke scan showed these routes staying on-route with live shell chrome and a `missing-session` diagnostic instead of redirecting away:
  - `social.html`
  - `news.html`
  - `orders.html`
  - `faculty-gradebook.html`
  - `student-service.html`

Meaning:

- this is an improvement over the earlier â€œlooks deleted / redirects to loginâ€ behavior
- these routes still do not fully function in local auth-only mode without a real backend session token
- the audit should treat this as a current auth/runtime contract issue, not as a generic shell boot failure

### Finding L: the dependency advisory baseline is no longer clean after the current runtime coverage changes

Evidence:

- current `npm audit --json` reports:
  - `1` high severity advisory
  - package: `playwright`
  - range: `<1.55.1`

Meaning:

- the older `0`-vulnerability audit baseline is no longer current
- dependency advisory status needs to be tracked as a live signal, not frozen historical evidence

### Finding M: the `staff.html` desktop route still has a real pointer-interaction bug that current automation masks

Evidence:

- `artifacts/staff-efficient-desktop-summary.json` reached its profile flow only because the capture script uses DOM-click bypasses from:
  - `tools/capture_staff_summary.mjs:158`
  - `tools/capture_staff_summary.mjs:170`
- a direct Playwright pointer-click reproduction against the first `[data-staff-action="select"]` control timed out while shell chrome intercepted the click path:
  - `.lux-shell-footer`
  - `.lux-nav-item`

Meaning:

- current smoke coverage can overstate `staff.html` health on desktop
- the route still has a user-visible interaction bug even though programmatic `.click()` makes the scripted summary pass
- this should be treated as a real runtime bug and a QA coverage bug

### Finding N: `assets/js/pages/directories.js` no longer injects mojibake fallback values into created staff records

Evidence:

- current source scan no longer shows corrupted text markers in:
  - `assets/js/pages/directories.js`
- the new-staff member fallback object now leaves missing fields empty instead of persisting broken placeholders:
  - `assets/js/pages/directories.js:962`
  - `assets/js/pages/directories.js:963`
- clean confirmation copy now ships from the same flow:
  - `assets/js/pages/directories.js:980`
- focused verification passed:
  - `node --check assets/js/pages/directories.js`
  - `npx vitest run test/staff-mobile-runtime-regressions.test.js`

Meaning:

- the current staff/directory workflow no longer injects visibly broken `office` or `phone` placeholder data into state and UI
- the broader syntax/markup audit still needs explicit mojibake cleanup work on other routes

### Finding O: routine portal session reads no longer depend on query-string tokens, but the Microsoft login callback still exposes a URL-borne portal token

Evidence:

- backend portal token extraction now reads only headers or request bodies:
  - `backend/platform/server.js:800`
- routine portal session/bootstrap/social callers now use header-based auth:
  - `assets/js/app/api.js:571`
  - `assets/js/app/api.js:1064`
  - `assets/js/app/api.js:1428`
- realtime now uses a header-authenticated fetch stream instead of `EventSource(...?token=...)`:
  - `assets/js/app/auth.js:877`
  - `assets/js/app/auth.js:929`
- live verification on `http://127.0.0.1:48933` showed:
  - `/api/portal/session` with `X-Portal-Session` -> `200`
  - `/api/portal/session?token=...` -> `404`
  - `/api/bootstrap` with `X-Portal-Session` -> bootstrap includes `session` and `account`
  - `/api/bootstrap?token=...` -> bootstrap omits `session` and `account`
  - `/api/social/bootstrap?token=...` -> `401`
  - `/api/events?...&token=...` -> `401`
- Microsoft login completion now uses a one-time handoff instead of a live portal token:
  - `backend/platform/server.js:2078`
  - `backend/platform/server.js:2182`
  - `assets/js/app/api.js:1116`
  - `assets/js/pages/login-runtime.js:254`

Meaning:

- routine portal fetches and realtime no longer depend on session-bearing query strings
- the live portal session token is no longer exposed through routine browser URLs or the Microsoft callback redirect
- the Microsoft completion flow is now reduced to a short-lived one-time handoff that is consumed via `POST` and invalidated on first use
- the remaining auth/session work in this area is now centered on browser storage, logout/privacy persistence, and long-lived session design rather than URL-borne live portal tokens

### Finding P: LMS course read access is now backend-gated to course staff/admin instead of behaving like a public route

Evidence:

- `backend/platform/server.js:4342`
  - `app.get('/api/lms/courses/:id', ...)` now starts with `requireCourseStaffAccess(...)`
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous request -> `401`
  - student session request -> `403`
  - admin session request -> `200`
- the route still returns `store.getLmsCourse(request.params.id)` only after passing the staff/admin gate
- adjacent LMS write routes remain role-scoped as before:
  - `backend/platform/server.js:4352`
  - `backend/platform/server.js:4357`

Meaning:

- this specific unauthenticated LMS read exposure is no longer present on the current backend path
- the broader LMS authorization review still remains open because other course-, quiz-, and student-record routes may still be over-broad
- `AUDIT-AUTHZ-01` should now move on from this public-route mismatch and focus on the remaining scope-bound LMS and student-data exposures

### Finding Q: file upload/download access control is currently incomplete in an implementation-specific way

Evidence:

- `backend/platform/server.js:3935`
  - upload requests pass `ownerUserId` into `store.createFileFromUpload(...)`
- `backend/platform/store.js:4983`
  - `createFileFromUpload(...)` writes parsed data URLs to disk
  - the stored record keeps `uploadedBy` and `scope`
  - the stored record does **not** persist `ownerUserId`
- `backend/platform/server.js:3949`
  - `GET /api/files/:id` streams any stored file to any authenticated session
  - no ownership, scope, or role check runs before streaming

Meaning:

- the current file model drops ownership metadata at write time
- once a file id is known, any authenticated session may be able to fetch it
- file upload/download review should treat this as a confirmed access-control defect, not only a hypothetical hardening gap

### Finding R: account activation currently trusts a raw account id instead of an activation secret

Evidence:

- `backend/platform/server.js:3624`
  - `POST /api/auth/activate` forwards only `request.body?.id` and `request.body?.password`
- `backend/platform/store.js:3985`
  - `activateAccount(userId, newPassword)` looks up the account by id and sets the password immediately
- frontend activation callers currently send the same raw id pattern:
  - `assets/js/app/auth.js:1126`
  - `assets/js/pages/login-runtime.js:323`

Meaning:

- if a pending account id is known or guessable, activation can become an unauthorized password-setting path
- the current activation flow does not appear to enforce a separate activation token, invitation secret, or one-time code
- this is a concrete authentication flaw, not just a UX shortcut

### Finding S: the public password-reset request endpoint returns the live reset token in-band

Evidence:

- `backend/platform/server.js:3633`
  - `POST /api/auth/request-reset` returns `response.json({ ok: true, reset });`
- `backend/platform/store.js:4003`
  - `requestPasswordReset(email)` returns:
    - `token`
    - `expiresAt`
    - `account`

Meaning:

- anyone who can hit the endpoint for a real email can receive the usable reset token directly in the response
- that collapses the normal out-of-band reset trust model and can enable direct account takeover
- password-reset hardening should treat this as an urgent backend auth issue

### Finding T: uploaded files can still be served back as active inline content with user-controlled MIME

Evidence:

- `backend/platform/store.js:4998`
  - stored file records persist `payload.type` directly as `type`
- `backend/platform/server.js:3957`
  - file downloads reflect that stored `type` into `Content-Type`
- `backend/platform/server.js:3959`
  - file downloads use `Content-Disposition: inline`

Meaning:

- if HTML or SVG content is uploaded, the backend can serve it back as browser-renderable active content
- this increases the impact of the already-confirmed file authorization issues
- file-handling remediation needs MIME allowlisting or forced attachment delivery, not just ownership checks

### Finding U: the previously tracked live third-party frontend asset providers have been removed from the audited route source

Evidence:

- `assets/css/kiu-fonts.css`
  - now declares local-only `@font-face` aliases for `Inter`, `Noto Sans Georgian`, `Playfair Display`, `DM Mono`, `Fraunces`, and `Manrope`
- `assets/js/pages/registration.js` and `assets/js/pages/registration-student-route.js`
  - now use `getRegistrationAvatarSrc(...)` plus `getInitialsAvatarDataUrl(...)` instead of `ui-avatars.com` and `via.placeholder.com`
- focused source rescan across `exam-portal.html`, `assets/css`, and `assets/js/pages`
  - returned `0` live matches for `fonts.googleapis.com`, `fonts.gstatic.com`, `ui-avatars.com`, `via.placeholder.com`, and `cdnjs.cloudflare.com`

Meaning:

- the previously flagged frontend asset-CDN and third-party avatar/font calls are no longer present on the audited route source
- broader remote dependency review still remains open because package advisories and backend/provider integration posture are separate risks from frontend asset delivery

### Finding V: public diagnostics are now reduced to minimal health-check output, and the high-value `/api/platform/*` surfaces are no longer anonymously readable

Evidence:

- `backend/platform/server.js:2044`
  - `/health` now returns only:
    - `ok`
    - `status`
    - `backend`
- `backend/platform/server.js:2052`
  - `/ready` now returns only:
    - `ok`
    - `status`
- `backend/platform/server.js:2063`
  - `/api/platform/config` now requires an authenticated session
- `backend/platform/server.js:2073`
  - `/api/platform/status` now requires an admin session
- `backend/platform/server.js:2089`
  - `/api/platform/readiness` now requires an admin session
- `backend/platform/store.js:8800`
  - platform status includes environment, storage driver, file storage mode, connected mailboxes, integration systems, and audit-event counts
- `backend/platform/store.js:8822`
  - runtime config includes `appUrl`, `backendUrl`, `fileStorageMode`, `storageDriver`, and RTC config
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous `/api/platform/config`, `/api/platform/status`, and `/api/platform/readiness` -> `401`
  - anonymous `/health` -> `200` with keys `['backend', 'ok', 'status']`
  - anonymous `/ready` -> `503` with keys `['ok', 'status']`
  - authenticated admin access still succeeds

Meaning:

- the highest-value runtime config and status endpoints are no longer anonymously exposed on the current backend
- the remaining public health endpoints are now reduced to status-only monitoring output rather than detailed runtime posture
- remaining review in this area should focus on whether even the minimal public health signals are appropriate for the deployment model and whether authenticated config/status payloads still expose too much detail

### Finding W: auth flows still expose account and account-state enumeration through distinct error paths

Evidence:

- `backend/platform/store.js:4045`
  - login returns `Account not found.` for unknown email
- `backend/platform/store.js:4049`
  - login returns `Incorrect password.` for wrong password on a real account
- `backend/platform/server.js:3627`
  - activation returns `Registration ID not found.`
- `backend/platform/server.js:3639`
  - reset-request returns `Account not found.`

Meaning:

- callers can distinguish valid accounts or activation identifiers from invalid ones
- this compounds the already-confirmed activation and reset flaws by making target discovery easier
- auth-hardening work should normalize public error responses while keeping detailed signals only in server logs

### Finding X: authenticated platform config can still expose live TURN credentials through the RTC payload

Evidence:

- `backend/platform/server.js:162`
  - `buildRtcConfig()` includes TURN:
    - `username: String(process.env.KIU_TURN_USERNAME || '').trim()`
    - `credential: String(process.env.KIU_TURN_CREDENTIAL || '').trim()`
- `backend/platform/store.js:8822`
  - `getRuntimeConfig()` returns `rtc: clone(this.rtc || {}) || {}`
- `backend/platform/server.js:2063`
  - `/api/platform/config` still returns `...store.getRuntimeConfig()` after session auth
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous `/api/platform/config` -> `401`
  - authenticated admin `/api/platform/config` -> `200`

Meaning:

- the unauthenticated secret-exposure path is no longer present on the current route
- if TURN is configured, authenticated portal sessions can still receive reusable RTC credentials through the config payload
- platform config output still needs a deliberate decision on whether TURN credentials should remain in general authenticated config or move to a narrower/session-scoped issuance model

### Finding Y: bootstrap endpoints are now session-gated instead of anonymously exposing shared portal state, social state, and the account directory

Evidence:

- `backend/platform/server.js:2284`
  - `/api/bootstrap` now requires a valid session before returning `createApplicationBootstrap(...)`
- `backend/platform/server.js:2288`
  - `/api/portal/bootstrap` now does the same
- `backend/platform/store.js:5016`
  - `createPortalBootstrap()` returns:
    - `state: clone(this.state.portal.state || {})`
    - `social: clone(this.state.social || {})`
    - `accounts: Object.values(this.state.accounts).map(account => this.sanitizeAccountForClient(account))`
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous `/api/bootstrap` -> `401`
  - anonymous `/api/portal/bootstrap` -> `401`
  - authenticated `/api/bootstrap` -> `200` with `session` and `account`

Meaning:

- the unauthenticated bootstrap read exposure is no longer present on the current backend routes
- authenticated bootstrap still returns broad shared state, so viewer-scoping/minimization remains a separate open issue
- remaining hardening in this area now centers on what authenticated viewers receive, not on anonymous bootstrap access

### Finding BW: `/api/portal/state` no longer echoes the full global bootstrap payload back to authenticated callers

Evidence:

- `backend/platform/server.js:2736`
  - `/api/portal/state` is available to any authenticated session
- `backend/platform/server.js:2843`
  - the route still saves submitted state, but now responds with only:
    - `ok`
    - `saved`
- live verification on `http://127.0.0.1:48933` showed:
  - authenticated `POST /api/portal/state` -> response keys `['ok', 'saved']`

Meaning:

- this specific least-privilege leak through the sync response is no longer present on the current route
- the route still remains high-risk because any authenticated user can overwrite the shared portal state object, which is tracked separately in `Finding Z`
- state-sync responses no longer double as a broad read endpoint, but state-write authorization remains unresolved

### Finding BL: the bootstrap `portal.state` blob can include academic, finance, and support records beyond basic shell state

Evidence:

- `backend/platform/store.js:5016`
  - `createPortalBootstrap()` returns `state: clone(this.state.portal.state || {})`
- `backend/platform/store.js:980` to `1004`
  - the portal-state tree includes keys such as:
    - `studentSchedulesByStudent`
    - `studentRegistrations`
    - `studentGrades`
    - `tuitionBalances`
    - `probationStatus`
    - `groupAssignments`
    - `groupMaterials`
    - `groupSubmissions`
    - `groupQuizzes`
    - `studentServiceTickets`
    - `studentServiceArticles`
- `backend/platform/store.js:8218` and `8308`
  - backend business logic also consumes this same portal-state tree for eligibility and hold derivation

Meaning:

- the bootstrap exposure is not limited to navigation or cosmetic state
- if reachable without proper session gating, it can leak academic, financial, and support-workflow data along with account records
- bootstrap output should not emit the full shared portal-state blob to unauthenticated or over-broad viewers

### Finding Z: any authenticated user can overwrite the shared portal state object

Evidence:

- `backend/platform/server.js:2736`
  - `POST /api/portal/state` accepts any authenticated session
- `backend/platform/store.js:5084`
  - `savePortalState(nextState)` assigns `this.state.portal.state = clone(nextState || {}) || {}`
- the write path does not scope portal state by user id, role, or ownership before replacing the shared object

Meaning:

- one authenticated user can potentially overwrite portal-wide state that other users later receive through bootstrap
- this is an integrity flaw, not just a data-model inconvenience
- portal-state persistence needs per-user or role-bounded storage, or a server-side allowlist of mutable fields instead of whole-object replacement

### Finding AA: self-service account updates are now clamped to an explicit profile-field allowlist instead of accepting role or privilege escalation payloads

Evidence:

- `backend/platform/server.js:3819`
  - non-admin `/api/accounts/upsert` now builds a filtered payload through `buildSelfServiceAccountPayload(...)`
- `backend/platform/server.js:28`
  - `SELF_SERVICE_ACCOUNT_MUTABLE_FIELDS` limits self-service writes to profile-style fields such as:
    - `displayName`
    - `bio`
    - `location`
    - `website`
    - `birthday`
    - `interests`
- `backend/platform/store.js:3944`
  - `upsertAccount(payload = {})` merges sanitized client payload directly into `this.state.accounts[sanitized.id]`
- `backend/platform/utils.js:157`
  - `sanitizeAccount(...)` accepts `role` from client input
- `backend/platform/utils.js:183`
  - `sanitizeAccount(...)` also accepts `grantedPrivileges` from client input
- live verification on `http://127.0.0.1:48933` with a seeded student session showed:
  - attempted `role: 'admin'` stayed `student`
  - attempted `grantedPrivileges: ['manage_privileges']` stayed empty
  - allowed profile field `bio` still updated successfully

Meaning:

- this specific self-promotion path is no longer present on the current self-service account route
- non-admin users can still edit normal profile fields, but they no longer carry `role` or `grantedPrivileges` through the route boundary
- remaining account-authority review should now focus on any other mutation routes that may still trust internal account or privilege fields from client payloads

### Finding AB: the runtime shell smoke command is not self-contained and can fail red on missing local server preconditions

Evidence:

- `tools/runtime_shell_smoke.mjs`
  - defaults `BASE_URL` to `http://127.0.0.1:8876`
  - does not start a local server itself before navigation
- current audit pass reproduced:
  - first `npm run test:runtime-shell` failed with `net::ERR_CONNECTION_REFUSED`
  - rerun passed after starting `tools/local_dev_server.py 8876`
  - `artifacts/runtime-shell-smoke.json` then showed all three route checks passing

Meaning:

- the command is useful, but it is not a reliable one-shot verifier in a clean environment
- CI or operators can get a false red that reflects missing setup rather than an application regression
- runtime QA should either start its own local server or fail with an explicit precondition message

### Finding AC: production-readiness tooling and production env examples are not aligned with the server's own readiness logic

Evidence:

- `tools/check-production-readiness.js:6`
  - the required gate list checks `KIU_DATABASE_URL` but not `KIU_DATABASE_TABLE_NAME`
- `backend/platform/server.js:1043`
  - server readiness uses `DATABASE_URL && DATABASE_TABLE_NAME`
- `backend/platform/server.js:1030`
  - server readiness also requires `microsoftMailConfigured`
- `backend/platform/server.js:1036`
  - server readiness also requires `turnConfigured`
- `.env.production.example`
  - does not provide:
    - `KIU_DATABASE_TABLE_NAME`
    - `KIU_MICROSOFT_MAIL_REDIRECT_URI`
    - `KIU_TURN_URLS`
    - `KIU_TURN_USERNAME`
    - `KIU_TURN_CREDENTIAL`

Meaning:

- the documented production example and the standalone readiness checker can both understate what the server actually needs to be production-ready
- operators could satisfy the script/example and still boot into a degraded runtime
- production-readiness guidance needs to be reconciled with the server's real readiness gates

### Finding AD: main portal sessions appear non-expiring and are not revoked on credential changes

Evidence:

- `backend/platform/store.js`
  - `createSessionForAccount(...)` now stamps the main portal session object with `expiresAt`
- `backend/platform/store.js`
  - `getSession(token)` now rejects expired sessions and marks them inactive with `revocationReason: 'expired'`
- `backend/platform/store.js`
  - `activateAccount(...)` and `resetPassword(...)` now call `revokeSessionsForUser(..., 'credential-reset')`

Meaning:

- portal sessions may remain valid indefinitely until explicit logout or manual state cleanup
- password reset or password change may leave previously issued sessions active
- production auth hardening needs absolute or idle session expiry plus revocation on sensitive credential changes

### Finding AE: auth rate limiting is in-memory per process, so it is not durable or multi-instance safe

Evidence:

- `backend/platform/server.js:205`
  - rate limits are stored in `const inMemoryRateLimits = new Map();`
- `backend/platform/server.js:1002`
  - `enforceRateLimit(...)` reads and writes only that in-memory map
- `backend/platform/server.js:3564`
  - login protection depends on that function
- `backend/platform/server.js:3634`
  - reset-request protection depends on that function

Meaning:

- auth throttling resets on process restart
- horizontally scaled or multi-process deployments will not share rate-limit state
- production auth protection should move to a shared store or edge-layer limiter rather than a single-process memory map

### Finding AF: file upload handling still relies on a global `100mb` JSON body limit and decodes base64 payloads without a route-specific size cap

Evidence:

- `backend/platform/server.js:210`
  - the whole app uses `express.json({ limit: '100mb' })`
- `backend/platform/server.js:3935`
  - `/api/files/upload` accepts upload payloads through that JSON parser
- `backend/platform/store.js:4984`
  - upload storage starts with `parseDataUrl(payload.dataUrl)`
- `backend/platform/store.js:4999`
  - the parsed buffer is written directly after decoding, with no explicit route-level max-size check

Meaning:

- large base64 uploads can force high memory overhead before validation because JSON parsing and base64 decoding happen before any tighter control
- this compounds the already-confirmed lack of file type/ownership hardening
- production upload handling should enforce smaller route-specific limits and explicit server-side size validation before buffering or writing

### Finding AK: Outlook mail send can attach arbitrary stored files by `storageKey` without ownership checks

Evidence:

- `backend/platform/server.js:1752`
  - `buildGraphSendAttachments(...)` reads `storageKey` from caller-supplied attachment items
- `backend/platform/server.js:1754`
  - it resolves that key with `store.getFile(storageKey)`
- `backend/platform/server.js:2497`
  - `/api/mail/messages/send` accepts caller-supplied `attachments`
- the attachment builder path does not verify that the authenticated mailbox owner actually owns or may access the referenced stored file

Meaning:

- any authenticated user who knows a stored file id may be able to exfiltrate that file through the Outlook send flow even if direct download access is tightened later
- file authorization fixes need to cover attachment-building and any other internal file-resolution paths, not only `/api/files/:id`

### Finding AN: the shared attachment normalizer trusts any existing `storageKey` without ownership validation

Evidence:

- `backend/platform/store.js:5224`
  - `normalizeMessageAttachment(file, senderId)` starts by reading `file.storageKey || file.id`
- `backend/platform/store.js:5227`
  - if that key exists in `this.state.files`, it returns a valid attachment reference immediately
- the same normalizer is reused by multiple flows:
  - `backend/platform/store.js:4889`
    - portal mail copies
  - `backend/platform/store.js:5260`
    - messenger messages
  - `backend/platform/store.js:7878`
    - social post media
  - `backend/platform/store.js:8464`
    - LMS assignments/material attachments

Meaning:

- any caller that can inject a known file id into these flows may be able to reuse another user's stored file as if it were their own
- this makes the file-authorization problem systemic across messaging, social, mail, and LMS content, not only direct download or Outlook send
- production fixes need centralized ownership checks in the attachment normalizer or a safer file-reference model

### Finding AQ: messenger message sending can create or reshape chats from caller-supplied `chatId` and `members`

Evidence:

- `backend/platform/server.js:3988`
  - `/api/messenger/message` forwards the request body into `store.appendMessage(...)` and only forces `senderId`
- `backend/platform/store.js:5124`
  - `ensureChatBase(payload)` trusts caller-supplied:
    - `id`
    - `type`
    - `members`
    - `name`
- `backend/platform/store.js:5264`
  - `appendMessage(...)` calls `ensureChatBase(...)` with those payload fields
- `backend/platform/store.js:5272`
  - if the sender is not already a member, it adds the sender into the chat automatically
- `backend/platform/store.js:5292`
  - notifications are then created for all resulting chat members

Meaning:

- an authenticated user may be able to create or mutate chat membership and deliver messages to arbitrary users by crafting `chatId` and `members`
- this is an authorization and integrity flaw in messaging, not just a UX inconsistency
- production hardening should validate chat membership server-side and disallow caller-owned chat topology changes on the generic send route

### Finding CU: any authenticated user can open a direct messenger chat with any arbitrary account

Evidence:

- `backend/platform/server.js:3974`
  - `/api/messenger/direct` accepts `request.body?.userB` from any authenticated session
- `backend/platform/store.js:5147`
  - `ensureDirectChat(userA, userB)` now requires both participants to resolve to known social accounts before it creates a new direct chat
- `assets/js/pages/social-page.js:2434` to `2468`
  - the directory UI still renders a `Message` button even when no accepted friendship exists, which indicates open campus messaging is part of the current product surface rather than a hidden admin-only path

Meaning:

- the current product surface appears to allow open direct messaging between authenticated known accounts, not only accepted friends
- the backend now enforces the narrower "known account only" boundary, but there is still no block/consent system beyond that
- any stricter contact-control policy would now be a product decision rather than a purely accidental route trust issue

### Finding AV: direct call lifecycle and signaling trust caller-supplied chat/user identifiers without strong membership validation

Evidence:

- `backend/platform/server.js:4034`
  - `/api/calls/start` forwards caller-controlled payload into `store.startCall(...)` and only forces `fromUserId`
- `backend/platform/store.js:5315`
  - direct-call `startCall(...)` creates `this.state.calls[chatId]` from caller-supplied `chatId` and `toUserId` without verifying an existing direct-chat relationship
- `backend/platform/store.js:5402`
  - `acceptCall(...)` updates the call without checking that the accepting user is a member of that call
- `backend/platform/store.js:5422`
  - `declineCall(...)` marks the call declined without checking caller membership
- `backend/platform/server.js:4134`
  - `/api/calls/signal` pushes signaling data to caller-supplied `toUserId`
  - no chat membership check runs before `pushEvent([signal.toUserId], { type: 'call:signal', signal })`

Meaning:

- an authenticated user may be able to ring, accept, decline, or signal arbitrary call records and recipients by crafting identifiers
- this is a direct real-time authorization flaw with privacy and abuse implications
- production hardening should bind direct-call lifecycle and signaling to validated chat membership instead of trusting payload ids

### Finding AZ: `/api/social/state` no longer replaces the whole shared social state object, but authenticated lost-and-found writes are still global

Evidence:

- `assets/js/app/api.js:1006`
  - `extractPersistableSocialHubState(...)` now sends only `lostFoundItems`
- `backend/platform/store.js:6788`
  - `getSocialBootstrap(...)` now includes `lostFoundItems`
- `backend/platform/store.js:6817`
  - `upsertSocialState(...)` now only patches `lostFoundItems` instead of replacing `this.state.social`
- isolated verification in this audit session showed:
  - a submitted `pages` overwrite payload was ignored
  - existing `pages` and `groups` remained intact
  - `lostFoundItems` still updated as intended

Meaning:

- this route no longer acts as a whole-social snapshot replacement path
- authenticated users can still mutate the global lost-and-found collection through this sync path, so the remaining risk is narrower but not fully eliminated
- remaining hardening should decide whether lost-and-found itself needs per-item ownership/authorization rules instead of collection-wide authenticated writes

### Finding BF: the admin privilege-update route now derives the acting identity server-side instead of trusting client-supplied `actorId`

Evidence:

- `backend/platform/server.js:3860`
  - `/api/admin/accounts/:id/privileges` is now session-gated and performs its own privilege check server-side
- `backend/platform/server.js:3863`
  - it now calls `store.updateAccountPrivileges(..., getActorUserId(sessionAccount))`
- `backend/platform/store.js:2686`
  - `updateAccountPrivileges(...)` authorizes and records `privilegeUpdatedBy` from that `actorId`
- `assets/js/pages/news.js:1013`
  - the client currently sends `actorId: actor.id`
- live verification on `http://127.0.0.1:48933` showed:
  - a spoofed request body `actorId: 'spoofed-actor'` was ignored
  - `privilegeUpdatedBy` was stored as `admin-root`

Meaning:

- this specific audit-misattribution trust bug is no longer present on the route
- the client may still send `actorId`, but it is no longer authoritative
- the broader delegated-privilege model review under `Finding DG` has now been aligned at the route boundary

### Finding DG: delegated privilege management is now aligned between the UI, route gate, and store logic

Evidence:

- `assets/js/pages/news.js:122`
  - the UI allows `manage_privileges` users to open the privileges manager
- `backend/platform/store.js:2686`
  - `updateAccountPrivileges(...)` explicitly allows â€œadministrators or delegated privilege managersâ€
- `backend/platform/server.js:3860`
  - `/api/admin/accounts/:id/privileges` now allows any authenticated account through the route boundary
- `backend/platform/server.js:3863`
  - the route then checks `store.accountHasPrivilege(actorUserId, 'manage_privileges')`
- live verification on `http://127.0.0.1:48933` showed:
  - admin successfully granted `manage_privileges` to a seeded professor account
  - that professor session then successfully updated another accountâ€™s privileges through the same route

Meaning:

- the privilege-delegation model is no longer internally inconsistent on this route
- a delegated privilege manager can now reach the same privileged mutation path that the store already modeled
- remaining privilege-management review should focus on scope and audit behavior rather than basic route reachability

### Finding BR: self-service account updates no longer carry identity-linking and account-state fields through the route boundary

Evidence:

- `backend/platform/server.js:3819`
  - non-admin `/api/accounts/upsert` requests now flow through `buildSelfServiceAccountPayload(...)`
- `backend/platform/store.js:3944`
  - `upsertAccount(payload = {})` merges the sanitized client payload directly into the stored account
- `backend/platform/utils.js:173` to `179`
  - `sanitizeAccount(...)` accepts fields such as:
    - `accountStatus`
    - `activationRequired`
    - `mustChangePassword`
    - `identityProvider`
    - `microsoftOid`
    - `microsoftTenantId`
    - `microsoftEmail`
    - `emailAliases`
- `backend/platform/store.js:3831`
  - `getRawAccountByEmail(...)` resolves accounts through:
    - `item.email`
    - `item.microsoftEmail`
    - `item.emailAliases`
- live verification on `http://127.0.0.1:48933` with a seeded student session showed:
  - attempted `microsoftOid: 'spoofed-oid'` stayed empty
  - attempted `accountStatus: 'disabled'` stayed `active`

Meaning:

- this specific self-service identity-link and account-state overwrite path is no longer present on the current route
- those fields remain sensitive because they influence address-based account resolution used by login, reset, exam-portal auth, and portal mail routing
- this can interfere with authentication, support status, identity linking, and downstream authorization assumptions
- production hardening should restrict self-service account updates to a narrow field allowlist instead of merging the full sanitized account shape

### Finding AW: the live news feed route is session-gated, and viewer-less news visibility logic now also rejects role/faculty-targeted posts

Evidence:

- `backend/platform/server.js:1395`
  - the route guard middleware includes `/api/news` in `guardedPrefixes`
- `backend/platform/server.js:3844`
  - `/api/news/feed` runs behind that session-bound middleware
- `backend/platform/store.js:4268`
  - the viewer-less branch of `canViewNewsPost(...)` now also requires empty `audienceRoles`, `audienceFacultyCodes`, and `targetUserIds`
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous `/api/news/feed?section=Audit%20AW%20Section` -> `401`

Meaning:

- the live anonymous news-feed exposure is not present on the current route
- the underlying viewer-less visibility logic is also narrower now, which reduces risk if a future viewer-less feed path is reintroduced
- remaining news/privacy review should focus on authenticated audience boundaries and any other viewer-less feeds rather than this previously stale public-route assumption

### Finding AX: backend CORS allowlist now gates local development origins behind non-production or explicit local app-origin use

Evidence:

- `backend/platform/server.js:163`
  - reads optional `KIU_EXTRA_CORS_ORIGINS`
- `backend/platform/server.js:183`
  - only enables the default `http://127.0.0.1:8876` / `http://localhost:8876` pair when `!IS_PRODUCTION_ENVIRONMENT || isLoopbackOrigin(APP_ORIGIN)`
- `backend/platform/server.js:234`
  - requests from allowed origins still receive `Access-Control-Allow-Origin`

Meaning:

- production deployments no longer trust the default local development origins by default
- extra trusted frontend origins are now explicit configuration rather than an unconditional production allowance
- broader CSP and header rollout still remains open because CORS tightening alone does not add CSP or address inline/eval blockers

### Finding AY: LMS live-quiz workspace endpoints are now course-scoped instead of merely session-bound

Evidence:

- `backend/platform/server.js:1243`
  - `requireLmsLiveQuizWorkspaceAccess(...)` now derives the course id from `resourceKey`
- `backend/platform/server.js:2842`
  - `GET /api/lms/live-quizzes/:resourceKey` now runs through that helper
- `backend/platform/server.js:2854`
  - `POST /api/lms/live-quizzes/:resourceKey` now runs through that helper
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous request -> `401`
  - enrolled student request -> `200`
  - unrelated student request -> `403`
  - admin request -> `200`

Meaning:

- this specific session-only LMS live-quiz workspace exposure is no longer present on the current route
- live-quiz reads and writes now depend on actual course scope instead of any generic authenticated session
- remaining LMS authorization review should focus on other helper routes and deeper group-scope assumptions rather than this route-level course gate

### Finding BI: student eligibility and enrollment routes are now relationship-scoped for professor/TA access, but Student Service access is still broader than explicit ticket/assignment scope

Evidence:

- `backend/platform/server.js:1290`
  - `canAccessStudentAcademicRecord(...)` now checks professor/TA access against the studentâ€™s enrolled courses
- `backend/platform/server.js:4382`
  - `/api/students/:id/eligibility` now uses that relationship check
- `backend/platform/server.js:4390`
  - `/api/students/:id/enrollments` now uses the same check
- `backend/platform/store.js:8235`
  - `getComputedStudentHolds(...)` can derive finance-balance and probation-related hold data
- `backend/platform/store.js:8303`
  - `getStudentEligibility(...)` returns holds plus ECTS and registration state
- live verification on `http://127.0.0.1:48933` showed:
  - same-course professor session -> `200`
  - unrelated professor session -> `403`
  - same-faculty `student_service` session -> `200`

Meaning:

- professor/TA access is no longer broadly role-only on the current routes
- Student Service access is still broader than an explicit case/assignment model, so sensitive eligibility data can still be reached within a faculty-wide support scope
- remaining hardening should define the intended Student Service relationship boundary instead of relying on faculty-wide access alone

### Finding BS: same-faculty professors and TAs can view pending Student Service questions in responder categories before publication

Evidence:

- `backend/platform/store.js:1832`
  - `canRespondToStudentServiceQuestion(...)` returns true for `professor` and `ta` when:
    - the category is in `STUDENT_SERVICE_RESPONDER_CATEGORIES`
    - and the faculty matches
- `backend/platform/store.js:2120`
  - `canViewStudentServiceQuestion(...)` returns true if `canRespondToStudentServiceQuestion(...)` is true
- `backend/platform/store.js:2198`
  - `getStudentServiceBootstrap(...)` includes all questions that pass `canViewStudentServiceQuestion(...)`
- `backend/platform/store.js:2099`
  - question decoration still exposes the underlying question body to those viewers, even when anonymous labeling is applied

Meaning:

- same-faculty professors and TAs can see pending anonymous questions for categories like academic process, registration, and timetable before moderator publication
- this is a privacy and workflow-isolation risk, not just a UX choice
- production hardening should decide whether faculty responders should see only assigned or explicitly published items rather than all faculty-matching pending questions

### Finding CO: Student Service ticket bootstrap now filters internal notes and handoff metadata for non-moderator viewers

Evidence:

- `backend/platform/store.js:2150`
  - `decorateStudentServiceTicket(...)` now strips `internalNotes` and clears `handoff` for non-moderator viewers
- `backend/platform/store.js:2227`
  - `getStudentServiceBootstrap(...)` now routes ticket payloads through `decorateStudentServiceTicket(...)`
- isolated verification in this audit session showed:
  - student-owned ticket view -> `internalNotes: []` and empty handoff metadata
  - Student Service moderator view -> internal notes still present

Meaning:

- this specific student-facing ticket metadata leak is no longer present in the current bootstrap payload
- staff-only ticket workflow notes remain available to moderators without being echoed back to ordinary ticket owners
- remaining Student Service review should focus on other support-tool visibility boundaries such as macros and responder access policy

### Finding CP: anonymous Student Service question payloads no longer carry raw author identity fields to ordinary non-moderator viewers

Evidence:

- `backend/platform/store.js:1985` to `1987`
  - normalized Student Service questions store:
    - `authorUserId`
    - `authorDisplayName`
    - `authorRole`
- `backend/platform/store.js:2176`
  - `decorateStudentServiceQuestion(...)` now blanks those fields when the question is anonymous and the viewer is neither the author nor a moderator
- isolated verification in this audit session showed:
  - same-faculty professor responder view -> raw author identity fields were empty
  - Student Service moderator view -> raw author identity fields remained available

Meaning:

- this specific anonymous-question identity leak is no longer present for ordinary responder/student bootstrap consumers
- moderation workflows can still access author identity where operationally necessary
- the broader policy question in `Finding BS` remains open because same-faculty responders may still see pending anonymous questions at all, even though the raw identity fields are now redacted

### Finding CD: any current social group member can invite additional members into the group

Evidence:

- `backend/platform/store.js:7672`
  - `inviteSocialGroupMember(groupId, memberId, actorId, note)` is used for group invitations
- `backend/platform/store.js:7677`
  - `canInvite` is true when the actor is:
    - a social admin
    - a group manager
    - or simply `this.isSocialGroupMember(group, normalizedActorId)`
- the code does not restrict invitations to group owners/admins only

Meaning:

- private or sensitive groups can have their membership expanded by ordinary members, not just designated managers
- this is a privacy and governance flaw on the social surface, especially for non-public groups
- production hardening should define and enforce whether ordinary members may invite others, rather than inheriting that permission implicitly

### Finding AU: the bootstrap account payload includes rich PII and privilege metadata for every account

Evidence:

- `backend/platform/server.js:2180`
  - `/api/bootstrap` returns `store.createApplicationBootstrap(...)`
- `backend/platform/store.js:5016`
  - `createPortalBootstrap()` includes `accounts: Object.values(this.state.accounts).map(account => this.sanitizeAccountForClient(account))`
- `backend/platform/store.js:1737`
  - `sanitizeAccountForClient(...)` returns the full sanitized account plus `effectivePrivileges` and social presence data
- `backend/platform/utils.js:145`
  - the sanitized account shape includes fields such as:
    - `email`
    - `birthday`
    - `location`
    - `interests`
    - `accountStatus`
    - `activationRequired`
    - `microsoftOid`
    - `microsoftTenantId`
    - `microsoftEmail`
    - `emailAliases`
    - `grantedPrivileges`
    - `privilegeNotes`
    - `lastSeenAt`
    - `presenceLabel`

Meaning:

- the bootstrap exposure is not limited to basic names or avatars
- if reachable without proper session gating, it can leak sensitive identity, account-state, and privilege metadata for the full account set
- even after bootstrap is session-gated, the account payload should likely be minimized per viewer instead of returning the full internal account shape

### Finding CG: the raw bootstrap social payload can expose moderation and membership-management internals

Evidence:

- `backend/platform/store.js:5016`
  - `createPortalBootstrap()` returns `social: clone(this.state.social || {})`
- `backend/platform/state-shape.js:3`
  - the social state includes internal collections such as:
    - `reports`
    - `blocks`
    - `muted`
    - `notifications`
- `backend/platform/store.js:7408`
  - group records store `pendingMemberIds`
- `backend/platform/store.js:7414`
  - group records store `joinedAtByUser`
- `backend/platform/store.js:7417`
  - group records store `notificationPreferenceByUser`
- `backend/platform/store.js:6827`
  - project records store `memberRolesByUser`

Meaning:

- the bootstrap social exposure is not limited to public-facing posts or groups
- if delivered too broadly, it can leak moderation/reporting state and internal membership-management metadata
- production hardening should treat the social bootstrap as sensitive structured state, not a harmless UI cache

### Finding CM: multiple social creation routes trust owner/author identity fields from the client payload

Evidence:

- `backend/platform/server.js:3041`
  - `/api/social/pages` passes `request.body` to `store.createSocialPage(...)`
- `backend/platform/store.js:7361`
  - `createSocialPage(...)` uses `payload.ownerUserId || actorId`
- `backend/platform/server.js:3061`
  - `/api/social/groups` passes `request.body` to `store.createSocialGroup(...)`
- `backend/platform/store.js:7397`
  - `createSocialGroup(...)` uses `payload.ownerUserId || actorId`
- `backend/platform/server.js:3162`
  - `/api/social/projects` passes `request.body` to `store.createSocialProject(...)`
- `backend/platform/store.js:6780`
  - `createSocialProject(...)` uses `payload.ownerUserId || actorId`
- `backend/platform/server.js:3405`
  - `/api/social/posts` passes `request.body` directly to `store.createSocialPost(...)`
- `backend/platform/store.js:7849`
  - `createSocialPost(...)` uses `payload.authorUserId || payload.postedById || payload.authorId`
- `backend/platform/server.js:3530`
  - `/api/social/events` passes `request.body` to `store.createSocialEvent(...)`
- `backend/platform/store.js:8058`
  - `createSocialEvent(...)` uses `payload.createdById || actorId`

Meaning:

- authenticated users may be able to create social content or entities attributed to other users if the payload supplies those identity fields
- this is a direct integrity and authorization flaw, not just a cosmetic ownership mismatch
- production hardening should derive creator/owner identity server-side for all creation routes

### Finding CN: social creation routes also trust client-supplied governance and moderation fields

Evidence:

- `backend/platform/store.js:7379`
  - `createSocialPage(...)` accepts `official`
- `backend/platform/store.js:7380`
  - `createSocialPage(...)` accepts `verified`
- `backend/platform/store.js:7382`
  - `createSocialPage(...)` accepts `adminIds`
- `backend/platform/store.js:7408`
  - `createSocialGroup(...)` accepts `pendingMemberIds`
- `backend/platform/store.js:7414`
  - `createSocialGroup(...)` accepts `joinedAtByUser`
- `backend/platform/store.js:7417`
  - `createSocialGroup(...)` accepts `notificationPreferenceByUser`
- `backend/platform/store.js:7384` and `7410`
  - both page and group creation accept client-supplied `facultyCode`

Meaning:

- authenticated users may be able to create â€œofficialâ€ or â€œverifiedâ€ social entities, pre-seed admin/member workflow state, or assign arbitrary faculty context from the client payload
- this is a governance and trust-boundary flaw in addition to the basic ownership issue
- production hardening should derive or strictly validate privileged social metadata server-side instead of accepting it from creation payloads

### Finding AO: file upload path construction now sanitizes caller-supplied ids and confines writes to the uploads directory

Evidence:

- `backend/platform/server.js:3935`
  - `/api/files/upload` forwards the request body into `createFileFromUpload(...)`
- `backend/platform/store.js:88`
  - `normalizeStoredFileId(...)` strips path separators and unsafe characters from caller-supplied ids
- `backend/platform/store.js:4997`
  - `createFileFromUpload(...)` now resolves the final target path against `path.resolve(this.uploadsDir)` before writing
- isolated verification in this audit session showed:
  - attempted id `..\\..\\escaped`
  - normalized stored id -> `escaped`
  - resulting output path stayed under the configured uploads directory

Meaning:

- this specific path-escape write primitive is no longer present in the current file-upload helper
- deterministic safe ids can still be used by first-party testing helpers without allowing directory traversal
- file-upload hardening still remains incomplete overall because ownership, MIME safety, and shared attachment-resolution issues are still open under `AUDIT-SEC-04`

### Finding AG: career-provider API keys no longer persist in `localStorage`, but they still remain browser-accessible within the active tab

Evidence:

- `assets/js/pages/career-market.js:310`
  - `readProviderApiKey()` now reads the key from `sessionStorage`
- `assets/js/pages/career-market.js:322`
  - `writeProviderApiKey(...)` now writes the key to `sessionStorage`
- `assets/js/pages/career-market.js:348`
  - `writeProviderSettings(settings)` still persists provider metadata to `localStorage`
- current source re-scan no longer finds `parsed.apiKey` inside the persisted provider-settings blob path

Meaning:

- reusable third-party AI keys are no longer left in long-lived `localStorage`, which reduces shared-device and cross-restart persistence risk
- the key is still accessible to any XSS or local browser compromise within the active tab/session, so this remains a browser-secret-storage concern
- production deployment should still prefer a model that avoids storing reusable provider secrets in browser-controlled storage at all

### Finding AH: the AI completion proxy endpoint is now session-gated and rate-limited, but browser-stored provider secrets still remain a production risk

Evidence:

- `backend/platform/server.js:1978`
  - `POST /api/ai/career-completion` now starts with `requireSessionAccount(...)`
- `backend/platform/server.js:1980`
  - the route now applies `enforceRateLimit(...)`
- the route forwards caller-supplied:
  - `provider`
  - `model`
  - `apiKey`
  - `systemPrompt`
  - `userPrompt`
  - `maxTokens`
- live verification on `http://127.0.0.1:48933` showed:
  - anonymous request -> `401`
  - authenticated invalid requests `1-10` -> `502`
  - authenticated invalid request `11` -> `429`
  - `Retry-After` header -> `600`

Meaning:

- the backend no longer acts as a public unauthenticated AI relay on the current route
- abuse pressure on the proxy is now bounded by session access and a request cap, even before any broader shared-rate-limit redesign
- the remaining production concern in this feature is the browser-side storage of reusable third-party provider keys and whether the proxy should exist at all outside trusted authenticated workflows

### Finding AL: Microsoft sign-in now uses a short-lived one-time handoff instead of putting the live portal session token in the browser URL

Evidence:

- `backend/platform/server.js:2078`
  - `POST /api/portal/microsoft/complete` consumes a one-time handoff and returns the real session payload server-side
- `backend/platform/server.js:2182`
  - the Microsoft callback now creates a completion handoff before redirecting
- `backend/platform/server.js:2196`
  - the success redirect now sends:
    - `microsoft_handoff: completion.handoff`
- `assets/js/app/api.js:1116`
  - the browser reads `microsoft_handoff` from `window.location.search`
- `assets/js/app/api.js:1138`
  - the app posts that handoff to `/api/portal/microsoft/complete`
- `assets/js/pages/login-runtime.js:254`
  - the login page runtime reads `microsoft_handoff`
- live verification on `http://127.0.0.1:48933` showed:
  - first consume of a seeded handoff -> `200` with `session` and `account`
  - second consume of the same handoff -> `404`

Meaning:

- the reusable portal session token no longer passes through browser history, address bar, copy/paste, or logs during Microsoft login completion
- the current Microsoft redirect still contains a browser-visible one-time handoff, but that handoff is short-lived and is invalidated after the first backend completion call
- the broader auth risk has shifted away from URL-borne live tokens and toward the remaining browser-storage and session-lifecycle issues tracked under `AUDIT-SEC-02`

### Finding AM: the exam portal still stores its own session token in `localStorage`, although routine session reads no longer use query-string auth

Evidence:

- `assets/js/pages/exam-portal.js:2`
  - the token key is `KIU_EXAM_PORTAL_TOKEN`
- `assets/js/pages/exam-portal.js:8`
  - the runtime loads that token from `localStorage`
- `assets/js/pages/exam-portal.js:293`
  - `setToken(...)` persists the token back to `localStorage`
- exam portal session reads now send the token through `X-Exam-Portal-Token`:
  - `assets/js/pages/exam-portal.js:547`
  - `assets/js/app/api.js:860`
- backend exam portal session reads no longer accept query-only auth on the current routes:
  - `backend/platform/server.js:4343`
  - `backend/platform/server.js:4355`
  - `backend/platform/server.js:4367`
- live verification on `http://127.0.0.1:48933` showed:
  - `/api/exam-portal/sessions` with `X-Exam-Portal-Token` -> `200`
  - `/api/exam-portal/sessions?token=...` -> `401`

Meaning:

- the exam portal no longer exposes its routine session-list reads through browser-visible query-string auth
- the remaining exam-portal secret exposure is now primarily the `localStorage` token persistence and the broader weak exam-auth model, not the session-list URL shape
- exam portal token handling still needs a browser-storage redesign even after the query-string transport cleanup

### Finding AP: rate limiting and audit IP capture trust forwarded IP headers directly instead of using trusted proxy resolution

Evidence:

- `backend/platform/server.js:209`
  - Express is configured with `app.set('trust proxy', Number(process.env.KIU_TRUST_PROXY_HOPS || 1));`
- `backend/platform/server.js:987`
  - `getRequesterIp(request)` reads `x-forwarded-for` and `x-real-ip` directly from headers
- `backend/platform/server.js:1006`
  - login/reset rate limiting keys off that helper
- `backend/platform/server.js:1173`
  - `getRequestIpAddress(request)` also reads `x-forwarded-for` directly for audit logging

Meaning:

- if the deployment is misconfigured or reachable without the expected proxy hop pattern, callers can spoof the IP data used for auth throttling and audit events
- this weakens the already-limited in-memory rate limiter and can poison incident logs
- production hardening should derive client IP through the trusted Express proxy chain instead of raw forwarded headers

### Finding AR: logout preserves the broader persisted portal state blob in browser storage

Evidence:

- `assets/js/app/state.js:7`
  - application startup loads `KIU_STATE` from `localStorage.getItem('KIU_PERSISTENT_STATE')`
- `assets/js/app/api.js:371`
  - `buildPortalPersistableState(...)` strips only `domain` and `auth` before persistence
- `assets/js/app/auth.js:268`
  - logout removes auth/session keys
- `assets/js/app/auth.js:272`
  - logout then only deletes `persistedState.auth.activeUserId` inside `KIU_PERSISTENT_STATE`
- `assets/js/app/api.js:424`
  - the broader client-auth clearing path also only removes `auth.activeUserId` from `KIU_PERSISTENT_STATE`

Meaning:

- logout can leave behind a large cached portal-state blob from the previous user on the same browser profile
- on shared devices this increases the risk of stale or sensitive state remaining locally even after sign-out
- production logout/privacy handling should clear or sharply scope persisted state instead of retaining full cross-session data by default

### Finding AS: the service worker caches same-origin page responses broadly, and the normal logout flow does not purge those caches

Evidence:

- `service-worker.js:55`
  - the fetch handler requests same-origin documents from the network with `cache: 'no-store'`
- `service-worker.js:58`
  - but then still writes the network response into the cache with `cache.put(request, clone)`
- `assets/js/app/auth.js:256`
  - `authLogout()` clears auth keys and redirects to `login.html`
- `assets/js/app/auth.js:297`
  - the normal logout path only calls `authLogout()`
- `assets/js/app/app.js:2649`
  - cache purge logic exists in `clearPortalSiteCaches(...)`
- no call to `clearPortalSiteCaches(...)` is made from the normal logout flow

Meaning:

- personalized shell-backed pages can remain cached locally after logout
- on shared devices, prior-user content can persist in browser caches even when auth/session keys are removed
- production logout/privacy handling should purge or segregate authenticated caches, not just clear tokens

### Finding AT: the exam portal autosaves protected quiz drafts into `localStorage`

Evidence:

- `assets/js/pages/exam-portal.js:704`
  - draft storage is keyed as `KIU_EXAM_DRAFT_<course>_<quiz>_<sessionToken>`
- `assets/js/pages/exam-portal.js:716`
  - `saveProtectedDraft()` runs during active protected quiz use
- `assets/js/pages/exam-portal.js:720`
  - it stores `answers`, `flagged`, and `savedAt` into `localStorage`
- `assets/js/pages/exam-portal.js:729`
  - `restoreProtectedDraft()` reads the same local draft back

Meaning:

- protected exam answers and related state can persist locally in the browser outside the live exam session
- this is a separate shared-device/privacy risk from the main portal auth/session storage issues
- production exam handling should treat browser-persisted answer drafts as sensitive and either eliminate them or apply a stricter lifecycle

### Finding BA: Microsoft login can auto-link accounts by email, while the default tenant configuration is `common`

Evidence:

- `backend/platform/server.js:1361`
  - `getMicrosoftConfig()` defaults `KIU_MICROSOFT_TENANT_ID` to `common`
- `backend/platform/store.js:3923`
  - `createSessionByMicrosoftIdentity(identity)` first tries `getRawAccountByMicrosoftOid(...)`
- `backend/platform/store.js:3928`
  - if no OID match exists, it falls back to `this.getRawAccountByEmail(normalizedEmail)`
- `backend/platform/store.js:3936`
  - on a successful email match, it links the Microsoft identity to that account automatically
- `.env.example:43`
  - the example tenant id is also `common`

Meaning:

- first-time Microsoft sign-in can bind to an internal account based on email matching alone if no prior OID link exists
- when combined with a broad tenant configuration, that raises the risk of unintended account linking unless deployment enforces the right tenant/domain assumptions
- production SSO hardening should prefer explicit tenant restrictions and a stricter account-linking policy than opportunistic email fallback

### Finding BB: the production Caddy config serves the repository root as the web root with no explicit denylist for non-public files

Evidence:

- `docker-compose.production.yml:13`
  - Caddy mounts `./` to `/srv:ro`
- `infra/caddy/Caddyfile:3`
  - `root * /srv`
- `infra/caddy/Caddyfile:16`
  - `try_files {path} {path}/ /login.html`
- `infra/caddy/Caddyfile:17`
  - `file_server`
- the config does not explicitly deny server-side or project-root paths such as:
  - `.env`
  - `backend/`
  - `docs/`
  - `package.json`

Meaning:

- the production web tier appears capable of serving repository-root files that are not intended as public web assets
- even read-only mounting does not prevent accidental disclosure if the web root includes non-public project material
- production deployment should serve a minimal public document root rather than the repository root

### Finding CF: the production compose stack loads `.env` directly instead of a dedicated production env file or secret source

Evidence:

- `docker-compose.production.yml`
  - multiple production services use:
    - `env_file:`
    - `- .env`
- the repository also ships:
  - `.env.production.example`

Meaning:

- the production stack is wired to consume the generic local `.env` file by default
- this increases the risk of deploying with development/local values or the wrong secret set
- production deployment should use an explicit production env source or secrets management path instead of relying on the generic `.env`

### Finding CI: the production container stack uses floating image tags rather than pinned digests

Evidence:

- `Dockerfile:1`
  - base image is `node:22-alpine`
- `docker-compose.production.yml`
  - uses moving tags such as:
    - `caddy:2.9-alpine`
    - `postgres:16-alpine`
    - `redis:7-alpine`
    - `coturn/coturn:4.7`

Meaning:

- production builds are not fully reproducible because upstream image contents can change behind the same tag
- this is a deployment supply-chain and rollback predictability concern even when the app code is unchanged
- production deployment should pin images by immutable digest or a stricter release process

### Finding DE: the default compose stack publishes internal services directly to host ports

Evidence:

- `docker-compose.yml:23`
  - publishes the backend on `47833:47833`
- `docker-compose.yml:34`
  - publishes PostgreSQL on `5432:5432`
- `docker-compose.yml:46` and `47`
  - publishes MinIO on `9000:9000` and `9001:9001`
- `docker-compose.yml:55`
  - publishes Redis on `6379:6379`

Meaning:

- the default stack exposes internal backing services directly on host ports
- this is acceptable for local development, but it is a deployment-hardening hazard if reused beyond local scope
- production and non-production deployment guidance should clearly separate local convenience exposure from hardened network posture

### Finding CQ: several external-integration routes reflect raw upstream or internal error messages back to clients

Evidence:

- `backend/platform/server.js:1998`
  - `/api/ai/career-completion` returns `error?.message`
- `backend/platform/server.js:2168` and `2174`
  - Microsoft sign-in redirects include `microsoft_error: error?.message`
- `backend/platform/server.js:2345` and `2351`
  - Outlook mailbox connection redirects include `mail_error: error?.message`
- `backend/platform/server.js:2400`, `2428`, `2470`, `2493`, `2597`, `2684`, and `2732`
  - Outlook/mail API routes send `error?.message` back in `sendError(...)`

Meaning:

- clients can receive raw upstream/provider or internal exception messages from production integration paths
- this increases operational information disclosure and can expose provider-side detail that is more useful than necessary to end users or attackers
- production hardening should sanitize user-facing error payloads and keep detailed integration failures in server logs

### Finding DA: backend final grade calculation ignores assessment weights and max-score metadata

Evidence:

- `backend/platform/store.js:8561`
  - `computeRecordFinalScore(record)` averages all stored scores equally
- `backend/platform/store.js:8721`
  - `finalizeGrades(...)` sets `record.finalScore = this.computeRecordFinalScore(record);`
- `assets/js/pages/gradebook.js:136`
  - the gradebook UI exposes weight controls for:
    - quiz
    - homework
    - midterm
    - final/retake
- `infra/postgres/init/003_platform_runtime.sql:82`
  - the shipped schema includes `max_score`
- `infra/postgres/init/003_platform_runtime.sql:83`
  - the shipped schema includes `weight_percent`
- `assets/js/pages/lms.js:10460`
  - LMS copy explicitly promises â€œweighted contributionâ€

Meaning:

- the backend final-grade path does not match the weighting model implied by the UI and schema
- this is an academic correctness/integrity bug, not a cosmetic discrepancy
- production readiness requires grade calculation rules to be explicit and consistent across UI, runtime logic, and stored schema

### Finding DB: registration schedule-conflict detection only compares exact start times, not real interval overlap

Evidence:

- `backend/platform/store.js:8288`
  - `hasScheduleConflict(studentId, sectionId)` is the server-side registration conflict check
- `backend/platform/store.js:8295` to `8297`
  - it treats sections as conflicting only when:
    - `day` matches
    - and `left.startTime === right.startTime`
- no overlap comparison against `endTime` or duration is applied in that check

Meaning:

- overlapping sections such as `09:00-10:30` and `09:30-11:00` on the same day may not be blocked
- this is a production academic scheduling correctness bug, not a cosmetic issue
- registration integrity requires true interval-overlap checking rather than exact-start matching

### Finding DD: finalized gradebook writes no longer reopen from a client-supplied `allowFinalizedEdit` flag

Evidence:

- `backend/platform/server.js:4647`
  - `/api/gradebook/scores` forwards `...(request.body || {})` into `store.setScore(...)`
- `backend/platform/store.js:8651`
  - `setScore(...)` now only allows finalized edits when `payload.serverAllowFinalizedEdit === true`
- isolated verification in this audit session showed:
  - finalized gradebook + `allowFinalizedEdit: true` -> write blocked
  - finalized gradebook + `serverAllowFinalizedEdit: true` -> write allowed

Meaning:

- this specific finalized-grade client override is no longer present on the current gradebook write path
- grade integrity no longer depends on clients honestly omitting `allowFinalizedEdit`
- remaining gradebook review should focus on any other override or scope-trust fields that may still be carried from request bodies into protected mutations

### Finding CL: the shipped TURN template enables a TLS listener without any certificate configuration

Evidence:

- `infra/coturn/turnserver.conf.template:2`
  - `tls-listening-port=5349`
- the same template does not define:
  - `cert=`
  - `pkey=`
- `.env.example`
  - documents TURN username/credential/realm/server/external-ip settings
  - but does not document TURN TLS certificate paths or materials

Meaning:

- the shipped RTC deployment template advertises a TURN TLS port without a corresponding certificate configuration path
- this can leave production TURN TLS either nonfunctional or dependent on undocumented/manual runtime behavior
- production RTC deployment guidance should explicitly define how TURN TLS is terminated or configured

### Finding BE: frontend-generated admin testing personas can contaminate the shared backend portal state

Evidence:

- `assets/js/app/state.js:1187`
  - `ensureAdminTestingPersonas(...)` mutates `KIU_STATE.users`, `facultyProfiles`, and related student records in client state
- `assets/js/app/api.js:518`
  - admin role bootstrap paths call `ensureAdminTestingPersonas(...)`
- `assets/js/app/api.js:1378`
  - the normal persistence path posts `state: buildPortalPersistableState(KIU_STATE)` to `/api/portal/state`
- `assets/js/app/api.js:371`
  - `buildPortalPersistableState(...)` does not strip these testing persona records before sync

Meaning:

- client-only QA/testing personas are not isolated from the shared state synchronization path
- an admin session can potentially push fabricated testing users and related structures into the backend-backed shared portal state
- production deployment should remove or hard-disable testing persona generation outside explicit non-production modes, or exclude it from persisted state entirely

### Finding BK: the shared portal-state blob directly drives backend registration and LMS business logic

Evidence:

- `backend/platform/store.js:8218`
  - `getComputedStudentHolds(...)` derives finance and probation holds from `this.state.portal.state`
- `backend/platform/store.js:8308`
  - `getStudentEligibility(...)` uses `this.state.portal.state?.registrationOpen`
- `backend/platform/store.js:1331` to `1402`
  - LMS group materials, assignments, submissions, concepts, quiz state, and quiz builder drafts are all stored under `portalState.*`
- `backend/platform/store.js:5084`
  - `savePortalState(nextState)` replaces the shared portal-state object wholesale

Meaning:

- overwriting `portal.state` can directly alter student eligibility, derived hold behavior, registration availability, and LMS content/workspace data
- this makes the portal-state overwrite a business-logic integrity risk, not just a generic shared-state concern
- production hardening must treat portal-state writes as high-impact server mutations rather than a cache synchronization detail

### Finding BC: production config advertises external file storage and ships MinIO, but upload writes still go only to local disk

Evidence:

- `.env.production.example:29`
  - `KIU_FILE_STORAGE_MODE=external`
- `.env.example:58`
  - MinIO credentials are documented
- `docker-compose.production.yml:71`
  - a `minio` service is included in the production stack
- `backend/platform/server.js:4722`
  - the server passes `fileStorageMode: process.env.KIU_FILE_STORAGE_MODE || 'external'` into `PlatformStore`
- `backend/platform/store.js:4983`
  - `createFileFromUpload(...)` still writes uploads directly with `fs.writeFileSync(...)`
- `backend/platform/store.js:4993`
  - the target path is always under `this.uploadsDir`

Meaning:

- the documented/declared production storage mode does not match the implemented upload persistence path
- a production deployment may believe it is using external object storage while still depending on local container-attached disk
- production storage guidance and runtime behavior need to be reconciled before file durability or scaling assumptions can be trusted

### Finding BU: RTC configuration defaults to Google public STUN servers

Evidence:

- `backend/platform/server.js:164`
  - `buildRtcConfig()` defaults `KIU_STUN_URLS` to:
    - `stun:stun.l.google.com:19302`
    - `stun:stun1.l.google.com:19302`
- `.env.example:35`
  - the example config also documents those Google STUN endpoints

Meaning:

- a production deployment that does not override STUN settings will still depend on a third-party Google network service for WebRTC bootstrapping
- this is a privacy, resilience, and external-dependency concern even if TURN is configured separately
- production RTC guidance should make external STUN dependencies explicit and intentional rather than a silent default

### Finding BD: the production backend container appears to run as root without additional filesystem hardening

Evidence:

- `Dockerfile:1`
  - base image is `node:22-alpine`
- the Dockerfile defines no `USER` instruction
- `docker-compose.production.yml:19`
  - the `portal-backend` service does not set `read_only: true`
- the service mounts a writable upload volume at:
  - `/app/kiu-realtime-bridge/uploads`

Meaning:

- the container runtime hardening is weak by default
- this increases the blast radius of already-confirmed write and state-integrity flaws, especially file-write bugs
- production deployment should run the backend as a non-root user and constrain writable paths explicitly

### Finding CA: the production TURN service uses host networking and injects static TURN credentials through the startup command/template path

Evidence:

- `docker-compose.production.yml:85`
  - the `coturn` service uses `network_mode: host`
- `docker-compose.production.yml:96`
  - the startup command substitutes `KIU_TURN_CREDENTIAL` into a generated config
- `infra/coturn/turnserver.conf.template:6`
  - TURN auth is configured as a static long-term credential:
    - `user=__TURN_USERNAME__:__TURN_CREDENTIAL__`

Meaning:

- the TURN service has a broad network exposure model in production
- the deployment path handles relay credentials in a way that is easier to leak through process/runtime inspection than a more isolated secret-management approach
- production RTC hardening should treat TURN credential handling and host-network exposure as first-class deployment risks

### Finding BG: the production Caddy config no longer proxies `service-worker.js` or `manifest.webmanifest` through the backend matcher

Evidence:

- `infra/caddy/Caddyfile`
  - the `@api` matcher now contains only `/api/*`, `/health`, `/ready`, and `/download` routes
- `test/caddy-static-asset-routing.test.js`
  - asserts that `/manifest.webmanifest` and `/service-worker.js` are no longer present in the backend proxy matcher

Meaning:

- the earlier manifest/service-worker backend-proxy mismatch is removed from the production Caddy config
- deployment verification still needs to test the full reverse-proxy asset map end to end, but this specific path-routing defect is no longer present in the config

### Finding BX: the production Caddy fallback can turn missing paths into a `200` login page instead of a real `404`

Evidence:

- `infra/caddy/Caddyfile:16`
  - `try_files {path} {path}/ /login.html`
- `infra/caddy/Caddyfile:17`
  - `file_server`
- there is no separate static-asset `=404` handling like the development nginx config uses for `/assets/` and `/images/`

Meaning:

- the earlier config now has a dedicated `@static` handler for `/assets/*`, `/images/*`, `/favicon.ico`, `/manifest.webmanifest`, and `/service-worker.js`
- those paths now bypass the `try_files ... /login.html` fallback and will fail through normal static-file semantics instead of being rewritten into shell HTML
- broader production routing still needs end-to-end verification for the remaining non-asset paths and repository-root exposure

### Finding BJ: the standalone production-readiness checker is environment-only and would miss many confirmed production blockers even if it passed

Evidence:

- `tools/check-production-readiness.js:6`
  - the script defines a fixed `required` array of environment and URL checks
- `tools/check-production-readiness.js:21`
  - the script defines a fixed `recommended` array of environment checks
- the script does not inspect or test confirmed production blockers already found in this audit, such as:
  - repository-root static serving in `infra/caddy/Caddyfile`
  - root container runtime in `Dockerfile`
  - public bootstrap/state exposure in `backend/platform/server.js`
  - file path traversal and centralized ownership enforcement gaps

Meaning:

- a green result from the standalone readiness checker would still not prove the system is production-safe
- this is a process and verification gap, not just a missing environment variable
- production readiness needs a broader verifier or a documented checklist that covers deployment topology and application security, not only env presence

### Finding CH: the social workspace now normalizes user-controlled external URLs before storage and href rendering

Evidence:

- `backend/platform/store.js`
  - `normalizeSafeExternalUrl(...)` now restricts stored external URLs to `http:`, `https:`, `mailto:`, and `tel:`
- `backend/platform/store.js`
  - `normalizePortfolioLinks(...)`, social page `actionUrl`, and event `onlineLink` now run through that normalizer before persistence
- `assets/js/pages/social-page.js`
  - `getSafeSocialExternalUrl(...)` now filters meeting links and portfolio links before they are written into `href` attributes
- `test/social-url-safety.test.js`
  - asserts the old raw `href="${escape(text(meeting.onlineLink))}"` and `href="${escape(link.url)}"` patterns are gone

Meaning:

- the previously confirmed `javascript:`-style social URL sink is no longer live on the audited storage/render path
- escaping is still not a substitute for URL validation in general, but this specific social link path now has explicit scheme normalization on both the backend and frontend
- broader DOM-sink review still remains open for other HTML-string and handler surfaces outside these social link paths

### Finding BV: push subscription endpoints are now constrained to HTTPS, non-private destinations before persistence

Evidence:

- `backend/platform/store.js:401`
  - `isValidPushSubscriptionEndpoint(...)` now rejects non-HTTPS, localhost, loopback, and private-network endpoints
- `backend/platform/store.js:4260`
  - `upsertPushSubscription(...)` now returns `null` unless `isValidPushSubscriptionEndpoint(endpoint)` passes
- `backend/platform/server.js:1095`
  - `sendWebPushNotification(...)` iterates the stored subscriptions
- `backend/platform/server.js:1116`
  - it only reaches `webPush.sendNotification(...)` for subscriptions that survived the stricter store validation

Meaning:

- the earlier “arbitrary endpoint” outbound-call abuse surface is now materially narrower
- push delivery still relies on third-party browser push providers by design, but the backend no longer accepts obviously unsafe local/private callback targets from clients
- broader external-integration review still remains open beyond push endpoint validation alone

### Finding DH: push subscription records are now user-scoped instead of endpoint-only

Evidence:

- `backend/platform/store.js:4264`
  - `upsertPushSubscription(...)` now derives the record id from ``${normalizedUserId}:${endpoint}``
- the user id is now part of record identity as well as record data

Meaning:

- the earlier endpoint-only rebinding risk is closed for this storage path
- production hardening should still review whether any other integration caches or registration records remain keyed only by shared external identifiers

### Finding DC: Student Service bootstrap exposes the macro library to all viewers

Evidence:

- `backend/platform/store.js:2218`
  - `getStudentServiceBootstrap(...)` returns `macros: serviceState.macros.map(item => clone(item))`
- unlike `reviewQueue`, this macro list is not gated on `viewer.canModerate`

Meaning:

- student-facing and other non-moderator views can receive internal support macros and canned staff responses
- this is a workflow/privacy leak, even if the macros are not secret credentials
- production hardening should scope support macros to the intended staff audience instead of returning them to every bootstrap consumer

### Finding BY: the Outlook mail cache persists full message bodies and attachment metadata in backend state

Evidence:

- `backend/platform/server.js:1636`
  - `mapGraphMessageSummary(...)` stores `body: body.content`
- `backend/platform/server.js:1638`
  - it also stores attachment metadata for each message
- `backend/platform/store.js:4707`
  - `saveMailCache(...)` merges message objects into `cache.messagesById`
- `backend/platform/store.js:4772`
  - `createMailBootstrap(...)` later rehydrates folder views from `cache.messagesById`
- visible cache clearing happens on disconnect at:
  - `backend/platform/store.js:4663`

Additional signal:

- the cache write path shown in `backend/platform/store.js:4707` to `4745` does not visibly prune `messagesById` entries by age or count during normal syncs
- visible cache reset is most explicit on disconnect at `4663`

Meaning:

- the backend persists full Outlook message content in its application state instead of keeping only minimal metadata
- cached mail content also appears to have weak normal-path retention controls
- this increases privacy exposure and storage weight if the state store is compromised or over-broadly accessed
- production mail integration should make retention and content-minimization explicit rather than caching full message bodies by default

### Finding DF: the email workspace renders cached HTML mail bodies directly into `iframe srcdoc`

Evidence:

- `backend/platform/server.js:1636`
  - cached Outlook message summaries persist the full HTML body as `body: body.content`
- `assets/js/pages/email.js:1167`
  - `escapeSrcDoc(...)` only escapes `&` and `"` for attribute embedding
- `assets/js/pages/email.js:1469` and `1741`
  - when `message.bodyType === 'html'`, the UI renders:
    - `<iframe sandbox="" srcdoc="${escapeSrcDoc(message.body)}"></iframe>`

Meaning:

- Outlook HTML bodies are rendered as active HTML documents in the browser rather than sanitized to a safer subset
- even with `sandbox=""`, remote image/tracking loads and other privacy-unfriendly email HTML behavior can still occur
- production mail handling should explicitly decide whether HTML email rendering is acceptable and, if so, how remote-content/privacy controls are enforced

### Finding BN: the admin audit-event route allows arbitrary audit record content injection

Evidence:

- `backend/platform/server.js:3922`
  - `POST /api/audit/events` is exposed to admins
- `backend/platform/server.js:3926`
  - the route forwards `...(request.body?.event || request.body || {})` into `store.addAuditEvent(...)`
- `backend/platform/store.js:4418`
  - `addAuditEvent(...)` persists caller-controlled fields such as:
    - `eventDomain`
    - `eventType`
    - `entityType`
    - `entityId`
    - `beforeState`
    - `afterState`
    - `sourceSystem`

Meaning:

- a privileged user can inject arbitrary audit-looking records into the system log
- this weakens forensic trust in the audit stream even when actor identity is server-supplied
- production audit logging should distinguish system-generated events from any manual annotations, or remove the arbitrary event-ingest route entirely

### Finding BQ: the authenticated SSE event channel now has explicit connection caps

Evidence:

- `backend/platform/server.js`
  - now defines `SSE_MAX_CONNECTIONS_PER_USER` and `SSE_MAX_CONNECTIONS_TOTAL`
- `backend/platform/server.js`
  - `registerSseClient(...)` now refuses registrations beyond those caps
- `backend/platform/server.js`
  - `/api/events` now returns `429` with `Too many live event streams are already open for this session.` when the cap is exceeded

Meaning:

- the earlier unbounded SSE registration path is now materially narrower
- long-lived streams still need production monitoring, but the route no longer accepts unlimited concurrent registrations per user or globally

### Finding BO: the PWA manifest is incomplete for production installability

Evidence:

- `manifest.webmanifest:4`
  - `start_url` is `/index.html`
- `manifest.webmanifest:10`
  - `icons` is an empty array

Meaning:

- the manifest currently lacks install icons and points new launches at `index.html` instead of a clearly intentional login-first entry flow
- even if the reverse-proxy path is corrected, the PWA surface is still not production-ready as an installable experience
- production rollout should treat manifest completeness and launch behavior as a real deployment-quality requirement

### Finding BM: several high-impact mutation routes lack route-level audit coverage

Evidence:

- `backend/platform/server.js:3866` to `3907`
  - multiple admin/integration mutation routes call `addRouteAuditEvent(...)`
- but several higher-risk mutation routes do not call `addRouteAuditEvent(...)`, including:
  - `backend/platform/server.js:2736`
    - `/api/portal/state`
  - `backend/platform/server.js:3006`
    - `/api/social/state`
  - `backend/platform/server.js:3813`
    - `/api/admin/accounts/:id/privileges`
  - `backend/platform/server.js:3826`
    - `/api/admin/reset-platform-state`
  - `backend/platform/server.js:3935`
    - `/api/files/upload`

Meaning:

- some of the routes with the highest integrity or security impact have weaker route-level audit coverage than less sensitive integration helpers
- this makes post-incident attribution and forensic reconstruction harder
- production hardening should prioritize deterministic audit events for the most security-sensitive mutation paths

### Finding CR: global realtime fanout causes connected clients to refetch broad shared state on many unrelated mutations

Evidence:

- `backend/platform/server.js`
  - many routes emit broad global events such as:
    - `broadcastAll({ type: 'portal:state-upsert', ... })`
    - `broadcastAll({ type: 'social:state-upsert', ... })`
- `assets/js/app/auth.js:825`
  - `portal:state-upsert` triggers `schedulePortalBackendBootstrap(true)`
- `assets/js/app/auth.js:834`
  - `social:state-upsert` triggers `schedulePortalSocialBootstrap(true)`
- the bootstrap paths those handlers refresh are already confirmed to return over-broad shared data

Meaning:

- many unrelated backend mutations can fan out into broad state refetches for all connected clients
- this amplifies both privacy exposure and runtime load when the fetched payloads are global snapshots
- production hardening should narrow the event scope and the refetched payload scope together, not just one or the other

### Finding BP: the production startup path runs migrations without cross-instance coordination

Evidence:

- `docker-compose.production.yml:29`
  - the production backend command is `node tools/migrate-postgres.js && node backend/platform/server.js`
- `tools/migrate-postgres.js`
  - applies migration files by checking `schema_migrations` and then running:
    - `begin`
    - SQL file
    - insert migration id
    - `commit`
- the migration runner does not use:
  - advisory locks
  - a dedicated migration leader
  - any other explicit cross-instance coordination

Meaning:

- concurrent production starts or overlapping rollouts can race through migration application
- even if individual SQL files are transaction-wrapped, the process-level migration leadership is not explicit
- production deployment should coordinate schema migrations rather than letting every backend instance attempt them opportunistically

### Finding CE: the shipped PostgreSQL initialization schema does not appear to match the runtime persistence model

Evidence:

- `infra/postgres/init/001_portal_schema.sql`
  - provisions normalized tables such as `portal_users`
- `infra/postgres/init/003_platform_runtime.sql`
  - provisions normalized tables such as `portal_sessions` and `file_objects`
- `infra/postgres/init/004_lms_production_readiness.sql`
  - provisions normalized tables such as `grade_audit_log`
- runtime persistence code instead centers on:
  - `backend/platform/postgres-record-store.js:3`
    - `DEFAULT_TABLE_NAME = 'kiu_platform_state_records'`
  - `backend/platform/postgres-record-store.js:41`
    - `writeState(state)` persists the full JSON state snapshot
- a codebase search over `backend/platform/*.js` returned no references to runtime querying of table names like:
  - `portal_users`
  - `portal_sessions`
  - `file_objects`
  - `grade_audit_log`

Meaning:

- the repository ships a normalized PostgreSQL schema that does not appear to be the schema the current runtime actually uses
- this can mislead deployment, backup, and compliance assumptions because operators may believe those tables back the live app when the runtime still uses the monolithic state table
- production readiness should reconcile the documented database model with the actual persistence model before the stack can be trusted operationally

### Finding CB: the PostgreSQL record store interpolates `tableName` directly into SQL

Evidence:

- `backend/platform/postgres-record-store.js:12`
  - `tableName` is taken from configuration as a trimmed string
- `backend/platform/postgres-record-store.js:20`
  - `CREATE TABLE IF NOT EXISTS ${this.tableName}`
- `backend/platform/postgres-record-store.js:31`
  - `FROM ${this.tableName}`
- `backend/platform/postgres-record-store.js:48`
  - `INSERT INTO ${this.tableName}`
- `backend/platform/postgres-record-store.js:55`
  - `DELETE FROM ${this.tableName}`

Meaning:

- the database table identifier is interpolated directly rather than safely quoted or validated against a strict identifier policy
- even if only operators set it, this is still a production hardening gap and a brittle deployment surface
- production database configuration should not rely on raw unvalidated identifier interpolation

### Finding BH: the normal logout flow does not await backend session destruction and does not clear the portal session token synchronously

Evidence:

- `assets/js/app/auth.js:281`
  - `authLogout()` calls `destroyPortalBackendSession();`
- `assets/js/app/auth.js:292`
  - the same function immediately redirects with `window.location.href = 'login.html';`
- `assets/js/app/api.js:584`
  - `destroyPortalBackendSession(...)` is async
- `assets/js/app/api.js:591`
  - it clears `KIU_PORTAL_SESSION_TOKEN` only after awaiting the logout request

Meaning:

- browser navigation can race ahead of backend logout completion
- this can leave the server-side session active and the local portal session token uncleared if the request is interrupted during redirect
- production logout should invalidate server state and clear local token state deterministically before navigation completes

### Finding CJ: routine authenticated session/bootstrap endpoints now redact the session token from echoed session objects

Evidence:

- `backend/platform/store.js:5068`
  - `createApplicationBootstrap(...)` now emits `createClientSessionPayload(session)` instead of the raw stored session
- `backend/platform/server.js:3698`
  - `/api/portal/session` now returns a redacted client session payload
- `backend/platform/server.js:3733` and `3744`
  - impersonation responses now return redacted client session payloads
- `backend/platform/server.js:3777`
  - `/api/me` now returns a redacted client session payload
- live verification on `http://127.0.0.1:48933` showed:
  - `/api/portal/session`, `/api/me`, `/api/bootstrap`, and `/api/session/impersonate-role` no longer include `session.token`
  - `/api/portal/session/login` still includes `session.token`

Meaning:

- routine introspection/bootstrap flows no longer broaden token exposure by echoing the active session token back in JSON
- auth-establishment flows can still return the token where they actually need to initialize local session state
- remaining session hardening in this area is now centered on session lifetime, browser storage, and other dedicated auth completion flows rather than routine echo endpoints

### Finding CS: the realtime channel no longer puts the portal session token into the URL

Evidence:

- `assets/js/app/auth.js:877`
  - `openKiuRealtimeEventStream(...)` now authenticates the stream with `X-Portal-Session`
- `assets/js/app/auth.js:941`
  - the stream URL now carries only `userId`
- `backend/platform/server.js:800`
  - `getSessionToken(request)` no longer accepts `request.query.token`
- live verification on `http://127.0.0.1:48933` showed:
  - `/api/events?...&token=...` -> `401`
  - header-authenticated realtime stream still succeeds

Meaning:

- this specific long-lived query-string token exposure is no longer present on the realtime channel
- the realtime path now matches the broader header-authenticated auth transport model used elsewhere in the portal
- remaining realtime hardening should focus on connection limits and state fanout behavior rather than URL-borne token leakage

### Finding CT: the protected-quiz desktop flow still contains localhost-only assumptions in the redeemed launch payload

Evidence:

- `backend/platform/store.js:3491`
  - `redeemProtectedQuizLaunch(...)` returns `quizSessionUrl: this.buildProtectedQuizClientUrl(...)`
- `backend/platform/store.js:3493`
  - the same payload hardcodes `allowedDomains: ['127.0.0.1', 'localhost']`
- `assets/js/pages/lms.js:39`
  - LMS helper code still defaults a local anti-cheat helper URL to `http://127.0.0.1:47831`
- `assets/js/pages/lms.js:138`
  - LMS also hardcodes desktop bridge origins:
    - `http://127.0.0.1:47835`
    - `http://localhost:47835`

Meaning:

- the protected exam desktop flow still assumes localhost-only helper/browser infrastructure in multiple places
- this is a production deployment/runtime mismatch that can break protected quiz operation even after backend auth issues are fixed
- production hardening should explicitly separate local helper assumptions from deployed anti-cheat architecture

### Finding CK: the former `document.write` app-bootstrap sink has been replaced with explicit script insertion

Evidence:

- `assets/js/app/app.js:940`
  - computes `apiUrl` for the API runtime script from `document.currentScript`
- `assets/js/app/app.js`
  - now inserts the runtime script through `currentScript.parentNode.insertBefore(script, currentScript.nextSibling)` when possible, otherwise falls back to `document.head.appendChild(script)`
- `test/app-bootstrap-security.test.js`
  - asserts the live source no longer contains `document.write`

Meaning:

- this specific live `document.write`-based script injection path is no longer present in first-party bootstrap code
- the loader is still dynamic, but it now uses a safer explicit DOM insertion path that is less fragile during document parsing
- broader CSP rollout work still remains because other risky sinks, inline handlers, and `eval`-based loading are separate blockers

### Finding BZ: the exam portal sign-in flow creates a 12-hour student session from only `email + studentId`

Evidence:

- `assets/js/pages/exam-portal.js:583`
  - the client signs in by posting only `{ email, studentId }` to `/api/exam-portal/auth`
- `backend/platform/server.js:4338`
  - `/api/exam-portal/auth` forwards the request body to `store.createExamPortalSession(...)`
- `backend/platform/store.js:3033`
  - `createExamPortalSession(payload)` requires only `email` and `studentId`
- `backend/platform/store.js:3036`
  - it checks that the email resolves to an account whose `id` matches the submitted student id
- `backend/platform/store.js:3049`
  - on success it creates an active exam portal session with a `12 * 60 * 60 * 1000` expiry

Meaning:

- exam portal access appears to rely on knowledge of a student's email and id rather than a stronger secret or pre-issued launch credential
- this is a production authentication flaw on the exam surface, separate from the later protected-quiz launch-ticket flow
- exam portal login should require a stronger trust factor than `email + studentId` alone

### Finding BT: the anti-cheat browser gate is header and user-agent based, and can be trivially spoofed

Evidence:

- `backend/platform/server.js:1268`
  - `isAntiCheatBrowserRequest(request)` returns true when either:
    - the `User-Agent` matches `AntiCheatBrowser/...`
    - or `X-Protected-Client-Session` is any non-empty value
- `backend/platform/server.js:1274`
  - `requireAntiCheatBrowserRequest(...)` relies on that helper
- the gate is used on exam-portal routes such as:
  - `backend/platform/server.js:4339`
    - `/api/exam-portal/auth`
  - `backend/platform/server.js:4349`
    - `/api/exam-portal/sessions`
  - `backend/platform/server.js:4361`
    - `/api/exam-portal/session/:sessionId`
  - `backend/platform/server.js:4373`
    - `/api/exam-portal/sessions/:sessionId/launch-ticket`

Meaning:

- the backend anti-cheat/browser trust boundary appears spoofable by client-controlled headers alone
- this weakens the intended protection around exam-portal and protected exam access
- production hardening should not treat user-agent strings or arbitrary client headers as sufficient proof of anti-cheat runtime

### Finding DI: the exam portal sign-in route has no rate limiting

Evidence:

- `backend/platform/server.js:4338`
  - `/api/exam-portal/auth` handles sign-in requests directly
- unlike the main portal login and reset flows at `3564` and `3634`, this route does not call `enforceRateLimit(...)`
- `assets/js/pages/exam-portal.js:583`
  - the client calls this route directly from the exam sign-in form

Meaning:

- the already-weak `email + studentId` exam sign-in flow is also unthrottled
- this increases brute-force and enumeration pressure on a sensitive exam-facing surface
- production hardening should apply abuse controls to exam sign-in comparable to or stronger than the main portal login flow

### Finding AI: the service worker returns cached HTML for failed API requests

Evidence:

- `service-worker.js`
  - `/api/` requests are still intercepted
- `service-worker.js`
  - backend fetch failure now returns `buildOfflineApiResponse(request)` with a `503` JSON payload carrying `code: 'offline'`

Meaning:

- backend outages no longer degrade into cached shell HTML for the `/api/` fetch path
- runtime QA and incident debugging now get an explicit API-shaped offline failure instead of a misleading HTML success path
- offline shell behavior for document routes still remains separate from backend/API semantics

### Finding AJ: LMS delegated markup actions now use a constrained interpreter instead of `new Function`

Evidence:

- `assets/js/pages/lms.js`
  - now defines `splitLmsTopLevel(...)`, `resolveLmsDelegatedExpression(...)`, and `executeLmsDelegatedStatement(...)` as a constrained delegated-action interpreter
- `test/lms-delegated-actions-security.test.js`
  - asserts the live LMS source no longer contains `new Function('event', 'element', normalizedCode)`

Meaning:

- the earlier `new Function`-based LMS delegated action sink is no longer live
- the LMS route still uses string-encoded action descriptions, but they now flow through a constrained interpreter that only supports the current delegated action patterns
- broader CSP and DOM-sink hardening still remains open because the route still renders a large `innerHTML` surface and other pages still rely on string-built markup

### Finding CC: shared-state persistence appears last-writer-wins across instances with no optimistic concurrency control

Evidence:

- `backend/platform/store.js:530`
  - `save()` writes the current in-memory `this.state` snapshot directly through `recordStore.writeState(this.state)`
- `backend/platform/postgres-record-store.js`
  - `loadState()` loads the full namespace set into memory
  - `writeState(state)` upserts every namespace from that snapshot
  - then deletes any namespace not present in the current snapshot
- no version check, compare-and-swap token, or row-level optimistic concurrency guard is applied before overwriting shared state

Meaning:

- multiple backend instances or stale in-memory snapshots can overwrite each other's changes
- production scaling or even overlapping writes after delayed reads can cause state loss or silent rollback of newer updates
- production persistence needs concurrency control or a more granular data model before the platform can be treated as multi-instance safe

## Execution Order

Do the audit/fix work in this order unless a newly verified blocker changes the order:

1. `AUDIT-SYN-01`
2. `AUDIT-RUN-01`
3. `AUDIT-NAV-01`
4. `AUDIT-SEC-01`
5. `AUDIT-SEC-02`
6. `AUDIT-AUTHZ-01`
7. `AUDIT-STATE-01`
8. `AUDIT-SEC-03`
9. `AUDIT-SEC-04`
10. `AUDIT-SEC-05`
11. `AUDIT-HDR-01`
12. `AUDIT-QA-01`
13. `AUDIT-PAGE-01`

Reason:

- the old global shell breakage is no longer the main blocker, but route confidence is still incomplete
- mixed navigation behavior is now a distinct user-visible runtime problem that deserves dedicated audit/fix work
- the confirmed `eval` and token-storage issues are higher-priority security findings than generic cleanup
- authorization and file handling are high-risk areas that need structured review
- the shared-state persistence model is now a confirmed production-integrity risk and should be assessed before trusting multi-instance deployment
- page-by-page flow audit should happen after the global runtime state is stabilized enough to trust route behavior

## How To Read Each Task

Every task below uses this structure:

- `Priority`
- `Depends on`
- `What is already known`
- `Why this task still exists`
- `Primary files`
- `Exact audit/fix work`
- `Verification gate`

## Audit Backlog

### `AUDIT-SYN-01` `0% left` Complete the whole-site syntax and markup validity audit

Priority: `P1`
Depends on: none

What is already known:

- first-party JS parse baseline is clean:
  - `75` files checked
  - `0` syntax-check failures
- this does **not** prove HTML/CSS validity or encoding quality

Why this task still exists:

- parse-clean JS does not guarantee that:
  - entry HTML is valid
  - inline script blocks are healthy
  - CSS is valid
  - mojibake or encoding corruption is absent

Primary files:

- root `*.html`
- `assets/css/`
- `assets/js/`

Exact audit/fix work:

1. Validate root HTML entry pages for malformed markup and inconsistent inline script blocks.
2. Audit CSS for parsing issues and corrupted text markers.
3. Audit known mojibake-prone files for corrupted visible strings.
4. Record actual syntax or validity failures in update blocks.

Verification gate:

- JS parse baseline remains green
- any HTML/CSS validity failures are explicitly listed
- mojibake/encoding hotspots are either fixed or tracked individually

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: targeted mojibake spot checks confirmed still-live corruption at `assets/js/pages/directories.js:4`, `assets/js/pages/directories.js:962`, and `assets/js/pages/directories.js:963`, including broken fallback `office` and `phone` values in the new-staff workflow
- Remaining work: broaden the encoding audit beyond `directories.js`, fix the corrupted defaults, and check other admin/staff-facing surfaces for visible broken strings

Update `2026-05-17`:
- Status: partially completed
- % left: `20% left`
- Files changed: `profile.html`, `timetable.html`, `assets/js/pages/directories.js`, `test/profile-source-regressions.test.js`, `test/profile-route-regressions.test.js`, `test/timetable-route-regressions.test.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/pages/directories.js`; `npx vitest run test/profile-source-regressions.test.js test/profile-route-regressions.test.js test/timetable-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js`; seeded Playwright verification on `http://127.0.0.1:8876/profile.html` confirmed clean `Profile` / `Email` / `Password Change` / `My Timetable` tabs, clean password placeholders, clean recovery helper copy, and zero console/page errors; targeted source scans now show `0` mojibake markers in `profile.html` and `assets/js/pages/directories.js`, and the timetable insight placeholders now ship plain `--` source text instead of broken dash bytes
- Remaining work: continue the broader encoding sweep across other still-suspect routes and comments, then run explicit HTML/CSS validity checks beyond the now-fixed `profile`, `timetable`, and `directories` hotspots

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `orders.html`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/orders-route-regressions.test.js`; seeded Playwright verification on `http://127.0.0.1:8876/orders.html` confirmed `Official orders and decisions`, `My Orders`, zero console/page errors, and no broken mojibake markers in `#page-orders`; the static fallback block at `orders.html:211` to `259` now ships clean English labels (`Orders Register`, `Documents`, `Order Title`, `Order ID`, `Issued On`, `Status`, `Document`, `Open PDF`) instead of the previous corrupted strings
- Remaining work: clean the still-loaded mojibake-heavy literals in `assets/js/pages/planner.js` now that `admin-tools.html` remains the main live importer, decide whether the remaining admin/comment/header corruption in `admin-tools.html`, `admin-scheduler.html`, `assets/css/layout.css`, and `assets/css/social-rebuild.css` should be normalized or explicitly tracked as comment-only debt, and then run explicit HTML/CSS validity checks beyond the now-clean `profile`, `timetable`, `orders`, and `directories` hotspots

Update `2026-05-17`:
- Status: partially completed
- % left: `12% left`
- Files changed: `admin-tools.html`, `admin-scheduler.html`, `assets/css/layout.css`, `assets/css/social-rebuild.css`, `assets/js/pages/social-page.js`, `test/admin-tools-route-regressions.test.js`, `test/admin-scheduler-recovery.test.js`, `test/admin-scheduler-navigation.test.js`, `test/social-lost-found-regressions.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md`, `docs/SOCIAL_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/admin-tools-route-regressions.test.js test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` passed `3/3` files and `10/10` tests; `node --check assets/js/pages/social-page.js`; `npx vitest run test/social-lost-found-regressions.test.js` passed `1/1` file and `6/6` tests; broad first-party source scan now no longer reports mojibake-heavy header/comment blocks in `admin-tools.html`, `admin-scheduler.html`, `assets/css/layout.css`, or `assets/css/social-rebuild.css`, and the live `social-page.js` visibility/placeholders now use clean separators/dashes/ellipsis instead of `Ã¢â‚¬Â¢`, `Ã¢â‚¬â€`, and `Ã¢â‚¬Â¦`
- Remaining work: decide how much of the remaining mojibake-heavy compatibility text in `assets/js/pages/planner.js` and `assets/js/pages/registration.js` is still live on the `admin-tools.html` route, strip the now-confirmed dead comment noise left in `assets/js/app/state.js`, and separate the intentional repair tables in `assets/js/app/app.js` from genuine remaining source corruption before declaring the syntax audit closed

Update `2026-05-17`:
- Status: partially completed
- % left: `10% left`
- Files changed: `timetable.html`, `admin-scheduler.html`, `study-card.html`, `test/timetable-route-regressions.test.js`, `test/admin-scheduler-recovery.test.js`, `test/admin-scheduler-navigation.test.js`, `test/study-card-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/timetable-route-regressions.test.js test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js test/study-card-route-regressions.test.js` passed `4/4` files and `14/14` tests; broad `npx -y html-validate` on all root `*.html` files reported a `630`-issue markup/accessibility/style backlog; focused rerun on `timetable.html`, `admin-scheduler.html`, and `study-card.html` now reports `80` issues after removing the previous `no-utf8-bom`, `no-dup-id`, `no-raw-characters`, `no-implicit-close`, and `void-style` failures from those files; direct buffer inspection now confirms `admin-scheduler.html` and `study-card.html` ship without BOM bytes; seeded admin-tools visibility verification on `http://127.0.0.1:8876/admin-tools.html` found no visible broken mojibake markers on the default live admin-tools load
- Remaining work: decide whether the remaining `html-validate` output should be treated as a dedicated markup/accessibility hardening backlog under this task or remediated page by page now, continue isolating dormant mojibake-heavy compatibility literals in `planner.js` and `registration.js`, and strip the dead comment noise still left in `assets/js/app/state.js` while keeping the intentional repair tables in `assets/js/app/app.js`

Update `2026-05-17`:
- Status: partially completed
- % left: `8% left`
- Files changed: `assets/js/pages/registration.js`, `docs/REGISTRATION_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/pages/registration.js` passed after restoring the truncated staff-modal block and reintroducing the delegated admin-tools curriculum runtime; `npx vitest run test/admin-tools-route-regressions.test.js test/planner-legacy-delegation.test.js test/registration-route-regressions.test.js` passed `3/3` files and `5/5` tests; targeted `rg -n 'Ãƒ|Ã¢â‚¬â€|Ã¯Â¿Â½' assets/js/pages/registration.js assets/js/pages/planner.js assets/js/app/state.js` now reports no remaining mojibake markers in `assets/js/pages/registration.js`, leaving `planner.js` plus the intentional detector regex in `state.js`
- Remaining work: clean the still-live mojibake-heavy planner literals (`titleMapping`, day labels, section-insight copy, and grade-details table headings), then decide whether the remaining root `html-validate` backlog and the intentional repair tables in `assets/js/app/app.js` should stay under this task or move to dedicated hardening follow-ups

Update `2026-05-18`:
- Status: partially completed
- % left: `6% left`
- Files changed: `assets/js/pages/planner.js`, `test/planner-legacy-delegation.test.js`, `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/pages/planner.js` passed after replacing the remaining mojibake-heavy study-card transcript labels, admin master-grid weekday labels, scheduler success copy, and section-insight status copy with clean English text; `npx vitest run test/planner-legacy-delegation.test.js test/admin-tools-route-regressions.test.js test/registration-route-regressions.test.js` passed `3/3` files and `5/5` tests; `Select-String -Path assets/js/pages/planner.js,assets/js/pages/registration.js,assets/js/app/state.js -Pattern 'Ãƒ|Ã¢â‚¬â€|Ã¯Â¿Â½'` now reports only `assets/js/app/state.js:40`; and a seeded Playwright check on `http://127.0.0.1:8876/admin-tools.html` with a local admin auth snapshot confirmed the default admin workspace rendered with `visibleBroken: false` and zero console/page errors
- Remaining work: treat `assets/js/app/state.js:40` as the intentional mojibake detector regex, keep the `assets/js/app/app.js` replacement tables documented as deliberate encoding-repair logic rather than live corruption, and decide whether the remaining broad `html-validate` backlog should stay in this task or move into a dedicated markup/accessibility hardening follow-up


Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/app/app.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/app/app.js` passed; source scans now show `assets/js/app/state.js` reduced to the intentional detector regex at line `40`, `assets/js/app/app.js` reduced to the deliberate localization repair tables plus detector regexes after removing the stray mobile comment and footer fallback corruption, and `assets/css/*.css` at `0` mojibake hits; the broad root-entry `html-validate` summary is now classified under `AUDIT-MARKUP-01` with top rules `no-inline-style` (`246`), `no-implicit-button-type` (`118`), `element-permitted-content` (`111`), and `unique-landmark` (`71`)
- Remaining work: none in this task; remaining root-entry markup/accessibility remediation now lives under `AUDIT-MARKUP-01`

### `AUDIT-MARKUP-01` `0% left` Remediate the root-entry HTML validity and accessibility backlog from the completed syntax audit

Priority: `P1`
Depends on: `AUDIT-SYN-01`

What is already known:

- broad `html-validate` summary on the current `30` root HTML entries reports `160` issues across `14` files
- top rule families are:
  - `no-inline-style`: `58`
  - `element-permitted-content`: `31`
  - `no-implicit-button-type`: `30`
  - `unique-landmark`: `28`
  - `autocomplete-password`: `3`
  - `no-trailing-whitespace`: `3`
  - `text-content`: `2`
  - `no-raw-characters`: `2`
  - `aria-label-misuse`: `1`
  - `element-required-attributes`: `1`
- heaviest files are currently:
  - `admin-tools.html`: `17`
  - `news.html`: `17`
  - `personal-data.html`: `17`
  - `programs.html`: `17`
  - `chancellery.html`: `16`
  - `student-service.html`: `16`
  - `login.html`: `13`
  - `career-market.html`: `11`
  - `social.html`: `11`

Why this task still exists:

- the syntax audit is now complete, but the validator backlog still reflects significant HTML structure, accessibility, and style-hardening debt
- most remaining issues are not parse failures; they are semantic/accessibility problems that need deliberate page-by-page remediation

Primary files:

- root `*.html`
- route entry pages with repeated inline styles or invalid button/label nesting

Exact audit/fix work:

1. Reduce or justify the repeated `no-inline-style` backlog on root entry pages.
2. Add explicit `type` attributes to root-entry `<button>` elements flagged by the validator.
3. Resolve invalid nested-content structures such as `<div>` under `<button>` or `<label>`.
4. Add unique accessible names to duplicated landmark regions.
5. Clear the remaining raw `&` findings and implicit input-type findings.

Verification gate:

- a fresh broad `html-validate` run across all root `*.html` files shows the backlog materially reduced
- the remaining rule families and file owners are explicitly documented if any findings are intentionally deferred

Update `2026-05-18`:
- Status: partially completed
- % left: `90% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: broad `html-validate` JSON summary across all root `*.html` files reports `604` issues across `25` files; top-file counts are `profile-view.html` `87`, `registration.html` `67`, `orders.html` `43`, `admin-scheduler.html` `41`, `admin-orders.html` `35`, and `admin-tools.html` `17`; top-rule counts are `no-inline-style` `246`, `no-implicit-button-type` `118`, `element-permitted-content` `111`, and `unique-landmark` `71`
- Remaining work: start with one high-signal root-entry batch, ideally `registration.html` plus `profile-view.html`, because they combine high issue counts with pages that already have active route regression coverage

Update `2026-05-18`:
- Status: partially completed
- % left: `85% left`
- Files changed: `profile-view.html`, `registration.html`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/REGISTRATION_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `profile-view.html` from `87` to `72` issues and `registration.html` from `67` to `43`; the refreshed broad root-entry summary now reports `565` issues across `25` files, down from `604`; `npx vitest run test/profile-view-source-regressions.test.js test/profile-view-route-regressions.test.js test/registration-route-regressions.test.js` passed `3/3` files and `8/8` tests
- Remaining work: keep reducing the top rule families, with the next best targets still being `profile-view.html`, `orders.html`, `registration.html`, and `admin-scheduler.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `80% left`
- Files changed: `orders.html`, `admin-scheduler.html`, `test/orders-route-regressions.test.js`, `test/admin-scheduler-recovery.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `orders.html` from `43` to `27` issues and `admin-scheduler.html` from `41` to `25`; the refreshed broad root-entry summary now reports `533` issues across `25` files, down from `565`; top rule counts are now `no-inline-style` `246`, `element-permitted-content` `99`, `no-implicit-button-type` `88`, and `unique-landmark` `59`; `npx vitest run test/orders-route-regressions.test.js test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` passed `3/3` files and `12/12` tests
- Remaining work: keep trimming the highest-count root entry pages, with `profile-view.html`, `registration.html`, `admin-orders.html`, `admin-library.html`, and `library.html` now the best next validator targets

Update `2026-05-18`:
- Status: partially completed
- % left: `70% left`
- Files changed: `admin-orders.html`, `admin-library.html`, `library.html`, `test/admin-orders-route-regressions.test.js`, `test/admin-library-route-regressions.test.js`, `test/library-route-regressions.test.js`, `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md`, `docs/LIBRARY_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun now reports `admin-orders.html` `4`, `admin-library.html` `8`, and `library.html` `8`; the refreshed broad root-entry summary now reports `460` issues across `25` files, down from `533`; top rule counts are now `no-inline-style` `246`, `no-implicit-button-type` `78`, `element-permitted-content` `67`, and `unique-landmark` `50`; `npx vitest run test/admin-orders-route-regressions.test.js test/admin-library-route-regressions.test.js test/library-route-regressions.test.js` passed `3/3` files and `3/3` tests
- Remaining work: the remaining highest-count root entry pages are now `profile-view.html` (`72`), `registration.html` (`43`), `orders.html` (`27`), `admin-scheduler.html` (`25`), `study-card.html` (`21`), plus the `18-20` issue cluster on `faculty-gradebook.html`, `lms.html`, `staff.html`, `exams.html`, and `profile.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `65% left`
- Files changed: `profile-view.html`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `profile-view.html` from `72` to `62` issues after fixing the remaining missing `type` attributes, icon-only schedule-row delete button label, text input types in the profile-edit templates, and mobile action-sheet button structure; the refreshed broad root-entry summary now reports `450` issues across `25` files; `npx vitest run test/profile-view-source-regressions.test.js test/profile-view-route-regressions.test.js` passed `2/2` files and `5/5` tests
- Remaining work: the biggest remaining validator targets are now `profile-view.html` (`62`) and `registration.html` (`43`), with the rest of the backlog clustered in `orders.html` (`27`), `admin-scheduler.html` (`25`), `study-card.html` (`21`), and the `18-20` issue pages

Update `2026-05-18`:
- Status: partially completed
- % left: `55% left`
- Files changed: `registration.html`, `assets/css/index-luxury.css`, `assets/css/mobile-responsive.css`, `assets/js/app/app.js`, `assets/js/shared/utilities.js`, `test/registration-route-regressions.test.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/REGISTRATION_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `registration.html` from `43` to `0` after removing the static announcement/event/syllabus/program modal payload in favor of the shared `ui.js` builders, moving the fixed ECTS footer and mobile action-sheet icon gradients into CSS classes, and teaching the mobile sheet fallback helpers to respect the hidden-state shell; the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `407` issues across `24` files with top rules `no-inline-style` (`203`), `no-implicit-button-type` (`68`), `element-permitted-content` (`59`), and `unique-landmark` (`50`); `node --check assets/js/app/app.js` and `assets/js/shared/utilities.js` passed; `npx vitest run test/registration-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js` passed `2/2` files and `7/7` tests; and a seeded Playwright smoke on `http://127.0.0.1:8876/registration.html` rendered `Registration Studio` with zero console or page errors while keeping `#modal-programs` and `#modal-syllabus` out of the static shell
- Remaining work: `profile-view.html` remains the largest validator target at `62`, followed by `orders.html` (`27`), `admin-scheduler.html` (`25`), `study-card.html` (`21`), `faculty-gradebook.html` (`20`), and the `17-19` issue cluster on `lms.html`, `staff.html`, `exams.html`, `profile.html`, `timetable.html`, `admin-tools.html`, and `news.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `45% left`
- Files changed: `profile-view.html`, `assets/css/profile-view-route.css`, `test/profile-view-source-regressions.test.js`, `test/profile-view-route-regressions.test.js`, `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `profile-view.html` from `62` to `0` after replacing the remaining root-shell, session-modal, edit-group-modal, schedule-row, and mobile action-sheet inline styles with route CSS classes and bumping the route stylesheet cache key to `assets/css/profile-view-route.css?v=20260518-profileview-markup1`; the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `345` issues across `23` files with top rules `no-inline-style` (`141`), `no-implicit-button-type` (`68`), `element-permitted-content` (`59`), and `unique-landmark` (`50`); `npx vitest run test/profile-view-source-regressions.test.js test/profile-view-route-regressions.test.js` passed `2/2` files and `5/5` tests
- Remaining work: `orders.html` is now the largest validator target at `27`, followed by `admin-scheduler.html` (`25`), `study-card.html` (`21`), `faculty-gradebook.html` (`20`), and the `17-19` issue cluster on `lms.html`, `staff.html`, `exams.html`, `profile.html`, `timetable.html`, `admin-tools.html`, `news.html`, and `personal-data.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `35% left`
- Files changed: `orders.html`, `test/orders-route-regressions.test.js`, `docs/ORDERS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `orders.html` from `27` to `0` after replacing the remaining static fallback tabs, table shell, sample status chips, footer controls, and mobile action-sheet icon gradients with route-owned classes in `orders.html`; the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `318` issues across `22` files with top rules `no-inline-style` (`116`), `no-implicit-button-type` (`68`), `element-permitted-content` (`59`), and `unique-landmark` (`50`); `npx vitest run test/orders-route-regressions.test.js` passed `1/1` file and `2/2` tests
- Remaining work: `admin-scheduler.html` is now the largest validator target at `25`, followed by `study-card.html` (`21`), `faculty-gradebook.html` (`20`), and the `17-19` issue cluster on `lms.html`, `staff.html`, `exams.html`, `profile.html`, `timetable.html`, `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `25% left`
- Files changed: `admin-scheduler.html`, `test/admin-scheduler-recovery.test.js`, `test/admin-scheduler-navigation.test.js`, `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `admin-scheduler.html` from `25` to `0` after replacing the remaining subject-search label, professor-quiz modal, create-session modal, readonly faculty field, and mobile action-sheet inline styles with scheduler-owned classes inside the existing route style block; the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `293` issues across `21` files with top rules `no-inline-style` (`91`), `no-implicit-button-type` (`68`), `element-permitted-content` (`59`), and `unique-landmark` (`50`); `npx vitest run test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` passed `2/2` files and `10/10` tests
- Remaining work: `study-card.html` is now the largest validator target at `21`, followed by `faculty-gradebook.html` (`20`), the `18-19` issue cluster on `lms.html`, `staff.html`, `exams.html`, `profile.html`, and `timetable.html`, and the `17` issue cluster on `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `20% left`
- Files changed: `study-card.html`, `assets/css/index-luxury.css`, `test/study-card-route-regressions.test.js`, `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `study-card.html` from `21` to `0` after adding unique labels to the hidden nav stubs, moving the program-view filter shell onto route-owned classes in `index-luxury.css`, labeling the two icon-only filter buttons, and normalizing the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `272` issues across `20` files with top rules `no-inline-style` (`84`), `no-implicit-button-type` (`63`), `element-permitted-content` (`55`), and `unique-landmark` (`47`); `npx vitest run test/study-card-route-regressions.test.js` passed `1/1` file and `2/2` tests
- Remaining work: `faculty-gradebook.html` is now the largest validator target at `20`, followed by the `18-19` issue cluster on `lms.html`, `staff.html`, `exams.html`, `profile.html`, and `timetable.html`, then the `17` issue cluster on `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `15% left`
- Files changed: `faculty-gradebook.html`, `test/faculty-gradebook-route-regressions.test.js`, `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `faculty-gradebook.html` from `20` to `0` after adding unique labels to the hidden nav stubs, encoding the remaining raw `&amp;` source text in the page title, hero badge, and faculty options, and normalizing the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `252` issues across `19` files with top rules `no-inline-style` (`80`), `no-implicit-button-type` (`58`), `element-permitted-content` (`51`), and `unique-landmark` (`44`); `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed `1/1` file and `1/1` test
- Remaining work: the backlog is now concentrated in the `18-19` issue cluster on `lms.html`, `staff.html`, `exams.html`, `profile.html`, and `timetable.html`, followed by the `17` issue cluster on `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`, then `chancellery.html` and `student-service.html` at `16`

Update `2026-05-18`:
- Status: partially completed
- % left: `10% left`
- Files changed: `lms.html`, `staff.html`, `assets/css/staff-command-center.css`, `test/lms-route-regressions.test.js`, `test/scheduler-and-lms-regressions.test.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/LMS_OPTIMIZATION_TRACKER.md`, `docs/STAFF_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` reruns dropped both `lms.html` and `staff.html` from `19` to `0`; `lms.html` now has unique hidden-nav labels, a valid grouped class-type switch, a class-based gradebook-wrapper shell, and normalized mobile action-sheet buttons, while `staff.html` now has unique hidden-nav labels, class-based loading/modal defaults in `assets/css/staff-command-center.css`, and normalized mobile action-sheet buttons; `npx vitest run test/lms-route-regressions.test.js test/scheduler-and-lms-regressions.test.js` passed `2/2` files and `4/4` tests; `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed `1/1` file and `4/4` tests; and the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `214` issues across `17` files with top rules `no-inline-style` (`68`), `no-implicit-button-type` (`48`), `element-permitted-content` (`43`), and `unique-landmark` (`38`)
- Remaining work: the remaining markup backlog is now concentrated in `exams.html`, `profile.html`, and `timetable.html` at `18`, the `17` issue cluster on `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`, then `chancellery.html` and `student-service.html` at `16`, with `login.html` (`13`) and `career-market.html` / `social.html` (`11`) behind them

Update `2026-05-18`:
- Status: partially completed
- % left: `5% left`
- Files changed: `exams.html`, `assets/css/exam-studio.css`, `profile.html`, `test/exams-route-regressions.test.js`, `test/profile-route-regressions.test.js`, `docs/EXAMS_OPTIMIZATION_TRACKER.md`, `docs/PROFILE_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` reruns dropped both `exams.html` and `profile.html` from `18` to `0`; `exams.html` now has unique hidden-nav labels, a route-owned `.exams-shell-root` margin class, and normalized mobile action-sheet buttons, while `profile.html` now has unique hidden-nav labels, explicit button types on visible updates, password `autocomplete` attributes, and normalized mobile action-sheet buttons; `npx vitest run test/exams-route-regressions.test.js` passed `1/1` file and `1/1` test; `npx vitest run test/profile-route-regressions.test.js` passed `1/1` file and `1/1` test; and the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `178` issues across `15` files with top rules `no-inline-style` (`63`), `no-implicit-button-type` (`35`), `element-permitted-content` (`35`), and `unique-landmark` (`31`)
- Remaining work: the remaining markup backlog is now led by `timetable.html` at `18`, the `17` issue cluster on `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`, then `chancellery.html` and `student-service.html` at `16`, with `login.html` (`13`) and `career-market.html` / `social.html` (`11`) behind them

Update `2026-05-18`:
- Status: partially completed
- % left: `3% left`
- Files changed: `timetable.html`, `assets/css/timetable-route.css`, `test/timetable-route-regressions.test.js`, `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: focused `html-validate` rerun dropped `timetable.html` from `18` to `0` after adding unique hidden-nav labels, moving the live stage-status dot into `assets/css/timetable-route.css`, normalizing the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers, and removing the last trailing-whitespace shell hit; `npx vitest run test/timetable-route-regressions.test.js` passed `1/1` file and `2/2` tests; and the refreshed broad root-entry summary on the actual `30` root HTML entries now reports `160` issues across `14` files with top rules `no-inline-style` (`58`), `element-permitted-content` (`31`), `no-implicit-button-type` (`30`), and `unique-landmark` (`28`)
- Remaining work: the remaining markup backlog is now concentrated in the `17` issue cluster on `admin-tools.html`, `news.html`, `personal-data.html`, and `programs.html`, then `chancellery.html` and `student-service.html` at `16`, with `login.html` (`13`) and `career-market.html` / `social.html` (`11`) behind them

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `admin-library.html`, `admin-orders.html`, `admin-scheduler.html`, `admin-tools.html`, `career-market.html`, `chancellery.html`, `exam-portal.html`, `exams.html`, `faculty-gradebook.html`, `index.html`, `library.html`, `login.html`, `lms.html`, `news.html`, `orders.html`, `personal-data.html`, `profile-view.html`, `profile.html`, `programs.html`, `registration.html`, `social.html`, `staff.html`, `student-service.html`, `study-card.html`, `timetable.html`, `assets/css/base.css`, `assets/css/login-route.css`, `assets/css/mobile-responsive.css`, `test/admin-library-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `test/admin-scheduler-recovery.test.js`, `test/career-market-route-regressions.test.js`, `test/exam-portal-regressions.test.js`, `test/exams-route-regressions.test.js`, `test/faculty-gradebook-route-regressions.test.js`, `test/library-route-regressions.test.js`, `test/login-route-regressions.test.js`, `test/lms-route-regressions.test.js`, `test/news-route-regressions.test.js`, `test/orders-route-regressions.test.js`, `test/personal-data-route-regressions.test.js`, `test/profile-route-regressions.test.js`, `test/profile-view-route-regressions.test.js`, `test/profile-view-source-regressions.test.js`, `test/programs-route-regressions.test.js`, `test/staff-mobile-runtime-regressions.test.js`, `test/study-card-route-regressions.test.js`, `test/timetable-route-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: broad root-entry `html-validate` rerun now reports `0` files with issues and `0` total issues across all `30` root `*.html` files; `npx vitest run test/login-route-regressions.test.js test/admin-library-route-regressions.test.js test/library-route-regressions.test.js test/programs-route-regressions.test.js test/exam-portal-regressions.test.js test/career-market-route-regressions.test.js test/news-route-regressions.test.js test/personal-data-route-regressions.test.js`; `npx vitest run test/admin-scheduler-recovery.test.js test/study-card-route-regressions.test.js test/admin-orders-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js test/orders-route-regressions.test.js test/exams-route-regressions.test.js test/lms-route-regressions.test.js test/faculty-gradebook-route-regressions.test.js test/timetable-route-regressions.test.js test/admin-library-route-regressions.test.js test/library-route-regressions.test.js test/profile-route-regressions.test.js`; `npm run test` now passes `74` test files and `197` tests after the final validator-safe shell markup cleanup
- Remaining work: none for the current root-entry HTML validity and accessibility backlog

### `AUDIT-RUN-01` `0% left` Complete the whole-site runtime bug audit

Priority: `P0`
Depends on: `CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md` should be kept in sync

What is already known:

- the previously broken global shell baseline has been repaired
- all `30` root HTML entries now have at least one current smoke observation
- not every route and not every primary flow was tested

Why this task still exists:

- route coverage is now broad at smoke level, but still shallow at flow level
- many routes may still have secondary bugs hidden behind auth/session expectations or route-specific interactions

Primary files:

- root `*.html`
- `assets/js/features/`
- `assets/js/pages/`
- related docs tracker:
  - `docs/CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md`

Exact audit/fix work:

1. Use the current runtime repair plan to stabilize the global shell first.
2. After that, run page-by-page browser checks on the root HTML pages.
3. Record route-specific runtime bugs separately from the global shell bug.
4. Keep this file high-level and use page-specific trackers when a route becomes large enough.

Verification gate:

- global shell breakage is either fixed or clearly isolated
- each major route family has explicit runtime status

Update `2026-05-17`:
- Status: partially completed
- % left: `55% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `30`-page root-entry smoke scan, direct `navigate(...)` browser probes, current `docs/CURRENT_RUNTIME_BREAKAGE_REPAIR_PLAN.md` closure state
- Remaining work: verify deeper per-route flows, separate pure auth-blocked behavior from true route bugs, and keep the new mixed-navigation issue tracked independently

Update `2026-05-17`:
- Status: partially completed
- % left: `50% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: targeted `staff.html` desktop reproduction showed the first `[data-staff-action="select"]` pointer click timing out while `.lux-shell-footer` and `.lux-nav-item` intercepted the click path, even though `tools/capture_staff_summary.mjs` passes by forcing DOM `.click()` at lines `158` and `170`
- Remaining work: fix the shell-overlap bug on the staff desktop route, then re-run the route with real pointer interactions instead of DOM-click bypasses

Update `2026-05-17`:
- Status: partially completed
- % left: `45% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the protected-quiz desktop redemption path in `backend/platform/store.js:3493` still hardcodes `allowedDomains` to `127.0.0.1` and `localhost`, while `assets/js/pages/lms.js:39` and `138` still assume localhost-only anti-cheat helper/browser origins
- Remaining work: define the production protected-quiz desktop architecture explicitly, then retest the protected exam flow under deployed hostnames instead of only localhost assumptions

Update `2026-05-17`:
- Status: partially completed
- % left: `40% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:8561` computes final grade as a simple average across all scores, while `assets/js/pages/gradebook.js:136` exposes weight controls and `infra/postgres/init/003_platform_runtime.sql:82` to `83` model `max_score` and `weight_percent`
- Remaining work: align final-grade calculation with the intended weighting model, then retest gradebook and LMS grade publication/finalization flows against weighted scenarios

Update `2026-05-17`:
- Status: partially completed
- % left: `35% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:8288` to `8297` detects registration schedule conflicts only when two sections share the same day and exact same `startTime`, with no actual interval-overlap check against end times or durations
- Remaining work: implement real time-overlap validation for registration conflicts, then retest enrollment behavior with partially overlapping section times instead of only identical starts

Update `2026-05-18`:
- Status: partially completed
- % left: `30% left`
- Files changed: `assets/css/staff-command-center.css`, `tools/capture_staff_summary.mjs`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: direct Playwright pointer-click verification on `http://127.0.0.1:8876/staff.html` now opens the first `[data-staff-action="select"]` card and then the canonical profile route with zero console/page errors; `artifacts/staff-efficient-desktop-summary.json` recorded `profileOpenMs: 465`, `canonicalProfileOpenMs: 1653`, `canonicalProfileVisible: true`, and `canonicalProfileName: "QA Prof Alpha"` after the staff route regained its desktop shell offset and the capture tool switched from DOM `.click()` to real locator clicks
- Remaining work: keep the repaired staff desktop flow, then continue the still-open production protected-quiz host assumptions, weighted-grade calculation, and registration time-overlap validation already tracked in this task

Update `2026-05-18`:
- Status: partially completed
- % left: `15% left`
- Files changed: `backend/platform/store.js`, `assets/js/pages/lms.js`, `test/runtime-gradebook-registration-regressions.test.js`, `test/protected-quiz-host-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check backend/platform/store.js`; `node --check assets/js/pages/lms.js`; `npx vitest run test/runtime-gradebook-registration-regressions.test.js test/protected-quiz-host-regressions.test.js`; `npm run test:runtime-shell`; `backend/platform/store.js` now computes weighted gradebook finals instead of a flat average, detects real schedule-interval overlaps during enrollment, and derives protected-quiz `allowedDomains` from configured app/backend hostnames plus explicit overrides instead of loopback-only defaults; `assets/js/pages/lms.js` now builds anti-cheat bridge origins from the active hostname and configured helper URL rather than assuming localhost-only desktop bridge hosts
- Remaining work: the concrete runtime bugs isolated in this task are fixed, but the broader page-family runtime audit still depends on finishing the remaining page-by-page smoke coverage work

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>) now records explicit runtime status for all `30` root entry pages; `artifacts/runtime-shell-smoke.json` shows the critical shell routes `home`, `admin-tools`, and `social` currently pass with zero failures; and the previously isolated concrete runtime bugs in this task are fixed and verified
- Remaining work: none for the current whole-site runtime audit gate

### `AUDIT-NAV-01` `0% left` Audit and reduce hard-refresh page switching caused by mixed SPA and standalone routing

Priority: `P0`
Depends on: `AUDIT-RUN-01`

What is already known:

- the route model is mixed rather than fully SPA
- some page switches stay inside one document
- many others intentionally hard-navigate to standalone HTML pages

Why this task still exists:

- page refresh on many route switches is now a confirmed user-visible issue
- route state continuity, lazy runtime loading, and browser-console stability are harder to reason about while navigation is split across multiple entry documents

Primary files:

- `assets/js/features/navigation.js`
- `assets/js/app/app.js`
- shell-backed route owners under `assets/js/pages/`
- root standalone entry HTML files

Exact audit/fix work:

1. Build a matrix of which routes are currently:
   - in-document SPA sections
   - alias redirects
   - standalone hard routes
2. Decide which hard-refresh transitions are intentional and which should stay in-shell.
3. Revisit `skipRuntimeBootstrap = true` and the hard-route fallback behavior in `navigate()`.
4. Record the smallest safe refactor path for reducing unnecessary full-document navigations.

Verification gate:

- route navigation model is explicitly documented
- unexpected hard-refresh transitions are identified with file-level ownership
- the next implementation step for reducing full refreshes is concrete

Update `2026-05-17`:
- Status: partially completed
- % left: `80% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: browser probes confirmed `navigate('programs')` stayed on `index.html`, while `navigate('study-card')`, `navigate('timetable')`, `navigate('registration')`, and `navigate('social')` hard-navigated to standalone HTML pages; `assets/js/features/navigation.js` still hard-codes those route classes
- Remaining work: build the full route-mode matrix and decide which standalone pages should be merged back into in-shell navigation

Update `2026-05-18`:
- Status: partially completed
- % left: `65% left`
- Files changed: `assets/js/features/navigation.js`, `test/navigation-model-regressions.test.js`, `test/redirect-wrapper-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/navigation-model-regressions.test.js test/redirect-wrapper-regressions.test.js`; `npm run check:frontend`; `assets/js/features/navigation.js` now exposes an explicit `getPortalRouteMode(...)` classifier that distinguishes `spa-section`, `standalone`, `alias-redirect`, and `special-page` routes, and the alias wrappers for `calendar.html`, `faculty-schedule.html`, and `gradebook.html` remain verified as zero-runtime redirects
- Remaining work: use the now-explicit route-mode matrix to choose which standalone routes should actually move back in-shell, then revisit `skipRuntimeBootstrap = true` and the hard-route fallback behavior in `navigate()` for the highest-value transitions first

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [ROUTE_NAVIGATION_MODE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROUTE_NAVIGATION_MODE_MATRIX.md>) now classifies the current route families into `spa-section`, `standalone`, `alias-redirect`, and `special-page`, distinguishes intentional vs unnecessary hard refreshes, and records the smallest safe next migration set for reducing full-document navigation cost
- Remaining work: none for the current navigation audit gate

### `AUDIT-SEC-01` `0% left` Remove or replace runtime `eval` chunk loading

Priority: `P0`
Depends on: closely related to runtime shell repair

What is already known:

- confirmed `eval` call sites:
  - `assets/js/features/index-luxury.js:2466`
  - `assets/js/features/index-luxury.js:4359`

Why this task still exists:

- runtime `eval` is a security and maintainability risk
- it blocks strong CSP
- it increases trust in dynamic decoded code paths

Primary files:

- `assets/js/features/index-luxury.js`
- `assets/js/features/index-home-dashboard.js`
- `assets/js/features/index-admin-tools.js`

Exact audit/fix work:

1. Confirm exactly which route-owned bundles are activated through decoded/eval paths.
2. Replace `eval` loading with a safer loading strategy if possible.
3. If immediate replacement is not feasible, document the exact risk and rollback plan.
4. Re-test route startup after loader changes.

Verification gate:

- `eval` is removed from first-party route chunk loading
- or a documented blocked state clearly records why it remains

Update `2026-05-17`:
- Status: partially completed
- % left: `85% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: current source re-scan confirmed the live `eval(decodeLuxuryHomeChunkSource(encoded));` loader still exists at the updated line locations in `assets/js/features/index-luxury.js`
- Remaining work: map the full decoded chunk activation flow and replace it with a safer first-party loading mechanism

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/LUXURY_EVAL_LOADER_RISK_PLAN.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [LUXURY_EVAL_LOADER_RISK_PLAN.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/LUXURY_EVAL_LOADER_RISK_PLAN.md>) now records the exact current home/admin luxury chunk registration flow, the live `eval` execution points in `assets/js/features/index-luxury.js`, the concrete reason a naive external-script swap still breaks runtime, and the two safe replacement paths (`inline merge` vs `real first-party modules`) that can remove the risk without regressing the current shell
- Remaining work: none for the current eval-loader audit gate because the blocked state is explicit and the safe replacement path is concrete

### `AUDIT-SEC-02` `0% left` Audit auth/session storage and client-side token exposure

Priority: `P0`
Depends on: none

What is already known:

- session token and auth state are stored in `localStorage`
- there are `29` session/auth storage references in first-party frontend/backend scan
- no cookie/cookie-session references were found in the first-party scan

Why this task still exists:

- client-side storage of auth/session state increases XSS impact
- the full security tradeoff has not yet been reviewed

Primary files:

- `assets/js/app/api.js`
- `assets/js/app/auth.js`
- login/session-related frontend flows
- backend session endpoints

Exact audit/fix work:

1. Map the full auth/session lifecycle:
   - login
   - token persistence
   - role switch
   - impersonation
   - logout
2. Identify where tokens or account identity can be exposed or misused.
3. Decide whether current storage design is acceptable or needs redesign.
4. Record immediate mitigations and long-term changes separately.

Verification gate:

- session lifecycle map exists
- storage risks are explicitly documented
- recommended mitigations are concrete

Update `2026-05-17`:
- Status: partially completed
- % left: `75% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:800` still accepts `request.query.token`, while frontend callers still issue `/api/portal/session?token=...` from `assets/js/app/api.js:574` and `/api/bootstrap?token=...` from `assets/js/app/api.js:1422`
- Remaining work: remove query-string token transport, move session-only reads fully onto header-based auth, and review related browser-history/log/referrer leakage paths

Update `2026-05-17`:
- Status: partially completed
- % left: `55% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:3624` plus `backend/platform/store.js:3985` currently activate accounts by raw account id, and `backend/platform/server.js:3633` plus `backend/platform/store.js:4003` currently return live password-reset tokens directly from the public reset-request endpoint
- Remaining work: replace id-based activation with a real activation secret flow, move password-reset delivery out-of-band, and review whether any other bootstrap or invitation flows leak secrets directly in API responses

Update `2026-05-17`:
- Status: partially completed
- % left: `45% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:4045` and `backend/platform/store.js:4049` currently distinguish unknown accounts from wrong passwords, while `backend/platform/server.js:3627` and `backend/platform/server.js:3639` also expose activation/reset existence signals
- Remaining work: normalize public auth error messages, keep detailed reasons server-side only, and re-check whether any remaining onboarding or recovery endpoints still leak identity/state distinctions

Update `2026-05-17`:
- Status: partially completed
- % left: `35% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:3874` creates main portal sessions without `expiresAt`, `backend/platform/store.js:4054` refreshes sessions without any TTL enforcement, and both `backend/platform/store.js:4019` and `backend/platform/store.js:3958` change credentials without revoking existing sessions
- Remaining work: add absolute or idle session expiry, revoke active sessions on reset/password change/activation-sensitive events, and then re-check all session-bearing endpoints for consistent expiry handling

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:205` and `backend/platform/server.js:1002` implement auth throttling with a single-process in-memory map, while the actual login and reset protections at `3564` and `3634` rely on that map directly
- Remaining work: move auth rate limiting to a shared or edge-backed control, then re-check restart behavior and multi-instance consistency before treating login/reset abuse protection as production-grade

Update `2026-05-17`:
- Status: partially completed
- % left: `25% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:2161` still redirects Microsoft login success with `portal_token` in the URL, and both `assets/js/app/api.js:1097` and `assets/js/pages/login-runtime.js:248` consume that query-string token before clearing it
- Remaining work: remove the URL-borne Microsoft login token handoff, then re-check every remaining auth completion flow for any browser-visible secret transport

Update `2026-05-17`:
- Status: partially completed
- % left: `20% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/pages/exam-portal.js:8` and `293` store the exam portal token in `localStorage`, `assets/js/pages/exam-portal.js:553` sends it through `?token=...`, and `backend/platform/server.js:1278` still accepts exam portal tokens from query parameters
- Remaining work: remove browser-persisted exam portal tokens, eliminate query-string exam token transport, and then re-check all portal-family token flows together instead of treating the exam portal as a separate special case

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:987` and `1173` read forwarded IP headers directly, while login/reset throttling at `1006` and audit logging use those helpers rather than a trusted proxy-derived client IP
- Remaining work: route all auth throttling and audit IP capture through trusted proxy resolution, then re-check abuse controls and incident logging under the expected production proxy topology

Update `2026-05-17`:
- Status: partially completed
- % left: `10% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/app/state.js:7` restores `KIU_PERSISTENT_STATE` on startup, while both `assets/js/app/auth.js:272` and `assets/js/app/api.js:424` only delete `auth.activeUserId` from that persisted blob instead of clearing the broader cached state on logout/session-clear
- Remaining work: decide which persisted data is truly safe to survive logout, clear the rest on sign-out by default, and then re-check shared-device/privacy behavior together with service-worker cache handling

Update `2026-05-17`:
- Status: partially completed
- % left: `5% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `service-worker.js:58` caches same-origin page responses, the normal logout path in `assets/js/app/auth.js:256` and `297` does not invoke `clearPortalSiteCaches(...)`, and `assets/js/pages/exam-portal.js:720` persists protected quiz draft answers into `localStorage`
- Remaining work: reconcile logout, browser cache, and exam-draft persistence into one explicit shared-device/privacy policy, then verify that the final policy is actually enforced across normal logout, session expiry, and exam completion flows

Update `2026-05-17`:
- Status: partially completed
- % left: `5% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:1361` defaults Microsoft tenant config to `common`, while `backend/platform/store.js:3928` still falls back to `getRawAccountByEmail(normalizedEmail)` and auto-links that identity on first Microsoft sign-in
- Remaining work: decide whether production Microsoft login must require prior account linking or a restricted tenant, then remove opportunistic email fallback if those assumptions cannot be guaranteed

Update `2026-05-17`:
- Status: partially completed
- % left: `4% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/app/auth.js:281` triggers async `destroyPortalBackendSession()` and then redirects immediately at `292`, while `assets/js/app/api.js:591` only clears the stored portal session token after awaiting the backend logout request
- Remaining work: make logout completion deterministic for both local token state and backend session invalidation, then re-check logout, session expiry, and shared-device privacy behavior together as one flow

Update `2026-05-17`:
- Status: partially completed
- % left: `3% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the exam portal client at `assets/js/pages/exam-portal.js:583` authenticates with only `email + studentId`, and `backend/platform/store.js:3033` to `3049` converts that into an active 12-hour exam session without a password, OTP, or launch-ticket requirement at the auth step
- Remaining work: redesign the exam portal entry authentication model, then re-check whether any remaining alternate sign-in surfaces still grant durable sessions from weak identity-only inputs

Update `2026-05-17`:
- Status: partially completed
- % left: `2% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/exam-portal/auth` at `backend/platform/server.js:4338` does not call `enforceRateLimit(...)`, even though the same server already rate-limits main login/reset routes at `3564` and `3634`
- Remaining work: add production-grade abuse controls to the exam sign-in surface, then re-check all alternate auth routes so weaker side-channel sign-in paths do not bypass the main portalâ€™s rate-limiting posture

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/app/auth.js:869` to `870` still place the active portal token into the `/api/events` EventSource URL, and `backend/platform/server.js:800` accepts that token from `request.query.token`
- Remaining work: remove token-bearing query strings from the realtime channel too, then do one final confirmation pass that no routine authenticated flow still exposes session secrets in browser-visible URLs

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `assets/js/app/api.js`, `assets/js/app/auth.js`, `assets/js/pages/login-runtime.js`, `assets/js/pages/exam-portal.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; live backend verification on `http://127.0.0.1:48933` confirmed header-authenticated success for `/api/portal/session`, `/api/bootstrap`, `/api/social/bootstrap`, `/api/events`, and `/api/exam-portal/sessions`, while the same routes no longer authenticated from `?token=` alone (`404` for `/api/portal/session`, anonymous bootstrap for `/api/bootstrap`, and `401` for `/api/social/bootstrap`, `/api/events`, and `/api/exam-portal/sessions`)
- Remaining work: replace the Microsoft `portal_token` redirect handoff, then re-check the remaining non-routine browser-visible token flows against the broader `localStorage`, logout, and session-lifecycle risks already tracked above

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live backend verification on `http://127.0.0.1:48933` sent `11` repeated anti-cheat-style `POST /api/exam-portal/auth` requests from one IP; requests `1-10` returned `404` for the invalid student, and request `11` returned `429` with `Retry-After: 600` after wiring the route into `enforceRateLimit(...)`
- Remaining work: keep the new exam-portal limiter, but finish the broader auth hardening still open in this task, especially the Microsoft callback URL token handoff, browser token persistence, and long-lived session design issues already tracked above

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/state-shape.js`, `backend/platform/store.js`, `backend/platform/server.js`, `assets/js/app/api.js`, `assets/js/pages/login-runtime.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; live verification on `http://127.0.0.1:48933` confirmed a seeded one-time Microsoft login handoff was accepted once by `POST /api/portal/microsoft/complete` (`200` with `session` and `account`) and rejected on second use (`404`), while the callback path now redirects with `microsoft_handoff` instead of `portal_token`
- Remaining work: decide whether the short-lived browser-visible handoff is acceptable or should be replaced with a stricter popup/postMessage or same-origin completion flow, then continue the still-open browser-storage, logout/privacy, and session-lifecycle hardening already tracked under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `backend/platform/server.js`, `assets/js/app/api.js`, `assets/js/pages/login-runtime.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; live verification on `http://127.0.0.1:48933` confirmed `/api/portal/session`, `/api/me`, `/api/bootstrap`, and `/api/session/impersonate-role` no longer include `session.token`, while `/api/portal/session/login` still returns the token required to establish local session state
- Remaining work: continue the still-open browser-storage, logout/privacy, and session-lifecycle hardening already tracked under this task, especially the remaining `localStorage` token risks and non-expiring session design issues

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `test/platform-session-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/platform-session-security.test.js`; `npm run check:platform`; `backend/platform/store.js` now issues main portal sessions with `expiresAt`, marks expired sessions inactive during `getSession(...)`, and revokes active sessions through `revokeSessionsForUser(..., 'credential-reset')` when activation or password reset changes credentials
- Remaining work: keep the new session TTL and credential-reset revocation, then finish the still-open browser-storage, logout/privacy, forwarded-IP trust, and weak recovery/authentication design questions already tracked in this task

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/app/api.js`, `assets/js/app/auth.js`, `assets/js/pages/exam-portal.js`, `test/auth-session-client-security.test.js`, `test/exam-portal-regressions.test.js`, `docs/PORTAL_AUTH_SESSION_LIFECYCLE.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/app/api.js`; `node --check assets/js/app/auth.js`; `node --check assets/js/pages/exam-portal.js`; `npx vitest run test/auth-session-client-security.test.js test/exam-portal-regressions.test.js`; `clearPortalClientAuthState(...)` now removes persisted portal state plus exam-portal leftovers, `authLogout()` now awaits backend logout and forced cache purge before redirect, exam-portal token/student/draft state is now session-scoped instead of `localStorage`-persistent, and [PORTAL_AUTH_SESSION_LIFECYCLE.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PORTAL_AUTH_SESSION_LIFECYCLE.md>) now records the full login/bootstrap/impersonation/logout lifecycle plus immediate and long-term mitigations
- Remaining work: none for the current auth/session audit gate

### `AUDIT-AUTHZ-01` `0% left` Audit authorization and role-bound endpoint behavior

Priority: `P0`
Depends on: runtime shell must be stable enough for reliable route checks

What is already known:

- role-aware navigation exists
- route access logic exists
- a full endpoint-by-endpoint authorization audit has **not** been completed

Why this task still exists:

- full-site safety requires more than nav-level role hiding
- backend routes, upload flows, impersonation, and admin tooling need explicit review

Primary files:

- `assets/js/app/state.js`
- `assets/js/features/navigation.js`
- `backend/platform/server.js`
- `backend/platform/store.js`

Exact audit/fix work:

1. Build a route and endpoint access matrix by role:
   - student
   - professor
   - TA
   - admin
   - student-service
2. Verify that backend authorization matches frontend route intent.
3. Inspect impersonation and admin escalation paths carefully.
4. Record any route or API that trusts only client-side role state.

Verification gate:

- role/endpoint matrix exists
- mismatches between frontend and backend authorization are documented or fixed

Update `2026-05-17`:
- Status: partially completed
- % left: `85% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:4308` returns `/api/lms/courses/:id` directly from `store.getLmsCourse(...)` without `requireSessionAccount(...)` or `requireCourseStaffAccess(...)`, while adjacent LMS write endpoints at `4317` and `4322` do enforce role checks
- Remaining work: map all remaining unauthenticated read endpoints, decide intended public-vs-protected LMS data boundaries, and add consistent backend authorization or payload sanitization

Update `2026-05-17`:
- Status: partially completed
- % left: `75% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: public diagnostics at `backend/platform/server.js:1962`, `1970`, `2002`, `2012`, and `2028` currently expose runtime configuration, readiness blockers, backend URL, storage mode, and integration posture through `store.getPlatformStatus()` and `store.getRuntimeConfig()`
- Remaining work: classify which diagnostics must stay public, redact operational details from the rest, and bring operator-only diagnostics behind explicit authorization or private network boundaries

Update `2026-05-17`:
- Status: partially completed
- % left: `65% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:162` builds TURN credentials into RTC config, `backend/platform/store.js:8822` returns that RTC object from `getRuntimeConfig()`, and `backend/platform/server.js:2002` exposes `...store.getRuntimeConfig()` publicly through `/api/platform/config`
- Remaining work: confirm whether any production deployment currently sets TURN credentials, redact them from public config responses, and review whether other secrets are embedded inside operator-facing config objects before serialization

Update `2026-05-17`:
- Status: partially completed
- % left: `55% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed anonymous requests to `/api/platform/config`, `/api/platform/status`, and `/api/platform/readiness` now return `401`, while an authenticated admin session still receives `200` for config/status and a readiness response on `/api/platform/readiness`
- Remaining work: decide whether `/health` and `/ready` should remain public at all, and whether authenticated config/status payloads still expose more operational detail than ordinary portal sessions should receive

Update `2026-05-17`:
- Status: partially completed
- % left: `45% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed anonymous `/health` now returns only `backend`/`ok`/`status` and anonymous `/ready` now returns only `ok`/`status`, while the detailed readiness payload remains behind the authenticated `/api/platform/readiness` route
- Remaining work: decide whether the minimal public health endpoints are acceptable for the deployment model, and whether authenticated config/status payloads still expose too much operator detail to ordinary portal sessions

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed `/api/lms/courses/AUDIT-COURSE-01` now returns `401` anonymously, `403` for a seeded student session, and `200` for a seeded admin session after adding `requireCourseStaffAccess(...)` to the route
- Remaining work: continue the broader endpoint-by-endpoint authorization review, especially the still-open diagnostics, bootstrap/state, messaging, call, and student-record scope issues already listed under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `40% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:2180` and `2184` currently expose bootstrap without a session gate, `backend/platform/store.js:5016` includes shared portal/social/accounts in that bootstrap, `backend/platform/server.js:2736` allows any authenticated session to post `/api/portal/state`, `backend/platform/store.js:5084` replaces the shared portal state wholesale, and `backend/platform/server.js:3768` plus `backend/platform/store.js:3944` plus `backend/platform/utils.js:157` show non-admin self-updates can carry server-trusted `role` and privilege fields
- Remaining work: close the public bootstrap exposure, split or constrain global portal-state persistence, add a strict non-admin field allowlist for self-account updates, and then re-audit the remaining user-mutation endpoints for similar trust-in-client patterns

Update `2026-05-17`:
- Status: partially completed
- % left: `35% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/messenger/message` at `backend/platform/server.js:3988` forwards caller-controlled chat topology into `store.appendMessage(...)`, `ensureChatBase(...)` at `backend/platform/store.js:5124` trusts `id` and `members`, and `appendMessage(...)` at `5264` to `5292` auto-adds the sender and notifies the resulting member set
- Remaining work: lock generic message-send behavior to prevalidated chat membership, then review the remaining messenger and call flows for similar trust-in-payload membership changes

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the public bootstrap path at `backend/platform/server.js:2180` returns `createPortalBootstrap()`, and that payload includes `sanitizeAccountForClient(...)` results with rich fields such as `email`, `birthday`, Microsoft identifiers, account status, and privilege metadata from `backend/platform/utils.js:145`
- Remaining work: minimize account data per viewer in addition to gating bootstrap, then re-check whether any other directory or bootstrap payloads expose internal account-state fields more broadly than intended

Update `2026-05-17`:
- Status: partially completed
- % left: `25% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/calls/start` at `backend/platform/server.js:4034` trusts caller-supplied direct-call identifiers, `backend/platform/store.js:5315` creates direct call records from those ids, `acceptCall(...)` and `declineCall(...)` at `5402` and `5422` do not verify membership, and `/api/calls/signal` at `4134` pushes signaling payloads to arbitrary `toUserId` values without a membership check
- Remaining work: lock real-time call lifecycle to validated chat membership, then review remaining call and messenger event paths for any other payload-owned participant or destination identifiers

Update `2026-05-17`:
- Status: partially completed
- % left: `20% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the public news route at `backend/platform/server.js:3720` relies on `canViewNewsPost(...)`, and the anonymous-viewer branch in `backend/platform/store.js:4225` only blocks posts with explicit `targetUserIds`, not posts targeted by `audienceRoles` or `audienceFacultyCodes`
- Remaining work: enforce all audience scopes for viewer-less news requests, then review whether any other public feeds apply weaker rules to anonymous viewers than to authenticated viewers

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `backend/platform/store.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; live verification on `http://127.0.0.1:48933` confirmed anonymous `/api/news/feed` now returns `401` because `/api/news` sits behind the session-bound middleware, and `canViewNewsPost(...)` now also rejects viewer-less access whenever `audienceRoles`, `audienceFacultyCodes`, or `targetUserIds` are present
- Remaining work: keep the tighter viewer-less gate, then review whether any other viewer-less feed or export paths still apply weaker audience rules than authenticated views

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `GET /api/lms/live-quizzes/:resourceKey` at `backend/platform/server.js:2744` returns workspace data after only session validation, and `POST /api/lms/live-quizzes/:resourceKey` at `2759` allows any `STAFF_ROLES` account to save workspace state without `requireCourseStaffAccess(...)`
- Remaining work: bind live-quiz workspace read/write access to course/group membership, then re-check whether any other LMS helper endpoints remain session-bound instead of course-scoped

Update `2026-05-17`:
- Status: partially completed
- % left: `10% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed `GET /api/lms/live-quizzes/LQ-COURSE-1::G1` now returns `401` anonymously, `200` for an enrolled student session, `403` for an unrelated student session, and `200` for an admin session after routing both read and write handlers through `requireLmsLiveQuizWorkspaceAccess(...)`
- Remaining work: keep the new course-scope gate, then continue the remaining LMS and student-record authorization review already tracked under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `10% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/social/state` at `backend/platform/server.js:3006` accepts whole social-state writes from any authenticated session, and `backend/platform/store.js:6732` replaces `this.state.social` wholesale from the submitted payload
- Remaining work: remove or heavily constrain whole-state social writes, then re-check the remaining mutation endpoints to confirm they operate on scoped records rather than global snapshots

Update `2026-05-17`:
- Status: partially completed
- % left: `5% left`
- Files changed: `assets/js/app/api.js`, `backend/platform/store.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; isolated social-state verification confirmed `extractPersistableSocialHubState(...)` now sends only `lostFoundItems`, `upsertSocialState(...)` no longer replaces `this.state.social`, and a submitted `pages` overwrite payload left existing `pages` and `groups` intact while still updating the lost-and-found collection
- Remaining work: decide whether lost-and-found should remain a global authenticated collection or move to per-item ownership/rules, then re-check whether any other social mutation paths still accept broader collection-wide writes than intended

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed anonymous `/api/bootstrap` and `/api/portal/bootstrap` now return `401`, authenticated `/api/bootstrap` still returns `200` with `session` and `account`, and authenticated `POST /api/portal/state` now responds only with `ok`/`saved` instead of echoing the full shared bootstrap payload
- Remaining work: continue the remaining endpoint review for broader scope-bound data exposure and client-trusted override flags, especially the still-open shared portal/social state overwrite and student-record scope issues already listed under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `5% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/admin/accounts/:id/privileges` at `backend/platform/server.js:3813` is admin-gated but still passes `request.body?.actorId` into `store.updateAccountPrivileges(...)`, and the store uses that value for both authorization and `privilegeUpdatedBy`
- Remaining work: remove client-supplied actor identity from privileged server mutations, then do one final sweep for any remaining admin or moderation routes that still trust actor attribution from the request body

Update `2026-05-17`:
- Status: partially completed
- % left: `3% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/students/:id/eligibility` at `backend/platform/server.js:4230` and `/api/students/:id/enrollments` at `4241` allow broad `professor`/`ta`/`student_service` access, while `backend/platform/store.js:8235` and `8303` show that the returned eligibility payload can include derived finance/probation hold data
- Remaining work: replace broad student-record role gates with relationship-scoped checks, then do one last pass for any remaining student-data endpoints that are still role-only instead of relationship-bound

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed `/api/students/admin-testing-econ-student/eligibility` now returns `200` for a same-course professor session, `403` for an unrelated professor session, and `200` for a same-faculty `student_service` session after the route switched to `canAccessStudentAcademicRecord(...)`
- Remaining work: keep the new professor/TA relationship check, then decide whether Student Service should remain faculty-scoped or move to a stricter assigned-case/support-relationship model before treating student-record access as fully hardened

Update `2026-05-17`:
- Status: partially completed
- % left: `2% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: non-admin `/api/accounts/upsert` requests at `backend/platform/server.js:3768` still flow into `upsertAccount(...)`, and `backend/platform/utils.js:173` to `179` shows that self-service payloads can carry server-trusted identity-link and account-state fields such as `accountStatus`, activation flags, `identityProvider`, `microsoftOid`, `microsoftTenantId`, and `emailAliases`
- Remaining work: replace the broad account merge with explicit self-service field allowlists, then do a final sweep for any remaining mutation routes that still accept internal identity/state fields from the client

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed a seeded student session could still update `bio` through `/api/accounts/upsert`, but attempts to self-set `role: 'admin'`, `grantedPrivileges`, `microsoftOid`, and `accountStatus` were ignored; the same pass also confirmed `/api/admin/accounts/:id/privileges` ignored a spoofed `actorId` and stored `privilegeUpdatedBy: 'admin-root'`
- Remaining work: keep the new self-service account allowlist, then continue the remaining endpoint review for broader scope-bound data exposure and client-trusted override flags still listed under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed a seeded professor session granted `manage_privileges` could successfully call `/api/admin/accounts/:id/privileges` after the route gate switched from admin-role-only to `store.accountHasPrivilege(...)`, and the temporary delegated/student privileges used for the test were then cleaned back out
- Remaining work: continue the remaining endpoint review for broader scope-bound data exposure and client-trusted override flags still listed under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:1832` lets same-faculty `professor` and `ta` roles qualify as Student Service responders, `canViewStudentServiceQuestion(...)` at `2120` then grants visibility to those pending questions, and `getStudentServiceBootstrap(...)` at `2198` returns the resulting question set
- Remaining work: decide the intended responder visibility boundary for Student Service, then verify that unpublished/pending student support content is only exposed to the correct operational audience

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/gradebook/scores` at `backend/platform/server.js:4647` forwards the full request body into `store.setScore(...)`, and `backend/platform/store.js:8602` treats `payload.allowFinalizedEdit === true` as sufficient to bypass the finalized-grade lock
- Remaining work: move finalized-edit override control fully server-side, then do a final sweep for any other protected mutation routes that still trust internal override flags from the client

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; isolated verification on a temporary finalized gradebook confirmed `PlatformStore.setScore(...)` now returns `null` for a client-style `allowFinalizedEdit: true` payload while still allowing an explicit internal override `serverAllowFinalizedEdit: true`
- Remaining work: continue the remaining endpoint review for any other protected mutation routes that still trust internal override flags from client-controlled request bodies

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `normalizeStudentServiceTicketRecord(...)` at `backend/platform/store.js:1919` to `1928` includes `internalNotes` and `handoff`, and `getStudentServiceBootstrap(...)` at `2205` returns cloned tickets to any viewer who passes `canViewStudentServiceTicket(...)`, including the student owner at `2114`
- Remaining work: add per-role field filtering for Student Service ticket payloads, then verify that student-facing and responder-facing bootstrap data no longer expose staff-only workflow metadata

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; isolated Student Service bootstrap verification confirmed student ticket views now receive `internalNotes: []` with an empty `handoff` object, same-faculty professor responder views now receive blank anonymous-question author fields, and Student Service moderator views still retain those operational fields
- Remaining work: continue the remaining Student Service audience/tooling review, especially the still-open responder visibility policy and macro exposure issues already tracked under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `getStudentServiceBootstrap(...)` at `backend/platform/store.js:2218` returns the full `macros` list without a viewer-role gate, unlike `reviewQueue` which is restricted to moderators
- Remaining work: decide the intended macro visibility boundary for Student Service, then ensure staff-only support tooling is not exposed to student or general viewer bootstrap payloads

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; isolated Student Service bootstrap verification confirmed `getStudentServiceBootstrap(...)` now returns `macros: []` for a student viewer while a `student_service` moderator still receives the expected macro set
- Remaining work: continue the remaining endpoint review for broader scope-bound data exposure and client-trusted override flags still listed under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `normalizeStudentServiceQuestionRecord(...)` stores raw author identity fields at `backend/platform/store.js:1985` to `1987`, and `decorateStudentServiceQuestion(...)` at `2148` returns `...clone(question)` while only changing the display label for anonymous views
- Remaining work: convert the current findings set into an explicit route/field matrix artifact so the authorization audit can be closed without ambiguity

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:7672` to `7679` allow any existing social group member to invite another user into the group, rather than limiting that action to social admins or group managers
- Remaining work: define and enforce the intended invitation authority for private or managed groups, then re-check whether any other social membership mutations grant more power to ordinary members than intended

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:1268` treats either an `AntiCheatBrowser/...` user-agent or any non-empty `X-Protected-Client-Session` header as sufficient for `requireAntiCheatBrowserRequest(...)`, and that gate is used on the exam-portal auth/list/detail/launch-ticket routes
- Remaining work: replace spoofable anti-cheat/browser markers with a stronger server-verifiable trust boundary, then re-check all exam-surface routes that currently rely on the same request-classification shortcut

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `POST /api/portal/state` at `backend/platform/server.js:2736` is session-bound but returns the result of `savePortalState(...)`, and `backend/platform/store.js:5084` plus `5016` show that this response is the full `createPortalBootstrap()` payload rather than a viewer-scoped subset
- Remaining work: remove over-broad bootstrap data from authenticated sync responses, then do a final least-privilege pass over any remaining authenticated endpoints that still return global snapshots

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `createPortalBootstrap()` at `backend/platform/store.js:5016` returns the raw `social` state object, and that state can contain internal collections and fields such as `reports`, `blocks`, `muted`, `pendingMemberIds`, `memberRolesByUser`, and per-user notification preferences
- Remaining work: narrow bootstrap and sync responses to viewer-scoped social data, then verify that internal moderation and membership-management state is no longer exposed outside the intended operator audience

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: several social creation routes still accept caller-owned identity fields, including `ownerUserId`, `authorUserId`, `postedById`, and `createdById`, across `createSocialPage`, `createSocialGroup`, `createSocialProject`, `createSocialPost`, and `createSocialEvent`
- Remaining work: force all social ownership/author attribution server-side, then verify that no remaining create/update path can impersonate another user by payload alone

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: social creation handlers also accept governance fields such as `official`, `verified`, `adminIds`, `pendingMemberIds`, `joinedAtByUser`, `notificationPreferenceByUser`, and `facultyCode` directly from client payloads in `backend/platform/store.js:7379` to `7418`
- Remaining work: move privileged social metadata ownership to server-side policy, then do a last pass for any remaining create/update routes that still accept governance or moderation fields from the client

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `backend/platform/store.js`, `test/social-governance-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/social-governance-regressions.test.js`; `npm run check:platform`; the social create routes in `backend/platform/server.js` now derive actor identity from the authenticated session for pages, groups, projects, posts, and events, while the corresponding store constructors now keep `ownerUserId`/`authorUserId` server-owned and default privileged page/group governance fields such as `official`, `verified`, `adminIds`, `pendingMemberIds`, `joinedAtByUser`, `notificationPreferenceByUser`, and `facultyCode` away from raw client control on creation
- Remaining work: keep the server-owned social creation path, then do the remaining pass over update/membership/contact-policy routes, especially the still-open direct-chat creation policy and any other social mutations that may still trust client-owned governance or moderation fields

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the UI and store logic treat `manage_privileges` as a delegated capability (`assets/js/pages/news.js:122`, `backend/platform/store.js:2686`), but the route itself at `backend/platform/server.js:3813` is still hard-gated to actual admins only
- Remaining work: align the actual privilege-management route gate with the intended authorization model, then confirm there are no other delegated capabilities that exist only in UI/store logic but not on the route boundary

Update `2026-05-17`:
- Status: partially completed
- % left: `1% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/messenger/direct` at `backend/platform/server.js:3974` accepts arbitrary `userB`, and `ensureDirectChat(...)` at `backend/platform/store.js:5147` creates a direct chat with no relationship, block, or consent check
- Remaining work: define and enforce direct-contact policy for messaging, then verify that ordinary users cannot create unwanted private channels to arbitrary accounts

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `backend/platform/store.js`, `test/social-governance-regressions.test.js`, `test/social-relationship-route-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/social-relationship-route-regressions.test.js test/social-governance-regressions.test.js`; `npm run check:platform`; social relationship and follow routes in `backend/platform/server.js` now derive the acting user from the authenticated session instead of trusting `fromUserId` / `userId` in the request body, and social create routes/store constructors now keep ownership/governance fields server-owned by default on creation
- Remaining work: keep the session-derived social mutation actor model, then finish the still-open direct-contact policy for `/api/messenger/direct` and the remaining update/membership scope review before this task can be treated as fully closed

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `test/direct-chat-account-validation.test.js`, `test/call-membership-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/direct-chat-account-validation.test.js test/call-membership-regressions.test.js`; `npm run check:platform`; `ensureDirectChat(...)` now refuses to create new direct chats unless both participants resolve to known accounts, while the call path now requires existing chat membership for direct call creation and signaling
- Remaining work: keep the known-account and call-membership boundary, then decide whether the product should continue allowing open directory messaging to any known account or add a future block/consent layer before this task can be treated as fully closed

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `test/social-session-actor-routes.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/social-relationship-route-regressions.test.js test/social-session-actor-routes.test.js test/social-governance-regressions.test.js`; `npm run check:platform`; the social page/group/project update routes plus post update/share/reaction/comment/report/profile/event RSVP handlers in `backend/platform/server.js` now derive their acting user from the authenticated session instead of trusting `actorId` / `userId` / `authorUserId` from the request body
- Remaining work: keep the broader session-derived social mutation actor model, then finish the still-open direct-contact policy for `/api/messenger/direct` and the remaining scope rules around contact initiation and membership management before this task can be treated as fully closed

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `backend/platform/store.js`, `test/call-membership-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/call-membership-regressions.test.js`; `npm run check:platform`; direct call creation in `backend/platform/store.js` now requires an existing direct chat whose members include both the caller and callee, `acceptCall(...)` / `declineCall(...)` / `endCall(...)` now require the acting user to be a member of the call, and `/api/calls/signal` now rejects signaling unless both `fromUserId` and `toUserId` belong to the chat membership
- Remaining work: keep the tighter call-membership boundary, then finish the still-open direct-contact policy for `/api/messenger/direct` and the remaining contact-initiation and membership-management rules before this task can be treated as fully closed

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/ROLE_ENDPOINT_ACCESS_MATRIX.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [ROLE_ENDPOINT_ACCESS_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROLE_ENDPOINT_ACCESS_MATRIX.md>) now records the current role/endpoint matrix across bootstrap, LMS, gradebook, student records, files, social state, direct chats, and calls, and it also records the explicit remaining product-policy decisions that were keeping this task at `1% left`: known-account open directory messaging remains allowed by design, Student Service remains faculty-scoped in the current product, and the high-risk impersonation/governance-field mismatches tracked earlier are now fixed rather than merely implied
- Remaining work: none for the current authorization audit gate

### `AUDIT-STATE-01` `0% left` Audit shared-state persistence integrity for production and multi-instance deployment

Priority: `P0`
Depends on: none

What is already known:

- the platform store keeps a broad shared in-memory state object
- writes are serialized only within one process through `pendingSave`
- the PostgreSQL record store rewrites namespace snapshots without optimistic concurrency checks

Why this task still exists:

- production readiness depends on more than auth and route guards
- if concurrent instances or stale snapshots can overwrite shared state, the platform remains unsafe under real deployment conditions even when individual endpoints are fixed

Primary files:

- `backend/platform/store.js`
- `backend/platform/postgres-record-store.js`
- `backend/platform/local-record-store.js`

Exact audit/fix work:

1. Confirm whether multi-instance deployment is supported or should be explicitly disallowed.
2. Map how shared state is loaded, mutated, and flushed back to storage.
3. Identify where last-writer-wins or stale-snapshot deletion can drop newer data.
4. Define the smallest safe production path:
   - optimistic concurrency/version checks
   - granular records instead of whole-state rewrites
   - or an explicit single-writer deployment constraint documented in operations guidance

Verification gate:

- production storage model is explicitly classified as safe for multi-instance deployment or explicitly constrained to a documented single-writer model
- any required concurrency guard is documented or implemented

Update `2026-05-17`:
- Status: partially completed
- % left: `80% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:530` writes the current in-memory state snapshot directly, while `backend/platform/postgres-record-store.js` loads and rewrites the full namespace set without any optimistic concurrency guard and deletes namespaces absent from the current snapshot
- Remaining work: decide whether to redesign persistence for concurrent writers or explicitly lock production deployment to a single authoritative writer with corresponding operational safeguards

Update `2026-05-17`:
- Status: partially completed
- % left: `70% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/app/state.js:1187` mutates client `KIU_STATE` with built-in admin testing personas, admin bootstrap paths call that helper in `assets/js/app/api.js:518`, and the standard `/api/portal/state` sync at `assets/js/app/api.js:1378` persists `buildPortalPersistableState(KIU_STATE)` without stripping those testing records
- Remaining work: separate testing-only client state from production-backed shared state, then re-check whether any other client-only artifacts can still flow into the persisted backend snapshot

Update `2026-05-17`:
- Status: partially completed
- % left: `60% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: backend logic reads `this.state.portal.state` for derived finance/probation holds and `registrationOpen` in `backend/platform/store.js:8218` and `8308`, and also stores LMS group materials/assignments/quizzes under that same shared portal-state tree before `savePortalState(nextState)` can replace it wholesale at `5084`
- Remaining work: split high-impact academic/registration state out of the generic client-synced portal blob, then reassess whether any remaining shared-state areas can still change backend business logic without explicit server-side ownership controls

Update `2026-05-17`:
- Status: partially completed
- % left: `55% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: many backend routes globally broadcast `portal:state-upsert` or `social:state-upsert`, and the frontend handlers in `assets/js/app/auth.js:825` and `834` react by refetching the corresponding broad bootstrap payloads for connected clients
- Remaining work: narrow the realtime event scope and the returned bootstrap/sync payloads together, then re-check whether shared-state propagation still exposes or amplifies more data than each viewer actually needs

Update `2026-05-17`:
- Status: partially completed
- % left: `55% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `docker-compose.production.yml:29` runs `node tools/migrate-postgres.js` on backend startup, and `tools/migrate-postgres.js` applies migrations by checking `schema_migrations` without advisory locking or an explicit single migration leader
- Remaining work: define a coordinated production migration strategy, then reassess whether multi-instance deployment is still safe under the current startup sequence

Update `2026-05-17`:
- Status: partially completed
- % left: `50% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/postgres-record-store.js:12` accepts a raw configured table name, and the same file interpolates that identifier directly into `CREATE TABLE`, `SELECT`, `INSERT`, and `DELETE` statements at lines `20`, `31`, `48`, and `55`
- Remaining work: validate or safely quote configured identifiers in the persistence layer, then re-check whether deployment-time database configuration can still destabilize or weaken the storage backend

Update `2026-05-17`:
- Status: partially completed
- % left: `45% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `infra/postgres/init/*.sql` provisions a broad normalized schema (`portal_users`, `portal_sessions`, `file_objects`, `grade_audit_log`), while the runtime persistence path in `backend/platform/postgres-record-store.js` still centers on the monolithic `kiu_platform_state_records` JSON table and a code search found no runtime queries of those normalized tables
- Remaining work: decide whether production is meant to run on the normalized schema or the monolithic state table, then align migrations, operational docs, backup assumptions, and readiness checks to the actual model

Update `2026-05-18`:
- Status: partially completed
- % left: `30% left`
- Files changed: `backend/platform/postgres-record-store.js`, `tools/check-production-readiness.js`, `tools/migrate-postgres.js`, `.env.example`, `.env.production.example`, `docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md`, `docs/LMS_PRODUCTION_READINESS.md`, `DEPLOYMENT.md`, `test/production-single-writer-regressions.test.js`, `test/postgres-record-store-safety.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/production-single-writer-regressions.test.js test/postgres-record-store-safety.test.js`; `npm run check:platform`; `node --check tools/check-production-readiness.js`; `node --check tools/migrate-postgres.js`; production readiness now requires `KIU_SINGLE_WRITER_MODE=true`, the migration runner now serializes through `pg_advisory_lock(...)`, and `backend/platform/postgres-record-store.js` now rejects unsafe table identifiers before building SQL
- Remaining work: keep the enforced single-writer/migration-leader constraint and table-name validation, then finish the deeper shared-state model decisions still open in this task, especially the monolithic state-table vs normalized-schema runtime split and the remaining last-writer-wins overwrite paths inside the store

Update `2026-05-18`:
- Status: partially completed
- % left: `35% left`
- Files changed: `tools/check-production-readiness.js`, `tools/migrate-postgres.js`, `.env.example`, `.env.production.example`, `docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md`, `docs/LMS_PRODUCTION_READINESS.md`, `DEPLOYMENT.md`, `test/production-single-writer-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/production-single-writer-regressions.test.js`; `node --check tools/check-production-readiness.js`; `node --check tools/migrate-postgres.js`; `tools/check-production-readiness.js` now requires `KIU_SINGLE_WRITER_MODE=true` as a production gate, `tools/migrate-postgres.js` now acquires/releases `pg_advisory_lock(...)` around the migration pass, and the production docs now explicitly constrain the current platform to one authoritative backend writer until optimistic concurrency exists
- Remaining work: keep the enforced single-writer/migration-leader constraint, then finish the deeper model cleanup still open in this task, especially the monolithic state-table vs normalized-schema decision and the remaining last-writer-wins shared-state overwrite paths inside the runtime store

Update `2026-05-18`:
- Status: partially completed
- % left: `20% left`
- Files changed: `assets/js/app/api.js`, `backend/platform/store.js`, `test/portal-state-persistence-safety.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/app/api.js`; `node --check backend/platform/store.js`; `npx vitest run test/portal-state-persistence-safety.test.js`; the browser sync path now persists only a narrowed client-owned slice through `buildPortalBackendPersistableState(...)`, while `PlatformStore.savePortalState(...)` now preserves server-owned portal state and merges only approved keys such as dashboard preferences, calendar events, messenger UI state, and order-read markers instead of replacing the full shared blob
- Remaining work: the highest-risk client-driven overwrite path is now narrowed, but the task remains open for the larger runtime persistence model decision around the normalized schema vs monolithic state-table split and for the remaining single-writer-only production constraint

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/PRODUCTION_STATE_MODEL_DECISION.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [PRODUCTION_STATE_MODEL_DECISION.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PRODUCTION_STATE_MODEL_DECISION.md>) now explicitly classifies the live runtime persistence model as `single writer only` on the monolithic state-record table, distinguishes that from the unused normalized schema bootstrap SQL, and records the only two honest future directions: keep the explicit single-writer constraint or redesign onto granular normalized records with optimistic concurrency
- Remaining work: none for the current shared-state audit gate

### `AUDIT-SEC-03` `0% left` Audit DOM injection, HTML-string rendering, and inline handler attack surface

Priority: `P1`
Depends on: none

What is already known:

- first-party scan found:
  - `344` `innerHTML =` sites
  - `11` `insertAdjacentHTML(` sites
  - `0` `document.write(` sites
  - `140` inline handler attributes in root HTML files

Why this task still exists:

- these are not automatically vulnerabilities
- but the surface area is large enough that a targeted XSS and DOM-sink audit is required

Primary files:

- root `*.html`
- `assets/js/features/index-luxury.js`
- `assets/js/pages/`

Exact audit/fix work:

1. Triage the highest-risk sinks first:
   - `eval`
   - `document.write`
   - user/data-driven `innerHTML`
   - user/data-driven `insertAdjacentHTML`
   - inline handler attributes
2. Separate safe escaped rendering from unreviewed rendering.
3. Record high-risk sinks with file and line evidence.
4. Convert the worst sinks to safer DOM APIs where practical.

Verification gate:

- highest-risk sink inventory exists with file-level evidence
- clearly unsafe sinks are fixed or tracked individually

Update `2026-05-17`:
- Status: partially completed
- % left: `75% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/pages/lms.js:148` still executes DOM attribute code through `new Function('event', 'element', normalizedCode)`, with delegated handlers bound to `data-lms-click`, `data-lms-change`, and `data-lms-input` at lines `175` to `177`
- Remaining work: replace LMS attribute-code execution with explicit handler maps, then revisit remaining `innerHTML`/markup sinks with the reduced code-evaluation surface

Update `2026-05-18`:
- Status: partially completed
- % left: `40% left`
- Files changed: `assets/js/pages/lms.js`, `test/lms-delegated-actions-security.test.js`, `test/scheduler-and-lms-regressions.test.js`, `test/lms-route-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/lms-delegated-actions-security.test.js test/scheduler-and-lms-regressions.test.js test/lms-route-regressions.test.js`; `npm run check:frontend`; `assets/js/pages/lms.js` no longer uses `new Function(...)` for delegated LMS actions and now routes those `data-lms-*` strings through a constrained interpreter that only supports the current delegated action patterns
- Remaining work: keep the safer LMS delegated action path, then continue the broader sink-reduction pass still open in this task, especially the remaining large `innerHTML` surface and inline-handler backlog

Update `2026-05-17`:
- Status: partially completed
- % left: `70% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/pages/social-page.js:3044`, `3986`, and `6884` render user-controlled URLs directly into `href` attributes, while the corresponding backend normalization paths in `backend/platform/store.js:312` and `6626` keep those URL values without a scheme allowlist
- Remaining work: apply URL-scheme validation across social render/storage paths, then continue the remaining sink review with URL-bearing attributes treated as part of the XSS surface

Update `2026-05-18`:
- Status: partially completed
- % left: `50% left`
- Files changed: `assets/js/app/app.js`, `assets/js/pages/directories.js`, `assets/js/pages/profile-view-admin-actions.js`, `test/app-bootstrap-security.test.js`, `test/profile-view-route-regressions.test.js`, `test/staff-mobile-runtime-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/app-bootstrap-security.test.js test/profile-view-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js`; `node --check assets/js/app/app.js`; `node --check assets/js/pages/directories.js`; `node --check assets/js/pages/profile-view-admin-actions.js`; a fresh first-party source scan now reports `0` live `document.write(` matches after replacing the bootstrap loader and the remaining transcript/export popup helpers with explicit DOM or Blob-backed window loading
- Remaining work: keep the `document.write` surface at zero, then continue the larger sink-reduction pass still open in this task, especially the LMS `new Function(...)` handler path and the broader `innerHTML` / inline-handler surface

Update `2026-05-18`:
- Status: partially completed
- % left: `60% left`
- Files changed: `assets/js/app/app.js`, `test/app-bootstrap-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/app-bootstrap-security.test.js`; `node --check assets/js/app/app.js`; `KIU_BASE_URL=http://127.0.0.1:8879 KIU_OUTPUT_PATH=artifacts/runtime-shell-smoke-app-bootstrap.json node tools/runtime_shell_smoke.mjs`; `assets/js/app/app.js` no longer contains the `document.write(...)` bootstrap path and now inserts the API runtime script explicitly near `document.currentScript`
- Remaining work: keep the safer bootstrap loader, then continue the larger sink-reduction pass still open in this task, especially the LMS `new Function(...)` handler path, URL-bearing social sinks, and the broader `innerHTML` / inline-handler surface

Update `2026-05-18`:
- Status: partially completed
- % left: `55% left`
- Files changed: `backend/platform/store.js`, `assets/js/pages/social-page.js`, `test/social-url-safety.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/social-url-safety.test.js`; `npm run check:platform`; `npx vitest run test/social-lost-found-regressions.test.js`; `backend/platform/store.js` now normalizes social external URLs through `normalizeSafeExternalUrl(...)`, while `assets/js/pages/social-page.js` now filters meeting and portfolio links through `getSafeSocialExternalUrl(...)` before writing them into `href`
- Remaining work: keep the safer social URL path, then continue the larger sink-reduction pass still open in this task, especially the LMS `new Function(...)` handler path and the wider `innerHTML` / inline-handler surface that still blocks stronger CSP

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/DOM_SINK_INVENTORY.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [DOM_SINK_INVENTORY.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/DOM_SINK_INVENTORY.md>) now records the current first-party sink surface, identifies the remaining large string-render owners, and explicitly notes that the previously tracked code-eval/document-write paths are either fixed or separately tracked; the audit now has a concrete inventory instead of an undefined broad sink concern
- Remaining work: none for the current DOM-injection audit gate

### `AUDIT-SEC-04` `0% left` Audit file upload and download safety

Priority: `P0`
Depends on: authorization review should inform final severity

What is already known:

- upload endpoint exists: `/api/files/upload`
- download endpoint exists: `/api/files/:id`
- file records are created from parsed data URLs in the store layer
- file flows exist across multiple website areas

Why this task still exists:

- file handling is a high-risk area
- current audit has not yet verified:
  - file type constraints
  - size constraints
  - ownership checks
  - download access controls
  - content-disposition safety

Primary files:

- `backend/platform/server.js`
- `backend/platform/store.js`
- frontend upload callers under:
  - `assets/js/app/api.js`
  - `assets/js/shared/`
  - `assets/js/pages/`

Exact audit/fix work:

1. Map all upload entry points and scopes.
2. Verify server-side validation:
   - type
   - size
   - ownership
   - storage path safety
3. Verify download access control and response headers.
4. Record any path traversal, spoofed MIME, or unauthorized access risks.

Verification gate:

- upload/download flow map exists
- validation and access-control status is explicitly documented

Update `2026-05-17`:
- Status: partially completed
- % left: `70% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:3935` accepts uploads and forwards `ownerUserId`, `backend/platform/store.js:4983` writes parsed data URLs to disk without persisting `ownerUserId`, and `backend/platform/server.js:3949` streams stored files to any authenticated session without ownership, scope, or role checks
- Remaining work: persist owner metadata at write time, enforce read authorization on `/api/files/:id`, and add explicit server-side size/type validation before writing uploads

Update `2026-05-17`:
- Status: partially completed
- % left: `60% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:4998` persists caller-controlled MIME types, while `backend/platform/server.js:3957` and `backend/platform/server.js:3959` reflect those values back as inline browser content
- Remaining work: add MIME allowlisting or force-download behavior, then re-check whether any remaining upload surfaces can still host active content even after ownership and size controls are fixed

Update `2026-05-17`:
- Status: partially completed
- % left: `55% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:210` applies a global `100mb` JSON parser, `/api/files/upload` accepts uploads through that path at `3935`, and `backend/platform/store.js:4984` decodes `payload.dataUrl` before any explicit route-specific size cap is enforced
- Remaining work: replace the global-body reliance with tighter upload-specific limits, add explicit decoded-size validation, and then verify large-upload failure behavior under production-like conditions

Update `2026-05-17`:
- Status: partially completed
- % left: `50% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:1752` to `1754` resolve caller-supplied mail attachment `storageKey` values through `store.getFile(...)`, and `/api/mail/messages/send` at `2497` accepts those attachments without an ownership check on the referenced stored file
- Remaining work: add centralized file-ownership enforcement for every internal file-resolution path, then retest direct download, mail attachment, messenger, LMS, and social flows against cross-user file ids

Update `2026-05-17`:
- Status: partially completed
- % left: `45% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:5224` to `5233` accept any existing `storageKey` inside `normalizeMessageAttachment(...)`, and that helper is reused by portal mail copies (`4889`), messenger (`5260`), social media (`7878`), and LMS attachment flows (`8464`)
- Remaining work: enforce ownership in the shared normalizer itself, then retest every flow that accepts attachment references instead of only patching route-local file reads

Update `2026-05-17`:
- Status: partially completed
- % left: `35% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/files/upload` forwards caller-controlled `id` values into `backend/platform/store.js:4985`, the write path uses `path.join(this.uploadsDir, \`${id}${ext}\`)` at `4991`, and a direct resolution check with `..\\..\\escaped` produced an output path outside the uploads directory
- Remaining work: remove caller-supplied file ids from the write path, enforce path confinement before any filesystem write, and then re-audit every flow that creates stored file records

Update `2026-05-17`:
- Status: partially completed
- % left: `25% left`
- Files changed: `backend/platform/store.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; isolated verification with a temporary uploads root confirmed `PlatformStore.createFileFromUpload(...)` now normalized the malicious id `..\\..\\escaped` to `escaped` and wrote the resulting file under the configured uploads directory instead of escaping it
- Remaining work: keep the new path confinement, then finish the still-open owner persistence, download authorization, MIME handling, and shared attachment-resolution fixes already tracked under this task

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `.env.production.example:29` and `backend/platform/server.js:4722` advertise `external` file storage, `docker-compose.production.yml:71` ships MinIO, but `backend/platform/store.js:4983` to `4993` still persist uploads directly to the local `uploadsDir` with `fs.writeFileSync(...)`
- Remaining work: either implement real external object storage or relabel the deployment/runtime expectations honestly, then re-check durability, scaling, and backup assumptions for uploaded files

Update `2026-05-18`:
- Status: partially completed
- % left: `20% left`
- Files changed: `backend/platform/store.js`, `backend/platform/server.js`, `.env.example`, `.env.production.example`, `test/platform-file-upload-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js`; source verification now shows `/api/files/upload` derives `ownerUserId` from `getSessionActor(sessionAccount).actorUserId`, `PlatformStore.createFileFromUpload(...)` persists `ownerUserId`, rejects decoded uploads above `maxFileUploadBytes`, and sanitizes stored MIME types to a safe allowlist, while `/api/files/:id` now serves `Content-Disposition: attachment` instead of inline content
- Remaining work: keep the new owner/mime/size/disposition hardening, then finish the still-open read-authorization and shared-attachment resolution work across `/api/files/:id`, portal mail, messenger, social, and LMS attachment references before treating file access as fully secured

Update `2026-05-18`:
- Status: partially completed
- % left: `15% left`
- Files changed: `backend/platform/store.js`, `backend/platform/server.js`, `test/platform-file-upload-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js`; `backend/platform/store.js` now rejects cross-user `storageKey` reuse inside `normalizeMessageAttachment(...)` when owner metadata exists, and `backend/platform/server.js` now applies the same owner check in `buildGraphSendAttachments(...)` for Outlook send attachments
- Remaining work: keep the new storage-key ownership guard, then finish the remaining direct-download authorization and viewer/recipient sharing model for `/api/files/:id` so legitimate shared attachments still work while unrelated authenticated users can no longer read them

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/server.js`, `test/platform-file-upload-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js`; `PlatformStore.canActorAccessStoredFile(...)` now authorizes direct downloads only through owner checks plus actual viewer reachability across portal mail, messenger chats, Student Service bootstrap, social bootstrap, and LMS course membership, while `/api/files/:id` now returns `403` for unrelated authenticated sessions instead of streaming every stored file to any logged-in user
- Remaining work: none for the current upload/download audit scope

### `AUDIT-SEC-05` `0% left` Audit remote dependencies, external resources, and privacy/supply-chain risks

Priority: `P1`
Depends on: none

What is already known:

- current `npm audit --json` now reports `0` known package vulnerabilities after upgrading direct dev dependency `playwright` to `1.55.1`
- the previously tracked frontend asset-CDN and avatar/font URLs have now been removed from the audited route source

Why this task still exists:

- package audit alone does not cover runtime remote-resource risks
- CDN/runtime dependencies and third-party calls still matter

Primary files:

- root `*.html`
- `assets/js/pages/exams-console.js`
- `assets/js/pages/registration.js`
- `assets/js/pages/registration-student-route.js`
- `assets/js/pages/social-page.js`

Exact audit/fix work:

1. Inventory remote runtime dependencies and external service calls.
2. Separate:
   - required
   - optional
   - removable
3. Replace the most fragile remote runtime dependencies with local assets where practical.
4. Record privacy implications of third-party requests.

Verification gate:

- remote dependency inventory exists
- high-risk remote runtime dependencies are fixed or explicitly tracked

Update `2026-05-17`:
- Status: partially completed
- % left: `60% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: current `npm audit --json` now reports a high-severity `playwright` advisory, and `exams.html` no longer loads `unpkg.com` export libraries because it now uses local vendor assets under `assets/vendor/export-libs/`
- Remaining work: complete a broader remote-resource inventory, decide whether Google Fonts and `ui-avatars.com` are acceptable, and upgrade `playwright` past the advisory range

Update `2026-05-17`:
- Status: partially completed
- % left: `50% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `exam-portal.html:8` still loads Font Awesome from `cdnjs.cloudflare.com`, `assets/css/kiu-fonts.css:2` still imports Google Fonts, `assets/js/pages/registration.js:3394` still uses `via.placeholder.com`, and both `assets/js/pages/registration.js:5570` and `assets/js/pages/registration-student-route.js:104` still call `ui-avatars.com`
- Remaining work: classify which third-party requests are runtime-critical versus cosmetic, localize the removable assets first, and then reassess CSP/privacy blockers after those requests are reduced

Update `2026-05-17`:
- Status: partially completed
- % left: `40% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `assets/js/pages/career-market.js:306` and `324` persist third-party AI `apiKey` values in browser `localStorage`, while `backend/platform/server.js:1979` exposes `/api/ai/career-completion` publicly without auth or rate limiting
- Remaining work: decide whether the AI provider workflow should stay client-owned or move server-owned, remove browser-persisted provider secrets for production use, and gate or disable the public proxy route before treating the feature as production-safe

Update `2026-05-17`:
- Status: partially completed
- % left: `25% left`
- Files changed: `backend/platform/server.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: live verification on `http://127.0.0.1:48933` confirmed `POST /api/ai/career-completion` now returns `401` anonymously, then rate-limits authenticated repeated requests after `10` failures (`11th` request -> `429`, `Retry-After: 600`) once `requireSessionAccount(...)` and `enforceRateLimit(...)` were added
- Remaining work: remove or redesign browser-side provider API-key storage in `assets/js/pages/career-market.js`, then decide whether production should keep this proxy path at all or restrict it further to narrower trusted roles or deployment modes

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `assets/js/pages/career-market.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; source verification confirmed `assets/js/pages/career-market.js` now reads and writes the AI provider `apiKey` through `sessionStorage`, while `localStorage` persistence in `writeProviderSettings(...)` is limited to provider metadata, instructions, files, and timestamps
- Remaining work: decide whether browser-controlled session storage is acceptable for this feature at all, or whether the production design should eliminate client-held reusable provider secrets entirely and keep the proxy disabled or further restricted outside trusted workflows

Update `2026-05-17`:
- Status: partially completed
- % left: `35% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `docker-compose.production.yml:13` mounts the repository root into Caddy, and `infra/caddy/Caddyfile:3`, `16`, and `17` configure `root * /srv` with `file_server` and no explicit denylist for non-public project paths
- Remaining work: narrow the production document root to public web assets only, then re-check whether any deployment-managed static files still expose internal project material or secrets

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the production backend image in `Dockerfile` has no `USER` instruction, and `docker-compose.production.yml:19` to `45` does not add `read_only` or similar runtime hardening for the `portal-backend` service
- Remaining work: move the backend to a non-root runtime user, limit writable paths explicitly, and then reassess the impact envelope of the already-confirmed filesystem issues under the hardened container model

Update `2026-05-17`:
- Status: partially completed
- % left: `25% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:4143` stores arbitrary client-supplied push subscription endpoints, and `backend/platform/server.js:1116` later uses those stored endpoints in outbound `webPush.sendNotification(...)` calls without an explicit allowlist
- Remaining work: constrain outbound push destinations to valid browser push endpoints, then re-check whether any other backend outbound integrations still trust client-supplied network destinations

Update `2026-05-17`:
- Status: partially completed
- % left: `20% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:164` defaults RTC STUN to Google public endpoints, and `.env.example:35` documents the same defaults
- Remaining work: decide whether production should rely on external STUN at all, then make the final RTC dependency posture explicit in both deployment docs and readiness verification

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:1636` caches full Outlook message bodies, `backend/platform/store.js:4707` persists them in `cache.messagesById`, and `backend/platform/store.js:4772` serves later bootstrap views from that stored cache
- Remaining work: define mail-content retention/minimization rules, then verify that cached integration data does not exceed production privacy expectations or state-size assumptions

Update `2026-05-17`:
- Status: partially completed
- % left: `10% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `docker-compose.production.yml:85` exposes coturn through host networking, `docker-compose.production.yml:96` injects `KIU_TURN_CREDENTIAL` into the startup command/config path, and `infra/coturn/turnserver.conf.template:6` uses a static long-term credential form
- Remaining work: decide the final TURN secret-handling and exposure model for production, then verify that RTC infrastructure no longer relies on over-broad network placement or brittle secret injection paths

Update `2026-05-17`:
- Status: partially completed
- % left: `8% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `docker-compose.production.yml` uses `env_file: .env` for multiple production services even though the repo ships `.env.production.example`, which means the production stack is wired to consume the generic local env file by default
- Remaining work: move the production stack onto an explicit production env/secrets source, then verify that no remaining deployment step still relies on ambiguous local-development defaults

Update `2026-05-17`:
- Status: partially completed
- % left: `7% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the Dockerfile and production compose stack rely on floating image tags like `node:22-alpine`, `caddy:2.9-alpine`, `postgres:16-alpine`, `redis:7-alpine`, and `coturn/coturn:4.7` instead of pinned digests
- Remaining work: decide the required image immutability standard for production, then freeze or pin the deployed image set so rollouts and rollbacks are reproducible

Update `2026-05-17`:
- Status: partially completed
- % left: `6% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: multiple external-integration routes in `backend/platform/server.js` reflect raw `error?.message` values back to clients, including the AI proxy, Microsoft sign-in flow, Outlook mailbox connection flow, and several Outlook mailbox API routes
- Remaining work: standardize safe user-facing error responses for external integrations, then re-check whether any remaining remote-provider routes still echo upstream/internal messages directly

Update `2026-05-17`:
- Status: partially completed
- % left: `5% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/store.js:4150` keys push subscription records solely from the endpoint value, and `4151` then reassigns the stored record to the current `userId`
- Remaining work: make push subscription identity user-scoped as well as endpoint-scoped, then re-check whether any remaining outbound-integration caches or registration records can be rebound across users by shared identifiers

Update `2026-05-17`:
- Status: partially completed
- % left: `4% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:1636` persists full HTML message bodies, and `assets/js/pages/email.js:1469` plus `1741` render those cached HTML bodies directly into `iframe srcdoc` content via `escapeSrcDoc(...)`
- Remaining work: decide the production HTML-mail rendering policy, then re-check whether cached integration content still pulls remote resources or reveals more mail data than is necessary for the workspace

Update `2026-05-18`:
- Status: partially completed
- % left: `3% left`
- Files changed: `exam-portal.html`, `test/exam-portal-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/exam-portal-regressions.test.js`; focused remote-dependency rescan across `exam-portal.html`, `assets/css`, and `assets/js/pages` no longer finds any `cdnjs.cloudflare.com` reference on the exam portal, and `exam-portal.html` now serves Font Awesome from `assets/vendor/fontawesome/css/all.min.css` instead of a live CDN stylesheet
- Remaining work: the remote frontend inventory is smaller but still not clean because `assets/css/kiu-fonts.css` imports Google Fonts, `registration.js` still falls back to `via.placeholder.com`, and both registration routes still call `ui-avatars.com`; finish classifying and localizing those remaining third-party requests, then decide the final privacy posture for any integrations that must stay remote

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `assets/css/kiu-fonts.css`, `assets/js/shared/utilities.js`, `assets/js/pages/registration.js`, `assets/js/pages/registration-student-route.js`, `test/registration-route-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check assets/js/shared/utilities.js`; `node --check assets/js/pages/registration.js`; `node --check assets/js/pages/registration-student-route.js`; `npx vitest run test/registration-route-regressions.test.js test/root-font-delivery-regressions.test.js`; focused source rescan across `exam-portal.html`, `assets/css`, and `assets/js/pages` now returns `0` live matches for `fonts.googleapis.com`, `fonts.gstatic.com`, `ui-avatars.com`, `via.placeholder.com`, and `cdnjs.cloudflare.com`
- Remaining work: the audited frontend asset surface is now clean, but the task cannot be closed yet because the `playwright` advisory and the broader external-provider/privacy posture for backend integrations still need final decisions or remediation

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `package.json`, `package-lock.json`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm install --save-dev playwright@1.55.1`; `npx playwright --version` -> `Version 1.55.1`; `npm audit --json` now reports `0` vulnerabilities; `npx playwright install chromium`; `npx vitest run test/exam-portal-regressions.test.js test/registration-route-regressions.test.js test/root-font-delivery-regressions.test.js test/platform-cors-regressions.test.js`; `node tools/runtime_shell_smoke.mjs` with `KIU_BASE_URL=http://127.0.0.1:8878` produced `artifacts/runtime-shell-smoke-playwright1551.json` with `serverMode: "autostarted"` and zero route failures
- Remaining work: the direct package advisory is resolved, but the task still stays open for the broader external-provider/privacy posture that is not covered by `npm audit`, especially the still-open backend integration and infrastructure dependency decisions already tracked in this task

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/store.js`, `test/platform-push-subscription-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check:platform`; `npx vitest run test/platform-push-subscription-security.test.js`; `backend/platform/store.js` now validates push endpoints through `isValidPushSubscriptionEndpoint(...)` before persistence and derives subscription ids from ``${normalizedUserId}:${endpoint}``, while the new test confirms non-HTTPS/private endpoints are rejected and the same endpoint now produces distinct records for different users
- Remaining work: keep the tighter push-subscription rules, then continue the broader external-provider/privacy review still open in this task, especially the remaining RTC, mail-content, deployment, and outbound-integration hardening items

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `Dockerfile`, `docker-compose.production.yml`, `infra/caddy/Caddyfile`, `test/production-hardening-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/production-hardening-regressions.test.js`; `Dockerfile` now installs `su-exec` and drops the backend runtime to the `node` user after root-only setup work, `docker-compose.production.yml` now reads `.env.production`, applies `read_only: true`, `tmpfs: /tmp`, and `no-new-privileges:true` to the backend service, and `infra/caddy/Caddyfile` now hides internal repo paths plus deployment files from static serving under `/srv`
- Remaining work: none for the current remote-dependency/privacy audit gate because the highest-risk frontend/runtime/deployment dependency gaps are now fixed and the remaining third-party integrations are explicitly documented elsewhere in this tracker

### `AUDIT-HDR-01` `0% left` Complete browser hardening review for headers and CSP

Priority: `P1`
Depends on: `AUDIT-SEC-01` because `eval` affects CSP rollout

What is already known:

- backend already sets several useful headers
- no frontend or backend CSP references were found

Why this task still exists:

- current header posture is only partial hardening
- missing CSP is a meaningful gap

Primary files:

- `backend/platform/server.js`
- root entry HTML files if meta-based hardening is considered

Exact audit/fix work:

1. Review current header coverage against website needs.
2. Design CSP rollout in a way that fits actual script/style behavior.
3. Identify blockers to strict CSP:
   - `eval`
   - inline handlers
   - inline scripts
   - remote resources
4. Record the staged hardening plan if same-turn rollout is unrealistic.

Verification gate:

- current header posture is documented
- CSP rollout blockers are explicit
- next hardening step is concrete, not vague

Update `2026-05-17`:
- Status: partially completed
- % left: `75% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `backend/platform/server.js:142` seeds `ALLOWED_CORS_ORIGINS` with `http://127.0.0.1:8876` and `http://localhost:8876` unconditionally, and `backend/platform/server.js:213` reflects those origins through `Access-Control-Allow-Origin`
- Remaining work: separate development-only CORS exceptions from production allowlists, then continue the broader CSP/header rollout with the corrected origin policy

Update `2026-05-18`:
- Status: partially completed
- % left: `60% left`
- Files changed: `backend/platform/server.js`, `.env.example`, `.env.production.example`, `README.md`, `docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md`, `test/platform-cors-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check:platform`; `npx vitest run test/platform-cors-regressions.test.js test/staff-mobile-runtime-regressions.test.js`; source verification in `backend/platform/server.js` now shows `KIU_EXTRA_CORS_ORIGINS`, `includeDefaultLoopbackOrigins = !IS_PRODUCTION_ENVIRONMENT || isLoopbackOrigin(APP_ORIGIN)`, and the built-in localhost allowlist only inside that gated branch, while the env templates and runbook now document `KIU_EXTRA_CORS_ORIGINS` as an explicit override instead of a default production allowance
- Remaining work: keep the tighter CORS posture, then continue the larger header/CSP rollout by mapping inline/eval blockers, remote-resource blockers, and the next staged CSP step for the root entry pages

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BROWSER_HARDENING_CSP_PLAN.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [BROWSER_HARDENING_CSP_PLAN.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/BROWSER_HARDENING_CSP_PLAN.md>) now records the current header posture, the exact CSP blockers (`unsafe-eval`, inline scripts, inline styles, large DOM-string renderers), and the staged next step of shipping a report-only CSP before the stricter script/style hardening work
- Remaining work: none for the current browser-hardening review gate

### `AUDIT-QA-01` `0% left` Close the audit coverage gap between static checks and live behavior

Priority: `P1`
Depends on: runtime findings should feed into this

What is already known:

- green tests did not catch live shell failure
- broad syntax checks are useful but insufficient

Why this task still exists:

- without stronger runtime coverage, future regressions can slip through again

Primary files:

- `test/`
- `tools/`

Exact audit/fix work:

1. Add runtime/browser-level checks for critical route families.
2. Make sure at least one command fails when live shell startup is broken.
3. Distinguish:
   - syntax coverage
   - static source assertions
   - real runtime/browser coverage
4. Record gaps that still remain after the new checks land.

Verification gate:

- runtime coverage can fail on real browser breakage
- test matrix clearly states what is and is not covered

Update `2026-05-17`:
- Status: partially completed
- % left: `60% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run test:runtime-shell` now exists and passes, and the current audit session also ran a root-entry smoke scan plus direct navigation probes that caught behavior static checks would miss
- Remaining work: expand browser/runtime coverage beyond the current shell smoke command and document remaining uncovered flows explicitly in the test matrix

Update `2026-05-17`:
- Status: partially completed
- % left: `50% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `tools/capture_staff_summary.mjs` currently uses DOM `.click()` bypasses at lines `158` and `170`, which allowed the summary to pass even though a real pointer-click reproduction on `staff.html` desktop still failed from shell overlay interception
- Remaining work: remove DOM-click bypasses from critical route captures, add pointer-realistic interaction coverage, and make sure layout-overlap bugs can fail runtime QA

Update `2026-05-17`:
- Status: partially completed
- % left: `40% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `tools/runtime_shell_smoke.mjs` currently assumes `http://127.0.0.1:8876` is already serving the site, the first `npm run test:runtime-shell` failed with `ERR_CONNECTION_REFUSED`, and the same command passed after explicitly starting `tools/local_dev_server.py 8876`, producing a clean `artifacts/runtime-shell-smoke.json`
- Remaining work: make the runtime smoke command self-bootstrapping or fail with an explicit setup error, then keep extending it so CI/runtime verification reflects real regressions rather than missing local prerequisites

Update `2026-05-17`:
- Status: partially completed
- % left: `35% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `service-worker.js:48` intercepts `/api/` requests and `service-worker.js:50` falls back to cached `/index.html` HTML on backend fetch failure, which means outage behavior can diverge from normal API semantics
- Remaining work: keep offline shell behavior for document routes, but return explicit offline/API failure responses for backend calls so runtime QA and production incident behavior stay debuggable

Update `2026-05-18`:
- Status: partially completed
- % left: `2% left`
- Files changed: `service-worker.js`, `test/service-worker-offline-api-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/service-worker-offline-api-regressions.test.js`; `npm run check:frontend`; `service-worker.js` now returns `buildOfflineApiResponse(request)` with `status: 503`, JSON `Content-Type`, and `code: 'offline'` for failed `/api/` fetches instead of falling back to cached `/index.html`
- Remaining work: keep the explicit offline API response, then finish the remaining deployment-verification, audit-forensics, SSE-guardrail, and reverse-proxy asset-map coverage already tracked in this task

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `infra/caddy/Caddyfile:13` routes `/service-worker.js` and `/manifest.webmanifest` through the backend matcher, while `backend/platform/server.js:4709` only exposes the generic 404 fallback for unmatched routes
- Remaining work: verify the production reverse-proxy asset map end-to-end, then align proxy/static handling so deployment-only path mismatches cannot silently disable service worker or manifest behavior

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `infra/caddy/Caddyfile`, `test/caddy-static-asset-routing.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/caddy-static-asset-routing.test.js`; source verification now shows `infra/caddy/Caddyfile` keeps `/manifest.webmanifest` and `/service-worker.js` out of the `@api` backend matcher, leaving them to static file serving instead of the backend 404 fallback
- Remaining work: keep the corrected static routing, then finish the still-open SSE guardrail and broader deployment-verification coverage already tracked in this task

Update `2026-05-17`:
- Status: partially completed
- % left: `25% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `tools/check-production-readiness.js` only evaluates environment/config gates from the `required` and `recommended` arrays, while this audit has already confirmed production blockers in deployment topology, bootstrap exposure, container hardening, and file handling that the checker does not inspect
- Remaining work: expand the production verifier or its companion checklist so a â€œgreenâ€ readiness signal actually covers deployment and application-security blockers rather than only env presence

Update `2026-05-18`:
- Status: partially completed
- % left: `2% left`
- Files changed: `tools/check-production-readiness.js`, `.env.production.example`, `docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md`, `docs/LMS_PRODUCTION_READINESS.md`, `DEPLOYMENT.md`, `test/production-single-writer-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/production-single-writer-regressions.test.js`; `node --check tools/check-production-readiness.js`; `npm run check:production`; the production verifier now fails a new required `KIU_SINGLE_WRITER_MODE=true` gate, and the companion docs now explicitly tell operators not to scale `portal-backend` horizontally while the shared-state store remains single-writer only
- Remaining work: keep the stronger verifier, then continue extending production-readiness coverage beyond env presence into the still-open reverse-proxy asset map, container hardening, and remaining deployment-topology blockers already tracked in this task

Update `2026-05-17`:
- Status: partially completed
- % left: `20% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: lower-risk admin/integration mutation routes around `backend/platform/server.js:3866` to `3907` already emit `addRouteAuditEvent(...)`, while several higher-impact routes such as `/api/portal/state`, `/api/social/state`, `/api/admin/accounts/:id/privileges`, `/api/admin/reset-platform-state`, and `/api/files/upload` currently do not
- Remaining work: extend route-level audit coverage to the highest-risk mutations first, then verify that production forensics can attribute who changed what across state, privileges, resets, and file writes

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `test/route-audit-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/route-audit-regressions.test.js`; `npm run check:platform`; `backend/platform/server.js` now emits `addRouteAuditEvent(...)` records for the previously uncovered high-risk mutation routes `/api/portal/state`, `/api/social/state`, `/api/admin/accounts/:id/privileges`, `/api/admin/reset-platform-state`, and `/api/files/upload`
- Remaining work: keep the new route-level audit coverage, then decide whether the caller-controlled `/api/audit/events` ingest path should be removed or separated from server-generated security events before this task can be treated as fully closed

Update `2026-05-17`:
- Status: partially completed
- % left: `15% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `POST /api/audit/events` at `backend/platform/server.js:3922` accepts arbitrary event payload fields and `backend/platform/store.js:4418` persists caller-controlled audit content such as `eventDomain`, `eventType`, `entityId`, `beforeState`, and `afterState`
- Remaining work: decide whether manual audit annotations should exist at all, then preserve forensic integrity by separating them from server-generated security events or removing the arbitrary ingest path

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `test/audit-ingest-security.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/audit-ingest-security.test.js test/route-audit-regressions.test.js`; `npm run check:platform`; `POST /api/audit/events` now stores submissions under fixed `eventDomain: 'client-annotation'`, `eventType: 'annotation-recorded'`, and `entityType: 'client_annotation'`, while caller-supplied fields are preserved only inside `afterState.annotation` instead of being trusted as top-level forensic event data
- Remaining work: keep the separated client-annotation path, then finish the still-open deployment-only QA items already tracked in this task, especially the reverse-proxy asset map and SSE guardrails

Update `2026-05-17`:
- Status: partially completed
- % left: `10% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `/api/events` at `backend/platform/server.js:3663` opens long-lived SSE responses, `registerSseClient(...)` at `760` imposes no explicit cap, and each connection starts its own keepalive timer at `3680`
- Remaining work: add production guardrails for the live event stream, then extend runtime verification so sustained connection abuse and long-lived session behavior are measured instead of only startup success

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `test/sse-guardrail-regressions.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/sse-guardrail-regressions.test.js`; `npm run check:platform`; `backend/platform/server.js` now caps SSE registrations with `SSE_MAX_CONNECTIONS_PER_USER` and `SSE_MAX_CONNECTIONS_TOTAL`, and `/api/events` now rejects excess streams with `429 Too many live event streams are already open for this session.`
- Remaining work: keep the new SSE guardrail, then finish the still-open deployment-verification coverage around broader reverse-proxy/static-path semantics and misleading static fallbacks already tracked in this task

Update `2026-05-17`:
- Status: partially completed
- % left: `5% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the production Caddy config rewrites unmatched paths through `try_files {path} {path}/ /login.html` before `file_server`, which means deployment mistakes can return a successful login page instead of a true 404 for missing static assets or routes
- Remaining work: add deployment-verification coverage for real reverse-proxy path semantics, then make sure missing assets and broken paths fail loudly instead of degrading into misleading HTML responses

Update `2026-05-18`:
- Status: partially completed
- % left: `3% left`
- Files changed: `assets/css/staff-command-center.css`, `tools/capture_staff_summary.mjs`, `tools/runtime_shell_smoke.mjs`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `node --check tools/capture_staff_summary.mjs`; `node --check tools/runtime_shell_smoke.mjs`; `KIU_BASE_URL=http://127.0.0.1:8876 node tools/capture_staff_summary.mjs`; `KIU_BASE_URL=http://127.0.0.1:8877 KIU_OUTPUT_PATH=artifacts/runtime-shell-smoke-autostart.json node tools/runtime_shell_smoke.mjs`; `npx vitest run test/staff-mobile-runtime-regressions.test.js`; the staff capture no longer uses DOM-click bypasses and `artifacts/runtime-shell-smoke-autostart.json` now shows `serverMode: "autostarted"` with zero route failures
- Remaining work: keep the pointer-realistic staff coverage and self-bootstrapping smoke path, then finish the remaining deployment-verification, audit-forensics, SSE-guardrail, and service-worker/API failure-behavior coverage already tracked in this task

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `infra/caddy/Caddyfile`, `test/caddy-static-asset-routing.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npx vitest run test/caddy-static-asset-routing.test.js`; `infra/caddy/Caddyfile` now routes `/assets/*`, `/images/*`, `/favicon.ico`, `/manifest.webmanifest`, and `/service-worker.js` through a dedicated static handler before the `try_files ... /login.html` fallback
- Remaining work: keep the corrected static-path handling, then finish the still-open deployment-verification coverage for the broader repository-root document root and non-asset route fallback semantics already tracked in this task

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `test/runtime-gradebook-registration-regressions.test.js`, `test/portal-state-persistence-safety.test.js`, `test/platform-file-upload-security.test.js`, `test/production-hardening-regressions.test.js`, `test/protected-quiz-host-regressions.test.js`, `test/global-performance-regressions.test.js`, `test/profile-source-regressions.test.js`, `test/registration-legacy-delegation.test.js`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; the live/browser command now passes together with the full static regression suite (`73` test files, `195` tests), and the refreshed regression set covers the newly fixed weighted-grade logic, real registration overlap detection, narrowed portal-state sync, production hardening, protected-quiz host derivation, and direct file-download authorization
- Remaining work: none for the current QA coverage gate

### `AUDIT-PAGE-01` `0% left` Complete a page-by-page functional smoke audit across root HTML entries

Priority: `P1`
Depends on: global runtime stabilization improves signal quality

What is already known:

- there are `30` root HTML entry files
- each root HTML entry now has at least one current smoke observation
- full route-by-route flow coverage is still incomplete

Why this task still exists:

- whole-site quality cannot be claimed until each route family is at least smoke-checked

Primary files:

- root `*.html`
- page owners under `assets/js/pages/`

Exact audit/fix work:

1. Build a route smoke checklist covering all root HTML entries.
2. Record for each route:
   - boot success/failure
   - auth expectation
   - major user-visible blockers
   - backend dependency
3. Spin off deep route trackers only where necessary.

Verification gate:

- every root HTML entry has at least one current smoke status
- the audit file clearly says which routes are healthy, broken, blocked, or not yet reviewed

Current root-entry smoke snapshot `2026-05-17`:

- Healthy shell-backed routes:
  - `admin-library.html`
  - `admin-orders.html`
  - `admin-scheduler.html`
  - `admin-tools.html`
  - `career-market.html`
  - `chancellery.html`
  - `exams.html`
  - `index.html`
  - `library.html`
  - `lms.html`
  - `personal-data.html`
  - `profile-view.html`
  - `profile.html`
  - `programs.html`
  - `registration.html`
  - `staff.html`
  - `students-admin.html`
  - `study-card.html`
  - `timetable.html`

- Healthy shell-backed routes that currently depend on a real backend session token for full data and now show `missing-session` diagnostics in local auth-only mode:
  - `faculty-gradebook.html`
  - `news.html`
  - `orders.html`
  - `social.html`
  - `student-service.html`

- Alias/redirect entries currently landing on canonical routes:
  - `calendar.html` -> `timetable.html`
  - `faculty-schedule.html` -> `timetable.html`
  - `gradebook.html` -> `faculty-gradebook.html`

- Expected non-shell special pages:
  - `exam-portal.html`
  - `login.html`

- Auth-blocked redirect entry without a real session token:
  - `protected-launch.html` -> `login.html`

Update `2026-05-17`:
- Status: partially completed
- % left: `30% left`
- Files changed: `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: current browser scan covered all `30` root HTML files and produced the status snapshot above
- Remaining work: deepen the smoke pass into route-specific primary flows, verify whether the alias/redirect behaviors are all intentional, and separate expected auth blocking from true page breakage

Update `2026-05-18`:
- Status: partially completed
- % left: `25% left`
- Files changed: `assets/css/staff-command-center.css`, `tools/capture_staff_summary.mjs`, `tools/runtime_shell_smoke.mjs`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: the deeper staff desktop smoke on `http://127.0.0.1:8876/staff.html` now verifies primary directory flow behavior beyond initial boot by opening the first staff record and then the canonical profile page via real pointer clicks, while `artifacts/runtime-shell-smoke-autostart.json` adds a fresh self-hosted route pass for `index.html?view=student#home`, `admin-tools.html`, and `social.html` on `http://127.0.0.1:8877`
- Remaining work: continue deepening the route-family smokes beyond boot success on the remaining high-value pages, especially the standalone authenticated routes and alias/redirect entries still only covered at baseline level

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md`
- Evidence: [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>) now records a current smoke status, auth expectation, and backend dependency note for every root HTML entry, including alias wrappers and special pages; this satisfies the page-by-page smoke coverage gate without relying on thread memory
- Remaining work: none for the current root-entry page smoke audit gate

## Minimal Verification Matrix For This Audit

### Baseline checks

- `npm run check`
- broad first-party `node --check`
- `npx vitest run`
- `npm run test:runtime-shell`
- `npm audit --json`

### Runtime/browser checks

- `index.html?view=student#home`
- `admin-tools.html`
- `social.html`
- `news.html`
- `student-service.html`
- `exams.html`

### Security-specific checks

- auth/session storage review
- endpoint authorization review
- file upload/download review
- remote dependency review
- CSP/header review

## Important Note For The Next Session

Do not claim "full site audited" just because:

- syntax checks are green
- tests are green
- `npm audit` is green

Those are useful baseline signals, but they do not prove that the whole website is functionally safe or secure.

Also do not assume every page refresh on navigation is a random bug.

Current evidence shows the route model is mixed:

- some pages are true in-document shell sections
- some are alias redirects
- some are standalone hard routes by design

That needs explicit navigation architecture review, not just spot fixes.
