# Safe edit surface (Wave H7)

**Goal:** before editing a file, a mid can answer “how many unrelated routes break if I get this wrong?”

Machine SSOT: [`tools/safe-edit-manifest.json`](../tools/safe-edit-manifest.json).  
Related: [`js-change-locality.md`](js-change-locality.md) (owners ≤2) · [`css-js-coupling.md`](css-js-coupling.md) · [`findability-index.md`](findability-index.md) · [`js-shared-hub-isolation.md`](js-shared-hub-isolation.md) (E2: keep feature logic out of hubs).

## Tiers

| Tier | Meaning | Day-1 default |
|------|---------|---------------|
| **danger** | Linked from many HTML routes (portal hubs) | Avoid for feature work; treat as platform change |
| **caution** | Shared by a route family or dual-purpose helper | Check callers / HTML fanout first |
| **domain-local** | One surface / findability owners | Prefer these (H5 owners ≤2) |

## Checklist

1. Open this doc / the manifest — is your path **danger** or **caution**?  
2. If danger: stop — prefer a **domain-local** owner from findability, or a dedicated CSS sheet from the CSS route map.  
3. If you must touch danger: keep the change generic (tokens, pure helpers) and run broader smoke (`check:architecture`, route console scans).  
4. Domain-local: edit findability **owners** only; peels stay `support`.

## Danger hubs (summary)

Portal-wide JS: `assets/js/app/{api,state,auth,app}.js`, `navigation.js`, luxury shell entry/chrome, `utilities.js`, `lux-transparency.js`.  
Portal-wide CSS: `kiu-fonts`, `lux-tokens`, `lux-controls`, `lux-shell`, `lux-focus-panel`, `lux-page-bare-lite`.

Full list + `editRule` strings: open the JSON manifest.

## Domain-local patterns

- `assets/css/*-route.css` (and other `dedicatedCss` from the CSS manifest)  
- `assets/js/pages/*-runtime.js` and feature peels under findability  
- News / social / home-dashboard feature folders  

## How to check

```bash
npm run check:safeedit
```
