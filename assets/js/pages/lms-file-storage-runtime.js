/* LMS file storage/draft helpers extracted from lms.js. */

let lmsDraftFiles = {
    material: {},
    assignment: {},
    submissions: {},
    concept: {}
};
let lmsFileStorageDbPromise = null;

function supportsLmsIndexedFileStorage() {
    return typeof indexedDB !== 'undefined';
}

function openLmsFileStorageDb() {
    if (!supportsLmsIndexedFileStorage()) return Promise.resolve(null);
    if (!lmsFileStorageDbPromise) {
        lmsFileStorageDbPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(LMS_FILE_STORAGE_DB_NAME, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(LMS_FILE_STORAGE_STORE_NAME)) {
                        db.createObjectStore(LMS_FILE_STORAGE_STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('Could not open LMS file storage.'));
                request.onblocked = () => reject(new Error('LMS file storage is blocked by another browser tab.'));
            } catch (error) {
                reject(error);
            }
        }).catch((error) => {
            lmsFileStorageDbPromise = null;
            throw error;
        });
    }
    return lmsFileStorageDbPromise;
}

function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Could not read the selected file.'));
        reader.readAsDataURL(blob);
    });
}

function buildLmsStoredFileStorageKey(kind, file) {
    return `lms_${toDomToken(kind)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${toDomToken(file?.name || 'file')}`;
}

async function putLmsFileBlob(storageKey, file) {
    const db = await openLmsFileStorageDb();
    if (!db || !storageKey || !file) return false;
    const blob = file.blob instanceof Blob ? file.blob : (file instanceof Blob ? file : null);
    if (!blob) return false;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([LMS_FILE_STORAGE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LMS_FILE_STORAGE_STORE_NAME);
        store.put({
            id: storageKey,
            blob,
            name: file.name || 'download.bin',
            type: file.type || blob.type || 'application/octet-stream',
            size: file.size || blob.size || 0,
            uploadedAt: file.uploadedAt || new Date().toISOString()
        });
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error || new Error('Could not store the LMS file.'));
    });
}

async function getLmsFileBlob(storageKey) {
    const db = await openLmsFileStorageDb();
    if (!db || !storageKey) return null;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([LMS_FILE_STORAGE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(LMS_FILE_STORAGE_STORE_NAME);
        const request = store.get(storageKey);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Could not load the saved LMS file.'));
    });
}

async function deleteLmsFileBlob(storageKey) {
    const db = await openLmsFileStorageDb();
    if (!db || !storageKey) return false;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([LMS_FILE_STORAGE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LMS_FILE_STORAGE_STORE_NAME);
        store.delete(storageKey);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error || new Error('Could not delete the saved LMS file.'));
    });
}

async function persistLmsStoredFile(file, kind = 'file') {
    if (!file) return null;
    const persistedFile = cloneStoredFile(file);
    const preferredStorage = typeof getPortalFileStorageMode === 'function'
        ? getPortalFileStorageMode()
        : '';
    const useBridgeUpload = preferredStorage === 'bridge' || preferredStorage === 'external';
    if (file.blob instanceof Blob && useBridgeUpload && typeof uploadPortalStoredFile === 'function') {
        try {
            const uploadedFile = await uploadPortalStoredFile(file, kind);
            if (uploadedFile?.storageKey) {
                return {
                    ...persistedFile,
                    ...uploadedFile,
                    dataUrl: ''
                };
            }
        } catch (error) {
            console.warn('Could not persist file to bridge storage, falling back locally.', error);
        }
    }
    if (file.blob instanceof Blob && supportsLmsIndexedFileStorage()) {
        const storageKey = file.storageKey || buildLmsStoredFileStorageKey(kind, file);
        await putLmsFileBlob(storageKey, file);
        persistedFile.storageKey = storageKey;
        persistedFile.storageBackend = 'indexeddb';
        persistedFile.dataUrl = '';
        return persistedFile;
    }
    if (!persistedFile.dataUrl && file.blob instanceof Blob) {
        persistedFile.dataUrl = await readBlobAsDataUrl(file.blob);
    }
    persistedFile.storageBackend = persistedFile.dataUrl ? 'inline' : persistedFile.storageBackend;
    return persistedFile;
}

