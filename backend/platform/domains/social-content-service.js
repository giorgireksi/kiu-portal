const {
    asArray,
    clone,
    makeId,
    normalizeCode,
    nowIso,
    safeNumber,
    uniqueStrings
} = require('../utils');

function socialText(value) {
    return String(value || '').trim();
}

function socialIdArray(values) {
    return uniqueStrings(
        asArray(values)
            .map(value => {
                if (value && typeof value === 'object') return socialText(value.id || value.userId || value.value);
                return socialText(value);
            })
            .filter(Boolean)
    );
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function normalizeSocialScopeType(value) {
    const normalized = socialText(value).toLowerCase();
    if (['profile', 'page', 'group'].includes(normalized)) return normalized;
    return 'profile';
}

function normalizeSocialAudience(value) {
    const normalized = socialText(value).toLowerCase();
    if (['campus', 'faculty', 'group', 'page', 'connections', 'private'].includes(normalized)) return normalized;
    return 'campus';
}

function normalizeSocialVisibility(value, fallback = 'public') {
    const normalized = socialText(value).toLowerCase();
    if (['public', 'private', 'faculty'].includes(normalized)) return normalized;
    return socialText(fallback).toLowerCase() || 'public';
}

function normalizeSocialReactionType(value) {
    const normalized = socialText(value).toLowerCase();
    return normalized || 'like';
}

function normalizeSocialRsvpStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['going', 'interested', 'declined'].includes(normalized)) return normalized;
    return 'going';
}

function normalizeSafeExternalUrl(value = '') {
    const raw = socialText(value);
    if (!raw) return '';
    if (/^(mailto:|tel:)/i.test(raw)) return raw;
    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch (error) {}
    return '';
}

function extractSocialMentions(value) {
    const textValue = socialText(value);
    if (!textValue) return [];
    const matches = textValue.match(/@([A-Za-z0-9._-]+)/g) || [];
    return uniqueStrings(matches.map(item => socialText(item).replace(/^@+/, '')));
}

function getSocialAccount(userId) {
    return this.state.accounts[socialText(userId)] || null;
}

function isSocialAdmin(userId) {
    return socialText(getSocialAccount.call(this, userId)?.role).toLowerCase() === 'admin';
}

function isSocialStaffViewer(userId) {
    return ['admin', 'student_service'].includes(
        socialText(getSocialAccount.call(this, userId)?.role).toLowerCase()
    );
}

function getSocialActorDisplayName(userId) {
    const account = getSocialAccount.call(this, userId);
    return socialText(account?.displayName || account?.nameEn || account?.name || account?.email || userId || 'Portal user');
}

function getSocialMentionableAccounts() {
    return Object.values(this.state.accounts || {}).filter(item => item && typeof item === 'object');
}

function resolveSocialMentionUserIds(value) {
    const tokens = extractSocialMentions(value);
    if (!tokens.length) return [];
    const accounts = getSocialMentionableAccounts.call(this);
    return uniqueStrings(tokens.map(token => {
        const normalizedToken = socialText(token).toLowerCase().replace(/^@+/, '').replace(/\s+/g, '');
        const match = accounts.find(account => {
            const candidates = [
                account?.id,
                account?.username,
                account?.handle,
                account?.displayName,
                account?.nameEn,
                account?.name,
                account?.email ? String(account.email).split('@')[0] : ''
            ].map(item => socialText(item).toLowerCase().replace(/\s+/g, ''));
            return candidates.includes(normalizedToken);
        });
        return match ? socialText(match.id) : '';
    })).filter(Boolean);
}

function notifySocialMentions({ actorId = '', targetType = 'post', targetId = '', sourceText = '', body = '' } = {}) {
    const normalizedActorId = socialText(actorId);
    const mentionUserIds = resolveSocialMentionUserIds.call(this, sourceText || body);
    const actorName = getSocialActorDisplayName.call(this, normalizedActorId);
    mentionUserIds.forEach(userId => {
        if (!userId || userId === normalizedActorId) return;
        this.createNotification({
            recipientUserId: userId,
            sourceDomain: 'social',
            type: 'mention',
            title: 'You were mentioned',
            body: `${actorName} mentioned you in a ${targetType}.`,
            routePage: 'social',
            targetType,
            targetId: socialText(targetId)
        });
    });
    return mentionUserIds;
}

function getSocialPageRecord(pageId) {
    return asArray(this.state.social.pages).find(item => socialText(item?.id) === socialText(pageId)) || null;
}

function getSocialGroupRecord(groupId) {
    return asArray(this.state.social.groups).find(item => socialText(item?.id) === socialText(groupId)) || null;
}

function getSocialGroupByChatId(chatId) {
    return asArray(this.state.social.groups).find(item => socialText(item?.chatId) === socialText(chatId)) || null;
}

function getSocialPostRecord(postId) {
    return asArray(this.state.social.posts).find(item => socialText(item?.id) === socialText(postId)) || null;
}

function getSocialEventRecord(eventId) {
    return asArray(this.state.social.events).find(item => socialText(item?.id) === socialText(eventId)) || null;
}

function getSocialRelationshipRecord(relationshipId) {
    return asArray(this.state.social.relationships).find(item => socialText(item?.id) === socialText(relationshipId)) || null;
}

function getSocialGroupMemberIds(group) {
    if (!group || typeof group !== 'object') return [];
    return uniqueStrings([
        socialText(group.ownerUserId || group.ownerId || ''),
        ...socialIdArray(group.adminIds || group.admins || []),
        ...socialIdArray(group.memberIds || group.members || [])
    ]);
}

function getSocialGroupJoinMap(group) {
    if (!group || typeof group !== 'object') return {};
    const existing = group.joinedAtByUser && typeof group.joinedAtByUser === 'object'
        ? clone(group.joinedAtByUser)
        : {};
    const orderedIds = uniqueStrings([
        socialText(group.ownerUserId || group.ownerId || ''),
        ...socialIdArray(group.memberIds || group.members || []),
        ...socialIdArray(group.adminIds || group.admins || [])
    ]);
    const createdAt = socialText(group.createdAt || nowIso()) || nowIso();
    const createdAtMs = Number.isFinite(Date.parse(createdAt)) ? Date.parse(createdAt) : Date.now();
    orderedIds.forEach((memberId, index) => {
        if (!memberId) return;
        if (!socialText(existing[memberId])) {
            existing[memberId] = new Date(createdAtMs + index).toISOString();
        }
    });
    Object.keys(existing).forEach((memberId) => {
        if (!orderedIds.includes(memberId)) delete existing[memberId];
    });
    return existing;
}

function getNextSocialGroupOwnerId(group, excludeUserId = '') {
    if (!group || typeof group !== 'object') return '';
    const excluded = socialText(excludeUserId);
    const joinMap = getSocialGroupJoinMap.call(this, group);
    const candidateOrder = uniqueStrings([
        ...socialIdArray(group.memberIds || group.members || []),
        ...socialIdArray(group.adminIds || group.admins || [])
    ]).filter(memberId => memberId && memberId !== excluded);
    const orderLookup = new Map(candidateOrder.map((memberId, index) => [memberId, index]));
    candidateOrder.sort((left, right) => {
        const leftTime = socialText(joinMap[left] || '');
        const rightTime = socialText(joinMap[right] || '');
        const leftMs = Number.isFinite(Date.parse(leftTime)) ? Date.parse(leftTime) : Number.MAX_SAFE_INTEGER;
        const rightMs = Number.isFinite(Date.parse(rightTime)) ? Date.parse(rightTime) : Number.MAX_SAFE_INTEGER;
        if (leftMs !== rightMs) return leftMs - rightMs;
        return (orderLookup.get(left) ?? Number.MAX_SAFE_INTEGER) - (orderLookup.get(right) ?? Number.MAX_SAFE_INTEGER);
    });
    return socialText(candidateOrder[0] || '');
}

function normalizeSocialGroupState(group) {
    if (!group || typeof group !== 'object') return group;
    const ownerUserId = socialText(group.ownerUserId || group.ownerId || '');
    const adminIds = socialIdArray(group.adminIds || group.admins || []).filter(memberId => memberId && memberId !== ownerUserId);
    const memberIds = socialIdArray(group.memberIds || group.members || []).filter(memberId => memberId && memberId !== ownerUserId && !adminIds.includes(memberId));
    group.ownerUserId = ownerUserId;
    group.adminIds = adminIds;
    group.memberIds = memberIds;
    group.pendingMemberIds = socialIdArray(group.pendingMemberIds || group.pendingMembers || [])
        .filter(memberId => memberId && memberId !== ownerUserId && !adminIds.includes(memberId) && !memberIds.includes(memberId));
    group.joinedAtByUser = getSocialGroupJoinMap.call(this, {
        ...group,
        ownerUserId,
        adminIds,
        memberIds
    });
    return group;
}

function getSocialGroupPendingIds(group) {
    if (!group || typeof group !== 'object') return [];
    return socialIdArray(group.pendingMemberIds || group.pendingMembers || []);
}

function getSocialPageManagerIds(page) {
    if (!page || typeof page !== 'object') return [];
    return uniqueStrings([
        socialText(page.ownerUserId || page.ownerId || ''),
        ...socialIdArray(page.adminIds || page.admins || [])
    ]);
}

function getSocialActorFacultyCode(userId) {
    return normalizeCode(getSocialAccount.call(this, userId)?.facultyCode || getSocialAccount.call(this, userId)?.faculty || '');
}

function canManageSocialPage(page, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !page) return false;
    return isSocialAdmin.call(this, normalizedUserId) || getSocialPageManagerIds.call(this, page).includes(normalizedUserId);
}

function canManageSocialGroup(group, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !group) return false;
    return isSocialAdmin.call(this, normalizedUserId) || uniqueStrings([
        socialText(group.ownerUserId || group.ownerId || ''),
        ...socialIdArray(group.adminIds || group.admins || [])
    ]).includes(normalizedUserId);
}

function isSocialGroupMember(group, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !group) return false;
    return getSocialGroupMemberIds.call(this, group).includes(normalizedUserId);
}

function getSocialScopeRecord(scopeType, scopeId) {
    const normalizedScopeType = normalizeSocialScopeType(scopeType);
    const normalizedScopeId = socialText(scopeId);
    if (normalizedScopeType === 'page') return getSocialPageRecord.call(this, normalizedScopeId);
    if (normalizedScopeType === 'group') return getSocialGroupRecord.call(this, normalizedScopeId);
    return null;
}

