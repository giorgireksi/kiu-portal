const fs = require('fs');
const net = require('net');
const {
    asArray,
    buildPasswordHash,
    clone,
    decryptSecret,
    displayInitials,
    encryptSecret,
    isPasswordHash,
    makeId,
    matchesSearch,
    normalizeCode,
    normalizeEmail,
    nowIso,
    paginate,
    safeNumber,
    sanitizeAccount,
    uniqueStrings,
    verifyPassword,
} = require('./utils');
const { createEmptyPlatformState, createEmptySocialState, createEmptyNewsState, createEmptyStudentServiceState } = require('./state-shape');
const { PostgresRecordStore } = require('./postgres-record-store');
const { LocalRecordStore } = require('./local-record-store');
const { addAuditEvent } = require('./domains/audit-service');
const {
    canActorAccessStoredFile,
    createFileFromUpload,
    getFile,
    normalizeMessageAttachment,
    objectContainsStoredFileReference
} = require('./domains/files-service');
const {
    STUDENT_SERVICE_CATEGORIES,
    STUDENT_SERVICE_DEFAULT_ARTICLES,
    STUDENT_SERVICE_DEFAULT_MACROS,
    STUDENT_SERVICE_RESPONDER_CATEGORIES,
    STUDENT_SERVICE_SENSITIVE_CATEGORIES,
    getStudentServiceAreaForCategory,
    getStudentServiceBootstrap,
    normalizeStudentServiceAnswerRecord,
    normalizeStudentServiceArticleRecord,
    normalizeStudentServiceCategory,
    normalizeStudentServiceInternalNote,
    normalizeStudentServiceMacroRecord,
    normalizeStudentServiceQuestionRecord,
    normalizeStudentServiceReviewQueueEntry,
    normalizeStudentServiceThreadEntry,
    normalizeStudentServiceTicketRecord
} = require('./domains/student-service-service');
const {
    ensurePersonFromAccount,
    getAccountByEmail,
    getAccountById,
    listAccounts,
    upsertAccount
} = require('./domains/accounts-service');
const {
    activateAccount,
    clearSessionImpersonation,
    createSessionByCredentials,
    createSessionByMicrosoftIdentity,
    createSessionForAccount,
    ensureCredential,
    getRawAccountByEmail,
    getRawAccountByMicrosoftOid,
    getSession,
    linkMicrosoftIdentityToAccount,
    logoutSession,
    requestPasswordReset,
    resetPassword,
    revokeSessionsForUser,
    updateSessionImpersonation,
    upgradeCredentialHashIfNeeded
} = require('./domains/auth-session-service');
const {
    aggregateGradebookAssessmentEntries,
    canAccessGradebookCourse,
    computeRecordFinalScore,
    ensureGradebook,
    finalizeGrades,
    getGradebookAssessmentDefinition,
    getGradebookCourse,
    publishGradebook,
    setScore
} = require('./domains/gradebook-service');
const {
    createAssignment,
    createMaterial,
    ensureLmsCourse,
    getLmsCourse,
    getSectionsByCourse,
    getStudentEnrollmentsByCourse,
    isCourseTeachingStaff
} = require('./domains/lms-course-service');
const {
    getPendingSocialConnectionRequestBetween,
    getSocialFollowerIds,
    isSocialConnection,
    isSocialFollowingTarget,
    removeSocialConnection,
    respondSocialConnectionRequest,
    sendSocialConnectionRequest,
    toggleSocialFollow
} = require('./domains/social-relationships-service');
const {
    canContributeToSocialProject,
    canManageSocialProject,
    canViewSocialProject,
    createSocialProject,
    createSocialProjectCheckin,
    createSocialProjectDeliverable,
    createSocialProjectMilestone,
    createSocialProjectShowcasePage,
    createSocialProjectTask,
    decorateSocialProject,
    deleteSocialProject,
    deleteSocialProjectDeliverable,
    deleteSocialProjectMilestone,
    deleteSocialProjectTask,
    getSocialProjectAdvisorIds,
    getSocialProjectByChatId,
    getSocialProjectByGroupId,
    getSocialProjectMemberIds,
    getSocialProjectMemberRole,
    getSocialProjectRecord,
    inviteSocialProjectMember,
    removeSocialProjectMember,
    setSocialProjectMembership,
    updateSocialProject,
    updateSocialProjectMemberRole,
    updateSocialProjectMilestone,
    updateSocialProjectTask
} = require('./domains/social-projects-service');
const {
    appendSocialProjectActivity,
    ensureSocialGroupChat,
    ensureSocialProjectCollections,
    getSocialBootstrap,
    listSocialRelationshipsForUser,
    saveSocialMutation,
    upsertSocialState
} = require('./domains/social-state-service');
const {
    addSocialComment,
    buildSocialCommentTree,
    canDeleteSocialEvent,
    canDeleteSocialGroup,
    canDeleteSocialPage,
    canEditSocialPost,
    canManageSocialGroup,
    canManageSocialPage,
    canManageSocialScope,
    canViewSocialEvent,
    canViewSocialGroup,
    canViewSocialPage,
    canViewSocialPost,
    collectSocialCommentThreadIds,
    createSocialEvent,
    createSocialGroup,
    createSocialPage,
    createSocialPost,
    createSocialReport,
    decorateSocialEvent,
    decorateSocialGroup,
    decorateSocialPage,
    decorateSocialPost,
    deleteSocialEvent,
    deleteSocialGroup,
    deleteSocialPost,
    findSocialCommentRecord,
    getNextSocialGroupOwnerId,
    getSocialAccount,
    getSocialActorDisplayName,
    getSocialActorFacultyCode,
    getSocialEventRecord,
    getSocialGroupRecord,
    getSocialGroupByChatId,
    getSocialGroupJoinMap,
    getSocialGroupMemberIds,
    getSocialGroupPendingIds,
    getSocialMentionableAccounts,
    getSocialPageManagerIds,
    getSocialPageRecord,
    getSocialPostRecord,
    getSocialProfileRecord,
    getSocialRelationshipRecord,
    getSocialScopeRecord,
    inviteSocialGroupMember,
    isSocialAdmin,
    isSocialGroupMember,
    listSocialEvents,
    listSocialFeed,
    normalizeSocialComment,
    normalizeSocialGroupState,
    notifySocialMentions,
    removeSocialComment,
    removeSocialGroupMember,
    resolveSocialMentionUserIds,
    resolveSocialPosts,
    resolveSocialReport,
    respondSocialEventRsvp,
    respondSocialGroupMembership,
    setSocialGroupMembership,
    shareSocialPost,
    toggleSocialCommentReaction,
    toggleSocialReaction,
    toggleSocialScopePostPin,
    updateSocialGroup,
    updateSocialPage,
    updateSocialPost,
    upsertSocialProfile
} = require('./domains/social-content-service');
const {
    buildExamSessionCourseKey,
    buildProtectedQuizClientUrl,
    createExamPortalLaunchTicket,
    createExamPortalSession,
    createProtectedQuizLaunchTicket,
    deriveExamSessionRuntimeStatus,
    ensureExamPortalSession,
    ensureProtectedClientSession,
    ensureProtectedQuizAttemptRecord,
    ensureProtectedQuizLaunch,
    findProtectedQuizRecord,
    getExamPortalSession,
    getExamPortalSessionSummary,
    getExamSession,
    getProtectedClientAttempt,
    getProtectedClientSession,
    getProtectedQuiz,
    getProtectedQuizMonitor,
    heartbeatProtectedQuiz,
    listExamPortalVisibleSessions,
    listExamSessionsForStudent,
    manualGradeProtectedQuiz,
    normalizeExamSessionRecord,
    normalizeExamSessionStatus,
    recordProtectedQuizEvent,
    redeemProtectedQuizLaunch,
    revokeProtectedClientSessions,
    syncExamSession,
    syncProtectedQuiz,
    updateProtectedQuizAttemptControl
} = require('./domains/protected-exam-service');
const {
    accountHasPrivilege,
    getEffectiveAccountPrivileges,
    getGrantedAccountPrivileges,
    listPrivilegeDefinitions,
    updateAccountPrivileges
} = require('./domains/account-privileges-service');
const {
    createNotification,
    listNotifications,
    listPushSubscriptions,
    markNotificationRead,
    removePushSubscription,
    updateNotificationPreferences,
    upsertPushSubscription
} = require('./domains/notifications-service');

const DEFAULT_MAX_ECTS = 30;
function socialText(value) {
    return String(value || '').trim();
}

function normalizeSafeExternalUrl(value = '') {
    const raw = socialText(value);
    if (!raw) return '';
    if (/^(mailto:|tel:)/i.test(raw)) return raw;
    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch (error) {}
    return '';
}

function socialIdArray(values) {
    return uniqueStrings(
        asArray(values)
            .map(value => {
                if (value && typeof value === 'object') return socialText(value.id || value.userId || value.value);
                return socialText(value);
            })
            .filter(Boolean)
    );
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function normalizeSocialScopeType(value) {
    const normalized = socialText(value).toLowerCase();
    if (['profile', 'page', 'group'].includes(normalized)) return normalized;
    return 'profile';
}

function normalizeSocialAudience(value) {
    const normalized = socialText(value).toLowerCase();
    if (['campus', 'faculty', 'group', 'page', 'connections', 'private'].includes(normalized)) return normalized;
    return 'campus';
}

function normalizeSocialVisibility(value, fallback = 'public') {
    const normalized = socialText(value).toLowerCase();
    if (['public', 'private', 'faculty'].includes(normalized)) return normalized;
    return socialText(fallback).toLowerCase() || 'public';
}

function normalizeSocialReactionType(value) {
    const normalized = socialText(value).toLowerCase();
    return normalized || 'like';
}

function extractMessageLinks(value) {
    const raw = socialText(value);
    if (!raw) return [];
    const matches = raw.match(/https?:\/\/[^\s<>"']+/gi) || [];
    return uniqueStrings(matches.map(item => socialText(item).replace(/[),.;!?]+$/g, ''))).filter(Boolean);
}

function extractSocialMentions(value) {
    const textValue = socialText(value);
    if (!textValue) return [];
    const matches = textValue.match(/@([A-Za-z0-9._-]+)/g) || [];
    return uniqueStrings(matches.map(item => socialText(item).replace(/^@+/, '')));
}

function normalizeSocialRsvpStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['going', 'interested', 'declined'].includes(normalized)) return normalized;
    return 'going';
}

function normalizeProjectStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['idea', 'active', 'review', 'completed', 'draft', 'published'].includes(normalized)) return normalized;
    return 'idea';
}

function normalizeProjectVisibilityMode(value, fallback = 'all_logged_in') {
    const normalized = socialText(value).toLowerCase();
    if ([
        'all_logged_in',
        'students_only',
        'tas_only',
        'professors_only',
        'staff_only',
        'custom'
    ].includes(normalized)) return normalized;
    return fallback;
}

function projectLegacyVisibilityFromMode(mode, fallback = 'public') {
    const normalized = normalizeProjectVisibilityMode(mode, '');
    if (normalized === 'all_logged_in') return 'public';
    if (normalized === 'custom') return 'private';
    return 'faculty';
}

function fallbackProjectVisibilityMode(project = {}) {
    const visibility = normalizeSocialVisibility(project.visibility, 'private');
    if (visibility === 'public') return 'all_logged_in';
    if (visibility === 'faculty') return 'custom';
    return 'custom';
}

function normalizePortfolioLinks(values) {
    return asArray(values)
        .map((item) => {
            if (item && typeof item === 'object') {
                const label = socialText(item.label || item.title || item.name || item.url);
                const url = normalizeSafeExternalUrl(item.url || item.href || '');
                if (!url) return null;
                return { label: label || url, url };
            }
            const url = normalizeSafeExternalUrl(item);
            if (!url) return null;
            return { label: url, url };
        })
        .filter(Boolean);
}

function normalizePortfolioMediaItems(values) {
    return asArray(values)
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const cloned = clone(item);
            const storageKey = socialText(cloned.storageKey || cloned.id || '');
            const dataUrl = socialText(cloned.dataUrl || '');
            if (!storageKey && !dataUrl) return null;
            return {
                ...cloned,
                id: socialText(cloned.id || storageKey || makeId('portfolio-media')),
                name: socialText(cloned.name || 'portfolio-file'),
                type: socialText(cloned.type || 'application/octet-stream'),
                storageKey,
                storageBackend: socialText(cloned.storageBackend || (storageKey ? 'bridge' : 'inline')),
                dataUrl
            };
        })
        .filter(Boolean);
}

function normalizeProjectRole(value) {
    const normalized = socialText(value).toLowerCase();
    if (['owner', 'member', 'advisor', 'instructor-viewer'].includes(normalized)) return normalized;
    return 'member';
}

const CLIENT_OWNED_PORTAL_STATE_KEYS = new Set([
    'calendarEvents',
    'gradebookWeights',
    'homeDashboardPreferencesByUser',
    'orderReadsByUser',
    'portalMessengerFavorites',
    'portalMessengerHiddenChats',
    'portalMessengerPinnedChats',
    'publicSocialUi'
]);

function normalizeScheduleDay(value = '') {
    return String(value || '').trim().toLowerCase();
}

function parseScheduleTimeToMinutes(value = '') {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return (hours * 60) + minutes;
}

function resolveScheduleInterval(entry = {}) {
    const startMinutes = parseScheduleTimeToMinutes(entry.startTime || entry.time || '');
    if (startMinutes === null) return null;
    const explicitEndMinutes = parseScheduleTimeToMinutes(entry.endTime || '');
    if (explicitEndMinutes !== null && explicitEndMinutes > startMinutes) {
        return { startMinutes, endMinutes: explicitEndMinutes };
    }
    const durationMinutes = safeNumber(String(entry.duration || '').match(/\d+/)?.[0], null);
    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
        return { startMinutes, endMinutes: startMinutes + durationMinutes };
    }
    return { startMinutes, endMinutes: startMinutes };
}

function schedulesOverlap(left = {}, right = {}) {
    if (normalizeScheduleDay(left.day) !== normalizeScheduleDay(right.day)) return false;
    const leftInterval = resolveScheduleInterval(left);
    const rightInterval = resolveScheduleInterval(right);
    if (!leftInterval || !rightInterval) {
        return String(left.startTime || left.time || '').trim() === String(right.startTime || right.time || '').trim();
    }
    return leftInterval.startMinutes < rightInterval.endMinutes
        && rightInterval.startMinutes < leftInterval.endMinutes;
}

function pickClientOwnedPortalState(source = {}) {
    return Object.entries(source && typeof source === 'object' ? source : {}).reduce((result, [key, value]) => {
        if (!CLIENT_OWNED_PORTAL_STATE_KEYS.has(String(key || '').trim())) return result;
        result[key] = clone(value);
        return result;
    }, {});
}

function collectConfiguredHostnames(...values) {
    return uniqueStrings(values.flatMap((value) => {
        try {
            const hostname = new URL(String(value || '').trim()).hostname;
            return hostname ? [hostname] : [];
        } catch (error) {
            return [];
        }
    }));
}

function normalizeTaskStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['backlog', 'todo', 'in-progress', 'blocked', 'done'].includes(normalized)) return normalized;
    return 'backlog';
}

function normalizeTaskPriority(value) {
    const normalized = socialText(value).toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(normalized)) return normalized;
    return 'medium';
}

const DEFAULT_MAIL_FOLDERS = ['inbox', 'sentitems', 'drafts'];

function sanitizeMailFolderKey(value) {
    const normalized = socialText(value).toLowerCase();
    if (DEFAULT_MAIL_FOLDERS.includes(normalized)) return normalized;
    return 'inbox';
}

class PlatformStore {
    constructor(options = {}) {
        this.statePath = options.statePath;
        this.uploadsDir = options.uploadsDir;
        this.appUrl = String(options.appUrl || '').trim();
        this.backendUrl = String(options.backendUrl || '').trim();
        this.rtc = clone(options.rtc || {}) || {};
        this.environment = String(options.environment || 'development').trim().toLowerCase();
        this.fileStorageMode = String(options.fileStorageMode || 'external').trim().toLowerCase() || 'external';
        this.storageDriver = String(options.storageDriver || 'postgres').trim().toLowerCase() || 'postgres';
        this.auditRetentionDays = Math.max(1, safeNumber(options.auditRetentionDays, 2555));
        this.portalSessionTtlMs = Math.max(60 * 1000, safeNumber(options.portalSessionTtlMs, 12 * 60 * 60 * 1000));
        this.maxFileUploadBytes = Math.max(1, safeNumber(options.maxFileUploadBytes, 25 * 1024 * 1024));
        this.databaseUrl = String(options.databaseUrl || '').trim();
        this.databaseTableName = String(options.databaseTableName || '').trim();
        this.allowLocalFallback = options.allowLocalFallback !== false;
        this.mailTokenEncryptionKey = String(options.mailTokenEncryptionKey || '').trim();
        this.bootstrapAdmin = options.bootstrapAdmin && typeof options.bootstrapAdmin === 'object'
            ? clone(options.bootstrapAdmin)
            : null;
        this.recordStore = null;
        this.state = createEmptyPlatformState(this.storageDriver);
        this.pendingSave = Promise.resolve();
    }

    static async create(options = {}) {
        const instance = new PlatformStore(options);
        await instance.init();
        return instance;
    }

    async init() {
        const normalizedDriver = String(this.storageDriver || '').trim().toLowerCase();
        if (normalizedDriver === 'postgres') {
            await this.initPostgresStoreWithFallback();
        } else if (['json', 'local', 'local-json'].includes(normalizedDriver)) {
            this.storageDriver = 'local-json';
            this.recordStore = new LocalRecordStore({
                statePath: this.statePath
            });
            await this.recordStore.init();
            const existing = await this.recordStore.loadState();
            this.state = this.ensureStateShape(existing || createEmptyPlatformState(this.storageDriver));
        } else {
            throw new Error(`Unsupported storage driver "${this.storageDriver}". Use "postgres" or "local-json".`);
        }
        this.ensureBootstrapAdmin();
        this.upsertIntegrationSystem({
            systemCode: 'outlook-mail',
            displayName: 'Outlook Mail',
            ownerDomain: 'communication',
            syncMode: 'live-cached',
            isAuthoritative: false,
            enabled: true,
            apiKeyConfigured: Boolean(this.mailTokenEncryptionKey),
            status: 'ready',
            metadata: {
                mailboxScope: 'personal',
                provider: 'microsoft-graph'
            }
        });
        await this.save();
        return this;
    }

    async initPostgresStoreWithFallback() {
        if (!this.databaseUrl) {
            if (!this.allowLocalFallback) {
                throw new Error('KIU_DATABASE_URL is required when using the PostgreSQL platform store.');
            }
            return this.initLocalFallbackStore(new Error('KIU_DATABASE_URL is missing for PostgreSQL startup.'));
        }
        try {
            this.recordStore = new PostgresRecordStore({
                connectionString: this.databaseUrl,
                tableName: this.databaseTableName
            });
            await this.recordStore.init();
            const existing = await this.recordStore.loadState();
            this.state = this.ensureStateShape(existing || createEmptyPlatformState(this.storageDriver));
        } catch (error) {
            if (!this.allowLocalFallback) throw error;
            await this.initLocalFallbackStore(error);
        }
    }

    async initLocalFallbackStore(reason) {
        this.storageDriver = 'local-json';
        this.recordStore = new LocalRecordStore({
            statePath: this.statePath
        });
        await this.recordStore.init();
        const existing = await this.recordStore.loadState();
        this.state = this.ensureStateShape(existing || createEmptyPlatformState(this.storageDriver));
        this.state.meta.localFallbackReason = String(reason?.message || 'PostgreSQL startup failed.');
        this.state.meta.localFallbackAt = nowIso();
    }

    ensureStateShape(source) {
        const state = source && typeof source === 'object' ? source : createEmptyPlatformState(this.storageDriver);
        state.meta = state.meta && typeof state.meta === 'object' ? state.meta : {};
        state.meta.version = Math.max(2, safeNumber(state.meta.version, 2));
        state.meta.storageDriver = this.storageDriver;
        state.meta.createdAt = String(state.meta.createdAt || nowIso());
        state.meta.updatedAt = String(state.meta.updatedAt || state.meta.createdAt);
        state.accounts = state.accounts && typeof state.accounts === 'object' ? state.accounts : {};
        state.authCredentials = state.authCredentials && typeof state.authCredentials === 'object' ? state.authCredentials : {};
        state.people = state.people && typeof state.people === 'object' ? state.people : {};
        state.sessions = state.sessions && typeof state.sessions === 'object' ? state.sessions : {};
        state.faculties = state.faculties && typeof state.faculties === 'object' ? state.faculties : {};
        state.programs = state.programs && typeof state.programs === 'object' ? state.programs : {};
        state.terms = state.terms && typeof state.terms === 'object' ? state.terms : {};
        state.courses = state.courses && typeof state.courses === 'object' ? state.courses : {};
        state.sections = state.sections && typeof state.sections === 'object' ? state.sections : {};
        state.enrollments = state.enrollments && typeof state.enrollments === 'object' ? state.enrollments : {};
        state.registrationHolds = state.registrationHolds && typeof state.registrationHolds === 'object' ? state.registrationHolds : {};
        state.lmsCourses = state.lmsCourses && typeof state.lmsCourses === 'object' ? state.lmsCourses : {};
        state.gradebooks = state.gradebooks && typeof state.gradebooks === 'object' ? state.gradebooks : {};
        state.examSessions = state.examSessions && typeof state.examSessions === 'object' ? state.examSessions : {};
        state.examPortalSessions = state.examPortalSessions && typeof state.examPortalSessions === 'object' ? state.examPortalSessions : {};
        state.protectedQuizLaunches = state.protectedQuizLaunches && typeof state.protectedQuizLaunches === 'object' ? state.protectedQuizLaunches : {};
        state.protectedClientSessions = state.protectedClientSessions && typeof state.protectedClientSessions === 'object' ? state.protectedClientSessions : {};
        state.mail = state.mail && typeof state.mail === 'object' ? state.mail : {};
        state.mail.connections = state.mail.connections && typeof state.mail.connections === 'object' ? state.mail.connections : {};
        state.mail.oauthStates = state.mail.oauthStates && typeof state.mail.oauthStates === 'object' ? state.mail.oauthStates : {};
        state.mail.caches = state.mail.caches && typeof state.mail.caches === 'object' ? state.mail.caches : {};
        state.mail.portalMessages = state.mail.portalMessages && typeof state.mail.portalMessages === 'object' ? state.mail.portalMessages : {};
        state.files = state.files && typeof state.files === 'object' ? state.files : {};
        state.chats = state.chats && typeof state.chats === 'object' ? state.chats : {};
        state.calls = state.calls && typeof state.calls === 'object' ? state.calls : {};
        state.notifications = state.notifications && typeof state.notifications === 'object' ? state.notifications : {};
        state.notificationPreferences = state.notificationPreferences && typeof state.notificationPreferences === 'object' ? state.notificationPreferences : {};
        state.pushSubscriptions = state.pushSubscriptions && typeof state.pushSubscriptions === 'object' ? state.pushSubscriptions : {};
        state.serviceRequests = state.serviceRequests && typeof state.serviceRequests === 'object' ? state.serviceRequests : {};
        state.integrations = state.integrations && typeof state.integrations === 'object' ? state.integrations : {};
        state.integrations.systems = state.integrations.systems && typeof state.integrations.systems === 'object' ? state.integrations.systems : {};
        state.integrations.syncRuns = Array.isArray(state.integrations.syncRuns) ? state.integrations.syncRuns : [];
        state.integrations.conflicts = Array.isArray(state.integrations.conflicts) ? state.integrations.conflicts : [];
        state.audit = state.audit && typeof state.audit === 'object' ? state.audit : {};
        state.audit.events = Array.isArray(state.audit.events) ? state.audit.events : [];
        state.social = state.social && typeof state.social === 'object' ? state.social : createEmptySocialState();
        state.studentService = state.studentService && typeof state.studentService === 'object' ? state.studentService : createEmptyStudentServiceState();
        state.importJobs = state.importJobs && typeof state.importJobs === 'object' ? state.importJobs : {};
        state.portal = state.portal && typeof state.portal === 'object' ? state.portal : {};
        state.portal.state = state.portal.state && typeof state.portal.state === 'object'
            ? state.portal.state
            : (state.portal.legacyState && typeof state.portal.legacyState === 'object' ? state.portal.legacyState : {});
        state.portal.liveQuizWorkspaces = state.portal.liveQuizWorkspaces && typeof state.portal.liveQuizWorkspaces === 'object'
            ? state.portal.liveQuizWorkspaces
            : (state.portal.state.lmsLiveQuizzes && typeof state.portal.state.lmsLiveQuizzes === 'object'
                ? clone(state.portal.state.lmsLiveQuizzes)
                : {});
        delete state.portal.state.lmsLiveQuizzes;
        state.portal.meta = state.portal.meta && typeof state.portal.meta === 'object' ? state.portal.meta : {};
        state.portal.microsoft = state.portal.microsoft && typeof state.portal.microsoft === 'object' ? state.portal.microsoft : {};
        state.portal.microsoft.oauthStates = state.portal.microsoft.oauthStates && typeof state.portal.microsoft.oauthStates === 'object'
            ? state.portal.microsoft.oauthStates
            : {};
        state.portal.microsoft.loginCompletions = state.portal.microsoft.loginCompletions && typeof state.portal.microsoft.loginCompletions === 'object'
            ? state.portal.microsoft.loginCompletions
            : {};
        delete state.portal.legacyState;
        return state;
    }

