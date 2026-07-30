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

function inferResearchFileKind(fileName = '', mimeType = '') {
    const name = socialText(fileName).toLowerCase();
    const mime = socialText(mimeType).toLowerCase();
    if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (
        mime.includes('presentation')
        || mime.includes('powerpoint')
        || /\.(ppt|pptx|odp|key)$/.test(name)
    ) return 'slides';
    if (
        mime.includes('word')
        || mime.includes('msword')
        || mime.includes('document')
        || /\.(doc|docx|odt|rtf|txt)$/.test(name)
    ) return 'document';
    return 'other';
}

function normalizeResearchFile(file = null) {
    if (!file || typeof file !== 'object') return null;
    const storageKey = socialText(file.storageKey || file.id || '');
    const dataUrl = socialText(file.dataUrl || '');
    if (!storageKey && !dataUrl) return null;
    const fileName = socialText(file.fileName || file.name || 'file') || 'file';
    const mimeType = socialText(file.mimeType || file.type || 'application/octet-stream') || 'application/octet-stream';
    return {
        storageKey: storageKey || `inline-${makeId('file')}`,
        fileName,
        mimeType,
        sizeBytes: Math.max(0, Number(file.sizeBytes || file.size) || 0),
        pageCount: Math.max(0, Number(file.pageCount) || 0),
        dataUrl,
        fileKind: inferResearchFileKind(fileName, mimeType)
    };
}

function normalizeResearchFiles(payload = {}) {
    const collected = [];
    asArray(payload.files).forEach((item) => {
        const normalized = normalizeResearchFile(item);
        if (normalized) collected.push(normalized);
    });
    const legacyPdf = normalizeResearchPdf(payload.pdf);
    if (legacyPdf && !collected.some((item) => item.storageKey === legacyPdf.storageKey && item.fileName === legacyPdf.fileName)) {
        collected.unshift({
            ...legacyPdf,
            fileKind: 'pdf'
        });
    }
    return collected.slice(0, 6);
}

function primaryFileKind(files = [], fallbackFormat = '') {
    const primary = asArray(files)[0];
    if (primary?.fileKind) return primary.fileKind;
    if (socialText(fallbackFormat).toLowerCase() === 'pdf') return 'pdf';
    if (socialText(fallbackFormat).toLowerCase() === 'article') return 'other';
    return 'other';
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
    const files = asArray(publication.files).length
        ? asArray(publication.files)
        : (publication.pdf ? [{ ...publication.pdf, fileKind: 'pdf' }] : []);
    const fileKind = socialText(publication.fileKind)
        || primaryFileKind(files, publication.format);
    return {
        ...clone(publication),
        files,
        fileKind,
        pdf: fileKind === 'pdf' ? (files[0] || publication.pdf || null) : (publication.pdf || null),
        format: fileKind === 'pdf' ? 'pdf' : (socialText(publication.format) || 'file'),
        isSaved: viewer ? savedBy.includes(viewer) : false,
        savedCount: savedBy.length,
        canManage: canManageSocialResearch.call(this, publication, viewer)
    };
}

function listSocialResearchPublications(filters = {}, viewerUserId = '') {
    ensureResearchCollections(this.state);
    const lane = socialText(filters.lane || filters.authorLane || '').toLowerCase();
    const format = socialText(filters.format || filters.fileKind || '').toLowerCase();
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
            const decorated = decorateSocialResearch.call(this, item, viewer);
            const kind = socialText(decorated?.fileKind || '').toLowerCase();
            if (format === 'pdf' || format === 'slides' || format === 'document' || format === 'other') {
                return kind === format;
            }
            if (format === 'article') {
                return kind === 'other' && !asArray(decorated?.files).length;
            }
            return true;
        })
        .filter((item) => {
            if (!facultyCode) return true;
            return normalizeCode(item.facultyCode) === facultyCode;
        })
        .filter((item) => {
            if (!search) return true;
            const fileNames = asArray(item.files).map((file) => file?.fileName).concat(item.pdf?.fileName);
            const haystack = [
                item.title,
                item.abstract,
                item.bodyText,
                item.authorName,
                ...fileNames,
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

    const files = normalizeResearchFiles(payload);
    const publishNow = payload.publish !== false && payload.status !== 'draft';
    if (publishNow && !files.length) return null;

    const fileKind = primaryFileKind(files, payload.format);
    const pdf = fileKind === 'pdf' ? (files[0] || null) : null;

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
        bodyText: socialText(payload.bodyText || ''),
        bodyHtml: '',
        files,
        fileKind,
        format: fileKind === 'pdf' ? 'pdf' : 'file',
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
    if (Object.prototype.hasOwnProperty.call(payload, 'files') || Object.prototype.hasOwnProperty.call(payload, 'pdf')) {
        const files = normalizeResearchFiles(payload);
        if (files.length) {
            publication.files = files;
            publication.fileKind = primaryFileKind(files, publication.format);
            publication.format = publication.fileKind === 'pdf' ? 'pdf' : 'file';
            publication.pdf = publication.fileKind === 'pdf' ? files[0] : null;
        }
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
    if (payload.publish === true || socialText(payload.status).toLowerCase() === 'published') {
        const files = asArray(publication.files).length
            ? asArray(publication.files)
            : (publication.pdf ? [publication.pdf] : []);
        if (!files.length) return null;
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
    inferResearchFileKind,
    isSocialStaffActor,
    listSocialResearchPublications,
    researchLaneForRole,
    toggleSocialResearchSave,
    updateSocialResearchPublication
};
