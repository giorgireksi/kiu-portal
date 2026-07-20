# Day-1 onboarding (Wave H10)

**Audience:** university IT / mid-level hires who did not write this portal.  
**Agents / continuing refactors:** prefer [`CURSOR-HANDOFF.md`](CURSOR-HANDOFF.md) after this page.

## What this is

A **multi-page campus portal** — root `*.html` pages, classic `assets/js/**` scripts, shared lux CSS, and a Node `backend/platform` API. It is **not** a SPA framework app.

## Boot (web-first)

Requires **Node ≥ 20**. From the repo root:

```bash
npm run start:local:web
```

That starts the local web stack without anti-cheat extras. Equivalent lighter web-only: `npm run start:web` (port **8876**). Full `npm run start:local` / `npm start` also brings anti-cheat pieces — skip those on day 1 unless you need them.

Open the site in a browser (typically `http://127.0.0.1:8876/` or the port your launcher prints).

## Smoke path

1. **Login** (`login.html`)  
2. **Home dashboard** (`index.html`)  
3. One **LMS** surface (`lms.html`)  
4. One **admin** surface (e.g. `admin-tools.html`)

Demo account passwords are **not** checked into this repo. Use your local seed / env, or ask the owner. Session API lives under the auth seam (`/api/portal/session` — see [fe-backend-seams.md](fe-backend-seams.md)).

## Architecture (one paragraph)

Each route is an HTML file that loads the **shared lux CSS stack** plus any dedicated sheets, then page JS. Find the feature’s **owners** (≤2 files), keep peels as support, and call the backend through documented `/api/…` prefixes — not by inventing new cross-domain writes.

## Day-1 reading list (indexes only)

Read in order. These are product wiring maps, not wave changelogs.

1. [css-handoff.md](css-handoff.md) — **CSS** Day-1 (where to edit glass / shell / home)  
2. [findability-index.md](findability-index.md) — feature → owners → HTML  
3. [dependency-index.md](dependency-index.md) — what loads before X  
3. [js-naming-patterns.md](js-naming-patterns.md) — globals: patterns A / B / C only  
4. [js-change-locality.md](js-change-locality.md) — keep edits in ≤2 owners  
5. [js-safe-edit-surface.md](js-safe-edit-surface.md) — danger hubs vs domain-local  
6. [css-js-coupling.md](css-js-coupling.md) — route → CSS stack  
7. [fe-backend-seams.md](fe-backend-seams.md) — feature → API / domain / routes  
8. [test-as-map.md](test-as-map.md) — which tests lock invariants  

Scorecard / wave status (later): [human-maintainability.md](human-maintainability.md).

## First safe edit

1. Open **findability** → pick the feature → note **owners** only.  
2. Open **safe edit surface** — if the path is **danger**, stop and prefer a domain-local owner or dedicated CSS.  
3. Edit ≤2 owners; leave peels as `support` unless that peel is the bug.  
4. Run the relevant gate, e.g. `npm run check:findability`, `npm run check:safeedit`, `npm run check:locality`, or the domain’s contract test from the test map.

## How to check this wave

```bash
npm run check:onboarding
```