    save() {
        this.state.meta.updatedAt = nowIso();
        if (!this.recordStore) return Promise.resolve();
        this.pendingSave = this.pendingSave
            .catch(() => null)
            .then(() => this.recordStore.writeState(this.state));
        return this.pendingSave;
    }

    async flushPendingWrites() {
        await this.pendingSave;
    }

    ensureBootstrapAdmin() {
        if (!this.bootstrapAdmin?.email || !this.bootstrapAdmin?.password) return;
        const existingAdmin = Object.values(this.state.accounts || {}).some(account => String(account?.role || '').trim().toLowerCase() === 'admin');
        if (existingAdmin) return;
        this.upsertAccount({
            id: String(this.bootstrapAdmin.id || 'admin-root').trim() || 'admin-root',
            name: String(this.bootstrapAdmin.name || 'Portal Administrator').trim() || 'Portal Administrator',
            nameEn: String(this.bootstrapAdmin.nameEn || this.bootstrapAdmin.name || 'Portal Administrator').trim() || 'Portal Administrator',
            displayName: String(this.bootstrapAdmin.displayName || this.bootstrapAdmin.nameEn || this.bootstrapAdmin.name || 'Portal Administrator').trim() || 'Portal Administrator',
            email: this.bootstrapAdmin.email,
            role: 'admin',
            facultyCode: normalizeCode(this.bootstrapAdmin.facultyCode || ''),
            password: this.bootstrapAdmin.password,
            accountStatus: 'active',
            activationRequired: false,
            mustChangePassword: false
        });
    }

    ensureDevelopmentTestAccounts() {
        return [];
    }

    resetPlatformState(options = {}) {
        const preserveAdmin = options.preserveAdmin !== false;
        const nextState = createEmptyPlatformState(this.storageDriver);
        this.state = this.ensureStateShape(nextState);
        if (preserveAdmin) {
            this.ensureBootstrapAdmin();
        }
        this.upsertIntegrationSystem({
            systemCode: 'outlook-mail',
            displayName: 'Outlook Mail',
            ownerDomain: 'communication',
            syncMode: 'live-cached',
            isAuthoritative: false,
            enabled: true,
            apiKeyConfigured: Boolean(this.mailTokenEncryptionKey),
            status: 'ready',
            metadata: {
                mailboxScope: 'personal',
                provider: 'microsoft-graph'
            }
        });
        if (this.uploadsDir && fs.existsSync(this.uploadsDir)) {
            try {
                fs.rmSync(this.uploadsDir, { recursive: true, force: true });
                fs.mkdirSync(this.uploadsDir, { recursive: true });
            } catch (error) {}
        }
        this.save();
        return this.createPortalBootstrap();
    }

    normalizeTestingFacultyCode(facultyCode = '') {
        return normalizeCode(facultyCode || 'ECON') || 'ECON';
    }

    buildTestingAccountSpecs(facultyCode = 'ECON') {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const facultySlug = normalizedFacultyCode.toLowerCase();
        return [
            {
                id: `${facultySlug}-student-demo`,
                name: `${normalizedFacultyCode} Student Demo`,
                nameEn: `${normalizedFacultyCode} Student Demo`,
                displayName: `${normalizedFacultyCode} Student Demo`,
                email: `${facultySlug}.student@kiu.local`,
                role: 'student',
                facultyCode: normalizedFacultyCode,
                program: `${normalizedFacultyCode} Demo Program`,
                semester: 3,
                testingProfile: 'student-primary',
                testingScenario: 'Active LMS student with seeded schedule, grades, quiz access, and service thread',
                testingCapabilities: [
                    'View active schedule',
                    'Open LMS group materials and assignments',
                    'Write a published quiz',
                    'See seeded grades and notifications'
                ],
                password: 'change-me-student'
            },
            {
                id: `${facultySlug}-student-demo-2`,
                name: `${normalizedFacultyCode} Student Demo Two`,
                nameEn: `${normalizedFacultyCode} Student Demo Two`,
                displayName: `${normalizedFacultyCode} Student Demo Two`,
                email: `${facultySlug}.student2@kiu.local`,
                role: 'student',
                facultyCode: normalizedFacultyCode,
                program: `${normalizedFacultyCode} Demo Program`,
                semester: 3,
                testingProfile: 'student-secondary',
                testingScenario: 'Open-registration student who can join groups and test fresh workflows',
                testingCapabilities: [
                    'Browse curriculum and groups',
                    'Join available groups manually',
                    'Use student portal and exam login',
                    'Receive grades and messages after enrollment'
                ],
                password: 'change-me-student'
            },
            {
                id: `${facultySlug}-professor-demo`,
                name: `${normalizedFacultyCode} Professor Demo`,
                nameEn: `${normalizedFacultyCode} Professor Demo`,
                displayName: `${normalizedFacultyCode} Professor Demo`,
                email: `${facultySlug}.professor@kiu.local`,
                role: 'professor',
                facultyCode: normalizedFacultyCode,
                testingProfile: 'professor',
                testingScenario: 'Teaching owner with schedule, LMS authoring, grading, and cross-role chat',
                testingCapabilities: [
                    'Appear on teaching schedule',
                    'Manage LMS group workspace',
                    'Grade seeded students',
                    'Message TA, service, and students'
                ],
                password: 'change-me-professor'
            },
            {
                id: `${facultySlug}-ta-demo`,
                name: `${normalizedFacultyCode} Teaching Assistant Demo`,
                nameEn: `${normalizedFacultyCode} Teaching Assistant Demo`,
                displayName: `${normalizedFacultyCode} Teaching Assistant Demo`,
                email: `${facultySlug}.ta@kiu.local`,
                role: 'ta',
                facultyCode: normalizedFacultyCode,
                testingProfile: 'ta',
                testingScenario: 'Teaching assistant with schedule, student support, and grading visibility',
                testingCapabilities: [
                    'Appear on teaching schedule',
                    'Support LMS group workflows',
                    'Chat with professor, service, and students',
                    'Work with seeded grade and support context'
                ],
                password: 'change-me-ta'
            },
            {
                id: `${facultySlug}-service-demo`,
                name: `${normalizedFacultyCode} Student Service Demo`,
                nameEn: `${normalizedFacultyCode} Student Service Demo`,
                displayName: `${normalizedFacultyCode} Student Service Demo`,
                email: `${facultySlug}.service@kiu.local`,
                role: 'student_service',
                facultyCode: normalizedFacultyCode,
                testingProfile: 'student-service',
                testingScenario: 'Student service desk with assigned cases, student context, and staff links',
                testingCapabilities: [
                    'Review service tickets and handoffs',
                    'See student schedule and grade context',
                    'Chat with professor, TA, and students',
                    'Operate as a real support desk user'
                ],
                password: 'change-me-service'
            }
        ];
    }

    listTestingAccounts(filters = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(filters.facultyCode || filters.faculty || 'ECON');
        return this.buildTestingAccountSpecs(normalizedFacultyCode)
            .map(spec => {
                const account = this.state.accounts[spec.id];
                if (!account) return null;
                const sanitized = this.sanitizeAccountForClient(account);
                if (!sanitized) return null;
                return {
                    ...sanitized,
                    isDemoAccount: true,
                    testingProfile: spec.testingProfile,
                    testingScenario: spec.testingScenario,
                    testingCapabilities: clone(spec.testingCapabilities || []),
                    testingFaculty: normalizedFacultyCode,
                    loginEmail: spec.email,
                    demoPassword: spec.password,
                    examPortalEmail: spec.email,
                    examPortalId: spec.id
                };
            })
            .filter(Boolean);
    }

    ensureTestingPackForFaculty(facultyCode = 'ECON') {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const specs = this.buildTestingAccountSpecs(normalizedFacultyCode);
        specs.forEach(spec => {
            this.upsertAccount({
                ...spec,
                isDemoAccount: true,
                testingFaculty: normalizedFacultyCode,
                activationRequired: false,
                mustChangePassword: false,
                accountStatus: 'active'
            });
        });

        const demoAccounts = Object.fromEntries(
            specs.map(spec => [spec.testingProfile, this.getAccountById(spec.id) || this.state.accounts[spec.id] || spec])
        );
        const demoCourses = this.ensureTestingFacultyCourses(normalizedFacultyCode);
        const demoSections = this.ensureTestingFacultySections(normalizedFacultyCode, demoCourses, demoAccounts);

        this.ensureTestingEnrollments(demoSections, demoAccounts);
        this.ensureTestingPortalStateForFaculty(normalizedFacultyCode, demoCourses, demoSections, demoAccounts);
        this.ensureTestingLmsArtifactsForFaculty(normalizedFacultyCode, demoCourses, demoSections, demoAccounts);
        this.ensureTestingStudentServiceStateForFaculty(normalizedFacultyCode, demoCourses, demoSections, demoAccounts);
        this.ensureTestingSocialStateForFaculty(normalizedFacultyCode, demoCourses, demoSections, demoAccounts);
        this.ensureTestingMessengerStateForFaculty(normalizedFacultyCode, demoAccounts);
        this.ensureTestingNotificationsForFaculty(normalizedFacultyCode, demoAccounts, demoCourses);
        this.save();
        return this.listTestingAccounts({ facultyCode: normalizedFacultyCode });
    }

    ensureTestingFacultyCourses(facultyCode = 'ECON') {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const courseBlueprints = [
            {
                id: `${normalizedFacultyCode}-DEMO-101`,
                code: `${normalizedFacultyCode}101`,
                name: `${normalizedFacultyCode} Foundations`,
                semester: 3,
                ects: 6,
                moduleName: 'Core Foundations',
                prerequisites: []
            },
            {
                id: `${normalizedFacultyCode}-DEMO-201`,
                code: `${normalizedFacultyCode}201`,
                name: `${normalizedFacultyCode} Research Methods`,
                semester: 3,
                ects: 5,
                moduleName: 'Core Foundations',
                prerequisites: [`${normalizedFacultyCode}101`]
            },
            {
                id: `${normalizedFacultyCode}-DEMO-220`,
                code: `${normalizedFacultyCode}220`,
                name: `${normalizedFacultyCode} Applied Lab`,
                semester: 3,
                ects: 4,
                moduleName: 'Applied Practice',
                prerequisites: [`${normalizedFacultyCode}101`]
            },
            {
                id: `${normalizedFacultyCode}-DEMO-230`,
                code: `${normalizedFacultyCode}230`,
                name: `${normalizedFacultyCode} Communication Studio`,
                semester: 3,
                ects: 5,
                moduleName: 'Applied Practice',
                prerequisites: []
            }
        ];

        courseBlueprints.forEach(course => {
            const current = this.state.courses[course.id] || {};
            this.state.courses[course.id] = {
                ...current,
                id: course.id,
                code: course.code,
                name: course.name,
                facultyCode: normalizedFacultyCode,
                semester: course.semester,
                ects: course.ects,
                moduleName: course.moduleName,
                prerequisites: clone(course.prerequisites),
                updatedAt: nowIso(),
                createdAt: current.createdAt || nowIso()
            };
        });
        return courseBlueprints.map(course => clone(this.state.courses[course.id]));
    }

    ensureTestingFacultySections(facultyCode = 'ECON', courses = [], demoAccounts = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const professorName = String(demoAccounts.professor?.displayName || demoAccounts.professor?.nameEn || demoAccounts.professor?.name || `${normalizedFacultyCode} Professor Demo`).trim();
        const taName = String(demoAccounts.ta?.displayName || demoAccounts.ta?.nameEn || demoAccounts.ta?.name || `${normalizedFacultyCode} Teaching Assistant Demo`).trim();
        const sectionBlueprints = [
            {
                courseId: courses[0]?.id,
                code: 'G1',
                name: 'Group 1',
                sessionType: 'lecture',
                day: 'Monday',
                time: '10:00',
                startTime: '10:00',
                endTime: '12:00',
                room: `${normalizedFacultyCode}-A201`,
                semester: 3
            },
            {
                courseId: courses[1]?.id,
                code: 'G1',
                name: 'Group 1',
                sessionType: 'lecture',
                day: 'Tuesday',
                time: '12:30',
                startTime: '12:30',
                endTime: '14:30',
                room: `${normalizedFacultyCode}-B104`,
                semester: 3
            },
            {
                courseId: courses[2]?.id,
                code: 'LAB1',
                name: 'Lab 1',
                sessionType: 'lab',
                day: 'Thursday',
                time: '15:00',
                startTime: '15:00',
                endTime: '17:00',
                room: `${normalizedFacultyCode}-LAB7`,
                semester: 3
            },
            {
                courseId: courses[3]?.id,
                code: 'G2',
                name: 'Group 2',
                sessionType: 'seminar',
                day: 'Friday',
                time: '09:30',
                startTime: '09:30',
                endTime: '11:30',
                room: `${normalizedFacultyCode}-C303`,
                semester: 3
            }
        ].filter(section => section.courseId);

        return sectionBlueprints.map(section => {
            const persisted = this.upsertSection({
                id: `${section.courseId}::${section.code}`,
                courseId: section.courseId,
                code: section.code,
                name: section.name,
                facultyCode: normalizedFacultyCode,
                termId: `${normalizedFacultyCode}-TERM-ACTIVE`,
                sessionType: section.sessionType,
                seatsTotal: 24,
                seatsTaken: 0,
                room: section.room,
                professorId: demoAccounts.professor?.id || '',
                taIds: demoAccounts.ta?.id ? [demoAccounts.ta.id] : [],
                schedule: [{
                    day: section.day,
                    startTime: section.startTime,
                    endTime: section.endTime
                }]
            });
            return {
                ...persisted,
                groupId: section.code,
                groupName: section.name,
                faculty: normalizedFacultyCode,
                semester: section.semester,
                day: section.day,
                time: section.time,
                duration: `${section.startTime}-${section.endTime}`,
                prof: professorName,
                ta: taName
            };
        });
    }

    ensureTestingEnrollments(sections = [], demoAccounts = {}) {
        const enrolledSections = sections.slice(0, 2).filter(Boolean);
        const activeStudent = demoAccounts['student-primary'];
        if (!activeStudent?.id) return;

        enrolledSections.forEach(section => {
            const enrollmentId = `enr::${activeStudent.id}::${section.id}`;
            this.state.enrollments[enrollmentId] = {
                id: enrollmentId,
                studentId: activeStudent.id,
                courseId: section.courseId,
                sectionId: section.id,
                status: 'active',
                registeredAt: this.state.enrollments[enrollmentId]?.registeredAt || nowIso(),
                createdAt: this.state.enrollments[enrollmentId]?.createdAt || nowIso(),
                updatedAt: nowIso()
            };

            const activeEnrollments = Object.values(this.state.enrollments || {}).filter(item =>
                String(item?.sectionId || '') === String(section.id || '')
                && String(item?.status || '').trim().toLowerCase() === 'active'
            );
            if (this.state.sections[section.id]) {
                this.state.sections[section.id].seatsTaken = uniqueStrings(activeEnrollments.map(item => item.studentId)).length;
                this.state.sections[section.id].updatedAt = nowIso();
            }
        });

        const assessmentSeed = [
            {
                criterion: 'quiz',
                assessmentNumber: 1,
                score: 86,
                updatedBy: demoAccounts.professor?.id || ''
            },
            {
                criterion: 'homework',
                assessmentNumber: 1,
                score: 92,
                updatedBy: demoAccounts.ta?.id || demoAccounts.professor?.id || ''
            },
            {
                criterion: 'midterm',
                assessmentNumber: 1,
                score: 81,
                updatedBy: demoAccounts.professor?.id || ''
            }
        ];

        enrolledSections.forEach(section => {
            const gradebook = this.ensureGradebook(section.courseId);
            const record = gradebook.records?.[activeStudent.id] || null;
            assessmentSeed.forEach(seed => {
                const alreadySeeded = Array.isArray(record?.assessments?.[seed.criterion])
                    && record.assessments[seed.criterion].some(item => safeNumber(item?.number, 1) === seed.assessmentNumber);
                if (alreadySeeded) return;
                this.setScore({
                    courseId: section.courseId,
                    studentId: activeStudent.id,
                    criterion: seed.criterion,
                    assessmentNumber: seed.assessmentNumber,
                    score: seed.score,
                    updatedBy: seed.updatedBy
                });
            });
        });
    }

    ensureTestingPortalStateForFaculty(facultyCode = 'ECON', courses = [], sections = [], demoAccounts = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const portalState = this.state.portal.state = this.state.portal.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        portalState.registrationOpen = true;
        portalState.curriculum = Array.isArray(portalState.curriculum) ? portalState.curriculum : [];
        portalState.availableGroups = portalState.availableGroups && typeof portalState.availableGroups === 'object' ? portalState.availableGroups : {};
        portalState.studentSchedulesByStudent = portalState.studentSchedulesByStudent && typeof portalState.studentSchedulesByStudent === 'object' ? portalState.studentSchedulesByStudent : {};
        portalState.studentRegistrations = portalState.studentRegistrations && typeof portalState.studentRegistrations === 'object' ? portalState.studentRegistrations : {};
        portalState.studentGrades = portalState.studentGrades && typeof portalState.studentGrades === 'object' ? portalState.studentGrades : {};
        portalState.tuitionBalances = portalState.tuitionBalances && typeof portalState.tuitionBalances === 'object' ? portalState.tuitionBalances : {};
        portalState.probationStatus = portalState.probationStatus && typeof portalState.probationStatus === 'object' ? portalState.probationStatus : {};
        portalState.users = Array.isArray(portalState.users) ? portalState.users : [];
        portalState.facultyProfiles = portalState.facultyProfiles && typeof portalState.facultyProfiles === 'object' ? portalState.facultyProfiles : {};
        portalState.groupAssignments = portalState.groupAssignments && typeof portalState.groupAssignments === 'object' ? portalState.groupAssignments : {};
        portalState.groupMaterials = portalState.groupMaterials && typeof portalState.groupMaterials === 'object' ? portalState.groupMaterials : {};
        portalState.groupSubmissions = portalState.groupSubmissions && typeof portalState.groupSubmissions === 'object' ? portalState.groupSubmissions : {};
        portalState.groupConcepts = portalState.groupConcepts && typeof portalState.groupConcepts === 'object' ? portalState.groupConcepts : {};
        portalState.groupConceptRatings = portalState.groupConceptRatings && typeof portalState.groupConceptRatings === 'object' ? portalState.groupConceptRatings : {};
        portalState.groupWeekConfigs = portalState.groupWeekConfigs && typeof portalState.groupWeekConfigs === 'object' ? portalState.groupWeekConfigs : {};
        portalState.groupQuizzes = portalState.groupQuizzes && typeof portalState.groupQuizzes === 'object' ? portalState.groupQuizzes : {};
        portalState.groupQuizSubmissions = portalState.groupQuizSubmissions && typeof portalState.groupQuizSubmissions === 'object' ? portalState.groupQuizSubmissions : {};
        portalState.lmsQuizBuilder = portalState.lmsQuizBuilder && typeof portalState.lmsQuizBuilder === 'object' ? portalState.lmsQuizBuilder : {};
        portalState.studentServiceTickets = Array.isArray(portalState.studentServiceTickets) ? portalState.studentServiceTickets : [];
        portalState.studentServiceArticles = Array.isArray(portalState.studentServiceArticles) ? portalState.studentServiceArticles : [];
        portalState.studentServiceMacros = Array.isArray(portalState.studentServiceMacros) ? portalState.studentServiceMacros : [];

        const facultyProfile = portalState.facultyProfiles[normalizedFacultyCode] = portalState.facultyProfiles[normalizedFacultyCode] && typeof portalState.facultyProfiles[normalizedFacultyCode] === 'object'
            ? portalState.facultyProfiles[normalizedFacultyCode]
            : { students: [], professors: [], tas: [], student_service: [], curriculum: [] };
        ['students', 'professors', 'tas', 'student_service', 'curriculum'].forEach(key => {
            facultyProfile[key] = Array.isArray(facultyProfile[key]) ? facultyProfile[key] : [];
        });

        const upsertPortalUser = (account) => {
            if (!account?.id) return;
            const userRecord = {
                id: account.id,
                name: account.name || account.displayName || account.email || account.id,
                nameEn: account.nameEn || account.displayName || account.name || account.email || account.id,
                displayName: account.displayName || account.nameEn || account.name || account.email || account.id,
                email: account.email || '',
                role: account.role || 'student',
                faculty: normalizedFacultyCode,
                facultyCode: normalizedFacultyCode,
                semester: Number(account.semester || 0) || 0,
                program: String(account.program || '').trim(),
                avatar: account.avatar || account.photo || displayInitials(account.displayName || account.nameEn || account.name || account.email || account.id),
                photo: account.photo || account.avatar || displayInitials(account.displayName || account.nameEn || account.name || account.email || account.id),
                status: 'Active'
            };
            const existingUserIndex = portalState.users.findIndex(entry => String(entry?.id || '') === userRecord.id);
            if (existingUserIndex >= 0) portalState.users[existingUserIndex] = { ...portalState.users[existingUserIndex], ...userRecord };
            else portalState.users.push(userRecord);

            const facultyBucketKey = userRecord.role === 'professor'
                ? 'professors'
                : userRecord.role === 'ta'
                    ? 'tas'
                    : userRecord.role === 'student_service'
                        ? 'student_service'
                        : 'students';
            const bucket = facultyProfile[facultyBucketKey];
            const existingBucketIndex = bucket.findIndex(entry => String(entry?.id || '') === userRecord.id);
            if (existingBucketIndex >= 0) bucket[existingBucketIndex] = { ...bucket[existingBucketIndex], ...userRecord };
            else bucket.push({ ...userRecord });
        };

        Object.values(demoAccounts).forEach(upsertPortalUser);

        courses.forEach(course => {
            const existingIndex = portalState.curriculum.findIndex(entry => String(entry?.id || '') === String(course.id || ''));
            const curriculumEntry = {
                id: course.id,
                code: course.code,
                name: course.name,
                ects: course.ects,
                semester: course.semester,
                faculty: normalizedFacultyCode,
                facultyCode: normalizedFacultyCode,
                moduleName: course.moduleName || 'Demo Module',
                prerequisites: clone(course.prerequisites || []),
                antiRequisites: []
            };
            if (existingIndex >= 0) portalState.curriculum[existingIndex] = { ...portalState.curriculum[existingIndex], ...curriculumEntry };
            else portalState.curriculum.push(curriculumEntry);

            const facultyCurriculumIndex = facultyProfile.curriculum.findIndex(entry => String(entry?.id || '') === String(course.id || ''));
            if (facultyCurriculumIndex >= 0) facultyProfile.curriculum[facultyCurriculumIndex] = { ...facultyProfile.curriculum[facultyCurriculumIndex], ...curriculumEntry };
            else facultyProfile.curriculum.push({ ...curriculumEntry });
        });

        sections.forEach(section => {
            const persistedSection = this.state.sections?.[section.id] || section;
            portalState.availableGroups[section.courseId] = Array.isArray(portalState.availableGroups[section.courseId])
                ? portalState.availableGroups[section.courseId].filter(group => String(group?.id || '') !== String(section.groupId || ''))
                : [];
            portalState.availableGroups[section.courseId].push({
                id: section.groupId,
                name: section.groupName,
                sectionId: section.id,
                day: section.day,
                time: section.time,
                duration: section.duration,
                room: section.room,
                faculty: normalizedFacultyCode,
                semester: section.semester,
                prof: section.prof,
                ta: section.ta,
                capacity: persistedSection.seatsTotal || section.seatsTotal || 24,
                registered: persistedSection.seatsTaken || section.seatsTaken || 0
            });
        });

        const activeSectionMap = new Map(sections.map(section => [String(section.id || ''), section]));
        const activeEnrollmentsByStudent = Object.values(this.state.enrollments || {}).reduce((accumulator, enrollment) => {
            if (String(enrollment?.status || '').trim().toLowerCase() !== 'active') return accumulator;
            const section = activeSectionMap.get(String(enrollment?.sectionId || ''));
            if (!section) return accumulator;
            const studentId = String(enrollment?.studentId || '').trim();
            if (!studentId) return accumulator;
            accumulator[studentId] = Array.isArray(accumulator[studentId]) ? accumulator[studentId] : [];
            accumulator[studentId].push(section);
            return accumulator;
        }, {});

        const buildScheduleEntry = (section) => ({
            courseId: section.courseId,
            courseName: this.state.courses[section.courseId]?.name || section.courseId,
            groupId: section.groupId,
            groupName: section.groupName,
            day: section.day,
            time: section.time,
            room: section.room,
            faculty: normalizedFacultyCode,
            semester: section.semester,
            ects: Number(this.state.courses[section.courseId]?.ects || 0),
            registeredAt: nowIso()
        });

        const mergeScheduleEntries = (existingEntries = [], seededEntries = []) => {
            const merged = new Map();
            [...existingEntries, ...seededEntries].forEach(entry => {
                if (!entry || typeof entry !== 'object') return;
                const key = `${String(entry.courseId || '').trim()}::${String(entry.groupId || '').trim()}`;
                if (!key || key === '::') return;
                merged.set(key, {
                    ...(merged.get(key) || {}),
                    ...entry
                });
            });
            return [...merged.values()];
        };

        const upsertRosterStudent = (rosterKey, studentRecord) => {
            if (!rosterKey) return;
            const roster = Array.isArray(portalState.studentGrades[rosterKey]) ? portalState.studentGrades[rosterKey] : [];
            const nextRoster = roster.filter(entry => String(entry?.id || '') !== String(studentRecord.id || ''));
            nextRoster.push({
                ...(roster.find(entry => String(entry?.id || '') === String(studentRecord.id || '')) || {}),
                ...studentRecord
            });
            portalState.studentGrades[rosterKey] = nextRoster;
        };

        Object.values(demoAccounts).forEach(account => {
            if (String(account?.role || '').trim().toLowerCase() !== 'student' || !account?.id) return;
            const seededSchedule = (activeEnrollmentsByStudent[account.id] || []).map(buildScheduleEntry);
            const existingSchedule = Array.isArray(portalState.studentSchedulesByStudent[account.id])
                ? portalState.studentSchedulesByStudent[account.id]
                : [];
            portalState.studentSchedulesByStudent[account.id] = mergeScheduleEntries(existingSchedule, seededSchedule);

            const existingRegistrations = Array.isArray(portalState.studentRegistrations[account.id])
                ? portalState.studentRegistrations[account.id].map(item => String(item))
                : [];
            const seededRegistrations = portalState.studentSchedulesByStudent[account.id].map(entry => String(entry.courseId || ''));
            portalState.studentRegistrations[account.id] = uniqueStrings([...existingRegistrations, ...seededRegistrations]);

            if (!Object.prototype.hasOwnProperty.call(portalState.tuitionBalances, account.id)) {
                portalState.tuitionBalances[account.id] = 0;
            }
            if (!Object.prototype.hasOwnProperty.call(portalState.probationStatus, account.id)) {
                portalState.probationStatus[account.id] = false;
            }
        });

        const primaryStudent = demoAccounts['student-primary'];
        if (primaryStudent?.id) {
            const seededSections = activeEnrollmentsByStudent[primaryStudent.id] || [];
            seededSections.forEach(section => {
                const canonicalRosterKey = `${section.courseId}::${section.groupId}`;
                const legacyRosterKey = `${String(section.courseId || '').toLowerCase()}_${String(section.groupId || '').toLowerCase()}`;
                const studentRecord = {
                    id: primaryStudent.id,
                    name: primaryStudent.displayName || primaryStudent.nameEn || primaryStudent.name || primaryStudent.id,
                    quiz: 86,
                    homework: 92,
                    midterm: 81,
                    final: 0,
                    updatedAt: nowIso(),
                    updatedBy: demoAccounts.professor?.id || ''
                };
                [canonicalRosterKey, legacyRosterKey, section.courseId].forEach(rosterKey => upsertRosterStudent(rosterKey, studentRecord));
            });
        }
    }

