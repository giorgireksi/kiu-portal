# Design system convergence plan

> **Status (2026-07):** Shared SSOT + bare `lux-full-paint` is live. Content dual-write on bare portals is paused; see [`visual-ssot.md`](visual-ssot.md). This plan is historical context — prefer visual-ssot / css-handoff for day-to-day edits.

**Goal:** One visual design (materials + controls + shell patterns) across portal routes, with **less CSS shipped and less total CSS**, without big-bang rewrites.

**Not the goal:** One 100k shared stylesheet. Peels alone. Deleting social/LMS domain structure.

**References:** [`docs/shell-panels.md`](shell-panels.md) · `assets/css/lux-tokens.css` · `npm run check:panels` · timetable as blueprint.

---

## 1. Current state (facts)

| Bucket | ~LOC | Role |
|--------|-----:|------|
| Shared kernel (`lux-*`, base, layout, tokens, mobile) | ~11–18k | Design system + chrome |
| `index-luxury.css` | ~6.8k | Global leftovers / multi-route |
| Route / product CSS | ~100k+ | Per-surface skins (social ~35k, SSVC ~10k, admin family ~26k, LMS shards ~15k, …) |
| FE JS | ~178k | Mostly live features (not pure theme) |

**Already done (do not re-litigate):** panel token SSOT, route `--*-fade-*` → panel aliases, CSS-own strip for non-home, `check:panels` ratchet, partial social CSS lazy-load, lazy Three, high-confidence orphan deletes.

**Problem left:** route files still carry **full glass + layout recipes**; dual control systems; markup not consistently on `.lux-panel-pro` / focus / soft-chrome; global megafile still fat.

**Target outcomes (6–12 weeks of disciplined work, not one PR):**

| Metric | Conservative success | Stretch |
|--------|----------------------|---------|
| CSS LOC | **−20–30%** (~25–40k) | **−35–50%** (~45–65k) |
| Median non-social route CSS | Thin layout-only where possible | |
| Raw box-shadow / backdrop-filter | Baseline **only down** | |
| Golden routes look same (panel/button/type) | timetable · LMS · registration · one admin · social feed | |
| First-paint CSS on non-social routes | Measurable drop | |

---

## 2. Principles (senior rules)

1. **Same design = same materials and controls**, not identical wireframes (whiteboard ≠ feed).
2. **Delete CSS only when markup already uses the shared class** (or selector has zero hits with evidence).
3. **Small PRs:** one pattern × 1–3 routes × tests + visual spot-check.
4. **Ratchet only down** (`check:panels`); never “allow more snowflakes.”
5. **No new** raw multi-stop glass, new `--foo-fade: <literal>`, or parallel button systems.
6. **Home stays exceptional** (`--home-fade-*`) until a later optional phase.
7. **Stop peel-as-strategy** except pure exclusive leftovers with zero multi-route risk.

---

## 3. Design contract (freeze this)

### 3.1 Allowed shared stack (every non-auth portal page)

```
kiu-fonts → base → layout → lux-tokens → lux-surfaces → lux-focus-panel
→ lux-controls → lux-layout-primitives → lux-modals (if needed)
→ thin shell chrome → route CSS (layout only)
```

### 3.2 Primitives (use these; don’t invent)

| Concern | Use |
|---------|-----|
| Panel / card glass | `.lux-panel-pro` / panel tokens / route alias to `--lux-panel-*` |
| Soft chrome / chips | `.lux-soft-chrome` + `--lux-soft-chrome-*` |
| Focus / hero focus | `.lux-focus-panel` / timetable focus shell model |
| Buttons | `.lux-primary-btn`, `.lux-secondary-btn`, panel CTA tokens |
| Inputs | `.lux-control` + lux pickers |
| Layout | route grids only; spacing from existing layout tokens where possible |

**Blueprint page (historical):** timetable route skin archived 2026-07. **Live SSOT:** dashboard (`index.html` + soft-chrome). See `docs/visual-ssot.md`.

### 3.3 Forbidden (new code)

