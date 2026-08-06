# University self-hosting

This package is designed for one university-owned Linux host (or VM) running
Docker Compose. The university owns the DNS name, PostgreSQL data, uploads,
OAuth application, push keys, and TURN service. The portal and API use one
public HTTPS origin so browser sessions, SSE notifications, downloads, and
anti-cheat clients share the same URL.

## Production architecture

```text
Internet
  ├── https://lms.example.edu ── Caddy ── portal-backend:47833
  ├── turn.example.edu:3478/5349 ── coturn ── WebRTC relay ports
  └── Admin/Student anti-cheat clients ── same HTTPS portal/API origin

portal-backend ── PostgreSQL
               └─ portal_uploads volume
```

Redis and MinIO are not required by the current production runtime. The
platform is a single-writer service backed by PostgreSQL and a local persistent
uploads volume. Do not expose PostgreSQL or port `47833` to the internet.

## Prerequisites

- Linux host with Docker Engine and the Compose plugin.
- DNS `A`/`AAAA` record for the portal hostname.
- Public TCP ports `80` and `443` for Caddy.
- A public DNS name and reachable IP for TURN. Open UDP/TCP `3478`, TCP
  `5349`, and the relay range `49160-49200` as UDP/TCP where required by the
  network policy.
- A certificate and private key for the TURN hostname. The certificate must
  include the TURN DNS name; the Compose file mounts the host paths from
  `KIU_TURN_CERT_HOST_PATH` and `KIU_TURN_KEY_HOST_PATH`.
- Microsoft Entra application if Microsoft sign-in or mail is enabled.
- An SMTP/web-push operational owner. Browser push uses VAPID keys; mail uses
  Microsoft Graph in the current integration.
- A Firebase project with an Android app whose package name is
  `com.anticheat.browser`, plus a Firebase service-account JSON file kept
  outside the repository. Set `KIU_FIREBASE_PROJECT_ID` and
  `KIU_FIREBASE_SERVICE_ACCOUNT_HOST_PATH` so native Android notifications can
  be delivered while the anti-cheat app is backgrounded or closed.
- A backup destination outside the host.

## First installation

Run these commands from the repository release directory:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production` before starting. At minimum replace every
`replace-with-*` value and set:

```dotenv
KIU_PUBLIC_HOSTNAME=lms.example.edu
KIU_PUBLIC_APP_URL=https://lms.example.edu
KIU_PUBLIC_BACKEND_URL=https://lms.example.edu
KIU_DATABASE_URL=postgres://kiu:URL_ENCODED_PASSWORD@postgres:5432/kiu_portal
POSTGRES_PASSWORD=THE_SAME_DATABASE_PASSWORD
KIU_ADMIN_EMAIL=admin@example.edu
KIU_ADMIN_PASSWORD=A_LONG_UNIQUE_PASSWORD
```

Use a URL-safe database password (for example, a 64-character hexadecimal
value) so the PostgreSQL URL does not need additional escaping:

```bash
openssl rand -hex 32
```

Generate browser push keys and copy the two output lines into the environment
file:

```bash
npm ci
npm run generate:vapid
```

Set the Microsoft redirect URI to:

```text
https://lms.example.edu/api/portal/microsoft/callback
```

Set `KIU_MICROSOFT_MAIL_REDIRECT_URI` to the corresponding mail callback when
mail integration is enabled. Set `KIU_TURN_URLS`, `KIU_TURN_USERNAME`,
`KIU_TURN_CREDENTIAL`, `KIU_TURN_REALM`, `KIU_TURN_SERVER_NAME`, and
`KIU_TURN_EXTERNAL_IP` to match the coturn host and firewall. Set the two TURN
certificate host paths to readable files on the Docker host. The TLS TURN
listener will not start without them.

Validate the release and environment, then start the stack:

```bash
set -a
. ./.env.production
set +a
npm run check:production:stack
npm run check:production
docker compose --env-file .env.production -f docker-compose.production.yml config
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

The backend applies PostgreSQL migrations before it accepts traffic. Verify
the public endpoint:

```bash
npm run smoke:production -- https://lms.example.edu
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 portal-backend
```

The readiness endpoint intentionally fails until HTTPS, PostgreSQL, TURN,
Microsoft mail, and VAPID configuration are complete.

## Local production rehearsal

