/* LMS whiteboard chrome: theme/tools, dashboard/share/members, props/banner, HUD/fullscreen/layers.
 * Peeled from lms-whiteboard-runtime.js. Loaded via LMS_WHITEBOARD_MODULE_URLS before runtime.
 */
(function initLmsWhiteboardChromeRuntime() {
    if (window.__KIU_LMS_WHITEBOARD_CHROME_LOADED) return;
    window.__KIU_LMS_WHITEBOARD_CHROME_LOADED = true;

    window.__kiuCreateLmsWhiteboardChromeApi = function createKiuLmsWhiteboardChromeApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time (paint/pointer style). */

function resolveLmsWhiteboardThemeId() {
    try {
        const stored = localStorage.getItem('lms-whiteboard-theme');
        return stored === 'light' ? 'light' : 'dark';
    } catch {
        return 'dark';
    }
}

function applyLmsWhiteboardTheme(themeId = 'dark') {
    const preset = LMS_WHITEBOARD_THEME_PRESETS[themeId] || LMS_WHITEBOARD_THEME_PRESETS.dark;
    Object.assign(LMS_WHITEBOARD_THEME, preset);
    try { localStorage.setItem('lms-whiteboard-theme', themeId); } catch { /* ignore */ }
    document.querySelectorAll('.lms-whiteboard-shell').forEach(shell => {
        shell.dataset.lmsWhiteboardTheme = themeId;
    });
    paintLmsWhiteboardCanvas(LMS_WHITEBOARD_UI.boundKey);
}

function toggleLmsWhiteboardTheme() {
    applyLmsWhiteboardTheme(resolveLmsWhiteboardThemeId() === 'light' ? 'dark' : 'light');
}

const LMS_WHITEBOARD_TOOL_GROUPS = [
    {
        label: 'Navigate',
        tools: [
            ['select', 'fa-arrow-pointer', 'Select'],
            ['hand', 'fa-hand', 'Hand']
        ]
    },
    {
        label: 'Draw',
        tools: [
            ['pen', 'fa-pen', 'Pen'],
            ['eraser', 'fa-eraser', 'Eraser']
        ]
    },
    {
        label: 'Notes',
        tools: [
            ['sticky', 'fa-note-sticky', 'Sticky'],
            ['text', 'fa-font', 'Text']
        ]
    },
    {
        label: 'Shapes',
        tools: [
            ['rect', 'fa-square', 'Rectangle'],
            ['roundRect', 'fa-square-full', 'Rounded'],
            ['ellipse', 'fa-circle', 'Circle'],
            ['line', 'fa-minus', 'Line'],
            ['arrow', 'fa-arrow-right-long', 'Arrow']
        ]
    },
    {
        label: 'Layout',
        tools: [
            ['grid', 'fa-table-cells', 'Grid']
        ]
    }
];

function renderLmsWhiteboardToolButton(tool, icon, label, canEdit = true) {
    const active = LMS_WHITEBOARD_UI.tool === tool;
    const isNavTool = tool === 'select' || tool === 'hand';
    const disabled = !canEdit && !isNavTool;
    return `<button type="button" class="lms-whiteboard-tool lux-icon-btn${active ? ' is-active' : ''}" data-lms-whiteboard-tool="${tool}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" aria-pressed="${active ? 'true' : 'false'}"${disabled ? ' disabled' : ''}><i class="fas ${icon}"></i></button>`;
}

function renderLmsWhiteboardToolRail(options = {}) {
    const { variant = 'sidebar', canEdit = false, showLabels = variant === 'sidebar' } = options;
    const groups = LMS_WHITEBOARD_TOOL_GROUPS.map((group, groupIndex) => {
        const tools = group.tools.map(([tool, icon, label]) => renderLmsWhiteboardToolButton(tool, icon, label, canEdit)).join('');
        const labelHtml = showLabels
            ? `<span class="lms-whiteboard-tool-group-label">${escapeHtml(group.label)}</span>`
            : '';
        const divider = groupIndex > 0 ? '<span class="lms-whiteboard-tools-divider"></span>' : '';
        return `${divider}${labelHtml}<div class="lms-whiteboard-tool-group">${tools}</div>`;
    }).join('');
    const mediaDivider = '<span class="lms-whiteboard-tools-divider"></span>';
    const importBtn = `<button type="button" class="lms-whiteboard-tool lux-icon-btn" data-lms-whiteboard-action="import-image" title="Import file" aria-label="Import file" ${canEdit ? '' : 'disabled'}><i class="fas fa-image"></i></button>`;
    return `${groups}${mediaDivider}${importBtn}`;
}

function renderLmsWhiteboardCommandBar(canEdit = false, canManage = false) {
    const readonly = canEdit ? '' : ' is-readonly';
    return `
        <div class="lms-whiteboard-command-bar${readonly}" data-lms-whiteboard-command-bar aria-label="Canvas tools">
            <div class="lms-whiteboard-command-bar-scroll">${renderLmsWhiteboardToolRail({ variant: 'command-bar', canEdit, showLabels: false })}</div>
            <span class="lms-whiteboard-tools-divider"></span>
            <label class="lms-whiteboard-focus-color" title="Color" aria-label="Color">
                <input type="color" class="lms-whiteboard-focus-color-input" data-lms-whiteboard-prop="color" value="${escapeHtml(LMS_WHITEBOARD_UI.color)}" aria-label="Color" ${canEdit ? '' : 'disabled'}>
            </label>
            <label class="lms-whiteboard-command-stroke" title="Stroke width" aria-label="Stroke width">
                <span class="lms-whiteboard-command-stroke-label">${LMS_WHITEBOARD_UI.strokeWidth}</span>
                <input type="range" min="1" max="16" value="${LMS_WHITEBOARD_UI.strokeWidth}" class="lms-whiteboard-command-stroke-input" data-lms-whiteboard-prop="stroke" aria-label="Stroke" ${canEdit ? '' : 'disabled'}>
            </label>
            <span class="lms-whiteboard-tools-divider"></span>
            <button type="button" class="lms-whiteboard-tool lux-icon-btn" data-lms-whiteboard-action="undo" title="Undo" aria-label="Undo" ${canEdit ? '' : 'disabled'}><i class="fas fa-rotate-left"></i></button>
            <button type="button" class="lms-whiteboard-tool lux-icon-btn" data-lms-whiteboard-action="redo" title="Redo" aria-label="Redo" ${canEdit ? '' : 'disabled'}><i class="fas fa-rotate-right"></i></button>
            ${canManage ? '<button type="button" class="lms-whiteboard-tool lux-icon-btn lms-whiteboard-clear-all" data-lms-whiteboard-action="clear-board" title="Clear all drawings" aria-label="Clear all drawings"><i class="fas fa-trash-can"></i></button>' : ''}
            <button type="button" class="lms-whiteboard-tool lux-icon-btn" data-lms-whiteboard-action="open-more-menu" title="More tools" aria-label="More tools" aria-haspopup="true"><i class="fas fa-ellipsis"></i></button>
            <button type="button" class="lux-secondary-btn lms-whiteboard-command-exit" data-lms-whiteboard-action="toggle-fullscreen" title="Exit fullscreen" aria-pressed="false"><i class="fas fa-compress"></i> Exit</button>
        </div>`;
}

function resolveLmsWhiteboardLiveEditRights(resourceKey = '') {
    const key = String(resourceKey || LMS_WHITEBOARD_UI.boundKey || '').trim();
    return {
        canEdit: typeof canEditLmsWhiteboard === 'function' ? canEditLmsWhiteboard(key) : false,
        canManage: typeof canManageLmsWhiteboard === 'function' ? canManageLmsWhiteboard(key) : false,
    };
}

function setLmsWhiteboardTool(tool = 'select') {
    if (LMS_WHITEBOARD_UI.drawing && LMS_WHITEBOARD_UI.currentStroke) {
        const canvas = document.querySelector('.lms-whiteboard-canvas');
        cancelLmsWhiteboardActiveDraw(LMS_WHITEBOARD_UI.boundKey, canvas);
    }
    const nextTool = String(tool || 'select');
    LMS_WHITEBOARD_UI.tool = LMS_WHITEBOARD_BLOCKED_TOOLS.includes(nextTool) ? 'select' : nextTool;
    if (['pen', 'eraser', ...LMS_WHITEBOARD_SHAPE_DRAW_TOOLS].includes(LMS_WHITEBOARD_UI.tool)) {
        setLmsWhiteboardSelection([], { skipPaint: true });
    }
    document.querySelectorAll('button[data-lms-whiteboard-tool]').forEach(btn => {
        const active = btn.dataset.lmsWhiteboardTool === LMS_WHITEBOARD_UI.tool;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-lms-whiteboard-region="stage"]').forEach(stage => {
        stage.dataset.lmsWhiteboardTool = LMS_WHITEBOARD_UI.tool;
    });
    if (typeof syncLmsWhiteboardDocumentToolMode === 'function') {
        syncLmsWhiteboardDocumentToolMode();
    }
    document.querySelectorAll('.lms-whiteboard-canvas').forEach(canvas => refreshLmsWhiteboardPointerCursor(canvas));
    syncLmsWhiteboardGridToolPropsVisibility();
}

function syncLmsWhiteboardGridToolPropsVisibility() {
    const showGrid = LMS_WHITEBOARD_UI.tool === 'grid';
    document.querySelectorAll('[data-lms-whiteboard-grid-props]').forEach(node => {
        node.hidden = !showGrid;
    });
}

const LMS_WHITEBOARD_MEMBERS_UI = { dashboardFilter: 'all' };

function getLmsWhiteboardMembersDashboardScope(resourceKey = '') {
    const parsed = typeof parseLmsCourseKey === 'function'
        ? parseLmsCourseKey(resourceKey)
        : { courseId: resourceKey, groupId: null, sectionType: '' };
    const courseId = typeof getLmsPersonalDashboardCourseId === 'function'
        ? getLmsPersonalDashboardCourseId(resourceKey)
        : String(parsed.courseId || '').trim();
    const groupId = String(parsed.groupId || '').trim();
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : String(parsed.sectionType || '').trim();
    return { courseId, groupId, sectionType };
}

function buildLmsWhiteboardDashboardShareStatusMap(items = []) {
    const map = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
        const studentId = String(item?.studentId || '').trim();
        if (!studentId) return;
        map.set(studentId, String(item?.staffShareLevel || 'none').trim() || 'none');
    });
    return map;
}

