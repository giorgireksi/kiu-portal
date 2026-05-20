# KIU Dashboard - Mobile Optimization

## Architecture

**Topbar fixed at top** on mobile — always visible, always accessible.
**Sidebar on left** — slides in/out behind overlay.

## How It Works

### Mobile (≤768px)

```
┌─────────────────────────────────┐
│ [≡] Dashboard [CS▾] [Admin▾]   │ ← TOPBAR: fixed, always visible
├─────────────────────────────────┤
│                                 │
│   [Sidebar slides in/out]      │
│   │ nav item                   │
│   │ nav item                   │
│   │ nav item                   │
│                                 │ ← Content area below topbar
│   [dashboard cards]            │
│   [dashboard cards]            │
│                                 │
└─────────────────────────────────┘
```

### Key Points

1. **Topbar is `position: fixed`** at top:0 — never scrolls away
2. **Sidebar toggle button** always accessible in topbar (icon only)
3. **Faculty/View pickers** stay in topbar — compact, always usable
4. **Content scrolls below topbar** with `padding-top: 58px`
5. **Sidebar slides** from left behind dark overlay
6. **Tap overlay** → closes sidebar

## Files Modified

### `assets/css/mobile-responsive.css`
Clean, organized mobile rules (~420 lines)

### `assets/js/app/app.js`
- Click overlay → closes sidebar
- Uses existing `toggleSidebar()` function

### `index.html`, `lms.html`, `admin-tools.html`
- mobile-responsive.css linked

## Breakpoints

| Size | Target | Grid |
|------|--------|------|
| ≤768px | Mobile | 2 columns |
| <400px | Small phones | 1 column |
| ≤500px height (landscape) | Landscape phones | adapted |

## What's Optimized

- ✅ Topbar: fixed, compact, always visible
- ✅ Sidebar toggle: icon-only, always accessible
- ✅ Sidebar: slides in/out from left
- ✅ Overlay: tap to close
- ✅ Content: fills width, scrolls below topbar
- ✅ Dashboard grid: 2-col → 1-col
- ✅ Touch targets: 40px minimum
- ✅ iOS safe area
- ✅ Reduced motion support
