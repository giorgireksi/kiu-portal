/* LMS whiteboard UI + canvas runtime. */

let LMS_WHITEBOARD_LOGICAL_WIDTH = 1200;
let LMS_WHITEBOARD_LOGICAL_HEIGHT = 700;
const LMS_WHITEBOARD_LOGICAL_MIN_WIDTH = 400;
const LMS_WHITEBOARD_LOGICAL_MIN_HEIGHT = 280;
const LMS_WHITEBOARD_GRID_STEP = 24;
const LMS_WHITEBOARD_RESIZABLE_TYPES = ['sticky', 'text', 'image', 'document', 'rect', 'ellipse', 'grid'];
const LMS_WHITEBOARD_SHAPE_BOX_TYPES = ['rect', 'ellipse', 'grid'];
const LMS_WHITEBOARD_SHAPE_LINE_TYPES = ['line', 'arrow'];
const LMS_WHITEBOARD_SHAPE_DRAW_TOOLS = ['rect', 'roundRect', 'ellipse', 'line', 'arrow', 'grid'];
const LMS_WHITEBOARD_BLOCKED_TOOLS = ['triangle', 'diamond', 'frame'];
const LMS_WHITEBOARD_IMAGE_CACHE = {};
const LMS_WHITEBOARD_IMAGE_MAX_BYTES = 500000;
const LMS_WHITEBOARD_MARQUEE_MIN_DRAG_PX = 4;
const LMS_WHITEBOARD_SHAPE_MIN_DRAG_PX = 24;
const LMS_WHITEBOARD_CLEAR_CONFIRM = 'Remove all drawings from the dashboard? This cannot be undone.';

const LMS_WHITEBOARD_UI = {
    tool: 'select',
    color: '#f4d06f',
    strokeWidth: 3,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    snapToGrid: false,
    boundKey: '',
    drawing: false,
    drawTool: '',
    panning: false,
    currentStroke: null,
    selectedId: '',
    selectedIds: [],
    dragStart: null,
    lastPointer: null,
    fullscreen: false,
    inlineEdit: null,
    pinch: null,
    eraserOps: [],
    historyGestureRecorded: false,
    propsTab: 'draw',
    textDefaults: { fontSize: 18, w: 240, h: 72, color: '#f8fafc' },
    stickyDefaults: { w: 160, h: 120, fontSize: 14, color: '#fff3b0' },
    shapeDefaults: { fill: '#f4d06f', fillOpacity: 0.35 },
    gridDefaults: { rows: 3, cols: 3 },
    aspectLock: false,
    gestureWindowListeners: null,
    lastGesturePointerUpId: null,
};
window.LMS_WHITEBOARD_UI = LMS_WHITEBOARD_UI;
/* Pointer/wheel/touch pipeline: lms-whiteboard-pointer-runtime.js (before this file). */
/* Canvas paint/draw pipeline: lms-whiteboard-paint-runtime.js (before this file). */
/* Pure geometry/color/text helpers: lms-whiteboard-model.js (loaded first). */
const LMS_WHITEBOARD_TEXT_PADDING_X = window.LMS_WHITEBOARD_TEXT_PADDING_X || 8;
const LMS_WHITEBOARD_TEXT_PADDING_Y = window.LMS_WHITEBOARD_TEXT_PADDING_Y || 8;
const LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR = window.LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR || 1.35;


function isLmsWhiteboardBoardGestureActive() {
    return Boolean(LMS_WHITEBOARD_UI.drawing || LMS_WHITEBOARD_UI.panning || LMS_WHITEBOARD_UI.dragStart);
}


function setLmsWhiteboardGestureState(resourceKey = '', active = false) {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    if (workspace?.ui) workspace.ui.inGesture = Boolean(active);
}

function getLmsWhiteboardActiveDrawTool() {
    return LMS_WHITEBOARD_UI.drawing
        ? (LMS_WHITEBOARD_UI.drawTool || LMS_WHITEBOARD_UI.tool)
        : LMS_WHITEBOARD_UI.tool;
}

function resolveLmsWhiteboardLiveDraftElement(resourceKey = '') {
    const draft = LMS_WHITEBOARD_UI.currentStroke;
    if (!draft?.id) return draft;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    return workspace.elements.find(item => item.id === draft.id) || draft;
}

function detachLmsWhiteboardGestureWindowListeners() {
    const listeners = LMS_WHITEBOARD_UI.gestureWindowListeners;
    if (!listeners) return;
    if (listeners.onUp) window.removeEventListener('pointerup', listeners.onUp);
    if (listeners.onCancel) window.removeEventListener('pointercancel', listeners.onCancel);
    LMS_WHITEBOARD_UI.gestureWindowListeners = null;
}

function cancelLmsWhiteboardActiveDraw(resourceKey = '', canvas = null) {
    if (!LMS_WHITEBOARD_UI.drawing) return;
    const draftId = LMS_WHITEBOARD_UI.currentStroke?.id;
    LMS_WHITEBOARD_UI.drawing = false;
    LMS_WHITEBOARD_UI.currentStroke = null;
    LMS_WHITEBOARD_UI.drawTool = '';
    LMS_WHITEBOARD_UI.eraserOps = [];
    detachLmsWhiteboardGestureWindowListeners();
    setLmsWhiteboardGestureState(resourceKey, false);
    if (draftId) {
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        workspace.elements = (workspace.elements || []).filter(item => item.id !== draftId);
    }
    paintLmsWhiteboardCanvas(resourceKey, canvas);
}

function attachLmsWhiteboardGestureWindowListeners(resourceKey = '', canEdit = false, canvas = null, pointerId = null) {
    detachLmsWhiteboardGestureWindowListeners();
    if (pointerId == null || !canvas) return;
    const onUp = (event) => {
        if (event.pointerId !== pointerId) return;
        onLmsWhiteboardPointerUp(event, resourceKey, canEdit, canvas, canvas);
    };
    const onCancel = (event) => {
        if (event.pointerId !== pointerId) return;
        cancelLmsWhiteboardActiveDraw(resourceKey, canvas);
    };
    LMS_WHITEBOARD_UI.gestureWindowListeners = { onUp, onCancel, pointerId };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
}

function beginLmsWhiteboardCanvasGesture(resourceKey = '', event = null, canEdit = false, canvas = null) {
    setLmsWhiteboardGestureState(resourceKey, true);
    if (event?.pointerId != null) {
        attachLmsWhiteboardGestureWindowListeners(resourceKey, canEdit, canvas, event.pointerId);
    }
}

function markLmsWhiteboardDraftDirty(workspace = null) {
    if (workspace?.ui) workspace.ui.dirty = true;
}

function isLmsWhiteboardWorkspaceGestureActive(resourceKey = '') {
    if (isLmsWhiteboardBoardGestureActive()) return true;
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return false;
    return Boolean(ensureLmsWhiteboardWorkspace(canonicalKey)?.ui?.inGesture);
}

function syncLmsWhiteboardElementDefaults(element = {}) {
    if (!element?.type) return;
    if (element.type === 'text') {
        LMS_WHITEBOARD_UI.textDefaults = {
            fontSize: Number(element.fontSize) || LMS_WHITEBOARD_UI.textDefaults.fontSize,
            w: Math.max(80, Number(element.w) || LMS_WHITEBOARD_UI.textDefaults.w),
            h: Math.max(24, Number(element.h) || LMS_WHITEBOARD_UI.textDefaults.h),
            color: element.color || LMS_WHITEBOARD_UI.textDefaults.color
        };
        LMS_WHITEBOARD_UI.color = LMS_WHITEBOARD_UI.textDefaults.color;
    }
    if (element.type === 'sticky') {
        LMS_WHITEBOARD_UI.stickyDefaults = {
            w: Math.max(80, Number(element.w) || LMS_WHITEBOARD_UI.stickyDefaults.w),
            h: Math.max(80, Number(element.h) || LMS_WHITEBOARD_UI.stickyDefaults.h),
            fontSize: Number(element.fontSize) || LMS_WHITEBOARD_UI.stickyDefaults.fontSize,
            color: element.color || LMS_WHITEBOARD_UI.stickyDefaults.color
        };
        LMS_WHITEBOARD_UI.color = LMS_WHITEBOARD_UI.stickyDefaults.color;
    }
    if (isLmsWhiteboardShapeBoxElement(element)) {
        LMS_WHITEBOARD_UI.shapeDefaults = {
            fill: element.fill || LMS_WHITEBOARD_UI.shapeDefaults.fill,
            fillOpacity: Number.isFinite(Number(element.fillOpacity))
                ? Number(element.fillOpacity)
                : LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity
        };
        LMS_WHITEBOARD_UI.color = element.color || LMS_WHITEBOARD_UI.color;
        if (element.type === 'grid') {
            LMS_WHITEBOARD_UI.gridDefaults = {
                rows: Math.max(1, Math.min(20, Number(element.rows) || LMS_WHITEBOARD_UI.gridDefaults.rows)),
                cols: Math.max(1, Math.min(20, Number(element.cols) || LMS_WHITEBOARD_UI.gridDefaults.cols))
            };
        }
    }
    if (isLmsWhiteboardShapeLineElement(element)) {
        LMS_WHITEBOARD_UI.color = element.color || LMS_WHITEBOARD_UI.color;
    }
    if (isLmsWhiteboardShapeBoxElement(element)) {
        syncLmsWhiteboardFillOpacityUi(LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity);
    }
}


function syncLmsWhiteboardFillOpacityUi(opacity = 0) {
    const percent = clampLmsWhiteboardFillOpacityPercent(Number(opacity) * 100);
    document.querySelectorAll('[data-lms-whiteboard-prop="fillOpacity"]').forEach(input => {
        input.value = String(percent);
    });
}

function previewLmsWhiteboardFillOpacity(resourceKey = '') {
    if (!LMS_WHITEBOARD_UI.selectedId || !resourceKey) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const element = workspace.elements.find(item => item.id === LMS_WHITEBOARD_UI.selectedId);
    if (!element || !isLmsWhiteboardShapeBoxElement(element)) return;
    element.fillOpacity = LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity;
    paintLmsWhiteboardCanvas(resourceKey);
}

