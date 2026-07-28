/* Whiteboard selection toolbar/align/distribute/context-menu helpers. Peeled from lms-whiteboard-runtime.js.
 * Load before lms-whiteboard-runtime.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LMS_WHITEBOARD_SELECTION_LOADED) return;
    window.__KIU_LMS_WHITEBOARD_SELECTION_LOADED = true;

    window.__kiuCreateLmsWhiteboardSelectionApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function syncLmsWhiteboardSelectionToolbar(resourceKey = '', canEdit = false) {
    const shell = getActiveLmsWhiteboardShell(resourceKey);
    const stage = shell?.querySelector('[data-lms-whiteboard-region="stage"]');
    const canvas = shell?.querySelector('.lms-whiteboard-canvas');
    if (!stage) return;
    let toolbar = stage.querySelector('[data-lms-whiteboard-selection-toolbar]');
    const selectedIds = getLmsWhiteboardSelectedIds();
    if (!canEdit || !selectedIds.length || !canvas) {
        toolbar?.remove();
        return;
    }
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const selected = selectedIds
        .map(id => workspace.elements.find(item => item.id === id))
        .filter(Boolean);
    const bounds = getLmsWhiteboardElementsBounds(selected);
    if (!bounds) {
        toolbar?.remove();
        return;
    }
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'lms-whiteboard-selection-toolbar';
        toolbar.dataset.lmsWhiteboardSelectionToolbar = '1';
        toolbar.addEventListener('click', (event) => {
            const btn = event.target.closest?.('[data-lms-whiteboard-selection-action]');
            if (!btn) return;
            event.preventDefault();
            event.stopPropagation();
            const key = LMS_WHITEBOARD_UI.boundKey;
            const action = btn.dataset.lmsWhiteboardSelectionAction;
            if (action === 'duplicate') duplicateLmsWhiteboardSelection(key);
            else if (action === 'delete') deleteLmsWhiteboardSelection(key);
            else if (action === 'forward') reorderLmsWhiteboardElement(key, 1);
            else if (action === 'backward') reorderLmsWhiteboardElement(key, -1);
        });
        stage.appendChild(toolbar);
    }
    toolbar.innerHTML = `
        <button type="button" class="lms-whiteboard-selection-toolbar-btn" data-lms-whiteboard-selection-action="duplicate" title="Duplicate" aria-label="Duplicate"><i class="fas fa-copy"></i></button>
        <button type="button" class="lms-whiteboard-selection-toolbar-btn" data-lms-whiteboard-selection-action="delete" title="Delete" aria-label="Delete"><i class="fas fa-trash"></i></button>
        <button type="button" class="lms-whiteboard-selection-toolbar-btn" data-lms-whiteboard-selection-action="forward" title="Bring forward" aria-label="Bring forward"><i class="fas fa-arrow-up"></i></button>
        <button type="button" class="lms-whiteboard-selection-toolbar-btn" data-lms-whiteboard-selection-action="backward" title="Send backward" aria-label="Send backward"><i class="fas fa-arrow-down"></i></button>
        <label class="lms-whiteboard-selection-color" title="Color" aria-label="Color">
            <input type="color" data-lms-whiteboard-prop="color" value="${escapeHtml(LMS_WHITEBOARD_UI.color)}">
        </label>`;
    const offset = worldToStageOffset(canvas, bounds.x + (bounds.w / 2), bounds.y, 0, 0);
    const margin = 8;
    const toolbarW = toolbar.offsetWidth || 160;
    const toolbarH = toolbar.offsetHeight || 34;
    const stageW = stage.clientWidth || 0;
    const clampedLeft = Math.max(margin + (toolbarW / 2), Math.min(stageW - margin - (toolbarW / 2), offset.left));
    const clampedTop = Math.max(margin, offset.top - toolbarH - margin);
    toolbar.style.left = `${clampedLeft}px`;
    toolbar.style.top = `${clampedTop}px`;
    toolbar.style.transform = 'translateX(-50%)';
}


/* Dashboard / share / members: lms-whiteboard-chrome-runtime.js */

/* Props / banner / sync chrome: lms-whiteboard-chrome-runtime.js */

