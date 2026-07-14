import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

/** Page + workspace — graph render stack lives in social-workspace.js. */
function readGraphSource() {
    return `${readSource('assets/js/pages/social-page.js')}\n${readSource('assets/js/pages/social-workspace.js')}`;
}

/**
 * Brace-aware function extract. Skips page stubs that only forward to window.*.
 * Finds the body `{` after the parameter list (not default-param `{}`).
 */
function extractFunction(source = '', name = '') {
    const startRe = new RegExp(`(?:async )?function ${name}\\s*\\(`, 'g');
    let best = '';
    let m;

    function skipString(from, quote) {
        let esc = false;
        for (let k = from + 1; k < source.length; k++) {
            const ch = source[k];
            if (esc) { esc = false; continue; }
            if (ch === '\\' && quote !== '`') { esc = true; continue; }
            if (quote === '`') {
                if (ch === '`') return k;
                if (ch === '$' && source[k + 1] === '{') {
                    // template expression: brace-match nested code
                    let d = 1;
                    k += 2;
                    while (k < source.length && d > 0) {
                        const c = source[k];
                        if (c === "'" || c === '"' || c === '`') {
                            k = skipString(k, c);
                        } else if (c === '{') d += 1;
                        else if (c === '}') d -= 1;
                        k += 1;
                    }
                    k -= 1;
                }
                continue;
            }
            if (ch === quote) return k;
        }
        return source.length - 1;
    }

    while ((m = startRe.exec(source)) !== null) {
        const i = m.index;
        // Walk from opening `(` of params to matching `)`, then take next `{`.
        let p = m.index + m[0].length - 1; // at '('
        let depth = 0;
        let paramsEnd = -1;
        for (let k = p; k < source.length; k++) {
            const ch = source[k];
            if (ch === "'" || ch === '"' || ch === '`') {
                k = skipString(k, ch);
                continue;
            }
            if (ch === '(') depth += 1;
            else if (ch === ')') {
                depth -= 1;
                if (depth === 0) { paramsEnd = k; break; }
            }
        }
        if (paramsEnd < 0) continue;
        let j = -1;
        for (let k = paramsEnd + 1; k < source.length; k++) {
            if (source[k] === '{') { j = k; break; }
            if (source[k] === ';') break;
        }
        if (j < 0) continue;
        depth = 0;
        let end = -1;
        for (let k = j; k < source.length; k++) {
            const ch = source[k];
            if (ch === "'" || ch === '"' || ch === '`') {
                k = skipString(k, ch);
                continue;
            }
            if (ch === '{') depth += 1;
            else if (ch === '}') {
                depth -= 1;
                if (depth === 0) { end = k + 1; break; }
            }
        }
        if (end < 0) continue;
        const body = source.slice(i, end);
        if (body.includes(`window.${name}`) && body.includes('hasSocialWorkspaceModule') && body.length < 500) {
            continue;
        }
        if (body.length > best.length) best = body;
    }
    return best;
}

function extractFn(source, name) {
    return extractFunction(source, name);
}

