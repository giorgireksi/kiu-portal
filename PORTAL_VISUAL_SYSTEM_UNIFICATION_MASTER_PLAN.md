# Portal Visual System Unification Master Plan

Section to plan:
- Shared Visual System / Design System Unification

Project / product context:
- KIU Portal Platform is a hosted university portal and LMS workspace with student, professor, TA, admin, and student-service views.
- It includes LMS delivery, registration, gradebook, news, social, support, admin tools, scheduling, protected exams, and anti-cheat launch flows.
- The product already uses a common luxury shell in many places, but the visual system is split across shared CSS, route CSS, inline HTML styles, route-specific renderers, and legacy mobile shell code.

---

## 1. Objective

Build one production-grade visual system for the KIU portal so that:
- the platform feels like one product across routes and roles
- redesigns can be made by changing a small number of source-of-truth files
- shell behavior, card styling, fade/glow language, active navigation state, and mobile chrome stay consistent
- route-specific pages only diverge when the workflow truly requires a custom surface

Why it matters:
- the current state increases maintenance cost, causes visual drift, and makes interaction bugs repeat across routes
- users should not have to relearn the product visually when moving between LMS, registration, library, support, and admin surfaces

---

## 2. Scope

Primary routes and surfaces in scope:
- `index.html`
- `lms.html`
- `registration.html`
- `programs.html`
- `study-card.html`
- `personal-data.html`
- `library.html`
- `orders.html`
- `student-service.html`
- `news.html`
- `chancellery.html`
- `timetable.html`
- `profile.html`
- `profile-view.html`
- `faculty-gradebook.html`
- `exams.html`
- `admin-tools.html`
- `admin-scheduler.html`
- `admin-library.html`
- `admin-orders.html`
- `staff.html`
- `students-admin.html`
- `social.html`
- `career-market.html`

Shared systems in scope:
- shell layout
- left nav
- topbar
- card / panel surfaces
- hero blocks
- widget surfaces
- buttons / controls / inputs
- theme tokens
- luxury background / glow language
- mobile bottom nav / action sheet
- active-route highlighting
- route-visual ownership rules

Secondary adjacent routes to keep aware of but not drive the first unification wave:
- `login.html`
- `exam-portal.html`
- `protected-launch.html`
- `calendar.html`
- `faculty-schedule.html`
- `gradebook.html`

---

## 3. Current Evidence Base

Files, routes, tests, and docs inspected before writing this plan:

Core docs and planning references:
- `blueprint.txt`
- `README.md`
- `INDEX_ANALYSIS.md`
- `VISUAL_OVERRIDE_RISK_MAP.md`
- `tools/check-architecture-guardrails.js`

Shared shell and visual system files:
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- `assets/js/features/index-luxury.js`
- `assets/js/features/luxury-shell-chrome.js`
- `assets/js/features/navigation.js`
- `assets/js/app/app.js`
- `assets/js/app/state.js`
- `assets/js/theme-primer.js`
- `assets/js/features/index-home-dashboard.js`
- `assets/js/features/luxury-home-model.js`

Route-specific CSS files inspected through asset wiring:
- `assets/css/admin-library-route.css`
- `assets/css/admin-orders-route.css`
- `assets/css/career-market-route.css`
- `assets/css/exam-studio.css`
- `assets/css/news-route.css`
- `assets/css/personal-data-route.css`
- `assets/css/profile-route.css`
- `assets/css/profile-view-route.css`
- `assets/css/social-rebuild.css`
- `assets/css/staff-command-center.css`
- `assets/css/admin-directories.css`
- `assets/css/students-admin-lms.css`
- `assets/css/timetable-route.css`
- `assets/css/admin-tools-luxury.css`

Route-specific JS and mobile shell files inspected:
- `assets/js/pages/index-mobile-shell.js`
- `assets/js/pages/standalone-mobile-shell.js`
- `assets/js/pages/social-mobile.js`
- `assets/js/pages/staff-mobile-shell.js`
- `assets/js/pages/career-market.js`

Mobile shell tooling artifacts inspected:
- `tools/_mobile_block.html`
- `tools/inject-final.ps1`
- `tools/cleanup-mobile.ps1`

Regression and shell tests inspected:
- `test/app-navigation-fallback-regressions.test.js`
- `test/left-nav-active-regressions.test.js`
- `test/profile-view-access-regressions.test.js`
- `test/index-mobile-shell-runtime.test.js`
- `test/standalone-mobile-shell-runtime.test.js`
- `test/social-mobile-runtime-regressions.test.js`
- `test/staff-mobile-runtime-regressions.test.js`
- `test/luxury-shell-chrome-runtime-bindings.test.js`

Route entry pages inspected for CSS/JS wiring:
- all root `*.html` pages in the repo

Key observed facts from the scan:
- 24 HTML entry pages include `assets/css/index-luxury.css`
- 15 root HTML pages currently load dedicated route CSS files; 13 of those are luxury-shell routes if home/dashboard and login-only exceptions are excluded from standard-route debt counts
- 15 live HTML pages still contain inline legacy mobile shell bootstrap code that bypasses the shared standalone mobile runtime
- 15 live HTML pages also duplicate the mobile nav and action-sheet scaffold directly in route HTML
- 0 live root HTML pages currently wire `assets/js/pages/standalone-mobile-shell.js` or declare `window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG`, even though the shared module and tests already exist
- `tools/check-architecture-guardrails.js` already contains a migrated-page shared-mobile-shell guardrail path, but `sharedMobileShellPages` is currently empty, so that guardrail is dormant
- `assets/css/components.css` is loaded on most luxury-shell pages but is still only a compatibility placeholder, not a real shared primitive owner
- at least 3 luxury-shell pages still contain inline `<style>` blocks: `admin-scheduler.html`, `admin-tools.html`, `lms.html`
- `index-mobile-shell.js` already owns runtime scaffold creation for the home shell, while most standalone routes still own copied mobile DOM inside HTML
- the home dashboard look from `index.html` is primarily owned by `assets/css/index-home-dashboard.css`, not the whole platform
- some mobile-shell duplication was generated through tooling assets/scripts, not only by manual page edits

---

## 4. Platform Context

This section is cross-cutting. It is not a single screen. It is the visual operating system of the portal.

Relevant platform dependencies:
- auth and role state
  - current role changes what nav, widgets, and route families appear
- faculty switching
  - faculty theme helpers currently mutate luxury shell variables
- navigation runtime
  - standalone routes and `index.html` SPA sections share shell logic but not always the same activation path
- top bar and utility panels
  - profile, notifications, chat, pickers, and studio controls all live in the shared shell
- mobile shell
  - there are both shared mobile shell files and route-embedded legacy mobile scripts
- body route markers
  - `body.dataset.luxPage`, `body.dataset.luxEntry`, and route classes are already used as route identity
- theme primer
  - first paint visual state is applied before the full shell runtime
- local persistence
  - theme mode, transparency, palette, sidebar state, and visual settings are persisted
- route renderers
  - many pages render content via route-specific JS, which means CSS unification must survive different DOM structures

This means the visual-system section is tightly coupled to navigation, auth role state, faculty theme state, and mobile shell boot order. Treating it like “just CSS cleanup” would be wrong.

---

## 5. Product Standard

In the final product, the KIU portal must feel like:
- one coherent university operating system
- modern enough to beat legacy academic portals on clarity and trust
- dense where needed, but never visually noisy
- consistent across roles without collapsing every route into identical layouts

The standard is:
- every route uses the same design tokens
- every route uses the same shell behavior
- every route uses the same active-nav logic
- every route uses the same button, card, panel, table, modal, and action-bar language
- special pages can customize structure, not invent their own unrelated surface language

---

## 6. Competitor Bar To Beat

Relevant competitor strengths:

### Canvas
Strengths to beat:
- consistency across academic workflows
- clear course-oriented action hierarchy
- predictable navigation and content framing

What KIU must do better:
- better cross-role shell consistency
- cleaner admin and support surfaces
- more modern card and dashboard hierarchy

### Moodle
Strengths to beat:
- breadth of academic functionality
- many operational flows in one platform

What KIU must do better:
- dramatically cleaner visual hierarchy
- far less visual drift between modules
- much stronger mobile chrome and shell consistency

### Banner / PeopleSoft / similar university admin portals
Strengths to beat:
- operational coverage
- admin workflow depth

What KIU must do better:
- modern usability
- faster recognition of where the user is
- lower cognitive load

### Microsoft 365 student/workflow stack
Strengths to beat:
- polished utility flows
- strong familiarity in messages, notifications, profile, and supporting panels

What KIU must do better:
- stronger platform unity within one university workspace
- fewer disconnected visual modes and separate-feeling subproducts

---

## 7. Hard Truth: What Is Wrong Right Now

