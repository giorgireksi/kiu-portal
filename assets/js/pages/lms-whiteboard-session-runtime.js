/* LMS whiteboard session/shell/render/bind helpers. Peeled from lms-whiteboard-runtime.js. Loaded via LMS_WHITEBOARD_MODULE_URLS before runtime.
 * Load before lms-whiteboard-runtime.js.
 */
(function initLmsWhiteboardSessionRuntime() {
    if (window.__KIU_LMS_WHITEBOARD_SESSION_LOADED) return;
    window.__KIU_LMS_WHITEBOARD_SESSION_LOADED = true;

    window.__kiuCreateLmsWhiteboardSessionApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function resolveActiveLmsWhiteboardContext(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey || (typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('whiteboard') : currentCourseId))
        : String(resourceKey || '').trim();
    if (!canonicalKey) return null;
    const workspace = typeof getLmsWhiteboardWorkspaceSafe === 'function'
        ? getLmsWhiteboardWorkspaceSafe(canonicalKey)
        : (typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(canonicalKey)
            : null) || { elements: [], sessionActive: false, editingEnabled: false, ui: {} };
    const canManage = typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(canonicalKey);
    const canEdit = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(canonicalKey);
    const isPersonal = typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey);
    const showWorkspace = (isPersonal && canEdit) || canManage || workspace.sessionActive;
    return { resourceKey: canonicalKey, workspace, canManage, canEdit, showWorkspace };
}

function getLmsWhiteboardLayoutFingerprint(resourceKey = '') {
    const context = resolveActiveLmsWhiteboardContext(resourceKey);
    if (!context) return '';
    const { workspace, canManage, canEdit, showWorkspace } = context;
    return [
        showWorkspace ? '1' : '0',
        workspace.sessionActive ? '1' : '0',
        workspace.editingEnabled ? '1' : '0',
        canManage ? '1' : '0',
        canEdit ? '1' : '0',
        workspace.ui?.accessDenied ? '1' : '0',
        workspace.ui?.routeUnavailable ? '1' : '0'
    ].join(':');
}

function getLmsWhiteboardElementsFingerprint(resourceKey = '') {
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { version: 0, elements: [] };
    return `${Number(workspace.version) || 0}:${(workspace.elements || []).length}`;
}

function getLmsWhiteboardVolatileFingerprint(resourceKey = '') {
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { ui: {}, elements: [] };
    const canManage = typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(resourceKey);
    return [
        workspace.ui?.syncing ? '1' : '0',
        workspace.ui?.dirty ? '1' : '0',
        workspace.ui?.loadingFromBackend ? '1' : '0',
        String(workspace.ui?.syncError || ''),
        workspace.ui?.routeUnavailable ? '1' : '0',
        canManage ? String((workspace.elements || []).length) : ''
    ].join('|');
}

function storeLmsWhiteboardFingerprints(resourceKey = '', layout = '', elements = '', volatile = '') {
    if (typeof window === 'undefined' || !resourceKey) return;
    window.__lmsWhiteboardRenderFingerprints = window.__lmsWhiteboardRenderFingerprints || {};
    window.__lmsWhiteboardElementsFingerprints = window.__lmsWhiteboardElementsFingerprints || {};
    window.__lmsWhiteboardVolatileFingerprints = window.__lmsWhiteboardVolatileFingerprints || {};
    window.__lmsWhiteboardRenderFingerprints[resourceKey] = layout;
    window.__lmsWhiteboardElementsFingerprints[resourceKey] = elements;
    window.__lmsWhiteboardVolatileFingerprints[resourceKey] = volatile;
}

function patchLmsWhiteboardRegion(contentArea, region, html) {
    if (!contentArea || !region) return;
    const node = contentArea.querySelector(`[data-lms-whiteboard-region="${region}"]`);
    if (!node) return;
    node.innerHTML = html;
}

function isLmsWhiteboardSessionOnlyLayoutChange(previous = '', next = '') {
    const prev = String(previous || '').split(':');
    const nxt = String(next || '').split(':');
    if (prev.length !== 7 || nxt.length !== 7) return false;
    const structuralSame = prev[0] === nxt[0]
        && prev[3] === nxt[3]
        && prev[4] === nxt[4]
        && prev[5] === nxt[5]
        && prev[6] === nxt[6];
    const sessionDelta = prev[1] !== nxt[1] || prev[2] !== nxt[2];
    return structuralSame && sessionDelta;
}

function syncLmsWhiteboardSessionBodyClass(workspace = {}) {
    const active = Boolean(workspace?.sessionActive) && typeof isLmsWhiteboardActiveTab === 'function' && isLmsWhiteboardActiveTab();
    document.body?.classList.toggle('kiu-lms-whiteboard-session-active', active);
}

function resyncLmsWhiteboardLayoutMetrics(shell, resourceKey = '') {
    if (!shell?.querySelector) return;
    const canonicalKey = resourceKey || LMS_WHITEBOARD_UI.boundKey;
    requestAnimationFrame(() => {
        if (typeof window.syncLmsWorkspaceChromeOffset === 'function') window.syncLmsWorkspaceChromeOffset();
        requestAnimationFrame(() => {
            const stage = shell.querySelector('[data-lms-whiteboard-region="stage"]');
            const canvas = shell.querySelector('.lms-whiteboard-canvas');
            if (isLmsWhiteboardWorkspaceGestureActive(canonicalKey)) {
                if (canvas) paintLmsWhiteboardCanvas(canonicalKey, canvas, { skipDocumentSync: true });
                return;
            }
            if (stage) syncLmsWhiteboardLogicalSizeFromStage(stage);
            if (canvas) {
                setupLmsWhiteboardCanvasHiDpi(canvas);
                paintLmsWhiteboardCanvas(canonicalKey);
            }
        });
    });
}

function scheduleLmsWhiteboardLayoutRecovery(shell, resourceKey = '') {
    if (!shell) return;
    [0, 80, 240].forEach((delay) => {
        setTimeout(() => resyncLmsWhiteboardLayoutMetrics(shell, resourceKey), delay);
    });
}

/* Props dock + session chrome: lms-whiteboard-chrome-runtime.js */

function getLmsPersonalDashboardBoardHost() {
    return document.querySelector('[data-lms-personal-dashboard-board-host]');
}

function isLmsPersonalBoardScratchMounted(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof isLmsPersonalBoardKey !== 'function' || !isLmsPersonalBoardKey(canonicalKey)) return false;
    const host = getLmsPersonalDashboardBoardHost();
    return Boolean(host?.querySelector(`.lms-whiteboard-shell[data-lms-whiteboard-key="${canonicalKey}"]`));
}