function canManageSocialScope(scopeType, scopeId, userId) {
    const record = getSocialScopeRecord.call(this, scopeType, scopeId);
    if (!record) return false;
    const normalizedType = normalizeSocialScopeType(scopeType);
    if (normalizedType === 'page') return canManageSocialPage.call(this, record, userId);
    if (normalizedType === 'group') return canManageSocialGroup.call(this, record, userId);
    return false;
}

function canViewSocialPage(page, userId) {
    if (!page) return false;
    const visibility = normalizeSocialVisibility(page.visibility, 'public');
    if (visibility === 'public') return true;
    if (!socialText(userId)) return false;
    if (canManageSocialPage.call(this, page, userId)) return true;
    if (visibility === 'faculty') {
        return getSocialActorFacultyCode.call(this, userId) === normalizeCode(page.facultyCode || page.faculty || '');
    }
    return false;
}

function canViewSocialGroup(group, userId) {
    if (!group) return false;
    const visibility = normalizeSocialVisibility(group.visibility, 'public');
    if (visibility === 'public') return true;
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId) return false;
    if (canManageSocialGroup.call(this, group, normalizedUserId)) return true;
    if (isSocialGroupMember.call(this, group, normalizedUserId)) return true;
    if (isSocialStaffViewer.call(this, normalizedUserId)) {
        const facultyCode = normalizeCode(group.facultyCode || group.faculty || '');
        return !facultyCode || getSocialActorFacultyCode.call(this, normalizedUserId) === facultyCode;
    }
    if (visibility === 'faculty') {
        return getSocialActorFacultyCode.call(this, normalizedUserId) === normalizeCode(group.facultyCode || group.faculty || '');
    }
    return false;
}

function canViewSocialEvent(event, userId) {
    if (!event) return false;
    const visibility = normalizeSocialVisibility(event.visibility, 'public');
    if (visibility === 'public') return true;
    if (!socialText(userId)) return false;
    if (isSocialAdmin.call(this, userId) || socialText(event.createdById) === socialText(userId)) return true;
    if (socialText(event.projectId || event.hostProjectId)) {
        const project = this.getSocialProjectRecord(event.projectId || event.hostProjectId);
        if (project && this.canViewSocialProject(project, userId)) return true;
    }
    if (event.hostGroupId) {
        const group = getSocialGroupRecord.call(this, event.hostGroupId);
        if (group && (canManageSocialGroup.call(this, group, userId) || isSocialGroupMember.call(this, group, userId))) return true;
    }
    if (visibility === 'faculty') {
        return getSocialActorFacultyCode.call(this, userId) === normalizeCode(event.facultyCode || event.audienceFacultyCode || '');
    }
    return false;
}

function canDeleteSocialGroup(group, userId) {
    return canManageSocialGroup.call(this, group, userId);
}

function canDeleteSocialPage(page, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !page) return false;
    return socialText(page.ownerUserId || page.ownerId || '') === normalizedUserId;
}

function canDeleteSocialEvent(event, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !event) return false;
    if (isSocialAdmin.call(this, normalizedUserId)) return true;
    if (socialText(event.createdById) === normalizedUserId) return true;
    if (socialText(event.projectId || event.hostProjectId)) {
        const project = this.getSocialProjectRecord(event.projectId || event.hostProjectId);
        if (project && this.canManageSocialProject(project, normalizedUserId)) return true;
    }
    if (socialText(event.scopeType) === 'profile' && socialText(event.scopeId) === normalizedUserId) return true;
    if (socialText(event.scopeType) === 'page') {
        const hostPage = getSocialPageRecord.call(this, event.scopeId);
        if (hostPage && canManageSocialPage.call(this, hostPage, normalizedUserId)) return true;
    }
    if (socialText(event.hostGroupId)) {
        const hostGroup = getSocialGroupRecord.call(this, event.hostGroupId);
        if (hostGroup && canManageSocialGroup.call(this, hostGroup, normalizedUserId)) return true;
    }
    return false;
}

function canEditSocialEvent(event, userId) {
    return canDeleteSocialEvent.call(this, event, userId);
}

function canEditSocialPost(post, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !post) return false;
    if (isSocialAdmin.call(this, normalizedUserId)) return true;
    if (socialText(post.authorUserId || post.postedById || post.authorId) === normalizedUserId) return true;
    if (normalizeSocialScopeType(post.scopeType) === 'page') {
        return canManageSocialPage.call(this, getSocialPageRecord.call(this, post.scopeId), normalizedUserId);
    }
    if (normalizeSocialScopeType(post.scopeType) === 'group') {
        return canManageSocialGroup.call(this, getSocialGroupRecord.call(this, post.scopeId), normalizedUserId);
    }
    return false;
}

function canViewSocialPost(post, userId) {
    if (!post) return false;
    const normalizedUserId = socialText(userId);
    const scopeType = normalizeSocialScopeType(post.scopeType || 'profile');
    const scopeId = socialText(post.scopeId || (scopeType === 'profile' ? (post.authorUserId || post.postedById || post.authorId) : ''));
    const audience = normalizeSocialAudience(post.audience || (scopeType === 'group' ? 'group' : scopeType === 'page' ? 'page' : 'campus'));
    const authorUserId = socialText(post.authorUserId || post.postedById || post.authorId);

    if (scopeType === 'page' && !canViewSocialPage.call(this, getSocialPageRecord.call(this, scopeId), normalizedUserId)) return false;
    if (scopeType === 'group' && !canViewSocialGroup.call(this, getSocialGroupRecord.call(this, scopeId), normalizedUserId)) return false;

    if (audience === 'private') {
        if (!normalizedUserId) return false;
        return normalizedUserId === authorUserId || canEditSocialPost.call(this, post, normalizedUserId);
    }
    if (audience === 'connections') {
        if (!normalizedUserId) return false;
        return normalizedUserId === authorUserId || this.isSocialConnection(authorUserId, normalizedUserId);
    }
    if (audience === 'faculty') {
        if (!normalizedUserId) return false;
        const facultyCode = normalizeCode(post.audienceFacultyCode || post.authorFacultyCode || getSocialActorFacultyCode.call(this, authorUserId));
        return !facultyCode || getSocialActorFacultyCode.call(this, normalizedUserId) === facultyCode;
    }
    if (audience === 'group') {
        const group = getSocialGroupRecord.call(this, scopeId);
        return canViewSocialGroup.call(this, group, normalizedUserId);
    }
    return true;
}

function buildSocialCommentTree(comments = []) {
    const nodes = asArray(comments).map(comment => normalizeSocialComment.call(this, comment));
    const byId = new Map();
    const roots = [];
    nodes.forEach(comment => {
        byId.set(socialText(comment.id), { ...comment, replies: [] });
    });
    byId.forEach(comment => {
        const parentId = socialText(comment.parentCommentId || '');
        if (parentId && byId.has(parentId)) {
            byId.get(parentId).replies.push(comment);
        } else {
            roots.push(comment);
        }
    });
    const sortComments = list => {
        list.sort((left, right) => String(left?.createdAt || '').localeCompare(String(right?.createdAt || '')));
        list.forEach(comment => sortComments(comment.replies));
        return list;
    };
    return sortComments(roots);
}

function findSocialCommentRecord(comments = [], commentId = '') {
    const normalizedCommentId = socialText(commentId);
    if (!normalizedCommentId) return null;
    const stack = [...asArray(comments)];
    while (stack.length) {
        const comment = stack.shift();
        if (!comment || typeof comment !== 'object') continue;
        if (socialText(comment.id) === normalizedCommentId) return comment;
        if (Array.isArray(comment.replies) && comment.replies.length) {
            stack.push(...comment.replies);
        }
    }
    return null;
}

function collectSocialCommentThreadIds(comments = [], commentId = '') {
    const normalizedCommentId = socialText(commentId);
    if (!normalizedCommentId) return [];
    const byParent = new Map();
    asArray(comments)
        .map(comment => normalizeSocialComment.call(this, comment))
        .forEach(comment => {
            const parentId = socialText(comment.parentCommentId || '');
            if (!byParent.has(parentId)) byParent.set(parentId, []);
            byParent.get(parentId).push(comment);
        });
    const collected = [];
    const stack = [normalizedCommentId];
    while (stack.length) {
        const currentId = stack.pop();
        if (!currentId || collected.includes(currentId)) continue;
        collected.push(currentId);
        (byParent.get(currentId) || []).forEach(child => stack.push(socialText(child.id)));
    }
    return collected;
}

function normalizeSocialComment(comment = {}) {
    const reactionMap = comment.reactions && typeof comment.reactions === 'object' ? clone(comment.reactions) : {};
    if (!Array.isArray(reactionMap.like) && Array.isArray(comment.likes)) reactionMap.like = socialIdArray(comment.likes);
    Object.keys(reactionMap).forEach(key => {
        reactionMap[key] = socialIdArray(reactionMap[key]);
    });
    const reactionCounts = Object.keys(reactionMap).reduce((accumulator, key) => {
        accumulator[key] = reactionMap[key].length;
        return accumulator;
    }, {});
    return {
        id: socialText(comment.id || makeId('comment')),
        authorUserId: socialText(comment.authorUserId || comment.authorId || ''),
        authorName: socialText(comment.authorName || getSocialActorDisplayName.call(this, comment.authorUserId || comment.authorId || '')),
        body: socialText(comment.body || comment.text || ''),
        text: socialText(comment.text || comment.body || ''),
        parentCommentId: socialText(comment.parentCommentId || comment.replyToCommentId || ''),
        mentions: socialIdArray(comment.mentions || comment.mentionedUserIds || []),
        reactions: reactionMap,
        likes: reactionMap.like || [],
        reactionCounts,
        createdAt: socialText(comment.createdAt || nowIso()),
        updatedAt: socialText(comment.updatedAt || comment.createdAt || nowIso())
    };
}

function getSocialProfileRecord(userId = '') {
    const normalizedUserId = socialText(userId);
    const stored = normalizedUserId && this.state.social?.profiles && typeof this.state.social.profiles === 'object'
        ? clone(this.state.social.profiles[normalizedUserId] || {})
        : {};
    return {
        userId: normalizedUserId,
        visibility: normalizeSocialVisibility(stored.visibility, 'public'),
        defaultAudience: normalizeSocialAudience(stored.defaultAudience || 'campus'),
        digestFrequency: ['off', 'daily', 'weekly'].includes(socialText(stored.digestFrequency).toLowerCase())
            ? socialText(stored.digestFrequency).toLowerCase()
            : 'daily',
        eventReminderLeadHours: Math.max(1, safeNumber(stored.eventReminderLeadHours, 24) || 24),
        updatedAt: socialText(stored.updatedAt || nowIso())
    };
}

