/* Social lite feed/page/group/event/survey/post mutation helpers.
 * Peeled from social-runtime-lite.js. Load before social-runtime-lite.js.
 */
(function initSocialLiteContentRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_LITE_CONTENT_LOADED) return;
    window.__KIU_SOCIAL_LITE_CONTENT_LOADED = true;

    window.__kiuCreateSocialLiteContentApi = function createKiuSocialLiteContentApi(deps) {
        const d = deps || {};
        function __lookup(name) {
            if (typeof d[name] === 'function') return d[name];
            if (typeof window[name] === 'function') return window[name];
            throw new Error('Missing social lite content dep: ' + name);
        }
        function text(...a) { return __lookup('text')(...a); }
        function currentUser(...a) { return __lookup('currentUser')(...a); }
        function currentUserId(...a) { return __lookup('currentUserId')(...a); }
        function portalRequest(...a) { return __lookup('portalRequest')(...a); }
        function hydrateRuntime(...a) { return __lookup('hydrateRuntime')(...a); }
        function setFlash(...a) { return __lookup('setFlash')(...a); }
        function queueRender(...a) { return __lookup('queueRender')(...a); }
        function loadSocialState(...a) { return __lookup('loadSocialState')(...a); }
        function mutationRequest(...a) { return __lookup('mutationRequest')(...a); }
        function invalidateSocialRenderCache(...a) { return __lookup('invalidateSocialRenderCache')(...a); }
        function invalidateSocialFeedRenderCache(...a) { return __lookup('invalidateSocialFeedRenderCache')(...a); }
        function mergeFeedPost(...a) { return __lookup('mergeFeedPost')(...a); }
        function cloneFeedPost(...a) { return __lookup('cloneFeedPost')(...a); }
        function findFeedCommentRecord(...a) { return __lookup('findFeedCommentRecord')(...a); }
        function applyOptimisticCommentReaction(...a) { return __lookup('applyOptimisticCommentReaction')(...a); }
        function applyOptimisticPostReaction(...a) { return __lookup('applyOptimisticPostReaction')(...a); }
        function ensureDirectChat(...a) { return __lookup('ensureDirectChat')(...a); }
        function ensureCallRuntime(...a) { return __lookup('ensureCallRuntime')(...a); }
        function ensureCallMedia(...a) { return __lookup('ensureCallMedia')(...a); }
        function attachLocalCallPreview(...a) { return __lookup('attachLocalCallPreview')(...a); }
        function teardownPeerConnection(...a) { return __lookup('teardownPeerConnection')(...a); }
        function stopCallMedia(...a) { return __lookup('stopCallMedia')(...a); }
        function finalizeCall(...a) { return __lookup('finalizeCall')(...a); }
        function resolveRemoteUserIdForChat(...a) { return __lookup('resolveRemoteUserIdForChat')(...a); }
        function readFileAsDataUrl(...a) { return __lookup('readFileAsDataUrl')(...a); }
        function fileUrl(...a) { return __lookup('fileUrl')(...a); }
        function isImageFile(...a) { return __lookup('isImageFile')(...a); }
        function nowLabel(...a) { return __lookup('nowLabel')(...a); }
        function makeId(...a) {
            const fn = (typeof d.makeId === 'function' && d.makeId)
                || (typeof window.makeId === 'function' && window.makeId)
                || (() => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
            return fn(...a);
        }
        function unique(...a) { return __lookup('unique')(...a); }
        function chatTitle(...a) { return __lookup('chatTitle')(...a); }
        function markChatMessagesRead(...a) { return __lookup('markChatMessagesRead')(...a); }
        function fetchAccountsByIds(...a) { return __lookup('fetchAccountsByIds')(...a); }
        function refreshFeed(...a) { return __lookup('refreshFeed')(...a); }
        function ensureActiveChat(...a) { return __lookup('ensureActiveChat')(...a); }
        const runtime = d.runtime || window.__kiuSocialLiteRuntime;
        void d;

function photographyPosts(feed = runtime.feed) {
    const items = Array.isArray(feed) ? feed : [];
    return items.filter((post) => text(post?.category) === 'Photography'
        && Array.isArray(post?.media)
        && post.media.some((media) => isImageFile(media)));
}

async function createPost(body, options = {}) {
    const userId = currentUserId();
    if (!userId) throw new Error('Session required.');
    const media = [];
    const sourceFile = options.file || null;
    if (sourceFile) {
        const fileScope = text(options.fileScope || options.scope || 'social') || 'social';
        if (typeof uploadPortalStoredFile === 'function') {
            const uploaded = await uploadPortalStoredFile(sourceFile, fileScope);
            if (uploaded?.storageKey) media.push(uploaded);
        }
        if (!media.length) {
            const dataUrl = text(sourceFile.dataUrl) || await readFileAsDataUrl(sourceFile);
            if (dataUrl) {
                media.push({
                    name: text(sourceFile.name || 'photo.jpg') || 'photo.jpg',
                    type: text(sourceFile.type || 'image/jpeg') || 'image/jpeg',
                    dataUrl
                });
            }
        }
        if (!media.length) throw new Error('Could not attach image to post.');
    }
    const entityLinks = Array.isArray(options.entityLinks)
        ? options.entityLinks
            .map((item) => ({
                type: text(item?.type || '').toLowerCase(),
                id: text(item?.id || '')
            }))
            .filter((item) => item.type && item.id)
            .slice(0, 5)
        : [];
    const payload = await portalRequest('/api/social/posts', {
        method: 'POST',
        body: JSON.stringify({
            authorUserId: userId,
            postedById: userId,
            scopeType: text(options.scopeType || 'profile') || 'profile',
            scopeId: text(options.scopeId || userId) || userId,
            scopeName: text(options.scopeName || ''),
            audience: text(options.audience || 'campus') || 'campus',
            postType: text(options.postType || 'post') || 'post',
            category: text(options.category || ''),
            photoMeta: options.photoMeta && typeof options.photoMeta === 'object' ? options.photoMeta : undefined,
            body: text(body),
            media,
            entityLinks,
            linkedSurveyId: text(options.linkedSurveyId || entityLinks.find((item) => item.type === 'survey')?.id || '')
        })
    });
    const created = payload?.post || null;
    if (created) {
        if (sourceFile) {
            const hasImageMedia = Array.isArray(created.media) && created.media.some((item) => isImageFile(item));
            if (!hasImageMedia) throw new Error('Photo published without an image attachment.');
        }
        const existing = Array.isArray(runtime.feed) ? runtime.feed : [];
        runtime.feed = [created, ...existing.filter((item) => text(item?.id) !== text(created.id))];
        await Promise.all([loadSocialState(true), refreshFeed(true)]);
        await fetchAccountsByIds([created.authorUserId]);
        setFlash('Post published.', 'success', { skipRender: true });
        queueRender('post-created');
    }
    return created;
}

async function reportSocialContent(targetEntityType, targetEntityId, reason, targetOwnerId = '') {
    const reporterUserId = currentUserId();
    if (!reporterUserId || !text(targetEntityType) || !text(targetEntityId)) return null;
    const payload = await portalRequest('/api/social/reports', {
        method: 'POST',
        body: JSON.stringify({
            reporterUserId,
            targetEntityType: text(targetEntityType),
            targetEntityId: text(targetEntityId),
            targetOwnerId: text(targetOwnerId || ''),
            reportReason: text(reason || 'Inappropriate content')
        })
    });
    const report = payload?.report || null;
    if (report) {
        runtime.social.reports = [report, ...(Array.isArray(runtime.social.reports) ? runtime.social.reports : [])];
    }
    setFlash('Report submitted.', 'success', { skipRender: true });
    return report;
}

async function reportPost(postId, reason) {
    return reportSocialContent('post', text(postId), reason);
}

async function createPage(input = {}) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest('/api/social/pages', {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            ownerUserId: actorId,
            name: text(input.name),
            description: text(input.description),
            visibility: text(input.visibility || 'public') || 'public',
            pageType: text(input.pageType || 'brand') || 'brand',
            category: text(input.category || ''),
            tagline: text(input.tagline || ''),
            about: text(input.about || ''),
            website: text(input.website || ''),
            contactEmail: text(input.contactEmail || ''),
            location: text(input.location || ''),
            actionLabel: text(input.actionLabel || ''),
            actionUrl: text(input.actionUrl || ''),
            avatarImage: text(input.avatarImage || ''),
            coverImage: text(input.coverImage || ''),
            official: Boolean(input.official),
            verified: Boolean(input.verified)
        })
    });
    await loadSocialState(true);
    setFlash('Page created.', 'success', { skipRender: true });
    return payload?.page || null;
}

