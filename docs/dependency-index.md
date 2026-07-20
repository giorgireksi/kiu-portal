# Dependency index

**What must load before feature X?** Eager hubs (HTML script order) + lazy `ensure*` / `MODULE_URLS` chains.

Machine SSOT: [`tools/dependency-manifest.json`](../tools/dependency-manifest.json). Rubric: [`human-maintainability.md`](human-maintainability.md).

Also see [`findability-index.md`](findability-index.md) for feature → owner files.

## social

- **HTML:** `social.html`

### Eager hubs (order in HTML)

1. `assets/js/shared/social-runtime-lite.js`
2. `assets/js/pages/social-mobile.js`
3. `assets/js/pages/social-overlay-chrome.js`
4. `assets/js/pages/social-shell-nav.js`
5. `assets/js/pages/social-page.js`

### Lazy chains

| Chain id | Loader | URLs (order) |
|----------|--------|--------------|
| `social.feed` | `assets/js/pages/social-page.js` | `assets/js/pages/social-feed-comments-runtime.js` → `assets/js/pages/social-feed.js` |
| `social.alerts` | `assets/js/pages/social-page.js` | `assets/js/pages/social-alerts.js` |
| `social.community` | `assets/js/pages/social-page.js` | `assets/js/pages/social-community.js` |
| `social.events` | `assets/js/pages/social-page.js` | `assets/js/pages/social-events.js` |
| `social.groups` | `assets/js/pages/social-page.js` | `assets/js/pages/social-groups.js` |
| `social.lost-found` | `assets/js/pages/social-page.js` | `assets/js/pages/social-lost-found.js` |
| `social.messages` | `assets/js/pages/social-page.js` | `assets/js/pages/social-messages.js` |
| `social.pages` | `assets/js/pages/social-page.js` | `assets/js/pages/social-pages.js` |
| `social.photography` | `assets/js/pages/social-page.js` | `assets/js/pages/social-photography.js` |
| `social.profile` | `assets/js/pages/social-page.js` | `assets/js/pages/social-profile.js` |
| `social.surveys` | `assets/js/pages/social-page.js` | `assets/js/pages/social-surveys.js` |
| `social.workspace` | `assets/js/pages/social-page.js` | `assets/js/pages/social-workspace.js` |

## lms

- **HTML:** `lms.html`

### Eager hubs (order in HTML)

1. `assets/js/pages/lms-classroom-tabs-runtime.js`
2. `assets/js/pages/lms-quiz-blue-runtime.js`
3. `assets/js/pages/lms.js`
4. `assets/js/pages/lms-route-boot.js`

### Lazy chains

