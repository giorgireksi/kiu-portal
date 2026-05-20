# Root Route Smoke Matrix

Date: `2026-05-19`
Owner: `Codex`
Purpose: record current smoke status for every root HTML entry so route-family runtime and page-coverage audit tasks can close on explicit evidence.

## Current Root Entry Coverage

| Entry | Route kind | Auth expectation | Backend dependency | Current smoke status |
| --- | --- | --- | --- | --- |
| `index.html` | shell / SPA home | local auth or backend session depending on feature | mixed | healthy |
| `admin-library.html` | standalone | admin | shared portal state | healthy |
| `admin-orders.html` | standalone | admin | shared orders/mail state | healthy |
| `admin-scheduler.html` | standalone | admin | schedule + curriculum state | healthy |
| `admin-tools.html` | standalone | admin | curriculum/admin state | healthy |
| `calendar.html` | alias redirect | same as timetable | timetable | healthy redirect |
| `career-market.html` | standalone | authenticated portal user | AI proxy optional | healthy |
| `chancellery.html` | standalone | authenticated portal user | request state | healthy |
| `exam-portal.html` | special page | separate anti-cheat/browser gate | dedicated exam backend routes | healthy special page |
| `exams.html` | standalone | faculty/admin depending on workspace | exam runtime | healthy |
| `faculty-gradebook.html` | standalone | real backend session required for full data | gradebook/LMS backend | healthy with `missing-session` fallback in local-auth-only mode |
| `faculty-schedule.html` | alias redirect | same as timetable | timetable | healthy redirect |
| `gradebook.html` | alias redirect | same as faculty-gradebook | gradebook | healthy redirect |
| `library.html` | standalone | authenticated portal user | shared library state | healthy |
| `lms.html` | standalone | authenticated portal user, role-aware behavior | LMS backend/runtime | healthy |
| `login.html` | special page | public | auth backend | healthy special page |
| `news.html` | alias redirect into shell `news` section | same as `index.html?view=...#news` | news backend through shell runtime | healthy redirect |
| `orders.html` | alias redirect into shell `orders` section for non-admin roles, admin redirect for admin | same as `index.html?view=...#orders` or `admin-orders.html` | orders/mail backend through shell runtime or admin runtime | healthy redirect |
| `personal-data.html` | standalone | authenticated portal user | student profile/record data | healthy |
| `profile-view.html` | standalone | authenticated portal user | profile + admin action data | healthy |
| `profile.html` | standalone | authenticated portal user | profile + messenger runtime | healthy |
| `programs.html` | shell-backed standalone route | authenticated portal user | curriculum/student program data | healthy |
| `protected-launch.html` | special page | real backend session required | protected quiz backend | expected auth-blocked redirect to `login.html` without session token |
| `registration.html` | standalone | authenticated portal user | registration data | healthy |
| `social.html` | standalone | real backend session required for full data | social backend | healthy with `missing-session` fallback in local-auth-only mode |
| `staff.html` | standalone | admin | staff directory + profile-view bridge | healthy |
| `student-service.html` | alias redirect into shell `student-service` section | same as `index.html?view=...#student-service` | service backend through shell runtime | healthy redirect |
| `students-admin.html` | standalone | admin | students admin runtime | healthy |
| `study-card.html` | standalone | authenticated portal user | academic record/registration data | healthy |
| `timetable.html` | standalone | authenticated portal user | timetable data | healthy |

## Higher-Signal Route Flow Checks Already Verified

- `index.html?view=student#home`
  `artifacts/runtime-shell-smoke.json` shows shell/topbar present and home shell text length `9951`
- `admin-tools.html`
  current runtime shell smoke passes with zero route failures
- `social.html`
  current runtime shell smoke passes and correctly surfaces `missing-session` in local-auth-only mode
- `lms.html`
  current runtime shell smoke now includes `lms.html` and records zero route failures with `navCount: 10`
- `staff.html`
  `artifacts/staff-efficient-desktop-summary.json` confirms real pointer interaction through profile card and canonical profile route
- all `30` root HTML entries
  [artifacts/all-pages-console-scan.json](</C:/lms/good/1/2 - Copy (4) - Copy - Copy/artifacts/all-pages-console-scan.json>) now records zero console/page runtime failures across the maintained all-pages scan; `protected-launch.html` stays classified separately as an auth-gated redirect with one non-fatal bridge network abort

## Coverage Decision

The page-by-page smoke audit is complete as an audit task because:

- every root HTML entry has an explicit current status
- alias wrappers are separated from real runtime pages
- special pages are separated from shell-backed routes
- auth-blocked behavior is distinguished from actual page breakage
- the maintained smoke command now covers `home`, `admin-tools`, `social`, and `lms`
- the maintained all-pages console scan exists as `npm run test:all-pages-console`