async function createGroup(input = {}) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest('/api/social/groups', {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            ownerUserId: actorId,
            name: text(input.name),
            description: text(input.description),
            visibility: text(input.visibility || 'public') || 'public',
            type: text(input.type || 'standard') || 'standard',
            maxMembers: input.maxMembers ? Number(input.maxMembers) : null,
            tags: Array.isArray(input.tags) ? input.tags.map((tag) => text(tag)).filter(Boolean) : []
        })
    });
    await loadSocialState(true);
    setFlash('Group created.', 'success', { skipRender: true });
    return payload?.group || null;
}

async function createProject(input = {}) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const mediaItems = Array.isArray(input.mediaItems) ? [...input.mediaItems] : [];
    if (input.file && typeof uploadPortalStoredFile === 'function') {
        const uploaded = await uploadPortalStoredFile(input.file, 'portfolio');
        if (uploaded?.storageKey) mediaItems.push(uploaded);
    } else if (input.file?.dataUrl) {
        mediaItems.push(input.file);
    }
    const payload = await portalRequest('/api/social/projects', {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            ownerUserId: actorId,
            title: text(input.title || input.name),
            name: text(input.name),
            summary: text(input.summary),
            description: text(input.description),
            status: text(input.status || 'draft') || 'draft',
            visibility: text(input.visibility || 'public') || 'public',
            visibilityMode: text(input.visibilityMode || 'all_logged_in') || 'all_logged_in',
            courseTag: text(input.courseTag || ''),
            facultyCodes: Array.isArray(input.facultyCodes) ? input.facultyCodes.map((item) => text(item)).filter(Boolean) : [],
            facultyTags: Array.isArray(input.facultyTags) ? input.facultyTags.map((item) => text(item)).filter(Boolean) : [],
            skillTags: Array.isArray(input.skillTags) ? input.skillTags.map((item) => text(item)).filter(Boolean) : [],
            hashtags: Array.isArray(input.hashtags) ? input.hashtags.map((item) => text(item)).filter(Boolean) : [],
            mediaItems,
            externalLinks: Array.isArray(input.externalLinks) ? input.externalLinks : [],
            visibleRoles: Array.isArray(input.visibleRoles) ? input.visibleRoles.map((item) => text(item)).filter(Boolean) : [],
            visibleFacultyCodes: Array.isArray(input.visibleFacultyCodes) ? input.visibleFacultyCodes.map((item) => text(item)).filter(Boolean) : [],
            visibleUserIds: Array.isArray(input.visibleUserIds) ? input.visibleUserIds.map((item) => text(item)).filter(Boolean) : [],
            hiddenUserIds: Array.isArray(input.hiddenUserIds) ? input.hiddenUserIds.map((item) => text(item)).filter(Boolean) : [],
            advisorUserId: text(input.advisorUserId || ''),
            instructorViewerIds: Array.isArray(input.instructorViewerIds) ? input.instructorViewerIds.map((item) => text(item)).filter(Boolean) : [],
            inviteeIds: Array.isArray(input.inviteeIds) ? input.inviteeIds.map((item) => text(item)).filter(Boolean) : [],
            recommendedTeamSize: Number(input.recommendedTeamSize || 4),
            minTeamSize: Number(input.minTeamSize || 4),
            showcaseSummary: text(input.showcaseSummary || '')
        })
    });
    await hydrateRuntime(true);
    setFlash('Project workspace created.', 'success', { skipRender: true });
    return payload?.project || null;
}