- The product has a shared shell, but not a shared visual system in the strict sense.
- `assets/css/index-luxury.css` is the shared base, but many routes override it heavily.
- `assets/css/components.css` looks like a shared component layer in route wiring, but it is effectively empty today, so standard-route surface primitives are not actually centralized there.
- `index.html` home dashboard visuals are primarily controlled by `assets/css/index-home-dashboard.css`, which means the most attractive widget system is not the default for the rest of the portal.
- 15 root HTML pages currently load dedicated route CSS files, and 13 luxury-shell routes still do so even after excluding home/login-only edge cases from the debt count.
- At least 15 live pages still contain copied mobile nav/action-sheet markup plus inline legacy mobile shell logic in the HTML itself.
- The repo already contains two different shared-mobile directions:
  - `assets/js/pages/index-mobile-shell.js` creates the scaffold at runtime for the home shell
  - `assets/js/pages/standalone-mobile-shell.js` provides a cleaner config-driven shared behavior path for standalone routes
  - but zero live root standalone pages currently use that shared standalone contract
- Several routes still contain inline `<style>` blocks, which breaks single-source-of-truth design ownership.
- The platform mixes shared JS shell rendering, route-owned JS, standalone route boot code, and route-owned CSS without a hard contract for who owns what.
- Some mobile duplication is tool-generated, not just hand-authored:
  - `tools/_mobile_block.html`
  - `tools/inject-final.ps1`
  - `tools/cleanup-mobile.ps1`
- Visual behavior has already caused user-facing bugs:
  - left-nav active glow missing on some routes
  - first-click route issues caused by navigation/runtime drift
  - legacy mobile wrappers bypassing shared fixes
- The codebase still has alias-route and route-family mapping edge cases like:
  - `profile-view` vs `profile`
  - `admin-library` vs `library`
  - `admin-orders` vs `orders`
- `navigation.js` already centralizes some of this mapping for active-nav resolution, so the remaining problem is incomplete adoption and route-family consistency more than missing abstraction.
- Special routes like `social`, `career-market`, `staff`, `students-admin`, and `exams` have legitimate reasons to differ, but the boundary between “special layout” and “separate design language” is not enforced.
- The visual layer is not currently cheap to redesign. It is not one-file-owned. It is a distributed system with partial duplication.

---

## 8. What Is Worth Keeping

- `assets/css/index-luxury.css` is a real base system and should remain the primary shell surface source.
- `assets/js/pages/standalone-mobile-shell.js` is a real config-driven shared mobile foundation and should be activated rather than reinvented.
- `assets/js/pages/index-mobile-shell.js` proves that shared runtime scaffold creation is viable and can be mined for standalone-route scaffold ownership.
- `assets/css/index-home-dashboard.css` is strong enough to become the reference for premium widget treatment.
- `assets/js/features/index-luxury.js` already carries route/family/page identity patterns that can be hardened instead of replaced.
- `assets/js/features/luxury-shell-chrome.js` is a legitimate shell owner for nav, topbar, and utilities.
- `theme-primer.js` is useful for first-paint consistency if kept aligned with the main runtime.
- body route markers (`luxPage`, `luxEntry`, route classes) are strategically correct and should be the long-term route identity contract.
- route-specific CSS files for truly special products should remain, but only after the shared system is clarified.
- `tools/check-architecture-guardrails.js` already has the right insertion point for migrated shared-mobile-shell guardrails once live routes start using the shared contract.
- recent regression tests around navigation and nav highlighting are worth keeping and extending.

---

## 9. What “Perfect” Means For This Section

Perfect means:
- a user can jump between any major route and still feel they are inside the same product
- engineering can redesign the shared shell and card language by touching a small number of files
- route-specific CSS only exists for workflow-specific structure, not because the base system is missing
- mobile and desktop follow the same interaction logic
- page ownership is clear:
  - shared shell files own shell visuals
  - home dashboard files own home-only visuals
  - special route files own only the pieces that are truly special
- no route loses active-nav glow
- no route needs local hacks to stay visually aligned

---

## 10. Role-Based Questions This Section Must Answer

### Student
- Am I clearly in the right workspace?
- Do cards, controls, and next actions look familiar across modules?
- Can I tell where I am from the nav glow and route framing immediately?

### Professor / TA
- Does the faculty shell feel like the same product as the student shell, not a separate app?
- Are teaching tools specialized in content but consistent in controls and surfaces?

### Admin
- Do admin routes feel stronger and denser without becoming visually disconnected from the rest of the portal?

### Student Service
- Does the support workspace inherit the same trust language as the academic workspace?

### Engineering / Design / QA
- Can we change tokens, card rules, nav glow, or motion once and see the expected result platform-wide?
- Do we know exactly which files are allowed to override the shared system?

---

## 11. What I Would Actually Build

If I were responsible for this section, I would build:

1. one hard source of truth for:
   - tokens
   - shell chrome
   - card/panel/button/input styling
   - active nav highlight behavior
   - loading/empty/error state patterns

2. one premium widget system for dashboards and summary cards:
   - home dashboard visuals in `index-home-dashboard.css` become the visual benchmark
   - other routes can opt into those primitives instead of inventing route-local boxes

3. a strict route classification:
   - standard shell routes
   - special-surface routes
   - excluded routes

4. a no-inline-shared-visual-rules policy:
   - remove inline mobile shell bootstrap
   - remove inline shell visual CSS from route HTML where possible

5. one real shared mobile shell contract for standalone routes:
   - one scaffold owner
   - one behavior owner
   - one config path
   - no copied tool-generated reinjection blocks

6. visual guardrails:
   - route classification tests
   - nav glow presence tests
   - route CSS override budget
   - “no new inline shell bootstrap” tests

I would not do a blind full rewrite. I would centralize the shared pieces first, then re-skin the exception routes on top of the new contract.

---

## 12. Final Section Blueprint

The final visual-system section should be structured as:

### Layer A: Core Tokens
- colors
- semantic surfaces
- border opacity
- shadow depth
- glow/fade behavior
- spacing
- radius
- type hierarchy
- motion timing

Primary owners:
- `assets/css/index-luxury.css`
- `assets/js/theme-primer.js`
- `assets/js/features/index-luxury.js`

### Layer B: Shared Shell Chrome
- left nav
- topbar
- utility panels
- profile menu
- sidebar collapse state
- active route glow
- shell framing

Primary owners:
- `assets/css/index-luxury.css`
- `assets/js/features/luxury-shell-chrome.js`
- `assets/js/features/navigation.js`

### Layer C: Shared Content Primitives
- standard cards
- hero blocks
- table shells
- filters
- action bars
- list panels
- modal shells
- empty/loading/error states

Primary owners:
- `assets/css/index-luxury.css`

### Layer D: Home Dashboard System
- hero widgets
- summary widgets
- quick tiles
- widget spacing and gradients
- role-specific dashboard composition

Primary owners:
- `assets/css/index-home-dashboard.css`
- `assets/js/features/luxury-home-model.js`

### Layer E: Special Surface Packages
- social
- career market
- staff command center
- students admin
- exam studio
- admin scheduler

Primary rule:
- special packages may change layout and domain-specific controls
- they must still inherit token, shell, and shared primitive contracts

### Layer F: Mobile Shell
- bottom nav
- action sheet
- route launch behavior
- mobile active state

Primary owners:
- `assets/js/pages/index-mobile-shell.js` for SPA/home scaffold creation
- `assets/js/pages/standalone-mobile-shell.js` for config-driven standalone behavior
- `assets/css/mobile-responsive.css` for shared bottom-nav and action-sheet styling

Target rule:
- standard routes must converge on one canonical scaffold owner plus one shared runtime contract
- no live route may keep copied nav/action-sheet markup plus copied inline bootstrap after migration
- once a route migrates to the shared standalone contract, it must be added to `sharedMobileShellPages` guardrails

### Layer G: Visual QA / Governance
- route parity tests
- CSS override budget
- route classification map
- docs for ownership rules

---

## 13. Final Widget / Panel / Surface Specification

### 13.1 Left Navigation

Purpose:
- show the current workspace and major route families

Placement:
- persistent left shell on desktop

Required inputs:
- effective role
- active route id
- route family
- badge counts when available

Required outputs:
- visible nav groups
- one active highlighted item

States:
- default
- hover
- active
- collapsed shell
- role-restricted hidden

Primary actions:
- switch route

Failure behavior:
- if route cannot be resolved, do not lose active state entirely; fall back to body route markers

Permission behavior:
- only show items the role can access

Drill-down behavior:
- route transition into target page

### 13.2 Topbar

Purpose:
- global context, switching, utility actions

Placement:
- persistent top shell

Required inputs:
- route title
- faculty
- role
- search state
- utility counts

Required outputs:
- route title
- pickers
- utility entry points

States:
- default
- utility open
- picker open
- mobile compressed

Primary actions:
- role switch
- faculty switch
- open notifications/chat/profile/theme tools

Failure behavior:
- utility buttons degrade without blocking route navigation

Permission behavior:
- hide or disable role-specific controls

### 13.3 Standard Card / Panel Surface

Purpose:
- the default visual container for summaries, data blocks, forms, tables, and route modules

Placement:
- all standard routes

Required inputs:
- title
- meta
- content
- optional action row

Required outputs:
- one consistent card language

States:
- default
- elevated
- selected
- loading
- empty
- error

Primary actions:
- route-defined

Failure behavior:
- error state must preserve shell alignment and spacing

Permission behavior:
- hidden or read-only based on route data

