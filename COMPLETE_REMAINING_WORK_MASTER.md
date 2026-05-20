# Complete Remaining Work Master

Purpose:
- provide one final master checklist for finishing the website work end-to-end
- remove guesswork for both a human coder and another LLM
- make it obvious what “fully completed” means
- consolidate the remaining tasks from the other planning files into one execution document

Related files:
- `PAGE_LOAD_FIX_TASKS.md`
- `PERFORMANCE_OPTIMIZATION_CONTINUATION_PLAN.md`
- `LOW_END_SMOOTHNESS_PLAN.md`
- `SCROLL_LAG_MASTER_TASKS.md`
- `VISUAL_OVERRIDE_RISK_MAP.md`

## 1. Definition Of “100% Completed”

The work is only complete when all of these are true:

1. Color & Motion Studio works correctly on every route that exposes it.
2. Theme, palette, transparency, color fade, and background animation settings persist and do not get overridden by old code.
3. Scrolling feels smoother on the whole website, not only on one or two pages.
4. Heavy pages are materially improved:
   - `lms.html`
   - `social.html`
   - `admin-tools.html`
   - `admin-orders.html`
   - `index.html`
5. Performance work does not visibly degrade the current design.
6. The biggest old/new override risks are removed or neutralized.
7. The website is reasonably usable on weaker hardware.
8. Before/after verification exists for the important changes.

If any one of those is not true, the job is not fully completed.

## 2. Non-Negotiable Rules

These rules apply to every task below:

1. Keep the same visuals for users unless a task explicitly says otherwise.
2. Do not optimize only one page and call it done.
3. Do not trust one passing smoke test as proof for all routes.
4. Always check override risk after changing shared visual logic.
5. Prefer internal performance tricks over visible simplification.

## 3. Completion Order

Do the work in this order:

1. Stabilize shared visual state and remove override risk
2. Finish shared shell/runtime performance work
3. Fix scroll lag across heavy routes
4. Fix page-load weight on the heaviest pages
5. Verify all pages and all visual controls
6. Produce final measured before/after summary

## 4. Master Task List

### Phase A. Shared Visual Correctness

#### Task A1
Name:
- Finish eliminating old/new visual state conflicts

Estimated completion:
- about `70%` done

Why:
- if old and new visual pipelines still fight, future work will keep breaking

Files to inspect:
- `assets/js/features/index-luxury.js`
- `assets/js/shared/utilities.js`
- `assets/js/theme-primer.js`
- `assets/js/features/luxury-shell-chrome.js`
- `admin-orders.html`
- `assets/js/pages/admin-orders.js`

What to do:
- map every place that can set:
  - theme mode
  - palette
  - transparency
  - background mode
  - background animation state
  - shell tint variables
- ensure one real source of truth is used
- keep compatibility paths as wrappers only

Definition of done:
- no visual setting can be changed in one route and silently overridden by another active path

#### Task A2
Name:
- Verify Color & Motion Studio on all real entry paths

Estimated completion:
- about `75%` done

Why:
- the studio is not only opened from one shell button

Test entry paths:
- shared shell on `index.html`
- `admin-orders.html`
- mobile shell entry points

What to verify:
- palette change
- light/dark mode
- transparency
- color fade behavior
- background mode
- background animation on/off
- glow strength

Definition of done:
- every studio entry path changes the same underlying state and gives the same visible result

### Phase B. Shared Runtime Performance

#### Task B1
Name:
- Finish optimizing `updateTransparency()`

Estimated completion:
- about `35%` done

Why:
- it is one of the biggest shared runtime hotspots

Files:
- `assets/js/shared/utilities.js`

What to do:
- reduce repeated selector work
- reduce duplicate inline style writes
- build a real surface registry if current caching is still not enough
- avoid full-page rescans when only specific roots changed
- avoid recalculating the same background strings repeatedly

Definition of done:
- moving transparency no longer causes large style/paint spikes on heavy pages

Subtasks:
1. `B1.1` Cache all shared selector strings and joined selector lists.
Task goal:
- stop rebuilding large selector strings on every transparency pass.
2. `B1.2` Cache the current active surface set per page/root signature.
Task goal:
- stop rescanning the same DOM when page roots did not change.
3. `B1.3` Build a real transparency surface registry.
Task goal:
- move from repeated query-based discovery toward tracked surfaces.
4. `B1.4` Reduce duplicate inline style writes.
Task goal:
- skip writing the same `background` / `backdrop-filter` values repeatedly.
5. `B1.5` Cache expensive generated background strings.
Task goal:
- avoid rebuilding the same gradient strings for the same visual signature.
6. `B1.6` Re-measure transparency drag on home, admin-orders, LMS, and social.
Task goal:
- confirm the optimizations help real heavy routes, not only one page.

