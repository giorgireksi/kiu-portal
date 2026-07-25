# Findability index

**Start here to find frontend code.** Feature → primary owner (**≤2** files) → entry HTML or lazy host. Peels / load helpers may appear under **support** (see [`js-change-locality.md`](js-change-locality.md)).

**CSS Day-1:** [`css-handoff.md`](css-handoff.md) (styles) · [`visual-ssot.md`](visual-ssot.md). Human `css.*` rows below; route/CSS machine stack is `tools/css-route-manifest.json`.

Machine SSOT (JS): [`tools/findability-manifest.json`](../tools/findability-manifest.json). Rubric: [`human-maintainability.md`](human-maintainability.md).

## shared

- **HTML:** `index.html`
- **Architecture:** [`docs/shell-panels.md`](shell-panels.md)
- **CSS map:** [`docs/visual-ssot.md`](visual-ssot.md) (“Where to edit” table)

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="shared-navigation"></a>`shared.navigation` | Portal nav / route switching | `assets/js/features/navigation.js` | eager in HTML |
| <a id="shared-luxury-shell"></a>`shared.luxury-shell` | Luxury shell chrome (topbar / drawers) | `assets/js/features/luxury-shell-chrome.js`, `assets/js/features/index-luxury.js` | eager in HTML |
| <a id="shared-app-bootstrap"></a>`shared.app-bootstrap` | App bootstrap / compat runtime | `assets/js/app/app.js` | eager in HTML |
| <a id="css-shell"></a>`css.shell` | Shell / topbar / sidebar paint | `assets/css/lux-shell.css`, `assets/css/lux-tokens.css` | eager HTML |
| <a id="css-controls"></a>`css.controls` | Buttons / inputs / CTA sheen | `assets/css/lux-controls.css` | eager HTML |
| <a id="css-mobile-core"></a>`css.mobile-core` | Mobile drawer / bottom nav | `assets/css/mobile-shell-core.css` | eager HTML |
| <a id="css-modals"></a>`css.modals-warmglass` | Hub modal warmglass | `assets/css/lux-modals.css` | eager HTML on modal hubs |
| <a id="css-messenger"></a>`css.messenger` | Messenger / notif / call layout | `assets/css/layout-portal.css` | lazy `messenger.js` → `ensureLayoutPortalCss` |
| <a id="css-droplist"></a>`css.droplist` | Picker droplist paint | `assets/css/lux-droplist.css` | lazy `ensureLuxDroplistCss` |
| <a id="css-home"></a>`css.home-dashboard` | Home layout / widgets / role | `assets/css/index-home-layout.css`, `assets/css/index-home-widgets.css`, `assets/css/index-home-role.css` | eager `index.html` (+ lazy editor) |
| <a id="css-fouc"></a>`css.home-fouc-ht` | Shared FOUC / HT atmosphere | `assets/css/lux-fouc-ht.css` | eager on all `lux-full-paint` portals |

## social

- **HTML:** `social.html`
- **Architecture:** [`docs/social-architecture.md`](social-architecture.md)

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="social-shell"></a>`social.shell` | Social shell orchestrator / domain dispatch | `assets/js/pages/social-page.js` | eager in HTML |
| <a id="social-feed"></a>`social.feed` | Feed / posts / reactions / compose | `assets/js/pages/social-feed.js`, `assets/js/pages/social-feed-comments-runtime.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-community"></a>`social.community` | People / relationships | `assets/js/pages/social-community.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-groups"></a>`social.groups` | Groups | `assets/js/pages/social-groups.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-workspace"></a>`social.workspace` | Projects workspace / desk | `assets/js/pages/social-workspace.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-portfolio"></a>`social.portfolio` | Portfolio (projects panel) | `assets/js/pages/social-workspace.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-pages"></a>`social.pages` | Campus pages | `assets/js/pages/social-pages.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-events"></a>`social.events` | Events | `assets/js/pages/social-events.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-surveys"></a>`social.surveys` | Surveys | `assets/js/pages/social-surveys.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-photography"></a>`social.photography` | Photography / Exposé | `assets/js/pages/social-photography.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-lost-found"></a>`social.lost-found` | Lost & Found | `assets/js/pages/social-lost-found.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-messages"></a>`social.messages` | Messages / chat | `assets/js/pages/social-messages.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-alerts"></a>`social.alerts` | Alerts / notifications | `assets/js/pages/social-alerts.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-profile"></a>`social.profile` | Social profile panel | `assets/js/pages/social-profile.js`, `assets/js/pages/social-profile-model.js` | lazy via `assets/js/pages/social-page.js` |
| <a id="social-runtime-lite"></a>`social.runtime-lite` | Social state / queueRender bridge | `assets/js/shared/social-runtime-lite.js` | eager in HTML |

## lms

