/* Personal LMS workspace overlay: scratch board, tab shortcuts, saved history. */

const LMS_PERSONAL_DASHBOARD_AUTOSAVE_THROTTLE_MS = 20000;
const LMS_PERSONAL_DASHBOARD_HISTORY_EMPTY_COPY = 'Progress autosaves while you work. Use Save named copy only when you want an extra checkpoint to keep separately.';
const LMS_PERSONAL_DASHBOARD_STAFF_HISTORY_EMPTY_COPY = 'No shared progress yet. The student can share saved entries from their workspace history.';
const LMS_PERSONAL_DASHBOARD = typeof window !== 'undefined'
    ? (window.LMS_PERSONAL_DASHBOARD = window.LMS_PERSONAL_DASHBOARD || { staffView: null })
    : { staffView: null };

const LMS_PERSONAL_DASHBOARD_SHORTCUTS = [
    { tab: 'sessions', label: 'Sessions', icon: 'fa-calendar-check' },
    { tab: 'live-quiz', label: 'Live Quiz', icon: 'fa-bolt' },
    { tab: 'interaction', label: 'Interaction', icon: 'fa-comments' },
    { tab: 'calls', label: 'Calls', icon: 'fa-video' },
    { tab: 'whiteboard', label: 'Whiteboard', icon: 'fa-chalkboard' },
    { tab: 'workspace', label: 'Assignments', icon: 'fa-clipboard-list' },
    { tab: 'materials', label: 'Materials', icon: 'fa-folder-open' },
    { tab: 'concepts', label: 'Concepts', icon: 'fa-lightbulb' },
    { tab: 'quiz', label: 'My Quizzes', icon: 'fa-pen-to-square' },
    { tab: 'gradebook', label: 'Grades', icon: 'fa-chart-bar' }
];

function getLmsPersonalDashboardResourceKey() {
    if (typeof buildLmsPersonalBoardKey !== 'function') return '';
    return buildLmsPersonalBoardKey(
        typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId,
        typeof getCurrentUserId === 'function' ? getCurrentUserId() : ''
    );
}

function isLmsPersonalDashboardStaffMonitor() {
    return Boolean(String(LMS_PERSONAL_DASHBOARD.staffView?.studentId || '').trim());
}

function getLmsPersonalDashboardActiveResourceKey() {
    const staffKey = String(LMS_PERSONAL_DASHBOARD.staffView?.resourceKey || '').trim();
    if (staffKey) return staffKey;
    return getLmsPersonalDashboardResourceKey();
}

function getLmsPersonalDashboardWorkspaceStaffShare(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardActiveResourceKey() || '').trim();
    if (!key || typeof ensureLmsWhiteboardWorkspace !== 'function') return 'none';
    const workspace = ensureLmsWhiteboardWorkspace(key);
    return String(workspace?.staffShare || workspace?.staffShareLevel || 'none').trim() || 'none';
}

function getLmsPersonalDashboardStaffShareLevel(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardActiveResourceKey() || '').trim();
    if (!key || typeof ensureLmsWhiteboardWorkspace !== 'function') return 'none';
    const workspace = ensureLmsWhiteboardWorkspace(key);
    return String(workspace?.shareLevel || workspace?.staffShareLevel || workspace?.staffShare || 'none').trim() || 'none';
}

function canEditLmsPersonalDashboardAsGuest(resourceKey = '') {
    if (!isLmsPersonalDashboardStaffMonitor()) return false;
    return getLmsPersonalDashboardStaffShareLevel(resourceKey) === 'edit';
}

function getLmsPersonalDashboardPeerShares(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardActiveResourceKey() || '').trim();
    if (!key || typeof ensureLmsWhiteboardWorkspace !== 'function') return {};
    const workspace = ensureLmsWhiteboardWorkspace(key);
    const peers = workspace?.peerShares;
    return peers && typeof peers === 'object' && !Array.isArray(peers) ? { ...peers } : {};
}

function getLmsPersonalDashboardGroupShare(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardActiveResourceKey() || '').trim();
    if (!key || typeof ensureLmsWhiteboardWorkspace !== 'function') return 'none';
    const workspace = ensureLmsWhiteboardWorkspace(key);
    return String(workspace?.groupShare || 'none').trim() || 'none';
}

function getLmsPersonalDashboardShareScope() {
    const courseKey = typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId;
    const parsed = typeof parseLmsCourseKey === 'function'
        ? parseLmsCourseKey(courseKey)
        : { courseId: courseKey, groupId: '', sectionType: '' };
    const courseId = typeof getLmsPersonalDashboardCourseId === 'function'
        ? getLmsPersonalDashboardCourseId(courseKey)
        : String(parsed.courseId || courseKey || '').trim();
    const groupId = String(parsed.groupId || '').trim();
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? String(getCurrentLmsSectionType() || '').trim()
        : String(parsed.sectionType || '').trim();
    return { courseId, groupId, sectionType, courseKey };
}

function getLmsPersonalDashboardClassmateRoster() {
    const scope = getLmsPersonalDashboardShareScope();
    const selfId = String(typeof getCurrentUserId === 'function' ? getCurrentUserId() || '' : '').trim();
    const seen = new Set();
    const students = [];
    const addStudents = (list = []) => {
        (Array.isArray(list) ? list : []).forEach((student) => {
            const id = String(student?.id || student?.userId || '').trim();
            if (!id || id === selfId || seen.has(id)) return;
            seen.add(id);
            students.push({
                id,
                name: String(student?.nameEn || student?.name || student?.id || '').trim() || `Student ${id}`
            });
        });
    };
    if (typeof getEnrolledStudentsForGroup === 'function' && scope.courseId) {
        addStudents(getEnrolledStudentsForGroup(scope.courseId, scope.groupId) || []);
        if (!students.length && scope.courseKey) {
            addStudents(getEnrolledStudentsForGroup(scope.courseKey, scope.groupId) || []);
        }
    }
    // Fallbacks when schedule enrollment map is empty (common in local/dev).
    if (!students.length && typeof getLmsQuizEligibleStudents === 'function') {
        addStudents(getLmsQuizEligibleStudents(scope.courseKey || scope.courseId) || []);
    }
    if (!students.length && typeof KIU_STATE !== 'undefined' && KIU_STATE?.studentGrades) {
        Object.keys(KIU_STATE.studentGrades || {}).forEach((key) => {
            if (scope.groupId && !String(key).includes(scope.groupId)) return;
            addStudents(KIU_STATE.studentGrades[key] || []);
        });
    }
    return students.sort((left, right) => left.name.localeCompare(right.name));
}

function formatLmsPersonalDashboardShareLevelLabel(level = 'none') {
    const normalized = String(level || 'none').trim() || 'none';
    if (normalized === 'edit') return 'Edit';
    if (normalized === 'view') return 'View';
    return 'Off';
}

