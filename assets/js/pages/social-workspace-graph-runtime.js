/* READABILITY: Social project task-graph runtime — layout bind, sync, persist, interaction.
 * Sections: Boot | Layout | Bind | Sync | Persist
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Boot ---
/* Social workspace task-graph runtime (stack/sync/bind/persist).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceGraphRuntimeApi(deps).
 */
(function initSocialWorkspaceGraphRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_GRAPH_RUNTIME_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_GRAPH_RUNTIME_LOADED = true;

    function createKiuSocialWorkspaceGraphRuntimeApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace graph runtime deps required');
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
            buildProjectTaskGraphCanvasMarkup,
// --- READABILITY: Layout ---
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
            renderProjectTaskGraphDetailRailContent,
            renderProjectTaskGraphEdgeGroupsHtml,
            renderProjectTaskGraphGroupEdgesHtml,
            renderProjectTaskGraphQuickCreatePopover,
            renderStackedProjectTaskChild,
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

// --- READABILITY: Bind ---
        /* ── Task graph runtime (layout/model/bind/sync/persist) ── */

        /* graph module state */
        let projectTaskGraphDragAbort = null;
        let projectTaskGraphResizeObserver = null;
        let projectTaskGraphLastStageSizeKey = '';
        let projectTaskGraphEdgeRaf = 0;
        let projectTaskGraphPanWindowListeners = null;
// --- READABILITY: Sync ---
        const taskGraphSyncTimers = new Map();
        const taskGraphSyncPending = new Map();

        function shouldRenderProjectTaskGraphStack(runtime, kind = '') {
            return runtime.ui?.previousDialog?.type === 'project-task-graph'
                && PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(text(kind));
        }

        function isProjectTaskGraphStackActive(runtime = state()) {
            const activeKind = text(activeDialog()?.type || '');
            if (activeKind === 'project-task-graph') return true;
            if (shouldRenderProjectTaskGraphStack(runtime, activeKind)) return true;
            return runtime.ui?.projectTaskGraphStackAnchor?.type === 'project-task-graph';
        }

        function getProjectTaskGraphStackAnchorDialog(runtime = state()) {
            if (runtime.ui?.previousDialog?.type === 'project-task-graph') return runtime.ui.previousDialog;
            if (runtime.ui?.projectTaskGraphStackAnchor?.type === 'project-task-graph') return runtime.ui.projectTaskGraphStackAnchor;
            if (runtime.ui?.socialDialog?.type === 'project-task-graph') return runtime.ui.socialDialog;
            return null;
        }

        function wrapProjectTaskGraphStack(graphMarkup, childMarkup) {
            if (!graphMarkup && !childMarkup) return '';
            if (!graphMarkup) return childMarkup || '';
            const childSlot = childMarkup || '';
            return `<div class="social-project-task-graph-stack">
                <div class="social-project-task-graph-anchor" data-project-task-graph-anchor="1">${graphMarkup}</div>
                <div class="social-project-task-graph-child-slot" data-project-task-graph-child-slot="1">${childSlot}</div>
            </div>`;
        }

        function trySyncProjectTaskGraphStackDialog(dialogRegion, runtime = state()) {
            if (!dialogRegion) return false;
            const activeKind = text(activeDialog()?.type || '');
            const anchor = dialogRegion.querySelector('[data-project-task-graph-anchor="1"]');
            const childSlot = dialogRegion.querySelector('[data-project-task-graph-child-slot="1"]');

            if (activeKind === 'project-task-graph' && anchor && childSlot) {
                childSlot.innerHTML = '';
                delete dialogRegion.__kiuLastMarkup;
                return true;
            }

            if (shouldRenderProjectTaskGraphStack(runtime, activeKind) && anchor && childSlot) {
                childSlot.innerHTML = renderStackedProjectTaskChild(runtime, activeKind);
                delete dialogRegion.__kiuLastMarkup;
                return true;
            }

            return false;
        }

        function projectTaskGraphStackedBackdropClass(runtime, kind = '') {
            if (shouldRenderProjectTaskGraphStack(runtime, kind) || shouldRenderProjectHealthStack(runtime, kind)) {
                return 'lux-glass-dialog-backdrop--stacked-child';
            }
            return '';
        }

        function resolveProjectTaskGraphNodeFromTarget(target, svg, options = {}) {
            if (!target || !svg) return null;
            const draggableOnly = options.draggableOnly === true;
            const selector = draggableOnly
                ? '.social-project-task-graph-node-g[data-graph-draggable="1"]'
                : '.social-project-task-graph-node-g';
            const direct = target.closest?.(selector);
            if (direct && svg.contains(direct)) return direct;
            const card = target.closest?.('.social-project-task-graph-card[data-task-id]');
            const taskId = text(card?.getAttribute?.('data-task-id') || '');
            if (taskId) {
                const attr = draggableOnly ? '[data-graph-draggable="1"]' : '';
                const resolved = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${taskId}"]${attr}`);
                if (resolved) return resolved;
            }
            const fo = target.closest?.('.social-project-task-graph-card-fo');
            const parentG = fo?.parentElement;
            if (parentG?.matches?.(selector) && svg.contains(parentG)) return parentG;
            return null;
        }


        // Dep/group completeness + pan math: social-workspace-graph-model.js (loaded first).
        const __swGraphDep = window.KiuSocialWorkspaceGraphModel || {};
        const projectTaskDependsOnIds = window.projectTaskDependsOnIds || __swGraphDep.projectTaskDependsOnIds;
        const projectTaskGraphContentViewBox = window.projectTaskGraphContentViewBox || __swGraphDep.projectTaskGraphContentViewBox;
        const isProjectTaskGraphGroupId = window.isProjectTaskGraphGroupId || __swGraphDep.isProjectTaskGraphGroupId;
        const projectGroupDependsOnIds = window.projectGroupDependsOnIds || __swGraphDep.projectGroupDependsOnIds;
        const projectGroupBlocksIds = window.projectGroupBlocksIds || __swGraphDep.projectGroupBlocksIds;
        const isProjectTaskGraphGroupComplete = window.isProjectTaskGraphGroupComplete || __swGraphDep.isProjectTaskGraphGroupComplete;
        const isProjectGraphDependencyOpen = window.isProjectGraphDependencyOpen || __swGraphDep.isProjectGraphDependencyOpen;
        const resolveProjectTaskGraphPanSlack = window.resolveProjectTaskGraphPanSlack || __swGraphDep.resolveProjectTaskGraphPanSlack;
        const clampProjectTaskGraphPan = window.clampProjectTaskGraphPan || __swGraphDep.clampProjectTaskGraphPan;
        const projectTaskGraphScrollOffsets = window.projectTaskGraphScrollOffsets || __swGraphDep.projectTaskGraphScrollOffsets;

        // Pure graph layout/geometry: social-workspace-graph-model.js (loaded first)
        const __graphModel = window.KiuSocialWorkspaceGraphModel || {};
        const clampProjectTaskGraphCardHeight = window.clampProjectTaskGraphCardHeight || __graphModel.clampProjectTaskGraphCardHeight;
        const estimateProjectTaskGraphCardHeight = window.estimateProjectTaskGraphCardHeight || __graphModel.estimateProjectTaskGraphCardHeight;
        const normalizeProjectTaskGraphMode = window.normalizeProjectTaskGraphMode || __graphModel.normalizeProjectTaskGraphMode;
        const projectTaskGraphVisibleEdges = window.projectTaskGraphVisibleEdges || __graphModel.projectTaskGraphVisibleEdges;
        const buildProjectTaskGraphModel = window.buildProjectTaskGraphModel || __graphModel.buildProjectTaskGraphModel;
        const layoutProjectTaskGraphByStatus = window.layoutProjectTaskGraphByStatus || __graphModel.layoutProjectTaskGraphByStatus;
        const compareProjectTaskGraphNodes = window.compareProjectTaskGraphNodes || __graphModel.compareProjectTaskGraphNodes;
        const hashProjectTaskGraphSeed = window.hashProjectTaskGraphSeed || __graphModel.hashProjectTaskGraphSeed;
        const projectTaskGraphPseudoRandom = window.projectTaskGraphPseudoRandom || __graphModel.projectTaskGraphPseudoRandom;
        const getProjectTaskGraphMetrics = window.getProjectTaskGraphMetrics || __graphModel.getProjectTaskGraphMetrics;
        const computeProjectTaskGraphStageSize = window.computeProjectTaskGraphStageSize || __graphModel.computeProjectTaskGraphStageSize;
        const computeProjectTaskGraphNodeDegree = window.computeProjectTaskGraphNodeDegree || __graphModel.computeProjectTaskGraphNodeDegree;
        const projectTaskGraphBoxRepulse = window.projectTaskGraphBoxRepulse || __graphModel.projectTaskGraphBoxRepulse;
        const resolveProjectTaskGraphCardOverlaps = window.resolveProjectTaskGraphCardOverlaps || __graphModel.resolveProjectTaskGraphCardOverlaps;
        const layoutProjectTaskGraphForce = window.layoutProjectTaskGraphForce || __graphModel.layoutProjectTaskGraphForce;
        const projectTaskGraphLayoutUsesSavedPositions = window.projectTaskGraphLayoutUsesSavedPositions || __graphModel.projectTaskGraphLayoutUsesSavedPositions;
        const projectTaskGraphRectsOverlap = window.projectTaskGraphRectsOverlap || __graphModel.projectTaskGraphRectsOverlap;
        const projectTaskGraphContentBounds = window.projectTaskGraphContentBounds || __graphModel.projectTaskGraphContentBounds;
        const clampProjectTaskGraphZoom = window.clampProjectTaskGraphZoom || __graphModel.clampProjectTaskGraphZoom;
        const computeProjectTaskGraphContentFitView = window.computeProjectTaskGraphContentFitView || __graphModel.computeProjectTaskGraphContentFitView;
        const computeProjectTaskGraphFitZoom = window.computeProjectTaskGraphFitZoom || __graphModel.computeProjectTaskGraphFitZoom;
        const computeProjectTaskGraphPreviewZoom = window.computeProjectTaskGraphPreviewZoom || __graphModel.computeProjectTaskGraphPreviewZoom;
        const projectTaskGraphCubicEdgePath = window.projectTaskGraphCubicEdgePath || __graphModel.projectTaskGraphCubicEdgePath;


        function measureProjectTaskGraphCardHeights(host = getProjectTaskGraphHost(), options = {}) {
            const svg = host?.querySelector('[data-project-task-graph-svg]');
            if (!svg) return false;
            const compact = Boolean(options.compact);
            const minH = compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H : PROJECT_TASK_GRAPH_CARD_MIN_H;
            const foPad = compact ? 8 : PROJECT_TASK_GRAPH_FO_PAD;
            let changed = false;
            svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                const card = node.querySelector('[data-graph-card-inner="1"]');
                if (!card) return;
                const w = Number(node.getAttribute('data-w')) || (compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_W : PROJECT_TASK_GRAPH_CARD_W);
                const prevH = Number(node.getAttribute('data-h')) || minH;
                const body = card.querySelector('.social-project-task-graph-card-body');
                const prevOverflow = body ? body.style.overflow : '';
                if (body) body.style.overflow = 'visible';
                card.style.height = 'auto';
                card.style.minHeight = `${minH}px`;
                card.style.maxHeight = 'none';
                // Force reflow so scrollHeight reflects full unclamped content
                const measured = Math.ceil(Math.max(
                    card.getBoundingClientRect().height,
                    card.scrollHeight || 0,
                    body ? (body.scrollHeight + 4) : 0
                ));
                const nextH = clampProjectTaskGraphCardHeight(measured, compact);
                if (body) body.style.overflow = prevOverflow;
                card.style.minHeight = '';
                card.style.maxHeight = '';
                if (nextH === prevH) {
                    card.style.height = `${prevH}px`;
                    return;
                }
                changed = true;
                const cx = Number(node.getAttribute('data-cx'));
                const cy = Number(node.getAttribute('data-cy'));
                const x = cx - Math.round(w / 2);
                const y = cy - Math.round(nextH / 2);
                node.setAttribute('data-h', String(nextH));
                node.setAttribute('transform', `translate(${x},${y})`);
                const hit = node.querySelector('.social-project-task-graph-hit');
                if (hit) hit.setAttribute('height', String(nextH));
                const fo = node.querySelector('.social-project-task-graph-card-fo');
                if (fo) {
                    fo.setAttribute('height', String(nextH + foPad * 2));
                    fo.setAttribute('y', String(-foPad));
                }
                const foInner = node.querySelector('.social-project-task-graph-card-fo-inner');
                if (foInner) foInner.style.height = `${nextH + foPad * 2}px`;
                card.style.height = `${nextH}px`;
            });
            if (changed) resolveProjectTaskGraphCardOverlaps(svg.querySelectorAll('.social-project-task-graph-node-g'), foPad + 8);
            return changed;
        }







        /* Wave 18: social-workspace-graph-layout-runtime.js */
        const __graphLayoutApi = typeof window.__kiuCreateSocialWorkspaceGraphLayoutApi === 'function'
            ? window.__kiuCreateSocialWorkspaceGraphLayoutApi(deps) : null;
        if (!__graphLayoutApi) throw new Error('social-workspace-graph-layout-runtime.js missing');
        const { findFreeProjectTaskGraphPosition, ensureProjectTaskGraphPositionForTask } = __graphLayoutApi;


        /** Bounding box of all placed cards (for preview auto-fit viewBox). */