const resolveActiveLmsWhiteboardContext = window.resolveActiveLmsWhiteboardContext;
const getLmsWhiteboardLayoutFingerprint = window.getLmsWhiteboardLayoutFingerprint;
const getLmsWhiteboardElementsFingerprint = window.getLmsWhiteboardElementsFingerprint;
const getLmsWhiteboardVolatileFingerprint = window.getLmsWhiteboardVolatileFingerprint;
const storeLmsWhiteboardFingerprints = window.storeLmsWhiteboardFingerprints;
const patchLmsWhiteboardRegion = window.patchLmsWhiteboardRegion;
const isLmsWhiteboardSessionOnlyLayoutChange = window.isLmsWhiteboardSessionOnlyLayoutChange;
const syncLmsWhiteboardSessionBodyClass = window.syncLmsWhiteboardSessionBodyClass;
const resyncLmsWhiteboardLayoutMetrics = window.resyncLmsWhiteboardLayoutMetrics;
const scheduleLmsWhiteboardLayoutRecovery = window.scheduleLmsWhiteboardLayoutRecovery;
const getLmsPersonalDashboardBoardHost = window.getLmsPersonalDashboardBoardHost;
const isLmsPersonalBoardScratchMounted = window.isLmsPersonalBoardScratchMounted;
const shouldRefreshLmsPersonalWhiteboardScratch = window.shouldRefreshLmsPersonalWhiteboardScratch;
const refreshLmsPersonalWhiteboardScratchUi = window.refreshLmsPersonalWhiteboardScratchUi;
const getLmsWhiteboardShells = window.getLmsWhiteboardShells;
const isLmsWhiteboardShellVisible = window.isLmsWhiteboardShellVisible;
const getActiveLmsWhiteboardShell = window.getActiveLmsWhiteboardShell;
const syncLmsWhiteboardShellBinding = window.syncLmsWhiteboardShellBinding;
const cleanupLmsWhiteboardShellsBeforeRender = window.cleanupLmsWhiteboardShellsBeforeRender;
const repaintLmsWhiteboardWorkspace = window.repaintLmsWhiteboardWorkspace;
const repaintLmsWhiteboardAfterHistoryChange = window.repaintLmsWhiteboardAfterHistoryChange;
const getLmsWhiteboardViewerId = window.getLmsWhiteboardViewerId;
const isLmsPersonalWhiteboardKey = window.isLmsPersonalWhiteboardKey;
const buildLmsWhiteboardLocalViewportStorageKey = window.buildLmsWhiteboardLocalViewportStorageKey;
const saveLmsWhiteboardLocalViewport = window.saveLmsWhiteboardLocalViewport;
const loadLmsWhiteboardLocalViewport = window.loadLmsWhiteboardLocalViewport;
const resetLmsWhiteboardViewport = window.resetLmsWhiteboardViewport;
const syncLmsWhiteboardViewportAfterRender = window.syncLmsWhiteboardViewportAfterRender;
const finalizeLmsWhiteboardSectionRender = window.finalizeLmsWhiteboardSectionRender;
const refreshLmsWhiteboardUi = window.refreshLmsWhiteboardUi;
const renderLmsWhiteboardSection = window.renderLmsWhiteboardSection;
const renderLmsPersonalWhiteboardScratch = window.renderLmsPersonalWhiteboardScratch;
const bindLmsWhiteboardSection = window.bindLmsWhiteboardSection;

/* Props tab + more menu: lms-whiteboard-chrome-runtime.js */

/* Layers chrome UI: lms-whiteboard-chrome-runtime.js */

