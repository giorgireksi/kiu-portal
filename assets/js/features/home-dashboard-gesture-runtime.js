/* Home dashboard desktop gesture + shell bind helpers. Peeled from index-home-dashboard.plain.js.
 * Load before index-home-dashboard.plain.js.
 */
(function () {
    if (window.__KIU_HOME_DASHBOARD_GESTURE_LOADED) return;
    window.__KIU_HOME_DASHBOARD_GESTURE_LOADED = true;
    window.__kiuCreateHomeDashboardGestureApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        function beginDesktopWidgetGesture(event, widgetId, mode, homeShell) {
            if (!HOME_EDITOR_STATE.editing || !isDesktopHomeEditorViewport()) return;
            const canvas = homeShell.querySelector('.lux-dashboard-canvas');
            const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === widgetId);
            if (!canvas || !widget) return;
            HOME_EDITOR_STATE.selectedWidgetId = widgetId;
            bringDraftWidgetToFront(widgetId, { render: false });
            event.preventDefault();
            event.stopPropagation();
            const rect = canvas.getBoundingClientRect();
            const viewportWidth = Math.round(rect.width);
            const originRect = getWidgetDesktopRect(widget, viewportWidth);
            const widgetElement = homeShell.querySelector(`[data-widget-id="${CSS.escape(widgetId)}"]`);
            const minWidth = getWidgetMinDesktopWidth(widget, getDesktopCanvasMetrics(viewportWidth));
            const maxWidth = getWidgetMaxDesktopWidth(widget, getDesktopCanvasMetrics(viewportWidth));
            const minHeight = getWidgetMinDesktopHeight(widget, getDesktopCanvasMetrics(viewportWidth));
            const maxHeight = getWidgetMaxDesktopHeight(widget, getDesktopCanvasMetrics(viewportWidth));
            const rightEdge = originRect.left + originRect.width;
            const bottomEdge = originRect.top + originRect.height;
            const originalCanvasHeight = Number.parseFloat(canvas.style.height) || canvas.getBoundingClientRect().height || 0;
            const activePointerTarget = event.currentTarget;
            try {
                activePointerTarget?.setPointerCapture?.(event.pointerId);
            } catch (captureError) {
                // Pointer capture is best-effort; window-level listeners below keep the gesture working.
            }

            const applyLiveRect = (nextRect) => {
                if (!widgetElement) return;
                if (mode === 'move') {
                    widgetElement.style.left = `${originRect.left}px`;
                    widgetElement.style.top = `${originRect.top}px`;
                    widgetElement.style.width = `${originRect.width}px`;
                    widgetElement.style.height = `${originRect.height}px`;
                    widgetElement.style.transform = `translate3d(${nextRect.left - originRect.left}px, ${nextRect.top - originRect.top}px, 0)`;
                } else {
                    widgetElement.style.transform = 'translate3d(0, 0, 0)';
                    widgetElement.style.left = `${nextRect.left}px`;
                    widgetElement.style.top = `${nextRect.top}px`;
                    widgetElement.style.width = `${nextRect.width}px`;
                    widgetElement.style.height = `${nextRect.height}px`;
                }
                widgetElement.style.zIndex = String(getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1);
                canvas.style.height = `${Math.max(originalCanvasHeight, Math.ceil(nextRect.top + nextRect.height + 72))}px`;
            };

            const buildLiveRect = (dx, dy) => {
                let nextRect = { ...originRect };
                if (mode === 'move') {
                    nextRect.left = originRect.left + dx;
                    nextRect.top = originRect.top + dy;
                } else {
                    if (mode === 'resize-east' || mode === 'resize-corner') {
                        nextRect.width = originRect.width + dx;
                    }
                    if (mode === 'resize-south' || mode === 'resize-corner') {
                        nextRect.height = originRect.height + dy;
                    }
                    if (mode === 'resize-west') {
                        nextRect.width = clampNumber(originRect.width - dx, minWidth, maxWidth);
                        nextRect.left = rightEdge - nextRect.width;
                    }
                    if (mode === 'resize-north') {
                        nextRect.height = clampNumber(originRect.height - dy, minHeight, maxHeight);
                        nextRect.top = bottomEdge - nextRect.height;
                    }
                }
                return normalizeDesktopRect(widget, nextRect, viewportWidth);
            };

            HOME_EDITOR_STATE.dragState = {
                mode,
                widgetId,
                startX: event.clientX,
                startY: event.clientY,
                viewportWidth,
                originRect: { ...originRect },
                preview: { ...originRect }
            };
            updateCanvasGuide(canvas, HOME_EDITOR_STATE.dragState.preview);
            widgetElement?.classList.add('is-live-moving');
            document.body.classList.add('lux-dashboard-gesture-active');

            const handleMove = (moveEvent) => {
                if (!HOME_EDITOR_STATE.dragState) return;
                const dx = moveEvent.clientX - HOME_EDITOR_STATE.dragState.startX;
                const dy = moveEvent.clientY - HOME_EDITOR_STATE.dragState.startY;
                HOME_EDITOR_STATE.dragState.preview = buildLiveRect(dx, dy);
                if (HOME_EDITOR_STATE.dragState.frame) return;
                HOME_EDITOR_STATE.dragState.frame = window.requestAnimationFrame(() => {
                    const state = HOME_EDITOR_STATE.dragState;
                    if (!state) return;
                    state.frame = 0;
                    applyLiveRect(state.preview);
                    updateCanvasGuide(canvas, state.preview);
                });
            };

            const finishGesture = () => {
                const state = HOME_EDITOR_STATE.dragState;
                if (!state) return;
                if (state.frame) {
                    window.cancelAnimationFrame(state.frame);
                    state.frame = 0;
                }
                const preview = state.preview;
                applyLiveRect(preview);
                const desktopEditor = isDesktopHomeEditorViewport();
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', finishGesture);
                window.removeEventListener('pointercancel', finishGesture);
                try {
                    activePointerTarget?.releasePointerCapture?.(event.pointerId);
                } catch (captureError) {
                    // Matching the best-effort capture above.
                }
                widgetElement?.classList.remove('is-live-moving');
                document.body.classList.remove('lux-dashboard-gesture-active');
                clearCanvasGuide(canvas);
                HOME_EDITOR_STATE.dragState = null;
                updateDraftWidget(widgetId, (next) => {
                    if (desktopEditor) {
                        const gridRect = desktopRectToGridRect(next, preview, viewportWidth);
                        next.x = gridRect.x;
                        next.y = gridRect.y;
                        next.w = gridRect.w;
                        next.h = gridRect.h;
                        next.desktopRect = { ...preview };
                        next.restoreDesktopRect = { ...next.desktopRect };
                        next.desktopRectViewportWidth = viewportWidth;
                        next.restoreDesktopRectViewportWidth = viewportWidth;
                    } else {
                        next.desktopRect = null;
                        next.restoreDesktopRect = null;
                    }
                    if (!next.minimized) {
                        next.restoreRect = { ...(next.restoreRect || {}), x: next.x, y: next.y, w: next.w, h: next.h };
                    }
                }, { stabilize: true, priority: widgetId });
            };

            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', finishGesture);
            window.addEventListener('pointercancel', finishGesture);
        }

        /* Home dashboard shell bind and renderDynamicHomeShell. */
        function bindHomeShellActions(homeShell, role, model) {
            homeShell.querySelectorAll('[data-nav-target]').forEach((button) => button.addEventListener('click', () => {
                if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
            }));
            homeShell.querySelectorAll('[data-admin-provision]').forEach((button) => button.addEventListener('click', () => {
                if (typeof openUnifiedAdminProvision === 'function') openUnifiedAdminProvision(button.dataset.adminProvision);
            }));
            homeShell.querySelectorAll('[data-admin-focus]').forEach((button) => button.addEventListener('click', () => {
                queueAdminToolsFocus(button.dataset.adminFocus);
                if (typeof navigate === 'function') navigate('admin-tools');
            }));
            if (!HOME_EDITOR_STATE.editing) return;
            homeShell.querySelectorAll('[data-widget-select]').forEach((button) => button.addEventListener('click', () => {
                setSelectedDraftWidget(button.dataset.widgetSelect, { bringToFront: true });
            }));
            homeShell.querySelectorAll('[data-widget-selectable]').forEach((panel) => panel.addEventListener('click', (event) => {
                if (event.target.closest('button, a, input, select, textarea, label, [data-widget-drag-zone], [data-widget-drag-handle], [data-widget-resize]')) return;
                setSelectedDraftWidget(panel.dataset.widgetSelectable, { bringToFront: true });
            }));
            homeShell.querySelectorAll('[data-widget-hide]').forEach((button) => button.addEventListener('click', () => {
                const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === button.dataset.widgetHide);
                hideDraftWidget(widget);
            }));
            homeShell.querySelectorAll('[data-widget-size]').forEach((button) => button.addEventListener('click', () => {
                setDraftWidgetSize(button.dataset.widgetSize, button.dataset.sizeAxis, Number(button.dataset.sizeDirection || 0));
            }));
            homeShell.querySelectorAll('[data-widget-dimension]').forEach((button) => button.addEventListener('click', () => {
                setDraftWidgetDimension(button.dataset.widgetDimension, button.dataset.dimensionAxis, Number(button.dataset.dimensionValue || 0));
            }));
            homeShell.querySelectorAll('[data-widget-minimize]').forEach((button) => button.addEventListener('click', () => {
                toggleDraftWidgetMinimize(button.dataset.widgetMinimize);
            }));
            homeShell.querySelectorAll('[data-widget-move]').forEach((button) => button.addEventListener('click', () => {
                nudgeDraftWidget(button.dataset.widgetMove, Number(button.dataset.moveDirection || 0));
            }));
            homeShell.querySelectorAll('[data-restore-widget]').forEach((button) => button.addEventListener('click', () => restoreDraftWidget(button.dataset.restoreWidget, role, model)));
            homeShell.querySelector('[data-inspector-toggle="open"]')?.addEventListener('click', () => setInspectorState({ collapsed: false }));
            homeShell.querySelector('[data-inspector-toggle="collapse"]')?.addEventListener('click', () => setInspectorState({ collapsed: true }));
            homeShell.querySelectorAll('[data-pin-widget]').forEach((button) => button.addEventListener('click', () => {
                const index = Number(button.dataset.pinWidget);
                const item = HOME_EDITOR_STATE.availablePins?.[index];
                if (item) createDraftPinnedWidget(item);
            }));
            homeShell.querySelectorAll('[data-home-reset]').forEach((button) => button.addEventListener('click', () => {
                const action = button.dataset.homeReset;
                if (action === 'current-role') return resetCurrentRoleLayoutDraft(role, model);
                if (action === 'all-layouts') return window.confirm('Reset every saved dashboard layout for this user?') && resetAllSavedHomeLayouts();
                if (action === 'home-defaults' && window.confirm('Reset all layouts and visual settings for the home page?')) resetHomeToDefaults();
            }));
            homeShell.querySelector('#lux-add-shortcut-btn')?.addEventListener('click', () => createDraftShortcut(role, { id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, pageId: homeShell.querySelector('#lux-shortcut-page')?.value, label: homeShell.querySelector('#lux-shortcut-label')?.value, copy: homeShell.querySelector('#lux-shortcut-copy')?.value, icon: homeShell.querySelector('#lux-shortcut-icon')?.value, tone: 'default' }));
            if (isDesktopHomeEditorViewport()) {
                homeShell.querySelectorAll('[data-widget-drag-handle]').forEach((button) => button.addEventListener('pointerdown', (event) => beginDesktopWidgetGesture(event, button.dataset.widgetDragHandle, 'move', homeShell)));
                homeShell.querySelectorAll('[data-widget-drag-zone]').forEach((zone) => zone.addEventListener('pointerdown', (event) => {
                    if (event.target.closest('button, a, input, select, textarea, [data-widget-hide], [data-widget-size], [data-widget-move]')) return;
                    setSelectedDraftWidget(zone.dataset.widgetDragZone, { render: false });
                    beginDesktopWidgetGesture(event, zone.dataset.widgetDragZone, 'move', homeShell);
                }));
                homeShell.querySelectorAll('[data-widget-resize]').forEach((button) => button.addEventListener('pointerdown', (event) => beginDesktopWidgetGesture(event, button.dataset.widgetResize, button.dataset.widgetResizeMode || 'resize-corner', homeShell)));
                homeShell.querySelector('[data-inspector-drag-handle="1"]')?.addEventListener('pointerdown', (event) => {
                    const panel = homeShell.querySelector('[data-inspector-panel="1"]');
                    if (!panel) return;
                    event.preventDefault();
                    const start = HOME_EDITOR_STATE.inspectorState || getSavedInspectorState(HOME_EDITOR_STATE.scopeKey);
                    const originX = event.clientX;
                    const originY = event.clientY;
                    const moveInspector = (moveEvent) => {
                        const next = sanitizeInspectorState({
                            ...start,
                            x: start.x + (moveEvent.clientX - originX),
                            y: start.y + (moveEvent.clientY - originY)
                        });
                        HOME_EDITOR_STATE.inspectorState = next;
                        panel.style.left = `${Math.round(next.x)}px`;
                        panel.style.top = `${Math.round(next.y)}px`;
                    };
                    const stopInspector = () => {
                        window.removeEventListener('pointermove', moveInspector);
                        window.removeEventListener('pointerup', stopInspector);
                        setInspectorState(HOME_EDITOR_STATE.inspectorState, { persist: true, render: false });
                    };
                    window.addEventListener('pointermove', moveInspector);
                    window.addEventListener('pointerup', stopInspector);
                });
            }
        }

        function getHomeViewportWidthForDesktop() {
            const windowWidth = window.innerWidth || document.documentElement.clientWidth || 1440;
            const page = document.getElementById('page-home') || document.getElementById('app-content');
            if (page) {
                const rect = page.getBoundingClientRect();
                const availableRightEdge = Math.max(rect.width, windowWidth - Math.max(0, rect.left));
                return Math.max(980, Math.round(availableRightEdge));
            }
            return Math.max(980, Math.round(windowWidth));
        }

        renderDynamicHomeShell = function (homeShell) {
            const role = getEffectiveRole();
            if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role && HOME_EDITOR_STATE.role !== role) stopHomeEditor({ refresh: false });
            const model = buildHomeModel(role);
            const systemDefinitions = buildSystemWidgetDefinitions(role, model);
            const editing = HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role;
            const desktopViewport = (window.innerWidth || 0) >= 980;
            const desktopEditor = editing && isDesktopHomeEditorViewport();
            const renderMode = desktopViewport ? 'workspace' : 'stacked';
            const viewportWidth = desktopViewport ? getHomeViewportWidthForDesktop() : 0;
            const layout = getWorkingHomeLayout(role, model);
            const visibleWidgets = desktopViewport
                ? sortLayoutForCanvas(layout, viewportWidth)
                : sortLayoutForDisplay(layout);
            const overlapIds = editing
                ? getWidgetOverlapIds(layout, viewportWidth, desktopEditor)
                : new Set();
            const desktopWidthStyle = desktopViewport
                ? ` style="width:${viewportWidth}px !important; max-width:none !important; min-width:${viewportWidth}px !important;"`
                : '';
            const desktopCanvasStyle = desktopWidthStyle;

            const toolbarHtml = editing
                ? '<button class="lux-ghost-btn" type="button" data-home-editor="cancel">Cancel</button><button class="lux-primary-btn" type="button" data-home-editor="save">Save layout</button>'
                : '<button class="lux-secondary-btn" type="button" data-home-editor="open">Customize dashboard</button>';
            const editorHtml = editing ? renderEditorPanel(role, model, layout, systemDefinitions, desktopEditor) : '';
            homeShell.innerHTML = `
                <div class="lux-home-grid lux-home-grid--builder is-${escapeHtml(model.variant || role)}" data-role="${escapeHtml(model.variant || role)}" data-editing="${editing ? 'true' : 'false'}"${desktopWidthStyle}>
                    <div class="lux-home-toolbar lux-home-toolbar--builder">
                        <div><div class="lux-kicker">Home Dashboard</div><strong>${editing ? 'Editing layout for this role and faculty' : 'Personal workspace layout'}</strong><p>${editing ? 'Drag and resize sections on desktop, use reorder controls on smaller screens, and save a separate dashboard for this role and faculty.' : 'This homepage can be customized per role and faculty without changing the underlying portal logic.'}</p></div>
                        <div class="lux-home-toolbar-actions">${toolbarHtml}</div>
                    </div>
                    <div class="lux-home-workbench"${desktopWidthStyle}>
                        <div class="lux-dashboard-canvas${renderMode === 'stacked' ? ' is-stacked' : ' is-desktop'}${editing ? ' is-editing' : ''}" data-dashboard-canvas="1"${desktopCanvasStyle}>${visibleWidgets.map((widget) => renderWidgetShellMarkup(widget, role, renderMode, desktopEditor, viewportWidth, overlapIds)).join('')}</div>
                        ${editorHtml}
                    </div>
                </div>
            `;

            homeShell.querySelector('[data-home-editor="open"]')?.addEventListener('click', () => {
                const start = () => {
                    ensureHomeEditorDraft(role, model);
                    renderHomeShell();
                    syncTopbar();
                };
                if (typeof ensureHomeEditorCss === 'function') {
                    Promise.resolve(ensureHomeEditorCss()).then(start);
                } else {
                    start();
                }
            });
            homeShell.querySelector('[data-home-editor="cancel"]')?.addEventListener('click', () => stopHomeEditor({ message: 'Dashboard editor closed.' }));
            homeShell.querySelector('[data-home-editor="save"]')?.addEventListener('click', () => saveHomeEditor(role));
            bindHomeShellActions(homeShell, role, model);
        };

        const __legacySyncTopbar = syncTopbar;
        syncTopbar = function () {
            __legacySyncTopbar();
            applySidebarState();
            const editButton = document.getElementById('lux-dashboard-edit-btn');
            if (editButton) {
                editButton.title = getActivePageId() === 'home'
                    ? (HOME_EDITOR_STATE.editing ? 'Close dashboard editor' : 'Customize this dashboard')
                    : 'Open the home page and customize the dashboard';
            }
        };

        // Live background is owned by luxury-background.js; installer still exports this no-op.
        startBackground = function () {};

        const api = {
            beginDesktopWidgetGesture,
            bindHomeShellActions,
            getHomeViewportWidthForDesktop,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();