async function updateProject(projectId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project workspace could not be updated.');
    const mediaItems = Array.isArray(input.mediaItems) ? [...input.mediaItems] : [];
    if (input.file && typeof uploadPortalStoredFile === 'function') {
        const uploaded = await uploadPortalStoredFile(input.file, 'portfolio');
        if (uploaded?.storageKey) mediaItems.push(uploaded);
    } else if (input.file?.dataUrl) {
        mediaItems.push(input.file);
    }
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            ...input,
            title: text(input.title || input.name),
            name: text(input.name || input.title),
            status: text(input.status || 'draft') || 'draft',
            visibility: text(input.visibility || 'public') || 'public',
            visibilityMode: text(input.visibilityMode || 'all_logged_in') || 'all_logged_in',
            mediaItems,
            externalLinks: Array.isArray(input.externalLinks) ? input.externalLinks : [],
            visibleRoles: Array.isArray(input.visibleRoles) ? input.visibleRoles.map((item) => text(item)).filter(Boolean) : [],
            visibleFacultyCodes: Array.isArray(input.visibleFacultyCodes) ? input.visibleFacultyCodes.map((item) => text(item)).filter(Boolean) : [],
            visibleUserIds: Array.isArray(input.visibleUserIds) ? input.visibleUserIds.map((item) => text(item)).filter(Boolean) : [],
            hiddenUserIds: Array.isArray(input.hiddenUserIds) ? input.hiddenUserIds.map((item) => text(item)).filter(Boolean) : []
        })
    });
    await hydrateRuntime(true);
    return payload?.project || null;
}

async function setProjectBaseline(projectId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project baseline could not be set.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/baseline`, {
        method: 'POST',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    setFlash('Project baseline saved — plan frozen for comparison.', 'success', { skipRender: true });
    return payload?.project || null;
}

function applyProjectGraphLocally(projectId, patch = {}) {
    const normalizedProjectId = text(projectId);
    if (!normalizedProjectId || !runtime.social || !patch || typeof patch !== 'object') return null;
    const projects = Array.isArray(runtime.social.projects) ? runtime.social.projects : [];
    const project = projects.find((entry) => text(entry?.id) === normalizedProjectId);
    if (!project) return null;
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphPositions')) {
        project.taskGraphPositions = patch.taskGraphPositions && typeof patch.taskGraphPositions === 'object' ? { ...patch.taskGraphPositions } : {};
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphView')) {
        project.taskGraphView = patch.taskGraphView && typeof patch.taskGraphView === 'object' ? { ...patch.taskGraphView } : null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphGroups')) {
        project.taskGraphGroups = Array.isArray(patch.taskGraphGroups) ? patch.taskGraphGroups.map((entry) => ({ ...entry })) : [];
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphUpdatedAt')) {
        project.taskGraphUpdatedAt = text(patch.taskGraphUpdatedAt || '');
    }
    return project;
}

async function updateProjectTaskGraph(projectId, patch = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Task map layout could not be updated.');
    const body = { actorId };
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphPositions')) body.taskGraphPositions = patch.taskGraphPositions;
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphView')) body.taskGraphView = patch.taskGraphView;
    if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphGroups')) body.taskGraphGroups = patch.taskGraphGroups;
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/task-graph`, {
        method: 'POST',
        body: JSON.stringify(body)
    });
    const project = payload?.project || null;
    if (project) applyProjectGraphLocally(projectId, project);
    return project;
}

async function deleteProject(projectId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project workspace could not be deleted.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}?actorId=${encodeURIComponent(actorId)}`, {
        method: 'DELETE'
    });
    await hydrateRuntime(true);
    setFlash('Portfolio entry removed.', 'success', { skipRender: true });
    return payload?.projectId || text(projectId);
}

const __socialLiteProject = typeof window.__kiuCreateSocialLiteProjectApi === 'function'
    ? window.__kiuCreateSocialLiteProjectApi({
        currentUserId,
        text,
        portalRequest,
        hydrateRuntime,
        setFlash,
        runtime
    })
    : {};
const {
    inviteProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
    setProjectMembership,
    createProjectTask,
    applyProjectTaskLocally,
    updateProjectTask,
    deleteProjectTask,
    createProjectBudgetCategory,
    updateProjectBudgetCategory,
    deleteProjectBudgetCategory,
    createProjectBudgetExpense,
    updateProjectBudgetExpense,
    deleteProjectBudgetExpense,
    createProjectRisk,
    updateProjectRisk,
    deleteProjectRisk,
    publishProjectShowcase
} = __socialLiteProject;


async function setGroupMembership(groupId, action = 'join') {
    const userId = currentUserId();
    if (!userId || !text(groupId)) throw new Error('Group membership action failed.');
    const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/membership`, {
        method: 'POST',
        body: JSON.stringify({
            actorId: userId,
            userId,
            action: text(action || 'join') || 'join'
        })
    });
    await loadSocialState(true);
    if (payload?.group?.chatId) await hydrateRuntime(true);
    else queueRender('group-membership');
    setFlash(action === 'leave' ? 'Group left.' : 'Group membership updated.', 'success', { skipRender: true });
    return payload?.group || null;
}

