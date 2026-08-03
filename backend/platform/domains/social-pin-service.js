const {
    asArray,
    clone,
    normalizeCode,
    nowIso,
    uniqueStrings
} = require('../utils');

const SOCIAL_PIN_MODULES = ['portfolio', 'research', 'event', 'survey', 'photo', 'lostFound'];
const SOCIAL_PIN_API_VERSION = 1;

function socialText(value) {
    return String(value || '').trim();
}

function socialIdArray(values) {
    return uniqueStrings(asArray(values).map((value) => socialText(value)).filter(Boolean));
}

function normalizeSocialPinModule(value = '') {
    const normalized = socialText(value);
    if (SOCIAL_PIN_MODULES.includes(normalized)) return normalized;
    if (normalized === 'events') return 'event';
    if (normalized === 'surveys') return 'survey';
    if (normalized === 'photography' || normalized === 'expose') return 'photo';
    if (normalized === 'lost-found' || normalized === 'lostfound') return 'lostFound';
    return '';
}

function createEmptyModuleCuratorPins() {
    return {
        portfolio: [],
        research: [],
        event: [],
        survey: [],
        photo: [],
        lostFound: []
    };
}

function createEmptyUserPinBuckets() {
    return {
        portfolio: [],
        research: [],
        event: [],
        survey: [],
        photo: [],
        lostFound: []
    };
}

function ensureSocialPinState(state = {}) {
    if (!state.social || typeof state.social !== 'object') state.social = {};
    const social = state.social;
    if (!social.moduleCuratorPins || typeof social.moduleCuratorPins !== 'object') {
        social.moduleCuratorPins = createEmptyModuleCuratorPins();
    }
    SOCIAL_PIN_MODULES.forEach((module) => {
        social.moduleCuratorPins[module] = socialIdArray(social.moduleCuratorPins[module]);
    });
    if (!social.userPins || typeof social.userPins !== 'object') social.userPins = {};
    return social;
}

function getModuleCuratorPinIds(state = {}, module = '') {
    const normalizedModule = normalizeSocialPinModule(module);
    if (!normalizedModule) return [];
    const social = ensureSocialPinState(state);
    return socialIdArray(social.moduleCuratorPins?.[normalizedModule]);
}

function getUserPinIds(state = {}, module = '', userId = '') {
    const normalizedModule = normalizeSocialPinModule(module);
    const normalizedUserId = socialText(userId);
    if (!normalizedModule || !normalizedUserId) return [];
    const social = ensureSocialPinState(state);
    const bucket = social.userPins?.[normalizedUserId];
    if (!bucket || typeof bucket !== 'object') return [];
    return socialIdArray(bucket[normalizedModule]);
}

function ensureUserPinBucket(state = {}, userId = '') {
    const social = ensureSocialPinState(state);
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId) return null;
    if (!social.userPins[normalizedUserId] || typeof social.userPins[normalizedUserId] !== 'object') {
        social.userPins[normalizedUserId] = createEmptyUserPinBuckets();
    }
    SOCIAL_PIN_MODULES.forEach((module) => {
        social.userPins[normalizedUserId][module] = socialIdArray(social.userPins[normalizedUserId][module]);
    });
    return social.userPins[normalizedUserId];
}

function isPhotographyPost(post) {
    if (!post) return false;
    return socialText(post.category).toLowerCase() === 'photography'
        || socialText(post.postType).toLowerCase() === 'photo';
}

function getSocialPinEntityRecord(module, entityId) {
    const normalizedModule = normalizeSocialPinModule(module);
    const normalizedEntityId = socialText(entityId);
    if (!normalizedModule || !normalizedEntityId) return null;
    const social = this.state?.social || {};

    if (normalizedModule === 'portfolio') {
        const project = asArray(social.projects).find((item) => socialText(item?.id) === normalizedEntityId);
        if (project) return project;
        const docKey = normalizedEntityId.startsWith('portfolio-doc:')
            ? socialText(normalizedEntityId.slice('portfolio-doc:'.length))
            : normalizedEntityId;
        const portfolio = social.portfolios?.[docKey];
        if (portfolio) return { ...portfolio, id: normalizedEntityId, ownerUserId: socialText(portfolio.userId || docKey) };
        return null;
    }
    if (normalizedModule === 'research') {
        return asArray(social.researchPublications).find((item) => socialText(item?.id) === normalizedEntityId) || null;
    }
    if (normalizedModule === 'event') {
        return asArray(social.events).find((item) => socialText(item?.id) === normalizedEntityId) || null;
    }
    if (normalizedModule === 'survey') {
        return asArray(social.surveys).find((item) => socialText(item?.id) === normalizedEntityId) || null;
    }
    if (normalizedModule === 'photo') {
        const post = asArray(social.posts).find((item) => socialText(item?.id) === normalizedEntityId);
        return post && isPhotographyPost(post) ? post : null;
    }
    if (normalizedModule === 'lostFound') {
        return asArray(social.lostFoundItems).find((item) => socialText(item?.id) === normalizedEntityId) || null;
    }
    return null;
}

