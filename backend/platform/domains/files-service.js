const fs = require('fs');
const path = require('path');
const {
    asArray,
    clone,
    makeId,
    nowIso,
    parseDataUrl,
    safeNumber
} = require('../utils');

function normalizeStoredFileId(value = '') {
    const normalized = String(value || '')
        .trim()
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[.\-]+/, '')
        .replace(/[.\-]+$/, '');
    if (!normalized || normalized === '.' || normalized === '..') {
        return makeId('file');
    }
    return normalized.slice(0, 120);
}

const SAFE_STORED_FILE_MIME_TYPES = new Set([
    'application/json',
    'application/msword',
    'application/octet-stream',
    'application/pdf',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/x-zip-compressed',
    'application/xml',
    'application/zip',
    'audio/aac',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'text/plain',
    'video/mp4',
    'video/quicktime',
    'video/webm'
]);

function sanitizeStoredFileMimeType(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (SAFE_STORED_FILE_MIME_TYPES.has(normalized)) return normalized;
    return 'application/octet-stream';
}

function isStoredFileOwnedByActor(fileRecord = null, actorUserId = '') {
    if (!fileRecord || typeof fileRecord !== 'object') return false;
    const normalizedActorUserId = String(actorUserId || '').trim();
    if (!normalizedActorUserId) return false;
    const ownerUserId = String(fileRecord.ownerUserId || '').trim();
    const uploadedBy = String(fileRecord.uploadedBy || '').trim();
    if (ownerUserId) return ownerUserId === normalizedActorUserId;
    if (uploadedBy) return uploadedBy === normalizedActorUserId;
    return false;
}

function createFileFromUploadSync(payload = {}) {
    const parsed = parseDataUrl(payload.dataUrl);
    if (!parsed) return null;
    const isBackgroundGallery = String(payload.scope || '').trim() === 'background-gallery';
    const maxBytes = isBackgroundGallery
        ? this.maxBackgroundGalleryUploadBytes
        : this.maxFileUploadBytes;
    if (parsed.buffer.length > maxBytes) return null;
    const ext = (() => {
        const name = String(payload.name || 'download.bin').trim();
        const match = name.match(/(\.[a-z0-9]+)$/i);
        return match ? match[1] : '';
    })();
    const uploadsDir = path.resolve(this.uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
    const requestedId = normalizeStoredFileId(payload.id || '');
    let id = '';
    let filePath = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidateId = attempt === 0 && requestedId
            ? requestedId
            : normalizeStoredFileId(makeId('file'));
        const candidatePath = path.resolve(uploadsDir, `${candidateId}${ext}`);
        if (candidatePath === uploadsDir || !candidatePath.startsWith(`${uploadsDir}${path.sep}`)) continue;
        if (this.state.files?.[candidateId] || fs.existsSync(candidatePath)) continue;
        try {
            fs.writeFileSync(candidatePath, parsed.buffer, { flag: 'wx' });
            id = candidateId;
            filePath = candidatePath;
            break;
        } catch (error) {
            if (error?.code !== 'EEXIST') throw error;
        }
    }
    if (!id || !filePath) {
        return null;
    }
    const ownerUserId = String(payload.ownerUserId || payload.uploadedBy || '').trim();
    const mimeType = sanitizeStoredFileMimeType(payload.type || parsed.mimeType || 'application/octet-stream');
    const previewDataUrl = mimeType.startsWith('image/') && parsed.buffer.length <= 200 * 1024
        ? `data:${mimeType};base64,${parsed.buffer.toString('base64')}`
        : '';
    const record = {
        id,
        name: String(payload.name || `${id}${ext || '.bin'}`).trim(),
        type: mimeType,
        size: parsed.buffer.length,
        path: filePath,
        ownerUserId,
        uploadedAt: String(payload.uploadedAt || nowIso()),
        uploadedBy: String(payload.uploadedBy || '').trim(),
        scope: String(payload.scope || 'file').trim(),
        previewDataUrl,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.files[id] = record;
    return clone(record);
}

async function createFileFromUpload(payload = {}) {
    const record = createFileFromUploadSync.call(this, payload);
    if (!record) return null;
    await this.save();
    return record;
}

function extensionForStoredFile(fileRecord = {}) {
    const name = String(fileRecord?.name || '').trim();
    const nameMatch = name.match(/(\.[A-Za-z0-9]+)$/);
    if (nameMatch) return nameMatch[1];
    const recorded = String(fileRecord?.path || '').trim();
    const pathMatch = recorded.match(/(\.[A-Za-z0-9]+)$/);
    return pathMatch ? pathMatch[1] : '';
}

function mimeTypeFromExtension(ext = '') {
    const normalized = String(ext || '').trim().toLowerCase();
    const map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime'
    };
    return map[normalized] || '';
}

