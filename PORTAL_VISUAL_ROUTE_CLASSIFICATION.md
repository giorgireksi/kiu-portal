# Portal Visual Route Classification

**Stale table retired.** Live classification lives in:

- [`tools/css-route-manifest.json`](tools/css-route-manifest.json)
- [`tools/visual-route-classification.js`](tools/visual-route-classification.js)
- [`docs/visual-ssot.md`](docs/visual-ssot.md)

Retired dedicated `*-route.css` paint skins are denylisted in [`test/helpers/bare-shell-css.js`](test/helpers/bare-shell-css.js) (`RETIRED_ROUTE_CSS`). Bare portals use shared paint + `lux-page-bare-lite` layout; auth/redirects stay thin.

## Quick reference (special-surface hubs)

| Route | Category | Dedicated CSS | Mobile shell |
|-------|----------|---------------|--------------|
| `staff.html` | `special-surface` | `assets/css/lux-page-bare-lite.css` | `shared-standalone` |
