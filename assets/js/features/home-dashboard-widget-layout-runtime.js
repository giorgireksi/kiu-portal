/* Home dashboard geometry/layout helpers.
 * Peeled from home-dashboard/widget-layout.js (SSOT → plain chunk).
 * Load before index-home-dashboard.js; factory invoked from chunk bridge.
 */
(function initHomeDashboardWidgetLayoutRuntime() {
    if (window.__KIU_HOME_DASHBOARD_WIDGET_LAYOUT_LOADED) return;
    window.__KIU_HOME_DASHBOARD_WIDGET_LAYOUT_LOADED = true;

    window.__kiuCreateHomeDashboardWidgetLayoutApi = function createKiuHomeDashboardWidgetLayoutApi(deps = {}) {
        const d = deps;

        const HOME_GRID_COLUMNS = Number(d.HOME_GRID_COLUMNS ?? window.HOME_GRID_COLUMNS) || 12;
        const HOME_GRID_ROW_HEIGHT = Number(d.HOME_GRID_ROW_HEIGHT ?? window.HOME_GRID_ROW_HEIGHT) || 28;
        const HOME_WINDOW_SNAP = d.HOME_WINDOW_SNAP !== undefined ? d.HOME_WINDOW_SNAP : window.HOME_WINDOW_SNAP;
        const HOME_WINDOW_MIN_WIDTH = d.HOME_WINDOW_MIN_WIDTH !== undefined ? d.HOME_WINDOW_MIN_WIDTH : window.HOME_WINDOW_MIN_WIDTH;
        const HOME_WINDOW_MIN_HEIGHT = d.HOME_WINDOW_MIN_HEIGHT !== undefined ? d.HOME_WINDOW_MIN_HEIGHT : window.HOME_WINDOW_MIN_HEIGHT;
        const HOME_WIDGET_CONTEXT_CACHE = d.HOME_WIDGET_CONTEXT_CACHE !== undefined ? d.HOME_WIDGET_CONTEXT_CACHE : window.HOME_WIDGET_CONTEXT_CACHE;
        const HOME_WIDGET_DEFINITIONS_CACHE = d.HOME_WIDGET_DEFINITIONS_CACHE !== undefined ? d.HOME_WIDGET_DEFINITIONS_CACHE : window.HOME_WIDGET_DEFINITIONS_CACHE;
        const ADVANCED_HOME_LAYOUT_VERSION = Number(d.ADVANCED_HOME_LAYOUT_VERSION ?? window.ADVANCED_HOME_LAYOUT_VERSION) || 5;
        const HOME_DEFAULT_WIDGET_GEOMETRY = d.HOME_DEFAULT_WIDGET_GEOMETRY || window.HOME_DEFAULT_WIDGET_GEOMETRY;
        const ROLE_LABELS = d.ROLE_LABELS || window.ROLE_LABELS;
        function getHomeViewportWidthForDesktop(...a) {
            const impl = (d.getHomeViewportWidthForDesktop !== undefined ? d.getHomeViewportWidthForDesktop : window.getHomeViewportWidthForDesktop);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getEffectiveRole(...a) {
            const impl = (d.getEffectiveRole !== undefined ? d.getEffectiveRole : window.getEffectiveRole);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getCurrentFacultyCode(...a) {
            const impl = (d.getCurrentFacultyCode !== undefined ? d.getCurrentFacultyCode : window.getCurrentFacultyCode);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getCurrentUserSafe(...a) {
            const impl = (d.getCurrentUserSafe !== undefined ? d.getCurrentUserSafe : window.getCurrentUserSafe);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getHomeScopeKey(...a) {
            const impl = (d.getHomeScopeKey !== undefined ? d.getHomeScopeKey : window.getHomeScopeKey);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getDashboardPreferenceEntry(...a) {
            const impl = (d.getDashboardPreferenceEntry !== undefined ? d.getDashboardPreferenceEntry : window.getDashboardPreferenceEntry);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function normalizeScopeLayoutEntry(...a) {
            const impl = (d.normalizeScopeLayoutEntry !== undefined ? d.normalizeScopeLayoutEntry : window.normalizeScopeLayoutEntry);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getFacultyName(...a) {
            const impl = (d.getFacultyName !== undefined ? d.getFacultyName : window.getFacultyName);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function cleanupUiText(...a) {
            const impl = (d.cleanupUiText !== undefined ? d.cleanupUiText : window.cleanupUiText);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getSubjectLabel(...a) {
            const impl = (d.getSubjectLabel !== undefined ? d.getSubjectLabel : window.getSubjectLabel);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getDomainSafe(...a) {
            const impl = (d.getDomainSafe !== undefined ? d.getDomainSafe : window.getDomainSafe);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function clampPercent(...a) {
            const impl = (d.clampPercent !== undefined ? d.clampPercent : window.clampPercent);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function formatRelativeTime(...a) {
            const impl = (d.formatRelativeTime !== undefined ? d.formatRelativeTime : window.formatRelativeTime);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getStudentScheduleRows(...a) {
            const impl = (d.getStudentScheduleRows !== undefined ? d.getStudentScheduleRows : window.getStudentScheduleRows);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getFacultyScheduleRows(...a) {
            const impl = (d.getFacultyScheduleRows !== undefined ? d.getFacultyScheduleRows : window.getFacultyScheduleRows);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getOrdersSnapshot(...a) {
            const impl = (d.getOrdersSnapshot !== undefined ? d.getOrdersSnapshot : window.getOrdersSnapshot);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getMessengerSnapshot(...a) {
            const impl = (d.getMessengerSnapshot !== undefined ? d.getMessengerSnapshot : window.getMessengerSnapshot);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getNotificationSnapshot(...a) {
            const impl = (d.getNotificationSnapshot !== undefined ? d.getNotificationSnapshot : window.getNotificationSnapshot);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getRecentHomeUpdates(...a) {
            const impl = (d.getRecentHomeUpdates !== undefined ? d.getRecentHomeUpdates : window.getRecentHomeUpdates);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getStudentPerformanceMetric(...a) {
            const impl = (d.getStudentPerformanceMetric !== undefined ? d.getStudentPerformanceMetric : window.getStudentPerformanceMetric);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getStudentScoreRows(...a) {
            const impl = (d.getStudentScoreRows !== undefined ? d.getStudentScoreRows : window.getStudentScoreRows);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getOrderRowsForWidget(...a) {
            const impl = (d.getOrderRowsForWidget !== undefined ? d.getOrderRowsForWidget : window.getOrderRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getMessengerRowsForWidget(...a) {
            const impl = (d.getMessengerRowsForWidget !== undefined ? d.getMessengerRowsForWidget : window.getMessengerRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getStudentRequestRowsForWidget(...a) {
            const impl = (d.getStudentRequestRowsForWidget !== undefined ? d.getStudentRequestRowsForWidget : window.getStudentRequestRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getTicketRowsForWidget(...a) {
            const impl = (d.getTicketRowsForWidget !== undefined ? d.getTicketRowsForWidget : window.getTicketRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getArticleRowsForWidget(...a) {
            const impl = (d.getArticleRowsForWidget !== undefined ? d.getArticleRowsForWidget : window.getArticleRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getAttendanceRowsForWidget(...a) {
            const impl = (d.getAttendanceRowsForWidget !== undefined ? d.getAttendanceRowsForWidget : window.getAttendanceRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getGradebookRowsForWidget(...a) {
            const impl = (d.getGradebookRowsForWidget !== undefined ? d.getGradebookRowsForWidget : window.getGradebookRowsForWidget);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getAdminStudentRows(...a) {
            const impl = (d.getAdminStudentRows !== undefined ? d.getAdminStudentRows : window.getAdminStudentRows);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getCurrentFacultyOrders(...a) {
            const impl = (d.getCurrentFacultyOrders !== undefined ? d.getCurrentFacultyOrders : window.getCurrentFacultyOrders);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function sanitizeShortcutDefinition(...a) {
            const impl = (d.sanitizeShortcutDefinition !== undefined ? d.sanitizeShortcutDefinition : window.sanitizeShortcutDefinition);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function serializeHomeLayout(...a) {
            const impl = (d.serializeHomeLayout !== undefined ? d.serializeHomeLayout : window.serializeHomeLayout);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function resolveHomeLayout(...a) {
            const impl = (d.resolveHomeLayout !== undefined ? d.resolveHomeLayout : window.resolveHomeLayout);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getActiveCurriculum(...a) {
            const impl = (d.getActiveCurriculum !== undefined ? d.getActiveCurriculum : window.getActiveCurriculum);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getAllStudents(...a) {
            const impl = (d.getAllStudents !== undefined ? d.getAllStudents : window.getAllStudents);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getCurrentStudentSemesterNumber(...a) {
            const impl = (d.getCurrentStudentSemesterNumber !== undefined ? d.getCurrentStudentSemesterNumber : window.getCurrentStudentSemesterNumber);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getStudentCompletedEctsTotal(...a) {
            const impl = (d.getStudentCompletedEctsTotal !== undefined ? d.getStudentCompletedEctsTotal : window.getStudentCompletedEctsTotal);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getEffectiveTuitionBalance(...a) {
            const impl = (d.getEffectiveTuitionBalance !== undefined ? d.getEffectiveTuitionBalance : window.getEffectiveTuitionBalance);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function getCurrentFacultyScheduleItems(...a) {
            const impl = (d.getCurrentFacultyScheduleItems !== undefined ? d.getCurrentFacultyScheduleItems : window.getCurrentFacultyScheduleItems);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function ensureAdminExamState(...a) {
            const impl = (d.ensureAdminExamState !== undefined ? d.ensureAdminExamState : window.ensureAdminExamState);
            return typeof impl === "function" ? impl(...a) : impl;
        }
        function ensureStudentServiceStores(...a) {
            const impl = (d.ensureStudentServiceStores !== undefined ? d.ensureStudentServiceStores : window.ensureStudentServiceStores);
            return typeof impl === "function" ? impl(...a) : impl;
        }

    function sanitizeGridInteger(value, fallback, min, max) {
        const numeric = Math.round(Number(value));
        if (!Number.isFinite(numeric)) return fallback;
        return Math.max(min, Math.min(max, numeric));
    }

    function normalizeWidgetWidth(value, fallback = 4, min = 2, max = HOME_GRID_COLUMNS) {
        return sanitizeGridInteger(value, fallback, min, Math.min(HOME_GRID_COLUMNS, max));
    }

    function normalizeWidgetHeight(value, fallback = 4, min = 3, max = 12) {
        return sanitizeGridInteger(value, fallback, min, max);
    }

    function normalizeWidgetX(value, width, fallback = 1) {
        return sanitizeGridInteger(value, fallback, 1, Math.max(1, HOME_GRID_COLUMNS - Number(width || 1) + 1));
    }

    function normalizeWidgetY(value, fallback = 1) {
        return sanitizeGridInteger(value, fallback, 1, 999);
    }

    function clampNumber(value, min, max) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return min;
        return Math.max(min, Math.min(max, numeric));
    }

    function getDesktopCanvasMetrics(viewportWidth = 0) {
        const gapX = 18;
        const gapY = 18;
        const rowHeight = HOME_GRID_ROW_HEIGHT;
        const width = Math.max(980, Math.round(viewportWidth || getHomeViewportWidthForDesktop()));
        const cellWidth = (width - gapX * (HOME_GRID_COLUMNS - 1)) / HOME_GRID_COLUMNS;
        return { width, gapX, gapY, rowHeight, cellWidth };
    }

    function toDesktopPixelWidth(gridWidth, metrics) {
        const span = Math.max(1, Number(gridWidth) || 1);
        return Math.round(span * metrics.cellWidth + Math.max(0, span - 1) * metrics.gapX);
    }

    function toDesktopPixelHeight(gridHeight, metrics) {
        const span = Math.max(1, Number(gridHeight) || 1);
        return Math.round(span * metrics.rowHeight + Math.max(0, span - 1) * metrics.gapY);
    }

    function toGridWidthFromPixels(pixelWidth, widget, metrics) {
        return normalizeWidgetWidth(
            Math.round((Math.max(0, Number(pixelWidth) || 0) + metrics.gapX) / (metrics.cellWidth + metrics.gapX)),
            widget.w,
            widget.minW || 2,
            widget.maxW || HOME_GRID_COLUMNS
        );
    }

    function toGridHeightFromPixels(pixelHeight, widget, metrics) {
        return normalizeWidgetHeight(
            Math.round((Math.max(0, Number(pixelHeight) || 0) + metrics.gapY) / (metrics.rowHeight + metrics.gapY)),
            widget.h,
            widget.minH || 3,
            widget.maxH || 12
        );
    }

    function getWidgetMinDesktopWidth(widget, metrics) {
        return Math.max(HOME_WINDOW_MIN_WIDTH, toDesktopPixelWidth(widget.minW || 2, metrics));
    }

    function getWidgetMaxDesktopWidth(widget, metrics) {
        return Math.max(getWidgetMinDesktopWidth(widget, metrics), metrics.width);
    }

    function getWidgetMinDesktopHeight(widget, metrics) {
        return Math.max(HOME_WINDOW_MIN_HEIGHT, toDesktopPixelHeight(widget.minH || 3, metrics));
    }

    function getWidgetMaxDesktopHeight(widget, metrics) {
        return Math.max(getWidgetMinDesktopHeight(widget, metrics), toDesktopPixelHeight(widget.maxH || 12, metrics));
    }


    function normalizeDesktopRect(widget, rect, viewportWidth = 0) {
        const metrics = getDesktopCanvasMetrics(viewportWidth);
        const minWidth = getWidgetMinDesktopWidth(widget, metrics);
        const maxWidth = Math.min(metrics.width, getWidgetMaxDesktopWidth(widget, metrics));
        const minHeight = getWidgetMinDesktopHeight(widget, metrics);
        const maxHeight = getWidgetMaxDesktopHeight(widget, metrics);
        const width = clampNumber(rect?.width ?? minWidth, Math.min(minWidth, maxWidth), maxWidth);
        const height = clampNumber(rect?.height ?? minHeight, minHeight, maxHeight);
        const left = clampNumber(rect?.left ?? 0, 0, Math.max(0, metrics.width - width));
        const top = Math.max(0, Number(rect?.top ?? 0) || 0);
        return {
            left,
            top,
            width,
            height
        };
    }

    function gridRectToDesktopRect(widget, viewportWidth = 0) {
        const metrics = getDesktopCanvasMetrics(viewportWidth);
        return normalizeDesktopRect(widget, {
            left: (Math.max(1, widget.x) - 1) * (metrics.cellWidth + metrics.gapX),
            top: (Math.max(1, widget.y) - 1) * (metrics.rowHeight + metrics.gapY),
            width: toDesktopPixelWidth(widget.w || 4, metrics),
            height: toDesktopPixelHeight(widget.h || 4, metrics)
        }, metrics.width);
    }

    function getWidgetDesktopRect(widget, viewportWidth = 0) {
        const metrics = getDesktopCanvasMetrics(viewportWidth);
        const rect = widget?.desktopRect || gridRectToDesktopRect(widget, metrics.width);
        const normalized = normalizeDesktopRect(widget, rect, metrics.width);
        const savedViewportWidth = Number(widget?.desktopRectViewportWidth) || 0;
        const isFullWidthWidget = Number(widget?.w) >= HOME_GRID_COLUMNS;
        const wasNearPreviousRightEdge = savedViewportWidth > 0
            && Math.abs((Number(rect?.left) || 0) + (Number(rect?.width) || 0) - savedViewportWidth) <= 36;
        const isLegacyFullWidthRect = savedViewportWidth <= 0
            && isFullWidthWidget
            && normalized.left <= 24
            && metrics.width > normalized.width + 80;
        if (isFullWidthWidget && (wasNearPreviousRightEdge || isLegacyFullWidthRect) && metrics.width > normalized.width + 24) {
            return normalizeDesktopRect(widget, {
                ...normalized,
                width: Math.max(normalized.width, metrics.width - normalized.left)
            }, metrics.width);
        }
        return normalized;
    }

    function desktopRectToGridRect(widget, rect, viewportWidth = 0) {
        const metrics = getDesktopCanvasMetrics(viewportWidth);
        const width = toGridWidthFromPixels(rect.width, widget, metrics);
        const height = toGridHeightFromPixels(rect.height, widget, metrics);
        return {
            x: normalizeWidgetX(1 + Math.round(rect.left / (metrics.cellWidth + metrics.gapX)), width, widget.x),
            y: normalizeWidgetY(1 + Math.round(rect.top / (metrics.rowHeight + metrics.gapY)), widget.y),
            w: width,
            h: height
        };
    }

    function getHighestWidgetZIndex(layout) {
        return Math.max(1, ...(layout || []).map((widget) => Number(widget?.zIndex) || 1));
    }

    function normalizeLayoutZIndices(layout) {
        let order = 1;
        return (layout || []).map((widget) => ({
            ...widget,
            zIndex: Number.isFinite(Number(widget?.zIndex)) ? Number(widget.zIndex) : order++
        }));
    }

    function sortLayoutForCanvas(layout, viewportWidth = 0) {
        return (layout || [])
            .filter((widget) => widget.visible !== false)
            .slice()
            .sort((a, b) => {
                const zDiff = (Number(a?.zIndex) || 1) - (Number(b?.zIndex) || 1);
                if (zDiff !== 0) return zDiff;
                const aRect = getWidgetDesktopRect(a, viewportWidth);
                const bRect = getWidgetDesktopRect(b, viewportWidth);
                return aRect.top - bRect.top || aRect.left - bRect.left || String(a.label).localeCompare(String(b.label));
            });
    }

    function computeDesktopCanvasHeight(layout, viewportWidth = 0) {
        const visible = (layout || []).filter((widget) => widget.visible !== false);
        const minimumHeight = Math.max(420, Math.round((window.innerHeight || 900) - 320));
        if (!visible.length) return minimumHeight;
        const bottom = Math.max(...visible.map((widget) => {
            const rect = getWidgetDesktopRect(widget, viewportWidth);
            return rect.top + rect.height;
        }));
        return Math.max(Math.round(bottom + 72), minimumHeight);
    }

    function desktopRectsOverlap(a, b) {
        if (!a || !b) return false;
        return !(
            a.left + a.width <= b.left
            || b.left + b.width <= a.left
            || a.top + a.height <= b.top
            || b.top + b.height <= a.top
        );
    }

    function getWidgetOverlapIds(layout, viewportWidth = 0, useDesktopRects = false) {
        const visible = (layout || []).filter((widget) => widget.visible !== false);
        const overlaps = new Set();
        for (let i = 0; i < visible.length; i += 1) {
            const a = visible[i];
            const aRect = useDesktopRects
                ? getWidgetDesktopRect(a, viewportWidth)
                : { left: a.x, top: a.y, width: a.w, height: a.h };
            for (let j = i + 1; j < visible.length; j += 1) {
                const b = visible[j];
                const bRect = useDesktopRects
                    ? getWidgetDesktopRect(b, viewportWidth)
                    : { left: b.x, top: b.y, width: b.w, height: b.h };
                const overlap = useDesktopRects
                    ? desktopRectsOverlap(aRect, bRect)
                    : !(aRect.left + aRect.width <= bRect.left
                        || bRect.left + bRect.width <= aRect.left
                        || aRect.top + aRect.height <= bRect.top
                        || bRect.top + bRect.height <= aRect.top);
                if (!overlap) continue;
                overlaps.add(a.instanceId);
                overlaps.add(b.instanceId);
            }
        }
        return overlaps;
    }

    function findNextDesktopRect(widget, occupiedRects, viewportWidth = 0) {
        const metrics = getDesktopCanvasMetrics(viewportWidth);
        const seed = normalizeDesktopRect(widget, gridRectToDesktopRect(widget, metrics.width), metrics.width);
        const maxTop = Math.max(
            Math.round((window.innerHeight || 900) * 1.8),
            ...occupiedRects.map((rect) => rect.top + rect.height + metrics.gapY),
            seed.top + 800
        );
        for (let top = 0; top <= maxTop; top += HOME_WINDOW_SNAP) {
            for (let left = 0; left <= Math.max(0, metrics.width - seed.width); left += HOME_WINDOW_SNAP) {
                const candidate = normalizeDesktopRect(widget, { left, top, width: seed.width, height: seed.height }, metrics.width);
                if (!occupiedRects.some((rect) => desktopRectsOverlap(candidate, rect))) {
                    return candidate;
                }
            }
        }
        return normalizeDesktopRect(widget, {
            left: 0,
            top: Math.max(0, ...occupiedRects.map((rect) => rect.top + rect.height + metrics.gapY), 0),
            width: seed.width,
            height: seed.height
        }, metrics.width);
    }


    function buildPairListRows(rows, icon = 'fas fa-circle') {
        return (rows || []).map((row) => ({
            icon,
            title: cleanupUiText(row?.[0], 'Signal'),
            copy: cleanupUiText(row?.[1], '--')
        }));
    }

    function cloneLayoutWidgets(layout) {
        return (layout || []).map((widget) => ({ ...widget }));
    }

    function widgetsOverlap(a, b) {
        if (!a || !b || a.instanceId === b.instanceId) return false;
        if (a.visible === false || b.visible === false) return false;
        return !(
            a.x + a.w <= b.x
            || b.x + b.w <= a.x
            || a.y + a.h <= b.y
            || b.y + b.h <= a.y
        );
    }

    function createWidgetInstance(definition, overrides = {}) {
        const base = definition || {};
        const minW = normalizeWidgetWidth(base.minW, base.minW || 3, 1, HOME_GRID_COLUMNS);
        const maxW = normalizeWidgetWidth(base.maxW, base.maxW || HOME_GRID_COLUMNS, minW, HOME_GRID_COLUMNS);
        const minH = normalizeWidgetHeight(base.minH, base.minH || 3, 2, 20);
        const maxH = normalizeWidgetHeight(base.maxH, base.maxH || 12, minH, 24);
        const width = normalizeWidgetWidth(overrides.w ?? overrides.span ?? base.w ?? 4, base.w ?? 4, minW, maxW);
        const height = normalizeWidgetHeight(overrides.h ?? base.h ?? 4, base.h ?? 4, minH, maxH);
        return {
            sourceType: base.sourceType || 'system',
            instanceId: String(overrides.instanceId || base.instanceId || base.widgetId || base.id || `widget-${Date.now()}`),
            widgetId: String(base.widgetId || base.id || overrides.widgetId || 'widget'),
            renderType: base.renderType || 'list',
            label: cleanupUiText(overrides.label ?? base.label, 'Widget'),
            title: cleanupUiText(overrides.title ?? base.title, cleanupUiText(overrides.label ?? base.label, 'Widget')),
            copy: cleanupUiText(overrides.copy ?? base.copy, ''),
            meta: cleanupUiText(overrides.meta ?? base.meta, ''),
            tone: cleanupUiText(overrides.tone ?? base.tone, 'default'),
            icon: cleanupUiText(overrides.icon ?? base.icon, 'fas fa-circle'),
            pageId: overrides.pageId || base.pageId || '',
            rows: Array.isArray(overrides.rows) ? overrides.rows : (Array.isArray(base.rows) ? base.rows : []),
            actions: Array.isArray(overrides.actions) ? overrides.actions : (Array.isArray(base.actions) ? base.actions : []),
            tiles: Array.isArray(overrides.tiles) ? overrides.tiles : (Array.isArray(base.tiles) ? base.tiles : []),
            alert: overrides.alert || base.alert || null,
            heroModel: overrides.heroModel || base.heroModel || null,
            adminOperations: overrides.adminOperations || base.adminOperations || null,
            visible: overrides.visible !== false && base.visible !== false,
            critical: overrides.critical ?? base.critical ?? false,
            softLock: overrides.softLock ?? base.softLock ?? Boolean(base.critical),
            custom: overrides.custom ?? base.custom ?? false,
            pinType: overrides.pinType || base.pinType || '',
            sourceId: overrides.sourceId || base.sourceId || '',
            status: cleanupUiText(overrides.status ?? base.status, ''),
            progress: clampPercent(overrides.progress ?? base.progress ?? 0, 0),
            description: cleanupUiText(overrides.description ?? base.description, ''),
            minimized: overrides.minimized === true || base.minimized === true,
            restoreRect: overrides.restoreRect || base.restoreRect || null,
            restoreDesktopRect: overrides.restoreDesktopRect || base.restoreDesktopRect || null,
            restoreDesktopRectViewportWidth: Number(overrides.restoreDesktopRectViewportWidth ?? base.restoreDesktopRectViewportWidth) || 0,
            minW,
            maxW,
            minH,
            maxH,
            w: width,
            h: height,
            x: normalizeWidgetX(overrides.x ?? base.x ?? 1, width, base.x ?? 1),
            y: normalizeWidgetY(overrides.y ?? base.y ?? 1, base.y ?? 1),
            desktopRect: overrides.desktopRect || base.desktopRect || null,
            desktopRectViewportWidth: Number(overrides.desktopRectViewportWidth ?? base.desktopRectViewportWidth) || 0,
            zIndex: Number(overrides.zIndex ?? base.zIndex ?? 1) || 1
        };
    }

    function createShortcutWidgetInstance(values, role = getEffectiveRole(), overrides = {}) {
        const shortcut = sanitizeShortcutDefinition(values, role);
        if (!shortcut) return null;
        return createWidgetInstance({
            sourceType: 'shortcut',
            widgetId: shortcut.id,
            instanceId: shortcut.id,
            renderType: 'shortcut',
            label: shortcut.label,
            title: shortcut.label,
            copy: shortcut.copy,
            meta: shortcut.meta,
            tone: shortcut.tone,
            icon: shortcut.icon,
            pageId: shortcut.pageId,
            status: shortcut.status,
            progress: shortcut.progress,
            minW: 2,
            maxW: 6,
            minH: 3,
            maxH: 8,
            w: 3,
            h: 4,
            visible: shortcut.visible !== false,
            custom: true,
            critical: false
        }, overrides);
    }

    function createPinnedWidgetInstance(values, overrides = {}) {
        const sourceId = cleanupUiText(values?.sourceId, '');
        if (!sourceId) return null;
        return createWidgetInstance({
            sourceType: 'pinned',
            widgetId: cleanupUiText(values?.widgetId, values?.pinType || 'pinned'),
            instanceId: cleanupUiText(values?.instanceId, `${values?.pinType || 'pin'}-${sourceId}-${Math.random().toString(36).slice(2, 7)}`),
            renderType: 'pinned',
            label: cleanupUiText(values?.label, 'Pinned record'),
            title: cleanupUiText(values?.title, values?.label || 'Pinned record'),
            copy: cleanupUiText(values?.copy, 'Open this record from the dashboard.'),
            meta: cleanupUiText(values?.meta, 'Pinned'),
            tone: cleanupUiText(values?.tone, 'royal'),
            icon: cleanupUiText(values?.icon, 'fas fa-thumbtack'),
            pageId: cleanupUiText(values?.pageId, 'home'),
            status: cleanupUiText(values?.status, 'Open record'),
            progress: clampPercent(values?.progress ?? 62, 62),
            pinType: cleanupUiText(values?.pinType, 'record'),
            sourceId,
            minW: 2,
            maxW: 6,
            minH: 3,
            maxH: 8,
            w: 3,
            h: 4,
            visible: values?.visible !== false,
            custom: true,
            critical: false
        }, overrides);
    }

    function normalizeStoredLayoutWidget(item, definitionMap, role) {
        if (!item || typeof item !== 'object') return null;
        if ((item.sourceType || '') === 'shortcut' || (item.pageId && !definitionMap.has(String(item.widgetId || item.id || '')))) {
            return createShortcutWidgetInstance({
                id: item.instanceId || item.id,
                pageId: item.pageId,
                label: item.label,
                copy: item.copy,
                icon: item.icon,
                tone: item.tone,
                meta: item.meta,
                status: item.status,
                progress: item.progress,
                visible: item.visible !== false
            }, role, item);
        }
        if ((item.sourceType || '') === 'pinned' || item.pinType) {
            return createPinnedWidgetInstance({
                widgetId: item.widgetId || item.id,
                instanceId: item.instanceId || item.id,
                pageId: item.pageId,
                label: item.label,
                title: item.title,
                copy: item.copy,
                meta: item.meta,
                tone: item.tone,
                icon: item.icon,
                status: item.status,
                progress: item.progress,
                pinType: item.pinType,
                sourceId: item.sourceId,
                visible: item.visible !== false
            }, item);
        }
        const definition = definitionMap.get(String(item.widgetId || item.id || ''));
        if (!definition) return null;
        return createWidgetInstance(definition, item);
    }

    function findNextAvailableSlot(layout, width = 4, height = 4, ignoreId = '') {
        const visible = (layout || []).filter((widget) => widget.visible !== false && widget.instanceId !== ignoreId);
        for (let row = 1; row < 240; row += 1) {
            for (let col = 1; col <= (HOME_GRID_COLUMNS - width + 1); col += 1) {
                const candidate = { instanceId: '__candidate__', x: col, y: row, w: width, h: height, visible: true };
                if (!visible.some((widget) => widgetsOverlap(candidate, widget))) {
                    return { x: col, y: row };
                }
            }
        }
        return { x: 1, y: Math.max(1, ...visible.map((widget) => widget.y + widget.h)) };
    }

    function stabilizeLayout(layout, priorityId = '') {
        const original = cloneLayoutWidgets(layout);
        const hidden = original.filter((widget) => widget.visible === false).map((widget) => ({
            ...widget,
            w: normalizeWidgetWidth(widget.w, widget.w || 4, widget.minW || 2, widget.maxW || HOME_GRID_COLUMNS),
            h: normalizeWidgetHeight(widget.h, widget.h || 4, widget.minH || 3, widget.maxH || 12),
            x: normalizeWidgetX(widget.x, widget.w || 4, 1),
            y: normalizeWidgetY(widget.y, 1)
        }));
        const visible = original
            .filter((widget) => widget.visible !== false)
            .map((widget) => ({
                ...widget,
                w: normalizeWidgetWidth(widget.w, widget.w || 4, widget.minW || 2, widget.maxW || HOME_GRID_COLUMNS),
                h: normalizeWidgetHeight(widget.h, widget.h || 4, widget.minH || 3, widget.maxH || 12),
                x: normalizeWidgetX(widget.x, widget.w || 4, 1),
                y: normalizeWidgetY(widget.y, 1)
            }));

        const highestZ = getHighestWidgetZIndex(visible);
        const visibleMap = new Map(visible.map((widget) => [
            widget.instanceId,
            priorityId && widget.instanceId === priorityId
                ? { ...widget, zIndex: highestZ + 1 }
                : widget
        ]));
        return original.map((widget) => {
            if (widget.visible === false) {
                return hidden.find((item) => item.instanceId === widget.instanceId) || widget;
            }
            return visibleMap.get(widget.instanceId) || widget;
        });
    }

    function stepWidgetSize(widget, axis, direction) {
        const current = Number(axis === 'w' ? widget.w : widget.h) || 4;
        const next = current + (direction > 0 ? 1 : -1);
        if (axis === 'w') {
            return normalizeWidgetWidth(next, current, widget.minW || 2, Math.min(widget.maxW || HOME_GRID_COLUMNS, HOME_GRID_COLUMNS - widget.x + 1));
        }
        return normalizeWidgetHeight(next, current, widget.minH || 3, widget.maxH || 12);
    }

    function buildHomeWidgetContextUncached(role, model) {
        const user = getCurrentUserSafe();
        const facultyCode = getCurrentFacultyCode();
        const facultyName = getFacultyName(facultyCode);
        const notifications = getNotificationSnapshot(user);
        const messenger = getMessengerSnapshot(user);
        const updates = getRecentHomeUpdates(user, 5);
        const ordersSnapshot = getOrdersSnapshot(user);
        const context = {
            role,
            model,
            user,
            facultyCode,
            facultyName,
            notifications,
            messenger,
            updates,
            ordersSnapshot,
            facultyOrders: [],
            studentRequests: [],
            studentScheduleRows: [],
            studentScoreRows: [],
            facultyScheduleRows: [],
            gradebookRows: [],
            tickets: [],
            articles: [],
            openTickets: [],
            waitingForService: 0,
            waitingForStudent: 0,
            curriculum: [],
            students: [],
            exams: []
        };

        if (role === 'student') {
            context.studentRequests = (KIU_STATE.chancelleryRequests || []).filter((request) => {
                const owner = String(request?.studentId || request?.userId || request?.createdBy || request?.authorId || '');
                return owner && String(user?.id || '') === owner;
            });
            context.studentScheduleRows = getStudentScheduleRows(user);
            context.studentScoreRows = getStudentScoreRows(user);
            return context;
        }

        if (role === 'professor' || role === 'ta') {
            context.facultyScheduleRows = getFacultyScheduleRows();
            context.gradebookRows = getGradebookRowsForWidget();
            return context;
        }

        if (role === 'student_service') {
            const serviceStores = typeof ensureStudentServiceStores === 'function'
                ? ensureStudentServiceStores()
                : { tickets: [], articles: [] };
            context.tickets = (serviceStores.tickets || []).filter((ticket) => {
                const ticketFaculty = String(ticket?.facultyCode || ticket?.faculty || '').trim().toUpperCase();
                if (!ticketFaculty) return true;
                return ticketFaculty === facultyCode || ticketFaculty === facultyName.toUpperCase();
            });
            context.articles = (serviceStores.articles || []).filter((article) => {
                const articleFaculty = String(article?.facultyCode || article?.faculty || '').trim().toUpperCase();
                if (!articleFaculty) return true;
                return articleFaculty === facultyCode || articleFaculty === facultyName.toUpperCase();
            });
            context.openTickets = context.tickets.filter((ticket) => String(ticket.status || '').toLowerCase() !== 'resolved');
            context.waitingForService = context.openTickets.filter((ticket) => String(ticket.assigneeState || ticket.status || '').toLowerCase().includes('service')).length;
            context.waitingForStudent = context.openTickets.filter((ticket) => String(ticket.assigneeState || ticket.status || '').toLowerCase().includes('student')).length;
            return context;
        }

        context.facultyOrders = getCurrentFacultyOrders();
        context.curriculum = typeof getActiveCurriculum === 'function' ? (getActiveCurriculum(facultyCode) || []) : [];
        const usersByRole = getDomainSafe().usersByRole || {};
        context.students = typeof getAllStudents === 'function' ? (getAllStudents(facultyCode) || []) : (usersByRole.student || []);
        context.exams = typeof ensureAdminExamState === 'function' ? ((ensureAdminExamState(facultyCode)?.quizzes) || []) : [];
        return context;
    }

    function buildHomeWidgetContext(role, model) {
        const fingerprint = typeof window.buildHomeDataFingerprint === 'function'
            ? `${role}|${window.buildHomeDataFingerprint(role)}`
            : '';
        if (fingerprint) {
            const fpCache = window.HOME_WIDGET_FINGERPRINT_CACHE
                || (window.HOME_WIDGET_FINGERPRINT_CACHE = new Map());
            if (fpCache.has(fingerprint)) return fpCache.get(fingerprint);
            const context = buildHomeWidgetContextUncached(role, model);
            fpCache.set(fingerprint, context);
            return context;
        }
        if (model && typeof model === 'object') {
            const cached = HOME_WIDGET_CONTEXT_CACHE.get(model);
            if (cached && cached.role === role) return cached.value;
        }
        const context = buildHomeWidgetContextUncached(role, model);
        if (model && typeof model === 'object') {
            HOME_WIDGET_CONTEXT_CACHE.set(model, { role, value: context });
        }
        return context;
    }

    function withGeometry(role, widgetId, config, overrides = {}) {
        const geometrySet = HOME_DEFAULT_WIDGET_GEOMETRY[role] || HOME_DEFAULT_WIDGET_GEOMETRY.student;
        const geometry = geometrySet[widgetId] || { x: 1, y: 1, w: 4, h: 4 };
        return {
            widgetId,
            instanceId: widgetId,
            sourceType: 'system',
            ...geometry,
            ...config,
            ...overrides
        };
    }

    function buildSystemWidgetDefinitionsUncached(role, model) {
        const context = buildHomeWidgetContext(role, model);
        const notificationsRows = (context.updates || []).length
            ? context.updates.map((item) => ({ icon: item.icon || 'fas fa-bell', title: cleanupUiText(item.title, 'Update'), copy: cleanupUiText(item.when, 'Recently') }))
            : [{ icon: 'fas fa-bell', title: 'No new updates', copy: 'Fresh orders, notifications, and tracked changes will appear here.' }];
        const facultyOrderRows = getOrderRowsForWidget(context.facultyOrders, 4, 'Faculty orders and operational notices will appear here.');
        const personalOrderRows = getOrderRowsForWidget(context.ordersSnapshot.orders, 4, 'Official orders and student notices will appear here.');
        const messengerRows = getMessengerRowsForWidget(context.messenger);
        const studentRequestRows = getStudentRequestRowsForWidget(context.studentRequests);
        const quickWidget = withGeometry(role, 'quick', {
            renderType: 'quick',
            label: 'Workspace hub',
            title: 'Workspace hub',
            copy: 'The quickest path into the systems tied to this view.',
            meta: ROLE_LABELS[role] || 'Portal',
            tiles: model.quick || [],
            pageId: 'home',
            minW: 6,
            maxW: 12,
            minH: 5,
            maxH: 12,
            critical: true,
            defaultVisible: true
        });
        const alertWidget = withGeometry(role, 'alert', {
            renderType: 'alert',
            label: 'Priority banner',
            title: 'Priority banner',
            copy: model.alert?.copy || '',
            alert: model.alert || null,
            minW: 8,
            maxW: 12,
            minH: 2,
            maxH: 4,
            defaultVisible: Boolean(model.alert),
            visible: Boolean(model.alert)
        });
        const heroWidget = withGeometry(role, 'hero', {
            renderType: 'hero',
            label: 'Hero overview',
            title: model.title,
            copy: model.copy,
            heroModel: model,
            minW: 6,
            maxW: 12,
            minH: 8,
            maxH: 14,
            critical: true,
            defaultVisible: true
        });

        if (role === 'student') {
            const semester = typeof getCurrentStudentSemesterNumber === 'function' ? getCurrentStudentSemesterNumber(context.user) : (KIU_STATE.activeSemester || 1);
            const balance = typeof getEffectiveTuitionBalance === 'function' ? getEffectiveTuitionBalance(context.user?.id) : 0;
            const completed = typeof getStudentCompletedEctsTotal === 'function' ? getStudentCompletedEctsTotal(context.user?.id, context.facultyCode) : 0;
            const performance = getStudentPerformanceMetric(context.user);
            return [
                alertWidget,
                heroWidget,
                withGeometry(role, 'student-schedule', { renderType: 'list', label: 'Today schedule', title: 'Todayâ€™s schedule', copy: 'Classes, rooms, and the next academic movement in your day.', meta: context.studentScheduleRows.length ? 'Live' : 'Planning', rows: context.studentScheduleRows.length ? context.studentScheduleRows : [{ icon: 'fas fa-calendar-week', title: 'No scheduled classes yet', copy: 'Select sections in registration to populate todayâ€™s teaching plan.' }], pageId: 'timetable', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'student-registration', { renderType: 'list', label: 'Registration lane', title: 'Registration lane', copy: 'Registration access, finance status, and progress conditions for the active term.', meta: KIU_STATE.registrationOpen ? 'Open now' : 'Closed', rows: [{ icon: 'fas fa-check-square', title: KIU_STATE.registrationOpen ? 'Registration is open' : 'Registration is closed', copy: KIU_STATE.registrationOpen ? 'Sections, electives, and free-credit choices can still be changed.' : 'Open registration again only when the next academic window begins.' }, { icon: 'fas fa-credit-card', title: balance > 0 ? `${balance} GEL balance` : 'Finance access clear', copy: balance > 0 ? 'A finance hold may block parts of the portal until payment or review is completed.' : 'No finance hold is blocking this semester right now.' }, { icon: 'fas fa-address-card', title: `${completed} completed ECTS`, copy: `${performance.label}: ${performance.value}` }], pageId: 'registration', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'student-scores', { renderType: 'list', label: 'Current scores', title: 'Current scores', copy: 'Live grade signals from the subjects already carrying marks.', meta: performance.value || `S${semester}`, rows: context.studentScoreRows.length ? context.studentScoreRows : [{ icon: 'fas fa-chart-line', title: 'No scored subjects yet', copy: 'Scores will appear once coursework or exams are recorded in the gradebook.' }], pageId: 'study-card', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'student-updates', { renderType: 'list', label: 'Official updates', title: 'Official updates', copy: 'The newest portal changes tied to your student profile.', meta: context.notifications.unread > 0 ? `${context.notifications.unread} unread` : 'Inbox', rows: notificationsRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'student-support', { renderType: 'list', label: 'Support access', title: 'Support & access', copy: 'Requests, Student Service, and tracked support movement around your account.', meta: context.studentRequests.length ? 'Open' : 'Access', rows: [...studentRequestRows.slice(0, 2), { icon: 'fas fa-headset', title: 'Student Service', copy: 'Ask for help, review articles, and continue tracked requests without leaving the main dashboard.' }], pageId: 'student-service', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                quickWidget,
                withGeometry(role, 'student-orders', { renderType: 'list', label: 'Orders', title: 'Orders & notices', copy: 'Official orders that affect records, access, or semester timing.', meta: `${context.ordersSnapshot.orders.length} total`, rows: personalOrderRows, pageId: 'orders', minW: 3, maxW: 6, minH: 3, maxH: 8, defaultVisible: true }),
                withGeometry(role, 'student-inbox', { renderType: 'list', label: 'Messages', title: 'Messages', copy: 'Conversation signals from support and academic follow-up.', meta: context.messenger.unread > 0 ? `${context.messenger.unread} unread` : 'Quiet', rows: messengerRows, pageId: 'social', minW: 3, maxW: 6, minH: 3, maxH: 8, defaultVisible: true }),
                withGeometry(role, 'student-performance', { renderType: 'list', label: 'Performance pulse', title: 'Performance pulse', copy: 'Semester position and academic record in one smaller panel.', meta: `Semester S${semester}`, rows: buildPairListRows(model.focus?.rows || [], 'fas fa-circle-notch'), pageId: 'study-card', minW: 3, maxW: 6, minH: 3, maxH: 8, defaultVisible: false, visible: false })
            ];
        }

        if (role === 'professor') {
            return [
                alertWidget,
                heroWidget,
                withGeometry(role, 'professor-schedule', { renderType: 'list', label: 'Teaching schedule', title: 'Todayâ€™s teaching', copy: 'Assigned sessions, rooms, and the next teaching block.', meta: context.facultyScheduleRows.length ? 'Live' : 'Planning', rows: context.facultyScheduleRows.length ? context.facultyScheduleRows : [{ icon: 'fas fa-calendar-week', title: 'No active teaching blocks', copy: 'Assigned sections will appear here when a faculty schedule is available.' }], pageId: 'timetable', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'professor-gradebook', { renderType: 'list', label: 'Grade queue', title: 'Grade queue', copy: 'Current rosters and assessment lanes linked to your teaching account.', meta: context.gradebookRows.length ? `${context.gradebookRows.length} rosters` : 'Ready', rows: context.gradebookRows, pageId: 'lms', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'professor-attendance', { renderType: 'list', label: 'Attendance follow-up', title: 'Attendance follow-up', copy: 'Attendance signals drawn from the active faculty timetable.', meta: 'Faculty', rows: getAttendanceRowsForWidget(typeof getCurrentFacultyScheduleItems === 'function' ? getCurrentFacultyScheduleItems() : []), pageId: 'timetable', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'professor-messages', { renderType: 'list', label: 'Messages & appeals', title: 'Messages & appeals', copy: 'Communication that can affect teaching rhythm, student support, or follow-up.', meta: context.messenger.unread > 0 ? `${context.messenger.unread} unread` : 'Inbox', rows: messengerRows, pageId: 'social', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'professor-orders', { renderType: 'list', label: 'Faculty orders', title: 'Orders & notices', copy: 'Official orders and notices published into the faculty operating lane.', meta: `${context.ordersSnapshot.orders.length} orders`, rows: personalOrderRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                quickWidget,
                withGeometry(role, 'professor-updates', { renderType: 'list', label: 'Recent changes', title: 'Recent changes', copy: 'Latest operational signals from KIU systems around your courses.', meta: context.notifications.unread > 0 ? `${context.notifications.unread} unread` : 'Portal', rows: notificationsRows, pageId: 'orders', minW: 3, maxW: 6, minH: 5, maxH: 12, defaultVisible: true })
            ];
        }

        if (role === 'ta') {
            return [
                alertWidget,
                heroWidget,
                withGeometry(role, 'ta-schedule', { renderType: 'list', label: 'Support schedule', title: 'Support schedule', copy: 'Labs, discussion sections, and the next support block.', meta: context.facultyScheduleRows.length ? 'Live' : 'Planning', rows: context.facultyScheduleRows.length ? context.facultyScheduleRows : [{ icon: 'fas fa-calendar-week', title: 'No section schedule yet', copy: 'TA support blocks will appear once sections are assigned.' }], pageId: 'timetable', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'ta-attendance', { renderType: 'list', label: 'Attendance follow-up', title: 'Attendance follow-up', copy: 'Attendance status and follow-up risk across the active support timetable.', meta: 'Support', rows: getAttendanceRowsForWidget(typeof getCurrentFacultyScheduleItems === 'function' ? getCurrentFacultyScheduleItems() : []), pageId: 'timetable', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'ta-messages', { renderType: 'list', label: 'Section messages', title: 'Section messages', copy: 'Student and faculty communication tied to support delivery.', meta: context.messenger.unread > 0 ? `${context.messenger.unread} unread` : 'Inbox', rows: messengerRows, pageId: 'social', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'ta-orders', { renderType: 'list', label: 'Orders', title: 'Orders & notices', copy: 'Faculty and campus notices that affect support operations.', meta: `${context.ordersSnapshot.orders.length} orders`, rows: personalOrderRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'ta-gradebook', { renderType: 'list', label: 'Roster support', title: 'Roster support', copy: 'Current gradebook or roster lanes where support staff may need to follow up.', meta: context.gradebookRows.length ? `${context.gradebookRows.length} groups` : 'Ready', rows: context.gradebookRows, pageId: 'lms', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                quickWidget,
                withGeometry(role, 'ta-alerts', { renderType: 'list', label: 'Support alerts', title: 'Support alerts', copy: 'Operational change, faculty follow-up, and requests around the sections you support.', meta: context.notifications.unread > 0 ? `${context.notifications.unread} unread` : 'Quiet', rows: notificationsRows, pageId: 'orders', minW: 3, maxW: 6, minH: 5, maxH: 12, defaultVisible: true })
            ];
        }

        if (role === 'student_service') {
            return [
                alertWidget,
                heroWidget,
                withGeometry(role, 'service-queue', { renderType: 'list', label: 'Live queue', title: 'Live queue', copy: 'Open service cases and the current waiting distribution in the faculty lane.', meta: `${context.openTickets.length} open`, rows: getTicketRowsForWidget(context.openTickets, 'The service queue is clear right now.'), pageId: 'student-service', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'service-knowledge', { renderType: 'list', label: 'Knowledge base', title: 'Knowledge base', copy: 'Guidance material available to reduce repetitive support work.', meta: `${context.articles.length} articles`, rows: getArticleRowsForWidget(context.articles, 'Publish guidance articles to build the service knowledge layer.'), pageId: 'library', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'service-orders', { renderType: 'list', label: 'Orders', title: 'Orders & notices', copy: 'Orders, policies, and supporting notices for the service desk.', meta: `${context.ordersSnapshot.orders.length} orders`, rows: personalOrderRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'service-updates', { renderType: 'list', label: 'Recent updates', title: 'Recent updates', copy: 'The newest desk-facing changes sent into the portal.', meta: context.notifications.unread > 0 ? `${context.notifications.unread} unread` : 'Inbox', rows: notificationsRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                withGeometry(role, 'service-inbox', { renderType: 'list', label: 'Case routing', title: 'Case routing', copy: 'Where the active queue is waiting right now.', meta: 'Service', rows: [{ icon: 'fas fa-headset', title: `${context.waitingForService} waiting for service`, copy: 'Cases that need direct service-side action or assignment.' }, { icon: 'fas fa-user-clock', title: `${context.waitingForStudent} waiting for student`, copy: 'Cases where the next move belongs to the student or requester.' }, { icon: 'fas fa-circle-check', title: `${Math.max(0, context.tickets.length - context.openTickets.length)} resolved`, copy: 'Resolved or closed service items in the recent store.' }], pageId: 'student-service', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
                quickWidget,
                withGeometry(role, 'service-escalations', { renderType: 'list', label: 'Escalations & inbox', title: 'Escalations & inbox', copy: 'Pinned requests, recent messages, and cases that may need escalation.', meta: context.messenger.unread > 0 ? `${context.messenger.unread} unread` : 'Desk', rows: messengerRows, pageId: 'social', minW: 3, maxW: 6, minH: 5, maxH: 12, defaultVisible: true })
            ];
        }

        return [
            alertWidget,
            heroWidget,
            withGeometry(role, 'admin-curriculum', { renderType: 'list', label: 'Curriculum health', title: 'Curriculum health', copy: 'Subjects and curriculum records attached to the selected faculty profile.', meta: `${context.curriculum.length} items`, rows: context.curriculum.length ? context.curriculum.slice(0, 4).map((item) => ({ icon: 'fas fa-layer-group', title: getSubjectLabel(item.id, item.name || item.title || item.courseId), copy: cleanupUiText(item.faculty || context.facultyName, context.facultyName) })) : [{ icon: 'fas fa-layer-group', title: 'No curriculum items', copy: 'Open Admin Tools to start building subjects, structures, and module records.' }], pageId: 'admin-tools', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
            withGeometry(role, 'admin-registry', { renderType: 'list', label: 'Student registry', title: 'Student registry', copy: 'A quick pulse on the students currently scoped to this faculty.', meta: `${context.students.length} students`, rows: getAdminStudentRows(context.students), pageId: 'students-admin', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
            withGeometry(role, 'admin-ops', { renderType: 'admin-ops', label: 'Admin operations', title: model.adminOperations?.title || 'Admin operations', copy: model.adminOperations?.copy || '', adminOperations: model.adminOperations || null, minW: 8, maxW: 12, minH: 6, maxH: 14, critical: true, defaultVisible: true }),
            withGeometry(role, 'admin-systems', { renderType: 'list', label: 'Systems lane', title: 'Systems lane', copy: 'One-click operational surfaces for the main administrative workflows.', meta: 'Control', rows: [{ icon: 'fas fa-calendar-plus', title: `${context.students.length} students in scheduler scope`, copy: 'Open the master scheduler to coordinate rooms, weeks, and section timing.' }, { icon: 'fas fa-users-cog', title: `${(getDomainSafe().usersByRole?.professor || []).length + (getDomainSafe().usersByRole?.ta || []).length + (getDomainSafe().usersByRole?.student_service || []).length} faculty-side staff`, copy: 'Provision professors, TAs, and service users from the selected faculty lens.' }, { icon: 'fas fa-file-signature', title: `${context.exams.length} exam packages`, copy: 'Exam records available for review, publishing, or follow-up.' }], pageId: 'admin-scheduler', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
            withGeometry(role, 'admin-orders', { renderType: 'list', label: 'Faculty orders', title: 'Faculty orders', copy: 'Operational notices and orders tied to the active faculty dashboard.', meta: `${context.facultyOrders.length} orders`, rows: facultyOrderRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
            withGeometry(role, 'admin-updates', { renderType: 'list', label: 'Recent changes', title: 'Recent changes', copy: 'System-level changes and signals moving through the portal.', meta: context.notifications.unread > 0 ? `${context.notifications.unread} unread` : 'Portal', rows: notificationsRows, pageId: 'orders', minW: 3, maxW: 6, minH: 4, maxH: 10, defaultVisible: true }),
            quickWidget,
            withGeometry(role, 'admin-exams', { renderType: 'list', label: 'Exam lane', title: 'Exam lane', copy: 'Assessment packages and publication status for the selected faculty.', meta: `${context.exams.length} exams`, rows: context.exams.length ? context.exams.slice(0, 4).map((exam) => ({ icon: 'fas fa-file-signature', title: cleanupUiText(exam.title || exam.name, 'Exam package'), copy: cleanupUiText(exam.status || 'Draft', 'Draft') })) : [{ icon: 'fas fa-file-signature', title: 'No exam packages yet', copy: 'Open Exams to create or review packages for the active faculty.' }], pageId: 'exams', minW: 3, maxW: 6, minH: 3, maxH: 8, defaultVisible: false, visible: false })
        ];
    }

    function sanitizeWidgetRowText(row) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
        const next = { ...row };
        ['title', 'copy', 'label', 'value', 'detail', 'meta', 'status'].forEach((key) => {
            if (typeof next[key] === 'string') {
                next[key] = cleanupUiText(next[key], next[key]);
            }
        });
        return next;
    }

    function sanitizeWidgetDefinitionText(definition) {
        if (!definition || typeof definition !== 'object') return definition;
        const next = { ...definition };
        ['label', 'title', 'copy', 'meta', 'status'].forEach((key) => {
            if (typeof next[key] === 'string') {
                next[key] = cleanupUiText(next[key], next[key]);
            }
        });
        if (Array.isArray(next.rows)) {
            next.rows = next.rows.map((row) => sanitizeWidgetRowText(row));
        }
        if (Array.isArray(next.tiles)) {
            next.tiles = next.tiles.map((tile) => sanitizeWidgetRowText(tile));
        }
        if (next.alert && typeof next.alert === 'object') {
            next.alert = sanitizeWidgetRowText(next.alert);
        }
        return next;
    }

    function buildSystemWidgetDefinitions(role, model) {
        const fingerprint = typeof window.buildHomeDataFingerprint === 'function'
            ? `${role}|${window.buildHomeDataFingerprint(role)}`
            : '';
        if (fingerprint) {
            const fpCache = window.HOME_WIDGET_DEFINITIONS_FINGERPRINT_CACHE
                || (window.HOME_WIDGET_DEFINITIONS_FINGERPRINT_CACHE = new Map());
            if (fpCache.has(fingerprint)) return fpCache.get(fingerprint);
            const definitions = buildSystemWidgetDefinitionsUncached(role, model).map((definition) => sanitizeWidgetDefinitionText(definition));
            fpCache.set(fingerprint, definitions);
            return definitions;
        }
        if (model && typeof model === 'object') {
            const cached = HOME_WIDGET_DEFINITIONS_CACHE.get(model);
            if (cached && cached.role === role) return cached.value;
        }
        const definitions = buildSystemWidgetDefinitionsUncached(role, model).map((definition) => sanitizeWidgetDefinitionText(definition));
        if (model && typeof model === 'object') {
            HOME_WIDGET_DEFINITIONS_CACHE.set(model, { role, value: definitions });
        }
        return definitions;
    }

    function buildHomeWidgetDefinitions(role, model) {
        return buildSystemWidgetDefinitions(role, model);
    }

    function buildPinnedRecordOptions(role, model) {
        const context = buildHomeWidgetContext(role, model);
        if (role === 'student') {
            return [
                ...context.studentScheduleRows.slice(0, 4).map((row, index) => ({ instanceId: `pin-subject-${index}-${Date.now()}`, widgetId: 'pin-subject', pinType: 'student-subject', sourceId: `${row.title}-${index}`, label: row.title, title: row.title, copy: row.copy, meta: 'Pinned subject', icon: 'fas fa-book-reader', tone: 'warm', pageId: 'timetable', status: 'Open timetable' })),
                ...context.studentScoreRows.slice(0, 3).map((row, index) => ({ instanceId: `pin-score-${index}-${Date.now()}`, widgetId: 'pin-score', pinType: 'score-record', sourceId: `${row.title}-${index}`, label: row.title, title: row.title, copy: row.copy, meta: 'Pinned score', icon: 'fas fa-chart-line', tone: 'royal', pageId: 'study-card', status: 'Open study card' }))
            ];
        }
        if (role === 'professor' || role === 'ta') {
            return [
                ...context.facultyScheduleRows.slice(0, 4).map((row, index) => ({ instanceId: `pin-section-${index}-${Date.now()}`, widgetId: 'pin-section', pinType: 'teaching-section', sourceId: `${row.title}-${index}`, label: row.title, title: row.title, copy: row.copy, meta: 'Pinned section', icon: 'fas fa-calendar-week', tone: role === 'ta' ? 'support' : 'royal', pageId: 'timetable', status: 'Open schedule' })),
                ...context.gradebookRows.slice(0, 3).map((row, index) => ({ instanceId: `pin-gradebook-${index}-${Date.now()}`, widgetId: 'pin-gradebook', pinType: 'gradebook-group', sourceId: `${row.title}-${index}`, label: row.title, title: row.title, copy: row.copy, meta: 'Pinned roster', icon: 'fas fa-clipboard-check', tone: 'ink', pageId: 'lms', status: 'Open LMS' }))
            ];
        }
        if (role === 'student_service') {
            return [
                ...context.openTickets.slice(0, 4).map((ticket, index) => ({ instanceId: `pin-ticket-${ticket.id || index}-${Date.now()}`, widgetId: 'pin-ticket', pinType: 'service-ticket', sourceId: String(ticket.id || index), label: cleanupUiText(ticket.subject || ticket.category || ticket.title, 'Service case'), title: cleanupUiText(ticket.subject || ticket.category || ticket.title, 'Service case'), copy: `${cleanupUiText(ticket.status, 'Open')} - ${cleanupUiText(ticket.priority || 'Standard', 'Standard')}`, meta: 'Pinned ticket', icon: 'fas fa-headset', tone: 'support', pageId: 'student-service', status: 'Open service inbox' })),
                ...context.articles.slice(0, 3).map((article, index) => ({ instanceId: `pin-article-${article.id || index}-${Date.now()}`, widgetId: 'pin-article', pinType: 'knowledge-article', sourceId: String(article.id || index), label: cleanupUiText(article.title, 'Knowledge article'), title: cleanupUiText(article.title, 'Knowledge article'), copy: cleanupUiText(article.category || article.audience || 'Student guidance', 'Student guidance'), meta: 'Pinned article', icon: 'fas fa-book-open', tone: 'calm', pageId: 'library', status: 'Open library' }))
            ];
        }
        return [
            ...context.curriculum.slice(0, 4).map((item, index) => ({ instanceId: `pin-curriculum-${item.id || index}-${Date.now()}`, widgetId: 'pin-curriculum', pinType: 'curriculum-subject', sourceId: String(item.id || index), label: getSubjectLabel(item.id, item.name || item.title || item.courseId), title: getSubjectLabel(item.id, item.name || item.title || item.courseId), copy: cleanupUiText(item.faculty || context.facultyName, context.facultyName), meta: 'Pinned subject', icon: 'fas fa-layer-group', tone: 'support', pageId: 'admin-tools', status: 'Open Admin Tools' })),
            ...context.facultyOrders.slice(0, 3).map((order, index) => ({ instanceId: `pin-order-${order.id || index}-${Date.now()}`, widgetId: 'pin-order', pinType: 'order-notice', sourceId: String(order.id || index), label: cleanupUiText(order.title || order.type || order.id, 'Order'), title: cleanupUiText(order.title || order.type || order.id, 'Order'), copy: cleanupUiText(order.status || 'Published', 'Published'), meta: 'Pinned order', icon: 'fas fa-book-open', tone: 'ink', pageId: 'orders', status: 'Open orders' }))
        ];
    }

    resolveHomeLayout = function (role, model, overrideLayout = null) {
        const scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        const entry = getDashboardPreferenceEntry();
        const definitions = buildSystemWidgetDefinitions(role, model);
        const definitionMap = new Map(definitions.map((definition) => [definition.widgetId, definition]));
        const overrideProvided = Array.isArray(overrideLayout);
        const scopeSource = overrideProvided
            ? { version: ADVANCED_HOME_LAYOUT_VERSION, widgets: overrideLayout }
            : getScopeLayoutSource(entry.layoutsByScope?.[scopeKey], 'workspace');
        const savedScopeWidgets = scopeSource.widgets;

        let resolved = [];
        if (overrideProvided && Array.isArray(savedScopeWidgets)) {
            resolved = definitions.map((definition) => createWidgetInstance(definition, {
                visible: definition.defaultVisible !== false
            }));
            deserializeScopedWidgets(savedScopeWidgets, definitionMap, role).forEach((widget) => {
                const existingIndex = resolved.findIndex((item) => item.instanceId === widget.instanceId);
                if (existingIndex >= 0) resolved[existingIndex] = widget;
                else resolved.push(widget);
            });
        } else if (Array.isArray(savedScopeWidgets) && savedScopeWidgets.length) {
            resolved = deserializeScopedWidgets(savedScopeWidgets, definitionMap, role);
        } else {
            resolved = definitions.map((definition) => createWidgetInstance(definition, {
                visible: definition.defaultVisible !== false
            }));
            const legacyLayout = entry.layoutsByRole?.[role];
            if (Array.isArray(legacyLayout) && legacyLayout.length) {
                legacyLayout.forEach((legacy) => {
                    const match = resolved.find((widget) => widget.widgetId === legacy.id);
                    if (!match) return;
                    match.visible = legacy.visible !== false;
                    match.w = normalizeWidgetWidth(legacy.span ?? match.w, match.w, match.minW, match.maxW);
                    match.x = normalizeWidgetX(match.x, match.w, match.x);
                });
            }
            const legacyShortcuts = (entry.customShortcutsByRole?.[role] || [])
                .map((item) => createShortcutWidgetInstance(item, role))
                .filter(Boolean);
            legacyShortcuts.forEach((shortcut) => {
                const slot = findNextAvailableSlot(resolved, shortcut.w, shortcut.h);
                resolved.push({ ...shortcut, ...slot });
            });
        }

        const existingSystemIds = new Set(resolved.filter((widget) => widget.sourceType === 'system').map((widget) => widget.widgetId));
        definitions.forEach((definition) => {
            if (!existingSystemIds.has(definition.widgetId)) {
                resolved.push(createWidgetInstance(definition, { visible: false }));
            }
        });

        resolved = normalizeLayoutZIndices(stabilizeLayout(resolved));
        if (!overrideProvided && scopeSource.version > 0 && scopeSource.version < ADVANCED_HOME_LAYOUT_VERSION) {
            resolved = normalizeLayoutZIndices(buildPresentationLayout(role, model, resolved));
        }
        return resolved;
    };

    function resolveSavedHomeLayout(role, model) {
        const scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        const entry = getDashboardPreferenceEntry();
        const definitions = buildSystemWidgetDefinitions(role, model);
        const definitionMap = new Map(definitions.map((definition) => [definition.widgetId, definition]));
        const scopeSource = getScopeLayoutSource(entry.layoutsByScope?.[scopeKey], 'presentation');
        if (Array.isArray(scopeSource.widgets) && scopeSource.widgets.length) {
            const resolved = deserializeScopedWidgets(scopeSource.widgets, definitionMap, role);
            if (resolved.length) {
                return scopeSource.version >= ADVANCED_HOME_LAYOUT_VERSION
                    ? normalizeLayoutZIndices(resolved)
                    : buildPresentationLayout(role, model, resolved);
            }
        }
        const workspaceSource = getScopeLayoutSource(entry.layoutsByScope?.[scopeKey], 'workspace');
        const workspaceLayout = Array.isArray(workspaceSource.widgets) && workspaceSource.widgets.length
            ? resolveHomeLayout(role, model, workspaceSource.widgets)
            : resolveHomeLayout(role, model);
        return buildPresentationLayout(role, model, workspaceLayout);
    }

    serializeHomeLayout = function (layout) {
        return (layout || []).map((widget) => {
            const base = {
                instanceId: widget.instanceId,
                widgetId: widget.widgetId,
                sourceType: widget.sourceType,
                renderType: widget.renderType,
                x: widget.x,
                y: widget.y,
                w: widget.w,
                h: widget.h,
                visible: widget.visible !== false,
                critical: widget.critical === true,
                minW: widget.minW,
                maxW: widget.maxW,
                minH: widget.minH,
                maxH: widget.maxH,
                minimized: widget.minimized === true,
                restoreRect: widget.restoreRect || null,
                restoreDesktopRect: widget.restoreDesktopRect || null,
                restoreDesktopRectViewportWidth: Number(widget.restoreDesktopRectViewportWidth) || 0,
                desktopRect: widget.desktopRect || null,
                desktopRectViewportWidth: Number(widget.desktopRectViewportWidth) || 0,
                zIndex: Number(widget.zIndex) || 1
            };
            if (widget.sourceType === 'shortcut' || widget.sourceType === 'pinned') {
                return {
                    ...base,
                    label: widget.label,
                    title: widget.title,
                    copy: widget.copy,
                    meta: widget.meta,
                    icon: widget.icon,
                    tone: widget.tone,
                    pageId: widget.pageId,
                    status: widget.status,
                    progress: widget.progress,
                    pinType: widget.pinType,
                    sourceId: widget.sourceId
                };
            }
            return base;
        });
    };

    function deserializeScopedWidgets(items, definitionMap, role) {
        return (Array.isArray(items) ? items : [])
            .map((item) => normalizeStoredLayoutWidget(item, definitionMap, role))
            .filter(Boolean);
    }

    function getScopeLayoutSource(scopeEntry, mode = 'workspace') {
        const normalized = normalizeScopeLayoutEntry(scopeEntry);
        if (!normalized) return { version: 0, widgets: null };
        if (mode === 'presentation') {
            return {
                version: normalized.version,
                widgets: normalized.presentationWidgets.length ? normalized.presentationWidgets : null
            };
        }
        return {
            version: normalized.version,
            widgets: normalized.workspaceWidgets.length ? normalized.workspaceWidgets : null
        };
    }

    function getWidgetPresentationMetrics(widget, viewportWidth = 0) {
        if (widget?.desktopRect) {
            const rect = getWidgetDesktopRect(widget, viewportWidth || getHomeViewportWidthForDesktop());
            return {
                top: rect.top,
                left: rect.left,
                widthRatio: viewportWidth > 0 ? rect.width / viewportWidth : rect.width / Math.max(980, getHomeViewportWidthForDesktop())
            };
        }
        return {
            top: Math.max(0, (Number(widget?.y || 1) - 1) * (HOME_GRID_ROW_HEIGHT + 18)),
            left: Math.max(0, (Number(widget?.x || 1) - 1) * 92),
            widthRatio: Math.max(0.18, Math.min(1, (Number(widget?.w || 4) / HOME_GRID_COLUMNS)))
        };
    }

    function resolvePresentationWidgetWidth(widget, viewportWidth = 0) {
        const currentWidth = normalizeWidgetWidth(widget?.w, 4, widget?.minW || 2, widget?.maxW || HOME_GRID_COLUMNS);
        const metrics = getWidgetPresentationMetrics(widget, viewportWidth);
        const ratio = metrics.widthRatio;
        if (widget.renderType === 'alert') return 12;
        if (widget.renderType === 'admin-ops') return Math.max(8, Math.min(12, currentWidth));
        if (widget.renderType === 'hero') return Math.max(6, Math.min(8, currentWidth >= 8 ? 8 : 7));
        if (widget.renderType === 'quick') return currentWidth >= 10 || ratio >= 0.74 ? 12 : 8;
        if (widget.renderType === 'shortcut' || widget.renderType === 'pinned') return Math.max(3, Math.min(4, currentWidth));
        if (ratio >= 0.78 || currentWidth >= 10) return 12;
        if (ratio >= 0.56 || currentWidth >= 8) return 8;
        if (ratio >= 0.4 || currentWidth >= 6) return 6;
        return 4;
    }

    function resolvePresentationWidgetHeight(widget) {
        if (widget.renderType === 'alert') return 3;
        if (widget.renderType === 'hero') return Math.min(widget.maxH || 10, Math.max(widget.minH || 6, 7));
        if (widget.renderType === 'quick') {
            const tileCount = Array.isArray(widget.tiles) ? widget.tiles.length : 0;
            return Math.min(widget.maxH || 10, Math.max(widget.minH || 4, tileCount > 6 ? 6 : 5));
        }
        if (widget.renderType === 'admin-ops') {
            const groupCount = Array.isArray(widget.adminOperations?.groups) ? widget.adminOperations.groups.length : 2;
            return Math.min(widget.maxH || 12, Math.max(widget.minH || 5, groupCount > 2 ? 7 : 6));
        }
        if (widget.renderType === 'shortcut' || widget.renderType === 'pinned') {
            return Math.min(widget.maxH || 8, Math.max(widget.minH || 3, 4));
        }
        const rowCount = Array.isArray(widget.rows) ? widget.rows.length : 0;
        const compactHeight = rowCount <= 1 ? 4 : rowCount <= 2 ? 4 : rowCount <= 4 ? 5 : 6;
        return Math.min(widget.maxH || 8, Math.max(widget.minH || 3, compactHeight));
    }

    function buildPresentationLayout(role, model, sourceLayout = null) {
        const definitions = buildSystemWidgetDefinitions(role, model);
        const definitionMap = new Map(definitions.map((definition) => [definition.widgetId, definition]));
        const normalizedSource = (Array.isArray(sourceLayout) ? sourceLayout : definitions)
            .map((item) => {
                if (item?.instanceId && item?.widgetId) return createWidgetInstance(definitionMap.get(String(item.widgetId)) || item, item);
                return null;
            })
            .filter(Boolean);
        const sourceMap = new Map(normalizedSource.map((widget) => [widget.instanceId, widget]));
        const hidden = [];
        const visible = [];
        normalizedSource.forEach((widget) => {
            if (widget.visible === false) hidden.push({ ...widget, desktopRect: null, restoreDesktopRect: null, zIndex: 1 });
            else visible.push(widget);
        });
        const viewportWidth = getHomeViewportWidthForDesktop();
        const sortedVisible = visible
            .map((widget) => ({ widget, metrics: getWidgetPresentationMetrics(widget, viewportWidth) }))
            .sort((a, b) => a.metrics.top - b.metrics.top || a.metrics.left - b.metrics.left || String(a.widget.label).localeCompare(String(b.widget.label)));

        let currentBand = null;
        let currentRow = 1;
        let rowCursor = 1;
        let rowHeight = 0;
        const placed = [];

        sortedVisible.forEach(({ widget, metrics }) => {
            const nextWidth = resolvePresentationWidgetWidth(widget, viewportWidth);
            const nextHeight = resolvePresentationWidgetHeight(widget);
            const band = Math.max(0, Math.round(metrics.top / 220));
            if (currentBand == null) currentBand = band;
            if (band !== currentBand) {
                currentRow += rowHeight || 0;
                rowCursor = 1;
                rowHeight = 0;
                currentBand = band;
            }
            if (rowCursor + nextWidth - 1 > HOME_GRID_COLUMNS) {
                currentRow += rowHeight || 0;
                rowCursor = 1;
                rowHeight = 0;
            }
            const placedWidget = {
                ...widget,
                x: rowCursor,
                y: currentRow,
                w: nextWidth,
                h: nextHeight,
                minimized: false,
                desktopRect: null,
                restoreDesktopRect: null,
                zIndex: 1,
                restoreRect: { x: rowCursor, y: currentRow, w: nextWidth, h: nextHeight }
            };
            placed.push(placedWidget);
            rowCursor += nextWidth;
            rowHeight = Math.max(rowHeight, nextHeight);
        });

        definitions.forEach((definition) => {
            if (!sourceMap.has(definition.widgetId) && definition.defaultVisible === false) {
                hidden.push(createWidgetInstance(definition, { visible: false, desktopRect: null, restoreDesktopRect: null, zIndex: 1 }));
            }
        });

        return normalizeLayoutZIndices([...placed, ...hidden]);
    }


        const api = {
            sanitizeGridInteger,
            normalizeWidgetWidth,
            normalizeWidgetHeight,
            normalizeWidgetX,
            normalizeWidgetY,
            clampNumber,
            getDesktopCanvasMetrics,
            toDesktopPixelWidth,
            toDesktopPixelHeight,
            toGridWidthFromPixels,
            toGridHeightFromPixels,
            getWidgetMinDesktopWidth,
            getWidgetMaxDesktopWidth,
            getWidgetMinDesktopHeight,
            getWidgetMaxDesktopHeight,
            normalizeDesktopRect,
            gridRectToDesktopRect,
            getWidgetDesktopRect,
            desktopRectToGridRect,
            getHighestWidgetZIndex,
            normalizeLayoutZIndices,
            sortLayoutForCanvas,
            computeDesktopCanvasHeight,
            desktopRectsOverlap,
            getWidgetOverlapIds,
            findNextDesktopRect,
            buildPairListRows,
            cloneLayoutWidgets,
            widgetsOverlap,
            createWidgetInstance,
            createShortcutWidgetInstance,
            createPinnedWidgetInstance,
            normalizeStoredLayoutWidget,
            findNextAvailableSlot,
            stabilizeLayout,
            stepWidgetSize,
            buildHomeWidgetContextUncached,
            buildHomeWidgetContext,
            withGeometry,
            buildSystemWidgetDefinitionsUncached,
            sanitizeWidgetRowText,
            sanitizeWidgetDefinitionText,
            buildSystemWidgetDefinitions,
            buildHomeWidgetDefinitions,
            buildPinnedRecordOptions,
            resolveHomeLayout,
            serializeHomeLayout,
            resolveSavedHomeLayout,
            deserializeScopedWidgets,
            getScopeLayoutSource,
            getWidgetPresentationMetrics,
            resolvePresentationWidgetWidth,
            resolvePresentationWidgetHeight,
            buildPresentationLayout,
        };
        Object.assign(window, api);
        return api;
    };
})();
