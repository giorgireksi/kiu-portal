# Shell / panels contract

> **2026-07 hard-clean:** Live polished UI = **dashboard only**. LMS/timetable route skins archived under `assets/css/_archive/2026-07-strip-non-dashboard/`. Non-dashboard pages use shared kernel + `lux-page-bare`. See `docs/visual-ssot.md`.


**Aim:** Every portal page — including **LMS** — shares the **same panel glass**. Redesigns should be **few known edit points**, not a hunt across 20 CSS files.

## Can I change everything with one edit?

| What you want to change | One edit? | Where |
|-------------------------|-----------|--------|
| **Panel / card glass** (fill, border, blur, elev, control chips) on timetable, LMS, social, staff, admin, … | **Yes** (dark + light = 2 blocks in one file) | `assets/css/lux-tokens.css` → `--lux-panel-*`, `--lux-elev-*` |
| **Page background** (shell color behind glass) | **Mostly** (palette map in same file) | `--lux-shell-background` / `body.palette-*` |
| **Home dashboard widgets** | **Yes** (soft-chrome / focus-panel) | `--lux-soft-chrome-*` / `--lux-focus-*` (home may still set `--home-fade-*` aliases) |
| **Accent / faculty colors** | Related knobs | `--lux-accent-rgb`, palette tokens |
| **Layout** (widths, grids, spacing) | **No** — stays per-route CSS | `*-route.css` layout only |
| **One-off button shadows** | **No** until elev migration | per-component; `check:panels` blocks new snowflakes |
| **Typography sizes / copy** | **No** | content + type rules |

So: **shell/panel glass across portal = simple.** “The whole product UI with one keystroke” = **not** realistic (layout ≠ material). It **is** much simpler than before.

## Blueprint

| Role | Source |
|------|--------|
| Visual + architecture reference | `timetable.html` + `assets/css/timetable-route.css` |
| Look single source of truth | `assets/css/lux-tokens.css` → `--lux-panel-*`, `--lux-elev-*` |
| Shared primitives | `.lux-panel-pro`, `.lux-focus-panel`, `.lux-soft-chrome` |

**In scope:** all non-auth portal routes (timetable, LMS, social, staff, news, admin-*, gradebook, …).  
**Exception:** home dashboard (`--home-fade-*`). Auth shells later.


## Token map (change look once)

| Want | Edit in `lux-tokens.css` |
|------|--------------------------|
| Panel glass fill | `--lux-panel-surface`, `-soft` |
| HT flat fill | `--lux-panel-ht-surface` |
| Border / blur / elev | `--lux-panel-border*`, `-blur-filter`, `--lux-elev-*` |
| Control chips | `--lux-panel-control`, `-control-soft` |
| Primary button | `--lux-panel-cta-primary`, `-cta-mix`, `-cta-accent` |
| Success / danger / warn btn | `--lux-panel-cta-success`, `-danger`, `-danger-strong`, `-warn` |
| Status pills | `--lux-panel-status-*` |
| Badges / selected / open-locked | `--lux-panel-badge-*`, `-state-open`, `-state-locked` |
| Brand modal head | `--lux-panel-brand-head` |
| Sheen / accent rail | `--lux-panel-sheen`, `-accent-rail` |
| Raised glass / topbar raised | `--lux-panel-raised-fill`, `--lux-shell-topbar-raised` |
| Soft white washes / light footers | `--lux-panel-soft-wash*`, `-footer-fade-light` |
| Color CTAs (amber/violet/cyan/orange/rose) | `--lux-panel-cta-amber` … `-rose` |
| Legacy blue / indigo | `--lux-panel-legacy-blue*`, `-legacy-indigo` |
| CTA bar / icon / control-glow | `--lux-panel-cta-bar`, `-icon-accent`, `-control-glow` |
| Modal head/foot/section | `--lux-panel-modal-*` |
| Danger surfaces (alerts) | `--lux-panel-danger-surface`, `-danger-surface-light` |
| Accent controls (pickers) | `--lux-panel-accent-control`, `-hover`, `-light` |
| Admin tool card washes | `--lux-panel-tool-wash*`, `-tool-glass` |
| Status amber / success soft | `--lux-panel-status-amber*`, `-status-success-soft` |
| Social CTA | `--lux-panel-social-cta`, `-social-cta-soft` |
| Sticky veils | `--lux-panel-veil-dark`, `-veil-light` |
| Light page shell ambient | `--lux-panel-shell-light` (via `--lux-shell-background`) |
| Sidebar chrome | `--lux-shell-sidebar-surface` → panel |
| Topbar chrome | `--lux-shell-topbar-surface` → panel soft |
| Blur | `--lux-panel-blur-filter` / `--lux-transparency-blur` |
| Page background | `--lux-shell-background` + palette blocks |
| Accent hue | `--lux-accent-rgb` / palette |

