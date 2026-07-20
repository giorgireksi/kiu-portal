# Human maintainability rubric

Audience: university IT / mid-level hires who did not write this portal.  
Score each criterion **0–10**. **Human A+** = every criterion ≥ **8**.

**Day 1 onboarding:** [`docs/ONBOARDING.md`](ONBOARDING.md).  
Related structure gates (Portal A+): [`docs/engineering-a-plus-frontend-js.md`](engineering-a-plus-frontend-js.md).  
**Start here to find code:** [`docs/findability-index.md`](findability-index.md).  
**What loads before X:** [`docs/dependency-index.md`](dependency-index.md).  
**How new JS talks to the page:** [`docs/js-naming-patterns.md`](js-naming-patterns.md) (exactly three patterns).  
**How to keep a change local:** [`docs/js-change-locality.md`](js-change-locality.md) (owners ≤2; peels as support).  
**Live vs retired CSS:** [`docs/active-vs-archive.md`](active-vs-archive.md).  
**Which test locks an invariant:** [`docs/test-as-map.md`](test-as-map.md).  
**Route → CSS stack:** [`docs/css-js-coupling.md`](css-js-coupling.md).  
**Feature → API/domain:** [`docs/fe-backend-seams.md`](fe-backend-seams.md).  
**Is this file safe to edit?** [`docs/js-safe-edit-surface.md`](js-safe-edit-surface.md).

## Criteria (0–10)

| # | Criterion | What “8+” means |
|---|-----------|-----------------|
| 1 | **Findability** | Feature → primary owner file(s) ≤2 + entry HTML/lazy chain in &lt;2 minutes from the index |
| 2 | **Local readability** | Open owner file; grasp purpose in &lt;5 minutes; hot hosts trending toward single-purpose |
| 3 | **Dependency clarity** | Load order documented; few “hope it loaded” probes for new code |
| 4 | **Naming honesty** | One preferred global style per leaf; names match role |
| 5 | **Change locality** | Small feature ≈ small blast radius (HTML + 1–2 owners) |
| 6 | **Safe edit surface** | Hard to break unrelated routes from a domain edit |
| 7 | **Onboarding docs** | Product wiring docs beat wave changelogs for day-1 |
| 8 | **Test as map** | Tests explain contracts humans rely on, not only source-locks |
| 9 | **Cognitive load** | ≤3 active patterns documented; reject a 4th without cause |
| 10 | **Dead / archive noise** | Active path obvious vs archive/legacy |
| 11 | **CSS/JS coupling** | Visual SSOT predictable for the route |
| 12 | **Backend seam clarity** | FE knows which API/domain owns the data |

## How to read a hot file (H2)

1. Open the file; read the top `READABILITY:` purpose + **Sections** TOC.  
2. **JS:** jump to `// --- READABILITY: <Name> ---` for the cluster you need.  
   **CSS:** jump to `/* ── § … ── */` (kernel) or `/* --- name --- */` / `SECTIONS:` (home sheets). Day-1: [`css-handoff.md`](css-handoff.md).  
3. Prefer peels named in the findability index over growing a ≥1800 host.

## How to check load order (H3)

1. Open [`dependency-index.md`](dependency-index.md) for the route.  
2. Read **eager hubs** (HTML order) then **lazy chains** (`ensure*` / `MODULE_URLS`).  
3. Prefer `ssForwardToLoadedModule` / factory deps over new `typeof window.foo` probes.

## How to pick a global style (H4)

1. Open [`js-naming-patterns.md`](js-naming-patterns.md).  
2. Choose **A** (ESM+bridge), **B** (Kiu bag+Expose), or **C** (factory peel).  
3. Do not invent a fourth dialect.

## How to keep a change local (H5)

1. Open [`js-change-locality.md`](js-change-locality.md).  
2. Edit **owners** only (≤2); treat `support` peels as load helpers.  
3. Put new peels in the route `MODULE_URLS` / eager chain once; use shared test helpers for source-locks.

## How to know if an edit is safe (H7)

