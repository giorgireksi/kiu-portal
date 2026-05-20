# Portal Visual Change Rulebook

Purpose:
- make shared visual ownership explicit
- stop route-local drift before it ships
- tell engineers and LLMs where to change the system first

## 1. Ownership Order

When a visual change touches more than one route, change in this order:

1. `assets/css/index-luxury.css`
2. `assets/js/features/navigation.js`
3. `assets/js/features/luxury-shell-chrome.js`
4. `assets/js/pages/standalone-mobile-shell.js`
5. route-specific CSS or route-specific page JS only if the route has an approved exception

## 2. Shared Owners

These files own the shared system:

- tokens, shared premium surfaces, base shell cards, hero language:
  - `assets/css/index-luxury.css`
- home/dashboard benchmark visuals:
  - `assets/css/index-home-dashboard.css`
- route identity, page family resolution, standalone active-page normalization:
  - `assets/js/features/navigation.js`
- topbar, left-nav rendering, shared shell chrome:
  - `assets/js/features/luxury-shell-chrome.js`
- shared standalone mobile shell behavior:
  - `assets/js/pages/standalone-mobile-shell.js`
- route classification and route drift enforcement:
  - `tools/check-architecture-guardrails.js`
  - `tools/report-visual-system-audit.js`
  - `PORTAL_VISUAL_ROUTE_CLASSIFICATION.md`

## 3. Route-Local Owners

Use route-local code only when the route has behavior or layout that is truly specific:

- page-specific workflow structures
- domain-specific controls
- domain-specific dense tables or workbenches
- exception styling already approved in the exception-budget doc

Do not use route-local files to redefine:

- generic hero treatment
- generic summary cards
- shared nav state
- shared mobile shell behavior
- shared button hierarchy
- shared panel opacity / blur / glow rules

## 4. Mobile Rule

For standalone routes:

- use `window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG`
- use `assets/js/pages/standalone-mobile-shell.js`
- do not reintroduce copied `initMobileExperience()` blocks

For `index.html`:

- `assets/js/pages/index-mobile-shell.js` remains the owner of the home-shell mobile scaffold

For `social.html`:

- `assets/js/pages/social-mobile.js` remains the owner of social-specific mobile behavior

## 5. Summary Surface Rule

If a route needs:

- a premium hero surface
- a summary metric card
- a top-of-page decision panel

use the shared summary surface classes first:

- `lux-summary-surface`
- `lux-summary-surface--hero`
- `lux-summary-surface--panel`

Only add route-local summary styling when the route still needs a specific structural adjustment after those primitives are applied.

## 6. Inline Style Rule

Do not add new inline `<style>` blocks on luxury-shell routes.

Current exception debt that still exists:

- `admin-scheduler.html`
- `lms.html`

Any new inline style on a luxury-shell route is a regression unless explicitly approved and tracked for removal.

## 7. Change-Here-First Map

Common requests and where to start:

- “nav highlight is wrong”
  - `assets/js/features/navigation.js`
  - `assets/js/features/luxury-shell-chrome.js`
- “topbar state is inconsistent”
  - `assets/js/features/luxury-shell-chrome.js`
  - `assets/css/index-luxury.css`
- “a standalone mobile route needs the same shell behavior”
  - `assets/js/pages/standalone-mobile-shell.js`
  - route config block in the route HTML
- “hero / summary cards should look more premium”
  - `assets/css/index-luxury.css`
  - use `lux-summary-surface*`
- “one route looks visually off but behavior is normal”
  - first inspect whether shared CSS should be changed before touching route CSS

## 8. Before Merge

For shared visual work:

- run `node tools/check-architecture-guardrails.js`
- run `node tools/report-visual-system-audit.js`
- run the narrowest relevant `vitest` regression suite
- update `PORTAL_VISUAL_SYSTEM_UNIFICATION_MASTER_PLAN.md` progress notes if the work closes or materially advances a tracked task
