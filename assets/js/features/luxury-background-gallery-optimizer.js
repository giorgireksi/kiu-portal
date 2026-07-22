/* Client-side image optimizer for background gallery uploads (canvas only). */
(function initLuxuryBackgroundGalleryOptimizer() {
    'use strict';
    if (window.__KIU_BACKGROUND_GALLERY_OPTIMIZER_LOADED) return;
    window.__KIU_BACKGROUND_GALLERY_OPTIMIZER_LOADED = true;

    const SKIP_MAX_EDGE = 1920;
    const SKIP_MAX_BYTES = 2 * 1024 * 1024;
    const ABSOLUTE_MAX_EDGE = 2560;

    function computeTargetMaxEdge() {
        const viewportMax = Math.max(window.innerWidth || 1920, window.innerHeight || 1080);
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        return Math.min(ABSOLUTE_MAX_EDGE, Math.ceil(viewportMax * dpr));
    }

    function loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('image load failed'));
            };
            img.src = url;
        });
    }

    function encodeCanvas(canvas, mimeType, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('encode failed'));
                    return;
                }
                resolve(blob);
            }, mimeType, quality);
        });
    }

    async function pickOutputFormat(canvas) {
        try {
            const webpProbe = await encodeCanvas(canvas, 'image/webp', 0.82);
            if (webpProbe && webpProbe.type === 'image/webp') {
                return { mime: 'image/webp', quality: 0.82, ext: 'webp' };
            }
        } catch (error) { /* fall through */ }
        return { mime: 'image/jpeg', quality: 0.85, ext: 'jpg' };
    }

    function scaledDimensions(width, height, maxEdge) {
        const longest = Math.max(width, height);
        if (longest <= maxEdge) return { width, height };
        const scale = maxEdge / longest;
        return {
            width: Math.max(1, Math.round(width * scale)),
            height: Math.max(1, Math.round(height * scale))
        };
    }

    async function optimizeGalleryImageFile(file) {
        if (!file || !String(file.type || '').startsWith('image/')) {
            return file;
        }
        try {
            const img = await loadImageFromFile(file);
            const longest = Math.max(img.naturalWidth || 0, img.naturalHeight || 0);
            if (longest <= SKIP_MAX_EDGE && file.size <= SKIP_MAX_BYTES) {
                return file;
            }
            const targetEdge = computeTargetMaxEdge();
            const { width, height } = scaledDimensions(img.naturalWidth, img.naturalHeight, targetEdge);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: false });
            ctx.drawImage(img, 0, 0, width, height);
            const format = await pickOutputFormat(canvas);
            const blob = await encodeCanvas(canvas, format.mime, format.quality);
            const baseName = String(file.name || 'background').replace(/\.[^.]+$/, '') || 'background';
            return {
                blob,
                name: `${baseName}.${format.ext}`,
                type: format.mime
            };
        } catch (error) {
            return file;
        }
    }

    window.optimizeGalleryImageFile = optimizeGalleryImageFile;
})();
