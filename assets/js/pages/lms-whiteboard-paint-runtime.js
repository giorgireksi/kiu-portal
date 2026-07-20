/* LMS whiteboard canvas paint / grid / element draw pipeline.
 * Peeled from lms-whiteboard-runtime.js. Loaded via LMS_WHITEBOARD_MODULE_URLS before runtime.
 * Free vars resolve at call time against globals from whiteboard runtime / sibling modules.
 */
function paintLmsWhiteboardCanvas(resourceKey = '', targetCanvas = null, options = {}) {
    const canvas = targetCanvas
        || getActiveLmsWhiteboardShell(resourceKey)?.querySelector('.lms-whiteboard-canvas')
        || document.querySelector('.lms-whiteboard-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const width = LMS_WHITEBOARD_LOGICAL_WIDTH;
    const height = LMS_WHITEBOARD_LOGICAL_HEIGHT;
    let dpr = 1;
    let displayScale = 1;
    let displayOffsetX = 0;
    let displayOffsetY = 0;
    if (options.logicalPixels === true) {
        canvas.width = width;
        canvas.height = height;
    } else {
        dpr = setupLmsWhiteboardCanvasHiDpi(canvas);
        const metrics = getLmsWhiteboardCanvasMetrics(canvas);
        displayScale = metrics.scale;
        displayOffsetX = metrics.offsetX;
        displayOffsetY = metrics.offsetY;
    }
    const useTransform = options.ignoreTransform !== true;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!options.logicalPixels) {
        ctx.fillStyle = options.background || LMS_WHITEBOARD_THEME.stageBg || LMS_WHITEBOARD_THEME.canvasBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (LMS_WHITEBOARD_UI.showGrid && options.includeGrid !== false) {
            drawLmsWhiteboardViewportGrid(ctx, canvas, dpr);
        }
    }
    ctx.setTransform(
        dpr * displayScale,
        0,
        0,
        dpr * displayScale,
        dpr * displayOffsetX,
        dpr * displayOffsetY
    );
    ctx.save();
    if (options.logicalPixels) {
        ctx.fillStyle = options.background || LMS_WHITEBOARD_THEME.canvasBg;
        ctx.fillRect(0, 0, width, height);
        if (LMS_WHITEBOARD_UI.showGrid && options.includeGrid !== false) {
            drawLmsWhiteboardGrid(ctx, width, height);
        }
    }
    if (useTransform) {
        ctx.translate(LMS_WHITEBOARD_UI.panX, LMS_WHITEBOARD_UI.panY);
        ctx.scale(LMS_WHITEBOARD_UI.zoom, LMS_WHITEBOARD_UI.zoom);
    }
    const elements = workspace.elements || [];
    elements.forEach(element => {
        if (LMS_WHITEBOARD_UI.inlineEdit?.elementId === element.id) return;
        drawLmsWhiteboardElement(ctx, element, workspace);
    });
    if (useTransform) {
        const selectedIds = getLmsWhiteboardSelectedIds();
        if (selectedIds.length > 1) {
            const selected = selectedIds
                .map(id => workspace.elements.find(item => item.id === id))
                .filter(Boolean);
            drawLmsWhiteboardGroupSelectionOutline(ctx, getLmsWhiteboardElementsBounds(selected));
        } else if (selectedIds.length === 1) {
            const selected = workspace.elements.find(item => item.id === selectedIds[0]);
            if (selected) {
                drawLmsWhiteboardSelectionOutline(ctx, selected);
            }
        }
        if (LMS_WHITEBOARD_UI.dragStart?.mode === 'marquee') {
            drawLmsWhiteboardMarquee(ctx, getLmsWhiteboardMarqueeDragRect(LMS_WHITEBOARD_UI.dragStart));
        }
    }
    if (useTransform && typeof drawLmsWhiteboardCollabOverlay === 'function') {
        drawLmsWhiteboardCollabOverlay(ctx);
    }
    ctx.restore();
    if (!targetCanvas) {
        const label = document.querySelector('[data-lms-whiteboard-zoom-label]');
        if (label) label.textContent = `${Math.round(LMS_WHITEBOARD_UI.zoom * 100)}%`;
        repositionLmsWhiteboardInlineEditor(canvas);
        const selectedIds = getLmsWhiteboardSelectedIds();
        const canEditNow = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(resourceKey);
        syncLmsWhiteboardSelectionToolbar(resourceKey, canEditNow);
        if (options.skipDocumentSync) {
            if (typeof repositionLmsWhiteboardDocumentViewers === 'function') repositionLmsWhiteboardDocumentViewers(canvas);
        } else if (typeof syncLmsWhiteboardDocumentLayer === 'function') {
            syncLmsWhiteboardDocumentLayer(resourceKey, canvas);
        } else if (typeof repositionLmsWhiteboardDocumentViewers === 'function') {
            repositionLmsWhiteboardDocumentViewers(canvas);
        }
        if (typeof paintLmsWhiteboardMinimap === 'function') paintLmsWhiteboardMinimap(resourceKey);
    }
    return canvas;
}

