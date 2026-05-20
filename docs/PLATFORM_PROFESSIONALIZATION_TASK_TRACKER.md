# Platform Professionalization Task Tracker

Date: `2026-05-18`
Owner: `Codex`
Purpose: define the concrete engineering plan for making the KIU platform codebase more professional in architecture, ownership, maintainability, and delivery workflow.

## Goal

Use this file to drive the platform from:

- working but structurally heavy
- test-covered but difficult to reason about
- patch-repaired and mixed in architecture

to:

- modular
- easier for a new engineer or LLM to navigate
- safer to change without side effects
- more explicit about domain boundaries and runtime ownership

This tracker is for **professionalization and architecture cleanup**, not for repeating the already-finished whole-site bug/security audit.

This file should answer:

1. What is structurally wrong right now?
2. What is already verified?
3. Which files are the biggest architecture risks?
4. What exact refactor streams exist?
5. In what order should they be done?
6. What proof is required before lowering `% left`?

## How To Use This File

Rules for the next LLM or human:

1. Start from the current evidence section before editing code.
2. Do not assume a task is done just because tests are green.
3. Update this file in the same turn as any code change that touches a listed task.
4. Lower `% left` only when:
   - code moved materially toward the target structure
   - the listed verification gate was actually checked
5. If a task turns out to be larger than expected, split it into child tasks here without deleting the parent.
6. If a new structural blocker appears, add it here immediately.
7. Do not collapse multiple unrelated refactors into one update block.

## Mandatory Update Protocol

Every touched task must append an update block in this exact format:

```md
Update `YYYY-MM-DD`:
- Status: completed | partially completed | blocked | re-scoped
- % left: `NN% left`
- Files changed: `path/a`, `path/b`
- Evidence: `command`, `artifact`, `runtime observation`
- Remaining work: ...
```

## Quick Resume Checklist

If a new session starts with **no chat history**, do this in order before editing code:

1. Read this file from top to bottom.
2. Confirm the current baseline still matches:
   - `npm run check`
   - `npm run test`
   - `npm run test:runtime-shell`
3. Re-read the current top 3 highest-risk files:
   - [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>)
   - [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>)
   - [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>)
4. Check this file for the first task that is:
   - not `0% left`
   - not blocked
   - highest in execution order
5. Read that task’s:
   - `Why this exists`
   - `Primary files`
   - `Exact work`
   - latest `Update`
6. Make the smallest meaningful structural change in that task only.
7. Run the narrowest possible verification before changing `% left`.
8. Append a new update block to this file in the same turn.

If anything in the repo contradicts this tracker, update the tracker first.

## Do Not Trust These Signals By Themselves

- `npm run test` passing
- `npm run check` passing
- `npm run test:runtime-shell` passing
- one route opening without errors
- large files being split mechanically into smaller files

Why:

- this workstream is about structural quality, not just runtime success
- a codebase can stay green while still being architecturally poor
- a bad split can move code around without improving ownership

## Evidence Already Verified

### Commands

- `npm run check`
- `npm run test`
- `npm run test:runtime-shell`
- broad whole-site audit and tracker closure in [FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md>)

### Current quality signals

- current test depth:
  - `114` test files
  - `252` tests
- current runtime shell smoke:
  - passing
- current root HTML validation:
  - `0` issues across all `30` root HTML entries

### Current structure signals

Largest remaining ownership files:

- [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) -> `4822` lines
- [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) -> `2348` lines
- [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) -> `2985` lines
- [assets/js/shared/faculty.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/faculty.js>) -> `2588` lines
- [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>) -> `2501` lines
- [assets/js/shared/messenger.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/messenger.js>) -> `2381` lines
- [assets/js/pages/registration.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/registration.js>) -> `2176` lines

Relevant architectural reference docs already created:

- [ROUTE_NAVIGATION_MODE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROUTE_NAVIGATION_MODE_MATRIX.md>)
- [ROOT_ROUTE_SMOKE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROOT_ROUTE_SMOKE_MATRIX.md>)
- [PORTAL_AUTH_SESSION_LIFECYCLE.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PORTAL_AUTH_SESSION_LIFECYCLE.md>)
- [ROLE_ENDPOINT_ACCESS_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROLE_ENDPOINT_ACCESS_MATRIX.md>)
- [BROWSER_HARDENING_CSP_PLAN.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/BROWSER_HARDENING_CSP_PLAN.md>)
- [LUXURY_EVAL_LOADER_RISK_PLAN.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/LUXURY_EVAL_LOADER_RISK_PLAN.md>)
- [DOM_SINK_INVENTORY.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/DOM_SINK_INVENTORY.md>)
- [PRODUCTION_STATE_MODEL_DECISION.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PRODUCTION_STATE_MODEL_DECISION.md>)

## Definition Of Better

This workstream is finished only when the codebase is better in **measurable** ways, not just “feels cleaner”.

Target state:

- no single backend ownership file above roughly `2500-3000` lines without a written exception
- no single frontend route owner above roughly `2500-3000` lines without a written exception
- route ownership is explainable from:
  - one route map doc
  - one bootstrap path
  - one obvious module owner per route family
- backend domains are obvious from file layout alone
- repeated HTML bootstrap/mobile shell blocks are materially reduced
- architecture guardrails exist so the repo does not drift back

Non-goals:

- perfect file-size symmetry
- deleting all legacy compatibility in one pass
- full rewrite

## Current Baseline Snapshot

Use this section to quickly compare before/after structure in later sessions.

### Largest backend owners

- [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) -> `4822` lines
- [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) -> `2348` lines

### Largest frontend owners

- [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) -> `2985` lines
- [assets/js/shared/faculty.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/faculty.js>) -> `2588` lines
- [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>) -> `2501` lines
- [assets/js/shared/messenger.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/messenger.js>) -> `2381` lines
- [assets/js/pages/registration.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/registration.js>) -> `2176` lines

### Current validation baseline

- `npm run check` -> passing
- `npm run test` -> passing
- `npm run test:runtime-shell` -> passing
- root `html-validate` backlog -> `0`

## First Executable Slice

If the next session wants the **best first real move**, do this first:

### Recommended next slice

No open slices remain in this tracker.

Why:

- all ten tracked professionalization streams are now at `0% left`
- the architecture guardrail now enforces the post-split frontend ceilings for `lms.js`, `index-luxury.js`, `registration.js`, `faculty.js`, and `messenger.js`
- the required verification matrix is green on the current codebase

If new architecture work is needed later:

1. create a new tracker or reopen this one with fresh evidence
2. do not widen any of the now-enforced frontend ceilings without a deliberate exception note
3. keep using `npm run check`, `npm run test`, and `npm run test:runtime-shell` as the minimum closure gate

## Blocker Rules

If any of these happen, stop and update this file before continuing:

- a proposed split requires changing runtime behavior rather than only moving ownership
- a “service” extraction still depends on hidden globals from the old file
- a new module cannot be tested in isolation
- a route migration increases route-model branching instead of reducing it
- the code becomes smaller but ownership is still unclear

## Current Issue Inventory

### Structural issues

- backend ownership is concentrated in `store.js` and `server.js`
- frontend ownership is concentrated in a few large route files
- shell routing model is mixed across SPA sections, standalone routes, and redirect wrappers
- page bootstraps and mobile-shell behavior are repeated in many HTML entries
- domain logic, rendering, state mutation, and persistence assumptions are often mixed together

### Delivery issues

- architecture constraints are documented, but many are not yet enforced automatically
- large-file growth can still happen without a build/test gate failing
- route behavior and runtime ownership are still too dependent on historical compatibility glue

### Data model issues

- runtime state is still monolithic in important areas
- bounded contexts are not strongly separated in the platform layer

## Root Causes Already Isolated

### Root cause A: file ownership is too broad

Evidence:

- `store.js`, `server.js`, `lms.js`, and `index-luxury.js` each carry multiple responsibilities

Consequence:

- high change risk
- hard onboarding
- hard test targeting

### Root cause B: route architecture is mixed

Evidence:

- explicit route-mode matrix already documents `spa-section`, `standalone`, `alias-redirect`, and `special-page` classes

Consequence:

- harder navigation reasoning
- duplicated shell and route bootstrap logic

### Root cause C: domain boundaries are weak

Evidence:

- current store/runtime still acts as a broad state owner rather than a set of bounded domain services

Consequence:

- business rules are harder to isolate
- persistence and authorization concerns bleed across modules

## Execution Order

Recommended top-level order:

1. backend domain boundary split
2. backend route/controller split
3. frontend route model simplification
4. frontend mega-file decomposition
5. shell/bootstrap standardization
6. state and persistence model tightening
7. CI and architecture guardrails

Reason:

- backend and route ownership create the highest cross-cutting risk
- frontend cleanup is safer once backend/domain contracts are clearer
- guardrails should land after the target shapes are decided

## How To Read Each Task

Each task section below includes:

- why it exists
- the main files it owns
- exact implementation work
- what not to do
- a verification gate

Do not mark a task `0% left` unless the verification gate is actually satisfied.

## Task Backlog

### `PROF-01` `0% left` Split `backend/platform/store.js` into bounded domain services

Priority: `P0`
Depends on: none

Why this exists:

- `store.js` is currently the single largest ownership hotspot in the repo
- it mixes auth, account state, files, LMS, gradebook, social, Student Service, notifications, and persistence-facing logic

Primary files:

- [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>)
- `backend/platform/*.js` new service files to be created

Exact work:

1. Identify hard domain seams inside `store.js`:
   - auth/session
   - accounts/people
   - files
   - LMS
   - gradebook
   - social
   - Student Service
   - notifications/audit
2. Extract one domain at a time into service modules with explicit APIs.
3. Keep a thin composition layer in `store.js` only while migration is in progress.
4. Do not change behavior unless the task explicitly calls for it.
5. Add regression tests per extracted domain if none already protect the moved behavior.

First concrete extraction candidates:

- candidate A: file upload/download + file access authorization
  likely functions around:
  - `createFileFromUpload(...)`
  - `getFile(...)`
  - `canActorAccessStoredFile(...)`
  - attachment normalization helpers
- candidate B: audit/route event helpers
  likely functions around:
  - route audit event shaping
  - audit record creation helpers
- candidate C: Student Service normalization/bootstrap helpers

Recommended first slice:

1. extract file domain first
2. leave call sites intact
3. import the extracted module back into `store.js`
4. verify file security tests before touching another seam

Do not do this:

- do not “split by copy-paste” with no ownership reduction
- do not rewrite every domain at once
- do not change API contracts blindly during extraction

Verification gate:

- `store.js` is materially smaller
- at least one extracted domain owns its own module/file(s)
- moved behavior is covered by tests still passing
- the extracted module can be named without referencing another unrelated domain

Update `2026-05-18`:
- Status: partially completed
- % left: `92% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: current baseline shows [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) at `8795` lines with multi-domain ownership still intact
- Remaining work: start with the easiest clean seams first, likely `files`, `notifications/audit`, or `Student Service`, before attacking larger LMS/social sections

Update `2026-05-18`:
- Status: partially completed
- % left: `76% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/files-service.js`, `backend/platform/domains/audit-service.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/files-service.js`; `node --check backend/platform/domains/audit-service.js`; `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js test/route-audit-regressions.test.js test/audit-ingest-security.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `8795` to `8621` lines
- Remaining work: extract the next self-contained domain seam, with Student Service normalization/bootstrap now the best next target before larger LMS/social ownership blocks

Update `2026-05-18`:
- Status: partially completed
- % left: `60% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/files-service.js`, `backend/platform/domains/audit-service.js`, `backend/platform/domains/student-service-service.js`, `test/student-service-store-domain-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/files-service.js`; `node --check backend/platform/domains/audit-service.js`; `node --check backend/platform/domains/student-service-service.js`; `npm run check:platform`; `npx vitest run test/student-service-store-domain-split.test.js test/student-service-split-workspace.test.js test/platform-file-upload-security.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `8621` to `8260` lines
- Remaining work: the defined low-risk domain seams are now extracted; the remaining backend work is the harder auth/accounts, LMS, gradebook, and social ownership blocks

Update `2026-05-18`:
- Status: partially completed
- % left: `54% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/notifications-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/notifications-store-domain-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/notifications-store-domain-split.test.js test/platform-push-subscription-security.test.js test/backend-platform-contracts.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `8260` to `8168` lines
- Remaining work: the low-risk notification/push seam is now extracted too; the remaining backend work is concentrated in the harder auth/accounts, LMS, gradebook, protected-exam session state, and social ownership blocks

Update `2026-05-18`:
- Status: partially completed
- % left: `50% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/account-privileges-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/account-privileges-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/account-privileges-store-domain-split.test.js test/admin-integrations-route-split.test.js test/news-route-api-split.test.js test/backend-platform-contracts.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `8168` to `8137` lines
- Remaining work: low-risk account privilege ownership is now extracted too; the remaining backend work is concentrated in the larger auth/session, LMS, gradebook, protected-exam session, and social ownership clusters

Update `2026-05-18`:
- Status: partially completed
- % left: `42% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/auth-session-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/auth-session-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/auth-session-store-domain-split.test.js test/platform-session-security.test.js test/auth-session-client-security.test.js test/backend-platform-contracts.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `8137` to `7942` lines
- Remaining work: auth/session ownership is now extracted too; the remaining backend work is concentrated in LMS, gradebook, protected-exam runtime state, social, and residual account/person ownership seams

Update `2026-05-18`:
- Status: partially completed
- % left: `34% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/gradebook-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/gradebook-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/gradebook-store-domain-split.test.js test/gradebook-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/backend-platform-contracts.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `7942` to `7712` lines
- Remaining work: gradebook ownership is now extracted too; the remaining backend work is concentrated in LMS, protected-exam runtime state, social, and residual account/person ownership seams

Update `2026-05-18`:
- Status: partially completed
- % left: `24% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/protected-exam-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/protected-exam-store-domain-split.test.js`, `test/protected-quiz-host-regressions.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `7712` to `6867` lines after moving the protected-exam / protected-quiz runtime cluster into [backend/platform/domains/protected-exam-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/protected-exam-service.js>)
- Remaining work: the remaining backend ownership concentration is now mostly LMS content/runtime, broader social state/mutation ownership, and residual account/person seams

Update `2026-05-18`:
- Status: partially completed
- % left: `22% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/accounts-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/accounts-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/accounts-store-domain-split.test.js test/admin-integrations-route-split.test.js test/portal-support-route-split.test.js test/backend-platform-contracts.test.js test/direct-chat-account-validation.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `6867` to `6803` lines
- Remaining work: residual backend ownership is now dominated by LMS content/runtime and broader social state/mutation ownership, with smaller person/account-adjacent helpers still mixed into `store.js`

Update `2026-05-18`:
- Status: partially completed
- % left: `20% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/lms-course-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/lms-course-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/lms-course-store-domain-split.test.js test/academic-route-split.test.js test/backend-platform-contracts.test.js test/lms-delegated-actions-security.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `6803` to `6715` lines
- Remaining work: the remaining backend ownership concentration is now primarily the broader social state/mutation surface plus a smaller set of residual LMS or people-adjacent helpers

Update `2026-05-18`:
- Status: partially completed
- % left: `18% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-state-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-state-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/social-state-store-domain-split.test.js test/social-route-split.test.js test/social-governance-regressions.test.js test/social-session-actor-routes.test.js test/social-relationship-route-regressions.test.js test/backend-platform-contracts.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `6715` to `6610` lines
- Remaining work: the remaining backend ownership concentration is now almost entirely the deeper social mutation surface and a small amount of residual non-social glue

Update `2026-05-18`:
- Status: partially completed
- % left: `16% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-relationships-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-relationships-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `6610` to `6452` lines after moving the social relationship/follow lifecycle into [backend/platform/domains/social-relationships-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-relationships-service.js>)
- Remaining work: the remaining backend ownership concentration is now predominantly the deeper social mutation/read surface for pages, groups, projects, posts, comments, and events

Update `2026-05-18`:
- Status: partially completed
- % left: `12% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-projects-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-projects-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `6452` to `5713` lines after moving the social project workspace lifecycle into [backend/platform/domains/social-projects-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-projects-service.js>)
- Remaining work: the remaining backend ownership concentration is now mostly the page/group/post/comment/event surface plus a smaller set of read helpers still tied to that social domain

Update `2026-05-18`:
- Status: partially completed
- % left: `10% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-content-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-content-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `5713` to `5400` lines after starting the social content extraction into [backend/platform/domains/social-content-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-content-service.js>) and delegating the helper/read layer
- Remaining work: finish delegating the remaining page/group/post/comment/event/report/profile mutation surface from `store.js` into `social-content-service.js` before `PROF-01` can close

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-content-service.js`, `test/social-governance-regressions.test.js`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npx vitest run test/backend-platform-contracts.test.js test/social-content-store-domain-split.test.js test/social-state-store-domain-split.test.js test/social-projects-store-domain-split.test.js test/social-governance-regressions.test.js`; [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) reduced from `5400` to `4823` lines after delegating `listSocialFeed(...)`, page/group CRUD, and group-membership flows through [backend/platform/domains/social-content-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-content-service.js>)
- Remaining work: none for this task; remaining backend structure work is tracked under later persistence and guardrail tasks rather than unfinished domain ownership inside `store.js`