function shouldRefreshLmsPersonalWhiteboardScratch(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof isLmsPersonalBoardKey !== 'function' || !isLmsPersonalBoardKey(canonicalKey)) return false;
    return (typeof isLmsPersonalDashboardOpen === 'function' && isLmsPersonalDashboardOpen())
        || isLmsPersonalBoardScratchMounted(canonicalKey);
}

function refreshLmsPersonalWhiteboardScratchUi(resourceKey = '', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    if (isLmsWhiteboardWorkspaceGestureActive(canonicalKey)) {
        repaintLmsWhiteboardWorkspace(canonicalKey);
        return;
    }
    const host = getLmsPersonalDashboardBoardHost();
    const shell = host?.querySelector(`.lms-whiteboard-shell[data-lms-whiteboard-key="${canonicalKey}"]`);
    if (!shell && host) {
        renderLmsPersonalWhiteboardScratch(host, canonicalKey);
        return;
    }
    repaintLmsWhiteboardWorkspace(canonicalKey);
    syncLmsWhiteboardShellBinding(canonicalKey);
    const elementsFingerprint = getLmsWhiteboardElementsFingerprint(canonicalKey);
    const previousElements = window.__lmsWhiteboardElementsFingerprints?.[canonicalKey] || '';
    if (elementsFingerprint !== previousElements && !(ensureLmsWhiteboardWorkspace(canonicalKey).elements || []).length) {
        resetLmsWhiteboardViewport(canonicalKey);
    }
    storeLmsWhiteboardFingerprints(
        canonicalKey,
        getLmsWhiteboardLayoutFingerprint(canonicalKey),
        elementsFingerprint,
        getLmsWhiteboardVolatileFingerprint(canonicalKey)
    );
    const boundShell = getActiveLmsWhiteboardShell(canonicalKey);
    if (boundShell) scheduleLmsWhiteboardLayoutRecovery(boundShell, canonicalKey);
}

function getLmsWhiteboardShells(resourceKey = '') {
    const key = String(resourceKey || LMS_WHITEBOARD_UI.boundKey || '').trim();
    if (key) {
        return Array.from(document.querySelectorAll(`.lms-whiteboard-shell[data-lms-whiteboard-key="${key}"]`));
    }
    return Array.from(document.querySelectorAll('.lms-whiteboard-shell[data-lms-whiteboard-key]'));
}

function isLmsWhiteboardShellVisible(shell) {
    if (!shell?.isConnected) return false;
    const rect = shell.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function getActiveLmsWhiteboardShell(resourceKey = '') {
    const key = String(resourceKey || LMS_WHITEBOARD_UI.boundKey || '').trim();
    if (key && typeof isLmsPersonalDashboardOpen === 'function' && isLmsPersonalDashboardOpen()) {
        const hostShell = getLmsPersonalDashboardBoardHost()
            ?.querySelector(`.lms-whiteboard-shell[data-lms-whiteboard-key="${key}"]`);
        if (hostShell) return hostShell;
    }
    const shells = getLmsWhiteboardShells(resourceKey);
    if (!shells.length) {
        const keyIsPersonal = typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(key);
        const dashboardOpen = typeof isLmsPersonalDashboardOpen === 'function' && isLmsPersonalDashboardOpen();
        if (keyIsPersonal && !dashboardOpen) return null;
        return document.querySelector('.lms-whiteboard-shell[data-lms-whiteboard-key]')
            || document.querySelector('.lms-whiteboard-shell');
    }
    if (LMS_WHITEBOARD_UI.fullscreen) {
        const mounted = shells.find(shell => shell.dataset.lmsWhiteboardFullscreenMounted === '1');
        if (mounted) return mounted;
    }
    const visible = shells.filter(isLmsWhiteboardShellVisible);
    if (visible.length === 1) return visible[0];
    if (visible.length > 1) {
        return visible.find(shell => shell.dataset.lmsWhiteboardFullscreenMounted === '1') || visible[visible.length - 1];
    }
    return shells[shells.length - 1];
}

function syncLmsWhiteboardShellBinding(resourceKey = '') {
    const context = resolveActiveLmsWhiteboardContext(resourceKey);
    if (!context?.resourceKey) return;
    const shell = getActiveLmsWhiteboardShell(context.resourceKey);
    if (!shell) return;
    if (shell.dataset.lmsWhiteboardBound !== context.resourceKey) {
        bindLmsWhiteboardSection(context.resourceKey, context.canEdit, context.canManage);
        return;
    }
    const stage = shell.querySelector('[data-lms-whiteboard-region="stage"]');
    const canvas = shell.querySelector('.lms-whiteboard-canvas');
    if (stage && canvas && !stage.dataset.lmsWhiteboardPointerBound) {
        bindLmsWhiteboardStagePointerHandlers(stage, canvas, context.resourceKey, context.canEdit);
    }
    bindLmsWhiteboardHudControls(shell, context.resourceKey, context.canEdit, context.canManage);
}

function cleanupLmsWhiteboardShellsBeforeRender(resourceKey = '') {
    const key = String(resourceKey || '').trim();
    const selector = key
        ? `.lms-whiteboard-shell[data-lms-whiteboard-key="${key}"]`
        : '.lms-whiteboard-shell[data-lms-whiteboard-key]';
    document.querySelectorAll(selector).forEach(shell => {
        if (shell.closest('.lms-personal-dashboard-board-host')) return;
        if (shell.dataset.lmsWhiteboardFullscreenMounted === '1') {
            restoreLmsWhiteboardFullscreenShell(shell);
        }
        shell.remove();
    });
}

function repaintLmsWhiteboardWorkspace(resourceKey = '', targetCanvas = null, options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    const canvas = targetCanvas
        || getActiveLmsWhiteboardShell(canonicalKey)?.querySelector('.lms-whiteboard-canvas')
        || null;
    const skipDocumentSync = options.skipDocumentSync === true || isLmsWhiteboardWorkspaceGestureActive(canonicalKey);
    paintLmsWhiteboardCanvas(canonicalKey, canvas, skipDocumentSync ? { skipDocumentSync: true } : undefined);
    if (!skipDocumentSync && typeof syncLmsWhiteboardDocumentLayer === 'function') syncLmsWhiteboardDocumentLayer(canonicalKey, canvas);
    refreshLmsWhiteboardLayersList();
    window.__lmsWhiteboardElementsFingerprints = window.__lmsWhiteboardElementsFingerprints || {};
    window.__lmsWhiteboardElementsFingerprints[canonicalKey] = getLmsWhiteboardElementsFingerprint(canonicalKey);
}

function repaintLmsWhiteboardAfterHistoryChange(resourceKey = '') {
    repaintLmsWhiteboardWorkspace(resourceKey);
}

function getLmsWhiteboardViewerId() {
    return String(typeof getCurrentUserId === 'function' ? getCurrentUserId() || '' : '').trim() || 'anon';
}

function isLmsPersonalWhiteboardKey(resourceKey = '') {
    const key = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    return typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(key);
}

function buildLmsWhiteboardLocalViewportStorageKey(resourceKey = '') {
    const key = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!key || !isLmsPersonalWhiteboardKey(key)) return '';
    return `lms-wb-view:${getLmsWhiteboardViewerId()}:${key}`;
}

