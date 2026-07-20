# FE line mass (Wave E6)

**Goal:** cut true dead frontend JS — not vanity churn or peels-for-count.

Gate: absence of never-loaded trees + documented LOC drop.  
Policy: [`dead-code-cleanup.md`](dead-code-cleanup.md) · queue: [`engineering-band-queue.md`](engineering-band-queue.md).

## Rule

| Do | Don't |
|----|--------|
| Delete JS with no HTML/`ensure*`/import load path | Delete regen SSOTs (`home-dashboard/*`, `*.bundle-source.js`) |
| Prefer absence locks in vitest | Rewrite live domains to shave lines |
| Record before/after `assets/js` file + line counts | Count CSS `_archive` or move-only peels as deletes |

## E6 proof (2026-07-20)

| Metric | Before | After |
|--------|-------:|------:|
| `assets/js` files | 283 | **277** |
| `assets/js` lines | ~179,949 | **~179,333** (−616) |

**Deleted:** entire `assets/js/portfolio/` (6 files) — never referenced by any HTML script tag or loader; live portfolio is `social-workspace-portfolio-*`. Call sites that optionally probed `window.KiuPortfolioModel` were already no-ops and were simplified.

## How to check

```bash
npm run check:e6
```
