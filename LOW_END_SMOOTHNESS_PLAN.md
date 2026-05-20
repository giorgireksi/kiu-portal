# Low-End Smoothness Plan

Goal:
- make the website feel smoother on weaker hardware
- preserve the current visual quality for users
- give a human coder or another LLM a practical continuation document if work stops unexpectedly

This file is about runtime smoothness, not only load weight.

Related files:
- `PERFORMANCE_OPTIMIZATION_CONTINUATION_PLAN.md`
- `PAGE_LOAD_FIX_TASKS.md`

## 1. Core Rule

Do not redesign the site to make it faster.

Allowed:
- better scheduling
- less repeated DOM work
- less repeated style recalculation
- less paint/composite work
- cheaper offscreen rendering
- better caching and invalidation
- lower-cost code paths that produce the same visible result

Not allowed unless explicitly approved:
- flattening the design
- removing glass / depth / gradients globally
- changing theme semantics
- visibly changing widgets, shells, cards, topbar, or layout

## 2. Honest Reality

On weaker hardware, the main problem is usually not one single bug.
It is the combination of:
- too many expensive surfaces
- too many style writes
- too many full-shell refreshes
- too much offscreen rendering
- too much blur / gradient / fixed-layer work at the same time

So the best path is not “one magic fix”.
It is stacking multiple low-risk wins that each remove a bit of work.

## 3. Best “No Visual Loss” Techniques

These are the highest-value techniques to use first.

### A. Reduce work, not quality

Idea:
- keep the same appearance
- stop recalculating / repainting parts that did not change

Tasks:
1. Audit every shared refresh function and split broad refreshes into targeted ones.
2. Make palette changes update only palette-dependent layers.
3. Make transparency changes update only transparency-dependent surfaces.
4. Make nav changes update only nav, not whole-page shell state.

