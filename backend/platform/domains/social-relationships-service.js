const {
    asArray,
    clone,
    makeId,
    nowIso,
    uniqueStrings
} = require('../utils');

function socialText(value) {
    return String(value || '').trim();
}

function normalizeSocialScopeType(value) {
    const normalized = socialText(value).toLowerCase();
    if (['profile', 'page', 'group'].includes(normalized)) return normalized;
    return 'profile';
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

function getSocialFollowerIds(targetType, targetId) {
    const normalizedType = normalizeSocialScopeType(targetType === 'profile' ? 'profile' : targetType);
    const normalizedId = socialText(targetId);
    const fromRelationships = asArray(this.state.social.relationships)
        .filter(item => socialText(item?.type).toLowerCase() === 'follow')
        .filter(item => socialText(item?.toType).toLowerCase() === normalizedType)
        .filter(item => socialText(item?.toId) === normalizedId)
        .map(item => socialText(item?.fromId));
    if (normalizedType === 'page') {
        return uniqueStrings([...fromRelationships, ...socialIdArray(this.getSocialPageRecord(normalizedId)?.followerIds)]);
    }
    if (normalizedType === 'group') {
        return uniqueStrings([...fromRelationships, ...socialIdArray(this.getSocialGroupRecord(normalizedId)?.followerIds)]);
    }
    return uniqueStrings(fromRelationships);
}

function isSocialFollowingTarget(userId, targetType, targetId) {
    const normalizedUserId = socialText(userId);
    const normalizedType = normalizeSocialScopeType(targetType === 'profile' ? 'profile' : targetType);
    const normalizedId = socialText(targetId);
    if (!normalizedUserId || !normalizedId) return false;
    return getSocialFollowerIds.call(this, normalizedType, normalizedId).includes(normalizedUserId);
}

function isSocialConnection(userA, userB) {
    const left = socialText(userA);
    const right = socialText(userB);
    if (!left || !right || left === right) return false;
    return asArray(this.state.social.relationships).some(item => {
        if (socialText(item?.type).toLowerCase() !== 'connection') return false;
        const fromId = socialText(item?.fromId);
        const toType = socialText(item?.toType).toLowerCase();
        const toId = socialText(item?.toId);
        return toType === 'profile' && (
            (fromId === left && toId === right)
            || (fromId === right && toId === left)
        );
    });
}

function getPendingSocialConnectionRequestBetween(userA, userB) {
    const left = socialText(userA);
    const right = socialText(userB);
    if (!left || !right || left === right) return null;
    return asArray(this.state.social.relationships).find(item => {
        if (socialText(item?.type).toLowerCase() !== 'connection-request') return false;
        if (socialText(item?.status || 'pending').toLowerCase() !== 'pending') return false;
        const fromId = socialText(item?.fromId);
        const toType = socialText(item?.toType).toLowerCase();
        const toId = socialText(item?.toId);
        return toType === 'profile' && (
            (fromId === left && toId === right)
            || (fromId === right && toId === left)
        );
    }) || null;
}

function sendSocialConnectionRequest(fromUserId, toUserId) {
    const normalizedFromId = socialText(fromUserId);
    const normalizedToId = socialText(toUserId);
    if (!normalizedFromId || !normalizedToId || normalizedFromId === normalizedToId) return null;
    if (typeof this.isSocialEligibleAccount === 'function' && !this.isSocialEligibleAccount(normalizedToId)) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.relationships)) this.state.social.relationships = [];
    if (isSocialConnection.call(this, normalizedFromId, normalizedToId)) return null;
    if (getPendingSocialConnectionRequestBetween.call(this, normalizedFromId, normalizedToId)) return null;
    const relationship = {
        id: socialText(makeId('rel')),
        type: 'connection-request',
        fromId: normalizedFromId,
        toType: 'profile',
        toId: normalizedToId,
        status: 'pending',
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.relationships.unshift(relationship);
    this.createNotification({
        recipientUserId: normalizedToId,
        sourceDomain: 'social',
        type: 'friend-request',
        title: 'New connection request',
        body: `${this.getSocialActorDisplayName(normalizedFromId)} sent you a connection request.`,
        routePage: 'social'
    });
    this.saveSocialMutation(normalizedFromId, 'connection-request-created', 'social-relationship', relationship.id, null, relationship);
    return clone(relationship);
}

