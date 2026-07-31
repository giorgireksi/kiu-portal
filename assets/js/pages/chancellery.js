/* Chancellery page logic extracted from registration.js for the standalone chancellery route. */

const CHANCELLERY_REQUEST_KIND_META = {
    'grade-appeal': { label: 'Appeal', tone: 'primary', icon: 'fas fa-scale-balanced' },
    'retake-request': { label: 'Retake Request', tone: 'secondary', icon: 'fas fa-rotate-right' },
    legacy: { label: 'Legacy Request', tone: 'muted', icon: 'fas fa-folder-open' }
};

const CHANCELLERY_STATUS_FLOW = ['Submitted', 'Under Review', 'Resolved', 'Rejected'];
const CHANCELLERY_LEGACY_STATUS_MAP = {
    'waiting-for-staff': 'Under Review',
    'waiting-for-student': 'Under Review'
};

let chancelleryUiState = {
    tab: 'appeals',
    selectedCaseId: '',
    filters: {
        search: ''
    },
    layoutFilters: {},
    dateFrom: '',
    dateTo: '',
    routingFilter: 'all'
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

function resolveChancelleryCaseStudent(request = {}) {
    const id = String(request.studentId || '').trim();
    if (!id) return { id: '', name: request.studentName || 'Student' };
    const domain = typeof getDomain === 'function' ? getDomain() : null;
    const fromDomain = domain?.usersById?.[id];
    if (fromDomain) return fromDomain;
    if (typeof getAllStudents === 'function') {
        const found = getAllStudents('all').find((student) => String(student?.id || '') === id);
        if (found) return found;
    }
    return { id, name: request.studentName || 'Student' };
}

function resolveChancelleryCaseStudentName(student, request = {}) {
    return String(student?.nameEn || student?.name || request.studentName || 'Student').trim() || 'Student';
}

function resolveChancelleryCaseStudentPhoto(student) {
    const raw = student?.photo || student?.image || '';
    if (typeof scrubFakeMedia === 'function') return scrubFakeMedia(raw) || '';
    return String(raw || '').trim();
}

function resolveChancelleryCaseStudentCourseChips(student) {
    const chips = [];
    let course = Number(student?.course);
    if (!Number.isFinite(course) || course <= 0) {
        const semesterHint = Number(student?.semester);
        if (Number.isFinite(semesterHint) && semesterHint > 0) course = Math.ceil(semesterHint / 2);
    }
    if (Number.isFinite(course) && course > 0) chips.push(`Course ${course}`);
    let semester = typeof getCurrentStudentSemesterNumber === 'function'
        ? Number(getCurrentStudentSemesterNumber(student))
        : Number(student?.semester);
    if (Number.isFinite(semester) && semester > 0) chips.push(`Semester ${semester}`);
    return chips;
}

function renderChancelleryCaseAvatar(name, photoUrl) {
    if (photoUrl) {
        return `<div class="chancellery-case-avatar"><img alt="" src="${escapeChancelleryHtml(photoUrl)}"></div>`;
    }
    const initials = typeof getInitialsAvatar === 'function' ? getInitialsAvatar(name) : 'KIU';
    return `<div class="chancellery-case-avatar is-fallback" aria-hidden="true">${escapeChancelleryHtml(initials)}</div>`;
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
            filters: { search: '' },
            layoutFilters: {},
            dateFrom: '',
            dateTo: '',
            routingFilter: 'all'
        };
    }
    chancelleryUiState.filters = chancelleryUiState.filters || { search: '' };
    if (typeof chancelleryUiState.filters.search !== 'string') chancelleryUiState.filters.search = '';
    // Drop legacy hardcoded filter keys once layout-driven filters own matching.
    delete chancelleryUiState.filters.status;
    delete chancelleryUiState.filters.type;
    delete chancelleryUiState.filters.subject;
    delete chancelleryUiState.showForwardPanel;
    if (!chancelleryUiState.layoutFilters || typeof chancelleryUiState.layoutFilters !== 'object') {
        chancelleryUiState.layoutFilters = {};
    }
    if (typeof chancelleryUiState.dateFrom !== 'string') chancelleryUiState.dateFrom = '';
    if (typeof chancelleryUiState.dateTo !== 'string') chancelleryUiState.dateTo = '';
    if (!['all', 'needs_forward', 'forwarded'].includes(chancelleryUiState.routingFilter)) {
        chancelleryUiState.routingFilter = 'all';
    }
    return chancelleryUiState;
}