async function respondGroupMembership(groupId, memberId, accept = true) {
    const actorId = currentUserId();
    if (!actorId || !text(groupId) || !text(memberId)) throw new Error('Membership request could not be resolved.');
    const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/membership/${encodeURIComponent(text(memberId))}`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            accept: accept !== false
        })
    });
    await loadSocialState(true);
    if (payload?.group?.chatId) await hydrateRuntime(true);
    else queueRender('group-request');
    setFlash(accept ? 'Membership approved.' : 'Membership declined.', 'success', { skipRender: true });
    return payload?.group || null;
}

async function requestConnection(userId) {
    const actorId = currentUserId();
    if (!actorId || !text(userId)) throw new Error('Connection request failed.');
    const payload = await portalRequest('/api/social/relationships/request', {
        method: 'POST',
        body: JSON.stringify({
            fromUserId: actorId,
            toUserId: text(userId)
        })
    });
    const relationship = payload?.relationship || null;
    if (relationship?.id) mergeSocialRelationship(relationship);
    setFlash('Connection request sent.', 'success', { skipRender: true });
    return relationship;
}

async function respondConnection(relationshipId, accept = true) {
    const actorId = currentUserId();
    if (!actorId || !text(relationshipId)) throw new Error('Connection request could not be resolved.');
    const payload = await portalRequest(`/api/social/relationships/${encodeURIComponent(text(relationshipId))}/respond`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            accept: accept !== false
        })
    });
    if (payload?.request?.id) mergeSocialRelationship(payload.request);
    if (payload?.connection?.id) mergeSocialRelationship(payload.connection);
    setFlash(accept ? 'Connection accepted.' : 'Connection declined.', 'success', { skipRender: true });
    return payload;
}

async function removeConnection(userId) {
    const actorId = currentUserId();
    if (!actorId || !text(userId)) throw new Error('Connection could not be removed.');
    await portalRequest('/api/social/relationships/remove', {
        method: 'POST',
        body: JSON.stringify({
            userId: actorId,
            targetUserId: text(userId)
        })
    });
    removeSocialRelationshipsBetween(actorId, text(userId));
    setFlash('Connection removed.', 'success', { skipRender: true });
    return true;
}

async function hideChat(chatId) {
    const actorId = currentUserId();
    if (!actorId || !text(chatId)) throw new Error('Chat could not be hidden.');
    const payload = await portalRequest(`/api/messenger/chats/${encodeURIComponent(text(chatId))}/hide`, {
        method: 'POST',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    setFlash('Chat hidden from inbox.', 'success', { skipRender: true });
    return payload?.chat || null;
}

function unhideChatForUser(chatId, userId = currentUserId()) {
    const normalizedChatId = text(chatId);
    const normalizedUserId = text(userId);
    if (!normalizedChatId || !normalizedUserId) return null;
    const chat = runtime.chats.find((entry) => text(entry.id) === normalizedChatId);
    if (!chat || !Array.isArray(chat.members) || !chat.members.some((memberId) => text(memberId) === normalizedUserId)) {
        return null;
    }
    if (chat.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[normalizedUserId]) {
        delete chat.hiddenByUser[normalizedUserId];
        queueRender('chat-unhide');
    }
    return chat;
}

async function persistSocialStatePatch(patch = {}, reason = 'social-save') {
    const userId = currentUserId();
    if (!userId) throw new Error('Session required.');
    const payload = await portalRequest('/api/social/state', {
        method: 'POST',
        body: JSON.stringify({
            reason: text(reason || 'social-save') || 'social-save',
            social: patch && typeof patch === 'object' ? patch : {}
        })
    });
    const social = payload?.social && typeof payload.social === 'object' ? payload.social : null;
    if (social) {
        if (Array.isArray(social.lostFoundItems)) runtime.social.lostFoundItems = social.lostFoundItems;
        if (Array.isArray(social.surveys)) runtime.social.surveys = social.surveys;
        if (Array.isArray(social.surveyResponses)) runtime.social.surveyResponses = social.surveyResponses;
        queueRender('social-state-persist');
    }
    return social;
}

async function refreshNotifications(force = false) {
    const user = currentUser();
    if (!user?.id) return [];
    if (runtime.notificationsPromise && !force) return runtime.notificationsPromise;
    runtime.notificationsPromise = portalRequest(`/api/notifications?userId=${encodeURIComponent(text(user.id))}&limit=50`)
        .then((payload) => {
            runtime.notifications = Array.isArray(payload?.items) ? payload.items : [];
            runtime.stories = Array.isArray(payload?.stories) ? payload.stories : runtime.stories || [];
            queueRender('notifications-refresh');
            return runtime.notifications;
        })
        .catch(() => runtime.notifications || [])
        .finally(() => {
            runtime.notificationsPromise = null;
        });
    return runtime.notificationsPromise;
}

function applyFollowMutationLocally(targetType, targetId, payload = {}) {
    const userId = currentUserId();
    const normalizedType = text(targetType) === 'profile' ? 'profile' : text(targetType);
    const normalizedTargetId = text(targetId);
    if (!userId || !normalizedType || !normalizedTargetId) return;
    if (!runtime.social || typeof runtime.social !== 'object') runtime.social = {};
    if (!Array.isArray(runtime.social.relationships)) runtime.social.relationships = [];
    const nextFollowing = Boolean(payload?.following);
    runtime.social.relationships = runtime.social.relationships.filter((item) => !(
        text(item?.type).toLowerCase() === 'follow'
        && text(item?.fromId) === userId
        && text(item?.toType).toLowerCase() === normalizedType
        && text(item?.toId) === normalizedTargetId
    ));
    if (nextFollowing) {
        const relationship = payload?.relationship && typeof payload.relationship === 'object'
            ? payload.relationship
            : {
                id: text(makeId?.('rel') || `rel_${Date.now()}`),
                type: 'follow',
                fromId: userId,
                toType: normalizedType,
                toId: normalizedTargetId,
                status: 'accepted'
            };
        runtime.social.relationships.unshift(relationship);
    }
    if (normalizedType === 'page' && Array.isArray(runtime.social.pages)) {
        const page = runtime.social.pages.find((entry) => text(entry?.id) === normalizedTargetId);
        if (page) {
            const wasFollowing = Boolean(page.isFollowing);
            page.isFollowing = nextFollowing;
            if (wasFollowing !== nextFollowing) {
                page.followerCount = Math.max(0, Number(page.followerCount || 0) + (nextFollowing ? 1 : -1));
            }
        }
    }
}

async function toggleFollow(targetType, targetId, options = {}) {
    const userId = currentUserId();
    if (!userId || !text(targetType) || !text(targetId)) throw new Error('Follow state could not be updated.');
    const payload = await portalRequest('/api/social/follows/toggle', {
        method: 'POST',
        body: JSON.stringify({
            userId,
            targetType: text(targetType),
            targetId: text(targetId)
        })
    });
    applyFollowMutationLocally(targetType, targetId, payload);
    if (options.skipBootstrap) {
        loadSocialState(true, { skipRender: true }).catch(() => null);
    } else {
        await loadSocialState(true);
    }
    setFlash(payload?.following ? 'Now following.' : 'Follow removed.', 'success', { skipRender: true });
    return payload;
}

async function updatePost(postId, body) {
    const actorId = currentUserId();
    if (!actorId || !text(postId)) throw new Error('Post could not be updated.');
    const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}`, {
        method: 'PATCH',
        body: JSON.stringify({
            actorId,
            body: text(body)
        })
    });
    await Promise.all([loadSocialState(true), refreshFeed(true)]);
    setFlash('Post updated.', 'success', { skipRender: true });
    return payload?.post || null;
}

