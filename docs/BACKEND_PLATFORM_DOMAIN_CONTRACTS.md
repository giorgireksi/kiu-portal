# Backend Platform Domain Contracts

Date: `2026-05-18`
Owner: `Codex`
Purpose: define the explicit backend module boundaries for the extracted platform domains and route owners so future refactors can preserve ownership instead of recreating cross-domain coupling.

## Goal

Use this file as the contract for the extracted backend seams under `backend/platform/`.

It defines:

- public API
- owned state
- allowed callers
- forbidden cross-domain write paths

This file is for the backend ownership seams already extracted from `store.js` and `server.js`. It is not a full platform architecture spec.

## Contract Rules

1. Route modules under `backend/platform/routes/` must receive `store` access through injected dependencies such as `getStore`, not by importing `./store` directly.
2. Route modules must not import domain modules directly for business mutation. The store remains the composition owner while migration is in progress.
3. Domain modules under `backend/platform/domains/` must expose explicit named exports only.
4. Cross-domain writes must stay behind the owning domain or the `PlatformStore` composition layer until a new public API is intentionally defined.

## `files-service.js`

Module:
- `backend/platform/domains/files-service.js`

Public API:
- `createFileFromUpload(payload = {})`
- `getFile(fileId)`
- `objectContainsStoredFileReference(value, fileId, visited = new WeakSet())`
- `canActorAccessStoredFile(fileId, actorUserId = '', actorRole = '')`
- `normalizeMessageAttachment(file, senderId)`

Owned state:
- `state.files`
- file metadata normalization for stored file records
- disk persistence of uploaded file payloads under `uploadsDir`

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach files through injected store methods only

Forbidden cross-domain write paths:
- route modules must not write `state.files` directly
- non-file domains must not bypass `createFileFromUpload(...)` for stored file creation
- callers must not import `files-service.js` to mutate unrelated mail, chat, LMS, or Student Service state

## `audit-service.js`

Module:
- `backend/platform/domains/audit-service.js`

Public API:
- `addAuditEvent(payload = {})`

Owned state:
- `state.audit.events`
- audit retention trimming based on `auditRetentionDays`

Allowed callers:
- `PlatformStore` wrapper method in `backend/platform/store.js`
- route-level audit shaping through store methods only

Forbidden cross-domain write paths:
- route modules must not push directly into `state.audit.events`
- non-audit domains must not implement their own retention trimming for platform audit history

## `student-service-service.js`

Module:
- `backend/platform/domains/student-service-service.js`

Public API:
- `normalizeStudentServiceCategory(value = '')`
- `getStudentServiceAreaForCategory(category = '')`
- `normalizeStudentServiceThreadEntry(entry = {}, fallback = {})`
- `normalizeStudentServiceInternalNote(note = {}, index = 0)`
- `normalizeStudentServiceTicketRecord(ticket = {}, index = 0)`
- `normalizeStudentServiceArticleRecord(article = {}, index = 0)`
- `normalizeStudentServiceMacroRecord(macro = {}, index = 0)`
- `normalizeStudentServiceQuestionRecord(question = {}, index = 0)`
- `normalizeStudentServiceAnswerRecord(answer = {}, index = 0)`
- `normalizeStudentServiceReviewQueueEntry(entry = {}, index = 0)`
- `getStudentServiceBootstrap(viewerUserId = '')`

Owned state:
- Student Service record normalization rules
- Student Service default article/macro seed content
- Student Service bootstrap shaping for tickets, questions, answers, articles, macros, review queue, analytics, and permissions

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- Student Service backend flows through store methods only

Forbidden cross-domain write paths:
- route modules must not normalize Student Service records inline
- non-Student-Service domains must not mutate Student Service ticket/question/article state through copied normalization logic
- other domains may read Student Service bootstrap data through store methods, but should not write Student Service state without a store-owned API

## `auth-session-service.js`

Module:
- `backend/platform/domains/auth-session-service.js`

Public API:
- `ensureCredential(userId)`
- `upgradeCredentialHashIfNeeded(userId, password)`
- `getRawAccountByEmail(email)`
- `getRawAccountByMicrosoftOid(oid, tenantId = '')`
- `linkMicrosoftIdentityToAccount(accountId, identity = {})`
- `createSessionForAccount(accountId, options = {})`
- `createSessionByMicrosoftIdentity(identity = {})`
- `activateAccount(userId, newPassword)`
- `requestPasswordReset(email)`
- `resetPassword(token, newPassword)`
- `createSessionByCredentials(email, password)`
- `getSession(token)`
- `logoutSession(token)`
- `revokeSessionsForUser(userId, reason = 'revoked')`
- `updateSessionImpersonation(token, impersonatedRole)`
- `clearSessionImpersonation(token)`

Owned state:
- `state.authCredentials`
- `state.sessions`
- account-linked Microsoft identity fields used for portal sign-in
- portal password reset token lifecycle and session revocation rules

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach auth/session behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not parse or mutate credential/session records directly
- non-auth domains must not bypass `createSessionForAccount(...)`, `getSession(...)`, or `revokeSessionsForUser(...)`
- callers must not inline Microsoft identity linking or password-reset token management outside the store-owned API