function saveLmsWhiteboardLocalViewport(resourceKey = '') {
    const storageKey = buildLmsWhiteboardLocalViewportStorageKey(resourceKey);
    if (!storageKey) return;
    try {
        localStorage.setItem(storageKey, JSON.stringify({
            zoom: LMS_WHITEBOARD_UI.zoom,
            panX: LMS_WHITEBOARD_UI.panX,
            panY: LMS_WHITEBOARD_UI.panY,
            updatedAt: Date.now()
        }));
    } catch (_error) {
        /* ignore quota / private mode */
    }
}

function loadLmsWhiteboardLocalViewport(resourceKey = '') {
    const storageKey = buildLmsWhiteboardLocalViewportStorageKey(resourceKey);
    if (!storageKey) return false;
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return false;
        const data = JSON.parse(raw);
        const zoom = Number(data?.zoom);
        const panX = Number(data?.panX);
        const panY = Number(data?.panY);
        if (!Number.isFinite(zoom) || !Number.isFinite(panX) || !Number.isFinite(panY)) return false;
        LMS_WHITEBOARD_UI.zoom = Math.max(0.4, Math.min(2.5, zoom));
        LMS_WHITEBOARD_UI.panX = panX;
        LMS_WHITEBOARD_UI.panY = panY;
        return true;
    } catch (_error) {
        return false;
    }
}

function resetLmsWhiteboardViewport(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    LMS_WHITEBOARD_UI.zoom = 1;
    LMS_WHITEBOARD_UI.panX = 0;
    LMS_WHITEBOARD_UI.panY = 0;
    saveLmsWhiteboardLocalViewport(canonicalKey);
    repaintLmsWhiteboardWorkspace(canonicalKey);
    if (typeof paintLmsWhiteboardMinimap === 'function') paintLmsWhiteboardMinimap(canonicalKey);
}

function syncLmsWhiteboardViewportAfterRender(resourceKey = '', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    const elementCount = (workspace.elements || []).length;
    if (!elementCount) {
        resetLmsWhiteboardViewport(canonicalKey);
        return;
    }
    if (options.fitOnce === true) {
        window.__lmsWhiteboardViewportFitted = window.__lmsWhiteboardViewportFitted || {};
        if (window.__lmsWhiteboardViewportFitted[canonicalKey]) return;
        // Personal boards: restore this viewer's own camera before any auto-fit.
        if (loadLmsWhiteboardLocalViewport(canonicalKey)) {
            window.__lmsWhiteboardViewportFitted[canonicalKey] = true;
            repaintLmsWhiteboardWorkspace(canonicalKey);
            if (typeof paintLmsWhiteboardMinimap === 'function') paintLmsWhiteboardMinimap(canonicalKey);
            return;
        }
        window.__lmsWhiteboardViewportFitted[canonicalKey] = true;
    }
    fitLmsWhiteboardZoomToContent(canonicalKey);
}

function finalizeLmsWhiteboardSectionRender(resourceKey = '', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    if (isLmsWhiteboardWorkspaceGestureActive(canonicalKey)) {
        repaintLmsWhiteboardWorkspace(canonicalKey);
        return;
    }
    repaintLmsWhiteboardWorkspace(canonicalKey);
    syncLmsWhiteboardViewportAfterRender(canonicalKey, options);
    storeLmsWhiteboardFingerprints(
        canonicalKey,
        getLmsWhiteboardLayoutFingerprint(canonicalKey),
        getLmsWhiteboardElementsFingerprint(canonicalKey),
        getLmsWhiteboardVolatileFingerprint(canonicalKey)
    );
}

function refreshLmsWhiteboardUi(resourceKey = '', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (shouldRefreshLmsPersonalWhiteboardScratch(canonicalKey)) {
        refreshLmsPersonalWhiteboardScratchUi(canonicalKey, options);
        return;
    }
    const context = resolveActiveLmsWhiteboardContext(resourceKey);
    if (!context?.resourceKey) {
        renderLmsWhiteboardSection(resourceKey, options);
        return;
    }
    const resolvedKey = context.resourceKey;
    // Never rebuild the whiteboard DOM mid-gesture: a backend/collab tick that replaces the canvas
    // node drops the captured pointer (pointercancel), which kills an in-progress draw/drag/pan at
    // ~1ms. Repaint the existing canvas instead — pointerup runs a full refresh afterwards.
    if (isLmsWhiteboardWorkspaceGestureActive(resolvedKey)) {
        repaintLmsWhiteboardWorkspace(resolvedKey);
        return;
    }
    if (options.forceStructuralRender === true) {
        renderLmsWhiteboardSection(resolvedKey, { ...options, skipLoad: true });
        return;
    }
    const layoutFingerprint = getLmsWhiteboardLayoutFingerprint(resolvedKey);
    const elementsFingerprint = getLmsWhiteboardElementsFingerprint(resolvedKey);
    const volatileFingerprint = getLmsWhiteboardVolatileFingerprint(resolvedKey);
    const previousLayout = window.__lmsWhiteboardRenderFingerprints?.[resolvedKey] || '';
    const previousElements = window.__lmsWhiteboardElementsFingerprints?.[resolvedKey] || '';
    const previousVolatile = window.__lmsWhiteboardVolatileFingerprints?.[resolvedKey] || '';
    const shell = getActiveLmsWhiteboardShell(resolvedKey);
    if (!shell || layoutFingerprint !== previousLayout) {
        if (shell && isLmsWhiteboardSessionOnlyLayoutChange(previousLayout, layoutFingerprint)) {
            updateLmsWhiteboardSessionChrome(resolvedKey);
            storeLmsWhiteboardFingerprints(
                resolvedKey,
                layoutFingerprint,
                window.__lmsWhiteboardElementsFingerprints?.[resolvedKey] || getLmsWhiteboardElementsFingerprint(resolvedKey),
                window.__lmsWhiteboardVolatileFingerprints?.[resolvedKey] || volatileFingerprint
            );
        } else {
            renderLmsWhiteboardSection(resolvedKey, { ...options, skipLoad: options.skipLoad !== false });
            return;
        }
    }
    const elementsChanged = elementsFingerprint !== previousElements;
    if (elementsChanged) {
        repaintLmsWhiteboardWorkspace(resolvedKey);
            if (!(ensureLmsWhiteboardWorkspace(resolvedKey).elements || []).length) {
            resetLmsWhiteboardViewport(resolvedKey);
        }
    }
    if (volatileFingerprint !== previousVolatile || elementsChanged) {
        updateLmsWhiteboardVolatileUi(resolvedKey);
    }
}

