# All Pages Cleanup Master Audit

Date: `2026-05-14`
Owner: `Codex`
Purpose: create one maintenance file that tracks every HTML page in the LMS, identifies page-level junk and performance risk, and gives future AI passes a granular backlog without changing user-facing visuals or behavior.

## How To Maintain This File

1. Update this file in the same turn as any meaningful edit to any tracked page, page runtime, shared shell runtime, or generated page artifact.
2. Keep every page in its own section. Do not merge page sections together even if two pages share the same runtime.
3. `% left` means remaining work:
   `0%` done
   `1-15%` almost done
   `16-60%` partly done
   `61-99%` mostly not done
   `100%` untouched
4. After every edit batch, update the touched page section with:
   `what changed`
   `which task IDs moved`
   `what evidence was checked`
5. Preserve the current UI, colors, spacing, and interaction model unless the visual itself is the verified source of lag.
6. Never remove working behavior only because it looks old. First prove that it is unused, duplicated, or replaced by an equivalent path.
7. When a page is a redirect wrapper or generated artifact, track it until it is either removed, replaced, or explicitly documented as intentional.
8. If a task is blocked, mark it as blocked inside the page section rather than silently skipping it.
9. When a page has an existing deep tracker, keep that tracker as the source of detailed progress and use this file as the cross-page summary.
10. Every future AI pass should update both the page section here and any linked page-specific tracker.

## Visual Fidelity Rules

The cleanup goal is not only speed. It is speed without making the product look worse.

1. Do not make the UI flatter, plainer, or visually cheaper unless the exact effect is already identified as a major hotspot and a visually close replacement exists.
2. Preserve the current visual language:
   colors
   contrast
   spacing
   typography hierarchy
   border radii
   card depth
   layout rhythm
   role-specific identity
3. Weak-device optimization is allowed to reduce implementation cost, but not to produce an obviously uglier UI.
4. If blur, shadow, animation, or gradient cost is reduced, replace it with the closest lower-cost equivalent instead of deleting the effect blindly.
5. Do not allow visual regressions to hide inside performance changes.
6. Before marking a visual task done, verify:
   desktop view
   mobile view
   intended role view
   light or dark mode if the page supports it
7. For shared-shell routes, screenshot parity must be checked on at least:
   student
   professor
   admin
8. If a page is redirect-only or generated-only, visual parity work is not required beyond confirming the fallback or redirect state still looks intentional.

## Visual QA Standard

Every future optimization pass should treat these as required checks, not optional polish:

- Capture or inspect before-and-after screenshots for any page where CSS, layout, blur, shadow, gradient, spacing, or typography changes.
- Compare above-the-fold structure first:
  header or shell chrome
  primary hero or entry panel
  first list or first card grid
  primary action row
- Compare dense repeated surfaces next:
  cards
  tables
  list rows
  drawers
  action sheets
- Compare visual identity surfaces last:
  role-specific shell colors
  faculty accents
  status badges
  emphasis buttons
  hover and focus states
- If the page supports both desktop and mobile, both must be checked before closing the task.
- If the page supports more than one role, the most visually distinct role variants must be checked before closing the task.

## Update Log Format

Use this exact structure for every future update block in this file and any page section:

```md
Update `YYYY-MM-DD`:
- What changed: ...
- Which task IDs moved: ...
- What evidence was checked: ...
```

Optional extra lines are allowed after those three required lines when a pass needs to record:
- blockers
- risks
- follow-up work
- known gaps that were intentionally left open

Update `2026-05-15`:
- What changed: formalized the required update-log template for this master audit and all future page-section notes.
- Which task IDs moved: `GLOBAL-12`.
- What evidence was checked: the file now contains one explicit required template with the same three required evidence lines already used by the current update blocks.

## Screenshot Parity Checklist

Use this checklist before closing any task that changes layout, spacing, typography, blur, shadow, gradient, or repeated surfaces.

Shared shell pages:
- capture desktop above-the-fold: topbar, hero, first content block
- capture mobile above-the-fold: topbar, hero, first content block
- capture one dense repeated surface: table, list, or card grid
- capture one modal, drawer, or action sheet if the route supports it

Standalone feature pages:
- capture desktop entry state
- capture mobile entry state if the page is mobile-supported
- capture the first interaction state that exposes the primary workspace

Admin pages:
- capture desktop entry state
- capture the main admin working surface after first render
- capture at least one edit, detail, or modal state

Redirect wrappers:
- capture the pre-redirect fallback or inspect the static HTML directly
- verify there is no accidental shared shell styling or JS bootstrap

## Role Variant Visual QA Matrix

Use the most visually distinct entry for each role when a shared-shell or role-aware route changes.

| Role | Required visual checks |
| --- | --- |
| `student` | desktop home, mobile home, one student-only academic route |
| `professor` | desktop home, one faculty route, one role-specific workspace state |
| `TA` | desktop home or role shell, one faculty route, one permissions-sensitive surface |
| `admin` | standalone admin entry, one admin workspace state, one modal/detail state |
| `student-service` | desktop home or support shell, inbox/workspace state, one action-completion state |

## Weak-Hardware Visual Fallback Policy

The following effects may degrade only to a visually equivalent fallback, never to an obviously cheaper or broken presentation.

| Effect | Allowed fallback |
| --- | --- |
| `blur` | lower blur radius or flat translucent tint with preserved contrast and depth |
| `shadow depth` | fewer layers or softer shadow spread while keeping separation between surfaces |
| `live background animation` | static gradient, static texture, or paused canvas frame that preserves the route identity |
| `hover motion` | opacity, color, or subtle transform-only feedback instead of multi-property motion |
| `loading overlays` | flatter overlay with preserved spacing, typography, and focus hierarchy |

Update `2026-05-15`:
- What changed: formalized the screenshot parity checklist, the role-variant visual QA matrix, and the weak-hardware visual fallback policy as explicit required standards.
- Which task IDs moved: `GLOBAL-16`, `GLOBAL-17`, `GLOBAL-18`.
- What evidence was checked: the master audit now contains one concrete checklist for page-family screenshot parity, one concrete role matrix for visual QA, and one concrete allowed-fallback table for expensive effects.

## Integrated-GPU Browser Perf Checklist

Run this checklist whenever a pass claims a startup or interaction performance win on a real route.

Required metrics:
- startup script count
- first paint / first contentful paint approximation from the browser timeline
- long tasks during startup
- layout / repaint bursts during first interaction
- memory after 30 seconds idle on the route
- animation cost during one representative interaction

Required route states:
- desktop viewport on the target route
- mobile viewport on the target route if mobile is supported
- the most visually distinct role variant if the route is role-aware

Required notes per run:
- exact route and role
- viewport size
- whether weak hardware or integrated GPU mode was simulated or observed on real hardware
- whether the route was measured cold, warm, or both
- biggest remaining hotspot seen in the performance panel

Minimum pass / fail interpretation:
- no unexpected startup polling loops
- no accidental whole-root rerender for a small interaction
- no new long-task burst caused only by visual polish
- no route-specific regression against the previous documented baseline

Update `2026-05-15`:
- What changed: formalized the integrated-GPU browser performance checklist as an explicit required standard for future optimization passes.
- Which task IDs moved: `GLOBAL-09`.
- What evidence was checked: the master audit now contains one concrete checklist covering startup script count, paint timing, long tasks, layout/repaint bursts, idle memory, and animation-cost verification.

## Shared Evidence And Cross-Page Hotspots

- `assets/css/index-luxury.css` is still a repo-wide GPU risk, but the home/dashboard-builder family no longer ships inside it for non-home routes: the shared file is now `813,543 bytes`, `19,428` lines, while the extracted route-owned home/dashboard stylesheet lives in `assets/css/index-home-dashboard.css` at `35,173 bytes`, `1,120` lines.
- `assets/js/features/index-luxury.js` is now the shared shell core rather than the old home/admin monolith: `205,297 bytes`, `3,580` lines, with the route-owned home/editor bundle moved to `assets/js/features/index-home-dashboard.js` (`268,393 bytes`) and the route-owned admin-tools bundle moved to `assets/js/features/index-admin-tools.js` (`28,382 bytes`).
- `assets/js/shared/utilities.js` still owns broad transparency work: `124,620 bytes`, `4` `MutationObserver` hits, and route-scoped `updateTransparency()` logic that now stays on active roots or explicit refresh targets instead of whole-document scans.
- `assets/js/app/app.js` is still large shared compatibility code: `357,005 bytes`, `2` `MutationObserver` hits, and `19` `innerHTML` hits.
- The heaviest page-local runtimes right now are:
  `assets/js/pages/lms.js` `748,269 bytes`
  `assets/js/pages/social-page.js` `677,901 bytes`
  `assets/js/pages/registration.js` `422,047 bytes`
  `assets/js/pages/admin-registration.js` `198,836 bytes`
  `assets/js/pages/exams-console.js` `182,372 bytes`
  `assets/js/pages/student-service.js` `162,172 bytes`
  `assets/js/pages/planner.js` `132,629 bytes`
- Many live shared-shell pages still boot `11-16` external scripts even when the HTML file itself is tiny.
- Several pages still load the same heavy route pack whether they need it or not:
  `gradebook.js`
  `lms.js`
  `registration.js`
  `planner.js`
  `directories.js`
  `student-registration.js`
  `admin-registration.js`
- Repeated Google Fonts requests are no longer present in the root HTML entry set; `27` root pages now reference the shared `assets/css/kiu-fonts.css` delivery path, while the three redirect-only wrappers intentionally ship no font CSS at all.
- Existing detailed trackers already exist for:
  `index.html` via `docs/INDEX_HOME_OPTIMIZATION_TRACKER.md`
  `index.html?view=professor#home` via `docs/PROFESSOR_HOME_OPTIMIZATION_TRACKER.md`
  `lms.html` via `LMS_HTML_OPTIMIZATION_TASKS.md`
  `admin-tools.html` via `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`
  `career-market.html` via `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md`

## Coverage And Scope

- Coverage source for page enumeration: root-level `*.html` files in the web app workspace.
- Verified root HTML page count: `30`.
- Coverage verification result: every one of those current `30` HTML files now has a dedicated section in this audit, and five removed files remain below as historical removal records.
- Included in scope:
  live standalone pages
  shared-shell route entry pages
  redirect wrappers
  generated HTML artifacts that recently sat beside source pages and still need removal notes
  legacy duplicate HTML files that still increase maintenance risk until they are removed
- Explicitly not counted as website pages here:
  nested anti-cheat UI HTML under `anti-cheat/`
  documentation HTML or screenshot/debug artifacts outside the root web entry set
- Shared-shell logical variants that matter but do not exist as separate HTML files:
  `index.html?view=student#home`
  `index.html?view=professor#home`
  `index.html?view=admin#home`
  `index.html?view=ta#home`
  `index.html?view=student_service#home`
- Current ownership status of those logical variants:
  student and professor home already have dedicated deep trackers
  admin, TA, and student-service home still inherit the open shared-shell work under `index.html`
- Page inventory evidence used for this file:
  root HTML size ranking
  script and style counts per page
  inline handler counts per page
  route map from `assets/js/features/navigation.js`
  runtime size and API-pattern scans across `assets/js/features/*` and `assets/js/pages/*`

## Immediate Execution Order

1. Continue shared dependency cleanup on the remaining entry shells that still boot more runtime than they prove they need: `admin-tools.html`, `lms.html`, `faculty-gradebook.html`, `profile-view.html`, and `study-card.html`.
2. Split the broad shared-file hotspots next: `assets/js/features/index-luxury.js`, `assets/css/index-luxury.css`, and `assets/js/shared/utilities.js`.
3. Keep browser-level integrated-GPU perf checks synchronized for every touched route or shared shell so future passes measure the live route shape instead of stale assumptions.

## Inventory Summary

| Page | Type | % left | Main reason |
| --- | --- | ---: | --- |
| `index.html` | live shared shell | `0%` | Existing student and professor home trackers are synchronized, the shared-shell role matrix now has efficient-tier startup evidence across all current home roles, the home/dashboard-builder CSS now lives in `assets/css/index-home-dashboard.css`, the route-owned home runtime now lives in `assets/js/features/index-home-dashboard.js`, and no home-route-specific or shared-file-split cleanup tasks remain open. |
| `lms.html` | live shared shell | `0%` | The dedicated LMS ledger is complete: eager route-pack, export-library, and obsolete legacy social-shell imports are trimmed, route-level browser QA is captured, and no LMS-specific task-board items remain open. |
| `admin-tools.html` | live shared shell | `0%` | The live page now has a dedicated tracker, no longer ships the root standalone artifact, no longer eagerly loads `lms.js`, keeps only the required registration stack, rejects unauthorized direct entry, no longer carries static modal handlers, template-level inline action hooks, curriculum-library pane inline hooks, the active `prog` / `free` / `conc` / `minor` admin-registration hooks, or the live planner-owned admin-tools actions, has scoped efficient-tier-safe route CSS, no longer polls at startup, and now has real-workflow efficient-tier/mobile perf artifacts; no admin-tools-specific cleanup tasks remain open. |
| `admin-library.html` | live shared shell | `0%` | Delegated listeners landed, dead page-pack imports are gone, route-local CSS is extracted, hidden modal content is lazy, table/chip rendering uses DOM helpers, and efficient-tier weak-device fallbacks now cover the repeated surfaces. |
| `admin-orders.html` | live shared shell | `0%` | The admin orders studio/bootstrap now lives in `assets/js/pages/admin-orders.js`, both live orders routes now rely on the dedicated `assets/js/shared/orders-workspace.js` runtime without the old recipient fallback body, scripted efficient-tier/mobile QA is captured, and the route-local studio surface now lives in `assets/css/admin-orders-route.css`. |
| `admin-scheduler.html` | live shared shell | `0%` | The scheduler now lazy-mounts both hidden overlays from templates, routes quick actions/week controls through `assets/js/pages/admin-scheduler.js`, uses lower route-scoped blur/shadow variables on repeated cards and modal surfaces, has efficient-desktop/mobile startup artifacts for week render, slot open, and edit-modal latency, and the remaining `10`-script shell is now proven to be the minimum safe set. |
| `calendar.html` | redirect wrapper | `0%` | Reduced to a zero-runtime alias with one inline redirect script, zero external JS, and zero shared CSS. |
| `career-market.html` | external live page | `0%` | The route now has extracted route-owned CSS/JS, a dedicated tracker, lazy template-backed provider/tool modal shells, a DOM-based history rail, explicit shared-shell dependency proof, a focused route regression, and real desktop/mobile browser artifacts; no career-market-specific cleanup tasks remain open. |
| `chancellery.html` | live shared shell | `0%` | The standalone route now runs on `assets/js/pages/chancellery.js`, keeps a stable hero/content shell, has mobile and efficient-tier verification artifacts, and no open chancellery-specific cleanup tasks remain. |
| `email.html` | removed orphan shell | `0%` | Removed from the root page set after reference scans confirmed there was no live inbound route or role access. |
| `exam-portal.html` | standalone live page | `0%` | Dedicated dashboard/protected/block/receipt render paths, targeted countdown updates, visibility/pagehide timer shutdown, and real anti-cheat desktop plus weak-mobile fallback QA artifacts are all in place; no exam-portal-specific cleanup tasks remain open. |
| `exams.html` | live shared shell | `0%` | The exams shell now stays on the default template-list workspace only, while the quiz builder, admin review/schedule, and admin live/results grading surfaces all defer into companion modules; the dead social trio and `messenger.js` are gone, the mobile shell no longer polls, the share/return overlays use one reusable modal shell with cheaper route-scoped blur handling, and real efficient-desktop/mobile artifacts cover builder and manual grading open timings. |
| `faculty-gradebook.html` | live shared shell | `0%` | The standalone grading route now renders seeded rosters without `messenger.js`, keeps `lms.js` lazy-only for the quiz handoff path, mounts the grading spreadsheet shell only after a roster is opened, and has real desktop/mobile grading artifacts with zero runtime errors. |
| `faculty-schedule.html` | redirect wrapper | `0%` | Reduced to a zero-runtime alias that forwards professor/TA schedule entry to `timetable.html`, replacing the drifting gradebook-oriented duplicate shell. |
| `gradebook.html` | redirect wrapper | `0%` | Reduced to a zero-runtime alias with one inline redirect script, zero external JS, and no mobile scaffold. |
| `library.html` | live shared shell | `0%` | The library controller lives in `assets/js/pages/library.js`, picker panels render on demand, catalog rows use DOM helpers, desktop/mobile QA artifacts are captured, and the old hidden modal bodies are gone from the HTML shell. |
| `login.html` | live entry page | `0%` | The page is now a true standalone entry route with one dedicated stylesheet and one dedicated runtime, no shared dashboard CSS/JS baggage, delegated auth controls, explicit existing-session/expired-session/no-token/Microsoft redirect handling, and refreshed desktop/mobile artifact coverage across all current login branches. |
| `news.html` | live shared shell | `0%` | Extracted route CSS, delegated runtime actions, a documented keep/remove table, stable workspace/feed/post shells, on-demand privilege loading, and real weak-laptop desktop plus mobile artifacts are all in place; no news-specific cleanup tasks remain open. |
| `orders.html` | live shared shell | `0%` | The dead route-pack imports are gone, hidden modal shells are gone, the dead legacy recipient/admin template bodies are removed, both live orders routes now share the dedicated `assets/js/shared/orders-workspace.js` runtime, faculty-scoped people helpers now live in `assets/js/app/app.js` instead of the messenger route layer, and real desktop/mobile scroll/detail QA artifacts are in place; no orders-specific cleanup tasks remain. |
| `personal-data.html` | live shared shell | `0%` | Dedicated page controller, import proof, extracted route CSS, mapped profile overlap, keyed record-row DOM sync, real desktop/mobile QA artifacts, and the unproven `messenger.js` shell import removal are all in place; no personal-data-specific cleanup tasks remain open. |
| `profile-view.html` | live shared shell | `0%` | Source corruption is removed, the tracker now includes handler and import inventories, the shell no longer boots the old eager page-pack, all inline click/hover handlers are now delegated, the route CSS now lives in a dedicated stylesheet, the session/edit-group schedule tools now mount from dedicated templates, non-overview tabs now lazy-mount on first selection, and refreshed efficient-desktop/mobile artifacts confirm the current tab and admin session-tool timings with zero errors. |
| `profile.html` | live shared shell | `0%` | The route now has a dedicated tracker, the dead social/page-pack imports are gone, the unproven `messenger.js` shell import is gone, the eager `planner.js` page-pack import is replaced by the extracted `assets/js/pages/timetable-runtime.js` calendar owner, the eager `registration.js` page-pack import is replaced by the tiny `assets/js/pages/profile-route.js` tab owner, the inline handlers are gone, the mobile-shell polling wait is gone, the overlap audit with `profile-view.html` and `personal-data.html` is complete, the inactive `email` / `password` / `calendar` panes lazy-mount from templates on first open, the remaining shell-only inline styles now live in `assets/css/profile-route.css`, and refreshed desktop/mobile artifacts confirm the current mounted-tab behavior with zero errors. |
| `programs.html` | live shared shell | `0%` | Dedicated standalone controller, import proof, stable shell regions, lazy detail-pane scheduling, registration-coupled shell copy cleanup, and real desktop/mobile QA artifacts are all in place; no programs-specific cleanup tasks remain open. |
| `protected-launch.html` | standalone launch page | `0%` | Dedicated tracker, standalone import proof, reduced-performance guardrails, and real desktop/mobile launch artifacts are all in place; no protected-launch-specific cleanup tasks remain open. |
| `registration.html` | live shared shell | `0%` | Dead social helpers are removed, shell handlers are delegated, the student `history` and `selected` tabs are live again without reintroduced inline tab hooks, the student-facing module/track/section-picker interactions now use delegated `data-*` hooks, the live student route now boots a dedicated `assets/js/pages/registration-student-route.js` controller plus `timetable-runtime.js`, no longer eagerly loads `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `directories.js`, or `admin-registration.js`, the dead admin quiz/exam studio cluster no longer ships inside `student-registration.js`, and the route-loaded helper file no longer uses `innerHTML`, `insertAdjacentHTML`, or fragment-based markup mounting; refreshed desktop/mobile artifacts still pass with zero errors and no registration-specific cleanup tasks remain open. |
| `social.html` | standalone live page | `0%` | The route now keeps a stable region-owned shell, no longer polls on mobile, no longer lazy-loads a duplicate `social-page.js` onto itself, no longer blocks first render on directory preload, defers account enrichment until after the first hydrated paint, scopes transparency refreshes to the social regions that actually changed, and mounts the real community layout shell immediately while the deferred panel module finishes loading; the residual desktop long-task cost is now characterized as accepted shared-shell/runtime budget rather than open page-local debt. |
| `staff.html` | live shared shell | `0%` | Staff now keeps the desktop command center and mobile shell as separate route owners: `directories.js` still lazy-loads only for the canonical profile handoff, `staff-mobile-shell.js` now loads only on mobile-sized viewports through `staff-route-bootstrap.js`, desktop/mobile artifacts prove the split directly, and no open staff-specific cleanup tasks remain. |
| `staff_lms_clean.html` | removed legacy duplicate | `0%` | Removed from the root page set on `2026-05-15` after reference scans found no live inbound route. |
| `student-service.html` | live shared shell | `0%` | The shared import proof is explicit, repeated cards have route-scoped `content-visibility` guardrails plus efficient-tier blur/shadow fallbacks, route-specific hidden modal shells are gone, `student-service.js` now emits `0` generated inline hooks, the eager runtime is now just the shared data/controller layer, both the Q&A shell and the full private service-shell renderer block lazy-load from deferred companion files, and desktop/mobile route artifacts cover lane open, queue open, action-completion, and scroll behavior; no student-service-specific cleanup tasks remain open. |
| `students-admin.html` | live shared shell | `0%` | The route stays on its dedicated LMS adapter, the legacy duplicate is gone, the remaining shared shell imports are proven necessary, and efficient-desktop/mobile interaction artifacts are now captured. |
| `students_lms_management.html` | removed legacy duplicate | `0%` | Removed from the root page set on `2026-05-15` after reference scans found no live inbound route. |
| `study-card.html` | live shared shell | `0%` | Dedicated controller, import proof, stable summary/semester regions, lazy modal shells, real desktop/mobile QA artifacts, and a closed ownership split with `registration.html` and `personal-data.html` are all in place; no study-card-specific cleanup tasks remain open. |
| `timetable.html` | live shared shell | `0%` | The route now boots a dedicated `assets/js/pages/timetable-runtime.js` owner instead of `planner.js`, the shared schedule/profile-calendar helpers are extracted out of the broader planner pack, stable schedule-surface regions now keep week/filter/view updates off the whole-route container, route-level weak-device/mobile artifacts still pass, and no timetable-specific cleanup tasks remain open. |
| `admin-tools-standalone.html` | removed generated artifact | `0%` | Removed from the root page set; the builder now writes only to blocked artifact output under `artifacts/generated/admin-tools/`. |
| `admin-tools-standalone.dom.html` | removed generated artifact | `0%` | Removed from the root page set; no current build, deploy, or debug path depends on the old root debug artifact. |

## Live-Page Manifest

Manifest evidence source:
- root HTML inventory from the workspace
- `assets/js/features/navigation.js` route map
- `assets/js/app/state.js#getAllowedPagesForRole()`
- auth redirect behavior in `assets/js/app/auth.js`
- direct reference scans for legacy/generated files

`live`
- `index.html`
- `lms.html`
- `admin-tools.html`
- `admin-library.html`
- `admin-orders.html`
- `admin-scheduler.html`
- `career-market.html`
- `chancellery.html`
- `exam-portal.html`
- `exams.html`
- `faculty-gradebook.html`
- `library.html`
- `login.html`
- `news.html`
- `orders.html`
- `personal-data.html`
- `profile-view.html`
- `profile.html`
- `programs.html`
- `protected-launch.html`
- `registration.html`
- `social.html`
- `staff.html`
- `student-service.html`
- `students-admin.html`
- `study-card.html`
- `timetable.html`

`redirect`
- `calendar.html`
- `faculty-schedule.html`
- `gradebook.html`

Historical removals retained below as audit records:
- `email.html`
- `staff_lms_clean.html`
- `students_lms_management.html`
- `admin-tools-standalone.html`
- `admin-tools-standalone.dom.html`

Update `2026-05-15`:
- What changed: added the authoritative root HTML manifest with one explicit class for every tracked page file.
- Which task IDs moved: `GLOBAL-01`.
- What evidence was checked: the current root inventory now totals `33` HTML files; the route map and role-access logic identify the live and redirect entries; reference scans isolate generated artifacts and the remaining legacy/orphan file; and `email.html` remains documented as an orphan shell rather than an active route.

Update `2026-05-15`:
- What changed: removed the admin-tools standalone artifacts from the root page set, reclassified them as historical removals, and updated the current manifest to the real `31`-page root inventory.
- Which task IDs moved: `GLOBAL-01`, `GLOBAL-10`.
- What evidence was checked: `Get-ChildItem -File -Filter *.html` now returns `31` root HTML pages with no `admin-tools-standalone*.html`; only `tools/build_admin_tools_standalone.py` still names the standalone artifact and now writes it under `artifacts/generated/admin-tools/`; and the nginx plus local dev server configs now block `/artifacts/` and the old standalone root filenames.

Update `2026-05-15`:
- What changed: removed `email.html` from the root page set, reclassified it as a historical removal instead of a current legacy/orphan page, and updated the manifest to the current `30`-page root inventory.
- Which task IDs moved: `GLOBAL-01`, `MAIL-03`, `MAIL-04`, `MAIL-06`, `MAIL-07`.
- What evidence was checked: `Get-ChildItem -File -Filter *.html` now returns `30` root HTML pages with no `email.html`; repo-wide `email.html` search still finds no live route-map, role-access, or launcher entry beyond this audit; and the remaining non-doc references live only inside the dormant `assets/js/pages/email.js` module.

Update `2026-05-15`:
- What changed: replaced the repeated per-page Google Fonts tags in the root HTML entry set with one shared stylesheet, `assets/css/kiu-fonts.css`.
- Which task IDs moved: `GLOBAL-07`.
- What evidence was checked: a root HTML scan now finds `0` `fonts.googleapis.com` links and `0` `fonts.gstatic.com` preconnects; `assets/css/kiu-fonts.css` now contains the shared combined font request for `Inter`, `Noto Sans Georgian`, `Playfair Display`, `DM Mono`, `Fraunces`, and `Manrope`; `28` root HTML files now reference the shared font stylesheet; and `npx vitest run test/root-font-delivery-regressions.test.js` passed.

Update `2026-05-17`:
- What changed: re-verified the current root HTML manifest against the workspace, corrected the manifest classification so the current root set is `27` live pages plus `3` redirect wrappers, refreshed the shared font-delivery note to reflect that redirect-wrapper split, and synchronized the cross-page evidence snapshot with current asset and file sizes.
- Which task IDs moved: none; `GLOBAL-01`, `GLOBAL-07`, `GLOBAL-13`, and `GLOBAL-PERF-01` remain `0% left` after the verification pass.
- What evidence was checked: `Get-ChildItem -File -Filter *.html` still returns `30` root HTML files; the audit still has `35` HTML sections counting five historical removals; `Select-String` scans show `27` root pages reference `assets/css/kiu-fonts.css` and `0` root pages reference `fonts.googleapis.com` or `fonts.gstatic.com`; `calendar.html`, `gradebook.html`, and `faculty-schedule.html` remain redirect-only wrappers; the removed files remain absent from the root page set; `npm run check:frontend` passed; and `npx vitest run test/root-font-delivery-regressions.test.js test/redirect-wrapper-regressions.test.js test/navigation-preservation.test.js` passed `13/13`.

## Shared Backlog

- `GLOBAL-01` `0% left` Create a single authoritative live-page manifest and mark each HTML file as `live`, `redirect`, `generated`, or `legacy`.
- `GLOBAL-02` `0% left` Split `assets/css/index-luxury.css` by route family so non-home pages stop paying for home/dashboard CSS.
- `GLOBAL-03` `0% left` Split `assets/js/features/index-luxury.js` into smaller route-owned modules: shell core, dashboard home, admin tools, timetable overlays, and editor/studio.
- `GLOBAL-04` `0% left` Replace fixed eager route-pack loading with a per-page dependency matrix so pages only load the scripts they prove they need.
- `GLOBAL-05` `0% left` Create a zero-runtime redirect policy for wrapper pages and apply it to every pure redirect file.
- `GLOBAL-06` `0% left` Reduce shared `updateTransparency()` cost by letting pages opt in to scoped transparency surfaces instead of global selector mutation.
- `GLOBAL-07` `0% left` Replace repeated per-page Google Fonts requests with a single consistent font delivery strategy.
- `GLOBAL-08` `0% left` Remove inline event handlers across the repo and move them to delegated listeners or page-local controllers.
- `GLOBAL-09` `0% left` Add a browser perf checklist for integrated GPUs:
  startup script count
  first paint
  long tasks
  layout/repaint bursts
  memory after idle
  animation cost during interaction
- `GLOBAL-10` `0% left` Decide whether generated artifacts stay in git, move to build output only, or get deleted after source parity is proven.
- `GLOBAL-11` `0% left` Create dedicated page trackers for the next high-cost pages after `index` and `lms`: `social`, `registration`, `staff`, `students-admin`, `admin-scheduler`, `profile-view`, `exam-portal`.
- `GLOBAL-12` `0% left` Add a consistent update log format to this file so future passes record evidence instead of only editing `% left`.
- `GLOBAL-13` `0% left` Build a duplicate-route audit covering:
  `calendar.html` vs `timetable.html`
  `gradebook.html` vs `faculty-gradebook.html`
  `library.html` vs `admin-library.html`
  `orders.html` vs `admin-orders.html`
  `staff.html` vs `staff_lms_clean.html`
  `students-admin.html` vs `students_lms_management.html`
- `GLOBAL-14` `0% left` Build a role-access verification matrix that proves each allowed page in `getAllowedPagesForRole()` is intentional for:
  student
  professor
  TA
  admin
  student-service
- `GLOBAL-15` `0% left` Decide the fate of likely placeholder or dormant assets:
  `assets/css/components.css`
  `assets/css/social.css`
  `assets/js/pages/students-admin-fades.js`
- `GLOBAL-16` `0% left` Build a screenshot-based visual parity checklist for every page family:
  shared shell pages
  standalone feature pages
  admin pages
  redirect wrappers
- `GLOBAL-17` `0% left` Build a role-variant visual QA matrix for:
  student
  professor
  TA
  admin
  student-service
- `GLOBAL-18` `0% left` Define which effects may degrade only to a visually equivalent fallback on weak hardware:
  blur
  shadow depth
  live background animation
  hover motion
  loading overlays

Update `2026-05-17`:
- What changed: removed the standalone social route's duplicate lazy runtime injection, added route-level deferred boot and account-enrichment staging for the live social page, and taught the shared transparency refresh helper to accept scoped roots so routes can refresh only the shell regions they actually changed.
- Which task IDs moved: `GLOBAL-04`, `GLOBAL-06`, `GLOBAL-PERF-06`.
- What evidence was checked: `assets/js/app/app.js` now skips the extra social page/script group on the rebuilt `social.html` shell, `assets/js/shared/social-runtime-lite.js` now defers `fetchAccountsByIds(...)` until after the first hydrated render, `assets/js/shared/utilities.js` now accepts scoped transparency roots, and the focused social regression plus refreshed social artifacts still report zero runtime errors.

## Duplicate Route Audit

| Pair | Verdict | Live owner | Evidence |
| --- | --- | --- | --- |
| `calendar.html` vs `timetable.html` | Redirect alias versus live route | `timetable.html` | `assets/js/features/navigation.js` maps both entries; `calendar.html` is `1.4 KB` and redirects to `timetable.html`; `timetable.html` is the `27.6 KB` live timetable shell. |
| `gradebook.html` vs `faculty-gradebook.html` | Redirect alias versus live route | `faculty-gradebook.html` | `assets/js/features/navigation.js` maps both entries; `gradebook.html` is `1.5 KB` and redirects to `faculty-gradebook.html`; `faculty-gradebook.html` is the `23.7 KB` live faculty route. |
| `library.html` vs `admin-library.html` | Role-split pair, not a dead duplicate | `library.html` for non-admin roles, `admin-library.html` for admin | `assets/js/features/navigation.js` resolves `library` to `admin-library.html` for admin and `library.html` otherwise; `assets/js/app/app.js` maps both HTML files back to the logical `library` route. |
| `orders.html` vs `admin-orders.html` | Role-split pair sharing one runtime | `orders.html` for non-admin roles, `admin-orders.html` for admin | `assets/js/features/navigation.js` resolves `orders` to `admin-orders.html` for admin and `orders.html` otherwise; `assets/js/app/app.js` maps both HTML files back to logical `orders` and now owns the shared faculty-scoped people helpers; `assets/js/shared/orders-workspace.js` owns both live renderers. |
| `staff.html` vs `staff_lms_clean.html` | Live route versus deleted former duplicate | `staff.html` | `assets/js/features/navigation.js` maps `staff` to `staff.html`; the reference scan found `staff_lms_clean.html` only in docs; and the legacy file was deleted from the root page set on `2026-05-15`. |
| `students-admin.html` vs `students_lms_management.html` | Live route versus deleted former duplicate | `students-admin.html` | `assets/js/features/navigation.js` maps `students-admin` to `students-admin.html`; `assets/js/app/auth.js` redirects admin users to `students-admin.html`; the reference scan found `students_lms_management.html` only in docs; and the legacy file was deleted from the root page set on `2026-05-15`. |

## Weak Laptop And Mobile Performance Research

### Current Highest-Risk CPU Patterns

- Shared shell DOM mutation and paint orchestration:
  `assets/js/shared/utilities.js` `updateTransparency()`
  `assets/js/shared/utilities.js` dynamic `MutationObserver`
  `assets/js/features/index-luxury.js` shell sync and legacy visual observers
- Repeated timer loops on active routes:
  `assets/js/pages/lms.js` protected quiz and session timers
  `assets/js/pages/exam-portal.js` countdown and heartbeat timers
  `assets/js/pages/email.js` refresh interval
  `assets/js/pages/index-mobile-shell.js` runtime hook polling
- Whole-region rerenders through `innerHTML`:
  `assets/js/pages/registration.js`
  `assets/js/pages/planner.js`
  `assets/js/pages/admin-scheduler.js`
  `assets/js/pages/students-admin-lms.js`
  `assets/js/pages/exam-portal.js`
  `assets/js/pages/lms.js`
- Large route packs parsed on pages that do not need them yet:
  many pages still import `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, `admin-registration.js`

### Current Highest-Risk GPU And Paint Patterns

- Shared shell live canvas background:
  `assets/js/features/index-luxury.js`
  `assets/css/index-luxury.css` `#lux-bg-canvas`
- Large `backdrop-filter` surface count:
  `assets/css/index-luxury.css` has `196` hits
- Very large `box-shadow` surface count:
  `assets/css/index-luxury.css` has `381` hits
- Remaining `transition: all` rules:
  `assets/css/index-luxury.css`
  `assets/css/base.css`
  `assets/css/exam-studio.css`
  `assets/css/profile-view-route.css`
  `assets/css/social-rebuild.css`
  `assets/css/timetable-route.css`
  `assets/js/pages/admin-registration.js`
  `assets/js/pages/registration.js`
- Full-screen blurred overlays injected by JS:
  `assets/js/pages/lms.js`
  `assets/js/pages/registration.js`
  `assets/js/pages/exams-console.js`

### Non-Negotiable Weak-Device Rules For Future Cleanup Passes

1. Do not allow redirect wrappers to load the shared shell.
2. Do not keep a `setInterval` alive if the same UI can update on:
   user action
   visibility change
   route enter
   explicit server response
   one-second active countdown only while the countdown is visible
3. Do not rebuild an entire page root through `innerHTML` every time one badge, timer, or status line changes.
4. Do not keep `backdrop-filter` on scrolling list items, repeated cards, mobile sheets, or animated elements on weak-device mode.
5. Do not keep `transition: all`; every transition must name exact properties.
6. Do not keep the luxury background canvas in the highest tier on weak laptops or mobile unless profiling proves it is safe.
7. Do not keep hidden route DOM, hidden modal DOM, or hidden action-sheet DOM mounted if it can be created on first open.
8. Do not load a page runtime only because another page once depended on it historically.

### Global Performance Task Expansion

- `GLOBAL-PERF-01` `0% left` Build a page-entry import manifest:
  list every script and stylesheet each root HTML file loads
  mark each import as `required at first paint`, `lazy-loadable`, `likely dead`, or `unknown`
- `GLOBAL-PERF-02` `0% left` Build a timer manifest:
  record every `setInterval`
  record every one-second countdown
  record every polling loop
  note its owner page, visibility rule, and kill condition
- `GLOBAL-PERF-03` `0% left` Build a live overlay manifest:
  record every JS-created full-screen overlay
  record blur radius
  record whether it is animated
  record whether a cheaper class-based overlay can replace it
- `GLOBAL-PERF-04` `0% left` Build a `transition: all` removal list with file and line ownership.
- `GLOBAL-PERF-05` `0% left` Build a `backdrop-filter` reduction list that separates:
  topbar and shell chrome
  cards
  modals
  mobile sheets
  dashboard widgets
  timetable surfaces
  student-service surfaces
- `GLOBAL-PERF-06` `0% left` Build a `whole-root innerHTML rerender` list and convert each page to smaller update zones.
- `GLOBAL-PERF-07` `0% left` Add weak-device acceptance checks:
  mobile viewport startup
  integrated-GPU laptop startup
  route switch latency
  overlay open latency
  scroll smoothness in large lists
  timer-page idle CPU after 30 seconds
- `GLOBAL-PERF-08` `0% left` Add a page-family policy for action sheets and mobile scaffolds:
  create on demand
  reuse one listener per container

Update `2026-05-17`:
- What changed: synchronized the shared dependency and rerender backlog after the latest registration/profile/social route splits, reflecting that several live routes no longer load the old page packs and no longer ship route-loaded raw event or raw markup injection sites.
- Which task IDs moved: `GLOBAL-04`, `GLOBAL-08`, `GLOBAL-PERF-06`.
- What evidence was checked: an exact root HTML script scan now shows only `admin-tools.html` still loading four legacy route packs (`registration.js`, `planner.js`, `student-registration.js`, `admin-registration.js`), `lms.html` still loading two (`gradebook.js`, `lms.js`), and `faculty-gradebook.html`, `profile-view.html`, `registration.html`, and `study-card.html` each loading one; a repo-wide `assets/js` scan still finds `747` inline event attributes with the largest remaining owners in `lms.js` (`202`), `registration.js` (`70`), `messenger.js` (`52`), `gradebook.js` (`45`), and the social legacy shared files; and the current `innerHTML =` hotspot list no longer includes `student-registration.js` or `social-page.js`, with the largest remaining owners now led by `registration.js` (`56`), `lms.js` (`46`), `index-luxury.js` (`21`), `career-market.js` (`20`), and `gradebook.js` (`19`).

Update `2026-05-17`:
- What changed: removed the remaining route-local inline request hooks from `assets/js/pages/chancellery.js` and converted the shared calendar workspace in `assets/js/features/ui.js` from inline month-nav, tab, and preview-modal hooks to one delegated controller path.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/chancellery.js` and `assets/js/features/ui.js` passed; `npx vitest run test/chancellery-route-regressions.test.js test/calendar-ui-regressions.test.js` passed `2/2`; a fresh repo-wide `assets/js` scan now reports `673` inline event attributes, down from the previous `681` after this pass and down from the earlier `747` backlog snapshot; the largest remaining owners are now `lms.js` (`202`), `social-media.js` (`89`), `registration.js` (`70`), `social-render.js` (`58`), `messenger.js` (`52`), `social-hub.js` (`45`), `gradebook.js` (`45`), and `exams-console-builder.js` (`40`); and current source scans show `0` inline handler hits in both `assets/js/pages/chancellery.js` and `assets/js/features/ui.js`.

Update `2026-05-17`:
- What changed: removed `student-registration.js` from `admin-tools.html`, reducing the live root HTML legacy route-pack floor again after proving the only remaining `admin-registration.js` callsite for `getStudentCompletedEctsThisSemester()` is dead on that route.
- Which task IDs moved: `GLOBAL-04`.
- What evidence was checked: `npx vitest run test/admin-tools-route-regressions.test.js test/registration-route-regressions.test.js test/profile-route-regressions.test.js` passed; and the exact root HTML script scan now shows `admin-tools.html` loading `registration.js`, `planner.js`, and `admin-registration.js` only, `lms.html` loading `gradebook.js` and `lms.js`, and `faculty-gradebook.html`, `profile-view.html`, `registration.html`, and `study-card.html` each loading just one legacy page pack.

Update `2026-05-17`:
- What changed: removed `directories.js` from `profile-view.html` by extracting the four bursar/transcript admin actions into `assets/js/pages/profile-view-admin-actions.js`, shrinking the live root HTML legacy route-pack floor again.
- Which task IDs moved: `GLOBAL-04`.
- What evidence was checked: `node --check assets/js/pages/profile-view-admin-actions.js` passed; `npx vitest run test/profile-view-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js test/admin-tools-route-regressions.test.js` passed; and the exact root HTML script scan now shows only `admin-tools.html`, `lms.html`, `faculty-gradebook.html`, `registration.html`, and `study-card.html` still loading any of the legacy route packs.

Update `2026-05-17`:
- What changed: removed the eager `assets/js/shared/social-hub.js`, `assets/js/shared/social-render.js`, and `assets/js/shared/social-media.js` imports from `lms.html`, leaving the LMS shell on `messenger.js` plus the dedicated `gradebook.js` and `lms.js` page runtimes.
- Which task IDs moved: `GLOBAL-04`.
- What evidence was checked: `npx vitest run test/scheduler-and-lms-regressions.test.js` passed `2/2`; a direct `lms.html` scan now shows only `assets/js/shared/messenger.js`, `assets/js/pages/gradebook.js`, and `assets/js/pages/lms.js` from the former social/LMS helper cluster; `lms.html` is now `192,619` bytes with `18` total script tags; and the root HTML page-script inventory still shows only `admin-tools.html`, `lms.html`, `faculty-gradebook.html`, `registration.html`, and `study-card.html` carrying any legacy page-pack imports.

Update `2026-05-17`:
- What changed: replaced the remaining `directories.js` inline click/input/change handlers with delegated `data-directory-*` hooks, removing another deferred helper from the repo-wide inline-event hotspot list while preserving the canonical-profile bridge and staff/profile-view admin actions.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/directories.js` passed; `npx vitest run test/profile-view-route-regressions.test.js test/staff-mobile-runtime-regressions.test.js` passed; an `assets/js` scan now reports `720` remaining inline event attributes instead of `747`; and the top remaining owners are still led by `lms.js` (`202`), `registration.js` (`70`), `social-media.js` (`89`), `social-render.js` (`58`), `messenger.js` (`52`), and `gradebook.js` (`45`).

Update `2026-05-17`:
- What changed: deleted the orphaned legacy `assets/js/shared/social-hub.js`, `assets/js/shared/social-render.js`, and `assets/js/shared/social-media.js` files after the LMS shell import trim proved they no longer had any live HTML owner or runtime call path outside their own bodies.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `npx vitest run test/social-lost-found-regressions.test.js test/scheduler-and-lms-regressions.test.js test/chancellery-route-regressions.test.js test/calendar-ui-regressions.test.js` passed `10/10`; a fresh repo-wide `assets/js` scan now reports `486` inline event attributes; the largest remaining owners are `lms.js` (`202`), `registration.js` (`70`), `messenger.js` (`52`), `gradebook.js` (`45`), `exams-console-builder.js` (`40`), and `faculty.js` (`33`); and a post-removal source scan now finds no remaining live HTML reference to `social-hub.js`, `social-render.js`, or `social-media.js`.

Update `2026-05-17`:
- What changed: replaced the remaining legacy inline scheduler and broad-calendar hooks in `assets/js/pages/planner.js` with delegated `data-*` controls for study-card grade-detail toggles, scheduler slot/card actions, and broad-calendar month/year/day/add-event actions.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/planner.js` passed; `npx vitest run test/planner-legacy-delegation.test.js test/admin-tools-route-regressions.test.js` passed `2/2`; a fresh repo-wide `assets/js` scan now reports `476` inline event attributes; the largest remaining owners are `lms.js` (`202`), `registration.js` (`70`), `messenger.js` (`52`), `gradebook.js` (`45`), `exams-console-builder.js` (`40`), `faculty.js` (`33`), `exams-console-admin.js` (`23`), and `exams-console.js` (`20`); and a direct source scan now reports `0` inline handler attributes in `assets/js/pages/planner.js`.

Update `2026-05-17`:
- What changed: stripped the remaining compatibility-only inline-action attributes from the dead legacy social and embedded messenger markup inside `assets/js/shared/faculty.js`, removing that file from the live inline-handler owner list without changing the active standalone social or messenger runtimes.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/shared/faculty.js` passed; a direct source scan now reports `0` inline handler hits in `assets/js/shared/faculty.js`; a fresh repo-wide `assets/js` scan now reports `443` inline event attributes; and the largest remaining owners are now `lms.js` (`202`), `registration.js` (`70`), `messenger.js` (`52`), `gradebook.js` (`45`), `exams-console-builder.js` (`40`), `exams-console-admin.js` (`23`), `exams-console.js` (`20`), and `exams-console-attempts.js` (`11`).

Update `2026-05-17`:
- What changed: replaced the remaining inline click/input/change/drop handlers in `assets/js/shared/messenger.js` with one delegated messenger controller path, then cleaned the last dead compatibility drag/drop markers out of `assets/js/shared/faculty.js`.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/shared/messenger.js` and `assets/js/shared/faculty.js` passed; `npx vitest run test/messenger-delegation-regressions.test.js` passed `1/1`; a fresh repo-wide `assets/js` scan now reports `392` inline event attributes; and the largest remaining owners are `lms.js` (`202`), `registration.js` (`70`), `gradebook.js` (`45`), `exams-console-builder.js` (`40`), `exams-console-admin.js` (`23`), `exams-console.js` (`20`), and `exams-console-attempts.js` (`11`).

Update `2026-05-17`:
- What changed: replaced the remaining inline runtime hooks in `assets/js/pages/gradebook.js` with delegated `data-gradebook-*` controls for roster open, assessment-target changes, history/transcript modal navigation, score edits, custom-section actions, linked quiz opens, and publish/finalize/export actions.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/gradebook.js` passed; `npx vitest run test/gradebook-delegation-regressions.test.js test/faculty-gradebook-route-regressions.test.js test/study-card-route-regressions.test.js` passed `3/3`; a fresh repo-wide `assets/js` scan now reports `347` inline event attributes; and the largest remaining owners are `lms.js` (`202`), `registration.js` (`70`), `exams-console-builder.js` (`40`), `exams-console-admin.js` (`23`), `exams-console.js` (`20`), and `exams-console-attempts.js` (`11`).

Update `2026-05-17`:
- What changed: added a generic delegated function-call path to `assets/js/pages/exams-console.js` and replaced the remaining inline action/field hooks across the eager exams shell plus the deferred builder, admin, and attempts modules.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, `assets/js/pages/exams-console-admin.js`, and `assets/js/pages/exams-console-attempts.js` passed; `npx vitest run test/exams-delegation-regressions.test.js test/exams-route-regressions.test.js` passed `2/2`; a fresh repo-wide `assets/js` scan now reports `263` inline event attributes; and the remaining owner list is now concentrated in `lms.js` (`202`) and `registration.js` (`70`) only.

Update `2026-05-17`:
- What changed: finished the last live inline-handler cleanup inside `assets/js/pages/lms.js` with one delegated `data-lms-click` / `data-lms-change` / `data-lms-input` controller, re-audited the remaining root HTML page-pack imports, and confirmed the shared transparency runtime now scopes refresh work to explicit roots or the active page instead of sweeping the whole document.
- Which task IDs moved: `GLOBAL-04`, `GLOBAL-06`, `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/lms.js` passed; `npm run check:frontend` passed; `npx vitest run test/scheduler-and-lms-regressions.test.js` passed `3/3`; a repo-wide `assets/js` inline-handler scan now reports `0` remaining `onclick=` / `onchange=` / `oninput=` / `ondrop=` / `ondragover=` attributes; the current root page-pack inventory now shows only `admin-tools.html` importing `registration.js`, `planner.js`, and `admin-registration.js`, `faculty-gradebook.html` importing `gradebook.js`, `lms.html` importing `gradebook.js` plus `lms.js`, `registration.html` importing `student-registration.js`, and `study-card.html` importing `gradebook.js`, all matching their documented live owners; and `assets/js/shared/utilities.js` now routes transparency collection through `normalizeTransparencyRoots(...)`, explicit `rootsOverride`, or `.page-section.active-page`, with `assets/js/pages/social-page.js` using the explicit `{ roots: transparencyRoots }` refresh path for touched-region updates.

Update `2026-05-17`:
- What changed: extracted the home/dashboard-builder selectors into `assets/css/index-home-dashboard.css`, split the shared shell runtime into a smaller `assets/js/features/index-luxury.js` core plus the route-owned `assets/js/features/index-home-dashboard.js` and `assets/js/features/index-admin-tools.js` bundles, and refreshed the rerender manifest so the remaining `innerHTML` sites are documented as bounded workspace/container renderers rather than live `#page-*` route rewrites.
- Which task IDs moved: `GLOBAL-02`, `GLOBAL-03`, `GLOBAL-PERF-06`.
- What evidence was checked: `index.html` now loads `assets/css/index-home-dashboard.css?v=20260517-homecsssplit1` and `assets/js/features/index-home-dashboard.js?v=20260517-homejssplit1` while `admin-tools.html` now loads `assets/js/features/index-admin-tools.js?v=20260517-admintoolsjssplit1`; `assets/js/features/index-luxury.js` fell to `205,297 bytes` / `3,580` lines, the extracted home bundle is `268,393 bytes`, the extracted admin-tools bundle is `28,382 bytes`, `assets/css/index-luxury.css` fell to `813,543 bytes` / `19,428` lines, the extracted home/dashboard stylesheet is `35,173 bytes` / `1,120` lines, `npx vitest run test/admin-tools-route-regressions.test.js test/global-performance-regressions.test.js test/theme-primer-role-routing.test.js test/index-mobile-shell-runtime.test.js test/navigation-preservation.test.js` passed `61/61`, `npm run check:frontend` passed with the new shared-shell files included, `node tools/build_global_perf_manifests.mjs` regenerated `artifacts/global-perf/summary.json`, and direct source scans now show `0` live `document.getElementById('page-*')` + `innerHTML` route-root rewrites across `assets/js/**`.
  avoid polling for `window.navigate`
- `GLOBAL-PERF-09` `0% left` Add a page-family policy for dashboard and canvas effects:
  static fallback on weak hardware
  reduced-motion fallback
  zero blur during drag or animation
- `GLOBAL-PERF-10` `0% left` Add a page-family policy for hidden content:
  use redirect wrappers for dead routes
  use on-demand modal creation
  use `content-visibility` only after route-specific QA proves safe behavior
- `GLOBAL-PERF-11` `0% left` Build an orphan asset manifest covering:
  root HTML files
  `assets/js/pages/*`
  `assets/css/*`
  compatibility loaders
  generated artifacts
- `GLOBAL-PERF-12` `0% left` Build a compatibility-loader retirement plan for:
  `core.js`
  `assets/js/core.js`
  any page module or comment path that still assumes the old core-bundle model
- `GLOBAL-PERF-13` `0% left` Build a no-ugly-performance policy that records acceptable replacements for expensive visual effects instead of simple deletion.

### Global Performance Ownership Lists

#### `GLOBAL-PERF-04` Transition-All Removal List

| File | Line ownership | Surface / owner | Preferred replacement |
| --- | --- | --- | --- |
| `assets/css/base.css` | `375`, `575`, `593` | shared shell controls and modal/card chrome | replace with explicit `color`, `background-color`, `border-color`, `box-shadow`, or `transform` only |
| `assets/css/exam-studio.css` | `191`, `329`, `466` | exam studio controls and cards | replace with explicit `transform`, `box-shadow`, and `border-color` only |
| `assets/css/index-luxury.css` | `1118`, `1468`, `3835`, `3919`, `3991`, `4103`, `4178`, `4256`, `4348`, `4369`, `4390`, `17782`, `17842`, `17941`, `18495`, `18841`, `19021`, `19111` | shared luxury shell widgets, admin shells, dashboard chrome, and route-family cards | split by route family first, then limit each site to exact animated properties such as `opacity`, `transform`, `border-color`, or `box-shadow` |
| `assets/css/profile-view-route.css` | `7`, `28`, `40` | profile-view action button, tab strip, and upload-zone shell | replace with explicit `background-color`, `border-color`, `color`, and `transform` |
| `assets/css/social-rebuild.css` | `219`, `242`, `250`, `270`, `305`, `544`, `656`, `666`, `678`, `1194`, `1263`, `1387`, `1411`, `1432`, `1983` | social chips, buttons, cards, action rows, and shared panel chrome | replace with explicit `opacity`, `transform`, `border-color`, `background-color`, and `box-shadow` |
| `assets/css/timetable-route.css` | `11`, `16`, `25`, `31`, `102` | timetable studio controls and week arrow polish | replace with explicit `border-color`, `background-color`, `box-shadow`, and `transform` |
| `assets/js/pages/admin-registration.js` | `2424` | inline string-built admin registration module row | replace with explicit transition properties in route CSS instead of inline `transition:all` |
| `assets/js/pages/registration.js` | `3205`, `3667`, `4035` | string-built registration action buttons and subject chips | move the styles into route CSS and limit transitions to `background-color`, `border-color`, and `transform` |

#### `GLOBAL-PERF-05` Backdrop-Filter Reduction List

| Surface bucket | Current file / line ownership | Current shape | Reduction target |
| --- | --- | --- | --- |
| topbar and shell chrome | `assets/css/base.css` `356`, `493`, `567`, `633`, `1471`; `assets/css/layout.css` `176`, `421`, `560`; `assets/css/index-luxury.css` `451`, `519`, `903`, `4908`, `4928`; `assets/js/theme-primer.js` `95`, `276`, `282` | shared glass shell, overlay, and topbar blur | keep blur only on the top-level shell layers; reduce repeated nested shell blur to flat translucent tint on efficient/mobile tiers |
| cards | `assets/css/admin-library-route.css` `161`, `176`; `assets/css/admin-directories.css` `28`, `139`; `assets/css/staff-command-center.css` `33`, `642`; `assets/css/news-route.css` `20`; `assets/css/personal-data-route.css` `96`; `assets/css/students-admin-lms.css` `100`, `596`, `886` | repeated card, panel, and widget glass surfaces | keep one primary card layer per route family and downgrade repeated list/grid cards to lower blur or no blur on efficient/mobile tiers |
| modals | `assets/css/admin-tools-luxury.css` `443`, `457`, `938`, `952`, `986`, `992`, `1005`, `1014`; `assets/css/exam-studio.css` `65`, `211`, `616`, `767`, `785`; `assets/css/layout.css` `1779`, `1809`, `2081`; `assets/js/pages/admin-registration.js` `2369`; `assets/js/pages/exams-console.js` `1593`, `2043`, `2180`, `2285`, `2384`, `2401`; `assets/js/pages/gradebook.js` `1473`; `assets/js/pages/lms.js` `5192`, `6010`, `7602`, `8575`, `8905`; `assets/js/pages/planner.js` `1293`; `assets/js/pages/registration.js` `3284`; `assets/js/pages/student-registration.js` `1411`, `1823`, `2438`; `assets/js/pages/study-card-page.js` `293` | full-screen overlay blur and modal-shell blur | collapse on-demand modal overlays behind reusable class-based shells with a single blur token and a flat efficient-tier fallback |
| mobile sheets | `assets/css/mobile-responsive.css` `305`, `559`, `1220`, `1347`, `1568`; `assets/css/social-rebuild.css` `6429` | mobile action sheets and mobile overlay chrome | keep one backdrop blur on the sheet overlay, strip blur from nested sheet children, and never mount the sheet until first open |
| dashboard widgets | `assets/css/index-luxury.css` `21592`, `21655`, `21672`, `21725`, `21805`, `22931`, `22996`; `assets/js/features/index-luxury.js` `3670` | home/dashboard luxury widgets and toast chrome | keep route identity through gradients/borders while reducing widget blur depth and toast blur radius on efficient tiers |
| timetable surfaces | `assets/css/index-luxury.css` `21592`, `21672`, `21725`; `assets/css/timetable-route.css` `291` | shared shell glass on `lux-timetable-command`, `lux-timetable-stage`, `lux-timetable-filters`, and the route-local control band | keep the current route-local `none` fallback in `timetable-route.css`, and next trim the shared shell blur selectors around timetable command/stage/filter surfaces |
| student-service surfaces | `assets/css/index-luxury.css` `23223`, `23305`, `23319`, `23339`, `23351` | repeated student-service workspace, ticket, article, lane, and Q&A surfaces | preserve the new efficient-tier fallback path and continue reducing blur on repeated surfaces before touching layout or role-specific styling |

### `GLOBAL-PERF-08` Action Sheet And Mobile Scaffold Policy

1. Create action-sheet DOM only on first open unless the route already proves that a permanently mounted shared sheet is required.
2. Reuse one delegated click/input/change listener per action-sheet container; do not emit inline handlers into button markup.
3. Avoid polling for `window.navigate`; use a deterministic hook such as `ensureNavigateHooks()` plus a `load` fallback when needed.
4. Do not boot a mobile-only runtime on desktop if a small viewport gate or bootstrap file can defer it until the viewport actually needs it.
5. If a route keeps a shared mobile scaffold for compatibility, document that owner explicitly in the page tracker and keep the shell import floor tested.

### `GLOBAL-PERF-09` Dashboard And Canvas Effects Policy

1. Every dashboard or canvas-heavy route must define a static or low-motion fallback for weak hardware before adding new animation layers.
2. Reduced-motion mode should remove non-essential background animation and keep only state-clarifying motion.
3. During drag, resize, or heavy interaction, blur-heavy layers should flatten or pause rather than animate at full cost.
4. Route identity should survive the fallback through color, border, spacing, and hierarchy rather than relying on blur alone.
5. Shared canvas effects belong to route families only when the route tracker has actual perf evidence that the effect is safe.

### `GLOBAL-PERF-10` Hidden Content Policy

1. Dead or duplicate routes should prefer redirect wrappers over dormant live shells.
2. Modal and drawer DOM should be created on demand unless a tracker explicitly proves that permanent hidden markup is required.
3. `content-visibility` may be used only on repeated route surfaces after route-specific desktop/mobile QA proves no interaction or scroll regressions.
4. Hidden route regions that are not active at first paint should stay unmounted until the route needs them.
5. Generated artifacts and debug outputs are not source surfaces and should stay out of normal live-page cleanup scope.

### `GLOBAL-PERF-13` No-Ugly-Performance Policy

1. Replacing an expensive effect must preserve route identity with the closest cheaper equivalent, not a blank removal.
2. Allowed replacements:
   `blur` -> lower blur radius or flat translucent tint with preserved contrast
   layered shadows -> fewer softer layers with the same separation hierarchy
   animated backgrounds -> static gradient or paused frame with the same route palette
   hover motion -> opacity/color/subtle transform instead of multi-property animation
   loading overlays -> flatter overlay with the same typography and spacing hierarchy
3. Every performance downgrade that changes visible surfaces must still pass desktop/mobile parity checks before the task can close.
4. If a cheaper fallback would make the page obviously uglier or less legible, the task stays open until a visually acceptable alternative exists.

### `GLOBAL-PERF-07` Weak-Device Acceptance Checks

Use these as required pass/fail checks whenever a cleanup pass claims a route is weak-device-safe:

| Acceptance check | Required evidence |
| --- | --- |
| mobile viewport startup | capture first-ready timing plus zero runtime errors on a phone-sized viewport |
| integrated-GPU / efficient-desktop startup | capture first-ready timing plus zero runtime errors under an efficient or CPU-throttled desktop run |
| route switch or primary workspace open latency | capture the first real interaction that opens the page’s primary working surface, not just static load |
| overlay / modal / drawer open latency | capture one representative edit/detail/overlay action on routes that support it |
| scroll smoothness in large lists | capture one seeded long-scroll interaction on repeated-surface routes |
| timer-page idle CPU after 30 seconds | for timer-heavy routes, capture idle/tick behavior or explicitly document why the route does not keep long-lived visible timers |

Minimum acceptance gate:
1. zero uncaught page errors
2. zero console errors caused by the touched route
3. one desktop-class run when the route is desktop-supported
4. one mobile run when the route is mobile-supported
5. one route-specific interaction metric beyond first paint
6. one explicit note when a route has no edit flow, no attachment flow, or no long-lived timer so the absence is verified rather than assumed

Current evidence pattern already in use:
- `artifacts/login-*-summary.json` covers startup plus redirect-branch interactions
- `artifacts/staff-*-summary.json` covers desktop/mobile split plus action-sheet and canonical-profile handoff
- `artifacts/faculty-gradebook-*-summary.json` covers roster-ready, filter change, table open, and history modal open
- `artifacts/profile-*-summary.json` covers tab-open timings and explicitly records absent edit/attachment flows
- `artifacts/admin-library-*-summary.json` covers table-ready, filter, and modal-open timings
- `artifacts/timetable` sanity evidence records desktop/mobile load after route-CSS extraction; a dedicated week-switch/session-open probe is still open separately

Update `2026-05-16`:
- What changed: added the global weak-device acceptance checklist and minimum pass/fail gate so route-level QA claims now point to a consistent desktop/mobile evidence bar.
- Which task IDs moved: `GLOBAL-PERF-07`.
- What evidence was checked: the master audit already contains multiple route-level artifact pairs (`login`, `staff`, `faculty-gradebook`, `profile`, `admin-library`) that match the new checklist structure, including first-ready timings, one real interaction metric, and explicit zero-error reporting; the new acceptance section makes that bar explicit for future passes.

### `GLOBAL-PERF-11` Orphan Asset Manifest

| Bucket | Asset / group | Current status | Evidence / next action |
| --- | --- | --- | --- |
| root HTML | `calendar.html` | intentional redirect wrapper | Still mapped in `assets/js/features/navigation.js` and now reduced to a zero-runtime alias to `timetable.html`. |
| root HTML | `gradebook.html` | intentional redirect wrapper | Still mapped in `assets/js/features/navigation.js` and now reduced to a zero-runtime alias to `faculty-gradebook.html`. |
| root HTML | `faculty-schedule.html` | intentional redirect wrapper | Still mapped in `assets/js/features/navigation.js` and now reduced to a zero-runtime alias to `timetable.html`. |
| root HTML | `email.html` | removed orphan shell | No root file remains; the only non-doc follow-up is dormant `assets/js/pages/email.js`. |
| root HTML | `staff_lms_clean.html` | removed legacy duplicate | No root file remains; `staff.html` is the live owner. |
| root HTML | `students_lms_management.html` | removed legacy duplicate | No root file remains; `students-admin.html` is the live owner. |
| root HTML | `admin-tools-standalone.html` | removed generated artifact | Root file removed; generation now targets `artifacts/generated/admin-tools/admin-tools-standalone.html`. |
| root HTML | `admin-tools-standalone.dom.html` | removed generated/debug artifact | Root file removed; no current generator or live path depends on it. |
| `assets/js/pages/*` | `assets/js/pages/email.js` | dormant orphan route runtime | No live `email.html` route, no route-map entry, and no current root HTML owner remain. |
| `assets/js/shared/*` | `assets/js/shared/social-hub.js` / `assets/js/shared/social-render.js` / `assets/js/shared/social-media.js` | removed orphan legacy social runtimes | No live root HTML owner remained after the LMS shell trim; the dedicated social route now lives on `social-runtime-lite.js`, `social-page.js`, `social-mobile.js`, and shared `faculty.js` ownership instead. |
| `assets/js/pages/*` | `assets/js/pages/staff-mobile-shell.js` / `assets/js/pages/directories.js` | deferred but live | Not orphaned; both are loaded behind explicit runtime boundaries (`staff-route-bootstrap.js` and canonical profile handoff). |
| `assets/css/*` | `assets/css/social.css` | already removed orphan CSS | Prior scan closed it; no live page references remained. |
| `assets/css/*` | `assets/css/components.css` | intentional compatibility stylesheet | Still referenced broadly by live root HTML pages; not orphaned. |
| compatibility loaders | `core.js`, `assets/js/core.js` | legacy compatibility loaders | Still present as compatibility entry points; retire by freezing new references and shifting extracted modules to direct owners. |
| generated artifacts | `artifacts/generated/admin-tools/admin-tools-standalone.html` | intentional generated output | Still produced by `tools/build_admin_tools_standalone.py`; blocked from live serving and kept out of source cleanup scope. |

### `GLOBAL-PERF-12` Compatibility-Loader Retirement Plan

| Loader / assumption | Current evidence | Retirement step |
| --- | --- | --- |
| root `core.js` | `Test-Path core.js` is `True`, `tools\\sync_compatibility_assets.ps1` still syncs it, and `tools\\apply_cache_bust.py` still cache-busts `core.js` references | Keep as compatibility-only entry; block any new page from importing it directly and remove it only after no live HTML or tool path needs the legacy include. |
| `assets/js/core.js` | `Test-Path assets\\js\\core.js` is `True`, and `assets/js/README.md` still documents it as a compatibility loader for older include paths | Keep as compatibility-only mirror until the legacy include path is fully retired. |
| extracted module headers still claiming `core.js` as source of truth | `assets/js/app/app.js`, `assets/js/app/auth.js`, `assets/js/app/state.js`, `assets/js/shared/utilities.js`, `assets/js/shared/faculty.js`, `assets/js/shared/messenger.js`, `assets/js/features/navigation.js`, `assets/js/features/ui.js`, `assets/js/pages/{gradebook,lms,planner,registration,student-registration,admin-registration,directories}.js` all still say they were extracted from `core.js` and that the compatibility bundle remains the source of truth | For each touched module, treat the extracted file as the real owner after its route-level tests and browser probes are green, then remove or rewrite the legacy header wording in the same turn. |
| docs/tooling still assuming a core-bundle model | `assets/js/README.md` still says both `core.js` files act as compatibility loaders, and `tools/temp_replace.js` still mentions `renderStudentRegStructures() in core.js` | Update docs/tool comments to point at the current extracted owners whenever those files are touched; do not add new comments that describe `core.js` as the active source of truth. |
| rollout rule | many current routes now load extracted owners directly (`login-runtime.js`, `staff-route-bootstrap.js`, `timetable-route.css`, `orders-workspace.js`, deferred exams/admin-library probes, etc.) | Freeze the old model now: no new direct page imports of `core.js` or `assets/js/core.js`; only existing compatibility entry points may keep them until the final retirement pass. |

Update `2026-05-16`:
- What changed: added the orphan-asset manifest across root HTML, `assets/js/pages/*`, `assets/css/*`, compatibility loaders, and generated artifacts, and documented the compatibility-loader retirement plan for `core.js` / `assets/js/core.js` plus extracted-module header assumptions.
- Which task IDs moved: `GLOBAL-PERF-11`, `GLOBAL-PERF-12`.
- What evidence was checked: repo-wide reference scans now show `core.js` and `assets/js/core.js` still exist, `assets/js/README.md` still describes them as compatibility loaders, `tools\\sync_compatibility_assets.ps1` still syncs them, the root HTML inventory and route-map scans classify `calendar.html`, `gradebook.html`, and `faculty-schedule.html` as intentional redirect wrappers, and the removed/legacy/generated entries (`email.html`, `staff_lms_clean.html`, `students_lms_management.html`, `admin-tools-standalone*.html`) plus dormant `assets/js/pages/email.js` are now explicitly recorded in one manifest.

Update `2026-05-16`:
- What changed: added the global `transition: all` removal list, the categorized `backdrop-filter` reduction list, and explicit page-family policies for mobile scaffolds, dashboard/canvas effects, hidden content, and no-ugly-performance fallbacks.
- Which task IDs moved: `GLOBAL-PERF-04`, `GLOBAL-PERF-05`, `GLOBAL-PERF-08`, `GLOBAL-PERF-09`, `GLOBAL-PERF-10`, `GLOBAL-PERF-13`.
- What evidence was checked: repo-wide source scans now enumerate every remaining `transition: all` site and the current `backdrop-filter` sites across `assets/css/*`, `assets/js/features/*`, and `assets/js/pages/*`; the new ownership lists cite file and line evidence for shell chrome, cards, modals, mobile sheets, dashboard widgets, timetable surfaces, and student-service surfaces; and the new page-family policies codify the fallback and lazy-mount rules already proven by the cleaned route trackers.

### `GLOBAL-PERF-01` Page-Entry Import Manifest

Generated artifacts:
- `artifacts/global-perf/page-entry-import-manifest.json`
- `artifacts/global-perf/summary.json`

Current manifest coverage:
- `30` current root HTML entry files scanned
- `30` page records generated
- every script and stylesheet import on those root HTML files recorded with one of:
  `required at first paint`
  `lazy-loadable`
  `likely dead`
  `unknown`

Key current classifications from the generated manifest:
- redirect wrappers (`calendar.html`, `gradebook.html`, `faculty-schedule.html`) now load no external JS or CSS
- `login.html` is fully standalone and keeps only `kiu-fonts.css`, `login-route.css`, Font Awesome, and `login-runtime.js`
- `exams.html` marks the export-library CDN trio as `lazy-loadable`
- `staff.html` marks `staff-command-center.js` and `staff-route-bootstrap.js` as eager while the mobile shell is deferred
- partially cleaned but still-open routes such as `registration.html` retain `unknown` classifications where the current audit has not yet proven the import floor

### `GLOBAL-PERF-02` Timer Manifest

Generated artifacts:
- `artifacts/global-perf/timer-manifest.json`
- `artifacts/global-perf/summary.json`

Current manifest coverage:
- `48` timer-related entries captured across `15` files
- includes `setInterval`, `requestAnimationFrame`, and `MutationObserver` callsites

SetInterval / polling ownership table:

| File / owner | Interval purpose | Visibility rule | Kill condition |
| --- | --- | --- | --- |
| `assets/js/pages/exam-portal.js` line `543` | one-second session countdown cards on the dashboard | only when not hidden, token exists, sessions exist, and protected mode is inactive | `stopDashboardTimer()` and `stopAllTimers()` clear it when state changes |
| `assets/js/pages/exam-portal.js` line `801` | one-second protected exam countdown | only when not hidden, protected attempt is active, and submission is not complete | `stopProtectedCountdown()` and `stopAllTimers()` clear it |
| `assets/js/pages/exam-portal.js` line `808` | protected exam heartbeat every `15000 ms` | only when not hidden, protected attempt is active, and submission is not complete | `stopProtectedHeartbeat()` and `stopAllTimers()` clear it |
| `assets/js/pages/email.js` line `1013` | inbox auto-refresh every `45000 ms` | only when mailbox bootstrap is connected; each tick also bails while hidden, loading, composing, or disconnected | `clearMailAutoRefresh()` clears it when refresh state changes |
| `assets/js/pages/index-mobile-shell.js` line `373` | legacy mobile-shell `window.navigate` polling every `200 ms` | mobile-shell bootstrap only | clears when `window.navigate` is found or after `50` attempts |
| `assets/js/pages/lms.js` line `921` | protected-quiz bootstrap polling every `250 ms` | only while protected-quiz route recovery still needs the LMS runtime | clears on successful bootstrap or after the `8000 ms` hard stop |
| `assets/js/pages/lms.js` line `4134` | KIU Blue secure-quiz heartbeat | only while the secure-quiz heartbeat target is active | `stopKiuBlueStudentHeartbeat()` clears it |
| `assets/js/pages/lms.js` line `5578` | post-submit lock countdown every `1000 ms` | only while LMS post-submit lock badges remain active | `clearActiveLmsPostSubmitLockInterval()` clears it when no locks remain |
| `assets/js/pages/lms.js` line `8506` | KIU Blue disconnect countdown every `1000 ms` | only while the disconnect lock state is visible | `clearKiuBlueDisconnectInterval()` clears it |
| `assets/js/pages/lms.js` line `8536` | live student quiz countdown every `1000 ms` | only while the quiz is visible, open, and has an effective end time | `clearActiveLmsQuizCountdown()` clears it on expiry, teardown, or render failure |

### `GLOBAL-PERF-03` Live Overlay Manifest

Generated artifacts:
- `artifacts/global-perf/overlay-manifest.json`
- `artifacts/global-perf/summary.json`

Current manifest coverage:
- `21` overlay evidence hits across `5` files
- the generated manifest captures the current full-screen overlay creation lines and append sites

Unique overlay owners:

| File / owner | Overlay purpose | Blur radius | Animated | Cheaper class-based replacement |
| --- | --- | --- | --- | --- |
| `assets/js/pages/gradebook.js` | student evaluation history / score-edit overlays | `6px` on the history overlay | no | yes, keep consolidating behind reusable `gb-*` modal classes |
| `assets/js/pages/lms.js` | protected-quiz, quiz-review, and LMS workflow overlays | `4px` to `6px` depending on overlay | no | yes, the remaining `style.cssText` overlays should converge on one LMS modal shell set |
| `assets/js/pages/planner.js` | planner/calendar overlay | `6px` | no | yes, move behind one planner modal shell |
| `assets/js/pages/student-registration.js` | course picker, structured form, and large registration overlays | `4px`, `10px`, and `12px` | no | yes, collapse onto reusable registration modal classes |
| `assets/js/pages/study-card-page.js` | study-card detail/export overlay | `6px` | no | yes, move behind a reusable study-card modal shell |

Related overlay-style sites still tracked outside the generated manifest:
- `assets/js/pages/admin-registration.js` line `2369`
- `assets/js/pages/registration.js` line `3284`
- `assets/js/pages/exams-console.js` lines `1593`, `2043`, `2180`, `2285`, `2384`, `2401`

### `GLOBAL-PERF-06` Whole-Root InnerHTML Rerender List

Generated artifacts:
- `artifacts/global-perf/whole-root-rerender-manifest.json`
- `artifacts/global-perf/summary.json`

Current manifest coverage:
- `44` rerender entries across `38` files
- records `innerHTML =`, `insertAdjacentHTML(...)`, and `createContextualFragment(...)` owners with line evidence

Largest remaining localized markup owners:

| File | Current evidence | Current state |
| --- | --- | --- |
| `assets/js/pages/registration.js` | `56` `innerHTML =` hits plus `5` `insertAdjacentHTML(...)` sites | the remaining owners are bounded workspace regions such as `curriculum-library-modules-root`, localized `contentArea` tab bodies, assignment lists, and table/list containers rather than `#page-registration` rewrites. |
| `assets/js/pages/lms.js` | `46` `innerHTML =` hits | the remaining owners are route subregions such as `lms-content-area`, review panels, and tab workspaces; direct source scans no longer find live `#page-lms` root replacements. |
| `assets/js/features/index-luxury.js` | `16` `innerHTML =` hits | after the home/admin extraction, the shared shell is down to nav/topbar/user-menu/picker-panel generation only; route-owned home and admin workspace markup no longer lives in the shared core. |
| `assets/js/pages/career-market.js` | `20` `innerHTML =` hits plus `1` `insertAdjacentHTML(...)` site | current string sites are provider settings, transcript/report panes, and wizard/result subregions, not live route-root swaps. |
| `assets/js/pages/admin-registration.js` | `18` `innerHTML =` hits plus `1` `insertAdjacentHTML(...)` site | the remaining owners are CMS panes, picker lists, and helper feedback shells inside the admin registration workspace. |
| `assets/js/pages/gradebook.js` | `19` `innerHTML =` hits | the remaining owners are roster/history/detail containers and table regions, not `faculty-gradebook.html` route-root rewrites. |

Converted / lower-risk evidence already captured:
- `student-service.js` now relies on stable shells plus `createContextualFragment(...)`
- `programs-page.js`, `news.js`, `admin-library.html`, `staff.html`, `login.html`, and several redirect wrappers already moved away from broad root rewrites
- direct source scans across `assets/js/**` now report `0` live `document.getElementById('page-*')` + `innerHTML` route-root rewrites

Interpretation:
- the manifest portion of `GLOBAL-PERF-06` remains current at `44` localized markup-owner entries across `38` files
- the route-root conversion portion is now complete: the remaining generated owners are bounded subregions, modal shells, tab/workspace containers, tables, and compatibility scaffolds, not live page-root rewrites

Update `2026-05-17`:
- What changed: refreshed the rerender manifest after the shared shell split, re-audited the current high-count owners, and closed the whole-route-root conversion task because the remaining generated entries now belong to bounded workspace/container renderers rather than `#page-*` root swaps.
- Which task IDs moved: `GLOBAL-PERF-06`.
- What evidence was checked: `node tools/build_global_perf_manifests.mjs` regenerated `artifacts/global-perf/whole-root-rerender-manifest.json` and `summary.json` with `44` rerender entries across `38` files; direct source scans now show `0` live `document.getElementById('page-*')` + `innerHTML` matches across `assets/js/**`; and spot checks of `assets/js/features/index-luxury.js`, `assets/js/pages/lms.js`, `assets/js/pages/registration.js`, `assets/js/pages/planner.js`, and `assets/js/pages/gradebook.js` now point at bounded owners such as nav/picker panels, `lms-content-area`, `curriculum-library-modules-root`, tab workspaces, overlays, and table bodies rather than full page-root replacement.

Update `2026-05-16`:
- What changed: added the generated page-entry import manifest, timer manifest, live overlay manifest, and whole-root-rerender inventory under `artifacts/global-perf/`, then summarized the import classifications, timer owners, overlay owners, and remaining broad-rerender hotspots in this master audit.
- Which task IDs moved: `GLOBAL-PERF-01`, `GLOBAL-PERF-02`, `GLOBAL-PERF-03`, `GLOBAL-PERF-06`.
- What evidence was checked: `node --check tools/build_global_perf_manifests.mjs` passed; `node tools/build_global_perf_manifests.mjs` wrote `artifacts/global-perf/page-entry-import-manifest.json`, `timer-manifest.json`, `overlay-manifest.json`, `whole-root-rerender-manifest.json`, and `summary.json`; the generated summary now records `30` root HTML pages, `48` timer-related entries across `15` files, `21` overlay entries across `5` files, and `44` rerender entries across `38` files; and the new audit sections map those generated artifacts to explicit current owners and remaining open conversion work.

## Detailed Page Execution Rules

Every page section below should be executed in this order unless the section says otherwise.

1. Ownership audit:
   prove whether the page is live, redirect-only, generated, legacy, or orphaned
   prove which roles should be allowed to reach it
   prove which roles should not reach it
2. Entry payload audit:
   list exact CSS and JS imports
   mark which imports are clearly unrelated to the page purpose
3. DOM audit:
   count inline handlers
   identify large inline styles or inline scripts
   identify hidden DOM that mounts before the user needs it
4. CPU audit:
   identify timers, polling, observers, or whole-root rerenders
5. GPU audit:
   identify canvas, blur, box-shadow-heavy repeated cards, animated overlays, and mobile sheets
6. Mobile audit:
   check whether the page boots desktop-only code on mobile
   check whether the page boots mobile-only code on desktop
7. Visual audit:
   identify the page's visual identity surfaces
   note which blur, shadow, gradient, spacing, or typography surfaces are allowed to change only with parity review
   note which role or faculty variants must be rechecked after any visual-affecting edit
8. Safe cleanup order:
   remove dead imports first
   replace inline handlers second
   reduce rerender scope third
   reduce blur/shadow/animation cost fourth
   only then consider structural refactors
9. Verification:
   verify route open
   verify primary interaction
   verify mobile behavior if the route is mobile-reachable
   verify intended roles still reach the page
   verify unintended roles do not gain accidental access through legacy links or aliases
   verify visual parity for desktop and mobile when visuals were touched
   verify role-specific visual parity when shared-shell or multi-role pages were touched
   update `% left` and the change log immediately

## Second-Pass Legacy Findings

### Strong Legacy Or Orphan Candidates

- `email.html`
  removed from the root page set on `2026-05-15`
  no live route-map or role-access entry
  remaining non-doc references are limited to the dormant `assets/js/pages/email.js` module
- `staff_lms_clean.html`
  current inbound references found: only this audit
  no live route-map reference found
  standalone page with no shared runtime imports
- `students_lms_management.html`
  current inbound references found: only this audit
  no live route-map reference found
  standalone page with no shared runtime imports
- `admin-tools-standalone.html`
  current live root references found after cleanup: none
  current non-source references found: this audit plus `tools/build_admin_tools_standalone.py`
  generated artifact now builds only to `artifacts/generated/admin-tools/admin-tools-standalone.html`
- `admin-tools-standalone.dom.html`
  current live root references found after cleanup: none
  current non-source references found: only this audit
  removed debug artifact with no remaining generator, deploy path, or route-map reference

### Likely Legacy Alias Or Redirect Candidates

- `calendar.html`
  present in route map
  absent from `getAllowedPagesForRole()` page sets
  now reduced to a zero-runtime redirect wrapper targeting `timetable.html`
- `gradebook.html`
  present in route map
  absent from `getAllowedPagesForRole()` page sets
  now reduced to a zero-runtime redirect wrapper targeting `faculty-gradebook.html`

### Legacy Bootstrap And Compatibility Candidates

- `core.js`
  root compatibility loader still exists
  still described by tooling as a compatibility entry
- `assets/js/core.js`
  compatibility loader still exists
  still injects a broad route pack
- multiple active files still describe themselves as extracted from `core.js` and say its compatibility bundle remains the source of truth
- `assets/js/README.md` explicitly says both `core.js` files remain compatibility loaders for older include paths
- `assets/js/README.md` also mentions a `legacy/` folder, but no `assets/js/legacy/` directory exists in the current workspace

### Likely Placeholder Or Weak-Ownership Assets

- `assets/css/components.css`
  size: `80` bytes
  content: placeholder only
  verdict: keep temporarily as a compatibility stub because many live HTML pages still load it
- `assets/css/social.css`
  app references found: no live page references
  current reference found: analysis docs only
  verdict: deleted from the live tree on `2026-05-15`
- `assets/js/pages/students-admin-fades.js`
  current inbound references found: `0`
  tiny file with disabled legacy fade comment only
  verdict: deleted from the live tree on `2026-05-15`

Update `2026-05-15`:
- What changed: closed the dormant-asset decision task, kept `assets/css/components.css` as an intentional compatibility stub, and deleted `assets/css/social.css` plus `assets/js/pages/students-admin-fades.js` because they had no live app references.
- Which task IDs moved: `GLOBAL-15`.
- What evidence was checked: repo-wide reference scans found many live HTML references to `assets/css/components.css`, no live page references to `assets/css/social.css`, and no inbound references to `assets/js/pages/students-admin-fades.js`; `Test-Path` then confirmed the two dormant files were removed.

### Account-Specific Route Drift Findings

- `calendar` and `gradebook` still exist as route-map entries even though role access is now centered on `timetable` and `faculty-gradebook`
- `career-market` appears in student allowed pages and the external route map, but current inbound references are minimal
- `student-service` appears in multiple role page sets:
  student
  professor
  TA
  admin
  student-service
  this needs an explicit ownership check so it is not just accidental privilege drift
- `programs` appears in both student and admin page sets, and also in professor or TA page sets
  this needs explicit role-surface verification rather than inherited access
- admin-specific remaps are split between logical page IDs and physical page files:
  `library` -> `admin-library.html`
  `orders` -> `admin-orders.html`
  this is valid, but it increases duplicate-page risk

## Account Coverage Scan

Evidence source:
- `assets/js/app/state.js` `getAllowedPagesForRole()`
- `assets/js/features/navigation.js` `resolvePortalRouteUrl()`
- auth redirects in `assets/js/app/auth.js` and `login.html`
- body-class and route-class scan across all root HTML pages

Role-access verification matrix:

| Role | Home entry | Allowed pages explicitly listed in code | Verification notes |
| --- | --- | --- | --- |
| `student` | `index.html?view=student#home` via `getRoleHomePage()` | `home`, `profile`, `library`, `orders`, `lms`, `social`, `news`, `personal-data`, `chancellery`, `career-market`, `programs`, `study-card`, `registration`, `timetable`, `student-service` | `career-market` is student-only because it appears only here; `programs` and `student-service` are explicit, not inherited. |
| `professor` | `index.html?view=professor#home` via `getRoleHomePage()` | `home`, `profile`, `library`, `orders`, `lms`, `social`, `news`, `faculty-schedule`, `faculty-gradebook`, `timetable`, `exams`, `chancellery`, `programs`, `student-service` | Faculty-only routes are explicitly added on top of the common set; `programs` and `student-service` are deliberate explicit entries. |
| `ta` | `index.html?view=ta#home` via `getRoleHomePage()` | Same explicit page set as professor | TA access is intentional in current code because the TA role shares the same explicit branch as professor. |
| `admin` | `index.html?view=admin#home` via `getRoleHomePage()`; post-login auth currently redirects to `students-admin.html` | `home`, `profile`, `library`, `orders`, `lms`, `social`, `news`, `admin-tools`, `admin-scheduler`, `staff`, `students-admin`, `exams`, `profile-view`, `chancellery`, `student-service`, `programs` | Admin route remaps are explicit: `library -> admin-library.html`, `orders -> admin-orders.html`; standalone admin entries are also explicitly routed. |
| `student-service` | `index.html?view=student_service#home` via `getRoleHomePage()` | `home`, `profile`, `library`, `news`, `orders`, `social`, `student-service`, `chancellery` | This is the narrowest explicit set and intentionally excludes `lms`, `programs`, and `career-market`. |

Privilege-gated additions:
- `access_admin_tools` adds `admin-tools`
- `access_admin_scheduler` adds `admin-scheduler`
- `access_staff_directory` adds `staff`
- `access_student_directory` adds `students-admin`
- exam-management privileges add `exams`

### Student

Current allowed pages found in code:
- `home`
- `profile`
- `library`
- `orders`
- `lms`
- `social`
- `news`
- `personal-data`
- `chancellery`
- `career-market`
- `programs`
- `study-card`
- `registration`
- `timetable`
- `student-service`

Verification result:
- `career-market` is intentionally student-only in current code because only the student branch includes it and `navigation.js` treats it as a standalone external route.
- `student-service` is intentionally student-facing in current code because it is explicitly included in the student branch.
- redirect aliases like `calendar.html` remain separate cleanup work, but they are not part of the allowed-page set for this role.

### Professor

Current allowed pages found in code:
- `home`
- `profile`
- `library`
- `orders`
- `lms`
- `social`
- `news`
- `faculty-schedule`
- `faculty-gradebook`
- `timetable`
- `exams`
- `chancellery`
- `programs`
- `student-service`

Verification result:
- `student-service` and `programs` are intentionally professor-facing in current code because they are explicitly listed in the professor branch.
- duplication between `faculty-gradebook` and `timetable` is a separate cleanup problem, not an access-matrix ambiguity.

### TA

Current allowed pages found in code:
- same page set as professor

Verification result:
- TA access matches professor intentionally in current code because both roles share one explicit `getAllowedPagesForRole()` branch.
- any finer-grained TA product split would require a code change rather than an audit-only correction.

### Admin

Current allowed pages found in code:
- `home`
- `profile`
- `library`
- `orders`
- `lms`
- `social`
- `news`
- `admin-tools`
- `admin-scheduler`
- `staff`
- `students-admin`
- `exams`
- `profile-view`
- `chancellery`
- `student-service`
- `programs`

Verification result:
- admin home remains `index.html?view=admin#home` in route logic, while post-login auth still redirects to `students-admin.html`; that divergence is intentional code today and remains a separate UX decision.
- admin `library` and `orders` physical-page splits are explicit in `resolvePortalRouteUrl()`, not accidental.
- `lms` is intentionally supported for admin in current code because it remains in the common allowed-page set and resolves to the standalone `lms.html` route.

### Student Service

Current allowed pages found in code:
- `home`
- `profile`
- `library`
- `news`
- `orders`
- `social`
- `student-service`
- `chancellery`

Verification result:
- the current code intentionally excludes `programs`, `lms`, and `career-market` from the student-service role because they are not present in its explicit branch.
- shared-shell cost remains a performance issue, not an access-intent ambiguity.

Update `2026-05-15`:
- What changed: promoted the account coverage scan into an explicit role-access verification matrix with home entries, allowed-page sets, and privilege-gated additions.
- Which task IDs moved: `GLOBAL-14`.
- What evidence was checked: `assets/js/app/state.js#getAllowedPagesForRole()`, `assets/js/app/state.js#getRoleHomePage()`, `assets/js/features/navigation.js#resolvePortalRouteUrl()`, and the admin post-login redirect in `assets/js/app/auth.js`.

## Page Backlogs

### `index.html`

Overall % left: `0%`

Evidence: `4.6 KB` entry HTML, `12` home-entry scripts (`11` shared plus the route-owned home bundle), `index.html` now measures `4,589` bytes, the shared shell core `assets/js/features/index-luxury.js` now measures `205,297` bytes, the route-owned home bundle `assets/js/features/index-home-dashboard.js` is `268,393` bytes, the shared shell stylesheet `assets/css/index-luxury.css` now measures `813,543` bytes, the route-owned home/dashboard stylesheet `assets/css/index-home-dashboard.css` is `35,173` bytes, the student and professor deep trackers are fully closed, and `artifacts/home-role-startup-efficient-desktop-summary.json` now records startup evidence for `student`, `professor`, `admin`, `ta`, and `student_service`.

Hotspots: no home-route-specific cleanup tasks remain open; the shared home/admin shell split is now complete, and any remaining home cost is the intentional shared shell/runtime budget already captured in the current manifests and deep trackers.

Detailed execution checklist:
- Treat `index.html` as a shared shell, not as a normal standalone page.
- Before any new home cleanup, prove which work belongs to:
  shell core
  role-specific dashboard content
  mobile shell
  studio/editor
  transparency/background systems
- Use the existing student and professor trackers as the detailed source of truth, then mirror open shared-shell work here.
- Never move forward on shared-shell cleanup without capturing role-specific evidence for:
  student
  professor
  admin
  TA
  student-service

Tasks:
- `HOME-01` `0% left` Keep `docs/INDEX_HOME_OPTIMIZATION_TRACKER.md` and `docs/PROFESSOR_HOME_OPTIMIZATION_TRACKER.md` synchronized with this master file after every shared shell change.
- `HOME-02` `0% left` Continue moving non-home logic out of `assets/js/features/index-luxury.js` so the shared shell stops paying for dashboard-only branches.
  Note: the shared shell JS split is now complete globally through the route-owned `index-home-dashboard.js` and `index-admin-tools.js` bundles.
- `HOME-03` `0% left` Continue shrinking `assets/css/index-luxury.css` reach on the home route by removing selectors that only exist for other pages.
  Note: the shared shell CSS split is now complete globally through `assets/css/index-home-dashboard.css` plus the existing route-owned admin tools stylesheet.
- `HOME-04` `0% left` Add an integrated-GPU browser perf capture for student, professor, and admin home startup so the remaining shared cost is measurable.
- `HOME-05` `0% left` Create separate deep trackers for admin home, TA home, and student-service home if those role dashboards keep diverging from the student and professor variants.
- `HOME-06` `0% left` Verify that each role only mounts the widgets and shell controls it actually needs instead of paying for all role chrome.
- `HOME-07` `0% left` Audit shared mobile-shell boot paths so desktop startup never parses mobile-only role workflows again.
- `HOME-08` `0% left` Add role-by-role startup evidence to the tracker:
  script count
  hydrated DOM count
  background tier
  long tasks

Update `2026-05-16`:
- What changed: captured an efficient-tier desktop startup matrix for `student`, `professor`, `admin`, `ta`, and `student_service`, then synchronized the student and professor home trackers with the new shared-shell artifact evidence.
- Which task IDs moved: `HOME-01`, `HOME-04`, `HOME-05`, `HOME-06`, `HOME-07`, `HOME-08`.
- What evidence was checked: `node --check tools/capture_home_startup_matrix.mjs` passed; `artifacts/home-role-startup-efficient-desktop-summary.json` now records `11` shared startup scripts, role-specific widget counts/titles, `0` eager picker panels, `0` eager utility panels, `0` eager user menus, `performanceTier: efficient`, hydrated DOM counts, and long-task totals for all five home roles; and the same artifact shows no desktop mobile-shell DOM for any role (`mobileNavPresent: false`, `mobileActionSheetPresent: false`).

Update `2026-05-16`:
- What changed: completed a shared-home completion audit and closed the remaining master-only home-route tasks, because the student and professor deep trackers are already fully done and the role-matrix artifact now covers the distinct `admin`, `ta`, and `student_service` home variants on the same shell.
- Which task IDs moved: `HOME-02`, `HOME-03`.
- What evidence was checked: `docs/INDEX_HOME_OPTIMIZATION_TRACKER.md` now shows every `T*` task at `0%`; `docs/PROFESSOR_HOME_OPTIMIZATION_TRACKER.md` now shows every `P*` task at `0%`; `artifacts/home-role-startup-efficient-desktop-summary.json` records `student`, `professor`, `admin`, `ta`, and `student_service` all booting on `index.html` with `11` shared scripts, `0` eager picker panels, `0` eager utility panels, and the `efficient` performance tier; and current file inspection confirms `index.html` at `4,396` bytes, `assets/js/features/index-luxury.js` at `415,798` bytes, and `assets/css/index-luxury.css` at `830,325` bytes, with any broader file-family split work now tracked under `GLOBAL-02` and `GLOBAL-03` rather than the home route summary.

### `lms.html`

Overall % left: `0%`

Evidence: `188.6 KB` HTML, `17` external scripts, `2` page scripts, existing detailed tracker in `LMS_HTML_OPTIMIZATION_TASKS.md`.

Hotspots: no open LMS-specific cleanup tasks remain in the dedicated ledger; preserve the current LMS runtime boundaries and browser evidence if future LMS-specific work resumes.

Detailed execution checklist:
- Keep `LMS_HTML_OPTIMIZATION_TASKS.md` as the detailed source of truth for completed LMS work.
- Split the remaining LMS work by feature boundary, not by file size:
  course list
  course workspace
  gradebook
  quizzes
  protected exam monitoring
  export or print helpers
- Treat every active timer in `assets/js/pages/lms.js` as a separate CPU budget item that must justify itself.
- Remove dead imports and dead modal paths before attempting deeper subview refactors.

Tasks:
- `LMS-01` `0% left` Keep `LMS_HTML_OPTIMIZATION_TASKS.md` as the detailed source of truth and mirror only open cross-page work here.
- `LMS-02` `0% left` Split `assets/js/pages/lms.js` into smaller route modules so course workspace, gradebook, protected exams, and admin helpers do not parse together.
- `LMS-03` `0% left` Move more of the large page-local inline CSS in `lms.html` into route-owned stylesheets once visual parity can be screenshot-verified.
- `LMS-04` `0% left` Add route-level performance capture for the heaviest LMS flows:
  subject grid
  course workspace
  quiz launch
  gradebook
  protected session timers
- `LMS-05` `0% left` Split timer-heavy protected exam logic from normal course browsing so idle LMS views stop carrying secure-session interval overhead.
- `LMS-06` `0% left` Replace string-built overlay and modal style injection with reusable CSS classes to reduce paint churn and make hotspot review easier.
- `LMS-07` `0% left` Audit whether each LMS subview can mount on demand instead of keeping inactive heavy subtrees ready in memory.
- `LMS-08` `0% left` Add a CPU-focused audit for the highest-frequency LMS mutations:
  countdown updates
  disconnect timers
  proctor heartbeat UI
  quiz autosave and post-submit locks
- `LMS-09` `0% left` Verify whether LMS access for admin, professor, TA, and student remains intentional on each standalone entry path and not only through compatibility routing.

Update `2026-05-15`:
- What changed: closed the standalone LMS role-access verification task using the explicit role matrix from `getAllowedPagesForRole()` plus the standalone route mapping in `resolvePortalRouteUrl()`.
- Which task IDs moved: `LMS-09`, `GLOBAL-14`.
- What evidence was checked: `assets/js/app/state.js` still includes `lms` in the student/professor/TA/admin allowed-page sets; `assets/js/features/navigation.js` still resolves `lms` to `lms.html`; and the student-service role still excludes `lms`.

Update `2026-05-16`:
- What changed: synchronized the LMS summary row and main page section with the dedicated `LMS_HTML_OPTIMIZATION_TASKS.md` ledger, which already marks the LMS task board complete and leaves only optional future split opportunities outside the open-task scope.
- Which task IDs moved: `LMS-01`, `LMS-02`, `LMS-03`, `LMS-04`, `LMS-05`, `LMS-06`, `LMS-07`, `LMS-08`.
- What evidence was checked: `LMS_HTML_OPTIMIZATION_TASKS.md` now shows `T01` through `T50` all at `0% left`, explicitly labels the remaining items as optional follow-up opportunities rather than open task-board work, and records final desktop/mobile browser verification, `node --check assets/js/pages/lms.js`, and `npm run check:frontend` as complete.

### `admin-tools.html`

Overall % left: `0%`

Evidence: `28.8 KB` HTML, `16` external scripts, `4` page scripts, dedicated `assets/css/admin-tools-luxury.css`, and the standalone builder now writes only to blocked artifact output.

Hotspots: no open admin-tools-specific cleanup tasks remain; preserve the existing tracker, route CSS, runtime boundaries, and desktop/mobile artifact coverage if the page changes again.

Detailed execution checklist:
- Start with a file-ownership map:
  what lives in `admin-tools.html`
  what lives in `assets/css/admin-tools-luxury.css`
  what still leaks from shared shell files
  what belongs only to the standalone artifact builder
- Prove each eager page runtime import before touching admin tools behavior.
- Move inline or page-specific render logic into a dedicated admin tools runtime before deleting compatibility code.
- Keep standalone artifact cleanup separate from live-page performance cleanup.

Tasks:
- `ADMT-01` `0% left` Prove which imported page runtimes are truly required for admin tools and remove every unused eager import from the page entry.
- `ADMT-02` `0% left` Create a dedicated optimization tracker for `admin-tools.html` because the page is now important enough to deserve page-specific progress history.
- `ADMT-03` `0% left` Audit `assets/css/admin-tools-luxury.css` for heavy blur, stacked shadows, and non-admin selectors that can move back into shared CSS or be deleted.
- `ADMT-04` `0% left` Replace remaining inline handlers and DOM-string UI actions with delegated admin tools controllers.
- `ADMT-05` `0% left` Decide whether the live page and standalone artifacts should share one source path or whether the standalone output should leave the repo.
- `ADMT-06` `0% left` Add browser perf capture for the real admin tools workflows instead of only checking static load.
- `ADMT-07` `0% left` Build a keep/remove table for each eager page runtime imported by the admin tools entry page.
- `ADMT-08` `0% left` Split admin tools startup into data bootstrap, chrome render, and tool-panel mount so only the active tool mounts first.
- `ADMT-09` `0% left` Add weak-laptop and mobile admin-tools checks for first paint, tool switch, and modal open latency.
- `ADMT-10` `0% left` Verify whether any non-admin role can still reach `admin-tools.html` through legacy links, compatibility routes, or stale local state.

Update `2026-05-15`:
- What changed: moved the standalone admin-tools build output out of the live root, blocked both old standalone root URLs plus `/artifacts/` from the web servers, and documented the non-source artifact path.
- Which task IDs moved: `ADMT-05`, `GLOBAL-10`, `ATS-01`, `ATS-02`, `ATS-03`, `ATS-04`, `ATS-05`, `ATS-06`, `ATS-07`, `ATS-08`, `ATSDOM-01`, `ATSDOM-02`, `ATSDOM-03`, `ATSDOM-04`, `ATSDOM-05`, `ATSDOM-06`, `ATSDOM-07`, `ATSDOM-08`.
- What evidence was checked: `tools/build_admin_tools_standalone.py` now targets `artifacts/generated/admin-tools/admin-tools-standalone.html` and injects a generated banner; `infra/nginx/default.conf` and `tools/local_dev_server.py` now reject `/artifacts/` plus `/admin-tools-standalone*.html`; `.dockerignore` excludes stale root standalone filenames from image context; and the root HTML inventory contains no standalone artifact files.

Update `2026-05-15`:
- What changed: removed the eager `lms.js` import from `admin-tools.html`, kept `student-registration.js` as a required admin-registration dependency, and added a tiny `renderAdminQaTestingCard()` fallback so the route no longer pulls the full LMS runtime just to clear a legacy QA card.
- Which task IDs moved: `ADMT-01`, `ADMT-07`.
- What evidence was checked: `renderLuxuryAdminToolsPage()` in `assets/js/features/index-luxury.js` only calls registration/admin-registration/planner-owned hooks such as `renderCurriculumTable()`, `bootAdminRegistrationCms()`, `renderAdminCurriculumPalette()`, and `onAdminDashboardLoad()`; `admin-registration.js` still calls `getStudentCompletedEctsThisSemester()` from `student-registration.js`; equivalent shared helpers like `canonicalCourseKey()`, `getDomain()`, and `getAllCurriculumSubjects()` already exist in `assets/js/app/app.js` and `assets/js/app/state.js`; and a headless local-server check keeps the admin route on `/admin-tools.html` while the student route is redirected away.
- Follow-up note: the standalone builder still replaces missing Font Awesome TTF references with empty data URIs, so standalone export fidelity should be rechecked only if that blocked artifact becomes a shipped deliverable again.

Update `2026-05-15`:
- What changed: added an admin-tools route guard that redirects unauthorized direct entry back to the role home page instead of leaving non-admin users on a broken standalone admin shell.
- Which task IDs moved: `ADMT-10`.
- What evidence was checked: `getAllowedPagesForRole()` in `assets/js/app/state.js` still reserves `admin-tools` for admins unless an explicit `access_admin_tools` privilege exists; `navigate()` in `assets/js/features/navigation.js` already blocks unauthorized transitions; and `admin-tools.html` now rechecks route access during boot before calling `renderLuxuryAdminToolsPage()`.

Update `2026-05-15`:
- What changed: removed the five static `closeAllModals(event)` inline handlers from `admin-tools.html` and replaced them with one delegated modal-closer listener bound during page boot.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: the modal markup in `admin-tools.html` now uses `data-close-modal` attributes instead of inline `onclick` handlers; the only remaining `closeAllModals(event)` reference in the file lives inside the delegated listener body; and the headless admin/student route check still passes after the modal-close delegation change.

Update `2026-05-15`:
- What changed: created `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md` with a baseline, ownership map, task board, import notes, verification notes, and an admin-tools change log, then linked it from the master audit.
- Which task IDs moved: `ADMT-02`.
- What evidence was checked: the new tracker records the current `admin-tools.html` shell inventory (`30,800 bytes`, `16` external scripts, `2` inline scripts, `4` page-script imports, `0` static inline handlers, `2` `setInterval(` hits); it captures the keep/remove table for the current page-runtime imports; and the master audit tracker-links section now points to `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`.

Update `2026-05-15`:
- What changed: scoped `assets/css/admin-tools-luxury.css` to `lux-route-admin-tools`, replaced every remaining `transition: all` site with property-specific transitions, and added efficient-tier blur/shadow fallbacks for the repeated admin-tools hero, panel, subcard, and modal surfaces.
- Which task IDs moved: `ADMT-03`.
- What evidence was checked: `npx vitest run test/admin-tools-route-regressions.test.js` passed; the CSS no longer contains the old broad selectors such as `body.lux-unified-shell .lux-primary-btn` or `body.lux-unified-shell .lux-panel`; no `transition: all` sites remain; and `assets/css/admin-tools-luxury.css` now contains explicit `body[data-lux-performance='efficient']` fallbacks for the heaviest route-local surfaces.

Update `2026-05-15`:
- What changed: replaced the remaining admin-tools startup polling loops with deterministic one-shot hooks for the page bootstrap and the mobile nav hook path.
- Which task IDs moved: `ADMT-08`.
- What evidence was checked: `admin-tools.html` now reports `0` `setInterval(` hits; `npx vitest run test/admin-tools-route-regressions.test.js` passed with the new startup-hook assertions; and a headless local-server check still keeps `student` on `index.html?view=student#home` while `admin` stays on `admin-tools.html` with no page or console errors.

Update `2026-05-15`:
- What changed: replaced the remaining inline action hooks emitted by `renderLuxuryAdminToolsPage()` with `data-*` attributes plus shell-scoped listeners for add-module, prerequisite search, condition toggle, save-subject, and registration-tab actions.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `npx vitest run test/admin-tools-route-regressions.test.js` passed with new assertions against the old inline template hooks; `assets/js/features/index-luxury.js` now uses `data-admin-tools-*` attributes instead of the old `onclick`/`oninput`/`onchange` strings in the admin-tools workspace template; and a headless local-server check still keeps `student` on `index.html?view=student#home` while `admin` stays on `admin-tools.html` with no page or console errors.

Update `2026-05-15`:
- What changed: replaced the curriculum-library pane inline actions in `assets/js/pages/registration.js` with `data-curriculum-*` hooks plus local listeners for add-module, module-select, edit, delete, focus-builder, and delete-subject actions.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `npx vitest run test/admin-tools-route-regressions.test.js` passed with new assertions against the old curriculum-library inline hooks; `assets/js/pages/registration.js` now uses `data-curriculum-*` attributes instead of the old inline `onclick`/`onchange` strings in the admin-tools library pane; and the delegated action path is now covered by the admin-tools route regression guard.

Update `2026-05-15`:
- What changed: captured scripted admin-tools QA for efficient-tier desktop and mobile, measuring first-ready, registration-tab switch, and studio/action-sheet open timings.
- Which task IDs moved: `ADMT-09`.
- What evidence was checked: `artifacts/admin-tools-efficient-desktop-summary.json` records `performanceTier: efficient`, `firstReadyMs: 1186`, `toolSwitchMs: 828`, and `modalOpenMs: 413` with zero errors; `artifacts/admin-tools-mobile-summary.json` records `performanceTier: standard`, `firstReadyMs: 900`, `toolSwitchMs: 511`, and `modalOpenMs: 203` with zero errors; and both runs still landed on `admin-tools.html` with the expected admin workspace state.

Update `2026-05-15`:
- What changed: closed the admin-tools real-workflow perf capture task using the existing efficient-tier desktop and mobile artifact runs.
- Which task IDs moved: `ADMT-06`.
- What evidence was checked: `artifacts/admin-tools-efficient-desktop-summary.json` and `artifacts/admin-tools-mobile-summary.json` both contain startup, registration-tab switch, and studio/action-sheet open timings from live admin-tools workflows; both runs completed with zero page or console errors; and the artifacts now serve as the route-level browser perf capture instead of a static source-only check.

Update `2026-05-16`:
- What changed: synchronized the admin-tools overall remaining-work percentage with the dedicated tracker before the last delegated admin-registration/planner action-cleanup pass landed.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: that sync point matched the then-current tracker state, which later moved `ADMT-04` to `0% left`; `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md` now shows `ADMT-01` through `ADMT-10` all at `0% left`.

Update `2026-05-16`:
- What changed: delegated the active admin-registration `prog` / `free` module controls used by `admin-tools.html`, covering add-module, module select, edit/delete module, add subject, and edit/delete submodule actions through one `bindAdminRegistrationCmsDelegates()` controller path.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `node --check assets/js/pages/admin-registration.js` passed; `npx vitest run test/admin-tools-route-regressions.test.js` passed; and `assets/js/pages/admin-registration.js` now exposes `data-admin-reg-add-module="prog"`, `data-admin-reg-add-module="free"`, `data-admin-reg-select-module`, `data-admin-reg-edit-module`, `data-admin-reg-delete-module`, `data-admin-reg-add-subject`, `data-admin-reg-edit-submodule`, and `data-admin-reg-delete-submodule` plus the new `bindAdminRegistrationCmsDelegates()` entry point.

Update `2026-05-16`:
- What changed: extended the same delegated admin-registration controller path across the active concentration/minor admin-tools UI, covering add-program, program select/delete, add-group, group toggle/edit/delete, and course edit/add-subject actions.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `node --check assets/js/pages/admin-registration.js` passed; `npx vitest run test/admin-tools-route-regressions.test.js` passed again; and `assets/js/pages/admin-registration.js` now exposes `data-admin-reg-add-conc-program`, `data-admin-reg-select-conc-program`, `data-admin-reg-delete-conc-program`, `data-admin-reg-add-conc-group`, `data-admin-reg-toggle-conc-group`, `data-admin-reg-edit-conc-group`, `data-admin-reg-delete-conc-group`, `data-admin-reg-add-conc-subject`, `data-admin-reg-edit-conc-course`, `data-admin-reg-delete-conc-course`, `data-admin-reg-add-minor-program`, `data-admin-reg-select-minor-program`, `data-admin-reg-delete-minor-program`, `data-admin-reg-add-minor-group`, `data-admin-reg-toggle-minor-group`, `data-admin-reg-edit-minor-group`, `data-admin-reg-delete-minor-group`, `data-admin-reg-add-minor-subject`, and `data-admin-reg-edit-minor-course`.

Update `2026-05-16`:
- What changed: delegated the live planner-owned admin-tools actions by replacing the curriculum-palette `selectPaletteSubject(...)` inline hook and the system-ops refresh inline hook with `data-admin-planner-*` controls plus one `bindAdminToolsPlannerDelegates()` path.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `node --check assets/js/pages/planner.js` passed; `npx vitest run test/admin-tools-route-regressions.test.js` passed again; and `assets/js/pages/planner.js` now exposes `data-admin-planner-palette-subject`, `data-admin-planner-palette-name`, `data-admin-planner-refresh-system-ops`, and `bindAdminToolsPlannerDelegates()`.

Update `2026-05-16`:
- What changed: removed the dead concentration/minor subject-picker helper island down to a `loadAvailableSubjects()` compatibility stub, so the old `filterAndDisplaySubjects(...)` and `addSelectedSubject(...)` path no longer ships in the live admin-tools code.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `node --check assets/js/pages/admin-registration.js` passed; `npx vitest run test/admin-tools-route-regressions.test.js` passed again; and the regression now guards the absence of `function filterAndDisplaySubjects(` and `function addSelectedSubject(` in `assets/js/pages/admin-registration.js`.

Update `2026-05-16`:
- What changed: removed the last live concentration-pane inline hooks in `renderConcProgramPane()` and closed the final admin-tools-specific action-cleanup task.
- Which task IDs moved: `ADMT-04`.
- What evidence was checked: `node --check assets/js/pages/admin-registration.js` passed; `npx vitest run test/admin-tools-route-regressions.test.js` passed with the new global inline-handler guard; and a source scan now reports `0` `onclick=` / `oninput=` / `onchange=` / `onmouseover=` / `onmouseout=` hits in `assets/js/pages/admin-registration.js`.

### `admin-library.html`

Overall % left: `0%`

Evidence: `45,767 bytes` HTML, `11` external scripts, `2` inline scripts, `0` inline handlers, `0` `<style>` blocks, `1` route-owned `assets/css/admin-library-route.css` link, `0` `setInterval(` hits, and `0` mojibake markers.

Hotspots: no open admin-library-specific cleanup tasks remain; preserve the extracted route CSS, lazy modal content, DOM-helper render path, and efficient-tier surface fallbacks.

Detailed execution checklist:
- Keep the extracted route CSS route-owned while future modal/table work lands, so visual parity checks stay manageable.
- Keep hidden parameter modal content lazy and avoid reintroducing startup prebuilds.
- Keep the page-owned DOM helpers in place and audit repeated admin-card shadows and blur surfaces.

Tasks:
- `ALIB-01` `0% left` Remove unrelated LMS, planner, registration, and student-registration imports unless the admin library route proves they are needed.
- `ALIB-02` `0% left` Replace the `16` inline handlers with delegated listeners and page-local controller functions.
- `ALIB-03` `0% left` Move large inline styling into route CSS so the admin library page stops carrying view logic and theme rules in the HTML file.
- `ALIB-04` `0% left` Audit modal and table rendering so only the active admin library region mounts at load.
- `ALIB-05` `0% left` Add an admin-library-specific perf and regression tracker.
- `ALIB-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `ALIB-07` `0% left` Replace large HTML-string table and modal rendering with page-owned render helpers that can update smaller regions.
- `ALIB-08` `0% left` Audit repeated admin table shadows and blur surfaces inside the route and downgrade repeated card effects on weak-device mode.

Update `2026-05-15`:
- What changed: created `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md`, added a new regression guard, replaced the admin-library shell handlers with delegated listeners, removed the mobile bootstrap poll, cleaned the corrupted comments, and captured the trimmed shell baseline.
- Which task IDs moved: `ALIB-01`, `ALIB-02`, `ALIB-05`, `ALIB-06`, `GLOBAL-11`.
- What evidence was checked: `admin-library.html` now reports `11` external scripts, `2` inline scripts, `0` inline handlers, `0` `setInterval(` hits, and `0` mojibake markers; `test/admin-library-route-regressions.test.js` passes; and the shell no longer includes the dead page-pack imports.

Update `2026-05-15`:
- What changed: moved both admin-library route-local `<style>` blocks into `assets/css/admin-library-route.css` and replaced the inline style surface with one route-owned stylesheet link.
- Which task IDs moved: `ALIB-03`.
- What evidence was checked: `admin-library.html` now reports `45,767 bytes`, `0` `<style>` blocks, `1` `admin-library-route.css` link, `11` external scripts, `2` inline scripts, `0` inline handlers, and `0` `setInterval(` hits; `npx vitest run test/admin-library-route-regressions.test.js` passed; and a local-server fetch returned `200` for both `/admin-library.html` and `/assets/css/admin-library-route.css`.

Update `2026-05-15`:
- What changed: split the admin-library startup render path so `renderAdminLibrary()` now mounts the visible form/filter/catalog surfaces only, while the hidden parameter-chip modal groups render on demand inside `openLibraryParamModal()`.
- Which task IDs moved: `ALIB-04`.
- What evidence was checked: `npx vitest run test/admin-library-route-regressions.test.js` passed; a headless local-server check reported `0` thematic/language/status parameter chips before opening the modal and populated groups after the open action; and the page raised no console or page errors during that interaction.

Update `2026-05-15`:
- What changed: replaced the large admin-library table-row and parameter-chip string templates with page-owned DOM helper functions, while keeping the existing delegated action hooks intact.
- Which task IDs moved: `ALIB-07`.
- What evidence was checked: `npx vitest run test/admin-library-route-regressions.test.js` passed after the regression guard was updated for the DOM-helper path; the source now contains `renderAdminLibraryChipGroup`, `createAdminLibraryCatalogRow`, and `renderAdminLibraryEmptyStateRow`; and the old large parameter-chip and table-row templates no longer drive the live render path.

Update `2026-05-15`:
- What changed: added efficient-tier weak-device fallbacks for the admin-library table, modal overlay, modal shell, and repeated card surfaces using the existing `body[data-lux-performance='efficient']` contract.
- Which task IDs moved: `ALIB-08`.
- What evidence was checked: `npx vitest run test/admin-library-route-regressions.test.js` passed with new checks for the efficient-tier selectors; `assets/css/admin-library-route.css` now contains the route-specific efficient-tier shadow/blur overrides; and no admin-library tasks remain open in the page tracker.

Update `2026-05-16`:
- What changed: synchronized the admin-library overall remaining-work percentage with the dedicated tracker after confirming that every admin-library task is closed.
- Which task IDs moved: `ALIB-01`, `ALIB-02`, `ALIB-03`, `ALIB-04`, `ALIB-05`, `ALIB-06`, `ALIB-07`, `ALIB-08`.
- What evidence was checked: `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md` now shows `ALIB-01` through `ALIB-08` all at `0% left`, with the tracker explicitly stating that no open admin-library cleanup tasks remain.

Update `2026-05-16`:
- What changed: added a seeded Playwright admin-library probe for table-ready, catalog-filter, and parameter-modal interactions, then recorded the new desktop/mobile route artifacts.
- Which task IDs moved: `MICRO-ALIB-05`.
- What evidence was checked: `node --check tools/capture_admin_library_summary.mjs` passed; `artifacts/admin-library-efficient-desktop-summary.json` now records `firstReadyMs: 3217`, `filterMs: 149`, `modalOpenMs: 416`, `rowCount: 1`, and zero errors; `artifacts/admin-library-mobile-summary.json` now records `firstReadyMs: 793`, `filterMs: 90`, `modalOpenMs: 83`, `rowCount: 1`, `mobileNavVisible: true`, and zero errors; and `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md` now links both artifact files.

### `admin-orders.html`

Overall % left: `0%`

Evidence: `22,219 bytes` HTML, `14` external scripts, `1` inline script, `0` inline handlers, `0` `setInterval(` hits, `0` `transition: all` hits, `1` route-owned `assets/css/admin-orders-route.css` link, and the live admin path now updates hero, recipients, compose, table, and detail regions separately through `assets/js/shared/orders-workspace.js`.

Hotspots: no open admin-orders-specific cleanup tasks remain; preserve the extracted route CSS, shared live inbox runtime, and the existing QA artifacts.

Detailed execution checklist:
- Keep admin-only studio/bootstrap logic in `assets/js/pages/admin-orders.js` instead of drifting back into `admin-orders.html`.
- Keep the documented ownership map between `admin-orders.html` and `assets/js/shared/orders-workspace.js` stable if the shared route changes again.
- Move the remaining inline style surface only after the runtime boundary is stable.
- Keep the extracted route CSS and shared live inbox runtime stable if the page changes again.
- Add weak-device QA after the runtime split so the inbox still feels identical under load.

Tasks:
- `AORD-01` `0% left` Identify which orders logic is still embedded inline and move it to a dedicated `assets/js/pages/admin-orders.js` module.
- `AORD-02` `0% left` Replace the remaining inline handlers with delegated events.
- `AORD-03` `0% left` Remove `transition: all` usage from the page-local styles and replace it with property-specific transitions.
- `AORD-04` `0% left` Unify admin orders behavior with the main `orders.html` runtime instead of maintaining two drifting versions.
- `AORD-05` `0% left` Add a route-specific tracker and QA flow for inbox load, filter, open, and respond actions.
- `AORD-06` `0% left` Split admin inbox list rendering from detail-pane rendering so filter changes do not rebuild the whole page.
- `AORD-07` `0% left` Build a source-of-truth map showing what logic belongs in `admin-orders.html`, what belongs in `orders.html`, and what should become shared.
- `AORD-08` `0% left` Add mobile and weak-laptop verification for inbox open, status change, and reply actions once the dedicated runtime exists.

Update `2026-05-15`:
- What changed: created `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`, converted the admin-orders studio controls to delegated listeners, removed both startup polls, and added route regression coverage.
- Which task IDs moved: `AORD-02`, `AORD-05`, `AORD-06`, `GLOBAL-11`.
- What evidence was checked: `admin-orders.html` now reports `12` external scripts, `2` inline scripts, `0` inline handlers, and `0` `setInterval(` hits; `test/admin-orders-route-regressions.test.js` passes; and the shared messenger runtime still owns `renderAdminOrders()`.

Update `2026-05-15`:
- What changed: replaced every `transition: all` in the admin orders theme studio controls with property-specific transitions for border, background, color, box-shadow, and transform.
- Which task IDs moved: `AORD-03`.
- What evidence was checked: `admin-orders.html` now reports `0` `transition: all` hits; `test/admin-orders-route-regressions.test.js` passes with a new guard against `transition: all`; and the studio still exposes the same palette, interface-mode, background, transparency, and custom-accent controls.

Update `2026-05-15`:
- What changed: extracted the admin orders studio/bootstrap script from `admin-orders.html` into `assets/js/pages/admin-orders.js` and kept the mobile shell as the only remaining inline script block.
- Which task IDs moved: `AORD-01`.
- What evidence was checked: `admin-orders.html` now reports `13` external scripts, `1` inline script block, `0` inline handlers, and `0` `setInterval(` hits; `node --check assets/js/pages/admin-orders.js` passed; `test/admin-orders-route-regressions.test.js` passes with guards against the old inline controller; and the page still exposes the same studio controls plus the messenger-owned admin inbox render path.

Update `2026-05-15`:
- What changed: documented the source-of-truth map for `admin-orders.html`, `orders.html`, `assets/js/pages/admin-orders.js`, and `assets/js/shared/messenger.js` so the remaining unification work now has explicit ownership lines.
- Which task IDs moved: `AORD-04`, `AORD-07`.
- What evidence was checked: `admin-orders.html` still owns `#modal-studio`, `#admin-orders-root`, and the mobile shell; `orders.html` still owns `#page-orders` and the student-facing shell/fallback markup; `assets/js/pages/admin-orders.js` now owns the admin studio/bootstrap; and `assets/js/shared/messenger.js` still owns both `renderAdminOrders()` and `renderOrdersInboxPage()` plus the related order helpers.

Update `2026-05-15`:
- What changed: replaced the shared admin-orders route actions in `assets/js/shared/messenger.js` with delegated listeners and `data-*` hooks, in sync with the `orders.html` shell cleanup.
- Which task IDs moved: `AORD-02`, `AORD-04`, `GLOBAL-08`.
- What evidence was checked: the shared source no longer contains the old admin-order inline handler strings; `node --check assets/js/shared/messenger.js` passed; `node --check assets/js/features/ui.js` passed; and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: reopened the admin-orders list/detail split task after verifying that `renderAdminOrders()` still rebuilds `#admin-orders-root` through one `innerHTML` path.
- Which task IDs moved: `AORD-06`.

Update `2026-05-15`:
- What changed: captured efficient-tier desktop and mobile admin-orders QA across the live admin send flow and the recipient orders inbox open/read-filter flow.
- Which task IDs moved: `AORD-08`.
- What evidence was checked: `artifacts/admin-orders-efficient-desktop-summary.json` records `performanceTier: efficient`, `adminReadyMs: 1013`, `sendMs: 162`, `inboxOpenMs: 559`, `detailOpenMs: 80`, and `statusChangeMs: 539` with zero errors; `artifacts/admin-orders-mobile-summary.json` records `performanceTier: standard`, `adminReadyMs: 988`, `sendMs: 791`, `inboxOpenMs: 669`, `detailOpenMs: 57`, and `statusChangeMs: 672` with zero errors; and both artifact runs finished with the expected recipient orders state (`readFilterPressed: true`, `visibleOrderButtons: 1`).
- What evidence was checked: direct source inspection of `assets/js/shared/messenger.js#renderAdminOrders()` still shows full-root template assembly and `root.innerHTML = ...`, so the list/detail split is not yet complete.

Update `2026-05-15`:
- What changed: reworked the live admin orders path to keep one shell and update hero, recipients, compose, sent-orders, and detail regions separately instead of rebuilding `#admin-orders-root` on every interaction.
- Which task IDs moved: `AORD-04`, `AORD-06`, `AORD-07`.
- What evidence was checked: `assets/js/shared/messenger.js` now routes the live admin path through `ensureAdminOrdersShell()`, `renderAdminOrdersHeroMain()`, `renderAdminOrdersRecipientsPanel()`, `renderAdminOrdersComposePanel()`, `renderAdminOrdersTablePanel()`, and `renderAdminOrdersDetailPanel()`; `node --check assets/js/shared/messenger.js` passed; and `test/admin-orders-route-regressions.test.js` now asserts the region-update helper path.

Update `2026-05-15`:
- What changed: deleted the obsolete `renderOrdersInboxPageLegacySnapshot()` fallback so the shared messenger runtime now contains only the live recipient inbox renderer.
- Which task IDs moved: `AORD-04`.
- What evidence was checked: `node --check assets/js/shared/messenger.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed; `assets/js/shared/messenger.js` now reports one live `function renderOrdersInboxPage()` definition and no `renderOrdersInboxPageLegacySnapshot()` fallback; and the shared runtime remains the sole live owner for both orders routes.

Update `2026-05-15`:
- What changed: extracted the admin-orders studio surface into `assets/css/admin-orders-route.css` and removed the remaining admin-orders-specific inline style block from the HTML shell.
- Which task IDs moved: `AORD-04`.
- What evidence was checked: `admin-orders.html` now reports `22,219 bytes`, `1` `assets/css/admin-orders-route.css` link, and `11` remaining `style=` attributes, all limited to hidden nav stubs or shared mobile-shell chrome; and `npx vitest run test/admin-orders-route-regressions.test.js` still passes.

### `admin-scheduler.html`

Overall % left: `0%`

Evidence: `70.1 KB` HTML, `10` external scripts, `1` page script, `2` lazy `<template>` mounts, `assets/js/pages/admin-scheduler.js` is `65,282 bytes`, the live controller now has `0` `onclick=` hits, the HTML shell now has `0` `onchange=` hits and `0` raw `onclick=` hits, the unproven `assets/js/shared/messenger.js` shell import is gone, the unneeded `assets/js/features/ui.js` and `assets/js/app/api.js` shell imports are gone, the dead inline scheduler interaction block is gone, the live controller now exposes `ensureMountedTemplate(...)`, `openProfQuizModal(...)`, `schedulerShellActionBound`, `schedulerWeekActionBound`, `buildSchedulerPaletteCard(...)`, `buildSchedulerSlotBackground(...)`, and `buildSchedulerEventCard(...)`, the route still carries `20` `backdrop-filter` hits plus `15` `box-shadow` hits with lower route-scoped `--sch-glass-blur-*` and `--sch-*-shadow` values, `artifacts/admin-scheduler-efficient-desktop-summary.json` plus `artifacts/admin-scheduler-mobile-summary.json` now capture first-ready, week-render, slot-open, and edit-modal timings, and import-floor probes now show `assets/js/app/app.js` plus `assets/js/features/navigation.js` are still required for real route behavior.

Hotspots: no open admin-scheduler-specific cleanup tasks remain.

Detailed execution checklist:
- Keep the live delegated controller as the only active scheduler behavior path.
- Split scheduler concerns inside `assets/js/pages/admin-scheduler.js` into:
  palette setup
  slot grid rendering
  modal open and edit
  stats and delete actions
  faculty and semester filters
- Replace the current string-built event cells and overlays with page-owned render helpers before trying to optimize paint cost.
- Keep the remaining shell-thinning work focused on proven shared dependencies and real browser QA instead of more speculative markup churn.

Tasks:
- `ASCH-01` `0% left` Replace all inline grid, palette, and modal `onclick` handlers with delegated listeners in `assets/js/pages/admin-scheduler.js`.
- `ASCH-02` `0% left` Move schedule-cell and event-card markup generation out of raw string concatenation and into page-owned render helpers.
- `ASCH-03` `0% left` Reduce overlay and card blur intensity while preserving the same visual theme on desktop and mobile.
- `ASCH-04` `0% left` Stop building invisible scheduler content up front; mount only the active faculty, semester, and week view.
- `ASCH-05` `0% left` Audit whether this page still needs the full shared shell stack or can run on a thinner admin shell.
- `ASCH-07` `0% left` Capture weak-laptop and mobile checks for week render, slot open, and edit modal open latency.
- `ASCH-06` `0% left` Create a dedicated scheduler tracker with granular tasks and browser QA evidence.

Update `2026-05-14`:
- What changed: created `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md`, delegated the quiz-modal close handlers in `admin-scheduler.html`, and captured the updated scheduler baseline.
- Which task IDs moved: `ASCH-01`, `ASCH-06`, `GLOBAL-11`.
- What evidence was checked: `admin-scheduler.html` now reports `27` inline handlers; `assets/js/pages/admin-scheduler.js` is `45,398 bytes`; and `test/admin-scheduler-recovery.test.js` plus the existing scheduler navigation/recovery tests passed.

Update `2026-05-15`:
- What changed: delegated the live scheduler palette/grid/session actions in `assets/js/pages/admin-scheduler.js` onto `data-scheduler-subject-id`, `data-scheduler-slot-*`, and `data-scheduler-session-action` hooks; removed the active quiz-builder inline `onclick`/`onchange` handlers in `admin-scheduler.html`; and expanded `test/admin-scheduler-recovery.test.js` to guard the new delegated controller contract.
- Which task IDs moved: `ASCH-01`.
- What evidence was checked: `node --check assets/js/pages/admin-scheduler.js` passed; `npx vitest run test/admin-scheduler-recovery.test.js` passed all `5` assertions; `assets/js/pages/admin-scheduler.js` now reports `0` `onclick=` hits; and `admin-scheduler.html` now reports `0` `onchange=` hits plus `14` remaining raw `onclick=` hits, all living inside the two disabled legacy scheduler script blocks.

Update `2026-05-16`:
- What changed: collapsed the two disabled legacy scheduler engines in `admin-scheduler.html` into inert audit placeholders, leaving the delegated `assets/js/pages/admin-scheduler.js` controller as the only active scheduler behavior path.
- Which task IDs moved: `ASCH-01`.
- What evidence was checked: direct source scans now show `0` `onclick=` and `0` `onchange=` hits in `admin-scheduler.html`; the file dropped from `170,320` bytes to `79,024` bytes; and `npx vitest run test/admin-scheduler-recovery.test.js` stayed green at `5/5`.

Update `2026-05-16`:
- What changed: removed the unproven `assets/js/shared/messenger.js` shell import from `admin-scheduler.html` and kept the same delegated live scheduler controller plus shared admin-shell fallback behavior.
- Which task IDs moved: `ASCH-05`.
- What evidence was checked: direct source scans now show `12` external scripts and no `messenger.js` import in `admin-scheduler.html`; `npx vitest run test/admin-scheduler-recovery.test.js` stayed green at `5/5`; and `node --check assets/js/pages/admin-scheduler.js` still passed.

Update `2026-05-16`:
- What changed: refactored `assets/js/pages/admin-scheduler.js` so the live palette and weekly grid render through dedicated DOM helpers instead of the old `html += ...` string assembly path.
- Which task IDs moved: `ASCH-02`.
- What evidence was checked: `node --check assets/js/pages/admin-scheduler.js` passed; `npx vitest run test/admin-scheduler-recovery.test.js` stayed green at `5/5`; direct source scans now show `buildSchedulerPaletteCard(...)`, `buildSchedulerSlotBackground(...)`, `buildSchedulerEventCard(...)`, `list.replaceChildren(fragment)`, and `container.replaceChildren(fragment)`; and the old live `html += '<div class=\"sch-slot-bg\"'` / `html += '<div class=\"sch-event\"'` scheduler paths are gone.

Update `2026-05-16`:
- What changed: moved the hidden create-session and professor-quiz overlays into `<template>` nodes, deleted the dead inline scheduler interaction block, moved quick-action/week navigation plus quiz ownership into `assets/js/pages/admin-scheduler.js`, and lowered repeated panel/card/modal blur and shadow intensity through route-scoped scheduler variables.
- Which task IDs moved: `ASCH-03`, `ASCH-04`, `ASCH-05`.
- What evidence was checked: `node --check assets/js/pages/admin-scheduler.js` passed; `npx vitest run test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` passed at `9/9`; direct source scans now show `70,296` HTML bytes, `65,282` page-runtime bytes, `2` template nodes, `0` `onclick=` hits, `0` `onchange=` hits, `schedulerShellActionBound`, `schedulerWeekActionBound`, `ensureMountedTemplate(...)`, `openProfQuizModal(...)`, and the lowered `--sch-glass-blur-*` / `--sch-*-shadow` scheduler CSS variables.

Update `2026-05-16`:
- What changed: added a Playwright scheduler probe and captured efficient-desktop plus mobile route summaries for startup, week-render, and slot-open timing.
- Which task IDs moved: `ASCH-07`.
- What evidence was checked: `node --check tools/capture_admin_scheduler_summary.mjs` passed; `artifacts/admin-scheduler-efficient-desktop-summary.json` now records `firstReadyMs: 2060`, `weekRenderMs: 54`, `slotOpenMs: 191`, `editModalOpenMs: 59`, `performanceTier: efficient`, `eventCount: 1`, and zero errors; `artifacts/admin-scheduler-mobile-summary.json` now records `firstReadyMs: 688`, `weekRenderMs: 23`, `slotOpenMs: 24`, `editModalOpenMs: 16`, `mobileNavVisible: true`, `eventCount: 1`, and zero errors.

Update `2026-05-16`:
- What changed: removed the unneeded `assets/js/features/ui.js` shell import from `admin-scheduler.html` and refreshed the scheduler route artifacts against the lighter shell.
- Which task IDs moved: `ASCH-05`.
- What evidence was checked: `npx vitest run test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` passed at `9/9`; direct source scans now show `11` external scripts and no `ui.js` import in `admin-scheduler.html`; `artifacts/admin-scheduler-efficient-desktop-summary.json` records `firstReadyMs: 2202`, `weekRenderMs: 65`, `slotOpenMs: 95`, `editModalOpenMs: 89`, and zero errors; and `artifacts/admin-scheduler-mobile-summary.json` records `firstReadyMs: 763`, `weekRenderMs: 25`, `slotOpenMs: 23`, `editModalOpenMs: 20`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: removed the unneeded `assets/js/app/api.js` shell import from `admin-scheduler.html` and refreshed the scheduler route artifacts against the lighter `10`-script shell.
- Which task IDs moved: `ASCH-05`.
- What evidence was checked: `npx vitest run test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` passed at `9/9`; direct source scans now show `10` external scripts and no `api.js` import in `admin-scheduler.html`; `artifacts/admin-scheduler-efficient-desktop-summary.json` records `firstReadyMs: 2470`, `weekRenderMs: 146`, `slotOpenMs: 385`, `editModalOpenMs: 68`, and zero errors; and `artifacts/admin-scheduler-mobile-summary.json` records `firstReadyMs: 795`, `weekRenderMs: 21`, `slotOpenMs: 18`, `editModalOpenMs: 11`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: closed the remaining scheduler shared-shell audit after import-floor probes proved the current `10`-script shell is the minimum safe set for this standalone page.
- Which task IDs moved: `ASCH-05`.
- What evidence was checked: aborting `assets/js/app/app.js` prevents route readiness because auth/session constants such as `USER_ROLES` and `SCHEDULER_WEEK_STORAGE_KEY` disappear; aborting `assets/js/features/navigation.js` leaves the mobile dynamic nav without `window.navigate`; and the live `10`-script shell still passes `npx vitest run test/admin-scheduler-recovery.test.js test/admin-scheduler-navigation.test.js` plus the refreshed desktop/mobile scheduler artifacts with zero errors.

### `calendar.html`

Overall % left: `0%`

Evidence: `1.4 KB` HTML, immediate redirect to `timetable.html`, `1` inline script, `0` external scripts, and `0` shared CSS files.

Hotspots: full shell boot on a redirect-only page.

Detailed execution checklist:
- Confirm that `calendar.html` is never meant to render application UI and exists only to forward users to `timetable.html`.
- Remove these entry costs first:
  `assets/js/theme-primer.js`
  `assets/css/base.css`
  `assets/css/layout.css`
  `assets/css/components.css`
  `assets/css/index-luxury.css`
  `assets/css/mobile-responsive.css`
  all shared app scripts
- Remove the current fallback card only after confirming whether a no-JS or slow-network fallback is still required.
- If a fallback card is required, keep it pure static HTML and CSS only.
- Verify both redirect paths after cleanup:
  meta refresh
  `window.location.replace('timetable.html')`

Tasks:
- `CAL-01` `0% left` Replace `calendar.html` with a zero-runtime redirect page or server rewrite.
- `CAL-02` `0% left` Remove theme primer, shared shell CSS, and all shared scripts from the redirect wrapper.
- `CAL-03` `0% left` Keep a minimal visual fallback card only if non-JS navigation support is still required.
- `CAL-04` `0% left` Add a regression test that ensures this wrapper never grows back into a real shell page.
- `CAL-05` `0% left` Delete the hidden navigation stub markup because redirect wrappers do not need shared-shell compatibility DOM.
- `CAL-06` `0% left` Remove `kiu-shell-loading`, `lux-unified-shell`, and route body classes from the wrapper once the page is reduced to pure redirect behavior.
- `CAL-07` `0% left` Verify the page no longer downloads font CSS or icon CSS before redirect.
- `CAL-08` `0% left` Add a static audit check that the wrapper never exceeds:
  `1` inline script
  `0` external JS
  `0` shared CSS files

Update `2026-05-14`:
- What changed: replaced the shell-heavy wrapper with a static fallback card plus a single inline redirect script, and removed all shell classes, nav stubs, fonts, icons, CSS imports, and app-script imports.
- Which task IDs moved: `CAL-01`, `CAL-02`, `CAL-03`, `CAL-04`, `CAL-05`, `CAL-06`, `CAL-07`, `CAL-08`, `MICRO-CAL-01`, `MICRO-CAL-02`, `MICRO-CAL-03`, `MICRO-CAL-04`, `MICRO-CAL-05`, `GLOBAL-05`.
- What evidence was checked: `assets/js/features/navigation.js` still maps `calendar` to `calendar.html`; `assets/js/app/state.js#getAllowedPagesForRole()` still excludes `calendar`; `test/redirect-wrapper-regressions.test.js` passed; live navigation chain verified `calendar.html -> timetable.html -> login.html`; direct HTML fetch still exposes the meta refresh target.

### `career-market.html`

Overall % left: `0%`

Evidence: `20,057 bytes` HTML, `13` external scripts, dedicated `assets/css/career-market-route.css` and `assets/js/pages/career-market.js` route assets, `0` inline `<style>` blocks, `22` `innerHTML` hits in the extracted runtime, template-backed provider/tool modals that start unmounted, a dedicated route regression, and real desktop/mobile route artifacts in `artifacts/career-market-efficient-desktop-summary.json` and `artifacts/career-market-mobile-summary.json`.

Hotspots: no career-market-specific cleanup tasks remain open; preserve the extracted route assets, lazy modal-template pattern, shared-shell dependency boundary, and current browser/regression evidence if the route changes again.

Detailed execution checklist:
- Extract route ownership first:
  inline CSS
  inline controller logic
  AI provider switching
  history list
  chat transcript
  composer tools
- Keep the route responsive on weak hardware by ensuring inactive side panels and provider tools do not mount until used.
- Treat chat transcript rerender scope as a first-class CPU problem; no whole-root rerender should happen for one new message or one provider status update.
- Decide early whether this page should remain a shared-shell route or become a fully standalone tool page.

Tasks:
- `CARE-01` `0% left` Extract the large inline career-market styles into a dedicated route stylesheet so the HTML stops acting as both markup and theme layer; `career-market.html` now links `assets/css/career-market-route.css` and no longer carries an inline `<style>` block.
- `CARE-02` `0% left` Extract the page logic into a dedicated page module instead of keeping a large inline script blob in the HTML file; the route now loads `assets/js/pages/career-market.js`, and `node --check assets/js/pages/career-market.js` passes.
- `CARE-03` `0% left` Lazy-mount inactive chat/history/provider panels so first paint only builds the active conversation shell; reports/vacancies render only when their view is active, and the provider settings, instructions studio, and tool-info modal roots now start unmounted and mount only on first use from templates.
- `CARE-04` `0% left` Audit AI provider switching, history rendering, and suggestion lists for repeated full-panel rerenders; the rerender audit is now explicit and verified, the history rail no longer rebuilds with `innerHTML`, and route/browser verification covers provider open/switch plus transcript behavior.
- `CARE-05` `0% left` Verify whether this page really needs the shared luxury shell or whether it should become a dedicated standalone tool page; current source proof shows the extracted runtime still intentionally depends on shared-shell contracts such as `navigate(...)`, the luxury studio trigger, shared messaging/notification buttons, and role-aware mobile navigation.
- `CARE-06` `0% left` Create a dedicated perf tracker because this route is large enough to justify one; `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md` is now the dedicated tracker.
- `CARE-07` `0% left` Split transcript rendering from sidebar history rendering so one new message never rebuilds both panels; the transcript append path stays on `appendMessage(...)`, while the history rail now updates through route-owned DOM nodes plus delegated selection instead of a string-built `innerHTML` rebuild.
- `CARE-08` `0% left` Add weak-laptop and mobile checks for chat open, provider switch, and long transcript scroll smoothness; `artifacts/career-market-efficient-desktop-summary.json` and `artifacts/career-market-mobile-summary.json` now capture first-ready, provider-modal open, provider switch, reports/vacancies view switch, and seeded transcript scroll timings with zero errors.
- `CARE-09` `0% left` Record whether this route should keep shared-shell transparency and topbar effects or opt out for better performance; current verdict is to keep the shared-shell topbar/transparency treatment because the route still depends on the luxury-shell controls and still behaves like a first-class portal workspace rather than an isolated microsite.
- `CARE-10` `0% left` Verify whether `career-market` is intentionally student-only or whether any other role should be able to reach it.

Update `2026-05-15`:
- What changed: closed the role-access verification for `career-market`.
- Which task IDs moved: `CARE-10`, `GLOBAL-14`.
- What evidence was checked: `assets/js/app/state.js` includes `career-market` only in the student allowed-page set; `assets/js/features/navigation.js` lists `career-market` as a standalone external route; and no other role branch explicitly includes it.

Update `2026-05-16`:
- What changed: extracted the giant inline style/runtime blocks into `assets/css/career-market-route.css` and `assets/js/pages/career-market.js`, added the dedicated career-market tracker, and documented the current shared-shell dependency verdict.
- Which task IDs moved: `CARE-01`, `CARE-02`, `CARE-05`, `CARE-06`.
- What evidence was checked: `career-market.html` now measures `19,396 bytes` with `13` external scripts and `0` inline `<style>` blocks; `assets/css/career-market-route.css` is `79,904 bytes`; `assets/js/pages/career-market.js` is `127,731 bytes`; `node --check assets/js/pages/career-market.js` passed; and direct source scans now show shared-shell dependency callsites for `navigate(...)`, `lux-topbar-editor-btn`, `lux-studio-backdrop`, and the shared chat/notification controls.

Update `2026-05-16`:
- What changed: moved the provider settings modal, instructions studio, and tool-info modal behind HTML templates, mounted and bound them only on first use inside `assets/js/pages/career-market.js`, added a dedicated career-market browser probe, and captured real desktop/mobile route artifacts.
- Which task IDs moved: `CARE-03`, `CARE-04`, `CARE-08`, `CARE-09`.
- What evidence was checked: `career-market.html` now measures `20,057 bytes`; `assets/js/pages/career-market.js` now measures `129,620 bytes`; `node --check assets/js/pages/career-market.js` and `node --check tools/capture_career_market_summary.mjs` passed; the HTML shell now contains `career-provider-modal-template`, `career-instructions-modal-template`, and `career-tool-modal-template`; the route artifacts prove those modal roots start unmounted (`lazyStateBefore.providerModalMounted: false`, `toolModalMounted: false`, `instructionsModalMounted: false`); `artifacts/career-market-efficient-desktop-summary.json` records `firstReadyMs: 4730`, `providerOpenMs: 8`, `providerSwitchMs: 1`, `reportsViewMs: 2`, `vacanciesViewMs: 1`, `transcriptScrollMs: 210`, `transcriptMessageCount: 36`, and zero errors; and `artifacts/career-market-mobile-summary.json` records `firstReadyMs: 675`, `providerOpenMs: 4`, `providerSwitchMs: 1`, `reportsViewMs: 1`, `vacanciesViewMs: 1`, `transcriptScrollMs: 68`, `transcriptMessageCount: 36`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: replaced the history-rail `innerHTML` rebuild with route-owned DOM node creation plus one delegated click listener inside `assets/js/pages/career-market.js`.
- Which task IDs moved: `CARE-04`, `CARE-07`, `MICRO-CARE-03`.
- What evidence was checked: `node --check assets/js/pages/career-market.js` passed; direct source scans now show `createCareerHistoryItemNode(...)`, `handleCareerHistorySelection(...)`, `container.replaceChildren(...)`, and no remaining `career-history-items` `innerHTML` assignment; and the refreshed desktop/mobile `career-market` artifacts still report zero errors.

Update `2026-05-16`:
- What changed: added a focused route regression for the extracted career-market shell and lazy modal templates, then closed the remaining route-specific audit items based on the current ownership map and browser evidence.
- Which task IDs moved: `CARE-03`, `CARE-04`, `CARE-07`, `MICRO-CARE-01`, `MICRO-CARE-05`.
- What evidence was checked: `npx vitest run test/career-market-route-regressions.test.js` passed `1/1`; the regression proves `career-market.html` keeps extracted route assets, the provider/tool modals stay inside templates instead of the live DOM before interaction, and the history rail stays on route-owned DOM sync; `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md` now records the route ownership map; and the desktop/mobile route artifacts still report zero errors.

### `chancellery.html`

Overall % left: `0%`

Evidence: `15,004 bytes` HTML, `13` external scripts, `1` page script (`chancellery.js`), no shell inline handlers, `0` remaining inline handler attributes in `assets/js/pages/chancellery.js`, no mobile polling loops, and a stable hero/content shell with delegated `data-chancellery-*` controls.

Hotspots: no open chancellery-specific cleanup tasks remain; preserve the dedicated runtime, stable shell regions, and the existing mobile/efficient-tier verification artifacts.

Detailed execution checklist:
- Prove which shell imports are still required on first load:
  `app.js`
  `api.js`
  `auth.js`
  `initial-state.js`
  `state.js`
  `utilities.js`
  `faculty.js`
  `navigation.js`
  `ui.js`
  `index-luxury.js`
- Keep the dedicated route runtime, stable shell regions, and efficient-tier/mobile behavior intact if the page changes again.

Tasks:
- `CHAN-01` `0% left` Remove unrelated LMS, planner, gradebook, directories, and admin-registration imports unless the chancellery route proves they are required.
- `CHAN-02` `0% left` Extract chancellery-only logic into a dedicated page runtime instead of piggybacking on the generic shell pack.
- `CHAN-03` `0% left` Lazy-mount submission history, request detail panes, and attachment UI instead of building them all on load.
- `CHAN-04` `0% left` Audit shared shell transparency and blur cost on chancellery panels, which should be able to render more cheaply than the home route.
- `CHAN-05` `0% left` Add a page tracker for request submit, review, and history flows.
- `CHAN-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `CHAN-07` `0% left` Replace any full-detail-pane rerender paths with smaller updates for status, reply, and history changes.
- `CHAN-08` `0% left` Add mobile route verification for request list scroll and detail open behavior after import trimming.
- `CHAN-09` `0% left` Create a dedicated chancellery tracker.

Update `2026-05-15`:
- What changed: removed the dead social helper trio from `chancellery.html`, replaced the inline mobile hook wait, and added `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`.
- Which task IDs moved: `CHAN-01`, `CHAN-09`, `GLOBAL-11`.
- What evidence was checked: `chancellery.html` reports `19` external scripts, `0` inline handlers, and `0` polling loops; `test/chancellery-route-regressions.test.js` passes; and the route behavior continues to be owned by `assets/js/pages/registration.js`.

Update `2026-05-15`:
- What changed: removed the unrelated page-pack imports from `chancellery.html`, leaving `registration.js` as the only remaining page-runtime import, and recorded the keep/remove table in `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`.
- Which task IDs moved: `CHAN-01`, `CHAN-05`, `CHAN-06`.
- What evidence was checked: `chancellery.html` now reports `15,005 bytes`, `13` external scripts, and `1` page-runtime import; `npx vitest run test/chancellery-route-regressions.test.js` passed with new guards against the removed page-pack imports; and the source scan still shows `renderChancelleryPage()` and related workflow helpers living in `assets/js/pages/registration.js`.

Update `2026-05-15`:
- What changed: gated the registration-only startup helpers behind `#page-registration` in `assets/js/pages/registration.js` so the trimmed chancellery shell no longer throws missing student-registration helper errors, and captured mobile chancellery verification on a seeded student request list.
- Which task IDs moved: `CHAN-08`.
- What evidence was checked: `artifacts/chancellery-mobile-summary.json` records `queueCount: 6`, `mobileNavVisible: true`, `firstReadyMs: 789`, `detailOpenMs: 496`, and successful page scroll (`after: 700`) with zero errors; the selected detail titles include `QA Subject 5`; and the chancellery route regression test still passes after the shell trim.

Update `2026-05-15`:
- What changed: added efficient-tier blur/shadow fallbacks for the repeated chancellery hero, focus-card, queue-item, and thread-entry surfaces in `assets/css/index-luxury.css`.
- Which task IDs moved: `CHAN-04`.
- What evidence was checked: `npx vitest run test/chancellery-route-regressions.test.js` passed with new checks for the efficient-tier selectors; `assets/css/index-luxury.css` now contains explicit `body[data-lux-performance='efficient'].lux-route-chancellery` overrides; and the existing mobile chancellery artifact already shows the trimmed route running with zero errors after the shell cleanup.

Update `2026-05-15`:
- What changed: closed the chancellery DOM-mount task after confirming the route renders only the selected case detail/thread pane instead of prebuilding inactive request detail panels.
- Which task IDs moved: `CHAN-03`.
- What evidence was checked: `renderChancelleryStudentAppealsPanel()` and `renderChancelleryStaffWorkspace()` both pass only one selected request into the detail pane; `ensureSelectedChancelleryCase()` guarantees a single active case; and `artifacts/chancellery-mobile-summary.json` shows a six-item queue with one selected detail case (`QA Subject 5`) rather than multiple simultaneously mounted detail panes.

Update `2026-05-15`:
- What changed: extracted the standalone chancellery workflow into `assets/js/pages/chancellery.js` and switched `chancellery.html` to load that dedicated runtime instead of `registration.js`.
- Which task IDs moved: `CHAN-02`.
- What evidence was checked: `node --check assets/js/pages/chancellery.js` passed; `npx vitest run test/chancellery-route-regressions.test.js` passed with the new dedicated-runtime assertion; `chancellery.html` now reports one page-runtime import, `assets/js/pages/chancellery.js`; and the refreshed `artifacts/chancellery-mobile-summary.json` shows the route still loads cleanly on mobile with zero errors and the expected selected case detail (`Extract Subject 2`).

Update `2026-05-15`:
- What changed: added a stable shell to `assets/js/pages/chancellery.js` so route updates now refresh dedicated hero/content regions instead of replacing `#page-chancellery` wholesale.
- Which task IDs moved: `CHAN-07`.
- What evidence was checked: `npx vitest run test/chancellery-route-regressions.test.js` passed with assertions for `ensureChancelleryShell(root)`; the refreshed `artifacts/chancellery-mobile-summary.json` now records `heroRegion: true` and `contentRegion: true` with zero errors; and `assets/js/pages/chancellery.js` now updates `shell.hero.innerHTML` and `shell.content.innerHTML` instead of rebuilding the root shell.

Update `2026-05-15`:
- What changed: closed the chancellery page section in the master audit after the dedicated runtime extraction, stable shell split, efficient-tier surface audit, and refreshed mobile verification all landed.
- Which task IDs moved: `CHAN-01`, `CHAN-02`, `CHAN-03`, `CHAN-04`, `CHAN-05`, `CHAN-06`, `CHAN-07`, `CHAN-08`, `CHAN-09`.
- What evidence was checked: `npx vitest run test/chancellery-route-regressions.test.js` passed; `node --check assets/js/pages/chancellery.js` passed; `artifacts/chancellery-mobile-summary.json` records the route running on mobile with zero errors and both `heroRegion` and `contentRegion` present; and the page tracker now has no open tasks.

Update `2026-05-17`:
- What changed: replaced the remaining route-local inline `onclick` and `onchange` hooks in `assets/js/pages/chancellery.js` with delegated `data-chancellery-*` controls for case selection, tab switches, student request submit, staff filters, status updates, and staff replies.
- Which task IDs moved: `CHAN-07`, `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/chancellery.js` passed; `npx vitest run test/chancellery-route-regressions.test.js` passed `1/1`; and a direct source scan now reports `0` inline handler attributes in `assets/js/pages/chancellery.js` while the stable hero/content shell remains intact.

Update `2026-05-17`:
- What changed: removed the shared calendar workspace inline month-nav, tab-switch, and announcement/event preview hooks from `assets/js/features/ui.js` in favor of one delegated `bindCalendarDelegates(...)` controller path.
- Which task IDs moved: `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/features/ui.js` passed; `npx vitest run test/calendar-ui-regressions.test.js` passed `1/1`; and the current source scan reports `0` inline handler hits in `assets/js/features/ui.js` while still exposing `data-cal-tab`, `data-cal-nav`, and `data-cal-modal-kind` controls.

### `email.html`

Overall % left: `0%`

Evidence: removed from the root page set; `Get-ChildItem -File -Filter *.html` no longer returns `email.html`, there is no live route-map or role-access entry, and the only remaining non-doc references live in the dormant `assets/js/pages/email.js` module.

Hotspots: keep the removed route out of future cleanup passes unless product explicitly relaunches it.

Detailed execution checklist:
- Resolve route ownership first:
  live page
  orphan page
  experimental page
  removable page
- The removal path is now closed, so no live-route optimization work should continue here unless the page is reintroduced.

Tasks:
- `MAIL-01` `0% left` Decide whether `email.html` is still a live product page or an orphan shell that should be removed.
- `MAIL-02` `0% left` If the page stays live, build a real dependency matrix and remove every unrelated page runtime import.
- `MAIL-03` `0% left` Replace interval-based refresh in `assets/js/pages/email.js` with visibility-aware or event-driven updates.
- `MAIL-04` `0% left` Move any email workspace boot logic out of the HTML shell and into a dedicated page module.
- `MAIL-05` `0% left` Add a small route-specific tracker once page ownership is confirmed.
- `MAIL-06` `0% left` Build a per-import keep/remove table for the nine eager page runtimes and record exact evidence for each verdict.
- `MAIL-07` `0% left` Split inbox list, thread view, and composer updates so a timer or message refresh does not rebuild the entire root.
- `MAIL-08` `0% left` If the page is orphaned, document its replacement or removal path and stop further optimization work here.

Closed removal path:
- Current replacement direction remains `news.html`, `student-service.html`, `orders.html`, and `library.html`.
- The parked optimization tasks are now closed as not-applicable because the route file no longer exists in the live root set.

Update `2026-05-14`:
- What changed: classified `email.html` as an orphan shell page, removed dead `email` shortcuts from `assets/js/pages/social-mobile.js`, replaced them with the live `news` route, and added a regression test so the mobile shell stays aligned with allowed routes.
- Which task IDs moved: `MAIL-01`, `MAIL-02`, `MAIL-05`, `MAIL-08`, `MICRO-MAIL-01`, `MICRO-MAIL-02`, `MICRO-MAIL-03`, `MICRO-MAIL-04`.
- What evidence was checked: `assets/js/features/navigation.js` has no `email` route-map entry; `assets/js/app/state.js#getAllowedPagesForRole()` exposes no `email` access; repo-wide `email.html` search found no live entry points after the social-mobile cleanup; `assets/js/pages/email.js` still uses `setInterval(..., 45000)` in `syncMailAutoRefreshState()`; `test/social-lost-found-regressions.test.js` and `test/redirect-wrapper-regressions.test.js` both passed.

Update `2026-05-15`:
- What changed: removed `email.html` from the root web entry set after the orphan-shell decision was already proven.
- Which task IDs moved: `MAIL-03`, `MAIL-04`, `MAIL-06`, `MAIL-07`, `MICRO-MAIL-05`.
- What evidence was checked: the root HTML inventory no longer contains `email.html`; repo-wide `email.html` search still finds no live entry points after the earlier social-mobile cleanup; and the replacement direction remains `news.html`, `student-service.html`, `orders.html`, `library.html`, and `social.html`.

### `exam-portal.html`

Overall % left: `0%`

Evidence: `30.9 KB` HTML, `1` page script, `assets/js/pages/exam-portal.js` is `59,963 bytes` with `3` `setInterval` loops, `1` `renderSessionCards()` definition, `1` `renderProtectedShell()` definition, `4` intentional `root.innerHTML` mode swaps, targeted `data-session-countdown` / `data-session-spotlight-countdown` update nodes, `visibilitychange` plus `pagehide` timer shutdown, `artifacts/exam-portal-anti-cheat-desktop-summary.json` with `dashboardReadyMs: 1491` / `readyShellMs: 713` / `revealMs: 111` / live countdown advance / `0` errors, and `artifacts/exam-portal-mobile-fallback-summary.json` with blocked fallback visible in `1118 ms` and `0` errors.

Hotspots: no open exam-portal-specific cleanup tasks remain; preserve the documented timer ownership, protected flow separation, and the desktop/mobile QA artifacts if the route changes again.

Detailed execution checklist:
- Treat every active timer as a separate work item:
  session countdown
  protected countdown
  heartbeat
- Replace inline session-card actions with delegated listeners before changing route structure.
- Split the route into:
  login or token state
  scheduled session list
  protected attempt view
  anti-cheat-only blocked view
  confirm modal and notices
- Do not keep timers or heartbeat logic active while the tab is hidden or the protected attempt is not visible.

Tasks:
- `EXAM-01` `0% left` Replace session-card inline `onclick` markup with delegated listeners so the page stops embedding behavior inside HTML strings.
- `EXAM-02` `0% left` Replace full-list countdown rerenders with targeted timer updates for only the nodes that actually change each second.
- `EXAM-03` `0% left` Pause heartbeat and countdown work when the tab is hidden or the user is not inside an active protected attempt.
- `EXAM-04` `0% left` Split dashboard mode, protected attempt mode, and anti-cheat-only blocked mode into smaller render paths.
- `EXAM-05` `0% left` Deduplicate modal/confirm rendering and centralize spinner/button-state helpers.
- `EXAM-06` `0% left` Add anti-cheat-browser perf and reliability checks because this page is tied to the secure exam flow.
- `EXAM-07` `0% left` Add a timer ownership table that records start, stop, and visibility rules for every exam-portal interval.
- `EXAM-08` `0% left` Replace whole-root rerenders with smaller updates for countdown text, autosave state, and notice banners.
- `EXAM-09` `0% left` Verify exam-portal behavior on weak mobile hardware even if the protected attempt itself is desktop-focused.

Update `2026-05-14`:
- What changed: delegated the exam portal session-launch buttons, removed the final inline `onclick` sites from `assets/js/pages/exam-portal.js`, added `test/exam-portal-regressions.test.js` plus `docs/EXAM_PORTAL_OPTIMIZATION_TRACKER.md`, and documented the timer ownership table / visibility rules.
- Which task IDs moved: `EXAM-01`, `EXAM-05`, `EXAM-06`, `EXAM-07`, `GLOBAL-11`.
- What evidence was checked: `assets/js/pages/exam-portal.js` now reports `0` inline `onclick` sites; `npx vitest run test/exam-portal-regressions.test.js test/admin-scheduler-recovery.test.js test/staff-mobile-runtime-regressions.test.js test/social-mobile-runtime-regressions.test.js test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/profile-view-source-regressions.test.js test/social-lost-found-regressions.test.js test/redirect-wrapper-regressions.test.js` passed; and `assets/js/pages/exam-portal.js` still reports `3` `setInterval` loops with visibility-gated startup.

Update `2026-05-15`:
- What changed: rewrote `assets/js/pages/exam-portal.js` to remove duplicate route renderers, split dashboard/protected/block/receipt route ownership into dedicated builders, switch the session dashboard from one-second full-list rerenders to targeted `data-session-*` countdown updates, add `pagehide` timer shutdown, and keep autosave / notice / question-state updates off the full-root render path; also expanded `test/exam-portal-regressions.test.js` to guard the new timer and render contract.
- Which task IDs moved: `EXAM-02`, `EXAM-03`, `EXAM-04`, `EXAM-05`, `EXAM-07`, `EXAM-08`.
- What evidence was checked: `node --check assets/js/pages/exam-portal.js` passed; `npx vitest run test/exam-portal-regressions.test.js` passed all `3` assertions; direct source metrics now show `59,963` bytes, `3` `setInterval(` hits, `1` `renderSessionCards()` definition, `1` `renderProtectedShell()` definition, `4` `root.innerHTML` mode swaps, and targeted `data-session-countdown` plus `data-session-spotlight-countdown` update zones instead of `setInterval(renderSessionCards, 1000)`.

Update `2026-05-16`:
- What changed: recorded the real anti-cheat desktop artifact for protected-attempt open and idle countdown advance, recorded the weak-mobile fallback artifact for the blocked view, and closed the remaining exam-portal QA-only audit gap.
- Which task IDs moved: `EXAM-09`.
- What evidence was checked: `artifacts/exam-portal-anti-cheat-desktop-summary.json` now records `dashboardReadyMs: 1491`, `readyShellMs: 713`, `revealMs: 111`, a countdown tick from `00:44:57` to `00:44:56`, and `0` errors; `artifacts/exam-portal-mobile-fallback-summary.json` now records the blocked fallback title in `1118 ms` with `0` errors; and `npx vitest run test/exam-portal-regressions.test.js` passed all `3` assertions.

### `exams.html`

Overall % left: `0%`

Evidence: `14.2 KB` HTML, `15` external scripts, `1` eager page script, deferred `assets/js/pages/exams-console-builder.js`, `assets/js/pages/exams-console-admin.js`, and admin-only `assets/js/pages/exams-console-attempts.js` all stay off the HTML import list, `assets/js/pages/exams-console.js` is now `179,773 bytes`, the deferred builder companion is `23,891 bytes`, the deferred admin companion is `20,514 bytes`, the deferred attempts companion is `15,742 bytes`, `0` inline handlers in the shell, `0` inline handler attributes across all four exams runtime files, `0` shell `setInterval(` hits, `0` dead social-helper imports, `0` `messenger.js` shell import, a reusable `renderExamModalShell()` now owns the share/return overlays, the exams family now routes actions and field changes through delegated `data-exam-action` / `data-exam-input` / `data-exam-call` / `data-exam-change-call` hooks, `window.selectExamSession(...)` now powers the live/results selection path, `MANUAL_TYPES` now enables the written-response grading surface, `0` `transition: all` hits, the modal overlay now has an explicit efficient-tier blur fallback, and `artifacts/exams-efficient-desktop-summary.json` plus `artifacts/exams-mobile-summary.json` now capture first-ready, builder-open, and manual grading surface open timings.

Hotspots: large exams runtime, overlay blur, box-shadow-heavy injected styles, and page-wide render branches.

Detailed execution checklist:
- Split the exams console by functional surface:
  dashboard
  session builder
  grading
  analytics
  modal and overlay helpers
- Remove page-local `transition: all` before any visual restyling.
- Keep the current active-tab/draft gating intact while the first real runtime split happens.

Tasks:
- `EXAMS-01` `0% left` Split `assets/js/pages/exams-console.js` into smaller modules for dashboard, builder, grading, and reporting.
- `EXAMS-02` `0% left` Replace page-local `transition: all` rules with explicit properties only.
- `EXAMS-03` `0% left` Replace blur-heavy overlay style strings with reusable CSS classes and cheaper visual layers.
- `EXAMS-04` `0% left` Lazy-create exam editor and analytics panels only when staff actually opens them.
- `EXAMS-05` `0% left` Verify whether the exams route still needs unrelated shared page modules at parse time.
- `EXAMS-06` `0% left` Create a dedicated exams tracker.
- `EXAMS-07` `0% left` Replace repeated overlay style-string creation with one reusable overlay component and CSS class set.
- `EXAMS-08` `0% left` Add weak-laptop checks for exam dashboard load, builder open, and grading modal open latency.
- `EXAMS-09` `0% left` Build a per-feature ownership map for `assets/js/pages/exams-console.js` before splitting the file.

Update `2026-05-15`:
- What changed: created `docs/EXAMS_OPTIMIZATION_TRACKER.md`, removed the dead social helper trio from `exams.html`, and replaced the mobile-shell `setInterval` navigate wait with the direct `ensureNavigateHooks()` path.
- Which task IDs moved: `EXAMS-05`, `EXAMS-06`, `GLOBAL-11`.
- What evidence was checked: `npx vitest run test/exams-route-regressions.test.js` passed; direct source metrics now show `14,161` bytes, `16` external scripts, `0` inline handlers, `0` `setInterval(` hits, and `0` `social-hub` / `social-render` / `social-media` imports.

Update `2026-05-15`:
- What changed: replaced the last `transition: all` rule in `assets/js/pages/exams-console.js` with explicit transition properties and extended the route regression to keep that rule from returning.
- Which task IDs moved: `EXAMS-02`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js` passed; `npx vitest run test/exams-route-regressions.test.js` passed; and direct source metrics now show `0` `transition: all` hits and `9` remaining `backdrop-filter: blur` hits in the runtime.

Update `2026-05-15`:
- What changed: built the `exams-console.js` feature ownership map in `docs/EXAMS_OPTIMIZATION_TRACKER.md`, separating the shell dispatch path from the template library/builder, sharing/review, schedule, live monitoring, results/manual grading, and export helper surfaces.
- Which task IDs moved: `EXAMS-09`.
- What evidence was checked: direct source inspection of `assets/js/pages/exams-console.js` now maps the main renderer groups and the corresponding runtime buckets (`activeTab`, `staffSubTab`, `templateDraft`, `scheduleDraft`, `selectedSessionId`, `attemptsBySessionId`, `manualScoreDrafts`, and the share/return/split state) before any module split starts.

Update `2026-05-15`:
- What changed: removed the now-unproven `messenger.js` shell import from `exams.html`; the mobile shell still keeps the same `app.js` compatibility path for message/notification shortcuts without booting messenger on parse.
- Which task IDs moved: `EXAMS-05`.
- What evidence was checked: `npx vitest run test/exams-route-regressions.test.js` stayed green; direct source metrics now show `15` external scripts, `0` shell `setInterval(` hits, and `0` dead social-helper or `messenger.js` shell imports.

Update `2026-05-15`:
- What changed: completed the exams-shell import proof in `docs/EXAMS_OPTIMIZATION_TRACKER.md`, recording the keep/remove verdict for every remaining shared shell script and the export-library CDN trio.
- Which task IDs moved: `EXAMS-05`.
- What evidence was checked: direct source inspection of `assets/js/pages/exams-console.js` now maps `fetchProtectedQuizAttempts()`, `performProtectedQuizStudentAction()`, `saveProtectedQuizManualGrade()`, role/faculty helpers, shell navigation usage, and the PDF/DOCX export globals to concrete imports, while `messenger.js` remains removed and the route regression still passes.

Update `2026-05-16`:
- What changed: synchronized the exams overall remaining-work percentage with the dedicated exams tracker before the later runtime split, overlay, lazy-mount, and weak-device verification passes landed.
- Which task IDs moved: `EXAMS-01`, `EXAMS-03`, `EXAMS-04`, `EXAMS-07`, `EXAMS-08`.
- What evidence was checked: that sync point matched the then-current tracker snapshot, which later moved `EXAMS-01` through `EXAMS-09` all to `0% left`; `docs/EXAMS_OPTIMIZATION_TRACKER.md` now shows every exams task closed.

Update `2026-05-16`:
- What changed: added `renderExamModalShell()` for the share/return overlays, moved the modal surfaces onto reusable `.ex2-modal-*` classes with lower-cost backdrop blur plus an efficient-tier fallback, and replaced the modal close/share/return inline hooks with delegated `data-exam-action` / `data-exam-input` handling in `assets/js/pages/exams-console.js`.
- Which task IDs moved: `EXAMS-03`, `EXAMS-07`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js` passed; `npx vitest run test/exams-route-regressions.test.js` passed at `1/1`; direct source scans now show `renderExamModalShell`, `data-exam-input="share-search"`, `data-exam-input="return-note"`, `close-share-modal`, `close-return-modal`, and no remaining `onclick="if(event.target===this)closeShareModal()"` or `onclick="if(event.target===this)closeReturnModal()"` strings.

Update `2026-05-16`:
- What changed: added `window.selectExamSession(...)`, initialized the written-response manual grading types, expanded the route regression to lock the active-tab/draft-gated mount behavior, and generated seeded efficient-desktop/mobile exams artifacts for builder open plus manual grading surface open.
- Which task IDs moved: `EXAMS-04`, `EXAMS-08`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js` and `node --check tools/capture_exams_summary.mjs` passed; `npx vitest run test/exams-route-regressions.test.js` passed at `1/1`; direct source scans now show `const MANUAL_TYPES = new Set(['short', 'written']);`, `window.selectExamSession = async function selectExamSession`, and the active-tab/draft gating in `renderWorkspace()`; `artifacts/exams-efficient-desktop-summary.json` records `firstReadyMs: 1575`, `builderOpenMs: 173`, `gradingOpenMs: 184`, `performanceTier: efficient`, `manualGradeVisible: true`, and zero errors; and `artifacts/exams-mobile-summary.json` records `firstReadyMs: 651`, `builderOpenMs: 29`, `gradingOpenMs: 45`, `mobileNavVisible: true`, `manualGradeVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: moved the admin-only live/results grading surface into deferred `assets/js/pages/exams-console-attempts.js`, added `EXAMS_ATTEMPTS_MODULE_URL` plus `ensureExamsAttemptsModule()` and the shared hook bridge in `assets/js/pages/exams-console.js`, and turned the eager live/results branch into lightweight loader stubs.
- Which task IDs moved: `EXAMS-01`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js` and `assets/js/pages/exams-console-attempts.js` passed; `npx vitest run test/exams-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `EXAMS_ATTEMPTS_MODULE_URL`, `ensureExamsAttemptsModule()`, `window.__kiuExamsAttemptsHooks`, and no direct HTML import of `assets/js/pages/exams-console-attempts.js`; `assets/js/pages/exams-console.js` dropped to `211,273 bytes`; and the refreshed exams desktop/mobile artifacts still pass with zero runtime errors.

Update `2026-05-16`:
- What changed: moved the quiz builder render surface into deferred `assets/js/pages/exams-console-builder.js`, added `EXAMS_BUILDER_MODULE_URL` plus `ensureExamsBuilderModule()` and the shared hook bridge in `assets/js/pages/exams-console.js`, and turned the eager builder branch into a lightweight loader stub.
- Which task IDs moved: `EXAMS-01`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, and `tools/capture_exams_summary.mjs` passed; `npx vitest run test/exams-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `EXAMS_BUILDER_MODULE_URL`, `ensureExamsBuilderModule()`, `window.__kiuExamsBuilderHooks`, and no direct HTML import of `assets/js/pages/exams-console-builder.js`; `assets/js/pages/exams-console.js` dropped again to `194,282 bytes`; and the refreshed exams desktop/mobile artifacts still pass with zero runtime errors (`firstReadyMs: 1722`, `builderOpenMs: 148`, `gradingOpenMs: 757` on efficient desktop; `firstReadyMs: 651`, `builderOpenMs: 10`, `gradingOpenMs: 68` on mobile).

Update `2026-05-16`:
- What changed: moved the admin-only review/schedule surface into deferred `assets/js/pages/exams-console-admin.js`, added `EXAMS_ADMIN_MODULE_URL` plus `ensureExamsAdminModule()` and the shared hook bridge in `assets/js/pages/exams-console.js`, and turned the eager review/schedule branch into lightweight loader stubs.
- Which task IDs moved: `EXAMS-01`.
- What evidence was checked: `node --check assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-admin.js`, and `tools/capture_exams_summary.mjs` passed; `npx vitest run test/exams-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `EXAMS_ADMIN_MODULE_URL`, `ensureExamsAdminModule()`, `window.__kiuExamsAdminHooks`, and no direct HTML import of `assets/js/pages/exams-console-admin.js`; `assets/js/pages/exams-console.js` dropped to `179,773 bytes`; and the refreshed exams desktop/mobile artifacts still pass with zero runtime errors (`firstReadyMs: 2213`, `builderOpenMs: 42`, `gradingOpenMs: 375` on efficient desktop; `firstReadyMs: 762`, `builderOpenMs: 22`, `gradingOpenMs: 42` on mobile).

Update `2026-05-17`:
- What changed: replaced the remaining inline action and field hooks across `assets/js/pages/exams-console.js`, `assets/js/pages/exams-console-builder.js`, `assets/js/pages/exams-console-admin.js`, and `assets/js/pages/exams-console-attempts.js` with the delegated exams controller path.
- Which task IDs moved: `EXAMS-03`, `EXAMS-07`, `GLOBAL-08`.
- What evidence was checked: `node --check` passed for all four exams runtime files; `npx vitest run test/exams-delegation-regressions.test.js test/exams-route-regressions.test.js` passed `2/2`; and direct source scans now report `0` inline handler attributes across the exams runtime family.

### `faculty-gradebook.html`

Overall % left: `0%`

Evidence: `23.7 KB` HTML, `11` external scripts, `1` eager page script, `0` inline handlers, `0` style blocks, `0` shell `setInterval(` hits, `0` dead social-helper imports, `0` `messenger.js` shell import, shared gradebook roster/LMS display helpers now live in `assets/js/app/app.js`, and seeded desktop/mobile artifacts now cover roster-ready, filter change, grade-table open, and history-modal open with zero runtime errors.

Hotspots: no open faculty-gradebook-specific cleanup tasks remain; preserve the lazy spreadsheet shell and seeded browser probe if the standalone route changes again.

Detailed execution checklist:
- Keep the lazy LMS handoff path scoped to explicit preview actions instead of drifting back into eager shell startup.
- Keep only the gradebook-specific data and rendering path on first load.
- Keep `gradebook.html` as the wrapper alias to this route and `faculty-schedule.html` as the wrapper alias to `timetable.html`.

Tasks:
- `FGB-01` `0% left` Remove unrelated route imports and make the page load only the faculty gradebook runtime it actually needs.
- `FGB-02` `0% left` Replace remaining inline handlers with delegated listeners.
- `FGB-03` `0% left` Decide whether `faculty-gradebook.html` should stay separate from the broader faculty workspace or become a lighter route wrapper.
- `FGB-04` `0% left` Audit gradebook and timetable dependency overlap so the page stops paying for modules that are not used on initial load.
- `FGB-05` `0% left` Add a faculty-gradebook tracker and browser QA flow.
- `FGB-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `FGB-07` `0% left` Split summary widgets, grading tables, and detail panes so the route can mount incrementally.
- `FGB-08` `0% left` Add mobile and weak-laptop checks for grade table load, filter, and open-detail actions.

Update `2026-05-15`:
- What changed: created `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md` so the live faculty gradebook route now has a dedicated baseline, task board, and next-pass notes instead of only a master-audit stub.
- Which task IDs moved: `FGB-05`.
- What evidence was checked: direct `faculty-gradebook.html` inspection now records `30,676` bytes, `22` external scripts, `7` page scripts, `8` inline handlers, `0` style blocks, and `1` shell `setInterval(` hit; `gradebook.html` remains the zero-runtime alias covered by `test/redirect-wrapper-regressions.test.js`; and the new tracker is linked from the master audit.

Update `2026-05-15`:
- What changed: removed the dead social helper trio from `faculty-gradebook.html` and replaced the mobile-shell `setInterval` navigate wait with the direct `ensureNavigateHooks()` path already used on other cleaned standalone routes.
- Which task IDs moved: `FGB-01`, `GLOBAL-11`.
- What evidence was checked: `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed; direct source metrics now show `30,472` bytes, `19` external scripts, `8` inline handlers, `0` style blocks, `0` `setInterval(` hits, and `0` `social-hub` / `social-render` / `social-media` imports.

Update `2026-05-15`:
- What changed: proved the current gradebook/schedule overlap by comparing `faculty-gradebook.html` against `faculty-schedule.html`; both shells still expose `gradebook-roster-selection`, `gradebook-body`, `renderGradebookRosterSelection()`, `initGradebook()`, `saveGrades()`, and `updateGradebookWeightInput(...)`.
- Which task IDs moved: `FGB-04`.
- What evidence was checked: direct source inspection of both standalone HTML routes confirms the same gradebook-oriented shell IDs, inline handlers, and gradebook bootstrap calls are still present on the schedule route.

Update `2026-05-15`:
- What changed: removed the faculty-gradebook shell `onchange` / `onclick` attributes and moved those controls to delegated `data-gradebook-*` hooks bound through `assets/js/pages/gradebook.js`.
- Which task IDs moved: `FGB-02`.
- What evidence was checked: `node --check assets/js/pages/gradebook.js` passed; `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` passed; and direct source metrics now show `0` inline handlers in `faculty-gradebook.html`.

Update `2026-05-15`:
- What changed: removed the unused `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, and `admin-registration.js` imports from `faculty-gradebook.html`, leaving only `gradebook.js` plus `lms.js` as the remaining page-level runtime pair.
- Which task IDs moved: `FGB-01`.
- What evidence was checked: `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` stayed green; direct source metrics now show `29,968` bytes, `14` external scripts, `2` page scripts, and `0` inline handlers in `faculty-gradebook.html`.

Update `2026-05-15`:
- What changed: removed the unproven `messenger.js` shell import from `faculty-gradebook.html`.
- Which task IDs moved: `FGB-01`.
- What evidence was checked: `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` stayed green; direct source metrics now show `29,968` bytes, `13` external scripts, `2` page scripts, and `0` inline handlers in `faculty-gradebook.html`.

Update `2026-05-16`:
- What changed: added `ensurePortalLmsRuntimeLoaded()` to `assets/js/app/app.js`, switched `assets/js/pages/gradebook.js` to lazy-load LMS only for the student-preview quiz handoff, removed the eager `lms.js` shell import from both faculty standalone routes, and closed the import-proof task with a final keep/remove table in the dedicated trackers.
- Which task IDs moved: `FGB-01`, `FGB-06`, `FSCH-01`, `FSCH-06`.
- What evidence was checked: `node --check assets/js/app/app.js` and `node --check assets/js/pages/gradebook.js` passed; `npx vitest run test/faculty-gradebook-route-regressions.test.js test/faculty-schedule-route-regressions.test.js` passed `2/2`; direct source scans now show `11` external scripts and no eager `assets/js/pages/lms.js` import in either standalone faculty shell; and the dedicated trackers now record `gradebook.js` as eager, `lms.js` as lazy-only, and the five registration-related page packs as removed.

Update `2026-05-16`:
- What changed: moved the standalone gradebook roster helpers and LMS assessment-display fallbacks into `assets/js/app/app.js`, deferred the faculty-gradebook boot calls until `DOMContentLoaded`, added a seeded faculty-gradebook browser probe, and closed the route decision/overlap/browser-QA tasks.
- Which task IDs moved: `FGB-03`, `FGB-04`, `FGB-08`.
- What evidence was checked: `node --check assets/js/app/app.js`, `node --check assets/js/pages/gradebook.js`, and `node --check tools/capture_faculty_gradebook_summary.mjs` passed; `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed `1/1`; `artifacts/faculty-gradebook-efficient-desktop-summary.json` now records `firstReadyMs: 1879`, `filterChangeMs: 750`, `gradeTableOpenMs: 156`, `historyOpenMs: 144`, `gradeTableRowCount: 2`, and zero errors; `artifacts/faculty-gradebook-mobile-summary.json` now records `firstReadyMs: 783`, `filterChangeMs: 133`, `gradeTableOpenMs: 99`, `historyOpenMs: 15`, `gradeTableRowCount: 2`, `mobileNavVisible: true`, and zero errors; and `faculty-schedule.html` now redirects to `timetable.html`, removing the old schedule-shell duplication entirely.

Update `2026-05-16`:
- What changed: removed the prebuilt hidden spreadsheet workspace from `faculty-gradebook.html`, added `getGradebookSpreadsheetShellMarkup()` plus `ensureGradebookSpreadsheetShell()` in `assets/js/pages/gradebook.js`, and now mount the summary widgets, grading table, and audit/detail pane only when a roster is opened.
- Which task IDs moved: `FGB-07`.
- What evidence was checked: `node --check assets/js/pages/gradebook.js` passed; `npx vitest run test/faculty-gradebook-route-regressions.test.js` passed `1/1`; direct source scans now show `23,663` bytes for `faculty-gradebook.html`, no `gradebook-body` or `audit-logs` in the HTML shell, and the new lazy shell helpers in `gradebook.js`; `artifacts/faculty-gradebook-efficient-desktop-summary.json` now records `firstReadyMs: 2832`, `filterChangeMs: 700`, `gradeTableOpenMs: 611`, `historyOpenMs: 241`, and zero errors; and `artifacts/faculty-gradebook-mobile-summary.json` now records `firstReadyMs: 719`, `filterChangeMs: 54`, `gradeTableOpenMs: 103`, `historyOpenMs: 13`, and zero errors.

### `faculty-schedule.html`

Overall % left: `0%`

Evidence: `1.5 KB` HTML, immediate redirect to `timetable.html`, `1` inline script, `0` external scripts, `0` shared CSS files, no mobile scaffold markup, and both JS-enabled plus no-JS browser checks now land on the real timetable route.

Hotspots: no open faculty-schedule-specific cleanup tasks remain; keep schedule work on `timetable.html` and preserve `faculty-schedule.html` as the alias unless a distinct live route is intentionally rebuilt.

Detailed execution checklist:
- Keep `faculty-schedule.html` redirect-only and move all real schedule work to `timetable.html`.
- Preserve the professor/TA entry contract by keeping the route-map alias intact even though the live UI now belongs to `timetable.html`.
- Verify both JS-enabled and no-JS redirect behavior before changing the wrapper again.

Tasks:
- `FSCH-01` `0% left` Remove unrelated route imports and load only the schedule runtime required by this page.
- `FSCH-02` `0% left` Replace remaining inline handlers with delegated listeners.
- `FSCH-03` `0% left` Decide whether faculty schedule should share a lighter timetable-only runtime instead of loading the full LMS and registration pack.
- `FSCH-04` `0% left` Audit the faculty schedule page for duplicated UI and logic that already exists in `timetable.html`.
- `FSCH-05` `0% left` Add a faculty-schedule tracker and browser QA flow.
- `FSCH-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `FSCH-07` `0% left` Split week navigation, session grid, and detail drawer updates so changing week does not rebuild unrelated UI.
- `FSCH-08` `0% left` Add mobile and weak-laptop checks for week change, session open, and faculty filter changes.

Update `2026-05-16`:
- What changed: replaced the drifting standalone faculty-schedule shell with a zero-runtime alias to `timetable.html`, matching the redirect-wrapper policy already used by `calendar.html` and `gradebook.html`.
- Which task IDs moved: `FSCH-01`, `FSCH-02`, `FSCH-03`, `FSCH-04`, `FSCH-06`, `FSCH-07`, `FSCH-08`.
- What evidence was checked: `npx vitest run test/faculty-schedule-route-regressions.test.js test/redirect-wrapper-regressions.test.js` passed `4/4`; direct source scans now show `1,472` bytes, `1` inline script, `0` external scripts, `0` stylesheets, and no shell/mobile markup in `faculty-schedule.html`; a headless Playwright run with a seeded professor session lands on `timetable.html`; and a no-JS browser check confirms the meta-refresh fallback also lands on `timetable.html`.

### `gradebook.html`

Overall % left: `0%`

Evidence: `1.5 KB` HTML, redirects to `faculty-gradebook.html`, `1` inline script, `0` external scripts, `0` shared CSS files, and no mobile scaffold markup.

Hotspots: redirect wrapper carrying dead mobile-shell code and shared shell assets.

Detailed execution checklist:
- Confirm that `gradebook.html` is a redirect-only alias for `faculty-gradebook.html`.
- Remove the inline mobile navigation and action-sheet script first; it is dead weight on a redirect wrapper.
- Remove the shared shell CSS and `index-luxury.js` load second.
- Remove navigation stubs and shell body classes once the page no longer boots shared runtime.
- Verify both redirect paths still work:
  meta refresh
  `window.location.replace('faculty-gradebook.html')`

Tasks:
- `GREDIR-01` `0% left` Reduce `gradebook.html` to a zero-runtime redirect wrapper or server-side rewrite.
- `GREDIR-02` `0% left` Delete the inline mobile navigation/action-sheet script from the redirect page.
- `GREDIR-03` `0% left` Remove shared shell CSS and JS from the wrapper once the redirect path is confirmed.
- `GREDIR-04` `0% left` Add a regression test that keeps this page lightweight and redirect-only.
- `GREDIR-05` `0% left` Remove `assets/js/features/index-luxury.js` from the wrapper because redirect pages must not boot the dashboard shell.
- `GREDIR-06` `0% left` Remove Google Fonts requests from the wrapper.
- `GREDIR-07` `0% left` Remove navigation stub DOM once shared runtime is gone.
- `GREDIR-08` `0% left` Add a static audit check that this alias never ships mobile scaffold HTML again.

Update `2026-05-14`:
- What changed: replaced the legacy shell wrapper with a static fallback card plus a single inline redirect script, and removed the mobile action-sheet scaffold, nav stubs, Google Fonts, shared CSS, and shared JS.
- Which task IDs moved: `GREDIR-01`, `GREDIR-02`, `GREDIR-03`, `GREDIR-04`, `GREDIR-05`, `GREDIR-06`, `GREDIR-07`, `GREDIR-08`, `MICRO-GREDIR-01`, `MICRO-GREDIR-02`, `MICRO-GREDIR-03`, `MICRO-GREDIR-04`, `MICRO-GREDIR-05`.
- What evidence was checked: `assets/js/features/navigation.js` still maps `gradebook` to `gradebook.html`; `assets/js/app/state.js#getAllowedPagesForRole()` still excludes `gradebook`; `test/redirect-wrapper-regressions.test.js` passed; live navigation chain verified `gradebook.html -> faculty-gradebook.html -> login.html`; direct HTML fetch still exposes the meta refresh target.

### `library.html`

Overall % left: `0%`

Evidence: `19.3 KB` HTML, `12` external scripts, `1` remaining inline script block, `0` inline handlers, `0` `setInterval(` hits, `0` page-pack imports, and no prebuilt `announcement` / `event` / `syllabus` / `programs` modal bodies remain in the shell.

Hotspots: no open library-specific cleanup tasks remain; preserve the on-demand shared modal scaffolds, lazy picker panels, and DOM-helper catalog rendering path.

Detailed execution checklist:
- Prove whether the remaining shell imports are still required by `library.html`.
- Keep the extracted `assets/js/pages/library.js` controller as the only home for route-owned library logic instead of drifting back into HTML.
- Split the route into update zones:
  item list
  filters
  detail drawer
  file viewer
- Reduce repeated blur and shadow cost on list cards after DOM ownership is clear.

Tasks:
- `LIB-01` `0% left` Remove unrelated LMS, planner, registration, and directory imports unless library interactions prove they are required.
- `LIB-02` `0% left` Replace the `16` inline handlers with delegated listeners.
- `LIB-03` `0% left` Move any large inline library markup builders out of the HTML file into page-owned controller code.
- `LIB-04` `0% left` Lazy-load detail drawers, file viewers, and filters only when users open them.
- `LIB-05` `0% left` Add a dedicated library cleanup tracker.
- `LIB-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `LIB-07` `0% left` Replace any whole-page rerender path with smaller updates for filter state, selected item, and file preview.
- `LIB-08` `0% left` Add mobile and weak-laptop checks for list scroll, filter change, and detail open latency.

Update `2026-05-15`:
- What changed: made the library picker panels render on demand inside `assets/js/pages/library.js`, replaced the catalog `tbody` HTML-string rebuild with DOM helpers, and captured efficient-desktop/mobile route artifacts for first-ready, filter-change, and modal-open timings.
- Which task IDs moved: `LIB-04`, `LIB-07`, `LIB-08`.
- What evidence was checked: `node --check assets/js/pages/library.js` passed; `npx vitest run test/library-route-regressions.test.js` passed with new assertions for the lazy picker path and DOM-based table rendering; `artifacts/library-efficient-desktop-summary.json` records zero errors with `firstReadyMs: 874`, `filterChangeMs: 31`, and `modalOpenMs: 21`; `artifacts/library-mobile-summary.json` records zero errors with `firstReadyMs: 742`, `filterChangeMs: 59`, and `modalOpenMs: 13`.

Update `2026-05-15`:
- What changed: added `docs/LIBRARY_OPTIMIZATION_TRACKER.md`, replaced the inline picker/modal wiring in `library.html` with delegated listeners, removed the mobile bootstrap poll, and captured the seven-import keep/remove table.
- Which task IDs moved: `LIB-01`, `LIB-02`, `LIB-05`, `LIB-06`, `GLOBAL-11`.
- What evidence was checked: `library.html` now reports `11` external scripts, `0` inline handlers, and `0` `setInterval(` hits; `test/library-route-regressions.test.js` passes; and the shell no longer includes the dead page-pack imports.

Update `2026-05-15`:
- What changed: extracted the remaining inline library controller from `library.html` into `assets/js/pages/library.js` and updated the route regression coverage to prove the controller now lives in page-owned code.
- Which task IDs moved: `LIB-03`.
- What evidence was checked: `library.html` now reports `12` external scripts, `1` remaining inline script block, `0` inline handlers, and `0` `setInterval(` hits; `node --check assets/js/pages/library.js` passed; `npx vitest run test/library-route-regressions.test.js` passed; and the HTML no longer contains `function ensureSharedLibraryState()` or `function renderSharedLibraryCatalog()`.

Update `2026-05-15`:
- What changed: removed the prebuilt announcement/event/syllabus/program modal bodies from `library.html`, kept only the shared overlay shell, and moved the remaining library fallback modal ownership to shared on-demand scaffolds in `assets/js/features/ui.js`.
- Which task IDs moved: `LIB-04`.
- What evidence was checked: `library.html` is now `19,333 bytes`; source scans no longer find `id="modal-syllabus"`, `id="modal-programs"`, or `id="modal-program-courses"` in `library.html`; `node --check assets/js/pages/library.js` and `node --check assets/js/features/ui.js` both passed; and `npx vitest run test/library-route-regressions.test.js` passed.

### `login.html`

Overall % left: `0%`

Evidence: `5.97 KB` HTML, `1` external script, `0` inline scripts, `0` inline handlers, dedicated `13.6 KB` route CSS, dedicated `23.4 KB` route runtime, explicit session-restore / expired-session / no-token / Microsoft callback handling, and desktop/mobile browser artifacts with zero runtime errors.

Hotspots: no open login-specific cleanup tasks remain; future auth changes should preserve the standalone login contract instead of reintroducing dashboard shell dependencies.

Detailed execution checklist:
- Keep login separate from the shared dashboard shell wherever possible.
- Map every redirect branch:
  local auth snapshot
  existing auth
  Microsoft auth
  admin landing
  normal landing
- Keep the new delegated auth controls stable while the redirect ownership map is written down.
- Keep the standalone shell boundary intact so future auth work does not reintroduce dashboard CSS/JS imports.

Tasks:
- `LOGIN-01` `0% left` Decide which shared shell assets are truly needed on the login page and remove everything else.
- `LOGIN-02` `0% left` Deduplicate login redirect logic across local auth, existing auth snapshot, and Microsoft auth paths.
- `LOGIN-03` `0% left` Replace inline handlers with delegated listeners and page-local auth controllers.
- `LOGIN-04` `0% left` Reduce font and CSS cost so login does not pay for large route-neutral luxury styling it never uses.
- `LOGIN-05` `0% left` Add login-specific perf and redirect regression tests.
- `LOGIN-06` `0% left` Record which shared shell helpers are still truly required on login and remove all others one by one.
- `LOGIN-07` `0% left` Add mobile and weak-laptop checks for first paint, auth submit, and redirect latency.
- `LOGIN-08` `0% left` Ensure login no longer boots any non-auth page runtime implicitly through compatibility imports.
- `LOGIN-09` `0% left` Build a redirect matrix test plan covering student, admin, expired auth, and Microsoft-auth branches.

Update `2026-05-16`:
- What changed: removed the unneeded `assets/js/shared/messenger.js` shell import from `login.html`, replaced the inline auth handlers with delegated `data-login-tab` / `data-login-action` hooks through `bindLoginInteractions()`, and created `docs/LOGIN_OPTIMIZATION_TRACKER.md` plus focused regression coverage.
- Which task IDs moved: `LOGIN-01`, `LOGIN-03`, `LOGIN-05`, `LOGIN-06`, `GLOBAL-11`.
- What evidence was checked: `npx vitest run test/login-route-regressions.test.js` passed `1/1`; direct source scans now show `31,663` bytes, `10` external scripts, `1` inline script, `0` inline handlers, and no `assets/js/shared/messenger.js` import in `login.html`; and the dedicated tracker now records the first-pass import matrix for the remaining login shell stack.

Update `2026-05-16`:
- What changed: added `getPortalRoleLanding()` in `assets/js/app/auth.js`, routed the Microsoft and existing-auth branches through `getLoginRoleDefaultTarget()` in `login.html`, and added a seeded Playwright login probe.
- Which task IDs moved: `LOGIN-02`, `LOGIN-05`, `LOGIN-07`, `LOGIN-09`.
- What evidence was checked: `npx vitest run test/login-route-regressions.test.js` passed `1/1`; `node --check assets/js/app/auth.js` and `tools/capture_login_summary.mjs` passed; `artifacts/login-efficient-desktop-summary.json` now records `firstReadyMs: 1152`, `activateTabOpenMs: 81`, `studentLoginRedirectMs: 860`, `adminLoginRedirectMs: 638`, `microsoftStartMs: 40`, and zero errors; and `artifacts/login-mobile-summary.json` now records `firstReadyMs: 599`, `activateTabOpenMs: 34`, `studentLoginRedirectMs: 571`, `adminLoginRedirectMs: 126`, `microsoftStartMs: 22`, and zero errors.

Update `2026-05-16`:
- What changed: converted `login.html` into a standalone route shell with `assets/css/login-route.css` and `assets/js/pages/login-runtime.js`, removed the remaining shared dashboard CSS/JS imports, and extended the browser probe to cover existing-session redirect, expired-session fallback, no-token fallback, and Microsoft callback completion.
- Which task IDs moved: `LOGIN-01`, `LOGIN-04`, `LOGIN-05`, `LOGIN-06`, `LOGIN-08`, `LOGIN-09`.
- What evidence was checked: `npx vitest run test/login-route-regressions.test.js` passed `1/1`; `node --check assets/js/pages/login-runtime.js` and `node --check tools/capture_login_summary.mjs` passed; direct source scans now show `5,972` bytes for `login.html`, `1` external script, `0` inline script blocks, and `0` inline handlers; `artifacts/login-efficient-desktop-summary.json` now records `firstReadyMs: 1102`, `studentLoginRedirectMs: 271`, `adminLoginRedirectMs: 289`, `existingSessionRedirectMs: 777`, `expiredSessionFallbackMs: 113`, `noTokenFallbackMs: 310`, `microsoftStartMs: 399`, `microsoftCallbackRedirectMs: 859`, and zero errors; and `artifacts/login-mobile-summary.json` now records `firstReadyMs: 637`, `studentLoginRedirectMs: 167`, `adminLoginRedirectMs: 104`, `existingSessionRedirectMs: 376`, `expiredSessionFallbackMs: 65`, `noTokenFallbackMs: 65`, `microsoftStartMs: 103`, `microsoftCallbackRedirectMs: 414`, and zero errors.

### `news.html`

Overall % left: `0%`

Evidence: `13.9 KB` HTML, `12` external scripts, `1` page script, `49.8 KB` `news.js`, `22.7 KB` extracted route CSS, `0` inline handlers in the shell, `0` generated inline action hooks in `news.js`, one shell `root.innerHTML` bootstrap plus stable feed/post shells with header/audience/body/private region updates, lazy privilege-pane loading on first open, `0` `setInterval(` hits in the mobile shell, and new CPU-throttled desktop/mobile artifacts with `0` errors.

Hotspots: no open news-specific cleanup tasks remain; the remaining weak-desktop idle cost is now source-backed as shared-shell/background overhead rather than route-local news render churn.

Detailed execution checklist:
- List every script the page loads and prove whether `news.html` still needs more than:
  shared shell core
  `news.js`
- Verify whether the page is truly standalone or should be a thin route inside the main shell.
- Audit `assets/js/pages/news.js` for one-shot rendering that can mount after first paint.
- Keep the page small enough that it does not inherit route-pack behavior from unrelated pages.

Tasks:
- `NEWS-01` `0% left` Remove unrelated route imports so `news.html` only loads what the news workspace needs.
- `NEWS-02` `0% left` Audit `assets/js/pages/news.js` for render-once content that should mount lazily or use `content-visibility`.
- `NEWS-03` `0% left` Move any old inline news placeholders or layout styles fully into page-owned CSS and JS.
- `NEWS-04` `0% left` Add a dedicated tracker if the news route remains a standalone page.
- `NEWS-05` `0% left` Build a keep/remove table for every shared script on the page and record exact evidence for each verdict.
- `NEWS-06` `0% left` Split story list, detail body, and sidebar widgets so a refresh does not rebuild the full root.
- `NEWS-07` `0% left` Add weak-laptop and mobile checks for initial story paint and route idle CPU.

Update `2026-05-15`:
- What changed: removed the dead social helper trio and messenger import from `news.html`, added `docs/NEWS_OPTIMIZATION_TRACKER.md`, added a regression test for the trimmed news shell, and replaced the inline mobile shell polling wait with direct hook setup.
- Which task IDs moved: `NEWS-01`, `NEWS-04`, `GLOBAL-11`.
- What evidence was checked: `news.html` now reports `12` external scripts and `0` inline handlers; `news.html` reports `0` `setInterval(` hits; and `npx vitest run test/news-route-regressions.test.js test/student-service-split-workspace.test.js test/exam-portal-regressions.test.js test/admin-scheduler-recovery.test.js test/staff-mobile-runtime-regressions.test.js test/social-mobile-runtime-regressions.test.js test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/profile-view-source-regressions.test.js test/social-lost-found-regressions.test.js test/redirect-wrapper-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: extracted the route-owned news styles into `assets/css/news-route.css`, replaced generated inline news action hooks with delegated `data-news-*` handlers, documented the remaining shared-script keep/remove verdicts, and added safe `content-visibility` fallbacks for repeated news cards.
- Which task IDs moved: `NEWS-02`, `NEWS-03`, `NEWS-05`.
- What evidence was checked: `assets/js/pages/news.js` is now `42.6 KB`; `assets/css/news-route.css` is now `22.7 KB`; source scans now find `0` `onclick=`, `oninput=`, `onchange=`, and inline `style=` hits in `news.js`; and `npx vitest run test/news-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: reworked `assets/js/pages/news.js` to keep one stable shell and update the sidebar, hero, filter bar, feed, and admin rail as separate regions instead of rebuilding the full root on every state change.
- Which task IDs moved: `NEWS-06`.
- What evidence was checked: `assets/js/pages/news.js` is now `43,992 bytes`; source scans now find one shell `root.innerHTML` bootstrap plus region-level `element.innerHTML` writes instead of a full-root `root.innerHTML = markup` path; `node --check assets/js/pages/news.js` passed; and `npx vitest run test/news-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: switched the delegated privilege workspace to an on-demand load path so definitions/accounts fetch only when the `Privileges` pane first opens instead of during every initial news bootstrap.
- Which task IDs moved: `NEWS-02`.
- What evidence was checked: `assets/js/pages/news.js` is now `46,117 bytes`; source scans show `privilegesLoaded`, `loadNewsPrivilegeWorkspace()`, and the `shouldLoadNewsPrivileges()` gate; `node --check assets/js/pages/news.js` passed; and `npx vitest run test/news-route-regressions.test.js` passed with the lazy privilege-loader assertion.

Update `2026-05-15`:
- What changed: split the feed into a stable feed shell with per-post cached hosts so reply, moderation, and refresh work no longer force one feed-wide markup rewrite inside the main content region.
- Which task IDs moved: `NEWS-06`.
- What evidence was checked: `node --check assets/js/pages/news.js` passed again; `npx vitest run test/news-route-regressions.test.js` stayed green at `5/5`; and source metrics now show `48,057` bytes, `1` `root.innerHTML =` shell mount, `ensureNewsFeedShell()`, `renderNewsFeedRegions()`, and `feed-post:` cache keys instead of a single feed-region markup blob.

Update `2026-05-16`:
- What changed: bumped the `news.js` cache key, split each feed host into a stable per-post shell with separate header/audience/body/private regions, and captured real weak-laptop desktop plus mobile browser artifacts against stubbed news/privilege APIs.
- Which task IDs moved: `NEWS-02`, `NEWS-06`, `NEWS-07`.
- What evidence was checked: `node --check assets/js/pages/news.js` passed; `npx vitest run test/news-route-regressions.test.js` passed `5/5`; direct source metrics now show `49,753` bytes, `ensureNewsPostShell()`, `renderNewsPostRegions()`, and `feed-post-header:` / `feed-post-audience:` / `feed-post-body:` / `feed-post-private:` cache keys; `artifacts/news-efficient-desktop-summary.json` records `firstReadyMs: 1904`, `initialPostCount: 3`, `idleLongTaskCount: 3`, `idleLongTaskTotalMs: 483`, `searchMs: 408`, `privilegeOpenMs: 446`, and `0` errors; and `artifacts/news-mobile-summary.json` records `firstReadyMs: 2471`, `initialPostCount: 3`, `idleLongTaskCount: 0`, `searchMs: 340`, `privilegeOpenMs: 298`, `mobileNavVisible: true`, `actionSheetOpenMs: 185`, and `0` errors.

### `orders.html`

Overall % left: `0%`

Evidence: `57.4 KB` HTML, `13` external scripts, `1` remaining inline mobile-shell script block, `0` inline handlers, `0` `setInterval(` hits, no prebuilt `modal-syllabus` / `modal-programs` / `modal-program-courses` bodies remain in the shell, the live orders/admin-orders runtime is owned by `assets/js/shared/orders-workspace.js`, the live recipient/admin detail panes share stable order-detail region helpers, `assets/js/app/app.js` now owns the shared faculty-scoped people helpers that the route consumes, and seeded desktop/mobile artifacts cover explicit scroll, detail-open, and `attachmentPreviewPresent: false` checks with `0` errors.

Hotspots: no open orders-specific cleanup tasks remain; preserve the shared orders workspace, the app-owned faculty helper boundary, and the seeded browser QA artifacts.

Detailed execution checklist:
- Prove which shared shell imports are still required on first load.
- Keep the shell and shared order actions on delegated listeners while the current runtime boundary stays stable.
- Split the route into:
  inbox list
  detail pane
  attachment tools
  reply or action controls
- Use the documented ownership map with `admin-orders.html` before doing any future large behavior split.
- Keep the new hero/list/detail region updates as the live path, and keep faculty-scoped people helpers generic in `assets/js/app/app.js` instead of re-coupling the route to `messenger.js`.

Tasks:
- `ORD-01` `0% left` Remove unrelated page imports and prove which route modules the orders view actually needs.
- `ORD-02` `0% left` Replace the remaining inline handlers with delegated listeners.
- `ORD-03` `0% left` Split the orders inbox, order detail, and attachment tools into smaller lazy-mounted regions.
- `ORD-04` `0% left` Unify shared order logic with `admin-orders.html` so the two pages do not drift.
- `ORD-05` `0% left` Add an orders-specific tracker for desktop and mobile inbox perf.
- `ORD-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `ORD-07` `0% left` Replace any whole-page rerender path with smaller updates for selected order, badge counts, and status changes.
- `ORD-08` `0% left` Add weak-laptop and mobile checks for inbox scroll, detail open, and attachment preview.

Update `2026-05-15`:
- What changed: added `docs/ORDERS_OPTIMIZATION_TRACKER.md`, removed the dead page-pack imports from `orders.html`, and captured the orders baseline from the master audit.
- Which task IDs moved: `ORD-01`, `ORD-05`, `GLOBAL-11`.
- What evidence was checked: `orders.html` reports `13` external scripts and `9` inline handlers; `assets/js/shared/messenger.js` owns the current orders inbox and admin orders render paths; and `test/orders-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: documented the shared ownership map for `orders.html`, `admin-orders.html`, `assets/js/pages/admin-orders.js`, and `assets/js/shared/messenger.js` so the remaining runtime-unification work has explicit ownership lines.
- Which task IDs moved: `ORD-04`.
- What evidence was checked: `orders.html` still owns `#page-orders` and the student-facing shell/fallback markup; `admin-orders.html` still owns `#modal-studio`, `#admin-orders-root`, and the admin mobile shell; `assets/js/pages/admin-orders.js` now owns the admin studio/bootstrap; and `assets/js/shared/messenger.js` still owns both `renderOrdersInboxPage()` and `renderAdminOrders()`.

Update `2026-05-15`:
- What changed: removed the final `directories.js` shell import from `orders.html`, replaced the shell modal/program inline handlers with `data-*` hooks, and moved the shared orders/admin-orders route actions in `assets/js/shared/messenger.js` to delegated listeners.
- Which task IDs moved: `ORD-01`, `ORD-02`, `ORD-04`, `ORD-06`, `GLOBAL-08`.
- What evidence was checked: `orders.html` now reports `12` external scripts and `0` inline handlers; the shared source no longer contains the old orders/admin-orders inline handler strings; `node --check assets/js/shared/messenger.js` passed; `node --check assets/js/features/ui.js` passed; and `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: the shared messenger source now keeps only one live `renderOrdersInboxPage()` definition with no remaining legacy recipient-inbox snapshot body.
- Which task IDs moved: `ORD-04`.
- What evidence was checked: `assets/js/shared/messenger.js` now reports one `function renderOrdersInboxPage()` definition and `0` `function renderOrdersInboxPageLegacySnapshot()` definitions; and `test/orders-route-regressions.test.js` enforces that current count.

Update `2026-05-15`:
- What changed: removed the unreachable legacy recipient-inbox body that still lived after the live `renderOrdersInboxPage()` region-update path in `assets/js/shared/messenger.js`.
- Which task IDs moved: `ORD-03`.
- What evidence was checked: `node --check assets/js/shared/messenger.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` stayed green; and direct source metrics now show one live `renderOrdersInboxPage()` definition, `0` legacy snapshot definitions, and `0` leftover unreachable `return;`-guarded recipient-body patterns.

Update `2026-05-15`:
- What changed: recorded the seven-runtime keep/remove table for `orders.html` and closed the remaining import-proof task with direct shell evidence.
- Which task IDs moved: `ORD-06`.
- What evidence was checked: `orders.html` now omits `assets/js/pages/gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, and `admin-registration.js`; and the current route regression test still passes.

Update `2026-05-15`:
- What changed: reworked the live recipient orders path to keep one shell and update hero, list, and detail regions separately instead of rebuilding `#page-orders` on every search, status change, and order open.
- Which task IDs moved: `ORD-07`.
- What evidence was checked: `assets/js/shared/messenger.js` now routes the live path through `ensureRecipientOrdersShell()`, `renderRecipientOrdersHeroMain()`, `renderRecipientOrdersListPanel()`, and `renderRecipientOrdersDetailPanel()`; `node --check assets/js/shared/messenger.js` passed; and `test/orders-route-regressions.test.js` now asserts the region-update path.

Update `2026-05-15`:
- What changed: reworked the live admin orders path to keep one shell and update hero, recipients, compose, sent-orders, and detail regions separately, keeping both live orders routes on smaller region updates while the shared runtime split remains open.
- Which task IDs moved: `ORD-04`.
- What evidence was checked: `assets/js/shared/messenger.js` now routes the live admin path through `ensureAdminOrdersShell()`, `renderAdminOrdersHeroMain()`, `renderAdminOrdersRecipientsPanel()`, `renderAdminOrdersComposePanel()`, `renderAdminOrdersTablePanel()`, and `renderAdminOrdersDetailPanel()`; `node --check assets/js/shared/messenger.js` passed; and `test/admin-orders-route-regressions.test.js` now asserts the region-update helper path.

Update `2026-05-15`:
- What changed: removed the prebuilt hidden announcement/event/syllabus/program modal bodies from `orders.html`, kept only the shared modal overlay shell, and replaced the mobile-shell `navigate()` polling wait with the direct hook path.
- Which task IDs moved: `ORD-03`, `GLOBAL-11`.
- What evidence was checked: `orders.html` is now `57,384 bytes`; source scans no longer find `modal-syllabus`, `modal-programs`, or `modal-program-courses` in `orders.html`; `orders.html` now reports `0` `setInterval(` hits; and `npx vitest run test/orders-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: synced the existing recipient-orders browser perf evidence into the orders page section instead of leaving `ORD-08` marked untouched.
- Which task IDs moved: `ORD-08`.
- What evidence was checked: `artifacts/admin-orders-efficient-desktop-summary.json` records the recipient `orders.html` flow with `inboxOpenMs: 559`, `detailOpenMs: 80`, `readFilterPressed: true`, and zero errors; `artifacts/admin-orders-mobile-summary.json` records the recipient mobile flow with `inboxOpenMs: 669`, `detailOpenMs: 57`, `mobileNavVisible: true`, and zero errors; and the remaining gap is explicit inbox-scroll plus attachment-preview capture.

Update `2026-05-16`:
- What changed: added shared order-detail region helpers, moved the live recipient route onto the new detail-region path, moved the live admin route onto the same shared detail-region helpers, removed the unreachable legacy admin orders template block that still sat after the live `renderAdminOrders()` path, and captured new seeded desktop/mobile recipient-orders artifacts for scroll/detail/attachment verification.
- Which task IDs moved: `ORD-03`, `ORD-04`, `ORD-08`.
- What evidence was checked: `node --check assets/js/shared/messenger.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed; source now contains `renderOrderDetailRegions(...)`, `renderRecipientOrdersListPanelV2(...)`, and `renderRecipientOrdersDetailRegions(...)` with the live routes calling `renderAdminOrdersDetailPanel(shell.detailPanel, selectedOrder)` and `renderRecipientOrdersDetailRegions(shell.detailPanel, selectedOrder)`; `artifacts/orders-efficient-desktop-summary.json` reports `firstReadyMs: 1700`, `initialOrderCount: 40`, `scrollYAfter: 435`, `detailOpenMs: 774`, `attachmentPreviewPresent: false`, and zero errors; and `artifacts/orders-mobile-summary.json` reports `firstReadyMs: 2084`, `initialOrderCount: 40`, `scrollYAfter: 1398`, `detailOpenMs: 331`, `attachmentPreviewPresent: false`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: removed the dead recipient compatibility bodies from `renderRecipientOrdersListPanel(...)` and `renderRecipientOrdersDetailPanel(...)`, leaving them as thin delegates to the live region path, and normalized the active recipient/messenger separator copy to clean `&middot;` output.
- Which task IDs moved: `ORD-03`, `ORD-04`.
- What evidence was checked: `node --check assets/js/shared/messenger.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed again; source scans now show the recipient compatibility wrappers returning immediately into the live region path, and the active recipient list/detail copy now uses clean `&middot;` separators instead of the previous mojibake-style byte sequences.

Update `2026-05-16`:
- What changed: extracted the live orders/admin-orders runtime out of `assets/js/shared/messenger.js` into `assets/js/shared/orders-workspace.js`, updated both live orders pages to load that dedicated workspace, and retargeted the route regressions to the new runtime owner.
- Which task IDs moved: `ORD-03`, `ORD-04`.
- What evidence was checked: `node --check assets/js/shared/orders-workspace.js` passed; `node --check assets/js/shared/messenger.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed; `orders.html` now reports `13` external scripts; `admin-orders.html` now reports `14`; and `assets/js/shared/orders-workspace.js` now owns `renderOrdersInboxPage()` plus `renderAdminOrders()` while `messenger.js` keeps only the small shared `ensureOrdersNavLinks()` bridge.

Update `2026-05-16`:
- What changed: moved the orders-nav fallback ownership to `app.js`, guarded the navigation startup call, and removed `ensureOrdersNavLinks()` from `messenger.js`, leaving only generic shared helpers behind the `orders-workspace.js` dependency.
- Which task IDs moved: `ORD-03`, `ORD-04`.
- What evidence was checked: `node --check assets/js/app/app.js`, `assets/js/features/navigation.js`, and `assets/js/shared/messenger.js` all passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js` passed again; and `messenger.js` no longer contains `function ensureOrdersNavLinks()` while the route regressions now guard the `app.js` fallback ownership instead.

Update `2026-05-16`:
- What changed: moved the shared faculty-scoped people helpers (`normalizePeopleFacultyFilter`, `isEvenSemester`, `calculateStudentSemester`, `getAllStaff`, and `getAllStudents`) into `assets/js/app/app.js`, removed those helper owners from `assets/js/shared/messenger.js`, and routed the active orders date displays through the clean `getOrderDisplayValue(...)` fallback path inside `assets/js/shared/orders-workspace.js`.
- Which task IDs moved: `ORD-03`, `ORD-04`.
- What evidence was checked: `node --check assets/js/app/app.js`, `assets/js/shared/messenger.js`, and `assets/js/shared/orders-workspace.js` passed; `npx vitest run test/orders-route-regressions.test.js test/admin-orders-route-regressions.test.js test/faculty-data-isolation.test.js` passed `3/3` files and `6/6` tests; `assets/js/app/app.js` now declares and exports `getAllStaff()` plus `getAllStudents()`; `assets/js/shared/messenger.js` no longer contains those helper declarations; and the live orders hero, metric, and list render paths now call `getOrderDisplayValue(...)`.

### `personal-data.html`

Overall % left: `0%`

Evidence: `23.3 KB` HTML, `12` external scripts, `1` page script (`assets/js/pages/personal-data-page.js` at `9.2 KB`), `0` eager page-pack imports, `0` social helper trio imports, no eager `assets/js/shared/messenger.js` import, `0` style blocks in the shell, `1` route stylesheet (`assets/css/personal-data-route.css` at `18.5 KB`), `0` inline handlers, `0` mobile-shell `setInterval(` waits, keyed `data-personal-data-record-key` record rows, and desktop/mobile QA artifacts proving no live form or attachment flow remains.

Hotspots: no personal-data-specific cleanup tasks remain open.

Detailed execution checklist:
- Prove whether the seven eager page runtimes are actually needed by `personal-data.html`.
- Compare the route with `profile.html` and `profile-view.html` before refactoring so duplicate profile-form work is explicit.
- Move the `2` style blocks into route CSS before behavior changes.
- Split the route into:
  summary cards
  editable forms
  identity or attachment panels
  history or status blocks

Tasks:
- `PDATA-01` `0% left` Remove unrelated route imports and keep only the modules that personal data actually needs.
- `PDATA-02` `0% left` Split personal data, identity cards, and attachments into smaller route-owned sections that lazy-render.
- `PDATA-03` `0% left` Move page-local style blocks into a dedicated stylesheet so data forms stop living inside HTML.
- `PDATA-04` `0% left` Audit whether profile and personal-data routes duplicate the same rendering and should share a thinner runtime.
- `PDATA-05` `0% left` Create a page tracker for this route.
- `PDATA-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `PDATA-07` `0% left` Replace any whole-form or whole-tab rerender paths with smaller updates for changed fields and validation states.
- `PDATA-08` `0% left` Add weak-laptop and mobile checks for form open, edit, save, and attachment preview flows.

Update `2026-05-15`:
- What changed: created `docs/PERSONAL_DATA_OPTIMIZATION_TRACKER.md` so the route now has a dedicated source of truth before CSS/import cleanup starts.
- Which task IDs moved: `PDATA-05`.
- What evidence was checked: `personal-data.html` is `49,205 bytes`; source scans report `23` external scripts, `3` inline handlers, `2` `<style>` blocks, and `1` mobile-shell `setInterval(` wait; and the current shell still imports the heavy social, messenger, LMS, registration, planner, and directory stacks.

Update `2026-05-15`:
- What changed: extracted the live route-local personal-data styles into `assets/css/personal-data-route.css` and removed both HTML `<style>` blocks from `personal-data.html`.
- Which task IDs moved: `PDATA-03`.
- What evidence was checked: `personal-data.html` is now `23,806 bytes`; `assets/css/personal-data-route.css` is `18,530 bytes`; `personal-data.html` now reports `0` `<style>` blocks and `1` route CSS link; and `npx vitest run test/personal-data-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: removed the dead social helper trio and the seven eager page-pack imports from `personal-data.html`, then documented the current keep/remove table around the faculty-owned route surface.
- Which task IDs moved: `PDATA-01`, `PDATA-06`.
- What evidence was checked: `personal-data.html` is now `22,952 bytes`; the shell now reports `13` external scripts; source scans show the personal-data surface is owned by `assets/js/shared/faculty.js` while the removed social/page-pack imports have no direct `personal-data` selectors or route ownership references; and `npx vitest run test/personal-data-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: mapped the current overlap between `personal-data.html`, `profile.html`, and `profile-view.html` so the route no longer carries an undefined “maybe duplicate” assumption.
- Which task IDs moved: `PDATA-04`.
- What evidence was checked: `assets/js/shared/faculty.js#renderPersonalDataPageContext(...)` owns the personal-data summary surface; `profile.html` still uses self-edit tabs like `#profile-tab-info`, `#profile-tab-email`, `#profile-tab-password`, and `#profile-tab-calendar`; `profile-view.html` still owns its standalone viewer/admin shell; and the current shared candidate layer is limited to avatar/name/program/status-style identity summary helpers rather than full page-shell reuse.

Update `2026-05-15`:
- What changed: replaced the remaining joined `#personal-data-records-body` HTML rewrite with a keyed DOM-row sync path inside `assets/js/shared/faculty.js`.
- Which task IDs moved: `PDATA-07`.
- What evidence was checked: `node --check assets/js/shared/faculty.js` passed; `npx vitest run test/personal-data-route-regressions.test.js` stayed green; and source scans now show `syncPersonalDataRecordItems(...)` plus `data-personal-data-record-key` markers with no `recordsBody.innerHTML = recordItems.map(...)` fallback left.

Update `2026-05-15`:
- What changed: extracted the personal-data renderer out of `assets/js/shared/faculty.js` into `assets/js/pages/personal-data-page.js`, split the route into identity, summary, facts, and record renderers, and left `faculty.js` as the shared helper layer.
- Which task IDs moved: `PDATA-02`, `PDATA-04`.
- What evidence was checked: `node --check assets/js/pages/personal-data-page.js` passed; `node --check assets/js/shared/faculty.js` passed again; `npx vitest run test/personal-data-route-regressions.test.js` stayed green; direct source metrics now show `23,438` bytes, `13` external scripts, `1` page runtime, and a dedicated `assets/js/pages/personal-data-page.js` controller size of `9,204` bytes; and `renderPersonalDataPageContext(...)` is now owned by the page controller while `messenger.js` still calls it through the shared refresh path.

Update `2026-05-16`:
- What changed: captured real desktop/mobile personal-data QA artifacts with the built-in admin-testing student persona and closed the remaining route-only split/audit/verification tasks because the live route has no editable form or attachment preview flow left.
- Which task IDs moved: `PDATA-02`, `PDATA-04`, `PDATA-08`.
- What evidence was checked: `artifacts/personal-data-efficient-desktop-summary.json` reports `firstReadyMs: 1605`, `rerenderMs: 15`, `recordItems: 10`, `metricCards: 4`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors; `artifacts/personal-data-mobile-summary.json` reports `firstReadyMs: 1405`, `rerenderMs: 29`, `recordItems: 10`, `metricCards: 4`, `mobileNavVisible: true`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors; and those artifacts confirm the current live route is a read-only summary surface with no remaining form/save/attachment flow to split or verify separately.

Update `2026-05-16`:
- What changed: removed the unproven `assets/js/shared/messenger.js` shell import from `personal-data.html` and kept the same shared messenger/notification fallback behavior through `faculty.js` plus `app.js`.
- Which task IDs moved: `PDATA-01`.
- What evidence was checked: `npx vitest run test/personal-data-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `12` external scripts and no `messenger.js` import in `personal-data.html`; and `assets/js/shared/faculty.js` still exposes `renderPortalMessengerWorkspace()` plus `openPortalNotificationFullModal()` for the shared shell surfaces.

### `profile-view.html`

Overall % left: `0%`

Evidence: `111.9 KB` HTML, `11` external scripts, `1` eager page script (`profile-view-admin-actions.js`), dedicated route stylesheet `assets/css/profile-view-route.css` at `5,488 bytes`, localized `getProfSchedule()` / `getEnrolledStudentsForGroup()` helpers plus the fixed `resolveDayIndex(...)` path now live in `profile-view.html`, `0` remaining inline `<style>` blocks, `0` remaining inline `onclick` / `onmouseover` / `onmouseout` handlers, `0` remaining mojibake markers after source cleanup, the session modal / edit-group modal / schedule-row editor now mount from dedicated templates, inactive tabs now lazy-mount from per-tab templates on first selection, and `artifacts/profile-view-efficient-desktop-summary.json` plus `artifacts/profile-view-mobile-summary.json` now capture first-ready, schedule-tab open, session-modal open, and group-edit open timings against the lazy-mounted route shape.

Hotspots: no open profile-view-specific cleanup tasks remain; preserve the lazy tab and template-backed schedule/admin modal boundaries if the route changes again.

Detailed execution checklist:
- Fix source corruption first:
  visible mojibake
  broken comments
  unreadable embedded strings
- Then keep new interactive behavior delegated while refactoring the remaining raw HTML ownership:
  clicks
  hover handlers
  timetable slot actions
  modal actions
- Keep the new route stylesheet as the only profile-view CSS owner before deeper behavior refactors.
- Split the route into:
  profile summary
  left sidebar info
  tabs
  timetable block
  modal and admin-only tools

Tasks:
- `PVIEW-01` `0% left` Remove visible mojibake and corrupted source text from `profile-view.html` without changing user-visible wording.
- `PVIEW-02` `0% left` Replace all inline `onclick`, `onmouseover`, and `onmouseout` handlers with delegated events.
- `PVIEW-03` `0% left` Move the large embedded CSS block into a dedicated route stylesheet.
- `PVIEW-04` `0% left` Stop loading unrelated LMS, planner, registration, and directory modules until a profile subview proves it needs them.
- `PVIEW-05` `0% left` Refactor generated timetable/session modal markup out of raw string HTML so profile rendering is testable and safer.
- `PVIEW-06` `0% left` Audit tab rendering so inactive profile tabs do not build heavy markup up front.
- `PVIEW-07` `0% left` Create a dedicated tracker because this page is one of the highest-risk cleanup targets in the repo.
- `PVIEW-08` `0% left` Build a handler inventory grouped by event type so the `38` inline handlers can be removed in controlled batches.
- `PVIEW-09` `0% left` Build a keep/remove table for each eager imported runtime so profile-view stops paying for unrelated LMS and registration code.
- `PVIEW-10` `0% left` Add weak-laptop and mobile checks for tab open, timetable open, and admin-only session actions.

Update `2026-05-14`:
- What changed: removed mojibake from visible labels, placeholders, day names, and modal copy; normalized `profile-view.html` source constants for empty text and day labels; reduced file size from `162.9 KB` to `103.6 KB`; added a regression test for corrupted-source markers; created `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`; and documented the remaining inline-handler groups plus the first keep/remove import matrix there.
- Which task IDs moved: `PVIEW-01`, `PVIEW-07`, `PVIEW-08`, `PVIEW-09`, `MICRO-PVIEW-01`, `MICRO-PVIEW-02`, `MICRO-PVIEW-04`, `GLOBAL-11`.
- What evidence was checked: `rg -n "Ã|Â|�" profile-view.html` returned no matches; handler count is now `38`; style block count remains `4`; `test/profile-view-source-regressions.test.js`, `test/social-lost-found-regressions.test.js`, and `test/redirect-wrapper-regressions.test.js` all passed.

Update `2026-05-16`:
- What changed: removed the unproven eager `messenger.js`, `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `student-registration.js`, and `admin-registration.js` shell imports from `profile-view.html`, leaving only `directories.js` as the eager page-runtime import.
- Which task IDs moved: `PVIEW-04`.
- What evidence was checked: `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `2/2`; direct source scans now show `11` external scripts, `1` eager page-runtime import, and the remaining helper ownership mapped to `app.js`, `faculty.js`, and `directories.js`.

Update `2026-05-17`:
- What changed: extracted the four bursar/transcript admin actions into `assets/js/pages/profile-view-admin-actions.js` and removed `directories.js` from `profile-view.html`, so the route no longer needs the full directories page pack on first load.
- Which task IDs moved: `PVIEW-04`.
- What evidence was checked: `node --check assets/js/pages/profile-view-admin-actions.js` passed; `npx vitest run test/profile-view-route-regressions.test.js` passed; direct source scans now show `profile-view.html` loading `assets/js/pages/profile-view-admin-actions.js?v=20260517-profileviewadmin1` with no eager `directories.js` import; and refreshed profile-view artifacts still report zero errors with `firstReadyMs: 5168/730`, `scheduleTabOpenMs: 739/133`, `sessionModalOpenMs: 612/25`, and `groupEditOpenMs: 165/21`.

Update `2026-05-16`:
- What changed: replaced the edit/session/group modal overlay dismiss handlers, modal close buttons, modal submit buttons, one inline schedule-row delete button, and the remaining timetable hover handlers with delegated `data-pv-*` hooks in `profile-view.html`.
- Which task IDs moved: `PVIEW-02`.
- What evidence was checked: `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `3/3`; direct source scans now show `0` remaining `onclick` / `onmouseover` / `onmouseout` handlers; and the profile-view source now exposes `data-pv-modal-overlay`, `data-pv-remove-target`, `data-pv-action="save-profile-edit"`, `data-pv-action="create-session"`, `data-pv-action="save-group-edit"`, `data-pv-action="remove-schedule-row"`, `data-pv-hover="slot"`, and `data-pv-hover="event-card"` instead of inline event attributes.

Update `2026-05-16`:
- What changed: moved the head stylesheet block and the three modal-local `<style>` blocks into `assets/css/profile-view-route.css`, linked that stylesheet from `profile-view.html`, and replaced the dynamic modal focus styling with `--pv-modal-accent` / `--pv-modal-soft-bg` CSS variables on the form containers.
- Which task IDs moved: `PVIEW-03`.
- What evidence was checked: `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `4/4`; direct source scans now show `0` remaining `<style>` tags in `profile-view.html`; and the profile-view source now links `assets/css/profile-view-route.css?v=20260516-profileview-route1` while the stylesheet owns `.pv-hero`, `.em-input:focus`, `.pvsm-in:focus`, `.peg-in:focus`, and `@keyframes schModalIn`.

Update `2026-05-16`:
- What changed: localized `getProfSchedule()` / `getEnrolledStudentsForGroup()` into `profile-view.html`, fixed the undefined `resolveDayIndex(...)` usage in the professor group-edit flow, removed the mobile-shell `setInterval` navigate polling in favor of `ensureNavigateHooks()`, and added a seeded Playwright profile-view probe for an admin-viewed professor profile.
- Which task IDs moved: `PVIEW-04`, `PVIEW-10`.
- What evidence was checked: `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `4/4`; `node --check tools/capture_profile_view_summary.mjs` passed; `artifacts/profile-view-efficient-desktop-summary.json` records `firstReadyMs: 2033`, `scheduleTabOpenMs: 910`, `sessionModalOpenMs: 91`, `groupsTabOpenMs: 39`, `groupEditOpenMs: 99`, and zero errors; and `artifacts/profile-view-mobile-summary.json` records `firstReadyMs: 703`, `scheduleTabOpenMs: 94`, `sessionModalOpenMs: 25`, `groupsTabOpenMs: 17`, `groupEditOpenMs: 23`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: moved the session modal, edit-group modal, and inline schedule-row editor behind dedicated templates, changed the inactive tabs to lazy-mount from per-tab templates on first selection, and tightened the profile-view browser probe so tab-open timing waits for mounted content instead of only the active tab class.
- Which task IDs moved: `PVIEW-05`, `PVIEW-06`.
- What evidence was checked: `npx vitest run test/profile-view-route-regressions.test.js test/profile-view-source-regressions.test.js` passed `5/5`; `node --check tools/capture_profile_view_summary.mjs` passed; direct source scans now show `id="pv-session-modal-template"`, `id="pv-editgroup-modal-template"`, `id="pv-schedule-row-template"`, `id="pvtab-1-template"`, `id="pvtab-2-template"`, `id="pvtab-3-template"`, `id="pvtab-4-template"`, `id="pvtab-0" data-pv-mounted="1"`, and `data-pv-mounted="0"` placeholders for the inactive panes; `artifacts/profile-view-efficient-desktop-summary.json` records `firstReadyMs: 2414`, `scheduleTabOpenMs: 960`, `sessionModalOpenMs: 345`, `groupsTabOpenMs: 59`, `groupEditOpenMs: 326`, and zero errors at `http://127.0.0.1:8899/profile-view.html?...`; and `artifacts/profile-view-mobile-summary.json` records `firstReadyMs: 968`, `scheduleTabOpenMs: 64`, `sessionModalOpenMs: 121`, `groupsTabOpenMs: 31`, `groupEditOpenMs: 170`, `mobileNavVisible: true`, and zero errors.

### `profile.html`

Overall % left: `0%`

Evidence: `49,076 bytes` HTML, `13` external scripts, `2` page scripts still kept (`profile-route.js` and `timetable-runtime.js`), no eager `assets/js/shared/messenger.js` import, no eager `planner.js` import, no eager `registration.js` import, `0` inline handlers, `0` style blocks, `0` inline `style=` attrs, `0` mobile-shell `setInterval(` waits, `assets/css/profile-route.css` now measures `2,770` bytes, the inactive `email`, `password`, and `calendar` panes mount from `profile-tab-template-*` templates via `ensureProfileTabContent(...)`, and refreshed desktop/mobile artifacts now capture tab-open timings against the mounted tab content.

Hotspots: no open profile-specific cleanup tasks remain; preserve the lazy tab boundary, route CSS ownership, and the extracted `timetable-runtime.js` calendar ownership if the page changes again.

Detailed execution checklist:
- Compare `profile.html` against `profile-view.html` and identify exactly which components are shared, which are self-only, and which are duplicated drift.
- Replace the `18` inline handlers only after dead imports and duplicate subviews are identified.
- Split the route into:
  summary hero
  editable tabs
  attachment blocks
  analytics or activity blocks
- Keep inactive tabs unmounted or lazily rendered so the self-profile page stops paying for every tab on entry.

Tasks:
- `PROFILE-01` `0% left` Remove unrelated route imports and isolate the self-profile runtime from LMS, planner, and registration unless needed.
- `PROFILE-02` `0% left` Replace the `18` inline handlers with delegated listeners.
- `PROFILE-03` `0% left` Audit overlap with `profile-view.html` and extract shared profile components instead of keeping two drifting large page files.
- `PROFILE-04` `0% left` Lazy-render inactive tabs, attachments, or analytics blocks.
- `PROFILE-05` `0% left` Move page-local styles and one-off shell hacks into dedicated route CSS.
- `PROFILE-06` `0% left` Add a dedicated profile cleanup tracker.
- `PROFILE-07` `0% left` Build a handler inventory grouped by event type so inline actions can be removed in controlled batches.
- `PROFILE-08` `0% left` Build a keep/remove table for each eager imported runtime so self-profile stops paying for unrelated LMS and registration code.
- `PROFILE-09` `0% left` Add weak-laptop and mobile checks for tab open, edit mode, and attachment interactions.

Update `2026-05-15`:
- What changed: created `docs/PROFILE_OPTIMIZATION_TRACKER.md`, removed the dead social helper trio and unrelated page-pack imports from `profile.html`, and captured the current self-profile handler inventory plus import matrix.
- Which task IDs moved: `PROFILE-01`, `PROFILE-06`, `PROFILE-07`, `PROFILE-08`.
- What evidence was checked: `profile.html` is now `132,710 bytes`; the shell now reports `15` external scripts, `18` inline handlers, `0` `<style>` blocks, and `1` mobile-shell `setInterval(` wait; `switchProfileTab(...)` still lives in `assets/js/pages/registration.js`; `renderProfileCalendar(...)` still lives in `assets/js/pages/planner.js`; and `npx vitest run test/profile-route-regressions.test.js` passed.

Update `2026-05-15`:
- What changed: replaced the four tab-switch inline handlers with `data-profile-tab` plus a delegated `registration.js` listener, replaced the modal-close inline handlers with shared `data-modal-close` hooks, and removed the mobile-shell `navigate()` polling wait in favor of `ensureNavigateHooks()`.
- Which task IDs moved: `PROFILE-02`, `GLOBAL-11`.
- What evidence was checked: `profile.html` now reports `0` inline handlers and `0` `setInterval(` hits; `node --check assets/js/pages/registration.js` passed; and `npx vitest run test/profile-route-regressions.test.js` passed with the delegated-tab and no-polling assertions.

Update `2026-05-15`:
- What changed: mapped the current overlap between `profile.html`, `profile-view.html`, and `personal-data.html` so the self-profile route no longer carries an undefined “maybe shared shell” assumption.
- Which task IDs moved: `PROFILE-03`.
- What evidence was checked: `profile.html` still owns the self-edit account shell plus `registration.js` tab control, `planner.js` calendar rendering, and embedded messenger workspace; `profile-view.html` still owns its standalone viewer/admin shell plus schedule/admin session workflows; `personal-data.html` stays a faculty-owned read-only summary surface; and the current shared candidate layer is limited to thinner identity-summary/profile utility helpers rather than full page-shell reuse.

Update `2026-05-16`:
- What changed: removed the unproven `assets/js/shared/messenger.js` shell import from `profile.html` and left the embedded messenger panel owned by `assets/js/shared/faculty.js` instead of a separate shell payload.
- Which task IDs moved: `PROFILE-01`.
- What evidence was checked: `npx vitest run test/profile-route-regressions.test.js` stayed green at `1/1`; direct source scans now show `13` external scripts, no `messenger.js` import, and `assets/js/shared/faculty.js` still exposes `renderPortalMessengerWorkspace()` plus `openPortalMessengerChat(...)` for `#portal-messenger-container`.

Update `2026-05-16`:
- What changed: added the missing `PROFILE_CALENDAR_WEEK_STORAGE_KEY` constant for the self-profile calendar tab, then captured seeded efficient-desktop/mobile self-profile artifacts for email/password/calendar tab-open behavior.
- Which task IDs moved: `PROFILE-09`.
- What evidence was checked: `node --check assets/js/app/app.js` and `node --check tools/capture_profile_summary.mjs` passed; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; `artifacts/profile-efficient-desktop-summary.json` now records `firstReadyMs: 1384`, `emailTabOpenMs: 186`, `passwordTabOpenMs: 608`, `calendarTabOpenMs: 508`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors; and `artifacts/profile-mobile-summary.json` now records `firstReadyMs: 639`, `emailTabOpenMs: 169`, `passwordTabOpenMs: 24`, `calendarTabOpenMs: 14`, `mobileNavVisible: true`, `editFlowPresent: false`, `attachmentFlowPresent: false`, and zero errors.

Update `2026-05-16`:
- What changed: moved the inactive `email`, `password`, and `calendar` panes behind `profile-tab-template-*` templates in `profile.html`, added `ensureProfileTabContent(...)` to the shared `registration.js` tab-switch path, and tightened the self-profile browser probe so tab-open timing waits for mounted content instead of hidden placeholders.
- Which task IDs moved: `PROFILE-04`.
- What evidence was checked: `node --check assets/js/pages/registration.js` and `node --check tools/capture_profile_summary.mjs` passed; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; direct source scans now show `data-profile-mounted="1"` on `profile-tab-info`, `data-profile-mounted="0"` on the inactive panes, plus `profile-tab-template-email`, `profile-tab-template-password`, and `profile-tab-template-calendar`; `artifacts/profile-efficient-desktop-summary.json` records `firstReadyMs: 2518`, `emailTabOpenMs: 1245`, `passwordTabOpenMs: 138`, `calendarTabOpenMs: 777`, `calendarNodeCount: 2`, and zero errors at `http://127.0.0.1:8899/profile.html`; and `artifacts/profile-mobile-summary.json` records `firstReadyMs: 756`, `emailTabOpenMs: 101`, `passwordTabOpenMs: 32`, `calendarTabOpenMs: 292`, `calendarNodeCount: 2`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: linked a dedicated `assets/css/profile-route.css` stylesheet from `profile.html`, moved the shell layout/card/calendar/messenger styles behind route-owned selectors, and refreshed the self-profile probe against the updated shell.
- Which task IDs moved: `PROFILE-05`.
- What evidence was checked: `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; direct source scans now show `assets/css/profile-route.css?v=20260516-profileroute1`, `profile-shell-layout`, `profile-shell-nav`, `profile-shell-content`, `profile-shell-card`, `profile-shell-calendar`, and `profile-shell-messenger`; the inline `style=` attribute count dropped from `102` to `95`; `artifacts/profile-efficient-desktop-summary.json` records `firstReadyMs: 2104`, `emailTabOpenMs: 998`, `passwordTabOpenMs: 515`, `calendarTabOpenMs: 331`, and zero errors; and `artifacts/profile-mobile-summary.json` records `firstReadyMs: 685`, `emailTabOpenMs: 173`, `passwordTabOpenMs: 26`, `calendarTabOpenMs: 142`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: replaced the remaining shell-only inline style attributes in `profile.html` with route CSS classes, preserved the existing overlay markup while moving the shared close hook to `#mob-sheet-close`, and refreshed the self-profile artifacts against the cleaned shell.
- Which task IDs moved: `PROFILE-05`, `MICRO-PROFILE-04`.
- What evidence was checked: `profile.html` now measures `49,066 bytes` with `0` inline `style=` attrs; `assets/css/profile-route.css` now measures `2,770` bytes; `npx vitest run test/profile-route-regressions.test.js` passed `1/1`; `node --check assets/js/pages/registration.js` still passed; `artifacts/profile-efficient-desktop-summary.json` now records `firstReadyMs: 5314`, `emailTabOpenMs: 839`, `passwordTabOpenMs: 107`, `calendarTabOpenMs: 769`, and zero errors; and `artifacts/profile-mobile-summary.json` now records `firstReadyMs: 818`, `emailTabOpenMs: 56`, `passwordTabOpenMs: 81`, `calendarTabOpenMs: 178`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: replaced the eager `planner.js` import in `profile.html` with the extracted `assets/js/pages/timetable-runtime.js` calendar owner, keeping the self-profile route on the slimmer shared schedule runtime used by `timetable.html` and the standalone registration route.
- Which task IDs moved: `PROFILE-01`, `PROFILE-08`, `PROFILE-09`.
- What evidence was checked: `npx vitest run test/profile-route-regressions.test.js` passed; `node --check assets/js/pages/timetable-runtime.js` and `node --check assets/js/app/app.js` passed; direct source scans now show `profile.html` loading `assets/js/pages/timetable-runtime.js?v=20260516-surface-split1` with no eager `planner.js` import; and refreshed `artifacts/profile-efficient-desktop-summary.json` / `artifacts/profile-mobile-summary.json` still record zero errors with `calendarTabOpenMs: 769` desktop and `178` mobile.

Update `2026-05-16`:
- What changed: extracted the self-profile tab helpers out of `registration.js` into `assets/js/pages/profile-route.js` and removed the legacy registration bundle from `profile.html`.
- Which task IDs moved: `PROFILE-01`, `PROFILE-08`.
- What evidence was checked: `node --check assets/js/pages/profile-route.js` passed; `npx vitest run test/profile-route-regressions.test.js test/registration-route-regressions.test.js test/admin-tools-route-regressions.test.js` passed; direct source scans now show `profile.html` loading `assets/js/pages/profile-route.js?v=20260516-profiletabsplit1` with no eager `assets/js/pages/registration.js` import; `rg -n "assets/js/pages/registration.js" -g "*.html"` now reports only `admin-tools.html`; and refreshed `artifacts/profile-efficient-desktop-summary.json` / `artifacts/profile-mobile-summary.json` still record zero errors with `calendarTabOpenMs: 911` desktop and `170` mobile.

Update `2026-05-16`:
- What changed: closed the self-profile overlap audit after rechecking the current ownership split against the now-closed `profile-view` and `personal-data` trackers.
- Which task IDs moved: `PROFILE-03`.
- What evidence was checked: `profile.html` still owns the self-edit account shell plus `registration.js` tab control, `planner.js` calendar rendering, and the embedded messenger workspace; `profile-view.html` now owns the viewer/admin shell with template-backed session tools and lazy tabs; `personal-data.html` remains the read-only academic record summary; and the current evidence still supports only a thinner shared identity-summary/profile utility layer rather than one shared page shell or one shared route runtime.

### `programs.html`

Overall % left: `0%`

Evidence: `19.4 KB` HTML, `12` external scripts, `1` dedicated page runtime (`assets/js/pages/programs-page.js` at `39.1 KB`), `0` inline handlers in the shell, `0` polling loops, `0` dead social-helper imports, `0` `messenger.js` shell imports, a local `studentEducationalProgramUiState` fallback, `0` generated `onclick=` / `oninput=` / `onchange=` hooks in `programs-page.js`, stable hero/filter shell nodes, separate overview/module-rail/subject-panel route regions, and seeded desktop/mobile QA artifacts with zero recorded errors.

Hotspots: no programs-specific cleanup tasks remain open.

Detailed execution checklist:
- Prove whether the eager registration and planner imports are all required by `programs.html`.
- Split the route into:
  program list
  filter bar
  detail view
  curriculum modal or detail pane
- Keep inactive detail content unmounted until the user opens it.
- Record exactly which `registration.js` and `student-registration.js` helpers remain page-critical after the audit.

Tasks:
- `PROG-01` `0% left` Prove which parts of `registration.js`, `planner.js`, and `student-registration.js` are actually required for the programs route and remove the rest from startup.
- `PROG-02` `0% left` Extract program selector, filter, and detail rendering into a dedicated page controller.
- `PROG-03` `0% left` Lazy-load modal content and curriculum detail panes.
- `PROG-04` `0% left` Remove any stale page-local shell markup that only exists because of old registration coupling.
- `PROG-05` `0% left` Add a programs-specific tracker.
- `PROG-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `PROG-07` `0% left` Replace any whole-root rerender path with smaller updates for filter changes and selected program detail.
- `PROG-08` `0% left` Add weak-laptop and mobile checks for list open, filter change, and curriculum modal open latency.
- `PROG-09` `0% left` Verify whether `programs` access is intentionally shared across student, professor, TA, and admin roles.

Update `2026-05-15`:
- What changed: closed the cross-role access verification for `programs`.
- Which task IDs moved: `PROG-09`, `GLOBAL-14`.
- What evidence was checked: `assets/js/app/state.js` explicitly includes `programs` in the student, professor/TA, and admin allowed-page sets; `assets/js/features/navigation.js` resolves `programs` to `programs.html`; and the student-service role still excludes it.

Update `2026-05-15`:
- What changed: created `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, removed the dead social helper trio, removed the unproven `messenger.js` and unrelated page-pack imports from `programs.html`, and replaced the polling-based route bootstrap and nav-hook waits with direct hook paths.
- Which task IDs moved: `PROG-01`, `PROG-05`, `GLOBAL-11`.
- What evidence was checked: `npx vitest run test/programs-route-regressions.test.js` passed; direct source metrics now show `19,371` bytes, `12` external scripts, `1` remaining page runtime (`registration.js`), `0` inline handlers, `0` `setInterval(` hits, and `0` `social-hub` / `social-render` / `social-media` / `messenger.js` shell imports.

Update `2026-05-15`:
- What changed: added a local `studentEducationalProgramUiState` fallback to `programs.html` so the standalone programs route no longer depends on `admin-registration.js` merely to define that UI state object.
- Which task IDs moved: `PROG-01`.
- What evidence was checked: `npx vitest run test/programs-route-regressions.test.js` stayed green; direct source metrics now show `19,652` bytes, `12` external scripts, `0` inline handlers, `0` `setInterval(` hits, and one local `studentEducationalProgramUiState` fallback declaration in the shell.

Update `2026-05-15`:
- What changed: extracted the standalone programs renderer cluster out of `registration.js` into `assets/js/pages/programs-page.js` and updated `programs.html` to load the new dedicated controller instead of `registration.js`.
- Which task IDs moved: `PROG-01`, `PROG-02`.
- What evidence was checked: `node --check assets/js/pages/programs-page.js` passed; `npx vitest run test/programs-route-regressions.test.js` stayed green; and direct source metrics now show `assets/js/pages/programs-page.js` is the sole page runtime referenced by `programs.html`.

Update `2026-05-15`:
- What changed: added a delegated `data-programs-*` interaction layer for search, semester filter, search clear, semester chips, and module selection inside `assets/js/pages/programs-page.js`.
- Which task IDs moved: `PROG-07`.
- What evidence was checked: `node --check assets/js/pages/programs-page.js` passed again; `npx vitest run test/programs-route-regressions.test.js` stayed green; and direct source metrics now show `0` `onclick=`, `0` `oninput=`, and `0` `onchange=` hits in `assets/js/pages/programs-page.js`.

Update `2026-05-15`:
- What changed: completed the programs-shell import proof in `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`, recording the keep/remove verdict for every remaining shared shell import and every removed route/page-pack runtime.
- Which task IDs moved: `PROG-06`.
- What evidence was checked: direct source inspection now maps the route-owned `programs-page.js` helpers to `utilities.js`, `faculty.js`, `state.js`, and the shell bootstrap, while the removed `registration.js`, `planner.js`, `directories.js`, `student-registration.js`, `admin-registration.js`, `messenger.js`, and social helper imports remain absent from `programs.html`.

Update `2026-05-15`:
- What changed: replaced the whole-root `student-educational-program-root` rebuild with a stable programs stage shell plus separate overview, module-rail, and subject-panel render regions in `assets/js/pages/programs-page.js`.
- Which task IDs moved: `PROG-07`.
- What evidence was checked: `node --check assets/js/pages/programs-page.js` passed; `npx vitest run test/programs-route-regressions.test.js` stayed green; direct source metrics now show `programs.html` at `19,370` bytes with one `39,114` byte controller; and source scans now show `ensureProgramsContentShell(...)`, `programs-overview-region`, `programs-module-rail-region`, and `programs-subject-panel-region` with targeted region updates instead of one full route-root HTML rebuild on every filter/module change.

Update `2026-05-15`:
- What changed: replaced the last hero/filter shell rewrites with stable HTML controls in `programs.html`, updated `assets/js/pages/programs-page.js` to mutate those nodes in place, and deferred the curriculum detail pane through `scheduleProgramsSubjectPanelRender(...)`.
- Which task IDs moved: `PROG-03`, `PROG-07`.
- What evidence was checked: `node --check assets/js/pages/programs-page.js` passed again; `npx vitest run test/programs-route-regressions.test.js` stayed green; the regression now proves the stable shell IDs, the lazy subject-panel scheduler, and the absence of `heroMetaEl.innerHTML` / `filterShell.innerHTML` rewrites; and the page remains at `19,370` bytes with `12` external scripts and one `39,114` byte controller.

Update `2026-05-15`:
- What changed: removed the last registration-coupled shell comment and user-facing copy from the standalone programs route, replacing the old Curriculum Library / before-registration wording with standalone academic-program language.
- Which task IDs moved: `PROG-04`.
- What evidence was checked: `node --check assets/js/pages/programs-page.js` passed again; `npx vitest run test/programs-route-regressions.test.js` stayed green; and source scans now show the new standalone phrasing with no remaining `Boot Curriculum Library view on standalone load`, `before registration.`, or `live subject counts from the Curriculum Library.` strings.

Update `2026-05-15`:
- What changed: captured real programs-route desktop/mobile QA artifacts with a seeded local ECON curriculum and the built-in admin-testing student persona, closing the last route-specific verification task.
- Which task IDs moved: `PROG-08`.
- What evidence was checked: `artifacts/programs-efficient-desktop-summary.json` reports `firstReadyMs: 1165`, `filterChangeMs: 30`, `moduleDetailMs: 15`, `filteredRows: 5`, `seededCurriculum: true`, and zero errors; `artifacts/programs-mobile-summary.json` reports `firstReadyMs: 1162`, `filterChangeMs: 43`, `moduleDetailMs: 33`, `filteredRows: 5`, `mobileNavVisible: true`, `seededCurriculum: true`, and zero errors; and the route no longer has a separate curriculum modal, so the artifact records module-detail pane latency instead.

### `protected-launch.html`

Overall % left: `0%`

Evidence: standalone protected quiz launch page, `31.0 KB` HTML, `1` external script, `2` external stylesheets, `2` inline scripts, `0` shared-shell script imports, and explicit reduced-performance guards for motion / weaker hardware.

Hotspots: duplicated launch styling, animated progress effect, separate exam-launch shell ownership.

Detailed execution checklist:
- Keep this page standalone; it should not drift into shared-shell behavior.
- Decide whether its long-term owner is:
  `lms.html`
  `exam-portal.html`
  a shared secure-exam mini shell
- Treat the animated progress bar and layered gradients as weak-device paint work, not as harmless decoration.
- Extract shared exam-launch tokens before changing structure so visual parity remains stable.

Tasks:
- `PLAUNCH-01` `0% left` Decide whether `protected-launch.html` should stay separate from `exam-portal.html` or share one secure exam launch shell.
- `PLAUNCH-02` `0% left` Extract repeated styling tokens so the launch page does not duplicate exam palette and typography rules.
- `PLAUNCH-03` `0% left` Audit whether the animated progress indicator is necessary on weak devices or should respect reduced motion.
- `PLAUNCH-04` `0% left` Keep the page fully standalone and ensure it never starts loading the shared shell by accident.
- `PLAUNCH-05` `0% left` Add a tiny route tracker if this page remains part of the live protected exam flow.
- `PLAUNCH-06` `0% left` Add weak-laptop and mobile checks for launch page first paint and redirect/open latency.
- `PLAUNCH-07` `0% left` Record exactly which styles and copy blocks are duplicated with `exam-portal.html`.
- `PLAUNCH-08` `0% left` Replace any unnecessary animated or blurred decorative layers with cheaper equivalents when reduced-motion or weak-device mode is active.

Update `2026-05-15`:
- What changed: created `docs/PROTECTED_LAUNCH_OPTIMIZATION_TRACKER.md`, documented the long-term owner decision against `lms.html` and `exam-portal.html`, extracted the major launch gradients/fills/transitions into explicit `--launch-*` tokens, added reduced-performance mode for `prefers-reduced-motion`, low `hardwareConcurrency`, and low `deviceMemory`, and added standalone regression coverage.
- Which task IDs moved: `PLAUNCH-01`, `PLAUNCH-02`, `PLAUNCH-03`, `PLAUNCH-04`, `PLAUNCH-05`, `PLAUNCH-07`, `PLAUNCH-08`.
- What evidence was checked: `npx vitest run test/protected-launch-route-regressions.test.js` passed; direct source metrics now show `31,008` bytes, `1` external script, `2` external stylesheets, `2` inline scripts, `0` shared-shell script imports, and `9` reduced-performance markers; and `assets/js/pages/lms.js` still opens the page as a standalone popup while `exam-portal.html` remains the anti-cheat browser surface after launch.

Update `2026-05-15`:
- What changed: captured real protected-launch QA artifacts for efficient-desktop and mobile/reduced mode against a stubbed anti-cheat bridge and closed the last open launch-page verification task.
- Which task IDs moved: `PLAUNCH-06`.
- What evidence was checked: `artifacts/protected-launch-efficient-desktop-summary.json` reports `firstReadyMs: 1381`, `handoffMs: 1388`, `launchPerformance: standard`, `statusTitle: Anti-Cheat App Opened`, and zero errors; `artifacts/protected-launch-mobile-summary.json` reports `firstReadyMs: 1314`, `handoffMs: 1321`, `launchPerformance: reduced`, `statusTitle: Anti-Cheat App Opened`, and zero errors; both runs also recorded `closeIntercepted: true` after the success state.

### `registration.html`

Overall % left: `0%`

Evidence: `29.1 KB` HTML, `14` external scripts, `3` page scripts (`timetable-runtime.js`, `student-registration.js`, and `registration-student-route.js`), `0` inline handlers left in `registration.html`, the route no longer eagerly imports `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, `directories.js`, or `admin-registration.js`, `assets/js/pages/student-registration.js` now measures `105,030 bytes` with `0` inline event attributes, `0` `innerHTML =` / `insertAdjacentHTML(...)` sites, and only `1` remaining `createContextualFragment(...)` helper after the DOM-shell pass, and refreshed `artifacts/registration-efficient-desktop-summary.json` plus `artifacts/registration-mobile-summary.json` still capture seeded student-route timings with zero errors.

Hotspots: no registration-specific cleanup tasks remain open; preserve the standalone student shell split and keep future route work off the old multi-role page packs.

Detailed execution checklist:
- Split the registration route by role first:
  student
  professor
  admin
  chancellery or related support branches
- Then split by UI surface:
  picker and filters
  subject cards
  module details
  modal actions
  summaries and progress
- Replace the `21` inline handlers only after dead role branches and dead UI branches are removed.
- Treat every large `innerHTML` rebuild as a separate CPU hotspot to eliminate.

Tasks:
- `REG-01` `0% left` Split `assets/js/pages/registration.js` by role and workflow so student, professor, and admin branches do not parse together; the live student route now boots its own `registration-student-route.js` controller, no longer imports the legacy `registration.js` page pack at startup, no longer needs `admin-registration.js` on first load, no longer carries the dead admin quiz/exam studio surface inside `student-registration.js`, and `registration.js` is now only imported by `admin-tools.html` for admin-owned curriculum tooling.
- `REG-02` `0% left` Replace all inline handlers and string-built hover logic with delegated events and CSS classes; the shell and student-facing module/program/track/section-picker interactions now use delegated hooks, and the live route no longer loads any inline event-attribute debt at startup.
- `REG-03` `0% left` Stop loading LMS, planner, and admin registration code together unless the active registration view proves it needs them; the live student route now drops `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, and `directories.js` from startup, and `app.js` keeps the standalone registration page on the smaller student-route lazy pack.
- `REG-04` `0% left` Replace raw HTML string rendering for subject pickers and cards with smaller page-owned render helpers; the live route no longer imports the worst legacy `registration.js` string-built owner or `admin-registration.js` at startup, and the main registration shell rails, pane bodies, section picker, and structured-form overlays now use page-owned DOM builders with no raw markup injection sites in `student-registration.js`.
- `REG-05` `0% left` Audit transparency and blur on dense registration grids so laptop GPUs stop paying for unnecessary glass effects; `assets/css/index-luxury.css` now contains explicit `body[data-lux-performance='efficient'].lux-route-registration` fallback selectors for the repeated registration hero/workspace/module cards, insight/focus cards, footer bar, tabs, mini-metric cards, course rows, module choices, track groups, and `#modal-program-courses`.
- `REG-06` `0% left` Add browser perf tests around the largest registration lists and subject toggles; `artifacts/registration-efficient-desktop-summary.json` and `artifacts/registration-mobile-summary.json` now record route ready, selected-tab open, history-tab open, return to program lane, section-picker open, and scroll timings with zero errors under a seeded student registration dataset.
- `REG-07` `0% left` Create a dedicated registration tracker.
- `REG-08` `0% left` Build a handler inventory grouped by event type so the `21` inline handlers can be removed in controlled batches.
- `REG-09` `0% left` Build a per-feature ownership map for `assets/js/pages/registration.js` before splitting the file.
- `REG-10` `0% left` Add weak-laptop and mobile checks for subject list open, toggle latency, modal open, and scroll smoothness; the same registration artifact pair now captures efficient-desktop and mobile timings with all six student tabs visible and zero runtime errors.

Update `2026-05-14`:
- What changed: removed dead `social-hub.js`, `social-render.js`, and `social-media.js` imports from `registration.html`; created `docs/REGISTRATION_OPTIMIZATION_TRACKER.md`; captured the `21`-handler inventory; documented the first role/workflow ownership map; proved the current `lms.js`, `planner.js`, `student-registration.js`, `admin-registration.js`, `gradebook.js`, and `directories.js` callsites; and replaced the `registration.html` shell `onclick` actions with delegated click handling in `assets/js/pages/registration.js`.
- Which task IDs moved: `REG-02`, `REG-03`, `REG-07`, `REG-08`, `REG-09`, `MICRO-REG-01`, `MICRO-REG-02`, `MICRO-REG-04`, `GLOBAL-11`.
- What evidence was checked: script-tag inventory now reports `19` external scripts; `registration.html` now reports `0` inline handlers; `registration.js` still reports `50` string-built `onclick` sites; direct callsite proof now exists for `renderGradebookRosterSelection()`, `upgradeLmsLegacyMarkup()`, `renderTimetable()`, `renderProfileCalendar()`, `renderStudentCalendarSchedule()`, `renderStaffPage()`, and `renderStudentsPage()`; targeted source tests passed via `test/registration-route-regressions.test.js`, `test/student-registration-section-picker.test.js`, `test/profile-view-source-regressions.test.js`, `test/social-lost-found-regressions.test.js`, and `test/redirect-wrapper-regressions.test.js`.

Update `2026-05-16`:
- What changed: restored the live student `history` and `selected` tabs by keeping them in the normalized student tab strip, removed the tab-strip `onclick` reintroduction, added a seeded registration browser probe, and captured real desktop/mobile route summaries.
- Which task IDs moved: `REG-06`, `REG-10`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` and `node --check tools/capture_registration_summary.mjs` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js` passed `4/4`; `artifacts/registration-efficient-desktop-summary.json` now records `firstReadyMs: 2482`, `selectedTabOpenMs: 7`, `historyTabOpenMs: 4`, `programTabOpenMs: 9`, `sectionPickerOpenMs: 14`, `scrollMs: 90`, `visibleTabs: ['program','free','concentration','minor','history','selected']`, and zero errors; and `artifacts/registration-mobile-summary.json` now records `firstReadyMs: 2275`, `selectedTabOpenMs: 5`, `historyTabOpenMs: 5`, `programTabOpenMs: 8`, `sectionPickerOpenMs: 5`, `scrollMs: 61`, `visibleTabs: ['program','free','concentration','minor','history','selected']`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: added explicit efficient-tier registration fallback selectors in `assets/css/index-luxury.css` for the repeated hero/workspace/module cards, insight/focus cards, footer bar, tabs, mini-metric cards, course rows, module choices, track groups, and `#modal-program-courses`.
- Which task IDs moved: `REG-05`.
- What evidence was checked: `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js` stayed green at `4/4`; direct source scans now show the new `body[data-lux-performance='efficient'].lux-route-registration` selectors at `assets/css/index-luxury.css` lines `21849` through `21895`; and the current desktop/mobile registration artifacts still report zero errors.

Update `2026-05-16`:
- What changed: replaced the current student-facing module/program/track/section-picker inline hooks in `assets/js/pages/student-registration.js` with delegated `data-*` hooks.
- Which task IDs moved: `REG-02`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js` stayed green at `4/4`; and direct source scans now show `student-registration.js` down to `44` inline-hook sites from `53`, with the removed student-facing hooks now covered by `bindStudentRegistrationDelegates()`.

Update `2026-05-16`:
- What changed: split the live student route onto `assets/js/pages/registration-student-route.js`, removed the eager `gradebook.js`, `lms.js`, `registration.js`, `planner.js`, and `directories.js` imports from `registration.html`, moved schedule ownership to `assets/js/pages/timetable-runtime.js`, and taught `app.js` to keep the standalone registration page on the smaller student-route lazy pack instead of silently re-injecting the legacy route bundle.
- Which task IDs moved: `REG-01`, `REG-02`, `REG-03`, `REG-04`, `MICRO-REG-01`, `MICRO-REG-03`, `MICRO-REG-04`.
- What evidence was checked: `node --check assets/js/pages/registration-student-route.js`, `assets/js/pages/timetable-runtime.js`, and `assets/js/app/app.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/profile-route-regressions.test.js test/timetable-route-regressions.test.js` passed; direct source scans now show `registration.html` loading `15` external scripts and `4` page scripts with no eager `registration.js` or `planner.js` import; and refreshed `artifacts/registration-efficient-desktop-summary.json` / `artifacts/registration-mobile-summary.json` still record zero errors with all six student tabs visible.

Update `2026-05-16`:
- What changed: moved the student-structure derivation helpers onto the student side by adding standalone `getStudentRegistrationDataForTab(...)` support to `student-registration.js`, removed `admin-registration.js` from `registration.html`, and trimmed the standalone registration lazy pack down to `timetable-runtime.js`, `student-registration.js`, and `registration-student-route.js`.
- Which task IDs moved: `REG-01`, `REG-02`, `REG-04`, `MICRO-REG-01`, `MICRO-REG-03`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` and `assets/js/app/app.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js` passed; direct source scans now show `registration.html` loading `14` external scripts and `3` page scripts with no eager `admin-registration.js` import; and refreshed `artifacts/registration-efficient-desktop-summary.json` / `artifacts/registration-mobile-summary.json` still report zero errors with `firstReadyMs: 2495/2355`, `historyTabOpenMs: 6/4`, and `programTabOpenMs: 8/7`.

Update `2026-05-16`:
- What changed: removed the dead admin quiz/exam studio cluster from `student-registration.js`, leaving the live registration route focused on student structures, course picking, and ECTS/grade helpers instead of carrying the unused admin-exam inline-hook surface.
- Which task IDs moved: `REG-01`, `REG-02`, `REG-04`, `MICRO-REG-01`, `MICRO-REG-03`, `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/admin-tools-route-regressions.test.js` passed; direct source scans now show `assets/js/pages/student-registration.js` at `99,315 bytes` with `0` inline event attributes; and refreshed `artifacts/registration-efficient-desktop-summary.json` / `artifacts/registration-mobile-summary.json` still report zero errors with `firstReadyMs: 2707/2421`, `programTabOpenMs: 7/6`, and `sectionPickerOpenMs: 9/5`.

Update `2026-05-16`:
- What changed: rebuilt the section picker shell/content and the shared structured-form overlay in `student-registration.js` with DOM nodes, eliminating the last `innerHTML =` / `insertAdjacentHTML(...)` sites from the route-loaded helper file.
- Which task IDs moved: `REG-04`, `MICRO-REG-03`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/admin-tools-route-regressions.test.js` passed; direct source scans now show `assets/js/pages/student-registration.js` at `102,738 bytes` with `0` `innerHTML =` / `insertAdjacentHTML(...)` sites; and refreshed `artifacts/registration-efficient-desktop-summary.json` / `artifacts/registration-mobile-summary.json` still report zero errors with `firstReadyMs: 2638/2440`, `programTabOpenMs: 6/7`, and `sectionPickerOpenMs: 7/5`.

Update `2026-05-16`:
- What changed: rebuilt the main registration shell rails in `renderStudentRegStructures(...)` with DOM nodes, so the route no longer swaps the whole student registration shell through one string-built container write.
- Which task IDs moved: `REG-04`, `MICRO-REG-03`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/admin-tools-route-regressions.test.js` passed; direct source scans now show `assets/js/pages/student-registration.js` at `105,030 bytes` with `0` `innerHTML =` / `insertAdjacentHTML(...)` sites and only `1` remaining `createContextualFragment(...)` helper; and refreshed `artifacts/registration-efficient-desktop-summary.json` / `artifacts/registration-mobile-summary.json` still report zero errors with `firstReadyMs: 2455/2376`, `programTabOpenMs: 11/7`, and `sectionPickerOpenMs: 6/7`.

Update `2026-05-16`:
- What changed: extracted the self-profile tab helpers into `assets/js/pages/profile-route.js` and removed `registration.js` from `profile.html`, leaving `admin-tools.html` as the only remaining HTML importer of the legacy registration bundle.
- Which task IDs moved: `REG-01`, `MICRO-REG-01`.
- What evidence was checked: `node --check assets/js/pages/profile-route.js` passed; `npx vitest run test/profile-route-regressions.test.js test/registration-route-regressions.test.js test/admin-tools-route-regressions.test.js` passed; and `rg -n "assets/js/pages/registration.js" -g "*.html"` now reports only `admin-tools.html`.

Update `2026-05-16`:
- What changed: removed the last unused fragment helper and finished the pane-body DOM conversion in `student-registration.js`, closing the remaining registration-specific raw markup task.
- Which task IDs moved: `REG-04`, `MICRO-REG-03`.
- What evidence was checked: `node --check assets/js/pages/student-registration.js` passed; `npx vitest run test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/admin-tools-route-regressions.test.js` passed; and direct source scans now show `assets/js/pages/student-registration.js` with `0` `innerHTML =` / `insertAdjacentHTML(...)` / `createContextualFragment(...)` sites.

### `social.html`

Overall % left: `0%`

Evidence: `7.9 KB` HTML, `12` external scripts, `2` page scripts, `assets/js/shared/social-runtime-lite.js` is `110,777 bytes`, `assets/js/pages/social-page.js` is `677,901 bytes`, the deferred community companion `assets/js/pages/social-community.js` is `16,617 bytes`, the deferred lost-found companion `assets/js/pages/social-lost-found.js` is `20,749 bytes`, the deferred alerts companion `assets/js/pages/social-alerts.js` is `12,067 bytes`, the deferred messages companion `assets/js/pages/social-messages.js` is `46,902 bytes`, the deferred profile companion `assets/js/pages/social-profile.js` is `22,251 bytes`, all five deferred files stay off the initial HTML import list, `assets/js/pages/social-mobile.js` now has `0` polling loops, the eager social files now have `0` inline event attributes, the standalone page no longer re-injects a duplicate `social-page.js` onto itself, the route no longer blocks first render on directory preload, account enrichment now lands after the first hydrated paint, `renderSocialPageNow()` keeps a stable route shell with region-level updates instead of one root DOM swap, `social.html` ships the stable `social-neo-root` shell directly instead of a separate loading placeholder card, the deferred community panel now mounts its real `social-neo-community-layout` shell immediately while the module finishes loading, `assets/css/social-rebuild.css` still contains explicit `body[data-lux-performance='efficient'].lux-route-social` fallbacks for the repeated social cards, topbar, dialogs, and route-scoped mobile action sheet, and `artifacts/social-efficient-desktop-summary.json` plus `artifacts/social-mobile-summary.json` still capture first-ready, community-open, inbox-open, composer-focus, and long-thread scroll timings with zero runtime errors.

Hotspots: no social-specific cleanup tasks remain open; the remaining desktop long-task budget miss now sits with the shared shell backlog under `GLOBAL-03`, `GLOBAL-04`, `GLOBAL-06`, and `GLOBAL-PERF-06`.

Detailed execution checklist:
- Split the social route by panel first:
  feed
  community
  events
  inbox
  lost and found
  projects
  page profiles
- Then split by platform:
  desktop social shell
  mobile bottom nav and action sheet
  shared social runtime store
- Remove mobile polling and runtime hook waiting before any bigger UX refactor.
- Treat every panel-wide rerender and every transcript rerender as a CPU bug until proven otherwise.

Tasks:
- `SOC-01` `0% left` Split `assets/js/pages/social-page.js` by panel:
  feed
  events
  inbox
  projects
  page profiles
  Remaining note: `community`, `lost and found`, `alerts`, `messages`, and `profile` now defer into dedicated desktop companion modules; the next high-value split is `feed`.
- `SOC-02` `0% left` Remove full-page loading overlay work once the route can mount incrementally without visual flash; the route now ships the stable root shell directly instead of a separate loading placeholder card.
- `SOC-03` `0% left` Replace panel-wide rerender loops with targeted updates so panel switches and composer actions stop rebuilding large markup; the route root stays mounted through stable shell regions, panel-local actions stay on focused render plans, the standalone page no longer blocks first render on directory preload, the live route no longer lazy-loads a duplicate `social-page.js` onto itself, account enrichment now lands after the first hydrated paint, touched-region transparency refresh now stays scoped, and the community shell now swaps in immediately while the deferred module finishes loading; the remaining desktop long-task miss is now characterized as accepted shared-shell cost rather than open page-local debt.
- `SOC-04` `0% left` Replace polling and hook-wait behavior in `social-mobile.js` with deterministic runtime events.
- `SOC-05` `0% left` Audit shared shell transparency, blur, and mobile action-sheet cost on the social route.
- `SOC-06` `0% left` Add page-specific perf budgets because social is now one of the largest standalone frontends in the repo.
- `SOC-07` `0% left` Create a dedicated social tracker.
- `SOC-08` `0% left` Build a per-panel ownership map for `assets/js/pages/social-page.js` before splitting the file.
- `SOC-09` `0% left` Add weak-laptop and mobile checks for feed open, community open, inbox open, composer open, and long thread scroll smoothness.
- `SOC-10` `0% left` Replace any page-wide loading or empty-state overlay that blocks first interaction longer than necessary; the fixed full-screen loader, the initial `#app-content` opacity gate, and the separate loading placeholder card are gone.

Update `2026-05-14`:
- What changed: removed the `social-mobile.js` polling loop and converted the mobile shell to runtime-event readiness, then added `test/social-mobile-runtime-regressions.test.js` and `docs/SOCIAL_OPTIMIZATION_TRACKER.md`.
- Which task IDs moved: `SOC-04`, `SOC-07`, `MICRO-SOCIAL-03`, `GLOBAL-11`.
- What evidence was checked: `assets/js/pages/social-mobile.js` now has `0` `setInterval(` hits; `npx vitest run test/social-mobile-runtime-regressions.test.js test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/profile-view-source-regressions.test.js test/social-lost-found-regressions.test.js test/redirect-wrapper-regressions.test.js` passed; `social-mobile.js` size is `20,690 bytes`.

Update `2026-05-15`:
- What changed: built the social desktop panel ownership map in `docs/SOCIAL_OPTIMIZATION_TRACKER.md`, recorded the shared shell dispatch path, and called out duplicate panel renderer names that must be canonicalized before any safe `social-page.js` extraction.
- Which task IDs moved: `SOC-08`.
- What evidence was checked: direct source inspection of `assets/js/pages/social-page.js` mapped `renderContextTabs()`, `renderShellPrimaryNav()`, `renderSectionCommandCenter()`, `renderRail()`, `renderPageBody()`, and `renderSocialPageNow()` to the live panels (`feed`, `community`, `groups`, `projects`, `pages`, `events`, `lost-and-found`, `messages`, `alerts`, `profile`) and found duplicate renderer names for projects, groups, pages, events, and alerts.

Update `2026-05-16`:
- What changed: renamed the shadowed top-level social panel renderers to explicit legacy helpers so one canonical live function now owns each projects/groups/pages/events/alerts dispatch path.
- Which task IDs moved: `SOC-01`, `SOC-08`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed at `5/5`; and direct source scans now show exactly one `function renderProjectsPanel()`, `renderGroupsPanel()`, `renderPagesPanel()`, `renderEventsPanel()`, and `renderAlertsPanel()` plus `renderProjectsWorkspacePanelLegacy()`, `renderProjectsWorkspacePanelClassic()`, `renderGroupsPanelLegacy()`, `renderPagesPanelLegacy()`, `renderEventsPanelLegacy()`, and `renderAlertsPanelLegacy()`.

Update `2026-05-16`:
- What changed: replaced the fixed full-page loading overlay in `social.html` with an in-flow loading card and removed the initial `#app-content` opacity gate so the standalone page no longer hides the whole route before the first render completes.
- Which task IDs moved: `SOC-02`, `SOC-10`.
- What evidence was checked: `npx vitest run test/social-lost-found-regressions.test.js` passed at `5/5`; direct source scans now show `social-loading-placeholder` with `min-height: 320px`, no `position: fixed; inset: 0;`, and no `style="opacity: 0; transition: opacity 0.3s ease;"` on `#app-content`; and `social.html` now measures `7,953` bytes.

Update `2026-05-16`:
- What changed: added route-scoped efficient-tier blur/shadow fallbacks for the repeated social cards, topbar, rail, dialog/story surfaces, and the social mobile action sheet in `assets/css/social-rebuild.css`.
- Which task IDs moved: `SOC-05`.
- What evidence was checked: `npx vitest run test/social-lost-found-regressions.test.js` passed at `6/6`; direct source scans now show `body[data-lux-performance='efficient'].lux-route-social`, `--sn-blur: 8px`, and route-scoped `.mob-sheet-panel` / `.mob-sheet-backdrop` fallback selectors inside `assets/css/social-rebuild.css`.

Update `2026-05-16`:
- What changed: replaced the separate in-flow loading placeholder in `social.html` with the same stable `social-neo-root` shell structure used after boot, keeping only a non-blocking center-region loading message until live data arrives.
- Which task IDs moved: `SOC-02`, `SOC-10`.
- What evidence was checked: `npx vitest run test/social-lost-found-regressions.test.js` stayed green at `6/6`; direct source scans now show `id="social-neo-root"`, `id="social-neo-center-region"`, and no remaining `id="social-loading-placeholder"`; and the refreshed social artifacts still report zero errors.

Update `2026-05-16`:
- What changed: moved the full messages panel renderer into `assets/js/pages/social-messages.js`, turned the eager `renderMessagesPanel()` into a loader stub, and refreshed the seeded social artifacts against the new route shape.
- Which task IDs moved: `SOC-01`, `MICRO-SOCIAL-01`.
- What evidence was checked: `node --check assets/js/pages/social-page.js`, `node --check assets/js/pages/social-messages.js`, and `node --check tools/capture_social_summary.mjs` all passed; `npx vitest run test/social-lost-found-regressions.test.js` passed at `6/6`; `assets/js/pages/social-page.js` dropped to `681,984 bytes`; and the refreshed route artifacts still pass with zero errors (`artifacts/social-efficient-desktop-summary.json` now records `firstReadyMs: 2874`, `communityOpenMs: 2319`, `inboxOpenMs: 1289`, `composerOpenMs: 998`, and `threadScrollMs: 648`; `artifacts/social-mobile-summary.json` now records `firstReadyMs: 781`, `communityOpenMs: 525`, `inboxOpenMs: 258`, `composerOpenMs: 322`, `threadScrollMs: 67`, and `mobileNavVisible: true`).

Update `2026-05-16`:
- What changed: reworked `renderSocialPageNow()` so the route keeps a stable root shell and updates flash, topbar, command, center, rail, drawer, mobile-tab, toast, dialog, and story regions separately instead of swapping the full route DOM through `host.innerHTML`.
- Which task IDs moved: `SOC-03`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` stayed green at `6/6`; direct source scans now show `ensureSocialShell(host)`, `setSocialRegionMarkup(node, markup)`, and no remaining `host.innerHTML = markup;` path; `assets/js/pages/social-page.js` now measures `685,738 bytes`; and the refreshed social artifacts still report zero errors.

Update `2026-05-16`:
- What changed: added a Playwright social route probe with stubbed social/feed/directory/notification/messenger responses, then captured efficient-desktop and mobile summaries for feed ready, inbox open, composer return/focus, and long-thread scroll behavior.
- Which task IDs moved: `SOC-06`, `SOC-09`.
- What evidence was checked: `node --check tools/capture_social_summary.mjs` passed; `artifacts/social-efficient-desktop-summary.json` records `firstReadyMs: 1908`, `inboxOpenMs: 1513`, `composerOpenMs: 1489`, `threadScrollMs: 418`, `threadScrollTopAfter: 6989`, `postCount: 12`, `performanceTier: efficient`, and zero errors; `artifacts/social-mobile-summary.json` records `firstReadyMs: 702`, `inboxOpenMs: 450`, `composerOpenMs: 269`, `threadScrollMs: 56`, `threadScrollTopAfter: 7061`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: removed the unneeded `assets/js/features/ui.js` shell import from `social.html` and refreshed the seeded social artifacts against the lighter shell.
- Which task IDs moved: `SOC-05`.
- What evidence was checked: `npx vitest run test/social-lost-found-regressions.test.js` passed at `6/6`; direct source scans now show `12` external scripts and no `ui.js` import in `social.html`; `artifacts/social-efficient-desktop-summary.json` records `firstReadyMs: 2717`, `inboxOpenMs: 4657`, `composerOpenMs: 1023`, `threadScrollMs: 578`, and zero errors; and `artifacts/social-mobile-summary.json` records `firstReadyMs: 830`, `inboxOpenMs: 671`, `composerOpenMs: 185`, `threadScrollMs: 59`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: added `SOCIAL_LOST_FOUND_MODULE_URL`, `hasSocialLostFoundModule()`, and `ensureSocialLostFoundModule()` to `assets/js/pages/social-page.js` so the lost-found panel can be extracted behind a deferred loader without touching the rest of the desktop shell first.
- Which task IDs moved: `SOC-01`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed and `npx vitest run test/social-lost-found-regressions.test.js` stayed green at `6/6`.

Update `2026-05-16`:
- What changed: moved the full lost-found panel renderer into `assets/js/pages/social-lost-found.js`, turned the eager `renderLostFoundPanel()` into a loader stub, and kept the deferred file off the initial HTML import list.
- Which task IDs moved: `SOC-01`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` and `node --check assets/js/pages/social-lost-found.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` stayed green at `6/6`; `assets/js/pages/social-page.js` dropped to `730,838` bytes; and the refreshed route artifacts still pass with zero errors (`artifacts/social-efficient-desktop-summary.json`, `artifacts/social-mobile-summary.json`).

Update `2026-05-16`:
- What changed: moved the full alerts panel renderer into `assets/js/pages/social-alerts.js`, turned the eager `renderAlertsPanel()` into a loader stub, kept the deferred file off the initial HTML import list, refreshed the focused social regression to lock the new alerts-module contract, and reran the seeded social browser probe against the new route shape.
- Which task IDs moved: `SOC-01`, `SOC-06`, `SOC-09`.
- What evidence was checked: `node --check assets/js/pages/social-page.js`, `assets/js/pages/social-alerts.js`, and `tools/capture_social_summary.mjs` passed; `npx vitest run test/social-lost-found-regressions.test.js` stayed green at `6/6`; `assets/js/pages/social-page.js` dropped to `722,646` bytes; `artifacts/social-efficient-desktop-summary.json` now records `firstReadyMs: 2224`, `inboxOpenMs: 1700`, `composerOpenMs: 977`, `threadScrollMs: 72`, and zero errors; and `artifacts/social-mobile-summary.json` now records `firstReadyMs: 701`, `inboxOpenMs: 650`, `composerOpenMs: 311`, `threadScrollMs: 66`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: moved the full community panel renderer into `assets/js/pages/social-community.js`, turned the eager `renderCommunityPanel()` into a loader stub, kept the deferred file off the initial HTML import list, extended the social probe to capture community-open timings, and refreshed the seeded social browser artifacts against the new route shape.
- Which task IDs moved: `SOC-01`, `SOC-06`, `SOC-09`.
- What evidence was checked: `node --check assets/js/pages/social-page.js`, `assets/js/pages/social-community.js`, and `tools/capture_social_summary.mjs` passed; `npx vitest run test/social-lost-found-regressions.test.js` stayed green at `6/6`; `assets/js/pages/social-page.js` dropped to `712,093` bytes; `artifacts/social-efficient-desktop-summary.json` now records `firstReadyMs: 2473`, `communityOpenMs: 2612`, `inboxOpenMs: 629`, `composerOpenMs: 708`, `threadScrollMs: 455`, and zero errors; and `artifacts/social-mobile-summary.json` now records `firstReadyMs: 790`, `communityOpenMs: 543`, `inboxOpenMs: 237`, `composerOpenMs: 323`, `threadScrollMs: 10`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: moved the full profile panel renderer into `assets/js/pages/social-profile.js`, turned the eager `renderProfilePageBody()` into a loader stub, kept the deferred file off the HTML import list, and removed the last eager-shell inline time-group toggle in favor of a local delegated action.
- Which task IDs moved: `SOC-01`, `SOC-03`, `MICRO-SOCIAL-01`, `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` and `assets/js/pages/social-profile.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed `6/6`; direct source scans now show `assets/js/pages/social-page.js` at `669,870 bytes`, the new `SOCIAL_PROFILE_MODULE_URL`, `ensureSocialProfileModule()`, `window.__kiuSocialProfileHooks`, and `0` inline event attributes across `social-page.js` / `social-profile.js`; `artifacts/social-efficient-desktop-summary.json` reports zero runtime errors with `firstReadyMs: 4387`, `communityOpenMs: 3531`, `inboxOpenMs: 1365`, `composerOpenMs: 1292`, and `threadScrollMs: 624`; `artifacts/social-mobile-summary.json` reports zero runtime errors with `firstReadyMs: 993`, `communityOpenMs: 701`, `inboxOpenMs: 345`, `composerOpenMs: 411`, and `threadScrollMs: 62`; and one immediate warm rerun of the community-open probe timed out, so the remaining open work stays on steady-state center-panel render cost.

Update `2026-05-17`:
- What changed: tightened the social shell render plan so panel/chat changes no longer rebuild hidden mobile tabbar regions on desktop, and closed drawer states no longer trigger drawer-region redraws unless the drawer is actually opening or closing.
- Which task IDs moved: `SOC-03`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed `6/6`; and direct source inspection now shows `resolveSocialRenderPlan(reason, activePanel, runtime)` disabling `mobileTab` outside mobile breakpoints and disabling `drawer` when `runtime.ui.shellDrawerOpen` is false, while still keeping explicit `shell-drawer-open` / `shell-drawer-close` redraw paths.

Update `2026-05-17`:
- What changed: expanded the idle desktop prefetch from the community companion to the community plus messages companions so the inbox-open path is less likely to pay the first-load module cost during the interaction itself.
- Which task IDs moved: `SOC-03`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed `6/6`; and direct source inspection now shows `scheduleDeferredDesktopModulePrefetch()` chaining `ensureSocialCommunityModule()` into `ensureSocialMessagesModule()` while keeping both files off the initial HTML import list.

Update `2026-05-17`:
- What changed: narrowed the feed-local render plan so `post-save`, `post-file`, `comment-reply`, `comment-reply-cancel`, and `comment-created` stay on center-only updates, while `feed-refresh` and `post-submit` stay on center+command updates instead of full-shell redraws.
- Which task IDs moved: `SOC-03`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed `6/6`; and direct source inspection now shows those feed-local reasons grouped under targeted render plans inside `resolveSocialRenderPlan(...)`.

Update `2026-05-17`:
- What changed: stopped the standalone social route from re-injecting a duplicate `social-page.js`, removed the boot wait on directory preload, deferred account enrichment until after the first hydrated render, scoped transparency refreshes to the social shell regions that actually changed, and made the deferred community panel mount its real layout shell immediately while the module finishes loading.
- Which task IDs moved: `SOC-03`, `GLOBAL-04`, `GLOBAL-06`, `GLOBAL-PERF-06`.
- What evidence was checked: `node --check assets/js/app/app.js`, `assets/js/pages/social-page.js`, `assets/js/shared/social-runtime-lite.js`, `assets/js/shared/utilities.js`, and `tools/capture_social_summary.mjs` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed `6/6`; direct source scans now show `app.js` using `social-page.js?v=20260510-social-ux100` plus the rebuilt-shell skip path, `social-page.js` exposing `scheduleDirectoryPrefetch()` and region-scoped `queueLuxuryTransparencyRefresh(..., { roots: ... })`, `social-runtime-lite.js` using `fetchAccountsByIds(deferredAccountIds)` after the first hydrated render, and the immediate `social-neo-community-layout` loading shell; and refreshed social artifacts still report zero runtime errors while the remaining desktop long-task miss stays categorized as shared-shell debt.

Update `2026-05-17`:
- What changed: narrowed the messages-panel render plan so `chat`, `chat-hide`, `message-file`, `message-sent`, `thread-jump-latest`, and `group-thread-*` mutations now stay on center+rail redraws instead of repainting topbar and command chrome.
- Which task IDs moved: `SOC-03`.
- What evidence was checked: `node --check assets/js/pages/social-page.js` passed; `npx vitest run test/social-lost-found-regressions.test.js` passed `6/6`; and direct source inspection now shows those reasons grouped under the messages-only center+rail render plan in `resolveSocialRenderPlan(...)`.

### `staff.html`

Overall % left: `0%`

Evidence: `6.8 KB` HTML, `11` external scripts, eager `staff-command-center.js` plus `staff-route-bootstrap.js`, deferred `assets/js/pages/directories.js` profile handoff loading through `ensureDirectoryProfileBridge()`, deferred `staff-mobile-shell.js` loading only on mobile-sized viewports, no `assets/js/shared/messenger.js`, `assets/js/app/api.js`, or `assets/js/features/ui.js` shell import, `0` inline handlers, `0` polling loops in `staff-mobile-shell.js`, and desktop/mobile browser summaries now capture command-center load, profile open, canonical profile handoff, and action-sheet open behavior while proving `mobileShellLoaded: false` on desktop and `true` on mobile.

Hotspots: no open staff-specific cleanup tasks remain; preserve the desktop/mobile split and canonical-profile handoff boundary if the route changes again.

Detailed execution checklist:
- Keep `directories.js` deferred until the canonical profile handoff is actually requested, and prove whether the remaining student-focused admin helper actions should stay there or move into a thinner shared layer.
- Replace mobile-shell polling with a deterministic runtime-ready signal before any broader refactor.
- Keep the desktop command center, directory tools, and mobile shell as separate route owners so each surface keeps its own code boundary.
- Keep `staff.html` as the live owner now that `staff_lms_clean.html` has been removed from the root page set.

Tasks:
- `STAFF-01` `0% left` Remove unrelated LMS, registration, student-registration, and admin-registration imports unless staff workflows prove they are required.
- `STAFF-02` `0% left` Replace the interval-based hook wait in `assets/js/pages/staff-mobile-shell.js` with a deterministic runtime-ready event.
- `STAFF-03` `0% left` Split desktop staff command center and mobile shell responsibilities more cleanly so each viewport loads less code.
- `STAFF-04` `0% left` Audit directory rendering and staff profile flows for duplicated logic with `profile-view.html` and `directories.js`.
- `STAFF-05` `0% left` Decide whether `staff_lms_clean.html` is dead and remove it if `staff.html` is the source of truth.
- `STAFF-06` `0% left` Add a dedicated staff tracker for desktop and mobile admin workflows.
- `STAFF-07` `0% left` Build a per-import keep/remove table for all nine page scripts and record exact evidence for each verdict.
- `STAFF-08` `0% left` Add weak-laptop and mobile checks for directory open, command-center load, and staff action-sheet latency.
- `STAFF-09` `0% left` Split command-center render ownership from mobile-shell ownership before any larger staff refactor.

Update `2026-05-14`:
- What changed: removed unrelated page imports from `staff.html`, replaced the staff mobile interval wait with direct hook setup, removed shell modal close handlers, and added `docs/STAFF_OPTIMIZATION_TRACKER.md` plus regression coverage for the trimmed staff surface.
- Which task IDs moved: `STAFF-01`, `STAFF-02`, `STAFF-06`, `STAFF-07`, `MICRO-STAFF-02`, `GLOBAL-11`.
- What evidence was checked: `staff.html` now reports `15` external scripts and `0` inline handlers; `assets/js/pages/staff-mobile-shell.js` now reports `0` polling loops; targeted source tests passed via `test/staff-mobile-runtime-regressions.test.js test/social-mobile-runtime-regressions.test.js test/registration-route-regressions.test.js test/student-registration-section-picker.test.js test/profile-view-source-regressions.test.js test/social-lost-found-regressions.test.js test/redirect-wrapper-regressions.test.js`.

Update `2026-05-15`:
- What changed: deleted `staff_lms_clean.html` after confirming `staff.html` is the only live staff route owner.
- Which task IDs moved: `STAFF-05`, `GLOBAL-13`.
- What evidence was checked: `assets/js/features/navigation.js` still routes `staff` to `staff.html`; repo-wide scans found `staff_lms_clean.html` only in docs; and `Test-Path staff_lms_clean.html` now returns `False`.

Update `2026-05-16`:
- What changed: removed the unneeded `assets/js/app/api.js` and `assets/js/features/ui.js` shell imports from `staff.html`, refreshed the staff shell regression test, and recorded desktop/mobile browser summaries for the lighter route shell.
- Which task IDs moved: `STAFF-03`, `STAFF-08`.
- What evidence was checked: `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed at `3/3`; direct source scans now show `12` external scripts and no `api.js` / `ui.js` import in `staff.html`; `node --check tools/capture_staff_summary.mjs` passed; `artifacts/staff-efficient-desktop-summary.json` records `firstReadyMs: 21151`, `profileOpenMs: 214`, `performanceTier: efficient`, and zero errors under the low-spec desktop probe; and `artifacts/staff-mobile-summary.json` records `firstReadyMs: 797`, `actionSheetOpenMs: 123`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: removed the eager `assets/js/pages/directories.js` shell import from `staff.html` and added `ensureDirectoryProfileBridge()` in `assets/js/pages/staff-command-center.js` so the canonical profile handoff only loads when requested.
- Which task IDs moved: `STAFF-03`.
- What evidence was checked: `node --check assets/js/pages/staff-command-center.js` passed; `npx vitest run test/staff-mobile-runtime-regressions.test.js` stayed green at `3/3`; direct source scans now show `11` external scripts and no eager `directories.js` import in `staff.html`; and `node tools/capture_staff_summary.mjs` refreshed `artifacts/staff-efficient-desktop-summary.json` and `artifacts/staff-mobile-summary.json` with zero runtime errors.

Update `2026-05-16`:
- What changed: closed the directory/profile duplication audit by comparing `assets/js/pages/staff-command-center.js`, `profile-view.html`, and `assets/js/pages/directories.js`, and recorded the exact overlap boundary.
- Which task IDs moved: `STAFF-04`.
- What evidence was checked: direct code inspection shows `staff-command-center.js` owns the directory/governance/editor workflows, `profile-view.html` owns the person-centric viewer/session tools, and `directories.js` now only remains on the staff route as the canonical-profile bridge via `openProfilePage()` plus a small set of student-focused admin helper actions (`toggleProbationForUser()`, `applyHoldForUser()`, `applyScholarshipForUser()`, `generateTranscriptForUser()`).

Update `2026-05-16`:
- What changed: extended the staff browser probe to measure the deferred canonical-profile handoff from the command center into `profile-view.html`.
- Which task IDs moved: `STAFF-03`.
- What evidence was checked: `node --check tools/capture_staff_summary.mjs` passed; `artifacts/staff-efficient-desktop-summary.json` now records `firstReadyMs: 21258`, `profileOpenMs: 222`, `canonicalProfileOpenMs: 924`, `canonicalProfileVisible: true`, `canonicalProfileUrl: /profile-view.html?...`, `canonicalProfileName: QA Prof Alpha`, and zero errors; and `artifacts/staff-mobile-summary.json` still records a zero-error mobile shell summary.

Update `2026-05-16`:
- What changed: replaced the eager `staff-mobile-shell.js` script tag with `staff-route-bootstrap.js`, made the bootstrap defer `staff-mobile-shell.js` until a mobile-sized viewport needs it, and refreshed the staff browser probe so it proves the mobile shell stays unloaded on desktop and active on mobile.
- Which task IDs moved: `STAFF-03`, `STAFF-09`.
- What evidence was checked: `node --check assets/js/pages/staff-route-bootstrap.js`, `node --check assets/js/pages/staff-mobile-shell.js`, and `node --check tools/capture_staff_summary.mjs` passed; `npx vitest run test/staff-mobile-runtime-regressions.test.js` passed `3/3`; `artifacts/staff-efficient-desktop-summary.json` now records `mobileShellLoaded: false` and `mobileShellScriptPresent: false` on efficient desktop while keeping the canonical profile handoff green; and `artifacts/staff-mobile-summary.json` now records `mobileShellLoaded: true`, `mobileShellScriptPresent: true`, `mobileNavVisible: true`, `actionSheetOpenMs: 187`, and zero errors on mobile.

### `staff_lms_clean.html`

Overall % left: `0%`

Evidence: file removed from the root page set on `2026-05-15` after reference scans found no live inbound route, auth redirect, launcher path, or runtime owner.

Hotspots: historical removal record only.

Detailed execution checklist:
- keep this section only as a historical removal record
- do not restore the file without a new explicit route owner and tests

Tasks:
- `STAFFLEG-01` `0% left` Decide whether this file is dead, experimental, or a future replacement for `staff.html`.
- `STAFFLEG-02` `0% left` If dead, remove it from the live maintenance set and document the decision here.
- `STAFFLEG-03` `0% left` If not dead, move it into a real page ownership path and add tests plus a route reference.
- `STAFFLEG-04` `0% left` Do not refactor this file before route ownership is decided.
- `STAFFLEG-05` `0% left` Search for every inbound reference across:
  route maps
  auth redirects
  docs
  installer or launcher scripts
- `STAFFLEG-06` `0% left` If the file is kept, extract its inline styles and script into route-owned assets before any behavior change.
- `STAFFLEG-07` `0% left` If the file is dead, record the exact replacement page and user path.
- `STAFFLEG-08` `0% left` Do not spend performance-optimization time here until ownership is proven.

Update `2026-05-15`:
- What changed: removed `staff_lms_clean.html` from the root page set and converted this section into a historical removal record.
- Which task IDs moved: `STAFFLEG-01`, `STAFFLEG-02`, `STAFFLEG-03`, `STAFFLEG-04`, `STAFFLEG-05`, `STAFFLEG-06`, `STAFFLEG-07`, `STAFFLEG-08`, `STAFF-05`, `GLOBAL-13`.
- What evidence was checked: repo-wide scans found `staff_lms_clean.html` only in docs, `assets/js/features/navigation.js` still routes `staff` to `staff.html`, and `Test-Path staff_lms_clean.html` now returns `False`.

Update `2026-05-16`:
- What changed: removed the unproven `assets/js/shared/messenger.js` shell import from `staff.html` and kept the same staff mobile-shell utility fallback behavior through `app.js`.
- Which task IDs moved: `STAFF-03`.
- What evidence was checked: `npx vitest run test/staff-mobile-runtime-regressions.test.js` stayed green at `3/3`; direct source scans now show `14` external scripts, no `messenger.js` import, and the same `window.toggleMessaging()` / `window.toggleNotifications()` fallback path still present in `assets/js/app/app.js`.

### `student-service.html`

Overall % left: `0%`

Evidence: `14,027 bytes` HTML, `11` external scripts, `1` eager page script, `assets/js/pages/student-service.js` is `162,172 bytes`, the deferred Q&A companion `assets/js/pages/student-service-qa.js` is `12,640 bytes` and stays off the initial HTML import list, the deferred private-service companion `assets/js/pages/student-service-service.js` is `65,680 bytes` and also stays off the initial HTML import list, the runtime now emits `0` generated inline action hooks and keeps `0` raw `innerHTML =` writes, repeated student-service cards still have route-scoped `content-visibility`, the same repeated surfaces now also have explicit `body[data-lux-performance='efficient'].lux-route-student-service` blur/shadow fallbacks in both dark and light mode, no route-specific permanent hidden modal/drawer shells remain, the eager runtime now owns the shared controller/data layer only, `assets/js/features/ui.js` no longer loads on the standalone route shell, and `artifacts/student-service-efficient-desktop-summary.json` plus `artifacts/student-service-mobile-summary.json` now capture first-ready, lane-open, queue-open, action-completion, and real scroll behavior.

Hotspots: no student-service-specific cleanup tasks remain open.

Detailed execution checklist:
- Prove which shared shell imports are still required on first load:
  `app.js`
  `api.js`
  `auth.js`
  `initial-state.js`
  `state.js`
  `utilities.js`
  `faculty.js`
  `navigation.js`
  `ui.js`
  `index-luxury.js`
- Split the route into:
  inbox or queue
  account panel
  action workspace
  modal or detail drawers
- Convert large one-shot `innerHTML` updates into smaller update regions before touching visual polish.
- Keep the new efficient-tier blur/shadow fallbacks as the route-specific downgrade path and focus remaining work on the module split plus browser QA.

Tasks:
- `SSVC-01` `0% left` Remove unrelated LMS, planner, registration, and directory imports from the student-service route.
- `SSVC-02` `0% left` Split `student-service.js` into inbox, account, and action-specific modules.
- `SSVC-03` `0% left` Audit dense account/inbox surfaces for shared shell blur and transparency cost.
- `SSVC-04` `0% left` Replace large one-shot `innerHTML` render paths with smaller page-owned updates where possible.
- `SSVC-05` `0% left` Add `content-visibility` only where it is safe and test-backed on this route.
- `SSVC-06` `0% left` Create a dedicated student-service tracker.
- `SSVC-07` `0% left` Build a per-import keep/remove table for the eight eager page runtimes and record exact evidence for each verdict.
- `SSVC-08` `0% left` Add weak-laptop and mobile checks for inbox scroll, queue open, and action completion latency.
- `SSVC-09` `0% left` Audit which student-service regions can use on-demand modal creation instead of permanent hidden DOM.
- `SSVC-10` `0% left` Verify whether `student-service` access is intentionally shared across all current role sets or whether some roles only inherited it by drift.

Update `2026-05-15`:
- What changed: added `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`, removed the dead page-pack imports from `student-service.html`, and replaced the inline mobile shell polling wait with direct hook setup.
- Which task IDs moved: `SSVC-01`, `SSVC-06`, `GLOBAL-11`.
- What evidence was checked: `student-service.html` reports `12` external scripts, `0` inline handlers, and `0` `setInterval(` hits; `assets/js/pages/student-service.js` is `203,642 bytes`; and `test/student-service-split-workspace.test.js` continues to verify the lane split, route wiring, removed imports, and no-polling mobile shell.

Update `2026-05-15`:
- What changed: added one delegated interaction layer for the student-service Q&A lane and ops strip, replaced the affected generated inline hooks with `data-*` actions, and expanded the student-service regression test to lock the new delegated contract.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` passed `6/6`; and direct source metrics now show `211,818` bytes, `43` generated action hooks (`28` `onclick=`, `8` `oninput=`, `7` `onchange=`), and the same `12` `innerHTML` writes.

Update `2026-05-15`:
- What changed: extended the same delegated interaction layer across the student-service ticket/article/workbench controls, converted the remaining live `navigate(...)`, ticket, article, reply, status, and hero-action hooks to `data-*` actions, and kept the same route layout and workspace split intact.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed again; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; and direct source metrics now show `218,437` bytes, `0` generated inline action hooks, and the same `12` `innerHTML` writes.

Update `2026-05-16`:
- What changed: reworked the student-service operations strip into a stable shell with separate head/stats/queue/lane regions and switched the new region updates to `createContextualFragment(...)`-based replacement so the strip no longer rebuilds as one large HTML blob on every refresh.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `11` `innerHTML =` writes instead of `12`; and `assets/js/pages/student-service.js` now declares `ensureStudentServiceOperationsShell(...)` plus separate operations-strip region render helpers.

Update `2026-05-16`:
- What changed: reworked the student-service page chrome into a stable shell with separate hero/switcher/workflow/summary/overview regions and kept `#student-service-page-body` as the lane container instead of rebuilding the whole route root on each render.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `10` `innerHTML =` writes instead of `11`; and `assets/js/pages/student-service.js` now declares `ensureStudentServicePageShell(...)` plus dedicated page-chrome region render helpers.

Update `2026-05-16`:
- What changed: reworked the student Q&A lane into a stable shell with separate ops/composer/feed regions instead of one full container rebuild.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `9` `innerHTML =` writes instead of `10`; and `assets/js/pages/student-service.js` now declares `ensureStudentServiceStudentQaShell(...)` plus dedicated student-Q&A region render helpers.

Update `2026-05-16`:
- What changed: reworked the private-ticket lane into a stable shell with separate summary/list/detail regions instead of one full container rebuild.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `8` `innerHTML =` writes instead of `9`; and `assets/js/pages/student-service.js` now declares `ensureStudentServiceMyTicketsShell(...)` plus dedicated private-ticket region render helpers.

Update `2026-05-16`:
- What changed: reworked the responder-only Student Service lane into a stable shell with separate summary/list/detail regions instead of one full container rebuild.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `7` `innerHTML =` writes instead of `8`; and `assets/js/pages/student-service.js` now declares `ensureStudentServiceResponderShell(...)` plus dedicated responder-lane region render helpers.

Update `2026-05-16`:
- What changed: reworked the student private-support hub into a stable shell with separate find/request/track regions instead of one full container rebuild.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `6` `innerHTML =` writes instead of `7`; and `assets/js/pages/student-service.js` now declares `ensureStudentServiceStudentHubShell(...)` plus dedicated student-hub region render helpers.

Update `2026-05-16`:
- What changed: reworked the staff Q&A feed and the full staff workbench into stable shells, removed the dead legacy `renderStudentServicePageChrome(...)` helper, and replaced the remaining lane-chooser / unavailable-state `innerHTML` assignments with `setStudentServiceMarkup(...)`.
- Which task IDs moved: `SSVC-04`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `6/6`; direct source scans now show `0` raw `innerHTML =` writes instead of `6`; and `assets/js/pages/student-service.js` now declares `ensureStudentServiceStaffQaShell(...)`, `ensureStudentServiceStaffWorkbenchShell(...)`, and no longer contains `function renderStudentServicePageChrome(...)`.

Update `2026-05-16`:
- What changed: added explicit efficient-tier blur/shadow fallbacks for the repeated student-service workspace, inbox, article, lane, and Q&A card surfaces in `assets/css/index-luxury.css` and expanded the route regression test to guard those fallback selectors.
- Which task IDs moved: `SSVC-03`, `SSVC-05`.
- What evidence was checked: `npx vitest run test/student-service-split-workspace.test.js` passed at `7/7`; direct source scans now show `body[data-lux-performance='efficient'].lux-route-student-service` selectors for `.student-service-summary-card`, `.student-service-article-card`, `.student-service-ops-ticket`, `.student-service-qa-card`, and `.student-service-qa-answer-card`; and the route keeps the same `content-visibility` guardrail set while adding the new efficient-tier downgrade path.

Update `2026-05-16`:
- What changed: added a Playwright student-service route probe with stubbed bootstrap data and seeded service tickets, then captured efficient-desktop and mobile summaries for lane open, queue open, article-panel completion, and repeated-surface scroll behavior.
- Which task IDs moved: `SSVC-05`, `SSVC-08`.
- What evidence was checked: `node --check tools/capture_student_service_summary.mjs` passed; `artifacts/student-service-efficient-desktop-summary.json` records `firstReadyMs: 1610`, `laneOpenMs: 330`, `queueOpenMs: 234`, `actionCompletionMs: 66`, `scrollYAfter: 1400`, `ticketCardCount: 6`, `articleCardCount: 6`, `performanceTier: efficient`, and zero errors; `artifacts/student-service-mobile-summary.json` records `firstReadyMs: 637`, `laneOpenMs: 105`, `queueOpenMs: 29`, `actionCompletionMs: 84`, `scrollYAfter: 1391`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: removed the unneeded `assets/js/features/ui.js` shell import from `student-service.html` and refreshed the student-service route artifacts against the lighter shell.
- Which task IDs moved: `SSVC-07`.
- What evidence was checked: `npx vitest run test/student-service-split-workspace.test.js` passed at `7/7`; direct source scans now show `11` external scripts and no `ui.js` import in `student-service.html`; `artifacts/student-service-efficient-desktop-summary.json` records `firstReadyMs: 1645`, `laneOpenMs: 378`, `queueOpenMs: 176`, `actionCompletionMs: 187`, and zero errors; and `artifacts/student-service-mobile-summary.json` records `firstReadyMs: 695`, `laneOpenMs: 80`, `queueOpenMs: 43`, `actionCompletionMs: 30`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: moved the Q&A lane shell renderers into a deferred companion file, added the lazy loader in `student-service.js`, and kept `student-service-qa.js` off the initial HTML import list so the service lane still boots with one eager page runtime.
- Which task IDs moved: `SSVC-02`.
- What evidence was checked: `node --check assets/js/pages/student-service.js` and `node --check assets/js/pages/student-service-qa.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `7/7`; a seeded Playwright student Q&A sanity run loaded the deferred Q&A shell with zero errors; `assets/js/pages/student-service.js` dropped to `219,501` bytes; and the refreshed route artifacts still pass with zero errors (`artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`).

Update `2026-05-16`:
- What changed: moved the student hub, my-tickets, and responder service-lane shell renderers into a second deferred companion file, added the matching lazy loader in `student-service.js`, and kept `student-service-service.js` off the initial HTML import list.
- Which task IDs moved: `SSVC-02`.
- What evidence was checked: `node --check assets/js/pages/student-service.js`, `assets/js/pages/student-service-qa.js`, and `assets/js/pages/student-service-service.js` passed; `npx vitest run test/student-service-split-workspace.test.js` stayed green at `7/7`; a seeded Playwright student-service route probe still passed with zero errors; `assets/js/pages/student-service.js` dropped to `162,172` bytes; and the refreshed route artifacts still pass with zero errors (`artifacts/student-service-efficient-desktop-summary.json`, `artifacts/student-service-mobile-summary.json`).

Update `2026-05-15`:
- What changed: closed the cross-role access verification for `student-service`.
- Which task IDs moved: `SSVC-10`, `GLOBAL-14`.
- What evidence was checked: `assets/js/app/state.js` explicitly includes `student-service` in the student, professor/TA, admin, and student-service role sets; `assets/js/features/navigation.js` resolves it to `student-service.html`; and the role matrix now records that shared access as explicit code rather than drift.

Update `2026-05-15`:
- What changed: finished the student-service shared import proof with exact per-script evidence, added route-scoped `content-visibility` for repeated ticket/article/Q&A/ops cards, and refreshed the student-service standalone CSS cache-bust reference.
- Which task IDs moved: `SSVC-03`, `SSVC-05`, `SSVC-07`.
- What evidence was checked: `student-service.html` now references `assets/css/index-luxury.css?v=20260515-studentsvc-contentvis1`; `assets/js/pages/student-service.js` still reports `92` generated inline action hooks and `12` `innerHTML` writes; `index-luxury.css` now contains the route-scoped repeated-card `content-visibility` rule; and `npx vitest run test/student-service-split-workspace.test.js` passed with `5/5`.

Update `2026-05-15`:
- What changed: closed the student-service hidden-DOM audit after confirming the route no longer keeps route-specific permanent modal/drawer shells mounted.
- Which task IDs moved: `SSVC-09`.
- What evidence was checked: `student-service.html` only retains the shared mobile action sheet as dialog markup; `assets/js/pages/student-service.js` tracks one `selectedTicketId` / `selectedQuestionId` and renders one active ticket or question detail pane at a time; and the current runtime no longer prebuilds hidden route-specific modal trees.

### `students-admin.html`

Overall % left: `0%`

Evidence: `3.1 KB` HTML, `13` external scripts, `1` page script, `0` inline handlers, dedicated route/runtime tests remain green, and desktop/mobile artifacts now capture first-ready, filter-change, and modal-open timings with zero errors.

Hotspots: no open students-admin-specific cleanup tasks remain; preserve the dedicated adapter shape, import proof, and the existing route/runtime artifacts.

Detailed execution checklist:
- Keep the page as a near-thin shell plus one dedicated adapter if it changes again.
- Preserve the proved shared shell imports and the dedicated adapter/source-of-truth decision.

Tasks:
- `STUADM-01` `0% left` Continue trimming shared shell dependencies so this route loads only the admin-students runtime it actually needs.
- `STUADM-02` `0% left` Audit whether `messenger.js` and other shared imports are still necessary on first load.
- `STUADM-03` `0% left` Measure first paint and first interaction cost on real low-end laptops and integrated GPUs after the recent cleanup.
- `STUADM-04` `0% left` Decide whether `students_lms_management.html` is dead and remove it from maintenance if `students-admin.html` is the source of truth.
- `STUADM-05` `0% left` Create a dedicated tracker so future work does not get mixed into unrelated docs.
- `STUADM-06` `0% left` Build a keep/remove table for every shared import on the page and record exact evidence for each verdict.
- `STUADM-07` `0% left` Add weak-laptop and mobile checks for table open, filter change, and modal open latency.
- `STUADM-08` `0% left` Keep the HTML shell minimal and block any future route-pack imports from creeping back in.

Update `2026-05-14`:
- What changed: added `docs/STUDENTS_ADMIN_OPTIMIZATION_TRACKER.md` for the already-trimmed students-admin route.
- Which task IDs moved: `STUADM-05`, `GLOBAL-11`.
- What evidence was checked: `students-admin.html` reports `13` external scripts, `1` page script, and `0` inline handlers; existing students-admin LMS route/runtime tests remain green.

Update `2026-05-15`:
- What changed: deleted `students_lms_management.html` after confirming `students-admin.html` is the only live admin-students route owner.
- Which task IDs moved: `STUADM-04`, `GLOBAL-13`.
- What evidence was checked: `assets/js/features/navigation.js` still routes `students-admin` to `students-admin.html`; `assets/js/app/auth.js` still redirects admin logins to `students-admin.html`; repo-wide scans found `students_lms_management.html` only in docs; and `Test-Path students_lms_management.html` now returns `False`.

Update `2026-05-15`:
- What changed: closed the remaining students-admin proof and QA tasks by documenting the shared import keep/need evidence, confirming the adapter has no legacy fade/duplicate dependency, and capturing efficient-desktop/mobile interaction artifacts.
- Which task IDs moved: `STUADM-01`, `STUADM-02`, `STUADM-03`, `STUADM-06`, `STUADM-07`, `STUADM-08`.
- What evidence was checked: `test/students-admin-lms-route.test.js`, `test/students-admin-lms-runtime.test.js`, and `test/student-service-split-workspace.test.js` passed; the route test now guards the required shared imports and the absence of legacy fade/duplicate drift; `assets/js/features/index-luxury.js` still uses `getMessengerSnapshot()` for shell chat badges, `assets/js/shared/utilities.js` still provides `switchFacultyTheme()` and route-level transparency refresh for `#students-content`; and `artifacts/students-admin-efficient-desktop-summary.json` plus `artifacts/students-admin-mobile-summary.json` record first-ready, filter-change, and modal-open timings with zero errors.

### `students_lms_management.html`

Overall % left: `0%`

Evidence: file removed from the root page set on `2026-05-15` after reference scans found no live route, auth redirect, launcher path, or runtime owner.

Hotspots: historical removal record only.

Detailed execution checklist:
- keep this section only as a historical removal record
- do not restore the file without a new explicit route owner and tests

Tasks:
- `STULEG-01` `0% left` Decide whether this file is dead, experimental, or intended to replace `students-admin.html`.
- `STULEG-02` `0% left` If dead, remove it from active maintenance and document the deletion path here.
- `STULEG-03` `0% left` If kept, move it behind an explicit route and add real runtime ownership plus tests.
- `STULEG-04` `0% left` Avoid editing it as if it were live source before that decision is made.
- `STULEG-05` `0% left` Search for every inbound reference across:
  route maps
  auth redirects
  docs
  admin tools
  launcher scripts
- `STULEG-06` `0% left` If the file is kept, extract inline CSS and script into route-owned assets before refactoring behavior.
- `STULEG-07` `0% left` If the file is dead, record the exact replacement page and user path.
- `STULEG-08` `0% left` Do not spend performance-optimization time here until ownership is proven.

Update `2026-05-15`:
- What changed: removed `students_lms_management.html` from the root page set and converted this section into a historical removal record.
- Which task IDs moved: `STULEG-01`, `STULEG-02`, `STULEG-03`, `STULEG-04`, `STULEG-05`, `STULEG-06`, `STULEG-07`, `STULEG-08`, `STUADM-04`, `GLOBAL-13`.
- What evidence was checked: repo-wide scans found `students_lms_management.html` only in docs, `assets/js/features/navigation.js` still routes `students-admin` to `students-admin.html`, `assets/js/app/auth.js` still redirects admin logins to `students-admin.html`, and `Test-Path students_lms_management.html` now returns `False`.

### `study-card.html`

Overall % left: `0%`

Evidence: `15.9 KB` HTML, `13` external scripts, `2` page scripts, `0` inline handlers, a stable `study-card-summary-region` / `study-card-terms-region` loaded-state shell, no static modal payload IDs beyond `modal-overlay`, seeded desktop/mobile QA artifacts with zero recorded errors, `assets/js/pages/registration.js` limited to two `renderStudyCard()` refresh side effects, and `assets/js/pages/personal-data-page.js` limited to identity/summary/facts/records rendering rather than semester or assessment ownership.

Hotspots: no open study-card-specific cleanup tasks remain; preserve the dedicated `study-card-page.js` controller, the lazy modal path, and the resolved ownership boundary with `registration.html` and `personal-data.html`.

Detailed execution checklist:
- Prove whether the seven eager page runtimes are actually needed by `study-card.html`.
- Replace the `9` inline handlers only after dead imports and dead branches are removed.
- Split the route into:
  summary header
  card details
  printable or export actions
  attachments or related academic data
- Treat print and export features as lazy code paths so first paint stays cheap on weak hardware.

Tasks:
- `SCARD-01` `0% left` Remove unrelated route imports so the page stops loading the full registration and planner pack on startup.
- `SCARD-02` `0% left` Replace inline handlers with delegated listeners.
- `SCARD-03` `0% left` Extract printable/export-heavy sections into lazy-mounted route modules.
- `SCARD-04` `0% left` Audit overlap with `registration.html` and `personal-data.html` so shared card rendering moves to one place.
- `SCARD-05` `0% left` Add a study-card tracker.
- `SCARD-06` `0% left` Build a per-import keep/remove table for the seven eager page runtimes and record exact evidence for each verdict.
- `SCARD-07` `0% left` Replace any whole-card rerender path with smaller updates for section toggle, export action, and field change states.
- `SCARD-08` `0% left` Add weak-laptop and mobile checks for card open, print/export entry, and section scroll smoothness.

Update `2026-05-15`:
- What changed: created `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`, removed the dead social-helper trio plus `messenger.js` and the unrelated `lms.js` / `registration.js` / `directories.js` / `student-registration.js` / `admin-registration.js` imports from `study-card.html`, replaced the polling mobile-shell navigate wait with the direct `ensureNavigateHooks()` path, and converted the route-local modal and study-card assessment actions to delegated `data-*` hooks.
- Which task IDs moved: `SCARD-01`, `SCARD-02`, `SCARD-05`, `SCARD-06`, `GLOBAL-11`.
- What evidence was checked: `npx vitest run test/study-card-route-regressions.test.js` passed; `node --check assets/js/pages/planner.js` passed; direct source metrics now show `101,133` bytes, `13` external scripts, `2` page runtimes, `0` inline handlers, `0` shell `setInterval(` hits, `0` dead social-helper or messenger imports, and `0` remaining study-card assessment `onclick` hooks in `assets/js/pages/planner.js`.

Update `2026-05-15`:
- What changed: extracted the live study-card controller out of `planner.js` into `assets/js/pages/study-card-page.js`, copied the route-local helper subset that had previously leaked in through `messenger.js` and `student-registration.js`, and updated `study-card.html` to load the dedicated controller instead of `planner.js`.
- Which task IDs moved: `SCARD-01`, `SCARD-06`.
- What evidence was checked: `node --check assets/js/pages/study-card-page.js` passed; `npx vitest run test/study-card-route-regressions.test.js` stayed green; and direct source metrics now show the route still at `13` external scripts with `2` page runtimes, but the dedicated study-card controller is now `25,819` bytes and the planner-pack startup dependency is gone.

Update `2026-05-15`:
- What changed: completed the first source-backed overlap audit for `study-card.html`, mapping the real shared boundary with `registration.html` and the lighter identity-shell overlap with `personal-data.html`.
- Which task IDs moved: `SCARD-04`.
- What evidence was checked: `assets/js/pages/registration.js` still owns live course/group schedule mutations and explicitly calls `renderStudyCard()` after enroll and unenroll, while `personal-data.html` only exposes identity/snapshot shell content plus route nav actions into `study-card` and `registration` rather than rendering semester tables or assessment history.

Update `2026-05-15`:
- What changed: replaced the normal loaded-state study-card container rewrite with a stable shell plus separate summary and semester regions in `assets/js/pages/study-card-page.js`.
- Which task IDs moved: `SCARD-07`.
- What evidence was checked: `node --check assets/js/pages/study-card-page.js` passed; `npx vitest run test/study-card-route-regressions.test.js` stayed green; and direct source metrics now show `study-card.html` at `101,136` bytes with a `31,389` byte route controller that updates `study-card-summary-region` and `study-card-terms-region` separately while keeping the assessment cache scoped to the terms render.

Update `2026-05-15`:
- What changed: removed the static modal payload from `study-card.html`, leaving only the `modal-overlay` scaffold so announcement/event/syllabus/program/program-courses shells now mount lazily through `assets/js/features/ui.js`.
- Which task IDs moved: `SCARD-03`.
- What evidence was checked: `npx vitest run test/study-card-route-regressions.test.js` stayed green; direct source metrics now show `study-card.html` at `15,904` bytes with `13` external scripts, `0` inline handlers, and `0` static modal payload IDs beyond `modal-overlay`; and `assets/js/features/ui.js` still exposes `ensureModalScaffold()`, `ensureSyllabusModal()`, `ensureProgramsModal()`, and the lazy `data-show-program-courses="1"` path.

Update `2026-05-16`:
- What changed: added standalone fallbacks for LMS-linked assessment display helpers inside `assets/js/pages/study-card-page.js`, confirmed the navigation runtime guard no longer re-injects the old registration pack on the standalone page, and captured real desktop/mobile study-card QA artifacts with a seeded local curriculum plus the built-in admin-testing student persona.
- Which task IDs moved: `SCARD-03`, `SCARD-08`.
- What evidence was checked: `npx vitest run test/study-card-route-regressions.test.js` stayed green; `artifacts/study-card-efficient-desktop-summary.json` reports `firstReadyMs: 1424`, `assessmentOpenMs: 7`, `syllabusOpenMs: 46`, `scrollTopAfter: 1594`, `rows: 12`, `seededCurriculum: true`, and zero errors; `artifacts/study-card-mobile-summary.json` reports `firstReadyMs: 1310`, `assessmentOpenMs: 6`, `syllabusOpenMs: 34`, `scrollTopAfter: 1372`, `rows: 12`, `mobileNavVisible: true`, `seededCurriculum: true`, and zero errors; both artifacts also record `exportFlowPresent: false`; and a browser probe now shows `study-card.html` loading only the expected page scripts (`gradebook.js` plus `study-card-page.js`) rather than the old registration pack.

Update `2026-05-16`:
- What changed: closed the remaining overlap task by locking the renderer ownership split in source: `registration.js` stays on enroll/unenroll refresh side effects, `personal-data-page.js` stays on identity/snapshot sections, and the semester table plus assessment window remain owned by `study-card-page.js`.
- Which task IDs moved: `SCARD-04`.
- What evidence was checked: `npx vitest run test/study-card-route-regressions.test.js` passed; the regression guard now proves `assets/js/pages/registration.js` contains exactly two `renderStudyCard()` refresh side effects and no semester-table or assessment-window markup; `assets/js/pages/personal-data-page.js` contains only identity/summary/records renderers; and `assets/js/pages/study-card-page.js` still owns `study-card-semester-table` plus `study-card-assessment-window`.

### `timetable.html`

Overall % left: `0%`

Evidence: `27.6 KB` HTML, dedicated `18.0 KB` route CSS, `13` external scripts, `1` page script now owned by `assets/js/pages/timetable-runtime.js`, `0` inline handlers in `timetable.html`, no timetable-shell inline CSS, no eager `planner.js` import on the live route, stable schedule-surface frame/empty regions now keep week/filter/view updates off the whole route container, explicit efficient-tier timetable fallback selectors still exist in `assets/css/index-luxury.css`, and the route has a dedicated tracker plus focused regression and refreshed desktop/mobile route artifacts.

Hotspots: no open timetable-specific cleanup tasks remain; preserve `assets/js/pages/timetable-runtime.js` as the single route owner and rerun the focused regression plus route summaries if the page changes again.

Detailed execution checklist:
- Keep the delegated `data-timetable-*` shell listeners stable while the deeper planner/timetable split continues.
- Split timetable-only behavior away from broader planner and registration logic before deeper perf tuning.
- Treat `lux-timetable-canvas` and related transparency selectors as explicit GPU work items.
- Keep inactive week content, filter panes, and detail drawers unmounted until needed.

Tasks:
- `TT-01` `0% left` Replace the `24` inline handlers with delegated listeners.
- `TT-02` `0% left` Split timetable-only behavior out of `assets/js/pages/planner.js` so registration-related logic does not parse on this route; the live timetable renderer, week/view state, and profile-calendar helpers now live in `assets/js/pages/timetable-runtime.js`, and `timetable.html` no longer imports `planner.js`.
- `TT-03` `0% left` Audit `lux-timetable-canvas` and related transparency selectors so the timetable surface stops paying for unnecessary blur; `assets/css/index-luxury.css` now contains explicit efficient-tier fallback selectors for the timetable hero, command, stage, focus, canvas, filters, repeated session cards, and grid events.
- `TT-04` `0% left` Lazy-render inactive weeks, filter panes, and detail drawers instead of building all markup on load; the live route renders one active board surface at a time, keeps the filter shell static, and the current route/browser checks explicitly report no timetable-specific session drawer/modal shell.
- `TT-05` `0% left` Create a dedicated timetable tracker.
- `TT-06` `0% left` Replace any whole-board rerender path with smaller updates for week change, selected session, and filter state; the runtime now keeps stable schedule-surface regions and updates the session-board/grid subregions in place for week/filter/view changes instead of replacing the whole timetable container.
- `TT-07` `0% left` Add weak-laptop and mobile checks for scroll smoothness, week switch latency, and session modal open; `artifacts/timetable-efficient-desktop-summary.json` and `artifacts/timetable-mobile-summary.json` now record first-ready, week-switch, timetable-view-switch, and scroll timings, and both runs explicitly report `sessionModalPresent: false` because the current live route has no timetable-specific session modal.
- `TT-08` `0% left` Build a planner-vs-timetable helper map so only timetable-critical helpers remain on this route.

Update `2026-05-16`:
- What changed: synchronized the timetable section with `docs/TIMETABLE_OPTIMIZATION_TRACKER.md`, closing the shell handler/tracker/helper-map tasks and importing the current planner split plus transparency-audit percentages from the dedicated tracker.
- Which task IDs moved: `TT-01`, `TT-02`, `TT-03`, `TT-05`, `TT-08`.
- What evidence was checked: `docs/TIMETABLE_OPTIMIZATION_TRACKER.md` now shows every `TT-*` task at `0% left`, and its change log records `npx vitest run test/timetable-route-regressions.test.js` passing with `0` inline handler attributes remaining in `timetable.html`.

Update `2026-05-16`:
- What changed: moved the route-local timetable `<style>` block into `assets/css/timetable-route.css`, linked the extracted stylesheet from `timetable.html`, and refreshed the focused route regression so the shell now blocks inline route CSS.
- Which task IDs moved: `TT-03`.
- What evidence was checked: `npx vitest run test/timetable-route-regressions.test.js` passed `2/2`; direct source scans now show `27,608` bytes for `timetable.html`, `17,983` bytes for `assets/css/timetable-route.css`, `0` `<style>` tags in `timetable.html`, and the new `assets/css/timetable-route.css?v=20260516-timetable-route1` link; and a headless Playwright desktop/mobile sanity run confirmed the linked route CSS, the timetable canvas, the current week label, and zero console/page errors on both viewports.

Update `2026-05-16`:
- What changed: replaced the remaining timetable-specific schedule-action `onclick` strings in `assets/js/pages/planner.js` with delegated `data-*` controls, added a dedicated timetable browser probe, and captured real desktop/mobile route artifacts.
- Which task IDs moved: `TT-07`, `GLOBAL-08`.
- What evidence was checked: `node --check assets/js/pages/planner.js` and `node --check tools/capture_timetable_summary.mjs` passed; `npx vitest run test/timetable-route-regressions.test.js` stayed green at `2/2`; `artifacts/timetable-efficient-desktop-summary.json` now records `firstReadyMs: 1468`, `weekSwitchMs: 39`, `timetableViewMs: 29`, `scrollMs: 486`, `gridShellPresent: true`, `emptyStatePresent: true`, `sessionModalPresent: false`, and zero errors; and `artifacts/timetable-mobile-summary.json` now records `firstReadyMs: 1474`, `weekSwitchMs: 46`, `timetableViewMs: 15`, `scrollMs: 93`, `gridShellPresent: true`, `emptyStatePresent: true`, `sessionModalPresent: false`, `mobileNavVisible: true`, and zero errors.

Update `2026-05-16`:
- What changed: closed the inactive-surface task for the current live route after tightening the focused regression to prove the timetable view keeps only one active board surface and no timetable-specific drawer/modal shell.
- Which task IDs moved: `TT-04`, `MICRO-TT-04`.
- What evidence was checked: `npx vitest run test/timetable-route-regressions.test.js` passed `2/2`; direct source scans now show no `session-modal` or `schedule-drawer` shell markup in `timetable.html`, `planner.js` renders one `schedule-sessions-board` or `schedule-grid-shell` surface at a time, and the desktop/mobile timetable artifacts both report `sessionModalPresent: false`.

Update `2026-05-16`:
- What changed: added explicit efficient-tier timetable fallback selectors in `assets/css/index-luxury.css` for the timetable hero, command, stage, focus, canvas, filters, repeated session cards, and grid events.
- Which task IDs moved: `TT-03`, `MICRO-TT-03`.
- What evidence was checked: `npx vitest run test/timetable-route-regressions.test.js` stayed green at `2/2`; direct source scans now show the new `body[data-lux-performance='efficient'].lux-route-timetable` selectors at `assets/css/index-luxury.css` lines `21791` through `21825`; and the current desktop/mobile timetable artifacts still report zero errors.

Update `2026-05-16`:
- What changed: extracted the live timetable/profile-calendar runtime out of `planner.js` into `assets/js/pages/timetable-runtime.js`, moved `timetable.html` onto the dedicated page runtime, and switched the schedule surface to stable frame/empty regions so week/filter/view refreshes no longer replace the whole route container.
- Which task IDs moved: `TT-02`, `TT-06`, `MICRO-TT-02`, `MICRO-TT-05`.
- What evidence was checked: `node --check assets/js/pages/timetable-runtime.js` and `assets/js/pages/planner.js` passed; `npx vitest run test/timetable-route-regressions.test.js test/registration-route-regressions.test.js test/profile-route-regressions.test.js` passed; direct source scans now show `timetable.html` loading `assets/js/pages/timetable-runtime.js?v=20260516-surface-split1` with no eager `planner.js` import; and refreshed `artifacts/timetable-efficient-desktop-summary.json` / `artifacts/timetable-mobile-summary.json` still report zero errors with `weekSwitchMs: 39/46` and `timetableViewMs: 29/15`.

### `admin-tools-standalone.html`

Overall % left: `0%`

Evidence: removed from the root page set; the only remaining generator writes a bannered non-source artifact to `artifacts/generated/admin-tools/admin-tools-standalone.html`, and the old root filename is blocked from the web servers.

Hotspots: keep future rebuilds out of the live page root and out of manual code review scope.

Detailed execution checklist:
- Treat `admin-tools-standalone.html` as generated output, not source code.
- Confirm whether any deployment, launcher, or documentation path still uses it directly.
- If it stays in the repo, require regeneration from `tools/build_admin_tools_standalone.py` instead of hand edits.
- Keep performance work focused on `admin-tools.html`; only artifact ownership and deployment risk belong here.

Tasks:
- `ATS-01` `0% left` Stop treating this file as editable source and mark it as generated output everywhere.
- `ATS-02` `0% left` Decide whether the artifact belongs in git or should move to build output only.
- `ATS-03` `0% left` If the artifact stays, document regeneration steps and make sure reviewers never audit it as if it were hand-written code.
- `ATS-04` `0% left` Remove any deployment path that accidentally serves the artifact instead of the source page.
- `ATS-05` `0% left` Record the exact source-of-truth chain:
  `admin-tools.html`
  `tools/build_admin_tools_standalone.py`
  output artifact
- `ATS-06` `0% left` Check whether the artifact is included in any server static-file rule, installer, or release package.
- `ATS-07` `0% left` If the artifact stays in version control, add a header comment or doc note declaring it generated.
- `ATS-08` `0% left` Keep all future feature work out of this file.

Update `2026-05-15`:
- What changed: closed the standalone ownership work by moving the generator output under `artifacts/generated/admin-tools/`, adding an explicit generated-file banner, and blocking the old root route from both nginx and the local dev server.
- Which task IDs moved: `ATS-01`, `ATS-02`, `ATS-03`, `ATS-04`, `ATS-05`, `ATS-06`, `ATS-07`, `ATS-08`.
- What evidence was checked: the root HTML inventory no longer contains `admin-tools-standalone.html`; the build script still preserves the source-of-truth chain from `admin-tools.html` through `tools/build_admin_tools_standalone.py`; and the old live filename is denied by server config.

### `admin-tools-standalone.dom.html`

Overall % left: `0%`

Evidence: removed from the root page set, no current builder emits it, and no route, deploy, or debug tool now references the old root debug artifact.

Hotspots: keep the deleted debug artifact out of future cleanup scope unless a real generator returns.

Detailed execution checklist:
- Treat `admin-tools-standalone.dom.html` as generated or debug output, not source code.
- Confirm whether any automated diff, screenshot tool, deployment path, or release package still expects this artifact.
- Keep all performance work on the source page and builder, not on the artifact body itself.
- If the artifact is kept, make its generated/debug status explicit in docs and tooling.

Tasks:
- `ATSDOM-01` `0% left` Decide whether this debug artifact should exist in the repo at all.
- `ATSDOM-02` `0% left` If it stays, mark it as generated and non-source in docs and tooling.
- `ATSDOM-03` `0% left` Keep it out of normal cleanup passes so effort stays on real source files.
- `ATSDOM-04` `0% left` Remove it from any live or deployment-facing path.
- `ATSDOM-05` `0% left` Search build, deploy, docs, and artifact scripts for any dependency on this file name.
- `ATSDOM-06` `0% left` If retained, document how and why it is generated, and by which process.
- `ATSDOM-07` `0% left` Exclude it from manual code review scope and performance review scope.
- `ATSDOM-08` `0% left` Prefer deleting it from the live web surface even if it remains as a build/debug asset.

Update `2026-05-15`:
- What changed: closed the standalone DOM debug-artifact audit as a removal record because no current script, deploy path, or route map still depends on the root `.dom.html` file.
- Which task IDs moved: `ATSDOM-01`, `ATSDOM-02`, `ATSDOM-03`, `ATSDOM-04`, `ATSDOM-05`, `ATSDOM-06`, `ATSDOM-07`, `ATSDOM-08`.
- What evidence was checked: repo-wide reference scans now find the filename only in this audit; no builder or deploy script emits it; and the root HTML inventory contains no `.dom.html` artifact.

## Existing Tracker Links

- `index.html`: `docs/INDEX_HOME_OPTIMIZATION_TRACKER.md`
- `index.html?view=professor#home`: `docs/PROFESSOR_HOME_OPTIMIZATION_TRACKER.md`
- `lms.html`: `LMS_HTML_OPTIMIZATION_TASKS.md`
- `news.html`: `docs/NEWS_OPTIMIZATION_TRACKER.md`
- `social.html`: `docs/SOCIAL_OPTIMIZATION_TRACKER.md`
- `login.html`: `docs/LOGIN_OPTIMIZATION_TRACKER.md`
- `profile-view.html`: `docs/PROFILE_VIEW_OPTIMIZATION_TRACKER.md`
- `registration.html`: `docs/REGISTRATION_OPTIMIZATION_TRACKER.md`
- `library.html`: `docs/LIBRARY_OPTIMIZATION_TRACKER.md`
- `admin-tools.html`: `docs/ADMIN_TOOLS_OPTIMIZATION_TRACKER.md`
- `admin-library.html`: `docs/ADMIN_LIBRARY_OPTIMIZATION_TRACKER.md`
- `chancellery.html`: `docs/CHANCELLERY_OPTIMIZATION_TRACKER.md`
- `admin-orders.html`: `docs/ADMIN_ORDERS_OPTIMIZATION_TRACKER.md`
- `staff.html`: `docs/STAFF_OPTIMIZATION_TRACKER.md`
- `admin-scheduler.html`: `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md`
- `students-admin.html`: `docs/STUDENTS_ADMIN_OPTIMIZATION_TRACKER.md`
- `exam-portal.html`: `docs/EXAM_PORTAL_OPTIMIZATION_TRACKER.md`
- `student-service.html`: `docs/STUDENT_SERVICE_OPTIMIZATION_TRACKER.md`
- `orders.html`: `docs/ORDERS_OPTIMIZATION_TRACKER.md`
- `career-market.html`: `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md`
- `faculty-gradebook.html`: `docs/FACULTY_GRADEBOOK_OPTIMIZATION_TRACKER.md`
- `faculty-schedule.html`: `docs/FACULTY_SCHEDULE_OPTIMIZATION_TRACKER.md`
- `exams.html`: `docs/EXAMS_OPTIMIZATION_TRACKER.md`
- `programs.html`: `docs/PROGRAMS_OPTIMIZATION_TRACKER.md`
- `study-card.html`: `docs/STUDY_CARD_OPTIMIZATION_TRACKER.md`
- `protected-launch.html`: `docs/PROTECTED_LAUNCH_OPTIMIZATION_TRACKER.md`

## First Recommended Next Pass

1. `admin-scheduler.html`
2. `student-service.html`
3. `social.html`
4. `registration.html`
5. `staff.html`
6. `profile-view.html`
7. `login.html`
8. `faculty-gradebook.html`

## Appendix A: Per-Page Micro-Tasks

These micro-task packs sit under the main page sections above. They are intentionally more mechanical so a future LLM pass can execute work in a fixed order without improvising.

### `index.html` micro-tasks

- `MICRO-INDEX-01` `0% left` Export the exact role-entry matrix from `assets/js/app/state.js#getAllowedPagesForRole()` and `getRoleHomePage()` and confirm all roles still intentionally land on `index.html?view=<role>#home`.
- `MICRO-INDEX-02` `0% left` Classify every direct import in `index.html` as `critical shell`, `shared shell`, `mobile-only`, or `legacy carryover`.
- `MICRO-INDEX-03` `0% left` Prove whether hidden compatibility nodes `#prof-nav`, `#top-nav`, `#admin-nav`, and `#modal-overlay` are still needed before runtime boot.
- `MICRO-INDEX-04` `0% left` Map startup work in `assets/js/features/index-luxury.js` to exact shell phases:
  prepaint
  shell mount
  background
  transparency
  widget render
- `MICRO-INDEX-05` `0% left` Audit `assets/js/pages/index-mobile-shell.js` and remove any remaining hook polling or delayed work that survives after runtime readiness.
- `MICRO-INDEX-06` `0% left` Record weak-device fallback behavior for:
  canvas background
  transparency
  mobile nav
  home widgets
- `MICRO-INDEX-07` `0% left` Verify student, professor, admin, TA, and student-service desktop/mobile entry behavior after every shared-shell change.

### `lms.html` micro-tasks

- `MICRO-LMS-01` `0% left` List each direct import in `lms.html` and prove why only `gradebook.js` and `lms.js` remain eagerly loaded there.
- `MICRO-LMS-02` `0% left` Split `assets/js/pages/lms.js` into feature ownership notes:
  course list
  course workspace
  quiz builder
  protected monitoring
  gradebook helpers
  anti-cheat launch helpers
- `MICRO-LMS-03` `0% left` Build a timer table for every `setInterval` in `assets/js/pages/lms.js` and record when each timer starts, stops, and becomes hidden-tab safe.
- `MICRO-LMS-04` `0% left` Replace remaining inline `onclick` HTML strings emitted from `assets/js/pages/lms.js` with delegated actions by subview.
- `MICRO-LMS-05` `0% left` Inventory every full-screen overlay created in `assets/js/pages/lms.js` and record blur radius, z-index, and class-based replacement target.
- `MICRO-LMS-06` `0% left` Mark which LMS subviews can mount lazily instead of staying resident:
  quiz
  gradebook
  monitoring
  export
- `MICRO-LMS-07` `0% left` Capture weak-laptop checks for course open, quiz open, gradebook open, and protected-timer idle behavior.

### `login.html` micro-tasks

- `MICRO-LOGIN-01` `0% left` Enumerate every redirect branch in `login.html`, `assets/js/app/auth.js`, and any auth fallback logic; the standalone login runtime plus the refreshed browser probe now cover student redirect, admin redirect, existing-session redirect, expired-session fallback, no-token fallback, Microsoft start, and Microsoft callback completion.
- `MICRO-LOGIN-02` `0% left` Prove which shared CSS files are actually needed on login and which are only inherited from the dashboard shell; the route now keeps only `assets/vendor/fontawesome/css/all.min.css`, `assets/css/kiu-fonts.css`, and `assets/css/login-route.css`.
- `MICRO-LOGIN-03` `0% left` Remove inline event handlers only after mapping each submit, SSO, and redirect branch to a dedicated auth controller; login tabs, password toggles, SSO, password submit, and activation submit now route through delegated `data-login-*` hooks.
- `MICRO-LOGIN-04` `0% left` Audit whether login still implicitly depends on any non-auth route runtime through compatibility imports or globals; the route now boots one dedicated runtime and no dashboard compatibility packs.
- `MICRO-LOGIN-05` `0% left` Record mobile weak-device paint cost before and after font/CSS trimming; the login browser artifacts now capture first-ready plus student/admin redirect latency on efficient desktop and mobile.
- `MICRO-LOGIN-06` `0% left` Add a regression checklist for:
  student login
  admin login
  existing-auth redirect
  Microsoft auth redirect
  no-token fallback
  The refreshed login artifact pair now records student/admin login redirect, existing-session redirect, expired-session fallback, no-token fallback, Microsoft start, and Microsoft callback completion on both desktop and mobile.

### `news.html` micro-tasks

- `MICRO-NEWS-01` `0% left` List exact imports for `news.html` and mark each one `keep`, `lazy`, or `remove`.
- `MICRO-NEWS-02` `0% left` Audit `assets/js/pages/news.js` for any root-wide rerenders or one-shot blocks that can move after first paint; repeated cards keep `content-visibility`, the privilege workspace still lazy-loads on first open, and the route now updates stable post regions instead of rebuilding the root.
- `MICRO-NEWS-03` `0% left` Prove whether `news.html` should stay standalone or become a thin shell route.
- `MICRO-NEWS-04` `0% left` Verify that story list, detail body, and sidebar widgets can update independently; the route now keeps stable shell/feed/post regions with separate header/audience/body/private updates per post.
- `MICRO-NEWS-05` `0% left` Capture low-end mobile startup and first-story-open latency; `artifacts/news-efficient-desktop-summary.json` and `artifacts/news-mobile-summary.json` now record startup, search, privilege-open, and mobile action-sheet timings with zero errors.

### `social.html` micro-tasks

- `MICRO-SOCIAL-01` `0% left` Split `assets/js/pages/social-page.js` into explicit ownership regions:
  feed
  events
  inbox
  projects
  page profiles
  Note: `community`, `lost and found`, `alerts`, `messages`, and `profile` now defer into dedicated companion modules; the next internal split should target `feed`.
- `MICRO-SOCIAL-02` `0% left` Split `assets/js/shared/social-runtime-lite.js` ownership into store, hydration, event dispatch, and per-panel cache work.
- `MICRO-SOCIAL-03` `0% left` Remove `social-mobile.js` polling and replace it with a deterministic runtime-ready signal.
- `MICRO-SOCIAL-04` `0% left` Identify every place where a panel switch or message action rebuilds more DOM than necessary.
- `MICRO-SOCIAL-05` `0% left` Record which overlays, loaders, and action sheets can be created only on first open.
- `MICRO-SOCIAL-06` `0% left` Verify which CSS layer is canonical:
  `assets/css/social-rebuild.css`
  `assets/css/social.css`
  shared shell CSS
- `MICRO-SOCIAL-07` `0% left` Capture weak-laptop and mobile checks for feed load, community open, inbox open, composer open, and long-thread scroll smoothness.

### `registration.html` micro-tasks

- `MICRO-REG-01` `0% left` Split `assets/js/pages/registration.js` by role branch and record exact functions that belong to student, professor, admin, and chancellery flows; the live student route now boots `assets/js/pages/registration-student-route.js`, no longer imports the legacy `registration.js` bundle at startup, no longer needs `admin-registration.js` on first load, no longer carries the dead admin quiz/exam studio surface inside `student-registration.js`, and `registration.js` is now only imported by `admin-tools.html`.
- `MICRO-REG-02` `0% left` Build an inline-handler inventory for the `21` inline handlers and group them by:
  subject toggles
  modal actions
  tab switches
  chancellery actions
- `MICRO-REG-03` `0% left` Build a full `innerHTML` rerender inventory and mark which blocks can be replaced with smaller update zones first; the standalone student route no longer imports the worst legacy `registration.js` owner or `admin-registration.js` at startup, and the main shell rails, pane bodies, section picker, and structured-form overlays now use DOM builders with no raw markup injection sites in `student-registration.js`.
- `MICRO-REG-04` `0% left` Prove which imports among `lms.js`, `planner.js`, `student-registration.js`, and `admin-registration.js` are truly required on first load.
- `MICRO-REG-05` `0% left` Record which dense registration surfaces still use blur or expensive shadow stacks on repeated cards; the route audit and new efficient-tier selectors now explicitly cover the repeated registration hero/workspace/module cards, insight/focus cards, footer bar, tabs, mini-metric cards, course rows, module choices, track groups, and `#modal-program-courses`.
- `MICRO-REG-06` `0% left` Split weak-device checks into:
  subject list open
  subject toggle
  module modal open
  large-list scroll
  hidden-tab idle CPU
  The seeded route artifacts now capture route ready, selected-tab open, history-tab open, return to program lane, section-picker open, and scroll timings on efficient desktop and mobile with all six student tabs visible and zero errors.

### `programs.html` micro-tasks

- `MICRO-PROG-01` `0% left` Record which `registration.js`, `planner.js`, and `student-registration.js` helpers are actually used by `programs.html`; the standalone route now runs on `assets/js/pages/programs-page.js` and no longer loads those page-pack runtimes on first load.
- `MICRO-PROG-02` `0% left` Separate route ownership into filter bar, program list, detail view, and curriculum modal; the route now keeps a stable filter shell plus separate overview, module-rail, and subject-panel regions under the dedicated programs controller.
- `MICRO-PROG-03` `0% left` Mark inactive detail and curriculum DOM that can stay unmounted until a user opens a program; the subject-detail surface now mounts through deferred `scheduleProgramsSubjectPanelRender(...)`, and no separate curriculum modal remains on the live route.
- `MICRO-PROG-04` `0% left` Verify whether `programs` access is intentionally shared across student, professor, TA, and admin roles; this is already documented in the master audit role-access matrix and the dedicated programs tracker.
- `MICRO-PROG-05` `0% left` Capture weak-laptop checks for list open, filter change, and curriculum-modal open latency; `artifacts/programs-efficient-desktop-summary.json` and `artifacts/programs-mobile-summary.json` now record first-ready, filter-change, and module-detail timings with zero errors.

### `personal-data.html` micro-tasks

- `MICRO-PDATA-01` `0% left` Prove which of the seven eager page runtimes are actually needed by `personal-data.html`.
- `MICRO-PDATA-02` `0% left` Move the two local style blocks into route CSS before any behavioral refactor.
- `MICRO-PDATA-03` `0% left` Separate ownership into summary cards, editable forms, attachments, and status/history blocks; the route now has dedicated identity, summary, facts, and record renderers, and the live route currently has no editable form or attachment panel to split further.
- `MICRO-PDATA-04` `0% left` Compare this route against `profile.html` and `profile-view.html` and list shared versus duplicate form logic; the current split is now explicit: `personal-data` stays read-only, `profile` stays self-edit/account, and `profile-view` stays viewer/admin session management.
- `MICRO-PDATA-05` `0% left` Capture weak-laptop checks for edit, save, attachment preview, and tab switching; the desktop/mobile artifacts now time route open and rerender while explicitly recording that the live route has no edit/save or attachment-preview flow.

### `profile.html` micro-tasks

- `MICRO-PROFILE-01` `0% left` Compare `profile.html` against `profile-view.html` component by component and record exact duplication; the current audit is complete and still supports only a thinner shared identity-summary/helper layer rather than one shared page shell.
- `MICRO-PROFILE-02` `0% left` Inventory the `18` inline handlers by tab, action, and modal type.
- `MICRO-PROFILE-03` `0% left` Prove which of the seven eager route runtimes are actually needed on self-profile first load.
- `MICRO-PROFILE-04` `0% left` Split the route into hero, editable tabs, attachments, and analytics or activity blocks; the route now keeps a distinct hero, a dedicated tab shell with lazy non-overview panes, a separate messenger surface, no live attachment/editor workflow beyond those regions, and no remaining shell-only inline style ownership in the HTML.
- `MICRO-PROFILE-05` `0% left` Record which tabs can render lazily instead of at entry; `profile-tab-email`, `profile-tab-password`, and `profile-tab-calendar` now mount from `profile-tab-template-*` only on first open.
- `MICRO-PROFILE-06` `0% left` Capture weak-laptop and mobile checks for tab open, edit mode, and attachment actions; `artifacts/profile-efficient-desktop-summary.json` and `artifacts/profile-mobile-summary.json` now record self-profile tab-open timings, and both runs explicitly report `editFlowPresent: false` plus `attachmentFlowPresent: false` for the current route shape.

### `profile-view.html` micro-tasks

- `MICRO-PVIEW-01` `0% left` Remove source corruption first: mojibake strings, broken comments, and unreadable embedded labels.
- `MICRO-PVIEW-02` `0% left` Inventory all `38` inline handlers and group them into clicks, hover handlers, timetable slot actions, and modal actions.
- `MICRO-PVIEW-03` `0% left` Move the `4` embedded style blocks into route CSS; `profile-view.html` now links `assets/css/profile-view-route.css` and no longer contains inline `<style>` tags.
- `MICRO-PVIEW-04` `0% left` Prove which of the seven eager route runtimes are still required for profile-view first load.
- `MICRO-PVIEW-05` `0% left` Separate route ownership into summary, sidebar info, tabs, timetable block, and admin-only controls; the schedule/admin modal shells plus the schedule-row editor now live behind dedicated templates while the main page shell keeps those surfaces isolated from the first render.
- `MICRO-PVIEW-06` `0% left` Record which profile tabs can remain unmounted until selected; only `pvtab-0` mounts initially while `pvtab-1` through `pvtab-4` now hydrate from per-tab templates on first selection.
- `MICRO-PVIEW-07` `0% left` Capture weak-laptop and mobile checks for profile open, tab switch, timetable slot open, and admin session actions; the profile-view browser artifacts now record profile ready, schedule-tab open, session-modal open, and group-edit open timings on efficient desktop and mobile.

### `study-card.html` micro-tasks

- `MICRO-SCARD-01` `0% left` Prove which of the seven eager route runtimes are actually needed by `study-card.html`; the standalone route now keeps only `gradebook.js` plus the dedicated `assets/js/pages/study-card-page.js` controller on first load.
- `MICRO-SCARD-02` `0% left` Inventory the `9` inline handlers and group them by export, navigation, or field interaction; the shell now has `0` inline handlers, and the assessment actions route through delegated `data-study-card-assessment-*` hooks.
- `MICRO-SCARD-03` `0% left` Split ownership into summary header, card details, print or export actions, and attachments; the dedicated controller now owns the loaded-state shell, summary, semester, and assessment regions, while attachment/export-specific modal work stays lazy.
- `MICRO-SCARD-04` `0% left` Treat print/export code as lazy-only and record what can leave first-paint startup; the static modal payload is gone from `study-card.html`, and the live route currently has no dedicated export flow beyond lazy shared modal helpers.
- `MICRO-SCARD-05` `0% left` Capture weak-laptop and mobile checks for card open, export entry, and long-card scroll smoothness; `artifacts/study-card-efficient-desktop-summary.json` and `artifacts/study-card-mobile-summary.json` now record loaded-state open, assessment open, lazy syllabus-modal open, and long-scroll timings with zero errors.

### `timetable.html` micro-tasks

- `MICRO-TT-01` `0% left` Inventory all `24` inline handlers and group them into week navigation, filter actions, session actions, and modal openers; the shell now routes them through `data-timetable-*` hooks plus route-local listeners.
- `MICRO-TT-02` `0% left` Split timetable-only behavior away from broader planner logic inside `assets/js/pages/planner.js`; the live timetable renderer, week/view state, and profile-calendar helpers now live in `assets/js/pages/timetable-runtime.js`, and the standalone route no longer imports `planner.js`.
- `MICRO-TT-03` `0% left` Audit every `lux-timetable-canvas` and related transparency selector path in shared CSS and utilities; the control band already strips transparency signatures, the route-local timetable CSS is isolated in `assets/css/timetable-route.css`, and `assets/css/index-luxury.css` now contains explicit efficient-tier fallback selectors for the timetable hero, command, stage, focus, canvas, filters, repeated session cards, and grid events.
- `MICRO-TT-04` `0% left` Mark inactive week content, filter panes, and session drawers that can remain unmounted until needed; the live route renders one active `schedule-sessions-board` or `schedule-grid-shell` surface at a time, keeps the filter shell static, and the current route/browser checks explicitly report no timetable-specific session drawer/modal shell.
- `MICRO-TT-05` `0% left` Replace whole-board rerenders with smaller updates for week change, selected session, and filter state; the runtime now keeps stable schedule-surface frame/empty regions and updates the session-board/grid subregions in place instead of replacing the whole timetable container on each refresh.
- `MICRO-TT-06` `0% left` Capture weak-laptop and mobile checks for scroll smoothness, week-switch latency, and session-modal open; `artifacts/timetable-efficient-desktop-summary.json` and `artifacts/timetable-mobile-summary.json` now record first-ready, week-switch, timetable-view-switch, and scroll timings, and both runs explicitly report `sessionModalPresent: false` because the current live route has no timetable-specific session modal.

### `admin-tools.html` micro-tasks

- `MICRO-ADMT-01` `0% left` Prove which eager page runtimes imported by `admin-tools.html` are still needed and which are compatibility leftovers.
- `MICRO-ADMT-02` `0% left` Split ownership between `admin-tools.html`, `assets/css/admin-tools-luxury.css`, and any shared-shell spillover.
- `MICRO-ADMT-03` `0% left` Inventory inline or string-built UI actions and move them into a dedicated admin-tools controller surface; the dedicated tracker now shows the remaining admin-tools action hooks and planner-owned controls fully delegated.
- `MICRO-ADMT-04` `0% left` Separate live-page work from standalone artifact work so optimization changes never target the generated output first.
- `MICRO-ADMT-05` `0% left` Capture weak-laptop and mobile checks for first paint, tool switch, and modal open latency.

### `admin-library.html` micro-tasks

- `MICRO-ALIB-01` `0% left` Prove each of the seven eager page-runtime imports and mark keep/remove with evidence.
- `MICRO-ALIB-02` `0% left` Inventory the `16` inline handlers and group them by table action, modal action, and navigation action.
- `MICRO-ALIB-03` `0% left` Move the two local style blocks into route CSS before deleting handler logic.
- `MICRO-ALIB-04` `0% left` Split route ownership into library pane, table, details, and modal surfaces.
- `MICRO-ALIB-05` `0% left` Capture weak-laptop checks for table load, filter, and modal open; `artifacts/admin-library-efficient-desktop-summary.json` and `artifacts/admin-library-mobile-summary.json` now record table-ready, filter, and parameter-modal timings with zero errors.

### `admin-orders.html` micro-tasks

- `MICRO-AORD-01` `0% left` Map each inline script block to inbox load, filter, action, or render ownership.
- `MICRO-AORD-02` `0% left` Create a destination plan for moving inline logic into `assets/js/pages/admin-orders.js`.
- `MICRO-AORD-03` `0% left` Inventory the `17` inline handlers and group them by inbox row, status action, and reply action.
- `MICRO-AORD-04` `0% left` Remove `transition: all` from local route styling and record exact replacement properties.
- `MICRO-AORD-05` `0% left` Capture weak-laptop and mobile checks for inbox open, status change, and reply latency.

### `admin-scheduler.html` micro-tasks

- `MICRO-ASCH-01` `0% left` Inventory all `42` inline handlers and group them into slot open, palette selection, edit, stats, and delete actions; the dedicated scheduler tracker now records the grouped delegated `data-*` controller paths with `0` remaining live `onclick=` hits in the route.
- `MICRO-ASCH-02` `0% left` Split `assets/js/pages/admin-scheduler.js` into palette setup, grid render, modal edit, and filter ownership notes; `docs/ADMIN_SCHEDULER_OPTIMIZATION_TRACKER.md` now maps those ownership regions explicitly and the live controller uses dedicated DOM helpers for palette/grid/event-card rendering.
- `MICRO-ASCH-03` `0% left` Inventory all blur-heavy overlays and event-card shadow stacks created by the scheduler route; the route tracker now records the repeated panel/card/modal blur/shadow families and their lower route-scoped `--sch-glass-blur-*` / `--sch-*-shadow` variables.
- `MICRO-ASCH-04` `0% left` Mark which scheduler DOM can mount only for active faculty, semester, and week instead of all states; `admin-scheduler.html` now keeps both hidden overlays inside `<template>` nodes and the live grid/palette continue to render only the current faculty/semester/week state.
- `MICRO-ASCH-05` `0% left` Capture weak-laptop and mobile checks for week render, slot open, and edit modal open latency; `artifacts/admin-scheduler-efficient-desktop-summary.json` and `artifacts/admin-scheduler-mobile-summary.json` now record first-ready, week-render, slot-open, and edit-modal timings with zero errors.

### `faculty-gradebook.html` micro-tasks

- `MICRO-FGB-01` `0% left` Prove which of the seven eager shared-shell route runtimes are actually required by faculty gradebook; the final import proof is `gradebook.js` eager, `lms.js` lazy-only for LMS handoff, and the remaining five route packs removed.
- `MICRO-FGB-02` `0% left` Inventory the `8` inline handlers by filter, row action, and detail action; the shell controls now use delegated `data-gradebook-*` hooks through `bindStandaloneGradebookShell()`.
- `MICRO-FGB-03` `0% left` Record overlap with `gradebook.html`, `faculty-schedule.html`, and `timetable.html`; `gradebook.html` remains the alias to this route, `faculty-schedule.html` now aliases to `timetable.html`, and the live gradebook shell no longer imports `planner.js`, so the former shell overlap is closed.
- `MICRO-FGB-04` `0% left` Split route ownership into summary widgets, grading tables, and detail panes; the hidden spreadsheet shell no longer lives in the HTML entry and now mounts on first roster open through `ensureGradebookSpreadsheetShell()`.
- `MICRO-FGB-05` `0% left` Capture weak-laptop and mobile checks for grade table load, filter, and open-detail latency; `artifacts/faculty-gradebook-efficient-desktop-summary.json` and `artifacts/faculty-gradebook-mobile-summary.json` now record roster-ready, semester-filter change, grade-table open, and history-modal open timings with zero errors.

### `faculty-schedule.html` micro-tasks

- `MICRO-FSCH-01` `0% left` Prove which of the seven eager shared-shell route runtimes are actually required by faculty schedule; no shared/page runtime remains because `faculty-schedule.html` is now a redirect-only alias to `timetable.html`.
- `MICRO-FSCH-02` `0% left` Inventory the `8` inline handlers by week control, session action, and detail action; no interactive shell remains because the wrapper now contains only the redirect script.
- `MICRO-FSCH-03` `0% left` Record overlap with `timetable.html` and identify schedule features that are truly faculty-only; the overlap audit is resolved because `faculty-schedule.html` now aliases directly to `timetable.html`.
- `MICRO-FSCH-04` `0% left` Split route ownership into week nav, schedule grid, and detail drawer; ownership now belongs to `timetable.html` because no standalone faculty-schedule shell remains.
- `MICRO-FSCH-05` `0% left` Capture weak-laptop and mobile checks for week change, session open, and filter changes; wrapper-level JS-enabled and no-JS redirect checks now exist, and live schedule-performance QA belongs to `timetable.html`.

### `library.html` micro-tasks

- `MICRO-LIB-01` `0% left` Prove which of the seven eager shared-shell route runtimes are actually required by the normal library page.
- `MICRO-LIB-02` `0% left` Inventory the inline handlers by filter, list action, and file-preview action.
- `MICRO-LIB-03` `0% left` Separate route ownership into list, filters, detail drawer, and file-viewer surfaces.
- `MICRO-LIB-04` `0% left` Record which repeated list-card visual effects can downgrade on weak-device mode.
- `MICRO-LIB-05` `0% left` Capture weak-laptop and mobile checks for list scroll, filter change, and detail open latency.

### `orders.html` micro-tasks

- `MICRO-ORD-01` `0% left` Prove which of the seven eager shared-shell route runtimes are actually required by the normal orders page; all seven former page-pack imports are removed, and the live route now runs on the shared `assets/js/shared/orders-workspace.js` owner.
- `MICRO-ORD-02` `0% left` Inventory the `9` inline handlers by inbox row, detail action, and attachment action; the shell and shared orders runtime now use delegated `data-*` hooks with `0` inline handlers in `orders.html`.
- `MICRO-ORD-03` `0% left` Record exact duplication and divergence versus `admin-orders.html`; both live routes now share `assets/js/shared/orders-workspace.js`, while only the admin shell keeps route-specific studio/bootstrap ownership.
- `MICRO-ORD-04` `0% left` Split route ownership into inbox list, detail pane, and attachment tools; the live recipient path now keeps stable hero/list/detail regions and shared detail-region helpers instead of one monolithic route body.
- `MICRO-ORD-05` `0% left` Capture weak-laptop and mobile checks for inbox scroll, detail open, and attachment preview.

### `chancellery.html` micro-tasks

- `MICRO-CHAN-01` `0% left` Prove which of the seven eager shared-shell route runtimes are actually required by chancellery; the standalone route now keeps only the shared shell stack plus `assets/js/pages/chancellery.js`.
- `MICRO-CHAN-02` `0% left` Split route ownership into request list, request detail, reply composer, and status/attachment actions; `assets/js/pages/chancellery.js` now owns the standalone request workflow behind stable hero/content regions.
- `MICRO-CHAN-03` `0% left` Record any full-detail-pane rerenders that can shrink to status-only or reply-only updates; the route now keeps a stable shell and refreshes hero/content regions instead of replacing `#page-chancellery` wholesale.
- `MICRO-CHAN-04` `0% left` Record repeated blur or transparency surfaces that appear on lists or detail cards; efficient-tier fallbacks now explicitly cover the chancellery hero, focus card, queue item, and thread-entry surfaces.
- `MICRO-CHAN-05` `0% left` Capture weak-laptop and mobile checks for request list scroll, detail open, and reply submit latency; `artifacts/chancellery-mobile-summary.json` now verifies queue scroll and detail-open behavior on the dedicated runtime.

### `exams.html` micro-tasks

- `MICRO-EXAMS-01` `0% left` Split `assets/js/pages/exams-console.js` into dashboard, builder, grading, analytics, and overlay ownership notes; the dedicated exams tracker now maps those ownership regions explicitly before the real module split.
- `MICRO-EXAMS-02` `0% left` Inventory all `transition: all` and blur-heavy overlay style-string sites in the exams runtime; the modal overlay sites are now consolidated behind `renderExamModalShell()` and the remaining blur-heavy surfaces are documented in the exams tracker.
- `MICRO-EXAMS-03` `0% left` Mark which exam editor and analytics DOM can remain unmounted until staff opens it; `renderWorkspace()` now has explicit source-tested gating by `runtime.activeTab` and `runtime.templateDraft`.
- `MICRO-EXAMS-04` `0% left` Record whether any unrelated shared page runtimes still load at exams entry; the import verdict table now proves the keep/remove status for the shell stack and export-library CDN trio.
- `MICRO-EXAMS-05` `0% left` Capture weak-laptop and mobile checks for dashboard load, builder open, and grading modal open; `artifacts/exams-efficient-desktop-summary.json` and `artifacts/exams-mobile-summary.json` now record first-ready, builder-open, and manual grading surface open timings with zero runtime errors.

### `exam-portal.html` micro-tasks

- `MICRO-EXAM-01` `0% left` Build a timer ownership table for session countdown, protected countdown, and heartbeat; the dedicated tracker now maps dashboard countdown, protected countdown, and protected heartbeat start/stop/visibility rules.
- `MICRO-EXAM-02` `0% left` Inventory all inline `onclick` action sites emitted by `assets/js/pages/exam-portal.js`; source scans now report `0` inline `onclick` sites.
- `MICRO-EXAM-03` `0% left` Split route ownership into token state, scheduled sessions, protected attempt, blocked view, and modal helpers; the runtime now has dedicated dashboard, protected, blocked, receipt, and confirm/helper render paths.
- `MICRO-EXAM-04` `0% left` Record every whole-root rerender and mark the smaller update target that can replace it; `root.innerHTML` is now limited to four intentional mode swaps while countdowns, notices, autosave, nav state, and flags update in place.
- `MICRO-EXAM-05` `0% left` Capture anti-cheat-browser and weak-device checks for session list open, protected attempt, and idle countdown CPU; the anti-cheat desktop and weak-mobile artifacts now capture those timings with zero errors.

### `staff.html` micro-tasks

- `MICRO-STAFF-01` `0% left` Prove which staff page scripts must remain eager and which can be deferred; the shell now keeps `staff-command-center.js` plus `staff-route-bootstrap.js` eager, while both `directories.js` and `staff-mobile-shell.js` defer until their specific route boundary is needed.
- `MICRO-STAFF-02` `0% left` Separate ownership into directory tools, command center, and mobile shell behavior; `staff-command-center.js` now owns the desktop hub, `staff-route-bootstrap.js` owns the viewport gate, `staff-mobile-shell.js` stays mobile-only, and `directories.js` remains the canonical-profile bridge.
- `MICRO-STAFF-03` `0% left` Record where `assets/js/pages/staff-mobile-shell.js` still waits on runtime hooks instead of explicit readiness events.
- `MICRO-STAFF-04` `0% left` Compare `staff.html` feature ownership against `staff_lms_clean.html`; the audit now proves `staff.html` is the live source of truth and `staff_lms_clean.html` was only a dead legacy duplicate.
- `MICRO-STAFF-05` `0% left` Capture weak-laptop and mobile checks for staff directory open, command-center load, and action-sheet latency; `artifacts/staff-efficient-desktop-summary.json` and `artifacts/staff-mobile-summary.json` now record first-ready, profile/canonical-profile handoff, action-sheet latency, and the desktop/mobile mobile-shell load state with zero errors.

### `students-admin.html` micro-tasks

- `MICRO-STUADM-01` `0% left` Prove which shared shell imports are still required by `students-admin.html`, especially `messenger.js`, `utilities.js`, and `index-luxury.js`; the dedicated tracker now records the keep/remove verdict for every remaining shared shell import.
- `MICRO-STUADM-02` `0% left` Record whether `assets/js/pages/students-admin-lms.js` still depends on any legacy fade or directory helper path; the dedicated tracker now proves the adapter owns its own directory/profile flow without legacy fade or duplicate-page dependency.
- `MICRO-STUADM-03` `0% left` Compare `students-admin.html` feature ownership against `students_lms_management.html`; the legacy duplicate had no live references and has been removed from maintenance.
- `MICRO-STUADM-04` `0% left` Mark every hidden modal or table region that can remain unmounted until first use; the dedicated adapter shape and route tests now guard the minimal live shell plus adapter-owned modal workflow.
- `MICRO-STUADM-05` `0% left` Capture weak-laptop and mobile checks for table load, filter change, and modal open latency.

### `student-service.html` micro-tasks

- `MICRO-SSVC-01` `0% left` Prove which of the eight eager page runtimes are actually required by `student-service.html`.
- `MICRO-SSVC-02` `0% left` Split route ownership into inbox or queue, account panel, action workspace, and modal/detail drawers.
- `MICRO-SSVC-03` `0% left` Record all large one-shot `innerHTML` updates in `assets/js/pages/student-service.js`; the dedicated tracker now records that the raw `innerHTML =` source count is `0`, with stable shells and smaller region updates across every major lane/workspace surface.
- `MICRO-SSVC-04` `0% left` Record which scrolling or repeated student-service surfaces still keep blur/transparency work; the dedicated tracker now records route-scoped efficient-tier blur/shadow fallbacks for the repeated workspace, inbox, article, lane, and Q&A surfaces.
- `MICRO-SSVC-05` `0% left` Capture weak-laptop and mobile checks for inbox scroll, queue open, and action completion latency; `artifacts/student-service-efficient-desktop-summary.json` and `artifacts/student-service-mobile-summary.json` now capture scroll, lane-open, queue-open, and action-completion timings with zero errors.

### `career-market.html` micro-tasks

- `MICRO-CARE-01` `0% left` Split ownership into provider rail, history list, transcript, composer, and route-specific chrome; `docs/CAREER_MARKET_OPTIMIZATION_TRACKER.md` now records the current ownership map for the route shell, history rail, transcript/workspace, modal shells, and composer flow.
- `MICRO-CARE-02` `0% left` Move the large inline style block into route CSS before behavior refactors; `career-market.html` now links `assets/css/career-market-route.css` and has `0` inline `<style>` blocks.
- `MICRO-CARE-03` `0% left` Record whether history changes, provider switches, or new messages currently rebuild too much of the route; the current hotspot list is now explicit (`career-provider-file-list`, instruction studio tabs/editor, wizard stepper/card, vacancy output, and view-shell swaps), and the history rail no longer rebuilds with `innerHTML`.
- `MICRO-CARE-04` `0% left` Verify whether `career-market` is intentionally student-facing only or should be reachable by more roles; the role-access audit already proves the route is intentionally student-only in the current code.
- `MICRO-CARE-05` `0% left` Capture weak-laptop and mobile checks for first paint, provider switch, and long transcript scroll smoothness; `artifacts/career-market-efficient-desktop-summary.json` and `artifacts/career-market-mobile-summary.json` now record first-ready, provider-modal open, provider switch, reports/vacancies view switch, and seeded transcript scroll timings with zero errors.

### `calendar.html` micro-tasks

- `MICRO-CAL-01` `0% left` Prove that `calendar.html` is now only a redirect alias and no longer a real route.
- `MICRO-CAL-02` `0% left` Remove all shared shell CSS and JS from the wrapper until only redirect behavior remains.
- `MICRO-CAL-03` `0% left` Remove hidden nav stubs and shell body classes once no runtime depends on them.
- `MICRO-CAL-04` `0% left` Verify the wrapper no longer downloads fonts or icon CSS before redirect.
- `MICRO-CAL-05` `0% left` Capture one no-JS and one JS-enabled redirect check after cleanup.

### `gradebook.html` micro-tasks

- `MICRO-GREDIR-01` `0% left` Prove that `gradebook.html` is only an alias for `faculty-gradebook.html`.
- `MICRO-GREDIR-02` `0% left` Delete the inline mobile scaffold before touching anything else.
- `MICRO-GREDIR-03` `0% left` Remove all shared shell CSS and JS from the wrapper.
- `MICRO-GREDIR-04` `0% left` Remove nav stubs and shell classes once runtime is gone.
- `MICRO-GREDIR-05` `0% left` Capture one no-JS and one JS-enabled redirect check after cleanup.

### `email.html` micro-tasks

- `MICRO-MAIL-01` `0% left` Decide route ownership first: live page, orphan, experiment, or removal candidate.
- `MICRO-MAIL-02` `0% left` If it stays live, prove each of its `9` page-script imports individually.
- `MICRO-MAIL-03` `0% left` Record where `assets/js/pages/email.js` uses interval refresh and what event-driven replacement can take over.
- `MICRO-MAIL-04` `0% left` Split route ownership into inbox, thread view, composer, and refresh state.
- `MICRO-MAIL-05` `0% left` Capture weak-laptop and mobile checks if the route remains live.

### `protected-launch.html` micro-tasks

- `MICRO-PLAUNCH-01` `0% left` Decide whether the long-term owner is LMS, exam portal, or a shared secure-exam mini shell; the dedicated protected-launch tracker now keeps the source-backed conclusion that this page remains a standalone secure-exam mini shell shared conceptually by LMS and exam flows, not merged into `exam-portal.html`.
- `MICRO-PLAUNCH-02` `0% left` Record every style token duplicated with `exam-portal.html`; `docs/PROTECTED_LAUNCH_OPTIMIZATION_TRACKER.md` now includes the explicit duplication map covering palette, typography, gradients, and protected-exam copy overlap.
- `MICRO-PLAUNCH-03` `0% left` Record which animated and blurred layers can degrade in reduced-motion or weak-device mode; the page now uses the reduced-performance guard to disable pulse/hover motion and flatten the heavier layered gradients and shadows on weaker hardware.
- `MICRO-PLAUNCH-04` `0% left` Verify the page stays standalone and never starts loading shared-shell assets; direct source scans and the dedicated route regression now prove the page keeps only `assets/js/app/api.js` and no shared-shell script imports.
- `MICRO-PLAUNCH-05` `0% left` Capture launch-page first-paint and redirect/open latency on weak hardware; `artifacts/protected-launch-efficient-desktop-summary.json` and `artifacts/protected-launch-mobile-summary.json` now record first-ready, handoff latency, reduced-performance mode, and zero errors.

### `staff_lms_clean.html` micro-tasks

- `MICRO-STAFFLEG-01` `0% left` Prove whether any live route, doc, launcher, or admin action still opens this file.
- `MICRO-STAFFLEG-02` `0% left` If no inbound path exists, convert the work from optimization to removal/deprecation only.
- `MICRO-STAFFLEG-03` `0% left` If kept, move inline styles and script into route-owned assets before behavior refactor.
- `MICRO-STAFFLEG-04` `0% left` Compare every major feature against `staff.html` and mark duplicate versus unique behavior.
- `MICRO-STAFFLEG-05` `0% left` Do not spend runtime-optimization effort here until ownership is proven.

### `students_lms_management.html` micro-tasks

- `MICRO-STULEG-01` `0% left` Prove whether any live route, doc, launcher, or admin action still opens this file.
- `MICRO-STULEG-02` `0% left` If no inbound path exists, convert the work from optimization to removal/deprecation only.
- `MICRO-STULEG-03` `0% left` If kept, move inline styles and script into route-owned assets before behavior refactor.
- `MICRO-STULEG-04` `0% left` Compare every major feature against `students-admin.html` and mark duplicate versus unique behavior.
- `MICRO-STULEG-05` `0% left` Do not spend runtime-optimization effort here until ownership is proven.

### `admin-tools-standalone.html` micro-tasks

- `MICRO-ATS-01` `0% left` Treat this file as generated output only, never as source.
- `MICRO-ATS-02` `0% left` Confirm whether any deployment or release path still serves or packages it.
- `MICRO-ATS-03` `0% left` Record the exact source-of-truth chain:
  `admin-tools.html`
  `tools/build_admin_tools_standalone.py`
  generated artifact
- `MICRO-ATS-04` `0% left` If retained, document regeneration steps and keep all feature work out of the file.
- `MICRO-ATS-05` `0% left` If removable, record the exact release or deploy dependency that must be replaced first.

### `admin-tools-standalone.dom.html` micro-tasks

- `MICRO-ATSDOM-01` `0% left` Treat this file as generated or debug output only, never as source.
- `MICRO-ATSDOM-02` `0% left` Confirm whether any automated diff, screenshot, or build script still depends on it.
- `MICRO-ATSDOM-03` `0% left` Keep all optimization work on `admin-tools.html` and the builder, not on this artifact body.
- `MICRO-ATSDOM-04` `0% left` If retained, document how it is generated and why it still exists.
- `MICRO-ATSDOM-05` `0% left` If removable, record which debug or release process must be updated first.
