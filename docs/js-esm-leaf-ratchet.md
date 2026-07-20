# ESM leaf ratchet (Wave E5)

**Goal:** grow Pattern A pure models (`export` + `install*`) and raise `ESM_LEAF_MIN` — floor only goes up.

Gate: `ESM_LEAF_MIN` in [`tools/check-architecture-guardrails.js`](../tools/check-architecture-guardrails.js).  
Pattern: [`js-naming-patterns.md`](js-naming-patterns.md) (Pattern A) · [`engineering-band-queue.md`](engineering-band-queue.md).

## Rule

| Do | Don't |
|----|--------|
| Pure helpers as `type="module"` + classic `*-bridge.js` | Convert DOM/runtime peels to ESM without a load plan |
| Add leaf to `ESM_LEAF_MARKERS` and raise `ESM_LEAF_MIN` | Lower the floor |
| Teach lazy loaders `type=module` when scripts are injected | Load ESM leaves via classic `defer` only |

## E5 proof

- New leaves: `student-service-model.js`, `curriculum-library-model.js` (+ bridges)
- `ESM_LEAF_MIN` **8 → 10** (measured markers ≥12)

## How to check

```bash
npm run check:e5
npm run check:js-ceilings
```