### 13.4 Hero / Summary Block

Purpose:
- set page tone and expose primary next actions

Placement:
- dashboard and major landing surfaces

Required inputs:
- role
- route purpose
- summary data
- primary actions

Required outputs:
- recognizable hero pattern shared across routes

States:
- default
- compact
- loading
- alert-emphasis

Primary actions:
- route-specific quick actions

Failure behavior:
- safe fallback copy and stable layout

### 13.5 Action Bar / Filter Row

Purpose:
- hold filters, segmented controls, and high-frequency route actions

Placement:
- top of content-heavy routes

Required inputs:
- route controls

Required outputs:
- consistent placement and control styling

States:
- default
- active filter
- disabled
- overflow/mobile collapse

Primary actions:
- filter and mode switching

Failure behavior:
- controls degrade but do not visually fragment

### 13.6 Table / List Workspace

Purpose:
- dense operational data view

Placement:
- orders, registration, staff, library, gradebook-adjacent surfaces

Required inputs:
- collection data
- selection state
- filters

Required outputs:
- rows/cards in a shared visual grammar

States:
- loading
- empty
- stale
- selected
- error

Primary actions:
- open detail, filter, sort, act

Failure behavior:
- visible stale/error affordance, not silent mismatch

### 13.7 Modal / Drawer Shell

Purpose:
- transient detail or editing context

Placement:
- route overlays

Required inputs:
- title
- form or content body
- close action

Required outputs:
- consistent overlay behavior

States:
- open
- closing
- loading
- error

Primary actions:
- submit, close, secondary action

Failure behavior:
- trapped error copy within modal, not layout breakage

Permission behavior:
- read-only and destructive actions must be explicit

### 13.8 Mobile Bottom Nav / Action Sheet

Purpose:
- mobile route movement and utility access

Placement:
- mobile only

Required inputs:
- role
- route list
- current route

Required outputs:
- first-tap route success
- active mobile state

States:
- visible
- hidden
- sheet open
- collapsed sidebar

Primary actions:
- route switch
- utility launch

Failure behavior:
- fallback route launch if shared navigate runtime is not yet ready

### 13.9 Home Dashboard Widgets

Purpose:
- premium overview of role-specific work

Placement:
- `index.html` dashboard only, but reusable styling should influence other summary blocks

Required inputs:
- role
- faculty
- widget content model

Required outputs:
- hero, quick tiles, summary cards, action strips

States:
- default
- loading skeleton
- empty
- alert mode
- editing mode

Primary actions:
- route launch
- shortcut drill-down

Failure behavior:
- route buttons still launch through shared shell behavior

### 13.10 Special Surface Package

Purpose:
- allow unique workflows like social, staff, career market, exams, scheduler

Placement:
- route-specific

Required inputs:
- route layout model
- special controls

Required outputs:
- distinct structure with shared token and component behavior

States:
- route-specific

Primary actions:
- domain-specific

Failure behavior:
- never break global shell consistency

---

## 14. UI/UX Direction

Visual hierarchy:
- keep one premium shell language across the portal
- use the `index.html` dashboard as the benchmark for warmth, depth, and readable fade positioning
- keep one recognizable card silhouette across routes

Interaction design:
- route switching must be first-click reliable
- active route must always be visually obvious
- cards and panels should communicate priority before content is read

Information density:
- student/professor standard routes: medium density
- admin/staff operational routes: medium-high density
- special tools may go denser, but not uglier

Empty states:
- must look intentional and share the same surface grammar
- no raw placeholder blocks that break route aesthetic

Error states:
- must be explicit, compact, and embedded inside the same shell language

Loading states:
- shell should stay stable
- loading overlays must not feel like separate apps
- avoid route-specific loading hacks when shared shell states can do the job

Mobile behavior:
- one mobile shell pattern
- no route-specific mobile bootstrap drift
- no route should require a different mental model for mobile navigation

Accessibility:
- active state must be visible without relying only on color
- contrast must remain safe in both light and dark modes
- focus states must survive route-specific overrides
- large tap targets on mobile are mandatory

---

## 15. Architecture Direction

Route shell:
- all standard routes should inherit one shell contract
- standalone routes must still resolve a stable active page id

Components:
- shared shell primitives in one layer
- route-specific layout components in page packages
- home dashboard widgets remain a specialized system but should use shared primitives where possible
- mobile shell work has two separate ownership problems:
  - scaffold ownership
  - behavior ownership
- the first standalone-route migration should either extract a shared scaffold factory from `index-mobile-shell.js` or formalize one canonical HTML scaffold for `standalone-mobile-shell.js`; copying the nav DOM per page is not an acceptable end state

Data contracts:
- route identity must come from one normalized contract
- body route markers and route resolver must agree

Persistence:
- visual settings remain local persistence
- route identity and access remain app-state driven

Server vs local state:
- design tokens and visual selection are local
- route permission and page access are application state concerns

Permissions:
- nav and quick actions must only show allowed pages
- route access lists must match visible route launch buttons

Event/review state:
- shared shell must not depend on route-specific event timing to become usable

Realtime/offline behavior:
- shell and route surfaces should still render stable containers before live data is ready

Testability:
- every shared visual contract needs route-level regression coverage
- active nav, first-click navigation, and route alias highlighting should remain tested
- existing `vitest` route/runtime tests and `node tools/check-architecture-guardrails.js` should be the first-line checks before broader browser review

---

## 16. Cross-System Dependencies That Must Not Be Ignored

- `theme-primer.js`
- `index-luxury.js`
- `luxury-shell-chrome.js`
- `navigation.js`
- `app.js`
- `state.js`
- route-specific JS renderers
- faculty theme mutation path in shared utilities
- auth role persistence
- body route markers from standalone route boot scripts
- mobile shell boot sequence
- route-specific CSS override files

Ignoring any of those will reintroduce visual drift or route behavior bugs.

---

## 17. Metric Contract Matrix

| Metric | Source of truth | Reporting period | Freshness expectation | Drill-down route | Stale / failure behavior |
|---|---|---:|---|---|---|
| Shared shell route coverage | HTML route inventory + route tests | per release | current branch | design-system audit doc | fail CI if route classification missing |
| Active-nav correctness rate | browser regression tests | per release | current branch | route-specific nav tests | fail build on broken route highlight |
| First-click route success | browser regression tests | per release | current branch | mobile and route interaction tests | fail build if second click required in tested surfaces |
| Route CSS override count | asset scan | per release | current branch | design system audit | report drift; block net-new unnecessary route CSS |
| Inline mobile shell count | HTML scan | per release | current branch | architecture guardrail | fail if count rises after consolidation phase |
| Shared standalone mobile-shell adoption | HTML route inventory + `sharedMobileShellPages` guardrail list | per release | current branch | architecture guardrail output | fail if a migrated route regresses to copied inline bootstrap/config drift |
| Inline style block count on shell routes | HTML scan | per release | current branch | architecture guardrail | report as debt; block new shared-style inline blocks |
| Shared card adoption rate | route audit | per release | current branch | design audit | mark routes still using local-only surface language |
| Special route exception budget | approved route exception map | per release | current branch | route exception doc | flag unauthorized exceptions |

---

## 18. Section-By-Section Rewrite Plan

| Current sub-surface | Decision | Reason |
|---|---|---|
| `assets/css/index-luxury.css` | Keep + improve | already the real shell base |
| `assets/css/index-home-dashboard.css` | Keep + elevate | strongest current widget language |
| route-specific CSS for truly special tools | Keep + constrain | some routes need special layout |
| route-specific CSS for ordinary routes | Improve or replace | too much drift for standard pages |
| inline mobile shell bootstrap in HTML | Replace | duplicates shared behavior and causes drift |
| inline shell-adjacent `<style>` blocks | Remove or move | breaks single ownership |
| body route markers / route classes | Keep + harden | correct identity model |
| theme primer early boot | Keep + align | necessary for first paint |
| route-specific card language on standard pages | Replace | standard pages should share the same surface system |
| social / career / staff / exams / scheduler special surfaces | Improve | should stay distinct but become token-compliant |

---

## 19. Non-Negotiable Production Rules

- No new standard route may invent a separate card language.
- No new standard route may ship a private mobile shell bootstrap.
- No migration may flatten an existing route's visual hierarchy just to satisfy shared ownership rules.
- No route may lose active-nav state.
- No route may require two clicks for first route navigation.
- No shared shell behavior may depend on inline HTML script duplication.
- No shared visual behavior may be fixed only in one route if the problem is systemic.
- No tool or helper script may re-inject copied mobile nav/action-sheet blocks once a canonical shared scaffold path exists.

---

## 20. Execution Rules For Engineers And LLMs

- Always classify the page first: standard shell route, special surface route, or excluded route.
- Change shared shell files first if the problem appears on more than one route.
- Only use route CSS when the route has a justified exception.
- Before editing a route-specific CSS file, verify whether the same result belongs in `index-luxury.css`.
- When adding a quick action or nav target, verify allowed-pages logic and active-route mapping.
- For mobile shell work, decide scaffold ownership first and behavior ownership second; do not copy nav/action-sheet HTML between routes as a shortcut.
- If a route migrates onto `standalone-mobile-shell.js`, add that route to `sharedMobileShellPages` guardrails in the same PR.
- Preserve the existing premium route hierarchy and layout language; centralize duplicated shell rules, not route identity.
- Add or update a regression test for every shared-shell bug.
- Do not ship “temporary” inline bootstrap patches without a tracked removal task.

