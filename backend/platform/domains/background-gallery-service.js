const fs = require('fs');
const { clone, makeId, nowIso } = require('../utils');

const VALID_MEDIA_TYPES = new Set(['image', 'video']);
const VALID_PALETTE_KEYS = new Set([
    'obsidian-amber',
    'slate-sapphire',
    'pine-jade',
    'burgundy-rose',
    'sand-pearl',
    'ink-orchid',
    'ocean-teal'
]);

const IMAGE_MIME_PREFIX = 'image/';
const VIDEO_MIME_PREFIX = 'video/';

function createEmptyBackgroundGalleryCatalog() {
    return { images: [], videos: [] };
}

function createEmptyBackgroundGalleryState() {
    return {
        catalog: createEmptyBackgroundGalleryCatalog(),
        userItemsByUser: {},
        version: 2
    };
}

function ensureBackgroundGalleryState(state) {
    if (!state.backgroundGallery || typeof state.backgroundGallery !== 'object') {
        state.backgroundGallery = createEmptyBackgroundGalleryState();
    }
    const gallery = state.backgroundGallery;
    gallery.catalog = gallery.catalog && typeof gallery.catalog === 'object' ? gallery.catalog : createEmptyBackgroundGalleryCatalog();
    gallery.catalog.images = Array.isArray(gallery.catalog.images) ? gallery.catalog.images : [];
    gallery.catalog.videos = Array.isArray(gallery.catalog.videos) ? gallery.catalog.videos : [];
    gallery.userItemsByUser = gallery.userItemsByUser && typeof gallery.userItemsByUser === 'object'
        ? gallery.userItemsByUser
        : {};
    return gallery;
}

function migrateBackgroundGalleryUserItemsFromPortalPrefs(state = {}) {
    const gallery = ensureBackgroundGalleryState(state);
    const prefsByUser = state?.portal?.state?.homeDashboardPreferencesByUser || {};
    let changed = false;
    Object.entries(prefsByUser).forEach(([userId, entry]) => {
        if (!entry || typeof entry !== 'object') return;
        const legacy = entry.backgroundGalleryUserItems;
        if (!legacy || typeof legacy !== 'object') return;
        const legacyCount = (Array.isArray(legacy.images) ? legacy.images.length : 0)
            + (Array.isArray(legacy.videos) ? legacy.videos.length : 0);
        const existing = gallery.userItemsByUser[userId];
        const existingCount = (Array.isArray(existing?.images) ? existing.images.length : 0)
            + (Array.isArray(existing?.videos) ? existing.videos.length : 0);
        if (legacyCount > 0 && existingCount === 0) {
            gallery.userItemsByUser[userId] = {
                images: Array.isArray(legacy.images) ? clone(legacy.images) : [],
                videos: Array.isArray(legacy.videos) ? clone(legacy.videos) : []
            };
            changed = true;
        }
        if (Object.prototype.hasOwnProperty.call(entry, 'backgroundGalleryUserItems')) {
            delete entry.backgroundGalleryUserItems;
            changed = true;
        }
    });
    if (changed) {
        gallery.version = Math.max(Number(gallery.version) || 1, 2);
    }
    return changed;
}

function inferMediaTypeFromMime(mimeType = '') {
    const normalized = String(mimeType || '').trim().toLowerCase();
    if (normalized.startsWith(IMAGE_MIME_PREFIX)) return 'image';
    if (normalized.startsWith(VIDEO_MIME_PREFIX)) return 'video';
    return '';
}

function getGalleryBucket(catalog, mediaType) {
    return mediaType === 'video' ? catalog.videos : catalog.images;
}

function collectBackgroundGalleryFileIds(state, excludeItemId = '') {
    const ids = new Set();
    const excluded = String(excludeItemId || '').trim();
    const pushBucket = (bucket = []) => {
        (Array.isArray(bucket) ? bucket : []).forEach((entry) => {
            if (excluded && String(entry?.id || '') === excluded) return;
            const fileId = String(entry?.fileId || '').trim();
            if (fileId) ids.add(fileId);
        });
    };
    const catalog = state?.backgroundGallery?.catalog || {};
    pushBucket(catalog.images);
    pushBucket(catalog.videos);
    const userItemsByUser = state?.backgroundGallery?.userItemsByUser || {};
    Object.values(userItemsByUser).forEach((bucket) => {
        if (!bucket || typeof bucket !== 'object') return;
        pushBucket(bucket.images);
        pushBucket(bucket.videos);
    });
    return ids;
}

function purgeUploadedGalleryFile(fileId = '') {
    const normalizedFileId = String(fileId || '').trim();
    if (!normalizedFileId) return;
    const files = this.state?.files && typeof this.state.files === 'object' ? this.state.files : null;
    if (!files || !files[normalizedFileId]) return;
    const record = files[normalizedFileId];
    try {
        const filePath = String(record.path || '').trim();
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) { /* ignore */ }
    delete files[normalizedFileId];
}

