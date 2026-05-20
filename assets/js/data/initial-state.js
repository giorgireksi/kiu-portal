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
            { concCourseData: {}, minorProgramData: {} }
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
        lostFoundItems: [],
        blocks: [],
        muted: [],
        notifications: [],
        events: [],
        rsvps: [],
        ui: {},
        draftFiles: {},
        migrationVersion: 4
    };
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

function sanitizeStateForManualTesting(state) {
    if (!state || typeof state !== 'object') return state;
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
    state.studentServiceArticles = Array.isArray(state.studentServiceArticles) ? state.studentServiceArticles : [];
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
    state.lmsLiveQuizzes = state.lmsLiveQuizzes && typeof state.lmsLiveQuizzes === 'object' ? state.lmsLiveQuizzes : {};
    state.users = Array.isArray(state.users) ? state.users.map(user => ({
        ...user,
        photo: scrubFakeMedia(user?.photo),
        image: scrubFakeMedia(user?.image)
    })) : [];
    state.meta = state.meta && typeof state.meta === 'object' ? state.meta : {};
    state.meta.manualTestingSanitizedVersion = typeof MANUAL_TESTING_STATE_VERSION === 'number' ? MANUAL_TESTING_STATE_VERSION : 4;
    state.auth = state.auth && typeof state.auth === 'object' ? state.auth : {};
    if (!state.auth.activeUserId) delete state.auth.activeUserId;
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