    ensureTestingMessengerStateForFaculty(facultyCode = 'ECON', demoAccounts = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const seedChat = (chatId, members, senderId, textValue) => {
            if (this.state.chats[chatId]?.messages?.length) return;
            this.appendMessage({
                chatId,
                type: 'direct',
                members,
                createdBy: senderId,
                message: {
                    text: textValue,
                    senderName: this.state.accounts[senderId]?.displayName || senderId
                },
                senderId
            });
        };

        const studentId = demoAccounts['student-primary']?.id || '';
        const studentSecondaryId = demoAccounts['student-secondary']?.id || '';
        const professorId = demoAccounts.professor?.id || '';
        const taId = demoAccounts.ta?.id || '';
        const serviceId = demoAccounts['student-service']?.id || '';
        if (studentId && professorId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::student-professor`, [studentId, professorId], professorId, 'Welcome to the testing workspace. This conversation is ready for real-time messaging and file sharing.');
        }
        if (studentId && taId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::student-ta`, [studentId, taId], taId, 'TA support lane is ready. Use this chat to test message delivery and notifications.');
        }
        if (studentId && serviceId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::student-service`, [studentId, serviceId], serviceId, 'Student service testing is active. Submit a request or continue the thread here.');
        }
        if (professorId && taId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::professor-ta`, [professorId, taId], professorId, 'Professor and TA coordination lane is ready for grading, quiz review, and section operations.');
        }
        if (professorId && serviceId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::professor-service`, [professorId, serviceId], serviceId, 'Student Service can reach the professor here when a ticket needs academic verification.');
        }
        if (taId && serviceId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::ta-service`, [taId, serviceId], taId, 'TA and Student Service coordination is ready for student follow-up and group access checks.');
        }
        if (studentSecondaryId && serviceId) {
            seedChat(`chat::${normalizedFacultyCode.toLowerCase()}::student2-service`, [studentSecondaryId, serviceId], serviceId, 'This student starts with open registration, so use this thread to test fresh support and onboarding cases.');
        }
    }

    ensureTestingNotificationsForFaculty(facultyCode = 'ECON', demoAccounts = {}, courses = []) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const professorId = demoAccounts.professor?.id || '';
        const studentId = demoAccounts['student-primary']?.id || '';
        const courseName = String(courses[0]?.name || `${normalizedFacultyCode} Foundations`).trim();
        const existing = Object.values(this.state.notifications || {}).some(item =>
            String(item?.recipientUserId || '') === professorId
            && String(item?.type || '') === 'demo-ready'
            && String(item?.sourceDomain || '') === 'testing'
        );
        if (!existing && professorId) {
            this.createNotification({
                recipientUserId: professorId,
                sourceDomain: 'testing',
                type: 'demo-ready',
                title: 'Testing accounts prepared',
                body: `${normalizedFacultyCode} demo faculty pack is ready with rosters, grades, and messaging.`,
                routePage: 'admin-tools'
            });
        }
        const studentExisting = Object.values(this.state.notifications || {}).some(item =>
            String(item?.recipientUserId || '') === studentId
            && String(item?.type || '') === 'registration-open'
            && String(item?.sourceDomain || '') === 'registration'
        );
        if (!studentExisting && studentId) {
            this.createNotification({
                recipientUserId: studentId,
                sourceDomain: 'registration',
                type: 'registration-open',
                title: 'Registration window ready',
                body: `${courseName} and the rest of the demo schedule are ready for student testing.`,
                routePage: 'registration'
            });
        }
    }

    ensureTestingStoredFileReference(payload = {}) {
        const normalizedId = String(payload.id || '').trim();
        if (!normalizedId) return null;
        const existing = this.state.files[normalizedId];
        const stored = existing
            ? clone(existing)
            : this.createFileFromUpload({
                id: normalizedId,
                name: String(payload.name || `${normalizedId}.txt`).trim(),
                type: String(payload.type || 'text/plain').trim(),
                dataUrl: `data:${String(payload.type || 'text/plain').trim()};base64,${Buffer.from(String(payload.text || '').trim(), 'utf8').toString('base64')}`,
                uploadedBy: String(payload.uploadedBy || '').trim(),
                scope: String(payload.scope || 'testing').trim()
            });
        if (!stored) return null;
        return {
            id: `${normalizedId}_ref`,
            name: stored.name,
            type: stored.type,
            size: stored.size,
            storageKey: stored.id,
            storageBackend: 'bridge',
            uploadedAt: stored.uploadedAt,
            dataUrl: ''
        };
    }

    ensureTestingLmsArtifactsForFaculty(facultyCode = 'ECON', courses = [], sections = [], demoAccounts = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const facultySlug = normalizedFacultyCode.toLowerCase();
        const portalState = this.state.portal.state = this.state.portal.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        portalState.groupAssignments = portalState.groupAssignments && typeof portalState.groupAssignments === 'object' ? portalState.groupAssignments : {};
        portalState.groupMaterials = portalState.groupMaterials && typeof portalState.groupMaterials === 'object' ? portalState.groupMaterials : {};
        portalState.groupSubmissions = portalState.groupSubmissions && typeof portalState.groupSubmissions === 'object' ? portalState.groupSubmissions : {};
        portalState.groupConcepts = portalState.groupConcepts && typeof portalState.groupConcepts === 'object' ? portalState.groupConcepts : {};
        portalState.groupConceptRatings = portalState.groupConceptRatings && typeof portalState.groupConceptRatings === 'object' ? portalState.groupConceptRatings : {};
        portalState.groupWeekConfigs = portalState.groupWeekConfigs && typeof portalState.groupWeekConfigs === 'object' ? portalState.groupWeekConfigs : {};
        portalState.groupQuizzes = portalState.groupQuizzes && typeof portalState.groupQuizzes === 'object' ? portalState.groupQuizzes : {};
        portalState.groupQuizSubmissions = portalState.groupQuizSubmissions && typeof portalState.groupQuizSubmissions === 'object' ? portalState.groupQuizSubmissions : {};
        portalState.lmsQuizBuilder = portalState.lmsQuizBuilder && typeof portalState.lmsQuizBuilder === 'object' ? portalState.lmsQuizBuilder : {};

        const professorId = String(demoAccounts.professor?.id || '').trim();
        const taId = String(demoAccounts.ta?.id || '').trim();
        const primaryStudent = demoAccounts['student-primary'];
        const defaultWeeks = ['No Week / General', 'Week 1', 'Week 2', 'Week 3'];
        const seededSections = sections.slice(0, 2).filter(Boolean);

        seededSections.forEach((section, index) => {
            const course = courses.find(item => String(item?.id || '') === String(section.courseId || '')) || this.state.courses[section.courseId] || {};
            const resourceKey = `${section.courseId}::${section.groupId}`;
            const materialId = `testing-material-${facultySlug}-${index + 1}`;
            const assignmentId = `testing-assignment-${facultySlug}-${index + 1}`;
            const quizId = `testing-quiz-${facultySlug}-${index + 1}`;
            const draftQuizId = `testing-quiz-draft-${facultySlug}-${index + 1}`;
            const variantAId = `${quizId}-variant-a`;
            const variantBId = `${quizId}-variant-b`;
            const createdAt = nowIso();

            portalState.groupWeekConfigs[resourceKey] = uniqueStrings([
                ...(Array.isArray(portalState.groupWeekConfigs[resourceKey]) ? portalState.groupWeekConfigs[resourceKey] : []),
                ...defaultWeeks
            ]);
            portalState.groupMaterials[resourceKey] = Array.isArray(portalState.groupMaterials[resourceKey]) ? portalState.groupMaterials[resourceKey] : [];
            portalState.groupAssignments[resourceKey] = Array.isArray(portalState.groupAssignments[resourceKey]) ? portalState.groupAssignments[resourceKey] : [];
            portalState.groupSubmissions[resourceKey] = portalState.groupSubmissions[resourceKey] && typeof portalState.groupSubmissions[resourceKey] === 'object' ? portalState.groupSubmissions[resourceKey] : {};
            portalState.groupConcepts[resourceKey] = Array.isArray(portalState.groupConcepts[resourceKey]) ? portalState.groupConcepts[resourceKey] : [];
            portalState.groupConceptRatings[resourceKey] = portalState.groupConceptRatings[resourceKey] && typeof portalState.groupConceptRatings[resourceKey] === 'object' ? portalState.groupConceptRatings[resourceKey] : {};
            portalState.groupQuizzes[resourceKey] = Array.isArray(portalState.groupQuizzes[resourceKey]) ? portalState.groupQuizzes[resourceKey] : [];
            portalState.groupQuizSubmissions[resourceKey] = portalState.groupQuizSubmissions[resourceKey] && typeof portalState.groupQuizSubmissions[resourceKey] === 'object' ? portalState.groupQuizSubmissions[resourceKey] : {};

            const materialAttachment = this.ensureTestingStoredFileReference({
                id: `testing-file-material-${facultySlug}-${index + 1}`,
                name: `${String(course.code || section.courseId || 'course').toLowerCase()}-group-brief.txt`,
                type: 'text/plain',
                uploadedBy: professorId,
                scope: 'lms-material',
                text: `${course.name || section.courseId} testing brief\n\nUse this seeded material to verify downloads, file previews, and LMS group visibility for professor, TA, and student accounts.`
            });
            if (!portalState.groupMaterials[resourceKey].some(item => String(item?.id || '') === materialId)) {
                portalState.groupMaterials[resourceKey].push({
                    id: materialId,
                    title: `${course.name || section.courseId} Group Brief`,
                    description: 'Seeded material for validating cross-role LMS access, downloads, and group content visibility.',
                    weekLabel: 'Week 1',
                    attachment: materialAttachment,
                    createdAt,
                    createdBy: professorId
                });
            }

            const assignmentAttachment = this.ensureTestingStoredFileReference({
                id: `testing-file-assignment-${facultySlug}-${index + 1}`,
                name: `${String(course.code || section.courseId || 'course').toLowerCase()}-assignment.txt`,
                type: 'text/plain',
                uploadedBy: professorId,
                scope: 'lms-assignment',
                text: `${course.name || section.courseId} assignment instructions\n\n1. Open the LMS group.\n2. Upload a file or text answer.\n3. Confirm that TA and professor can review the submission.`
            });
            if (!portalState.groupAssignments[resourceKey].some(item => String(item?.id || '') === assignmentId)) {
                portalState.groupAssignments[resourceKey].push({
                    id: assignmentId,
                    title: `${course.name || section.courseId} Practice Assignment`,
                    description: 'Seeded assignment used for validating file submissions, grading visibility, and student-to-staff workflow.',
                    weekLabel: 'Week 2',
                    deadline: new Date(Date.now() + (1000 * 60 * 60 * 24 * 10)).toISOString(),
                    lateAllowed: true,
                    attachment: assignmentAttachment,
                    createdAt,
                    createdBy: professorId
                });
            }

            portalState.groupSubmissions[resourceKey][assignmentId] = portalState.groupSubmissions[resourceKey][assignmentId] && typeof portalState.groupSubmissions[resourceKey][assignmentId] === 'object'
                ? portalState.groupSubmissions[resourceKey][assignmentId]
                : {};
            if (primaryStudent?.id && !portalState.groupSubmissions[resourceKey][assignmentId][primaryStudent.id]) {
                portalState.groupSubmissions[resourceKey][assignmentId][primaryStudent.id] = {
                    studentId: primaryStudent.id,
                    studentName: primaryStudent.displayName || primaryStudent.nameEn || primaryStudent.name || primaryStudent.id,
                    text: `Seeded submission for ${course.name || section.courseId}. This verifies that teachers and TAs can open student work immediately.`,
                    file: this.ensureTestingStoredFileReference({
                        id: `testing-file-submission-${facultySlug}-${index + 1}`,
                        name: `${String(course.code || section.courseId || 'course').toLowerCase()}-submission.txt`,
                        type: 'text/plain',
                        uploadedBy: primaryStudent.id,
                        scope: 'lms-submission',
                        text: `Student submission for ${course.name || section.courseId}\n\nThis attachment exists so staff accounts can test reviewing uploaded homework without creating content manually.`
                    }),
                    submittedAt: createdAt
                };
            }

            const workspace = portalState.lmsQuizBuilder[resourceKey] = portalState.lmsQuizBuilder[resourceKey] && typeof portalState.lmsQuizBuilder[resourceKey] === 'object'
                ? portalState.lmsQuizBuilder[resourceKey]
                : {};
            workspace.drafts = Array.isArray(workspace.drafts) ? workspace.drafts : [];
            workspace.published = Array.isArray(workspace.published) ? workspace.published : [];
            workspace.closed = Array.isArray(workspace.closed) ? workspace.closed : [];
            workspace.submissions = workspace.submissions && typeof workspace.submissions === 'object' ? workspace.submissions : {};
            workspace.ui = workspace.ui && typeof workspace.ui === 'object' ? workspace.ui : {};

            if (!workspace.drafts.some(item => String(item?.id || '') === draftQuizId)) {
                workspace.drafts.unshift({
                    id: draftQuizId,
                    title: `${course.name || section.courseId} Draft Follow-up Quiz`,
                    description: 'Seeded draft so professor and TA testing accounts can review the authoring workflow immediately.',
                    assessmentType: 'quiz',
                    status: 'draft',
                    weekLabel: 'Week 3',
                    durationMinutes: 15,
                    createdAt,
                    updatedAt: createdAt,
                    publishedAt: null,
                    publishedBy: '',
                    allowedStudentIds: primaryStudent?.id ? [String(primaryStudent.id)] : [],
                    questions: [
                        {
                            id: `${draftQuizId}-q1`,
                            type: 'mcq',
                            text: 'Which dashboard section is used to review group materials?',
                            score: 1,
                            optionCount: 4,
                            options: ['Programs', 'LMS', 'Orders', 'Profile'],
                            correctOption: 1,
                            expectedAnswer: ''
                        }
                    ],
                    variantEnabled: false,
                    variants: [],
                    studentVariantMap: {}
                });
            }

            if (!workspace.published.some(item => String(item?.id || '') === quizId)) {
                const baseQuestions = [
                    {
                        id: `${quizId}-q1`,
                        type: 'mcq',
                        text: `Which group is assigned to ${course.name || section.courseId}?`,
                        score: 1,
                        optionCount: 4,
                        options: [section.groupName || section.groupId, 'Group 9', 'Seminar 4', 'No group'],
                        correctOption: 0,
                        expectedAnswer: ''
                    },
                    {
                        id: `${quizId}-q2`,
                        type: 'mcq',
                        text: 'Which role can grade this seeded workspace?',
                        score: 1,
                        optionCount: 4,
                        options: ['Only student', 'Professor and TA', 'Only guest', 'Nobody'],
                        correctOption: 1,
                        expectedAnswer: ''
                    },
                    {
                        id: `${quizId}-q3`,
                        type: 'written',
                        text: 'Write one sentence describing the main outcome of this practice session.',
                        score: 2,
                        optionCount: 0,
                        options: [],
                        correctOption: null,
                        expectedAnswer: 'The student can describe the testing workflow clearly.'
                    }
                ];
                const allowedStudentIds = primaryStudent?.id ? [String(primaryStudent.id)] : [];
                const publishedQuiz = {
                    id: quizId,
                    title: `${course.name || section.courseId} Practice Quiz`,
                    description: 'Seeded published quiz for validating quiz access, variants, grading, and staff review.',
                    assessmentType: 'quiz',
                    status: 'published',
                    weekLabel: 'Week 1',
                    durationMinutes: 20,
                    createdAt,
                    updatedAt: createdAt,
                    publishedAt: createdAt,
                    publishedBy: professorId,
                    allowedStudentIds,
                    attendanceRequired: true,
                    submissionsVisible: true,
                    attendanceMode: 'manual-access-list',
                    lockedAfterPublish: true,
                    variantEnabled: true,
                    variantCount: 2,
                    questionsPerVariant: 2,
                    studentVariantMap: primaryStudent?.id ? { [String(primaryStudent.id)]: variantAId } : {},
                    variants: [
                        {
                            id: variantAId,
                            label: 'Variant A',
                            customized: false,
                            generatedAt: createdAt,
                            questions: [baseQuestions[0], baseQuestions[2]]
                        },
                        {
                            id: variantBId,
                            label: 'Variant B',
                            customized: false,
                            generatedAt: createdAt,
                            questions: [baseQuestions[1], baseQuestions[2]]
                        }
                    ],
                    questions: baseQuestions
                };
                workspace.published.unshift(publishedQuiz);
                portalState.groupQuizzes[resourceKey].push({
                    id: publishedQuiz.id,
                    title: publishedQuiz.title,
                    status: publishedQuiz.status,
                    publishedAt: publishedQuiz.publishedAt,
                    allowedStudentIds: clone(publishedQuiz.allowedStudentIds)
                });
            }

            workspace.submissions[quizId] = workspace.submissions[quizId] && typeof workspace.submissions[quizId] === 'object'
                ? workspace.submissions[quizId]
                : {};
        });
    }

    ensureTestingStudentServiceStateForFaculty(facultyCode = 'ECON', courses = [], sections = [], demoAccounts = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const facultySlug = normalizedFacultyCode.toLowerCase();
        const portalState = this.state.portal.state = this.state.portal.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        portalState.studentServiceTickets = Array.isArray(portalState.studentServiceTickets) ? portalState.studentServiceTickets : [];
        portalState.studentServiceArticles = Array.isArray(portalState.studentServiceArticles) ? portalState.studentServiceArticles : [];
        portalState.studentServiceMacros = Array.isArray(portalState.studentServiceMacros) ? portalState.studentServiceMacros : [];

        const primaryStudent = demoAccounts['student-primary'];
        const serviceUser = demoAccounts['student-service'];
        const professor = demoAccounts.professor;
        const ta = demoAccounts.ta;
        const firstCourse = courses[0] || {};
        const firstSection = sections[0] || {};
        const now = nowIso();

        const seededTicketId = `testing-svc-${facultySlug}-registration-check`;
        if (primaryStudent?.id && serviceUser?.id && !portalState.studentServiceTickets.some(ticket => String(ticket?.id || '') === seededTicketId)) {
            portalState.studentServiceTickets.unshift({
                id: seededTicketId,
                studentId: primaryStudent.id,
                studentName: primaryStudent.displayName || primaryStudent.nameEn || primaryStudent.name || primaryStudent.id,
                semester: Number(primaryStudent.semester || 0) || 0,
                serviceArea: 'registration',
                category: 'Registration / Enrollment',
                title: `${firstCourse.name || normalizedFacultyCode} registration checkpoint`,
                message: 'Please confirm that my joined group, LMS files, and quiz access are visible to the teaching team.',
                status: 'Waiting for Student',
                createdAt: now,
                updatedAt: now,
                relatedSubjectId: firstCourse.id || '',
                relatedSubjectName: firstCourse.name || '',
                relatedContextLabel: `${firstCourse.name || normalizedFacultyCode}${firstSection.groupName ? ` / ${firstSection.groupName}` : ''}`,
                faculty: normalizedFacultyCode,
                assignedToRole: 'student_service',
                assignedToId: serviceUser.id,
                assignedToName: serviceUser.displayName || serviceUser.nameEn || serviceUser.name || serviceUser.id,
                intakeContext: {
                    sourcePage: 'registration',
                    sourceLabel: 'Registration',
                    roleAtSubmission: 'student',
                    facultyAtSubmission: normalizedFacultyCode,
                    studentBalance: Number(portalState.tuitionBalances?.[primaryStudent.id] || 0),
                    probationActive: Boolean(portalState.probationStatus?.[primaryStudent.id]),
                    registeredSubjects: Array.isArray(portalState.studentSchedulesByStudent?.[primaryStudent.id]) ? portalState.studentSchedulesByStudent[primaryStudent.id].length : 0,
                    savedRegistrations: Array.isArray(portalState.studentRegistrations?.[primaryStudent.id]) ? portalState.studentRegistrations[primaryStudent.id].length : 0
                },
                handoff: {
                    status: 'Requested',
                    targetRole: 'professor',
                    targetId: professor?.id || '',
                    targetName: professor?.displayName || professor?.nameEn || professor?.name || '',
                    requestedAt: now,
                    note: `Faculty handoff seeded for ${ta?.displayName || ta?.nameEn || ta?.name || 'TA'} and professor verification.`
                },
                thread: [
                    {
                        id: `${seededTicketId}-thread-1`,
                        authorId: primaryStudent.id,
                        authorName: primaryStudent.displayName || primaryStudent.nameEn || primaryStudent.name || primaryStudent.id,
                        authorRole: 'student',
                        message: 'I need to confirm that my group schedule, LMS files, and quiz access are working before live onboarding starts.',
                        createdAt: now,
                        type: 'request'
                    },
                    {
                        id: `${seededTicketId}-thread-2`,
                        authorId: serviceUser.id,
                        authorName: serviceUser.displayName || serviceUser.nameEn || serviceUser.name || serviceUser.id,
                        authorRole: 'student_service',
                        message: 'Student Service checked the registration context and handed the case to teaching staff so TA and professor can verify the academic side.',
                        createdAt: now,
                        type: 'reply'
                    }
                ]
            });
        }

        const articleId = `testing-svc-article-${facultySlug}-registration`;
        if (!portalState.studentServiceArticles.some(article => String(article?.id || '') === articleId)) {
            portalState.studentServiceArticles.unshift({
                id: articleId,
                title: `${normalizedFacultyCode} demo registration and LMS access guide`,
                summary: 'Use this article to validate that testing students can join groups and open the seeded LMS workspace.',
                content: `1. Sign in as the secondary student demo account.\n2. Join an available group from registration.\n3. Reopen LMS and verify materials, assignments, and the testing quiz.\n4. Use Student Service if the roster or schedule context is missing.`,
                category: 'Registration / Enrollment',
                serviceArea: 'registration',
                faculty: normalizedFacultyCode,
                featured: true,
                published: true,
                createdAt: now,
                updatedAt: now
            });
        }

        const macroId = `testing-svc-macro-${facultySlug}-routing`;
        if (!portalState.studentServiceMacros.some(macro => String(macro?.id || '') === macroId)) {
            portalState.studentServiceMacros.unshift({
                id: macroId,
                title: 'Route academic access issue',
                category: 'Registration / Enrollment',
                serviceArea: 'registration',
                content: `Student Service verified the portal context. Escalate to ${professor?.displayName || 'Professor'} and ${ta?.displayName || 'TA'} if the group roster, LMS files, or quiz access still do not match the student schedule.`,
                published: true,
                createdAt: now,
                updatedAt: now
            });
        }
    }

    ensureTestingSocialStateForFaculty(facultyCode = 'ECON', courses = [], sections = [], demoAccounts = {}) {
        const normalizedFacultyCode = this.normalizeTestingFacultyCode(facultyCode);
        const facultySlug = normalizedFacultyCode.toLowerCase();
        const professorId = String(demoAccounts.professor?.id || '').trim();
        const taId = String(demoAccounts.ta?.id || '').trim();
        const serviceId = String(demoAccounts['student-service']?.id || '').trim();
        const primaryStudentId = String(demoAccounts['student-primary']?.id || '').trim();
        const secondaryStudentId = String(demoAccounts['student-secondary']?.id || '').trim();
        const firstCourse = courses[0] || {};
        const firstSection = sections[0] || {};

        Object.values(demoAccounts).forEach(account => {
            if (!account?.id) return;
            this.upsertSocialProfile(account.id, {
                userId: account.id,
                visibility: 'public',
                defaultAudience: 'campus',
                digestFrequency: 'daily',
                eventReminderLeadHours: 24
            }, account.id);
        });

        const ensureAcceptedConnection = (leftId, rightId) => {
            const left = String(leftId || '').trim();
            const right = String(rightId || '').trim();
            if (!left || !right || left === right || this.isSocialConnection(left, right)) return;
            const pending = this.getPendingSocialConnectionRequestBetween(left, right);
            if (pending) {
                const recipientId = String(pending.toId || '').trim();
                if (recipientId) this.respondSocialConnectionRequest(pending.id, recipientId, true);
                return;
            }
            const request = this.sendSocialConnectionRequest(left, right);
            if (request?.id) this.respondSocialConnectionRequest(request.id, right, true);
        };

        [
            [professorId, taId],
            [professorId, serviceId],
            [taId, serviceId],
            [primaryStudentId, professorId],
            [primaryStudentId, taId],
            [primaryStudentId, serviceId],
            [secondaryStudentId, serviceId]
        ].forEach(pair => ensureAcceptedConnection(pair[0], pair[1]));

        if (!professorId) return;
        const groupId = `testing-group-${facultySlug}-hub`;
        let group = this.getSocialGroupRecord(groupId);
        if (!group) {
            group = this.createSocialGroup({
                id: groupId,
                ownerUserId: professorId,
                name: `${normalizedFacultyCode} Testing Hub`,
                description: `Cross-role testing workspace for ${firstCourse.name || normalizedFacultyCode}. The secondary student can join manually to test public group access.`,
                visibility: 'public',
                facultyCode: normalizedFacultyCode,
                adminIds: taId ? [taId] : [],
                memberIds: [primaryStudentId, serviceId].filter(Boolean),
                createdAt: nowIso(),
                updatedAt: nowIso()
            }, professorId);
        } else {
            group.adminIds = uniqueStrings([...(Array.isArray(group.adminIds) ? group.adminIds : []), taId].filter(Boolean));
            group.memberIds = uniqueStrings([...(Array.isArray(group.memberIds) ? group.memberIds : []), primaryStudentId, serviceId].filter(Boolean));
            group.pendingMemberIds = (Array.isArray(group.pendingMemberIds) ? group.pendingMemberIds : []).filter(userId =>
                !group.memberIds.includes(userId)
            );
            group.facultyCode = group.facultyCode || normalizedFacultyCode;
            group.description = group.description || `Testing workspace for ${normalizedFacultyCode} cross-role validation.`;
            group.updatedAt = nowIso();
            this.normalizeSocialGroupState(group);
        }
        if (!group?.id) return;

        const chatResult = this.ensureSocialGroupChat(group.id, professorId);
        const chatId = String(chatResult?.chat?.id || group.chatId || '').trim();
        const groupChat = chatId ? this.state.chats[chatId] : null;
        if (groupChat && (!Array.isArray(groupChat.messages) || groupChat.messages.length === 0)) {
            this.appendMessage({
                chatId,
                type: 'group',
                members: this.getSocialGroupMemberIds(group),
                name: group.name,
                createdBy: professorId,
                senderId: professorId,
                message: {
                    text: `Testing hub is ready for ${normalizedFacultyCode}. Professor, TA, Student Service, and the active student are already connected here, and the secondary student can join from the portal to test live membership changes.`,
                    senderName: this.state.accounts[professorId]?.displayName || professorId
                }
            });
        }
    }

    sanitizeAccountForClient(account) {
        const sanitized = sanitizeAccount(account);
        if (!sanitized) return null;
        return {
            ...sanitized,
            effectivePrivileges: this.getEffectiveAccountPrivileges(sanitized.id),
            ...this.getSocialPresenceForUser(sanitized.id)
        };
    }

    ensureNewsState() {
        if (!this.state.news || typeof this.state.news !== 'object') {
            this.state.news = createEmptyNewsState();
        }
        if (!Array.isArray(this.state.news.posts)) this.state.news.posts = [];
        if (!Array.isArray(this.state.news.replies)) this.state.news.replies = [];
        return this.state.news;
    }

    ensureStudentServiceState() {
        if (!this.state.studentService || typeof this.state.studentService !== 'object') {
            this.state.studentService = createEmptyStudentServiceState();
        }
        const serviceState = this.state.studentService;
        serviceState.tickets = Array.isArray(serviceState.tickets) ? serviceState.tickets : [];
        serviceState.questions = Array.isArray(serviceState.questions) ? serviceState.questions : [];
        serviceState.answers = Array.isArray(serviceState.answers) ? serviceState.answers : [];
        serviceState.articles = Array.isArray(serviceState.articles) ? serviceState.articles : [];
        serviceState.macros = Array.isArray(serviceState.macros) ? serviceState.macros : [];
        serviceState.reviewQueue = Array.isArray(serviceState.reviewQueue) ? serviceState.reviewQueue : [];

        const portalState = this.state.portal?.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        if (!serviceState.tickets.length && Array.isArray(portalState.studentServiceTickets)) {
            serviceState.tickets = portalState.studentServiceTickets.map((ticket, index) => this.normalizeStudentServiceTicketRecord(ticket, index));
        } else {
            serviceState.tickets = serviceState.tickets.map((ticket, index) => this.normalizeStudentServiceTicketRecord(ticket, index));
        }
        if (!serviceState.articles.length && Array.isArray(portalState.studentServiceArticles)) {
            serviceState.articles = portalState.studentServiceArticles.map((article, index) => this.normalizeStudentServiceArticleRecord(article, index));
        } else {
            serviceState.articles = serviceState.articles.map((article, index) => this.normalizeStudentServiceArticleRecord(article, index));
        }
        if (!serviceState.macros.length && Array.isArray(portalState.studentServiceMacros)) {
            serviceState.macros = portalState.studentServiceMacros.map((macro, index) => this.normalizeStudentServiceMacroRecord(macro, index));
        } else {
            serviceState.macros = serviceState.macros.map((macro, index) => this.normalizeStudentServiceMacroRecord(macro, index));
        }
        if (!serviceState.questions.length && Array.isArray(portalState.studentServiceQuestions)) {
            serviceState.questions = portalState.studentServiceQuestions.map((question, index) => this.normalizeStudentServiceQuestionRecord(question, index));
        } else {
            serviceState.questions = serviceState.questions.map((question, index) => this.normalizeStudentServiceQuestionRecord(question, index));
        }
        if (!serviceState.answers.length && Array.isArray(portalState.studentServiceAnswers)) {
            serviceState.answers = portalState.studentServiceAnswers.map((answer, index) => this.normalizeStudentServiceAnswerRecord(answer, index));
        } else {
            serviceState.answers = serviceState.answers.map((answer, index) => this.normalizeStudentServiceAnswerRecord(answer, index));
        }

        if (!serviceState.articles.length) {
            serviceState.articles = STUDENT_SERVICE_DEFAULT_ARTICLES.map((article, index) => this.normalizeStudentServiceArticleRecord(article, index));
        }
        if (!serviceState.macros.length) {
            serviceState.macros = STUDENT_SERVICE_DEFAULT_MACROS.map((macro, index) => this.normalizeStudentServiceMacroRecord(macro, index));
        }

        serviceState.reviewQueue = serviceState.reviewQueue
            .map((entry, index) => this.normalizeStudentServiceReviewQueueEntry(entry, index))
            .filter(Boolean);

        return serviceState;
    }

    getStudentServiceAccount(userId = '') {
        return this.state.accounts[String(userId || '').trim()] || null;
    }

    getStudentServiceRole(userId = '') {
        return String(this.getStudentServiceAccount(userId)?.role || '').trim().toLowerCase();
    }

    getStudentServiceFacultyCode(userId = '', fallback = '') {
        return normalizeCode(
            this.getStudentServiceAccount(userId)?.facultyCode
            || this.getStudentServiceAccount(userId)?.faculty
            || fallback
        );
    }

    canModerateStudentService(userId = '') {
        const role = this.getStudentServiceRole(userId);
        return ['admin', 'student_service'].includes(role);
    }

    canRespondToStudentServiceQuestion(question = {}, userId = '') {
        const role = this.getStudentServiceRole(userId);
        if (!role) return false;
        if (['admin', 'student_service'].includes(role)) return true;
        if (!['professor', 'ta'].includes(role)) return false;
        const category = normalizeStudentServiceCategory(question.category);
        if (!STUDENT_SERVICE_RESPONDER_CATEGORIES.has(category)) return false;
        const responderFaculty = this.getStudentServiceFacultyCode(userId, '');
        const questionFaculty = normalizeCode(question.facultyCode || question.faculty || '');
        return !questionFaculty || !responderFaculty || questionFaculty === responderFaculty;
    }

    shouldForceStudentServiceTicket(payload = {}) {
        if (payload.forcePrivate === true || payload.publiclyVisible === false) return true;
        const category = normalizeStudentServiceCategory(payload.category);
        const body = String(payload.body || payload.message || '').trim().toLowerCase();
        if (STUDENT_SERVICE_SENSITIVE_CATEGORIES.has(category)) return true;
        return /(grade appeal|passport|id card|bank|tuition|payment|invoice|receipt|transcript|certificate|balance)/i.test(body);
    }

    normalizeStudentServiceThreadEntry(entry = {}, fallback = {}) {
        return normalizeStudentServiceThreadEntry(entry, fallback);
    }

    normalizeStudentServiceInternalNote(note = {}, index = 0) {
        return normalizeStudentServiceInternalNote(note, index);
    }

    normalizeStudentServiceTicketRecord(ticket = {}, index = 0) {
        return normalizeStudentServiceTicketRecord(ticket, index);
    }

    normalizeStudentServiceArticleRecord(article = {}, index = 0) {
        return normalizeStudentServiceArticleRecord(article, index);
    }

    normalizeStudentServiceMacroRecord(macro = {}, index = 0) {
        return normalizeStudentServiceMacroRecord(macro, index);
    }

    normalizeStudentServiceQuestionRecord(question = {}, index = 0) {
        return normalizeStudentServiceQuestionRecord(question, index);
    }

    normalizeStudentServiceAnswerRecord(answer = {}, index = 0) {
        return normalizeStudentServiceAnswerRecord(answer, index);
    }

    normalizeStudentServiceReviewQueueEntry(entry = {}, index = 0) {
        return normalizeStudentServiceReviewQueueEntry(entry, index);
    }

    upsertStudentServiceReviewQueue(entityType = '', entityId = '', reason = 'pending-review') {
        const serviceState = this.ensureStudentServiceState();
        const normalizedEntityType = String(entityType || '').trim().toLowerCase();
        const normalizedEntityId = String(entityId || '').trim();
        if (!normalizedEntityType || !normalizedEntityId) return null;
        const existing = serviceState.reviewQueue.find(entry =>
            entry.entityType === normalizedEntityType
            && entry.entityId === normalizedEntityId
            && entry.reason === reason
            && entry.status === 'open'
        );
        if (existing) {
            existing.updatedAt = nowIso();
            return existing;
        }
        const nextEntry = this.normalizeStudentServiceReviewQueueEntry({
            id: makeId('svc_review'),
            entityType: normalizedEntityType,
            entityId: normalizedEntityId,
            reason,
            status: 'open',
            createdAt: nowIso(),
            updatedAt: nowIso()
        }, serviceState.reviewQueue.length);
        serviceState.reviewQueue.unshift(nextEntry);
        return nextEntry;
    }

    resolveStudentServiceReviewQueue(entityType = '', entityId = '', actorId = '', reason = '') {
        const serviceState = this.ensureStudentServiceState();
        const normalizedEntityType = String(entityType || '').trim().toLowerCase();
        const normalizedEntityId = String(entityId || '').trim();
        serviceState.reviewQueue.forEach(entry => {
            if (entry.entityType !== normalizedEntityType || entry.entityId !== normalizedEntityId) return;
            if (reason && entry.reason !== reason) return;
            entry.status = 'resolved';
            entry.updatedAt = nowIso();
            entry.resolvedAt = nowIso();
            entry.resolvedBy = String(actorId || '').trim();
        });
    }

    getStudentServiceViewerState(viewerUserId = '') {
        const viewerId = String(viewerUserId || '').trim();
        const role = this.getStudentServiceRole(viewerId);
        const facultyCode = this.getStudentServiceFacultyCode(viewerId, '');
        return {
            viewerId,
            role,
            facultyCode,
            canModerate: this.canModerateStudentService(viewerId)
        };
    }

    getStudentServiceQuestionAuthorLabel(question = {}, viewer = {}) {
        if (!question.anonymousMode) return question.authorDisplayName || 'Student';
        if (viewer.canModerate) return question.authorDisplayName || 'Student';
        if (viewer.viewerId && viewer.viewerId === String(question.authorUserId || '').trim()) return 'Anonymous (you)';
        if (this.canRespondToStudentServiceQuestion(question, viewer.viewerId)) return 'Anonymous student';
        return 'Anonymous';
    }

    canViewStudentServiceTicket(ticket = {}, viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        if (viewer.canModerate) return true;
        return viewer.role === 'student' && viewer.viewerId === String(ticket.studentId || '').trim();
    }

    canViewStudentServiceQuestion(question = {}, viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        if (viewer.canModerate) return true;
        if (!question || question.status === 'archived') return false;
        if (viewer.role === 'student' && viewer.viewerId === String(question.authorUserId || '').trim()) return true;
        if (this.canRespondToStudentServiceQuestion(question, viewer.viewerId)) return true;
        return question.status === 'published' && !question.mergedIntoQuestionId;
    }

    canViewStudentServiceAnswer(question = {}, answer = {}, viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        if (viewer.canModerate) return true;
        if (String(answer.authorUserId || '').trim() === viewer.viewerId) return true;
        if (answer.status === 'published' && this.canViewStudentServiceQuestion(question, viewerUserId)) return true;
        return this.canRespondToStudentServiceQuestion(question, viewer.viewerId);
    }

    decorateStudentServiceTicket(ticket = {}, viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        const decorated = clone(ticket) || {};
        if (!viewer.canModerate) {
            decorated.internalNotes = [];
            decorated.handoff = {
                target: '',
                status: '',
                summary: '',
                requestedAt: '',
                updatedAt: '',
                requestedById: '',
                requestedByName: ''
            };
        }
        return decorated;
    }

    decorateStudentServiceAnswer(answer = {}, question = {}, viewer = {}) {
        return {
            ...clone(answer),
            authorLabel: answer.authorDisplayName || 'Staff',
            viewerCanPublish: viewer.canModerate,
            viewerCanArchive: viewer.canModerate
        };
    }

    decorateStudentServiceQuestion(question = {}, viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        const answers = this.ensureStudentServiceState().answers
            .filter(answer => String(answer.questionId || '').trim() === String(question.id || '').trim())
            .filter(answer => this.canViewStudentServiceAnswer(question, answer, viewerUserId))
            .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')))
            .map(answer => this.decorateStudentServiceAnswer(answer, question, viewer));
        const helpful = question.helpfulVotes.filter(entry => entry.value === 'helpful').length;
        const notHelpful = question.helpfulVotes.filter(entry => entry.value === 'not_helpful').length;
        const viewerVote = question.helpfulVotes.find(entry => entry.userId === viewer.viewerId) || null;
        const decorated = {
            ...clone(question),
            authorLabel: this.getStudentServiceQuestionAuthorLabel(question, viewer),
            answers,
            answerCount: answers.length,
            helpfulCount: helpful,
            notHelpfulCount: notHelpful,
            viewerVote: viewerVote?.value || '',
            viewerCanModerate: viewer.canModerate,
            viewerCanRespond: this.canRespondToStudentServiceQuestion(question, viewer.viewerId),
            viewerCanAcceptAnswer: viewer.canModerate || (viewer.role === 'student' && viewer.viewerId === String(question.authorUserId || '').trim()),
            viewerCanConvert: viewer.canModerate
        };
        if (question.anonymousMode && !viewer.canModerate && viewer.viewerId !== String(question.authorUserId || '').trim()) {
            decorated.authorUserId = '';
            decorated.authorDisplayName = '';
            decorated.authorRole = '';
        }
        return decorated;
    }

    getStudentServiceAnalytics(viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        const serviceState = this.ensureStudentServiceState();
        const visibleQuestions = serviceState.questions.filter(question => this.canViewStudentServiceQuestion(question, viewer.viewerId));
        const unanswered = visibleQuestions.filter(question =>
            !serviceState.answers.some(answer =>
                String(answer.questionId || '').trim() === String(question.id || '').trim()
                && answer.status === 'published'
            )
        );
        return {
            totalQuestions: visibleQuestions.length,
            publishedQuestions: visibleQuestions.filter(question => question.status === 'published').length,
            unansweredQuestions: unanswered.length,
            repeatedTopics: STUDENT_SERVICE_CATEGORIES.map(category => ({
                category,
                count: visibleQuestions.filter(question => question.category === category).length
            })).sort((left, right) => right.count - left.count).slice(0, 5),
            reviewBacklog: viewer.canModerate
                ? serviceState.reviewQueue.filter(entry => entry.status === 'open').length
                : 0
        };
    }

    getStudentServiceBootstrap(viewerUserId = '') {
        return getStudentServiceBootstrap.call(this, viewerUserId);
    }

    createStudentServiceTicket(payload = {}, actorId = '') {
        const actor = this.getStudentServiceAccount(actorId);
        if (!actor) return { error: 'Student Service ticket author was not found.', status: 404 };
        const role = String(actor.role || '').trim().toLowerCase();
        if (!['student', 'admin', 'student_service'].includes(role)) {
            return { error: 'Only students or service staff may create tickets.', status: 403 };
        }
        const message = String(payload.message || payload.body || '').trim();
        if (!message) return { error: 'Ticket message is required.', status: 400 };
        const category = normalizeStudentServiceCategory(payload.category);
        const createdAt = nowIso();
        const ticket = this.normalizeStudentServiceTicketRecord({
            id: payload.id || `SVC-${Date.now()}`,
            studentId: String(payload.studentId || actor.id).trim(),
            studentName: String(payload.studentName || actor.displayName || actor.nameEn || actor.name || actor.id).trim(),
            semester: payload.semester || actor.semester || '',
            category,
            serviceArea: payload.serviceArea || getStudentServiceAreaForCategory(category),
            title: payload.title || payload.subject || 'Support Request',
            message,
            status: payload.status || 'Open',
            facultyCode: payload.facultyCode || payload.faculty || actor.facultyCode || actor.faculty || '',
            relatedSubjectId: payload.relatedSubjectId || '',
            relatedSubjectName: payload.relatedSubjectName || '',
            relatedContextLabel: payload.relatedContextLabel || '',
            intakeContext: clone(payload.intakeContext || {}) || {},
            anonymousMode: Boolean(payload.anonymousMode),
            displayIdentityToPeers: payload.displayIdentityToPeers === true,
            questionId: payload.questionId || '',
            createdAt,
            updatedAt: createdAt,
            thread: [{
                id: makeId('svc_msg'),
                authorId: payload.studentId || actor.id,
                authorName: payload.studentName || actor.displayName || actor.nameEn || actor.name || actor.id,
                authorRole: payload.authorRole || role,
                message,
                createdAt
            }]
        }, this.ensureStudentServiceState().tickets.length);
        this.ensureStudentServiceState().tickets.unshift(ticket);
        this.createNotification({
            recipientUserId: ticket.studentId,
            sourceDomain: 'student-service',
            type: 'student-service-ticket',
            title: 'Student Service ticket created',
            body: `${ticket.title} was added to the service desk.`,
            routePage: 'student-service',
            routeData: { ticketId: ticket.id }
        });
        this.save();
        return ticket;
    }

    replyStudentServiceTicket(ticketId, payload = {}, actorId = '') {
        const actor = this.getStudentServiceAccount(actorId);
        if (!actor) return { error: 'Reply author was not found.', status: 404 };
        const serviceState = this.ensureStudentServiceState();
        const ticket = serviceState.tickets.find(item => String(item.id || '').trim() === String(ticketId || '').trim());
        if (!ticket) return { error: 'Ticket was not found.', status: 404 };
        const role = String(actor.role || '').trim().toLowerCase();
        if (!this.canViewStudentServiceTicket(ticket, actorId) && !this.canModerateStudentService(actorId)) {
            return { error: 'You are not allowed to reply to this ticket.', status: 403 };
        }
        const message = String(payload.message || '').trim();
        if (!message) return { error: 'Reply body is required.', status: 400 };
        ticket.thread.push(this.normalizeStudentServiceThreadEntry({
            id: makeId('svc_msg'),
            authorId: actor.id,
            authorName: actor.displayName || actor.nameEn || actor.name || actor.id,
            authorRole: role,
            message,
            createdAt: nowIso()
        }));
        ticket.latestPreview = message;
        ticket.updatedAt = nowIso();
        if (role === 'student' && ticket.status !== 'Closed') ticket.status = 'Waiting for Service';
        if (['admin', 'student_service'].includes(role) && ticket.status !== 'Closed') ticket.status = 'Waiting for Student';
        this.save();
        return clone(ticket);
    }

    updateStudentServiceTicketStatus(ticketId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can update ticket status.', status: 403 };
        const ticket = this.ensureStudentServiceState().tickets.find(item => String(item.id || '').trim() === String(ticketId || '').trim());
        if (!ticket) return { error: 'Ticket was not found.', status: 404 };
        const nextStatus = ['Open', 'In Review', 'Waiting for Student', 'Waiting for Service', 'Resolved', 'Closed'].includes(String(payload.status || '').trim())
            ? String(payload.status).trim()
            : '';
        if (!nextStatus) return { error: 'Invalid ticket status.', status: 400 };
        ticket.status = nextStatus;
        ticket.updatedAt = nowIso();
        this.save();
        return clone(ticket);
    }

    assignStudentServiceTicket(ticketId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can assign tickets.', status: 403 };
        const ticket = this.ensureStudentServiceState().tickets.find(item => String(item.id || '').trim() === String(ticketId || '').trim());
        if (!ticket) return { error: 'Ticket was not found.', status: 404 };
        const assigneeId = String(payload.assigneeId || actorId).trim();
        const assignee = this.getStudentServiceAccount(assigneeId);
        ticket.assignedToId = assigneeId;
        ticket.assignedToRole = String(assignee?.role || payload.assigneeRole || '').trim().toLowerCase();
        ticket.assignedToName = String(assignee?.displayName || assignee?.nameEn || assignee?.name || payload.assigneeName || assigneeId).trim();
        ticket.updatedAt = nowIso();
        this.save();
        return clone(ticket);
    }

    addStudentServiceInternalNote(ticketId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can add internal notes.', status: 403 };
        const ticket = this.ensureStudentServiceState().tickets.find(item => String(item.id || '').trim() === String(ticketId || '').trim());
        if (!ticket) return { error: 'Ticket was not found.', status: 404 };
        const actor = this.getStudentServiceAccount(actorId);
        const message = String(payload.message || '').trim();
        if (!message) return { error: 'Internal note body is required.', status: 400 };
        ticket.internalNotes.push(this.normalizeStudentServiceInternalNote({
            id: makeId('svc_note'),
            authorId: actorId,
            authorName: actor?.displayName || actor?.nameEn || actor?.name || actorId,
            authorRole: actor?.role || 'student_service',
            message,
            createdAt: nowIso()
        }, ticket.internalNotes.length));
        ticket.updatedAt = nowIso();
        this.save();
        return clone(ticket);
    }

    updateStudentServiceTicketHandoff(ticketId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can update handoff state.', status: 403 };
        const ticket = this.ensureStudentServiceState().tickets.find(item => String(item.id || '').trim() === String(ticketId || '').trim());
        if (!ticket) return { error: 'Ticket was not found.', status: 404 };
        const actor = this.getStudentServiceAccount(actorId);
        ticket.handoff = {
            target: String(payload.target || '').trim(),
            status: String(payload.status || 'Not Needed').trim(),
            summary: String(payload.summary || '').trim(),
            requestedAt: String(ticket.handoff?.requestedAt || (payload.target ? nowIso() : '')).trim(),
            updatedAt: nowIso(),
            requestedById: String(actorId || '').trim(),
            requestedByName: String(actor?.displayName || actor?.nameEn || actor?.name || actorId).trim()
        };
        ticket.updatedAt = nowIso();
        if (ticket.handoff.summary) ticket.latestPreview = ticket.handoff.summary;
        this.save();
        return clone(ticket);
    }

    saveStudentServiceArticle(payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can save articles.', status: 403 };
        const title = String(payload.title || '').trim();
        const summary = String(payload.summary || '').trim();
        const content = String(payload.content || '').trim();
        if (!title || !summary || !content) return { error: 'Article title, summary, and content are required.', status: 400 };
        const serviceState = this.ensureStudentServiceState();
        const articleId = String(payload.id || makeId('svc_article')).trim();
        const index = serviceState.articles.findIndex(item => String(item.id || '').trim() === articleId);
        const previous = index >= 0 ? serviceState.articles[index] : null;
        const nextArticle = this.normalizeStudentServiceArticleRecord({
            ...previous,
            ...payload,
            id: articleId,
            published: payload.published !== false,
            createdBy: previous?.createdBy || actorId,
            updatedBy: actorId,
            updatedAt: nowIso()
        }, index >= 0 ? index : serviceState.articles.length);
        if (index >= 0) serviceState.articles[index] = nextArticle;
        else serviceState.articles.unshift(nextArticle);
        this.save();
        return clone(nextArticle);
    }

    createStudentServiceQuestion(payload = {}, actorId = '') {
        const actor = this.getStudentServiceAccount(actorId);
        if (!actor) return { error: 'Question author was not found.', status: 404 };
        if (String(actor.role || '').trim().toLowerCase() !== 'student') {
            return { error: 'Only students may create public questions.', status: 403 };
        }
        if (this.shouldForceStudentServiceTicket(payload)) {
            const ticket = this.createStudentServiceTicket({
                ...payload,
                message: payload.body || payload.message || '',
                title: payload.title || 'Sensitive support request',
                forcePrivate: true
            }, actorId);
            if (ticket?.error) return ticket;
            return { convertedToTicket: true, ticket };
        }
        const title = String(payload.title || '').trim();
        const body = String(payload.body || payload.message || '').trim();
        if (!title || !body) return { error: 'Question title and body are required.', status: 400 };
        const serviceState = this.ensureStudentServiceState();
        const question = this.normalizeStudentServiceQuestionRecord({
            ...payload,
            id: payload.id || makeId('svc_question'),
            title,
            body,
            authorUserId: actor.id,
            authorDisplayName: actor.displayName || actor.nameEn || actor.name || actor.id,
            authorRole: actor.role,
            facultyCode: payload.facultyCode || payload.faculty || actor.facultyCode || actor.faculty || '',
            anonymousMode: payload.anonymousMode !== false,
            displayIdentityToPeers: payload.displayIdentityToPeers === true,
            status: 'pending',
            createdAt: nowIso(),
            updatedAt: nowIso()
        }, serviceState.questions.length);
        serviceState.questions.unshift(question);
        this.upsertStudentServiceReviewQueue('question', question.id, 'pending-review');
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    addStudentServiceQuestionAnswer(questionId, payload = {}, actorId = '') {
        const actor = this.getStudentServiceAccount(actorId);
        if (!actor) return { error: 'Answer author was not found.', status: 404 };
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (!this.canRespondToStudentServiceQuestion(question, actorId)) {
            return { error: 'You are not allowed to answer this question.', status: 403 };
        }
        const body = String(payload.body || payload.message || '').trim();
        if (!body) return { error: 'Answer body is required.', status: 400 };
        const role = String(actor.role || '').trim().toLowerCase();
        const answer = this.normalizeStudentServiceAnswerRecord({
            id: payload.id || makeId('svc_answer'),
            questionId: question.id,
            authorUserId: actor.id,
            authorDisplayName: actor.displayName || actor.nameEn || actor.name || actor.id,
            authorRole: role,
            body,
            status: ['admin', 'student_service'].includes(role) ? 'published' : 'pending',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            approvedBy: ['admin', 'student_service'].includes(role) ? actor.id : '',
            approvedAt: ['admin', 'student_service'].includes(role) ? nowIso() : ''
        }, serviceState.answers.length);
        serviceState.answers.unshift(answer);
        question.updatedAt = nowIso();
        if (!['admin', 'student_service'].includes(role)) {
            this.upsertStudentServiceReviewQueue('answer', answer.id, 'pending-answer-review');
        }
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    setStudentServiceQuestionFeedback(questionId, payload = {}, actorId = '') {
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (!this.canViewStudentServiceQuestion(question, actorId)) {
            return { error: 'You are not allowed to rate this question.', status: 403 };
        }
        const value = payload.value === 'not_helpful' ? 'not_helpful' : 'helpful';
        question.helpfulVotes = question.helpfulVotes.filter(entry => entry.userId !== String(actorId || '').trim());
        question.helpfulVotes.push({
            userId: String(actorId || '').trim(),
            value,
            updatedAt: nowIso()
        });
        question.updatedAt = nowIso();
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    acceptStudentServiceAnswer(questionId, payload = {}, actorId = '') {
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        const viewer = this.getStudentServiceViewerState(actorId);
        if (!(viewer.canModerate || (viewer.role === 'student' && viewer.viewerId === String(question.authorUserId || '').trim()))) {
            return { error: 'You are not allowed to accept an answer for this question.', status: 403 };
        }
        const answerId = String(payload.answerId || '').trim();
        const answer = serviceState.answers.find(item =>
            String(item.id || '').trim() === answerId
            && String(item.questionId || '').trim() === String(question.id || '').trim()
        );
        if (!answer) return { error: 'Answer was not found.', status: 404 };
        if (answer.status !== 'published' && !viewer.canModerate) {
            return { error: 'Only published answers may be accepted.', status: 409 };
        }
        question.acceptedAnswerId = answerId;
        question.updatedAt = nowIso();
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    publishStudentServiceQuestion(questionId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can publish questions.', status: 403 };
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        question.status = payload.archive === true ? 'archived' : 'published';
        question.featured = payload.featured === undefined ? question.featured : Boolean(payload.featured);
        question.pinned = payload.pinned === undefined ? question.pinned : Boolean(payload.pinned);
        question.lastReviewedAt = nowIso();
        question.lastReviewedBy = String(actorId || '').trim();
        question.updatedAt = nowIso();
        const answerId = String(payload.answerId || '').trim();
        serviceState.answers.forEach(answer => {
            if (String(answer.questionId || '').trim() !== String(question.id || '').trim()) return;
            if (!answerId || String(answer.id || '').trim() === answerId) {
                answer.status = payload.archive === true ? 'archived' : 'published';
                answer.approvedBy = String(actorId || '').trim();
                answer.approvedAt = nowIso();
                answer.updatedAt = nowIso();
            }
        });
        this.resolveStudentServiceReviewQueue('question', question.id, actorId);
        if (answerId) this.resolveStudentServiceReviewQueue('answer', answerId, actorId);
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    updateStudentServiceQuestionFlags(questionId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can update question flags.', status: 403 };
        const question = this.ensureStudentServiceState().questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (payload.featured !== undefined) question.featured = Boolean(payload.featured);
        if (payload.pinned !== undefined) question.pinned = Boolean(payload.pinned);
        if (payload.staleReviewRequested !== undefined) question.staleReviewRequested = Boolean(payload.staleReviewRequested);
        if (payload.staleReviewNote !== undefined) question.staleReviewNote = String(payload.staleReviewNote || '').trim();
        question.lastReviewedAt = nowIso();
        question.lastReviewedBy = String(actorId || '').trim();
        question.updatedAt = nowIso();
        if (question.staleReviewRequested) {
            this.upsertStudentServiceReviewQueue('question', question.id, 'stale-review');
        } else {
            this.resolveStudentServiceReviewQueue('question', question.id, actorId, 'stale-review');
        }
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    convertStudentServiceQuestionToTicket(questionId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can convert questions to tickets.', status: 403 };
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        const ticket = this.createStudentServiceTicket({
            title: payload.title || question.title,
            message: payload.message || question.body,
            category: question.category,
            serviceArea: question.serviceArea,
            studentId: question.authorUserId,
            studentName: question.authorDisplayName,
            facultyCode: question.facultyCode,
            anonymousMode: question.anonymousMode,
            displayIdentityToPeers: question.displayIdentityToPeers,
            questionId: question.id
        }, question.authorUserId);
        if (ticket?.error) return ticket;
        question.status = 'converted';
        question.convertedTicketId = ticket.id;
        question.updatedAt = nowIso();
        this.resolveStudentServiceReviewQueue('question', question.id, actorId);
        this.save();
        return {
            question: this.decorateStudentServiceQuestion(question, actorId),
            ticket
        };
    }

    convertStudentServiceQuestionToArticle(questionId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can convert questions to articles.', status: 403 };
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        const answer = serviceState.answers.find(item =>
            String(item.questionId || '').trim() === String(question.id || '').trim()
            && (String(item.id || '').trim() === String(payload.answerId || question.acceptedAnswerId || '').trim() || item.status === 'published')
        ) || null;
        if (!answer) return { error: 'A published answer is required before converting to an article.', status: 409 };
        const article = this.saveStudentServiceArticle({
            title: payload.title || question.title,
            category: question.category,
            serviceArea: question.serviceArea,
            summary: payload.summary || question.body.slice(0, 220),
            content: payload.content || answer.body,
            audience: payload.audience || 'students',
            published: true,
            facultyCode: payload.facultyCode || question.facultyCode || 'ALL',
            sourceQuestionId: question.id
        }, actorId);
        if (article?.error) return article;
        question.convertedArticleId = article.id;
        question.lastReviewedAt = nowIso();
        question.lastReviewedBy = String(actorId || '').trim();
        question.updatedAt = nowIso();
        this.save();
        return {
            question: this.decorateStudentServiceQuestion(question, actorId),
            article
        };
    }

    mergeStudentServiceQuestions(questionId, payload = {}, actorId = '') {
        if (!this.canModerateStudentService(actorId)) return { error: 'Only Student Service staff can merge questions.', status: 403 };
        const serviceState = this.ensureStudentServiceState();
        const source = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        const target = serviceState.questions.find(item => String(item.id || '').trim() === String(payload.targetQuestionId || '').trim());
        if (!source || !target) return { error: 'Both source and target questions are required.', status: 404 };
        source.status = 'merged';
        source.mergedIntoQuestionId = target.id;
        source.updatedAt = nowIso();
        target.relatedQuestionIds = uniqueStrings([...(target.relatedQuestionIds || []), source.id]);
        target.updatedAt = nowIso();
        this.resolveStudentServiceReviewQueue('question', source.id, actorId);
        this.save();
        return {
            source: this.decorateStudentServiceQuestion(source, actorId),
            target: this.decorateStudentServiceQuestion(target, actorId)
        };
    }

    listPrivilegeDefinitions() {
        return listPrivilegeDefinitions();
    }

    getGrantedAccountPrivileges(accountOrUserId) {
        return getGrantedAccountPrivileges.call(this, accountOrUserId);
    }

    getEffectiveAccountPrivileges(accountOrUserId) {
        return getEffectiveAccountPrivileges.call(this, accountOrUserId);
    }

    accountHasPrivilege(accountOrUserId, privilegeId = '') {
        return accountHasPrivilege.call(this, accountOrUserId, privilegeId);
    }

    updateAccountPrivileges(accountId, payload = {}, actorId = '') {
        return updateAccountPrivileges.call(this, accountId, payload, actorId);
    }

    getSocialPresenceForUser(userId) {
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedUserId) {
            return { online: false, lastSeenAt: '', presenceLabel: 'Offline' };
        }
        const activeSessions = Object.values(this.state.sessions || {}).filter(session =>
            String(session?.userId || '').trim() === normalizedUserId && session?.active !== false
        );
        const lastSeenAt = activeSessions
            .map(session => String(session?.lastSeenAt || session?.updatedAt || '').trim())
            .filter(Boolean)
            .sort((left, right) => String(right).localeCompare(String(left)))[0] || '';
        const isOnline = Boolean(lastSeenAt) && (Date.now() - new Date(lastSeenAt).getTime()) <= (5 * 60 * 1000);
        return {
            online: isOnline,
            lastSeenAt,
            presenceLabel: isOnline ? 'Online' : (lastSeenAt ? 'Offline' : 'Not active recently')
        };
    }

    ensureCredential(userId) {
        return ensureCredential.call(this, userId);
    }

    ensurePersonFromAccount(account) {
        return ensurePersonFromAccount.call(this, account);
    }

    ensureLmsCourse(courseId) {
        return ensureLmsCourse.call(this, courseId);
    }

    ensureGradebook(courseId) {
        return ensureGradebook.call(this, courseId);
    }

    ensureProtectedQuizLaunch(ticket) {
        return ensureProtectedQuizLaunch.call(this, ticket);
    }

    ensureProtectedClientSession(token) {
        return ensureProtectedClientSession.call(this, token);
    }

    ensureExamPortalSession(token) {
        return ensureExamPortalSession.call(this, token);
    }

    buildExamSessionCourseKey(sessionId) {
        return buildExamSessionCourseKey.call(this, sessionId);
    }

    normalizeExamSessionStatus(status = 'scheduled') {
        return normalizeExamSessionStatus.call(this, status);
    }

    normalizeExamSessionRecord(payload = {}, existing = {}) {
        return normalizeExamSessionRecord.call(this, payload, existing);
    }

    syncExamSession(payload = {}) {
        return syncExamSession.call(this, payload);
    }

    getExamSession(sessionId) {
        return getExamSession.call(this, sessionId);
    }

    deriveExamSessionRuntimeStatus(session = {}) {
        return deriveExamSessionRuntimeStatus.call(this, session);
    }

    listExamSessionsForStudent(studentId) {
        return listExamSessionsForStudent.call(this, studentId);
    }

    getExamPortalSession(token, options = {}) {
        return getExamPortalSession.call(this, token, options);
    }

    createExamPortalSession(payload = {}) {
        return createExamPortalSession.call(this, payload);
    }

    listExamPortalVisibleSessions(token) {
        return listExamPortalVisibleSessions.call(this, token);
    }

    getExamPortalSessionSummary(sessionId, token = '') {
        return getExamPortalSessionSummary.call(this, sessionId, token);
    }

    createExamPortalLaunchTicket(sessionId, payload = {}) {
        return createExamPortalLaunchTicket.call(this, sessionId, payload);
    }

    findProtectedQuizRecord(courseId, quizId) {
        return findProtectedQuizRecord.call(this, courseId, quizId);
    }

    ensureProtectedQuizAttemptRecord(quiz, student = {}) {
        return ensureProtectedQuizAttemptRecord.call(this, quiz, student);
    }

    buildProtectedQuizClientUrl(courseId, quizId) {
        return buildProtectedQuizClientUrl.call(this, courseId, quizId);
    }

    syncProtectedQuiz(payload = {}) {
        return syncProtectedQuiz.call(this, payload);
    }

    getProtectedQuiz(courseId, quizId) {
        return getProtectedQuiz.call(this, courseId, quizId);
    }

    getProtectedClientSession(clientSessionToken, options = {}) {
        return getProtectedClientSession.call(this, clientSessionToken, options);
    }

    revokeProtectedClientSessions(courseId, quizId, studentId, exceptToken = '', reason = 'Protected quiz session was revoked.') {
        return revokeProtectedClientSessions.call(this, courseId, quizId, studentId, exceptToken, reason);
    }

    getProtectedClientAttempt(courseId, quizId, clientSessionToken) {
        return getProtectedClientAttempt.call(this, courseId, quizId, clientSessionToken);
    }

    createProtectedQuizLaunchTicket(payload = {}) {
        return createProtectedQuizLaunchTicket.call(this, payload);
    }

    redeemProtectedQuizLaunch(payload = {}) {
        return redeemProtectedQuizLaunch.call(this, payload);
    }

    heartbeatProtectedQuiz(payload = {}) {
        return heartbeatProtectedQuiz.call(this, payload);
    }

    recordProtectedQuizEvent(payload = {}) {
        return recordProtectedQuizEvent.call(this, payload);
    }

    updateProtectedQuizAttemptControl(payload = {}, action = '') {
        return updateProtectedQuizAttemptControl.call(this, payload, action);
    }

    manualGradeProtectedQuiz(payload = {}) {
        return manualGradeProtectedQuiz.call(this, payload);
    }

    getProtectedQuizMonitor(courseId, quizId = '') {
        return getProtectedQuizMonitor.call(this, courseId, quizId);
    }

    upgradeCredentialHashIfNeeded(userId, password) {
        return upgradeCredentialHashIfNeeded.call(this, userId, password);
    }

    listAccounts(filters = {}) {
        return listAccounts.call(this, filters);
    }

    getAccountById(userId) {
        return getAccountById.call(this, userId);
    }

    getAccountByEmail(email) {
        return getAccountByEmail.call(this, email);
    }

    getRawAccountByEmail(email) {
        return getRawAccountByEmail.call(this, email);
    }

    getRawAccountByMicrosoftOid(oid, tenantId = '') {
        return getRawAccountByMicrosoftOid.call(this, oid, tenantId);
    }

    linkMicrosoftIdentityToAccount(accountId, identity = {}) {
        return linkMicrosoftIdentityToAccount.call(this, accountId, identity);
    }

    createSessionForAccount(accountId, options = {}) {
        return createSessionForAccount.call(this, accountId, options);
    }

    createSessionByMicrosoftIdentity(identity = {}) {
        return createSessionByMicrosoftIdentity.call(this, identity);
    }

    upsertAccount(payload = {}) {
        return upsertAccount.call(this, payload);
    }

    activateAccount(userId, newPassword) {
        return activateAccount.call(this, userId, newPassword);
    }

    requestPasswordReset(email) {
        return requestPasswordReset.call(this, email);
    }

    resetPassword(token, newPassword) {
        return resetPassword.call(this, token, newPassword);
    }

    createSessionByCredentials(email, password) {
        return createSessionByCredentials.call(this, email, password);
    }

    getSession(token) {
        return getSession.call(this, token);
    }

    logoutSession(token) {
        return logoutSession.call(this, token);
    }

    revokeSessionsForUser(userId, reason = 'revoked') {
        return revokeSessionsForUser.call(this, userId, reason);
    }

    updateSessionImpersonation(token, impersonatedRole) {
        return updateSessionImpersonation.call(this, token, impersonatedRole);
    }

    clearSessionImpersonation(token) {
        return clearSessionImpersonation.call(this, token);
    }

    createNotification(payload = {}) {
        return createNotification.call(this, payload);
    }

    listNotifications(userId, filters = {}) {
        return listNotifications.call(this, userId, filters);
    }

    markNotificationRead(notificationId, userId = '') {
        return markNotificationRead.call(this, notificationId, userId);
    }

    updateNotificationPreferences(userId, preferences = {}) {
        return updateNotificationPreferences.call(this, userId, preferences);
    }

    upsertPushSubscription(userId, subscription = {}, metadata = {}) {
        return upsertPushSubscription.call(this, userId, subscription, metadata);
    }

    listPushSubscriptions(userId = '') {
        return listPushSubscriptions.call(this, userId);
    }

    removePushSubscription(userId = '', endpoint = '') {
        return removePushSubscription.call(this, userId, endpoint);
    }

    normalizeNewsSectionKey(value = '') {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'general';
    }

    normalizeNewsRoleTargets(values = []) {
        const normalized = uniqueStrings(asArray(values).map(value => String(value || '').trim().toLowerCase()).filter(Boolean));
        return normalized.includes('all') ? [] : normalized;
    }

    normalizeNewsFacultyTargets(values = []) {
        const normalized = uniqueStrings(asArray(values).map(value => normalizeCode(value || '')).filter(Boolean));
        return normalized.includes('ALL') ? [] : normalized;
    }

    canManageNews(userId = '') {
        return this.accountHasPrivilege(userId, 'manage_news');
    }

    canModerateNewsReplies(userId = '') {
        return this.accountHasPrivilege(userId, 'moderate_news_replies') || this.canManageNews(userId);
    }

    canViewNewsPost(post = {}, viewerUserId = '') {
        const normalizedViewerId = String(viewerUserId || '').trim();
        const viewerAccount = normalizedViewerId ? this.state.accounts[normalizedViewerId] : null;
        const isManager = normalizedViewerId && this.canManageNews(normalizedViewerId);
        const isAuthor = normalizedViewerId && String(post.createdById || '').trim() === normalizedViewerId;
        const status = String(post.status || 'published').trim().toLowerCase();
        if (status !== 'published' && !(isManager || isAuthor)) return false;
        const roleTargets = this.normalizeNewsRoleTargets(post.audienceRoles || []);
        const facultyTargets = this.normalizeNewsFacultyTargets(post.audienceFacultyCodes || []);
        const userTargets = uniqueStrings(asArray(post.targetUserIds).map(value => String(value || '').trim()).filter(Boolean));
        if (!viewerAccount) return status === 'published' && !roleTargets.length && !facultyTargets.length && !userTargets.length;
        const role = String(viewerAccount.role || '').trim().toLowerCase();
        const facultyCode = normalizeCode(viewerAccount.facultyCode || viewerAccount.faculty || '');
        const roleMatch = !roleTargets.length || roleTargets.includes(role);
        const facultyMatch = !facultyTargets.length || facultyTargets.includes(facultyCode);
        const userMatch = !userTargets.length || userTargets.includes(normalizedViewerId);
        return roleMatch && facultyMatch && userMatch;
    }

    decorateNewsPost(post = {}, viewerUserId = '') {
        const normalizedViewerId = String(viewerUserId || '').trim();
        const managerView = normalizedViewerId && this.canModerateNewsReplies(normalizedViewerId);
        const replies = this.ensureNewsState().replies
            .filter(reply => String(reply.postId || '').trim() === String(post.id || '').trim())
            .filter(reply => managerView || String(reply.authorUserId || '').trim() === normalizedViewerId)
            .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
        return {
            ...clone(post),
            audienceRoles: this.normalizeNewsRoleTargets(post.audienceRoles || []),
            audienceFacultyCodes: this.normalizeNewsFacultyTargets(post.audienceFacultyCodes || []),
            targetUserIds: uniqueStrings(asArray(post.targetUserIds).map(value => String(value || '').trim()).filter(Boolean)),
            viewerCanManage: normalizedViewerId ? this.canManageNews(normalizedViewerId) : false,
            viewerCanModerateReplies: managerView,
            privateReplies: clone(replies),
            privateReplyCount: replies.length
        };
    }

    getNewsSectionsForViewer(viewerUserId = '') {
        const counts = new Map();
        this.ensureNewsState().posts.forEach(post => {
            if (!this.canViewNewsPost(post, viewerUserId)) return;
            const key = this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general');
            const label = String(post.sectionLabel || post.sectionKey || 'General').trim() || 'General';
            const current = counts.get(key) || { key, label, count: 0 };
            current.count += 1;
            counts.set(key, current);
        });
        return [...counts.values()].sort((left, right) => {
            if (right.count !== left.count) return right.count - left.count;
            return String(left.label || '').localeCompare(String(right.label || ''));
        });
    }

    listNewsFeed(filters = {}) {
        const viewerUserId = String(filters.userId || filters.viewerUserId || '').trim();
        const sectionKey = this.normalizeNewsSectionKey(filters.section || 'all');
        const search = String(filters.search || '').trim();
        const items = this.ensureNewsState().posts
            .filter(post => this.canViewNewsPost(post, viewerUserId))
            .filter(post => sectionKey === 'all' || this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general') === sectionKey)
            .filter(post => !search || matchesSearch(post, search, ['title', 'body', 'sectionLabel', 'sectionKey', 'createdByName']))
            .sort((left, right) => {
                if (Boolean(right.pinned) !== Boolean(left.pinned)) return right.pinned ? 1 : -1;
                return String(right.publishedAt || right.updatedAt || right.createdAt || '').localeCompare(String(left.publishedAt || left.updatedAt || left.createdAt || ''));
            })
            .map(post => this.decorateNewsPost(post, viewerUserId));
        return {
            items,
            sections: this.getNewsSectionsForViewer(viewerUserId),
            privileges: this.listPrivilegeDefinitions(),
            viewerPrivileges: this.getEffectiveAccountPrivileges(viewerUserId)
        };
    }

    resolveNewsRecipients(post = {}, excludeUserId = '') {
        const excluded = String(excludeUserId || '').trim();
        return Object.values(this.state.accounts || {})
            .filter(account => String(account.id || '').trim() !== excluded)
            .filter(account => this.canViewNewsPost(post, String(account.id || '').trim()));
    }

    createNewsPost(payload = {}, actorId = '') {
        const normalizedActorId = String(actorId || payload.actorId || '').trim();
        if (!this.canManageNews(normalizedActorId)) {
            return { error: 'Only administrators or delegated news managers can publish university news.', status: 403 };
        }
        const actor = this.getAccountById(normalizedActorId);
        const title = String(payload.title || '').trim();
        const body = String(payload.body || '').trim();
        if (!title || !body) return { error: 'News title and body are required.', status: 400 };
        const now = nowIso();
        const status = String(payload.status || 'published').trim().toLowerCase() || 'published';
        const sectionLabel = String(payload.sectionLabel || payload.section || 'General').trim() || 'General';
        const post = {
            id: String(payload.id || makeId('news')).trim(),
            title,
            body,
            excerpt: String(payload.excerpt || body.slice(0, 220)).trim(),
            sectionKey: this.normalizeNewsSectionKey(payload.sectionKey || sectionLabel),
            sectionLabel,
            audienceRoles: this.normalizeNewsRoleTargets(payload.audienceRoles || payload.targetRoles || []),
            audienceFacultyCodes: this.normalizeNewsFacultyTargets(payload.audienceFacultyCodes || payload.targetFacultyCodes || []),
            targetUserIds: uniqueStrings(asArray(payload.targetUserIds).map(value => String(value || '').trim()).filter(Boolean)),
            allowReplies: payload.allowReplies !== false,
            pinned: Boolean(payload.pinned),
            priority: String(payload.priority || 'standard').trim().toLowerCase() || 'standard',
            heroTone: String(payload.heroTone || 'ink').trim().toLowerCase() || 'ink',
            status,
            publishAt: String(payload.publishAt || now).trim(),
            expiresAt: String(payload.expiresAt || '').trim(),
            createdById: normalizedActorId,
            createdByName: actor?.displayName || actor?.nameEn || actor?.name || normalizedActorId,
            createdAt: now,
            updatedAt: now,
            publishedAt: status === 'published' ? now : ''
        };
        this.ensureNewsState().posts.unshift(post);
        if (status === 'published') {
            this.resolveNewsRecipients(post, normalizedActorId).forEach(account => {
                this.createNotification({
                    recipientUserId: account.id,
                    sourceDomain: 'news',
                    type: 'news-post',
                    title: post.title,
                    body: post.excerpt || `${post.createdByName} published a new university update.`,
                    routePage: 'news',
                    routeData: { postId: post.id, section: post.sectionKey }
                });
            });
        }
        this.save();
        return this.decorateNewsPost(post, normalizedActorId);
    }

    updateNewsPost(postId, payload = {}, actorId = '') {
        const normalizedActorId = String(actorId || payload.actorId || '').trim();
        const post = this.ensureNewsState().posts.find(item => String(item.id || '').trim() === String(postId || '').trim());
        if (!post) return { error: 'News post was not found.', status: 404 };
        if (!this.canManageNews(normalizedActorId)) {
            return { error: 'Only administrators or delegated news managers can update university news.', status: 403 };
        }
        post.title = String(payload.title || post.title || '').trim();
        post.body = String(payload.body || post.body || '').trim();
        post.excerpt = String(payload.excerpt || post.excerpt || post.body.slice(0, 220)).trim();
        post.sectionLabel = String(payload.sectionLabel || payload.section || post.sectionLabel || 'General').trim() || 'General';
        post.sectionKey = this.normalizeNewsSectionKey(payload.sectionKey || post.sectionLabel);
        post.audienceRoles = this.normalizeNewsRoleTargets(payload.audienceRoles || payload.targetRoles || post.audienceRoles || []);
        post.audienceFacultyCodes = this.normalizeNewsFacultyTargets(payload.audienceFacultyCodes || payload.targetFacultyCodes || post.audienceFacultyCodes || []);
        post.targetUserIds = uniqueStrings(asArray(payload.targetUserIds !== undefined ? payload.targetUserIds : post.targetUserIds).map(value => String(value || '').trim()).filter(Boolean));
        post.allowReplies = payload.allowReplies === undefined ? post.allowReplies !== false : payload.allowReplies !== false;
        post.pinned = payload.pinned === undefined ? Boolean(post.pinned) : Boolean(payload.pinned);
        post.priority = String(payload.priority || post.priority || 'standard').trim().toLowerCase() || 'standard';
        post.heroTone = String(payload.heroTone || post.heroTone || 'ink').trim().toLowerCase() || 'ink';
        post.status = String(payload.status || post.status || 'published').trim().toLowerCase() || 'published';
        post.publishAt = String(payload.publishAt || post.publishAt || nowIso()).trim();
        post.expiresAt = String(payload.expiresAt || post.expiresAt || '').trim();
        post.updatedAt = nowIso();
        if (post.status === 'published' && !post.publishedAt) post.publishedAt = post.updatedAt;
        this.save();
        return this.decorateNewsPost(post, normalizedActorId);
    }

    addNewsReply(postId, payload = {}, actorId = '') {
        const normalizedActorId = String(actorId || payload.actorId || '').trim();
        const post = this.ensureNewsState().posts.find(item => String(item.id || '').trim() === String(postId || '').trim());
        if (!post) return { error: 'News post was not found.', status: 404 };
        if (!this.canViewNewsPost(post, normalizedActorId)) return { error: 'This news post is not visible to the replying account.', status: 403 };
        if (post.allowReplies === false) return { error: 'Private replies are disabled for this news post.', status: 409 };
        const body = String(payload.body || '').trim();
        if (!body) return { error: 'Reply text is required.', status: 400 };
        const author = this.getAccountById(normalizedActorId);
        const reply = {
            id: makeId('news_reply'),
            postId: post.id,
            authorUserId: normalizedActorId,
            authorName: author?.displayName || author?.nameEn || author?.name || normalizedActorId,
            body,
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        this.ensureNewsState().replies.unshift(reply);
        this.resolveNewsRecipients(post)
            .filter(account => this.canModerateNewsReplies(account.id))
            .forEach(account => {
                this.createNotification({
                    recipientUserId: account.id,
                    sourceDomain: 'news',
                    type: 'news-reply',
                    title: `Private reply on ${post.title}`,
                    body: `${reply.authorName} sent a private response to a university update.`,
                    routePage: 'news',
                    routeData: { postId: post.id }
                });
            });
        this.save();
        return this.decorateNewsPost(post, normalizedActorId);
    }

    addAuditEvent(payload = {}) {
        return addAuditEvent.call(this, payload);
    }

    listAuditEvents(filters = {}) {
        const domain = String(filters.domain || '').trim();
        const actorUserId = String(filters.actorUserId || '').trim();
        const items = this.state.audit.events
            .filter(item => !domain || item.eventDomain === domain)
            .filter(item => !actorUserId || item.actorUserId === actorUserId);
        return paginate(items, filters);
    }

    listIntegrationSystems() {
        return Object.values(this.state.integrations.systems)
            .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), undefined, { sensitivity: 'base' }));
    }

    upsertIntegrationSystem(payload = {}) {
        const systemCode = String(payload.systemCode || payload.code || '').trim().toLowerCase();
        if (!systemCode) return null;
        this.state.integrations.systems[systemCode] = {
            ...(this.state.integrations.systems[systemCode] || {}),
            systemCode,
            displayName: String(payload.displayName || systemCode).trim(),
            ownerDomain: String(payload.ownerDomain || 'portal').trim(),
            baseUrl: String(payload.baseUrl || '').trim(),
            syncMode: String(payload.syncMode || 'event-driven').trim(),
            isAuthoritative: payload.isAuthoritative !== false,
            enabled: payload.enabled !== false,
            apiKeyConfigured: Boolean(payload.apiKeyConfigured),
            status: String(payload.status || 'ready').trim(),
            metadata: clone(payload.metadata || {}) || {},
            lastCheckedAt: String(payload.lastCheckedAt || nowIso()),
            updatedAt: nowIso()
        };
        this.save();
        return clone(this.state.integrations.systems[systemCode]);
    }

    addSyncRun(payload = {}) {
        const syncRun = {
            id: String(payload.id || makeId('sync')).trim(),
            systemCode: String(payload.systemCode || '').trim().toLowerCase(),
            syncScope: String(payload.syncScope || '').trim(),
            runStatus: String(payload.runStatus || payload.status || 'completed').trim(),
            startedAt: String(payload.startedAt || nowIso()),
            finishedAt: String(payload.finishedAt || nowIso()),
            recordsSeen: safeNumber(payload.recordsSeen, 0),
            recordsChanged: safeNumber(payload.recordsChanged, 0),
            errorSummary: String(payload.errorSummary || '').trim()
        };
        this.state.integrations.syncRuns.unshift(syncRun);
        this.state.integrations.syncRuns = this.state.integrations.syncRuns.slice(0, 2000);
        this.save();
        return clone(syncRun);
    }

    listSyncRuns(filters = {}) {
        const systemCode = String(filters.systemCode || '').trim().toLowerCase();
        const items = this.state.integrations.syncRuns.filter(item => !systemCode || item.systemCode === systemCode);
        return paginate(items, filters);
    }

    addSyncConflict(payload = {}) {
        const conflict = {
            id: String(payload.id || makeId('conflict')).trim(),
            syncRunId: String(payload.syncRunId || '').trim(),
            systemCode: String(payload.systemCode || '').trim().toLowerCase(),
            entityType: String(payload.entityType || 'record').trim(),
            localRecordId: String(payload.localRecordId || '').trim(),
            externalRecordKey: String(payload.externalRecordKey || '').trim(),
            conflictField: String(payload.conflictField || '').trim(),
            localValue: clone(payload.localValue || null),
            externalValue: clone(payload.externalValue || null),
            resolutionStatus: String(payload.resolutionStatus || 'open').trim(),
            resolvedByUserId: String(payload.resolvedByUserId || '').trim(),
            resolvedAt: String(payload.resolvedAt || '').trim(),
            createdAt: String(payload.createdAt || nowIso())
        };
        this.state.integrations.conflicts.unshift(conflict);
        this.state.integrations.conflicts = this.state.integrations.conflicts.slice(0, 4000);
        this.save();
        return clone(conflict);
    }

    listSyncConflicts(filters = {}) {
        const systemCode = String(filters.systemCode || '').trim().toLowerCase();
        const status = String(filters.status || '').trim().toLowerCase();
        const items = this.state.integrations.conflicts
            .filter(item => !systemCode || item.systemCode === systemCode)
            .filter(item => !status || String(item.resolutionStatus || '').trim().toLowerCase() === status);
        return paginate(items, filters);
    }

    ensureMailConnection(userId) {
        const key = String(userId || '').trim();
        if (!key) return null;
        this.state.mail.connections[key] = this.state.mail.connections[key] || {
            userId: key,
            connected: false,
            mailboxAddress: '',
            mailboxDisplayName: '',
            microsoftOid: '',
            microsoftTenantId: '',
            encryptedRefreshToken: '',
            grantedScopes: [],
            lastConnectedAt: '',
            lastSyncAt: '',
            lastSyncStatus: 'idle',
            lastError: '',
            tokenUpdatedAt: '',
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        return this.state.mail.connections[key];
    }

    ensureMailCache(userId) {
        const key = String(userId || '').trim();
        if (!key) return null;
        this.state.mail.caches[key] = this.state.mail.caches[key] || {
            userId: key,
            folders: {},
            messagesById: {},
            lastFolderKey: 'inbox',
            lastSyncedAt: '',
            updatedAt: nowIso()
        };
        DEFAULT_MAIL_FOLDERS.forEach(folderKey => {
            this.state.mail.caches[key].folders[folderKey] = this.state.mail.caches[key].folders[folderKey] || {
                folderKey,
                displayName: folderKey === 'sentitems' ? 'Sent' : folderKey.charAt(0).toUpperCase() + folderKey.slice(1),
                totalCount: 0,
                unreadCount: 0,
                messageIds: [],
                deltaLink: '',
                syncedAt: ''
            };
        });
        return this.state.mail.caches[key];
    }

    sanitizeMailConnectionForClient(connection) {
        const current = connection && typeof connection === 'object' ? connection : null;
        if (!current) return null;
        return {
            userId: String(current.userId || '').trim(),
            connected: current.connected === true,
            mailboxAddress: String(current.mailboxAddress || '').trim(),
            mailboxDisplayName: String(current.mailboxDisplayName || '').trim(),
            microsoftOid: String(current.microsoftOid || '').trim(),
            microsoftTenantId: String(current.microsoftTenantId || '').trim(),
            grantedScopes: uniqueStrings(current.grantedScopes || []),
            lastConnectedAt: String(current.lastConnectedAt || '').trim(),
            lastSyncAt: String(current.lastSyncAt || '').trim(),
            lastSyncStatus: String(current.lastSyncStatus || 'idle').trim(),
            lastError: String(current.lastError || '').trim(),
            tokenUpdatedAt: String(current.tokenUpdatedAt || '').trim(),
            createdAt: String(current.createdAt || '').trim(),
            updatedAt: String(current.updatedAt || '').trim()
        };
    }

    getMailConnection(userId, { includeSecrets = false } = {}) {
        const key = String(userId || '').trim();
        if (!key) return null;
        const connection = this.state.mail.connections[key];
        if (!connection) return null;
        if (!includeSecrets) return this.sanitizeMailConnectionForClient(connection);
        return {
            ...clone(connection),
            refreshToken: decryptSecret(connection.encryptedRefreshToken || '', this.mailTokenEncryptionKey)
        };
    }

    upsertMailConnection(userId, payload = {}) {
        const connection = this.ensureMailConnection(userId);
        if (!connection) return null;
        const grantedScopes = uniqueStrings(payload.grantedScopes || connection.grantedScopes || []);
        const refreshToken = String(payload.refreshToken || '').trim();
        if (Object.prototype.hasOwnProperty.call(payload, 'connected')) connection.connected = payload.connected === true;
        if (Object.prototype.hasOwnProperty.call(payload, 'mailboxAddress')) connection.mailboxAddress = normalizeEmail(payload.mailboxAddress || '');
        if (Object.prototype.hasOwnProperty.call(payload, 'mailboxDisplayName')) connection.mailboxDisplayName = String(payload.mailboxDisplayName || '').trim();
        if (Object.prototype.hasOwnProperty.call(payload, 'microsoftOid')) connection.microsoftOid = String(payload.microsoftOid || '').trim();
        if (Object.prototype.hasOwnProperty.call(payload, 'microsoftTenantId')) connection.microsoftTenantId = String(payload.microsoftTenantId || '').trim();
        connection.grantedScopes = grantedScopes;
        if (refreshToken) {
            connection.encryptedRefreshToken = encryptSecret(refreshToken, this.mailTokenEncryptionKey);
            connection.tokenUpdatedAt = nowIso();
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'clearRefreshToken') && payload.clearRefreshToken) {
            connection.encryptedRefreshToken = '';
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'lastSyncAt')) connection.lastSyncAt = String(payload.lastSyncAt || '').trim();
        if (Object.prototype.hasOwnProperty.call(payload, 'lastSyncStatus')) connection.lastSyncStatus = String(payload.lastSyncStatus || 'idle').trim();
        if (Object.prototype.hasOwnProperty.call(payload, 'lastError')) connection.lastError = String(payload.lastError || '').trim();
        if (Object.prototype.hasOwnProperty.call(payload, 'lastConnectedAt')) connection.lastConnectedAt = String(payload.lastConnectedAt || '').trim();
        if (connection.connected && !connection.lastConnectedAt) connection.lastConnectedAt = nowIso();
        connection.updatedAt = nowIso();
        this.save();
        return this.sanitizeMailConnectionForClient(connection);
    }

    disconnectMailConnection(userId) {
        const key = String(userId || '').trim();
        if (!key) return null;
        const connection = this.ensureMailConnection(key);
        const cache = this.ensureMailCache(key);
        connection.connected = false;
        connection.encryptedRefreshToken = '';
        connection.lastSyncStatus = 'disconnected';
        connection.lastError = '';
        connection.updatedAt = nowIso();
        if (cache) {
            DEFAULT_MAIL_FOLDERS.forEach(folderKey => {
                cache.folders[folderKey] = {
                    folderKey,
                    displayName: folderKey === 'sentitems' ? 'Sent' : folderKey.charAt(0).toUpperCase() + folderKey.slice(1),
                    totalCount: 0,
                    unreadCount: 0,
                    messageIds: [],
                    deltaLink: '',
                    syncedAt: ''
                };
            });
            cache.messagesById = {};
            cache.lastSyncedAt = '';
            cache.updatedAt = nowIso();
        }
        this.save();
        return this.sanitizeMailConnectionForClient(connection);
    }

    createMailOauthState(payload = {}) {
        const stateId = String(payload.state || makeId('mail_oauth')).trim();
        if (!stateId) return null;
        const expiresAt = new Date(Date.now() + (1000 * 60 * 10)).toISOString();
        this.state.mail.oauthStates[stateId] = {
            state: stateId,
            userId: String(payload.userId || '').trim(),
            returnTo: String(payload.returnTo || '').trim(),
            returnPage: String(payload.returnPage || 'email').trim().toLowerCase() || 'email',
            createdAt: nowIso(),
            expiresAt
        };
        this.save();
        return clone(this.state.mail.oauthStates[stateId]);
    }

    consumeMailOauthState(stateId) {
        const normalizedStateId = String(stateId || '').trim();
        if (!normalizedStateId) return null;
        const current = this.state.mail.oauthStates[normalizedStateId];
        if (!current) return null;
        delete this.state.mail.oauthStates[normalizedStateId];
        this.save();
        if (current.expiresAt && new Date(current.expiresAt).getTime() <= Date.now()) {
            return null;
        }
        return clone(current);
    }

    getMailCache(userId) {
        const key = String(userId || '').trim();
        if (!key) return null;
        const cache = this.ensureMailCache(key);
        return clone(cache);
    }

    saveMailCache(userId, payload = {}) {
        const cache = this.ensureMailCache(userId);
        if (!cache) return null;
        const messagesById = payload.messagesById && typeof payload.messagesById === 'object' ? payload.messagesById : {};
        Object.entries(messagesById).forEach(([messageId, message]) => {
            if (!messageId || !message || typeof message !== 'object') return;
            cache.messagesById[messageId] = {
                ...(cache.messagesById[messageId] || {}),
                ...clone(message),
                id: String(message.id || messageId).trim(),
                cachedAt: nowIso()
            };
        });
        const folders = payload.folders && typeof payload.folders === 'object' ? payload.folders : {};
        Object.entries(folders).forEach(([folderKeyRaw, folderPayload]) => {
            const folderKey = sanitizeMailFolderKey(folderKeyRaw);
            const current = cache.folders[folderKey] || {
                folderKey,
                displayName: folderKey,
                totalCount: 0,
                unreadCount: 0,
                messageIds: [],
                deltaLink: '',
                syncedAt: ''
            };
            cache.folders[folderKey] = {
                ...current,
                displayName: String(folderPayload.displayName || current.displayName || folderKey).trim(),
                totalCount: Math.max(0, safeNumber(folderPayload.totalCount, current.totalCount || 0)),
                unreadCount: Math.max(0, safeNumber(folderPayload.unreadCount, current.unreadCount || 0)),
                messageIds: uniqueStrings(asArray(folderPayload.messageIds || current.messageIds).map(id => String(id || '').trim())),
                deltaLink: String(folderPayload.deltaLink || current.deltaLink || '').trim(),
                syncedAt: String(folderPayload.syncedAt || nowIso()).trim()
            };
        });
        if (payload.lastFolderKey) cache.lastFolderKey = sanitizeMailFolderKey(payload.lastFolderKey);
        cache.lastSyncedAt = String(payload.lastSyncedAt || nowIso()).trim();
        cache.updatedAt = nowIso();
        this.save();
        return clone(cache);
    }

    getMailSummaryForUser(userId) {
        const connection = this.getMailConnection(userId);
        const cache = this.getMailCache(userId) || this.ensureMailCache(userId);
        const outlookUnreadCount = DEFAULT_MAIL_FOLDERS.reduce((total, folderKey) => {
            const folder = cache?.folders?.[folderKey];
            return total + Math.max(0, safeNumber(folder?.unreadCount, 0));
        }, 0);
        const portalUnreadCount = DEFAULT_MAIL_FOLDERS.reduce((total, folderKey) => {
            return total + this.listPortalMailMessages(userId, { folderKey, unreadOnly: true }).length;
        }, 0);
        return {
            connected: connection?.connected === true,
            mailboxAddress: String(connection?.mailboxAddress || '').trim(),
            unreadCount: outlookUnreadCount + portalUnreadCount,
            portalUnreadCount,
            outlookUnreadCount,
            lastSyncAt: String(connection?.lastSyncAt || cache?.lastSyncedAt || '').trim(),
            lastSyncStatus: String(connection?.lastSyncStatus || 'idle').trim(),
            lastError: String(connection?.lastError || '').trim(),
            portalMailEnabled: true
        };
    }

    createMailBootstrap(userId) {
        const connection = this.getMailConnection(userId);
        const cache = this.getMailCache(userId) || this.ensureMailCache(userId);
        const folders = {};
        DEFAULT_MAIL_FOLDERS.forEach(folderKey => {
            const folder = cache?.folders?.[folderKey] || {};
            folders[folderKey] = {
                folderKey,
                displayName: String(folder.displayName || (folderKey === 'sentitems' ? 'Sent' : folderKey.charAt(0).toUpperCase() + folderKey.slice(1))).trim(),
                totalCount: Math.max(0, safeNumber(folder.totalCount, 0)),
                unreadCount: Math.max(0, safeNumber(folder.unreadCount, 0)),
                syncedAt: String(folder.syncedAt || '').trim(),
                messages: asArray(folder.messageIds).map(messageId => clone(cache.messagesById?.[messageId] || null)).filter(Boolean)
            };
        });
        const portalFolders = this.getPortalMailFolderSummaries(userId);
        Object.entries(portalFolders).forEach(([folderKey, portalFolder]) => {
            const current = folders[folderKey] || {
                folderKey,
                displayName: portalFolder.displayName,
                totalCount: 0,
                unreadCount: 0,
                syncedAt: '',
                messages: []
            };
            const mergedMessages = [
                ...asArray(current.messages),
                ...asArray(portalFolder.messages)
            ].sort((left, right) => {
                const rightValue = String(right?.receivedAt || right?.sentAt || right?.createdAt || '');
                const leftValue = String(left?.receivedAt || left?.sentAt || left?.createdAt || '');
                return rightValue.localeCompare(leftValue);
            });
            folders[folderKey] = {
                ...current,
                displayName: portalFolder.displayName || current.displayName,
                totalCount: Math.max(0, safeNumber(current.totalCount, 0)) + Math.max(0, safeNumber(portalFolder.totalCount, 0)),
                unreadCount: Math.max(0, safeNumber(current.unreadCount, 0)) + Math.max(0, safeNumber(portalFolder.unreadCount, 0)),
                messages: mergedMessages
            };
        });
        return {
            connection,
            summary: this.getMailSummaryForUser(userId),
            folders,
            lastFolderKey: sanitizeMailFolderKey(cache?.lastFolderKey || 'inbox'),
            portalMailEnabled: true
        };
    }

    listPortalMailMessages(userId, filters = {}) {
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedUserId) return [];
        const folderKey = sanitizeMailFolderKey(filters.folderKey || filters.folder || 'inbox');
        const search = String(filters.search || '').trim();
        const unreadOnly = filters.unreadOnly === true || String(filters.unreadOnly || '').trim().toLowerCase() === 'true';
        return Object.values(this.state.mail.portalMessages || {})
            .filter(item => String(item?.ownerUserId || '').trim() === normalizedUserId)
            .filter(item => sanitizeMailFolderKey(item?.folderKey || 'inbox') === folderKey)
            .filter(item => !unreadOnly || item?.isRead !== true)
            .filter(item => !search || matchesSearch(item, search, ['subject', 'snippet', 'body', 'searchBlob']))
            .sort((left, right) => {
                const rightValue = String(right?.receivedAt || right?.sentAt || right?.createdAt || '');
                const leftValue = String(left?.receivedAt || left?.sentAt || left?.createdAt || '');
                return rightValue.localeCompare(leftValue);
            })
            .map(item => clone(item));
    }

    getPortalMailFolderSummaries(userId) {
        const normalizedUserId = String(userId || '').trim();
        const summaries = {};
        DEFAULT_MAIL_FOLDERS.forEach(folderKey => {
            const messages = this.listPortalMailMessages(normalizedUserId, { folderKey });
            summaries[folderKey] = {
                folderKey,
                displayName: folderKey === 'sentitems' ? 'Sent' : folderKey.charAt(0).toUpperCase() + folderKey.slice(1),
                totalCount: messages.length,
                unreadCount: messages.filter(message => message?.isRead !== true).length,
                messages
            };
        });
        return summaries;
    }

    getPortalMailMessage(userId, messageId) {
        const normalizedUserId = String(userId || '').trim();
        const normalizedMessageId = String(messageId || '').trim();
        if (!normalizedUserId || !normalizedMessageId) return null;
        const message = this.state.mail.portalMessages[normalizedMessageId];
        if (!message) return null;
        if (String(message.ownerUserId || '').trim() !== normalizedUserId) return null;
        return clone(message);
    }

    createPortalMailRecipients(addresses = []) {
        return uniqueStrings(asArray(addresses).map(address => normalizeEmail(address))).map(address => {
            const account = this.getRawAccountByEmail(address);
            return {
                userId: String(account?.id || '').trim(),
                address,
                name: String(account?.displayName || account?.nameEn || account?.name || address).trim()
            };
        }).filter(item => item.address);
    }

    createPortalMailMessageCopies(payload = {}) {
        const senderUserId = String(payload.senderUserId || '').trim();
        const senderAccount = senderUserId ? this.state.accounts[senderUserId] : null;
        if (!senderAccount) return { error: 'Sender account was not found.', status: 404 };
        const subject = String(payload.subject || '').trim();
        const body = String(payload.body || '').trim();
        const toRecipients = this.createPortalMailRecipients(payload.to || []).filter(item => item.userId);
        const ccRecipients = this.createPortalMailRecipients(payload.cc || []).filter(item => item.userId);
        const allRecipients = [...toRecipients, ...ccRecipients];
        if (!allRecipients.length) return { error: 'At least one valid portal recipient is required.', status: 400 };
        if (!subject || !body) return { error: 'Recipient, subject, and body are required.', status: 400 };
        const attachments = asArray(payload.attachments).map(file => this.normalizeMessageAttachment(file, senderUserId)).filter(Boolean);
        const sentAt = nowIso();
        const threadId = String(payload.threadId || makeId('mail_thread')).trim();
        const replyToMessageId = String(payload.replyToMessageId || '').trim();
        const sender = {
            userId: senderUserId,
            address: normalizeEmail(senderAccount.email || ''),
            name: String(senderAccount.displayName || senderAccount.nameEn || senderAccount.name || senderUserId).trim()
        };
        const snippet = String(body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
        const makeMessageRecord = (ownerUserId, folderKey, isRead) => ({
            id: makeId('mail_msg'),
            threadId,
            ownerUserId,
            folderKey,
            source: 'portal',
            provider: 'portal',
            from: clone(sender),
            toRecipients: clone(toRecipients),
            ccRecipients: clone(ccRecipients),
            subject,
            body,
            bodyType: 'html',
            snippet,
            hasAttachments: attachments.length > 0,
            attachmentCount: attachments.length,
            attachments: clone(attachments),
            isRead,
            sentAt,
            receivedAt: sentAt,
            createdAt: sentAt,
            updatedAt: sentAt,
            webLink: '',
            replyToMessageId,
            searchBlob: `${subject}\n${body}\n${sender.name}\n${sender.address}\n${allRecipients.map(item => `${item.name} ${item.address}`).join('\n')}`
        });

        const senderCopy = makeMessageRecord(senderUserId, 'sentitems', true);
        this.state.mail.portalMessages[senderCopy.id] = senderCopy;
        const deliveredMessages = [clone(senderCopy)];

        allRecipients.forEach(recipient => {
            if (!recipient.userId || recipient.userId === senderUserId) return;
            const inboxCopy = makeMessageRecord(recipient.userId, 'inbox', false);
            inboxCopy.webLink = '';
            this.state.mail.portalMessages[inboxCopy.id] = inboxCopy;
            deliveredMessages.push(clone(inboxCopy));
            this.createNotification({
                recipientUserId: recipient.userId,
                sourceDomain: 'mail',
                type: 'mail-message',
                title: `New email from ${sender.name}`,
                body: subject,
                routePage: 'home',
                routeData: { messageId: inboxCopy.id }
            });
        });

        this.save();
        return {
            messages: deliveredMessages,
            senderCopy: clone(senderCopy)
        };
    }

    replyToPortalMailMessage(userId, messageId, payload = {}) {
        const original = this.getPortalMailMessage(userId, messageId);
        if (!original) return { error: 'Message was not found.', status: 404 };
        const replyToAddress = normalizeEmail(original.from?.address || '');
        if (!replyToAddress) return { error: 'Original sender address is missing.', status: 400 };
        return this.createPortalMailMessageCopies({
            senderUserId: userId,
            to: [replyToAddress],
            cc: [],
            subject: /^re:/i.test(String(original.subject || '').trim()) ? original.subject : `Re: ${original.subject || '(No subject)'}`,
            body: String(payload.body || payload.comment || '').trim(),
            attachments: asArray(payload.attachments),
            threadId: String(original.threadId || '').trim() || makeId('mail_thread'),
            replyToMessageId: String(original.id || '').trim()
        });
    }

    setPortalMailReadState(userId, messageId, isRead) {
        const normalizedUserId = String(userId || '').trim();
        const normalizedMessageId = String(messageId || '').trim();
        const message = this.state.mail.portalMessages[normalizedMessageId];
        if (!message) return null;
        if (String(message.ownerUserId || '').trim() !== normalizedUserId) return null;
        message.isRead = isRead === true;
        message.updatedAt = nowIso();
        this.save();
        return clone(message);
    }

    createFileFromUpload(payload = {}) {
        return createFileFromUpload.call(this, payload);
    }

    getFile(fileId) {
        return getFile.call(this, fileId);
    }

    objectContainsStoredFileReference(value, fileId, visited = new WeakSet()) {
        return objectContainsStoredFileReference.call(this, value, fileId, visited);
    }

    canActorAccessStoredFile(fileId, actorUserId = '', actorRole = '') {
        return canActorAccessStoredFile.call(this, fileId, actorUserId, actorRole);
    }

    createPortalBootstrap() {
        const portalState = clone(this.state.portal.state || {});
        portalState.lmsLiveQuizzes = clone(this.state.portal.liveQuizWorkspaces || {});
        return {
            state: portalState,
            meta: clone(this.state.portal.meta || {}),
            social: clone(this.state.social || {}),
            accounts: Object.values(this.state.accounts).map(account => this.sanitizeAccountForClient(account))
        };
    }

    createClientSessionPayload(session = null, { includeToken = false } = {}) {
        if (!session || typeof session !== 'object') return null;
        const payload = clone(session) || null;
        if (!payload) return null;
        if (!includeToken) delete payload.token;
        return payload;
    }

    createApplicationBootstrap(token = '') {
        const bootstrap = this.createPortalBootstrap();
        const session = token ? this.getSession(token) : null;
        const account = session ? this.getAccountById(session.userId) : null;
        const effectiveRole = session
            ? (String(session.actualRole || '').trim().toLowerCase() === 'admin' && session.impersonatedRole
                ? String(session.impersonatedRole || '').trim().toLowerCase()
                : String(session.actualRole || '').trim().toLowerCase())
            : '';
        return {
            ...bootstrap,
            account,
            session: this.createClientSessionPayload(session),
            effectiveRole,
            mailSummary: account ? this.getMailSummaryForUser(account.id) : {
                connected: false,
                mailboxAddress: '',
                unreadCount: 0,
                lastSyncAt: '',
                lastSyncStatus: 'idle',
                lastError: ''
            },
            shell: {
                appUrl: this.appUrl,
                backendUrl: this.backendUrl,
                environment: this.environment,
                fileStorageMode: this.fileStorageMode,
                storageDriver: this.storageDriver
            }
        };
    }

    createMicrosoftOauthState(payload = {}) {
        const stateId = String(payload.state || makeId('ms_oauth')).trim();
        if (!stateId) return null;
        const expiresAt = new Date(Date.now() + (1000 * 60 * 10)).toISOString();
        this.state.portal.microsoft.oauthStates[stateId] = {
            state: stateId,
            returnTo: String(payload.returnTo || '').trim(),
            createdAt: nowIso(),
            expiresAt
        };
        this.save();
        return clone(this.state.portal.microsoft.oauthStates[stateId]);
    }

    consumeMicrosoftOauthState(stateId) {
        const normalizedStateId = String(stateId || '').trim();
        if (!normalizedStateId) return null;
        const current = this.state.portal.microsoft.oauthStates[normalizedStateId];
        if (!current) return null;
        delete this.state.portal.microsoft.oauthStates[normalizedStateId];
        this.save();
        if (current.expiresAt && new Date(current.expiresAt).getTime() <= Date.now()) {
            return null;
        }
        return clone(current);
    }

    createMicrosoftLoginCompletion(payload = {}) {
        const handoff = String(payload.handoff || makeId('ms_login')).trim();
        const sessionToken = String(payload.sessionToken || '').trim();
        if (!handoff || !sessionToken) return null;
        const expiresAt = new Date(Date.now() + (1000 * 60 * 5)).toISOString();
        this.state.portal.microsoft.loginCompletions[handoff] = {
            handoff,
            sessionToken,
            email: normalizeEmail(payload.email || ''),
            createdAt: nowIso(),
            expiresAt
        };
        this.save();
        return clone(this.state.portal.microsoft.loginCompletions[handoff]);
    }

    consumeMicrosoftLoginCompletion(handoffId) {
        const normalizedHandoffId = String(handoffId || '').trim();
        if (!normalizedHandoffId) return null;
        const current = this.state.portal.microsoft.loginCompletions[normalizedHandoffId];
        if (!current) return null;
        delete this.state.portal.microsoft.loginCompletions[normalizedHandoffId];
        this.save();
        if (current.expiresAt && new Date(current.expiresAt).getTime() <= Date.now()) {
            return null;
        }
        return clone(current);
    }

    savePortalState(nextState) {
        const existingState = this.state.portal.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        const incomingState = pickClientOwnedPortalState(nextState);
        this.state.portal.state = {
            ...clone(existingState),
            ...incomingState
        };
        this.save();
        return this.createPortalBootstrap();
    }

    saveLegacyPortalState(nextState) {
        return this.savePortalState(nextState);
    }

    getLmsLiveQuizWorkspace(resourceKey = '') {
        const key = String(resourceKey || '').trim();
        if (!key) return null;
        this.state.portal.liveQuizWorkspaces = this.state.portal.liveQuizWorkspaces && typeof this.state.portal.liveQuizWorkspaces === 'object'
            ? this.state.portal.liveQuizWorkspaces
            : {};
        return clone(this.state.portal.liveQuizWorkspaces[key] || null);
    }

    saveLmsLiveQuizWorkspace(resourceKey = '', workspace = {}) {
        const key = String(resourceKey || '').trim();
        if (!key) return null;
        this.state.portal.liveQuizWorkspaces = this.state.portal.liveQuizWorkspaces && typeof this.state.portal.liveQuizWorkspaces === 'object'
            ? this.state.portal.liveQuizWorkspaces
            : {};
        const nextWorkspace = clone(workspace && typeof workspace === 'object' ? workspace : {}) || {};
        nextWorkspace.updatedAt = nowIso();
        this.state.portal.liveQuizWorkspaces[key] = nextWorkspace;
        this.save();
        return clone(nextWorkspace);
    }

    ensureChatBase(payload = {}) {
        const chatId = String(payload.id || payload.chatId || makeId('chat')).trim();
        const existing = this.state.chats[chatId] || null;
        const next = {
            ...(existing || {}),
            id: chatId,
            type: String(payload.type || existing?.type || 'direct').trim().toLowerCase(),
            members: uniqueStrings(asArray(payload.members || existing?.members).map(member => String(member || '').trim())),
            name: String(payload.name || existing?.name || '').trim(),
            createdBy: String(payload.createdBy || existing?.createdBy || '').trim(),
            createdAt: String(payload.createdAt || existing?.createdAt || nowIso()),
            updatedAt: nowIso(),
            groupId: String(payload.groupId || existing?.groupId || '').trim(),
            avatarImage: String(payload.avatarImage || existing?.avatarImage || '').trim(),
            bannerImage: String(payload.bannerImage || existing?.bannerImage || '').trim(),
            requestStateByUser: existing?.requestStateByUser && typeof existing.requestStateByUser === 'object' ? clone(existing.requestStateByUser) : {},
            hiddenByUser: existing?.hiddenByUser && typeof existing.hiddenByUser === 'object' ? clone(existing.hiddenByUser) : {},
            messages: Array.isArray(existing?.messages) ? existing.messages : []
        };
        this.state.chats[chatId] = next;
        return next;
    }

    ensureDirectChat(userA, userB) {
        const members = uniqueStrings([userA, userB]);
        if (members.length !== 2) return null;
        if (!this.getSocialAccount(members[0]) || !this.getSocialAccount(members[1])) return null;
        const existing = Object.values(this.state.chats).find(chat =>
            chat.type === 'direct'
            && uniqueStrings(chat.members).length === 2
            && uniqueStrings(chat.members).every(member => members.includes(member))
        );
        if (existing) return clone(existing);
        const chat = this.ensureChatBase({
            type: 'direct',
            members,
            createdBy: members[0]
        });
        this.save();
        return clone(chat);
    }

    hideChatForUser(chatId, userId) {
        const normalizedChatId = String(chatId || '').trim();
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedChatId || !normalizedUserId) return null;
        const chat = this.state.chats[normalizedChatId];
        if (!chat || !asArray(chat.members).includes(normalizedUserId)) return null;
        chat.hiddenByUser = chat.hiddenByUser && typeof chat.hiddenByUser === 'object' ? chat.hiddenByUser : {};
        chat.hiddenByUser[normalizedUserId] = nowIso();
        chat.updatedAt = nowIso();
        this.save();
        return clone(chat);
    }

    unhideChatForUser(chatId, userId) {
        const normalizedChatId = String(chatId || '').trim();
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedChatId || !normalizedUserId) return null;
        const chat = this.state.chats[normalizedChatId];
        if (!chat || !asArray(chat.members).includes(normalizedUserId)) return null;
        chat.hiddenByUser = chat.hiddenByUser && typeof chat.hiddenByUser === 'object' ? chat.hiddenByUser : {};
        if (chat.hiddenByUser[normalizedUserId]) {
            delete chat.hiddenByUser[normalizedUserId];
            chat.updatedAt = nowIso();
            this.save();
        }
        return clone(chat);
    }

    getChatsForUser(userId) {
        const normalized = String(userId || '').trim();
        return Object.values(this.state.chats)
            .filter(chat => asArray(chat.members).includes(normalized))
            .filter(chat => !(chat.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[normalized]))
            .map(chat => clone(chat))
            .sort((a, b) => {
                const aStamp = a.messages?.[a.messages.length - 1]?.sentAt || a.updatedAt || a.createdAt;
                const bStamp = b.messages?.[b.messages.length - 1]?.sentAt || b.updatedAt || b.createdAt;
                return String(bStamp || '').localeCompare(String(aStamp || ''));
            });
    }

    listMessengerSnapshot(userId) {
        const normalized = String(userId || '').trim();
        const chats = this.getChatsForUser(normalized);
        const calls = Object.values(this.state.calls).filter(call => asArray(call.members).includes(normalized));
        const relatedAccountIds = uniqueStrings([
            normalized,
            ...chats.flatMap(chat => asArray(chat.members)),
            ...calls.flatMap(call => asArray(call.members))
        ]);
        return {
            accounts: relatedAccountIds
                .map(accountId => this.getAccountById(accountId))
                .filter(Boolean),
            chats,
            calls
        };
    }

    normalizeMessageAttachment(file, senderId) {
        return normalizeMessageAttachment.call(this, file, senderId);
    }

    appendMessage(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const senderId = String(payload.senderId || '').trim();
        if (!chatId || !senderId) return null;
        const chat = this.ensureChatBase({
            id: chatId,
            type: payload.type || 'direct',
            members: asArray(payload.members),
            name: payload.name || '',
            createdBy: payload.createdBy || senderId,
            createdAt: payload.createdAt || nowIso()
        });
        if (!asArray(chat.members).includes(senderId)) {
            chat.members = uniqueStrings([...chat.members, senderId]);
        }
        chat.hiddenByUser = chat.hiddenByUser && typeof chat.hiddenByUser === 'object' ? chat.hiddenByUser : {};
        chat.members.forEach((memberId) => {
            if (chat.hiddenByUser[memberId]) delete chat.hiddenByUser[memberId];
        });
        const sourceMessage = payload.message && typeof payload.message === 'object' ? payload.message : {};
        const messageText = String(sourceMessage.text || sourceMessage.body || '').trim();
        const message = {
            id: String(sourceMessage.id || makeId('msg')).trim(),
            senderId,
            senderName: String(sourceMessage.senderName || this.state.accounts[senderId]?.displayName || senderId).trim(),
            senderRole: String(sourceMessage.senderRole || this.state.accounts[senderId]?.role || 'student').trim().toLowerCase(),
            text: messageText,
            file: this.normalizeMessageAttachment(sourceMessage.file, senderId),
            links: extractMessageLinks(messageText),
            sentAt: String(sourceMessage.sentAt || nowIso()),
            replyToMessageId: String(sourceMessage.replyToMessageId || '').trim(),
            seenBy: uniqueStrings([senderId, ...asArray(sourceMessage.seenBy)]),
            seenAtByUser: sourceMessage.seenAtByUser && typeof sourceMessage.seenAtByUser === 'object'
                ? clone(sourceMessage.seenAtByUser)
                : { [senderId]: nowIso() }
        };
        chat.messages.push(message);
        chat.updatedAt = nowIso();
        chat.members.forEach(memberId => {
            if (memberId !== senderId) {
                this.createNotification({
                    recipientUserId: memberId,
                    sourceDomain: 'messenger',
                    type: 'message',
                    title: `New message from ${message.senderName}`,
                    body: message.text || (message.file ? `Sent ${message.file.name}` : 'New message'),
                    routePage: 'social',
                    routeData: { chatId }
                });
            }
        });
        this.save();
        return clone(chat);
    }

    startCall(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const fromUserId = String(payload.fromUserId || '').trim();
        const toUserId = String(payload.toUserId || '').trim();
        const mode = socialText(payload.mode || '').toLowerCase() === 'group' ? 'group' : 'direct';
        const now = nowIso();
        if (!chatId || !fromUserId) return null;
        if (mode === 'group') {
            const chat = this.state.chats[chatId];
            if (!chat || socialText(chat.type || '') !== 'group') return null;
            const group = this.getSocialGroupByChatId(chatId);
            const members = uniqueStrings(asArray(chat.members));
            if (!members.includes(fromUserId)) return null;
            const existing = this.state.calls[chatId];
            if (existing && socialText(existing.mode || '') === 'group' && existing.active !== false) {
                existing.members = members;
                existing.participantIds = uniqueStrings([...asArray(existing.participantIds), fromUserId]);
                existing.joinedAtByUser = {
                    ...(existing.joinedAtByUser && typeof existing.joinedAtByUser === 'object' ? existing.joinedAtByUser : {}),
                    [fromUserId]: now
                };
                existing.status = 'active';
                existing.active = true;
                existing.updatedAt = now;
                this.save();
                return clone(existing);
            }
            this.state.calls[chatId] = {
                chatId,
                mode: 'group',
                members,
                participantIds: [fromUserId],
                joinedAtByUser: { [fromUserId]: now },
                startedBy: fromUserId,
                startedAt: now,
                acceptedAt: now,
                acceptedBy: fromUserId,
                endedAt: '',
                status: 'active',
                active: true,
                updatedAt: now,
                groupId: socialText(group?.id || '')
            };
            members.forEach(memberId => {
                if (!memberId || memberId === fromUserId) return;
                this.createNotification({
                    recipientUserId: memberId,
                    sourceDomain: 'calls',
                    type: 'group-call-started',
                    title: 'Group call started',
                    body: `${this.state.accounts[fromUserId]?.displayName || fromUserId} started a call in ${group?.name || chat.name || 'the group chat'}.`,
                    routePage: 'social',
                    routeData: { chatId, groupId: socialText(group?.id || '') }
                });
            });
            this.save();
            return clone(this.state.calls[chatId]);
        }
        if (!toUserId) return null;
        const chat = this.state.chats[chatId];
        if (!chat || socialText(chat.type || '') !== 'direct') return null;
        const members = uniqueStrings(asArray(chat.members));
        if (!members.includes(fromUserId) || !members.includes(toUserId)) return null;
        this.state.calls[chatId] = {
            chatId,
            mode: 'direct',
            members,
            participantIds: [fromUserId],
            joinedAtByUser: { [fromUserId]: now },
            startedBy: fromUserId,
            startedAt: now,
            acceptedAt: '',
            acceptedBy: '',
            endedAt: '',
            status: 'ringing',
            active: true,
            updatedAt: now
        };
        this.createNotification({
            recipientUserId: toUserId,
            sourceDomain: 'calls',
            type: 'incoming-call',
            title: 'Incoming video call',
            body: `${this.state.accounts[fromUserId]?.displayName || fromUserId} is calling you.`,
            routePage: 'social',
            routeData: { chatId }
        });
        this.save();
        return clone(this.state.calls[chatId]);
    }

    acceptCall(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const fromUserId = String(payload.fromUserId || '').trim();
        const call = this.state.calls[chatId];
        if (!call || !asArray(call.members).includes(fromUserId)) return null;
        call.status = 'accepted';
        call.acceptedAt = nowIso();
        call.acceptedBy = fromUserId;
        call.active = true;
        call.mode = socialText(call.mode || 'direct') || 'direct';
        call.participantIds = uniqueStrings([...asArray(call.participantIds), fromUserId]);
        call.joinedAtByUser = {
            ...(call.joinedAtByUser && typeof call.joinedAtByUser === 'object' ? call.joinedAtByUser : {}),
            [fromUserId]: nowIso()
        };
        call.updatedAt = nowIso();
        this.save();
        return clone(call);
    }

    declineCall(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const fromUserId = String(payload.fromUserId || '').trim();
        const call = this.state.calls[chatId];
        if (!call || !asArray(call.members).includes(fromUserId)) return null;
        call.status = 'declined';
        call.active = false;
        call.endedAt = nowIso();
        this.save();
        return clone(call);
    }

    endCall(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const fromUserId = String(payload.fromUserId || '').trim();
        const call = this.state.calls[chatId];
        if (!call || !asArray(call.members).includes(fromUserId)) return null;
        if (socialText(call.mode || '') === 'group' && fromUserId) {
            call.participantIds = asArray(call.participantIds).filter(item => socialText(item) !== fromUserId);
            call.updatedAt = nowIso();
            if (call.participantIds.length) {
                call.status = 'active';
                call.active = true;
                this.save();
                return clone(call);
            }
        }
        call.status = 'ended';
        call.active = false;
        call.endedAt = nowIso();
        call.updatedAt = nowIso();
        this.save();
        return clone(call);
    }

    joinCall(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const userId = String(payload.userId || payload.fromUserId || '').trim();
        const call = this.state.calls[chatId];
        if (!chatId || !userId || !call || socialText(call.mode || '') !== 'group' || call.active === false) return null;
        if (!asArray(call.members).includes(userId)) return null;
        call.participantIds = uniqueStrings([...asArray(call.participantIds), userId]);
        call.joinedAtByUser = {
            ...(call.joinedAtByUser && typeof call.joinedAtByUser === 'object' ? call.joinedAtByUser : {}),
            [userId]: nowIso()
        };
        call.status = 'active';
        call.active = true;
        call.updatedAt = nowIso();
        this.save();
        return clone(call);
    }

    leaveCall(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const userId = String(payload.userId || payload.fromUserId || '').trim();
        const call = this.state.calls[chatId];
        if (!chatId || !userId || !call || socialText(call.mode || '') !== 'group') return null;
        call.participantIds = asArray(call.participantIds).filter(item => socialText(item) !== userId);
        call.updatedAt = nowIso();
        if (call.participantIds.length) {
            call.status = 'active';
            call.active = true;
        } else {
            call.status = 'ended';
            call.active = false;
            call.endedAt = nowIso();
        }
        this.save();
        return clone(call);
    }

    getSocialAccount(userId) { return getSocialAccount.call(this, userId); }
    isSocialAdmin(userId) { return isSocialAdmin.call(this, userId); }
    getSocialActorDisplayName(userId) { return getSocialActorDisplayName.call(this, userId); }
    getSocialMentionableAccounts() { return getSocialMentionableAccounts.call(this); }
    resolveSocialMentionUserIds(value) { return resolveSocialMentionUserIds.call(this, value); }
    notifySocialMentions(payload = {}) { return notifySocialMentions.call(this, payload); }
    getSocialScopeRecord(scopeType, scopeId) { return getSocialScopeRecord.call(this, scopeType, scopeId); }
    canManageSocialScope(scopeType, scopeId, userId) { return canManageSocialScope.call(this, scopeType, scopeId, userId); }
    buildSocialCommentTree(comments = []) { return buildSocialCommentTree.call(this, comments); }
    findSocialCommentRecord(comments = [], commentId = '') { return findSocialCommentRecord.call(this, comments, commentId); }
    collectSocialCommentThreadIds(comments = [], commentId = '') { return collectSocialCommentThreadIds.call(this, comments, commentId); }
    getSocialProfileRecord(userId = '') { return getSocialProfileRecord.call(this, userId); }
    upsertSocialProfile(userId = '', payload = {}, actorId = '') { return upsertSocialProfile.call(this, userId, payload, actorId); }
    resolveSocialPosts(postIds = [], viewerUserId = '') { return resolveSocialPosts.call(this, postIds, viewerUserId); }
    toggleSocialScopePostPin(scopeType, scopeId, postId, actorId = '') { return toggleSocialScopePostPin.call(this, scopeType, scopeId, postId, actorId); }
    toggleSocialCommentReaction(postId, commentId, userId, reactionType = 'like') { return toggleSocialCommentReaction.call(this, postId, commentId, userId, reactionType); }
    removeSocialComment(postId, commentId, actorId = '') { return removeSocialComment.call(this, postId, commentId, actorId); }
    resolveSocialReport(reportId, payload = {}, actorId = '') { return resolveSocialReport.call(this, reportId, payload, actorId); }
    getSocialActorFacultyCode(userId) { return getSocialActorFacultyCode.call(this, userId); }
    getSocialPageRecord(pageId) { return getSocialPageRecord.call(this, pageId); }
    getSocialGroupRecord(groupId) { return getSocialGroupRecord.call(this, groupId); }
    getSocialGroupByChatId(chatId) { return getSocialGroupByChatId.call(this, chatId); }

    getSocialProjectRecord(projectId) {
        return getSocialProjectRecord.call(this, projectId);
    }

    getSocialProjectByGroupId(groupId) {
        return getSocialProjectByGroupId.call(this, groupId);
    }

    getSocialProjectByChatId(chatId) {
        return getSocialProjectByChatId.call(this, chatId);
    }

    getSocialPostRecord(postId) { return getSocialPostRecord.call(this, postId); }
    getSocialEventRecord(eventId) { return getSocialEventRecord.call(this, eventId); }
    getSocialRelationshipRecord(relationshipId) { return getSocialRelationshipRecord.call(this, relationshipId); }
    getSocialGroupMemberIds(group) { return getSocialGroupMemberIds.call(this, group); }
    getSocialGroupJoinMap(group) { return getSocialGroupJoinMap.call(this, group); }
    getNextSocialGroupOwnerId(group, excludeUserId = '') { return getNextSocialGroupOwnerId.call(this, group, excludeUserId); }
    normalizeSocialGroupState(group) { return normalizeSocialGroupState.call(this, group); }
    getSocialGroupPendingIds(group) { return getSocialGroupPendingIds.call(this, group); }

    getSocialProjectMemberRole(project, userId) {
        return getSocialProjectMemberRole.call(this, project, userId);
    }

    getSocialProjectMemberIds(project) {
        return getSocialProjectMemberIds.call(this, project);
    }

    getSocialProjectAdvisorIds(project) {
        return getSocialProjectAdvisorIds.call(this, project);
    }

    canManageSocialProject(project, userId) {
        return canManageSocialProject.call(this, project, userId);
    }

    canViewSocialProject(project, userId) {
        return canViewSocialProject.call(this, project, userId);
    }

    canContributeToSocialProject(project, userId) {
        return canContributeToSocialProject.call(this, project, userId);
    }

    decorateSocialProject(project, viewerUserId = '') {
        return decorateSocialProject.call(this, project, viewerUserId);
    }

    getSocialPageManagerIds(page) { return getSocialPageManagerIds.call(this, page); }

    getSocialFollowerIds(targetType, targetId) {
        return getSocialFollowerIds.call(this, targetType, targetId);
    }

    isSocialFollowingTarget(userId, targetType, targetId) {
        return isSocialFollowingTarget.call(this, userId, targetType, targetId);
    }

    isSocialConnection(userA, userB) {
        return isSocialConnection.call(this, userA, userB);
    }

    getPendingSocialConnectionRequestBetween(userA, userB) {
        return getPendingSocialConnectionRequestBetween.call(this, userA, userB);
    }

    canManageSocialPage(page, userId) { return canManageSocialPage.call(this, page, userId); }
    canManageSocialGroup(group, userId) { return canManageSocialGroup.call(this, group, userId); }
    isSocialGroupMember(group, userId) { return isSocialGroupMember.call(this, group, userId); }
    canViewSocialPage(page, userId) { return canViewSocialPage.call(this, page, userId); }
    canViewSocialGroup(group, userId) { return canViewSocialGroup.call(this, group, userId); }

    canViewSocialEvent(event, userId) { return canViewSocialEvent.call(this, event, userId); }
    canDeleteSocialGroup(group, userId) { return canDeleteSocialGroup.call(this, group, userId); }
    canDeleteSocialPage(page, userId) { return canDeleteSocialPage.call(this, page, userId); }
    canDeleteSocialEvent(event, userId) { return canDeleteSocialEvent.call(this, event, userId); }
    canEditSocialPost(post, userId) { return canEditSocialPost.call(this, post, userId); }
    canViewSocialPost(post, userId) { return canViewSocialPost.call(this, post, userId); }
    normalizeSocialComment(comment = {}) { return normalizeSocialComment.call(this, comment); }
    decorateSocialPage(page, viewerUserId = '') { return decorateSocialPage.call(this, page, viewerUserId); }
    decorateSocialGroup(group, viewerUserId = '') { return decorateSocialGroup.call(this, group, viewerUserId); }
    decorateSocialPost(post, viewerUserId = '') { return decorateSocialPost.call(this, post, viewerUserId); }
    decorateSocialEvent(event, viewerUserId = '') { return decorateSocialEvent.call(this, event, viewerUserId); }

    listSocialRelationshipsForUser(userId) {
        return listSocialRelationshipsForUser.call(this, userId);
    }

    saveSocialMutation(actorId, eventType, entityType, entityId, beforeState = null, afterState = null) {
        return saveSocialMutation.call(this, actorId, eventType, entityType, entityId, beforeState, afterState);
    }

    ensureSocialProjectCollections() {
        return ensureSocialProjectCollections.call(this);
    }

    appendSocialProjectActivity(projectId, actorId, type, summary, extra = {}) {
        return appendSocialProjectActivity.call(this, projectId, actorId, type, summary, extra);
    }

    getSocialBootstrap(viewerUserId = '') {
        return getSocialBootstrap.call(this, viewerUserId);
    }

    upsertSocialState(social, actorId = '', reason = 'social-save') {
        return upsertSocialState.call(this, social, actorId, reason);
    }

    ensureSocialGroupChat(groupId, actorId = '') {
        return ensureSocialGroupChat.call(this, groupId, actorId);
    }

    createSocialProject(payload = {}, actorId = '') {
        return createSocialProject.call(this, payload, actorId);
    }

    updateSocialProject(projectId, payload = {}, actorId = '') {
        return updateSocialProject.call(this, projectId, payload, actorId);
    }

    deleteSocialProject(projectId, actorId = '') {
        return deleteSocialProject.call(this, projectId, actorId);
    }

    inviteSocialProjectMember(projectId, memberId, role = 'member', actorId = '') {
        return inviteSocialProjectMember.call(this, projectId, memberId, role, actorId);
    }

    updateSocialProjectMemberRole(projectId, memberId, role = 'member', actorId = '') {
        return updateSocialProjectMemberRole.call(this, projectId, memberId, role, actorId);
    }

    removeSocialProjectMember(projectId, memberId, actorId = '') {
        return removeSocialProjectMember.call(this, projectId, memberId, actorId);
    }

    setSocialProjectMembership(projectId, userId, action = 'leave', actorId = '') {
        return setSocialProjectMembership.call(this, projectId, userId, action, actorId);
    }

    createSocialProjectTask(projectId, payload = {}, actorId = '') {
        return createSocialProjectTask.call(this, projectId, payload, actorId);
    }

    updateSocialProjectTask(projectId, taskId, payload = {}, actorId = '') {
        return updateSocialProjectTask.call(this, projectId, taskId, payload, actorId);
    }

    deleteSocialProjectTask(projectId, taskId, actorId = '') {
        return deleteSocialProjectTask.call(this, projectId, taskId, actorId);
    }

    createSocialProjectMilestone(projectId, payload = {}, actorId = '') {
        return createSocialProjectMilestone.call(this, projectId, payload, actorId);
    }

    updateSocialProjectMilestone(projectId, milestoneId, payload = {}, actorId = '') {
        return updateSocialProjectMilestone.call(this, projectId, milestoneId, payload, actorId);
    }

    deleteSocialProjectMilestone(projectId, milestoneId, actorId = '') {
        return deleteSocialProjectMilestone.call(this, projectId, milestoneId, actorId);
    }

    createSocialProjectDeliverable(projectId, payload = {}, actorId = '') {
        return createSocialProjectDeliverable.call(this, projectId, payload, actorId);
    }

    deleteSocialProjectDeliverable(projectId, deliverableId, actorId = '') {
        return deleteSocialProjectDeliverable.call(this, projectId, deliverableId, actorId);
    }

    createSocialProjectCheckin(projectId, payload = {}, actorId = '') {
        return createSocialProjectCheckin.call(this, projectId, payload, actorId);
    }

    createSocialProjectShowcasePage(projectId, actorId = '') {
        return createSocialProjectShowcasePage.call(this, projectId, actorId);
    }

    listSocialFeed(filters = {}) { return listSocialFeed.call(this, filters); }

    createSocialPage(payload = {}, actorId = '') { return createSocialPage.call(this, payload, actorId); }

    createSocialGroup(payload = {}, actorId = '') { return createSocialGroup.call(this, payload, actorId); }

    updateSocialPage(pageId, payload = {}, actorId = '') { return updateSocialPage.call(this, pageId, payload, actorId); }

    updateSocialGroup(groupId, payload = {}, actorId = '') { return updateSocialGroup.call(this, groupId, payload, actorId); }

    setSocialGroupMembership(groupId, userId, action = 'join', actorId = '') {
        return setSocialGroupMembership.call(this, groupId, userId, action, actorId);
    }

    respondSocialGroupMembership(groupId, memberId, accept = true, actorId = '') {
        return respondSocialGroupMembership.call(this, groupId, memberId, accept, actorId);
    }

    removeSocialGroupMember(groupId, memberId, actorId = '') {
        return removeSocialGroupMember.call(this, groupId, memberId, actorId);
    }

    deleteSocialGroup(groupId, actorId = '') { return deleteSocialGroup.call(this, groupId, actorId); }

    inviteSocialGroupMember(groupId, memberId, actorId = '', note = '') { return inviteSocialGroupMember.call(this, groupId, memberId, actorId, note); }

    sendSocialConnectionRequest(fromUserId, toUserId) {
        return sendSocialConnectionRequest.call(this, fromUserId, toUserId);
    }

    respondSocialConnectionRequest(relationshipId, actorId, accept = true) {
        return respondSocialConnectionRequest.call(this, relationshipId, actorId, accept);
    }

    removeSocialConnection(userId, targetUserId) {
        return removeSocialConnection.call(this, userId, targetUserId);
    }

    toggleSocialFollow(userId, targetType, targetId) {
        return toggleSocialFollow.call(this, userId, targetType, targetId);
    }

    createSocialPost(payload = {}, actorId = '') { return createSocialPost.call(this, payload, actorId); }

    updateSocialPost(postId, payload = {}, actorId = '') { return updateSocialPost.call(this, postId, payload, actorId); }

    deleteSocialPost(postId, actorId = '') { return deleteSocialPost.call(this, postId, actorId); }

    shareSocialPost(postId, payload = {}, actorId = '') { return shareSocialPost.call(this, postId, payload, actorId); }

    toggleSocialReaction(postId, userId, reactionType = 'like') { return toggleSocialReaction.call(this, postId, userId, reactionType); }

    addSocialComment(postId, payload = {}) { return addSocialComment.call(this, postId, payload); }

    createSocialEvent(payload = {}, actorId = '') { return createSocialEvent.call(this, payload, actorId); }

    respondSocialEventRsvp(eventId, userId, status = 'going') { return respondSocialEventRsvp.call(this, eventId, userId, status); }

    deleteSocialEvent(eventId, actorId = '') { return deleteSocialEvent.call(this, eventId, actorId); }

    listSocialEvents(filters = {}) { return listSocialEvents.call(this, filters); }

    removeChatMessage(chatId, messageId, actorId = '') {
        const normalizedChatId = socialText(chatId);
        const normalizedMessageId = socialText(messageId);
        const normalizedActorId = socialText(actorId);
        const chat = this.state.chats[normalizedChatId];
        if (!chat || !normalizedMessageId || !normalizedActorId) return null;
        const message = asArray(chat.messages).find(item => socialText(item?.id) === normalizedMessageId);
        if (!message || socialText(message.senderId) !== normalizedActorId) return null;
        const beforeState = clone(message);
        chat.messages = asArray(chat.messages).filter(item => socialText(item?.id) !== normalizedMessageId);
        chat.updatedAt = nowIso();
        this.saveSocialMutation(normalizedActorId, 'message-removed', 'chat-message', normalizedMessageId, beforeState, null);
        return clone(chat);
    }

    createSocialReport(payload = {}) { return createSocialReport.call(this, payload); }

    getComputedStudentHolds(studentId) {
        const manual = Object.values(this.state.registrationHolds)
            .filter(item => String(item.studentId || '') === String(studentId || ''))
            .filter(item => item.isActive !== false);
        const tuition = safeNumber(this.state.portal.state?.tuitionBalances?.[studentId], 0);
        const probation = Boolean(this.state.portal.state?.probationStatus?.[studentId]);
        const derived = [];
        if (tuition > 0) {
            derived.push({
                id: `derived-finance-${studentId}`,
                studentId: String(studentId),
                holdCode: 'finance-balance',
                holdReason: `Outstanding tuition balance: ${tuition} GEL`,
                blocksRegistration: true,
                isActive: true
            });
        }
        if (probation) {
            derived.push({
                id: `derived-probation-${studentId}`,
                studentId: String(studentId),
                holdCode: 'probation-review',
                holdReason: 'Academic probation review is active.',
                blocksRegistration: false,
                isActive: true
            });
        }
        return [...manual, ...derived];
    }

    listCourses(filters = {}) {
        const facultyCode = normalizeCode(filters.facultyCode || filters.faculty || '');
        const search = String(filters.search || '').trim();
        const items = Object.values(this.state.courses)
            .filter(course => !facultyCode || course.facultyCode === facultyCode)
            .filter(course => matchesSearch(course, search, ['id', 'code', 'name', 'facultyCode']))
            .sort((a, b) => {
                const semesterDiff = safeNumber(a.semester, 99) - safeNumber(b.semester, 99);
                if (semesterDiff !== 0) return semesterDiff;
                return String(a.name || '').localeCompare(String(b.name || ''));
            });
        return paginate(items, filters);
    }

    listSections(filters = {}) {
        const courseId = String(filters.courseId || '').trim();
        const facultyCode = normalizeCode(filters.facultyCode || filters.faculty || '');
        const items = Object.values(this.state.sections)
            .filter(section => !courseId || section.courseId === courseId)
            .filter(section => !facultyCode || section.facultyCode === facultyCode)
            .map(section => ({
                ...clone(section),
                course: clone(this.state.courses[section.courseId] || null),
                availableSeats: Math.max(0, safeNumber(section.seatsTotal, 0) - safeNumber(section.seatsTaken, 0))
            }))
            .sort((a, b) => String(a.course?.name || a.courseId).localeCompare(String(b.course?.name || b.courseId)));
        return paginate(items, filters);
    }

    getStudentEnrollments(studentId) {
        const normalized = String(studentId || '').trim();
        return Object.values(this.state.enrollments)
            .filter(item => String(item.studentId) === normalized && String(item.status || 'active') !== 'dropped')
            .map(item => ({
                ...clone(item),
                section: clone(this.state.sections[item.sectionId] || null),
                course: clone(this.state.courses[item.courseId] || null)
            }));
    }

    computeStudentCurrentEcts(studentId) {
        return this.getStudentEnrollments(studentId).reduce((sum, item) => sum + safeNumber(item.course?.ects, 0), 0);
    }

    hasScheduleConflict(studentId, sectionId) {
        const target = this.state.sections[sectionId];
        if (!target) return false;
        return this.getStudentEnrollments(studentId).some(enrollment => {
            const section = enrollment.section;
            if (!section || section.id === sectionId) return false;
            return asArray(section.schedule).some(left =>
                asArray(target.schedule).some(right => schedulesOverlap(left, right))
            );
        });
    }

    getStudentEligibility(studentId) {
        const holds = this.getComputedStudentHolds(studentId);
        const blocksRegistration = holds.some(hold => hold.blocksRegistration);
        return {
            studentId: String(studentId || '').trim(),
            registrationOpen: this.state.portal.state?.registrationOpen !== false,
            holds,
            ects: {
                current: this.computeStudentCurrentEcts(studentId),
                maximum: DEFAULT_MAX_ECTS
            },
            canRegister: !blocksRegistration && this.state.portal.state?.registrationOpen !== false
        };
    }

    upsertHold(payload = {}) {
        const id = String(payload.id || makeId('hold')).trim();
        this.state.registrationHolds[id] = {
            id,
            studentId: String(payload.studentId || '').trim(),
            holdCode: String(payload.holdCode || 'manual-hold').trim(),
            holdReason: String(payload.holdReason || '').trim(),
            blocksRegistration: payload.blocksRegistration !== false,
            blocksGraduation: Boolean(payload.blocksGraduation),
            isActive: payload.isActive !== false,
            placedAt: String(payload.placedAt || nowIso()),
            releasedAt: String(payload.releasedAt || '').trim(),
            updatedAt: nowIso()
        };
        this.save();
        return clone(this.state.registrationHolds[id]);
    }

    upsertSection(payload = {}) {
        const id = String(payload.id || (payload.courseId && payload.code ? `${payload.courseId}::${payload.code}` : makeId('section'))).trim();
        const current = this.state.sections[id] || {};
        this.state.sections[id] = {
            ...current,
            id,
            courseId: String(payload.courseId || current.courseId || '').trim(),
            code: String(payload.code || current.code || '').trim(),
            name: String(payload.name || current.name || payload.code || id).trim(),
            facultyCode: normalizeCode(payload.facultyCode || payload.faculty || current.facultyCode || ''),
            termId: String(payload.termId || current.termId || '').trim(),
            sessionType: String(payload.sessionType || current.sessionType || 'lecture').trim().toLowerCase(),
            seatsTotal: Math.max(0, safeNumber(payload.seatsTotal ?? payload.capacity, current.seatsTotal || 0)),
            seatsTaken: Math.max(0, safeNumber(payload.seatsTaken ?? current.seatsTaken, current.seatsTaken || 0)),
            room: String(payload.room || current.room || '').trim(),
            schedule: Array.isArray(payload.schedule) ? clone(payload.schedule) : (current.schedule || []),
            professorId: String(payload.professorId || current.professorId || '').trim(),
            taIds: uniqueStrings(payload.taIds || current.taIds || []),
            createdAt: String(current.createdAt || nowIso()),
            updatedAt: nowIso()
        };
        this.save();
        return clone(this.state.sections[id]);
    }

    enrollStudent(payload = {}) {
        const studentId = String(payload.studentId || '').trim();
        const sectionId = String(payload.sectionId || '').trim();
        const section = this.state.sections[sectionId];
        if (!studentId || !section) return { error: 'Section not found.', status: 404 };
        const eligibility = this.getStudentEligibility(studentId);
        if (!eligibility.registrationOpen) return { error: 'Registration is closed.', status: 403 };
        if (!eligibility.canRegister) return { error: 'Registration is blocked by an active hold.', status: 403 };
        const existing = Object.values(this.state.enrollments).find(item =>
            String(item.studentId) === studentId
            && String(item.sectionId) === sectionId
            && String(item.status || 'active') !== 'dropped'
        );
        if (existing) return { error: 'Student is already enrolled in this section.', status: 409 };
        if (safeNumber(section.seatsTaken, 0) >= safeNumber(section.seatsTotal, 0)) return { error: 'No seats available.', status: 409 };
        if (this.hasScheduleConflict(studentId, sectionId)) return { error: 'This section conflicts with the current schedule.', status: 409 };
        const ectsAfter = eligibility.ects.current + safeNumber(this.state.courses[section.courseId]?.ects, 0);
        if (ectsAfter > DEFAULT_MAX_ECTS) return { error: 'ECTS limit exceeded.', status: 409 };
        const id = makeId('enr');
        this.state.enrollments[id] = {
            id,
            studentId,
            courseId: section.courseId,
            sectionId,
            status: 'active',
            registeredAt: nowIso(),
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        section.seatsTaken = safeNumber(section.seatsTaken, 0) + 1;
        section.updatedAt = nowIso();
        this.createNotification({
            recipientUserId: studentId,
            sourceDomain: 'registration',
            type: 'enrollment-added',
            title: 'Registration updated',
            body: `You were enrolled in ${this.state.courses[section.courseId]?.name || section.courseId}.`,
            routePage: 'registration',
            routeData: { sectionId }
        });
        this.save();
        return {
            enrollment: clone(this.state.enrollments[id]),
            eligibility: this.getStudentEligibility(studentId),
            section: clone(section)
        };
    }

    dropEnrollment(payload = {}) {
        const studentId = String(payload.studentId || '').trim();
        const sectionId = String(payload.sectionId || '').trim();
        const enrollment = Object.values(this.state.enrollments).find(item =>
            String(item.studentId) === studentId
            && String(item.sectionId) === sectionId
            && String(item.status || 'active') !== 'dropped'
        );
        if (!enrollment) return { error: 'Enrollment not found.', status: 404 };
        enrollment.status = 'dropped';
        enrollment.updatedAt = nowIso();
        const section = this.state.sections[sectionId];
        if (section) {
            section.seatsTaken = Math.max(0, safeNumber(section.seatsTaken, 0) - 1);
            section.updatedAt = nowIso();
        }
        this.createNotification({
            recipientUserId: studentId,
            sourceDomain: 'registration',
            type: 'enrollment-dropped',
            title: 'Section removed',
            body: `You were dropped from ${this.state.courses[enrollment.courseId]?.name || enrollment.courseId}.`,
            routePage: 'registration',
            routeData: { sectionId }
        });
        this.save();
        return {
            enrollment: clone(enrollment),
            eligibility: this.getStudentEligibility(studentId),
            section: clone(section)
        };
    }

    getLmsCourse(courseId) {
        return getLmsCourse.call(this, courseId);
    }

    createAssignment(payload = {}) {
        return createAssignment.call(this, payload);
    }

    createMaterial(payload = {}) {
        return createMaterial.call(this, payload);
    }

    getStudentEnrollmentsByCourse(courseId) {
        return getStudentEnrollmentsByCourse.call(this, courseId);
    }

    getSectionsByCourse(courseId) {
        return getSectionsByCourse.call(this, courseId);
    }

    isCourseTeachingStaff(courseId, userId, role = '') {
        return isCourseTeachingStaff.call(this, courseId, userId, role);
    }

    canAccessGradebookCourse(courseId, userId, role = '', action = 'read') {
        return canAccessGradebookCourse.call(this, courseId, userId, role, action);
    }

    getGradebookAssessmentDefinition(gradebook, criterionKey = '') {
        return getGradebookAssessmentDefinition.call(this, gradebook, criterionKey);
    }

    aggregateGradebookAssessmentEntries(entries = [], mode = 'average') {
        return aggregateGradebookAssessmentEntries.call(this, entries, mode);
    }

    computeRecordFinalScore(record, gradebook = null) {
        return computeRecordFinalScore.call(this, record, gradebook);
    }

    getGradebookCourse(courseId) {
        return getGradebookCourse.call(this, courseId);
    }

    setScore(payload = {}) {
        return setScore.call(this, payload);
    }

    publishGradebook(payload = {}) {
        return publishGradebook.call(this, payload);
    }

    finalizeGrades(payload = {}) {
        return finalizeGrades.call(this, payload);
    }

    listServiceRequests(filters = {}) {
        const requesterUserId = String(filters.requesterUserId || '').trim();
        const status = String(filters.status || '').trim().toLowerCase();
        const items = Object.values(this.state.serviceRequests)
            .filter(item => !requesterUserId || item.requesterUserId === requesterUserId)
            .filter(item => !status || String(item.status || '').trim().toLowerCase() === status)
            .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
        return paginate(items, filters);
    }

    createImportJob(payload = {}) {
        const id = String(payload.id || makeId('import')).trim();
        const importType = String(payload.importType || 'accounts').trim().toLowerCase();
        const rows = asArray(payload.rows).filter(item => item && typeof item === 'object');
        const dryRun = payload.dryRun !== false;
        const validationErrors = [];

        if (importType === 'accounts') {
            rows.forEach((row, index) => {
                if (!row.id) validationErrors.push({ row: index + 1, field: 'id', error: 'Missing id' });
                if (!row.email) validationErrors.push({ row: index + 1, field: 'email', error: 'Missing email' });
                if (!row.role) validationErrors.push({ row: index + 1, field: 'role', error: 'Missing role' });
            });
        }

        if (!dryRun && !validationErrors.length) {
            rows.forEach(row => {
                if (importType === 'accounts') this.upsertAccount(row);
                if (importType === 'sections') this.upsertSection(row);
            });
        }

        this.state.importJobs[id] = {
            id,
            importType,
            rowCount: rows.length,
            dryRun,
            status: validationErrors.length ? 'failed-validation' : dryRun ? 'validated' : 'committed',
            errors: validationErrors,
            createdBy: String(payload.createdBy || '').trim(),
            createdAt: nowIso(),
            finishedAt: nowIso()
        };
        this.save();
        return clone(this.state.importJobs[id]);
    }

    getImportJob(id) {
        return clone(this.state.importJobs[String(id || '').trim()] || null);
    }

    getPlatformStatus() {
        const systems = this.listIntegrationSystems();
        const mailConnections = Object.values(this.state.mail.connections || {});
        const connectedMailboxes = mailConnections.filter(item => item?.connected === true).length;
        const failedMailboxes = mailConnections.filter(item => String(item?.lastSyncStatus || '').trim().toLowerCase() === 'failed').length;
        return {
            environment: this.environment,
            storageDriver: this.storageDriver,
            fileStorageMode: this.fileStorageMode,
            accounts: Object.keys(this.state.accounts).length,
            courses: Object.keys(this.state.courses).length,
            sections: Object.keys(this.state.sections).length,
            chats: Object.keys(this.state.chats).length,
            calls: Object.keys(this.state.calls).length,
            notifications: Object.keys(this.state.notifications).length,
            connectedMailboxes,
            failedMailboxes,
            systems,
            auditEvents: this.state.audit.events.length
        };
    }

    getRuntimeConfig() {
        return {
            environment: this.environment,
            appUrl: this.appUrl,
            backendUrl: this.backendUrl,
            fileStorageMode: this.fileStorageMode,
            storageDriver: this.storageDriver,
            rtc: clone(this.rtc || {}) || {}
        };
    }
}

module.exports = {
    PlatformStore
};
