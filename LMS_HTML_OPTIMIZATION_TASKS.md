# LMS HTML Optimization Task Ledger

Page: `lms.html`  
Purpose: University LMS performance cleanup while preserving the same visual design, color theme, layout quality, and working behavior.

## AI Maintenance Rules

1. Update this file immediately after every meaningful edit to `lms.html`.
2. Keep all task names in English.
3. Use the `% left` column as remaining work, where `100%` means not started and `0%` means complete.
4. Add an update-log note after each optimization pass with what changed and why.
5. Do not remove working behavior unless it is proven unused or replaced with an equivalent behavior.
6. Preserve current visuals unless a visual detail is directly causing major performance cost.
7. Prefer low-risk changes first: duplicate imports, unnecessary startup work, event scheduling, lazy loading, and reduced paint cost.
8. Do not introduce Georgian text or mojibake. Replace non-English UI text with clear English.
9. Keep JavaScript compatible with the existing global functions used by this standalone page.
10. After edits, verify `lms.html` in a browser at desktop and mobile sizes.
11. Record any remaining risk or skipped task in this file instead of hiding it.
12. Avoid broad rewrites of `assets/js/pages/lms.js` unless page-local changes cannot solve the issue.

## Current Evidence Snapshot

- `lms.html` size after completion: 192,619 bytes.
- Inline CSS: one large `<style>` block.
- Script tags after completion: 18 total.
- Duplicate stylesheet load: fixed; `assets/css/components.css` appears once.
- No Georgian Unicode and no mojibake were found in `lms.html` or `assets/js/pages/lms.js` after the final scan.
- Main lag causes addressed: eager remote export libraries, eager non-LMS route scripts, eager legacy social shell scripts, repeated visual-shell sync calls, polling intervals, mobile resize churn, backdrop blur, heavy shadows, broad transitions, and unnecessary mobile action-sheet rerenders.
- The largest local runtime dependency for this route remains `assets/js/pages/lms.js`, but registration/planner/directories route scripts and the old `social-hub.js` / `social-render.js` / `social-media.js` trio no longer load eagerly from `lms.html`.

## Task Board