## `accounts-service.js`

Module:
- `backend/platform/domains/accounts-service.js`

Public API:
- `ensurePersonFromAccount(account)`
- `listAccounts(filters = {})`
- `getAccountById(userId)`
- `getAccountByEmail(email)`
- `upsertAccount(payload = {})`

Owned state:
- `state.accounts`
- `state.people`
- account sanitization, directory filtering, and account-to-person synchronization

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach account listing/read/write behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate `state.accounts` or `state.people` directly for normal account CRUD
- non-account domains must not duplicate account filtering, account email lookup, or person-sync rules
- callers must not bypass `upsertAccount(...)` when creating or updating managed portal accounts

## `account-privileges-service.js`

Module:
- `backend/platform/domains/account-privileges-service.js`

Public API:
- `listPrivilegeDefinitions()`
- `getGrantedAccountPrivileges(accountOrUserId)`
- `getEffectiveAccountPrivileges(accountOrUserId)`
- `accountHasPrivilege(accountOrUserId, privilegeId = '')`
- `updateAccountPrivileges(accountId, payload = {}, actorId = '')`

Owned state:
- privilege-definition catalog for delegated backend privileges
- `state.accounts[*].grantedPrivileges`
- `state.accounts[*].privilegeNotes`
- `state.accounts[*].privilegeUpdatedBy`
- `state.accounts[*].privilegeUpdatedAt`

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that check or mutate privileges through injected store methods only

Forbidden cross-domain write paths:
- route modules must not inline the privilege catalog or admin privilege resolution rules
- non-account domains must not mutate account privilege records directly in `state.accounts`
- callers must not bypass `accountHasPrivilege(...)` when enforcing delegated privilege checks

## `gradebook-service.js`

Module:
- `backend/platform/domains/gradebook-service.js`

Public API:
- `ensureGradebook(courseId)`
- `canAccessGradebookCourse(courseId, userId, role = '', action = 'read')`
- `getGradebookAssessmentDefinition(gradebook, criterionKey = '')`
- `aggregateGradebookAssessmentEntries(entries = [], mode = 'average')`
- `computeRecordFinalScore(record, gradebook = null)`
- `getGradebookCourse(courseId)`
- `setScore(payload = {})`
- `publishGradebook(payload = {})`
- `finalizeGrades(payload = {})`

Owned state:
- `state.gradebooks`
- gradebook assessment-definition defaults and weighted final-score computation
- gradebook publication/finalization lifecycle and related gradebook notifications/audit writes

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach gradebook behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate gradebook records or publications directly
- non-gradebook domains must not duplicate weighted final-score computation or publication/finalization rules
- callers must not bypass `canAccessGradebookCourse(...)` when enforcing gradebook access

## `lms-course-service.js`

Module:
- `backend/platform/domains/lms-course-service.js`

Public API:
- `ensureLmsCourse(courseId)`
- `getLmsCourse(courseId)`
- `createAssignment(payload = {})`
- `createMaterial(payload = {})`
- `getStudentEnrollmentsByCourse(courseId)`
- `getSectionsByCourse(courseId)`
- `isCourseTeachingStaff(courseId, userId, role = '')`

Owned state:
- `state.lmsCourses`
- LMS course assignment/material collections and teaching-team ownership lookup

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach LMS course/material behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate LMS course assignment/material collections directly
- non-LMS domains must not duplicate course teaching-team resolution or section-to-course staff checks
- callers must not bypass `isCourseTeachingStaff(...)` when enforcing staff-only LMS course actions

## `social-state-service.js`

Module:
- `backend/platform/domains/social-state-service.js`

Public API:
- `listSocialRelationshipsForUser(userId)`
- `saveSocialMutation(actorId, eventType, entityType, entityId, beforeState = null, afterState = null)`
- `ensureSocialProjectCollections()`
- `appendSocialProjectActivity(projectId, actorId, type, summary, extra = {})`
- `getSocialBootstrap(viewerUserId = '')`
- `upsertSocialState(social, actorId = '', reason = 'social-save')`
- `ensureSocialGroupChat(groupId, actorId = '')`

Owned state:
- `state.social` bootstrap/read projection for pages, groups, projects, events, relationships, reports, and lost/found
- social project activity collections and social-state audit/save flow

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach social bootstrap/state behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate social bootstrap or project-activity collections directly
- non-social domains must not duplicate social-state audit/save rules or bootstrap shaping
- callers must not bypass `ensureSocialGroupChat(...)` or `saveSocialMutation(...)` for social group chat and audit behavior

## `social-relationships-service.js`

Module:
- `backend/platform/domains/social-relationships-service.js`

Public API:
- `getSocialFollowerIds(targetType, targetId)`
- `isSocialFollowingTarget(userId, targetType, targetId)`
- `isSocialConnection(userA, userB)`
- `getPendingSocialConnectionRequestBetween(userA, userB)`
- `sendSocialConnectionRequest(fromUserId, toUserId)`
- `respondSocialConnectionRequest(relationshipId, actorId, accept = true)`
- `removeSocialConnection(userId, targetUserId)`
- `toggleSocialFollow(userId, targetType, targetId)`

