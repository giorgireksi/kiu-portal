# Cursor handoff — full project plans + Engineering A+

**Audience:** Cursor IDE (or any coding agent continuing this work).  
**Repo:** KIU campus portal (`kiu-portal-platform`) — multi-page HTML + `assets/js` + Node `backend/platform`.  
**Owner intent:** Hand the site to a **university / IT team** in a form they can run, understand, and safely pilot — not a one-person mystery codebase.

Use this file as the primary **agent** brief. Humans on day 1: [`docs/ONBOARDING.md`](ONBOARDING.md). Also read:

- [`docs/ONBOARDING.md`](ONBOARDING.md) — **human day-1** (boot, indexes, first edit)
- [`docs/findability-index.md`](findability-index.md) — **start here to find code** (feature → owner → HTML)
- [`docs/dependency-index.md`](dependency-index.md) — **what loads before X** (eager hubs + lazy chains)
- [`docs/js-naming-patterns.md`](js-naming-patterns.md) — **exactly three** JS global patterns (A/B/C)
- [`docs/js-change-locality.md`](js-change-locality.md) — keep small edits in ≤2 owners; peels as support
- [`docs/human-maintainability.md`](human-maintainability.md) — human readability scorecard (0–10)
- `docs/engineering-a-plus-frontend-js.md` — JS peel waves and technical definition of A+
- `assets/js/README.md` — JS folder layout and load-order rules
- [`docs/shell-panels.md`](shell-panels.md) / [`docs/visual-ssot.md`](visual-ssot.md) — panel / visual system (if doing CSS)
- [`docs/active-vs-archive.md`](active-vs-archive.md) — live CSS; retired skins purged (do not reintroduce)
- [`docs/test-as-map.md`](test-as-map.md) — which tests lock product invariants
- `tools/check-architecture-guardrails.js` — **line ceilings** (only decrease after peels)

---

## 1. Product summary

Multi-page university portal (not a SPA framework):

- Login, home **dashboard** (polished lux shell), LMS, social, student service, admin tools, registration, exams, library, etc.
- Frontend: root `*.html` + `assets/js/**` (mostly classic scripts, `window.*`, IIFEs; almost no ESM).
- Backend: Node `backend/platform` (+ optional Postgres, realtime bridge, anti-cheat extras).
- Design system: shared lux CSS tokens/panels; intentional **dashboard-first** visual polish.

---

## 2. Owner’s strategic plans (do not lose these)

These are the **product goals**, not just refactoring hobbies.

### Plan A — University / IT offer

1. Package a **demo-ready** snapshot IT can boot and evaluate.
2. Be honest about pilot vs production (auth, HTTPS, backups, SSO).
3. Prefer **readability and structure** over clever abstractions.
4. Support path: supervised pilot first; production hardening jointly with IT.

**IT cares about:** runbook, security posture, data location, who maintains it, what works vs WIP.

**Owner cares about:** code that university staff can read without drowning in 15k-line files.

### Plan B — One global visual system

1. **Dashboard shell / panels / controls** are the visual source of truth.
2. Non-dashboard routes were **intentionally stripped** of heavy route CSS so redesign can reuse dashboard paint globally.
3. Goal: **one edit** to shared lux/shell/panel CSS affects the whole LMS look.
4. Keep visuals when sliming CSS; no accidental “flat / uglier” regressions (depth/shadows already bitten once — restore parity, don’t invent new look).
5. Live CSS lives under `assets/css/`. Retired route skins were **purged** with `_archive/` — do not reintroduce (see [`active-vs-archive.md`](active-vs-archive.md)).

**Related earlier work:** bare-page diet, paint sandwich collapse, promote dashboard paint, human-editable CSS (reject permanent minification).

### Plan C — Engineering A+ frontend structure (current track)

1. **Not** a React rewrite.
2. **Not** “delete half the product.”
3. **Yes** to: freeze god-file growth, peel pure logic into `*-model.js` / chrome modules, tests, load-order discipline.
4. Total JS line count may stay ~same (code **moves**); success = smaller god files + clear owners.
5. Security/XSS/httpOnly sessions are **important for offer**, but structure peels come first unless a security fix is in the active task.