function getLmsPersonalDashboardShareSummary(resourceKey = '') {
    const staffShare = getLmsPersonalDashboardWorkspaceStaffShare(resourceKey);
    const groupShare = getLmsPersonalDashboardGroupShare(resourceKey);
    const peerCount = Object.keys(getLmsPersonalDashboardPeerShares(resourceKey)).length;
    const parts = [];
    if (staffShare !== 'none') parts.push(`Instructors · ${formatLmsPersonalDashboardShareLevelLabel(staffShare)}`);
    if (groupShare !== 'none') parts.push(`Group · ${formatLmsPersonalDashboardShareLevelLabel(groupShare)}`);
    if (peerCount) parts.push(`${peerCount} classmate${peerCount === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' · ') : 'Private';
}

function setLmsPersonalDashboardShareStatus(message = '', isError = false) {
    const node = document.querySelector('[data-lms-personal-dashboard-share-status]');
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(isError && message));
    node.hidden = !message;
}

function getLmsPersonalDashboardInitials(name = '') {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function renderLmsPersonalDashboardShareLevelGroup(action = '', value = 'none', extraAttrs = '') {
    const level = String(value || 'none').trim() || 'none';
    const options = [
        { id: 'none', label: 'Off', tone: 'is-off' },
        { id: 'view', label: 'View', tone: 'is-view' },
        { id: 'edit', label: 'Edit', tone: 'is-edit' }
    ];
    const buttons = options.map((option) => {
        const active = level === option.id;
        return `
            <button type="button"
                class="lms-personal-dashboard-share-seg-btn ${option.tone}${active ? ' is-active' : ''}"
                data-lms-personal-dashboard-action="${escapeHtml(action)}"
                data-share-level="${option.id}"
                aria-pressed="${active ? 'true' : 'false'}"
                ${extraAttrs}>${escapeHtml(option.label)}</button>`;
    }).join('');
    return `<div class="lms-personal-dashboard-share-seg" role="group" aria-label="Access level">${buttons}</div>`;
}

function setLmsPersonalDashboardShareSegActive(groupEl, level = 'none') {
    if (!groupEl) return;
    const next = String(level || 'none').trim() || 'none';
    groupEl.querySelectorAll('.lms-personal-dashboard-share-seg-btn').forEach((btn) => {
        const active = String(btn.dataset.shareLevel || '') === next;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function renderLmsPersonalDashboardShareButton(resourceKey = '') {
    if (isLmsPersonalDashboardStaffMonitor()) return '';
    const summary = getLmsPersonalDashboardShareSummary(resourceKey);
    const isPrivate = summary === 'Private';
    return `
        <button type="button" class="lux-secondary-btn lms-personal-dashboard-share-trigger${isPrivate ? '' : ' is-shared'}" data-lms-personal-dashboard-action="open-share-panel" title="Manage who can open this workspace">
            <i class="fas fa-share-nodes"></i> Share
            <span class="lms-personal-dashboard-share-trigger-summary">${escapeHtml(summary)}</span>
        </button>`;
}

function renderLmsPersonalDashboardSharePanel(resourceKey = '') {
    if (isLmsPersonalDashboardStaffMonitor()) return '';
    const staffShare = getLmsPersonalDashboardWorkspaceStaffShare(resourceKey);
    const groupShare = getLmsPersonalDashboardGroupShare(resourceKey);
    const peerShares = getLmsPersonalDashboardPeerShares(resourceKey);
    const classmates = getLmsPersonalDashboardClassmateRoster();
    const peerRows = classmates.length
        ? classmates.map((student) => {
            const level = String(peerShares[student.id] || 'none').trim() || 'none';
            const initials = getLmsPersonalDashboardInitials(student.name);
            return `
                <div class="lms-personal-dashboard-peer-share-row">
                    <div class="lms-personal-dashboard-peer-share-identity">
                        <span class="lms-personal-dashboard-peer-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
                        <span class="lms-personal-dashboard-peer-share-name">${escapeHtml(student.name)}</span>
                    </div>
                    ${renderLmsPersonalDashboardShareLevelGroup('set-peer-share', level, `data-peer-user-id="${escapeHtml(student.id)}"`)}
                </div>`;
        }).join('')
        : `
            <div class="lms-personal-dashboard-share-empty">
                <i class="fas fa-user-group" aria-hidden="true"></i>
                <p>Couldn't load classmates for this group.</p>
                <span>Open a course section, or try again after enrollment data loads.</span>
            </div>`;
    return `
        <div class="lms-personal-dashboard-share-overlay" data-lms-personal-dashboard-share-overlay="" hidden>
            <div class="lms-personal-dashboard-share-panel lms-live-card" data-lms-personal-dashboard-share-panel="" role="dialog" aria-modal="true" aria-labelledby="lms-personal-dashboard-share-title">
                <div class="lms-personal-dashboard-share-panel-head">
                    <div class="lms-personal-dashboard-share-panel-title">
                        <span class="lms-personal-dashboard-share-panel-icon"><i class="fas fa-share-nodes" aria-hidden="true"></i></span>
                        <div>
                            <strong id="lms-personal-dashboard-share-title">Share workspace</strong>
                            <p class="lms-personal-dashboard-share-panel-copy">Who can open your live board. Combine instructors, whole group, and people — classmates get the higher of group or personal access.</p>
                        </div>
                    </div>
                    <button type="button" class="lux-ghost-btn lux-glass-dialog-close-btn lms-personal-dashboard-share-close" data-lms-personal-dashboard-action="close-share-panel" aria-label="Close share panel"><i class="fas fa-times"></i></button>
                </div>
                <div class="lms-personal-dashboard-share-section">
                    <div class="lms-route-eyebrow lms-personal-dashboard-share-section-label"><i class="fas fa-chalkboard-user"></i> Instructors</div>
                    <div class="lms-personal-dashboard-share-section-row">
                        <span class="lms-personal-dashboard-share-section-copy">All TAs &amp; professors on this course</span>
                        ${renderLmsPersonalDashboardShareLevelGroup('set-workspace-share', staffShare)}
                    </div>
                </div>
                <div class="lms-personal-dashboard-share-section">
                    <div class="lms-route-eyebrow lms-personal-dashboard-share-section-label"><i class="fas fa-users"></i> Whole group</div>
                    <div class="lms-personal-dashboard-share-section-row">
                        <span class="lms-personal-dashboard-share-section-copy">Everyone in your section group</span>
                        ${renderLmsPersonalDashboardShareLevelGroup('set-group-share', groupShare)}
                    </div>
                </div>
                <div class="lms-personal-dashboard-share-section lms-personal-dashboard-share-section--people">
                    <div class="lms-route-eyebrow lms-personal-dashboard-share-section-label"><i class="fas fa-user-group"></i> Specific classmates</div>
                    <label class="lms-personal-dashboard-share-search">
                        <i class="fas fa-search" aria-hidden="true"></i>
                        <input type="search" class="lms-personal-dashboard-share-search-input" data-lms-personal-dashboard-action="filter-peer-share" placeholder="Search classmates" autocomplete="off">
                    </label>
                    <div class="lms-personal-dashboard-peer-share-list" data-lms-personal-dashboard-peer-share-list="">${peerRows}</div>
                </div>
                <div class="lms-personal-dashboard-share-panel-foot">
                    <span class="lms-personal-dashboard-share-status" data-lms-personal-dashboard-share-status="" hidden></span>
                    <button type="button" class="lux-primary-btn lms-personal-dashboard-share-done" data-lms-personal-dashboard-action="close-share-panel">Done</button>
                </div>
            </div>
        </div>`;
}

function handleLmsPersonalDashboardShareEscape(event) {
    if (event.key !== 'Escape') return;
    const overlay = document.querySelector('[data-lms-personal-dashboard-share-overlay]');
    if (!overlay || overlay.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    closeLmsPersonalDashboardSharePanel();
}

function openLmsPersonalDashboardSharePanel() {
    const overlay = document.querySelector('[data-lms-personal-dashboard-share-overlay]');
    if (!overlay) return;
    overlay.hidden = false;
    overlay.classList.add('is-open');
    document.getElementById('lms-personal-dashboard-overlay')?.classList.add('lms-personal-dashboard-share-open');
    if (typeof window !== 'undefined') {
        if (window.__lmsPersonalDashboardShareEscHandler) {
            window.removeEventListener('keydown', window.__lmsPersonalDashboardShareEscHandler, true);
        }
        window.__lmsPersonalDashboardShareEscHandler = handleLmsPersonalDashboardShareEscape;
        window.addEventListener('keydown', window.__lmsPersonalDashboardShareEscHandler, true);
    }
}

function closeLmsPersonalDashboardSharePanel() {
    const overlay = document.querySelector('[data-lms-personal-dashboard-share-overlay]');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.classList.remove('is-open');
    document.getElementById('lms-personal-dashboard-overlay')?.classList.remove('lms-personal-dashboard-share-open');
    if (typeof window !== 'undefined' && window.__lmsPersonalDashboardShareEscHandler) {
        window.removeEventListener('keydown', window.__lmsPersonalDashboardShareEscHandler, true);
        window.__lmsPersonalDashboardShareEscHandler = null;
    }
}

function syncLmsPersonalDashboardShareTrigger(resourceKey = '') {
    const trigger = document.querySelector('[data-lms-personal-dashboard-action="open-share-panel"]');
    if (!trigger) return;
    const summary = getLmsPersonalDashboardShareSummary(resourceKey);
    const summaryNode = trigger.querySelector('.lms-personal-dashboard-share-trigger-summary');
    if (summaryNode) summaryNode.textContent = summary;
    trigger.classList.toggle('is-shared', summary !== 'Private');
}

function filterLmsPersonalDashboardPeerShareList(query = '') {
    const list = document.querySelector('[data-lms-personal-dashboard-peer-share-list]');
    if (!list) return;
    const needle = String(query || '').trim().toLowerCase();
    list.querySelectorAll('.lms-personal-dashboard-peer-share-row').forEach((row) => {
        const name = String(row.querySelector('.lms-personal-dashboard-peer-share-name')?.textContent || '').toLowerCase();
        row.hidden = Boolean(needle && !name.includes(needle));
    });
}

function renderLmsPersonalDashboardSharedWithMePanel() {
    if (isLmsPersonalDashboardStaffMonitor()) return '';
    return `
        <div class="lms-personal-dashboard-shared-with-me" data-lms-personal-dashboard-shared-with-me="">
            <div class="lms-route-eyebrow lms-route-inline lms-route-inline-gap-8"><i class="fas fa-share-nodes"></i> Shared with me</div>
            <div class="lms-personal-dashboard-shared-with-me-list" data-lms-personal-dashboard-shared-with-me-list="">
                <div class="lms-live-copy">Loading shared boards…</div>
            </div>
        </div>`;
}

async function refreshLmsPersonalDashboardSharedWithMe() {
    const list = document.querySelector('[data-lms-personal-dashboard-shared-with-me-list]');
    if (!list || isLmsPersonalDashboardStaffMonitor()) return;
    if (typeof fetchLmsPersonalDashboardSharedWithMe !== 'function') {
        list.innerHTML = '<div class="lms-live-copy">Shared boards unavailable.</div>';
        return;
    }
    const courseId = typeof getLmsPersonalDashboardCourseId === 'function'
        ? getLmsPersonalDashboardCourseId()
        : '';
    if (!courseId) {
        list.innerHTML = '<div class="lms-live-copy">Open a course group first.</div>';
        return;
    }
    try {
        const scope = getLmsPersonalDashboardHistoryScopeOptions();
        const response = await fetchLmsPersonalDashboardSharedWithMe(courseId, scope);
        const items = Array.isArray(response?.items) ? response.items : [];
        if (!items.length) {
            list.innerHTML = '<div class="lms-live-copy">No classmates have shared a board with you yet.</div>';
            return;
        }
        const roster = getLmsPersonalDashboardClassmateRoster();
        const nameById = new Map(roster.map(student => [student.id, student.name]));
        list.innerHTML = items.map(item => {
            const ownerId = String(item.ownerId || item.studentId || '').trim();
            const name = nameById.get(ownerId) || `Student ${ownerId}`;
            const level = String(item.shareLevel || item.staffShareLevel || 'view').trim() || 'view';
            const badge = level === 'edit'
                ? '<span class="lms-personal-dashboard-share-badge is-edit">Edit</span>'
                : '<span class="lms-personal-dashboard-share-badge is-view">View</span>';
            return `
                <div class="lms-personal-dashboard-shared-with-me-row">
                    <span class="lms-personal-dashboard-peer-share-name">${escapeHtml(name)} ${badge}</span>
                    <button type="button" class="lux-secondary-btn" data-lms-personal-dashboard-action="open-shared-workspace" data-student-id="${escapeHtml(ownerId)}" data-student-name="${escapeHtml(name)}">
                        <i class="fas fa-user-pen"></i> Open
                    </button>
                </div>`;
        }).join('');
    } catch (_error) {
        list.innerHTML = '<div class="lms-live-copy">Shared boards could not be loaded.</div>';
    }
}

function syncLmsPersonalDashboardAutosaveStatus(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardActiveResourceKey() || '').trim();
    const statusNode = document.querySelector('[data-lms-personal-dashboard-autosave-status]');
    if (!statusNode || !key) return;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(key) : null;
    const lastAutosaveAt = Number(workspace?.ui?.lastAutosaveAt || 0);
    if (!lastAutosaveAt) {
        statusNode.textContent = 'Autosave on';
        statusNode.classList.remove('is-saving');
        return;
    }
    statusNode.textContent = `Autosaved ${new Date(lastAutosaveAt).toLocaleTimeString()}`;
    statusNode.classList.remove('is-saving');
}

function pulseLmsPersonalDashboardActionButton(button) {
    if (!button || button.disabled) return;
    button.classList.remove('is-action-pulse');
    void button.offsetWidth;
    button.classList.add('is-action-pulse');
    button.addEventListener('animationend', () => button.classList.remove('is-action-pulse'), { once: true });
}

function maybePulseLmsPersonalDashboardWhiteboardAction(event) {
    const actionButton = event.target.closest?.('[data-lms-whiteboard-action]');
    if (!actionButton || actionButton.disabled) return;
    if (!actionButton.closest('.lms-personal-dashboard-board-host')) return;
    const action = String(actionButton.dataset.lmsWhiteboardAction || '').trim();
    if (!['undo', 'redo', 'clear-board'].includes(action)) return;
    pulseLmsPersonalDashboardActionButton(actionButton);
}

function handleLmsPersonalDashboardPageHide() {
    if (!isLmsPersonalDashboardOpen() || isLmsPersonalDashboardStaffMonitor()) return;
    const resourceKey = getLmsPersonalDashboardActiveResourceKey();
    if (!resourceKey) return;
    if (typeof flushLmsWhiteboardSync === 'function') flushLmsWhiteboardSync(resourceKey);
    if (typeof flushLmsPersonalDashboardAutosave === 'function') flushLmsPersonalDashboardAutosave(resourceKey);
}

function renderLmsPersonalDashboardShareBadge(snapshot = {}) {
    const share = String(snapshot.staffShare || 'none').trim() || 'none';
    if (share === 'view') {
        return '<span class="lms-personal-dashboard-share-badge is-view">View shared</span>';
    }
    if (share === 'edit') {
        return '<span class="lms-personal-dashboard-share-badge is-edit">Edit shared</span>';
    }
    return '';
}

function renderLmsPersonalDashboardShareControl(snapshot = {}) {
    if (isLmsPersonalDashboardStaffMonitor() || snapshot.isAutosave) return '';
    const snapshotId = String(snapshot.id || '').trim();
    const ownerResourceKey = String(snapshot.resourceKey || '').trim();
    const share = String(snapshot.staffShare || 'none').trim() || 'none';
    if (!snapshotId || !ownerResourceKey) return '';
    return `
        <label class="lms-personal-dashboard-share-field" title="Share with instructor">
            <span class="lms-personal-dashboard-share-label">Instructor</span>
            <select class="lms-personal-dashboard-share-select" data-lms-personal-dashboard-action="set-share" data-lms-personal-dashboard-snapshot="${escapeHtml(snapshotId)}" data-lms-personal-dashboard-resource-key="${escapeHtml(ownerResourceKey)}">
                <option value="none"${share === 'none' ? ' selected' : ''}>Private</option>
                <option value="view"${share === 'view' ? ' selected' : ''}>Share · view</option>
                <option value="edit"${share === 'edit' ? ' selected' : ''}>Share · edit</option>
            </select>
        </label>`;
}

function getLmsPersonalDashboardCourseId() {
    if (typeof window.getLmsPersonalDashboardCourseId === 'function') {
        return window.getLmsPersonalDashboardCourseId(
            typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId
        );
    }
    const courseKey = typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId;
    const raw = String(courseKey || '').trim();
    if (!raw.includes('::')) return raw;
    return raw.split('::')[0].trim();
}

function formatLmsPersonalDashboardSectionLabel(sectionType = '') {
    const normalized = String(sectionType || '').trim().toLowerCase();
    if (normalized === 'workshop') return 'Workshop';
    if (normalized === 'lecture') return 'Lecture';
    if (!normalized) return '';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatLmsPersonalDashboardHistoryBadge(snapshot = {}) {
    const groupId = String(snapshot.groupId || '').trim();
    const sectionLabel = formatLmsPersonalDashboardSectionLabel(snapshot.sectionType);
    const parts = [groupId, sectionLabel].filter(Boolean);
    if (!parts.length) return '';
    return `<span class="lms-personal-dashboard-history-badge">${escapeHtml(parts.join(' · '))}</span>`;
}

function isLmsPersonalDashboardOpen() {
    const overlay = document.getElementById('lms-personal-dashboard-overlay');
    return Boolean(overlay && !overlay.hidden && overlay.classList.contains('is-open'));
}

function renderLmsPersonalDashboardShortcuts() {
    const role = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '';
    const shortcuts = LMS_PERSONAL_DASHBOARD_SHORTCUTS.filter(item => {
        if (item.tab === 'monitoring') return false;
        if (role === 'student' && item.tab === 'monitoring') return false;
        return true;
    });
    return shortcuts.map(item => `
        <button type="button" class="lux-secondary-btn lms-personal-dashboard-shortcut" data-lms-personal-dashboard-tab="${escapeHtml(item.tab)}">
            <i class="fas ${escapeHtml(item.icon)}"></i> ${escapeHtml(item.label)}
        </button>
    `).join('');
}

function renderLmsPersonalDashboardHistoryList(items = []) {
    const snapshots = Array.isArray(items) ? items : [];
    const staffMonitor = isLmsPersonalDashboardStaffMonitor();
    if (!snapshots.length) {
        const emptyCopy = staffMonitor
            ? LMS_PERSONAL_DASHBOARD_STAFF_HISTORY_EMPTY_COPY
            : LMS_PERSONAL_DASHBOARD_HISTORY_EMPTY_COPY;
        return `<div class="lms-live-copy lms-personal-dashboard-history-empty">${escapeHtml(emptyCopy)}</div>`;
    }
    return snapshots.map(snapshot => {
        const snapshotId = String(snapshot.id || '').trim();
        const ownerResourceKey = String(snapshot.resourceKey || '').trim();
        const isAutosave = Boolean(snapshot.isAutosave);
        const staffShare = String(snapshot.staffShare || 'none').trim() || 'none';
        const canStaffRestore = !staffMonitor || staffShare === 'edit';
        const restoreButton = canStaffRestore ? `
                <button type="button" class="lux-secondary-btn" data-lms-personal-dashboard-action="restore-snapshot" data-lms-personal-dashboard-snapshot="${escapeHtml(snapshotId)}" data-lms-personal-dashboard-resource-key="${escapeHtml(ownerResourceKey)}">Restore</button>` : '';
        const deleteButton = (!staffMonitor && !isAutosave) ? `
                <button type="button" class="lux-secondary-btn" data-lms-personal-dashboard-action="delete-snapshot" data-lms-personal-dashboard-snapshot="${escapeHtml(snapshotId)}" data-lms-personal-dashboard-resource-key="${escapeHtml(ownerResourceKey)}">Delete</button>` : '';
        return `
        <div class="lms-personal-dashboard-history-item${isAutosave ? ' is-autosave' : ''}" data-lms-personal-dashboard-snapshot="${escapeHtml(snapshotId)}" data-lms-personal-dashboard-resource-key="${escapeHtml(ownerResourceKey)}">
            <div class="lms-personal-dashboard-history-copy">
                <strong>${escapeHtml(snapshot.label || 'Saved progress')}</strong>
                ${formatLmsPersonalDashboardHistoryBadge(snapshot)}
                ${renderLmsPersonalDashboardShareBadge(snapshot)}
                <span>${escapeHtml(snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleString() : '')}</span>
            </div>
            ${renderLmsPersonalDashboardShareControl(snapshot)}
            <div class="lms-personal-dashboard-history-actions">${restoreButton}${deleteButton}</div>
        </div>`;
    }).join('');
}

function isLmsPersonalDashboardStudentViewer() {
    return typeof isLmsStudentViewer === 'function' && isLmsStudentViewer();
}

function destroyLmsPersonalDashboardOverlay(options = {}) {
    if (typeof window !== 'undefined' && window.__lmsPersonalDashboardPageHideHandler) {
        window.removeEventListener('pagehide', window.__lmsPersonalDashboardPageHideHandler);
        window.__lmsPersonalDashboardPageHideHandler = null;
    }
    const overlay = document.getElementById('lms-personal-dashboard-overlay');
    const finish = () => {
        document.body.classList.remove('lms-personal-dashboard-open');
    };
    if (!overlay) {
        finish();
        return;
    }
    if (options.instant) {
        overlay.remove();
        finish();
        return;
    }
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay, { onDone: finish });
        return;
    }
    overlay.remove();
    finish();
}

function renderLmsPersonalDashboardShortcutsColumn() {
    return `
            <aside class="lms-personal-dashboard-shortcuts" aria-label="Course shortcuts">
                <div class="lms-route-eyebrow lms-route-inline lms-route-inline-gap-8"><i class="fas fa-compass"></i> Course tabs</div>
                <div class="lms-personal-dashboard-shortcut-list">
                    ${renderLmsPersonalDashboardShortcuts()}
                </div>
            </aside>`;
}

function formatLmsPersonalDashboardSubtitle() {
    const courseTitle = document.getElementById('lms-course-title')?.textContent?.trim() || 'Course';
    const sectionMeta = typeof getLmsSectionMeta === 'function' ? getLmsSectionMeta() : { label: 'Section' };
    const isStudent = isLmsPersonalDashboardStudentViewer();
    if (isStudent) return `${courseTitle} · ${sectionMeta.label || 'Section'}`;
    const courseKey = typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId;
    const parsed = typeof parseLmsCourseKey === 'function' ? parseLmsCourseKey(courseKey) : { groupId: '' };
    const groupId = String(parsed.groupId || '').trim();
    const groupLabel = groupId ? `${groupId} · ` : '';
    return `${courseTitle} · ${groupLabel}${sectionMeta.label || 'Section'}`;
}

function renderLmsPersonalDashboardMarkup(resourceKey = '') {
    const staffMonitor = isLmsPersonalDashboardStaffMonitor();
    const isStudent = !staffMonitor && isLmsPersonalDashboardStudentViewer();
    const layoutClass = staffMonitor || isStudent ? 'is-student-layout' : 'is-staff-layout';
    const shortcutsHtml = staffMonitor || isStudent ? '' : renderLmsPersonalDashboardShortcutsColumn();
    const staffName = String(LMS_PERSONAL_DASHBOARD.staffView?.studentName || 'Student').trim() || 'Student';
    const title = staffMonitor ? `${staffName}'s Workspace` : 'My Workspace';
    const titleIcon = staffMonitor ? 'fa-user-graduate' : 'fa-user-pen';
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(resourceKey) : null;
    const staffShareLevel = staffMonitor ? getLmsPersonalDashboardStaffShareLevel(resourceKey) : '';
    const staffNotice = staffMonitor
        ? (() => {
            if (workspace?.ui?.accessDenied) {
                return `<span class="lms-personal-dashboard-staff-notice is-denied">${escapeHtml(workspace.ui.syncError || 'This student has not shared their workspace yet.')}</span>`;
            }
            if (staffShareLevel === 'edit') {
                return '<span class="lms-personal-dashboard-staff-notice is-edit">Editing enabled by student</span>';
            }
            if (staffShareLevel === 'view') {
                return '<span class="lms-personal-dashboard-staff-notice">Viewing student workspace (view only)</span>';
            }
            return '<span class="lms-personal-dashboard-staff-notice is-denied">This student has not shared their workspace yet.</span>';
        })()
        : '';
    const guestCanEdit = staffMonitor && canEditLmsPersonalDashboardAsGuest(resourceKey);
    const shareCallout = staffMonitor ? '' : `
        <p class="lms-personal-dashboard-share-callout">Progress autosaves automatically. Use <strong>Share</strong> to give instructors, your whole group, or specific classmates access. Named History rows are optional checkpoints.</p>`;
    const shareButton = staffMonitor ? '' : renderLmsPersonalDashboardShareButton(resourceKey);
    const sharePanel = staffMonitor ? '' : renderLmsPersonalDashboardSharePanel(resourceKey);
    const showOwnerChrome = !staffMonitor;
    const showGuestEditChrome = guestCanEdit;
    const autosaveStatus = (showOwnerChrome || showGuestEditChrome)
        ? '<span class="lms-personal-dashboard-autosave-status" data-lms-personal-dashboard-autosave-status="">Autosave on</span>'
        : '';
    const saveButton = showOwnerChrome ? `
                <button type="button" class="lux-secondary-btn lms-personal-dashboard-save-named" data-lms-personal-dashboard-action="save-snapshot">
                    <i class="fas fa-bookmark"></i> Save named copy
                </button>` : '';
    const sharedWithMePanel = staffMonitor ? '' : renderLmsPersonalDashboardSharedWithMePanel();
    const bodyHtml = `
        ${shareCallout}
        ${sharePanel}
        <div class="lms-personal-dashboard-layout ${layoutClass}">
            ${shortcutsHtml}
            <section class="lms-personal-dashboard-board" aria-label="Personal scratch board">
                <div class="lms-personal-dashboard-board-host" data-lms-personal-dashboard-board-host="${escapeHtml(resourceKey)}"></div>
            </section>
            <aside class="lms-personal-dashboard-history" aria-label="Saved progress">
                ${sharedWithMePanel}
                <div class="lms-route-eyebrow lms-route-inline lms-route-inline-gap-8"><i class="fas fa-clock-rotate-left"></i> History</div>
                <div class="lms-personal-dashboard-history-list" data-lms-personal-dashboard-history-list="">
                    <div class="lms-live-copy lms-personal-dashboard-history-empty">Loading saved progress…</div>
                </div>
            </aside>
        </div>`;
    const headHtml = `
        <div class="lms-personal-dashboard-head">
            <div class="lms-personal-dashboard-head-main">
                <strong class="lux-glass-dialog-title"><i class="fas ${titleIcon}" aria-hidden="true"></i> ${escapeHtml(title)}</strong>
                <span class="lux-glass-dialog-subtitle">${escapeHtml(formatLmsPersonalDashboardSubtitle())}</span>${staffNotice}
            </div>
            <div class="lms-personal-dashboard-head-actions">${shareButton}${autosaveStatus}${saveButton}
                <button type="button" class="lux-ghost-btn lux-glass-dialog-close-btn" aria-label="Close personal workspace" data-lms-personal-dashboard-action="close"><i class="fas fa-times"></i></button>
            </div>
        </div>`;
    return typeof renderLmsGlassDialogCard === 'function'
        ? renderLmsGlassDialogCard({
            hookClass: 'lms-personal-dashboard-card',
            bodyClass: 'lms-personal-dashboard-body',
            headHtml,
            bodyHtml
        })
        : bodyHtml;
}

function getLmsPersonalDashboardHistoryScopeOptions() {
    if (!isLmsPersonalDashboardStudentViewer()) return {};
    const courseKey = typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId;
    const parsed = typeof parseLmsCourseKey === 'function'
        ? parseLmsCourseKey(courseKey)
        : { groupId: '', sectionType: '' };
    const groupId = String(parsed.groupId || '').trim();
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? String(getCurrentLmsSectionType() || '').trim()
        : String(parsed.sectionType || '').trim();
    if (!groupId || !sectionType) return {};
    return { groupId, sectionType };
}

async function loadLmsPersonalDashboardHistory(courseId = '') {
    const normalizedCourseId = String(courseId || getLmsPersonalDashboardCourseId() || '').trim();
    if (!normalizedCourseId) return [];
    const scopeOptions = getLmsPersonalDashboardHistoryScopeOptions();
    if (isLmsPersonalDashboardStaffMonitor()) {
        // Classmate guests see the live board only; snapshot history listing is staff-scoped.
        const isStaff = typeof canManageLmsGroupContent === 'function' && canManageLmsGroupContent();
        if (!isStaff) return [];
        const studentId = String(LMS_PERSONAL_DASHBOARD.staffView?.studentId || '').trim();
        if (!studentId || typeof fetchLmsPersonalDashboardSharedHistory !== 'function') return [];
        const response = await fetchLmsPersonalDashboardSharedHistory(normalizedCourseId, studentId, scopeOptions);
        return Array.isArray(response?.items) ? response.items : [];
    }
    if (typeof fetchLmsPersonalDashboardHistory !== 'function') return [];
    const response = await fetchLmsPersonalDashboardHistory(normalizedCourseId, scopeOptions);
    return Array.isArray(response?.items) ? response.items : [];
}

async function refreshLmsPersonalDashboardHistory() {
    const list = document.querySelector('[data-lms-personal-dashboard-history-list]');
    if (!list) return;
    try {
        const items = await loadLmsPersonalDashboardHistory();
        list.innerHTML = renderLmsPersonalDashboardHistoryList(items);
    } catch (_error) {
        list.innerHTML = '<div class="lms-live-copy lms-personal-dashboard-history-empty">Saved progress could not be loaded.</div>';
    }
}

function scheduleLmsPersonalDashboardBoardLayoutRecovery(resourceKey = '') {
    const key = resourceKey || getLmsPersonalDashboardResourceKey();
    if (!key) return;
    const recover = () => {
        const shell = typeof getActiveLmsWhiteboardShell === 'function' ? getActiveLmsWhiteboardShell(key) : null;
        if (shell && typeof resyncLmsWhiteboardLayoutMetrics === 'function') resyncLmsWhiteboardLayoutMetrics(shell, key);
        if (shell && typeof scheduleLmsWhiteboardLayoutRecovery === 'function') {
            scheduleLmsWhiteboardLayoutRecovery(shell, key);
        }
    };
    requestAnimationFrame(() => requestAnimationFrame(recover));
}

function shouldBlockLmsPersonalDashboardStaffBoard(resourceKey = '') {
    if (!isLmsPersonalDashboardStaffMonitor()) return false;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(resourceKey) : null;
    return Boolean(workspace?.ui?.accessDenied);
}

function renderLmsPersonalDashboardStaffAccessDeniedBoard(resourceKey = '') {
    const host = document.querySelector('[data-lms-personal-dashboard-board-host]');
    if (!host) return;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(resourceKey) : null;
    const message = workspace?.ui?.syncError || 'This student has not shared their workspace yet.';
    host.innerHTML = `<div class="lms-personal-dashboard-access-denied"><i class="fas fa-lock" aria-hidden="true"></i><p>${escapeHtml(message)}</p></div>`;
}

function mountLmsPersonalDashboardScratchBoard(resourceKey = '') {
    const host = document.querySelector('[data-lms-personal-dashboard-board-host]');
    if (!host || typeof renderLmsPersonalWhiteboardScratch !== 'function') return;
    if (shouldBlockLmsPersonalDashboardStaffBoard(resourceKey)) {
        renderLmsPersonalDashboardStaffAccessDeniedBoard(resourceKey);
        return;
    }
    if (!host.querySelector('.lms-whiteboard-shell')) {
        renderLmsPersonalWhiteboardScratch(host, resourceKey);
    } else if (typeof refreshLmsPersonalWhiteboardScratchUi === 'function') {
        refreshLmsPersonalWhiteboardScratchUi(resourceKey, { skipLoad: true });
    }
    scheduleLmsPersonalDashboardBoardLayoutRecovery(resourceKey);
    const allowAutosave = !shouldBlockLmsPersonalDashboardStaffBoard(resourceKey)
        && (!isLmsPersonalDashboardStaffMonitor() || canEditLmsPersonalDashboardAsGuest(resourceKey));
    if (allowAutosave && typeof scheduleLmsPersonalDashboardAutosave === 'function') {
        scheduleLmsPersonalDashboardAutosave(resourceKey);
    }
}

async function loadLmsPersonalDashboardWorkspace(resourceKey = '') {
    const key = resourceKey || getLmsPersonalDashboardResourceKey();
    if (!key || typeof loadLmsWhiteboardWorkspace !== 'function') return null;
    return loadLmsWhiteboardWorkspace(key, { force: true, forceRemote: true });
}

function syncLmsPersonalDashboardChromeButton() {
    const button = document.querySelector('[data-lms-action="open-personal-dashboard"]');
    const pageInner = document.getElementById('page-lms-inner');
    if (!button) return;
    const visible = Boolean(pageInner && !pageInner.hidden);
    button.hidden = !visible;
}

function bindLmsPersonalDashboardChromeButton() {
    const button = document.querySelector('[data-lms-action="open-personal-dashboard"]');
    if (!button || button.dataset.lmsPersonalDashboardBound === '1') return;
    button.dataset.lmsPersonalDashboardBound = '1';
    button.addEventListener('click', (event) => {
        event.preventDefault();
        openLmsPersonalDashboard();
    });
}

function bindLmsPersonalDashboardOverlay(overlay, resourceKey = '') {
    if (!overlay || overlay.dataset.lmsPersonalDashboardBound === '1') return;
    overlay.dataset.lmsPersonalDashboardBound = '1';
    overlay.addEventListener('input', (event) => {
        const filterInput = event.target.closest?.('[data-lms-personal-dashboard-action="filter-peer-share"]');
        if (filterInput) filterLmsPersonalDashboardPeerShareList(filterInput.value);
    });
    overlay.addEventListener('change', async (event) => {
        // History snapshot share still uses native selects when present.
        const shareSelect = event.target.closest?.('[data-lms-personal-dashboard-action="set-share"]');
        if (!shareSelect || isLmsPersonalDashboardStaffMonitor()) return;
        const snapshotId = shareSelect.dataset.lmsPersonalDashboardSnapshot;
        const ownerResourceKey = shareSelect.dataset.lmsPersonalDashboardResourceKey;
        const staffShare = String(shareSelect.value || 'none').trim() || 'none';
        if (!snapshotId || !ownerResourceKey || typeof patchLmsPersonalDashboardSnapshotShare !== 'function') return;
        const response = await patchLmsPersonalDashboardSnapshotShare(ownerResourceKey, snapshotId, staffShare);
        if (response?.workspace && typeof applyLmsWhiteboardWorkspace === 'function') {
            applyLmsWhiteboardWorkspace(ownerResourceKey, response.workspace, { forceRemote: true });
        }
        await refreshLmsPersonalDashboardHistory();
    });
    overlay.addEventListener('click', (event) => {
        maybePulseLmsPersonalDashboardWhiteboardAction(event);
    });
    overlay.addEventListener('click', async (event) => {
        const shareLevelBtn = event.target.closest?.('.lms-personal-dashboard-share-seg-btn[data-lms-personal-dashboard-action]');
        if (shareLevelBtn && !isLmsPersonalDashboardStaffMonitor()) {
            event.preventDefault();
            const action = String(shareLevelBtn.dataset.lmsPersonalDashboardAction || '').trim();
            const level = String(shareLevelBtn.dataset.shareLevel || 'none').trim() || 'none';
            const targetKey = getLmsPersonalDashboardActiveResourceKey() || resourceKey;
            const groupEl = shareLevelBtn.closest('.lms-personal-dashboard-share-seg');
            if (!targetKey || !action) return;
            if (shareLevelBtn.classList.contains('is-active')) return;

            if (action === 'set-workspace-share') {
                if (typeof patchLmsPersonalDashboardWorkspaceShare !== 'function') return;
                const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
                    ? ensureLmsWhiteboardWorkspace(targetKey)
                    : null;
                const previousShare = String(workspace?.staffShare || workspace?.staffShareLevel || 'none').trim() || 'none';
                if (workspace) {
                    workspace.staffShare = level;
                    workspace.staffShareLevel = level;
                }
                setLmsPersonalDashboardShareSegActive(groupEl, level);
                try {
                    const response = await patchLmsPersonalDashboardWorkspaceShare(targetKey, { staffShare: level });
                    if (response?.workspace && typeof applyLmsWhiteboardWorkspace === 'function') {
                        applyLmsWhiteboardWorkspace(targetKey, response.workspace, { forceRemote: true });
                    } else if (!response?.workspace) {
                        if (workspace) {
                            workspace.staffShare = previousShare;
                            workspace.staffShareLevel = previousShare;
                        }
                        setLmsPersonalDashboardShareSegActive(groupEl, previousShare);
                        setLmsPersonalDashboardShareStatus('Instructor access could not be saved.', true);
                        return;
                    }
                    const synced = getLmsPersonalDashboardWorkspaceStaffShare(targetKey);
                    setLmsPersonalDashboardShareSegActive(groupEl, synced);
                    syncLmsPersonalDashboardShareTrigger(targetKey);
                    setLmsPersonalDashboardShareStatus(`Instructors: ${formatLmsPersonalDashboardShareLevelLabel(synced)}`);
                } catch (_error) {
                    if (workspace) {
                        workspace.staffShare = previousShare;
                        workspace.staffShareLevel = previousShare;
                    }
                    setLmsPersonalDashboardShareSegActive(groupEl, previousShare);
                    setLmsPersonalDashboardShareStatus('Instructor access could not be saved.', true);
                }
                return;
            }

            if (action === 'set-group-share') {
                if (typeof patchLmsPersonalDashboardWorkspaceShare !== 'function') return;
                const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
                    ? ensureLmsWhiteboardWorkspace(targetKey)
                    : null;
                const previousShare = String(workspace?.groupShare || 'none').trim() || 'none';
                if (workspace) workspace.groupShare = level;
                setLmsPersonalDashboardShareSegActive(groupEl, level);
                try {
                    const response = await patchLmsPersonalDashboardWorkspaceShare(targetKey, { groupShare: level });
                    if (response?.workspace && typeof applyLmsWhiteboardWorkspace === 'function') {
                        applyLmsWhiteboardWorkspace(targetKey, response.workspace, { forceRemote: true });
                    } else if (!response?.workspace) {
                        if (workspace) workspace.groupShare = previousShare;
                        setLmsPersonalDashboardShareSegActive(groupEl, previousShare);
                        setLmsPersonalDashboardShareStatus('Group access could not be saved.', true);
                        return;
                    }
                    const synced = getLmsPersonalDashboardGroupShare(targetKey);
                    setLmsPersonalDashboardShareSegActive(groupEl, synced);
                    syncLmsPersonalDashboardShareTrigger(targetKey);
                    setLmsPersonalDashboardShareStatus(`Whole group: ${formatLmsPersonalDashboardShareLevelLabel(synced)}`);
                } catch (_error) {
                    if (workspace) workspace.groupShare = previousShare;
                    setLmsPersonalDashboardShareSegActive(groupEl, previousShare);
                    setLmsPersonalDashboardShareStatus('Group access could not be saved.', true);
                }
                return;
            }

            if (action === 'set-peer-share') {
                const peerUserId = String(shareLevelBtn.dataset.peerUserId || '').trim();
                if (!peerUserId || typeof patchLmsPersonalDashboardPeerShares !== 'function') return;
                const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
                    ? ensureLmsWhiteboardWorkspace(targetKey)
                    : null;
                const previousPeers = getLmsPersonalDashboardPeerShares(targetKey);
                const previousLevel = String(previousPeers[peerUserId] || 'none').trim() || 'none';
                if (workspace) {
                    workspace.peerShares = { ...previousPeers };
                    if (level === 'none') delete workspace.peerShares[peerUserId];
                    else workspace.peerShares[peerUserId] = level;
                }
                setLmsPersonalDashboardShareSegActive(groupEl, level);
                try {
                    const response = await patchLmsPersonalDashboardPeerShares(targetKey, {
                        userId: peerUserId,
                        level
                    });
                    if (response?.workspace && typeof applyLmsWhiteboardWorkspace === 'function') {
                        applyLmsWhiteboardWorkspace(targetKey, response.workspace, { forceRemote: true });
                    } else if (!response?.workspace) {
                        if (workspace) workspace.peerShares = previousPeers;
                        setLmsPersonalDashboardShareSegActive(groupEl, previousLevel);
                        setLmsPersonalDashboardShareStatus('Classmate access could not be saved.', true);
                        return;
                    }
                    const syncedPeers = getLmsPersonalDashboardPeerShares(targetKey);
                    const synced = String(syncedPeers[peerUserId] || 'none').trim() || 'none';
                    setLmsPersonalDashboardShareSegActive(groupEl, synced);
                    syncLmsPersonalDashboardShareTrigger(targetKey);
                    setLmsPersonalDashboardShareStatus('Classmate access updated.');
                } catch (_error) {
                    if (workspace) workspace.peerShares = previousPeers;
                    setLmsPersonalDashboardShareSegActive(groupEl, previousLevel);
                    setLmsPersonalDashboardShareStatus('Classmate access could not be saved.', true);
                }
                return;
            }
        }

        const actionNode = event.target.closest?.('[data-lms-personal-dashboard-action]');
        if (!actionNode) return;
        const action = actionNode.dataset.lmsPersonalDashboardAction;
        if (action === 'open-share-panel') {
            event.preventDefault();
            openLmsPersonalDashboardSharePanel();
            return;
        }
        if (action === 'close-share-panel') {
            event.preventDefault();
            closeLmsPersonalDashboardSharePanel();
            return;
        }
        if (action === 'open-shared-workspace') {
            event.preventDefault();
            const studentId = String(actionNode.dataset.studentId || '').trim();
            const studentName = String(actionNode.dataset.studentName || '').trim();
            if (studentId) await openLmsPersonalDashboardForGuest(studentId, studentName);
            return;
        }
        if (action === 'close') {
            event.preventDefault();
            closeLmsPersonalDashboard();
            return;
        }
        if (action === 'save-snapshot') {
            event.preventDefault();
            const label = window.prompt('Name this saved progress', `Progress ${new Date().toLocaleString()}`);
            if (label == null) return;
            const saved = await saveLmsPersonalDashboardSnapshotAction(resourceKey, label);
            if (saved) pulseLmsPersonalDashboardActionButton(actionNode);
            return;
        }
        if (action === 'restore-snapshot') {
            event.preventDefault();
            const snapshotId = actionNode.dataset.lmsPersonalDashboardSnapshot;
            const sourceResourceKey = actionNode.dataset.lmsPersonalDashboardResourceKey;
            await restoreLmsPersonalDashboardSnapshotAction(resourceKey, snapshotId, sourceResourceKey);
            return;
        }
        if (action === 'delete-snapshot') {
            event.preventDefault();
            const snapshotId = actionNode.dataset.lmsPersonalDashboardSnapshot;
            const sourceResourceKey = actionNode.dataset.lmsPersonalDashboardResourceKey;
            if (!confirm('Delete this saved progress?')) return;
            await deleteLmsPersonalDashboardSnapshotAction(sourceResourceKey || resourceKey, snapshotId);
        }
    });
    overlay.addEventListener('click', (event) => {
        const tabButton = event.target.closest?.('[data-lms-personal-dashboard-tab]');
        if (!tabButton) return;
        event.preventDefault();
        const tab = tabButton.dataset.lmsPersonalDashboardTab;
        if (tab && typeof switchLMSTab === 'function') switchLMSTab(tab);
    });
    overlay.addEventListener('click', (event) => {
        const shareOverlay = event.target.closest?.('[data-lms-personal-dashboard-share-overlay]');
        if (shareOverlay && event.target === shareOverlay) {
            event.preventDefault();
            closeLmsPersonalDashboardSharePanel();
            return;
        }
        if (event.target === overlay) closeLmsPersonalDashboard();
    });
    if (typeof window !== 'undefined') {
        if (window.__lmsPersonalDashboardPageHideHandler) {
            window.removeEventListener('pagehide', window.__lmsPersonalDashboardPageHideHandler);
        }
        window.__lmsPersonalDashboardPageHideHandler = handleLmsPersonalDashboardPageHide;
        window.addEventListener('pagehide', window.__lmsPersonalDashboardPageHideHandler);
    }
}

async function saveLmsPersonalDashboardSnapshotAction(resourceKey = '', label = '') {
    const key = resourceKey || getLmsPersonalDashboardResourceKey();
    if (!key) return;
    if (typeof flushLmsWhiteboardSync === 'function') await flushLmsWhiteboardSync(key);
    if (typeof saveLmsPersonalDashboardSnapshot !== 'function') return;
    const sectionMeta = typeof getLmsSectionMeta === 'function' ? getLmsSectionMeta() : { label: '' };
    const response = await saveLmsPersonalDashboardSnapshot(key, {
        label: String(label || 'Saved progress').trim() || 'Saved progress',
        sectionType: sectionMeta.type || ''
    });
    if (response?.workspace && typeof applyLmsWhiteboardWorkspace === 'function') {
        applyLmsWhiteboardWorkspace(key, response.workspace, { forceRemote: true });
    }
    await refreshLmsPersonalDashboardHistory();
    return Boolean(response?.workspace || response?.snapshot);
}

async function restoreLmsPersonalDashboardSnapshotAction(resourceKey = '', snapshotId = '', sourceResourceKey = '') {
    const targetKey = getLmsPersonalDashboardActiveResourceKey() || resourceKey;
    const sourceKey = String(sourceResourceKey || targetKey || '').trim();
    if (!targetKey || !sourceKey || !snapshotId) return;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(targetKey) : null;
    const confirmCopy = isLmsPersonalDashboardStaffMonitor()
        ? 'Restore this shared progress onto the student live board?'
        : 'Restore saved progress and replace your current personal board?';
    if (!confirm(confirmCopy)) return;
    if (typeof restoreLmsPersonalDashboardSnapshot !== 'function') {
        window.alert?.('Restore is unavailable. Refresh the page and try again.');
        return;
    }
    // Drop local dirty/gesture guards so apply cannot keep pre-restore strokes.
    if (workspace?.ui) {
        workspace.ui.dirty = false;
        workspace.ui.syncing = false;
        workspace.ui.inGesture = false;
        workspace.ui.pendingOps = [];
        if (workspace.ui.syncTimer) {
            clearTimeout(workspace.ui.syncTimer);
            workspace.ui.syncTimer = null;
        }
        if (workspace.ui.opsTimer) {
            clearTimeout(workspace.ui.opsTimer);
            workspace.ui.opsTimer = null;
        }
    }
    let response = null;
    try {
        response = await restoreLmsPersonalDashboardSnapshot(targetKey, snapshotId, {
            sourceResourceKey: sourceKey,
            targetResourceKey: targetKey
        });
    } catch (error) {
        window.alert?.(error?.message || 'Saved progress could not be restored.');
        return;
    }
    if (!response?.workspace) {
        window.alert?.('Saved progress could not be restored.');
        return;
    }
    if (typeof applyLmsWhiteboardWorkspace === 'function') {
        applyLmsWhiteboardWorkspace(targetKey, response.workspace, { forceRemote: true });
    }
    const latest = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(targetKey) : null;
    if (latest) {
        // Guarantee local canvas matches restored payload even if apply kept local elements.
        if (Array.isArray(response.workspace.elements)) {
            latest.elements = JSON.parse(JSON.stringify(response.workspace.elements));
        }
        if (latest.ui) {
            latest.ui.dirty = false;
            latest.ui.loadedFromBackend = true;
            latest.ui.lastServerSyncAt = Date.now();
        }
        latest.version = Number(response.workspace.version) || Number(latest.version) || 0;
    }
    if (typeof resetLmsWhiteboardHistory === 'function') resetLmsWhiteboardHistory(targetKey);
    if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([], { skipPaint: true });
    const host = document.querySelector('[data-lms-personal-dashboard-board-host]');
    if (host) host.innerHTML = '';
    mountLmsPersonalDashboardScratchBoard(targetKey);
    if (typeof repaintLmsWhiteboardWorkspace === 'function') {
        repaintLmsWhiteboardWorkspace(targetKey);
    }
    await refreshLmsPersonalDashboardHistory();
}

async function deleteLmsPersonalDashboardSnapshotAction(resourceKey = '', snapshotId = '') {
    const key = String(resourceKey || '').trim();
    if (!key || !snapshotId || typeof deleteLmsPersonalDashboardSnapshot !== 'function') return;
    const response = await deleteLmsPersonalDashboardSnapshot(key, snapshotId);
    const currentKey = getLmsPersonalDashboardResourceKey();
    if (response?.workspace && currentKey === key && typeof applyLmsWhiteboardWorkspace === 'function') {
        applyLmsWhiteboardWorkspace(key, response.workspace, { forceRemote: true });
    }
    await refreshLmsPersonalDashboardHistory();
}

function mountLmsPersonalDashboardOverlay(resourceKey = '') {
    const key = resourceKey || getLmsPersonalDashboardActiveResourceKey();
    if (!key) return false;
    let overlay = document.getElementById('lms-personal-dashboard-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lms-personal-dashboard-overlay';
        overlay.className = 'lms-personal-dashboard-overlay lms-glass-dialog-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Personal workspace');
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = renderLmsPersonalDashboardMarkup(key);
    overlay.hidden = false;
    document.body.classList.add('lms-personal-dashboard-open');
    bindLmsPersonalDashboardOverlay(overlay, key);
    mountLmsPersonalDashboardScratchBoard(key);
    refreshLmsPersonalDashboardHistory();
    refreshLmsPersonalDashboardSharedWithMe();
    syncLmsPersonalDashboardAutosaveStatus(key);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
    return true;
}

async function flushLmsPersonalDashboardAutosave(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardResourceKey() || '').trim();
    if (!key) return null;
    if (typeof isLmsPersonalBoardKey === 'function' && !isLmsPersonalBoardKey(key)) return null;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(key) : null;
    const elements = Array.isArray(workspace?.elements) ? workspace.elements : [];
    if (!elements.length) return null;
    const statusNode = document.querySelector('[data-lms-personal-dashboard-autosave-status]');
    if (statusNode) {
        statusNode.textContent = 'Saving…';
        statusNode.classList.add('is-saving');
    }
    if (typeof flushLmsWhiteboardSync === 'function') await flushLmsWhiteboardSync(key);
    // Named/autosave snapshots are owner-only; collaborators only sync live board strokes/files.
    const isOwner = typeof isLmsPersonalBoardOwner === 'function' && isLmsPersonalBoardOwner(key);
    let response = null;
    if (isOwner && typeof saveLmsPersonalDashboardSnapshot === 'function') {
        const sectionMeta = typeof getLmsSectionMeta === 'function' ? getLmsSectionMeta() : { type: '' };
        response = await saveLmsPersonalDashboardSnapshot(key, {
            autosave: true,
            sectionType: sectionMeta.type || ''
        });
        if (response?.workspace && typeof applyLmsWhiteboardWorkspace === 'function') {
            applyLmsWhiteboardWorkspace(key, response.workspace, { forceRemote: true });
        }
    }
    const latest = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(key) : null;
    if (latest?.ui) latest.ui.lastAutosaveAt = Date.now();
    syncLmsPersonalDashboardAutosaveStatus(key);
    return response;
}

