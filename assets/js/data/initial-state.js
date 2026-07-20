/* Production bootstrap state for the portal frontend. */

const KIU_FACULTY_METADATA = {
    CS: {
        name: 'Computer Science',
        fullName: 'School of Computer Science & Mathematics',
        color: '#5b21b6',
        navColor: '#2e1065'
    },
    ECON: {
        name: 'Business Management',
        fullName: 'School of Business Management & Economics',
        color: '#a4262c',
        navColor: '#5f1620'
    },
    LAW: {
        name: 'Law',
        fullName: 'School of Law',
        color: '#107c41',
        navColor: '#0d5a30'
    },
    MED: {
        name: 'Medicine',
        fullName: 'School of Medicine',
        color: '#065f46',
        navColor: '#044e41'
    },
    ARTS: {
        name: 'Arts & Humanities',
        fullName: 'School of Arts & Humanities',
        color: '#b45309',
        navColor: '#7a4a06'
    }
};

function buildEmptyFacultyProfiles() {
    return Object.fromEntries(
        Object.entries(KIU_FACULTY_METADATA).map(([code, meta]) => [
            code,
            {
                name: meta.name,
                fullName: meta.fullName,
                color: meta.color,
                navColor: meta.navColor,
                curriculum: [],
                professors: [],
                tas: [],
                students: []
            }
        ])
    );
}

function createEmptyAdminProgramStructures(sourceProfiles = {}) {
    return Object.fromEntries(
        Object.keys(sourceProfiles || {}).map(code => [
            code,
            { prog: [], free: [], conc: [], minor: [] }
        ])
    );
}

function createEmptyRegistrationCmsByFaculty(sourceProfiles = {}) {
    return Object.fromEntries(
        Object.keys(sourceProfiles || {}).map(code => [
            code,
            { concCourseData: {}, minorProgramData: {}, trackData: {}, customTabs: [], builtinTabOverrides: {}, hiddenBuiltinTabs: [] }
        ])
    );
}

function createEmptySocialHubState() {
    return {
        profiles: {},
        relationships: [],
        pages: [],
        groups: [],
        projects: [],
        projectTasks: [],
        projectActivities: [],
        projectBudgetCategories: [],
        projectBudgetExpenses: [],
        projectRisks: [],
        posts: [],
        stories: [],
        storyViews: [],
        reels: [],
        savedPosts: [],
        reports: [],
        lostFoundItems: [],
        blocks: [],
        muted: [],
        notifications: [],
        events: [],
        rsvps: [],
        surveys: [],
        surveyQuestions: [],
        surveyResponses: [],
        ui: {},
        draftFiles: {},
        migrationVersion: 5
    };
}

function isAdminTestingPersonaIdForPurge(id = '') {
    return String(id || '').trim().toLowerCase().startsWith('admin-testing-');
}

function isDemoOrTestingRecord(record = {}, options = {}) {
    if (!record || typeof record !== 'object') return false;
    const id = String(record.id || record.userId || record.studentId || '').trim().toLowerCase();
    const retainAdminTesting = Boolean(options.retainAdminTestingPersonas);
    if (isAdminTestingPersonaIdForPurge(id) && retainAdminTesting) return false;
    if (record.isDemoAccount) return true;
    if (record.isAdminTestingPersona && !retainAdminTesting) return true;
    if (!id) return false;
    if (isAdminTestingPersonaIdForPurge(id)) return true;
    if (id.includes('-demo') || id.endsWith('-demo')) return true;
    if (id.startsWith('testing-')) return true;
    if (/^(econ|cs|law|med|arts)-(student|professor|ta|service)(-demo)?/.test(id)) return true;
    return false;
}

function isDemoCourseId(courseId = '') {
    const id = String(courseId || '').trim().toUpperCase();
    return id.includes('-DEMO-') || id.endsWith('-DEMO') || /^[A-Z]+-DEMO-\d+/.test(id);
}

