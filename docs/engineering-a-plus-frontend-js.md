**Cursor agents:** start with [`docs/CURSOR-HANDOFF.md`](CURSOR-HANDOFF.md) (plans, non-goals, paste prompts).

# Engineering A+ — Frontend JS structure

Goal: make `assets/js` maintainable enough for university IT without a full SPA rewrite.

**Engineering band queue (criteria 13–22):** [`docs/engineering-band-queue.md`](engineering-band-queue.md) — **E1–E6 ✅** (queued criteria all ≥8). E2 ✅ shared-hub isolation, E3 ✅ typeof-probe hygiene, E4 ✅ god-file peels, and E5 ✅ ESM ratchet are complete.

**Current baseline (2026-07-20):** **277** files · **~179.3k** lines · multi-page script tags · bare `window.*` gated ≤**900** · **≥10 ESM modules** (E5) · dead `assets/js/portfolio/` removed (E6).

## Definition of done (Engineering A+)

| Criterion | Target |
|-----------|--------|
| No unbounded god files | Every hot file has a **line ceiling** in `tools/check-architecture-guardrails.js`; ceilings **only go down** after extracts |
| Domain modules | Social / LMS / student-service / utilities split by domain, following existing `*-runtime` / `*-model` patterns |
| Globals | New code does not add `window.*` APIs; extracts prefer `window.Kiu*` namespaces then thin re-exports for stubs |
| ESM | New pure helpers may be classic IIFE (compatible) or `type="module"` only when no load-order dependency; full ESM conversion is **later** |
| Tests | Each extract has a pure unit test or source-contract test; domain suites stay green |
| Load order | Documented in HTML + lazy `ensure*Module` chains; no silent cross-file free variables |

## Peel contract (Wave 11+)

New extracts **must**:

1. Use `createKiu*Api(deps)` / `__kiuCreate*` factory (explicit deps object — no new silent free-vars)
2. Include a `__KIU_*_LOADED` load guard (second load is a no-op)
3. Prefer **one** load owner: eager HTML **or** lazy `ensure*`, not both (exception: load-guarded dual path, e.g. Blue)
4. Ship a source-lock vitest asserting factory marker + script order
5. **Wave 14+ structure scorecard:** do not add bare `window.foo = function` APIs on allowlisted peels — export via `Object.assign(window, api)` / `window.Kiu*` / `window.__kiu*` only

Allowlisted factory peels are checked by `npm run check:js-ceilings` / `check:architecture` (factory contract + structure scorecard).

Daily habit: `npm run check:js-ceilings` (line ceilings + factory contract). Full `npm run check:architecture` is also daily-green after Wave 19 (CSS/mobile classification aligned to visual SSOT).

## Non-goals (do not block A+)

- Rewriting the portal as React/Vue
- Converting all 154 files to ESM in one pass
- Pixel redesign (CSS track is separate)
- Deleting archive CSS

## Existing patterns to copy

1. **Lazy domain modules** — `social-page.js` stubs + `ensureSocialWorkspaceModule()` loads `social-workspace-risk-model.js` then `social-workspace.js`.
2. **Pure model peel** — `social-workspace-risk-model.js` → `window.KiuSocialWorkspaceRiskModel` + window re-exports for stubs.
3. **LMS runtimes** — `lms.js` + many `lms-*-runtime.js` files; `lms.js` already has a line ceiling.
4. **Student-service lazy peel** — `student-service.js` orchestrates `*-qa`, `*-filters`, `*-tickets`, etc.
5. **ESM island** — `features/luxury-background.js` as `type="module"`.

## Wave plan

### Wave 0 — Freeze ✅

- Document this plan.
- Add line ceilings for top frontend god files (growth freeze).
- Rule: **new feature code goes in new files**, not into files at ceiling.

### Wave 1 — Social workspace pure peels

