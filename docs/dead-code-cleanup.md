# Dead code cleanup rules

> **Historical note (2026-07):** Bare dual-write paint was stripped; post-strip keep-lists / purged `*-route.css` readers / spent wire scripts are cleaned separately. Live stack SSOT: [`visual-ssot.md`](visual-ssot.md). Do not resurrect dedicated route glass skins.

Phased hygiene for the portal monorepo. Prefer surgical deletes with evidence over mass rewrites.

## When to delete

- No HTML `<script>` / `<link>`, no dynamic loader URL, no `require`/`import`
- Tests updated in the same change (including “absence” locks)
- Product decision recorded for ambiguous surfaces (mail UI, docs API, serviceRequests)

## When not to delete

- Redirect stubs (`calendar.html`, `gradebook.html`, `faculty-schedule.html`)
- Lazy social / student-service / exams modules (loaded via `MODULE_URL` + `createElement`)
- Dual live button systems (`kiu-btn*` on LMS, `lux-*` elsewhere) until markup migrates
- Backend domain helpers used only via store `.call` chains or ACL

## Phases (see session plan)

0. gitignore + launchers  
1. High-confidence orphans  
2. Loader lists + dead store surface  
3. Structural orphans (directories/planner)  
4. Optional CSS transition debt  

## Verify after each phase

Targeted vitest + `npm run check:platform` / `check:frontend` as relevant + smoke touched routes.


## Progress (2026-07-15)

- **Phase 0–1 done:** gitignore noise, `npm start` → `start:local`, orphan FE/BE deletes (email, schedule-preview, faculty-core, admin-directories.css, legacy-import, database.js, store stubs).
- **Phase 2 done:** slim `REGISTRATION_RUNTIME_SCRIPTS`, remove dead registration fade Set, purge docs API + serviceRequests store surface + client helpers.
- **Phase 3 done:** deleted `planner.js` / `directories.js`; tests retargeted; `ui.js` calendar guards.
- **Phase 4 (partial) done:** removed competing index-luxury SSVC glass; removed unreachable `isStudentServiceLargeSurface` paint path; dropped admin-tools `lux-home-columns` CSS; pruned social projects no-ops + legacy light-mode social-card block; cleaned utilities/theme-primer dead social class allowlists.
- **Still optional:** full `kiu-btn`→`lux-*` migration (LMS), remaining legacy social class selectors in social-rebuild soft-surface lists, messenger dual ownership.

## Progress (2026-07-17) — orphan hygiene

- **Deleted** unlinked `assets/css/profile-route.css` (~429 lines). Live profile edit is `personal-data.html` + `personal-data-route.css`; `profile.html` is redirect-only.

- **Deleted** unlinked `assets/js/pages/profile-route.js` (~52 lines). Extract never wired into HTML; tab helpers still live in `registration.js` (legacy).
- **Pruned** old `graphify-out/2026-06-*` and `2026-07-0[1-9]/` archives; kept `2026-07-10/`, root graph, and `cache/`.
- **Classification** updated: `profile.html` → `excluded-route` / `redirect-route.css` (same as calendar/gradebook aliases).
- **Repo noise:** `artifacts/social-css-backup-pre-asd10/`, `undefined/` screenshots, root `tmp-html-validate*.json`.
- **Root script duplicates** removed (identical copies live under `tools/`): `apply_*.py`, `inject_*.py`, `parse_*.py`, `deploy_admin_upgrade.py`, `temp_replace.js`.
- **Left alone (on purpose):** `utilities.js` `lux-route-profile` keep-path branches (harmless; timetable source-lock uses them as slice markers); `index-luxury` `:not(.lux-route-profile)` exclusions (no-op until class appears); redirect `profile.html`.

