# Active vs archive (Wave H6)

**Goal:** a mid can answer “is this CSS live or retired?” in under two minutes.

Related: [`visual-ssot.md`](visual-ssot.md) · [`css-js-coupling.md`](css-js-coupling.md) · [`human-maintainability.md`](human-maintainability.md).

## Live CSS

**Live** = everything under [`assets/css/`](../assets/css/). There is **no** `_archive/` tree (purged 2026-07 — **do not reintroduce**).

Edit these for production paint. See [`visual-ssot.md`](visual-ssot.md) for the stack.

## Retired basenames (must stay gone)

Retired route skins were deleted with the archive. They must **not** reappear under `assets/css/` or be `<link>`ed from HTML.

Machine denylists:

- [`test/helpers/lms-route-css.js`](../test/helpers/lms-route-css.js) — `RETIRED_LMS_ROUTE_CSS`
- [`test/helpers/bare-shell-css.js`](../test/helpers/bare-shell-css.js) — `RETIRED_ROUTE_CSS`

Examples: `lms-quiz.css`, `timetable-route.css`, `staff-command-center.css`, `index-luxury.css`, old `*-route.css` skins from the bare-shell era.

## HTML rule

Production HTML must never `href` into a path containing `_archive/`.

## Frontend JS

Active frontend JS lives under `assets/js/` (hosts + peels). Prefer findability owners over archaeology. Local agent/tmp dirs (`.playwright-*`, `.tmp`) are workspace noise, not product.

## How to check

```bash
npm run check:archive
```