| Extract | From | Into | Risk | Status |
|---------|------|------|------|--------|
| Schedule / PERT + CPM | `social-workspace.js` | `social-workspace-schedule-model.js` | Low | ✅ (includes `computeProjectSchedule`) |
| Health score pure model | `renderProjectHealthDialog` scoring | `social-workspace-health-model.js` | Medium | ✅ |
| Task-graph pure layout math | force/status layout, bounds, zoom, cubic edges | `social-workspace-graph-model.js` | Medium–high | ✅ |
| Desk order/forest/readiness + group rollup | more pure desk/graph | `social-workspace-graph-model.js` | Medium | ✅ |
| Board filter/priority + polyline helpers | more pure desk/graph | `social-workspace-graph-model.js` | Medium | ✅ (workspace ~13.1k) |
| Portfolio normalize / access / field helpers | portfolio data layer | `social-workspace-portfolio-model.js` | Low | ✅ (workspace ~12.9k) |
| Health plan-pick pure model | `buildProjectHealthPlanPickModel` | `social-workspace-health-model.js` | Low | ✅ (workspace ~12.8k) |
| Edge/dock/obstacle/port geometry | `projectTaskGraphEdgePath`, docks, status edge color | `social-workspace-graph-model.js` | Low | ✅ (workspace ~12.7k) |
| Dep/group completeness + pan math | `isProjectGraphDependencyOpen`, pan slack/clamp | `social-workspace-graph-model.js` | Low | ✅ (workspace ~12.6k) |
| Sort / saved-pos / checkpoint / flags / scope | board sort, positions apply, mine-only schedule | `social-workspace-graph-model.js` | Low | ✅ (workspace ~12.4k) |
| Inspector / group-box / context / layout | task inspector fields, map context, pan read | `social-workspace-graph-model.js` | Low | ✅ (workspace ~12.4k) |
| Week-plan store + action predicates | migrate/CRUD + isSocialWorkspace* | `social-workspace-week-plan-model.js` | Low | ✅ (workspace ~12.3k; page ~8.0k) |

Graph **render markup** (SVG/nodes/fullscreen/inspectors) lives in `social-workspace-graph-render.js`; **runtime** (layout/bind/sync/persist) lives in `social-workspace-graph-runtime.js`.

**Load chain (updated Wave 3):** `risk` → `schedule` → `health` → `graph` → `portfolio` → `week-plan` → `schedule-ui` → `tab-runtime` → `events` → `panel` → `graph-runtime` → `dialogs` → `graph-render` → `task-ui` → `portfolio-runtime` → `portfolio-ui` → `project-chrome` → `dialog-route` → `social-workspace.js` (week-plan also eager in `social.html`).

### Wave 1 complete ✅

### Wave 3 — Social workspace structural peels

| Extract | Into | Status |
|---------|------|--------|
| Click / submit / input / change handlers | `social-workspace-events.js` | ✅ (~12.3k → ~10.4k workspace) |
| Classic panel markup | `social-workspace-panel.js` | ✅ (~10.4k → ~8.4k workspace) |
| Graph layout/bind/sync/persist | `social-workspace-graph-runtime.js` | ✅ (~8.4k → ~5.9k workspace) |
| Task detail / risk / health dialogs | `social-workspace-dialogs.js` | ✅ (~5.9k → ~4.9k workspace) |
| Graph SVG / canvas / inspectors / fullscreen | `social-workspace-graph-render.js` | ✅ (~4.9k → ~3.5k workspace) |
| Task form / create-delete / desk-board cards | `social-workspace-task-ui.js` | ✅ (~3.5k → ~2.8k workspace) |
| Portfolio hero / create / discover panel | `social-workspace-portfolio-ui.js` | ✅ (~2.8k → ~2.5k workspace) |
| Project hero / create / settings / invite | `social-workspace-project-chrome.js` | ✅ (~2.5k → ~2.2k workspace) |
| Owned-dialog routing + health/graph stacks | `social-workspace-dialog-route.js` | ✅ (~2.2k → ~2.0k workspace) |
| Tab pane cache/refresh + desk toolbar | `social-workspace-tab-runtime.js` | ✅ |
| Portfolio hydrate/save/editor runtime | `social-workspace-portfolio-runtime.js` | ✅ |
| Schedule baseline/progress strips | `social-workspace-schedule-ui.js` | ✅ (~2.0k → ~1.4k workspace) |