function purgeDemoContentFromState(state, options = {}) {
    if (!state || typeof state !== 'object') return state;
    if (Array.isArray(state.users)) {
        state.users = state.users.filter(user => !isDemoOrTestingRecord(user, options));
    }
    if (state.facultyProfiles && typeof state.facultyProfiles === 'object') {
        Object.values(state.facultyProfiles).forEach((profile) => {
            if (!profile || typeof profile !== 'object') return;
            if (Array.isArray(profile.curriculum)) {
                profile.curriculum = profile.curriculum.filter(subject => !isDemoCourseId(subject?.id || subject?.courseId));
            }
            ['professors', 'tas', 'students'].forEach((key) => {
                if (!Array.isArray(profile[key])) return;
                profile[key] = profile[key].filter(member => !isDemoOrTestingRecord(member, options));
            });
        });
    }
    if (Array.isArray(state.curriculum)) {
        state.curriculum = state.curriculum.filter(subject => !isDemoCourseId(subject?.id || subject?.courseId));
    }
    if (Array.isArray(state.publicSocialPosts)) {
        state.publicSocialPosts = state.publicSocialPosts.filter(post => !isDemoOrTestingRecord({ id: post?.authorId || post?.userId }, options));
    }
    if (Array.isArray(state.portalNotifications)) {
        state.portalNotifications = state.portalNotifications.filter(item => String(item?.type || '') !== 'demo-ready');
    }
    if (Array.isArray(state.studentServiceTickets)) {
        state.studentServiceTickets = state.studentServiceTickets.filter(ticket => !String(ticket?.id || '').toLowerCase().startsWith('testing-'));
    }
    const purgeStudentKeyedMap = (map) => {
        if (!map || typeof map !== 'object') return;
        Object.keys(map).forEach((studentId) => {
            if (isDemoOrTestingRecord({ id: studentId }, options)) delete map[studentId];
        });
    };
    purgeStudentKeyedMap(state.studentSchedulesByStudent);
    purgeStudentKeyedMap(state.studentRegistrations);
    purgeStudentKeyedMap(state.studentGrades);
    purgeStudentKeyedMap(state.studentPassedCourses);
    purgeStudentKeyedMap(state.tuitionBalances);
    if (state.availableGroups && typeof state.availableGroups === 'object') {
        Object.keys(state.availableGroups).forEach((subjectId) => {
            if (isDemoCourseId(subjectId)) delete state.availableGroups[subjectId];
        });
    }
    purgeDemoRegistrationCmsFromState(state);
    return state;
}

function purgeDemoRegistrationCmsFromState(state) {
    if (!state || typeof state !== 'object') return;
    const structures = state.adminProgramStructures;
    if (structures && typeof structures === 'object') {
        Object.values(structures).forEach((facultyBucket) => {
            if (!facultyBucket || typeof facultyBucket !== 'object') return;
            ['prog', 'free', 'conc', 'minor'].forEach((tabKey) => {
                if (!Array.isArray(facultyBucket[tabKey])) return;
                facultyBucket[tabKey] = facultyBucket[tabKey]
                    .filter((module) => module && typeof module === 'object' && !isDemoCourseId(module.id))
                    .map((module) => {
                        if (!Array.isArray(module.subModules)) return module;
                        return {
                            ...module,
                            subModules: module.subModules.filter((sub) => (
                                sub
                                && typeof sub === 'object'
                                && !isDemoCourseId(sub.id)
                            ))
                        };
                    });
            });
        });
    }
    const cmsByFaculty = state.registrationCMSByFaculty;
    if (cmsByFaculty && typeof cmsByFaculty === 'object') {
        Object.values(cmsByFaculty).forEach((bucket) => {
            if (!bucket || typeof bucket !== 'object') return;
            ['concCourseData', 'minorProgramData'].forEach((mapKey) => {
                const map = bucket[mapKey];
                if (!map || typeof map !== 'object') return;
                Object.keys(map).forEach((programKey) => {
                    const program = map[programKey];
                    if (!program || typeof program !== 'object') return;
                    Object.keys(program).forEach((groupKey) => {
                        const group = program[groupKey];
                        if (!group || typeof group !== 'object' || !Array.isArray(group.courses)) return;
                        group.courses = group.courses.filter((course) => {
                            const courseId = course?.id || course?.courseId || course?.title || '';
                            return !isDemoCourseId(courseId);
                        });
                    });
                });
            });
            const trackData = bucket.trackData && typeof bucket.trackData === 'object' ? bucket.trackData : {};
            Object.values(trackData).forEach((tabTrack) => {
                if (!tabTrack || typeof tabTrack !== 'object') return;
                Object.values(tabTrack).forEach((groups) => {
                    if (!groups || typeof groups !== 'object') return;
                    Object.values(groups).forEach((group) => {
                        if (!group || typeof group !== 'object' || !Array.isArray(group.courses)) return;
                        group.courses = group.courses.filter((course) => {
                            const courseId = course?.n || course?.sourceCourseId || course?.title || '';
                            return !isDemoCourseId(courseId);
                        });
                    });
                });
            });
            if (Array.isArray(bucket.customTabs)) {
                bucket.customTabs = bucket.customTabs.filter((tab) => tab && !isDemoCourseId(tab.id));
            }
        });
    }
}

