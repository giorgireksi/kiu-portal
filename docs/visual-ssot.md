# Visual SSOT (clean redesign baseline)

## Aim

1. **Shared portal paint** — shell chrome, control sheen, panel tokens, focus structure on every portal page.
2. **Index-only** — home widgets, FOUC atmosphere, mobile polish.
3. Auth / redirects stay thin.

## Live design

| Surface | Status |
|---------|--------|
| **Dashboard** (`index.html`) | shared paint + `lux-fouc-ht` + `index-home-layout` / `widgets` / `role` + mobile polish |
| **Bare portal pages** (22) | shared paint + **`lux-fouc-ht`** + layout-only `lux-page-bare-lite` + `lux-full-paint` |
| **Auth** | login / protected-launch: tokens + **surfaces** + controls + route CSS (no focus-panel) |
| **Redirect aliases** | tokens + controls + `redirect-route` only (no surfaces / focus-panel) |

## Shared portal stack

```
kiu-fonts → lux-tokens.css (incl. shared paint)
→ lux-focus-panel → lux-controls.css (incl. shared paint)
→ lux-shell.css (incl. shared paint)
→ lux-fouc-ht.css (atmosphere + FOUC/HT + utility panels — shared on full-paint portals)
→ lux-page-bare-lite.css (layout helpers only — no nuclear flatten)
→ mobile-shell-core.css
```

Lazy: droplist, modals (where needed), layout-portal (messenger), lux-mobile-action-sheet, studio.

| Change this | Edit this file | Notes |
|-------------|----------------|-------|
| Panel / soft-chrome glass | `lux-tokens.css` (§3 paint) | `--lux-panel-*`, `--lux-soft-chrome-*` (aliases on `body.lux-full-paint`) |
| Button / CTA sheen | `lux-controls.css` (§2 paint) | Paint overrides §1 structure |
| Topbar / sidebar chrome | `lux-shell.css` (§3 paint) | Soft-chrome topbar SSOT |
| Page haze / FOUC / utility popovers | `lux-fouc-ht.css` | Shared on all `lux-full-paint` portals |
| Mobile drawer / bottom nav | `mobile-shell-core.css` | Eager on all portals; polish = `mobile-shell.css` (index) |
| Hub modal warmglass | `lux-modals.css` | Linked on bare hubs with modals |
| Messenger / notif / call UI | `layout-portal.css` | **Not** in HTML — `messenger.js` → `ensureLayoutPortalCss()` |
| Droplist paint | `lux-droplist.css` | Lazy — `ensureLuxDroplistCss()` in shell chrome |
| Home widgets | `index-home-*.css` | Index only |

**Samples:** bare stack = `students-admin.html` (FOUC + modals + bare-lite, no layout-portal link); dashboard = `index.html` (FOUC + index-home-*).

Architecture classification (`tools/visual-route-classification.js`) treats `lux-shell` / `mobile-shell-core` / `lux-fouc-ht` as **shared**, not dedicated route CSS. Bare-lite stays zero-budget for shared-shell-chrome / surface / action selectors (those live in `lux-shell.css`). Timetable also owns dedicated `layout-schedule-board.css` (Wave 22). `npm run check:architecture` is daily-green against this stack.

## Index-only extras

```
→ index-home-layout.css
→ index-home-widgets.css
→ index-home-role.css
→ mobile-shell.css (conditional inject ≤1024)
```

Lazy: home-editor.

**Dashboard CSS A+ (2026-07-20):** three index-only sheets ≤400 lines each (eager layout+widgets+role ≤950; bucket with FOUC+editor ≤1500); nested under `#page-home #lux-home-shell`; dead student/courses CSS removed; glass via panel/soft-chrome tokens (`--lux-panel-blur-filter`); no `lms-hero-v2` in home CSS; gate `npm run check:dashboard-css`.

## Body classes

| Surface | Classes |
|---------|---------|
| Dashboard | `lux-unified-shell lux-route-home lux-full-paint` |
| Bare portal | `kiu-shell-loading lux-nonhome-page lux-route-* lux-unified-shell lux-page-bare lux-full-paint` |

## Retired / archived

See **[`active-vs-archive.md`](active-vs-archive.md)** for the mid-hire map. Summary:

| Old | Status |
|-----|--------|
| `lux-shell-nav` + `lux-shell-full-paint` / `lux-*-paint.css` | Merged into `lux-tokens` / `lux-controls` / `lux-shell` |
| `index-luxury.css` megafile | Split → fouc-ht + home-dashboard; file deleted |
| Nuclear bare flatten | Removed from `lux-page-bare-lite` (layout helpers remain) |
| LMS/TT route skins | **Purged** — do not reintroduce (see `RETIRED_LMS_ROUTE_CSS`) |
| Paint-merge / dashboard-only / phase-a buckets | **Purged** with `_archive/` tree |

## Paint `!important`

Catalog ceiling **≤ 120** (`phase-a-css-stack-guard`). Shared paint budget for bare portals **≤ 3400** canonical lines (`bare-css-budget`). Live `assets/css` (ex-`_archive`) **≤ 9000** lines: nested readable chrome (`lux-shell` / `layout-portal`); complex rules stay multi-line. Day-1 map: [`css-handoff.md`](css-handoff.md).

**Do not** link: `index-luxury.css`, `base.css`, full `lux-page-bare.css`, `mobile-responsive.css`, `layout.css`, or any purged retired route skins (see [`active-vs-archive.md`](active-vs-archive.md)).

## Phase B/C (later)

Optional: merge `lux-focus-panel` into shell if desired. FOUC atmosphere is already shared on full-paint portals.

## Test hygiene (bare-shell era)

- **Warmglass / modal paint SSOT:** [`lux-modals.css`](../assets/css/lux-modals.css) + [`lux-tokens.css`](../assets/css/lux-tokens.css) — not per-route `*-route.css` sheets.
- **Helper:** [`test/helpers/bare-shell-css.js`](../test/helpers/bare-shell-css.js) — `readWarmglassCss()`, `readDroplistCss()`, `expectRetiredCss()`, `RETIRED_ROUTE_CSS`.
- **No route paint:** `student-service` and `exams` have no dedicated route sheets; they use shared paint + bare-lite layout.
- **Redirect / auth diet:** alias redirects = `lux-tokens` + `lux-controls` + `redirect-route` only; `lux-surfaces` = login + protected-launch only.
- **Shared paint:** all portal pages link tokens-dashboard / focus / controls-paint / shell-paint; FOUC + home dashboard remain index-only.
