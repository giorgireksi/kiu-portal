import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';
import { normalizeWhiteboardElement } from '../backend/platform/domains/lms-whiteboard-service.js';
import { readLmsWhiteboardSource, readLmsWhiteboardMainRuntime, readLmsWhiteboardSessionRuntime } from './helpers/lms-whiteboard-source.js';
import { installLmsWhiteboardModel } from '../assets/js/pages/lms-whiteboard-model.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunction(source = '', name = '') {
    return source.match(new RegExp(`function ${name}[\\s\\S]*?(?=\\nfunction )`))?.[0] || '';
}

function loadShapeFinalizeSandbox(runtime = '') {
    const context = {
        window: {},
        LMS_WHITEBOARD_SHAPE_BOX_TYPES: ['rect', 'ellipse', 'grid'],
        LMS_WHITEBOARD_SHAPE_LINE_TYPES: ['line', 'arrow'],
        LMS_WHITEBOARD_SHAPE_MIN_DRAG_PX: 24,
        Math,
        String,
        Number,
        Boolean,
        Array,
        Object
    };
    context.window = context;
    installLmsWhiteboardModel(context);
    const { normalizeLmsWhiteboardBox, isLmsWhiteboardShapeBoxElement, isLmsWhiteboardShapeLineElement } = context.KiuLmsWhiteboardModel;
    context.normalizeLmsWhiteboardBox = normalizeLmsWhiteboardBox;
    context.isLmsWhiteboardShapeBoxElement = isLmsWhiteboardShapeBoxElement;
    context.isLmsWhiteboardShapeLineElement = isLmsWhiteboardShapeLineElement;
    vm.createContext(context);
    const blocks = [
        extractFunction(runtime, 'finalizeLmsWhiteboardBoxShape'),
        extractFunction(runtime, 'finalizeLmsWhiteboardLineShape'),
    ];
    blocks.forEach(block => {
        if (block) vm.runInContext(block, context);
    });
    return context;
}

