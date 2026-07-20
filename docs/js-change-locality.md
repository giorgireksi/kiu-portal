# JS change locality (Wave H5)

**Goal:** a small feature change stays in **HTML (if needed) + ≤2 primary owner files**.

Related: [`findability-index.md`](findability-index.md) · [`dependency-index.md`](dependency-index.md) · [`js-naming-patterns.md`](js-naming-patterns.md) · [`js-safe-edit-surface.md`](js-safe-edit-surface.md) · [`human-maintainability.md`](human-maintainability.md).

## Owners vs support

| Role | Meaning | Day-1 edit? |
|------|---------|-------------|
| **owners** | Primary files for the feature (≤2) | Yes |
| **support** (peels / load helpers) | Pattern C peels and load-before hosts listed for discoverability | Only when changing that peel’s concern |

Findability manifest fields:

- `owners` — required, length 1–2  
- `support` — optional array of peel / helper paths (not co-owners)

## Where new peels go

1. Add the Pattern C peel file.  
2. Insert it in the route’s **single** `MODULE_URLS` (or eager HTML chain that mirrors that list).  
3. Do **not** paste the path into every source-lock test — use shared helpers (e.g. [`test/helpers/gradebook-sources.js`](../test/helpers/gradebook-sources.js)).  
4. List the peel under `support` in findability if humans need to find it; leave `owners` alone unless the primary edit surface moves.

## Checklist for a small tweak

1. Open [`findability-index.md`](findability-index.md) → feature → **owners** only.  
2. Edit those owner file(s).  
3. If load order changes, update the route `MODULE_URLS` / matching eager HTML once.  
4. Prefer `createKiu*Api(deps)` / bag Expose over new `typeof window.*` probes.  
5. Extend the shared test helper if the module chain grew — not N copy-pasted path arrays.
