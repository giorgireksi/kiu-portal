const path = require('path');
const {
    asArray,
    buildPasswordHash,
    clone,
    displayInitials,
    makeId,
    normalizeCode,
    normalizeEmail,
    nowIso,
    safeNumber,
    safeReadJson,
    sanitizeAccount
} = require('./utils');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const LEGACY_STATE_PATH = path.join(ROOT_DIR, 'kiu-realtime-bridge', 'state.json');

const SEEDED_SYSTEMS = [
    { systemCode: 'identity', displayName: 'Microsoft Entra ID', ownerDomain: 'identity', syncMode: 'event-driven', isAuthoritative: true, enabled: true, status: 'ready' },
    { systemCode: 'sis', displayName: 'Student Information System', ownerDomain: 'student-records', syncMode: 'event-driven', isAuthoritative: true, enabled: false, status: 'disabled' },
    { systemCode: 'finance', displayName: 'Finance ERP', ownerDomain: 'finance', syncMode: 'scheduled', isAuthoritative: true, enabled: false, status: 'disabled' },
    { systemCode: 'hr', displayName: 'HR System', ownerDomain: 'workforce', syncMode: 'scheduled', isAuthoritative: true, enabled: false, status: 'disabled' },
    { systemCode: 'curriculum', displayName: 'Curriculum Service', ownerDomain: 'academic-catalog', syncMode: 'event-driven', isAuthoritative: true, enabled: false, status: 'disabled' },
    { systemCode: 'portal', displayName: 'KIU Portal Collaboration', ownerDomain: 'portal-collaboration', syncMode: 'local', isAuthoritative: true, enabled: true, status: 'ready' }
];

function createEmptySocialState() {
    return {
        profiles: {},
        relationships: [],
        pages: [],
        groups: [],
        projects: [],
        projectTasks: [],
        projectMilestones: [],
        projectDeliverables: [],
        projectCheckins: [],
        projectActivities: [],
        posts: [],
        stories: [],
        storyViews: [],
        reels: [],
        savedPosts: [],
        reports: [],
        blocks: [],
        muted: [],
        notifications: [],
        events: [],
        rsvps: [],
        migrationVersion: 3
    };
}

function createEmptyPlatformState() {
    return {
        meta: {
            version: 1,
            storageDriver: 'json',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            migratedFromLegacyAt: ''
        },
        accounts: {},
        authCredentials: {},
        people: {},
        sessions: {},
        faculties: {},
        programs: {},
        terms: {},
        courses: {},
        sections: {},
        enrollments: {},
        lmsCourses: {},
        gradebooks: {},
        files: {},
        chats: {},
        calls: {},
        notifications: {},
        notificationPreferences: {},
        serviceRequests: {},
        integrations: {
            systems: {},
            syncRuns: [],
            conflicts: []
        },
        audit: {
            events: []
        },
        social: createEmptySocialState(),
        importJobs: {},
        portal: {
            legacyState: null,
            meta: {},
            microsoft: {}
        }
    };
}

function normalizeLegacyUser(rawUser = {}, fallbackRole = 'student', fallbackFaculty = '') {
    const id = String(rawUser.id || '').trim();
    const email = normalizeEmail(rawUser.email || rawUser.microsoftEmail || '');
    if (!id || !email) return null;
    return {
        id,
        name: String(rawUser.name || '').trim(),
        nameEn: String(rawUser.nameEn || rawUser.name || '').trim(),
        displayName: String(rawUser.displayName || rawUser.nameEn || rawUser.name || email).trim(),
        email,
        role: String(rawUser.role || fallbackRole || 'student').trim().toLowerCase() || 'student',
        facultyCode: normalizeCode(rawUser.facultyCode || rawUser.faculty || fallbackFaculty || ''),
        avatar: String(rawUser.avatar || rawUser.photo || displayInitials(rawUser.nameEn || rawUser.name || email)).trim(),
        photo: String(rawUser.photo || rawUser.avatar || displayInitials(rawUser.nameEn || rawUser.name || email)).trim(),
        status: String(rawUser.status || 'Active').trim()
    };
}