async function deletePost(postId) {
    const actorId = currentUserId();
    if (!actorId || !text(postId)) throw new Error('Post could not be deleted.');
    const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}`, {
        method: 'DELETE',
        body: JSON.stringify({ actorId })
    });
    await Promise.all([loadSocialState(true), refreshFeed(true)]);
    setFlash('Post deleted.', 'success', { skipRender: true });
    return payload?.ok !== false;
}

async function sharePost(postId, note = '') {
    const actorId = currentUserId();
    if (!actorId || !text(postId)) throw new Error('Post could not be shared.');
    const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}/share`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            authorUserId: actorId,
            note: text(note)
        })
    });
    await Promise.all([loadSocialState(true), refreshFeed(true)]);
    setFlash('Post shared.', 'success', { skipRender: true });
    return payload?.post || null;
}

async function reactToPost(postId, reactionType = 'like') {
    const userId = currentUserId();
    if (!userId || !text(postId)) throw new Error('Reaction could not be updated.');
    const normalizedPostId = text(postId);
    const normalizedReactionType = text(reactionType || 'like') || 'like';
    const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((entry) => text(entry?.id) === normalizedPostId);
    const rollbackPost = post ? cloneFeedPost(post) : null;
    const optimisticPost = post ? applyOptimisticPostReaction(post, userId, normalizedReactionType) : null;
    const patchOrQueue = (id) => {
        if (typeof window.__kiuSocialPatchPostReactions === 'function' && window.__kiuSocialPatchPostReactions(id)) return;
        queueRender('post-react');
    };
    if (optimisticPost?.id) {
        mergeFeedPost(optimisticPost);
        patchOrQueue(normalizedPostId);
    }
    try {
        const payload = await mutationRequest(`/api/social/posts/${encodeURIComponent(normalizedPostId)}/reactions`, {
            method: 'POST',
            body: JSON.stringify({
                userId,
                reactionType: normalizedReactionType
            })
        });
        const updatedPost = payload?.post || null;
        if (updatedPost?.id) {
            mergeFeedPost(updatedPost);
            patchOrQueue(normalizedPostId);
        }
        return updatedPost;
    } catch (error) {
        if (rollbackPost?.id) {
            mergeFeedPost(rollbackPost);
            patchOrQueue(normalizedPostId);
        }
        throw error;
    }
}

async function reactToComment(postId, commentId, reactionType = 'like') {
    const userId = currentUserId();
    if (!userId || !text(postId) || !text(commentId)) throw new Error('Comment reaction could not be updated.');
    const normalizedPostId = text(postId);
    const normalizedCommentId = text(commentId);
    const normalizedReactionType = text(reactionType || 'like') || 'like';
    const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((entry) => text(entry?.id) === normalizedPostId);
    const rollbackPost = post ? cloneFeedPost(post) : null;
    const optimisticPost = post ? applyOptimisticCommentReaction(post, normalizedCommentId, userId, normalizedReactionType) : null;
    const patchOrQueue = () => {
        // Surgical chip update in open comments dialog — never rebuild the feed/photo card behind.
        if (typeof window.__kiuSocialPatchCommentReactions === 'function'
            && window.__kiuSocialPatchCommentReactions(normalizedPostId, normalizedCommentId)) {
            return;
        }
        queueRender('comment-react');
    };
    if (optimisticPost?.id) {
        mergeFeedPost(optimisticPost);
        patchOrQueue();
    }
    try {
        const payload = await mutationRequest(`/api/social/posts/${encodeURIComponent(normalizedPostId)}/comments/${encodeURIComponent(normalizedCommentId)}/reactions`, {
            method: 'POST',
            body: JSON.stringify({
                userId,
                reactionType: normalizedReactionType
            })
        });
        const updatedPost = payload?.post || null;
        if (updatedPost?.id) {
            mergeFeedPost(updatedPost);
            patchOrQueue();
        }
        return updatedPost;
    } catch (error) {
        if (rollbackPost?.id) {
            mergeFeedPost(rollbackPost);
            patchOrQueue();
        }
        throw error;
    }
}

