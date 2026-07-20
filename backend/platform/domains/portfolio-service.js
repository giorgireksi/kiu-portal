const {
    asArray,
    clone,
    makeId,
    normalizeCode,
    nowIso,
    uniqueStrings
} = require('../utils');

function normalizeSafeExternalUrl(value = '') {
    const raw = portfolioText(value);
    if (!raw) return '';
    if (/^(mailto:|tel:)/i.test(raw)) return raw;
    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
    } catch (error) {}
    return '';
}

function normalizePortfolioLinks(values) {
    return asArray(values)
        .map((item) => {
            if (item && typeof item === 'object') {
                const label = portfolioText(item.label || item.title || item.name || item.url);
                const url = normalizeSafeExternalUrl(item.url || item.href || '');
                if (!url) return null;
                return { label: label || url, url };
            }
            const url = normalizeSafeExternalUrl(item);
            if (!url) return null;
            return { label: url, url };
        })
        .filter(Boolean);
}

function normalizePortfolioMediaItems(values) {
    return asArray(values)
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const cloned = clone(item);
            const storageKey = portfolioText(cloned.storageKey || cloned.id || '');
            const dataUrl = portfolioText(cloned.dataUrl || '');
            if (!storageKey && !dataUrl) return null;
            return {
                ...cloned,
                id: portfolioText(cloned.id || storageKey || makeId('portfolio-media')),
                name: portfolioText(cloned.name || 'portfolio-file'),
                type: portfolioText(cloned.type || 'application/octet-stream'),
                storageKey,
                storageBackend: portfolioText(cloned.storageBackend || (storageKey ? 'bridge' : 'inline')),
                dataUrl
            };
        })
        .filter(Boolean);
}

const MAX_CUSTOM_SECTIONS = 8;
const MAX_ENTRIES_PER_SECTION = 20;
const BUILTIN_SECTION_KEYS = ['education', 'experience', 'projects', 'skills'];
const FIELD_TYPES = ['text', 'dateRange', 'link', 'file'];

function portfolioText(value) {
    return String(value || '').trim();
}

function normalizePortfolioStatus(value) {
    const normalized = portfolioText(value).toLowerCase();
    return normalized === 'published' ? 'published' : 'draft';
}

function normalizePortfolioVisibilityMode(value, fallback = 'staff_only') {
    const normalized = portfolioText(value).toLowerCase();
    if (['staff_only', 'students_only'].includes(normalized)) return normalized;
    return fallback;
}

function normalizeDateRange(value = {}) {
    const source = value && typeof value === 'object' ? value : {};
    return {
        start: portfolioText(source.start || ''),
        end: portfolioText(source.end || ''),
        current: Boolean(source.current)
    };
}

function normalizeFieldValue(type, value) {
    const normalizedType = portfolioText(type);
    if (!FIELD_TYPES.includes(normalizedType)) return null;
    if (normalizedType === 'text') {
        return { type: normalizedType, value: portfolioText(value).slice(0, 5000) };
    }
    if (normalizedType === 'dateRange') {
        return { type: normalizedType, value: normalizeDateRange(value) };
    }
    if (normalizedType === 'link') {
        const source = value && typeof value === 'object' ? value : { url: value };
        const links = normalizePortfolioLinks([source]);
        if (!links.length) return { type: normalizedType, value: { label: '', url: '' } };
        return { type: normalizedType, value: links[0] };
    }
    if (normalizedType === 'file') {
        const items = normalizePortfolioMediaItems(Array.isArray(value) ? value : (value ? [value] : []));
        return { type: normalizedType, value: items[0] || null };
    }
    return null;
}

function normalizeCustomFieldDefinition(raw = {}) {
    const type = portfolioText(raw.type);
    if (!FIELD_TYPES.includes(type)) return null;
    const key = portfolioText(raw.key || raw.id || makeId('field'));
    const label = portfolioText(raw.label || 'Field').slice(0, 120);
    if (!label) return null;
    return { id: key, key, type, label };
}

function normalizeSectionEntry(raw = {}, fieldDefinitions = []) {
    const entryId = portfolioText(raw.id || makeId('entry'));
    const fields = {};
    const defsByKey = {};
    fieldDefinitions.forEach((def) => {
        if (def?.key) defsByKey[def.key] = def;
    });
    const rawFields = raw.fields && typeof raw.fields === 'object' ? raw.fields : raw;
    Object.keys(rawFields).forEach((key) => {
        const def = defsByKey[key];
        const rawField = rawFields[key];
        if (rawField && typeof rawField === 'object' && rawField.type) {
            const normalized = normalizeFieldValue(rawField.type, rawField.value);
            if (normalized) fields[key] = normalized;
            return;
        }
        if (def) {
            const normalized = normalizeFieldValue(def.type, rawField);
            if (normalized) fields[key] = normalized;
        }
    });
    return {
        id: entryId,
        order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
        fields
    };
}