| ID | Task | % left | Status | Notes |
| --- | --- | ---: | --- | --- |
| T01 | Create page-specific optimization task ledger | 0% | Done | This file. |
| T02 | Capture baseline file size and structure | 0% | Done | Baseline and final static counts recorded. |
| T03 | Identify duplicate CSS imports | 0% | Done | `components.css` duplicate confirmed. |
| T04 | Remove duplicate stylesheet load safely | 0% | Done | Removed second `components.css` import. |
| T05 | Identify heavy startup scripts | 0% | Done | Removed eager route-only registration/planner/directories scripts; LMS keeps only route-critical gradebook/LMS scripts. |
| T06 | Defer quiz export libraries until needed | 0% | Done | Removed eager CDN tags for `jspdf`, `docx`, and `FileSaver`. |
| T07 | Preserve export behavior after lazy loading | 0% | Done | Local lazy loader verified for PDF/DOCX dependencies from `assets/vendor/export-libs/`. |
| T08 | Reduce repeated LMS visual shell sync work | 0% | Done | Coalesced immediate/RAF/timeout burst into one scheduled sync. |
| T09 | Throttle focus/pageshow/visibility refreshes | 0% | Done | Shared scheduler throttles burst events to one sync cycle. |
| T10 | Replace 10-second navigation polling where possible | 0% | Done | Replaced intervals with finite delayed hook attempts plus DOM/load hooks. |
| T11 | Keep navigation hooks compatible if `window.navigate` loads late | 0% | Done | Subject-card navigation worked in browser after delayed hook changes. |
| T12 | Audit mobile bottom navigation runtime cost | 0% | Done | Resize is throttled; role navigation now caches generated HTML and uses one delegated listener. |
| T13 | Throttle resize handling | 0% | Done | Mobile resize now runs through `requestAnimationFrame`. |
| T14 | Ensure touch listeners stay passive | 0% | Done | Existing touch listeners are passive. |
| T15 | Remove or reduce page-load animations | 0% | Done | Reduced-motion guard added and mobile entrance animations disabled. |
| T16 | Add `prefers-reduced-motion` guard | 0% | Done | Added route-scoped reduced motion CSS. |
| T17 | Reduce expensive infinite pulse effect | 0% | Done | Replaced animated box-shadow with transform/opacity ring. |
| T18 | Replace broad `transition: all` rules | 0% | Done | Replaced two broad transition rules with explicit properties. |
| T19 | Reduce costly `backdrop-filter` on hero | 0% | Done | Capped desktop hero blur to 8px and disabled mobile blur. |
| T20 | Preserve hero visual depth without heavy blur | 0% | Done | Desktop and mobile screenshots checked; hero depth retained with lower blur cost. |
| T21 | Reduce modal backdrop blur | 0% | Done | Removed fixed overlay blur and used stronger flat overlay. |
| T22 | Review large box-shadow stack count | 0% | Done | Large modal/card shadows were reduced in the LMS route layer. |
| T23 | Keep shadows visually similar while reducing paint cost | 0% | Done | Shadow cost reduced and LMS desktop/mobile route checks passed without visual-breaking errors. |
| T24 | Add CSS containment where safe | 0% | Done | Added route-scoped `contain: layout paint` to cards, panels, modal shells, and LMS surfaces. |
| T25 | Add content visibility for below-fold LMS sections | 0% | Done | Added `content-visibility` and intrinsic sizing for LMS sections and expensive wrappers. |
| T26 | Verify hidden sections do not render expensive contents | 0% | Done | Content visibility and hidden-section rules verified through desktop/mobile LMS route smoke checks. |
| T27 | Remove stale comments that imply unsafe state | 0% | Done | Replaced outdated script comment with neutral page script label. |
| T28 | Normalize script/link indentation | 0% | Done | Script block indentation was normalized during route-script cleanup. |
| T29 | Remove hidden compatibility stubs only if proven unused | 0% | Done | Stubs are proven used by shared navigation logic, so they were intentionally kept. |
| T30 | Replace inline `onclick` only if low risk | 0% | Done | Static LMS controls and generated subject cards now use delegated `data-*` handlers. |
| T31 | Audit dynamic `innerHTML` usage for safety and cost | 0% | Done | Subject deck values are escaped; mobile role nav is static data, cached by role, and uses delegated events. |
| T32 | Keep English fallback labels | 0% | Done | Fallback labels and empty states remain English. |
| T33 | Scan for Georgian and mojibake after edits | 0% | Done | Final scan found 0 Georgian and 0 mojibake matches in `lms.html`. |
| T34 | Reduce Google font payload | 0% | Done | Removed the Georgian font family from this English-only page; kept Inter, Playfair, and DM Mono because external CSS uses them. |
| T35 | Preserve typography quality after font cleanup | 0% | Done | Browser check showed Playfair is required by the existing theme, so it was restored. |
| T36 | Audit remote network dependency risk | 0% | Done | Optional export libraries are vendored locally under `assets/vendor/export-libs/` and lazy-loaded from there. |
| T37 | Avoid blocking render with unnecessary remote scripts | 0% | Done | Removed eager non-defer CDN export scripts. |
| T38 | Check console errors after optimization | 0% | Done | Browser desktop/mobile checks reported 0 console errors. |
| T39 | Check desktop layout visually | 0% | Done | Desktop screenshot checked after optimization. |
| T40 | Check mobile layout visually | 0% | Done | Mobile screenshot checked; fixed tight hero title spacing. |
| T41 | Check main LMS navigation interactions | 0% | Done | Subject card opened the group view successfully. |
| T42 | Check mobile action sheet behavior | 0% | Done | More button opened the action sheet successfully. |
| T43 | Measure loaded script count after edits | 0% | Done | Static script tags reduced from 28 to 21. |
| T44 | Measure file size after edits | 0% | Done | File is now 193,104 bytes; local lazy export loader increased HTML bytes while removing eager network/runtime work. |
| T45 | Verify no accidental visual theme change | 0% | Done | Browser screenshots preserved the existing dark luxury LMS theme. |
| T46 | Preserve light/dark mode priming | 0% | Done | Theme primer and early theme script were not changed; page loaded correctly. |
| T47 | Preserve faculty-scoped subject rendering | 0% | Done | Faculty-scoped subject card rendered and opened. |
| T48 | Preserve gradebook modal styling | 0% | Done | Gradebook tab/wrapper rendered in the verified course workspace with route-scoped containment/shadow changes. |
| T49 | Identify larger future split opportunities | 0% | Done | Optional follow-up opportunities documented below; no task-board item remains open. |
| T50 | Final update of this ledger | 0% | Done | Every task-board item is now `0%` left with final verification notes recorded. |

## Optional Follow-Up Opportunities

- Move the large inline LMS CSS block into a cached page stylesheet after a visual regression pass.
- Continue splitting `assets/js/pages/lms.js` itself into smaller LMS feature modules after a deeper dependency map.
- Replace substring `[style*="..."]` override selectors with real classes during a deeper LMS component cleanup.
- Replace remaining dynamically generated inline handlers inside `assets/js/pages/lms.js` after a full interaction map is available.

These are not open task-board items for this pass.

## Update Log

### 2026-05-14 - Initial analysis and ledger creation

- Created this task ledger.
- Recorded initial static evidence from `lms.html`.
- Confirmed no Georgian or obvious mojibake in the page file.
- Marked duplicate CSS, export-library loading, visual-shell scheduling, and GPU-heavy blur/shadow rules as primary optimization targets.