async function addComment(postId, body, options = {}) {
    const authorUserId = currentUserId();
    if (!authorUserId || !text(postId) || !text(body)) throw new Error('Comment could not be created.');
    const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((p) => text(p.id) === text(postId));
    const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}/comments`, {
        method: 'POST',
        body: JSON.stringify({
            authorUserId,
            body: text(body),
            parentCommentId: text(options.parentCommentId || options.replyToCommentId || ''),
            replyToCommentId: text(options.replyToCommentId || options.parentCommentId || '')
        })
    });
    // No toast for the actor's own comment/reply actions.
    const updatedPost = payload?.post || null;
    if (updatedPost && text(updatedPost.id)) {
        mergeFeedPost(updatedPost);
        if (!options.skipRender) queueRender('comment-created');
    } else {
        await refreshFeed(true);
    }
    return updatedPost;
}

async function removeComment(postId, commentId) {
    const authorUserId = currentUserId();
    if (!authorUserId || !text(postId) || !text(commentId)) throw new Error('Comment could not be removed.');
    const payload = await portalRequest(
        `/api/social/posts/${encodeURIComponent(text(postId))}/comments/${encodeURIComponent(text(commentId))}`,
        { method: 'DELETE' }
    );
    const updatedPost = payload?.post || null;
    if (updatedPost && text(updatedPost.id)) {
        mergeFeedPost(updatedPost);
    } else {
        await refreshFeed(true);
    }
    return updatedPost;
}

async function resolveSocialReport(reportId, action = 'dismiss', resolutionNote = '') {
    const actorId = currentUserId();
    if (!actorId || !text(reportId)) throw new Error('Report could not be resolved.');
    const payload = await portalRequest(`/api/social/reports/${encodeURIComponent(text(reportId))}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            action: text(action || 'dismiss') || 'dismiss',
            resolutionNote: text(resolutionNote || '')
        })
    });
    await loadSocialState(true);
    setFlash('Report updated.', 'success', { skipRender: true });
    return payload?.report || null;
}

async function pinSocialPost(postId) {
    const actorId = currentUserId();
    const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((entry) => text(entry.id) === text(postId));
    if (!actorId || !post) throw new Error('Post pin state could not be updated.');
    const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}/pin`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            scopeType: text(post.scopeType || ''),
            scopeId: text(post.scopeId || '')
        })
    });
    await refreshFeed(true);
    return payload?.post || null;
}

async function createEvent(input = {}) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest('/api/social/events', {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            createdById: actorId,
            title: text(input.title),
            description: text(input.description),
            startsAt: text(input.startsAt),
            endsAt: text(input.endsAt || input.startsAt),
            location: text(input.location),
            isOnline: Boolean(input.isOnline),
            onlineLink: text(input.onlineLink),
            joinMode: text(input.joinMode || 'open') || 'open',
            category: text(input.category || 'social') || 'social',
            maxSeats: input.maxSeats ? Number(input.maxSeats) : null,
            isRecurring: Boolean(input.isRecurring),
            imageUrl: text(input.imageUrl),
            isOfficial: Boolean(input.isOfficial),
            scopeType: text(input.scopeType || 'profile') || 'profile',
            scopeId: text(input.scopeId || actorId) || actorId,
            projectId: text(input.projectId || '')
        })
    });
    await loadSocialState(true);
    setFlash('Event created.', 'success', { skipRender: true });
    queueRender('event-created');
    return payload?.event || null;
}

async function updateEvent(eventId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(eventId)) throw new Error('Event could not be updated.');
    const body = {
        title: text(input.title),
        description: text(input.description),
        startsAt: text(input.startsAt),
        endsAt: text(input.endsAt || input.startsAt),
        location: text(input.location),
        isOnline: Boolean(input.isOnline),
        onlineLink: text(input.onlineLink),
        joinMode: text(input.joinMode || 'open') || 'open',
        category: text(input.category || 'social') || 'social',
        maxSeats: input.maxSeats ? Number(input.maxSeats) : null,
        isRecurring: Boolean(input.isRecurring),
        isOfficial: Boolean(input.isOfficial),
        scopeType: text(input.scopeType || 'profile') || 'profile',
        scopeId: text(input.scopeId || actorId) || actorId
    };
    if (text(input.imageUrl)) body.imageUrl = text(input.imageUrl);
    const payload = await portalRequest(`/api/social/events/${encodeURIComponent(text(eventId))}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
    await loadSocialState(true);
    setFlash('Event updated.', 'success', { skipRender: true });
    queueRender('event-updated');
    return payload?.event || null;
}

async function createSurvey(input = {}) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest('/api/social/surveys', {
        method: 'POST',
        body: JSON.stringify({
            title: text(input.title),
            description: text(input.description),
            closesAt: text(input.closesAt),
            allowAnonymous: Boolean(input.allowAnonymous),
            audience: text(input.audience || 'campus') || 'campus',
            visibility: text(input.visibility || 'public') || 'public',
            scopeType: text(input.scopeType || 'profile') || 'profile',
            scopeId: text(input.scopeId || actorId) || actorId,
            scopeName: text(input.scopeName || ''),
            promoteToFeed: Boolean(input.promoteToFeed),
            resultsVisibility: text(input.resultsVisibility || 'public_after_close') || 'public_after_close',
            isOfficial: Boolean(input.isOfficial),
            questions: Array.isArray(input.questions) ? input.questions : []
        })
    });
    await loadSocialState(true);
    await refreshFeed(true).catch(() => null);
    setFlash('Survey published.', 'success', { skipRender: true });
    return payload?.survey || null;
}

async function closeSurvey(surveyId) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}/close`, {
        method: 'POST',
        body: JSON.stringify({})
    });
    await loadSocialState(true);
    setFlash('Survey closed.', 'success', { skipRender: true });
    return payload?.survey || null;
}

async function respondSurvey(surveyId, answers = []) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}/respond`, {
        method: 'POST',
        body: JSON.stringify({ answers })
    });
    await loadSocialState(true);
    setFlash('Survey response submitted.', 'success', { skipRender: true });
    return payload?.survey || null;
}

async function loadSurveyResults(surveyId) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    const payload = await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}/results`);
    return payload?.results || null;
}

async function deleteSurvey(surveyId) {
    const actorId = currentUserId();
    if (!actorId) throw new Error('Session required.');
    await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}`, { method: 'DELETE' });
    await loadSocialState(true);
    setFlash('Survey removed.', 'success', { skipRender: true });
    return true;
}

