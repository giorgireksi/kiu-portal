/* Social workspace tab/pane refresh + desk toolbar sync.
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceTabRuntimeApi(deps).
 */
(function init() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_TAB_RUNTIME_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_TAB_RUNTIME_LOADED = true;

    function createKiuSocialWorkspaceTabRuntimeApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('createKiuSocialWorkspaceTabRuntimeApi deps required');
        const {
            buildSocialRenderSignature,
            computePertExpected,
            computeTaskMatrixBucket,
            computeTaskMatrixScore,
            enhanceUniversalPickers,
            ensureSocialCenterScrollBounds,
            escape,
            formatTaskTime,
            getSocialCenterMaxScroll,
            getSocialCenterScroller,
            normalizeTaskTime,
            normalizeTaskTimeUnit,
            renderProjectWorkspaceTabPanel,
            renderSocialPageNow,
            root,
            scrollSocialCenterTo,
            state,
            text,
            when
        } = deps;

        function syncProjectTaskMatrixPreview(form) {
            if (!form) return;
            const matrixPreview = form.querySelector('.social-project-task-matrix-preview');
            if (matrixPreview) {
                const score = computeTaskMatrixScore(form.projectTaskImpactScore?.value, form.projectTaskEffortScore?.value);
                const bucket = computeTaskMatrixBucket(score);
                const label = bucket.charAt(0).toUpperCase() + bucket.slice(1);
                matrixPreview.textContent = `Score ${score} · ${label}`;
            }
            const pertPreview = form.querySelector('.social-project-task-pert-preview');
            if (pertPreview) {
                const o = normalizeTaskTime(form.projectTaskTimeOptimistic?.value);
                const m = normalizeTaskTime(form.projectTaskTimeMostLikely?.value);
                const p = normalizeTaskTime(form.projectTaskTimePessimistic?.value);
                const unit = normalizeTaskTimeUnit(form.projectTaskTimeUnit?.value);
                const expected = computePertExpected(o, m, p);
                if (expected > 0 && o > 0 && m > 0 && p > 0) {
                    pertPreview.textContent = `PERT ${formatTaskTime(expected, unit)} (O=${o} · M=${m} · P=${p})`;
                } else if (m > 0) {
                    pertPreview.textContent = `Most likely ${formatTaskTime(m, unit)} — add O and P for PERT`;
                } else {
                    pertPreview.textContent = 'Three-point estimate drives the critical path';
                }
            }
        }

        function projectTabPaneCacheKey(projectId, tabId) {
            return `${text(projectId)}:${text(tabId || 'overview') || 'overview'}`;
        }

        function syncProjectTabPills(pillRow, activeTab) {
            if (!pillRow) return;
            pillRow.querySelectorAll('.social-project-tab-pill[data-project-tab]').forEach((pill) => {
                const tabId = text(pill.getAttribute('data-project-tab'));
                const isActive = tabId === activeTab;
                pill.classList.toggle('is-active', isActive);
                pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
                pill.setAttribute('tabindex', isActive ? '0' : '-1');
            });
        }

        function clearProjectTabPaneCacheKey(projectId, tabId) {
            const runtime = state();
            const cache = runtime.ui?.__projectTabPaneCache;
            if (!cache || typeof cache !== 'object') return;
            const key = projectTabPaneCacheKey(projectId, tabId);
            delete cache[key];
        }

        function clearProjectTabPaneCache(projectId = '') {
            const runtime = state();
            const cache = runtime.ui?.__projectTabPaneCache;
            if (!cache || typeof cache !== 'object') return;
            const normalized = text(projectId);
            if (!normalized) {
                runtime.ui.__projectTabPaneCache = {};
                return;
            }
            Object.keys(cache).forEach((key) => {
                if (key.startsWith(`${normalized}:`)) delete cache[key];
            });
        }

        function deskTasksSurfaceReady(host = root(), runtime = state()) {
            if (!host) return null;
            const panel = text(runtime?.ui?.activePanel || '');
            const projectId = text(runtime?.ui?.activeProjectId || '');
            const projectTab = text(runtime?.ui?.projectTab || '') || 'overview';
            const onProjectSurface = panel === 'workspace' || panel === 'projects';
            const tabPanel = host.querySelector('#social-project-tab-panel');
            if (!onProjectSurface || !projectId || projectTab !== 'tasks' || !tabPanel || typeof renderProjectWorkspaceTabPanel !== 'function') {
                return null;
            }
            return { host, runtime, projectId, tabPanel };
        }

        function syncDeskToolbarFromFreshMarkup(liveRoot, freshRoot) {
            if (!liveRoot || !freshRoot) return;
            // Focus chips only (never hygiene pills — they share data-action/data-focus and corrupted className)
            freshRoot.querySelectorAll('.spt-desk-focus-track .spt-desk-focus-chip[data-action="project-task-focus"]').forEach((btn) => {
                const focus = text(btn.getAttribute('data-focus') || '');
                if (!focus) return;
                const live = liveRoot.querySelector(`.spt-desk-focus-track .spt-desk-focus-chip[data-action="project-task-focus"][data-focus="${CSS.escape(focus)}"]`);
                if (!live) return;
                live.className = btn.className;
                live.setAttribute('aria-selected', btn.getAttribute('aria-selected') || 'false');
                const count = btn.querySelector('span');
                const liveCount = live.querySelector('span');
                if (count && liveCount) liveCount.textContent = count.textContent;
                const label = btn.querySelector('strong');
                const liveLabel = live.querySelector('strong');
                if (label && liveLabel) liveLabel.textContent = label.textContent;
            });
            // Time window chips (same track class; scope to window group)
            freshRoot.querySelectorAll('.spt-desk-window [data-action="project-task-time-window"]').forEach((btn) => {
                const win = text(btn.getAttribute('data-window') || '');
                if (!win) return;
                const live = liveRoot.querySelector(`.spt-desk-window [data-action="project-task-time-window"][data-window="${CSS.escape(win)}"]`);
                if (!live) return;
                live.className = btn.className;
                live.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') || 'false');
            });
            // Compact stats
            const freshStats = freshRoot.querySelector('.social-project-task-stats-inline');
            const liveStats = liveRoot.querySelector('.social-project-task-stats-inline');
            if (freshStats && liveStats) liveStats.innerHTML = freshStats.innerHTML;
            // View toggle pressed state
            freshRoot.querySelectorAll('[data-action="project-task-view"]').forEach((btn) => {
                const view = text(btn.getAttribute('data-view') || '');
                if (!view) return;
                const live = liveRoot.querySelector(`[data-action="project-task-view"][data-view="${CSS.escape(view)}"]`);
                if (!live) return;
                live.className = btn.className;
                live.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') || 'false');
            });
        }

        function getOrCreateProjectTabPane(runtime, projectId, tabId) {
            if (typeof renderProjectWorkspaceTabPanel !== 'function') return null;
            runtime.ui.__projectTabPaneCache = runtime.ui.__projectTabPaneCache || {};
            const key = projectTabPaneCacheKey(projectId, tabId);
            let pane = runtime.ui.__projectTabPaneCache[key];
            if (pane && text(tabId) !== 'chat' && pane.nodeType === Node.ELEMENT_NODE) return pane;
            pane = document.createElement('div');
            pane.className = 'social-project-tab-pane';
            pane.setAttribute('data-project-tab', text(tabId));
            pane.innerHTML = renderProjectWorkspaceTabPanel(tabId);
            runtime.ui.__projectTabPaneCache[key] = pane;
            return pane;
        }

        function refreshProjectTasksTabBody(reason = 'project-task-desk-body') {
            const host = root();
            const surface = deskTasksSurfaceReady(host);
            if (!surface) {
                if (host) host.__kiuForceCenterOnly = true;
                renderSocialPageNow(reason);
                return false;
            }
            const { runtime, projectId, tabPanel } = surface;
            const liveBody = tabPanel.querySelector('[data-task-body-root="1"]');
            if (!liveBody) {
                return refreshProjectTasksTabPane(reason);
            }

            const scrollTop = liveBody.scrollTop || 0;
            const scrollLeft = liveBody.scrollLeft || 0;
            window.__kiuSuppressLuxTransparencyRefresh = true;
            const shell = host.querySelector('.social-projects-shell');
            if (shell) shell.classList.add('is-desk-refreshing');

            // Build fresh markup without attaching a new pane / without wiping cache of live shell node
            let freshHtml = '';
            try {
                freshHtml = renderProjectWorkspaceTabPanel('tasks') || '';
            } catch (error) {
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) shell.classList.remove('is-desk-refreshing');
                return refreshProjectTasksTabPane(reason);
            }
            const temp = document.createElement('div');
            temp.innerHTML = freshHtml;
            const freshBody = temp.querySelector('[data-task-body-root="1"]');
            if (!freshBody) {
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) shell.classList.remove('is-desk-refreshing');
                return refreshProjectTasksTabPane(reason);
            }

            liveBody.innerHTML = freshBody.innerHTML;
            liveBody.setAttribute('data-task-body', freshBody.getAttribute('data-task-body') || 'desk');
            syncDeskToolbarFromFreshMarkup(tabPanel, temp);

            // Keep pane cache in sync with live DOM so later tab switches don't restore stale node
            const cache = runtime.ui.__projectTabPaneCache = runtime.ui.__projectTabPaneCache || {};
            const key = projectTabPaneCacheKey(projectId, 'tasks');
            const livePane = tabPanel.querySelector('.social-project-tab-pane') || tabPanel.firstElementChild;
            if (livePane) cache[key] = livePane;

            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(liveBody); } catch (error) {}
            }

            host.__kiuLastRenderSignature = buildSocialRenderSignature(
                text(runtime?.ui?.activePanel || 'workspace') || 'workspace',
                runtime
            );

            window.requestAnimationFrame(() => {
                liveBody.scrollTop = scrollTop;
                liveBody.scrollLeft = scrollLeft;
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) shell.classList.remove('is-desk-refreshing');
            });
            return true;
        }

        function refreshProjectTasksTabPane(reason = 'project-task-desk') {
            // Prefer body-only when shell already mounted (avoids full pane replace + picker rebind of header).
            const host = root();
            const surface = deskTasksSurfaceReady(host);
            if (surface?.tabPanel?.querySelector('[data-task-body-root="1"]')) {
                return refreshProjectTasksTabBody(reason);
            }

            if (!surface) {
                if (host) host.__kiuForceCenterOnly = true;
                renderSocialPageNow(reason);
                return false;
            }
            const { runtime, projectId, tabPanel } = surface;

            const scrollRoot = tabPanel.querySelector('.social-project-task-shell-body')
                || tabPanel.querySelector('.spt-desk')
                || tabPanel;
            const scrollTop = scrollRoot?.scrollTop || 0;
            const scrollLeft = scrollRoot?.scrollLeft || 0;

            window.__kiuSuppressLuxTransparencyRefresh = true;
            const shell = host.querySelector('.social-projects-shell');
            if (shell) shell.classList.add('is-desk-refreshing');

            clearProjectTabPaneCacheKey(projectId, 'tasks');
            const pane = getOrCreateProjectTabPane(runtime, projectId, 'tasks');
            if (!pane) {
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) shell.classList.remove('is-desk-refreshing');
                host.__kiuForceCenterOnly = true;
                renderSocialPageNow(reason);
                return false;
            }

            tabPanel.setAttribute('data-project-tab', 'tasks');
            tabPanel.replaceChildren(pane);

            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(pane); } catch (error) {}
            }

            host.__kiuLastRenderSignature = buildSocialRenderSignature(
                text(runtime?.ui?.activePanel || 'workspace') || 'workspace',
                runtime
            );

            window.requestAnimationFrame(() => {
                const nextScroll = tabPanel.querySelector('.social-project-task-shell-body')
                    || tabPanel.querySelector('.spt-desk')
                    || tabPanel;
                if (nextScroll) {
                    nextScroll.scrollTop = scrollTop;
                    nextScroll.scrollLeft = scrollLeft;
                }
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) shell.classList.remove('is-desk-refreshing');
            });
            return true;
        }

        function rebuildActiveProjectTabPaneIfPreviewHost(projectId = '') {
            const runtime = state();
            const host = root();
            if (!host || typeof renderProjectWorkspaceTabPanel !== 'function') return false;
            const activeProjectId = text(runtime?.ui?.activeProjectId || '');
            const targetId = text(projectId || activeProjectId);
            if (!targetId || (activeProjectId && activeProjectId !== targetId)) return false;
            const activeTab = text(runtime?.ui?.projectTab || 'overview') || 'overview';
            if (!PROJECT_TABS_WITH_GRAPH_PREVIEW.has(activeTab)) return false;
            const panel = host.querySelector('#social-project-tab-panel');
            if (!panel) return false;
            clearProjectTabPaneCache(targetId);
            const pane = getOrCreateProjectTabPane(runtime, targetId, activeTab);
            if (!pane) return false;
            panel.setAttribute('data-project-tab', activeTab);
            panel.replaceChildren(pane);
            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(pane); } catch (error) {}
            }
            runtime.ui.projectTaskGraphPreviewStale = false;
            return true;
        }

        function patchProjectWorkspaceTab(runtime) {
            const host = root();
            if (!host || typeof renderProjectWorkspaceTabPanel !== 'function') return false;
            const panel = host.querySelector('#social-project-tab-panel');
            const pillRow = host.querySelector('.social-project-tab-row-rich');
            const shell = host.querySelector('.social-projects-shell');
            const activeProjectId = text(runtime?.ui?.activeProjectId || '');
            if (!panel || !pillRow || !activeProjectId) return false;
            const liveProjectId = text(pillRow.querySelector('.social-project-tab-pill')?.getAttribute('data-project-id') || '');
            if (liveProjectId !== activeProjectId) return false;
            const activeTab = text(runtime?.ui?.projectTab || 'overview') || 'overview';
            const currentTab = text(panel.getAttribute('data-project-tab') || '');
            syncProjectTabPills(pillRow, activeTab);
            if (currentTab === activeTab) return true;
            if (shell) {
                shell.classList.add('is-tab-switching');
                shell.classList.add('is-tab-reveal');
            }
            window.__kiuSuppressLuxTransparencyRefresh = true;
            const pane = getOrCreateProjectTabPane(runtime, activeProjectId, activeTab);
            if (!pane) {
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) {
                    shell.classList.remove('is-tab-switching');
                    shell.classList.remove('is-tab-reveal');
                }
                return false;
            }
            panel.setAttribute('data-project-tab', activeTab);
            panel.replaceChildren(pane);
            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(pane); } catch (error) {}
            }
            host.__kiuLastRenderSignature = buildSocialRenderSignature(
                text(runtime?.ui?.activePanel || 'workspace') || 'workspace',
                runtime
            );
            window.requestAnimationFrame(() => {
                window.__kiuSuppressLuxTransparencyRefresh = false;
                if (shell) {
                    shell.classList.remove('is-tab-switching');
                    // keep reveal class until next frame after animation start, then clear
                    window.setTimeout(() => {
                        if (shell) shell.classList.remove('is-tab-reveal');
                    }, 260);
                }
            });
            return true;
        }

        function revealDeskExpandTarget(el) {
            if (!el) return;
            const run = () => {
                const host = root();
                try {
                    if (typeof ensureSocialCenterScrollBounds === 'function') ensureSocialCenterScrollBounds(host);
                } catch (error) {}
                const scroller = typeof getSocialCenterScroller === 'function' ? getSocialCenterScroller(host) : null;
                if (!scroller || !scroller.contains(el)) {
                    try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (error) {}
                    return;
                }
                void scroller.offsetHeight;
                void el.offsetHeight;
                const pad = 16;
                const scrollerRect = scroller.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const elTopAbs = elRect.top - scrollerRect.top + scroller.scrollTop;
                const elBottomAbs = elRect.bottom - scrollerRect.top + scroller.scrollTop;
                const viewH = scroller.clientHeight || 0;
                if (viewH <= 0) return;
                let nextTop = scroller.scrollTop;
                const blockH = elBottomAbs - elTopAbs;
                if (blockH > viewH - pad * 2) {
                    // Taller than viewport: show start of droplist.
                    nextTop = elTopAbs - pad;
                } else {
                    // Fit whole block: fix bottom overflow first, then top.
                    if (elBottomAbs > nextTop + viewH - pad) {
                        nextTop = elBottomAbs - viewH + pad;
                    }
                    if (elTopAbs < nextTop + pad) {
                        nextTop = elTopAbs - pad;
                    }
                }
                nextTop = Math.max(0, nextTop);
                let maxScroll = Math.max(0, (scroller.scrollHeight || 0) - viewH);
                try {
                    const shell = host?.querySelector?.('.social-neo-shell');
                    if (typeof getSocialCenterMaxScroll === 'function') {
                        maxScroll = Math.max(maxScroll, getSocialCenterMaxScroll(scroller, shell) || 0);
                    }
                } catch (error) {}
                nextTop = Math.min(nextTop, maxScroll);
                if (Math.abs(nextTop - scroller.scrollTop) < 2) return;
                if (typeof scrollSocialCenterTo === 'function') {
                    scrollSocialCenterTo(nextTop, 'smooth', host);
                } else {
                    scroller.scrollTop = nextTop;
                }
            };
            // Double-rAF: layout after class toggle (package-body display, tree children).
            requestAnimationFrame(() => requestAnimationFrame(run));
        }

        return {
            syncProjectTaskMatrixPreview,
            projectTabPaneCacheKey,
            syncProjectTabPills,
            clearProjectTabPaneCacheKey,
            clearProjectTabPaneCache,
            deskTasksSurfaceReady,
            syncDeskToolbarFromFreshMarkup,
            getOrCreateProjectTabPane,
            refreshProjectTasksTabBody,
            refreshProjectTasksTabPane,
            rebuildActiveProjectTabPaneIfPreviewHost,
            patchProjectWorkspaceTab,
            revealDeskExpandTarget
        };
    }

    window.createKiuSocialWorkspaceTabRuntimeApi = createKiuSocialWorkspaceTabRuntimeApi;
})();
