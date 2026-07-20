# Engineering band queue (criteria 13–22)

Custom Engineering / portal structure band. Raise **one criterion per wave**.

## Scores (honest)

| # | Criterion | Score | Wave |
|---|-----------|-------|------|
| 22 | Test suite health | **≥8** | **E1 ✅** |
| 21 | Shared-hub isolation | **≥8** | **E2 ✅** |
| 15 | Global / `typeof` probe hygiene | **≥8** | **E3 ✅** |
| 13–14 | God-file / peels | **≥8** | **E4 ✅** |
| 16 | ESM ratchet | **≥8** | **E5 ✅** |
| 18 | FE line mass | **≥8** | **E6 ✅** |

**Band claim:** queued Engineering criteria **all ≥8** (E1–E6 complete). Further peels / ESM / dead-code passes may still raise individual rows toward 9–10.

## E1 ✅ — Test suite health ≥8 (2026-07-20)

- Gate: `npm run check:e1`

## E2 ✅ — Shared-hub isolation ≥8 (2026-07-20)

- Gate: `npm run check:e2`

## E3 ✅ — Typeof probe hygiene ≥8 (2026-07-20)

- Gate: `npm run check:e3`

## E4 ✅ — God-file peels ≥8 (2026-07-20)

- Gate: `npm run check:e4`

## E5 ✅ — ESM ratchet ≥8 (2026-07-20)

- Policy: [`docs/js-esm-leaf-ratchet.md`](js-esm-leaf-ratchet.md)
- Gate: `npm run check:e5`

## E6 ✅ — FE line mass ≥8 (2026-07-20)

- Policy: [`docs/js-fe-line-mass.md`](js-fe-line-mass.md)
- Deleted never-loaded `assets/js/portfolio/` (−616 lines; 283→277 files)
- Gate: `npm run check:e6`

See also: [`engineering-a-plus-frontend-js.md`](engineering-a-plus-frontend-js.md).
