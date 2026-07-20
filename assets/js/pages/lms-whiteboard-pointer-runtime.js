/* LMS whiteboard pointer / wheel / touch / gesture binding pipeline.
 * Peeled from lms-whiteboard-runtime.js. Loaded via LMS_WHITEBOARD_MODULE_URLS before runtime.
 * Free vars resolve at call time against globals from whiteboard runtime / sibling modules.
 */
function shouldIgnoreLmsWhiteboardStagePointer(event = null) {
    return Boolean(event?.target?.closest?.(
        '.lms-whiteboard-zoom, [data-lms-whiteboard-command-bar], .lms-whiteboard-minimap-shell, '
        + '.lms-whiteboard-collab-hud, .lms-whiteboard-selection-toolbar, [data-lms-whiteboard-inline-editor], '
        + 'button, input, textarea, select, label, .lms-whiteboard-drop-overlay'
    ));
}

function isLmsWhiteboardStageDrawableTarget(event = null, stage = null, canvas = null) {
    const target = event?.target;
    if (!target || !stage || !canvas) return false;
    if (target === canvas || target === stage || canvas.contains(target)) return true;
    if (!stage.contains(target)) return false;
    return !target.closest?.(
        '.lms-whiteboard-zoom, [data-lms-whiteboard-command-bar], .lms-whiteboard-minimap-shell, '
        + '.lms-whiteboard-collab-hud, .lms-whiteboard-selection-toolbar, [data-lms-whiteboard-inline-editor], '
        + 'button, input, textarea, select, label, .lms-whiteboard-drop-overlay, '
        + '.lms-whiteboard-document-view, [data-lms-whiteboard-document-ink]'
    );
}

function bindLmsWhiteboardStagePointerHandlers(stage, canvas, resourceKey = '', canEdit = false) {
    if (!stage || !canvas) return;
    const pointerId = canvas.dataset.lmsWhiteboardPointerId || String(Date.now());
    canvas.dataset.lmsWhiteboardPointerId = pointerId;
    if (stage.__lmsWhiteboardPointerHandlers?.pointerId === pointerId) return;
    if (stage.__lmsWhiteboardPointerHandlers) {
        const prev = stage.__lmsWhiteboardPointerHandlers;
        stage.removeEventListener('pointerdown', prev.onDown);
        stage.removeEventListener('pointermove', prev.onMove);
        stage.removeEventListener('pointerup', prev.onUp);
        stage.removeEventListener('pointerleave', prev.onLeave);
        stage.removeEventListener('pointercancel', prev.onCancel);
        stage.removeEventListener('dblclick', prev.onDblClick);
    }
    const onDown = (event) => {
        if (shouldIgnoreLmsWhiteboardStagePointer(event)) return;
        if (!isLmsWhiteboardStageDrawableTarget(event, stage, canvas)) return;
        onLmsWhiteboardPointerDown(event, resourceKey, canEdit, canvas, canvas);
    };
    const onMove = (event) => {
        if (!isLmsWhiteboardBoardGestureActive()
            && !isLmsWhiteboardStageDrawableTarget(event, stage, canvas)) return;
        onLmsWhiteboardPointerMove(event, resourceKey, canEdit, canvas);
    };
    const onUp = (event) => {
        if (LMS_WHITEBOARD_UI.gestureWindowListeners) {
            if (event?.pointerId != null
                && LMS_WHITEBOARD_UI.gestureWindowListeners.pointerId != null
                && event.pointerId !== LMS_WHITEBOARD_UI.gestureWindowListeners.pointerId) return;
            detachLmsWhiteboardGestureWindowListeners();
        }
        onLmsWhiteboardPointerUp(event, resourceKey, canEdit, canvas, canvas);
    };
    const onLeave = (event) => {
        refreshLmsWhiteboardPointerCursor(canvas, { point: null });
        if (!isLmsWhiteboardBoardGestureActive() && event.buttons === 0) {
            onLmsWhiteboardPointerUp(event, resourceKey, canEdit, canvas, canvas);
        }
    };
    const onCancel = (event) => {
        if (isLmsWhiteboardBoardGestureActive()) {
            cancelLmsWhiteboardActiveDraw(resourceKey, canvas);
            return;
        }
        onLmsWhiteboardPointerUp(event, resourceKey, canEdit, canvas, canvas);
    };
    const onDblClick = (event) => {
        if (shouldIgnoreLmsWhiteboardStagePointer(event)) return;
        if (!isLmsWhiteboardStageDrawableTarget(event, stage, canvas)) return;
        onLmsWhiteboardDoubleClick(event, resourceKey, canEdit, canvas);
    };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointercancel', onCancel);
    stage.addEventListener('dblclick', onDblClick);
    stage.addEventListener('contextmenu', (event) => event.preventDefault());
    stage.__lmsWhiteboardPointerHandlers = { pointerId, onDown, onMove, onUp, onLeave, onCancel, onDblClick };
    stage.dataset.lmsWhiteboardPointerCanvas = pointerId;
    stage.dataset.lmsWhiteboardPointerBound = '1';
}


