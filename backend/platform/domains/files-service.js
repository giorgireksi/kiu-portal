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
    return true;
}

function createFileFromUpload(payload = {}) {
    const parsed = parseDataUrl(payload.dataUrl);
    if (!parsed) return null;
    if (parsed.buffer.length > this.maxFileUploadBytes) return null;
    const id = normalizeStoredFileId(payload.id || makeId('file'));
    const ext = (() => {
        const name = String(payload.name || 'download.bin').trim();
        const match = name.match(/(\.[a-z0-9]+)$/i);
        return match ? match[1] : '';
    })();
    const uploadsDir = path.resolve(this.uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filePath = path.resolve(uploadsDir, `${id}${ext}`);
    if (filePath !== uploadsDir && !filePath.startsWith(`${uploadsDir}${path.sep}`)) {
        return null;
    }
    fs.writeFileSync(filePath, parsed.buffer);
    const ownerUserId = String(payload.ownerUserId || payload.uploadedBy || '').trim();
    const record = {
        id,
        name: String(payload.name || `${id}${ext || '.bin'}`).trim(),
        type: sanitizeStoredFileMimeType(payload.type || parsed.mimeType || 'application/octet-stream'),
        size: parsed.buffer.length,
        path: filePath,
        ownerUserId,
        uploadedAt: String(payload.uploadedAt || nowIso()),
        uploadedBy: String(payload.uploadedBy || '').trim(),
        scope: String(payload.scope || 'file').trim(),
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.files[id] = record;
    this.save();
    return clone(record);
}

function getFile(fileId) {
    return clone(this.state.files[String(fileId || '').trim()] || null);
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
    const accessibleLmsCourseIds = Object.keys(this.state.lmsCourses || {}).filter((courseId) => {
        const enrolled = this.getStudentEnrollmentsByCourse(courseId).some(enrollment => String(enrollment?.studentId || '').trim() === normalizedActorUserId);
        if (enrolled) return true;
        return this.isCourseTeachingStaff(courseId, normalizedActorUserId, normalizedActorRole);
    });
    return accessibleLmsCourseIds.some(courseId => objectContainsStoredFileReference(this.getLmsCourse(courseId), normalizedFileId));
}

function normalizeMessageAttachment(file, senderId) {
    if (!file || typeof file !== 'object') return null;
    const resolvedStorageKey = String(file.storageKey || file.id || '').trim();
    if (resolvedStorageKey && this.state.files[resolvedStorageKey]) {
        if (!isStoredFileOwnedByActor(this.state.files[resolvedStorageKey], senderId)) return null;
        return {
            id: String(file.id || makeId('file_ref')).trim(),
            name: String(file.name || this.state.files[resolvedStorageKey].name || 'download.bin').trim(),
            type: String(file.type || this.state.files[resolvedStorageKey].type || 'application/octet-stream').trim(),
            size: safeNumber(file.size, this.state.files[resolvedStorageKey].size || 0),
            storageKey: resolvedStorageKey,
            storageBackend: String(file.storageBackend || 'bridge').trim(),
            dataUrl: ''
        };
    }
    if (file.dataUrl) {
        const stored = createFileFromUpload.call(this, {
            name: file.name || 'attachment.bin',
            type: file.type || 'application/octet-stream',
            dataUrl: file.dataUrl,
            uploadedBy: senderId,
            scope: 'messenger'
        });
        if (!stored) return null;
        return {
            id: String(file.id || makeId('file_ref')).trim(),
            name: stored.name,
            type: stored.type,
            size: stored.size,
            storageKey: stored.id,
            storageBackend: 'bridge',
            dataUrl: ''
        };
    }
    return null;
}

module.exports = {
    canActorAccessStoredFile,
    createFileFromUpload,
    getFile,
    normalizeMessageAttachment,
    objectContainsStoredFileReference
};