function defaultBuiltinSections() {
    return {
        education: {
            builtinKey: 'education',
            label: 'Education',
            repeatable: true,
            visible: true,
            fieldDefinitions: [
                { id: 'school', key: 'school', type: 'text', label: 'School' },
                { id: 'degree', key: 'degree', type: 'text', label: 'Degree' },
                { id: 'dates', key: 'dates', type: 'dateRange', label: 'Dates' },
                { id: 'note', key: 'note', type: 'text', label: 'Note' }
            ],
            entries: []
        },
        experience: {
            builtinKey: 'experience',
            label: 'Experience',
            repeatable: true,
            visible: true,
            fieldDefinitions: [
                { id: 'role', key: 'role', type: 'text', label: 'Role' },
                { id: 'organization', key: 'organization', type: 'text', label: 'Organization' },
                { id: 'dates', key: 'dates', type: 'dateRange', label: 'Dates' },
                { id: 'description', key: 'description', type: 'text', label: 'What you did' }
            ],
            entries: []
        },
        projects: {
            builtinKey: 'projects',
            label: 'Projects',
            repeatable: true,
            visible: true,
            fieldDefinitions: [
                { id: 'title', key: 'title', type: 'text', label: 'Title' },
                { id: 'description', key: 'description', type: 'text', label: 'Description' },
                { id: 'link', key: 'link', type: 'link', label: 'Link' },
                { id: 'file', key: 'file', type: 'file', label: 'File' }
            ],
            entries: []
        },
        skills: {
            builtinKey: 'skills',
            label: 'Skills',
            repeatable: false,
            visible: true,
            fieldDefinitions: [
                { id: 'tags', key: 'tags', type: 'text', label: 'Skills' }
            ],
            entries: [{ id: 'skills-default', order: 0, fields: { tags: { type: 'text', value: '' } } }]
        }
    };
}

function normalizeCustomSection(raw = {}) {
    const sectionId = portfolioText(raw.id || makeId('custom'));
    const label = portfolioText(raw.label || 'Custom section').slice(0, 80);
    const fieldDefinitions = asArray(raw.fieldDefinitions)
        .map(normalizeCustomFieldDefinition)
        .filter(Boolean)
        .slice(0, 15);
    const entries = asArray(raw.entries)
        .map((entry) => normalizeSectionEntry(entry, fieldDefinitions))
        .slice(0, MAX_ENTRIES_PER_SECTION);
    return {
        id: sectionId,
        builtinKey: null,
        label,
        templateId: portfolioText(raw.templateId || ''),
        repeatable: raw.repeatable !== false,
        visible: raw.visible !== false,
        fieldDefinitions,
        entries
    };
}

function normalizeBuiltinSection(key, raw = {}) {
    const defaults = defaultBuiltinSections()[key];
    if (!defaults) return null;
    const fieldDefinitions = defaults.fieldDefinitions;
    const entries = asArray(raw.entries)
        .map((entry) => normalizeSectionEntry(entry, fieldDefinitions))
        .slice(0, MAX_ENTRIES_PER_SECTION);
    return {
        ...defaults,
        visible: raw.visible !== false,
        entries
    };
}

function normalizePortfolioBasics(raw = {}, account = {}) {
    const links = normalizePortfolioLinks(raw.links || raw.profiles || []);
    return {
        name: portfolioText(raw.name || account.displayName || account.name || ''),
        headline: portfolioText(raw.headline || '').slice(0, 160),
        summary: portfolioText(raw.summary || '').slice(0, 5000),
        email: portfolioText(raw.email || account.email || ''),
        photoAssetId: portfolioText(raw.photoAssetId || ''),
        photoUrl: portfolioText(raw.photoUrl || raw.avatarImage || account.avatarImage || ''),
        links
    };
}