function onLmsWhiteboardWheel(event, resourceKey, canvas) {
    if (!canvas || LMS_WHITEBOARD_UI.inlineEdit) return;
    const tool = LMS_WHITEBOARD_UI.tool;
    if (tool === 'select' && event.target.closest?.('[data-lms-whiteboard-document-view]')) {
        return;
    }
    event.preventDefault();
    const point = canvasToWorld(canvas, event.clientX, event.clientY);
    const metrics = getLmsWhiteboardCanvasMetrics(canvas);
    const screenX = (event.clientX - metrics.rect.left - metrics.offsetX) / metrics.scaleX;
    const screenY = (event.clientY - metrics.rect.top - metrics.offsetY) / metrics.scaleY;
    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.max(0.4, Math.min(2.5, LMS_WHITEBOARD_UI.zoom * factor));
    LMS_WHITEBOARD_UI.panX = screenX - point.x * nextZoom;
    LMS_WHITEBOARD_UI.panY = screenY - point.y * nextZoom;
    LMS_WHITEBOARD_UI.zoom = nextZoom;
    const key = resourceKey || LMS_WHITEBOARD_UI.boundKey;
    paintLmsWhiteboardCanvas(key);
    if (typeof maybeEmitLmsWhiteboardViewport === 'function') maybeEmitLmsWhiteboardViewport(key);
}

function onLmsWhiteboardTouchStart(event, resourceKey, canvas) {
    if (event.touches.length !== 2 || LMS_WHITEBOARD_UI.inlineEdit) return;
    const [a, b] = event.touches;
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const midpoint = canvasToWorld(canvas, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    LMS_WHITEBOARD_UI.pinch = { distance, zoom: LMS_WHITEBOARD_UI.zoom, midpoint, resourceKey };
}

function onLmsWhiteboardTouchMove(event, resourceKey, canvas) {
    const pinch = LMS_WHITEBOARD_UI.pinch;
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    const [a, b] = event.touches;
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch.distance) return;
    const nextZoom = Math.max(0.4, Math.min(2.5, pinch.zoom * (distance / pinch.distance)));
    const metrics = getLmsWhiteboardCanvasMetrics(canvas);
    const screenX = (((a.clientX + b.clientX) / 2) - metrics.rect.left - metrics.offsetX) / metrics.scaleX;
    const screenY = (((a.clientY + b.clientY) / 2) - metrics.rect.top - metrics.offsetY) / metrics.scaleY;
    LMS_WHITEBOARD_UI.panX = screenX - pinch.midpoint.x * nextZoom;
    LMS_WHITEBOARD_UI.panY = screenY - pinch.midpoint.y * nextZoom;
    LMS_WHITEBOARD_UI.zoom = nextZoom;
    paintLmsWhiteboardCanvas(resourceKey || pinch.resourceKey || LMS_WHITEBOARD_UI.boundKey);
}

function onLmsWhiteboardTouchEnd(event) {
    if (event.touches.length < 2) LMS_WHITEBOARD_UI.pinch = null;
}

