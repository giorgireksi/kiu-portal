# Visual Override Risk Map

Purpose:
- document the real override/conflict paths in the current codebase
- help a human coder or another LLM avoid making changes that “work” in one place but get overridden elsewhere
- capture the old/new visual pipelines that still coexist in active files

This file is a risk map, not a feature backlog.

## 1. Main Conclusion

There is no separate `legacy/` folder, but there are still multiple generations of theme/studio/visual logic active in the live app.

That means a change can fail in three ways:
1. a newer shared-shell change works, but an older route-specific path overwrites it
2. a JS state change works, but a later CSS rule with `!important` wins visually
3. a shared visual variable is correct, but page-embedded studio markup or mobile shell code still drives an older entry point

## 2. Highest-Risk Override Layers

### A. Shared faculty visual setter
File:
- `assets/js/shared/utilities.js`

Key function:
- `applyFacultyLuxuryTheme(...)`

Why it matters:
- it sets many core shell variables directly:
  - `--lux-accent`
  - `--lux-accent-2`
  - `--lux-accent-rgb`
  - `--lux-shell-start-rgb`
  - `--lux-shell-end-rgb`
  - `--lux-shell-glow-rgb`
  - `--lux-topbar-tint-rgb`
  - `--lux-glass-tint-rgb`
  - `--lux-bg-particle-rgb`
  - `--lux-bg-line-rgb`
  - `--lux-bg-glow-rgb`
  - `--lux-bg-haze-rgb`
  - `--lux-home-secondary-rgb`

Risk:
- any route that calls `switchFacultyTheme(...)` or `applyFacultyLuxuryTheme(...)` can overwrite shell tint variables after a palette/studio change

### B. Shared compatibility layer
File:
- `assets/js/shared/utilities.js`

Key functions still active:
- `openStudio()`
- `applyPalette()`
- `setInterfaceMode()`
- `setBackground()`
- `initPalette()`

Current status:
- these now mostly delegate into the newer luxury system

Risk:
- they still exist as active entry points, so any future edit that bypasses the delegation can reintroduce split state

### C. Theme primer early boot path
File:
- `assets/js/theme-primer.js`

Why it matters:
- applies early root classes and variables before the main shell runtime finishes
- reads localStorage directly for:
  - `kiuLuxuryThemeMode`
  - `kiuLuxurySurfaceTransparency`
  - `kiuLuxuryPalette`
  - `kiu-palette`

Risk:
- if runtime semantics change but `theme-primer.js` is not kept in sync, users get first-paint mismatch or flash of wrong styles

### D. Main luxury shell state
File:
- `assets/js/features/index-luxury.js`

Why it matters:
- this is the current source of truth for most shell visuals
- it owns:
  - `getDashboardVisuals()`
  - `setDashboardVisuals()`
  - `applyResolvedPalette()`
  - `applyThemeMode()`
  - `setBackgroundMode()`
  - `setBackgroundIntensity()`
  - `setGlowStrength()`
  - `setBackgroundAnimationsEnabled()`
  - `syncAll()`

Risk:
- broad `syncAll()` behavior can overwrite narrower state if a later refactor reintroduces defaults incorrectly

### E. Studio UI layer
File:
- `assets/js/features/luxury-shell-chrome.js`

Why it matters:
- builds the current Color & Motion Studio
- binds the real shell controls

Risk:
- any helper used here must be exported correctly from `index-luxury.js`
- missing exports already caused real UI bugs before

## 3. Page-Embedded Studio Risk

### admin-orders route still contains old studio markup
Files:
- `admin-orders.html`
- `assets/js/pages/admin-orders.js`

Why it matters:
- the page still contains a full in-page `modal-studio`
- the route JS still listens for:
  - `data-admin-orders-palette`
  - `data-admin-orders-interface-mode`
  - `data-admin-orders-background`
  - `data-admin-orders-background-animation`
  - `data-admin-orders-transparency`

Current status:
- these are wired into the newer shared functions now

Risk:
- there are still two UI surfaces conceptually:
  - the shared shell studio
  - the old page-embedded admin-orders studio
- if one is edited but not the other, behavior can diverge again

## 4. Mobile Shortcut Risk

Files:
- `assets/js/pages/index-mobile-shell.js`
- `assets/js/pages/social-mobile.js`
- `assets/js/pages/staff-mobile-shell.js`
- `assets/js/pages/standalone-mobile-shell.js`
- `assets/js/pages/career-market.js`

Why it matters:
- mobile shell buttons do not always open the same DOM path directly
- they often use fallback logic like:
  - click `#lux-palette-btn`
  - else open `.lux-studio-backdrop`
  - else click another topbar button
  - else call `window.openStudio()`

Risk:
- if the primary studio path changes, mobile fallbacks may still target an older or partial route
- every studio-related change should be rechecked through mobile entry points

## 5. CSS Override Risk

Main file:
- `assets/css/index-luxury.css`

Why it matters:
- this file has a very large number of visual overrides
- many blocks use `!important`
- many route-specific selectors are very strong

High-risk categories:
1. shell/tint overrides
2. transparency endpoint overrides
3. route-specific surface backgrounds
4. light-mode duplicates of dark-mode rules
5. page-specific background overlays

Risk:
- JS can set the right variable and still lose visually because a later CSS branch uses a fixed gradient or a stronger selector

## 6. Known Examples Of “Looks Correct In State, Wrong On Screen”

These already happened during debugging:

1. Curated palette click changed accent state but not shell tint
Reason:
- the UI path failed before full shell recompute, and later shell tint variables stayed on old values

2. Opacity/transparency meaning changed in JS but CSS endpoint selectors still assumed the old direction
Reason:
- `data-lux-transparency="99"/"100"` CSS branches were not updated with the new semantics

3. Selected palette recolored widgets/nav but old faculty glow colors remained in shell fade
Reason:
- some derived glow/haze variables were still coming from faculty defaults instead of selected palette state

## 7. Rules For Future Visual Changes

If changing theme, palette, opacity, background, or studio behavior:

1. Check shared shell state in:
- `assets/js/features/index-luxury.js`

2. Check compatibility entry points in:
- `assets/js/shared/utilities.js`

3. Check early boot behavior in:
- `assets/js/theme-primer.js`

4. Check page-embedded studio / route-level handlers in:
- `admin-orders.html`
- `assets/js/pages/admin-orders.js`

5. Check mobile entry points in:
- `assets/js/pages/index-mobile-shell.js`
- `assets/js/pages/social-mobile.js`
- `assets/js/pages/staff-mobile-shell.js`
- `assets/js/pages/standalone-mobile-shell.js`
- `assets/js/pages/career-market.js`

6. Check CSS overrides in:
- `assets/css/index-luxury.css`
- route CSS files when the problem is route-specific

## 8. Validation Checklist

For any future visual change, test at minimum:

### Shared shell path
- open `index.html`
- use Color & Motion Studio directly
- verify palette / transparency / background / animation state

### Route compatibility path
- open `admin-orders.html`
- verify old embedded studio controls still match behavior

### Mobile / fallback path
- trigger studio from a mobile shell entry point
- verify the same state change happens

### CSS parity
- confirm the computed root variables changed
- confirm the visible shell/card/widget styles changed accordingly
- confirm no later CSS branch visually cancels the change

## 9. Safest Strategy Going Forward

Best practice:
- keep one real source of truth in `assets/js/features/index-luxury.js`
- keep old/shared/page-specific entry points as thin wrappers only
- do not let route-specific or compatibility code own visual state directly
- treat `assets/css/index-luxury.css` as a high-risk override surface and recheck it for every visual feature change