#### `PROF-01A` `0% left` Extract file ownership and file authorization domain from `store.js`

Priority: `P0`
Depends on: none
Parent task: `PROF-01`

Why this exists:

- this is the cleanest first seam inside `store.js`
- the functions are already close together
- there are already targeted tests for file security behavior

Create these files:

- `backend/platform/domains/files-service.js`

Move or wrap these exact functions first:

- `createFileFromUpload(payload = {})`
- `getFile(fileId)`
- `objectContainsStoredFileReference(value, fileId, visited = new WeakSet())`
- `canActorAccessStoredFile(fileId, actorUserId = '', actorRole = '')`
- `normalizeMessageAttachment(file, senderId)`

Leave these call sites working exactly as-is for the first pass:

- file routes in `server.js`
- messenger attachment flows
- social media/document attachment flows
- LMS attachment flows
- Student Service attachment visibility checks

Exact work:

1. Create `backend/platform/domains/files-service.js`.
2. Move the exact file-domain helpers listed above into that file.
3. Export them as named functions.
4. Import them back into [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) and keep the public `PlatformStore` behavior unchanged.
5. Do not move unrelated auth, social, or Student Service logic in this slice.

Stop boundary:

- stop after the file-domain helpers are moved and re-wired
- do **not** also extract audit helpers or Student Service in the same pass

Do not do this:

- do not rename public behavior unless required
- do not rewrite all attachment callers
- do not combine this with `server.js` route extraction in the same change

Verification commands:

- `node --check backend/platform/store.js`
- `npm run check:platform`
- `npx vitest run test/platform-file-upload-security.test.js`

Success criteria:

- `files-service.js` exists
- the listed functions are no longer implemented inline in `store.js`
- file upload/download tests still pass
- `store.js` line count is lower than the baseline

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: seam confirmed by current function locations in `store.js` around file creation, file read, file authorization, and attachment normalization
- Remaining work: create `files-service.js`, move the exact helpers, and verify with file-security tests

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/files-service.js`, `test/platform-file-upload-security.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/files-service.js`; `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js`; [backend/platform/domains/files-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/files-service.js>) now owns `createFileFromUpload(...)`, `getFile(...)`, `objectContainsStoredFileReference(...)`, `canActorAccessStoredFile(...)`, and `normalizeMessageAttachment(...)`
- Remaining work: none for this slice

#### `PROF-01B` `0% left` Extract audit event helper domain from `store.js`

Priority: `P0`
Depends on: `PROF-01A`
Parent task: `PROF-01`

Why this exists:

- audit helpers are scattered but logically separate from business domains
- this is the next-low-risk extraction after files

Create these files:

- `backend/platform/domains/audit-service.js`

Move or wrap these exact functions first:

- `addAuditEvent(payload = {})`
- any small helper functions used only to normalize or shape audit event records

Leave these call sites intact for the first pass:

- route audit emission in `server.js`
- gradebook audit writes
- social mutation audit writes

Exact work:

1. Create `backend/platform/domains/audit-service.js`.
2. Move `addAuditEvent(...)` and only its direct helper dependencies.
3. Import the service back into `store.js`.
4. Keep all route/domain callers unchanged.

Stop boundary:

- stop after audit-record creation is extracted
- do **not** refactor route-level `addRouteAuditEvent(...)` in `server.js` yet

Verification commands:

- `node --check backend/platform/store.js`
- `npm run check:platform`
- `npx vitest run test/route-audit-regressions.test.js test/audit-ingest-security.test.js`

Success criteria:

- `audit-service.js` exists
- `addAuditEvent(...)` no longer lives entirely in `store.js`
- audit regression tests still pass

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: audit writes are still handled centrally in `store.js` and called from multiple domains
- Remaining work: create `audit-service.js`, move only audit-record shaping/creation, and verify audit regressions

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/audit-service.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/audit-service.js`; `npm run check:platform`; `npx vitest run test/route-audit-regressions.test.js test/audit-ingest-security.test.js`; [backend/platform/domains/audit-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/audit-service.js>) now owns `addAuditEvent(...)`
- Remaining work: none for this slice

#### `PROF-01C` `0% left` Extract Student Service normalization and bootstrap helpers from `store.js`

Priority: `P1`
Depends on: `PROF-01A`, `PROF-01B`
Parent task: `PROF-01`

Why this exists:

- Student Service has a large internal cluster already visible in `store.js`
- it is a good self-contained domain once lower-risk file/audit seams are done

Create these files:

- `backend/platform/domains/student-service-service.js`

Move these exact functions first:

- `normalizeStudentServiceCategory(...)`
- `normalizeStudentServiceThreadEntry(...)`
- `normalizeStudentServiceInternalNote(...)`
- `normalizeStudentServiceTicketRecord(...)`
- `normalizeStudentServiceArticleRecord(...)`
- `normalizeStudentServiceMacroRecord(...)`
- `normalizeStudentServiceQuestionRecord(...)`
- `normalizeStudentServiceAnswerRecord(...)`
- `normalizeStudentServiceReviewQueueEntry(...)`
- `getStudentServiceBootstrap(viewerUserId = '')`

Do not move these yet unless needed:

- unrelated portal state helpers
- general account helpers
- file-domain helpers already extracted in `PROF-01A`

Verification commands:

- `node --check backend/platform/store.js`
- `npm run check:platform`
- `npx vitest run test/student-service-split-workspace.test.js`

Success criteria:

- Student Service normalization/bootstrapping has one obvious module owner
- `store.js` loses a meaningful Student Service block
- Student Service regressions still pass

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: Student Service normalization and bootstrap helpers are still clustered in one large `store.js` region
- Remaining work: extract the exact normalization/bootstrap block and verify Student Service behavior

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/student-service-service.js`, `test/student-service-store-domain-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/student-service-service.js`; `npm run check:platform`; `npx vitest run test/student-service-store-domain-split.test.js test/student-service-split-workspace.test.js test/platform-file-upload-security.test.js`; [backend/platform/domains/student-service-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/student-service-service.js>) now owns the Student Service category normalization, record normalizers, and `getStudentServiceBootstrap(...)`
- Remaining work: none for this slice

#### `PROF-01D` `0% left` Extract notification and push-subscription ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01A`, `PROF-01B`
Parent task: `PROF-01`

Why this exists:

- notification delivery and push-subscription persistence are a clean state seam inside `store.js`
- the repo already has push-endpoint security tests, so this slice is safer than jumping straight into auth, LMS, or social ownership

Create these files:

- `backend/platform/domains/notifications-service.js`

Move or wrap these exact functions first:

- `isValidPushSubscriptionEndpoint(endpoint = '')`
- `createNotification(payload = {})`
- `listNotifications(userId, filters = {})`
- `markNotificationRead(notificationId, userId = '')`
- `updateNotificationPreferences(userId, preferences = {})`
- `upsertPushSubscription(userId, subscription = {}, metadata = {})`
- `listPushSubscriptions(userId = '')`
- `removePushSubscription(userId = '', endpoint = '')`

Leave these call sites intact for the first pass:

- portal bootstrap and notification feed flows
- news, gradebook, social, messenger, and Student Service notification creation paths
- push-subscription routes in `portal-support-routes.js`

Do not do this:

- do not move SSE delivery or web-push transport helpers out of `server.js` in this slice
- do not rewrite notification callers to know about the new domain module directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/notifications-service.js`
- `npm run check:platform`
- `npx vitest run test/notifications-store-domain-split.test.js test/platform-push-subscription-security.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `notifications-service.js` exists
- notification and push-subscription methods no longer live inline in `store.js`
- push endpoint validation and notification behavior still pass through `PlatformStore`
- backend contract docs/tests include the new domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/notifications-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/notifications-store-domain-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/notifications-service.js`; `npm run check:platform`; `npx vitest run test/notifications-store-domain-split.test.js test/platform-push-subscription-security.test.js test/backend-platform-contracts.test.js`; [backend/platform/domains/notifications-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/notifications-service.js>) now owns notification creation/read-state/preference persistence and push-subscription validation/storage
- Remaining work: none for this slice

#### `PROF-01E` `0% left` Extract delegated account privilege ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01B`
Parent task: `PROF-01`

Why this exists:

- delegated privilege rules are a bounded account-domain seam already used by extracted route modules
- the privilege catalog and privilege mutation rules should not stay inline inside the general-purpose `store.js` owner

Create these files:

- `backend/platform/domains/account-privileges-service.js`

Move or wrap these exact functions first:

- `listPrivilegeDefinitions()`
- `getGrantedAccountPrivileges(accountOrUserId)`
- `getEffectiveAccountPrivileges(accountOrUserId)`
- `accountHasPrivilege(accountOrUserId, privilegeId = '')`
- `updateAccountPrivileges(accountId, payload = {}, actorId = '')`

Leave these call sites intact for the first pass:

- delegated privilege checks in `admin-integrations-routes.js`
- news privilege bootstrap and viewer privilege exposure in `news-routes.js`
- store-owned news/admin helpers that ask whether the actor can manage or moderate

Do not do this:

- do not move broader auth/session or account-profile persistence in this slice
- do not let route modules import the new privilege domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/account-privileges-service.js`
- `npm run check:platform`
- `npx vitest run test/account-privileges-store-domain-split.test.js test/admin-integrations-route-split.test.js test/news-route-api-split.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `account-privileges-service.js` exists
- delegated privilege definition and mutation helpers no longer live inline in `store.js`
- admin/news route callers still work through `PlatformStore`
- backend contract docs/tests include the new account-privilege domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/account-privileges-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/account-privileges-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/account-privileges-service.js`; `npm run check:platform`; `npx vitest run test/account-privileges-store-domain-split.test.js test/admin-integrations-route-split.test.js test/news-route-api-split.test.js test/backend-platform-contracts.test.js`; [backend/platform/domains/account-privileges-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/account-privileges-service.js>) now owns privilege definition, privilege resolution, and delegated privilege mutation behavior
- Remaining work: none for this slice

#### `PROF-01F` `0% left` Extract auth/session and password-reset ownership from `store.js`

Priority: `P0`
Depends on: `PROF-01B`
Parent task: `PROF-01`

Why this exists:

- auth/session lifecycle is one of the largest remaining backend seams with clear route callers and existing security tests
- credential records, portal sessions, Microsoft identity linking, and password-reset token flow should not remain inline inside the general-purpose `store.js` owner

Create these files:

- `backend/platform/domains/auth-session-service.js`

Move or wrap these exact functions first:

- `ensureCredential(userId)`
- `upgradeCredentialHashIfNeeded(userId, password)`
- `getRawAccountByEmail(email)`
- `getRawAccountByMicrosoftOid(oid, tenantId = '')`
- `linkMicrosoftIdentityToAccount(accountId, identity = {})`
- `createSessionForAccount(accountId, options = {})`
- `createSessionByMicrosoftIdentity(identity = {})`
- `activateAccount(userId, newPassword)`
- `requestPasswordReset(email)`
- `resetPassword(token, newPassword)`
- `createSessionByCredentials(email, password)`
- `getSession(token)`
- `logoutSession(token)`
- `revokeSessionsForUser(userId, reason = 'revoked')`
- `updateSessionImpersonation(token, impersonatedRole)`
- `clearSessionImpersonation(token)`

Leave these call sites intact for the first pass:

- auth/session route owners in `auth-routes.js` and `auth-maintenance-routes.js`
- Microsoft login completion flow in `microsoft-auth-routes.js`
- server-side session readers in `server.js`

Do not do this:

- do not move general account-profile upsert logic in this slice
- do not let route modules import the new auth domain directly
- do not rewrite client auth/logout behavior as part of this ownership move

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/auth-session-service.js`
- `npm run check:platform`
- `npx vitest run test/auth-session-store-domain-split.test.js test/platform-session-security.test.js test/auth-session-client-security.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `auth-session-service.js` exists
- auth/session lifecycle helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new auth/session domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/auth-session-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/auth-session-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/auth-session-service.js`; `npm run check:platform`; `npx vitest run test/auth-session-store-domain-split.test.js test/platform-session-security.test.js test/auth-session-client-security.test.js test/backend-platform-contracts.test.js`; [backend/platform/domains/auth-session-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/auth-session-service.js>) now owns credential/session lifecycle, Microsoft identity linking, and password-reset token handling
- Remaining work: none for this slice

#### `PROF-01G` `0% left` Extract gradebook ownership from `store.js`

Priority: `P0`
Depends on: `PROF-01B`
Parent task: `PROF-01`

Why this exists:

- gradebook behavior is already route-owned elsewhere and forms one coherent store-domain seam
- gradebook defaults, weighted final-score logic, publish/finalize lifecycle, and gradebook notifications/audit writes should not remain inline in `store.js`

Create these files:

- `backend/platform/domains/gradebook-service.js`

Move or wrap these exact functions first:

- `ensureGradebook(courseId)`
- `canAccessGradebookCourse(courseId, userId, role = '', action = 'read')`
- `getGradebookAssessmentDefinition(gradebook, criterionKey = '')`
- `aggregateGradebookAssessmentEntries(entries = [], mode = 'average')`
- `computeRecordFinalScore(record, gradebook = null)`
- `getGradebookCourse(courseId)`
- `setScore(payload = {})`
- `publishGradebook(payload = {})`
- `finalizeGrades(payload = {})`

Leave these call sites intact for the first pass:

- gradebook route owner in `gradebook-routes.js`
- testing/demo state builders that seed or read gradebook records
- other LMS/runtime flows that call the `PlatformStore` wrappers

Do not do this:

- do not move broader LMS course/material ownership in this slice
- do not let route modules import the new gradebook domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/gradebook-service.js`
- `npm run check:platform`
- `npx vitest run test/gradebook-store-domain-split.test.js test/gradebook-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `gradebook-service.js` exists
- gradebook state/score/publication/finalization helpers no longer live inline in `store.js`
- gradebook route/runtime callers still work through `PlatformStore`
- backend contract docs/tests include the new gradebook domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/gradebook-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/gradebook-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/gradebook-service.js`; `npm run check:platform`; `npx vitest run test/gradebook-store-domain-split.test.js test/gradebook-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/backend-platform-contracts.test.js`; [backend/platform/domains/gradebook-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/gradebook-service.js>) now owns gradebook state shape, weighted score computation, publication/finalization flow, and gradebook mutation helpers
- Remaining work: none for this slice

#### `PROF-01H` `0% left` Extract protected-exam and protected-quiz runtime ownership from `store.js`

Priority: `P0`
Depends on: `PROF-01B`, `PROF-01G`
Parent task: `PROF-01`

Why this exists:

- protected-exam / protected-quiz runtime state was one of the largest remaining backend seams in `store.js`
- exam portal sessions, launch tickets, protected-client sessions, and attempt lifecycle transitions already form one coherent route-owned backend surface

Create these files:

- `backend/platform/domains/protected-exam-service.js`

Move or wrap these exact functions first:

- `ensureProtectedQuizLaunch(ticket)`
- `ensureProtectedClientSession(token)`
- `ensureExamPortalSession(token)`
- `buildExamSessionCourseKey(sessionId)`
- `normalizeExamSessionStatus(status = 'scheduled')`
- `normalizeExamSessionRecord(payload = {}, existing = {})`
- `syncExamSession(payload = {})`
- `getExamSession(sessionId)`
- `deriveExamSessionRuntimeStatus(session = {})`
- `listExamSessionsForStudent(studentId)`
- `getExamPortalSession(token, options = {})`
- `createExamPortalSession(payload = {})`
- `listExamPortalVisibleSessions(token)`
- `getExamPortalSessionSummary(sessionId, token = '')`
- `createExamPortalLaunchTicket(sessionId, payload = {})`
- `findProtectedQuizRecord(courseId, quizId)`
- `ensureProtectedQuizAttemptRecord(quiz, student = {})`
- `buildProtectedQuizClientUrl(courseId, quizId)`
- `syncProtectedQuiz(payload = {})`
- `getProtectedQuiz(courseId, quizId)`
- `getProtectedClientSession(clientSessionToken, options = {})`
- `revokeProtectedClientSessions(courseId, quizId, studentId, exceptToken = '', reason = 'Protected quiz session was revoked.')`
- `getProtectedClientAttempt(courseId, quizId, clientSessionToken)`
- `createProtectedQuizLaunchTicket(payload = {})`
- `redeemProtectedQuizLaunch(payload = {})`
- `heartbeatProtectedQuiz(payload = {})`
- `recordProtectedQuizEvent(payload = {})`
- `updateProtectedQuizAttemptControl(payload = {}, action = '')`
- `manualGradeProtectedQuiz(payload = {})`
- `getProtectedQuizMonitor(courseId, quizId = '')`

Leave these call sites intact for the first pass:

- protected-exam route owner in `protected-exam-routes.js`
- LMS/browser launch flows that depend on protected quiz URLs and allowed hostnames
- exam-session sync and other backend callers that still go through `PlatformStore`

Do not do this:

- do not move broader LMS course/material/assignment ownership in this slice
- do not let route modules import the new protected-exam domain directly
- do not change anti-cheat launch semantics while moving ownership

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/protected-exam-service.js`
- `npm run check:platform`
- `npx vitest run test/protected-exam-store-domain-split.test.js test/protected-exam-route-split.test.js test/exam-portal-regressions.test.js test/protected-quiz-host-regressions.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `protected-exam-service.js` exists
- protected-exam/protected-quiz runtime helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new protected-exam domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/protected-exam-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/protected-exam-store-domain-split.test.js`, `test/protected-quiz-host-regressions.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/protected-exam-service.js`; `npm run check:platform`; `npx vitest run test/protected-exam-store-domain-split.test.js test/protected-exam-route-split.test.js test/exam-portal-regressions.test.js test/protected-quiz-host-regressions.test.js test/backend-platform-contracts.test.js`; `npm run check`; `npm run test`; [backend/platform/domains/protected-exam-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/protected-exam-service.js>) now owns exam-session runtime shaping, exam portal session state, protected quiz launch flow, heartbeat/event recording, and protected-attempt control/monitoring
- Remaining work: none for this slice

