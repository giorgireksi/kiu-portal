# Portal Visual Exception Budget

Purpose:
- document which special routes may stay visually distinct
- define what they must still inherit from the shared system
- stop “special route” from becoming an excuse for uncontrolled drift

## Shared Rules That Still Apply To Every Special Route

Even special routes must inherit:

- global tokens from `assets/css/index-luxury.css`
- shared nav resolution from `assets/js/features/navigation.js`
- shared topbar / shell chrome from `assets/js/features/luxury-shell-chrome.js`
- shared mobile shell behavior from `assets/js/pages/standalone-mobile-shell.js` unless the route has its own approved mobile owner

Special routes may diverge in layout and workflow density, not in basic product identity.

## Social

Route:
- `social.html`

Current owners:
- `assets/css/social-rebuild.css`
- `assets/js/pages/social-page.js`
- `assets/js/pages/social-mobile.js`

Allowed exceptions:
- custom social feed/card composition
- custom community/messaging/mobile flows
- custom content-density rules for social posts, comments, groups, and pages

Must still inherit:
- shell tokens
- shell nav state
- shell chrome
- theme / transparency settings

Must not diverge:
- button hierarchy in generic shell actions
- global route identity behavior
- shared shell topbar logic

## Career Market

Route:
- `career-market.html`

Current owners:
- `assets/css/career-market-route.css`
- `assets/js/pages/career-market.js`

Allowed exceptions:
- career-specific provider cards
- wizard flow layout
- market/provider density

Must still inherit:
- shell tokens
- shell nav state
- summary-surface primitives when a section is a generic summary rather than a custom provider surface

Must not diverge:
- shared shell buttons
- generic page hero rhythm when not in provider-specific sections

## Staff

Route:
- `staff.html`

Current owners:
- `assets/css/admin-directories.css`
- `assets/css/staff-command-center.css`
- `assets/js/pages/staff-command-center.js`
- `assets/js/pages/staff-route-bootstrap.js`

Allowed exceptions:
- command-center density
- staff-focused list/workbench layout
- administrative card groupings specific to staffing workflows

Must still inherit:
- shell tokens
- nav / topbar behavior
- shared summary-surface primitives for generic summary cards

Must not diverge:
- shell interaction rules
- route-identity behavior
- ad hoc mobile shell logic

## Students Admin

Route:
- `students-admin.html`

Current owners:
- `assets/css/students-admin-lms.css`
- `assets/js/pages/students-admin-lms.js`

Allowed exceptions:
- student-directory workbench density
- registrar/admin roster tables and inline actions
- workflow-specific panel groupings for enrollment and academic operations

Must still inherit:
- shell tokens
- nav / topbar behavior
- shared empty/error state surfaces on generic shells

Must not diverge:
- shared shell button hierarchy
- route-identity behavior
- ad hoc mobile shell logic

## Exams

Route:
- `exams.html`

Current owners:
- `assets/css/exam-studio.css`
- `assets/js/pages/exams-console.js`

Allowed exceptions:
- exam-studio layout
- assessment-specific dense panels
- quiz builder and attempt/review workspace structure

Must still inherit:
- shell tokens
- shell nav state
- shared mobile shell behavior

Must not diverge:
- generic shell controls
- background / blur rules that fight shared theme state without necessity

## Admin Scheduler

Route:
- `admin-scheduler.html`

Current owners:
- inline style debt in `admin-scheduler.html`
- `assets/js/pages/admin-scheduler.js`

Allowed exceptions:
- scheduler grid / rail / event-card structure
- schedule-specific board interactions

Must still inherit:
- shell tokens
- shell chrome
- shared mobile shell behavior

Current debt:
- inline `<style>` block still exists and remains tracked debt

## Admin Tools

Route:
- `admin-tools.html`

Current owners:
- `assets/css/admin-tools-luxury.css`
- `assets/js/features/index-admin-tools.js`
- admin registration / planner modules

Allowed exceptions:
- command-center layout
- admin curriculum/registration/planner compositions

Must still inherit:
- shell tokens
- shell chrome
- shared mobile shell behavior

Resolved debt:
- inline mobile shell removed
- inline `<style>` block removed and moved to `assets/css/admin-tools-luxury.css`

## Approval Rule

Any new exception must answer:

1. Why can this not be solved in shared CSS/JS?
2. Which file owns the exception?
3. Is the exception structural, behavioral, or purely visual?
4. How will we know if the exception starts drifting too far?

If those questions are not answered, the exception is not approved.