function applyLmsWhiteboardFillOpacityProp(prop, resourceKey = '', options = {}) {
    const percent = clampLmsWhiteboardFillOpacityPercent(prop?.value);
    LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity = percent / 100;
    syncLmsWhiteboardFillOpacityUi(LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity);
    if (prop) prop.value = String(percent);
    if (options.commit === false) {
        previewLmsWhiteboardFillOpacity(resourceKey);
        return;
    }
    applyLmsWhiteboardPropsToSelection(resourceKey);
}

function getLmsWhiteboardSelectedIds() {
    if (Array.isArray(LMS_WHITEBOARD_UI.selectedIds) && LMS_WHITEBOARD_UI.selectedIds.length) {
        return LMS_WHITEBOARD_UI.selectedIds.map(String);
    }
    return LMS_WHITEBOARD_UI.selectedId ? [String(LMS_WHITEBOARD_UI.selectedId)] : [];
}

function setLmsWhiteboardSelection(ids = [], options = {}) {
    let next = Array.isArray(ids) ? ids.map(id => String(id || '').trim()).filter(Boolean) : [];
    if (options.additive && next.length) {
        next = [...new Set([...getLmsWhiteboardSelectedIds(), ...next])];
    }
    LMS_WHITEBOARD_UI.selectedIds = next;
    LMS_WHITEBOARD_UI.selectedId = next[0] || '';
    updateLmsWhiteboardSelectionCountUi();
    if (!options.skipPaint) paintLmsWhiteboardCanvas(LMS_WHITEBOARD_UI.boundKey);
    if (typeof syncLmsWhiteboardDocumentSelectionChrome === 'function') {
        syncLmsWhiteboardDocumentSelectionChrome();
    }
}

function recordLmsWhiteboardHistoryGesture(resourceKey = '') {
    if (LMS_WHITEBOARD_UI.historyGestureRecorded) return;
    if (typeof pushLmsWhiteboardHistoryState === 'function') {
        pushLmsWhiteboardHistoryState(resourceKey, { force: true });
    }
    LMS_WHITEBOARD_UI.historyGestureRecorded = true;
}

function commitLmsWhiteboardEdit(resourceKey = '', reason = 'whiteboard', options = {}) {
    if (!options.skipHistory && !LMS_WHITEBOARD_UI.historyGestureRecorded && typeof pushLmsWhiteboardHistoryState === 'function') {
        pushLmsWhiteboardHistoryState(resourceKey);
    }
    saveLmsWhiteboardChange(resourceKey, reason, options);
    LMS_WHITEBOARD_UI.historyGestureRecorded = false;
}

function getLmsWhiteboardSectionLabel() {
    const section = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : (typeof normalizeLmsSectionType === 'function' ? normalizeLmsSectionType(currentLmsSectionType) : 'lecture');
    return section === 'workshop' ? 'Workshop' : 'Lecture';
}

function makeLmsWhiteboardId(prefix = 'wb') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getLmsWhiteboardActorId() {
    return typeof getCurrentUserId === 'function' ? String(getCurrentUserId() || '').trim() : '';
}
function getLmsWhiteboardViewportCenterWorld() {
    return {
        x: (-LMS_WHITEBOARD_UI.panX + (LMS_WHITEBOARD_LOGICAL_WIDTH / 2)) / LMS_WHITEBOARD_UI.zoom,
        y: (-LMS_WHITEBOARD_UI.panY + (LMS_WHITEBOARD_LOGICAL_HEIGHT / 2)) / LMS_WHITEBOARD_UI.zoom
    };
}

function getLmsWhiteboardVisibleWorldBounds() {
    const zoom = Math.max(LMS_WHITEBOARD_UI.zoom, 0.4);
    return {
        x: -LMS_WHITEBOARD_UI.panX / zoom,
        y: -LMS_WHITEBOARD_UI.panY / zoom,
        w: LMS_WHITEBOARD_LOGICAL_WIDTH / zoom,
        h: LMS_WHITEBOARD_LOGICAL_HEIGHT / zoom
    };
}

function resolveLmsWhiteboardStageMeasureRect(stage) {
    if (!stage) return { width: 0, height: 0 };
    const layout = stage.closest('.lms-whiteboard-layout');
    const panel = stage.closest('.lms-whiteboard-panel');
    const canvas = stage.querySelector('.lms-whiteboard-canvas');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    const layoutH = layout?.clientHeight || 0;
    const panelH = panel?.clientHeight || 0;
    let width = Math.round(Math.max(stageRect.width, canvasRect?.width || 0, layout?.clientWidth || 0));
    let height = Math.round(Math.max(stageRect.height, canvasRect?.height || 0));
    if (height < 320 && layoutH > height) height = Math.round(layoutH);
    if (height < 320 && panelH > height) height = Math.round(panelH);
    return { width, height };
}

function syncLmsWhiteboardLogicalSizeFromStage(stage = null) {
    const target = stage || document.querySelector('[data-lms-whiteboard-region="stage"]');
    if (!target) return false;
    const { width, height } = resolveLmsWhiteboardStageMeasureRect(target);
    const nextW = Math.max(LMS_WHITEBOARD_LOGICAL_MIN_WIDTH, width);
    const nextH = Math.max(LMS_WHITEBOARD_LOGICAL_MIN_HEIGHT, height);
    if (nextW === LMS_WHITEBOARD_LOGICAL_WIDTH && nextH === LMS_WHITEBOARD_LOGICAL_HEIGHT) return false;
    const oldW = LMS_WHITEBOARD_LOGICAL_WIDTH;
    const oldH = LMS_WHITEBOARD_LOGICAL_HEIGHT;
    const zoom = Math.max(LMS_WHITEBOARD_UI.zoom, 0.4);
    const centerWorldX = (-LMS_WHITEBOARD_UI.panX + (oldW / 2)) / zoom;
    const centerWorldY = (-LMS_WHITEBOARD_UI.panY + (oldH / 2)) / zoom;
    LMS_WHITEBOARD_LOGICAL_WIDTH = nextW;
    LMS_WHITEBOARD_LOGICAL_HEIGHT = nextH;
    LMS_WHITEBOARD_UI.panX = (nextW / 2) - (centerWorldX * zoom);
    LMS_WHITEBOARD_UI.panY = (nextH / 2) - (centerWorldY * zoom);
    return true;
}

function computeLmsWhiteboardImportBox(options = {}) {
    const visible = getLmsWhiteboardVisibleWorldBounds();
    const margin = Number(options.margin) || 0.10;
    const fill = Number(options.fill) || 0.55;
    const maxW = visible.w * (1 - (margin * 2));
    const maxH = visible.h * (1 - (margin * 2));
    let w = maxW * fill;
    let h = maxH * fill;
    const aspect = Math.max(0.2, Number(options.aspectRatio) || (4 / 3));
    if (w / h > aspect) w = h * aspect;
    else h = w / aspect;
    w = Math.max(120, Math.round(w));
    h = Math.max(120, Math.round(h));
    const center = options.point || getLmsWhiteboardViewportCenterWorld();
    const snapped = typeof snapLmsWhiteboardPoint === 'function'
        ? snapLmsWhiteboardPoint(center)
        : center;
    return {
        x: Math.round(snapped.x - (w / 2)),
        y: Math.round(snapped.y - (h / 2)),
        w,
        h
    };
}

function getLmsWhiteboardElementsBounds(elements = []) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    elements.forEach(element => {
        const bounds = getLmsWhiteboardElementBounds(element);
        if (!bounds) return;
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.w);
        maxY = Math.max(maxY, bounds.y + bounds.h);
    });
    if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
function duplicateLmsWhiteboardSelection(resourceKey = '', offset = 16) {
    if (!canEditLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const selectedIds = getLmsWhiteboardSelectedIds();
    if (!selectedIds.length) return;
    const clones = [];
    const idMap = new Map();
    selectedIds.forEach(oldId => {
        const source = workspace.elements.find(element => element.id === oldId);
        if (!source) return;
        const next = JSON.parse(JSON.stringify(source));
        next.id = makeLmsWhiteboardId(source.type || 'wb');
        delete next.templateInstanceId;
        delete next.templateId;
        delete next.templateRole;
        delete next.templateSlot;
        delete next.templateOptions;
        next.x = (next.x || 0) + offset;
        next.y = (next.y || 0) + offset;
        if (typeof next.x2 === 'number') next.x2 += offset;
        if (typeof next.y2 === 'number') next.y2 += offset;
        if (Array.isArray(next.points)) {
            next.points = next.points.map(([px, py]) => [px + offset, py + offset]);
        }
        idMap.set(oldId, next.id);
        clones.push(next);
    });
    if (!clones.length) return;
    clones.forEach(element => workspace.elements.push(element));
    if (typeof pushLmsWhiteboardHistoryState === 'function') {
        pushLmsWhiteboardHistoryState(resourceKey, { force: true });
    }
    commitLmsWhiteboardEdit(resourceKey, 'duplicate-selection', { forceFullSync: true });
    setLmsWhiteboardSelection(clones.map(element => element.id), { skipPaint: true });
    paintLmsWhiteboardCanvas(resourceKey);
}
const LMS_WHITEBOARD_THEME_PRESETS = {
    dark: {
        canvasBg: 'rgba(8, 12, 22, 0.92)',
        gridDot: 'rgba(255, 255, 255, 0.07)',
        gridDotMajor: 'rgba(244, 208, 111, 0.14)',
        accent: '#f4d06f',
        viewport: 'rgba(96, 165, 250, 0.95)',
        minimapElement: 'rgba(244, 208, 111, 0.55)',
        selection: 'rgba(244, 208, 111, 0.92)'
    },
    light: {
        canvasBg: 'rgba(248, 250, 252, 0.98)',
        gridDot: 'rgba(15, 23, 42, 0.08)',
        gridDotMajor: 'rgba(244, 208, 111, 0.28)',
        accent: '#d4a017',
        viewport: 'rgba(37, 99, 235, 0.85)',
        minimapElement: 'rgba(212, 160, 23, 0.65)',
        selection: 'rgba(212, 160, 23, 0.92)'
    }
};

const LMS_WHITEBOARD_THEME = { ...LMS_WHITEBOARD_THEME_PRESETS.dark };

/* Theme + tool rail + command bar: lms-whiteboard-chrome-runtime.js */


function resolveLmsWhiteboardShapeFillOpacity(element = {}) {
    const parsed = Number(element.fillOpacity);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(1, parsed));
    return LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity;
}

