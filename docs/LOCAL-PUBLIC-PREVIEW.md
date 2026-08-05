# Local public preview

This is a temporary, two-day preview path for known testers. It keeps the portal
and platform API on localhost and publishes only the web proxy through a named
Cloudflare Tunnel. Portal authentication protects the application; Cloudflare
Access is optional and must be configured to remain compatible with the
anti-cheat clients.

Do not use this as permanent hosting. The portal may contain real university
data, so do not share the hostname publicly.

## Request a hostname

A named tunnel needs a domain managed by the Cloudflare account:

```text
preview.example.com
```

Replace `preview.example.com` below with the chosen hostname.

## Create the named tunnel

Install `cloudflared`, then authenticate and create the tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create kiu-portal-preview
cloudflared tunnel route dns kiu-portal-preview preview.example.com
```

Keep the generated tunnel credentials outside this repository. Create a local
`~/.cloudflared/config.yml` using the tunnel UUID printed by `tunnel create`:

```yaml
tunnel: REPLACE_WITH_TUNNEL_UUID
credentials-file: /home/REPLACE_WITH_USER/.cloudflared/REPLACE_WITH_TUNNEL_UUID.json

ingress:
  - hostname: preview.example.com
    service: http://127.0.0.1:8876
  - service: http_status:404
```

The tunnel must target only `127.0.0.1:8876`. Do not point it at the platform
API port `48933`, and do not bind either local service to `0.0.0.0`.

## Optional Cloudflare Access

Cloudflare Access can add an outer email gate for browser-only staging, but the
Electron and Android anti-cheat clients use portal session tokens rather than a
Cloudflare Access browser session. A whole-host Access policy can therefore
block the anti-cheat launch page or API calls.

For a synchronized anti-cheat preview, either keep the hostname private and
use the portal's own login, or configure separate/path-specific Access rules
that leave the anti-cheat launch and API paths reachable. Test the Electron and
Android clients after every Access policy change; do not assume a browser
Access session is available to them.

The portal login remains required in every case.

## Start and stop the preview

Terminal 1, from the repository root:

```bash
KIU_PREVIEW_HOSTNAME=preview.example.com npm run start:preview
```

The launcher forces:

- frontend bind: `127.0.0.1:8876`
- backend bind: `127.0.0.1:48933`
- same-origin `/api` proxying through the frontend
- HTTPS public URL values matching the preview hostname
- Electron anti-cheat bridge enabled with the same public app, backend, and exam URLs

The desktop anti-cheat client runs on the tester's desktop. It is not served by
Cloudflare. For Android testing, build/install the Android client and give it
the same public app and backend URL values.

Terminal 2:

```bash
cloudflared tunnel run kiu-portal-preview
```

Open `https://preview.example.com`. To stop access, stop the tunnel and then
stop the local stack:

```bash
npm run stop:local
```

## Pre-share checks

Run these from the host before sharing the hostname:

```bash
curl --fail http://127.0.0.1:8876/health
curl --fail http://127.0.0.1:48933/health
curl --head http://127.0.0.1:8876/social.html
curl --head http://127.0.0.1:8876/backend/platform/.local-platform-state.json
curl --head http://127.0.0.1:8876/.env
```

The first three requests should succeed. The final two must return `404`.
Also confirm that both listeners are loopback-only:

```bash
ss -ltnp | grep -E ':(8876|48933)\b'
```

From a device on another network, verify the tunnel, portal login, Admin
account view switching, Student view, desktop anti-cheat launch, Android client
launch, one representative API mutation, an authenticated download, and live
notification/messenger updates. The app uses Server-Sent Events; Cloudflare
Quick Tunnels are not suitable because their documented testing service does
not support SSE.

If this preview is used beyond the short test window, move to the production
deployment requirements in [`.env.production.example`](../.env.production.example)
and [the production readiness check](../tools/check-production-readiness.js):
PostgreSQL, disabled local fallback, HTTPS origins, OAuth, VAPID, TURN, backups,
and operational monitoring are still required.
