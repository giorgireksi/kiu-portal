# God-file peels (Wave E4)

**Goal:** keep hot hosts under control — peel cohesive clusters out of ≥1800-line files, lower ceilings, and ratchet the ≥1800 headcount down.

Related: [`engineering-band-queue.md`](engineering-band-queue.md) · [`engineering-a-plus-frontend-js.md`](engineering-a-plus-frontend-js.md) · [`js-shared-hub-isolation.md`](js-shared-hub-isolation.md).

## Rule

| Do | Don't |
|----|--------|
| Peel a named cluster with factory + load guard | Grow a file already near its ceiling |
| Wire peel **before** host in HTML | Leave feature UI in danger hubs when a peel exists |
| Lower host `maxLines` after a peel | Raise ceilings |

## E4 proof

- Peel: `assets/js/app/state-admin-exam-runtime.js` (admin exam/quiz + exam-session helpers out of `state.js`)
- `state.js` ~1827 → ~1456; ceiling **1850 → 1500**
- ≥1800 headcount **7 → 6** (H2b `HOT_MAX_COUNT` ratcheted 8 → 6)

## How to check

```bash
npm run check:e4
npm run check:js-ceilings
npm run check:readability:h2b
```
