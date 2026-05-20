# Quick Start

## Local platform startup

1. Install dependencies:

```bash
npm install
```

2. Start the backend:

```bash
npm run start:platform
```

3. Start the web frontend:

```bash
npm run start:web
```

4. Open the portal login page from the frontend host.

## Required local environment

Copy [.env.example](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\.env.example) to `.env` and set at least:

- `KIU_DATABASE_URL`
- `KIU_ADMIN_EMAIL`
- `KIU_ADMIN_PASSWORD`

## Validation

```bash
npm run check:platform
npm run check:frontend
```

## Anti-cheat testing

- Desktop source: [anti-cheat/src](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\anti-cheat\src)
- Android source: [anti-cheat/android](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\anti-cheat\android)

Use the production rollout docs and current anti-cheat packaging flow for desktop and Android testing.

## Deployment references

- [DEPLOYMENT.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\DEPLOYMENT.md)
- [docs/FINAL_HANDOFF_ARCHITECTURE.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\docs\FINAL_HANDOFF_ARCHITECTURE.md)
- [docs/ANTI_CHEAT_ANDROID_DESKTOP_ROLLOUT.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\docs\ANTI_CHEAT_ANDROID_DESKTOP_ROLLOUT.md)
