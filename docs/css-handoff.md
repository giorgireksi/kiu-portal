# CSS handoff (Day-1)

**Open this first for styles.** Live design/stack detail: [`visual-ssot.md`](visual-ssot.md). Panels token contract: [`shell-panels.md`](shell-panels.md) (tokens only — ignore retired route-skin names). Archive map: [`active-vs-archive.md`](active-vs-archive.md).

## Day-1 open order

1. This file → cheat table below  
2. [`visual-ssot.md`](visual-ssot.md) — stacks + body classes  
3. [`css-js-coupling.md`](css-js-coupling.md) / `tools/css-route-manifest.json` — which page loads what  
4. [`findability-index.md`](findability-index.md) — `css.*` rows (human map; JS machine SSOT is separate)  
5. File `/* READABILITY:` header + `§` markers inside the CSS you need  

## Shared vs index vs auth

| Surface | Eager CSS |
|---------|-----------|
| **Bare portals** | fonts → tokens → focus-panel → controls → shell → **FOUC** → bare-lite → mobile-shell-core (+ modals on hub pages) |
| **Dashboard** (`index.html`) | shared + `lux-fouc-ht` + `index-home-{layout,widgets,role}` (+ lazy editor; conditional `mobile-shell.css`) |
| **Auth / redirect** | thin — see visual-ssot |

## Where to edit (cheat sheet)

| Change | File | Section |
|--------|------|---------|
| Panel / soft-chrome glass | `lux-tokens.css` | §3 paint |
| Button / CTA sheen | `lux-controls.css` | §2 paint (overrides §1) |
| Topbar / sidebar chrome | `lux-shell.css` | §3 paint |
| Mobile drawer / bottom nav | `mobile-shell-core.css` | §2–§3 |
| Hub modal warmglass | `lux-modals.css` | READABILITY header |
| Messenger / notif / call | `layout-portal.css` | lazy — `ensureLayoutPortalCss()` |
| Droplist | `lux-droplist.css` | lazy — `ensureLuxDroplistCss()` |
| FOUC / HT / atmosphere | `lux-fouc-ht.css` | shared on all `lux-full-paint` portals |
| Home widgets | `index-home-*.css` | index only |

## Header dialect

- Kernel sheets: `/* READABILITY: … */` + `/* ── § name ── */`  
- Home sheets: keep `SECTIONS:` in the header (CI) **and** use `/* --- name --- */` or `§` markers in body  
- **Do not rename** locked paint markers in tokens/controls/shell without updating `phase-a-css-stack-guard` / `bare-css-budget` / `index-luxury-size-budget`

## Do not link / restore

`index-luxury.css`, `lux-page-bare.css` (nuclear), `lux-shell-nav`, `*-route.css` glass skins, `index-home-dashboard.css` megafile — see [`active-vs-archive.md`](active-vs-archive.md).

## Lazy injectors

| Sheet | Injected by |
|-------|-------------|
| `layout-portal.css` | `messenger.js` → `ensureLayoutPortalCss` |
| `lux-droplist.css` | shell chrome → `ensureLuxDroplistCss` |
| `index-home-editor.css` | home dashboard chunk |
| `mobile-shell.css` | index, ≤1024 |

## Gates

`npm run check:panels` · `check:dashboard-css` · `check:cssjs` · `check:architecture` · live CSS line budget in `test/bare-css-budget.test.js` (≤6500)

## Samples

- Bare: `students-admin.html`  
- Dashboard: `index.html`  
