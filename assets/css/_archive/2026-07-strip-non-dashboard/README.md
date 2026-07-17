# Archived route skins (2026-07 hard-clean)

**Not linked by any live page.** Dashboard is the only polished visual surface.

## Why

Strip LMS + timetable (and stop shipping per-route design systems) so we can redesign all non-dashboard pages onto **one shared** material stack later:

- `lux-tokens.css` → materials
- `lux-focus-panel.css` → soft-chrome / focus
- `lux-controls.css` → buttons / topbar
- thin layout-only CSS if needed

## Files

| File | Former live path | ~LOC |
|------|------------------|-----:|
| `lms-route-core.css` | `assets/css/lms-route-core.css` | 227 |
| `lms-quiz.css` | `assets/css/lms-quiz.css` | 3737 |
| `lms-quiz-live.css` | `assets/css/lms-quiz-live.css` | 2718 |
| `lms-workspace-chrome.css` | `assets/css/lms-workspace-chrome.css` | 2006 |
| `lms-interaction.css` | `assets/css/lms-interaction.css` | 1363 |
| `lms-gradebook-misc.css` | `assets/css/lms-gradebook-misc.css` | 4095 |
| `lms-whiteboard-catalog.css` | `assets/css/lms-whiteboard-catalog.css` | 2505 |
| `timetable-route.css` | `assets/css/timetable-route.css` | 1594 |

## Restore (temporary debug only)

Do **not** re-link full skins for production. To inspect old layout:

```html
<link rel="stylesheet" href="assets/css/_archive/2026-07-strip-non-dashboard/timetable-route.css">
```

Prefer cherry-picking grid/layout rules into a thin `*-layout.css` that uses shared tokens.

## See also

- `docs/visual-ssot.md`
- `MANIFEST.json`
