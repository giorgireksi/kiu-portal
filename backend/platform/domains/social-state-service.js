const {
    asArray,
    clone,
    makeId,
    nowIso,
    uniqueStrings
} = require('../utils');
const { createEmptySocialState } = require('../state-shape');

const LOST_FOUND_MIGRATION_VERSION = 5;
const LOST_FOUND_DEFAULT_LISTING_DAYS = 90;
const LOST_FOUND_DEAD_UI_KEYS = [
    'lostFoundFilter',
    'lostFoundBrowseFaculty',
    'lostFoundFaculty',
    'lostFoundScope',
    'lostFoundKind',
    'lostFoundStatus',
    'lostFoundComposerOpen'
];

function socialText(value) {
    return String(value || '').trim();
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function isLegacyLostFoundStatus(status = '') {
    const normalized = socialText(status).toLowerCase();
    return ['open', 'claimed', 'resolved', 'archived'].includes(normalized);
}

function resolveLostFoundExpiresAt(item = {}) {
    const explicit = socialText(item?.expiresAt || item?.endAt || item?.expiresOn);
    if (explicit) return explicit;
    const createdAt = socialText(item?.createdAt || item?.updatedAt);
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + LOST_FOUND_DEFAULT_LISTING_DAYS);
    return date.toISOString();
}

function isLostFoundItemExpired(item = {}, nowMs = Date.now()) {
    const expiresAt = socialText(item?.expiresAt);
    if (!expiresAt) return false;
    const expiresMs = new Date(expiresAt).getTime();
    return Number.isFinite(expiresMs) && expiresMs <= nowMs;
}

function resolveLostFoundStatus(item = {}) {
    const status = socialText(item?.status || 'lost').toLowerCase();
    if (status === 'found') return 'found';
    if (status === 'lost') return 'lost';
    const kind = socialText(item?.kind || 'lost').toLowerCase();
    if (kind === 'found') return 'found';
    const isFound = ['resolved', 'archived', 'claimed'].includes(status);
    return isFound ? 'found' : 'lost';
}

function normalizeLostFoundItem(item = {}) {
    const status = resolveLostFoundStatus(item);
    const foundAt = status === 'found'
        ? socialText(item?.foundAt || item?.resolvedAt || item?.updatedAt || item?.createdAt)
        : '';
    const foundByUserId = status === 'found'
        ? socialText(item?.foundByUserId || item?.resolvedByUserId || item?.authorUserId || item?.createdById)
        : '';
    return {
        id: socialText(item?.id),
        status,
        title: socialText(item?.title || ''),
        description: socialText(item?.description || ''),
        category: socialText(item?.category || 'General'),
        locationText: socialText(item?.locationText || item?.location || ''),
        eventDate: socialText(item?.eventDate || item?.lostAt || ''),
        imageUrl: socialText(item?.imageUrl || item?.photoUrl || ''),
        facultyCode: socialText(item?.facultyCode || item?.faculty || ''),
        authorUserId: socialText(item?.authorUserId || item?.createdById || ''),
        authorName: socialText(item?.authorName || ''),
        createdAt: socialText(item?.createdAt || ''),
        updatedAt: socialText(item?.updatedAt || item?.createdAt || ''),
        expiresAt: resolveLostFoundExpiresAt(item),
        foundAt,
        foundByUserId,
        contactChatId: socialText(item?.contactChatId || ''),
        notes: socialText(item?.notes || ''),
        relatedPageLinks: asArray(item?.relatedPageLinks).map((link) => clone(link))
    };
}

function normalizeLostFoundItems(items = []) {
    const seen = new Set();
    return asArray(items)
        .map((item) => normalizeLostFoundItem(item))
        .filter((item) => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        })
        .filter((item) => !isLostFoundItemExpired(item));
}

function stripLostFoundUiKeys(ui = {}) {
    if (!ui || typeof ui !== 'object') return;
    LOST_FOUND_DEAD_UI_KEYS.forEach((key) => {
        delete ui[key];
    });
}