function resolveLmsWhiteboardShapeStrokeWidth(element = {}, w = 0, h = 0) {
    const base = Math.max(1, Number(element.width) || LMS_WHITEBOARD_UI.strokeWidth);
    if (!w || !h) return base;
    return Math.min(base, Math.max(1, Math.min(w, h) * 0.12));
}


function isLmsWhiteboardKeyboardTargetEditable(target = null) {
    if (!target || typeof target.closest !== 'function') return false;
    if (target.isContentEditable) return true;
    const tag = String(target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target.closest('[data-lms-whiteboard-inline-editor]'));
}

function isLmsWhiteboardKeyboardScopeActive(shell = null, resourceKey = '') {
    if (!shell?.isConnected || !isLmsWhiteboardShellVisible(shell)) return false;
    const shellKey = String(shell.dataset.lmsWhiteboardKey || '').trim();
    const activeKey = String(LMS_WHITEBOARD_UI.boundKey || resourceKey || '').trim();
    if (!shellKey || !activeKey || shellKey !== activeKey) return false;
    if (LMS_WHITEBOARD_UI.fullscreen) return true;
    const contentArea = document.getElementById('lms-content-area');
    return Boolean(contentArea?.classList.contains('lms-tab-whiteboard'));
}

function focusLmsWhiteboardKeyboardTarget(shell = null) {
    const stage = shell?.querySelector?.('[data-lms-whiteboard-region="stage"]');
    if (!stage || typeof stage.focus !== 'function') return;
    if (typeof stage.tabIndex !== 'number' || stage.tabIndex < 0) stage.tabIndex = -1;
    try { stage.focus({ preventScroll: true }); } catch (_) { stage.focus(); }
}

function handleLmsWhiteboardKeyboardShortcut(event, shell = null, resourceKey = '', canEdit = false) {
    if (!canEdit || !resourceKey || !shell) return false;
    if (!isLmsWhiteboardKeyboardScopeActive(shell, resourceKey)) return false;
    if (isLmsWhiteboardKeyboardTargetEditable(event.target)) return false;
    if (LMS_WHITEBOARD_UI.inlineEdit?.elementId) return false;
    const key = String(event.key || '');
    if (key !== 'Delete' && key !== 'Backspace') return false;
    const selectedIds = getLmsWhiteboardSelectedIds();
    if (!selectedIds.length) return false;
    event.preventDefault();
    event.stopPropagation();
    recordLmsWhiteboardHistoryGesture(resourceKey);
    deleteLmsWhiteboardSelection(resourceKey);
    return true;
}

function bindLmsWhiteboardKeyboardShortcuts(shell, resourceKey = '', canEdit = false) {
    if (!shell) return;
    const boundToken = String(resourceKey || '').trim();
    if (shell.dataset.lmsWhiteboardKeyboardBound === boundToken) return;
    shell.dataset.lmsWhiteboardKeyboardBound = boundToken;
    const stage = shell.querySelector('[data-lms-whiteboard-region="stage"]');
    if (stage && (typeof stage.tabIndex !== 'number' || stage.tabIndex < 0)) stage.tabIndex = -1;
    const onKeyDown = (event) => {
        if (!shell.isConnected) {
            window.removeEventListener('keydown', onKeyDown, true);
            stage?.removeEventListener('keydown', onKeyDown, true);
            return;
        }
        const canEditNow = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(boundToken);
        handleLmsWhiteboardKeyboardShortcut(event, shell, boundToken, canEditNow);
    };
    window.addEventListener('keydown', onKeyDown, true);
    stage?.addEventListener('keydown', onKeyDown, true);
}