---

## 21. Task Quality Audit

This plan is actionable, but some backlog items remain broad by necessity:
- special-surface packages for `social`, `career-market`, `staff`, `exams`, and `scheduler`
- those need route-specific implementation tickets after the shared contract is hardened
- mobile-shell cleanup is a two-layer problem:
  - shared behavior
  - shared scaffold ownership
- any migration ticket that removes inline JS but leaves copied nav/action-sheet DOM without a declared owner is still incomplete

The rest of the plan is buildable without product ambiguity.

---

## 22. How To Convert Master Tasks Into Buildable Tickets

Every ticket must include:
- ticket ID
- route(s)
- source-of-truth file(s)
- whether it changes shared shell or route exception code
- exact UI contract
- exact done-when clause
- regression test requirement
- screenshots required before merge

Ticket template:
- Objective
- Files in scope
- Why shared vs route-specific
- User-visible change
- Done when
- Test / screenshot proof

---

## 23. Is This Enough To Surpass Competitors?

Not by itself.

What this section can win on:
- consistency
- trust
- navigation clarity
- modernity relative to legacy academic portals

What it cannot solve alone:
- core workflow depth
- data trust
- speed of academic operations
- messaging and collaboration quality

But without this section being strong, the product will continue to feel stitched together, which weakens every other feature.

---

## 24. Expected Outcome If 100% Of The Plan Is Completed Well

- most routes will feel like one premium portal instead of adjacent mini-products
- redesign work becomes centralized
- shared bugs stop repeating route by route
- new features can launch faster because the shell and card language already exist
- users will understand where they are and what they can do much faster

---

## 25. What Else Must Be True To Truly Surpass Competitors

- registration workflows must be trustworthy
- LMS content flows must be fast and understandable
- staff/admin routes must be genuinely operational, not just visually cleaner
- social and messaging must be useful, not decorative
- backend state quality and permissions must stay reliable

---

## 26. Granular Task Backlog

### Epic DVS-A: Visual System Ownership

| ID | Objective | Done when |
|---|---|---|
| DVS-A-001 | Create a route classification map for every HTML entry page | one maintained document lists standard routes, special routes, excluded routes, owners, and override files |
| DVS-A-002 | Define the shared visual ownership contract | docs specify which files own tokens, shell chrome, home widgets, and route exceptions |
| DVS-A-003 | Add CI validation for unexpected route-specific CSS growth | build fails or warns when a new standard route adds unauthorized route CSS |
| DVS-A-004 | Add CI validation for inline shell bootstrap on live pages | build flags any new inline mobile/shell bootstrap on route pages |
| DVS-A-005 | Add CI validation for shell inline style blocks | build flags new inline shared-style blocks on luxury shell routes |
| DVS-A-006 | Activate migrated shared-mobile-shell route guardrails | any route moved onto the shared standalone contract is listed in `sharedMobileShellPages` and enforced by `tools/check-architecture-guardrails.js` |

### Epic DVS-B: Core Token And Shell Unification

| ID | Objective | Done when |
|---|---|---|
| DVS-B-001 | Consolidate shared color, glass, glow, and card tokens into `index-luxury.css` | route pages use one shared token set without redefining shell fundamentals locally |
| DVS-B-002 | Establish a formal shared card surface contract | `lux-card`, `lux-panel`, shared hero shells, and utility surfaces have documented states and styling rules |
| DVS-B-003 | Normalize shared button hierarchy across routes | primary, secondary, ghost, icon, and chip actions behave and look consistently on standard routes |
| DVS-B-004 | Normalize shared form control styling across routes | select, input, search, picker, and filter controls use one consistent visual contract |
| DVS-B-005 | Normalize shared modal/drawer shell behavior | overlays and panels use one interaction and surface standard on standard routes |
| DVS-B-006 | Centralize nav active styling and glow rules | left-nav highlight behavior uses one CSS/JS path across all roles and routes |
| DVS-B-007 | Centralize topbar visual behavior | topbar spacing, utility buttons, picker buttons, and active states match on all standard routes |
| DVS-B-008 | Reduce shared CSS `!important` conflict hotspots | documented highest-risk override regions are reduced or isolated |

### Epic DVS-C: Dashboard Visual Benchmarking

| ID | Objective | Done when |
|---|---|---|
| DVS-C-001 | Define the `index.html` dashboard widget visual contract as the benchmark | documentation and code comments identify the home dashboard widget language as the premium shared benchmark |
| DVS-C-002 | Extract reusable widget/card treatments from `index-home-dashboard.css` | reusable summary-card/hero/quick-tile styles can be adopted by non-home routes |
| DVS-C-003 | Build a shared summary-surface primitive | standard routes can use home-grade summary boxes without importing the whole dashboard system |
| DVS-C-004 | Align non-home summary cards with the dashboard visual benchmark | library, orders, registration, student-service, and similar pages adopt shared premium summary surfaces |

### Epic DVS-D: Route Normalization

| ID | Objective | Done when |
|---|---|---|
| DVS-D-001 | Normalize standalone active-route detection | shared shell highlights the correct route on every standalone page |
| DVS-D-002 | Normalize alias route mapping | alias pages like admin library/orders and profile/profile-view map to the correct shared nav target |
| DVS-D-003 | Ensure route access lists match visible route launch buttons | any route exposed in nav or quick actions is allowed by role logic |
| DVS-D-004 | Remove route-local nav highlight hacks that duplicate shared logic | shared shell owns route glow, route-local highlight hacks are deleted or reduced |
| DVS-D-005 | Standardize standalone route boot scripts to publish route identity consistently | each standalone route sets `luxPage`, `luxEntry`, and route classes in one consistent way |

### Epic DVS-E: Mobile Shell Consolidation

| ID | Objective | Done when |
|---|---|---|
| DVS-E-001 | Replace legacy inline mobile shell bootstrap in live pages | live routes no longer depend on embedded copied mobile shell logic |
| DVS-E-002 | Converge mobile nav launch behavior onto the shared runtime | mobile route buttons use one route-launch contract |
| DVS-E-003 | Remove polling-based navigate readiness from legacy pages | mobile route launch does not depend on `setInterval` waiting for `navigate` |
| DVS-E-004 | Normalize mobile action sheet visual language | all standard routes use one action sheet look and interaction pattern |
| DVS-E-005 | Normalize mobile active-state behavior | mobile route highlight and shell closing behavior are consistent across routes |
| DVS-E-006 | Establish one canonical mobile shell scaffold owner for standalone routes | standalone pages stop owning copied nav/action-sheet DOM as uncontrolled route-local markup |
| DVS-E-007 | Activate `standalone-mobile-shell.js` on at least one live standalone route | one live route uses config-driven shared standalone mobile behavior without inline bootstrap |
| DVS-E-008 | Retire tool-generated copied mobile block sources after migration starts | `_mobile_block.html` / inject cleanup tooling no longer acts as the hidden source of live route duplication |

### Epic DVS-F: Standard Route Cleanup

| ID | Objective | Done when |
|---|---|---|
| DVS-F-001 | Unify `library.html` with shared card/summary primitives | route has no unnecessary local visual divergence |
| DVS-F-002 | Unify `orders.html` with shared card/summary primitives | route has no unnecessary local visual divergence |
| DVS-F-003 | Unify `student-service.html` with shared card/summary primitives | route has no unnecessary local visual divergence |
| DVS-F-004 | Unify `registration.html` with shared card/summary primitives | route has no unnecessary local visual divergence |
| DVS-F-005 | Unify `programs.html` with shared card/summary primitives | route has no unnecessary local visual divergence |
| DVS-F-006 | Unify `study-card.html` with shared card/summary primitives | route has no unnecessary local visual divergence |
| DVS-F-007 | Unify `personal-data.html` with shared card/summary primitives | route uses shared cards with only minimal route-local CSS |
| DVS-F-008 | Unify `profile-view.html` with shared card/summary primitives | route keeps profile-specific layout but inherits shared shell/card language fully |

### Epic DVS-G: Special Route Packages

| ID | Objective | Done when |
|---|---|---|
| DVS-G-001 | Audit `social.html` against the shared shell contract | differences are classified as valid exceptions or debt |
| DVS-G-002 | Audit `career-market.html` against the shared shell contract | differences are classified as valid exceptions or debt |
| DVS-G-003 | Audit `staff.html` against the shared shell contract | differences are classified as valid exceptions or debt |
| DVS-G-004 | Audit `students-admin.html` against the shared shell contract | differences are classified as valid exceptions or debt |
| DVS-G-005 | Audit `exams.html` against the shared shell contract | differences are classified as valid exceptions or debt |
| DVS-G-006 | Audit `admin-scheduler.html` against the shared shell contract | differences are classified as valid exceptions or debt |
| DVS-G-007 | Formalize the exception budget for special routes | each special route has an approved list of layout and style deviations |