#### Task B2
Name:
- Split full shell refresh from visual-only refresh everywhere appropriate

Estimated completion:
- about `30%` done

Why:
- broad refreshes cause extra work during simple visual changes

Files:
- `assets/js/features/index-luxury.js`
- `assets/js/features/luxury-shell-chrome.js`
- `assets/js/shared/utilities.js`

What to do:
- audit all `syncAll()` callers
- replace them with narrower refreshes where possible
- ensure nav/layout refresh only happens when nav/layout really changed

Definition of done:
- visual changes do not rebuild unrelated shell/UI parts

Subtasks:
1. `B2.1` Inventory every `syncAll()` caller.
Task goal:
- know exactly which interactions still trigger full shell refresh.
2. `B2.2` Classify each caller.
Task goal:
- mark each one as `must stay full`, `can narrow`, or `suspicious`.
3. `B2.3` Introduce and document targeted refresh functions.
Task goal:
- have stable, named alternatives such as:
  - visual-only refresh
  - nav-only refresh
  - studio-only refresh
  - transparency-only refresh
4. `B2.4` Replace studio-triggered full shell refreshes.
Task goal:
- palette/theme/glow/background interactions should not rebuild nav/layout unnecessarily.
5. `B2.5` Replace compatibility-wrapper full shell refreshes.
Task goal:
- old utility entry points should use the same narrowed path.
6. `B2.6` Verify no route loses correctness after narrowing.
Task goal:
- avoid subtle regressions where fewer refreshes leave stale UI.

#### Task B3
Name:
- Audit all observers and deferred refresh loops

Estimated completion:
- about `10%` done

Why:
- mutation observers and queued refreshes can create constant background work

Files:
- `assets/js/shared/utilities.js`
- `assets/js/features/index-luxury.js`
- route-specific heavy page runtimes

What to do:
- list each observer
- identify what it watches
- decide whether it is too broad
- reduce watched scope or debounce better where possible

Definition of done:
- no observer causes avoidable repeated work during normal scrolling/use

Subtasks:
1. `B3.1` List every `MutationObserver`.
2. `B3.2` List every deferred refresh queue:
   - `requestAnimationFrame`
   - `setTimeout`
   - `requestIdleCallback`
3. `B3.3` Identify which observers are global and which are route-local.
4. `B3.4` Reduce watched subtree/attribute scope where safe.
5. `B3.5` Eliminate feedback-loop patterns.
6. `B3.6` Re-profile scrolling after observer cleanup.

### Phase C. Scroll Performance Across All Pages

#### Task C1
Name:
- Create one repeatable scroll benchmark for every required heavy page

Estimated completion:
- about `10%` done

Why:
- “feels laggy” must be turned into repeatable testing

Pages:
- `index.html`
- `admin-orders.html`
- `admin-tools.html`
- `lms.html`
- `social.html`
- `registration.html`
- `student-service.html`
- `timetable.html`
- `news.html`
- `career-market.html`

What to record:
- FPS feel
- input delay
- style recalculation spikes
- paint/composite spikes
- obvious long tasks

Definition of done:
- every heavy page has a standard scroll test path

Subtasks:
1. `C1.1` Define one seeded auth/user state per page family.
2. `C1.2` Define one viewport set:
   - desktop
   - tablet
   - mobile
3. `C1.3` Define the exact scroll path for each heavy page.
4. `C1.4` Decide what “lag” means numerically for this project.
5. `C1.5` Save the benchmark method into a reusable tool or script.

#### Task C2
Name:
- Reduce offscreen rendering cost for repeated cards/items

Estimated completion:
- about `25%` done

Why:
- long pages with many repeated boxes are expensive while scrolling

Files:
- `assets/css/index-luxury.css`
- route CSS files

What to do:
- safely expand `content-visibility` / `contain` where it helps
- verify no visual pop-in, broken measurement, or broken sticky behavior

Definition of done:
- offscreen repeated cards/items cost less while in-view visuals stay the same