function onLmsWhiteboardPointerDown(event, resourceKey, canEdit, canvas, captureTarget = null) {
    // Recompute live: canvas is bound once and not rebuilt on session start, so the captured bool goes stale.
    canEdit = typeof canEditLmsWhiteboard === 'function' ? canEditLmsWhiteboard(resourceKey) : canEdit;
    if (event.target.closest?.('[data-lms-whiteboard-inline-editor]')) return;
    if (LMS_WHITEBOARD_UI.inlineEdit) closeLmsWhiteboardInlineEditor(true);
    const shell = canvas?.closest?.('.lms-whiteboard-shell');
    if (shell) focusLmsWhiteboardKeyboardTarget(shell);
    const point = canvasToWorld(canvas, event.clientX, event.clientY);
    LMS_WHITEBOARD_UI.lastPointer = point;
    LMS_WHITEBOARD_UI.lastGesturePointerUpId = null;
    // Keep move/up on the canvas for the whole drag (shape/pen/select), like pan does — otherwise a
    // gesture handoff or repaint drops the moves and the shape commits at its 1x1 minimum.
    const captureEl = canvas || captureTarget;
    if (event.pointerId != null) captureEl?.setPointerCapture?.(event.pointerId);
    const wantsPan = event.button === 1
        || event.button === 2
        || LMS_WHITEBOARD_UI.tool === 'hand';
    if (wantsPan) {
        startLmsWhiteboardPan(event, canvas);
        beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
        return;
    }
    if (!canEdit) {
        if (LMS_WHITEBOARD_UI.tool !== 'select' && LMS_WHITEBOARD_UI.tool !== 'hand') alert('Editing is locked by instructor.');
        if (LMS_WHITEBOARD_UI.tool !== 'hand') return;
    }
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    if (LMS_WHITEBOARD_UI.tool === 'pen') {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        LMS_WHITEBOARD_UI.drawing = true;
        LMS_WHITEBOARD_UI.currentStroke = {
            type: 'stroke', id: makeLmsWhiteboardId('stroke'), points: [[point.x, point.y]],
            color: LMS_WHITEBOARD_UI.color, width: LMS_WHITEBOARD_UI.strokeWidth, authorId: getLmsWhiteboardActorId()
        };
        beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
        workspace.elements.push(LMS_WHITEBOARD_UI.currentStroke);
        markLmsWhiteboardDraftDirty(workspace);
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'eraser') {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
        eraseLmsWhiteboardAtPoint(resourceKey, point);
        LMS_WHITEBOARD_UI.drawing = true;
        markLmsWhiteboardDraftDirty(workspace);
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'sticky') {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        const snapped = snapLmsWhiteboardPoint(point);
        const sticky = {
            type: 'sticky', id: makeLmsWhiteboardId('sticky'), x: snapped.x, y: snapped.y,
            w: LMS_WHITEBOARD_UI.stickyDefaults.w, h: LMS_WHITEBOARD_UI.stickyDefaults.h,
            fontSize: LMS_WHITEBOARD_UI.stickyDefaults.fontSize,
            text: 'New note', color: LMS_WHITEBOARD_UI.stickyDefaults.color, authorId: getLmsWhiteboardActorId()
        };
        workspace.elements.push(sticky);
        paintLmsWhiteboardCanvas(resourceKey);
        openLmsWhiteboardInlineEditor({ resourceKey, elementId: sticky.id, mode: 'edit-sticky', canvas, isNew: false });
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'text') {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        const snapped = snapLmsWhiteboardPoint(point);
        LMS_WHITEBOARD_UI.drawing = true;
        LMS_WHITEBOARD_UI.currentStroke = {
            type: 'text',
            id: makeLmsWhiteboardId('text'),
            x: snapped.x,
            y: snapped.y,
            w: 1,
            h: 1,
            text: '',
            fontSize: LMS_WHITEBOARD_UI.textDefaults.fontSize,
            color: LMS_WHITEBOARD_UI.textDefaults.color,
            authorId: getLmsWhiteboardActorId()
        };
        beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
        workspace.elements.push(LMS_WHITEBOARD_UI.currentStroke);
        markLmsWhiteboardDraftDirty(workspace);
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        return;
    }
    if (LMS_WHITEBOARD_SHAPE_DRAW_TOOLS.includes(LMS_WHITEBOARD_UI.tool)) {
        recordLmsWhiteboardHistoryGesture(resourceKey);
        LMS_WHITEBOARD_UI.drawing = true;
        LMS_WHITEBOARD_UI.drawTool = LMS_WHITEBOARD_UI.tool;
        LMS_WHITEBOARD_UI.currentStroke = buildLmsWhiteboardShapeDraft(LMS_WHITEBOARD_UI.tool, point);
        beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
        workspace.elements.push(LMS_WHITEBOARD_UI.currentStroke);
        markLmsWhiteboardDraftDirty(workspace);
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'select') {
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        const selectedIds = getLmsWhiteboardSelectedIds();
        if (selectedIds.length === 1 && canEdit) {
            const selected = workspace.elements.find(item => item.id === selectedIds[0]);
            const handle = selected ? hitTestLmsWhiteboardResizeZone(point, selected) : '';
            if (handle) {
                recordLmsWhiteboardHistoryGesture(resourceKey);
                LMS_WHITEBOARD_UI.dragStart = {
                    mode: 'resize',
                    handle,
                    x: point.x,
                    y: point.y,
                    element: JSON.parse(JSON.stringify(selected))
                };
                beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
                return;
            }
        }
        const hit = findLmsWhiteboardElementAtPoint(resourceKey, point);
        const current = getLmsWhiteboardSelectedIds();
        if (event.shiftKey && hit) {
            const next = current.includes(hit.id)
                ? current.filter(id => id !== hit.id)
                : [...current, hit.id];
            setLmsWhiteboardSelection(next);
            LMS_WHITEBOARD_UI.dragStart = null;
            return;
        }
        if (hit && current.includes(hit.id) && current.length > 1) {
            if (typeof canMoveLmsWhiteboardElement === 'function' && !canMoveLmsWhiteboardElement(hit, resourceKey)) return;
            recordLmsWhiteboardHistoryGesture(resourceKey);
            LMS_WHITEBOARD_UI.dragStart = buildLmsWhiteboardMoveDragStart(resourceKey, point, hit, current);
            syncLmsWhiteboardPropsFromSelection(hit);
        } else if (hit) {
            if (typeof canMoveLmsWhiteboardElement === 'function' && !canMoveLmsWhiteboardElement(hit, resourceKey)) {
                setLmsWhiteboardSelection([hit.id], { skipPaint: true });
                paintLmsWhiteboardCanvas(resourceKey);
                return;
            }
            setLmsWhiteboardSelection([hit.id], { skipPaint: true });
            recordLmsWhiteboardHistoryGesture(resourceKey);
            LMS_WHITEBOARD_UI.dragStart = buildLmsWhiteboardMoveDragStart(resourceKey, point, hit);
            syncLmsWhiteboardPropsFromSelection(hit);
        } else {
            LMS_WHITEBOARD_UI.dragStart = {
                mode: 'marquee',
                x: point.x,
                y: point.y,
                x2: point.x,
                y2: point.y,
                additive: Boolean(event.shiftKey)
            };
        }
        if (LMS_WHITEBOARD_UI.dragStart) {
            beginLmsWhiteboardCanvasGesture(resourceKey, event, canEdit, canvas);
        }
        paintLmsWhiteboardCanvas(resourceKey);
    }
}

