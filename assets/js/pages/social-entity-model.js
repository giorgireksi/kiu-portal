/* Pure entity-link / attachable-entity helpers for social compose + discovery.
 * ESM leaf: social.html type=module; assigns window surface for classic consumers.
 */
'use strict';

function hooks() {
    return window.__kiuSocialEntityHooks || window.__kiuSocialWorkspaceHooks || {};
}

function text(value) {
    const hook = hooks().text;
    if (typeof hook === 'function') return hook(value);
    if (typeof window.text === 'function' && window.text !== text) return window.text(value);
    return String(value == null ? '' : value).trim();
}

function state() {
    const hook = hooks().state;
    if (typeof hook === 'function') return hook();
    if (typeof window.state === 'function' && window.state !== state) return window.state();
    return {};
}

function currentUserId() {
    const hook = hooks().currentUserId;
    if (typeof hook === 'function') return hook();
    if (typeof window.currentUserId === 'function' && window.currentUserId !== currentUserId) {
        return window.currentUserId();
    }
    return '';
}

function portfolioEntriesForViewer() {
    const hook = hooks().portfolioEntriesForViewer;
    if (typeof hook === 'function') return hook();
    if (typeof window.portfolioEntriesForViewer === 'function'
        && window.portfolioEntriesForViewer !== portfolioEntriesForViewer) {
        return window.portfolioEntriesForViewer();
    }
    return [];
}

function isManagedPage(page) {
    const hook = hooks().isManagedPage;
    if (typeof hook === 'function') return hook(page);
    if (typeof window.isManagedPage === 'function' && window.isManagedPage !== isManagedPage) {
        return window.isManagedPage(page);
    }
    return false;
}

function photographyPosts() {
    const hook = hooks().photographyPosts;
    if (typeof hook === 'function') return hook();
    if (typeof window.photographyPosts === 'function' && window.photographyPosts !== photographyPosts) {
        return window.photographyPosts();
    }
    return [];
}

export const POST_COMPOSE_ATTACH_SECTIONS = [
    { id: 'group', label: 'Groups', icon: 'fa-user-group' },
    { id: 'project', label: 'Projects', icon: 'fa-diagram-project' },
    { id: 'portfolio', label: 'Portfolio', icon: 'fa-briefcase' },
    { id: 'page', label: 'Pages', icon: 'fa-flag' },
    { id: 'event', label: 'Events', icon: 'fa-calendar-days' },
    { id: 'survey', label: 'Surveys', icon: 'fa-clipboard-list' },
    { id: 'photo', label: 'Exposé', icon: 'fa-camera-retro' },
    { id: 'lost-found', label: 'Lost & Found', icon: 'fa-magnifying-glass-location' }
];
export const POST_COMPOSE_ENTITY_LINK_MAX = 5;