function purgeBackgroundGalleryFileIfUnused(fileId = '', excludeItemId = '') {
    const normalizedFileId = String(fileId || '').trim();
    if (!normalizedFileId) return false;
    const files = this.state.files && typeof this.state.files === 'object' ? this.state.files : null;
    if (!files) return false;
    const record = files[normalizedFileId];
    if (!record || String(record.scope || '').trim() !== 'background-gallery') return false;
    if (collectBackgroundGalleryFileIds(this.state, excludeItemId).has(normalizedFileId)) return false;
    purgeUploadedGalleryFile.call(this, normalizedFileId);
    this.save();
    return true;
}

function sanitizePaletteKey(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return VALID_PALETTE_KEYS.has(normalized) ? normalized : 'ocean-teal';
}

function normalizeGalleryItem(raw = {}, defaults = {}) {
    const mediaType = String(raw.mediaType || defaults.mediaType || '').trim().toLowerCase();
    if (!VALID_MEDIA_TYPES.has(mediaType)) {
        return { error: 'Invalid mediaType.', status: 400 };
    }
    const fileId = String(raw.fileId || '').trim();
    if (!fileId) {
        return { error: 'fileId is required.', status: 400 };
    }
    const file = typeof defaults.getFile === 'function' ? defaults.getFile(fileId) : null;
    if (!file) {
        return { error: 'File not found.', status: 404 };
    }
    const inferred = inferMediaTypeFromMime(file.type);
    if (inferred && inferred !== mediaType) {
        return { error: 'File type does not match mediaType.', status: 400 };
    }
    if (!inferred) {
        return { error: 'Unsupported file type for background gallery.', status: 400 };
    }
    if (
        defaults.actorUserId
        && typeof defaults.canAccessFile === 'function'
        && !defaults.canAccessFile(fileId, defaults.actorUserId, defaults.actorRole)
    ) {
        return { error: 'You are not allowed to use this file.', status: 403 };
    }
    const label = String(raw.label || file.name || 'Background').trim().slice(0, 120) || 'Background';
    return {
        item: {
            id: String(raw.id || makeId('bgg')).trim(),
            mediaType,
            fileId,
            label,
            recommendedPaletteKey: sanitizePaletteKey(raw.recommendedPaletteKey),
            createdAt: String(raw.createdAt || nowIso()),
            createdBy: String(raw.createdBy || defaults.actorUserId || '').trim(),
            promotedFromUserId: String(raw.promotedFromUserId || '').trim()
        }
    };
}

function getBackgroundGalleryCatalog() {
    const gallery = ensureBackgroundGalleryState(this.state);
    return clone(gallery.catalog);
}

function getBackgroundGalleryUserItems(userId = '') {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return createEmptyBackgroundGalleryCatalog();
    const gallery = ensureBackgroundGalleryState(this.state);
    const bucket = gallery.userItemsByUser[normalizedUserId] && typeof gallery.userItemsByUser[normalizedUserId] === 'object'
        ? gallery.userItemsByUser[normalizedUserId]
        : createEmptyBackgroundGalleryCatalog();
    return {
        images: Array.isArray(bucket.images) ? clone(bucket.images) : [],
        videos: Array.isArray(bucket.videos) ? clone(bucket.videos) : []
    };
}

async function writeBackgroundGalleryUserItems(userId = '', nextBucket = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return null;
    const gallery = ensureBackgroundGalleryState(this.state);
    gallery.userItemsByUser[normalizedUserId] = {
        images: Array.isArray(nextBucket.images) ? clone(nextBucket.images) : [],
        videos: Array.isArray(nextBucket.videos) ? clone(nextBucket.videos) : []
    };
    gallery.version = Math.max(Number(gallery.version) || 1, 2);
    await this.save();
    return getBackgroundGalleryUserItems.call(this, normalizedUserId);
}

