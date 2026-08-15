# Anti-cheat local dev on Linux (CachyOS)

Protected quizzes and exams open in the Electron anti-cheat browser, not in Firefox/Chromium.

## One-click start (recommended)

From `asd/`:

```bash
npm run start:local
```

Or run the script directly (opens LMS in your browser when ready):

```bash
./start-local-lms-anticheat.sh
```

**Desktop / file manager:** double-clicking `.sh` files may open them as text in KDE. Use one of these instead:

- **Start KIU Local** / **Stop KIU Local** from the app menu (after copying `kiu-start-local.desktop` and `kiu-stop-local.desktop` to `~/.local/share/applications/`)
- Right-click the `.sh` file → **Execute** (or **Run in Konsole**)
- Or run `npm run start:local` / `npm run stop:local` from a terminal

Use port `8888` instead of the default `8876`:

```bash
KIU_LOCAL_LMS_PORT=8888 ./start-local-lms-anticheat.sh
```

Stop everything:

```bash
npm run stop:local
```

## Open or stop only the anti-cheat browser

These commands manage the Electron anti-cheat browser without starting or stopping the LMS or backend:

```bash
npm run open:anti-cheat
npm run stop:anti-cheat
```

The same actions are available on Windows with `open-anti-cheat-browser.bat` and
`stop-anti-cheat-browser.bat`. For Linux desktop menus, copy
`kiu-open-anti-cheat-browser.desktop` and `kiu-stop-anti-cheat-browser.desktop`
to `~/.local/share/applications/` and update their `Exec=` and `Path=` lines if
the repository is in a different directory.

**Desktop shortcut (optional):** copy `kiu-local-lms-anticheat.desktop` to `~/.local/share/applications/`, edit the `Exec=` and `Path=` lines if your repo is not at `/home/reksi/2/asd`, then launch **KIU LMS + Anti-Cheat (Local)** from the app menu.

Logs: `.tmp/local-lms-anticheat/*.log` for the combined launcher, or
`.tmp/anti-cheat-browser/anticheat.log` for the standalone browser launcher.

The launcher starts all three local pieces together:

- platform backend
- web LMS
- Electron anti-cheat app

It is the canonical local development path. For live deployment, the same desktop app reads its URLs from environment variables instead of localhost defaults:

- `KIU_PUBLIC_APP_URL`
- `KIU_PUBLIC_BACKEND_URL`
- `KIU_ANTI_CHEAT_BRIDGE_PORT`
- `KIU_ENABLE_LOCAL_PROCTOR_DASHBOARD` for local-only proctor diagnostics

For same-Wi-Fi Android testing, the one-click launcher auto-binds the LMS/backend to your LAN interface and prints the phone URLs it detected. If your network picks the wrong address, set `KIU_LOCAL_LAN_IP=192.168.x.x` before starting. You can force loopback-only mode with `KIU_LOCAL_LAN_MODE=0`.

The launcher now opens [wifi-setup.html](../wifi-setup.html) first. That page shows the exact phone login, LMS, and Android install links and lets you copy them with one click.

The Android APK is expected at `anti-cheat/android/app/build/outputs/apk/release/app-release.apk` after `npm run build:android:apk`.

For the public Funnel demo, build and install the Linux desktop browser with:

```bash
KIU_PUBLIC_APP_URL=https://YOUR_FUNNEL_HOST npm run build:anti-cheat:desktop
npm run install:anti-cheat:desktop
```

This installs a launcher at `~/.local/share/applications/`. A browser cannot
silently install the app on another tester's computer; the tester must approve
the download/install once.

## Prerequisites

- Node.js 20+
- `curl` (for health checks)

## Manual startup (three terminals)

### 1. Platform backend (port 48933)

From `asd/`:

```bash
node backend/platform/server.js
```

Or use your existing local stack if it already exposes the API on `http://127.0.0.1:48933`.

When deploying for real users, set the public URLs to your hosted LMS and backend before launching the desktop app.

### 2. Web app (port 8876)

From `asd/`:

```bash
npm run start:web
```

Open LMS at [http://127.0.0.1:8876/lms.html](http://127.0.0.1:8876/lms.html).

### 3. Anti-cheat desktop app (bridge port 47835)

From `asd/anti-cheat/`:

```bash
npm install
npm run start
```

Verify the bridge is up:

```bash
curl -s http://127.0.0.1:47835/health
```

Expected: JSON with `"ok": true`.

## Launch a protected quiz

1. Sign in as a student (or admin View-as student) in the regular browser.
2. Open a course group → **Quiz** → choose a published protected quiz.
3. Click **Open Anti-Cheat Browser** (allow the popup if prompted).
4. The popup requests a launch ticket and POSTs to `localhost:47835/launch`.
5. The Electron window redeems the ticket and loads the quiz session.

## Launch an exam

1. Open [http://127.0.0.1:8876/exam-portal.html](http://127.0.0.1:8876/exam-portal.html).
2. Start a scheduled session — the portal hands off to the same desktop bridge.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Popup blocked | Allow popups for `127.0.0.1:8876` |
| Bridge not found | Ensure `npm run start` is running in `anti-cheat/` |
| `Permission denied` on `electron-forge` or `electron.exe` | Run `node scripts/ensure-electron-platform.js` in `anti-cheat/` (installs the Linux Electron binary) |
| App window does not appear | Check `DISPLAY` is set (`echo $DISPLAY`); from a desktop session use the one-click launcher |
| Ticket / auth errors | Sign in again in the regular browser; backend must be on `:48933` |
| `anticheat://` does nothing in dev | Normal — dev uses the HTTP bridge on port **47835**, not the system protocol handler |

If the one-click script fails, check `.tmp/local-lms-anticheat/anticheat.log`. Manual recovery:

```bash
cd asd/anti-cheat
npm run build
node scripts/ensure-electron-platform.js
npm run start
```

## Build only (no run)

```bash
cd asd/anti-cheat
npm run build
```

Packaged Linux artifacts (optional): `npm run make` (produces `.deb` / `.rpm` / zip under `out/make/`).