function deleteLmsWhiteboardSelection(resourceKey = '') {
    const selectedIds = getLmsWhiteboardSelectedIds();
    if (!resourceKey || !selectedIds.length) return;
    if (typeof canEditLmsWhiteboard === 'function' && !canEditLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const removedIds = selectedIds.slice();
    const removeSet = new Set(removedIds);
    workspace.elements = workspace.elements.filter(item => !removeSet.has(item.id));
    setLmsWhiteboardSelection([], { skipPaint: true });
    const ops = removedIds.map(elementId => ({ type: 'remove', elementId }));
    commitLmsWhiteboardEdit(resourceKey, 'delete-element', { ops, forceFullSync: true });
    paintLmsWhiteboardCanvas(resourceKey);
}

function syncLmsWhiteboardPropsFromSelection(element) {
    if (!element) return;
    syncLmsWhiteboardElementDefaults(element);
}

function applyLmsWhiteboardPropsToSelection(resourceKey = '') {
    if (!LMS_WHITEBOARD_UI.selectedId || !resourceKey) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const element = workspace.elements.find(item => item.id === LMS_WHITEBOARD_UI.selectedId);
    if (!element) return;
    element.color = LMS_WHITEBOARD_UI.color;
    if ('width' in element || element.type === 'stroke' || isLmsWhiteboardShapeLineElement(element) || isLmsWhiteboardShapeBoxElement(element)) {
        element.width = LMS_WHITEBOARD_UI.strokeWidth;
    }
    if (isLmsWhiteboardShapeBoxElement(element)) {
        element.fill = LMS_WHITEBOARD_UI.shapeDefaults.fill;
        element.fillOpacity = LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity;
    }
    if (element.type === 'text') {
        element.fontSize = LMS_WHITEBOARD_UI.textDefaults.fontSize;
        syncLmsWhiteboardTextHeight(element);
    }
    if (element.type === 'sticky') element.fontSize = LMS_WHITEBOARD_UI.stickyDefaults.fontSize;
    syncLmsWhiteboardElementDefaults(element);
    commitLmsWhiteboardEdit(resourceKey, 'update-selection-props', { op: { element } });
    paintLmsWhiteboardCanvas(resourceKey);
}


function toggleLmsWhiteboardGrid(resourceKey = '') {
    LMS_WHITEBOARD_UI.showGrid = !LMS_WHITEBOARD_UI.showGrid;
    paintLmsWhiteboardCanvas(resourceKey || LMS_WHITEBOARD_UI.boundKey);
}


function syncLmsWhiteboardTextHeight(element = {}) {
    if (!element || element.type !== 'text') return;
    const layout = layoutLmsWhiteboardText({
        text: element.text || '',
        fontSize: Number(element.fontSize) || LMS_WHITEBOARD_UI.textDefaults.fontSize,
        width: element.w
    });
    element.h = layout.height;
}

function finalizeLmsWhiteboardTextBox(element = {}) {
    if (!element || element.type !== 'text') return;
    normalizeLmsWhiteboardBox(element);
    if (Math.abs(element.w || 0) < 80 && Math.abs(element.h || 0) < 24) {
        element.w = LMS_WHITEBOARD_UI.textDefaults.w;
    }
    syncLmsWhiteboardTextHeight(element);
}

function finalizeLmsWhiteboardBoxShape(element = {}) {
    if (!isLmsWhiteboardShapeBoxElement(element)) return false;
    const absW = Math.abs(element.w || 0);
    const absH = Math.abs(element.h || 0);
    if (Math.max(absW, absH) < LMS_WHITEBOARD_SHAPE_MIN_DRAG_PX) return false;
    normalizeLmsWhiteboardBox(element);
    return true;
}

function finalizeLmsWhiteboardLineShape(element = {}) {
    if (!isLmsWhiteboardShapeLineElement(element)) return false;
    const length = Math.hypot(
        (element.x2 || 0) - (element.x || 0),
        (element.y2 || 0) - (element.y || 0)
    );
    return length >= 16;
}

function buildLmsWhiteboardShapeDraft(tool = '', point = {}) {
    const snapped = snapLmsWhiteboardPoint(point);
    const base = {
        color: LMS_WHITEBOARD_UI.color,
        width: LMS_WHITEBOARD_UI.strokeWidth,
        authorId: getLmsWhiteboardActorId()
    };
    if (tool === 'line' || tool === 'arrow') {
        return {
            ...base,
            type: tool,
            id: makeLmsWhiteboardId(tool),
            x: snapped.x,
            y: snapped.y,
            x2: snapped.x,
            y2: snapped.y
        };
    }
    if (tool === 'grid') {
        return {
            ...base,
            type: 'grid',
            id: makeLmsWhiteboardId('grid'),
            x: snapped.x,
            y: snapped.y,
            w: 1,
            h: 1,
            rows: LMS_WHITEBOARD_UI.gridDefaults.rows,
            cols: LMS_WHITEBOARD_UI.gridDefaults.cols,
            fill: LMS_WHITEBOARD_UI.shapeDefaults.fill,
            fillOpacity: LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity
        };
    }
    const type = tool === 'roundRect' ? 'rect' : tool;
    return {
        ...base,
        type,
        id: makeLmsWhiteboardId(type),
        x: snapped.x,
        y: snapped.y,
        w: 1,
        h: 1,
        cornerRadius: tool === 'roundRect' ? 12 : 0,
        fill: LMS_WHITEBOARD_UI.shapeDefaults.fill,
        fillOpacity: LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity
    };
}

function getLmsWhiteboardWorkspaceContentBounds(resourceKey = '') {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    (workspace.elements || []).forEach(element => {
        const bounds = getLmsWhiteboardElementBounds(element);
        if (!bounds) return;
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.w);
        maxY = Math.max(maxY, bounds.y + bounds.h);
    });
    if (!Number.isFinite(minX)) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function fitLmsWhiteboardZoomToBounds(resourceKey = '', bounds = null) {
    if (!bounds || bounds.w <= 0 || bounds.h <= 0) {
        setLmsWhiteboardZoom(1, true, resourceKey);
        return;
    }
    const pad = 48;
    const zoomX = (LMS_WHITEBOARD_LOGICAL_WIDTH - (pad * 2)) / bounds.w;
    const zoomY = (LMS_WHITEBOARD_LOGICAL_HEIGHT - (pad * 2)) / bounds.h;
    const zoom = Math.max(0.4, Math.min(2.5, Math.min(zoomX, zoomY)));
    const centerX = bounds.x + (bounds.w / 2);
    const centerY = bounds.y + (bounds.h / 2);
    LMS_WHITEBOARD_UI.zoom = zoom;
    LMS_WHITEBOARD_UI.panX = (LMS_WHITEBOARD_LOGICAL_WIDTH / 2) - (centerX * zoom);
    LMS_WHITEBOARD_UI.panY = (LMS_WHITEBOARD_LOGICAL_HEIGHT / 2) - (centerY * zoom);
    const key = resourceKey || LMS_WHITEBOARD_UI.boundKey;
    paintLmsWhiteboardCanvas(key);
    repositionLmsWhiteboardInlineEditor(document.querySelector('.lms-whiteboard-canvas'));
    saveLmsWhiteboardLocalViewport(key);
    if (typeof maybeEmitLmsWhiteboardViewport === 'function') maybeEmitLmsWhiteboardViewport(resourceKey);
}

function fitLmsWhiteboardZoomToContent(resourceKey = '') {
    fitLmsWhiteboardZoomToBounds(resourceKey, getLmsWhiteboardWorkspaceContentBounds(resourceKey));
}


function getLmsWhiteboardResizeHandleCursor(handleId = '') {
    const id = String(handleId || '').trim();
    if (id === 'nw' || id === 'se') return 'nwse-resize';
    if (id === 'ne' || id === 'sw') return 'nesw-resize';
    if (id === 'n' || id === 's') return 'ns-resize';
    if (id === 'e' || id === 'w') return 'ew-resize';
    if (id === 'start' || id === 'end') return 'grab';
    return '';
}

const LMS_WHITEBOARD_DRAW_TOOLS = ['pen', 'eraser', 'sticky', 'text', ...LMS_WHITEBOARD_SHAPE_DRAW_TOOLS];
const LMS_WHITEBOARD_STAGE_CURSOR_VALUES = new Set(['move', 'grab', 'grabbing', 'crosshair', 'default', 'not-allowed']);


function resolveLmsWhiteboardPointerCursor(options = {}) {
    const resourceKey = options.resourceKey || LMS_WHITEBOARD_UI.boundKey;
    const point = options.point === undefined ? LMS_WHITEBOARD_UI.lastPointer : options.point;
    const tool = LMS_WHITEBOARD_UI.tool;

    if (LMS_WHITEBOARD_UI.panning) return 'grabbing';

    const dragStart = LMS_WHITEBOARD_UI.dragStart;
    if (dragStart) {
        if (dragStart.mode === 'marquee') return 'default';
        if (dragStart.mode === 'move') return 'grabbing';
        if (dragStart.mode === 'resize') {
            return getLmsWhiteboardResizeHandleCursor(dragStart.handle) || 'grabbing';
        }
        if (dragStart.panX != null) return 'grabbing';
    }

    if (tool === 'hand') return point ? 'grab' : 'default';

    if (tool === 'select' && point) {
        const selectedIds = getLmsWhiteboardSelectedIds();
        if (selectedIds.length === 1) {
            const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
            const selected = workspace.elements.find(item => item.id === selectedIds[0]);
            if (selected && !selected.parentDocumentId) {
                const resizeCursor = getLmsWhiteboardResizeHandleCursor(hitTestLmsWhiteboardResizeZone(point, selected));
                if (resizeCursor) return resizeCursor;
            }
        }
        if (findLmsWhiteboardElementAtPoint(resourceKey, point)) {
            const hit = findLmsWhiteboardElementAtPoint(resourceKey, point);
            const canMove = typeof canMoveLmsWhiteboardElement !== 'function' || canMoveLmsWhiteboardElement(hit, resourceKey);
            const canEditEl = typeof canEditLmsWhiteboardElement !== 'function' || canEditLmsWhiteboardElement(hit, resourceKey);
            if (!canMove || !canEditEl) return 'not-allowed';
            return 'move';
        }
        return 'default';
    }

    if (LMS_WHITEBOARD_DRAW_TOOLS.includes(tool)) return 'crosshair';
    return 'default';
}

function applyLmsWhiteboardStageCursor(stage, cursor = '') {
    if (!stage) return;
    if (LMS_WHITEBOARD_STAGE_CURSOR_VALUES.has(cursor)) {
        stage.dataset.lmsWhiteboardCursor = cursor;
    } else {
        delete stage.dataset.lmsWhiteboardCursor;
    }
}

function syncLmsWhiteboardPointerCursor(target = null, cursor = '', options = {}) {
    if (!target) return;
    const resolved = cursor || resolveLmsWhiteboardPointerCursor(options);
    target.style.cursor = resolved;
    const stage = target.classList?.contains('lms-whiteboard-canvas')
        ? target.closest('[data-lms-whiteboard-region="stage"]')
        : target.closest?.('[data-lms-whiteboard-region="stage"]');
    if (stage) applyLmsWhiteboardStageCursor(stage, resolved);
}

function refreshLmsWhiteboardPointerCursor(canvas = null, options = {}) {
    const target = canvas || document.querySelector('.lms-whiteboard-canvas');
    if (!target) return;
    syncLmsWhiteboardPointerCursor(target, '', {
        resourceKey: options.resourceKey || LMS_WHITEBOARD_UI.boundKey,
        point: options.point === undefined ? LMS_WHITEBOARD_UI.lastPointer : options.point
    });
}


function applyLmsWhiteboardStrokeBoundsResize(element = {}, base = {}, handle = '', point = {}, options = {}) {
    if (!element || element.type !== 'stroke' || !handle || !base) return;
    const oldBounds = getLmsWhiteboardElementBounds(base);
    if (!oldBounds || !Math.abs(oldBounds.w) || !Math.abs(oldBounds.h)) return;
    const snapped = options.local ? { x: point.x, y: point.y } : snapLmsWhiteboardPoint(point);
    const box = { type: 'rect', x: oldBounds.x, y: oldBounds.y, w: oldBounds.w, h: oldBounds.h };
    const baseBox = { x: oldBounds.x, y: oldBounds.y, w: oldBounds.w, h: oldBounds.h };
    applyLmsWhiteboardResize(box, baseBox, handle, snapped, { ...options, skipNormalize: true });
    const newBounds = getLmsWhiteboardElementBounds(box) || box;
    const basePoints = Array.isArray(base.points) ? base.points : [];
    const oldW = Math.abs(oldBounds.w) || 1;
    const oldH = Math.abs(oldBounds.h) || 1;
    element.points = basePoints.map(([px, py]) => [
        newBounds.x + ((px - oldBounds.x) / oldW) * (newBounds.w || 0),
        newBounds.y + ((py - oldBounds.y) / oldH) * (newBounds.h || 0)
    ]);
}

function applyLmsWhiteboardLineResize(element = {}, base = {}, handle = '', point = {}, options = {}) {
    if (!element || !base || !handle || !isLmsWhiteboardShapeLineElement(element)) return;
    const snapped = options.local ? { x: point.x, y: point.y } : snapLmsWhiteboardPoint(point);
    if (handle === 'start') {
        element.x = snapped.x;
        element.y = snapped.y;
    } else if (handle === 'end') {
        element.x2 = snapped.x;
        element.y2 = snapped.y;
    }
}

function applyLmsWhiteboardElementResize(element = {}, base = {}, handle = '', point = {}, options = {}) {
    if (!element || !base || !handle) return;
    if (isLmsWhiteboardShapeLineElement(element)) {
        applyLmsWhiteboardLineResize(element, base, handle, point, options);
        return;
    }
    if (element.type === 'stroke') {
        applyLmsWhiteboardStrokeBoundsResize(element, base, handle, point, options);
        return;
    }
    applyLmsWhiteboardResize(element, base, handle, point, options);
}

function drawLmsWhiteboardResizeHandles(ctx, element = {}) {
    if (!canLmsWhiteboardResizeElement(element)) return;
    const handles = isLmsWhiteboardShapeLineElement(element)
        ? [
            { id: 'start', x: element.x, y: element.y },
            { id: 'end', x: element.x2, y: element.y2 }
        ]
        : getLmsWhiteboardResizeHandlePoints(getLmsWhiteboardElementBounds(element), element);
    if (!handles?.length) return;
    ctx.save();
    ctx.fillStyle = LMS_WHITEBOARD_THEME.accent;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.5;
    handles.forEach(handle => {
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    ctx.restore();
}

function applyLmsWhiteboardResize(element = {}, base = {}, handle = '', point = {}, options = {}) {
    if (!element || !base || !handle) return;
    const snapped = options.local ? { x: point.x, y: point.y } : snapLmsWhiteboardPoint(point);
    if (handle === 'se') {
        element.w = snapped.x - base.x;
        element.h = snapped.y - base.y;
    } else if (handle === 'sw') {
        element.x = snapped.x;
        element.w = (base.x + (base.w || 0)) - snapped.x;
        element.h = snapped.y - base.y;
    } else if (handle === 'ne') {
        element.y = snapped.y;
        element.w = snapped.x - base.x;
        element.h = (base.y + (base.h || 0)) - snapped.y;
    } else if (handle === 'nw') {
        element.x = snapped.x;
        element.y = snapped.y;
        element.w = (base.x + (base.w || 0)) - snapped.x;
        element.h = (base.y + (base.h || 0)) - snapped.y;
    } else if (handle === 'n') {
        element.y = snapped.y;
        element.h = (base.y + (base.h || 0)) - snapped.y;
    } else if (handle === 's') {
        element.h = snapped.y - base.y;
    } else if (handle === 'e') {
        element.w = snapped.x - base.x;
    } else if (handle === 'w') {
        element.x = snapped.x;
        element.w = (base.x + (base.w || 0)) - snapped.x;
    }
    if (options.aspectLock && Math.abs(base.w || 0) > 0 && Math.abs(base.h || 0) > 0) {
        const ratio = Math.abs(base.w) / Math.abs(base.h);
        const absW = Math.abs(element.w || 0);
        const absH = Math.abs(element.h || 0);
        const signW = (element.w || 0) < 0 ? -1 : 1;
        const signH = (element.h || 0) < 0 ? -1 : 1;
        if (absW / Math.max(absH, 1) > ratio) {
            element.h = signH * (absW / ratio);
        } else {
            element.w = signW * (absH * ratio);
        }
    }
    if (!options.skipNormalize) normalizeLmsWhiteboardBox(element);
    if (element.type === 'text') syncLmsWhiteboardTextHeight(element);
}

function isLmsWhiteboardDocumentImageElement(element = {}) {
    if (element.type !== 'document') return false;
    return typeof isLmsWhiteboardImageMime === 'function'
        && isLmsWhiteboardImageMime(element.mimeType, element.fileName);
}

function shouldLmsWhiteboardResizeAspectLock(element = {}, shiftKey = false) {
    if (shiftKey) return false;
    if (element.type === 'image' || element.type === 'ellipse') return true;
    return isLmsWhiteboardDocumentImageElement(element);
}

function scaleLmsWhiteboardDocumentChildElements(resourceKey = '', documentId = '', oldW = 1, oldH = 1, newW = 1, newH = 1) {
    const safeOldW = Math.abs(oldW) || 1;
    const safeOldH = Math.abs(oldH) || 1;
    const sx = Math.abs(newW) / safeOldW;
    const sy = Math.abs(newH) / safeOldH;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    workspace.elements.forEach(element => {
        if (element.parentDocumentId !== documentId) return;
        if (element.type === 'stroke' && Array.isArray(element.points)) {
            element.points = element.points.map(([x, y]) => [x * sx, y * sy]);
            return;
        }
        if (['sticky', 'text'].includes(element.type)) {
            element.x = (element.x || 0) * sx;
            element.y = (element.y || 0) * sy;
            element.w = (element.w || 0) * sx;
            element.h = (element.h || 0) * sy;
        }
    });
    if (typeof repaintLmsWhiteboardDocumentInk === 'function') repaintLmsWhiteboardDocumentInk(documentId);
}

function scaleLmsWhiteboardDocumentStrokePoints(resourceKey = '', documentId = '', oldW = 1, oldH = 1, newW = 1, newH = 1) {
    scaleLmsWhiteboardDocumentChildElements(resourceKey, documentId, oldW, oldH, newW, newH);
}

function reorderLmsWhiteboardElement(resourceKey = '', direction = 0) {
    const delta = Number(direction) || 0;
    const primaryId = getLmsWhiteboardSelectedIds()[0] || LMS_WHITEBOARD_UI.selectedId;
    if (!delta) return;
    if (!primaryId) {
        alert('Select an object first to reorder layers.');
        return;
    }
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const index = workspace.elements.findIndex(item => item.id === primaryId);
    if (index < 0) return;
    const target = index + delta;
    if (target < 0 || target >= workspace.elements.length) return;
    const [item] = workspace.elements.splice(index, 1);
    workspace.elements.splice(target, 0, item);
    commitLmsWhiteboardEdit(resourceKey, delta > 0 ? 'bring-forward' : 'send-backward', { forceFullSync: true });
    paintLmsWhiteboardCanvas(resourceKey);
    refreshLmsWhiteboardLayersList();
}

function setupLmsWhiteboardCanvasHiDpi(canvas) {
    if (!canvas) return 1;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const rect = canvas.getBoundingClientRect();
    const displayW = Math.max(1, Math.round(rect.width || canvas.clientWidth || LMS_WHITEBOARD_LOGICAL_WIDTH));
    const displayH = Math.max(1, Math.round(rect.height || canvas.clientHeight || LMS_WHITEBOARD_LOGICAL_HEIGHT));
    const expectedWidth = Math.round(displayW * dpr);
    const expectedHeight = Math.round(displayH * dpr);
    const fingerprint = `${dpr}:${displayW}x${displayH}`;
    if (canvas.dataset.lmsWhiteboardDisplayFingerprint === fingerprint
        && canvas.width === expectedWidth
        && canvas.height === expectedHeight) {
        return dpr;
    }
    canvas.width = expectedWidth;
    canvas.height = expectedHeight;
    canvas.dataset.lmsWhiteboardDpr = String(dpr);
    canvas.dataset.lmsWhiteboardDisplayFingerprint = fingerprint;
    return dpr;
}

function getLmsWhiteboardCanvasMetrics(canvas) {
    const rect = canvas.getBoundingClientRect();
    const rawScaleX = rect.width / LMS_WHITEBOARD_LOGICAL_WIDTH;
    const rawScaleY = rect.height / LMS_WHITEBOARD_LOGICAL_HEIGHT;
    const scale = Math.min(rawScaleX, rawScaleY);
    const contentWidth = LMS_WHITEBOARD_LOGICAL_WIDTH * scale;
    const contentHeight = LMS_WHITEBOARD_LOGICAL_HEIGHT * scale;
    return {
        rect,
        scaleX: scale,
        scaleY: scale,
        scale,
        offsetX: (rect.width - contentWidth) / 2,
        offsetY: (rect.height - contentHeight) / 2,
        contentWidth,
        contentHeight
    };
}

function canvasToWorld(canvas, x, y) {
    const { rect, scaleX, scaleY, offsetX, offsetY } = getLmsWhiteboardCanvasMetrics(canvas);
    const screenX = (x - rect.left - offsetX) / scaleX;
    const screenY = (y - rect.top - offsetY) / scaleY;
    return {
        x: (screenX - LMS_WHITEBOARD_UI.panX) / LMS_WHITEBOARD_UI.zoom,
        y: (screenY - LMS_WHITEBOARD_UI.panY) / LMS_WHITEBOARD_UI.zoom
    };
}

function worldToStageOffset(canvas, worldX, worldY, worldW = 0, worldH = 0) {
    const { scaleX, scaleY, offsetX, offsetY } = getLmsWhiteboardCanvasMetrics(canvas);
    const left = offsetX + (worldX * LMS_WHITEBOARD_UI.zoom + LMS_WHITEBOARD_UI.panX) * scaleX;
    const top = offsetY + (worldY * LMS_WHITEBOARD_UI.zoom + LMS_WHITEBOARD_UI.panY) * scaleY;
    const width = worldW ? Math.abs(worldW) * LMS_WHITEBOARD_UI.zoom * scaleX : 0;
    const height = worldH ? Math.abs(worldH) * LMS_WHITEBOARD_UI.zoom * scaleY : 0;
    return { left, top, width, height };
}

function repositionLmsWhiteboardInlineEditor(canvas) {
    const session = LMS_WHITEBOARD_UI.inlineEdit;
    if (!session?.node || !canvas) return;
    const workspace = ensureLmsWhiteboardWorkspace(session.resourceKey);
    const element = workspace.elements.find(item => item.id === session.elementId);
    if (!element) return;
    const layer = canvas.closest('[data-lms-whiteboard-region="stage"]')?.querySelector('[data-lms-whiteboard-edit-layer]');
    if (!layer) return;
    const textW = Math.max(80, Number(element.w) || LMS_WHITEBOARD_UI.textDefaults.w);
    const textH = Math.max(24, Number(element.h) || LMS_WHITEBOARD_UI.textDefaults.h);
    let worldX = element.x;
    let worldY = element.y;
    let worldW = session.mode === 'edit-sticky' ? element.w : textW;
    let worldH = session.mode === 'edit-sticky' ? element.h : textH;
    if (element.parentDocumentId && typeof documentLocalToWorld === 'function') {
        const doc = workspace.elements.find(item => item.id === element.parentDocumentId);
        if (doc) {
            const topLeft = documentLocalToWorld(doc, element.x, element.y);
            worldX = topLeft.x;
            worldY = topLeft.y;
            const docBounds = getLmsWhiteboardElementBounds(doc);
            const docW = Math.abs(docBounds?.w || doc.w || 1);
            const docH = Math.abs(docBounds?.h || doc.h || 1);
            worldW = (Math.abs(element.w || textW) / docW) * (docBounds?.w || doc.w || 1);
            worldH = (Math.abs(element.h || textH) / docH) * (docBounds?.h || doc.h || 1);
        }
    }
    const bounds = session.mode === 'edit-sticky'
        ? worldToStageOffset(canvas, worldX, worldY, worldW, worldH)
        : worldToStageOffset(canvas, worldX, worldY, worldW, worldH);
    session.node.style.left = `${bounds.left}px`;
    session.node.style.top = `${bounds.top}px`;
    if (session.mode === 'edit-sticky') {
        session.node.style.width = `${Math.max(bounds.width, 80)}px`;
        session.node.style.height = `${Math.max(bounds.height, 80)}px`;
        session.node.style.fontSize = `${element.fontSize || LMS_WHITEBOARD_UI.stickyDefaults.fontSize}px`;
    } else {
        session.node.style.width = `${Math.max(bounds.width, 80)}px`;
        session.node.style.height = `${Math.max(bounds.height, 24)}px`;
        session.node.style.fontSize = `${element.fontSize || LMS_WHITEBOARD_UI.textDefaults.fontSize}px`;
    }
}

function closeLmsWhiteboardInlineEditor(commit = true) {
    const session = LMS_WHITEBOARD_UI.inlineEdit;
    if (!session) return;
    LMS_WHITEBOARD_UI.inlineEdit = null;
    const { node, resourceKey, elementId, mode, isNew } = session;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const element = workspace.elements.find(item => item.id === elementId);
    if (commit && element && node) {
        const value = mode === 'edit-sticky'
            ? String(node.innerText || '').trim()
            : String(node.value || '').trim();
        if (value) {
            element.text = value.slice(0, 2000);
            if (mode === 'edit-text') syncLmsWhiteboardTextHeight(element);
            const reason = mode === 'edit-sticky' ? 'sticky-edit' : 'text-edit';
            commitLmsWhiteboardEdit(resourceKey, reason, { op: { element } });
        } else if (isNew) {
            workspace.elements = workspace.elements.filter(item => item.id !== elementId);
            commitLmsWhiteboardEdit(resourceKey, 'text-cancel', { op: { type: 'remove', elementId } });
        }
    } else if (!commit && isNew) {
        workspace.elements = workspace.elements.filter(item => item.id !== elementId);
    }
    if (node?.isConnected) node.remove();
    if (element?.parentDocumentId && typeof repaintLmsWhiteboardDocumentInk === 'function') {
        repaintLmsWhiteboardDocumentInk(element.parentDocumentId);
    }
    paintLmsWhiteboardCanvas(resourceKey);
}

function openLmsWhiteboardInlineEditor(options = {}) {
    const {
        resourceKey = '',
        elementId = '',
        mode = 'edit-text',
        canvas = null,
        isNew = false
    } = options;
    if (!resourceKey || !elementId || !canvas) return;
    closeLmsWhiteboardInlineEditor(true);
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const element = workspace.elements.find(item => item.id === elementId);
    if (!element) return;
    const layer = canvas.closest('[data-lms-whiteboard-region="stage"]')?.querySelector('[data-lms-whiteboard-edit-layer]');
    if (!layer) return;
    layer.setAttribute('aria-hidden', 'false');
    let node;
    if (mode === 'edit-sticky') {
        node = document.createElement('div');
        node.className = 'lms-whiteboard-inline-editor is-sticky';
        node.contentEditable = 'true';
        node.spellcheck = true;
        node.textContent = element.text || '';
        node.style.backgroundColor = element.color || '#fff3b0';
        node.style.fontSize = `${element.fontSize || LMS_WHITEBOARD_UI.stickyDefaults.fontSize}px`;
    } else {
        node = document.createElement('textarea');
        node.className = 'lms-whiteboard-inline-editor is-text';
        node.value = element.text || '';
        node.rows = 1;
        node.style.color = element.color || '#f8fafc';
        node.style.fontSize = `${element.fontSize || LMS_WHITEBOARD_UI.textDefaults.fontSize}px`;
    }
    node.dataset.lmsWhiteboardInlineEditor = '1';
    node.setAttribute('data-lms-whiteboard-inline-editor', '1');
    layer.appendChild(node);
    LMS_WHITEBOARD_UI.inlineEdit = { resourceKey, elementId, mode, node, isNew };
    repositionLmsWhiteboardInlineEditor(canvas);
    node.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeLmsWhiteboardInlineEditor(false);
            return;
        }
        if (mode === 'edit-text' && event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            closeLmsWhiteboardInlineEditor(true);
        }
    });
    node.addEventListener('blur', () => {
        requestAnimationFrame(() => {
            if (LMS_WHITEBOARD_UI.inlineEdit?.node === node) closeLmsWhiteboardInlineEditor(true);
        });
    });
    if (mode === 'edit-text') {
        node.addEventListener('input', () => {
            element.text = String(node.value || '');
            syncLmsWhiteboardTextHeight(element);
            repositionLmsWhiteboardInlineEditor(canvas);
            if (element.parentDocumentId && typeof repaintLmsWhiteboardDocumentInk === 'function') {
                repaintLmsWhiteboardDocumentInk(element.parentDocumentId);
            } else {
                paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
            }
        });
    }
    requestAnimationFrame(() => node.focus());
}