function renderLmsWhiteboardSection(resourceKey = '', options = {}) {
    if (!options.forceStructuralRender) {
        const gestureKey = typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(resourceKey || (typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('whiteboard') : ''))
            : String(resourceKey || '').trim();
        if (gestureKey && isLmsWhiteboardWorkspaceGestureActive(gestureKey)) {
            repaintLmsWhiteboardWorkspace(gestureKey);
            return;
        }
    }
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey || (typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('whiteboard') : currentCourseId))
        : String(resourceKey || '').trim();
    if (!canonicalKey) {
        contentArea.innerHTML = `<div class="lms-whiteboard-shell lms-live-shell">${renderLmsWhiteboardMissingCourseState()}</div>`;
        return;
    }
    if (shouldRefreshLmsPersonalWhiteboardScratch(canonicalKey)) {
        refreshLmsPersonalWhiteboardScratchUi(canonicalKey, options);
        return;
    }
    let deferPaintForLoad = false;
    if (!options.skipLoad && typeof loadLmsWhiteboardWorkspace === 'function') {
        const workspaceForLoad = ensureLmsWhiteboardWorkspace(canonicalKey);
        const expectedLoadGeneration = Number(workspaceForLoad?.ui?.loadGeneration || 0) + 1;
        const loadPromise = loadLmsWhiteboardWorkspace(canonicalKey, { render: false });
        if (loadPromise?.then) {
            deferPaintForLoad = true;
            loadPromise.then(() => {
                if (typeof isCurrentLmsWhiteboardLoadGeneration === 'function'
                    && !isCurrentLmsWhiteboardLoadGeneration(canonicalKey, expectedLoadGeneration)) return;
                if (!getLmsWhiteboardShells(canonicalKey).length) {
                    renderLmsWhiteboardSection(canonicalKey, { skipLoad: true });
                    return;
                }
                finalizeLmsWhiteboardSectionRender(canonicalKey, { fitOnce: true });
            });
        }
    }
    const workspace = typeof getLmsWhiteboardWorkspaceSafe === 'function'
        ? getLmsWhiteboardWorkspaceSafe(canonicalKey)
        : (typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(canonicalKey)
            : null) || { elements: [], sessionActive: false, editingEnabled: false, ui: {} };
    const canManage = typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(canonicalKey);
    const canEdit = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(canonicalKey);
    const disabledTools = !canEdit ? ' is-readonly' : '';
    const showWorkspace = canManage || workspace.sessionActive;

    if (!showWorkspace) {
        cleanupLmsWhiteboardShellsBeforeRender(canonicalKey);
        contentArea.innerHTML = `<div class="lms-whiteboard-shell lms-live-shell">${renderLmsWhiteboardEmptyStudent()}</div>`;
        if (typeof scheduleLmsWhiteboardSessionWaitPoll === 'function') {
            scheduleLmsWhiteboardSessionWaitPoll(canonicalKey);
        }
        return;
    }

    if (typeof stopLmsWhiteboardSessionWaitPoll === 'function') {
        stopLmsWhiteboardSessionWaitPoll(canonicalKey);
    }
    cleanupLmsWhiteboardShellsBeforeRender(canonicalKey);
    contentArea.innerHTML = `
        <div class="lms-whiteboard-shell lms-live-shell${workspace.sessionActive ? ' is-session-active' : ''}" data-lms-whiteboard-key="${escapeHtml(canonicalKey)}" data-session-active="${workspace.sessionActive ? '1' : '0'}">
            ${workspace.sessionActive && typeof renderLmsWhiteboardCollabControls === 'function' ? renderLmsWhiteboardCollabControls(workspace, canManage) : ''}
            <div data-lms-whiteboard-region="banner">${renderLmsWhiteboardBanner(workspace, canManage, canEdit)}</div>
            <section class="lms-live-layout lms-whiteboard-layout">
                <aside class="lms-whiteboard-tools${disabledTools}" aria-label="Whiteboard tools">
                    ${renderLmsWhiteboardToolRail({ variant: 'sidebar', canEdit, showLabels: true })}
                </aside>
                <div class="lms-whiteboard-main">
                    <div class="lms-live-panel lms-whiteboard-panel">
                        <div class="lms-whiteboard-panel-head">
                            <div class="lms-live-actions lms-whiteboard-stage-actions">
                                <button type="button" class="lux-secondary-btn lms-whiteboard-stage-history" data-lms-whiteboard-action="undo" ${canEdit ? '' : 'disabled'}><i class="fas fa-rotate-left"></i> Undo</button>
                                <button type="button" class="lux-secondary-btn lms-whiteboard-stage-history" data-lms-whiteboard-action="redo" ${canEdit ? '' : 'disabled'}><i class="fas fa-rotate-right"></i> Redo</button>
                                ${canManage ? '<button type="button" class="lux-secondary-btn lms-whiteboard-stage-clear" data-lms-whiteboard-action="clear-board" title="Remove all drawings from the dashboard"><i class="fas fa-trash-can"></i> Clear all</button>' : ''}
                                <button type="button" class="lux-secondary-btn" data-lms-whiteboard-action="toggle-fullscreen" title="Fullscreen"><i class="fas fa-up-right-and-down-left-from-center"></i> Fullscreen</button>
                            </div>
                        </div>
                        <div class="lms-live-stage lms-whiteboard-stage" data-lms-whiteboard-region="stage">
                            ${renderLmsWhiteboardCommandBar(canEdit, canManage)}
                            <canvas class="lms-whiteboard-canvas" aria-label="Whiteboard canvas"></canvas>
                            <div class="lms-whiteboard-minimap-shell">
                                <button type="button" class="lux-icon-btn lms-whiteboard-minimap-toggle" data-lms-whiteboard-action="toggle-minimap" title="Toggle minimap" aria-pressed="true"><i class="fas fa-map"></i></button>
                                <canvas class="lms-whiteboard-minimap" width="168" height="104" aria-label="Board minimap"></canvas>
                            </div>
                            <input type="file" class="lms-whiteboard-image-input" data-lms-whiteboard-image-input accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
                            <div class="lms-whiteboard-edit-layer" data-lms-whiteboard-edit-layer aria-hidden="true"></div>
                            <div class="lms-whiteboard-document-layer" data-lms-whiteboard-document-layer aria-hidden="true"></div>
                            <div class="lms-whiteboard-drop-overlay" data-lms-whiteboard-drop-overlay hidden aria-hidden="true">
                                <span class="lms-whiteboard-drop-overlay-copy">Drop PDF, Word, Excel, or images here</span>
                            </div>
                            <div class="lms-whiteboard-collab-hud" data-lms-whiteboard-region="collab-hud" aria-label="Collaboration">
                                ${typeof renderLmsWhiteboardCollabPill === 'function' ? renderLmsWhiteboardCollabPill(workspace, canManage, canonicalKey) : ''}
                            </div>
                            <div class="lms-whiteboard-zoom" aria-label="Zoom controls">
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="toggle-props" title="Toggle properties" aria-pressed="false"><i class="fas fa-sliders"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="toggle-grid" title="Toggle grid"><i class="fas fa-border-all"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-out" title="Zoom out"><i class="fas fa-minus"></i></button>
                                <span class="lms-whiteboard-zoom-label" data-lms-whiteboard-zoom-label title="Double-click to reset zoom">100%</span>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-in" title="Zoom in"><i class="fas fa-plus"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-fit" title="Zoom to fit content"><i class="fas fa-up-right-and-down-left-from-center"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-selection" title="Zoom to selection"><i class="fas fa-object-ungroup"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="toggle-theme" title="Toggle light/dark board theme"><i class="fas fa-circle-half-stroke"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                ${renderLmsWhiteboardPropsPanel(canEdit, canManage, canonicalKey)}
            </section>
            <div data-lms-whiteboard-region="sync-error">${renderLmsWhiteboardSyncError(workspace)}</div>
        </div>`;

    bindLmsWhiteboardSection(canonicalKey, canEdit, canManage);
    setLmsWhiteboardTool(LMS_WHITEBOARD_UI.tool || 'select');
    applyLmsWhiteboardTheme(resolveLmsWhiteboardThemeId());
                setLmsWhiteboardPropsTab(LMS_WHITEBOARD_UI.propsTab || 'draw');
    const boundShell = getActiveLmsWhiteboardShell(canonicalKey);
    if (typeof bindLmsWhiteboardCollabActions === 'function') bindLmsWhiteboardCollabActions(boundShell, canonicalKey);
    if (LMS_WHITEBOARD_UI.fullscreen) {
        boundShell?.classList.add('is-fullscreen');
        syncLmsWhiteboardFocusChrome(true);
        if (boundShell) mountLmsWhiteboardFullscreenShell(boundShell);
    }
    updateLmsWhiteboardFullscreenUi();
    syncLmsWhiteboardSessionBodyClass(workspace);
    if (!deferPaintForLoad) finalizeLmsWhiteboardSectionRender(canonicalKey);
    if (boundShell) scheduleLmsWhiteboardLayoutRecovery(boundShell, canonicalKey);
}

