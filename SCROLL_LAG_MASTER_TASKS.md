# Scroll Lag Master Tasks

Purpose:
- create a continuation-safe master task file for fixing lag during scrolling
- cover all pages, not only home or one admin page
- make the work understandable for both a human coder and another LLM
- remove guesswork in the middle of implementation

This file is intentionally detailed.

Related files:
- `PERFORMANCE_OPTIMIZATION_CONTINUATION_PLAN.md`
- `LOW_END_SMOOTHNESS_PLAN.md`
- `VISUAL_OVERRIDE_RISK_MAP.md`
- `PAGE_LOAD_FIX_TASKS.md`

## 1. Main Objective

Primary goal:
- make scrolling feel smooth and responsive across the whole website

Secondary goals:
- preserve the same visuals for users
- avoid regressions in theme, opacity, background, and shell behavior
- avoid “fixing” one page while making another page worse

Non-goal:
- redesigning the site to make it lighter

## 2. Rules Before Coding

These are non-negotiable.

1. Keep the same user-facing visuals.
2. Do not rely on one-page success as proof.
3. Verify on multiple heavy pages.
4. Treat old route-specific code and CSS override layers as real risks.
5. Prefer internal optimizations over visual degradation.

If a change makes scrolling smoother by visibly reducing quality, treat it as a last resort unless explicitly approved.

## 3. What “Scrolling Lag” Likely Means In This Codebase

The lag is probably a combination of:
- large DOM trees
- too many heavy boxes/widgets/cards visible at once
- expensive `backdrop-filter`
- many layered gradients
- too much fixed/floating shell chrome
- background canvas and overlay cost
- broad shell refreshes
- route-specific DOM additions that stay expensive while offscreen
- transparency/palette/theme logic that touches too many nodes

This means no single task will solve everything.
Use staged optimization.

## 4. Required Pages To Validate

These must be tested, not just one or two:

1. `index.html`
2. `admin-orders.html`
3. `admin-tools.html`
4. `lms.html`
5. `social.html`
6. `registration.html`
7. `student-service.html`
8. `timetable.html`
9. `news.html`
10. `career-market.html`

Then expand to the rest of the root pages.

## 5. High-Level Execution Strategy

Work in this order:

1. Measure scroll lag
2. Optimize shared runtime
3. Optimize shared CSS cost
4. Optimize offscreen rendering
5. Optimize page-specific heavy routes
6. Verify visual parity
7. Verify no route-specific old code overrides the result

## 6. Master Task Backlog

### P0. Build Reliable Measurement Before More Changes

#### Task P0.1
Name:
- Create a scroll profiling checklist for every heavy page

Why:
- without consistent measurement, people will guess based on “feels faster”

What to do:
- define one repeatable scroll test for each required page
- use the same viewport and same seeded user state
- record:
  - FPS feel
  - CPU spikes
  - style recalculation time
  - paint/composite cost
  - scroll input delay

Files likely involved:
- `tools/`
- maybe a new Playwright profiling helper

Definition of done:
- every required page has a documented scroll test path

#### Task P0.2
Name:
- Add screenshot parity checkpoints for scroll optimizations

Why:
- scroll optimizations must not silently degrade the look

What to do:
- capture before/after screenshots on:
  - home
  - admin-orders
  - LMS
  - social
- compare visually after each optimization batch

Definition of done:
- every major optimization batch includes screenshot evidence

### P1. Shared Runtime Optimization

#### Task P1.1
Name:
- Audit all shared shell refresh paths

Why:
- broad refreshes often cause unnecessary scroll-time work

What to inspect:
- `assets/js/features/index-luxury.js`
- `syncAll()`
- `queueShellSync()`
- `queueLegacyVisualRefresh()`
- `observeLegacyVisualTree()`

What to do:
- map every caller
- decide which are:
  - required
  - redundant
  - too broad
- split large refreshes into smaller targeted ones where safe

Definition of done:
- palette/opacity/nav/background changes stop refreshing unrelated sections

#### Task P1.2
Name:
- Finish optimizing transparency refresh behavior

Why:
- `updateTransparency()` is a likely major runtime hotspot

What to inspect:
- `assets/js/shared/utilities.js`

What to do:
- reduce node scanning
- reduce duplicate inline style writes
- reduce recomputation of large background strings
- prefer cached signatures and targeted refreshes
- build a registry approach if current caching still is not enough

Definition of done:
- transparency-related interactions no longer trigger large scroll-time penalties

#### Task P1.3
Name:
- Audit mutation observers for hidden feedback loops

Why:
- observers can cause continuous DOM work during scrolling and dynamic updates