async function downloadStoredFileByKey(storageKey, downloadName = 'download.bin') {
    try {
        if (typeof getPortalStoredFileUrl === 'function') {
            const bridgeUrl = getPortalStoredFileUrl(storageKey);
            if (bridgeUrl) {
                const link = document.createElement('a');
                link.href = bridgeUrl;
                link.download = downloadName || 'download.bin';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                link.remove();
                return;
            }
        }
        const record = await getLmsFileBlob(storageKey);
        if (!record?.blob) {
            alert('This file is no longer available.');
            return;
        }
        const objectUrl = URL.createObjectURL(record.blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = downloadName || record.name || 'download.bin';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
        console.error('Could not download stored LMS file.', error);
        alert('The file could not be downloaded.');
    }
}

function queueStoredFileDelete(file) {
    const storageKey = String(file?.storageKey || '').trim();
    if (!storageKey) return;
    deleteLmsFileBlob(storageKey).catch((error) => {
        console.warn('Could not delete stored LMS file blob.', error);
    });
}

function getStoredFileDownloadHtml(file, label = 'Download file') {
    if (!file) return '';
    if (file.dataUrl) {
        return `
            <a href="${file.dataUrl}" download="${escapeHtml(file.name || 'download.bin')}" class="lux-secondary-btn lms-route-file-action-btn">
                <i class="fas fa-download"></i> ${escapeHtml(label)}
            </a>
        `;
    }
    if (file.storageKey && file.storageBackend === 'bridge' && typeof getPortalStoredFileUrl === 'function') {
        return `
            <a href="${getPortalStoredFileUrl(file.storageKey)}" download="${escapeHtml(file.name || 'download.bin')}" target="_blank" rel="noopener" class="lux-secondary-btn lms-route-file-action-btn">
                <i class="fas fa-download"></i> ${escapeHtml(label)}
            </a>
        `;
    }
    if (file.storageKey) {
        return `
            <button type="button" data-lms-click="downloadStoredFileByKey(${jsQuote(file.storageKey)}, ${jsQuote(file.name || 'download.bin')})" class="lux-secondary-btn lms-route-file-action-btn">
                <i class="fas fa-download"></i> ${escapeHtml(label)}
            </button>
        `;
    }
    return '';
}

function renderLmsStoredFileAttachmentShell(file, options = {}) {
    if (!file) return '';
    const {
        label = 'Attachment',
        title = file.name || 'Attachment',
        meta = '',
        downloadLabel = 'Download file',
        shellClass = 'lms-route-file-shell lms-route-field-mt-14',
        titleClass = 'lms-route-file-shell-title',
        metaClass = 'lms-route-file-shell-meta',
        actionsClass = 'lms-route-file-shell-actions'
    } = options || {};
    const actionHtml = getStoredFileDownloadHtml(file, downloadLabel);
    return `
        <div class="${shellClass}">
            <div class="lms-route-kv-label">${escapeHtml(label)}</div>
            <div class="${titleClass}">${escapeHtml(title || file.name || 'Attachment')}</div>
            ${meta ? `<div class="${metaClass}">${escapeHtml(meta)}</div>` : ''}
            ${actionHtml ? `<div class="${actionsClass}">${actionHtml}</div>` : ''}
        </div>
    `;
}

function ensureSharedLmsFileInput() {
    let input = document.getElementById('shared-lms-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'shared-lms-file-input';
        input.hidden = true;
        document.body.appendChild(input);
    }
    return input;
}

function storeLmsDraftFile(kind, key, fileRecord) {
    key = normalizeLmsDraftStorageKey(kind, key);
    if (!lmsDraftFiles[kind] || typeof lmsDraftFiles[kind] !== 'object') {
        lmsDraftFiles[kind] = {};
    }
    lmsDraftFiles[kind][key] = cloneLmsDraftFile(fileRecord);
}

function getLmsDraftFile(kind, key) {
    key = normalizeLmsDraftStorageKey(kind, key);
    return lmsDraftFiles?.[kind]?.[key] || null;
}

function clearLmsDraftFile(kind, key) {
    key = normalizeLmsDraftStorageKey(kind, key);
    if (lmsDraftFiles?.[kind]) delete lmsDraftFiles[kind][key];
}

function pickLocalLmsFile(kind, key, labelId, accept = '*/*') {
    const input = ensureSharedLmsFileInput();
    input.value = '';
    input.accept = accept;
    input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
            const draft = {
                id: `upload_${Date.now()}`,
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size || 0,
                uploadedAt: new Date().toISOString()
            };
            if (supportsLmsIndexedFileStorage()) {
                draft.blob = file;
                draft.storageBackend = 'indexeddb';
            } else {
                draft.dataUrl = await readBlobAsDataUrl(file);
                draft.storageBackend = 'inline';
            }
            storeLmsDraftFile(kind, key, {
                ...draft
            });
            const label = document.getElementById(labelId);
            if (label) label.innerHTML = `<i class="fas fa-paperclip"></i> ${escapeHtml(file.name)}`;
        } catch (error) {
            console.error('Could not prepare LMS file upload.', error);
            alert('That file could not be prepared for upload.');
        }
    };
    input.click();
}

window.getLmsFileBlob = getLmsFileBlob;
window.putLmsFileBlob = putLmsFileBlob;
window.buildLmsStoredFileStorageKey = buildLmsStoredFileStorageKey;
