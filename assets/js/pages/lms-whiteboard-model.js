/* Pure LMS whiteboard geometry / color / text-layout helpers.
 * Loaded before lms-whiteboard-runtime.js (see LMS_WHITEBOARD_MODULE_URLS).
 * ESM leaf + classic bridge for defer/lazy consumers.
 */
'use strict';

const LMS_WHITEBOARD_SHAPE_BOX_TYPES = ['rect', 'ellipse', 'grid'];
const LMS_WHITEBOARD_SHAPE_LINE_TYPES = ['line', 'arrow'];
const LMS_WHITEBOARD_RESIZABLE_TYPES = ['sticky', 'text', 'image', 'document', 'rect', 'ellipse', 'grid'];
const LMS_WHITEBOARD_GRID_STEP = 24;
const LMS_WHITEBOARD_TEXT_PADDING_X = 8;
const LMS_WHITEBOARD_TEXT_PADDING_Y = 8;
const LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR = 1.35;
let lmsWhiteboardTextMeasureCtx = null;

function getLmsWhiteboardUiState() {
    if (typeof window !== 'undefined' && window.LMS_WHITEBOARD_UI) return window.LMS_WHITEBOARD_UI;
    return { snapToGrid: false, zoom: 1, textDefaults: { fontSize: 18 } };
}

