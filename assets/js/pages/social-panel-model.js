/* Social panel nav/config helpers (activeNavPanels + getSocialPanelConfig).
 * Eager: social.html before social-page.js.
 * ESM leaf: social.html type=module; classic bridge for defer consumers.
 */
'use strict';

function hooks() {
    return window.__kiuSocialPanelHooks || {};
}

function pick(name, fallback) {
    const hook = hooks()[name];
    if (typeof hook === 'function') return hook;
    if (typeof window[name] === 'function' && window[name] !== fallback) return window[name];
    return typeof fallback === 'function' ? fallback : () => fallback;
}

function text(value) {
    return pick('text', (v) => String(v == null ? '' : v).trim())(value);
}

function state() {
    return pick('state', () => ({}))();
}

function relationshipBuckets() {
    return pick('relationshipBuckets', () => ({ connections: [], incoming: [], outgoing: [] }))();
}

function isJoinedGroup(group) {
    return pick('isJoinedGroup', () => false)(group);
}

function roleLabel(role) {
    return pick('roleLabel', (r) => text(r || ''))(role);
}

function currentUser() {
    return pick('currentUser', () => null)();
}

function currentUserId() {
    return pick('currentUserId', () => '')();
}

function isManagedPage(page) {
    return pick('isManagedPage', () => false)(page);
}

function pendingSurveyCount() {
    return pick('pendingSurveyCount', () => 0)();
}

function surveys() {
    return pick('surveys', () => [])();
}

function lostFoundActiveCount() {
    return pick('lostFoundActiveCount', () => 0)();
}

function lostFoundRecoveredCount() {
    return pick('lostFoundRecoveredCount', () => 0)();
}

function activeChats() {
    return pick('activeChats', () => [])();
}

function unreadMessages(chat) {
    return pick('unreadMessages', () => 0)(chat);
}

function currentCall() {
    return pick('currentCall', () => null)();
}

function unreadNotifications() {
    return pick('unreadNotifications', () => 0)();
}

function notificationItems() {
    return pick('notificationItems', () => [])();
}

function classifyNotification(notification) {
    return pick('classifyNotification', () => '')(notification);
}

function profilePostCount(userId) {
    return pick('profilePostCount', () => 0)(userId);
}

function profileFriendCount(userId) {
    return pick('profileFriendCount', () => 0)(userId);
}

function profileFollowingCount(userId) {
    return pick('profileFollowingCount', () => 0)(userId);
}

function profileAccount(userId) {
    return pick('profileAccount', () => null)(userId);
}

function isImage(media) {
    return pick('isImage', () => false)(media);
}

function getPortalPhotographyPosts(feed) {
    // Call with no args so the portal/lite implementation uses live runtime.feed.
    // Passing [] (from an unhooked state()) permanently empties Exposé.
    const invoke = (fn) => (arguments.length ? fn(feed) : fn());
    const hook = hooks().getPortalPhotographyPosts;
    if (typeof hook === 'function') return invoke(hook);
    if (typeof window.getPortalPhotographyPosts === 'function') {
        try { return invoke(window.getPortalPhotographyPosts); } catch (error) { return null; }
    }
    return null;
}

function photographyPosts() {
    const fromPortal = getPortalPhotographyPosts();
    if (Array.isArray(fromPortal)) return fromPortal;
    const feed = Array.isArray(state().feed) ? state().feed : [];
    return feed.filter((post) => text(post?.category) === 'Photography'
        && Array.isArray(post?.media)
        && post.media.some((media) => isImage(media)));
}

function pageOrGroupPublic(item) {
    return pick('pageOrGroupPublic', () => false)(item);
}