Owned state:
- `state.social.relationships`
- social follow and connection-request lifecycle

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach relationship/follow behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate relationship or follow records directly
- non-social domains must not duplicate connection-request/follow lifecycle rules
- callers must not bypass social relationship store APIs for follow/connect/remove flows

## `social-projects-service.js`

Module:
- `backend/platform/domains/social-projects-service.js`

Public API:
- `getSocialProjectRecord(projectId)`
- `getSocialProjectByGroupId(groupId)`
- `getSocialProjectByChatId(chatId)`
- `getSocialProjectMemberRole(project, userId)`
- `getSocialProjectMemberIds(project)`
- `getSocialProjectAdvisorIds(project)`
- `canManageSocialProject(project, userId)`
- `canViewSocialProject(project, userId)`
- `canContributeToSocialProject(project, userId)`
- `decorateSocialProject(project, viewerUserId = '')`
- `createSocialProject(payload = {}, actorId = '')`
- `updateSocialProject(projectId, payload = {}, actorId = '')`
- `deleteSocialProject(projectId, actorId = '')`
- `inviteSocialProjectMember(projectId, memberId, role = 'member', actorId = '')`
- `updateSocialProjectMemberRole(projectId, memberId, role = 'member', actorId = '')`
- `removeSocialProjectMember(projectId, memberId, actorId = '')`
- `setSocialProjectMembership(projectId, userId, action = 'leave', actorId = '')`
- `createSocialProjectTask(projectId, payload = {}, actorId = '')`
- `updateSocialProjectTask(projectId, taskId, payload = {}, actorId = '')`
- `deleteSocialProjectTask(projectId, taskId, actorId = '')`
- `createSocialProjectMilestone(projectId, payload = {}, actorId = '')`
- `updateSocialProjectMilestone(projectId, milestoneId, payload = {}, actorId = '')`
- `deleteSocialProjectMilestone(projectId, milestoneId, actorId = '')`
- `createSocialProjectDeliverable(projectId, payload = {}, actorId = '')`
- `deleteSocialProjectDeliverable(projectId, deliverableId, actorId = '')`
- `createSocialProjectCheckin(projectId, payload = {}, actorId = '')`
- `createSocialProjectShowcasePage(projectId, actorId = '')`

Owned state:
- `state.social.projects`
- `state.social.projectTasks`
- `state.social.projectMilestones`
- `state.social.projectDeliverables`
- `state.social.projectCheckins`
- project workspace membership, metrics, and showcase lifecycle

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach project workspace behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate project workspace collections directly
- non-social domains must not duplicate project membership/task/milestone/showcase lifecycle rules
- callers must not bypass project store APIs for project CRUD or contribution flows

## `social-content-service.js`

Module:
- `backend/platform/domains/social-content-service.js`

Public API:
- `getSocialAccount(userId)`
- `isSocialAdmin(userId)`
- `getSocialActorDisplayName(userId)`
- `getSocialMentionableAccounts()`
- `resolveSocialMentionUserIds(value)`
- `notifySocialMentions({ actorId = '', targetType = 'post', targetId = '', sourceText = '', body = '' } = {})`
- `getSocialScopeRecord(scopeType, scopeId)`
- `canManageSocialScope(scopeType, scopeId, userId)`
- `buildSocialCommentTree(comments = [])`
- `findSocialCommentRecord(comments = [], commentId = '')`
- `collectSocialCommentThreadIds(comments = [], commentId = '')`
- `getSocialProfileRecord(userId = '')`
- `upsertSocialProfile(userId = '', payload = {}, actorId = '')`
- `resolveSocialPosts(postIds = [], viewerUserId = '')`
- `toggleSocialScopePostPin(scopeType, scopeId, postId, actorId = '')`
- `toggleSocialCommentReaction(postId, commentId, userId, reactionType = 'like')`
- `removeSocialComment(postId, commentId, actorId = '')`
- `resolveSocialReport(reportId, payload = {}, actorId = '')`
- `getSocialActorFacultyCode(userId)`
- `getSocialPageRecord(pageId)`
- `getSocialGroupRecord(groupId)`
- `getSocialGroupByChatId(chatId)`
- `getSocialPostRecord(postId)`
- `getSocialEventRecord(eventId)`
- `getSocialRelationshipRecord(relationshipId)`
- `getSocialGroupMemberIds(group)`
- `getSocialGroupJoinMap(group)`
- `getNextSocialGroupOwnerId(group, excludeUserId = '')`
- `normalizeSocialGroupState(group)`
- `getSocialGroupPendingIds(group)`
- `getSocialPageManagerIds(page)`
- `canManageSocialPage(page, userId)`
- `canManageSocialGroup(group, userId)`
- `isSocialGroupMember(group, userId)`
- `canViewSocialPage(page, userId)`
- `canViewSocialGroup(group, userId)`
- `canViewSocialEvent(event, userId)`
- `canDeleteSocialGroup(group, userId)`
- `canDeleteSocialPage(page, userId)`
- `canDeleteSocialEvent(event, userId)`
- `canEditSocialPost(post, userId)`
- `canViewSocialPost(post, userId)`
- `normalizeSocialComment(comment = {})`
- `decorateSocialPage(page, viewerUserId = '')`
- `decorateSocialGroup(group, viewerUserId = '')`
- `decorateSocialPost(post, viewerUserId = '')`
- `decorateSocialEvent(event, viewerUserId = '')`
- `listSocialFeed(filters = {})`
- `createSocialPage(payload = {}, actorId = '')`
- `createSocialGroup(payload = {}, actorId = '')`
- `updateSocialPage(pageId, payload = {}, actorId = '')`
- `updateSocialGroup(groupId, payload = {}, actorId = '')`
- `setSocialGroupMembership(groupId, userId, action = 'join', actorId = '')`
- `respondSocialGroupMembership(groupId, memberId, accept = true, actorId = '')`
- `removeSocialGroupMember(groupId, memberId, actorId = '')`
- `deleteSocialGroup(groupId, actorId = '')`
- `inviteSocialGroupMember(groupId, memberId, actorId = '', note = '')`
- `createSocialPost(payload = {}, actorId = '')`
- `updateSocialPost(postId, payload = {}, actorId = '')`
- `deleteSocialPost(postId, actorId = '')`
- `shareSocialPost(postId, payload = {}, actorId = '')`
- `toggleSocialReaction(postId, userId, reactionType = 'like')`
- `addSocialComment(postId, payload = {})`
- `createSocialEvent(payload = {}, actorId = '')`
- `respondSocialEventRsvp(eventId, userId, status = 'going')`
- `deleteSocialEvent(eventId, actorId = '')`
- `listSocialEvents(filters = {})`
- `createSocialReport(payload = {})`

