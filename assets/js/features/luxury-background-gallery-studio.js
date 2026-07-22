/* Background Gallery studio — separate Images/Videos popup modals. */
(function initLuxuryBackgroundGalleryStudio() {
    'use strict';
    const STUDIO_VERSION = 'bgg21';
    const UPLOAD_KEEP_LOCAL_MS = 60000;
    const MAX_BATCH_FILES = 20;
    if (window.__KIU_BACKGROUND_GALLERY_STUDIO_VERSION === STUDIO_VERSION) return;
    if (window.__KIU_BACKGROUND_GALLERY_STUDIO_VERSION) {
        document.getElementById('lux-bg-gallery-backdrop')?.remove();
    }
    window.__KIU_BACKGROUND_GALLERY_STUDIO_VERSION = STUDIO_VERSION;

    const GALLERY_MAX_BYTES = 100 * 1024 * 1024;

    const GALLERY_STATE = {
        activePopup: null,
        activeTab: 'curated',
        catalog: { images: [], videos: [] },
        mine: { images: [], videos: [] },
        loading: false,
        uploadInFlight: false,
        launcherBound: false,
        lastUploadedId: null,
        awaitingFilePicker: false,
        pendingDelete: null,
        statusTimer: null,
        uploadLabelTimer: null,
        lastSuccessfulUploadAt: 0
    };

    let galleryFilePickerFocusHandler = null;
    let galleryPopupControlsAbort = null;
    let pendingUploadTarget = 'mine';
    let galleryRefreshGeneration = 0;

    function getUploadBackgroundGalleryAsset() {
        if (typeof window.uploadBackgroundGalleryAsset === 'function') return window.uploadBackgroundGalleryAsset;
        if (typeof uploadBackgroundGalleryAsset === 'function') return uploadBackgroundGalleryAsset;
        return null;
    }

    function invalidateGalleryRefresh() {
        galleryRefreshGeneration += 1;
    }

    function syncGalleryCaches() {
        window.__kiuBackgroundGalleryCaches = {
            catalog: GALLERY_STATE.catalog,
            mine: GALLERY_STATE.mine
        };
        if (typeof window.__kiuSyncBackgroundGalleryMedia === 'function') {
            window.__kiuSyncBackgroundGalleryMedia(window.__kiuBackgroundGalleryCaches);
        }
    }

    function galleryTabStorageKey() {
        return `kiu-bg-gallery-tab:${GALLERY_STATE.activePopup || 'images'}`;
    }

    function loadStoredGalleryTab() {
        try {
            const stored = sessionStorage.getItem(galleryTabStorageKey());
            return stored === 'mine' ? 'mine' : 'curated';
        } catch (error) {
            return 'curated';
        }
    }

    function storeGalleryTab(tab) {
        try {
            sessionStorage.setItem(galleryTabStorageKey(), tab === 'mine' ? 'mine' : 'curated');
        } catch (error) { /* ignore */ }
    }

    function setGalleryUploadControlsDisabled(disabled) {
        ['lux-bg-gallery-upload', 'lux-bg-gallery-upload-curated', 'lux-bg-gallery-refresh'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'LABEL') {
                el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
                el.classList.toggle('is-disabled', Boolean(disabled));
            } else {
                el.disabled = Boolean(disabled);
            }
        });
    }

    function defaultUploadLabelText() {
        return GALLERY_STATE.activePopup === 'videos' ? 'Upload video' : 'Upload image';
    }

    function setGalleryUploadLabelText(text, state = 'idle') {
        const labelSpan = document.getElementById('lux-bg-gallery-upload-label');
        const control = document.getElementById('lux-bg-gallery-upload');
        if (labelSpan && text) labelSpan.textContent = text;
        if (!control) return;
        control.classList.toggle('is-busy', state === 'uploading');
        control.classList.toggle('is-success', state === 'success');
        control.classList.toggle('is-error', state === 'error');
    }

    function resetGalleryUploadLabelSoon(delayMs = 4000) {
        window.clearTimeout(GALLERY_STATE.uploadLabelTimer);
        GALLERY_STATE.uploadLabelTimer = window.setTimeout(() => {
            if (!GALLERY_STATE.uploadInFlight) {
                setGalleryUploadLabelText(defaultUploadLabelText(), 'idle');
            }
        }, delayMs);
    }

    function clearGalleryFilePickerAwaiting() {
        if (!GALLERY_STATE.awaitingFilePicker) return;
        GALLERY_STATE.awaitingFilePicker = false;
        if (galleryFilePickerFocusHandler) {
            window.removeEventListener('focus', galleryFilePickerFocusHandler);
            galleryFilePickerFocusHandler = null;
        }
        const fileInput = document.getElementById('lux-bg-gallery-file-input');
        if (!fileInput?.files?.length) {
            setGalleryLoadingMessage('', false);
        }
    }

    function armGalleryFilePickerCancelDetection() {
        GALLERY_STATE.awaitingFilePicker = true;
        if (galleryFilePickerFocusHandler) {
            window.removeEventListener('focus', galleryFilePickerFocusHandler);
        }
        galleryFilePickerFocusHandler = () => {
            window.setTimeout(clearGalleryFilePickerAwaiting, 0);
        };
        window.addEventListener('focus', galleryFilePickerFocusHandler, { once: true });
    }

    function isGalleryAdmin() {
        return typeof getEffectiveRole === 'function' && getEffectiveRole() === 'admin';
    }

    function paletteLabel(key) {
        const palette = (window.STUDIO_PALETTES || []).find((item) => item.key === key);
        return palette?.name || key || 'Ocean & Teal';
    }

    function mediaBucket(items, mediaType) {
        return mediaType === 'videos' ? (items?.videos || []) : (items?.images || []);
    }

    function activeMediaType() {
        return GALLERY_STATE.activePopup === 'videos' ? 'videos' : 'images';
    }

    function activeMimeType() {
        return GALLERY_STATE.activePopup === 'videos' ? 'video' : 'image';
    }

    async function fetchBackgroundGalleryCatalog() {
        const fetchFn = resolveGalleryFetch();
        if (!fetchFn) {
            throw new Error('Gallery API not loaded. Hard refresh the page.');
        }
        const payload = await fetchFn('/api/background-gallery/catalog');
        return payload?.catalog || { images: [], videos: [] };
    }

    async function fetchBackgroundGalleryMine() {
        const fetchFn = resolveGalleryFetch();
        if (!fetchFn) {
            throw new Error('Gallery API not loaded. Hard refresh the page.');
        }
        const payload = await fetchFn('/api/background-gallery/mine');
        return payload?.items || { images: [], videos: [] };
    }

    async function refreshBackgroundGalleryData() {
        const generation = ++galleryRefreshGeneration;
        GALLERY_STATE.loading = true;
        renderBackgroundGalleryPopup();
        const previousMineCount = (GALLERY_STATE.mine?.images?.length || 0) + (GALLERY_STATE.mine?.videos?.length || 0);
        try {
            const [catalog, mine] = await Promise.all([
                fetchBackgroundGalleryCatalog(),
                fetchBackgroundGalleryMine()
            ]);
            if (generation !== galleryRefreshGeneration) return;
            GALLERY_STATE.catalog = catalog;
            const serverMineCount = (mine?.images?.length || 0) + (mine?.videos?.length || 0);
            const recentUpload = GALLERY_STATE.lastSuccessfulUploadAt
                && (Date.now() - GALLERY_STATE.lastSuccessfulUploadAt < UPLOAD_KEEP_LOCAL_MS);
            if (serverMineCount === 0 && (previousMineCount > 0 || recentUpload)) {
                notifyGalleryUser(
                    'Upload saved locally; server list is empty — click Refresh or sign in again.',
                    'error'
                );
            } else if (previousMineCount > 0 && serverMineCount === 0) {
                notifyGalleryUser('Server returned no uploads. Sign in again or retry refresh.', 'error');
            } else {
                GALLERY_STATE.mine = mine;
                if (serverMineCount > 0) {
                    setGalleryStatus(`Loaded ${serverMineCount} background${serverMineCount === 1 ? '' : 's'} from server.`, 'success');
                    clearGalleryStatusSoon();
                }
            }
            syncGalleryCaches();
        } catch (error) {
            if (generation === galleryRefreshGeneration) {
                notifyGalleryUser(error?.message || 'Could not load background gallery.', 'error');
            }
        } finally {
            if (generation !== galleryRefreshGeneration) return;
            GALLERY_STATE.loading = false;
            renderBackgroundGalleryStudio();
            renderBackgroundGalleryPopup();
        }
    }

    function setGalleryLoadingMessage(message, visible = true) {
        const loading = document.getElementById('lux-bg-gallery-loading');
        if (!loading) return;
        if (message) loading.textContent = message;
        loading.hidden = !visible;
        loading.classList.toggle('is-uploading', visible && /upload/i.test(String(message || '')));
    }

    function resolveGalleryFetch() {
        if (typeof window.kiuPortalFetch === 'function') return window.kiuPortalFetch;
        if (typeof kiuPortalFetch === 'function') return kiuPortalFetch;
        return null;
    }

    function notifyGalleryUser(message, type = 'info') {
        const text = String(message || '').trim();
        if (!text) return;
        setGalleryStatus(text, type);
        if (typeof window.showToast === 'function') {
            window.showToast(text);
        } else if (typeof showToast === 'function') {
            showToast(text);
        }
        const logFn = type === 'error' ? console.error : console.info;
        logFn('[background-gallery]', text);
    }

    function setGalleryStatus(message = '', type = 'info') {
        const status = document.getElementById('lux-bg-gallery-status');
        if (!status) return;
        const text = String(message || '').trim();
        status.hidden = !text;
        status.textContent = text;
        status.classList.remove('is-error', 'is-success', 'is-info', 'is-uploading');
        if (!text) return;
        status.classList.add(type === 'error' ? 'is-error' : type === 'success' ? 'is-success' : 'is-info');
        if (type === 'uploading') status.classList.add('is-uploading');
        status.setAttribute('role', type === 'error' ? 'alert' : 'status');
    }

    function clearGalleryStatusSoon(delayMs = 6000) {
        window.clearTimeout(GALLERY_STATE.statusTimer);
        GALLERY_STATE.statusTimer = window.setTimeout(() => {
            if (!GALLERY_STATE.uploadInFlight && !GALLERY_STATE.loading) {
                setGalleryStatus('');
            }
        }, delayMs);
    }
    function hasGalleryUploadSession() {
        const tokenFn = typeof window.getPortalSessionToken === 'function'
            ? window.getPortalSessionToken
            : (typeof getPortalSessionToken === 'function' ? getPortalSessionToken : null);
        const token = tokenFn ? tokenFn() : '';
        return Boolean(String(token || '').trim());
    }

    function updateGalleryUploadSessionUi() {
        const canUpload = hasGalleryUploadSession() && Boolean(getUploadBackgroundGalleryAsset());
        ['lux-bg-gallery-upload', 'lux-bg-gallery-upload-curated'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const blocked = !canUpload || GALLERY_STATE.uploadInFlight;
            if (el.tagName === 'LABEL') {
                el.setAttribute('aria-disabled', blocked ? 'true' : 'false');
                el.classList.toggle('is-disabled', blocked);
            } else {
                el.disabled = blocked;
            }
            el.title = canUpload ? '' : 'Sign in through the portal to upload backgrounds.';
        });
        const hint = document.getElementById('lux-bg-gallery-actions-hint');
        if (hint) {
            if (!hasGalleryUploadSession()) {
                hint.textContent = 'Sign in through the portal to upload backgrounds.';
            } else if (!getUploadBackgroundGalleryAsset()) {
                hint.textContent = 'Gallery upload API not loaded — hard refresh the page.';
                setGalleryStatus(hint.textContent, 'error');
            } else if (!GALLERY_STATE.uploadInFlight) {
                hint.textContent = GALLERY_STATE.activePopup === 'videos'
                    ? 'Up to 20 private videos, 100 MB each.'
                    : 'Up to 20 images, 100 MB each. Auto-optimized for your screen.';
            }
        }
    }

    function showUploadError(error) {
        const status = error?.status || error?.httpStatus;
        const code = String(error?.code || '').trim();
        let message = error?.payload?.error || error?.message || '';
        if (code === 'KIU_PORTAL_SESSION_REQUIRED' || (status === 401 && !message)) {
            message = 'Sign in through the portal to upload backgrounds.';
        } else if (!message) {
            message = status === 401 || status === 403
                ? 'Sign in through the portal to upload backgrounds.'
                : 'Upload failed.';
        }
        setGalleryUploadLabelText('Upload failed', 'error');
        resetGalleryUploadLabelSoon(5000);
        notifyGalleryUser(message, 'error');
    }

    function appendGalleryItem(bucket, item) {
        if (!item?.id) return bucket;
        const next = {
            images: Array.isArray(bucket?.images) ? bucket.images.slice() : [],
            videos: Array.isArray(bucket?.videos) ? bucket.videos.slice() : []
        };
        const key = item.mediaType === 'video' ? 'videos' : 'images';
        if (!next[key].some((entry) => String(entry.id) === String(item.id))) {
            next[key].push(item);
        }
        return next;
    }

    function applyUploadResult(result, target) {
        if (!result?.item?.id) return;
        const item = result.item;
        if (target === 'catalog' && result.catalog) {
            GALLERY_STATE.catalog = result.catalog;
            GALLERY_STATE.activeTab = 'curated';
        } else {
            GALLERY_STATE.mine = result.items || appendGalleryItem(GALLERY_STATE.mine, item);
            GALLERY_STATE.activeTab = 'mine';
        }
        const popupMode = item.mediaType === 'video' ? 'videos' : 'images';
        if (GALLERY_STATE.activePopup !== popupMode) {
            GALLERY_STATE.activePopup = popupMode;
        }
        GALLERY_STATE.lastUploadedId = item.id;
        GALLERY_STATE.lastSuccessfulUploadAt = Date.now();
        syncGalleryCaches();
        storeGalleryTab(GALLERY_STATE.activeTab);
    }

    function ensureBackgroundGalleryPopup() {
        let backdrop = document.getElementById('lux-bg-gallery-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'lux-bg-gallery-backdrop';
            backdrop.className = 'lux-bg-gallery-backdrop';
            backdrop.setAttribute('data-lux-transparency-exempt', '1');
            backdrop.innerHTML = `
            <div class="lux-bg-gallery-dialog" role="dialog" aria-modal="true" aria-labelledby="lux-bg-gallery-title" data-lux-transparency-exempt="1">
                <div class="lux-bg-gallery-head">
                    <div class="lux-bg-gallery-head-copy">
                        <div class="lux-bg-gallery-eyebrow" id="lux-bg-gallery-eyebrow">Backgrounds · Images</div>
                        <div class="lux-bg-gallery-title" id="lux-bg-gallery-title">Background Gallery</div>
                        <div class="lux-bg-gallery-sub" id="lux-bg-gallery-sub">Choose a fullscreen background.</div>
                    </div>
                    <button class="lux-bg-gallery-close" id="lux-bg-gallery-close" type="button" aria-label="Close gallery"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-bg-gallery-actions">
                    <div class="lux-bg-gallery-actions-primary">
                        <label class="lux-bg-gallery-upload-btn" id="lux-bg-gallery-upload" for="lux-bg-gallery-file-input" role="button" tabindex="0">
                            <i class="fas fa-arrow-up" aria-hidden="true"></i>
                            <span id="lux-bg-gallery-upload-label">Upload image</span>
                        </label>
                        <button class="lux-bg-gallery-icon-btn" id="lux-bg-gallery-upload-curated" type="button" hidden data-lux-admin-only="1" aria-label="Add to curated gallery" title="Add to curated gallery">
                            <i class="fas fa-globe" aria-hidden="true"></i>
                        </button>
                        <button class="lux-bg-gallery-icon-btn" id="lux-bg-gallery-refresh" type="button" aria-label="Refresh gallery" title="Refresh gallery">
                            <i class="fas fa-sync-alt" aria-hidden="true"></i>
                        </button>
                    </div>
                    <p class="lux-bg-gallery-actions-hint" id="lux-bg-gallery-actions-hint">Auto-optimized for your screen.</p>
                </div>
                <div class="lux-bg-gallery-status" id="lux-bg-gallery-status" hidden role="status"></div>
                <div class="lux-bg-gallery-tabs" role="tablist" aria-label="Gallery sections">
                    <button class="lux-bg-gallery-tab is-active" id="lux-bg-gallery-tab-curated" type="button" role="tab" data-gallery-tab="curated" aria-selected="true" aria-controls="lux-bg-gallery-panel-curated">Curated</button>
                    <button class="lux-bg-gallery-tab" id="lux-bg-gallery-tab-mine" type="button" role="tab" data-gallery-tab="mine" aria-selected="false" aria-controls="lux-bg-gallery-panel-mine">My backgrounds</button>
                </div>
                <input id="lux-bg-gallery-file-input" type="file" hidden multiple>
                <div class="lux-bg-gallery-loading" id="lux-bg-gallery-loading" hidden>Loading gallery…</div>
                <div class="lux-bg-gallery-delete-confirm" id="lux-bg-gallery-delete-panel" hidden role="alertdialog" aria-modal="true" aria-labelledby="lux-bg-gallery-delete-title" aria-describedby="lux-bg-gallery-delete-text">
                    <div class="lux-bg-gallery-delete-confirm-copy">
                        <div class="lux-bg-gallery-delete-step" id="lux-bg-gallery-delete-step">Step 2 of 2 — confirm removal</div>
                        <strong class="lux-bg-gallery-delete-title" id="lux-bg-gallery-delete-title">Remove background?</strong>
                        <p class="lux-bg-gallery-delete-text" id="lux-bg-gallery-delete-text">This removes it from your gallery library. If it is applied as your wallpaper, the background will be cleared.</p>
                    </div>
                    <div class="lux-bg-gallery-delete-confirm-actions">
                        <button class="lux-bg-gallery-delete-cancel" id="lux-bg-gallery-delete-cancel" type="button">Cancel</button>
                        <button class="lux-bg-gallery-delete-confirm-btn" id="lux-bg-gallery-delete-confirm" type="button">Remove permanently</button>
                    </div>
                </div>
                <div class="lux-bg-gallery-body">
                    <div class="lux-bg-gallery-panel" id="lux-bg-gallery-panel-curated" data-gallery-panel="curated" role="tabpanel" aria-labelledby="lux-bg-gallery-tab-curated">
                        <div class="lux-bg-gallery-grid" id="lux-bg-gallery-curated-grid"></div>
                    </div>
                    <div class="lux-bg-gallery-panel" id="lux-bg-gallery-panel-mine" data-gallery-panel="mine" role="tabpanel" aria-labelledby="lux-bg-gallery-tab-mine" hidden>
                        <div class="lux-bg-gallery-grid" id="lux-bg-gallery-mine-grid"></div>
                    </div>
                </div>
                <div class="lux-bg-gallery-foot" id="lux-bg-gallery-foot" hidden>
                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                    <span>Admins: use Promote on a tile to publish to Curated.</span>
                </div>
                <div class="lux-bg-gallery-version" id="lux-bg-gallery-version" aria-hidden="true">Gallery v ${STUDIO_VERSION}</div>
            </div>
        `;
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) closeBackgroundGalleryPopup();
            });
            document.getElementById('lux-bg-gallery-close')?.addEventListener('click', () => closeBackgroundGalleryPopup());
        }
        bindBackgroundGalleryPopupControls(backdrop);
        return backdrop;
    }

    function bindBackgroundGalleryPopupControls(backdrop = document.getElementById('lux-bg-gallery-backdrop')) {
        if (!backdrop) return;
        if (galleryPopupControlsAbort) galleryPopupControlsAbort.abort();
        galleryPopupControlsAbort = new AbortController();
        const { signal } = galleryPopupControlsAbort;

        backdrop.addEventListener('click', (event) => {
            if (event.target.closest('[data-gallery-empty-upload]')) {
                event.preventDefault();
                triggerGalleryUpload();
                return;
            }
            const tabTarget = event.target.closest('[data-gallery-empty-tab]');
            if (tabTarget) {
                event.preventDefault();
                setGalleryTab(tabTarget.dataset.galleryEmptyTab);
                return;
            }
            const tabButton = event.target.closest('[data-gallery-tab]');
            if (tabButton) {
                setGalleryTab(tabButton.dataset.galleryTab);
            }
        }, { signal });

        const uploadControl = document.getElementById('lux-bg-gallery-upload');
        uploadControl?.addEventListener('click', (event) => {
            if (uploadControl.getAttribute('aria-disabled') === 'true') {
                event.preventDefault();
                return;
            }
            pendingUploadTarget = 'mine';
        }, { signal });
        uploadControl?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (uploadControl.getAttribute('aria-disabled') === 'true') {
                event.preventDefault();
                return;
            }
            pendingUploadTarget = 'mine';
        }, { signal });

        document.getElementById('lux-bg-gallery-upload-curated')?.addEventListener('click', () => {
            if (!hasGalleryUploadSession()) {
                showUploadError({ status: 401, message: 'Sign in through the portal to upload backgrounds.' });
                return;
            }
            if (!getUploadBackgroundGalleryAsset()) {
                showUploadError({ message: 'Gallery upload API not loaded. Hard refresh the page.' });
                return;
            }
            pendingUploadTarget = 'catalog';
            setGalleryLoadingMessage('Choose a file to upload…', true);
            armGalleryFilePickerCancelDetection();
            document.getElementById('lux-bg-gallery-file-input')?.click();
        }, { signal });
        document.getElementById('lux-bg-gallery-refresh')?.addEventListener('click', () => {
            if (!GALLERY_STATE.uploadInFlight) refreshBackgroundGalleryData();
        }, { signal });
        document.getElementById('lux-bg-gallery-file-input')?.addEventListener('change', (event) => {
            // HTMLInputElement.files is a live FileList in some browsers.  Resetting
            // the input before the async uploader reads it can therefore turn a
            // valid selection into an empty list, which made uploads disappear
            // without a request or error message.
            const files = Array.from(event.target.files || []);
            const target = pendingUploadTarget;
            event.target.value = '';
            // handleGalleryUpload reports its own failures in the dialog.  Swallow
            // the rethrow here so the same error is not reported twice.
            void handleGalleryUploads(files, { target }).catch(() => {});
        }, { signal });
        document.getElementById('lux-bg-gallery-delete-cancel')?.addEventListener('click', () => {
            clearGalleryDeleteConfirm();
        }, { signal });
        document.getElementById('lux-bg-gallery-delete-confirm')?.addEventListener('click', () => {
            void confirmGalleryItemDelete();
        }, { signal });
        backdrop.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && GALLERY_STATE.pendingDelete) {
                event.preventDefault();
                event.stopPropagation();
                clearGalleryDeleteConfirm();
            }
        }, { signal });
    }

    function clearGalleryDeleteConfirm() {
        GALLERY_STATE.pendingDelete = null;
        renderGalleryDeleteConfirm();
    }

    function beginGalleryItemDelete(item, source) {
        if (!item?.id) return;
        GALLERY_STATE.pendingDelete = {
            item,
            source,
            label: String(item.label || 'Background').trim() || 'Background'
        };
        renderGalleryDeleteConfirm();
        document.getElementById('lux-bg-gallery-delete-confirm')?.focus();
    }

    function renderGalleryDeleteConfirm() {
        const panel = document.getElementById('lux-bg-gallery-delete-panel');
        const title = document.getElementById('lux-bg-gallery-delete-title');
        const text = document.getElementById('lux-bg-gallery-delete-text');
        const pending = GALLERY_STATE.pendingDelete;
        document.querySelectorAll('#lux-bg-gallery-backdrop .lux-bg-gallery-tile.is-delete-target').forEach((tile) => {
            tile.classList.remove('is-delete-target');
        });
        if (!panel || !pending) {
            if (panel) panel.hidden = true;
            return;
        }
        const isCurated = pending.source === 'catalog';
        const noun = pending.item.mediaType === 'video' ? 'video' : 'image';
        const safeLabel = typeof escapeHtml === 'function' ? escapeHtml(pending.label) : pending.label;
        if (title) {
            title.textContent = isCurated
                ? `Remove curated ${noun}?`
                : `Remove “${pending.label}”?`;
        }
        if (text) {
            text.innerHTML = isCurated
                ? `Step 2 of 2: permanently remove <strong>${safeLabel}</strong> from the curated gallery for everyone.`
                : `Step 2 of 2: permanently remove <strong>${safeLabel}</strong> from My backgrounds. If it is your active wallpaper, the background will be cleared.`;
        }
        panel.hidden = false;
        const tile = document.querySelector(
            `#lux-bg-gallery-backdrop .lux-bg-gallery-tile[data-gallery-id="${CSS.escape(String(pending.item.id))}"]`
        );
        tile?.classList.add('is-delete-target');
    }

    async function confirmGalleryItemDelete() {
        const pending = GALLERY_STATE.pendingDelete;
        if (!pending?.item?.id || typeof kiuPortalFetch !== 'function') return;
        if (!hasGalleryUploadSession()) {
            showUploadError({ status: 401, message: 'Sign in through the portal to remove backgrounds.' });
            return;
        }
        const confirmBtn = document.getElementById('lux-bg-gallery-delete-confirm');
        const cancelBtn = document.getElementById('lux-bg-gallery-delete-cancel');
        if (confirmBtn) confirmBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;

        const removedId = String(pending.item.id);

        try {
            const encodedId = encodeURIComponent(removedId);
            const path = pending.source === 'catalog'
                ? `/api/background-gallery/catalog/${encodedId}`
                : `/api/background-gallery/mine/${encodedId}`;
            const result = await kiuPortalFetch(path, { method: 'DELETE' });
            if (pending.source === 'catalog' && result?.catalog) {
                GALLERY_STATE.catalog = result.catalog;
            } else if (result?.items) {
                GALLERY_STATE.mine = result.items;
            }
            syncGalleryCaches();
            GALLERY_STATE.pendingDelete = null;
            renderGalleryDeleteConfirm();
            renderBackgroundGalleryPopup();
            const selection = getActiveGallerySelection();
            if (
                selection
                && selection.source === pending.source
                && String(selection.id) === removedId
                && typeof clearBackgroundGallery === 'function'
            ) {
                clearBackgroundGallery(true);
            }
            await refreshBackgroundGalleryData();
            if (typeof showToast === 'function') {
                showToast(pending.source === 'catalog' ? 'Removed from curated gallery.' : 'Removed from My backgrounds.');
            }
        } catch (error) {
            showUploadError(error?.message ? error : { message: 'Could not remove background.' });
            await refreshBackgroundGalleryData();
            GALLERY_STATE.pendingDelete = null;
            renderGalleryDeleteConfirm();
        } finally {
            if (confirmBtn) confirmBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
            renderGalleryDeleteConfirm();
        }
    }

    function setGalleryTab(tab) {
        GALLERY_STATE.activeTab = tab === 'mine' ? 'mine' : 'curated';
        storeGalleryTab(GALLERY_STATE.activeTab);
        document.querySelectorAll('#lux-bg-gallery-backdrop [data-gallery-tab]').forEach((button) => {
            const active = button.dataset.galleryTab === GALLERY_STATE.activeTab;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('#lux-bg-gallery-backdrop [data-gallery-panel]').forEach((panel) => {
            panel.hidden = panel.dataset.galleryPanel !== GALLERY_STATE.activeTab;
        });
    }

    function triggerGalleryUpload() {
        pendingUploadTarget = 'mine';
        if (!hasGalleryUploadSession()) {
            showUploadError({ status: 401, message: 'Sign in through the portal to upload backgrounds.' });
            return;
        }
        if (!getUploadBackgroundGalleryAsset()) {
            showUploadError({ message: 'Gallery upload API not loaded. Hard refresh the page.' });
            return;
        }
        setGalleryLoadingMessage('Choose a file to upload…', true);
        armGalleryFilePickerCancelDetection();
        document.getElementById('lux-bg-gallery-file-input')?.click();
    }

    function openBackgroundGalleryPopup(mediaType = 'images') {
        const normalized = mediaType === 'videos' ? 'videos' : 'images';
        GALLERY_STATE.activePopup = normalized;
        GALLERY_STATE.activeTab = loadStoredGalleryTab();
        const backdrop = ensureBackgroundGalleryPopup();
        const eyebrow = document.getElementById('lux-bg-gallery-eyebrow');
        const title = document.getElementById('lux-bg-gallery-title');
        const sub = document.getElementById('lux-bg-gallery-sub');
        const fileInput = document.getElementById('lux-bg-gallery-file-input');
        const uploadLabel = document.getElementById('lux-bg-gallery-upload-label');
        const actionsHint = document.getElementById('lux-bg-gallery-actions-hint');
        if (eyebrow) eyebrow.textContent = normalized === 'videos' ? 'Backgrounds · Videos' : 'Backgrounds · Images';
        if (title) title.textContent = normalized === 'videos' ? 'Video Backgrounds' : 'Image Backgrounds';
        if (sub) {
            sub.textContent = normalized === 'videos'
                ? 'Select up to 20 videos, 100 MB each. Fullscreen cover on all devices.'
                : 'Images auto-optimized for your screen. Fullscreen cover on all devices.';
        }
        if (fileInput) {
            fileInput.accept = normalized === 'videos' ? 'video/mp4,video/webm' : 'image/*';
        }
        if (uploadLabel) {
            setGalleryUploadLabelText(normalized === 'videos' ? 'Upload video' : 'Upload image', 'idle');
        }
        const versionFoot = document.getElementById('lux-bg-gallery-version');
        if (versionFoot) versionFoot.textContent = `Gallery v ${STUDIO_VERSION}`;
        if (actionsHint) {
            actionsHint.textContent = normalized === 'videos'
                ? 'Up to 20 private videos, 100 MB each.'
                : 'Up to 20 images, 100 MB each. Auto-optimized for your screen.';
        }
        document.querySelectorAll('#lux-bg-gallery-backdrop [data-lux-admin-only="1"]').forEach((el) => {
            el.hidden = !isGalleryAdmin();
        });
        setGalleryTab(GALLERY_STATE.activeTab);
        backdrop.classList.add('is-open');
        renderBackgroundGalleryPopup();
        updateGalleryUploadSessionUi();
        void refreshBackgroundGalleryData();
    }

    function closeBackgroundGalleryPopup() {
        clearGalleryDeleteConfirm();
        document.getElementById('lux-bg-gallery-backdrop')?.classList.remove('is-open');
        GALLERY_STATE.activePopup = null;
    }

    function getActiveGallerySelection() {
        return typeof getBackgroundGallerySelection === 'function' ? getBackgroundGallerySelection() : null;
    }

    function isGalleryTileActive(item, source) {
        const selection = getActiveGallerySelection();
        if (!selection || getStaticBackgroundFill?.() !== 'gallery') return false;
        return selection.source === source && String(selection.id) === String(item.id);
    }

    function buildGalleryTile(item, source) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'lux-bg-gallery-tile';
        tile.dataset.gallerySource = source;
        tile.dataset.galleryId = String(item.id || '');
        tile.classList.toggle('is-active', isGalleryTileActive(item, source));
        if (GALLERY_STATE.lastUploadedId && String(item.id) === String(GALLERY_STATE.lastUploadedId)) {
            tile.classList.add('is-new');
        }
        const thumbUrl = typeof getPortalStoredFileUrl === 'function'
            ? getPortalStoredFileUrl(item.fileId, { inline: true })
            : '';
        const mediaTag = item.mediaType === 'video'
            ? `<video class="lux-bg-gallery-media" muted playsinline preload="metadata" src="${thumbUrl}"></video>`
            : `<img class="lux-bg-gallery-media" alt="" loading="lazy" src="${thumbUrl}">`;
        const paletteKey = item.recommendedPaletteKey || 'ocean-teal';
        const promoteMarkup = source === 'user' && isGalleryAdmin()
            ? '<span class="lux-bg-gallery-promote" data-gallery-promote="1" role="button" tabindex="0">Promote</span>'
            : '';
        const canRemove = source === 'user' || (source === 'catalog' && isGalleryAdmin());
        const removeMarkup = canRemove
            ? '<span class="lux-bg-gallery-remove" data-gallery-remove="1" role="button" tabindex="0" aria-label="Remove background"><i class="fas fa-trash-alt" aria-hidden="true"></i></span>'
            : '';
        tile.innerHTML = `
            <span class="lux-bg-gallery-thumb">
                ${mediaTag}
                <span class="lux-bg-gallery-active-badge" aria-hidden="true"><i class="fas fa-check"></i></span>
                <span class="lux-bg-gallery-tile-overlay">
                    <span class="lux-bg-gallery-palette-chip" data-gallery-palette="${paletteKey}" role="button" tabindex="0">${paletteLabel(paletteKey)}</span>
                    <span class="lux-bg-gallery-tile-actions">
                        ${promoteMarkup}
                        ${removeMarkup}
                    </span>
                </span>
            </span>
            <span class="lux-bg-gallery-label">${typeof escapeHtml === 'function' ? escapeHtml(item.label || 'Background') : (item.label || 'Background')}</span>
        `;
        tile.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-gallery-remove]');
            if (removeBtn) {
                event.preventDefault();
                event.stopPropagation();
                beginGalleryItemDelete(item, source);
                return;
            }
            const promoteBtn = event.target.closest('[data-gallery-promote]');
            if (promoteBtn) {
                event.stopPropagation();
                const userId = typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe()?.id : '';
                if (userId) promoteUserGalleryItem(userId, item.id);
                return;
            }
            const paletteChip = event.target.closest('[data-gallery-palette]');
            if (paletteChip) {
                event.stopPropagation();
                const key = paletteChip.dataset.galleryPalette;
                if (key && typeof applyPaletteKey === 'function') applyPaletteKey(key, true);
                if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
                if (typeof showToast === 'function') showToast(`Palette: ${paletteLabel(key)}`);
                return;
            }
            if (typeof setBackgroundGallerySelection === 'function') {
                const applied = setBackgroundGallerySelection({
                    source,
                    id: item.id,
                    mediaType: item.mediaType
                }, true);
                if (applied) {
                    closeBackgroundGalleryPopup();
                    renderBackgroundGalleryStudio();
                } else if (typeof showToast === 'function') {
                    showToast('Could not apply background.');
                }
                return;
            }
            closeBackgroundGalleryPopup();
            renderBackgroundGalleryStudio();
        });
        return tile;
    }

    function buildGalleryEmptyState(source) {
        const mediaType = activeMediaType();
        const isVideo = mediaType === 'videos';
        const noun = isVideo ? 'video' : 'image';
        const icon = isVideo ? 'fa-film' : 'fa-image';
        const empty = document.createElement('div');
        empty.className = 'lux-bg-gallery-empty';
        if (source === 'catalog') {
            empty.innerHTML = `
                <div class="lux-bg-gallery-empty-icon" aria-hidden="true"><i class="fas ${icon}"></i></div>
                <div class="lux-bg-gallery-empty-title">No curated ${noun}s yet</div>
                <div class="lux-bg-gallery-empty-copy">Switch to My backgrounds or upload the first ${noun}.</div>
                <div class="lux-bg-gallery-empty-actions">
                    <button class="lux-bg-gallery-empty-cta" type="button" data-gallery-empty-tab="mine">View my uploads</button>
                    <button class="lux-bg-gallery-empty-link" type="button" data-gallery-empty-upload>Upload ${noun}</button>
                </div>
            `;
            return empty;
        }
        empty.innerHTML = `
            <div class="lux-bg-gallery-empty-icon" aria-hidden="true"><i class="fas ${icon}"></i></div>
            <div class="lux-bg-gallery-empty-title">No uploads yet</div>
            <div class="lux-bg-gallery-empty-copy">Upload a private ${noun} — it stays in your library until you apply it.</div>
            <div class="lux-bg-gallery-empty-actions">
                <button class="lux-bg-gallery-empty-cta" type="button" data-gallery-empty-upload>Upload ${noun}</button>
            </div>
        `;
        return empty;
    }

    function renderGalleryGrid(container, items, source) {
        if (!container) return;
        container.replaceChildren();
        if (!items.length) {
            container.appendChild(buildGalleryEmptyState(source));
            return;
        }
        items.forEach((item) => container.appendChild(buildGalleryTile(item, source)));
    }

    function updateGalleryTabLabels(mediaType) {
        const curatedCount = mediaBucket(GALLERY_STATE.catalog, mediaType).length;
        const mineCount = mediaBucket(GALLERY_STATE.mine, mediaType).length;
        const curatedTab = document.getElementById('lux-bg-gallery-tab-curated');
        const mineTab = document.getElementById('lux-bg-gallery-tab-mine');
        if (curatedTab) curatedTab.textContent = `Curated (${curatedCount})`;
        if (mineTab) mineTab.textContent = `My backgrounds (${mineCount})`;
    }

    function highlightNewUploadTile() {
        const id = GALLERY_STATE.lastUploadedId;
        if (!id) return;
        const tile = document.querySelector(`#lux-bg-gallery-backdrop .lux-bg-gallery-tile[data-gallery-id="${CSS.escape(String(id))}"]`);
        if (!tile) return;
        tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        window.setTimeout(() => {
            tile.classList.remove('is-new');
            if (String(GALLERY_STATE.lastUploadedId) === String(id)) {
                GALLERY_STATE.lastUploadedId = null;
            }
        }, 2200);
    }

    function renderBackgroundGalleryPopup() {
        if (!GALLERY_STATE.activePopup) return;
        const mediaType = activeMediaType();
        renderGalleryGrid(
            document.getElementById('lux-bg-gallery-curated-grid'),
            mediaBucket(GALLERY_STATE.catalog, mediaType),
            'catalog'
        );
        renderGalleryGrid(
            document.getElementById('lux-bg-gallery-mine-grid'),
            mediaBucket(GALLERY_STATE.mine, mediaType),
            'user'
        );
        updateGalleryTabLabels(mediaType);
        const foot = document.getElementById('lux-bg-gallery-foot');
        if (foot) foot.hidden = !isGalleryAdmin();
        const loading = document.getElementById('lux-bg-gallery-loading');
        if (loading) {
            loading.hidden = !GALLERY_STATE.loading;
            if (GALLERY_STATE.loading && !loading.textContent.trim()) {
                loading.textContent = 'Loading gallery…';
            }
        }
        setGalleryTab(GALLERY_STATE.activeTab);
        if (GALLERY_STATE.lastUploadedId) highlightNewUploadTile();
        renderGalleryDeleteConfirm();
        updateGalleryUploadSessionUi();
    }

    function renderBackgroundGalleryStudio() {
        const section = document.getElementById('lux-bg-gallery-section');
        if (!section) return;
        const animationsOff = typeof areBackgroundAnimationsEnabled === 'function' ? !areBackgroundAnimationsEnabled() : false;
        section.hidden = !animationsOff;
    }

    async function prepareUploadFile(file) {
        const mediaType = String(file.type || '').startsWith('video/') ? 'video' : 'image';
        if (mediaType === 'video') {
            if (file.size > GALLERY_MAX_BYTES) {
                if (typeof showToast === 'function') showToast('Each video must be 100 MB or smaller.');
                return null;
            }
            return file;
        }
        if (typeof window.optimizeGalleryImageFile === 'function') {
            try {
                return await window.optimizeGalleryImageFile(file);
            } catch (error) {
                return file;
            }
        }
        return file;
    }

    async function handleGalleryUpload(fileList, options = {}) {
        GALLERY_STATE.awaitingFilePicker = false;
        if (galleryFilePickerFocusHandler) {
            window.removeEventListener('focus', galleryFilePickerFocusHandler);
            galleryFilePickerFocusHandler = null;
        }
        const file = fileList?.[0];
        if (!file) {
            setGalleryLoadingMessage('', false);
            return;
        }
        notifyGalleryUser(`Selected: ${file.name}`, 'info');
        if (GALLERY_STATE.uploadInFlight) {
            notifyGalleryUser('Upload already in progress…', 'info');
            return;
        }
        const target = options.target === 'catalog' && isGalleryAdmin() ? 'catalog' : 'mine';
        const batchTotal = Math.max(1, Number(options.batchTotal) || 1);
        const batchPosition = Math.min(batchTotal, Math.max(1, Number(options.batchPosition) || 1));
        const uploadProgress = batchTotal > 1
            ? `Uploading ${batchPosition} of ${batchTotal}…`
            : 'Uploading…';
        try {
            if (file.size > GALLERY_MAX_BYTES) {
                const noun = String(file.type || '').startsWith('video/') ? 'video' : 'image';
                throw new Error(`Each ${noun} must be 100 MB or smaller.`);
            }
            if (!hasGalleryUploadSession()) {
                throw Object.assign(new Error('Sign in through the portal to upload backgrounds.'), { status: 401 });
            }
            const uploadAsset = getUploadBackgroundGalleryAsset();
            if (!uploadAsset) {
                throw new Error('Gallery upload API not loaded. Hard refresh the page.');
            }
            invalidateGalleryRefresh();
            GALLERY_STATE.uploadInFlight = true;
            GALLERY_STATE.loading = true;
            setGalleryUploadControlsDisabled(true);
            setGalleryLoadingMessage(uploadProgress, true);
            setGalleryUploadLabelText(uploadProgress, 'uploading');
            notifyGalleryUser(uploadProgress, 'uploading');
            renderBackgroundGalleryPopup();
            const prepared = await prepareUploadFile(file);
            if (!prepared) {
                throw new Error('Could not prepare file for upload.');
            }
            const mediaType = String(prepared.type || file.type || '').startsWith('video/') ? 'video' : 'image';
            const uploadPayload = prepared instanceof File
                ? prepared
                : {
                    name: prepared.name || file.name,
                    type: prepared.type || file.type,
                    blob: prepared.blob
                };
            let recommendedPaletteKey = 'ocean-teal';
            const paletteSource = prepared.blob || prepared;
            if (typeof window.recommendGalleryPaletteFromFile === 'function') {
                const recommendation = await window.recommendGalleryPaletteFromFile(paletteSource, mediaType);
                recommendedPaletteKey = recommendation?.recommendedPaletteKey || recommendedPaletteKey;
            }
            const labelBase = (prepared.name || file.name || 'Background').replace(/\.[^.]+$/, '');
            const result = await uploadAsset(uploadPayload, {
                target,
                label: labelBase || 'Background',
                recommendedPaletteKey
            });
            if (!result?.item?.id) throw new Error('Upload failed — server returned no item.');
            applyUploadResult(result, target);
            renderBackgroundGalleryPopup();
            const uploadedCount = target === 'catalog'
                ? mediaBucket(GALLERY_STATE.catalog, activeMediaType()).length
                : mediaBucket(GALLERY_STATE.mine, activeMediaType()).length;
            const successMessage = target === 'catalog'
                ? `Saved to Curated (${uploadedCount}) — tap a tile to apply.`
                : `Saved to My backgrounds (${uploadedCount}) — tap a tile to apply.`;
            setGalleryUploadLabelText(target === 'catalog' ? 'Saved to Curated' : 'Saved', 'success');
            notifyGalleryUser(successMessage, 'success');
            clearGalleryStatusSoon(8000);
            resetGalleryUploadLabelSoon(5000);
        } catch (error) {
            showUploadError(error);
            throw error;
        } finally {
            GALLERY_STATE.uploadInFlight = false;
            GALLERY_STATE.loading = false;
            setGalleryUploadControlsDisabled(false);
            setGalleryLoadingMessage('', false);
            renderBackgroundGalleryPopup();
        }
    }

    async function handleGalleryUploads(fileList, options = {}) {
        const files = Array.from(fileList || []).filter(Boolean);
        if (files.length <= 1) return handleGalleryUpload(files, options);
        if (files.length > MAX_BATCH_FILES) {
            const message = `Select up to ${MAX_BATCH_FILES} images or videos at a time.`;
            setGalleryUploadLabelText('Too many files', 'error');
            notifyGalleryUser(message, 'error');
            resetGalleryUploadLabelSoon(5000);
            return { uploaded: 0, failed: files.length };
        }

        const failures = [];
        let uploaded = 0;
        for (const [index, file] of files.entries()) {
            try {
                await handleGalleryUpload([file], {
                    ...options,
                    batchPosition: index + 1,
                    batchTotal: files.length
                });
                uploaded += 1;
            } catch (error) {
                failures.push({ file, error });
            }
        }

        if (failures.length) {
            const failedNames = failures.slice(0, 2).map(({ file }) => file.name).join(', ');
            const remaining = failures.length > 2 ? ` and ${failures.length - 2} more` : '';
            const message = uploaded
                ? `Uploaded ${uploaded} of ${files.length}. ${failures.length} failed: ${failedNames}${remaining}.`
                : `Could not upload any of the ${files.length} selected files: ${failedNames}${remaining}.`;
            setGalleryUploadLabelText(uploaded ? `Saved ${uploaded}/${files.length}` : 'Upload failed', 'error');
            notifyGalleryUser(message, 'error');
        } else {
            const noun = activeMediaType() === 'videos' ? 'videos' : 'images';
            setGalleryUploadLabelText(`Saved ${uploaded}`, 'success');
            notifyGalleryUser(`Uploaded ${uploaded} ${noun} — tap a tile to apply.`, 'success');
        }
        clearGalleryStatusSoon(8000);
        resetGalleryUploadLabelSoon(5000);
        return { uploaded, failed: failures.length };
    }

    async function promoteUserGalleryItem(userId, itemId) {
        if (!isGalleryAdmin() || typeof kiuPortalFetch !== 'function') return;
        try {
            await kiuPortalFetch('/api/background-gallery/catalog/promote', {
                method: 'POST',
                body: JSON.stringify({ userId, itemId })
            });
            await refreshBackgroundGalleryData();
            if (typeof showToast === 'function') showToast('Promoted to curated gallery.');
        } catch (error) {
            if (typeof showToast === 'function') showToast('Promote failed.');
        }
    }

    function bindBackgroundGalleryStudioLauncher() {
        if (GALLERY_STATE.launcherBound) return;
        GALLERY_STATE.launcherBound = true;
        document.getElementById('lux-bg-gallery-open-images')?.addEventListener('click', () => {
            openBackgroundGalleryPopup('images');
        });
        document.getElementById('lux-bg-gallery-open-videos')?.addEventListener('click', () => {
            openBackgroundGalleryPopup('videos');
        });
        document.getElementById('lux-bg-gallery-clear')?.addEventListener('click', () => {
            if (typeof clearBackgroundGallery === 'function') clearBackgroundGallery(true);
            renderBackgroundGalleryStudio();
        });
    }

    function bindBackgroundGalleryStudioControls() {
        ensureBackgroundGalleryPopup();
        bindBackgroundGalleryStudioLauncher();
    }

    window.bindBackgroundGalleryStudioControls = bindBackgroundGalleryStudioControls;
    window.bindBackgroundGalleryPopupControls = bindBackgroundGalleryPopupControls;
    window.renderBackgroundGalleryStudio = renderBackgroundGalleryStudio;
    window.renderBackgroundGalleryPopup = renderBackgroundGalleryPopup;
    window.refreshBackgroundGalleryData = refreshBackgroundGalleryData;
    window.syncBackgroundGalleryStudioUi = renderBackgroundGalleryStudio;
    window.openBackgroundGalleryPopup = openBackgroundGalleryPopup;
    window.closeBackgroundGalleryPopup = closeBackgroundGalleryPopup;
    window.fetchBackgroundGalleryCatalog = fetchBackgroundGalleryCatalog;
    window.fetchBackgroundGalleryMine = fetchBackgroundGalleryMine;
    window.promoteBackgroundGalleryUserItem = promoteUserGalleryItem;

    async function diagnoseBackgroundGallery() {
        const userId = typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe()?.id : '';
        const token = typeof getPortalSessionToken === 'function' ? getPortalSessionToken() : '';
        const report = {
            studioVersion: STUDIO_VERSION,
            uploadApi: typeof window.uploadBackgroundGalleryAsset,
            backendUrl: typeof getKiuPortalBackendUrl === 'function' ? getKiuPortalBackendUrl() : '',
            session: {
                userId: String(userId || '').trim() || '(missing)',
                hasToken: Boolean(String(token || '').trim())
            },
            popup: GALLERY_STATE.activePopup,
            tab: GALLERY_STATE.activeTab,
            cache: {
                mineImages: GALLERY_STATE.mine?.images?.length || 0,
                mineVideos: GALLERY_STATE.mine?.videos?.length || 0,
                curatedImages: GALLERY_STATE.catalog?.images?.length || 0,
                curatedVideos: GALLERY_STATE.catalog?.videos?.length || 0
            },
            refreshGeneration: galleryRefreshGeneration,
            uploadInFlight: GALLERY_STATE.uploadInFlight
        };
        if (!report.session.hasToken || report.session.userId === '(missing)') {
            report.likelyCause = 'No portal backend session — sign in again at /login.html';
        } else if (report.uploadApi !== 'function') {
            report.likelyCause = 'uploadBackgroundGalleryAsset missing — hard refresh (Ctrl+Shift+R)';
        }
        try {
            const [catalog, mine] = await Promise.all([
                fetchBackgroundGalleryCatalog(),
                fetchBackgroundGalleryMine()
            ]);
            report.server = {
                mineImages: mine?.images?.length || 0,
                mineVideos: mine?.videos?.length || 0,
                curatedImages: catalog?.images?.length || 0,
                curatedVideos: catalog?.videos?.length || 0,
                mineSample: (mine?.images || []).slice(0, 2).map((item) => ({
                    id: item.id,
                    label: item.label,
                    fileId: item.fileId
                }))
            };
            if (!report.likelyCause) {
                if (report.server.mineImages === 0 && report.cache.mineImages === 0) {
                    report.likelyCause = 'Server has no uploads for this user — POST /upload likely failed or never ran';
                } else if (report.server.mineImages > 0 && report.cache.mineImages === 0) {
                    report.likelyCause = 'Server has items but UI cache empty — click Refresh or reopen popup';
                } else if (report.server.mineImages > report.cache.mineImages) {
                    report.likelyCause = 'Stale UI — refresh gallery data';
                }
            }
        } catch (error) {
            report.serverError = {
                status: error?.status || 0,
                message: error?.message || 'fetch failed',
                code: error?.code || ''
            };
            if (!report.likelyCause) {
                if (error?.status === 401) report.likelyCause = 'Session expired — sign in again';
                else if (error?.status === 404) report.likelyCause = 'Backend missing /api/background-gallery routes — restart ./start-local-8876.sh';
                else report.likelyCause = report.serverError.message;
            }
        }
        console.info('[bgg-diagnose]', report);
        return report;
    }
    window.__kiuDiagnoseBackgroundGallery = diagnoseBackgroundGallery;
})();