function collectUsersFromPortalState(portalState = {}) {
    const users = {};
    asArray(portalState.users).forEach(user => {
        const normalized = normalizeLegacyUser(user);
        if (normalized) users[normalized.id] = normalized;
    });
    Object.entries(portalState.facultyProfiles || {}).forEach(([facultyCode, profile]) => {
        ['students', 'professors', 'tas'].forEach(groupKey => {
            asArray(profile?.[groupKey]).forEach(member => {
                const fallbackRole = groupKey === 'students' ? 'student' : groupKey === 'professors' ? 'professor' : 'ta';
                const normalized = normalizeLegacyUser(member, fallbackRole, facultyCode);
                if (normalized) users[normalized.id] = {
                    ...(users[normalized.id] || {}),
                    ...normalized
                };
            });
        });
    });
    return users;
}

function buildCoursesAndSections(portalState = {}, usersById = {}) {
    const courses = {};
    const sections = {};
    const terms = {};
    const rawSubjects = [];

    Object.entries(portalState.facultyProfiles || {}).forEach(([facultyCode, profile]) => {
        asArray(profile?.curriculum).forEach(subject => rawSubjects.push({ ...subject, faculty: subject.faculty || facultyCode }));
    });
    asArray(portalState.curriculum).forEach(subject => rawSubjects.push(subject));

    rawSubjects.forEach(subject => {
        const courseId = String(subject.id || subject.subjectId || '').trim();
        if (!courseId) return;
        const facultyCode = normalizeCode(subject.faculty || '');
        courses[courseId] = {
            id: courseId,
            code: String(subject.code || courseId).trim(),
            name: String(subject.name || subject.title || courseId).trim(),
            facultyCode,
            ects: safeNumber(subject.ects, 0),
            semester: safeNumber(subject.semester, 0),
            prerequisites: String(subject.cond || subject.prerequisites || 'None').trim(),
            antirequisites: String(subject.antireq || subject.antirequisites || 'None').trim(),
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
    });

    Object.entries(portalState.availableGroups || {}).forEach(([courseId, groups]) => {
        asArray(groups).forEach(group => {
            const groupId = String(group.id || group.name || '').trim();
            if (!groupId) return;
            const facultyCode = normalizeCode(group.faculty || courses[courseId]?.facultyCode || '');
            const semester = safeNumber(group.semester || courses[courseId]?.semester || portalState.activeSemester, 1);
            const termId = `${facultyCode || 'GEN'}-S${semester}`;
            if (!terms[termId]) {
                terms[termId] = {
                    id: termId,
                    name: `Semester ${semester}`,
                    facultyCode,
                    semester,
                    status: termId === `${facultyCode}-S${safeNumber(portalState.activeSemester, semester)}` ? 'active' : 'planned',
                    createdAt: nowIso(),
                    updatedAt: nowIso()
                };
            }
            const instructor = Object.values(usersById).find(user => {
                const candidates = [user.name, user.nameEn, user.email].map(value => String(value || '').trim().toLowerCase());
                return candidates.includes(String(group.prof || '').trim().toLowerCase());
            });
            const assistant = Object.values(usersById).find(user => {
                const candidates = [user.name, user.nameEn, user.email].map(value => String(value || '').trim().toLowerCase());
                return candidates.includes(String(group.ta || '').trim().toLowerCase());
            });
            const sectionId = `${courseId}::${groupId}`;
            sections[sectionId] = {
                id: sectionId,
                courseId,
                code: groupId,
                name: String(group.name || groupId).trim(),
                facultyCode,
                termId,
                sessionType: String(group.sessionType || group.classType || group.type || 'lecture').trim().toLowerCase(),
                seatsTotal: Math.max(0, safeNumber(group.capacity, 40)),
                seatsTaken: Math.max(0, safeNumber(group.registered, 0)),
                room: String(group.room || '').trim(),
                schedule: [{
                    day: String(group.day || '').trim(),
                    startTime: String(group.time || group.startTime || '').trim(),
                    endTime: String(group.endTime || '').trim(),
                    duration: String(group.duration || '').trim()
                }],
                professorId: instructor?.id || '',
                taIds: assistant?.id ? [assistant.id] : [],
                createdAt: nowIso(),
                updatedAt: nowIso()
            };
        });
    });

    return { courses, sections, terms };
}

function buildEnrollments(portalState = {}) {
    const enrollments = {};
    Object.entries(portalState.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
        asArray(schedule).forEach(item => {
            const courseId = String(item.courseId || '').trim();
            const groupId = String(item.groupId || '').trim();
            if (!courseId || !groupId) return;
            const enrollmentId = `${studentId}::${courseId}::${groupId}`;
            enrollments[enrollmentId] = {
                id: enrollmentId,
                studentId: String(studentId).trim(),
                courseId,
                sectionId: `${courseId}::${groupId}`,
                status: 'active',
                registeredAt: String(item.registeredAt || nowIso()),
                createdAt: nowIso(),
                updatedAt: nowIso()
            };
        });
    });
    return enrollments;
}

