const {
    asArray,
    clone,
    makeId,
    normalizeCode,
    nowIso
} = require('../utils');

function socialText(value) {
    return String(value || '').trim();
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function isSocialStaffActor(userId) {
    const role = socialText(this.getSocialAccount?.(userId)?.role || '').toLowerCase();
    return ['professor', 'ta', 'admin', 'student_service'].includes(role);
}

function researchLaneForRole(role) {
    const normalized = socialText(role).toLowerCase();
    if (['professor', 'ta', 'admin', 'student_service'].includes(normalized)) return 'faculty';
    return 'student';
}

function normalizeResearchFormat(value) {
    return socialText(value).toLowerCase() === 'pdf' ? 'pdf' : 'article';
}

function normalizeResearchStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['draft', 'published'].includes(normalized)) return normalized;
    return 'draft';
}

function normalizeResearchTopics(value) {
    if (Array.isArray(value)) {
        return value.map((item) => socialText(item)).filter(Boolean).slice(0, 12);
    }
    return socialText(value)
        .split(/[,|]/)
        .map((item) => socialText(item))
        .filter(Boolean)
        .slice(0, 12);
}

function normalizeResearchPdf(pdf = null) {
    if (!pdf || typeof pdf !== 'object') return null;
    const storageKey = socialText(pdf.storageKey || pdf.id || '');
    const dataUrl = socialText(pdf.dataUrl || '');
    if (!storageKey && !dataUrl) return null;
    return {
        storageKey: storageKey || `inline-${makeId('pdf')}`,
        fileName: socialText(pdf.fileName || pdf.name || 'document.pdf') || 'document.pdf',
        mimeType: socialText(pdf.mimeType || pdf.type || 'application/pdf') || 'application/pdf',
        pageCount: Math.max(0, Number(pdf.pageCount) || 0),
        sizeBytes: Math.max(0, Number(pdf.sizeBytes || pdf.size) || 0),
        dataUrl
    };
}

function ensureResearchCollections(state) {
    if (!state.social || typeof state.social !== 'object') state.social = {};
    if (!Array.isArray(state.social.researchPublications)) state.social.researchPublications = [];
}

function getSocialResearchRecord(publicationId) {
    ensureResearchCollections(this.state);
    return asArray(this.state.social.researchPublications)
        .find((item) => socialText(item?.id) === socialText(publicationId)) || null;
}

function canViewSocialResearch(publication, viewerUserId = '') {
    if (!publication) return false;
    if (normalizeResearchStatus(publication.status) === 'published') return true;
    const viewer = socialText(viewerUserId);
    if (!viewer) return false;
    if (socialText(publication.authorUserId) === viewer) return true;
    return asArray(publication.coAuthorIds).map(socialText).includes(viewer);
}

function canManageSocialResearch(publication, actorId = '') {
    const actor = socialText(actorId);
    if (!publication || !actor) return false;
    if (socialText(publication.authorUserId) === actor) return true;
    if (asArray(publication.coAuthorIds).map(socialText).includes(actor)) return true;
    return Boolean(this.isSocialAdmin?.(actor));
}

function decorateSocialResearch(publication, viewerUserId = '') {
    if (!publication) return null;
    const viewer = socialText(viewerUserId);
    const savedBy = asArray(publication.savedByUserIds).map(socialText).filter(Boolean);
    return {
        ...clone(publication),
        isSaved: viewer ? savedBy.includes(viewer) : false,
        savedCount: savedBy.length,
        canManage: canManageSocialResearch.call(this, publication, viewer)
    };
}

