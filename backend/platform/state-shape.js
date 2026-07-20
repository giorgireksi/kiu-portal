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
        migrationVersion: 7
    };
}

function createDefaultNewsSectionCatalog() {
    return [
        { key: 'academic-updates', label: 'Academic Updates' },
        { key: 'campus-life', label: 'Campus Life' },
        { key: 'events', label: 'Events' },
        { key: 'announcements', label: 'Announcements' },
        { key: 'admissions', label: 'Admissions' },
        { key: 'research', label: 'Research' }
    ];
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
    createEmptyStudentServiceState
};