- **Deleted dead profile tab runtime** from `registration.js` (~52 lines) — no `#page-profile` in live HTML.
- **Deleted** `shouldKeepProfileFadeCssBackground` + structural `lux-route-profile` branch in `utilities.js` (~54 lines).
- **Line count (source, this hygiene campaign):** ~460 (profile CSS) + 52 (profile-route.js) + 52 (registration) + 54 (utilities) ≈ **618 lines** of dead FE source removed; plus repo noise (backups/screenshots/tmp/scripts/graphify archives) not counted as product LOC.

## Progress (2026-07-17) — high-confidence pass (~884 LOC)

- Deleted stubs: `gradebook.js` (6), `luxury-home-dashboard-runtime.js` (3)
- `faculty.js` legacy student social (~288)
- `utilities.js` `switchAdminPanelTab` + empty `updateNavigationMenu` (~16)
- `app.js` profile/calendar English overrides (~33)
- `registration.js` dead helpers + `open-profile` → profile-view (~130)
- `index-luxury.css` dead `lux-route-calendar` block (~201) + pre-neo social skin (~196)
- Classification: students-admin, social photo/surveys/portfolio, library-catalog-shared; focus/modals treated as shared
- Campaign total with prior orphans ≈ **1500** product source lines

## Progress (2026-07-17) — payload lighten