function buildGradebooks(portalState = {}) {
    const gradebooks = {};
    Object.entries(portalState.studentGrades || {}).forEach(([rosterId, roster]) => {
        const gradebookId = String(rosterId).trim();
        if (!gradebookId) return;
        gradebooks[gradebookId] = {
            id: gradebookId,
            rosterId: gradebookId,
            assessmentDefinitions: {},
            records: {},
            publications: {},
            finalGradesReleased: false,
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        asArray(roster).forEach(record => {
            const studentId = String(record.id || record.studentId || '').trim();
            if (!studentId) return;
            gradebooks[gradebookId].records[studentId] = {
                studentId,
                assessments: {
                    quiz: [{ number: 1, score: safeNumber(record.q1, 0), updatedAt: nowIso(), updatedBy: '' }],
                    homework: [{ number: 1, score: safeNumber(record.qa, 0), updatedAt: nowIso(), updatedBy: '' }],
                    midterm: [{ number: 1, score: safeNumber(record.mid, 0), updatedAt: nowIso(), updatedBy: '' }],
                    final: [{ number: 1, score: safeNumber(record.final, 0), updatedAt: nowIso(), updatedBy: '' }]
                },
                finalScore: safeNumber(record.final, 0),
                letterGrade: String(record.letter || '').trim(),
                history: []
            };
        });
    });
    return gradebooks;
}

function migrateLegacyState(legacy = {}) {
    const state = createEmptyPlatformState();
    const migratedAt = nowIso();
    const portalState = clone(legacy.portal?.state || {}) || {};
    const usersById = collectUsersFromPortalState(portalState);
    const legacyAccounts = legacy.accounts || {};

    Object.values(usersById).forEach(user => {
        state.people[user.id] = {
            id: user.id,
            name: user.name,
            nameEn: user.nameEn,
            displayName: user.displayName,
            email: user.email,
            facultyCode: user.facultyCode,
            role: user.role,
            avatar: user.avatar,
            createdAt: migratedAt,
            updatedAt: migratedAt
        };
        state.accounts[user.id] = {
            id: user.id,
            email: user.email,
            name: user.name,
            nameEn: user.nameEn,
            displayName: user.displayName,
            role: user.role,
            faculty: user.facultyCode,
            facultyCode: user.facultyCode,
            avatar: user.avatar,
            photo: user.photo,
            accountStatus: 'pending-activation',
            activationRequired: true,
            mustChangePassword: false,
            identityProvider: 'local',
            microsoftOid: '',
            microsoftTenantId: '',
            microsoftEmail: '',
            emailAliases: [],
            createdAt: migratedAt,
            updatedAt: migratedAt
        };
        state.authCredentials[user.id] = {
            userId: user.id,
            passwordHash: '',
            mustChangePassword: false,
            activationRequired: true,
            temporaryPasswordHash: '',
            activatedAt: '',
            resetTokens: []
        };
    });

    Object.values(legacyAccounts).forEach(rawAccount => {
        const account = sanitizeAccount(rawAccount);
        if (!account) return;
        state.accounts[account.id] = {
            ...(state.accounts[account.id] || {}),
            ...account
        };
        state.people[account.id] = {
            ...(state.people[account.id] || {}),
            id: account.id,
            name: account.name,
            nameEn: account.nameEn,
            displayName: account.displayName,
            email: account.email,
            facultyCode: account.facultyCode,
            role: account.role,
            avatar: account.avatar,
            createdAt: state.people[account.id]?.createdAt || account.createdAt,
            updatedAt: account.updatedAt
        };
        state.authCredentials[account.id] = {
            userId: account.id,
            passwordHash: rawAccount.password ? buildPasswordHash(rawAccount.password) : '',
            temporaryPasswordHash: rawAccount.temporaryPassword ? buildPasswordHash(rawAccount.temporaryPassword) : '',
            mustChangePassword: Boolean(rawAccount.mustChangePassword),
            activationRequired: Boolean(account.activationRequired),
            activatedAt: account.activationRequired ? '' : account.updatedAt,
            resetTokens: []
        };
    });

    if (!state.accounts['admin-01']) {
        const admin = sanitizeAccount({
            id: 'admin-01',
            email: 'admin@kiu.edu.ge',
            name: 'Administrator',
            nameEn: 'Administrator',
            displayName: 'Administrator',
            role: 'admin',
            facultyCode: 'ECON',
            avatar: 'AD',
            accountStatus: 'active'
        });
        state.accounts[admin.id] = admin;
        state.people[admin.id] = {
            id: admin.id,
            name: admin.name,
            nameEn: admin.nameEn,
            displayName: admin.displayName,
            email: admin.email,
            facultyCode: admin.facultyCode,
            role: admin.role,
            avatar: admin.avatar,
            createdAt: migratedAt,
            updatedAt: migratedAt
        };
        state.authCredentials[admin.id] = {
            userId: admin.id,
            passwordHash: buildPasswordHash('password123'),
            temporaryPasswordHash: '',
            mustChangePassword: false,
            activationRequired: false,
            activatedAt: migratedAt,
            resetTokens: []
        };
    }

    Object.entries(portalState.facultyProfiles || {}).forEach(([facultyCode, profile]) => {
        state.faculties[facultyCode] = {
            id: facultyCode,
            code: facultyCode,
            name: String(profile?.name || facultyCode).trim(),
            fullName: String(profile?.fullName || profile?.name || facultyCode).trim(),
            color: String(profile?.color || '').trim(),
            navColor: String(profile?.navColor || '').trim(),
            createdAt: migratedAt,
            updatedAt: migratedAt
        };
    });

    const academic = buildCoursesAndSections(portalState, usersById);
    state.courses = academic.courses;
    state.sections = academic.sections;
    state.terms = academic.terms;
    state.enrollments = buildEnrollments(portalState);
    state.gradebooks = buildGradebooks(portalState);

    Object.entries(legacy.files || {}).forEach(([fileId, file]) => {
        state.files[fileId] = {
            id: fileId,
            name: String(file?.name || fileId).trim(),
            type: String(file?.type || 'application/octet-stream').trim(),
            size: safeNumber(file?.size, 0),
            path: String(file?.path || '').trim(),
            uploadedAt: String(file?.uploadedAt || migratedAt),
            uploadedBy: String(file?.uploadedBy || '').trim(),
            scope: String(file?.scope || 'file').trim(),
            createdAt: migratedAt,
            updatedAt: migratedAt
        };
    });

    Object.entries(legacy.chats || {}).forEach(([chatId, chat]) => {
        state.chats[chatId] = {
            id: chatId,
            type: String(chat?.type || 'direct').trim().toLowerCase(),
            name: String(chat?.name || '').trim(),
            members: asArray(chat?.members).map(member => String(member || '').trim()).filter(Boolean),
            createdBy: String(chat?.createdBy || '').trim(),
            createdAt: String(chat?.createdAt || migratedAt),
            updatedAt: String(chat?.updatedAt || chat?.createdAt || migratedAt),
            requestStateByUser: chat?.requestStateByUser && typeof chat.requestStateByUser === 'object' ? clone(chat.requestStateByUser) : {},
            hiddenByUser: chat?.hiddenByUser && typeof chat.hiddenByUser === 'object' ? clone(chat.hiddenByUser) : {},
            messages: asArray(chat?.messages).map(message => ({
                ...message,
                id: String(message?.id || makeId('msg')).trim(),
                sentAt: String(message?.sentAt || migratedAt)
            }))
        };
    });

    Object.entries(legacy.calls || {}).forEach(([chatId, call]) => {
        state.calls[chatId] = {
            chatId,
            members: asArray(call?.members).map(member => String(member || '').trim()).filter(Boolean),
            startedBy: String(call?.startedBy || call?.fromUserId || '').trim(),
            startedAt: String(call?.startedAt || migratedAt),
            acceptedAt: String(call?.acceptedAt || '').trim(),
            acceptedBy: String(call?.acceptedBy || '').trim(),
            endedAt: String(call?.endedAt || '').trim(),
            status: String(call?.status || 'ended').trim().toLowerCase(),
            active: Boolean(call?.active)
        };
    });

    state.social = clone(legacy.social || portalState.socialHub || createEmptySocialState()) || createEmptySocialState();
    state.integrations.systems = {};
    SEEDED_SYSTEMS.forEach(system => {
        state.integrations.systems[system.systemCode] = {
            ...system,
            baseUrl: '',
            apiKeyConfigured: false,
            metadata: {},
            lastCheckedAt: migratedAt,
            updatedAt: migratedAt
        };
    });
    Object.entries(legacy.integrations?.systems || {}).forEach(([systemCode, system]) => {
        state.integrations.systems[systemCode] = {
            ...(state.integrations.systems[systemCode] || {}),
            ...clone(system),
            systemCode
        };
    });
    state.integrations.syncRuns = clone(legacy.integrations?.syncRuns || []) || [];
    state.integrations.conflicts = clone(legacy.integrations?.conflicts || []) || [];
    state.audit.events = clone(legacy.audit?.events || []) || [];

    asArray(portalState.notifications).forEach(notification => {
        const notificationId = String(notification.id || makeId('notif')).trim();
        state.notifications[notificationId] = {
            id: notificationId,
            recipientUserId: String(notification.userId || notification.recipientUserId || '').trim(),
            sourceDomain: String(notification.domain || 'portal').trim(),
            type: String(notification.type || 'general').trim(),
            title: String(notification.title || notification.message || 'Notification').trim(),
            body: String(notification.body || notification.message || '').trim(),
            routePage: String(notification.routePage || '').trim(),
            routeData: clone(notification.routeData || {}),
            isRead: Boolean(notification.isRead),
            createdAt: String(notification.createdAt || migratedAt)
        };
    });

    asArray(portalState.chancelleryRequests).forEach(request => {
        const requestId = String(request.id || makeId('svc')).trim();
        state.serviceRequests[requestId] = {
            id: requestId,
            requesterUserId: String(request.requesterUserId || request.userId || '').trim(),
            assigneeUserId: String(request.assigneeUserId || '').trim(),
            serviceArea: String(request.serviceArea || 'student-service').trim(),
            facultyCode: normalizeCode(request.facultyCode || ''),
            status: String(request.status || 'open').trim(),
            subject: String(request.subject || request.type || requestId).trim(),
            latestPreview: String(request.latestPreview || '').trim(),
            workflow: asArray(request.steps),
            currentStep: safeNumber(request.currentStep, 0),
            createdAt: String(request.createdAt || migratedAt),
            updatedAt: String(request.updatedAt || request.createdAt || migratedAt)
        };
    });

    state.portal.legacyState = portalState;
    state.portal.meta = clone(legacy.portal?.meta || {}) || {};
    state.portal.microsoft = clone(legacy.portal?.microsoft || {}) || {};
    state.meta.migratedFromLegacyAt = migratedAt;
    state.meta.updatedAt = migratedAt;
    return state;
}

function loadLegacyState() {
    return safeReadJson(LEGACY_STATE_PATH, {});
}

module.exports = {
    LEGACY_STATE_PATH,
    SEEDED_SYSTEMS,
    createEmptyPlatformState,
    createEmptySocialState,
    loadLegacyState,
    migrateLegacyState
};