Subtasks:
1. `C2.1` Inventory repeated card/list item selectors by route.
2. `C2.2` Apply safe `content-visibility` to the most repeated item types.
3. `C2.3` Add `contain-intrinsic-size` values that prevent layout jumps.
4. `C2.4` Verify no broken sticky/fixed interactions.
5. `C2.5` Verify no visible pop-in during normal scrolling.

#### Task C3
Name:
- Reduce blur/gradient/shadow cost on shared surfaces without visible downgrade

Estimated completion:
- about `10%` done

Why:
- these are major GPU/paint costs during scrolling

Files:
- `assets/css/index-luxury.css`
- `assets/css/index-home-dashboard.css`
- route CSS files

What to do:
- find duplicated gradient layers
- reduce internal complexity while matching the same final look
- keep visible design but simplify implementation

Definition of done:
- shared cards/shell feel smoother during scroll while looking materially the same

Subtasks:
1. `C3.1` Inventory the top 20 most expensive shared surface recipes.
2. `C3.2` Remove duplicate gradient layers that visually do the same job.
3. `C3.3` Normalize box-shadow stacks across shell/card surfaces.
4. `C3.4` Reduce unnecessary compositing triggers.
5. `C3.5` Capture before/after screenshots and reject visible regressions.

#### Task C4
Name:
- Measure and optimize background runtime cost

Estimated completion:
- about `20%` done

Why:
- home background animation and overlays can still hurt scroll smoothness

Files:
- `assets/js/features/index-luxury.js`
- home runtime bundle path
- `assets/css/index-luxury.css`

What to do:
- measure animation cost on and off
- verify whether hidden/deactivated animation still consumes runtime
- add a true low-cost runtime path if needed

Definition of done:
- background animation state no longer causes unnecessary cost during normal use

Subtasks:
1. `C4.1` Measure CPU cost of background `On` vs `Off`.
2. `C4.2` Confirm whether hidden canvas still incurs runtime cost.
3. `C4.3` Add a true paused runtime path if needed.
4. `C4.4` Reduce scene complexity by performance tier if needed.
5. `C4.5` Verify the current on/off control still preserves visuals and state.

### Phase D. Heavy Page Route Work

#### Task D1
Name:
- Optimize `lms.html`

Estimated completion:
- about `5%` done

Why:
- one of the heaviest routes in both load and runtime cost

Files:
- `lms.html`
- `assets/js/pages/lms.js`
- related LMS runtime files

What to do:
- reduce always-rendered hidden sections
- lazy-render deeper panels where safe
- minimize card/surface cost below the fold

Definition of done:
- LMS scroll and interaction are materially smoother

Subtasks:
1. `D1.1` Profile LMS DOM size and repeated panel count.
2. `D1.2` Identify hidden sections rendered at startup.
3. `D1.3` Move non-visible LMS sections to lazy render where safe.
4. `D1.4` Reduce repeated card/surface cost in scrolling regions.
5. `D1.5` Re-test scroll and first interaction on LMS.

#### Task D2
Name:
- Optimize `social.html`

Estimated completion:
- about `5%` done

Why:
- large feed, many cards, many panels, many states

Files:
- `assets/js/pages/social-page.js`
- `assets/css/social-rebuild.css`

What to do:
- reduce offscreen feed/item cost
- reduce DOM churn across panels
- ensure hidden sections do not remain fully expensive

Definition of done:
- social feed and panel switching feel smoother

Subtasks:
1. `D2.1` Profile social feed DOM growth and panel DOM cost.
2. `D2.2` Reduce offscreen feed item cost.
3. `D2.3` Reduce hidden panel cost for inbox/community/events.
4. `D2.4` Reduce repeated card styling overhead in the social feed.
5. `D2.5` Re-test scroll on long social feeds.

#### Task D3
Name:
- Optimize `admin-tools.html`

Estimated completion:
- about `5%` done

Why:
- dense admin UI and many large sections

Files:
- `assets/js/features/index-admin-tools.js`
- `assets/css/admin-tools-luxury.css`

What to do:
- reduce always-live section cost
- defer heavy inactive panels
- reduce expensive surface behavior where safe

Definition of done:
- admin tools no longer feels heavy while scrolling and switching