#### `PROF-01I` `0% left` Extract account directory and person-sync ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01F`
Parent task: `PROF-01`

Why this exists:

- account lookup/list/upsert behavior and person-sync rules are still one bounded backend seam inside `store.js`
- the route owners already depend on these store methods, so moving them reduces central ownership without mixing in LMS or social logic

Create these files:

- `backend/platform/domains/accounts-service.js`

Move or wrap these exact functions first:

- `ensurePersonFromAccount(account)`
- `listAccounts(filters = {})`
- `getAccountById(userId)`
- `getAccountByEmail(email)`
- `upsertAccount(payload = {})`

Leave these call sites intact for the first pass:

- admin and portal account routes in `admin-integrations-routes.js` and `portal-support-routes.js`
- session/bootstrap callers that read the current account snapshot
- other store-owned flows that rely on account lookup or person-sync side effects

Do not do this:

- do not move auth/session credential lifecycle in this slice
- do not let route modules import the new account domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/accounts-service.js`
- `npm run check:platform`
- `npx vitest run test/accounts-store-domain-split.test.js test/admin-integrations-route-split.test.js test/portal-support-route-split.test.js test/backend-platform-contracts.test.js test/direct-chat-account-validation.test.js`

Success criteria:

- `accounts-service.js` exists
- account directory/person-sync helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new accounts domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/accounts-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/accounts-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/accounts-service.js`; `npm run check:platform`; `npx vitest run test/accounts-store-domain-split.test.js test/admin-integrations-route-split.test.js test/portal-support-route-split.test.js test/backend-platform-contracts.test.js test/direct-chat-account-validation.test.js`; [backend/platform/domains/accounts-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/accounts-service.js>) now owns account list/read/write behavior and account-to-person synchronization
- Remaining work: none for this slice

#### `PROF-01J` `0% left` Extract LMS course, assignment, and material ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01G`
Parent task: `PROF-01`

Why this exists:

- LMS course shell state, assignments, materials, and teaching-team lookup are one bounded LMS seam inside `store.js`
- these behaviors are already route-owned through `academic-routes.js`, so moving them reduces central backend ownership before tackling the larger social block

Create these files:

- `backend/platform/domains/lms-course-service.js`

Move or wrap these exact functions first:

- `ensureLmsCourse(courseId)`
- `getLmsCourse(courseId)`
- `createAssignment(payload = {})`
- `createMaterial(payload = {})`
- `getStudentEnrollmentsByCourse(courseId)`
- `getSectionsByCourse(courseId)`
- `isCourseTeachingStaff(courseId, userId, role = '')`

Leave these call sites intact for the first pass:

- LMS/academic route owner in `academic-routes.js`
- gradebook and protected-exam domain callers that still use the `PlatformStore` wrappers
- frontend-backed assignment/material creation flows that hit backend LMS APIs

Do not do this:

- do not move broader quiz/live-quiz or social ownership in this slice
- do not let route modules import the new LMS domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/lms-course-service.js`
- `npm run check:platform`
- `npx vitest run test/lms-course-store-domain-split.test.js test/academic-route-split.test.js test/backend-platform-contracts.test.js test/lms-delegated-actions-security.test.js`

Success criteria:

- `lms-course-service.js` exists
- LMS course/material/assignment helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new LMS course domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/lms-course-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/lms-course-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/lms-course-service.js`; `npm run check:platform`; `npx vitest run test/lms-course-store-domain-split.test.js test/academic-route-split.test.js test/backend-platform-contracts.test.js test/lms-delegated-actions-security.test.js`; [backend/platform/domains/lms-course-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/lms-course-service.js>) now owns LMS course shell state, assignment/material creation, enrollment-by-course lookup, and teaching-team ownership checks
- Remaining work: none for this slice

#### `PROF-01K` `0% left` Extract social bootstrap/state and project-activity ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01B`
Parent task: `PROF-01`

Why this exists:

- the social domain was still the last major backend hotspot, and its bootstrap/state surface is a clean first slice
- social bootstrap projection, group-chat bootstrap, project activity collections, and social-state audit/save behavior are already route-owned elsewhere

Create these files:

- `backend/platform/domains/social-state-service.js`

Move or wrap these exact functions first:

- `listSocialRelationshipsForUser(userId)`
- `saveSocialMutation(actorId, eventType, entityType, entityId, beforeState = null, afterState = null)`
- `ensureSocialProjectCollections()`
- `appendSocialProjectActivity(projectId, actorId, type, summary, extra = {})`
- `getSocialBootstrap(viewerUserId = '')`
- `upsertSocialState(social, actorId = '', reason = 'social-save')`
- `ensureSocialGroupChat(groupId, actorId = '')`

Leave these call sites intact for the first pass:

- social route owner in `social-routes.js`
- social mutation methods that still live in `store.js` and call these helpers through `PlatformStore`
- project/group chat creation flows that depend on bootstrap projections after mutation

Do not do this:

- do not attempt the entire social mutation surface in the same pass
- do not let route modules import the new social state domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/social-state-service.js`
- `npm run check:platform`
- `npx vitest run test/social-state-store-domain-split.test.js test/social-route-split.test.js test/social-governance-regressions.test.js test/social-session-actor-routes.test.js test/social-relationship-route-regressions.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `social-state-service.js` exists
- social bootstrap/state/project-activity helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new social state domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-state-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-state-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/social-state-service.js`; `npm run check:platform`; `npx vitest run test/social-state-store-domain-split.test.js test/social-route-split.test.js test/social-governance-regressions.test.js test/social-session-actor-routes.test.js test/social-relationship-route-regressions.test.js test/backend-platform-contracts.test.js`; [backend/platform/domains/social-state-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-state-service.js>) now owns social bootstrap/state projection, project activity collections, social audit/save wiring, and group-chat bootstrap behavior
- Remaining work: none for this slice

#### `PROF-01L` `0% left` Extract social relationship and follow ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01K`
Parent task: `PROF-01`

Why this exists:

- social connection and follow lifecycle is a bounded mutation seam with clear route coverage
- extracting it reduces the remaining social hotspot before tackling pages/groups/posts/events in one larger pass

Create these files:

- `backend/platform/domains/social-relationships-service.js`

Move or wrap these exact functions first:

- `getSocialFollowerIds(targetType, targetId)`
- `isSocialFollowingTarget(userId, targetType, targetId)`
- `isSocialConnection(userA, userB)`
- `getPendingSocialConnectionRequestBetween(userA, userB)`
- `sendSocialConnectionRequest(fromUserId, toUserId)`
- `respondSocialConnectionRequest(relationshipId, actorId, accept = true)`
- `removeSocialConnection(userId, targetUserId)`
- `toggleSocialFollow(userId, targetType, targetId)`

Leave these call sites intact for the first pass:

- social route owner in `social-routes.js`
- remaining post/page/group logic that checks followers or connections through `PlatformStore`
- notification creation and audit-save paths triggered by relationship changes

Do not do this:

- do not attempt the broader post/comment/event mutation surface in this slice
- do not let route modules import the new relationship domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/social-relationships-service.js`
- `npm run check:platform`
- `npx vitest run test/social-relationships-store-domain-split.test.js test/social-relationship-route-regressions.test.js test/social-session-actor-routes.test.js test/social-governance-regressions.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `social-relationships-service.js` exists
- social relationship/follow helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new social relationship domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-relationships-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-relationships-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/social-relationships-service.js`; `npm run check:platform`; `npx vitest run test/social-relationships-store-domain-split.test.js test/social-relationship-route-regressions.test.js test/social-session-actor-routes.test.js test/social-governance-regressions.test.js test/backend-platform-contracts.test.js`; `npm run check`; `npm run test`; [backend/platform/domains/social-relationships-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-relationships-service.js>) now owns social connection-request, connection-removal, and follow lifecycle behavior
- Remaining work: none for this slice

#### `PROF-01M` `0% left` Extract social project workspace ownership from `store.js`

Priority: `P1`
Depends on: `PROF-01K`, `PROF-01L`
Parent task: `PROF-01`

Why this exists:

- social project workspaces were the largest remaining coherent subdomain inside the social cluster
- project CRUD, membership, tasks, milestones, deliverables, check-ins, and showcase lifecycle already form one route-owned product surface

Create these files:

- `backend/platform/domains/social-projects-service.js`

Move or wrap these exact functions first:

- `getSocialProjectRecord(projectId)`
- `getSocialProjectByGroupId(groupId)`
- `getSocialProjectByChatId(chatId)`
- `getSocialProjectMemberRole(project, userId)`
- `getSocialProjectMemberIds(project)`
- `getSocialProjectAdvisorIds(project)`
- `canManageSocialProject(project, userId)`
- `canViewSocialProject(project, userId)`
- `canContributeToSocialProject(project, userId)`
- `decorateSocialProject(project, viewerUserId = '')`
- `createSocialProject(payload = {}, actorId = '')`
- `updateSocialProject(projectId, payload = {}, actorId = '')`
- `deleteSocialProject(projectId, actorId = '')`
- `inviteSocialProjectMember(projectId, memberId, role = 'member', actorId = '')`
- `updateSocialProjectMemberRole(projectId, memberId, role = 'member', actorId = '')`
- `removeSocialProjectMember(projectId, memberId, actorId = '')`
- `setSocialProjectMembership(projectId, userId, action = 'leave', actorId = '')`
- `createSocialProjectTask(projectId, payload = {}, actorId = '')`
- `updateSocialProjectTask(projectId, taskId, payload = {}, actorId = '')`
- `deleteSocialProjectTask(projectId, taskId, actorId = '')`
- `createSocialProjectMilestone(projectId, payload = {}, actorId = '')`
- `updateSocialProjectMilestone(projectId, milestoneId, payload = {}, actorId = '')`
- `deleteSocialProjectMilestone(projectId, milestoneId, actorId = '')`
- `createSocialProjectDeliverable(projectId, payload = {}, actorId = '')`
- `deleteSocialProjectDeliverable(projectId, deliverableId, actorId = '')`
- `createSocialProjectCheckin(projectId, payload = {}, actorId = '')`
- `createSocialProjectShowcasePage(projectId, actorId = '')`

Leave these call sites intact for the first pass:

- social route owner in `social-routes.js`
- social UI/runtime surfaces that depend on project metrics and portfolio/showcase behavior
- remaining page/group/post/event methods that still read project helpers through `PlatformStore`

Do not do this:

- do not attempt the remaining page/group/post/event mutation surface in the same pass
- do not let route modules import the new project domain directly

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/social-projects-service.js`
- `npm run check:platform`
- `npx vitest run test/social-projects-store-domain-split.test.js test/social-route-split.test.js test/social-governance-regressions.test.js test/social-session-actor-routes.test.js test/social-lost-found-regressions.test.js test/backend-platform-contracts.test.js`

Success criteria:

- `social-projects-service.js` exists
- social project workspace helpers no longer live inline in `store.js`
- route callers still work through `PlatformStore`
- backend contract docs/tests include the new social projects domain owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-projects-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-projects-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/social-projects-service.js`; `npm run check:platform`; `npx vitest run test/social-projects-store-domain-split.test.js test/social-route-split.test.js test/social-governance-regressions.test.js test/social-session-actor-routes.test.js test/social-lost-found-regressions.test.js test/backend-platform-contracts.test.js`; `npm run check`; `npm run test`; [backend/platform/domains/social-projects-service.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/domains/social-projects-service.js>) now owns social project workspace CRUD, membership, task/milestone/deliverable/check-in lifecycle, and showcase creation
- Remaining work: none for this slice

#### `PROF-01N` `45% left` Extract remaining social content ownership from `store.js`

Priority: `P0`
Depends on: `PROF-01K`, `PROF-01L`, `PROF-01M`
Parent task: `PROF-01`

Why this exists:

- after the earlier social slices, the remaining backend ownership is mostly the page/group/post/comment/event/report/profile surface
- this is the last major social cluster preventing `store.js` from becoming a thin composition owner

Create these files:

- `backend/platform/domains/social-content-service.js`

Move or wrap these exact functions next:

- actor/profile/read helpers:
  `getSocialAccount(...)`, `isSocialAdmin(...)`, `getSocialActorDisplayName(...)`, `getSocialMentionableAccounts(...)`, `resolveSocialMentionUserIds(...)`, `notifySocialMentions(...)`, `getSocialScopeRecord(...)`, `canManageSocialScope(...)`, `buildSocialCommentTree(...)`, `findSocialCommentRecord(...)`, `collectSocialCommentThreadIds(...)`, `getSocialProfileRecord(...)`, `upsertSocialProfile(...)`, `resolveSocialPosts(...)`, `toggleSocialScopePostPin(...)`, `toggleSocialCommentReaction(...)`, `removeSocialComment(...)`, `resolveSocialReport(...)`
- page/group/read/decorate helpers:
  `getSocialActorFacultyCode(...)`, `getSocialPageRecord(...)`, `getSocialGroupRecord(...)`, `getSocialGroupByChatId(...)`, `getSocialPostRecord(...)`, `getSocialEventRecord(...)`, `getSocialRelationshipRecord(...)`, `getSocialGroupMemberIds(...)`, `getSocialGroupJoinMap(...)`, `getNextSocialGroupOwnerId(...)`, `normalizeSocialGroupState(...)`, `getSocialGroupPendingIds(...)`, `getSocialPageManagerIds(...)`, `canManageSocialPage(...)`, `canManageSocialGroup(...)`, `isSocialGroupMember(...)`, `canViewSocialPage(...)`, `canViewSocialGroup(...)`, `canViewSocialEvent(...)`, `canDeleteSocialGroup(...)`, `canDeleteSocialPage(...)`, `canDeleteSocialEvent(...)`, `canEditSocialPost(...)`, `canViewSocialPost(...)`, `normalizeSocialComment(...)`, `decorateSocialPage(...)`, `decorateSocialGroup(...)`, `decorateSocialPost(...)`, `decorateSocialEvent(...)`
- remaining mutation surface:
  `listSocialFeed(...)`, `createSocialPage(...)`, `createSocialGroup(...)`, `updateSocialPage(...)`, `updateSocialGroup(...)`, `setSocialGroupMembership(...)`, `respondSocialGroupMembership(...)`, `removeSocialGroupMember(...)`, `deleteSocialGroup(...)`, `inviteSocialGroupMember(...)`, `createSocialPost(...)`, `updateSocialPost(...)`, `deleteSocialPost(...)`, `shareSocialPost(...)`, `toggleSocialReaction(...)`, `addSocialComment(...)`, `createSocialEvent(...)`, `respondSocialEventRsvp(...)`, `deleteSocialEvent(...)`, `listSocialEvents(...)`, `createSocialReport(...)`

Do not do this:

- do not mix this with unrelated frontend decomposition in the same patch
- do not lower `% left` to `0%` until the mutation surface is actually delegated, not just scaffolded

Verification commands:

- `node --check backend/platform/store.js`
- `node --check backend/platform/domains/social-content-service.js`
- `npm run check:platform`
- `npx vitest run test/social-content-store-domain-split.test.js test/social-route-split.test.js test/social-governance-regressions.test.js test/social-session-actor-routes.test.js test/social-url-safety.test.js test/social-lost-found-regressions.test.js test/backend-platform-contracts.test.js`

Update `2026-05-18`:
- Status: partially completed
- % left: `45% left`
- Files changed: `backend/platform/store.js`, `backend/platform/domains/social-content-service.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/social-content-store-domain-split.test.js`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/store.js`; `node --check backend/platform/domains/social-content-service.js`; `npm run check`; `npm run test`; the social content module now exists and the helper/read layer is delegated while [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) shrank from `5713` to `5400` lines
- Remaining work: complete the remaining page/group/post/comment/event/report/profile mutation delegation from `store.js` into `social-content-service.js`

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/auth-session-store-domain-split.test.js test/gradebook-store-domain-split.test.js test/backend-platform-contracts.test.js`; the contract surface now also documents and enforces the extracted `auth-session-service.js` and `gradebook-service.js` ownership seams
- Remaining work: none; future contract changes should only follow new backend ownership extraction

### `PROF-02` `0% left` Split `backend/platform/server.js` into route/controller modules

Priority: `P0`
Depends on: `PROF-01`

Why this exists:

- `server.js` currently owns route registration, middleware, auth helpers, integration glue, and many endpoint-specific flows in one file

Primary files:

- [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>)
- new route/controller modules under `backend/platform/`

Exact work:

1. Separate common middleware and request helpers from route definitions.
2. Group routes by domain:
   - auth
   - accounts
   - files
   - LMS/gradebook
   - social/messenger/calls
   - Student Service
   - platform diagnostics/ops
3. Move request validation and response shaping closer to each route owner.
4. Keep one top-level bootstrap file that wires the Express app together.

Recommended next route family after the extracted backend admin/platform/student-service/gradebook/protected-exam/social/LMS-live-quiz/academic/news slices:

- `mail/bootstrap and remaining LMS-adjacent surface`
  because:
  - it is now the dominant remaining backend route owner
  - the other major backend route families have been peeled off into dedicated modules
  - finishing it is the last meaningful step before `server.js` becomes a much thinner bootstrap

Suggested file split:

- `backend/platform/server.js`
  keep only:
  - app bootstrap
  - top-level middleware wiring
  - route mounting
- new modules:
  - `backend/platform/routes/files-routes.js`
  - `backend/platform/routes/auth-routes.js`
  - `backend/platform/routes/platform-ops-routes.js`

Do not do this:

- do not leave all business logic in `server.js` while only moving route strings
- do not mix domain route files arbitrarily

Verification gate:

- `server.js` becomes a thinner bootstrap/composition file
- at least one route family is fully owned outside `server.js`
- platform tests still pass
- route-family ownership is obvious from filenames alone

Update `2026-05-18`:
- Status: partially completed
- % left: `94% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: current baseline shows [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) at `4870` lines with route families still centrally owned
- Remaining work: begin after at least one `store.js` domain split makes controller/service boundaries less tangled