function migrateLostFoundSocialState(state = {}) {
    if (!state.social || typeof state.social !== 'object') {
        state.social = createEmptySocialState();
    }
    const portalHub = state?.portal?.state?.socialHub;
    const portalItems = asArray(portalHub?.lostFoundItems);
    const socialItems = asArray(state.social.lostFoundItems);
    const mergedById = new Map();
    [...socialItems, ...portalItems].forEach((item) => {
        const normalized = normalizeLostFoundItem(item);
        if (normalized.id) mergedById.set(normalized.id, normalized);
    });
    const needsMigration = Number(state.social.migrationVersion || 0) < LOST_FOUND_MIGRATION_VERSION
        || portalItems.length > 0
        || socialItems.some((item) => (
            item?.kind != null
            || item?.campusScope != null
            || isLegacyLostFoundStatus(item?.status)
        ));
    state.social.lostFoundItems = normalizeLostFoundItems(Array.from(mergedById.values()));
    if (portalHub && typeof portalHub === 'object') {
        delete portalHub.lostFoundItems;
        stripLostFoundUiKeys(portalHub.ui);
    }
    if (needsMigration) {
        state.social.migrationVersion = LOST_FOUND_MIGRATION_VERSION;
    }
    return needsMigration;
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

function socialActivitySummary(type, details = {}) {
    const actorName = socialText(details.actorName || 'Someone');
    const targetName = socialText(details.targetName || details.memberName || 'a member');
    const conversationName = socialText(details.conversationName || 'conversation');
    const previousName = socialText(details.previousName || 'the conversation');
    switch (socialText(type)) {
        case 'conversation.created':
            return `${actorName} created the “${conversationName}” conversation.`;
        case 'conversation.renamed':
            return `${actorName} renamed “${previousName}” to “${conversationName}”.`;
        case 'member.invited':
            return `${actorName} invited ${targetName} to the group.`;
        case 'member.added':
            return `${actorName} added ${targetName} to the group.`;
        case 'member.removed':
            return `${actorName} removed ${targetName} from the group.`;
        case 'member.left':
            return `${targetName} left the group.`;
        case 'group.settings.changed':
            return `${actorName} changed group settings${details.summary ? `: ${socialText(details.summary)}` : '.'}`;
        default:
            return `${actorName} updated the group.`;
    }
}

function listSocialGroupChats(groupId) {
    const normalizedGroupId = socialText(groupId);
    if (!normalizedGroupId) return [];
    return Object.values(this.state.chats || {}).filter((chat) => (
        chat
        && socialText(chat.type || '') === 'group'
        && socialText(chat.groupId || '') === normalizedGroupId
    ));
}

function buildSocialActivityMessage(event = {}) {
    const details = event.details && typeof event.details === 'object' ? event.details : {};
    return {
        id: `social-system::${event.id}`,
        kind: 'system',
        type: 'system',
        isSystem: true,
        systemEventType: socialText(event.type || 'group.updated'),
        eventId: socialText(event.id),
        senderId: socialText(event.actorId || event.actorUserId),
        senderName: socialText(event.actorName || details.actorName || 'Someone'),
        senderRole: 'system',
        actorId: socialText(event.actorId || event.actorUserId),
        actorName: socialText(event.actorName || details.actorName || 'Someone'),
        text: socialText(event.summary || ''),
        metadata: clone(details),
        sentAt: socialText(event.createdAt) || nowIso(),
        countsAsUnread: false,
        seenBy: uniqueStrings([socialText(event.actorId || event.actorUserId)]),
        seenAtByUser: socialText(event.actorId || event.actorUserId)
            ? { [socialText(event.actorId || event.actorUserId)]: socialText(event.createdAt) || nowIso() }
            : {}
    };
}

function appendSocialGroupActivity(groupId, type, actorId = '', details = {}) {
    const group = typeof this.getSocialGroupRecord === 'function'
        ? this.getSocialGroupRecord(groupId)
        : null;
    const normalizedType = socialText(type || 'group.updated');
    const normalizedActorId = socialText(actorId);
    if (!group || !normalizedType) return null;
    const now = nowIso();
    const input = details && typeof details === 'object' ? clone(details) : {};
    const actorName = socialText(input.actorName)
        || (typeof this.getSocialActorDisplayName === 'function' ? this.getSocialActorDisplayName(normalizedActorId) : normalizedActorId)
        || 'Someone';
    const event = {
        id: socialText(input.eventId) || makeId('gactivity'),
        groupId: socialText(group.id),
        type: normalizedType,
        actorId: normalizedActorId,
        actorUserId: normalizedActorId,
        actorName,
        createdAt: socialText(input.createdAt) || now,
        details: {
            ...input,
            actorName
        }
    };
    event.summary = socialText(input.summary) || socialActivitySummary(normalizedType, event.details);
    group.activityEvents = asArray(group.activityEvents).filter((entry) => entry && socialText(entry.id));
    if (!group.activityEvents.some((entry) => socialText(entry.id) === event.id)) {
        group.activityEvents.push(event);
        if (group.activityEvents.length > 500) group.activityEvents = group.activityEvents.slice(-500);
    }
    const message = buildSocialActivityMessage(event);
    const chats = listSocialGroupChats.call(this, group.id);
    chats.forEach((chat) => {
        chat.messages = asArray(chat.messages);
        group.activityEvents.forEach((activityEvent) => {
            if (!activityEvent || chat.messages.some((entry) => socialText(entry?.eventId) === socialText(activityEvent.id))) return;
            chat.messages.push(buildSocialActivityMessage(activityEvent));
        });
        chat.updatedAt = event.createdAt;
    });
    return {
        event: clone(event),
        message: clone(message),
        chats: chats.map((chat) => clone(chat))
    };
}

function renameSocialGroupConversation(groupId, chatId, conversationName = '', actorId = '') {
    const group = typeof this.getSocialGroupRecord === 'function' ? this.getSocialGroupRecord(groupId) : null;
    const normalizedChatId = socialText(chatId);
    const normalizedActorId = socialText(actorId);
    const name = socialText(conversationName).slice(0, 80);
    if (!group || !normalizedChatId || !name || !normalizedActorId) return null;
    const chat = this.state.chats?.[normalizedChatId];
    if (!chat || socialText(chat.type || '') !== 'group' || socialText(chat.groupId || '') !== socialText(group.id)) return null;
    const canManage = typeof this.canManageSocialGroup === 'function' && this.canManageSocialGroup(group, normalizedActorId);
    const isConversationCreator = socialText(chat.createdBy) === normalizedActorId;
    if (!canManage && !isConversationCreator) return null;
    if (!asArray(chat.members).includes(normalizedActorId)) return null;
    const duplicate = listSocialGroupChats.call(this, group.id).find((entry) => (
        socialText(entry.id) !== normalizedChatId
        && socialText(entry.archivedAt) === ''
        && socialText(entry.conversationName || entry.name).toLocaleLowerCase() === name.toLocaleLowerCase()
    ));
    if (duplicate) return { duplicate: true, chat: clone(duplicate) };
    const previousName = socialText(chat.conversationName || chat.name || 'General');
    if (previousName === name) return { chat: clone(chat), chats: listSocialGroupChats.call(this, group.id).map((entry) => clone(entry)) };
    const beforeState = clone(chat);
    chat.conversationName = name;
    chat.updatedAt = nowIso();
    const activity = appendSocialGroupActivity.call(this, group.id, 'conversation.renamed', normalizedActorId, {
        conversationId: normalizedChatId,
        conversationName: name,
        previousName
    });
    this.saveSocialMutation(normalizedActorId, 'group-conversation-renamed', 'social-group-conversation', normalizedChatId, beforeState, chat);
    return {
        chat: clone(chat),
        chats: listSocialGroupChats.call(this, group.id).map((entry) => clone(entry)),
        event: activity?.event || null
    };
}

function ensureSocialProjectCollections() {
    if (!this.state.social || typeof this.state.social !== 'object') this.state.social = createEmptySocialState();
    if (!Array.isArray(this.state.social.projects)) this.state.social.projects = [];
    if (!Array.isArray(this.state.social.projectTasks)) this.state.social.projectTasks = [];
    if (!Array.isArray(this.state.social.projectActivities)) this.state.social.projectActivities = [];
    if (!Array.isArray(this.state.social.projectBudgetCategories)) this.state.social.projectBudgetCategories = [];
    if (!Array.isArray(this.state.social.projectBudgetExpenses)) this.state.social.projectBudgetExpenses = [];
    if (!Array.isArray(this.state.social.projectRisks)) this.state.social.projectRisks = [];
    if (!this.state.social.portfolios || typeof this.state.social.portfolios !== 'object') {
        this.state.social.portfolios = {};
    }
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
    migrateLostFoundSocialState(this.state);
    if (typeof this.closeExpiredSurveys === 'function') this.closeExpiredSurveys();
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
    const portfolios = Object.values(this.state.social.portfolios || {})
        .map((portfolio) => this.decoratePortfolio(portfolio, normalizedViewerId))
        .filter((portfolio) => portfolio?.canView);
    const events = asArray(this.state.social.events)
        .map(event => this.decorateSocialEvent(event, normalizedViewerId))
        .filter(event => this.canViewSocialEvent(event, normalizedViewerId))
        .sort((left, right) => socialCompareNewest(left?.startsAt, right?.startsAt));
    const surveys = typeof this.listSocialSurveys === 'function'
        ? this.listSocialSurveys({}, normalizedViewerId)
        : [];
    const researchPublications = typeof this.listSocialResearchPublications === 'function'
        ? this.listSocialResearchPublications({ status: 'all' }, normalizedViewerId)
        : asArray(this.state.social.researchPublications);
    const relationships = normalizedViewerId ? listSocialRelationshipsForUser.call(this, normalizedViewerId) : [];
    const reports = asArray(this.state.social.reports)
        .filter(() => this.isSocialAdmin(normalizedViewerId))
        .map(item => clone(item));
    const pinBootstrap = typeof this.getSocialPinBootstrap === 'function'
        ? this.getSocialPinBootstrap(normalizedViewerId)
        : { moduleCuratorPins: {}, userPins: {} };
    return {
        profiles: clone(this.state.social.profiles || {}) || {},
        pages,
        groups,
        projects,
        portfolios,
        relationships,
        events,
        surveys,
        researchPublications,
        lostFoundItems: normalizeLostFoundItems(this.state.social.lostFoundItems),
        moduleCuratorPins: pinBootstrap.moduleCuratorPins || {},
        userPins: pinBootstrap.userPins || {},
        surveyResponses: normalizedViewerId
            ? asArray(this.state.social.surveyResponses).filter(item => socialText(item?.userId) === normalizedViewerId).map(item => clone(item))
            : [],
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
        nextSocial.lostFoundItems = normalizeLostFoundItems(clone(social?.lostFoundItems || []));
    }
    this.state.social = nextSocial;
    migrateLostFoundSocialState(this.state);
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
    const normalizedActorId = socialText(actorId);
    if (normalizedActorId && !this.canViewSocialGroup(group, normalizedActorId)) return null;
    const members = uniqueStrings([
        ...this.getSocialGroupMemberIds(group),
        normalizedActorId
    ]);
    let chat = this.ensureChatBase({
        id: socialText(group.chatId || `portal-group::social::${socialText(group.id)}`),
        type: 'group',
        members,
        name: socialText(group.name || 'Social group'),
        groupId: socialText(group.id),
        conversationId: 'general',
        conversationName: 'General',
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

function createSocialGroupConversation(groupId, conversationName = '', actorId = '') {
    const group = this.getSocialGroupRecord(groupId);
    const normalizedActorId = socialText(actorId);
    const name = socialText(conversationName).slice(0, 80);
    if (!group || !name || !normalizedActorId || !this.canViewSocialGroup(group, normalizedActorId)) return null;
    const ensured = ensureSocialGroupChat.call(this, group.id, normalizedActorId);
    if (!ensured) return null;
    const members = uniqueStrings(this.getSocialGroupMemberIds(group));
    if (!members.includes(normalizedActorId)) return null;
    const existing = Object.values(this.state.chats || {}).find((chat) => (
        chat
        && chat.type === 'group'
        && socialText(chat.groupId) === socialText(group.id)
        && !socialText(chat.archivedAt)
        && socialText(chat.conversationName || chat.name).toLocaleLowerCase() === name.toLocaleLowerCase()
    ));
    if (existing) return { duplicate: true, chat: clone(existing) };
    const now = nowIso();
    const chat = this.ensureChatBase({
        id: `portal-group::social::${socialText(group.id)}::conversation::${makeId('gchat')}`,
        type: 'group',
        members,
        name: socialText(group.name || 'Social group'),
        conversationId: makeId('conversation'),
        conversationName: name,
        groupId: socialText(group.id),
        avatarImage: socialText(group.avatarImage || ''),
        bannerImage: socialText(group.bannerImage || ''),
        createdBy: normalizedActorId,
        createdAt: now
    });
    const activity = appendSocialGroupActivity.call(this, group.id, 'conversation.created', normalizedActorId, {
        conversationId: socialText(chat.conversationId),
        conversationName: name
    });
    this.saveSocialMutation(normalizedActorId, 'group-conversation-created', 'social-group-conversation', chat.id, null, chat);
    return {
        chat: clone(chat),
        chats: activity?.chats || listSocialGroupChats.call(this, group.id).map((entry) => clone(entry)),
        event: activity?.event || null,
        social: getSocialBootstrap.call(this, normalizedActorId)
    };
}

module.exports = {
    appendSocialGroupActivity,
    appendSocialProjectActivity,
    createSocialGroupConversation,
    ensureSocialGroupChat,
    ensureSocialProjectCollections,
    getSocialBootstrap,
    listSocialGroupChats,
    listSocialRelationshipsForUser,
    migrateLostFoundSocialState,
    isLostFoundItemExpired,
    renameSocialGroupConversation,
    normalizeLostFoundItem,
    normalizeLostFoundItems,
    saveSocialMutation,
    upsertSocialState
};