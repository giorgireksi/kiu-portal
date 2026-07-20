# KIU Portal — Luxury Visual System Notes

> **LIVE SSOT (2026-07):** For edits and handoff use [`docs/css-handoff.md`](docs/css-handoff.md) + [`docs/visual-ssot.md`](docs/visual-ssot.md).  
> This file is **historical design notes**. Many paths below are **retired** (`index-home-dashboard.css`, `*-route.css` glass skins). Prefer `index-home-{layout,widgets,role}.css` and shared `lux-tokens` / `lux-shell` / `lux-controls`.

**Shell/panels contract:** [`docs/shell-panels.md`](docs/shell-panels.md) — edit `--lux-panel-*` for portal glass.

Reference for the glassmorphism / color-fade / glow look on the dashboard (`index.html`)
and how to safely carry the same look to other pages **one page at a time**.

Scope of any future change driven by this doc: **visual only** (color, fade, glass, glow,
opacity, blur, shadow). Do **NOT** change widget/box/panel sizes, widths, grid columns, or layout.

---

## 1. What creates the look (the recipe)

Every "luxury" surface (hero, panel, card, quick button, widget) is built from the same 4 ingredients:

1. **Stacked gradients** — a few `radial-gradient`s (a white highlight + accent-colored glows)
   painted on top of a base `linear-gradient`. This is the "color fade".
2. **`backdrop-filter: blur() saturate()`** — the frosted-glass blur of whatever is behind the surface.
3. **Layered `box-shadow`** — an outer drop shadow + an `inset 0 1px 0` top highlight + a thin accent ring.
4. **Token-driven opacity** — every alpha comes from a CSS variable, so the whole interface fades
   together when one token changes.

Signature dashboard surface (the look you liked) is owned by `--home-fade-surface` in
[`assets/css/lux-tokens.css`](assets/css/lux-tokens.css) on `body.lux-route-home`, and applied in
[`assets/css/index-home-layout.css`](assets/css/index-home-layout.css) / [`index-home-widgets.css`](assets/css/index-home-widgets.css) (not the deleted `index-home-dashboard.css` megafile).

Portal reference tiers (copy these on other routes):

| Tier | Token | Use |
|---|---|---|
| Large | `--home-fade-surface` | grid widget host, editor chrome (single glass host) |
| Soft | `--home-fade-soft` / `--home-fade-chip` | flat soft insets: focus panel, stats, quick tiles, ops cards (shell-RGB, inset-first shadow, no nested blur) |
| Control | `--home-fade-control` | home toolbar, pills, meta badges, widget toolbars |

**Hero focus panel (portal primitive):** shared in [`assets/css/lux-focus-panel.css`](assets/css/lux-focus-panel.css).

| Piece | Class |
|---|---|
| Shell | `.lux-focus-panel` (+ optional `.lux-hero-side`) |
| Zones | `.lux-focus-panel__head` / `__body` / `__meta` |
| Head | `__kicker` + `__chip` (or `__chip--time`) |
| Body | `__title` + `__copy` + optional `__facts` |
| Surface | matte via `--lux-focus-fill` / `--lux-soft-chrome-*`; **always `backdrop-filter: none`** |
| Rail | 3px accent `::before` (opt out: `.lux-focus-panel--no-rail`) |

Back-compat aliases: `.lms-hero-focus*`, `.lux-timetable-hero-focus` / `.lux-timetable-focus-*` map to the same structure. Home still renders LMS class names; dual-write `lux-focus-panel` is OK. Soft insets without story structure use `.lux-soft-chrome` (same matte tier, no head/body/meta required).

**Nested-blur rule:** one blur host per stack (outer hero / large command deck / grid widget). Soft chrome, focus panels, chips, filters never host `backdrop-filter`.

**Full-shell parity:** outer `.lux-grid-widget` = single blur host; nested hero/panels transparent; all soft insets flat and slider-linked via `--home-fade-*` / `--lux-soft-chrome-*`.

**Palette adaptivity:** dark mid/end stops use `--lux-shell-start-rgb` / `--lux-shell-end-rgb` (written by `applyResolvedPalette`). Light end stop and soft fills use `--lux-glass-tint-rgb`. Accent radials use `--lux-accent-rgb` / `--lux-home-secondary-rgb`. Do **not** bake `rgba(10,15,24)` / cream into home fade definitions.

Dark large recipe (what `--home-fade-surface` expands to):

```css
background: var(--home-fade-surface);
border-color: var(--home-fade-border);
box-shadow: var(--home-fade-shadow);
backdrop-filter: var(--home-fade-blur);
```

Equivalent expanded gradients:

```css
background:
    radial-gradient(circle at 6% 0%,   rgba(255,255,255, calc(var(--lux-color-fade-alpha,.92) * .08)), transparent 32%),
    radial-gradient(circle at 74% 0%,  rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha,.92) * .28)), transparent 42%),
    radial-gradient(circle at 100% 96%,rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha,.92) * .18)), transparent 40%),
    linear-gradient(135deg,
        rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha,.92) * .10)),
        rgba(var(--lux-shell-start-rgb), calc(var(--lux-transparency-alpha,.92) * .89)) 44%,
        rgba(var(--lux-shell-end-rgb),  calc(var(--lux-transparency-alpha,.92) * .80)));
```---

## 2. File map (what to read / touch)

### CSS layers (loaded by `index.html` AND all 27 portal pages, in this order)

| Order | File | Role for visuals |
|---|---|---|
| 1 | `assets/vendor/fontawesome/css/all.min.css` | Icons |
| 2 | `assets/css/kiu-fonts.css` | Fonts |
| 3 | `assets/css/base.css` | Base resets / globals |
| 4 | `assets/css/layout.css` | Shell layout (sidebar/topbar/grid) |
| 5 | **`assets/css/lux-tokens.css`** | **Foundation: all colors, 7 palettes, glass/opacity/blur/glow variables** |
| 6 | **`assets/css/lux-surfaces.css`** | **Reusable glass surface recipes** (`.lux-summary-surface`, pills, data cards) |
| 7 | `assets/css/lux-controls.css` | Buttons / controls |
| 8 | `assets/css/lux-layout-primitives.css` | Grid/layout helpers |
| 9 | **`assets/css/index-luxury.css`** | **Monolith (~22.8k lines): real `.lux-hero`/`.lux-card`/`.lux-quick-btn` glass + per-route fades** |
| 10 | `assets/css/mobile-responsive.css` | Mobile overrides |
| + | route file (e.g. `lms-route.css`) | **Page-specific overrides — loaded LAST, so it wins ties** |

`index.html` additionally loads `assets/css/index-home-dashboard.css` (dashboard-only). It does **not** load `news-route.css`.

### Key token locations in `lux-tokens.css`

- Palette gradients: `--palette-obsidian-dark/-light`, `--palette-slate-*`, `--palette-pine-*`,
  `--palette-burgundy-*`, `--palette-sand-*`, `--palette-ink-*`, `--palette-ocean-*` (7 palettes x dark/light).
- Accent: `--lux-accent`, `--lux-accent-2`, `--lux-accent-rgb`.
- Glass/opacity: `--lux-panel-alpha` (.74), `--lux-glass-alpha` (.06), `--lux-card-glow-alpha`,
  `--lux-raised-alpha`, `--lux-canvas-opacity`, `--lux-overlay-opacity`, `--lux-utility-alpha`.
- Glow: `--lux-hero-glow`, `--lux-panel-glow`, `--lux-button-glow`, `--lux-glow-scale`.
- Blur: `--lux-panel-blur`, `--lux-surface-blur`, `--lux-glass-blur`, `--lux-transparency-blur`,
  `--lux-transparency-saturate`.
- Radius/shadow: `--lux-radius`, `--lux-radius-lg`, `--lux-shadow`.

Performance tiers adjust blur/alpha: `body[data-lux-performance='efficient'|'standard'|'high']`.

### Core surface definitions in `index-luxury.css`

- `.lux-hero` — L1820, again L3225, again L3693 (duplicated; glow via `--lux-hero-glow`).
- `.lux-card` — L1972, L3462.
- `.lux-quick-btn` — L2400, L3367 (full glass: gradient + glow + box-shadow + hover lift).
- Shared glass fill block — L3699-3714 (`.lux-hero-side`, `.lux-strip-card`, `.lux-quick-btn`, etc. all use
  `linear-gradient(180deg, rgba(255,255,255,var(--lux-raised-alpha)), rgba(255,255,255,var(--lux-glass-alpha)))`).
- Per-route fade blocks (copy-pasted recipe) start ~L5789 (personal-data, library, etc.).

### Dashboard-only — `index-home-dashboard.css`

- Home grid / canvas / widget shells (`.lux-home-grid`, `.lux-dashboard-canvas`, `.lux-grid-widget`).
- Role tints: `.lux-home-grid.is-student/.is-professor/.is-admin/...` L49-87.
- **Signature dashboard fade** — tokens `--home-fade-surface` / `-soft` / `-control` / `-chip` in `lux-tokens.css`; applied in `index-home-dashboard.css`. Single glass host = outer `.lux-grid-widget`; hero focus = `.lms-hero-focus` (exact LMS focus panel on home, engine-painted glass). Flat soft insets on stats/quick/ops/news strip. Home fills CSS-owned via `shouldKeepHomeFadeCssBackground` in `utilities.js`.