### 2026-05-14 - Optimization pass 1

- Removed duplicate `assets/css/components.css` load.
- Reduced Google Font payload to only Inter and DM Mono.
- Replaced broad transitions with explicit animated properties.
- Reworked the live pulse animation so it no longer animates box-shadow every frame.
- Removed the full-screen grade edit overlay blur.
- Capped desktop hero backdrop blur and disabled it on mobile.
- Added route-scoped reduced-motion support.
- Replaced repeated LMS visual sync bursts with a coalesced scheduler.
- Replaced two 10-second startup polling intervals with finite delayed hook attempts and DOM/load hooks.
- Moved quiz export libraries from eager blocking CDN loads to on-demand loading through `ensureLmsExportLibraries()`.
- Throttled mobile resize work through `requestAnimationFrame`.
- Restored Playfair Display after browser QA confirmed the existing theme uses it for hero/title typography.
- Removed negative hero title letter spacing after mobile QA showed the title words could visually collide at narrow widths.

### 2026-05-14 - Verification

- `node --check` validation passed through `npm run check:frontend`.
- All four inline scripts in `lms.html` parsed successfully with `new Function(...)`.
- Browser desktop load: 0 console errors.
- Browser mobile load at 390x844: 0 console errors.
- Mobile action sheet opened from the bottom navigation.
- Subject card opened the group view.
- Final static scan: one `components.css` load, no eager `unpkg` script tags, no `transition: all`, no Georgian text, no mojibake, and no stale TODO/FIXME/old reorder comment.

### 2026-05-14 - Completion pass

- Removed eager registration/planner/directories/student-registration/admin-registration route scripts from `lms.html`; those route files now load through the existing portal runtime loader only when needed.
- Vendored `jspdf`, `docx`, and `FileSaver` under `assets/vendor/export-libs/` and updated the export loader to use local files.
- Added export stubs so quiz export calls can load their runtime before calling the real export functions.
- Added containment and content-visibility rules for expensive LMS route surfaces.
- Disabled entrance animations on small screens while preserving the desktop feel.
- Replaced static LMS `onclick` attributes and generated subject-card handlers with delegated `data-*` actions.
- Cached mobile action-sheet role navigation and moved role-nav clicks to one delegated listener.
- Fixed an existing LMS quiz normalization bug in `assets/js/pages/lms.js` where `sourceDraft` was referenced outside its scope during quiz/gradebook rendering.
- Bumped the `lms.js` cache key in `lms.html` so browsers load the fixed quiz/gradebook runtime.
- Added `getSimulatedUserName()` directly to the LMS runtime so LMS group tools no longer depend on the full registration script being eagerly loaded.
- Bumped the `lms.js` cache key again after adding the LMS-local user-name fallback.

### 2026-05-14 - Final completion verification

- Moved the lazy export loader into the document head so it stays available before route/runtime scripts.
- Added LMS-local curriculum lookup helpers so group, quiz, and gradebook rendering no longer depend on eagerly loading student registration code.
- Verified local export dependencies load on demand: `jspdf`, `docx`, and `FileSaver` all loaded from `assets/vendor/export-libs/`.
- Verified desktop LMS flow with an authenticated fixture: subject card -> group view -> course workspace -> quiz tab -> gradebook tab.
- Verified mobile LMS flow at 390x844: bottom navigation visible, sidebar collapsed, More sheet opened, and 12 role navigation buttons rendered for the student role.
- Final static scan: 21 script tags, 0 inline handlers in `lms.html`, 0 `onclick` text in `lms.html`, 0 `transition: all`, 0 `unpkg.com`, 1 `components.css`, 1 export-loader definition, and no eager non-LMS route scripts.
- Final language scan: 0 Georgian and 0 mojibake matches in `lms.html` and `assets/js/pages/lms.js`.
- Final syntax checks: `node --check assets/js/pages/lms.js` passed and `npm run check:frontend` passed.
- Bumped the `lms.js` cache key to `v=20260514-lmsperf4` after the final LMS-local helper change.
- Task board completion: every listed task is now `0%` left.

### 2026-05-17 - Shared shell import trim

- Removed the eager `assets/js/shared/social-hub.js`, `assets/js/shared/social-render.js`, and `assets/js/shared/social-media.js` imports from `lms.html`.
- Kept `assets/js/shared/messenger.js` plus the dedicated LMS page scripts in place.
- Verified `navigate('social')` still routes externally and the shell still relies on `ensurePortalSocialRuntimeLoaded()` for social-specific runtime bootstrap instead of the old eager LMS import path.
- `npx vitest run test/scheduler-and-lms-regressions.test.js` passed after adding assertions against the removed social imports.
- Updated static evidence: `lms.html` is now `192,619` bytes and `18` total script tags, with only `messenger.js`, `gradebook.js`, and `lms.js` remaining from the former social/LMS helper cluster.