function upsertSocialProfile(userId = '', payload = {}, actorId = '') {
    const normalizedUserId = socialText(userId || payload.userId || '');
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!normalizedUserId || (normalizedActorId && normalizedActorId !== normalizedUserId && !isSocialAdmin.call(this, normalizedActorId))) return null;
    if (!this.state.social.profiles || typeof this.state.social.profiles !== 'object') this.state.social.profiles = {};
    const beforeState = clone(this.state.social.profiles[normalizedUserId] || {}) || null;
    const nextProfile = {
        ...getSocialProfileRecord.call(this, normalizedUserId),
        visibility: normalizeSocialVisibility(payload.visibility || beforeState?.visibility || 'public', 'public'),
        defaultAudience: normalizeSocialAudience(payload.defaultAudience || beforeState?.defaultAudience || 'campus'),
        digestFrequency: ['off', 'daily', 'weekly'].includes(socialText(payload.digestFrequency || beforeState?.digestFrequency).toLowerCase())
            ? socialText(payload.digestFrequency || beforeState?.digestFrequency).toLowerCase()
            : 'daily',
        eventReminderLeadHours: Math.max(1, safeNumber(payload.eventReminderLeadHours, beforeState?.eventReminderLeadHours || 24) || 24),
        updatedAt: nowIso()
    };
    this.state.social.profiles[normalizedUserId] = nextProfile;
    this.saveSocialMutation(normalizedActorId || normalizedUserId, 'profile-settings-updated', 'social-profile', normalizedUserId, beforeState, nextProfile);
    return clone(nextProfile);
}

function toggleSocialScopePostPin(scopeType, scopeId, postId, actorId = '') {
    const normalizedScopeType = normalizeSocialScopeType(scopeType);
    const normalizedScopeId = socialText(scopeId);
    const normalizedPostId = socialText(postId);
    const normalizedActorId = socialText(actorId);
    const post = getSocialPostRecord.call(this, normalizedPostId);
    const scope = getSocialScopeRecord.call(this, normalizedScopeType, normalizedScopeId);
    if (!post || !scope || !normalizedActorId || !canManageSocialScope.call(this, normalizedScopeType, normalizedScopeId, normalizedActorId)) return null;
    const beforeState = clone(scope);
    scope.pinnedPostIds = socialIdArray(scope.pinnedPostIds || scope.pinnedPosts || []);
    if (scope.pinnedPostIds.includes(normalizedPostId)) {
        scope.pinnedPostIds = scope.pinnedPostIds.filter(item => item !== normalizedPostId);
    } else {
        scope.pinnedPostIds.unshift(normalizedPostId);
    }
    scope.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, scope.pinnedPostIds.includes(normalizedPostId) ? 'post-pinned' : 'post-unpinned', `social-${normalizedScopeType}`, normalizedScopeId, beforeState, scope);
    return decorateSocialPost.call(this, post, normalizedActorId);
}

function toggleSocialCommentReaction(postId, commentId, userId, reactionType = 'like') {
    const post = getSocialPostRecord.call(this, postId);
    const normalizedUserId = socialText(userId);
    const normalizedReactionType = normalizeSocialReactionType(reactionType);
    const normalizedCommentId = socialText(commentId);
    if (!post || !normalizedUserId || !normalizedCommentId) return null;
    const beforeState = clone(post);
    post.comments = asArray(post.comments).map(comment => normalizeSocialComment.call(this, comment));
    const comment = findSocialCommentRecord.call(this, post.comments, normalizedCommentId);
    if (!comment) return null;
    comment.reactions = comment.reactions && typeof comment.reactions === 'object' ? comment.reactions : {};
    const reactionTypes = new Set([...Object.keys(comment.reactions), 'like']);
    let existingReactionType = '';
    reactionTypes.forEach(type => {
        comment.reactions[type] = socialIdArray(comment.reactions[type] || []);
        if (comment.reactions[type].includes(normalizedUserId)) existingReactionType = type;
    });
    Object.keys(comment.reactions).forEach(type => {
        comment.reactions[type] = comment.reactions[type].filter(item => item !== normalizedUserId);
    });
    if (existingReactionType !== normalizedReactionType) {
        comment.reactions[normalizedReactionType] = socialIdArray(comment.reactions[normalizedReactionType] || []);
        comment.reactions[normalizedReactionType].push(normalizedUserId);
    }
    comment.likes = socialIdArray(comment.reactions.like || []);
    comment.reactionCounts = Object.keys(comment.reactions).reduce((accumulator, key) => {
        accumulator[key] = socialIdArray(comment.reactions[key] || []).length;
        return accumulator;
    }, {});
    comment.updatedAt = nowIso();
    if (existingReactionType !== normalizedReactionType) {
        const commentAuthorId = socialText(comment.authorUserId || '');
        if (commentAuthorId && commentAuthorId !== normalizedUserId) {
            this.createNotification({
                recipientUserId: commentAuthorId,
                sourceDomain: 'social',
                type: 'comment-reaction',
                title: 'Comment reaction',
                body: `${getSocialActorDisplayName.call(this, normalizedUserId)} reacted to your comment.`,
                routePage: 'social'
            });
        }
    }
    post.updatedAt = nowIso();
    this.saveSocialMutation(normalizedUserId, 'comment-reacted', 'social-post', socialText(post.id), beforeState, post);
    return decorateSocialPost.call(this, post, normalizedUserId);
}

function removeSocialComment(postId, commentId, actorId = '') {
    const post = getSocialPostRecord.call(this, postId);
    const normalizedActorId = socialText(actorId);
    const normalizedCommentId = socialText(commentId);
    if (!post || !normalizedActorId || !normalizedCommentId) return null;
    const beforeState = clone(post);
    post.comments = asArray(post.comments).map(comment => normalizeSocialComment.call(this, comment));
    const removed = findSocialCommentRecord.call(this, post.comments, normalizedCommentId);
    if (!removed) return null;
    const canRemove = isSocialAdmin.call(this, normalizedActorId)
        || socialText(removed.authorUserId || removed.authorId || '') === normalizedActorId
        || socialText(post.authorUserId || post.postedById || post.authorId || '') === normalizedActorId
        || canManageSocialScope.call(this, post.scopeType, post.scopeId, normalizedActorId);
    if (!canRemove) return null;
    const removedIds = collectSocialCommentThreadIds.call(this, post.comments, normalizedCommentId);
    post.comments = post.comments.filter(comment => !removedIds.includes(socialText(comment.id)));
    post.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'comment-removed', 'social-post', socialText(post.id), beforeState, post);
    return decorateSocialPost.call(this, post, normalizedActorId);
}