/* Pointer pipeline: lms-whiteboard-pointer-runtime.js */

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitTestLmsWhiteboardStroke(point, element = {}) {
    const points = Array.isArray(element.points) ? element.points : [];
    if (!points.length) return false;
    const threshold = Math.max(8, Number(element.width || 3) + 4);
    if (points.length === 1) {
        return Math.hypot(point.x - points[0][0], point.y - points[0][1]) <= threshold;
    }
    for (let index = 0; index < points.length - 1; index += 1) {
        const [x1, y1] = points[index];
        const [x2, y2] = points[index + 1];
        if (distanceToLineSegment(point.x, point.y, x1, y1, x2, y2) <= threshold) return true;
    }
    return false;
}


function strokeIntersectsLmsWhiteboardRect(element = {}, rect = {}) {
    const bounds = getLmsWhiteboardElementBounds(element);
    if (bounds && rectsIntersectLmsWhiteboard(bounds, rect)) return true;
    const points = Array.isArray(element.points) ? element.points : [];
    return points.some(([x, y]) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
}

function elementIntersectsLmsWhiteboardMarquee(element = {}, rect = {}) {
    if (!rect || rect.w <= 0 || rect.h <= 0) return false;
    if (element.type === 'stroke') return strokeIntersectsLmsWhiteboardRect(element, rect);
    const bounds = getLmsWhiteboardElementBounds(element);
    return Boolean(bounds && rectsIntersectLmsWhiteboard(bounds, rect));
}

function findLmsWhiteboardElementsInMarquee(resourceKey = '', rect = {}, options = {}) {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    if (!workspace || !rect) return [];
    const parentDocumentId = String(options.parentDocumentId || '').trim();
    return (workspace.elements || []).filter(element => {
        if (parentDocumentId) {
            if (String(element.parentDocumentId || '').trim() !== parentDocumentId) return false;
        } else if (element.parentDocumentId) return false;
        return elementIntersectsLmsWhiteboardMarquee(element, rect);
    }).map(element => String(element.id));
}

function getLmsWhiteboardMarqueeDragRect(dragStart = {}) {
    if (!dragStart || dragStart.mode !== 'marquee') return null;
    return normalizeLmsWhiteboardRect(dragStart.x, dragStart.y, dragStart.x2, dragStart.y2);
}

function isLmsWhiteboardMarqueeDragSignificant(dragStart = {}) {
    const rect = getLmsWhiteboardMarqueeDragRect(dragStart);
    if (!rect) return false;
    return rect.w >= LMS_WHITEBOARD_MARQUEE_MIN_DRAG_PX || rect.h >= LMS_WHITEBOARD_MARQUEE_MIN_DRAG_PX;
}

function drawLmsWhiteboardMarquee(ctx, rect = {}) {
    if (!ctx || !rect || rect.w <= 0 || rect.h <= 0) return;
    ctx.save();
    ctx.fillStyle = 'rgba(244, 208, 111, 0.12)';
    ctx.strokeStyle = LMS_WHITEBOARD_THEME.selection;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
}

function buildLmsWhiteboardMoveDragStart(resourceKey = '', point = {}, hit = {}, selectedIds = null) {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const seedIds = Array.isArray(selectedIds) && selectedIds.length
        ? selectedIds.map(String)
        : getLmsWhiteboardSelectedIds();
    const ids = seedIds.length ? seedIds : [hit?.id].filter(Boolean);
    const elementSnapshots = {};
    ids.forEach(id => {
        const element = workspace.elements.find(item => item.id === id);
        if (element) elementSnapshots[id] = JSON.parse(JSON.stringify(element));
    });
    return {
        mode: 'move',
        x: point.x,
        y: point.y,
        element: JSON.parse(JSON.stringify(hit)),
        selectedIds: ids,
        elements: elementSnapshots
    };
}

function drawLmsWhiteboardSelectionOutline(ctx, element = {}) {
    const bounds = getLmsWhiteboardElementBounds(element);
    if (!bounds || bounds.w <= 0 || bounds.h <= 0) return;
    ctx.save();
    ctx.strokeStyle = LMS_WHITEBOARD_THEME.selection;
    ctx.lineWidth = 2;
    ctx.setLineDash(element.type === 'stroke' ? [6, 4] : []);
    wbRoundRect(ctx, bounds.x - 1, bounds.y - 1, bounds.w + 2, bounds.h + 2, 6);
    ctx.stroke();
    if (element.type !== 'document') drawLmsWhiteboardResizeHandles(ctx, element);
    ctx.restore();
}


function drawLmsWhiteboardGroupSelectionOutline(ctx, bounds = {}) {
    if (!bounds || bounds.w <= 0 || bounds.h <= 0) return;
    const pad = 4;
    const x = bounds.x - pad;
    const y = bounds.y - pad;
    const w = bounds.w + (pad * 2);
    const h = bounds.h + (pad * 2);
    const cornerBounds = { x, y, w, h };
    const cornerIds = new Set(['nw', 'ne', 'se', 'sw']);
    ctx.save();
    ctx.shadowColor = 'rgba(244, 208, 111, 0.35)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(244, 208, 111, 0.75)';
    ctx.lineWidth = 1.75;
    ctx.setLineDash([]);
    wbRoundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = LMS_WHITEBOARD_THEME.accent;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.5;
    getLmsWhiteboardResizeHandlePoints(cornerBounds, {}).forEach(handle => {
        if (!cornerIds.has(handle.id)) return;
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    ctx.restore();
}

function findLmsWhiteboardElementAtPoint(resourceKey, point) {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    for (let index = workspace.elements.length - 1; index >= 0; index -= 1) {
        const element = workspace.elements[index];
        if (element.parentDocumentId) continue;
        if (element.type === 'stroke') {
            if (hitTestLmsWhiteboardStroke(point, element)) return element;
            continue;
        }
        if (['sticky', 'image', 'document', ...LMS_WHITEBOARD_SHAPE_BOX_TYPES].includes(element.type)) {
            const x = Math.min(element.x, element.x + (element.w || 0));
            const y = Math.min(element.y, element.y + (element.h || 0));
            if (point.x >= x && point.x <= x + Math.abs(element.w || 0) && point.y >= y && point.y <= y + Math.abs(element.h || 0)) return element;
            continue;
        }
        if (isLmsWhiteboardShapeLineElement(element)) {
            const threshold = Math.max(8, Number(element.width || 3) + 4);
            if (distanceToLineSegment(point.x, point.y, element.x, element.y, element.x2, element.y2) <= threshold) return element;
            continue;
        }
        if (element.type === 'text') {
            const w = Math.max(80, Number(element.w) || LMS_WHITEBOARD_UI.textDefaults.w);
            const h = Math.max(24, Number(element.h) || LMS_WHITEBOARD_UI.textDefaults.h);
            if (point.x >= element.x && point.x <= element.x + w && point.y >= element.y && point.y <= element.y + h) return element;
        }
    }
    return null;
}

function canEraseLmsWhiteboardElement(element = {}, resourceKey = '') {
    const actorId = getLmsWhiteboardActorId();
    const isStaff = typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(resourceKey);
    if (isStaff) return true;
    if (String(element.authorId || '').trim() !== actorId) return false;
    return true;
}

function eraseLmsWhiteboardAtPoint(resourceKey, point, options = {}) {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const parentDocumentId = String(options.parentDocumentId || '').trim();
    if (parentDocumentId) {
        const removedIds = [];
        workspace.elements = workspace.elements.filter(element => {
            if (element.parentDocumentId !== parentDocumentId) return true;
            if (!canEraseLmsWhiteboardElement(element, resourceKey)) return true;
            let shouldRemove = false;
            if (element.type === 'stroke') {
                shouldRemove = element.points?.some(([x, y]) => Math.hypot(x - point.x, y - point.y) < 16);
            } else if (typeof hitTestLmsWhiteboardDocumentChildLocal === 'function') {
                shouldRemove = hitTestLmsWhiteboardDocumentChildLocal(point, element);
            }
            if (shouldRemove) removedIds.push(element.id);
            return !shouldRemove;
        });
        if (removedIds.length) {
            LMS_WHITEBOARD_UI.eraserOps = LMS_WHITEBOARD_UI.eraserOps || [];
            removedIds.forEach(elementId => LMS_WHITEBOARD_UI.eraserOps.push({ type: 'remove', elementId }));
            if (typeof repaintLmsWhiteboardDocumentInk === 'function') repaintLmsWhiteboardDocumentInk(parentDocumentId);
        }
        return removedIds[0] || null;
    }
    const hit = findLmsWhiteboardElementAtPoint(resourceKey, point);
    if (hit) {
        if (!canEraseLmsWhiteboardElement(hit, resourceKey)) return null;
        workspace.elements = workspace.elements.filter(element => element.id !== hit.id);
        LMS_WHITEBOARD_UI.eraserOps = LMS_WHITEBOARD_UI.eraserOps || [];
        LMS_WHITEBOARD_UI.eraserOps.push({ type: 'remove', elementId: hit.id });
        return hit.id;
    }
    const removedIds = [];
    workspace.elements = workspace.elements.filter(element => {
        if (element.type !== 'stroke' || element.parentDocumentId) return true;
        if (!canEraseLmsWhiteboardElement(element, resourceKey)) return true;
        const shouldRemove = element.points?.some(([x, y]) => Math.hypot(x - point.x, y - point.y) < 16);
        if (shouldRemove) removedIds.push(element.id);
        return !shouldRemove;
    });
    if (removedIds.length) {
        LMS_WHITEBOARD_UI.eraserOps = LMS_WHITEBOARD_UI.eraserOps || [];
        removedIds.forEach(elementId => LMS_WHITEBOARD_UI.eraserOps.push({ type: 'remove', elementId }));
    }
    return removedIds[0] || null;
}

function getLmsWhiteboardCachedImage(element = {}) {
    const src = String(element.src || '').trim();
    if (!src) return null;
    if (!LMS_WHITEBOARD_IMAGE_CACHE[src]) {
        const img = new Image();
        img.src = src;
        LMS_WHITEBOARD_IMAGE_CACHE[src] = img;
    }
    return LMS_WHITEBOARD_IMAGE_CACHE[src];
}

function hasLmsWhiteboardFileDrag(dataTransfer = null) {
    const types = Array.from(dataTransfer?.types || []);
    return types.includes('Files') || types.includes('application/x-moz-file');
}

function setLmsWhiteboardDropOverlayActive(stage, active = false) {
    if (!stage) return;
    const overlay = stage.querySelector('[data-lms-whiteboard-drop-overlay]');
    stage.classList.toggle('is-drop-active', Boolean(active));
    if (!overlay) return;
    overlay.hidden = !active;
    overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
}

function importLmsWhiteboardFileAtPoint(resourceKey = '', file = null, point = null) {
    if (!file || !resourceKey) return false;
    if (typeof canEditLmsWhiteboard === 'function' && !canEditLmsWhiteboard(resourceKey)) return false;
    if (typeof isLmsWhiteboardImportableFile === 'function' && !isLmsWhiteboardImportableFile(file)) return false;
    if (typeof importLmsWhiteboardDocumentFile === 'function') {
        void importLmsWhiteboardDocumentFile(resourceKey, file, point).catch((error) => {
            console.error('[whiteboard] import failed:', error);
            alert(error?.message || 'Could not import file.');
        });
        return true;
    }
    return false;
}

function importLmsWhiteboardDroppedFiles(resourceKey = '', files = [], point = null, canvas = null) {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length || !resourceKey) return 0;
    const anchor = point || (canvas
        ? canvasToWorld(canvas, canvas.getBoundingClientRect().left + 24, canvas.getBoundingClientRect().top + 24)
        : null);
    let imported = 0;
    list.forEach((file, index) => {
        const dropPoint = anchor
            ? { x: anchor.x + (index * 24), y: anchor.y + (index * 24) }
            : null;
        if (importLmsWhiteboardFileAtPoint(resourceKey, file, dropPoint)) imported += 1;
    });
    if (list.length && !imported) alert('Unsupported file type. Drop PDF, Word, Excel, or image files.');
    return imported;
}

function bindLmsWhiteboardFileDrop(stage, resourceKey = '', canEdit = false, canvas = null) {
    if (!stage || stage.dataset.lmsWhiteboardDropBound === '1') return;
    stage.dataset.lmsWhiteboardDropBound = '1';
    const overlay = stage.querySelector('[data-lms-whiteboard-drop-overlay]');
    let dragDepth = 0;

    const resetDropState = () => {
        dragDepth = 0;
        setLmsWhiteboardDropOverlayActive(stage, false);
    };

    stage.addEventListener('dragenter', (event) => {
        if (!canEdit || !hasLmsWhiteboardFileDrag(event.dataTransfer)) return;
        event.preventDefault();
        dragDepth += 1;
        setLmsWhiteboardDropOverlayActive(stage, true);
    });

    stage.addEventListener('dragleave', (event) => {
        if (!canEdit || dragDepth <= 0) return;
        if (event.relatedTarget && stage.contains(event.relatedTarget)) return;
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) setLmsWhiteboardDropOverlayActive(stage, false);
    });

    const dragTarget = overlay || stage;
    dragTarget.addEventListener('dragover', (event) => {
        if (!canEdit || !hasLmsWhiteboardFileDrag(event.dataTransfer)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    dragTarget.addEventListener('drop', (event) => {
        if (!canEdit) return;
        event.preventDefault();
        resetDropState();
        if (!canvas) return;
        const point = canvasToWorld(canvas, event.clientX, event.clientY);
        importLmsWhiteboardDroppedFiles(resourceKey, event.dataTransfer?.files, point, canvas);
    });

    window.addEventListener('dragend', resetDropState);
    document.addEventListener('drop', (event) => {
        if (!stage.classList.contains('is-drop-active')) return;
        if (event.target === dragTarget || stage.contains(event.target)) return;
        resetDropState();
    });
}

function importLmsWhiteboardImageFile(resourceKey = '', file = null, point = null) {
    if (!file || !resourceKey || typeof canEditLmsWhiteboard !== 'function' || !canEditLmsWhiteboard(resourceKey)) return;
    const reader = new FileReader();
    reader.onload = () => {
        const src = String(reader.result || '');
        if (!src || src.length > LMS_WHITEBOARD_IMAGE_MAX_BYTES) {
            alert('Image is too large to import.');
            return;
        }
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        const img = new Image();
        img.onload = () => {
            const maxW = 480;
            const maxH = 360;
            let w = img.naturalWidth || 200;
            let h = img.naturalHeight || 200;
            const scale = Math.min(1, maxW / w, maxH / h);
            w = Math.max(40, Math.round(w * scale));
            h = Math.max(40, Math.round(h * scale));
            const anchor = point || LMS_WHITEBOARD_UI.lastPointer || { x: 120, y: 120 };
            const snapped = snapLmsWhiteboardPoint(anchor);
            const element = {
                type: 'image',
                id: makeLmsWhiteboardId('image'),
                x: snapped.x,
                y: snapped.y,
                w,
                h,
                src,
                authorId: getLmsWhiteboardActorId()
            };
            workspace.elements.push(element);
            LMS_WHITEBOARD_IMAGE_CACHE[src] = img;
            setLmsWhiteboardSelection([element.id], { skipPaint: true });
            commitLmsWhiteboardEdit(resourceKey, 'image-import', { op: { element } });
            paintLmsWhiteboardCanvas(resourceKey);
        };
        img.src = src;
    };
    reader.readAsDataURL(file);
}

function setLmsWhiteboardZoom(nextZoom, resetPan = false, resourceKey = '') {
    LMS_WHITEBOARD_UI.zoom = Math.max(0.4, Math.min(2.5, nextZoom));
    if (resetPan) {
        LMS_WHITEBOARD_UI.panX = 0;
        LMS_WHITEBOARD_UI.panY = 0;
    }
    const key = resourceKey || LMS_WHITEBOARD_UI.boundKey;
    paintLmsWhiteboardCanvas(key);
    repositionLmsWhiteboardInlineEditor(document.querySelector('.lms-whiteboard-canvas'));
    saveLmsWhiteboardLocalViewport(key);
}

/* Canvas paint/draw pipeline: lms-whiteboard-paint-runtime.js */

function captureLmsWhiteboardSnapshot(resourceKey = '', includeGrid = true) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = LMS_WHITEBOARD_LOGICAL_WIDTH;
    exportCanvas.height = LMS_WHITEBOARD_LOGICAL_HEIGHT;
    paintLmsWhiteboardCanvas(resourceKey, exportCanvas, { ignoreTransform: true, includeGrid, logicalPixels: true });
    return exportCanvas;
}

function exportLmsWhiteboardImage(resourceKey = '', format = 'png') {
    const snapshot = captureLmsWhiteboardSnapshot(resourceKey, true);
    const slug = resourceKey.replace(/[^a-z0-9]+/gi, '-') || 'board';
    if (format === 'pdf') {
        const loader = typeof window.ensureLmsExportLibraries === 'function'
            ? window.ensureLmsExportLibraries('pdf')
            : Promise.resolve();
        loader.then(() => {
            const jspdfRoot = window.jspdf || window;
            const jsPDF = jspdfRoot.jsPDF;
            if (typeof jsPDF !== 'function') {
                alert('PDF export library is not available.');
                return;
            }
            const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [snapshot.width, snapshot.height] });
            doc.addImage(snapshot.toDataURL('image/png'), 'PNG', 0, 0, snapshot.width, snapshot.height);
            doc.save(`whiteboard-${slug}.pdf`);
        }).catch(() => alert('PDF export could not be loaded.'));
        return;
    }
    const link = document.createElement('a');
    link.download = `whiteboard-${slug}.png`;
    link.href = snapshot.toDataURL('image/png');
    link.click();
}


function detachLmsWhiteboardShellDragWindowListeners() {
    const listeners = LMS_WHITEBOARD_UI.shellDragWindowListeners;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.onMove);
    window.removeEventListener('pointerup', listeners.onEnd);
    window.removeEventListener('pointercancel', listeners.onEnd);
    LMS_WHITEBOARD_UI.shellDragWindowListeners = null;
}

