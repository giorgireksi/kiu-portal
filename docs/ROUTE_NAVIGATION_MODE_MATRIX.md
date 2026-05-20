# Route Navigation Mode Matrix

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the mixed-navigation audit by explicitly classifying the current route model and documenting the smallest safe reduction path for unnecessary full-document refreshes.

## Current Route Model

### `spa-section`

- `home`
- `programs`
- `news`
- `orders`
- `student-service`

Meaning:

- these routes can stay inside the current shell document
- `navigation.js` treats them as shell-backed sections instead of forced hard routes

### `standalone`

- `admin-library`
- `admin-orders`
- `admin-scheduler`
- `admin-tools`
- `career-market`
- `chancellery`
- `exams`
- `faculty-gradebook`
- `index` non-home deep links that resolve to standalone pages
- `library`
- `lms`
- `personal-data`
- `profile-view`
- `profile`
- `registration`
- `social`
- `staff`
- `students-admin`
- `study-card`
- `timetable`

Meaning:

- these routes own their own root HTML entries today
- navigation to them is intentionally document-level, not accidental shell breakage

### `alias-redirect`

- `calendar.html` -> `timetable.html`
- `faculty-schedule.html` -> `timetable.html`
- `gradebook.html` -> `faculty-gradebook.html`
- `news.html` -> `index.html?view=<role>#news`
- `orders.html` -> `index.html?view=<role>#orders` for non-admin roles, `admin-orders.html` for admin
- `student-service.html` -> `index.html?view=<role>#student-service`

Meaning:

- these are zero-runtime wrappers
- they should stay cheap redirects unless a canonical route changes

### `special-page`

- `login.html`
- `exam-portal.html`
- `protected-launch.html`

Meaning:

- these are intentionally outside the normal portal shell model
- they should not be forced into SPA navigation

## Source of Truth

- `assets/js/features/navigation.js`
- `test/navigation-model-regressions.test.js`
- `test/redirect-wrapper-regressions.test.js`

The live classifier is `getPortalRouteMode(...)`.

## Unexpected vs Intentional Refreshes

### Intentional today

- shell -> standalone route
- standalone route -> different standalone route
- alias wrapper -> canonical route
- any route -> `login.html`, `exam-portal.html`, or `protected-launch.html`

### Still worth reducing

- shell-to-standalone transitions for high-frequency student pages:
  - `orders`
  - `student-service`
  - `study-card`
  - `timetable`
  - `registration`

Reason:

- they are used like product sections, but currently pay the cost of full document reloads and duplicated shell/mobile bootstrap

## Smallest Safe Reduction Path

1. Keep alias wrappers and special pages as-is.
2. Do not merge admin-heavy standalone pages back into the shell first.
3. The first candidate group is now shell-owned:
   - `news`
   - `orders`
   - `student-service`
4. Second candidate group:
   - `study-card`
   - `timetable`
   - `registration`
5. Only after those are stable, revisit whether `library` or `faculty-gradebook` should become shell-owned.

## Decision

The current mixed model is now explicit and understood.

The navigation audit is complete as an audit task:

- route modes are classified
- intentional vs unnecessary refreshes are distinguished
- the next refactor path is concrete