export function normalizeComposerEntityLinks(value) {
    const seen = new Set();
    const links = [];
    (Array.isArray(value) ? value : []).forEach((item) => {
        if (links.length >= POST_COMPOSE_ENTITY_LINK_MAX) return;
        const type = text(item?.type || '').toLowerCase();
        const id = text(item?.id || '');
        if (!type || !id) return;
        const key = `${type}:${id}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push({ type, id });
    });
    return links;
}

export function postEntityLinks(post) {
    const links = normalizeComposerEntityLinks(post?.entityLinks);
    const surveyId = text(post?.linkedSurveyId || '');
    if (surveyId && !links.some((link) => link.type === 'survey' && link.id === surveyId)) {
        links.push({ type: 'survey', id: surveyId });
    }
    return links.slice(0, POST_COMPOSE_ENTITY_LINK_MAX);
}

export function entityLinkSectionLabel(type) {
    return POST_COMPOSE_ATTACH_SECTIONS.find((section) => section.id === type)?.label || type;
}

export function entityLinkIcon(type) {
    return POST_COMPOSE_ATTACH_SECTIONS.find((section) => section.id === type)?.icon || 'fa-link';
}

export function resolveEntityLinkMeta(link) {
    const type = text(link?.type || '').toLowerCase();
    const id = text(link?.id || '');
    const social = state().social || {};
    const me = currentUserId();
    if (type === 'group') {
        const group = (Array.isArray(social.groups) ? social.groups : []).find((item) => text(item?.id) === id);
        return {
            type,
            id,
            title: text(group?.name || 'Group'),
            subtitle: group ? (text(group.ownerUserId) === me || group.isManager ? 'Your group' : 'Campus group') : 'Group',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'project') {
        const project = (Array.isArray(social.projects) ? social.projects : []).find((item) => text(item?.id) === id);
        return {
            type,
            id,
            title: text(project?.name || project?.title || 'Project'),
            subtitle: project ? (text(project.ownerUserId) === me ? 'Your project' : 'Campus project') : 'Project',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'portfolio') {
        const entry = portfolioEntriesForViewer().find((item) => text(item?.id) === id)
            || (Array.isArray(social.portfolios) ? social.portfolios : []).find((item) => text(item?.userId) === id || text(item?.id) === id);
        const title = text(entry?.title || entry?.name || entry?.basics?.name || 'Portfolio');
        return {
            type,
            id,
            title,
            subtitle: text(entry?.userId || entry?.ownerUserId) === me ? 'Your portfolio' : 'Campus portfolio',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'page') {
        const page = (Array.isArray(social.pages) ? social.pages : []).find((item) => text(item?.id) === id);
        return {
            type,
            id,
            title: text(page?.name || 'Page'),
            subtitle: page && (isManagedPage(page) || text(page.ownerUserId) === me) ? 'Your page' : 'Campus page',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'event') {
        const event = (Array.isArray(social.events) ? social.events : []).find((item) => text(item?.id) === id);
        return {
            type,
            id,
            title: text(event?.title || 'Event'),
            subtitle: text(event?.createdById) === me ? 'Your event' : 'Campus event',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'survey') {
        const survey = (Array.isArray(social.surveys) ? social.surveys : []).find((item) => text(item?.id) === id);
        return {
            type,
            id,
            title: text(survey?.title || 'Survey'),
            subtitle: text(survey?.createdById) === me || survey?.viewerCanManage ? 'Your survey' : 'Campus survey',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'photo') {
        const photo = photographyPosts().find((item) => text(item?.id) === id);
        return {
            type,
            id,
            title: text(photo?.body || photo?.photoMeta?.caption || 'Exposé photo').slice(0, 80) || 'Exposé photo',
            subtitle: text(photo?.authorUserId) === me ? 'Your photo' : 'Campus photo',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    if (type === 'lost-found') {
        const item = (Array.isArray(social.lostFoundItems) ? social.lostFoundItems : []).find((row) => text(row?.id) === id);
        return {
            type,
            id,
            title: text(item?.title || 'Lost & Found item'),
            subtitle: text(item?.authorUserId || item?.createdById) === me ? 'Your listing' : 'Campus listing',
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }
    return {
        type,
        id,
        title: id || 'Attachment',
        subtitle: entityLinkSectionLabel(type),
        icon: entityLinkIcon(type),
        sectionLabel: entityLinkSectionLabel(type)
    };
}

export function isMineAttachableEntity(type, item) {
    const me = currentUserId();
    if (type === 'group') return text(item?.ownerUserId || item?.ownerId) === me || Boolean(item?.isManager);
    if (type === 'project') {
        const role = text(item?.role || '').toLowerCase();
        return text(item?.ownerUserId) === me || ['owner', 'member', 'advisor', 'instructor-viewer'].includes(role);
    }
    if (type === 'portfolio') {
        return text(item?.userId || item?.ownerUserId || item?.authorUserId) === me;
    }
    if (type === 'page') return Boolean(isManagedPage(item)) || text(item?.ownerUserId) === me;
    if (type === 'event') return text(item?.createdById) === me || Boolean(item?.viewerCanEdit);
    if (type === 'survey') return text(item?.createdById) === me || Boolean(item?.viewerCanManage);
    if (type === 'photo') return text(item?.authorUserId) === me;
    if (type === 'lost-found') return text(item?.authorUserId || item?.createdById) === me;
    return false;
}

export function listAttachableEntities(section, filter = 'mine', query = '') {
    const social = state().social || {};
    const needle = text(query || '').trim().toLowerCase();
    const wantMine = text(filter || 'mine') !== 'others';
    let rows = [];
    if (section === 'group') {
        rows = (Array.isArray(social.groups) ? social.groups : []).map((item) => ({
            type: 'group',
            id: text(item.id),
            title: text(item.name || 'Group'),
            subtitle: text(item.description || item.visibility || 'Group').slice(0, 80),
            mine: isMineAttachableEntity('group', item),
            raw: item
        }));
    } else if (section === 'project') {
        rows = (Array.isArray(social.projects) ? social.projects : []).map((item) => ({
            type: 'project',
            id: text(item.id),
            title: text(item.name || item.title || 'Project'),
            subtitle: text(item.summary || item.description || item.status || 'Project').slice(0, 80),
            mine: isMineAttachableEntity('project', item),
            raw: item
        }));
    } else if (section === 'portfolio') {
        rows = portfolioEntriesForViewer().map((item) => ({
            type: 'portfolio',
            id: text(item.id || item.userId),
            title: text(item.title || item.name || item.basics?.name || 'Portfolio'),
            subtitle: text(item.summary || item.headline || item.visibilityMode || 'Portfolio').slice(0, 80),
            mine: isMineAttachableEntity('portfolio', item),
            raw: item
        }));
    } else if (section === 'page') {
        rows = (Array.isArray(social.pages) ? social.pages : []).map((item) => ({
            type: 'page',
            id: text(item.id),
            title: text(item.name || 'Page'),
            subtitle: text(item.category || item.about || 'Page').slice(0, 80),
            mine: isMineAttachableEntity('page', item),
            raw: item
        }));
    } else if (section === 'event') {
        rows = (Array.isArray(social.events) ? social.events : []).map((item) => ({
            type: 'event',
            id: text(item.id),
            title: text(item.title || 'Event'),
            subtitle: text(item.location || item.eventType || 'Event').slice(0, 80),
            mine: isMineAttachableEntity('event', item),
            raw: item
        }));
    } else if (section === 'survey') {
        rows = (Array.isArray(social.surveys) ? social.surveys : []).map((item) => ({
            type: 'survey',
            id: text(item.id),
            title: text(item.title || 'Survey'),
            subtitle: text(item.description || item.status || 'Survey').slice(0, 80),
            mine: isMineAttachableEntity('survey', item),
            raw: item
        }));
    } else if (section === 'photo') {
        rows = photographyPosts().map((item) => ({
            type: 'photo',
            id: text(item.id),
            title: text(item.body || item.photoMeta?.caption || 'Exposé photo').slice(0, 80) || 'Exposé photo',
            subtitle: text(item.category || 'Photography'),
            mine: isMineAttachableEntity('photo', item),
            raw: item
        }));
    } else if (section === 'lost-found') {
        rows = (Array.isArray(social.lostFoundItems) ? social.lostFoundItems : []).map((item) => ({
            type: 'lost-found',
            id: text(item.id),
            title: text(item.title || 'Lost & Found item'),
            subtitle: text(item.location || item.category || item.status || 'Listing').slice(0, 80),
            mine: isMineAttachableEntity('lost-found', item),
            raw: item
        }));
    }
    return rows
        .filter((row) => row.id && (wantMine ? row.mine : !row.mine))
        .filter((row) => {
            if (!needle) return true;
            return `${row.title} ${row.subtitle}`.toLowerCase().includes(needle);
        });
}

export const socialEntityModelApi = {
    POST_COMPOSE_ATTACH_SECTIONS,
    POST_COMPOSE_ENTITY_LINK_MAX,
    normalizeComposerEntityLinks,
    postEntityLinks,
    entityLinkSectionLabel,
    entityLinkIcon,
    resolveEntityLinkMeta,
    isMineAttachableEntity,
    listAttachableEntities
};

/** Install classic window / Kiu surface (idempotent). */
export function installSocialEntityModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_ENTITY_MODEL_LOADED) {
        return target?.KiuSocialEntityModel || socialEntityModelApi;
    }
    target.__KIU_SOCIAL_ENTITY_MODEL_LOADED = true;
    target.__kiuSocialEntityModelExports = socialEntityModelApi;
    target.KiuSocialEntityModel = socialEntityModelApi;
    Object.keys(socialEntityModelApi).forEach((key) => {
        target[key] = socialEntityModelApi[key];
    });
    return socialEntityModelApi;
}

// type=module script tag: assign window surface for classic defer consumers
installSocialEntityModel();