1. Open [`js-safe-edit-surface.md`](js-safe-edit-surface.md) or [`tools/safe-edit-manifest.json`](../tools/safe-edit-manifest.json).  
2. If the path is **danger** / **caution**, prefer a **domain-local** owner (findability) or dedicated CSS (H9 map).  
3. Danger hubs are platform changes — do not hang a single-feature fix there.

## How to onboard (H10)

1. Open [`ONBOARDING.md`](ONBOARDING.md) (or root [`README.md`](../README.md)).  
2. Boot with `npm run start:local:web`, then follow the smoke path.  
3. Read the ordered **index** list on that page — not the wave scorecard first.

## How to tell live from archive (H6)

1. Open [`active-vs-archive.md`](active-vs-archive.md).  
2. Live CSS = everything under `assets/css/` (archive tree **purged** — do not reintroduce).  
3. Never `<link>` `_archive/` paths; retired basenames stay absent (see test helpers).

## How to find a contract test (H8)

1. Open [`test-as-map.md`](test-as-map.md) or [`tools/test-contract-manifest.json`](../tools/test-contract-manifest.json).  
2. Match feature / concern → test path.  
3. Read the file’s top `CONTRACT:` banner before editing.

## How to find route CSS (H9)

1. Open [`css-js-coupling.md`](css-js-coupling.md) or [`tools/css-route-manifest.json`](../tools/css-route-manifest.json).  
2. Look up the HTML file → `stack` + `dedicatedCss`.  
3. Do not add a new route sheet without updating visual-route-classification.

## How to find the backend seam (H9)

1. Open [`fe-backend-seams.md`](fe-backend-seams.md) or [`tools/fe-backend-seam-manifest.json`](../tools/fe-backend-seam-manifest.json).  
2. Match feature → `apiPrefix` / `domain` / `routes`.  
3. Read [`BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`](BACKEND_PLATFORM_DOMAIN_CONTRACTS.md) for ownership rules.

## Scorecard

| Criterion | Before H1 | Now | Wave |
|-----------|-----------|-----|------|
| 1 Findability | ~5/10 | **8/10** | **H1 ✅** |
| 2 Local readability | ~5/10 | **8/10** | **H2 ✅** · **H2b ✅** |
| 3 Dependency clarity | ~4/10 | **8/10** | **H3 ✅** |
| 4 Naming honesty | ~5/10 | **8/10** | **H4 ✅** |
| 5 Change locality | ~4/10 | **8/10** | **H5 ✅** |
| 6 Safe edit surface | ~6/10 | **8/10** | **H7 ✅** |
| 7 Onboarding docs | ~5/10 | **8/10** | **H10 ✅** |
| 8 Test as map | ~5/10 | **8/10** | **H8 ✅** |
| 9 Cognitive load | ~4/10 | **8/10** | **H4 ✅** (≤3 patterns documented) |
| 10 Dead / archive noise | ~5/10 | **8/10** | **H6 ✅** |
| 11 CSS/JS coupling | ~6/10 | **8/10** | **H9 ✅** |
| 12 Backend seam clarity | ~6/10 | **8/10** | **H9 ✅** |

**Human A+:** claimed (all twelve criteria ≥ **8**).

## Wave H1 — Findability ✅

| Deliverable | Status |
|-------------|--------|
| Machine-checkable [`tools/findability-manifest.json`](../tools/findability-manifest.json) | ✅ |
| Human index [`docs/findability-index.md`](findability-index.md) | ✅ |
| Hub `FINDABILITY:` banners | ✅ |
| `test/wave-h1-findability.test.js` + `npm run check:findability` | ✅ |

## Wave H2 — Local readability ✅

| Deliverable | Status |
|-------------|--------|
| `READABILITY:` purpose + TOC + section markers on all `assets/js` files ≥1800 lines | ✅ |
| Peel [`social-feed-comments-runtime.js`](../assets/js/pages/social-feed-comments-runtime.js); load before feed | ✅ |
| `test/wave-h2-local-readability.test.js` + `npm run check:readability` | ✅ |

## Wave H2b — Local readability peels ✅