function renderLmsPersonalWhiteboardScratch(container, resourceKey = '') {
    if (!container) return false;
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return false;
    const canEdit = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(canonicalKey);
    const canManage = canEdit;
    const disabledTools = !canEdit ? ' is-readonly' : '';
    const clearButton = canEdit ? `
                                <button type="button" class="lux-secondary-btn lms-whiteboard-stage-clear" data-lms-whiteboard-action="clear-board" title="Clear personal board"><i class="fas fa-trash-can"></i> Clear all</button>` : '';
    container.innerHTML = `
        <div class="lms-whiteboard-shell lms-whiteboard-shell--personal lms-live-shell" data-lms-whiteboard-key="${escapeHtml(canonicalKey)}" data-session-active="1">
            <section class="lms-live-layout lms-whiteboard-layout lms-whiteboard-layout--personal">
                <aside class="lms-whiteboard-tools${disabledTools}" aria-label="Personal whiteboard tools">
                    ${renderLmsWhiteboardToolRail({ variant: 'sidebar', canEdit, showLabels: true })}
                </aside>
                <div class="lms-whiteboard-main">
                    <div class="lms-live-panel lms-whiteboard-panel">
                        <div class="lms-whiteboard-panel-head">
                            <div class="lms-live-actions lms-whiteboard-stage-actions">
                                <button type="button" class="lux-secondary-btn lms-whiteboard-stage-history" data-lms-whiteboard-action="undo" ${canEdit ? '' : 'disabled'}><i class="fas fa-rotate-left"></i> Undo</button>
                                <button type="button" class="lux-secondary-btn lms-whiteboard-stage-history" data-lms-whiteboard-action="redo" ${canEdit ? '' : 'disabled'}><i class="fas fa-rotate-right"></i> Redo</button>${clearButton}
                            </div>
                        </div>
                        <div class="lms-live-stage lms-whiteboard-stage" data-lms-whiteboard-region="stage">
                            <canvas class="lms-whiteboard-canvas" aria-label="Personal whiteboard canvas"></canvas>
                            <div class="lms-whiteboard-minimap-shell">
                                <button type="button" class="lux-icon-btn lms-whiteboard-minimap-toggle" data-lms-whiteboard-action="toggle-minimap" title="Toggle minimap" aria-pressed="true"><i class="fas fa-map"></i></button>
                                <canvas class="lms-whiteboard-minimap" width="168" height="104" aria-label="Board minimap"></canvas>
                            </div>
                            <input type="file" class="lms-whiteboard-image-input" data-lms-whiteboard-image-input accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
                            <div class="lms-whiteboard-edit-layer" data-lms-whiteboard-edit-layer aria-hidden="true"></div>
                            <div class="lms-whiteboard-document-layer" data-lms-whiteboard-document-layer aria-hidden="true"></div>
                            <div class="lms-whiteboard-drop-overlay" data-lms-whiteboard-drop-overlay hidden aria-hidden="true">
                                <span class="lms-whiteboard-drop-overlay-copy">Drop PDF, Word, Excel, or images here</span>
                            </div>
                            <div class="lms-whiteboard-zoom" aria-label="Zoom controls">
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="toggle-props" title="Toggle properties" aria-pressed="false"><i class="fas fa-sliders"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="toggle-grid" title="Toggle grid"><i class="fas fa-border-all"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-out" title="Zoom out"><i class="fas fa-minus"></i></button>
                                <span class="lms-whiteboard-zoom-label" data-lms-whiteboard-zoom-label title="Double-click to reset zoom">100%</span>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-in" title="Zoom in"><i class="fas fa-plus"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-fit" title="Zoom to fit content"><i class="fas fa-up-right-and-down-left-from-center"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="zoom-selection" title="Zoom to selection"><i class="fas fa-object-ungroup"></i></button>
                                <button type="button" class="lux-icon-btn" data-lms-whiteboard-action="toggle-theme" title="Toggle light/dark board theme"><i class="fas fa-circle-half-stroke"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                ${renderLmsWhiteboardPropsPanel(canEdit, canManage, canonicalKey)}
            </section>
        </div>`;
    bindLmsWhiteboardSection(canonicalKey, canEdit, canManage);
    setLmsWhiteboardTool(LMS_WHITEBOARD_UI.tool || 'pen');
    applyLmsWhiteboardTheme(resolveLmsWhiteboardThemeId());
    setLmsWhiteboardPropsTab(LMS_WHITEBOARD_UI.propsTab || 'draw');
    finalizeLmsWhiteboardSectionRender(canonicalKey);
    const boundShell = getActiveLmsWhiteboardShell(canonicalKey);
    if (boundShell) {
        boundShell.classList.remove('is-props-open');
        boundShell.querySelector('[data-lms-whiteboard-action="toggle-props"]')?.setAttribute('aria-pressed', 'false');
        scheduleLmsWhiteboardLayoutRecovery(boundShell, canonicalKey);
    }
    return true;
}

