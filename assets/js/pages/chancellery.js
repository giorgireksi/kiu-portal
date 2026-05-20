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
        subject: 'all'
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
            filters: { status: 'all', type: 'all', subject: 'all' }
        };
    }
    chancelleryUiState.filters = chancelleryUiState.filters || { status: 'all', type: 'all', subject: 'all' };
    return chancelleryUiState;
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
        groupName: group?.name || groupId || '',
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
        groupId: String(request.groupId || ''),
        groupName: request.groupName || recipientContext.groupName || request.groupId || '',
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

function ensureSelectedChancelleryCase(requests) {
    const uiState = ensureChancelleryUiState();
    if (!requests.length) {
        uiState.selectedCaseId = '';
        return null;
    }
    if (!uiState.selectedCaseId || !requests.some(request => request.id === uiState.selectedCaseId)) {
        uiState.selectedCaseId = requests[0].id;
    }
    return requests.find(request => request.id === uiState.selectedCaseId) || requests[0] || null;
}

function getChancelleryStatusMeta(status) {
    const normalized = normalizeChancelleryStatus(status);
    if (normalized === 'Resolved') return { label: normalized, tone: 'success', icon: 'fas fa-circle-check' };
    if (normalized === 'Rejected') return { label: normalized, tone: 'danger', icon: 'fas fa-octagon-xmark' };
    if (normalized === 'Waiting for Student') return { label: normalized, tone: 'info', icon: 'fas fa-user-clock' };
    if (normalized === 'Waiting for Staff') return { label: normalized, tone: 'warning', icon: 'fas fa-briefcase-clock' };
    return { label: normalized, tone: 'muted', icon: 'fas fa-timeline' };
}

function getChancelleryStatusPill(status) {
    const meta = getChancelleryStatusMeta(status);
    return `<span class="lux-status-pill is-${meta.tone}"><i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}</span>`;
}

function getChancelleryKindPillStyle(kindMeta) {
    const tone = kindMeta?.tone || 'muted';
    if (tone === 'primary') {
        return 'background:rgba(var(--lux-accent-rgb),0.12); color:var(--lux-accent); border-color:rgba(var(--lux-accent-rgb),0.22);';
    }
    if (tone === 'secondary') {
        return 'background:rgba(var(--lux-accent-2-rgb),0.12); color:var(--lux-accent-2); border-color:rgba(var(--lux-accent-2-rgb),0.22);';
    }
    return 'background:rgba(148,163,184,0.14); color:var(--lux-text-muted); border-color:rgba(148,163,184,0.22);';
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
    renderChancelleryPage();
}

function setChancelleryFilter(filterKey, value) {
    const uiState = ensureChancelleryUiState();
    uiState.filters[filterKey] = value || 'all';
    uiState.selectedCaseId = '';
    renderChancelleryPage();
}

function switchChancelleryTab(tab) {
    const uiState = ensureChancelleryUiState();
    uiState.tab = tab === 'finance' ? 'finance' : 'appeals';
    renderChancelleryPage();
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
    renderChancelleryPage();
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
    renderChancelleryPage();
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
    renderChancelleryPage();
}

function renderChancelleryThread(request) {
    const thread = (request?.thread || []).slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (!thread.length) {
        return '<div class="lux-empty-state">No conversation history has been recorded for this request yet.</div>';
    }
    return `<div class="lux-thread">${
        thread.map(entry => {
            const entryType = entry.kind === 'status'
                ? 'status'
                : entry.authorRole === 'student'
                    ? 'student'
                    : 'staff';
            const typeLabel = entry.kind === 'status' ? 'Status update' : entry.authorRole || 'message';
            return `
                <div class="lux-thread-entry is-${entryType}">
                    <div class="lux-thread-head">
                        <div>
                            <div class="lux-thread-author">${escapeChancelleryHtml(entry.authorName || 'System')}</div>
                            <div class="lux-thread-meta">${escapeChancelleryHtml(typeLabel)}</div>
                        </div>
                        <div class="lux-thread-time">${escapeChancelleryHtml(formatChancelleryDate(entry.createdAt, true))}</div>
                    </div>
                    <div class="lux-thread-message">${escapeChancelleryHtml(entry.message || '')}</div>
                    ${entry.status ? `<div class="lux-meta" style="margin-top:8px;"><strong>Workflow state:</strong> ${escapeChancelleryHtml(entry.status)}</div>` : ''}
                </div>
            `;
        }).join('')
    }</div>`;
}

