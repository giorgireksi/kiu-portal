# Test as map (Wave H8)

**Goal:** a mid can find the test that locks a product invariant — not only source-lock archaeology.

Machine SSOT: [`tools/test-contract-manifest.json`](../tools/test-contract-manifest.json).  
Rubric: [`human-maintainability.md`](human-maintainability.md).  
Findability ids: [`findability-index.md`](findability-index.md).

## How to use

1. Open the manifest (or the table below).  
2. Match your feature / concern → `test` path.  
3. Open that file; read the top `CONTRACT:` banner for the one-line invariant.  
4. Prefer extending a **CONTRACT** test over adding another anonymous `toContain` lock.

## Contract vs source-lock

| Kind | Purpose |
|------|---------|
| **CONTRACT** | Human-readable invariant a mid must not break (API surface, load order, owners ≤2, …) |
| **Source-lock / regression** | String archaeology for a past bug; fine for CI, not the day-1 map |

## Indexed contracts

| Id | Invariant | Test |
|----|-----------|------|
| `css.focus-panel` | Soft-chrome / focus-panel shared once | `test/lux-focus-panel-contract.test.js` |
| `social.domain-exports` | Domain is/handle export surface | `test/social-domain-export-contract.test.js` |
| `student-service.api-routes` | Client manifest ↔ backend routes | `test/student-service-api-route-contract.test.js` |
| `backend.platform-domains` | Platform domain public APIs | `test/backend-platform-contracts.test.js` |
| `human.findability` | Feature owners ≤2 + reachable | `test/wave-h1-findability.test.js` |
| `human.naming-patterns` | Only JS patterns A/B/C | `test/wave-h4-naming-patterns.test.js` |
| `lms.gradebook-load-chain` | One gradebook load order | `test/gradebook-load-chain-contract.test.js` |
| `human.change-locality` | Owners ≤2 + shared gradebook helper | `test/wave-h5-change-locality.test.js` |
| `human.archive-noise` | No `_archive/` tree; retired basenames stay gone | `test/wave-h6-archive-noise.test.js` |
| `human.local-peels` | Peels + ≥1800 headcount ≤6 | `test/wave-h2b-local-readability.test.js` |
| `social.feed-comments-peel` | Comments peel before feed | `test/wave-h2-local-readability.test.js` |
| `human.css-route-map` | Route → CSS stack synced | `test/wave-h9-css-backend-seams.test.js` |
| `human.fe-backend-seams` | Feature → API/domain seams | `test/wave-h9-css-backend-seams.test.js` |
| `human.safe-edit-surface` | Danger vs domain-local blast map | `test/wave-h7-safe-edit-surface.test.js` |
| `human.onboarding` | Day-1 product wiring front door | `test/wave-h10-onboarding.test.js` |

## Adding a contract

1. Write or pick a test that states a **product** invariant.  
2. Add `/* CONTRACT: … — see docs/test-as-map.md */` at the top.  
3. Append an entry to `tools/test-contract-manifest.json`.  
4. Run `npm run check:testmap`.