function renderLmsWhiteboardDashboardShareBadge(level = 'none') {
    const normalized = String(level || 'none').trim() || 'none';
    if (normalized === 'view') return '<span class="lms-whiteboard-dashboard-share-badge is-view">View</span>';
    if (normalized === 'edit') return '<span class="lms-whiteboard-dashboard-share-badge is-edit">Edit</span>';
    return '<span class="lms-whiteboard-dashboard-share-badge is-private">Private</span>';
}

function renderLmsWhiteboardDashboardFilter(active = 'all') {
    const chips = [
        { id: 'all', label: 'All' },
        { id: 'shared', label: 'Shared' },
        { id: 'private', label: 'Not shared' }
    ];
    return `
        <div class="lms-whiteboard-dashboard-filter" role="group" aria-label="Filter student workspaces">
            ${chips.map(chip => `
                <button type="button" class="lms-whiteboard-dashboard-filter-chip${active === chip.id ? ' is-active' : ''}" data-lms-whiteboard-action="filter-dashboard-share" data-dashboard-filter="${escapeHtml(chip.id)}">${escapeHtml(chip.label)}</button>
            `).join('')}
        </div>`;
}

function renderLmsWhiteboardDashboardSection(resourceKey = '', students = [], shareStatusMap = new Map(), filter = 'all') {
    const rank = { none: 0, view: 1, edit: 2 };
    const rows = students
        .map(student => {
            const studentId = String(student?.id || '').trim();
            const displayName = student?.nameEn || student?.name || `Student ${studentId}`;
            const staffShareLevel = shareStatusMap.get(studentId) || 'none';
            return { studentId, displayName, staffShareLevel };
        })
        .filter(row => {
            if (filter === 'shared') return row.staffShareLevel !== 'none';
            if (filter === 'private') return row.staffShareLevel === 'none';
            return true;
        })
        .sort((left, right) => {
            const levelDelta = rank[right.staffShareLevel] - rank[left.staffShareLevel];
            if (levelDelta !== 0) return levelDelta;
            return String(left.displayName).localeCompare(String(right.displayName));
        });
    if (!rows.length) {
        return `
            <section class="lms-whiteboard-members-section lms-whiteboard-members-section--dashboards" data-lms-whiteboard-dashboard-section="1">
                <div class="lms-whiteboard-members-section-head">
                    <span>Student workspaces</span>
                    <span class="lms-whiteboard-members-section-copy">Open a student My Workspace when they have shared saved progress.</span>
                </div>
                ${renderLmsWhiteboardDashboardFilter(filter)}
                <div class="lms-live-copy lms-route-copy-mt-6">No students match this filter.</div>
            </section>`;
    }
    const dashboardRows = rows.map(row => {
        const canOpen = row.staffShareLevel !== 'none';
        return `
            <div class="lms-whiteboard-dashboard-row" data-student-share-level="${escapeHtml(row.staffShareLevel)}">
                <span class="lms-whiteboard-member-name">
                    ${escapeHtml(row.displayName)}
                    ${renderLmsWhiteboardDashboardShareBadge(row.staffShareLevel)}
                </span>
                <span class="lms-whiteboard-member-col">
                    <button type="button" class="lux-secondary-btn lms-whiteboard-open-student-workspace" data-lms-whiteboard-action="open-student-workspace" data-student-id="${escapeHtml(row.studentId)}" data-student-name="${escapeHtml(row.displayName)}" title="${canOpen ? 'Open student workspace' : 'Student has not shared saved progress yet'}" ${canOpen ? '' : 'disabled'}>
                        <i class="fas fa-user-pen"></i> Open
                    </button>
                </span>
            </div>`;
    }).join('');
    return `
        <section class="lms-whiteboard-members-section lms-whiteboard-members-section--dashboards" data-lms-whiteboard-dashboard-section="1">
            <div class="lms-whiteboard-members-section-head">
                <span>Student workspaces</span>
                <span class="lms-whiteboard-members-section-copy">Open a student My Workspace when they have shared saved progress.</span>
            </div>
            ${renderLmsWhiteboardDashboardFilter(filter)}
            <div class="lms-whiteboard-dashboard-list-head">
                <span>Student</span>
                <span>Workspace</span>
            </div>
            <div class="lms-whiteboard-dashboard-list">${dashboardRows}</div>
        </section>`;
}

async function refreshLmsWhiteboardMembersDashboardSection(overlay, resourceKey = '', filter = LMS_WHITEBOARD_MEMBERS_UI.dashboardFilter || 'all') {
    if (!overlay) return;
    const parsed = typeof parseLmsCourseKey === 'function' ? parseLmsCourseKey(resourceKey) : { courseId: resourceKey, groupId: null };
    const students = typeof getEnrolledStudentsForGroup === 'function'
        ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) || []
        : [];
    const scope = getLmsWhiteboardMembersDashboardScope(resourceKey);
    let shareStatusMap = new Map();
    if (typeof fetchLmsPersonalDashboardShareStatus === 'function' && scope.courseId) {
        try {
            const response = await fetchLmsPersonalDashboardShareStatus(scope.courseId, {
                groupId: scope.groupId,
                sectionType: scope.sectionType
            });
            shareStatusMap = buildLmsWhiteboardDashboardShareStatusMap(response?.items || []);
        } catch (_error) {
            shareStatusMap = new Map();
        }
    }
    const section = overlay.querySelector('[data-lms-whiteboard-dashboard-section]');
    if (!section) return;
    section.outerHTML = renderLmsWhiteboardDashboardSection(resourceKey, students, shareStatusMap, filter);
}

