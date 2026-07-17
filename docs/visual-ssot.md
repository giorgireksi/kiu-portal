# Visual SSOT (hard-clean era)

## Live design

| Surface | Status |
|---------|--------|
| **Dashboard** (`index.html` + `index-home-dashboard.css`) | Only polished full-paint product UI |
| **Auth** (login / protected-launch / redirect) | Keep usable shells |
| **All other portal pages** | **Bare**: shared kernel + `lux-page-bare` only |

## Shared kernel (every page)

```
kiu-fonts → base → layout → lux-tokens → lux-surfaces
→ lux-focus-panel → lux-controls → lux-layout-primitives
→ lux-modals (if needed) → index-luxury → mobile-responsive
→ [auth] login/protected/redirect route CSS
→ [dashboard only] index-home-dashboard
```

## Archived route skins

LMS + timetable design CSS lives under:

`assets/css/_archive/2026-07-strip-non-dashboard/`

**Not linked.** Layout will look broken until redesigned onto shared primitives.

## Future shared redesign

1. Keep dashboard soft-chrome / framed buttons as the material language.
2. Promote materials into tokens + `lux-focus-panel` + `lux-controls`.
3. Redesign each page with shared classes (`lux-soft-chrome`, `lux-focus-panel`, `lux-*-btn`) + optional thin layout CSS.
4. Cherry-pick layout from archive; never re-link full archived skins.

## Contract

- Do not add new `*-route.css` glass recipes.
- Do not link `_archive/` from live HTML.
- One material change → `lux-tokens.css` after redesign lands.


## Bare = nuclear flatten

`lux-page-bare` routes still load shared kernel CSS (`index-luxury`, `lux-controls`, `lux-focus-panel`).
Bare CSS **forces** solid surfaces, flat buttons, no focus rail, no ambient canvas.
Do not re-add `lux-soft-chrome` dual-write on bare pages until shared redesign.
