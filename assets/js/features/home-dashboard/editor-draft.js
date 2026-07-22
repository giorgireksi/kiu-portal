/* Home dashboard editor draft/save helpers. */

function ensureHomeEditorCss() {
    if (typeof document === 'undefined') return Promise.resolve();
    const existing = document.querySelector('link[data-kiu-home-editor-css]');
    if (existing) {
        if (existing.sheet || existing.dataset.kiuReady === '1') return Promise.resolve();
        return new Promise((resolve) => {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => resolve(), { once: true });
        });
    }
    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/index-home-editor.css?v=20260720-dedupe2';
        link.setAttribute('data-kiu-home-editor-css', '1');
        link.addEventListener('load', () => {
            link.dataset.kiuReady = '1';
            resolve();
        }, { once: true });
        link.addEventListener('error', () => resolve(), { once: true });
        document.head.appendChild(link);
    });
}


    getWorkingHomeLayout = function (role, model) {
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role && Array.isArray(HOME_EDITOR_STATE.draftLayout)) {
            return HOME_EDITOR_STATE.draftLayout;
        }
        return resolveSavedHomeLayout(role, model);
    };

    ensureHomeEditorDraft = function (role, model) {
        HOME_EDITOR_STATE.editing = true;
        HOME_EDITOR_STATE.role = role;
        HOME_EDITOR_STATE.scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        HOME_EDITOR_STATE.availablePins = buildPinnedRecordOptions(role, model);
        // Load the editable workspace layout here so the inspector preserves the real
        // widget positions and sizes the user just arranged.
        HOME_EDITOR_STATE.draftLayout = normalizeLayoutZIndices(cloneLayoutWidgets(resolveHomeLayout(role, model)));
        HOME_EDITOR_STATE.inspectorState = getSavedInspectorState(HOME_EDITOR_STATE.scopeKey);
        HOME_EDITOR_STATE.inspectorDragState = null;
        HOME_EDITOR_STATE.selectedWidgetId = '';
    };

    stopHomeEditor = function ({ message = '', refresh = true } = {}) {
        clearHomeEditorState();
        if (message) showToast(message);
        if (refresh) {
            renderHomeShell();
            if (typeof syncTopbar === 'function') syncTopbar();
        }
    };

    saveHomeEditor = function (role) {
        const scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        const inspectorState = sanitizeInspectorState(HOME_EDITOR_STATE.inspectorState || getSavedInspectorState(scopeKey));
        const workspaceWidgets = serializeHomeLayout(HOME_EDITOR_STATE.draftLayout);
        const presentationWidgets = serializeHomeLayout(HOME_EDITOR_STATE.draftLayout);
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByScope[scopeKey] = {
                version: ADVANCED_HOME_LAYOUT_VERSION,
                workspaceWidgets,
                presentationWidgets
            };
            entry.editorUiByScope = entry.editorUiByScope || {};
            entry.editorUiByScope[scopeKey] = inspectorState;
            delete entry.layoutsByRole[role];
            delete entry.customShortcutsByRole[role];
        }, { persist: true });
        stopHomeEditor({ message: `${ROLE_LABELS[role] || 'Dashboard'} saved for ${getFacultyName(getCurrentFacultyCode())}.`, refresh: false });
        syncAll();
    };

    resetCurrentRoleLayoutDraft = function (role, model) {
        HOME_EDITOR_STATE.availablePins = buildPinnedRecordOptions(role, model);
        HOME_EDITOR_STATE.draftLayout = cloneLayoutWidgets(resolveHomeLayout(role, model, []));
        HOME_EDITOR_STATE.inspectorState = getSavedInspectorState(getHomeScopeKey(role, getCurrentFacultyCode()));
        HOME_EDITOR_STATE.selectedWidgetId = '';
        renderHomeShell();
        showToast(`${ROLE_LABELS[role] || 'Dashboard'} reset to KIU defaults for this faculty.`);
    };

    updateDraftWidget = function (instanceId, mutator, { stabilize = true, priority = instanceId, render = true } = {}) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout)) return;
        HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((widget) => {
            if (widget.instanceId !== instanceId) return widget;
            const next = { ...widget };
            mutator(next);
            next.w = normalizeWidgetWidth(next.w, widget.w, next.minW || widget.minW || 2, next.maxW || widget.maxW || HOME_GRID_COLUMNS);
            next.h = normalizeWidgetHeight(next.h, widget.h, next.minH || widget.minH || 3, next.maxH || widget.maxH || 12);
            next.x = normalizeWidgetX(next.x, next.w, widget.x);
            next.y = normalizeWidgetY(next.y, widget.y);
            return next;
        });
        if (stabilize) HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, priority);
        if (render) renderHomeShell();
    };

    function getSelectedDraftWidget(layout = HOME_EDITOR_STATE.draftLayout) {
        const visible = sortLayoutForDisplay(layout).filter((widget) => widget.visible !== false);
        if (!visible.length) return null;
        if (!HOME_EDITOR_STATE.selectedWidgetId) return null;
        return visible.find((widget) => widget.instanceId === HOME_EDITOR_STATE.selectedWidgetId) || null;
    }

    function setSelectedDraftWidget(instanceId, { render = false, bringToFront = false } = {}) {
        const visible = sortLayoutForDisplay(HOME_EDITOR_STATE.draftLayout).filter((widget) => widget.visible !== false);
        HOME_EDITOR_STATE.selectedWidgetId = instanceId
            ? (visible.find((widget) => widget.instanceId === instanceId)?.instanceId || '')
            : '';
        if (bringToFront && HOME_EDITOR_STATE.selectedWidgetId) {
            bringDraftWidgetToFront(HOME_EDITOR_STATE.selectedWidgetId, { render: false });
        }
        if (render) {
            renderHomeShell();
            return;
        }
        const homeShell = document.getElementById('lux-home-shell');
        if (!homeShell) return;
        const selectedId = HOME_EDITOR_STATE.selectedWidgetId;
        homeShell.querySelectorAll('[data-widget-id].is-selected').forEach((node) => {
            node.classList.remove('is-selected');
        });
        homeShell.querySelectorAll('[data-widget-select].is-active').forEach((node) => {
            node.classList.remove('is-active');
        });
        if (!selectedId) return;
        const widgetEl = homeShell.querySelector(`[data-widget-id="${CSS.escape(selectedId)}"]`);
        widgetEl?.classList.add('is-selected');
        homeShell.querySelectorAll(`[data-widget-select="${CSS.escape(selectedId)}"]`).forEach((node) => {
            node.classList.add('is-active');
        });
    }

    function setDraftWidgetDimensions(instanceId, values, { render = true } = {}) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setSelectedDraftWidget(instanceId, { render: false });
        const metrics = getDesktopCanvasMetrics(getHomeViewportWidthForDesktop());
        const desktopEditor = isDesktopHomeEditorViewport();
        const nextRect = desktopEditor
            ? normalizeDesktopRect(widget, {
                left: values?.left ?? values?.x ?? (widget.desktopRect?.left ?? gridRectToDesktopRect(widget, metrics.width).left),
                top: values?.top ?? values?.y ?? (widget.desktopRect?.top ?? gridRectToDesktopRect(widget, metrics.width).top),
                width: values?.width != null
                    ? values.width
                    : toDesktopPixelWidth(values?.w ?? widget.w, metrics),
                height: values?.height != null
                    ? values.height
                    : toDesktopPixelHeight(values?.h ?? widget.h, metrics)
            }, metrics.width)
            : normalizeWidgetRect(widget, {
                x: values?.x ?? widget.x,
                y: values?.y ?? widget.y,
                w: values?.w ?? (values?.width != null ? toGridWidthFromPixels(values.width, widget, metrics) : widget.w),
                h: values?.h ?? (values?.height != null ? toGridHeightFromPixels(values.height, widget, metrics) : widget.h)
            });
        updateDraftWidget(instanceId, (next) => {
            if (desktopEditor) {
                const gridRect = desktopRectToGridRect(next, nextRect, metrics.width);
                next.x = gridRect.x;
                next.y = gridRect.y;
                next.w = gridRect.w;
                next.h = gridRect.h;
                next.desktopRect = { ...nextRect };
                next.restoreDesktopRect = { ...nextRect };
                next.desktopRectViewportWidth = metrics.width;
                next.restoreDesktopRectViewportWidth = metrics.width;
            } else {
                next.x = nextRect.x;
                next.y = nextRect.y;
                next.w = nextRect.w;
                next.h = nextRect.h;
                next.desktopRect = null;
                next.restoreDesktopRect = null;
            }
            if (!next.minimized) {
                next.restoreRect = { ...(next.restoreRect || {}), x: next.x, y: next.y, w: next.w, h: next.h };
            }
        }, { render, stabilize: true, priority: instanceId });
    }

    function setDraftWidgetDimension(instanceId, axis, value, { render = true } = {}) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setDraftWidgetDimensions(instanceId, axis === 'h' ? { h: value } : { w: value }, { render });
    }

    function applyDesktopRectToDraftWidget(next, rect, viewportWidth = 0) {
        const desktopRect = normalizeDesktopRect(next, rect, viewportWidth);
        const gridRect = desktopRectToGridRect(next, desktopRect, viewportWidth);
        next.desktopRect = desktopRect;
        next.x = gridRect.x;
        next.y = gridRect.y;
        next.w = gridRect.w;
        next.h = gridRect.h;
        next.desktopRectViewportWidth = viewportWidth || getHomeViewportWidthForDesktop();
        next.restoreDesktopRectViewportWidth = next.desktopRectViewportWidth;
    }

    function bringDraftWidgetToFront(instanceId, { render = true } = {}) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        updateDraftWidget(instanceId, (next) => {
            next.zIndex = getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1;
        }, { stabilize: false, render });
    }

    moveDraftWidget = function (sourceId, targetId) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout) || sourceId === targetId) return;
        const source = HOME_EDITOR_STATE.draftLayout.find((widget) => widget.instanceId === sourceId);
        const target = HOME_EDITOR_STATE.draftLayout.find((widget) => widget.instanceId === targetId);
        if (!source || !target) return;
        const nextSourceY = target.y;
        const nextTargetY = source.y;
        HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((widget) => {
            if (widget.instanceId === sourceId) return { ...widget, y: nextSourceY };
            if (widget.instanceId === targetId) return { ...widget, y: nextTargetY };
            return widget;
        });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, sourceId);
        renderHomeShell();
    };

    function nudgeDraftWidget(instanceId, direction) {
        const visible = (HOME_EDITOR_STATE.draftLayout || []).filter((widget) => widget.visible !== false).slice().sort((a, b) => a.y - b.y || a.x - b.x);
        const index = visible.findIndex((widget) => widget.instanceId === instanceId);
        if (index === -1) return;
        const swapIndex = index + direction;
        if (swapIndex < 0 || swapIndex >= visible.length) return;
        moveDraftWidget(visible[index].instanceId, visible[swapIndex].instanceId);
    }

    function setDraftWidgetSize(instanceId, axis, direction) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setSelectedDraftWidget(instanceId, { render: false });
        if (isDesktopHomeEditorViewport()) {
            const viewportWidth = getHomeViewportWidthForDesktop();
            const rect = getWidgetDesktopRect(widget, viewportWidth);
            const metrics = getDesktopCanvasMetrics(viewportWidth);
            const widthStep = Math.max(HOME_WINDOW_SNAP * 2, Math.round(metrics.cellWidth + metrics.gapX));
            const heightStep = Math.max(HOME_WINDOW_SNAP * 2, Math.round(metrics.rowHeight + metrics.gapY));
            setDraftWidgetDimensions(instanceId, axis === 'w'
                ? { width: rect.width + (direction > 0 ? widthStep : -widthStep) }
                : { height: rect.height + (direction > 0 ? heightStep : -heightStep) });
            return;
        }
        const nextRect = resolveNearestOpenRect(HOME_EDITOR_STATE.draftLayout, instanceId, {
            x: widget.x,
            y: widget.y,
            w: axis === 'w' ? stepWidgetSize(widget, 'w', direction) : widget.w,
            h: axis === 'h' ? stepWidgetSize(widget, 'h', direction) : widget.h
        });
        updateDraftWidget(instanceId, (next) => {
            next.x = nextRect.x;
            next.y = nextRect.y;
            next.w = nextRect.w;
            next.h = nextRect.h;
            next.desktopRect = null;
            next.restoreDesktopRect = null;
            if (!next.minimized) {
                next.restoreRect = { ...(next.restoreRect || {}), x: nextRect.x, y: nextRect.y, w: nextRect.w, h: nextRect.h };
            }
        }, { priority: instanceId });
    }

    function toggleDraftWidgetMinimize(instanceId) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setSelectedDraftWidget(instanceId, { render: false });
        updateDraftWidget(instanceId, (next) => {
            if (next.minimized) {
                next.minimized = false;
                if (next.restoreDesktopRect) {
                    applyDesktopRectToDraftWidget(next, next.restoreDesktopRect, getHomeViewportWidthForDesktop());
                }
                if (next.restoreRect) {
                    next.x = normalizeWidgetX(next.restoreRect.x, next.restoreRect.w || next.w, next.x);
                    next.y = normalizeWidgetY(next.restoreRect.y, next.y);
                    next.w = normalizeWidgetWidth(next.restoreRect.w, next.w, next.minW || 2, next.maxW || HOME_GRID_COLUMNS);
                    next.h = normalizeWidgetHeight(next.restoreRect.h, next.h, next.minH || 3, next.maxH || 12);
                }
            } else {
                next.restoreRect = { x: next.x, y: next.y, w: next.w, h: next.h };
                next.restoreDesktopRect = next.desktopRect ? { ...next.desktopRect } : getWidgetDesktopRect(next, getHomeViewportWidthForDesktop());
                next.minimized = true;
                next.w = normalizeWidgetWidth(Math.min(3, next.w), Math.min(3, next.w), 2, next.maxW || HOME_GRID_COLUMNS);
                next.h = 2;
                if (isDesktopHomeEditorViewport()) {
                    applyDesktopRectToDraftWidget(next, {
                        left: next.restoreDesktopRect?.left ?? 0,
                        top: next.restoreDesktopRect?.top ?? 0,
                        width: Math.min(280, next.restoreDesktopRect?.width || 280),
                        height: 112
                    }, getHomeViewportWidthForDesktop());
                }
            }
        });
    }

    function normalizeWidgetRect(widget, values = {}) {
        const width = normalizeWidgetWidth(values.w ?? widget.w, widget.w, widget.minW || 2, widget.maxW || HOME_GRID_COLUMNS);
        const height = normalizeWidgetHeight(values.h ?? widget.h, widget.h, widget.minH || 3, widget.maxH || 12);
        return {
            x: normalizeWidgetX(values.x ?? widget.x, width, widget.x),
            y: normalizeWidgetY(values.y ?? widget.y, widget.y),
            w: width,
            h: height
        };
    }

    function resolveNearestOpenRect(layout, widgetId, proposed) {
        const widget = (layout || []).find((item) => item.instanceId === widgetId);
        if (!widget) return proposed;
        const candidate = normalizeWidgetRect(widget, proposed);
        const others = (layout || []).filter((item) => item.visible !== false && item.instanceId !== widgetId);
        if (!others.some((other) => widgetsOverlap({ ...candidate, instanceId: widgetId, visible: true }, other))) return candidate;
        let best = null;
        let bestScore = Number.POSITIVE_INFINITY;
        const maxRow = Math.max(
            candidate.y + 28,
            widget.y + widget.h + 18,
            ...others.map((other) => other.y + other.h + 10),
            24
        );
        for (let row = 1; row <= maxRow; row += 1) {
            for (let col = 1; col <= (HOME_GRID_COLUMNS - candidate.w + 1); col += 1) {
                const test = { instanceId: widgetId, visible: true, x: col, y: row, w: candidate.w, h: candidate.h };
                if (others.some((other) => widgetsOverlap(test, other))) continue;
                const score = Math.abs(col - candidate.x) * 3 + Math.abs(row - candidate.y) + (row > candidate.y ? 0.2 : 0);
                if (!best || score < bestScore) {
                    best = { x: col, y: row, w: candidate.w, h: candidate.h };
                    bestScore = score;
                }
            }
        }
        if (best) return best;
        return {
            x: 1,
            y: Math.max(1, ...others.map((other) => other.y + other.h + 1)),
            w: candidate.w,
            h: candidate.h
        };
    }

    function setInspectorState(values, { persist = true, render = true } = {}) {
        const scopeKey = HOME_EDITOR_STATE.scopeKey || getHomeScopeKey();
        const nextState = sanitizeInspectorState({
            ...(HOME_EDITOR_STATE.inspectorState || getSavedInspectorState(scopeKey)),
            ...(values || {})
        });
        HOME_EDITOR_STATE.inspectorState = nextState;
        if (persist) setSavedInspectorState(nextState, scopeKey, true);
        if (render) renderHomeShell();
        return nextState;
    }

    hideDraftWidget = function (widget) {
        if (!widget || !HOME_EDITOR_STATE.editing) return;
        if (widget.softLock && !window.confirm(`Hide "${widget.label}" from this dashboard? You can restore it later from the widget library.`)) return;
        if (widget.sourceType === 'system') {
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((item) => (
                item.instanceId === widget.instanceId ? { ...item, visible: false } : item
            ));
        } else {
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.filter((item) => item.instanceId !== widget.instanceId);
        }
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout);
        if (HOME_EDITOR_STATE.selectedWidgetId === widget.instanceId) {
            HOME_EDITOR_STATE.selectedWidgetId = sortLayoutForDisplay(HOME_EDITOR_STATE.draftLayout).find((item) => item.visible !== false)?.instanceId || '';
        }
        renderHomeShell();
    };

    restoreDraftWidget = function (widgetId, role, model) {
        const definition = buildSystemWidgetDefinitions(role, model).find((item) => item.widgetId === widgetId);
        if (!definition) return;
        const existing = HOME_EDITOR_STATE.draftLayout.find((item) => item.widgetId === widgetId && item.sourceType === 'system');
        if (existing) {
            updateDraftWidget(existing.instanceId, (next) => {
                const resolved = resolveNearestOpenRect(HOME_EDITOR_STATE.draftLayout, existing.instanceId, definition);
                next.visible = true;
                next.minimized = false;
                next.x = resolved.x;
                next.y = resolved.y;
                next.w = resolved.w;
                next.h = resolved.h;
                next.zIndex = getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1;
            });
            setSelectedDraftWidget(existing.instanceId, { render: false });
            return;
        }
        const widget = createWidgetInstance(definition, { visible: true });
        const slot = resolveNearestOpenRect(HOME_EDITOR_STATE.draftLayout, widget.instanceId, widget);
        HOME_EDITOR_STATE.draftLayout.push({ ...widget, ...slot, minimized: false, zIndex: getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1 });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, definition.widgetId);
        HOME_EDITOR_STATE.selectedWidgetId = widget.instanceId;
        renderHomeShell();
    };

    createDraftShortcut = function (role, values) {
        const widget = createShortcutWidgetInstance(values, role);
        if (!widget) return;
        const slot = findNextAvailableSlot(HOME_EDITOR_STATE.draftLayout, widget.w, widget.h);
        HOME_EDITOR_STATE.draftLayout.push({ ...widget, ...slot, zIndex: getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1 });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, widget.instanceId);
        HOME_EDITOR_STATE.selectedWidgetId = widget.instanceId;
        renderHomeShell();
        showToast(`Added shortcut: ${widget.label}`);
    };

    function createDraftPinnedWidget(spec) {
        const widget = createPinnedWidgetInstance(spec);
        if (!widget) return;
        const slot = findNextAvailableSlot(HOME_EDITOR_STATE.draftLayout, widget.w, widget.h);
        HOME_EDITOR_STATE.draftLayout.push({ ...widget, ...slot, zIndex: getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1 });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, widget.instanceId);
        HOME_EDITOR_STATE.selectedWidgetId = widget.instanceId;
        renderHomeShell();
        showToast(`Pinned: ${widget.label}`);
    }
