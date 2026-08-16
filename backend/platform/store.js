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
const { createEmptyPlatformState, createEmptySocialState, createEmptyNewsState, createDefaultNewsSectionCatalog, normalizeNewsSectionIconValue, createEmptyStudentServiceState, createEmptyOrdersState, createEmptyChancelleryState } = require('./state-shape');
const { PostgresRecordStore } = require('./postgres-record-store');
const { LocalRecordStore } = require('./local-record-store');
const { addAuditEvent } = require('./domains/audit-service');
const {
    adoptUploadFileFromDisk,
    canActorAccessStoredFile,
    createFileFromUpload,
    enrichStoredFileReference,
    getFile,
    healAllStoredFilePaths,
    listUnindexedBackgroundGalleryDiskFileIds,
    normalizeMessageAttachment,
    objectContainsStoredFileReference
} = require('./domains/files-service');
const {
    STUDENT_SERVICE_CATEGORIES,

    STUDENT_SERVICE_DEFAULT_MACROS,
    STUDENT_SERVICE_SENSITIVE_CATEGORIES,
    getStudentServiceAreaForCategory,
    getStudentServiceBootstrap,
    normalizeStudentServiceInboxFilterLayout,
    hasStudentServiceMessageContent,
    normalizeStudentServiceAnswerRecord,
    normalizeStudentServiceAttachments,
    resolveStudentServiceAnswerAuthorUserId,
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
    buildMinimalOrdersRecipientFilterLayout,
    normalizeOrdersFacultyCode,
    normalizeOrdersRecipientFilterRole,
    normalizeOrdersRecipientFilterLayout,
    ORDERS_RECIPIENT_FILTER_ROLES,
    normalizeOrdersFilterConnectedRoles,
    getOrdersFilterConnectedRoles,
    mergeOrdersFilterConnections
} = require('./domains/orders-recipient-filter-service');
const {
    buildMinimalChancelleryFilterLayout,
    buildDefaultChancelleryRequestKinds,
    extractRequestKindsFromRoleBucket,
    normalizeChancelleryFacultyCode,
    normalizeChancelleryFilterRole,
    normalizeChancelleryFilterLayout,
    normalizeChancelleryRequestKinds,
    applySharedRequestKindsToLayout,
    CHANCELLERY_FILTER_ROLES,
    normalizeChancelleryFilterConnectedRoles,
    getChancelleryFilterConnectedRoles,
    mergeChancelleryFilterConnections
} = require('./domains/chancellery-filter-service');
const {
    buildDefaultChancelleryDocumentTemplate,
    normalizeChancelleryDocumentFacultyCode,
    normalizeChancelleryDocumentTemplate
} = require('./domains/chancellery-document-service');
const {
    ensurePersonFromAccount,
    syncAccountToPortalState,
    getAccountByEmail,
    getAccountById,
    isSocialEligibleAccount,
    listAccounts,
    listSocialAccounts,
    upsertAccount
} = require('./domains/accounts-service');
const {
    activateAccount,
    changePassword,
    clearSessionImpersonation,
    createSessionByCredentials,
    createSessionByMicrosoftIdentity,
    createSessionForAccount,
    ensureCredential,
    getRawAccountByEmail,
    getRawAccountByMicrosoftOid,
    getSession,
    issueActivationToken,
    linkMicrosoftIdentityToAccount,
    logoutSession,
    requestPasswordReset,
    resetPassword,
    revokeSessionsForUser,
    updateSessionImpersonation,
    upgradeCredentialHashIfNeeded
} = require('./domains/auth-session-service');
const {
    canAccessGradebookCourse
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
    createSocialProjectBudgetCategory,
    createSocialProjectBudgetExpense,
    createSocialProjectRisk,
    createSocialProjectShowcasePage,
    createSocialProjectTask,
    decorateSocialProject,
    deleteSocialProject,
    deleteSocialProjectBudgetCategory,
    deleteSocialProjectBudgetExpense,
    deleteSocialProjectRisk,
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
    setSocialProjectBaseline,
    updateSocialProject,
    updateSocialProjectBudgetCategory,
    updateSocialProjectBudgetExpense,
    updateSocialProjectRisk,
    updateSocialProjectMemberRole,
    updateSocialProjectTask,
    updateSocialProjectTaskGraph
} = require('./domains/social-projects-service');
const {
    addCustomPortfolioSection,
    decoratePortfolio,
    getOrCreatePortfolio,
    listDiscoverablePortfolios,
    publishPortfolio,
    savePortfolio,
    unpublishPortfolio
} = require('./domains/portfolio-service');
const {
    appendSocialProjectActivity,
    ensureSocialGroupChat,
    ensureSocialProjectCollections,
    getSocialBootstrap,
    listSocialRelationshipsForUser,
    migrateLostFoundSocialState,
    saveSocialMutation,
    upsertSocialState
} = require('./domains/social-state-service');
const {
    addSocialComment,
    buildSocialCommentTree,
    canDeleteSocialEvent,
    canDeleteSocialGroup,
    canDeleteSocialPage,
    canEditSocialEvent,
    canEditSocialPost,
    canManageSocialEventEditors,
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
    updateSocialEvent,
    updateSocialGroup,
    updateSocialPage,
    updateSocialPost,
    upsertSocialProfile
} = require('./domains/social-content-service');
const {
    closeExpiredSurveys,
    closeSocialSurvey,
    createSocialSurvey,
    deleteSocialSurvey,
    getSocialSurvey,
    getSocialSurveyResults,
    listSocialSurveys,
    submitSocialSurveyResponse
} = require('./domains/social-surveys-service');
const {
    createSocialResearchPublication,
    deleteSocialResearchPublication,
    getSocialResearchPublication,
    listSocialResearchPublications,
    toggleSocialResearchSave,
    updateSocialResearchPublication
} = require('./domains/social-research-service');
const {
    ensureSocialPinState,
    getSocialPinBootstrap,
    listModulePinnedIds,
    toggleSocialModulePin
} = require('./domains/social-pin-service');
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
    getAntiCheatPolicyDefaults,
    listAntiCheatPolicies,
    heartbeatProtectedQuiz,
    listExamPortalVisibleSessions,
    listExamSessionsForStudent,
    manualGradeProtectedQuiz,
    normalizeExamSessionRecord,
    normalizeExamSessionStatus,
    recordProtectedQuizEvent,
    redeemProtectedQuizLaunch,
    revokeProtectedClientSessions,
    saveAntiCheatPolicySettings,
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
    deleteNotification,
    listNotifications,
    listPushSubscriptions,
    markNotificationRead,
    removePushSubscription,
    updateNotificationPreferences,
    upsertPushSubscription
} = require('./domains/notifications-service');
const {
    listMobilePushTokens,
    removeMobilePushToken,
    upsertMobilePushToken
} = require('./domains/mobile-push-service');
const {
    ensureBackgroundGalleryState,
    getBackgroundGalleryCatalog,
    getBackgroundGalleryUserItems,
    migrateBackgroundGalleryUserItemsFromPortalPrefs,
    reconcileOrphanBackgroundGalleryUserFiles,
    uploadBackgroundGalleryAsset,
    addBackgroundGalleryCatalogItem,
    removeBackgroundGalleryCatalogItem,
    addBackgroundGalleryUserItem,
    removeBackgroundGalleryUserItem,
    promoteBackgroundGalleryUserItem
} = require('./domains/background-gallery-service');

const DEFAULT_MAX_ECTS = 30;

function socialText(value) {
    return String(value || '').trim();
}

