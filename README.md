# KIU Portal Platform

Final-phase Learning Management System and university portal workspace for:

- LMS course delivery
- protected quiz launch and monitoring
- gradebook and registration workflows
- desktop and Android anti-cheat clients
- PostgreSQL-backed platform state

## Current architecture

- Frontend portal pages are served from the web app domain.
- Backend APIs run from `backend/platform/server.js`.
- Runtime application state is bootstrapped from `GET /api/bootstrap`.
- Persistent state is stored through PostgreSQL via `backend/platform/postgres-record-store.js`.
- Admin-only impersonation replaces the old preview-role flow.
- Anti-cheat source UI lives in `anti-cheat/src/ui`.

## Primary docs

- [DEPLOYMENT.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\DEPLOYMENT.md)
- [docs/FINAL_HANDOFF_ARCHITECTURE.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\docs\FINAL_HANDOFF_ARCHITECTURE.md)
- [docs/FINAL_CLEANUP_MIGRATION.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\docs\FINAL_CLEANUP_MIGRATION.md)
- [docs/ANTI_CHEAT_ANDROID_DESKTOP_ROLLOUT.md](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\docs\ANTI_CHEAT_ANDROID_DESKTOP_ROLLOUT.md)

## Environment

Use [.env.example](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\.env.example) as the deployment template.

Required production values include:

- `KIU_PUBLIC_APP_URL`
- `KIU_PUBLIC_BACKEND_URL`
- `KIU_EXTRA_CORS_ORIGINS` only when you intentionally trust additional frontend origins
- `KIU_DATABASE_URL`
- `KIU_ALLOWED_DOMAINS`
- admin bootstrap credentials
- anti-cheat download URLs or paths

## Local development

Main local commands:

```bash
npm run start:platform
npm run start:web
```

Known-good local contract:

- Frontend origin: `http://127.0.0.1:8876`
- Backend origin: `http://127.0.0.1:48933`
- If you use a different frontend origin, set `KIU_PUBLIC_APP_URL` to the main frontend origin and use `KIU_EXTRA_CORS_ORIGINS` only for any additional trusted development origins.

Startup verification:

```bash
python tools/local_dev_server.py 8876
node backend/platform/server.js
curl http://127.0.0.1:48933/health
curl -i -X OPTIONS http://127.0.0.1:48933/api/bootstrap -H "Origin: http://127.0.0.1:8876" -H "Access-Control-Request-Method: GET"
```

Expected responses:

- `GET /health` returns `200` with `{"ok":true,...}`
- `OPTIONS /api/bootstrap` from `http://127.0.0.1:8876` returns `204`

Validation:

```bash
npm run check:platform
npm run check:frontend
npm run test:runtime-shell
```

## Anti-cheat builds

- Desktop source: [anti-cheat/src](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\anti-cheat\src)
- Android source: [anti-cheat/android](C:\lms\good\lms%20-%20Copy%20-%20Copy%20%286%29%20-%20Copy%20-%20Copy%20-%20Copy\anti-cheat\android)
- Built artifacts under `anti-cheat/dist` and `anti-cheat/out` are release outputs, not source-of-truth files for editing.

## Handoff note

The legacy demo/test bootstrap path has been removed from normal runtime. The remaining compatibility DOM fallback blocks in several HTML pages are still intentionally present because shared shell scripts still query those controls directly.

Generated admin-tools standalone builds now belong under `artifacts/generated/admin-tools/` as non-source output only. Live routing should continue to use `admin-tools.html`.