function alignLmsWhiteboardSelection(resourceKey = '', mode = 'left') {
    if (typeof canManageLmsWhiteboard === 'function' && !canManageLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const selected = getLmsWhiteboardSelectedIds()
        .map(id => workspace.elements.find(element => element.id === id))
        .filter(element => element && !element.parentDocumentId);
    if (selected.length < 2) return;
    const bounds = getLmsWhiteboardElementsBounds(selected);
    if (!bounds) return;
    recordLmsWhiteboardHistoryGesture(resourceKey);
    selected.forEach(element => {
        const itemBounds = getLmsWhiteboardElementBounds(element);
        if (!itemBounds) return;
        let dx = 0;
        let dy = 0;
        if (mode === 'left') dx = bounds.x - itemBounds.x;
        else if (mode === 'right') dx = (bounds.x + bounds.w) - (itemBounds.x + itemBounds.w);
        else if (mode === 'center-h') dx = (bounds.x + (bounds.w / 2)) - (itemBounds.x + (itemBounds.w / 2));
        else if (mode === 'top') dy = bounds.y - itemBounds.y;
        else if (mode === 'bottom') dy = (bounds.y + bounds.h) - (itemBounds.y + itemBounds.h);
        else if (mode === 'center-v') dy = (bounds.y + (bounds.h / 2)) - (itemBounds.y + (itemBounds.h / 2));
        if (isLmsWhiteboardShapeLineElement(element)) {
            element.x = (element.x || 0) + dx;
            element.y = (element.y || 0) + dy;
            element.x2 = (element.x2 || 0) + dx;
            element.y2 = (element.y2 || 0) + dy;
            return;
        }
        element.x = (element.x || 0) + dx;
        element.y = (element.y || 0) + dy;
    });
    commitLmsWhiteboardEdit(resourceKey, 'align-selection', { forceFullSync: true });
    paintLmsWhiteboardCanvas(resourceKey);
}

function distributeLmsWhiteboardSelection(resourceKey = '', axis = 'h') {
    if (typeof canManageLmsWhiteboard === 'function' && !canManageLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const selected = getLmsWhiteboardSelectedIds()
        .map(id => workspace.elements.find(element => element.id === id))
        .filter(element => element && !element.parentDocumentId)
        .map(element => ({ element, bounds: getLmsWhiteboardElementBounds(element) }))
        .filter(item => item.bounds);
    if (selected.length < 3) return;
    recordLmsWhiteboardHistoryGesture(resourceKey);
    if (axis === 'h') {
        selected.sort((a, b) => a.bounds.x - b.bounds.x);
        const minX = selected[0].bounds.x;
        const maxX = selected[selected.length - 1].bounds.x + selected[selected.length - 1].bounds.w;
        const gap = (maxX - minX - selected.reduce((sum, item) => sum + item.bounds.w, 0)) / (selected.length - 1);
        let cursor = minX;
        selected.forEach((item, index) => {
            if (index === 0) { cursor += item.bounds.w + gap; return; }
            item.element.x += cursor - item.bounds.x;
            cursor += item.bounds.w + gap;
        });
    } else {
        selected.sort((a, b) => a.bounds.y - b.bounds.y);
        const minY = selected[0].bounds.y;
        const maxY = selected[selected.length - 1].bounds.y + selected[selected.length - 1].bounds.h;
        const gap = (maxY - minY - selected.reduce((sum, item) => sum + item.bounds.h, 0)) / (selected.length - 1);
        let cursor = minY;
        selected.forEach((item, index) => {
            if (index === 0) { cursor += item.bounds.h + gap; return; }
            item.element.y += cursor - item.bounds.y;
            cursor += item.bounds.h + gap;
        });
    }
    commitLmsWhiteboardEdit(resourceKey, 'distribute-selection', { forceFullSync: true });
    paintLmsWhiteboardCanvas(resourceKey);
}

function closeLmsWhiteboardContextMenu() {
    document.querySelector('[data-lms-whiteboard-context-menu]')?.remove();
}

function showLmsWhiteboardContextMenu(event, resourceKey = '', canEdit = false, canManage = false) {
    event.preventDefault();
    closeLmsWhiteboardContextMenu();
    const point = canvasToWorld(event.target, event.clientX, event.clientY);
    const hit = findLmsWhiteboardElementAtPoint(resourceKey, point);
    const selectedIds = getLmsWhiteboardSelectedIds();
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const items = [];
    if (selectedIds.length > 1 && canManage) {
        items.push(
            { action: 'align-left', label: 'Align left' },
            { action: 'align-center-h', label: 'Align center' },
            { action: 'align-right', label: 'Align right' },
            { action: 'distribute-h', label: 'Distribute horizontally' },
            { action: 'distribute-v', label: 'Distribute vertically' }
        );
    }
    if (selectedIds.length && canEdit) {
        items.push(
            { action: 'duplicate', label: 'Duplicate' },
            { action: 'delete', label: 'Delete' }
        );
    }
    if (!items.length) {
        items.push({ action: 'add-sticky-here', label: 'Add sticky' });
    }
    const menu = document.createElement('div');
    menu.className = 'lms-whiteboard-context-menu';
    menu.dataset.lmsWhiteboardContextMenu = '1';
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.innerHTML = items.map(item => `
        <button type="button" class="lms-whiteboard-context-menu-item" data-lms-whiteboard-context-action="${escapeHtml(item.action)}">${escapeHtml(item.label)}</button>`).join('');
    menu.addEventListener('click', (clickEvent) => {
        const btn = clickEvent.target.closest?.('[data-lms-whiteboard-context-action]');
        if (!btn) return;
        const action = btn.dataset.lmsWhiteboardContextAction;
        if (action === 'align-left') alignLmsWhiteboardSelection(resourceKey, 'left');
        else if (action === 'align-center-h') alignLmsWhiteboardSelection(resourceKey, 'center-h');
        else if (action === 'align-right') alignLmsWhiteboardSelection(resourceKey, 'right');
        else if (action === 'distribute-h') distributeLmsWhiteboardSelection(resourceKey, 'h');
        else if (action === 'distribute-v') distributeLmsWhiteboardSelection(resourceKey, 'v');
        else if (action === 'duplicate') duplicateLmsWhiteboardSelection(resourceKey);
        else if (action === 'delete') deleteLmsWhiteboardSelection(resourceKey);
        else if (action === 'add-sticky-here' && canEdit) {
            recordLmsWhiteboardHistoryGesture(resourceKey);
            workspace.elements.push({
                type: 'sticky', id: makeLmsWhiteboardId('sticky'), x: point.x, y: point.y,
                w: LMS_WHITEBOARD_UI.stickyDefaults.w, h: LMS_WHITEBOARD_UI.stickyDefaults.h,
                text: '', color: LMS_WHITEBOARD_UI.stickyDefaults.color,
                fontSize: LMS_WHITEBOARD_UI.stickyDefaults.fontSize, authorId: getLmsWhiteboardActorId()
            });
            commitLmsWhiteboardEdit(resourceKey, 'context-sticky');
            paintLmsWhiteboardCanvas(resourceKey);
        }
        closeLmsWhiteboardContextMenu();
    });
    document.body.appendChild(menu);
    const closeOnPointer = () => { closeLmsWhiteboardContextMenu(); window.removeEventListener('pointerdown', closeOnPointer, true); };
    window.addEventListener('pointerdown', closeOnPointer, true);
}

        const api = {
            syncLmsWhiteboardSelectionToolbar,
            alignLmsWhiteboardSelection,
            distributeLmsWhiteboardSelection,
            showLmsWhiteboardContextMenu,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsWhiteboardSelectionApi({});
})();