### Plan D — Explicit non-goals (unless owner asks)

- Full ESM conversion of all scripts
- Reintroducing purged CSS archive / retired route skins
- Mass deletion of features for line count vanity
- Rewriting social/LMS as a SPA
- Expanding god files “just this once”

---

## 3. Current snapshot (approx; re-measure before peels)

| Scope | Approx |
|-------|--------|
| `assets/js` (excl vendor) | **~165 files · ~172k lines** |
| Live CSS (`assets/css/`) | **~23 files · ~8.4k lines** (archive purged) |
| Backend JS | ~45 files · ~23k lines |
| Tests | ~400+ vitest files |

**Largest JS files (order of magnitude):**

| Lines | File | Role |
|------:|------|------|
| ~12.7k | `pages/social-workspace.js` | Social projects / task graph / portfolio workspace |
| ~8.0k | `pages/social-page.js` | Social router, stubs, orchestration |
| ~5.4k | `pages/student-service.js` | Student service orchestrator |
| ~4.9k | `pages/lms-whiteboard-runtime.js` | Whiteboard UI/canvas |
| ~3.3k | `shared/social-runtime-lite.js` | Social network/API helpers |
| ~3.0k | `pages/lms-quiz-workspace-runtime.js` | Quiz workspace UI |
| ~2.6k | `app/api.js` | Portal API / bootstrap |
| ~2.5k | `shared/lux-transparency.js` | Transparency engine (peeled) |
| ~1.8k | `app/app.js` | Bootstrap (English layer peeled) |
| ~1.3k | `shared/utilities.js` | Shared utils (transparency peeled) |

Re-measure after every peel:

```bash
# rough website JS total
find assets/js -name '*.js' ! -path '*/vendor/*' | xargs wc -l | tail -1
```

---

## 4. What is already done (do not redo)

### JS structure peels

| Module / peel | Location / notes |
|---------------|------------------|
| Social schedule PERT + **CPM** | `social-workspace-schedule-model.js` |
| Social project health model | `social-workspace-health-model.js` |
| Social graph + desk + board + edge/dock/obstacle/port geometry | `social-workspace-graph-model.js` |
| Social portfolio normalize/access/fields | `social-workspace-portfolio-model.js` |
| Social task matrix/time | `social-task-model.js` (before `social-page.js`) |
| Social form/survey/entity pure | `social-form-model.js` |
| Student-service pure helpers | `student-service-model.js` |
| Student-service chrome UI | `student-service-chrome.js` |
| Transparency engine | `shared/lux-transparency.js` (after `utilities.js` on all portal HTML) |
| English localization | `app/english-localization.js` (after `app.js`) |
| Whiteboard geometry pure | `lms-whiteboard-model.js` (lazy before whiteboard runtime) |
| Quiz pure helpers | `lms-quiz-model.js` (lazy before quiz workspace) |
| Line ceilings | `tools/check-architecture-guardrails.js` |
| Plan log | `docs/engineering-a-plus-frontend-js.md` |

### CSS / visual (prior Cursor session arc; may have local dirty tree)

- Live vs archive CSS inventory
- Slim live CSS; bare-page diet; human-editable formatting restored
- Dashboard depth/shadow visual regression fixed (asd31-style)
- Intentional strip of non-dashboard route paint for global redesign later
- **Archive kept** for possible restore

### Explicit mistakes already corrected once — do not repeat

- Do **not** minify live CSS for “line count”; owner wants human-editable code.
- Do **not** move **page runtime state** (`let bound`, `WORKSPACE_DIALOG_*`, timers, module promises) into pure `*-model.js` files.
- Function extractors must handle `function foo(x = {})` (default `{}` breaks naive brace matchers).
- Visual “diet” must not silently remove panel depth/shadows.

---

## 5. How peels must be done (copy this pattern)

### Pattern

