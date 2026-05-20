# Anti-Cheat Android And Desktop Rollout

This is the final-phase rollout guide for the protected quiz stack without iOS.

## Scope

- Desktop: Windows first, with optional Linux and macOS packages later
- Android: direct signed APK download
- iOS: intentionally excluded from this rollout

## Public domains

Use two public HTTPS domains:

- `https://lms.youruniversity.edu`
- `https://quiz-api.youruniversity.edu`

Set these in `.env`:

```env
KIU_PUBLIC_APP_URL=https://lms.youruniversity.edu
KIU_PUBLIC_BACKEND_URL=https://quiz-api.youruniversity.edu
KIU_PORTAL_LOGIN_URL=https://lms.youruniversity.edu/login.html
KIU_ANTI_CHEAT_APP_URL=https://lms.youruniversity.edu
KIU_ANTI_CHEAT_BACKEND_URL=https://quiz-api.youruniversity.edu
KIU_ALLOWED_DOMAINS=lms.youruniversity.edu,quiz-api.youruniversity.edu
```

## Published build URLs

Point the backend at public release files. Cheapest production pattern:

- upload binaries to object storage or CDN
- keep the API server small
- set release URLs in `.env`

Example:

```env
KIU_ANTI_CHEAT_WINDOWS_URL=https://downloads.youruniversity.edu/anti-cheat/windows/anti-cheat-setup.exe
KIU_ANTI_CHEAT_ANDROID_URL=https://downloads.youruniversity.edu/anti-cheat/android/anti-cheat.apk
```

If you want the backend to serve local files directly instead, use:

```env
KIU_ANTI_CHEAT_WINDOWS_PATH=/srv/anti-cheat/windows/anti-cheat-setup.exe
KIU_ANTI_CHEAT_ANDROID_PATH=/srv/anti-cheat/android/anti-cheat.apk
```

## Backend download routes

The backend now exposes:

- `/download`
- `/download/file`
- `/download/windows`
- `/download/windows/file`
- `/download/android`
- `/download/android/file`
- `/download/linux`
- `/download/linux/file`
- `/download/macos`
- `/download/macos/file`
- `/api/platform/downloads`

`/download` auto-selects platform from the request user agent and shows a smart install page.

## Desktop release checklist

1. Build the Electron desktop app:

```powershell
cd anti-cheat
npm run make
```

2. Publish the Windows installer `.exe`
3. Set `KIU_ANTI_CHEAT_WINDOWS_URL` or `KIU_ANTI_CHEAT_WINDOWS_PATH`
4. Restart the backend
5. Test:
   - `https://quiz-api.youruniversity.edu/download/windows`
   - protected quiz launch from LMS

## Android release checklist

1. Build a signed release APK from the Android project
2. Update [anti-cheat/android/app/src/main/assets/config.json](/C:/lms/good/lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy/anti-cheat/android/app/src/main/assets/config.json) with public LMS/backend URLs
3. Publish the `.apk`
4. Set `KIU_ANTI_CHEAT_ANDROID_URL` or `KIU_ANTI_CHEAT_ANDROID_PATH`
5. Restart the backend
6. Test:
   - `https://quiz-api.youruniversity.edu/download/android`
   - launch handoff from LMS on Android

## Student flow

1. Student logs in to LMS in a normal browser
2. Student opens a published protected quiz
3. LMS requests a protected launch ticket
4. LMS tries to open the anti-cheat app
5. If the app is missing, LMS sends the student to the correct install page
6. Student installs and opens the app
7. Student returns to LMS and clicks the quiz again
8. Anti-cheat app redeems the ticket and opens the protected quiz

## Staff flow

1. Professor or TA publishes a quiz
2. Students launch through anti-cheat only
3. Staff monitor live attempts in LMS Monitoring
4. Objective questions auto-grade
5. Written answers stay pending for manual review

## Lowest-cost production architecture

- static frontend on CDN
- one Linux VPS for API + PostgreSQL
- object storage/CDN for installers, APKs, and uploaded files
- HTTPS on both public domains

Do not start with:

- separate managed DB
- separate managed queue
- multi-server Kubernetes split

Start simple and add more only when real traffic requires it.
