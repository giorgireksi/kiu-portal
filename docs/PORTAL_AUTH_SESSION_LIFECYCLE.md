# Portal Auth Session Lifecycle

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the remaining auth/session audit gap with a concrete lifecycle map, explicit risk notes, and concrete immediate vs long-term mitigations.

## Lifecycle Map

### Main portal login

1. The browser submits `email + password` to `POST /api/portal/session/login`.
2. The backend creates a portal session and returns `session.token` only on the login response.
3. The client stores:
   - `KIU_PORTAL_SESSION_TOKEN` in `localStorage`
   - `KIU_AUTH_STATE` in `localStorage`
   - active user/session markers in `sessionStorage`
4. Routine protected API reads then use `X-Portal-Session` headers, not query-string tokens.
5. Realtime `/api/events` now also authenticates through headers instead of URL tokens.

### Main portal bootstrap and role switch

1. The client calls `/api/bootstrap` with `X-Portal-Session`.
2. The backend returns session/account data without echoing the token.
3. Admin impersonation stays client-visible as role/faculty UI state, but the backend session remains server-owned.
4. The narrowed `/api/portal/state` sync now sends only client-owned preference/UI slices, not the full portal blob.

### Microsoft sign-in completion

1. Microsoft callback now redirects with `microsoft_handoff`, not `portal_token`.
2. The browser completes sign-in through `POST /api/portal/microsoft/complete`.
3. The handoff is one-time and short-lived.
4. The browser still receives the final portal login token through the normal `session` payload because this static-asset architecture currently relies on browser-held session headers.

### Exam portal sign-in

1. The exam portal signs in through `POST /api/exam-portal/auth`.
2. The backend rate-limits repeated attempts.
3. Exam portal token, student context, and protected-exam draft state are now stored in `sessionStorage`, not `localStorage`.
4. Legacy local exam-portal keys are removed when a new session is written or restored.

### Logout and session clear

1. `authLogout()` now captures the active backend session token before clearing local auth markers.
2. `clearPortalClientAuthState(...)` removes:
   - portal auth state
   - portal session token
   - persisted portal state
   - exam-portal token/student leftovers
   - protected-exam draft keys
3. Logout now awaits backend session invalidation through `destroyPortalBackendSession(...)`.
4. Logout then forces `clearPortalSiteCaches(true)` to purge service-worker/cache state.
5. The browser redirects with `window.location.replace('login.html')`.

## Current Security Posture

### Immediate mitigations now in place

- Query-string token transport is removed from routine portal, social, events, and exam-session reads.
- Main portal sessions now have `expiresAt`.
- Expired sessions are rejected server-side.
- Credential changes revoke active sessions.
- Logout clears persisted state instead of leaving broader cached portal state behind.
- Exam portal state is session-scoped rather than cross-browser-session persistent.

### Risks that still remain

- The main portal still stores the active session token in `localStorage`.
- Because the frontend is a static asset shell, the browser still needs a bearer-style session token to call protected backend APIs.
- Any XSS in the main portal would still materially increase session compromise risk.
- Microsoft completion still ends in a browser-visible handoff token, even though it is one-time and short-lived.
- Login/reset throttling is still process-local, not shared across instances.
- Forwarded client IP handling still depends on trusted deployment proxy configuration.
- Exam portal sign-in remains weak-identity based (`email + studentId`) even though rate-limited.

## Decision

The current design is acceptable only as an explicitly documented transitional posture for this static-shell architecture.

Meaning:

- short-term acceptable: header-only token transport, session TTL, revocation on credential change, deterministic logout purge, session-scoped exam portal state
- not accepted as final architecture: long-lived browser-held bearer tokens as the permanent production model

## Recommended Mitigations

### Immediate baseline to keep

- Keep header-only session transport.
- Keep one-time Microsoft handoffs.
- Keep deterministic logout purge and cache clearing.
- Keep session-scoped exam portal storage.
- Keep server-side session TTL and credential-reset revocation.

### Long-term redesign

1. Migrate the main portal from browser-visible bearer tokens to server-owned `HttpOnly`, `Secure`, `SameSite` session cookies.
2. Replace process-local auth throttling with shared edge or datastore-backed rate limiting.
3. Route client IP capture through explicit trusted-proxy resolution only.
4. Replace exam portal weak-identity sign-in with a stronger launch-ticket or invigilator-issued short-lived secret model.
5. Replace Microsoft browser redirect completion with same-origin popup/postMessage or equivalent non-URL completion where practical.