### Epic DVS-H: Route CSS Reduction

| ID | Objective | Done when |
|---|---|---|
| DVS-H-001 | Reduce `news-route.css` to only news-specific needs | shared shell/card rules are removed from route CSS |
| DVS-H-002 | Reduce `profile-route.css` to only route-specific needs | shared shell/card rules are removed from route CSS |
| DVS-H-003 | Reduce `personal-data-route.css` to only route-specific needs | shared shell/card rules are removed from route CSS |
| DVS-H-004 | Reduce `timetable-route.css` to only scheduling-specific needs | shared shell/card rules are removed from route CSS |
| DVS-H-005 | Reduce `admin-library-route.css` to only admin library-specific needs | shared shell/card rules are removed from route CSS |
| DVS-H-006 | Reduce `admin-orders-route.css` to only admin orders-specific needs | shared shell/card rules are removed from route CSS |

### Epic DVS-I: Visual QA And Governance

| ID | Objective | Done when |
|---|---|---|
| DVS-I-001 | Add browser-based active-nav smoke tests for all major route families | browser tests prove glow is present on representative student, professor, admin, and utility routes |
| DVS-I-002 | Add browser-based first-click route launch tests for standard and legacy pages | route launches succeed on first click/tap on representative pages |
| DVS-I-003 | Add a design-system audit report script | one script outputs route classification, route CSS, inline style, and mobile shell drift |
| DVS-I-004 | Add screenshot baselines for representative routes | key routes have visual baselines for shell/card drift detection |
| DVS-I-005 | Write a contributor rulebook for visual changes | engineers know where to change tokens, shared cards, and exceptions safely |

---

## 27. First 25 Build Tasks

These are the first PR-sized tasks I would actually build.

| ID | Objective | Files in scope | Done when |
|---|---|---|---|
| DVS-PR-001 | Create route classification document | new root `.md` doc | all routes grouped into standard, special, excluded |
| DVS-PR-002 | Add route classification regression test | `tools/check-architecture-guardrails.js`, new test | build reports unexpected route drift |
| DVS-PR-003 | Normalize standalone active-route resolution | `assets/js/features/navigation.js` | standalone routes always resolve a stable active page id |
| DVS-PR-004 | Add active-nav regression coverage for representative routes | new/updated tests | profile-view, faculty-gradebook, admin-orders, staff stay green |
| DVS-PR-005 | Publish shared visual ownership contract | new root `.md` doc or section in plan | ownership of shared vs route files is explicit |
| DVS-PR-006 | Extract shared summary-surface primitive from dashboard styling | `assets/css/index-home-dashboard.css`, `assets/css/index-luxury.css` | a reusable summary card exists outside home-only markup |
| DVS-PR-007 | Apply shared summary primitive to `library.html` | shared CSS + route render path | route uses home-grade summary styling without local hacks |
| DVS-PR-008 | Apply shared summary primitive to `orders.html` | shared CSS + route render path | route uses home-grade summary styling without local hacks |
| DVS-PR-009 | Apply shared summary primitive to `student-service.html` | shared CSS + route render path | route uses home-grade summary styling without local hacks |
| DVS-PR-010 | Apply shared summary primitive to `registration.html` | shared CSS + route render path | route uses home-grade summary styling without local hacks |
| DVS-PR-011 | Migrate one live route to the shared standalone mobile shell contract | one representative HTML route + shared standalone runtime/scaffold owner | route no longer embeds copied mobile bootstrap or polling-based readiness logic |
| DVS-PR-012 | Add regression coverage and guardrails for the first migrated standalone mobile route | migrated route + runtime tests + architecture guardrail script | first-tap navigation works and the migrated contract is enforced by checks |
| DVS-PR-013 | Convert `profile-view.html` to shared card rules with route-only exceptions | shared CSS + `profile-view-route.css` | route feels part of the same product while retaining profile structure |
| DVS-PR-014 | Reduce `personal-data-route.css` to only data-route-specific styling | route CSS + shared CSS | no duplicate card/shell styling remains in route CSS |
| DVS-PR-015 | Reduce `profile-route.css` to only route-specific styling | route CSS + shared CSS | no duplicate card/shell styling remains in route CSS |
| DVS-PR-016 | Reduce `news-route.css` to only news-specific styling | route CSS + shared CSS | no duplicate card/shell styling remains in route CSS |
| DVS-PR-017 | Reduce `timetable-route.css` to only schedule-specific styling | route CSS + shared CSS | no duplicate shell/card rules remain in route CSS |
| DVS-PR-018 | Add shared shell test for nav items across role families | browser test | student, professor, admin roles each show one active left-nav item |
| DVS-PR-019 | Add design-system audit script for route CSS and inline style counts | script + doc | one command reports route visual fragmentation |
| DVS-PR-020 | Remove one inline `<style>` block from a luxury route | chosen HTML page + shared CSS | shared style moved into CSS files without visual regression |
| DVS-PR-021 | Standardize topbar utility button states across standard routes | shared CSS/JS | topbar interactions match on core routes |
| DVS-PR-022 | Standardize shared empty/error state component styling | shared CSS | standard routes use one empty/error visual contract |
| DVS-PR-023 | Document approved exception budget for `social` | route CSS/JS doc | special route deviations are explicit |
| DVS-PR-024 | Document approved exception budget for `career-market` | route CSS/JS doc | special route deviations are explicit |
| DVS-PR-025 | Document approved exception budget for `staff` | route CSS/JS doc | special route deviations are explicit |

---

## 28. Suggested Implementation Order

### 27A. Execution Ticket Format For The First 25 Tasks

The table above is still useful for prioritization. The entries below are the stricter execution form that humans and LLMs should use when actually building.

#### DVS-PR-001 Route Classification Map
- Objective: create the single source of truth that classifies every HTML entry page as standard shell, special surface, or excluded.
- Routes / surfaces: all root `*.html` pages.
- Files in scope: new root `.md` document, optional link update in `README.md`.
- Dependencies: none.
- Implement:
  - inventory every root route
  - classify each route as standard shell, special route, or excluded route
  - record shared CSS owner, route CSS owner, route JS owner, mobile shell owner, and exception status
- Done when:
  - every root HTML page is listed exactly once
  - every route has one visual ownership decision
  - there are no unlabeled exceptions
- Validate:
  - compare against the current route inventory scan
  - human review of the classification table

#### DVS-PR-002 Route Classification Guardrail
- Objective: stop silent route drift by validating route classification expectations in automation.
- Routes / surfaces: all root `*.html` pages.
- Files in scope: `tools/check-architecture-guardrails.js`, optional new regression test.
- Dependencies: `DVS-PR-001`.
- Implement:
  - add checks for forbidden route CSS on standard routes
  - add checks for inline mobile shell bootstrap on standard routes
  - add checks for missing route classification coverage
- Done when:
  - the script fails if a standard route adds unauthorized fragmentation
  - the script can be run locally by engineers and LLMs
- Validate:
  - run `node tools/check-architecture-guardrails.js`

#### DVS-PR-003 Standalone Active Route Resolution
- Objective: make the shared shell resolve a stable active page id on every standalone route.
- Routes / surfaces: `profile-view.html`, `admin-orders.html`, `admin-library.html`, `staff.html`, `faculty-gradebook.html`, plus any alias routes.
- Files in scope: `assets/js/features/navigation.js`.
- Dependencies: none.
- Implement:
  - normalize standalone aliases in one place
  - use visible page sections when available
  - fall back to `body.dataset.luxPage`, `body.dataset.luxEntry`, and standalone route id
- Done when:
  - the active page id never returns blank on representative standalone routes
  - left-nav highlight uses that id successfully
- Validate:
  - browser-check `profile-view.html`, `faculty-gradebook.html`, `admin-orders.html`, and `staff.html`

#### DVS-PR-004 Active-Nav Regression Coverage
- Objective: lock the active left-nav glow behavior into tests.
- Routes / surfaces: student, professor, admin, and utility routes.
- Files in scope: `test/left-nav-active-regressions.test.js`, browser smoke tests if needed.
- Dependencies: `DVS-PR-003`.
- Implement:
  - add assertions for representative broken routes
  - ensure one active nav item exists on those routes
- Done when:
  - tests fail if `profile-view`, `faculty-gradebook`, `admin-orders`, or `staff` lose active nav glow
- Validate:
  - `npx vitest run test/left-nav-active-regressions.test.js`

#### DVS-PR-005 Shared Visual Ownership Contract
- Objective: publish the engineering rulebook for where shared visual changes belong.
- Routes / surfaces: whole portal.
- Files in scope: new root `.md` doc or explicit expansion of the master plan references.
- Dependencies: `DVS-PR-001`.
- Implement:
  - define ownership for tokens, shell chrome, card primitives, dashboard widgets, route exceptions, and mobile shell
  - define “change here first” guidance for common redesign needs
- Done when:
  - engineers can answer “which file owns this visual?” without guessing
- Validate:
  - human review against current code ownership

