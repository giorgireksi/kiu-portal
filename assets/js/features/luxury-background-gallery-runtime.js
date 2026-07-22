/* Background gallery media renderer (#lux-bg-media). */
(function initLuxuryBackgroundGalleryRuntime() {
    'use strict';
    if (window.__KIU_BACKGROUND_GALLERY_RUNTIME_LOADED) return;
    window.__KIU_BACKGROUND_GALLERY_RUNTIME_LOADED = true;

    let activeMediaEl = null;
    let resizeTimer = null;

    function getFileUrl(fileId) {
        if (typeof getPortalStoredFileUrl === 'function') {
            return getPortalStoredFileUrl(fileId, { inline: true });
        }
        return '';
    }

    function ensureBackgroundGalleryMount() {
        let mount = document.getElementById('lux-bg-media');
        if (!mount) {
            mount = document.createElement('div');
            mount.id = 'lux-bg-media';
            mount.setAttribute('aria-hidden', 'true');
            const canvas = document.getElementById('lux-bg-canvas');
            if (canvas && canvas.parentNode) {
                canvas.parentNode.insertBefore(mount, canvas);
            } else {
                document.body.prepend(mount);
            }
        }
        return mount;
    }

    function clearBackgroundGalleryMedia() {
        const mount = document.getElementById('lux-bg-media');
        if (!mount) return;
        if (activeMediaEl) {
            activeMediaEl.pause?.();
            activeMediaEl.removeAttribute('src');
            activeMediaEl.load?.();
            activeMediaEl.remove();
            activeMediaEl = null;
        }
        mount.replaceChildren();
        mount.hidden = true;
    }

    function shouldRenderGallery() {
        const animationsOn = typeof areBackgroundAnimationsEnabled === 'function'
            ? areBackgroundAnimationsEnabled()
            : document.body?.dataset?.luxBackgroundAnimation !== 'off';
        if (animationsOn) return false;
        const fill = typeof getStaticBackgroundFill === 'function'
            ? getStaticBackgroundFill()
            : (document.body?.dataset?.luxStaticBackground || 'colored');
        if (fill !== 'gallery') return false;
        const selection = typeof getBackgroundGallerySelection === 'function'
            ? getBackgroundGallerySelection()
            : null;
        return !!(selection && selection.id && selection.mediaType);
    }

    function resolveGalleryItemFromCaches(selection, catalog, mine) {
        if (!selection?.id) return null;
        const bucketKey = selection.mediaType === 'video' ? 'videos' : 'images';
        const sourceList = selection.source === 'user'
            ? (mine?.[bucketKey] || [])
            : (catalog?.[bucketKey] || []);
        return sourceList.find((item) => String(item.id) === String(selection.id)) || null;
    }

    function scheduleGalleryResizeSync() {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            resizeTimer = null;
            if (typeof window.__kiuSyncBackgroundGalleryMedia === 'function') {
                window.__kiuSyncBackgroundGalleryMedia(window.__kiuBackgroundGalleryCaches || {});
            }
        }, 150);
    }

    function syncBackgroundGalleryMedia(caches = {}) {
        const mount = ensureBackgroundGalleryMount();
        if (!shouldRenderGallery()) {
            clearBackgroundGalleryMedia();
            return;
        }
        const selection = getBackgroundGallerySelection();
        const item = resolveGalleryItemFromCaches(selection, caches.catalog, caches.mine);
        if (!item?.fileId) {
            clearBackgroundGalleryMedia();
            return;
        }
        const url = getFileUrl(item.fileId);
        if (!url) {
            clearBackgroundGalleryMedia();
            return;
        }
        const mediaType = item.mediaType === 'video' ? 'video' : 'image';
        const existing = mount.querySelector(mediaType === 'video' ? 'video' : 'img');
        if (existing && existing.dataset.galleryItemId === String(item.id) && existing.src === url) {
            mount.hidden = false;
            activeMediaEl = existing;
            return;
        }
        clearBackgroundGalleryMedia();
        if (mediaType === 'video') {
            const video = document.createElement('video');
            video.className = 'lux-bg-gallery-media';
            video.dataset.galleryItemId = String(item.id);
            video.src = url;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            mount.appendChild(video);
            activeMediaEl = video;
        } else {
            const img = document.createElement('img');
            img.className = 'lux-bg-gallery-media';
            img.dataset.galleryItemId = String(item.id);
            img.alt = '';
            img.decoding = 'async';
            img.loading = 'eager';
            img.src = url;
            mount.appendChild(img);
            activeMediaEl = img;
        }
        mount.hidden = false;
    }

    window.addEventListener('resize', scheduleGalleryResizeSync, { passive: true });
    window.addEventListener('orientationchange', scheduleGalleryResizeSync, { passive: true });

    window.__kiuEnsureBackgroundGalleryMount = ensureBackgroundGalleryMount;
    window.__kiuSyncBackgroundGalleryMedia = syncBackgroundGalleryMedia;
    window.__kiuClearBackgroundGalleryMedia = clearBackgroundGalleryMedia;
    window.__kiuResolveGalleryItemFromCaches = resolveGalleryItemFromCaches;
})();