function renderLmsWhiteboardMembersPanel(resourceKey = '', options = {}) {
    const parsed = typeof parseLmsCourseKey === 'function' ? parseLmsCourseKey(resourceKey) : { courseId: resourceKey, groupId: null };
    const students = typeof getEnrolledStudentsForGroup === 'function'
        ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) || []
        : [];
    const shareStatusMap = options.shareStatusMap instanceof Map
        ? options.shareStatusMap
        : buildLmsWhiteboardDashboardShareStatusMap(options.shareStatusItems || []);
    const dashboardFilter = String(options.dashboardFilter || LMS_WHITEBOARD_MEMBERS_UI.dashboardFilter || 'all').trim() || 'all';
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(resourceKey) : {};
    const controlIds = Array.isArray(workspace?.editControlUserIds) ? workspace.editControlUserIds : [];
    const deleteStaffIds = Array.isArray(workspace?.deleteStaffElementsUserIds) ? workspace.deleteStaffElementsUserIds : [];
    // ponytail: "online" is approximated from recent cursor signals (10s TTL), not a real join/leave presence feed.
    const onlineIds = typeof LMS_WHITEBOARD_COLLAB !== 'undefined' ? Object.keys(LMS_WHITEBOARD_COLLAB.cursors || {}) : [];
    if (!students.length) {
        return '<div class="lms-live-copy lms-route-copy-mt-6">No students enrolled in this group yet.</div>';
    }
    const toggleSwitch = (action, studentId, isChecked, title, icon) => `
        <label class="lms-perm-toggle" title="${escapeHtml(title)}">
            <input type="checkbox" data-lms-whiteboard-action="${action}" data-student-id="${escapeHtml(studentId)}" ${isChecked ? 'checked' : ''}>
            <i class="fas ${icon}" aria-hidden="true"></i>
        </label>`;
    const boardRows = students.map(student => {
        const studentId = String(student?.id || '').trim();
        const displayName = student?.nameEn || student?.name || `Student ${studentId}`;
        const isOnline = onlineIds.includes(studentId);
        return `
            <div class="lms-whiteboard-member-row">
                <span class="lms-whiteboard-member-name">
                    <span class="lms-whiteboard-member-status${isOnline ? ' is-online' : ''}" title="${isOnline ? 'Online' : 'Offline'}"></span>
                    ${escapeHtml(displayName)}
                </span>
                <span class="lms-whiteboard-member-col">${toggleSwitch('toggle-student-control', studentId, controlIds.includes(studentId), 'Can draw on the board', 'fa-pen')}</span>
                <span class="lms-whiteboard-member-col">${toggleSwitch('toggle-student-delete-staff', studentId, deleteStaffIds.includes(studentId), 'Can delete instructor/TA elements', 'fa-trash')}</span>
            </div>`;
    }).join('');
    const onlineCount = students.filter(student => onlineIds.includes(String(student?.id || '').trim())).length;
    return `
        <section class="lms-whiteboard-members-section">
            <div class="lms-whiteboard-members-section-head">
                <span>${onlineCount} online · ${students.length} enrolled</span>
            </div>
            <div class="lms-whiteboard-member-list-head">
                <span>Student</span>
                <span>Draw</span>
                <span>Delete staff items</span>
            </div>
            <div class="lms-whiteboard-member-list">${boardRows}</div>
        </section>
        ${renderLmsWhiteboardDashboardSection(resourceKey, students, shareStatusMap, dashboardFilter)}`;
}