Light mode: same names in the light block. Routes only **alias** `--*-fade-*` → these tokens.

## How to redesign panel glass

1. Open `assets/css/lux-tokens.css`.
2. Edit **dark** panel block: `--lux-panel-surface`, `-soft`, `-control`, `-glow-ring`, borders, blur, `--lux-elev-1/2/3`.
3. Edit **light** panel overrides in the light-mode block (same names).
4. High-transparency flat fill (≥80%): `--lux-panel-ht-surface` (dark + light) — used by `index-luxury` HT overrides only.
4b. Shared CTAs / soft controls: `--lux-panel-cta-primary`, `-cta-accent`, `-cta-mix`, `-cta-success/danger/warn`, `-control-soft`, `-tab-active`, modal head/foot tints.
4c. Status pill fills: `--lux-panel-status-info|success|warn|danger`.
4d. Page shell color: `--lux-shell-background` / `body.palette-*` (avoid per-route cream hex).
5. Hard-refresh (cache-bust `lux-tokens.css?v=` / `utilities.js?v=` if needed).
6. Spot-check timetable + LMS + one admin route, dark and light (+ HT slider).

Do **not** invent new `--xx-fade-*` gradient values. Routes alias into panel tokens.

## CSS ownership (timetable model)

JS strips inline glass on owned routes (`shouldKeepRouteFadeCssBackground` in `utilities.js`). Residual paint uses only `var(--lux-panel-surface*)`.

Owned: LMS · staff · students-admin · news · study-card · programs · chancellery · student-service · orders · library · admin-library · exams · exam portal · admin-tools · admin-orders · scheduler · social · faculty-gradebook · profile · profile-view · personal-data · registration · timetable  

## Rules

| Do | Don’t |
|----|--------|
| Edit panel tokens for glass | New raw multi-stop glass in route CSS |
| Route CSS = layout | New `--social-fade-surface: <literal>` |
| CSS-own strip / panel vars in JS | New multi-radial paint recipes in JS |
| One blur host; soft chrome flat | Nested blur on chips/rows |
| `npm run check:panels` | Raise snowflake baseline |

## Status

| Area | State |
|------|--------|
| Panel token SSOT | **Done** — redesign glass from `lux-tokens.css` |
| Route fade → panel aliases | **Done** |
| CSS-own strip | **Done** (non-home) |
| Residual JS → panel tokens | **Done** |
| P0 panel-recipe copies | **0** (see audit) |
| Shell/card glass migration (P1) | **0** |
| P2 decorative residual | Expected — not a glass SSOT gap; see Freeze |
| Parallel glass dialects | **Collapsed** (LMS glass-fill/pro, warmglass, create modals, aorders modal, staff page) |
| Shell chrome (sidebar/topbar/blur) | **Phase C** — panel tokens + responsive blur knobs |
| `check:panels` in `npm run check` | **Done** (snowflakes + fade→panel alias guard) |
| Home full unify | Optional exception (`--home-fade-*` / P3) |
| `.lux-panel-pro` on all markup | Optional when touching pages |
| Elev snowflake migration | Gradual (ratchet baseline down only) |
| Fail CI on raw gradient count | **No** — audit is evidence only |

### Residual (do not re-open as “panel broken”)

| Severity | Meaning | Policy |
|----------|---------|--------|
| **P0** | Full panel recipe still hardcoded | Keep at **0**; fix immediately if it reappears |
| **P1** | Shell/hero/card-like + often `!important` | **0** — keep at zero; any new P1 is a regression |
| **P2** | Decorative / partial gradients | ~600 left (mostly unique one-offs: social brand, calendar markers, home glows); optional when editing a file |
| **P3** | Home dashboard | Permanent exception unless product unifies home |

### Smoke checklist (after token or panel CSS edits)

1. Timetable · LMS · student-service · one admin modal  
2. Dark + light + high transparency (≥80%)  
3. Primary buttons still accent (CTA tokens)  
4. `npm run check:panels` green  

## Guards