- New raw `box-shadow` / `backdrop-filter` (except `none` / token `var(--lux-…)`)
- New `--*-fade-*` **literal** fills (alias to panel only)
- New `kiu-btn*` (or expand dual systems)
- New glass recipes in JS

### 3.4 Guards (already / add)

| Guard | Status |
|-------|--------|
| `npm run check:panels` | Exists — keep green |
| Fade → panel alias test | Exists |
| Optional later: fail on new `kiu-btn` in touched LMS files | Phase B |
| Optional later: first-paint CSS size smoke per route | Phase D |

---

## 4. Phased plan

### Phase A — Stop the bleed (0.5–1 day)

**Do:**

- Document this plan as the working agreement (this file).
- Confirm `npm run check` includes `check:panels`.
- Add a short “when touching a page” checklist to `docs/shell-panels.md` (link here).
- Freeze: no PR increases snowflake baseline; no new route fade literals.

**Verify:** `npm run check:panels` green on mainline worktree.

**Delete target:** ~0 (process only).

---

### Phase B — Dual system kill: buttons (1–2 weeks, multi-PR)

**Why first:** High visual impact, greppable, real CSS/JS deletion.

**Do (per PR, one area):**

1. Inventory `kiu-btn*` usage (LMS first — docs already call this out).
2. Map each to `lux-primary-btn` / `lux-secondary-btn` / danger variants.
3. Codemod or surgical replace **markup + JS string templates** on one surface (e.g. LMS classroom chrome only).
4. Grep: zero `kiu-btn` on that surface.
5. Delete now-unused `kiu-btn*` CSS rules that only served that surface (or whole family when count hits 0).
6. Update / add a small regression test: “LMS shell does not introduce kiu-btn” or “count of kiu-btn in X does not grow.”

**Order:**

1. LMS non-whiteboard chrome  
2. Any remaining portal pages with `kiu-btn`  
3. Delete global dead `kiu-btn` CSS when unused  

**Verify:** route regression tests + visual LMS dark/light.

**Delete target:** **~3–8k** CSS (+ small JS), if dual system is fully retired.

---

### Phase C — Markup convergence: shell pattern (2–4 weeks)

**Pattern:** Timetable-style **focus hero + command + stage** (already used on registration / study-card style work).

**Do (one route per PR or tight pair):**

1. Pick route from priority list below.  
2. Align outer shell markup classes to shared focus / soft-chrome / panel-pro where missing.  
3. Remove route CSS that only re-paints glass already provided by tokens/primitives (`background`/`backdrop-filter`/`box-shadow` duplicates).  
4. Keep route CSS for **grid, domain widgets, unique components**.  
5. Tests: existing `*-route-regressions` + panel alias; spot-check dark/light/HT.

**Priority order (max learning, lower blast radius first):**

| # | Route | Why |
|---|--------|-----|
| 1 | **timetable** | Blueprint — fix any drift only |
| 2 | **registration** | Already multi-panel focus; prune residual paint |
| 3 | **study-card** / **personal-data** | Medium size; student shell |
| 4 | **programs** | Similar student academic shell |
| 5 | **news** / **library** / **orders** | Smaller route CSS |
| 6 | **admin-scheduler** | Shared sch-* with timetable lessons |
| 7 | **admin-tools** (shell only, not entire Rank A) | Large but high value |
| 8 | **staff** / **students-admin** | Admin family |
| 9 | **LMS shell** (not whiteboard/quiz domains) | High traffic |
| 10 | **social feed shell** (not projects domain CSS) | Materials only |
| 11 | **student-service** | Huge; only after patterns proven |

**Verify:** per-route vitest; `check:panels`; manual golden set.

**Delete target:** **~15–30k** CSS cumulative if paint rules collapse.

---

### Phase D — Payload efficiency (parallel, low risk)

**Do:**

1. Finish social satellite lazy CSS if any gap remains (projects/photo/surveys).  
2. Ensure heavy LMS tab CSS/JS stays lazy where architecture already supports it.  
3. Optional: script that reports **linked CSS KB per HTML entry** (benchmark, not CI gate at first).  
4. Starve `index-luxury`: only multi-route / exclusion chrome; no new exclusive islands.