function isBackgroundGalleryDiskCandidate(entry = '') {
    const normalized = String(entry || '').trim();
    if (!normalized.startsWith('file_')) return false;
    const ext = extensionForStoredFile({ name: normalized });
    const mimeType = mimeTypeFromExtension(ext);
    return mimeType.startsWith('image/') || mimeType.startsWith('video/');
}

function fileIdFromUploadDiskEntry(entry = '') {
    const normalized = String(entry || '').trim();
    const dotIndex = normalized.indexOf('.');
    return dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
}

function listUnindexedBackgroundGalleryDiskFileIds() {
    const uploadsDir = this.uploadsDir ? path.resolve(this.uploadsDir) : '';
    if (!uploadsDir || !fs.existsSync(uploadsDir)) return [];
    const registry = this.state?.files && typeof this.state.files === 'object' ? this.state.files : {};
    try {
        return fs.readdirSync(uploadsDir)
            .filter((entry) => isBackgroundGalleryDiskCandidate(entry))
            .map((entry) => fileIdFromUploadDiskEntry(entry))
            .filter((fileId, index, list) => fileId && !registry[fileId] && list.indexOf(fileId) === index);
    } catch (error) {
        return [];
    }
}

async function adoptUploadFileFromDisk(fileId = '', options = {}) {
    const id = normalizeStoredFileId(fileId);
    if (!id) return null;
    const existing = getFile.call(this, id);
    if (existing) return existing;

    const uploadsDir = this.uploadsDir ? path.resolve(this.uploadsDir) : '';
    if (!uploadsDir || !fs.existsSync(uploadsDir)) return null;

    let diskPath = '';
    let diskName = '';
    try {
        const entries = fs.readdirSync(uploadsDir);
        const hit = entries.find((entry) => entry === id || entry.startsWith(`${id}.`));
        if (!hit) return null;
        const candidate = path.resolve(uploadsDir, hit);
        if (!candidate.startsWith(`${uploadsDir}${path.sep}`) || !fs.existsSync(candidate)) return null;
        diskPath = candidate;
        diskName = hit;
    } catch (error) {
        return null;
    }

    const ext = extensionForStoredFile({ path: diskPath, name: diskName });
    const mimeType = sanitizeStoredFileMimeType(mimeTypeFromExtension(ext) || 'application/octet-stream');
    const ownerUserId = String(options.ownerUserId || '').trim();
    const scope = String(options.scope || 'file').trim();
    let size = 0;
    try {
        size = fs.statSync(diskPath).size;
    } catch (error) {
        return null;
    }
    const record = {
        id,
        name: diskName,
        type: mimeType,
        size,
        path: diskPath,
        ownerUserId,
        uploadedAt: nowIso(),
        uploadedBy: ownerUserId,
        scope,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    if (!this.state.files || typeof this.state.files !== 'object') {
        this.state.files = {};
    }
    this.state.files[id] = record;
    await this.save();
    return clone(record);
}

/**
 * Resolve a stored file to a path that exists on this machine.
 * Heals absolute paths left over when the repo was copied/moved
 * (e.g. .../test/asd/... -> .../test/asd8/...).
 */
function resolveStoredFileDiskPath(fileRecord = null) {
    if (!fileRecord || typeof fileRecord !== 'object') return '';
    const recorded = String(fileRecord.path || '').trim();
    const id = String(fileRecord.id || '').trim();
    const uploadsDir = this.uploadsDir ? path.resolve(this.uploadsDir) : '';
    if (!uploadsDir) return '';
    const isInsideUploads = (candidate) => {
        const resolved = path.resolve(candidate);
        return resolved !== uploadsDir && resolved.startsWith(`${uploadsDir}${path.sep}`);
    };
    if (recorded && isInsideUploads(recorded) && fs.existsSync(recorded)) return path.resolve(recorded);
    if (!id) return '';

    const ext = extensionForStoredFile(fileRecord);
    const candidates = [
        path.resolve(uploadsDir, `${id}${ext}`),
        path.resolve(uploadsDir, id)
    ];
    for (const candidate of candidates) {
        if (candidate !== uploadsDir && candidate.startsWith(`${uploadsDir}${path.sep}`) && fs.existsSync(candidate)) {
            return candidate;
        }
    }
    try {
        const entries = fs.readdirSync(uploadsDir);
        const hit = entries.find((entry) => entry === id || entry.startsWith(`${id}.`));
        if (hit) {
            const candidate = path.resolve(uploadsDir, hit);
            if (candidate.startsWith(`${uploadsDir}${path.sep}`) && fs.existsSync(candidate)) return candidate;
        }
    } catch (error) {}
    return '';
}

function healStoredFileRecord(fileRecord = null) {
    if (!fileRecord || typeof fileRecord !== 'object') return null;
    const resolvedPath = resolveStoredFileDiskPath.call(this, fileRecord);
    if (!resolvedPath) {
        if (!String(fileRecord.path || '').trim()) return clone(fileRecord);
        const cleared = {
            ...fileRecord,
            path: '',
            updatedAt: nowIso()
        };
        if (this.state?.files && fileRecord.id) {
            this.state.files[String(fileRecord.id)] = cleared;
        }
        return clone(cleared);
    }
    if (String(fileRecord.path || '').trim() === resolvedPath) return clone(fileRecord);
    const next = {
        ...fileRecord,
        path: resolvedPath,
        updatedAt: nowIso()
    };
    if (this.state?.files && fileRecord.id) {
        this.state.files[String(fileRecord.id)] = next;
    }
    return clone(next);
}

function getFile(fileId) {
    const key = String(fileId || '').trim();
    const record = this.state.files?.[key] || null;
    if (!record) return null;
    return healStoredFileRecord.call(this, record);
}

function healAllStoredFilePaths() {
    const files = this.state?.files && typeof this.state.files === 'object' ? this.state.files : {};
    let changed = 0;
    Object.keys(files).forEach((key) => {
        const before = String(files[key]?.path || '').trim();
        const healed = healStoredFileRecord.call(this, files[key]);
        if (healed && String(healed.path || '').trim() !== before && fs.existsSync(String(healed.path || ''))) {
            changed += 1;
        }
    });
    if (changed && typeof this.save === 'function') {
        try { this.save(); } catch (error) {}
    }
    return changed;
}

function objectContainsStoredFileReference(value, fileId, visited = new WeakSet()) {
    const normalizedFileId = String(fileId || '').trim();
    if (!normalizedFileId || value === null || value === undefined) return false;
    if (typeof value !== 'object') return false;
    if (visited.has(value)) return false;
    visited.add(value);
    if (String(value.storageKey || value.id || '').trim() === normalizedFileId) return true;
    if (Array.isArray(value)) {
        return value.some(item => objectContainsStoredFileReference(item, normalizedFileId, visited));
    }
    return Object.values(value).some(entry => objectContainsStoredFileReference(entry, normalizedFileId, visited));
}

function galleryBucketContainsFileId(bucket, fileId) {
    if (!bucket || typeof bucket !== 'object') return false;
    const normalizedFileId = String(fileId || '').trim();
    if (!normalizedFileId) return false;
    return ['images', 'videos'].some((key) =>
        asArray(bucket[key]).some((item) => String(item?.fileId || '').trim() === normalizedFileId)
    );
}

function stateContainsBackgroundGalleryCatalogFile(state, fileId) {
    return galleryBucketContainsFileId(state?.backgroundGallery?.catalog, fileId);
}

function actorOwnsBackgroundGalleryFileReference(state, fileId, actorUserId) {
    const normalizedActorUserId = String(actorUserId || '').trim();
    if (!normalizedActorUserId) return false;
    const bucket = state?.backgroundGallery?.userItemsByUser?.[normalizedActorUserId];
    return galleryBucketContainsFileId(bucket, fileId);
}

function canActorAccessStoredFile(fileId, actorUserId = '', actorRole = '') {
    const normalizedFileId = String(fileId || '').trim();
    const normalizedActorUserId = String(actorUserId || '').trim();
    const normalizedActorRole = String(actorRole || '').trim().toLowerCase();
    if (!normalizedFileId || !normalizedActorUserId) return false;
    if (normalizedActorRole === 'admin') return true;
    const fileRecord = this.state.files[normalizedFileId];
    if (!fileRecord) return false;
    if (isStoredFileOwnedByActor(fileRecord, normalizedActorUserId)) return true;
    const portalMessages = Object.values(this.state.mail?.portalMessages || {});
    if (portalMessages.some(message =>
        String(message?.ownerUserId || '').trim() === normalizedActorUserId
        && objectContainsStoredFileReference(message, normalizedFileId)
    )) {
        return true;
    }
    const chats = Object.values(this.state.chats || {});
    if (chats.some(chat =>
        asArray(chat?.members).map(member => String(member || '').trim()).includes(normalizedActorUserId)
        && objectContainsStoredFileReference(chat, normalizedFileId)
    )) {
        return true;
    }
    if (objectContainsStoredFileReference(this.getStudentServiceBootstrap(normalizedActorUserId), normalizedFileId)) {
        return true;
    }
    if (objectContainsStoredFileReference(this.getSocialBootstrap(normalizedActorUserId), normalizedFileId)) {
        return true;
    }
    // Social feed posts are not in getSocialBootstrap — allow media for posts the actor can view.
    const socialPosts = asArray(this.state.social?.posts);
    if (socialPosts.some((post) => {
        if (!objectContainsStoredFileReference(post, normalizedFileId)) return false;
        if (typeof this.canViewSocialPost === 'function') {
            return Boolean(this.canViewSocialPost(post, normalizedActorUserId));
        }
        const authorId = String(post?.authorUserId || post?.postedById || post?.authorId || '').trim();
        return authorId && authorId === normalizedActorUserId;
    })) {
        return true;
    }
    // University news attachments: allow anyone who can view the parent announcement.
    const newsPosts = asArray(this.state.news?.posts);
    if (newsPosts.some((post) => {
        if (!objectContainsStoredFileReference(post, normalizedFileId)) return false;
        if (typeof this.canViewNewsPost === 'function') {
            return Boolean(this.canViewNewsPost(post, normalizedActorUserId));
        }
        return false;
    })) {
        return true;
    }
    // Stories may carry image media the same way.
    const socialStories = asArray(this.state.social?.stories);
    if (socialStories.length && socialStories.some((story) => objectContainsStoredFileReference(story, normalizedFileId))) {
        if (typeof this.canViewSocialStory === 'function') {
            if (socialStories.some((story) =>
                objectContainsStoredFileReference(story, normalizedFileId)
                && this.canViewSocialStory(story, normalizedActorUserId)
            )) return true;
        } else {
            return true;
        }
    }
    const accessibleLmsCourseIds = Object.keys(this.state.lmsCourses || {}).filter((courseId) => {
        const enrolled = this.getStudentEnrollmentsByCourse(courseId).some(enrollment => String(enrollment?.studentId || '').trim() === normalizedActorUserId);
        if (enrolled) return true;
        return this.isCourseTeachingStaff(courseId, normalizedActorUserId, normalizedActorRole);
    });
    if (accessibleLmsCourseIds.some(courseId => objectContainsStoredFileReference(this.getLmsCourse(courseId), normalizedFileId))) {
        return true;
    }
    if (stateContainsBackgroundGalleryCatalogFile(this.state, normalizedFileId)) {
        return true;
    }
    if (actorOwnsBackgroundGalleryFileReference(this.state, normalizedFileId, normalizedActorUserId)) {
        return true;
    }
    const whiteboardWorkspaces = this.state.portal?.whiteboardWorkspaces || {};
    return Object.entries(whiteboardWorkspaces).some(([resourceKey, workspace]) => {
        if (!objectContainsStoredFileReference(workspace, normalizedFileId)) return false;
        const courseId = String(resourceKey || '').split('::')[0]?.trim()
            || String(resourceKey || '').split(':')[0]?.trim()
            || '';
        if (!courseId) return isStoredFileOwnedByActor(fileRecord, normalizedActorUserId);
        const enrolled = this.getStudentEnrollmentsByCourse(courseId)
            .some(enrollment => String(enrollment?.studentId || '').trim() === normalizedActorUserId);
        return enrolled || this.isCourseTeachingStaff(courseId, normalizedActorUserId, normalizedActorRole);
    });
}

function enrichStoredFileReference(fileRef = null) {
    if (!fileRef || typeof fileRef !== 'object') return null;
    const cloned = clone(fileRef);
    const storageKey = String(cloned.storageKey || cloned.id || '').trim();
    if (!storageKey) return cloned;
    const record = getFile.call(this, storageKey);
    if (!record) {
        cloned.storageMissing = true;
        return cloned;
    }
    const previewDataUrl = String(record.previewDataUrl || cloned.previewDataUrl || '').trim();
    if (previewDataUrl) cloned.previewDataUrl = previewDataUrl;
    const resolvedPath = resolveStoredFileDiskPath.call(this, record);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) cloned.storageMissing = true;
    return cloned;
}