**Load chain:** `…` → `week-plan` → **`schedule-ui`** → **`tab-runtime`** → `events` → … → `task-ui` → **`portfolio-runtime`** → `portfolio-ui` → … → `social-workspace.js`.

Workspace coordinator target met (~1.4k install/re-export shell).

### Wave 2 — Social page slim

| Extract | Into | Status |
|---------|------|--------|
| Task matrix / time / budget / flow pure helpers | `social-task-model.js` (eager, before `social-page.js`) | ✅ |
| Survey/form/entity pure helpers | `social-form-model.js` | ✅ (~8.2k → ~8.0k page) |
| Composer entity-link / attachable list | `social-entity-model.js` | ✅ (~8.0k → ~7.6k page) |
| Lost-found list + survey tab filters | `social-form-model.js` | ✅ (~7.6k → ~7.5k page; also fixed missing resolveLostFound* in form-model) |
| Nav panels + panel hero config | `social-panel-model.js` | ✅ (~7.5k → ~7.3k page) |
| Home feed filter | `social-panel-model.js` | ✅ (with panel model) |
| Alerts classify / filter / categories | `social-alerts-model.js` | ✅ (~7.3k → ~7.2k page) |
| Profile / people / connection / feedReason | `social-profile-model.js` | ✅ (~7.2k → ~7.0k page) |
| Render fingerprints (feed/events/…/pages) | `social-fingerprint-model.js` | ✅ (~7.0k → ~6.9k page; signature stays on page) |
| `buildSocialRenderSignature` | `social-fingerprint-model.js` | ✅ |
| Notification target URL | `social-alerts-model.js` | ✅ |
| `photographyPosts` | `social-panel-model.js` | ✅ (~6.9k → ~6.7k page) |
| Survey draft / datetime / scope parse | `social-form-model.js` | ✅ |
| Posting / feed / event scope options | `social-panel-model.js` | ✅ (~6.7k → ~6.6k page) |
| Chrome display / avatars / drafts / context tabs | `social-chrome-model.js` | ✅ (~6.6k → ~6.3k page) |
| Workspace stub name registry | `social-workspace-stubs.js` | ✅ |
| `syncSurveyDraftFromForm` | `social-form-model.js` | ✅ (~6.3k → ~6.2k page) |
| Account / when / escape / file / avatar peels | `social-chrome-model.js` | ✅ (~6.2k → ~6.1k page) |
| Dialog kind router | `social-dialog-router.js` | ✅ |
| Force-render reason regex | `social-fingerprint-model.js` | ✅ (~6.1k → ~6.0k page) |
| Shell panel-nav clicks + click domain routes | `social-shell-nav.js` | ✅ (~6.0k → ~5.7k page) |
| DOM handlers + submit/input/change routes | `social-page-events.js` | ✅ (~5.7k → ~5.3k page) |
| Overlay portal + dialog open/close/lock | `social-overlay-chrome.js` | ✅ (~5.3k → ~5.0k page) |

Target long-term: router/stubs only (&lt;5k).
### Wave 3 — Student service

| Extract | Into | Status |
|---------|------|--------|
| Escape/dates/macros/registration ids/fingerprints/page labels | `student-service-model.js` | ✅ |
| Command bar / lane chooser / delete confirm shell | `student-service-chrome.js` | ✅ (~5.7k → ~5.4k) |
| Delegated click/input/change/escape handlers | `student-service-events.js` | ✅ (~5.4k → ~4.9k) |

### Wave 4 — Utilities transparency ✅

| Extract | Into | Status |
|---------|------|--------|
| Panel transparency engine (`updateTransparency` + surfaces/observers) | `assets/js/shared/lux-transparency.js` | ✅ (`utilities.js` ~3.8k → ~1.3k; wired on 22 HTML pages) |

### Wave 5 — Whiteboard ✅ (geometry + pointer peels)