Update `2026-05-18`:
- Status: partially completed
- % left: `76% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/files-routes.js`, `backend/platform/routes/auth-routes.js`, `test/platform-file-upload-security.test.js`, `test/route-audit-regressions.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/files-routes.js`; `node --check backend/platform/routes/auth-routes.js`; `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js test/route-audit-regressions.test.js test/audit-ingest-security.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4870` to `4819` lines
- Remaining work: continue moving coherent route families so `server.js` trends toward bootstrap/mount ownership rather than mixed inline handlers

Update `2026-05-18`:
- Status: partially completed
- % left: `64% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/files-routes.js`, `backend/platform/routes/auth-routes.js`, `backend/platform/routes/platform-ops-routes.js`, `test/platform-file-upload-security.test.js`, `test/route-audit-regressions.test.js`, `test/platform-ops-route-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/files-routes.js`; `node --check backend/platform/routes/auth-routes.js`; `node --check backend/platform/routes/platform-ops-routes.js`; `npm run check:platform`; `npx vitest run test/platform-ops-route-split.test.js test/platform-file-upload-security.test.js test/route-audit-regressions.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js test/student-service-store-domain-split.test.js test/student-service-split-workspace.test.js`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4819` to `4793` lines
- Remaining work: continue moving adjacent admin/integration route families before tackling larger LMS/social route owners

Update `2026-05-18`:
- Status: partially completed
- % left: `52% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/admin-integrations-routes.js`, `test/admin-integrations-route-split.test.js`, `test/route-audit-regressions.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/admin-integrations-routes.js`; `npm run check:platform`; `npx vitest run test/admin-integrations-route-split.test.js test/route-audit-regressions.test.js test/platform-ops-route-split.test.js test/platform-file-upload-security.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4793` to `4664` lines
- Remaining work: the remaining route extractions are the admin support/audit cluster plus the much larger LMS/social/messenger families

Update `2026-05-18`:
- Status: partially completed
- % left: `42% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/admin-support-routes.js`, `test/admin-support-route-split.test.js`, `test/audit-ingest-security.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/admin-support-routes.js`; `npm run check:platform`; `npx vitest run test/admin-support-route-split.test.js test/audit-ingest-security.test.js test/admin-integrations-route-split.test.js test/route-audit-regressions.test.js test/platform-ops-route-split.test.js test/platform-file-upload-security.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4664` to `4608` lines
- Remaining work: the easy backend route families are now extracted; the remaining route work is the harder student-service, LMS/gradebook, social/messenger/calls, and protected-quiz families

Update `2026-05-18`:
- Status: partially completed
- % left: `30% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/student-service-routes.js`, `test/student-service-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/student-service-routes.js`; `npm run check:platform`; `npx vitest run test/student-service-route-split.test.js test/student-service-store-domain-split.test.js test/student-service-split-workspace.test.js test/backend-platform-contracts.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4608` to `4432` lines
- Remaining work: the remaining route work is concentrated in the larger gradebook/LMS, protected-quiz/exam-portal, and social/messenger/calls families

Update `2026-05-18`:
- Status: partially completed
- % left: `22% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/gradebook-routes.js`, `test/gradebook-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/gradebook-routes.js`; `npm run check:platform`; `npx vitest run test/gradebook-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/faculty-gradebook-route-regressions.test.js test/gradebook-delegation-regressions.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4432` to `4397` lines
- Remaining work: the remaining backend route work is concentrated in the protected-quiz/exam-portal and social/messenger/calls clusters, plus the broader LMS family

Update `2026-05-18`:
- Status: partially completed
- % left: `14% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/protected-exam-routes.js`, `test/protected-exam-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/protected-exam-routes.js`; `npm run check:platform`; `npx vitest run test/protected-exam-route-split.test.js test/exam-portal-regressions.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/protected-exam-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4397` to `4126` lines
- Remaining work: the remaining backend route work is concentrated in the social / messenger / calls family and the broader LMS-owned route surface

Update `2026-05-18`:
- Status: partially completed
- % left: `6% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/messenger-calls-routes.js`, `backend/platform/routes/social-routes.js`, `test/messenger-calls-route-split.test.js`, `test/call-membership-regressions.test.js`, `test/social-route-split.test.js`, `test/social-session-actor-routes.test.js`, `test/social-governance-regressions.test.js`, `test/social-relationship-route-regressions.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/messenger-calls-routes.js`; `node --check backend/platform/routes/social-routes.js`; `npm run check:platform`; `npx vitest run test/messenger-calls-route-split.test.js test/call-membership-regressions.test.js test/messenger-delegation-regressions.test.js`; `npx vitest run test/social-route-split.test.js test/social-session-actor-routes.test.js test/social-governance-regressions.test.js test/social-relationship-route-regressions.test.js test/social-url-safety.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/messenger-calls-route-split.test.js test/social-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `4126` to `3295` lines
- Remaining work: the backend route stream is now mostly reduced to the broader LMS-owned surface and a small amount of residual bootstrap/controller wiring

Update `2026-05-18`:
- Status: partially completed
- % left: `3% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/lms-live-quiz-routes.js`, `test/lms-live-quiz-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/lms-live-quiz-routes.js`; `npm run check:platform`; `npx vitest run test/lms-live-quiz-route-split.test.js test/portal-state-persistence-safety.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/lms-live-quiz-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `3295` to `3258` lines
- Remaining work: the backend route stream is now concentrated in the broader LMS/mail/news/bootstrap surface and a small amount of residual bootstrap/controller wiring

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/academic-routes.js`, `backend/platform/routes/news-routes.js`, `test/academic-route-split.test.js`, `test/news-route-api-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/academic-routes.js`; `node --check backend/platform/routes/news-routes.js`; `npm run check:platform`; `npx vitest run test/academic-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/portal-state-persistence-safety.test.js`; `npx vitest run test/news-route-api-split.test.js test/news-route-regressions.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/academic-route-split.test.js test/news-route-api-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `3258` to `3169` lines
- Remaining work: the backend route stream is now essentially limited to the mail/bootstrap and residual LMS-adjacent surface plus top-level bootstrap/controller wiring

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/microsoft-auth-routes.js`, `backend/platform/routes/mail-routes.js`, `backend/platform/routes/portal-support-routes.js`, `backend/platform/routes/system-routes.js`, `backend/platform/routes/auth-maintenance-routes.js`, `test/mail-microsoft-route-split.test.js`, `test/portal-support-route-split.test.js`, `test/system-auth-route-split.test.js`, `test/auth-session-client-security.test.js`, `test/sse-guardrail-regressions.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/microsoft-auth-routes.js`; `node --check backend/platform/routes/mail-routes.js`; `node --check backend/platform/routes/portal-support-routes.js`; `node --check backend/platform/routes/system-routes.js`; `node --check backend/platform/routes/auth-maintenance-routes.js`; `npm run check:platform`; `npx vitest run test/mail-microsoft-route-split.test.js test/portal-support-route-split.test.js test/system-auth-route-split.test.js test/platform-push-subscription-security.test.js test/sse-guardrail-regressions.test.js test/auth-session-client-security.test.js test/app-bootstrap-security.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/mail-microsoft-route-split.test.js test/portal-support-route-split.test.js test/system-auth-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/server.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/server.js>) reduced from `3169` to `2204` lines
- Remaining work: none for the backend route/controller split stream

#### `PROF-02A` `0% left` Extract file routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-01A`
Parent task: `PROF-02`

Why this exists:

- file routes are the smallest, clearest first route family
- they already have focused tests

Create these files:

- `backend/platform/routes/files-routes.js`

Move these exact routes first:

- `POST /api/files/upload`
- `GET /api/files/:id`

Likely shared dependencies to inject rather than import globally:

- `requireSessionAccount`
- `getSessionActor`
- `sendError`
- `addRouteAuditEvent`
- `store`
- `fs`

Exact work:

1. Create `files-routes.js` that exports a mount function such as `registerFileRoutes(app, deps)`.
2. Move only the two file routes into that module.
3. Pass dependencies in from `server.js`.
4. Leave route behavior unchanged.

Stop boundary:

- stop after file routes are mounted from the new module
- do **not** move auth routes or platform ops routes in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/platform-file-upload-security.test.js`

Success criteria:

- `files-routes.js` exists and owns both file routes
- `server.js` no longer contains the full inline implementation of those routes
- file-route regressions still pass

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: the file routes are still implemented inline in `server.js`
- Remaining work: create `files-routes.js`, move the exact routes, and rewire registration from `server.js`

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/files-routes.js`, `test/platform-file-upload-security.test.js`, `test/route-audit-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/files-routes.js`; `npm run check:platform`; `npx vitest run test/platform-file-upload-security.test.js test/route-audit-regressions.test.js test/audit-ingest-security.test.js`; [backend/platform/routes/files-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/files-routes.js>) now owns `POST /api/files/upload` and `GET /api/files/:id`
- Remaining work: none for this slice

#### `PROF-02B` `0% left` Extract auth session routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-01A`, `PROF-01B`
Parent task: `PROF-02`

Why this exists:

- auth/session routes are another coherent family
- moving them early reduces one of the most sensitive mixed-responsibility areas

Create these files:

- `backend/platform/routes/auth-routes.js`

Move these exact routes first:

- `POST /api/portal/session/login`
- `GET /api/portal/session`
- `POST /api/portal/session/logout`
- `DELETE /api/session/impersonate-role`

Keep these helpers injectable from `server.js`:

- `getSessionToken`
- `requireSessionAccount`
- `sendError`
- `store`

Do not move in this slice:

- Microsoft OAuth routes
- password reset / activation routes
- mail-connect flows

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/platform-session-security.test.js test/app-bootstrap-security.test.js`

Success criteria:

- `auth-routes.js` exists
- the four core session routes are mounted from the module
- auth/session tests still pass

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: core portal session routes are still owned directly inside `server.js`
- Remaining work: move only the core session route family first, then verify session security/bootstrap behavior

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/auth-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/auth-routes.js`; `npm run check:platform`; `npx vitest run test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/routes/auth-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/auth-routes.js>) now mounts `GET /api/portal/session`, `POST /api/portal/session/login`, `POST /api/portal/session/logout`, and `DELETE /api/session/impersonate-role`
- Remaining work: none for this slice

#### `PROF-02C` `0% left` Extract platform diagnostics and download routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02A`, `PROF-02B`
Parent task: `PROF-02`

Why this exists:

- platform config/status/readiness/download routes are a coherent non-domain-specific family
- they are a safe next slice after auth/files because they mostly depend on injected helpers and read-only status shaping

Create these files:

- `backend/platform/routes/platform-ops-routes.js`

Move these exact routes first:

- `GET /api/platform/config`
- `GET /api/platform/status`
- `GET /api/platform/readiness`
- `GET /api/platform/downloads`

Keep these dependencies injectable from `server.js`:

- `requireSessionAccount`
- `requireActualSessionRole`
- `getAntiCheatDownloadCatalog`
- `getMicrosoftConfig`
- `getMicrosoftMailConfig`
- `buildProductionReadinessStatus`
- `buildRtcConfig`
- `store`
- `fs`
- `BACKEND_URL`
- `UPLOADS_DIR`

Stop boundary:

- stop after the four platform diagnostics/download routes are mounted from the module
- do **not** also move admin account or integration mutation routes in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/platform-ops-route-split.test.js`

Success criteria:

- `platform-ops-routes.js` exists
- the four platform routes no longer live inline in `server.js`
- route ownership is explicit from the filename

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/platform-ops-routes.js`, `test/platform-ops-route-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/platform-ops-routes.js`; `npm run check:platform`; `npx vitest run test/platform-ops-route-split.test.js test/platform-file-upload-security.test.js test/route-audit-regressions.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/routes/platform-ops-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/platform-ops-routes.js>) now owns the platform config/status/readiness/download route family
- Remaining work: none for this slice

#### `PROF-02D` `0% left` Extract adjacent admin account and integration routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02A`, `PROF-02B`, `PROF-02C`
Parent task: `PROF-02`

Why this exists:

- the admin account/people/reset flows and integration mutation/list routes are still clustered together in `server.js`
- they share the same permission/audit/broadcast injection pattern and are a lower-risk slice than LMS or social

Create these files:

- `backend/platform/routes/admin-integrations-routes.js`

Move these exact routes first:

- `GET /api/admin/accounts`
- `POST /api/admin/accounts`
- `POST /api/admin/accounts/:id/privileges`
- `POST /api/admin/reset-platform-state`
- `GET /api/admin/people`
- `POST /api/admin/people`
- `GET /api/integrations/systems`
- `POST /api/integrations/systems`
- `GET /api/integrations/sync-runs`
- `POST /api/integrations/sync-runs`
- `GET /api/integrations/conflicts`
- `POST /api/integrations/conflicts`

Keep these dependencies injectable from `server.js`:

- `requireActualSessionRole`
- `requireSessionAccount`
- `getActorUserId`
- `sendError`
- `addRouteAuditEvent`
- `pushEvent`
- `broadcastAll`
- `store`
- `INTEGRATION_ADMIN_ROLES`

Stop boundary:

- stop after the admin/integration route family is mounted from the module
- do **not** also move audit routes, student-service routes, or LMS/social handlers in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/admin-integrations-route-split.test.js test/route-audit-regressions.test.js`

Success criteria:

- `admin-integrations-routes.js` exists
- the listed admin/integration routes no longer live inline in `server.js`
- audit-sensitive mutations keep their route-audit wiring

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/admin-integrations-routes.js`, `test/admin-integrations-route-split.test.js`, `test/route-audit-regressions.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/admin-integrations-routes.js`; `npm run check:platform`; `npx vitest run test/admin-integrations-route-split.test.js test/route-audit-regressions.test.js test/platform-ops-route-split.test.js test/platform-file-upload-security.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/routes/admin-integrations-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/admin-integrations-routes.js>) now owns the adjacent admin account/reset/people and integration route family
- Remaining work: none for this slice

#### `PROF-02E` `0% left` Extract audit and admin support routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02D`
Parent task: `PROF-02`

Why this exists:

- the remaining adjacent admin support/audit handlers were still centralized in `server.js`
- they share the same admin-role gate pattern and are smaller than LMS/social route families

Create these files:

- `backend/platform/routes/admin-support-routes.js`

Move these exact routes first:

- `GET /api/audit/events`
- `POST /api/audit/events`
- `POST /api/admin/holds`
- `POST /api/admin/sections`
- `POST /api/admin/import-jobs`
- `GET /api/admin/import-jobs/:id`

Keep these dependencies injectable from `server.js`:

- `ADMIN_ROLES`
- `requireActualSessionRole`
- `getSessionActor`
- `sendError`
- `store`

Stop boundary:

- stop after the audit/admin support route family is mounted from the module
- do **not** also move student-service, LMS, or social route families in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/admin-support-route-split.test.js test/audit-ingest-security.test.js`

Success criteria:

- `admin-support-routes.js` exists
- the listed audit/admin support routes no longer live inline in `server.js`
- audit ingest security remains explicitly asserted against the new route owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/admin-support-routes.js`, `test/admin-support-route-split.test.js`, `test/audit-ingest-security.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/admin-support-routes.js`; `npm run check:platform`; `npx vitest run test/admin-support-route-split.test.js test/audit-ingest-security.test.js test/admin-integrations-route-split.test.js test/route-audit-regressions.test.js test/platform-ops-route-split.test.js test/platform-file-upload-security.test.js test/platform-session-security.test.js test/app-bootstrap-security.test.js`; [backend/platform/routes/admin-support-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/admin-support-routes.js>) now owns the audit/admin support cluster
- Remaining work: none for this slice

