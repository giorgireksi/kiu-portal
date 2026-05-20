# Performance Optimization Continuation Plan

Purpose:
- give a human coder or another LLM a reliable restart point if work stops unexpectedly
- cover both page-load performance and runtime lag/jank across all pages
- capture the performance work already done so it is not repeated blindly
- preserve the current visual design for users while reducing implementation cost
- apply the optimization work across the whole website, not only one or two routes

Last updated from live codebase state:
- shared shell/theme system in `assets/js/features/index-luxury.js`
- studio UI in `assets/js/features/luxury-shell-chrome.js`
- transparency/per-surface rendering in `assets/js/shared/utilities.js`
- page-load audit scripts in `tools/all_pages_load_scan.mjs`
- existing backlog in `PAGE_LOAD_FIX_TASKS.md`

## 1. Current Situation

There are two different performance problems:

1. Page-load weight
- too much CSS and JS is loaded on many pages before the user can interact
- this was already measured with `npm run test:all-pages-load-scan`

2. Runtime lag / jank
- widgets, boxes, shell panels, and background effects can feel slow after load
- likely causes are expensive inline style updates, repeated `requestAnimationFrame` work, heavy gradients, many `backdrop-filter` surfaces, and shell-wide refreshes that touch too much DOM

This document is mostly about runtime lag, because `PAGE_LOAD_FIX_TASKS.md` already covers the asset-weight side.

## 1B. Scope

This optimization effort must affect all website pages.

That means:
- shared shell work must help every page that uses the unified shell
- route-specific cleanup must cover the heavy pages first, then the remaining pages
- no page should be treated as “done” just because home or one admin page feels faster

Minimum page coverage for validation:
- `index.html`
- `admin-orders.html`
- `admin-tools.html`
- `lms.html`
- `social.html`
- `registration.html`
- `student-service.html`
- `timetable.html`

Then expand checks to the rest of the root pages scanned by `npm run test:all-pages-load-scan`.

## 1C. Honest Performance Estimate

There is no honest single exact percentage yet, because the codebase has not been fully optimized or profiled after each batch.

Best estimate, based on the current scan and the known runtime hotspots:

### Page-load improvement after the planned load work
- whole site average first-load improvement: about `15%` to `35%`
- heaviest pages like `lms.html`, `social.html`, `admin-tools.html`: about `30%` to `50%`
- lighter pages with less custom JS: about `5%` to `20%`

### Runtime smoothness improvement after the planned jank work
- theme studio / palette / transparency interactions: about `30%` to `60%` smoother on affected routes
- dense pages with many widgets, cards, and glass surfaces: about `20%` to `45%` smoother
- pages that are already simple: sometimes only `5%` to `15%`

### Honest combined expectation
- across the whole website, a realistic total user-perceived improvement is probably around `20%` to `40%`
- on the worst pages and interactions, it could be closer to `40%` to `60%`
- if the lag is mostly device/GPU-related, the gain may be smaller on some machines

This is an estimate, not a measured result.
To replace estimates with real numbers, each optimization batch must record:
- before/after page-load scan deltas
- before/after interaction timing
- before/after DevTools performance traces
- before/after screenshots for parity

## 1A. Non-Negotiable Constraint

Performance work must keep the same visuals for users unless a later task explicitly says otherwise.

That means:
- keep the same visual direction, palette behavior, opacity behavior, and shell layout
- keep the same widget, box, topbar, and panel appearance as closely as possible
- optimize rendering cost, DOM work, paint cost, CSS layering, and JS refresh logic without intentionally redesigning the product

Allowed changes:
- replacing inline style writes with CSS variables
- removing duplicate work
- reducing hidden DOM/render work
- reducing GPU/paint cost while matching the current visual result
- swapping implementation details if screenshots remain visually equivalent

Not allowed during performance work:
- redesigning cards, widgets, topbar, shells, or page layouts
- simplifying visuals in a user-visible way just because it is easier
- changing theme semantics, palette behavior, or transparency meaning
- removing animation or glass effects for everyone unless the setting, performance tier, or user choice already supports it