Owned state:
- `state.social.pages`
- `state.social.groups`
- `state.social.posts`
- `state.social.events`
- `state.social.reports`
- `state.social.profiles`
- `state.social.rsvps`
- page/group/post/comment/event/report/profile lifecycle, decorators, and visibility/management rules

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach social content behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate social page/group/post/event/report/profile collections directly
- non-social domains must not duplicate social content visibility, moderation, or decoration rules
- callers must not bypass social content store APIs for page/group/post/event/report/profile flows

## `protected-exam-service.js`

Module:
- `backend/platform/domains/protected-exam-service.js`

Public API:
- `ensureProtectedQuizLaunch(ticket)`
- `ensureProtectedClientSession(token)`
- `ensureExamPortalSession(token)`
- `buildExamSessionCourseKey(sessionId)`
- `normalizeExamSessionStatus(status = 'scheduled')`
- `normalizeExamSessionRecord(payload = {}, existing = {})`
- `syncExamSession(payload = {})`
- `getExamSession(sessionId)`
- `deriveExamSessionRuntimeStatus(session = {})`
- `listExamSessionsForStudent(studentId)`
- `getExamPortalSession(token, options = {})`
- `createExamPortalSession(payload = {})`
- `listExamPortalVisibleSessions(token)`
- `getExamPortalSessionSummary(sessionId, token = '')`
- `createExamPortalLaunchTicket(sessionId, payload = {})`
- `findProtectedQuizRecord(courseId, quizId)`
- `ensureProtectedQuizAttemptRecord(quiz, student = {})`
- `buildProtectedQuizClientUrl(courseId, quizId)`
- `syncProtectedQuiz(payload = {})`
- `getProtectedQuiz(courseId, quizId)`
- `getProtectedClientSession(clientSessionToken, options = {})`
- `revokeProtectedClientSessions(courseId, quizId, studentId, exceptToken = '', reason = 'Protected quiz session was revoked.')`
- `getProtectedClientAttempt(courseId, quizId, clientSessionToken)`
- `createProtectedQuizLaunchTicket(payload = {})`
- `redeemProtectedQuizLaunch(payload = {})`
- `heartbeatProtectedQuiz(payload = {})`
- `recordProtectedQuizEvent(payload = {})`
- `updateProtectedQuizAttemptControl(payload = {}, action = '')`
- `manualGradeProtectedQuiz(payload = {})`
- `getProtectedQuizMonitor(courseId, quizId = '')`

Owned state:
- `state.examSessions`
- `state.examPortalSessions`
- `state.protectedQuizLaunches`
- `state.protectedClientSessions`
- protected-quiz attempt runtime, launch-ticket flow, and exam-portal session state

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach protected-exam behavior through injected store methods only

Forbidden cross-domain write paths:
- route modules must not mutate protected quiz attempts, exam portal sessions, or launch tickets directly
- non-protected-exam domains must not duplicate exam runtime status, anti-cheat launch, or protected-attempt audit-trail logic
- callers must not bypass protected-exam store APIs for redeem/heartbeat/manual-grade lifecycle transitions

## `notifications-service.js`