function normalizePortfolioDocument(raw = {}, account = {}) {
    const userId = portfolioText(raw.userId || account.id || '');
    const sectionsInput = raw.sections && typeof raw.sections === 'object' ? raw.sections : {};
    const sections = {};
    BUILTIN_SECTION_KEYS.forEach((key) => {
        sections[key] = normalizeBuiltinSection(key, sectionsInput[key] || {});
    });
    const customKeys = uniqueStrings(
        asArray(raw.sectionOrder)
            .map((key) => portfolioText(key))
            .filter((key) => key.startsWith('custom_'))
    );
    Object.keys(sectionsInput).forEach((key) => {
        if (!key.startsWith('custom_')) return;
        customKeys.push(key);
    });
    customKeys.slice(0, MAX_CUSTOM_SECTIONS).forEach((key) => {
        const normalized = normalizeCustomSection({ ...sectionsInput[key], id: key });
        if (normalized) sections[key] = normalized;
    });
    const sectionOrder = uniqueStrings(
        asArray(raw.sectionOrder).length
            ? raw.sectionOrder
            : [...BUILTIN_SECTION_KEYS, ...customKeys]
    ).filter((key) => sections[key]);

    return {
        userId,
        status: normalizePortfolioStatus(raw.status),
        visibilityMode: normalizePortfolioVisibilityMode(raw.visibilityMode),
        consentAcknowledged: Boolean(raw.consentAcknowledged),
        basics: normalizePortfolioBasics(raw.basics || {}, account),
        sectionOrder,
        sections,
        ownerFacultyCode: normalizeCode(raw.ownerFacultyCode || account.facultyCode || account.faculty || ''),
        createdAt: portfolioText(raw.createdAt || nowIso()),
        updatedAt: portfolioText(raw.updatedAt || raw.createdAt || nowIso()),
        publishedAt: portfolioText(raw.publishedAt || '')
    };
}

function ensurePortfolioCollections() {
    if (!this.state.social || typeof this.state.social !== 'object') {
        const { createEmptySocialState } = require('../state-shape');
        this.state.social = createEmptySocialState();
    }
    if (!this.state.social.portfolios || typeof this.state.social.portfolios !== 'object') {
        this.state.social.portfolios = {};
    }
}

function getPortfolioRecord(userId) {
    ensurePortfolioCollections.call(this);
    const normalizedUserId = portfolioText(userId);
    if (!normalizedUserId) return null;
    const record = this.state.social.portfolios[normalizedUserId];
    return record && typeof record === 'object' ? record : null;
}

function getSocialAccountBasics(userId) {
    return this.state.accounts?.[portfolioText(userId)] || {};
}

function migrateProjectsToPortfolio(userId) {
    const account = getSocialAccountBasics.call(this, userId);
    const ownedProjects = asArray(this.state.social?.projects)
        .filter((project) => portfolioText(project?.ownerUserId) === portfolioText(userId));
    if (!ownedProjects.length) return null;

    const sections = defaultBuiltinSections();
    sections.projects.entries = ownedProjects.map((project, index) => normalizeSectionEntry({
        id: portfolioText(project.id),
        order: index,
        fields: {
            title: { type: 'text', value: portfolioText(project.title || project.name) },
            description: { type: 'text', value: portfolioText(project.description || project.summary) },
            link: { type: 'link', value: (project.externalLinks || [])[0] || null },
            file: { type: 'file', value: (project.mediaItems || [])[0] || null }
        }
    }, sections.projects.fieldDefinitions));

    const skillTags = uniqueStrings(ownedProjects.flatMap((project) => asArray(project.skillTags)));
    if (skillTags.length) {
        sections.skills.entries = [{
            id: 'skills-migrated',
            order: 0,
            fields: { tags: { type: 'text', value: skillTags.join(', ') } }
        }];
    }

    const primary = ownedProjects[0] || {};
    const publishedProject = ownedProjects.find((project) => normalizePortfolioStatus(project.status) === 'published');
    const status = publishedProject ? 'published' : 'draft';
    const visibilityMode = normalizePortfolioVisibilityMode(
        publishedProject?.visibilityMode || primary.visibilityMode,
        'staff_only'
    );

    return normalizePortfolioDocument({
        userId,
        status,
        visibilityMode,
        basics: {
            name: portfolioText(primary.title || account.displayName),
            headline: portfolioText(primary.courseTag || ''),
            summary: portfolioText(primary.summary || primary.description),
            email: portfolioText(account.email)
        },
        sections,
        ownerFacultyCode: normalizeCode(primary.ownerFacultyCode || account.facultyCode),
        publishedAt: publishedProject?.updatedAt || '',
        migratedFromProjects: true
    }, account);
}

function createEmptyPortfolio(userId) {
    const account = getSocialAccountBasics.call(this, userId);
    return normalizePortfolioDocument({
        userId,
        status: 'draft',
        visibilityMode: 'staff_only',
        basics: {
            name: portfolioText(account.displayName || account.name),
            email: portfolioText(account.email),
            photoUrl: portfolioText(account.avatarImage || '')
        },
        sections: defaultBuiltinSections(),
        ownerFacultyCode: normalizeCode(account.facultyCode || account.faculty || '')
    }, account);
}

