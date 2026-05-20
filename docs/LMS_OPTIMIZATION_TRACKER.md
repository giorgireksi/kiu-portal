Target page: `lms.html`
Last updated: `2026-05-18`
Owner: `Codex`
Goal: keep the standalone LMS shell functional while reducing root-entry markup debt and preserving the current delegated route/runtime ownership.

## Baseline

| Metric | Value | Evidence |
| --- | --- | --- |
| Entry HTML | `lms.html` | `192,762 bytes` after the root-entry shell cleanup |
| External scripts | `14` | Direct script inventory from `lms.html` |
| Inline handlers | `0` | Source scan after the shell cleanup |
| Shared messenger shell import | Kept | `scheduler-and-lms-regressions.test.js` still proves the LMS shell loads `assets/js/shared/messenger.js` intentionally |
| Root-entry validator state | `0` issues | Focused `html-validate lms.html` after the shell cleanup |
| Focused regression coverage | `4/4` tests passed | `npx vitest run test/lms-route-regressions.test.js test/scheduler-and-lms-regressions.test.js` |

## Current Findings

1. `lms.html` remains a large standalone route shell, but its current root-entry validator debt is now cleared.
2. The hidden navigation stubs now carry unique labels, the class-type section switch now exposes a valid grouped accessible name, and the gradebook-wrapper visibility now lives on a route-owned class instead of an inline style.
3. The mobile action-sheet buttons now use explicit button types plus `<span class="mob-sheet-icon">` wrappers and the shared icon-variant classes instead of invalid nested `<div>` children with inline gradients.
4. The LMS shell still intentionally keeps `messenger.js` and the large route runtime stack; this tracker only records the root-entry markup hardening batch, not a broader runtime split.

## AI Update Rules

1. Update this file in the same turn as every change to `lms.html` that affects the standalone shell contract.
2. Update `% left` immediately for every touched task.
3. Add one `Change Log` row per edit batch with files touched, task IDs touched, and verification used.
4. Do not mark a task done without direct code inspection or targeted test output.
5. Preserve the current LMS route structure and delegated action model unless a task explicitly changes them.

## Task Board

| ID | Status | % left | Task | Notes |
| --- | --- | ---: | --- | --- |
| LMS-01 | Done | 0% | Remove the remaining root-entry validator faults from `lms.html` | The shell landmarks, grouped class-type switch, gradebook wrapper shell, and mobile action-sheet button structure are now validator-clean. |
| LMS-02 | Done | 0% | Create and maintain a dedicated LMS tracker for shell-level cleanup notes | This file is the dedicated LMS tracker. |

## Change Log

| Date | Files | Tasks | Evidence |
| --- | --- | --- | --- |
| `2026-05-18` | `lms.html`, `test/lms-route-regressions.test.js`, `docs/LMS_OPTIMIZATION_TRACKER.md`, `docs/FULL_SITE_SYNTAX_BUG_SECURITY_AUDIT.md` | `LMS-01`, `LMS-02` | Added unique labels to the hidden nav stubs, changed the class-type switch to a valid grouped control, moved the LMS gradebook-wrapper visibility into a route-owned class, and normalized the mobile action-sheet buttons to explicit `type="button"` plus `<span class="mob-sheet-icon">` wrappers; focused `html-validate` dropped `lms.html` from `19` to `0`; and `npx vitest run test/lms-route-regressions.test.js test/scheduler-and-lms-regressions.test.js` passed `2/2` files and `4/4` tests. |
