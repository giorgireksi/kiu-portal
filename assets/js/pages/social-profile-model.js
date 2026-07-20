/* Social profile / people pure helpers.
 * Eager: social.html before social-page.js.
 * ESM leaf + classic bridge for defer/lazy consumers.
 */
'use strict';

function hooks() {
    return window.__kiuSocialProfileModelHooks || {};
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

function accountById(userId) {
    return pick('accountById', () => null)(userId);
}

function currentUserId() {
    return pick('currentUserId', () => '')();
}

function currentUser() {
    return pick('currentUser', () => null)();
}

function isJoinedGroup(group) {
    return pick('isJoinedGroup', () => false)(group);
}

function when(value) {
    return pick('when', (v) => String(v || ''))(value);
}

function currentFacultyCode() {
    return pick('currentFacultyCode', () => '')();
}

function connectionStatusFor(targetUserId) {
    const userId = currentUserId();
    const normalizedTargetId = text(targetUserId);
    const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
    const incoming = relationships.find((relationship) =>
        text(relationship?.type).toLowerCase() === 'connection-request'
        && text(relationship?.status).toLowerCase() === 'pending'
        && text(relationship?.fromId) === normalizedTargetId
        && text(relationship?.toId) === userId
    );
    if (incoming) return { state: 'incoming', relationship: incoming };
    const outgoing = relationships.find((relationship) =>
        text(relationship?.type).toLowerCase() === 'connection-request'
        && text(relationship?.status).toLowerCase() === 'pending'
        && text(relationship?.fromId) === userId
        && text(relationship?.toId) === normalizedTargetId
    );
    if (outgoing) return { state: 'outgoing', relationship: outgoing };
    const connection = relationships.find((relationship) =>
        text(relationship?.type).toLowerCase() === 'connection'
        && text(relationship?.status).toLowerCase() === 'accepted'
        && [text(relationship?.fromId), text(relationship?.toId)].includes(userId)
        && [text(relationship?.fromId), text(relationship?.toId)].includes(normalizedTargetId)
    );
    if (connection) return { state: 'connected', relationship: connection };
    return { state: 'none', relationship: null };
}

function profileAccount(userId) {
    const normalizedId = text(userId);
    if (!normalizedId) return null;
    return accountById(normalizedId);
}

function profilePosts(userId) {
    const normalizedId = text(userId);
    if (!normalizedId) return [];
    return (Array.isArray(state().feed) ? state().feed : [])
        .filter((post) => text(post.authorUserId) === normalizedId);
}

function profileFriends(userId) {
    const normalizedId = text(userId);
    if (!normalizedId) return [];
    const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
    const connectionIds = relationships
        .filter((rel) => {
            const type = text(rel.type).toLowerCase();
            const status = text(rel.status).toLowerCase();
            if (type !== 'connection' || status !== 'accepted') return false;
            return [text(rel.fromId), text(rel.toId)].includes(normalizedId);
        })
        .map((rel) => text(rel.fromId) === normalizedId ? text(rel.toId) : text(rel.fromId));
    return connectionIds.map((id) => accountById(id)).filter(Boolean);
}

function profileFriendCount(userId) {
    return profileFriends(userId).length;
}

function profilePostCount(userId) {
    return profilePosts(userId).length;
}

function profileBio(account) {
    return text(account?.bio || '');
}

function profileCover(account) {
    return text(account?.coverImage || '');
}

function profileEditable(account) {
    return text(account?.id) === currentUserId();
}

function profileFollowingItems(userId) {
    const normalizedId = text(userId);
    if (!normalizedId) return [];
    const runtime = state();
    const pages = (Array.isArray(runtime.social?.pages) ? runtime.social.pages : [])
        .filter((page) => normalizedId === currentUserId()
            ? Boolean(page?.isFollowing || page?.isManager)
            : text(page?.ownerUserId) === normalizedId || Array.isArray(page?.managerIds) && page.managerIds.some((id) => text(id) === normalizedId))
        .map((page) => ({
            type: 'page',
            id: text(page.id),
            name: text(page.name || 'Page'),
            subtitle: text(page.description || `${page.followerCount || 0} followers`)
        }));
    const groups = (Array.isArray(runtime.social?.groups) ? runtime.social.groups : [])
        .filter((group) => normalizedId === currentUserId()
            ? isJoinedGroup(group)
            : text(group?.ownerUserId) === normalizedId || Array.isArray(group?.managerIds) && group.managerIds.some((id) => text(id) === normalizedId))
        .map((group) => ({
            type: 'group',
            id: text(group.id),
            name: text(group.name || 'Group'),
            subtitle: text(group.description || `${group.memberCount || 0} members`)
        }));
    return [...pages, ...groups];
}

function profileFollowingCount(userId) {
    return profileFollowingItems(userId).length;
}

function mutualConnectionCount(targetUserId) {
    const normalizedTargetId = text(targetUserId);
    if (!normalizedTargetId || normalizedTargetId === currentUserId()) return 0;
    const mine = new Set(profileFriends(currentUserId()).map((friend) => text(friend?.id)));
    return profileFriends(normalizedTargetId).filter((friend) => mine.has(text(friend?.id))).length;
}

function pageParticipantIds(page) {
    return new Set([
        text(page?.ownerUserId),
        ...(Array.isArray(page?.adminIds) ? page.adminIds : []),
        ...(Array.isArray(page?.followerIds) ? page.followerIds : [])
    ].map((value) => text(value)).filter(Boolean));
}

function groupParticipantIds(group) {
    return new Set([
        text(group?.ownerUserId),
        ...(Array.isArray(group?.adminIds) ? group.adminIds : []),
        ...(Array.isArray(group?.memberIds) ? group.memberIds : []),
        ...(Array.isArray(group?.memberUserIds) ? group.memberUserIds : [])
    ].map((value) => text(value)).filter(Boolean));
}

function sharedGroupsWithUser(targetUserId) {
    const normalizedTargetId = text(targetUserId);
    if (!normalizedTargetId || normalizedTargetId === currentUserId()) return [];
    return (Array.isArray(state().social?.groups) ? state().social.groups : []).filter((group) => {
        const participants = groupParticipantIds(group);
        return participants.has(currentUserId()) && participants.has(normalizedTargetId);
    });
}

function sharedPagesWithUser(targetUserId) {
    const normalizedTargetId = text(targetUserId);
    if (!normalizedTargetId || normalizedTargetId === currentUserId()) return [];
    return (Array.isArray(state().social?.pages) ? state().social.pages : []).filter((page) => {
        const participants = pageParticipantIds(page);
        return participants.has(currentUserId()) && participants.has(normalizedTargetId);
    });
}

function personLatestPost(targetUserId) {
    const normalizedTargetId = text(targetUserId);
    return (Array.isArray(state().feed) ? state().feed : [])
        .filter((post) => text(post?.authorUserId) === normalizedTargetId)
        .sort((left, right) => String(right?.createdAt || '').localeCompare(String(left?.createdAt || '')))[0] || null;
}

function personActivityLabel(targetUserId) {
    const post = personLatestPost(targetUserId);
    if (!post?.createdAt) return 'New to social';
    const timestamp = new Date(post.createdAt).getTime();
    if (!Number.isFinite(timestamp)) return `Last posted ${when(post.createdAt)}`;
    const ageHours = Math.max(0, (Date.now() - timestamp) / 36e5);
    if (ageHours < 24) return 'Active today';
    if (ageHours < 24 * 7) return 'Active this week';
    return `Last posted ${when(post.createdAt)}`;
}

function personProfileCompleteness(account) {
    const checks = [
        text(account?.bio),
        text(account?.location),
        text(account?.website),
        Array.isArray(account?.interests) ? account.interests.length : text(account?.interests)
    ];
    const filled = checks.filter((value) => Array.isArray(value) ? value.length : Boolean(text(value))).length;
    return Math.round((filled / checks.length) * 100);
}

function isStaffAccount(account) {
    return ['professor', 'ta', 'admin', 'student_service'].includes(text(account?.role).toLowerCase());
}

function canPublishOfficialSurveys(account = currentUser()) {
    return isStaffAccount(account);
}

function personRoleBadges(account) {
    const badges = [];
    const role = text(account?.role).toLowerCase();
    if (role === 'professor') badges.push('Professor', 'Verified staff');
    else if (role === 'ta') badges.push('TA', 'Verified staff');
    else if (role === 'admin') badges.push('Admin', 'Verified staff');
    else if (role === 'student_service') badges.push('Student Service', 'Verified staff');
    const managesPage = (Array.isArray(state().social?.pages) ? state().social.pages : []).some((page) => pageParticipantIds(page).has(text(account?.id)) && (text(page?.ownerUserId) === text(account?.id) || (Array.isArray(page?.adminIds) ? page.adminIds : []).some((id) => text(id) === text(account?.id))));
    const managesGroup = (Array.isArray(state().social?.groups) ? state().social.groups : []).some((group) => groupParticipantIds(group).has(text(account?.id)) && (text(group?.ownerUserId) === text(account?.id) || (Array.isArray(group?.adminIds) ? group.adminIds : []).some((id) => text(id) === text(account?.id))));
    if (managesPage || managesGroup) badges.push('Club lead');
    return [...new Set(badges)];
}

function personSuggestionScore(account) {
    const sharedGroups = sharedGroupsWithUser(account?.id).length;
    const sharedPages = sharedPagesWithUser(account?.id).length;
    const mutuals = mutualConnectionCount(account?.id);
    const sameFaculty = text(account?.facultyCode || account?.faculty) === currentFacultyCode() ? 1 : 0;
    return (sharedGroups * 6) + (sharedPages * 4) + (mutuals * 3) + sameFaculty;
}

function personSuggestionReason(account) {
    const sharedGroups = sharedGroupsWithUser(account?.id);
    if (sharedGroups.length) return `${sharedGroups.length} shared group${sharedGroups.length === 1 ? '' : 's'}`;
    const sharedPages = sharedPagesWithUser(account?.id);
    if (sharedPages.length) return `${sharedPages.length} shared page${sharedPages.length === 1 ? '' : 's'}`;
    const mutuals = mutualConnectionCount(account?.id);
    if (mutuals) return `${mutuals} mutual connection${mutuals === 1 ? '' : 's'}`;
    if (text(account?.facultyCode || account?.faculty) === currentFacultyCode()) return 'Same faculty';
    return 'Campus suggestion';
}

function inviteEligibleGroups() {
    return (Array.isArray(state().social?.groups) ? state().social.groups : []).filter((group) => ['manager', 'member'].includes(text(group?.membershipState)));
}

function audienceBadge(post) {
    const audience = text(post?.audience || 'campus') || 'campus';
    const labels = {
        campus: 'Campus',
        faculty: 'Faculty',
        connections: 'Connections',
        group: 'Group members',
        page: 'Page followers'
    };
    return labels[audience] || 'Campus';
}

function feedReason(post, author) {
    const authorId = text(author?.id || post?.authorUserId);
    if (text(post?.scopeType) === 'group') return `Active in ${text(post?.scopeName || 'group')}`;
    if (text(post?.scopeType) === 'page') return `Update from ${text(post?.scopeName || 'page')}`;
    if (connectionStatusFor(authorId).state === 'connected') return 'From your campus network';
    if (text(author?.facultyCode || author?.faculty) && text(author?.facultyCode || author?.faculty) === currentFacultyCode()) return `Same faculty as you`;
    return `Visible to ${audienceBadge(post).toLowerCase()}`;
}


export const socialProfileModelApi = {
    connectionStatusFor,
    profileAccount,
    profilePosts,
    profileFriends,
    profileFriendCount,
    profilePostCount,
    profileBio,
    profileCover,
    profileEditable,
    profileFollowingItems,
    profileFollowingCount,
    mutualConnectionCount,
    pageParticipantIds,
    groupParticipantIds,
    sharedGroupsWithUser,
    sharedPagesWithUser,
    personLatestPost,
    personActivityLabel,
    personProfileCompleteness,
    isStaffAccount,
    canPublishOfficialSurveys,
    personRoleBadges,
    personSuggestionScore,
    personSuggestionReason,
    inviteEligibleGroups,
    audienceBadge,
    feedReason
};

/** Install classic window / Kiu surface (idempotent). */
export function installSocialProfileModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_PROFILE_MODEL_LOADED) {
        return target?.KiuSocialProfileModel || socialProfileModelApi;
    }
    target.__KIU_SOCIAL_PROFILE_MODEL_LOADED = true;
    target.__kiuSocialProfileModelExports = socialProfileModelApi;
    target.KiuSocialProfileModel = socialProfileModelApi;
    Object.keys(socialProfileModelApi).forEach((key) => {
        target[key] = socialProfileModelApi[key];
    });
    return socialProfileModelApi;
}

installSocialProfileModel();