function onLmsWhiteboardPointerMove(event, resourceKey, canEdit, canvas) {
    canEdit = typeof canEditLmsWhiteboard === 'function' ? canEditLmsWhiteboard(resourceKey) : canEdit;
    const point = canvasToWorld(canvas, event.clientX, event.clientY);
    LMS_WHITEBOARD_UI.lastPointer = point;
    if (typeof trackLmsWhiteboardCollabPointer === 'function') trackLmsWhiteboardCollabPointer(resourceKey, point);
    if (LMS_WHITEBOARD_UI.panning && LMS_WHITEBOARD_UI.dragStart) {
        LMS_WHITEBOARD_UI.panX = LMS_WHITEBOARD_UI.dragStart.panX + (event.clientX - LMS_WHITEBOARD_UI.dragStart.x);
        LMS_WHITEBOARD_UI.panY = LMS_WHITEBOARD_UI.dragStart.panY + (event.clientY - LMS_WHITEBOARD_UI.dragStart.y);
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        refreshLmsWhiteboardPointerCursor(canvas, { resourceKey, point });
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.mode === 'marquee') {
        LMS_WHITEBOARD_UI.dragStart.x2 = point.x;
        LMS_WHITEBOARD_UI.dragStart.y2 = point.y;
        paintLmsWhiteboardCanvas(resourceKey);
        refreshLmsWhiteboardPointerCursor(canvas, { resourceKey, point });
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.mode === 'resize') {
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        const element = workspace.elements.find(item => item.id === LMS_WHITEBOARD_UI.dragStart.element?.id);
        if (element) {
            const resizeOptions = {
                aspectLock: shouldLmsWhiteboardResizeAspectLock(element, event.shiftKey),
                local: Boolean(LMS_WHITEBOARD_UI.dragStart.documentLocal)
            };
            applyLmsWhiteboardElementResize(
                element,
                LMS_WHITEBOARD_UI.dragStart.element,
                LMS_WHITEBOARD_UI.dragStart.handle,
                point,
                resizeOptions
            );
            if (LMS_WHITEBOARD_UI.dragStart.documentLocal && element.parentDocumentId) {
                if (typeof repaintLmsWhiteboardDocumentInk === 'function') {
                    repaintLmsWhiteboardDocumentInk(element.parentDocumentId);
                }
            } else {
                paintLmsWhiteboardCanvas(resourceKey, null, { skipDocumentSync: true });
                if (typeof repositionLmsWhiteboardDocumentViewers === 'function') repositionLmsWhiteboardDocumentViewers(canvas);
            }
            if (LMS_WHITEBOARD_UI.inlineEdit?.elementId === element.id) {
                repositionLmsWhiteboardInlineEditor(canvas);
            }
        }
        refreshLmsWhiteboardPointerCursor(canvas, { resourceKey, point });
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.mode === 'move') {
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        const dx = point.x - LMS_WHITEBOARD_UI.dragStart.x;
        const dy = point.y - LMS_WHITEBOARD_UI.dragStart.y;
        const moveIds = LMS_WHITEBOARD_UI.dragStart.selectedIds?.length
            ? LMS_WHITEBOARD_UI.dragStart.selectedIds
            : [LMS_WHITEBOARD_UI.dragStart.element?.id].filter(Boolean);
        moveIds.forEach(id => {
            const element = workspace.elements.find(item => item.id === id);
            const base = LMS_WHITEBOARD_UI.dragStart.elements?.[id] || LMS_WHITEBOARD_UI.dragStart.element;
            if (!element || !base) return;
            if (element.parentDocumentId) {
                const doc = workspace.elements.find(item => item.id === element.parentDocumentId);
                const docBounds = doc && typeof getLmsWhiteboardElementBounds === 'function'
                    ? getLmsWhiteboardElementBounds(doc)
                    : null;
                const docW = Math.abs(doc?.w || 1);
                const docH = Math.abs(doc?.h || 1);
                const ldx = docBounds ? dx * (docW / Math.abs(docBounds.w || docW)) : dx;
                const ldy = docBounds ? dy * (docH / Math.abs(docBounds.h || docH)) : dy;
                if (element.type === 'stroke' && Array.isArray(base.points)) {
                    element.points = base.points.map(([x, y]) => [x + ldx, y + ldy]);
                } else {
                    element.x = (base.x || 0) + ldx;
                    element.y = (base.y || 0) + ldy;
                }
                return;
            }
            if (element.type === 'stroke' && Array.isArray(base.points)) {
                element.points = base.points.map(([x, y]) => [
                    snapLmsWhiteboardCoord(x + dx),
                    snapLmsWhiteboardCoord(y + dy)
                ]);
            } else if (['sticky', 'text', 'image', 'document', ...LMS_WHITEBOARD_SHAPE_BOX_TYPES].includes(element.type)) {
                element.x = snapLmsWhiteboardCoord((base.x || 0) + dx);
                element.y = snapLmsWhiteboardCoord((base.y || 0) + dy);
            } else if (isLmsWhiteboardShapeLineElement(element)) {
                element.x = snapLmsWhiteboardCoord((base.x || 0) + dx);
                element.y = snapLmsWhiteboardCoord((base.y || 0) + dy);
                element.x2 = snapLmsWhiteboardCoord((base.x2 || 0) + dx);
                element.y2 = snapLmsWhiteboardCoord((base.y2 || 0) + dy);
            }
        });
        const movedDocuments = moveIds.some(id => {
            const element = workspace.elements.find(item => item.id === id);
            return element?.type === 'document';
        });
        const movedDocumentChildren = moveIds.some(id => {
            const element = workspace.elements.find(item => item.id === id);
            return Boolean(element?.parentDocumentId);
        });
        paintLmsWhiteboardCanvas(resourceKey, null, { skipDocumentSync: movedDocuments });
        if (movedDocuments && typeof repositionLmsWhiteboardDocumentViewers === 'function') {
            repositionLmsWhiteboardDocumentViewers(canvas);
        }
        if (movedDocumentChildren) {
            const parentIds = new Set(moveIds.map(id => workspace.elements.find(item => item.id === id)?.parentDocumentId).filter(Boolean));
            parentIds.forEach(parentId => {
                if (typeof repaintLmsWhiteboardDocumentInk === 'function') repaintLmsWhiteboardDocumentInk(parentId);
            });
        }
        refreshLmsWhiteboardPointerCursor(canvas, { resourceKey, point });
        return;
    }
    if (!canEdit || !LMS_WHITEBOARD_UI.drawing) {
        refreshLmsWhiteboardPointerCursor(canvas, { resourceKey, point });
        return;
    }
    const activeTool = getLmsWhiteboardActiveDrawTool();
    const draft = resolveLmsWhiteboardLiveDraftElement(resourceKey);
    if (draft) LMS_WHITEBOARD_UI.currentStroke = draft;
    if (activeTool === 'pen' && draft) {
        draft.points.push([point.x, point.y]);
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        if (typeof maybeEmitLmsWhiteboardStrokePreview === 'function') {
            maybeEmitLmsWhiteboardStrokePreview(resourceKey, draft);
        }
        return;
    }
    if (activeTool === 'eraser') {
        eraseLmsWhiteboardAtPoint(resourceKey, point);
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        return;
    }
    if (activeTool === 'text' && draft) {
        const snapped = snapLmsWhiteboardPoint(point);
        draft.w = snapped.x - draft.x;
        draft.h = snapped.y - draft.y;
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        return;
    }
    if (['rect', 'roundRect', 'ellipse', 'grid'].includes(activeTool) && draft) {
        const snapped = snapLmsWhiteboardPoint(point);
        draft.w = snapped.x - draft.x;
        draft.h = snapped.y - draft.y;
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
        return;
    }
    if (['line', 'arrow'].includes(activeTool) && draft) {
        const snapped = snapLmsWhiteboardPoint(point);
        draft.x2 = snapped.x;
        draft.y2 = snapped.y;
        paintLmsWhiteboardCanvas(resourceKey, canvas, { skipDocumentSync: true });
    }
}