function respondSocialConnectionRequest(relationshipId, actorId, accept = true) {
    const request = this.getSocialRelationshipRecord(relationshipId);
    const normalizedActorId = socialText(actorId);
    if (!request || socialText(request.type).toLowerCase() !== 'connection-request') return null;
    if (socialText(request.toId) !== normalizedActorId) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.relationships)) this.state.social.relationships = [];
    const beforeState = clone(request);
    request.status = accept ? 'accepted' : 'declined';
    request.updatedAt = nowIso();
    request.respondedAt = request.updatedAt;
    let connection = null;
    if (accept) {
        connection = {
            id: socialText(makeId('rel')),
            type: 'connection',
            fromId: socialText(request.fromId),
            toType: 'profile',
            toId: normalizedActorId,
            status: 'accepted',
            createdAt: request.updatedAt,
            updatedAt: request.updatedAt
        };
        this.state.social.relationships.unshift(connection);
        this.createNotification({
            recipientUserId: socialText(request.fromId),
            sourceDomain: 'social',
            type: 'friend-accepted',
            title: 'Connection accepted',
            body: `${this.getSocialActorDisplayName(normalizedActorId)} accepted your connection request.`,
            routePage: 'social'
        });
    }
    this.saveSocialMutation(normalizedActorId, accept ? 'connection-request-accepted' : 'connection-request-declined', 'social-relationship', socialText(request.id), beforeState, request);
    return {
        request: clone(request),
        connection: connection ? clone(connection) : null
    };
}

function removeSocialConnection(userId, targetUserId) {
    const normalizedUserId = socialText(userId);
    const normalizedTargetUserId = socialText(targetUserId);
    if (!normalizedUserId || !normalizedTargetUserId) return false;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.relationships)) this.state.social.relationships = [];
    const beforeCount = asArray(this.state.social.relationships).length;
    this.state.social.relationships = asArray(this.state.social.relationships).filter(item => {
        const type = socialText(item?.type).toLowerCase();
        const fromId = socialText(item?.fromId);
        const toId = socialText(item?.toId);
        if (type === 'connection' || type === 'connection-request') {
            return !(
                (fromId === normalizedUserId && toId === normalizedTargetUserId)
                || (fromId === normalizedTargetUserId && toId === normalizedUserId)
            );
        }
        return true;
    });
    if (beforeCount === this.state.social.relationships.length) return false;
    this.saveSocialMutation(normalizedUserId, 'connection-removed', 'social-relationship', `${normalizedUserId}:${normalizedTargetUserId}`);
    return true;
}

function toggleSocialFollow(userId, targetType, targetId) {
    const normalizedUserId = socialText(userId);
    const normalizedType = normalizeSocialScopeType(targetType === 'profile' ? 'profile' : targetType);
    const normalizedTargetId = socialText(targetId);
    if (!normalizedUserId || !normalizedTargetId) return null;
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = {};
    if (!Array.isArray(this.state.social.relationships)) this.state.social.relationships = [];
    const existing = asArray(this.state.social.relationships).find(item =>
        socialText(item?.type).toLowerCase() === 'follow'
        && socialText(item?.fromId) === normalizedUserId
        && socialText(item?.toType).toLowerCase() === normalizedType
        && socialText(item?.toId) === normalizedTargetId
    );
    if (existing) {
        this.state.social.relationships = asArray(this.state.social.relationships).filter(item => socialText(item?.id) !== socialText(existing.id));
        this.saveSocialMutation(normalizedUserId, 'follow-removed', 'social-relationship', socialText(existing.id), existing, null);
        return { following: false };
    }
    const relationship = {
        id: socialText(makeId('rel')),
        type: 'follow',
        fromId: normalizedUserId,
        toType: normalizedType,
        toId: normalizedTargetId,
        status: 'accepted',
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.relationships.unshift(relationship);
    let notificationOwnerId = '';
    if (normalizedType === 'page') notificationOwnerId = socialText(this.getSocialPageRecord(normalizedTargetId)?.ownerUserId);
    else if (normalizedType === 'group') notificationOwnerId = socialText(this.getSocialGroupRecord(normalizedTargetId)?.ownerUserId);
    else if (normalizedType === 'profile') notificationOwnerId = normalizedTargetId;
    if (notificationOwnerId && notificationOwnerId !== normalizedUserId) {
        this.createNotification({
            recipientUserId: notificationOwnerId,
            sourceDomain: 'social',
            type: 'follow',
            title: 'New follower',
            body: `${this.getSocialActorDisplayName(normalizedUserId)} followed your ${normalizedType}.`,
            routePage: 'social'
        });
    }
    this.saveSocialMutation(normalizedUserId, 'follow-created', 'social-relationship', relationship.id, null, relationship);
    return { following: true, relationship: clone(relationship) };
}

module.exports = {
    getPendingSocialConnectionRequestBetween,
    getSocialFollowerIds,
    isSocialConnection,
    isSocialFollowingTarget,
    removeSocialConnection,
    respondSocialConnectionRequest,
    sendSocialConnectionRequest,
    toggleSocialFollow
};