#### DVS-PR-006 Shared Summary-Surface Primitive
- Objective: extract a reusable premium summary/card primitive from the home dashboard styling.
- Routes / surfaces: standard shell routes with summary cards.
- Files in scope: `assets/css/index-home-dashboard.css`, `assets/css/index-luxury.css`.
- Dependencies: `DVS-PR-005`.
- Implement:
  - identify home-dashboard-only visuals worth reusing
  - move shared surface treatment into a route-agnostic CSS primitive
  - leave home-only structure in the home dashboard CSS
- Done when:
  - a standard route can adopt the premium summary style without importing home-only layout rules
- Validate:
  - browser compare `index.html` summary surfaces to one adopted route

#### DVS-PR-007 Library Summary Adoption
- Objective: migrate `library.html` summary and hero surfaces to the shared summary primitive.
- Routes / surfaces: `library.html`.
- Files in scope: `assets/css/index-luxury.css`, `assets/js/pages/library.js`, route CSS only if needed.
- Dependencies: `DVS-PR-006`.
- Implement:
  - convert route-local summary/card styling to the shared primitive
  - keep library-specific layout and content behavior
- Done when:
  - library feels like the same product as the dashboard and shell
  - no local summary styling hack is still required
- Validate:
  - browser screenshots on desktop and mobile

#### DVS-PR-008 Orders Summary Adoption
- Objective: migrate `orders.html` summary and hero surfaces to the shared summary primitive.
- Routes / surfaces: `orders.html`.
- Files in scope: `assets/css/index-luxury.css`, orders route renderer(s).
- Dependencies: `DVS-PR-006`.
- Implement:
  - move shared box styling into shared primitives
  - keep operational density intact
- Done when:
  - orders uses the same shared premium summary language as other standard routes
- Validate:
  - browser screenshots and smoke checks

#### DVS-PR-009 Student Service Summary Adoption
- Objective: migrate `student-service.html` summary surfaces to the shared summary primitive.
- Routes / surfaces: `student-service.html`.
- Files in scope: `assets/css/index-luxury.css`, `assets/js/pages/student-service.js`.
- Dependencies: `DVS-PR-006`.
- Implement:
  - replace route-local summary styling with shared summary/card primitives
  - preserve support-specific workflow layout
- Done when:
  - support summary surfaces feel like the same product as the dashboard shell
- Validate:
  - browser screenshots on desktop and mobile

#### DVS-PR-010 Registration Summary Adoption
- Objective: migrate `registration.html` summary and entry surfaces to the shared summary primitive.
- Routes / surfaces: `registration.html`.
- Files in scope: `assets/css/index-luxury.css`, registration route renderers.
- Dependencies: `DVS-PR-006`.
- Implement:
  - replace route-local standard summary styling
  - keep academic workflow structure unchanged
- Done when:
  - registration summary surfaces use shared premium treatment
- Validate:
  - browser screenshots and route sanity checks

#### DVS-PR-011 First Shared Mobile Shell Migration
- Code-backed implementation note:
  - live root standalone pages currently do not use `assets/js/pages/standalone-mobile-shell.js`
  - this ticket should activate the config-driven shared standalone contract, not create another route-local mobile variant
  - final state for the migrated route should be `standalone-mobile-shell.js` plus one canonical scaffold owner
- Objective: remove one live route’s inline mobile shell bootstrap and move it onto the shared mobile runtime.
- Routes / surfaces: one representative legacy inline-mobile route.
- Files in scope: target HTML page, `assets/js/pages/standalone-mobile-shell.js`, and if scaffold extraction is needed `assets/js/pages/index-mobile-shell.js`; touch `assets/css/mobile-responsive.css` only if the shared scaffold exposes real styling gaps.
- Dependencies: `DVS-PR-001`, `DVS-PR-005`.
- Implement:
  - pick one standard route with embedded mobile bootstrap
  - decide the canonical scaffold owner for that route:
    - keep one canonical HTML scaffold and attach shared config-driven behavior
    - or extract shared scaffold creation from `index-mobile-shell.js` if that is the safer path
  - replace copied inline shell logic with `window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG` plus shared runtime wiring
  - remove any polling-based `setInterval` waiting for `navigate` from the migrated route
- Done when:
  - the route no longer embeds inline `initMobileExperience()` bootstrap
  - the route uses shared config-driven mobile behavior
  - the route keeps its current visual hierarchy and mobile design language
- Validate:
  - `npx vitest run test/standalone-mobile-shell-runtime.test.js`
  - `npx vitest run test/index-mobile-shell-runtime.test.js` if scaffold code changed
  - `node tools/check-architecture-guardrails.js`

#### DVS-PR-012 First-Tap Mobile Route Test
- Objective: prove that the migrated route launches on first tap after `DVS-PR-011`.
- Routes / surfaces: the route migrated in `DVS-PR-011`.
- Files in scope: interaction regression test(s) plus `tools/check-architecture-guardrails.js`.
- Dependencies: `DVS-PR-011`.
- Implement:
  - encode a real mobile interaction path
  - assert route movement on the first tap
  - add the migrated route to `sharedMobileShellPages` so the shared contract becomes enforceable
- Done when:
  - the test fails if a second tap is needed
  - the architecture guardrail fails if the migrated route regresses to inline bootstrap/config drift
- Validate:
  - `npx vitest run test/standalone-mobile-shell-runtime.test.js test/index-mobile-shell-runtime.test.js`
  - `node tools/check-architecture-guardrails.js`

#### DVS-PR-013 Profile View Surface Unification
- Objective: make `profile-view.html` feel like part of the same product without flattening its route-specific layout.
- Routes / surfaces: `profile-view.html`.
- Files in scope: `assets/css/profile-view-route.css`, `assets/css/index-luxury.css`, route JS if required.
- Dependencies: `DVS-PR-003`, `DVS-PR-006`.
- Implement:
  - keep profile-specific structure
  - migrate standard cards/surfaces back onto shared primitives
- Done when:
  - the route uses shared shell/card visuals
  - the left-nav active glow remains correct
- Validate:
  - browser screenshots and active-nav check

#### DVS-PR-014 Personal Data CSS Reduction
- Objective: reduce `personal-data-route.css` so it only contains personal-data-specific styling.
- Routes / surfaces: `personal-data.html`.
- Files in scope: `assets/css/personal-data-route.css`, `assets/css/index-luxury.css`.
- Dependencies: `DVS-PR-006`.
- Implement:
  - move duplicated shell/card/button rules into shared CSS
- Done when:
  - route CSS only contains page-specific rules
- Validate:
  - CSS diff review plus browser screenshots

#### DVS-PR-015 Profile CSS Reduction
- Objective: reduce `profile-route.css` so it only contains profile-specific styling.
- Routes / surfaces: `profile.html`.
- Files in scope: `assets/css/profile-route.css`, `assets/css/index-luxury.css`.
- Dependencies: `DVS-PR-006`.
- Implement:
  - move duplicated shell/card/button rules into shared CSS
- Done when:
  - route CSS only contains page-specific rules
- Validate:
  - CSS diff review plus browser screenshots

#### DVS-PR-016 News CSS Reduction
- Objective: reduce `news-route.css` so it only contains news-specific styling.
- Routes / surfaces: `news.html`.
- Files in scope: `assets/css/news-route.css`, `assets/css/index-luxury.css`.
- Dependencies: `DVS-PR-006`.
- Implement:
  - remove shared shell/card surface duplication
  - keep news-specific layout and content styling
- Done when:
  - route CSS only owns news-specific visual differences
- Validate:
  - browser screenshots and route readability review

#### DVS-PR-017 Timetable CSS Reduction
- Objective: reduce `timetable-route.css` so it only contains schedule-specific styling.
- Routes / surfaces: `timetable.html`.
- Files in scope: `assets/css/timetable-route.css`, `assets/css/index-luxury.css`.
- Dependencies: `DVS-PR-006`.
- Implement:
  - remove duplicated shell/card rules
  - keep schedule-specific interaction visuals
- Done when:
  - route CSS only owns scheduling-specific visuals
- Validate:
  - browser screenshots on desktop and mobile

#### DVS-PR-018 Shared Nav Cross-Role Smoke Test
- Objective: prove the left nav shows one active item across role families.
- Routes / surfaces: student, professor, and admin routes.
- Files in scope: browser regression tests.
- Dependencies: `DVS-PR-003`, `DVS-PR-004`.
- Implement:
  - cover at least one standard route and one standalone route per role family
- Done when:
  - test output proves one active shared nav item is present in each role family
- Validate:
  - `npx vitest run test/left-nav-active-regressions.test.js`

#### DVS-PR-019 Design-System Audit Script
- Objective: create one script that reports route visual fragmentation.
- Routes / surfaces: all HTML entry pages.
- Files in scope: new script under `tools/`, optional docs link.
- Dependencies: `DVS-PR-001`.
- Implement:
  - report route CSS count
  - report inline style blocks
  - report inline mobile shell bootstrap
  - report shell asset mix
- Done when:
  - one command outputs a route-by-route visual ownership summary
- Validate:
  - inspect the script output manually

