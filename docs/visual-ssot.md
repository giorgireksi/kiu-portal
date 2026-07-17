# Visual SSOT (Phase A shared stack)

## Aim

1. Clean legacy visual CSS first.
2. Small shared files that work.
3. Later: all pages share dashboard materials (Phase B/C).

## Live design

| Surface | Status |
|---------|--------|
| **Dashboard** | Polished full-paint (`lux-full-paint` + home-dashboard) |
| **Bare portal pages** | Flat wireframe + shared **lux-shell** (not luxury megafile) |
| **Auth** | login / protected-launch / redirect route CSS |

## Dashboard stack

```
kiu-fonts → base → layout → lux-tokens
→ lux-surfaces → lux-focus-panel → lux-controls
→ lux-layout-primitives → lux-modals
→ lux-shell.css          (structure + full-paint paint gated)
→ lux-fouc-ht.css        (FOUC/HT/atmosphere/studio — dashboard only)
→ mobile-responsive
→ index-home-dashboard   (widgets / soft-chrome polish)
```

## Bare stack

```
kiu-fonts → base → layout → lux-tokens
→ lux-controls → lux-layout-primitives → [modals]
→ lux-shell.css → lux-page-bare → mobile
```

**Do not** link `index-luxury.css`, `lux-shell-nav.css`, `lux-shell-full-paint.css`, or `_archive/`.

## Retired

| Old | New |
|-----|-----|
| `lux-shell-nav` + `lux-shell-full-paint` | **`lux-shell.css`** |
| `index-luxury.css` (megafile) | **`lux-fouc-ht.css`** (slim) or stub |

## Archive

`assets/css/_archive/2026-07-strip-non-dashboard/` — LMS/TT skins, unlinked.

## Phase B/C (later)

Share soft-chrome + framed materials on bare pages using this same shell + tokens stack.