- **Lazy Three:** `luxury-background.js` dynamic-imports particle module (and thus Three) only when particle/fog engines run; HTML that loaded particle directly now uses orchestrator.
- **SSVC peel:** moved **3642** lines of `lux-route-student-service` rules from global `index-luxury.css` → `student-service-route.css` (global file **17925 → ~14283**).
- **animat/** sandbox deleted (~1617 LOC); stale wireframe tests deleted (36).
- **Lines:** peel is **move** (not delete) for SSVC; true deletes this pass ≈ **1650** (animat+tests) + prior campaign ≈ **1.5k** high-confidence dead code.

## Progress (2026-07-17) — dead-code bloat waves (session)

**Scope:** dead only (no kiu-btn, no social-neo rewrite). Multi-wave.

### Wave 1 — scanner dead classes
- `index-luxury.css`: deleted dead `cols-2` field-grid rules + entire light-mode `lux-route-calendar` island (calendar.html is redirect) + dropped `.table-responsive` from table overflow group → **−~211 lines**
- `library-route.css`: dead `lib-search-bar` / `lib-input` rules (catalog uses `lux-control`) → **−62**
- `social-projects-lms.css`: dead bare `drawer-section*` / `drawer-chip*` / `drawer-submit` (no JS emit) → **−88**
- `students-admin-lms.css`: dead `.spaced` / `.spaced-sm` utility margins (hub uses `--spaced` BEM) → **−10**

### Wave 2 — SSVC dead chrome
- `student-service-route.css`: removed exclusive hero / workflow / summary / overview paint (JS is command-bar + canvas only) → **3763 → 3214 (−~549)**
- `utilities.js`: dropped summary-card allowlist entries
- Tests: flip workflow/hero/summary CSS contracts to **absence** locks

### Wave 3 — utilities dead surface
- Pruned allowlist entries: library/admin-library hero-summary cards, SSVC area-card / track-panel / ticket-focus / panel / ticket-thread
- Removed `#page-career-market` transparency early-return (career-market page/runtime gone)
- `utilities.js` **3864 → 3842 (−22)**

### Wave 4
- Confirmed prior orphans already deleted (hero markup fns, exams dual shell no-op, loaders). No further high-confidence dead functions found.

### Verify
- `test/student-service-*.test.js`: **147/147 pass**
- `scan-dead-css`: **0 confirmed-dead** class candidates
- `check:panels`: raw boxShadow **1090** (was 1138 baseline), backdrop **379** (was 405) — baseline ratcheted down

### Session product LOC removed (approx)
| File | Δ lines |
|------|--------:|
| index-luxury.css | −211 |
| student-service-route.css | −549 |
| social-projects-lms.css | −88 |
| library-route.css | −62 |
| students-admin-lms.css | −10 |
| utilities.js | −22 |
| **Total** | **~−940** |

**Not in this campaign:** social-rebuild live surface, kiu-btn dual system, pre-existing failing exact `?v=` / SW / students-admin embed CSS contracts (unrelated missing live styles / pins).

## Progress (2026-07-17) — dead-code continue pass

- **Deleted** orphan `assets/css/career-market-route.css` (**2430** lines) — route HTML/JS already removed; nav tests assert absence.
- **utilities.js** pruned dead allowlist: students-hub hero/command/metric cards, study-card-history-*, lms-clean-summary/subview-hero, social-neo-pages-hero-stats, builder-panel exact classes (**~20** lines).
- **index-luxury recovery + re-peel** (accidental `git checkout` undid uncommitted peel): re-stripped all `lux-route-student-service` paint, calendar/cols-2/legacy shell, bare SSVC editorial island, pre-neo social non-route selectors; re-aliased `--pd-fade-*` → panel SSOT.
- **index-luxury.css** now **~14.4k** (from HEAD **18.6k**); SSVC mentions **0**.
- `check:panels` baseline **1090/379 → 1077/375**.
- `test/student-service-*.test.js` **147/147** still green.

## Progress (2026-07-17) — dead-code continue pass 2

- **index-luxury:** removed dead pre-neo social title/copy color rules + social `kiu-btn` overrides; stripped `admin-directory-*` staff leftovers.
- **staff-command-center.css:** deleted dead `admin-directory-*` and unused `staff-hub-hero` / command|focus|mini|metric-card / metrics chrome (JS uses `staff-hub-controls` + directory-panel + info cards) → **1777 → ~1489**.
- **utilities.js:** pruned matching allowlists + bare `newsx-post-card` contains (editorial variant remains).
- `check:panels` baseline **1077/375 → 1076/375**.
- SSVC tests **147/147** green.
- Note: `staff-hub-modal-warmglass` expects `--staff-modal-glass-surface` which is **not in HEAD CSS** (pre-existing missing contract, not introduced by this delete).

## Progress (2026-07-17) — timetable-first migrate (session start)

**Approach:** dual-write shared shell classes, then prune/tokenize local glass (not strip-first redesign).

### Baseline
- CSS ~117.5k · JS ~177k · `check:panels` 1076/375

### Done
1. **Timetable** — dual-write `lux-soft-chrome` on command; tests aligned to current multi-panel token rules.
2. **Registration** — dual-write `lux-page-shell`, `lux-summary-surface--hero`, `lux-soft-chrome` on metrics/command/filters; tokenize modal blur/shadow to `--reg-fade-blur` / `--lux-elev-3`; drop local soft-shadow CSS vars.
3. **Personal-data** — dual-write `lux-hero` + `lux-summary-surface--hero` on hero.
4. Panels improved **1076/375 → 1073/371** (ratcheted).

### Verify
- `test/registration-route-regressions.test.js` green
- `test/timetable-route-regressions.test.js` green
- `check:panels` green

### Next
- Prune more registration paint that only restates tokens
- study-card / programs dual-write shell
- Continue route-by-route; no social rewrite yet

## Progress (2026-07-17) — Week 1 max-LOC cuts (AI-only)

**User note:** coding is AI-driven end-to-end.

| PR | Work | Δ LOC (approx) |
|----|------|----------------:|
| W1.1 | Delete orphan **`lms-route.css`** (unlinked); recover missing session-marker gradients into `lms-gradebook-misc.css` | **−8.0k** net (orphan gone; +~small recovery) |
| W1.2–1.3 | **`social-projects-lms.css`**: remove duplicate paste block; strip dead create-drawer / hub header/stats | **−1.2k** |
| W1.4 | Global **`kiu-btn*` CSS** purge (0 JS/HTML emit) | **−0.26k** |
| W1.5 | Dead **admin-hero-metrics / mini-grid / saved-views** etc. | **−0.15k** |
| — | `check:panels` **1073/371 → 999/366** | ratchet |

**CSS total:** ~117.5k → **~108.0k** (**≈ −9.5k**)

**Verify:** registration regressions green; lms-route-regressions; session-marker + project-create dialog after recovery/utilities fix.

## Progress (2026-07-17) — Week 2 dual-write → peel

| Step | Work | Notes |
|------|------|-------|
| A | Personal-data exclusive rules out of luxury → route; strip dead social/detail-grid | luxury thinner; PD tests green |
| B | Registration exclusive luxury peel; drop pure token glass; strip style-attr hacks | reg tests 18/18 |
| C | Study-card soft-chrome + page-shell dual-write; exclusive luxury peel | study tests green |
| E | Programs: `lux-page-shell` + focus soft-chrome dual-write only | no island delete yet |

**CSS total:** ~108.1k → **~106999**  
**index-luxury:** → **11894** lines

## Progress (2026-07-17) — continue after Week 2

| Work | Result |
|------|--------|
| Programs exclusive luxury peel | luxury −~1.0k; route owns paint |
| Chancellery small exclusive peel | few rules |
| LMS exclusive luxury peel → `lms-workspace-chrome` | luxury −~1.0k+; LMS shell dual-write soft-chrome on hero/focus |
| Staff exclusive peel | small |

**CSS total:** **~105774** (campaign from ~117.5k)  
**index-luxury:** **9615**  

Verify: programs/reg/PD/study/chancellery/lms-route regressions green. staff-modal-warmglass still missing token (pre-existing).

## Progress (2026-07-17) — next wave after Week 2

| Step | Work |
|------|------|
| 1 | Admin-scheduler exclusive peel from luxury → route |
| 2 | Admin-tools `lux-page-shell` dual-write; exclusive admin-tools peel |
| 3 | LMS workspace-chrome pure glass prune on dual-written hero hosts |
| 4 | Social-rebuild pre-neo selector prune + utilities allowlist |
| 5 | Staff modal warmglass tokens + light shell + lux-modals schema-empty |

**CSS total:** **~105135** (from campaign ~117.5k)  
**index-luxury:** **8438**

## Progress (2026-07-17) — wave closeout: lux-droplist SSOT restore

| Step | Work | Result |
|------|------|--------|
| A | Restore global `.lux-droplist-panel` shell into `lux-controls.css` (from backup `/home/reksi/2/test/asd26`) | tokens + open/close + warmglass + calm hover |
| B | Scheduler route guards only; drop `sch-session-picker-panel` shell paint | `display:none` closed guards; modal row layout |
| C | Route paint exclusions `:not(.lux-droplist-panel)` | luxury, library, social surveys/rebuild, admin-orders |
| D | Tokenize droplist shadows; allow `lux-droplist` in `check:panels` | no snowflake growth |
| E | Cache pin `20260713-accentborder2` (fixture + HTML + recovery test) | contract aligned |

**Verify (42/42):** admin-scheduler-recovery · scheduler-session-picker-droplist · scheduler-session-modal-layout · lux-droplist-global-unification · lux-picker-open-close-animation · lux-picker-calm-hover · lux-picker-compact-options · staff-hub-modal-warmglass · admin-tools-route-regressions

**CSS total:** **~105.4k** (droplist restore +~0.3k net vs mid-wave ~105.1k)  
**index-luxury:** **8433**  
**check:panels:** **962/352** (boxShadow ratcheted 963→962)

**Wave after Week 2 — CLOSED** (peels + dual-writes + droplist SSOT green).

### Next (after this closeout)
1. Registration pure-token prune on dual-written hosts  
2. Admin-tools domain paint thin (luxury leftovers)  
3. Defer social Isolation dual-write

## Progress (2026-07-17) — reduction wave: reg prune + admin-tools peel

| Work | Result |
|------|--------|
| Registration dead-class purge | Removed pure rules for mini-metric / hero-focus-grid / insight-grid / control-row / focus-card / admin-glass-btn |
| Dual-write peel paint | Dropped hero / insight-card / filter-shell from raw peel mega-lists (shared soft-chrome / summary-surface) |
| Tokenize remaining peel/modal glass | `var(--reg-fade-*)` |
| Admin-tools exclusive layout peel | `.lux-admin-tools-hero` chrome → `admin-tools-luxury`; drop multi-list co-entries from luxury |
| ATL hygiene | Remove route `#app-content` sidebar push; no `transition: all` |
| Shell contract restore | Desktop `@media (min-width: 1181px)` unified-shell overlay block (missing SSOT for overlay tests) |

**Verify:** registration-route-regressions 18/18 · admin-tools-route-regressions · admin-tools-interaction-safety green

**CSS total:** **~105.4k** (≈ −40 net this slice; reg **3561→3446**)  
**index-luxury:** **8453** (peel − then +overlay SSOT)  
**check:panels:** **958/352** (boxShadow ratcheted 962→958)

### Next
1. More registration pure-token / paintless-host dedupe (still fat opacity/blur clone blocks)
2. Finish admin-tools luxury leftovers (global `.lux-control` dups in old exclusive zone)
3. Faculty-gradebook / SSVC dual-write prune
4. Defer social Isolation

## Progress (2026-07-17) — PR1 dead harvest (high confidence)

| Work | Result |
|------|--------|
| `public-social-*` class islands | **deleted** from `social-rebuild.css` (kept `#public-social-root` scope for neo) |
| `social-project-chat-launch` + analytics/meeting-footer ghosts | stripped |
| `social-neo-groups-hero-stats` comment block | deleted |
| LMS dead `lms-call-card` / `create` / `session-list` shells | deleted (kept `lms-call-card-kicker` + classroom) |
| Luxury dual-written **timetable** glass | ~117 lines deleted (route owns tokens) |
| Luxury unscoped admin-tools redesign + `.lux-control`/btn dups | ~391+ lines deleted |
| Empty notif/calendar stubs | deleted |
| Utilities pre-neo soft-surface ghosts | removed from soft-surface lists |
| Tests | mobile public-social → **absence**; chat-parity cache/thread locks updated |

**Verify (45/45 core):** social-mobile · public-social-runtime · social-project-chat-parity · lms-calls-module-split · admin-tools ×2 · timetable · registration · staff-hub-modal-warmglass

**CSS total:** **~104.4k** (was ~105.4k, **≈ −1.0k**)  
**social-rebuild:** 19528 → **19232**  
**index-luxury:** 8453 → **7834** (**−619**)  
**lms-workspace-chrome:** 2722 → **2688**  
**check:panels:** **947/346** (ratcheted 958/352 → 947/346)

### Next (PR2+)
1. Profile-view exclusive peel (~1.2k off global luxury)
2. Registration soft-chrome restates + LMS hero raw co-list prune
3. Rebuild project paint-only thin

## Progress (2026-07-17) — PR2 profile-view exclusive peel

| Work | Result |
|------|--------|
| Peel exclusive `body.lux-route-profile-view` / `lux-entry-profile-view` from `index-luxury` | **107 rules**, ~0 positive exclusive left in luxury |
| Destination | `profile-view-route.css` (shell redesign base + peel) |
| Token hygiene | `--pv-fade-*` → `var(--lux-panel-*)`; peel raw shadow/blur → elev/panel |
| Shared exclusions | kept (`:not(.lux-route-profile-view)` on nonhome painters) |

**Verify:** profile-view-route-regressions · shell-redesign · source-regressions · access · mobile-shell (10 tests) · reg/admin-tools/timetable smoke

**CSS total:** **~105.1k** (route owns PV; luxury thinner for all other pages)  
**index-luxury:** 7834 → **7530** (**−304** exclusive payload)  
**profile-view-route:** **~1977** (route-owned SSOT)  
**check:panels:** **937/344** (ratcheted 947/346 → 937/344)

### First-paint win
Non–profile-view pages no longer download exclusive PV type/table/layout rules from `index-luxury`.

### Next
PR3: registration soft-chrome restates + LMS hero raw co-list prune

## Progress (2026-07-17) — PR3 registration + LMS dual-write harvest

| Work | Result |
|------|--------|
| Registration co-list strip | Dropped dual-write hosts from paint lists: `.lux-soft-chrome`, `.lux-focus-panel`, `.lux-timetable-*`, `.lux-card` (domain classes remain) |
| FULL OPACITY simplify | Multi-stop glass → solid `rgb(...)` fills (dark/light + focus) |
| LMS bare `.page-hero` | Removed from raw glass co-lists (catalog + dual-write own hero) |
| LMS light/content-visibility | Deduped second batch; tokenized remaining clean-card paint → panel SSOT |
| Tests | LMS hero class lock allows `lux-soft-chrome` dual-write |

**Verify (43/43):** registration-route-regressions · lms-workspace-shell · lms-hero-home-parity · lms-route-regressions · lms-group-view-transparency

**CSS total:** **~105.0k**  
**registration-route:** 3446 → **3382** (**−64**)  
**lms-workspace-chrome:** 2688 → **2647** (**−41**)  
**check:panels:** **934/338** (ratcheted 937/344 → 934/338)

### Next
- Admin-tools internal triple-paint dedupe  
- Rebuild project paint-only thin  
- Optional reg BLUR MODEL comment collapse (keep behavior)

## Progress (2026-07-17) — PR4/5 more removal wave

### PR4 Admin-tools harvest
| Work | Result |
|------|--------|
| Dead `:not(.lux-route-admin-tools)` rules | **0 remaining** (never match on ATL-only page) |
| Unified-shell paint reassert | dropped (fade pass owns) |
| Early `.lux-panel` + `.lux-control` paint restates | dropped → fade pass + lux-controls |
| transparency-test-off twins in ATL | deleted |
| Tests | route-regressions updated to live scoped selectors |

**admin-tools-luxury:** 5550 → **5440** (**−110**)

### PR5 freebies
| Work | Result |
|------|--------|
| Luxury `transparency-test-off` island | **19 rules** deleted |
| SSVC dead `lux-route-lms` controls | **3 rules / −22 lines** |

**index-luxury:** 7530 → **7391** (**−139**)  
**student-service-route:** 3187 → **3165**

### Verify
admin-tools ×2 · registration · student-service-redesign-shell — **32/32**  
**check:panels:** **923/338** (boxShadow 934→923)

**CSS total:** **~104.7k** (from ~105.0k)

### Still open (plan)
- Reg Nuclear/BLUR co-list merge (~150–200)
- Luxury experimental multi-route glass co-list (~60–90)
- ATL remaining triple soft/hard HT lists (further collapse)
- Social projects paint-only · faculty soft-chrome dual-write

## Progress (2026-07-17) — big removal wave (reg + luxury + ATL + social)

| Work | Δ LOC (approx) |
|------|---------------:|
| Registration: drop nuclear reassert + peel paint/sheen | **−166** (3382→3216) |
| Luxury: delete experimental multi-route glass block | **~−90** |
| Luxury: admin-reg CMS island + unscoped lux-home-columns | **~−50** |
| ATL: drop HT reinstate (fade pass owns) | **−35** (5440→5405) |
| Social-rebuild: projects shell/hero paint → projects-lms | **~−100** |
| **CSS total** | **~105.0k → ~104.3k** (**≈ −0.7k this wave**) |

**index-luxury:** 7391 → **7253**  
**check:panels:** **921/334** (ratcheted from 923/338)

**Verify (60/60):** registration · admin-tools ×2 · timetable · lms-route · admin-scheduler-recovery · social-project-chat-parity · student-service-shell

### Still available
- Further ATL soft/hard list collapse  
- Faculty soft-chrome dual-write prune  
- More social-rebuild paint vs projects-lms  
- Session-marker peel to shared destination

## Progress (2026-07-17) — continue big removal

| Work | Result |
|------|--------|
| Peel exclusive **admin-scheduler** from luxury → route | exclusive sch gone from luxury; route +54 |
| Strip multi-route **sch-rail/sch-sidebar** from global HT lists | luxury first-paint shrink |
| Faculty: dual-write `lux-soft-chrome` on control-band; drop HT mega reassert | route thinner paint |
| ATL: drop strip-card reassert | small |
| Social: project shell sheen cut | small |

**CSS total:** **~103.9k** (from ~104.3k)  
**index-luxury:** **6964** (from ~7250; campaign luxury ~14k→7k)  
**check:panels:** **921/334**  

**Verify (54/54):** faculty-gradebook · admin-tools · admin-scheduler-recovery · timetable · registration · lms-route · social-project-chat-parity  

### Campaign rollup
| | Start | Now |
|--|------:|----:|
| CSS | ~117.5k | **~103.9k** (**≈ −13.6k**) |
| index-luxury | ~14k | **~7.0k** |
| panels | 1138/405 | **921/334** |

## Progress (2026-07-17) — session-marker peel + continue

| Work | Result |
|------|--------|
| **Session-marker palette** peeled from `index-luxury` → `timetable-route` + `lms-gradebook-misc` | luxury −~180 first-paint |
| Marker tests | point at route CSS, not luxury |
| Faculty | ops tiles + ops-panel `lux-soft-chrome`; hover shadows tokenized |
| Social-rebuild | re-applied PR1 dead harvest after bad over-delete; fade tokens re-aliased panel SSOT |
| Luxury freebies | unscoped admin-table head/scroll |

**CSS total:** **~104.5k** (social restored from HEAD then safe prune; net luxury still down)  
**index-luxury:** **~6773**  
**check:panels:** **915/334** (boxShadow 921→915)

**Verify:** lms-session-marker · timetable · lms-route · social-mobile · social-project-chat · faculty · registration · admin-tools  

### Campaign rollup
| | Start | Now |
|--|------:|----:|
| CSS | ~117.5k | **~104.5k** (**≈ −13k**) |
| index-luxury | ~14k | **~6.8k** |
| panels | 1138/405 | **915/334** |

## Progress (2026-07-17) — bare-shell strip (keep TT/LMS/social)

- **Deleted ~33.9k LOC** of non-keep route paint CSS (registration, admin-*, staff, SSVC, faculty GB, programs, PD, study-card, news, library, orders, exams, profile-view, chancellery, students-admin, …).
- **Added** `assets/css/lux-page-bare.css` (~200 LOC) — token panels + layout min for stripped pages.
- **HTML:** 19 strip pages link bare + `body.lux-page-bare`; keep pages unchanged (timetable/lms/social).
- **CSS total:** ~107k → ~73k.
- **check:panels:** baseline ratcheted (boxShadow 915→725, backdrop 334→279).
- Tests for stripped routes retargeted to bare-shell absence contracts.

## Progress (2026-07-17) — nuclear bare (visual)

- Strip pages no longer link `index-luxury.css` / `lux-surfaces.css` (shared paint was keeping the old look).
- `lux-page-bare.css` rewritten: force `backdrop-filter/box-shadow/background-image: none`, solid surfaces.
- Full paint whitelist: **dashboard (index)**, timetable, LMS, social (`lux-full-paint`).

## Progress (2026-07-17) — Social bare strip

- Unlinked luxury/surfaces + all social paint CSS from `social.html`.
- `ensureSocialStylesheet` no-ops (no lazy paint inject).
- **Deleted ~34.4k LOC**: social-rebuild, social-projects-lms, social-surveys-lms, social-photography-lms, social-material, portfolio-editor.
- CSS total ~74k → **~40k**. Full paint remains: index, timetable, LMS only.

## Progress (2026-07-20) — Wave E6 FE line mass

- **Deleted** never-loaded `assets/js/portfolio/` (6 files, **−616** lines). Live portfolio remains `social-workspace-portfolio-*`.
- Dropped dead optional `window.KiuPortfolioModel` probes (module was never script-loaded).
- Gate: `npm run check:e6` · doc: [`js-fe-line-mass.md`](js-fe-line-mass.md).