function canCuratorPinModuleEntity(module, entity, actorId = '') {
    const normalizedModule = normalizeSocialPinModule(module);
    const normalizedActorId = socialText(actorId);
    if (!normalizedModule || !entity || !normalizedActorId) return false;
    if (typeof this.isSocialAdmin === 'function' && this.isSocialAdmin(normalizedActorId)) return true;

    if (normalizedModule === 'portfolio') {
        const ownerId = socialText(entity.ownerUserId || entity.userId || '');
        return ownerId === normalizedActorId;
    }
    if (normalizedModule === 'research') {
        if (typeof this.canManageSocialResearch === 'function') {
            return this.canManageSocialResearch(entity, normalizedActorId);
        }
        return socialText(entity.authorUserId) === normalizedActorId;
    }
    if (normalizedModule === 'event') {
        if (typeof this.canEditSocialEvent === 'function') {
            return this.canEditSocialEvent(entity, normalizedActorId);
        }
        return socialText(entity.createdById) === normalizedActorId;
    }
    if (normalizedModule === 'survey') {
        if (typeof this.canManageSocialSurvey === 'function') {
            return this.canManageSocialSurvey(entity, normalizedActorId);
        }
        return socialText(entity.createdById) === normalizedActorId;
    }
    if (normalizedModule === 'photo') {
        return socialText(entity.authorUserId || entity.postedById) === normalizedActorId;
    }
    if (normalizedModule === 'lostFound') {
        return socialText(entity.authorUserId) === normalizedActorId;
    }
    return false;
}

function togglePinList(list = [], entityId = '') {
    const normalizedEntityId = socialText(entityId);
    const next = socialIdArray(list);
    if (!normalizedEntityId) return next;
    if (next.includes(normalizedEntityId)) {
        return next.filter((item) => item !== normalizedEntityId);
    }
    next.unshift(normalizedEntityId);
    return next;
}

function toggleModuleCuratorPin(module, entityId, actorId = '') {
    const normalizedModule = normalizeSocialPinModule(module);
    const normalizedEntityId = socialText(entityId);
    const normalizedActorId = socialText(actorId);
    const entity = getSocialPinEntityRecord.call(this, normalizedModule, normalizedEntityId);
    if (!normalizedModule || !entity || !normalizedActorId) return null;
    if (!canCuratorPinModuleEntity.call(this, normalizedModule, entity, normalizedActorId)) return null;

    const social = ensureSocialPinState(this.state);
    const beforeState = clone(social.moduleCuratorPins);
    social.moduleCuratorPins[normalizedModule] = togglePinList(social.moduleCuratorPins[normalizedModule], normalizedEntityId);
    const pinned = social.moduleCuratorPins[normalizedModule].includes(normalizedEntityId);
    if (typeof this.saveSocialMutation === 'function') {
        this.saveSocialMutation(
            normalizedActorId,
            pinned ? 'module-curator-pinned' : 'module-curator-unpinned',
            `social-pin-${normalizedModule}`,
            normalizedEntityId,
            beforeState,
            clone(social.moduleCuratorPins)
        );
    }
    return {
        module: normalizedModule,
        entityId: normalizedEntityId,
        kind: 'curator',
        pinned,
        moduleCuratorPins: clone(social.moduleCuratorPins)
    };
}