function patchEventRsvp(eventId, status) {
    const normalizedId = text(eventId);
    const normalizedStatus = text(status || 'going') || 'going';
    const events = Array.isArray(runtime.social?.events) ? runtime.social.events : [];
    const eventItem = events.find((entry) => text(entry?.id) === normalizedId);
    if (!eventItem) {
        return { eventId: normalizedId, rollback: () => {} };
    }
    const previousStatus = text(eventItem.viewerRsvpStatus);
    const previousSummary = {
        going: Number(eventItem?.attendeeSummary?.going || 0),
        interested: Number(eventItem?.attendeeSummary?.interested || 0)
    };
    if (!eventItem.attendeeSummary || typeof eventItem.attendeeSummary !== 'object') {
        eventItem.attendeeSummary = { going: 0, interested: 0 };
    }
    if (previousStatus === 'going') eventItem.attendeeSummary.going = Math.max(0, eventItem.attendeeSummary.going - 1);
    if (previousStatus === 'interested') eventItem.attendeeSummary.interested = Math.max(0, eventItem.attendeeSummary.interested - 1);
    if (normalizedStatus === 'going') eventItem.attendeeSummary.going = eventItem.attendeeSummary.going + 1;
    if (normalizedStatus === 'interested') eventItem.attendeeSummary.interested = eventItem.attendeeSummary.interested + 1;
    eventItem.viewerRsvpStatus = normalizedStatus;
    return {
        eventId: normalizedId,
        rollback: () => {
            eventItem.viewerRsvpStatus = previousStatus;
            eventItem.attendeeSummary = { ...previousSummary };
        }
    };
}

async function respondEventRsvp(eventId, status = 'going') {
    const userId = currentUserId();
    if (!userId || !text(eventId)) throw new Error('RSVP could not be updated.');
    const patch = patchEventRsvp(eventId, status);
    if (typeof window.__kiuSocialPatchEventRsvp === 'function' && window.__kiuSocialPatchEventRsvp(eventId)) {
        // patched inline
    } else {
        queueRender('event-rsvp-optimistic');
    }
    try {
        const payload = await portalRequest(`/api/social/events/${encodeURIComponent(text(eventId))}/rsvp`, {
            method: 'POST',
            body: JSON.stringify({
                userId,
                status: text(status || 'going') || 'going'
            })
        });
        await loadSocialState(true);
        setFlash('Event response updated.', 'success', { skipRender: true });
        return payload?.event || null;
    } catch (error) {
        patch.rollback();
        if (typeof window.__kiuSocialPatchEventRsvp === 'function') {
            window.__kiuSocialPatchEventRsvp(eventId);
        } else {
            queueRender('event-rsvp-rollback');
        }
        setFlash('Could not save RSVP. Try again.', 'error', { skipRender: true });
        throw error;
    }
}

async function openGroupChat(groupId, options = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(groupId)) throw new Error('Group chat is not available.');
    const payload = await portalRequest('/api/social/group-chat', {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            groupId: text(groupId)
        })
    });
    if (payload?.chat) {
        upsertChat(payload.chat, true);
        await loadSocialState(true);
        if (!options?.skipRoute) routeToSocial('messages', text(payload.chat.id));
    }
    return payload?.chat || null;
}

async function sendMessage(chatId, textValue, file) {
    const senderId = currentUserId();
    const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
    if (!senderId || !chat) throw new Error('Chat is not available.');
    let preparedFile = null;
    if (file) {
        if (typeof uploadPortalStoredFile === 'function') {
            const uploaded = await uploadPortalStoredFile(file, 'messenger');
            if (uploaded?.storageKey) preparedFile = uploaded;
        } else if (text(file.dataUrl)) {
            preparedFile = file;
        }
    }
    const payload = await portalRequest('/api/messenger/message', {
        method: 'POST',
        body: JSON.stringify({
            chatId: text(chat.id),
            senderId,
            type: text(chat.type || 'direct') || 'direct',
            members: Array.isArray(chat.members) ? chat.members : [],
            message: {
                text: text(textValue),
                file: preparedFile
            }
        })
    });
    if (payload?.chat) upsertChat(payload.chat, true);
    return payload?.chat || null;
}

function upsertChat(chat, shouldRender = false) {
    const chatId = text(chat?.id);
    if (!chatId) return null;
    runtime.chats = runtime.chats.filter((entry) => text(entry.id) !== chatId);
    runtime.chats.unshift(chat);
    fetchAccountsByIds(chat.members || []).catch(() => null);
    ensureActiveChat();
    if (shouldRender) queueRender('chat-upsert');
    return chat;
}


function upsertCall(call, shouldRender = false) {
    const chatId = text(call?.chatId);
    if (!chatId) return null;
    runtime.calls = runtime.calls.filter((entry) => text(entry.chatId) !== chatId);
    runtime.calls.unshift(call);
    if (shouldRender) queueRender('call-upsert');
    return call;
}

async function startCall(chatId) {
    const user = currentUser();
    const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
    if (typeof RTCPeerConnection !== 'function') throw new Error('This browser does not support in-browser video calls.');
    if (!user?.id || !chat) throw new Error('Conversation is not available.');
    const remoteUserId = resolveRemoteUserIdForChat(chatId);
    if (!remoteUserId) throw new Error('A second participant is required.');
    const payload = await portalRequest('/api/calls/start', {
        method: 'POST',
        body: JSON.stringify({
            chatId: text(chat.id),
            fromUserId: text(user.id),
            toUserId: remoteUserId
        })
    });
    if (payload?.call) {
        runtime.calls = runtime.calls.filter((call) => text(call.chatId) !== text(payload.call.chatId));
        runtime.calls.unshift(payload.call);
        runtime.ui.callOpen = true;
        runtime.ui.callOverlayMinimized = false;
        runtime.ui.activeCallChatId = text(payload.call.chatId);
        runtime.ui.callMode = 'outgoing';
        runtime.ui.activeCallRemoteUserId = remoteUserId;
        runtime.ui.callStatus = 'ringing';
        runtime.ui.callMessage = 'Calling...';
        await ensureCallMedia();
        window.requestAnimationFrame(() => attachLocalCallPreview());
        queueRender('call-start');
    }
    return payload?.call || null;
}