function renderChancelleryRequestList(requests, selectedCaseId) {
    if (!requests.length) {
        return '<div class="lux-empty-state" style="min-height:180px;">No requests match this view yet.</div>';
    }
    return `<div class="lux-queue-list">${
        requests.map(request => {
            const kindMeta = CHANCELLERY_REQUEST_KIND_META[request.requestKind] || CHANCELLERY_REQUEST_KIND_META.legacy;
            const selected = request.id === selectedCaseId;
            return `
                <button type="button" data-chancellery-select-case="${escapeChancelleryHtml(request.id)}" class="lux-queue-item${selected ? ' is-selected' : ''}">
                    <div class="lux-queue-head">
                        <div style="display:grid; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <span class="lux-overline" style="color:var(--lux-text);">${escapeChancelleryHtml(request.id)}</span>
                                <span class="lux-pill" style="${getChancelleryKindPillStyle(kindMeta)}">
                                    <i class="${kindMeta.icon}"></i> ${escapeChancelleryHtml(kindMeta.label)}
                                </span>
                            </div>
                            <div style="font-size:18px; font-weight:800; color:var(--lux-text);">${escapeChancelleryHtml(request.subjectName)}</div>
                        </div>
                        ${getChancelleryStatusPill(request.status)}
                    </div>
                    <div class="lux-inline-meta">
                        <span>${escapeChancelleryHtml(request.groupName || request.groupId || 'No group selected')}</span>
                        <span>${escapeChancelleryHtml(formatChancelleryDate(request.createdAt))}</span>
                    </div>
                    <div class="lux-meta">${escapeChancelleryHtml(getChancelleryLatestPreview(request).slice(0, 170))}</div>
                </button>
            `;
        }).join('')
    }</div>`;
}