Module:
- `backend/platform/domains/notifications-service.js`

Public API:
- `isValidPushSubscriptionEndpoint(endpoint = '')`
- `createNotification(payload = {})`
- `listNotifications(userId, filters = {})`
- `markNotificationRead(notificationId, userId = '')`
- `updateNotificationPreferences(userId, preferences = {})`
- `upsertPushSubscription(userId, subscription = {}, metadata = {})`
- `listPushSubscriptions(userId = '')`
- `removePushSubscription(userId = '', endpoint = '')`

Owned state:
- `state.notifications`
- `state.notificationPreferences`
- `state.pushSubscriptions`
- notification read-state and push-endpoint validation rules

Allowed callers:
- `PlatformStore` wrapper methods in `backend/platform/store.js`
- route owners that reach notifications and push subscriptions through injected store methods only

Forbidden cross-domain write paths:
- route modules must not write notification or push-subscription records directly
- non-notification domains must not bypass `isValidPushSubscriptionEndpoint(...)` when accepting browser push endpoints
- callers must not duplicate notification preference persistence outside the store-owned API

## Route Ownership Contracts

### `files-routes.js`

Module:
- `backend/platform/routes/files-routes.js`

Owned routes:
- `POST /api/files/upload`
- `GET /api/files/:id`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no direct domain imports for files business logic

### `auth-routes.js`

Module:
- `backend/platform/routes/auth-routes.js`

Owned routes:
- `GET /api/portal/session`
- `POST /api/portal/session/login`
- `POST /api/portal/session/logout`
- `DELETE /api/session/impersonate-role`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no direct domain imports for auth/session business logic

### `platform-ops-routes.js`

Module:
- `backend/platform/routes/platform-ops-routes.js`

Owned routes:
- `GET /api/platform/config`
- `GET /api/platform/status`
- `GET /api/platform/readiness`
- `GET /api/platform/downloads`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no unrelated admin/account mutation handlers

### `admin-integrations-routes.js`

Module:
- `backend/platform/routes/admin-integrations-routes.js`

Owned routes:
- `GET /api/admin/accounts`
- `POST /api/admin/accounts`
- `POST /api/admin/accounts/:id/privileges`
- `POST /api/admin/reset-platform-state`
- `GET /api/admin/people`
- `POST /api/admin/people`
- `GET /api/integrations/systems`
- `POST /api/integrations/systems`
- `GET /api/integrations/sync-runs`
- `POST /api/integrations/sync-runs`
- `GET /api/integrations/conflicts`
- `POST /api/integrations/conflicts`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no audit ingestion or LMS/social route handlers in this module

### `admin-support-routes.js`

Module:
- `backend/platform/routes/admin-support-routes.js`

Owned routes:
- `GET /api/audit/events`
- `POST /api/audit/events`
- `POST /api/admin/holds`
- `POST /api/admin/sections`
- `POST /api/admin/import-jobs`
- `GET /api/admin/import-jobs/:id`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no unrelated account/integration mutation handlers in this module

### `student-service-routes.js`

Module:
- `backend/platform/routes/student-service-routes.js`

Owned routes:
- `GET /api/student-service/bootstrap`
- `POST /api/student-service/tickets`
- `POST /api/student-service/tickets/:id/replies`
- `POST /api/student-service/tickets/:id/status`
- `POST /api/student-service/tickets/:id/assign`
- `POST /api/student-service/tickets/:id/internal-notes`
- `POST /api/student-service/tickets/:id/handoff`
- `POST /api/student-service/articles`
- `POST /api/student-service/questions`
- `POST /api/student-service/questions/:id/answers`
- `POST /api/student-service/questions/:id/feedback`
- `POST /api/student-service/questions/:id/accept-answer`
- `POST /api/student-service/questions/:id/publish`
- `POST /api/student-service/questions/:id/flags`
- `POST /api/student-service/questions/:id/convert-to-ticket`
- `POST /api/student-service/questions/:id/convert-to-article`
- `POST /api/student-service/questions/:id/merge`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no direct Student Service record normalization inside the route module
- no unrelated LMS/social/messenger route handlers in this module

### `gradebook-routes.js`

Module:
- `backend/platform/routes/gradebook-routes.js`

Owned routes:
- `GET /api/gradebook/courses/:id`
- `POST /api/gradebook/scores`
- `POST /api/gradebook/publish`
- `POST /api/gradebook/finalize`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no direct gradebook authorization branching outside `requireGradebookCourseAccess(...)`
- no unrelated LMS/social/protected-quiz route handlers in this module

### `protected-exam-routes.js`

Module:
- `backend/platform/routes/protected-exam-routes.js`