describe('social project task dependency graph', () => {
    it('embeds task flow preview on overview and tasks tabs', () => {
        const source = readGraphSource();
        var _wsClassic = readSource('assets/js/pages/social-workspace.js');
        var classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const overviewBlock = (() => {
            let start = classicBlock.indexOf('const renderOverviewTab = () => {');
            if (start >= 0) {
                let depth = 0;
                for (let i = start; i < classicBlock.length; i++) {
                    const ch = classicBlock[i];
                    if (ch === '{') depth += 1;
                    else if (ch === '}') { depth -= 1; if (depth === 0) return classicBlock.slice(start, i + 1); }
                }
            }
            start = classicBlock.indexOf('const renderOverviewTab = () => `');
            if (start < 0) return '';
            let i = start + 'const renderOverviewTab = () => `'.length;
            while (i < classicBlock.length) {
                if (classicBlock[i] === '\\') { i += 2; continue; }
                if (classicBlock[i] === '`') return classicBlock.slice(start, i + 1);
                i += 1;
            }
            return '';
        })();
        var _wsClassic = readSource('assets/js/pages/social-workspace.js');
        var classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const tasksTabBlock = (() => { const start = classicBlock.indexOf('const renderTasksTab = () => {'); if (start < 0) return ''; let depth = 0; for (let i = start; i < classicBlock.length; i++) { const ch = classicBlock[i]; if (ch === '{') depth += 1; else if (ch === '}') { depth -= 1; if (depth === 0) return classicBlock.slice(start, i + 1); } } return ''; })();

        expect(overviewBlock).toContain('renderTaskDependencyGraphPreview(activeProject, runtime)');
        expect(overviewBlock).toContain('social-project-ov-order-3');
        expect(tasksTabBlock).toContain('social-project-task-shell-graph');
        expect(tasksTabBlock).toContain('renderTaskDependencyGraphPreview(activeProject, runtime)');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-action="project-task-graph-open"');
        expect(source).toContain('function renderTaskDependencyGraphPreview');
        expect(source).toContain('Task map');
        // Preview = same layout, auto-fit via content bounds + SVG viewBox meet
        const previewFn = extractFn(source, 'renderTaskDependencyGraphPreview');
        expect(previewFn).toContain('buildProjectTaskGraphModel(projectTasks');
        expect(previewFn).toContain('computeProjectTaskGraphStageSize(runtime)');
        expect(previewFn).toContain('buildProjectTaskGraphLayout(model, runtime, stageSize)');
        expect(previewFn).toContain('applyProjectTaskGraphSavedPositions');
        expect(previewFn).toContain('getProjectTaskGraphPositions');
        expect(previewFn).toContain('projectTaskGraphContentViewBox');
        expect(previewFn).toContain('collectProjectTaskGraphGroupBoxes');
        expect(previewFn).toContain('xMidYMid meet');
        expect(previewFn).toContain("svgWidth: '100%'");
        expect(previewFn).toContain('preview: true');
        expect(previewFn).toContain('dashboard: false');
        expect(previewFn).toContain('computeProjectSchedule(project)');
        expect(previewFn).toContain('schedule,');
        expect(previewFn).toContain('linkable: false');
        expect(previewFn).toContain('social-project-graph-preview-viewport');
        expect(source).toContain('function projectTaskGraphContentBounds');
        expect(source).toContain('function projectTaskGraphContentViewBox');
        expect(source).not.toContain('function fitProjectTaskGraphLayoutIntoStage');
        expect(source).toContain('showInferred: false');
        expect(source).toContain('showFlow: false');
    });

    it('uses force-directed management card nodes, drag bind, and immersive fullscreen shell', () => {
        const source = readGraphSource();

        expect(source).toContain('function layoutProjectTaskGraphForce');
        expect(source).toContain('function layoutProjectTaskGraphByStatus');
        expect(source).toContain('function projectTaskGraphEdgeAnchors');
        expect(source).toContain('function bindProjectTaskGraphDrag');
        expect(source).toContain('function bindProjectTaskGraphInteractions');
        expect(source).toContain('function renderProjectTaskGraphCardNode');
        expect(source).toContain('function normalizeProjectTaskGraphMode');
        expect(source).toContain('function projectTaskGraphShowInferred');
        expect(source).toContain('function projectTaskGraphShowFlow');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_W = 256');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_MIN_H = 168');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_MAX_H = 280');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_H = 188');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_COMPACT_W = 200');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H = 88');
        expect(source).toContain('PROJECT_TASK_GRAPH_CARD_COMPACT_H = 100');
        expect(source).toContain('function measureProjectTaskGraphCardHeights');
        expect(source).toContain('data-graph-card-inner="1"');
        expect(source).toContain('function resolveProjectTaskPriorityDisplay');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card-priority--matrix');
        expect(source).toContain('PROJECT_TASK_GRAPH_FO_PAD = 20');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card-mid');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card-priority');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card-budget');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card-start');
        expect(source).toContain('formatProjectTaskBudgetEstimate');
        expect(source).toContain('projectTaskBudgetEstimate');
        expect(source).toContain('budgetEstimate');
        expect(source).toContain('function projectTaskGraphEdgePath');
        expect(source).toContain('function getProjectTaskGraphDocks');
        expect(source).toContain('function selectProjectTaskGraphDockPair');
        expect(source).toContain('function projectTaskGraphCubicEdgePath');
        expect(source).toContain('function projectTaskGraphEdgeFanMap');
        expect(source).toContain('fanOffset');
        expect(source).toContain('cubic-');
        expect(source).toContain('M ${p0x} ${p0y} C ${c1x} ${c1y} ${c2x} ${c2y} ${p3x} ${p3y}');
        expect(source).toContain('data-graph-link-port="n"');
        expect(source).toContain('data-graph-link-port="s"');
        expect(source).toContain('data-graph-link-port="e"');
        expect(source).toContain('data-graph-link-port="w"');
        expect(source).toContain('foreignObject');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card-fo-inner');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-card');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-node-g');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-project-task-graph-svg="1"');
        // FO expanded so handles are not clipped
        expect(source).toContain('x="${-foPad}"');
        expect(source).toContain('width="${w + foPad * 2}"');
        expect(source).toContain('PROJECT_TASK_STATUS_EDGE_COLOR');
        expect(source).toContain('projectTaskGraphStatusEdgeColor');
        // Solid destination-status paint (no mixed gradient on a single wire)
        expect(source).toContain('stroke="${toColor}"');
        expect(source).not.toContain('projectTaskGraphEdgeGradientId');
        expect(source).not.toContain('gradientUnits="userSpaceOnUse"');
        expect(source).toContain('socialProjectTaskGraphArrow-status-');
        expect(source).toContain('data-from-status');
        expect(source).toContain('data-to-status');
        expect(source).not.toContain('function layoutProjectTaskGraphDag');
        expect(source).not.toContain('function renderProjectTaskGraphCircleNode');
        expect(source).not.toContain('social-project-task-graph-node-circle');
        expect(source).toContain("graphMode === 'connect'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-immersive');
        expect(source).toContain('projectTaskGraphShowInferred = false');
        expect(source).toContain('projectTaskGraphShowFlow = false');
        expect(source).toContain("projectTaskGraphLayout = 'status'");
    });

    it('exposes interactive graph dashboard controls and linking handlers', () => {
        const source = readGraphSource();

        expect(source).toContain('Task map');
        expect(source).toContain('dashboard: true');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-action="project-task-graph-select-node"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-action="project-task-graph-link-cancel"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-action="project-task-graph-unlink-edge"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-task-graph-unlink' || action === 'project-task-graph-unlink-edge'");
        expect(source).not.toContain('data-action="project-task-graph-clear-deps"');
        expect(source).not.toContain('data-action="project-task-graph-connect-by-status"');
        expect(source).not.toContain('data-action="project-task-graph-layout-status"');
        expect(source).not.toContain('Line up &amp; connect stages');
        expect(source).toContain('data-graph-link-port="e"');
        expect(source).toContain('data-graph-link-port="w"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-form="project-task-graph-quick-create"');
        expect(source).toMatch(/name="projectTaskStatus"[^>]*data-lux-picker/);
        expect(source).toContain('social-neo-dialog-cancel-btn');
        expect(source).toContain('social-neo-dialog-submit-btn');
        expect(source).toContain('function renderProjectTaskGraphInspector');
        expect(source).toContain('function renderProjectTaskGraphQuickCreatePopover');
        expect(source).toContain("projectTaskGraphMode = 'browse'");
        expect(source).toContain('function addProjectTaskDependency');
        expect(source).not.toContain('function buildProjectTaskGraphStatusChainUpdates');
        expect(source).toContain('classList.remove(\'is-focus-dimmed\')');
    });

    it('styles management graph cards and accent edge lines', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const rebuild = readSource('assets/css/social-rebuild.css');

        expect(css).toContain('.social-project-graph-preview-card');
        expect(css).toContain('.social-project-task-graph-node-g');
        expect(css).toContain('.social-project-task-graph-card');
        expect(css).toContain('.social-project-task-graph-card-stripe');
        expect(css).toContain('.social-project-task-graph-health');
        expect(css).not.toContain('.social-project-task-graph-node-circle');
        expect(css).not.toContain('.is-dimmed');
        expect(css).toContain('.social-project-task-graph-svg');
        expect(css).toContain('.social-project-task-graph-edge.is-explicit');
        expect(css).toContain('.social-project-task-graph-edge.is-flow');
        expect(css).toContain('.social-project-task-graph-edge.is-inferred');
        // Explicit stroke is solid SVG status color (CSS must not override stroke)
        expect(css).toMatch(/\.social-project-task-graph-edge\.is-explicit[\s\S]*?stroke-width:\s*2\.35/);
        expect(css).toMatch(/\.social-project-task-graph-edge\.is-flow[\s\S]*?stroke:\s*rgba\(245,\s*158,\s*11/);
        expect(css).toMatch(/\.social-project-task-graph-edge\.is-inferred[\s\S]*?stroke-dasharray:\s*3\s+5/);
        expect(css).toMatch(/\.social-project-task-graph-edge\.is-flow[\s\S]*?stroke-dasharray:\s*6\s+4/);
        expect(css).not.toContain('.social-project-task-graph-status-swatch.is-todo');
        expect(css).not.toContain('.social-project-task-graph-edge-key');
        expect(css).not.toContain('.social-project-task-graph-link-guide');
        expect(css).toContain("data-to-status='blocked'");
        expect(css).toContain('.social-project-task-graph-arrow.is-status');
        expect(css).toContain('.social-project-task-graph-arrow.is-flow');
        expect(css).toContain('.social-project-task-graph-card-fo-inner');
        expect(css).toContain('.social-project-task-graph-detail-rail');
        expect(css).toContain('.social-project-task-graph-inspector');
        expect(css).toContain('.social-project-task-graph-quick-create');
        expect(css).toContain('.is-mode-link');
        expect(css).toContain('.is-focus-dimmed');
        expect(css).toContain('.is-focus-active');
        expect(css).toContain('.social-project-task-graph-detail-rail.is-empty');
        // Graph shell styles live in social-projects-lms (route-scoped), not rebuild.
        expect(css).toContain('.social-neo-dialog-backdrop--project-task-graph');
        expect(css).toContain('height: 100dvh');
        expect(css).toContain('.social-project-task-graph-sidebar');
        expect(css).toContain('.social-neo-dialog-card--project-task-graph-fullscreen');
    });

    it('forces true viewport fullscreen for immersive graph dialog', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const source = readGraphSource();

        expect(css).toContain('.social-neo-dialog-card--project-task-graph-fullscreen');
        expect(css).toMatch(/100vw|100dvh/);
        expect(css).toContain('.social-project-task-graph-canvas.is-fullscreen');
        expect(css).toContain('width: 100% !important');
        expect(source).toContain('function computeProjectTaskGraphStageSize');
        expect(source).toContain('fullscreen: true');
        expect(source).toContain('bindProjectTaskGraphResizeObserver');
    });

    it('supports right-click pan on the immersive graph dashboard', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const bindFn = extractFn(source, 'bindProjectTaskGraphInteractions');
        const dragFn = extractFn(source, 'bindProjectTaskGraphDrag');

        expect(source).toContain('projectTaskGraphPan');
        expect(source).toContain('function applyProjectTaskGraphCanvasTransform');
        expect(source).toContain('PROJECT_TASK_GRAPH_PAN_SLACK');
        expect(source).toContain('function ensureProjectTaskGraphScrollSurface');
        expect(source).toContain('function clampProjectTaskGraphPan');
        expect(source).toContain('function centerProjectTaskGraphScrollPan');
        expect(source).toContain('function readProjectTaskGraphPanFromScroll');
        expect(source).toContain('function initProjectTaskGraphScrollPan');
        expect(source).toContain('maxAttempts = 30');
        expect(source).toContain("initProjectTaskGraphScrollPan(stage, { force: true })");
        expect(source).toContain('data-scroll-pan="1"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-project-task-graph-scroll-surface');
        expect(source).toContain('data-ptg-scroll-init-pending');
        expect(source).toMatch(/scrollLeft\s*-\s*slack|slack\s*\+\s*\(Number\(panX\)/);
        expect(bindFn).toMatch(/if \(!panState\.scrollPan\) applyProjectTaskGraphZoom/);
        expect(source).toContain('function applyProjectTaskGraphCanvasTransform');
        expect(source).toContain('function resolveProjectTaskGraphPanBackdrop');
        expect(source).toContain('function isProjectTaskGraphPanButton');
        expect(bindFn).toContain('panState.canvas.scrollLeft');
        expect(bindFn).toContain('panState.canvas.scrollTop');
        expect(bindFn).toContain('readProjectTaskGraphPanFromScroll');
        expect(bindFn).toContain('{ syncState: false }');
        expect(source).toContain('canvas.scrollLeft');
        expect(dragFn).toContain('initProjectTaskGraphScrollPan(stage, { force: true })');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("closest('.social-neo-dialog-backdrop--project-task-graph')");
        expect(bindFn).toContain('resolveProjectTaskGraphPanBackdrop(stage)');
        expect(bindFn).toContain('backdrop?.classList.add(\'is-panning\')');
        expect(bindFn).toContain('backdrop?.classList.remove(\'is-panning\')');
        expect(bindFn).toContain('applyProjectTaskGraphZoom(state())');
        expect(source).toMatch(/function applyProjectTaskGraphZoom[\s\S]*is-panning/);
        expect(source).toMatch(/function refreshProjectTaskGraphDialog[\s\S]*is-panning[\s\S]*filter/);
        const canvasFn = extractFn(source, 'renderProjectTaskGraphCanvas');
        expect(canvasFn).toContain('data-lux-transparency-exempt="1"');
        expect(source).toContain('function attachProjectTaskGraphPanWindowListeners');
        expect(source).toContain('function detachProjectTaskGraphPanWindowListeners');
        expect(source).toContain("window.addEventListener('pointermove'");
        expect(source).toContain("addEventListener('mousedown'");
        expect(source).toContain("addEventListener('contextmenu'");
        expect(source).toContain("addEventListener('wheel'");
        expect(bindFn).toContain("addEventListener('wheel'");
        expect(bindFn).toContain('{ passive: false, signal }');
        expect(bindFn).toContain('projectTaskGraphZoom');
        expect(source).toContain('is-panning');
        expect(source).toContain('translate(');
        expect(bindFn).toMatch(/if \(!stage \|\| !svg\) return;[\s\S]*projectTaskGraphDragAbort\.abort/);
        expect(bindFn).toContain("addEventListener('pointerdown', onPointerDown, { signal, capture: true })");
        expect(dragFn).toContain('getProjectTaskGraphHost');
        expect(css).toContain('.social-project-task-graph-stage--immersive.is-panning');
        expect(css).toMatch(/\.social-project-task-graph-canvas\.is-fullscreen[\s\S]*overflow:\s*auto/);
        expect(css).toMatch(/\.social-project-task-graph-canvas\.is-fullscreen[\s\S]*display:\s*block/);
        expect(css).toMatch(/\.social-project-task-graph-canvas\.is-fullscreen[\s\S]*scrollbar-width:\s*none/);
        expect(css).toContain('.social-project-task-graph-canvas.is-fullscreen::-webkit-scrollbar');
        expect(css).toMatch(/\.social-project-task-graph-canvas-bg[\s\S]*fill:\s*none/);
        expect(css).toMatch(/\.social-project-task-graph-svg[\s\S]*overflow:\s*visible/);
        expect(css).toContain('.social-project-task-graph-scroll-surface');
        expect(css).toContain('--ptg-pan-slack');
        expect(css).toMatch(/:has\(\.social-project-task-graph-stage--immersive\.is-panning\)[\s\S]*backdrop-filter:\s*none/);
        expect(css).toMatch(/\.social-neo-dialog-backdrop--project-task-graph\.is-panning[\s\S]*backdrop-filter:\s*none/);
        expect(css).toMatch(/\.social-project-task-graph-stage--immersive\.is-interacting[\s\S]*transition:\s*none/);
        expect(css).toMatch(/\.social-project-task-graph-anchor \.social-neo-dialog-backdrop--project-task-graph[\s\S]*pointer-events:\s*auto/);
        expect(css).toMatch(/\.social-project-task-graph-anchor \.social-neo-dialog-card--project-task-graph-fullscreen[\s\S]*pointer-events:\s*auto/);
        expect(css).toMatch(/\.social-project-task-graph-stack:not\(:has\(\.social-project-task-graph-child-slot > \.social-neo-dialog-backdrop\)\)[\s\S]*pointer-events:\s*auto/);
        expect(css).toMatch(/\.social-project-task-graph-child-slot:not\(:has\(> \.social-neo-dialog-backdrop\)\)[\s\S]*display:\s*none/);
    });

    it('defines statusId in task graph inspector fields for status pill', () => {
        const source = readGraphSource();
        const fieldsFn = extractFn(source, 'buildProjectTaskInspectorFields');
        const inspectorFn = extractFn(source, 'renderProjectTaskGraphInspector');
        expect(fieldsFn).toContain("rawStatus === 'backlog' ? 'todo'");
        expect(inspectorFn).toContain('data-status="${escape(statusId)}"');
        expect(inspectorFn).toContain('social-project-task-graph-inspector-props');
        expect(inspectorFn).toContain('project-task-detail-open');
        expect(inspectorFn).toContain('social-project-task-graph-inspector-checklist');
        expect(inspectorFn).not.toContain('social-project-task-graph-inspector-meta');
        expect(inspectorFn).not.toContain('social-project-task-graph-inspector-downstream');
        expect(inspectorFn).not.toContain('social-project-task-graph-inspector-move-actions');
        expect(inspectorFn).not.toContain('<strong>Overview</strong>');
        expect(inspectorFn).not.toContain('<strong>Dependencies</strong>');
        expect(inspectorFn).not.toContain('<strong>Quick move</strong>');
        expect(inspectorFn).not.toContain('> Details</button>');
        expect(source).toContain('function projectTaskDownstreamIds');
    });

    it('keeps immersive chrome free of title stats and hint chips', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const fullscreenFn = extractFn(source, 'renderProjectTaskGraphFullscreen');
        const chromeFn = extractFn(source, 'syncProjectTaskGraphChrome');

        expect(source).not.toContain('function renderProjectTaskGraphFooterHints');
        expect(fullscreenFn).not.toContain('social-project-task-graph-footer-hints');
        expect(fullscreenFn).not.toContain('social-project-task-graph-wire-hint');
        expect(fullscreenFn).not.toContain('in progress');
        expect(fullscreenFn).not.toContain('% complete');
        expect(fullscreenFn).toContain('<span>${escape(text(project.name || \'Project\'))}</span>');
        expect(fullscreenFn).toContain('social-project-task-graph-nav-controls');
        expect(fullscreenFn).toContain('renderProjectWorkspaceNavButtons(project');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/function renderProjectWorkspaceNavButtons[\s\S]*?project-health-open[\s\S]*?project-risk-open/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/PROJECT_TASK_GRAPH_STACKED_DIALOGS[\s\S]*?'project-health'[\s\S]*?'project-risk'/);
        expect(chromeFn).not.toContain('footer-hints');
        expect(source).not.toContain('Drag any port → another card to wire');
        expect(source).not.toContain('Double-click empty canvas to add a task here');
        expect(source).not.toContain('Drag any port — wires adapt to angle');
        expect(css).toContain('.social-project-task-graph-hint-chips');
    });

    it('styles rich inspector layout and canvas atmosphere', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const source = readGraphSource();
        const inspectorFn = extractFn(source, 'renderProjectTaskGraphInspector');

        expect(inspectorFn).toContain('social-project-task-graph-inspector-props');
        expect(inspectorFn).toContain('social-project-task-graph-inspector-actions');
        expect(inspectorFn).toContain('project-task-graph-link-from-selected');
        expect(inspectorFn).toContain('project-task-edit-open');
        expect(inspectorFn).toContain('project-task-delete-open');
        expect(inspectorFn).not.toContain('is-lms-create');
        expect(inspectorFn).not.toContain('social-neo-dialog-group-create-section');
        expect(inspectorFn).not.toContain('social-neo-dialog-body--group-create');
        expect(inspectorFn).not.toContain('social-neo-form-actions social-neo-dialog-actions');
        expect(css).toContain('.social-project-task-graph-inspector-head');
        expect(css).toContain('.social-project-task-graph-inspector-scroll');
        expect(css).toContain('.social-project-task-graph-inspector-actions');
        expect(css).toContain('.social-project-task-graph-inspector-props');
        expect(css).toContain('--group-create-section');
        expect(css).toContain('.social-project-task-graph-stage--immersive::before');
        expect(css).toContain('[data-neighbor-of-selected="1"]');
        expect(css).toContain('.social-project-task-graph-detail-rail-empty');
    });

    it('uses modern LMS chrome for immersive graph dashboard', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-tab-row social-project-task-graph-mode-toolbar');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-tab-row social-project-task-graph-zoom-controls');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-zoom-btn');
        expect(source).toContain('social-neo-dialog-close-btn');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-add-btn');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-neo-btn-primary social-project-task-graph-add-btn');
        expect(source).not.toContain('social-project-task-graph-toolbar-group');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-detail-rail');
        expect(source).toContain('renderProjectTaskGraphDetailRailPlaceholder');
        // Explicit deps use status arrow markers; flow keeps amber marker
        expect(source).toContain("edge.kind === 'flow'");
        expect(source).toContain('socialProjectTaskGraphArrow-status-');
        expect(source).toContain('socialProjectTaskGraphArrow-flow');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-quick-create-field');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/project-task-graph-quick-create[\s\S]*?data-lux-picker[\s\S]*?social-neo-dialog-cancel-btn[\s\S]*?social-neo-dialog-submit-btn/);
        expect(css).toContain('.social-project-task-graph-quick-create .social-neo-dialog-submit-btn');
        expect(css).toContain('.social-project-task-graph-quick-create .lux-picker-panel');
        expect(css).toMatch(/social-project-task-graph-quick-create select\.social-neo-select[\s\S]*?clip:\s*rect\(0,\s*0,\s*0,\s*0\)/);
        expect(source).toContain('renderProjectTaskGraphHealth');
        expect(source).toContain('function renderProjectTaskGraphRailOverview');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-health-grid');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-health-metric');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-health-alert');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-my-switch');
        expect(source).toContain('Only mine');
        expect(source).not.toContain('Counts by status, filters, and alerts.');
        expect(source).not.toContain('social-project-task-graph-health-chip');
        expect(source).not.toContain('social-project-task-graph-my-toggle');
        expect(source).not.toContain('data-action="project-task-graph-connect-by-status"');
        expect(source).not.toContain('Drag any port → another card to wire');
        expect(source).not.toContain('Double-click empty canvas to add a task here');
        expect(source).not.toContain('<strong>Map rules</strong>');
        expect(source).not.toContain('Solid status color — real depends-on');
        expect(source).not.toContain('Rules, health, and progress.');
        expect(source).not.toContain('Health and progress.');
        expect(source).not.toContain('<strong>Map tools</strong>');
        expect(source).not.toContain('<strong>Manual link</strong>');
        expect(source).not.toContain('<strong>Danger</strong>');
        expect(source).not.toContain('<strong>Layout &amp; connect</strong>');
        expect(css).toContain('.social-project-task-graph-zoom-controls .social-project-task-graph-zoom-btn');
        expect(css).toContain('.social-project-task-graph-add-btn');
        expect(css).toContain('.social-project-task-graph-rail-overview');
        expect(css).toContain('.social-project-task-graph-rail-overview-section');
        expect(css).toContain('.social-project-task-graph-health-grid');
        expect(css).toContain('.social-project-task-graph-health-metric');
        expect(css).toContain('.social-project-task-graph-my-switch');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-graph-rail-overview-section');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('<strong>Tasks</strong>');
        expect(css).toContain('.social-project-task-graph-link-handle');
    });

    it('keeps the immersive detail rail slot stable across selection changes', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const syncFn = extractFn(source, 'syncProjectTaskGraphSelection');
        const stageFn = extractFn(source, 'computeProjectTaskGraphStageSize');
        const fullscreenFn = extractFn(source, 'renderProjectTaskGraphFullscreen');

        expect(source).toContain('function renderProjectTaskGraphDetailRailContent');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-action="project-task-graph-clear-selection"');
        expect(fullscreenFn).toContain('social-project-task-graph-detail-rail');
        expect(fullscreenFn).not.toContain('social-project-task-graph-sidebar');
        expect(fullscreenFn).not.toContain('Hide panel');
        expect(fullscreenFn).not.toContain('is-panel-open');
        expect(syncFn).not.toContain('rail.remove()');
        expect(syncFn).toContain('rail.classList.toggle(\'is-empty\'');
        expect(syncFn).toContain('data-neighbor-of-selected');
        expect(stageFn).toContain('hasSelection');
        expect(stageFn).toMatch(/hasSelection \? Math\.min\(300/);
        expect(stageFn).not.toContain('panelOpen');
        expect(stageFn).not.toContain('detailOpen');
        expect(css).toContain('grid-template-columns: minmax(0, 1fr) minmax(280px, 320px)');
        expect(css).not.toContain('.is-panel-open');
        expect(css).not.toContain('.social-project-task-graph-immersive-body.is-detail-open');
    });

    it('uses scoped dialog refresh to avoid fullscreen panel flicker', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');

        expect(source).toContain('function refreshProjectTaskGraphDialog');
        expect(source).toContain('function applyProjectTaskGraphZoom');
        expect(source).toContain('function syncProjectTaskGraphChrome');
        expect(source).toContain('function syncProjectTaskGraphSelection');
        expect(source).toContain('function syncProjectTaskGraphCanvas');
        expect(source).toContain('function renderProjectTaskGraphRailOverview');
        expect(source).not.toContain('social-project-task-graph-sidebar is-lms-create');
        expect(source).toContain("refreshProjectTaskGraphDialog(['zoom'])");
        expect(source).toContain("refreshProjectTaskGraphDialog(['selection', 'chrome'])");
        expect(source).toContain("refreshProjectTaskGraphDialog(['chrome', 'selection'])");
        const zoomInBlock = (source + readSource('assets/js/pages/social-workspace.js')).match(/if \(action === 'project-task-graph-zoom-in'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        expect(zoomInBlock).toContain("refreshProjectTaskGraphDialog(['zoom'])");
        expect(zoomInBlock).not.toContain('renderDialogOnlyNow()');
        const refreshFn = extractFn(source, 'refreshProjectTaskGraphDialog');
        expect(refreshFn).toContain("if (normalized.includes('canvas'))");
        expect(refreshFn).not.toMatch(/if \(normalized\.includes\('zoom'\)\)[\s\S]*bindProjectTaskGraphInteractions/);
        expect(css).toContain('.social-project-task-graph-rail-overview');
        expect(css).not.toContain('.social-project-task-graph-immersive-body.is-panel-open');
    });

    it('removes backlog and uses four modern status-colored graph nodes', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const columnsBlock = source.match(/const PROJECT_TASK_COLUMNS = \[[\s\S]*?\];/)?.[0] || '';

        expect(columnsBlock).not.toContain("id: 'backlog'");
        expect(columnsBlock).toContain("id: 'todo'");
        expect(columnsBlock).toContain("id: 'in-progress'");
        expect(columnsBlock).toContain("id: 'blocked'");
        expect(columnsBlock).toContain("id: 'done'");
        expect(source).not.toContain('social-project-task-graph-node-core');
        expect(source).not.toContain('social-project-task-graph-node-status-dot');
        expect(css).not.toContain("[data-status='backlog']");
        expect(css).toContain("[data-status='todo']");
        expect(css).toContain("[data-status='in-progress']");
        expect(css).toContain("[data-status='blocked']");
        expect(css).toContain("[data-status='done']");
    });

    it('declares schedule before criticalEdges in renderProjectTaskGraphSvg', () => {
        const source = readGraphSource();
        const svgFn = extractFn(source, 'renderProjectTaskGraphSvg');
        const scheduleDecl = svgFn.indexOf('const schedule =');
        const criticalEdgesUse = svgFn.indexOf('criticalEdges: schedule');
        expect(scheduleDecl).toBeGreaterThan(-1);
        expect(criticalEdgesUse).toBeGreaterThan(-1);
        expect(scheduleDecl).toBeLessThan(criticalEdgesUse);
        expect(svgFn).toContain('options.schedule ??');
    });

    it('supports milestone checkpoint tasks with zero duration in CPM', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        // Milestone create/edit UX removed; CPM still tolerates legacy isMilestone.
        expect(source).not.toContain('name="projectTaskIsMilestone"');
        expect(source).not.toContain('Zero-duration checkpoint');
        expect(source).toContain('isMilestone: false');
        expect(source).toContain('task?.isMilestone');
        expect(source).toContain('if (task?.isMilestone) return 0');
        expect(source).toContain('isMilestone');
        expect(source).toContain('is-milestone');
        expect(css).toContain('.social-project-task-graph-card.is-milestone');
    });

    it('supports port drag linking and explicit edge unlink controls', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const bindFn = extractFn(source, 'bindProjectTaskGraphInteractions');
        const cardFn = extractFn(source, 'renderProjectTaskGraphCardNode');
        const svgFn = extractFn(source, 'renderProjectTaskGraphSvg');

        expect(cardFn).toContain('data-graph-link-port="e"');
        expect(cardFn).toContain('data-graph-link-port="w"');
        expect(cardFn).toContain('data-graph-link-port="n"');
        expect(cardFn).toContain('data-graph-link-port="s"');
        expect(cardFn).toContain('social-project-task-graph-link-handle');
        expect(cardFn).toContain('social-project-task-graph-hit');
        expect(source).toContain('function readProjectTaskGraphPortCenter');
        expect(source).toContain('function findProjectTaskGraphLinkDropTarget');
        expect(source).toContain('function setProjectTaskGraphInteracting');
        expect(source).toContain('function updateProjectTaskGraphLinkPreview');
        expect(bindFn).toContain('portLinkState');
        expect(bindFn).toContain('is-port-linking');
        expect(bindFn).toContain('scheduleProjectTaskGraphEdgeRefresh');
        const edgeFn = extractFn(source, 'renderProjectTaskGraphEdgeGroupsHtml') || svgFn;
        expect(edgeFn).toContain('project-task-graph-unlink-edge');
        expect(edgeFn).toContain('social-project-task-graph-edge-unlink');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-task-graph-unlink-edge'");
        expect(source).toContain('function syncProjectTaskGraphEdgesOnly');
        expect(css).toContain('.social-project-task-graph-link-handle');
        expect(css).toContain('.is-interacting');
        expect(css).toContain('.social-project-task-graph-link-rubber');
        expect(css).toContain('.social-project-task-graph-edge-unlink');
        expect(css).toContain('.social-project-task-graph-link-handle');
        const cardBlock = css.match(/\.social-project-task-graph-card \{[\s\S]*?\}/)?.[0] || '';
        expect(cardBlock).toContain('pointer-events: none');
    });

    it('resolves draggable graph nodes through foreignObject hit targets', () => {
        const source = readGraphSource();
        const bindFn = extractFn(source, 'bindProjectTaskGraphInteractions');
        const dropFn = extractFn(source, 'findProjectTaskGraphLinkDropTarget');

        expect(source).toContain('function resolveProjectTaskGraphNodeFromTarget');
        expect(bindFn).toContain('resolveProjectTaskGraphNodeFromTarget(event.target, svg, { draggableOnly: true })');
        expect(dropFn).toContain('resolveProjectTaskGraphNodeFromTarget(hit, svg)');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("trigger.closest?.('.social-project-task-graph-node-g')");
        expect(source).toContain('draggedNode?.dataset?.kiuDragged');
    });

    it('exits connect mode on cancel, empty canvas, and wire complete; selects on pointerup', () => {
        const source = readGraphSource();
        const selectFn = extractFn(source, 'selectProjectTaskGraphNode');
        const bindFn = extractFn(source, 'bindProjectTaskGraphInteractions');
        const cancelBlock = source.match(/action === 'project-task-graph-link-cancel'[\s\S]*?refreshProjectTaskGraphDialog\(\['chrome', 'selection'\]\)/)?.[0] || '';
        const stageClickFn = bindFn.match(/const onStageClick = \(event\) => \{[\s\S]*?\n        \};/)?.[0] || '';

        expect(source).toContain('function selectProjectTaskGraphNode');
        expect(source).toContain("return selectProjectTaskGraphNode(projectId, taskId)");
        expect(cancelBlock).toContain("projectTaskGraphMode = 'browse'");
        expect(cancelBlock).toContain("projectTaskGraphLinkFrom = ''");
        expect(stageClickFn).toContain("projectTaskGraphMode = 'browse'");
        expect(stageClickFn).toContain("projectTaskGraphLinkFrom = ''");
        expect(selectFn).toContain("projectTaskGraphMode = 'browse'");
        expect(selectFn).toContain('addProjectTaskDependency');
        expect(bindFn).toContain('selectProjectTaskGraphNode(projectId, taskId)');
        expect(bindFn).toContain("kiuGraphSelected = '1'");
        expect(bindFn).toContain("projectTaskGraphMode = 'browse'");
        expect(source).toContain("draggedNode?.dataset?.kiuGraphSelected === '1'");
    });

    it('layers task dialogs above the immersive graph dashboard', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const rebuild = readSource('assets/css/social-rebuild.css');
        const renderDialogFn = extractFn(source, 'renderWorkspaceOwnedDialog')
            || source.match(/function renderDialog\(\) \{[\s\S]*?\n    \}/)?.[0]
            || '';
        const renderOnlyFn = extractFn(source, 'renderDialogOnlyNow')
            || source.match(/function renderDialogOnlyNow\(\) \{[\s\S]*?\n    \}/)?.[0]
            || '';

        expect(source).toContain('function shouldRenderProjectTaskGraphStack');
        expect(source).toContain('function wrapProjectTaskGraphStack');
        expect(source).toContain('social-neo-dialog-backdrop--stacked-child');
        expect(source).toContain('social-neo-dialog-card--social-glass');
        expect(source).toContain('backdropClass');
        expect(renderDialogFn).toContain("kind === 'project-task-edit'");
        expect(renderDialogFn).toContain('wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen');
        expect(renderOnlyFn).toContain('trySyncProjectTaskGraphStackDialog');
        expect(css).toContain('.social-project-task-graph-stack');
        expect(css).toContain('.social-neo-dialog-backdrop--stacked-child');
        expect(css).toContain('#social-neo-overlay-portal:has(.social-neo-dialog-backdrop--stacked-child)');
        expect(css).toContain('z-index: 12050');
        expect(rebuild).toContain('social-neo-dialog-card--social-glass');
        expect(rebuild).toContain('--social-glass-surface');
        expect(rebuild).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--social-glass \{[\s\S]*--social-glass-blur/
        );
        expect(rebuild).not.toMatch(
            /#social-neo-overlay-portal:has\(\.social-neo-dialog-card--project-task-create\) \.social-neo-dialog-backdrop/
        );
        expect(rebuild).toMatch(
            /\.social-neo-dialog-backdrop:has\(> \.social-neo-dialog-card--social-glass\)/
        );
        expect(rebuild).toMatch(
            /\.social-neo-dialog-backdrop--stacked-child:has\(> \.social-neo-dialog-card\)/
        );
        expect(rebuild).toMatch(
            /\.lux-picker-panel\.social-neo-dialog-picker-panel[\s\S]*?z-index:\s*12200/
        );
        expect(rebuild).toContain(
            '.social-neo-dialog-card--social-glass:not(.social-neo-dialog-card--project-health-fs)'
        );
        expect(rebuild).toMatch(
            /\.social-neo-dialog-card--social-glass:not\(\.social-neo-dialog-card--project-health-fs\)[\s\S]*?padding:\s*18px/
        );
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(chrome).toContain("panel.classList.add('social-neo-dialog-picker-panel')");
        expect(chrome).toContain('.social-neo-dialog-backdrop, #social-neo-overlay-portal');
    });

    it('preserves graph anchor DOM and syncs only the stacked child slot', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const wrapFn = extractFn(source, 'wrapProjectTaskGraphStack');
        const syncFn = extractFn(source, 'trySyncProjectTaskGraphStackDialog');
        const renderOnlyFn = source.match(/function renderDialogOnlyNow\(\) \{[\s\S]*?\n    \}/)?.[0] || '';
        const transparencyFn = extractFn(source, 'scheduleSocialOverlayTransparencyRefresh');

        expect(wrapFn).toContain('data-project-task-graph-anchor="1"');
        expect(wrapFn).toContain('data-project-task-graph-child-slot="1"');
        expect(source).toContain('function trySyncProjectTaskGraphStackDialog');
        expect(source).toContain('function renderStackedProjectTaskChild');
        expect(source).toContain('function isProjectTaskGraphStackActive');
        expect(source).toContain('projectTaskGraphStackAnchor');
        expect(syncFn).toContain('childSlot.innerHTML');
        expect(renderOnlyFn).toContain('trySyncProjectTaskGraphStackDialog(shell.dialog, runtime)');
        expect(renderOnlyFn).toContain('if (!stackSynced)');
        expect(renderOnlyFn).toMatch(/if \(stackSynced && activeKind === 'project-task-graph'\)[\s\S]*bindProjectTaskGraphDrag/);
        expect(transparencyFn).toContain('social-project-task-graph-stack');
        expect(transparencyFn).toContain('isProjectTaskGraphStackActive');
        expect(css).toContain('.social-project-task-graph-anchor');
        expect(css).toContain('.social-project-task-graph-child-slot');
        expect(css).toContain('animation: none !important');
    });

    it('renders management card fields and removes Obsidian graph artifacts', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const cardFn = extractFn(source, 'renderProjectTaskGraphCardNode');

        expect(cardFn).toContain('graph-card-headline');
        expect(cardFn).toContain('social-project-task-graph-card-headline');
        expect(cardFn).toContain('social-project-task-graph-card-title');
        expect(cardFn).toContain('titleLabel');
        expect(cardFn).toContain('social-project-task-graph-card-due');
        expect(cardFn).toContain('social-project-task-graph-card-mid');
        expect(cardFn).toContain('social-project-task-graph-card-priority');
        expect(cardFn).toContain('social-project-task-graph-card-budget');
        expect(cardFn).toContain('data-w=');
        expect(cardFn).toContain('data-h=');
        expect(css).toContain('white-space: normal');
        expect(css).toContain('word-break: break-word');
        expect(css).toContain('.social-project-task-graph-card-mid');
        expect(css).toContain('.social-project-task-graph-card-priority');
        expect(css).toContain('.social-project-task-graph-card-budget');
        expect(source).not.toContain('function syncProjectTaskGraphFocus');
        expect(source).not.toContain('is-labels-visible');
        expect(source).not.toContain('baseR: 12');
        expect(source).not.toContain('data-degree');
        expect(source).not.toContain('social-project-task-graph-node-circle');
        expect(css).not.toContain('.is-labels-visible');
        expect(css).not.toContain('.is-dimmed');
    });

    it('migrates legacy backlog status to todo in backend normalization', () => {
        const service = readSource('backend/platform/domains/social-projects-service.js');
        const store = readSource('backend/platform/store.js');

        expect(service).toContain("if (normalized === 'backlog') return 'todo'");
        expect(store).toContain("if (normalized === 'backlog') return 'todo'");
    });

    it('persists matrix priority model and derives bucket from impact × effort', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };

        const project = store.createSocialProject({ title: 'Matrix Project', summary: 'Priority' }, 'owner-1');
        const task = store.createSocialProjectTask(project.id, {
            title: 'Ship feature',
            priorityModel: 'matrix',
            impactScore: 4,
            effortScore: 2
        }, 'owner-1');

        expect(task?.priorityModel).toBe('matrix');
        expect(task?.impactScore).toBe(4);
        expect(task?.effortScore).toBe(2);
        expect(task?.priority).toBe('high');

        const updated = store.updateSocialProjectTask(project.id, task.id, {
            impactScore: 5,
            effortScore: 1
        }, 'owner-1');
        expect(updated?.priority).toBe('urgent');
    });

    it('persists dependsOnTaskIds through the social projects store', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };

        const project = store.createSocialProject({ title: 'Graph Project', summary: 'Deps' }, 'owner-1');
        const taskA = store.createSocialProjectTask(project.id, { title: 'Research' }, 'owner-1');
        const taskB = store.createSocialProjectTask(project.id, {
            title: 'Prototype',
            dependsOnTaskIds: [taskA.id]
        }, 'owner-1');

        expect(taskB?.dependsOnTaskIds).toEqual([taskA.id]);

        store.deleteSocialProjectTask(project.id, taskA.id, 'owner-1');
        const remaining = store.state.social.projectTasks.find((entry) => entry.id === taskB.id);
        expect(remaining?.dependsOnTaskIds).toEqual([]);
    });

    it('persists graph node positions in localStorage', () => {
        const source = readGraphSource();
        expect(source).toContain('function projectTaskGraphPositionsStorageKey(projectId)');
        expect(source).toContain('function loadProjectTaskGraphPositions(projectId)');
        expect(source).toContain('function saveProjectTaskGraphPositions(projectId, positions, options = {})');
        expect(source).toContain('function ensureProjectTaskGraphPositionsLoaded(runtime, projectId)');
        expect(source).toContain('function getProjectTaskGraphPositions(runtime, projectId)');
        expect(source).toContain('function setProjectTaskGraphPositions(runtime, projectId, positions, options = {})');
        expect(source).toContain('function applyProjectTaskGraphSavedPositions');
        expect(source).toContain('function projectTaskGraphLayoutUsesSavedPositions');
        expect(source).toContain('function queueProjectTaskGraphSync(');
        expect(source).toContain('function seedProjectTaskGraphFromProject(');
        expect(source).toContain('projectTaskGraphPositionsByProject');
        expect(source).toContain('kiu.projectTaskGraph.positions.');
        expect(source).toContain('queueProjectTaskGraphSync');
        expect(source).toContain('ensureProjectTaskGraphPositionsLoaded');
        expect(source).toContain('getProjectTaskGraphPositions(runtime, projectId)');
        expect(source).toContain('setProjectTaskGraphPositions(runtime, projectId, positions');
        // Always honor dragged/saved coords — user places boxes; layout only seeds missing ones
        expect(source).toContain('projectTaskGraphLayoutUsesSavedPositions(layout, runtime)');
        expect(source).toContain('layout = applyProjectTaskGraphSavedPositions(layout, savedPositions)');
        expect(source).toContain('function projectTaskGraphLayoutUsesSavedPositions');
        expect(source).toContain('return true;');
        // Quick-create pins card at click coordinates
        expect(source).toContain('positions[taskId] = { x: graphX, y: graphY }');
        expect(source).toContain('graphX: coords.x');
        expect(source).toContain('graphY: coords.y');
        expect(source).not.toContain("action === 'project-task-graph-clear-deps'");
        expect(source).not.toContain("action === 'project-task-graph-layout-status'");
        expect(source).not.toContain("action === 'project-task-graph-connect-by-status'");
    });

    it('always applies saved free positions so boxes do not auto-sort', () => {
        const source = readGraphSource();
        const gate = extractFn(source, 'projectTaskGraphLayoutUsesSavedPositions');
        expect(gate).toContain('return true;');
        expect(gate).not.toContain("kind === 'force' || kind === 'free'");
        const canvasFn = extractFn(source, 'buildProjectTaskGraphCanvasMarkup');
        expect(canvasFn).toContain('if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime))');
        expect(canvasFn).toContain('applyProjectTaskGraphSavedPositions(layout, savedPositions)');
        const fullscreenFn = extractFn(source, 'renderProjectTaskGraphFullscreen');
        expect(fullscreenFn).toContain('if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime))');
        const previewFn = extractFn(source, 'renderTaskDependencyGraphPreview');
        expect(previewFn).toContain('if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime))');
        const overlapFn = extractFn(source, 'resolveProjectTaskGraphCardOverlaps');
        expect(overlapFn).toContain('return false;');
        const groupBoxFn = extractFn(source, 'resolveProjectTaskGraphGroupBox');
        expect(groupBoxFn).toContain('Prefer user-placed coords always');
        expect(groupBoxFn).not.toContain('sy / members.length');
    });

    it('uses content-bounds viewBox for fullscreen and includes groups/negatives', () => {
        const source = readGraphSource();
        expect(source).toContain('PROJECT_TASK_GRAPH_MIN_ZOOM = 0.12');
        expect(source).toContain('function projectTaskGraphContentViewBox');
        expect(source).toContain('function collectProjectTaskGraphGroupBoxes');
        expect(source).toContain('function resolveProjectTaskGraphGroupBox');
        expect(source).toContain('layout.contentMinX');
        expect(source).toContain('isProjectTaskGraphGroupId(id)');
        const applyFn = extractFn(source, 'applyProjectTaskGraphSavedPositions');
        expect(applyFn).toContain('minX');
        expect(applyFn).toContain('spanW');
        const canvasFn = extractFn(source, 'buildProjectTaskGraphCanvasMarkup');
        expect(canvasFn).toContain('projectTaskGraphContentViewBox');
        expect(canvasFn).toContain('contentBounds: bounds');
        expect(canvasFn).toContain('viewBox');
        const fitFn = extractFn(source, 'computeProjectTaskGraphContentFitView');
        expect(fitFn).toContain('extraBoxes');
        expect(fitFn).toContain('bounds.width * zoom');
        expect(fitFn).toContain("coords: 'bounds'");
        expect(fitFn).not.toContain('cx * zoom');
        const loadViewFn = extractFn(source, 'loadProjectTaskGraphView');
        expect(loadViewFn).toContain("coords || '') !== 'bounds'");
        expect(source).toContain('Capture last pan/zoom before teardown');
        const resetFn = extractFn(source, 'applyProjectTaskGraphResetView');
        expect(resetFn).toContain('collectProjectTaskGraphGroupBoxes');
        expect(resetFn).toContain('extraBoxes: groupBoxes');
        // Zoom floor unified — apply paths must not clamp above fit min
        expect(source).toContain('clampProjectTaskGraphZoom');
        expect(source).not.toContain('Math.max(0.35, Math.min(1.6');
    });

    it('includes membership edges in cycle detection', () => {
        const source = readGraphSource();
        const cycleFn = extractFn(source, 'projectTaskGraphWouldCycle');
        expect(cycleFn).toContain('memberTaskIds');
        expect(cycleFn).toContain('Membership sink');
        expect(cycleFn).toContain('deps.push(mid)');
    });

    it('scrubs groups when deleting tasks or packages', () => {
        const source = readGraphSource();
        expect(source).toContain('function scrubDeletedTaskFromProjectTaskGraphGroups');
        const scrubFn = extractFn(source, 'scrubDeletedTaskFromProjectTaskGraphGroups');
        expect(scrubFn).toContain('memberTaskIds');
        expect(scrubFn).toContain('blocksIds');
        expect(scrubFn).toContain('dependsOnIds');
        const deleteGroupFn = extractFn(source, 'deleteProjectTaskGraphGroup');
        expect(deleteGroupFn).toContain('patchLocalProjectTaskDepends');
        expect(deleteGroupFn).toContain('dependsOnIds');
        expect(deleteGroupFn).toContain('blocksIds');
        const deleteBlock = source.match(/if \(formType === 'dialog-project-task-delete'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        expect(deleteBlock).toContain('scrubDeletedTaskFromProjectTaskGraphGroups(runtime, projectId, taskId)');
    });

    it('computes package rollup from nested descendant tasks', () => {
        const source = readGraphSource();
        expect(source).toContain('function collectProjectTaskGraphGroupDescendantTaskIds');
        expect(source).toContain('function collectProjectTaskGraphGroupAbsorbedTaskIds');
        expect(source).not.toContain('function collectProjectTaskGraphGroupConnectedTaskIds');
        const absorbed = extractFn(source, 'collectProjectTaskGraphGroupAbsorbedTaskIds');
        expect(absorbed).toContain('dependentsOf');
        expect(absorbed).toContain('Downstream only');
        expect(absorbed).not.toContain('Upstream');
        const rollup = extractFn(source, 'computeProjectTaskGraphGroupRollup');
        expect(rollup).toContain('collectProjectTaskGraphGroupAbsorbedTaskIds');
        expect(rollup).toContain('includeOrderLinks: false');
        expect(rollup).not.toContain('collectProjectTaskGraphGroupConnectedTaskIds');
        expect(rollup).toContain('descendantIds');
        expect(rollup).toContain('actualCost');
        expect(rollup).toContain('actualHours');
        expect(rollup).toContain('hoursTotal');
        expect(rollup).toContain('hoursRemaining');
        expect(rollup).toContain('pathRemainingHours');
        expect(rollup).toContain('minFloatHours');
        expect(rollup).toContain('memberCritical');
        expect(rollup).toContain('startLabel');
        expect(rollup).toContain('dueLabel');
        expect(rollup).not.toContain('avgHours');
        expect(rollup).not.toContain('finishHours');
        expect(source).toContain('function projectTaskGraphGroupMembershipWouldCycle');
        expect(source).toContain('Drag tasks or packages here · wire ports for order');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('class="social-neo-card social-project-rich-panel social-neo-stack"');
        expect(source).not.toContain('data-form="project-budget-settings" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack"');
    });

    it('invalidates tab pane cache so task-map preview updates without full page reload', () => {
        const source = readGraphSource();
        expect(source).toContain('function notifyProjectTaskGraphSurfaceChanged');
        expect(source).toContain('function rebuildActiveProjectTabPaneIfPreviewHost');
        expect(source).toContain("PROJECT_TABS_WITH_GRAPH_PREVIEW = new Set(['overview', 'tasks'])");
        expect(source).toContain('notifyProjectTaskGraphSurfaceChanged(id)');
        expect(source).toContain('projectTaskGraphPreviewStale');
        // Closing the keep-center graph dialog rebuilds the preview host tab
        const closeFn = source.match(/function closeDialog\(\) \{[\s\S]*?\n    \}/)?.[0] || '';
        expect(closeFn).toContain("closingType === 'project-task-graph'");
        expect(closeFn).toContain('rebuildActiveProjectTabPaneIfPreviewHost(closingProjectId)');
        expect(closeFn).toContain('clearProjectTabPaneCache(closingProjectId)');
        // Position saves and dependency edits notify
        expect(source).toContain('notifyProjectTaskGraphSurfaceChanged(origin.projectId)');
        expect(source).toContain('notifyProjectTaskGraphSurfaceChanged(projectId)');
    });

    it('rebuilds graph canvas after stacked create/edit/delete so squares update live', () => {
        const source = readGraphSource();
        const createBlock = source.match(/if \(formType === 'project-task-create'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const editBlock = source.match(/if \(formType === 'project-task-edit'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const deleteBlock = source.match(/if \(formType === 'dialog-project-task-delete'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const canvasRefresh = "refreshProjectTaskGraphDialog(['canvas', 'selection', 'sidebar', 'chrome'])";

        expect(createBlock).toContain('stackedGraph');
        expect(createBlock).toContain(canvasRefresh);
        expect(editBlock).toContain('stackedGraph');
        expect(editBlock).toContain(canvasRefresh);
        expect(deleteBlock).toContain('stackedGraph');
        expect(deleteBlock).toContain(canvasRefresh);
        expect(deleteBlock).toContain('text(runtime.ui.projectTaskGraphSelectedId) === taskId');
        expect(deleteBlock).toContain("projectTaskGraphSelectedId = ''");
    });

    it('updates graph edges without full canvas remount to avoid panel flicker', () => {
        const source = readGraphSource();
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(source).toContain('function patchRemoveProjectTaskGraphEdge');
        expect(source).not.toContain('function patchClearProjectTaskGraphEdges');
        expect(source).not.toContain('function runProjectTaskGraphBatchDeps');
        expect(source).toContain('function syncProjectTaskGraphEdgesOnly');
        expect(source).toContain('function renderProjectTaskGraphEdgeGroupsHtml');
        expect(source).toContain('function readProjectTaskGraphLivePositions');
        expect(source).toContain('function patchProjectTaskGraphLinkCountLabel');
        // Unlink: surgical remove only — no sidebar/selection/canvas refresh
        const unlinkBlock = (source + readSource('assets/js/pages/social-workspace.js')).match(/if \(action === 'project-task-graph-unlink'[\s\S]*?\n        \}/)?.[0] || '';
        expect(unlinkBlock).toContain('patchRemoveProjectTaskGraphEdge');
        expect(unlinkBlock).toContain('patchProjectTaskGraphLinkCountLabel');
        expect(unlinkBlock).not.toContain("refreshProjectTaskGraphDialog(['selection', 'sidebar'])");
        expect(unlinkBlock).not.toContain("refreshProjectTaskGraphDialog(['canvas'");
        // Soft failures while graph is open never remount the dialog
        const refreshFn = extractFn(source, 'refreshProjectTaskGraphDialog');
        expect(refreshFn).toContain('// Soft failure while graph is open');
        expect(refreshFn).not.toMatch(/if \(!ok\) return renderDialogOnlyNow/);
        // Canvas rebuild preserves scroll when possible
        const canvasSync = extractFn(source, 'syncProjectTaskGraphCanvas');
        expect(canvasSync).toContain('prevScrollLeft');
        expect(canvasSync).toContain('prevScrollTop');
        // Root flicker cause: hydrateRuntime after every task update — graph deps/quick-add use silent mode
        expect(runtime).toContain('function applyProjectTaskLocally');
        expect(runtime).toContain('options.silent');
        expect(runtime).toContain('// Graph dependency edits use silent:true');
        expect(runtime).toContain('// Graph quick-add uses silent:true');
        expect(source).toContain("{ silent: true }");
        const removeDep = extractFn(source, 'removeProjectGraphDependency');
        expect(removeDep).toContain('silent: true');
        const addDep = extractFn(source, 'addProjectGraphDependency');
        expect(addDep).toContain('silent: true');
        const quickCreateSubmit = source.match(/formType === 'project-task-graph-quick-create'[\s\S]*?\n        \}/)?.[0] || '';
        expect(quickCreateSubmit).toContain('{ silent: true }');
        expect(quickCreateSubmit).toContain("skipRender: true");
        expect(quickCreateSubmit).toContain("refreshProjectTaskGraphDialog(['quickCreate', 'canvas', 'selection', 'sidebar', 'chrome'])");
        const quickCreateSync = extractFn(source, 'syncProjectTaskGraphQuickCreate');
        expect(quickCreateSync).toContain('enhanceUniversalPickers');
    });

    it('remembers graph zoom/pan per project and resets view to content fit', () => {
        const source = readGraphSource();
        expect(source).toContain('function projectTaskGraphViewStorageKey');
        expect(source).toContain('function loadProjectTaskGraphView');
        expect(source).toContain('function saveProjectTaskGraphView');
        expect(source).toContain('function persistProjectTaskGraphView');
        expect(source).toContain('function computeProjectTaskGraphContentFitView');
        expect(source).toContain('function applyProjectTaskGraphResetView');
        expect(source).toContain('kiu.projectTaskGraph.view.');
        expect(source).toContain('loadProjectTaskGraphView(openProjectId)');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('data-action="project-task-graph-reset-view"');
        expect(source).toContain('Reset view');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('project-task-graph-zoom-fit');
        // Fit/reset uses content bounds (like preview), not stage-only fit
        const resetBlock = (source + readSource('assets/js/pages/social-workspace.js')).match(/if \(action === 'project-task-graph-zoom-fit'[\s\S]*?\n        \}/)?.[0] || '';
        expect(resetBlock).toContain('applyProjectTaskGraphResetView');
        expect(source).toContain('projectTaskGraphContentBounds');
        expect(source).toContain('persistProjectTaskGraphView(runtime)');
        expect(source).toContain('persistProjectTaskGraphView(state())');
    });

    it('shows group package completion percent with progress bar', () => {
        const source = readGraphSource();
        const css = readSource('assets/css/social-projects-lms.css');
        const rollup = extractFn(source, 'computeProjectTaskGraphGroupRollup');
        const groupNode = extractFn(source, 'renderProjectTaskGraphGroupNode');

        expect(rollup).toContain('pctComplete');
        expect(rollup).toContain('progressMode');
        expect(rollup).toContain('countPct');
        expect(rollup).toContain('hoursTotal');
        expect(rollup).toContain('blocked');
        expect(rollup).toContain('overdue');
        expect(rollup).toContain('unassigned');
        expect(rollup).toContain('critical');
        expect(rollup).toContain('criticalBlocked');
        expect(rollup).toContain('pathRemainingHours');
        expect(rollup).toContain('minFloatHours');
        expect(rollup).toContain('packageCritical');
        expect(rollup).toContain('hoursRemaining');
        expect(rollup).toContain('budgetDelta');
        expect(rollup).toContain('hasAttention');
        expect(groupNode).toContain('social-project-task-graph-group-progress');
        expect(groupNode).toContain('% complete');
        expect(groupNode).toContain('progress-fill');
        expect(groupNode).toContain('social-project-task-graph-group-signals');
        expect(groupNode).toContain('social-project-task-graph-group-foot');
        expect(groupNode).toContain('path ${escape(pathLabel)}');
        expect(groupNode).toContain('slack ${escape(formatProjectScheduleFloat(roll.minFloatHours))}');
        expect(groupNode).toContain('moneyPill');
        expect(groupNode).toContain('timePill');
        expect(groupNode).toContain('rangePill');
        expect(groupNode).toContain('variancePill');
        expect(groupNode).toContain('options.isCritical');
        expect(groupNode).toContain('(options.showCritical !== false) && Boolean(options.isCritical)');
        expect(groupNode).not.toContain('roll.packageCritical');
        expect(groupNode).toContain('connectedCount ?');
        expect(groupNode).not.toContain('avgHours');
        expect(groupNode).not.toContain('to finish');
        expect(groupNode).not.toContain('zero slack');
        expect(css).toContain('.social-project-task-graph-group-progress-track');
        expect(css).toContain('.social-project-task-graph-group-progress-fill');
        expect(css).toContain('.social-project-task-graph-group-signal.is-blocked');
        expect(css).toContain('.social-project-task-graph-group-signal.is-overdue');
        expect(css).toContain('.social-project-task-graph-group-signal.is-critical');
        expect(css).toContain('.social-project-task-graph-group-signal.is-float');
        expect(css).toContain('[data-attention="1"]');
        const schedule = extractFn(source, 'computeProjectSchedule');
        expect(schedule).toContain('openMemberWork');
        expect(schedule).toContain('isCriticalBridge');
        expect(schedule).not.toContain('openOrderWork');
        expect(schedule).toContain('taskScheduleRemainingHours');
    });

    it('zeros remaining schedule duration for done tasks; blocked keeps PERT', () => {
        const source = readGraphSource();
        expect(source).toContain('function taskScheduleRemainingHours');
        const remaining = extractFn(source, 'taskScheduleRemainingHours');
        expect(remaining).toContain("=== 'done'");
        expect(remaining).toContain('taskDurationHours');
        const schedule = extractFn(source, 'computeProjectSchedule');
        expect(schedule).toContain('taskScheduleRemainingHours');
        expect(schedule).toContain('isDone');
        expect(schedule).toContain('isBlocked');
        expect(schedule).toContain('plannedDurationHours');
        const display = extractFn(source, 'formatTaskScheduleDisplay');
        expect(display).toContain('Done (no remaining slack)');
        expect(display).toContain('Critical · blocked');
    });
});


function loadPackageScheduleSandbox() {
    const vm = require('vm');
    const source = readGraphSource();
    const context = {
        state: () => ({}),
        getProjectTaskGraphGroups: () => []
    };
    vm.createContext(context);
    [
        'text',
        'uniqueStrings',
        'normalizeTaskTimeUnit',
        'normalizeTaskTime',
        'computePertExpected',
        'taskHasPert',
        'resolveTaskScheduleEstimate',
        'normalizeProjectTaskStatusId',
        'projectTaskDependsOnIds',
        'isProjectTaskGraphGroupId',
        'projectGroupDependsOnIds',
        'projectGroupBlocksIds',
        'collectProjectTaskGraphGroupDescendantTaskIds',
        'collectProjectTaskGraphGroupAbsorbedTaskIds',
        'taskDurationHours',
        'taskScheduleRemainingHours',
        'computeProjectSchedule',
        'computeProjectTaskGraphGroupRollup'
    ].forEach((name) => {
        const block = extractFunction(source, name);
        if (!block) throw new Error(`missing function ${name}`);
        vm.runInContext(block, context);
    });
    return context;
}

describe('package membership rollup and critical bridge', () => {
    it('order-only package absorbs downstream chain in rollup; package paint stays non-critical', () => {
        const sb = loadPackageScheduleSandbox();
        const groups = [{
            id: 'grp_fr',
            name: 'fr',
            memberTaskIds: [],
            blocksIds: ['asd'],
            dependsOnIds: []
        }];
        const project = {
            id: 'p1',
            budgetCurrency: 'USD',
            tasks: [
                { id: 'asd', status: 'todo', timeEstimate: 5, budgetEstimate: 1000, dependsOnTaskIds: ['grp_fr'] },
                { id: 'asdasd', status: 'todo', timeEstimate: 13, budgetEstimate: 44444, dependsOnTaskIds: ['asd'] }
            ]
        };
        const sched = sb.computeProjectSchedule(project, { groups });
        expect(sched.byId.asd.isCritical).toBe(true);
        expect(sched.byId.asdasd.isCritical).toBe(true);
        expect(sched.byId.grp_fr.isCritical).toBe(false);

        const roll = sb.computeProjectTaskGraphGroupRollup(groups[0], project, { groups, schedule: sched });
        expect(roll.count).toBe(2);
        expect(roll.memberCount).toBe(0);
        expect(roll.connectedCount).toBe(2);
        expect(roll.budget).toBe(45444);
        expect(roll.hoursTotal).toBe(18);
        expect(roll.critical).toBe(2);
        expect(roll.packageCritical).toBe(false);
    });

    it('package with critical member is critical via open member work', () => {
        const sb = loadPackageScheduleSandbox();
        const groups = [{
            id: 'grp_pkg',
            name: 'pkg',
            memberTaskIds: ['a'],
            blocksIds: ['b'],
            dependsOnIds: []
        }];
        const project = {
            id: 'p1',
            tasks: [
                { id: 'a', status: 'todo', timeEstimate: 8, dependsOnTaskIds: [] },
                { id: 'b', status: 'todo', timeEstimate: 4, dependsOnTaskIds: ['grp_pkg'] }
            ]
        };
        const sched = sb.computeProjectSchedule(project, { groups });
        expect(sched.byId.a.isCritical).toBe(true);
        expect(sched.byId.b.isCritical).toBe(true);
        expect(sched.byId.grp_pkg.isCritical).toBe(true);

        const roll = sb.computeProjectTaskGraphGroupRollup(groups[0], project, { groups, schedule: sched });
        expect(roll.count).toBe(2);
        expect(roll.memberCount).toBe(1);
        expect(roll.connectedCount).toBe(1);
        expect(roll.hoursTotal).toBe(12);
        expect(roll.memberCritical).toBe(1);
        expect(roll.packageCritical).toBe(true);
    });

    it('empty mid-path package is critical only as a tight bridge', () => {
        const sb = loadPackageScheduleSandbox();
        const groups = [{
            id: 'grp_mid',
            name: 'mid',
            memberTaskIds: [],
            blocksIds: ['c'],
            dependsOnIds: ['a']
        }];
        const project = {
            id: 'p1',
            tasks: [
                { id: 'a', status: 'todo', timeEstimate: 5, dependsOnTaskIds: [] },
                { id: 'c', status: 'todo', timeEstimate: 5, dependsOnTaskIds: ['grp_mid'] },
                { id: 'side', status: 'todo', timeEstimate: 1, dependsOnTaskIds: [] }
            ]
        };
        const sched = sb.computeProjectSchedule(project, { groups });
        expect(sched.byId.a.isCritical).toBe(true);
        expect(sched.byId.c.isCritical).toBe(true);
        expect(sched.byId.side.isCritical).toBe(false);
        expect(sched.byId.grp_mid.isCritical).toBe(true);
        expect(sched.criticalEdges.has('a->grp_mid')).toBe(true);
        expect(sched.criticalEdges.has('grp_mid->c')).toBe(true);

        const roll = sb.computeProjectTaskGraphGroupRollup(groups[0], project, { groups, schedule: sched });
        expect(roll.count).toBe(2);
        expect(roll.memberCount).toBe(0);
        expect(roll.connectedCount).toBe(2);
        expect(roll.packageCritical).toBe(true);
    });
});

describe('wire direction and critical path clarity', () => {
    it('marks north in / south out and resolves wire endpoints by port role', () => {
        const source = readGraphSource();
        expect(source).toContain('is-side-n is-in');
        expect(source).toContain('is-side-s is-out');
        expect(source).toContain('function projectTaskGraphPortRole');
        expect(source).toContain('function resolveProjectTaskGraphWireEndpoints');
        expect(source).toContain('resolveProjectTaskGraphWireEndpoints(origin, target)');
        expect(source).toContain('Arrow-critical${escape(markerSuffix)}');

        const vm = require('vm');
        const context = {};
        vm.createContext(context);
        ['text', 'projectTaskGraphPortRole', 'resolveProjectTaskGraphWireEndpoints'].forEach((name) => {
            const block = extractFunction(source, name);
            if (!block) throw new Error(`missing ${name}`);
            vm.runInContext(block, context);
        });

        expect(context.projectTaskGraphPortRole('n')).toBe('in');
        expect(context.projectTaskGraphPortRole('s')).toBe('out');
        expect(context.projectTaskGraphPortRole('w')).toBe('in');
        expect(context.projectTaskGraphPortRole('e')).toBe('out');

        // out → in keeps drag order (xcv south → asdsd north ⇒ xcv precedes asdsd)
        expect(context.resolveProjectTaskGraphWireEndpoints(
            { taskId: 'xcv', side: 's' },
            { taskId: 'asdsd', side: 'n' }
        )).toEqual({ from: 'xcv', to: 'asdsd' });

        // in → out flips (asdsd north → xcv south ⇒ still xcv precedes asdsd)
        expect(context.resolveProjectTaskGraphWireEndpoints(
            { taskId: 'asdsd', side: 'n' },
            { taskId: 'xcv', side: 's' }
        )).toEqual({ from: 'xcv', to: 'asdsd' });

        // same-role keeps drag order
        expect(context.resolveProjectTaskGraphWireEndpoints(
            { taskId: 'a', side: 'e' },
            { taskId: 'b', side: 'e' }
        )).toEqual({ from: 'a', to: 'b' });
    });

    it('marks critical twin paths with the critical arrow marker', () => {
        const source = readGraphSource();
        const taskEdges = extractFn(source, 'renderProjectTaskGraphEdgeGroupsHtml');
        expect(taskEdges).toContain('is-critical-twin');
        expect(taskEdges).toContain('socialProjectTaskGraphArrow-critical');
        expect(taskEdges).toContain('${criticalMarker}');
        expect(source).toContain('is-critical-twin is-group-dep');
        expect(source).toContain('Arrow-critical${escape(markerSuffix)}');
    });

    it('chain asdsd→xcv→test is all critical; parallel xcv→{test,asdsd} only longest branch', () => {
        const sb = loadPackageScheduleSandbox();

        const chain = sb.computeProjectSchedule({
            id: 'p1',
            tasks: [
                { id: 'asdsd', status: 'todo', timeEstimate: 16.7, dependsOnTaskIds: [] },
                { id: 'xcv', status: 'todo', timeEstimate: 33, dependsOnTaskIds: ['asdsd'] },
                { id: 'test', status: 'todo', timeEstimate: 3, dependsOnTaskIds: ['xcv'] },
                { id: 'asdasdad', status: 'todo', timeEstimate: 0, dependsOnTaskIds: ['xcv'] }
            ]
        }, { groups: [] });
        expect(chain.byId.asdsd.isCritical).toBe(true);
        expect(chain.byId.xcv.isCritical).toBe(true);
        expect(chain.byId.test.isCritical).toBe(true);
        expect(chain.criticalEdges.has('asdsd->xcv')).toBe(true);
        expect(chain.criticalEdges.has('xcv->test')).toBe(true);
        expect(chain.criticalEdges.has('xcv->asdasdad')).toBe(false);

        const parallel = sb.computeProjectSchedule({
            id: 'p1',
            tasks: [
                { id: 'bbbbb', status: 'todo', timeEstimate: 0, dependsOnTaskIds: [] },
                { id: 'xcv', status: 'todo', timeEstimate: 33, dependsOnTaskIds: ['bbbbb'] },
                { id: 'test', status: 'todo', timeEstimate: 3, dependsOnTaskIds: ['xcv'] },
                { id: 'asdsd', status: 'todo', timeEstimate: 16.7, dependsOnTaskIds: ['xcv'] },
                { id: 'asdasdad', status: 'todo', timeEstimate: 0, dependsOnTaskIds: ['xcv'] },
                { id: 'adasdasdasd', status: 'todo', timeEstimate: 0, dependsOnTaskIds: ['test'] }
            ]
        }, { groups: [] });
        expect(parallel.byId.xcv.isCritical).toBe(true);
        expect(parallel.byId.asdsd.isCritical).toBe(true);
        expect(parallel.byId.test.isCritical).toBe(false);
        expect(parallel.criticalEdges.has('xcv->asdsd')).toBe(true);
        expect(parallel.criticalEdges.has('xcv->test')).toBe(false);
    });
});

describe('package membership absorb', () => {
    it('clears dragState after membership drop and highlights drop target while dragging', () => {
        const source = readGraphSource();
        expect(source).toContain('findProjectTaskGraphMembershipDropGroup');
        expect(source).toContain('absorbedIntoGroup');
        expect(source).toContain('dragState = null');
        expect(source).toContain('releasePointerCapture');
        // Drop no longer early-returns before clearing drag state.
        const bindFn = extractFn(source, 'bindProjectTaskGraphInteractions');
        expect(bindFn).toContain('absorbedIntoGroup');
        const absorbIdx = bindFn.indexOf('absorbedIntoGroup = true');
        const clearIdx = bindFn.indexOf('dragState = null', absorbIdx);
        const refreshIdx = bindFn.indexOf("refreshProjectTaskGraphDialog(['canvas', 'chrome'])", absorbIdx);
        expect(absorbIdx).toBeGreaterThan(-1);
        expect(clearIdx).toBeGreaterThan(absorbIdx);
        expect(refreshIdx).toBeGreaterThan(clearIdx);
        expect(bindFn).toContain('Highlight package under pointer for membership absorb');
        expect(source).toContain('Dragged card covers the package');
        expect(source).toContain('Linked by order only — drag tasks in to add members');
    });

    it('rollup includes members plus order-linked downstream; membership-only stays members', () => {
        const sb = loadPackageScheduleSandbox();
        const withOrder = [{
            id: 'grp_pkg',
            name: 'pkg',
            memberTaskIds: ['t1'],
            blocksIds: ['t2'],
            dependsOnIds: []
        }];
        const project = {
            id: 'p1',
            budgetCurrency: 'USD',
            tasks: [
                { id: 't1', status: 'todo', timeEstimate: 8, budgetEstimate: 100, dependsOnTaskIds: [] },
                { id: 't2', status: 'todo', timeEstimate: 99, budgetEstimate: 9999, dependsOnTaskIds: ['grp_pkg'] }
            ]
        };
        const sched = sb.computeProjectSchedule(project, { groups: withOrder });
        const roll = sb.computeProjectTaskGraphGroupRollup(withOrder[0], project, { groups: withOrder, schedule: sched });
        expect(roll.count).toBe(2);
        expect(roll.memberCount).toBe(1);
        expect(roll.connectedCount).toBe(1);
        expect(roll.budget).toBe(10099);
        expect(roll.hoursTotal).toBe(107);

        const membersOnly = [{
            id: 'grp_m',
            name: 'm',
            memberTaskIds: ['solo'],
            blocksIds: [],
            dependsOnIds: []
        }];
        const soloProject = {
            id: 'p2',
            budgetCurrency: 'USD',
            tasks: [
                { id: 'solo', status: 'todo', timeEstimate: 4, budgetEstimate: 50, dependsOnTaskIds: [] },
                { id: 'unrelated', status: 'todo', timeEstimate: 20, budgetEstimate: 1, dependsOnTaskIds: [] }
            ]
        };
        const soloRoll = sb.computeProjectTaskGraphGroupRollup(membersOnly[0], soloProject, {
            groups: membersOnly,
            schedule: sb.computeProjectSchedule(soloProject, { groups: membersOnly })
        });
        expect(soloRoll.count).toBe(1);
        expect(soloRoll.memberCount).toBe(1);
        expect(soloRoll.connectedCount).toBe(0);
        expect(soloRoll.budget).toBe(50);
        expect(soloRoll.descendantIds).toEqual(['solo']);
    });

    it('does not pull upstream predecessors of order seeds', () => {
        const sb = loadPackageScheduleSandbox();
        const groups = [{
            id: 'grp_mid',
            name: 'mid',
            memberTaskIds: [],
            blocksIds: [],
            dependsOnIds: ['seed']
        }];
        const project = {
            id: 'p1',
            budgetCurrency: 'USD',
            tasks: [
                { id: 'upstream', status: 'todo', timeEstimate: 50, budgetEstimate: 5000, dependsOnTaskIds: [] },
                { id: 'seed', status: 'todo', timeEstimate: 3, budgetEstimate: 30, dependsOnTaskIds: ['upstream'] },
                { id: 'child', status: 'todo', timeEstimate: 2, budgetEstimate: 20, dependsOnTaskIds: ['seed'] }
            ]
        };
        // Package waits on seed (dependsOnIds). Seed is absorbed; child is downstream of seed.
        // upstream feeds seed but must NOT enter rollup.
        groups[0].dependsOnIds = ['seed'];
        // Also wire package so seed finishes before something — seed is order neighbor via dependsOnIds.
        const roll = sb.computeProjectTaskGraphGroupRollup(groups[0], project, {
            groups,
            schedule: sb.computeProjectSchedule(project, { groups })
        });
        expect(roll.descendantIds.sort()).toEqual(['child', 'seed'].sort());
        expect(roll.descendantIds).not.toContain('upstream');
        expect(roll.count).toBe(2);
        expect(roll.budget).toBe(50);
    });
});

describe('desk-graph sync helpers', () => {
    it('notifies group membership writes and can auto-place desk tasks', () => {
        const source = readGraphSource();
        expect(source).toContain('function setProjectTaskGraphGroups');
        expect(source).toContain('refreshDeskAfterGraphMembership');
        expect(source).toContain('notifyProjectTaskGraphSurfaceChanged(id)');
        expect(source).toContain('function ensureProjectTaskGraphPositionForTask');
        expect(source).toContain('function findFreeProjectTaskGraphPosition');
        expect(source).toContain('projectTaskCreateGroupId');
    });
});

describe('project section LMS light mode CSS contract', () => {
    it('defines --sn-proj-* tokens on shell and overlay portal', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const tokenBlock = css.match(
            /body\.lux-light-mode\.lux-route-social \.social-projects-shell,\s*html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(tokenBlock).toContain('--sn-proj-ink: #201912');
        expect(tokenBlock).toContain('--sn-proj-ink-muted:');
        expect(tokenBlock).toContain('--sn-proj-surface:');
        expect(tokenBlock).toContain('--sn-proj-border:');
        expect(tokenBlock).toContain('--sn-proj-lane:');
    });

    it('overrides package + card title ink for light mode', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const lightScope =
            /html body\.lux-light-mode\.lux-route-social :is\(#public-social-root, #social-neo-overlay-portal\)/;
        const packageRule = css.match(
            new RegExp(
                `${lightScope.source} \\.social-project-task-graph-group \\{[\\s\\S]*?\\n\\}`
            )
        )?.[0] || '';
        const titleRule = css.match(
            new RegExp(
                `${lightScope.source} \\.social-project-task-graph-card-title \\{[\\s\\S]*?\\n\\}`
            )
        )?.[0] || '';
        expect(packageRule).toMatch(/color:\s*var\(--sn-proj-ink\)/);
        expect(packageRule).toMatch(/background:/);
        expect(packageRule).not.toMatch(/color:\s*#e2e8f0/);
        expect(titleRule).toMatch(/color:\s*var\(--sn-proj-ink\)/);
    });

    it('covers health/risk dialog light ink overrides', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal :is\([\s\S]*?\.social-neo-dialog-card--project-health[\s\S]*?\.social-neo-dialog-card--project-risk/
        );
        expect(css).toContain('.sph-verdict-lede p');
        expect(css).toContain('.spr-section-label');
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal :is\([\s\S]*?\.sph-card[\s\S]*?\.spr-risk-card[\s\S]*?border-color:\s*var\(--sn-proj-border\)/
        );
    });

    it('remaps Work Desk --spt-* tokens for light mode', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const deskTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social \.social-projects-shell \.social-project-task-shell--desk \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(deskTokens).toMatch(/--spt-ink:\s*var\(--sn-proj-ink/);
        expect(deskTokens).toMatch(/--spt-muted:\s*var\(--sn-proj-ink-muted/);
        expect(deskTokens).toMatch(/--spt-panel:\s*var\(--sn-proj-surface/);
        expect(deskTokens).toMatch(/--spt-panel-2:\s*var\(--sn-proj-surface-soft/);
        expect(deskTokens).toMatch(/--spt-line:\s*var\(--sn-proj-border/);
    });

    it('overrides desk package, plan health, and focus chips in light mode', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const packageRule = css.match(
            /html body\.lux-light-mode\.lux-route-social \.social-projects-shell \.spt-desk-package,\s*html body\.lux-light-mode\.lux-route-social \.social-projects-shell \.spt-desk--v2 \.spt-desk-package \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(packageRule).toMatch(/var\(--sn-proj-surface-soft/);
        expect(packageRule).not.toMatch(/rgba\(10,\s*12,\s*18/);
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social \.social-projects-shell \.spt-desk-plan-health \{[\s\S]*?background:\s*var\(--sn-proj-surface-soft/
        );
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social \.social-projects-shell \.spt-desk-focus-track \.spt-desk-focus-chip \{[\s\S]*?color:\s*var\(--sn-proj-ink-muted/
        );
    });

    it('uses paper-ledger tree enclosure tokens (not charcoal wells)', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const deskV2 = css.match(
            /body\.lux-route-social \.spt-desk--v2 \{[\s\S]*?--spt-row-child-ring:[\s\S]*?\n\}/
        )?.[0] || '';
        expect(deskV2).toContain('--spt-frame-bg:');
        expect(deskV2).toContain('--spt-nest-bg:');
        expect(deskV2).toContain('--spt-row-child:');
        expect(css).toMatch(
            /\.spt-desk-tree-children \{[\s\S]*?background:\s*var\(--spt-nest-bg\)/
        );
        expect(css).toMatch(
            /\.spt-desk-tree-children > \.spt-desk-tree-node > \.spt-desk-card\.spt-desk-row \{[\s\S]*?background:\s*var\(--spt-row-child\)/
        );
        expect(css).not.toMatch(
            /\.spt-desk-tree-children \{[\s\S]*?background:\s*rgba\(0,\s*0,\s*0,\s*0\.24\)/
        );
        const lightTree = css.match(
            /html body\.lux-light-mode\.lux-route-social \.social-projects-shell \.spt-desk--v2 \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(lightTree).toMatch(/--spt-row-child:\s*rgba\(255,\s*255,\s*255/);
        expect(lightTree).toMatch(/--spt-frame-bg:/);
        expect(lightTree).not.toMatch(/rgba\(10,\s*12,\s*16/);
    });
});