function renderChancelleryStudentAppealsPanel(requests, selectedRequest) {
    const subjects = getStudentGradedSubjectsForChancellery();
    return `
        <div class="lux-layout-split">
            <div class="lux-stack">
                <div class="lux-card">
                    <div class="lux-card-body">
                        <div class="lux-card-head">
                            <div>
                                <div class="lux-page-kicker"><i class="fas fa-file-circle-plus"></i> New Appeal</div>
                                <div class="lux-card-title">Submit a request</div>
                                <div class="lux-card-copy">Choose a graded subject, select the request type, and explain what should be reviewed.</div>
                            </div>
                        </div>
                        <div class="lux-field-grid">
                            <div class="lux-field">
                                <label for="chancellery-subject-select">Subject</label>
                                <select id="chancellery-subject-select" class="lux-control">
                                    <option value="">Select a graded subject</option>
                                    ${subjects.map(subject => `<option value="${escapeChancelleryHtml(`${subject.subjectId}::${subject.groupId}`)}">${escapeChancelleryHtml(subject.subjectName)} Â· ${escapeChancelleryHtml(subject.groupName)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="lux-field">
                                <label for="chancellery-request-kind">Request Type</label>
                                <select id="chancellery-request-kind" class="lux-control">
                                    <option value="grade-appeal">Grade Appeal</option>
                                    <option value="retake-request">Retake Request</option>
                                </select>
                            </div>
                            <div class="lux-field">
                                <label for="chancellery-request-message">Reason</label>
                                <textarea id="chancellery-request-message" class="lux-control" rows="6" placeholder="Explain the evaluation issue or the reason for the retake request..."></textarea>
                            </div>
                        </div>
                        <div class="lux-card-actions" style="margin-top:16px;">
                            <button type="button" class="kiu-btn-blue" data-chancellery-action="submit-request" style="width:100%;">
                                <i class="fas fa-paper-plane"></i> Send Request
                            </button>
                        </div>
                        <div class="lux-meta" style="margin-top:12px;">Requests are delivered to administration and the assigned professor or TA for that subject. Grades are not changed automatically from this page.</div>
                    </div>
                </div>
                <div class="lux-card">
                    <div class="lux-card-body">
                        <div class="lux-actions-between">
                            <div>
                                <div class="lux-card-title">My Cases</div>
                                <div class="lux-card-copy">Track status, staff replies, and the latest note for each request.</div>
                            </div>
                            <span class="lux-pill">${requests.length} case${requests.length === 1 ? '' : 's'}</span>
                        </div>
                        <div style="margin-top:16px;">${renderChancelleryRequestList(requests, selectedRequest?.id || '')}</div>
                    </div>
                </div>
            </div>
            <div class="lux-card">
                <div class="lux-card-body">
                    ${selectedRequest ? `
                        <div class="lux-card-head">
                            <div>
                                <div class="lux-page-kicker"><i class="fas fa-timeline"></i> Active Case</div>
                                <div class="lux-card-title">${escapeChancelleryHtml(selectedRequest.subjectName)}</div>
                                <div class="lux-inline-meta">
                                    <span>${escapeChancelleryHtml(selectedRequest.id)}</span>
                                    <span>${escapeChancelleryHtml(deriveChancelleryTypeLabel(selectedRequest.requestKind))}</span>
                                    <span>${escapeChancelleryHtml(selectedRequest.groupName || selectedRequest.groupId || 'No group')}</span>
                                </div>
                            </div>
                            ${getChancelleryStatusPill(selectedRequest.status)}
                        </div>
                        <div class="lux-subcards" style="margin-bottom:18px;">
                            <div class="lux-subcard">
                                <div class="lux-overline">Recipients</div>
                                <div class="lux-meta">Administration${selectedRequest.recipientContext?.professorName ? `<br>${escapeChancelleryHtml(selectedRequest.recipientContext.professorName)}` : ''}${selectedRequest.recipientContext?.taName ? `<br>${escapeChancelleryHtml(selectedRequest.recipientContext.taName)}` : ''}</div>
                            </div>
                            <div class="lux-subcard">
                                <div class="lux-overline">Faculty</div>
                                <div class="lux-meta">${escapeChancelleryHtml(typeof getFacultyLabel === 'function' ? getFacultyLabel(selectedRequest.faculty) : selectedRequest.faculty)}</div>
                            </div>
                            <div class="lux-subcard">
                                <div class="lux-overline">Submitted</div>
                                <div class="lux-meta">${escapeChancelleryHtml(formatChancelleryDate(selectedRequest.createdAt, true))}</div>
                            </div>
                        </div>
                        <div class="lux-card-title" style="font-size:16px; margin-bottom:10px;">Conversation & Workflow</div>
                        ${renderChancelleryThread(selectedRequest)}
                    ` : `
                        <div class="lux-empty-state">Select one of your requests to open the full history, recipients, and status timeline.</div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function renderChancelleryStudentFinancePanel() {
    const currentUser = getCurrentUser();
    const tuitionBalances = KIU_STATE?.tuitionBalances || {};
    const balance = Number(tuitionBalances[currentUser?.id] || tuitionBalances.student || 0);
    const statusLabel = balance > 0 ? 'Outstanding balance' : 'All fees are paid';
    const tone = balance > 0 ? 'warning' : 'success';
    return `
        <div class="lux-card">
            <div class="lux-card-body">
                <div class="lux-card-head">
                    <div>
                        <div class="lux-page-kicker"><i class="fas fa-wallet"></i> Financial Summary</div>
                        <div class="lux-card-title">Bursar snapshot</div>
                        <div class="lux-card-copy">Read-only balance information while appeal and retake requests stay in the main workspace.</div>
                    </div>
                    <span class="lux-status-pill is-${tone}">${escapeChancelleryHtml(statusLabel)}</span>
                </div>
                <div class="lux-subcards">
                    <div class="lux-subcard">
                        <div class="lux-overline">Current Balance</div>
                        <div id="finance-current-balance" class="lux-metric">${balance.toLocaleString()} GEL</div>
                        <div class="lux-meta">${escapeChancelleryHtml(statusLabel)}</div>
                    </div>
                    <div class="lux-subcard">
                        <div class="lux-overline">Portal Note</div>
                        <div class="lux-meta">This page is currently focused on exam appeals and retake requests. Tuition payments and detailed statements stay read-only here.</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderChancelleryStaffWorkspace(requests) {
    const uiState = ensureChancelleryUiState();
    const isReadOnly = getEffectiveUserRole() === USER_ROLES.STUDENT_SERVICE;
    const statusFilter = normalizeChancelleryKey(uiState.filters.status || 'all');
    const typeFilter = normalizeChancelleryKey(uiState.filters.type || 'all');
    const subjectFilter = normalizeChancelleryKey(uiState.filters.subject || 'all');
    const filteredRequests = requests.filter(request => {
        if (statusFilter !== 'all' && normalizeChancelleryKey(request.status) !== statusFilter) return false;
        if (typeFilter !== 'all' && normalizeChancelleryKey(request.requestKind) !== typeFilter) return false;
        if (subjectFilter !== 'all' && normalizeChancelleryKey(request.subjectId) !== subjectFilter) return false;
        return true;
    });
    const selectedFilteredRequest = ensureSelectedChancelleryCase(filteredRequests);
    const subjectOptions = [...new Map(requests.map(request => [request.subjectId, request])).values()];
    const roleLabel = getEffectiveUserRole() === USER_ROLES.ADMIN
        ? 'Administration Inbox'
        : isReadOnly
            ? 'Student Service Read-Only Cases'
            : 'Course Staff Inbox';
    const openCount = requests.filter(request => !['Resolved', 'Rejected'].includes(request.status)).length;
    const resolvedCount = requests.filter(request => request.status === 'Resolved').length;
    const waitingCount = requests.filter(request => ['Waiting for Staff', 'Waiting for Student'].includes(request.status)).length;
    return `
        <div class="lux-layout-split">
            <div class="lux-stack">
                <div class="lux-card">
                    <div class="lux-card-body">
                        <div class="lux-card-head">
                            <div>
                                <div class="lux-page-kicker"><i class="fas fa-inbox"></i> ${escapeChancelleryHtml(roleLabel)}</div>
                                <div class="lux-card-title">Workflow filters</div>
                                <div class="lux-card-copy">${isReadOnly ? 'Use this case view to verify office workflow status before replying in Student Service.' : 'Review appeals, answer students, and keep the workflow status current.'}</div>
                            </div>
                        </div>
                        <div class="lux-stat-grid" style="margin-bottom:16px;">
                            <div class="lux-stat-card">
                                <div class="lux-stat-label">Open</div>
                                <div class="lux-stat-value">${openCount}</div>
                            </div>
                            <div class="lux-stat-card">
                                <div class="lux-stat-label">Resolved</div>
                                <div class="lux-stat-value">${resolvedCount}</div>
                            </div>
                            <div class="lux-stat-card">
                                <div class="lux-stat-label">Waiting</div>
                                <div class="lux-stat-value">${waitingCount}</div>
                            </div>
                        </div>
                        <div class="lux-field-grid">
                            <div class="lux-field">
                                <label>Status</label>
                                <select data-chancellery-filter="status" class="lux-control">
                                    <option value="all"${statusFilter === 'all' ? ' selected' : ''}>All statuses</option>
                                    ${CHANCELLERY_STATUS_FLOW.map(status => `<option value="${escapeChancelleryHtml(normalizeChancelleryKey(status))}"${statusFilter === normalizeChancelleryKey(status) ? ' selected' : ''}>${escapeChancelleryHtml(status)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="lux-field">
                                <label>Request Type</label>
                                <select data-chancellery-filter="type" class="lux-control">
                                    <option value="all"${typeFilter === 'all' ? ' selected' : ''}>All types</option>
                                    <option value="grade-appeal"${typeFilter === 'grade-appeal' ? ' selected' : ''}>Grade Appeal</option>
                                    <option value="retake-request"${typeFilter === 'retake-request' ? ' selected' : ''}>Retake Request</option>
                                    <option value="legacy"${typeFilter === 'legacy' ? ' selected' : ''}>Legacy Request</option>
                                </select>
                            </div>
                            <div class="lux-field">
                                <label>Subject</label>
                                <select data-chancellery-filter="subject" class="lux-control">
                                    <option value="all"${subjectFilter === 'all' ? ' selected' : ''}>All subjects</option>
                                    ${subjectOptions.map(request => `<option value="${escapeChancelleryHtml(normalizeChancelleryKey(request.subjectId))}"${subjectFilter === normalizeChancelleryKey(request.subjectId) ? ' selected' : ''}>${escapeChancelleryHtml(request.subjectName)}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="lux-card">
                    <div class="lux-card-body">
                        <div class="lux-actions-between">
                            <div>
                                <div class="lux-card-title">Request Queue</div>
                                <div class="lux-card-copy">${isReadOnly ? 'Use this read-only queue for student-support context.' : 'Only subjects in your staff scope appear here.'}</div>
                            </div>
                            <span class="lux-pill">${filteredRequests.length} item${filteredRequests.length === 1 ? '' : 's'}</span>
                        </div>
                        <div style="margin-top:16px;">${renderChancelleryRequestList(filteredRequests, selectedFilteredRequest?.id || '')}</div>
                    </div>
                </div>
            </div>
            <div class="lux-card">
                <div class="lux-card-body">
                    ${selectedFilteredRequest ? `
                        <div class="lux-card-head">
                            <div>
                                <div class="lux-page-kicker"><i class="fas fa-scale-balanced"></i> Selected Request</div>
                                <div class="lux-card-title">${escapeChancelleryHtml(selectedFilteredRequest.subjectName)}</div>
                                <div class="lux-inline-meta">
                                    <span>${escapeChancelleryHtml(selectedFilteredRequest.id)}</span>
                                    <span>${escapeChancelleryHtml(selectedFilteredRequest.studentName)}</span>
                                    <span>${escapeChancelleryHtml(deriveChancelleryTypeLabel(selectedFilteredRequest.requestKind))}</span>
                                </div>
                            </div>
                            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                                ${getChancelleryStatusPill(selectedFilteredRequest.status)}
                                ${isReadOnly ? `
                                    <span class="lux-pill"><i class="fas fa-eye"></i> View only</span>
                                ` : `
                                    <select data-chancellery-status-target="${escapeChancelleryHtml(selectedFilteredRequest.id)}" class="lux-control" style="min-width:220px;">
                                        ${CHANCELLERY_STATUS_FLOW.map(status => `<option value="${escapeChancelleryHtml(status)}"${selectedFilteredRequest.status === status ? ' selected' : ''}>${escapeChancelleryHtml(status)}</option>`).join('')}
                                    </select>
                                `}
                            </div>
                        </div>
                        <div class="lux-subcards" style="margin-bottom:18px;">
                            <div class="lux-subcard">
                                <div class="lux-overline">Recipients</div>
                                <div class="lux-meta">Administration${selectedFilteredRequest.recipientContext?.professorName ? `<br>${escapeChancelleryHtml(selectedFilteredRequest.recipientContext.professorName)}` : ''}${selectedFilteredRequest.recipientContext?.taName ? `<br>${escapeChancelleryHtml(selectedFilteredRequest.recipientContext.taName)}` : ''}</div>
                            </div>
                            <div class="lux-subcard">
                                <div class="lux-overline">Faculty</div>
                                <div class="lux-meta">${escapeChancelleryHtml(typeof getFacultyLabel === 'function' ? getFacultyLabel(selectedFilteredRequest.faculty) : selectedFilteredRequest.faculty)}</div>
                            </div>
                            <div class="lux-subcard">
                                <div class="lux-overline">Latest Update</div>
                                <div class="lux-meta">${escapeChancelleryHtml(formatChancelleryDate(selectedFilteredRequest.updatedAt, true))}</div>
                            </div>
                        </div>
                        <div class="lux-card-title" style="font-size:16px; margin-bottom:10px;">Conversation & Workflow</div>
                        ${renderChancelleryThread(selectedFilteredRequest)}
                        <div style="margin-top:18px;">
                            ${isReadOnly ? `
                                <div class="lux-subcard">
                                    <div class="lux-overline">Operating boundary</div>
                                    <div class="lux-meta">Use this page to confirm the official case status, then continue the student conversation back in Student Service. Appeal status changes and office replies stay in the academic workflow.</div>
                                </div>
                            ` : `
                                <div class="lux-field-grid">
                                    <div class="lux-field">
                                        <label for="chancellery-staff-reply">Reply to Student</label>
                                        <textarea id="chancellery-staff-reply" class="lux-control" rows="5" placeholder="Write a clear update for the student..."></textarea>
                                    </div>
                                </div>
                                <div class="lux-card-actions" style="margin-top:14px; justify-content:flex-end;">
                                    <button type="button" class="kiu-btn-outline" data-chancellery-action="mark-resolved" data-request-id="${escapeChancelleryHtml(selectedFilteredRequest.id)}">
                                        <i class="fas fa-circle-check"></i> Mark Resolved
                                    </button>
                                    <button type="button" class="kiu-btn-blue" data-chancellery-action="submit-staff-reply">
                                        <i class="fas fa-reply"></i> Send Reply
                                    </button>
                                </div>
                            `}
                        </div>
                    ` : `
                        <div class="lux-empty-state">Choose a request from the inbox to review the full thread, recipients, and status actions.</div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function ensureChancelleryShell(root) {
    if (!root) return null;
    if (!root.querySelector('[data-chancellery-shell="1"]')) {
        root.innerHTML = `
            <div class="lux-page-shell" data-chancellery-shell="1">
                <div id="chancellery-hero-region"></div>
                <div id="chancellery-content-region"></div>
            </div>
        `;
    }
    return {
        hero: root.querySelector('#chancellery-hero-region'),
        content: root.querySelector('#chancellery-content-region')
    };
}

function renderChancelleryHero({ isStudent, uiState, headingTitle, headingCopy, heroStatusLabel, heroRows }) {
    return `
        <div class="page-hero lux-chancellery-hero">
            <div class="lux-chancellery-hero-copy">
                <div class="lux-page-kicker"><i class="fas fa-scale-balanced"></i> Academic workflow</div>
                <div class="page-hero-title">${headingTitle}</div>
                <div class="page-hero-copy">${headingCopy}</div>
                <div class="page-hero-meta">
                    <span class="page-hero-badge"><i class="fas fa-scale-balanced"></i> Grade appeals</span>
                    <span class="page-hero-badge"><i class="fas fa-rotate-right"></i> Retake requests</span>
                    <span class="page-hero-badge"><i class="fas fa-comments"></i> Shared workflow thread</span>
                </div>
                ${isStudent ? `
                    <div class="lux-card-actions lux-chancellery-hero-actions">
                        <button type="button" id="chan-tab-appeals" class="kiu-btn-outline ${uiState.tab !== 'finance' ? 'active' : ''}" data-chancellery-tab="appeals">
                            <i class="fas fa-file-circle-question"></i> Appeals & Retakes
                        </button>
                        <button type="button" id="chan-tab-finance" class="kiu-btn-outline ${uiState.tab === 'finance' ? 'active' : ''}" data-chancellery-tab="finance">
                            <i class="fas fa-wallet"></i> Financial Summary
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="lux-chancellery-hero-focus">
                <div class="lux-card lux-chancellery-focus-card">
                    <div class="lux-card-head">
                        <div>
                    <div class="lux-page-kicker"><i class="fas fa-bolt"></i> Live signal</div>
                            <div class="lux-card-title">${isStudent ? 'Track your cases at a glance' : 'See the current case load'}</div>
                            <div class="lux-card-copy">${isStudent ? 'Appeals, finance state, and the latest action stay visible in one calm panel.' : 'Open requests, waiting items, and resolved cases stay visible in one calm panel.'}</div>
                        </div>
                        ${getChancelleryStatusPill(heroStatusLabel)}
                    </div>
                    <div class="lux-chancellery-focus-grid">
                        ${heroRows.map(row => `
                            <div class="lux-chancellery-focus-row">
                                <div class="lux-overline">${escapeChancelleryHtml(row.label)}</div>
                                <div class="lux-chancellery-focus-value">${escapeChancelleryHtml(row.value)}</div>
                                <div class="lux-meta">${escapeChancelleryHtml(row.detail)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderChancelleryPage() {
    const root = document.getElementById('page-chancellery');
    if (!root) return;
    const shell = ensureChancelleryShell(root);
    if (!shell?.hero || !shell?.content) return;
    bindChancelleryDelegates(root);
    const uiState = ensureChancelleryUiState();
    const role = getEffectiveUserRole();
    const requests = getVisibleChancelleryRequests();
    const selectedRequest = ensureSelectedChancelleryCase(requests);
    const isStudent = role === USER_ROLES.STUDENT;
    const headingTitle = isStudent ? 'Appeals & Retakes' : role === USER_ROLES.STUDENT_SERVICE ? 'Student Support Cases' : 'Appeals Inbox';
    const headingCopy = isStudent
        ? 'Submit grade appeals and retake requests for graded subjects, then track replies from administration and course staff in one place.'
        : role === USER_ROLES.STUDENT_SERVICE
            ? 'Review appeal and document-case context in read-only mode so Student Service can support students without editing the official workflow.'
            : 'Review student grade appeals and retake requests, reply in thread, and keep the workflow status updated without changing grades automatically.';
    const openCount = requests.filter(request => !['Resolved', 'Rejected'].includes(request.status)).length;
    const waitingCount = requests.filter(request => ['Waiting for Staff', 'Waiting for Student'].includes(request.status)).length;
    const resolvedCount = requests.filter(request => request.status === 'Resolved').length;
    const userRequests = isStudent
        ? requests.filter(request => String(request.studentId || '') === String(getCurrentUserId() || ''))
        : [];
    const studentOpenCount = isStudent ? userRequests.filter(request => !['Resolved', 'Rejected'].includes(request.status)).length : 0;
    const studentWaitingCount = isStudent ? userRequests.filter(request => ['Waiting for Staff', 'Waiting for Student'].includes(request.status)).length : 0;
    const studentResolvedCount = isStudent ? userRequests.filter(request => request.status === 'Resolved').length : 0;
    const studentBalance = isStudent
        ? Number(KIU_STATE?.tuitionBalances?.[getCurrentUserId()] || KIU_STATE?.tuitionBalances?.student || 0)
        : 0;
    const heroStatusLabel = isStudent
        ? (studentWaitingCount > 0 ? 'Waiting for Staff' : (studentOpenCount > 0 ? 'Submitted' : 'Resolved'))
        : (waitingCount > 0 ? 'Waiting for Staff' : (openCount ? 'Under Review' : 'Resolved'));
    const heroRows = isStudent
        ? [
            { label: 'Open cases', value: String(studentOpenCount), detail: 'Your own active appeals and retake requests.' },
            { label: 'Waiting on staff', value: String(studentWaitingCount), detail: 'Requests that are waiting for administrative or faculty action.' },
            { label: 'Resolved', value: String(studentResolvedCount), detail: 'Requests that reached a closed outcome.' },
            { label: 'Balance', value: studentBalance > 0 ? `${studentBalance.toLocaleString()} GEL` : 'Clear', detail: studentBalance > 0 ? 'Financial review is still required for some portal actions.' : 'No balance is blocking your academic workflow.' }
        ]
        : [
            { label: 'Visible cases', value: String(requests.length), detail: 'Requests available in the current scope.' },
            { label: 'Waiting', value: String(waitingCount), detail: 'Cases awaiting the next staff or student step.' },
            { label: 'Resolved', value: String(resolvedCount), detail: 'Requests already completed.' },
            { label: 'Open', value: String(openCount), detail: 'Cases still in progress.' }
        ];

    let contentMarkup = '';
    if (isStudent && uiState.tab === 'finance') {
        contentMarkup = renderChancelleryStudentFinancePanel();
    } else if (isStudent) {
        contentMarkup = renderChancelleryStudentAppealsPanel(requests, selectedRequest);
    } else if ([USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.STUDENT_SERVICE].includes(role)) {
        contentMarkup = renderChancelleryStaffWorkspace(requests);
    } else {
        contentMarkup = '<div class="lux-card"><div class="lux-card-body"><div class="lux-empty-state">This workspace is unavailable for the current role.</div></div></div>';
    }

    shell.hero.innerHTML = localizeHtmlMarkup(renderChancelleryHero({
        isStudent,
        uiState,
        headingTitle,
        headingCopy,
        heroStatusLabel,
        heroRows
    }));
    shell.content.innerHTML = localizeHtmlMarkup(contentMarkup);

    if (isStudent && uiState.tab === 'finance') {
        renderFinancialLedger();
    }
    if (typeof queueEnglishLocalization === 'function') {
        queueEnglishLocalization(shell.hero);
        queueEnglishLocalization(shell.content);
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
    
    const statusBox = balanceEl.nextElementSibling;
    if (balance <= 0) {
        statusBox.innerHTML = '<i class="fas fa-check-circle"></i> All fees are paid';
        statusBox.style.color = 'var(--kiu-green)';
    } else {
        statusBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Outstanding balance';
        statusBox.style.color = 'var(--kiu-red)';
    }

    // Admin Grant Logic injection
    const grantContainer = document.getElementById('admin-grant-section');
    if (grantContainer) {
        grantContainer.style.display = currentUserRole === 'admin' ? 'block' : 'none';
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