Owned routes:
- `POST /api/exam-portal/auth`
- `GET /api/exam-portal/sessions`
- `GET /api/exam-portal/session/:sessionId`
- `POST /api/exam-portal/sessions/:sessionId/launch-ticket`
- `POST /api/protected-quizzes/sync`
- `POST /api/protected-quizzes/:quizId/launch-ticket`
- `POST /api/protected-client/redeem-launch`
- `GET /api/protected-quizzes/group/:groupKey/monitor`
- `GET /api/protected-quizzes/:quizId/attempts`
- `GET /api/protected-quizzes/:quizId/attempt`
- `POST /api/protected-quizzes/:quizId/heartbeat`
- `POST /api/protected-quizzes/:quizId/events`
- `POST /api/protected-quizzes/:quizId/submit`
- `POST /api/protected-quizzes/:quizId/students/:studentId/block`
- `POST /api/protected-quizzes/:quizId/students/:studentId/unblock`
- `POST /api/protected-quizzes/:quizId/students/:studentId/force-submit`
- `POST /api/protected-quizzes/:quizId/students/:studentId/reset-warnings`
- `POST /api/protected-quizzes/:quizId/students/:studentId/approve-reconnect`
- `POST /api/protected-quizzes/:quizId/students/:studentId/override-status`
- `POST /api/protected-quizzes/:quizId/manual-grade`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated anti-cheat/session-token gate logic outside the existing injected helper functions
- no unrelated gradebook/social route handlers in this module

### `messenger-calls-routes.js`

Module:
- `backend/platform/routes/messenger-calls-routes.js`

Owned routes:
- `GET /api/messenger/snapshot`
- `POST /api/messenger/direct`
- `POST /api/messenger/message`
- `DELETE /api/messenger/chats/:chatId/messages/:messageId`
- `POST /api/messenger/chats/:chatId/hide`
- `POST /api/calls/start`
- `POST /api/calls/accept`
- `POST /api/calls/decline`
- `POST /api/calls/end`
- `POST /api/calls/join`
- `POST /api/calls/leave`
- `POST /api/calls/signal`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated membership validation outside the route owner or store-owned helpers
- no unrelated social CRUD or LMS route handlers in this module

### `social-routes.js`

Module:
- `backend/platform/routes/social-routes.js`

Owned routes:
- `GET /api/social/bootstrap`
- `POST /api/social/state`
- `POST /api/social/group-chat`
- `GET /api/social/feed`
- `POST /api/social/posts/resolve`
- `GET /api/social/events`
- `POST /api/social/pages`
- `POST /api/social/pages/:id`
- `POST /api/social/groups`
- `POST /api/social/groups/:id`
- `DELETE /api/social/groups/:id`
- `POST /api/social/groups/:id/membership`
- `POST /api/social/groups/:id/membership/:memberId`
- `DELETE /api/social/groups/:id/members/:memberId`
- `POST /api/social/groups/:id/invite`
- `POST /api/social/projects`
- `POST /api/social/projects/:id`
- `DELETE /api/social/projects/:id`
- `POST /api/social/projects/:id/membership`
- `POST /api/social/projects/:id/invite`
- `POST /api/social/projects/:id/members/:memberId`
- `DELETE /api/social/projects/:id/members/:memberId`
- `POST /api/social/projects/:id/tasks`
- `POST /api/social/projects/:id/tasks/:taskId`
- `DELETE /api/social/projects/:id/tasks/:taskId`
- `POST /api/social/projects/:id/milestones`
- `POST /api/social/projects/:id/milestones/:milestoneId`
- `DELETE /api/social/projects/:id/milestones/:milestoneId`
- `POST /api/social/projects/:id/deliverables`
- `DELETE /api/social/projects/:id/deliverables/:deliverableId`
- `POST /api/social/projects/:id/checkins`
- `POST /api/social/projects/:id/showcase`
- `POST /api/social/relationships/request`
- `POST /api/social/relationships/:id/respond`
- `POST /api/social/relationships/remove`
- `POST /api/social/follows/toggle`
- `POST /api/social/posts`
- `PATCH /api/social/posts/:id`
- `DELETE /api/social/posts/:id`
- `POST /api/social/posts/:id/share`
- `POST /api/social/posts/:id/reactions`
- `POST /api/social/posts/:id/comments`
- `POST /api/social/posts/:id/comments/:commentId/reactions`
- `DELETE /api/social/posts/:id/comments/:commentId`
- `POST /api/social/posts/:id/pin`
- `POST /api/social/reports`
- `POST /api/social/reports/:id/resolve`
- `POST /api/social/profiles/:id`
- `POST /api/social/events`
- `POST /api/social/events/:id/rsvp`
- `DELETE /api/social/events/:id`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no caller-owned actor ids for social mutations
- no unrelated messenger/calls or LMS route handlers in this module

### `lms-live-quiz-routes.js`

Module:
- `backend/platform/routes/lms-live-quiz-routes.js`

Owned routes:
- `GET /api/lms/live-quizzes/:resourceKey`
- `POST /api/lms/live-quizzes/:resourceKey`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated student-answer merge logic outside `mergeStudentLiveQuizAnswer(...)`
- no unrelated gradebook/protected-exam/social route handlers in this module

### `academic-routes.js`

Module:
- `backend/platform/routes/academic-routes.js`