function extractMessageLinks(value) {
    const raw = socialText(value);
    if (!raw) return [];
    const matches = raw.match(/https?:\/\/[^\s<>"']+/gi) || [];
    return uniqueStrings(matches.map(item => socialText(item).replace(/[),.;!?]+$/g, ''))).filter(Boolean);
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

/** Staff (professor/ta/admin) may replace these whole keys; students must not. */
const STAFF_WRITABLE_PORTAL_STATE_KEYS = new Set([
    'studentGrades'
]);

/**
 * Authored catalogs that professor/TA/admin may persist (scheduler, timetable,
 * assignments, groups). Students must never overwrite these. Without this
 * allow-list the server silently dropped these keys for non-admin sessions
 * while still returning saved:true, so staff edits vanished on reload.
 */
const PORTAL_STAFF_AUTHORED_GLOBAL_KEYS = new Set([
    'timetable',
    'curriculum',
    'assignments',
    'availableGroups',
    'lmsCourses'
]);
// Schedule/catalog state is authored by the admin scheduler. A TA browser may
// read it, but must not replace it with an empty or stale bootstrap snapshot.
const PORTAL_ADMIN_AUTHORED_SCHEDULE_KEYS = new Set([
    'timetable',
    'curriculum',
    'availableGroups'
]);

const STAFF_PORTAL_WRITE_ROLES = new Set(['professor', 'ta', 'admin']);

const PORTAL_STUDENT_KEYED_STATE_KEYS = new Set([
    'studentSchedulesByStudent',
    'tuitionBalances',
    'homeDashboardPreferencesByUser',
    'portalMessengerFavorites'
]);

const PORTAL_GLOBAL_ADMIN_ONLY_KEYS = new Set([
    'adminProgramStructures',
    'registrationCMSByFaculty',
    'facultyProfiles',
    'curriculumLibraryModulesByFaculty',
    'adminLibrary'
]);
// These records are authored by admin but are read-only academic catalog data
// for every authenticated portal account (programs/registration pages).
const PORTAL_PUBLIC_ACADEMIC_BOOTSTRAP_KEYS = new Set([
    'adminProgramStructures',
    'registrationCMSByFaculty',
    'curriculumLibraryModulesByFaculty'
]);

const ADMIN_LIBRARY_UI_ONLY_KEYS = [
    'catalogPageSize',
    'catalogPageIndex',
    'droplistFilters'
];

function stripAdminLibraryUiOnlyFields(adminLibrary) {
    if (!adminLibrary || typeof adminLibrary !== 'object' || Array.isArray(adminLibrary)) {
        return adminLibrary;
    }
    ADMIN_LIBRARY_UI_ONLY_KEYS.forEach((key) => {
        delete adminLibrary[key];
    });
    return adminLibrary;
}

function getAdminLibraryPortalValidationError(adminLibrary) {
    if (adminLibrary === undefined || adminLibrary === null) return '';
    if (typeof adminLibrary !== 'object' || Array.isArray(adminLibrary)) {
        return 'Invalid adminLibrary payload.';
    }
    if (adminLibrary.books !== undefined) {
        if (!Array.isArray(adminLibrary.books)) {
            return 'adminLibrary.books must be an array.';
        }
        for (const book of adminLibrary.books) {
            if (!book || typeof book !== 'object' || Array.isArray(book) || !String(book.id || '').trim()) {
                return 'Each adminLibrary book must be an object with an id.';
            }
        }
    }
    if (adminLibrary.formSchema !== undefined) {
        if (!Array.isArray(adminLibrary.formSchema)) {
            return 'adminLibrary.formSchema must be an array.';
        }
        for (const field of adminLibrary.formSchema) {
            if (!field || typeof field !== 'object' || Array.isArray(field)) {
                return 'adminLibrary.formSchema fields must be objects.';
            }
        }
    }
    return '';
}

function assertValidAdminLibraryPortalState(adminLibrary) {
    const message = getAdminLibraryPortalValidationError(adminLibrary);
    if (!message) return;
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
}

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

function mergeUserHomeDashboardPreferences(existingEntry = {}, incomingEntry = {}) {
    if (Array.isArray(incomingEntry)) return clone(incomingEntry);
    if (Array.isArray(existingEntry)) return clone(incomingEntry);
    return { ...clone(existingEntry), ...clone(incomingEntry) };
}

function mergeKeyedPortalStateEntry(existingEntry, incomingEntry) {
    const existingIsObject = existingEntry && typeof existingEntry === 'object' && !Array.isArray(existingEntry);
    const incomingIsObject = incomingEntry && typeof incomingEntry === 'object' && !Array.isArray(incomingEntry);
    // Preferences/favorites are object maps and should retain unrelated fields;
    // balances and other keyed values are scalar records and must be replaced,
    // not spread into an empty object.
    return existingIsObject && incomingIsObject
        ? mergeUserHomeDashboardPreferences(existingEntry, incomingEntry)
        : clone(incomingEntry);
}

function mergeKeyedPortalStateMap(existingMap = {}, incomingMap = {}, actorUserId = '', allowGlobalWrite = false) {
    const existing = existingMap && typeof existingMap === 'object' ? existingMap : {};
    const incoming = incomingMap && typeof incomingMap === 'object' ? incomingMap : {};
    if (allowGlobalWrite) {
        const merged = clone(existing);
        Object.keys(incoming).forEach((userId) => {
            merged[userId] = mergeKeyedPortalStateEntry(existing[userId], incoming[userId]);
        });
        return merged;
    }
    const actorId = String(actorUserId || '').trim();
    if (!actorId) return clone(existing);
    const merged = clone(existing);
    if (incoming[actorId] !== undefined) {
        merged[actorId] = mergeKeyedPortalStateEntry(existing[actorId], incoming[actorId]);
    }
    return merged;
}

function mergeAvailableGroupsSnapshot(existingMap = {}, incomingMap = {}) {
    const existing = existingMap && typeof existingMap === 'object' ? existingMap : {};
    const incoming = incomingMap && typeof incomingMap === 'object' ? incomingMap : {};
    const merged = clone(incoming);
    // A browser can legitimately send an older snapshot with an empty subject
    // bucket while it is hydrating. Never interpret that as an instruction to
    // delete an already-authored server schedule.
    Object.entries(existing).forEach(([subjectId, existingGroups]) => {
        if (!Array.isArray(existingGroups) || existingGroups.length === 0) return;
        if (!Array.isArray(incoming[subjectId]) || incoming[subjectId].length === 0) {
            merged[subjectId] = clone(existingGroups);
        }
    });
    return merged;
}

function mergeScopedStudentGrades(existingMap = {}, incomingMap = {}, canWriteRoster = () => false) {
    const existing = existingMap && typeof existingMap === 'object' ? existingMap : {};
    const incoming = incomingMap && typeof incomingMap === 'object' ? incomingMap : {};
    const merged = clone(existing);
    Object.entries(incoming).forEach(([rosterKey, roster]) => {
        if (Array.isArray(roster)) {
            if (canWriteRoster(rosterKey)) merged[rosterKey] = clone(roster);
            return;
        }
        if (!roster || typeof roster !== 'object') return;
        const existingEntry = existing[rosterKey] && typeof existing[rosterKey] === 'object'
            ? existing[rosterKey]
            : {};
        const nextEntry = clone(existingEntry);
        let changed = false;
        Object.entries(roster).forEach(([courseId, grade]) => {
            if (!canWriteRoster(courseId)) return;
            nextEntry[courseId] = clone(grade);
            changed = true;
        });
        if (changed) merged[rosterKey] = nextEntry;
    });
    return merged;
}

function mergeIncomingPortalState(existingState = {}, incomingState = {}, options = {}) {
    const existing = existingState && typeof existingState === 'object' ? existingState : {};
    const incoming = incomingState && typeof incomingState === 'object' ? incomingState : {};
    const merged = clone(existing);
    const actorUserId = String(options.actorUserId || '').trim();
    const allowGlobalWrite = options.allowGlobalWrite === true;
    const effectiveRole = String(options.effectiveRole || '').trim().toLowerCase();
    const canWriteStaffPortalKeys = allowGlobalWrite || STAFF_PORTAL_WRITE_ROLES.has(effectiveRole);
    const droppedKeys = Array.isArray(options.droppedKeys) ? options.droppedKeys : [];

    Object.entries(incoming).forEach(([key, value]) => {
        if (value === undefined || PORTAL_STATE_SERVER_STRIP_KEYS.has(key)) return;

        if (PORTAL_STUDENT_KEYED_STATE_KEYS.has(key)) {
            merged[key] = mergeKeyedPortalStateMap(existing[key], value, actorUserId, allowGlobalWrite);
            return;
        }

        if (PORTAL_GLOBAL_ADMIN_ONLY_KEYS.has(key)) {
            if (allowGlobalWrite) merged[key] = clone(value);
            else droppedKeys.push(key);
            return;
        }

        if (PORTAL_STAFF_AUTHORED_GLOBAL_KEYS.has(key)) {
            if (!canWriteStaffPortalKeys) {
                droppedKeys.push(key);
                return;
            }
            if (PORTAL_ADMIN_AUTHORED_SCHEDULE_KEYS.has(key) && !allowGlobalWrite) {
                droppedKeys.push(key);
                return;
            }
            merged[key] = key === 'availableGroups'
                ? mergeAvailableGroupsSnapshot(existing[key], value)
                : clone(value);
            return;
        }

        if (STAFF_WRITABLE_PORTAL_STATE_KEYS.has(key)) {
            if (canWriteStaffPortalKeys) {
                merged[key] = allowGlobalWrite || effectiveRole === 'admin'
                    ? clone(value)
                    : mergeScopedStudentGrades(existing[key], value, options.canWriteStudentGradesRoster);
            } else {
                droppedKeys.push(key);
            }
            return;
        }

        if (CLIENT_OWNED_PORTAL_STATE_KEYS.has(key) || allowGlobalWrite) {
            merged[key] = clone(value);
        } else if (canWriteStaffPortalKeys) {
            // Professor/TA/admin author portal content (syllabus, assignments,
            // submissions, attendance, messages, LMS workspaces, ...). Without this
            // branch every staff-authored key was silently discarded while the API
            // still reported saved:true, so staff data vanished on reload.
            merged[key] = clone(value);
        } else {
            droppedKeys.push(key);
        }
    });

    return merged;
}

const PORTAL_STATE_SERVER_STRIP_KEYS = new Set([
    'auth',
    'domain',
    'lmsLiveQuizzes',
    'lmsGroupRosterStudentIds',
    'studentServiceAnswers',
    'studentServiceQuestions',
    'studentServiceArticles'
]);

function sanitizePortalStateForServer(source = {}) {
    const input = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    const sanitized = clone(input);
    PORTAL_STATE_SERVER_STRIP_KEYS.forEach((key) => {
        delete sanitized[key];
    });
    if (sanitized.adminLibrary && typeof sanitized.adminLibrary === 'object' && !Array.isArray(sanitized.adminLibrary)) {
        stripAdminLibraryUiOnlyFields(sanitized.adminLibrary);
    }
    return sanitized;
}

function isLmsInteractionStaffMessage(message = {}) {
    return Boolean(message?.isProf || message?.isStaff);
}

function normalizeLmsInteractionMessageShape(message = {}) {
    const parentId = message.parentId == null || String(message.parentId).trim() === ''
        ? null
        : String(message.parentId).trim();
    const type = String(message.type || (parentId ? 'reply' : 'announcement')).trim().toLowerCase();
    return {
        id: String(message.id || '').trim() || `msg_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
        parentId,
        type: type === 'reply' ? 'reply' : 'announcement',
        sender: socialText(message.sender) || 'Unknown',
        text: socialText(message.text),
        time: socialText(message.time),
        createdAt: socialText(message.createdAt) || nowIso(),
        isStaff: Boolean(message.isStaff),
        isProf: Boolean(message.isProf),
        authorId: socialText(message.authorId),
        bulk: Boolean(message.bulk),
        targetGroupId: socialText(message.targetGroupId),
        targetGroupName: socialText(message.targetGroupName)
    };
}

function applyLmsInteractionRoleFlags(message = {}, effectiveRole = '') {
    const role = String(effectiveRole || '').trim().toLowerCase();
    const isProfessor = role === 'professor';
    const isStaffRole = ['professor', 'ta', 'admin'].includes(role);
    if (message.type === 'reply') {
        return { ...message, isStaff: false, isProf: false };
    }
    return {
        ...message,
        isProf: isProfessor,
        isStaff: isStaffRole && !isProfessor
    };
}

function sanitizeLmsInteractionMessagesForServer(incoming = {}, existing = {}, options = {}) {
    const effectiveRole = String(options.effectiveRole || '').trim().toLowerCase();
    const canAnnounce = ['professor', 'ta', 'admin'].includes(effectiveRole);
    const incomingMap = incoming && typeof incoming === 'object' ? incoming : {};
    const existingMap = existing && typeof existing === 'object' ? existing : {};
    const keys = new Set([...Object.keys(existingMap), ...Object.keys(incomingMap)]);
    const sanitized = {};

    keys.forEach((resourceKey) => {
        const existingMessages = asArray(existingMap[resourceKey]).map(normalizeLmsInteractionMessageShape);
        const incomingMessages = asArray(incomingMap[resourceKey]).map(normalizeLmsInteractionMessageShape);
        const existingById = new Map(existingMessages.filter(item => item.id).map(item => [item.id, item]));
        const kept = [];
        const seenIds = new Set();

        const keepMessage = (message) => {
            if (!message?.id || seenIds.has(message.id)) return;
            seenIds.add(message.id);
            kept.push(message);
        };

        incomingMessages.forEach((message) => {
            const isAnnouncement = message.parentId == null && message.type !== 'reply';
            if (!isAnnouncement) return;
            const previous = existingById.get(message.id);
            if (previous && isLmsInteractionStaffMessage(previous)) {
                keepMessage(canAnnounce
                    ? applyLmsInteractionRoleFlags({ ...previous, ...message, type: 'announcement', parentId: null }, effectiveRole)
                    : clone(previous));
                return;
            }
            if (!previous && canAnnounce && isLmsInteractionStaffMessage(message)) {
                keepMessage(applyLmsInteractionRoleFlags({ ...message, type: 'announcement', parentId: null }, effectiveRole));
            }
        });

        existingMessages.forEach((message) => {
            const isAnnouncement = message.parentId == null && message.type !== 'reply';
            if (!isAnnouncement || !isLmsInteractionStaffMessage(message) || seenIds.has(message.id)) return;
            keepMessage(clone(message));
        });

        const staffAnnouncementIds = new Set(
            kept.filter(item => item.parentId == null && isLmsInteractionStaffMessage(item)).map(item => item.id)
        );

        incomingMessages.forEach((message) => {
            const parentId = message.parentId;
            if (!parentId || !staffAnnouncementIds.has(parentId)) return;
            const nextReply = applyLmsInteractionRoleFlags({ ...message, type: 'reply', parentId }, effectiveRole);
            keepMessage(nextReply);
        });

        existingMessages.forEach((message) => {
            if (!message.parentId || !staffAnnouncementIds.has(message.parentId) || seenIds.has(message.id)) return;
            keepMessage(applyLmsInteractionRoleFlags({ ...message, type: 'reply' }, effectiveRole));
        });

        if (kept.length) {
            sanitized[resourceKey] = kept.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
        }
    });

    return sanitized;
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
    if (normalized === 'backlog') return 'todo';
    if (['todo', 'in-progress', 'blocked', 'done'].includes(normalized)) return normalized;
    return 'todo';
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

function studentServiceAnswerHasLegacyResponderFields(answer = {}) {
    const authorUserId = String(answer?.authorUserId || '').trim();
    const responderUserId = String(answer?.responderUserId || '').trim();
    return Boolean(responderUserId && !authorUserId);
}

function mergeStudentServiceAnswerRecords(existing = {}, incoming = {}) {
    const existingAuthor = resolveStudentServiceAnswerAuthorUserId(existing);
    const incomingAuthor = resolveStudentServiceAnswerAuthorUserId(incoming);
    const preferred = incomingAuthor && !existingAuthor ? incoming : existing;
    const fallback = preferred === incoming ? existing : incoming;
    return normalizeStudentServiceAnswerRecord({
        ...fallback,
        ...preferred,
        authorUserId: existingAuthor || incomingAuthor || '',
        authorDisplayName: String(
            preferred.authorDisplayName
            || preferred.responderName
            || fallback.authorDisplayName
            || fallback.responderName
            || ''
        ).trim(),
        authorRole: String(preferred.authorRole || preferred.responderRole || fallback.authorRole || fallback.responderRole || '').trim(),
        responderUserId: String(preferred.responderUserId || fallback.responderUserId || existingAuthor || incomingAuthor || '').trim(),
        parentAnswerId: String(preferred.parentAnswerId || fallback.parentAnswerId || '').trim(),
        helpfulVotes: Object.prototype.hasOwnProperty.call(incoming, 'helpfulVotes')
            ? asArray(incoming.helpfulVotes)
            : asArray(existing.helpfulVotes)
    });
}

function repairOrphanStudentServiceAnswers(answers = []) {
    const grouped = new Map();
    (answers || []).forEach((answer, index) => {
        const questionId = String(answer?.questionId || '').trim();
        if (!questionId) return;
        if (!grouped.has(questionId)) grouped.set(questionId, []);
        grouped.get(questionId).push({ answer, index });
    });
    const repaired = (answers || []).map(answer => ({ ...answer }));
    grouped.forEach(entries => {
        const authorCounts = new Map();
        entries.forEach(({ answer }) => {
            const authorId = resolveStudentServiceAnswerAuthorUserId(answer);
            if (!authorId) return;
            authorCounts.set(authorId, (authorCounts.get(authorId) || 0) + 1);
        });
        if (!authorCounts.size) return;
        const dominantAuthorId = [...authorCounts.entries()].sort((left, right) => right[1] - left[1])[0][0];
        entries.forEach(({ answer, index }) => {
            if (resolveStudentServiceAnswerAuthorUserId(answer)) return;
            const displayName = String(answer.authorDisplayName || answer.responderName || '').trim();
            const role = String(answer.authorRole || answer.responderRole || '').trim().toLowerCase();
            const looksOrphaned = !displayName || displayName === 'Staff' || role === 'student_service';
            if (!looksOrphaned) return;
            const sibling = entries
                .map(entry => entry.answer)
                .find(item => resolveStudentServiceAnswerAuthorUserId(item) === dominantAuthorId);
            repaired[index] = normalizeStudentServiceAnswerRecord({
                ...answer,
                authorUserId: dominantAuthorId,
                responderUserId: dominantAuthorId,
                authorDisplayName: sibling?.authorDisplayName || sibling?.responderName || answer.authorDisplayName || 'Staff',
                authorRole: sibling?.authorRole || sibling?.responderRole || answer.authorRole || 'student',
                responderName: sibling?.authorDisplayName || sibling?.responderName || answer.responderName || '',
                responderRole: sibling?.authorRole || sibling?.responderRole || answer.responderRole || ''
            });
        });
    });
    return repaired;
}

function syncPortalStudentServiceAnswersFromDomain(serviceState, portalState) {
    if (!portalState || !Array.isArray(portalState.studentServiceAnswers) || !serviceState) return false;
    portalState.studentServiceAnswers = serviceState.answers.map((answer, index) =>
        serializeCanonicalStudentServiceAnswerRecord(answer, index)
    );
    return true;
}

function serializeCanonicalStudentServiceAnswerRecord(answer = {}, index = 0) {
    const normalized = normalizeStudentServiceAnswerRecord(answer, index);
    return {
        id: normalized.id,
        questionId: normalized.questionId,
        authorUserId: normalized.authorUserId,
        authorDisplayName: normalized.authorDisplayName,
        authorRole: normalized.authorRole,
        body: normalized.body,
        parentAnswerId: normalized.parentAnswerId,
        status: normalized.status,
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt,
        approvedBy: normalized.approvedBy,
        approvedAt: normalized.approvedAt,
        helpfulVotes: normalized.helpfulVotes
    };
}

function ensureAdminTestingPersonaAccounts(state = {}) {
    if (!state || typeof state !== 'object') return state;
    if (!state.accounts || typeof state.accounts !== 'object') state.accounts = {};
    const facultyCodes = Object.keys(state.faculties || {}).length
        ? Object.keys(state.faculties)
        : ['ECON'];
    const roleSpecs = [
        { role: 'student', suffix: 'student', name: 'Student View Account' },
        { role: 'professor', suffix: 'professor', name: 'Professor View Account' },
        { role: 'ta', suffix: 'ta', name: 'TA View Account' },
        { role: 'student_service', suffix: 'service', name: 'Student Service View Account' }
    ];
    facultyCodes.forEach((facultyCode) => {
        const normalizedFaculty = normalizeCode(facultyCode) || 'ECON';
        roleSpecs.forEach((spec) => {
            const id = `admin-testing-${String(normalizedFaculty).toLowerCase()}-${spec.suffix}`;
            const existing = state.accounts[id];
            const nextAccount = {
                ...(existing && typeof existing === 'object' ? existing : {}),
                id,
                email: `${id}@kiu.test`,
                name: `${spec.name} (${normalizedFaculty})`,
                nameEn: `${spec.name} (${normalizedFaculty})`,
                displayName: `${spec.name} (${normalizedFaculty})`,
                role: spec.role,
                facultyCode: normalizedFaculty,
                faculty: normalizedFaculty,
                accountStatus: 'active',
                status: 'Active',
                isAdminTestingPersona: true,
                createdAt: existing?.createdAt || '2026-06-16T00:00:00.000Z'
            };
            state.accounts[id] = nextAccount;
        });
    });
    return state;
}

function buildNewsReplyReactionCounts(reactions = {}) {
    const counts = {};
    Object.values(reactions || {}).forEach(type => {
        const key = String(type || '').trim();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
}

function buildNewsReplyTree(flatReplies = []) {
    const byId = new Map();
    flatReplies.forEach(reply => {
        byId.set(String(reply.id), { ...reply, children: [] });
    });
    const roots = [];
    byId.forEach(node => {
        const parentId = String(node.parentReplyId || '').trim();
        const parent = parentId ? byId.get(parentId) : null;
        if (parent) parent.children.push(node);
        else roots.push(node);
    });
    return roots;
}

function normalizeNewsReplyMode(value, allowRepliesFallback) {
    const mode = String(value || '').trim().toLowerCase();
    if (mode === 'none') return 'none';
    // Legacy single-channel modes become dual-channel.
    if (mode === 'private' || mode === 'public' || mode === 'both') return 'both';
    if (allowRepliesFallback === false) return 'none';
    return 'both';
}

function normalizeNewsReplyVisibility(value) {
    return String(value || '').trim().toLowerCase() === 'public' ? 'public' : 'private';
}

function postAllowsNewsReplyVisibility(post = {}, visibility = 'private') {
    const mode = normalizeNewsReplyMode(post.replyMode, post.allowReplies);
    if (mode === 'none') return false;
    // When replies are enabled, both public and private channels are always allowed.
    return visibility === 'public' || visibility === 'private' || !visibility;
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
        this.maxBackgroundGalleryUploadBytes = Math.max(
            this.maxFileUploadBytes,
            safeNumber(options.maxBackgroundGalleryUploadBytes, this.maxFileUploadBytes)
        );
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
        // Repair legacy split-brain records once at startup: account identity is
        // authoritative, and the portal directory mirrors must match it before
        // any account receives a bootstrap snapshot.
        Object.values(this.state.accounts || {}).forEach((account) => {
            syncAccountToPortalState.call(this, account);
        });
        try {
            const healed = this.healAllStoredFilePaths();
            if (healed) {
                console.info(`[platform] healed ${healed} stored file path(s) to current uploads dir`);
            }
        } catch (error) {
            console.warn('[platform] stored file path heal failed:', error?.message || error);
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
        state.terms = state.terms && typeof state.terms === 'object' ? state.terms : {};
        state.courses = state.courses && typeof state.courses === 'object' ? state.courses : {};
        state.sections = state.sections && typeof state.sections === 'object' ? state.sections : {};
        state.enrollments = state.enrollments && typeof state.enrollments === 'object' ? state.enrollments : {};
        state.registrationHolds = state.registrationHolds && typeof state.registrationHolds === 'object' ? state.registrationHolds : {};
        state.lmsCourses = state.lmsCourses && typeof state.lmsCourses === 'object' ? state.lmsCourses : {};
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
        state.mobilePushTokens = state.mobilePushTokens && typeof state.mobilePushTokens === 'object' ? state.mobilePushTokens : {};
        // Drop reserved legacy buckets if present on older snapshots
        if (state.serviceRequests) delete state.serviceRequests;
        if (state.docs) delete state.docs;
        state.integrations = state.integrations && typeof state.integrations === 'object' ? state.integrations : {};
        state.integrations.systems = state.integrations.systems && typeof state.integrations.systems === 'object' ? state.integrations.systems : {};
        state.integrations.syncRuns = Array.isArray(state.integrations.syncRuns) ? state.integrations.syncRuns : [];
        state.integrations.conflicts = Array.isArray(state.integrations.conflicts) ? state.integrations.conflicts : [];
        state.audit = state.audit && typeof state.audit === 'object' ? state.audit : {};
        state.audit.events = Array.isArray(state.audit.events) ? state.audit.events : [];
        state.social = state.social && typeof state.social === 'object' ? state.social : createEmptySocialState();
        ensureSocialPinState(state);
        state.studentService = state.studentService && typeof state.studentService === 'object' ? state.studentService : createEmptyStudentServiceState();
        ensureBackgroundGalleryState(state);
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
        state.portal.whiteboardWorkspaces = state.portal.whiteboardWorkspaces && typeof state.portal.whiteboardWorkspaces === 'object'
            ? state.portal.whiteboardWorkspaces
            : {};
        state.portal.meta = state.portal.meta && typeof state.portal.meta === 'object' ? state.portal.meta : {};
        state.portal.microsoft = state.portal.microsoft && typeof state.portal.microsoft === 'object' ? state.portal.microsoft : {};
        state.portal.microsoft.oauthStates = state.portal.microsoft.oauthStates && typeof state.portal.microsoft.oauthStates === 'object'
            ? state.portal.microsoft.oauthStates
            : {};
        state.portal.microsoft.loginCompletions = state.portal.microsoft.loginCompletions && typeof state.portal.microsoft.loginCompletions === 'object'
            ? state.portal.microsoft.loginCompletions
            : {};
        delete state.portal.legacyState;
        migrateLostFoundSocialState(state);
        // Demo/view personas must not be auto-recreated in production. Gate them
        // behind an explicit opt-in or a non-production environment; otherwise the
        // admin-testing-* accounts resurrect themselves on every state load even
        // after being removed.
        const personasEnabled = String(process.env.KIU_ENABLE_ADMIN_TESTING_PERSONAS || '').trim().toLowerCase();
        if (personasEnabled === 'true' || personasEnabled === '1' || this.environment !== 'production') {
            ensureAdminTestingPersonaAccounts(state);
        }
        migrateBackgroundGalleryUserItemsFromPortalPrefs(state);
        return state;
    }

    queueRecordStoreWrite(writeTask) {
        this.state.meta.updatedAt = nowIso();
        if (!this.recordStore) return Promise.resolve();
        this.pendingSave = this.pendingSave
            .catch((error) => {
                console.error('Platform store write failed:', error?.message || error);
                throw error;
            })
            .then(writeTask);
        return this.pendingSave;
    }

    save() {
        return this.queueRecordStoreWrite(() => this.recordStore.writeState(this.state));
    }

    savePortal() {
        if (!this.recordStore || typeof this.recordStore.writeNamespaces !== 'function') {
            return this.save();
        }
        return this.queueRecordStoreWrite(() => this.recordStore.writeNamespaces(
            { portal: this.state.portal },
            { fullState: this.state }
        ));
    }

    saveAccountIdentity() {
        if (!this.recordStore || typeof this.recordStore.writeNamespaces !== 'function') {
            return this.save();
        }
        return this.queueRecordStoreWrite(() => this.recordStore.writeNamespaces({
            accounts: this.state.accounts,
            people: this.state.people,
            authCredentials: this.state.authCredentials,
            sessions: this.state.sessions,
            portal: this.state.portal
        }, { fullState: this.state }));
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
        if (!Array.isArray(this.state.news.sectionCatalog)) {
            this.state.news.sectionCatalog = createDefaultNewsSectionCatalog();
        } else {
            const defaultIcons = new Map(
                createDefaultNewsSectionCatalog().map(entry => [entry.key, entry.icon])
            );
            this.state.news.sectionCatalog = this.state.news.sectionCatalog.map(entry => {
                const key = this.normalizeNewsSectionKey(entry?.key || entry?.label || 'general');
                const label = String(entry?.label || entry?.key || 'General').trim() || 'General';
                const icon = normalizeNewsSectionIconValue(entry?.icon) || defaultIcons.get(key) || '';
                return icon ? { key, label, icon } : { key, label };
            });
        }
        this.state.news.posts.forEach((post) => {
            // replyMode is canonical; allowReplies is derived for older clients.
            post.replyMode = normalizeNewsReplyMode(post.replyMode, post.allowReplies);
            post.allowReplies = post.replyMode !== 'none';
        });
        this.state.news.replies.forEach((reply) => {
            if (!reply.visibility) reply.visibility = 'private';
        });
        return this.state.news;
    }

    indexNewsRepliesByPostId(replies = null) {
        const source = Array.isArray(replies) ? replies : this.ensureNewsState().replies;
        const byPostId = new Map();
        source.forEach((reply) => {
            const postId = String(reply?.postId || '').trim();
            if (!postId) return;
            const bucket = byPostId.get(postId);
            if (bucket) bucket.push(reply);
            else byPostId.set(postId, [reply]);
        });
        return byPostId;
    }

    normalizeNewsReplyMode(value, allowRepliesFallback) {
        return normalizeNewsReplyMode(value, allowRepliesFallback);
    }

    canViewNewsReply(reply = {}, post = {}, viewerUserId = '') {
        const normalizedViewerId = String(viewerUserId || '').trim();
        if (!normalizedViewerId || !this.canViewNewsPost(post, normalizedViewerId)) return false;
        const visibility = normalizeNewsReplyVisibility(reply.visibility);
        if (visibility === 'public') return true;
        const managerView = this.canModerateNewsReplies(normalizedViewerId);
        return managerView || String(reply.authorUserId || '').trim() === normalizedViewerId;
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
        serviceState.inboxFilterLayout = normalizeStudentServiceInboxFilterLayout(serviceState.inboxFilterLayout) || null;

        const portalState = this.state.portal?.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        if (!serviceState.tickets.length && Array.isArray(portalState.studentServiceTickets)) {
            serviceState.tickets = portalState.studentServiceTickets.map((ticket, index) => this.normalizeStudentServiceTicketRecord(ticket, index));
        } else {
            serviceState.tickets = serviceState.tickets.map((ticket, index) => this.normalizeStudentServiceTicketRecord(ticket, index));
        }
        serviceState.articles = serviceState.articles.map((article, index) => this.normalizeStudentServiceArticleRecord(article, index));
        if (Object.prototype.hasOwnProperty.call(portalState, 'studentServiceArticles')) {
            delete portalState.studentServiceArticles;
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
        const portalAnswers = Array.isArray(portalState.studentServiceAnswers) ? portalState.studentServiceAnswers : [];
        const domainAnswers = serviceState.answers.map((answer, index) => this.normalizeStudentServiceAnswerRecord(answer, index));
        const portalNormalized = portalAnswers.map((answer, index) => this.normalizeStudentServiceAnswerRecord(answer, index));
        if (domainAnswers.length) {
            serviceState.answers = repairOrphanStudentServiceAnswers(domainAnswers);
        } else if (portalNormalized.length) {
            serviceState.answers = repairOrphanStudentServiceAnswers(portalNormalized);
        } else {
            serviceState.answers = [];
        }

        if (!serviceState.macros.length) {
            serviceState.macros = STUDENT_SERVICE_DEFAULT_MACROS.map((macro, index) => this.normalizeStudentServiceMacroRecord(macro, index));
        }

        serviceState.reviewQueue = serviceState.reviewQueue
            .map((entry, index) => this.normalizeStudentServiceReviewQueueEntry(entry, index))
            .filter(Boolean);

        return this.reconcileLegacyStudentServiceAnswers(serviceState);
    }

    reconcileLegacyStudentServiceAnswers(serviceState) {
        serviceState.answers = repairOrphanStudentServiceAnswers(
            serviceState.answers.map((answer, index) => this.normalizeStudentServiceAnswerRecord(answer, index))
        );

        const portalState = this.state.portal?.state;
        if (!portalState || !Array.isArray(portalState.studentServiceAnswers)) {
            return serviceState;
        }

        const portalLegacy = portalState.studentServiceAnswers.some(studentServiceAnswerHasLegacyResponderFields);
        const portalOutOfSync = portalState.studentServiceAnswers.length !== serviceState.answers.length
            || portalState.studentServiceAnswers.some((answer, index) => {
                const canonical = serializeCanonicalStudentServiceAnswerRecord(serviceState.answers[index] || {}, index);
                const answerId = String(answer?.id || '').trim();
                return answerId && (
                    String(answer.authorUserId || '') !== canonical.authorUserId
                    || studentServiceAnswerHasLegacyResponderFields(answer)
                );
            });
        if (!portalLegacy && !portalOutOfSync) {
            return serviceState;
        }

        syncPortalStudentServiceAnswersFromDomain(serviceState, portalState);
        this.save();
        return serviceState;
    }

    canDeleteStudentServiceAnswer(question = {}, answer = {}, actorId = '') {
        const viewer = this.getStudentServiceViewerState(actorId);
        const authorId = resolveStudentServiceAnswerAuthorUserId(answer);
        return Boolean(authorId && authorId === viewer.viewerId);
    }

    canDeleteStudentServiceQuestion(question = {}, actorId = '') {
        if (!question) return false;
        const status = String(question.status || '').trim().toLowerCase();
        if (status === 'converted' || status === 'merged') return false;
        const viewer = this.getStudentServiceViewerState(actorId);
        if (viewer.canModerate) return true;
        const questionAuthorId = String(question.authorUserId || '').trim();
        return viewer.role === 'student' && questionAuthorId && questionAuthorId === viewer.viewerId;
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

    canAccessStudentServiceQuestionThread(question = {}, viewerUserId = '') {
        const viewer = this.getStudentServiceViewerState(viewerUserId);
        if (viewer.canModerate) return true;
        if (!question || question.status === 'archived') return false;
        if (viewer.viewerId && viewer.viewerId === String(question.authorUserId || '').trim()) return true;
        const status = String(question.status || '').trim().toLowerCase();
        const normalizedStatus = status === 'pending' || status === 'pending_review' ? 'published' : status;
        return normalizedStatus === 'published' && !question.mergedIntoQuestionId;
    }

    canRespondToStudentServiceQuestion(question = {}, userId = '') {
        const role = this.getStudentServiceRole(userId);
        if (!role) return false;
        return this.canAccessStudentServiceQuestionThread(question, userId);
    }

    shouldForceStudentServiceTicket(payload = {}) {
        if (payload.forcePrivate === true || payload.publiclyVisible === false) return true;
        const category = normalizeStudentServiceCategory(payload.category);
        const body = String(payload.body || payload.message || '').trim().toLowerCase();
        if (STUDENT_SERVICE_SENSITIVE_CATEGORIES.has(category)) return true;
        return /(grade appeal|passport|id card|bank|tuition|payment|invoice|receipt|transcript|certificate|balance)/i.test(body);
    }

    resolveStudentServiceMessageAttachments(payload = {}, actorId = '') {
        return normalizeStudentServiceAttachments(
            asArray(payload.attachments)
                .map(file => this.normalizeMessageAttachment(file, actorId))
                .filter(Boolean)
        );
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

    getStudentServiceViewerState(viewerUserId = '', sessionRole = '') {
        const viewerId = String(viewerUserId || '').trim();
        const accountRole = this.getStudentServiceRole(viewerId);
        const normalizedSessionRole = String(sessionRole || '').trim().toLowerCase();
        const role = normalizedSessionRole || accountRole;
        const facultyCode = this.getStudentServiceFacultyCode(viewerId, '');
        const canModerate = ['admin', 'student_service'].includes(role);
        return {
            viewerId,
            role,
            facultyCode,
            canModerate
        };
    }

    canModerateStudentServiceSession(actorId = '', sessionRole = '') {
        const normalizedSessionRole = String(sessionRole || '').trim().toLowerCase();
        if (['admin', 'student_service'].includes(normalizedSessionRole)) return true;
        return this.canModerateStudentService(actorId);
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
        return this.canAccessStudentServiceQuestionThread(question, viewerUserId);
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
        const serviceState = this.ensureStudentServiceState();
        const parentAnswerId = String(answer.parentAnswerId || '').trim();
        const parentAnswer = parentAnswerId
            ? serviceState.answers.find(item => String(item.id || '').trim() === parentAnswerId) || null
            : null;
        const helpfulVotes = asArray(answer.helpfulVotes);
        return {
            ...clone(answer),
            authorLabel: answer.authorDisplayName || 'Staff',
            replyToName: parentAnswer?.authorDisplayName || '',
            helpfulCount: helpfulVotes.length,
            viewerHelpfulVote: helpfulVotes.some(entry => entry.userId === viewer.viewerId),
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
            viewerCanSetOwnerResolution: viewer.viewerId === String(question.authorUserId || '').trim(),
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

    getStudentServiceBootstrap(viewerUserId = '', options = {}) {
        return getStudentServiceBootstrap.call(this, viewerUserId, options);
    }

    createStudentServiceTicket(payload = {}, actorId = '') {
        const actor = this.getStudentServiceAccount(actorId);
        if (!actor) return { error: 'Student Service ticket author was not found.', status: 404 };
        const role = String(actor.role || '').trim().toLowerCase();
        if (!['student', 'admin', 'student_service'].includes(role)) {
            return { error: 'Only students or service staff may create tickets.', status: 403 };
        }
        const message = String(payload.message || payload.body || '').trim();
        const attachments = this.resolveStudentServiceMessageAttachments(payload, actor.id);
        if (!hasStudentServiceMessageContent(message, attachments)) {
            return { error: 'Ticket message or at least one attachment is required.', status: 400 };
        }
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
                attachments,
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
        const attachments = this.resolveStudentServiceMessageAttachments(payload, actor.id);
        if (!hasStudentServiceMessageContent(message, attachments)) {
            return { error: 'Reply body or at least one attachment is required.', status: 400 };
        }
        ticket.thread.push(this.normalizeStudentServiceThreadEntry({
            id: makeId('svc_msg'),
            authorId: actor.id,
            authorName: actor.displayName || actor.nameEn || actor.name || actor.id,
            authorRole: role,
            message,
            attachments,
            createdAt: nowIso()
        }));
        ticket.latestPreview = message || attachments[0]?.name || 'Attachment';
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
        const attachments = this.resolveStudentServiceMessageAttachments(payload, actorId);
        if (!hasStudentServiceMessageContent(message, attachments)) {
            return { error: 'Internal note body or at least one attachment is required.', status: 400 };
        }
        ticket.internalNotes.push(this.normalizeStudentServiceInternalNote({
            id: makeId('svc_note'),
            authorId: actorId,
            authorName: actor?.displayName || actor?.nameEn || actor?.name || actorId,
            authorRole: actor?.role || 'student_service',
            message,
            attachments,
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

    saveStudentServiceInboxFilterLayout(payload = {}, actorId = '', sessionRole = '') {
        if (!this.canModerateStudentServiceSession(actorId, sessionRole)) {
            return { error: 'Only Student Service moderators can save inbox filter layout.', status: 403 };
        }
        const layout = normalizeStudentServiceInboxFilterLayout(payload.layout || payload);
        if (!layout) return { error: 'Inbox filter layout is invalid.', status: 400 };
        const serviceState = this.ensureStudentServiceState();
        serviceState.inboxFilterLayout = layout;
        this.save();
        return { ok: true, inboxFilterLayout: clone(layout) };
    }

    ensureOrdersPlatformState() {
        if (!this.state.orders || typeof this.state.orders !== 'object') {
            this.state.orders = createEmptyOrdersState();
        }
        const ordersState = this.state.orders;
        if (!ordersState.recipientFilterLayoutByFacultyRole || typeof ordersState.recipientFilterLayoutByFacultyRole !== 'object') {
            ordersState.recipientFilterLayoutByFacultyRole = {};
        }
        if (!ordersState.filterConnectionsByFaculty || typeof ordersState.filterConnectionsByFaculty !== 'object') {
            ordersState.filterConnectionsByFaculty = {};
        }
        ordersState.version = Number(ordersState.version) || 1;
        if (ordersState.recipientFilterLayoutByFaculty && typeof ordersState.recipientFilterLayoutByFaculty === 'object') {
            Object.keys(ordersState.recipientFilterLayoutByFaculty).forEach((facultyCode) => {
                const normalizedFaculty = normalizeOrdersFacultyCode(facultyCode);
                const layout = normalizeOrdersRecipientFilterLayout(ordersState.recipientFilterLayoutByFaculty[facultyCode])
                    || buildMinimalOrdersRecipientFilterLayout();
                if (!ordersState.recipientFilterLayoutByFacultyRole[normalizedFaculty]) {
                    ordersState.recipientFilterLayoutByFacultyRole[normalizedFaculty] = {};
                }
                ['student', 'professor', 'ta', 'student_service'].forEach((role) => {
                    if (!ordersState.recipientFilterLayoutByFacultyRole[normalizedFaculty][role]) {
                        ordersState.recipientFilterLayoutByFacultyRole[normalizedFaculty][role] = clone(layout);
                    }
                });
            });
            delete ordersState.recipientFilterLayoutByFaculty;
        }
        Object.keys(ordersState.recipientFilterLayoutByFacultyRole).forEach((facultyCode) => {
            const normalizedFaculty = normalizeOrdersFacultyCode(facultyCode);
            if (normalizedFaculty !== facultyCode) {
                delete ordersState.recipientFilterLayoutByFacultyRole[facultyCode];
            }
            const roleBucket = ordersState.recipientFilterLayoutByFacultyRole[normalizedFaculty]
                || ordersState.recipientFilterLayoutByFacultyRole[facultyCode]
                || {};
            const normalizedRoleBucket = {};
            ['student', 'professor', 'ta', 'student_service'].forEach((role) => {
                const layout = normalizeOrdersRecipientFilterLayout(roleBucket[role]);
                normalizedRoleBucket[role] = layout || buildMinimalOrdersRecipientFilterLayout();
            });
            ordersState.recipientFilterLayoutByFacultyRole[normalizedFaculty] = normalizedRoleBucket;
        });
        return ordersState;
    }

    getOrdersRecipientFilterLayout(facultyCode = '', recipientRole = '') {
        const ordersState = this.ensureOrdersPlatformState();
        const faculty = normalizeOrdersFacultyCode(facultyCode);
        const role = normalizeOrdersRecipientFilterRole(recipientRole);
        const roleBucket = ordersState.recipientFilterLayoutByFacultyRole[faculty] || {};
        const layout = normalizeOrdersRecipientFilterLayout(roleBucket[role])
            || buildMinimalOrdersRecipientFilterLayout();
        const connectedRoles = getOrdersFilterConnectedRoles(
            ordersState.filterConnectionsByFaculty,
            faculty,
            role
        );
        return {
            ok: true,
            facultyCode: faculty,
            recipientRole: role,
            recipientFilterLayout: clone(layout),
            connectedRoles: clone(connectedRoles)
        };
    }

    saveOrdersRecipientFilterLayout(payload = {}, actorId = '', sessionRole = '') {
        const role = String(sessionRole || '').trim().toLowerCase();
        if (role !== 'admin') {
            return { error: 'Only administrators can save recipient Orders filter layout.', status: 403 };
        }
        const faculty = normalizeOrdersFacultyCode(payload.facultyCode || payload.faculty || '');
        const recipientRole = normalizeOrdersRecipientFilterRole(payload.recipientRole || payload.role || '');
        const layout = normalizeOrdersRecipientFilterLayout(payload.layout || payload);
        if (!layout) return { error: 'Recipient Orders filter layout is invalid.', status: 400 };
        const connectedRoles = normalizeOrdersFilterConnectedRoles(
            payload.connectedRoles != null ? payload.connectedRoles : [recipientRole],
            recipientRole
        );
        const ordersState = this.ensureOrdersPlatformState();
        if (!ordersState.recipientFilterLayoutByFacultyRole[faculty]) {
            ordersState.recipientFilterLayoutByFacultyRole[faculty] = {};
        }
        connectedRoles.forEach((syncRole) => {
            ordersState.recipientFilterLayoutByFacultyRole[faculty][syncRole] = clone(layout);
        });
        ordersState.filterConnectionsByFaculty = mergeOrdersFilterConnections(
            ordersState.filterConnectionsByFaculty,
            faculty,
            recipientRole,
            connectedRoles
        );
        this.save();
        return {
            ok: true,
            facultyCode: faculty,
            recipientRole,
            recipientFilterLayout: clone(layout),
            connectedRoles: clone(connectedRoles)
        };
    }

    ensureChancelleryPlatformState() {
        if (!this.state.chancellery || typeof this.state.chancellery !== 'object') {
            this.state.chancellery = createEmptyChancelleryState();
        }
        const chancelleryState = this.state.chancellery;
        if (!chancelleryState.filterLayoutByFacultyRole || typeof chancelleryState.filterLayoutByFacultyRole !== 'object') {
            chancelleryState.filterLayoutByFacultyRole = {};
        }
        if (!chancelleryState.requestKindsByFaculty || typeof chancelleryState.requestKindsByFaculty !== 'object') {
            chancelleryState.requestKindsByFaculty = {};
        }
        if (!chancelleryState.filterConnectionsByFaculty || typeof chancelleryState.filterConnectionsByFaculty !== 'object') {
            chancelleryState.filterConnectionsByFaculty = {};
        }
        if (!chancelleryState.documentTemplateByFaculty || typeof chancelleryState.documentTemplateByFaculty !== 'object') {
            chancelleryState.documentTemplateByFaculty = {};
        }
        chancelleryState.version = Number(chancelleryState.version) || 1;
        Object.keys(chancelleryState.documentTemplateByFaculty).forEach((facultyCode) => {
            const normalizedFaculty = normalizeChancelleryDocumentFacultyCode(facultyCode);
            const template = normalizeChancelleryDocumentTemplate(
                chancelleryState.documentTemplateByFaculty[facultyCode]
            );
            if (normalizedFaculty !== facultyCode) {
                delete chancelleryState.documentTemplateByFaculty[facultyCode];
            }
            chancelleryState.documentTemplateByFaculty[normalizedFaculty] = template;
        });
        Object.keys(chancelleryState.filterLayoutByFacultyRole).forEach((facultyCode) => {
            const normalizedFaculty = normalizeChancelleryFacultyCode(facultyCode);
            // Read the role bucket before deleting a non-canonical key (e.g. econ → ECON).
            const roleBucket = chancelleryState.filterLayoutByFacultyRole[facultyCode]
                || chancelleryState.filterLayoutByFacultyRole[normalizedFaculty]
                || {};
            if (normalizedFaculty !== facultyCode) {
                delete chancelleryState.filterLayoutByFacultyRole[facultyCode];
            }
            if (!Array.isArray(chancelleryState.requestKindsByFaculty[normalizedFaculty])
                || !chancelleryState.requestKindsByFaculty[normalizedFaculty].length) {
                chancelleryState.requestKindsByFaculty[normalizedFaculty] = extractRequestKindsFromRoleBucket(roleBucket);
            } else {
                chancelleryState.requestKindsByFaculty[normalizedFaculty] = normalizeChancelleryRequestKinds(
                    chancelleryState.requestKindsByFaculty[normalizedFaculty]
                );
            }
            const requestKinds = chancelleryState.requestKindsByFaculty[normalizedFaculty]
                || buildDefaultChancelleryRequestKinds();
            const normalizedRoleBucket = {};
            CHANCELLERY_FILTER_ROLES.forEach((role) => {
                const layout = applySharedRequestKindsToLayout(roleBucket[role], requestKinds);
                normalizedRoleBucket[role] = layout || buildMinimalChancelleryFilterLayout();
            });
            chancelleryState.filterLayoutByFacultyRole[normalizedFaculty] = normalizedRoleBucket;
        });
        Object.keys(chancelleryState.requestKindsByFaculty).forEach((facultyCode) => {
            const normalizedFaculty = normalizeChancelleryFacultyCode(facultyCode);
            if (normalizedFaculty !== facultyCode) {
                delete chancelleryState.requestKindsByFaculty[facultyCode];
            }
            chancelleryState.requestKindsByFaculty[normalizedFaculty] = normalizeChancelleryRequestKinds(
                chancelleryState.requestKindsByFaculty[normalizedFaculty]
            );
        });
        return chancelleryState;
    }

    getChancelleryFilterLayout(facultyCode = '', recipientRole = '') {
        const chancelleryState = this.ensureChancelleryPlatformState();
        const faculty = normalizeChancelleryFacultyCode(facultyCode);
        const role = normalizeChancelleryFilterRole(recipientRole);
        const roleBucket = chancelleryState.filterLayoutByFacultyRole[faculty] || {};
        const requestKinds = normalizeChancelleryRequestKinds(
            chancelleryState.requestKindsByFaculty[faculty] || buildDefaultChancelleryRequestKinds()
        );
        const layout = applySharedRequestKindsToLayout(roleBucket[role], requestKinds)
            || buildMinimalChancelleryFilterLayout();
        const connectedRoles = getChancelleryFilterConnectedRoles(
            chancelleryState.filterConnectionsByFaculty,
            faculty,
            role
        );
        return {
            ok: true,
            facultyCode: faculty,
            recipientRole: role,
            filterLayout: clone(layout),
            requestKinds: clone(requestKinds),
            connectedRoles: clone(connectedRoles)
        };
    }

    getChancelleryDocumentTemplate(facultyCode = '') {
        const chancelleryState = this.ensureChancelleryPlatformState();
        const faculty = normalizeChancelleryDocumentFacultyCode(facultyCode);
        const template = normalizeChancelleryDocumentTemplate(
            chancelleryState.documentTemplateByFaculty[faculty]
                || buildDefaultChancelleryDocumentTemplate()
        );
        return {
            ok: true,
            facultyCode: faculty,
            documentTemplate: clone(template)
        };
    }

    saveChancelleryDocumentTemplate(payload = {}, actorId = '', sessionRole = '') {
        const role = String(sessionRole || '').trim().toLowerCase();
        if (role !== 'admin') {
            return { error: 'Only administrators can save the E-Chancellery appeal document.', status: 403 };
        }
        const faculty = normalizeChancelleryDocumentFacultyCode(payload.facultyCode || payload.faculty || '');
        const template = normalizeChancelleryDocumentTemplate(payload.documentTemplate || payload.template || payload);
        if (!Array.isArray(template?.elements) || !template.elements.length) {
            return { error: 'Appeal document must include at least one canvas element.', status: 400 };
        }
        const chancelleryState = this.ensureChancelleryPlatformState();
        chancelleryState.documentTemplateByFaculty[faculty] = clone(template);
        this.save();
        return {
            ok: true,
            facultyCode: faculty,
            documentTemplate: clone(template)
        };
    }

    saveChancelleryFilterLayout(payload = {}, actorId = '', sessionRole = '') {
        const role = String(sessionRole || '').trim().toLowerCase();
        if (role !== 'admin') {
            return { error: 'Only administrators can save E-Chancellery filter layout.', status: 403 };
        }
        const faculty = normalizeChancelleryFacultyCode(payload.facultyCode || payload.faculty || '');
        const recipientRole = normalizeChancelleryFilterRole(payload.recipientRole || payload.role || '');
        const chancelleryState = this.ensureChancelleryPlatformState();
        const requestKinds = payload.requestKinds != null
            ? normalizeChancelleryRequestKinds(payload.requestKinds)
            : normalizeChancelleryRequestKinds(
                chancelleryState.requestKindsByFaculty[faculty] || buildDefaultChancelleryRequestKinds()
            );
        if (!requestKinds.length) {
            return { error: 'Add at least one shared request type before saving.', status: 400 };
        }
        const layout = applySharedRequestKindsToLayout(payload.layout || payload, requestKinds);
        if (!layout) return { error: 'E-Chancellery filter layout is invalid.', status: 400 };
        const connectedRoles = normalizeChancelleryFilterConnectedRoles(
            payload.connectedRoles != null ? payload.connectedRoles : [recipientRole],
            recipientRole
        );
        if (!chancelleryState.filterLayoutByFacultyRole[faculty]) {
            chancelleryState.filterLayoutByFacultyRole[faculty] = {};
        }
        chancelleryState.requestKindsByFaculty[faculty] = requestKinds;
        connectedRoles.forEach((syncRole) => {
            chancelleryState.filterLayoutByFacultyRole[faculty][syncRole] = clone(layout);
        });
        chancelleryState.filterConnectionsByFaculty = mergeChancelleryFilterConnections(
            chancelleryState.filterConnectionsByFaculty,
            faculty,
            recipientRole,
            connectedRoles
        );
        this.save();
        return {
            ok: true,
            facultyCode: faculty,
            recipientRole,
            filterLayout: clone(layout),
            requestKinds: clone(requestKinds),
            connectedRoles: clone(connectedRoles)
        };
    }

    saveStudentServiceArticle(payload = {}, actorId = '', sessionRole = '') {
        if (!this.canModerateStudentServiceSession(actorId, sessionRole)) {
            return { error: 'Only Student Service staff can save articles.', status: 403 };
        }
        const title = String(payload.title || '').trim();
        const summary = String(payload.summary || '').trim();
        const content = String(payload.content || '').trim();
        if (!title || !summary || !content) return { error: 'Article title, summary, and content are required.', status: 400 };
        const serviceState = this.ensureStudentServiceState();
        const articleId = String(payload.id || makeId('svc_article')).trim();
        const index = serviceState.articles.findIndex(item => String(item.id || '').trim() === articleId);
        const previous = index >= 0 ? serviceState.articles[index] : null;
        const merged = {
            ...previous,
            ...payload,
            id: articleId
        };
        if (!Object.prototype.hasOwnProperty.call(payload, 'serviceArea') && previous?.serviceArea) {
            merged.serviceArea = previous.serviceArea;
        }
        if (!Object.prototype.hasOwnProperty.call(payload, 'category') && previous?.category) {
            merged.category = previous.category;
        }
        const nextArticle = this.normalizeStudentServiceArticleRecord({
            ...merged,
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

    deleteStudentServiceArticle(articleId, actorId = '', sessionRole = '') {
        if (!this.canModerateStudentServiceSession(actorId, sessionRole)) {
            return { error: 'Only Student Service staff can delete articles.', status: 403 };
        }
        const serviceState = this.ensureStudentServiceState();
        const normalizedArticleId = String(articleId || '').trim();
        const index = serviceState.articles.findIndex(item => String(item.id || '').trim() === normalizedArticleId);
        if (index < 0) return { error: 'Article was not found.', status: 404 };
        serviceState.articles.splice(index, 1);
        this.save();
        return { ok: true, deletedArticleId: normalizedArticleId };
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
        const attachments = this.resolveStudentServiceMessageAttachments(payload, actor.id);
        if (!title) return { error: 'Question title is required.', status: 400 };
        if (!hasStudentServiceMessageContent(body, attachments)) {
            return { error: 'Question body or at least one attachment is required.', status: 400 };
        }
        const serviceState = this.ensureStudentServiceState();
        const question = this.normalizeStudentServiceQuestionRecord({
            ...payload,
            id: payload.id || makeId('svc_question'),
            title,
            body,
            attachments,
            authorUserId: actor.id,
            authorDisplayName: actor.displayName || actor.nameEn || actor.name || actor.id,
            authorRole: actor.role,
            facultyCode: payload.facultyCode || payload.faculty || actor.facultyCode || actor.faculty || '',
            anonymousMode: payload.anonymousMode !== false,
            displayIdentityToPeers: payload.displayIdentityToPeers === true,
            status: 'published',
            createdAt: nowIso(),
            updatedAt: nowIso()
        }, serviceState.questions.length);
        serviceState.questions.unshift(question);
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
        const attachments = this.resolveStudentServiceMessageAttachments(payload, actor.id);
        if (!hasStudentServiceMessageContent(body, attachments)) {
            return { error: 'Answer body or at least one attachment is required.', status: 400 };
        }
        const parentAnswerId = String(payload.parentAnswerId || '').trim();
        let parentAnswer = null;
        if (parentAnswerId) {
            parentAnswer = serviceState.answers.find(item =>
                String(item.id || '').trim() === parentAnswerId
                && String(item.questionId || '').trim() === String(question.id || '').trim()
            ) || null;
            if (!parentAnswer) return { error: 'Parent comment was not found.', status: 404 };
            if (String(parentAnswer.parentAnswerId || '').trim()) {
                return { error: 'Only one level of nested replies is supported.', status: 409 };
            }
        }
        const role = String(actor.role || '').trim().toLowerCase();
        const answer = this.normalizeStudentServiceAnswerRecord({
            id: payload.id || makeId('svc_answer'),
            questionId: question.id,
            authorUserId: actor.id,
            authorDisplayName: actor.displayName || actor.nameEn || actor.name || actor.id,
            authorRole: role,
            body,
            attachments,
            parentAnswerId,
            status: 'published',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            approvedBy: actor.id,
            approvedAt: nowIso()
        }, serviceState.answers.length);
        serviceState.answers.unshift(answer);
        question.updatedAt = nowIso();
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    deleteStudentServiceQuestionAnswer(questionId, answerId, actorId = '') {
        const serviceState = this.ensureStudentServiceState();
        const normalizedQuestionId = String(questionId || '').trim();
        const normalizedAnswerId = String(answerId || '').trim();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === normalizedQuestionId);
        if (!question) return { error: 'Question was not found.', status: 404 };
        const answer = serviceState.answers.find(item =>
            String(item.id || '').trim() === normalizedAnswerId
            && String(item.questionId || '').trim() === normalizedQuestionId
        );
        if (!answer) return { error: 'Answer was not found.', status: 404 };
        if (!this.canDeleteStudentServiceAnswer(question, answer, actorId)) {
            return { error: 'You are not allowed to delete this comment.', status: 403 };
        }
        const childIds = new Set(
            serviceState.answers
                .filter(item =>
                    String(item.questionId || '').trim() === normalizedQuestionId
                    && String(item.parentAnswerId || '').trim() === normalizedAnswerId
                )
                .map(item => String(item.id || '').trim())
                .filter(Boolean)
        );
        const removeIds = new Set([normalizedAnswerId, ...childIds]);
        serviceState.answers = serviceState.answers.filter(item => !removeIds.has(String(item.id || '').trim()));
        const portalState = this.state.portal?.state;
        const portalSynced = syncPortalStudentServiceAnswersFromDomain(serviceState, portalState);
        if (String(question.acceptedAnswerId || '').trim() && removeIds.has(String(question.acceptedAnswerId || '').trim())) {
            question.acceptedAnswerId = '';
        }
        question.updatedAt = nowIso();
        this.save();
        if (portalSynced) this.savePortal();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    deleteStudentServiceQuestion(questionId, actorId = '') {
        const serviceState = this.ensureStudentServiceState();
        const normalizedQuestionId = String(questionId || '').trim();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === normalizedQuestionId);
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (!this.canDeleteStudentServiceQuestion(question, actorId)) {
            const status = String(question.status || '').trim().toLowerCase();
            if (status === 'converted' || status === 'merged') {
                return { error: 'Converted or merged questions cannot be deleted.', status: 409 };
            }
            return { error: 'You are not allowed to delete this question.', status: 403 };
        }
        const removedAnswerIds = serviceState.answers
            .filter(item => String(item.questionId || '').trim() === normalizedQuestionId)
            .map(item => String(item.id || '').trim())
            .filter(Boolean);
        serviceState.answers = serviceState.answers.filter(item =>
            String(item.questionId || '').trim() !== normalizedQuestionId
        );
        serviceState.questions = serviceState.questions.filter(item =>
            String(item.id || '').trim() !== normalizedQuestionId
        );
        serviceState.questions.forEach(item => {
            if (!Array.isArray(item.relatedQuestionIds)) return;
            item.relatedQuestionIds = item.relatedQuestionIds.filter(id => String(id || '').trim() !== normalizedQuestionId);
        });
        const portalState = this.state.portal?.state;
        if (portalState && Array.isArray(portalState.studentServiceQuestions)) {
            portalState.studentServiceQuestions = portalState.studentServiceQuestions.filter(item =>
                String(item.id || '').trim() !== normalizedQuestionId
            );
        }
        syncPortalStudentServiceAnswersFromDomain(serviceState, portalState);
        this.resolveStudentServiceReviewQueue('question', normalizedQuestionId, actorId);
        removedAnswerIds.forEach(answerId => this.resolveStudentServiceReviewQueue('answer', answerId, actorId));
        this.save();
        return { deletedQuestionId: normalizedQuestionId };
    }

    setStudentServiceQuestionFeedback(questionId, payload = {}, actorId = '') {
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (!this.canViewStudentServiceQuestion(question, actorId)) {
            return { error: 'You are not allowed to rate this question.', status: 403 };
        }
        const value = payload.value === 'not_helpful' ? 'not_helpful' : 'helpful';
        const normalizedActorId = String(actorId || '').trim();
        const hadVote = question.helpfulVotes.find(entry => entry.userId === normalizedActorId) || null;
        question.helpfulVotes = question.helpfulVotes.filter(entry => entry.userId !== normalizedActorId);
        if (!hadVote || hadVote.value !== value) {
            question.helpfulVotes.push({
                userId: normalizedActorId,
                value,
                updatedAt: nowIso()
            });
        }
        question.updatedAt = nowIso();
        this.save();
        return this.decorateStudentServiceQuestion(question, actorId);
    }

    setStudentServiceAnswerFeedback(questionId, answerId, actorId = '', payload = {}) {
        const serviceState = this.ensureStudentServiceState();
        const normalizedQuestionId = String(questionId || '').trim();
        const normalizedAnswerId = String(answerId || '').trim();
        const normalizedActorId = String(actorId || '').trim();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === normalizedQuestionId);
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (!this.canViewStudentServiceQuestion(question, normalizedActorId)) {
            return { error: 'You are not allowed to rate this answer.', status: 403 };
        }
        const answer = serviceState.answers.find(item =>
            String(item.id || '').trim() === normalizedAnswerId
            && String(item.questionId || '').trim() === normalizedQuestionId
        );
        if (!answer) return { error: 'Answer was not found.', status: 404 };
        if (answer.status !== 'published') {
            return { error: 'Only published answers may be rated.', status: 409 };
        }
        const hadVote = asArray(answer.helpfulVotes).some(entry => entry.userId === normalizedActorId);
        const wantHelpful = typeof payload?.helpful === 'boolean'
            ? payload.helpful
            : !hadVote;
        answer.helpfulVotes = asArray(answer.helpfulVotes).filter(entry => entry.userId !== normalizedActorId);
        if (wantHelpful) {
            answer.helpfulVotes.push({
                userId: normalizedActorId,
                updatedAt: nowIso()
            });
        }
        answer.updatedAt = nowIso();
        question.updatedAt = nowIso();
        const portalState = this.state.portal?.state;
        syncPortalStudentServiceAnswersFromDomain(serviceState, portalState);
        this.save();
        return this.decorateStudentServiceQuestion(question, normalizedActorId);
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

    setStudentServiceQuestionOwnerResolution(questionId, payload = {}, actorId = '') {
        const normalizedActorId = String(actorId || '').trim();
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        if (normalizedActorId !== String(question.authorUserId || '').trim()) {
            return { error: 'Only the question author can update owner resolution.', status: 403 };
        }
        const requestedStatus = String(payload.status || '').trim().toLowerCase();
        const nextStatus = requestedStatus === 'answered' || requestedStatus === 'unanswered' ? requestedStatus : '';
        const currentStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
        question.ownerResolutionStatus = nextStatus && nextStatus === currentStatus ? '' : nextStatus;
        question.ownerResolutionUpdatedAt = nowIso();
        question.ownerResolutionUpdatedBy = normalizedActorId;
        question.updatedAt = nowIso();
        this.save();
        return this.decorateStudentServiceQuestion(question, normalizedActorId);
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

    convertStudentServiceQuestionToArticle(questionId, payload = {}, actorId = '', sessionRole = '') {
        if (!this.canModerateStudentServiceSession(actorId, sessionRole)) {
            return { error: 'Only Student Service staff can convert questions to articles.', status: 403 };
        }
        const serviceState = this.ensureStudentServiceState();
        const question = serviceState.questions.find(item => String(item.id || '').trim() === String(questionId || '').trim());
        if (!question) return { error: 'Question was not found.', status: 404 };
        const answer = serviceState.answers.find(item =>
            String(item.questionId || '').trim() === String(question.id || '').trim()
            && (String(item.id || '').trim() === String(payload.answerId || question.acceptedAnswerId || '').trim() || item.status === 'published')
        ) || null;
        if (!answer) return { error: 'A published answer is required before converting to an article.', status: 409 };
        const questionCategory = payload.category || question.category;
        const article = this.saveStudentServiceArticle({
            title: payload.title || question.title,
            summary: payload.summary || question.body.slice(0, 220),
            content: payload.content || answer.body,
            category: questionCategory,
            serviceArea: payload.serviceArea || getStudentServiceAreaForCategory(questionCategory),
            audience: 'all',
            published: true,
            facultyCode: payload.facultyCode || question.facultyCode || 'ALL',
            sourceQuestionId: question.id
        }, actorId, sessionRole);
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

    getAntiCheatPolicyDefaults() {
        return getAntiCheatPolicyDefaults.call(this);
    }

    listAntiCheatPolicies() {
        return listAntiCheatPolicies.call(this);
    }

    saveAntiCheatPolicySettings(payload = {}) {
        return saveAntiCheatPolicySettings.call(this, payload);
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

    listSocialAccounts(filters = {}) {
        return listSocialAccounts.call(this, filters);
    }

    isSocialEligibleAccount(userId = '') {
        return isSocialEligibleAccount.call(this, userId);
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

    upsertAccount(payload = {}, options = {}) {
        return upsertAccount.call(this, payload, options);
    }

    activateAccount(userId, newPassword, activationToken) {
        return activateAccount.call(this, userId, newPassword, activationToken);
    }

    issueActivationToken(userId, options = {}) {
        return issueActivationToken.call(this, userId, options);
    }

    requestPasswordReset(email) {
        return requestPasswordReset.call(this, email);
    }

    resetPassword(token, newPassword) {
        return resetPassword.call(this, token, newPassword);
    }

    changePassword(userId, currentPassword, newPassword) {
        return changePassword.call(this, userId, currentPassword, newPassword);
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

    updateSessionImpersonation(token, impersonatedRole, impersonatedUserId = '') {
        return updateSessionImpersonation.call(this, token, impersonatedRole, impersonatedUserId);
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

    deleteNotification(notificationId, userId = '') {
        return deleteNotification.call(this, notificationId, userId);
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

    upsertMobilePushToken(userId, token, metadata = {}) {
        return upsertMobilePushToken.call(this, userId, token, metadata);
    }

    listMobilePushTokens(userId = '') {
        return listMobilePushTokens.call(this, userId);
    }

    removeMobilePushToken(userId, token) {
        return removeMobilePushToken.call(this, userId, token);
    }

    normalizeNewsSectionKey(value = '') {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'general';
    }

    normalizeNewsFontSize(value, fallback = 18) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(8, Math.min(96, parsed));
    }

    normalizeNewsTypography(post = {}) {
        return {
            titleFontSize: this.normalizeNewsFontSize(post.titleFontSize, 28),
            bodyFontSize: this.normalizeNewsFontSize(post.bodyFontSize, 18),
            excerptFontSize: this.normalizeNewsFontSize(post.excerptFontSize, 15)
        };
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
        if (status === 'archived' && !(isManager || isAuthor)) return false;
        const nowMs = Date.now();
        const publishAtMs = post.publishAt ? new Date(post.publishAt).getTime() : 0;
        const expiresAtMs = post.expiresAt ? new Date(post.expiresAt).getTime() : 0;
        if (!isManager && !isAuthor && status === 'published') {
            if (publishAtMs && !Number.isNaN(publishAtMs) && publishAtMs > nowMs) return false;
            if (expiresAtMs && !Number.isNaN(expiresAtMs) && expiresAtMs < nowMs) return false;
        }
        const roleTargets = this.normalizeNewsRoleTargets(post.audienceRoles || []);
        const facultyTargets = this.normalizeNewsFacultyTargets(post.audienceFacultyCodes || []);
        const userTargets = uniqueStrings(asArray(post.targetUserIds).map(value => String(value || '').trim()).filter(Boolean));
        const courseTargets = uniqueStrings(asArray(post.courseIds).map(value => String(value || '').trim()).filter(Boolean));
        const programTarget = String(post.programCode || '').trim().toUpperCase();
        if (!viewerAccount) return status === 'published' && !roleTargets.length && !facultyTargets.length && !userTargets.length && !courseTargets.length && !programTarget;
        const role = String(viewerAccount.role || '').trim().toLowerCase();
        const facultyCode = normalizeCode(viewerAccount.facultyCode || viewerAccount.faculty || '');
        const roleMatch = !roleTargets.length || roleTargets.includes(role);
        const facultyMatch = !facultyTargets.length || facultyTargets.includes(facultyCode);
        const userMatch = !userTargets.length || userTargets.includes(normalizedViewerId);
        const courseMatch = !courseTargets.length || courseTargets.some(courseId => this.accountCanAccessNewsCourse(normalizedViewerId, courseId, viewerAccount));
        const accountProgram = String(viewerAccount.programCode || viewerAccount.studyProgram || '').trim().toUpperCase();
        const programMatch = !programTarget || (accountProgram && accountProgram === programTarget);
        return roleMatch && facultyMatch && userMatch && courseMatch && programMatch;
    }

    accountCanAccessNewsCourse(userId = '', courseId = '', account = null) {
        const normalizedUserId = String(userId || '').trim();
        const normalizedCourseId = String(courseId || '').trim();
        if (!normalizedUserId || !normalizedCourseId) return false;
        if (this.canManageNews(normalizedUserId)) return true;
        const viewerAccount = account || this.getAccountById(normalizedUserId);
        const role = String(viewerAccount?.role || '').trim().toLowerCase();
        if (this.isCourseTeachingStaff(normalizedCourseId, normalizedUserId, role)) return true;
        const enrollments = this.getStudentEnrollmentsByCourse(normalizedCourseId) || [];
        return enrollments.some(entry => String(entry?.studentId || entry?.userId || entry?.accountId || '').trim() === normalizedUserId);
    }

    normalizeNewsCourseIds(values = []) {
        return uniqueStrings(asArray(values).map(value => String(value || '').trim()).filter(Boolean));
    }

    normalizeNewsAttachments(payload = {}, actorId = '') {
        return asArray(payload.attachments)
            .map(file => this.normalizeMessageAttachment(file, actorId))
            .filter(Boolean);
    }

    matchesNewsFeedDateRange(post = {}, dateFrom = '', dateTo = '') {
        const from = String(dateFrom || '').trim().slice(0, 10);
        const to = String(dateTo || '').trim().slice(0, 10);
        if (!from && !to) return true;
        const postDate = String(post.publishedAt || post.createdAt || '').slice(0, 10);
        if (!postDate) return true;
        if (from && postDate < from) return false;
        if (to && postDate > to) return false;
        return true;
    }

    decorateNewsPost(post = {}, viewerUserId = '', repliesByPostId = null) {
        const normalizedViewerId = String(viewerUserId || '').trim();
        const managerView = normalizedViewerId && this.canModerateNewsReplies(normalizedViewerId);
        const replyMode = normalizeNewsReplyMode(post.replyMode, post.allowReplies);
        const postId = String(post.id || '').trim();
        const indexedReplies = repliesByPostId instanceof Map
            ? (repliesByPostId.get(postId) || [])
            : this.ensureNewsState().replies.filter(reply => String(reply.postId || '').trim() === postId);
        const postReplies = indexedReplies
            .slice()
            .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
        const decorateFlat = (replies) => replies.map(reply => ({
            ...clone(reply),
            visibility: normalizeNewsReplyVisibility(reply.visibility),
            reactions: clone(reply.reactions || {}),
            reactionCounts: buildNewsReplyReactionCounts(reply.reactions),
            viewerReaction: String((reply.reactions || {})[normalizedViewerId] || ''),
            viewerCanDelete: Boolean(normalizedViewerId && (String(reply.authorUserId || '') === normalizedViewerId || managerView))
        }));
        const publicReplies = postReplies.filter(reply => normalizeNewsReplyVisibility(reply.visibility) === 'public');
        const privateReplies = postReplies.filter(reply => {
            if (normalizeNewsReplyVisibility(reply.visibility) === 'public') return false;
            return managerView || String(reply.authorUserId || '').trim() === normalizedViewerId;
        });
        return {
            ...clone(post),
            replyMode,
            allowReplies: replyMode !== 'none',
            attachments: asArray(post.attachments).map(file => clone(file)),
            audienceRoles: this.normalizeNewsRoleTargets(post.audienceRoles || []),
            audienceFacultyCodes: this.normalizeNewsFacultyTargets(post.audienceFacultyCodes || []),
            targetUserIds: uniqueStrings(asArray(post.targetUserIds).map(value => String(value || '').trim()).filter(Boolean)),
            courseIds: this.normalizeNewsCourseIds(post.courseIds || []),
            programCode: String(post.programCode || '').trim().toUpperCase(),
            ...this.normalizeNewsTypography(post),
            viewerCanManage: normalizedViewerId ? this.canManageNews(normalizedViewerId) : false,
            viewerCanModerateReplies: managerView,
            publicReplies: buildNewsReplyTree(decorateFlat(publicReplies)),
            publicReplyCount: publicReplies.length,
            privateReplies: buildNewsReplyTree(decorateFlat(privateReplies)),
            privateReplyCount: privateReplies.length
        };
    }

    getNewsSectionCatalog() {
        return this.ensureNewsState().sectionCatalog.map(entry => {
            const key = this.normalizeNewsSectionKey(entry?.key || entry?.label || 'general');
            const label = String(entry?.label || entry?.key || 'General').trim() || 'General';
            const icon = normalizeNewsSectionIconValue(entry?.icon);
            return icon ? { key, label, icon } : { key, label };
        });
    }

    getNewsSectionPostCountsAll() {
        const counts = new Map();
        this.ensureNewsState().posts.forEach(post => {
            const key = this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general');
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return counts;
    }

    placeReassignedNewsPostAtSectionBottom(post = {}, targetKey = '', allPosts = []) {
        const normalizedTarget = this.normalizeNewsSectionKey(targetKey);
        const postId = String(post?.id || '').trim();
        let oldestMs = null;
        asArray(allPosts).forEach(item => {
            if (String(item?.id || '').trim() === postId) return;
            if (this.normalizeNewsSectionKey(item?.sectionKey || item?.sectionLabel || 'general') !== normalizedTarget) return;
            const stamp = String(item?.publishedAt || item?.createdAt || '').trim();
            if (!stamp) return;
            const ms = new Date(stamp).getTime();
            if (Number.isNaN(ms)) return;
            if (oldestMs === null || ms < oldestMs) oldestMs = ms;
        });
        const fallbackStamp = String(post?.createdAt || post?.publishedAt || '').trim() || nowIso();
        post.publishedAt = oldestMs === null
            ? fallbackStamp
            : new Date(oldestMs - 1000).toISOString();
        post.pinned = false;
    }

    getNewsSectionPostCountsForViewer(viewerUserId = '') {
        const counts = new Map();
        this.ensureNewsState().posts.forEach(post => {
            if (!this.canViewNewsPost(post, viewerUserId)) return;
            const key = this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general');
            const label = String(post.sectionLabel || post.sectionKey || 'General').trim() || 'General';
            const current = counts.get(key) || { key, label, count: 0 };
            current.count += 1;
            counts.set(key, current);
        });
        return counts;
    }

    getNewsSectionsForViewer(viewerUserId = '') {
        const postCounts = this.getNewsSectionPostCountsForViewer(viewerUserId);
        const merged = new Map();
        this.getNewsSectionCatalog().forEach(entry => {
            const counted = postCounts.get(entry.key);
            merged.set(entry.key, {
                key: entry.key,
                label: entry.label,
                count: counted?.count || 0,
                ...(entry.icon ? { icon: entry.icon } : {})
            });
        });
        postCounts.forEach((entry, key) => {
            if (!merged.has(key)) {
                merged.set(key, { ...entry });
            }
        });
        return [...merged.values()].sort((left, right) => {
            if (right.count !== left.count) return right.count - left.count;
            return String(left.label || '').localeCompare(String(right.label || ''));
        });
    }

    saveNewsSectionCatalog(entries = [], actorId = '', reassignments = {}) {
        const normalizedActorId = String(actorId || '').trim();
        if (!this.canManageNews(normalizedActorId)) {
            return { error: 'Only administrators or delegated news managers can manage news sections.', status: 403 };
        }
        const normalized = [];
        const seenKeys = new Set();
        for (const entry of asArray(entries)) {
            const label = String(entry?.label || '').trim();
            if (!label) {
                return { error: 'Every section needs a display name.', status: 400 };
            }
            const key = entry?.key
                ? this.normalizeNewsSectionKey(entry.key)
                : this.normalizeNewsSectionKey(label);
            if (seenKeys.has(key)) {
                return { error: `Duplicate section key: ${key}`, status: 400 };
            }
            seenKeys.add(key);
            const icon = normalizeNewsSectionIconValue(entry?.icon);
            normalized.push(icon ? { key, label, icon } : { key, label });
        }
        if (!normalized.length) {
            return { error: 'At least one section is required.', status: 400 };
        }
        const oldCatalog = this.getNewsSectionCatalog();
        const oldByKey = new Map(oldCatalog.map(item => [item.key, item]));
        const newKeys = new Set(normalized.map(item => item.key));
        const news = this.ensureNewsState();
        const normalizedReassignments = {};
        const reassignmentInput = reassignments && typeof reassignments === 'object' ? reassignments : {};
        for (const [rawFrom, rawTo] of Object.entries(reassignmentInput)) {
            const fromKey = this.normalizeNewsSectionKey(rawFrom);
            const toKey = this.normalizeNewsSectionKey(rawTo);
            if (!fromKey || !toKey) {
                return { error: 'Invalid section reassignment.', status: 400 };
            }
            if (fromKey === toKey) {
                return { error: 'Section reassignment source and target must differ.', status: 400 };
            }
            if (!newKeys.has(toKey)) {
                return { error: 'Reassignment target must remain in the catalog.', status: 400 };
            }
            normalizedReassignments[fromKey] = toKey;
        }
        for (const [fromKey, toKey] of Object.entries(normalizedReassignments)) {
            const target = normalized.find(item => item.key === toKey);
            if (!target) {
                return { error: 'Reassignment target section was not found.', status: 400 };
            }
            const hadPosts = news.posts.some(post =>
                this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general') === fromKey
            );
            if (!oldByKey.has(fromKey) && !hadPosts) {
                return { error: `Section "${fromKey}" was not found.`, status: 400 };
            }
            news.posts.forEach(post => {
                if (this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general') !== fromKey) return;
                post.sectionKey = target.key;
                post.sectionLabel = target.label;
                this.placeReassignedNewsPostAtSectionBottom(post, target.key, news.posts);
            });
        }
        const postCounts = this.getNewsSectionPostCountsAll();
        for (const oldEntry of oldCatalog) {
            if (newKeys.has(oldEntry.key)) continue;
            const count = postCounts.get(oldEntry.key) || 0;
            if (count > 0) {
                const noun = count === 1 ? 'announcement' : 'announcements';
                return {
                    error: `${oldEntry.label} has ${count} ${noun} — reassign or remove them first.`,
                    status: 400
                };
            }
        }
        for (const [key, count] of postCounts.entries()) {
            if (newKeys.has(key) || count <= 0) continue;
            const samplePost = news.posts.find(post =>
                this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general') === key
            );
            const label = String(samplePost?.sectionLabel || key).trim() || key;
            const noun = count === 1 ? 'announcement' : 'announcements';
            return {
                error: `${label} has ${count} ${noun} — reassign or remove them first.`,
                status: 400
            };
        }
        normalized.forEach(entry => {
            const previous = oldByKey.get(entry.key);
            if (!previous || previous.label === entry.label) return;
            news.posts.forEach(post => {
                if (this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general') !== entry.key) return;
                post.sectionLabel = entry.label;
                post.sectionKey = entry.key;
            });
        });
        news.sectionCatalog = normalized.map(item => ({ ...item }));
        if (this.state.meta && typeof this.state.meta === 'object') {
            this.state.meta.updatedAt = nowIso();
        }
        this.save();
        return {
            catalog: this.getNewsSectionCatalog(),
            sections: this.getNewsSectionsForViewer(normalizedActorId)
        };
    }

    listNewsSectionCatalog(viewerUserId = '') {
        const normalizedViewerId = String(viewerUserId || '').trim();
        return {
            catalog: this.getNewsSectionCatalog(),
            sections: this.getNewsSectionsForViewer(normalizedViewerId)
        };
    }

    listNewsFeed(filters = {}) {
        const viewerUserId = String(filters.userId || filters.viewerUserId || '').trim();
        const sectionKey = this.normalizeNewsSectionKey(filters.section || 'all');
        const search = String(filters.search || '').trim();
        const priority = String(filters.priority || 'all').trim().toLowerCase();
        const pinned = String(filters.pinned || 'all').trim().toLowerCase();
        const statusFilter = String(filters.status || 'all').trim().toLowerCase();
        const dateFrom = String(filters.dateFrom || '').trim();
        const dateTo = String(filters.dateTo || '').trim();
        const courseId = String(filters.courseId || '').trim();
        const limit = Math.max(0, Number.parseInt(filters.limit, 10) || 0);
        const featuredOnly = String(filters.featured || '').trim() === '1' || filters.featured === true;
        const isManager = viewerUserId && this.canManageNews(viewerUserId);
        let items = this.ensureNewsState().posts
            .filter(post => this.canViewNewsPost(post, viewerUserId))
            .filter(post => sectionKey === 'all' || this.normalizeNewsSectionKey(post.sectionKey || post.sectionLabel || 'general') === sectionKey)
            .filter(post => !search || matchesSearch(post, search, ['title', 'body', 'sectionLabel', 'sectionKey', 'createdByName', 'excerpt']))
            .filter(post => priority === 'all' || String(post.priority || 'standard').toLowerCase() === priority)
            .filter(post => {
                if (pinned === 'all' || !pinned) return true;
                if (pinned === 'yes' || pinned === 'true' || pinned === '1') return Boolean(post.pinned);
                if (pinned === 'no' || pinned === 'false' || pinned === '0') return !post.pinned;
                return true;
            })
            .filter(post => {
                if (!isManager || statusFilter === 'all' || !statusFilter) return true;
                return String(post.status || 'published').toLowerCase() === statusFilter;
            })
            .filter(post => this.matchesNewsFeedDateRange(post, dateFrom, dateTo))
            .filter(post => {
                if (!courseId) return true;
                const courseIds = this.normalizeNewsCourseIds(post.courseIds || []);
                return courseIds.includes(courseId);
            })
            .sort((left, right) => {
                if (Boolean(right.pinned) !== Boolean(left.pinned)) return right.pinned ? 1 : -1;
                const rightPriority = ['critical', 'important', 'standard'].indexOf(String(right.priority || 'standard').toLowerCase());
                const leftPriority = ['critical', 'important', 'standard'].indexOf(String(left.priority || 'standard').toLowerCase());
                if (rightPriority !== leftPriority) return rightPriority - leftPriority;
                return String(right.publishedAt || right.updatedAt || right.createdAt || '').localeCompare(String(left.publishedAt || left.updatedAt || left.createdAt || ''));
            });
        if (featuredOnly && limit > 0) {
            const featured = items.filter(post => post.pinned || ['important', 'critical'].includes(String(post.priority || '').toLowerCase()));
            const rest = items.filter(post => !featured.includes(post));
            items = [...featured, ...rest].slice(0, limit);
        } else if (limit > 0) {
            items = items.slice(0, limit);
        }
        // Index once per feed pass — avoid O(posts × replies) in decorateNewsPost.
        const repliesByPostId = this.indexNewsRepliesByPostId();
        items = items.map(post => this.decorateNewsPost(post, viewerUserId, repliesByPostId));
        // Lean feed: news.js / news-home.js only consume items, sections, sectionCatalog.
        // Privileges come from session account helpers, not this payload.
        return {
            items,
            sections: this.getNewsSectionsForViewer(viewerUserId),
            sectionCatalog: this.getNewsSectionCatalog()
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
        const typography = this.normalizeNewsTypography(payload);
        const post = {
            id: String(payload.id || makeId('news')).trim(),
            title,
            body,
            excerpt: String(payload.excerpt || body.slice(0, 220)).trim(),
            titleFontSize: typography.titleFontSize,
            bodyFontSize: typography.bodyFontSize,
            excerptFontSize: typography.excerptFontSize,
            sectionKey: this.normalizeNewsSectionKey(payload.sectionKey || sectionLabel),
            sectionLabel,
            audienceRoles: this.normalizeNewsRoleTargets(payload.audienceRoles || payload.targetRoles || []),
            audienceFacultyCodes: this.normalizeNewsFacultyTargets(payload.audienceFacultyCodes || payload.targetFacultyCodes || []),
            targetUserIds: uniqueStrings(asArray(payload.targetUserIds).map(value => String(value || '').trim()).filter(Boolean)),
            courseIds: this.normalizeNewsCourseIds(payload.courseIds || []),
            programCode: String(payload.programCode || '').trim().toUpperCase(),
            replyMode: normalizeNewsReplyMode(payload.replyMode, payload.allowReplies),
            pinned: Boolean(payload.pinned),
            priority: String(payload.priority || 'standard').trim().toLowerCase() || 'standard',
            heroTone: String(payload.heroTone || 'ink').trim().toLowerCase() || 'ink',
            status,
            publishAt: String(payload.publishAt || now).trim(),
            expiresAt: String(payload.expiresAt || '').trim(),
            attachments: this.normalizeNewsAttachments(payload, normalizedActorId),
            createdById: normalizedActorId,
            createdByName: actor?.displayName || actor?.nameEn || actor?.name || normalizedActorId,
            createdAt: now,
            updatedAt: now,
            publishedAt: status === 'published' ? String(payload.publishAt || now).trim() : ''
        };
        post.allowReplies = post.replyMode !== 'none';
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
        // Truly partial PATCH: only touch fields that are explicitly present.
        if (payload.title !== undefined) {
            const nextTitle = String(payload.title || '').trim();
            // Soft-archive: keep the real title; ignore legacy [deleted] mangling from clients.
            if (nextTitle !== '[deleted]') post.title = nextTitle;
        }
        if (payload.body !== undefined) post.body = String(payload.body || '').trim();
        if (payload.excerpt !== undefined) {
            post.excerpt = String(payload.excerpt || '').trim();
        } else if (payload.body !== undefined && !String(post.excerpt || '').trim()) {
            post.excerpt = String(post.body || '').slice(0, 220).trim();
        }
        if (
            payload.titleFontSize !== undefined
            || payload.bodyFontSize !== undefined
            || payload.excerptFontSize !== undefined
        ) {
            const typography = this.normalizeNewsTypography({
                titleFontSize: payload.titleFontSize !== undefined ? payload.titleFontSize : post.titleFontSize,
                bodyFontSize: payload.bodyFontSize !== undefined ? payload.bodyFontSize : post.bodyFontSize,
                excerptFontSize: payload.excerptFontSize !== undefined ? payload.excerptFontSize : post.excerptFontSize
            });
            post.titleFontSize = typography.titleFontSize;
            post.bodyFontSize = typography.bodyFontSize;
            post.excerptFontSize = typography.excerptFontSize;
        }
        if (payload.sectionLabel !== undefined || payload.section !== undefined) {
            post.sectionLabel = String(payload.sectionLabel || payload.section || post.sectionLabel || 'General').trim() || 'General';
        }
        if (payload.sectionKey !== undefined || payload.sectionLabel !== undefined || payload.section !== undefined) {
            post.sectionKey = this.normalizeNewsSectionKey(
                payload.sectionKey !== undefined ? payload.sectionKey : post.sectionLabel
            );
        }
        if (payload.audienceRoles !== undefined || payload.targetRoles !== undefined) {
            post.audienceRoles = this.normalizeNewsRoleTargets(payload.audienceRoles || payload.targetRoles || []);
        }
        if (payload.audienceFacultyCodes !== undefined || payload.targetFacultyCodes !== undefined) {
            post.audienceFacultyCodes = this.normalizeNewsFacultyTargets(
                payload.audienceFacultyCodes || payload.targetFacultyCodes || []
            );
        }
        if (payload.targetUserIds !== undefined) {
            post.targetUserIds = uniqueStrings(asArray(payload.targetUserIds).map(value => String(value || '').trim()).filter(Boolean));
        }
        if (payload.courseIds !== undefined) {
            post.courseIds = this.normalizeNewsCourseIds(payload.courseIds || []);
        }
        if (payload.programCode !== undefined) {
            post.programCode = String(payload.programCode || '').trim().toUpperCase();
        }
        if (payload.replyMode !== undefined || payload.allowReplies !== undefined) {
            post.replyMode = normalizeNewsReplyMode(
                payload.replyMode !== undefined ? payload.replyMode : post.replyMode,
                payload.allowReplies !== undefined ? payload.allowReplies : post.allowReplies
            );
        } else if (!post.replyMode) {
            post.replyMode = normalizeNewsReplyMode('', post.allowReplies);
        }
        post.allowReplies = post.replyMode !== 'none';
        if (payload.pinned !== undefined) post.pinned = Boolean(payload.pinned);
        if (payload.priority !== undefined) {
            post.priority = String(payload.priority || 'standard').trim().toLowerCase() || 'standard';
        }
        if (payload.heroTone !== undefined) {
            post.heroTone = String(payload.heroTone || 'ink').trim().toLowerCase() || 'ink';
        }
        if (payload.status !== undefined) {
            post.status = String(payload.status || 'published').trim().toLowerCase() || 'published';
        }
        if (payload.publishAt !== undefined) {
            post.publishAt = String(payload.publishAt || '').trim();
        }
        if (payload.expiresAt !== undefined) {
            post.expiresAt = String(payload.expiresAt || '').trim();
        }
        if (payload.attachments !== undefined) {
            post.attachments = this.normalizeNewsAttachments(payload, normalizedActorId);
        } else if (!Array.isArray(post.attachments)) {
            post.attachments = [];
        }
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
        const visibility = normalizeNewsReplyVisibility(payload.visibility);
        if (!postAllowsNewsReplyVisibility(post, visibility)) {
            return { error: visibility === 'public' ? 'Public comments are disabled for this news post.' : 'Private comments are disabled for this news post.', status: 409 };
        }
        const body = String(payload.body || '').trim();
        if (!body) return { error: 'Reply text is required.', status: 400 };
        const parentReplyId = String(payload.parentReplyId || payload.replyToReplyId || '').trim();
        const allReplies = this.ensureNewsState().replies;
        if (parentReplyId) {
            const parentReply = allReplies.find(r => String(r.id || '') === parentReplyId && String(r.postId || '') === String(post.id || ''));
            if (!parentReply) return { error: 'Parent reply was not found.', status: 404 };
            if (normalizeNewsReplyVisibility(parentReply.visibility) !== visibility) {
                return { error: 'Replies must stay in the same conversation channel.', status: 409 };
            }
        }
        const author = this.getAccountById(normalizedActorId);
        const reply = {
            id: makeId('news_reply'),
            postId: post.id,
            parentReplyId: parentReplyId || null,
            authorUserId: normalizedActorId,
            authorName: author?.displayName || author?.nameEn || author?.name || normalizedActorId,
            body,
            visibility,
            reactions: {},
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        this.ensureNewsState().replies.unshift(reply);
        const notifyIds = new Set();
        this.resolveNewsRecipients(post)
            .filter(account => this.canModerateNewsReplies(account.id))
            .forEach(account => notifyIds.add(account.id));
        if (visibility === 'public') {
            const authorId = String(post.createdById || '').trim();
            if (authorId && authorId !== normalizedActorId) notifyIds.add(authorId);
        }
        notifyIds.forEach((recipientUserId) => {
            this.createNotification({
                recipientUserId,
                sourceDomain: 'news',
                type: 'news-reply',
                title: visibility === 'public' ? `Public comment on ${post.title}` : `Private comment on ${post.title}`,
                body: visibility === 'public'
                    ? `${reply.authorName} commented on a university update.`
                    : `${reply.authorName} sent a private response to a university update.`,
                routePage: 'news',
                routeData: { postId: post.id }
            });
        });
        this.save();
        return this.decorateNewsPost(post, normalizedActorId);
    }

    toggleNewsReplyReaction(postId, replyId, reactionType = 'like', actorId = '') {
        const normalizedActorId = String(actorId || '').trim();
        const type = String(reactionType || 'like').trim().toLowerCase() || 'like';
        const post = this.ensureNewsState().posts.find(item => String(item.id || '') === String(postId || ''));
        if (!post) return { error: 'News post was not found.', status: 404 };
        if (!normalizedActorId) return { error: 'Sign in to react to replies.', status: 401 };
        if (!this.canViewNewsPost(post, normalizedActorId)) return { error: 'This news post is not visible to your account.', status: 403 };
        const reply = this.ensureNewsState().replies.find(r => String(r.id || '') === String(replyId || '') && String(r.postId || '') === String(post.id || ''));
        if (!reply) return { error: 'Reply was not found.', status: 404 };
        if (!this.canViewNewsReply(reply, post, normalizedActorId)) {
            return { error: 'This reply is not visible to your account.', status: 403 };
        }
        reply.reactions = reply.reactions || {};
        if (reply.reactions[normalizedActorId] === type) delete reply.reactions[normalizedActorId];
        else reply.reactions[normalizedActorId] = type;
        reply.updatedAt = nowIso();
        this.save();
        return this.decorateNewsPost(post, normalizedActorId);
    }

    deleteNewsReply(postId, replyId, actorId = '') {
        const normalizedActorId = String(actorId || '').trim();
        const post = this.ensureNewsState().posts.find(item => String(item.id || '') === String(postId || ''));
        if (!post) return { error: 'News post was not found.', status: 404 };
        if (!normalizedActorId) return { error: 'Sign in to delete replies.', status: 401 };
        const store = this.ensureNewsState();
        const target = store.replies.find(r => String(r.id || '') === String(replyId || '') && String(r.postId || '') === String(post.id || ''));
        if (!target) return { error: 'Reply was not found.', status: 404 };
        const managerView = this.canModerateNewsReplies(normalizedActorId);
        if (String(target.authorUserId || '') !== normalizedActorId && !managerView) {
            return { error: 'You can only delete your own replies.', status: 403 };
        }
        const removeIds = new Set([String(target.id)]);
        let changed = true;
        while (changed) {
            changed = false;
            store.replies.forEach(r => {
                const pid = String(r.parentReplyId || '');
                if (pid && removeIds.has(pid) && !removeIds.has(String(r.id))) {
                    removeIds.add(String(r.id));
                    changed = true;
                }
            });
        }
        store.replies = store.replies.filter(r => !removeIds.has(String(r.id)));
        this.save();
        return this.decorateNewsPost(post, normalizedActorId);
    }

    reportNewsReply(postId, replyId, actorId = '', reason = '') {
        const normalizedActorId = String(actorId || '').trim();
        const post = this.ensureNewsState().posts.find(item => String(item.id || '') === String(postId || ''));
        if (!post) return { error: 'News post was not found.', status: 404 };
        if (!normalizedActorId) return { error: 'Sign in to report replies.', status: 401 };
        const reply = this.ensureNewsState().replies.find(r => String(r.id || '') === String(replyId || '') && String(r.postId || '') === String(post.id || ''));
        if (!reply) return { error: 'Reply was not found.', status: 404 };
        if (!this.canViewNewsReply(reply, post, normalizedActorId)) {
            return { error: 'This reply is not visible to your account.', status: 403 };
        }
        const reasonText = String(reason || '').trim();
        this.resolveNewsRecipients(post)
            .filter(account => this.canModerateNewsReplies(account.id))
            .forEach(account => {
                this.createNotification({
                    recipientUserId: account.id,
                    sourceDomain: 'news',
                    type: 'news-reply-report',
                    title: `Reported reply on ${post.title}`,
                    body: `${reply.authorName}'s reply was reported${reasonText ? `: ${reasonText}` : '.'}`,
                    routePage: 'news',
                    routeData: { postId: post.id, replyId: reply.id }
                });
            });
        return { ok: true };
    }

    addAuditEvent(payload = {}, options = {}) {
        return addAuditEvent.call(this, payload, options);
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

    adoptUploadFileFromDisk(fileId = '', options = {}) {
        return adoptUploadFileFromDisk.call(this, fileId, options);
    }

    listUnindexedBackgroundGalleryDiskFileIds() {
        return listUnindexedBackgroundGalleryDiskFileIds.call(this);
    }

    getFile(fileId) {
        return getFile.call(this, fileId);
    }

    healAllStoredFilePaths() {
        return healAllStoredFilePaths.call(this);
    }

    objectContainsStoredFileReference(value, fileId, visited = new WeakSet()) {
        return objectContainsStoredFileReference.call(this, value, fileId, visited);
    }

    canActorAccessStoredFile(fileId, actorUserId = '', actorRole = '') {
        return canActorAccessStoredFile.call(this, fileId, actorUserId, actorRole);
    }

    createPortalBootstrap(options = {}) {
        const viewerUserId = String(options.viewerUserId || '').trim();
        const effectiveRole = String(options.effectiveRole || '').trim().toLowerCase();
        const actualRole = String(options.actualRole || effectiveRole || '').trim().toLowerCase();
        const unscopedAdmin = actualRole === 'admin' && effectiveRole === 'admin';
        const portalState = clone(this.state.portal.state || {});
        delete portalState.studentServiceArticles;
        const liveQuizWorkspaces = Object.entries(this.state.portal.liveQuizWorkspaces || {}).reduce((accumulator, [key, workspace]) => {
            const courseId = String(key || '').split('::')[0].trim();
            const canView = !viewerUserId
                || unscopedAdmin
                || (['professor', 'ta'].includes(effectiveRole)
                    && this.canAccessGradebookCourse(courseId, viewerUserId, effectiveRole, 'read'))
                || (effectiveRole === 'student'
                    && this.getStudentEnrollmentsByCourse(courseId)
                        .some(enrollment => String(enrollment?.studentId || '').trim() === viewerUserId));
            if (!canView) return accumulator;
            const normalized = clone(workspace || {}) || {};
            if (normalized && typeof normalized === 'object') {
                delete normalized.ui;
                if (viewerUserId && !unscopedAdmin && effectiveRole === 'student') {
                    normalized.sessions = Array.isArray(normalized.sessions)
                        ? normalized.sessions.map(session => ({
                            ...session,
                            questions: Array.isArray(session?.questions)
                                ? session.questions.map(question => {
                                    const safeQuestion = { ...question };
                                    delete safeQuestion.correctOption;
                                    delete safeQuestion.expectedAnswer;
                                    return safeQuestion;
                                })
                                : [],
                            participants: session?.participants && typeof session.participants === 'object'
                                ? Object.fromEntries(
                                    Object.entries(session.participants)
                                        .filter(([participantId]) => String(participantId || '').trim() === viewerUserId)
                                )
                                : {}
                        }))
                        : [];
                }
            }
            accumulator[key] = normalized;
            return accumulator;
        }, {});
        portalState.lmsLiveQuizzes = liveQuizWorkspaces;
        // Staff need the active student IDs for the LMS groups they can access,
        // while ordinary student bootstrap must remain limited to that student's
        // own schedule. This projection avoids exposing every student's full
        // schedule and lets LMS rosters stay server-authoritative.
        if (viewerUserId && (unscopedAdmin || ['professor', 'ta'].includes(effectiveRole))) {
            const rosterByCourse = {};
            const schedulesByStudent = this.state.portal.state?.studentSchedulesByStudent;
            Object.entries(schedulesByStudent && typeof schedulesByStudent === 'object' ? schedulesByStudent : {}).forEach(([studentId, schedule]) => {
                if (!this.isSocialEligibleAccount(studentId)) return;
                const entries = Array.isArray(schedule)
                    ? schedule
                    : schedule && typeof schedule === 'object'
                        ? Object.entries(schedule).map(([courseId, groupId]) => ({ courseId, groupId }))
                        : [];
                entries.forEach((entry) => {
                    const courseId = String(entry?.courseId || entry?.sourceCourseId || '').trim();
                    const groupId = String(entry?.groupId || entry?.groupName || '').trim();
                    if (!courseId || !groupId) return;
                    if (!unscopedAdmin && !this.canAccessGradebookCourse(courseId, viewerUserId, effectiveRole, 'read')) return;
                    const key = `${courseId}::${groupId}`;
                    rosterByCourse[key] = Array.isArray(rosterByCourse[key]) ? rosterByCourse[key] : [];
                    if (!rosterByCourse[key].includes(studentId)) rosterByCourse[key].push(studentId);
                });
            });
            portalState.lmsGroupRosterStudentIds = rosterByCourse;
        }
        if (viewerUserId && !unscopedAdmin) {
            [
                ...PORTAL_GLOBAL_ADMIN_ONLY_KEYS
            ].filter(key => !PORTAL_PUBLIC_ACADEMIC_BOOTSTRAP_KEYS.has(key))
                .concat('studentGrades')
                .forEach(key => delete portalState[key]);
            PORTAL_STUDENT_KEYED_STATE_KEYS.forEach((key) => {
                if (!portalState[key] || typeof portalState[key] !== 'object') return;
                portalState[key] = Object.prototype.hasOwnProperty.call(portalState[key], viewerUserId)
                    ? { [viewerUserId]: portalState[key][viewerUserId] }
                    : {};
            });
            const incomingGrades = this.state.portal.state?.studentGrades;
            if (incomingGrades && typeof incomingGrades === 'object') {
                const scopedGrades = {};
                Object.entries(incomingGrades).forEach(([rosterKey, roster]) => {
                    const canReadRoster = effectiveRole === 'student'
                        ? Array.isArray(roster) && roster.some(student => String(student?.id || '').trim() === viewerUserId)
                        : this.canAccessGradebookCourse(rosterKey, viewerUserId, effectiveRole, 'read');
                    if (!canReadRoster) return;
                    scopedGrades[rosterKey] = effectiveRole === 'student'
                        ? roster.filter(student => String(student?.id || '').trim() === viewerUserId)
                        : clone(roster);
                });
                portalState.studentGrades = scopedGrades;
            }
        }
        return {
            state: portalState,
            meta: clone(this.state.portal.meta || {}),
            social: viewerUserId && !unscopedAdmin
                ? this.getSocialBootstrap(viewerUserId)
                : clone(this.state.social || {}),
            accounts: viewerUserId && !unscopedAdmin
                ? [this.sanitizeAccountForClient(this.state.accounts[viewerUserId])].filter(Boolean)
                : Object.values(this.state.accounts).map(account => this.sanitizeAccountForClient(account))
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
        const session = token ? this.getSession(token) : null;
        const account = session ? this.getAccountById(session.userId) : null;
        const effectiveRole = session
            ? (String(session.actualRole || '').trim().toLowerCase() === 'admin' && session.impersonatedRole
                ? String(session.impersonatedRole || '').trim().toLowerCase()
                : String(session.actualRole || '').trim().toLowerCase())
            : '';
        const bootstrap = this.createPortalBootstrap({
            viewerUserId: account?.id || '',
            effectiveRole,
            actualRole: session?.actualRole || account?.role || ''
        });
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

    savePortalState(nextState, options = {}) {
        const existingState = this.state.portal.state && typeof this.state.portal.state === 'object'
            ? this.state.portal.state
            : {};
        const sanitizedIncoming = sanitizePortalStateForServer(nextState);
        if (Object.prototype.hasOwnProperty.call(sanitizedIncoming, 'adminLibrary')) {
            assertValidAdminLibraryPortalState(sanitizedIncoming.adminLibrary);
        }
        if (sanitizedIncoming.messages && typeof sanitizedIncoming.messages === 'object') {
            sanitizedIncoming.messages = sanitizeLmsInteractionMessagesForServer(
                sanitizedIncoming.messages,
                existingState.messages || {},
                options
            );
        }
        const actorUserId = String(options.actorUserId || '').trim();
        const allowGlobalWrite = options.allowGlobalWrite === true;
        const effectiveRole = String(options.effectiveRole || '').trim().toLowerCase();
        const droppedKeys = [];
        if (allowGlobalWrite || actorUserId) {
            this.state.portal.state = mergeIncomingPortalState(existingState, sanitizedIncoming, {
                actorUserId,
                allowGlobalWrite,
                effectiveRole,
                droppedKeys,
                canWriteStudentGradesRoster: (rosterKey) => (
                    allowGlobalWrite
                    || effectiveRole === 'admin'
                    || (
                        typeof this.canAccessGradebookCourse === 'function'
                        && this.canAccessGradebookCourse(rosterKey, actorUserId, effectiveRole, 'score')
                    )
                )
            });
        } else {
            // Never let an unauthenticated/actorless state write replace the
            // server snapshot. The old spread fallback allowed an early stale
            // browser save to erase availableGroups before bootstrap completed.
            this.state.portal.state = mergeIncomingPortalState(existingState, sanitizedIncoming, {
                actorUserId: '',
                allowGlobalWrite: false,
                effectiveRole: '',
                droppedKeys
            });
        }
        const incomingMeta = sanitizedIncoming.meta && typeof sanitizedIncoming.meta === 'object'
            ? sanitizedIncoming.meta
            : {};
        this.state.portal.meta = this.state.portal.meta && typeof this.state.portal.meta === 'object'
            ? this.state.portal.meta
            : {};
        const savedAt = incomingMeta.portalStateSavedAt || nowIso();
        this.state.portal.meta.portalStateSavedAt = savedAt;
        if (incomingMeta.registrationCmsRevision != null) {
            this.state.portal.meta.registrationCmsRevision = incomingMeta.registrationCmsRevision;
        }
        this.savePortal();
        const snapshot = this.createPortalStateSaveSnapshot();
        snapshot.droppedKeys = Array.from(new Set(droppedKeys));
        return snapshot;
    }

    createPortalStateSaveSnapshot() {
        const portalState = clone(this.state.portal.state || {});
        portalState.lmsLiveQuizzes = Object.entries(this.state.portal.liveQuizWorkspaces || {}).reduce((accumulator, [key, workspace]) => {
            const normalized = clone(workspace || {}) || {};
            if (normalized && typeof normalized === 'object') {
                delete normalized.ui;
            }
            accumulator[key] = normalized;
            return accumulator;
        }, {});
        return {
            state: portalState,
            meta: clone(this.state.portal.meta || {})
        };
    }


    getLmsLiveQuizWorkspace(resourceKey = '') {
        const key = String(resourceKey || '').trim();
        if (!key) return null;
        this.state.portal.liveQuizWorkspaces = this.state.portal.liveQuizWorkspaces && typeof this.state.portal.liveQuizWorkspaces === 'object'
            ? this.state.portal.liveQuizWorkspaces
            : {};
        let workspace = clone(this.state.portal.liveQuizWorkspaces[key] || null);
        if (!workspace) {
            const parts = key.split('::');
            const targetCourse = String(parts.shift() || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
            const targetGroup = String(parts.join('::') || '').replace(/__lmssec_[^:]+$/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
            const aliases = Object.entries(this.state.portal.liveQuizWorkspaces)
                .filter(([candidateKey]) => {
                    const candidateParts = String(candidateKey || '').split('::');
                    const candidateCourse = String(candidateParts.shift() || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
                    const candidateGroup = String(candidateParts.join('::') || '').replace(/__lmssec_[^:]+$/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
                    return candidateCourse === targetCourse && candidateGroup === targetGroup;
                })
                .sort(([, left], [, right]) => String(right?.updatedAt || '').localeCompare(String(left?.updatedAt || '')));
            workspace = clone(aliases[0]?.[1] || null);
        }
        if (workspace && typeof workspace === 'object') {
            delete workspace.ui;
        }
        return workspace;
    }

    saveLmsLiveQuizWorkspace(resourceKey = '', workspace = {}) {
        const key = String(resourceKey || '').trim();
        if (!key) return null;
        this.state.portal.liveQuizWorkspaces = this.state.portal.liveQuizWorkspaces && typeof this.state.portal.liveQuizWorkspaces === 'object'
            ? this.state.portal.liveQuizWorkspaces
            : {};
        const nextWorkspace = clone(workspace && typeof workspace === 'object' ? workspace : {}) || {};
        delete nextWorkspace.ui;
        nextWorkspace.updatedAt = nowIso();
        this.state.portal.liveQuizWorkspaces[key] = nextWorkspace;
        this.save();
        return clone(nextWorkspace);
    }

    getLmsWhiteboardWorkspace(resourceKey = '') {
        const key = String(resourceKey || '').trim();
        if (!key) return null;
        this.state.portal.whiteboardWorkspaces = this.state.portal.whiteboardWorkspaces && typeof this.state.portal.whiteboardWorkspaces === 'object'
            ? this.state.portal.whiteboardWorkspaces
            : {};
        const workspace = clone(this.state.portal.whiteboardWorkspaces[key] || null);
        if (workspace && typeof workspace === 'object') {
            delete workspace.ui;
        }
        return workspace;
    }

    saveLmsWhiteboardWorkspace(resourceKey = '', workspace = {}) {
        const key = String(resourceKey || '').trim();
        if (!key) return null;
        this.state.portal.whiteboardWorkspaces = this.state.portal.whiteboardWorkspaces && typeof this.state.portal.whiteboardWorkspaces === 'object'
            ? this.state.portal.whiteboardWorkspaces
            : {};
        const nextWorkspace = clone(workspace && typeof workspace === 'object' ? workspace : {}) || {};
        delete nextWorkspace.ui;
        nextWorkspace.updatedAt = nowIso();
        this.state.portal.whiteboardWorkspaces[key] = nextWorkspace;
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

    getActiveLmsGroupRoster(courseId = '', groupId = '') {
        const normalizedCourseId = String(courseId || '').trim();
        const normalizedGroupId = String(groupId || '').trim();
        if (!normalizedCourseId || !normalizedGroupId) return [];
        const availableGroups = this.state.portal?.state?.availableGroups || {};
        const groups = availableGroups[normalizedCourseId]
            || Object.entries(availableGroups).find(([key]) => String(key).trim().toLowerCase() === normalizedCourseId.toLowerCase())?.[1]
            || [];
        const group = asArray(groups).find(item => String(item?.id || item?.groupId || item?.name || '').trim().toLowerCase() === normalizedGroupId.toLowerCase());
        if (!group) return [];
        const members = [];
        const addActive = (id, role) => {
            const normalizedId = String(id || '').trim();
            if (!normalizedId || members.includes(normalizedId)) return;
            const account = this.getAccountById(normalizedId);
            if (!account || String(account.role || '').trim().toLowerCase() !== role) return;
            if (!this.isSocialEligibleAccount(normalizedId)) return;
            members.push(normalizedId);
        };
        addActive(group.profId, 'professor');
        [...asArray(group.taIds), group.taId].forEach(id => addActive(id, 'ta'));
        const schedulesByStudent = this.state.portal?.state?.studentSchedulesByStudent || {};
        Object.entries(schedulesByStudent && typeof schedulesByStudent === 'object' ? schedulesByStudent : {}).forEach(([studentId, schedule]) => {
            const entries = Array.isArray(schedule)
                ? schedule
                : schedule && typeof schedule === 'object'
                    ? Object.entries(schedule).map(([courseKey, groupKey]) => ({ courseId: courseKey, groupId: groupKey }))
                    : [];
            if (entries.some(entry => (
                String(entry?.courseId || entry?.sourceCourseId || '').trim().toLowerCase() === normalizedCourseId.toLowerCase()
                && String(entry?.groupId || entry?.groupName || '').trim().toLowerCase() === normalizedGroupId.toLowerCase()
            ))) addActive(studentId, 'student');
        });
        return members;
    }

    ensureLmsGroupChat(chatId, actorUserId) {
        const normalizedChatId = String(chatId || '').trim();
        const prefix = 'lms-group::';
        if (!normalizedChatId.toLowerCase().startsWith(prefix)) return null;
        const [courseId, groupId] = normalizedChatId.slice(prefix.length).split('::');
        const members = this.getActiveLmsGroupRoster(courseId, groupId);
        const normalizedActorId = String(actorUserId || '').trim();
        if (!members.includes(normalizedActorId)) return null;
        const existing = this.state.chats[normalizedChatId];
        const chat = this.ensureChatBase({
            id: normalizedChatId,
            type: 'group',
            members,
            name: existing?.name || `${groupId || 'Class'} Class Chat`,
            createdBy: existing?.createdBy || normalizedActorId,
            createdAt: existing?.createdAt || nowIso()
        });
        chat.members = members;
        chat.type = 'group';
        return chat;
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

    repairSocialGroupChatMembership(chatId, userId) {
        const normalizedChatId = String(chatId || '').trim();
        const normalizedUserId = String(userId || '').trim();
        const match = normalizedChatId.match(/^portal-group::social::(.+)$/);
        if (!match || !normalizedUserId) return false;
        const group = this.getSocialGroupRecord(match[1]);
        if (!group || !this.canViewSocialGroup(group, normalizedUserId)) return false;
        const members = uniqueStrings([...this.getSocialGroupMemberIds(group), normalizedUserId]);
        this.ensureChatBase({
            id: normalizedChatId,
            type: 'group',
            members,
            name: String(group.name || 'Social group').trim(),
            groupId: String(group.id || '').trim(),
            avatarImage: String(group.avatarImage || '').trim(),
            bannerImage: String(group.bannerImage || '').trim(),
            createdBy: String(group.ownerUserId || normalizedUserId || members[0] || '').trim(),
            createdAt: String(group.createdAt || nowIso())
        });
        group.chatId = normalizedChatId;
        this.save();
        return true;
    }

    markChatMessagesRead(chatId, userId) {
        const normalizedChatId = String(chatId || '').trim();
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedChatId || !normalizedUserId) return null;
        let chat = this.state.chats[normalizedChatId];
        if (!chat || !asArray(chat.members).includes(normalizedUserId)) {
            if (this.repairSocialGroupChatMembership(normalizedChatId, normalizedUserId)) {
                chat = this.state.chats[normalizedChatId];
            }
        }
        if (!chat || !asArray(chat.members).includes(normalizedUserId)) return null;
        let changed = false;
        const now = nowIso();
        chat.messages = asArray(chat.messages).map((message) => {
            if (String(message?.senderId || '').trim() === normalizedUserId) return message;
            const seenBy = uniqueStrings([...asArray(message?.seenBy), normalizedUserId]);
            if (seenBy.length === asArray(message?.seenBy).length) return message;
            changed = true;
            return {
                ...message,
                seenBy,
                seenAtByUser: {
                    ...(message?.seenAtByUser && typeof message.seenAtByUser === 'object' ? message.seenAtByUser : {}),
                    [normalizedUserId]: now
                }
            };
        });
        chat.hiddenByUser = chat.hiddenByUser && typeof chat.hiddenByUser === 'object' ? chat.hiddenByUser : {};
        if (chat.hiddenByUser[normalizedUserId]) {
            delete chat.hiddenByUser[normalizedUserId];
            changed = true;
        }
        if (changed) {
            chat.updatedAt = now;
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

    enrichStoredFileReference(fileRef) {
        return enrichStoredFileReference.call(this, fileRef);
    }

    appendMessage(payload = {}) {
        const chatId = String(payload.chatId || '').trim();
        const senderId = String(payload.senderId || '').trim();
        if (!chatId || !senderId) return null;
        let chat = this.state.chats[chatId];
        if (String(chatId).toLowerCase().startsWith('lms-group::')) {
            chat = this.ensureLmsGroupChat(chatId, senderId);
        }
        if (!chat || !asArray(chat.members).includes(senderId)) return null;
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
    toggleSocialModulePin(module, entityId, kind = 'personal', actorId = '') { return toggleSocialModulePin.call(this, module, entityId, kind, actorId); }
    listModulePinnedIds(module, viewerId = '', kind = 'all') { return listModulePinnedIds.call(this, module, viewerId, kind); }
    getSocialPinBootstrap(viewerUserId = '') { return getSocialPinBootstrap.call(this, viewerUserId); }
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
    canEditSocialEvent(event, userId) { return canEditSocialEvent.call(this, event, userId); }
    canManageSocialEventEditors(event, userId) { return canManageSocialEventEditors.call(this, event, userId); }
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

    setSocialProjectBaseline(projectId, actorId = '') {
        return setSocialProjectBaseline.call(this, projectId, actorId);
    }

    createSocialProjectTask(projectId, payload = {}, actorId = '') {
        return createSocialProjectTask.call(this, projectId, payload, actorId);
    }

    updateSocialProjectTask(projectId, taskId, payload = {}, actorId = '') {
        return updateSocialProjectTask.call(this, projectId, taskId, payload, actorId);
    }

    updateSocialProjectTaskGraph(projectId, payload = {}, actorId = '') {
        return updateSocialProjectTaskGraph.call(this, projectId, payload, actorId);
    }

    deleteSocialProjectTask(projectId, taskId, actorId = '') {
        return deleteSocialProjectTask.call(this, projectId, taskId, actorId);
    }

    createSocialProjectBudgetCategory(projectId, payload = {}, actorId = '') {
        return createSocialProjectBudgetCategory.call(this, projectId, payload, actorId);
    }

    updateSocialProjectBudgetCategory(projectId, categoryId, payload = {}, actorId = '') {
        return updateSocialProjectBudgetCategory.call(this, projectId, categoryId, payload, actorId);
    }

    deleteSocialProjectBudgetCategory(projectId, categoryId, actorId = '') {
        return deleteSocialProjectBudgetCategory.call(this, projectId, categoryId, actorId);
    }

    createSocialProjectBudgetExpense(projectId, payload = {}, actorId = '') {
        return createSocialProjectBudgetExpense.call(this, projectId, payload, actorId);
    }

    updateSocialProjectBudgetExpense(projectId, expenseId, payload = {}, actorId = '') {
        return updateSocialProjectBudgetExpense.call(this, projectId, expenseId, payload, actorId);
    }

    deleteSocialProjectBudgetExpense(projectId, expenseId, actorId = '') {
        return deleteSocialProjectBudgetExpense.call(this, projectId, expenseId, actorId);
    }

    createSocialProjectRisk(projectId, payload = {}, actorId = '') {
        return createSocialProjectRisk.call(this, projectId, payload, actorId);
    }

    updateSocialProjectRisk(projectId, riskId, payload = {}, actorId = '') {
        return updateSocialProjectRisk.call(this, projectId, riskId, payload, actorId);
    }

    deleteSocialProjectRisk(projectId, riskId, actorId = '') {
        return deleteSocialProjectRisk.call(this, projectId, riskId, actorId);
    }

    createSocialProjectShowcasePage(projectId, actorId = '') {
        return createSocialProjectShowcasePage.call(this, projectId, actorId);
    }

    decoratePortfolio(portfolio, viewerUserId = '') {
        return decoratePortfolio.call(this, portfolio, viewerUserId);
    }

    getPortfolioForUser(userId, viewerUserId = '') {
        const portfolio = getOrCreatePortfolio.call(this, userId);
        if (!portfolio) return null;
        const decorated = decoratePortfolio.call(this, portfolio, viewerUserId || userId);
        return decorated?.canView ? decorated : null;
    }

    savePortfolioForUser(userId, payload = {}, actorId = '') {
        return savePortfolio.call(this, userId, payload, actorId);
    }

    publishPortfolioForUser(userId, payload = {}, actorId = '') {
        return publishPortfolio.call(this, userId, payload, actorId);
    }

    unpublishPortfolioForUser(userId, actorId = '') {
        return unpublishPortfolio.call(this, userId, actorId);
    }

    listDiscoverablePortfolios(viewerUserId = '', filters = {}) {
        return listDiscoverablePortfolios.call(this, viewerUserId, filters);
    }

    addCustomPortfolioSection(userId, payload = {}, actorId = '') {
        return addCustomPortfolioSection.call(this, userId, payload, actorId);
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

    updateSocialEvent(eventId, payload = {}, actorId = '') { return updateSocialEvent.call(this, eventId, payload, actorId); }

    deleteSocialEvent(eventId, actorId = '') { return deleteSocialEvent.call(this, eventId, actorId); }

    listSocialEvents(filters = {}) { return listSocialEvents.call(this, filters); }

    closeExpiredSurveys() { return closeExpiredSurveys.call(this); }

    listSocialSurveys(filters = {}, viewerUserId = '') { return listSocialSurveys.call(this, filters, viewerUserId); }

    getSocialSurvey(surveyId, viewerUserId = '') { return getSocialSurvey.call(this, surveyId, viewerUserId); }

    createSocialSurvey(payload = {}, actorId = '') { return createSocialSurvey.call(this, payload, actorId); }

    closeSocialSurvey(surveyId, actorId = '') { return closeSocialSurvey.call(this, surveyId, actorId); }

    submitSocialSurveyResponse(surveyId, payload = {}, actorId = '') { return submitSocialSurveyResponse.call(this, surveyId, payload, actorId); }

    getSocialSurveyResults(surveyId, viewerUserId = '') { return getSocialSurveyResults.call(this, surveyId, viewerUserId); }

    deleteSocialSurvey(surveyId, actorId = '') { return deleteSocialSurvey.call(this, surveyId, actorId); }

    listSocialResearchPublications(filters = {}, viewerUserId = '') {
        return listSocialResearchPublications.call(this, filters, viewerUserId);
    }

    getSocialResearchPublication(publicationId, viewerUserId = '') {
        return getSocialResearchPublication.call(this, publicationId, viewerUserId);
    }

    createSocialResearchPublication(payload = {}, actorId = '') {
        return createSocialResearchPublication.call(this, payload, actorId);
    }

    updateSocialResearchPublication(publicationId, payload = {}, actorId = '') {
        return updateSocialResearchPublication.call(this, publicationId, payload, actorId);
    }

    toggleSocialResearchSave(publicationId, actorId = '') {
        return toggleSocialResearchSave.call(this, publicationId, actorId);
    }

    deleteSocialResearchPublication(publicationId, actorId = '') {
        return deleteSocialResearchPublication.call(this, publicationId, actorId);
    }

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

    getBackgroundGalleryCatalog() {
        return getBackgroundGalleryCatalog.call(this);
    }

    getBackgroundGalleryUserItems(userId = '') {
        return getBackgroundGalleryUserItems.call(this, userId);
    }

    reconcileOrphanBackgroundGalleryUserFiles(userId = '', actor = {}) {
        return reconcileOrphanBackgroundGalleryUserFiles.call(this, userId, actor);
    }

    uploadBackgroundGalleryAsset(payload = {}, actor = {}) {
        return uploadBackgroundGalleryAsset.call(this, payload, actor);
    }

    addBackgroundGalleryCatalogItem(payload = {}, actor = {}) {
        return addBackgroundGalleryCatalogItem.call(this, payload, actor);
    }

    removeBackgroundGalleryCatalogItem(itemId = '', actor = {}) {
        return removeBackgroundGalleryCatalogItem.call(this, itemId, actor);
    }

    addBackgroundGalleryUserItem(userId = '', payload = {}, actor = {}) {
        return addBackgroundGalleryUserItem.call(this, userId, payload, actor);
    }

    removeBackgroundGalleryUserItem(userId = '', itemId = '', actor = {}) {
        return removeBackgroundGalleryUserItem.call(this, userId, itemId, actor);
    }

    promoteBackgroundGalleryUserItem(payload = {}, actor = {}) {
        return promoteBackgroundGalleryUserItem.call(this, payload, actor);
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
    PlatformStore,
    getAdminLibraryPortalValidationError,
    ADMIN_LIBRARY_UI_ONLY_KEYS
};