**Verify:** network tab / simple size script on 3 routes.

**Delete target:** mostly **first-paint**, not always repo LOC. Repo: small.

---

### Phase E — Elev / snowflake migration (ongoing, opportunistic)

**Do:** When touching a file, replace raw `box-shadow` / `backdrop-filter` with `var(--lux-elev-*)` / `var(--lux-panel-*)`.  
Lower `check-panel-snowflakes` baseline when count drops (tool already prefers down-only).

**Delete target:** line count flat-to-down; **quality** up; baseline 1342 → lower over time.

---

### Phase F — Dead selector harvest (after C)

**Do:**

1. For a route CSS file, list class selectors.  
2. Evidence: not in that route’s HTML/JS templates (and not dynamic concat).  
3. Delete with test lock.  
4. Never mass-delete from “unused class” heuristics alone (admin-reg false positives before).

**Delete target:** **~2–10k** extra after markup convergence.

---

## 5. What we will not do in this program

- Rewrite social-projects or whiteboard into “one card class” in one PR.  
- Raise snowflake baseline to land peels.  
- Multi-route selector split that **duplicates** raw shadows across files.  
- Force home dashboard onto non-home panel recipe (optional later).  
- Commit to “−70% of whole FE” without cutting products.

---

## 6. PR template (every convergence PR)

```text
## Pattern
(e.g. buttons · focus shell · panel paint prune)

## Routes touched
-

## Markup changes
- [ ] Uses lux primitives / no new glass literals

## CSS deleted (not moved)
- ~N lines in file X (what selectors)

## Verify
- [ ] npm run check:panels
- [ ] targeted vitest …
- [ ] visual: dark + light (+ HT if paint)
```

---

## 7. Success checkpoints

| Checkpoint | Exit criteria |
|------------|----------------|
| **A done** | Plan + guards agreed; no baseline raises |
| **B done** | `kiu-btn` gone or confined with zero growth; CSS −3k+ |
| **C mid** | 4+ student/admin routes paint-thin; golden look match timetable materials |
| **C done** | Priority 1–9 materials unified; CSS −20%+ from plan start |
| **D** | Non-social first-paint CSS clearly smaller |
| **F** | Dead selector pass on top 5 route files |

---

## 8. Suggested first implementation slice (after plan approval)

**Slice 1 (small, proves pipeline):**

1. Phase A checklist link in `shell-panels.md`.  
2. Inventory `kiu-btn` counts by directory.  
3. One LMS surface: replace `kiu-btn` → `lux-*`, delete dead rules for that surface, add absence test.  
4. Report LOC before/after + screenshots note.

Then continue Phase B → C registration paint prune (no markup risk if already on focus shell).

---

## 9. Ownership / cadence

- **Cadence:** 1–3 convergence PRs per week max (avoid thrash with feature work).  
- **Review:** design contract + “deleted not moved” + tests.  
- **Scoreboard:** CSS LOC, snowflake counts, first-paint KB (optional), not `index-luxury` line count alone.

---

## 10. Summary

| Question | Answer |
|----------|--------|
| Same design? | Yes — tokens + primitives + markup migration |
| Smaller files? | Yes — delete paint/dual systems after markup; target **−20–30% CSS** |
| Without breaking? | Small PRs, blueprint route, tests, visual golden set |
| First code after plan? | Phase A + first `kiu-btn` → `lux-*` LMS slice |

---

## 11. Agent recon (2026-07-17) — risk reduction

Two read-only explores ran before first implementation slice.

### kiu-btn inventory (Phase B)

- **~364** line matches (JS+CSS+HTML); LMS dynamic templates dominate (~half of JS).
- Dual CSS already pairs `.lux-primary-btn, .kiu-btn-blue` in `lux-controls.css` / LMS skins → **markup swap first, CSS death last**.
- **Safest PR1:** materials (+ optional file-storage) only — not whiteboard / live quiz / quiz workspace.
- **Do not delete** global `.kiu-btn*` until greps are empty; student-service catch-all `:not(.kiu-btn-*)` is a false-friend.

