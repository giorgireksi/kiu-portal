# Remote website + Android anti-cheat demo

This runbook is for a short university demonstration. It uses the local
staging stack, a public HTTPS Funnel URL, and a managed TURN service. Test
accounts and test course data only; do not expose real student records.

## 1. Start the local stack

Keep the staging backend, PostgreSQL, and frontend proxy running:

```bash
npm run start:staging
npm run start:staging:web
```

Publish the frontend proxy with Tailscale Funnel:

```bash
sudo tailscale funnel --bg 8877
sudo tailscale funnel status
```

Copy the HTTPS URL shown by Funnel, for example
`https://demo-machine.example-tailnet.ts.net`. Anyone with that URL can open
the website; testers do not need the Tailscale app.

Update `.env.staging` so every generated link uses the public origin:

```dotenv
KIU_PUBLIC_APP_URL=https://demo-machine.example-tailnet.ts.net
KIU_PUBLIC_BACKEND_URL=https://demo-machine.example-tailnet.ts.net
KIU_PORTAL_LOGIN_URL=https://demo-machine.example-tailnet.ts.net/login.html
KIU_EXTRA_CORS_ORIGINS=https://demo-machine.example-tailnet.ts.net
```

Apply the change:

```bash
docker compose -f docker-compose.staging.yml up -d staging-backend
```

## 2. Configure calls

Create a free OpenRelay account and copy its TURN URLs, username, and
credential into `.env.staging`:

<https://www.metered.ca/tools/openrelay/>

Set `KIU_TURN_URLS`, `KIU_TURN_USERNAME`, and `KIU_TURN_CREDENTIAL`, then
restart `staging-backend`. OpenRelay is only for this demonstration; its free
relay quota is not a university production guarantee.

## 3. Build the Android APK for the public URL

The Android source defaults to localhost. Build with public URL overrides:

```bash
export PUBLIC_URL=https://demo-machine.example-tailnet.ts.net
KIU_ANTI_CHEAT_APP_URL="$PUBLIC_URL" \
KIU_ANTI_CHEAT_BACKEND_URL="$PUBLIC_URL" \
KIU_ANTI_CHEAT_QUIZ_URL="$PUBLIC_URL/lms.html" \
KIU_ANTI_CHEAT_EXAM_PORTAL_URL="$PUBLIC_URL/exam-portal.html" \
  npm run build:android:apk
```

The build script temporarily writes the public Android config into the APK
build input and restores the local source config afterward. Install
`anti-cheat/android/app/build/outputs/apk/release/app-release.apk` on the
Android demonstration device. Android may require enabling installation from
the transfer source. A debug-signed release is sufficient for a private demo;
use a university release keystore before distributing it to students.

## 4. Demonstration sequence

Create separate test accounts for the presenter, student, and second student.

1. Open the public website on a laptop and Android phone using different
   networks.
2. Sign in as the student on the website.
3. Open a published protected quiz or scheduled exam.
4. Choose **Open Anti-Cheat Browser**.
5. Show that the Android app receives the `anticheat://` handoff.
6. Sign in inside the Android anti-cheat app.
7. Start the protected exam and show the launch-ticket/session flow.
8. Attempt to navigate to an unapproved external domain and show the
   anti-cheat navigation block.
9. Open the same course with a second account and demonstrate that sessions
   and account data remain separate.
10. Start a call from two devices and grant microphone/camera permissions.
11. Trigger a notification and show it arriving through the live portal
    connection.

Run the automated account check before the presentation:

```bash
KIU_MULTI_ACCOUNT_BASE_URL=https://demo-machine.example-tailnet.ts.net \
KIU_ADMIN_EMAIL=admin@staging.local \
KIU_ADMIN_PASSWORD='StagingAdmin-2026!' \
KIU_MULTI_ACCOUNT_COUNT=20 \
KIU_MULTI_ACCOUNT_CLEANUP=YES \
  npm run smoke:accounts
```

## Important limitations

- The laptop must remain powered on and connected while Funnel is running.
- The Funnel URL is public; authentication still remains required.
- The Android APK must be rebuilt whenever the public hostname changes.
- Tailscale Funnel and OpenRelay make this a test demonstration, not a
  production university deployment.