function attachLmsWhiteboardShellDragWindowListeners(pointerId = 0, captureTarget = null) {
    detachLmsWhiteboardShellDragWindowListeners();
    const onMove = (e) => updateLmsWhiteboardShellDrag(e);
    const onEnd = (e) => {
        endLmsWhiteboardShellDrag(e);
        captureTarget?.releasePointerCapture?.(pointerId);
    };
    LMS_WHITEBOARD_UI.shellDragWindowListeners = { onMove, onEnd };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
}

function beginLmsWhiteboardShellDrag(event, resourceKey = '', canvas = null, options = {}) {
    const elementId = String(options.elementId || '').trim();
    const mode = String(options.mode || '').trim();
    const handle = String(options.handle || '').trim();
    if (!elementId || !mode || !canvas || !resourceKey) return false;
    if (LMS_WHITEBOARD_UI.tool !== 'select') return false;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const element = workspace.elements.find(item => item.id === elementId);
    if (!element || element.locked) return false;
    if (typeof canEditLmsWhiteboard === 'function' && !canEditLmsWhiteboard(resourceKey)) return false;
    if (mode === 'move' && typeof canMoveLmsWhiteboardElement === 'function' && !canMoveLmsWhiteboardElement(element, resourceKey)) return false;
    setLmsWhiteboardSelection([elementId], { skipPaint: true });
    const point = canvasToWorld(canvas, event.clientX, event.clientY);
    if (mode === 'resize' && handle) {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        LMS_WHITEBOARD_UI.dragStart = {
            mode: 'resize',
            handle,
            x: point.x,
            y: point.y,
            element: JSON.parse(JSON.stringify(element))
        };
    } else if (mode === 'move') {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        const selectedIds = getLmsWhiteboardSelectedIds();
        const elementSnapshots = {};
        selectedIds.forEach(id => {
            const item = workspace.elements.find(el => el.id === id);
            if (item) elementSnapshots[id] = JSON.parse(JSON.stringify(item));
        });
        LMS_WHITEBOARD_UI.dragStart = {
            mode: 'move',
            x: point.x,
            y: point.y,
            element: JSON.parse(JSON.stringify(element)),
            selectedIds,
            elements: elementSnapshots
        };
    } else {
        return false;
    }
    LMS_WHITEBOARD_UI.shellDragCanvas = canvas;
    LMS_WHITEBOARD_UI.shellDragResourceKey = resourceKey;
    LMS_WHITEBOARD_UI.shellDragCaptureTarget = event.target || null;
    if (event.target?.setPointerCapture) event.target.setPointerCapture(event.pointerId);
    attachLmsWhiteboardShellDragWindowListeners(event.pointerId, event.target);
    document.querySelector(`[data-lms-whiteboard-document-view="${elementId}"]`)?.classList.add('is-dragging');
    paintLmsWhiteboardCanvas(resourceKey, canvas);
    return true;
}

