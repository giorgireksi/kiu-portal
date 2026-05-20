# Page Load Fix Tasks

Source of truth for this backlog:
- `artifacts/all-pages-load-scan.json`
- `artifacts/all-pages-load-scan.md`
- `service-worker.js`

Current scan snapshot:
- `30` root pages scanned
- Heaviest page: `lms.html` at `3470.5 KB` estimated first-load
- Median page first-load: `2338 KB`
- Shared shell imported by `24` pages: about `2261.6 KB`

Largest shared assets right now:
- `assets/css/index-luxury.css` - `795.6 KB`
- `assets/js/app/app.js` - `421.3 KB`
- `assets/js/shared/utilities.js` - `123.4 KB`
- `assets/js/features/index-luxury.js` - `119 KB`
- `assets/js/shared/faculty.js` - `116.6 KB`

## P0 - Finish The App-Wide Fixes

### 1. Split the shared shell CSS
Files to inspect:
- `assets/css/index-luxury.css`
- top importing pages such as `index.html`, `lms.html`, `social.html`, `admin-tools.html`

Why:
- `assets/css/index-luxury.css` is `795.6 KB`
- it is loaded by `24` pages
- this is the single biggest shared cost in the whole app

Work:
- extract only shell-critical styles into a smaller shared file
- move page-specific dashboard, LMS, social, and admin styling into route CSS files
- keep above-the-fold shell chrome in the shared file
- remove unused selectors if route code no longer needs them

Definition of done:
- shared shell CSS drops materially
- pages stop importing one giant stylesheet for unrelated UI
- `npm run test:all-pages-load-scan` shows a lower `sharedImportKb`

### 2. Split `assets/js/app/app.js`
Files to inspect:
- `assets/js/app/app.js`
- `assets/js/features/navigation.js`
- `assets/js/features/ui.js`
- pages importing the common runtime

Why:
- `assets/js/app/app.js` is `421.3 KB`
- it is loaded by `24` pages
- the scan shows most pages pay for the same large runtime regardless of route

Work:
- isolate bootstrapping, shell setup, and route-independent helpers
- move heavy feature logic behind route checks or lazy loaders
- remove code that belongs in page runtimes from the global app bootstrap

Definition of done:
- startup path for non-home pages does not execute unrelated home/dashboard logic
- common JS payload is smaller in the scan

### 3. Stop loading home-only scripts on non-home pages
Files to inspect:
- `social.html`
- `career-market.html`
- `registration.html`
- `students-admin.html`
- other pages importing:
  - `assets/js/features/index-luxury.js`
  - `assets/js/features/luxury-home-model.js`
  - `assets/js/features/luxury-shell-chrome.js`

Why:
- the scan shows `luxury-home-model.js` and `index-luxury.js` are still part of the shared cost across many pages
- several non-home pages likely pay for dashboard behavior they do not render

Work:
- define the minimum shell script set required by every route
- move home-only dashboard code to `index.html`
- keep only true shell chrome on non-home pages

Definition of done:
- non-home pages no longer import home-dashboard code unless they render it
- `sharedImportKb` drops across most pages

## P1 - Fix The Worst Pages First

### 4. Reduce `lms.html` first-load weight
Current scan:
- `3470.5 KB` first-load
- `189.3 KB` HTML
- `39 KB` inline scripts
- `133.4 KB` inline styles
- `1019.6 KB` page-specific imports

Largest route-specific costs:
- `assets/js/pages/lms-quiz-workspace-runtime.js` - `234.1 KB`
- `assets/js/pages/gradebook.js` - `167.9 KB`
- `assets/js/pages/lms.js` - `132.8 KB`

Work:
- move inline styles out of `lms.html` into route CSS
- move inline scripts into route JS
- lazy-load quiz workspace, grade sync, file storage, calls, and classroom runtimes only when their tab/panel opens
- do not boot all LMS subsystems on first paint

Definition of done:
- `lms.html` first-load drops below `2500 KB` in the scan
- page script count is clearly reduced

### 5. Reduce `social.html` first-load weight
Current scan:
- `3044.2 KB` first-load
- `929.9 KB` page-specific imports

Largest route-specific costs:
- `assets/js/pages/social-page.js` - `663.2 KB`
- `assets/css/social-rebuild.css` - `242 KB`

Work:
- split `social-page.js` by feed, inbox, community, events, and lost-and-found modules
- lazy-load non-default panels
- split `social-rebuild.css` into critical shell styles and panel-specific styles

Definition of done:
- default social feed loads without inbox/community/editor code upfront
- `social.html` drops below `2300 KB`

### 6. Reduce `admin-tools.html` first-load weight
Current scan:
- `2912 KB` first-load
- `629.1 KB` page-specific imports

Largest route-specific costs:
- `assets/js/pages/admin-registration.js` - `194.5 KB`

Work:
- load admin modules only after the matching section is opened
- move large admin-only panels out of initial DOM if not visible
- reduce inline script size

Definition of done:
- `admin-tools.html` drops below `2200 KB`

## P2 - Clean Up Page-Specific Overheads

### 7. Shrink oversized HTML documents
Priority files:
- `lms.html` - `189.3 KB`
- `profile-view.html` - `107 KB`
- `admin-scheduler.html` - `63.2 KB`

Work:
- move embedded style/script blocks into external files
- remove duplicated markup that can be rendered by JS
- avoid shipping hidden panel content when it can be rendered on demand

### 8. Continue removing upfront export and utility libraries
Already improved:
- `exams.html` no longer loads export libraries upfront

Next places to check:
- `lms.html`
- `admin-tools.html`
- any page with print/export/download features

Work:
- load PDF, DOCX, charting, and file-export dependencies only when the user triggers that action

### 9. Review icon/font delivery
Files to inspect:
- all pages importing `assets/vendor/fontawesome/css/all.min.css`

Why:
- `99.6 KB` on `27` pages is not the top issue, but it is still universal cost

Work:
- check whether all pages need the full icon pack
- replace with a smaller subset or page-specific icon bundle if feasible

## P3 - Verification And Guardrails

### 10. Keep the all-pages scan in the workflow
Commands:
- `npm run test:all-pages-load-scan`
- `npm run test:all-pages-console`

Work:
- rerun the load scan after each optimization batch
- compare the top 10 heaviest pages before and after changes
- fail the work item if first-load grows on unaffected pages

### 11. Add route budgets
Suggested initial budgets:
- `index.html` under `2200 KB`
- `lms.html` under `2500 KB`
- `social.html` under `2300 KB`
- `admin-tools.html` under `2200 KB`
- median page under `1800 KB`

Work:
- encode these thresholds in `tools/all_pages_load_scan.mjs` or a follow-up verifier
- make regressions visible in CI or local checks

## Recommended Execution Order

1. Split `assets/css/index-luxury.css`
2. Split `assets/js/app/app.js`
3. Remove home-only runtime imports from non-home pages
4. Refactor `lms.html` loading by tab/module
5. Refactor `social.html` loading by panel/module
6. Refactor `admin-tools.html`
7. Reduce oversized HTML documents
8. Add budgets and keep scanning after each batch