Subtasks:
1. `D3.1` Map heavy admin panels and inactive sections.
2. `D3.2` Delay non-active admin panel rendering.
3. `D3.3` Reduce large surface styling cost in admin tools.
4. `D3.4` Re-test switching and scrolling through long admin sections.

#### Task D4
Name:
- Optimize `admin-orders.html`

Estimated completion:
- about `35%` done

Why:
- still has compatibility/studio risk plus dense list/detail UI

Files:
- `admin-orders.html`
- `assets/js/pages/admin-orders.js`

What to do:
- make sure old embedded studio path stays thin
- reduce list/detail offscreen cost
- verify route remains aligned with shared shell behavior

Definition of done:
- admin-orders is no longer a compatibility hotspot

Subtasks:
1. `D4.1` Verify old embedded studio path stays thin.
2. `D4.2` Reduce list/detail offscreen rendering cost.
3. `D4.3` Reduce duplicate shell + route cost if both are active.
4. `D4.4` Re-test both shared-studio and route-embedded behavior.

#### Task D5
Name:
- Optimize remaining medium/heavy pages

Estimated completion:
- about `0%` done

Pages:
- `registration.html`
- `student-service.html`
- `timetable.html`
- `news.html`
- `career-market.html`

What to do:
- repeat the same process used on the heaviest routes
- focus on scroll-heavy surfaces and hidden content

Definition of done:
- none of these pages remain obvious lag outliers

Subtasks:
1. `D5.1` `registration.html`
2. `D5.2` `student-service.html`
3. `D5.3` `timetable.html`
4. `D5.4` `news.html`
5. `D5.5` `career-market.html`

Task goal for each:
- profile scroll cost
- reduce offscreen rendering waste
- reduce repeated surface styling cost
- verify same visuals

### Phase E. Page-Load Optimization

#### Task E1
Name:
- Continue load-weight reduction from the earlier plan

Estimated completion:
- about `20%` done

Files:
- see `PAGE_LOAD_FIX_TASKS.md`

What to do:
- continue shared CSS/JS splitting
- remove unnecessary upfront runtime from non-home pages
- reduce first-load cost on the heaviest routes

Definition of done:
- the heaviest pages are no longer extreme first-load outliers

Subtasks:
1. `E1.1` Split shared shell CSS further.
2. `E1.2` Continue splitting shared JS bootstrap.
3. `E1.3` Remove home-only code from non-home pages.
4. `E1.4` Reduce heaviest page-specific bundles.
5. `E1.5` Re-run all-pages load scan after each batch.

### Phase F. Verification And Final Signoff

#### Task F1
Name:
- Build final before/after evidence

Estimated completion:
- about `5%` done

What to record:
- before/after screenshots
- before/after page-load scan
- before/after runtime-shell results
- before/after scroll traces for heavy pages

Definition of done:
- there is clear evidence the site is both correct and smoother

Subtasks:
1. `F1.1` Capture before/after screenshots.
2. `F1.2` Capture before/after load-scan deltas.
3. `F1.3` Capture before/after runtime-shell results.
4. `F1.4` Capture before/after scroll traces on required heavy pages.

#### Task F2
Name:
- Verify no override-risk path breaks the final result

Estimated completion:
- about `40%` done

Use:
- `VISUAL_OVERRIDE_RISK_MAP.md`

What to check:
- shared shell path
- admin-orders compatibility path
- mobile entry paths
- CSS override layers
- early boot primer

Definition of done:
- the final fixes survive all known override paths

Subtasks:
1. `F2.1` Shared shell path check.
2. `F2.2` Admin-orders compatibility path check.
3. `F2.3` Mobile studio entry path check.
4. `F2.4` CSS override layer check.
5. `F2.5` Early boot primer check.

## 5. Completion Checklist

The work is only fully done when all of these are true:

- palette, theme, transparency, fade, background mode, glow, and animation settings work everywhere
- early boot does not override final runtime state
- shared shell changes do not get overwritten by old route-specific paths
- scrolling is materially smoother on all required heavy pages
- all required pages are validated, not only one or two
- no visible design regression is introduced
- low-end hardware experience is improved as much as practical
- final evidence exists in commands, screenshots, and runtime traces

## 6. Best Next Task To Execute

If continuing immediately:

1. finish `Task B1`
2. finish `Task B2`
3. run `Task C1`
4. then move into `Task D1` and `Task D2`

That is the best path to real whole-site improvement, not local patchwork.