describe('lms whiteboard shape draw', () => {
    const mainRuntime = readLmsWhiteboardMainRuntime();
    const sessionRuntime = readLmsWhiteboardSessionRuntime();
    const chromeRuntime = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');
    const runtime = readLmsWhiteboardSource();
    const pointer = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');
    const board = `${runtime}\n${pointer}`;
    const account = { id: 'staff-1' };

    it('requires a 24px drag before box shapes normalize and commit', () => {
        const finalizeBlock = extractFunction(mainRuntime, 'finalizeLmsWhiteboardBoxShape');
        expect(finalizeBlock).toContain('LMS_WHITEBOARD_SHAPE_MIN_DRAG_PX');
        expect(finalizeBlock.indexOf('Math.max(absW, absH)')).toBeLessThan(finalizeBlock.indexOf('normalizeLmsWhiteboardBox'));

        const sandbox = loadShapeFinalizeSandbox(mainRuntime);
        const tiny = { type: 'rect', x: 10, y: 10, w: 1, h: 1 };
        expect(sandbox.finalizeLmsWhiteboardBoxShape(tiny)).toBe(false);
        expect(tiny.w).toBe(1);
        expect(tiny.h).toBe(1);

        const valid = { type: 'rect', x: 10, y: 10, w: 48, h: 32 };
        expect(sandbox.finalizeLmsWhiteboardBoxShape(valid)).toBe(true);
        expect(valid.w).toBe(48);
        expect(valid.h).toBe(32);
    });

    it('rejects line and arrow shapes shorter than 16px', () => {
        const finalizeBlock = extractFunction(mainRuntime, 'finalizeLmsWhiteboardLineShape');
        expect(finalizeBlock).toContain('return length >= 16');

        const sandbox = loadShapeFinalizeSandbox(mainRuntime);
        expect(sandbox.finalizeLmsWhiteboardLineShape({ type: 'line', x: 0, y: 0, x2: 4, y2: 0 })).toBe(false);
        expect(sandbox.finalizeLmsWhiteboardLineShape({ type: 'arrow', x: 0, y: 0, x2: 20, y2: 0 })).toBe(true);
    });

    it('defaults shape fill opacity to 0.35 in runtime and backend', () => {
        expect(mainRuntime).toContain('shapeDefaults: { fill: \'#f4d06f\', fillOpacity: 0.35 }');
        expect(extractFunction(mainRuntime, 'resolveLmsWhiteboardShapeFillOpacity')).toContain('LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity');

        const rect = normalizeWhiteboardElement({ type: 'rect', id: 'rect-opacity', x: 0, y: 0, w: 80, h: 60 }, account);
        const grid = normalizeWhiteboardElement({ type: 'grid', id: 'grid-opacity', x: 0, y: 0, w: 120, h: 90, rows: 3, cols: 3 }, account);
        expect(rect.fillOpacity).toBe(0.35);
        expect(grid.fillOpacity).toBe(0.35);
    });

    it('cancels in-progress draws on tool switch and pointercancel', () => {
        const cancelBlock = extractFunction(mainRuntime, 'cancelLmsWhiteboardActiveDraw');
        const attachBlock = extractFunction(mainRuntime, 'attachLmsWhiteboardGestureWindowListeners');
        const setToolBlock = extractFunction(chromeRuntime, 'setLmsWhiteboardTool');

        expect(cancelBlock).toContain('LMS_WHITEBOARD_UI.drawTool = \'\'');
        expect(cancelBlock).toContain('detachLmsWhiteboardGestureWindowListeners');
        expect(attachBlock).toContain("window.addEventListener('pointercancel', onCancel)");
        expect(attachBlock).not.toContain("window.addEventListener('pointermove'");
        expect(attachBlock).toContain('cancelLmsWhiteboardActiveDraw(resourceKey, canvas)');
        expect(setToolBlock).toContain('cancelLmsWhiteboardActiveDraw');
    });

    it('keeps pointermove on the canvas while window listeners handle up/cancel fallback', () => {
        const bindBlock = pointer.match(/function bindLmsWhiteboardStagePointerHandlers[\s\S]*?stage\.addEventListener\('pointerdown', onDown\)/)?.[0] || '';
        const onMoveBlock = bindBlock.match(/const onMove = \(event\) => \{[\s\S]*?\};\n    const onUp/)?.[0] || '';

        expect(onMoveBlock).not.toContain('gestureWindowListeners');
        expect(onMoveBlock).toContain('onLmsWhiteboardPointerMove(event, resourceKey, canEdit, canvas)');
    });

    it('resizes shape drafts with drawTool during pointer move', () => {
        const moveBlock = extractFunction(pointer, 'onLmsWhiteboardPointerMove');
        expect(extractFunction(mainRuntime, 'getLmsWhiteboardActiveDrawTool')).toContain('LMS_WHITEBOARD_UI.drawTool');
        expect(extractFunction(mainRuntime, 'resolveLmsWhiteboardLiveDraftElement')).toContain('workspace.elements.find');
        expect(moveBlock).toContain('const activeTool = getLmsWhiteboardActiveDrawTool()');
        expect(moveBlock).toContain("['rect', 'roundRect', 'ellipse', 'grid'].includes(activeTool)");
        expect(moveBlock).toContain('draft.w = snapped.x - draft.x');
        expect(moveBlock).not.toMatch(/includes\(LMS_WHITEBOARD_UI\.tool\).*draft\.w/s);
    });

    it('dedupes duplicate pointerup finalization from stage and window listeners', () => {
        const upBlock = extractFunction(pointer, 'onLmsWhiteboardPointerUp');
        expect(upBlock).toContain('lastGesturePointerUpId');
        expect(extractFunction(pointer, 'onLmsWhiteboardPointerDown')).toContain('lastGesturePointerUpId = null');
    });

    it('pins drawTool at pointer down and uses it on pointer up', () => {
        const downBlock = pointer.match(/if \(LMS_WHITEBOARD_SHAPE_DRAW_TOOLS\.includes\(LMS_WHITEBOARD_UI\.tool\)\) \{[\s\S]*?return;\n    \}/)?.[0] || '';
        const upBlock = pointer.match(/if \(LMS_WHITEBOARD_UI\.drawing\) \{[\s\S]*?return;\n    \}/)?.[0] || '';

        expect(downBlock).toContain('LMS_WHITEBOARD_UI.drawTool = LMS_WHITEBOARD_UI.tool');
        expect(upBlock).toContain('const tool = LMS_WHITEBOARD_UI.drawTool || LMS_WHITEBOARD_UI.tool');
        expect(upBlock).toContain('finalizeLmsWhiteboardBoxShape(element)');
        expect(upBlock).toContain('finalizeLmsWhiteboardLineShape(element)');
        expect(upBlock).toContain('workspace.elements = workspace.elements.filter(item => item.id !== element.id)');
    });

    it('skips HiDPI resync during active gestures', () => {
        const resyncBlock = extractFunction(sessionRuntime, 'resyncLmsWhiteboardLayoutMetrics');
        const gestureBranch = resyncBlock.match(/if \(isLmsWhiteboardWorkspaceGestureActive\(canonicalKey\)\) \{[\s\S]*?return;\n            \}/)?.[0] || '';
        expect(gestureBranch).toContain('paintLmsWhiteboardCanvas(canonicalKey, canvas, { skipDocumentSync: true })');
        expect(gestureBranch).not.toContain('setupLmsWhiteboardCanvasHiDpi');
    });

    it('scales stroke width and uses softer draft fills when painting shapes', () => {
        const paint = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');
        const drawFn = paint.match(/function drawLmsWhiteboardElement[\s\S]*?(?=\nwindow\.|$)/)?.[0] || '';
        const drawBlock = drawFn.match(/if \(isLmsWhiteboardShapeBoxElement\(element\)\) \{[\s\S]*?return;\n    \}/)?.[0] || '';
        expect(drawBlock).toContain('resolveLmsWhiteboardShapeStrokeWidth(element, w, h)');
        expect(drawBlock).toContain('Math.min(0.25, resolveLmsWhiteboardShapeFillOpacity(element))');
        expect(drawBlock).not.toContain('rgba(244, 208, 111');
    });

    it('bumps whiteboard cache tokens to 20260708-wb-shapes-v4', () => {
        const html = readSource('lms.html');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260808-overallperf1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260729-wbdocresize4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-pointer-runtime.js?v=20260808-overallperf1');
    });
});