function resolveSocialReport(reportId, payload = {}, actorId = '') {
    const normalizedReportId = socialText(reportId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    const report = asArray(this.state.social.reports).find(item => socialText(item?.id) === normalizedReportId);
    if (!report || !normalizedActorId || !isSocialAdmin.call(this, normalizedActorId)) return null;
    const beforeState = clone(report);
    const action = socialText(payload.action || payload.reportAction || 'dismiss') || 'dismiss';
    report.reportStatus = action === 'remove' ? 'resolved' : action;
    report.updatedAt = nowIso();
    report.resolvedByUserId = normalizedActorId;
    report.resolutionAction = action;
    report.resolutionNote = socialText(payload.resolutionNote || payload.note || '');
    report.resolvedAt = report.updatedAt;
    if (action === 'remove' || action === 'hide') {
        const targetType = socialText(report.targetEntityType || '').toLowerCase();
        const targetId = socialText(report.targetEntityId || '');
        if (targetType === 'post') {
            deleteSocialPost.call(this, targetId, normalizedActorId);
        } else if (targetType === 'comment') {
            const post = asArray(this.state.social.posts).find(entry => asArray(entry?.comments).some(comment => socialText(comment?.id) === targetId));
            if (post) removeSocialComment.call(this, post.id, targetId, normalizedActorId);
        }
    }
    this.saveSocialMutation(normalizedActorId, 'report-resolved', 'social-report', normalizedReportId, beforeState, report);
    return clone(report);
}

function decorateSocialPage(page, viewerUserId = '') {
    const normalized = clone(page || {}) || {};
    const pageId = socialText(normalized.id);
    const ownerUserId = socialText(normalized.ownerUserId || normalized.ownerId || normalized.createdById || '');
    const followerIds = this.getSocialFollowerIds('page', pageId);
    const pinnedPostIds = socialIdArray(normalized.pinnedPostIds || normalized.pinnedPosts || []);
    return {
        ...normalized,
        id: pageId,
        name: socialText(normalized.name || normalized.title || pageId || 'Page'),
        description: socialText(normalized.description || normalized.about || ''),
        about: socialText(normalized.about || normalized.description || ''),
        tagline: socialText(normalized.tagline || ''),
        pageType: socialText(normalized.pageType || normalized.type || (normalized.official || normalized.isOfficial ? 'campus' : 'brand')).toLowerCase() || 'brand',
        category: socialText(normalized.category || 'Community'),
        avatarImage: socialText(normalized.avatarImage || normalized.avatar || ''),
        coverImage: socialText(normalized.coverImage || normalized.cover || ''),
        website: normalizeSafeExternalUrl(normalized.website || ''),
        contactEmail: socialText(normalized.contactEmail || normalized.email || ''),
        location: socialText(normalized.location || ''),
        actionLabel: socialText(normalized.actionLabel || (normalized.website ? 'Visit website' : 'Learn more')),
        actionUrl: normalizeSafeExternalUrl(normalized.actionUrl || normalized.website || ''),
        official: Boolean(normalized.official || normalized.isOfficial || normalized.pageType === 'campus'),
        verified: Boolean(normalized.verified || normalized.official || normalized.isOfficial),
        facultyCode: normalizeCode(normalized.facultyCode || normalized.faculty || getSocialActorFacultyCode.call(this, ownerUserId)),
        visibility: normalizeSocialVisibility(normalized.visibility, 'public'),
        ownerUserId,
        adminIds: socialIdArray(normalized.adminIds || normalized.admins || []),
        pinnedPostIds,
        pinnedPostCount: pinnedPostIds.length,
        followerIds,
        followerCount: followerIds.length,
        isFollowing: viewerUserId ? followerIds.includes(socialText(viewerUserId)) : false,
        isManager: viewerUserId ? canManageSocialPage.call(this, normalized, viewerUserId) : false,
        createdAt: socialText(normalized.createdAt || nowIso()),
        updatedAt: socialText(normalized.updatedAt || normalized.createdAt || nowIso()),
        viewerCanDelete: viewerUserId ? canDeleteSocialPage.call(this, normalized, viewerUserId) : false
    };
}

function decorateSocialGroup(group, viewerUserId = '') {
    const normalized = normalizeSocialGroupState.call(this, clone(group || {}) || {});
    const memberIds = getSocialGroupMemberIds.call(this, normalized);
    const pendingMemberIds = getSocialGroupPendingIds.call(this, normalized);
    const pinnedPostIds = socialIdArray(normalized.pinnedPostIds || normalized.pinnedPosts || []);
    const viewerId = socialText(viewerUserId);
    let membershipState = 'none';
    if (viewerId) {
        if (canManageSocialGroup.call(this, normalized, viewerId)) membershipState = 'manager';
        else if (memberIds.includes(viewerId)) membershipState = 'member';
        else if (pendingMemberIds.includes(viewerId)) membershipState = 'pending';
    }
    return {
        ...normalized,
        id: socialText(normalized.id),
        name: socialText(normalized.name || normalized.title || normalized.id || 'Group'),
        description: socialText(normalized.description || normalized.about || ''),
        ownerUserId: socialText(normalized.ownerUserId || normalized.ownerId || normalized.createdById || ''),
        adminIds: socialIdArray(normalized.adminIds || normalized.admins || []),
        memberIds,
        pendingMemberIds,
        visibility: normalizeSocialVisibility(normalized.visibility, 'public'),
        facultyCode: normalizeCode(normalized.facultyCode || normalized.faculty || ''),
        avatarImage: socialText(normalized.avatarImage || normalized.avatar || ''),
        bannerImage: socialText(normalized.bannerImage || normalized.banner || ''),
        joinedAtByUser: getSocialGroupJoinMap.call(this, normalized),
        chatId: socialText(normalized.chatId || ''),
        notificationPreferenceByUser: normalized.notificationPreferenceByUser && typeof normalized.notificationPreferenceByUser === 'object'
            ? clone(normalized.notificationPreferenceByUser)
            : {},
        memberCount: memberIds.length,
        pendingCount: pendingMemberIds.length,
        membershipState,
        isManager: membershipState === 'manager',
        pinnedPostIds,
        pinnedPostCount: pinnedPostIds.length,
        createdAt: socialText(normalized.createdAt || nowIso()),
        updatedAt: socialText(normalized.updatedAt || normalized.createdAt || nowIso()),
        viewerCanDelete: false
    };
}

const SOCIAL_ENTITY_LINK_TYPES = new Set([
    'group',
    'project',
    'portfolio',
    'page',
    'event',
    'survey',
    'photo',
    'lost-found'
]);
const SOCIAL_ENTITY_LINK_MAX = 5;

function normalizeSocialEntityLinks(value, linkedSurveyId = '') {
    const seen = new Set();
    const links = [];
    asArray(value).forEach((item) => {
        if (links.length >= SOCIAL_ENTITY_LINK_MAX) return;
        const type = socialText(item?.type || '').toLowerCase();
        const id = socialText(item?.id || '');
        if (!SOCIAL_ENTITY_LINK_TYPES.has(type) || !id) return;
        const key = `${type}:${id}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push({ type, id });
    });
    const surveyId = socialText(linkedSurveyId || '');
    if (surveyId && !seen.has(`survey:${surveyId}`) && links.length < SOCIAL_ENTITY_LINK_MAX) {
        links.push({ type: 'survey', id: surveyId });
    }
    return links;
}

function decorateSocialPost(post, viewerUserId = '') {
    const normalized = clone(post || {}) || {};
    const scopeType = normalizeSocialScopeType(normalized.scopeType || 'profile');
    const authorUserId = socialText(normalized.authorUserId || normalized.postedById || normalized.authorId || '');
    const scopeId = socialText(normalized.scopeId || (scopeType === 'profile' ? authorUserId : ''));
    const reactions = normalized.reactions && typeof normalized.reactions === 'object' ? clone(normalized.reactions) : {};
    if (!Array.isArray(reactions.like) && Array.isArray(normalized.likes)) reactions.like = socialIdArray(normalized.likes);
    Object.keys(reactions).forEach(key => {
        reactions[key] = socialIdArray(reactions[key]);
    });
    const flatComments = asArray(normalized.comments).map(comment => normalizeSocialComment.call(this, comment));
    const comments = buildSocialCommentTree.call(this, flatComments);
    const reactionCounts = Object.keys(reactions).reduce((accumulator, key) => {
        accumulator[key] = reactions[key].length;
        return accumulator;
    }, {});
    const linkedSurveyId = socialText(normalized.linkedSurveyId || '');
    const entityLinks = normalizeSocialEntityLinks(normalized.entityLinks, linkedSurveyId);
    const sharedPost = normalized.sharedPostId ? getSocialPostRecord.call(this, normalized.sharedPostId) : null;
    const scopeRecord = scopeType === 'page'
        ? getSocialPageRecord.call(this, scopeId)
        : scopeType === 'group'
            ? getSocialGroupRecord.call(this, scopeId)
            : null;
    const pinnedPostIds = socialIdArray(scopeRecord?.pinnedPostIds || scopeRecord?.pinnedPosts || []);
    const viewerUserText = socialText(viewerUserId);
    let viewerReaction = '';
    Object.keys(reactions).some(key => {
        if ((reactions[key] || []).includes(viewerUserText)) {
            viewerReaction = key;
            return true;
        }
        return false;
    });
    return {
        ...normalized,
        id: socialText(normalized.id || makeId('post')),
        authorUserId,
        postedById: socialText(normalized.postedById || authorUserId),
        postType: socialText(normalized.postType || (normalized.sharedPostId ? 'share' : 'post')) || 'post',
        scopeType,
        scopeId,
        scopeName: socialText(normalized.scopeName || (
            scopeType === 'page'
                ? decorateSocialPage.call(this, getSocialPageRecord.call(this, scopeId), viewerUserId)?.name
                : scopeType === 'group'
                    ? decorateSocialGroup.call(this, getSocialGroupRecord.call(this, scopeId), viewerUserId)?.name
                    : getSocialActorDisplayName.call(this, scopeId || authorUserId)
        )),
        audience: normalizeSocialAudience(normalized.audience || (scopeType === 'group' ? 'group' : scopeType === 'page' ? 'page' : 'campus')),
        audienceFacultyCode: normalizeCode(normalized.audienceFacultyCode || normalized.authorFacultyCode || getSocialActorFacultyCode.call(this, authorUserId)),
        body: socialText(normalized.body || normalized.text || ''),
        text: socialText(normalized.text || normalized.body || ''),
        media: asArray(normalized.media).map(item => clone(item)).filter(Boolean),
        reactions,
        likes: reactions.like || [],
        reactionCounts,
        comments,
        commentCount: flatComments.length,
        replyCount: flatComments.filter(comment => socialText(comment.parentCommentId)).length,
        viewerCanEdit: viewerUserId ? canEditSocialPost.call(this, normalized, viewerUserId) : false,
        viewerReaction,
        viewerCanManageScope: viewerUserId ? canManageSocialScope.call(this, scopeType, scopeId, viewerUserId) : false,
        pinnedPostIds,
        isPinned: pinnedPostIds.includes(socialText(normalized.id || '')),
        sharedPostId: socialText(normalized.sharedPostId || ''),
        sharedPost: sharedPost ? decorateSocialPost.call(this, sharedPost, viewerUserId) : null,
        linkedSurveyId,
        entityLinks,
        createdAt: socialText(normalized.createdAt || nowIso()),
        updatedAt: socialText(normalized.updatedAt || normalized.createdAt || nowIso())
    };
}

function decorateSocialEvent(event, viewerUserId = '') {
    const normalized = clone(event || {}) || {};
    const eventId = socialText(normalized.id || makeId('event'));
    const relatedRsvps = asArray(this.state.social.rsvps)
        .filter(item => socialText(item?.eventId) === eventId)
        .map(item => ({
            id: socialText(item.id || makeId('rsvp')),
            eventId,
            userId: socialText(item.userId),
            status: normalizeSocialRsvpStatus(item.status),
            createdAt: socialText(item.createdAt || nowIso()),
            updatedAt: socialText(item.updatedAt || item.createdAt || nowIso())
        }));
    const attendeeSummary = {
        going: relatedRsvps.filter(item => item.status === 'going').length,
        interested: relatedRsvps.filter(item => item.status === 'interested').length,
        declined: relatedRsvps.filter(item => item.status === 'declined').length
    };
    return {
        ...normalized,
        id: eventId,
        title: socialText(normalized.title || 'Untitled event'),
        description: socialText(normalized.description || ''),
        eventType: socialText(normalized.eventType || 'meetup').toLowerCase() || 'meetup',
        visibility: normalizeSocialVisibility(normalized.visibility, 'public'),
        facultyCode: normalizeCode(normalized.facultyCode || normalized.audienceFacultyCode || ''),
        scopeType: normalizeSocialScopeType(normalized.scopeType || 'profile'),
        scopeId: socialText(normalized.scopeId || normalized.hostGroupId || normalized.createdById || ''),
        scopeName: socialText(normalized.scopeName || ''),
        projectId: socialText(normalized.projectId || normalized.hostProjectId || ''),
        hostGroupId: socialText(normalized.hostGroupId || ''),
        createdById: socialText(normalized.createdById || ''),
        createdByName: socialText(normalized.createdByName || getSocialActorDisplayName.call(this, normalized.createdById || '')),
        startsAt: socialText(normalized.startsAt || normalized.startAt || nowIso()),
        endsAt: socialText(normalized.endsAt || normalized.startsAt || normalized.startAt || nowIso()),
        location: socialText(normalized.location || ''),
        isOnline: Boolean(normalized.isOnline),
        onlineLink: normalizeSafeExternalUrl(normalized.onlineLink || ''),
        capacity: Math.max(0, safeNumber(normalized.capacity, 0)),
        joinMode: socialText(normalized.joinMode || 'open').toLowerCase() || 'open',
        cover: normalized.cover ? clone(normalized.cover) : null,
        attendeeSummary,
        viewerRsvpStatus: viewerUserId
            ? (relatedRsvps.find(item => item.userId === socialText(viewerUserId))?.status || '')
            : '',
        viewerCanDelete: viewerUserId ? canDeleteSocialEvent.call(this, normalized, viewerUserId) : false,
        viewerCanEdit: viewerUserId ? canEditSocialEvent.call(this, normalized, viewerUserId) : false,
        createdAt: socialText(normalized.createdAt || nowIso()),
        updatedAt: socialText(normalized.updatedAt || normalized.createdAt || nowIso())
    };
}

function resolveSocialPosts(postIds = [], viewerUserId = '') {
    const targetIds = socialIdArray(postIds);
    if (!targetIds.length) return [];
    const byId = new Map(
        asArray(this.state.social.posts)
            .map(post => decorateSocialPost.call(this, post, viewerUserId))
            .filter(post => canViewSocialPost.call(this, post, viewerUserId))
            .map(post => [socialText(post.id), post])
    );
    return targetIds.map(postId => byId.get(postId)).filter(Boolean);
}

function listSocialFeed(filters = {}) {
    const viewerUserId = socialText(filters.userId || filters.viewerUserId || '');
    const scopeType = socialText(filters.scopeType || '').toLowerCase();
    const scopeId = socialText(filters.scopeId || '');
    const scopedPinOrdering = ['page', 'group'].includes(scopeType) && Boolean(scopeId);
    const posts = asArray(this.state.social.posts)
        .map(post => decorateSocialPost.call(this, post, viewerUserId))
        .filter(post => canViewSocialPost.call(this, post, viewerUserId))
        .filter(post => !scopeType || (post.scopeType === scopeType && (!scopeId || post.scopeId === scopeId)))
        .sort((left, right) => {
            if (scopedPinOrdering && Boolean(left?.isPinned) !== Boolean(right?.isPinned)) {
                return left?.isPinned ? -1 : 1;
            }
            return socialCompareNewest(left?.createdAt, right?.createdAt);
        });
    return require('../utils').paginate(posts, filters);
}

function createSocialPage(payload = {}, actorId = '') {
    const normalizedActorId = socialText(actorId || '');
    const ownerUserId = normalizedActorId;
    if (!ownerUserId || !socialText(payload.name)) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.pages)) this.state.social.pages = [];
    const page = {
        id: socialText(payload.id || makeId('page')),
        name: socialText(payload.name),
        description: socialText(payload.description || ''),
        about: socialText(payload.about || payload.description || ''),
        tagline: socialText(payload.tagline || ''),
        pageType: socialText(payload.pageType || payload.type || (payload.official || payload.isOfficial ? 'campus' : 'brand')).toLowerCase() || 'brand',
        category: socialText(payload.category || 'Community'),
        avatarImage: socialText(payload.avatarImage || payload.avatar || ''),
        coverImage: socialText(payload.coverImage || payload.cover || ''),
        website: normalizeSafeExternalUrl(payload.website || ''),
        contactEmail: socialText(payload.contactEmail || payload.email || ''),
        location: socialText(payload.location || ''),
        actionLabel: socialText(payload.actionLabel || ''),
        actionUrl: normalizeSafeExternalUrl(payload.actionUrl || ''),
        official: false,
        verified: false,
        ownerUserId,
        adminIds: [],
        visibility: normalizeSocialVisibility(payload.visibility, 'public'),
        facultyCode: normalizeCode(getSocialActorFacultyCode.call(this, ownerUserId)),
        createdAt: socialText(payload.createdAt || nowIso()),
        updatedAt: socialText(payload.updatedAt || nowIso()),
        resolutionAction: socialText(payload.resolutionAction || ''),
        resolvedByUserId: socialText(payload.resolvedByUserId || ''),
        resolvedAt: socialText(payload.resolvedAt || '')
    };
    this.state.social.pages.unshift(page);
    this.saveSocialMutation(normalizedActorId || ownerUserId, 'page-created', 'social-page', page.id, null, page);
    return decorateSocialPage.call(this, page, normalizedActorId || ownerUserId);
}

function createSocialGroup(payload = {}, actorId = '') {
    const normalizedActorId = socialText(actorId || '');
    const ownerUserId = normalizedActorId;
    if (!ownerUserId || !socialText(payload.name)) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.groups)) this.state.social.groups = [];
    const createdAt = socialText(payload.createdAt || nowIso());
    const group = {
        id: socialText(payload.id || makeId('group')),
        name: socialText(payload.name),
        description: socialText(payload.description || ''),
        ownerUserId,
        adminIds: [],
        memberIds: [],
        pendingMemberIds: [],
        visibility: normalizeSocialVisibility(payload.visibility, 'public'),
        facultyCode: normalizeCode(getSocialActorFacultyCode.call(this, ownerUserId)),
        chatId: socialText(payload.chatId || ''),
        avatarImage: socialText(payload.avatarImage || payload.avatar || ''),
        bannerImage: socialText(payload.bannerImage || payload.banner || ''),
        joinedAtByUser: { [ownerUserId]: createdAt },
        notificationPreferenceByUser: {},
        createdAt,
        updatedAt: socialText(payload.updatedAt || createdAt)
    };
    normalizeSocialGroupState.call(this, group);
    this.state.social.groups.unshift(group);
    this.saveSocialMutation(normalizedActorId || ownerUserId, 'group-created', 'social-group', group.id, null, group);
    return decorateSocialGroup.call(this, group, normalizedActorId || ownerUserId);
}

function updateSocialPage(pageId, payload = {}, actorId = '') {
    const page = getSocialPageRecord.call(this, pageId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!page || !canManageSocialPage.call(this, page, normalizedActorId)) return null;
    const beforeState = clone(page);
    if (Object.prototype.hasOwnProperty.call(payload, 'name')) page.name = socialText(payload.name || page.name);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) page.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'about')) page.about = socialText(payload.about || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'tagline')) page.tagline = socialText(payload.tagline || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'pageType') || Object.prototype.hasOwnProperty.call(payload, 'type')) {
        page.pageType = socialText(payload.pageType || payload.type || page.pageType || 'brand').toLowerCase() || 'brand';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'category')) page.category = socialText(payload.category || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'avatarImage') || Object.prototype.hasOwnProperty.call(payload, 'avatar')) {
        page.avatarImage = socialText(payload.avatarImage || payload.avatar || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'coverImage') || Object.prototype.hasOwnProperty.call(payload, 'cover')) {
        page.coverImage = socialText(payload.coverImage || payload.cover || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'website')) page.website = normalizeSafeExternalUrl(payload.website || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'contactEmail') || Object.prototype.hasOwnProperty.call(payload, 'email')) {
        page.contactEmail = socialText(payload.contactEmail || payload.email || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'location')) page.location = socialText(payload.location || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'actionLabel')) page.actionLabel = socialText(payload.actionLabel || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'actionUrl')) page.actionUrl = normalizeSafeExternalUrl(payload.actionUrl || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'official') || Object.prototype.hasOwnProperty.call(payload, 'isOfficial')) {
        page.official = Boolean(payload.official || payload.isOfficial);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'verified')) page.verified = Boolean(payload.verified);
    if (Object.prototype.hasOwnProperty.call(payload, 'visibility')) page.visibility = normalizeSocialVisibility(payload.visibility, page.visibility || 'public');
    if (Object.prototype.hasOwnProperty.call(payload, 'adminIds') || Object.prototype.hasOwnProperty.call(payload, 'admins')) {
        page.adminIds = socialIdArray(payload.adminIds || payload.admins || []);
    }
    page.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'page-updated', 'social-page', socialText(page.id), beforeState, page);
    return decorateSocialPage.call(this, page, normalizedActorId);
}

function updateSocialGroup(groupId, payload = {}, actorId = '') {
    const group = getSocialGroupRecord.call(this, groupId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!group || !canManageSocialGroup.call(this, group, normalizedActorId)) return null;
    const beforeState = clone(group);
    if (Object.prototype.hasOwnProperty.call(payload, 'name')) group.name = socialText(payload.name || group.name);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) group.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'visibility')) group.visibility = normalizeSocialVisibility(payload.visibility, group.visibility || 'public');
    if (Object.prototype.hasOwnProperty.call(payload, 'avatarImage') || Object.prototype.hasOwnProperty.call(payload, 'avatar')) {
        group.avatarImage = socialText(payload.avatarImage || payload.avatar || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'bannerImage') || Object.prototype.hasOwnProperty.call(payload, 'banner')) {
        group.bannerImage = socialText(payload.bannerImage || payload.banner || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'adminIds') || Object.prototype.hasOwnProperty.call(payload, 'admins')) {
        group.adminIds = socialIdArray(payload.adminIds || payload.admins || []);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'notificationPreference') && normalizedActorId) {
        group.notificationPreferenceByUser = group.notificationPreferenceByUser && typeof group.notificationPreferenceByUser === 'object'
            ? group.notificationPreferenceByUser
            : {};
        group.notificationPreferenceByUser[normalizedActorId] = socialText(payload.notificationPreference || 'all') || 'all';
    }
    normalizeSocialGroupState.call(this, group);
    group.updatedAt = nowIso();
    if (socialText(group.chatId) && this.state.chats[group.chatId]) {
        this.ensureChatBase({
            id: group.chatId,
            type: 'group',
            members: getSocialGroupMemberIds.call(this, group),
            name: group.name,
            groupId: group.id,
            avatarImage: group.avatarImage,
            bannerImage: group.bannerImage
        });
    }
    this.saveSocialMutation(normalizedActorId, 'group-updated', 'social-group', socialText(group.id), beforeState, group);
    return decorateSocialGroup.call(this, group, normalizedActorId);
}

function setSocialGroupMembership(groupId, userId, action = 'join', actorId = '') {
    const group = getSocialGroupRecord.call(this, groupId);
    const normalizedUserId = socialText(userId);
    if (!group || !normalizedUserId) return null;
    const beforeState = clone(group);
    normalizeSocialGroupState.call(this, group);
    if (action === 'leave') {
        const ownerUserId = socialText(group.ownerUserId || '');
        const nextMemberIds = socialIdArray(group.memberIds).filter(item => item !== normalizedUserId);
        const nextAdminIds = socialIdArray(group.adminIds).filter(item => item !== normalizedUserId);
        const nextPendingIds = socialIdArray(group.pendingMemberIds).filter(item => item !== normalizedUserId);
        const nextJoinedAtByUser = group.joinedAtByUser && typeof group.joinedAtByUser === 'object'
            ? clone(group.joinedAtByUser)
            : {};
        delete nextJoinedAtByUser[normalizedUserId];
        if (normalizedUserId === ownerUserId) {
            const nextOwnerId = getNextSocialGroupOwnerId.call(this, {
                ...group,
                memberIds: nextMemberIds,
                adminIds: nextAdminIds,
                pendingMemberIds: nextPendingIds,
                joinedAtByUser: nextJoinedAtByUser
            }, normalizedUserId);
            if (nextOwnerId) {
                group.ownerUserId = nextOwnerId;
                group.adminIds = nextAdminIds.filter(item => item !== nextOwnerId);
                this.createNotification({
                    recipientUserId: nextOwnerId,
                    sourceDomain: 'social',
                    type: 'group-owner-transferred',
                    title: 'Group ownership transferred',
                    body: `${getSocialActorDisplayName.call(this, normalizedUserId)} left ${group.name}. You are now managing the group.`,
                    routePage: 'social',
                    routeData: { groupId: socialText(group.id) }
                });
            } else {
                group.ownerUserId = '';
                group.adminIds = [];
                group.orphanedAt = nowIso();
            }
        }
        group.memberIds = nextMemberIds;
        group.adminIds = group.ownerUserId ? group.adminIds : [];
        group.pendingMemberIds = nextPendingIds;
        group.joinedAtByUser = nextJoinedAtByUser;
    } else {
        if (socialIdArray(group.adminIds).includes(normalizedUserId) || socialText(group.ownerUserId || '') === normalizedUserId) {
            return decorateSocialGroup.call(this, group, actorId || normalizedUserId);
        }
        const isManager = actorId && canManageSocialGroup.call(this, group, actorId);
        if (action === 'request' && !isManager) {
            if (!group.pendingMemberIds.includes(normalizedUserId)) group.pendingMemberIds.push(normalizedUserId);
        } else if (action === 'join' || (action === 'request' && isManager)) {
            if (!group.memberIds.includes(normalizedUserId)) {
                group.memberIds.push(normalizedUserId);
                group.pendingMemberIds = group.pendingMemberIds.filter(item => item !== normalizedUserId);
                group.joinedAtByUser = getSocialGroupJoinMap.call(this, group);
                if (!socialText(group.joinedAtByUser[normalizedUserId])) group.joinedAtByUser[normalizedUserId] = nowIso();
                if (!socialText(group.ownerUserId || '')) {
                    group.ownerUserId = normalizedUserId;
                    group.memberIds = socialIdArray(group.memberIds).filter(item => item !== normalizedUserId);
                    group.adminIds = socialIdArray(group.adminIds).filter(item => item !== normalizedUserId);
                    group.orphanedAt = '';
                }
                const linkedProject = typeof this.getSocialProjectByGroupId === 'function'
                    ? this.getSocialProjectByGroupId(group.id)
                    : null;
                if (linkedProject) {
                    if (!linkedProject.memberRolesByUser || typeof linkedProject.memberRolesByUser !== 'object') {
                        linkedProject.memberRolesByUser = {};
                    }
                    if (
                        !linkedProject.memberRolesByUser[normalizedUserId]
                        && socialText(linkedProject.ownerUserId || '') !== normalizedUserId
                    ) {
                        linkedProject.memberRolesByUser[normalizedUserId] = 'member';
                        linkedProject.updatedAt = nowIso();
                    }
                }
            } else if (!group.pendingMemberIds.includes(normalizedUserId)) {
                group.pendingMemberIds.push(normalizedUserId);
            }
        }
        normalizeSocialGroupState.call(this, group);
        group.updatedAt = nowIso();
        if (socialText(group.chatId) && this.state.chats[group.chatId]) {
            this.ensureChatBase({ id: group.chatId, type: 'group', members: getSocialGroupMemberIds.call(this, group), name: group.name });
        }
        if (action !== 'leave') {
            const managers = uniqueStrings([socialText(group.ownerUserId), ...socialIdArray(group.adminIds)]);
            const pending = group.pendingMemberIds.includes(normalizedUserId);
            managers.forEach(managerId => {
                if (managerId && managerId !== normalizedUserId) {
                    this.createNotification({
                        recipientUserId: managerId,
                        sourceDomain: 'social',
                        type: pending ? 'group-request' : 'group-join',
                        title: pending ? 'New group request' : 'New group member',
                        body: pending
                            ? `${getSocialActorDisplayName.call(this, normalizedUserId)} requested to join ${group.name}.`
                            : `${getSocialActorDisplayName.call(this, normalizedUserId)} joined ${group.name}.`,
                        routePage: 'social'
                    });
                }
            });
        }
    }
    this.saveSocialMutation(actorId || normalizedUserId, `group-${action}`, 'social-group', socialText(group.id), beforeState, group);
    return decorateSocialGroup.call(this, group, actorId || normalizedUserId);
}

function respondSocialGroupMembership(groupId, memberId, accept = true, actorId = '') {
    const group = getSocialGroupRecord.call(this, groupId);
    const normalizedActorId = socialText(actorId);
    const normalizedMemberId = socialText(memberId);
    if (!group || !normalizedMemberId || !canManageSocialGroup.call(this, group, normalizedActorId)) return null;
    const beforeState = clone(group);
    normalizeSocialGroupState.call(this, group);
    group.pendingMemberIds = getSocialGroupPendingIds.call(this, group).filter(item => item !== normalizedMemberId);
    if (accept && !group.memberIds.includes(normalizedMemberId)) {
        group.memberIds.push(normalizedMemberId);
        group.joinedAtByUser = getSocialGroupJoinMap.call(this, group);
        if (!socialText(group.joinedAtByUser[normalizedMemberId])) group.joinedAtByUser[normalizedMemberId] = nowIso();
        if (!socialText(group.ownerUserId || '')) {
            group.ownerUserId = normalizedMemberId;
            group.memberIds = socialIdArray(group.memberIds).filter(item => item !== normalizedMemberId);
            group.adminIds = socialIdArray(group.adminIds).filter(item => item !== normalizedMemberId);
            group.orphanedAt = '';
        }
    } else if (!accept) {
        group.memberIds = group.memberIds.filter(item => item !== normalizedMemberId);
        if (group.joinedAtByUser && typeof group.joinedAtByUser === 'object') delete group.joinedAtByUser[normalizedMemberId];
    }
    normalizeSocialGroupState.call(this, group);
    group.updatedAt = nowIso();
    if (socialText(group.chatId) && this.state.chats[group.chatId]) {
        this.ensureChatBase({ id: group.chatId, type: 'group', members: getSocialGroupMemberIds.call(this, group), name: group.name });
    }
    this.createNotification({
        recipientUserId: normalizedMemberId,
        sourceDomain: 'social',
        type: accept ? 'group-approved' : 'group-denied',
        title: accept ? 'Group access approved' : 'Group request declined',
        body: accept
            ? `${group.name} approved your membership request.`
            : `${group.name} declined your membership request.`,
        routePage: 'social'
    });
    this.saveSocialMutation(normalizedActorId, accept ? 'group-request-approved' : 'group-request-denied', 'social-group', socialText(group.id), beforeState, group);
    return decorateSocialGroup.call(this, group, normalizedActorId);
}

function removeSocialGroupMember(groupId, memberId, actorId = '') {
    const group = getSocialGroupRecord.call(this, groupId);
    const normalizedActorId = socialText(actorId);
    const normalizedMemberId = socialText(memberId);
    if (!group || !normalizedMemberId || !canManageSocialGroup.call(this, group, normalizedActorId)) return null;
    const ownerUserId = socialText(group.ownerUserId || '');
    if (!group || normalizedMemberId === ownerUserId) return null;
    const beforeState = clone(group);
    normalizeSocialGroupState.call(this, group);
    group.memberIds = socialIdArray(group.memberIds).filter(item => item !== normalizedMemberId);
    group.adminIds = socialIdArray(group.adminIds).filter(item => item !== normalizedMemberId);
    group.pendingMemberIds = getSocialGroupPendingIds.call(this, group).filter(item => item !== normalizedMemberId);
    if (group.joinedAtByUser && typeof group.joinedAtByUser === 'object') delete group.joinedAtByUser[normalizedMemberId];
    normalizeSocialGroupState.call(this, group);
    group.updatedAt = nowIso();
    if (socialText(group.chatId) && this.state.chats[group.chatId]) {
        this.ensureChatBase({ id: group.chatId, type: 'group', members: getSocialGroupMemberIds.call(this, group), name: group.name });
    }
    this.createNotification({
        recipientUserId: normalizedMemberId,
        sourceDomain: 'social',
        type: 'group-member-removed',
        title: 'Removed from group',
        body: `You were removed from ${group.name}.`,
        routePage: 'social'
    });
    this.saveSocialMutation(normalizedActorId, 'group-member-removed', 'social-group', socialText(group.id), beforeState, group);
    return decorateSocialGroup.call(this, group, normalizedActorId);
}

function deleteSocialGroup(groupId, actorId = '') {
    const group = getSocialGroupRecord.call(this, groupId);
    const normalizedActorId = socialText(actorId);
    if (!group || !canDeleteSocialGroup.call(this, group, normalizedActorId)) return null;
    const beforeState = clone(group);
    const normalizedGroupId = socialText(group.id);
    const chatId = socialText(group.chatId || '');
    this.state.social.groups = asArray(this.state.social.groups)
        .filter((entry) => socialText(entry?.id) !== normalizedGroupId);
    this.state.social.posts = asArray(this.state.social.posts)
        .filter((entry) => !(
            socialText(entry?.scopeType || '').toLowerCase() === 'group'
            && socialText(entry?.scopeId || '') === normalizedGroupId
        ));
    if (chatId && this.state.chats && this.state.chats[chatId]) {
        delete this.state.chats[chatId];
    }
    this.saveSocialMutation(normalizedActorId, 'group-deleted', 'social-group', normalizedGroupId, beforeState, null);
    return { groupId: normalizedGroupId };
}

function inviteSocialGroupMember(groupId, memberId, actorId = '', note = '') {
    const group = getSocialGroupRecord.call(this, groupId);
    const normalizedActorId = socialText(actorId);
    const normalizedMemberId = socialText(memberId);
    if (!group || !normalizedActorId || !normalizedMemberId || normalizedMemberId === normalizedActorId) return null;
    const canInvite = isSocialAdmin.call(this, normalizedActorId)
        || canManageSocialGroup.call(this, group, normalizedActorId)
        || isSocialGroupMember.call(this, group, normalizedActorId);
    if (!canInvite || !getSocialAccount.call(this, normalizedMemberId)) return null;
    if (getSocialGroupMemberIds.call(this, group).includes(normalizedMemberId)) return null;
    if (getSocialGroupPendingIds.call(this, group).includes(normalizedMemberId)) return null;
    const actorName = getSocialActorDisplayName.call(this, normalizedActorId);
    const groupName = socialText(group.name || 'Group');
    this.createNotification({
        recipientUserId: normalizedMemberId,
        sourceDomain: 'social',
        type: 'group-invite',
        title: `Invitation to ${groupName}`,
        body: socialText(note) || `${actorName} invited you to join ${groupName}.`,
        routePage: 'social',
        routeData: { groupId: socialText(group.id) },
        targetType: 'group',
        targetId: socialText(group.id)
    });
    this.saveSocialMutation(normalizedActorId, 'group-member-invited', 'social-group', socialText(group.id), null, {
        invitedUserId: normalizedMemberId,
        note: socialText(note)
    });
    return {
        group: decorateSocialGroup.call(this, group, normalizedActorId),
        invitedUserId: normalizedMemberId
    };
}

function createSocialPost(payload = {}, actorId = '') {
    const normalizedActorId = socialText(actorId || '');
    const authorUserId = normalizedActorId;
    if (!authorUserId) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.posts)) this.state.social.posts = [];
    const scopeType = normalizeSocialScopeType(payload.scopeType || 'profile');
    const scopeId = socialText(payload.scopeId || (scopeType === 'profile' ? authorUserId : ''));
    const bodyText = socialText(payload.body || payload.text || payload.note || '');
    const mentionUserIds = resolveSocialMentionUserIds.call(this, bodyText);
    const scopeName = socialText(payload.scopeName || (
        scopeType === 'page'
            ? getSocialPageRecord.call(this, scopeId)?.name
            : scopeType === 'group'
                ? getSocialGroupRecord.call(this, scopeId)?.name
                : getSocialActorDisplayName.call(this, scopeId || authorUserId)
    ));
    if (scopeType === 'group') {
        const group = getSocialGroupRecord.call(this, scopeId);
        if (!group || !(isSocialGroupMember.call(this, group, authorUserId) || canManageSocialGroup.call(this, group, authorUserId))) {
            return null;
        }
    }
    let normalizedPostType = socialText(payload.postType || 'post') || 'post';
    if (scopeType === 'page') {
        const page = getSocialPageRecord.call(this, scopeId);
        const isManager = canManageSocialPage.call(this, page, authorUserId);
        const isFollower = this.isSocialFollowingTarget(authorUserId, 'page', scopeId);
        if (!page || !(isManager || isFollower)) return null;
        normalizedPostType = isManager
            ? (socialText(payload.postType || payload.pagePostType || 'official').toLowerCase() === 'community' ? 'community' : 'official')
            : 'community';
    }
    const media = asArray(payload.media).map(item => this.normalizeMessageAttachment(item, authorUserId)).filter(Boolean);
    const entityLinks = normalizeSocialEntityLinks(payload.entityLinks, payload.linkedSurveyId);
    const linkedSurveyId = socialText(payload.linkedSurveyId || '')
        || socialText(entityLinks.find((link) => link.type === 'survey')?.id || '');
    const post = {
        id: socialText(payload.id || makeId('post')),
        authorUserId,
        postedById: authorUserId,
        postType: normalizedPostType,
        scopeType,
        scopeId,
        scopeName,
        category: socialText(payload.category || ''),
        audience: normalizeSocialAudience(payload.audience || (scopeType === 'group' ? 'group' : scopeType === 'page' ? 'page' : 'campus')),
        audienceFacultyCode: normalizeCode(payload.audienceFacultyCode || payload.authorFacultyCode || getSocialActorFacultyCode.call(this, authorUserId)),
        body: bodyText,
        text: bodyText,
        media,
        photoMeta: payload.photoMeta && typeof payload.photoMeta === 'object' ? clone(payload.photoMeta) : null,
        reactions: payload.reactions && typeof payload.reactions === 'object' ? clone(payload.reactions) : { like: [] },
        comments: asArray(payload.comments).map(comment => normalizeSocialComment.call(this, comment)),
        mentions: mentionUserIds,
        sharedPostId: socialText(payload.sharedPostId || ''),
        linkedSurveyId,
        entityLinks,
        createdAt: socialText(payload.createdAt || nowIso()),
        updatedAt: socialText(payload.updatedAt || nowIso())
    };
    this.state.social.posts.unshift(post);
    this.saveSocialMutation(authorUserId, 'post-created', 'social-post', post.id, null, post);
    notifySocialMentions.call(this, { actorId: authorUserId, targetType: 'post', targetId: post.id, sourceText: bodyText });
    if (scopeType === 'page') {
        this.getSocialFollowerIds('page', scopeId).forEach(userId => {
            if (!userId || userId === authorUserId) return;
            this.createNotification({
                recipientUserId: userId,
                sourceDomain: 'social',
                type: post.postType === 'community' ? 'page-community-update' : 'page-update',
                title: post.postType === 'community' ? `${scopeName} has a new community post` : `${scopeName} posted an update`,
                body: bodyText || `${scopeName} shared a new ${post.postType === 'community' ? 'community' : 'official'} page update.`,
                routePage: 'social'
            });
        });
    } else if (scopeType === 'group') {
        getSocialGroupMemberIds.call(this, getSocialGroupRecord.call(this, scopeId)).forEach(userId => {
            if (!userId || userId === authorUserId) return;
            this.createNotification({
                recipientUserId: userId,
                sourceDomain: 'social',
                type: 'group-update',
                title: `${scopeName} has a new post`,
                body: bodyText || `${scopeName} shared a new group update.`,
                routePage: 'social'
            });
        });
    }
    return decorateSocialPost.call(this, post, authorUserId);
}

function updateSocialPost(postId, payload = {}, actorId = '') {
    const post = getSocialPostRecord.call(this, postId);
    const normalizedActorId = socialText(actorId);
    if (!post || !canEditSocialPost.call(this, post, normalizedActorId)) return null;
    const beforeState = clone(post);
    if (Object.prototype.hasOwnProperty.call(payload, 'body') || Object.prototype.hasOwnProperty.call(payload, 'text')) {
        const bodyText = socialText(payload.body || payload.text || '');
        post.body = bodyText;
        post.text = post.body;
        post.mentions = resolveSocialMentionUserIds.call(this, bodyText);
    }
    post.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'post-updated', 'social-post', socialText(post.id), beforeState, post);
    return decorateSocialPost.call(this, post, normalizedActorId);
}

function deleteSocialPost(postId, actorId = '') {
    const post = getSocialPostRecord.call(this, postId);
    const normalizedActorId = socialText(actorId);
    if (!post || !canEditSocialPost.call(this, post, normalizedActorId)) return false;
    this.state.social.posts = asArray(this.state.social.posts).filter(item => socialText(item?.id) !== socialText(postId));
    this.saveSocialMutation(normalizedActorId, 'post-deleted', 'social-post', socialText(post.id), post, null);
    return true;
}

function shareSocialPost(postId, payload = {}, actorId = '') {
    const source = getSocialPostRecord.call(this, postId);
    const normalizedActorId = socialText(actorId || payload.authorUserId);
    if (!source || !normalizedActorId) return null;
    return createSocialPost.call(this, {
        authorUserId: normalizedActorId,
        postedById: normalizedActorId,
        scopeType: 'profile',
        scopeId: normalizedActorId,
        scopeName: getSocialActorDisplayName.call(this, normalizedActorId),
        audience: normalizeSocialAudience(payload.audience || 'campus'),
        body: socialText(payload.body || payload.note || ''),
        sharedPostId: socialText(source.id),
        media: []
    }, normalizedActorId);
}

function toggleSocialReaction(postId, userId, reactionType = 'like') {
    const post = getSocialPostRecord.call(this, postId);
    const normalizedUserId = socialText(userId);
    const normalizedReactionType = normalizeSocialReactionType(reactionType);
    if (!post || !normalizedUserId) return null;
    const beforeState = clone(post);
    post.reactions = post.reactions && typeof post.reactions === 'object' ? post.reactions : {};
    const existingReactionType = Object.keys(post.reactions).find(type => socialIdArray(post.reactions[type] || []).includes(normalizedUserId));
    Object.keys(post.reactions).forEach(type => {
        post.reactions[type] = socialIdArray(post.reactions[type] || []).filter(item => item !== normalizedUserId);
    });
    if (existingReactionType !== normalizedReactionType) {
        post.reactions[normalizedReactionType] = socialIdArray(post.reactions[normalizedReactionType] || []);
        post.reactions[normalizedReactionType].push(normalizedUserId);
        const recipientUserId = socialText(post.authorUserId || post.postedById || '');
        if (recipientUserId && recipientUserId !== normalizedUserId) {
            this.createNotification({
                recipientUserId,
                sourceDomain: 'social',
                type: 'reaction',
                title: 'Post reaction',
                body: `${getSocialActorDisplayName.call(this, normalizedUserId)} reacted to your post.`,
                routePage: 'social'
            });
        }
    }
    post.likes = socialIdArray(post.reactions.like || []);
    post.updatedAt = nowIso();
    this.saveSocialMutation(normalizedUserId, 'post-reacted', 'social-post', socialText(post.id), beforeState, post);
    return decorateSocialPost.call(this, post, normalizedUserId);
}

function addSocialComment(postId, payload = {}) {
    const post = getSocialPostRecord.call(this, postId);
    const normalizedAuthorId = socialText(payload.authorUserId || payload.authorId || '');
    const bodyText = socialText(payload.body || payload.text || '');
    const parentCommentId = socialText(payload.parentCommentId || payload.replyToCommentId || '');
    if (!post || !normalizedAuthorId || !bodyText) return null;
    const beforeState = clone(post);
    post.comments = asArray(post.comments).map(comment => normalizeSocialComment.call(this, comment));
    const parentComment = parentCommentId ? post.comments.find(comment => socialText(comment.id) === parentCommentId) : null;
    if (parentCommentId && !parentComment) return null;
    const comment = normalizeSocialComment.call(this, {
        id: payload.id || makeId('comment'),
        authorUserId: normalizedAuthorId,
        authorName: payload.authorName || getSocialActorDisplayName.call(this, normalizedAuthorId),
        body: bodyText,
        parentCommentId,
        mentions: resolveSocialMentionUserIds.call(this, bodyText),
        reactions: payload.reactions || {},
        createdAt: payload.createdAt || nowIso()
    });
    post.comments.push(comment);
    post.updatedAt = nowIso();
    const recipientUserId = socialText(post.authorUserId || post.postedById || '');
    if (recipientUserId && recipientUserId !== normalizedAuthorId) {
        this.createNotification({
            recipientUserId,
            sourceDomain: 'social',
            type: parentCommentId ? 'reply' : 'comment',
            title: parentCommentId ? 'New reply' : 'New comment',
            body: `${getSocialActorDisplayName.call(this, normalizedAuthorId)} ${parentCommentId ? 'replied to' : 'commented on'} your post.`,
            routePage: 'social'
        });
    }
    if (parentComment && socialText(parentComment.authorUserId || '') && socialText(parentComment.authorUserId || '') !== normalizedAuthorId) {
        this.createNotification({
            recipientUserId: socialText(parentComment.authorUserId || ''),
            sourceDomain: 'social',
            type: 'reply',
            title: 'Comment reply',
            body: `${getSocialActorDisplayName.call(this, normalizedAuthorId)} replied to your comment.`,
            routePage: 'social'
        });
    }
    notifySocialMentions.call(this, {
        actorId: normalizedAuthorId,
        targetType: parentCommentId ? 'reply' : 'comment',
        targetId: `${socialText(post.id)}:${socialText(comment.id)}`,
        sourceText: bodyText
    });
    this.saveSocialMutation(normalizedAuthorId, 'post-commented', 'social-post', socialText(post.id), beforeState, post);
    return decorateSocialPost.call(this, post, normalizedAuthorId);
}

function createSocialEvent(payload = {}, actorId = '') {
    const creatorId = socialText(actorId || '');
    if (!creatorId || !socialText(payload.title) || !socialText(payload.startsAt)) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.events)) this.state.social.events = [];
    const scopeType = normalizeSocialScopeType(payload.scopeType || (payload.hostGroupId ? 'group' : 'profile'));
    const scopeId = socialText(payload.scopeId || payload.hostGroupId || creatorId);
    const event = {
        id: socialText(payload.id || makeId('event')),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        eventType: socialText(payload.eventType || 'meetup').toLowerCase() || 'meetup',
        visibility: normalizeSocialVisibility(payload.visibility, 'public'),
        facultyCode: normalizeCode(getSocialActorFacultyCode.call(this, creatorId)),
        scopeType,
        scopeId,
        scopeName: socialText(payload.scopeName || (
            scopeType === 'group'
                ? getSocialGroupRecord.call(this, scopeId)?.name
                : scopeType === 'page'
                    ? getSocialPageRecord.call(this, scopeId)?.name
                    : getSocialActorDisplayName.call(this, scopeId)
        )),
        projectId: socialText(payload.projectId || payload.hostProjectId || ''),
        hostGroupId: socialText(payload.hostGroupId || ''),
        createdById: creatorId,
        createdByName: getSocialActorDisplayName.call(this, creatorId),
        startsAt: socialText(payload.startsAt),
        endsAt: socialText(payload.endsAt || payload.startsAt),
        location: socialText(payload.location || ''),
        isOnline: Boolean(payload.isOnline),
        onlineLink: normalizeSafeExternalUrl(payload.onlineLink || ''),
        capacity: Math.max(0, safeNumber(payload.capacity ?? payload.maxSeats, 0)),
        joinMode: socialText(payload.joinMode || 'open').toLowerCase() || 'open',
        cover: payload.cover ? clone(payload.cover) : null,
        category: socialText(payload.category || 'social') || 'social',
        isOfficial: Boolean(payload.isOfficial),
        isRecurring: Boolean(payload.isRecurring),
        imageUrl: socialText(payload.imageUrl || ''),
        maxSeats: Math.max(0, safeNumber(payload.maxSeats ?? payload.capacity, 0)),
        createdAt: socialText(payload.createdAt || nowIso()),
        updatedAt: socialText(payload.updatedAt || nowIso())
    };
    this.state.social.events.unshift(event);
    this.saveSocialMutation(creatorId, 'event-created', 'social-event', event.id, null, event);
    return decorateSocialEvent.call(this, event, creatorId);
}

function updateSocialEvent(eventId, payload = {}, actorId = '') {
    const event = getSocialEventRecord.call(this, eventId);
    const normalizedActorId = socialText(actorId);
    if (!event || !canEditSocialEvent.call(this, event, normalizedActorId)) return null;
    const beforeState = clone(event);
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
        const title = socialText(payload.title);
        if (!title) return null;
        event.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
        event.description = socialText(payload.description || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'startsAt')) {
        const startsAt = socialText(payload.startsAt);
        if (!startsAt) return null;
        event.startsAt = startsAt;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'endsAt')) {
        event.endsAt = socialText(payload.endsAt || payload.startsAt || event.startsAt);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'location')) {
        event.location = socialText(payload.location || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'isOnline')) {
        event.isOnline = Boolean(payload.isOnline);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'onlineLink')) {
        event.onlineLink = normalizeSafeExternalUrl(payload.onlineLink || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'joinMode')) {
        event.joinMode = socialText(payload.joinMode || 'open').toLowerCase() || 'open';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'capacity') || Object.prototype.hasOwnProperty.call(payload, 'maxSeats')) {
        const seats = Math.max(0, safeNumber(payload.maxSeats ?? payload.capacity, event.capacity || 0));
        event.capacity = seats;
        event.maxSeats = seats;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'category')) {
        event.category = socialText(payload.category || 'social') || 'social';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'isOfficial')) {
        event.isOfficial = Boolean(payload.isOfficial);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'isRecurring')) {
        event.isRecurring = Boolean(payload.isRecurring);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'imageUrl') && socialText(payload.imageUrl)) {
        event.imageUrl = socialText(payload.imageUrl);
    }
    event.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'event-updated', 'social-event', socialText(event.id), beforeState, event);
    return decorateSocialEvent.call(this, event, normalizedActorId);
}

function respondSocialEventRsvp(eventId, userId, status = 'going') {
    const event = getSocialEventRecord.call(this, eventId);
    const normalizedUserId = socialText(userId);
    if (!event || !normalizedUserId) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.rsvps)) this.state.social.rsvps = [];
    if (socialText(event.joinMode).toLowerCase() === 'member-required' && socialText(event.hostGroupId)) {
        const hostGroup = getSocialGroupRecord.call(this, event.hostGroupId);
        if (hostGroup && !(isSocialGroupMember.call(this, hostGroup, normalizedUserId) || canManageSocialGroup.call(this, hostGroup, normalizedUserId))) {
            return null;
        }
    }
    const normalizedStatus = normalizeSocialRsvpStatus(status);
    const existing = asArray(this.state.social.rsvps).find(item =>
        socialText(item?.eventId) === socialText(eventId) && socialText(item?.userId) === normalizedUserId
    );
    const beforeState = existing ? clone(existing) : null;
    if (existing) {
        existing.status = normalizedStatus;
        existing.updatedAt = nowIso();
    } else {
        this.state.social.rsvps.unshift({
            id: socialText(makeId('rsvp')),
            eventId: socialText(eventId),
            userId: normalizedUserId,
            status: normalizedStatus,
            createdAt: nowIso(),
            updatedAt: nowIso()
        });
    }
    if (socialText(event.createdById) && socialText(event.createdById) !== normalizedUserId) {
        this.createNotification({
            recipientUserId: socialText(event.createdById),
            sourceDomain: 'social',
            type: 'event-rsvp',
            title: 'Event RSVP updated',
            body: `${getSocialActorDisplayName.call(this, normalizedUserId)} marked "${event.title}" as ${normalizedStatus}.`,
            routePage: 'social',
            routeData: { eventId: socialText(eventId) }
        });
    }
    if (['going', 'interested'].includes(normalizedStatus)) {
        const reminderLeadHours = getSocialProfileRecord.call(this, normalizedUserId).eventReminderLeadHours;
        this.createNotification({
            recipientUserId: normalizedUserId,
            sourceDomain: 'social',
            type: 'event-reminder',
            title: 'Event reminder set',
            body: `Reminder enabled for "${event.title}" ${reminderLeadHours} hour${reminderLeadHours === 1 ? '' : 's'} before it starts.`,
            routePage: 'social'
        });
    }
    const current = asArray(this.state.social.rsvps).find(item =>
        socialText(item?.eventId) === socialText(eventId) && socialText(item?.userId) === normalizedUserId
    );
    this.saveSocialMutation(normalizedUserId, 'event-rsvp-updated', 'social-event', socialText(event.id), beforeState, current);
    return decorateSocialEvent.call(this, event, normalizedUserId);
}

function deleteSocialEvent(eventId, actorId = '') {
    const event = getSocialEventRecord.call(this, eventId);
    const normalizedActorId = socialText(actorId);
    if (!event || !canDeleteSocialEvent.call(this, event, normalizedActorId)) return null;
    const beforeState = clone(event);
    const eventIdText = socialText(event.id);
    this.state.social.events = asArray(this.state.social.events).filter(item => socialText(item?.id) !== eventIdText);
    this.state.social.rsvps = asArray(this.state.social.rsvps).filter(item => socialText(item?.eventId) !== eventIdText);
    this.state.social.reports = asArray(this.state.social.reports).filter(report =>
        !(socialText(report?.targetEntityType).toLowerCase() === 'event' && socialText(report?.targetEntityId) === eventIdText)
    );
    this.saveSocialMutation(normalizedActorId, 'event-deleted', 'social-event', eventIdText, beforeState, null);
    return { id: eventIdText };
}

function listSocialEvents(filters = {}) {
    const viewerUserId = socialText(filters.userId || filters.viewerUserId || '');
    const items = asArray(this.state.social.events)
        .map(event => decorateSocialEvent.call(this, event, viewerUserId))
        .filter(event => canViewSocialEvent.call(this, event, viewerUserId))
        .sort((left, right) => socialCompareNewest(left?.startsAt, right?.startsAt));
    return require('../utils').paginate(items, filters);
}

function createSocialReport(payload = {}) {
    const report = {
        id: socialText(payload.id || makeId('report')),
        reporterUserId: socialText(payload.reporterUserId || ''),
        targetEntityType: socialText(payload.targetEntityType || 'post'),
        targetEntityId: socialText(payload.targetEntityId || ''),
        targetOwnerId: socialText(payload.targetOwnerId || ''),
        reportReason: socialText(payload.reportReason || ''),
        reportStatus: socialText(payload.reportStatus || 'open'),
        createdAt: socialText(payload.createdAt || nowIso()),
        updatedAt: socialText(payload.updatedAt || nowIso())
    };
    this.state.social.reports.unshift(report);
    this.saveSocialMutation(report.reporterUserId, 'report-created', 'social-report', report.id, null, report);
    return clone(report);
}

module.exports = {
    addSocialComment,
    buildSocialCommentTree,
    canDeleteSocialEvent,
    canDeleteSocialGroup,
    canDeleteSocialPage,
    canEditSocialEvent,
    canEditSocialPost,
    canManageSocialGroup,
    canManageSocialPage,
    canManageSocialScope,
    isSocialStaffViewer,
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
    getSocialAccount,
    getSocialActorDisplayName,
    getSocialActorFacultyCode,
    getSocialEventRecord,
    getSocialGroupRecord,
    getSocialGroupByChatId,
    getSocialGroupJoinMap,
    getSocialGroupMemberIds,
    getNextSocialGroupOwnerId,
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
};
