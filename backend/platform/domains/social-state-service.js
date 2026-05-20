const {
    asArray,
    clone,
    makeId,
    nowIso
} = require('../utils');
const { createEmptySocialState } = require('../state-shape');

function socialText(value) {
    return String(value || '').trim();
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function listSocialRelationshipsForUser(userId) {
    const normalizedUserId = socialText(userId);
    return asArray(this.state.social.relationships)
        .map(item => clone(item))
        .filter(item => {
            if (!normalizedUserId) return false;
            const fromId = socialText(item?.fromId);
            const toId = socialText(item?.toId);
            return fromId === normalizedUserId || toId === normalizedUserId;
        })
        .sort((left, right) => socialCompareNewest(left?.createdAt, right?.createdAt));
}

function saveSocialMutation(actorId, eventType, entityType, entityId, beforeState = null, afterState = null) {
    if (actorId) {
        this.addAuditEvent({
            actorUserId: socialText(actorId),
            actorRole: this.state.accounts[socialText(actorId)]?.role || '',
            eventDomain: 'social',
            eventType,
            entityType,
            entityId,
            beforeState,
            afterState
        });
        return;
    }
    this.save();
}

function ensureSocialProjectCollections() {
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = createEmptySocialState();
    if (!Array.isArray(this.state.social.projects)) this.state.social.projects = [];
    if (!Array.isArray(this.state.social.projectTasks)) this.state.social.projectTasks = [];
    if (!Array.isArray(this.state.social.projectMilestones)) this.state.social.projectMilestones = [];
    if (!Array.isArray(this.state.social.projectDeliverables)) this.state.social.projectDeliverables = [];
    if (!Array.isArray(this.state.social.projectCheckins)) this.state.social.projectCheckins = [];
    if (!Array.isArray(this.state.social.projectActivities)) this.state.social.projectActivities = [];
}

function appendSocialProjectActivity(projectId, actorId, type, summary, extra = {}) {
    ensureSocialProjectCollections.call(this);
    const entry = {
        id: socialText(makeId('projact')),
        projectId: socialText(projectId),
        actorUserId: socialText(actorId),
        actorName: this.getSocialActorDisplayName(actorId),
        type: socialText(type || 'project-update'),
        summary: socialText(summary || ''),
        createdAt: nowIso(),
        ...clone(extra || {})
    };
    this.state.social.projectActivities.unshift(entry);
    return entry;
}

function getSocialBootstrap(viewerUserId = '') {
    const normalizedViewerId = socialText(viewerUserId);
    const pages = asArray(this.state.social.pages)
        .map(page => this.decorateSocialPage(page, normalizedViewerId))
        .filter(page => this.canViewSocialPage(page, normalizedViewerId))
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), undefined, { sensitivity: 'base' }));
    const groups = asArray(this.state.social.groups)
        .map(group => this.decorateSocialGroup(group, normalizedViewerId))
        .filter(group => this.canViewSocialGroup(group, normalizedViewerId) || group.membershipState === 'pending')
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), undefined, { sensitivity: 'base' }));
    const projects = asArray(this.state.social.projects)
        .map(project => this.decorateSocialProject(project, normalizedViewerId))
        .filter(project => this.canViewSocialProject(project, normalizedViewerId))
        .sort((left, right) => socialCompareNewest(left?.updatedAt, right?.updatedAt));
    const events = asArray(this.state.social.events)
        .map(event => this.decorateSocialEvent(event, normalizedViewerId))
        .filter(event => this.canViewSocialEvent(event, normalizedViewerId))
        .sort((left, right) => socialCompareNewest(left?.startsAt, right?.startsAt));
    const relationships = normalizedViewerId ? listSocialRelationshipsForUser.call(this, normalizedViewerId) : [];
    const reports = asArray(this.state.social.reports)
        .filter(() => this.isSocialAdmin(normalizedViewerId))
        .map(item => clone(item));
    return {
        profiles: clone(this.state.social.profiles || {}) || {},
        pages,
        groups,
        projects,
        relationships,
        events,
        lostFoundItems: asArray(this.state.social.lostFoundItems).map(item => clone(item)),
        rsvps: normalizedViewerId
            ? asArray(this.state.social.rsvps).filter(item => socialText(item?.userId) === normalizedViewerId).map(item => clone(item))
            : [],
        reports
    };
}

function upsertSocialState(social, actorId = '', reason = 'social-save') {
    const nextSocial = this.state.social && typeof this.state.social === 'object'
        ? this.state.social
        : createEmptySocialState();
    if (Object.prototype.hasOwnProperty.call(social || {}, 'lostFoundItems')) {
        nextSocial.lostFoundItems = asArray(clone(social?.lostFoundItems || [])).map(item => clone(item));
    }
    this.state.social = nextSocial;
    if (actorId) {
        this.addAuditEvent({
            actorUserId: actorId,
            actorRole: this.state.accounts[actorId]?.role || '',
            eventDomain: 'social',
            eventType: reason,
            entityType: 'social-state',
            entityId: 'social'
        });
    } else {
        this.save();
    }
    return getSocialBootstrap.call(this, actorId);
}

function ensureSocialGroupChat(groupId, actorId = '') {
    const group = this.getSocialGroupRecord(groupId);
    if (!group) return null;
    const members = this.getSocialGroupMemberIds(group);
    let chat = this.ensureChatBase({
        id: socialText(group.chatId || `portal-group::social::${socialText(group.id)}`),
        type: 'group',
        members,
        name: socialText(group.name || 'Social group'),
        groupId: socialText(group.id),
        avatarImage: socialText(group.avatarImage || ''),
        bannerImage: socialText(group.bannerImage || ''),
        createdBy: socialText(group.ownerUserId || actorId || members[0] || ''),
        createdAt: socialText(group.createdAt || nowIso())
    });
    group.chatId = chat.id;
    if (socialText(actorId)) {
        chat = this.unhideChatForUser(chat.id, actorId) || chat;
    }
    this.save();
    return {
        chat: clone(chat),
        social: getSocialBootstrap.call(this, actorId)
    };
}

module.exports = {
    appendSocialProjectActivity,
    ensureSocialGroupChat,
    ensureSocialProjectCollections,
    getSocialBootstrap,
    listSocialRelationshipsForUser,
    saveSocialMutation,
    upsertSocialState
};
