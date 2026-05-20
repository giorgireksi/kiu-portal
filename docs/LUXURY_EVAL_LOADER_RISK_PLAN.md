# Luxury Eval Loader Risk Plan

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the remaining `eval` audit gate by explicitly documenting the current loader path, why it still exists, and the safe replacement path.

## Current Flow

1. `assets/js/features/index-home-dashboard.js` registers a base64 payload through `window.__kiuRegisterLuxuryHomeChunk(...)`.
2. `assets/js/features/index-admin-tools.js` registers a base64 payload through `window.__kiuRegisterLuxuryAdminToolsChunk(...)`.
3. `assets/js/features/index-luxury.js` decodes those payloads and executes them with:
   - `eval(decodeLuxuryHomeChunkSource(encoded))` for admin tools
   - `eval(decodeLuxuryHomeChunkSource(encoded))` for home dashboard

## Why It Still Exists

The split luxury bundles are not standalone today.

They still depend on closure-local shell helpers from `index-luxury.js`, such as:

- `renderDynamicHomeShell` assignment targets
- `startBackground` assignment targets
- role/faculty shell helpers
- dashboard preference helpers
- shared shell render/update utilities

During this audit session, a direct external-script replacement was reproduced and rejected because it broke live runtime behavior:

- home shell failed to render
- admin tools lost dependency visibility
- route/runtime smoke failed even though syntax stayed clean

## Current Risk

- `eval` increases XSS impact and debugging complexity
- it blocks a strong CSP rollout
- it makes the split bundle path harder to reason about than first-party source imports

## Safe Replacement Path

### Option A: inline merge

- merge the decoded home/admin luxury bundle bodies back into `index-luxury.js`
- remove the registration wrapper files entirely
- keep one authoritative shell file

Tradeoff:

- larger single file
- lowest runtime ambiguity

### Option B: real first-party modules

- extract the shared shell helpers currently captured by closure
- make the split bundles import or reference those helpers explicitly
- load them as normal first-party scripts/modules instead of base64 payloads

Tradeoff:

- cleaner long-term architecture
- more refactor work than an inline merge

## Decision

The task is closed as an audit/remediation-plan task because the blocked state is now explicit:

- the live `eval` path is confirmed
- the reason it remains is concrete, not guessed
- the safe replacement path is concrete

This does **not** mean the risk is gone.

It means the remaining work is now an implementation refactor, not an unfinished audit mystery.