- **HTML:** `lms.html`

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="lms-hub"></a>`lms.hub` | LMS course shell / sessions hub | `assets/js/pages/lms.js` | eager in HTML |
| <a id="lms-tabs"></a>`lms.tabs` | Classroom tab switch + lazy module loader | `assets/js/pages/lms-classroom-tabs-runtime.js` | eager in HTML |
| <a id="lms-sessions"></a>`lms.sessions` | Sessions tab | `assets/js/pages/lms-classroom-sessions-runtime.js` | eager in HTML |
| <a id="lms-gradebook"></a>`lms.gradebook` | Grades / gradebook | `assets/js/pages/gradebook-workspace.js`, `assets/js/pages/gradebook-model.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-live-quiz"></a>`lms.live-quiz` | Live quiz | `assets/js/pages/lms-live-quiz-ui-runtime.js`, `assets/js/pages/lms-live-quiz-workspace-runtime.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-whiteboard"></a>`lms.whiteboard` | Whiteboard | `assets/js/pages/lms-whiteboard-runtime.js`, `assets/js/pages/lms-whiteboard-model.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-quiz"></a>`lms.quiz` | Section quiz / protected quiz | `assets/js/pages/lms-quiz-workspace-runtime.js`, `assets/js/pages/lms-quiz-model.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-calls"></a>`lms.calls` | Calls | `assets/js/pages/lms-calls-runtime.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-interaction"></a>`lms.interaction` | Interaction / messenger in LMS | `assets/js/pages/lms-interaction-messages-runtime.js`, `assets/js/shared/messenger.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-materials"></a>`lms.materials` | Materials / content library / assignments | `assets/js/pages/lms-materials-runtime.js`, `assets/js/pages/lms-content-library-runtime.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |
| <a id="lms-personal-dashboard"></a>`lms.personal-dashboard` | LMS personal dashboard | `assets/js/pages/lms-personal-dashboard-runtime.js` | lazy via `assets/js/pages/lms-classroom-tabs-runtime.js` |

## student-service

- **HTML:** `student-service.html`
- **Architecture:** [`docs/student-service-architecture.md`](student-service-architecture.md)

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="ss-hub"></a>`ss.hub` | Student Service hub / lanes / ensure* | `assets/js/pages/student-service.js` | eager in HTML |
| <a id="ss-service"></a>`ss.service-lane` | Service lane shells (tickets workbench) | `assets/js/pages/student-service-service.js` | lazy via `assets/js/pages/student-service-modules-runtime.js` |
| <a id="ss-qa"></a>`ss.qa` | Q&A lane | `assets/js/pages/student-service-qa.js` | lazy via `assets/js/pages/student-service-modules-runtime.js` |
| <a id="ss-filters"></a>`ss.filters` | Inbox filters / editor | `assets/js/pages/student-service-filters.js` | lazy via `assets/js/pages/student-service-modules-runtime.js` |
| <a id="ss-attachments"></a>`ss.attachments` | Attachments gallery / picker | `assets/js/pages/student-service-attachments.js` | lazy via `assets/js/pages/student-service-modules-runtime.js` |
| <a id="ss-tickets"></a>`ss.tickets` | Tickets / thread actions | `assets/js/pages/student-service-tickets.js` | lazy via `assets/js/pages/student-service-modules-runtime.js` |
| <a id="ss-inbox-runtime"></a>`ss.inbox-runtime` | Inbox runtime (eager) | `assets/js/pages/student-service-inbox-runtime.js` | eager in HTML |
| <a id="ss-page-runtime"></a>`ss.page-runtime` | Articles / page runtime (eager) | `assets/js/pages/student-service-page-runtime.js` | eager in HTML |

## registration

- **HTML:** `registration.html`

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="reg-student"></a>`reg.student` | Student registration hub / tabs | `assets/js/pages/student-registration.js` | eager in HTML |
| <a id="reg-shared"></a>`reg.shared` | Shared registration helpers | `assets/js/pages/registration-shared.js` | eager in HTML |
| <a id="reg-enrollment"></a>`reg.enrollment` | Enrollment helpers | `assets/js/pages/registration-enrollment.js` | eager in HTML |
| <a id="reg-eligibility"></a>`reg.eligibility` | Eligibility runtime | `assets/js/pages/student-registration-eligibility-runtime.js` | eager in HTML |
| <a id="reg-choice"></a>`reg.choice` | Course choice runtime | `assets/js/pages/student-registration-choice-runtime.js` | eager in HTML |
| <a id="reg-student-route"></a>`reg.student-route` | Student registration route boot | `assets/js/pages/registration-student-route.js` | eager in HTML |

## index

- **HTML:** `index.html`

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="index-luxury"></a>`index.luxury` | Index luxury shell / page chrome | `assets/js/features/index-luxury.js` | eager in HTML |
| <a id="index-home"></a>`index.home-dashboard` | Home dashboard widgets / editor chunk | `assets/js/features/index-home-dashboard.js`, `assets/js/features/home-dashboard-widget-layout-runtime.js` | lazy via `assets/js/features/index-home-dashboard.js` |
| <a id="index-home-gestures"></a>`index.home-gestures` | Home dashboard gestures | `assets/js/features/home-dashboard-gesture-runtime.js` | eager in HTML |
| <a id="index-home-widget-data"></a>`index.home-widget-data` | Home dashboard widget data | `assets/js/features/home-dashboard-widget-data-runtime.js` | eager in HTML |
| <a id="index-news-home"></a>`index.news-home` | News teaser on home | `assets/js/shared/news-home.js` | eager in HTML |

## news

- **HTML:** `news.html`

| Feature id | Label | Primary owners | Load |
|------------|-------|----------------|------|
| <a id="news-entry"></a>`news.entry` | News page entry / boot | `assets/js/pages/news.js` | eager in HTML |
| <a id="news-runtime"></a>`news.runtime` | News workspace runtime | `assets/js/pages/news/news-runtime.js` | eager in HTML |
| <a id="news-feed"></a>`news.feed` | News feed render | `assets/js/pages/news/news-feed-render.js` | eager in HTML |
| <a id="news-publisher"></a>`news.publisher` | News publisher | `assets/js/pages/news/news-publisher.js` | eager in HTML |
| <a id="news-replies"></a>`news.replies` | News replies | `assets/js/pages/news/news-replies.js` | eager in HTML |
| <a id="news-events"></a>`news.events` | News events / handlers | `assets/js/pages/news/news-events.js` | eager in HTML |
| <a id="news-api"></a>`news.api` | News API helpers | `assets/js/pages/news/news-api.js` | eager in HTML |