| Extract | Into | Status |
|---------|------|--------|
| Geometry / color / text-layout pure helpers | `lms-whiteboard-model.js` | ✅ (`runtime` ~5.3k → ~4.9k; lazy-loaded before runtime) |
| Stage pointer bind + wheel/touch/pointer/dblclick | `lms-whiteboard-pointer-runtime.js` | ✅ (`runtime` ~4.9k → ~4.4k) |
| Canvas paint + grid + element draw | `lms-whiteboard-paint-runtime.js` | ✅ (`runtime` ~4.4k → ~4.0k) |

Whiteboard paint/pointer wave complete.

### Wave 6 — App English localization ✅

| Extract | Into | Status |
|---------|------|--------|
| English UI + mojibake/encoding repair (~1.2k lines) | `assets/js/app/english-localization.js` | ✅ (`app.js` ~3.0k → ~1.8k; wired on 21 HTML pages) |

### Wave 7 — LMS quiz pure model ✅

| Extract | Into | Status |
|---------|------|--------|
| Builder draft / scoring / status / anti-cheat normalize | `lms-quiz-model.js` | ✅ (`quiz-workspace-runtime` ~3.3k → ~3.0k; lazy before runtime) |

### Wave 8 — LMS Kiu Blue ✅

| Extract | Into | Status |
|---------|------|--------|
| Kiu Blue helper/gate/heartbeat | `lms-quiz-blue-runtime.js` | ✅ (`lms.js` ~3.1k → ~2.7k; eager before `lms.js` + in `LMS_QUIZ_MODULE_URLS`) |

### Wave 9 — Luxury atmosphere ✅

| Extract | Into | Status |
|---------|------|--------|
| Theme / background / particles / fog / studio mixer | `luxury-atmosphere-runtime.js` | ✅ (`index-luxury.js` ~3.1k → ~2.6k; eager before `index-luxury.js` on 22 pages) |

### Wave 10 — Luxury palette ✅

| Extract | Into | Status |
|---------|------|--------|
| Color helpers + palette resolve/apply | `luxury-palette-runtime.js` | ✅ (`index-luxury.js` ~2.6k → ~2.3k; eager before atmosphere/`index-luxury.js`) |

### Wave 11 — Maintainability ✅

| Extract | Into | Status |
|---------|------|--------|
| Peel contract + `check:js-ceilings` | docs + guardrails | ✅ |
| Fog profile studio UI | `luxury-shell-studio-runtime.js` | ✅ (`luxury-shell-chrome.js` ~3.3k → ~2.7k; factory+deps) |
| Article/page/bootstrap | `student-service-page-runtime.js` | ✅ (`student-service.js` ~4.9k → ~4.5k; factory+deps) |
| Admin mobile-shell CSS expectation | `lux-page-bare-lite.css` | ✅ (3 explicit guardrails) |

### Wave 12 — Social desk + survey peel

| Extract | Into | Status |
|---------|------|--------|
| Desk forest / dependency order / group rollup | `social-workspace-graph-desk-model.js` | ✅ (`graph-model` ~2.2k → ~1.7k; desk in `ensureSocialWorkspaceModule` before graph-model) |
| Survey create/take helpers | `social-page-survey-runtime.js` | ✅ (`social-page.js` ~4240/4500; factory+deps; eager on `social.html` before `social-page.js`) |

### Wave 13 — Student-service inbox + A+ metrics

| Extract | Into | Status |
|---------|------|--------|
| Inbox filter forwards + UI prefs/lane/stores | `student-service-inbox-runtime.js` | ✅ (`student-service.js` ~4.5k → ~3.5k; factory+deps; eager on `student-service.html` before main) |
| Success metrics “Now” column refresh | docs | ✅ (≥5k assets/js = 0; ≥2k ≈ 27; largest ~4.2k) |

### Wave 14 — Structure ladder (6.5 → ~8)

