# CSS / JS coupling (Wave H9)

**Goal:** a mid can answer “which CSS stack owns this route?” without archaeology.

Machine SSOT: [`tools/css-route-manifest.json`](../tools/css-route-manifest.json) (synced from [`tools/visual-route-classification.js`](../tools/visual-route-classification.js)).  
Visual design: [`visual-ssot.md`](visual-ssot.md) · Archive: [`active-vs-archive.md`](active-vs-archive.md).

## Shared portal stack

```
kiu-fonts → lux-tokens.css
→ lux-focus-panel.css → lux-controls.css → lux-shell.css
→ route-bare/<route>/lux-page-bare-lite.css → mobile-shell-core.css

`lux-page-bare-lite.css` remains the source SSOT; route bundles are generated with
`npm run generate:route-bare-css` so each page parses only its own layout sections.
```

**Index extras:** `lux-fouc-ht.css` + `index-home-layout.css` + `index-home-widgets.css` + `index-home-role.css`.
**Auth:** tokens + surfaces + controls + route CSS (no focus-panel).  
**Redirect aliases:** tokens + controls + `redirect-route.css` only.

## Rules

1. Edit **live** CSS under `assets/css/` only (archive tree purged — do not reintroduce retired skins).  
2. Route-specific sheets = classification `dedicatedCss` only — do **not** invent a new `*-route.css` without updating `visual-route-classification.js` **and** regenerating / updating `css-route-manifest.json`.  
3. JS should prefer shared class names (`lux-*`, `lux-page-bare`, route body classes) over inline paint.

## Major surfaces

| HTML | Stack | Dedicated CSS |
|------|-------|----------------|
| `index.html` | index | `index-home-layout.css` + `index-home-widgets.css` + `index-home-role.css` |
| `lms.html` | shared-portal | `route-bare/lms/lux-page-bare-lite.css` |
| `social.html` | shared-portal | `route-bare/social/lux-page-bare-lite.css` |
| `timetable.html` | shared-portal | `layout-schedule-board.css` + `route-bare/timetable/lux-page-bare-lite.css` |
| `login.html` | auth | `login-route.css` |
| `calendar.html` / `gradebook.html` / … | redirect | `redirect-route.css` |

Full list: open the JSON manifest `routes` map.

## How to check

```bash
npm run check:cssjs
```