function listSocialResearchPublications(filters = {}, viewerUserId = '') {
    ensureResearchCollections(this.state);
    const lane = socialText(filters.lane || filters.authorLane || '').toLowerCase();
    const format = socialText(filters.format || '').toLowerCase();
    const status = socialText(filters.status || '').toLowerCase();
    const facultyCode = normalizeCode(filters.facultyCode || '');
    const search = socialText(filters.search || filters.q || '').toLowerCase();
    const mine = filters.mine === true || socialText(filters.mine) === '1';
    const viewer = socialText(viewerUserId);

    return asArray(this.state.social.researchPublications)
        .filter((item) => canViewSocialResearch.call(this, item, viewer))
        .filter((item) => {
            if (mine) {
                if (!viewer) return false;
                return socialText(item.authorUserId) === viewer
                    || asArray(item.coAuthorIds).map(socialText).includes(viewer);
            }
            if (lane === 'faculty' || lane === 'student') {
                return socialText(item.authorLane) === lane
                    && normalizeResearchStatus(item.status) === 'published';
            }
            if (status === 'draft' || status === 'published') {
                return normalizeResearchStatus(item.status) === status;
            }
            return normalizeResearchStatus(item.status) === 'published'
                || socialText(item.authorUserId) === viewer;
        })
        .filter((item) => {
            if (format === 'article' || format === 'pdf') {
                return normalizeResearchFormat(item.format) === format;
            }
            return true;
        })
        .filter((item) => {
            if (!facultyCode) return true;
            return normalizeCode(item.facultyCode) === facultyCode;
        })
        .filter((item) => {
            if (!search) return true;
            const haystack = [
                item.title,
                item.abstract,
                item.bodyText,
                item.authorName,
                ...(asArray(item.topics))
            ].map((part) => socialText(part).toLowerCase()).join(' ');
            return haystack.includes(search);
        })
        .sort((left, right) => socialCompareNewest(
            left?.publishedAt || left?.updatedAt || left?.createdAt,
            right?.publishedAt || right?.updatedAt || right?.createdAt
        ))
        .map((item) => decorateSocialResearch.call(this, item, viewer));
}

function getSocialResearchPublication(publicationId, viewerUserId = '') {
    const publication = getSocialResearchRecord.call(this, publicationId);
    if (!publication || !canViewSocialResearch.call(this, publication, viewerUserId)) return null;
    return decorateSocialResearch.call(this, publication, viewerUserId);
}

function createSocialResearchPublication(payload = {}, actorId = '') {
    ensureResearchCollections(this.state);
    const creatorId = socialText(actorId);
    if (!creatorId) return null;
    const title = socialText(payload.title || '');
    if (!title) return null;
    const format = normalizeResearchFormat(payload.format);
    const pdf = format === 'pdf' ? normalizeResearchPdf(payload.pdf) : null;
    if (format === 'pdf' && !pdf) return null;
    const bodyText = format === 'article' ? socialText(payload.bodyText || payload.body || '') : '';
    const publishNow = payload.publish !== false && payload.status !== 'draft';
    if (publishNow && format === 'article' && !bodyText && !socialText(payload.abstract || '')) return null;

    const account = this.getSocialAccount?.(creatorId) || {};
    const forcedLane = socialText(payload.authorLane || '').toLowerCase();
    let authorLane = researchLaneForRole(account.role);
    if (authorLane === 'student') {
        authorLane = 'student';
    } else if (forcedLane === 'student' && this.isSocialAdmin?.(creatorId)) {
        authorLane = 'student';
    } else {
        authorLane = 'faculty';
    }

    const publication = {
        id: socialText(payload.id || makeId('research')),
        title,
        abstract: socialText(payload.abstract || ''),
        bodyText,
        format,
        pdf,
        authorUserId: creatorId,
        authorName: socialText(payload.authorName || this.getSocialActorDisplayName?.(creatorId) || account.name || 'Author'),
        authorRole: socialText(account.role || 'student').toLowerCase() || 'student',
        coAuthorIds: asArray(payload.coAuthorIds).map(socialText).filter(Boolean).slice(0, 12),
        authorLane,
        facultyCode: normalizeCode(payload.facultyCode || this.getSocialActorFacultyCode?.(creatorId) || account.facultyCode || ''),
        topics: normalizeResearchTopics(payload.topics),
        doiOrUrl: socialText(payload.doiOrUrl || payload.doi || ''),
        courseCode: socialText(payload.courseCode || ''),
        advisorName: socialText(payload.advisorName || ''),
        status: publishNow ? 'published' : 'draft',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        publishedAt: publishNow ? nowIso() : '',
        savedByUserIds: []
    };

    this.state.social.researchPublications.unshift(publication);
    this.saveSocialMutation(creatorId, 'research-created', 'social-research', publication.id, null, publication);
    return decorateSocialResearch.call(this, publication, creatorId);
}

