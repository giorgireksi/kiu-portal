# Portal Visual Route Classification

Purpose:
- classify every root HTML entry page exactly once
- record visual ownership lines before further unification work
- give engineers and LLMs a concrete "change here first" map

Category meanings:
- `standard-shell`: should converge on shared shell/card/mobile contracts
- `special-surface`: allowed to keep stronger workflow-specific structure, but must inherit shared tokens and shell rules
- `excluded-wrapper`: shell alias/wrapper route, not a first-wave visual owner
- `excluded-route`: outside the first unification wave

| Page | Category | Shared visual owner | Route CSS owner(s) | Route JS owner(s) | Mobile shell owner | Exception status / notes |
|---|---|---|---|---|---|---|
| `admin-library.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/admin-library-route.css` | inline route logic in `admin-library.html` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `admin-orders.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/admin-orders-route.css` | `assets/js/pages/admin-orders.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `admin-scheduler.html` | `special-surface` | `assets/css/index-luxury.css` | inline styles in `admin-scheduler.html` | `assets/js/pages/admin-scheduler.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract; inline-style debt still remains |
| `admin-tools.html` | `special-surface` | `assets/css/index-luxury.css` | `assets/css/admin-tools-luxury.css` | `assets/js/pages/admin-registration.js`, `assets/js/pages/planner.js`, registration shared modules | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract; route-CSS and inline-style debt still remains |
| `calendar.html` | `excluded-route` | none | none | none | none | outside first unification wave |
| `career-market.html` | `special-surface` | `assets/css/index-luxury.css` | `assets/css/career-market-route.css` | `assets/js/pages/career-market.js` | none | special-surface candidate; exception contract still needed |
| `chancellery.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/chancellery.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `exam-portal.html` | `excluded-route` | page-local portal styling | none | `assets/js/pages/exam-portal.js` | none | protected exam flow; outside first unification wave |
| `exams.html` | `special-surface` | `assets/css/index-luxury.css` | `assets/css/exam-studio.css` | `assets/js/pages/exams-console.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `faculty-gradebook.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/gradebook.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `faculty-schedule.html` | `excluded-route` | none | none | none | none | outside first unification wave |
| `gradebook.html` | `excluded-route` | none | none | none | none | outside first unification wave |
| `index.html` | `standard-shell` | `assets/css/index-luxury.css`, `assets/css/index-home-dashboard.css` | `assets/css/index-home-dashboard.css`, `assets/css/news-route.css` | home shell runtime in shared feature modules | `assets/js/pages/index-mobile-shell.js` | premium dashboard benchmark; shared home mobile scaffold already exists |
| `library.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/library.js` | none | standard route without mobile-shell adoption yet |
| `lms.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/lms.js` plus LMS runtime modules | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `login.html` | `excluded-route` | `assets/css/login-route.css` | `assets/css/login-route.css` | `assets/js/pages/login-runtime.js` | none | auth route; outside first unification wave |
| `news.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/news-route.css` | `assets/js/pages/news.js` | none | standard route with route-CSS debt |
| `orders.html` | `standard-shell` | `assets/css/index-luxury.css` | none | none | none | standard route without mobile-shell adoption yet |
| `personal-data.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/personal-data-route.css` | `assets/js/pages/personal-data-page.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `profile.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/profile-route.css` | `assets/js/pages/profile-route.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `profile-view.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/profile-view-route.css` | `assets/js/pages/profile-view-admin-actions.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `programs.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/programs-page.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `protected-launch.html` | `excluded-route` | page-local protected launch styling | none | none | none | outside first unification wave |
| `registration.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/registration-shared.js`, `assets/js/pages/student-registration.js`, `assets/js/pages/registration-student-route.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `social.html` | `special-surface` | `assets/css/index-luxury.css` | `assets/css/social-rebuild.css` | `assets/js/pages/social-page.js` | `assets/js/pages/social-mobile.js` | special-surface candidate with custom mobile owner already split out |
| `staff.html` | `special-surface` | `assets/css/index-luxury.css` | `assets/css/admin-directories.css`, `assets/css/staff-command-center.css` | `assets/js/pages/staff-command-center.js`, `assets/js/pages/staff-route-bootstrap.js` | none | special-surface candidate; exception contract still needed |
| `students-admin.html` | `special-surface` | `assets/css/index-luxury.css` | `assets/css/students-admin-lms.css` | `assets/js/pages/students-admin-lms.js` | none | special-surface candidate; exception contract still needed |
| `student-service.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/student-service.js` | none | standard route without mobile-shell adoption yet |
| `study-card.html` | `standard-shell` | `assets/css/index-luxury.css` | none | `assets/js/pages/study-card-page.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |
| `timetable.html` | `standard-shell` | `assets/css/index-luxury.css` | `assets/css/timetable-route.css` | `assets/js/pages/timetable-runtime.js` | `assets/js/pages/standalone-mobile-shell.js` | migrated on 2026-05-20 to the shared standalone mobile-shell contract |

Implementation notes:
- `study-card.html`, `chancellery.html`, `timetable.html`, `registration.html`, `faculty-gradebook.html`, `programs.html`, `personal-data.html`, `profile.html`, `profile-view.html`, `admin-library.html`, `admin-orders.html`, `lms.html`, `exams.html`, `admin-tools.html`, and `admin-scheduler.html` are migrated standalone routes on the shared mobile-shell contract.
- `library.html`, `orders.html`, `student-service.html`, and `news.html` are treated as real standard-shell routes and should be governed as part of first-wave unification work.
- `admin-library.html` and `admin-orders.html` are treated as standard-shell admin variants, not full special-surface exceptions.