// --- READABILITY: Persist ---
        function collectProjectTaskGraphGroupBoxes(runtime, projectId, layout = null, savedPositions = null, options = {}) {
            const saved = savedPositions || getProjectTaskGraphPositions(runtime, projectId);
            const groups = getProjectTaskGraphGroups(runtime, projectId);
            let emptyIndex = 0;
            return groups.map((group) => {
                const members = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map(text).filter(Boolean);
                const box = resolveProjectTaskGraphGroupBox(group, layout, saved, {
                    ...options,
                    emptyIndex,
                    skipDefault: options.skipDefault !== false
                });
                if (!members.length && text(layout?.layoutKind || '') === 'status') emptyIndex += 1;
                return box;
            }).filter(Boolean);
        }



        function loadProjectTaskGraphPositions(projectId) {
            try {
                const raw = localStorage.getItem(projectTaskGraphPositionsStorageKey(projectId));
                if (!raw) return {};
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        function saveProjectTaskGraphPositions(projectId, positions, options = {}) {
            const payload = positions && typeof positions === 'object' && !Array.isArray(positions) ? positions : {};
            try {
                localStorage.setItem(projectTaskGraphPositionsStorageKey(projectId), JSON.stringify(payload));
            } catch (error) {}
            try {
                const runtime = state();
                if (runtime?.ui) {
                    const map = runtime.ui.projectTaskGraphPositionsByProject || (runtime.ui.projectTaskGraphPositionsByProject = {});
                    const id = text(projectId);
                    if (id) map[id] = payload;
                    runtime.ui.projectTaskGraphPositions = payload;
                }
            } catch (error) {}
            if (!options.skipSync) queueProjectTaskGraphSync(text(projectId), { taskGraphPositions: payload });
            return payload;
        }

        function getProjectTaskGraphPositions(runtime, projectId) {
            if (!runtime?.ui) return {};
            const map = runtime.ui.projectTaskGraphPositionsByProject || (runtime.ui.projectTaskGraphPositionsByProject = {});
            const id = text(projectId);
            if (!id) return {};
            if (!map[id] || typeof map[id] !== 'object' || Array.isArray(map[id])) {
                map[id] = loadProjectTaskGraphPositions(id);
            }
            // Legacy mirror for current project only while graph is open
            runtime.ui.projectTaskGraphPositions = map[id];
            return map[id];
        }

        function setProjectTaskGraphPositions(runtime, projectId, positions, options = {}) {
            if (!runtime?.ui) return positions && typeof positions === 'object' ? positions : {};
            const map = runtime.ui.projectTaskGraphPositionsByProject || (runtime.ui.projectTaskGraphPositionsByProject = {});
            const id = text(projectId);
            const payload = positions && typeof positions === 'object' && !Array.isArray(positions) ? positions : {};
            if (id) {
                map[id] = payload;
                runtime.ui.projectTaskGraphPositions = payload;
                saveProjectTaskGraphPositions(id, payload, options);
                // skipNotify during server seed / silent writes — avoids render re-entry loops.
                if (!options.skipNotify && !options.skipSync) {
                    notifyProjectTaskGraphSurfaceChanged(id);
                }
            } else {
                runtime.ui.projectTaskGraphPositions = payload;
            }
            return payload;
        }

        function ensureProjectTaskGraphPositionsLoaded(runtime, projectId) {
            const id = text(projectId);
            if (id) {
                const project = resolveActiveSocialProject(runtime, id);
                if (project) seedProjectTaskGraphFromProject(runtime, project);
            }
            return getProjectTaskGraphPositions(runtime, projectId);
        }




        function loadProjectTaskGraphView(projectId) {
            try {
                const raw = localStorage.getItem(projectTaskGraphViewStorageKey(projectId));
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') return null;
                // Pre-bounds pan used world origin; those saves open on empty space — discard.
                if (text(parsed.coords || '') !== 'bounds') return null;
                const zoom = clampProjectTaskGraphZoom(parsed.zoom);
                const panX = Math.round(Number(parsed?.pan?.x) || 0);
                const panY = Math.round(Number(parsed?.pan?.y) || 0);
                return { zoom, pan: { x: panX, y: panY }, coords: 'bounds' };
            } catch (error) {
                return null;
            }
        }

        function saveProjectTaskGraphView(projectId, view = {}, options = {}) {
            const id = text(projectId);
            if (!id) return null;
            const payload = {
                zoom: clampProjectTaskGraphZoom(view?.zoom),
                pan: {
                    x: Math.round(Number(view?.pan?.x) || 0),
                    y: Math.round(Number(view?.pan?.y) || 0)
                },
                coords: 'bounds'
            };
            try {
                localStorage.setItem(projectTaskGraphViewStorageKey(id), JSON.stringify(payload));
            } catch (error) {}
            try {
                const runtime = state();
                if (runtime?.ui) {
                    const map = runtime.ui.projectTaskGraphViewByProject || (runtime.ui.projectTaskGraphViewByProject = {});
                    map[id] = payload;
                    runtime.ui.projectTaskGraphZoom = payload.zoom;
                    runtime.ui.projectTaskGraphPan = { ...payload.pan };
                }
            } catch (error) {}
            if (!options.skipSync) queueProjectTaskGraphSync(id, { taskGraphView: payload });
            return payload;
        }

        function persistProjectTaskGraphView(runtime = state(), projectId = '') {
            const id = text(
                projectId
                || runtime?.ui?.activeProjectId
                || activeDialog()?.projectId
                || ''
            );
            if (!id || !runtime?.ui) return null;
            return saveProjectTaskGraphView(id, {
                zoom: runtime.ui.projectTaskGraphZoom,
                pan: runtime.ui.projectTaskGraphPan || { x: 0, y: 0 }
            });
        }

        // --- Task groups (canvas overlay; server sync via taskGraphGroups on project record) ---
        const PROJECT_TASK_GROUP_NODE_W = window.PROJECT_TASK_GROUP_NODE_W || __swGraphBatch.PROJECT_TASK_GROUP_NODE_W || 264;
        const PROJECT_TASK_GROUP_NODE_H = window.PROJECT_TASK_GROUP_NODE_H || __swGraphBatch.PROJECT_TASK_GROUP_NODE_H || 228;



        function seedProjectTaskGraphFromProject(runtime, project) {
            const id = text(project?.id);
            const serverAt = text(project?.taskGraphUpdatedAt || '');
            if (!id || !serverAt) return false;
            const localAt = loadTaskGraphSyncMarker(id);
            const serverMs = Date.parse(serverAt);
            const localMs = Date.parse(localAt);
            // Already applied this server snapshot (or keep newer local edits).
            // Using `>` only caused re-seed on every getGroups call when localAt === serverAt,
            // which re-entered render via notifyProjectTaskGraphSurfaceChanged (stack overflow).
            if (localAt && Number.isFinite(localMs) && Number.isFinite(serverMs) && localMs >= serverMs) return false;
            const skip = { skipSync: true, skipNotify: true };
            const positions = project?.taskGraphPositions && typeof project.taskGraphPositions === 'object' && !Array.isArray(project.taskGraphPositions)
                ? project.taskGraphPositions
                : null;
            if (positions && Object.keys(positions).length) {
                setProjectTaskGraphPositions(runtime, id, positions, skip);
            }
            if (project?.taskGraphView && typeof project.taskGraphView === 'object') {
                // Ignore legacy world-origin pans — they open looking at empty canvas.
                if (text(project.taskGraphView.coords || '') === 'bounds') {
                    saveProjectTaskGraphView(id, project.taskGraphView, skip);
                    if (runtime?.ui) {
                        runtime.ui.projectTaskGraphZoom = project.taskGraphView.zoom;
                        runtime.ui.projectTaskGraphPan = { ...(project.taskGraphView.pan || { x: 0, y: 0 }) };
                    }
                }
            }
            if (Array.isArray(project?.taskGraphGroups) && project.taskGraphGroups.length) {
                setProjectTaskGraphGroups(runtime, id, project.taskGraphGroups, { ...skip, skipSync: true });
            }
            saveTaskGraphSyncMarker(id, serverAt);
            return true;
        }

        function queueProjectTaskGraphSync(projectId, patch = {}) {
            const id = text(projectId);
            if (!id || !patch || typeof patch !== 'object' || typeof updatePortalSocialProjectTaskGraph !== 'function') return;
            const runtime = state();
            const project = resolveActiveSocialProject(runtime, id);
            if (!project?.viewerCanContribute) return;
            const pending = taskGraphSyncPending.get(id) || {};
            taskGraphSyncPending.set(id, { ...pending, ...patch });
            if (taskGraphSyncTimers.has(id)) clearTimeout(taskGraphSyncTimers.get(id));
            taskGraphSyncTimers.set(id, setTimeout(() => {
                const body = taskGraphSyncPending.get(id) || {};
                taskGraphSyncPending.delete(id);
                taskGraphSyncTimers.delete(id);
                updatePortalSocialProjectTaskGraph(id, body)
                    .then((updated) => {
                        if (updated?.taskGraphUpdatedAt) saveTaskGraphSyncMarker(id, updated.taskGraphUpdatedAt);
                    })
                    .catch(() => null);
            }, 500));
        }



        function getProjectTaskGraphGroups(runtime = state(), projectId = '') {
            const id = text(projectId);
            if (!id) return [];
            const project = resolveActiveSocialProject(runtime, id);
            if (project) seedProjectTaskGraphFromProject(runtime, project);
            const cache = runtime?.ui?.projectTaskGraphGroupsByProject;
            if (cache && Array.isArray(cache[id])) return cache[id];
            let list = [];
            try {
                const raw = localStorage.getItem(projectTaskGraphGroupsStorageKey(id));
                if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) list = parsed; }
            } catch (error) {}
            if (runtime?.ui) (runtime.ui.projectTaskGraphGroupsByProject || (runtime.ui.projectTaskGraphGroupsByProject = {}))[id] = list;
            return list;
        }

        function setProjectTaskGraphGroups(runtime, projectId, groups, options = {}) {
            const id = text(projectId);
            if (!id) return;
            const list = Array.isArray(groups) ? groups : [];
            if (runtime?.ui) (runtime.ui.projectTaskGraphGroupsByProject || (runtime.ui.projectTaskGraphGroupsByProject = {}))[id] = list;
            try { localStorage.setItem(projectTaskGraphGroupsStorageKey(id), JSON.stringify(list)); } catch (error) {}
            if (!options.skipSync) queueProjectTaskGraphSync(id, { taskGraphGroups: list });
            // Membership drives Work Desk package lanes — keep desk/preview in sync with graph.
            if (!options.skipNotify && !options.skipSync) {
                notifyProjectTaskGraphSurfaceChanged(id);
                refreshDeskAfterGraphMembership(id);
            }
        }



        function pulseProjectTaskGraphCheckpointButton(btn) {
            if (!btn?.classList) return;
            btn.classList.remove('is-click-pulse');
            // Restart CSS animation if already running.
            try { void btn.offsetWidth; } catch (error) {}
            btn.classList.add('is-click-pulse');
            window.setTimeout(() => {
                try { btn.classList.remove('is-click-pulse'); } catch (error) {}
            }, 450);
        }



        function readProjectTaskGraphCheckpoints(projectId) {
            const id = text(projectId);
            if (!id) return [];
            let list = [];
            try {
                const raw = localStorage.getItem(projectTaskGraphCheckpointsStorageKey(id));
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) list = parsed.map(normalizeProjectTaskGraphCheckpointEntry).filter(Boolean);
                }
            } catch (error) {}
            // Migrate legacy single checkpoint once.
            if (!list.length) {
                try {
                    const legacyRaw = localStorage.getItem(projectTaskGraphCheckpointStorageKey(id));
                    if (legacyRaw) {
                        const legacy = normalizeProjectTaskGraphCheckpointEntry(JSON.parse(legacyRaw));
                        if (legacy) {
                            list = [legacy];
                            writeProjectTaskGraphCheckpoints(id, list);
                        }
                    }
                } catch (error) {}
            }
            return list;
        }

        function writeProjectTaskGraphCheckpoints(projectId, list) {
            const id = text(projectId);
            if (!id) return [];
            const next = (Array.isArray(list) ? list : [])
                .map(normalizeProjectTaskGraphCheckpointEntry)
                .filter(Boolean)
                .slice(0, PROJECT_TASK_GRAPH_CHECKPOINT_MAX);
            try {
                localStorage.setItem(projectTaskGraphCheckpointsStorageKey(id), JSON.stringify(next));
            } catch (error) {
                throw new Error('Could not save checkpoint history (storage full or blocked).');
            }
            return next;
        }

        /** Latest checkpoint (compat helper). */

        function readProjectTaskGraphCheckpoint(projectId) {
            return readProjectTaskGraphCheckpoints(projectId)[0] || null;
        }

        function getProjectTaskGraphCheckpointById(projectId, snapshotId) {
            const want = text(snapshotId);
            if (!want) return null;
            return readProjectTaskGraphCheckpoints(projectId).find((entry) => text(entry.id) === want) || null;
        }

        function deleteProjectTaskGraphCheckpoint(projectId, snapshotId) {
            const want = text(snapshotId);
            if (!want) return readProjectTaskGraphCheckpoints(projectId);
            return writeProjectTaskGraphCheckpoints(
                projectId,
                readProjectTaskGraphCheckpoints(projectId).filter((entry) => text(entry.id) !== want)
            );
        }

        /** Flush debounced graph sync immediately (and send an optional extra patch). */

        function flushProjectTaskGraphSync(projectId, extraPatch = null) {
            const id = text(projectId);
            if (!id || typeof updatePortalSocialProjectTaskGraph !== 'function') return Promise.resolve(null);
            const runtime = state();
            const project = resolveActiveSocialProject(runtime, id);
            if (!project?.viewerCanContribute) return Promise.resolve(null);
            if (taskGraphSyncTimers.has(id)) {
                clearTimeout(taskGraphSyncTimers.get(id));
                taskGraphSyncTimers.delete(id);
            }
            const pending = taskGraphSyncPending.get(id) || {};
            taskGraphSyncPending.delete(id);
            const body = {
                ...pending,
                ...(extraPatch && typeof extraPatch === 'object' ? extraPatch : {})
            };
            if (!Object.keys(body).length) return Promise.resolve(null);
            return updatePortalSocialProjectTaskGraph(id, body)
                .then((updated) => {
                    if (updated?.taskGraphUpdatedAt) saveTaskGraphSyncMarker(id, updated.taskGraphUpdatedAt);
                    return updated;
                })
                .catch((error) => {
                    console.error('[Social] Task graph sync failed:', error);
                    return null;
                });
        }

        function collectProjectTaskGraphCheckpoint(runtime, projectId) {
            const id = text(projectId);
            const project = resolveActiveSocialProject(runtime, id);
            if (!project) return null;
            const host = getProjectTaskGraphHost();
            const svg = host?.querySelector('[data-project-task-graph-svg]');
            const live = typeof readProjectTaskGraphLivePositions === 'function'
                ? readProjectTaskGraphLivePositions(svg)
                : {};
            const saved = getProjectTaskGraphPositions(runtime, id) || {};
            const positions = { ...saved, ...live };
            // Prefer live group node positions when open.
            if (svg) {
                svg.querySelectorAll('.social-project-task-graph-group-node').forEach((node) => {
                    const gid = text(node.getAttribute('data-group-id') || node.getAttribute('data-task-id'));
                    if (!gid) return;
                    const x = Number(node.getAttribute('data-cx'));
                    const y = Number(node.getAttribute('data-cy'));
                    if (Number.isFinite(x) && Number.isFinite(y)) positions[gid] = { x, y };
                });
            }
            const groups = getProjectTaskGraphGroups(runtime, id).map((g) => {
                const gid = text(g?.id);
                const pos = positions[gid];
                return {
                    id: gid,
                    name: text(g?.name || 'Package'),
                    x: pos && Number.isFinite(pos.x) ? pos.x : (Number(g?.x) || 0),
                    y: pos && Number.isFinite(pos.y) ? pos.y : (Number(g?.y) || 0),
                    memberTaskIds: (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).map(text).filter(Boolean),
                    dependsOnIds: projectGroupDependsOnIds(g),
                    blocksIds: projectGroupBlocksIds(g)
                };
            }).filter((g) => g.id);
            const zoom = clampProjectTaskGraphZoom(Number(runtime.ui?.projectTaskGraphZoom) || 1);
            const pan = readProjectTaskGraphPan(runtime);
            const taskDepends = {};
            (Array.isArray(project.tasks) ? project.tasks : []).forEach((task) => {
                const tid = text(task?.id);
                if (!tid) return;
                taskDepends[tid] = projectTaskDependsOnIds(task);
            });
            const savedAt = new Date().toISOString();
            const when = formatProjectTaskGraphCheckpointWhen(savedAt);
            return {
                id: `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
                savedAt,
                label: when ? `Save · ${when}` : 'Save',
                taskGraphPositions: positions,
                taskGraphGroups: groups,
                taskGraphView: { zoom, pan: { x: pan.x, y: pan.y } },
                taskDepends
            };
        }

        async function saveProjectTaskGraphCheckpoint(runtime, projectId) {
            const id = text(projectId);
            const snapshot = collectProjectTaskGraphCheckpoint(runtime, id);
            if (!snapshot) throw new Error('Nothing to save.');
            const history = [snapshot, ...readProjectTaskGraphCheckpoints(id)];
            writeProjectTaskGraphCheckpoints(id, history);
            // Persist live layout into normal stores + push server now.
            setProjectTaskGraphPositions(runtime, id, snapshot.taskGraphPositions, { skipSync: true });
            setProjectTaskGraphGroups(runtime, id, snapshot.taskGraphGroups, { skipSync: true, skipNotify: true });
            saveProjectTaskGraphView(id, snapshot.taskGraphView, { skipSync: true });
            const synced = await flushProjectTaskGraphSync(id, {
                taskGraphPositions: snapshot.taskGraphPositions,
                taskGraphGroups: snapshot.taskGraphGroups,
                taskGraphView: snapshot.taskGraphView
            });
            snapshot.serverSynced = Boolean(synced);
            return snapshot;
        }

        async function applyProjectTaskGraphCheckpointSnapshot(runtime, projectId, snapshot) {
            const id = text(projectId);
            if (!snapshot) throw new Error('Save not found.');
            const positions = snapshot.taskGraphPositions && typeof snapshot.taskGraphPositions === 'object'
                ? snapshot.taskGraphPositions
                : {};
            const groups = Array.isArray(snapshot.taskGraphGroups) ? snapshot.taskGraphGroups : [];
            const view = snapshot.taskGraphView && typeof snapshot.taskGraphView === 'object'
                ? snapshot.taskGraphView
                : { zoom: 1, pan: { x: 0, y: 0 } };
            setProjectTaskGraphPositions(runtime, id, positions, { skipSync: true });
            setProjectTaskGraphGroups(runtime, id, groups, { skipSync: true, skipNotify: true });
            saveProjectTaskGraphView(id, view, { skipSync: true });
            runtime.ui.projectTaskGraphZoom = clampProjectTaskGraphZoom(Number(view.zoom) || 1);
            runtime.ui.projectTaskGraphPan = {
                x: Math.round(Number(view.pan?.x) || 0),
                y: Math.round(Number(view.pan?.y) || 0)
            };

            const taskDepends = snapshot.taskDepends && typeof snapshot.taskDepends === 'object'
                ? snapshot.taskDepends
                : {};
            const project = resolveActiveSocialProject(runtime, id);
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            for (const task of tasks) {
                const tid = text(task?.id);
                if (!tid || !Object.prototype.hasOwnProperty.call(taskDepends, tid)) continue;
                const nextDeps = uniqueStrings((Array.isArray(taskDepends[tid]) ? taskDepends[tid] : []).map(text).filter(Boolean));
                const curDeps = projectTaskDependsOnIds(task);
                if (nextDeps.length === curDeps.length && nextDeps.every((d) => curDeps.includes(d))) continue;
                try {
                    if (typeof updatePortalSocialProjectTask === 'function') {
                        await updatePortalSocialProjectTask(id, tid, { dependsOnTaskIds: nextDeps }, { silent: true });
                    } else {
                        patchLocalProjectTaskDepends(runtime, id, tid, nextDeps);
                    }
                } catch (error) {
                    patchLocalProjectTaskDepends(runtime, id, tid, nextDeps);
                }
            }

            groups.forEach((group) => {
                const gid = text(group?.id);
                projectGroupBlocksIds(group).forEach((taskId) => {
                    const task = tasks.find((t) => text(t?.id) === text(taskId));
                    if (!task) return;
                    const deps = projectTaskDependsOnIds(task);
                    if (deps.includes(gid)) return;
                    patchLocalProjectTaskDepends(runtime, id, taskId, [...deps, gid]);
                });
            });

            await flushProjectTaskGraphSync(id, {
                taskGraphPositions: positions,
                taskGraphGroups: groups,
                taskGraphView: view
            });
            notifyProjectTaskGraphSurfaceChanged(id);
            refreshDeskAfterGraphMembership(id);
            return snapshot;
        }

        async function restoreProjectTaskGraphCheckpoint(runtime, projectId, snapshotId = '') {
            const id = text(projectId);
            const snapshot = text(snapshotId)
                ? getProjectTaskGraphCheckpointById(id, snapshotId)
                : readProjectTaskGraphCheckpoint(id);
            if (!snapshot) throw new Error('No saved graph yet. Click Save first.');
            return applyProjectTaskGraphCheckpointSnapshot(runtime, id, snapshot);
        }

        function createProjectTaskGraphGroup(runtime, projectId, { name, x, y } = {}) {
            const groups = getProjectTaskGraphGroups(runtime, projectId).slice();
            const group = {
                id: `grp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
                name: text(name) || 'New group',
                x: Math.round(Number(x) || 160),
                y: Math.round(Number(y) || 160),
                memberTaskIds: [],
                dependsOnIds: [],
                blocksIds: [],
                assigneeUserId: '',
                description: ''
            };
            groups.push(group);
            setProjectTaskGraphGroups(runtime, projectId, groups);
            return group;
        }

        function updateProjectTaskGraphGroup(runtime, projectId, groupId, patch = {}) {
            setProjectTaskGraphGroups(runtime, projectId, getProjectTaskGraphGroups(runtime, projectId).map((g) => (text(g.id) === text(groupId) ? { ...g, ...patch } : g)));
        }

        function deleteProjectTaskGraphGroup(runtime, projectId, groupId) {
            const gid = text(groupId);
            if (!gid) return;
            const nextGroups = getProjectTaskGraphGroups(runtime, projectId)
                .filter((g) => text(g.id) !== gid)
                .map((g) => ({
                    ...g,
                    dependsOnIds: projectGroupDependsOnIds(g).filter((id) => id !== gid),
                    blocksIds: projectGroupBlocksIds(g).filter((id) => id !== gid)
                }));
            setProjectTaskGraphGroups(runtime, projectId, nextGroups);
            // Scrub dual-written package ids from task dependency lists.
            const project = resolveActiveSocialProject(runtime, projectId);
            (Array.isArray(project?.tasks) ? project.tasks : []).forEach((task) => {
                const tid = text(task?.id);
                if (!tid) return;
                const deps = projectTaskDependsOnIds(task);
                if (!deps.includes(gid)) return;
                patchLocalProjectTaskDepends(runtime, projectId, tid, deps.filter((id) => id !== gid));
            });
            // Drop free-placed package coords so orphans do not inflate bounds.
            const saved = getProjectTaskGraphPositions(runtime, projectId);
            if (saved && saved[gid]) {
                const next = { ...saved };
                delete next[gid];
                setProjectTaskGraphPositions(runtime, projectId, next, { skipNotify: true });
            }
        }

        function scrubDeletedTaskFromProjectTaskGraphGroups(runtime, projectId, taskId) {
            const tid = text(taskId);
            if (!tid) return;
            const groups = getProjectTaskGraphGroups(runtime, projectId);
            let changed = false;
            const next = groups.map((g) => {
                const members = (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).map(text).filter(Boolean);
                const blocks = projectGroupBlocksIds(g);
                const deps = projectGroupDependsOnIds(g);
                const nextMembers = members.filter((id) => id !== tid);
                const nextBlocks = blocks.filter((id) => id !== tid);
                const nextDeps = deps.filter((id) => id !== tid);
                if (
                    nextMembers.length === members.length
                    && nextBlocks.length === blocks.length
                    && nextDeps.length === deps.length
                ) return g;
                changed = true;
                return {
                    ...g,
                    memberTaskIds: nextMembers,
                    blocksIds: nextBlocks,
                    dependsOnIds: nextDeps
                };
            });
            if (changed) setProjectTaskGraphGroups(runtime, projectId, next);
            const saved = getProjectTaskGraphPositions(runtime, projectId);
            if (saved && saved[tid]) {
                const nextPos = { ...saved };
                delete nextPos[tid];
                setProjectTaskGraphPositions(runtime, projectId, nextPos, { skipNotify: true });
            }
        }


        function toggleProjectTaskGraphGroupMember(runtime, projectId, groupId, taskId, add = true) {
            const tid = text(taskId);
            const gid = text(groupId);
            if (!tid || !gid) return;
            const groups = getProjectTaskGraphGroups(runtime, projectId);
            if (add && projectTaskGraphGroupMembershipWouldCycle(groups, gid, tid)) return;
            setProjectTaskGraphGroups(runtime, projectId, groups.map((g) => {
                if (text(g.id) !== gid) return g;
                const members = (Array.isArray(g.memberTaskIds) ? g.memberTaskIds : []).map(text).filter(Boolean);
                const has = members.includes(tid);
                return { ...g, memberTaskIds: add ? (has ? members : [...members, tid]) : members.filter((m) => m !== tid) };
            }));
        }



        /** Order wires involving a package (not membership). For package card / inspector summary. */


        // --- Scheduling: critical path, earliest/latest start, slack/float ---
        // Pure forward/backward pass over durations + dependencies. Duration in hours
        // (days → ×8 workday). Done tasks use 0 remaining duration so float/critical
        // reflect open work only; blocked keeps full PERT (still on the path).
        // A cycle (circular deps) is tolerated: tasks in it get 0 float but never crash.
        // ponytail: O(V+E), 8h workday calendar — no weekends/holidays.


        function buildProjectTaskGraphLayoutForView(runtime, projectId = '') {
            const project = resolveActiveSocialProject(runtime, projectId || runtime?.ui?.activeProjectId || activeDialog()?.projectId);
            if (!project) return null;
            // Full map always shows every project task — desk search/filters must not empty the canvas.
            const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
            const model = buildProjectTaskGraphModel(projectTasks, {
                showInferred: projectTaskGraphShowInferred(runtime),
                showFlow: projectTaskGraphShowFlow(runtime)
            });
            const stageSize = computeProjectTaskGraphStageSize(runtime);
            let layout = buildProjectTaskGraphLayout(model, runtime, stageSize);
            if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
                layout = applyProjectTaskGraphSavedPositions(
                    layout,
                    getProjectTaskGraphPositions(runtime, text(project.id))
                );
            }
            return { project, layout, stageSize, model };
        }

        function applyProjectTaskGraphResetView(runtime = state(), projectId = '') {
            const ctx = buildProjectTaskGraphLayoutForView(runtime, projectId);
            if (!ctx?.layout || !runtime?.ui) return null;
            const host = getProjectTaskGraphHost();
            const canvas = host?.querySelector('[data-project-task-graph-canvas]');
            const viewportW = Math.max(320, Math.round(canvas?.clientWidth || ctx.stageSize.stageWidth || 1100));
            const viewportH = Math.max(240, Math.round(canvas?.clientHeight || ctx.stageSize.stageHeight || 640));
            const pid = text(projectId || ctx.project?.id || '');
            const groupBoxes = collectProjectTaskGraphGroupBoxes(runtime, pid, ctx.layout);
            const fit = computeProjectTaskGraphContentFitView(ctx.layout, viewportW, viewportH, {
                pad: 56,
                minZoom: PROJECT_TASK_GRAPH_MIN_ZOOM,
                maxZoom: 1.15,
                extraBoxes: groupBoxes
            });
            runtime.ui.projectTaskGraphZoom = fit.zoom;
            runtime.ui.projectTaskGraphPan = { x: fit.pan.x, y: fit.pan.y };
            saveProjectTaskGraphView(pid, {
                zoom: fit.zoom,
                pan: fit.pan
            });
            return fit;
        }

        // Edge/dock/obstacle geometry pure helpers: social-workspace-graph-model.js (loaded first).
        const __swGraphEdge = window.KiuSocialWorkspaceGraphModel || {};
        const projectTaskGraphBoxAnchor = window.projectTaskGraphBoxAnchor || __swGraphEdge.projectTaskGraphBoxAnchor;
        const getProjectTaskGraphDocks = window.getProjectTaskGraphDocks || __swGraphEdge.getProjectTaskGraphDocks;
        const projectTaskGraphDockAlongSide = window.projectTaskGraphDockAlongSide || __swGraphEdge.projectTaskGraphDockAlongSide;
        const selectProjectTaskGraphDockPair = window.selectProjectTaskGraphDockPair || __swGraphEdge.selectProjectTaskGraphDockPair;
        const projectTaskGraphPushOutOfRect = window.projectTaskGraphPushOutOfRect || __swGraphEdge.projectTaskGraphPushOutOfRect;
        const normalizeProjectTaskGraphStatusId = window.normalizeProjectTaskGraphStatusId || __swGraphEdge.normalizeProjectTaskGraphStatusId;
        const projectTaskGraphStatusEdgeColor = window.projectTaskGraphStatusEdgeColor || __swGraphEdge.projectTaskGraphStatusEdgeColor;
        const projectTaskGraphEdgePath = window.projectTaskGraphEdgePath || __swGraphEdge.projectTaskGraphEdgePath;
        const projectTaskGraphEdgeAnchors = window.projectTaskGraphEdgeAnchors || __swGraphEdge.projectTaskGraphEdgeAnchors;
        const projectTaskGraphObstacleList = window.projectTaskGraphObstacleList || __swGraphEdge.projectTaskGraphObstacleList;
        const formatProjectTaskGraphNodeLabel = window.formatProjectTaskGraphNodeLabel || __swGraphEdge.formatProjectTaskGraphNodeLabel;
        const projectTaskGraphPortRole = window.projectTaskGraphPortRole || __swGraphEdge.projectTaskGraphPortRole;
        const resolveProjectTaskGraphWireEndpoints = window.resolveProjectTaskGraphWireEndpoints || __swGraphEdge.resolveProjectTaskGraphWireEndpoints;

        function readProjectTaskGraphPortCenter(portEl) {
            const node = portEl?.closest?.('.social-project-task-graph-node-g');
            if (!node) return null;
            let side = text(portEl.getAttribute('data-graph-link-port'));
            // Legacy aliases
            if (side === 'out') side = 'e';
            if (side === 'in') side = 'w';
            const w = Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W;
            const h = Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H;
            const cx = Number(node.getAttribute('data-cx'));
            const cy = Number(node.getAttribute('data-cy'));
            const hw = w / 2;
            const hh = h / 2;
            const base = {
                taskId: text(node.getAttribute('data-task-id')),
                projectId: text(node.getAttribute('data-project-id')),
                side,
                role: projectTaskGraphPortRole(side)
            };
            if (side === 'e' || side === 'out') return { ...base, x: cx + hw, y: cy, side: 'e', role: 'out' };
            if (side === 'w' || side === 'in') return { ...base, x: cx - hw, y: cy, side: 'w', role: 'in' };
            if (side === 'n') return { ...base, x: cx, y: cy - hh, side: 'n', role: 'in' };
            if (side === 's') return { ...base, x: cx, y: cy + hh, side: 's', role: 'out' };
            if (side === 'in') return { ...base, x: cx - hw, y: cy, role: 'in' };
            return { ...base, x: cx, y: cy };
        }

        function resolveProjectTaskGraphLinkPreviewHost(svg) {
            return svg?.querySelector('[data-project-task-graph-viewport]') || svg;
        }

        function ensureProjectTaskGraphLinkPreview(svg) {
            if (!svg) return null;
            const host = resolveProjectTaskGraphLinkPreviewHost(svg);
            let preview = host?.querySelector('.social-project-task-graph-link-preview')
                || svg.querySelector('.social-project-task-graph-link-preview');
            if (!preview) {
                preview = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                preview.setAttribute('class', 'social-project-task-graph-link-preview');
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'social-project-task-graph-link-rubber');
                preview.appendChild(line);
                host?.appendChild(preview);
            }
            return preview.querySelector('.social-project-task-graph-link-rubber');
        }

        function updateProjectTaskGraphLinkPreview(svg, x1, y1, x2, y2, statusColor = '') {
            const line = ensureProjectTaskGraphLinkPreview(svg);
            if (!line) return;
            line.setAttribute('x1', String(x1));
            line.setAttribute('y1', String(y1));
            line.setAttribute('x2', String(x2));
            line.setAttribute('y2', String(y2));
            if (statusColor) {
                line.setAttribute('stroke', statusColor);
                line.style.stroke = statusColor;
            }
            line.closest('.social-project-task-graph-link-preview')?.classList.add('is-visible');
        }

        function clearProjectTaskGraphLinkPreview(svg) {
            svg?.querySelector('.social-project-task-graph-link-preview')?.classList.remove('is-visible');
        }

        const __graphSyncApi = typeof window.__kiuCreateSocialWorkspaceGraphSyncApi === "function"
            ? window.__kiuCreateSocialWorkspaceGraphSyncApi({
                ...deps,
                get bindProjectTaskGraphDrag() { return typeof bindProjectTaskGraphDrag === "function" ? bindProjectTaskGraphDrag : window.bindProjectTaskGraphDrag; },
                get getProjectTaskGraphGroups() { return typeof getProjectTaskGraphGroups === "function" ? getProjectTaskGraphGroups : window.getProjectTaskGraphGroups; },
                get getProjectTaskGraphPositions() { return typeof getProjectTaskGraphPositions === "function" ? getProjectTaskGraphPositions : window.getProjectTaskGraphPositions; },
                get measureProjectTaskGraphCardHeights() { return typeof measureProjectTaskGraphCardHeights === "function" ? measureProjectTaskGraphCardHeights : window.measureProjectTaskGraphCardHeights; },
                get notifyProjectTaskGraphSurfaceChanged() { return typeof notifyProjectTaskGraphSurfaceChanged === "function" ? notifyProjectTaskGraphSurfaceChanged : window.notifyProjectTaskGraphSurfaceChanged; },
                get readProjectTaskGraphPortCenter() { return typeof readProjectTaskGraphPortCenter === "function" ? readProjectTaskGraphPortCenter : window.readProjectTaskGraphPortCenter; },
                get resolveProjectTaskGraphNodeFromTarget() { return typeof resolveProjectTaskGraphNodeFromTarget === "function" ? resolveProjectTaskGraphNodeFromTarget : window.resolveProjectTaskGraphNodeFromTarget; },
                get updateProjectTaskGraphGroup() { return typeof updateProjectTaskGraphGroup === "function" ? updateProjectTaskGraphGroup : window.updateProjectTaskGraphGroup; },
            })
            : {};
        const {
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
        } = __graphSyncApi;


        async function removeProjectGraphDependency(projectId, targetId, fromId) {
            const runtime = state();
            const to = text(targetId);
            const from = text(fromId);
            if (!to || !from) return;
            if (isProjectTaskGraphGroupId(to)) {
                const group = getProjectTaskGraphGroups(runtime, projectId).find((g) => text(g.id) === to);
                if (!group) return;
                const deps = projectGroupDependsOnIds(group).filter((id) => id !== from);
                updateProjectTaskGraphGroup(runtime, projectId, to, { dependsOnIds: deps });
                return;
            }
            // Clearing package → task: drop from group.blocksIds and task.dependsOnTaskIds.
            if (isProjectTaskGraphGroupId(from)) {
                const group = getProjectTaskGraphGroups(runtime, projectId).find((g) => text(g.id) === from);
                if (group) {
                    const blocks = projectGroupBlocksIds(group).filter((id) => id !== to);
                    updateProjectTaskGraphGroup(runtime, projectId, from, { blocksIds: blocks });
                }
            }
            const project = resolveActiveSocialProject(runtime, projectId);
            const target = (Array.isArray(project?.tasks) ? project.tasks : []).find((task) => text(task?.id) === to);
            if (!target) return;
            const deps = projectTaskDependsOnIds(target).filter((id) => id !== from);
            try {
                await updatePortalSocialProjectTask(
                    projectId,
                    to,
                    { dependsOnTaskIds: deps },
                    { silent: true }
                );
            } catch (error) {
                patchLocalProjectTaskDepends(runtime, projectId, to, deps);
            }
        }

        function detachProjectTaskGraphPanWindowListeners() {
            const listeners = projectTaskGraphPanWindowListeners;
            if (!listeners) return;
            if (listeners.onMove) window.removeEventListener('pointermove', listeners.onMove);
            if (listeners.onUp) {
                window.removeEventListener('pointerup', listeners.onUp);
                window.removeEventListener('pointercancel', listeners.onUp);
            }
            if (listeners.onMouseMove) window.removeEventListener('mousemove', listeners.onMouseMove);
            if (listeners.onMouseUp) window.removeEventListener('mouseup', listeners.onMouseUp);
            projectTaskGraphPanWindowListeners = null;
        }

        function attachProjectTaskGraphPanWindowListeners(options = {}) {
            detachProjectTaskGraphPanWindowListeners();
            const { pointerId, onMove, onEnd, mouse = false } = options;
            if (mouse) {
                const onMouseUp = (event) => {
                    if (event.button !== 2 && event.button !== 1) return;
                    onEnd(event);
                };
                projectTaskGraphPanWindowListeners = { onMouseMove: onMove, onMouseUp, mouse: true };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onMouseUp);
                return;
            }
            const onUp = (event) => {
                if (pointerId != null && event.pointerId != null && event.pointerId !== pointerId) return;
                onEnd(event);
            };
            projectTaskGraphPanWindowListeners = { onMove, onUp, pointerId };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
        }

        function isProjectTaskGraphPanButton(event) {
            return event.button === 2 || event.button === 1;
        }

        function closeProjectTaskGraphContextMenu() {
            document.querySelectorAll('[data-project-task-graph-context-menu]').forEach((el) => el.remove());
        }

        function openProjectTaskGraphContextMenu(clientX, clientY, { projectId = '', taskId = '' } = {}) {
            closeProjectTaskGraphContextMenu();
            const pid = text(projectId);
            const tid = text(taskId);
            if (!pid || !tid) return;
            const menu = document.createElement('div');
            menu.className = 'sptg-context-menu social-neo-menu';
            menu.setAttribute('data-project-task-graph-context-menu', '1');
            menu.setAttribute('data-lux-transparency-exempt', '1');
            menu.setAttribute('role', 'menu');
            menu.innerHTML = `
                <div class="sptg-context-menu-label">Task actions</div>
                <button type="button" class="sptg-context-menu-item" role="menuitem" data-sptg-menu-action="risks" data-project-id="${escape(pid)}" data-task-id="${escape(tid)}">
                    <span class="sptg-context-menu-icon is-risk"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i></span>
                    <span class="sptg-context-menu-copy">
                        <strong>Risks</strong>
                        <em>Register threats for this task</em>
                    </span>
                </button>
                <button type="button" class="sptg-context-menu-item" role="menuitem" data-sptg-menu-action="detail" data-project-id="${escape(pid)}" data-task-id="${escape(tid)}">
                    <span class="sptg-context-menu-icon"><i class="fas fa-list-check" aria-hidden="true"></i></span>
                    <span class="sptg-context-menu-copy">
                        <strong>Open task</strong>
                        <em>View details and checklist</em>
                    </span>
                </button>
            `;
            const pad = 10;
            const left = Math.max(pad, Math.min(clientX, window.innerWidth - 240));
            const top = Math.max(pad, Math.min(clientY, window.innerHeight - 160));
            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;
            // Must live inside overlay portal so social interaction routing can see it,
            // and we also bind direct handlers (data-action on body is ignored).
            const mount = document.getElementById('social-neo-overlay-portal')
                || document.getElementById('lux-glass-dialog-region')
                || document.body;
            mount.appendChild(menu);

            const runMenuAction = (action, projectIdValue, taskIdValue) => {
                closeProjectTaskGraphContextMenu();
                if (action === 'risks') {
                    openProjectRiskForTask(projectIdValue, taskIdValue);
                    return;
                }
                if (action === 'detail') {
                    openDialog('project-task-detail', {
                        projectId: text(projectIdValue),
                        taskId: text(taskIdValue)
                    });
                }
            };

            menu.addEventListener('click', (event) => {
                const item = event.target.closest('[data-sptg-menu-action]');
                if (!item || !menu.contains(item)) return;
                event.preventDefault();
                event.stopPropagation();
                runMenuAction(
                    text(item.getAttribute('data-sptg-menu-action')),
                    item.getAttribute('data-project-id'),
                    item.getAttribute('data-task-id')
                );
            });

            const dismiss = (event) => {
                if (event?.type === 'keydown' && event.key !== 'Escape') return;
                if (event?.type === 'pointerdown' && menu.contains(event.target)) return;
                closeProjectTaskGraphContextMenu();
                window.removeEventListener('pointerdown', dismiss, true);
                window.removeEventListener('keydown', dismiss, true);
                window.removeEventListener('scroll', dismiss, true);
            };
            window.setTimeout(() => {
                window.addEventListener('pointerdown', dismiss, true);
                window.addEventListener('keydown', dismiss, true);
                window.addEventListener('scroll', dismiss, true);
            }, 0);
        }

        function bindProjectTaskGraphInteractions(stageOrHost) {
            const stage = stageOrHost?.matches?.('[data-project-task-graph-stage]')
                ? stageOrHost
                : stageOrHost?.querySelector?.('[data-project-task-graph-stage]');
            const svg = stage?.querySelector('[data-project-task-graph-svg]');
            if (!stage || !svg) return;
            detachProjectTaskGraphPanWindowListeners();
            if (projectTaskGraphDragAbort) {
                projectTaskGraphDragAbort.abort();
                projectTaskGraphDragAbort = null;
            }
            projectTaskGraphDragAbort = new AbortController();
            const { signal } = projectTaskGraphDragAbort;
            let dragState = null;
            let panState = null;
            let portLinkState = null;
            const graphMode = () => normalizeProjectTaskGraphMode(state().ui?.projectTaskGraphMode || 'browse');
            const setPortLinkTarget = (portEl) => {
                svg.querySelectorAll('.social-project-task-graph-link-handle.is-drop-target, .social-project-task-graph-svg-port.is-drop-target').forEach((entry) => entry.classList.remove('is-drop-target'));
                portEl?.classList.add('is-drop-target');
                svg.querySelectorAll('.social-project-task-graph-node-g.is-link-target').forEach((entry) => entry.classList.remove('is-link-target'));
                const node = portEl?.closest?.('.social-project-task-graph-node-g');
                if (node) node.classList.add('is-link-target');
            };
            const clearPortLinkTarget = () => {
                svg.querySelectorAll('.social-project-task-graph-link-handle.is-drop-target, .social-project-task-graph-svg-port.is-drop-target').forEach((entry) => entry.classList.remove('is-drop-target'));
                svg.querySelectorAll('.social-project-task-graph-node-g.is-link-target').forEach((entry) => entry.classList.remove('is-link-target'));
            };
            const endPan = (event) => {
                if (!panState) return;
                detachProjectTaskGraphPanWindowListeners();
                const {
                    inner,
                    canvas,
                    captureEl,
                    moved,
                    originPanX,
                    originPanY,
                    startX,
                    startY,
                    pointerId,
                    isMouse,
                    zoom,
                    backdrop
                } = panState;
                if (moved) {
                    if (panState.scrollPan) {
                        const pan = readProjectTaskGraphPanFromScroll(canvas);
                        state().ui.projectTaskGraphPan = { x: pan.x, y: pan.y };
                        canvas.setAttribute('data-pan-x', String(pan.x));
                        canvas.setAttribute('data-pan-y', String(pan.y));
                    } else {
                        const panX = Math.round(originPanX + (event.clientX - startX));
                        const panY = Math.round(originPanY + (event.clientY - startY));
                        applyProjectTaskGraphCanvasTransform(canvas, inner, panX, panY, zoom);
                    }
                    event?.preventDefault?.();
                    event?.stopPropagation?.();
                    stage.dataset.kiuPanned = '1';
                    persistProjectTaskGraphView(state());
                }
                if (!isMouse && pointerId != null) {
                    try { captureEl?.releasePointerCapture?.(pointerId); } catch (error) {}
                }
                stage.classList.remove('is-panning');
                backdrop?.classList.remove('is-panning');
                setProjectTaskGraphInteracting(stage, false);
                if (!panState.scrollPan) applyProjectTaskGraphZoom(state());
                panState = null;
            };
            const movePan = (event) => {
                if (!panState) return;
                if (!panState.isMouse) {
                    if (event.pointerId != null && panState.pointerId != null && event.pointerId !== panState.pointerId) return;
                } else if (event.buttons !== undefined && (event.buttons & 2) === 0 && (event.buttons & 4) === 0) {
                    endPan(event);
                    return;
                }
                if (Math.hypot(event.clientX - panState.startX, event.clientY - panState.startY) > 3) panState.moved = true;
                if (!panState.moved) return;
                event.preventDefault();
                if (panState.scrollPan) {
                    panState.canvas.scrollLeft = panState.originScrollLeft - (event.clientX - panState.startX);
                    panState.canvas.scrollTop = panState.originScrollTop - (event.clientY - panState.startY);
                    const pan = readProjectTaskGraphPanFromScroll(panState.canvas);
                    panState.canvas.setAttribute('data-pan-x', String(pan.x));
                    panState.canvas.setAttribute('data-pan-y', String(pan.y));
                    return;
                }
                const panX = Math.round(panState.originPanX + (event.clientX - panState.startX));
                const panY = Math.round(panState.originPanY + (event.clientY - panState.startY));
                applyProjectTaskGraphCanvasTransform(panState.canvas, panState.inner, panX, panY, panState.zoom, { syncState: false });
            };
            const startPan = (event) => {
                if (panState || portLinkState || dragState) return;
                const canvas = stage.querySelector('[data-project-task-graph-canvas]');
                const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
                if (!inner || !canvas) return;
                const isMouse = event.type === 'mousedown' || event.pointerType === 'mouse';
                if (!isMouse) {
                    event.preventDefault();
                }
                const pan = readProjectTaskGraphPan(state());
                const backdrop = resolveProjectTaskGraphPanBackdrop(stage);
                const scrollPan = isProjectTaskGraphScrollPanCanvas(canvas);
                const layoutSize = scrollPan ? readProjectTaskGraphLayoutSize(canvas) : { width: 0, height: 0 };
                panState = {
                    inner,
                    canvas,
                    captureEl: canvas,
                    backdrop,
                    scrollPan,
                    layoutWidth: layoutSize.width,
                    layoutHeight: layoutSize.height,
                    zoom: Number(canvas.getAttribute('data-zoom')) || 1,
                    pointerId: isMouse ? null : event.pointerId,
                    isMouse,
                    startX: event.clientX,
                    startY: event.clientY,
                    originPanX: pan.x,
                    originPanY: pan.y,
                    originScrollLeft: scrollPan ? canvas.scrollLeft : 0,
                    originScrollTop: scrollPan ? canvas.scrollTop : 0,
                    moved: false
                };
                setProjectTaskGraphInteracting(stage, true);
                stage.classList.add('is-panning');
                backdrop?.classList.add('is-panning');
                if (isMouse) {
                    attachProjectTaskGraphPanWindowListeners({ mouse: true, onMove: movePan, onEnd: endPan });
                    return;
                }
                try { canvas.setPointerCapture(event.pointerId); } catch (error) {}
                attachProjectTaskGraphPanWindowListeners({ pointerId: event.pointerId, onMove: movePan, onEnd: endPan });
            };
            const onPointerDown = (event) => {
                if (isProjectTaskGraphPanButton(event)) {
                    // RMB on a task card opens the context menu — do not pan.
                    if (event.button === 2) {
                        const onNode = resolveProjectTaskGraphNodeFromTarget(event.target, svg);
                        if (onNode) return;
                    }
                    startPan(event);
                    return;
                }
                if (event.button !== 0) return;
                if (event.target.closest('.social-project-task-graph-edge-unlink, .social-project-task-graph-edge-hit')) return;
                // Any magnetic port can start a wire (task or package). SVG ports on groups are reliable.
                const outPort = event.target.closest('[data-graph-link-port]');
                const portHost = outPort?.closest?.('.social-project-task-graph-node-g');
                if (outPort && portHost && svg.contains(portHost)) {
                    const origin = readProjectTaskGraphPortCenter(outPort);
                    if (!origin?.taskId) return;
                    event.preventDefault();
                    event.stopPropagation();
                    portLinkState = {
                        port: outPort,
                        pointerId: event.pointerId,
                        origin,
                        moved: false,
                        startX: event.clientX,
                        startY: event.clientY
                    };
                    setProjectTaskGraphInteracting(stage, true);
                    stage.classList.add('is-port-linking');
                    outPort.classList.add('is-linking');
                    // Package wires use white rubber; tasks keep status color.
                    const rubberColor = isProjectTaskGraphGroupId(origin.taskId)
                        ? '#ffffff'
                        : projectTaskGraphStatusEdgeColor(text(portHost.getAttribute('data-status') || 'todo') || 'todo');
                    portLinkState.rubberColor = rubberColor;
                    updateProjectTaskGraphLinkPreview(svg, origin.x, origin.y, origin.x, origin.y, rubberColor);
                    try { stage.setPointerCapture(event.pointerId); } catch (error) {}
                    return;
                }
                const node = resolveProjectTaskGraphNodeFromTarget(event.target, svg, { draggableOnly: true });
                if (!node) return;
                // Never start card drag from a wire port (ports handle linking).
                if (event.target.closest('[data-graph-link-port]')) return;
                // Let inner buttons (group rename/delete/remove-member) receive their click.
                if (event.target.closest('button[data-action]')) return;
                event.preventDefault();
                setProjectTaskGraphInteracting(stage, true);
                dragState = {
                    node,
                    taskId: text(node.getAttribute('data-task-id')),
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    moved: false,
                    originX: Number(node.getAttribute('data-cx')),
                    originY: Number(node.getAttribute('data-cy')),
                    scale: Number(stage.querySelector('[data-project-task-graph-canvas]')?.getAttribute('data-zoom')) || 1
                };
                node.classList.add('is-dragging');
                try { node.setPointerCapture(event.pointerId); } catch (error) {}
            };
            const onPointerMove = (event) => {
                if (portLinkState && event.pointerId === portLinkState.pointerId) {
                    if (Math.hypot(event.clientX - portLinkState.startX, event.clientY - portLinkState.startY) > 3) portLinkState.moved = true;
                    event.preventDefault();
                    const coords = clientToProjectTaskGraphCoords(stage, event.clientX, event.clientY);
                    const { origin } = portLinkState;
                    updateProjectTaskGraphLinkPreview(svg, origin.x, origin.y, coords.x, coords.y, portLinkState.rubberColor || '');
                    const drop = findProjectTaskGraphLinkDropTarget(svg, event.clientX, event.clientY, portLinkState.origin.taskId);
                    svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target, .social-project-task-graph-node-g.is-link-target').forEach((g) => {
                        g.classList.remove('is-drop-target', 'is-link-target');
                    });
                    if (drop?.taskId) {
                        const targetNode = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${drop.taskId}"]`);
                        targetNode?.classList.add('is-link-target');
                        if (drop.groupId) targetNode?.classList.add('is-drop-target');
                        const side = text(drop?.side || 'w') || 'w';
                        const inHandle = targetNode
                            ? (targetNode.querySelector(`[data-graph-link-port="${side}"]`)
                                || targetNode.querySelector('[data-graph-link-port]'))
                            : null;
                        setPortLinkTarget(inHandle);
                        return;
                    }
                    setPortLinkTarget(null);
                    return;
                }
                if (!dragState || event.pointerId !== dragState.pointerId) return;
                if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 4) dragState.moved = true;
                if (!dragState.moved) return;
                event.preventDefault();
                const dx = (event.clientX - dragState.startX) / dragState.scale;
                const dy = (event.clientY - dragState.startY) / dragState.scale;
                const w = Number(dragState.node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W;
                const h = Number(dragState.node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H;
                const nx = Math.round(dragState.originX + dx);
                const ny = Math.round(dragState.originY + dy);
                dragState.node.setAttribute('transform', `translate(${nx - Math.round(w / 2)},${ny - Math.round(h / 2)})`);
                dragState.node.setAttribute('data-cx', String(nx));
                dragState.node.setAttribute('data-cy', String(ny));
                scheduleProjectTaskGraphEdgeRefresh(svg);
                // Highlight package under pointer for membership absorb.
                svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target').forEach((g) => {
                    g.classList.remove('is-drop-target');
                });
                const membershipDrop = findProjectTaskGraphMembershipDropGroup(
                    svg,
                    event.clientX,
                    event.clientY,
                    dragState.taskId
                );
                if (membershipDrop?.groupId) {
                    svg.querySelector(
                        `.social-project-task-graph-group-node[data-group-id="${membershipDrop.groupId}"]`
                    )?.classList.add('is-drop-target');
                }
            };
            const onPointerUp = async (event) => {
                if (panState && !panState.isMouse && event.pointerId === panState.pointerId) {
                    endPan(event);
                    return;
                }
                if (portLinkState && event.pointerId === portLinkState.pointerId) {
                    const { origin, port, moved } = portLinkState;
                    clearProjectTaskGraphLinkPreview(svg);
                    clearPortLinkTarget();
                    svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target, .social-project-task-graph-node-g.is-link-target').forEach((g) => {
                        g.classList.remove('is-drop-target', 'is-link-target');
                    });
                    stage.classList.remove('is-port-linking');
                    port.classList.remove('is-linking');
                    setProjectTaskGraphInteracting(stage, false);
                    try { stage.releasePointerCapture(event.pointerId); } catch (error) {}
                    const target = moved
                        ? findProjectTaskGraphLinkDropTarget(svg, event.clientX, event.clientY, origin.taskId)
                        : null;
                    portLinkState = null;
                    // Port-wire always creates a dependency (task or package endpoints). Membership is card-drop only.
                    // Direction follows port roles (out→in), not drag order alone.
                    if (moved && target?.taskId && target.taskId !== origin.taskId) {
                        event.preventDefault();
                        event.stopPropagation();
                        const ends = resolveProjectTaskGraphWireEndpoints(origin, target);
                        if (!ends?.from || !ends?.to) return;
                        await withBusy(async () => {
                            await addProjectGraphDependency(origin.projectId, ends.to, ends.from);
                            const runtime = state();
                            runtime.ui.projectTaskGraphSelectedId = ends.to;
                            runtime.ui.projectTaskGraphLinkFrom = '';
                            runtime.ui.projectTaskGraphMode = 'browse';
                            notifyProjectTaskGraphSurfaceChanged(origin.projectId);
                            // Edges group only — nodes stay mounted.
                            if (!syncProjectTaskGraphEdgesOnly(runtime)) {
                                refreshProjectTaskGraphDialog(['canvas']);
                            }
                            refreshProjectTaskGraphDialog(['selection', 'chrome']);
                        });
                    }
                    return;
                }
                if (!dragState || event.pointerId !== dragState.pointerId) return;
                const { node, taskId, moved } = dragState;
                node.classList.remove('is-dragging');
                setProjectTaskGraphInteracting(stage, false);
                svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target').forEach((g) => {
                    g.classList.remove('is-drop-target');
                });
                let absorbedIntoGroup = false;
                if (moved) {
                    event.preventDefault();
                    event.stopPropagation();
                    node.dataset.kiuDragged = '1';
                    const runtime = state();
                    const projectId = text(node.getAttribute('data-project-id') || activeDialog()?.projectId || runtime.ui?.activeProjectId || '');
                    const positions = { ...getProjectTaskGraphPositions(runtime, projectId) };
                    positions[taskId] = {
                        x: Number(node.getAttribute('data-cx')),
                        y: Number(node.getAttribute('data-cy'))
                    };
                    setProjectTaskGraphPositions(runtime, projectId, positions);
                    // Card/package drop onto package body → membership (ports are for order arrows only).
                    // Nested packages allowed; cycle guard lives in toggleProjectTaskGraphGroupMember.
                    const dropGroup = findProjectTaskGraphMembershipDropGroup(svg, event.clientX, event.clientY, taskId);
                    if (dropGroup?.groupId && text(dropGroup.groupId) !== text(taskId)) {
                        toggleProjectTaskGraphGroupMember(runtime, projectId, dropGroup.groupId, taskId, true);
                        if (!isProjectTaskGraphGroupId(taskId)) {
                            ensureProjectTaskGraphPositionForTask(runtime, projectId, taskId, {
                                preferNearIds: [dropGroup.groupId]
                            });
                        }
                        absorbedIntoGroup = true;
                    }
                } else {
                    // Select on pointerup — click often never fires after pointerdown preventDefault.
                    // Groups too: connect mode uses them as parent/child dependency endpoints.
                    const runtime = state();
                    const projectId = text(node.getAttribute('data-project-id') || activeDialog()?.projectId || runtime.ui?.activeProjectId || '');
                    node.dataset.kiuGraphSelected = '1';
                    void selectProjectTaskGraphNode(projectId, taskId);
                }
                try { node.releasePointerCapture(event.pointerId); } catch (error) {}
                dragState = null;
                if (absorbedIntoGroup) {
                    refreshProjectTaskGraphDialog(['canvas', 'chrome']);
                }
            };
            const onDoubleClick = (event) => {
                if (event.target.closest('.social-project-task-graph-node-g, .social-project-task-graph-quick-create, .social-project-task-graph-inspector')) return;
                const runtime = state();
                const dialog = activeDialog();
                if (text(dialog?.type) !== 'project-task-graph') return;
                const project = resolveActiveSocialProject(runtime, dialog?.projectId);
                if (!project?.viewerCanContribute) return;
                const stageRect = stage.getBoundingClientRect();
                const coords = clientToProjectTaskGraphCoords(stage, event.clientX, event.clientY);
                runtime.ui.projectTaskGraphQuickCreate = {
                    open: true,
                    x: Math.round(event.clientX - stageRect.left),
                    y: Math.round(event.clientY - stageRect.top),
                    graphX: coords.x,
                    graphY: coords.y,
                    title: '',
                    status: 'todo'
                };
                refreshProjectTaskGraphDialog(['quickCreate']);
            };
            const onStageClick = (event) => {
                if (stage.dataset.kiuPanned) {
                    delete stage.dataset.kiuPanned;
                    return;
                }
                if (event.target.closest('.social-project-task-graph-quick-create, .social-project-task-graph-inspector, [data-action]')) return;
                if (event.target.closest('.social-project-task-graph-node-g')) return;
                const runtime = state();
                runtime.ui.projectTaskGraphLinkFrom = '';
                runtime.ui.projectTaskGraphMode = 'browse';
                if (runtime.ui.projectTaskGraphQuickCreate?.open) {
                    runtime.ui.projectTaskGraphQuickCreate = { open: false };
                }
                refreshProjectTaskGraphDialog(['quickCreate', 'chrome']);
            };
            stage.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                const node = resolveProjectTaskGraphNodeFromTarget(event.target, svg);
                if (!node) {
                    closeProjectTaskGraphContextMenu();
                    return;
                }
                const projectId = text(node.getAttribute('data-project-id') || '');
                const taskId = text(node.getAttribute('data-task-id') || '');
                if (!projectId || !taskId) return;
                openProjectTaskGraphContextMenu(event.clientX, event.clientY, { projectId, taskId });
            }, { signal });
            stage.addEventListener('wheel', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (panState || dragState || portLinkState) return;
                const canvas = stage.querySelector('[data-project-task-graph-canvas]');
                const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
                if (!canvas || !inner) return;
                const oldZoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || 1);
                const factor = event.deltaY > 0 ? (1 / 1.08) : 1.08;
                const newZoom = clampProjectTaskGraphZoom(oldZoom * factor);
                if (Math.abs(newZoom - oldZoom) < 0.001) return;
                if (isProjectTaskGraphScrollPanCanvas(canvas)) {
                    const rect = canvas.getBoundingClientRect();
                    const vx = event.clientX - rect.left;
                    const vy = event.clientY - rect.top;
                    const pan = readProjectTaskGraphPanFromScroll(canvas);
                    const layoutX = (pan.x + vx) / oldZoom;
                    const layoutY = (pan.y + vy) / oldZoom;
                    const { width: lw, height: lh } = readProjectTaskGraphLayoutSize(canvas);
                    const slack = resolveProjectTaskGraphPanSlack(Math.max(lw * newZoom, lh * newZoom));
                    const nextPan = clampProjectTaskGraphPan(
                        layoutX * newZoom - vx,
                        layoutY * newZoom - vy,
                        slack
                    );
                    state().ui.projectTaskGraphZoom = newZoom;
                    state().ui.projectTaskGraphPan = { x: nextPan.x, y: nextPan.y };
                    applyProjectTaskGraphCanvasTransform(canvas, inner, nextPan.x, nextPan.y, newZoom);
                } else {
                    state().ui.projectTaskGraphZoom = newZoom;
                    applyProjectTaskGraphZoom(state());
                }
                persistProjectTaskGraphView(state());
                const label = getProjectTaskGraphHost()?.querySelector('.social-project-task-graph-zoom-label');
                if (label) label.textContent = `${Math.round(newZoom * 100)}%`;
            }, { passive: false, signal });
            stage.addEventListener('pointerdown', onPointerDown, { signal, capture: true });
            stage.addEventListener('mousedown', (event) => {
                if (!isProjectTaskGraphPanButton(event) || panState) return;
                startPan(event);
            }, { signal, capture: true });
            stage.addEventListener('pointermove', onPointerMove, { signal });
            stage.addEventListener('pointerup', onPointerUp, { signal });
            stage.addEventListener('pointercancel', onPointerUp, { signal });
            stage.addEventListener('dblclick', onDoubleClick, { signal });
            stage.addEventListener('click', onStageClick, { signal });
        }

        function bindProjectTaskGraphDrag() {
            const host = getProjectTaskGraphHost();
            const stage = host?.querySelector('[data-project-task-graph-stage]');
            if (!stage?.querySelector('[data-project-task-graph-svg]')) return;
            bindProjectTaskGraphInteractions(stage);
            initProjectTaskGraphScrollPan(stage, { force: true });
            window.requestAnimationFrame(() => initProjectTaskGraphScrollPan(stage, { force: true }));
        }

        function bindProjectTaskGraphResizeObserver() {
            if (projectTaskGraphResizeObserver) {
                projectTaskGraphResizeObserver.disconnect();
                projectTaskGraphResizeObserver = null;
            }
            const host = getProjectTaskGraphHost();
            const stage = host?.querySelector('[data-project-task-graph-stage="1"]');
            if (!stage || text(activeDialog()?.type || '') !== 'project-task-graph' || typeof ResizeObserver === 'undefined') return;
            let resizeTimer = null;
            projectTaskGraphResizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                const { width, height } = entry.contentRect;
                const sizeKey = `${Math.round(width)}x${Math.round(height)}`;
                if (!width || !height || sizeKey === projectTaskGraphLastStageSizeKey) return;
                projectTaskGraphLastStageSizeKey = sizeKey;
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (text(activeDialog()?.type || '') !== 'project-task-graph') return;
                    const heightChanged = measureProjectTaskGraphCardHeights(host);
                    if (heightChanged) syncProjectTaskGraphEdgesOnly(state());
                    // Keep the user's remembered zoom/pan; only reflow the canvas for the new stage size.
                    refreshProjectTaskGraphDialog(['canvas', 'zoom']);
                }, 150);
            });
            projectTaskGraphResizeObserver.observe(stage);
        }

        function isProjectTaskGraphDialogOpen(runtime = state()) {
            return text(activeDialog()?.type || '') === 'project-task-graph'
                || text(runtime?.ui?.projectTaskGraphStackAnchor?.type || '') === 'project-task-graph';
        }

        /** Soft signal for overview map preview — do not wipe all project tab panes. */

        function markProjectTaskGraphPreviewStale(projectId = '') {
            const runtime = state();
            if (!runtime?.ui) return;
            runtime.ui.projectTaskGraphPreviewStale = true;
            if (isProjectTaskGraphDialogOpen(runtime)) {
                notifyProjectTaskGraphSurfaceChanged(projectId);
                return;
            }
            // Drop cached overview (and other preview hosts) so next visit rebuilds map preview.
            // Do not clear the active tasks pane here — caller refreshes it surgically.
            const id = text(projectId || runtime.ui.activeProjectId || '');
            if (!id) return;
            clearProjectTabPaneCacheKey(id, 'overview');
        }

        /**
         * Rebuild only the Tasks tab pane inside the project shell (no center/hero remount).
         * Prevents Work Desk flicker on expand/status/deps/focus clicks.
         */

        function notifyProjectTaskGraphSurfaceChanged(projectId = '') {
            const runtime = state();
            if (!runtime?.ui) return;
            const id = text(
                projectId
                || runtime.ui.activeProjectId
                || activeDialog()?.projectId
                || ''
            );
            clearProjectTabPaneCache(id);
            const graphOpen = text(activeDialog()?.type || '') === 'project-task-graph'
                || text(runtime.ui?.projectTaskGraphStackAnchor?.type || '') === 'project-task-graph';
            if (graphOpen) {
                runtime.ui.projectTaskGraphPreviewStale = true;
                return;
            }
            rebuildActiveProjectTabPaneIfPreviewHost(id);
        }

        return {
            addProjectGraphDependency,
            addProjectTaskDependency,
            applyProjectTaskGraphCanvasTransform,
            applyProjectTaskGraphCheckpointSnapshot,
            applyProjectTaskGraphResetView,
            applyProjectTaskGraphScrollZoom,
            applyProjectTaskGraphZoom,
            attachProjectTaskGraphPanWindowListeners,
            bindProjectTaskGraphDrag,
            bindProjectTaskGraphInteractions,
            bindProjectTaskGraphResizeObserver,
            buildProjectTaskGraphLayoutForView,
            centerProjectTaskGraphScrollPan,
            clearProjectTaskGraphLinkPreview,
            clientToProjectTaskGraphCoords,
            closeProjectTaskGraphContextMenu,
            collectProjectTaskGraphCheckpoint,
            collectProjectTaskGraphGroupBoxes,
            createProjectTaskGraphGroup,
            deleteProjectTaskGraphCheckpoint,
            deleteProjectTaskGraphGroup,
            detachProjectTaskGraphPanWindowListeners,
            ensureProjectTaskGraphLinkPreview,
            ensureProjectTaskGraphPositionForTask,
            ensureProjectTaskGraphPositionsLoaded,
            ensureProjectTaskGraphScrollSurface,
            findFreeProjectTaskGraphPosition,
            findProjectTaskGraphLinkDropTarget,
            findProjectTaskGraphMembershipDropGroup,
            flushProjectTaskGraphSync,
            getProjectTaskGraphCheckpointById,
            getProjectTaskGraphGroups,
            getProjectTaskGraphHost,
            getProjectTaskGraphPositions,
            getProjectTaskGraphStackAnchorDialog,
            initProjectTaskGraphScrollPan,
            isProjectTaskGraphDialogOpen,
            isProjectTaskGraphPanButton,
            isProjectTaskGraphScrollPanCanvas,
            isProjectTaskGraphStackActive,
            loadProjectTaskGraphPositions,
            loadProjectTaskGraphView,
            markProjectTaskGraphPreviewStale,
            measureProjectTaskGraphCardHeights,
            notifyProjectTaskGraphSurfaceChanged,
            openProjectTaskGraphContextMenu,
            patchLocalProjectTaskDepends,
            patchProjectTaskGraphLinkCountLabel,
            patchRemoveProjectTaskGraphEdge,
            persistProjectTaskGraphView,
            projectTaskGraphStackedBackdropClass,
            pulseProjectTaskGraphCheckpointButton,
            queueProjectTaskGraphSync,
            readProjectTaskGraphCheckpoint,
            readProjectTaskGraphCheckpoints,
            readProjectTaskGraphLayoutSize,
            readProjectTaskGraphLivePositions,
            readProjectTaskGraphPanFromScroll,
            readProjectTaskGraphPanSlackFromCanvas,
            readProjectTaskGraphPortCenter,
            readProjectTaskGraphScrollSurface,
            refreshProjectTaskGraphDialog,
            refreshProjectTaskGraphEdgeLines,
            removeProjectGraphDependency,
            removeProjectTaskDependency,
            resolveProjectTaskGraphLinkPreviewHost,
            resolveProjectTaskGraphNodeFromTarget,
            resolveProjectTaskGraphPanBackdrop,
            restoreProjectTaskGraphCheckpoint,
            saveProjectTaskGraphCheckpoint,
            saveProjectTaskGraphPositions,
            saveProjectTaskGraphView,
            scheduleProjectTaskGraphEdgeRefresh,
            scrubDeletedTaskFromProjectTaskGraphGroups,
            seedProjectTaskGraphFromProject,
            selectProjectTaskGraphNode,
            setProjectTaskGraphGroups,
            setProjectTaskGraphInteracting,
            setProjectTaskGraphPositions,
            shouldRenderProjectTaskGraphStack,
            syncProjectTaskGraphCanvas,
            syncProjectTaskGraphChrome,
            syncProjectTaskGraphEdgesOnly,
            syncProjectTaskGraphGroupFocus,
            syncProjectTaskGraphQuickCreate,
            syncProjectTaskGraphSelection,
            syncProjectTaskGraphSidebar,
            toggleProjectTaskGraphGroupMember,
            trySyncProjectTaskGraphStackDialog,
            updateProjectTaskGraphGroup,
            updateProjectTaskGraphLinkPreview,
            wrapProjectTaskGraphStack,
            writeProjectTaskGraphCheckpoints
        };
    }

    window.createKiuSocialWorkspaceGraphRuntimeApi = createKiuSocialWorkspaceGraphRuntimeApi;
})();
