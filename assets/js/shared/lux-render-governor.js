/* Shared render governor — one pacing table for particles, fog, and canvas loops. */
const MODAL_OVERLAY_SELECTOR = ".modal-overlay.active, [data-lux-modal-overlay].active:not([aria-hidden='true']), [data-lux-modal-overlay].open:not([aria-hidden='true']), [data-lux-modal-overlay].is-open:not([aria-hidden='true'])";

let modalOpenCached = false;
let modalOpenCacheUntil = 0;
const stateListeners = new Set();
let lastNotifiedBusy = false;
let portalPerfProbe = null;

function publishPortalPerfProbe(now = performance.now()) {
    if (!portalPerfProbe) return;
    const elapsed = Math.max(1, now - portalPerfProbe.startedAt);
    window.__KIU_PORTAL_PERF = {
        elapsedMs: Math.round(elapsed),
        fps: Math.round((portalPerfProbe.frames * 1000 / elapsed) * 10) / 10,
        frames: portalPerfProbe.frames,
        droppedFrames: portalPerfProbe.droppedFrames,
        maxFrameMs: Math.round(portalPerfProbe.maxFrameMs * 10) / 10,
        longTasks: portalPerfProbe.longTasks,
        longTaskMs: Math.round(portalPerfProbe.longTaskMs * 10) / 10
    };
}

function samplePortalPerfProbe(now) {
    if (!portalPerfProbe) return;
    if (portalPerfProbe.lastFrameAt) {
        const frameMs = now - portalPerfProbe.lastFrameAt;
        portalPerfProbe.maxFrameMs = Math.max(portalPerfProbe.maxFrameMs, frameMs);
        if (frameMs > 16.7) {
            portalPerfProbe.droppedFrames += Math.max(1, Math.round(frameMs / 16.7) - 1);
        }
    }
    portalPerfProbe.lastFrameAt = now;
    portalPerfProbe.frames += 1;
    if (!portalPerfProbe.lastPublishedAt || now - portalPerfProbe.lastPublishedAt >= 1000) {
        portalPerfProbe.lastPublishedAt = now;
        publishPortalPerfProbe(now);
    }
    portalPerfProbe.raf = requestAnimationFrame(samplePortalPerfProbe);
}

export function startLuxPortalPerfProbe() {
    if (portalPerfProbe || typeof window === 'undefined') return window.__KIU_PORTAL_PERF || null;
    portalPerfProbe = {
        startedAt: performance.now(),
        lastFrameAt: 0,
        lastPublishedAt: 0,
        frames: 0,
        droppedFrames: 0,
        maxFrameMs: 0,
        longTasks: 0,
        longTaskMs: 0,
        observer: null,
        raf: 0
    };
    if (window.PerformanceObserver?.supportedEntryTypes?.includes('longtask')) {
        portalPerfProbe.observer = new window.PerformanceObserver((list) => {
            if (!portalPerfProbe) return;
            list.getEntries().forEach((entry) => {
                portalPerfProbe.longTasks += 1;
                portalPerfProbe.longTaskMs += Number(entry.duration) || 0;
            });
        });
        portalPerfProbe.observer.observe({ type: 'longtask', buffered: false });
    }
    portalPerfProbe.raf = requestAnimationFrame(samplePortalPerfProbe);
    return window.__KIU_PORTAL_PERF || null;
}

export function stopLuxPortalPerfProbe() {
    if (!portalPerfProbe) return window.__KIU_PORTAL_PERF || null;
    cancelAnimationFrame(portalPerfProbe.raf);
    portalPerfProbe.observer?.disconnect();
    publishPortalPerfProbe();
    portalPerfProbe = null;
    return window.__KIU_PORTAL_PERF || null;
}

export function isModalOverlayOpen() {
    const now = performance.now();
    if (now < modalOpenCacheUntil) return modalOpenCached;
    try {
        modalOpenCached = Boolean(document.querySelector(MODAL_OVERLAY_SELECTOR));
    } catch (_error) {
        modalOpenCached = false;
    }
    modalOpenCacheUntil = now + 200;
    return modalOpenCached;
}

export function getPacingMultiplier() {
    try {
        if (window.__luxStudioSliderDragging) return 6;
        if (document.body?.classList?.contains('lux-studio-open')) return 3.2;
        if (document.documentElement?.classList?.contains('lux-shell-chrome-motion')) return 3;
        if (window.__luxShellHoverBusy) return 1.4;
        if (window.__luxShellInteractionLock || window.__luxShellInteractionBusy) return 6;
        if (window.__luxIsScrolling) return 4.5;
        if (isModalOverlayOpen()) return 2.6;
    } catch (_error) { /* ignore */ }
    return 1;
}

export function shouldSkipCanvasFrame() {
    return window.__luxIsAnimating === true
        || window.__luxShellHoverBusy === true
        || window.__luxShellInteractionLock === true
        || window.__luxShellInteractionBusy === true;
}

export function readCanvasFrameIntervalMs() {
    try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--lux-canvas-frame-interval').trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 33;
    } catch (_error) {
        return 33;
    }
}

export function readGovernedFrameIntervalMs() {
    return Math.max(33, readCanvasFrameIntervalMs() * getPacingMultiplier());
}

export function shouldDeferTransparency() {
    return isGovernorBusy() || window.__luxIsScrolling === true;
}

export function shouldDeferLegacyVisualRefresh() {
    return isGovernorBusy() || window.__luxIsScrolling === true;
}

export function isGovernorBusy() {
    return shouldSkipCanvasFrame() || getPacingMultiplier() > 1;
}

export function notifyGovernorStateChange() {
    const busy = isGovernorBusy();
    if (busy === lastNotifiedBusy && !busy) return;
    lastNotifiedBusy = busy;
    stateListeners.forEach((listener) => {
        try { listener(busy); } catch (_error) { /* ignore */ }
    });
}

export function onGovernorStateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
}

if (typeof window !== 'undefined') {
    window.getLuxPacingMultiplier = getPacingMultiplier;
    window.isLuxModalOverlayOpenCached = isModalOverlayOpen;
    window.shouldSkipLuxCanvasFrame = shouldSkipCanvasFrame;
    window.readLuxGovernedFrameInterval = readGovernedFrameIntervalMs;
    window.shouldDeferLuxTransparency = shouldDeferTransparency;
    window.shouldDeferLuxLegacyVisualRefresh = shouldDeferLegacyVisualRefresh;
    window.notifyLuxGovernorStateChange = notifyGovernorStateChange;
    window.onLuxGovernorStateChange = onGovernorStateChange;
    window.startKiuPortalPerfProbe = startLuxPortalPerfProbe;
    window.stopKiuPortalPerfProbe = stopLuxPortalPerfProbe;
    try {
        if (new URLSearchParams(window.location.search).get('perf') === '1') {
            startLuxPortalPerfProbe();
        }
    } catch (_error) { /* ignore */ }
}