function toggleModuleUserPin(module, entityId, actorId = '') {
    const normalizedModule = normalizeSocialPinModule(module);
    const normalizedEntityId = socialText(entityId);
    const normalizedActorId = socialText(actorId);
    const entity = getSocialPinEntityRecord.call(this, normalizedModule, normalizedEntityId);
    if (!normalizedModule || !entity || !normalizedActorId) return null;

    if (normalizedModule === 'research' && typeof this.toggleSocialResearchSave === 'function') {
        const publication = this.toggleSocialResearchSave(normalizedEntityId, normalizedActorId);
        if (!publication) return null;
        return {
            module: normalizedModule,
            entityId: normalizedEntityId,
            kind: 'personal',
            pinned: Boolean(publication.isSaved),
            publication
        };
    }

    const bucket = ensureUserPinBucket(this.state, normalizedActorId);
    if (!bucket) return null;
    const beforeState = clone(bucket[normalizedModule]);
    bucket[normalizedModule] = togglePinList(bucket[normalizedModule], normalizedEntityId);
    const pinned = bucket[normalizedModule].includes(normalizedEntityId);
    if (typeof this.saveSocialMutation === 'function') {
        this.saveSocialMutation(
            normalizedActorId,
            pinned ? 'module-user-pinned' : 'module-user-unpinned',
            `social-pin-${normalizedModule}`,
            normalizedEntityId,
            beforeState,
            clone(bucket[normalizedModule])
        );
    }
    return {
        module: normalizedModule,
        entityId: normalizedEntityId,
        kind: 'personal',
        pinned,
        userPins: clone(bucket)
    };
}

function toggleSocialModulePin(module, entityId, kind = 'personal', actorId = '') {
    const normalizedKind = socialText(kind).toLowerCase() === 'curator' ? 'curator' : 'personal';
    if (normalizedKind === 'curator') {
        return toggleModuleCuratorPin.call(this, module, entityId, actorId);
    }
    return toggleModuleUserPin.call(this, module, entityId, actorId);
}

function listModulePinnedIds(module, viewerId = '', kind = 'all') {
    const normalizedModule = normalizeSocialPinModule(module);
    const normalizedViewerId = socialText(viewerId);
    const normalizedKind = socialText(kind).toLowerCase() || 'all';
    if (!normalizedModule) return { curator: [], personal: [], all: [] };

    const curator = getModuleCuratorPinIds(this.state, normalizedModule);
    let personal = getUserPinIds(this.state, normalizedModule, normalizedViewerId);

    if (normalizedModule === 'research' && normalizedViewerId) {
        personal = asArray(this.state?.social?.researchPublications)
            .filter((item) => asArray(item?.savedByUserIds).map(socialText).includes(normalizedViewerId))
            .map((item) => socialText(item.id))
            .filter(Boolean);
    }

    const all = socialIdArray([...curator, ...personal]);
    if (normalizedKind === 'curator') return { curator, personal: [], all: curator };
    if (normalizedKind === 'personal') return { curator: [], personal, all: personal };
    return { curator, personal, all };
}

function getSocialPinBootstrap(viewerUserId = '') {
    const social = ensureSocialPinState(this.state);
    const normalizedViewerId = socialText(viewerUserId);
    const moduleCuratorPins = clone(social.moduleCuratorPins || createEmptyModuleCuratorPins());
    const userPins = normalizedViewerId && social.userPins?.[normalizedViewerId]
        ? clone(social.userPins[normalizedViewerId])
        : createEmptyUserPinBuckets();
    return { moduleCuratorPins, userPins };
}

function sortByPinOrder(items = [], curatorIds = []) {
    const order = new Map(socialIdArray(curatorIds).map((id, index) => [id, index]));
    return [...items].sort((left, right) => {
        const leftId = socialText(left?.id);
        const rightId = socialText(right?.id);
        const leftRank = order.has(leftId) ? order.get(leftId) : Number.MAX_SAFE_INTEGER;
        const rightRank = order.has(rightId) ? order.get(rightId) : Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return socialText(right?.updatedAt || right?.createdAt || '').localeCompare(socialText(left?.updatedAt || left?.createdAt || ''));
    });
}

module.exports = {
    SOCIAL_PIN_API_VERSION,
    SOCIAL_PIN_MODULES,
    canCuratorPinModuleEntity,
    createEmptyModuleCuratorPins,
    createEmptyUserPinBuckets,
    ensureSocialPinState,
    getModuleCuratorPinIds,
    getSocialPinBootstrap,
    getSocialPinEntityRecord,
    getUserPinIds,
    listModulePinnedIds,
    normalizeSocialPinModule,
    sortByPinOrder,
    toggleModuleCuratorPin,
    toggleModuleUserPin,
    toggleSocialModulePin
};