Verification rule:
- before and after screenshots should look materially the same for the active user state
- if an optimization changes the look, treat it as a regression unless explicitly approved

## 2. Work Already Done

Do not redo these without checking current files first.

### Theme / Studio fixes already completed
- Curated palette clicks in Color & Motion Studio now work through the real UI.
- Transparency direction was flipped:
  - `0%` = most transparent
  - `100%` = most solid
- Opacity and color fade were partially decoupled:
  - `--lux-transparency-alpha` now controls fill/transparency
  - `--lux-color-fade-alpha` now controls color fade strength
- Shell tint variables now follow selected palette instead of sticking to old faculty colors.
- Background animation on/off toggle was added to Color & Motion Studio.

### Important files already touched
- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`
- `assets/js/features/luxury-shell-chrome.js`
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- `assets/js/pages/admin-orders.js`
- `admin-orders.html`

### Existing audit / verification commands
- `npm run test:all-pages-load-scan`
- `npm run test:all-pages-console`
- `npm run test:runtime-shell`
- `node --check <file>`

## 3. Highest-Risk Runtime Hotspots

These are the first places to profile and optimize.

### A. Transparency engine
Primary file:
- `assets/js/shared/utilities.js`

Why it is risky:
- `updateTransparency()` updates many CSS vars
- it also scans and mutates many surfaces directly
- it applies inline `background`, `backdrop-filter`, and signatures across many elements
- it includes many route-specific branches and selectors

Likely symptoms:
- slider movement feels janky
- changing palette or theme causes box/widget repaint spikes
- heavy layouts stall when many cards are on screen

Concrete tasks:
1. Profile `updateTransparency()` in DevTools Performance.
2. Count how many elements are touched on:
   - home
   - LMS
   - social
   - admin-orders
3. Reduce inline style writes where CSS variables can replace them.
4. Avoid reprocessing unchanged nodes when only one visual value changes.
5. Collapse route-specific selector lists where possible.

Success criteria:
- moving transparency slider no longer causes visible frame drops on home and admin pages
- palette changes do not trigger large repaint storms

### B. Shell-wide sync
Primary file:
- `assets/js/features/index-luxury.js`

Key function:
- `syncAll()`

Why it is risky:
- it coordinates shell state, palette, atmosphere, transparency, nav, layout, and legacy visual refresh
- if called too often, it can force broad style and layout work

Concrete tasks:
1. Trace all callers of `syncAll()`.
2. Categorize each call:
   - required
   - could be narrowed
   - redundant
3. Split `syncAll()` into smaller targeted refresh functions if needed:
   - shell tint refresh
   - studio UI refresh
   - transparency refresh
   - nav refresh
4. Prevent palette, opacity, and background changes from refreshing unrelated sections.

Success criteria:
- theme studio interactions refresh only what changed
- route navigation remains correct
- no visible lag from repeated shell syncs

### C. Background animation runtime
Primary files:
- `assets/js/features/index-luxury.js`
- encoded home bundle in `window.__kiuLuxuryHomeChunkBase64`
- shell CSS in `assets/css/index-luxury.css`

What is known:
- home route uses `#lux-bg-canvas`
- background loop runs through a `requestAnimationFrame` step in the home bundle
- new on/off toggle currently hides the canvas/overlay and persists state

Why it is risky:
- even when visually acceptable, the RAF loop may still consume CPU/GPU
- heavy background plus glass panels can amplify lag

Concrete tasks:
1. Measure CPU cost with animation `On` vs `Off`.
2. Confirm whether the RAF loop still runs while hidden.
3. If CPU remains high when off:
   - add a real runtime gate so the background step loop exits early when animations are off
   - avoid rebuilding scene data when animations are disabled
4. Consider lower-cost static render snapshot for `Off` mode instead of live canvas.

Success criteria:
- animation off reduces both visual motion and runtime work
- home route feels noticeably less laggy on slower hardware

### D. Backdrop-filter and layered gradients
Primary files:
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- route CSS files with heavy glass surfaces