What to inspect:
- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`
- route-specific observers in heavy pages

What to do:
- list all observers
- identify any that respond too broadly
- reduce watched subtree/attributes if safe
- debounce smarter where needed

Definition of done:
- observer-driven work is limited to necessary scopes

### P2. Shared CSS / Paint Optimization

#### Task P2.1
Name:
- Inventory heavy visual surfaces

Why:
- you cannot optimize what you have not mapped

What to inspect:
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- route CSS files

What to record:
- all large surfaces using:
  - `backdrop-filter`
  - many radial gradients
  - fixed positioning
  - large box shadows
  - `!important` backgrounds

Definition of done:
- a list exists of the most expensive shared surface patterns

#### Task P2.2
Name:
- Reduce paint cost without visible design loss

Why:
- layered blur/gradient/shadow stacks are expensive while scrolling

What to do:
- keep the same visual appearance
- simplify internal layering where possible
- remove duplicated background layers
- reduce unnecessary shadow stacking
- consolidate repeated gradient formulas into shared variable-driven recipes

Important:
- do not visibly flatten the design

Definition of done:
- same visible look, lower paint cost

#### Task P2.3
Name:
- Expand safe `content-visibility` and containment coverage

Why:
- offscreen rendering cost hurts scrolling on long/dense pages

What to inspect:
- `assets/css/index-luxury.css`
- route CSS files for long lists / card grids / dashboards

What to do:
- apply containment to additional safe surfaces
- verify:
  - no broken measurements
  - no broken sticky/fixed behavior
  - no layout pop-in that users notice

Definition of done:
- more offscreen content is skipped safely

### P3. Background Runtime Optimization

#### Task P3.1
Name:
- Measure actual cost of the home background loop

Why:
- decorative background may still consume too much CPU/GPU

What to inspect:
- `assets/js/features/index-luxury.js`
- home bundle via `window.__kiuLuxuryHomeChunkBase64`

What to do:
- compare CPU cost with animation on vs off
- determine whether hiding the canvas is enough or if the loop still runs hot

Definition of done:
- background cost is measured, not guessed

#### Task P3.2
Name:
- Add real low-cost background runtime path

Why:
- visual parity can be preserved while lowering decorative runtime cost

Possible techniques:
- lower-frequency decorative frame updates
- cached/static frame while idle
- true animation loop gate when animations are off
- reduced scene complexity based on performance tier

Important:
- preserve same visual direction

Definition of done:
- decorative background consumes less runtime work without visibly degrading normal use

### P4. Page-Specific Heavy Route Work

#### Task P4.1
Name:
- Optimize `lms.html` runtime smoothness

Why:
- LMS is one of the heaviest routes

What to inspect:
- `lms.html`
- `assets/js/pages/lms.js`
- related LMS runtime files

What to do:
- measure DOM size
- reduce always-active hidden panels
- lazy-render or defer expensive subviews
- reduce per-scroll visual cost in LMS-specific cards/panels

Definition of done:
- scrolling LMS feels materially smoother

#### Task P4.2
Name:
- Optimize `social.html` runtime smoothness

Why:
- social feed + many cards + UI state can be expensive

What to inspect:
- `assets/js/pages/social-page.js`
- `assets/css/social-rebuild.css`

What to do:
- reduce expensive offscreen feed/item rendering
- limit active visual complexity in non-visible panels
- reduce DOM churn when moving across sections

Definition of done:
- scrolling social feed is smoother on weak hardware

#### Task P4.3
Name:
- Optimize `admin-tools.html` runtime smoothness

Why:
- admin tools uses many large sections and panels

What to inspect:
- `assets/js/features/index-admin-tools.js`
- `assets/css/admin-tools-luxury.css`

What to do:
- reduce visible-at-once cost
- lazy-render non-active admin sections
- reduce heavy surface styling where possible without visual loss

Definition of done:
- admin tools scrolling and switching feel faster

#### Task P4.4
Name:
- Optimize `admin-orders.html` runtime smoothness

Why:
- this route still has shared-shell plus page-embedded compatibility layers

What to inspect:
- `admin-orders.html`
- `assets/js/pages/admin-orders.js`
- any orders workspace styling/runtime

What to do:
- ensure no duplicated studio/shell cost remains active unnecessarily
- reduce heavy cards/lists offscreen work

Definition of done:
- admin orders behaves like a normal optimized route, not a compatibility hotspot

### P5. Override / Regression Safety

#### Task P5.1
Name:
- Validate no old path overrides optimized behavior

Why:
- visual/runtime changes can be silently overridden later

What to inspect:
- `VISUAL_OVERRIDE_RISK_MAP.md`

What to do:
- for every optimization touching theme/shell/studio:
  - check shared shell path
  - check admin-orders compatibility path
  - check mobile shell path
  - check CSS override layers

Definition of done:
- no optimization is accepted until override-risk paths are rechecked

#### Task P5.2
Name:
- Keep same visuals rule enforced

Why:
- speed gains are not useful if users notice degraded design

What to do:
- keep before/after screenshots
- reject optimizations that visibly flatten the interface

Definition of done:
- performance gains come from smarter code, not uglier visuals

## 7. Suggested Work Packages

If splitting across sessions or people:

### Package A
- P0.1
- P0.2
- P1.1

### Package B
- P1.2
- P1.3
- P2.1

### Package C
- P2.2
- P2.3
- P3.1

### Package D
- P3.2
- P4.1
- P4.2

### Package E
- P4.3
- P4.4
- P5.1
- P5.2

## 8. Commands To Reuse

- `npm run test:all-pages-load-scan`
- `npm run test:all-pages-console`
- `npm run test:runtime-shell`
- `node --check <file>`

## 9. Best Next Step

If continuing immediately, start here:

1. Profile scrolling on:
- `index.html`
- `lms.html`
- `social.html`
- `admin-orders.html`

2. Then optimize:
- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`

3. Then verify:
- screenshots
- no override regressions
- same visuals

This is the best shared-first path for fixing scroll lag across the whole site.