async function acceptCall(chatId) {
    const remoteUserId = resolveRemoteUserIdForChat(chatId) || text(runtime.ui.activeCallRemoteUserId);
    const payload = await portalRequest('/api/calls/accept', {
        method: 'POST',
        body: JSON.stringify({
            chatId: text(chatId),
            fromUserId: currentUserId(),
            toUserId: remoteUserId
        })
    });
    if (payload?.call) {
        runtime.calls = runtime.calls.filter((call) => text(call.chatId) !== text(payload.call.chatId));
        runtime.calls.unshift(payload.call);
        runtime.ui.callOpen = true;
        runtime.ui.callOverlayMinimized = false;
        runtime.ui.activeCallChatId = text(payload.call.chatId);
        runtime.ui.activeCallRemoteUserId = remoteUserId;
        runtime.ui.callMode = 'connecting';
        runtime.ui.callStatus = 'connecting';
        runtime.ui.callMessage = 'Connecting...';
        await ensureCallMedia();
        window.requestAnimationFrame(() => attachLocalCallPreview());
        queueRender('call-accept');
    }
    return payload?.call || null;
}

async function declineCall(chatId) {
    const remoteUserId = resolveRemoteUserIdForChat(chatId) || text(runtime.ui.activeCallRemoteUserId);
    const payload = await portalRequest('/api/calls/decline', {
        method: 'POST',
        body: JSON.stringify({
            chatId: text(chatId),
            fromUserId: currentUserId(),
            toUserId: remoteUserId
        })
    });
    teardownPeerConnection();
    stopCallMedia();
    if (payload?.call) upsertCall(payload.call, true);
    else if (Array.isArray(runtime.calls)) {
        runtime.calls = runtime.calls.map((entry) => (
            text(entry.chatId) === text(chatId)
                ? { ...entry, status: 'declined', active: false }
                : entry
        ));
    }
    runtime.ui.callOpen = false;
    runtime.ui.callOverlayMinimized = false;
    runtime.ui.activeCallChatId = '';
    runtime.ui.activeCallRemoteUserId = '';
    runtime.ui.callMode = '';
    runtime.ui.callStatus = 'declined';
    runtime.ui.callMessage = 'Call declined.';
    queueRender('call-decline');
    return payload?.call || null;
}

async function endCall(chatId) {
    const remoteUserId = resolveRemoteUserIdForChat(chatId) || text(runtime.ui.activeCallRemoteUserId);
    const payload = await portalRequest('/api/calls/end', {
        method: 'POST',
        body: JSON.stringify({
            chatId: text(chatId),
            fromUserId: currentUserId(),
            toUserId: remoteUserId
        })
    });
    finalizeCall(false);
    queueRender('call-end');
    return payload?.call || null;
}

async function joinGroupCall(chatId) {
    const user = currentUser();
    const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
    if (!user?.id || !chat || text(chat.type || '') !== 'group') throw new Error('Group call is not available.');
    const existing = runtime.calls.find((entry) => text(entry.chatId) === text(chatId) && text(entry.mode || '') === 'group' && entry.active !== false);
    const payload = await portalRequest(existing ? '/api/calls/join' : '/api/calls/start', {
        method: 'POST',
        body: JSON.stringify(existing
            ? { chatId: text(chat.id), userId: text(user.id) }
            : { chatId: text(chat.id), fromUserId: text(user.id), mode: 'group' })
    });
    if (payload?.call) {
        upsertCall(payload.call, true);
        runtime.ui.callOpen = true;
        runtime.ui.callOverlayMinimized = false;
        runtime.ui.activeCallChatId = text(payload.call.chatId);
        runtime.ui.callMode = 'group';
        runtime.ui.activeCallRemoteUserId = '';
        runtime.ui.callStatus = 'active';
        runtime.ui.callMessage = 'Group call live.';
        await ensureCallMedia();
        window.requestAnimationFrame(() => attachLocalCallPreview());
    }
    return payload?.call || null;
}

async function leaveGroupCall(chatId) {
    const user = currentUser();
    if (!user?.id || !text(chatId)) throw new Error('Group call is not available.');
    const payload = await portalRequest('/api/calls/leave', {
        method: 'POST',
        body: JSON.stringify({
            chatId: text(chatId),
            userId: text(user.id)
        })
    });
    if (payload?.call) upsertCall(payload.call, true);
    teardownPeerConnection();
    stopCallMedia();
    runtime.ui.callOpen = false;
    runtime.ui.callOverlayMinimized = false;
    runtime.ui.activeCallChatId = '';
    runtime.ui.activeCallRemoteUserId = '';
    runtime.ui.callMode = '';
    runtime.ui.callStatus = payload?.call?.active ? 'active' : 'ended';
    runtime.ui.callMessage = payload?.call?.active ? 'You left the group call.' : 'Group call ended.';
    queueRender('group-call-leave');
    return payload?.call || null;
}


        const api = {
            photographyPosts,
            createPost,
            reportSocialContent,
            reportPost,
            createPage,
            createGroup,
            createProject,
            updateProject,
            setProjectBaseline,
            applyProjectGraphLocally,
            updateProjectTaskGraph,
            deleteProject,
            setGroupMembership,
            respondGroupMembership,
            requestConnection,
            respondConnection,
            removeConnection,
            hideChat,
            unhideChatForUser,
            persistSocialStatePatch,
            refreshNotifications,
            applyFollowMutationLocally,
            toggleFollow,
            updatePost,
            deletePost,
            sharePost,
            reactToPost,
            reactToComment,
            addComment,
            removeComment,
            resolveSocialReport,
            pinSocialPost,
            createEvent,
            updateEvent,
            createSurvey,
            closeSurvey,
            respondSurvey,
            loadSurveyResults,
            deleteSurvey,
            patchEventRsvp,
            respondEventRsvp,
            openGroupChat,
            sendMessage,
            upsertChat,
            upsertCall,
            startCall,
            acceptCall,
            declineCall,
            endCall,
            joinGroupCall,
            leaveGroupCall,
        };
        Object.assign(window, api);
        return api;
    };
})();