### JS that drives visuals

| File | Visual role |
|---|---|
| `assets/js/theme-primer.js` | Runs in `<head>` before paint; applies saved theme/palette/transparency to avoid flash |
| `assets/js/features/index-luxury.js` | Live engine: `syncAll()`, sets palette class, light/dark, atmosphere, performance; sets CSS variables on `:root` |
| **`assets/js/shared/utilities.js`** | **`updateTransparency()` + `buildDynamicSurfaceBackground()` — paints surface backgrounds INLINE with `!important`** |
| `assets/js/features/luxury-shell-chrome.js` | "Color & Motion Studio" (palette button) + "Customize" layout editor |
| `assets/js/features/index-home-dashboard.js` | Builds the dashboard widget DOM (`#lux-home-shell`) |
| `assets/js/features/luxury-home-model.js` | Dashboard data model (not styling) |

---

## 3. Palette / theme / localStorage keys

7 palette body classes: `palette-obsidian-amber`, `palette-slate-sapphire`, `palette-pine-jade`,
`palette-burgundy-rose`, `palette-sand-pearl`, `palette-ink-orchid`, `palette-ocean-teal`.
Light mode: `lux-light-mode` (on `html` and `body`).

| Key | Meaning |
|---|---|
| `kiuLuxuryPalette` / `kiu-palette` | Active preset palette key |
| `kiuLuxuryPaletteFaculty` | Faculty when palette saved |
| `kiuLuxuryCustomPalette` / `...Faculty` | Custom accent JSON `{accent, accent2}` |
| `kiuLuxuryThemeMode` | `light` / `dark` |
| `kiuLuxurySurfaceTransparency` / `...Value` | Opacity slider (0 = most transparent, 100 = most solid) |
| `kiuLuxuryBackgroundMode` | Particle variant: `peak`, `layered`, `orbit`, `corners` (legacy `constellation`/`aurora`/`mesh` migrate automatically) |
| `kiuLuxuryBackgroundAnimationsEnabled` | `1`/`0` — WebGL particle loop on/off |
| `kiuLuxuryParticleMotion` / `kiuLuxuryParticleDensity` / `kiuLuxuryParticleQuality` | Particle wave motion (0–120), density (35–100), quality (`auto`/`low`/`balanced`/`high`) |
| `assets/js/features/luxury-particle-background.js` | Three.js particle backdrop on `#lux-bg-canvas` (colors from `--lux-accent*`, not a separate theme picker) |
| `KIU_STATE.homeDashboardPreferencesByUser[...].visualsByScope["role::faculty"]` | Per-user, per-role/faculty overrides |

Theme/palette/transparency are **portal-wide** (same keys on every luxury page). Dashboard **layout**
(Customize) is home-only.

---

## 4. Errors / issues found (fix candidates)

1. **Broken/dead rule (real bug)** — `index-home-dashboard.css` L1203-1206: a selector list ends with a
   trailing comma and **no `{ }` block** right before `@media`, so the light-mode topbar styling is
   silently dropped by the browser.
   ```css
   body.lux-light-mode #lux-topbar .lux-search input,
   body.lux-light-mode #lux-topbar .lux-picker-btn,
   body.lux-light-mode #lux-topbar .lux-topbar-editor-btn,   /* <-- dangling comma, block missing */

   @media (max-width:1420px) { ... }
   ```
2. **Two variables for one effect** — dashboard fade uses `--lux-color-fade-alpha`; route fades in
   `index-luxury.css` use `--lux-transparency-alpha`. Same visual job, two knobs → breaks "one change everywhere".
3. **Duplication / monolith** — `.lux-hero`/`.lux-card`/`.lux-quick-btn` defined 2-3x; the fade recipe is
   copy-pasted per route with slightly different numbers.
4. **Minor inconsistencies** — body class order varies; `data-faculty` present only on 6 pages
   (index, timetable, social, admin-orders, admin-library).

---

## 5. The override reality (WHY a naive change can fail on some pages)

Three override layers, weakest to strongest:

1. **`!important` saturation.** Counts: `index-luxury.css` 2419, `mobile-responsive.css` 872,
   `social-rebuild.css` 633, `admin-tools-luxury.css` 287, `lms-route.css` 253,
   `student-service-route.css` 201, `staff-command-center.css` 154, `registration-route.css` 135,
   `timetable-route.css` 121, `programs-route.css` 0 (post cleanup), ...
2. **Source order.** Each page loads its route CSS AFTER `index-luxury.css`. On equal `!important`+specificity,
   the **route file wins**. So shared edits get beaten on the heaviest pages.
3. **JS inline paint (strongest).** `updateTransparency()` in `utilities.js` does
   `el.style.setProperty('background', buildDynamicSurfaceBackground(...), 'important')`.
   Inline + `important` beats EVERY stylesheet — no `.css` edit can override a JS-painted surface.

**Critical distinction:**
- ✅ **Variable-driven overrides are safe** — an `!important` rule using `var(--lux-accent-rgb)` /
  `var(--lux-transparency-alpha)` still updates when the token changes. The inline JS paint is centralized in
  ONE function (`buildDynamicSurfaceBackground`), so painted surfaces also have a single owner.
- ❌ **Literal/hardcoded overrides are blockers** — e.g. `background: #101726 !important` with no variable.
  These will NOT update and must be cleaned/converted.

---

## 6. Single source of truth (how to make "one change = everywhere")

- The real single source = **`lux-tokens.css` tokens + the `buildDynamicSurfaceBackground` painter.**
  CSS-only restyling cannot win the cascade; tokens + the one painter can.
- **Unify `--lux-color-fade-alpha` and `--lux-transparency-alpha`** into one token so dashboard and routes move together.
- Restyle by changing tokens / the painter — do **NOT** add new competing `!important` rules.
- Convert any literal/hardcoded surface overrides on a target page to reference the shared tokens.

---

## 7. Per-page change workflow (do this for EACH page, one at a time)

When changing a page (e.g. `lms.html` / `lms-route.css`):

1. **Identify the page's CSS + body class.** Route file = `assets/css/<name>-route.css` (exceptions:
   social=`social-rebuild.css`, exams=`exam-studio.css`, staff=`staff-command-center.css`,
   students-admin=`students-admin-lms.css`, admin-tools=`admin-tools-luxury.css`). Body class = `lux-route-<name>`.