1. Identify **pure** functions (no `document`/`innerHTML`/`fetch` when possible).
2. Create or extend `*-model.js` as classic IIFE:
   - `window.__KIU_*_LOADED` guard
   - `window.Kiu*Model = api`
   - export functions on `window.*` for stubs
3. Load model **before** the god file:
   - Social page: `social.html` script order
   - Social workspace: `ensureSocialWorkspaceModule()` chain in `social-page.js`
   - LMS: `LMS_*_MODULE_URLS` in `lms-classroom-tabs-runtime.js`
4. In god file: **delete** function body; **bind**:
   `const foo = window.foo || Model.foo;`
5. Add vitest: behavior + “not in god file” + load-order contract.
6. Lower ceiling in `check-architecture-guardrails.js` (never raise without owner OK).
7. Update `docs/engineering-a-plus-frontend-js.md` status.

### Verify every peel

```bash
node --check path/to/touched.js
npx vitest run test/<related>.test.js
node tools/check-architecture-guardrails.js
# or full: npm run check:architecture
```

### Success criteria per peel

- God file **line count down**
- Behavior tests green
- No new unexplained globals beyond the established `window.Kiu*` / re-export pattern
- No visual/CSS change unless the task is visual

---

## 6. Recommended next work (priority order)

Do **one peel or one visual wave per Cursor chat**.

### Priority 1 — Keep shrinking social workspace (~13.1k)

Still the largest risk for university maintainers.

Candidates (pure only):

- Remaining pure graph math not yet in graph-model (storage/checkpoint normalize if clean)
- Leave DOM/bind/render/findFree in workspace

### Priority 2 — Slim `social-page.js` toward router (~8.0k → &lt;5k long-term)

- Keep stubs + `ensure*Module` + event routing
- Move remaining panel-specific logic into existing `social-feed.js`, `social-groups.js`, etc.
- Do not dump more into `social-workspace.js`

### Priority 3 — Student service orchestrator (~5.4k)

- Continue peels: stores/bootstrap/modal shell only if seams are clear
- Prefer new `student-service-*-runtime.js` over growing main file

### Priority 4 — LMS whiteboard / quiz further splits

- Whiteboard: paint + pointer pipeline (after geometry model — already done)
- Quiz: keep pure model thin; peel only pure bits, not giant render functions first

### Priority 5 — Global visuals (when owner switches tracks)

- Promote dashboard lux shell/panels to remaining routes **without** reintroducing per-route snowflake CSS
- Follow `docs/shell-panels.md`; run `npm run check:panels`
- Touch `lux-tokens.css` / shared shell, not one-off route files
- Manual smoke: home dashboard + one bare page + LMS

### Priority 6 — University offer package (when structure “good enough”)

- Stable branch/tag demo snapshot
- Runbook (Node 20+, ports, start/stop, demo accounts)
- Architecture 1–2 pager + security/risks 1-pager (localStorage session, XSS surface, HTTPS plan)
- Demo script (15–20 min happy path)
- Clean junk from git tracking if needed (`anti-cheat/out`, huge local state) — confirm before delete

---

## 7. Paste-ready Cursor system prompt (detailed)

Copy everything in the block below into a **new Cursor agent chat**:

```text
You are continuing work on the KIU campus portal at the repo root.

## Owner goals (all of these matter)
1) UNIVERSITY HANDOFF: Code and docs must be understandable for university IT / maintainers.
   Prefer readability, clear modules, and honest pilot-vs-production scope.
2) ONE GLOBAL VISUAL SYSTEM: Dashboard lux shell/panels/controls are the design source of truth.
   Non-dashboard routes were intentionally CSS-stripped so we can apply dashboard paint globally later.
   Do not invent a new look; do not reintroduce heavy per-route CSS snowflakes.
3) ENGINEERING A+ JS STRUCTURE (active track unless I say otherwise):
   Freeze god-file growth; peel pure logic into *-model.js / chrome modules; tests; load-order discipline.
   Total assets/js line count may stay ~172k — success is smaller god files, not deleting the product.
4) Do not reintroduce purged CSS archive / retired route skins.
5) No React/Vue rewrite. No full ESM conversion of the whole tree. No permanent CSS minification.

## Read first
- docs/CURSOR-HANDOFF.md (this brief)
- docs/engineering-a-plus-frontend-js.md
- assets/js/README.md
- tools/check-architecture-guardrails.js (line ceilings — only lower after peels)

## Already done — do not re-peel
Social: schedule-model (PERT+CPM), health-model, graph-model (layout+desk+board+polylines+edge/dock geometry),
task-model, form-model, portfolio-model.
Student-service: model + chrome.
Shared: lux-transparency.js (from utilities).
App: english-localization.js (from app.js).
LMS: whiteboard-model.js, quiz-model.js.
Ceilings + vitest contracts for peels exist — extend them, don’t thrash.

## How to work
- One peel (or one visual wave) per response cycle.
- Measure largest files first, propose ONE highest-ROI peel, then implement only that.
- Copy patterns from social-workspace-schedule-model.js / lux-transparency.js.
- IIFE + window.Kiu*Model + window re-exports is the house style for peels.
- Never move page runtime state (bound flags, WORKSPACE_DIALOG sets, timers, module promises) into pure models.
- Brace-match extracts carefully when signatures use default `= {}`.
- After peel: node --check, vitest on related tests, architecture guardrails, update engineering-a-plus doc.

## Next priorities (pick top incomplete item unless I specify)
1. Further pure peels from social-workspace.js (~13.1k) — still #1 risk file
2. social-page.js toward router-only (&lt;5k long-term)
3. student-service further orchestrator peels
4. whiteboard paint/pointer split
5. When I say “visuals”: promote dashboard paint globally per shell-panels / visual-ssot
6. When I say “handoff package”: runbook + architecture/security one-pagers + demo script

## Verification commands
node --check <touched.js>
npx vitest run test/<related>.test.js
node tools/check-architecture-guardrails.js
npm run check:panels   # if CSS/panels touched

Start now: re-measure assets/js line counts + top 10 files, confirm ceilings, propose the single next peel, then implement it.
```

---

## 8. Shorter follow-up prompts (after the first chat)

**Continue structure only:**

```text
@docs/CURSOR-HANDOFF.md @docs/engineering-a-plus-frontend-js.md
Continue Engineering A+ JS peels. One peel only. Measure first, then implement.
```

**Visual / global design:**

```text
@docs/CURSOR-HANDOFF.md @docs/shell-panels.md @docs/visual-ssot.md
Switch to Plan B: promote dashboard lux shell/panels to [PAGE].
Keep same visuals as dashboard chrome; no new route snowflake CSS.
Run check:panels after.
```

**University package:**

```text
@docs/CURSOR-HANDOFF.md
Stop peels. Produce university IT offer package: runbook, architecture 1-pager,
security/risks 1-pager, demo script, scope in/out. No large refactors.
```

**Single file focus:**

```text
@assets/js/pages/social-workspace.js
Peel only pure helpers related to [TOPIC] into social-workspace-*-model.js
following schedule-model pattern. Tests + lower ceiling. No UI redesign.
```

---

## 9. Owner preferences (tone of work)

- **Surgical** changes; match existing style.
- **Human-readable** code for university staff.
- Prefer **boring, copyable patterns** already in the repo over new frameworks.
- When unsure between “perfect architecture” and “shippable pilot honesty,” choose **honesty + small safe peels**.
- Ask before: deleting archives, force-push, mass dependency changes, destructive cleanup of large untracked dirs.

---

## 10. Definition of “ready enough to show IT” (structure + package)

Not “perfect A+ everywhere.” Ready enough means:

- [ ] God files still large but **not growing** (ceilings hold)
- [ ] Clear story: folders + models + how to start the stack
- [ ] Demo path stable (login → dashboard → one LMS + one admin action)
- [ ] Written runbook + security risks one-pager
- [ ] Live CSS understandable; archive labeled retired
- [ ] Owner can explain: pilot scope vs production hardening roadmap

---

*Last updated for Cursor handoff after Engineering A+ waves 0–7 + desk/graph board peels. Re-measure numbers before relying on them.*