function drawLmsWhiteboardGrid(ctx, width, height) {
    ctx.save();
    const step = LMS_WHITEBOARD_GRID_STEP;
    for (let x = 0; x <= width; x += step) {
        for (let y = 0; y <= height; y += step) {
            const major = x % (step * 4) === 0 && y % (step * 4) === 0;
            ctx.fillStyle = major ? LMS_WHITEBOARD_THEME.gridDotMajor : LMS_WHITEBOARD_THEME.gridDot;
            ctx.beginPath();
            ctx.arc(x, y, major ? 1.6 : 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawLmsWhiteboardViewportGrid(ctx, canvas, dpr = 1) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const step = LMS_WHITEBOARD_GRID_STEP;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let x = 0; x <= width; x += step) {
        for (let y = 0; y <= height; y += step) {
            const major = x % (step * 4) === 0 && y % (step * 4) === 0;
            ctx.fillStyle = major ? LMS_WHITEBOARD_THEME.gridDotMajor : LMS_WHITEBOARD_THEME.gridDot;
            ctx.beginPath();
            ctx.arc(x, y, major ? 1.6 : 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawLmsWhiteboardElement(ctx, element = {}, workspace = null) {
    if (element.parentDocumentId) return;
    if (element.type === 'stroke') {
        const points = Array.isArray(element.points) ? element.points : [];
        if (points.length < 2) return;
        ctx.strokeStyle = element.color || '#f4d06f';
        ctx.lineWidth = element.width || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
        ctx.stroke();
        return;
    }
    if (element.type === 'sticky') {
        const color = element.color || '#fff3b0';
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = color;
        wbRoundRect(ctx, element.x, element.y, element.w, element.h, 8);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
        ctx.lineWidth = 1;
        wbRoundRect(ctx, element.x, element.y, element.w, element.h, 8);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        wbRoundRect(ctx, element.x + 2, element.y + 2, element.w - 4, 14, 6);
        ctx.fill();
        ctx.fillStyle = '#1f2937';
        const stickyFontSize = Number(element.fontSize) || LMS_WHITEBOARD_UI.stickyDefaults.fontSize;
        const lineHeight = stickyFontSize * 1.35;
        ctx.font = `${stickyFontSize}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.save();
        ctx.beginPath();
        wbRoundRect(ctx, element.x, element.y, element.w, element.h, 8);
        ctx.clip();
        wrapLmsWhiteboardText(
            ctx,
            element.text || '',
            element.x + 10,
            element.y + 24,
            element.w - 20,
            lineHeight,
            Math.max(0, element.h - 28)
        );
        ctx.restore();
        return;
    }
    if (element.type === 'text') {
        const isDraft = LMS_WHITEBOARD_UI.drawing && LMS_WHITEBOARD_UI.currentStroke?.id === element.id;
        const x = Math.min(element.x, element.x + (element.w || 0));
        const y = Math.min(element.y, element.y + (element.h || 0));
        const absW = Math.abs(element.w || LMS_WHITEBOARD_UI.textDefaults.w);
        const absH = Math.abs(element.h || LMS_WHITEBOARD_UI.textDefaults.h);
        if (isDraft) {
            ctx.save();
            ctx.strokeStyle = 'rgba(244, 208, 111, 0.95)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            wbRoundRect(ctx, x, y, absW, absH, 6);
            ctx.stroke();
            ctx.restore();
            return;
        }
        const w = Math.max(80, absW);
        const fontSize = Number(element.fontSize) || LMS_WHITEBOARD_UI.textDefaults.fontSize;
        ctx.save();
        ctx.fillStyle = element.color || '#f8fafc';
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        wrapLmsWhiteboardText(ctx, element.text || '', x + 4, y + 4, w - LMS_WHITEBOARD_TEXT_PADDING_X, fontSize * LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR);
        ctx.restore();
        return;
    }
    if (element.type === 'document') {
        const x = Math.min(element.x, element.x + (element.w || 0));
        const y = Math.min(element.y, element.y + (element.h || 0));
        const w = Math.abs(element.w || 0);
        const h = Math.abs(element.h || 0);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
        wbRoundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        wbRoundRect(ctx, x, y, w, h, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        const label = element.fileName || 'Document';
        ctx.fillText(label.length > 28 ? `${label.slice(0, 25)}…` : label, x + 12, y + h - 16);
        return;
    }
    if (isLmsWhiteboardShapeBoxElement(element)) {
        const isDraft = LMS_WHITEBOARD_UI.drawing && LMS_WHITEBOARD_UI.currentStroke?.id === element.id;
        const x = Math.min(element.x, element.x + (element.w || 0));
        const y = Math.min(element.y, element.y + (element.h || 0));
        const rawW = Math.abs(element.w || 0);
        const rawH = Math.abs(element.h || 0);
        const w = isDraft ? Math.max(rawW, 2) : rawW;
        const h = isDraft ? Math.max(rawH, 2) : rawH;
        const strokeColor = element.color || LMS_WHITEBOARD_UI.color;
        const strokeWidth = resolveLmsWhiteboardShapeStrokeWidth(element, w, h);
        const fillOpacity = isDraft ? Math.min(0.25, resolveLmsWhiteboardShapeFillOpacity(element)) : resolveLmsWhiteboardShapeFillOpacity(element);
        const fillColor = element.fill || LMS_WHITEBOARD_UI.shapeDefaults.fill;
        const paintBoxPath = () => {
            if (element.type === 'ellipse') {
                ctx.beginPath();
                ctx.ellipse(x + (w / 2), y + (h / 2), w / 2, h / 2, 0, 0, Math.PI * 2);
            } else {
                const radius = element.type === 'rect' ? Math.min(Number(element.cornerRadius) || 0, w / 2, h / 2) : 0;
                wbRoundRect(ctx, x, y, w, h, radius);
            }
        };
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (isDraft) ctx.setLineDash([5, 4]);
        if (fillOpacity > 0 && fillColor) {
            ctx.fillStyle = colorWithLmsWhiteboardOpacity(fillColor, fillOpacity);
            paintBoxPath();
            ctx.fill();
        }
        paintBoxPath();
        ctx.stroke();
        if (!isDraft && element.type === 'grid') {
            const rows = Math.max(1, Math.min(20, Number(element.rows) || LMS_WHITEBOARD_UI.gridDefaults.rows));
            const cols = Math.max(1, Math.min(20, Number(element.cols) || LMS_WHITEBOARD_UI.gridDefaults.cols));
            const innerWidth = Math.max(1, strokeWidth * 0.5);
            ctx.lineWidth = innerWidth;
            ctx.beginPath();
            for (let col = 1; col < cols; col += 1) {
                const lineX = x + ((w / cols) * col);
                ctx.moveTo(lineX, y);
                ctx.lineTo(lineX, y + h);
            }
            for (let row = 1; row < rows; row += 1) {
                const lineY = y + ((h / rows) * row);
                ctx.moveTo(x, lineY);
                ctx.lineTo(x + w, lineY);
            }
            ctx.stroke();
        }
        ctx.restore();
        return;
    }
    if (isLmsWhiteboardShapeLineElement(element)) {
        const isDraft = LMS_WHITEBOARD_UI.drawing && LMS_WHITEBOARD_UI.currentStroke?.id === element.id;
        const x1 = Number(element.x) || 0;
        const y1 = Number(element.y) || 0;
        const x2 = Number(element.x2) || 0;
        const y2 = Number(element.y2) || 0;
        const strokeColor = element.color || LMS_WHITEBOARD_UI.color;
        const strokeWidth = Number(element.width) || LMS_WHITEBOARD_UI.strokeWidth;
        const segmentLength = Math.hypot(x2 - x1, y2 - y1) || 1;
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;
        ctx.lineWidth = isDraft ? Math.min(2, strokeWidth) : strokeWidth;
        ctx.setLineDash(isDraft ? [5, 4] : []);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (element.type === 'arrow') {
            const headSize = Math.min(Math.max(8, strokeWidth * 2.5), segmentLength * 0.35);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(
                x2 - (headSize * Math.cos(angle - (Math.PI / 6))),
                y2 - (headSize * Math.sin(angle - (Math.PI / 6)))
            );
            ctx.lineTo(
                x2 - (headSize * Math.cos(angle + (Math.PI / 6))),
                y2 - (headSize * Math.sin(angle + (Math.PI / 6)))
            );
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        return;
    }
    if (element.type === 'image') {
        const x = Math.min(element.x, element.x + (element.w || 0));
        const y = Math.min(element.y, element.y + (element.h || 0));
        const w = Math.abs(element.w || 0);
        const h = Math.abs(element.h || 0);
        const img = getLmsWhiteboardCachedImage(element);
        if (img?.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, w, h);
        } else {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
            ctx.strokeRect(x, y, w, h);
        }
    }
}



window.paintLmsWhiteboardCanvas = paintLmsWhiteboardCanvas;
window.drawLmsWhiteboardGrid = drawLmsWhiteboardGrid;
window.drawLmsWhiteboardViewportGrid = drawLmsWhiteboardViewportGrid;
window.drawLmsWhiteboardElement = drawLmsWhiteboardElement;