| Extract | Into | Status |
|---------|------|--------|
| Factory structure scorecard | `check:js-ceilings` | ✅ (allowlisted peels: no bare `window.X = function`; `__kiu*` / `Kiu*` / `Object.assign(window, api)` OK) |
| Freeze ≥2.5k hot files | ceilings | ✅ (`social-runtime-lite`, `lms-classroom-tabs-runtime`, `index-home-dashboard.plain`, `admin-registration`, `exams-console`) |
| Entity/compose + panel/shell helpers | `social-page-feed-runtime.js` | ✅ (`social-page.js` ~4.2k → ~3.4k; factory+deps bag; eager on `social.html`) |

### Wave 15 — Structure 10 ✅

| Extract | Into | Status |
|---------|------|--------|
| Whiteboard theme/rail/HUD/chrome | `lms-whiteboard-chrome-runtime.js` | ✅ (factory; lazy via classroom-tabs before whiteboard runtime) |
| Lazy loaders + hub stubs | `student-service-modules-runtime.js` | ✅ (`student-service.js` under 3k; eager before main) |
| Workspace-nav + inbox scroll + group-leave | `social-page-shell-runtime.js` | ✅ (factory; eager on `social.html` before `social-page.js`) |
| Membership/tasks/budget/risks | `social-lite-project-runtime.js` | ✅ (batch peel; eager on `social.html`) |
| Next-session / marker preview | `lms-classroom-sessions-runtime.js` | ✅ (batch peel; eager on `lms.html` + tabs chain) |
| Dashboard widget row adapters | `home-dashboard-widget-data-runtime.js` | ✅ (batch peel; factory) |
| Seat / registration-data helpers | `admin-registration-seats-runtime.js` | ✅ (batch peel; factory) |
| Student quiz focus chrome | `lms-quiz-focus-runtime.js` | ✅ (batch peel; lazy via classroom-tabs) |
| Hard ≥3k gate | `check:js-ceilings` | ✅ (no `assets/js` file may reach 3000 lines) |
| ESM leaf + classic bridge | `social-entity-model.js` + `social-entity-model-bridge.js` | ✅ (`type="module"` then defer bridge on `social.html`) |

### Wave 16 — Size A+ (≤8 files ≥2k) ✅

| Extract | Into | Status |
|---------|------|--------|
| Mid/large hosts (home dashboard, graph, live-quiz, shell chrome, lms.js, api, registration, lux-transparency, faculty, …) | Wave 16 factory peels | ✅ (11 hosts ≤1999) |
| Easy hosts (gradebook, messenger, form-builder, qa, command-center, workspace events/panel) | size peels | ✅ |
| Size gate | `check:js-ceilings` | ✅ (files ≥2k ≤ 8) |

### Wave 17 — Zero files ≥2k ✅

| Extract | Into | Status |
|---------|------|--------|
| Whiteboard session/tools | `lms-whiteboard-session-runtime.js` | ✅ (lazy via classroom-tabs before runtime) |
| Quiz workspace session | `lms-quiz-workspace-session-runtime.js` | ✅ (`LMS_QUIZ_MODULE_URLS` before workspace) |
| Social page interactions | `social-page-interactions-runtime.js` | ✅ (eager on `social.html` before page) |
| Social lite content | `social-lite-content-runtime.js` | ✅ (eager before lite on `social.html`) |
| Student-service ops | `student-service-ops-runtime.js` | ✅ (eager before main) |
| Admin registration CMS | `admin-registration-cms-runtime.js` | ✅ (registration script list before host) |
| Classroom tabs shell | `lms-classroom-tabs-shell-runtime.js` | ✅ (eager on `lms.html`; URL lists stay on host) |
| Exams console workspace | `exams-console-workspace-runtime.js` | ✅ (eager on `exams.html` before console) |
| Size gate ratchet | `check:js-ceilings` | ✅ (files ≥2k must be **0**) |

### Wave 18 — Headroom (near-ceiling safety) ✅

| Extract | Into | Status |
|---------|------|--------|
| 25 hot hosts ≥1900 peeled to ≤1850 | factory peels (selection/review/academic/session/topbar/chrome/… ) | ✅ |
| Host ceilings | `maxLines: 1850` on hot hosts | ✅ |
| Headroom gate | `check:js-ceilings` | ✅ (no `assets/js` file ≥**1900**) |

