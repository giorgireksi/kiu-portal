# Typeof probe hygiene (Wave E3)

**Goal:** keep `typeof window.X` probes from sprawling across lazy stubs. Prefer `ssForwardToLoadedModule` (or factory deps) so the architecture gate can ratchet down.

Gate: `TYPEOF_WINDOW_MAX` in [`tools/check-architecture-guardrails.js`](../tools/check-architecture-guardrails.js) (only goes down).  
Related: [`js-shared-hub-isolation.md`](js-shared-hub-isolation.md) · [`human-maintainability.md`](human-maintainability.md) (H3) · [`engineering-band-queue.md`](engineering-band-queue.md).

## Rule

| Prefer | Avoid |
|--------|--------|
| `ssForwardToLoadedModule(hasMod, ensureMod, name, localFn, args, fallback)` | Repeating `typeof window.foo === 'function' && window.foo !== foo` in every stub |
| Factory `deps` / bag expose after peel load | New probes in danger hubs for one feature |
| Direct call when load order guarantees the API | Defensive `typeof window.*` on every line |

## E3 proof

- Host stubs in `student-service.js` converted to `ssForwardToLoadedModule` (~56 probes removed).
- `TYPEOF_WINDOW_MAX` ratcheted **970 → 900** (measured ~887).

## How to check

```bash
npm run check:e3
npm run check:js-ceilings
```