2. **Audit overrides** in that route file (and the page's block in `index-luxury.css`):
   grep for `background`, `box-shadow`, `border`, `backdrop-filter`, `!important` on the surfaces you'll restyle.
3. **Classify each override:** variable-driven (leave — auto-updates) vs literal/hardcoded (convert to token).
4. **Check JS paint:** is the surface in the `updateTransparency` selector list? If yes, the recipe change must go
   through `buildDynamicSurfaceBackground` (CSS won't win).
5. **Apply the change at the source** (token / painter), or convert the route rule to reference the shared token.
6. **Verify visually:** dark mode + light mode + 2 palettes. Playwright artifacts live under `asd/.playwright-mcp/`.
7. **Confirm no size/layout drift** — backgrounds/colors/blur/shadow only.

### Per-page checklist table (fill in as you go)

| Page | Route CSS | Body class | Audited? | Hardcoded overrides found | JS-painted surfaces? | Done |
|---|---|---|---|---|---|---|
| index (dashboard) | index-home-dashboard.css | lux-route-home | yes | `--home-fade-*`; hero focus story panel; flat soft insets; single widget glass host; FOUC/HT/99–100 carveouts | CSS-owned via `shouldKeepHomeFadeCssBackground` | baseline |
| lms | lms-route.css | lux-route-lms | yes | converted to `--lms-fade-*` tokens (quiz/gradebook/live/concepts/assignments/monitoring) | yes (hero, lux-card, group cards, lms-clean-*, status pills) via utilities.js LMS branch | done |
| timetable | timetable-route.css | lux-route-timetable | yes | converted to `--tt-fade-*` tokens (hero/command/stage/canvas/grid, soft chrome, chips, sch-* rows/events); removed 3 conflicting timetable blocks from index-luxury.css (glass redesign, clean-academic flat, compat-repair) + generic FOUC/HT/preset timetable selectors | yes (timetable surfaces CSS-owned via `isStructuralSurface`; removed `isTimetableLargeSurface` inline paint + HT/all-selector lists) | done |
| study-card | study-card-route.css | lux-route-study-card | yes | converted to `--sc-fade-*` tokens (shell, hero, filter, container, summary stage/cards, term headers/rows, grade circles, assessment modal, history, legacy popover/header/circle); removed duplicate shell upgrade block | yes (hero, filter-shell, container, semester-table, summary-stage = large; strip cards, grade circles, status pills, assessment chips/cards, term rows, history = soft) via utilities.js study-card branch | done |
| registration | registration-route.css | lux-route-registration | yes | converted to `--reg-fade-*` tokens (shell, hero, insight/focus/track cards, tabs, buttons, progress, modals, structured form, advanced map, section picker, condition/antireq); fixed light-mode `--lux-text` | yes (hero, workspace, module cards = large; insight/focus/track/footer/mini-metric/course-row/module-choice/reg-tabs = soft) via utilities.js registration branch | done |
| programs | programs-route.css | lux-route-programs | yes | converted to `--prog-fade-*` tokens (command deck, control/ops bands, module/subject rails, module options, subject cards, pills, empty states); removed legacy hero/filter/stage/overview/focus/summary/timeline + index-luxury programs final-pass; single blur host on command deck | yes (command deck / control-band / ops-panel / module+subject rails = large; ops tiles, module options, subject cards, status pills = soft) via utilities.js programs branch | done |
| profile | *(removed)* redirect → personal-data | — | — | `profile.html` is legacy alias; use `personal-data-route.css` / `lux-route-personal-data` | — | done (2026-07-17 orphan delete) |
| profile-view | profile-view-route.css | lux-route-profile-view | yes | converted to `--pv-fade-*` tokens (meta/left/right panels = large; stat/session/document/course/financial/probation/strip/inline/data cards = soft; controls/tabs/inputs = control; pills = chip; modals = modal; financial table = flat rows); hero keeps faculty-accent gradient with tokenized border/blur; deduped index-luxury.css flat pv blocks + generic lux-card/content-box catch-alls | yes (`pv-*` + generic surface classes CSS-owned via `isStructuralSurface`) | done |
| personal-data | personal-data-route.css + index-luxury.css | lux-route-personal-data | yes | converted to `--pd-fade-*` tokens (hero, toolbar, profile/stats/facts/record cards, KPI/mini/record-item/meta, hero panel/badges, status pill, select); removed duplicate override waves in index-luxury.css | yes (hero, toolbar, profile/stats/facts/record cards = large; KPI/mini/record-item/meta/strip cards/status pills/hero panel = soft) via utilities.js personal-data branch | done |
| orders | orders-route.css | lux-route-orders | yes | converted to `--orders-fade-*` tokens (home-dashboard recipe: hero/list/detail = large; hero-signal/metric/attachment/recipient/list-wrap/detail-panel/empty/status-filter/items = soft; controls/pills = control/chip; list rows = flat); scoped to `#page-orders` / `#orders-inbox-root` for index embed + standalone; deduped index-luxury.css duplicate orders blocks + generic high-transparency orders overrides | yes (inbox surfaces CSS-owned via `isStructuralSurface` inside `#page-orders` / `#orders-inbox-root`; removed from inline paint lists) | done |
| news | news-route.css | lux-route-news | yes | converted to `--news-fade-*` tokens (panel/sidebar/rail/feed/filter/section/hero = large; stat/private/check/account/section-btn/pane = soft; badge/chip = control); refactored inlined L549-602 recipe | yes (panel/hero/feed/filter/sidebar/rail/section = large; stat/private/check/account/section-btn/pane = soft) via utilities.js news branch — already token-form | done |
| library | library-route.css + library-catalog-shared.css | lux-route-library | yes | converted to `--lib-fade-*` tokens (catalog workspace/filters/table via shared CSS; route keeps fade + live glass); dead hero/filter-shell legacy removed in cleanup | yes (catalog soft/large surfaces via `isLibrarySoftSurface` in utilities.js library branch) | done |
| student-service | student-service-route.css | lux-route-student-service | yes | converted to `--ssvc-fade-*` tokens (hero/panel/canvas/zone/lane/ticket/ops/track/home = large; area/article/ticket-row/home-card/track-card/ops-ticket = soft; hero variant via `--ssvc-fade-surface-hero`); refactored inlined L1950-2060 recipe | yes (hero/panel/canvas/zone/lane/ticket/ops/track/home = large; workflow-step/summary/home-card/area/ticket-row/track/lane/ticket-card = soft) via utilities.js student-service branch | done |
| social | social-rebuild.css | lux-route-social | yes | converted to `--social-fade-*` tokens (topbar/section-command/events/pages/messages/projects/portfolio shells = large; neo/project/portfolio cards = soft; inputs/composer = control; pills = chip; dialogs/drawer/story/toast = modal; chat/directory/message rows = flat); aliased legacy `--sn-*`/`--social-*` surface vars; collapsed L5498 fade pass; deduped index-luxury duplicate recipe blocks + primer/high-transparency social overrides | yes (`social-neo-*` / `social-project-*` / `social-portfolio-*` / legacy `social-*` CSS-owned via `isStructuralSurface`; removed from inline paint lists) | done |
| exams | exam-studio.css | lux-route-exams | yes | converted to `--exam-fade-*` tokens (hero/panel/toolbar/cards/sidebar/qnav/empty-state = large; stat/quiz/q-card/timeline/split/progress/mini-grid = soft); refactored inlined L1266-1347 recipe | yes (hero/panel/toolbar/cards/sidebar/qnav/empty-state = large; stat/quiz/q-card/timeline/split/progress/mini-grid = soft) via utilities.js exams branch | done |
| chancellery | chancellery-route.css | lux-route-chancellery | yes | converted to `--chan-fade-*` tokens (hero/focus/snapshot/cards/queue/thread/controls/chips/rows); light body palette moved from index-luxury; neutralized stacked `lux-summary-surface` in `#page-chancellery`; deduped index-luxury duplicate chancellery block + generic painters with `:not(.lux-route-chancellery)` | yes (`#page-chancellery` surfaces CSS-owned via `isStructuralSurface`; removed `isChancelleryLargeSurface` inline paint + HT/all-selector lists) | done |
| staff | staff-command-center.css | lux-route-staff | yes | converted to `--staff-fade-*` tokens (hub hero/command/directory/profile/modal/metrics/admin-directory, controls/chips/rows); neutralized stacked `lux-summary-surface` in `#staff-content`; deduped index-luxury staff hero/card/admin-directory paint dupes + generic painters with `:not(.lux-route-staff)` | yes (`#staff-content` surfaces CSS-owned via `isStructuralSurface`; removed `isStaffSurface` inline paint + HT/all-selector lists) | done |
| students-admin | students-admin-lms.css | lux-route-students-admin | yes | renamed `--students-lms-*` -> `--sadmin-fade-*` tokens (page/surface-fill/subtle, controls/chips, rows, modal); route already excluded from all generic index-luxury painters via `:not(.lux-route-students-admin)`; HT reinstatement + home-style restyle in route CSS | yes (`#students-content` surfaces CSS-owned via transparency early return; stubbed `applyStudentsAdminManagedSurface`; `renderStudentsPage` hook kept) | done |
| faculty-gradebook | faculty-gradebook-route.css | lux-route-faculty-gradebook | yes | converted to `--fg-fade-*` tokens (hero/command/insight/stage/filters/controls = large; eval/modal/roster/staff/sheet/timeline = soft; inputs/buttons/pills = control/chip; table rows = flat); removed duplicated high-transparency blocks | yes (faculty + `gb-*` surfaces CSS-owned via `isStructuralSurface`; removed from inline paint lists) | done |
| admin-scheduler | admin-scheduler-route.css | lux-route-admin-scheduler | yes | converted to `--sch-fade-*` tokens (rail/board heroes = hero; rail section/grid shell/modal/legend = large; stat strip cards/actions/palette/legend chrome = soft; filter/search/modal fields = control); deduped index-luxury.css scheduler backgrounds | yes (hero/large/soft/control via `isSchedulerSoftSurface` / `isSchedulerControlSurface` in utilities.js) | done |
| admin-tools | admin-tools-luxury.css | lux-route-admin-tools | yes | converted to `--atools-fade-*` tokens (hero/index-panel/panels/ops = large; summary/command/strip/subcard/tabs = soft; pickers/inputs = control); deduped index-luxury.css admin-tools backgrounds | yes (large + soft + control via `isAdminToolsSoftSurface` / `isAdminToolsControlSurface` in utilities.js) | done |
| admin-orders | admin-orders-route.css | lux-route-admin-orders | yes | converted to `--aorders-fade-*` tokens (hero/panels = large; metric/recipient/attachment/detail/hero-signal = soft; compose inputs/studio controls = control; table row/danger/modal chrome); deduped index-luxury.css dead admin-orders blocks + `#admin-orders-root>*` catch-alls | yes (admin soft surfaces via `isAdminOrdersSoftSurface`; hero/panels/table/studio excluded from inline paint via `isStructuralSurface`) | done |
| admin-library | admin-library-route.css + library-catalog-shared.css | lux-route-admin-library | yes | converted to `--alib-fade-*` tokens (aliases `--lib-fade-*` for shared catalog surfaces; admin-only entry/row/danger/modal chrome); catalog chrome owned by `library-catalog-shared.css` — not `library-route.css` | yes (extends library branch: entry shell = large; metric/param/chip = soft; catalog rows + modal excluded from inline paint) | done |

## 8. LMS page - single source of truth (done)

The LMS page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-lms` in `assets/css/lms-route.css` (search `--lms-fade-`):
  `--lms-fade-surface`, `--lms-fade-surface-soft`, `--lms-fade-control`,
  `--lms-fade-border`, `--lms-fade-border-soft`, `--lms-fade-shadow`,
  `--lms-fade-shadow-soft`, `--lms-fade-blur` (each has a dark + light-mode value).
  Every LMS surface (hero, subject/group cards, panels, tabs, lecture/workshop toggle,
  buttons, quiz studio, gradebook, live, concepts, assignments, monitoring) references
  these tokens. Change the look here once and it propagates page-wide.
- JS painter: the `isLmsRoute` branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` paints the inline-painted surfaces (`.page-hero`,
  `.lux-card`, `.lux-lms-group-card`, `.lux-status-pill`, `.lms-clean-*`) with the same
  dashboard color-fade recipe. Edit this branch if you change those surfaces.

To retune the whole LMS look: adjust the `--lms-fade-*` token values (and the matching
JS branch if you change the painted surfaces). No per-component edits needed.

## 9. Registration page - single source of truth (done)

The registration page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-registration` in `assets/css/registration-route.css`
  (search `--reg-fade-`): `--reg-fade-surface`, `--reg-fade-surface-soft`,
  `--reg-fade-control`, `--reg-fade-border`, `--reg-fade-border-soft`,
  `--reg-fade-shadow`, `--reg-fade-shadow-soft`, `--reg-fade-glow-ring`,
  `--reg-fade-blur` (each has a dark + light-mode value). Large surfaces (hero,
  workspace, module list/pane cards, modals) use `--reg-fade-surface`; smaller
  chrome (insight/focus/track cards, footer/progress, tabs, course rows, chips,
  buttons) use `--reg-fade-surface-soft` / `--reg-fade-control`. The legacy
  light-themed inner content (structured form modal, advanced course map,
  section picker, condition/antireq, render-error/empty states) is converted to
  these tokens via a consolidated override block appended at the end of the file.
- Light mode: the route hardcodes a cream `--lux-text` for dark mode; the
  light-mode token block also restores dark `--lux-text` / `--lux-text-muted` /
  `--lux-border` so text stays legible on light surfaces.
- JS painter: the registration branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` paints the inline-painted surfaces. Large
  surfaces (`registration-hero`, `registration-workspace`, module cards) get the
  full color-fade; the smaller registration glass classes get the soft fade.
  It uses the `calc(var(--lux-color-fade-alpha)...)` form so it tracks the same
  global knobs as the dashboard and LMS.

To retune the whole registration look: adjust the `--reg-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 10. Programs page - single source of truth (done)

The programs page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-programs #page-programs` in
  `assets/css/programs-route.css` (search `--prog-fade-`):
  `--prog-fade-surface`, `--prog-fade-surface-soft`, `--prog-fade-control`,
  `--prog-fade-border`, `--prog-fade-border-soft`, `--prog-fade-shadow`,
  `--prog-fade-shadow-soft`, `--prog-fade-glow-ring`, `--prog-fade-blur`
  (each has a dark + light-mode value). Glow radials use `--program-blue` /
  `--program-cyan` (accent / secondary) but follow `--lux-color-fade-alpha`.
  Large surfaces (command deck, control band, ops panel, module/subject rails)
  use `--prog-fade-surface`; smaller chrome (ops tiles, module options, subject
  cards, status pills, filter inputs) use `--prog-fade-surface-soft` /
  `--prog-fade-control`. Only `.lux-program-command-deck` applies
  `--prog-fade-blur`; nested bands, rails, and cards are soft/opaque insets
  with no stacked `backdrop-filter`. Light mode flips tokens — avoid duplicating
  per-component glass pyramids. Legacy hero / filter-shell / stage / overview /
  focus / summary / timeline CSS and the index-luxury programs final-pass are gone.
- JS painter: the programs branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` paints inline-painted surfaces. Large
  surfaces get the full color-fade; smaller programs glass classes get the soft
  fade. CSS-owned programs fade surfaces skip inline background overrides;
  backdrop blur is suppressed everywhere except the command deck. It uses the
  `calc(var(--lux-color-fade-alpha)...)` form so it tracks the same global
  knobs as the dashboard, LMS, and registration.

To retune the whole programs look: adjust the `--prog-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 11. Study-card page - single source of truth (done)

The study-card page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-study-card` in `assets/css/study-card-route.css`
  (search `--sc-fade-`): `--sc-fade-surface`, `--sc-fade-surface-soft`,
  `--sc-fade-control`, `--sc-fade-border`, `--sc-fade-border-soft`,
  `--sc-fade-shadow`, `--sc-fade-shadow-soft`, `--sc-fade-glow-ring`,
  `--sc-fade-blur` (each has a dark + light-mode value). Glow radials follow
  `--lux-color-fade-alpha`; the dark base follows `--lux-transparency-alpha`.
  Large surfaces (hero, filter shell, container, summary stage, semester table)
  use `--sc-fade-surface`; smaller chrome (summary strip cards, grade circles,
  status pills, term rows/headers, assessment chips/cards, history blocks) use
  `--sc-fade-surface-soft` / `--sc-fade-control`. The legacy popover/header/circle
  block and assessment modal are converted to these tokens. Real glass blur is
  applied via `--sc-fade-blur` with `-webkit-backdrop-filter` pairs throughout.
- JS painter: the study-card branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` paints inline-painted surfaces. Large surfaces
  get the full color-fade; smaller study-card glass classes get the soft fade.
  It uses the `calc(var(--lux-color-fade-alpha)...)` form so it tracks the same
  global knobs as the dashboard, LMS, registration, and programs.

To retune the whole study-card look: adjust the `--sc-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 12. Personal-data page - single source of truth (done)

The personal-data page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-personal-data` in `assets/css/index-luxury.css`
  (search `--pd-fade-`): `--pd-fade-surface`, `--pd-fade-surface-soft`,
  `--pd-fade-control`, `--pd-fade-border`, `--pd-fade-border-soft`,
  `--pd-fade-shadow`, `--pd-fade-shadow-soft`, `--pd-fade-glow-ring`,
  `--pd-fade-blur` (each has a dark + light-mode value). Legacy `--pd-*` tokens
  (`--pd-border`, `--pd-row`, etc.) alias to the fade tokens so inner shared
  `lux-data-card` surfaces in `assets/css/personal-data-route.css` inherit the
  look. Large surfaces (hero, toolbar, profile/stats/facts/record cards) use
  `--pd-fade-surface`; smaller chrome (KPI cards, fact mini tiles, record items,
  meta pairs, hero panel, status pill, toolbar select) use
  `--pd-fade-surface-soft` / `--pd-fade-control`. Real glass blur is applied via
  `--pd-fade-blur` with `-webkit-backdrop-filter` pairs throughout.
- JS painter: the personal-data branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` paints inline-painted surfaces. Large surfaces
  get the full color-fade; smaller personal-data glass classes get the soft fade.
  It uses the `calc(var(--lux-color-fade-alpha)...)` form so it tracks the same
  global knobs as the dashboard, LMS, registration, programs, and study-card.

To retune the whole personal-data look: adjust the `--pd-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 13. News page - single source of truth (done)

The news page color-fade/glow/glass is driven from one place:

- CSS tokens on `body.lux-route-news` in `assets/css/news-route.css`
  (search `--news-fade-`): `--news-fade-surface`, `--news-fade-surface-soft`,
  `--news-fade-control`, `--news-fade-border`, `--news-fade-border-soft`,
  `--news-fade-shadow`, `--news-fade-shadow-soft`, `--news-fade-blur`
  (each has a dark + light-mode value). Glow radials follow
  `--lux-color-fade-alpha`; the dark base follows `--lux-transparency-alpha`.
  The continuous workspace shell (`.newsx-shell`) uses `--news-fade-surface`
  with `--news-fade-blur`. Nested chrome (header bar, sidebar section buttons,
  soft feed cards) uses `--news-fade-surface-soft` / `--news-fade-control`.
  Publisher / confirm / sections modals lean on `lux-modals.css` +
  `--lux-warmglass-*` (route CSS keeps layout only).
- JS painter: the news branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` stays aligned with the CSS tokens
  (`newsx-shell` large vs soft feed-card chrome).

To retune the whole news look: adjust the `--news-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 14. Exams page - single source of truth (done)

The exams page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-exams` in `assets/css/exam-studio.css`
  (search `--exam-fade-`): `--exam-fade-surface`, `--exam-fade-surface-soft`,
  `--exam-fade-control`, `--exam-fade-border`, `--exam-fade-border-soft`,
  `--exam-fade-shadow`, `--exam-fade-shadow-soft`, `--exam-fade-glow-ring`,
  `--exam-fade-blur` (each has a dark + light-mode value). Glow radials follow
  `--lux-color-fade-alpha`; the dark base follows `--lux-transparency-alpha`.
  Large surfaces (hero, panel, toolbar, cards, live sidebar, qnav bar,
  empty state) use `--exam-fade-surface`; smaller chrome (stat cards, quiz cards,
  q-cards, timeline/split/progress steps, mini-grid cells) use
  `--exam-fade-surface-soft`. Real glass blur is applied via `--exam-fade-blur`
  with `-webkit-backdrop-filter` pairs throughout.
- JS painter: the exams branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` was rewritten to the
  `calc(var(--lux-color-fade-alpha)...)` token form with a large-vs-soft split,
  aligned with the CSS tokens.

To retune the whole exams look: adjust the `--exam-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 15. Student-service page - single source of truth (done)

The student-service page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-student-service` in
  `assets/css/student-service-route.css` (search `--ssvc-fade-`):
  `--ssvc-fade-surface`, `--ssvc-fade-surface-hero`, `--ssvc-fade-surface-soft`,
  `--ssvc-fade-control`, `--ssvc-fade-border`, `--ssvc-fade-border-soft`,
  `--ssvc-fade-shadow`, `--ssvc-fade-shadow-soft`, `--ssvc-fade-glow-ring`,
  `--ssvc-fade-blur` (each has a dark + light-mode value). Glow radials follow
  `--lux-color-fade-alpha`; the dark base follows `--lux-transparency-alpha`.
  Large surfaces (hero aside, workflow strip, overview, canvas, panel, zone,
  lane switcher, lane/ticket/ops/track cards, article preview, ticket focus/thread,
  home panel, lane choice) use `--ssvc-fade-surface`; the hero uses
  `--ssvc-fade-surface-hero`; smaller chrome (area/article cards, ticket rows,
  home tickets/topics, ticket stats, home cards, track cards, ops tickets/lanes)
  use `--ssvc-fade-surface-soft`. Real glass blur is applied via
  `--ssvc-fade-blur` with `-webkit-backdrop-filter` pairs throughout.
- JS painter: the student-service branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` was rewritten to the
  `calc(var(--lux-color-fade-alpha)...)` token form with a large-vs-soft split,
  aligned with the CSS tokens.

To retune the whole student-service look: adjust the `--ssvc-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 16. Library page - single source of truth (done)

The library page color-fade/glow/glass is now driven from one place:

- Catalog chrome (filters panel, metrics, tabs, table, pagination) lives in
  `assets/css/library-catalog-shared.css` (shared with admin-library; same
  `admin-library-*` class names by intentional contract).
- Route fade tokens on `body.lux-route-library` in `assets/css/library-route.css`
  (search `--lib-fade-`): `--lib-fade-surface`, `--lib-fade-surface-soft`,
  `--lib-fade-control`, `--lib-fade-border`, `--lib-fade-border-soft`,
  `--lib-fade-shadow`, `--lib-fade-shadow-soft`, `--lib-fade-glow-ring`,
  `--lib-fade-blur` (each has a dark + light-mode value). Glow radials follow
  `--lux-color-fade-alpha`; the dark base follows `--lux-transparency-alpha`.
  Live catalog surfaces use `--lib-fade-surface` / `--lib-fade-surface-soft`;
  Browse Catalog filter pickers and search use `--lib-fade-control`. Real glass
  blur is applied via `--lib-fade-blur` with `-webkit-backdrop-filter` pairs.
  Unified-shell and `lux-summary-surface` layers are neutralized inside
  `#page-library` so they do not fight the route tokens. Legacy page-hero /
  filter-shell markup is gone; do not retarget those class names.
- JS painter: the library branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` uses `isLibraryLargeSurface` plus
  `isLibrarySoftSurface` with the same token-form
  `calc(var(--lux-color-fade-alpha)...)` recipe as the CSS tokens.

To retune the whole library look: adjust the `--lib-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 17. Admin Tools page - single source of truth (done)

The admin-tools page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-admin-tools` in `assets/css/admin-tools-luxury.css`
  (search `--atools-fade-`): `--atools-fade-surface`, `--atools-fade-surface-hero`,
  `--atools-fade-surface-soft`, `--atools-fade-control`, `--atools-fade-border`,
  `--atools-fade-border-soft`, `--atools-fade-shadow`, `--atools-fade-shadow-soft`,
  `--atools-fade-glow-ring`, `--atools-fade-blur` (each has a dark + light-mode value).
  Large surfaces (legacy hero, index hero/panel, `.lux-panel`, ops cards, curriculum
  and registration roots) use `--atools-fade-surface` / `--atools-fade-surface-hero`;
  smaller chrome (index summary/command cards, strip cards, subcards, inactive
  registration tabs) use `--atools-fade-surface-soft`; pickers and inputs use
  `--atools-fade-control`. Real glass blur is applied via `--atools-fade-blur` with
  `-webkit-backdrop-filter` pairs throughout. Stacked `lux-summary-surface` layers
  inside `#lux-admin-tools-shell` are neutralized. Conflicting admin-tools background
  blocks were removed from `assets/css/index-luxury.css`.
- JS painter: the admin-tools branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` uses `isAdminToolsLargeSurface`,
  `isAdminToolsSoftSurface`, and `isAdminToolsControlSurface` (shell-scoped) with the
  same token-form `calc(var(--lux-color-fade-alpha)...)` recipe as the CSS tokens.

To retune the whole admin-tools look: adjust the `--atools-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 18. Admin Scheduler page - single source of truth (done)

The admin-scheduler page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-admin-scheduler` in `assets/css/admin-scheduler-route.css`
  (search `--sch-fade-`): `--sch-fade-surface`, `--sch-fade-surface-hero`,
  `--sch-fade-surface-soft`, `--sch-fade-control`, `--sch-fade-border`,
  `--sch-fade-border-soft`, `--sch-fade-shadow`, `--sch-fade-shadow-soft`,
  `--sch-fade-glow-ring`, `--sch-fade-blur` (each has a dark + light-mode value).
  Grid chrome tokens (`--sch-grid-chrome-bg`, `--sch-grid-chrome-border`,
  `--sch-grid-lane-bg`, `--sch-event-surface`, `--sch-grid-time-pill-bg`,
  `--sch-event-control`) tint the weekly grid with `--lux-glass-tint-rgb` and accent
  borders instead of raw white rgba fills. Time-slot pills (`.sch-time-slot-copy`)
  beat legacy `layout.css` `.sch-time-slot span` white backgrounds via scoped
  `#page-admin-scheduler` overrides. Header/time columns (`.sch-header-row`,
  `.sch-day-col`) and lanes (`.sch-lane`, `.sch-slot-bg`) use grid chrome tokens;
  session cards (`.sch-event`) use `--sch-event-surface` with per-card
  `--sch-event-rgb` set from `getSchedulerFacultyTone()` (chosen accent when the
  event faculty matches `currentFaculty`, otherwise that faculty's hue). Event
  action chips (`.ev-action`) use `--sch-event-control` (event-rgb + glass tint,
  not white `--sch-fade-control`). Hero surfaces (`.sch-rail-hero`, `.sch-board-hero`) use `--sch-fade-surface-hero`;
  large panels (`.sch-rail-section`, `.sch-grid-shell`, `.sch-modal`,
  `.sch-board-legend`) use `--sch-fade-surface`; smaller chrome (stat strip cards,
  quick actions, palette cards, legend/grid tags, week arrows) use
  `--sch-fade-surface-soft`; filter selects, palette search, and modal fields use
  `--sch-fade-control`. Real glass blur is applied via `--sch-fade-blur` with
  `-webkit-backdrop-filter` pairs throughout. Unified-shell and `lux-summary-surface`
  layers are neutralized inside `#page-admin-scheduler` so they do not fight the
  route tokens. Conflicting scheduler background blocks were removed from
  `assets/css/index-luxury.css`.
- JS painter: the admin-scheduler branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` uses `isSchedulerLargeSurface`,
  `isSchedulerSoftSurface`, and `isSchedulerControlSurface` (page-scoped to
  `#page-admin-scheduler`) with the same token-form `calc(var(--lux-color-fade-alpha)...)`
  recipe as the CSS tokens. Grid internals (`sch-time-labels`, `sch-lane`,
  `sch-slot-bg`, `sch-event`) are excluded from the transparency observer via
  `isStructuralSurface` so inline paints do not fight route grid tokens. Faculty
  legend dots and primary week/create buttons remain semantic and are not
  token-overpainted.

To retune the whole admin-scheduler look: adjust the `--sch-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 19. Admin Library page - single source of truth (done)

The admin-library page color-fade/glow/glass is now driven from one place:

- Catalog chrome (shared filters/metrics/tabs/table/pagination) is owned by
  `assets/css/library-catalog-shared.css`. Admin does **not** load
  `library-route.css`; route-only CSS is `assets/css/admin-library-route.css`.
- CSS tokens on `body.lux-route-admin-library` in `assets/css/admin-library-route.css`
  (search `--alib-fade-`): `--alib-fade-surface`, `--alib-fade-surface-soft`,
  `--alib-fade-control`, `--alib-fade-border`, `--alib-fade-border-soft`,
  `--alib-fade-shadow`, `--alib-fade-shadow-soft`, `--alib-fade-blur`,
  `--alib-fade-modal`, `--alib-fade-row`, `--alib-fade-row-hover`,
  `--alib-fade-danger`, `--alib-fade-danger-border` (dark + light where needed).
  Shared catalog surfaces inherit `--lib-fade-*` via aliases; admin-only chrome
  (entry workspace, metric cards, param groups, chips, modal, catalog row tint,
  remove button) uses `--alib-fade-*`. Real glass blur is applied via
  `--alib-fade-blur` with `-webkit-backdrop-filter` pairs throughout. Stacked
  `lux-summary-surface` layers are neutralized inside `#page-library` so they do
  not fight the route tokens. Legacy admin-library hero / summary surfaces are
  not part of the live markup.
- JS painter: the library branch of `buildDynamicSurfaceBackground()` in
  `assets/js/shared/utilities.js` was extended with admin-library soft/large
  surface classes (`admin-library-entry-shell`, `admin-library-metric-card`,
  `admin-library-param-group`, `admin-library-chip`). Catalog table rows and the
  params modal are excluded from inline paint via `isStructuralSurface` so
  `--alib-fade-row` and modal tokens are not overwritten.

To retune the whole admin-library look: adjust the `--alib-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 20. Admin Orders page - single source of truth (done)

The admin-orders page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-admin-orders` in `assets/css/admin-orders-route.css`
  (search `--aorders-fade-`): `--aorders-fade-surface`, `--aorders-fade-surface-soft`,
  `--aorders-fade-control`, `--aorders-fade-chip`, `--aorders-fade-border`,
  `--aorders-fade-border-soft`, `--aorders-fade-shadow`, `--aorders-fade-shadow-soft`,
  `--aorders-fade-blur`, `--aorders-fade-modal`, `--aorders-fade-row`,
  `--aorders-fade-row-hover`, `--aorders-fade-danger`, `--aorders-fade-danger-border`
  (dark + light where needed). Large surfaces (hero, compose/recipients/table/detail
  panels) use `--aorders-fade-surface`; soft chrome (recipient list shell/rows, metric
  cards, attachment cards, recipient cards, detail empty, list empty, hero-side shell)
  uses `--aorders-fade-surface-soft` with `--aorders-fade-control` for empty/selected
  states; inner hero signals use `--aorders-fade-control`; all `#admin-orders-root` form
  controls (title, select, date, description textarea, recipient search) use
  `--aorders-fade-control`; status pills and role-filter chips use `--aorders-fade-chip`
  (semantic `.is-info/.is-success/.is-warning/.is-muted` tints preserved); secondary
  buttons use control token; primary buttons keep accent gradient with route blur/border
  chrome; selected-order description body (`.orders-detail-panel.lux-detail-panel`) uses
  soft surface token; table rows use flat `--aorders-fade-row` / `--aorders-fade-row-hover`
  (data density); studio palette buttons and close control use control token. Real glass
  blur is applied via `--aorders-fade-blur` with `-webkit-backdrop-filter` pairs
  throughout. Surface tier summary:

  | Tier | Selectors | Token |
  |------|-----------|-------|
  | Large panels | `#admin-orders-root .orders-admin-hero`, `.orders-admin-panel` | `--aorders-fade-surface` |
  | Soft chrome | recipient shell/rows, metric/attachment/recipient cards, detail empty | `--aorders-fade-surface-soft` |
  | Hero-side inner | `.orders-admin-hero-side .lux-hero-signal`, `.lux-hero-side-head` | `--aorders-fade-control` |
  | Controls / chips | `.lux-control`, `.lux-status-pill`, buttons | `--aorders-fade-control` / `--aorders-fade-chip` |
  | Table rows | `.orders-admin-table tbody tr`, `th` | `--aorders-fade-row*` (flat) |

  Stacked `lux-summary-surface` layers are neutralized inside `#admin-orders-root` so
  they do not fight the route tokens. Conflicting admin-orders background blocks were
  removed from `assets/css/index-luxury.css` (legacy `.orders-shell`/`.stat-card`
  selectors, broad `#admin-orders-root>*` unified-shell overrides, unified-shell
  input/select/textarea/lux-card/lux-secondary-btn/lux-hero-signal catch-all, **and**
  the role-admin unified-shell `.surface-card`/`.modal-content`/`.page-hero` flat
  gradient block, lux-nonhome-page `.surface-card`/`.lux-card` + `.lux-card::before`
  glass overlays, lux-nonhome-page flat input/select/textarea rules, and lux-nonhome
  `.lux-status-pill` base/semantic blocks — the widget-pass dedupe alone was
  insufficient for panel shells). Generic `html.lux-high-transparency` flat overrides
  for `.orders-detail-card` / `.orders-metric-card` were narrowed to
  `body.lux-route-orders` only so admin detail panels are not flattened at high
  transparency; admin route reinstatement lives in `admin-orders-route.css`. Panel shell
  ownership is reinforced in route CSS via `#admin-orders-root .orders-admin-hero`/`.orders-admin-panel`
  lock-in (background, border, shadow, blur), `::before` overlay neutralization, and
  `.lux-summary-surface--hero`/`.lux-summary-surface--panel` shadow reset. Soft chrome
  lock-in under `#admin-orders-root` mirrors the panel pattern.
- JS painter: admin-orders surfaces are **CSS-owned** via `isStructuralSurface`
  (`isAdminOrdersSoftSurface` is disabled). Excluded from inline paint: hero/panels,
  table wrap/rows/delete, all widgets inside `#admin-orders-root` (controls, pills,
  buttons, detail panel, hero-side cluster, recipient shell/rows, metric/attachment/
  recipient cards, detail/list empty), and studio modal chrome (palette options, close,
  mode/background buttons, studio cards). Transparency slider updates `--lux-transparency-*`
  CSS vars consumed by `--aorders-fade-*` tokens — no per-component JS paint needed.

To retune the whole admin-orders look: adjust the `--aorders-fade-*` token values
(and the matching JS branch if you change the painted surfaces). No per-component
edits needed.

## 21. Orders inbox page - single source of truth (done)

The recipient orders inbox (`orders.html` / `#page-orders` on index) color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-orders` and `:is(#page-orders, #orders-inbox-root)` in
  `assets/css/orders-route.css` (search `--orders-fade-`): `--orders-fade-surface`,
  `--orders-fade-surface-soft`, `--orders-fade-control`, `--orders-fade-chip`,
  `--orders-fade-border`, `--orders-fade-border-soft`, `--orders-fade-shadow`,
  `--orders-fade-shadow-soft`, `--orders-fade-blur`, `--orders-fade-modal`,
  `--orders-fade-row`, `--orders-fade-row-hover` (dark + light). Large surfaces
  (`.orders-inbox-hero`, `.orders-list-card`, `.orders-detail-card`) use the home-dashboard
  gradient recipe via `--orders-fade-surface`; soft chrome (hero-side signals, metric/
  attachment/recipient cards, list wrap, detail panel, empty states, status filters,
  active list item) uses `--orders-fade-surface-soft` / `--orders-fade-control`; list
  rows use flat `--orders-fade-row` / `--orders-fade-row-hover`. Stacked
  `lux-summary-surface` layers are neutralized inside the inbox roots. Conflicting orders
  blocks were removed from `assets/css/index-luxury.css` (legacy `body.lux-route-orders`
  layout/paint duplicates L5247-5404, widget fade pass L21728-21822, generic
  `html.lux-high-transparency` orders selectors, and modernized-shell `:where()` orders
  entries). High-transparency reinstatement lives in `orders-route.css` for both
  `body.lux-route-orders` and `body.lux-route-home` (index embed).
- JS painter: inbox surfaces are **CSS-owned** via `isStructuralSurface` when inside
  `#page-orders` / `#orders-inbox-root` (hero, panels, KPI tiles, list rows, filters,
  controls, pills, detail chrome). Removed from `isOrdersSurface` inbox branch and
  `HIGH_TRANSPARENCY_SURFACE_SELECTORS` orders entries. Transparency slider updates
  `--lux-transparency-*` vars consumed by `--orders-fade-*` — no per-component JS paint.

To retune the whole orders inbox look: adjust the `--orders-fade-*` token values in
`orders-route.css`. No per-component edits needed.

## 22. Faculty Gradebook page - single source of truth (done)

The faculty-gradebook page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-faculty-gradebook.lux-unified-shell` in
  `assets/css/faculty-gradebook-route.css` (search `--fg-fade-`):
  `--fg-fade-surface`, `--fg-fade-surface-soft`, `--fg-fade-control`,
  `--fg-fade-chip`, `--fg-fade-border`, `--fg-fade-border-soft`,
  `--fg-fade-shadow`, `--fg-fade-shadow-soft`, `--fg-fade-blur`,
  `--fg-fade-modal`, `--fg-fade-row`, `--fg-fade-row-hover`,
  `--fg-fade-danger`, `--fg-fade-danger-border` (each has a dark + light-mode
  value). Large surfaces (hero, hero-focus, command, stage, insight cards,
  filters, controls, modern/staff/sheet shells) use `--fg-fade-surface`;
  smaller chrome (eval cards, modal sections/history, roster card body, timeline,
  weight cards, student context bar, staff stat strip cards) use
  `--fg-fade-surface-soft`; form controls and action buttons use
  `--fg-fade-control`; status pills use `--fg-fade-chip`; modal shells use
  `--fg-fade-modal`; gradebook table body cells use flat `--fg-fade-row` /
  `--fg-fade-row-hover`. Real glass blur is applied via `--fg-fade-blur` with
  `-webkit-backdrop-filter` pairs throughout. Stacked `lux-summary-surface--hero`
  layers are neutralized. Verbatim `html.lux-high-transparency` duplicate rule
  blocks were removed; high-transparency reinstatement uses token references.
  Surface tier summary:

  | Tier | Selectors | Token |
  |------|-----------|-------|
  | Large panels | `.lux-faculty-hero`, `.lux-faculty-command`, `.lux-faculty-stage`, `.lux-faculty-insight`, filters/controls | `--fg-fade-surface` |
  | Soft chrome | `.gb-eval-*`, `.gb-modal-section`, roster body, timeline, staff linked cards | `--fg-fade-surface-soft` |
  | Controls / chips | `#faculty-filters select`, `.gb-*` inputs, `.lux-status-pill` | `--fg-fade-control` / `--fg-fade-chip` |
  | Table rows | `#gradebook-table tbody td` | `--fg-fade-row*` (flat) |
  | Modals | `.gb-modal-shell`, `.gb-score-edit-card` | `--fg-fade-modal` |

- JS painter: faculty-gradebook surfaces are **CSS-owned** via `isStructuralSurface`
  (scoped to `.lux-faculty-gradebook-page`, `lux-faculty-*` panels, and all
  `gb-*` classes). They were removed from `HIGH_TRANSPARENCY_SURFACE_SELECTORS`
  and `allSelectors` inline paint lists. Transparency slider updates
  `--lux-transparency-*` CSS vars consumed by `--fg-fade-*` tokens.

To retune the whole faculty-gradebook look: adjust the `--fg-fade-*` token values.
No per-component edits needed.

## 22. Profile View page - single source of truth (done)

The profile-view page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-profile-view` in
  `assets/css/profile-view-route.css` (search `--pv-fade-`):
  `--pv-fade-surface`, `--pv-fade-surface-soft`, `--pv-fade-control`,
  `--pv-fade-chip`, `--pv-fade-border`, `--pv-fade-border-soft`,
  `--pv-fade-shadow`, `--pv-fade-shadow-soft`, `--pv-fade-blur`,
  `--pv-fade-modal`, `--pv-fade-row`, `--pv-fade-row-hover`,
  `--pv-fade-danger`, `--pv-fade-danger-border` (each has a dark + light-mode
  value). Large panels (`.pv-meta`, `.pv-left`, `.pv-right`) use
  `--pv-fade-surface`; smaller chrome (stat/session/document/course/financial
  cards, strip/inline/data/info cards, upload zone) use `--pv-fade-surface-soft`;
  form controls, tabs, and schedule/modal inputs use `--pv-fade-control`;
  status pills use `--pv-fade-chip`; modal shells and headers use `--pv-fade-modal`;
  financial table body cells use flat `--pv-fade-row` / `--pv-fade-row-hover`.
  `.pv-hero` keeps the per-render faculty-accent identity gradient; only border,
  blur, and shadow route through tokens. Hardcoded light literals in modals/forms
  were converted to `var(--lux-text*)` / `--pv-fade-*`. Real glass blur uses
  `--pv-fade-blur` with `-webkit-backdrop-filter` pairs. `index-luxury.css`
  generic nonhome flat recipe and `.lux-card` glass no longer apply to profile-view
  (`:not(.lux-route-profile-view)` dedupe; dead `pv-meta`/`pv-left`/`pv-right`
  flat blocks removed).

  | Tier | Selectors | Token |
  |------|-----------|-------|
  | Large panels | `.pv-meta`, `.pv-left`, `.pv-right` | `--pv-fade-surface` |
  | Soft chrome | `.pv-stat-card`, session/document/course rows, financial/probation cards, `lux-strip-card`, `lux-inline-card`, `lux-data-card` | `--pv-fade-surface-soft` |
  | Hero (accent) | `.pv-hero` | faculty-accent gradient + `--pv-fade-border*` / `--pv-fade-blur` |
  | Controls / chips | `.lux-control`, `.pv-tab`, modal inputs, `.lux-status-pill` | `--pv-fade-control` / `--pv-fade-chip` |
  | Table rows | `.pv-financial-table tbody td` | `--pv-fade-row*` (flat) |
  | Modals | `.pv-modal-card`, `.pv-profile-edit-card`, `.pv-modal-header` | `--pv-fade-modal` / soft header |

- JS painter: profile-view surfaces are **CSS-owned** via `isStructuralSurface`
  (all `pv-*` classes plus `surface-card`, `lux-summary-surface`, strip/inline/
  data/info cards, `lux-status-pill`, `lux-control`, `lux-select-card`). The
  transparency slider updates `--lux-transparency-*` CSS vars consumed by
  `--pv-fade-*` tokens.

To retune the whole profile-view look: adjust the `--pv-fade-*` token values once.
No per-component edits needed. Transcript export (`.pv-transcript-*`) stays
print-oriented and is intentionally outside the glass system.

## 23. Social page - single source of truth (done)

The campus social page color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-social` in
  `assets/css/social-rebuild.css` (search `--social-fade-`):
  `--social-fade-surface`, `--social-fade-surface-soft`, `--social-fade-control`,
  `--social-fade-chip`, `--social-fade-border`, `--social-fade-border-soft`,
  `--social-fade-shadow`, `--social-fade-shadow-soft`, `--social-fade-blur`,
  `--social-fade-modal`, `--social-fade-row`, `--social-fade-row-hover`,
  `--social-fade-danger`, `--social-fade-danger-border` (each has a dark +
  light-mode value). Legacy `--sn-bg` / `--sn-bg2` / `--sn-inp` and index-luxury
  `--social-bg` / `--social-surface` aliases point at the fade tokens so existing
  rules keep working. Large panels (topbar, section-command, events/pages/messages
  shells, projects/portfolio heroes) use `--social-fade-surface`; cards and
  panels use `--social-fade-surface-soft`; inputs and composer fields use
  `--social-fade-control`; pills use `--social-fade-chip`; modal/dialog/drawer/
  story/toast shells use `--social-fade-modal`; list rows use flat
  `--social-fade-row` / `--social-fade-row-hover`. The old hardcoded L5498
  “fade pass” and duplicate `index-luxury.css` `#page-social` gradient blocks were
  replaced with token references. `html.lux-high-transparency` reinstatement uses
  route CSS token twins.

  | Tier | Selectors | Token |
  |------|-----------|-------|
  | Large panels | `.social-neo-topbar-card`, `.social-neo-section-command`, events/pages/messages/projects shells | `--social-fade-surface` |
  | Soft chrome | `.social-neo-card`, post/composer/filter/story/rail/community/group/page/event cards, `social-project-*-card`, `social-portfolio-card` | `--social-fade-surface-soft` |
  | Controls | `.social-neo-input`, textarea, select, composer fields | `--social-fade-control` |
  | Chips | `.social-neo-pill`, presence/scope/topbar pills | `--social-fade-chip` |
  | Rows | `.social-neo-chat-item`, directory-item, message, comment-bubble | `--social-fade-row*` |
  | Modals | `.social-neo-dialog-card`, story-composer, drawer, toast | `--social-fade-modal` |

- JS painter: social surfaces are **CSS-owned** via `isStructuralSurface`
  (legacy `social-*`, all `SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES`, and
  `social-neo-*` / `social-project*` / `social-portfolio*` prefixes). They were
  removed from `buildDynamicSurfaceBackground` (`isSocialSurface`), 
  `shouldApplyDynamicBackground`, `HIGH_TRANSPARENCY_SURFACE_SELECTORS`, and
  `allSelectors`. Transparency slider updates `--lux-transparency-*` CSS vars
  consumed by `--social-fade-*` tokens.

To retune the whole social look: adjust the `--social-fade-*` token values once.
No per-component edits needed.

## 24. Timetable page - single source of truth (done)

The timetable page (`timetable.html`) color-fade/glow/glass is now driven from one place:

- CSS tokens on `body.lux-route-timetable` in `assets/css/timetable-route.css`
  (search `--tt-fade-`): `--tt-fade-surface`, `--tt-fade-surface-soft`,
  `--tt-fade-control`, `--tt-fade-chip`, `--tt-fade-border`, `--tt-fade-border-soft`,
  `--tt-fade-shadow`, `--tt-fade-shadow-soft`, `--tt-fade-blur`, `--tt-fade-row`,
  `--tt-fade-row-hover` (dark + light). Large surfaces (hero, command, stage, canvas,
  grid shell) use `--tt-fade-surface`; soft chrome (hero-focus, filters, view-switcher,
  week-nav, insight, day/session cards, events) uses `--tt-fade-surface-soft` /
  `--tt-fade-control` / `--tt-fade-chip`; grid primitives use flat `--tt-fade-row`.
  Stacked `lux-summary-surface` layers are neutralized on this route. The three
  legacy timetable blocks in `assets/css/index-luxury.css` (glass redesign,
  clean-academic flat-white override, compat-repair rebinding) were removed; timetable
  entries were removed from generic FOUC/high-transparency/preset selector lists.
  High-transparency reinstatement lives in `timetable-route.css`.
- JS painter: timetable surfaces are **CSS-owned** via `isStructuralSurface` on
  `lux-route-timetable`. Removed `isTimetableLargeSurface` inline paint branch and
  timetable entries from `HIGH_TRANSPARENCY_SURFACE_SELECTORS`,
  `shouldApplyDynamicBackground`, and `__luxTransparencyAllSelectors`. Layout wrappers
  remain skipped by `isTimetableLayoutWrapper`.

To retune the whole timetable look: adjust the `--tt-fade-*` token values once.

## 25. Profile edit page - single source of truth (done)

~~The self-service profile edit page (`profile.html` / `#page-profile`)~~ **Superseded 2026-07-17:** `profile.html` redirects to `personal-data.html`; `profile-route.css` removed. Personal data uses `personal-data-route.css` / `lux-route-personal-data`. Historical note: the former profile page color-fade/glow/glass
is now driven from one place:

- ~~CSS tokens on `body.lux-route-profile` in `assets/css/profile-route.css`~~ removed; use personal-data route tokens.
  (search `--prof-fade-`): `--prof-fade-surface`, `--prof-fade-surface-soft`,
  `--prof-fade-control`, `--prof-fade-chip`, `--prof-fade-border`,
  `--prof-fade-border-soft`, `--prof-fade-shadow`, `--prof-fade-shadow-soft`,
  `--prof-fade-blur`, `--prof-fade-row`, `--prof-fade-row-hover` (dark + light).
  Large surfaces (page hero, nav card, content card, messenger shell) use
  `--prof-fade-surface`; soft chrome (summary strip, hero-side signals, mini panels)
  uses `--prof-fade-surface-soft`; tabs/inputs/toggles use `--prof-fade-control`;
  embedded calendar `sch-*` rows use `--prof-fade-row`. Stacked `lux-summary-surface`
  layers are neutralized inside `#page-profile`. Generic `index-luxury.css` catches
  exclude `lux-route-profile`. High-transparency reinstatement lives in
  ~~`profile-route.css`~~ (deleted).
- JS painter: profile surfaces are **CSS-owned** via `isStructuralSurface` when on
  `lux-route-profile` inside `#page-profile`.

To retune the whole profile edit look: adjust the `--prof-fade-*` token values once.

## 26. Chancellery page - single source of truth (done)

The chancellery page (`chancellery.html` / `#page-chancellery`) color-fade/glow/glass
is now driven from one place:

- CSS tokens on `body.lux-route-chancellery` in `assets/css/chancellery-route.css`
  (search `--chan-fade-`): `--chan-fade-surface`, `--chan-fade-surface-soft`,
  `--chan-fade-control`, `--chan-fade-chip`, `--chan-fade-border`,
  `--chan-fade-border-soft`, `--chan-fade-shadow`, `--chan-fade-shadow-soft`,
  `--chan-fade-blur`, `--chan-fade-row`, `--chan-fade-row-hover` (dark + light).
  Large surfaces (hero, focus/snapshot cards, queue/thread cards) use
  `--chan-fade-surface`; soft chrome (subcards, stat cards, queue/thread rows,
  focus rows, strip cards) uses `--chan-fade-surface-soft`; controls/tabs/pills
  use `--chan-fade-control` / `--chan-fade-chip`. Stacked `lux-summary-surface`
  layers are neutralized inside `#page-chancellery`. The light-mode body palette
  formerly only in `index-luxury.css` now lives in the route file. Generic
  `index-luxury.css` catches exclude `lux-route-chancellery`. High-transparency
  reinstatement lives in `chancellery-route.css`.
- JS painter: chancellery surfaces are **CSS-owned** via `isStructuralSurface` when on
  `lux-route-chancellery` inside `#page-chancellery`.

To retune the whole chancellery look: adjust the `--chan-fade-*` token values once.

## 27. Staff command center - single source of truth (done)

The staff command center (`staff.html` / `#staff-content`) color-fade/glow/glass
is now driven from one place:

- CSS tokens on `body.lux-route-staff` in `assets/css/staff-command-center.css`
  (search `--staff-fade-`): `--staff-fade-surface`, `--staff-fade-surface-soft`,
  `--staff-fade-control`, `--staff-fade-chip`, `--staff-fade-border`,
  `--staff-fade-border-soft`, `--staff-fade-shadow`, `--staff-fade-shadow-soft`,
  `--staff-fade-blur`, `--staff-fade-row`, `--staff-fade-row-hover` (dark + light).
  Large surfaces (hub hero, command/directory/profile/modal panels, admin-directory
  hero/card) use `--staff-fade-surface`; soft chrome (metric/mini/focus cards,
  controls, list items, directory controls) uses `--staff-fade-surface-soft`;
  tabs/chips/inputs use `--staff-fade-control` / `--staff-fade-chip`. Stacked
  `lux-summary-surface` layers are neutralized inside `#staff-content`. Generic
  `index-luxury.css` staff paint duplicates and catches exclude `lux-route-staff`.
  High-transparency reinstatement lives in `staff-command-center.css`.
- JS painter: staff surfaces are **CSS-owned** via `isStructuralSurface` when on
  `lux-route-staff` inside `#staff-content`. The `renderStaffPage` refresh hook is
  unchanged.

To retune the whole staff command center look: adjust the `--staff-fade-*` token values once.

## 28. Students-admin - single source of truth (done)

The students administration page (`students-admin.html` / `#students-content`) color-fade/glow/glass
is now driven from one place:

- CSS tokens on `body.lux-route-students-admin` in `assets/css/students-admin-lms.css`
  (search `--sadmin-fade-`): `--sadmin-fade-surface-fill`, `--sadmin-fade-surface-subtle`,
  `--sadmin-fade-surface-strong`, `--sadmin-fade-border`, `--sadmin-fade-border-soft`,
  `--sadmin-fade-shadow`, `--sadmin-fade-shadow-soft`, `--sadmin-fade-glass-blur`,
  `--sadmin-fade-row`, `--sadmin-fade-row-hover`, plus control/chip/modal/table tokens
  (dark + light). Large surfaces (`.students-lms-hero`, `.students-lms-panel`,
  `.students-lms-profile-header`, `.students-lms-table-shell`) use
  `--sadmin-fade-surface-fill`; soft chrome (`.students-lms-stat-card`,
  `.students-lms-profile-card`) uses `--sadmin-fade-surface-subtle` /
  `--sadmin-fade-card-bg`. Generic `index-luxury.css` already excludes
  `lux-route-students-admin` on all generic painters (383 `:not()` guards, zero
  positive duplicate paint). High-transparency reinstatement lives in
  `students-admin-lms.css`.
- JS painter: students-admin surfaces are **CSS-owned** via an early return in the
  transparency applier when inside `#students-content` or `#students-admin-lms-modal`.
  `applyStudentsAdminManagedSurface` / `buildStudentsAdminHighTransparencyCss` remain
  stubbed; `renderStudentsPage` refresh hook is unchanged.

To retune the whole students-admin look: adjust the `--sadmin-fade-*` token values once.

## 29. Lux Droplist — global picker shell (done)

Universal enhanced `<select>` pickers share one droplist shell defined in
`assets/css/lux-controls.css` and applied by `applyLuxPickerPanelVariants()` in
`assets/js/features/luxury-shell-chrome.js`.

### Canonical tokens (`:root` in `lux-controls.css`)

| Token | Value | Role |
|---|---|---|
| `--lux-droplist-shell-radius` | `28px` | Panel corner radius |
| `--lux-droplist-option-height` | `44px` | Option row height |
| `--lux-droplist-anim-duration` | `200ms` | Open/close fade duration |
| `--lux-droplist-slide-offset` | `8px` | Closed-state vertical slide |
| `--lux-droplist-scale-closed` | `0.97` | Closed-state scale |

Legacy `--lux-picker-*` animation tokens alias to the droplist values for
back-compat with non-droplist picker panels.

### Light-mode glass (`--lux-droplist-glass-*`)

Light mode uses the same warm modal-glass recipe as scheduler/social create dialogs:

| Token | Role |
|---|---|
| `--lux-droplist-glass-surface` | 3-layer stack: top white bloom, accent bloom, warm `rgba(247,241,232)` base |
| `--lux-droplist-glass-border` | `rgba(77, 52, 31, 0.12)` |
| `--lux-droplist-glass-blur` | `blur(26px) saturate(155%)` |
| `--lux-droplist-glass-shadow` | Drop shadow + inset highlight + accent outer ring |
| `--lux-droplist-glass-inset` | `::before` top rim highlight |
| `--lux-droplist-glass-sheen-opacity` | `::after` wash strength in light mode |

Route CSS must not repaint `.lux-droplist-panel` shells; use
`:not(.lux-droplist-panel)` when a route needs its own picker surface.

### Class stack

Enhanced picker panels receive:

```
lux-picker-panel lux-universal-picker-panel lux-droplist-panel lux-picker-panel-scroll
```

Open/close state classes: `.is-open`, `.is-closing`, `.is-open-above`.

Route files may add context guards (e.g. scheduler modal `display: none` when
closed) but must not redefine the global shell geometry.

### Exceptions (do not receive `lux-droplist-panel`)

- **LMS** — `shouldEnhanceSelect()` skips `#page-lms`, `#lms-content-area`, etc.
- **Registration section picker** — custom `openStudentCourseSectionPicker()` modal;
  not wired through `enhanceUniversalPicker()`.

Contract tests: `test/fixtures/lux-droplist-contract.js`,
`test/lux-droplist-global-unification.test.js`.