### Wave 19 — Full architecture (CSS noise → green) ✅

| Change | Status |
|--------|--------|
| `getDedicatedRouteCss` excludes shared stack (`lux-shell`, `mobile-shell-core`, `mobile-shell`, `lux-fouc-ht`) | ✅ |
| `routeVisualClassification` aligned to live bare stack (no deleted social/staff route skins) | ✅ |
| Shared chrome/surface/action rules moved from `lux-page-bare-lite` → `lux-shell` | ✅ |
| `__KIU_STANDALONE_MOBILE_SHELL_CONFIG` on library / news / orders / student-service | ✅ |
| `npm run check:architecture` | ✅ daily-green again |

### Wave 20 — Module boundaries (bare `window.*` → namespaces + ESM leaf) ✅

| Change | Status |
|--------|--------|
| Bare `window.X=` gate (`BARE_WINDOW_ASSIGN_MAX` ≤ 2400) in `check:js-ceilings` | ✅ |
| `social-workspace.js` → `KiuSocialWorkspace` / `__kiuSwApi` (no blanket `Object.assign(window, SocialUiKernel)`) | ✅ |
| Stub resolver reads `Kiu*` namespaces (`resolveSocialExportImpl`) | ✅ |
| Model flat re-export loops removed (risk / week-plan / graph / schedule / portfolio / desk) | ✅ |
| Risk model ESM leaf + namespace-only bridge (ESM leaves 2 → 3) | ✅ |
| `portal-compat-runtime.js` peeled from `app.js`; `form-blueprint-runtime` factory + `Object.assign` | ✅ |

### Wave 21 — Globals debt (student-service + app.js) ✅

| Change | Status |
|--------|--------|
| `KiuStudentService` + `resolveStudentServiceExportImpl`; hub/`__ssModuleForward` bag-aware | ✅ |
| filters / qa / tickets bare tails → `__kiuSsApi` (thin hub flats only) | ✅ |
| `student-service.js` expose*Deps → bag-first (host bare ≤25) | ✅ |
| `portal-api-stubs-runtime.js` peeled from `app.js` (~30 stubs); wired on 21 HTML pages | ✅ |
| Bare gate ratchet | ✅ (**≤1300**, was 2400) |

### Wave 22 — Full architecture (timetable CSS → green) ✅

| Change | Status |
|--------|--------|
| `timetable.html` dedicatedCss includes `layout-schedule-board.css` + bare-lite | ✅ |
| Classification / PORTAL doc / mobile-shell source-lock aligned to live HTML | ✅ |
| `npm run check:architecture` | ✅ daily-green again |

### Wave 23 — Modern stack (ESM leaf expansion) ✅

| Change | Status |
|--------|--------|
| `social-task-model.js` + `social-form-model.js` → ESM `export` + `install*` | ✅ |
| Classic bridges on `social.html` (module then defer) | ✅ |
| ESM leaf gate `ESM_LEAF_MIN = 5` in `check:js-ceilings` | ✅ |
| Source-locks: `test/wave23-esm-leaves.test.js` + updated task/form model tests | ✅ |

Leaves now: luxury-background, social-entity-model, social-workspace-risk-model, social-task-model, social-form-model. No bundler — classic MPA with more real modules.

### Wave 24 — Portal A+ 10 (ESM + gradebook bag + test hygiene) ✅

| Change | Status |
|--------|--------|
| `social-alerts-model` + `social-panel-model` → ESM + bridges on `social.html` | ✅ |
| ESM leaf gate **`ESM_LEAF_MIN = 7`** | ✅ |
| `gradebook-workspace.js` → `KiuGradebookWorkspace` / `__kiuGbApi` / `__kiuGbExpose` | ✅ |
| Bare assign gate **1300 → 1220** (measured **1209**) | ✅ |
| Stale bare/staff/social source-locks aligned to bare SSOT + archive helper | ✅ |
| `test/wave24-portal-a-plus.test.js` | ✅ |

### Wave 25 — ESM ≥8 + LMS tabs bag ✅