Owned routes:
- `GET /api/catalog/courses`
- `GET /api/catalog/sections`
- `GET /api/students/:id/eligibility`
- `GET /api/students/:id/enrollments`
- `POST /api/registration/enroll`
- `POST /api/registration/drop`
- `GET /api/lms/courses/:id`
- `POST /api/lms/assignments`
- `POST /api/lms/materials`
- `POST /api/exam-sessions/sync`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated student academic access checks outside the injected helper functions
- no unrelated social/messenger/protected-exam route handlers in this module

### `news-routes.js`

Module:
- `backend/platform/routes/news-routes.js`

Owned routes:
- `GET /api/news/feed`
- `GET /api/news/privileges`
- `POST /api/news/posts`
- `PATCH /api/news/posts/:id`
- `POST /api/news/posts/:id/replies`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no caller-owned actor ids for news mutations
- no unrelated portal bootstrap/mail/LMS route handlers in this module

### `microsoft-auth-routes.js`

Module:
- `backend/platform/routes/microsoft-auth-routes.js`

Owned routes:
- `GET /api/portal/microsoft/config`
- `GET /api/portal/microsoft/start`
- `POST /api/portal/microsoft/complete`
- `GET /api/portal/microsoft/callback`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated Microsoft OAuth completion/state logic outside the route owner and store APIs
- no unrelated mail/message or general portal support handlers in this module

### `mail-routes.js`

Module:
- `backend/platform/routes/mail-routes.js`

Owned routes:
- `GET /api/mail/bootstrap`
- `GET /api/mail/connect/start`
- `GET /api/mail/connect/callback`
- `DELETE /api/mail/connection`
- `POST /api/mail/sync`
- `GET /api/mail/messages`
- `GET /api/mail/messages/:id`
- `GET /api/mail/messages/:id/attachments/:attachmentId`
- `POST /api/mail/messages/send`
- `POST /api/mail/messages/:id/reply`
- `POST /api/mail/messages/:id/read-state`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated Outlook mailbox connect/sync/send logic outside the route owner and existing helper functions
- no unrelated portal bootstrap/news/social handlers in this module

### `portal-support-routes.js`

Module:
- `backend/platform/routes/portal-support-routes.js`

Owned routes:
- `GET /api/bootstrap`
- `GET /api/portal/bootstrap`
- `POST /api/portal/state`
- `GET /api/me`
- `GET /api/events`
- `GET /api/accounts`
- `POST /api/accounts/upsert`
- `GET /api/notifications`
- `POST /api/notifications/read`
- `POST /api/notifications/preferences`
- `GET /api/push/public-config`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated SSE registration or push public-config logic outside this route owner and shared helpers
- no unrelated Microsoft/mail or academic CRUD handlers in this module

### `system-routes.js`

Module:
- `backend/platform/routes/system-routes.js`

Owned routes:
- `GET /download`
- `GET /download/file`
- `GET /download/:platform`
- `GET /download/:platform/file`
- `GET /health`
- `GET /ready`
- `POST /api/ai/career-completion`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no unrelated auth/session or portal/mail handlers in this module

### `auth-maintenance-routes.js`

Module:
- `backend/platform/routes/auth-maintenance-routes.js`

