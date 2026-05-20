(function initCanonicalSocialRuntime() {
    if (window.__KIU_SOCIAL_CANONICAL_RUNTIME_READY) return;

    const baseRenderPublicSocialPage = window.renderPublicSocialPage;
    if (typeof baseRenderPublicSocialPage !== 'function') {
        console.warn('[Social Canonical] Base social renderer was not available.');
        return;
    }

    let renderQueued = false;
    let renderPending = false;
    let renderFrameHandle = null;

    function flushRenderNow() {
        renderQueued = false;
        renderPending = false;
        renderFrameHandle = null;
        return baseRenderPublicSocialPage();
    }

    function scheduleRender() {
        renderPending = true;
        if (renderQueued) return null;
        renderQueued = true;
        const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 16));
        renderFrameHandle = schedule(() => {
            if (!renderPending) {
                renderQueued = false;
                renderFrameHandle = null;
                return;
            }
            flushRenderNow();
        });
        return null;
    }

    window.renderPublicSocialPageNow = function renderPublicSocialPageNow() {
        return flushRenderNow();
    };

    window.queuePublicSocialRender = function queuePublicSocialRender() {
        return scheduleRender();
    };

    window.renderPublicSocialPage = function renderPublicSocialPage(options = {}) {
        const immediate = options === true || options?.immediate === true || options?.flush === true;
        if (immediate) {
            if (renderFrameHandle && typeof window.cancelAnimationFrame === 'function') {
                window.cancelAnimationFrame(renderFrameHandle);
            }
            return flushRenderNow();
        }
        return scheduleRender();
    };

    window.bootstrapCanonicalSocialRuntime = async function bootstrapCanonicalSocialRuntime(force = false) {
        if (typeof bootstrapPortalSocialState === 'function') {
            await bootstrapPortalSocialState(force);
        }
        return true;
    };

    window.__KIU_SOCIAL_CANONICAL_RUNTIME_READY = true;
    window.__KIU_SOCIAL_CANONICAL_RENDER = baseRenderPublicSocialPage;
})();
