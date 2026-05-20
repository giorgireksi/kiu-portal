# KIU Realtime Bridge

This local helper gives the portal a shared account registry, shared messenger history, and browser-to-browser call signaling without hosting the site online.

## Start

Run:

```bat
start-realtime.bat
```

The bridge listens on:

- `http://127.0.0.1:47833`

## What it enables

- real account discovery across separate browsers
- shared messenger chats between different browsers
- WebRTC call signaling for browser-based audio/video calls
- Microsoft Entra ID sign-in when the bridge is configured with university tenant credentials
- shared backend file storage for LMS, social, and messenger attachments
- runtime platform config endpoint for frontend backend/file/call settings

## Microsoft Sign-In

To enable real `@kiu.edu.ge` Microsoft sign-in, set these environment variables before starting the bridge:

- `KIU_MICROSOFT_TENANT_ID`
- `KIU_MICROSOFT_CLIENT_ID`
- `KIU_MICROSOFT_CLIENT_SECRET`

Optional:

- `KIU_MICROSOFT_REDIRECT_URI`
  Default: `http://127.0.0.1:47833/api/portal/microsoft/callback`
- `KIU_PORTAL_LOGIN_URL`
  Default: `http://127.0.0.1:8765/login.html`

The Microsoft app registration should allow the redirect URI above and request:

- `openid`
- `profile`
- `email`
- `User.Read`

The bridge links a Microsoft identity to an existing portal account by:

1. exact portal email match
2. saved Microsoft object ID
3. KIU email alias match such as `name@kiu.edu.ge` to `name@student.kiu.edu.ge`

If Microsoft sign-in succeeds but the account is not linked to a portal record yet, the login page will stop with an honest `not linked` message instead of creating fake academic data.

## Important

- Keep this bridge running while testing two-account messaging or calls.
- The portal will still fall back to local-only behavior if the bridge is offline, but cross-browser messaging and real calls need the bridge.
- In the target production architecture, this bridge should evolve into the collaboration/workflow backend layer while official academic, finance, and HR truth stays linked to external systems.
- For whole-university scope, pair this bridge with the schema files in `infra/postgres/init/` and the system map in [UNIVERSITY_SYSTEM_ARCHITECTURE.md](D:/mock yo - Copy - Copy (2) - Copy/docs/UNIVERSITY_SYSTEM_ARCHITECTURE.md).