Why it is risky:
- many boxes/widgets use blur + gradients + shadows + overlay layers
- these are expensive on large surfaces and on scrolling pages

Concrete tasks:
1. Inventory all large surfaces using `backdrop-filter`.
2. Reduce blur radius on large shells/cards where visual quality is still acceptable.
3. Remove unnecessary multi-layer gradients on widgets and topbar shell.
4. Prefer fewer layered radial gradients for high-density views.
5. Add lower-cost fallback styles for slower performance tiers.

Success criteria:
- scroll and interaction on dense pages feel smoother
- visual language remains consistent without so many GPU-heavy layers

### E. Route-specific heavy pages
Priority pages:
- `lms.html`
- `social.html`
- `admin-tools.html`
- `index.html`
- `admin-orders.html`

Why:
- already known from load scan and repeated runtime work
- these pages combine heavy shell logic with dense DOM and interactive panels

Concrete tasks:
1. For each page, record:
   - DOM node count
   - number of glass surfaces
   - number of inline style mutations during common interactions
2. Move hidden/secondary panels to lazy render where feasible.
3. Avoid loading or rendering box content that is not visible yet.
4. Reduce route-specific observers and expensive startup work.

Success criteria:
- first interaction on these pages feels immediate
- panel open/close and tab switching stop stuttering

## 4. Measurement Plan

Before optimizing more, gather these measurements on at least:
- `index.html`
- `admin-orders.html`
- `lms.html`
- `social.html`

Use:
1. Chrome DevTools Performance panel
2. Paint flashing / Layers if needed
3. `npm run test:runtime-shell`
4. `npm run test:all-pages-load-scan`

Record:
- CPU time during palette change
- CPU time during transparency slider drag
- CPU time during background animation on/off
- layout/recalculate style cost
- node count
- FPS or obvious frame drops
- before/after screenshots to confirm visual parity

For every optimization batch:
1. capture a before screenshot
2. make the optimization
3. capture the after screenshot
4. compare for visual parity before accepting the change

## 5. Concrete Task Backlog

### P0
1. Profile and reduce `updateTransparency()` cost in `assets/js/shared/utilities.js`.
2. Audit and reduce `syncAll()` overuse in `assets/js/features/index-luxury.js`.
3. Verify whether animation-off still burns CPU in the home background runtime.
4. Add screenshot-based visual parity checks for every optimization batch.

### P1
4. Reduce `backdrop-filter` cost on shell and widget surfaces.
5. Lower the number of heavy gradient layers on home widgets and topbar shell.
6. Add a true low-cost background mode for slow devices / animation off.

### P2
7. Audit LMS and social for route-specific DOM/render waste.
8. Reduce widget/box count or lazy-render non-visible sections where possible.
9. Expand performance-tier behavior so slower environments automatically get cheaper visuals.

## 6. Suggested Execution Order

1. Benchmark transparency slider and palette change on home.
2. Capture before screenshots for the pages being touched.
3. Optimize `updateTransparency()`.
4. Optimize `syncAll()` call graph.
5. Confirm background animation off actually reduces runtime work.
6. Reduce expensive shell/card visual layers.
7. Move to LMS/social/admin route-specific cleanup.
8. Rerun page-load scan, runtime checks, and screenshot comparisons after every batch.

## 7. Files Most Likely To Change Next

- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`
- `assets/js/features/luxury-shell-chrome.js`
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- `assets/js/pages/lms.js`
- `assets/js/pages/social-page.js`
- `assets/js/pages/admin-orders.js`

## 8. Quick Start For Next Coder / LLM

If resuming later:

1. Read:
- `PERFORMANCE_OPTIMIZATION_CONTINUATION_PLAN.md`
- `PAGE_LOAD_FIX_TASKS.md`

2. Run:
- `npm run test:all-pages-load-scan`
- `npm run test:runtime-shell`

3. Reproduce manually:
- open `index.html`
- open Color & Motion Studio
- change palette
- drag transparency slider
- toggle background animations
- note lag and CPU spikes in DevTools

4. Start with:
- `assets/js/shared/utilities.js`
- specifically `updateTransparency()` and related refresh helpers
