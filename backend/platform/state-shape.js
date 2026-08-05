const { nowIso } = require('./utils');

function createEmptySocialState() {
    return {
        profiles: {},
        relationships: [],
        pages: [],
        groups: [],
        projects: [],
        portfolios: {},
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
        researchPublications: [],
        moduleCuratorPins: {
            portfolio: [],
            research: [],
            event: [],
            survey: [],
            photo: [],
            lostFound: []
        },
        userPins: {},
        migrationVersion: 8
    };
}

function createDefaultNewsSectionCatalog() {
    return [
        { key: 'academic-updates', label: 'Academic Updates', icon: 'fa-graduation-cap' },
        { key: 'campus-life', label: 'Campus Life', icon: 'fa-university' },
        { key: 'events', label: 'Events', icon: 'fa-calendar-star' },
        { key: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
        { key: 'admissions', label: 'Admissions', icon: 'fa-door-open' },
        { key: 'research', label: 'Research', icon: 'fa-flask' }
    ];
}

/** Curated campus FA icons (36). Shared allowlist for news section catalog. */
const NEWS_SECTION_ICON_ALLOWLIST = [
    'fa-graduation-cap', 'fa-university', 'fa-building-columns', 'fa-landmark',
    'fa-book', 'fa-book-open', 'fa-bookmark', 'fa-file-lines',
    'fa-chalkboard', 'fa-chalkboard-user', 'fa-user-graduate', 'fa-users',
    'fa-flask', 'fa-microscope', 'fa-atom', 'fa-laptop-code',
    'fa-calendar-star', 'fa-calendar-days', 'fa-clock', 'fa-bullhorn',
    'fa-newspaper', 'fa-door-open', 'fa-id-card', 'fa-clipboard-list',
    'fa-briefcase', 'fa-handshake', 'fa-globe', 'fa-earth-americas',
    'fa-lightbulb', 'fa-award', 'fa-trophy', 'fa-heart-pulse',
    'fa-stethoscope', 'fa-scale-balanced', 'fa-palette', 'fa-music'
];

function normalizeNewsSectionIconValue(value = '') {
    const raw = String(value || '').trim().toLowerCase().replace(/^fas\s+/, '');
    const icon = raw.startsWith('fa-') ? raw : (raw ? `fa-${raw}` : '');
    return NEWS_SECTION_ICON_ALLOWLIST.includes(icon) ? icon : '';
}

function createEmptyNewsState() {
    return {
        posts: [],
        replies: [],
        sectionCatalog: createDefaultNewsSectionCatalog(),
        version: 1
    };
}

function createEmptyStudentServiceState() {
    return {
        tickets: [],
        questions: [],
        answers: [],
        articles: [],
        macros: [],
        reviewQueue: [],
        inboxFilterLayout: null,
        version: 1
    };
}

function createEmptyOrdersState() {
    return {
        recipientFilterLayoutByFacultyRole: {},
        filterConnectionsByFaculty: {},
        version: 1
    };
}

function createEmptyChancelleryState() {
    return {
        filterLayoutByFacultyRole: {},
        requestKindsByFaculty: {},
        filterConnectionsByFaculty: {},
        documentTemplateByFaculty: {},
        version: 1
    };
}

function createEmptyBackgroundGalleryCatalog() {
    return { images: [], videos: [] };
}

function createEmptyBackgroundGalleryState() {
    return {
        catalog: createEmptyBackgroundGalleryCatalog(),
        version: 1
    };
}

function createEmptyPlatformState(storageDriver = 'postgres') {
    return {
        meta: {
            version: 2,
            storageDriver,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            migratedFromLegacyAt: ''
        },
        accounts: {},
        authCredentials: {},
        people: {},
        sessions: {},
        faculties: {},
        terms: {},
        courses: {},
        sections: {},
        enrollments: {},
        registrationHolds: {},
        lmsCourses: {},
        examSessions: {},
        examPortalSessions: {},
        protectedQuizLaunches: {},
        protectedClientSessions: {},
        mail: {
            connections: {},
            oauthStates: {},
            caches: {},
            portalMessages: {}
        },
        files: {},
        chats: {},
        calls: {},
        notifications: {},
        notificationPreferences: {},
        pushSubscriptions: {},
        mobilePushTokens: {},
        integrations: {
            systems: {},
            syncRuns: [],
            conflicts: []
        },
        audit: {
            events: []
        },
        social: createEmptySocialState(),
        news: createEmptyNewsState(),
        studentService: createEmptyStudentServiceState(),
        orders: createEmptyOrdersState(),
        chancellery: createEmptyChancelleryState(),
        backgroundGallery: createEmptyBackgroundGalleryState(),
        importJobs: {},
        portal: {
            state: {},
            liveQuizWorkspaces: {},
            whiteboardWorkspaces: {},
            meta: {},
            microsoft: {
                oauthStates: {},
                loginCompletions: {}
            }
        }
    };
}

module.exports = {
    createEmptyPlatformState,
    createEmptySocialState,
    createEmptyNewsState,
    createDefaultNewsSectionCatalog,
    NEWS_SECTION_ICON_ALLOWLIST,
    normalizeNewsSectionIconValue,
    createEmptyStudentServiceState,
    createEmptyOrdersState,
    createEmptyChancelleryState,
    createEmptyBackgroundGalleryCatalog,
    createEmptyBackgroundGalleryState
};