async function reconcileOrphanBackgroundGalleryUserFiles(userId = '', actor = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return createEmptyBackgroundGalleryCatalog();
    const items = getBackgroundGalleryUserItems.call(this, normalizedUserId);
    const knownFileIds = new Set(
        [...items.images, ...items.videos]
            .map((entry) => String(entry.fileId || '').trim())
            .filter(Boolean)
    );
    // ponytail: repair-only; multi-tenant would need sidecar metadata
    if (typeof this.listUnindexedBackgroundGalleryDiskFileIds === 'function'
        && typeof this.adoptUploadFileFromDisk === 'function') {
        const diskOrphanIds = this.listUnindexedBackgroundGalleryDiskFileIds();
        for (const fileId of diskOrphanIds) {
            if (knownFileIds.has(fileId)) continue;
            await this.adoptUploadFileFromDisk(fileId, {
                ownerUserId: normalizedUserId,
                scope: 'background-gallery'
            });
        }
    }
    const orphans = Object.values(this.state.files || {}).filter((file) => {
        if (!file || typeof file !== 'object') return false;
        if (String(file.scope || '').trim() !== 'background-gallery') return false;
        if (String(file.ownerUserId || '').trim() !== normalizedUserId) return false;
        const fileId = String(file.id || '').trim();
        return Boolean(fileId && !knownFileIds.has(fileId));
    });
    if (!orphans.length) return items;
    let changed = false;
    orphans.forEach((file) => {
        const mediaType = inferMediaTypeFromMime(file.type);
        if (!mediaType) return;
        const normalized = normalizeGalleryItem({
            fileId: file.id,
            mediaType,
            label: file.name || 'Background',
            recommendedPaletteKey: 'ocean-teal',
            createdAt: file.uploadedAt || nowIso(),
            createdBy: normalizedUserId
        }, {
            actorUserId: actor.actorUserId || normalizedUserId,
            actorRole: actor.actorRole,
            getFile: (fileId) => this.getFile(fileId),
            canAccessFile: (fileId, uid, role) => this.canActorAccessStoredFile(fileId, uid, role)
        });
        if (normalized.error) return;
        getGalleryBucket(items, normalized.item.mediaType).push(normalized.item);
        knownFileIds.add(String(normalized.item.fileId || ''));
        changed = true;
    });
    if (!changed) return items;
    return writeBackgroundGalleryUserItems.call(this, normalizedUserId, items);
}

async function addBackgroundGalleryCatalogItem(payload = {}, actor = {}) {
    const actorRole = String(actor.actorRole || '').trim().toLowerCase();
    if (actorRole !== 'admin') {
        return { error: 'Admin access required.', status: 403 };
    }
    const gallery = ensureBackgroundGalleryState(this.state);
    const normalized = normalizeGalleryItem(payload, {
        actorUserId: actor.actorUserId,
        actorRole,
        getFile: (fileId) => this.getFile(fileId),
        canAccessFile: (fileId, userId, role) => this.canActorAccessStoredFile(fileId, userId, role)
    });
    if (normalized.error) return normalized;
    const bucket = getGalleryBucket(gallery.catalog, normalized.item.mediaType);
    bucket.push(normalized.item);
    await this.save();
    return { item: clone(normalized.item), catalog: clone(gallery.catalog) };
}

function removeBackgroundGalleryCatalogItem(itemId = '', actor = {}) {
    const actorRole = String(actor.actorRole || '').trim().toLowerCase();
    if (actorRole !== 'admin') {
        return { error: 'Admin access required.', status: 403 };
    }
    const gallery = ensureBackgroundGalleryState(this.state);
    const normalizedId = String(itemId || '').trim();
    let removed = null;
    ['images', 'videos'].forEach((key) => {
        const bucket = gallery.catalog[key];
        const index = bucket.findIndex((entry) => String(entry.id || '') === normalizedId);
        if (index >= 0) {
            removed = bucket.splice(index, 1)[0];
        }
    });
    if (!removed) {
        return { error: 'Gallery item not found.', status: 404 };
    }
    this.save();
    purgeBackgroundGalleryFileIfUnused.call(this, removed.fileId, removed.id);
    return { item: clone(removed), catalog: clone(gallery.catalog) };
}

async function addBackgroundGalleryUserItem(userId = '', payload = {}, actor = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) {
        return { error: 'User id is required.', status: 400 };
    }
    const items = getBackgroundGalleryUserItems.call(this, normalizedUserId);
    const normalized = normalizeGalleryItem(payload, {
        actorUserId: actor.actorUserId || normalizedUserId,
        actorRole: actor.actorRole,
        getFile: (fileId) => this.getFile(fileId),
        canAccessFile: (fileId, uid, role) => this.canActorAccessStoredFile(fileId, uid, role)
    });
    if (normalized.error) return normalized;
    const bucket = getGalleryBucket(items, normalized.item.mediaType);
    bucket.push(normalized.item);
    const saved = await writeBackgroundGalleryUserItems.call(this, normalizedUserId, items);
    return { item: normalized.item, items: saved };
}