function getOrCreatePortfolio(userId) {
    ensurePortfolioCollections.call(this);
    const normalizedUserId = portfolioText(userId);
    if (!normalizedUserId) return null;
    let record = getPortfolioRecord.call(this, normalizedUserId);
    if (record) {
        const account = getSocialAccountBasics.call(this, normalizedUserId);
        return normalizePortfolioDocument({ ...record, userId: normalizedUserId }, account);
    }
    const migrated = migrateProjectsToPortfolio.call(this, normalizedUserId);
    const next = migrated || createEmptyPortfolio.call(this, normalizedUserId);
    this.state.social.portfolios[normalizedUserId] = clone(next);
    this.save?.();
    return next;
}

function canViewPortfolio(portfolio, viewerUserId) {
    if (!portfolio) return false;
    const normalizedViewerId = portfolioText(viewerUserId);
    if (!normalizedViewerId) return false;
    const ownerUserId = portfolioText(portfolio.userId);
    if (ownerUserId === normalizedViewerId) return true;

    const viewerRole = portfolioText(this.getSocialAccount(normalizedViewerId)?.role).toLowerCase();
    if (['professor', 'ta', 'admin', 'student_service'].includes(viewerRole)) return true;

    if (normalizePortfolioStatus(portfolio.status) !== 'published') return false;

    const visibilityMode = normalizePortfolioVisibilityMode(portfolio.visibilityMode);
    if (visibilityMode === 'staff_only') {
        return ['professor', 'ta', 'admin', 'student_service'].includes(viewerRole);
    }
    return true;
}

function decoratePortfolio(portfolio, viewerUserId = '') {
    const normalized = normalizePortfolioDocument(portfolio, getSocialAccountBasics.call(this, portfolio?.userId));
    const canView = canViewPortfolio.call(this, normalized, viewerUserId);
    const canEdit = portfolioText(viewerUserId) === portfolioText(normalized.userId)
        || ['admin', 'student_service'].includes(portfolioText(this.getSocialAccount(viewerUserId)?.role).toLowerCase());
    return {
        ...normalized,
        canView,
        canEdit,
        isOwner: portfolioText(viewerUserId) === portfolioText(normalized.userId)
    };
}

function countStartedSections(portfolio) {
    const sections = portfolio?.sections || {};
    return Object.values(sections).filter((section) => {
        if (!section || !Array.isArray(section.entries)) return false;
        if (section.builtinKey === 'skills') {
            const tags = portfolioText(section.entries?.[0]?.fields?.tags?.value);
            return Boolean(tags);
        }
        return section.entries.some((entry) => {
            const values = entry?.fields || {};
            return Object.values(values).some((field) => {
                if (!field || typeof field !== 'object') return false;
                if (field.type === 'text') return Boolean(portfolioText(field.value));
                if (field.type === 'dateRange') return Boolean(portfolioText(field.value?.start));
                if (field.type === 'link') return Boolean(portfolioText(field.value?.url));
                if (field.type === 'file') return Boolean(field.value);
                return false;
            });
        });
    }).length;
}

function validatePortfolioPublish(portfolio, payload = {}) {
    const errors = [];
    const basics = portfolio?.basics || {};
    if (!portfolioText(basics.name)) errors.push('Add your name before publishing.');
    if (!portfolioText(basics.summary) && countStartedSections(portfolio) < 2) {
        errors.push('Add a summary or fill at least two sections before publishing.');
    }
    const visibilityMode = normalizePortfolioVisibilityMode(payload.visibilityMode || portfolio.visibilityMode);
    if (visibilityMode === 'students_only' && !Boolean(payload.consentAcknowledged || portfolio.consentAcknowledged)) {
        errors.push('Confirm campus visibility before publishing to peers.');
    }
    return errors;
}

function savePortfolio(userId, payload = {}, actorId = '') {
    ensurePortfolioCollections.call(this);
    const normalizedUserId = portfolioText(userId || actorId);
    if (!normalizedUserId) return null;
    if (portfolioText(actorId) && portfolioText(actorId) !== normalizedUserId) {
        const actorRole = portfolioText(this.getSocialAccount(actorId)?.role).toLowerCase();
        if (!['admin', 'student_service'].includes(actorRole)) return null;
    }

    const existing = getOrCreatePortfolio.call(this, normalizedUserId);
    const account = getSocialAccountBasics.call(this, normalizedUserId);
    const merged = normalizePortfolioDocument({
        ...existing,
        ...payload,
        userId: normalizedUserId,
        basics: { ...existing.basics, ...(payload.basics || {}) },
        sections: payload.sections ? payload.sections : existing.sections,
        sectionOrder: payload.sectionOrder || existing.sectionOrder,
        updatedAt: nowIso()
    }, account);

    const customCount = Object.keys(merged.sections).filter((key) => key.startsWith('custom_')).length;
    if (customCount > MAX_CUSTOM_SECTIONS) return null;

    this.state.social.portfolios[normalizedUserId] = clone(merged);
    this.save?.();
    return decoratePortfolio.call(this, merged, actorId || normalizedUserId);
}