function updateLmsWhiteboardShellDrag(event) {
    const canvas = LMS_WHITEBOARD_UI.shellDragCanvas;
    const resourceKey = LMS_WHITEBOARD_UI.shellDragResourceKey || LMS_WHITEBOARD_UI.boundKey;
    if (!canvas || !resourceKey || !LMS_WHITEBOARD_UI.dragStart) return;
    const canEdit = typeof canEditLmsWhiteboard === 'function' ? canEditLmsWhiteboard(resourceKey) : true;
    onLmsWhiteboardPointerMove(event, resourceKey, canEdit, canvas);
}

function endLmsWhiteboardShellDrag(event) {
    detachLmsWhiteboardShellDragWindowListeners();
    document.querySelectorAll('.lms-whiteboard-document-view.is-dragging').forEach((node) => {
        node.classList.remove('is-dragging');
    });
    const canvas = LMS_WHITEBOARD_UI.shellDragCanvas;
    const resourceKey = LMS_WHITEBOARD_UI.shellDragResourceKey || LMS_WHITEBOARD_UI.boundKey;
    const captureTarget = LMS_WHITEBOARD_UI.shellDragCaptureTarget;
    if (!canvas || !resourceKey) {
        LMS_WHITEBOARD_UI.dragStart = null;
        LMS_WHITEBOARD_UI.shellDragCanvas = null;
        LMS_WHITEBOARD_UI.shellDragResourceKey = '';
        LMS_WHITEBOARD_UI.shellDragCaptureTarget = null;
        return;
    }
    const canEdit = typeof canEditLmsWhiteboard === 'function' ? canEditLmsWhiteboard(resourceKey) : true;
    onLmsWhiteboardPointerUp(event, resourceKey, canEdit, canvas);
    captureTarget?.releasePointerCapture?.(event?.pointerId);
    LMS_WHITEBOARD_UI.shellDragCanvas = null;
    LMS_WHITEBOARD_UI.shellDragResourceKey = '';
    LMS_WHITEBOARD_UI.shellDragCaptureTarget = null;
}

