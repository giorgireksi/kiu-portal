/* Background gallery palette recommendation from image/video frame sampling. */
(function initLuxuryBackgroundGalleryPalette() {
    'use strict';
    if (window.__KIU_BACKGROUND_GALLERY_PALETTE_LOADED) return;
    window.__KIU_BACKGROUND_GALLERY_PALETTE_LOADED = true;

    const PALETTE_HUES = [
        { key: 'obsidian-amber', hue: 37 },
        { key: 'slate-sapphire', hue: 222 },
        { key: 'pine-jade', hue: 149 },
        { key: 'burgundy-rose', hue: 350 },
        { key: 'sand-pearl', hue: 40 },
        { key: 'ink-orchid', hue: 296 },
        { key: 'ocean-teal', hue: 177 },
        { key: 'platinum-silver', hue: 215 }
    ];

    function circularHueDistance(a, b) {
        const diff = Math.abs(a - b) % 360;
        return diff > 180 ? 360 - diff : diff;
    }

    function mapHueToPaletteKey(hue) {
        let best = PALETTE_HUES[0];
        let bestDistance = Infinity;
        PALETTE_HUES.forEach((entry) => {
            const distance = circularHueDistance(hue, entry.hue);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = entry;
            }
        });
        const confidence = Math.max(0, Math.min(1, 1 - (bestDistance / 90)));
        return { recommendedPaletteKey: best.key, confidence };
    }

    function sampleImageData(imageData) {
        const { data, width, height } = imageData;
        let hueSum = 0;
        let satSum = 0;
        let count = 0;
        const step = Math.max(4, Math.floor(Math.min(width, height) / 48) * 4);
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const i = (y * width + x) * 4;
                const r = data[i] / 255;
                const g = data[i + 1] / 255;
                const b = data[i + 2] / 255;
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const l = (max + min) / 2;
                if (l < 0.05 || l > 0.95) continue;
                let h = 0;
                let s = 0;
                const d = max - min;
                if (d > 0.01) {
                    s = d / (1 - Math.abs(2 * l - 1));
                    if (max === r) h = ((g - b) / d) % 6;
                    else if (max === g) h = (b - r) / d + 2;
                    else h = (r - g) / d + 4;
                    h *= 60;
                    if (h < 0) h += 360;
                }
                if (s < 0.08) continue;
                hueSum += h;
                satSum += s;
                count += 1;
            }
        }
        if (!count) return mapHueToPaletteKey(177);
        return mapHueToPaletteKey(hueSum / count);
    }

    function loadImageElement(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('image load failed'));
            img.src = url;
        });
    }

    function captureVideoFrame(video) {
        return new Promise((resolve, reject) => {
            const onReady = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const width = Math.min(320, video.videoWidth || 320);
                    const height = Math.min(180, video.videoHeight || 180);
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(video, 0, 0, width, height);
                    resolve(ctx.getImageData(0, 0, width, height));
                } catch (error) {
                    reject(error);
                }
            };
            if (video.readyState >= 2) {
                onReady();
                return;
            }
            video.addEventListener('loadeddata', onReady, { once: true });
            video.addEventListener('error', () => reject(new Error('video load failed')), { once: true });
        });
    }

    async function recommendGalleryPaletteFromUrl(url, mediaType = 'image') {
        if (!url) return { recommendedPaletteKey: 'ocean-teal', confidence: 0 };
        try {
            if (mediaType === 'video') {
                const video = document.createElement('video');
                video.muted = true;
                video.playsInline = true;
                video.crossOrigin = 'anonymous';
                video.src = url;
                await video.play().catch(() => {});
                video.pause();
                video.currentTime = 0;
                await new Promise((resolve) => {
                    if (video.readyState >= 2) resolve();
                    else video.addEventListener('seeked', resolve, { once: true });
                });
                const imageData = await captureVideoFrame(video);
                return sampleImageData(imageData);
            }
            const img = await loadImageElement(url);
            const canvas = document.createElement('canvas');
            const width = Math.min(320, img.naturalWidth || 320);
            const height = Math.min(180, img.naturalHeight || 180);
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, width, height);
            return sampleImageData(ctx.getImageData(0, 0, width, height));
        } catch (error) {
            return { recommendedPaletteKey: 'ocean-teal', confidence: 0 };
        }
    }

    async function recommendGalleryPaletteFromFile(file, mediaType = 'image') {
        if (!file) return { recommendedPaletteKey: 'ocean-teal', confidence: 0 };
        const blob = file instanceof Blob ? file : file.blob;
        if (!blob) return { recommendedPaletteKey: 'ocean-teal', confidence: 0 };
        const url = URL.createObjectURL(blob);
        try {
            return await recommendGalleryPaletteFromUrl(url, mediaType);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    window.recommendGalleryPaletteFromFile = recommendGalleryPaletteFromFile;
    window.recommendGalleryPaletteFromUrl = recommendGalleryPaletteFromUrl;
    window.mapGalleryHueToPaletteKey = mapHueToPaletteKey;
})();