async function removeBackgroundGalleryUserItem(userId = '', itemId = '', actor = {}) {
    const normalizedUserId = String(userId || '').trim();
    const normalizedId = String(itemId || '').trim();
    if (!normalizedUserId || !normalizedId) {
        return { error: 'User id and item id are required.', status: 400 };
    }
    const actorRole = String(actor.actorRole || '').trim().toLowerCase();
    const actorUserId = String(actor.actorUserId || '').trim();
    if (actorUserId !== normalizedUserId && actorRole !== 'admin') {
        return { error: 'You are not allowed to delete this item.', status: 403 };
    }
    const items = getBackgroundGalleryUserItems.call(this, normalizedUserId);
    let removed = null;
    ['images', 'videos'].forEach((key) => {
        const bucket = items[key];
        const index = bucket.findIndex((entry) => String(entry.id || '') === normalizedId);
        if (index >= 0) {
            removed = bucket.splice(index, 1)[0];
        }
    });
    if (!removed) {
        return { error: 'Gallery item not found.', status: 404 };
    }
    const saved = await writeBackgroundGalleryUserItems.call(this, normalizedUserId, items);
    purgeBackgroundGalleryFileIfUnused.call(this, removed.fileId, removed.id);
    return { item: clone(removed), items: saved };
}

async function promoteBackgroundGalleryUserItem(payload = {}, actor = {}) {
    const actorRole = String(actor.actorRole || '').trim().toLowerCase();
    if (actorRole !== 'admin') {
        return { error: 'Admin access required.', status: 403 };
    }
    const ownerUserId = String(payload.userId || payload.ownerUserId || '').trim();
    const itemId = String(payload.itemId || payload.id || '').trim();
    if (!ownerUserId || !itemId) {
        return { error: 'userId and itemId are required.', status: 400 };
    }
    const userItems = getBackgroundGalleryUserItems.call(this, ownerUserId);
    let source = null;
    ['images', 'videos'].forEach((key) => {
        const hit = userItems[key].find((entry) => String(entry.id || '') === itemId);
        if (hit) source = hit;
    });
    if (!source) {
        return { error: 'User gallery item not found.', status: 404 };
    }
    return addBackgroundGalleryCatalogItem.call(this, {
        ...clone(source),
        id: makeId('bgg'),
        promotedFromUserId: ownerUserId,
        createdBy: actor.actorUserId,
        createdAt: nowIso()
    }, actor);
}

async function uploadBackgroundGalleryAsset(payload = {}, actor = {}) {
    const actorUserId = String(actor.actorUserId || '').trim();
    if (!actorUserId) {
        return { error: 'User id is required.', status: 400 };
    }
    const target = String(payload.target || 'mine').trim().toLowerCase();
    if (target !== 'mine' && target !== 'catalog') {
        return { error: 'Invalid upload target.', status: 400 };
    }
    if (target === 'catalog' && String(actor.actorRole || '').trim().toLowerCase() !== 'admin') {
        return { error: 'Admin access required.', status: 403 };
    }
    const mediaType = String(payload.mediaType || inferMediaTypeFromMime(payload.type) || '').trim().toLowerCase();
    if (!VALID_MEDIA_TYPES.has(mediaType)) {
        return { error: 'Invalid mediaType.', status: 400 };
    }
    const file = await this.createFileFromUpload({
        name: payload.name,
        type: payload.type,
        dataUrl: payload.dataUrl,
        uploadedAt: payload.uploadedAt || nowIso(),
        uploadedBy: actorUserId,
        ownerUserId: actorUserId,
        scope: 'background-gallery'
    });
    if (!file) {
        return { error: 'Invalid file payload.', status: 400 };
    }
    const labelBase = String(payload.label || payload.name || file.name || 'Background').replace(/\.[^.]+$/, '');
    const galleryPayload = {
        fileId: file.id,
        mediaType,
        label: labelBase || 'Background',
        recommendedPaletteKey: payload.recommendedPaletteKey
    };
    let result;
    if (target === 'catalog') {
        result = await addBackgroundGalleryCatalogItem.call(this, galleryPayload, actor);
    } else {
        result = await addBackgroundGalleryUserItem.call(this, actorUserId, galleryPayload, actor);
    }
    if (result?.error) {
        purgeUploadedGalleryFile.call(this, file.id);
        await this.save();
        return result;
    }
    return {
        ...result,
        file: clone(file),
        target
    };
}

module.exports = {
    VALID_MEDIA_TYPES,
    VALID_PALETTE_KEYS,
    createEmptyBackgroundGalleryCatalog,
    createEmptyBackgroundGalleryState,
    ensureBackgroundGalleryState,
    migrateBackgroundGalleryUserItemsFromPortalPrefs,
    getBackgroundGalleryCatalog,
    getBackgroundGalleryUserItems,
    reconcileOrphanBackgroundGalleryUserFiles,
    uploadBackgroundGalleryAsset,
    addBackgroundGalleryCatalogItem,
    removeBackgroundGalleryCatalogItem,
    addBackgroundGalleryUserItem,
    removeBackgroundGalleryUserItem,
    promoteBackgroundGalleryUserItem,
    sanitizePaletteKey,
    normalizeGalleryItem
};