function onLmsWhiteboardPointerUp(event, resourceKey, canEdit, canvas, captureTarget = null) {
    const pointerId = event?.pointerId;
    if (pointerId != null && LMS_WHITEBOARD_UI.lastGesturePointerUpId === pointerId) return;
    if (LMS_WHITEBOARD_UI.gestureWindowListeners) {
        if (pointerId != null
            && LMS_WHITEBOARD_UI.gestureWindowListeners.pointerId != null
            && pointerId !== LMS_WHITEBOARD_UI.gestureWindowListeners.pointerId) return;
        detachLmsWhiteboardGestureWindowListeners();
    }
    if (pointerId != null) LMS_WHITEBOARD_UI.lastGesturePointerUpId = pointerId;
    const captureEl = canvas || captureTarget;
    try {
    if (event?.pointerId != null) captureEl?.releasePointerCapture?.(event.pointerId);
    if (LMS_WHITEBOARD_UI.panning) {
        endLmsWhiteboardPan(canvas, event);
        saveLmsWhiteboardLocalViewport(resourceKey);
        if (typeof maybeEmitLmsWhiteboardViewport === 'function') maybeEmitLmsWhiteboardViewport(resourceKey);
        return;
    }
    if (LMS_WHITEBOARD_UI.drawing) {
        const tool = LMS_WHITEBOARD_UI.drawTool || LMS_WHITEBOARD_UI.tool;
        const finishedStroke = LMS_WHITEBOARD_UI.currentStroke
            ? JSON.parse(JSON.stringify(LMS_WHITEBOARD_UI.currentStroke))
            : null;
        const eraserOps = LMS_WHITEBOARD_UI.eraserOps || [];
        LMS_WHITEBOARD_UI.drawing = false;
        LMS_WHITEBOARD_UI.eraserOps = [];
        if (tool === 'text' && finishedStroke) {
            const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
            const element = workspace.elements.find(item => item.id === finishedStroke.id);
            if (element) {
                finalizeLmsWhiteboardTextBox(element);
                saveLmsWhiteboardChange(resourceKey, 'text-draw', { op: { element } });
                setLmsWhiteboardSelection([element.id], { skipPaint: true });
                paintLmsWhiteboardCanvas(resourceKey);
                openLmsWhiteboardInlineEditor({ resourceKey, elementId: element.id, mode: 'edit-text', canvas, isNew: true });
            }
        } else if (['rect', 'roundRect', 'ellipse', 'grid'].includes(tool) && finishedStroke) {
            const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
            const element = workspace.elements.find(item => item.id === finishedStroke.id);
            if (element && finalizeLmsWhiteboardBoxShape(element)) {
                saveLmsWhiteboardChange(resourceKey, 'shape-draw', { op: { element } });
                setLmsWhiteboardSelection([element.id], { skipPaint: true });
                paintLmsWhiteboardCanvas(resourceKey);
            } else if (element) {
                workspace.elements = workspace.elements.filter(item => item.id !== element.id);
                paintLmsWhiteboardCanvas(resourceKey);
            }
        } else if (['line', 'arrow'].includes(tool) && finishedStroke) {
            const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
            const element = workspace.elements.find(item => item.id === finishedStroke.id);
            if (element && finalizeLmsWhiteboardLineShape(element)) {
                saveLmsWhiteboardChange(resourceKey, 'shape-draw', { op: { element } });
                setLmsWhiteboardSelection([element.id], { skipPaint: true });
                paintLmsWhiteboardCanvas(resourceKey);
            } else if (element) {
                workspace.elements = workspace.elements.filter(item => item.id !== element.id);
                paintLmsWhiteboardCanvas(resourceKey);
            }
        } else if (tool === 'pen' && finishedStroke) {
            const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
            const liveElement = workspace.elements.find(item => item.id === finishedStroke.id) || finishedStroke;
            saveLmsWhiteboardChange(resourceKey, 'pen-draw', { op: { element: { ...liveElement } } });
            paintLmsWhiteboardCanvas(resourceKey);
        } else if (tool === 'eraser' && eraserOps.length) {
            saveLmsWhiteboardChange(resourceKey, 'eraser-draw', { ops: eraserOps });
            paintLmsWhiteboardCanvas(resourceKey);
        }
        LMS_WHITEBOARD_UI.currentStroke = null;
        LMS_WHITEBOARD_UI.drawTool = '';
        setLmsWhiteboardGestureState(resourceKey, false);
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.mode === 'marquee') {
        const dragStart = LMS_WHITEBOARD_UI.dragStart;
        LMS_WHITEBOARD_UI.dragStart = null;
        if (isLmsWhiteboardMarqueeDragSignificant(dragStart)) {
            const rect = getLmsWhiteboardMarqueeDragRect(dragStart);
            const ids = findLmsWhiteboardElementsInMarquee(resourceKey, rect);
            setLmsWhiteboardSelection(ids, { skipPaint: true, additive: Boolean(dragStart.additive) });
        } else {
            setLmsWhiteboardSelection([], { skipPaint: true });
        }
        paintLmsWhiteboardCanvas(resourceKey, canvas);
        return;
    }
    if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart) {
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        const dragStart = LMS_WHITEBOARD_UI.dragStart;
        if (dragStart.element) {
            const reason = dragStart.mode === 'resize' ? 'resize-element' : 'move-element';
            if (dragStart.mode === 'move' && dragStart.selectedIds?.length > 1) {
                const ops = dragStart.selectedIds.map(id => {
                    const element = workspace.elements.find(item => item.id === id);
                    return element ? { element } : null;
                }).filter(Boolean);
                if (ops.length) saveLmsWhiteboardChange(resourceKey, reason, { ops, forceFullSync: true });
            } else {
                const element = workspace.elements.find(item => item.id === dragStart.element.id);
                if (element) {
                    if (dragStart.mode === 'resize') {
                        syncLmsWhiteboardElementDefaults(element);
                        if (element.type === 'document') {
                            const base = dragStart.element || {};
                            scaleLmsWhiteboardDocumentStrokePoints(
                                resourceKey,
                                element.id,
                                base.w,
                                base.h,
                                element.w,
                                element.h
                            );
                        }
                    }
                    saveLmsWhiteboardChange(resourceKey, reason, { op: { element } });
                }
            }
        }
        LMS_WHITEBOARD_UI.historyGestureRecorded = false;
        LMS_WHITEBOARD_UI.dragStart = null;
        paintLmsWhiteboardCanvas(resourceKey, canvas);
    }
    } finally {
        setLmsWhiteboardGestureState(resourceKey, false);
    }
}