function normalizeMessageAttachment(file, senderId) {
    if (!file || typeof file !== 'object') return null;
    const resolvedStorageKey = String(file.storageKey || file.id || '').trim();
    if (resolvedStorageKey && this.state.files[resolvedStorageKey]) {
        if (!isStoredFileOwnedByActor(this.state.files[resolvedStorageKey], senderId)) return null;
        return enrichStoredFileReference.call(this, {
            id: String(file.id || makeId('file_ref')).trim(),
            name: String(file.name || this.state.files[resolvedStorageKey].name || 'download.bin').trim(),
            type: String(file.type || this.state.files[resolvedStorageKey].type || 'application/octet-stream').trim(),
            size: safeNumber(file.size, this.state.files[resolvedStorageKey].size || 0),
            storageKey: resolvedStorageKey,
            storageBackend: String(file.storageBackend || 'bridge').trim(),
            dataUrl: ''
        });
    }
    if (file.dataUrl) {
        const stored = createFileFromUploadSync.call(this, {
            name: file.name || 'attachment.bin',
            type: file.type || 'application/octet-stream',
            dataUrl: file.dataUrl,
            uploadedBy: senderId,
            scope: String(file.scope || 'messenger').trim() || 'messenger'
        });
        if (!stored) return null;
        const savePromise = this.save();
        if (savePromise && typeof savePromise.catch === 'function') savePromise.catch(() => {});
        return enrichStoredFileReference.call(this, {
            id: String(file.id || makeId('file_ref')).trim(),
            name: stored.name,
            type: stored.type,
            size: stored.size,
            storageKey: stored.id,
            storageBackend: 'bridge',
            dataUrl: ''
        });
    }
    return null;
}

module.exports = {
    adoptUploadFileFromDisk,
    canActorAccessStoredFile,
    createFileFromUpload,
    enrichStoredFileReference,
    getFile,
    healAllStoredFilePaths,
    healStoredFileRecord,
    listUnindexedBackgroundGalleryDiskFileIds,
    normalizeMessageAttachment,
    objectContainsStoredFileReference,
    resolveStoredFileDiskPath
};