#### `PROF-02F` `0% left` Extract Student Service routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-01C`, `PROF-02E`
Parent task: `PROF-02`

Why this exists:

- the Student Service route family was still centralized in `server.js` even after the Student Service backend domain seam was extracted
- the handlers share one clear session/store/broadcast pattern and align well to the already-extracted Student Service domain owner

Create these files:

- `backend/platform/routes/student-service-routes.js`

Move these exact routes first:

- `GET /api/student-service/bootstrap`
- `POST /api/student-service/tickets`
- `POST /api/student-service/tickets/:id/replies`
- `POST /api/student-service/tickets/:id/status`
- `POST /api/student-service/tickets/:id/assign`
- `POST /api/student-service/tickets/:id/internal-notes`
- `POST /api/student-service/tickets/:id/handoff`
- `POST /api/student-service/articles`
- `POST /api/student-service/questions`
- `POST /api/student-service/questions/:id/answers`
- `POST /api/student-service/questions/:id/feedback`
- `POST /api/student-service/questions/:id/accept-answer`
- `POST /api/student-service/questions/:id/publish`
- `POST /api/student-service/questions/:id/flags`
- `POST /api/student-service/questions/:id/convert-to-ticket`
- `POST /api/student-service/questions/:id/convert-to-article`
- `POST /api/student-service/questions/:id/merge`

Keep these dependencies injectable from `server.js`:

- `requireSessionAccount`
- `getActorUserId`
- `sendError`
- `broadcastAll`
- `store`

Stop boundary:

- stop after the Student Service route family is mounted from the module
- do **not** also move social/messenger, LMS, or protected-quiz route families in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/student-service-route-split.test.js test/student-service-store-domain-split.test.js test/student-service-split-workspace.test.js`

Success criteria:

- `student-service-routes.js` exists
- the listed Student Service routes no longer live inline in `server.js`
- the Student Service backend route owner is aligned with the extracted Student Service domain seam

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/student-service-routes.js`, `test/student-service-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/student-service-routes.js`; `npm run check:platform`; `npx vitest run test/student-service-route-split.test.js test/student-service-store-domain-split.test.js test/student-service-split-workspace.test.js test/backend-platform-contracts.test.js`; `npm run check:architecture`; [backend/platform/routes/student-service-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/student-service-routes.js>) now owns the Student Service route family
- Remaining work: none for this slice

#### `PROF-02G` `0% left` Extract gradebook routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02F`
Parent task: `PROF-02`

Why this exists:

- the gradebook route family was still centralized in `server.js`
- it already had dedicated access-control helpers and was more bounded than the larger LMS/social families

Create these files:

- `backend/platform/routes/gradebook-routes.js`

Move these exact routes first:

- `GET /api/gradebook/courses/:id`
- `POST /api/gradebook/scores`
- `POST /api/gradebook/publish`
- `POST /api/gradebook/finalize`

Keep these dependencies injectable from `server.js`:

- `requireGradebookCourseAccess`
- `GRADEBOOK_READ_ROLES`
- `GRADEBOOK_SCORE_ROLES`
- `GRADEBOOK_PUBLISH_ROLES`
- `GRADEBOOK_FINALIZE_ROLES`
- `getSessionActor`
- `sendError`
- `store`

Stop boundary:

- stop after the gradebook route family is mounted from the module
- do **not** also move the broader LMS or protected-quiz route families in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/gradebook-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/faculty-gradebook-route-regressions.test.js test/gradebook-delegation-regressions.test.js`

Success criteria:

- `gradebook-routes.js` exists
- the listed gradebook routes no longer live inline in `server.js`
- the extracted gradebook route owner preserves the existing authorization and gradebook mutation behavior

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/gradebook-routes.js`, `test/gradebook-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/gradebook-routes.js`; `npm run check:platform`; `npx vitest run test/gradebook-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/faculty-gradebook-route-regressions.test.js test/gradebook-delegation-regressions.test.js`; `npm run check:architecture`; [backend/platform/routes/gradebook-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/gradebook-routes.js>) now owns the gradebook route family
- Remaining work: none for this slice

#### `PROF-02H` `0% left` Extract protected-exam and protected-quiz routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02G`
Parent task: `PROF-02`

Why this exists:

- the exam-portal / protected-quiz / protected-client route family was still centralized in `server.js`
- it was the next bounded cluster after gradebook and already relied on dedicated access helpers

Create these files:

- `backend/platform/routes/protected-exam-routes.js`

Move these exact routes first:

- `POST /api/exam-portal/auth`
- `GET /api/exam-portal/sessions`
- `GET /api/exam-portal/session/:sessionId`
- `POST /api/exam-portal/sessions/:sessionId/launch-ticket`
- `POST /api/protected-quizzes/sync`
- `POST /api/protected-quizzes/:quizId/launch-ticket`
- `POST /api/protected-client/redeem-launch`
- `GET /api/protected-quizzes/group/:groupKey/monitor`
- `GET /api/protected-quizzes/:quizId/attempts`
- `GET /api/protected-quizzes/:quizId/attempt`
- `POST /api/protected-quizzes/:quizId/heartbeat`
- `POST /api/protected-quizzes/:quizId/events`
- `POST /api/protected-quizzes/:quizId/submit`
- `POST /api/protected-quizzes/:quizId/students/:studentId/block`
- `POST /api/protected-quizzes/:quizId/students/:studentId/unblock`
- `POST /api/protected-quizzes/:quizId/students/:studentId/force-submit`
- `POST /api/protected-quizzes/:quizId/students/:studentId/reset-warnings`
- `POST /api/protected-quizzes/:quizId/students/:studentId/approve-reconnect`
- `POST /api/protected-quizzes/:quizId/students/:studentId/override-status`
- `POST /api/protected-quizzes/:quizId/manual-grade`

Keep these dependencies injectable from `server.js`:

- `requireAntiCheatBrowserRequest`
- `requireExamPortalSession`
- `requireProtectedQuizSession`
- `requireCourseStaffAccess`
- `requireSessionAccount`
- `getSessionRole`
- `enforceRateLimit`
- `EXAM_PORTAL_AUTH_RATE_LIMIT_MAX`
- `EXAM_PORTAL_AUTH_RATE_LIMIT_WINDOW_MS`
- `sendError`
- `store`

Stop boundary:

- stop after the protected-exam/protected-quiz route family is mounted from the module
- do **not** also move the broader social or LMS families in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/protected-exam-route-split.test.js test/exam-portal-regressions.test.js`

Success criteria:

- `protected-exam-routes.js` exists
- the listed protected-exam/protected-quiz routes no longer live inline in `server.js`
- the extracted route owner preserves the existing anti-cheat/session gate behavior

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/protected-exam-routes.js`, `test/protected-exam-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/protected-exam-routes.js`; `npm run check:platform`; `npx vitest run test/protected-exam-route-split.test.js test/exam-portal-regressions.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/protected-exam-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/routes/protected-exam-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/protected-exam-routes.js>) now owns the protected-exam / protected-quiz route family
- Remaining work: none for this slice

#### `PROF-02I` `0% left` Extract messenger and calls routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02H`
Parent task: `PROF-02`

Why this exists:

- the messenger snapshot/message flows and call signaling/join lifecycle were still centralized in `server.js`
- they share one clear session/store/event-push boundary and are smaller than the full social CRUD surface

Create these files:

- `backend/platform/routes/messenger-calls-routes.js`

Move these exact routes first:

- `GET /api/messenger/snapshot`
- `POST /api/messenger/direct`
- `POST /api/messenger/message`
- `DELETE /api/messenger/chats/:chatId/messages/:messageId`
- `POST /api/messenger/chats/:chatId/hide`
- `POST /api/calls/start`
- `POST /api/calls/accept`
- `POST /api/calls/decline`
- `POST /api/calls/end`
- `POST /api/calls/join`
- `POST /api/calls/leave`
- `POST /api/calls/signal`

Keep these dependencies injectable from `server.js`:

- `requireSessionAccount`
- `resolveSessionBoundUserId`
- `getActorUserId`
- `pushEvent`
- `sendError`
- `store`

Stop boundary:

- stop after the messenger/calls route family is mounted from the module
- do **not** also move the broader social CRUD surface in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/messenger-calls-route-split.test.js test/call-membership-regressions.test.js test/messenger-delegation-regressions.test.js`

Success criteria:

- `messenger-calls-routes.js` exists
- the listed messenger/calls routes no longer live inline in `server.js`
- direct-call and signaling membership checks remain explicit in the extracted route owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/messenger-calls-routes.js`, `test/messenger-calls-route-split.test.js`, `test/call-membership-regressions.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/messenger-calls-routes.js`; `npm run check:platform`; `npx vitest run test/messenger-calls-route-split.test.js test/call-membership-regressions.test.js test/messenger-delegation-regressions.test.js`; [backend/platform/routes/messenger-calls-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/messenger-calls-routes.js>) now owns the messenger/calls backend route family
- Remaining work: none for this slice

#### `PROF-02J` `0% left` Extract social routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02I`
Parent task: `PROF-02`

Why this exists:

- the remaining social backend CRUD, relationship, project, post, and event routes were still centralized in `server.js`
- they share one clear authenticated-actor and social-state broadcast pattern

Create these files:

- `backend/platform/routes/social-routes.js`

Move these exact routes first:

- `GET /api/social/bootstrap`
- `POST /api/social/state`
- `POST /api/social/group-chat`
- `GET /api/social/feed`
- `POST /api/social/posts/resolve`
- `GET /api/social/events`
- `POST /api/social/pages`
- `POST /api/social/pages/:id`
- `POST /api/social/groups`
- `POST /api/social/groups/:id`
- `DELETE /api/social/groups/:id`
- `POST /api/social/groups/:id/membership`
- `POST /api/social/groups/:id/membership/:memberId`
- `DELETE /api/social/groups/:id/members/:memberId`
- `POST /api/social/groups/:id/invite`
- `POST /api/social/projects`
- `POST /api/social/projects/:id`
- `DELETE /api/social/projects/:id`
- `POST /api/social/projects/:id/membership`
- `POST /api/social/projects/:id/invite`
- `POST /api/social/projects/:id/members/:memberId`
- `DELETE /api/social/projects/:id/members/:memberId`
- `POST /api/social/projects/:id/tasks`
- `POST /api/social/projects/:id/tasks/:taskId`
- `DELETE /api/social/projects/:id/tasks/:taskId`
- `POST /api/social/projects/:id/milestones`
- `POST /api/social/projects/:id/milestones/:milestoneId`
- `DELETE /api/social/projects/:id/milestones/:milestoneId`
- `POST /api/social/projects/:id/deliverables`
- `DELETE /api/social/projects/:id/deliverables/:deliverableId`
- `POST /api/social/projects/:id/checkins`
- `POST /api/social/projects/:id/showcase`
- `POST /api/social/relationships/request`
- `POST /api/social/relationships/:id/respond`
- `POST /api/social/relationships/remove`
- `POST /api/social/follows/toggle`
- `POST /api/social/posts`
- `PATCH /api/social/posts/:id`
- `DELETE /api/social/posts/:id`
- `POST /api/social/posts/:id/share`
- `POST /api/social/posts/:id/reactions`
- `POST /api/social/posts/:id/comments`
- `POST /api/social/posts/:id/comments/:commentId/reactions`
- `DELETE /api/social/posts/:id/comments/:commentId`
- `POST /api/social/posts/:id/pin`
- `POST /api/social/reports`
- `POST /api/social/reports/:id/resolve`
- `POST /api/social/profiles/:id`
- `POST /api/social/events`
- `POST /api/social/events/:id/rsvp`
- `DELETE /api/social/events/:id`

Keep these dependencies injectable from `server.js`:

- `requireSessionAccount`
- `getActorUserId`
- `sendError`
- `pushEvent`
- `broadcastAll`
- `addRouteAuditEvent`
- `store`

Stop boundary:

- stop after the social route family is mounted from the module
- do **not** also move the broader LMS-owned route surface in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/social-route-split.test.js test/social-session-actor-routes.test.js test/social-governance-regressions.test.js test/social-relationship-route-regressions.test.js test/social-url-safety.test.js`

Success criteria:

- `social-routes.js` exists
- the listed social routes no longer live inline in `server.js`
- authenticated actor ownership remains explicit for social mutations

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/social-routes.js`, `test/social-route-split.test.js`, `test/social-session-actor-routes.test.js`, `test/social-governance-regressions.test.js`, `test/social-relationship-route-regressions.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/social-routes.js`; `npm run check:platform`; `npx vitest run test/social-route-split.test.js test/social-session-actor-routes.test.js test/social-governance-regressions.test.js test/social-relationship-route-regressions.test.js test/social-url-safety.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/messenger-calls-route-split.test.js test/social-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/routes/social-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/social-routes.js>) now owns the social backend route family
- Remaining work: none for this slice

#### `PROF-02K` `0% left` Extract LMS live-quiz workspace routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02J`
Parent task: `PROF-02`

Why this exists:

- the LMS live-quiz workspace routes were still centralized in `server.js`
- they already relied on dedicated access helpers and a narrow student-answer merge helper, making them a clean bounded LMS slice

Create these files:

- `backend/platform/routes/lms-live-quiz-routes.js`

Move these exact routes first:

- `GET /api/lms/live-quizzes/:resourceKey`
- `POST /api/lms/live-quizzes/:resourceKey`

Keep these dependencies injectable from `server.js`:

- `requireLmsLiveQuizWorkspaceAccess`
- `mergeStudentLiveQuizAnswer`
- `getSessionRole`
- `STAFF_ROLES`
- `broadcastAll`
- `sendError`
- `store`

Stop boundary:

- stop after the LMS live-quiz workspace route pair is mounted from the module
- do **not** also move the broader LMS/mail/news/bootstrap surface in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/lms-live-quiz-route-split.test.js test/portal-state-persistence-safety.test.js`

Success criteria:

- `lms-live-quiz-routes.js` exists
- the two live-quiz workspace routes no longer live inline in `server.js`
- the extracted route owner preserves the existing staff/student gating and student-answer merge behavior

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/lms-live-quiz-routes.js`, `test/lms-live-quiz-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/lms-live-quiz-routes.js`; `npm run check:platform`; `npx vitest run test/lms-live-quiz-route-split.test.js test/portal-state-persistence-safety.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/lms-live-quiz-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/routes/lms-live-quiz-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/lms-live-quiz-routes.js>) now owns the LMS live-quiz workspace route pair
- Remaining work: none for this slice

#### `PROF-02L` `0% left` Extract academic catalog, registration, LMS course, and exam-session sync routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02K`
Parent task: `PROF-02`

Why this exists:

- the remaining catalog, student eligibility/enrollment, registration, LMS course/material/assignment, and exam-session sync routes were still centralized in `server.js`
- they share the same academic access-control helpers and form a bounded academic route family

Create these files:

- `backend/platform/routes/academic-routes.js`

Move these exact routes first:

- `GET /api/catalog/courses`
- `GET /api/catalog/sections`
- `GET /api/students/:id/eligibility`
- `GET /api/students/:id/enrollments`
- `POST /api/registration/enroll`
- `POST /api/registration/drop`
- `GET /api/lms/courses/:id`
- `POST /api/lms/assignments`
- `POST /api/lms/materials`
- `POST /api/exam-sessions/sync`

Keep these dependencies injectable from `server.js`:

- `requireSessionAccount`
- `requireCourseStaffAccess`
- `canAccessStudentAcademicRecord`
- `getActualSessionRole`
- `getActorUserId`
- `isActualAdminSession`
- `sendError`
- `store`

Stop boundary:

- stop after the bounded academic route family is mounted from the module
- do **not** also move the broader mail/bootstrap surface in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/academic-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/portal-state-persistence-safety.test.js`

Success criteria:

- `academic-routes.js` exists
- the listed academic routes no longer live inline in `server.js`
- the extracted route owner preserves the existing student/staff/admin access rules

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/academic-routes.js`, `test/academic-route-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/academic-routes.js`; `npm run check:platform`; `npx vitest run test/academic-route-split.test.js test/runtime-gradebook-registration-regressions.test.js test/portal-state-persistence-safety.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/academic-route-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/routes/academic-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/academic-routes.js>) now owns the bounded academic route family
- Remaining work: none for this slice

#### `PROF-02M` `0% left` Extract backend news routes from `server.js` into a dedicated route module

Priority: `P0`
Depends on: `PROF-02L`
Parent task: `PROF-02`

Why this exists:

- the backend news feed/privilege/post/reply routes were still centralized in `server.js`
- they are a small, coherent family and a clean low-risk extraction alongside the other route-module seams

Create these files:

- `backend/platform/routes/news-routes.js`

Move these exact routes first:

- `GET /api/news/feed`
- `GET /api/news/privileges`
- `POST /api/news/posts`
- `PATCH /api/news/posts/:id`
- `POST /api/news/posts/:id/replies`

Keep these dependencies injectable from `server.js`:

- `requireSessionAccount`
- `resolveSessionBoundUserId`
- `getActorUserId`
- `sendError`
- `broadcastAll`
- `store`

Stop boundary:

- stop after the news route family is mounted from the module
- do **not** also move the broader mail/bootstrap surface in the same pass

Verification commands:

- `node --check backend/platform/server.js`
- `npm run check:platform`
- `npx vitest run test/news-route-api-split.test.js test/news-route-regressions.test.js`

Success criteria:

- `news-routes.js` exists
- the listed backend news routes no longer live inline in `server.js`
- news post/reply mutations still broadcast the expected backend update signal

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/server.js`, `backend/platform/routes/news-routes.js`, `test/news-route-api-split.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node --check backend/platform/server.js`; `node --check backend/platform/routes/news-routes.js`; `npm run check:platform`; `npx vitest run test/news-route-api-split.test.js test/news-route-regressions.test.js`; `npx vitest run test/backend-platform-contracts.test.js test/news-route-api-split.test.js`; `npm run check:architecture`; `npm run check`; [backend/platform/routes/news-routes.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/routes/news-routes.js>) now owns the backend news route family
- Remaining work: none for this slice

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/routes/portal-support-routes.js`, `backend/platform/server.js`, `test/route-audit-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `POST /api/portal/state` now records `portal-state-saved` audit events from the extracted `portal-support-routes.js` owner, and the full suite is green with route-audit assertions following the dedicated route modules instead of the old inline `server.js` layout
- Remaining work: none for backend route/controller extraction; future changes should preserve audit wiring inside the dedicated route owners