function updateSocialResearchPublication(publicationId, payload = {}, actorId = '') {
    const publication = getSocialResearchRecord.call(this, publicationId);
    const normalizedActorId = socialText(actorId);
    if (!publication || !canManageSocialResearch.call(this, publication, normalizedActorId)) return null;
    const beforeState = clone(publication);

    if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
        const title = socialText(payload.title);
        if (!title) return null;
        publication.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'abstract')) {
        publication.abstract = socialText(payload.abstract);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'bodyText') || Object.prototype.hasOwnProperty.call(payload, 'body')) {
        publication.bodyText = socialText(payload.bodyText || payload.body || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'topics')) {
        publication.topics = normalizeResearchTopics(payload.topics);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'doiOrUrl') || Object.prototype.hasOwnProperty.call(payload, 'doi')) {
        publication.doiOrUrl = socialText(payload.doiOrUrl || payload.doi || '');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'facultyCode')) {
        publication.facultyCode = normalizeCode(payload.facultyCode);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'courseCode')) {
        publication.courseCode = socialText(payload.courseCode);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'advisorName')) {
        publication.advisorName = socialText(payload.advisorName);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'pdf') && publication.format === 'pdf') {
        const pdf = normalizeResearchPdf(payload.pdf);
        if (pdf) publication.pdf = pdf;
    }
    if (payload.publish === true || socialText(payload.status).toLowerCase() === 'published') {
        publication.status = 'published';
        if (!publication.publishedAt) publication.publishedAt = nowIso();
    } else if (socialText(payload.status).toLowerCase() === 'draft') {
        publication.status = 'draft';
    }
    publication.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'research-updated', 'social-research', publication.id, beforeState, publication);
    return decorateSocialResearch.call(this, publication, normalizedActorId);
}

function toggleSocialResearchSave(publicationId, actorId = '') {
    const publication = getSocialResearchRecord.call(this, publicationId);
    const normalizedActorId = socialText(actorId);
    if (!publication || !normalizedActorId) return null;
    if (!canViewSocialResearch.call(this, publication, normalizedActorId)) return null;
    const beforeState = clone(publication);
    const saved = asArray(publication.savedByUserIds).map(socialText).filter(Boolean);
    if (saved.includes(normalizedActorId)) {
        publication.savedByUserIds = saved.filter((id) => id !== normalizedActorId);
    } else {
        publication.savedByUserIds = [...saved, normalizedActorId];
    }
    publication.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'research-save-toggled', 'social-research', publication.id, beforeState, publication);
    return decorateSocialResearch.call(this, publication, normalizedActorId);
}

function deleteSocialResearchPublication(publicationId, actorId = '') {
    const publication = getSocialResearchRecord.call(this, publicationId);
    const normalizedActorId = socialText(actorId);
    if (!publication || !canManageSocialResearch.call(this, publication, normalizedActorId)) return null;
    const publicationIdText = socialText(publication.id);
    this.state.social.researchPublications = asArray(this.state.social.researchPublications)
        .filter((item) => socialText(item?.id) !== publicationIdText);
    this.saveSocialMutation(normalizedActorId, 'research-deleted', 'social-research', publicationIdText, clone(publication), null);
    return { id: publicationIdText };
}

module.exports = {
    canManageSocialResearch,
    canViewSocialResearch,
    createSocialResearchPublication,
    decorateSocialResearch,
    deleteSocialResearchPublication,
    ensureResearchCollections,
    getSocialResearchPublication,
    isSocialStaffActor,
    listSocialResearchPublications,
    researchLaneForRole,
    toggleSocialResearchSave,
    updateSocialResearchPublication
};
