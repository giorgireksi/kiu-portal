import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('backend platform domain contracts', () => {
    it('keeps the contract doc aligned with the extracted domain public APIs', () => {
        const contracts = readSource('docs/BACKEND_PLATFORM_DOMAIN_CONTRACTS.md');
        const server = readSource('backend/platform/server.js');
        const accountsService = require('../backend/platform/domains/accounts-service.js');
        const authSessionService = require('../backend/platform/domains/auth-session-service.js');
        const accountPrivilegesService = require('../backend/platform/domains/account-privileges-service.js');
        const filesService = require('../backend/platform/domains/files-service.js');
        const auditService = require('../backend/platform/domains/audit-service.js');
        const gradebookService = require('../backend/platform/domains/gradebook-service.js');
        const lmsCourseService = require('../backend/platform/domains/lms-course-service.js');
        const protectedExamService = require('../backend/platform/domains/protected-exam-service.js');
        const socialContentService = require('../backend/platform/domains/social-content-service.js');
        const socialProjectsService = require('../backend/platform/domains/social-projects-service.js');
        const socialRelationshipsService = require('../backend/platform/domains/social-relationships-service.js');
        const socialStateService = require('../backend/platform/domains/social-state-service.js');
        const notificationsService = require('../backend/platform/domains/notifications-service.js');
        const studentService = require('../backend/platform/domains/student-service-service.js');

        expect(contracts).toContain('## `accounts-service.js`');
        expect(contracts).toContain('## `auth-session-service.js`');
        expect(contracts).toContain('## `account-privileges-service.js`');
        expect(contracts).toContain('## `gradebook-service.js`');
        expect(contracts).toContain('## `lms-course-service.js`');
        expect(contracts).toContain('## `protected-exam-service.js`');
        expect(contracts).toContain('## `social-content-service.js`');
        expect(contracts).toContain('## `social-projects-service.js`');
        expect(contracts).toContain('## `social-relationships-service.js`');
        expect(contracts).toContain('## `social-state-service.js`');
        expect(contracts).toContain('## `files-service.js`');
        expect(contracts).toContain('## `audit-service.js`');
        expect(contracts).toContain('## `notifications-service.js`');
        expect(contracts).toContain('## `student-service-service.js`');

        expect(Object.keys(accountsService).sort()).toEqual([
            'ensurePersonFromAccount',
            'getAccountByEmail',
            'getAccountById',
            'listAccounts',
            'upsertAccount'
        ]);
        expect(Object.keys(authSessionService).sort()).toEqual([
            'activateAccount',
            'clearSessionImpersonation',
            'createSessionByCredentials',
            'createSessionByMicrosoftIdentity',
            'createSessionForAccount',
            'ensureCredential',
            'getRawAccountByEmail',
            'getRawAccountByMicrosoftOid',
            'getSession',
            'linkMicrosoftIdentityToAccount',
            'logoutSession',
            'requestPasswordReset',
            'resetPassword',
            'revokeSessionsForUser',
            'updateSessionImpersonation',
            'upgradeCredentialHashIfNeeded'
        ]);
        expect(Object.keys(accountPrivilegesService).sort()).toEqual([
            'accountHasPrivilege',
            'getEffectiveAccountPrivileges',
            'getGrantedAccountPrivileges',
            'listPrivilegeDefinitions',
            'updateAccountPrivileges'
        ]);
        expect(Object.keys(gradebookService).sort()).toEqual([
            'aggregateGradebookAssessmentEntries',
            'canAccessGradebookCourse',
            'computeRecordFinalScore',
            'ensureGradebook',
            'finalizeGrades',
            'getGradebookAssessmentDefinition',
            'getGradebookCourse',
            'publishGradebook',
            'setScore'
        ]);
        expect(Object.keys(lmsCourseService).sort()).toEqual([
            'createAssignment',
            'createMaterial',
            'ensureLmsCourse',
            'getLmsCourse',
            'getSectionsByCourse',
            'getStudentEnrollmentsByCourse',
            'isCourseTeachingStaff'
        ]);
        expect(Object.keys(protectedExamService).sort()).toEqual([
            'buildExamSessionCourseKey',
            'buildProtectedQuizClientUrl',
            'createExamPortalLaunchTicket',
            'createExamPortalSession',
            'createProtectedQuizLaunchTicket',
            'deriveExamSessionRuntimeStatus',
            'ensureExamPortalSession',
            'ensureProtectedClientSession',
            'ensureProtectedQuizAttemptRecord',
            'ensureProtectedQuizLaunch',
            'findProtectedQuizRecord',
            'getExamPortalSession',
            'getExamPortalSessionSummary',
            'getExamSession',
            'getProtectedClientAttempt',
            'getProtectedClientSession',
            'getProtectedQuiz',
            'getProtectedQuizMonitor',
            'heartbeatProtectedQuiz',
            'listExamPortalVisibleSessions',
            'listExamSessionsForStudent',
            'manualGradeProtectedQuiz',
            'normalizeExamSessionRecord',
            'normalizeExamSessionStatus',
            'recordProtectedQuizEvent',
            'redeemProtectedQuizLaunch',
            'revokeProtectedClientSessions',
            'syncExamSession',
            'syncProtectedQuiz',
            'updateProtectedQuizAttemptControl'
        ]);
        expect(Object.keys(socialContentService).sort()).toEqual([
            'addSocialComment',
            'buildSocialCommentTree',
            'canDeleteSocialEvent',
            'canDeleteSocialGroup',
            'canDeleteSocialPage',
            'canEditSocialPost',
            'canManageSocialGroup',
            'canManageSocialPage',
            'canManageSocialScope',
            'canViewSocialEvent',
            'canViewSocialGroup',
            'canViewSocialPage',
            'canViewSocialPost',
            'collectSocialCommentThreadIds',
            'createSocialEvent',
            'createSocialGroup',
            'createSocialPage',
            'createSocialPost',
            'createSocialReport',
            'decorateSocialEvent',
            'decorateSocialGroup',
            'decorateSocialPage',
            'decorateSocialPost',
            'deleteSocialEvent',
            'deleteSocialGroup',
            'deleteSocialPost',
            'findSocialCommentRecord',
            'getNextSocialGroupOwnerId',
            'getSocialAccount',
            'getSocialActorDisplayName',
            'getSocialActorFacultyCode',
            'getSocialEventRecord',
            'getSocialGroupByChatId',
            'getSocialGroupJoinMap',
            'getSocialGroupMemberIds',
            'getSocialGroupPendingIds',
            'getSocialGroupRecord',
            'getSocialMentionableAccounts',
            'getSocialPageManagerIds',
            'getSocialPageRecord',
            'getSocialPostRecord',
            'getSocialProfileRecord',
            'getSocialRelationshipRecord',
            'getSocialScopeRecord',
            'inviteSocialGroupMember',
            'isSocialAdmin',
            'isSocialGroupMember',
            'listSocialEvents',
            'listSocialFeed',
            'normalizeSocialComment',
            'normalizeSocialGroupState',
            'notifySocialMentions',
            'removeSocialComment',
            'removeSocialGroupMember',
            'resolveSocialMentionUserIds',
            'resolveSocialPosts',
            'resolveSocialReport',
            'respondSocialEventRsvp',
            'respondSocialGroupMembership',
            'setSocialGroupMembership',
            'shareSocialPost',
            'toggleSocialCommentReaction',
            'toggleSocialReaction',
            'toggleSocialScopePostPin',
            'updateSocialGroup',
            'updateSocialPage',
            'updateSocialPost',
            'upsertSocialProfile'
        ]);
        expect(Object.keys(socialProjectsService).sort()).toEqual([
            'canContributeToSocialProject',
            'canManageSocialProject',
            'canViewSocialProject',
            'createSocialProject',
            'createSocialProjectCheckin',
            'createSocialProjectDeliverable',
            'createSocialProjectMilestone',
            'createSocialProjectShowcasePage',
            'createSocialProjectTask',
            'decorateSocialProject',
            'deleteSocialProject',
            'deleteSocialProjectDeliverable',
            'deleteSocialProjectMilestone',
            'deleteSocialProjectTask',
            'getSocialProjectAdvisorIds',
            'getSocialProjectByChatId',
            'getSocialProjectByGroupId',
            'getSocialProjectMemberIds',
            'getSocialProjectMemberRole',
            'getSocialProjectRecord',
            'inviteSocialProjectMember',
            'removeSocialProjectMember',
            'setSocialProjectMembership',
            'updateSocialProject',
            'updateSocialProjectMemberRole',
            'updateSocialProjectMilestone',
            'updateSocialProjectTask'
        ]);
        expect(Object.keys(socialRelationshipsService).sort()).toEqual([
            'getPendingSocialConnectionRequestBetween',
            'getSocialFollowerIds',
            'isSocialConnection',
            'isSocialFollowingTarget',
            'removeSocialConnection',
            'respondSocialConnectionRequest',
            'sendSocialConnectionRequest',
            'toggleSocialFollow'
        ]);
        expect(Object.keys(socialStateService).sort()).toEqual([
            'appendSocialProjectActivity',
            'ensureSocialGroupChat',
            'ensureSocialProjectCollections',
            'getSocialBootstrap',
            'listSocialRelationshipsForUser',
            'saveSocialMutation',
            'upsertSocialState'
        ]);
        expect(Object.keys(filesService).sort()).toEqual([
            'canActorAccessStoredFile',
            'createFileFromUpload',
            'getFile',
            'normalizeMessageAttachment',
            'objectContainsStoredFileReference'
        ]);
        expect(Object.keys(auditService).sort()).toEqual([
            'addAuditEvent'
        ]);
        expect(Object.keys(notificationsService).sort()).toEqual([
            'createNotification',
            'isValidPushSubscriptionEndpoint',
            'listNotifications',
            'listPushSubscriptions',
            'markNotificationRead',
            'removePushSubscription',
            'updateNotificationPreferences',
            'upsertPushSubscription'
        ]);
        expect(Object.keys(studentService).sort()).toEqual([
            'STUDENT_SERVICE_CATEGORIES',
            'STUDENT_SERVICE_DEFAULT_ARTICLES',
            'STUDENT_SERVICE_DEFAULT_MACROS',
            'STUDENT_SERVICE_RESPONDER_CATEGORIES',
            'STUDENT_SERVICE_SENSITIVE_CATEGORIES',
            'getStudentServiceAreaForCategory',
            'getStudentServiceBootstrap',
            'normalizeStudentServiceAnswerRecord',
            'normalizeStudentServiceArticleRecord',
            'normalizeStudentServiceCategory',
            'normalizeStudentServiceInternalNote',
            'normalizeStudentServiceMacroRecord',
            'normalizeStudentServiceQuestionRecord',
            'normalizeStudentServiceReviewQueueEntry',
            'normalizeStudentServiceThreadEntry',
            'normalizeStudentServiceTicketRecord'
        ]);

        expect(contracts).toContain('ensurePersonFromAccount(account)');
        expect(contracts).toContain('listAccounts(filters = {})');
        expect(contracts).toContain('upsertAccount(payload = {})');
        expect(contracts).toContain('ensureCredential(userId)');
        expect(contracts).toContain("createSessionForAccount(accountId, options = {})");
        expect(contracts).toContain("requestPasswordReset(email)");
        expect(contracts).toContain("updateSessionImpersonation(token, impersonatedRole)");
        expect(contracts).toContain('listPrivilegeDefinitions()');
        expect(contracts).toContain("accountHasPrivilege(accountOrUserId, privilegeId = '')");
        expect(contracts).toContain("updateAccountPrivileges(accountId, payload = {}, actorId = '')");
        expect(contracts).toContain('ensureGradebook(courseId)');
        expect(contracts).toContain("canAccessGradebookCourse(courseId, userId, role = '', action = 'read')");
        expect(contracts).toContain("setScore(payload = {})");
        expect(contracts).toContain('ensureLmsCourse(courseId)');
        expect(contracts).toContain("createAssignment(payload = {})");
        expect(contracts).toContain("isCourseTeachingStaff(courseId, userId, role = '')");
        expect(contracts).toContain('ensureProtectedQuizLaunch(ticket)');
        expect(contracts).toContain("createExamPortalSession(payload = {})");
        expect(contracts).toContain("redeemProtectedQuizLaunch(payload = {})");
        expect(contracts).toContain('getSocialBootstrap(viewerUserId = \'\')');
        expect(contracts).toContain("upsertSocialState(social, actorId = '', reason = 'social-save')");
        expect(contracts).toContain("ensureSocialGroupChat(groupId, actorId = '')");
        expect(contracts).toContain('getSocialFollowerIds(targetType, targetId)');
        expect(contracts).toContain('sendSocialConnectionRequest(fromUserId, toUserId)');
        expect(contracts).toContain('toggleSocialFollow(userId, targetType, targetId)');
        expect(contracts).toContain('getSocialProjectRecord(projectId)');
        expect(contracts).toContain("createSocialProject(payload = {}, actorId = '')");
        expect(contracts).toContain("createSocialProjectTask(projectId, payload = {}, actorId = '')");
        expect(contracts).toContain('getSocialAccount(userId)');
        expect(contracts).toContain("createSocialPage(payload = {}, actorId = '')");
        expect(contracts).toContain("createSocialPost(payload = {}, actorId = '')");
        expect(contracts).toContain('createFileFromUpload(payload = {})');
        expect(contracts).toContain('addAuditEvent(payload = {})');
        expect(contracts).toContain('isValidPushSubscriptionEndpoint(endpoint = \'\')');
        expect(contracts).toContain('upsertPushSubscription(userId, subscription = {}, metadata = {})');
        expect(contracts).toContain('normalizeStudentServiceTicketRecord(ticket = {}, index = 0)');
        expect(contracts).toContain("GET /api/platform/status");
        expect(contracts).toContain("POST /api/admin/accounts/:id/privileges");
        expect(contracts).toContain("POST /api/audit/events");
        expect(contracts).toContain("GET /api/student-service/bootstrap");
        expect(contracts).toContain("POST /api/student-service/questions/:id/merge");
        expect(contracts).toContain("GET /api/gradebook/courses/:id");
        expect(contracts).toContain("POST /api/gradebook/finalize");
        expect(contracts).toContain("POST /api/exam-portal/auth");
        expect(contracts).toContain("POST /api/protected-quizzes/:quizId/manual-grade");
        expect(contracts).toContain("GET /api/messenger/snapshot");
        expect(contracts).toContain("POST /api/calls/signal");
        expect(contracts).toContain("POST /api/social/relationships/request");
        expect(contracts).toContain("DELETE /api/social/posts/:id");
        expect(contracts).toContain("GET /api/lms/live-quizzes/:resourceKey");
        expect(contracts).toContain("POST /api/lms/live-quizzes/:resourceKey");
        expect(contracts).toContain("GET /api/catalog/courses");
        expect(contracts).toContain("POST /api/exam-sessions/sync");
        expect(contracts).toContain("GET /api/portal/microsoft/config");
        expect(contracts).toContain("GET /api/mail/messages");
        expect(contracts).toContain("GET /api/bootstrap");
        expect(contracts).toContain("POST /api/push/subscribe");
        expect(contracts).toContain("POST /api/auth/logout");
        expect(contracts).toContain("GET /download");
        expect(contracts).toContain("GET /api/news/feed");
        expect(contracts).toContain("POST /api/news/posts/:id/replies");

        expect(contracts).toContain('## Composition Helper Contracts');
        expect(contracts).toContain('### `server.js` composition root');
        expect(contracts).toContain('### Session and actor helper family');
        expect(contracts).toContain('### Runtime delivery and throttling helper family');
        expect(contracts).toContain('### Academic and protected-access helper family');
        expect(contracts).toContain('### Microsoft and mail integration helper family');
        expect(contracts).toContain('getSessionToken(request)');
        expect(contracts).toContain('registerSseClient(userId, response)');
        expect(contracts).toContain("enforceRateLimit(request, response, key, max, windowMs)");
        expect(contracts).toContain("requireProtectedQuizSession(request, response, courseId, quizId, options = {})");
        expect(contracts).toContain("getMicrosoftMailAccess(userId)");

        expect(server).toContain('function getSessionToken(request) {');
        expect(server).toContain('function registerSseClient(userId, response) {');
        expect(server).toContain('function enforceRateLimit(request, response, key, max, windowMs) {');
        expect(server).toContain('function requireProtectedQuizSession(request, response, courseId, quizId, options = {}) {');
        expect(server).toContain('async function getMicrosoftMailAccess(userId) {');
    });

    it('keeps extracted route owners on dependency injection instead of importing the store directly', () => {
        const routeFiles = [
            'backend/platform/routes/files-routes.js',
            'backend/platform/routes/auth-routes.js',
            'backend/platform/routes/platform-ops-routes.js',
            'backend/platform/routes/admin-integrations-routes.js',
            'backend/platform/routes/admin-support-routes.js',
            'backend/platform/routes/student-service-routes.js',
            'backend/platform/routes/gradebook-routes.js',
            'backend/platform/routes/protected-exam-routes.js',
            'backend/platform/routes/messenger-calls-routes.js',
            'backend/platform/routes/social-routes.js',
            'backend/platform/routes/lms-live-quiz-routes.js',
            'backend/platform/routes/academic-routes.js',
            'backend/platform/routes/news-routes.js',
            'backend/platform/routes/microsoft-auth-routes.js',
            'backend/platform/routes/mail-routes.js',
            'backend/platform/routes/portal-support-routes.js',
            'backend/platform/routes/system-routes.js',
            'backend/platform/routes/auth-maintenance-routes.js'
        ];

        routeFiles.forEach((relativePath) => {
            const source = readSource(relativePath);
            expect(source).not.toContain("require('./store')");
            expect(source).not.toContain("require('../store')");
            expect(source).not.toContain("require('./domains/");
            expect(source).not.toContain("require('../domains/");
        });
    });

    it('keeps server.js as a composition root instead of reintroducing inline route handlers', () => {
        const server = readSource('backend/platform/server.js');

        expect(server).not.toMatch(/app\.(get|post|put|patch|delete)\(/);
        expect(server).toContain('registerPlatformOpsRoutes(app, {');
        expect(server).toContain('registerPortalSupportRoutes(app, {');
        expect(server).toContain('registerProtectedExamRoutes(app, {');
        expect(server).toContain('registerMailRoutes(app, {');
    });
});