/* HUD + shell actions: lms-whiteboard-chrome-runtime.js */

/* Stage pointer bind helpers: lms-whiteboard-pointer-runtime.js */

function bindLmsWhiteboardSection(resourceKey = '', canEdit = false, canManage = false) {
    const boundToken = String(resourceKey || '').trim();
    const shell = getActiveLmsWhiteboardShell(resourceKey);
    if (!shell) return;
    getLmsWhiteboardShells(resourceKey).forEach((candidate) => {
        if (candidate !== shell) {
            if (candidate.dataset.lmsWhiteboardBound === boundToken) delete candidate.dataset.lmsWhiteboardBound;
            if (candidate.dataset.lmsWhiteboardZoomBound === boundToken) delete candidate.dataset.lmsWhiteboardZoomBound;
            if (candidate.dataset.lmsWhiteboardCommandBarBound === boundToken) delete candidate.dataset.lmsWhiteboardCommandBarBound;
            if (candidate.dataset.lmsWhiteboardMinimapHudBound === boundToken) delete candidate.dataset.lmsWhiteboardMinimapHudBound;
            if (candidate.dataset.lmsWhiteboardStageActionsBound === boundToken) delete candidate.dataset.lmsWhiteboardStageActionsBound;
            if (candidate.dataset.lmsWhiteboardActionsBound === boundToken) delete candidate.dataset.lmsWhiteboardActionsBound;
        }
    });
    bindLmsWhiteboardShellActions(shell, boundToken);
    const shellAlreadyBound = shell.dataset.lmsWhiteboardBound === boundToken;
    if (!shellAlreadyBound) {
        const previousKey = String(LMS_WHITEBOARD_UI.boundKey || '').trim();
        if (previousKey && previousKey !== resourceKey) {
            saveLmsWhiteboardLocalViewport(previousKey);
        }
        shell.dataset.lmsWhiteboardBound = boundToken;
        LMS_WHITEBOARD_UI.boundKey = resourceKey;
        // Restore this account's camera for personal boards before first paint/fit.
        if (loadLmsWhiteboardLocalViewport(resourceKey)) {
            window.__lmsWhiteboardViewportFitted = window.__lmsWhiteboardViewportFitted || {};
            window.__lmsWhiteboardViewportFitted[resourceKey] = true;
        }
    }

    if (!shellAlreadyBound) shell.addEventListener('click', (event) => {
        const layerButton = event.target.closest?.('[data-lms-whiteboard-layer-id]');
        if (layerButton) {
            event.preventDefault();
            event.stopPropagation();
            setLmsWhiteboardSelection([layerButton.dataset.lmsWhiteboardLayerId]);
            return;
        }
        const toolButton = event.target.closest?.('button[data-lms-whiteboard-tool]');
        if (toolButton) {
            event.preventDefault();
            event.stopPropagation();
            const { canEdit: canEditNow } = resolveLmsWhiteboardLiveEditRights(boundToken);
            if (!canEditNow && toolButton.dataset.lmsWhiteboardTool !== 'select') {
                alert('Editing is locked by instructor.');
                return;
            }
            setLmsWhiteboardTool(toolButton.dataset.lmsWhiteboardTool);
            return;
        }
    });

    if (!shellAlreadyBound) shell.addEventListener('click', (event) => {
        const propsTab = event.target.closest?.('[data-lms-whiteboard-props-tab]');
        if (!propsTab) return;
        event.preventDefault();
        setLmsWhiteboardPropsTab(propsTab.dataset.lmsWhiteboardPropsTab);
    });

    if (!shellAlreadyBound) shell.addEventListener('input', (event) => {
        const prop = event.target.closest?.('[data-lms-whiteboard-prop="fillOpacity"][data-lms-whiteboard-prop-input="fillOpacity"]');
        if (!prop || prop.disabled) return;
        if (prop.value === '') return;
        applyLmsWhiteboardFillOpacityProp(prop, resourceKey, { commit: false });
    });

    if (!shellAlreadyBound) shell.addEventListener('keydown', (event) => {
        const prop = event.target.closest?.('[data-lms-whiteboard-prop="fillOpacity"][data-lms-whiteboard-prop-input="fillOpacity"]');
        if (!prop || prop.disabled) return;
        if (event.key !== 'Enter') return;
        event.preventDefault();
        applyLmsWhiteboardFillOpacityProp(prop, resourceKey, { commit: true });
        prop.blur();
    });

    if (!shellAlreadyBound) shell.addEventListener('blur', (event) => {
        const prop = event.target.closest?.('[data-lms-whiteboard-prop="fillOpacity"][data-lms-whiteboard-prop-input="fillOpacity"]');
        if (!prop || prop.disabled) return;
        if (prop.value === '' || !Number.isFinite(Number(prop.value))) {
            syncLmsWhiteboardFillOpacityUi(LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity);
            return;
        }
        applyLmsWhiteboardFillOpacityProp(prop, resourceKey, { commit: true });
    }, true);

    if (!shellAlreadyBound) shell.addEventListener('change', (event) => {
        const toggle = event.target.closest?.('[data-lms-whiteboard-action="toggle-editing"]');
        if (toggle && typeof setLmsWhiteboardEditingEnabled === 'function') {
            setLmsWhiteboardEditingEnabled(resourceKey, toggle.checked);
        }
        const studentToggle = event.target.closest?.('[data-lms-whiteboard-action="toggle-student-control"]');
        if (studentToggle && typeof setLmsWhiteboardStudentControl === 'function') {
            setLmsWhiteboardStudentControl(resourceKey, studentToggle.dataset.studentId, studentToggle.checked);
        }
        const deleteStaffToggle = event.target.closest?.('[data-lms-whiteboard-action="toggle-student-delete-staff"]');
        if (deleteStaffToggle && typeof setLmsWhiteboardStudentDeleteStaffElements === 'function') {
            setLmsWhiteboardStudentDeleteStaffElements(resourceKey, deleteStaffToggle.dataset.studentId, deleteStaffToggle.checked);
        }
        const prop = event.target.closest?.('[data-lms-whiteboard-prop]');
        if (!prop) return;
        if (prop.dataset.lmsWhiteboardProp === 'color') {
            LMS_WHITEBOARD_UI.color = prop.value;
            document.querySelectorAll('[data-lms-whiteboard-prop="color"]').forEach(input => {
                if (input !== prop) input.value = prop.value;
                input.closest('.lms-wb-swatch')?.style?.setProperty('--swatch-color', prop.value);
            });
            applyLmsWhiteboardPropsToSelection(resourceKey);
        }
        if (prop.dataset.lmsWhiteboardProp === 'stroke') {
            LMS_WHITEBOARD_UI.strokeWidth = Number(prop.value) || 3;
            document.querySelectorAll('[data-lms-whiteboard-prop="stroke"]').forEach(input => {
                if (input !== prop) input.value = String(LMS_WHITEBOARD_UI.strokeWidth);
            });
            document.querySelectorAll('.lms-whiteboard-command-stroke-label').forEach(label => {
                label.textContent = String(LMS_WHITEBOARD_UI.strokeWidth);
            });
            document.querySelectorAll('[data-lms-whiteboard-value="stroke"]').forEach(label => {
                label.textContent = String(LMS_WHITEBOARD_UI.strokeWidth);
            });
            applyLmsWhiteboardPropsToSelection(resourceKey);
        }
        if (prop.dataset.lmsWhiteboardProp === 'fontSize') {
            const size = Math.max(10, Math.min(72, Number(prop.value) || 18));
            LMS_WHITEBOARD_UI.textDefaults.fontSize = size;
            LMS_WHITEBOARD_UI.stickyDefaults.fontSize = size;
            document.querySelectorAll('[data-lms-whiteboard-prop="fontSize"]').forEach(input => {
                if (input !== prop) input.value = String(size);
            });
            document.querySelectorAll('[data-lms-whiteboard-value="fontSize"]').forEach(label => {
                label.textContent = String(size);
            });
            applyLmsWhiteboardPropsToSelection(resourceKey);
        }
        if (prop.dataset.lmsWhiteboardProp === 'fill') {
            LMS_WHITEBOARD_UI.shapeDefaults.fill = prop.value;
            document.querySelectorAll('[data-lms-whiteboard-prop="fill"]').forEach(input => {
                if (input !== prop) input.value = prop.value;
                input.closest('.lms-wb-swatch')?.style?.setProperty('--swatch-color', prop.value);
            });
            applyLmsWhiteboardPropsToSelection(resourceKey);
        }
        if (prop.dataset.lmsWhiteboardProp === 'fillOpacity') {
            applyLmsWhiteboardFillOpacityProp(prop, resourceKey, { commit: true });
        }
        if (prop.dataset.lmsWhiteboardProp === 'gridRows') {
            LMS_WHITEBOARD_UI.gridDefaults.rows = Math.max(1, Math.min(20, Number(prop.value) || LMS_WHITEBOARD_UI.gridDefaults.rows));
            document.querySelectorAll('[data-lms-whiteboard-prop="gridRows"]').forEach(input => {
                if (input !== prop) input.value = String(LMS_WHITEBOARD_UI.gridDefaults.rows);
            });
        }
        if (prop.dataset.lmsWhiteboardProp === 'gridCols') {
            LMS_WHITEBOARD_UI.gridDefaults.cols = Math.max(1, Math.min(20, Number(prop.value) || LMS_WHITEBOARD_UI.gridDefaults.cols));
            document.querySelectorAll('[data-lms-whiteboard-prop="gridCols"]').forEach(input => {
                if (input !== prop) input.value = String(LMS_WHITEBOARD_UI.gridDefaults.cols);
            });
        }
        if (prop.dataset.lmsWhiteboardProp === 'snap') {
            LMS_WHITEBOARD_UI.snapToGrid = Boolean(prop.checked);
        }
    });

    if (!shellAlreadyBound) shell.addEventListener('click', (event) => {
        const gridPreset = event.target.closest?.('[data-lms-whiteboard-grid-preset]');
        if (!gridPreset || gridPreset.disabled) return;
        event.preventDefault();
        const [rowsRaw, colsRaw] = String(gridPreset.dataset.lmsWhiteboardGridPreset || '').split('x');
        const rows = Math.max(1, Math.min(20, Number(rowsRaw) || LMS_WHITEBOARD_UI.gridDefaults.rows));
        const cols = Math.max(1, Math.min(20, Number(colsRaw) || LMS_WHITEBOARD_UI.gridDefaults.cols));
        LMS_WHITEBOARD_UI.gridDefaults = { rows, cols };
        document.querySelectorAll('[data-lms-whiteboard-prop="gridRows"]').forEach(input => {
            input.value = String(rows);
        });
        document.querySelectorAll('[data-lms-whiteboard-prop="gridCols"]').forEach(input => {
            input.value = String(cols);
        });
    });

    if (!shellAlreadyBound) shell.addEventListener('dblclick', (event) => {
        const layerButton = event.target.closest?.('[data-lms-whiteboard-layer-id]');
        if (!layerButton) return;
        event.preventDefault();
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        const element = workspace.elements.find(item => item.id === layerButton.dataset.lmsWhiteboardLayerId);
        if (!element) return;
        const bounds = getLmsWhiteboardElementBounds(element);
        if (!bounds) return;
        const pad = 48;
        const zoomX = (LMS_WHITEBOARD_LOGICAL_WIDTH - (pad * 2)) / Math.max(bounds.w, 1);
        const zoomY = (LMS_WHITEBOARD_LOGICAL_HEIGHT - (pad * 2)) / Math.max(bounds.h, 1);
        LMS_WHITEBOARD_UI.zoom = Math.max(0.4, Math.min(2.5, Math.min(zoomX, zoomY)));
        const centerX = bounds.x + (bounds.w / 2);
        const centerY = bounds.y + (bounds.h / 2);
        LMS_WHITEBOARD_UI.panX = (LMS_WHITEBOARD_LOGICAL_WIDTH / 2) - (centerX * LMS_WHITEBOARD_UI.zoom);
        LMS_WHITEBOARD_UI.panY = (LMS_WHITEBOARD_LOGICAL_HEIGHT / 2) - (centerY * LMS_WHITEBOARD_UI.zoom);
        setLmsWhiteboardSelection([element.id]);
    });

    const canvas = shell.querySelector('.lms-whiteboard-canvas');
    const stage = shell.querySelector('[data-lms-whiteboard-region="stage"]');
    bindLmsWhiteboardHudControls(shell, boundToken, canEdit, canManage);
    bindLmsWhiteboardKeyboardShortcuts(shell, boundToken, canEdit);
    if (!canvas) return;
    if (stage) stage.dataset.lmsWhiteboardTool = LMS_WHITEBOARD_UI.tool;
    if (stage) syncLmsWhiteboardLogicalSizeFromStage(stage);
    if (!shellAlreadyBound) setupLmsWhiteboardCanvasHiDpi(canvas);
    if (!shellAlreadyBound && stage && typeof ResizeObserver === 'function' && !stage.dataset.lmsWhiteboardResizeBound) {
        stage.dataset.lmsWhiteboardResizeBound = '1';
        let resizeFrame = 0;
        const layout = shell.querySelector('.lms-whiteboard-layout');
        const onLayoutResize = () => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => {
                resyncLmsWhiteboardLayoutMetrics(shell, resourceKey);
                repositionLmsWhiteboardInlineEditor(canvas);
                if (typeof repositionLmsWhiteboardDocumentViewers === 'function') repositionLmsWhiteboardDocumentViewers(canvas);
            });
        };
        const resizeObserver = new ResizeObserver(onLayoutResize);
        resizeObserver.observe(stage);
        if (layout) resizeObserver.observe(layout);
        if (shell !== layout) resizeObserver.observe(shell);
    }
    if (stage) bindLmsWhiteboardStagePointerHandlers(stage, canvas, resourceKey, canEdit);
    const wheelTarget = stage || canvas;
    if (!shellAlreadyBound && !wheelTarget.dataset.lmsWhiteboardWheelBound) {
        wheelTarget.dataset.lmsWhiteboardWheelBound = '1';
        wheelTarget.addEventListener('wheel', (event) => {
            if (event.target.closest?.('.lms-whiteboard-zoom, [data-lms-whiteboard-command-bar], .lms-whiteboard-minimap-shell')) return;
            onLmsWhiteboardWheel(event, resourceKey, canvas);
        }, { passive: false });
    }
    if (!shellAlreadyBound && stage && !stage.dataset.lmsWhiteboardPinchBound) {
        stage.dataset.lmsWhiteboardPinchBound = '1';
        stage.addEventListener('touchstart', (event) => onLmsWhiteboardTouchStart(event, resourceKey, canvas), { passive: false });
        stage.addEventListener('touchmove', (event) => onLmsWhiteboardTouchMove(event, resourceKey, canvas), { passive: false });
        stage.addEventListener('touchend', (event) => onLmsWhiteboardTouchEnd(event), { passive: true });
        stage.addEventListener('touchcancel', (event) => onLmsWhiteboardTouchEnd(event), { passive: true });
    }
    const imageInput = shell.querySelector('[data-lms-whiteboard-image-input]');
    if (!shellAlreadyBound && imageInput && !imageInput.dataset.bound) {
        imageInput.dataset.bound = '1';
        imageInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) importLmsWhiteboardFileAtPoint(resourceKey, file);
        });
    }
    if (!shellAlreadyBound) bindLmsWhiteboardFileDrop(stage, resourceKey, canEdit, canvas);
    if (!shellAlreadyBound && !shell.dataset.lmsWhiteboardPasteBound) {
        shell.dataset.lmsWhiteboardPasteBound = '1';
        shell.addEventListener('paste', (event) => {
            if (!canEdit) return;
            const items = Array.from(event.clipboardData?.items || []);
            const imageItem = items.find(item => item.type.startsWith('image/'));
            if (!imageItem) return;
            const file = imageItem.getAsFile();
            if (file) {
                event.preventDefault();
                importLmsWhiteboardFileAtPoint(resourceKey, file);
            }
        });
    }
    if (typeof bindLmsWhiteboardMinimap === 'function') bindLmsWhiteboardMinimap(resourceKey);
    if (!shellAlreadyBound && typeof resetLmsWhiteboardHistory === 'function') resetLmsWhiteboardHistory(resourceKey);
}