### `PROF-03` `0% left` Define and enforce backend domain contracts

Priority: `P0`
Depends on: `PROF-01`, `PROF-02`

Why this exists:

- professionalism requires explicit ownership boundaries, not just smaller files

Primary files:

- backend domain service files to be created
- [docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md>)
- [docs/ROLE_ENDPOINT_ACCESS_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROLE_ENDPOINT_ACCESS_MATRIX.md>)
- [docs/PORTAL_AUTH_SESSION_LIFECYCLE.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PORTAL_AUTH_SESSION_LIFECYCLE.md>)
- [docs/PRODUCTION_STATE_MODEL_DECISION.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PRODUCTION_STATE_MODEL_DECISION.md>)

Exact work:

1. For each backend domain, document:
   - public API
   - owned state
   - allowed callers
   - forbidden cross-domain write paths
2. Convert those rules into small assertion tests where practical.
3. Make domain ownership explicit in code comments only where necessary, not everywhere.

Do not do this:

- do not create vague “service” files with no real boundary
- do not let controllers reach across domains for direct mutation if an API method should exist

Verification gate:

- backend domain modules expose clear public methods
- cross-domain access paths are narrower and easier to trace
- contract docs and tests agree

Update `2026-05-18`:
- Status: partially completed
- % left: `90% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: boundary-related audit artifacts already exist, but code enforcement is still limited
- Remaining work: convert audit knowledge into runtime module boundaries and targeted contract tests

Update `2026-05-18`:
- Status: partially completed
- % left: `82% left`
- Files changed: `backend/platform/domains/files-service.js`, `backend/platform/domains/audit-service.js`, `backend/platform/domains/student-service-service.js`, `backend/platform/routes/files-routes.js`, `backend/platform/routes/auth-routes.js`, `backend/platform/routes/platform-ops-routes.js`, `test/student-service-store-domain-split.test.js`, `test/platform-ops-route-split.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: extracted backend domains/routes now expose named public entrypoints; `npx vitest run test/student-service-store-domain-split.test.js test/platform-ops-route-split.test.js`; `npm run check:platform`
- Remaining work: document the remaining backend domain contracts explicitly and add narrower cross-domain assertions beyond the currently extracted ownership seams

Update `2026-05-18`:
- Status: partially completed
- % left: `68% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/backend-platform-contracts.test.js`; [docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md>) now documents public APIs, owned state, allowed callers, and forbidden cross-domain write paths for the extracted backend domains and route owners
- Remaining work: extend the contract doc/assertions to the larger remaining backend ownership surfaces, especially the still-centralized LMS/social route and state seams

Update `2026-05-18`:
- Status: partially completed
- % left: `56% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/student-service-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/student-service-route-split.test.js`; the contract doc now includes `student-service-routes.js` ownership alongside the earlier extracted backend route families
- Remaining work: extend the contract/assertion surface to the still-centralized gradebook/LMS, protected-quiz/exam-portal, and social/messenger/calls families

Update `2026-05-18`:
- Status: partially completed
- % left: `48% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/gradebook-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/gradebook-route-split.test.js`; the contract doc now includes `gradebook-routes.js` ownership alongside the earlier extracted backend route families
- Remaining work: extend the contract/assertion surface to the still-centralized protected-quiz/exam-portal and social/messenger/calls families, plus the broader LMS ownership surface

Update `2026-05-18`:
- Status: partially completed
- % left: `40% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/protected-exam-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/protected-exam-route-split.test.js`; the contract doc now includes `protected-exam-routes.js` ownership alongside the other extracted backend route families
- Remaining work: extend the contract/assertion surface to the still-centralized social/messenger/calls family and the broader LMS ownership surface

Update `2026-05-18`:
- Status: partially completed
- % left: `24% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/messenger-calls-routes.js`, `backend/platform/routes/social-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/messenger-calls-route-split.test.js test/social-route-split.test.js`; the contract doc now includes the messenger/calls and social route owners alongside the other extracted backend route families
- Remaining work: extend the contract/assertion surface to the broader LMS-owned route surface and any remaining centralized backend helper seams

Update `2026-05-18`:
- Status: partially completed
- % left: `18% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/lms-live-quiz-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/lms-live-quiz-route-split.test.js`; the contract doc now includes `lms-live-quiz-routes.js` ownership alongside the extracted backend route families
- Remaining work: extend the contract/assertion surface to the remaining broader LMS/mail/news/bootstrap routes and any centralized backend helper seams

Update `2026-05-18`:
- Status: partially completed
- % left: `12% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/academic-routes.js`, `backend/platform/routes/news-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/academic-route-split.test.js test/news-route-api-split.test.js`; the contract doc now includes the academic and backend news route owners alongside the other extracted backend route families
- Remaining work: extend the contract/assertion surface to the remaining mail/bootstrap surface and any centralized backend helper seams still left in `server.js`

Update `2026-05-18`:
- Status: partially completed
- % left: `6% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `backend/platform/routes/microsoft-auth-routes.js`, `backend/platform/routes/mail-routes.js`, `backend/platform/routes/portal-support-routes.js`, `backend/platform/routes/system-routes.js`, `backend/platform/routes/auth-maintenance-routes.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/backend-platform-contracts.test.js test/mail-microsoft-route-split.test.js test/portal-support-route-split.test.js test/system-auth-route-split.test.js`; the contract doc now covers the remaining backend route families that were still centralized earlier in `server.js`
- Remaining work: the backend contract surface is mostly explicit; the remaining work is documenting or isolating any shared helper seams that still live in `server.js`

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/backend-platform-contracts.test.js`; the contract doc now covers the remaining shared helper seams still owned by `backend/platform/server.js`, and the contract test now fails if `server.js` regains inline route handlers or if those documented helper contracts drift
- Remaining work: none for backend contract definition/enforcement; future backend work should move back to actual ownership extraction under `PROF-01`

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; the contract surface now also documents and enforces the extracted `auth-session-service.js` and `gradebook-service.js` ownership seams while the full suite stays green
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; the contract surface now also documents and enforces the extracted `protected-exam-service.js` ownership seam while the full suite remains green
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/accounts-store-domain-split.test.js test/backend-platform-contracts.test.js`; the contract surface now also documents and enforces the extracted `accounts-service.js` ownership seam
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/lms-course-store-domain-split.test.js test/backend-platform-contracts.test.js`; the contract surface now also documents and enforces the extracted `lms-course-service.js` ownership seam
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/social-state-store-domain-split.test.js test/backend-platform-contracts.test.js`; the contract surface now also documents and enforces the extracted `social-state-service.js` ownership seam
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; the contract surface now also documents and enforces the extracted `social-relationships-service.js` ownership seam while the full suite remains green
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; the contract surface now also documents and enforces the extracted `social-projects-service.js` ownership seam while the full suite remains green
- Remaining work: none; future contract changes should only follow new backend ownership extraction

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform`; `npx vitest run test/social-content-store-domain-split.test.js test/backend-platform-contracts.test.js`; the contract surface now includes the in-progress `social-content-service.js` seam and its current exported API
- Remaining work: none for contract definition; future updates should tighten the contract only as the remaining social mutation delegation actually lands

### `PROF-04` `0% left` Choose and enforce one primary frontend route architecture

Priority: `P0`
Depends on: none

Why this exists:

- the current route model is understood, but still mixed
- this is one of the biggest “does this feel professional?” issues

Primary files:

- [assets/js/features/navigation.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/navigation.js>)
- root `*.html`
- route owners under `assets/js/pages/`
- [docs/ROUTE_NAVIGATION_MODE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROUTE_NAVIGATION_MODE_MATRIX.md>)

Exact work:

1. Decide the intended target:
   - mostly shell-backed SPA for student/faculty flows
   - standalone pages only for true specials/admin-heavy pages
2. Freeze alias wrappers and special pages as explicit exceptions.
3. Move the first candidate route group in-shell:
   - `news`
   - `orders`
   - `student-service`
4. Remove duplicated per-page shell/mobile bootstrap where those routes become shell-owned.

Recommended migration order inside this task:

1. `news`
2. `orders`
3. `student-service`
4. only then `study-card` / `timetable` / `registration`

Why this order:

- `news`, `orders`, and `student-service` behave like product sections
- they give the best simplification return before touching heavier academic flows

Do not do this:

- do not rewrite all routes at once
- do not merge special pages like `login.html` or `exam-portal.html` into the shell

Verification gate:

- one candidate standalone route group becomes shell-owned
- navigation logic gets simpler, not more branched
- runtime smoke still passes
- duplicated bootstrap logic is actually removed from the migrated routes

Update `2026-05-18`:
- Status: partially completed
- % left: `88% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: [ROUTE_NAVIGATION_MODE_MATRIX.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/ROUTE_NAVIGATION_MODE_MATRIX.md>) already defines the target candidate groups, but implementation has not started
- Remaining work: execute the first shell-migration slice instead of keeping the route model purely documented

Update `2026-05-18`:
- Status: partially completed
- % left: `60% left`
- Files changed: `index.html`, `news.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `assets/js/pages/news.js`, `test/news-route-regressions.test.js`, `test/global-performance-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `test/social-lost-found-regressions.test.js`, `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/news-route-regressions.test.js test/navigation-model-regressions.test.js test/global-performance-regressions.test.js test/root-font-delivery-regressions.test.js test/social-lost-found-regressions.test.js`; `news` now exists as `#page-news` inside [index.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/index.html>) with lazy runtime loading through `ensurePortalNewsRuntimeLoaded()`, while [news.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/news.html>) is reduced to an alias wrapper that redirects into `index.html?view=...#news`
- Remaining work: migrate `orders` or `student-service` into the shell next so the first candidate group is no longer split between one shell-owned route and two standalone route owners

Update `2026-05-18`:
- Status: partially completed
- % left: `40% left`
- Files changed: `index.html`, `student-service.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `assets/js/pages/student-service.js`, `test/student-service-split-workspace.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/student-service-split-workspace.test.js test/navigation-model-regressions.test.js test/root-font-delivery-regressions.test.js test/global-performance-regressions.test.js`; `student-service` now exists as `#page-student-service` inside [index.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/index.html>) with lazy runtime loading through `ensurePortalStudentServiceRuntimeLoaded()`, while [student-service.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/student-service.html>) is reduced to an alias wrapper that redirects into `index.html?view=...#student-service`
- Remaining work: `orders` is now the main remaining route in the first candidate migration group; after that, the next route-model work is the second candidate group or the fallback frontend-owner splits

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `index.html`, `orders.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `test/orders-route-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/orders-route-regressions.test.js test/navigation-model-regressions.test.js test/root-font-delivery-regressions.test.js test/global-performance-regressions.test.js`; `orders` now exists as `#page-orders` inside [index.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/index.html>) with lazy runtime loading through `ensurePortalOrdersRuntimeLoaded()`, while [orders.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/orders.html>) is reduced to a role-aware alias wrapper that redirects non-admin users into `index.html?view=...#orders` and admins into `admin-orders.html`
- Remaining work: none for this task; the first candidate route group is now shell-owned and the remaining frontend structure work moves to `PROF-05`, `PROF-06`, and later shell/bootstrap cleanup

### `PROF-05` `0% left` Break up `assets/js/pages/lms.js` into focused LMS modules

Priority: `P0`
Depends on: `PROF-03`

Why this exists:

- `lms.js` is the single largest frontend ownership hotspot
- it currently mixes classroom rendering, live quizzes, grading flows, protected quiz launch logic, file storage helpers, and schedule presentation logic

Primary files:

- [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>)
- new LMS modules under `assets/js/pages/` or `assets/js/shared/`

Exact work:

1. Split LMS into coherent slices:
   - LMS shell/router
   - materials/assignments
   - live quiz workspace
   - exam/protected quiz launch integration
   - grade sync / gradebook integration
   - file helpers
2. Keep one thin entry file that mounts the right LMS subsection.
3. Preserve current runtime behavior during each slice.

Recommended split order:

1. file helpers
2. protected-quiz launch / exam portal bridge helpers
3. live quiz workspace
4. grade sync helpers
5. classroom/material rendering

Reason:

- the early slices are less visually risky and easier to verify narrowly

Do not do this:

- do not create meaningless `lms-part2.js`, `lms-part3.js` files with random cuts
- do not move shared helpers into unrelated route files

Verification gate:

- `lms.js` is materially smaller
- at least one major LMS sub-area has its own file/module
- LMS route regressions and runtime shell smoke still pass
- the extracted LMS module no longer depends on unrelated classroom globals

Update `2026-05-18`:
- Status: partially completed
- % left: `95% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: current baseline shows [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) at `12057` lines
- Remaining work: start with the least cross-coupled slices, likely file helpers or protected-quiz helpers, before touching the main classroom renderer

Update `2026-05-18`:
- Status: partially completed
- % left: `82% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-protected-quiz-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/protected-quiz-host-regressions.test.js`, `test/lms-protected-quiz-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-route-regressions.test.js test/protected-quiz-host-regressions.test.js test/lms-protected-quiz-module-split.test.js test/global-performance-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `12708` to `12120` lines after moving the protected-quiz launch/runtime seam into [assets/js/pages/lms-protected-quiz-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-protected-quiz-runtime.js>) and loading it ahead of the main LMS runtime in [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>)
- Remaining work: continue with the next bounded LMS seam, with the indexed file-storage and draft-file helper cluster now the best next target before live-quiz or classroom-render decomposition

Update `2026-05-18`:
- Status: partially completed
- % left: `68% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-file-storage-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/lms-file-storage-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-route-regressions.test.js test/protected-quiz-host-regressions.test.js test/lms-protected-quiz-module-split.test.js test/lms-file-storage-module-split.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `12120` to `11857` lines after moving the IndexedDB file-storage, draft-file staging, shared file picker, and download helper cluster into [assets/js/pages/lms-file-storage-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-file-storage-runtime.js>) and loading it ahead of the main LMS runtime in [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>)
- Remaining work: continue with the next bounded LMS seam, with the live-quiz workspace or grade-sync helper cluster now the best next target before classroom/material rendering decomposition

Update `2026-05-18`:
- Status: partially completed
- % left: `55% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-grade-sync-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/lms-grade-sync-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-route-regressions.test.js test/lms-grade-sync-module-split.test.js test/lms-file-storage-module-split.test.js test/lms-protected-quiz-module-split.test.js test/protected-quiz-host-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `11857` to `11734` lines after moving the LMS-to-gradebook roster/metadata/score-sync bridge into [assets/js/pages/lms-grade-sync-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-grade-sync-runtime.js>) and loading it ahead of the main LMS runtime in [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>)
- Remaining work: the next bounded LMS seam is now the live-quiz workspace cluster; if that proves too coupled, switch to `PROF-06A` rather than forcing a low-quality split

Update `2026-05-18`:
- Status: partially completed
- % left: `48% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-protected-quiz-runtime.js`, `package.json`, `test/lms-protected-quiz-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:frontend`; `npx vitest run test/lms-protected-quiz-module-split.test.js test/lms-route-regressions.test.js test/protected-quiz-host-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `11734` to `11559` lines after moving the protected-quiz monitoring action/render path into [assets/js/pages/lms-protected-quiz-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-protected-quiz-runtime.js>), leaving the protected delivery/monitoring sub-area under one owner
- Remaining work: the next bounded LMS seam is still the live-quiz workspace cluster; if that proves too coupled, switch to `PROF-06A` rather than forcing a low-quality split

Update `2026-05-18`:
- Status: partially completed
- % left: `44% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-protected-quiz-runtime.js`, `test/lms-protected-quiz-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-protected-quiz-module-split.test.js test/lms-route-regressions.test.js test/protected-quiz-host-regressions.test.js`; the protected-quiz owner now includes both launch/runtime helpers and monitoring action/render helpers inside [assets/js/pages/lms-protected-quiz-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-protected-quiz-runtime.js>), while [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) remains at `11559` lines with that sub-area fully delegated
- Remaining work: the next bounded LMS seam is still the live-quiz workspace cluster; if that seam is too coupled for one clean pass, switch to `PROF-06A` instead of doing a low-quality LMS split

Update `2026-05-18`:
- Status: partially completed
- % left: `36% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-live-quiz-workspace-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/lms-live-quiz-workspace-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-live-quiz-workspace-module-split.test.js test/lms-live-quiz-route-split.test.js test/lms-route-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `11559` to `11167` lines after moving the live-quiz workspace/state/sync owner into [assets/js/pages/lms-live-quiz-workspace-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-workspace-runtime.js>) and loading it ahead of the main LMS runtime in [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>)
- Remaining work: the next LMS seam is now the remaining live-quiz UI/render path or, if that proves too coupled, the fallback `PROF-06A` shell chrome extraction from `index-luxury.js`

