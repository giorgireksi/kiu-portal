const { nowIso } = require('./utils');

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
        lostFoundItems: [],
        blocks: [],
        muted: [],
        notifications: [],
        events: [],
        rsvps: [],
        migrationVersion: 4
    };
}

function createEmptyNewsState() {
    return {
        posts: [],
        replies: [],
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
        programs: {},
        terms: {},
        courses: {},
        sections: {},
        enrollments: {},
        registrationHolds: {},
        lmsCourses: {},
        gradebooks: {},
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
        news: createEmptyNewsState(),
        studentService: createEmptyStudentServiceState(),
        importJobs: {},
        portal: {
            state: {},
            liveQuizWorkspaces: {},
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
    createEmptyStudentServiceState
};
