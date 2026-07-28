(function initExamConsole() {
    const legacyRenderAdminExamSection = typeof window.renderAdminExamSection === 'function'
        ? window.renderAdminExamSection
        : null;

    const ROOT_ID = 'admin-exams-root';
    const STAFF_ROLES = new Set(['admin', 'professor', 'ta']);
    const ADMIN_ROLES = new Set(['admin']);
    const MANUAL_TYPES = new Set(['short', 'written']);
    const TEMPLATE_STATUSES = ['draft', 'submitted', 'in_review', 'approved', 'returned', 'archived'];
    const TABS = ['templates', 'review', 'schedule', 'live', 'results'];
    const STAFF_SUB_TABS = ['my_drafts', 'shared_with_me', 'sent_to_admin'];
    const EXAMS_ADMIN_MODULE_URL = 'assets/js/pages/exams-console-admin.js?v=20260516-examsadmin1';
    const EXAMS_BUILDER_MODULE_URL = 'assets/js/pages/exams-console-builder.js?v=20260516-examsbuilder1';
    const EXAMS_ATTEMPTS_MODULE_URL = 'assets/js/pages/exams-console-attempts.js?v=20260516-examsattempts1';

    const runtime = {
        activeTab: 'templates',
        staffSubTab: 'my_drafts',
        templateDraft: null,
        templateStep: 'details',
        templateSearch: '',
        templateFilter: 'all',
        scheduleDraft: null,
        selectedSessionId: '',
        attemptsBySessionId: {},
        manualScoreDrafts: {},
        /* â”€â”€ New: Variant & Sharing â”€â”€ */
        autoGenVariantCount: 3,
        autoGenQuestionsPerVariant: 10,
        showShareModal: false,
        shareSearchQuery: '',
        showReturnModal: false,
        returnTemplateId: '',
        returnNote: '',
        /* â”€â”€ New: Room splitting â”€â”€ */
        splitStudentCount: 0,
        splitRoomLabel: '',
        splitTimeSlot: '',
        /* â”€â”€ Paginated question bank â”€â”€ */
        currentBankPage: 0,
        renderCache: {},
        renderPass: null,
        /* Review Queue triage state */
        reviewSearch: '',
        reviewSort: 'oldest',
        reviewFaculty: 'all',
        reviewApprovedCollapsed: true
    };
    let examsAdminModulePromise = null;
    let examsBuilderModulePromise = null;
    let examsAttemptsModulePromise = null;

    function escapeHtml(value) {
        if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
            const shared = window.escapeHtml;
            if (shared !== escapeHtml) return shared(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    function uniqueStrings(values = []) {
        return [...new Set((values || []).flatMap(value => Array.isArray(value) ? value : [value]).map(value => String(value || '').trim()).filter(Boolean))];
    }

    function toFieldToken(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'field';
    }

    function hasExamsAttemptsModule() {
        return Boolean(
            window.__KIU_EXAMS_ATTEMPTS_MODULE_LOADED
            && typeof window.renderExamLiveTab === 'function'
            && typeof window.renderExamResultsTab === 'function'
            && window.renderExamLiveTab !== renderLiveTab
            && window.renderExamResultsTab !== renderResultsTab
        );
    }

    function ensureExamsAttemptsModule() {
        if (hasExamsAttemptsModule()) return Promise.resolve(true);
        if (examsAttemptsModulePromise) return examsAttemptsModulePromise;
        examsAttemptsModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${EXAMS_ATTEMPTS_MODULE_URL}"]`);
            const onLoad = () => hasExamsAttemptsModule()
                ? resolve(true)
                : reject(new Error('Exams attempts module did not register the live/results renderers.'));
            if (existing) {
                if (hasExamsAttemptsModule()) {
                    resolve(true);
                    return;
                }
                existing.addEventListener('load', onLoad, { once: true });
                existing.addEventListener('error', () => reject(new Error('Exams attempts module failed to load.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = EXAMS_ATTEMPTS_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', () => reject(new Error('Exams attempts module failed to load.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Failed to load deferred exams attempts module.', error);
            throw error;
        }).finally(() => {
            examsAttemptsModulePromise = null;
        });
        return examsAttemptsModulePromise;
    }

    function hasExamsBuilderModule() {
        return Boolean(
            window.__KIU_EXAMS_BUILDER_MODULE_LOADED
            && typeof window.renderExamTemplateBuilder === 'function'
            && window.renderExamTemplateBuilder !== renderTemplateBuilder
        );
    }

    function ensureExamsBuilderModule() {
        if (hasExamsBuilderModule()) return Promise.resolve(true);
        if (examsBuilderModulePromise) return examsBuilderModulePromise;
        examsBuilderModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${EXAMS_BUILDER_MODULE_URL}"]`);
            const onLoad = () => hasExamsBuilderModule()
                ? resolve(true)
                : reject(new Error('Exams builder module did not register the template builder renderer.'));
            if (existing) {
                if (hasExamsBuilderModule()) {
                    resolve(true);
                    return;
                }
                existing.addEventListener('load', onLoad, { once: true });
                existing.addEventListener('error', () => reject(new Error('Exams builder module failed to load.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = EXAMS_BUILDER_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', () => reject(new Error('Exams builder module failed to load.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Failed to load deferred exams builder module.', error);
            throw error;
        }).finally(() => {
            examsBuilderModulePromise = null;
        });
        return examsBuilderModulePromise;
    }

    function hasExamsAdminModule() {
        return Boolean(
            window.__KIU_EXAMS_ADMIN_MODULE_LOADED
            && typeof window.renderExamReviewTab === 'function'
            && typeof window.renderExamScheduleBoard === 'function'
            && window.renderExamReviewTab !== renderReviewTab
            && window.renderExamScheduleBoard !== renderScheduleBoard
        );
    }

    function ensureExamsAdminModule() {
        if (hasExamsAdminModule()) return Promise.resolve(true);
        if (examsAdminModulePromise) return examsAdminModulePromise;
        examsAdminModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${EXAMS_ADMIN_MODULE_URL}"]`);
            const onLoad = () => hasExamsAdminModule()
                ? resolve(true)
                : reject(new Error('Exams admin module did not register review/schedule renderers.'));
            if (existing) {
                if (hasExamsAdminModule()) {
                    resolve(true);
                    return;
                }
                existing.addEventListener('load', onLoad, { once: true });
                existing.addEventListener('error', () => reject(new Error('Exams admin module failed to load.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = EXAMS_ADMIN_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', () => reject(new Error('Exams admin module failed to load.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Failed to load deferred exams admin module.', error);
            throw error;
        }).finally(() => {
            examsAdminModulePromise = null;
        });
        return examsAdminModulePromise;
    }

    function makeLocalId(prefix = 'id') {
        if (typeof makeId === 'function') return makeId(prefix);
        return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function parseDate(value) {
        if (!value) return 0;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }

    function formatDateTime(value) {
        if (!value) return 'Not scheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value || '');
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatShortDate(value) {
        if (!value) return 'Unscheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value || '');
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
    }

    function formatCountdown(target) {
        const timestamp = parseDate(target);
        if (!timestamp) return 'No start time';
        const delta = timestamp - Date.now();
        if (delta <= 0) return 'Live now';
        const totalMinutes = Math.floor(delta / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hours || days) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);
        return parts.join(' ');
    }

    function getRole() {
        try {
            return String(typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : 'student').trim().toLowerCase() || 'student';
        } catch (error) {
            return 'student';
        }
    }

    function getCurrentUserSafe() {
        try {
            return typeof getCurrentUser === 'function' ? (getCurrentUser() || null) : null;
        } catch (error) {
            return null;
        }
    }

    function getCurrentFacultyCode() {
        try {
            return String(typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '').trim().toUpperCase() || 'ECON';
        } catch (error) {
            return 'ECON';
        }
    }

    function getFacultyLabelSafe(code = '') {
        try {
            if (typeof getFacultyLabel === 'function') return String(getFacultyLabel(code) || code || '').trim();
        } catch (error) {}
        const profiles = KIU_STATE?.facultyProfiles || KIU_EMPTY_STATE?.facultyProfiles || {};
        return String(profiles?.[code]?.name || code || '').trim();
    }

    function getCurrentStaffName() {
        const user = getCurrentUserSafe();
        return String(user?.displayName || user?.nameEn || user?.name || user?.email || user?.id || 'Staff').trim();
    }

    function canUseCrossFacultyExamView() {
        return ADMIN_ROLES.has(getRole()) || (typeof userHasPortalPrivilege === 'function' && userHasPortalPrivilege('cross_faculty_exam_access'));
    }

    function persistState() {
        if (typeof saveState === 'function') saveState();
    }

    function notify(message) {
        if (typeof showToast === 'function') showToast(message);
    }

    function ensureStores() {
        if (!KIU_STATE || typeof KIU_STATE !== 'object') return;
        if (!KIU_STATE.examTemplatesByFaculty || typeof KIU_STATE.examTemplatesByFaculty !== 'object') KIU_STATE.examTemplatesByFaculty = {};
        if (!KIU_STATE.examTemplateLinksByTemplateId || typeof KIU_STATE.examTemplateLinksByTemplateId !== 'object') KIU_STATE.examTemplateLinksByTemplateId = {};
        if (!KIU_STATE.examSessionsById || typeof KIU_STATE.examSessionsById !== 'object') KIU_STATE.examSessionsById = {};
        if (!KIU_STATE.examQuestionDefaultsBySubject || typeof KIU_STATE.examQuestionDefaultsBySubject !== 'object') KIU_STATE.examQuestionDefaultsBySubject = {};
    }

    function clampPositiveInt(value, fallback = 1, min = 1, max = 999) {
        const parsed = parseInt(value, 10);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(min, Math.min(max, parsed));
    }

    function getSubjectDefaultKey(subjectId = '') {
        return String(subjectId || 'global').trim().toUpperCase() || 'GLOBAL';
    }

    function getQuestionDefaultsForSubject(subjectId = '') {
        ensureStores();
        const stored = KIU_STATE?.examQuestionDefaultsBySubject?.[getSubjectDefaultKey(subjectId)] || {};
        return {
            score: clampPositiveInt(stored.score, 1, 1, 999),
            optionCount: clampPositiveInt(stored.optionCount, 4, 2, 8)
        };
    }

    function saveQuestionDefaultsForSubject(subjectId = '', defaults = {}) {
        ensureStores();
        if (!KIU_STATE?.examQuestionDefaultsBySubject) return;
        const key = getSubjectDefaultKey(subjectId);
        KIU_STATE.examQuestionDefaultsBySubject[key] = {
            score: clampPositiveInt(defaults.score, 1, 1, 999),
            optionCount: clampPositiveInt(defaults.optionCount, 4, 2, 8),
            updatedAt: new Date().toISOString()
        };
        persistState();
    }

    function getDraftQuestionDefaults(draft = {}) {
        return {
            score: clampPositiveInt(draft.defaultQuestionScore, getQuestionDefaultsForSubject(draft.subjectId).score, 1, 999),
            optionCount: clampPositiveInt(draft.defaultOptionCount, getQuestionDefaultsForSubject(draft.subjectId).optionCount, 2, 8)
        };
    }

    function formatCourseYearLabel(courseNumber = '') {
        const value = String(courseNumber || '').trim();
        const parsed = parseInt(value, 10);
        if (!value) return 'Not set';
        if (!Number.isFinite(parsed) || parsed < 1) return `Course ${value}`;
        return `Course ${parsed} (Semesters ${(parsed - 1) * 2 + 1}-${parsed * 2})`;
    }

    function renderCourseYearOptions(currentValue = '') {
        const current = String(currentValue || '').trim();
        const base = Array.from({ length: 6 }, (_, index) => String(index + 1));
        const options = current && !base.includes(current) ? [current, ...base] : base;
        return `<option value=""${current ? '' : ' selected'}>Select course year</option>${options.map(value => `<option value="${escapeHtml(value)}"${current === value ? ' selected' : ''}>${escapeHtml(formatCourseYearLabel(value))}</option>`).join('')}`;
    }

    function getTemplateEntries() {
        ensureStores();
        const entries = [];
        Object.entries(KIU_STATE.examTemplatesByFaculty || {}).forEach(([facultyCode, list]) => {
            (Array.isArray(list) ? list : []).forEach(template => {
                if (!template || typeof template !== 'object') return;
                template.faculty = String(template.faculty || facultyCode || '').trim().toUpperCase();
                entries.push({
                    facultyCode: template.faculty || String(facultyCode || '').trim().toUpperCase(),
                    list,
                    template
                });
            });
        });
        return entries;
    }

    function getTemplates() {
        const currentFaculty = getCurrentFacultyCode();
        const visibleTemplates = getTemplateEntries()
            .filter(entry => canUseCrossFacultyExamView() || entry.facultyCode === currentFaculty)
            .map(entry => entry.template);
        const search = String(runtime.templateSearch || '').trim().toLowerCase();
        const statusFilter = String(runtime.templateFilter || 'all').trim().toLowerCase();
        return visibleTemplates
            .filter(template => {
                if (statusFilter !== 'all' && String(template?.status || '').trim().toLowerCase() !== statusFilter) return false;
                if (!search) return true;
                return [
                    template.title,
                    template.subjectName,
                    template.variantLabel,
                    template.faculty,
                    template.createdBy,
                    template.lastEditedBy
                ].some(value => String(value || '').toLowerCase().includes(search));
            })
            .sort((left, right) => String(right?.updatedAt || right?.createdAt || '').localeCompare(String(left?.updatedAt || left?.createdAt || '')));
    }

    function getTemplateById(templateId) {
        return getTemplateEntries().find(entry => String(entry.template?.id || '').trim() === String(templateId || '').trim())?.template || null;
    }

    function getTemplateContainer(templateId) {
        return getTemplateEntries().find(entry => String(entry.template?.id || '').trim() === String(templateId || '').trim()) || null;
    }

    function getSessions() {
        ensureStores();
        const currentFaculty = getCurrentFacultyCode();
        return Object.values(KIU_STATE.examSessionsById || {})
            .filter(session => canUseCrossFacultyExamView() || String(session?.faculty || '').trim().toUpperCase() === currentFaculty)
            .sort((left, right) => parseDate(left?.startAt) - parseDate(right?.startAt));
    }

    function getSessionById(sessionId) {
        return KIU_STATE?.examSessionsById?.[String(sessionId || '').trim()] || null;
    }

    function getSubjectOptions() {
        const facultyCodes = canUseCrossFacultyExamView()
            ? Object.keys(KIU_STATE?.facultyProfiles || KIU_EMPTY_STATE?.facultyProfiles || {})
            : [getCurrentFacultyCode()];
        const byKey = new Map();
        facultyCodes.forEach(facultyCode => {
            if (typeof getActiveCurriculum !== 'function') return;
            (getActiveCurriculum(facultyCode) || []).forEach(subject => {
                const subjectId = String(subject?.id || '').trim();
                if (!subjectId || byKey.has(subjectId)) return;
                byKey.set(subjectId, {
                    id: subjectId,
                    name: String(subject?.name || subjectId).trim(),
                    facultyCode: String(subject?.facultyCode || facultyCode || '').trim().toUpperCase(),
                    facultyLabel: getFacultyLabelSafe(String(subject?.facultyCode || facultyCode || '').trim().toUpperCase())
                });
            });
        });
        return [...byKey.values()].sort((left, right) => String(left?.name || left?.id || '').localeCompare(String(right?.name || right?.id || '')));
    }

    function getSubjectById(subjectId) {
        return getSubjectOptions().find(subject => String(subject?.id || '').trim() === String(subjectId || '').trim()) || null;
    }

    function getGroupsForSubject(subjectId) {
        let groups = [];
        if (typeof getAvailableGroupsForSubject === 'function') {
            try {
                groups = getAvailableGroupsForSubject(subjectId) || [];
            } catch (error) {
                groups = [];
            }
        }
        const currentFaculty = getCurrentFacultyCode();
        return uniqueStrings((groups || []).map(group => String(group?.id || '').trim()))
            .map(groupId => {
                const source = (groups || []).find(item => String(item?.id || '').trim() === groupId) || {};
                return {
                    id: groupId,
                    name: String(source?.name || groupId).trim(),
                    facultyCode: String(source?.faculty || source?.facultyCode || currentFaculty).trim().toUpperCase()
                };
            })
            .sort((left, right) => String(left?.name || left?.id || '').localeCompare(String(right?.name || right?.id || '')));
    }

    function resolveGroupName(subjectId, groupId) {
        const group = getGroupsForSubject(subjectId).find(item => String(item?.id || '').trim() === String(groupId || '').trim());
        return String(group?.name || groupId || '').trim();
    }

    function createQuestion(type = 'mcq', defaults = {}) {
        const optionCount = clampPositiveInt(defaults.optionCount, 4, 2, 8);
        return {
            id: makeLocalId('exam_question'),
            type: 'mcq',
            text: '',
            score: clampPositiveInt(defaults.score, 1, 1, 999),
            optionCount,
            options: Array.from({ length: optionCount }, () => ''),
            correctOption: 0,
            expectedAnswer: '',
            tags: []
        };
    }

    function normalizeQuestion(question = {}) {
        const type = 'mcq';
        const optionCount = Math.max(2, parseInt(question?.optionCount, 10) || (Array.isArray(question?.options) ? question.options.length : 4) || 4);
        const normalizedOptions = Array.from({ length: optionCount }, (_, index) => String(question?.options?.[index] || '').trim());
        return {
            id: String(question?.id || makeLocalId('exam_question')).trim(),
            type,
            text: String(question?.text || '').trim(),
            score: Math.max(1, parseInt(question?.score, 10) || 1),
            optionCount,
            options: normalizedOptions,
            correctOption: question?.correctOption == null ? 0 : Math.max(0, parseInt(question.correctOption, 10) || 0),
            expectedAnswer: String(question?.expectedAnswer || '').trim(),
            tags: Array.isArray(question?.tags) ? question.tags : []
        };
    }

    function applyQuestionOptionCount(question, optionCount) {
        if (!question) return;
        const nextCount = clampPositiveInt(optionCount, question.optionCount || 4, 2, 8);
        question.optionCount = nextCount;
        question.options = Array.from({ length: nextCount }, (_, index) => String(question.options?.[index] || '').trim());
        question.correctOption = Math.max(0, Math.min(nextCount - 1, parseInt(question.correctOption, 10) || 0));
    }

    function createTemplateDraft(template = null) {
        const firstSubject = getSubjectOptions()[0] || null;
        const subject = template?.subjectId ? (getSubjectById(template.subjectId) || firstSubject) : firstSubject;
        const subjectDefaults = getQuestionDefaultsForSubject(subject?.id || template?.subjectId || '');
        const draft = {
            editingTemplateId: String(template?.id || '').trim(),
            title: String(template?.title || '').trim(),
            subjectId: String(template?.subjectId || subject?.id || '').trim(),
            subjectName: String(template?.subjectName || subject?.name || '').trim(),
            courseNumber: String(template?.courseNumber || template?.courseNo || '').trim(),
            courseCode: String(template?.courseCode || template?.subjectCourseNumber || template?.subjectCode || '').trim(),
            variantLabel: String(template?.variantLabel || 'Variant A').trim(),
            instructions: String(template?.instructions || '').trim(),
            status: String(template?.status || 'draft').trim().toLowerCase(),
            /* Legacy flat questions - kept for backward compat */
            questions: Array.isArray(template?.questions) && template.questions.length
                ? template.questions.map(normalizeQuestion)
                : [createQuestion('mcq', subjectDefaults)],
            /* â”€â”€ New: Question Bank & Variants â”€â”€ */
            examType: String(template?.examType || 'digital').trim(),
            durationMinutes: Math.max(1, parseInt(template?.durationMinutes, 10) || 90),
            passingScore: clampPositiveInt(template?.passingScore, 50, 0, 999),
            gradingWeight: clampPositiveInt(template?.gradingWeight, 30, 0, 999),
            defaultQuestionScore: clampPositiveInt(template?.defaultQuestionScore, subjectDefaults.score, 1, 999),
            defaultOptionCount: clampPositiveInt(template?.defaultOptionCount, subjectDefaults.optionCount, 2, 8),
            questionBank: Array.isArray(template?.questionBank) && template.questionBank.length
                ? template.questionBank.map(normalizeQuestion)
                : (Array.isArray(template?.questions) && template.questions.length
                    ? template.questions.map(normalizeQuestion)
                    : [createQuestion('mcq', subjectDefaults)]),
            variants: Array.isArray(template?.variants) && template.variants.length
                ? clone(template.variants)
                : [],
            sharedWith: Array.isArray(template?.sharedWith) ? clone(template.sharedWith) : [],
            lockedBy: template?.lockedBy || null,
            revisionNote: String(template?.revisionNote || '').trim()
        };
        return draft;
    }

    /* â”€â”€ Auto-Variant Generator â”€â”€ */
    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function autoGenerateVariants(questionBank, variantCount, questionsPerVariant) {
        if (!questionBank.length || variantCount < 1 || questionsPerVariant < 1) return [];
        const variants = [];
        const bankSize = questionBank.length;
        const canFitUnique = bankSize >= variantCount * questionsPerVariant;

        if (canFitUnique) {
            /* Perfect distribution: no overlap */
            const shuffled = shuffleArray(questionBank);
            for (let i = 0; i < variantCount; i++) {
                const slice = shuffled.slice(i * questionsPerVariant, (i + 1) * questionsPerVariant);
                variants.push({
                    id: makeLocalId('variant'),
                    label: `Variant ${String.fromCharCode(65 + i)}`,
                    questionIds: slice.map(q => q.id),
                    shuffleQuestions: true,
                    shuffleOptions: true
                });
            }
        } else {
            /* Round-robin with maximized uniqueness */
            for (let i = 0; i < variantCount; i++) {
                const shuffled = shuffleArray(questionBank);
                const picked = shuffled.slice(0, Math.min(questionsPerVariant, bankSize));
                variants.push({
                    id: makeLocalId('variant'),
                    label: `Variant ${String.fromCharCode(65 + i)}`,
                    questionIds: picked.map(q => q.id),
                    shuffleQuestions: true,
                    shuffleOptions: true
                });
            }
        }
        return variants;
    }

    /* â”€â”€ Sharing helpers â”€â”€ */
    function getShareableStaff() {
        const currentUser = getCurrentUserSafe();
        const currentId = String(currentUser?.id || '').trim();
        const currentFaculty = getCurrentFacultyCode();
        return (KIU_STATE?.users || [])
            .filter(u => {
                const role = String(u?.role || '').trim().toLowerCase();
                const id = String(u?.id || '').trim();
                if (id === currentId) return false;
                if (!['professor', 'ta'].includes(role)) return false;
                const fac = String(u?.facultyCode || u?.faculty || '').trim().toUpperCase();
                return !fac || fac === currentFaculty;
            })
            .map(u => ({
                id: String(u.id || '').trim(),
                name: String(u.displayName || u.nameEn || u.name || u.email || u.id || '').trim(),
                role: String(u.role || '').trim(),
                email: String(u.email || '').trim()
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    function isSharedWithMe(template) {
        const currentUser = getCurrentUserSafe();
        const myId = String(currentUser?.id || '').trim();
        return (template?.sharedWith || []).some(s => String(s?.userId || '').trim() === myId);
    }

    function isMySentTemplate(template) {
        const currentUser = getCurrentUserSafe();
        const myId = String(currentUser?.id || '').trim();
        const creatorId = String(template?.createdBy || '').trim();
        const status = String(template?.status || '').trim().toLowerCase();
        return creatorId === myId && ['submitted', 'in_review', 'approved', 'returned'].includes(status);
    }

    function isMyDraft(template) {
        const currentUser = getCurrentUserSafe();
        const myId = String(currentUser?.id || '').trim();
        const creatorId = String(template?.createdBy || '').trim();
        const status = String(template?.status || '').trim().toLowerCase();
        return (creatorId === myId && ['draft', 'returned'].includes(status)) || isSharedWithMe(template);
    }

    function createScheduleDraft(session = null) {
        return {
            editingSessionId: String(session?.id || '').trim(),
            templateId: String(session?.templateId || '').trim(),
            startAt: String(session?.startAt || '').trim(),
            endAt: String(session?.endAt || '').trim(),
            durationMinutes: Math.max(1, parseInt(session?.durationMinutes, 10) || 120),
            placeLabel: String(session?.placeLabel || '').trim(),
            roomLabel: String(session?.roomLabel || '').trim(),
            observerNamesText: Array.isArray(session?.observerNames) && session.observerNames.length
                ? session.observerNames.join(', ')
                : String(session?.observerNamesText || '').trim(),
            selectedCohortKeys: Array.isArray(session?.cohortKeys) ? clone(session.cohortKeys) : [],
            selectedStudentIds: Array.isArray(session?.assignedStudentIds) ? clone(session.assignedStudentIds) : [],
            suspendsClasses: session?.suspendsClasses !== false,
            roomCapacity: parseInt(session?.roomCapacity, 10) || 0
        };
    }

    function getTemplateDraft() {
        if (!runtime.templateDraft) runtime.templateDraft = createTemplateDraft();
        return runtime.templateDraft;
    }

    function getScheduleDraft() {
        if (!runtime.scheduleDraft) runtime.scheduleDraft = createScheduleDraft();
        return runtime.scheduleDraft;
    }

    function normalizeSubjectKey(value) {
        if (typeof canonicalCourseKey === 'function') return canonicalCourseKey(value || '');
        return String(value || '').trim().toLowerCase();
    }

    function getStudentScheduleEntries(studentId) {
        const schedule = KIU_STATE?.studentSchedulesByStudent?.[String(studentId || '').trim()];
        if (Array.isArray(schedule)) return schedule;
        if (schedule && typeof schedule === 'object' && Array.isArray(schedule.entries)) return schedule.entries;
        if (schedule && typeof schedule === 'object') {
            return Object.entries(schedule).map(([courseId, groupId]) => ({ courseId, groupId }));
        }
        return [];
    }

    function resolveSubjectNameFromSchedule(subjectId, fallback = '') {
        const normalizedId = normalizeSubjectKey(subjectId);
        const subject = getSubjectOptions().find(item => normalizeSubjectKey(item?.id) === normalizedId)
            || getTemplates().find(item => normalizeSubjectKey(item?.subjectId) === normalizedId)
            || null;
        return String(subject?.name || subject?.subjectName || fallback || subjectId || '').trim();
    }

    function normalizeStudentRecord(student = {}, fallback = {}) {
        const facultyCode = String(student?.facultyCode || student?.faculty || fallback.facultyCode || '').trim().toUpperCase();
        const facultyLabel = getFacultyLabelSafe(facultyCode);
        const groupId = String(student?.groupId || fallback.groupId || '').trim();
        const groupName = String(student?.groupName || fallback.groupName || '').trim();
        return {
            id: String(student?.id || student?.studentId || '').trim(),
            name: String(student?.displayName || student?.nameEn || student?.name || student?.email || student?.id || '').trim(),
            email: String(student?.email || '').trim(),
            facultyCode,
            facultyLabel,
            groupId,
            groupName,
            groupIds: uniqueStrings([groupId].concat(student?.groupIds || fallback.groupIds || [])),
            groupNames: uniqueStrings([groupName].concat(student?.groupNames || fallback.groupNames || [])),
            courseLabel: String(student?.courseLabel || student?.programName || student?.course || student?.yearLabel || fallback.courseLabel || '').trim(),
            courseLabels: uniqueStrings([student?.courseLabel, student?.programName, student?.course, student?.yearLabel, fallback.courseLabel].concat(student?.courseLabels || fallback.courseLabels || []))
        };
    }

    function getAllKnownStudents() {
        const byId = new Map();
        const addStudent = (student, fallback = {}) => {
            const normalized = normalizeStudentRecord(student, fallback);
            if (!normalized.id) return;
            const existing = byId.get(normalized.id) || {
                id: normalized.id,
                name: normalized.name,
                email: normalized.email,
                facultyCode: normalized.facultyCode,
                facultyLabel: normalized.facultyLabel,
                groupIds: [],
                groupNames: [],
                courseLabels: []
            };
            existing.name = existing.name || normalized.name;
            existing.email = existing.email || normalized.email;
            existing.facultyCode = existing.facultyCode || normalized.facultyCode;
            existing.facultyLabel = existing.facultyLabel || normalized.facultyLabel;
            existing.groupIds = uniqueStrings(existing.groupIds.concat(normalized.groupIds || []));
            existing.groupNames = uniqueStrings(existing.groupNames.concat(normalized.groupNames || []));
            existing.courseLabels = uniqueStrings(existing.courseLabels.concat(normalized.courseLabels || []));
            byId.set(normalized.id, existing);
        };

        (KIU_STATE?.users || []).forEach(user => {
            if (String(user?.role || '').trim().toLowerCase() === 'student') addStudent(user);
        });

        const profiles = KIU_STATE?.facultyProfiles || KIU_EMPTY_STATE?.facultyProfiles || {};
        Object.entries(profiles).forEach(([facultyCode, profile]) => {
            (profile?.students || []).forEach(student => addStudent(student, { facultyCode }));
        });

        return [...byId.values()].sort((left, right) => String(left?.name || left?.id || '').localeCompare(String(right?.name || right?.id || '')));
    }

    function buildStudentSubjectPattern(student) {
        const bySubject = new Map();
        getStudentScheduleEntries(student?.id).forEach(entry => {
            const rawSubjectId = String(entry?.courseId || entry?.sourceCourseId || entry?.subjectId || entry?.moduleId || entry?.title || entry?.name || '').trim();
            const rawSubjectName = String(entry?.courseName || entry?.subjectName || entry?.title || entry?.name || '').trim();
            const normalizedId = normalizeSubjectKey(rawSubjectId || rawSubjectName);
            if (!normalizedId || bySubject.has(normalizedId)) return;
            bySubject.set(normalizedId, {
                id: rawSubjectId || rawSubjectName,
                name: resolveSubjectNameFromSchedule(rawSubjectId || rawSubjectName, rawSubjectName)
            });
        });
        const subjects = [...bySubject.values()].sort((left, right) => String(left?.name || left?.id || '').localeCompare(String(right?.name || right?.id || '')));
        return {
            key: subjects.map(subject => normalizeSubjectKey(subject.id || subject.name)).join('||'),
            subjectIds: subjects.map(subject => String(subject?.id || '').trim()).filter(Boolean),
            subjectNames: subjects.map(subject => String(subject?.name || subject?.id || '').trim()).filter(Boolean),
            subjectSummary: subjects.map(subject => String(subject?.name || subject?.id || '').trim()).filter(Boolean).join(', ')
        };
    }

    function buildSubjectAutoCohorts(subjectId) {
        const targetSubjectKey = normalizeSubjectKey(subjectId);
        const byKey = new Map();
        getAllKnownStudents().forEach(student => {
            const pattern = buildStudentSubjectPattern(student);
            if (!pattern.subjectIds.some(item => normalizeSubjectKey(item) === targetSubjectKey)
                && !pattern.subjectNames.some(item => normalizeSubjectKey(item) === targetSubjectKey)) return;

            const relatedEntries = getStudentScheduleEntries(student.id)
                .filter(entry => normalizeSubjectKey(entry?.courseId || entry?.sourceCourseId || entry?.subjectId || entry?.courseName || entry?.subjectName || '') === targetSubjectKey);
            const mergedStudent = {
                ...student,
                subjectPattern: pattern,
                groupIds: uniqueStrings((student.groupIds || []).concat(relatedEntries.map(entry => String(entry?.groupId || '').trim()).filter(Boolean))),
                groupNames: uniqueStrings((student.groupNames || []).concat(relatedEntries.map(entry => resolveGroupName(subjectId, entry?.groupId || '')).filter(Boolean)))
            };
            const key = String(pattern.key || `cohort::${student.id}`).trim();
            const existing = byKey.get(key) || {
                key,
                label: '',
                subjectIds: clone(pattern.subjectIds || []),
                subjectNames: clone(pattern.subjectNames || []),
                students: [],
                facultyCodes: [],
                facultyLabels: [],
                groupIds: [],
                groupNames: [],
                courseLabels: []
            };
            existing.students.push(mergedStudent);
            existing.facultyCodes = uniqueStrings(existing.facultyCodes.concat(mergedStudent.facultyCode || []));
            existing.facultyLabels = uniqueStrings(existing.facultyLabels.concat(mergedStudent.facultyLabel || mergedStudent.facultyCode || []));
            existing.groupIds = uniqueStrings(existing.groupIds.concat(mergedStudent.groupIds || []));
            existing.groupNames = uniqueStrings(existing.groupNames.concat(mergedStudent.groupNames || []));
            existing.courseLabels = uniqueStrings(existing.courseLabels.concat(mergedStudent.courseLabels || []));
            byKey.set(key, existing);
        });

        return [...byKey.values()]
            .map((cohort, index) => ({
                ...cohort,
                label: `Auto Group ${String(index + 1).padStart(2, '0')}`,
                subjectSummary: (cohort.subjectNames || []).join(', ') || 'No resolved subjects'
            }))
            .sort((left, right) => {
                if (right.students.length !== left.students.length) return right.students.length - left.students.length;
                return String(left.subjectSummary || '').localeCompare(String(right.subjectSummary || ''));
            });
    }

    function getSelectedCohorts(draft, template) {
        if (!template) return [];
        const selectedKeys = new Set(uniqueStrings(draft?.selectedCohortKeys || []));
        return buildSubjectAutoCohorts(template.subjectId).filter(cohort => selectedKeys.has(cohort.key));
    }

    function getSelectedStudentsForSchedule(draft, template) {
        const selectedCohorts = getSelectedCohorts(draft, template);
        const selectedStudentIds = new Set(uniqueStrings(draft?.selectedStudentIds || []));
        const fromCohorts = selectedCohorts.flatMap(cohort => cohort.students || []);
        const byId = new Map();
        fromCohorts.forEach(student => {
            if (!student?.id) return;
            byId.set(student.id, normalizeStudentRecord(student, {
                facultyCode: student.facultyCode,
                groupId: (student.groupIds || [])[0] || '',
                groupName: (student.groupNames || [])[0] || '',
                courseLabel: (student.courseLabels || [])[0] || ''
            }));
        });
        getAllKnownStudents().forEach(student => {
            if (selectedStudentIds.has(student.id) && !byId.has(student.id)) {
                byId.set(student.id, student);
            }
        });
        return [...byId.values()].sort((left, right) => String(left?.name || left?.id || '').localeCompare(String(right?.name || right?.id || '')));
    }

    function getSelectedSessionStatus(session = {}) {
        const now = Date.now();
        const startAt = parseDate(session?.startAt);
        const endAt = parseDate(session?.endAt);
        if (endAt && endAt <= now) return 'closed';
        if (startAt && startAt <= now) return 'live';
        return String(session?.status || 'scheduled').trim().toLowerCase() || 'scheduled';
    }

    function getSessionRoomLabel(session = {}) {
        const place = String(session?.placeLabel || '').trim();
        const room = String(session?.roomLabel || session?.locationLabel || '').trim();
        if (place && room) return `${place} / ${room}`;
        return place || room || 'Location pending';
    }

    function getSessionObserverNames(session = {}) {
        return uniqueStrings([].concat(session?.observerNames || []).concat(String(session?.observerNamesText || '').split(',')));
    }

    function getAssignedStudents(session = {}) {
        const list = Array.isArray(session?.assignedStudents) && session.assignedStudents.length
            ? session.assignedStudents
            : Array.isArray(session?.allowedStudents) ? session.allowedStudents : [];
        return list.map(student => normalizeStudentRecord(student, {
            facultyCode: student?.facultyCode || session?.faculty || '',
            groupId: student?.groupId || session?.groupId || '',
            groupName: student?.groupName || session?.groupName || '',
            courseLabel: student?.courseLabel || ''
        })).filter(student => student.id);
    }

    function getAssignedStudentIds(session = {}) {
        return uniqueStrings((session?.assignedStudentIds || session?.allowedStudentIds || []).concat(getAssignedStudents(session).map(student => student.id)));
    }

    function rangesOverlap(leftStart, leftEnd, rightStart, rightEnd) {
        if (!leftStart || !leftEnd || !rightStart || !rightEnd) return false;
        return leftStart < rightEnd && rightStart < leftEnd;
    }

    function getScheduleDraftIssues(draft, template) {
        const issues = [];
        const startAt = parseDate(draft?.startAt);
        const endAt = parseDate(draft?.endAt);
        const selectedStudents = getSelectedStudentsForSchedule(draft, template);
        const selectedStudentIds = new Set(selectedStudents.map(student => student.id));
        const roomKey = [String(draft?.placeLabel || '').trim(), String(draft?.roomLabel || '').trim()].filter(Boolean).join('::').toLowerCase();

        if (!template) issues.push('Choose an approved exam template first.');
        if (template && String(template?.status || '').trim().toLowerCase() !== 'approved') issues.push('Only approved templates can be scheduled.');
        if (!String(draft?.startAt || '').trim() || !String(draft?.endAt || '').trim()) issues.push('Start and end time are required.');
        if (startAt && endAt && endAt <= startAt) issues.push('End time must be later than start time.');
        if (!uniqueStrings(draft?.selectedCohortKeys || []).length) issues.push('Select at least one auto-detected schedule group.');
        if (!selectedStudents.length) issues.push('The selected schedule groups did not resolve any students.');
        if (!String(draft?.placeLabel || '').trim()) issues.push('Enter a place or building.');
        if (!String(draft?.roomLabel || '').trim()) issues.push('Enter a room.');
        if (!String(draft?.observerNamesText || '').trim()) issues.push('Enter at least one observer.');

        getSessions().forEach(session => {
            if (String(session?.id || '').trim() === String(draft?.editingSessionId || '').trim()) return;
            if (!rangesOverlap(startAt, endAt, parseDate(session?.startAt), parseDate(session?.endAt))) return;
            const sessionStudents = new Set(getAssignedStudentIds(session));
            const hasSharedStudents = [...selectedStudentIds].some(studentId => sessionStudents.has(studentId));
            const sessionRoomKey = [String(session?.placeLabel || '').trim(), String(session?.roomLabel || '').trim()].filter(Boolean).join('::').toLowerCase();
            if (hasSharedStudents) {
                issues.push(`Student overlap with "${session.title || session.subjectName || 'another exam'}" on ${formatDateTime(session.startAt)}.`);
            } else if (roomKey && sessionRoomKey && roomKey === sessionRoomKey) {
                issues.push(`Room overlap with "${session.title || session.subjectName || 'another exam'}" on ${formatDateTime(session.startAt)}.`);
            }
        });

        return uniqueStrings(issues);
    }

    function syncTemplateLinks(template) {
        ensureStores();
        KIU_STATE.examTemplateLinksByTemplateId[template.id] = {
            templateId: template.id,
            subjectId: template.subjectId,
            subjectName: template.subjectName,
            faculty: template.faculty,
            groupIds: getGroupsForSubject(template.subjectId).map(group => group.id),
            groupNames: getGroupsForSubject(template.subjectId).map(group => group.name),
            updatedAt: new Date().toISOString()
        };
    }

    function upsertTemplate(template) {
        ensureStores();
        const facultyCode = String(template?.faculty || getCurrentFacultyCode()).trim().toUpperCase() || 'ECON';
        KIU_STATE.examTemplatesByFaculty[facultyCode] = Array.isArray(KIU_STATE.examTemplatesByFaculty[facultyCode])
            ? KIU_STATE.examTemplatesByFaculty[facultyCode]
            : [];
        const list = KIU_STATE.examTemplatesByFaculty[facultyCode];
        const index = list.findIndex(item => String(item?.id || '').trim() === String(template?.id || '').trim());
        if (index >= 0) list[index] = template;
        else list.unshift(template);
        syncTemplateLinks(template);
        persistState();
    }

    async function upsertSession(session) {
        ensureStores();
        KIU_STATE.examSessionsById[session.id] = session;
        persistState();
        if (typeof syncExamSessionRecord === 'function') {
            try {
                const result = await syncExamSessionRecord(session);
                if (result?.id) {
                    KIU_STATE.examSessionsById[result.id] = {
                        ...session,
                        ...result,
                        cohortKeys: clone(session.cohortKeys || [])
                    };
                    persistState();
                }
            } catch (error) {
                console.warn('Exam session sync failed.', error);
            }
        }
    }

    function getBackendWarning() {
        const backendRuntime = window.__kiuPortalBackendRuntime || null;
        return String(backendRuntime?.lastBackendError || '').trim();
    }

    function getAttemptStore(sessionId) {
        const key = String(sessionId || '').trim();
        runtime.attemptsBySessionId[key] = runtime.attemptsBySessionId[key] || {
            loading: false,
            attempts: [],
            error: ''
        };
        return runtime.attemptsBySessionId[key];
    }

    async function loadAttemptsForSession(sessionId, options = {}) {
        const session = getSessionById(sessionId);
        if (!session || typeof fetchProtectedQuizAttempts !== 'function') return;
        const store = getAttemptStore(sessionId);
        if (store.loading) return;
        if (!options.force && Array.isArray(store.attempts) && store.attempts.length) return;
        store.loading = true;
        store.error = '';
        renderConsole('body');
        try {
            const payload = await fetchProtectedQuizAttempts(session.protectedCourseId || `exam-session::${session.id}`, session.protectedQuizId || session.id);
            store.attempts = Array.isArray(payload?.attempts) ? payload.attempts : [];
            store.error = '';
        } catch (error) {
            store.error = error?.message || 'Attempts could not be loaded.';
        } finally {
            store.loading = false;
            renderConsole('body');
        }
    }

    function getAttemptsForSession(sessionId) {
        return Array.isArray(getAttemptStore(sessionId).attempts) ? getAttemptStore(sessionId).attempts : [];
    }

    function getAttemptStudentId(entry) {
        return String(entry?.student?.id || entry?.attempt?.studentId || '').trim();
    }

    function deriveAttemptState(entry) {
        const attempt = entry?.attempt || {};
        const status = String(attempt?.status || '').trim().toLowerCase();
        const warningCount = Number(attempt?.warningCount || 0);
        const blocked = attempt?.blocked === true || status === 'blocked';
        if (blocked || warningCount > 0) return 'flagged';
        if (['submitted', 'auto-submitted', 'graded'].includes(status)) return 'submitted';
        if (['checked_in', 'checked-in'].includes(status)) return 'checked_in';
        if (attempt?.startedAt || ['active', 'started', 'in_progress', 'in-progress'].includes(status)) return 'in_progress';
        return 'not_started';
    }

    function buildSessionActivity(session) {
        const attempts = getAttemptsForSession(session.id);
        const byStudentId = new Map(attempts.map(entry => [getAttemptStudentId(entry), entry]));
        const counters = {
            not_started: 0,
            checked_in: 0,
            in_progress: 0,
            submitted: 0,
            flagged: 0
        };
        getAssignedStudents(session).forEach(student => {
            const state = deriveAttemptState(byStudentId.get(student.id));
            counters[state] += 1;
        });
        return counters;
    }

    function getTemplateTotalScore(template = {}) {
        return (template?.questions || []).reduce((total, question) => total + Math.max(1, parseInt(question?.score, 10) || 1), 0);
    }

    function buildRenderPassSnapshot() {
        const templates = getTemplates();
        const sessions = getSessions();
        return {
            templates,
            sessions,
            reviewTemplates: templates.filter(template => ['submitted', 'in_review'].includes(String(template?.status || '').trim().toLowerCase())),
            approvedTemplates: templates.filter(template => String(template?.status || '').trim().toLowerCase() === 'approved')
        };
    }

    function beginRenderPass(dirty) {
        const dirtySet = normalizeExamDirtyRegions(dirty);
        if (dirtySet.has('chrome') || dirtySet.has('all') || dirtySet.has('full')) {
            runtime.renderPass = buildRenderPassSnapshot();
        }
    }

    function endRenderPass() {
        runtime.renderPass = null;
    }

    function getReviewTemplates() {
        if (runtime.renderPass?.reviewTemplates) return runtime.renderPass.reviewTemplates;
        return getTemplates().filter(template => ['submitted', 'in_review'].includes(String(template?.status || '').trim().toLowerCase()));
    }

    function getApprovedTemplates() {
        if (runtime.renderPass?.approvedTemplates) return runtime.renderPass.approvedTemplates;
        return getTemplates().filter(template => String(template?.status || '').trim().toLowerCase() === 'approved');
    }

    function getReviewQueueGroups() {
        const cross = canUseCrossFacultyExamView();
        const currentFaculty = getCurrentFacultyCode();
        const search = String(runtime.reviewSearch || '').trim().toLowerCase();
        const facultyFilter = String(runtime.reviewFaculty || 'all').trim().toUpperCase();
        const sortNewest = String(runtime.reviewSort || 'oldest').trim().toLowerCase() === 'newest';
        const matches = (t) => {
            const faculty = String(t?.faculty || '').trim().toUpperCase();
            if (!cross && faculty !== currentFaculty) return false;
            if (facultyFilter !== 'ALL' && faculty !== facultyFilter) return false;
            if (!search) return true;
            return [t?.title, t?.subjectName, t?.subjectId, t?.variantLabel, t?.createdByName, t?.lastEditedByName, t?.faculty]
                .some(v => String(v || '').toLowerCase().includes(search));
        };
        const sortFn = (a, b) => {
            const aTime = parseDate(a?.updatedAt || a?.createdAt);
            const bTime = parseDate(b?.updatedAt || b?.createdAt);
            return sortNewest ? bTime - aTime : aTime - bTime;
        };
        const groups = { awaiting: [], returned: [], approved: [] };
        getTemplateEntries().forEach(entry => {
            const t = entry?.template;
            if (!t || !matches(t)) return;
            const status = String(t.status || '').trim().toLowerCase();
            if (['submitted', 'in_review'].includes(status)) groups.awaiting.push(t);
            else if (status === 'returned') groups.returned.push(t);
            else if (status === 'approved') groups.approved.push(t);
        });
        groups.awaiting.sort(sortFn);
        groups.returned.sort(sortFn);
        groups.approved.sort(sortFn);
        return groups;
    }

    function getReviewFacultyOptions() {
        if (!canUseCrossFacultyExamView()) return [];
        const codes = new Set();
        getTemplateEntries().forEach(entry => {
            const code = String(entry?.template?.faculty || entry?.facultyCode || '').trim().toUpperCase();
            if (code) codes.add(code);
        });
        return [...codes].sort().map(code => ({ code, label: getFacultyLabelSafe(code) || code }));
    }

    function getFilteredTemplates(searchText, statusFilter, staffSubTab, sourceTemplates = null) {
        let list = Array.isArray(sourceTemplates) ? sourceTemplates.slice() : getTemplates();
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

        // Staff sub-tab filtering (non-admin only)
        if (!isAdmin && staffSubTab) {
            if (staffSubTab === 'my_drafts') {
                list = list.filter(t => !t.sharedWith || t.createdBy === (currentUser?.id || ''));
            } else if (staffSubTab === 'shared_with_me') {
                list = list.filter(t => t.sharedWith && t.createdBy !== (currentUser?.id || ''));
            } else if (staffSubTab === 'sent_to_admin') {
                list = list.filter(t => ['submitted', 'in_review', 'approved'].includes(String(t.status || '').toLowerCase()));
            }
        }

        // When sourceTemplates is not provided, search/status are already applied in getTemplates().
        if (!Array.isArray(sourceTemplates)) {
            if (statusFilter && statusFilter !== 'all') {
                list = list.filter(t => String(t.status || 'draft').toLowerCase() === statusFilter.toLowerCase());
            }
            const q = String(searchText || '').trim().toLowerCase();
            if (q) {
                list = list.filter(t =>
                    (t.title || '').toLowerCase().includes(q) ||
                    (t.subjectName || '').toLowerCase().includes(q) ||
                    (t.subjectId || '').toLowerCase().includes(q)
                );
            }
        }

        return list;
    }

    function getLiveSessions() {
        return getSessions().filter(session => {
            const status = getSelectedSessionStatus(session);
            return status === 'live' || status === 'scheduled';
        });
    }

    function getResultSessions() {
        return getSessions().filter(session => getSelectedSessionStatus(session) !== 'scheduled');
    }

    window.__kiuExamsAttemptsHooks = window.__kiuExamsAttemptsHooks || {};
    Object.assign(window.__kiuExamsAttemptsHooks, {
        runtime,
        MANUAL_TYPES,
        getSessionById,
        getLiveSessions,
        getResultSessions,
        loadAttemptsForSession,
        getAttemptStore,
        getAttemptsForSession,
        getAttemptStudentId,
        getAssignedStudents,
        getAssignedStudentIds,
        getSelectedSessionStatus,
        getSessionRoomLabel,
        getSessionObserverNames,
        buildSessionActivity,
        deriveAttemptState,
        updateExamManualGradeDraft: (...args) => window.updateExamManualGradeDraft(...args),
        saveExamManualGrade: (...args) => window.saveExamManualGrade(...args),
        runExamStudentAction: (...args) => window.runExamStudentAction(...args),
        refreshExamAttempts: (...args) => window.refreshExamAttempts(...args),
        escapeHtml,
        formatDateTime,
        uniqueStrings,
        toFieldToken
    });

    function getWorkspaceStatChips() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const templates = runtime.renderPass?.templates || getTemplates();
        const sessions = runtime.renderPass?.sessions || getSessions();
        const reviewCount = getReviewTemplates().length;
        const liveCount = sessions.filter(s => getSelectedSessionStatus(s) === 'live').length;
        const returnedCount = templates.filter(t => String(t.status || '').toLowerCase() === 'returned').length;
        const approvedCount = getApprovedTemplates().length;
        if (isAdmin) {
            return [
                { value: reviewCount, label: 'Awaiting Review', tone: 'is-pending' },
                { value: sessions.length, label: 'Scheduled', tone: 'is-approved' },
                { value: liveCount, label: 'Live Now', tone: liveCount ? 'is-live' : '' },
                { value: templates.length, label: 'All Templates', tone: '' }
            ];
        }
        return [
            { value: templates.length, label: 'My Quizzes', tone: 'is-draft' },
            { value: templates.filter(t => t.status === 'submitted').length, label: 'Pending Review', tone: 'is-pending' },
            { value: returnedCount, label: 'Returned', tone: returnedCount ? 'is-returned' : '' },
            { value: approvedCount, label: 'Approved', tone: 'is-approved' }
        ];
    }

    function renderWorkspaceTitle() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        return `
            <div class="ex2-workspace-title-row">
                <h1><i class="fas ${isAdmin ? 'fa-satellite-dish' : 'fa-wand-magic-sparkles'}"></i> ${isAdmin ? 'Exam Command Center' : 'Quiz Studio'}</h1>
            </div>
        `;
    }

    function renderWorkspaceStatsInline() {
        return `
            <div class="ex2-workspace-stats">
                ${getWorkspaceStatChips().map(chip => `
                    <div class="ex2-stat-chip lux-soft-chrome${chip.tone ? ` ${chip.tone}` : ''}">
                        <strong>${chip.value}</strong>
                        <span>${escapeHtml(chip.label)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderWorkspaceTabRow() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const reviewCount = getReviewTemplates().length;
        const sessions = runtime.renderPass?.sessions || getSessions();
        const liveCount = sessions.filter(s => getSelectedSessionStatus(s) === 'live').length;
        const TAB_META = {
            templates: { icon: 'fa-file-lines', label: isAdmin ? 'All Templates' : 'Quiz Builder' },
            review:    { icon: 'fa-clipboard-check', label: 'Review', badge: reviewCount },
            schedule:  { icon: 'fa-calendar-plus', label: 'Schedule' },
            live:      { icon: 'fa-tower-broadcast', label: 'Live', badge: liveCount },
            results:   { icon: 'fa-chart-column', label: 'Results' }
        };
        const visibleTabs = TABS.filter(tab => tab === 'templates' || isAdmin);
        // Staff only has one lane (templates) — section head already titles it; a lone tab + full-width rule looks like a cut-through title.
        if (visibleTabs.length <= 1) return '';
        return `
            <div class="ex2-tab-row ex2-workspace-tab-row">
                ${visibleTabs.map(tab => {
                    const meta = TAB_META[tab] || {};
                    return `<button type="button" class="ex2-tab${runtime.activeTab === tab ? ' is-active' : ''}" data-exam-call="setExamTab" data-exam-args='["${tab}"]'><i class="fas ${meta.icon || 'fa-circle'}"></i> ${escapeHtml(meta.label || tab)}${meta.badge ? ` <span class="ex2-tab-badge">${meta.badge}</span>` : ''}</button>`;
                }).join('')}
            </div>
        `;
    }

    function renderWorkspaceChrome() {
        return `
            <header class="ex2-workspace-head">
                ${renderWorkspaceTitle()}
                ${renderWorkspaceStatsInline()}
                ${renderWorkspaceTabRow()}
                ${getBackendWarning() ? `<div class="ex2-warning"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(getBackendWarning())}</div>` : ''}
            </header>
        `;
    }

    function renderTabBar() {
        return renderWorkspaceChrome();
    }

    function renderHero() {
        return renderWorkspaceChrome();
    }

    function renderTemplateList() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const templates = runtime.renderPass?.templates || getTemplates();
        const filtered = getFilteredTemplates(runtime.templateSearch, runtime.templateFilter, runtime.staffSubTab, templates);
        const bankCount = (t) => (t.questionBank || t.questions || []).length;
        const varCount = (t) => (t.variants || []).length;

        return `
            <div class="ex2-workspace-section">
                <div class="lux-panel-head ex2-panel-head">
                    <div>
                        <h2><i class="fas ${isAdmin ? 'fa-folder-open' : 'fa-wand-magic-sparkles'} ex2-panel-title-icon"></i>${isAdmin ? 'All Templates' : 'Quiz Builder'}</h2>
                        <p>${isAdmin ? 'All faculty exam templates across the university.' : 'Create question banks, generate variants, and collaborate.'}</p>
                    </div>
                    <div class="ex2-inline-actions">
                        <button type="button" class="ex2-btn is-primary" data-exam-call="beginExamTemplateCreation"><i class="fas fa-plus"></i> New Quiz</button>
                    </div>
                </div>
                ${!isAdmin ? `
                    <div class="ex2-sub-tab-row">
                        ${STAFF_SUB_TABS.map(tab => `<button type="button" class="ex2-sub-tab${runtime.staffSubTab === tab ? ' is-active' : ''}" data-exam-call="setExamStaffSubTab" data-exam-args='["${tab}"]'>${escapeHtml(tab === 'my_drafts' ? 'My Library' : tab === 'shared_with_me' ? 'Shared with Me' : 'Sent to Admin')}</button>`).join('')}
                    </div>
                ` : ''}
                <div class="ex2-inline-actions ex2-inline-actions--mb-14">
                    <input class="ex2-input ex2-input--search" type="text" placeholder="Search quizzes..." value="${escapeHtml(runtime.templateSearch)}" data-exam-input-call="setExamTemplateSearch" data-exam-input-args='["$value"]'>
                    <select class="ex2-select ex2-select--filter" data-exam-change-call="setExamTemplateFilter" data-exam-change-args='["$value"]'>
                        <option value="all"${runtime.templateFilter==='all'?' selected':''}>All Status</option>
                        <option value="draft"${runtime.templateFilter==='draft'?' selected':''}>Drafts</option>
                        <option value="submitted"${runtime.templateFilter==='submitted'?' selected':''}>Submitted</option>
                        <option value="returned"${runtime.templateFilter==='returned'?' selected':''}>Returned</option>
                        <option value="approved"${runtime.templateFilter==='approved'?' selected':''}>Approved</option>
                    </select>
                </div>
                ${filtered.length ? `
                    <div class="ex2-card-grid">
                        ${filtered.map((template, idx) => `
                            <article class="ex2-quiz-card lux-soft-chrome ex2-quiz-card--delay-${idx % 12}" data-exam-call="editExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'>
                                <div class="ex2-quiz-card-head">
                                    <span class="ex2-status-dot is-${escapeHtml(String(template.status||'draft').toLowerCase())}">${escapeHtml(String(template.status||'draft').replace(/_/g,' '))}</span>
                                    <span class="ex2-quiz-card-type">${escapeHtml(template.examType === 'paper' ? 'Paper' : 'Digital')}</span>
                                </div>
                                <h3 class="ex2-quiz-card-title">${escapeHtml(template.title || 'Untitled')}</h3>
                                <div class="ex2-quiz-card-meta">${escapeHtml(template.subjectName || template.subjectId || 'No subject')}${template.courseNumber ? ` - ${escapeHtml(formatCourseYearLabel(template.courseNumber))}` : ''}${template.courseCode ? ` - No. ${escapeHtml(template.courseCode)}` : ''}</div>
                                <div class="ex2-mini-grid ex2-mini-grid--flush">
                                    <div><strong>${bankCount(template)}</strong><span>Questions</span></div>
                                    <div><strong>${varCount(template)}</strong><span>Variants</span></div>
                                    <div><strong>${template.gradingWeight || 30}</strong><span>Quiz pts</span></div>
                                </div>
                                ${String(template.status||'').toLowerCase() === 'returned' && template.revisionNote ? `<div class="ex2-revision-note ex2-revision-note--spaced"><i class="fas fa-comment-dots"></i> ${escapeHtml(template.revisionNote)}</div>` : ''}
                                <div class="ex2-inline-actions ex2-inline-actions--mt-14">
                                    <button type="button" class="ex2-btn is-ghost" data-exam-call="editExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'><i class="fas fa-pen"></i></button>
                                    <button type="button" class="ex2-btn is-ghost" data-exam-call="duplicateExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'><i class="fas fa-copy"></i></button>
                                    <button type="button" class="ex2-btn is-ghost" data-exam-call="openShareModal" data-exam-args='["${escapeHtml(template.id)}"]'><i class="fas fa-share-nodes"></i></button>
                                    <button type="button" class="ex2-btn is-ghost" data-exam-call="exportQuizById" data-exam-args='["${escapeHtml(template.id)}","pdf"]' title="Export PDF"><i class="fas fa-file-pdf"></i></button>
                                    <button type="button" class="ex2-btn is-ghost" data-exam-call="exportQuizById" data-exam-args='["${escapeHtml(template.id)}","docx"]' title="Export DOCX"><i class="fas fa-file-word"></i></button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                ` : `
                    <div class="ex2-empty-state lux-soft-chrome">
                        <i class="fas fa-graduation-cap"></i>
                        <p>${isAdmin ? 'No templates match your filters.' : 'No quizzes yet. Create your first one!'}</p>
                        <button type="button" class="ex2-btn is-primary" data-exam-call="beginExamTemplateCreation"><i class="fas fa-plus"></i> Create Quiz</button>
                    </div>
                `}
            </div>
        `;
    }


    function renderBuilderLoadingState() {
        return `
            <div class="ex2-workspace-section">
                <div class="ex2-empty-state lux-soft-chrome">
                    <i class="fas fa-wand-magic-sparkles"></i>
                    <p><strong>Loading Quiz Builder</strong></p>
                    <p>Preparing the question bank, variant editor, and review workspace.</p>
                </div>
            </div>
        `;
    }

    function renderTemplateBuilder() {
        if (hasExamsBuilderModule()) {
            return window.renderExamTemplateBuilder();
        }
        ensureExamsBuilderModule().then(() => renderConsole('body')).catch(() => null);
        return renderBuilderLoadingState();
    }

    /* â”€â”€ Share Modal â”€â”€ */
    function renderExamModalShell({ modalKey, title, icon, tone = 'accent', body }) {
        const normalizedKey = String(modalKey || '').trim().toLowerCase();
        const closeAction = normalizedKey === 'return' ? 'close-return-modal' : 'close-share-modal';
        const titleId = `ex2-modal-title-${toFieldToken(normalizedKey || 'dialog')}`;
        return `
            <div class="ex2-modal-overlay" data-exam-modal="${escapeHtml(normalizedKey)}" data-lux-transparency-exempt="1">
                <div class="ex2-modal" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}" data-lux-transparency-exempt="1">
                    <div class="ex2-modal-head ${tone === 'warm' ? 'is-warm' : 'is-accent'}">
                        <h3 id="${escapeHtml(titleId)}"><i class="fas ${escapeHtml(icon || 'fa-window-maximize')}"></i> ${escapeHtml(title)}</h3>
                        <button type="button" class="ex2-btn is-ghost ex2-modal-close" data-exam-action="${closeAction}" aria-label="Close modal"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="ex2-modal-body">
                        ${body}
                    </div>
                </div>
            </div>
        `;
    }

    function renderShareModal(draft) {
        const staff = getShareableStaff();
        const search = String(runtime.shareSearchQuery || '').toLowerCase();
        const filtered = search ? staff.filter(s => s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search)) : staff;
        const alreadyShared = new Set((draft.sharedWith || []).map(s => s.userId));
        const body = `
            <input class="ex2-input ex2-modal-search" type="text" placeholder="Search by name or email..." value="${escapeHtml(runtime.shareSearchQuery)}" data-exam-input="share-search">
            <div class="ex2-list ex2-modal-list">
                ${filtered.length ? filtered.map(s => `
                    <div class="ex2-list-item lux-soft-chrome">
                        <div><strong>${escapeHtml(s.name)}</strong><span class="ex2-modal-meta">${escapeHtml(s.role)}</span></div>
                        ${alreadyShared.has(s.id) ? `<span class="ex2-status is-approved">Shared</span>` : `<button type="button" class="ex2-btn is-secondary" data-exam-action="share-with-staff" data-user-id="${escapeHtml(s.id)}" data-user-name="${escapeHtml(s.name)}"><i class="fas fa-share"></i> Share</button>`}
                    </div>
                `).join('') : `<div class="ex2-empty lux-soft-chrome">No colleagues found in your faculty.</div>`}
            </div>
        `;
        return renderExamModalShell({
            modalKey: 'share',
            title: 'Share Exam with Colleagues',
            icon: 'fa-share-nodes',
            tone: 'accent',
            body
        });
    }

    window.__kiuExamsBuilderHooks = window.__kiuExamsBuilderHooks || {};
    Object.assign(window.__kiuExamsBuilderHooks, {
        runtime,
        getTemplateDraft,
        getSubjectOptions,
        renderCourseYearOptions,
        formatCourseYearLabel,
        escapeHtml,
        renderShareModal
    });

    window.__kiuExamsAdminHooks = window.__kiuExamsAdminHooks || {};
    Object.assign(window.__kiuExamsAdminHooks, {
        runtime,
        getReviewTemplates,
        getApprovedTemplates,
        getReviewQueueGroups,
        getReviewFacultyOptions,
        canUseCrossFacultyExamView,
        getTemplateById,
        getScheduleDraft,
        getSelectedStudentsForSchedule,
        getScheduleDraftIssues,
        getSessions,
        buildSubjectAutoCohorts,
        formatCountdown,
        formatDateTime,
        formatShortDate,
        getAssignedStudentIds,
        getSessionObserverNames,
        getSessionRoomLabel,
        getSelectedSessionStatus,
        uniqueStrings,
        escapeHtml,
        toFieldToken,
        renderExamModalShell
    });

    function renderQuestionEditor(question, index, mode = 'legacy') {
        const removeFunc = mode === 'bank' ? 'removeExamBankQuestion' : 'removeExamQuestion';
        const updateFunc = mode === 'bank' ? 'updateExamBankQuestionField' : 'updateExamQuestionField';
        const syncFunc = mode === 'bank' ? 'syncExamBankQuestionField' : 'syncExamQuestionField';
        const optionUpdateFunc = mode === 'bank' ? 'updateExamBankQuestionOption' : 'updateExamQuestionOption';
        const optionSyncFunc = mode === 'bank' ? 'syncExamBankQuestionOption' : 'syncExamQuestionOption';
        return `
            <article class="ex2-question-card">
                <div class="ex2-question-head">
                    <div>
                        <div class="ex2-status is-neutral">Q${index + 1}</div>
                        <h3>Multiple Choice</h3>
                    </div>
                    <div class="ex2-inline-actions">
                        <label class="ex2-field ex2-field--compact ex2-field--points">
                            <span class="ex2-field-label-11">Points</span>
                            <input class="ex2-input ex2-input--points" type="number" min="1" value="${escapeHtml(String(question.score || 1))}" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","score","$value"]'>
                        </label>
                        <label class="ex2-field ex2-field--compact ex2-field--options">
                            <span class="ex2-field-label-11">Options</span>
                            <input class="ex2-input ex2-input--options" type="number" min="2" max="8" value="${escapeHtml(String((question.options || []).length || question.optionCount || 4))}" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","optionCount","$value"]'>
                        </label>
                    </div>
                </div>
                <div class="ex2-form-grid">
                    <label class="ex2-field ex2-field-span">
                        <span>Question text</span>
                        <textarea class="ex2-textarea" rows="3" data-exam-input-call="${syncFunc}" data-exam-input-args='["${escapeHtml(question.id)}","text","$value"]' data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","text","$value"]'>${escapeHtml(question.text)}</textarea>
                    </label>
                    <label class="ex2-field ex2-field-span ex2-field--picker">
                        <span>Correct option</span>
                        <select class="ex2-select" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","correctOption","$value"]'>
                            ${(question.options || []).map((opt, oi) => `<option value="${oi}"${Number(question.correctOption) === oi ? ' selected' : ''}>Option ${oi + 1}</option>`).join('')}
                        </select>
                    </label>
                    <div class="ex2-field ex2-field-span">
                        <span>Options</span>
                        <div class="ex2-options">
                            ${(question.options || []).map((opt, oi) => `<label class="ex2-option"><span>${oi + 1}</span><input class="ex2-input" type="text" value="${escapeHtml(opt)}" data-exam-input-call="${optionSyncFunc}" data-exam-input-args='["${escapeHtml(question.id)}",${oi},"$value"]' data-exam-change-call="${optionUpdateFunc}" data-exam-change-args='["${escapeHtml(question.id)}",${oi},"$value"]'></label>`).join('')}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function renderAdminLoadingPanel(title, description) {
        return `
            <div class="ex2-workspace-section">
                <div class="ex2-empty-state lux-soft-chrome">
                    <i class="fas fa-user-shield"></i>
                    <p><strong>${escapeHtml(title)}</strong></p>
                    <p>${escapeHtml(description)}</p>
                </div>
            </div>
        `;
    }

    /* Workspace/render/handlers: exams-console-workspace-runtime.js */
    const __examsWorkspaceDeps = window.__kiuExamsConsoleWorkspaceDeps = {
        runtime, ROOT_ID, TABS, STAFF_ROLES, ADMIN_ROLES, MANUAL_TYPES, TEMPLATE_STATUSES, STAFF_SUB_TABS
    };
    const __examsWorkspaceApi = typeof window.__kiuCreateExamsConsoleWorkspaceApi === 'function'
        ? window.__kiuCreateExamsConsoleWorkspaceApi(__examsWorkspaceDeps)
        : {};
    const {
        renderReviewTab, renderScheduleBoard, renderExamsAttemptsLoadingPanel,
        renderLiveTab, renderResultsTab, hasActiveExamDraft,
        setExamRegionMarkup, clearExamRegionCache, ensureExamWorkspaceShell,
        syncWorkspaceBodyClass, renderWorkspaceBodyContent, renderExamModalMarkup,
        enhanceExamRegionPickers, patchExamChrome, patchExamBody,
        patchExamModal, syncBuilderToolbarTitle, syncBuilderSubjectDefaultInputs,
        syncBuilderStepperState, patchExamBuilderSummary, patchExamBuilderStep,
        patchExamBuilderStepper, patchExamBuilderPartial, normalizeExamDirtyRegions,
        renderWorkspace, renderConsole, handleConsoleClick,
        parseExamDelegateArgs, invokeExamDelegate, handleConsoleInput,
        handleConsoleChange, bindConsoleEvents, bootExamsConsoleOnce,
        buildTemplateFromDraft, openShareModalInternal, closeShareModalInternal,
        shareExamWithInternal, openReturnModalInternal, closeReturnModalInternal,
        executeReturnForRevisionInternal, getExamProtectedSessionKeys, findExamAttemptEntry,
    } = __examsWorkspaceApi;
    Object.assign(__examsWorkspaceDeps, {
        escapeHtml, toFieldToken, hasExamsBuilderModule, ensureExamsBuilderModule,
        hasExamsAdminModule, ensureExamsAdminModule, hasExamsAttemptsModule, ensureExamsAttemptsModule,
        formatDateTime, getRole, getFacultyLabelSafe, persistState, clampPositiveInt,
        saveQuestionDefaultsForSubject, renderCourseYearOptions, getTemplateById, getSessionById,
        getGroupsForSubject, normalizeQuestion, shuffleArray, isSharedWithMe, createScheduleDraft,
        normalizeSubjectKey, normalizeStudentRecord, buildSubjectAutoCohorts, getSelectedSessionStatus,
        getAssignedStudents, getScheduleDraftIssues, upsertSession, loadAttemptsForSession,
        deriveAttemptState, buildRenderPassSnapshot, beginRenderPass, endRenderPass,
        getReviewTemplates, getReviewFacultyOptions, getResultSessions
    });
    /* Schedule/collision/PIN/export: exams-console-schedule-runtime.js */
    const __examsScheduleApi = typeof window.__kiuCreateExamsConsoleScheduleApi === 'function'
        ? window.__kiuCreateExamsConsoleScheduleApi(window.__kiuExamsConsoleWorkspaceDeps || {})
        : {};
    const {
        previewStudentExamPortal, createLocalExamTestSession, toggleExamCohort, selectAllExamCohorts,
        clearExamCohorts, editExamSession, detectScheduleCollisions, generateExamPIN,
        hasExamsExportModule, ensureExamsExportModule, splitCohort, publishExamSession, unpublishExamSession
    } = __examsScheduleApi;
    Object.assign(window.__kiuExamsAdminHooks, {
        detectScheduleCollisions,
        generateExamPIN
    });
    Object.assign(window, {
        previewStudentExamPortal, createLocalExamTestSession, toggleExamCohort, selectAllExamCohorts,
        clearExamCohorts, editExamSession, splitCohort, publishExamSession, unpublishExamSession
    });


    window.__kiuExamsExportHooks = window.__kiuExamsExportHooks || {};
    Object.assign(window.__kiuExamsExportHooks, {
        getTemplateDraft,
        getTemplateById,
        formatCourseYearLabel,
        notify
    });

    window.exportQuizAs = async function exportQuizAs(format) {
        await ensureExamsExportModule();
        return window.__kiuExportQuizAsImpl(format);
    };

    window.exportQuizById = async function exportQuizById(templateId, format) {
        await ensureExamsExportModule();
        return window.__kiuExportQuizByIdImpl(templateId, format);
    };


    Object.assign(__examsWorkspaceDeps, {
        escapeHtml, clone, uniqueStrings, toFieldToken, hasExamsAttemptsModule, ensureExamsAttemptsModule,
        hasExamsBuilderModule, ensureExamsBuilderModule, hasExamsAdminModule, ensureExamsAdminModule, makeLocalId, parseDate,
        formatDateTime, formatShortDate, formatCountdown, getRole, getCurrentUserSafe, getCurrentFacultyCode,
        getFacultyLabelSafe, getCurrentStaffName, canUseCrossFacultyExamView, persistState, notify, ensureStores,
        clampPositiveInt, getSubjectDefaultKey, getQuestionDefaultsForSubject, saveQuestionDefaultsForSubject, getDraftQuestionDefaults, formatCourseYearLabel,
        renderCourseYearOptions, getTemplateEntries, getTemplates, getTemplateById, getTemplateContainer, getSessions,
        getSessionById, getSubjectOptions, getSubjectById, getGroupsForSubject, resolveGroupName, createQuestion,
        normalizeQuestion, applyQuestionOptionCount, createTemplateDraft, shuffleArray, autoGenerateVariants, getShareableStaff,
        isSharedWithMe, isMySentTemplate, isMyDraft, createScheduleDraft, getTemplateDraft, getScheduleDraft,
        normalizeSubjectKey, getStudentScheduleEntries, resolveSubjectNameFromSchedule, normalizeStudentRecord, getAllKnownStudents, buildStudentSubjectPattern,
        buildSubjectAutoCohorts, getSelectedCohorts, getSelectedStudentsForSchedule, getSelectedSessionStatus, getSessionRoomLabel, getSessionObserverNames,
        getAssignedStudents, getAssignedStudentIds, rangesOverlap, getScheduleDraftIssues, syncTemplateLinks, upsertTemplate,
        upsertSession, getBackendWarning, getAttemptStore, loadAttemptsForSession, getAttemptsForSession, getAttemptStudentId,
        deriveAttemptState, buildSessionActivity, getTemplateTotalScore, buildRenderPassSnapshot, beginRenderPass, endRenderPass,
        getReviewTemplates, getApprovedTemplates, getReviewQueueGroups, getReviewFacultyOptions, getFilteredTemplates, getLiveSessions,
        getResultSessions, getWorkspaceStatChips, renderWorkspaceTitle, renderWorkspaceStatsInline, renderWorkspaceTabRow, renderWorkspaceChrome,
        renderTabBar, renderHero, renderTemplateList, renderBuilderLoadingState, renderTemplateBuilder, renderExamModalShell,
        renderShareModal, renderQuestionEditor, renderAdminLoadingPanel, detectScheduleCollisions, generateExamPIN, hasExamsExportModule,
        ensureExamsExportModule,
        escapeHtml, legacyRenderAdminExamSection, runtime, ROOT_ID, TABS,
        STAFF_ROLES, ADMIN_ROLES, MANUAL_TYPES, TEMPLATE_STATUSES, STAFF_SUB_TABS
    });

})();