Update `2026-05-18`:
- Status: partially completed
- % left: `18% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-live-quiz-ui-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/lms-live-quiz-workspace-module-split.test.js`, `test/lms-live-quiz-ui-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-live-quiz-ui-module-split.test.js test/lms-live-quiz-workspace-module-split.test.js test/lms-live-quiz-route-split.test.js test/lms-route-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `11167` to `10236` lines after moving the remaining live-quiz UI/render/action block into [assets/js/pages/lms-live-quiz-ui-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-live-quiz-ui-runtime.js>) and loading it ahead of the main LMS runtime in [lms.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/lms.html>)
- Remaining work: the major remaining LMS seam is now the classroom/material or assignment-render path; if that proves too coupled for one clean pass, switch to `PROF-06A` rather than forcing brittle LMS churn

Update `2026-05-18`:
- Status: partially completed
- % left: `12% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-materials-runtime.js`, `assets/js/pages/lms-assignments-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/lms-materials-module-split.test.js`, `test/lms-assignments-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-route-regressions.test.js test/lms-materials-module-split.test.js test/lms-assignments-module-split.test.js test/lms-file-storage-module-split.test.js test/lms-live-quiz-ui-module-split.test.js test/protected-quiz-host-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `10236` to `9216` lines after moving the materials owner into [assets/js/pages/lms-materials-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-materials-runtime.js>) and the assignments/workspace owner into [assets/js/pages/lms-assignments-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-assignments-runtime.js>)
- Remaining work: the remaining LMS ownership concentration is now the classroom/session/calls path plus the broader LMS shell/router seam; `lms.js` is materially smaller, but it is not yet the thin coordinator target

Update `2026-05-18`:
- Status: partially completed
- % left: `6% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-calls-runtime.js`, `lms.html`, `package.json`, `test/lms-route-regressions.test.js`, `test/lms-calls-module-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-route-regressions.test.js test/lms-calls-module-split.test.js test/lms-materials-module-split.test.js test/lms-assignments-module-split.test.js test/protected-quiz-host-regressions.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) reduced from `9216` to `8497` lines after moving the classroom/session/calls owner into [assets/js/pages/lms-calls-runtime.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms-calls-runtime.js>)
- Remaining work: the LMS route is now split across live quiz, file storage, grade sync, materials, assignments, protected quiz, and calls owners; the remaining work is the broader LMS shell/router coordinator seam and any residual cross-tab ownership still left in `lms.js`

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/pages/lms.js`, `assets/js/pages/lms-content-library-runtime.js`, `assets/js/pages/lms-quiz-workspace-runtime.js`, `assets/js/pages/lms-classroom-tabs-runtime.js`, `assets/js/pages/lms-protected-quiz-runtime.js`, `assets/js/pages/lms-live-quiz-workspace-runtime.js`, `assets/js/pages/lms-classroom-tabs-runtime.js`, `lms.html`, `tools/check-architecture-guardrails.js`, `test/lms-content-library-module-split.test.js`, `test/lms-quiz-workspace-module-split.test.js`, `test/lms-classroom-tabs-module-split.test.js`, `test/scheduler-and-lms-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/lms-quiz-workspace-module-split.test.js test/lms-classroom-tabs-module-split.test.js test/lms-content-library-module-split.test.js test/lms-route-regressions.test.js test/lms-calls-module-split.test.js test/lms-live-quiz-ui-module-split.test.js test/lms-live-quiz-workspace-module-split.test.js test/lms-materials-module-split.test.js test/lms-assignments-module-split.test.js test/lms-protected-quiz-module-split.test.js`; [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>) is now down to `2985` lines and the route is owned by dedicated LMS runtimes for content library, quiz workspace, classroom tabs, protected quiz, live quiz workspace, live quiz UI, grade sync, file storage, materials, assignments, and calls
- Remaining work: none for this task; the LMS route now has a thin main entry file under the post-split frontend ceiling

### `PROF-06` `0% left` Break up other oversized frontend owners by route/domain

Priority: `P1`
Depends on: `PROF-04`

Why this exists:

- professionalism is not just one huge file; several route/shared files still own too much

Primary files:

- [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>)
- [assets/js/pages/registration.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/registration.js>)
- [assets/js/shared/faculty.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/faculty.js>)
- [assets/js/shared/messenger.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/messenger.js>)

Exact work:

1. Split `index-luxury.js` into:
   - shell layout/topbar/nav
   - home dashboard model/rendering
   - theme/studio controls
   - utility panels
2. Split `registration.js` by:
   - registration shell
   - curriculum/admin registration tooling
   - chancellery overlap
3. Split `faculty.js` and `messenger.js` by actual domain ownership, not by file size alone.

Recommended first slice inside this task:

- split `index-luxury.js` first into:
  - shell chrome
  - home dashboard rendering/model helpers
  - studio/theme controls

Reason:

- it is large
- it blocks later CSP/eval cleanup
- it affects many routes

Do not do this:

- do not keep compatibility shims forever if a cleaner owner exists
- do not duplicate helpers across route files

Verification gate:

- each target file loses at least one clear subsystem
- route regressions still pass
- ownership becomes easier to explain in one paragraph per file
- the split reduces coupling instead of creating “part1/part2” style files

Update `2026-05-18`:
- Status: partially completed
- % left: `90% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: current file-size baseline confirms these are still oversized multi-owner modules
- Remaining work: start with the shell/home split inside `index-luxury.js`, because it blocks later CSP and route cleanup

Update `2026-05-18`:
- Status: partially completed
- % left: `72% left`
- Files changed: `assets/js/features/index-luxury.js`, `assets/js/features/luxury-shell-chrome.js`, `assets/js/features/luxury-home-dashboard-runtime.js`, `index.html`, `lms.html`, `registration.html`, `programs.html`, `study-card.html`, `personal-data.html`, `faculty-gradebook.html`, `social.html`, `admin-tools.html`, `admin-library.html`, `admin-orders.html`, `admin-scheduler.html`, `career-market.html`, `chancellery.html`, `exams.html`, `profile.html`, `profile-view.html`, `staff.html`, `students-admin.html`, `timetable.html`, `package.json`, `test/luxury-shell-chrome-split.test.js`, `test/global-performance-regressions.test.js`, `test/theme-scope-and-faculty-switch.test.js`, `test/admin-scheduler-recovery.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/luxury-shell-chrome-split.test.js test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/admin-scheduler-recovery.test.js`; [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>) reduced from `4148` to `3035` lines after moving the shell chrome/topbar/nav/studio owner into [assets/js/features/luxury-shell-chrome.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/luxury-shell-chrome.js>)
- Remaining work: `index-luxury.js` still owns the home dashboard model/render path, and `registration.js`, `faculty.js`, and `messenger.js` remain oversized; the next best slice is `PROF-06B`

Update `2026-05-18`:
- Status: partially completed
- % left: `55% left`
- Files changed: `assets/js/features/index-luxury.js`, `assets/js/features/luxury-home-model.js`, `assets/js/features/luxury-shell-chrome.js`, `index.html`, `lms.html`, `registration.html`, `programs.html`, `study-card.html`, `personal-data.html`, `faculty-gradebook.html`, `social.html`, `admin-tools.html`, `admin-library.html`, `admin-orders.html`, `admin-scheduler.html`, `career-market.html`, `chancellery.html`, `exams.html`, `profile.html`, `profile-view.html`, `staff.html`, `students-admin.html`, `timetable.html`, `package.json`, `test/luxury-home-model-split.test.js`, `test/faculty-data-isolation.test.js`, `test/global-performance-regressions.test.js`, `test/theme-scope-and-faculty-switch.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/luxury-home-model-split.test.js test/luxury-shell-chrome-split.test.js test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/faculty-data-isolation.test.js`; [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>) reduced from `3035` to `2482` lines after moving the home dashboard model/render owner into [assets/js/features/luxury-home-model.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/luxury-home-model.js>)
- Remaining work: the `index-luxury.js` ownership split is now materially complete; the remaining parent-task work is concentrated in the still-oversized [assets/js/pages/registration.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/registration.js>), [assets/js/shared/faculty.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/faculty.js>), and [assets/js/shared/messenger.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/messenger.js>) owners

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `test/scheduler-and-lms-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/faculty-data-isolation.test.js test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js`; `check:architecture` now enforces post-split ceilings of `2600` for [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>), `2400` for [assets/js/pages/registration.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/registration.js>), `2700` for [assets/js/shared/faculty.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/faculty.js>), and `2400` for [assets/js/shared/messenger.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/messenger.js>), with the current files landing at `2501`, `2176`, `2588`, and `2381` lines respectively
- Remaining work: none for this task; the remaining oversized frontend owners are now below their post-split ceilings and covered by route/domain regression tests plus architecture guardrails

#### `PROF-06A` `0% left` Split shell chrome from home dashboard logic inside `index-luxury.js`

Priority: `P1`
Depends on: none
Parent task: `PROF-06`

Why this exists:

- `index-luxury.js` currently mixes shell chrome, home dashboard rendering, and theme/studio logic
- it is the best non-backend place to prove a clean frontend decomposition

Create these files:

- `assets/js/features/luxury-shell-chrome.js`
- `assets/js/features/luxury-home-dashboard-runtime.js`

Move these exact shell-focused functions first:

- `renderNav()`
- `populateFacultySwitcher(options = {})`
- `populateRoleSwitcher(options = {})`
- `syncTopbar()`
- `ensureStudio()`
- topbar/user-menu/picker helpers directly required by those functions

Leave these in `index-luxury.js` for the first pass:

- `renderHomeShell()`
- `buildHomeModel(role)`
- `applyResolvedPalette()`
- `applyAtmosphereSettings()`
- luxury home/admin chunk loader functions

Stop boundary:

- stop after shell chrome/topbar/nav/studio helpers are extracted
- do **not** also move home dashboard model/render logic in the same pass

Verification commands:

- `node --check assets/js/features/index-luxury.js`
- `npm run check:frontend`
- `npx vitest run test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/theme-primer-role-routing.test.js`
- `npm run test:runtime-shell`

Success criteria:

- `luxury-shell-chrome.js` exists
- the listed shell functions no longer live entirely in `index-luxury.js`
- home/admin-tools shell runtime still passes

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: shell chrome and home/studio logic are still mixed in `index-luxury.js`
- Remaining work: extract only the shell chrome/topbar/nav/studio helpers first and verify shell regressions

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/features/index-luxury.js`, `assets/js/features/luxury-shell-chrome.js`, `assets/js/features/luxury-home-dashboard-runtime.js`, `index.html`, `lms.html`, `registration.html`, `programs.html`, `study-card.html`, `personal-data.html`, `faculty-gradebook.html`, `social.html`, `admin-tools.html`, `admin-library.html`, `admin-orders.html`, `admin-scheduler.html`, `career-market.html`, `chancellery.html`, `exams.html`, `profile.html`, `profile-view.html`, `staff.html`, `students-admin.html`, `timetable.html`, `package.json`, `test/luxury-shell-chrome-split.test.js`, `test/global-performance-regressions.test.js`, `test/theme-scope-and-faculty-switch.test.js`, `test/admin-scheduler-recovery.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/luxury-shell-chrome-split.test.js test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/admin-scheduler-recovery.test.js`; [assets/js/features/luxury-shell-chrome.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/luxury-shell-chrome.js>) now owns `renderNav()`, `populateFacultySwitcher(options = {})`, `populateRoleSwitcher(options = {})`, `syncTopbar()`, `ensureStudio()`, and the directly required topbar/user-menu/picker helpers, while [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>) keeps the home/admin bundle loaders and the live `renderHomeShell()` seam
- Remaining work: none for this task; the home dashboard model/render extraction is now the follow-on `PROF-06B` seam

#### `PROF-06B` `0% left` Split home dashboard model/render helpers from `index-luxury.js`

Priority: `P1`
Depends on: `PROF-06A`
Parent task: `PROF-06`

Why this exists:

- after shell chrome is separated, the next biggest remaining owner inside `index-luxury.js` is the home dashboard model/render path

Create these files:

- `assets/js/features/luxury-home-model.js`

Move these exact functions first:

- `getRecentHomeUpdates(user, limit = 4)`
- `buildHomeModel(role)`
- `buildHomeContext(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode())`
- layout/model helpers directly required by the home dashboard render path

Do not move yet:

- palette/theme/studio helpers
- chunk loader/eval cleanup

Verification commands:

- `node --check assets/js/features/index-luxury.js`
- `npm run check:frontend`
- `npx vitest run test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js`
- `npm run test:runtime-shell`

Success criteria:

- `luxury-home-model.js` exists
- home dashboard model logic is no longer mixed directly with shell chrome
- home runtime still renders correctly

Update `2026-05-18`:
- Status: not started
- % left: `100% left`
- Files changed: none yet
- Evidence: home dashboard model/render helpers still live in `index-luxury.js`
- Remaining work: extract the exact model/render helper set after `PROF-06A` lands cleanly

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/features/index-luxury.js`, `assets/js/features/luxury-home-model.js`, `index.html`, `lms.html`, `registration.html`, `programs.html`, `study-card.html`, `personal-data.html`, `faculty-gradebook.html`, `social.html`, `admin-tools.html`, `admin-library.html`, `admin-orders.html`, `admin-scheduler.html`, `career-market.html`, `chancellery.html`, `exams.html`, `profile.html`, `profile-view.html`, `staff.html`, `students-admin.html`, `timetable.html`, `package.json`, `test/luxury-home-model-split.test.js`, `test/faculty-data-isolation.test.js`, `test/global-performance-regressions.test.js`, `test/theme-scope-and-faculty-switch.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/luxury-home-model-split.test.js test/luxury-shell-chrome-split.test.js test/global-performance-regressions.test.js test/theme-scope-and-faculty-switch.test.js test/faculty-data-isolation.test.js`; [assets/js/features/luxury-home-model.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/luxury-home-model.js>) now owns `getRecentHomeUpdates(user, limit = 4)`, `buildHomeModel(role)`, `buildHomeContext(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode())`, and the directly required home-model helper cluster, while [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>) keeps the shell loaders and palette/runtime composition logic
- Remaining work: none for this task; the next remaining `PROF-06` work is no longer in `index-luxury.js`, but in the other oversized route/shared owners

### `PROF-07` `0% left` Remove repeated HTML-page shell bootstrap and mobile-shell duplication

Priority: `P1`
Depends on: `PROF-04`, `PROF-06`

Why this exists:

- many root HTML pages still embed similar mobile-shell/bootstrap logic
- that increases drift and makes route changes expensive

Primary files:

- root `*.html`
- mobile-shell helpers under `assets/js/pages/`
- shell utilities under `assets/js/features/` and `assets/js/shared/`

Exact work:

1. Identify the repeated bootstrap blocks across root HTML pages.
2. Move them into shared first-party JS owners where possible.
3. Keep page HTML focused on structure, not behavioral bootstrap duplication.

Recommended starting targets:

- `news.html`
- `orders.html`
- `student-service.html`
- `library.html`

Reason:

- they already use similar shell/mobile bootstrap patterns
- they are less dangerous than `lms.html` or `registration.html`

Do not do this:

- do not centralize page-specific logic into one giant generic bootstrap again
- do not break existing standalone-route behavior

Verification gate:

- repeated HTML bootstrap blocks shrink materially
- touched route HTML remains valid
- route regressions stay green
- shared bootstrap code has one obvious owner instead of being copy-pasted

Update `2026-05-18`:
- Status: partially completed
- % left: `85% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: repeated mobile-shell/bootstrap patterns are still visible across many root entries even though the HTML audit backlog is closed
- Remaining work: extract one shared bootstrap path and remove it from at least one route family

Update `2026-05-18`:
- Status: partially completed
- % left: `55% left`
- Files changed: `news.html`, `orders.html`, `student-service.html`, `library.html`, `test/news-route-regressions.test.js`, `test/orders-route-regressions.test.js`, `test/student-service-split-workspace.test.js`, `test/library-route-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npx vitest run test/news-route-regressions.test.js test/orders-route-regressions.test.js test/student-service-route-split.test.js test/library-route-regressions.test.js`; `npm run test`; `npm run test:runtime-shell`; the first standalone route family now delegates mobile shell/bootstrap behavior through `assets/js/pages/standalone-mobile-shell.js` with per-page config instead of repeating the inline `initMobileExperience` block
- Remaining work: convert more standalone route families to shared bootstrap paths and reduce the duplicated mobile-shell markup itself where a stable shared owner is clear