| Change | Status |
|--------|--------|
| `social-profile-model` → ESM + bridge on `social.html` | ✅ |
| Lazy LMS `type=module` for quiz/whiteboard models + bridges in `MODULE_URLS` | ✅ |
| ESM leaf gate **`ESM_LEAF_MIN = 8`** (+ quiz/whiteboard markers) | ✅ |
| `lms-classroom-tabs-runtime.js` → `KiuLmsClassroomTabs` / `__kiuLmsTabsExpose` | ✅ |
| `test/wave25-portal-a-plus.test.js` | ✅ |

### Wave 26 — Portal A+ 10 (bare ≤900) ✅

| Change | Status |
|--------|--------|
| Bag dumpers: `social-feed`, registration track/shared, gradebook-staff, navigation, whiteboard/live-quiz workspace, news-events, form-renderer, student-service*, index-luxury, `app.js` | ✅ |
| Bare assign gate **1220 → 900** (measured **~889**) | ✅ |
| Docs + `test/wave26-portal-a-plus.test.js` claim Portal A+ 10 | ✅ |
| No bundler / no TypeScript | ✅ intentional |

#### Structure ladder

| Score | Meaning |
|-------|---------|
| **6.5** | Peels exist; IIFE/`window.*` soup; inconsistent free-var shims |
| **~8** | Scorecard green; ≥2.5k files capped; social-page under 3.5k |
| **~9** | Most surfaces ≤3k; factory+explicit-deps only on new code; leaf ESM pilot; `window.*` trending down |
| **10** | Zero files ≥3k; hard line gate in `check:js-ceilings`; ESM leaf (`social-entity-model`) + bridge |
| **Size A+** | Files ≥2k ≤ 8 (Wave 16) |
| **Size zero ≥2k** | Zero files ≥2k; size gate MAX=0 (Wave 17) |
| **Headroom** | Zero files ≥1900; headroom gate; hot hosts ≤1850 |
| **Full architecture (now)** | `check:architecture` PASS — timetable owns schedule-board sheet |
| **Module boundaries** | Bare `window.*` gated; hottest host on `KiuSocialWorkspace` |
| **Globals debt** | Bare ≤**900** (Wave 26 / Portal A+ 10); bags on `Kiu*` hosts |
| **Modern stack (ESM)** | ESM leaves ≥**8** (Wave 25); Portal A+ 10 claimed |

## Verification per extract

1. `npm run check:architecture`
2. Relevant vitest: `test/social-*.test.js` or domain suite
3. Manual smoke: open the affected HTML route once if UI-facing

## Priority order (ROI)

1. Freeze ceilings  
2. Social workspace peels (largest single file)  
3. Student-service peel  
4. Utilities transparency  
5. Whiteboard  
6. Social-page slim  
7. App core / ESM  

## Success metrics

| Metric | Now | A+ bar |
|--------|-----|--------|
| Files ≥ 5k lines (`assets/js`) | 0 | 0 |
| Files ≥ 3k lines (`assets/js`) | 0 | 0 (hard gate) |
| Files ≥ 2k lines (`assets/js`) | **0** | ≤ 8 (size gate now **0**) |
| Files ≥ 1900 lines (`assets/js`) | **0** | 0 (headroom gate) |
| Largest file (`assets/js`) | ≤1850 (hot band); few mid-1800s OK under 1900 | ≤ 3k |
| `window.* =` in assets/js | ~2k total; **bare ≤900** (Wave 26; measured ~889) | ≤900 ✅ Portal A+ 10 |
| ESM leaves | **≥8** (Wave 25: +profile/quiz/whiteboard) | ≥8 ✅ |
| Architecture check | **`check:architecture` PASS** (+ `check:js-ceilings` green) | all hot files capped; CSS/mobile classification matches SSOT |

Portal A+ 10 (Waves 25–26): bare ≤900, ESM ≥8, no bundler/TS — **claimed**.

---

*This is a multi-sprint program. Ship extracts behind existing lazy loaders; never rewrite behavior while moving code.*
