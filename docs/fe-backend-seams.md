# FE → backend seams (Wave H9)

**Goal:** a mid can answer “which API/domain owns this data?” from one map.

Machine SSOT: [`tools/fe-backend-seam-manifest.json`](../tools/fe-backend-seam-manifest.json).  
Backend ownership detail: [`BACKEND_PLATFORM_DOMAIN_CONTRACTS.md`](BACKEND_PLATFORM_DOMAIN_CONTRACTS.md).  
Findability: [`findability-index.md`](findability-index.md).

## How to use

1. Find your feature in the table / JSON (`id` or `featureId`).  
2. Note `apiPrefix`, `domain`, and `routes`.  
3. For mutation rules / forbidden cross-writes, open the backend contracts doc for that domain.  
4. Prefer calling through existing `assets/js/app/api.js` (or the listed `feEntry`) over inventing a new `/api/…` path.

## Indexed seams

| Id | API prefix | Domain | Routes |
|----|------------|--------|--------|
| `auth.session` | `/api/portal/session` | `auth-session-service.js` | `auth-routes.js` |
| `portal.state` | `/api/portal/state` | `accounts-service.js` | `portal-support-routes.js` |
| `notifications` | `/api/notifications` | `notifications-service.js` | `portal-support-routes.js` |
| `files` | `/api/files` | `files-service.js` | `files-routes.js` |
| `mail` | `/api/mail` | (mail via accounts/portal) | `mail-routes.js` |
| `student-service` | `/api/student-service` | `student-service-service.js` | `student-service-routes.js` |
| `social` | `/api/social` | `social-state-service.js` | `social-routes.js` |
| `news` | `/api/news` | `social-content-service.js` | `news-routes.js` |
| `lms.live-quiz` | `/api/lms/live-quizzes` | `lms-live-quiz-service.js` | `lms-live-quiz-routes.js` |
| `lms.whiteboard` | `/api/lms/whiteboards` | `lms-whiteboard-service.js` | `lms-whiteboard-routes.js` |
| `lms.personal-dashboard` | `/api/lms/personal-dashboards` | `lms-personal-dashboard-service.js` | `lms-personal-dashboard-routes.js` |
| `protected-exam` | `/api/exam-portal` | `protected-exam-service.js` | `protected-exam-routes.js` |
| `registration.academic` | `/api/registration` | `lms-course-service.js` | `academic-routes.js` |
| `gradebook.weights` | `/api/portal/state` | `gradebook-service.js` | `portal-support-routes.js` |

## How to check

```bash
npm run check:seams
```