function closeLmsWhiteboardMembersModal() {
    const overlay = document.getElementById('lms-whiteboard-members-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function openLmsWhiteboardMembersModal(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof renderLmsGlassDialogHead !== 'function') return;
    const existing = document.getElementById('lms-whiteboard-members-modal');
    if (existing && typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(existing, { instant: true });
    } else {
        existing?.remove();
    }
    const overlay = document.createElement('div');
    overlay.id = 'lms-whiteboard-members-modal';
    overlay.className = 'lms-glass-dialog-overlay lms-whiteboard-members-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsWhiteboardMembersModal();
    };
    const head = renderLmsGlassDialogHead({
        title: 'Board members',
        icon: 'fa-users',
        subtitle: 'Manage class board permissions and open shared student workspaces.',
        closeAttr: 'data-lms-click="closeLmsWhiteboardMembersModal()"'
    });
    overlay.innerHTML = `
        <div class="lux-glass-dialog-card lux-glass-dialog-card--form lms-whiteboard-members-modal-card" role="dialog" aria-modal="true" data-lux-transparency-exempt="1">
            ${head}
            <div class="lux-glass-dialog-body lms-whiteboard-members-modal-body">${renderLmsWhiteboardMembersPanel(canonicalKey)}</div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
    overlay.addEventListener('change', event => {
        const studentToggle = event.target.closest?.('[data-lms-whiteboard-action="toggle-student-control"]');
        if (studentToggle && typeof setLmsWhiteboardStudentControl === 'function') {
            setLmsWhiteboardStudentControl(canonicalKey, studentToggle.dataset.studentId, studentToggle.checked);
        }
        const deleteStaffToggle = event.target.closest?.('[data-lms-whiteboard-action="toggle-student-delete-staff"]');
        if (deleteStaffToggle && typeof setLmsWhiteboardStudentDeleteStaffElements === 'function') {
            setLmsWhiteboardStudentDeleteStaffElements(canonicalKey, deleteStaffToggle.dataset.studentId, deleteStaffToggle.checked);
        }
    });
    overlay.addEventListener('click', event => {
        const filterButton = event.target.closest?.('[data-lms-whiteboard-action="filter-dashboard-share"]');
        if (filterButton) {
            event.preventDefault();
            LMS_WHITEBOARD_MEMBERS_UI.dashboardFilter = String(filterButton.dataset.dashboardFilter || 'all').trim() || 'all';
            refreshLmsWhiteboardMembersDashboardSection(overlay, canonicalKey, LMS_WHITEBOARD_MEMBERS_UI.dashboardFilter);
            return;
        }
        const openWorkspaceButton = event.target.closest?.('[data-lms-whiteboard-action="open-student-workspace"]');
        if (!openWorkspaceButton || openWorkspaceButton.disabled) return;
        event.preventDefault();
        const openStudentWorkspace = async () => {
            if (typeof ensureLmsPersonalDashboardRuntime === 'function') {
                await ensureLmsPersonalDashboardRuntime();
            }
            if (typeof openLmsPersonalDashboardForStaff !== 'function') return;
            await openLmsPersonalDashboardForStaff(
                openWorkspaceButton.dataset.studentId,
                openWorkspaceButton.dataset.studentName
            );
        };
        openStudentWorkspace().catch(() => null);
    });
    refreshLmsWhiteboardMembersDashboardSection(overlay, canonicalKey, LMS_WHITEBOARD_MEMBERS_UI.dashboardFilter);
}
function renderLmsWhiteboardPropsPanel(canEdit = false, canManage = false, resourceKey = '') {
    const selectedCount = getLmsWhiteboardSelectedIds().length;
    return `
        <aside class="lms-live-side-stack lms-whiteboard-props">
            <div class="lms-live-card lms-whiteboard-props-card">
                <div class="lms-whiteboard-props-tabs" role="tablist" aria-label="Board properties">
                    <button type="button" class="lms-whiteboard-props-tab is-active" data-lms-whiteboard-props-tab="draw" aria-selected="true">Draw</button>
                    <button type="button" class="lms-whiteboard-props-tab" data-lms-whiteboard-props-tab="layers" aria-selected="false">Layers</button>
                </div>
                <div class="lms-whiteboard-props-panel is-active" data-lms-whiteboard-props-panel="draw">
                    <div class="lms-wb-field lms-wb-field--swatch">
                        <span class="lms-wb-field-label">Color</span>
                        <label class="lms-wb-swatch" style="--swatch-color:${escapeHtml(LMS_WHITEBOARD_UI.color)}">
                            <input type="color" data-lms-whiteboard-prop="color" value="${escapeHtml(LMS_WHITEBOARD_UI.color)}" ${canEdit ? '' : 'disabled'}>
                        </label>
                    </div>
                    <div class="lms-wb-field">
                        <span class="lms-wb-field-label">Stroke <b data-lms-whiteboard-value="stroke">${LMS_WHITEBOARD_UI.strokeWidth}</b></span>
                        <input type="range" min="1" max="16" value="${LMS_WHITEBOARD_UI.strokeWidth}" class="lms-wb-range" data-lms-whiteboard-prop="stroke" ${canEdit ? '' : 'disabled'}>
                    </div>
                    <div class="lms-wb-field lms-wb-field--swatch" data-lms-whiteboard-shape-fill>
                        <span class="lms-wb-field-label">Shape fill</span>
                        <label class="lms-wb-swatch" style="--swatch-color:${escapeHtml(LMS_WHITEBOARD_UI.shapeDefaults.fill)}">
                            <input type="color" data-lms-whiteboard-prop="fill" value="${escapeHtml(LMS_WHITEBOARD_UI.shapeDefaults.fill)}" ${canEdit ? '' : 'disabled'}>
                        </label>
                        <div class="lms-wb-opacity-row">
                            <span class="lms-wb-field-label">Opacity</span>
                            <div class="lms-wb-opacity-input-wrap">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    inputmode="numeric"
                                    class="lms-wb-input lms-wb-input--opacity"
                                    data-lms-whiteboard-prop="fillOpacity"
                                    data-lms-whiteboard-prop-input="fillOpacity"
                                    aria-label="Shape fill opacity percent"
                                    value="${clampLmsWhiteboardFillOpacityPercent((LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity || 0) * 100)}"
                                    ${canEdit ? '' : 'disabled'}>
                                <span class="lms-wb-input-suffix" aria-hidden="true">%</span>
                            </div>
                        </div>
                        <input type="range" min="0" max="100" value="${clampLmsWhiteboardFillOpacityPercent((LMS_WHITEBOARD_UI.shapeDefaults.fillOpacity || 0) * 100)}" class="lms-wb-range" data-lms-whiteboard-prop="fillOpacity" ${canEdit ? '' : 'disabled'}>
                    </div>
                    <div class="lms-wb-field" data-lms-whiteboard-grid-props${LMS_WHITEBOARD_UI.tool === 'grid' ? '' : ' hidden'}>
                        <span class="lms-wb-field-label">Grid size</span>
                        <div class="lms-whiteboard-grid-size-inputs">
                            <label class="lms-wb-field lms-wb-field--row">
                                <span class="lms-wb-field-label">Rows</span>
                                <input type="number" min="1" max="20" value="${LMS_WHITEBOARD_UI.gridDefaults.rows}" class="lms-wb-input" data-lms-whiteboard-prop="gridRows" ${canEdit ? '' : 'disabled'}>
                            </label>
                            <label class="lms-wb-field lms-wb-field--row">
                                <span class="lms-wb-field-label">Cols</span>
                                <input type="number" min="1" max="20" value="${LMS_WHITEBOARD_UI.gridDefaults.cols}" class="lms-wb-input" data-lms-whiteboard-prop="gridCols" ${canEdit ? '' : 'disabled'}>
                            </label>
                        </div>
                        <div class="lms-whiteboard-grid-presets">
                            ${[
                                ['2x2', 2, 2],
                                ['3x3', 3, 3],
                                ['4x4', 4, 4],
                                ['5x4', 5, 4],
                                ['7x7', 7, 7]
                            ].map(([label, rows, cols]) => `
                                <button type="button" class="lux-secondary-btn lms-whiteboard-grid-preset" data-lms-whiteboard-grid-preset="${rows}x${cols}" ${canEdit ? '' : 'disabled'}>${label}</button>`).join('')}
                        </div>
                    </div>
                    <div class="lms-wb-field">
                        <span class="lms-wb-field-label">Font size <b data-lms-whiteboard-value="fontSize">${LMS_WHITEBOARD_UI.textDefaults.fontSize}</b></span>
                        <input type="range" min="10" max="72" value="${LMS_WHITEBOARD_UI.textDefaults.fontSize}" class="lms-wb-range" data-lms-whiteboard-prop="fontSize" ${canEdit ? '' : 'disabled'}>
                    </div>
                    <label class="lms-wb-field lms-wb-field--row">
                        <span class="lms-wb-field-label">Snap to grid</span>
                        <span class="lms-perm-toggle">
                            <input type="checkbox" data-lms-whiteboard-prop="snap" ${LMS_WHITEBOARD_UI.snapToGrid ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                            <i class="fas fa-magnet" aria-hidden="true"></i>
                        </span>
                    </label>
                </div>
                <div class="lms-whiteboard-props-panel" data-lms-whiteboard-props-panel="layers" hidden>
                    <div class="lms-live-copy lms-route-copy-mt-6" data-lms-whiteboard-selection-count>${selectedCount ? `${selectedCount} selected` : 'Select an object to reorder.'}</div>
                    <div class="lms-whiteboard-layers-list" data-lms-whiteboard-layers-list></div>
                    <div class="lms-whiteboard-layer-actions" data-lms-whiteboard-region="layer-actions">
                        <button type="button" class="lux-secondary-btn" data-lms-whiteboard-action="bring-forward" ${canEdit ? '' : 'disabled'}><i class="fas fa-arrow-up"></i> Forward</button>
                        <button type="button" class="lux-secondary-btn" data-lms-whiteboard-action="send-backward" ${canEdit ? '' : 'disabled'}><i class="fas fa-arrow-down"></i> Back</button>
                    </div>
                </div>
            </div>
        </aside>`;
}

function renderLmsWhiteboardStatusPills(workspace = {}, canManage = false, canEdit = false) {
    const pills = [];
    if (workspace.sessionActive) pills.push('<span class="lms-live-pill is-live"><i class="fas fa-circle"></i> Live</span>');
    if (workspace.sessionActive) {
        if (canManage) {
            if (workspace.editingEnabled) {
                pills.push('<span class="lms-live-pill"><i class="fas fa-users"></i> Students editing</span>');
            } else {
                const grantCount = Array.isArray(workspace.editControlUserIds) ? workspace.editControlUserIds.length : 0;
                if (grantCount > 0) {
                    pills.push(`<span class="lms-live-pill"><i class="fas fa-user-pen"></i> ${grantCount} student${grantCount === 1 ? '' : 's'} can draw</span>`);
                } else {
                    pills.push('<span class="lms-live-pill"><i class="fas fa-eye"></i> Students view only</span>');
                }
            }
        } else if (canEdit) {
            pills.push('<span class="lms-live-pill"><i class="fas fa-pen"></i> Editing open</span>');
        } else {
            pills.push('<span class="lms-live-pill"><i class="fas fa-eye"></i> View only</span>');
        }
    }
    if (workspace.ui?.loadingFromBackend) pills.push('<span class="lms-live-pill"><i class="fas fa-spinner fa-spin"></i> Loading</span>');
    else if (workspace.ui?.syncing) pills.push('<span class="lms-live-pill"><i class="fas fa-sync fa-spin"></i> Syncing</span>');
    else if (workspace.ui?.dirty) pills.push('<span class="lms-live-pill is-warn"><i class="fas fa-clock"></i> Unsaved changes</span>');
    else if (workspace.ui?.syncError) pills.push('<span class="lms-live-pill is-danger"><i class="fas fa-triangle-exclamation"></i> Sync issue</span>');
    else pills.push('<span class="lms-live-pill"><i class="fas fa-check"></i> Synced</span>');
    if (workspace.ui?.syncError) {
        pills.push('<button type="button" class="lux-secondary-btn lms-whiteboard-retry-sync" data-lms-whiteboard-action="retry-sync"><i class="fas fa-rotate-right"></i> Retry</button>');
    }
    if (canManage) pills.push(`<span class="lms-live-pill"><i class="fas fa-shapes"></i> ${workspace.elements?.length || 0} items</span>`);
    return pills.join('');
}

function renderLmsWhiteboardBannerStatusPills(workspace = {}, canManage = false, canEdit = false) {
    if (!workspace.sessionActive) return '';
    if (canManage) return '';
    const pills = renderLmsWhiteboardStatusPills(workspace, canManage, canEdit);
    return pills ? `<div class="lms-live-pill-row lms-whiteboard-banner-pills">${pills}</div>` : '';
}

function renderLmsWhiteboardStaffSessionBannerPills(workspace = {}) {
    if (!workspace.sessionActive) return '';
    return '<span class="lms-live-pill is-live"><i class="fas fa-circle"></i> Live</span>';
}

function renderLmsWhiteboardBanner(workspace = {}, canManage = false, canEdit = false) {
    if (!workspace.sessionActive && canManage) {
        return `
            <div class="lms-whiteboard-banner is-empty">
                <div class="lms-live-copy">Start a whiteboard session for this ${escapeHtml(getLmsWhiteboardSectionLabel().toLowerCase())} group.</div>
                <div class="lms-live-actions">
                    <button type="button" class="lux-primary-btn" data-lms-whiteboard-action="start-session"><i class="fas fa-play"></i> Start session</button>
                </div>
            </div>`;
    }
    if (canManage) {
        const staffPills = workspace.sessionActive
            ? renderLmsWhiteboardStaffSessionBannerPills(workspace)
            : renderLmsWhiteboardStatusPills(workspace, canManage, canEdit);
        return `
            <div class="lms-whiteboard-banner is-staff">
                <div class="lms-whiteboard-banner-lead">
                    ${staffPills ? `<div class="lms-live-pill-row lms-whiteboard-banner-pills">${staffPills}</div>` : ''}
                </div>
                <div class="lms-live-actions">
                    <button type="button" class="lux-secondary-btn" data-lms-whiteboard-action="end-session"><i class="fas fa-stop"></i> End session</button>
                    <button type="button" class="lux-secondary-btn" data-lms-whiteboard-action="export-png"><i class="fas fa-image"></i> PNG</button>
                    <button type="button" class="lux-secondary-btn" data-lms-whiteboard-action="export-pdf"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>
            </div>`;
    }
    if (!canEdit) {
        const statusPills = renderLmsWhiteboardBannerStatusPills(workspace, canManage, canEdit);
        const lockedCopy = workspace.sessionActive
            ? 'View only — instructor has not enabled drawing for you'
            : 'View only — start session and enable editing to draw';
        return `<div class="lms-whiteboard-banner is-locked">
            ${statusPills}
            <div class="lms-live-copy"><i class="fas fa-lock"></i> ${escapeHtml(lockedCopy)}</div>
        </div>`;
    }
    const statusPills = renderLmsWhiteboardBannerStatusPills(workspace, canManage, canEdit);
    return `<div class="lms-whiteboard-banner is-active">
        ${statusPills}
        <div class="lms-live-copy"><i class="fas fa-pen"></i> You can edit this board</div>
    </div>`;
}

function renderLmsWhiteboardEmptyStudent() {
    return `
        <div class="lms-live-student-wait">
            <div class="lms-live-pulse"><i class="fas fa-chalkboard"></i></div>
            <div class="lms-route-empty-title">Waiting for instructor</div>
            <div class="lms-live-copy lms-live-copy-waiting lms-live-copy-center">The whiteboard session has not started yet.</div>
        </div>`;
}

function renderLmsWhiteboardMissingCourseState() {
    if (typeof renderLmsRouteEmptyState === 'function') {
        return renderLmsRouteEmptyState(
            'Open a course group',
            'Select a course workspace before using the whiteboard.',
            'fa-chalkboard'
        );
    }
    return `
        <div class="lms-route-empty">
            <div class="lms-route-empty-icon"><i class="fas fa-chalkboard"></i></div>
            <div class="lms-route-empty-title">Open a course group</div>
            <div class="lms-route-empty-copy">Select a course workspace before using the whiteboard.</div>
        </div>`;
}

const LMS_WHITEBOARD_SESSION_SYNC_MESSAGE = 'Sign in through the portal to sync this board. Local editing is available until you reconnect.';

function isLmsWhiteboardSessionTokenMissing() {
    const hasToken = typeof getPortalSessionToken === 'function' && Boolean(getPortalSessionToken());
    if (hasToken) return false;
    try {
        return Boolean(localStorage.getItem('KIU_AUTH_STATE'));
    } catch (error) {
        return false;
    }
}

function buildLmsWhiteboardSignInHref() {
    try {
        const returnTo = encodeURIComponent(String(window.location.href || 'lms.html'));
        return `login.html?returnTo=${returnTo}`;
    } catch (error) {
        return 'login.html';
    }
}

function renderLmsWhiteboardSyncError(workspace = {}) {
    if (workspace.ui?.routeUnavailable) {
        return `<div class="lms-live-copy is-danger is-route-unavailable">Whiteboard is temporarily unavailable. Try again or contact support.</div>`;
    }
    const syncError = String(workspace.ui?.syncError || '').trim();
    if (isLmsWhiteboardSessionTokenMissing()) {
        const message = syncError || LMS_WHITEBOARD_SESSION_SYNC_MESSAGE;
        return `<div class="lms-live-copy is-danger lms-whiteboard-sync-warning">
            ${escapeHtml(message)}
            <a class="lms-whiteboard-sync-signin" href="${escapeHtml(buildLmsWhiteboardSignInHref())}">Sign in again</a>
        </div>`;
    }
    if (!syncError) return '';
    return `<div class="lms-live-copy is-danger">${escapeHtml(syncError)}</div>`;
}

function syncLmsWhiteboardPropsToggleUi(shell) {
    const open = shell?.classList.contains('is-props-open');
    shell?.querySelectorAll('[data-lms-whiteboard-action="toggle-props"]').forEach((btn) => {
        btn.setAttribute('aria-pressed', open ? 'true' : 'false');
    });
}

function toggleLmsWhiteboardPropsDock(shell = null) {
    const target = shell || getActiveLmsWhiteboardShell(LMS_WHITEBOARD_UI.boundKey);
    if (!target) return;
    target.classList.toggle('is-props-open');
    syncLmsWhiteboardPropsToggleUi(target);
    resyncLmsWhiteboardLayoutMetrics(target, LMS_WHITEBOARD_UI.boundKey);
}

function isLmsWhiteboardNavToolNode(node) {
    const tool = String(node?.dataset?.lmsWhiteboardTool || '').trim();
    return tool === 'select' || tool === 'hand';
}

function syncLmsWhiteboardToolEditState(shell, canEdit = false) {
    if (!shell) return;
    const tools = shell.querySelector('.lms-whiteboard-tools');
    if (tools) tools.classList.toggle('is-readonly', !canEdit);
    const commandBar = shell.querySelector('[data-lms-whiteboard-command-bar]');
    if (commandBar) commandBar.classList.toggle('is-readonly', !canEdit);
    shell.querySelectorAll('[data-lms-whiteboard-tool]').forEach((button) => {
        button.disabled = !canEdit && !isLmsWhiteboardNavToolNode(button);
    });
    shell.querySelectorAll('[data-lms-whiteboard-action="import-image"]').forEach((button) => {
        button.disabled = !canEdit;
    });
    shell.querySelectorAll(
        '[data-lms-whiteboard-prop], [data-lms-whiteboard-action="undo"], [data-lms-whiteboard-action="redo"], [data-lms-whiteboard-action="bring-forward"], [data-lms-whiteboard-action="send-backward"], .lms-whiteboard-grid-preset'
    ).forEach((node) => {
        node.disabled = !canEdit;
    });
}

function updateLmsWhiteboardSessionChrome(resourceKey = '') {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsWhiteboardActiveTab()) return false;
    const context = resolveActiveLmsWhiteboardContext(resourceKey);
    if (!context?.resourceKey) return false;
    const { workspace, canManage, canEdit } = context;
    const shell = getActiveLmsWhiteboardShell(context.resourceKey);
    if (shell) {
        shell.classList.toggle('is-session-active', Boolean(workspace.sessionActive));
        shell.dataset.sessionActive = workspace.sessionActive ? '1' : '0';
        syncLmsWhiteboardToolEditState(shell, canEdit);
        const collabHud = shell.querySelector('[data-lms-whiteboard-region="collab-hud"]');
        if (collabHud && typeof renderLmsWhiteboardCollabPill === 'function') {
            collabHud.innerHTML = renderLmsWhiteboardCollabPill(workspace, canManage, context.resourceKey);
        }
    }
    syncLmsWhiteboardSessionBodyClass(workspace);
    updateLmsWhiteboardVolatileUi(context.resourceKey);
    if (shell) scheduleLmsWhiteboardLayoutRecovery(shell, context.resourceKey);
    return true;
}

function updateLmsWhiteboardVolatileUi(resourceKey = '') {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsWhiteboardActiveTab()) return false;
    const context = resolveActiveLmsWhiteboardContext(resourceKey);
    if (!context?.resourceKey) return false;
    if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(context.resourceKey)
        && typeof isLmsPersonalDashboardOpen === 'function' && !isLmsPersonalDashboardOpen()) {
        return false;
    }
    const { workspace, canManage, canEdit } = context;
    patchLmsWhiteboardRegion(contentArea, 'banner', renderLmsWhiteboardBanner(workspace, canManage, canEdit));
    patchLmsWhiteboardRegion(contentArea, 'sync-error', renderLmsWhiteboardSyncError(workspace));
    storeLmsWhiteboardFingerprints(
        context.resourceKey,
        getLmsWhiteboardLayoutFingerprint(context.resourceKey),
        window.__lmsWhiteboardElementsFingerprints?.[context.resourceKey] || getLmsWhiteboardElementsFingerprint(context.resourceKey),
        getLmsWhiteboardVolatileFingerprint(context.resourceKey)
    );
    return true;
}

function runLmsWhiteboardHudAction(action = '', resourceKey = '', canEdit = false, canManage = false, shell = null) {
    const key = resourceKey || LMS_WHITEBOARD_UI.boundKey;
    if (!action) return;
    if (action === 'toggle-grid') { toggleLmsWhiteboardGrid(key); return; }
    if (action === 'zoom-in') { setLmsWhiteboardZoom(LMS_WHITEBOARD_UI.zoom + 0.1, false, key); return; }
    if (action === 'zoom-out') { setLmsWhiteboardZoom(LMS_WHITEBOARD_UI.zoom - 0.1, false, key); return; }
    if (action === 'zoom-fit') { fitLmsWhiteboardZoomToContent(key); return; }
    if (action === 'zoom-selection') {
        const workspace = ensureLmsWhiteboardWorkspace(key);
        const selected = getLmsWhiteboardSelectedIds()
            .map(id => workspace.elements.find(element => element.id === id))
            .filter(Boolean);
        const bounds = getLmsWhiteboardElementsBounds(selected);
        if (bounds) fitLmsWhiteboardZoomToBounds(key, bounds);
        return;
    }
    if (action === 'toggle-minimap') { toggleLmsWhiteboardMinimap(); return; }
    if (action === 'toggle-props') { toggleLmsWhiteboardPropsDock(shell); return; }
    if (action === 'toggle-theme') { toggleLmsWhiteboardTheme(); return; }
    if (action === 'open-more-menu') { openLmsWhiteboardMoreMenu(canEdit, canManage); return; }
    if (action === 'toggle-fullscreen') { toggleLmsWhiteboardFullscreen(); return; }
    if (action === 'undo') {
        const canEditNow = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(key);
        if (canEditNow && typeof undoLmsWhiteboardHistory === 'function') undoLmsWhiteboardHistory(key);
        return;
    }
    if (action === 'redo') {
        const canEditNow = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(key);
        if (canEditNow && typeof redoLmsWhiteboardHistory === 'function') redoLmsWhiteboardHistory(key);
        return;
    }
    if (action === 'import-image') {
        shell?.querySelector('[data-lms-whiteboard-image-input]')?.click();
        return;
    }
    if (action === 'clear-board') {
        const isPersonal = typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(key);
        const isPersonalOwner = isPersonal
            && typeof isLmsPersonalBoardOwner === 'function' && isLmsPersonalBoardOwner(key);
        const canClear = isPersonal
            ? (typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(key))
            : (isPersonalOwner || (typeof canManageLmsWhiteboard === 'function' ? canManageLmsWhiteboard(key) : canManage));
        if (!canClear) {
            alert('You do not have permission to clear the board.');
            return;
        }
        const confirmCopy = isPersonal
            ? (isPersonalOwner ? 'Clear your personal board?' : 'Clear this shared personal board?')
            : LMS_WHITEBOARD_CLEAR_CONFIRM;
        if (confirm(confirmCopy)) clearLmsWhiteboardBoard(key);
        return;
    }
}

function handleLmsWhiteboardShellActionClick(event, resourceKey = '', shell = null) {
    const actionButton = event.target.closest?.('[data-lms-whiteboard-action]');
    if (!actionButton || !shell?.contains(actionButton)) return false;
    event.preventDefault();
    event.stopPropagation();
    const action = actionButton.dataset.lmsWhiteboardAction;
    const canEdit = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(resourceKey);
    const canManage = typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(resourceKey);
    if (action === 'start-session' && typeof startLmsWhiteboardSession === 'function') {
        startLmsWhiteboardSession(resourceKey);
        return true;
    }
    if (action === 'end-session' && typeof endLmsWhiteboardSession === 'function') {
        if (confirm('End the whiteboard session for this class?')) endLmsWhiteboardSession(resourceKey);
        return true;
    }
    if (action === 'toggle-editing') return true;
    if (action === 'export-png') { exportLmsWhiteboardImage(resourceKey, 'png'); return true; }
    if (action === 'export-pdf') { exportLmsWhiteboardImage(resourceKey, 'pdf'); return true; }
    if (action === 'open-more-menu') { openLmsWhiteboardMoreMenu(canEdit, canManage); return true; }
    if (action === 'close-more-menu') { closeLmsWhiteboardMoreMenu(); return true; }
    if (action === 'toggle-minimap') { toggleLmsWhiteboardMinimap(); return true; }
    if (action === 'clear-board') {
        const isPersonal = typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(resourceKey);
        const isPersonalOwner = isPersonal
            && typeof isLmsPersonalBoardOwner === 'function' && isLmsPersonalBoardOwner(resourceKey);
        const canClear = isPersonal ? canEdit : (isPersonalOwner || canManage);
        if (!canClear) {
            alert('You do not have permission to clear the board.');
            return true;
        }
        const confirmCopy = isPersonal
            ? (isPersonalOwner ? 'Clear your personal board?' : 'Clear this shared personal board?')
            : LMS_WHITEBOARD_CLEAR_CONFIRM;
        if (confirm(confirmCopy)) clearLmsWhiteboardBoard(resourceKey);
        return true;
    }
    if (['toggle-grid', 'toggle-props', 'zoom-in', 'zoom-out', 'zoom-fit', 'zoom-selection', 'toggle-theme'].includes(action)) {
        runLmsWhiteboardHudAction(action, resourceKey, canEdit, canManage, shell);
        return true;
    }
    if (action === 'bring-forward') { reorderLmsWhiteboardElement(resourceKey, 1); return true; }
    if (action === 'send-backward') { reorderLmsWhiteboardElement(resourceKey, -1); return true; }
    if (action === 'toggle-fullscreen') { toggleLmsWhiteboardFullscreen(); return true; }
    if (action === 'undo') {
        if (canEdit && typeof undoLmsWhiteboardHistory === 'function') undoLmsWhiteboardHistory(resourceKey);
        return true;
    }
    if (action === 'redo') {
        if (canEdit && typeof redoLmsWhiteboardHistory === 'function') redoLmsWhiteboardHistory(resourceKey);
        return true;
    }
    if (action === 'import-image') {
        shell.querySelector('[data-lms-whiteboard-image-input]')?.click();
        return true;
    }
    if (action === 'retry-sync') {
        if (typeof loadLmsWhiteboardWorkspace === 'function') loadLmsWhiteboardWorkspace(resourceKey, { force: true });
        if (typeof runImmediateLmsWhiteboardSync === 'function') runImmediateLmsWhiteboardSync(resourceKey, 'retry-sync');
        return true;
    }
    return false;
}

function bindLmsWhiteboardShellActions(shell, resourceKey = '') {
    if (!shell) return;
    const boundToken = String(resourceKey || '').trim();
    if (shell.dataset.lmsWhiteboardActionsBound === boundToken) return;
    shell.dataset.lmsWhiteboardActionsBound = boundToken;
    shell.addEventListener('click', (event) => {
        handleLmsWhiteboardShellActionClick(event, boundToken, shell);
    });
}

function bindLmsWhiteboardHudControls(shell, resourceKey = '', canEdit = false, canManage = false) {
    if (!shell) return;
    const boundToken = String(resourceKey || '').trim();

    const zoom = shell.querySelector('.lms-whiteboard-zoom');
    if (zoom && zoom.dataset.lmsWhiteboardZoomBound !== boundToken) {
        zoom.dataset.lmsWhiteboardZoomBound = boundToken;
        zoom.addEventListener('click', (event) => {
            const actionButton = event.target.closest?.('[data-lms-whiteboard-action]');
            if (!actionButton || !zoom.contains(actionButton)) return;
            event.preventDefault();
            event.stopPropagation();
            const rights = resolveLmsWhiteboardLiveEditRights(boundToken);
            runLmsWhiteboardHudAction(actionButton.dataset.lmsWhiteboardAction, boundToken, rights.canEdit, rights.canManage, shell);
        });
        zoom.querySelector('[data-lms-whiteboard-zoom-label]')?.addEventListener('dblclick', (event) => {
            event.preventDefault();
            event.stopPropagation();
            setLmsWhiteboardZoom(1, true, boundToken);
        });
    }

    const commandBar = shell.querySelector('[data-lms-whiteboard-command-bar]');
    if (commandBar && commandBar.dataset.lmsWhiteboardCommandBarBound !== boundToken) {
        commandBar.dataset.lmsWhiteboardCommandBarBound = boundToken;
        commandBar.addEventListener('click', (event) => {
            const toolButton = event.target.closest?.('button[data-lms-whiteboard-tool]');
            if (toolButton && commandBar.contains(toolButton)) {
                event.preventDefault();
                event.stopPropagation();
                const { canEdit: canEditNow } = resolveLmsWhiteboardLiveEditRights(boundToken);
                if (!canEditNow && toolButton.dataset.lmsWhiteboardTool !== 'select') {
                    alert('Editing is locked by instructor.');
                    return;
                }
                setLmsWhiteboardTool(toolButton.dataset.lmsWhiteboardTool);
                return;
            }
            const actionButton = event.target.closest?.('[data-lms-whiteboard-action]');
            if (!actionButton || !commandBar.contains(actionButton)) return;
            event.preventDefault();
            event.stopPropagation();
            const rights = resolveLmsWhiteboardLiveEditRights(boundToken);
            runLmsWhiteboardHudAction(actionButton.dataset.lmsWhiteboardAction, boundToken, rights.canEdit, rights.canManage, shell);
        });
    }

    const minimapShell = shell.querySelector('.lms-whiteboard-minimap-shell');
    if (minimapShell && minimapShell.dataset.lmsWhiteboardMinimapHudBound !== boundToken) {
        minimapShell.dataset.lmsWhiteboardMinimapHudBound = boundToken;
        minimapShell.addEventListener('click', (event) => {
            const actionButton = event.target.closest?.('[data-lms-whiteboard-action="toggle-minimap"]');
            if (!actionButton || !minimapShell.contains(actionButton)) return;
            event.preventDefault();
            event.stopPropagation();
            toggleLmsWhiteboardMinimap();
        });
    }

    const stageActions = shell.querySelector('.lms-whiteboard-stage-actions');
    if (stageActions && stageActions.dataset.lmsWhiteboardStageActionsBound !== boundToken) {
        stageActions.dataset.lmsWhiteboardStageActionsBound = boundToken;
        stageActions.addEventListener('click', (event) => {
            const actionButton = event.target.closest?.('[data-lms-whiteboard-action]');
            if (!actionButton || !stageActions.contains(actionButton)) return;
            event.preventDefault();
            event.stopPropagation();
            const rights = resolveLmsWhiteboardLiveEditRights(boundToken);
            runLmsWhiteboardHudAction(actionButton.dataset.lmsWhiteboardAction, boundToken, rights.canEdit, rights.canManage, shell);
        });
    }
}

function syncLmsWhiteboardFocusChrome(active = false) {
    document.body?.classList.toggle('kiu-lms-whiteboard-focus-active', Boolean(active));
}

function mountLmsWhiteboardFullscreenShell(shell) {
    if (!shell || shell.dataset.lmsWhiteboardFullscreenMounted === '1') return;
    shell.__lmsWhiteboardRestoreParent = shell.parentElement;
    shell.__lmsWhiteboardRestoreNext = shell.nextSibling;
    document.body.appendChild(shell);
    shell.dataset.lmsWhiteboardFullscreenMounted = '1';
    syncLmsWhiteboardShellBinding(shell.dataset.lmsWhiteboardKey || LMS_WHITEBOARD_UI.boundKey);
}

function restoreLmsWhiteboardFullscreenShell(shell) {
    if (!shell || shell.dataset.lmsWhiteboardFullscreenMounted !== '1') return;
    const parent = shell.__lmsWhiteboardRestoreParent;
    if (parent?.isConnected) {
        parent.insertBefore(shell, shell.__lmsWhiteboardRestoreNext || null);
    }
    delete shell.dataset.lmsWhiteboardFullscreenMounted;
    shell.__lmsWhiteboardRestoreParent = null;
    shell.__lmsWhiteboardRestoreNext = null;
}

function repaintLmsWhiteboardAfterFullscreenLayout(resourceKey = '', shell = null) {
    const targetShell = shell || getActiveLmsWhiteboardShell(resourceKey || LMS_WHITEBOARD_UI.boundKey);
    if (targetShell) {
        scheduleLmsWhiteboardLayoutRecovery(targetShell, resourceKey || LMS_WHITEBOARD_UI.boundKey);
        return;
    }
    requestAnimationFrame(() => {
        const stage = document.querySelector('[data-lms-whiteboard-region="stage"]');
        const canvas = document.querySelector('.lms-whiteboard-canvas');
        if (stage) syncLmsWhiteboardLogicalSizeFromStage(stage);
        if (canvas) setupLmsWhiteboardCanvasHiDpi(canvas);
        const key = resourceKey || LMS_WHITEBOARD_UI.boundKey;
        if (key) {
            paintLmsWhiteboardCanvas(key);
            if (typeof paintLmsWhiteboardMinimap === 'function') paintLmsWhiteboardMinimap(key);
        }
        if (typeof window.syncLmsWorkspaceChromeOffset === 'function') {
            window.syncLmsWorkspaceChromeOffset();
        }
    });
}

function updateLmsWhiteboardFullscreenUi() {
    const active = Boolean(LMS_WHITEBOARD_UI.fullscreen);
    document.querySelectorAll('[data-lms-whiteboard-action="toggle-fullscreen"]').forEach((button) => {
        const icon = button.querySelector('i');
        if (icon) icon.className = active ? 'fas fa-compress' : 'fas fa-up-right-and-down-left-from-center';
        button.title = active ? 'Exit fullscreen' : 'Fullscreen';
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (button.childNodes.length > 1) button.lastChild.textContent = active ? ' Exit' : ' Fullscreen';
    });
    const shell = getActiveLmsWhiteboardShell(LMS_WHITEBOARD_UI.boundKey);
    syncLmsWhiteboardPropsToggleUi(shell);
}

function toggleLmsWhiteboardFullscreen(force) {
    const next = typeof force === 'boolean' ? force : !LMS_WHITEBOARD_UI.fullscreen;
    const shell = getActiveLmsWhiteboardShell(LMS_WHITEBOARD_UI.boundKey);
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    LMS_WHITEBOARD_UI.fullscreen = next;
    syncLmsWhiteboardFocusChrome(next);
    if (shell) {
        shell.classList.toggle('is-fullscreen', next);
        if (next) {
            shell.classList.add('is-props-open');
            mountLmsWhiteboardFullscreenShell(shell);
        } else {
            restoreLmsWhiteboardFullscreenShell(shell);
        }
    }
    updateLmsWhiteboardFullscreenUi();
    syncLmsWhiteboardShellBinding(resourceKey);
    repaintLmsWhiteboardAfterFullscreenLayout(resourceKey, shell);
    return next;
}

function exitLmsWhiteboardFullscreen() {
    if (!LMS_WHITEBOARD_UI.fullscreen) return false;
    toggleLmsWhiteboardFullscreen(false);
    return true;
}

function setLmsWhiteboardPropsTab(tabId = 'draw') {
    const tab = String(tabId || 'draw');
    LMS_WHITEBOARD_UI.propsTab = tab;
    document.querySelectorAll('[data-lms-whiteboard-props-tab]').forEach(button => {
        const active = button.dataset.lmsWhiteboardPropsTab === tab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-lms-whiteboard-props-panel]').forEach(panel => {
        const active = panel.dataset.lmsWhiteboardPropsPanel === tab;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
    });
}

function closeLmsWhiteboardMoreMenu() {
    const overlay = document.getElementById('lms-whiteboard-more-menu');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function openLmsWhiteboardMoreMenu(canEdit = false, canManage = false) {
    closeLmsWhiteboardMoreMenu();
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    const staffActions = canManage ? `
        <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="export-png"><i class="fas fa-image"></i> Export PNG</button>
        <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="export-pdf"><i class="fas fa-file-pdf"></i> Export PDF</button>
        <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="clear-board"><i class="fas fa-trash-can"></i> Clear all drawings</button>
        <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="end-session"><i class="fas fa-stop"></i> End session</button>` : '';
    const overlay = document.createElement('div');
    overlay.id = 'lms-whiteboard-more-menu';
    overlay.className = 'lms-quiz-board-overlay lms-whiteboard-more-overlay lms-glass-dialog-overlay';
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLmsWhiteboardMoreMenu();
    });
    overlay.innerHTML = renderLmsGlassDialogCard({
        hookClass: 'lms-quiz-board-modal lms-whiteboard-more-modal',
        bodyClass: 'lms-quiz-board-body lms-whiteboard-more-body',
        title: 'More actions',
        icon: 'fa-ellipsis',
        subtitle: 'Layer order, import, and session tools.',
        closeAttr: 'data-lms-whiteboard-action="close-more-menu"',
        bodyHtml: `
                <div class="lms-whiteboard-more-grid">
                    <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="import-image" ${canEdit ? '' : 'disabled'}><i class="fas fa-image"></i> Import file</button>
                    <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="bring-forward" ${canEdit ? '' : 'disabled'}><i class="fas fa-arrow-up"></i> Bring forward</button>
                    <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="send-backward" ${canEdit ? '' : 'disabled'}><i class="fas fa-arrow-down"></i> Send backward</button>
                    <label class="lms-whiteboard-more-toggle">
                        <span><i class="fas fa-border-all"></i> Snap to grid</span>
                        <input type="checkbox" data-lms-whiteboard-prop="snap" ${LMS_WHITEBOARD_UI.snapToGrid ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                    </label>
                    <button type="button" class="lux-secondary-btn lms-whiteboard-more-item" data-lms-whiteboard-action="toggle-theme"><i class="fas fa-circle-half-stroke"></i> Light / dark board</button>
                    ${staffActions}
                </div>`
    });
    overlay.querySelector('[data-lms-whiteboard-action="close-more-menu"]')?.addEventListener('click', closeLmsWhiteboardMoreMenu);
    overlay.addEventListener('change', (event) => {
        const snapInput = event.target.closest?.('[data-lms-whiteboard-prop="snap"]');
        if (!snapInput) return;
        LMS_WHITEBOARD_UI.snapToGrid = Boolean(snapInput.checked);
        document.querySelectorAll('[data-lms-whiteboard-prop="snap"]').forEach(input => {
            if (input !== snapInput) input.checked = LMS_WHITEBOARD_UI.snapToGrid;
        });
    });
    overlay.addEventListener('click', (event) => {
        const actionButton = event.target.closest?.('[data-lms-whiteboard-action]');
        if (!actionButton) return;
        const action = actionButton.dataset.lmsWhiteboardAction;
        if (action === 'close-more-menu') return;
        event.preventDefault();
        if (action === 'import-image') {
            document.querySelector('[data-lms-whiteboard-image-input]')?.click();
            closeLmsWhiteboardMoreMenu();
            return;
        }
        if (action === 'bring-forward') { reorderLmsWhiteboardElement(resourceKey, 1); closeLmsWhiteboardMoreMenu(); return; }
        if (action === 'send-backward') { reorderLmsWhiteboardElement(resourceKey, -1); closeLmsWhiteboardMoreMenu(); return; }
        if (action === 'toggle-theme') { toggleLmsWhiteboardTheme(); closeLmsWhiteboardMoreMenu(); return; }
        if (action === 'export-png') { exportLmsWhiteboardImage(resourceKey, 'png'); closeLmsWhiteboardMoreMenu(); return; }
        if (action === 'export-pdf') { exportLmsWhiteboardImage(resourceKey, 'pdf'); closeLmsWhiteboardMoreMenu(); return; }
        if (action === 'clear-board' && confirm(LMS_WHITEBOARD_CLEAR_CONFIRM)) {
            clearLmsWhiteboardBoard(resourceKey);
            closeLmsWhiteboardMoreMenu();
            return;
        }
        if (action === 'end-session' && confirm('End the whiteboard session for this class?')) {
            if (typeof endLmsWhiteboardSession === 'function') endLmsWhiteboardSession(resourceKey);
            closeLmsWhiteboardMoreMenu();
        }
    });
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

function updateLmsWhiteboardSelectionCountUi() {
    const count = getLmsWhiteboardSelectedIds().length;
    document.querySelectorAll('[data-lms-whiteboard-selection-count]').forEach(node => {
        node.textContent = count ? `${count} selected` : 'Select an object to reorder.';
    });
    refreshLmsWhiteboardLayersList();
    updateLmsWhiteboardLayerActionState();
}

function getLmsWhiteboardLayerLabel(element = {}) {
    if (element.type === 'document') return element.fileName || 'Document';
    if (element.type === 'sticky') return (element.text || 'Sticky').slice(0, 40) || 'Sticky';
    if (element.type === 'text') return (element.text || 'Text').slice(0, 40) || 'Text';
    if (element.type === 'stroke') return element.parentDocumentId ? 'Annotation' : 'Stroke';
    if (element.type === 'rect') return Number(element.cornerRadius) > 0 ? 'Rounded rectangle' : 'Rectangle';
    if (element.type === 'ellipse') return 'Circle';
    if (element.type === 'grid') return `Grid ${Math.max(1, Number(element.rows) || 1)}×${Math.max(1, Number(element.cols) || 1)}`;
    if (element.type === 'line') return 'Line';
    if (element.type === 'arrow') return 'Arrow';
    return element.type ? String(element.type).charAt(0).toUpperCase() + String(element.type).slice(1) : 'Item';
}

function getLmsWhiteboardLayerIcon(element = {}) {
    if (element.type === 'document') {
        if (typeof isLmsWhiteboardImageMime === 'function' && isLmsWhiteboardImageMime(element.mimeType, element.fileName)) {
            return 'fa-image';
        }
        return 'fa-file';
    }
    const map = {
        sticky: 'fa-note-sticky',
        text: 'fa-font',
        stroke: 'fa-pen',
        image: 'fa-image',
        rect: 'fa-square',
        ellipse: 'fa-circle',
        grid: 'fa-table-cells',
        line: 'fa-minus',
        arrow: 'fa-arrow-right-long'
    };
    return map[element.type] || 'fa-shapes';
}

function refreshLmsWhiteboardLayersList() {
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    const workspace = resourceKey && typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    const selected = new Set(getLmsWhiteboardSelectedIds());
    document.querySelectorAll('[data-lms-whiteboard-layers-list]').forEach(list => {
        const elements = (workspace.elements || []).filter(item => !item.hidden);
        if (!elements.length) {
            list.innerHTML = '<div class="lms-live-copy lms-whiteboard-layers-empty">No objects on the board yet.</div>';
            return;
        }
        list.innerHTML = elements.slice().reverse().map(element => {
            const label = typeof escapeHtml === 'function' ? escapeHtml(getLmsWhiteboardLayerLabel(element)) : getLmsWhiteboardLayerLabel(element);
            const icon = getLmsWhiteboardLayerIcon(element);
            const active = selected.has(element.id) ? ' is-active' : '';
            const locked = element.locked ? ' <i class="fas fa-lock lms-whiteboard-layer-lock" aria-hidden="true"></i>' : '';
            return `<button type="button" class="lms-whiteboard-layer-item${active}" data-lms-whiteboard-layer-id="${element.id}"><i class="fas ${icon}" aria-hidden="true"></i><span>${label}</span>${locked}</button>`;
        }).join('');
    });
    updateLmsWhiteboardLayerActionState();
}

function updateLmsWhiteboardLayerActionState() {
    const hasSelection = getLmsWhiteboardSelectedIds().length > 0;
    const canEdit = typeof canEditLmsWhiteboard === 'function' && canEditLmsWhiteboard(LMS_WHITEBOARD_UI.boundKey);
    document.querySelectorAll('[data-lms-whiteboard-action="bring-forward"], [data-lms-whiteboard-action="send-backward"]').forEach(button => {
        button.toggleAttribute('disabled', !canEdit || !hasSelection);
    });
}


        const api = {
            resolveLmsWhiteboardThemeId,
            applyLmsWhiteboardTheme,
            toggleLmsWhiteboardTheme,
            renderLmsWhiteboardToolButton,
            renderLmsWhiteboardToolRail,
            renderLmsWhiteboardCommandBar,
            resolveLmsWhiteboardLiveEditRights,
            setLmsWhiteboardTool,
            syncLmsWhiteboardGridToolPropsVisibility,
            getLmsWhiteboardMembersDashboardScope,
            buildLmsWhiteboardDashboardShareStatusMap,
            renderLmsWhiteboardDashboardShareBadge,
            renderLmsWhiteboardDashboardFilter,
            renderLmsWhiteboardDashboardSection,
            renderLmsWhiteboardMembersPanel,
            closeLmsWhiteboardMembersModal,
            openLmsWhiteboardMembersModal,
            renderLmsWhiteboardPropsPanel,
            renderLmsWhiteboardStatusPills,
            renderLmsWhiteboardBannerStatusPills,
            renderLmsWhiteboardStaffSessionBannerPills,
            renderLmsWhiteboardBanner,
            renderLmsWhiteboardEmptyStudent,
            renderLmsWhiteboardMissingCourseState,
            isLmsWhiteboardSessionTokenMissing,
            buildLmsWhiteboardSignInHref,
            renderLmsWhiteboardSyncError,
            syncLmsWhiteboardPropsToggleUi,
            toggleLmsWhiteboardPropsDock,
            isLmsWhiteboardNavToolNode,
            syncLmsWhiteboardToolEditState,
            updateLmsWhiteboardSessionChrome,
            updateLmsWhiteboardVolatileUi,
            runLmsWhiteboardHudAction,
            handleLmsWhiteboardShellActionClick,
            bindLmsWhiteboardShellActions,
            bindLmsWhiteboardHudControls,
            syncLmsWhiteboardFocusChrome,
            mountLmsWhiteboardFullscreenShell,
            restoreLmsWhiteboardFullscreenShell,
            repaintLmsWhiteboardAfterFullscreenLayout,
            updateLmsWhiteboardFullscreenUi,
            toggleLmsWhiteboardFullscreen,
            exitLmsWhiteboardFullscreen,
            setLmsWhiteboardPropsTab,
            closeLmsWhiteboardMoreMenu,
            openLmsWhiteboardMoreMenu,
            updateLmsWhiteboardSelectionCountUi,
            getLmsWhiteboardLayerLabel,
            getLmsWhiteboardLayerIcon,
            refreshLmsWhiteboardLayersList,
            updateLmsWhiteboardLayerActionState,
            LMS_WHITEBOARD_TOOL_GROUPS,
            LMS_WHITEBOARD_MEMBERS_UI,
            LMS_WHITEBOARD_SESSION_SYNC_MESSAGE
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsWhiteboardChromeApi({});
})();