function scrubFakeMedia(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/pravatar\.cc/i.test(raw)) return '';
    if (/^[A-Z]{1,4}$/.test(raw)) return '';
    if (
        !/^(data:|blob:|https?:\/\/|file:\/\/|\/|\.{1,2}\/|[a-z]:[\\/])/i.test(raw)
        && !/[\\/]/.test(raw)
        && !/\.[a-z0-9]{2,6}(?:[?#].*)?$/i.test(raw)
    ) {
        return '';
    }
    return value;
}

function sanitizeStateForManualTesting(state, options = {}) {
    if (!state || typeof state !== 'object') return state;
    const purgeOptions = {
        retainAdminTestingPersonas: Boolean(options.retainAdminTestingPersonas)
    };
    const facultyProfiles = state.facultyProfiles && typeof state.facultyProfiles === 'object'
        ? state.facultyProfiles
        : buildEmptyFacultyProfiles();

    state.facultyProfiles = facultyProfiles;
    state.curriculum = Array.isArray(state.curriculum) ? state.curriculum : [];
    state.availableGroups = state.availableGroups && typeof state.availableGroups === 'object' ? state.availableGroups : {};
    state.timetable = state.timetable && typeof state.timetable === 'object'
        ? state.timetable
        : { 'slot-1': [], 'slot-2': [], 'slot-3': [], 'slot-4': [] };
    state.studentSchedule = Array.isArray(state.studentSchedule) ? state.studentSchedule : [];
    state.studentSchedulesByStudent = state.studentSchedulesByStudent && typeof state.studentSchedulesByStudent === 'object' ? state.studentSchedulesByStudent : {};
    state.studentRegistrations = state.studentRegistrations && typeof state.studentRegistrations === 'object' ? state.studentRegistrations : {};
    state.studentGrades = state.studentGrades && typeof state.studentGrades === 'object' ? state.studentGrades : {};
    state.studentPassedCourses = state.studentPassedCourses && typeof state.studentPassedCourses === 'object' ? state.studentPassedCourses : {};
    state.tuitionBalances = state.tuitionBalances && typeof state.tuitionBalances === 'object' ? state.tuitionBalances : {};
    state.probationStatus = state.probationStatus && typeof state.probationStatus === 'object' ? state.probationStatus : {};
    state.assignments = state.assignments && typeof state.assignments === 'object' ? state.assignments : {};
    state.submissions = state.submissions && typeof state.submissions === 'object' ? state.submissions : {};
    state.attendance = state.attendance && typeof state.attendance === 'object' ? state.attendance : {};
    state.syllabus = state.syllabus && typeof state.syllabus === 'object' ? state.syllabus : {};
    state.messages = state.messages && typeof state.messages === 'object' ? state.messages : {};
    state.lmsSessionMarkers = state.lmsSessionMarkers && typeof state.lmsSessionMarkers === 'object' ? state.lmsSessionMarkers : {};
    state.chancelleryRequests = Array.isArray(state.chancelleryRequests) ? state.chancelleryRequests : [];
    state.chancelleryFilterLayout = state.chancelleryFilterLayout && typeof state.chancelleryFilterLayout === 'object'
        ? state.chancelleryFilterLayout
        : null;
    state.officeHours = state.officeHours && typeof state.officeHours === 'object' ? state.officeHours : {};
    state.calendarEvents = state.calendarEvents && typeof state.calendarEvents === 'object' ? state.calendarEvents : {};
    state.adminProgramStructures = state.adminProgramStructures && typeof state.adminProgramStructures === 'object'
        ? state.adminProgramStructures
        : createEmptyAdminProgramStructures(facultyProfiles);
    state.registrationCMSByFaculty = state.registrationCMSByFaculty && typeof state.registrationCMSByFaculty === 'object'
        ? state.registrationCMSByFaculty
        : createEmptyRegistrationCmsByFaculty(facultyProfiles);
    state.registrationCMS = state.registrationCMS && typeof state.registrationCMS === 'object'
        ? state.registrationCMS
        : { concCourseData: {}, minorProgramData: {} };
    state.adminExamsByFaculty = state.adminExamsByFaculty && typeof state.adminExamsByFaculty === 'object' ? state.adminExamsByFaculty : {};
    state.examTemplatesByFaculty = state.examTemplatesByFaculty && typeof state.examTemplatesByFaculty === 'object' ? state.examTemplatesByFaculty : {};
    state.examTemplateLinksByTemplateId = state.examTemplateLinksByTemplateId && typeof state.examTemplateLinksByTemplateId === 'object' ? state.examTemplateLinksByTemplateId : {};
    state.examSessionsById = state.examSessionsById && typeof state.examSessionsById === 'object' ? state.examSessionsById : {};
    state.examPortalAuthSession = state.examPortalAuthSession && typeof state.examPortalAuthSession === 'object' ? state.examPortalAuthSession : {};
    state.examSessions = state.examSessions && typeof state.examSessions === 'object' ? state.examSessions : {};
    state.curriculumLibraryModulesByFaculty = state.curriculumLibraryModulesByFaculty && typeof state.curriculumLibraryModulesByFaculty === 'object'
        ? state.curriculumLibraryModulesByFaculty
        : {};
    state.socialHub = state.socialHub && typeof state.socialHub === 'object' ? state.socialHub : createEmptySocialHubState();
    state.socialProfiles = state.socialProfiles && typeof state.socialProfiles === 'object' ? state.socialProfiles : {};
    state.socialFriendRequests = Array.isArray(state.socialFriendRequests) ? state.socialFriendRequests : [];
    state.socialFriendships = Array.isArray(state.socialFriendships) ? state.socialFriendships : [];
    state.portalNotifications = Array.isArray(state.portalNotifications) ? state.portalNotifications : [];
    state.portalMessengerChats = state.portalMessengerChats && typeof state.portalMessengerChats === 'object' ? state.portalMessengerChats : {};
    state.portalMessengerCalls = state.portalMessengerCalls && typeof state.portalMessengerCalls === 'object' ? state.portalMessengerCalls : {};
    state.portalMessengerFavorites = state.portalMessengerFavorites && typeof state.portalMessengerFavorites === 'object' ? state.portalMessengerFavorites : {};
    state.portalMessengerHiddenChats = state.portalMessengerHiddenChats && typeof state.portalMessengerHiddenChats === 'object' ? state.portalMessengerHiddenChats : {};
    state.portalMessengerPinnedChats = state.portalMessengerPinnedChats && typeof state.portalMessengerPinnedChats === 'object' ? state.portalMessengerPinnedChats : {};
    state.orderReadsByUser = state.orderReadsByUser && typeof state.orderReadsByUser === 'object' ? state.orderReadsByUser : {};
    state.ordersCenterByFaculty = state.ordersCenterByFaculty && typeof state.ordersCenterByFaculty === 'object' ? state.ordersCenterByFaculty : {};
    state.studentServiceArticles = [];
    state.studentServiceMacros = Array.isArray(state.studentServiceMacros) ? state.studentServiceMacros : [];
    state.studentServiceTickets = Array.isArray(state.studentServiceTickets) ? state.studentServiceTickets : [];
    state.publicSocialPosts = Array.isArray(state.publicSocialPosts) ? state.publicSocialPosts : [];
    state.publicSocialPages = state.publicSocialPages && typeof state.publicSocialPages === 'object' ? state.publicSocialPages : {};
    state.publicSocialFollowers = state.publicSocialFollowers && typeof state.publicSocialFollowers === 'object' ? state.publicSocialFollowers : {};
    state.publicSocialUi = state.publicSocialUi && typeof state.publicSocialUi === 'object' ? state.publicSocialUi : {};
    state.publicSocialDraftFiles = state.publicSocialDraftFiles && typeof state.publicSocialDraftFiles === 'object' ? state.publicSocialDraftFiles : {};
    state.publicSocialSeeded = false;
    state.homeDashboardPreferencesByUser = state.homeDashboardPreferencesByUser && typeof state.homeDashboardPreferencesByUser === 'object'
        ? state.homeDashboardPreferencesByUser
        : {};
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
    state.lmsQuizBuilder = state.lmsQuizBuilder && typeof state.lmsQuizBuilder === 'object' ? state.lmsQuizBuilder : {};
    state.lmsSubjectQuizBank = state.lmsSubjectQuizBank && typeof state.lmsSubjectQuizBank === 'object' ? state.lmsSubjectQuizBank : {};
    state.lmsLiveQuizzes = state.lmsLiveQuizzes && typeof state.lmsLiveQuizzes === 'object' ? state.lmsLiveQuizzes : {};
    state.lmsWhiteboards = state.lmsWhiteboards && typeof state.lmsWhiteboards === 'object' ? state.lmsWhiteboards : {};
    state.users = Array.isArray(state.users) ? state.users.map(user => ({
        ...user,
        photo: scrubFakeMedia(user?.photo),
        image: scrubFakeMedia(user?.image)
    })) : [];
    state.meta = state.meta && typeof state.meta === 'object' ? state.meta : {};
    state.meta.manualTestingSanitizedVersion = typeof MANUAL_TESTING_STATE_VERSION === 'number' ? MANUAL_TESTING_STATE_VERSION : 4;
    state.auth = state.auth && typeof state.auth === 'object' ? state.auth : {};
    if (!state.auth.activeUserId) delete state.auth.activeUserId;
    purgeDemoContentFromState(state, purgeOptions);
    if (typeof stripSeededMockStudents === 'function') stripSeededMockStudents(state, purgeOptions);
    return state;
}

const KIU_EMPTY_STATE = sanitizeStateForManualTesting({
    meta: {},
    facultyProfiles: buildEmptyFacultyProfiles(),
    curriculum: [],
    availableGroups: {},
    timetable: { 'slot-1': [], 'slot-2': [], 'slot-3': [], 'slot-4': [] },
    studentSchedule: [],
    studentSchedulesByStudent: {},
    studentRegistrations: {},
    studentGrades: {},
    studentPassedCourses: {},
    assignments: {},
    submissions: {},
    attendance: {},
    syllabus: {},
    messages: {},
    lmsSessionMarkers: {},
    lmsLiveQuizzes: {},
    lmsWhiteboards: {},
    activeSemester: 1,
    registrationOpen: true,
    tuitionBalances: {},
    probationStatus: {},
    chancelleryRequests: [],
    officeHours: {},
    calendarEvents: {},
    socialProfiles: {},
    socialFriendRequests: [],
    socialFriendships: [],
    notifications: [],
    examTemplatesByFaculty: {},
    examTemplateLinksByTemplateId: {},
    examSessionsById: {},
    examPortalAuthSession: {},
    users: []
});