Good target files:
- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`

### B. Use CSS variables instead of repeated inline restyling

Idea:
- one root variable change is cheaper than hundreds of per-node style writes

Tasks:
1. Replace repeated inline background writes with CSS variable-driven backgrounds where possible.
2. Keep only unavoidable inline writes for route-specific legacy surfaces.
3. Remove duplicate writes when the value is unchanged.

Expected benefit:
- lower style recalculation cost
- lower JS time during studio interactions

### C. Make offscreen content cheap

Idea:
- if the user cannot see it, do not fully render it yet

Techniques:
- `content-visibility: auto`
- `contain`
- lazy rendering of hidden panels
- delayed hydration / delayed enhancement of hidden views

Tasks:
1. Apply containment carefully to dense, repeated card surfaces.
2. Ensure inactive pages, hidden sections, and closed panels do not fully render.
3. Avoid pre-rendering deep widget content that is below the fold.

Important:
- this must not break measurement, focus, or scrolling behavior

### D. Separate “visual state” from “render state”

Idea:
- store the user’s intended visuals at full fidelity
- render them through a cheaper internal pipeline when needed

Example:
- keep the same palette and transparency value
- internally cache derived RGB values, gradients, alpha mixes, and surface signatures
- recompute only when inputs actually change

Tasks:
1. Memoize computed palette / transparency / shell signatures.
2. Cache expensive derived values like mixed RGB strings and selector joins.
3. Reuse computed background strings instead of rebuilding them every time.

### E. Turn repeated DOM scans into indexed refreshes

Idea:
- instead of rescanning the document, keep track of relevant surfaces

Tasks:
1. Maintain a registry of transparency-managed surfaces.
2. Update the registry through mutation observation.
3. Refresh only impacted roots or registered nodes.

This is one of the strongest “same look, less work” optimizations.

### F. Use “static capture” tricks for expensive layers

Think outside the box:
- not every visual layer has to be recomputed every frame

Possible techniques:
1. Render expensive background animation once, then reuse a static frame when the page is idle.
2. Freeze decorative overlay layers during interaction, then restore them after.
3. Replace some repeated gradient recomputation with precomputed CSS variables.
4. Use a low-frequency update loop for decorative motion while keeping the same visible design.

Important:
- if the user cannot perceive the difference, this is a valid optimization

### G. Reduce scroll coupling

Idea:
- scrolling should not trigger unnecessary shell work

Tasks:
1. Ensure scroll listeners do not call broad refresh functions.
2. Ensure scrolling does not invalidate layout for fixed chrome unnecessarily.
3. Remove any hidden scroll-time feedback loops from observers and DOM updates.

### H. Precompute route-specific visual recipes

Idea:
- many routes use similar visual formulas with different classes

Tasks:
1. Precompute visual “recipes” per route and reuse them.
2. Avoid recomputing large conditional background strings for every matching surface.
3. Centralize shared formulas for cards/panels/widgets.

### I. Reduce GPU layer pressure without visible redesign

Idea:
- too many composited / blurred layers kill weaker GPUs

Tasks:
1. Identify which surfaces truly need their own layer.
2. Remove accidental layer promotion where it adds no value.
3. Keep fixed/floating shell layers intentional and minimal.
4. Avoid stacking blur + shadow + multi-gradient + transform on too many elements at once.

Note:
- this can be done without changing the look if done carefully

## 4. Non-Obvious High-Value Tricks

These are the “think outside the box” items worth testing.

### Trick 1. Decorative frame decimation
- update decorative motion at a lower frequency than the main UI
- example: 12–20 fps for background art, while the page still scrolls at full responsiveness

### Trick 2. Idle-phase recomputation
- do not recompute visual extras during the user’s active interaction
- defer non-critical visual refresh to idle time

### Trick 3. Surface signature caching
- create a signature from:
  - route
  - theme
  - palette
  - transparency
  - glow
  - intensity
- if unchanged, skip work completely

### Trick 4. One-to-many style propagation
- set one variable on a parent container and let descendants inherit
- avoid touching every child

### Trick 5. Paint isolation
- isolate heavy decorative layers from content layers
- if content scrolls, the decorative layer should not force content repaint more than necessary

### Trick 6. Visual snapshot fallback
- for weak devices or active interaction phases, temporarily use a cached visual state
- restore the live decorative layer when idle
- done correctly, users often will not notice

## 5. Priority Order

### P0
1. Profile scroll performance on `index.html`, `lms.html`, `social.html`, and `admin-orders.html`.
2. Optimize `updateTransparency()` and related refresh logic.
3. Reduce broad `syncAll()` calls and shell-wide refreshes.
4. Add screenshot parity checks so optimizations do not visually regress.

### P1
5. Expand offscreen rendering containment for heavy surfaces.
6. Build a surface registry instead of rescanning many selectors repeatedly.
7. Move decorative refresh work to idle or lower-frequency paths.

### P2
8. Reduce GPU layer pressure from blur/shadow/gradient stacking.
9. Add static-frame or low-frequency mode for decorative backgrounds.
10. Tune route-specific heavy pages after the shared engine is cheaper.

## 6. Measurement Checklist

For each optimization batch, record:
- before/after FPS feel during scroll
- before/after DevTools Performance trace
- before/after number of style/layout events
- before/after screenshots
- pages tested

Required pages:
- `index.html`
- `admin-orders.html`
- `admin-tools.html`
- `lms.html`
- `social.html`
- `registration.html`
- `student-service.html`
- `timetable.html`

## 7. Best Next Files To Touch

- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- `assets/js/pages/lms.js`
- `assets/js/pages/social-page.js`

## 8. Recommended First Execution Pass

1. Profile `updateTransparency()` and `syncAll()` on home.
2. Convert repeated per-node work into cached / targeted updates.
3. Verify visual parity with screenshots.
4. Repeat on `admin-orders.html`.
5. Then move to `lms.html` and `social.html`.

## 9. Honest Expectation

Without visible quality loss, the biggest realistic gains will come from:
- reducing repeated refresh work
- reducing offscreen rendering cost
- reducing scroll-coupled expensive repaint paths

Honest expected improvement if done well:
- smoothness on weak hardware: around `20%` to `40%`
- worst pages/interactions: maybe `40%` to `60%`

That is possible without visible redesign, but only if the work focuses on internals, scheduling, and rendering strategy, not on simplifying the UI.