Before using a public hostname, the repository includes a disposable
PostgreSQL-backed staging profile. It exercises the container image, migrations,
persistent database/uploads volumes, frontend proxy, password login, account
isolation, concurrent requests, and SSE streams without exposing the host:

```bash
npm run start:staging
npm run start:staging:web
```

To exercise native Android push in staging, add these values to the local
`.env.staging` file before starting the backend:

```bash
KIU_FIREBASE_PROJECT_ID=your-firebase-project-id
KIU_FIREBASE_SERVICE_ACCOUNT_HOST_PATH=/home/you/.config/kiu/firebase-service-account.json
```

The staging Compose profile mounts that host file read-only. Do not copy the
service-account JSON into the repository.

In another terminal:

```bash
KIU_MULTI_ACCOUNT_COUNT=20 \
KIU_MULTI_ACCOUNT_CLEANUP=YES \
  npm run smoke:accounts
```

Open `http://127.0.0.1:8900/login.html` for the browser rehearsal. Stop the
containers when finished:

```bash
npm run stop:staging
```

This local profile deliberately does not claim production readiness: it has no
public HTTPS certificate, Microsoft OAuth, or TURN service.

## Anti-cheat clients

The desktop and Android anti-cheat clients are installed on student devices;
they are not served by the Caddy container. Give each client the same
`KIU_PUBLIC_APP_URL` and `KIU_PUBLIC_BACKEND_URL` as the portal. Publish their
download URLs through the corresponding `KIU_ANTI_CHEAT_*_URL` values.

Test each supported client after every hostname or proxy change:

1. Sign in through the portal.
2. Open the protected exam launch flow.
3. Confirm the installed client receives the launch hand-off.
4. Start a representative protected exam and verify the heartbeat.
5. Confirm an authenticated download works from a separate network.

Do not put a browser-only access gateway in front of the anti-cheat paths
unless the client protocol and authenticated API requests have been tested
with that gateway.

## Notifications, calls, and uploads

- Notifications and messenger live updates use authenticated Server-Sent
  Events through the same Caddy origin.
- Browser push requires the VAPID public/private keys and a valid contact
  address.
- The Android anti-cheat app uses Firebase Cloud Messaging. Its FCM token is
  bound to the signed-in LMS account, and notification taps open the LMS route
  inside the app. Keep the Firebase service-account JSON readable only by the
  deployment operator; never put it in the APK or commit it.
- Calls require a reachable coturn service and matching TURN credentials.
  The web server's HTTPS certificate does not replace TURN.
- Upload metadata is stored in PostgreSQL and file bytes are stored in the
  `portal_uploads` Docker volume. Back up both.

## Backups and recovery

Create a backup directory containing a PostgreSQL custom dump and uploads
archive:

```bash
npm run ops:backup -- /srv/backups/kiu
```

Keep backups on a different disk or storage system. Test one restore before
opening the system to students. A restore stops the portal writers and replaces
the target database/uploads:

```bash
KIU_CONFIRM_PRODUCTION_RESTORE=YES \
  npm run ops:restore -- /srv/backups/kiu/kiu-production-YYYYMMDDTHHMMSSZ
```

After recovery, run `npm run smoke:production -- https://lms.example.edu`,
sign in as a test account, verify one upload/download, and test one live
notification and one call.

## Upgrades

1. Announce a maintenance window and stop new exam sessions.
2. Create and verify a backup.
3. Deploy the tested release directory.
4. Run `check:production:stack` and `check:production`.
5. Rebuild and start the stack; migrations run under the single backend writer.
6. Run the production smoke checks and the client regression checklist.
7. Keep the previous release available for rollback, but restore data only from
   a deliberate backup; do not run two writers against the same state.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

## Security and operations checklist

- Keep `.env.production` outside version control with mode `600`.
- Use unique, rotated admin, database, TURN, OAuth, and token-encryption
  secrets.
- Restrict `5432`, `47833`, coturn management, and Docker access to the host
  administrator/network.
- Keep Caddy and base images updated and review image digests for controlled
  releases.
- Monitor Caddy, backend, PostgreSQL, coturn, disk space, uploads volume, and
  backup age.
- Schedule backups and perform periodic restore drills.
- Use the portal's own authentication; Cloudflare Access or another outer
  gateway is optional and must not break anti-cheat, SSE, downloads, or OAuth.
