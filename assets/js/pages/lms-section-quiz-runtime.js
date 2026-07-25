/* LMS section keys + quiz bank/normalize helpers. Peeled from lms.js.
 * Load before lms.js.
 */
(function initLmsSectionQuizRuntime() {
    if (window.__KIU_LMS_SECTION_QUIZ_LOADED) return;
    window.__KIU_LMS_SECTION_QUIZ_LOADED = true;

    window.__kiuCreateLmsSectionQuizApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function renderLmsGlassDialogHead(opts = {}) {
    return typeof window.renderLuxGlassDialogHead === 'function'
        ? window.renderLuxGlassDialogHead(opts)
        : '';
}
function renderLmsGlassDialogCard(opts = {}) {
    return typeof window.renderLuxGlassDialogCard === 'function'
        ? window.renderLuxGlassDialogCard(opts)
        : '';
}
window.renderLmsGlassDialogHead = renderLmsGlassDialogHead;
window.renderLmsGlassDialogCard = renderLmsGlassDialogCard;
function toDomToken(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}
function normalizeLmsSectionType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return LMS_SECTION_TYPES.includes(normalized) ? normalized : '';
}
function getDefaultLmsSectionTypeForRole(role = getEffectiveUserRole()) {
    return role === USER_ROLES.TA ? 'workshop' : 'lecture';
}
function getCurrentLmsSectionType() {
    currentLmsSectionType = normalizeLmsSectionType(currentLmsSectionType)
        || getDefaultLmsSectionTypeForRole();
    return currentLmsSectionType;
}
function getLmsSectionMeta(sectionType = getCurrentLmsSectionType()) {
    const normalized = normalizeLmsSectionType(sectionType) || 'lecture';
    if (normalized === 'workshop') {
        return {
            type: 'workshop',
            label: 'Workshop',
            ownerLabel: 'Teaching Assistant',
            icon: 'fa-screwdriver-wrench',
            copy: 'Practice, recitation, labs, and TA-led support for the same group roster.'
        };
    }
    return {
        type: 'lecture',
        label: 'Lecture',
        ownerLabel: 'Professor',
        icon: 'fa-chalkboard-user',
        copy: 'Professor-led lessons, core materials, assessments, and lecture recordings.'
    };
}
function getLmsSectionSuffix(sectionType) {
    const normalized = normalizeLmsSectionType(sectionType);
    return normalized ? `${LMS_SECTION_SUFFIX_PREFIX}${normalized}` : '';
}
function stripLmsSectionSuffix(groupId) {
    const rawGroupId = String(groupId || '').trim();
    const markerIndex = rawGroupId.lastIndexOf(LMS_SECTION_SUFFIX_PREFIX);
    if (markerIndex < 0) {
        return { groupId: rawGroupId, sectionType: '' };
    }
    const baseGroupId = rawGroupId.slice(0, markerIndex);
    const sectionType = normalizeLmsSectionType(rawGroupId.slice(markerIndex + LMS_SECTION_SUFFIX_PREFIX.length));
    return {
        groupId: baseGroupId || rawGroupId,
        sectionType
    };
}
function parseLmsCourseKey(courseKey) {
    const raw = String(courseKey || '').trim();
    if (!raw.includes('::')) {
        return { courseId: raw, groupId: null, resourceKey: raw, sectionType: '' };
    }
    const [courseId, ...groupParts] = raw.split('::');
    const sectionParts = stripLmsSectionSuffix(groupParts.join('::'));
    return {
        courseId: courseId || raw,
        groupId: sectionParts.groupId || null,
        resourceKey: raw,
        sectionType: sectionParts.sectionType
    };
}
const LMS_PERSONAL_BOARD_MARKER = '__personal__';

function isLmsPersonalBoardKey(resourceKey = '') {
    return String(resourceKey || '').includes(LMS_PERSONAL_BOARD_MARKER);
}

function getLmsPersonalBoardOwnerId(resourceKey = '') {
    const raw = String(resourceKey || '').trim();
    const markerIndex = raw.indexOf(LMS_PERSONAL_BOARD_MARKER);
    if (markerIndex < 0) return '';
    return raw.slice(markerIndex + LMS_PERSONAL_BOARD_MARKER.length).trim();
}

function isLmsPersonalBoardOwner(resourceKey = '') {
    const ownerId = getLmsPersonalBoardOwnerId(resourceKey);
    const userId = String(typeof getCurrentUserId === 'function' ? getCurrentUserId() || '' : '').trim();
    return Boolean(ownerId && userId && ownerId === userId);
}

function buildLmsPersonalBoardKey(courseKey = currentCourseId, userId = '') {
    const scopeKey = typeof getLmsSectionResourceKey === 'function'
        ? getLmsSectionResourceKey(courseKey)
        : String(courseKey || '').trim();
    const ownerId = String(userId || (typeof getCurrentUserId === 'function' ? getCurrentUserId() || '' : '')).trim();
    if (!scopeKey || !ownerId) return '';
    return `${scopeKey}${LMS_PERSONAL_BOARD_MARKER}${ownerId}`;
}

function getLmsPersonalDashboardCourseId(courseKey = currentCourseId) {
    if (typeof getLmsSubjectIdFromResourceKey === 'function') {
        const subjectId = getLmsSubjectIdFromResourceKey(courseKey);
        if (subjectId) return String(subjectId).trim();
    }
    const parsed = parseLmsCourseKey(courseKey);
    return String(parsed.courseId || courseKey || '').trim();
}

function resolveCanonicalLmsResourceKey(resourceKey) {
    const raw = String(resourceKey || '').trim();
    if (isLmsPersonalBoardKey(raw)) return raw;
    const parsed = parseLmsCourseKey(resourceKey);
    if (!parsed.courseId || !parsed.groupId) return parsed.resourceKey || String(resourceKey || '');
    const targetCourseKey = canonicalCourseKey(parsed.courseId);
    const targetGroupKey = canonicalCourseKey(parsed.groupId);
    const targetSectionType = normalizeLmsSectionType(parsed.sectionType);
    const candidates = new Set([
        ...(Object.keys(KIU_STATE.lmsQuizBuilder || {})),
        ...(Object.keys(KIU_STATE.groupQuizzes || {})),
        ...(Object.keys(KIU_STATE.groupQuizSubmissions || {})),
        ...(Object.keys(KIU_STATE.groupAssignments || {})),
        ...(Object.keys(KIU_STATE.groupMaterials || {})),
        ...(Object.keys(KIU_STATE.groupSubmissions || {})),
        ...(Object.keys(KIU_STATE.groupConcepts || {})),
        ...(Object.keys(KIU_STATE.groupConceptRatings || {})),
        ...(Object.keys(KIU_STATE.groupWeekConfigs || {})),
        ...(Object.keys(KIU_STATE.lmsClassSessions || {})),
        ...(Object.keys(KIU_STATE.lmsLiveQuizzes || {})),
        ...(Object.keys(KIU_STATE.lmsWhiteboards || {}))
    ]);
    for (const candidate of candidates) {
        const p = parseLmsCourseKey(candidate);
        if (
            canonicalCourseKey(p.courseId) === targetCourseKey
            && canonicalCourseKey(p.groupId) === targetGroupKey
            && normalizeLmsSectionType(p.sectionType) === targetSectionType
        ) {
            return candidate;
        }
    }
    const subject = findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty());
    const resolvedCourseId = subject?.id || parsed.courseId;
    const availableGroups = getAvailableGroupsForSubject(resolvedCourseId);
    const resolvedGroupId = availableGroups.find(group => canonicalCourseKey(group?.id) === targetGroupKey)?.id || parsed.groupId;
    return `${resolvedCourseId}::${resolvedGroupId}${getLmsSectionSuffix(targetSectionType)}`;
}
function joinLmsMeta(parts = []) {
    return parts
        .filter(part => part !== null && part !== undefined && String(part).trim())
        .map(part => escapeHtml(String(part)))
        .join('  -  ');
}
function getLmsSectionResourceKey(courseKey = currentCourseId, sectionType = getCurrentLmsSectionType()) {
    const parsed = parseLmsCourseKey(courseKey);
    if (!parsed.courseId || !parsed.groupId) return parsed.resourceKey || String(courseKey || '');
    return resolveCanonicalLmsResourceKey(`${parsed.courseId}::${parsed.groupId}${getLmsSectionSuffix(sectionType)}`);
}
function isLmsSectionScopedTab(tab) {
    return ['calls', 'workspace', 'materials', 'concepts', 'live-quiz', 'quiz', 'monitoring', 'attendance', 'whiteboard'].includes(String(tab || ''));
}
function getLmsQuizGroupResourceKey(courseKey = currentCourseId) {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(courseKey));
    if (!parsed.courseId || !parsed.groupId) return parsed.resourceKey || String(courseKey || '');
    return resolveCanonicalLmsResourceKey(`${parsed.courseId}::${parsed.groupId}`);
}
function getLmsSubjectIdFromResourceKey(resourceKey) {
    const parsed = parseLmsCourseKey(getLmsQuizGroupResourceKey(resourceKey));
    return parsed.courseId || '';
}
function getLmsTabCourseKey(tab) {
    const normalizedTab = String(tab || '');
    if (normalizedTab === 'quiz' || normalizedTab === 'monitoring') {
        return getLmsQuizGroupResourceKey(currentCourseId);
    }
    return isLmsSectionScopedTab(tab) ? getLmsSectionResourceKey(currentCourseId) : currentCourseId;
}
function syncLmsSectionSwitchPresentation() {
    const switchEl = document.getElementById('lms-section-switch');
    if (!switchEl) return;
    const sectionType = getCurrentLmsSectionType();
    const effectiveRole = getEffectiveUserRole();
    const meta = getLmsSectionMeta(sectionType);
    switchEl.dataset.activeSection = sectionType;
    switchEl.dataset.role = effectiveRole || '';
    switchEl.title = `${meta.label} view: ${meta.copy}`;
    LMS_SECTION_TYPES.forEach(type => {
        const button = document.getElementById(`lms-section-${type}`);
        if (!button) return;
        const isActive = type === sectionType;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        button.title = getLmsSectionMeta(type).copy;
    });
}
function setLmsActiveSection(sectionType) {
    const normalized = normalizeLmsSectionType(sectionType);
    if (!normalized) return;
    if (currentLmsSectionType === normalized) return;
    currentLmsSectionType = normalized;
    syncLmsSectionSwitchPresentation();
    if (typeof handleLmsPersonalDashboardSectionSwitch === 'function') handleLmsPersonalDashboardSectionSwitch();
    const activeTab = document.querySelector('#page-lms-inner [data-lms-tab].is-active')?.id?.replace(/^tab-/, '') || 'interaction';
    switchLMSTab(activeTab, { force: true });
}
function renderLmsRouteEmptyState(title, copy, icon = 'fa-inbox') {
    return `
        <div class="lms-route-empty">
            <div class="lms-route-empty-icon"><i class="fas ${escapeHtml(icon)}"></i></div>
            <div class="lms-route-empty-title lms-route-copy-mt-12">${escapeHtml(title)}</div>
            <div class="lms-route-empty-copy">${escapeHtml(copy)}</div>
        </div>
    `;
}
function renderLmsWeekPanelEmptyState(title, copy, icon = 'fa-inbox') {
    return `
        <div class="lms-week-accordion-empty">
            <div class="lms-route-empty lms-route-empty--week-panel">
                <div class="lms-route-empty-icon"><i class="fas ${escapeHtml(icon)}"></i></div>
                <div class="lms-route-empty-title">${escapeHtml(title)}</div>
                <div class="lms-route-empty-copy">${escapeHtml(copy)}</div>
            </div>
        </div>
    `;
}
function renderLmsRouteStats(stats = []) {
    if (!Array.isArray(stats) || !stats.length) return '';
    return `
        <div class="lms-route-stat-grid">
            ${stats.map(stat => `
                <div class="lms-route-stat">
                    <div class="lms-route-stat-label">${escapeHtml(stat.label || '')}</div>
                    <div class="lms-route-stat-value">${escapeHtml(stat.value ?? '')}</div>
                    ${stat.copy ? `<div class="lms-route-copy lms-route-copy-mt-6 lms-route-meta-12">${escapeHtml(stat.copy)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}
function renderLmsRouteKv(label, value) {
    return `
        <div class="lms-route-kv">
            <div class="lms-route-kv-label">${escapeHtml(label || '')}</div>
            <div class="lms-route-kv-value">${escapeHtml(value || 'Not listed')}</div>
        </div>
    `;
}
function renderLmsRouteWeekAccordion(title, subtitle, body, isOpen = false) {
    return `
        <section class="lms-route-panel lms-route-panel-compact lms-week-accordion-panel${isOpen ? '' : ' is-collapsed'}">
            <button type="button" class="lms-week-accordion-head" data-lms-click="toggleAccordion(this)" aria-expanded="${isOpen ? 'true' : 'false'}">
                <div class="lms-week-accordion-head-main">
                    <div class="lms-week-accordion-icon" aria-hidden="true"><i class="fas fa-calendar-week"></i></div>
                    <div class="lms-route-card-stack lms-route-card-stack-tight">
                        <div class="lms-route-card-title lms-route-card-title-16">${escapeHtml(title || 'No Week / General')}</div>
                        ${subtitle ? `<div class="lms-route-meta lms-route-meta-12">${escapeHtml(subtitle)}</div>` : ''}
                    </div>
                </div>
                <i class="fas fa-chevron-${isOpen ? 'up' : 'down'}" aria-hidden="true"></i>
            </button>
            <div class="lms-week-accordion-body"${isOpen ? '' : ' hidden'}>
                ${body}
            </div>
        </section>
    `;
}
function ensureLmsGradebookShell() {
    const wrapper = document.getElementById('lms-gradebook-wrapper');
    if (!wrapper) return null;
    if (wrapper.dataset.shellReady === '1') {
        const spreadsheet = document.getElementById('gradebook-spreadsheet-view');
        if (spreadsheet && !document.getElementById('gradebook-staff-lms-workspace')) {
            const studentView = document.getElementById('gradebook-student-view');
            const staffWorkspace = document.createElement('div');
            staffWorkspace.id = 'gradebook-staff-lms-workspace';
            staffWorkspace.className = 'gb-lms-staff-workspace lms-route-stack lms-route-stack-mb-16';
            staffWorkspace.hidden = true;
            if (studentView) {
                studentView.parentNode?.insertBefore(staffWorkspace, studentView);
            } else {
                spreadsheet.appendChild(staffWorkspace);
            }
        }
        return wrapper;
    }
    wrapper.innerHTML = `
        <div id="gradebook-roster-selection" class="lms-route-stack"></div>
        <div id="gradebook-spreadsheet-view" class="lms-route-stack" hidden>
            <div class="lms-route-panel lms-route-table-shell">
                <div class="lms-route-card-head lms-route-card-head-mb-18">
                    <div>
                        <div class="lms-route-eyebrow lms-route-inline lms-route-inline-gap-8"><i class="fas fa-chart-line"></i> Grades</div>
                        <div id="dynamic-gb-title" class="lms-route-title lms-route-title-26 lms-route-copy-mt-8">Open a roster to begin</div>
                        <div class="lms-route-copy lms-route-copy-mt-6">Quiz scores, assessments, and combined grades for this group</div>
                    </div>
                    <button type="button" class="lux-secondary-btn lms-route-btn-compact" data-lms-click="closeGradebookSpreadsheet()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
                <div id="gradebook-assessment-controls" class="lms-route-panel lms-route-panel-compact lms-route-stack-mb-16"></div>
                <div id="gradebook-staff-lms-workspace" class="gb-lms-staff-workspace lms-route-stack lms-route-stack-mb-16" hidden></div>
                <div id="gradebook-student-view" class="lms-route-stack lms-route-stack-mb-16" hidden></div>
                <div class="lms-route-table-wrap">
                    <table id="gradebook-table">
                        <thead><tr></tr></thead>
                        <tbody id="gradebook-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    wrapper.dataset.shellReady = '1';
    return wrapper;
}
function normalizeLmsDraftStorageKey(kind, key) {
    if (['material', 'assignment', 'concept'].includes(String(kind || '').toLowerCase())) {
        return resolveCanonicalLmsResourceKey(key);
    }
    return String(key || '');
}
function resolveActiveLmsQuizContext(courseKey = currentLmsQuizCourseKey || currentCourseId, faculty = getCurrentFaculty()) {
    const rawKey = String(courseKey || '').trim();
    if (!rawKey) return null;
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const resourceKey = getLmsQuizGroupResourceKey(resolveCanonicalLmsResourceKey(rawKey));
    const parsed = parseLmsCourseKey(resourceKey);
    if (!parsed.courseId || !parsed.groupId) return null;
    const subject = findCurriculumSubjectByIdOrTitle(parsed.courseId, '', normalizedFaculty)
        || findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty())
        || (getAllCurriculumSubjects() || []).find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.courseId))
        || null;
    const groupCandidates = getAvailableGroupsForSubject(subject?.id || parsed.courseId);
    const group = groupCandidates.find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.groupId))
        || null;
    return {
        resourceKey,
        courseId: subject?.id || parsed.courseId,
        groupId: group?.id || parsed.groupId,
        subject,
        group,
        faculty: normalizedFaculty,
        weeks: ensureLmsWeeksForKey(resourceKey)
    };
}
function ensureLmsStores() {
    if (!KIU_STATE.groupAssignments || typeof KIU_STATE.groupAssignments !== 'object') KIU_STATE.groupAssignments = {};
    if (!KIU_STATE.groupMaterials || typeof KIU_STATE.groupMaterials !== 'object') KIU_STATE.groupMaterials = {};
    if (!KIU_STATE.groupSubmissions || typeof KIU_STATE.groupSubmissions !== 'object') KIU_STATE.groupSubmissions = {};
    if (!KIU_STATE.groupConcepts || typeof KIU_STATE.groupConcepts !== 'object') KIU_STATE.groupConcepts = {};
    if (!KIU_STATE.groupConceptRatings || typeof KIU_STATE.groupConceptRatings !== 'object') KIU_STATE.groupConceptRatings = {};
    if (!KIU_STATE.groupWeekConfigs || typeof KIU_STATE.groupWeekConfigs !== 'object') KIU_STATE.groupWeekConfigs = {};
    if (!KIU_STATE.groupQuizzes || typeof KIU_STATE.groupQuizzes !== 'object') KIU_STATE.groupQuizzes = {};
    if (!KIU_STATE.groupQuizSubmissions || typeof KIU_STATE.groupQuizSubmissions !== 'object') KIU_STATE.groupQuizSubmissions = {};
    if (!KIU_STATE.lmsQuizBuilder || typeof KIU_STATE.lmsQuizBuilder !== 'object') KIU_STATE.lmsQuizBuilder = {};
    if (!KIU_STATE.lmsSubjectQuizBank || typeof KIU_STATE.lmsSubjectQuizBank !== 'object') KIU_STATE.lmsSubjectQuizBank = {};
    if (!KIU_STATE.lmsClassSessions || typeof KIU_STATE.lmsClassSessions !== 'object') KIU_STATE.lmsClassSessions = {};
    if (!KIU_STATE._lmsQuizMigrationRunning) {
        migrateLmsQuizSectionWorkspaces();
    }
    if (!KIU_STATE.lmsSessionMarkers || typeof KIU_STATE.lmsSessionMarkers !== 'object') KIU_STATE.lmsSessionMarkers = {};
    if (!KIU_STATE.lmsLiveQuizzes || typeof KIU_STATE.lmsLiveQuizzes !== 'object') KIU_STATE.lmsLiveQuizzes = {};
    if (!KIU_STATE.assignments || typeof KIU_STATE.assignments !== 'object') KIU_STATE.assignments = {};
    if (!KIU_STATE.submissions || typeof KIU_STATE.submissions !== 'object') KIU_STATE.submissions = {};
}
function normalizeLmsQuizStoredRecord(quiz = {}) {
    const normalizedStatus = ['draft', 'published', 'closed'].includes(String(quiz?.status || '').trim().toLowerCase())
        ? String(quiz.status).trim().toLowerCase()
        : (quiz.isPublished !== false ? 'published' : 'draft');
    const questions = normalizeLmsQuizQuestionList(quiz.questions);
    const variants = normalizeLmsQuizVariantList(quiz.variants);
    const normalizedVariantCount = Math.min(8, Math.max(1, parseInt(quiz.variantCount, 10) || variants.length || 3));
    const normalizedQuestionsPerVariant = Math.max(1, parseInt(quiz.questionsPerVariant, 10) || Math.min(questions.length || 1, 10));
    const normalizedStudentVariantMap = normalizeLmsQuizStudentVariantMap(quiz.studentVariantMap, variants);
    return {
        ...quiz,
        status: normalizedStatus,
        assessmentType: normalizeLmsQuizAssessmentType(quiz.assessmentType || 'quiz'),
        weekLabel: normalizeLmsWeekLabel(quiz.weekLabel || ''),
        questions,
        variantEnabled: quiz.variantEnabled === true,
        variantCount: normalizedVariantCount,
        questionsPerVariant: normalizedQuestionsPerVariant,
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        variants,
        studentVariantMap: normalizedStudentVariantMap,
        durationMinutes: Math.max(1, parseInt(quiz.durationMinutes, 10) || 20),
        isPublished: normalizedStatus === 'closed'
            ? true
            : (normalizedStatus === 'published' ? true : quiz.isPublished !== false),
        attendanceRequired: quiz.attendanceRequired !== false,
        submissionsVisible: quiz.submissionsVisible !== false,
        publishedAt: quiz.publishedAt || null,
        publishedBy: quiz.publishedBy || '',
        publishMode: ['manual', 'scheduled'].includes(String(quiz.publishMode || '').trim().toLowerCase())
            ? String(quiz.publishMode).trim().toLowerCase()
            : 'manual',
        allowedStudentIds: Array.isArray(quiz.allowedStudentIds) ? quiz.allowedStudentIds.map(id => String(id)) : [],
        attendanceMode: String(quiz.attendanceMode || 'manual-access-list'),
        lockedAfterPublish: quiz.lockedAfterPublish !== false,
        examSessionId: quiz.examSessionId ? String(quiz.examSessionId) : null,
        requiresBlueExamNetwork: quiz.requiresBlueExamNetwork === true,
        blueSessionMode: String(quiz.blueSessionMode || 'helper-session'),
        attendanceGateEnabled: quiz.attendanceGateEnabled !== false
    };
}
function normalizeLmsQuizQuestion(question = {}, options = {}) {
    const questionType = String(question?.type || 'mcq') === 'written' ? 'written' : 'mcq';
    const optionCount = questionType === 'written'
        ? 0
        : Math.min(6, Math.max(2, parseInt(question?.optionCount, 10) || (question?.options || []).length || 4));
    return {
        id: question?.id || makeAdminExamEntityId(options.variantClone ? 'lms-variant-question' : 'lms-question'),
        sourceQuestionId: question?.sourceQuestionId || (options.variantClone ? String(question?.id || makeAdminExamEntityId('lms-question')) : null),
        type: questionType,
        text: String(question?.text || ''),
        score: Math.max(1, parseInt(question?.score, 10) || 1),
        optionCount,
        options: questionType === 'written'
            ? []
            : Array.from({ length: optionCount }, (_, index) => String(question?.options?.[index] || '')),
        correctOption: questionType === 'written'
            ? null
            : Math.min(optionCount - 1, Math.max(0, parseInt(question?.correctOption, 10) || 0)),
        expectedAnswer: String(question?.expectedAnswer || '')
    };
}
function normalizeLmsQuizQuestionList(questions = [], options = {}) {
    return Array.isArray(questions) ? questions.map(question => normalizeLmsQuizQuestion(question, options)) : [];
}
function cloneLmsQuizQuestionForVariant(question = {}) {
    return normalizeLmsQuizQuestion({
        ...JSON.parse(JSON.stringify(question || {})),
        sourceQuestionId: question?.sourceQuestionId || question?.id || null
    }, { variantClone: true });
}
function getDefaultLmsQuizVariantLabel(index = 0) {
    return `Variant ${String.fromCharCode(65 + Math.max(0, Number(index || 0)))}`;
}
function normalizeLmsQuizVariantRecord(variant = {}, index = 0) {
    return {
        id: String(variant?.id || makeAdminExamEntityId('lms-variant')),
        label: String(variant?.label || getDefaultLmsQuizVariantLabel(index)),
        customized: variant?.customized === true,
        generatedAt: variant?.generatedAt || null,
        questions: normalizeLmsQuizQuestionList(variant?.questions, { variantClone: true })
    };
}
function normalizeLmsQuizVariantList(variants = []) {
    return Array.isArray(variants) ? variants.map((variant, index) => normalizeLmsQuizVariantRecord(variant, index)) : [];
}
function normalizeLmsQuizStudentVariantMap(studentVariantMap = {}, variants = []) {
    const allowedVariantIds = new Set((variants || []).map(variant => String(variant.id)));
    if (!studentVariantMap || typeof studentVariantMap !== 'object') return {};
    return Object.entries(studentVariantMap).reduce((accumulator, [studentId, variantId]) => {
        const normalizedStudentId = String(studentId || '').trim();
        const normalizedVariantId = String(variantId || '').trim();
        if (!normalizedStudentId || !normalizedVariantId || !allowedVariantIds.has(normalizedVariantId)) return accumulator;
        accumulator[normalizedStudentId] = normalizedVariantId;
        return accumulator;
    }, {});
}
function shuffleLmsQuizItems(items = []) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
}
function calculateLmsQuizVariantQuestionMix(baseQuestions = [], questionsPerVariant = 1) {
    const safeQuestionsPerVariant = Math.max(1, Number(questionsPerVariant || 1));
    const writtenCount = baseQuestions.filter(question => String(question?.type || 'mcq') === 'written').length;
    const mcqCount = Math.max(0, baseQuestions.length - writtenCount);
    if (!baseQuestions.length) {
        return { mcq: safeQuestionsPerVariant, written: 0 };
    }
    let desiredWritten = Math.round((writtenCount / baseQuestions.length) * safeQuestionsPerVariant);
    desiredWritten = Math.max(0, Math.min(writtenCount, desiredWritten));
    let desiredMcq = Math.max(0, safeQuestionsPerVariant - desiredWritten);
    if (!mcqCount && desiredMcq > 0) {
        desiredWritten = safeQuestionsPerVariant;
        desiredMcq = 0;
    }
    if (!writtenCount && desiredWritten > 0) {
        desiredMcq = safeQuestionsPerVariant;
        desiredWritten = 0;
    }
    if (desiredWritten + desiredMcq < safeQuestionsPerVariant) {
        desiredMcq += safeQuestionsPerVariant - (desiredWritten + desiredMcq);
    }
    return { mcq: desiredMcq, written: desiredWritten };
}
function pickLmsQuizVariantQuestionsFromPool(pool = [], count = 0, usedSourceIds = new Set()) {
    if (!count) return [];
    const shuffled = shuffleLmsQuizItems(pool);
    const uniqueFirst = shuffled.filter(question => !usedSourceIds.has(String(question?.sourceQuestionId || question?.id || '')));
    const selection = [];
    uniqueFirst.slice(0, count).forEach(question => selection.push(question));
    if (selection.length < count) {
        shuffled.forEach(question => {
            if (selection.length >= count) return;
            if (selection.includes(question)) return;
            selection.push(question);
        });
    }
    return selection.slice(0, count);
}
function buildLmsQuizVariantQuestionSet(baseQuestions = [], questionsPerVariant = 1, variantCount = 1) {
    const safeBaseQuestions = normalizeLmsQuizQuestionList(baseQuestions);
    const safeQuestionsPerVariant = Math.max(1, parseInt(questionsPerVariant, 10) || 1);
    const safeVariantCount = Math.min(8, Math.max(1, parseInt(variantCount, 10) || 1));
    const mix = calculateLmsQuizVariantQuestionMix(safeBaseQuestions, safeQuestionsPerVariant);
    const mcqPool = safeBaseQuestions.filter(question => String(question.type || 'mcq') !== 'written');
    const writtenPool = safeBaseQuestions.filter(question => String(question.type || 'mcq') === 'written');
    const usedSourceIds = new Set();
    const variants = [];
    let overlapFallbackUsed = false;
    for (let index = 0; index < safeVariantCount; index += 1) {
        const desiredWritten = Math.min(mix.written, safeQuestionsPerVariant);
        const desiredMcq = Math.max(0, safeQuestionsPerVariant - desiredWritten);
        const writtenSelection = pickLmsQuizVariantQuestionsFromPool(writtenPool, desiredWritten, usedSourceIds);
        const mcqSelection = pickLmsQuizVariantQuestionsFromPool(mcqPool, desiredMcq, usedSourceIds);
        const selected = [...writtenSelection, ...mcqSelection];
        if (selected.length < safeQuestionsPerVariant) {
            overlapFallbackUsed = true;
            const fallbackPool = shuffleLmsQuizItems(safeBaseQuestions);
            fallbackPool.forEach(question => {
                if (selected.length >= safeQuestionsPerVariant) return;
                if (selected.includes(question)) return;
                selected.push(question);
            });
        }
        selected.forEach(question => usedSourceIds.add(String(question?.sourceQuestionId || question?.id || '')));
        variants.push(normalizeLmsQuizVariantRecord({
            id: makeAdminExamEntityId('lms-variant'),
            label: getDefaultLmsQuizVariantLabel(index),
            customized: false,
            generatedAt: new Date().toISOString(),
            questions: shuffleLmsQuizItems(selected).map(cloneLmsQuizQuestionForVariant)
        }, index));
    }
    return {
        variants,
        overlapFallbackUsed
    };
}
function reconcileLmsQuizStudentVariantMap(quiz = {}, allowedStudentIds = []) {
    const variants = normalizeLmsQuizVariantList(quiz?.variants);
    const validVariantIds = new Set(variants.map(variant => String(variant.id)));
    const selectedIds = Array.isArray(allowedStudentIds) ? allowedStudentIds.map(id => String(id)) : [];
    if (!variants.length || !selectedIds.length) return {};
    const existingMap = normalizeLmsQuizStudentVariantMap(quiz?.studentVariantMap, variants);
    const variantCounts = variants.reduce((accumulator, variant) => {
        accumulator[String(variant.id)] = 0;
        return accumulator;
    }, {});
    const nextMap = {};
    selectedIds.forEach(studentId => {
        const existingVariantId = existingMap[String(studentId)];
        if (existingVariantId && validVariantIds.has(existingVariantId)) {
            nextMap[String(studentId)] = existingVariantId;
            variantCounts[existingVariantId] = (variantCounts[existingVariantId] || 0) + 1;
        }
    });
    selectedIds.forEach(studentId => {
        const normalizedStudentId = String(studentId);
        if (nextMap[normalizedStudentId]) return;
        const nextVariant = [...variants].sort((left, right) => {
            const leftCount = variantCounts[String(left.id)] || 0;
            const rightCount = variantCounts[String(right.id)] || 0;
            if (leftCount !== rightCount) return leftCount - rightCount;
            return String(left.label || '').localeCompare(String(right.label || ''));
        })[0];
        if (!nextVariant?.id) return;
        nextMap[normalizedStudentId] = String(nextVariant.id);
        variantCounts[String(nextVariant.id)] = (variantCounts[String(nextVariant.id)] || 0) + 1;
    });
    return nextMap;
}
function getLmsQuizVariantById(quiz = {}, variantId = '') {
    const normalizedId = String(variantId || '').trim();
    if (!normalizedId) return null;
    return normalizeLmsQuizVariantList(quiz?.variants).find(variant => String(variant.id) === normalizedId) || null;
}
function getLmsQuizAssignedVariant(quiz = {}, studentId = '') {
    if (quiz?.variantEnabled !== true) return null;
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedStudentId) return null;
    const variantId = quiz?.studentVariantMap?.[normalizedStudentId];
    return getLmsQuizVariantById(quiz, variantId);
}
function getLmsQuizQuestionsForStudent(quiz = {}, studentId = '', submission = null) {
    if (submission?.variantId) {
        const variantFromSubmission = getLmsQuizVariantById(quiz, submission.variantId);
        if (variantFromSubmission?.questions?.length) return variantFromSubmission.questions;
    }
    const assignedVariant = getLmsQuizAssignedVariant(quiz, studentId);
    if (assignedVariant?.questions?.length) return assignedVariant.questions;
    return normalizeLmsQuizQuestionList(quiz?.questions);
}
function getLmsQuizQuestionCount(quiz = {}, studentId = '', submission = null) {
    return getLmsQuizQuestionsForStudent(quiz, studentId, submission).length;
}
function getLmsQuizVariantSummary(quiz = {}) {
    if (quiz?.variantEnabled !== true || !Array.isArray(quiz?.variants) || !quiz.variants.length) return '';
    return `${quiz.variants.length} variants  -  ${Math.max(1, Number(quiz.questionsPerVariant || quiz.variants[0]?.questions?.length || 0))} questions each`;
}
function getLmsQuizVariantAssignmentSummary(quiz = {}) {
    if (quiz?.variantEnabled !== true || !Array.isArray(quiz?.variants) || !quiz.variants.length) return [];
    const counts = (quiz.variants || []).reduce((accumulator, variant) => {
        accumulator[String(variant.id)] = 0;
        return accumulator;
    }, {});
    Object.values(quiz?.studentVariantMap || {}).forEach(variantId => {
        const key = String(variantId || '');
        if (Object.prototype.hasOwnProperty.call(counts, key)) {
            counts[key] += 1;
        }
    });
    return (quiz.variants || []).map(variant => ({
        id: String(variant.id),
        label: String(variant.label || ''),
        count: counts[String(variant.id)] || 0
    }));
}
function getLmsQuizWorkspaceBucketName(status = 'draft') {
    const normalized = String(status || 'draft').trim().toLowerCase();
    if (normalized === 'published') return 'published';
    if (normalized === 'closed') return 'closed';
    return 'drafts';
}
function extractLmsQuizContentRecord(quiz = {}, subjectId = '') {
    const normalized = normalizeLmsQuizStoredRecord(quiz);
    return {
        id: String(quiz.id || normalized.id || makeAdminExamEntityId('lms-quiz')),
        subjectId: String(subjectId || quiz.subjectId || normalized.subjectId || ''),
        subjectName: String(quiz.subjectName || normalized.subjectName || subjectId || ''),
        title: String(quiz.title || normalized.title || '').trim(),
        assessmentType: normalized.assessmentType,
        assessmentNumber: normalizeAssessmentNumber(quiz.assessmentNumber ?? normalized.assessmentNumber, 1),
        weekLabel: normalized.weekLabel,
        instructions: String(quiz.instructions || ''),
        questions: normalized.questions,
        variantEnabled: normalized.variantEnabled,
        variantCount: normalized.variantCount,
        questionsPerVariant: normalized.questionsPerVariant,
        variantAssignmentMode: normalized.variantAssignmentMode,
        variantGenerationMode: normalized.variantGenerationMode,
        variantOverlapPolicy: normalized.variantOverlapPolicy,
        variants: normalized.variants,
        studentVariantMap: normalized.studentVariantMap,
        durationMinutes: normalized.durationMinutes,
        availableFrom: String(quiz.availableFrom || ''),
        availableUntil: String(quiz.availableUntil || ''),
        createdInGroupId: String(quiz.createdInGroupId || normalized.createdInGroupId || quiz.groupId || quiz.assignedGroupId || '').trim(),
        createdInGroupName: String(quiz.createdInGroupName || normalized.createdInGroupName || quiz.groupName || quiz.assignedGroupName || '').trim(),
        createdAt: quiz.createdAt || new Date().toISOString(),
        updatedAt: quiz.updatedAt || new Date().toISOString()
    };
}
function snapshotLmsQuizContentForDeployment(contentQuiz = {}) {
    const snapshot = extractLmsQuizContentRecord(contentQuiz, contentQuiz.subjectId || '');
    return JSON.parse(JSON.stringify({
        ...snapshot,
        snapshottedAt: new Date().toISOString()
    }));
}
function extractLmsQuizDeploymentRecord(quiz = {}, resourceKey = '') {
    const normalized = normalizeLmsQuizStoredRecord(quiz);
    const groupKey = getLmsQuizGroupResourceKey(resourceKey);
    const parsed = parseLmsCourseKey(groupKey);
    return {
        quizId: String(quiz.id || normalized.id),
        resourceKey: groupKey,
        groupId: String(quiz.groupId || quiz.assignedGroupId || parsed.groupId || ''),
        groupName: String(quiz.groupName || quiz.assignedGroupName || ''),
        assignedGroupId: String(quiz.assignedGroupId || quiz.groupId || parsed.groupId || ''),
        assignedGroupName: String(quiz.assignedGroupName || quiz.groupName || ''),
        status: normalized.status,
        isPublished: normalized.isPublished,
        allowedStudentIds: normalized.allowedStudentIds,
        publishedAt: normalized.publishedAt,
        publishedBy: normalized.publishedBy,
        publishMode: normalized.publishMode,
        lockedAfterPublish: normalized.lockedAfterPublish,
        attendanceMode: normalized.attendanceMode,
        attendanceRequired: normalized.attendanceRequired,
        attendanceGateEnabled: normalized.attendanceGateEnabled,
        requiresBlueExamNetwork: normalized.requiresBlueExamNetwork,
        blueSessionMode: normalized.blueSessionMode,
        antiCheatPolicy: quiz.antiCheatPolicy || null,
        examSessionId: normalized.examSessionId,
        submissionsVisible: normalized.submissionsVisible,
        contentSnapshot: quiz.contentSnapshot && typeof quiz.contentSnapshot === 'object'
            ? JSON.parse(JSON.stringify(quiz.contentSnapshot))
            : null,
        updatedAt: quiz.updatedAt || new Date().toISOString()
    };
}
function mergeLmsQuizWithDeployment(contentQuiz, deployment = null, resourceKey = '') {
    if (!contentQuiz) return null;
    const groupKey = getLmsQuizGroupResourceKey(resourceKey || deployment?.resourceKey || '');
    if (!deployment) {
        return normalizeLmsQuizStoredRecord({
            ...contentQuiz,
            resourceKey: groupKey,
            status: 'draft',
            isPublished: false,
            allowedStudentIds: [],
            publishedAt: null,
            publishedBy: '',
            publishMode: 'manual'
        });
    }
    const deploymentStatus = String(deployment.status || 'draft').toLowerCase();
    const useSnapshot = ['published', 'closed'].includes(deploymentStatus)
        && deployment.contentSnapshot
        && typeof deployment.contentSnapshot === 'object';
    const contentBase = useSnapshot
        ? {
            ...contentQuiz,
            ...deployment.contentSnapshot,
            id: contentQuiz.id,
            subjectId: contentQuiz.subjectId,
            subjectName: contentQuiz.subjectName
        }
        : contentQuiz;
    const { contentSnapshot: _snapshot, quizId: _quizId, ...deploymentFields } = deployment;
    const merged = normalizeLmsQuizStoredRecord({
        ...contentBase,
        ...deploymentFields,
        id: contentQuiz.id,
        resourceKey: groupKey || deployment.resourceKey
    });
    delete merged.contentSnapshot;
    return merged;
}
function ensureLmsSubjectQuizBank(subjectId) {
    ensureLmsStores();
    const key = String(subjectId || '').trim();
    if (!key) return { drafts: [] };
    KIU_STATE.lmsSubjectQuizBank[key] = KIU_STATE.lmsSubjectQuizBank[key] || {};
    const bank = KIU_STATE.lmsSubjectQuizBank[key];
    bank.drafts = Array.isArray(bank.drafts) ? bank.drafts.map(item => extractLmsQuizContentRecord(item, key)) : [];
    return bank;
}
function getLmsSubjectQuizDrafts(subjectId) {
    return sortLmsQuizzes(ensureLmsSubjectQuizBank(subjectId).drafts);
}
function getLmsSubjectQuizById(subjectId, quizId) {
    return getLmsSubjectQuizDrafts(subjectId).find(item => String(item.id) === String(quizId)) || null;
}
function saveLmsSubjectQuizRecord(subjectId, quiz, options = {}) {
    const bank = ensureLmsSubjectQuizBank(subjectId);
    const normalized = extractLmsQuizContentRecord(quiz, subjectId);
    const quizId = String(normalized.id);
    const index = bank.drafts.findIndex(item => String(item.id) === quizId);
    if (index >= 0 && options.preserveIfNewer) {
        const existing = bank.drafts[index];
        const existingTime = new Date(existing.updatedAt || 0).getTime();
        const newTime = new Date(normalized.updatedAt || 0).getTime();
        if (Number.isFinite(existingTime) && Number.isFinite(newTime) && newTime < existingTime) {
            return existing;
        }
    }
    if (index >= 0) {
        const existing = bank.drafts[index];
        normalized.createdInGroupId = existing.createdInGroupId || normalized.createdInGroupId;
        normalized.createdInGroupName = existing.createdInGroupName || normalized.createdInGroupName;
    } else if (!normalized.createdInGroupId) {
        normalized.createdInGroupId = String(quiz.groupId || quiz.assignedGroupId || '').trim();
        normalized.createdInGroupName = String(quiz.groupName || quiz.assignedGroupName || normalized.createdInGroupId).trim();
    }
    if (index >= 0) bank.drafts[index] = normalized;
    else bank.drafts.unshift(normalized);
    bank.drafts = sortLmsQuizzes(bank.drafts);
    return normalized;
}
function removeLmsSubjectQuizRecord(subjectId, quizId) {
    const bank = ensureLmsSubjectQuizBank(subjectId);
    bank.drafts = bank.drafts.filter(item => String(item.id) !== String(quizId));
}
function isLmsSubjectQuizPublishedAnywhere(subjectId, quizId) {
    const normalizedSubjectId = canonicalCourseKey(subjectId);
    const normalizedQuizId = String(quizId || '');
    if (!normalizedSubjectId || !normalizedQuizId) return false;
    const builder = KIU_STATE.lmsQuizBuilder || {};
    return Object.keys(builder).some(resourceKey => {
        const parsed = parseLmsCourseKey(resourceKey);
        if (canonicalCourseKey(parsed.courseId) !== normalizedSubjectId) return false;
        const workspace = builder[resourceKey];
        const deployment = workspace?.deployments?.[normalizedQuizId];
        if (deployment && ['published', 'closed'].includes(String(deployment.status || '').toLowerCase())) {
            return true;
        }
        return ['published', 'closed'].some(bucket =>
            (workspace?.[bucket] || []).some(item => String(item.id) === normalizedQuizId)
        );
    });
}

        const api = {
            renderLmsGlassDialogHead,
            renderLmsGlassDialogCard,
            toDomToken,
            normalizeLmsSectionType,
            getDefaultLmsSectionTypeForRole,
            getCurrentLmsSectionType,
            getLmsSectionMeta,
            getLmsSectionSuffix,
            stripLmsSectionSuffix,
            parseLmsCourseKey,
            isLmsPersonalBoardKey,
            getLmsPersonalBoardOwnerId,
            isLmsPersonalBoardOwner,
            buildLmsPersonalBoardKey,
            getLmsPersonalDashboardCourseId,
            resolveCanonicalLmsResourceKey,
            joinLmsMeta,
            getLmsSectionResourceKey,
            isLmsSectionScopedTab,
            getLmsQuizGroupResourceKey,
            getLmsSubjectIdFromResourceKey,
            getLmsTabCourseKey,
            syncLmsSectionSwitchPresentation,
            setLmsActiveSection,
            renderLmsRouteEmptyState,
            renderLmsWeekPanelEmptyState,
            renderLmsRouteStats,
            renderLmsRouteKv,
            renderLmsRouteWeekAccordion,
            ensureLmsGradebookShell,
            normalizeLmsDraftStorageKey,
            resolveActiveLmsQuizContext,
            ensureLmsStores,
            normalizeLmsQuizStoredRecord,
            normalizeLmsQuizQuestion,
            normalizeLmsQuizQuestionList,
            cloneLmsQuizQuestionForVariant,
            getDefaultLmsQuizVariantLabel,
            normalizeLmsQuizVariantRecord,
            normalizeLmsQuizVariantList,
            normalizeLmsQuizStudentVariantMap,
            shuffleLmsQuizItems,
            calculateLmsQuizVariantQuestionMix,
            pickLmsQuizVariantQuestionsFromPool,
            buildLmsQuizVariantQuestionSet,
            reconcileLmsQuizStudentVariantMap,
            getLmsQuizVariantById,
            getLmsQuizAssignedVariant,
            getLmsQuizQuestionsForStudent,
            getLmsQuizQuestionCount,
            getLmsQuizVariantSummary,
            getLmsQuizVariantAssignmentSummary,
            getLmsQuizWorkspaceBucketName,
            extractLmsQuizContentRecord,
            snapshotLmsQuizContentForDeployment,
            extractLmsQuizDeploymentRecord,
            mergeLmsQuizWithDeployment,
            ensureLmsSubjectQuizBank,
            getLmsSubjectQuizDrafts,
            getLmsSubjectQuizById,
            saveLmsSubjectQuizRecord,
            removeLmsSubjectQuizRecord,
            isLmsSubjectQuizPublishedAnywhere,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsSectionQuizApi({});
})();