### Paint-prune risk map (Phase C)

- Fade→panel **aliases already green** on tt/reg/study-card/personal-data.
- **`lux-panel-pro` unused** on golden routes — cannot justify big paint deletes yet.
- **RED:** dual-write tests expect `lux-focus-panel` on timetable/registration HTML; markup may lag.
- **Safest paint path:** dual-write focus class on blueprint routes first → personal-data paint prune → registration shell only (not domain/modals).

### Landed after recon

- Phase A checklist + plan link in `docs/shell-panels.md`.
- Materials + file-storage: `kiu-btn-blue`→`lux-primary-btn`, `kiu-btn-outline`→`lux-secondary-btn`; materials test forbids remaining `kiu-btn`.

### Landed continue (same day)

- LMS content-library, week-store, assignments, personal-dashboard, materials, file-storage, lms.html trigger: **kiu → lux** (classroom chrome path).
- Dual-write `lux-focus-panel` on **timetable** + **registration** hero asides; link `lux-focus-panel.css` on pages missing it (e.g. programs, timetable).
- Efficient timetable focus: `backdrop-filter: none` on hero-focus (keeps no re-blur contract).
- Personal-dashboard CSS dual-selects lux for share-done / history actions.
- **LOC deleted this slice: ~0** (renames + small dual CSS adds). **Dual-system hits removed from safe LMS modules: ~38.** Remaining LMS kiu ~161 (quiz/whiteboard/live/calls/classroom-tabs/protected).
### Landed continue 2

- classroom-tabs + interaction-messages: kiu→lux; LMS page kiu hits **~140** left (quiz/whiteboard/live/calls/protected only).
- **personal-data-route.css 1306→1249 (−57)** — collapsed triple paint selector lists + nuclear dual list; inset sheen → `--lux-elev-1`.
- Real CSS reduction starts here (Phase C-ish prune); Phase B still ~0 LOC until global kiu CSS death.

### Landed continue 3

- **calls** kiu→lux (24); LMS page kiu left **116** (quiz/whiteboard/live/protected only).
- **registration-route** paint list collapse **4331→4303 (−28)**.
- Dead **`.lms-call-card*`** CSS removed from workspace chrome; live layout classes **recovered** as structural block (tests green).
- Cumulative real CSS delete this program (pd−57 + reg−28 + dead calls net): **order of ~100 lines**, plus dual-system surface shrinking.

### Landed continue 4

- **protected-quiz** kiu→lux (10); LMS page kiu left **106** (quiz workspace 61, whiteboard 25, live 20).
- **study-card-route** light dual-list collapse **1763→1741 (−22)**.
- Cumulative paint prune ~**107** CSS lines (pd+reg+sc).

### Landed continue 5 — bulk

- **All LMS page modules** kiu→lux (**0** hits in `assets/js/pages/lms-*.js`). Remaining JS kiu: app.js selectors (12), luxury-index modernizer (6), lms.js dual detect (2).
- Dual CSS compounds updated (quiz library, live broadcast/control).
- Light dual-list collapse: **~108 lines** (programs −68, admin-library −30, others small).
- Answer on parallelism: multi-file mechanical renames OK in one PR; shared CSS death + multi-agent same-file = risk.

### Landed continue 6 — kiu death + dual-light bulk

- **Product `kiu-btn` = 0** in assets/js + assets/css (dual CSS rewritten to lux; base legacy button block deleted −36 lines).
- Dual-light collapses: programs −68, admin-library −30, + small routes (~108 earlier in batch).
- SSVC: catch-all primary-gradient on bare buttons removed; light hero-action bare selectors cleaned for contract test.
- Remaining SSVC test fails (summary-grid / efficient qa-card) look like pre-existing redesign drift, not kiu migration.
- **Phase B effectively complete** for markup+CSS; only absence locks in tests may still mention kiu.