function filterFeedForHome(feed, filterId) {
    feed = (Array.isArray(feed) ? feed : []).filter((post) => text(post?.category) !== 'Photography');
    const runtime = state();
    const social = runtime.social || {};
    const relationships = relationshipBuckets();
    const connectionIds = new Set(relationships.connections.map((relationship) => text(relationship.fromId) === currentUserId() ? text(relationship.toId) : text(relationship.fromId)));
    const followedPageIds = new Set((Array.isArray(social.pages) ? social.pages : []).filter((page) => page?.isFollowing || isManagedPage(page)).map((page) => text(page.id)));
    const joinedGroupIds = new Set((Array.isArray(social.groups) ? social.groups : []).filter((group) => isJoinedGroup(group) || pageOrGroupPublic(group)).map((group) => text(group.id)));

    if (filterId === 'following') {
        return feed.filter((post) => connectionIds.has(text(post.authorUserId))
            || (text(post.scopeType) === 'page' && followedPageIds.has(text(post.scopeId)))
            || (text(post.scopeType) === 'group' && joinedGroupIds.has(text(post.scopeId))));
    }
    if (filterId === 'groups') return feed.filter((post) => text(post.scopeType) === 'group');
    if (filterId === 'pages') return feed.filter((post) => text(post.scopeType) === 'page');
    if (filterId === 'campus') return feed.filter((post) => !text(post.audience) || text(post.audience) === 'campus');
    return feed;
}

function activeNavPanels() {
    const runtime = state();
    const social = runtime.social || {};
    const relationships = relationshipBuckets();
    const unreadThreadCount = activeChats().reduce((total, chat) => total + unreadMessages(chat), 0);
    return [{
        id: 'feed',
        label: 'Home',
        helper: 'Live campus feed',
        icon: 'fa-house',
        count: Array.isArray(runtime.feed) ? runtime.feed.length : 0
    }, {
        id: 'community',
        label: 'People',
        helper: 'Directory & connections',
        icon: 'fa-user-group',
        count: relationships.connections.length + relationships.incoming.length
    }, {
        id: 'groups',
        label: 'Groups',
        helper: 'Courses & clubs',
        icon: 'fa-layer-group',
        count: (Array.isArray(social.groups) ? social.groups : []).filter(isJoinedGroup).length
    }, {
        id: 'workspace',
        label: 'Projects',
        helper: 'Course group projects',
        icon: 'fa-diagram-project',
        count: (Array.isArray(social.projects) ? social.projects : []).filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase())).length
    }, {
        id: 'projects',
        label: 'Portfolio',
        helper: 'Showcase feed',
        icon: 'fa-briefcase',
        count: Array.isArray(social.projects) ? social.projects.length : 0
    }, {
        id: 'research',
        label: 'Research',
        helper: 'Papers, articles & PDFs',
        icon: 'fa-book-open',
        count: (Array.isArray(social.researchPublications) ? social.researchPublications : [])
            .filter((item) => text(item?.status) === 'published').length
    }, {
        id: 'pages',
        label: 'Pages',
        helper: 'Official & followed',
        icon: 'fa-flag',
        count: (Array.isArray(social.pages) ? social.pages : []).filter(p => p?.isFollowing).length
    }, {
        id: 'events',
        label: 'Events',
        helper: "What's happening",
        icon: 'fa-calendar-days',
        count: Array.isArray(social.events) ? social.events.length : 0
    }, {
        id: 'surveys',
        label: 'Surveys',
        helper: 'Campus feedback & polls',
        icon: 'fa-clipboard-list',
        count: pendingSurveyCount()
    }, {
        id: 'photography',
        label: 'Exposé',
        helper: 'Campus photo feed',
        icon: 'fa-camera-retro',
        count: photographyPosts().length
    }, {
        id: 'lost-and-found',
        label: 'Lost & Found',
        helper: 'Campus items',
        icon: 'fa-magnifying-glass-location',
        count: lostFoundActiveCount()
    }, {
        id: 'messages',
        label: 'Messages',
        helper: 'Direct and group chats',
        icon: 'fa-comments',
        count: unreadThreadCount
    }, {
        id: 'alerts',
        label: 'Alerts',
        helper: 'Mentions and notices',
        icon: 'fa-bell',
        count: unreadNotifications()
    }];
}