function filterChancelleryRequests(requests, filters = {}, role = null) {
    const effectiveRole = role || (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : USER_ROLES.STUDENT);
    const uiState = ensureChancelleryUiState();
    const search = String(filters.search ?? uiState.filters.search ?? '').trim().toLowerCase();
    const dateFrom = filters.dateFrom ?? uiState.dateFrom ?? '';
    const dateTo = filters.dateTo ?? uiState.dateTo ?? '';
    const routingFilter = filters.routingFilter ?? uiState.routingFilter ?? 'all';

    return requests.filter((request) => {
        if (effectiveRole === USER_ROLES.ADMIN && routingFilter === 'needs_forward') {
            if (getChancelleryRoutingStage(request) !== 'admin_review') return false;
        }
        if (effectiveRole === USER_ROLES.ADMIN && routingFilter === 'forwarded') {
            if (getChancelleryRoutingStage(request) !== 'forwarded') return false;
        }
        if (typeof matchesChancelleryLayoutDateRange === 'function'
            && !matchesChancelleryLayoutDateRange(request, dateFrom, dateTo)) {
            return false;
        }
        if (!search) return true;
        const haystack = [
            request.id,
            request.subjectName,
            request.studentName,
            request.message,
            request.latestPreview,
            request.status,
            request.requestKind,
            request.type,
            request.examOption,
            request.examOptionLabel
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
    const key = normalizeChancelleryKey(current);
    if (CHANCELLERY_LEGACY_STATUS_MAP[key]) return CHANCELLERY_LEGACY_STATUS_MAP[key];
    const match = CHANCELLERY_STATUS_FLOW.find(status => normalizeChancelleryKey(status) === key);
    if (match) return match;
    if (/approved|accept/i.test(current)) return 'Resolved';
    if (/review/i.test(current)) return 'Under Review';
    if (/reject/i.test(current)) return 'Rejected';
    return current || 'Submitted';
}

function isChancelleryCaseTerminal(request = {}) {
    const status = normalizeChancelleryStatus(request.status);
    return status === 'Resolved' || status === 'Rejected';
}

function canForwardChancelleryCase(request = {}) {
    return !isChancelleryCaseTerminal(request);
}

function getChancelleryStatusStepIndex(status) {
    const index = CHANCELLERY_STATUS_FLOW.findIndex(item => item === normalizeChancelleryStatus(status));
    return index >= 0 ? index : 0;
}

function normalizeChancelleryRequestKind(value, fallbackType = '') {
    const raw = String(value || fallbackType || '').trim();
    const key = normalizeChancelleryKey(raw);
    if (!key) return 'legacy';
    if (key === 'retake-request' || (key.includes('retake') && !key.includes('appeal'))) return 'retake-request';
    if (key === 'grade-appeal' || key.includes('appeal')) return 'grade-appeal';
    // Preserve shared-catalog custom kinds (do not collapse to legacy).
    return key;
}

function humanizeChancelleryRequestKind(kind = '') {
    const key = String(kind || '').trim();
    if (!key || key === 'legacy') return 'Request';
    return key.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
    if (kind === 'grade-appeal') return 'Appeal';
    return CHANCELLERY_REQUEST_KIND_META[kind]?.label || fallback || humanizeChancelleryRequestKind(kind);
}

function getChancelleryRoutingStage(request = {}) {
    const stage = String(request?.routingStage || '').trim();
    if (stage === 'admin_review' || stage === 'forwarded') return stage;
    // Legacy cases without routingStage stay visible to course staff.
    return 'forwarded';
}

function normalizeChancelleryForwardedTo(forwardedTo = null, routingStage = 'forwarded') {
    if (forwardedTo && typeof forwardedTo === 'object') {
        return {
            professor: Boolean(forwardedTo.professor),
            ta: Boolean(forwardedTo.ta)
        };
    }
    if (routingStage === 'forwarded') return { professor: true, ta: true };
    return { professor: false, ta: false };
}

function isChancelleryRequestNeedsForward(request = {}) {
    return getChancelleryRoutingStage(request) === 'admin_review';
}

function describeChancelleryForwardTargets(forwardedTo = {}) {
    const parts = [];
    if (forwardedTo.professor) parts.push('Professor');
    if (forwardedTo.ta) parts.push('TA');
    return parts.length ? parts.join(', ') : 'course staff';
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
    const routingStage = Object.prototype.hasOwnProperty.call(request, 'routingStage')
        ? (String(request.routingStage) === 'admin_review' ? 'admin_review' : 'forwarded')
        : 'forwarded';
    const forwardedTo = normalizeChancelleryForwardedTo(request.forwardedTo, routingStage);
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
        routingStage,
        forwardedTo,
        forwardedAt: request.forwardedAt ? normalizeChancelleryDate(request.forwardedAt) : '',
        forwardedBy: String(request.forwardedBy || ''),
        decisionComment: String(request.decisionComment || '').trim(),
        decidedAt: request.decidedAt ? normalizeChancelleryDate(request.decidedAt) : '',
        decidedBy: String(request.decidedBy || ''),
        examOption: String(request.examOption || '').trim(),
        examOptionLabel: String(request.examOptionLabel || '').trim(),
        documentHtmlSnapshot: String(request.documentHtmlSnapshot || '').trim(),
        fieldValues: request.fieldValues && typeof request.fieldValues === 'object' ? { ...request.fieldValues } : {},
        answers: request.answers && typeof request.answers === 'object' ? { ...request.answers } : {},
        documentElementsSnapshot: Array.isArray(request.documentElementsSnapshot)
            ? request.documentElementsSnapshot.map((item) => ({ ...item }))
            : [],
        thread,
        steps,
        currentStep: Math.max(0, Math.min(steps.length - 1, currentStep)),
        latestPreview: String(request.decisionComment || '').trim()
            || latestThreadEntry?.message
            || initialMessage
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
    const seen = new Set();
    return schedule.map(item => {
        if (typeof item?.courseId === 'object' || typeof item?.groupId === 'object') return null;
        const subjectId = String(item?.courseId || '').trim();
        const groupId = String(item?.groupId || '').trim();
        if (!subjectId || !groupId) return null;
        const dedupeKey = `${subjectId}::${groupId}`;
        if (seen.has(dedupeKey)) return null;
        const subject = domain.subjectsById?.[subjectId] || (KIU_STATE.curriculum || []).find(entry => entry.id === subjectId) || null;
        const group = findChancelleryGroup(subjectId, groupId);
        const enrolledStudents = typeof getEnrolledStudentsForGroup === 'function'
            ? getEnrolledStudentsForGroup(subjectId, groupId)
            : [];
        const rosterKey = typeof resolveGradebookRosterKey === 'function'
            ? resolveGradebookRosterKey(subjectId, groupId, enrolledStudents)
            : '';
        const roster = KIU_STATE.studentGrades?.[rosterKey] || [];
        const record = roster.find(entry => String(entry.id || '') === String(currentUser.id));
        if (!record || !recordHasGradingData(record)) return null;
        seen.add(dedupeKey);
        return {
            subjectId,
            subjectName: subject?.name || item.courseName || subjectId,
            groupId,
            groupName: group?.name || item.groupName || groupId,
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
    const forwardedTo = normalizeChancelleryForwardedTo(request?.forwardedTo, getChancelleryRoutingStage(request));
    if (getChancelleryRoutingStage(request) !== 'forwarded') return false;
    if (role === USER_ROLES.PROFESSOR && !forwardedTo.professor) return false;
    if (role === USER_ROLES.TA && !forwardedTo.ta) return false;
    const currentUser = getCurrentUser();
    const scopeKeys = getCurrentStaffScopeKeys();
    const requestScopeKey = `${normalizeChancelleryKey(request.subjectId)}::${normalizeChancelleryKey(request.groupId)}`;
    if (scopeKeys.has(requestScopeKey)) return true;
    const recipientContext = request.recipientContext || {};
    if (role === USER_ROLES.PROFESSOR
        && String(recipientContext.professorId || '') === String(currentUser?.id || '')) return true;
    if (role === USER_ROLES.TA
        && String(recipientContext.taId || '') === String(currentUser?.id || '')) return true;
    const currentName = normalizeChancelleryKey(currentUser?.nameEn || currentUser?.name || '');
    if (role === USER_ROLES.PROFESSOR) {
        return normalizeChancelleryKey(recipientContext.professorName || '') === currentName;
    }
    return normalizeChancelleryKey(recipientContext.taName || '') === currentName;
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
    if (normalized === 'Resolved') return { label: 'Accepted', tone: 'success', icon: 'fas fa-circle-check' };
    if (normalized === 'Rejected') return { label: 'Rejected', tone: 'danger', icon: 'fas fa-octagon-xmark' };
    if (normalized === 'Under Review') return { label: normalized, tone: 'warning', icon: 'fas fa-magnifying-glass' };
    return { label: normalized || 'Pending', tone: 'muted', icon: 'fas fa-timeline' };
}

function getChancelleryHeroFocusChip(status) {
    const meta = getChancelleryStatusMeta(status);
    return `<span class="lux-focus-panel__chip lux-status-pill home-hover-chip lux-chancellery-status-pill lux-chancellery-case-status-pill is-${meta.tone}"><i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}</span>`;
}

function getChancelleryStatusPill(status, options = {}) {
    const meta = getChancelleryStatusMeta(status);
    const hoverChip = options.hoverChip !== false;
    const chipClass = hoverChip ? ' home-hover-chip' : '';
    return `<span class="lux-status-pill${chipClass} lux-chancellery-status-pill lux-chancellery-case-status-pill is-${meta.tone}"><i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}</span>`;
}

function getChancelleryKindPillClass(kindMeta) {
    const tone = kindMeta?.tone || 'muted';
    if (tone === 'primary') {
        return 'is-info';
    }
    if (tone === 'secondary') {
        return 'is-warning';
    }
    return 'is-muted';
}

function getChancelleryLatestPreview(request) {
    if (String(request?.decisionComment || '').trim()) return request.decisionComment;
    const submission = (request.thread || []).find((entry) => entry.kind === 'submission');
    if (submission?.message) return submission.message;
    if (request?.message) return request.message;
    const latest = (request.thread || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    return latest?.message || 'No details yet.';
}

function setChancellerySelectedCase(caseId) {
    const uiState = ensureChancelleryUiState();
    const nextId = String(caseId || '').trim();
    uiState.selectedCaseId = nextId;
    closeChancelleryForwardModal();
    if (nextId) openChancelleryCaseModal(nextId);
    else closeChancelleryCaseModal();
    if (!syncChancelleryWorkspaceRegion()) {
        renderChancelleryPage();
    }
}

function setChancelleryFilter(filterKey, value) {
    const uiState = ensureChancelleryUiState();
    if (filterKey === 'search') {
        uiState.filters.search = String(value || '');
    } else if (filterKey === 'dateFrom' || filterKey === 'dateTo') {
        uiState[filterKey] = String(value || '');
        uiState.selectedCaseId = '';
        closeChancelleryCaseModal();
    } else {
        uiState.layoutFilters[filterKey] = value || 'all';
        uiState.selectedCaseId = '';
        closeChancelleryCaseModal();
    }
    if (!syncChancelleryFilterRegions(filterKey)) {
        renderChancelleryPage();
    }
}

function setChancelleryRoutingFilter(nextFilter) {
    const uiState = ensureChancelleryUiState();
    const normalized = ['all', 'needs_forward', 'forwarded'].includes(nextFilter) ? nextFilter : 'all';
    uiState.routingFilter = normalized;
    uiState.selectedCaseId = '';
    closeChancelleryCaseModal();
    if (!syncChancelleryFilterRegions('routing')) {
        renderChancelleryPage();
    }
}

function switchChancelleryTab(tab) {
    const uiState = ensureChancelleryUiState();
    const nextTab = tab === 'finance' ? 'finance' : 'appeals';
    if (uiState.tab === nextTab) return;
    uiState.tab = nextTab;
    closeChancelleryCaseModal();
    if (!syncChancelleryTabRegions()) {
        renderChancelleryPage();
    }
}

function showChancelleryCompose() {
    ensureChancelleryUiState().selectedCaseId = '';
    closeChancelleryCaseModal();
    if (!syncChancelleryWorkspaceRegion()) {
        renderChancelleryPage();
    }
}

function bindChancelleryForwardModalDelegates() {
    if (document.documentElement.dataset.chancelleryForwardModalBound === '1') return;
    document.documentElement.dataset.chancelleryForwardModalBound = '1';
    document.addEventListener('click', (event) => {
        const overlay = document.getElementById('chancellery-forward-overlay');
        if (!overlay || !overlay.classList.contains('active')) return;

        if (event.target === overlay || event.target.id === 'chancellery-forward-overlay') {
            closeChancelleryForwardModal();
            return;
        }
        if (!overlay.contains(event.target)) return;

        const actionTrigger = event.target.closest('[data-chancellery-action]');
        if (!actionTrigger) return;
        event.preventDefault();
        const action = String(actionTrigger.getAttribute('data-chancellery-action') || '').trim();
        if (action === 'close-forward-panel') {
            closeChancelleryForwardModal();
            return;
        }
        if (action === 'confirm-forward-to-staff') {
            const requestId = String(actionTrigger.getAttribute('data-request-id') || '').trim();
            const toProfessor = Boolean(overlay.querySelector('[data-chancellery-forward-target="professor"]')?.checked);
            const toTa = Boolean(overlay.querySelector('[data-chancellery-forward-target="ta"]')?.checked);
            forwardChancelleryRequestToStaff(requestId, { professor: toProfessor, ta: toTa });
        }
    });
}

bindChancelleryForwardModalDelegates();

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
        if (action === 'confirm-case-decision') {
            const requestId = String(actionTrigger.getAttribute('data-request-id') || '').trim();
            const overlay = document.getElementById('chancellery-case-overlay') || document;
            const decision = String(overlay.querySelector('[name="chancellery-case-decision"]:checked')?.value || '').trim();
            const comment = String(overlay.querySelector('#chancellery-decision-comment')?.value || '').trim();
            decideChancelleryCase(requestId, decision, comment);
            return;
        }
        if (action === 'save-decision-comment') {
            const requestId = String(actionTrigger.getAttribute('data-request-id') || '').trim();
            const overlay = document.getElementById('chancellery-case-overlay') || document;
            const comment = String(overlay.querySelector('#chancellery-decision-comment-edit')?.value || '').trim();
            updateChancelleryDecisionComment(requestId, comment);
            return;
        }
        if (action === 'edit-document') {
            if (typeof openChancelleryDocumentEditor === 'function') openChancelleryDocumentEditor();
            return;
        }
        if (action === 'export-case-pdf' || action === 'export-case-docx') {
            const requestId = String(actionTrigger.getAttribute('data-request-id') || '').trim();
            const request = getChancelleryRequestById(requestId);
            if (!request) {
                alert('Case not found.');
                return;
            }
            const format = action === 'export-case-pdf' ? 'pdf' : 'docx';
            if (typeof exportChancelleryLetter !== 'function') {
                alert('Export is unavailable.');
                return;
            }
            const model = typeof buildChancelleryExportModelFromRequest === 'function'
                ? buildChancelleryExportModelFromRequest(request)
                : request;
            exportChancelleryLetter(format, model).catch((error) => {
                alert(error?.message || 'Export failed.');
            });
            return;
        }
        if (action === 'open-appeal-document') {
            const subjectKey = String(document.getElementById('chancellery-subject-select')?.value || '').trim();
            if (typeof openChancelleryAppealModal === 'function') openChancelleryAppealModal(subjectKey);
            return;
        }
        if (action === 'close-appeal-modal') {
            if (typeof closeChancelleryAppealModal === 'function') closeChancelleryAppealModal();
            return;
        }
        if (action === 'submit-appeal-document') {
            submitRequest();
            return;
        }
        if (action === 'close-case-modal') {
            closeChancelleryCaseModal();
            return;
        }
        if (action === 'remove-case') {
            removeChancelleryCase(String(actionTrigger.getAttribute('data-request-id') || ''));
            return;
        }
        if (action === 'open-forward-panel') {
            openChancelleryForwardModal(String(actionTrigger.getAttribute('data-request-id') || ''));
            return;
        }
        if (action === 'close-forward-panel') {
            closeChancelleryForwardModal();
            return;
        }
        if (action === 'confirm-forward-to-staff') {
            const requestId = String(actionTrigger.getAttribute('data-request-id') || '').trim();
            const overlay = document.getElementById('chancellery-forward-overlay');
            const rootEl = overlay || document.getElementById('page-chancellery') || document;
            const toProfessor = Boolean(rootEl.querySelector('[data-chancellery-forward-target="professor"]')?.checked);
            const toTa = Boolean(rootEl.querySelector('[data-chancellery-forward-target="ta"]')?.checked);
            forwardChancelleryRequestToStaff(requestId, { professor: toProfessor, ta: toTa });
            return;
        }
        if (action === 'set-routing-filter') {
            const next = String(actionTrigger.getAttribute('data-chancellery-routing-filter') || 'all').trim();
            setChancelleryRoutingFilter(next);
        }
    });
    root.addEventListener('input', function onChancelleryInput(event) {
        const filterTrigger = event.target.closest('[data-chancellery-filter]');
        if (filterTrigger && filterTrigger.getAttribute('data-chancellery-filter') === 'search') {
            setChancelleryFilter('search', filterTrigger.value);
            return;
        }
        const dateTrigger = event.target.closest('[data-chancellery-date-filter]');
        if (dateTrigger) {
            setChancelleryFilter(
                String(dateTrigger.getAttribute('data-chancellery-date-filter') || '').trim(),
                dateTrigger.value
            );
        }
    });
    root.addEventListener('change', function onChancelleryChange(event) {
        if (event.target?.id === 'chancellery-subject-select' && event.target.value) {
            if (typeof openChancelleryAppealModal === 'function') {
                openChancelleryAppealModal(String(event.target.value || '').trim());
            }
            return;
        }
        const dateTrigger = event.target.closest('[data-chancellery-date-filter]');
        if (dateTrigger) {
            setChancelleryFilter(
                String(dateTrigger.getAttribute('data-chancellery-date-filter') || '').trim(),
                dateTrigger.value
            );
            return;
        }
        const filterTrigger = event.target.closest('[data-chancellery-filter]');
        if (filterTrigger && filterTrigger.getAttribute('data-chancellery-filter') !== 'search') {
            setChancelleryFilter(
                String(filterTrigger.getAttribute('data-chancellery-filter') || '').trim(),
                filterTrigger.value
            );
            return;
        }
    });
    root.dataset.chancelleryDelegatesBound = '1';
}

function renderChancelleryRequests() {
    renderChancelleryPage();
}

function approveRequest(reqId) {
    decideChancelleryCase(reqId, 'accept', 'Accepted by administration.');
}

function submitRequest() {
    if (getEffectiveUserRole() !== USER_ROLES.STUDENT) return;
    const subjects = getStudentGradedSubjectsForChancellery();
    const formValues = typeof readChancelleryAppealFormValues === 'function'
        ? readChancelleryAppealFormValues()
        : { examOption: '', message: '', subjectKey: '', fieldValues: {}, answers: {}, documentHtmlSnapshot: '', documentElementsSnapshot: [], hasExamOptions: false };
    const subjectValue = String(formValues.subjectKey || document.getElementById('chancellery-subject-select')?.value || '').trim();
    const selectedSubject = subjects.find(item => `${item.subjectId}::${item.groupId}` === subjectValue);
    if (!selectedSubject) {
        alert('Choose a graded subject before sending your request.');
        return;
    }
    const message = String(formValues.message || '').trim();
    if (!message) {
        alert('Write the appeal description before sending.');
        return;
    }
    const examOption = String(formValues.examOption || '').trim();
    if (formValues.hasExamOptions && !examOption) {
        alert('Choose which exam you are appealing.');
        return;
    }
    const examOptionLabel = String(formValues.examOptionLabel || examOption).trim();
    const currentUser = getCurrentUser();
    const recipientContext = resolveChancelleryRecipientContext(selectedSubject.subjectId, selectedSubject.groupId);
    const now = new Date().toISOString();
    const submissionMessage = examOptionLabel
        ? `${examOptionLabel}\n\n${message}`
        : message;
    const newRequest = normalizeChancelleryRequest({
        id: `CHR-${Date.now()}`,
        requestKind: 'grade-appeal',
        type: 'Appeal',
        studentId: currentUser?.id || '',
        studentName: currentUser?.nameEn || currentUser?.name || 'Student',
        subjectId: selectedSubject.subjectId,
        subjectName: selectedSubject.subjectName,
        groupId: selectedSubject.groupId,
        groupName: selectedSubject.groupName,
        faculty: selectedSubject.faculty,
        message: submissionMessage,
        examOption,
        examOptionLabel,
        documentHtmlSnapshot: String(formValues.documentHtmlSnapshot || '').trim(),
        fieldValues: formValues.fieldValues && typeof formValues.fieldValues === 'object' ? formValues.fieldValues : {},
        answers: formValues.answers && typeof formValues.answers === 'object' ? formValues.answers : {},
        documentElementsSnapshot: Array.isArray(formValues.documentElementsSnapshot)
            ? formValues.documentElementsSnapshot
            : [],
        status: 'Submitted',
        createdAt: now,
        updatedAt: now,
        recipientContext,
        routingStage: 'admin_review',
        forwardedTo: { professor: false, ta: false },
        forwardedAt: '',
        forwardedBy: '',
        thread: [
            createChancelleryThreadEntry({
                kind: 'submission',
                authorRole: 'student',
                authorId: currentUser?.id || '',
                authorName: currentUser?.nameEn || currentUser?.name || 'Student',
                message: submissionMessage,
                createdAt: now
            })
        ]
    });
    KIU_STATE.chancelleryRequests = [newRequest, ...ensureChancelleryRequestsStore()];
    const uiState = ensureChancelleryUiState();
    uiState.selectedCaseId = newRequest.id;
    uiState.tab = 'appeals';
    if (typeof closeChancelleryAppealModal === 'function') closeChancelleryAppealModal();
    saveState();
    openChancelleryCaseModal(newRequest.id);
    if (!syncChancelleryMutationRegions()) {
        if (!syncChancelleryTabRegions()) {
            renderChancelleryPage();
        }
    }
    alert('Your appeal was sent to administration. Course staff will see it after admin forwards the case.');
}

function forwardChancelleryRequestToStaff(requestId, targets = {}) {
    if (getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const request = getChancelleryRequestById(requestId);
    if (!request) return;
    if (!canForwardChancelleryCase(request)) {
        alert('Forward is only available while the case is still under review.');
        return;
    }
    const ctx = request.recipientContext || {};
    const canProfessor = Boolean(ctx.professorId || ctx.professorName);
    const canTa = Boolean(ctx.taId || ctx.taName);
    const toProfessor = Boolean(targets.professor) && canProfessor;
    const toTa = Boolean(targets.ta) && canTa;
    if (!toProfessor && !toTa) {
        alert('Choose at least one available course staff member to forward to.');
        return;
    }
    const previous = normalizeChancelleryForwardedTo(request.forwardedTo, getChancelleryRoutingStage(request));
    const wasForwarded = getChancelleryRoutingStage(request) === 'forwarded'
        && (previous.professor || previous.ta);
    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    request.routingStage = 'forwarded';
    request.forwardedTo = { professor: toProfessor, ta: toTa };
    request.forwardedAt = now;
    request.forwardedBy = String(currentUser?.id || '');
    request.updatedAt = now;
    if (request.status === 'Submitted') {
        request.status = 'Under Review';
        request.currentStep = getChancelleryStatusStepIndex(request.status);
    }
    const targetLabel = describeChancelleryForwardTargets(request.forwardedTo);
    const message = wasForwarded
        ? `Admin updated forward to ${targetLabel}.`
        : `Admin forwarded to ${targetLabel}.`;
    request.thread.push(createChancelleryThreadEntry({
        kind: 'status',
        authorRole: 'admin',
        authorId: currentUser?.id || '',
        authorName: currentUser?.nameEn || currentUser?.name || 'Admin',
        message,
        createdAt: now,
        status: request.status
    }));
    request.latestPreview = getChancelleryLatestPreview(request);
    closeChancelleryForwardModal();
    saveState();
    if (!syncChancelleryMutationRegions()) {
        renderChancelleryPage();
    }
}

function decideChancelleryCase(requestId, decision, comment = '') {
    if (getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const request = getChancelleryRequestById(requestId);
    if (!request || isChancelleryCaseTerminal(request)) return;
    const nextStatus = decision === 'reject' ? 'Rejected' : (decision === 'accept' ? 'Resolved' : '');
    if (!nextStatus) {
        alert('Choose Accept or Reject.');
        return;
    }
    const decisionComment = String(comment || '').trim();
    if (!decisionComment) {
        alert(nextStatus === 'Rejected'
            ? 'Write a decision comment before rejecting.'
            : 'Write a short decision comment for the student.');
        return;
    }
    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    request.status = nextStatus;
    request.currentStep = getChancelleryStatusStepIndex(nextStatus);
    request.decisionComment = decisionComment;
    request.decidedAt = now;
    request.decidedBy = String(currentUser?.id || '');
    request.updatedAt = now;
    request.thread.push(createChancelleryThreadEntry({
        kind: 'status',
        authorRole: 'admin',
        authorId: currentUser?.id || '',
        authorName: currentUser?.nameEn || currentUser?.name || 'Admin',
        createdAt: now,
        message: nextStatus === 'Resolved'
            ? `Accepted: ${decisionComment}`
            : `Rejected: ${decisionComment}`,
        status: nextStatus
    }));
    request.latestPreview = decisionComment;
    saveState();
    if (!syncChancelleryMutationRegions()) {
        renderChancelleryPage();
    }
}

function normalizeChancelleryRemoveVerificationToken(value) {
    return String(value || '').trim().toUpperCase();
}

function runChancelleryRemoveVerification({
    step1Text = '',
    step2Text = '',
    promptText = '',
    expectedToken = ''
} = {}) {
    if (typeof runRegistrationRemoveVerification === 'function') {
        return runRegistrationRemoveVerification({
            step1Text,
            step2Text,
            promptText,
            expectedToken
        });
    }
    const normalizedExpected = normalizeChancelleryRemoveVerificationToken(expectedToken);
    if (!normalizedExpected) return false;
    if (typeof window.confirm !== 'function' || typeof window.prompt !== 'function') return false;
    if (!window.confirm(String(step1Text || 'Delete this chancellery case?'))) return false;
    if (!window.confirm(String(step2Text || 'This action cannot be undone.'))) return false;
    const typedValue = window.prompt(
        String(promptText || `Type ${normalizedExpected} to confirm removal.`),
        ''
    );
    if (typedValue == null) return false;
    if (normalizeChancelleryRemoveVerificationToken(typedValue) !== normalizedExpected) {
        if (typeof showToast === 'function') {
            showToast('Removal cancelled. Confirmation text did not match.');
        } else {
            alert('Removal cancelled. Confirmation text did not match.');
        }
        return false;
    }
    return true;
}

function buildChancelleryCaseRemoveVerification(request = {}) {
    const id = String(request.id || '').trim();
    const expectedToken = normalizeChancelleryRemoveVerificationToken(id);
    const student = resolveChancelleryCaseStudentName(resolveChancelleryCaseStudent(request), request);
    const subject = String(request.subjectName || 'case').trim() || 'case';
    return {
        step1Text: `Delete chancellery case "${subject}" for ${student} (${id})?`,
        step2Text: 'This permanently removes the petition and decision. This cannot be undone.',
        promptText: `Step 3 of 3: Type ${expectedToken} to confirm case deletion.`,
        expectedToken
    };
}

function removeChancelleryCase(requestId) {
    if (getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const id = String(requestId || '').trim();
    const request = getChancelleryRequestById(id);
    if (!request) return;
    if (!runChancelleryRemoveVerification(buildChancelleryCaseRemoveVerification(request))) return;
    KIU_STATE.chancelleryRequests = ensureChancelleryRequestsStore()
        .filter((item) => String(item.id || '') !== request.id);
    const uiState = ensureChancelleryUiState();
    if (String(uiState.selectedCaseId || '') === request.id) {
        uiState.selectedCaseId = '';
    }
    closeChancelleryCaseModal();
    saveState();
    if (!syncChancelleryMutationRegions()) {
        renderChancelleryPage();
    }
}

function updateChancelleryDecisionComment(requestId, comment = '') {
    if (getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const request = getChancelleryRequestById(requestId);
    if (!request || !isChancelleryCaseTerminal(request)) return;
    const decisionComment = String(comment || '').trim();
    if (!decisionComment) {
        alert('Decision comment cannot be empty.');
        return;
    }
    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    request.decisionComment = decisionComment;
    request.decidedAt = request.decidedAt || now;
    request.decidedBy = String(currentUser?.id || request.decidedBy || '');
    request.updatedAt = now;
    request.latestPreview = decisionComment;
    saveState();
    if (!syncChancelleryMutationRegions()) {
        renderChancelleryPage();
    }
}

function renderChancellerySubmissionPanel(request) {
    const submission = (request.thread || []).find((entry) => entry.kind === 'submission');
    const reason = String(submission?.message || request.message || '').trim() || 'No reason provided.';
    const snapshot = String(request.documentHtmlSnapshot || '').trim();
    const letterBlock = snapshot ? `
            <div class="chancellery-case-letter-snapshot chancellery-doc-page chancellery-doc-letter">
                ${snapshot}
            </div>
        ` : `
            <div class="lux-panel-copy chancellery-case-submission-body">${escapeChancelleryHtml(reason)}</div>
        `;
    return `
        <section class="chancellery-case-submission lux-soft-chrome">
            <div class="chancellery-case-submission-head">
                <div class="lux-section-kicker">Student submission</div>
                <div class="lux-card-actions chancellery-case-export-actions">
                    <button type="button" class="lux-secondary-btn" data-chancellery-action="export-case-pdf" data-request-id="${escapeChancelleryHtml(request.id)}"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button type="button" class="lux-secondary-btn" data-chancellery-action="export-case-docx" data-request-id="${escapeChancelleryHtml(request.id)}"><i class="fas fa-file-word"></i> Word</button>
                </div>
            </div>
            ${letterBlock}
            <div class="lux-inline-meta lux-chancellery-inline-meta">
                <span class="lux-panel-copy">${escapeChancelleryHtml(formatChancelleryDate(submission?.createdAt || request.createdAt, true))}</span>
            </div>
        </section>
    `;
}

function renderChancelleryDecisionBanner(request, options = {}) {
    const { canEditComment = false } = options;
    const terminal = isChancelleryCaseTerminal(request);
    const pendingLabel = normalizeChancelleryStatus(request.status) === 'Under Review' ? 'Under review' : 'Pending';
    const comment = String(request.decisionComment || '').trim();
    const commentBlock = terminal
        ? (canEditComment
            ? `
                <div class="chancellery-case-decision-comment-wrap">
                    <div class="lux-field chancellery-case-decision-edit">
                        <label for="chancellery-decision-comment-edit">Comment for student <span class="lux-meta">(one comment — editable)</span></label>
                        <textarea id="chancellery-decision-comment-edit" class="lux-control lux-chancellery-control" rows="2">${escapeChancelleryHtml(comment)}</textarea>
                    </div>
                    <div class="lux-card-actions chancellery-case-decision-actions">
                        <button type="button" class="lux-secondary-btn" data-chancellery-action="save-decision-comment" data-request-id="${escapeChancelleryHtml(request.id)}">
                            <i class="fas fa-pen"></i> Save comment
                        </button>
                    </div>
                </div>
            `
            : (comment
                ? `<div class="chancellery-case-decision-comment-wrap"><div class="lux-panel-copy chancellery-case-decision-comment">${escapeChancelleryHtml(comment)}</div></div>`
                : '<div class="lux-panel-copy">No decision comment recorded.</div>'))
        : `<div class="lux-panel-copy">Status: ${escapeChancelleryHtml(pendingLabel)}. Awaiting admin decision.</div>`;
    return `
        <section class="chancellery-case-decision-banner lux-soft-chrome is-${terminal ? (request.status === 'Resolved' ? 'accepted' : 'rejected') : 'pending'}">
            <div class="chancellery-case-decision-banner-head">
                <div class="lux-section-kicker">Decision</div>
                ${getChancelleryStatusPill(request.status, { hoverChip: false })}
            </div>
            ${commentBlock}
            ${terminal && request.decidedAt
                ? `<div class="lux-panel-copy lux-meta">${escapeChancelleryHtml(formatChancelleryDate(request.decidedAt, true))}</div>`
                : ''}
        </section>
    `;
}

function renderChancelleryDecisionForm(request) {
    if (isChancelleryCaseTerminal(request)) return '';
    return `
        <section class="chancellery-case-decision-form lux-soft-chrome">
            <div class="lux-section-kicker">Admin decision</div>
            <div class="lux-panel-copy lux-meta">One student-visible comment per case. You can edit it later.</div>
            <div class="lux-check-row-wrap chancellery-case-decision-choices">
                <label class="lux-check-row">
                    <input type="radio" name="chancellery-case-decision" value="accept">
                    <span>Accept (Resolved)</span>
                </label>
                <label class="lux-check-row">
                    <input type="radio" name="chancellery-case-decision" value="reject">
                    <span>Reject</span>
                </label>
            </div>
            <div class="chancellery-case-decision-comment-wrap">
                <div class="lux-field">
                    <label for="chancellery-decision-comment">Comment for student</label>
                    <textarea id="chancellery-decision-comment" class="lux-control lux-chancellery-control" rows="2" placeholder="Explain the decision for the student..."></textarea>
                </div>
            </div>
            <div class="lux-card-actions chancellery-case-decision-actions">
                <button type="button" class="lux-primary-btn" data-chancellery-action="confirm-case-decision" data-request-id="${escapeChancelleryHtml(request.id)}">
                    <i class="fas fa-check"></i> Confirm decision
                </button>
            </div>
        </section>
    `;
}

function renderChancelleryActivityLog(request) {
    const entries = (request.thread || [])
        .filter((entry) => entry.kind === 'status')
        .slice()
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (!entries.length) return '';
    return `
        <section class="chancellery-case-activity">
            <div class="lux-section-kicker">Activity</div>
            <ul class="chancellery-case-activity-list">
                ${entries.map((entry) => `
                    <li>
                        <span class="lux-panel-copy">${escapeChancelleryHtml(entry.message || '')}</span>
                        <span class="lux-panel-copy lux-meta">${escapeChancelleryHtml(formatChancelleryDate(entry.createdAt, true))}</span>
                    </li>
                `).join('')}
            </ul>
        </section>
    `;
}

function renderChancelleryThread(request) {
    // Legacy helper retained for older callers; dossier UI uses submission + decision panels.
    return renderChancellerySubmissionPanel(request);
}

function renderChancelleryRequestList(requests, selectedCaseId) {
    if (!requests.length) {
        return '<div class="lux-empty-state lux-chancellery-empty-state">No requests match this view yet.</div>';
    }
    const isAdmin = typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() === USER_ROLES.ADMIN;
    return `<div class="lux-queue-list lux-chancellery-queue-list">${
        requests.map(request => {
            const kindMeta = CHANCELLERY_REQUEST_KIND_META[request.requestKind] || CHANCELLERY_REQUEST_KIND_META.legacy;
            const selected = request.id === selectedCaseId;
            const needsForward = isAdmin && isChancelleryRequestNeedsForward(request);
            const groupLabel = resolveChancelleryGroupLabel(request);
            const dateLabel = formatChancelleryDate(request.createdAt);
            return `
                <button type="button" data-chancellery-select-case="${escapeChancelleryHtml(request.id)}" class="lux-queue-item lux-chancellery-queue-item home-hover-chip${selected ? ' is-selected' : ''}">
                    <div class="lux-queue-head lux-chancellery-queue-head">
                        <div class="lux-chancellery-queue-copy">
                            <div class="lux-chancellery-queue-subject">${escapeChancelleryHtml(request.subjectName)}</div>
                            <div class="lux-inline-meta lux-chancellery-inline-meta lux-chancellery-queue-meta">
                                <span class="lux-overline lux-chancellery-queue-id">${escapeChancelleryHtml(request.id)}</span>
                                <span>${escapeChancelleryHtml(groupLabel)}</span>
                            </div>
                        </div>
                        <div class="lux-chancellery-queue-side">
                            ${getChancelleryStatusPill(request.status, { hoverChip: false })}
                            <span class="lux-status-pill ${getChancelleryKindPillClass(kindMeta)}">
                                <i class="${kindMeta.icon}"></i> ${escapeChancelleryHtml(kindMeta.label)}
                            </span>
                            ${needsForward ? '<span class="lux-status-pill is-warning">Needs forward</span>' : ''}
                            <span class="lux-chancellery-queue-date">${escapeChancelleryHtml(dateLabel)}</span>
                        </div>
                    </div>
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
                    <div class="lux-section-kicker lux-page-kicker"><i class="fas fa-file-circle-plus"></i> New appeal</div>
                    <div class="lux-page-title lux-chancellery-card-title">Submit an appeal</div>
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
            </div>
            <div class="lux-panel-copy">
                Choose a subject to open the official appeal document. Administration reviews first; course staff see it after admin forwards.
            </div>
            <div class="lux-card-actions lux-chancellery-form-actions">
                <button type="button" class="lux-primary-btn lux-chancellery-submit-btn" data-chancellery-action="open-appeal-document">
                    <i class="fas fa-file-lines"></i> Continue
                </button>
            </div>
        </div>
    `;
}

function renderChancelleryCaseMeta(request) {
    const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(request.faculty) : request.faculty;
    const ctx = request.recipientContext || {};
    const needsForward = isChancelleryRequestNeedsForward(request);
    const forwardedTo = normalizeChancelleryForwardedTo(request.forwardedTo, getChancelleryRoutingStage(request));
    const recipientLines = ['Administration'];
    if (needsForward) {
        recipientLines.push('(awaiting forward)');
    } else {
        if (forwardedTo.professor && ctx.professorName) recipientLines.push(`Professor: ${ctx.professorName}`);
        if (forwardedTo.ta && ctx.taName) recipientLines.push(`TA: ${ctx.taName}`);
    }
    const staffLines = [
        ctx.professorName ? `Professor: ${ctx.professorName}` : 'Professor: —',
        ctx.taName ? `TA: ${ctx.taName}` : 'TA: —'
    ];
    const examCard = request.examOptionLabel ? `
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Exam</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${escapeChancelleryHtml(request.examOptionLabel)}</div>
            </div>` : '';
    return `
        <div class="chancellery-case-meta lux-subcards lux-chancellery-subcards-spaced">
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Recipients</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${recipientLines.map((line) => escapeChancelleryHtml(line)).join(' · ')}</div>
            </div>
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Subject staff</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${staffLines.map((line) => escapeChancelleryHtml(line)).join(' · ')}</div>
            </div>
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Faculty</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${escapeChancelleryHtml(facultyLabel)}</div>
            </div>
            <div class="lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip">
                <div class="lux-section-kicker lux-chancellery-subcard-kicker">Submitted</div>
                <div class="lux-panel-copy lux-chancellery-subcard-copy">${escapeChancelleryHtml(formatChancelleryDate(request.createdAt, true))}</div>
            </div>
            ${examCard}
        </div>
    `;
}

function ensureChancelleryForwardOverlay() {
    let overlay = document.getElementById('chancellery-forward-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chancellery-forward-overlay';
        overlay.setAttribute('data-lux-modal-overlay', '');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
    }
    const wasOpen = overlay.classList.contains('active')
        || overlay.getAttribute('aria-hidden') === 'false';
    overlay.className = 'modal-overlay orders-recipient-filter-editor-overlay chancellery-forward-overlay';
    overlay.setAttribute('data-lux-transparency-exempt', '1');
    if (wasOpen) overlay.classList.add('active');
    return overlay;
}

function closeChancelleryForwardModal() {
    const overlay = document.getElementById('chancellery-forward-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '';
}

function renderChancelleryForwardModalMarkup(request) {
    const ctx = request.recipientContext || {};
    const canProfessor = Boolean(ctx.professorId || ctx.professorName);
    const canTa = Boolean(ctx.taId || ctx.taName);
    const current = normalizeChancelleryForwardedTo(request.forwardedTo, getChancelleryRoutingStage(request));
    const alreadyForwarded = getChancelleryRoutingStage(request) === 'forwarded'
        && (current.professor || current.ta);
    const professorChecked = canProfessor && (alreadyForwarded ? current.professor : true);
    const taChecked = canTa && (alreadyForwarded ? current.ta : true);
    const professorLabel = ctx.professorName || 'No professor on this subject';
    const taLabel = ctx.taName || 'No TA on this subject';
    const title = alreadyForwarded ? 'Update course staff' : 'Forward to course staff';
    const subjectLine = [
        request.subjectName || 'Subject',
        resolveChancelleryGroupLabel(request)
    ].filter(Boolean).join(' · ');
    return `
        <div class="orders-recipient-filter-editor-modal modal-content lux-panel chancellery-forward-modal" data-lux-transparency-exempt="1" role="dialog" aria-modal="true" aria-labelledby="chancellery-forward-title">
            <div class="orders-recipient-filter-editor-head modal-header">
                <div>
                    <div class="lux-card-title orders-admin-section-title" id="chancellery-forward-title">${escapeChancelleryHtml(title)}</div>
                    <div class="lux-panel-copy orders-admin-section-copy">${escapeChancelleryHtml(subjectLine)}</div>
                </div>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-action="close-forward-panel" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
            <div class="orders-recipient-filter-editor-body modal-body">
                <div class="lux-panel-copy">Choose who should see this case:</div>
                <div class="lux-check-row-wrap">
                    <label class="lux-check-row">
                        <input type="checkbox" data-chancellery-forward-target="professor"${professorChecked ? ' checked' : ''} ${canProfessor ? '' : 'disabled'}>
                        <span>Professor — ${escapeChancelleryHtml(professorLabel)}</span>
                    </label>
                    <label class="lux-check-row">
                        <input type="checkbox" data-chancellery-forward-target="ta"${taChecked ? ' checked' : ''} ${canTa ? '' : 'disabled'}>
                        <span>TA — ${escapeChancelleryHtml(taLabel)}</span>
                    </label>
                </div>
            </div>
            <div class="orders-recipient-filter-editor-actions modal-footer">
                <div class="orders-recipient-filter-editor-actions-buttons">
                    <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-action="close-forward-panel">Cancel</button>
                    <button type="button" class="lux-primary-btn" data-lux-skip-modern-button="true" data-chancellery-action="confirm-forward-to-staff" data-request-id="${escapeChancelleryHtml(request.id)}">
                        <i class="fas fa-share"></i> ${alreadyForwarded ? 'Update forward' : 'Forward case'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function openChancelleryForwardModal(requestId = '') {
    if (typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const id = String(requestId || ensureChancelleryUiState().selectedCaseId || '').trim();
    const request = getChancelleryRequestById(id);
    if (!request) {
        alert('Select a case before forwarding.');
        return;
    }
    if (!canForwardChancelleryCase(request)) {
        alert('Forward is only available while the case is still under review.');
        return;
    }
    ensureChancelleryUiState().selectedCaseId = request.id;
    const overlay = ensureChancelleryForwardOverlay();
    overlay.innerHTML = renderChancelleryForwardModalMarkup(request);
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    window.enhanceUniversalPickers?.(overlay);
}

function resolveChancelleryCaseModalOptions() {
    const role = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '';
    const isStudent = role === USER_ROLES.STUDENT;
    return {
        staff: !isStudent,
        readOnly: role === USER_ROLES.STUDENT_SERVICE
    };
}

function isChancelleryCaseModalOpen() {
    const overlay = document.getElementById('chancellery-case-overlay');
    return Boolean(overlay?.classList.contains('active'));
}

function ensureChancelleryCaseOverlay() {
    let overlay = document.getElementById('chancellery-case-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chancellery-case-overlay';
        overlay.setAttribute('data-lux-modal-overlay', '');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="admin-orders-thread-modal modal-content lux-panel chancellery-case-modal" data-lux-transparency-exempt="1" role="dialog" aria-modal="true" aria-labelledby="chancellery-case-title">
                <div id="chancellery-case-panel" class="chancellery-case-panel" aria-label="Case detail"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        bindChancelleryDelegates(overlay);
    }
    const wasOpen = overlay.classList.contains('active')
        || overlay.getAttribute('aria-hidden') === 'false';
    overlay.className = 'modal-overlay admin-orders-modal-overlay chancellery-case-overlay';
    overlay.setAttribute('data-lux-transparency-exempt', '1');
    if (wasOpen) overlay.classList.add('active');
    const modal = overlay.querySelector('.chancellery-case-modal');
    if (modal) {
        modal.className = 'admin-orders-thread-modal modal-content lux-panel chancellery-case-modal';
        modal.setAttribute('data-lux-transparency-exempt', '1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'chancellery-case-title');
    }
    return overlay;
}

function closeChancelleryCaseModal() {
    closeChancelleryForwardModal();
    const overlay = document.getElementById('chancellery-case-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    const panel = overlay.querySelector('#chancellery-case-panel');
    if (panel) panel.innerHTML = '';
    document.body.classList.remove('chancellery-case-modal-open');
}

function fillChancelleryCasePanel(request) {
    const overlay = ensureChancelleryCaseOverlay();
    const panel = overlay.querySelector('#chancellery-case-panel');
    if (!panel || !request) return overlay;
    const options = resolveChancelleryCaseModalOptions();
    applyChancelleryLocalizedMarkup(panel, renderChancelleryCaseDetailPanel(request, options));
    window.enhanceUniversalPickers?.(overlay);
    return overlay;
}

function openChancelleryCaseModal(requestId = '') {
    const id = String(requestId || ensureChancelleryUiState().selectedCaseId || '').trim();
    const request = getChancelleryRequestById(id);
    if (!request) return;
    ensureChancelleryUiState().selectedCaseId = request.id;
    const overlay = fillChancelleryCasePanel(request);
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('chancellery-case-modal-open');
}

function refreshChancelleryCaseModal(request = null) {
    if (!isChancelleryCaseModalOpen()) return;
    const active = request || getChancelleryRequestById(ensureChancelleryUiState().selectedCaseId);
    if (!active) {
        closeChancelleryCaseModal();
        return;
    }
    fillChancelleryCasePanel(active);
}

function syncChancelleryCaseModalWithContext(context) {
    if (!isChancelleryCaseModalOpen()) return;
    if (!context?.selectedRequest) {
        closeChancelleryCaseModal();
        return;
    }
    refreshChancelleryCaseModal(context.selectedRequest);
}

function bindChancelleryCaseModalDelegates() {
    if (document.documentElement.dataset.chancelleryCaseModalBound === '1') return;
    document.documentElement.dataset.chancelleryCaseModalBound = '1';
    document.addEventListener('click', (event) => {
        const overlay = document.getElementById('chancellery-case-overlay');
        if (!overlay || !overlay.classList.contains('active')) return;
        if (event.target === overlay || event.target.id === 'chancellery-case-overlay') {
            closeChancelleryCaseModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const forward = document.getElementById('chancellery-forward-overlay');
        if (forward?.classList.contains('active')) {
            closeChancelleryForwardModal();
            event.preventDefault();
            return;
        }
        if (isChancelleryCaseModalOpen()) {
            closeChancelleryCaseModal();
            event.preventDefault();
        }
    });
}

bindChancelleryCaseModalDelegates();

function renderChancelleryCaseDetailPanel(request, options = {}) {
    const { staff = false, readOnly = false } = options;
    const isAdmin = typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() === USER_ROLES.ADMIN;
    const needsForward = isChancelleryRequestNeedsForward(request);
    const canForward = isAdmin && !readOnly && canForwardChancelleryCase(request);
    const forwardedTo = normalizeChancelleryForwardedTo(request.forwardedTo, getChancelleryRoutingStage(request));
    const hasForwardTargets = forwardedTo.professor || forwardedTo.ta;
    const groupLabel = resolveChancelleryGroupLabel(request);
    const typeLabel = deriveChancelleryTypeLabel(request.requestKind);
    const forwardChip = !needsForward && hasForwardTargets
        ? (canForward
            ? `<button type="button" class="lux-status-pill home-hover-chip is-info" data-chancellery-action="open-forward-panel" data-request-id="${escapeChancelleryHtml(request.id)}" title="Change who this case is forwarded to"><i class="fas fa-share"></i> Forwarded to ${escapeChancelleryHtml(describeChancelleryForwardTargets(forwardedTo))}</button>`
            : `<span class="lux-status-pill home-hover-chip is-info"><i class="fas fa-share"></i> Forwarded to ${escapeChancelleryHtml(describeChancelleryForwardTargets(forwardedTo))}</span>`)
        : (canForward && needsForward
            ? `<button type="button" class="lux-secondary-btn" data-chancellery-action="open-forward-panel" data-request-id="${escapeChancelleryHtml(request.id)}"><i class="fas fa-share"></i> Forward</button>`
            : '');
    const statusControl = `${getChancelleryStatusPill(request.status, { hoverChip: false })}${staff && readOnly
        ? '<span class="lux-status-pill home-hover-chip is-muted"><i class="fas fa-eye"></i> View only</span>'
        : ''}`;

    let headerCopy;
    if (staff) {
        const student = resolveChancelleryCaseStudent(request);
        const studentName = resolveChancelleryCaseStudentName(student, request);
        const photoUrl = resolveChancelleryCaseStudentPhoto(student);
        const caseMeta = [request.id, request.subjectName, typeLabel].filter(Boolean);
        const identityMeta = [
            groupLabel ? `Group ${groupLabel}` : '',
            ...resolveChancelleryCaseStudentCourseChips(student)
        ].filter(Boolean);
        headerCopy = `
            <div class="chancellery-case-identity">
                ${renderChancelleryCaseAvatar(studentName, photoUrl)}
                <div class="chancellery-case-identity-copy">
                    <div class="lux-page-title lux-chancellery-card-title" id="chancellery-case-title">${escapeChancelleryHtml(studentName)}</div>
                    <div class="lux-inline-meta lux-chancellery-inline-meta">
                        ${caseMeta.map(item => `<span class="lux-panel-copy">${escapeChancelleryHtml(item)}</span>`).join('')}
                    </div>
                    ${identityMeta.length ? `
                        <div class="lux-inline-meta lux-chancellery-inline-meta chancellery-case-identity-chips">
                            ${identityMeta.map(item => `<span class="lux-panel-copy">${escapeChancelleryHtml(item)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        const metaLine = [request.id, typeLabel, groupLabel];
        headerCopy = `
            <div class="chancellery-case-header-copy">
                <div class="lux-page-title lux-chancellery-card-title" id="chancellery-case-title">${escapeChancelleryHtml(request.subjectName)}</div>
                <div class="lux-inline-meta lux-chancellery-inline-meta">
                    ${metaLine.map(item => `<span class="lux-panel-copy">${escapeChancelleryHtml(item)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    const header = `
        <header class="chancellery-case-header modal-header">
            ${headerCopy}
            <div class="chancellery-case-header-actions">
                ${forwardChip}
                ${statusControl}
                ${isAdmin && !readOnly ? `
                    <button type="button" class="lux-primary-btn lux-btn-danger" data-lux-skip-modern-button="true" data-chancellery-action="remove-case" data-request-id="${escapeChancelleryHtml(request.id)}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                ` : ''}
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-action="close-case-modal" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
        </header>
    `;
    const scroll = `
        <div class="chancellery-case-scroll modal-body">
            ${renderChancelleryCaseMeta(request)}
            ${renderChancellerySubmissionPanel(request)}
            ${renderChancelleryDecisionBanner(request, { canEditComment: isAdmin && !readOnly })}
            ${isAdmin && !readOnly ? renderChancelleryDecisionForm(request) : ''}
            ${staff ? renderChancelleryActivityLog(request) : ''}
        </div>
    `;
    return `${header}${scroll}`;
}

function renderChancelleryDateFilterInputs(uiState) {
    return `
        <label class="lux-picker-field lux-chancellery-filter-field">
            <span class="lux-picker-label">From</span>
            <input type="date" class="lux-control lux-chancellery-control" data-chancellery-date-filter="dateFrom" value="${escapeChancelleryHtml(uiState.dateFrom || '')}">
        </label>
        <label class="lux-picker-field lux-chancellery-filter-field">
            <span class="lux-picker-label">To</span>
            <input type="date" class="lux-control lux-chancellery-control" data-chancellery-date-filter="dateTo" value="${escapeChancelleryHtml(uiState.dateTo || '')}">
        </label>
    `;
}

function renderChancelleryCommandBar({ role, uiState, count, showCompose = false }) {
    const filters = uiState.filters || {};
    const isAdmin = role === USER_ROLES.ADMIN;
    const routingFilter = uiState.routingFilter || 'all';
    const layoutMarkup = renderChancelleryDateFilterInputs(uiState);
    const routingTabs = isAdmin ? `
            <div class="lux-tab-strip lux-tab-strip--segmented lux-chancellery-routing-filter" role="tablist" aria-label="Forward stage">
                <button type="button" class="lux-tab-btn${routingFilter === 'all' ? ' is-active' : ''}" data-lux-skip-modern-button="true" data-chancellery-action="set-routing-filter" data-chancellery-routing-filter="all">All</button>
                <button type="button" class="lux-tab-btn${routingFilter === 'needs_forward' ? ' is-active' : ''}" data-lux-skip-modern-button="true" data-chancellery-action="set-routing-filter" data-chancellery-routing-filter="needs_forward">Needs forward</button>
                <button type="button" class="lux-tab-btn${routingFilter === 'forwarded' ? ' is-active' : ''}" data-lux-skip-modern-button="true" data-chancellery-action="set-routing-filter" data-chancellery-routing-filter="forwarded">Forwarded</button>
            </div>
        ` : '';
    return `
        <div class="filter-shell lux-chancellery-command-bar home-hover-chip" data-lux-visual-skip="1">
            ${showCompose ? `
                <button type="button" class="lux-primary-btn" data-chancellery-action="show-compose">
                    <i class="fas fa-plus"></i> New appeal
                </button>
            ` : ''}
            ${isAdmin ? `
                <button type="button" class="lux-secondary-btn home-hover-chip" data-chancellery-action="edit-document" title="Controls the student appeal form for this faculty">
                    <i class="fas fa-file-pen"></i> Edit appeal document
                </button>
            ` : ''}
            <div class="lux-field lux-chancellery-filter-field lux-chancellery-search">
                <label class="sr-only" for="chancellery-search">Search</label>
                <input id="chancellery-search" type="search" class="lux-control lux-chancellery-control" data-chancellery-filter="search" value="${escapeChancelleryHtml(filters.search || '')}" placeholder="Search cases...">
            </div>
            ${layoutMarkup}
            ${routingTabs}
            <span class="lux-chancellery-command-spacer" aria-hidden="true"></span>
            <span class="lux-pill home-hover-chip">${count} case${count === 1 ? '' : 's'}</span>
        </div>
    `;
}

function renderChancelleryWorkspace({ listTitle, listCopy, requests, selectedRequest, rightMarkup = null, listOnly = false }) {
    const useListOnly = listOnly || rightMarkup == null;
    const detailMarkup = useListOnly ? '' : `
                <section class="lux-chancellery-detail-panel home-hover-chip">
                    <div class="lux-chancellery-detail-body">${rightMarkup}</div>
                </section>`;
    return `
        <div class="lux-chancellery-workspace">
            <div class="lux-chancellery-workspace-split${useListOnly ? ' is-list-only' : ''}">
                <section class="lux-chancellery-list-panel home-hover-chip">
                    <div class="lux-actions-between lux-chancellery-actions-between">
                        <div>
                            <div class="lux-page-title lux-chancellery-card-title">${escapeChancelleryHtml(listTitle)}</div>
                            ${listCopy ? `<div class="lux-panel-copy lux-chancellery-card-copy">${escapeChancelleryHtml(listCopy)}</div>` : ''}
                        </div>
                    </div>
                    <div class="lux-chancellery-list-region">${renderChancelleryRequestList(requests, selectedRequest?.id || '')}</div>
                </section>
                ${detailMarkup}
            </div>
        </div>
    `;
}

function renderChancelleryStudentAppealsPanel(requests, selectedRequest) {
    const subjects = getStudentGradedSubjectsForChancellery();
    const uiState = ensureChancelleryUiState();
    const filteredRequests = filterChancelleryRequests(requests, uiState);
    const activeRequest = selectedRequest && filteredRequests.some(request => request.id === selectedRequest.id)
        ? selectedRequest
        : null;
    return renderChancelleryWorkspace({
        listTitle: 'My cases',
        listCopy: '',
        requests: filteredRequests,
        selectedRequest: activeRequest,
        rightMarkup: renderChancelleryComposeForm(subjects)
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
    const filteredRequests = filterChancelleryRequests(requests, uiState);
    const selectedRequest = resolveChancellerySelection(filteredRequests, { autoSelect: false });
    const listTitle = getEffectiveUserRole() === USER_ROLES.ADMIN
        ? 'Inbox'
        : getEffectiveUserRole() === USER_ROLES.STUDENT_SERVICE
            ? 'Cases'
            : 'Queue';
    return renderChancelleryWorkspace({
        listTitle,
        listCopy: '',
        requests: filteredRequests,
        selectedRequest,
        listOnly: true
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
                    ${isStudent ? `<div class="page-hero-copy lux-page-copy">${headingCopy}</div>` : ''}
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
    const openCount = requests.filter(request => !isChancelleryCaseTerminal(request)).length;
    const waitingCount = requests.filter(request => normalizeChancelleryStatus(request.status) === 'Under Review').length;
    const resolvedCount = requests.filter(request => normalizeChancelleryStatus(request.status) === 'Resolved').length;
    if (isStudent) {
        const balance = Number(KIU_STATE?.tuitionBalances?.[getCurrentUserId()] || KIU_STATE?.tuitionBalances?.student || 0);
        return [
            { label: 'Open', value: String(openCount) },
            { label: 'In review', value: String(waitingCount) },
            { label: 'Accepted', value: String(resolvedCount) },
            { label: 'Balance', value: balance > 0 ? `${balance.toLocaleString()} GEL` : 'Clear' }
        ];
    }
    return [
        { label: 'Total', value: String(requests.length) },
        { label: 'Open', value: String(openCount) },
        { label: 'In review', value: String(waitingCount) },
        { label: 'Accepted', value: String(resolvedCount) }
    ];
}

function buildChancelleryRenderContext() {
    const uiState = ensureChancelleryUiState();
    const role = getEffectiveUserRole();
    const requests = getVisibleChancelleryRequests();
    const isStudent = role === USER_ROLES.STUDENT;
    const isStaff = [USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.STUDENT_SERVICE].includes(role);
    const showAppealsWorkspace = !isStudent || uiState.tab !== 'finance';
    const filteredRequests = showAppealsWorkspace ? filterChancelleryRequests(requests, uiState, role) : requests;
    const selectedRequest = resolveChancellerySelection(filteredRequests, { autoSelect: false });
    const headingTitle = isStudent
        ? (uiState.tab === 'finance' ? 'Finance' : 'Appeals & Retakes')
        : role === USER_ROLES.STUDENT_SERVICE
            ? 'Support cases'
            : 'Appeals inbox';
    const headingCopy = isStudent
        ? (uiState.tab === 'finance' ? 'Tuition balance snapshot.' : 'Grade appeals and retake requests for your subjects.')
        : role === USER_ROLES.STUDENT_SERVICE
            ? 'Read-only case view for student support.'
            : 'Review appeals, decide accept/reject, forward when needed.';
    const openCount = requests.filter(request => !isChancelleryCaseTerminal(request)).length;
    const waitingCount = requests.filter(request => normalizeChancelleryStatus(request.status) === 'Under Review').length;
    const heroStatusLabel = isStudent
        ? (waitingCount > 0 ? 'Under Review' : (openCount > 0 ? 'Submitted' : 'Resolved'))
        : (waitingCount > 0 ? 'Under Review' : (openCount ? 'Under Review' : 'Resolved'));
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
    return {
        listSelectedId: context.selectedRequest?.id || '',
        rightMarkup: renderChancelleryComposeForm(subjects),
        listOnly: false
    };
}

function resolveChancelleryStaffWorkspaceParts(context) {
    return {
        listSelectedId: context.selectedRequest?.id || '',
        rightMarkup: null,
        listOnly: true
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
    if (context.isStudent) return 'compose';
    return 'empty';
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
    return currentMode !== targetMode;
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
    if (parts.listOnly || parts.rightMarkup == null) return false;
    applyChancelleryLocalizedMarkup(detailBody, parts.rightMarkup);
    if (typeof window.enhanceUniversalPickers === 'function') {
        window.enhanceUniversalPickers(detailBody);
    }
    return true;
}

function patchChancelleryWorkspace(contentEl, context, { list = true, detail = true } = {}) {
    const hasList = contentEl.querySelector('.lux-chancellery-list-region');
    if (!hasList) return false;
    const hasDetail = contentEl.querySelector('.lux-chancellery-detail-body');
    const listOk = !list || patchChancelleryListRegion(contentEl, context);
    const detailOk = !detail || !hasDetail || (
        shouldPatchChancelleryDetailRegion(contentEl, context)
            ? patchChancelleryDetailRegion(contentEl, context)
            : true
    );
    syncChancelleryCaseModalWithContext(context);
    return listOk && detailOk;
}

function patchChancelleryCommandBar(commandEl, context, { mode = 'filters' } = {}) {
    const bar = commandEl.querySelector('.lux-chancellery-command-bar');
    if (!bar) return false;
    const filters = context.uiState.filters || {};
    const layoutFilters = context.uiState.layoutFilters || {};

    if (mode === 'count' || mode === 'filters') {
        const pill = bar.querySelector('.lux-pill');
        if (pill) {
            pill.textContent = `${context.filteredCount} case${context.filteredCount === 1 ? '' : 's'}`;
        }
    }

    if (mode === 'filters') {
        const search = bar.querySelector('#chancellery-search');
        if (search && document.activeElement !== search) {
            const nextValue = filters.search || '';
            if (search.value !== nextValue) search.value = nextValue;
        }
        bar.querySelectorAll('[data-chancellery-date-filter]').forEach((control) => {
            if (document.activeElement === control) return;
            const filterKey = String(control.getAttribute('data-chancellery-date-filter') || '').trim();
            if (filterKey !== 'dateFrom' && filterKey !== 'dateTo') return;
            const nextValue = context.uiState[filterKey] || '';
            if (control.value !== nextValue) control.value = nextValue;
        });
        const routingFilter = String(context.uiState.routingFilter || 'all');
        bar.querySelectorAll('[data-chancellery-action="set-routing-filter"]').forEach((btn) => {
            const value = String(btn.getAttribute('data-chancellery-routing-filter') || 'all').trim();
            const active = value === routingFilter;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
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
    syncChancelleryCaseModalWithContext(context);
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
    syncChancelleryCaseModalWithContext(context);
    return commandOk && listOk && detailOk;
}

function patchChancelleryHero(heroEl, context) {
    if (!heroEl) return false;
    const titleEl = heroEl.querySelector('.page-hero-title');
    const copyEl = heroEl.querySelector('.page-hero-copy');
    const signalsEl = heroEl.querySelector('.lux-chancellery-hero-signals');
    if (!titleEl || !signalsEl) return false;

    titleEl.textContent = context.headingTitle;
    if (copyEl) copyEl.textContent = context.headingCopy;

    const pillEl = heroEl.querySelector('.lux-chancellery-hero-side .lux-status-pill, .lux-chancellery-hero-side .lux-focus-panel__chip');
    if (pillEl) {
        const meta = getChancelleryStatusMeta(context.heroStatusLabel);
        pillEl.className = `lux-focus-panel__chip lux-status-pill home-hover-chip lux-chancellery-status-pill lux-chancellery-case-status-pill is-${meta.tone}`;
        pillEl.innerHTML = `<i class="${meta.icon}"></i> ${escapeChancelleryHtml(meta.label)}`;
    }

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
            count: filteredRequests.length
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
    const role = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : 'student';
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    const layoutHydrationKey = `${faculty}:${typeof normalizeChancelleryFilterRole === 'function' ? normalizeChancelleryFilterRole(role) : role}`;
    if (root.dataset.chancelleryFilterLayoutHydratedKey !== layoutHydrationKey
        && typeof fetchChancelleryDocumentTemplate === 'function') {
        root.dataset.chancelleryFilterLayoutHydratedKey = layoutHydrationKey;
        fetchChancelleryDocumentTemplate(faculty).then(() => {
            if (document.getElementById('page-chancellery') === root) {
                renderChancelleryPage();
            }
        });
    }
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