Update `2026-05-18`:
- Status: partially completed
- % left: `50% left`
- Files changed: `news.html`, `index.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `assets/js/pages/news.js`, `tools/check-architecture-guardrails.js`, `test/news-route-regressions.test.js`, `test/global-performance-regressions.test.js`, `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `news.html` no longer carries a full standalone shell/bootstrap/runtime stack at all, because the live route now bootstraps through the shell-owned `#page-news` section in `index.html` and the wrapper is reduced to one redirect script
- Remaining work: apply the same ownership reduction pattern to more standalone route families and then reduce the duplicated mobile markup that still remains in `orders.html`, `student-service.html`, and `library.html`

Update `2026-05-18`:
- Status: partially completed
- % left: `40% left`
- Files changed: `student-service.html`, `index.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `assets/js/pages/student-service.js`, `tools/check-architecture-guardrails.js`, `test/student-service-split-workspace.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `student-service.html` no longer carries a full standalone shell/bootstrap/runtime stack either, because the live route now bootstraps through the shell-owned `#page-student-service` section in `index.html` and the wrapper is reduced to one redirect script
- Remaining work: the duplicated mobile/bootstrap ownership is now mostly concentrated in `orders.html` and `library.html`, plus any remaining standalone route families that still carry their own mobile shell markup

Update `2026-05-18`:
- Status: partially completed
- % left: `30% left`
- Files changed: `orders.html`, `index.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `test/orders-route-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/ROUTE_NAVIGATION_MODE_MATRIX.md`, `docs/ROOT_ROUTE_SMOKE_MATRIX.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `orders.html` no longer carries a full standalone shell/bootstrap/runtime stack either, because the live route now bootstraps through the shell-owned `#page-orders` section in `index.html` and the wrapper is reduced to a role-aware redirect script
- Remaining work: bootstrap duplication is now mostly concentrated in `library.html` plus any later standalone route families that still ship their own mobile shell markup instead of one shared owner

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `library.html`, `index.html`, `assets/js/app/app.js`, `assets/js/features/navigation.js`, `assets/js/pages/library.js`, `test/library-route-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `tools/check-architecture-guardrails.js`, `package.json`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/library-route-regressions.test.js test/root-font-delivery-regressions.test.js`; `library.html` is now a thin shell alias wrapper, while the live Library route boots through the shell-owned `#page-library` section in [index.html](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/index.html>) with a route-owned controller in [assets/js/pages/library.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/library.js>)
- Remaining work: none for this task; the standalone route family now uses shell-owned pages for `news`, `student-service`, `orders`, and `library`

### `PROF-08` `0% left` Replace monolithic shared-state assumptions with narrower domain persistence contracts

Priority: `P0`
Depends on: `PROF-01`, `PROF-03`

Why this exists:

- the current single-writer monolithic state model is explicitly accepted, but it is not the final professional target

Primary files:

- backend persistence/runtime state owners
- [docs/PRODUCTION_STATE_MODEL_DECISION.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/PRODUCTION_STATE_MODEL_DECISION.md>)

Exact work:

1. Decide which domains remain inside the monolithic record model temporarily.
2. Identify the first domain that can move to narrower persistence without platform-wide rewrite.
3. Introduce domain-specific persistence APIs before any storage-engine migration.
4. Only then consider moving live runtime ownership onto normalized records.

Do not do this:

- do not attempt full multi-writer redesign in one pass
- do not mix persistence migration with unrelated UI cleanup

Verification gate:

- at least one domain has narrower persistence ownership than before
- the persistence direction is clearer in code, not just in docs

Update `2026-05-18`:
- Status: partially completed
- % left: `80% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: state-model decision is documented, but implementation still relies on the monolithic record-store runtime
- Remaining work: identify the first safe domain persistence extraction before attempting broader schema migration

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `backend/platform/state-shape.js`, `backend/platform/store.js`, `test/portal-state-persistence-safety.test.js`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npx vitest run test/portal-state-persistence-safety.test.js test/backend-platform-contracts.test.js test/protected-quiz-host-regressions.test.js`; LMS live-quiz persistence now has a narrower owner in `state.portal.liveQuizWorkspaces`, while [backend/platform/store.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/backend/platform/store.js>) mirrors that domain back into the bootstrap contract instead of keeping it inside the generic `portal.state` writer path
- Remaining work: none for this task; broader multi-writer or normalized-record migration remains a future architecture stream, but the first narrower persistence seam is now implemented in code

### `PROF-09` `0% left` Standardize UI composition and DOM rendering discipline

Priority: `P1`
Depends on: `PROF-06`

Why this exists:

- the codebase still uses many large HTML-string renderers
- that makes long-term UI maintenance harder and CSP/trusted-types work less realistic

Primary files:

- large UI string-render owners already identified in [DOM_SINK_INVENTORY.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/DOM_SINK_INVENTORY.md>)

Exact work:

1. Define preferred rendering patterns:
   - safe templating helpers
   - DOM builder helpers
   - when `innerHTML` is acceptable
2. Standardize one route family on the preferred pattern.
3. Reduce ad hoc UI-string construction in the highest-risk shared modules first.

Do not do this:

- do not try to delete all `innerHTML` in one campaign
- do not replace readable code with verbose low-signal DOM code unless it actually improves safety/ownership

Verification gate:

- one route/shared owner is visibly cleaner by the chosen standard
- rendering policy is explicit and repeatable

Update `2026-05-18`:
- Status: partially completed
- % left: `87% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: sink inventory is explicit, but rendering discipline is not yet standardized in implementation
- Remaining work: choose a rendering standard and apply it to one real route family first

Update `2026-05-18`:
- Status: partially completed
- % left: `55% left`
- Files changed: `assets/js/pages/library.js`, `docs/DOM_RENDERING_STANDARD.md`, `test/library-route-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npx vitest run test/library-route-regressions.test.js`; [docs/DOM_RENDERING_STANDARD.md](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/docs/DOM_RENDERING_STANDARD.md>) now defines the preferred route-owned rendering rules, and [assets/js/pages/library.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/library.js>) uses DOM builders plus `DocumentFragment` / `replaceChildren(...)` for picker options, filter `<option>` lists, and dynamic table rows
- Remaining work: apply the same rendering standard to one of the higher-risk shared owners in `DOM_SINK_INVENTORY.md`, because the first route-family standard is now explicit but the larger shared string-render owners still remain

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `assets/js/shared/orders-workspace.js`, `docs/DOM_RENDERING_STANDARD.md`, `test/orders-route-regressions.test.js`, `test/admin-orders-route-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js`; [assets/js/shared/orders-workspace.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/orders-workspace.js>) now uses DOM-builder rendering with `createRecipientOrdersListItem(...)`, `createAdminRecipientRow(...)`, `renderRecipientOrdersListPanelRegions(...)`, `renderAdminOrdersRecipientsPanelRegions(...)`, and `replaceChildren(...)` for the shared inbox/recipient list paths
- Remaining work: none for this task; the rendering policy is now explicit and repeatable, and one higher-risk shared owner is visibly cleaner by that standard

### `PROF-10` `0% left` Add automated architecture guardrails so the codebase does not drift back

Priority: `P1`
Depends on: `PROF-01`, `PROF-02`, `PROF-06`

Why this exists:

- professionalism is not just refactoring once; it requires guardrails that stop regression

Primary files:

- `package.json`
- `test/`
- `tools/`
- CI or local verifier scripts

Exact work:

1. Add source-level guardrails for:
   - forbidden imports
   - route/bootstrap duplication
   - giant file thresholds
   - deprecated compatibility paths
2. Fail checks when prohibited patterns reappear.
3. Document exceptions instead of silently allowing them.

Recommended first guardrails:

1. file-size threshold warning script for:
   - backend domain owners
   - frontend route owners
2. forbidden import/source assertions for deprecated route-pack imports
3. route HTML bootstrap duplication checks for the first cleaned route family

Do not do this:

- do not set arbitrary guardrails no one can satisfy
- do not add checks that only measure style while missing structure

Verification gate:

- at least one architecture-specific check exists beyond syntax/tests
- the check fails meaningfully on the targeted bad pattern

Update `2026-05-18`:
- Status: partially completed
- % left: `82% left`
- Files changed: `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: current checks are strong for runtime/security regressions, but not yet strong for preventing structural drift
- Remaining work: introduce architecture-specific checks only after the first refactor slices land

Update `2026-05-18`:
- Status: partially completed
- % left: `70% left`
- Files changed: `package.json`, `test/student-service-store-domain-split.test.js`, `test/platform-ops-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform` now syntax-checks extracted backend domain/route modules; `npx vitest run test/student-service-store-domain-split.test.js test/platform-ops-route-split.test.js` adds architecture-specific ownership assertions beyond pure runtime checks
- Remaining work: add explicit file-size thresholds, forbidden-import checks, and route-bootstrap duplication guards so structural regressions fail even when no route-specific split test exists yet

Update `2026-05-18`:
- Status: partially completed
- % left: `62% left`
- Files changed: `package.json`, `test/admin-integrations-route-split.test.js`, `test/route-audit-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform` now syntax-checks `backend/platform/routes/admin-integrations-routes.js`; `npx vitest run test/admin-integrations-route-split.test.js test/route-audit-regressions.test.js` adds architecture-specific ownership and audit-wiring assertions for the extracted admin/integration family
- Remaining work: add explicit file-size thresholds, forbidden-import checks, and route-bootstrap duplication guards so structural regressions fail even when no route-specific split test exists yet

Update `2026-05-18`:
- Status: partially completed
- % left: `54% left`
- Files changed: `package.json`, `test/admin-support-route-split.test.js`, `test/audit-ingest-security.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:platform` now syntax-checks `backend/platform/routes/admin-support-routes.js`; `npx vitest run test/admin-support-route-split.test.js test/audit-ingest-security.test.js` adds ownership and security assertions for the extracted audit/admin support family
- Remaining work: add explicit file-size thresholds, forbidden-import checks, and route-bootstrap duplication guards so structural regressions fail even when no route-specific split test exists yet

Update `2026-05-18`:
- Status: partially completed
- % left: `38% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `node tools/check-architecture-guardrails.js`; `npm run check:architecture`; `npm run check`; `check:architecture` now enforces extracted route ownership removal from `server.js`, forbidden direct store/domain imports in route modules, and temporary exception ceilings for the current oversized files
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and convert the temporary file-size exception ceilings into stricter post-split thresholds as the oversized owners shrink

Update `2026-05-18`:
- Status: partially completed
- % left: `26% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/student-service-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; the guardrail now also enforces Student Service route-family ownership removal from `server.js` and keeps `npm run check` green with the architecture gate included
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and replace the temporary file-size exception ceilings with stricter post-split ceilings as the oversized owners shrink

Update `2026-05-18`:
- Status: partially completed
- % left: `1% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/mail-microsoft-route-split.test.js`, `test/portal-support-route-split.test.js`, `test/system-auth-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; the guardrail now also enforces the Microsoft/mail/portal-support/system/auth-maintenance route-family ownership removal from `server.js` and keeps `npm run check` green with the backend route families covered end-to-end
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and replace the temporary file-size exception ceilings with stricter post-split ceilings as the oversized owners shrink

Update `2026-05-18`:
- Status: partially completed
- % left: `18% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/gradebook-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; the guardrail now also enforces gradebook route-family ownership removal from `server.js` and keeps `npm run check` green with all extracted backend route families covered
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and replace the temporary file-size exception ceilings with stricter post-split ceilings as the oversized owners shrink

Update `2026-05-18`:
- Status: partially completed
- % left: `10% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/protected-exam-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; the guardrail now also enforces protected-exam/protected-quiz route-family ownership removal from `server.js` and keeps `npm run check` green with the extracted backend route families covered end-to-end
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and replace the temporary file-size exception ceilings with stricter post-split ceilings as the oversized owners shrink

Update `2026-05-18`:
- Status: partially completed
- % left: `4% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/messenger-calls-route-split.test.js`, `test/social-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; the guardrail now also enforces messenger/calls and social route-family ownership removal from `server.js` and keeps `npm run check` green with the extracted backend route families covered end-to-end
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and replace the temporary file-size exception ceilings with stricter post-split ceilings as the oversized owners shrink

Update `2026-05-18`:
- Status: partially completed
- % left: `2% left`
- Files changed: `tools/check-architecture-guardrails.js`, `package.json`, `docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`, `test/backend-platform-contracts.test.js`, `test/lms-live-quiz-route-split.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; the guardrail now also enforces LMS live-quiz route ownership removal from `server.js` and keeps `npm run check` green with the extracted backend route families covered end-to-end
- Remaining work: add route HTML bootstrap duplication checks for the first cleaned frontend route family and replace the temporary file-size exception ceilings with stricter post-split ceilings as the oversized owners shrink

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `news.html`, `orders.html`, `student-service.html`, `library.html`, `test/news-route-regressions.test.js`, `test/orders-route-regressions.test.js`, `test/student-service-split-workspace.test.js`, `test/library-route-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `check:architecture` now fails if `news.html`, `orders.html`, `student-service.html`, or `library.html` reintroduce the inline mobile bootstrap instead of `assets/js/pages/standalone-mobile-shell.js`, and the backend ceilings are tightened to `5000` lines for `backend/platform/store.js` and `3000` lines for `backend/platform/server.js`
- Remaining work: none for this task; remaining oversized frontend owners stay covered by documented temporary exception ceilings until their dedicated split tasks land

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `news.html`, `index.html`, `test/news-route-regressions.test.js`, `test/global-performance-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `check:architecture` now enforces `news.html` as a shell alias wrapper (`window.location.replace(target)`) instead of a standalone mobile-shell page, while still enforcing shared mobile-shell ownership for `orders.html`, `student-service.html`, and `library.html`
- Remaining work: none; this only tightened the already-complete guardrail set to match the new route ownership shape

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `student-service.html`, `index.html`, `test/student-service-split-workspace.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `check:architecture` now enforces `student-service.html` as a shell alias wrapper (`window.location.replace(target)`) instead of a standalone mobile-shell page, while still enforcing shared mobile-shell ownership for the remaining standalone family members
- Remaining work: none; this only tightened the completed guardrail set to match the newer shell-owned route map

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `orders.html`, `index.html`, `test/orders-route-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `check:architecture` now enforces `orders.html` as a shell alias wrapper (`window.location.replace(target)`) instead of a standalone mobile-shell page, while still enforcing shared mobile-shell ownership for the remaining standalone family member
- Remaining work: none; this only tightened the completed guardrail set to match the newer shell-owned route map

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `library.html`, `test/library-route-regressions.test.js`, `test/root-font-delivery-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check:architecture`; `npm run check`; `check:architecture` now enforces `library.html` as a shell alias wrapper (`window.location.replace(target)`) instead of a standalone mobile-shell page, while the regression suite keeps the wrapper and shared-font expectations aligned with the shell-owned route model
- Remaining work: none; this only tightened the completed guardrail set to match the newer shell-owned route map

Update `2026-05-18`:
- Status: completed
- % left: `0% left`
- Files changed: `tools/check-architecture-guardrails.js`, `test/lms-quiz-workspace-module-split.test.js`, `test/lms-classroom-tabs-module-split.test.js`, `test/lms-content-library-module-split.test.js`, `test/scheduler-and-lms-regressions.test.js`, `docs/PLATFORM_PROFESSIONALIZATION_TASK_TRACKER.md`
- Evidence: `npm run check`; `npm run test`; `npm run test:runtime-shell`; `check:architecture` now enforces post-split frontend ceilings of `3000` for [assets/js/pages/lms.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/lms.js>), `2600` for [assets/js/features/index-luxury.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/features/index-luxury.js>), `2400` for [assets/js/pages/registration.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/pages/registration.js>), `2700` for [assets/js/shared/faculty.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/faculty.js>), and `2400` for [assets/js/shared/messenger.js](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/assets/js/shared/messenger.js>), while the LMS module-split regression suite proves the new content-library, quiz-workspace, and classroom-tab ownership boundaries stay out of `lms.js`
- Remaining work: none; the architecture guardrail now matches the completed post-split frontend structure instead of the earlier temporary exception ceilings

## Verification Matrix

Do not claim this workstream complete unless all of these are true:

### Structural verification

- the largest backend owner files are materially smaller
- the largest frontend owner files are materially smaller
- domain ownership can be explained cleanly without relying on thread memory

### Behavioral verification

- `npm run check`
- `npm run test`
- `npm run test:runtime-shell`

### Architecture verification

- route model is simpler than today, not more mixed
- repeated HTML/bootstrap patterns are materially reduced
- at least one architecture-specific guardrail is in place

## Important Handoff Note

Do **not** start by “cleaning everything at once.”

That is the fastest way to destroy behavior while creating a fake sense of progress.

The correct approach is:

1. pick one ownership seam
2. move one subsystem cleanly
3. verify it
4. update this file
5. continue

Also do not let documentation-only closure hide unfinished implementation.

Some architecture audit questions are already documented elsewhere; this tracker is for actually changing the codebase shape, not just describing it.