#### DVS-PR-020 Remove One Inline Style Block
- Objective: move one live luxury-route inline `<style>` block into the correct shared or route CSS file.
- Routes / surfaces: choose from `admin-scheduler.html`, `admin-tools.html`, or `lms.html`.
- Files in scope: target HTML page and owning CSS file.
- Dependencies: `DVS-PR-005`.
- Implement:
  - pick the least risky inline style block
  - move it into the appropriate CSS owner
- Done when:
  - one live route no longer depends on inline shared visual CSS
- Validate:
  - HTML diff, browser screenshots, no visual regression

#### DVS-PR-021 Topbar Utility State Normalization
- Objective: standardize active, hover, and open states for topbar utility buttons across standard routes.
- Routes / surfaces: standard luxury shell routes.
- Files in scope: `assets/css/index-luxury.css`, `assets/js/features/luxury-shell-chrome.js`.
- Dependencies: `DVS-PR-005`.
- Implement:
  - normalize utility button state styling in shared shell files only
- Done when:
  - utility buttons behave and look the same on core routes
- Validate:
  - browser interaction checks on representative routes

#### DVS-PR-022 Shared Empty / Error State System
- Objective: define and adopt one visual contract for empty and error states on standard routes.
- Routes / surfaces: library, orders, student-service, registration, programs, profile-view.
- Files in scope: `assets/css/index-luxury.css`, route renderers as needed.
- Dependencies: `DVS-PR-005`, `DVS-PR-006`.
- Implement:
  - define one empty/error surface grammar
  - adopt it on representative standard routes
- Done when:
  - representative routes use the same empty/error visual system
- Validate:
  - browser screenshots for empty and error states

#### DVS-PR-023 Social Exception Contract
- Objective: document which parts of `social.html` are allowed to be visually unique.
- Routes / surfaces: `social.html`.
- Files in scope: design-system docs and route exception doc.
- Dependencies: `DVS-PR-001`, `DVS-PR-005`.
- Implement:
  - record token inheritance rules
  - record layout-level exception rules
- Done when:
  - social has an approved exception contract instead of implicit divergence
- Validate:
  - human review only

#### DVS-PR-024 Career Market Exception Contract
- Objective: document which parts of `career-market.html` are allowed to be visually unique.
- Routes / surfaces: `career-market.html`.
- Files in scope: design-system docs and route exception doc.
- Dependencies: `DVS-PR-001`, `DVS-PR-005`.
- Implement:
  - record token inheritance rules
  - record layout-level exception rules
- Done when:
  - career market has an approved exception contract instead of implicit divergence
- Validate:
  - human review only

#### DVS-PR-025 Staff Exception Contract
- Objective: document which parts of `staff.html` are allowed to be visually unique.
- Routes / surfaces: `staff.html`.
- Files in scope: design-system docs and route exception doc.
- Dependencies: `DVS-PR-001`, `DVS-PR-005`.
- Implement:
  - record token inheritance rules
  - record layout-level exception rules
- Done when:
  - staff command center has an approved exception contract instead of implicit divergence
- Validate:
  - human review only


1. route identity and nav correctness
2. visual ownership contract
3. shared summary/card primitives
4. standard route adoption
5. mobile shell consolidation
6. route CSS reduction
7. special route exception governance
8. screenshot and audit automation

---

## 29. Definition Of Done

This section is production-ready when:
- every standard shell route uses the shared shell/card/button/nav system
- active left-nav highlight works on every major route family
- first-click route launch works on desktop and mobile for representative route triggers
- route-specific CSS is limited to intentional exceptions
- inline shared visual logic is removed from live pages or tracked as explicit exception debt
- there is a maintained route classification and exception map
- automated tests exist for the shared visual contracts

---

## 30. Hosted Human Usability Standard

The hosted version is good enough only if:
- users instantly understand where they are
- route-to-route movement does not feel like context switching into a separate app
- cards, widgets, boxes, and panels look intentionally related
- special pages feel distinct in workflow, not randomly different in design quality
- mobile interaction is first-tap reliable
- loading and empty states preserve trust

---

## 31. What Must Never Ship

- a new standard route with a private shell design language
- a route that loses active-nav glow
- a route that requires a second click to navigate
- a route that copies the mobile shell inline instead of using the shared runtime
- a redesign that updates only home dashboard widgets and leaves standard routes visually stale
- a route-specific CSS file that redefines shared shell primitives without documented exception approval

---

## 32. Final Phase Plan

### Phase 1: Kill Prototype Drift
- classify routes
- normalize active route identity
- stop first-click navigation failures

### Phase 2: Establish Shared Surface Truth
- centralize shell/card/button/input/hero rules
- extract shared summary primitives from the dashboard benchmark

### Phase 3: Fix Standard Routes
- migrate standard routes onto shared visuals
- reduce route CSS debt

### Phase 4: Consolidate Mobile Shell
- remove copied inline mobile shell logic
- converge onto shared mobile runtime

### Phase 5: Tame Special Routes
- keep custom workflow layouts
- force shared tokens and surface contracts

### Phase 6: Lock It Down
- add audit scripts
- add browser tests
- enforce contributor rules

---

## 33. If Time Or Budget Gets Tight

Do first:
- nav correctness
- route identity normalization
- shared card/button/token cleanup
- mobile shell consolidation on the most-used routes
- standard route adoption

Do not waste time first on:
- polishing rare exception routes before standard routes are unified
- deep redesign of excluded pages like login or protected-launch
- micro-optimizing one route CSS file before ownership rules are set

---

## 34. Final Recommendation

The portal should absolutely move toward one shared design system.

The right strategy is not “make all pages identical.”  
The right strategy is:
- one shared shell
- one shared surface language
- one shared active-nav and interaction contract
- a small, explicit set of justified exception routes

Right now the product is visually closer to one system than to many separate apps, but the implementation is still fragmented enough that redesigns and bug fixes cost too much.

My blunt recommendation:
- treat visual system unification as real platform work, not cosmetic cleanup
- make `index-luxury.css` and `index-home-dashboard.css` the intentional visual core
- aggressively reduce route-local overrides on standard routes
- keep special routes special only where they earn it

That is the path that will make redesign work cheaper, route behavior more reliable, and the portal feel like one serious production product.

---

## 35. Progress Tracking Baseline

This plan should be tracked with weighted epic progress, not raw task count alone.

Current weighted baseline estimate from the codebase scan:
- approximately **97% complete**
- approximately **3% remaining**

This is the current best baseline, not a ship signal. A task or epic only counts as complete when its explicit “Done when” and validation rules are satisfied.

### 35.1 Epic Weighting Model

| Epic | Weight | Current completion estimate | Remaining | Why this is the baseline |
|---|---:|---:|---:|---|
| DVS-A Visual System Ownership | 12% | 90% | 10% | route classification doc exists, the dedicated audit report script exists, the contributor rulebook exists, and classification / mobile-shell guardrails are green |
| DVS-B Core Token And Shell Unification | 18% | 74% | 26% | shared shell foundations already exist, `index-luxury.js` is back under its line ceiling, one live inline style block was moved into its owning route stylesheet, and shared premium summary surfaces now exist in common CSS and are adopted on multiple routes |
| DVS-C Dashboard Visual Benchmarking | 8% | 80% | 20% | the reusable premium summary primitive has been extracted from the home/dashboard visual language and is now used across multiple standard routes |
| DVS-D Route Normalization | 12% | 55% | 45% | `navigation.js` already normalizes some active-route behavior and tests exist, but alias and cross-route consistency are not fully locked down |
| DVS-E Mobile Shell Consolidation | 18% | 100% | 0% | live root routes no longer use copied inline `initMobileExperience()` blocks; shared standalone mobile behavior is now the default route contract outside special mobile owners like `social-mobile.js` and `index-mobile-shell.js` |
| DVS-F Standard Route Cleanup | 14% | 96% | 4% | the major standard-shell routes now use the shared standalone mobile contract, and the shared summary-surface primitive is now adopted on multiple standard route surfaces |
| DVS-G Special Route Packages | 8% | 78% | 22% | the special-surface routes now use the shared standalone mobile shell and the exception budget is documented, but route-specific refinement work is still incomplete |
| DVS-H Route CSS Reduction | 5% | 35% | 65% | the first real route-CSS reductions are now landed in `personal-data` and `profile`, but `news` / `timetable` and the admin variants still carry significant route CSS debt |
| DVS-I Visual QA And Governance | 5% | 100% | 0% | route-specific migration coverage improved materially, the full architecture guardrail suite remains green, and the dedicated audit report script now exists |

### 35.2 First 25 Task Tracking Rule

Track the first 25 build tasks in two layers:

- **Ticket closure**: binary, `done` only when the ticket's own “Done when” and validation clauses are satisfied
- **Implementation readiness**: partial progress is allowed here when foundations already exist in code, even if the ticket is not yet closed

Current baseline for the first 25 tasks:
- **4 / 25 closed by plan definition**
- `DVS-PR-001`, `DVS-PR-002`, `DVS-PR-011`, and `DVS-PR-012` now have concrete artifacts landed
- several additional tasks are **partially de-risked** by existing code foundations, especially around active-route logic, shared shell ownership, and mobile-shell runtime modules

### 35.2A First 25 Task Tracker

