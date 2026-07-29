/* Chancellery page logic extracted from registration.js for the standalone chancellery route. */

const CHANCELLERY_REQUEST_KIND_META = {
    'grade-appeal': { label: 'Grade Appeal', tone: 'primary', icon: 'fas fa-scale-balanced' },
    'retake-request': { label: 'Retake Request', tone: 'secondary', icon: 'fas fa-rotate-right' },
    legacy: { label: 'Legacy Request', tone: 'muted', icon: 'fas fa-folder-open' }
};

const CHANCELLERY_STATUS_FLOW = ['Submitted', 'Under Review', 'Waiting for Staff', 'Waiting for Student', 'Resolved', 'Rejected'];

let chancelleryUiState = {
    tab: 'appeals',
    selectedCaseId: '',
    filters: {
        status: 'all',
        type: 'all',
        subject: 'all',
        search: ''
    }
};

function escapeChancelleryHtml(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function coerceChancelleryText(value, fallback = '') {
    if (value == null || value === '') return fallback;
    if (typeof value === 'object') {
        return String(value.name || value.label || value.title || value.id || fallback).trim() || fallback;
    }
    return String(value).trim() || fallback;
}

function resolveChancelleryGroupLabel(request = {}) {
    return coerceChancelleryText(
        request.groupName ?? request.recipientContext?.groupName ?? request.groupId,
        'No group'
    );
}

function normalizeChancelleryKey(value) {
    const normalized = cleanupEncodingArtifacts(String(value || ''))
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || '';
}

function formatChancelleryDate(value, includeTime = false) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return 'Unknown date';
    return includeTime
        ? date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function ensureChancelleryUiState() {
    if (!chancelleryUiState || typeof chancelleryUiState !== 'object') {
        chancelleryUiState = {
            tab: 'appeals',
            selectedCaseId: '',
            filters: { status: 'all', type: 'all', subject: 'all', search: '' }
        };
    }
    chancelleryUiState.filters = chancelleryUiState.filters || { status: 'all', type: 'all', subject: 'all', search: '' };
    return chancelleryUiState;
}

function syncChancelleryUiFiltersForRole(role) {
    const uiState = ensureChancelleryUiState();
    if (typeof buildDefaultChancelleryUiFiltersForRole === 'function') {
        uiState.filters = buildDefaultChancelleryUiFiltersForRole(role, uiState.filters || {});
    }
}

function filterChancelleryRequests(requests, filters = {}, role = null) {
    const effectiveRole = role || (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : USER_ROLES.STUDENT);
    if (typeof applyChancelleryConfiguredFilters === 'function' && typeof getChancelleryEnabledFiltersForRole === 'function') {
        return applyChancelleryConfiguredFilters(
            requests,
            filters,
            getChancelleryEnabledFiltersForRole(effectiveRole)
        );
    }
    const statusFilter = normalizeChancelleryKey(filters.status || 'all');
    const typeFilter = normalizeChancelleryKey(filters.type || 'all');
    const subjectFilter = normalizeChancelleryKey(filters.subject || 'all');
    const search = String(filters.search || '').trim().toLowerCase();
    return requests.filter(request => {
        if (statusFilter !== 'all' && normalizeChancelleryKey(request.status) !== statusFilter) return false;
        if (typeFilter !== 'all' && normalizeChancelleryKey(request.requestKind) !== typeFilter) return false;
        if (subjectFilter !== 'all' && normalizeChancelleryKey(request.subjectId) !== subjectFilter) return false;
        if (!search) return true;
        const haystack = [
            request.id,
            request.subjectName,
            request.studentName,
            request.message,
            request.latestPreview
        ].join(' ').toLowerCase();
        return haystack.includes(search);
    });
}

function resolveChancellerySelection(requests, { autoSelect = false } = {}) {
    const uiState = ensureChancelleryUiState();
    if (!requests.length) {
        uiState.selectedCaseId = '';
        return null;
    }
    const selected = requests.find(request => request.id === uiState.selectedCaseId) || null;
    if (selected) return selected;
    if (!autoSelect) {
        uiState.selectedCaseId = '';
        return null;
    }
    uiState.selectedCaseId = requests[0].id;
    return requests[0];
}

function normalizeChancelleryStatus(value) {
    const current = String(value || '').trim();
    const match = CHANCELLERY_STATUS_FLOW.find(status => normalizeChancelleryKey(status) === normalizeChancelleryKey(current));
    if (match) return match;
    if (/approved/i.test(current)) return 'Resolved';
    if (/review/i.test(current)) return 'Under Review';
    if (/reject/i.test(current)) return 'Rejected';
    return current || 'Submitted';
}

function getChancelleryStatusStepIndex(status) {
    const index = CHANCELLERY_STATUS_FLOW.findIndex(item => item === normalizeChancelleryStatus(status));
    return index >= 0 ? index : 0;
}

function normalizeChancelleryRequestKind(value, fallbackType = '') {
    const key = normalizeChancelleryKey(value || fallbackType);
    if (key.includes('retake')) return 'retake-request';
    if (key.includes('appeal')) return 'grade-appeal';
    if (key === 'grade-appeal' || key === 'retake-request') return key;
    return 'legacy';
}

function createChancelleryThreadEntry(entry = {}) {
    const createdAt = entry.createdAt || new Date().toISOString();
    return {
        id: entry.id || `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: entry.kind || 'message',
        authorRole: entry.authorRole || 'system',
        authorId: String(entry.authorId || ''),
        authorName: entry.authorName || 'System',
        message: String(entry.message || '').trim(),
        createdAt,
        status: entry.status ? normalizeChancelleryStatus(entry.status) : ''
    };
}

function findChancelleryGroup(subjectId, groupId) {
    return getAvailableGroupsForSubject(subjectId).find(group => String(group.id || '') === String(groupId || '')) || null;
}

function resolveChancelleryRecipientContext(subjectId, groupId) {
    const domain = getDomain();
    const subject = domain.subjectsById?.[subjectId] || (KIU_STATE.curriculum || []).find(item => item.id === subjectId) || null;
    const group = findChancelleryGroup(subjectId, groupId);
    const usersById = domain.usersById || {};
    const professor = typeof resolveUserFromName === 'function' ? resolveUserFromName(usersById, group?.prof || '') : null;
    const ta = typeof resolveUserFromName === 'function' ? resolveUserFromName(usersById, group?.ta || '') : null;
    return {
        faculty: normalizeFacultyCode(group?.faculty || subject?.faculty || getCurrentFaculty(), 'ECON'),
        groupName: group?.name || coerceChancelleryText(groupId, ''),
        professorId: String(professor?.id || ''),
        professorName: professor?.nameEn || professor?.name || group?.prof || '',
        taId: String(ta?.id || ''),
        taName: ta?.nameEn || ta?.name || group?.ta || ''
    };
}

function normalizeChancelleryDate(value) {
    if (!value) return new Date().toISOString();
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T09:00:00`;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function deriveChancelleryTypeLabel(kind, fallback = '') {
    return CHANCELLERY_REQUEST_KIND_META[kind]?.label || fallback || 'Request';
}

function normalizeChancelleryRequest(request = {}) {
    const requestKind = normalizeChancelleryRequestKind(request.requestKind, request.type);
    const createdAt = normalizeChancelleryDate(request.createdAt || request.updatedAt || request.date);
    const updatedAt = normalizeChancelleryDate(request.updatedAt || createdAt);
    const status = normalizeChancelleryStatus(request.status || 'Submitted');
    const recipientContext = {
        ...(resolveChancelleryRecipientContext(request.subjectId, request.groupId) || {}),
        ...(request.recipientContext && typeof request.recipientContext === 'object' ? request.recipientContext : {})
    };
    const subjectName = request.subjectName
        || (getDomain().subjectsById?.[request.subjectId || '']?.name)
        || 'Subject not selected';
    const initialMessage = String(request.message || request.details || request.type || 'Legacy request imported from the previous chancellery workflow.').trim();
    const initialAuthorName = request.studentName || request.student || 'Student';
    const thread = Array.isArray(request.thread) && request.thread.length
        ? request.thread.filter(item => item && typeof item === 'object').map(createChancelleryThreadEntry)
        : [
            createChancelleryThreadEntry({
                kind: 'submission',
                authorRole: 'student',
                authorId: request.studentId || request.requesterId || '',
                authorName: initialAuthorName,
                message: initialMessage,
                createdAt
            })
        ];
    const latestThreadEntry = thread[thread.length - 1] || null;
    const steps = Array.isArray(request.steps) && request.steps.length ? request.steps : [...CHANCELLERY_STATUS_FLOW];
    const currentStep = Number.isFinite(Number(request.currentStep)) ? Number(request.currentStep) : getChancelleryStatusStepIndex(status);
    return {
        id: String(request.id || `CHR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).trim(),
        type: deriveChancelleryTypeLabel(requestKind, request.type),
        requestKind,
        studentId: String(request.studentId || request.requesterId || ''),
        studentName: request.studentName || request.student || 'Student',
        subjectId: String(request.subjectId || ''),
        subjectName,
        groupId: coerceChancelleryText(request.groupId, ''),
        groupName: resolveChancelleryGroupLabel({
            groupName: request.groupName || recipientContext.groupName,
            groupId: request.groupId,
            recipientContext
        }),
        faculty: recipientContext.faculty || normalizeFacultyCode(request.faculty || getCurrentFaculty(), 'ECON'),
        message: initialMessage,
        status,
        createdAt,
        updatedAt,
        date: String(createdAt).slice(0, 10),
        recipientContext: {
            faculty: recipientContext.faculty || '',
            groupName: recipientContext.groupName || '',
            professorId: String(recipientContext.professorId || ''),
            professorName: recipientContext.professorName || '',
            taId: String(recipientContext.taId || ''),
            taName: recipientContext.taName || ''
        },
        thread,
        steps,
        currentStep: Math.max(0, Math.min(steps.length - 1, currentStep)),
        latestPreview: latestThreadEntry?.message || initialMessage
    };
}

function ensureChancelleryRequestsStore() {
    if (!Array.isArray(KIU_STATE.chancelleryRequests)) KIU_STATE.chancelleryRequests = [];
    KIU_STATE.chancelleryRequests = KIU_STATE.chancelleryRequests
        .map(normalizeChancelleryRequest)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return KIU_STATE.chancelleryRequests;
}

function getChancelleryRequestById(requestId) {
    return ensureChancelleryRequestsStore().find(item => item.id === requestId) || null;
}

function recordHasGradingData(record) {
    const safeRecord = typeof ensureGradeRecordHistories === 'function' ? ensureGradeRecordHistories(record || {}) : (record || {});
    const assessmentCount = Object.values(safeRecord.assessments || {}).reduce((total, entries) => total + ((entries || []).length || 0), 0);
    if (assessmentCount > 0) return true;
    return ['q1', 'qa', 'mid', 'final', 'retake'].some(key => Number(safeRecord[key] || 0) > 0);
}

function getStudentGradedSubjectsForChancellery() {
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) return [];
    const domain = getDomain();
    const schedule = getCurrentStudentSchedule();
    return schedule.map(item => {
        const subject = domain.subjectsById?.[item.courseId] || (KIU_STATE.curriculum || []).find(entry => entry.id === item.courseId) || null;
        const group = findChancelleryGroup(item.courseId, item.groupId);
        const enrolledStudents = typeof getEnrolledStudentsForGroup === 'function'
            ? getEnrolledStudentsForGroup(item.courseId, item.groupId)
            : [];
        const rosterKey = typeof resolveGradebookRosterKey === 'function'
            ? resolveGradebookRosterKey(item.courseId, item.groupId, enrolledStudents)
            : '';
        const roster = KIU_STATE.studentGrades?.[rosterKey] || [];
        const record = roster.find(entry => String(entry.id || '') === String(currentUser.id));
        if (!record || !recordHasGradingData(record)) return null;
        return {
            subjectId: item.courseId,
            subjectName: subject?.name || item.courseName || item.courseId,
            groupId: item.groupId,
            groupName: group?.name || item.groupId,
            faculty: normalizeFacultyCode(group?.faculty || subject?.faculty || getCurrentFaculty(), 'ECON'),
            professorName: group?.prof || '',
            taName: group?.ta || ''
        };
    }).filter(Boolean)
        .sort((a, b) => String(a.subjectName || '').localeCompare(String(b.subjectName || ''), undefined, { numeric: true, sensitivity: 'base' }));
}

function getCurrentStaffScopeKeys() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(getEffectiveUserRole())) return new Set();
    const items = typeof getCurrentFacultyScheduleItems === 'function' ? getCurrentFacultyScheduleItems() : [];
    return new Set(items.map(item => `${normalizeChancelleryKey(item.courseId)}::${normalizeChancelleryKey(item.groupId)}`));
}

function canCurrentStaffSeeChancelleryRequest(request) {
    const role = getEffectiveUserRole();
    if (role === USER_ROLES.ADMIN) return true;
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) return false;
    const currentUser = getCurrentUser();
    const scopeKeys = getCurrentStaffScopeKeys();
    const requestScopeKey = `${normalizeChancelleryKey(request.subjectId)}::${normalizeChancelleryKey(request.groupId)}`;
    if (scopeKeys.has(requestScopeKey)) return true;
    const recipientContext = request.recipientContext || {};
    if (String(recipientContext.professorId || '') === String(currentUser?.id || '')) return true;
    if (String(recipientContext.taId || '') === String(currentUser?.id || '')) return true;
    const currentName = normalizeChancelleryKey(currentUser?.nameEn || currentUser?.name || '');
    return normalizeChancelleryKey(recipientContext.professorName || '') === currentName
        || normalizeChancelleryKey(recipientContext.taName || '') === currentName;
}

function getVisibleChancelleryRequests() {
    const role = getEffectiveUserRole();
    const requests = ensureChancelleryRequestsStore();
    if (role === USER_ROLES.STUDENT) {
        const currentUserId = String(getCurrentUserId() || '');
        return requests.filter(request => String(request.studentId || '') === currentUserId);
    }
    if (role === USER_ROLES.ADMIN) return requests;
    if (role === USER_ROLES.STUDENT_SERVICE) return requests;
    if ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        return requests.filter(canCurrentStaffSeeChancelleryRequest);
    }
    return [];
}

function getChancelleryStatusMeta(status) {
    const normalized = normalizeChancelleryStatus(status);
    if (normalized === 'Resolved') return { label: normalized, tone: 'success', icon: 'fas fa-circle-check' };
    if (normalized === 'Rejected') return { label: normalized, tone: 'danger', icon: 'fas fa-octagon-xmark' };
    if (normalized === 'Waiting for Student') return { label: normalized, tone: 'info', icon: 'fas fa-user-clock' };
    if (normalized === 'Waiting for Staff') return { label: normalized, tone: 'warning', icon: 'fas fa-briefcase-clock' };
    return { label: normalized, tone: 'muted', icon: 'fas fa-timeline' };
}

function getChancelleryHeroFocusChip(status) {
    const meta = getChancelleryStatusMeta(status);
    return `<span class="lux-focus-panel__chip lux-status-pill home-hover-chip lux-chancellery-status-pill lux-chancellery-case-status-pill is-${meta.tone}"><i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}</span>`;
}

function getChancelleryStatusPill(status) {
    const meta = getChancelleryStatusMeta(status);
    return `<span class="lux-status-pill home-hover-chip lux-chancellery-status-pill lux-chancellery-case-status-pill is-${meta.tone}"><i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}</span>`;
}

function getChancelleryKindPillClass(kindMeta) {
    const tone = kindMeta?.tone || 'muted';
    if (tone === 'primary') {
        return 'lux-chancellery-kind-pill is-primary';
    }
    if (tone === 'secondary') {
        return 'lux-chancellery-kind-pill is-secondary';
    }
    return 'lux-chancellery-kind-pill is-muted';
}

function getChancelleryLatestPreview(request) {
    const latest = (request.thread || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    if (!latest) return 'No replies yet.';
    return latest.kind === 'status'
        ? `Status updated to ${latest.status || request.status}`
        : latest.message || 'No replies yet.';
}

function setChancellerySelectedCase(caseId) {
    ensureChancelleryUiState().selectedCaseId = caseId;
    if (!syncChancelleryWorkspaceRegion()) {
        renderChancelleryPage();
    }
}

function setChancelleryFilter(filterKey, value) {
    const uiState = ensureChancelleryUiState();
    uiState.filters[filterKey] = filterKey === 'search' ? String(value || '') : (value || 'all');
    if (filterKey !== 'search') uiState.selectedCaseId = '';
    if (!syncChancelleryFilterRegions(filterKey)) {
        renderChancelleryPage();
    }
}

function switchChancelleryTab(tab) {
    const uiState = ensureChancelleryUiState();
    const nextTab = tab === 'finance' ? 'finance' : 'appeals';
    if (uiState.tab === nextTab) return;
    uiState.tab = nextTab;
    if (!syncChancelleryTabRegions()) {
        renderChancelleryPage();
    }
}

function showChancelleryCompose() {
    ensureChancelleryUiState().selectedCaseId = '';
    if (!syncChancelleryWorkspaceRegion()) {
        renderChancelleryPage();
    }
}

function bindChancelleryDelegates(root) {
    if (!root || root.dataset.chancelleryDelegatesBound === '1') return;
    root.addEventListener('click', function onChancelleryClick(event) {
        const caseTrigger = event.target.closest('[data-chancellery-select-case]');
        if (caseTrigger) {
            event.preventDefault();
            setChancellerySelectedCase(String(caseTrigger.getAttribute('data-chancellery-select-case') || ''));
            return;
        }

        const tabTrigger = event.target.closest('[data-chancellery-tab]');
        if (tabTrigger) {
            event.preventDefault();
            switchChancelleryTab(String(tabTrigger.getAttribute('data-chancellery-tab') || 'appeals'));
            return;
        }

        const actionTrigger = event.target.closest('[data-chancellery-action]');
        if (!actionTrigger) return;
        event.preventDefault();
        const action = String(actionTrigger.getAttribute('data-chancellery-action') || '').trim();
        if (action === 'show-compose') {
            showChancelleryCompose();
            return;
        }
        if (action === 'submit-request') {
            submitRequest();
            return;
        }
        if (action === 'submit-staff-reply') {
            submitChancelleryStaffReply();
            return;
        }
        if (action === 'mark-resolved') {
            updateChancelleryRequestStatus(String(actionTrigger.getAttribute('data-request-id') || ''), 'Resolved');
        }
    });
    root.addEventListener('input', function onChancelleryInput(event) {
        const filterTrigger = event.target.closest('[data-chancellery-filter]');
        if (filterTrigger && filterTrigger.getAttribute('data-chancellery-filter') === 'search') {
            setChancelleryFilter('search', filterTrigger.value);
        }
    });
    root.addEventListener('change', function onChancelleryChange(event) {
        const filterTrigger = event.target.closest('[data-chancellery-filter]');
        if (filterTrigger) {
            setChancelleryFilter(
                String(filterTrigger.getAttribute('data-chancellery-filter') || '').trim(),
                filterTrigger.value
            );
            return;
        }

        const statusTrigger = event.target.closest('[data-chancellery-status-target]');
        if (statusTrigger) {
            updateChancelleryRequestStatus(
                String(statusTrigger.getAttribute('data-chancellery-status-target') || ''),
                statusTrigger.value
            );
        }
    });
    root.dataset.chancelleryDelegatesBound = '1';
}

function renderChancelleryRequests() {
    renderChancelleryPage();
}

function approveRequest(reqId) {
    updateChancelleryRequestStatus(reqId, 'Resolved');
}

function submitRequest() {
    if (getEffectiveUserRole() !== USER_ROLES.STUDENT) return;
    const subjects = getStudentGradedSubjectsForChancellery();
    const subjectValue = document.getElementById('chancellery-subject-select')?.value || '';
    const requestKind = normalizeChancelleryRequestKind(document.getElementById('chancellery-request-kind')?.value || 'grade-appeal');
    const message = String(document.getElementById('chancellery-request-message')?.value || '').trim();
    const selectedSubject = subjects.find(item => `${item.subjectId}::${item.groupId}` === subjectValue);
    if (!selectedSubject) {
        alert('Choose a graded subject before sending your request.');
        return;
    }
    if (!message) {
        alert('Write the reason for your request before sending it.');
        return;
    }
    const currentUser = getCurrentUser();
    const recipientContext = resolveChancelleryRecipientContext(selectedSubject.subjectId, selectedSubject.groupId);
    const now = new Date().toISOString();
    const newRequest = normalizeChancelleryRequest({
        id: `CHR-${Date.now()}`,
        requestKind,
        type: deriveChancelleryTypeLabel(requestKind),
        studentId: currentUser?.id || '',
        studentName: currentUser?.nameEn || currentUser?.name || 'Student',
        subjectId: selectedSubject.subjectId,
        subjectName: selectedSubject.subjectName,
        groupId: selectedSubject.groupId,
        groupName: selectedSubject.groupName,
        faculty: selectedSubject.faculty,
        message,
        status: 'Submitted',
        createdAt: now,
        updatedAt: now,
        recipientContext,
        thread: [
            createChancelleryThreadEntry({
                kind: 'submission',
                authorRole: 'student',
                authorId: currentUser?.id || '',
                authorName: currentUser?.nameEn || currentUser?.name || 'Student',
                message,
                createdAt: now
            })
        ]
    });
    KIU_STATE.chancelleryRequests = [newRequest, ...ensureChancelleryRequestsStore()];
    const uiState = ensureChancelleryUiState();
    uiState.selectedCaseId = newRequest.id;
    uiState.tab = 'appeals';
    saveState();
    if (!syncChancelleryMutationRegions()) {
        if (!syncChancelleryTabRegions()) {
            renderChancelleryPage();
        }
    }
    alert('Your request was sent to administration and the course staff.');
}

function updateChancelleryRequestStatus(requestId, nextStatus) {
    const request = getChancelleryRequestById(requestId);
    if (!request || ![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(getEffectiveUserRole())) return;
    const normalizedStatus = normalizeChancelleryStatus(nextStatus);
    if (request.status === normalizedStatus) return;
    request.status = normalizedStatus;
    request.updatedAt = new Date().toISOString();
    request.currentStep = getChancelleryStatusStepIndex(normalizedStatus);
    request.thread.push(createChancelleryThreadEntry({
        kind: 'status',
        authorRole: getEffectiveUserRole(),
        authorId: getCurrentUserId(),
        authorName: getCurrentUser()?.nameEn || getCurrentUser()?.name || 'Staff',
        createdAt: request.updatedAt,
        message: `Status changed to ${normalizedStatus}.`,
        status: normalizedStatus
    }));
    saveState();
    if (!syncChancelleryMutationRegions()) {
        renderChancelleryPage();
    }
}

function submitChancelleryStaffReply() {
    const request = getChancelleryRequestById(ensureChancelleryUiState().selectedCaseId);
    if (!request || ![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(getEffectiveUserRole())) return;
    const textarea = document.getElementById('chancellery-staff-reply');
    const message = String(textarea?.value || '').trim();
    if (!message) {
        alert('Write a reply before sending it.');
        return;
    }
    const author = getCurrentUser();
    request.updatedAt = new Date().toISOString();
    request.thread.push(createChancelleryThreadEntry({
        kind: 'message',
        authorRole: getEffectiveUserRole(),
        authorId: author?.id || '',
        authorName: author?.nameEn || author?.name || 'Staff',
        message,
        createdAt: request.updatedAt
    }));
    if (!['Resolved', 'Rejected'].includes(request.status)) {
        request.status = 'Waiting for Student';
        request.currentStep = getChancelleryStatusStepIndex(request.status);
    }
    saveState();
    if (!syncChancelleryMutationRegions()) {
        renderChancelleryPage();
    }
}

function renderChancelleryThread(request) {
    const thread = (request?.thread || []).slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (!thread.length) {
        return '<div class="lux-empty-state">No conversation history has been recorded for this request yet.</div>';
    }
    return `<div class="lux-thread lux-chancellery-thread">${
        thread.map(entry => {
            const entryType = entry.kind === 'status'
                ? 'status'
                : entry.authorRole === 'student'
                    ? 'student'
                    : 'staff';
            const typeLabel = entry.kind === 'status' ? 'Status update' : entry.authorRole || 'message';
            return `
                <div class="lux-thread-entry lux-chancellery-thread-entry lux-soft-chrome home-hover-chip is-${entryType}">
                    <div class="lux-thread-head lux-chancellery-thread-head">
                        <div class="lux-chancellery-thread-copy">
                            <div class="lux-card-copy lux-thread-author">${escapeChancelleryHtml(entry.authorName || 'System')}</div>
                            <div class="lux-panel-copy lux-thread-meta">${escapeChancelleryHtml(typeLabel)}</div>
                        </div>
                        <div class="lux-panel-copy lux-thread-time">${escapeChancelleryHtml(formatChancelleryDate(entry.createdAt, true))}</div>
                    </div>
                    <div class="lux-panel-copy lux-thread-message">${escapeChancelleryHtml(entry.message || '')}</div>
                    ${entry.status ? `<div class="lux-panel-copy lux-meta lux-chancellery-thread-status"><strong>Workflow state:</strong> ${escapeChancelleryHtml(entry.status)}</div>` : ''}
                </div>
            `;
        }).join('')
    }</div>`;
}

function renderChancelleryRequestList(requests, selectedCaseId) {
    if (!requests.length) {
        return '<div class="lux-empty-state lux-chancellery-empty-state">No requests match this view yet.</div>';
    }
    return `<div class="lux-queue-list lux-chancellery-queue-list">${
        requests.map(request => {
            const kindMeta = CHANCELLERY_REQUEST_KIND_META[request.requestKind] || CHANCELLERY_REQUEST_KIND_META.legacy;
            const selected = request.id === selectedCaseId;
            return `
                <button type="button" data-chancellery-select-case="${escapeChancelleryHtml(request.id)}" class="lux-queue-item lux-chancellery-queue-item home-hover-chip${selected ? ' is-selected' : ''}">
                    <div class="lux-queue-head lux-chancellery-queue-head">
                        <div class="lux-chancellery-queue-copy">
                            <div class="lux-chancellery-queue-tag-row">
                                <span class="lux-overline lux-chancellery-queue-id">${escapeChancelleryHtml(request.id)}</span>
                                <span class="lux-pill ${getChancelleryKindPillClass(kindMeta)}">
                                    <i class="${kindMeta.icon}"></i> ${escapeChancelleryHtml(kindMeta.label)}
                                </span>
                            </div>
                            <div class="lux-chancellery-queue-subject">${escapeChancelleryHtml(request.subjectName)}</div>
                        </div>
                        ${getChancelleryStatusPill(request.status)}
                    </div>
                    <div class="lux-inline-meta lux-chancellery-inline-meta lux-chancellery-queue-meta">
                        <span>${escapeChancelleryHtml(resolveChancelleryGroupLabel(request))}</span>
                        <span>${escapeChancelleryHtml(formatChancelleryDate(request.createdAt))}</span>
                    </div>
                    <div class="lux-meta">${escapeChancelleryHtml(getChancelleryLatestPreview(request).slice(0, 170))}</div>
                </button>
            `;
        }).join('')
    }</div>`;
}

function renderChancelleryComposeForm(subjects) {
    return `
        <div class="lux-chancellery-compose-form">
            <div class="lux-card-head lux-chancellery-card-head">
                <div>
                    <div class="lux-section-kicker lux-page-kicker"><i class="fas fa-file-circle-plus"></i> New request</div>
                    <div class="lux-page-title lux-chancellery-card-title">Submit appeal or retake</div>
                </div>
            </div>
            <div class="lux-field-grid lux-field-grid--inline">
                <div class="lux-field">
                    <label for="chancellery-subject-select">Subject</label>
                    <select id="chancellery-subject-select" class="lux-control lux-chancellery-control">
                        <option value="">Select a graded subject</option>
                        ${subjects.map(subject => `<option value="${escapeChancelleryHtml(`${subject.subjectId}::${subject.groupId}`)}">${escapeChancelleryHtml(subject.subjectName)} · ${escapeChancelleryHtml(subject.groupName)}</option>`).join('')}
                    </select>
                </div>
                <div class="lux-field">
                    <label for="chancellery-request-kind">Type</label>
                    <select id="chancellery-request-kind" class="lux-control lux-chancellery-control">
                        <option value="grade-appeal">Grade Appeal</option>
                        <option value="retake-request">Retake Request</option>
                    </select>
                </div>
                <div class="lux-field">
                    <label for="chancellery-request-message">Reason</label>
                    <textarea id="chancellery-request-message" class="lux-control lux-chancellery-control" rows="4" placeholder="Describe the issue or retake reason..."></textarea>
                </div>
            </div>
            <div class="lux-card-actions lux-chancellery-form-actions">
                <button type="button" class="lux-primary-btn lux-chancellery-submit-btn" data-chancellery-action="submit-request">
                    <i class="fas fa-paper-plane"></i> Send
                </button>
            </div>
        </div>
    `;
}

function renderChancelleryCaseMeta(request) {
    const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(request.faculty) : request.faculty;
    const recipients = [
        'Administration',
        request.recipientContext?.professorName,
        request.recipientContext?.taName
    ].filter(Boolean).map(name => escapeChancelleryHtml(name)).join('<br>');
    return `
        <div class="lux-subcards lux-chancellery-subcards-spaced">
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Recipients</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${recipients}</div>
            </div>
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Faculty</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${escapeChancelleryHtml(facultyLabel)}</div>
            </div>
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Submitted</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${escapeChancelleryHtml(formatChancelleryDate(request.createdAt, true))}</div>
            </div>
        </div>
    `;
}

function renderChancelleryCaseDetailPanel(request, options = {}) {
    const { staff = false, readOnly = false } = options;
    const headKicker = staff ? 'Selected request' : 'Case';
    const metaLine = staff
        ? [request.id, request.studentName, deriveChancelleryTypeLabel(request.requestKind)]
        : [request.id, deriveChancelleryTypeLabel(request.requestKind), resolveChancelleryGroupLabel(request)];
    return `
        <div class="lux-card-head lux-chancellery-card-head">
            <div class="lux-chancellery-card-copy">
                <div class="lux-section-kicker lux-page-kicker"><i class="fas fa-timeline"></i> ${headKicker}</div>
                <div class="lux-page-title lux-chancellery-card-title">${escapeChancelleryHtml(request.subjectName)}</div>
                <div class="lux-inline-meta lux-chancellery-inline-meta">
                    ${metaLine.map(item => `<span class="lux-panel-copy">${escapeChancelleryHtml(item)}</span>`).join('')}
                </div>
            </div>
            <div class="lux-chancellery-status-actions">
                ${getChancelleryStatusPill(request.status)}
                ${staff ? (readOnly ? `
                    <span class="lux-pill lux-chancellery-view-pill"><i class="fas fa-eye"></i> View only</span>
                ` : `
                    <select data-chancellery-status-target="${escapeChancelleryHtml(request.id)}" class="lux-control lux-chancellery-control lux-chancellery-status-select">
                        ${CHANCELLERY_STATUS_FLOW.map(status => `<option value="${escapeChancelleryHtml(status)}"${request.status === status ? ' selected' : ''}>${escapeChancelleryHtml(status)}</option>`).join('')}
                    </select>
                `) : ''}
            </div>
        </div>
        ${renderChancelleryCaseMeta(request)}
        <div class="lux-section-kicker lux-chancellery-section-title">Thread</div>
        ${renderChancelleryThread(request)}
        ${staff ? `
            <div class="lux-chancellery-thread-region">
                ${readOnly ? `
                    <div class="lux-meta">Read-only view. Continue student conversations in Student Service.</div>
                ` : `
                    <div class="lux-field-grid">
                        <div class="lux-field">
                            <label for="chancellery-staff-reply">Reply</label>
                            <textarea id="chancellery-staff-reply" class="lux-control lux-chancellery-control" rows="4" placeholder="Write an update for the student..."></textarea>
                        </div>
                    </div>
                    <div class="lux-card-actions lux-chancellery-reply-actions">
                        <button type="button" class="lux-secondary-btn" data-chancellery-action="mark-resolved" data-request-id="${escapeChancelleryHtml(request.id)}">
                            <i class="fas fa-circle-check"></i> Resolved
                        </button>
                        <button type="button" class="lux-primary-btn" data-chancellery-action="submit-staff-reply">
                            <i class="fas fa-reply"></i> Send
                        </button>
                    </div>
                `}
            </div>
        ` : ''}
    `;
}

function renderChancelleryFilterSelect(filterKey, label, value, options) {
    const current = normalizeChancelleryKey(value || 'all');
    return `
        <div class="lux-field lux-chancellery-filter-field">
            <label>${escapeChancelleryHtml(label)}</label>
            <select data-chancellery-filter="${escapeChancelleryHtml(filterKey)}" class="lux-control lux-chancellery-control">
                ${options.map(option => {
                    const key = normalizeChancelleryKey(option.value);
                    return `<option value="${escapeChancelleryHtml(option.value)}"${current === key ? ' selected' : ''}>${escapeChancelleryHtml(option.label)}</option>`;
                }).join('')}
            </select>
        </div>
    `;
}


function renderChancelleryCommandBar({ role, uiState, count, subjectOptions = [], showCompose = false }) {
    const filters = uiState.filters || {};
    const configuredFilters = typeof getChancelleryEnabledFiltersForRole === 'function'
        ? getChancelleryEnabledFiltersForRole(role)
        : [];
    const dynamicSubjects = subjectOptions.map(request => ({
        value: normalizeChancelleryKey(request.subjectId),
        label: request.subjectName
    }));
    const droplistMarkup = configuredFilters.map((filter) => {
        const options = typeof resolveChancelleryFilterOptions === 'function'
            ? resolveChancelleryFilterOptions(filter, { subjects: dynamicSubjects })
            : (filter.options || []);
        return renderChancelleryFilterSelect(filter.id, filter.label, filters[filter.id], options);
    }).join('');
    return `
        <div class="filter-shell lux-chancellery-command-bar home-hover-chip" data-lux-visual-skip="1">
            ${showCompose ? `
                <button type="button" class="lux-primary-btn" data-chancellery-action="show-compose">
                    <i class="fas fa-plus"></i> New request
                </button>
            ` : ''}
            <div class="lux-field lux-chancellery-filter-field lux-chancellery-search">
                <label class="sr-only" for="chancellery-search">Search</label>
                <input id="chancellery-search" type="search" class="lux-control lux-chancellery-control" data-chancellery-filter="search" value="${escapeChancelleryHtml(filters.search || '')}" placeholder="Search cases...">
            </div>
            ${droplistMarkup}
            <span class="lux-chancellery-command-spacer" aria-hidden="true"></span>
            <span class="lux-pill">${count} case${count === 1 ? '' : 's'}</span>
        </div>
    `;
}

function renderChancelleryWorkspace({ listTitle, listCopy, requests, selectedRequest, rightMarkup }) {
    return `
        <div class="lux-chancellery-workspace">
            <div class="lux-chancellery-workspace-split">
                <section class="lux-chancellery-list-panel home-hover-chip">
                    <div class="lux-actions-between lux-chancellery-actions-between">
                        <div>
                            <div class="lux-page-title lux-chancellery-card-title">${escapeChancelleryHtml(listTitle)}</div>
                            ${listCopy ? `<div class="lux-panel-copy lux-chancellery-card-copy">${escapeChancelleryHtml(listCopy)}</div>` : ''}
                        </div>
                    </div>
                    <div class="lux-chancellery-list-region">${renderChancelleryRequestList(requests, selectedRequest?.id || '')}</div>
                </section>
                <section class="lux-chancellery-detail-panel home-hover-chip">
                    <div class="lux-chancellery-detail-body">${rightMarkup}</div>
                </section>
            </div>
        </div>
    `;
}

function renderChancelleryStudentAppealsPanel(requests, selectedRequest) {
    const subjects = getStudentGradedSubjectsForChancellery();
    const uiState = ensureChancelleryUiState();
    const filteredRequests = filterChancelleryRequests(requests, uiState.filters);
    const activeRequest = selectedRequest && filteredRequests.some(request => request.id === selectedRequest.id)
        ? selectedRequest
        : null;
    const rightMarkup = activeRequest
        ? renderChancelleryCaseDetailPanel(activeRequest)
        : renderChancelleryComposeForm(subjects);
    return renderChancelleryWorkspace({
        listTitle: 'My cases',
        listCopy: '',
        requests: filteredRequests,
        selectedRequest: activeRequest,
        rightMarkup
    });
}

function renderChancelleryStudentFinancePanel() {
    const currentUser = getCurrentUser();
    const tuitionBalances = KIU_STATE?.tuitionBalances || {};
    const balance = Number(tuitionBalances[currentUser?.id] || tuitionBalances.student || 0);
    const statusLabel = balance > 0 ? 'Outstanding balance' : 'Paid';
    const tone = balance > 0 ? 'warning' : 'success';
    return `
        <div class="lux-strip-grid lux-strip-grid--adaptive lux-chancellery-finance-grid">
            <div class="lux-stat-card lux-strip-card home-hover-chip lux-chancellery-finance-card">
                <div class="lux-card-meta lux-chancellery-stat-label">Balance</div>
                <div id="finance-current-balance" class="lux-card-title lux-chancellery-stat-value">${balance.toLocaleString()} GEL</div>
            </div>
            <div class="lux-stat-card lux-strip-card home-hover-chip lux-chancellery-finance-card">
                <div class="lux-card-meta lux-chancellery-stat-label">Status</div>
                <div id="finance-status-note" class="lux-status-pill home-hover-chip lux-chancellery-finance-pill is-${tone}">${escapeChancelleryHtml(statusLabel)}</div>
            </div>
            <div class="lux-stat-card lux-strip-card home-hover-chip lux-chancellery-finance-card">
                <div class="lux-card-meta lux-chancellery-stat-label">Note</div>
                <div class="lux-card-copy lux-chancellery-finance-note">Read-only tuition snapshot. Appeals stay on the other tab.</div>
            </div>
        </div>
    `;
}

function renderChancelleryStaffWorkspace(requests) {
    const uiState = ensureChancelleryUiState();
    const isReadOnly = getEffectiveUserRole() === USER_ROLES.STUDENT_SERVICE;
    const filteredRequests = filterChancelleryRequests(requests, uiState.filters);
    const selectedRequest = resolveChancellerySelection(filteredRequests, { autoSelect: true });
    const rightMarkup = selectedRequest
        ? renderChancelleryCaseDetailPanel(selectedRequest, { staff: true, readOnly: isReadOnly })
        : '<div class="lux-empty-state">Select a request from the queue.</div>';
    const listTitle = getEffectiveUserRole() === USER_ROLES.ADMIN
        ? 'Inbox'
        : isReadOnly
            ? 'Cases'
            : 'Queue';
    return renderChancelleryWorkspace({
        listTitle,
        listCopy: '',
        requests: filteredRequests,
        selectedRequest,
        rightMarkup
    });
}

function ensureChancelleryShell(root) {
    if (!root) return null;
    if (!root.querySelector('[data-chancellery-shell="1"]')) {
        root.innerHTML = `
            <div class="lux-page-shell" data-chancellery-shell="1" data-lux-glass-root="1">
                <div id="chancellery-hero-region"></div>
                <div id="chancellery-command-region"></div>
                <div id="chancellery-content-region"></div>
            </div>
        `;
    }
    return {
        hero: root.querySelector('#chancellery-hero-region'),
        command: root.querySelector('#chancellery-command-region'),
        content: root.querySelector('#chancellery-content-region'),
    };
}

function renderChancelleryHero({ isStudent, uiState, headingTitle, headingCopy, heroStatusLabel, heroRows }) {
    return `
        <section class="page-hero lux-hero lux-chancellery-hero-card" aria-label="Chancellery hero">
            <div class="lux-hero-stage lux-chancellery-hero-stage">
                <div class="lux-hero-main lux-chancellery-hero-main">
                    <div class="lux-section-kicker lux-page-kicker"><i class="fas fa-scale-balanced"></i> Chancellery</div>
                    <div class="page-hero-title lux-page-title">${headingTitle}</div>
                    <div class="page-hero-copy lux-page-copy">${headingCopy}</div>
                    ${isStudent ? `
                        <div class="lux-card-actions lux-chancellery-hero-actions">
                            <button type="button" id="chan-tab-appeals" class="lux-secondary-btn lux-chancellery-tab-btn ${uiState.tab !== 'finance' ? 'active' : ''}" data-chancellery-tab="appeals" role="tab" aria-selected="${uiState.tab !== 'finance' ? 'true' : 'false'}">
                                <i class="fas fa-file-circle-question"></i> Appeals
                            </button>
                            <button type="button" id="chan-tab-finance" class="lux-secondary-btn lux-chancellery-tab-btn ${uiState.tab === 'finance' ? 'active' : ''}" data-chancellery-tab="finance" role="tab" aria-selected="${uiState.tab === 'finance' ? 'true' : 'false'}">
                                <i class="fas fa-wallet"></i> Finance
                            </button>
                        </div>
                    ` : ''}
                </div>
                <aside class="lux-hero-side lux-chancellery-hero-side lux-timetable-hero-focus lux-focus-panel home-hover-chip" aria-label="Chancellery case load">
                    <div class="lux-focus-panel__head">
                        <div class="lux-focus-panel__kicker">Case load</div>
                        ${getChancelleryHeroFocusChip(heroStatusLabel)}
                    </div>
                    <div class="lux-focus-panel__body">
                        <div class="lux-focus-panel__title">${escapeChancelleryHtml((heroRows.find((row) => row.label === 'Open') || heroRows[0] || { value: '0' }).value)} open</div>
                        <p class="lux-focus-panel__copy">${headingCopy}</p>
                    </div>
                    <div class="lux-focus-panel__meta lux-hero-signal-list lux-chancellery-hero-signals" aria-label="Case metrics">
                        ${heroRows.map(row => `
                            <span class="lux-hero-signal home-hover-chip">
                                <span>${escapeChancelleryHtml(row.label)}</span>
                                <strong>${escapeChancelleryHtml(row.value)}</strong>
                            </span>
                        `).join('')}
                    </div>
                </aside>
            </div>
        </section>
    `;
}

function buildChancelleryHeroRows(isStudent, requests) {
    const openCount = requests.filter(request => !['Resolved', 'Rejected'].includes(request.status)).length;
    const waitingCount = requests.filter(request => ['Waiting for Staff', 'Waiting for Student'].includes(request.status)).length;
    const resolvedCount = requests.filter(request => request.status === 'Resolved').length;
    if (isStudent) {
        const balance = Number(KIU_STATE?.tuitionBalances?.[getCurrentUserId()] || KIU_STATE?.tuitionBalances?.student || 0);
        return [
            { label: 'Open', value: String(openCount) },
            { label: 'Waiting', value: String(waitingCount) },
            { label: 'Resolved', value: String(resolvedCount) },
            { label: 'Balance', value: balance > 0 ? `${balance.toLocaleString()} GEL` : 'Clear' }
        ];
    }
    return [
        { label: 'Total', value: String(requests.length) },
        { label: 'Open', value: String(openCount) },
        { label: 'Waiting', value: String(waitingCount) },
        { label: 'Resolved', value: String(resolvedCount) }
    ];
}

function buildChancelleryRenderContext() {
    if (typeof ensureChancelleryFilterLayoutStore === 'function') ensureChancelleryFilterLayoutStore();
    const uiState = ensureChancelleryUiState();
    const role = getEffectiveUserRole();
    syncChancelleryUiFiltersForRole(role);
    const requests = getVisibleChancelleryRequests();
    const isStudent = role === USER_ROLES.STUDENT;
    const isStaff = [USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.STUDENT_SERVICE].includes(role);
    const showAppealsWorkspace = !isStudent || uiState.tab !== 'finance';
    const filteredRequests = showAppealsWorkspace ? filterChancelleryRequests(requests, uiState.filters, role) : requests;
    const selectedRequest = isStudent
        ? resolveChancellerySelection(filteredRequests, { autoSelect: false })
        : resolveChancellerySelection(filteredRequests, { autoSelect: true });
    const headingTitle = isStudent
        ? (uiState.tab === 'finance' ? 'Finance' : 'Appeals & Retakes')
        : role === USER_ROLES.STUDENT_SERVICE
            ? 'Support cases'
            : 'Appeals inbox';
    const headingCopy = isStudent
        ? (uiState.tab === 'finance' ? 'Tuition balance snapshot.' : 'Grade appeals and retake requests for your subjects.')
        : role === USER_ROLES.STUDENT_SERVICE
            ? 'Read-only case view for student support.'
            : 'Review appeals, reply in thread, update status.';
    const openCount = requests.filter(request => !['Resolved', 'Rejected'].includes(request.status)).length;
    const waitingCount = requests.filter(request => ['Waiting for Staff', 'Waiting for Student'].includes(request.status)).length;
    const heroStatusLabel = isStudent
        ? (waitingCount > 0 ? 'Waiting for Staff' : (openCount > 0 ? 'Submitted' : 'Resolved'))
        : (waitingCount > 0 ? 'Waiting for Staff' : (openCount ? 'Under Review' : 'Resolved'));
    const heroRows = buildChancelleryHeroRows(isStudent, requests);
    const subjectOptions = [...new Map(requests.map(request => [request.subjectId, request])).values()];
    return {
        uiState,
        role,
        requests,
        isStudent,
        isStaff,
        showAppealsWorkspace,
        filteredRequests,
        filteredCount: filteredRequests.length,
        selectedRequest,
        headingTitle,
        headingCopy,
        heroStatusLabel,
        heroRows,
        subjectOptions
    };
}

function getChancelleryShellRegions() {
    const root = document.getElementById('page-chancellery');
    if (!root) return null;
    const shell = ensureChancelleryShell(root);
    if (!shell?.hero || !shell?.command || !shell?.content) return null;
    return { root, shell };
}

function applyChancelleryRegionMarkup(region, markup) {
    region.innerHTML = typeof localizeHtmlMarkup === 'function' ? localizeHtmlMarkup(markup) : markup;
    if (typeof queueEnglishLocalization === 'function') {
        queueEnglishLocalization(region);
    }
}

function resolveChancelleryStudentWorkspaceParts(context) {
    const subjects = getStudentGradedSubjectsForChancellery();
    const activeRequest = context.selectedRequest
        && context.filteredRequests.some(request => request.id === context.selectedRequest.id)
        ? context.selectedRequest
        : null;
    return {
        listSelectedId: activeRequest?.id || '',
        rightMarkup: activeRequest
            ? renderChancelleryCaseDetailPanel(activeRequest)
            : renderChancelleryComposeForm(subjects)
    };
}

function resolveChancelleryStaffWorkspaceParts(context) {
    const isReadOnly = context.role === USER_ROLES.STUDENT_SERVICE;
    const selectedRequest = context.selectedRequest;
    return {
        listSelectedId: selectedRequest?.id || '',
        rightMarkup: selectedRequest
            ? renderChancelleryCaseDetailPanel(selectedRequest, { staff: true, readOnly: isReadOnly })
            : '<div class="lux-empty-state">Select a request from the queue.</div>'
    };
}

function applyChancelleryLocalizedMarkup(target, markup) {
    if (!target) return;
    target.innerHTML = typeof localizeHtmlMarkup === 'function' ? localizeHtmlMarkup(markup) : markup;
    if (typeof queueEnglishLocalization === 'function') {
        queueEnglishLocalization(target);
    }
}

function syncChancelleryPickerControls(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    const syncPicker = typeof window.syncUniversalPicker === 'function' ? window.syncUniversalPicker : null;
    if (!syncPicker) return;
    root.querySelectorAll('select').forEach((select) => {
        const shell = select.closest('.lux-picker-field');
        if (!shell) return;
        syncPicker(select, shell.querySelector('.lux-picker-btn'), shell.querySelector('.lux-picker-panel'));
    });
}

function resolveChancelleryDetailMode(detailBody) {
    if (!detailBody) return 'unknown';
    if (detailBody.querySelector('.lux-chancellery-compose-form')) return 'compose';
    if (detailBody.querySelector('.lux-chancellery-thread, .lux-chancellery-section-title')) return 'case';
    if (detailBody.querySelector('.lux-empty-state')) return 'empty';
    return 'unknown';
}

function resolveChancelleryTargetDetailMode(context) {
    if (context.isStudent) {
        const activeRequest = context.selectedRequest
            && context.filteredRequests.some(request => request.id === context.selectedRequest.id)
            ? context.selectedRequest
            : null;
        return activeRequest ? 'case' : 'compose';
    }
    return context.selectedRequest ? 'case' : 'empty';
}

function getChancelleryDetailCaseId(detailBody, contentEl) {
    if (!detailBody || resolveChancelleryDetailMode(detailBody) !== 'case') return '';
    const statusTarget = detailBody.querySelector('[data-chancellery-status-target]');
    if (statusTarget) {
        return String(statusTarget.getAttribute('data-chancellery-status-target') || '');
    }
    const selectedBtn = contentEl?.querySelector('.lux-chancellery-queue-item.is-selected');
    return String(selectedBtn?.getAttribute('data-chancellery-select-case') || '');
}

function resolveChancelleryTargetCaseId(context) {
    const activeRequest = context.selectedRequest
        && context.filteredRequests.some(request => request.id === context.selectedRequest.id)
        ? context.selectedRequest
        : null;
    return activeRequest?.id || '';
}

function shouldPatchChancelleryDetailRegion(contentEl, context) {
    const detailBody = contentEl.querySelector('.lux-chancellery-detail-body');
    if (!detailBody) return false;
    const targetMode = resolveChancelleryTargetDetailMode(context);
    const currentMode = resolveChancelleryDetailMode(detailBody);
    if (currentMode !== targetMode) return true;
    if (targetMode !== 'case') return false;
    return getChancelleryDetailCaseId(detailBody, contentEl) !== resolveChancelleryTargetCaseId(context);
}

function patchChancelleryListRegion(contentEl, context) {
    const listRegion = contentEl.querySelector('.lux-chancellery-list-region');
    if (!listRegion) return false;
    const parts = context.isStudent
        ? resolveChancelleryStudentWorkspaceParts(context)
        : resolveChancelleryStaffWorkspaceParts(context);
    applyChancelleryLocalizedMarkup(
        listRegion,
        renderChancelleryRequestList(context.filteredRequests, parts.listSelectedId)
    );
    return true;
}

function patchChancelleryListSelection(contentEl, selectedCaseId) {
    const listRegion = contentEl.querySelector('.lux-chancellery-list-region');
    if (!listRegion) return false;
    const selectedId = String(selectedCaseId || '');
    const buttons = listRegion.querySelectorAll('[data-chancellery-select-case]');
    if (!buttons.length) return false;
    buttons.forEach((button) => {
        const caseId = String(button.getAttribute('data-chancellery-select-case') || '');
        button.classList.toggle('is-selected', caseId === selectedId);
    });
    return true;
}

function patchChancelleryDetailRegion(contentEl, context) {
    const detailBody = contentEl.querySelector('.lux-chancellery-detail-body');
    if (!detailBody) return false;
    const parts = context.isStudent
        ? resolveChancelleryStudentWorkspaceParts(context)
        : resolveChancelleryStaffWorkspaceParts(context);
    applyChancelleryLocalizedMarkup(detailBody, parts.rightMarkup);
    if (typeof window.enhanceUniversalPickers === 'function') {
        window.enhanceUniversalPickers(detailBody);
    }
    return true;
}

function patchChancelleryWorkspace(contentEl, context, { list = true, detail = true } = {}) {
    const hasList = contentEl.querySelector('.lux-chancellery-list-region');
    const hasDetail = contentEl.querySelector('.lux-chancellery-detail-body');
    if (!hasList || !hasDetail) return false;
    const listOk = !list || patchChancelleryListRegion(contentEl, context);
    const detailOk = !detail || patchChancelleryDetailRegion(contentEl, context);
    return listOk && detailOk;
}

function patchChancelleryCommandBar(commandEl, context, { mode = 'filters' } = {}) {
    const bar = commandEl.querySelector('.lux-chancellery-command-bar');
    if (!bar) return false;
    const filters = context.uiState.filters || {};

    if (mode === 'count' || mode === 'filters') {
        const pill = bar.querySelector('.lux-pill');
        if (pill) {
            pill.textContent = `${context.filteredCount} case${context.filteredCount === 1 ? '' : 's'}`;
        }
    }

    if (mode === 'filters') {
        bar.querySelectorAll('[data-chancellery-filter]').forEach((control) => {
            const filterKey = String(control.getAttribute('data-chancellery-filter') || '').trim();
            if (!filterKey || filterKey === 'search') return;
            control.value = filters[filterKey] || 'all';
        });
        syncChancelleryPickerControls(bar);
    }
    return true;
}

function syncChancelleryWorkspaceRegion() {
    const regions = getChancelleryShellRegions();
    const contentEl = regions?.shell.content;
    if (!contentEl?.querySelector('.lux-chancellery-workspace')) return false;
    bindChancelleryDelegates(regions.root);
    const context = buildChancelleryRenderContext();
    const targetCaseId = resolveChancelleryTargetCaseId(context);
    const listButtons = contentEl.querySelectorAll('.lux-chancellery-list-region [data-chancellery-select-case]');
    const listOk = listButtons.length
        ? patchChancelleryListSelection(contentEl, targetCaseId)
        : patchChancelleryListRegion(contentEl, context);
    const detailOk = shouldPatchChancelleryDetailRegion(contentEl, context)
        ? patchChancelleryDetailRegion(contentEl, context)
        : true;
    return listOk && detailOk;
}

function syncChancelleryFilterRegions(filterKey) {
    const regions = getChancelleryShellRegions();
    if (!regions) return false;
    const contentEl = regions.shell.content;
    const hasWorkspace = Boolean(contentEl.querySelector('.lux-chancellery-workspace'));
    const hasCommandBar = Boolean(regions.shell.command.querySelector('.lux-chancellery-command-bar'));
    if (!hasWorkspace || !hasCommandBar) return false;
    bindChancelleryDelegates(regions.root);
    const context = buildChancelleryRenderContext();
    const commandMode = filterKey === 'search' ? 'count' : 'filters';
    const commandOk = patchChancelleryCommandBar(regions.shell.command, context, { mode: commandMode });
    const listOk = patchChancelleryListRegion(contentEl, context);
    const detailOk = shouldPatchChancelleryDetailRegion(contentEl, context)
        ? patchChancelleryDetailRegion(contentEl, context)
        : true;
    return commandOk && listOk && detailOk;
}

function patchChancelleryHero(heroEl, context) {
    if (!heroEl) return false;
    const titleEl = heroEl.querySelector('.page-hero-title');
    const copyEl = heroEl.querySelector('.page-hero-copy');
    const signalsEl = heroEl.querySelector('.lux-chancellery-hero-signals');
    if (!titleEl || !copyEl || !signalsEl) return false;

    titleEl.textContent = context.headingTitle;
    copyEl.textContent = context.headingCopy;

    const pillEl = heroEl.querySelector('.lux-chancellery-hero-side .lux-status-pill, .lux-chancellery-hero-side .lux-focus-panel__chip');
    if (pillEl) {
        const meta = getChancelleryStatusMeta(context.heroStatusLabel);
        pillEl.className = `lux-focus-panel__chip lux-status-pill home-hover-chip lux-chancellery-status-pill lux-chancellery-case-status-pill is-${meta.tone}`;
        pillEl.innerHTML = `<i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}`;
    }

    const titleElFocus = heroEl.querySelector('.lux-chancellery-hero-side .lux-focus-panel__title');
    if (titleElFocus) {
        const openValue = (context.heroRows.find((row) => row.label === 'Open') || context.heroRows[0] || { value: '0' }).value;
        titleElFocus.textContent = `${openValue} open`;
    }
    const copyElFocus = heroEl.querySelector('.lux-chancellery-hero-side .lux-focus-panel__copy');
    if (copyElFocus) copyElFocus.textContent = context.headingCopy;

    const signals = signalsEl.querySelectorAll('.lux-hero-signal');
    context.heroRows.forEach((row, index) => {
        const signal = signals[index];
        if (!signal) return;
        const labelEl = signal.querySelector('span');
        const valueEl = signal.querySelector('strong');
        if (labelEl) labelEl.textContent = row.label;
        if (valueEl) valueEl.textContent = row.value;
    });

    if (context.isStudent) {
        const appealsTab = heroEl.querySelector('#chan-tab-appeals');
        const financeTab = heroEl.querySelector('#chan-tab-finance');
        if (!appealsTab || !financeTab) return false;
        const isFinance = context.uiState.tab === 'finance';
        appealsTab.classList.toggle('active', !isFinance);
        appealsTab.setAttribute('aria-selected', isFinance ? 'false' : 'true');
        financeTab.classList.toggle('active', isFinance);
        financeTab.setAttribute('aria-selected', isFinance ? 'true' : 'false');
    }

    return true;
}

function resolveChancelleryRegionMarkup(context) {
    const {
        uiState,
        role,
        requests,
        isStudent,
        isStaff,
        filteredRequests,
        selectedRequest,
        subjectOptions
    } = context;

    let contentMarkup = '';
    let commandMarkup = '';
    if (isStudent && uiState.tab === 'finance') {
        contentMarkup = renderChancelleryStudentFinancePanel();
    } else if (isStudent) {
        commandMarkup = renderChancelleryCommandBar({
            role,
            uiState,
            count: filteredRequests.length,
            showCompose: true
        });
        contentMarkup = renderChancelleryStudentAppealsPanel(requests, selectedRequest);
    } else if (isStaff) {
        commandMarkup = renderChancelleryCommandBar({
            role,
            uiState,
            count: filteredRequests.length,
            subjectOptions
        });
        contentMarkup = renderChancelleryStaffWorkspace(requests);
    } else {
        contentMarkup = '<div class="lux-card"><div class="lux-card-body"><div class="lux-empty-state">Unavailable for this role.</div></div></div>';
    }

    return { commandMarkup, contentMarkup };
}

function syncChancelleryTabRegions() {
    const regions = getChancelleryShellRegions();
    if (!regions) return false;
    bindChancelleryDelegates(regions.root);
    const context = buildChancelleryRenderContext();
    if (!patchChancelleryHero(regions.shell.hero, context)) return false;

    const { commandMarkup, contentMarkup } = resolveChancelleryRegionMarkup(context);

    if (context.isStudent && context.uiState.tab === 'finance') {
        applyChancelleryRegionMarkup(regions.shell.command, '');
        applyChancelleryRegionMarkup(regions.shell.content, contentMarkup);
        renderFinancialLedger();
        return true;
    }

    if (context.isStudent) {
        const hasCommandBar = Boolean(regions.shell.command.querySelector('.lux-chancellery-command-bar'));
        if (!hasCommandBar && commandMarkup) {
            applyChancelleryRegionMarkup(regions.shell.command, commandMarkup);
            if (typeof window.enhanceUniversalPickers === 'function') {
                window.enhanceUniversalPickers(regions.shell.command);
            }
        } else if (hasCommandBar) {
            patchChancelleryCommandBar(regions.shell.command, context, { mode: 'filters' });
        }
        applyChancelleryRegionMarkup(regions.shell.content, contentMarkup);
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(regions.shell.content);
        }
        return true;
    }

    applyChancelleryRegionMarkup(regions.shell.command, commandMarkup);
    applyChancelleryRegionMarkup(regions.shell.content, contentMarkup);
    return true;
}

function syncChancelleryMutationRegions() {
    const regions = getChancelleryShellRegions();
    if (!regions) return false;
    bindChancelleryDelegates(regions.root);
    const context = buildChancelleryRenderContext();
    if (!patchChancelleryHero(regions.shell.hero, context)) return false;

    const hasWorkspace = Boolean(regions.shell.content.querySelector('.lux-chancellery-workspace'));
    if (!hasWorkspace) return false;

    if (!patchChancelleryWorkspace(regions.shell.content, context)) return false;
    if (regions.shell.command.querySelector('.lux-chancellery-command-bar')) {
        patchChancelleryCommandBar(regions.shell.command, context, { mode: 'count' });
    }
    return true;
}

function renderChancelleryPage() {
    const regions = getChancelleryShellRegions();
    if (!regions) return;
    const { root, shell } = regions;
    bindChancelleryDelegates(root);
    const context = buildChancelleryRenderContext();
    const {
        isStudent,
        uiState,
        headingTitle,
        headingCopy,
        heroStatusLabel,
        heroRows
    } = context;
    const { commandMarkup, contentMarkup } = resolveChancelleryRegionMarkup(context);

    applyChancelleryRegionMarkup(shell.hero, renderChancelleryHero({
        isStudent,
        uiState,
        headingTitle,
        headingCopy,
        heroStatusLabel,
        heroRows
    }));
    applyChancelleryRegionMarkup(shell.command, commandMarkup);
    applyChancelleryRegionMarkup(shell.content, contentMarkup);
    if (isStudent && uiState.tab === 'finance') {
        renderFinancialLedger();
    }
}

function renderFinancialLedger() {
    const balanceEl = document.getElementById('finance-current-balance');
    if (!balanceEl) return;
    const tuitionBalances = KIU_STATE?.tuitionBalances || {};
    const studentId = getCurrentUser()?.role === USER_ROLES.STUDENT
        ? getCurrentUserId()
        : Object.keys(tuitionBalances).find(id => id !== 'student');
    
    const balance = (studentId && tuitionBalances[studentId]) || 0;
    balanceEl.innerText = `${balance.toLocaleString()} GEL`;
    
    const statusBox = document.getElementById('finance-status-note');
    if (!statusBox) return;
    if (balance <= 0) {
        statusBox.innerHTML = '<i class="fas fa-check-circle"></i> All fees are paid';
        statusBox.className = 'lux-status-pill home-hover-chip lux-chancellery-finance-pill is-success';
    } else {
        statusBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Outstanding balance';
        statusBox.className = 'lux-status-pill home-hover-chip lux-chancellery-finance-pill is-warning';
    }
}

function applyScholarship(amount) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    const tuitionBalances = KIU_STATE?.tuitionBalances || (KIU_STATE.tuitionBalances = {});
    const studentId = getCurrentUser()?.role === USER_ROLES.STUDENT
        ? getCurrentUserId()
        : Object.keys(tuitionBalances).find(id => id !== 'student');
    if (!studentId) return;
    
    if (!tuitionBalances[studentId]) tuitionBalances[studentId] = 0;
    tuitionBalances[studentId] -= amt;
    
    // Add transaction
    alert(`FINANCIAL SUCCESS: Scholarship of ${amt} GEL applied to Student Georgian account.`);
    saveState();
    renderFinancialLedger();
}

function toggleProbation() {
    const probationStatus = KIU_STATE?.probationStatus || (KIU_STATE.probationStatus = {});
    const studentId = getCurrentUser()?.role === USER_ROLES.STUDENT
        ? getCurrentUserId()
        : Object.keys(probationStatus).find(id => id !== 'student');
    if (!studentId) return;
    probationStatus[studentId] = !probationStatus[studentId];
    const status = probationStatus[studentId] ? 'ACTIVE (Limit 24 ECTS)' : 'INACTIVE (Limit 36 ECTS)';
    alert(`ACADEMIC CONDUCT: Student Probation status is now ${status}.`);
    saveState();
}

function ratePeer(el, rating) {
    const parent = el.parentNode;
    const stars = parent.querySelectorAll('.peer-star');
    stars.forEach((s, i) => {
        if (i < rating) {
            s.classList.remove('far');
            s.classList.add('fas');
        } else {
            s.classList.remove('fas');
            s.classList.add('far');
        }
    });
}

