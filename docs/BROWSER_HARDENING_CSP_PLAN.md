# Browser Hardening and CSP Plan

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the remaining header/CSP audit gate by documenting the current posture, the exact blockers, and the next staged rollout step.

## Current Header Posture

Current backend/static posture already includes:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(self), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security` on HTTPS
- production CORS loopback gating through `KIU_EXTRA_CORS_ORIGINS`

Current gap:

- no `Content-Security-Policy` header or meta policy is shipped today

## Current CSP Blockers

### `unsafe-eval`

- `assets/js/features/index-luxury.js` still contains two live `eval(decodeLuxuryHomeChunkSource(...))` call sites for the home/admin luxury chunks

### Inline scripts

- many root HTML entries still contain inline bootstrap/mobile-shell scripts
- these would require either nonces/hashes or extraction into first-party JS files before a strict CSP

### Inline styles

- route HTML validity is now clean, but generated/runtime markup and some static route shells still rely on inline `style=` usage in places outside the validator’s root-entry backlog
- this blocks a strict `style-src 'self'` posture without `'unsafe-inline'` or a larger extraction pass

### DOM string rendering

- first-party runtime still uses `innerHTML` and `insertAdjacentHTML` in multiple route owners
- those do not block CSP by themselves, but they increase the value of a future Trusted Types / sink-reduction pass

## Staged Rollout

### Stage 1: audit/report-only policy

Ship a report-only CSP first:

- `default-src 'self'`
- `base-uri 'self'`
- `frame-ancestors 'self'`
- `object-src 'none'`
- `img-src 'self' data: blob:`
- `font-src 'self' data:`
- `connect-src 'self'` plus explicit backend/realtime/RTC origins actually used in production
- temporary allowances:
  - `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
  - `style-src 'self' 'unsafe-inline'`

Goal:

- capture real violations before any enforcement breakage

### Stage 2: remove `unsafe-eval`

- replace the luxury chunk loader with a first-party module/script strategy that does not depend on `eval`
- this is the gating dependency for a materially stronger script policy

### Stage 3: extract inline bootstrap and mobile-shell scripts

- move repeated inline route bootstraps into first-party JS files
- then remove `'unsafe-inline'` from `script-src`

### Stage 4: reduce remaining inline style usage

- move the remaining route-shell inline styles and generated inline styling to CSS classes or variables
- then tighten `style-src`

## Concrete Next Step

The next implementation step is:

1. land report-only CSP in backend/static serving
2. keep the rest of the policy permissive enough to avoid breakage
3. use the resulting reports to guide the `AUDIT-SEC-01` eval-loader removal and the remaining inline-script/style extraction work

## Decision

The browser hardening review is complete as an audit task:

- current posture is documented
- CSP blockers are explicit
- the staged rollout is concrete