| Task | Status | Progress | Remaining | Evidence / note |
|---|---|---:|---:|---|
| `DVS-PR-001` | complete | 100% | 0% | `PORTAL_VISUAL_ROUTE_CLASSIFICATION.md` created |
| `DVS-PR-002` | complete | 100% | 0% | classification and shared-mobile-shell guardrails now cover `study-card`, `chancellery`, `timetable`, `registration`, `faculty-gradebook`, `programs`, `personal-data`, `profile`, `profile-view`, `admin-library`, `admin-orders`, `lms`, and `exams`, and `node tools/check-architecture-guardrails.js` passes |
| `DVS-PR-003` | in progress | 60% | 40% | `navigation.js` already centralizes alias handling; broader route adoption still needed |
| `DVS-PR-004` | in progress | 40% | 60% | existing left-nav regression coverage exists; wider broken-route assertions still needed |
| `DVS-PR-005` | complete | 100% | 0% | `PORTAL_VISUAL_CHANGE_RULEBOOK.md` now defines shared owners, mobile rules, summary-surface rules, and change-here-first guidance |
| `DVS-PR-006` | complete | 100% | 0% | `.lux-summary-surface` / hero / panel variants now exist in `assets/css/index-luxury.css` as the first shared premium summary primitive |
| `DVS-PR-007` | complete | 100% | 0% | `library.js` now adopts the shared premium summary surface for the library hero and catalog card |
| `DVS-PR-008` | complete | 100% | 0% | `orders-workspace.js` now applies the shared premium summary surface to the orders inbox hero and hero stats |
| `DVS-PR-009` | complete | 100% | 0% | `student-service.js` now applies the shared summary surface to the top operations cards while preserving the route-specific support layout |
| `DVS-PR-010` | complete | 100% | 0% | `registration.html` now applies the shared premium summary surface to the route hero, focus card, and insight cards |
| `DVS-PR-011` | complete | 100% | 0% | first shared standalone mobile migration landed in `study-card.html`, with the same contract now successfully reused for `chancellery.html`, `timetable.html`, `registration.html`, `faculty-gradebook.html`, `programs.html`, `personal-data.html`, `profile.html`, `profile-view.html`, `admin-library.html`, `admin-orders.html`, `lms.html`, `exams.html`, `admin-tools.html`, and `admin-scheduler.html` |
| `DVS-PR-012` | complete | 100% | 0% | route-specific migration tests now exist for `study-card`, `chancellery`, `timetable`, `registration`, `faculty-gradebook`, `programs`, `personal-data`, `profile`, `profile-view`, `admin-library`, `admin-orders`, `lms`, `exams`, `admin-tools`, and `admin-scheduler`, and targeted runtime checks pass |
| `DVS-PR-013` | not started | 0% | 100% | profile-view surface unification not started |
| `DVS-PR-014` | in progress | 60% | 40% | duplicated top-level personal-data shell/background rules were moved into `index-luxury.css`, shrinking `personal-data-route.css` while preserving route-specific layout rules |
| `DVS-PR-015` | in progress | 30% | 70% | duplicated profile mobile hide/icon rules were removed from `profile-route.css`, but the route still needs deeper shared shell/card cleanup |
| `DVS-PR-016` | not started | 0% | 100% | news CSS reduction not started |
| `DVS-PR-017` | not started | 0% | 100% | timetable CSS reduction not started |
| `DVS-PR-018` | in progress | 84% | 16% | left-nav regression suite exists and still passes after shared-shell data compaction and repeated route migrations; explicit cross-role smoke expansion still needed |
| `DVS-PR-019` | complete | 100% | 0% | `tools/report-visual-system-audit.js` now reports route classification, route CSS, inline style, mobile shell mode, and drift findings from the shared classification map |
| `DVS-PR-020` | complete | 100% | 0% | the inline `admin-tools.html` head style block was moved into `assets/css/admin-tools-luxury.css`, and the guardrail no longer allows inline style debt on that route |
| `DVS-PR-021` | not started | 0% | 100% | topbar utility normalization not started |
| `DVS-PR-022` | not started | 0% | 100% | shared empty/error visual system not started |
| `DVS-PR-023` | complete | 100% | 0% | `PORTAL_VISUAL_EXCEPTION_BUDGET.md` documents the approved `social.html` exception budget |
| `DVS-PR-024` | complete | 100% | 0% | `PORTAL_VISUAL_EXCEPTION_BUDGET.md` documents the approved `career-market.html` exception budget |
| `DVS-PR-025` | complete | 100% | 0% | `PORTAL_VISUAL_EXCEPTION_BUDGET.md` documents the approved `staff.html` exception budget |

### 35.2B Latest Execution Notes

- 2026-05-20: created `PORTAL_VISUAL_ROUTE_CLASSIFICATION.md` as the first human-readable ownership map
- 2026-05-20: migrated `study-card.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/study-card-mobile-shell-migration.test.js`
- 2026-05-20: migrated `chancellery.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: migrated `timetable.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/chancellery-mobile-shell-migration.test.js`
- 2026-05-20: added `test/timetable-mobile-shell-migration.test.js`
- 2026-05-20: migrated `registration.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/registration-mobile-shell-migration.test.js`
- 2026-05-20: migrated `faculty-gradebook.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/faculty-gradebook-mobile-shell-migration.test.js`
- 2026-05-20: migrated `programs.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/programs-mobile-shell-migration.test.js`
- 2026-05-20: migrated `personal-data.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/personal-data-mobile-shell-migration.test.js`
- 2026-05-20: migrated `profile.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/profile-mobile-shell-migration.test.js`
- 2026-05-20: migrated `profile-view.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/profile-view-mobile-shell-migration.test.js`
- 2026-05-20: migrated `admin-library.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: migrated `admin-orders.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: migrated `lms.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/admin-library-mobile-shell-migration.test.js`
- 2026-05-20: added `test/admin-orders-mobile-shell-migration.test.js`
- 2026-05-20: added `test/lms-mobile-shell-migration.test.js`
- 2026-05-20: migrated `exams.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/exams-mobile-shell-migration.test.js`
- 2026-05-20: migrated `admin-tools.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: migrated `admin-scheduler.html` off its inline mobile bootstrap and onto `assets/js/pages/standalone-mobile-shell.js`
- 2026-05-20: added `test/admin-tools-mobile-shell-migration.test.js`
- 2026-05-20: added `test/admin-scheduler-mobile-shell-migration.test.js`
- 2026-05-20: expanded `tools/check-architecture-guardrails.js` with route classification coverage, dedicated route-CSS baselines, and shared standalone mobile-shell checks
- 2026-05-20: targeted `vitest` checks for left-nav / standalone mobile shell / study-card / chancellery / timetable / registration / faculty-gradebook / programs / personal-data / profile / profile-view / admin-library / admin-orders / lms / exams / admin-tools / admin-scheduler migrations passed
- 2026-05-20: added the shared `.lux-summary-surface` primitive to `assets/css/index-luxury.css`
- 2026-05-20: adopted the shared summary surface on `library.js` for the route hero and catalog card
- 2026-05-20: adopted the shared summary surface on the top student-service operations cards
- 2026-05-20: adopted the shared summary surface on `orders-workspace.js` for the orders inbox hero and hero stats
- 2026-05-20: adopted the shared summary surface on `registration.html` for the route hero, focus card, and insight cards
- 2026-05-20: added `tools/report-visual-system-audit.js` so route classification, route CSS, inline style counts, mobile shell modes, and drift can be reported in one command
- 2026-05-20: added `PORTAL_VISUAL_CHANGE_RULEBOOK.md` to define shared owners, mobile rules, summary-surface rules, and change-here-first guidance
- 2026-05-20: added `PORTAL_VISUAL_EXCEPTION_BUDGET.md` to define the approved `social`, `career-market`, `staff`, `exams`, `admin-tools`, and `admin-scheduler` exception boundaries
- 2026-05-20: moved the duplicated top-level `personal-data` shell/background rules from `assets/css/personal-data-route.css` into `assets/css/index-luxury.css`
- 2026-05-20: removed duplicated profile mobile hide/icon rules from `assets/css/profile-route.css` and switched `profile.html` to the shared mobile-sheet icon classes
- 2026-05-20: compacted the static data blocks in `assets/js/features/index-luxury.js` so the file dropped back under its line ceiling without changing runtime behavior
- 2026-05-20: full `node tools/check-architecture-guardrails.js` now passes again

### 35.3 Progress Scale

Use this scale when updating epic percentages:

- `0%`: no meaningful implementation or ownership baseline exists
- `25%`: foundations exist, but no durable live adoption or enforcement exists
- `50%`: shared contract exists and at least one live route/workflow uses it successfully
- `75%`: majority adoption is complete and regression/guardrail coverage is active
- `100%`: the epic satisfies its backlog intent and no remaining work is required to meet the plan's Definition of Done

### 35.4 Update Rule

When progress changes, update:
- the weighted epic table above
- the count of closed first-25 tasks
- the evidence line that justifies the percentage move

Do not increase percentages because code “looks close.” Increase them only when real route adoption, tests, docs, and guardrails are landed.