function publishPortfolio(userId, payload = {}, actorId = '') {
    const normalizedUserId = portfolioText(userId || actorId);
    const portfolio = getOrCreatePortfolio.call(this, normalizedUserId);
    const errors = validatePortfolioPublish(portfolio, payload);
    if (errors.length) {
        const error = new Error(errors[0]);
        error.validationErrors = errors;
        throw error;
    }
    return savePortfolio.call(this, normalizedUserId, {
        status: 'published',
        visibilityMode: normalizePortfolioVisibilityMode(payload.visibilityMode || portfolio.visibilityMode),
        consentAcknowledged: Boolean(payload.consentAcknowledged),
        publishedAt: nowIso()
    }, actorId || normalizedUserId);
}

function unpublishPortfolio(userId, actorId = '') {
    const normalizedUserId = portfolioText(userId || actorId);
    return savePortfolio.call(this, normalizedUserId, {
        status: 'draft',
        publishedAt: ''
    }, actorId || normalizedUserId);
}

function listDiscoverablePortfolios(viewerUserId = '', filters = {}) {
    ensurePortfolioCollections.call(this);
    const normalizedViewerId = portfolioText(viewerUserId);
    const search = portfolioText(filters.q || filters.search).toLowerCase();
    const faculty = normalizeCode(filters.faculty || '');
    const visibilityFilter = portfolioText(filters.visibility || filters.visibilityMode || '');

    return Object.values(this.state.social.portfolios || {})
        .map((item) => decoratePortfolio.call(this, item, normalizedViewerId))
        .filter((item) => item.canView && normalizePortfolioStatus(item.status) === 'published')
        .filter((item) => {
            if (visibilityFilter && visibilityFilter !== 'all') {
                return normalizePortfolioVisibilityMode(item.visibilityMode) === visibilityFilter;
            }
            return true;
        })
        .filter((item) => {
            if (faculty && faculty !== 'all' && normalizeCode(item.ownerFacultyCode) !== faculty) return false;
            if (!search) return true;
            const skills = portfolioText(item.sections?.skills?.entries?.[0]?.fields?.tags?.value || '');
            const blob = `${item.basics?.name} ${item.basics?.headline} ${item.basics?.summary} ${skills}`.toLowerCase();
            return blob.includes(search);
        })
        .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

function addCustomPortfolioSection(userId, payload = {}, actorId = '') {
    const normalizedUserId = portfolioText(userId || actorId);
    const portfolio = getOrCreatePortfolio.call(this, normalizedUserId);
    const customCount = Object.keys(portfolio.sections).filter((key) => key.startsWith('custom_')).length;
    if (customCount >= MAX_CUSTOM_SECTIONS) {
        const error = new Error('You can add up to 8 custom sections.');
        error.validationErrors = [error.message];
        throw error;
    }
    const sectionId = portfolioText(payload.id || makeId('custom'));
    const key = sectionId.startsWith('custom_') ? sectionId : `custom_${sectionId}`;
    const section = normalizeCustomSection({ ...payload, id: key });
    const sections = { ...portfolio.sections, [key]: section };
    const sectionOrder = uniqueStrings([...(portfolio.sectionOrder || []), key]);
    return savePortfolio.call(this, normalizedUserId, { sections, sectionOrder }, actorId || normalizedUserId);
}

module.exports = {
    BUILTIN_SECTION_KEYS,
    FIELD_TYPES,
    MAX_CUSTOM_SECTIONS,
    MAX_ENTRIES_PER_SECTION,
    addCustomPortfolioSection,
    canViewPortfolio,
    countStartedSections,
    createEmptyPortfolio,
    decoratePortfolio,
    defaultBuiltinSections,
    getOrCreatePortfolio,
    getPortfolioRecord,
    listDiscoverablePortfolios,
    migrateProjectsToPortfolio,
    normalizePortfolioDocument,
    publishPortfolio,
    savePortfolio,
    unpublishPortfolio,
    validatePortfolioPublish
};