function scheduleLmsPersonalDashboardAutosave(resourceKey = '') {
    const key = String(resourceKey || getLmsPersonalDashboardResourceKey() || '').trim();
    if (!key || !isLmsPersonalDashboardOpen()) return;
    if (isLmsPersonalDashboardStaffMonitor() && !canEditLmsPersonalDashboardAsGuest(key)) return;
    if (typeof isLmsPersonalBoardKey === 'function' && !isLmsPersonalBoardKey(key)) return;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function' ? ensureLmsWhiteboardWorkspace(key) : null;
    if (!workspace) return;
    if (workspace.ui?.autosaveTimer) clearTimeout(workspace.ui.autosaveTimer);
    workspace.ui.autosaveTimer = setTimeout(async () => {
        workspace.ui.autosaveTimer = null;
        try {
            await flushLmsPersonalDashboardAutosave(key);
            if (isLmsPersonalDashboardOpen()) await refreshLmsPersonalDashboardHistory();
        } catch (_error) {
            /* autosave is best-effort */
        }
    }, LMS_PERSONAL_DASHBOARD_AUTOSAVE_THROTTLE_MS);
}

function unmountLmsPersonalDashboardOverlay() {
    destroyLmsPersonalDashboardOverlay();
}

async function openLmsPersonalDashboard() {
    LMS_PERSONAL_DASHBOARD.staffView = null;
    LMS_PERSONAL_DASHBOARD.guestView = null;
    const resourceKey = getLmsPersonalDashboardResourceKey();
    if (!resourceKey) return false;
    if (typeof ensureLmsWhiteboardRuntime === 'function') {
        try {
            await ensureLmsWhiteboardRuntime();
        } catch (_error) {
            return false;
        }
    }
    await loadLmsPersonalDashboardWorkspace(resourceKey);
    return mountLmsPersonalDashboardOverlay(resourceKey);
}