/* Fullscreen / focus chrome: lms-whiteboard-chrome-runtime.js */

        const api = {
            resolveActiveLmsWhiteboardContext,
            getLmsWhiteboardLayoutFingerprint,
            getLmsWhiteboardElementsFingerprint,
            getLmsWhiteboardVolatileFingerprint,
            storeLmsWhiteboardFingerprints,
            patchLmsWhiteboardRegion,
            isLmsWhiteboardSessionOnlyLayoutChange,
            syncLmsWhiteboardSessionBodyClass,
            resyncLmsWhiteboardLayoutMetrics,
            scheduleLmsWhiteboardLayoutRecovery,
            getLmsPersonalDashboardBoardHost,
            isLmsPersonalBoardScratchMounted,
            shouldRefreshLmsPersonalWhiteboardScratch,
            refreshLmsPersonalWhiteboardScratchUi,
            getLmsWhiteboardShells,
            isLmsWhiteboardShellVisible,
            getActiveLmsWhiteboardShell,
            syncLmsWhiteboardShellBinding,
            cleanupLmsWhiteboardShellsBeforeRender,
            repaintLmsWhiteboardWorkspace,
            repaintLmsWhiteboardAfterHistoryChange,
            getLmsWhiteboardViewerId,
            isLmsPersonalWhiteboardKey,
            buildLmsWhiteboardLocalViewportStorageKey,
            saveLmsWhiteboardLocalViewport,
            loadLmsWhiteboardLocalViewport,
            resetLmsWhiteboardViewport,
            syncLmsWhiteboardViewportAfterRender,
            finalizeLmsWhiteboardSectionRender,
            refreshLmsWhiteboardUi,
            renderLmsWhiteboardSection,
            renderLmsPersonalWhiteboardScratch,
            bindLmsWhiteboardSection,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsWhiteboardSessionApi({});
})();