```bash
npm run check:panels
# → tools/check-panel-snowflakes.js   (raw box-shadow / backdrop-filter ratchet)
# → tools/check-panel-token-aliases.js (route --*-fade-* must alias --lux-panel-* / elev)

# Evidence only — does not fail CI
npm run audit:panels
# → docs/panel-override-audit.md
```

**Honesty:** token aliases green ≠ zero gradients. Panel glass is SSOT; accents, layout, and home still differ. See [panel-override-audit.md](./panel-override-audit.md).


## Freeze (phase A) — no new glass dialects

**New UI must not invent glass.** Allowed materials only:

| Material | Token |
|----------|--------|
| Card / panel glass | `--lux-panel-surface`, `-soft` |
| Control chips | `--lux-panel-control` |
| Modal chrome | `--lux-panel-modal-*`, or `--lux-warmglass-*` (aliases panel) |
| Page backdrop | `--lux-shell-background` / palette |
| Home widgets only | `--home-fade-*` (documented exception) |

**Banned for new code:**
- Multi-stop `linear/radial-gradient` on cards, modals, heroes as a *second* glass recipe
- New `--*-create-surface`, `--*-glass-fill`, `--*-pro-surface` with literal gradients
- Route redefinition of `--*-fade-surface` / `-control` to anything except `var(--lux-panel-*)`

**Shell chrome unified (phase C):**
- `#lux-shell` → `--lux-shell-sidebar-surface` → panel surface
- Topbar shell → `--lux-shell-topbar-surface` → panel surface-soft
- Blur → `--lux-panel-blur-filter` (+ responsive `--lux-transparency-blur` at 1024/768)

**Parallel glass was collapsed (phase B):**
- `--lms-glass-fill*` → panel
- `--lms-pro-surface*` → panel
- `--lux-warmglass-surface` → panel
- Social create/dialog surfaces → panel
- Admin-orders modal body/section/control → panel
- Staff/sadmin page → `--lux-shell-background`

**Still allowed / not SSOT:** decorative P2 accents, brand hue (`--sn-accent-rgb`), layout, home exception, auth shells.

Gate: `npm run check:panels` (aliases + snowflake ratchet).

## Related

- `docs/design-system-convergence-plan.md` — phased plan: same design + smaller CSS (buttons → shell → prune paint; no big-bang)
- `DESIGN-VISUAL-SYSTEM.md` — longer history / per-route notes  
- `docs/dead-code-cleanup.md`  
- `docs/panel-override-audit.md` — ranked non-token glass backgrounds  
- `tools/check-panel-snowflakes.js` + `tools/check-panel-token-aliases.js` → `npm run check:panels`

### When touching a page (convergence checklist)

1. Use panel tokens / `.lux-panel-pro` / `.lux-soft-chrome` / lux buttons — no new raw glass or `kiu-btn*`.
2. Prefer layout-only route CSS; delete paint only when markup already uses shared classes.
3. Run `npm run check:panels` (baseline only goes down).
4. Spot-check dark + light (and HT if you changed paint).

## Bare-shell era (2026-07-17)

**Full paint kept:** timetable (`timetable-route.css`), LMS (`lms-*.css`), social (`social-rebuild.css` + lazy social modules).

**All other portal pages:** shared stack + `assets/css/lux-page-bare.css` only. Dedicated `*-route.css` / `admin-tools-luxury.css` / `staff-command-center.css` / `exam-studio.css` **deleted**.

Redesign a bare page later by dual-writing `lux-soft-chrome` / `lux-page-shell` / panel tokens — not by restoring multi-kLOC route glass files.
## Real bare vs full paint (2026-07-17)

**Full paint** (`lux-full-paint`): `index.html` (dashboard + `index-home-dashboard.css`), timetable, LMS, social — load `index-luxury.css` + surfaces + product CSS.

**Bare** (`lux-page-bare`): all other portal pages — **do not** load `index-luxury.css` / `lux-surfaces.css`. Flatten via `lux-page-bare.css` (no glass). That is why route-only deletes still looked “designed”: shared luxury was still linked.
## Social bare era (2026-07-17)

`social.html` is **bare** like registration/admin: shared stack + `lux-shell-nav` + `lux-page-bare` only.  
Deleted paint: `social-rebuild`, `social-projects-lms`, surveys/photo, material, portfolio-editor (~34k LOC).  
Redesign later using LMS/timetable panel tokens + dual-write classes — not by restoring megafiles.