async function openLmsPersonalDashboardForGuest(studentId = '', studentName = '') {
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedStudentId || typeof buildLmsPersonalBoardKey !== 'function') return false;
    if (typeof ensureLmsWhiteboardRuntime === 'function') {
        try {
            await ensureLmsWhiteboardRuntime();
        } catch (_error) {
            return false;
        }
    }
    if (typeof closeLmsWhiteboardMembersModal === 'function') closeLmsWhiteboardMembersModal();
    const resourceKey = buildLmsPersonalBoardKey(
        typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId,
        normalizedStudentId
    );
    if (!resourceKey) return false;
    LMS_PERSONAL_DASHBOARD.staffView = {
        studentId: normalizedStudentId,
        studentName: String(studentName || '').trim() || 'Student',
        resourceKey
    };
    LMS_PERSONAL_DASHBOARD.guestView = LMS_PERSONAL_DASHBOARD.staffView;
    await loadLmsPersonalDashboardWorkspace(resourceKey);
    return mountLmsPersonalDashboardOverlay(resourceKey);
}

async function openLmsPersonalDashboardForStaff(studentId = '', studentName = '') {
    return openLmsPersonalDashboardForGuest(studentId, studentName);
}

function reconcileLmsClassWhiteboardAfterPersonalDashboardClose() {
    const classKey = typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('whiteboard') : '';
    if (!classKey || (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(classKey))) return;
    if (typeof LMS_WHITEBOARD_UI !== 'undefined') {
        LMS_WHITEBOARD_UI.boundKey = classKey;
    }
    if (typeof isLmsWhiteboardActiveTab === 'function' && isLmsWhiteboardActiveTab()
        && typeof refreshLmsWhiteboardUi === 'function') {
        refreshLmsWhiteboardUi(classKey, { forceStructuralRender: true });
    }
}