function onLmsWhiteboardDoubleClick(event, resourceKey, canEdit, canvas) {
    canEdit = typeof canEditLmsWhiteboard === 'function' ? canEditLmsWhiteboard(resourceKey) : canEdit;
    if (!canEdit) return;
    const point = canvasToWorld(canvas, event.clientX, event.clientY);
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const hit = findLmsWhiteboardElementAtPoint(resourceKey, point);
    if (!hit) return;
    if (!['sticky', 'text'].includes(hit.type)) return;
    if (typeof canEditLmsWhiteboardElement === 'function' && !canEditLmsWhiteboardElement(hit, resourceKey)) return;
    event.preventDefault();
    openLmsWhiteboardInlineEditor({
        resourceKey,
        elementId: hit.id,
        mode: hit.type === 'sticky' ? 'edit-sticky' : 'edit-text',
        canvas,
        isNew: false
    });
}


window.shouldIgnoreLmsWhiteboardStagePointer = shouldIgnoreLmsWhiteboardStagePointer;
window.isLmsWhiteboardStageDrawableTarget = isLmsWhiteboardStageDrawableTarget;
window.bindLmsWhiteboardStagePointerHandlers = bindLmsWhiteboardStagePointerHandlers;
window.onLmsWhiteboardWheel = onLmsWhiteboardWheel;
window.onLmsWhiteboardTouchStart = onLmsWhiteboardTouchStart;
window.onLmsWhiteboardTouchMove = onLmsWhiteboardTouchMove;
window.onLmsWhiteboardTouchEnd = onLmsWhiteboardTouchEnd;
window.onLmsWhiteboardPointerDown = onLmsWhiteboardPointerDown;
window.onLmsWhiteboardPointerMove = onLmsWhiteboardPointerMove;
window.onLmsWhiteboardPointerUp = onLmsWhiteboardPointerUp;
window.onLmsWhiteboardDoubleClick = onLmsWhiteboardDoubleClick;