function getSocialPanelConfig(activePanel, runtime) {
    return {
        feed: {
            title: 'Campus Home',
            description: 'Posts, updates, groups, and campus activity in one stream.',
            pills: [
                { label: 'Posts', value: Array.isArray(runtime.feed) ? runtime.feed.length : 0 },
                { label: 'Following', value: relationshipBuckets().connections.length },
                { label: 'Joined groups', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length }
            ]
        },
        community: {
            title: 'People',
            description: 'Find classmates, staff, and manage your campus connections.',
            pills: [
                { label: 'People', value: Array.isArray(runtime.directory) ? runtime.directory.length : 0 },
                { label: 'Connections', value: relationshipBuckets().connections.length },
                { label: 'Pending', value: relationshipBuckets().incoming.length + relationshipBuckets().outgoing.length }
            ]
        },
        groups: {
            title: 'Groups',
            description: 'Join communities for courses, clubs, and projects.',
            pills: [
                { label: 'Groups', value: Array.isArray(runtime.social?.groups) ? runtime.social.groups.length : 0 },
                { label: 'Joined', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length },
                { label: 'Members', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).reduce((s,g) => s + (g.memberCount||0), 0) }
            ]
        },
        workspace: {
            title: 'Project Workspaces',
            description: 'Course group projects — tasks, team chat, and delivery for student teams.',
            pills: [
                { label: 'Workspaces', value: Array.isArray(runtime.social?.projects) ? runtime.social.projects.length : 0 },
                { label: 'Active', value: (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).filter((project) => text(project?.status || '') === 'active').length },
                { label: 'My role', value: roleLabel(currentUser()?.role) },
                { label: 'Private by default', value: 'On' }
            ]
        },
        projects: {
            title: 'Portfolio',
            description: 'A polished public showcase feed to present research, builds, and capstone work for discovery.',
            pills: [
                { label: 'Entries', value: Array.isArray(runtime.social?.projects) ? runtime.social.projects.length : 0 },
                { label: 'Published', value: (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).filter((project) => text(project?.status || '') === 'published').length },
                { label: 'Role', value: roleLabel(currentUser()?.role) }
            ]
        },
        research: {
            title: 'Research',
            description: 'Long-form articles and PDF scholarship — faculty and student streams stay separate.',
            pills: [
                {
                    label: 'Faculty',
                    value: (Array.isArray(runtime.social?.researchPublications) ? runtime.social.researchPublications : [])
                        .filter((item) => text(item?.authorLane) === 'faculty' && text(item?.status) === 'published').length
                },
                {
                    label: 'Student',
                    value: (Array.isArray(runtime.social?.researchPublications) ? runtime.social.researchPublications : [])
                        .filter((item) => text(item?.authorLane) === 'student' && text(item?.status) === 'published').length
                },
                { label: 'Role', value: roleLabel(currentUser()?.role) }
            ]
        },
        pages: {
            title: 'Pages',
            description: 'Follow official labs, clubs, offices, and faculty pages.',
            pills: [
                { label: 'Pages', value: Array.isArray(runtime.social?.pages) ? runtime.social.pages.length : 0 },
                { label: 'Following', value: (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(p => p?.isFollowing).length },
                { label: 'Managed', value: (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(isManagedPage).length }
            ]
        },
        events: {
            title: 'Campus Events',
            description: 'Track what is happening now and publish events without turning the section into a form wall.',
            pills: [
                { label: 'Events', value: Array.isArray(runtime.social?.events) ? runtime.social.events.length : 0 },
                { label: 'Study groups', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter((group) => group.type === 'study' || (group.tags || []).includes('study')).length },
                { label: 'Role', value: roleLabel(currentUser()?.role) }
            ]
        },
        surveys: {
            title: 'Campus Surveys',
            description: 'Collect feedback on courses, services, and campus life without leaving the social workspace.',
            pills: [
                { label: 'Open', value: pendingSurveyCount() },
                { label: 'Total', value: surveys().length },
                { label: 'Role', value: roleLabel(currentUser()?.role) }
            ]
        },
        'lost-and-found': {
            title: 'Lost & Found',
            description: 'Help students recover lost items and keep campus handoffs organized in one place.',
            pills: [
                { label: 'Lost', value: lostFoundActiveCount() },
                { label: 'Found', value: lostFoundRecoveredCount() },
                { label: 'Role', value: roleLabel(currentUser()?.role) }
            ]
        },
        messages: {
            title: 'Messages',
            description: 'Keep direct threads and group rooms moving without losing sight of the wider social inbox.',
            pills: [
                { label: 'Chats', value: activeChats().length },
                { label: 'Unread', value: activeChats().reduce((total, chat) => total + unreadMessages(chat), 0) },
                { label: 'Active call', value: currentCall() ? 'Live' : 'Idle' }
            ]
        },
        alerts: {
            title: 'Alerts',
            description: 'Prioritise mentions, notices, and moderation signals in one calm inbox lane.',
            pills: [
                { label: 'Unread', value: unreadNotifications() },
                { label: 'Mentions', value: notificationItems().filter((notification) => classifyNotification(notification) === 'mention').length },
                { label: 'Reports', value: Array.isArray(runtime.social?.reports) ? runtime.social.reports.length : 0 },
                { label: 'Role', value: roleLabel(currentUser()?.role) }
            ]
        },
        profile: {
            title: 'Profile',
            description: 'Your public social identity, posts, and campus relationships.',
            pills: [
                { label: 'Posts', value: profilePostCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                { label: 'Connections', value: profileFriendCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                { label: 'Following', value: profileFollowingCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                { label: 'Role', value: roleLabel(profileAccount(text(runtime.ui?.activeProfileUserId || currentUserId()))?.role || currentUser()?.role) }
            ]
        }
    };
}

function postingScopeOptions() {
    const runtime = state();
    const userId = currentUserId();
    const options = [{
        type: 'profile',
        id: userId,
        name: 'My profile'
    }];
    (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(isManagedPage).forEach((page) => {
        options.push({ type: 'page', id: text(page.id), name: text(page.name || 'Page') });
    });
    (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).forEach((group) => {
        options.push({ type: 'group', id: text(group.id), name: text(group.name || 'Group') });
    });
    return options;
}

function feedScopeOptions() {
    const runtime = state();
    const userId = currentUserId();
    const options = [{
        type: '',
        id: '',
        name: 'All visible posts'
    }, {
        type: 'profile',
        id: userId,
        name: 'My profile posts'
    }];
    (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).forEach((page) => {
        options.push({ type: 'page', id: text(page.id), name: `Page - ${text(page.name || 'Untitled')}` });
    });
    (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter((group) => isJoinedGroup(group) || pageOrGroupPublic(group)).forEach((group) => {
        options.push({ type: 'group', id: text(group.id), name: `Group - ${text(group.name || 'Untitled')}` });
    });
    return options;
}

function eventScopeOptions() {
    return postingScopeOptions();
}


export const socialPanelModelApi = {
    postingScopeOptions,
    feedScopeOptions,
    eventScopeOptions,
    photographyPosts,
    activeNavPanels,
    getSocialPanelConfig,
    filterFeedForHome
};

/** Install classic window / Kiu surface (idempotent). */
export function installSocialPanelModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_PANEL_MODEL_LOADED) {
        return target?.KiuSocialPanelModel || socialPanelModelApi;
    }
    target.__KIU_SOCIAL_PANEL_MODEL_LOADED = true;
    target.__kiuSocialPanelModelExports = socialPanelModelApi;
    target.KiuSocialPanelModel = socialPanelModelApi;
    Object.keys(socialPanelModelApi).forEach((key) => {
        target[key] = socialPanelModelApi[key];
    });
    return socialPanelModelApi;
}

// type=module script tag: assign window surface for classic defer consumers
installSocialPanelModel();