| Chain id | Loader | URLs (order) |
|----------|--------|--------------|
| `lms.gradebook` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/gradebook-history-ui-runtime.js` → `assets/js/pages/gradebook-quiz-map-runtime.js` → `assets/js/pages/gradebook-model.js` → `assets/js/pages/gradebook-weights-runtime.js` → `assets/js/pages/gradebook-components-runtime.js` → `assets/js/pages/gradebook-workspace.js` → `assets/js/pages/gradebook-staff.js` |
| `lms.live-quiz` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/lms-workspace-sync-timing.js` → `assets/js/pages/lms-live-quiz-access-runtime.js` → `assets/js/pages/lms-live-quiz-workspace-runtime.js` → `assets/js/pages/lms-live-quiz-podium-runtime.js` → `assets/js/pages/lms-live-quiz-session-runtime.js` → `assets/js/pages/lms-live-quiz-ui-staff-runtime.js` → `assets/js/pages/lms-live-quiz-ui-runtime.js` |
| `lms.whiteboard` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/lms-workspace-sync-timing.js` → `assets/js/pages/lms-whiteboard-workspace-runtime.js` → `assets/js/pages/lms-whiteboard-collab-runtime.js` → `assets/js/pages/lms-whiteboard-history-runtime.js` → `assets/js/pages/lms-whiteboard-minimap-runtime.js` → `assets/js/pages/lms-whiteboard-document-runtime.js` → `assets/js/pages/lms-whiteboard-model.js` → `assets/js/pages/lms-whiteboard-model-bridge.js` → `assets/js/pages/lms-whiteboard-pointer-runtime.js` → `assets/js/pages/lms-whiteboard-paint-runtime.js` → `assets/js/pages/lms-whiteboard-chrome-runtime.js` → `assets/js/pages/lms-whiteboard-session-runtime.js` → `assets/js/pages/lms-whiteboard-selection-runtime.js` → `assets/js/pages/lms-whiteboard-runtime.js` |
| `lms.quiz` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/lms-grade-sync-runtime.js` → `assets/js/pages/lms-quiz-model.js` → `assets/js/pages/lms-quiz-model-bridge.js` → `assets/js/pages/lms-quiz-blue-runtime.js` → `assets/js/pages/lms-quiz-focus-runtime.js` → `assets/js/pages/lms-quiz-workspace-session-runtime.js` → `assets/js/pages/lms-quiz-workspace-review-runtime.js` → `assets/js/pages/lms-quiz-workspace-runtime.js` → `assets/js/pages/lms-protected-quiz-runtime.js` |
| `lms.calls` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/lms-calls-runtime.js` |
| `lms.interaction` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/shared/messenger-gradebook-runtime.js` → `assets/js/shared/messenger-chrome-runtime.js` → `assets/js/shared/messenger.js` → `assets/js/pages/lms-interaction-messages-runtime.js` |
| `lms.content` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/lms-file-storage-runtime.js` → `assets/js/pages/lms-week-store-runtime.js` → `assets/js/pages/lms-content-library-runtime.js` → `assets/js/pages/lms-materials-runtime.js` → `assets/js/pages/lms-assignments-runtime.js` |
| `lms.personal-dashboard` | `assets/js/pages/lms-classroom-tabs-runtime.js` | `assets/js/pages/lms-personal-dashboard-runtime.js` |

## student-service

- **HTML:** `student-service.html`

### Eager hubs (order in HTML)

1. `assets/js/pages/student-service-modules-runtime.js`
2. `assets/js/pages/student-service-ops-runtime.js`
3. `assets/js/pages/student-service-bootstrap-runtime.js`
4. `assets/js/pages/student-service.js`

### Lazy chains

| Chain id | Loader | URLs (order) |
|----------|--------|--------------|
| `ss.qa` | `assets/js/pages/student-service-modules-runtime.js` | `assets/js/pages/student-service-qa.js` |
| `ss.service` | `assets/js/pages/student-service-modules-runtime.js` | `assets/js/pages/student-service-service.js` |
| `ss.filters` | `assets/js/pages/student-service-modules-runtime.js` | `assets/js/pages/student-service-filters.js` |
| `ss.attachments` | `assets/js/pages/student-service-modules-runtime.js` | `assets/js/pages/student-service-attachments.js` |
| `ss.tickets` | `assets/js/pages/student-service-modules-runtime.js` | `assets/js/pages/student-service-tickets.js` |

## registration

- **HTML:** `registration.html`

### Eager hubs (order in HTML)

1. `assets/js/pages/registration-shared.js`
2. `assets/js/pages/registration-enrollment.js`
3. `assets/js/pages/student-registration.js`
4. `assets/js/pages/registration-student-route.js`

_No lazy chains listed for this route in H3 (eager hubs only)._

## index

- **HTML:** `index.html`

### Eager hubs (order in HTML)

1. `assets/js/app/app.js`
2. `assets/js/features/navigation.js`
3. `assets/js/features/index-luxury.js`
4. `assets/js/features/luxury-shell-chrome.js`
5. `assets/js/features/index-home-dashboard.js`

_No lazy chains listed for this route in H3 (eager hubs only)._

## news

- **HTML:** `news.html`

### Eager hubs (order in HTML)

1. `assets/js/pages/news/news-runtime.js`
2. `assets/js/pages/news/news-api.js`
3. `assets/js/pages/news/news-feed-render.js`
4. `assets/js/pages/news/news-events.js`
5. `assets/js/pages/news.js`

_No lazy chains listed for this route in H3 (eager hubs only)._