function wbRoundRect(ctx, x, y, w, h, radius = 8) {
    const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function colorWithLmsWhiteboardOpacity(color = '#000000', opacity = 1) {
    const raw = String(color || '#000000').trim();
    const alpha = Math.max(0, Math.min(1, Number(opacity) || 0));
    if (raw.startsWith('rgba(')) return raw;
    if (raw.startsWith('rgb(')) {
        const parts = raw.slice(4, -1).split(',').map(part => part.trim());
        if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
        const r = parseInt(raw[1] + raw[1], 16);
        const g = parseInt(raw[2] + raw[2], 16);
        const b = parseInt(raw[3] + raw[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (/^#[0-9a-f]{6}$/i.test(raw)) {
        const r = parseInt(raw.slice(1, 3), 16);
        const g = parseInt(raw.slice(3, 5), 16);
        const b = parseInt(raw.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return raw;
}

function clampLmsWhiteboardFillOpacityPercent(value = 0) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function isLmsWhiteboardShapeBoxElement(element = {}) {
    return LMS_WHITEBOARD_SHAPE_BOX_TYPES.includes(element.type);
}

function isLmsWhiteboardShapeLineElement(element = {}) {
    return LMS_WHITEBOARD_SHAPE_LINE_TYPES.includes(element.type);
}

function isLmsWhiteboardResizableElement(element = {}) {
    return LMS_WHITEBOARD_RESIZABLE_TYPES.includes(element.type);
}

function snapLmsWhiteboardCoord(value = 0) {
    if (!getLmsWhiteboardUiState().snapToGrid) return value;
    return Math.round(Number(value) / LMS_WHITEBOARD_GRID_STEP) * LMS_WHITEBOARD_GRID_STEP;
}

function snapLmsWhiteboardPoint(point = {}) {
    return { x: snapLmsWhiteboardCoord(point.x), y: snapLmsWhiteboardCoord(point.y) };
}

function normalizeLmsWhiteboardRect(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    return { x: left, y: top, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

function rectsIntersectLmsWhiteboard(a = {}, b = {}) {
    if (!a || !b || a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return false;
    return a.x < (b.x + b.w) && (a.x + a.w) > b.x && a.y < (b.y + b.h) && (a.y + a.h) > b.y;
}

function getLmsWhiteboardResizeHandlePoints(bounds = {}, element = {}) {
    const { x, y, w, h } = bounds;
    return [
        { id: 'nw', x, y },
        { id: 'n', x: x + (w / 2), y },
        { id: 'ne', x: x + w, y },
        { id: 'e', x: x + w, y: y + (h / 2) },
        { id: 'se', x: x + w, y: y + h },
        { id: 's', x: x + (w / 2), y: y + h },
        { id: 'sw', x, y: y + h },
        { id: 'w', x, y: y + (h / 2) }
    ];
}

function breakLmsWhiteboardLongToken(ctx, token = '', maxLineWidth = 1) {
    const chunks = [];
    let chunk = '';
    String(token || '').split('').forEach(char => {
        const test = `${chunk}${char}`;
        if (ctx.measureText(test).width > maxLineWidth && chunk) {
            chunks.push(chunk);
            chunk = char;
        } else {
            chunk = test;
        }
    });
    if (chunk) chunks.push(chunk);
    return chunks.length ? chunks : [''];
}

function wrapLmsWhiteboardTextParagraph(ctx, paragraph = '', maxLineWidth = 1) {
    const words = String(paragraph || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines = [];
    let line = '';
    const pushWord = (word) => {
        const parts = ctx.measureText(word).width > maxLineWidth
            ? breakLmsWhiteboardLongToken(ctx, word, maxLineWidth)
            : [word];
        parts.forEach(part => {
            const test = line ? `${line} ${part}` : part;
            if (ctx.measureText(test).width > maxLineWidth && line) {
                lines.push(line);
                line = part;
            } else {
                line = test;
            }
        });
    };
    words.forEach(pushWord);
    if (line) lines.push(line);
    return lines.length ? lines : [''];
}

function getLmsWhiteboardTextMeasureContext(fontSize = 18) {
    if (!lmsWhiteboardTextMeasureCtx) {
        const canvas = document.createElement('canvas');
        lmsWhiteboardTextMeasureCtx = canvas.getContext('2d');
    }
    lmsWhiteboardTextMeasureCtx.font = `${fontSize}px Inter, sans-serif`;
    return lmsWhiteboardTextMeasureCtx;
}

function layoutLmsWhiteboardText({
    text = '',
    fontSize = 18,
    width = 240,
    paddingX = LMS_WHITEBOARD_TEXT_PADDING_X,
    paddingY = LMS_WHITEBOARD_TEXT_PADDING_Y,
    lineHeightFactor = LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR
} = {}) {
    const boxWidth = Math.max(80, Math.abs(Number(width) || 0));
    const maxLineWidth = Math.max(1, boxWidth - paddingX);
    const ctx = getLmsWhiteboardTextMeasureContext(fontSize);
    const lineHeight = fontSize * lineHeightFactor;
    const paragraphs = String(text || '').split('\n');
    const lines = [];
    paragraphs.forEach((paragraph, index) => {
        if (paragraph === '' && index < paragraphs.length - 1) {
            lines.push('');
            return;
        }
        wrapLmsWhiteboardTextParagraph(ctx, paragraph, maxLineWidth).forEach(line => lines.push(line));
    });
    if (!lines.length) lines.push('');
    const contentHeight = lines.length * lineHeight;
    const height = Math.max(24, contentHeight + paddingY);
    return { lines, lineHeight, contentHeight, height, width: boxWidth };
}

function measureLmsWhiteboardTextContentSize(element = {}) {
    const fontSize = Number(element.fontSize) || getLmsWhiteboardUiState().textDefaults.fontSize;
    const text = String(element.text || '');
    const ctx = getLmsWhiteboardTextMeasureContext(fontSize);
    const lines = text.split('\n');
    let maxW = 0;
    lines.forEach(line => {
        maxW = Math.max(maxW, ctx.measureText(line || ' ').width);
    });
    const lineHeight = fontSize * LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR;
    return {
        w: Math.max(48, maxW + LMS_WHITEBOARD_TEXT_PADDING_X),
        h: Math.max(24, (lines.length * lineHeight) + LMS_WHITEBOARD_TEXT_PADDING_Y)
    };
}

function wrapLmsWhiteboardText(ctx, text, x, y, maxWidth, lineHeight = 18, maxHeight = Infinity) {
    const fontSize = lineHeight / LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR;
    const layout = layoutLmsWhiteboardText({
        text,
        fontSize,
        width: maxWidth + LMS_WHITEBOARD_TEXT_PADDING_X,
        paddingY: 0
    });
    const maxLines = Number.isFinite(maxHeight)
        ? Math.max(1, Math.floor(maxHeight / lineHeight))
        : layout.lines.length;
    const visible = layout.lines.slice(0, maxLines);
    visible.forEach((line, index) => {
        let output = line;
        if (index === maxLines - 1 && layout.lines.length > maxLines) {
            while (output.length > 1 && ctx.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
            output = `${output}…`;
        }
        ctx.fillText(output, x, y + (index * lineHeight));
    });
}

function normalizeLmsWhiteboardBox(element = {}) {
    if (!['sticky', 'image', 'text', 'document', ...LMS_WHITEBOARD_SHAPE_BOX_TYPES].includes(element.type)) return;
    if ((element.w || 0) < 0) {
        element.x += element.w;
        element.w = Math.abs(element.w);
    }
    if ((element.h || 0) < 0) {
        element.y += element.h;
        element.h = Math.abs(element.h);
    }
    const minW = element.type === 'sticky' ? 80
        : element.type === 'text' ? 80
            : element.type === 'document' ? 120
                : isLmsWhiteboardShapeBoxElement(element) ? 8
                    : 40;
    const minH = element.type === 'sticky' ? 80
        : element.type === 'text' ? 24
            : element.type === 'document' ? 120
                : isLmsWhiteboardShapeBoxElement(element) ? 8
                    : 40;
    element.w = Math.max(minW, element.w || minW);
    element.h = Math.max(minH, element.h || minH);
}

function getLmsWhiteboardElementBounds(element = {}) {
    if (element.type === 'stroke') {
        const points = Array.isArray(element.points) ? element.points : [];
        if (!points.length) return null;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        points.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
        const pad = Math.max(4, Number(element.width || 3) + 2);
        return { x: minX - pad, y: minY - pad, w: (maxX - minX) + (pad * 2), h: (maxY - minY) + (pad * 2) };
    }
    if (['sticky', 'image', 'document', ...LMS_WHITEBOARD_SHAPE_BOX_TYPES].includes(element.type)) {
        const x = Math.min(element.x, element.x + (element.w || 0));
        const y = Math.min(element.y, element.y + (element.h || 0));
        return { x, y, w: Math.abs(element.w || 0), h: Math.abs(element.h || 0) };
    }
    if (isLmsWhiteboardShapeLineElement(element)) {
        const x1 = Number(element.x) || 0;
        const y1 = Number(element.y) || 0;
        const x2 = Number(element.x2) || 0;
        const y2 = Number(element.y2) || 0;
        const pad = Math.max(4, Number(element.width || 3) + 4);
        return {
            x: Math.min(x1, x2) - pad,
            y: Math.min(y1, y2) - pad,
            w: Math.abs(x2 - x1) + (pad * 2),
            h: Math.abs(y2 - y1) + (pad * 2)
        };
    }
    if (element.type === 'text') {
        const hasBox = Number(element.w) > 0 && Number(element.h) > 0;
        if (hasBox) {
            return {
                x: element.x,
                y: element.y,
                w: Math.max(80, Number(element.w)),
                h: Math.max(24, Number(element.h))
            };
        }
        const measured = measureLmsWhiteboardTextContentSize(element);
        return { x: element.x, y: element.y, w: measured.w, h: measured.h };
    }
    return null;
}

function canLmsWhiteboardResizeElement(element = {}) {
    if (isLmsWhiteboardResizableElement(element)) return true;
    if (isLmsWhiteboardShapeLineElement(element)) return true;
    if (element.type === 'stroke') {
        return (Array.isArray(element.points) ? element.points : []).length > 0;
    }
    return false;
}

function hitTestLmsWhiteboardResizeZone(point = {}, element = {}, options = {}) {
    if (!canLmsWhiteboardResizeElement(element)) return '';
    const local = Boolean(options.local);
    const zoom = local ? 1 : Math.max(getLmsWhiteboardUiState().zoom, 0.4);
    const handleThreshold = options.handleThreshold ?? (12 / zoom);
    if (isLmsWhiteboardShapeLineElement(element)) {
        if (Math.hypot(point.x - (element.x || 0), point.y - (element.y || 0)) <= handleThreshold) return 'start';
        if (Math.hypot(point.x - (element.x2 || 0), point.y - (element.y2 || 0)) <= handleThreshold) return 'end';
        return '';
    }
    const bounds = getLmsWhiteboardElementBounds(element);
    if (!bounds) return '';
    const edgeThreshold = options.edgeThreshold ?? (8 / zoom);
    const handles = getLmsWhiteboardResizeHandlePoints(bounds, element);
    const handleHit = handles.find(handle => (
        Math.hypot(point.x - handle.x, point.y - handle.y) <= handleThreshold
    ));
    if (handleHit) return handleHit.id;
    if (!bounds) return '';
    const { x, y, w, h } = bounds;
    const right = x + w;
    const bottom = y + h;
    const nearLeft = Math.abs(point.x - x) <= edgeThreshold && point.y >= y - edgeThreshold && point.y <= bottom + edgeThreshold;
    const nearRight = Math.abs(point.x - right) <= edgeThreshold && point.y >= y - edgeThreshold && point.y <= bottom + edgeThreshold;
    const nearTop = Math.abs(point.y - y) <= edgeThreshold && point.x >= x - edgeThreshold && point.x <= right + edgeThreshold;
    const nearBottom = Math.abs(point.y - bottom) <= edgeThreshold && point.x >= x - edgeThreshold && point.x <= right + edgeThreshold;
    if (nearTop && nearLeft) return 'nw';
    if (nearTop && nearRight) return 'ne';
    if (nearBottom && nearLeft) return 'sw';
    if (nearBottom && nearRight) return 'se';
    if (nearTop) return 'n';
    if (nearBottom) return 's';
    if (nearLeft) return 'w';
    if (nearRight) return 'e';
    return '';
}


export const lmsWhiteboardModelApi = {
    wbRoundRect,
    colorWithLmsWhiteboardOpacity,
    clampLmsWhiteboardFillOpacityPercent,
    isLmsWhiteboardShapeBoxElement,
    isLmsWhiteboardShapeLineElement,
    isLmsWhiteboardResizableElement,
    snapLmsWhiteboardCoord,
    snapLmsWhiteboardPoint,
    normalizeLmsWhiteboardRect,
    rectsIntersectLmsWhiteboard,
    getLmsWhiteboardResizeHandlePoints,
    breakLmsWhiteboardLongToken,
    wrapLmsWhiteboardTextParagraph,
    getLmsWhiteboardTextMeasureContext,
    layoutLmsWhiteboardText,
    measureLmsWhiteboardTextContentSize,
    wrapLmsWhiteboardText,
    normalizeLmsWhiteboardBox,
    getLmsWhiteboardElementBounds,
    canLmsWhiteboardResizeElement,
    hitTestLmsWhiteboardResizeZone,
    LMS_WHITEBOARD_TEXT_PADDING_X,
    LMS_WHITEBOARD_TEXT_PADDING_Y,
    LMS_WHITEBOARD_TEXT_LINE_HEIGHT_FACTOR
};

/** Install classic window / Kiu surface (idempotent). */
export function installLmsWhiteboardModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_LMS_WHITEBOARD_MODEL_LOADED) {
        return target?.KiuLmsWhiteboardModel || lmsWhiteboardModelApi;
    }
    target.__KIU_LMS_WHITEBOARD_MODEL_LOADED = true;
    target.__kiuLmsWhiteboardModelExports = lmsWhiteboardModelApi;
    target.KiuLmsWhiteboardModel = lmsWhiteboardModelApi;
    Object.keys(lmsWhiteboardModelApi).forEach((key) => {
        target[key] = lmsWhiteboardModelApi[key];
    });
    return lmsWhiteboardModelApi;
}

installLmsWhiteboardModel();

