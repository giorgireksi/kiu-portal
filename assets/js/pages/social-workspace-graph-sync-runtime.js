/* Social workspace graph sync/chrome helpers.
 * Peeled from social-workspace-graph-runtime.js. Load before graph-runtime.
 */
(function initSocialWorkspaceGraphSyncRuntime() {
    if (window.__KIU_SOCIAL_WORKSPACE_GRAPH_SYNC_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_GRAPH_SYNC_LOADED = true;

    window.__kiuCreateSocialWorkspaceGraphSyncApi = function createKiuSocialWorkspaceGraphSyncApi(deps) {
        if (!deps || typeof deps !== "object") throw new Error("workspace graph sync deps required");
        const {
            PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H,
            PROJECT_TASK_GRAPH_CARD_COMPACT_W,
            PROJECT_TASK_GRAPH_CARD_H,
            PROJECT_TASK_GRAPH_CARD_MIN_H,
            PROJECT_TASK_GRAPH_CARD_W,
            PROJECT_TASK_GRAPH_CHECKPOINT_MAX,
            PROJECT_TASK_GRAPH_FO_PAD,
            PROJECT_TASK_GRAPH_MIN_ZOOM,
            PROJECT_TASK_GRAPH_STACKED_DIALOGS,
            __swGraphBatch,
            activeDialog,
            applyProjectTaskGraphSavedPositions,
            buildProjectTaskGraphLayout,
            clearProjectTabPaneCache,
            clearProjectTabPaneCacheKey,
            collectProjectTaskGraphNeighborIds,
            computeProjectTaskGraphMapSchedule,
            escape,
            escapeProjectTaskGraphAttr,
            formatProjectTaskGraphCheckpointWhen,
            normalizeProjectTaskGraphCheckpointEntry,
            openDialog,
            openProjectRiskForTask,
            projectTaskGraphCheckpointStorageKey,
            projectTaskGraphCheckpointsStorageKey,
            projectTaskGraphEdgeFanMap,
            projectTaskGraphGroupMembershipWouldCycle,
            projectTaskGraphGroupsStorageKey,
            projectTaskGraphMineOnlyActive,
            projectTaskGraphPositionsStorageKey,
            projectTaskGraphShowCritical,
            projectTaskGraphShowFlow,
            projectTaskGraphShowInferred,
            projectTaskGraphViewStorageKey,
            projectTaskGraphWouldCycle,
            readProjectTaskGraphPan,
            rebuildActiveProjectTabPaneIfPreviewHost,
            renderDialogOnlyNow,
            resolveActiveSocialProject,
            resolveProjectTaskGraphContext,
            resolveProjectTaskGraphGroupBox,
            shouldRenderProjectHealthStack,
            state,
            text,
            uniqueStrings,
            updatePortalSocialProjectTask,
            updatePortalSocialProjectTaskGraph,
            when,
            withBusy
        } = deps;

        const clampProjectTaskGraphZoom = deps.clampProjectTaskGraphZoom || __swGraphBatch.clampProjectTaskGraphZoom;
        const clampProjectTaskGraphPan = deps.clampProjectTaskGraphPan || __swGraphBatch.clampProjectTaskGraphPan;
        const resolveProjectTaskGraphPanSlack = deps.resolveProjectTaskGraphPanSlack || __swGraphBatch.resolveProjectTaskGraphPanSlack;
        const projectTaskGraphScrollOffsets = deps.projectTaskGraphScrollOffsets || __swGraphBatch.projectTaskGraphScrollOffsets;
        const projectTaskGraphEdgePath = typeof deps.projectTaskGraphEdgePath === 'function'
            ? deps.projectTaskGraphEdgePath
            : (__swGraphBatch.projectTaskGraphEdgePath || window.projectTaskGraphEdgePath);
        const normalizeProjectTaskGraphMode = deps.normalizeProjectTaskGraphMode || __swGraphBatch.normalizeProjectTaskGraphMode;
        const computeProjectTaskGraphStageSize = deps.computeProjectTaskGraphStageSize || __swGraphBatch.computeProjectTaskGraphStageSize;
        const projectTaskGraphLayoutUsesSavedPositions = deps.projectTaskGraphLayoutUsesSavedPositions || __swGraphBatch.projectTaskGraphLayoutUsesSavedPositions;
        const projectTaskDependsOnIds = deps.projectTaskDependsOnIds || __swGraphBatch.projectTaskDependsOnIds;
        const isProjectTaskGraphGroupId = deps.isProjectTaskGraphGroupId || __swGraphBatch.isProjectTaskGraphGroupId;
        const projectGroupDependsOnIds = deps.projectGroupDependsOnIds || __swGraphBatch.projectGroupDependsOnIds;
        const projectGroupBlocksIds = deps.projectGroupBlocksIds || __swGraphBatch.projectGroupBlocksIds;

        function resolveGraphRenderDep(name) {
            const impl = deps[name];
            if (typeof impl === "function") return impl;
            const ws = window.KiuSocialWorkspace;
            if (ws && typeof ws[name] === "function") return ws[name];
            if (typeof window[name] === "function") return window[name];
            return undefined;
        }
        function buildProjectTaskGraphCanvasMarkup(...args) {
            const impl = resolveGraphRenderDep("buildProjectTaskGraphCanvasMarkup");
            return typeof impl === "function" ? impl(...args) : "";
        }
        function renderProjectTaskGraphDetailRailContent(...args) {
            const impl = resolveGraphRenderDep("renderProjectTaskGraphDetailRailContent");
            return typeof impl === "function" ? impl(...args) : "";
        }
        function renderProjectTaskGraphEdgeGroupsHtml(...args) {
            const impl = resolveGraphRenderDep("renderProjectTaskGraphEdgeGroupsHtml");
            return typeof impl === "function" ? impl(...args) : "";
        }
        function renderProjectTaskGraphGroupEdgesHtml(...args) {
            const impl = resolveGraphRenderDep("renderProjectTaskGraphGroupEdgesHtml");
            return typeof impl === "function" ? impl(...args) : "";
        }
        function renderProjectTaskGraphQuickCreatePopover(...args) {
            const impl = resolveGraphRenderDep("renderProjectTaskGraphQuickCreatePopover");
            return typeof impl === "function" ? impl(...args) : "";
        }

        function bindProjectTaskGraphDrag(...a) {
            const impl = deps.bindProjectTaskGraphDrag;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.bindProjectTaskGraphDrag === "function") return window.bindProjectTaskGraphDrag(...a);
        }
        function getProjectTaskGraphGroups(...a) {
            const impl = deps.getProjectTaskGraphGroups;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.getProjectTaskGraphGroups === "function") return window.getProjectTaskGraphGroups(...a);
        }
        function getProjectTaskGraphPositions(...a) {
            const impl = deps.getProjectTaskGraphPositions;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.getProjectTaskGraphPositions === "function") return window.getProjectTaskGraphPositions(...a);
        }
        function measureProjectTaskGraphCardHeights(...a) {
            const impl = deps.measureProjectTaskGraphCardHeights;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.measureProjectTaskGraphCardHeights === "function") return window.measureProjectTaskGraphCardHeights(...a);
        }
        function notifyProjectTaskGraphSurfaceChanged(...a) {
            const impl = deps.notifyProjectTaskGraphSurfaceChanged;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.notifyProjectTaskGraphSurfaceChanged === "function") return window.notifyProjectTaskGraphSurfaceChanged(...a);
        }
        function readProjectTaskGraphPortCenter(...a) {
            const impl = deps.readProjectTaskGraphPortCenter;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.readProjectTaskGraphPortCenter === "function") return window.readProjectTaskGraphPortCenter(...a);
        }
        function resolveProjectTaskGraphNodeFromTarget(...a) {
            const impl = deps.resolveProjectTaskGraphNodeFromTarget;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.resolveProjectTaskGraphNodeFromTarget === "function") return window.resolveProjectTaskGraphNodeFromTarget(...a);
        }
        function updateProjectTaskGraphGroup(...a) {
            const impl = deps.updateProjectTaskGraphGroup;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.updateProjectTaskGraphGroup === "function") return window.updateProjectTaskGraphGroup(...a);
        }
        function removeProjectGraphDependency(...a) {
            const impl = deps.removeProjectGraphDependency;
            if (typeof impl === "function") return impl(...a);
            if (typeof window.removeProjectGraphDependency === "function") return window.removeProjectGraphDependency(...a);
        }

        let projectTaskGraphEdgeRaf = 0;

        function setProjectTaskGraphInteracting(stage, active) {
            if (!stage) return;
            stage.classList.toggle('is-interacting', active);
            if (active) {
                window.__kiuSuppressLuxTransparencyRefresh = true;
                return;
            }
            window.requestAnimationFrame(() => {
                window.__kiuSuppressLuxTransparencyRefresh = false;
            });
        }

        function scheduleProjectTaskGraphEdgeRefresh(svg) {
            if (!svg) return;
            if (projectTaskGraphEdgeRaf) return;
            projectTaskGraphEdgeRaf = window.requestAnimationFrame(() => {
                projectTaskGraphEdgeRaf = 0;
                refreshProjectTaskGraphEdgeLines(svg);
            });
        }

        function findProjectTaskGraphLinkDropTarget(svg, clientX, clientY, fromTaskId = '') {
            const stack = typeof document.elementsFromPoint === 'function'
                ? document.elementsFromPoint(clientX, clientY)
                : [document.elementFromPoint(clientX, clientY)].filter(Boolean);
            for (const hit of stack) {
                const port = hit?.closest?.('[data-graph-link-port]');
                if (!port) continue;
                const hostNode = port.closest?.('.social-project-task-graph-node-g');
                if (!hostNode || !svg.contains(hostNode)) continue;
                const target = readProjectTaskGraphPortCenter(port);
                if (target?.taskId && target.taskId !== fromTaskId) return target;
            }
            for (const hit of stack) {
                const node = resolveProjectTaskGraphNodeFromTarget(hit, svg);
                if (!node) continue;
                const taskId = text(node.getAttribute('data-task-id'));
                if (!taskId || taskId === fromTaskId) continue;
                const groupId = text(node.getAttribute('data-group-id'));
                const w = Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W;
                const h = Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H;
                const cx = Number(node.getAttribute('data-cx'));
                const cy = Number(node.getAttribute('data-cy'));
                // Groups are first-class endpoints: always return taskId so port-wire creates dependencies.
                return {
                    taskId,
                    groupId: groupId || '',
                    projectId: text(node.getAttribute('data-project-id')),
                    x: cx - w / 2,
                    y: cy,
                    side: 'w',
                    w,
                    h
                };
            }
            return null;
        }

        /** Card-drag membership: hit package body under pointer (not the dragged task). */

        function findProjectTaskGraphMembershipDropGroup(svg, clientX, clientY, fromTaskId = '') {
            const skipId = text(fromTaskId);
            const stack = typeof document.elementsFromPoint === 'function'
                ? document.elementsFromPoint(clientX, clientY)
                : [document.elementFromPoint(clientX, clientY)].filter(Boolean);
            for (const hit of stack) {
                const node = resolveProjectTaskGraphNodeFromTarget(hit, svg);
                if (!node || !svg.contains(node)) continue;
                const nodeTaskId = text(node.getAttribute('data-task-id'));
                // Dragged card covers the package — skip it so the package underneath wins.
                if (skipId && (nodeTaskId === skipId || text(node.getAttribute('data-group-id')) === skipId)) continue;
                const groupId = text(node.getAttribute('data-group-id'));
                if (!groupId) continue;
                return {
                    groupId,
                    projectId: text(node.getAttribute('data-project-id'))
                };
            }
            return null;
        }

        function readProjectTaskGraphLivePositions(svg) {
            const positions = {};
            if (!svg) return positions;
            svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                const id = text(node.getAttribute('data-task-id'));
                if (!id) return;
                positions[id] = {
                    x: Number(node.getAttribute('data-cx')),
                    y: Number(node.getAttribute('data-cy')),
                    w: Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W,
                    h: Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H
                };
            });
            return positions;
        }



        function patchRemoveProjectTaskGraphEdge(svg, fromId, toId) {
            if (!svg) return false;
            const from = text(fromId);
            const to = text(toId);
            if (!from || !to) return false;
            const group = svg.querySelector(
                `.social-project-task-graph-edge-group[data-edge-from="${escapeProjectTaskGraphAttr(from)}"][data-edge-to="${escapeProjectTaskGraphAttr(to)}"]`
            );
            if (!group) return false;
            group.remove();
            return true;
        }

        /** Keep immersive title project name in sync without remounting chrome. */

        function patchProjectTaskGraphLinkCountLabel(runtime = state()) {
            const host = getProjectTaskGraphHost();
            const titleSpan = host?.querySelector('.social-project-task-graph-immersive-title > span');
            if (!titleSpan) return false;
            const dialog = activeDialog();
            const ctx = resolveProjectTaskGraphContext(runtime, dialog);
            if (!ctx) return false;
            titleSpan.textContent = text(ctx.project.name || 'Project');
            return true;
        }

        function syncProjectTaskGraphEdgesOnly(runtime = state()) {
            const host = getProjectTaskGraphHost();
            const svg = host?.querySelector('[data-project-task-graph-svg]');
            const edgesG = svg?.querySelector('.social-project-task-graph-edges');
            if (!svg || !edgesG) return false;
            const dialog = activeDialog();
            const ctx = resolveProjectTaskGraphContext(runtime, dialog);
            if (!ctx) return false;
            const stageSize = computeProjectTaskGraphStageSize(runtime);
            let layout = buildProjectTaskGraphLayout(ctx.model, runtime, stageSize);
            if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
                layout = applyProjectTaskGraphSavedPositions(
                    layout,
                    getProjectTaskGraphPositions(runtime, text(ctx.project.id))
                );
            }
            const livePositions = readProjectTaskGraphLivePositions(svg);
            Object.keys(livePositions).forEach((id) => {
                if (layout.positions[id]) {
                    layout.positions[id].x = livePositions[id].x;
                    layout.positions[id].y = livePositions[id].y;
                    layout.positions[id].w = livePositions[id].w;
                    layout.positions[id].h = livePositions[id].h;
                } else {
                    layout.positions[id] = livePositions[id];
                }
            });
            const schedule = computeProjectTaskGraphMapSchedule(runtime, ctx.project);
            const showCritical = projectTaskGraphShowCritical(runtime);
            edgesG.innerHTML = renderProjectTaskGraphGroupEdgesHtml(ctx.project, layout, {
                    dashboard: true,
                    unlinkable: Boolean(ctx.project.viewerCanContribute),
                    markerSuffix: '-fullscreen',
                    livePositions,
                    criticalEdges: schedule?.criticalEdges || null,
                    showCritical
                })
                + renderProjectTaskGraphEdgeGroupsHtml(ctx.project, layout, {
                    edges: ctx.model.edges,
                    showInferred: ctx.showInferred,
                    showFlow: ctx.showFlow,
                    dashboard: true,
                    unlinkable: Boolean(ctx.project.viewerCanContribute),
                    markerSuffix: '-fullscreen',
                    livePositions,
                    criticalEdges: schedule?.criticalEdges || null,
                    showCritical
                });
            // Do not rewrite selection rail / sidebar — that is the flicker source.
            patchProjectTaskGraphLinkCountLabel(runtime);
            return true;
        }

        function refreshProjectTaskGraphEdgeLines(svg) {
            if (!svg) return;
            const readNodePos = (node) => ({
                x: Number(node.getAttribute('data-cx')),
                y: Number(node.getAttribute('data-cy')),
                w: Number(node.getAttribute('data-w')),
                h: Number(node.getAttribute('data-h'))
            });
            const groups = Array.from(svg.querySelectorAll('.social-project-task-graph-edge-group'));
            const edgeList = groups.map((group) => ({
                from: text(group.getAttribute('data-edge-from')),
                to: text(group.getAttribute('data-edge-to'))
            }));
            const fanByKey = projectTaskGraphEdgeFanMap(edgeList);
            const statusLayout = Boolean(svg.closest('[data-layout-kind="status"]'))
                || Boolean(svg.classList.contains('is-status-layout'));
            const obstacles = Array.from(svg.querySelectorAll('.social-project-task-graph-node-g')).map((node) => ({
                id: text(node.getAttribute('data-task-id')),
                x: Number(node.getAttribute('data-cx')),
                y: Number(node.getAttribute('data-cy')),
                w: Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W,
                h: Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H
            }));
            const criticalTwinFan = 6; // keep in sync with dual-wire render offset
            groups.forEach((group) => {
                const fromId = text(group.getAttribute('data-edge-from'));
                const toId = text(group.getAttribute('data-edge-to'));
                const line = group.querySelector('.social-project-task-graph-edge:not(.is-critical-twin)');
                const twin = group.querySelector('.social-project-task-graph-edge.is-critical-twin');
                const hit = group.querySelector('.social-project-task-graph-edge-hit');
                const label = group.querySelector('.social-project-task-graph-edge-label');
                const unlink = group.querySelector('.social-project-task-graph-edge-unlink');
                const fromNode = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${fromId}"]`);
                const toNode = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${toId}"]`);
                if (!line || !fromNode || !toNode) return;
                const edgeKey = `${fromId}->${toId}`;
                const baseFan = fanByKey[edgeKey] || 0;
                const pathMeta = {
                    fanOffset: baseFan,
                    statusLayout,
                    obstacles,
                    fromId,
                    toId
                };
                const path = projectTaskGraphEdgePath(readNodePos(fromNode), readNodePos(toNode), pathMeta);
                group.setAttribute('data-edge-mode', path.mode);
                [line, hit].forEach((entry) => {
                    if (!entry) return;
                    if (entry.tagName === 'path' || entry.getAttribute('d') != null) {
                        entry.setAttribute('d', path.d);
                    } else {
                        entry.setAttribute('x1', String(path.x1));
                        entry.setAttribute('y1', String(path.y1));
                        entry.setAttribute('x2', String(path.x2));
                        entry.setAttribute('y2', String(path.y2));
                    }
                });
                if (twin) {
                    const twinPath = projectTaskGraphEdgePath(readNodePos(fromNode), readNodePos(toNode), {
                        ...pathMeta,
                        fanOffset: baseFan + criticalTwinFan
                    });
                    twin.setAttribute('d', twinPath.d);
                }
                if (label) {
                    label.setAttribute('x', String(path.midX));
                    label.setAttribute('y', String(path.midY - 4));
                }
                if (unlink) unlink.setAttribute('transform', `translate(${path.midX},${path.midY})`);
            });
        }




        function isProjectTaskGraphScrollPanCanvas(canvas) {
            return canvas?.getAttribute('data-scroll-pan') === '1';
        }



        function readProjectTaskGraphScrollSurface(canvas) {
            return canvas?.querySelector('[data-project-task-graph-scroll-surface]') || null;
        }

        function readProjectTaskGraphLayoutSize(canvas) {
            const layoutWidth = Number(canvas?.getAttribute('data-layout-width')) || 0;
            const layoutHeight = Number(canvas?.getAttribute('data-layout-height')) || 0;
            if (layoutWidth && layoutHeight) {
                return { width: layoutWidth, height: layoutHeight };
            }
            const svg = canvas?.querySelector('[data-project-task-graph-svg]');
            return {
                width: Number(svg?.getAttribute('width')) || 0,
                height: Number(svg?.getAttribute('height')) || 0
            };
        }


        function readProjectTaskGraphPanSlackFromCanvas(canvas) {
            const surface = readProjectTaskGraphScrollSurface(canvas);
            if (surface && typeof window !== 'undefined') {
                const raw = window.getComputedStyle(surface).getPropertyValue('--ptg-pan-slack');
                const n = Math.round(Number.parseFloat(raw) || 0);
                if (n > 0) return n;
            }
            const { width, height } = readProjectTaskGraphLayoutSize(canvas);
            const zoom = clampProjectTaskGraphZoom(Number(canvas?.getAttribute('data-zoom')) || 1);
            return resolveProjectTaskGraphPanSlack(Math.max(width * zoom, height * zoom));
        }

        function readProjectTaskGraphPanFromScroll(canvas) {
            const slack = readProjectTaskGraphPanSlackFromCanvas(canvas);
            return clampProjectTaskGraphPan(
                canvas.scrollLeft - slack,
                canvas.scrollTop - slack,
                slack
            );
        }

        function ensureProjectTaskGraphScrollSurface(canvas, inner, zoom, layoutW, layoutH) {
            const z = clampProjectTaskGraphZoom(Number(zoom) || 1);
            const scaledW = Math.round(layoutW * z);
            const scaledH = Math.round(layoutH * z);
            const slack = resolveProjectTaskGraphPanSlack(Math.max(scaledW, scaledH));
            const surface = readProjectTaskGraphScrollSurface(canvas) || inner?.parentElement;
            if (surface?.matches?.('[data-project-task-graph-scroll-surface]')) {
                surface.style.setProperty('--ptg-pan-slack', `${slack}px`);
                surface.style.width = `${scaledW + (slack * 2)}px`;
                surface.style.height = `${scaledH + (slack * 2)}px`;
            }
            if (inner) {
                inner.style.width = `${scaledW}px`;
                inner.style.height = `${scaledH}px`;
                inner.style.transform = '';
            }
            const svg = inner?.querySelector('[data-project-task-graph-svg]') || canvas?.querySelector('[data-project-task-graph-svg]');
            if (svg) {
                svg.setAttribute('width', String(scaledW));
                svg.setAttribute('height', String(scaledH));
            }
            return { width: scaledW, height: scaledH, zoom: z, slack };
        }

        function applyProjectTaskGraphScrollZoom(canvas, inner, zoom, layoutW, layoutH) {
            return ensureProjectTaskGraphScrollSurface(canvas, inner, zoom, layoutW, layoutH);
        }

        function centerProjectTaskGraphScrollPan(canvas, panX, panY, zoom, layoutW, layoutH, options = {}) {
            const syncState = options.syncState !== false;
            const z = clampProjectTaskGraphZoom(Number(zoom) || 1);
            const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
            const surface = ensureProjectTaskGraphScrollSurface(canvas, inner, z, layoutW, layoutH);
            const pan = clampProjectTaskGraphPan(panX, panY, surface.slack);
            const offsets = projectTaskGraphScrollOffsets(pan.x, pan.y, surface.slack);
            canvas.scrollLeft = offsets.scrollLeft;
            canvas.scrollTop = offsets.scrollTop;
            canvas.setAttribute('data-pan-x', String(pan.x));
            canvas.setAttribute('data-pan-y', String(pan.y));
            canvas.setAttribute('data-zoom', String(z));
            if (syncState) state().ui.projectTaskGraphPan = { x: pan.x, y: pan.y };
            return { x: pan.x, y: pan.y, zoom: z };
        }

        function applyProjectTaskGraphCanvasTransform(canvas, inner, panX, panY, zoom, options = {}) {
            const syncState = options.syncState !== false;
            const px = Math.round(Number(panX) || 0);
            const py = Math.round(Number(panY) || 0);
            const z = clampProjectTaskGraphZoom(Number(zoom) || 1);
            canvas?.setAttribute('data-pan-x', String(px));
            canvas?.setAttribute('data-pan-y', String(py));
            canvas?.setAttribute('data-zoom', String(z));
            if (isProjectTaskGraphScrollPanCanvas(canvas)) {
                const { width, height } = readProjectTaskGraphLayoutSize(canvas);
                if (width && height) {
                    applyProjectTaskGraphScrollZoom(canvas, inner, z, width, height);
                    return centerProjectTaskGraphScrollPan(canvas, px, py, z, width, height, { syncState });
                }
            }
            if (syncState) state().ui.projectTaskGraphPan = { x: px, y: py };
            if (inner) {
                inner.style.transform = `scale(${z}); transform-origin: top left;`;
            }
            return { x: px, y: py, zoom: z };
        }

        function initProjectTaskGraphScrollPan(stage, options = {}) {
            const canvas = stage?.querySelector('[data-project-task-graph-canvas][data-scroll-pan="1"]');
            if (!canvas) return false;
            const force = options.force === true;
            if (!force && canvas.getAttribute('data-ptg-scroll-init-pending') !== '1') return false;
            const inner = canvas.querySelector('.social-project-task-graph-canvas-inner');
            const { width, height } = readProjectTaskGraphLayoutSize(canvas);
            if (!width || !height || !inner) return false;
            const apply = () => {
                if (!(canvas.clientWidth > 0 && canvas.clientHeight > 0)) return false;
                const zoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || 1);
                const rawPan = readProjectTaskGraphPan(state());
                const { width: lw, height: lh } = readProjectTaskGraphLayoutSize(canvas);
                const slack = resolveProjectTaskGraphPanSlack(Math.max(lw * zoom, lh * zoom));
                const pan = clampProjectTaskGraphPan(rawPan.x, rawPan.y, slack);
                centerProjectTaskGraphScrollPan(canvas, pan.x, pan.y, zoom, width, height);
                canvas.removeAttribute('data-ptg-scroll-init-pending');
                return true;
            };
            if (apply()) return true;
            // Layout may not be ready yet (immersive grid / LMS chrome). Retry until sized.
            let attempts = 0;
            const maxAttempts = 30;
            const tick = () => {
                if (apply()) return;
                attempts += 1;
                if (attempts >= maxAttempts) return;
                if (attempts < 8) window.requestAnimationFrame(tick);
                else window.setTimeout(tick, 32);
            };
            window.requestAnimationFrame(tick);
            return true;
        }

        function resolveProjectTaskGraphPanBackdrop(stage) {
            return stage?.closest('.lux-glass-dialog-backdrop--project-task-graph') || null;
        }

        function clientToProjectTaskGraphCoords(stage, clientX, clientY) {
            const canvas = stage?.querySelector('[data-project-task-graph-canvas]');
            if (isProjectTaskGraphScrollPanCanvas(canvas)) {
                const rect = canvas.getBoundingClientRect();
                const zoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || 1);
                const slack = readProjectTaskGraphPanSlackFromCanvas(canvas);
                const svg = canvas.querySelector('[data-project-task-graph-svg]');
                const vb = text(svg?.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
                const originX = Number.isFinite(vb[0]) ? vb[0] : 0;
                const originY = Number.isFinite(vb[1]) ? vb[1] : 0;
                return {
                    x: Math.round(originX + (clientX - rect.left + canvas.scrollLeft - slack) / zoom),
                    y: Math.round(originY + (clientY - rect.top + canvas.scrollTop - slack) / zoom)
                };
            }
            const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
            if (!inner) return { x: 0, y: 0 };
            const rect = inner.getBoundingClientRect();
            const zoom = Number(canvas?.getAttribute('data-zoom')) || 1;
            return {
                x: Math.round((clientX - rect.left) / zoom),
                y: Math.round((clientY - rect.top) / zoom)
            };
        }

        function getProjectTaskGraphHost() {
            const portal = document.getElementById('social-neo-overlay-portal');
            if (portal?.querySelector('.social-project-task-graph-immersive')) return portal;
            const dialog = document.getElementById('lux-glass-dialog-region');
            if (dialog?.querySelector('.social-project-task-graph-immersive')) return dialog;
            return null;
        }







        function applyProjectTaskGraphZoom(runtime) {
            const host = getProjectTaskGraphHost();
            const immersive = host?.querySelector('.social-project-task-graph-immersive');
            if (!immersive) return false;
            const stage = host?.querySelector('[data-project-task-graph-stage]');
            if (stage?.classList.contains('is-panning')) return true;
            const zoom = clampProjectTaskGraphZoom(Number(runtime.ui?.projectTaskGraphZoom || 1) || 1);
            const pan = readProjectTaskGraphPan(runtime);
            const canvas = immersive.querySelector('[data-project-task-graph-canvas]');
            const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
            if (!canvas || !inner) return false;
            applyProjectTaskGraphCanvasTransform(canvas, inner, pan.x, pan.y, zoom);
            const label = immersive.querySelector('.social-project-task-graph-zoom-label');
            if (label) label.textContent = `${Math.round(zoom * 100)}%`;
            return true;
        }

        function syncProjectTaskGraphChrome(runtime) {
            const host = getProjectTaskGraphHost();
            const immersive = host?.querySelector('.social-project-task-graph-immersive');
            if (!immersive) return false;
            const dialog = activeDialog();
            const ctx = resolveProjectTaskGraphContext(runtime, dialog);
            const graphMode = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode || 'browse');
            const linkFromId = text(runtime.ui?.projectTaskGraphLinkFrom || '');
            const canContribute = Boolean(ctx?.project?.viewerCanContribute);
            const body = immersive.querySelector('.social-project-task-graph-immersive-body');
            const stage = body?.querySelector('[data-project-task-graph-stage="1"]');
            stage?.classList.toggle('is-mode-link', graphMode === 'connect');
            stage?.classList.toggle('is-mode-connect', graphMode === 'connect');
            stage?.classList.toggle('is-mode-browse', graphMode === 'browse');
            stage?.classList.remove('is-mode-arrange', 'is-mode-explore');
            const connectBtn = immersive.querySelector('[data-action="project-task-graph-mode-connect"], [data-action="project-task-graph-mode-link"]');
            connectBtn?.classList.toggle('lux-primary-btn', graphMode === 'connect');
            let toolbar = immersive.querySelector('.social-project-task-graph-mode-toolbar');
            const actions = immersive.querySelector('.social-project-task-graph-immersive-actions');
            if (linkFromId && canContribute && graphMode === 'connect') {
                if (!toolbar && actions) {
                    toolbar = document.createElement('div');
                    toolbar.className = 'social-project-tab-row social-project-task-graph-mode-toolbar';
                    toolbar.setAttribute('data-lux-transparency-exempt', '1');
                    toolbar.setAttribute('role', 'group');
                    toolbar.setAttribute('aria-label', 'Link actions');
                    const zoomControls = actions.querySelector('.social-project-task-graph-zoom-controls');
                    if (zoomControls) actions.insertBefore(toolbar, zoomControls);
                    else actions.prepend(toolbar);
                }
                if (toolbar && !toolbar.querySelector('[data-action="project-task-graph-link-cancel"]')) {
                    const cancelBtn = document.createElement('button');
                    cancelBtn.className = 'lux-secondary-btn';
                    cancelBtn.type = 'button';
                    cancelBtn.setAttribute('data-action', 'project-task-graph-link-cancel');
                    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
                    toolbar.appendChild(cancelBtn);
                }
            } else if (toolbar) {
                toolbar.remove();
            }
            if (ctx) {
                const titleSpan = immersive.querySelector('.social-project-task-graph-immersive-title > span');
                if (titleSpan) titleSpan.textContent = text(ctx.project.name || 'Project');
                const myToggle = immersive.querySelector('[data-action="project-task-graph-toggle-my"]');
                if (myToggle) {
                    const mineOn = projectTaskGraphMineOnlyActive(runtime);
                    myToggle.setAttribute('aria-checked', mineOn ? 'true' : 'false');
                    myToggle.classList.toggle('is-active', mineOn);
                    const mySwitchInput = myToggle.matches?.('input[type="checkbox"]')
                        ? myToggle
                        : myToggle.querySelector?.('input[type="checkbox"]');
                    if (mySwitchInput) mySwitchInput.checked = mineOn;
                }
                const inferredToggle = immersive.querySelector('[data-action="project-task-graph-toggle-inferred"]');
                if (inferredToggle) inferredToggle.checked = ctx.showInferred;
                const flowToggle = immersive.querySelector('[data-action="project-task-graph-toggle-flow"]');
                if (flowToggle) flowToggle.checked = ctx.showFlow;
            }
            return true;
        }

        function syncProjectTaskGraphGroupFocus(runtime = state()) {
            const host = getProjectTaskGraphHost();
            const immersive = host?.querySelector('.social-project-task-graph-immersive');
            if (!immersive) return false;
            const dialog = activeDialog();
            const projectId = text(dialog?.projectId || runtime.ui?.activeProjectId || '');
            const focusGroupId = text(runtime.ui?.projectTaskGraphFocusGroupId || '');
            const stage = immersive.querySelector('[data-project-task-graph-stage="1"]');
            const svg = immersive.querySelector('[data-project-task-graph-svg]');
            const portrait = Boolean(focusGroupId);
            stage?.classList.toggle('is-group-portrait', portrait);
            svg?.classList.toggle('is-group-portrait', portrait);

            // Keep topbar droplist in sync without full remount.
            const focusSelect = immersive.querySelector('select[name="projectTaskGraphFocusGroup"]');
            if (focusSelect && text(focusSelect.value) !== focusGroupId) {
                focusSelect.value = focusGroupId;
            }

            if (!svg) return true;
            if (!portrait) {
                svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                    node.classList.remove('is-group-focus-active', 'is-group-focus-dimmed');
                });
                svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((edge) => {
                    edge.classList.remove('is-group-focus-active', 'is-group-focus-dimmed');
                });
                return true;
            }

            const groups = getProjectTaskGraphGroups(runtime, projectId);
            const group = groups.find((g) => text(g?.id) === focusGroupId) || null;
            const members = new Set(
                (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id)).filter(Boolean)
            );
            const project = resolveActiveSocialProject(runtime, projectId);
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            // Order graph: predecessor → successors (who waits on whom).
            const successorsOf = new Map();
            const addSucc = (from, to) => {
                const a = text(from);
                const b = text(to);
                if (!a || !b || a === b) return;
                if (!successorsOf.has(a)) successorsOf.set(a, new Set());
                successorsOf.get(a).add(b);
            };
            if (group) {
                projectGroupBlocksIds(group).forEach((tid) => addSucc(focusGroupId, tid));
            }
            tasks.forEach((task) => {
                const tid = text(task?.id);
                if (!tid) return;
                projectTaskDependsOnIds(task).forEach((depId) => addSucc(depId, tid));
            });
            groups.forEach((g) => {
                const gid = text(g?.id);
                if (!gid) return;
                projectGroupDependsOnIds(g).forEach((fromId) => addSucc(fromId, gid));
                projectGroupBlocksIds(g).forEach((tid) => addSucc(gid, tid));
            });
            // DOM explicit edges (group-dep + task-task).
            svg.querySelectorAll('.social-project-task-graph-edge-group[data-edge-kind="explicit"]').forEach((edge) => {
                addSucc(edge.getAttribute('data-edge-from'), edge.getAttribute('data-edge-to'));
            });
            // Active = package + members + full transitive downstream (children of children).
            const activeIds = new Set([focusGroupId, ...members]);
            const queue = [focusGroupId, ...members];
            while (queue.length) {
                const cur = queue.shift();
                (successorsOf.get(cur) || []).forEach((next) => {
                    if (activeIds.has(next)) return;
                    activeIds.add(next);
                    queue.push(next);
                });
            }

            svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                const taskId = text(node.getAttribute('data-task-id'));
                const active = activeIds.has(taskId);
                node.classList.toggle('is-group-focus-active', active);
                node.classList.toggle('is-group-focus-dimmed', !active);
            });

            svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((edge) => {
                const from = text(edge.getAttribute('data-edge-from'));
                const to = text(edge.getAttribute('data-edge-to'));
                const kind = text(edge.getAttribute('data-edge-kind'));
                const active = kind === 'groupmember'
                    ? (to === focusGroupId || from === focusGroupId)
                    : (activeIds.has(from) && activeIds.has(to));
                edge.classList.toggle('is-group-focus-active', active);
                edge.classList.toggle('is-group-focus-dimmed', !active);
            });
            return true;
        }

        /**
         * Selection glow set: full ancestor chain + full descendant chain
         * (parent → … → selected → … → children’s children).
         */


        function syncProjectTaskGraphSelection(runtime) {
            const host = getProjectTaskGraphHost();
            const immersive = host?.querySelector('.social-project-task-graph-immersive');
            if (!immersive) return false;
            const selectedId = text(runtime.ui?.projectTaskGraphSelectedId || '');
            const linkFromId = text(runtime.ui?.projectTaskGraphLinkFrom || '');
            const dialog = activeDialog();
            const ctx = resolveProjectTaskGraphContext(runtime, dialog);
            const stage = immersive.querySelector('[data-project-task-graph-stage="1"]');
            // Keep all cards fully visible — selection only highlights, never dims the rest.
            stage?.classList.remove('has-selection');
            const svg = immersive.querySelector('[data-project-task-graph-svg]');
            const neighborIds = collectProjectTaskGraphNeighborIds(runtime, selectedId, ctx, svg);
            if (svg) {
                svg.classList.remove('has-selection');
                svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                    const taskId = text(node.getAttribute('data-task-id'));
                    const isSelected = taskId === selectedId;
                    const isNeighbor = neighborIds.has(taskId);
                    node.classList.toggle('is-selected', isSelected);
                    node.classList.toggle('is-link-source', taskId === linkFromId);
                    node.classList.toggle('is-dep-neighbor', isNeighbor);
                    node.classList.remove('is-focus-dimmed');
                    if (isNeighbor) node.setAttribute('data-neighbor-of-selected', '1');
                    else node.removeAttribute('data-neighbor-of-selected');
                });
                const chainIds = new Set(neighborIds);
                if (selectedId) chainIds.add(selectedId);
                svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((group) => {
                    const from = text(group.getAttribute('data-edge-from'));
                    const to = text(group.getAttribute('data-edge-to'));
                    const kind = text(group.getAttribute('data-edge-kind'));
                    // Highlight order edges on the ancestor/child chain (skip membership wires).
                    const touches = kind !== 'groupmember' && selectedId
                        && chainIds.has(from) && chainIds.has(to);
                    group.classList.toggle('is-focus-active', Boolean(touches));
                    group.classList.remove('is-focus-dimmed');
                });
            }
            const body = immersive.querySelector('.social-project-task-graph-immersive-body');
            if (!ctx) return false;
            const railContent = renderProjectTaskGraphDetailRailContent(ctx.project, runtime, ctx.projectTasks);
            let rail = body?.querySelector('.social-project-task-graph-detail-rail');
            if (!rail && body) {
                rail = document.createElement('aside');
                rail.className = 'social-project-task-graph-detail-rail';
                rail.setAttribute('data-lux-transparency-exempt', '1');
                body.appendChild(rail);
            }
            if (rail) {
                const nextMarkup = railContent.markup;
                const railKey = `${selectedId}|${linkFromId}|${railContent.empty ? 1 : 0}`;
                // Skip identical rail rewrite — enhanceUniversalPickers remount is a common flicker source.
                if (rail.getAttribute('data-rail-key') !== railKey || rail.innerHTML !== nextMarkup) {
                    rail.innerHTML = nextMarkup;
                    rail.setAttribute('data-rail-key', railKey);
                    rail.classList.toggle('is-empty', railContent.empty);
                    if (typeof window.enhanceUniversalPickers === 'function') {
                        try { window.enhanceUniversalPickers(rail); } catch (error) {}
                    }
                } else {
                    rail.classList.toggle('is-empty', railContent.empty);
                }
            }
            const highlightOverdue = runtime.ui?.projectTaskGraphHighlightOverdue === true;
            const highlightBlocked = runtime.ui?.projectTaskGraphHighlightBlocked === true;
            if (svg) {
                svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                    const status = text(node.getAttribute('data-status'));
                    node.classList.toggle('is-highlight-overdue', highlightOverdue && node.classList.contains('is-overdue'));
                    node.classList.toggle('is-highlight-blocked', highlightBlocked && status === 'blocked');
                });
            }
            syncProjectTaskGraphGroupFocus(runtime);
            return true;
        }

        function syncProjectTaskGraphCanvas(runtime) {
            const host = getProjectTaskGraphHost();
            const stage = host?.querySelector('[data-project-task-graph-stage="1"]');
            if (!stage) return false;
            const dialog = activeDialog();
            const existing = stage.querySelector('[data-project-task-graph-canvas], .social-project-task-graph-empty');
            // Preserve viewport so forced rebuilds don't flash/jump.
            const prevScrollLeft = existing?.scrollLeft || 0;
            const prevScrollTop = existing?.scrollTop || 0;
            const hadScrollPan = existing?.getAttribute?.('data-scroll-pan') === '1';
            const markup = buildProjectTaskGraphCanvasMarkup(runtime, dialog);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = markup;
            const next = wrapper.firstElementChild;
            if (!next) return false;
            if (existing) existing.replaceWith(next);
            else stage.insertBefore(next, stage.querySelector('.social-project-task-graph-quick-create'));
            const freshCanvas = stage.querySelector('[data-project-task-graph-canvas][data-scroll-pan="1"]');
            if (freshCanvas) {
                // Prefer restoring known pan/zoom over full scroll re-init flash.
                if (hadScrollPan) {
                    applyProjectTaskGraphZoom(runtime);
                    try {
                        freshCanvas.scrollLeft = prevScrollLeft;
                        freshCanvas.scrollTop = prevScrollTop;
                    } catch (error) {}
                    freshCanvas.removeAttribute('data-ptg-scroll-init-pending');
                } else {
                    freshCanvas.setAttribute('data-ptg-scroll-init-pending', '1');
                }
            }
            bindProjectTaskGraphDrag();
            applyProjectTaskGraphZoom(runtime);
            if (freshCanvas && hadScrollPan) {
                try {
                    freshCanvas.scrollLeft = prevScrollLeft;
                    freshCanvas.scrollTop = prevScrollTop;
                } catch (error) {}
            }
            syncProjectTaskGraphSelection(runtime);
            const measureHost = host;
            window.requestAnimationFrame(() => {
                if (text(activeDialog()?.type || '') !== 'project-task-graph') return;
                const heightChanged = measureProjectTaskGraphCardHeights(measureHost);
                if (heightChanged) syncProjectTaskGraphEdgesOnly(runtime);
            });
            return true;
        }

        function syncProjectTaskGraphQuickCreate(runtime) {
            const host = getProjectTaskGraphHost();
            const stage = host?.querySelector('[data-project-task-graph-stage="1"]');
            if (!stage) return false;
            const dialog = activeDialog();
            const ctx = resolveProjectTaskGraphContext(runtime, dialog);
            if (!ctx) return false;
            const markup = renderProjectTaskGraphQuickCreatePopover(ctx.project, runtime);
            const existing = stage.querySelector('.social-project-task-graph-quick-create');
            if (markup) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = markup;
                const next = wrapper.firstElementChild;
                if (!next) return false;
                if (existing) existing.replaceWith(next);
                else stage.appendChild(next);
                if (typeof window.enhanceUniversalPickers === 'function') {
                    try { window.enhanceUniversalPickers(next); } catch (error) {}
                }
            } else if (existing) {
                existing.remove();
            }
            return true;
        }

        function syncProjectTaskGraphSidebar(runtime) {
            // Left Map tools sidebar removed — overview lives in the right rail.
            return syncProjectTaskGraphSelection(runtime);
        }

        function refreshProjectTaskGraphDialog(parts = ['all']) {
            const graphOpen = text(activeDialog()?.type || '') === 'project-task-graph';
            if (!graphOpen) return renderDialogOnlyNow();
            let normalized = Array.isArray(parts) ? parts.map((part) => text(part)).filter(Boolean) : [text(parts)];
            // Never full-remount the immersive graph for soft updates (kills flicker).
            if (!normalized.length || normalized.includes('all')) {
                normalized = ['chrome', 'selection', 'sidebar', 'zoom', 'canvas'];
            }
            const panStage = getProjectTaskGraphHost()?.querySelector('[data-project-task-graph-stage]');
            if (panStage?.classList.contains('is-panning')) {
                normalized = normalized.filter((part) => part !== 'zoom' && part !== 'canvas' && part !== 'all');
                if (!normalized.length) return false;
            }
            const runtime = state();
            let ok = false;
            if (normalized.includes('zoom')) ok = applyProjectTaskGraphZoom(runtime) || ok;
            if (normalized.includes('chrome')) ok = syncProjectTaskGraphChrome(runtime) || ok;
            if (normalized.includes('selection')) ok = syncProjectTaskGraphSelection(runtime) || ok;
            if (normalized.includes('groupFocus')) ok = syncProjectTaskGraphGroupFocus(runtime) || ok;
            if (normalized.includes('sidebar')) ok = syncProjectTaskGraphSidebar(runtime) || ok;
            if (normalized.includes('quickCreate')) ok = syncProjectTaskGraphQuickCreate(runtime) || ok;
            if (normalized.includes('canvas')) {
                ok = syncProjectTaskGraphCanvas(runtime) || ok;
                applyProjectTaskGraphZoom(runtime);
            }
            // Soft failure while graph is open: never call renderDialogOnlyNow (full remount).
            return ok;
        }

        /** Browse select, or connect-mode wire arm/complete. Shared by click + pointerup. */

        function selectProjectTaskGraphNode(projectId, taskId) {
            const runtime = state();
            const mode = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode || 'browse');
            if (mode === 'connect') {
                const linkFrom = text(runtime.ui?.projectTaskGraphLinkFrom || '');
                if (!linkFrom) {
                    runtime.ui.projectTaskGraphLinkFrom = taskId;
                    runtime.ui.projectTaskGraphSelectedId = taskId;
                    return refreshProjectTaskGraphDialog(['chrome', 'selection']);
                }
                if (linkFrom === taskId) {
                    runtime.ui.projectTaskGraphLinkFrom = '';
                    runtime.ui.projectTaskGraphMode = 'browse';
                    return refreshProjectTaskGraphDialog(['chrome', 'selection']);
                }
                // First task must finish first; second waits on first. One-shot: exit connect after wire.
                return withBusy(async () => {
                    await addProjectTaskDependency(projectId, taskId, linkFrom);
                    runtime.ui.projectTaskGraphLinkFrom = '';
                    runtime.ui.projectTaskGraphMode = 'browse';
                    runtime.ui.projectTaskGraphSelectedId = taskId;
                    notifyProjectTaskGraphSurfaceChanged(projectId);
                    if (!syncProjectTaskGraphEdgesOnly(runtime)) {
                        refreshProjectTaskGraphDialog(['canvas']);
                    }
                    refreshProjectTaskGraphDialog(['selection', 'chrome']);
                });
            }
            // Already selected — don't rewrite the rail (that flicker).
            if (text(runtime.ui?.projectTaskGraphSelectedId) === taskId) return false;
            runtime.ui.projectTaskGraphSelectedId = taskId;
            // Browse select: selection rail only — chrome remount is unnecessary flicker.
            return refreshProjectTaskGraphDialog(['selection']);
        }

        async function addProjectTaskDependency(projectId, targetId, fromId) {
            return addProjectGraphDependency(projectId, targetId, fromId);
        }

        async function removeProjectTaskDependency(projectId, targetId, fromId) {
            return removeProjectGraphDependency(projectId, targetId, fromId);
        }

        /** Unified dependency: target waits on from. Either end may be a group (grp_*). */

        async function addProjectGraphDependency(projectId, targetId, fromId) {
            const runtime = state();
            const project = resolveActiveSocialProject(runtime, projectId);
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const groups = getProjectTaskGraphGroups(runtime, projectId);
            const to = text(targetId);
            const from = text(fromId);
            if (!to || !from) throw new Error('Missing link endpoints.');
            if (to === from) throw new Error('Cannot link a node to itself.');
            if (projectTaskGraphWouldCycle(tasks, to, from, groups)) throw new Error('That link would create a dependency cycle.');

            // Target is a package: package waits on from (task or package).
            if (isProjectTaskGraphGroupId(to)) {
                const group = groups.find((g) => text(g.id) === to);
                if (!group) throw new Error('Package not found.');
                const deps = projectGroupDependsOnIds(group);
                if (deps.includes(from)) return;
                updateProjectTaskGraphGroup(runtime, projectId, to, { dependsOnIds: [...deps, from] });
                return;
            }

            const target = tasks.find((task) => text(task?.id) === to);
            if (!target) throw new Error('Task not found.');

            // From package → task: store on group.blocksIds (reliable local) + dual-write task.dependsOnTaskIds.
            if (isProjectTaskGraphGroupId(from)) {
                const group = groups.find((g) => text(g.id) === from);
                if (!group) throw new Error('Package not found.');
                const blocks = projectGroupBlocksIds(group);
                if (!blocks.includes(to)) {
                    updateProjectTaskGraphGroup(runtime, projectId, from, { blocksIds: [...blocks, to] });
                }
                const deps = projectTaskDependsOnIds(target);
                if (!deps.includes(from)) {
                    try {
                        await updatePortalSocialProjectTask(
                            projectId,
                            to,
                            { dependsOnTaskIds: [...deps, from] },
                            { silent: true }
                        );
                    } catch (error) {
                        // Keep edge via blocksIds even if API rejects grp_* ids.
                        patchLocalProjectTaskDepends(runtime, projectId, to, [...deps, from]);
                    }
                }
                return;
            }

            const deps = projectTaskDependsOnIds(target);
            if (deps.includes(from)) return;
            await updatePortalSocialProjectTask(
                projectId,
                to,
                { dependsOnTaskIds: [...deps, from] },
                { silent: true }
            );
        }

        function patchLocalProjectTaskDepends(runtime, projectId, taskId, dependsOnTaskIds) {
            const project = resolveActiveSocialProject(runtime, projectId);
            if (!project || !Array.isArray(project.tasks)) return;
            const tid = text(taskId);
            project.tasks = project.tasks.map((task) => (
                text(task?.id) === tid ? { ...task, dependsOnTaskIds: uniqueStrings(dependsOnTaskIds) } : task
            ));
        }


        const api = {
            setProjectTaskGraphInteracting,
            scheduleProjectTaskGraphEdgeRefresh,
            findProjectTaskGraphLinkDropTarget,
            findProjectTaskGraphMembershipDropGroup,
            readProjectTaskGraphLivePositions,
            patchRemoveProjectTaskGraphEdge,
            patchProjectTaskGraphLinkCountLabel,
            syncProjectTaskGraphEdgesOnly,
            refreshProjectTaskGraphEdgeLines,
            isProjectTaskGraphScrollPanCanvas,
            readProjectTaskGraphScrollSurface,
            readProjectTaskGraphLayoutSize,
            readProjectTaskGraphPanSlackFromCanvas,
            readProjectTaskGraphPanFromScroll,
            ensureProjectTaskGraphScrollSurface,
            applyProjectTaskGraphScrollZoom,
            centerProjectTaskGraphScrollPan,
            applyProjectTaskGraphCanvasTransform,
            initProjectTaskGraphScrollPan,
            resolveProjectTaskGraphPanBackdrop,
            clientToProjectTaskGraphCoords,
            getProjectTaskGraphHost,
            applyProjectTaskGraphZoom,
            syncProjectTaskGraphChrome,
            syncProjectTaskGraphGroupFocus,
            syncProjectTaskGraphSelection,
            syncProjectTaskGraphCanvas,
            syncProjectTaskGraphQuickCreate,
            syncProjectTaskGraphSidebar,
            refreshProjectTaskGraphDialog,
            selectProjectTaskGraphNode,
            addProjectTaskDependency,
            removeProjectTaskDependency,
            addProjectGraphDependency,
            patchLocalProjectTaskDepends,
        };
        Object.assign(window, api);
        return api;
    };
})();