async function closeLmsPersonalDashboard() {
    const resourceKey = getLmsPersonalDashboardActiveResourceKey();
    const wasStaffMonitor = isLmsPersonalDashboardStaffMonitor();
    const guestCouldEdit = wasStaffMonitor && canEditLmsPersonalDashboardAsGuest(resourceKey);
    LMS_PERSONAL_DASHBOARD.staffView = null;
    LMS_PERSONAL_DASHBOARD.guestView = null;
    destroyLmsPersonalDashboardOverlay();
    if (resourceKey && typeof flushLmsWhiteboardSync === 'function') await flushLmsWhiteboardSync(resourceKey);
    if (resourceKey && (!wasStaffMonitor || guestCouldEdit)) await flushLmsPersonalDashboardAutosave(resourceKey);
    reconcileLmsClassWhiteboardAfterPersonalDashboardClose();
}

async function handleLmsPersonalDashboardSectionSwitch() {
    if (!isLmsPersonalDashboardOpen()) return;
    const host = document.querySelector('[data-lms-personal-dashboard-board-host]');
    const previousResourceKey = String(host?.dataset?.lmsPersonalDashboardBoardHost || '').trim();
    let resourceKey = getLmsPersonalDashboardActiveResourceKey();
    if (isLmsPersonalDashboardStaffMonitor()) {
        const studentId = String(LMS_PERSONAL_DASHBOARD.staffView?.studentId || '').trim();
        resourceKey = typeof buildLmsPersonalBoardKey === 'function'
            ? buildLmsPersonalBoardKey(
                typeof window.currentCourseId !== 'undefined' ? window.currentCourseId : currentCourseId,
                studentId
            )
            : resourceKey;
        if (LMS_PERSONAL_DASHBOARD.staffView) LMS_PERSONAL_DASHBOARD.staffView.resourceKey = resourceKey;
    }
    if (previousResourceKey && previousResourceKey !== resourceKey) {
        if (typeof flushLmsWhiteboardSync === 'function') await flushLmsWhiteboardSync(previousResourceKey);
        await flushLmsPersonalDashboardAutosave(previousResourceKey);
    }
    const overlay = document.getElementById('lms-personal-dashboard-overlay');
    const subtitle = overlay?.querySelector('.lux-glass-dialog-subtitle');
    if (subtitle) subtitle.textContent = formatLmsPersonalDashboardSubtitle();
    if (host) host.dataset.lmsPersonalDashboardBoardHost = resourceKey;
    await loadLmsPersonalDashboardWorkspace(resourceKey);
    mountLmsPersonalDashboardScratchBoard(resourceKey);
    await refreshLmsPersonalDashboardHistory();
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        openLmsPersonalDashboard,
        openLmsPersonalDashboardForStaff,
        openLmsPersonalDashboardForGuest,
        closeLmsPersonalDashboard,
        syncLmsPersonalDashboardChromeButton,
        bindLmsPersonalDashboardChromeButton,
        handleLmsPersonalDashboardSectionSwitch,
        getLmsPersonalDashboardResourceKey,
        getLmsPersonalDashboardActiveResourceKey,
        getLmsPersonalDashboardCourseId,
        isLmsPersonalDashboardOpen,
        isLmsPersonalDashboardStaffMonitor,
        destroyLmsPersonalDashboardOverlay,
        reconcileLmsClassWhiteboardAfterPersonalDashboardClose,
        scheduleLmsPersonalDashboardAutosave,
        flushLmsPersonalDashboardAutosave,
        refreshLmsPersonalDashboardHistory
    });
}