Owned routes:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/session/impersonate-role`
- `POST /api/auth/activate`
- `POST /api/auth/request-reset`
- `POST /api/auth/reset-password`

Allowed callers:
- `backend/platform/server.js` mount wiring only

Forbidden boundaries:
- no direct `require('./store')`
- no duplicated login/reset rate-limit logic outside this route owner and existing shared helpers
- no unrelated portal bootstrap/mail/news/social handlers in this module

## Composition Helper Contracts

### `server.js` composition root

Module:
- `backend/platform/server.js`

Owned responsibilities:
- route-module registration and dependency injection for every `register*Routes(...)` owner under `backend/platform/routes/`
- startup-time `PlatformStore` creation and runtime wiring
- shared helper seams that are intentionally centralized while route ownership is already split

Allowed callers:
- route modules through injected dependencies only
- no route or domain module should treat `server.js` as a general utility bag

Forbidden boundaries:
- `server.js` must not grow route handlers inline again
- route modules must not recreate request/session/rate-limit/bootstrap logic that is already owned here
- domain modules must not depend on Express request/response semantics

### Session and actor helper family

Module owner:
- `backend/platform/server.js`

Public helper surface:
- `getSessionToken(request)`
- `getSessionAccount(request)`
- `getSessionRole(sessionAccount)`
- `getActualSessionRole(sessionAccount)`
- `getActorUserId(sessionAccount)`
- `isActualAdminSession(sessionAccount)`
- `resolveSessionBoundUserId(sessionAccount, requestedUserId = '')`
- `requireSessionAccount(request, response)`
- `requireSessionRole(request, response, allowedRoles = STAFF_ROLES)`
- `requireActualSessionRole(request, response, allowedRoles = STAFF_ROLES)`
- `getSessionActor(sessionAccount = {})`

Allowed callers:
- `auth-routes.js`
- `auth-maintenance-routes.js`
- `portal-support-routes.js`
- `academic-routes.js`
- `student-service-routes.js`
- `social-routes.js`
- `news-routes.js`
- `messenger-calls-routes.js`
- `protected-exam-routes.js`
- `gradebook-routes.js`
- `admin-support-routes.js`
- `admin-integrations-routes.js`

Forbidden cross-boundary behavior:
- route modules must not parse session headers or impersonation state independently
- route modules must not invent caller-owned actor ids when session-bound helpers already exist

### Runtime delivery and throttling helper family

Module owner:
- `backend/platform/server.js`

Public helper surface:
- `registerSseClient(userId, response)`
- `unregisterSseClient(userId, response)`
- `pushEvent(userIds, payload)`
- `broadcastAll(payload)`
- `getWebPushConfig()`
- `sendWebPushNotification(recipientUserId = '', notification = {})`
- `enforceRateLimit(request, response, key, max, windowMs)`

Allowed callers:
- `portal-support-routes.js`
- `social-routes.js`
- `news-routes.js`
- `messenger-calls-routes.js`
- `student-service-routes.js`
- `lms-live-quiz-routes.js`
- `protected-exam-routes.js`
- `auth-maintenance-routes.js`
- `system-routes.js`

Forbidden cross-boundary behavior:
- route modules must not maintain independent SSE client registries
- route modules must not introduce parallel in-memory rate-limit buckets outside `server.js`
- route modules must not bypass the shared push config/runtime when emitting platform notifications

### Academic and protected-access helper family

Module owner:
- `backend/platform/server.js`

Public helper surface:
- `mergeStudentLiveQuizAnswer(existingWorkspace = {}, submittedWorkspace = {}, sessionAccount = null)`
- `requireLmsLiveQuizWorkspaceAccess(request, response, resourceKey, action = 'read')`
- `requireGradebookCourseAccess(request, response, allowedRoles, courseId, action = 'read')`
- `requireCourseStaffAccess(request, response, courseId, action = 'read', allowedRoles = STAFF_ROLES)`
- `canAccessStudentAcademicRecord(sessionAccount, studentId = '')`
- `requireProtectedQuizSession(request, response, courseId, quizId, options = {})`
- `requireAntiCheatBrowserRequest(request, response)`
- `requireExamPortalSession(request, response, options = {})`

Allowed callers:
- `lms-live-quiz-routes.js`
- `academic-routes.js`
- `gradebook-routes.js`
- `protected-exam-routes.js`

Forbidden cross-boundary behavior:
- route modules must not duplicate LMS workspace merge rules or gradebook/course authorization branches inline
- route modules must not reimplement protected-quiz or exam-portal token/session gates outside these helpers

### Microsoft and mail integration helper family

Module owner:
- `backend/platform/server.js`

Public helper surface:
- `getMicrosoftConfig()`
- `getMicrosoftMailConfig()`
- `normalizeMicrosoftReturnTo(returnTo = '')`
- `buildMicrosoftPortalRedirect(returnTo = '', extras = {})`
- `normalizeMailReturnTo(returnTo = '')`
- `buildMailPortalRedirect(returnTo = '', extras = {})`
- `decodeJwtPayload(token = '')`
- `exchangeMicrosoftAuthorizationCode(config, code)`
- `fetchMicrosoftProfile(config, accessToken)`
- `fetchMicrosoftGraphJson(config, accessToken, graphPath, options = {})`
- `fetchMicrosoftGraphBinary(config, accessToken, graphPath, options = {})`
- `fetchMicrosoftMailMessage(config, accessToken, messageId)`
- `getMicrosoftMailAccess(userId)`
- `syncMailboxCacheForUser(userId, actorRole, options = {})`
- `buildGraphSendAttachments(rawAttachments = [], actorUserId = '')`
- `buildMailAuditEvent(userId, actorRole, eventType, entityType, entityId, extras = {})`
- `splitMicrosoftScope(scope = '')`
- `getBootstrapMailFolderMessages(userId, folderKey, options = {})`

Allowed callers:
- `microsoft-auth-routes.js`
- `mail-routes.js`
- `platform-ops-routes.js` for read-only Microsoft/mail configuration exposure

Forbidden cross-boundary behavior:
- non-mail route modules must not embed OAuth token exchange or Microsoft Graph fetch logic
- route modules must not build mail audit records or mailbox cache writes outside the injected helper surface

## Current Gaps

- The extracted route families still depend on `PlatformStore` as the composition owner rather than calling smaller domain-specific store facades.
- LMS live quiz persistence is now stored under the dedicated `state.portal.liveQuizWorkspaces` owner and only mirrored into the client bootstrap contract, but other portal runtime slices still share the broader `state.portal.state` record.
- Files domain access checks still read across chat, social, Student Service, and LMS bootstrap/state because narrower read contracts are not defined yet.
- The remaining `server.js` seams are now contract-documented, but they are still centralized helpers rather than extracted helper modules with their own tests.

## Verification Hooks

Use these checks when updating this contract:

- `npm run check:platform`
- `npx vitest run test/backend-platform-contracts.test.js`

The test should fail if:

- an extracted route owner imports `./store` directly
- the documented public APIs disappear
- the contract doc stops matching the extracted ownership surface
