# Protected Launch Optimization Tracker

Target page: `protected-launch.html`
Last updated: `2026-05-15`
Owner: `Codex`
Goal: keep the protected launch popup fully standalone while documenting its ownership boundary with `lms.html` and `exam-portal.html`, reducing decorative motion cost on weaker hardware, and preventing shared-shell drift.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `protected-launch.html` | `31,008 bytes` after the reduced-performance guard pass |
| External scripts | `1` | Only `assets/js/app/api.js` is loaded by the page |
| External stylesheets | `2` | Font Awesome plus `kiu-fonts.css` |
| Inline scripts | `2` | One head-mode detector plus the local handoff controller |
| Shared shell script imports | `0` | Source scan shows no `theme-primer.js`, `app.js`, `auth.js`, `state.js`, `utilities.js`, `navigation.js`, or `index-luxury.js` imports |
| Reduced-performance markers | `9` | Source scan shows `launchPerformance`, `prefers-reduced-motion`, `deviceMemory`, and `hardwareConcurrency` checks/selectors |
| Route-specific tracker | Present | This file is now the dedicated protected-launch tracker |
| Dedicated route test coverage | Present but minimal | `test/protected-launch-route-regressions.test.js` now covers the standalone contract and reduced-performance guard |

## Current Findings

1. `protected-launch.html` remains a standalone popup and only loads `assets/js/app/api.js`; it still does not boot the shared luxury shell.
2. Source-backed ownership split:
   Inference from sources: the page should remain a separate secure-exam mini shell rather than merge into `exam-portal.html`, because `assets/js/pages/lms.js` opens it as a popup for desktop anti-cheat handoff, while `exam-portal.html` is the student-facing anti-cheat browser surface after launch.
3. The page now has an explicit reduced-performance mode that activates for `prefers-reduced-motion`, low `hardwareConcurrency`, or low `deviceMemory`, and that mode removes the animated progress pulse plus the heavier layered gradients and hover motion.
4. Desktop and mobile/reduced-mode launch QA now exists as real artifact output, so no protected-launch-specific tasks remain open.

## AI Update Rules

1. Update this file in the same turn as every change to `protected-launch.html`.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the secure popup behavior and standalone ownership unless a task explicitly changes it.
6. If a task is blocked by anti-cheat or browser restrictions, mark it `Blocked` and explain why.
7. `% left` scale:
   `0%` = done
   `1-15%` = almost done
   `16-60%` = partly done
   `61-99%` = mostly not done
   `100%` = untouched

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| PLAUNCH-01 | Done | 0% | Decide whether `protected-launch.html` should stay separate from `exam-portal.html` or share one secure exam launch shell | Inference from sources: keep it as a separate standalone secure-exam mini shell shared conceptually by LMS and exam flows, not merged into the exam-portal UI. |
| PLAUNCH-02 | Done | 0% | Extract repeated styling tokens so the launch page does not duplicate exam palette and typography rules | The local style layer now routes the major gradients, fills, transitions, and action surfaces through explicit `--launch-*` tokens instead of repeating raw values throughout the sheet. |
| PLAUNCH-03 | Done | 0% | Audit whether the animated progress indicator is necessary on weak devices or should respect reduced motion | The page now disables the pulse animation and hover motion for reduced-performance mode and `prefers-reduced-motion`. |
| PLAUNCH-04 | Done | 0% | Keep the page fully standalone and ensure it never starts loading the shared shell by accident | Source scan plus regression coverage now prove the page only loads `assets/js/app/api.js` and no shared-shell scripts. |
| PLAUNCH-05 | Done | 0% | Add a tiny route tracker if this page remains part of the live protected exam flow | This file is the dedicated tracker. |
| PLAUNCH-06 | Done | 0% | Add weak-laptop and mobile checks for launch page first paint and redirect/open latency | See the desktop/mobile artifact evidence below. |
| PLAUNCH-07 | Done | 0% | Record exactly which styles and copy blocks are duplicated with `exam-portal.html` | See `Exam Portal Duplication Map` below. |
| PLAUNCH-08 | Done | 0% | Replace any unnecessary animated or blurred decorative layers with cheaper equivalents when reduced-motion or weak-device mode is active | Reduced-performance mode now flattens the body/head gradients, weakens shadow cost, removes hover transforms, and stops the progress animation. |

## Exam Portal Duplication Map

| Surface | Protected launch evidence | Exam portal evidence | Note |
| --- | --- | --- | --- |
| Exact repeated phrase fragment | `Protected Quiz` | `Protected Quiz` | Exact repeated protected-exam label. |
| Exact repeated phrase fragment | `anti-cheat` | `anti-cheat` | Exact repeated security-context label. |
| Handoff / browser gating copy | `hands the protected quiz off to the desktop browser` and `The desktop app will take over this protected quiz launch.` | `Open this page in KIU Anti-Cheat Browser` and `protected attempts are only available inside the anti-cheat environment.` | Same launch/gating concept, but not verbatim duplicate copy blocks. |
| Accent family | Gold accent via `--accent` / `--warn` and launch gradients | Blue + gold exam palette via `--exam-accent` / `--exam-gold` | Shared protected-exam tone, but not literal shared tokens yet. |
| Typography pattern | `Playfair Display` headline with `Inter` body | `Fraunces` headline with `Manrope` body | Same serif-headline / sans-body intent, not the same font family pair. |
| Layered background treatment | `--launch-body-bg` and `--launch-head-bg` | `--exam-bg` plus hero gradients | Shared layered-gradient visual direction, not the same token names. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-15` | `protected-launch.html`, `test/protected-launch-route-regressions.test.js`, `docs/PROTECTED_LAUNCH_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PLAUNCH-01`, `PLAUNCH-02`, `PLAUNCH-03`, `PLAUNCH-04`, `PLAUNCH-05`, `PLAUNCH-07`, `PLAUNCH-08` | Added a standalone reduced-performance mode in the head, extracted the major gradient/fill/transition surfaces into explicit `--launch-*` tokens, kept the page on `assets/js/app/api.js` only, added `test/protected-launch-route-regressions.test.js`, and verified the result with `npx vitest run test/protected-launch-route-regressions.test.js`; direct source metrics now show `31,008` bytes, `1` external script, `2` external stylesheets, `2` inline scripts, `0` shared-shell script imports, and `9` reduced-performance markers. |
| `2026-05-15` | `artifacts/protected-launch-efficient-desktop-summary.json`, `artifacts/protected-launch-mobile-summary.json`, `docs/PROTECTED_LAUNCH_OPTIMIZATION_TRACKER.md`, `docs/ALL_PAGES_CLEANUP_MASTER_AUDIT.md` | `PLAUNCH-06` | Captured real Playwright verification against `http://127.0.0.1:8899/protected-launch.html?mode=open-app...` with a stubbed anti-cheat bridge: the efficient-desktop artifact reports `firstReadyMs: 1381`, `handoffMs: 1388`, `launchPerformance: standard`, `statusTitle: Anti-Cheat App Opened`, and `closeIntercepted: true`; the mobile artifact reports `firstReadyMs: 1314`, `handoffMs: 1321`, `launchPerformance: reduced`, `statusTitle: Anti-Cheat App Opened`, and `closeIntercepted: true`; both runs completed with zero recorded errors. |

## Next Safe Pass

No protected-launch-specific work remains open. If future secure-exam UX changes touch this popup, preserve the standalone contract and keep any new heavy UI behind the existing reduced-performance guard.