function beginLmsWhiteboardDocumentStroke(resourceKey = '', documentId = '', localPoint = {}) {
    recordLmsWhiteboardHistoryGesture(resourceKey);
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    LMS_WHITEBOARD_UI.drawing = true;
    LMS_WHITEBOARD_UI.currentStroke = {
        type: 'stroke',
        id: makeLmsWhiteboardId('stroke'),
        points: [[Number(localPoint.x) || 0, Number(localPoint.y) || 0]],
        color: LMS_WHITEBOARD_UI.color,
        width: LMS_WHITEBOARD_UI.strokeWidth,
        authorId: getLmsWhiteboardActorId(),
        parentDocumentId: documentId,
        pageIndex: 0,
        opacity: 1
    };
    workspace.elements.push(LMS_WHITEBOARD_UI.currentStroke);
    if (typeof repaintLmsWhiteboardDocumentInk === 'function') repaintLmsWhiteboardDocumentInk(documentId);
}

function continueLmsWhiteboardDocumentStroke(localPoint = {}) {
    if (!LMS_WHITEBOARD_UI.currentStroke?.parentDocumentId) return;
    LMS_WHITEBOARD_UI.currentStroke.points.push([Number(localPoint.x) || 0, Number(localPoint.y) || 0]);
    if (typeof repaintLmsWhiteboardDocumentInk === 'function') {
        repaintLmsWhiteboardDocumentInk(LMS_WHITEBOARD_UI.currentStroke.parentDocumentId);
    }
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    if (typeof maybeEmitLmsWhiteboardStrokePreview === 'function') {
        maybeEmitLmsWhiteboardStrokePreview(resourceKey, LMS_WHITEBOARD_UI.currentStroke);
    }
}

function finishLmsWhiteboardDocumentStroke(resourceKey = '') {
    if (!LMS_WHITEBOARD_UI.drawing) return;
    const finishedStroke = LMS_WHITEBOARD_UI.currentStroke
        ? JSON.parse(JSON.stringify(LMS_WHITEBOARD_UI.currentStroke))
        : null;
    const eraserOps = LMS_WHITEBOARD_UI.eraserOps || [];
    LMS_WHITEBOARD_UI.drawing = false;
    LMS_WHITEBOARD_UI.eraserOps = [];
    if (LMS_WHITEBOARD_UI.tool === 'pen' && finishedStroke?.parentDocumentId) {
        saveLmsWhiteboardChange(resourceKey, 'pen-draw', { op: { element: finishedStroke } });
    } else if (LMS_WHITEBOARD_UI.tool === 'eraser' && eraserOps.length) {
        saveLmsWhiteboardChange(resourceKey, 'eraser-draw', { ops: eraserOps });
    }
    LMS_WHITEBOARD_UI.currentStroke = null;
}

window.getActiveLmsWhiteboardShell = getActiveLmsWhiteboardShell;
window.LMS_WHITEBOARD_THEME = LMS_WHITEBOARD_THEME;
window.renderLmsWhiteboardSection = renderLmsWhiteboardSection;
window.renderLmsPersonalWhiteboardScratch = renderLmsPersonalWhiteboardScratch;
window.refreshLmsPersonalWhiteboardScratchUi = refreshLmsPersonalWhiteboardScratchUi;
window.getLmsPersonalDashboardBoardHost = getLmsPersonalDashboardBoardHost;
window.finalizeLmsWhiteboardSectionRender = finalizeLmsWhiteboardSectionRender;
window.refreshLmsWhiteboardUi = refreshLmsWhiteboardUi;
window.repaintLmsWhiteboardWorkspace = repaintLmsWhiteboardWorkspace;
window.resetLmsWhiteboardViewport = resetLmsWhiteboardViewport;
window.toggleLmsWhiteboardFullscreen = toggleLmsWhiteboardFullscreen;
window.exitLmsWhiteboardFullscreen = exitLmsWhiteboardFullscreen;