| Deliverable | Status |
|-------------|--------|
| Peel [`gradebook-quiz-map-runtime.js`](../assets/js/pages/gradebook-quiz-map-runtime.js) (Pattern C) before `gradebook-model.js` | ✅ |
| Peel [`gradebook-components-runtime.js`](../assets/js/pages/gradebook-components-runtime.js) before `gradebook-workspace.js` | ✅ |
| Peel [`admin-scheduler-faculty-runtime.js`](../assets/js/pages/admin-scheduler-faculty-runtime.js) before scheduler host | ✅ |
| `assets/js` files ≥1800 lines ≤ **8** | ✅ |
| `test/wave-h2b-local-readability.test.js` + `npm run check:readability:h2b` | ✅ |

## Wave H3 — Dependency clarity ✅

| Deliverable | Status |
|-------------|--------|
| [`tools/dependency-manifest.json`](../tools/dependency-manifest.json) + [`docs/dependency-index.md`](dependency-index.md) | ✅ |
| `typeof window.*` cut via `ssForwardToLoadedModule` (ops peel + E3 host stubs; ~1008→~887) | ✅ |
| Gate `TYPEOF_WINDOW_MAX = 900` in `check:js-ceilings` (E3) | ✅ |
| `test/wave-h3-dependency-clarity.test.js` + `npm run check:dependency` | ✅ |

## Wave H4 — Naming honesty + Cognitive load ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/js-naming-patterns.md`](js-naming-patterns.md) — patterns A/B/C only | ✅ |
| Migrate [`assets/js/app/state.js`](../assets/js/app/state.js) → Pattern B `KiuState` / `__kiuStateExpose` | ✅ |
| `test/wave-h4-naming-patterns.test.js` + `npm run check:naming` | ✅ |

## Wave H5 — Change locality ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/js-change-locality.md`](js-change-locality.md) — owners ≤2 vs support peels | ✅ |
| Findability `owners` ≤2 + optional `support`; H1 gate tightened | ✅ |
| Shared [`test/helpers/gradebook-sources.js`](../test/helpers/gradebook-sources.js); gradebook load-chain SSOT | ✅ |
| `test/wave-h5-change-locality.test.js` + `npm run check:locality` | ✅ |

## Wave H6 — Dead / archive noise ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/active-vs-archive.md`](active-vs-archive.md) — live CSS; archive **purged** | ✅ |
| Archive test helpers labeled RETIRED fixtures | ✅ |
| `test/wave-h6-archive-noise.test.js` + `npm run check:archive` | ✅ |

## Wave H7 — Safe edit surface ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/js-safe-edit-surface.md`](js-safe-edit-surface.md) + [`tools/safe-edit-manifest.json`](../tools/safe-edit-manifest.json) (danger / caution / domain-local) | ✅ |
| `test/wave-h7-safe-edit-surface.test.js` + `npm run check:safeedit` | ✅ |

## Wave H8 — Test as map ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/test-as-map.md`](test-as-map.md) + [`tools/test-contract-manifest.json`](../tools/test-contract-manifest.json) (≥10 contracts) | ✅ |
| `CONTRACT:` banners on indexed tests; [`test/gradebook-load-chain-contract.test.js`](../test/gradebook-load-chain-contract.test.js) | ✅ |
| `test/wave-h8-test-as-map.test.js` + `npm run check:testmap` | ✅ |

## Wave H9 — CSS/JS coupling + Backend seams ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/css-js-coupling.md`](css-js-coupling.md) + [`tools/css-route-manifest.json`](../tools/css-route-manifest.json) synced to visual-route-classification | ✅ |
| [`docs/fe-backend-seams.md`](fe-backend-seams.md) + [`tools/fe-backend-seam-manifest.json`](../tools/fe-backend-seam-manifest.json) (≥12 seams) | ✅ |
| `test/wave-h9-css-backend-seams.test.js` + `npm run check:cssjs` / `check:seams` / `check:h9` | ✅ |

## Wave H10 — Onboarding docs ✅

| Deliverable | Status |
|-------------|--------|
| [`docs/ONBOARDING.md`](ONBOARDING.md) + root [`README.md`](../README.md) | ✅ |
| [`tools/onboarding-manifest.json`](../tools/onboarding-manifest.json) + `test/wave-h10-onboarding.test.js` + `npm run check:onboarding` | ✅ |
| Human A+ (all criteria ≥8) | ✅ |
