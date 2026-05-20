(function initExamConsole() {
    const legacyRenderAdminExamSection = typeof window.renderAdminExamSection === 'function'
        ? window.renderAdminExamSection
        : null;

    const ROOT_ID = 'admin-exams-root';
    const STYLE_ID = 'kiu-exams-console-styles';
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
        currentBankPage: 0
    };
    let examsAdminModulePromise = null;
    let examsBuilderModulePromise = null;
    let examsAttemptsModulePromise = null;

    function escapeHtml(value) {
        return String(value ?? '')
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
        renderConsole();
        try {
            const payload = await fetchProtectedQuizAttempts(session.protectedCourseId || `exam-session::${session.id}`, session.protectedQuizId || session.id);
            store.attempts = Array.isArray(payload?.attempts) ? payload.attempts : [];
            store.error = '';
        } catch (error) {
            store.error = error?.message || 'Attempts could not be loaded.';
        } finally {
            store.loading = false;
            renderConsole();
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

    function getReviewTemplates() {
        return getTemplates().filter(template => ['submitted', 'in_review'].includes(String(template?.status || '').trim().toLowerCase()));
    }

    function getApprovedTemplates() {
        return getTemplates().filter(template => String(template?.status || '').trim().toLowerCase() === 'approved');
    }

    function getFilteredTemplates(searchText, statusFilter, staffSubTab) {
        let list = getTemplates();
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

        // Status filter
        if (statusFilter && statusFilter !== 'all') {
            list = list.filter(t => String(t.status || 'draft').toLowerCase() === statusFilter.toLowerCase());
        }

        // Search text
        const q = String(searchText || '').trim().toLowerCase();
        if (q) {
            list = list.filter(t =>
                (t.title || '').toLowerCase().includes(q) ||
                (t.subjectName || '').toLowerCase().includes(q) ||
                (t.subjectId || '').toLowerCase().includes(q)
            );
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

    function renderHero() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const templates = getTemplates();
        const sessions = getSessions();
        const reviewCount = getReviewTemplates().length;
        const liveCount = sessions.filter(s => getSelectedSessionStatus(s) === 'live').length;
        const returnedCount = templates.filter(t => String(t.status||'').toLowerCase() === 'returned').length;
        const approvedCount = getApprovedTemplates().length;

        return `
            <div class="ex2-command-bar">
                <h1><i class="fas ${isAdmin ? 'fa-satellite-dish' : 'fa-wand-magic-sparkles'}"></i> ${isAdmin ? 'Exam Command Center' : 'Quiz Studio'}</h1>
            </div>
            <div class="ex2-stats-row">
                ${isAdmin ? `
                    <div class="ex2-stat-card is-pending"><strong>${reviewCount}</strong><span>Awaiting Review</span></div>
                    <div class="ex2-stat-card is-approved"><strong>${sessions.length}</strong><span>Scheduled</span></div>
                    <div class="ex2-stat-card${liveCount ? ' is-live' : ''}"><strong>${liveCount}</strong><span>Live Now</span></div>
                    <div class="ex2-stat-card"><strong>${templates.length}</strong><span>All Templates</span></div>
                ` : `
                    <div class="ex2-stat-card is-draft"><strong>${templates.length}</strong><span>My Quizzes</span></div>
                    <div class="ex2-stat-card is-pending"><strong>${templates.filter(t => t.status === 'submitted').length}</strong><span>Pending Review</span></div>
                    <div class="ex2-stat-card${returnedCount ? ' is-returned' : ''}"><strong>${returnedCount}</strong><span>Returned</span></div>
                    <div class="ex2-stat-card is-approved"><strong>${approvedCount}</strong><span>Approved</span></div>
                `}
            </div>
        `;
    }

    function renderTabBar() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const reviewCount = getReviewTemplates().length;
        const liveCount = getSessions().filter(s => getSelectedSessionStatus(s) === 'live').length;
        const TAB_META = {
            templates: { icon: 'fa-file-lines', label: isAdmin ? 'All Templates' : 'Quiz Builder' },
            review:    { icon: 'fa-clipboard-check', label: 'Review', badge: reviewCount },
            schedule:  { icon: 'fa-calendar-plus', label: 'Schedule' },
            live:      { icon: 'fa-tower-broadcast', label: 'Live', badge: liveCount },
            results:   { icon: 'fa-chart-column', label: 'Results' }
        };
        const visibleTabs = TABS.filter(tab => tab === 'templates' || isAdmin);
        return `
            <section class="ex2-toolbar">
                <div class="ex2-tab-row">
                    ${visibleTabs.map(tab => {
                        const meta = TAB_META[tab] || {};
                        return `<button type="button" class="ex2-tab${runtime.activeTab === tab ? ' is-active' : ''}" data-exam-call="setExamTab" data-exam-args='["${tab}"]'><i class="fas ${meta.icon || 'fa-circle'}"></i> ${escapeHtml(meta.label || tab)}${meta.badge ? ` <span class="ex2-tab-badge">${meta.badge}</span>` : ''}</button>`;
                    }).join('')}
                </div>
                ${getBackendWarning() ? `<div class="ex2-warning"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(getBackendWarning())}</div>` : ''}
            </section>
        `;
    }

    function renderTemplateList() {
        const role = getRole();
        const isAdmin = ADMIN_ROLES.has(role);
        const allTemplates = getTemplates();
        const filtered = getFilteredTemplates(runtime.templateSearch, runtime.templateFilter, runtime.staffSubTab);
        const bankCount = (t) => (t.questionBank || t.questions || []).length;
        const varCount = (t) => (t.variants || []).length;

        return `
            <section class="ex2-panel">
                <div class="ex2-panel-head">
                    <div>
                        <h2><i class="fas ${isAdmin ? 'fa-folder-open' : 'fa-wand-magic-sparkles'}" style="margin-right:8px;opacity:.5;"></i>${isAdmin ? 'All Templates' : 'Quiz Builder'}</h2>
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
                <div class="ex2-inline-actions" style="margin-bottom:14px;">
                    <input class="ex2-input" type="text" placeholder="Search quizzes..." value="${escapeHtml(runtime.templateSearch)}" data-exam-input-call="setExamTemplateSearch" data-exam-input-args='["$value"]' style="max-width:280px;">
                    <select class="ex2-select" data-exam-change-call="setExamTemplateFilter" data-exam-change-args='["$value"]' style="max-width:160px;">
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
                            <article class="ex2-quiz-card" style="animation-delay:${idx * 0.04}s" data-exam-call="editExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'>
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                                    <span class="ex2-status-dot is-${escapeHtml(String(template.status||'draft').toLowerCase())}">${escapeHtml(String(template.status||'draft').replace(/_/g,' '))}</span>
                                    <span style="font-size:11px;color:var(--lux-text-muted);">${escapeHtml(template.examType === 'paper' ? 'Paper' : 'Digital')}</span>
                                </div>
                                <h3 style="font-size:16px;font-weight:700;margin:0 0 6px;">${escapeHtml(template.title || 'Untitled')}</h3>
                                <div style="font-size:13px;color:var(--lux-text-muted);margin-bottom:10px;">${escapeHtml(template.subjectName || template.subjectId || 'No subject')}${template.courseNumber ? ` - ${escapeHtml(formatCourseYearLabel(template.courseNumber))}` : ''}${template.courseCode ? ` - No. ${escapeHtml(template.courseCode)}` : ''}</div>
                                <div class="ex2-mini-grid" style="margin-top:0;">
                                    <div><strong>${bankCount(template)}</strong><span>Questions</span></div>
                                    <div><strong>${varCount(template)}</strong><span>Variants</span></div>
                                    <div><strong>${template.gradingWeight || 30}</strong><span>Quiz pts</span></div>
                                </div>
                                ${String(template.status||'').toLowerCase() === 'returned' && template.revisionNote ? `<div class="ex2-revision-note" style="margin-top:12px;"><i class="fas fa-comment-dots"></i> ${escapeHtml(template.revisionNote)}</div>` : ''}
                                <div class="ex2-inline-actions" style="margin-top:14px;">
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
                    <div class="ex2-empty-state">
                        <i class="fas fa-graduation-cap"></i>
                        <p>${isAdmin ? 'No templates match your filters.' : 'No quizzes yet. Create your first one!'}</p>
                        <button type="button" class="ex2-btn is-primary" data-exam-call="beginExamTemplateCreation"><i class="fas fa-plus"></i> Create Quiz</button>
                    </div>
                `}
            </section>
        `;
    }


    function renderBuilderLoadingState() {
        return `
            <div class="ex2-builder-fullscreen">
                <div class="ex2-panel">
                    <div class="ex2-empty-state">
                        <i class="fas fa-wand-magic-sparkles"></i>
                        <p><strong>Loading Quiz Builder</strong></p>
                        <p>Preparing the question bank, variant editor, and review workspace.</p>
                    </div>
                </div>
            </div>
        `;
    }

    function renderTemplateBuilder() {
        if (hasExamsBuilderModule()) {
            return window.renderExamTemplateBuilder();
        }
        ensureExamsBuilderModule().then(() => renderConsole()).catch(() => null);
        return renderBuilderLoadingState();
    }

    /* â”€â”€ Share Modal â”€â”€ */
    function renderExamModalShell({ modalKey, title, icon, tone = 'accent', body }) {
        const normalizedKey = String(modalKey || '').trim().toLowerCase();
        const closeAction = normalizedKey === 'return' ? 'close-return-modal' : 'close-share-modal';
        const titleId = `ex2-modal-title-${toFieldToken(normalizedKey || 'dialog')}`;
        return `
            <div class="ex2-modal-overlay" data-exam-modal="${escapeHtml(normalizedKey)}">
                <div class="ex2-modal" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}">
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
                    <div class="ex2-list-item">
                        <div><strong>${escapeHtml(s.name)}</strong><span class="ex2-modal-meta">${escapeHtml(s.role)}</span></div>
                        ${alreadyShared.has(s.id) ? `<span class="ex2-status is-approved">Shared</span>` : `<button type="button" class="ex2-btn is-secondary" data-exam-action="share-with-staff" data-user-id="${escapeHtml(s.id)}" data-user-name="${escapeHtml(s.name)}"><i class="fas fa-share"></i> Share</button>`}
                    </div>
                `).join('') : `<div class="ex2-empty">No colleagues found in your faculty.</div>`}
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
        getTemplateById,
        getScheduleDraft,
        getSelectedStudentsForSchedule,
        getScheduleDraftIssues,
        getSessions,
        buildSubjectAutoCohorts,
        detectScheduleCollisions,
        generateExamPIN,
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
                        <label class="ex2-field" style="margin:0;min-width:80px;">
                            <span style="font-size:11px;">Points</span>
                            <input class="ex2-input" type="number" min="1" value="${escapeHtml(String(question.score || 1))}" style="width:70px;" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","score","$value"]'>
                        </label>
                        <label class="ex2-field" style="margin:0;min-width:110px;">
                            <span style="font-size:11px;">Options</span>
                            <input class="ex2-input" type="number" min="2" max="8" value="${escapeHtml(String((question.options || []).length || question.optionCount || 4))}" style="width:86px;" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","optionCount","$value"]'>
                        </label>
                    </div>
                </div>
                <div class="ex2-form-grid">
                    <label class="ex2-field ex2-field-span">
                        <span>Question text</span>
                        <textarea class="ex2-textarea" rows="3" data-exam-input-call="${syncFunc}" data-exam-input-args='["${escapeHtml(question.id)}","text","$value"]' data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","text","$value"]'>${escapeHtml(question.text)}</textarea>
                    </label>
                    <label class="ex2-field">
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
            <section class="ex2-panel">
                <div class="ex2-empty-state">
                    <i class="fas fa-user-shield"></i>
                    <p><strong>${escapeHtml(title)}</strong></p>
                    <p>${escapeHtml(description)}</p>
                </div>
            </section>
        `;
    }

    function renderReviewTab() {
        if (hasExamsAdminModule()) {
            return window.renderExamReviewTab();
        }
        ensureExamsAdminModule().then(() => renderConsole()).catch(() => null);
        return renderAdminLoadingPanel(
            'Loading Review Queue',
            'Preparing submitted quizzes, return notes, and approval actions.'
        );
    }

    function renderScheduleBoard() {
        if (hasExamsAdminModule()) {
            return window.renderExamScheduleBoard();
        }
        ensureExamsAdminModule().then(() => renderConsole()).catch(() => null);
        return renderAdminLoadingPanel(
            'Loading Schedule Builder',
            'Preparing approved templates, cohort groups, and scheduled exam sessions.'
        );
    }
    function renderExamsAttemptsLoadingPanel(title, description) {
        return `
            <section class="ex2-panel">
                <div class="ex2-empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p><strong>${escapeHtml(title)}</strong></p>
                    <p>${escapeHtml(description)}</p>
                </div>
            </section>
        `;
    }

    function renderLiveTab() {
        if (hasExamsAttemptsModule()) {
            return window.renderExamLiveTab();
        }
        ensureExamsAttemptsModule().then(() => renderConsole()).catch(() => null);
        return renderExamsAttemptsLoadingPanel(
            'Loading Live Monitoring',
            'Preparing session activity, warning counters, and live attempt controls.'
        );
    }

    function renderResultsTab() {
        if (hasExamsAttemptsModule()) {
            return window.renderExamResultsTab();
        }
        ensureExamsAttemptsModule().then(() => renderConsole()).catch(() => null);
        return renderExamsAttemptsLoadingPanel(
            'Loading Results Queue',
            'Preparing objective scores, manual review inputs, and session grading controls.'
        );
    }

    function renderWorkspace() {
        const role = getRole();
        if (!STAFF_ROLES.has(role)) {
            return `<div class="ex2-empty">This exam workspace is available only to admin, professor, and teaching assistant accounts.</div>`;
        }
        const isAdmin = ADMIN_ROLES.has(role);
        const adminOnlyTabs = new Set(['review', 'schedule', 'live', 'results']);
        if (adminOnlyTabs.has(runtime.activeTab) && !isAdmin) runtime.activeTab = 'templates';
        const hasActiveDraft = runtime.templateDraft !== null;
        return `
            <div class="ex2-shell">
                ${renderHero()}
                ${renderTabBar()}
                ${runtime.activeTab === 'templates' ? `
                    <div class="ex2-stack">
                        ${hasActiveDraft ? renderTemplateBuilder() : renderTemplateList()}
                    </div>
                ` : runtime.activeTab === 'review' ? renderReviewTab()
                    : runtime.activeTab === 'schedule' ? renderScheduleBoard()
                    : runtime.activeTab === 'live' ? renderLiveTab()
                    : renderResultsTab()}
            </div>
        `;
    }

    function renderConsole() {
        ensureStyles();
        const root = document.getElementById(ROOT_ID);
        if (!root) return;
        bindConsoleEvents(root);
        root.innerHTML = renderWorkspace();
    }

    function handleConsoleClick(event) {
        const root = document.getElementById(ROOT_ID);
        if (!root || !root.contains(event.target)) return;
        if (event.target.classList?.contains('ex2-modal-overlay') && event.target === event.target.closest('.ex2-modal-overlay')) {
            const modalKey = String(event.target.getAttribute('data-exam-modal') || '').trim().toLowerCase();
            if (modalKey === 'return') {
                closeReturnModalInternal();
                return;
            }
            if (modalKey === 'share') {
                closeShareModalInternal();
            }
            return;
        }
        const invokeEl = event.target.closest('[data-exam-call]');
        if (invokeEl && root.contains(invokeEl)) {
            const fnName = String(invokeEl.getAttribute('data-exam-call') || '').trim();
            if (fnName) {
                event.preventDefault();
                event.stopPropagation();
                invokeExamDelegate(fnName, invokeEl.getAttribute('data-exam-args'), invokeEl);
                return;
            }
        }
        const actionEl = event.target.closest('[data-exam-action]');
        if (!actionEl || !root.contains(actionEl)) return;
        const action = String(actionEl.getAttribute('data-exam-action') || '').trim();
        if (action === 'close-share-modal') return closeShareModalInternal();
        if (action === 'close-return-modal') return closeReturnModalInternal();
        if (action === 'execute-return') return executeReturnForRevisionInternal();
        if (action === 'share-with-staff') {
            return shareExamWithInternal(
                actionEl.getAttribute('data-user-id') || '',
                actionEl.getAttribute('data-user-name') || ''
            );
        }
    }

    function parseExamDelegateArgs(raw) {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function invokeExamDelegate(fnName, rawArgs, target) {
        const fn = window[fnName];
        if (typeof fn !== 'function') return;
        const args = parseExamDelegateArgs(rawArgs).map((item) => {
            if (item === '$value') return target?.value;
            if (item === '$checked') return Boolean(target?.checked);
            if (typeof item === 'string' && item.startsWith('$bankIndex:')) {
                const upperBound = parseInt(item.split(':')[1], 10) || 0;
                const nextValue = Math.max(0, Math.min(upperBound, (parseInt(target?.value, 10) || 1) - 1));
                return nextValue;
            }
            return item;
        });
        return fn(...args);
    }

    function handleConsoleInput(event) {
        const root = document.getElementById(ROOT_ID);
        const target = event.target;
        if (!root || !target || !root.contains(target)) return;
        const fnName = String(target.getAttribute('data-exam-input-call') || '').trim();
        if (fnName) {
            invokeExamDelegate(fnName, target.getAttribute('data-exam-input-args'), target);
            return;
        }
        const inputType = String(target.getAttribute('data-exam-input') || '').trim();
        if (inputType === 'share-search') {
            runtime.shareSearchQuery = String(target.value || '');
            renderConsole();
            return;
        }
        if (inputType === 'return-note') {
            runtime.returnNote = String(target.value || '');
        }
    }

    function handleConsoleChange(event) {
        const root = document.getElementById(ROOT_ID);
        const target = event.target;
        if (!root || !target || !root.contains(target)) return;
        const fnName = String(target.getAttribute('data-exam-change-call') || '').trim();
        if (!fnName) return;
        invokeExamDelegate(fnName, target.getAttribute('data-exam-change-args'), target);
    }

    function bindConsoleEvents(root) {
        if (!root || root.dataset.examConsoleBound === '1') return;
        root.dataset.examConsoleBound = '1';
        root.addEventListener('click', handleConsoleClick);
        root.addEventListener('input', handleConsoleInput);
        root.addEventListener('change', handleConsoleChange);
    }

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${ROOT_ID} {
                color: var(--lux-text);
            }
            #${ROOT_ID} .ex2-shell,
            #${ROOT_ID} .ex2-stack,
            #${ROOT_ID} .ex2-list,
            #${ROOT_ID} .ex2-attempt-list,
            #${ROOT_ID} .ex2-options,
            #${ROOT_ID} .ex2-mini-list {
                display: grid;
                gap: 16px;
            }
            #${ROOT_ID} .ex2-hero,
            #${ROOT_ID} .ex2-panel,
            #${ROOT_ID} .ex2-toolbar,
            #${ROOT_ID} .ex2-card,
            #${ROOT_ID} .ex2-cohort-card,
            #${ROOT_ID} .ex2-session-card,
            #${ROOT_ID} .ex2-list-card,
            #${ROOT_ID} .ex2-question-card,
            #${ROOT_ID} .ex2-review-card,
            #${ROOT_ID} .ex2-side-card,
            #${ROOT_ID} .ex2-select-card {
                border: 1px solid var(--lux-border);
                border-radius: 24px;
                box-shadow: var(--lux-shadow);
                backdrop-filter: blur(22px);
            }
            #${ROOT_ID} .ex2-panel,
            #${ROOT_ID} .ex2-toolbar,
            #${ROOT_ID} .ex2-card,
            #${ROOT_ID} .ex2-cohort-card,
            #${ROOT_ID} .ex2-session-card,
            #${ROOT_ID} .ex2-list-card,
            #${ROOT_ID} .ex2-question-card,
            #${ROOT_ID} .ex2-review-card,
            #${ROOT_ID} .ex2-side-card,
            #${ROOT_ID} .ex2-select-card {
                background: color-mix(in srgb, var(--lux-surface) 90%, transparent);
            }
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-panel,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-toolbar,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-cohort-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-session-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-list-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-question-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-review-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-side-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-select-card,
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-toolbar {
                background: rgba(10, 16, 29, 0.78);
            }
            #${ROOT_ID} .ex2-hero {
                display: grid;
                grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
                gap: 18px;
                padding: 28px;
                margin-top: 24px;
                color: #fff;
                background:
                    radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 36%),
                    linear-gradient(135deg, rgba(var(--lux-accent-rgb), 0.95), rgba(15, 27, 49, 0.98));
            }
            #${ROOT_ID} .ex2-kicker {
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                opacity: 0.82;
            }
            #${ROOT_ID} .ex2-hero h1 {
                margin: 8px 0 12px;
                font-size: clamp(28px, 4vw, 40px);
                line-height: 1.04;
            }
            #${ROOT_ID} .ex2-hero p,
            #${ROOT_ID} .ex2-card-copy,
            #${ROOT_ID} .ex2-list-copy,
            #${ROOT_ID} .ex2-side-copy {
                color: inherit;
                line-height: 1.65;
                font-size: 14px;
            }
            #${ROOT_ID} .ex2-chip-row,
            #${ROOT_ID} .ex2-inline-actions,
            #${ROOT_ID} .ex2-tag-row,
            #${ROOT_ID} .ex2-step-row,
            #${ROOT_ID} .ex2-tab-row,
            #${ROOT_ID} .ex2-attempt-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            #${ROOT_ID} .ex2-manual-stack {
                display: grid;
                gap: 8px;
                min-width: 220px;
            }
            #${ROOT_ID} .ex2-manual-score-row {
                display: grid;
                grid-template-columns: minmax(72px, 1fr) 88px;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                font-weight: 800;
                color: var(--lux-text-muted);
            }
            #${ROOT_ID} .ex2-chip,
            #${ROOT_ID} .ex2-tag,
            #${ROOT_ID} .ex2-faculty-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 999px;
                border: 1px solid color-mix(in srgb, var(--lux-border) 75%, transparent);
                font-size: 12px;
                font-weight: 700;
                color: var(--lux-text-muted);
                background: color-mix(in srgb, var(--lux-surface-2) 88%, transparent);
            }
            #${ROOT_ID} .ex2-chip {
                border-color: rgba(255,255,255,0.2);
                color: rgba(255,255,255,0.92);
                background: rgba(255,255,255,0.1);
            }
            #${ROOT_ID} .ex2-hero-stats,
            #${ROOT_ID} .ex2-mini-grid,
            #${ROOT_ID} .ex2-summary-list,
            #${ROOT_ID} .ex2-form-grid,
            #${ROOT_ID} .ex2-card-grid,
            #${ROOT_ID} .ex2-cohort-grid,
            #${ROOT_ID} .ex2-schedule-board,
            #${ROOT_ID} .ex2-two-col,
            #${ROOT_ID} .ex2-three-col {
                display: grid;
                gap: 16px;
            }
            #${ROOT_ID} .ex2-hero-stats {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                align-self: start;
            }
            #${ROOT_ID} .ex2-stat {
                border-radius: 18px;
                padding: 16px;
                background: rgba(255,255,255,0.12);
            }
            #${ROOT_ID} .ex2-stat strong {
                display: block;
                font-size: 28px;
                line-height: 1;
            }
            #${ROOT_ID} .ex2-stat span {
                display: block;
                margin-top: 8px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                opacity: 0.8;
            }
            #${ROOT_ID} .ex2-toolbar,
            #${ROOT_ID} .ex2-panel,
            #${ROOT_ID} .ex2-card,
            #${ROOT_ID} .ex2-cohort-card,
            #${ROOT_ID} .ex2-session-card,
            #${ROOT_ID} .ex2-list-card,
            #${ROOT_ID} .ex2-question-card,
            #${ROOT_ID} .ex2-review-card,
            #${ROOT_ID} .ex2-side-card {
                padding: 22px;
            }
            #${ROOT_ID} .ex2-toolbar {
                position: sticky;
                top: 16px;
                z-index: 5;
            }
            #${ROOT_ID} .ex2-panel-head,
            #${ROOT_ID} .ex2-card-top,
            #${ROOT_ID} .ex2-question-head,
            #${ROOT_ID} .ex2-session-head,
            #${ROOT_ID} .ex2-attempt-main {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            #${ROOT_ID} h2,
            #${ROOT_ID} h3 {
                margin: 0;
            }
            #${ROOT_ID} .ex2-panel-head p,
            #${ROOT_ID} .ex2-meta,
            #${ROOT_ID} .ex2-muted {
                margin: 6px 0 0;
                color: var(--lux-text-muted);
                font-size: 13px;
                line-height: 1.6;
            }
            #${ROOT_ID} .ex2-form-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            #${ROOT_ID} .ex2-card-grid,
            #${ROOT_ID} .ex2-cohort-grid,
            #${ROOT_ID} .ex2-schedule-board {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            #${ROOT_ID} .ex2-two-col {
                grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
            }
            #${ROOT_ID} .ex2-three-col {
                grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr) minmax(320px, 0.86fr);
                align-items: start;
            }
            #${ROOT_ID} .ex2-field {
                display: grid;
                gap: 8px;
                color: var(--lux-text);
                font-size: 13px;
                font-weight: 700;
            }
            #${ROOT_ID} .ex2-field-span {
                grid-column: 1 / -1;
            }
            #${ROOT_ID} .ex2-input,
            #${ROOT_ID} .ex2-select,
            #${ROOT_ID} .ex2-textarea {
                width: 100%;
                min-height: 46px;
                padding: 12px 14px;
                border-radius: 16px;
                border: 1px solid var(--lux-border);
                background: color-mix(in srgb, var(--lux-surface-2) 92%, transparent);
                color: var(--lux-text);
                font: inherit;
                box-sizing: border-box;
            }
            #${ROOT_ID} .ex2-textarea {
                resize: vertical;
                min-height: 120px;
            }
            #${ROOT_ID} .ex2-input.is-small,
            #${ROOT_ID} .ex2-select.is-small {
                min-height: 40px;
                padding: 8px 12px;
                border-radius: 12px;
            }
            #${ROOT_ID} .ex2-btn,
            #${ROOT_ID} .ex2-step,
            #${ROOT_ID} .ex2-tab,
            #${ROOT_ID} .ex2-select-card {
                appearance: none;
                cursor: pointer;
                font: inherit;
                transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
            }
            #${ROOT_ID} .ex2-btn,
            #${ROOT_ID} .ex2-step,
            #${ROOT_ID} .ex2-tab {
                min-height: 42px;
                padding: 0 16px;
                border-radius: 14px;
                border: 1px solid var(--lux-border);
                color: var(--lux-text);
                background: color-mix(in srgb, var(--lux-surface-2) 90%, transparent);
                font-weight: 800;
            }
            #${ROOT_ID} .ex2-btn.is-primary {
                color: #fff;
                border-color: transparent;
                background: linear-gradient(135deg, rgba(var(--lux-accent-rgb), 0.96), rgba(var(--lux-accent-rgb), 0.75));
            }
            #${ROOT_ID} .ex2-btn.is-secondary,
            #${ROOT_ID} .ex2-step.is-active,
            #${ROOT_ID} .ex2-tab.is-active,
            #${ROOT_ID} .ex2-select-card.is-selected,
            #${ROOT_ID} .ex2-cohort-card.is-selected {
                border-color: rgba(var(--lux-accent-rgb), 0.5);
                background: color-mix(in srgb, rgba(var(--lux-accent-rgb), 0.16) 84%, var(--lux-surface));
            }
            #${ROOT_ID} .ex2-btn.is-ghost {
                background: transparent;
            }
            #${ROOT_ID} .ex2-step-row {
                justify-content: flex-end;
            }
            #${ROOT_ID} .ex2-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                background: rgba(var(--lux-accent-rgb), 0.14);
                color: rgb(var(--lux-accent-rgb));
            }
            #${ROOT_ID} .ex2-status.is-approved,
            #${ROOT_ID} .ex2-status.is-live,
            #${ROOT_ID} .ex2-status.is-submitted {
                background: rgba(42, 179, 122, 0.14);
                color: #208b64;
            }
            #${ROOT_ID} .ex2-status.is-flagged,
            #${ROOT_ID} .ex2-status.is-in_review {
                background: rgba(214, 138, 17, 0.14);
                color: #d68a11;
            }
            #${ROOT_ID} .ex2-status.is-archived,
            #${ROOT_ID} .ex2-status.is-closed,
            #${ROOT_ID} .ex2-status.is-blocked {
                background: rgba(107, 114, 128, 0.18);
                color: #6b7280;
            }
            #${ROOT_ID} .ex2-status.is-neutral {
                background: rgba(var(--lux-accent-rgb), 0.14);
                color: rgb(var(--lux-accent-rgb));
            }
            #${ROOT_ID} .ex2-mini-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            #${ROOT_ID} .ex2-mini-grid > div,
            #${ROOT_ID} .ex2-summary-list > div {
                padding: 14px;
                border-radius: 18px;
                border: 1px solid var(--lux-border);
                background: color-mix(in srgb, var(--lux-surface-2) 90%, transparent);
            }
            #${ROOT_ID} .ex2-summary-list > div {
                display: flex;
                justify-content: space-between;
                gap: 12px;
            }
            #${ROOT_ID} .ex2-mini-grid strong,
            #${ROOT_ID} .ex2-summary-list strong {
                display: block;
                font-size: 20px;
                line-height: 1;
                margin-bottom: 6px;
            }
            #${ROOT_ID} .ex2-mini-grid span,
            #${ROOT_ID} .ex2-summary-list span {
                color: var(--lux-text-muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-weight: 800;
            }
            #${ROOT_ID} .ex2-filter-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 220px;
                gap: 12px;
                margin-bottom: 18px;
            }
            #${ROOT_ID} .ex2-options {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            #${ROOT_ID} .ex2-option {
                display: grid;
                grid-template-columns: 30px minmax(0, 1fr);
                gap: 10px;
                align-items: center;
            }
            #${ROOT_ID} .ex2-toggle {
                display: flex;
                gap: 12px;
                align-items: center;
                margin-top: 16px;
                color: var(--lux-text);
            }
            #${ROOT_ID} .ex2-issue-list,
            #${ROOT_ID} .ex2-warning {
                margin-top: 16px;
                padding: 14px 16px;
                border-radius: 16px;
                border: 1px solid rgba(214, 138, 17, 0.35);
                background: rgba(214, 138, 17, 0.1);
                color: #c47a0a;
                display: grid;
                gap: 8px;
            }
            #${ROOT_ID} .ex2-empty {
                padding: 26px;
                border-radius: 18px;
                border: 1px dashed var(--lux-border-strong, var(--lux-border));
                color: var(--lux-text-muted);
                text-align: center;
                background: color-mix(in srgb, var(--lux-surface-2) 72%, transparent);
            }
            #${ROOT_ID} .ex2-side-panel {
                position: sticky;
                top: 92px;
                display: grid;
                gap: 16px;
                align-self: start;
            }
            #${ROOT_ID} .ex2-side-kicker {
                text-transform: uppercase;
                letter-spacing: 0.12em;
                font-size: 11px;
                font-weight: 900;
                color: var(--lux-text-muted);
                margin-bottom: 14px;
            }
            #${ROOT_ID} .ex2-summary-list {
                gap: 10px;
            }
            #${ROOT_ID} .ex2-list-card,
            #${ROOT_ID} .ex2-attempt-row {
                display: grid;
                gap: 14px;
            }
            #${ROOT_ID} .ex2-list-item {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                align-items: center;
                padding: 12px 14px;
                border: 1px solid var(--lux-border);
                border-radius: 16px;
                background: color-mix(in srgb, var(--lux-surface-2) 90%, transparent);
            }
            #${ROOT_ID} .ex2-list.compact .ex2-list-item.compact {
                padding: 10px 12px;
            }
            #${ROOT_ID} .ex2-select-card {
                width: 100%;
                padding: 16px 18px;
                display: flex;
                justify-content: space-between;
                gap: 12px;
                text-align: left;
                color: var(--lux-text);
            }
            #${ROOT_ID} .ex2-cohort-card.is-selected,
            #${ROOT_ID} .ex2-select-card.is-selected,
            #${ROOT_ID} .ex2-btn:hover,
            #${ROOT_ID} .ex2-tab:hover,
            #${ROOT_ID} .ex2-step:hover {
                transform: translateY(-1px);
            }
            #${ROOT_ID} .ex2-cohort-check {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 800;
            }
            #${ROOT_ID} .ex2-mini-list {
                gap: 8px;
                color: var(--lux-text-muted);
                font-size: 13px;
            }
            #${ROOT_ID} .ex2-results-row,
            #${ROOT_ID} .ex2-results-meta {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }
            #${ROOT_ID} .ex2-response-summary {
                color: var(--lux-text-muted);
                font-size: 12px;
            }
            /* â”€â”€ Modal â”€â”€ */
            #${ROOT_ID} .ex2-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: var(--ex2-modal-overlay-bg, rgba(3, 8, 20, 0.52));
                backdrop-filter: blur(var(--ex2-modal-overlay-blur, 4px));
                -webkit-backdrop-filter: blur(var(--ex2-modal-overlay-blur, 4px));
            }
            #${ROOT_ID} .ex2-modal {
                width: min(520px, calc(100vw - 28px));
                max-height: min(720px, calc(100vh - 32px));
                border-radius: 24px;
                overflow: hidden;
                border: 1px solid var(--lux-border);
                background: var(--lux-surface);
                box-shadow: 0 22px 52px rgba(0,0,0,0.32);
            }
            #${ROOT_ID} .ex2-modal-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 22px;
            }
            #${ROOT_ID} .ex2-modal-head.is-accent {
                background: linear-gradient(135deg, rgba(var(--lux-accent-rgb),0.95), rgba(var(--lux-accent-rgb),0.72));
            }
            #${ROOT_ID} .ex2-modal-head.is-warm {
                background: linear-gradient(135deg, #d68a11, #c47a0a);
            }
            #${ROOT_ID} .ex2-modal-head h3 { margin: 0; color: #fff; font-size: 16px; }
            #${ROOT_ID} .ex2-modal-close {
                color: #fff !important;
            }
            #${ROOT_ID} .ex2-modal-body {
                padding: 18px;
                display: grid;
                gap: 14px;
            }
            #${ROOT_ID} .ex2-modal-search {
                margin-bottom: 0;
            }
            #${ROOT_ID} .ex2-modal-list {
                max-height: 320px;
                overflow: auto;
            }
            #${ROOT_ID} .ex2-modal-meta {
                margin-left: 8px;
                font-size: 12px;
                color: var(--lux-text-muted);
            }
            #${ROOT_ID} .ex2-modal-actions {
                margin-top: 4px;
            }
            /* â”€â”€ Revision Note â”€â”€ */
            #${ROOT_ID} .ex2-revision-note {
                margin-top: 10px;
                padding: 12px 16px;
                border-radius: 14px;
                border: 1px solid rgba(214,138,17,0.4);
                background: rgba(214,138,17,0.08);
                color: #c47a0a;
                font-size: 13px;
                line-height: 1.6;
            }
            #${ROOT_ID} .ex2-card-returned {
                border-color: rgba(214,138,17,0.35) !important;
            }
            /* â”€â”€ Auto-Gen Box â”€â”€ */
            #${ROOT_ID} .ex2-auto-gen-box {
                padding: 20px;
                border-radius: 20px;
                border: 1px dashed rgba(var(--lux-accent-rgb),0.4);
                background: color-mix(in srgb, rgba(var(--lux-accent-rgb),0.06) 80%, var(--lux-surface));
            }
            /* â”€â”€ Step Numbers â”€â”€ */
            #${ROOT_ID} .ex2-step-num {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: rgba(var(--lux-accent-rgb),0.2);
                font-size: 11px;
                font-weight: 900;
                margin-right: 4px;
            }
            #${ROOT_ID} .ex2-step.is-active .ex2-step-num {
                background: rgba(var(--lux-accent-rgb),0.5);
                color: #fff;
            }
            /* â”€â”€ Returned status â”€â”€ */
            #${ROOT_ID} .ex2-status.is-returned {
                background: rgba(214,138,17,0.14);
                color: #d68a11;
            }
            @media (max-width: 1180px) {
                #${ROOT_ID} .ex2-hero,
                #${ROOT_ID} .ex2-two-col,
                #${ROOT_ID} .ex2-three-col {
                    grid-template-columns: 1fr;
                }
                #${ROOT_ID} .ex2-side-panel {
                    position: static;
                }
            }
            @media (max-width: 760px) {
                #${ROOT_ID} .ex2-card-grid,
                #${ROOT_ID} .ex2-cohort-grid,
                #${ROOT_ID} .ex2-schedule-board,
                #${ROOT_ID} .ex2-form-grid,
                #${ROOT_ID} .ex2-options,
                #${ROOT_ID} .ex2-filter-row,
                #${ROOT_ID} .ex2-mini-grid,
                #${ROOT_ID} .ex2-hero-stats {
                    grid-template-columns: 1fr;
                }
                #${ROOT_ID} .ex2-hero,
                #${ROOT_ID} .ex2-panel,
                #${ROOT_ID} .ex2-card,
                #${ROOT_ID} .ex2-cohort-card,
                #${ROOT_ID} .ex2-session-card,
                #${ROOT_ID} .ex2-list-card,
                #${ROOT_ID} .ex2-question-card,
                #${ROOT_ID} .ex2-review-card,
                #${ROOT_ID} .ex2-side-card,
                #${ROOT_ID} .ex2-toolbar {
                    padding: 18px;
                }
            }

            /* â”€â”€ Paginated Question Bank Nav â”€â”€ */
            #${ROOT_ID} .ex2-qnav-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
                flex-wrap: wrap;
                padding: 16px 20px;
                border-radius: 18px;
                border: 1px solid var(--lux-border);
                background: color-mix(in srgb, var(--lux-surface) 85%, transparent);
                backdrop-filter: blur(16px);
            }
            body:not(.lux-light-mode) #${ROOT_ID} .ex2-qnav-bar {
                background: rgba(10, 16, 29, 0.72);
            }
            #${ROOT_ID} .ex2-qnav-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            #${ROOT_ID} .ex2-qnav-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: var(--lux-text-muted);
                font-weight: 600;
            }
            #${ROOT_ID} .ex2-qnav-indicator label {
                font-size: 12px;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                opacity: 0.7;
            }
            #${ROOT_ID} .ex2-qnav-input {
                width: 52px;
                padding: 6px 8px;
                border-radius: 10px;
                border: 1px solid var(--lux-border);
                background: rgba(var(--lux-accent-rgb), 0.08);
                color: var(--lux-text);
                font-size: 15px;
                font-weight: 700;
                text-align: center;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
                -moz-appearance: textfield;
            }
            #${ROOT_ID} .ex2-qnav-input::-webkit-inner-spin-button,
            #${ROOT_ID} .ex2-qnav-input::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            #${ROOT_ID} .ex2-qnav-input:focus {
                border-color: var(--lux-accent);
                box-shadow: 0 0 0 3px rgba(var(--lux-accent-rgb), 0.18);
            }
            #${ROOT_ID} .ex2-qnav-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #${ROOT_ID} .ex2-qnav-dots {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 4px 0;
            }
            #${ROOT_ID} .ex2-qnav-dot {
                width: 32px;
                height: 32px;
                border-radius: 10px;
                border: 1px solid var(--lux-border);
                background: transparent;
                color: var(--lux-text-muted);
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #${ROOT_ID} .ex2-qnav-dot:hover {
                background: rgba(var(--lux-accent-rgb), 0.12);
                border-color: rgba(var(--lux-accent-rgb), 0.3);
            }
            #${ROOT_ID} .ex2-qnav-dot.is-active {
                background: linear-gradient(135deg, var(--lux-accent), var(--lux-accent-2, var(--lux-accent)));
                color: #fff;
                border-color: transparent;
                box-shadow: 0 2px 10px rgba(var(--lux-accent-rgb), 0.35);
            }
            #${ROOT_ID} .ex2-qnav-dot.has-content:not(.is-active) {
                background: rgba(var(--lux-accent-rgb), 0.1);
                border-color: rgba(var(--lux-accent-rgb), 0.22);
                color: var(--lux-text);
            }
            #${ROOT_ID} .ex2-panel,
            #${ROOT_ID} .ex2-toolbar,
            #${ROOT_ID} .ex2-card,
            #${ROOT_ID} .ex2-cohort-card,
            #${ROOT_ID} .ex2-session-card,
            #${ROOT_ID} .ex2-list-card,
            #${ROOT_ID} .ex2-question-card,
            #${ROOT_ID} .ex2-review-card,
            #${ROOT_ID} .ex2-side-card,
            #${ROOT_ID} .ex2-select-card,
            #${ROOT_ID} .ex2-live-sidebar,
            #${ROOT_ID} .ex2-stat-card,
            #${ROOT_ID} .ex2-qnav-bar,
            #${ROOT_ID} .ex2-auto-gen-box {
                background: rgba(var(--lux-surface-rgb, 12, 18, 31), calc(var(--lux-glass-alpha, 0.12) * 1.75)) !important;
                border-color: rgba(var(--lux-border-rgb, 148, 163, 184), calc(var(--lux-glass-alpha, 0.12) * 2.25)) !important;
                box-shadow: 0 18px 54px rgba(0,0,0, calc(var(--lux-glass-alpha, 0.12) * 1.4)), inset 0 1px 0 rgba(255,255,255, calc(var(--lux-glass-alpha, 0.12) * 1.2)) !important;
                backdrop-filter: blur(22px) saturate(150%) !important;
                -webkit-backdrop-filter: blur(22px) saturate(150%) !important;
            }
            body.lux-light-mode #${ROOT_ID} .ex2-panel,
            body.lux-light-mode #${ROOT_ID} .ex2-toolbar,
            body.lux-light-mode #${ROOT_ID} .ex2-card,
            body.lux-light-mode #${ROOT_ID} .ex2-cohort-card,
            body.lux-light-mode #${ROOT_ID} .ex2-session-card,
            body.lux-light-mode #${ROOT_ID} .ex2-list-card,
            body.lux-light-mode #${ROOT_ID} .ex2-question-card,
            body.lux-light-mode #${ROOT_ID} .ex2-review-card,
            body.lux-light-mode #${ROOT_ID} .ex2-side-card,
            body.lux-light-mode #${ROOT_ID} .ex2-select-card,
            body.lux-light-mode #${ROOT_ID} .ex2-live-sidebar,
            body.lux-light-mode #${ROOT_ID} .ex2-stat-card,
            body.lux-light-mode #${ROOT_ID} .ex2-qnav-bar,
            body.lux-light-mode #${ROOT_ID} .ex2-auto-gen-box {
                background: rgba(255, 252, 245, calc(var(--lux-glass-alpha, 0.12) * 1.45)) !important;
                border-color: rgba(120, 88, 45, calc(var(--lux-glass-alpha, 0.12) * 1.35)) !important;
                box-shadow: 0 18px 46px rgba(90, 62, 24, calc(var(--lux-glass-alpha, 0.12) * 0.85)), inset 0 1px 0 rgba(255,255,255, calc(var(--lux-glass-alpha, 0.12) * 2.6)) !important;
            }
            #${ROOT_ID} .ex2-progress-bar {
                gap: 10px;
                padding: 18px 0 20px;
            }
            #${ROOT_ID} .ex2-progress-step {
                isolation: isolate;
                min-height: 48px;
                padding: 0 18px;
                border: 1px solid rgba(var(--lux-border-rgb, 148, 163, 184), 0.45);
                border-radius: 18px;
                background: rgba(var(--lux-surface-rgb, 12, 18, 31), 0.34);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
                transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease, color .18s ease;
            }
            #${ROOT_ID} .ex2-progress-step:not(:last-child)::after {
                display: none;
            }
            #${ROOT_ID} .ex2-progress-step .step-label {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            #${ROOT_ID} .ex2-progress-step.is-active {
                color: rgb(var(--lux-accent-rgb));
                border-color: rgba(var(--lux-accent-rgb), 0.72);
                background: radial-gradient(circle at top left, rgba(var(--lux-accent-rgb),0.28), transparent 58%), rgba(var(--lux-accent-rgb),0.12);
                box-shadow: 0 0 0 1px rgba(var(--lux-accent-rgb),0.18), 0 14px 34px rgba(var(--lux-accent-rgb),0.22), inset 0 1px 0 rgba(255,255,255,0.14);
            }
            #${ROOT_ID} .ex2-progress-step.is-active .step-num {
                box-shadow: 0 0 18px rgba(var(--lux-accent-rgb),0.55);
            }
            #${ROOT_ID} .ex2-progress-step.is-done {
                color: #20a875;
                border-color: rgba(32,168,117,0.5);
                background: rgba(32,168,117,0.1);
            }
            #${ROOT_ID} .ex2-question-card {
                overflow: hidden;
            }
            #${ROOT_ID} .ex2-question-head {
                align-items: center;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(var(--lux-border-rgb, 148, 163, 184), 0.28);
            }
            #${ROOT_ID} .ex2-options {
                gap: 12px;
            }
            #${ROOT_ID} .ex2-option {
                padding: 10px;
                border: 1px solid rgba(var(--lux-border-rgb, 148, 163, 184), 0.32);
                border-radius: 16px;
                background: rgba(var(--lux-surface-2-rgb, 18, 26, 43), calc(var(--lux-glass-alpha, 0.12) * 1.1));
            }
            body.lux-light-mode #${ROOT_ID} .ex2-progress-step,
            body.lux-light-mode #${ROOT_ID} .ex2-option {
                background: rgba(255, 255, 255, 0.38);
            }
            body.lux-route-exams #${ROOT_ID} .ex2-hero,
            body.lux-route-exams #${ROOT_ID} .ex2-panel,
            body.lux-route-exams #${ROOT_ID} .ex2-toolbar,
            body.lux-route-exams #${ROOT_ID} .ex2-card,
            body.lux-route-exams #${ROOT_ID} .ex2-cohort-card,
            body.lux-route-exams #${ROOT_ID} .ex2-session-card,
            body.lux-route-exams #${ROOT_ID} .ex2-list-card,
            body.lux-route-exams #${ROOT_ID} .ex2-question-card,
            body.lux-route-exams #${ROOT_ID} .ex2-review-card,
            body.lux-route-exams #${ROOT_ID} .ex2-side-card,
            body.lux-route-exams #${ROOT_ID} .ex2-select-card,
            body.lux-route-exams #${ROOT_ID} .ex2-live-sidebar,
            body.lux-route-exams #${ROOT_ID} .ex2-auto-gen-box,
            body.lux-route-exams #${ROOT_ID} .ex2-qnav-bar {
                background:
                    radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-transparency-alpha, .92) * .075)), transparent 32%),
                    radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .92) * .24)), transparent 38%),
                    radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-transparency-alpha, .92) * .14)), transparent 38%),
                    linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84))) !important;
                border-color: rgba(var(--lux-accent-rgb), .16) !important;
                box-shadow: 0 24px 58px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.08) !important;
                backdrop-filter: blur(var(--lux-transparency-blur, 18px)) saturate(var(--lux-transparency-saturate, 145%)) !important;
                -webkit-backdrop-filter: blur(var(--lux-transparency-blur, 18px)) saturate(var(--lux-transparency-saturate, 145%)) !important;
            }
            body.lux-route-exams #${ROOT_ID} .ex2-stat-card,
            body.lux-route-exams #${ROOT_ID} .ex2-quiz-card,
            body.lux-route-exams #${ROOT_ID} .ex2-q-card,
            body.lux-route-exams #${ROOT_ID} .ex2-q-card-head,
            body.lux-route-exams #${ROOT_ID} .ex2-timeline-card,
            body.lux-route-exams #${ROOT_ID} .ex2-split-box,
            body.lux-route-exams #${ROOT_ID} .ex2-progress-step,
            body.lux-route-exams #${ROOT_ID} .ex2-mini-grid > div {
                background:
                    radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-transparency-alpha, .92) * .055)), transparent 30%),
                    radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .92) * .14)), transparent 34%),
                    linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80))) !important;
                border-color: rgba(var(--lux-accent-rgb), .12) !important;
                box-shadow: 0 14px 32px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.06) !important;
                backdrop-filter: blur(var(--lux-transparency-blur, 18px)) saturate(var(--lux-transparency-saturate, 145%)) !important;
                -webkit-backdrop-filter: blur(var(--lux-transparency-blur, 18px)) saturate(var(--lux-transparency-saturate, 145%)) !important;
            }
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-hero,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-panel,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-toolbar,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-cohort-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-session-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-list-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-question-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-review-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-side-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-select-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-live-sidebar,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-auto-gen-box,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-qnav-bar {
                background:
                    radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)), transparent 34%),
                    radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .86) * .22)), transparent 38%),
                    radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-transparency-alpha, .86) * .13)), transparent 38%),
                    linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72))) !important;
                border-color: rgba(var(--lux-accent-rgb), .14) !important;
                box-shadow: 0 22px 48px rgba(var(--lux-glass-tint-rgb, 15, 23, 42), .12), inset 0 1px 0 rgba(255,255,255,.68) !important;
            }
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-stat-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-quiz-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-q-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-q-card-head,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-timeline-card,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-split-box,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-progress-step,
            body.lux-light-mode.lux-route-exams #${ROOT_ID} .ex2-mini-grid > div {
                background:
                    radial-gradient(circle at 10% 0%, rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .78)), transparent 32%),
                    radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .86) * .14)), transparent 34%),
                    linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, .86) * .055)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .82)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .66))) !important;
                border-color: rgba(var(--lux-accent-rgb), .11) !important;
                box-shadow: 0 14px 30px rgba(var(--lux-glass-tint-rgb, 15, 23, 42), .10), inset 0 1px 0 rgba(255,255,255,.62) !important;
            }
            body[data-lux-performance='efficient'].lux-route-exams #${ROOT_ID} .ex2-modal-overlay {
                --ex2-modal-overlay-bg: rgba(3, 8, 20, 0.44);
                --ex2-modal-overlay-blur: 2px;
            }
            body[data-lux-performance='efficient'].lux-route-exams #${ROOT_ID} .ex2-modal {
                box-shadow: 0 18px 40px rgba(0,0,0,0.26);
            }
        `;
        document.head.appendChild(style);
    }

    window.renderExamsPageShellContext = function renderExamsPageShellContext() {
        const titleEl = document.getElementById('exams-page-title');
        const subtitleEl = document.getElementById('exams-page-subtitle');
        const contextEl = document.getElementById('admin-exams-faculty-context');
        const primaryAction = document.getElementById('exams-primary-action');
        const secondaryAction = document.getElementById('exams-secondary-action');
        const tertiaryAction = document.getElementById('exams-tertiary-action');
        const role = getRole();
        const facultyLabel = canUseCrossFacultyExamView() ? 'All faculties' : getFacultyLabelSafe(getCurrentFacultyCode());

        if (titleEl) {
            titleEl.textContent = role === 'admin'
                ? 'Administration Panel - Exams'
                : role === 'professor'
                    ? 'Professor Workspace - Exams'
                    : 'Teaching Assistant Workspace - Exams';
        }
        if (subtitleEl) {
            subtitleEl.textContent = role === 'admin'
                ? 'Auto-group students by exact subject sets, review variants, and schedule conflict-free computer exams.'
                : 'Build subject variants once and send them into the administration review and scheduling flow.';
        }
        if (contextEl) contextEl.textContent = facultyLabel;

        [
            { element: primaryAction, label: 'Back to Dashboard', icon: 'fas fa-arrow-left', page: 'home' },
            { element: secondaryAction, label: role === 'admin' ? 'News' : 'LMS', icon: role === 'admin' ? 'fas fa-newspaper' : 'fas fa-book-reader', page: role === 'admin' ? 'news' : 'lms' },
            { element: tertiaryAction, label: role === 'admin' ? 'Scheduler' : 'My Schedule', icon: 'fas fa-calendar-week', page: role === 'admin' ? 'admin-scheduler' : 'timetable' }
        ].forEach(action => {
            if (!action.element) return;
            action.element.style.display = '';
            action.element.innerHTML = `<i class="${action.icon}"></i> ${escapeHtml(action.label)}`;
            action.element.onclick = () => navigate(action.page);
        });
    };

    window.renderAdminExamSection = function renderAdminExamSection() {
        const embeddedRoot = document.getElementById('lms-admin-exams-root');
        if (embeddedRoot && typeof currentLmsQuizCourseKey !== 'undefined' && currentLmsQuizCourseKey && legacyRenderAdminExamSection) {
            legacyRenderAdminExamSection();
            return;
        }
        renderConsole();
    };

    window.setExamTab = function setExamTab(tab) {
        runtime.activeTab = TABS.includes(String(tab || '').trim()) ? String(tab).trim() : 'templates';
        renderConsole();
    };

    window.selectExamSession = async function selectExamSession(sessionId, targetTab = runtime.activeTab) {
        const normalizedSessionId = String(sessionId || '').trim();
        if (!normalizedSessionId || !getSessionById(normalizedSessionId)) return;
        const normalizedTab = ['live', 'results'].includes(String(targetTab || '').trim()) ? String(targetTab).trim() : runtime.activeTab;
        runtime.selectedSessionId = normalizedSessionId;
        if (normalizedTab) runtime.activeTab = normalizedTab;
        renderConsole();
        if (['live', 'results'].includes(normalizedTab)) {
            await loadAttemptsForSession(normalizedSessionId, { force: false });
        }
    };

    window.setExamTemplateSearch = function setExamTemplateSearch(value) {
        runtime.templateSearch = String(value || '');
        renderConsole();
    };

    function initializeStandaloneExamConsole() {
        const root = document.getElementById(ROOT_ID);
        const embeddedRoot = document.getElementById('lms-admin-exams-root');
        if (!root || embeddedRoot) return;
        renderConsole();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeStandaloneExamConsole, { once: true });
    } else {
        initializeStandaloneExamConsole();
    }

    window.setExamTemplateFilter = function setExamTemplateFilter(value) {
        runtime.templateFilter = String(value || 'all').trim().toLowerCase() || 'all';
        renderConsole();
    };

    window.cancelExamDraft = function cancelExamDraft() {
        runtime.templateDraft = null;
        runtime.templateStep = 'details';
        runtime.showShareModal = false;
        renderConsole();
    };

    window.beginExamTemplateCreation = function beginExamTemplateCreation() {
        runtime.activeTab = 'templates';
        runtime.templateDraft = createTemplateDraft();
        runtime.templateStep = 'details';
        renderConsole();
    };

    window.editExamTemplate = function editExamTemplate(templateId) {
        const template = getTemplateById(templateId);
        if (!template) return;
        runtime.activeTab = 'templates';
        runtime.templateDraft = createTemplateDraft(template);
        runtime.templateStep = 'details';
        renderConsole();
    };

    window.duplicateExamTemplate = function duplicateExamTemplate(templateId) {
        const template = getTemplateById(templateId);
        if (!template) return;
        const duplicated = createTemplateDraft({
            ...template,
            id: '',
            title: `${template.title || template.subjectName || 'Exam'} copy`,
            status: 'draft'
        });
        duplicated.editingTemplateId = '';
        runtime.templateDraft = duplicated;
        runtime.activeTab = 'templates';
        runtime.templateStep = 'details';
        renderConsole();
    };

    window.updateExamTemplateField = function updateExamTemplateField(field, value) {
        const draft = getTemplateDraft();
        if (field === 'subjectId') {
            const subject = getSubjectById(value);
            const defaults = getQuestionDefaultsForSubject(value);
            draft.subjectId = String(value || '').trim();
            draft.subjectName = String(subject?.name || value || '').trim();
            draft.defaultQuestionScore = defaults.score;
            draft.defaultOptionCount = defaults.optionCount;
        } else if (field === 'durationMinutes') {
            draft.durationMinutes = Math.max(1, parseInt(value, 10) || 90);
        } else if (field === 'passingScore') {
            draft.passingScore = clampPositiveInt(value, 50, 0, 999);
        } else if (field === 'gradingWeight') {
            draft.gradingWeight = clampPositiveInt(value, 30, 0, 999);
        } else if (field === 'defaultQuestionScore') {
            draft.defaultQuestionScore = clampPositiveInt(value, 1, 1, 999);
            saveQuestionDefaultsForSubject(draft.subjectId, getDraftQuestionDefaults(draft));
        } else if (field === 'defaultOptionCount') {
            draft.defaultOptionCount = clampPositiveInt(value, 4, 2, 8);
            saveQuestionDefaultsForSubject(draft.subjectId, getDraftQuestionDefaults(draft));
        } else if (field === 'examType') {
            draft.examType = ['digital', 'paper'].includes(String(value||'').trim()) ? String(value).trim() : 'digital';
        } else if (field === 'status') {
            draft[field] = String(value || '').trim().toLowerCase();
        } else {
            draft[field] = String(value || '');
        }
        renderConsole();
    };

    window.syncExamTemplateField = function syncExamTemplateField(field, value) {
        const draft = getTemplateDraft();
        if (field === 'subjectId') {
            const subject = getSubjectById(value);
            const defaults = getQuestionDefaultsForSubject(value);
            draft.subjectId = String(value || '').trim();
            draft.subjectName = String(subject?.name || value || '').trim();
            draft.defaultQuestionScore = defaults.score;
            draft.defaultOptionCount = defaults.optionCount;
            return;
        }
        draft[field] = value;
    };

    window.setExamTemplateStep = function setExamTemplateStep(step) {
        runtime.templateStep = ['details', 'questions', 'variants', 'review'].includes(String(step || '').trim()) ? String(step).trim() : 'details';
        renderConsole();
    };

    window.addExamQuestion = function addExamQuestion(type) {
        const draft = getTemplateDraft();
        draft.questions.push(createQuestion(type, getDraftQuestionDefaults(draft)));
        runtime.templateStep = 'questions';
        renderConsole();
    };

    window.removeExamQuestion = function removeExamQuestion(questionId) {
        const draft = getTemplateDraft();
        draft.questions = (draft.questions || []).filter(question => String(question?.id || '').trim() !== String(questionId || '').trim());
        if (!draft.questions.length) draft.questions = [createQuestion('mcq', getDraftQuestionDefaults(draft))];
        renderConsole();
    };

    window.updateExamQuestionField = function updateExamQuestionField(questionId, field, value) {
        const draft = getTemplateDraft();
        const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
        if (!question) return;
        if (field === 'type') {
            const nextType = ['mcq', 'short', 'written'].includes(String(value || '').trim()) ? String(value).trim() : 'mcq';
            question.type = nextType;
            if (nextType === 'mcq') applyQuestionOptionCount(question, question.optionCount || 4);
        } else if (field === 'score' || field === 'correctOption') {
            question[field] = Math.max(0, parseInt(value, 10) || 0);
        } else if (field === 'optionCount') {
            applyQuestionOptionCount(question, value);
        } else {
            question[field] = String(value || '');
        }
        renderConsole();
    };

    window.syncExamQuestionField = function syncExamQuestionField(questionId, field, value) {
        const draft = getTemplateDraft();
        const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
        if (!question) return;
        if (field === 'type') {
            question.type = ['mcq', 'short', 'written'].includes(String(value || '').trim()) ? String(value).trim() : 'mcq';
        } else if (field === 'score' || field === 'correctOption') {
            question[field] = Math.max(0, parseInt(value, 10) || 0);
        } else if (field === 'optionCount') {
            applyQuestionOptionCount(question, value);
        } else {
            question[field] = value;
        }
    };

    window.updateExamQuestionOption = function updateExamQuestionOption(questionId, optionIndex, value) {
        const draft = getTemplateDraft();
        const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
        if (!question || !Array.isArray(question.options)) return;
        question.options[optionIndex] = String(value || '');
        renderConsole();
    };

    window.syncExamQuestionOption = function syncExamQuestionOption(questionId, optionIndex, value) {
        const draft = getTemplateDraft();
        const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
        if (!question || !Array.isArray(question.options)) return;
        question.options[optionIndex] = String(value || '');
    };

    function buildTemplateFromDraft(statusOverride = '') {
        const draft = getTemplateDraft();
        const user = getCurrentUserSafe();
        const subject = getSubjectById(draft.subjectId);
        const now = new Date().toISOString();
        const existingTemplate = getTemplateById(draft.editingTemplateId);
        return {
            id: String(draft.editingTemplateId || makeLocalId('exam_template')).trim(),
            faculty: String(subject?.facultyCode || getCurrentFacultyCode()).trim().toUpperCase(),
            title: String(draft.title || `${draft.subjectName || draft.subjectId || 'Exam'} ${draft.variantLabel || ''}`).trim(),
            subjectId: String(draft.subjectId || '').trim(),
            subjectName: String(subject?.name || draft.subjectName || draft.subjectId || '').trim(),
            courseNumber: String(draft.courseNumber || '').trim(),
            courseCode: String(draft.courseCode || '').trim(),
            variantLabel: String(draft.variantLabel || 'Variant A').trim(),
            instructions: String(draft.instructions || '').trim(),
            status: String(statusOverride || draft.status || 'draft').trim().toLowerCase(),
            /* Legacy flat questions kept for backward compat */
            questions: (draft.questionBank || draft.questions || []).map(normalizeQuestion),
            /* â”€â”€ New fields â”€â”€ */
            examType: String(draft.examType || 'digital').trim(),
            durationMinutes: Math.max(1, parseInt(draft.durationMinutes, 10) || 90),
            passingScore: clampPositiveInt(draft.passingScore, 50, 0, 999),
            gradingWeight: clampPositiveInt(draft.gradingWeight, 30, 0, 999),
            defaultQuestionScore: clampPositiveInt(draft.defaultQuestionScore, 1, 1, 999),
            defaultOptionCount: clampPositiveInt(draft.defaultOptionCount, 4, 2, 8),
            questionBank: (draft.questionBank || []).map(normalizeQuestion),
            variants: clone(draft.variants || []),
            sharedWith: clone(draft.sharedWith || []),
            lockedBy: draft.lockedBy || null,
            revisionNote: String(statusOverride === 'returned' ? (draft.revisionNote || '') : (existingTemplate?.revisionNote || '')).trim(),
            /* â”€â”€ Existing meta â”€â”€ */
            createdAt: existingTemplate?.createdAt || now,
            updatedAt: now,
            createdBy: String(existingTemplate?.createdBy || user?.id || '').trim(),
            createdByName: String(existingTemplate?.createdByName || getCurrentStaffName()).trim(),
            lastEditedBy: String(user?.id || '').trim(),
            lastEditedByName: getCurrentStaffName(),
            approvedBy: statusOverride === 'approved' ? getCurrentStaffName() : String(existingTemplate?.approvedBy || '').trim(),
            approvedAt: statusOverride === 'approved' ? now : String(existingTemplate?.approvedAt || '').trim()
        };
    }

    window.saveExamTemplateDraft = function saveExamTemplateDraft() {
        const template = buildTemplateFromDraft();
        if (!template.subjectId || !template.title || !(template.questionBank || template.questions || []).length) {
            notify('Exam needs a subject, title, and at least one question in the bank.');
            return;
        }
        upsertTemplate(template);
        runtime.templateDraft = null;
        notify('Quiz draft saved.');
        renderConsole();
    };

    window.saveAndSubmitExamTemplate = function saveAndSubmitExamTemplate() {
        const template = buildTemplateFromDraft('submitted');
        if (!template.subjectId || !template.title || !(template.questionBank || template.questions || []).length) {
            notify('Exam needs a subject, title, and at least one question in the bank.');
            return;
        }
        if (!(template.variants || []).length) {
            notify('Please generate at least one variant before submitting.');
            return;
        }
        upsertTemplate(template);
        runtime.templateDraft = createTemplateDraft(template);
        notify('Exam submitted to admin for review.');
        renderConsole();
    };

    /* â”€â”€ Question Bank CRUD â”€â”€ */
    window.navigateBankQuestion = function navigateBankQuestion(page) {
        const draft = getTemplateDraft();
        const total = (draft.questionBank || []).length;
        runtime.currentBankPage = Math.max(0, Math.min(page, total - 1));
        renderConsole();
    };

    window.addExamBankQuestion = function addExamBankQuestion(type) {
        const draft = getTemplateDraft();
        draft.questionBank.push(createQuestion('mcq', getDraftQuestionDefaults(draft)));
        runtime.currentBankPage = draft.questionBank.length - 1;
        runtime.templateStep = 'questions';
        renderConsole();
    };

    window.removeExamBankQuestion = function removeExamBankQuestion(questionId) {
        const draft = getTemplateDraft();
        draft.questionBank = (draft.questionBank || []).filter(q => String(q?.id||'').trim() !== String(questionId||'').trim());
        if (!draft.questionBank.length) draft.questionBank = [createQuestion('mcq', getDraftQuestionDefaults(draft))];
        /* Adjust current page if needed */
        runtime.currentBankPage = Math.max(0, Math.min(runtime.currentBankPage, draft.questionBank.length - 1));
        /* Also remove from any variants */
        (draft.variants || []).forEach(v => {
            v.questionIds = (v.questionIds || []).filter(id => id !== questionId);
        });
        renderConsole();
    };

    window.updateExamBankQuestionField = function updateExamBankQuestionField(questionId, field, value) {
        const draft = getTemplateDraft();
        const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
        if (!question) return;
        if (field === 'type') {
            question.type = 'mcq';
            applyQuestionOptionCount(question, question.optionCount || 4);
        } else if (field === 'score' || field === 'correctOption') {
            question[field] = Math.max(0, parseInt(value, 10) || 0);
        } else if (field === 'optionCount') {
            applyQuestionOptionCount(question, value);
        } else {
            question[field] = String(value || '');
        }
        renderConsole();
    };

    window.syncExamBankQuestionField = function syncExamBankQuestionField(questionId, field, value) {
        const draft = getTemplateDraft();
        const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
        if (!question) return;
        if (field === 'score' || field === 'correctOption') {
            question[field] = Math.max(0, parseInt(value, 10) || 0);
        } else if (field === 'optionCount') {
            applyQuestionOptionCount(question, value);
        } else {
            question[field] = value;
        }
    };

    window.updateExamBankQuestionOption = function updateExamBankQuestionOption(questionId, optionIndex, value) {
        const draft = getTemplateDraft();
        const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
        if (!question || !Array.isArray(question.options)) return;
        question.options[optionIndex] = String(value || '');
        renderConsole();
    };

    window.syncExamBankQuestionOption = function syncExamBankQuestionOption(questionId, optionIndex, value) {
        const draft = getTemplateDraft();
        const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
        if (!question || !Array.isArray(question.options)) return;
        question.options[optionIndex] = String(value || '');
    };

    /* â”€â”€ Auto-Variant Generator â”€â”€ */
    window.runAutoGenerateVariants = function runAutoGenerateVariants() {
        const draft = getTemplateDraft();
        const bank = draft.questionBank || [];
        if (!bank.length) {
            notify('Add questions to the bank first before generating variants.');
            return;
        }
        const count = Math.max(1, Math.min(26, runtime.autoGenVariantCount || 3));
        const perVariant = Math.max(1, runtime.autoGenQuestionsPerVariant || 10);
        draft.variants = autoGenerateVariants(bank, count, perVariant);
        notify(`Generated ${draft.variants.length} variants with ${perVariant} questions each.`);
        renderConsole();
    };

    window.addManualVariant = function addManualVariant() {
        const draft = getTemplateDraft();
        const existingCount = (draft.variants || []).length;
        const label = `Variant ${String.fromCharCode(65 + existingCount)}`;
        draft.variants = draft.variants || [];
        draft.variants.push({
            id: makeLocalId('variant'),
            label,
            questionIds: (draft.questionBank || []).map(q => q.id),
            shuffleQuestions: true,
            shuffleOptions: true
        });
        renderConsole();
    };

    window.removeVariant = function removeVariant(variantId) {
        const draft = getTemplateDraft();
        draft.variants = (draft.variants || []).filter(v => v.id !== variantId);
        renderConsole();
    };

    /* â”€â”€ Share Modal â”€â”€ */
    function openShareModalInternal(templateId) {
        if (templateId) {
            const template = getTemplateById(templateId);
            if (template) {
                runtime.templateDraft = createTemplateDraft(template);
            }
        }
        runtime.showShareModal = true;
        runtime.shareSearchQuery = '';
        renderConsole();
    }

    function closeShareModalInternal() {
        runtime.showShareModal = false;
        renderConsole();
    }

    function shareExamWithInternal(userId, userName) {
        const draft = getTemplateDraft();
        if (!draft) return;
        draft.sharedWith = draft.sharedWith || [];
        if (draft.sharedWith.some(s => s.userId === userId)) return;
        draft.sharedWith.push({ userId, userName, sharedAt: new Date().toISOString() });
        /* Auto-save */
        const template = buildTemplateFromDraft();
        upsertTemplate(template);
        runtime.templateDraft = createTemplateDraft(template);
        runtime.showShareModal = true;
        notify(`Exam shared with ${userName}.`);
        renderConsole();
    }

    /* â”€â”€ Approve Template (Admin) â”€â”€ */
    window.saveAndApproveExamTemplate = function saveAndApproveExamTemplate(templateId) {
        const container = getTemplateContainer();
        const idx = container.findIndex(t => t.id === templateId);
        if (idx < 0) { alert('Template not found.'); return; }
        container[idx].status = 'approved';
        container[idx].approvedAt = new Date().toISOString();
        container[idx].approvedBy = (typeof getCurrentUser === 'function' ? getCurrentUser()?.name : '') || 'Admin';
        renderConsole();
    };

    /* â”€â”€ Return for Revision â”€â”€ */
    function openReturnModalInternal(templateId) {
        runtime.showReturnModal = true;
        runtime.returnTemplateId = String(templateId || '').trim();
        runtime.returnNote = '';
        renderConsole();
    }

    function closeReturnModalInternal() {
        runtime.showReturnModal = false;
        runtime.returnTemplateId = '';
        runtime.returnNote = '';
        renderConsole();
    }

    function executeReturnForRevisionInternal() {
        if (!runtime.returnNote.trim()) {
            notify('Please provide feedback for the Professor/TA.');
            return;
        }
        const template = getTemplateById(runtime.returnTemplateId);
        if (!template) return;
        upsertTemplate({
            ...template,
            status: 'returned',
            revisionNote: runtime.returnNote.trim(),
            updatedAt: new Date().toISOString(),
            lastEditedByName: getCurrentStaffName()
        });
        notify('Exam returned to creator with feedback.');
        closeReturnModalInternal();
    }

    window.openShareModal = openShareModalInternal;
    window.closeShareModal = closeShareModalInternal;
    window.shareExamWith = shareExamWithInternal;
    window.openReturnModal = openReturnModalInternal;
    window.closeReturnModal = closeReturnModalInternal;
    window.executeReturnForRevision = executeReturnForRevisionInternal;

    /* â”€â”€ Staff Sub-Tab â”€â”€ */
    window.setExamStaffSubTab = function setExamStaffSubTab(tab) {
        runtime.staffSubTab = STAFF_SUB_TABS.includes(String(tab||'').trim()) ? String(tab).trim() : 'my_drafts';
        renderConsole();
    };


    /* â”€â”€ Schedule Field Handlers â”€â”€ */
    window.updateExamScheduleField = function updateExamScheduleField(field, value) {
        const draft = getScheduleDraft();
        if (field === 'suspendsClasses') {
            draft.suspendsClasses = !!value;
        } else if (field === 'roomCapacity') {
            draft.roomCapacity = Math.max(0, parseInt(value, 10) || 0);
        } else {
            draft[field] = String(value || '').trim();
        }
        renderConsole();
    };

    window.syncExamScheduleField = function syncExamScheduleField(field, value) {
        const draft = getScheduleDraft();
        draft[field] = String(value || '').trim();
    };

    window.saveExamSchedule = function saveExamSchedule() {
        const draft = getScheduleDraft();
        const template = getTemplateById(draft.templateId);
        if (!template) { notify('Please select an approved template first.'); return; }
        if (!draft.startAt || !draft.endAt) { notify('Start and end time are required.'); return; }
        const selectedStudents = getSelectedStudentsForSchedule(draft, template);
        if (!selectedStudents.length) { notify('No students selected for this session.'); return; }
        const existingSessions = getSessions();
        const collisions = detectScheduleCollisions(draft, existingSessions);
        if (collisions.hard.length) { notify('Cannot save: ' + collisions.hard[0]); return; }
        const session = {
            id: String(draft.editingSessionId || makeLocalId('exam_session')).trim(),
            templateId: String(draft.templateId).trim(),
            title: String(template.title || template.subjectName || 'Exam').trim(),
            subjectId: String(template.subjectId || '').trim(),
            subjectName: String(template.subjectName || '').trim(),
            variantLabel: String(template.variantLabel || '').trim(),
            startAt: String(draft.startAt).trim(),
            endAt: String(draft.endAt).trim(),
            durationMinutes: parseInt(draft.durationMinutes, 10) || 120,
            placeLabel: String(draft.placeLabel || '').trim(),
            roomLabel: String(draft.roomLabel || '').trim(),
            roomCapacity: parseInt(draft.roomCapacity, 10) || 0,
            observerNames: uniqueStrings(String(draft.observerNamesText || '').split(',').map(s => s.trim())),
            cohortKeys: clone(draft.selectedCohortKeys || []),
            assignedStudentIds: selectedStudents.map(s => s.id),
            suspendsClasses: draft.suspendsClasses,
            published: false,
            createdAt: new Date().toISOString()
        };
        const sessions = getSessions();
        const existIndex = sessions.findIndex(s => s.id === session.id);
        if (existIndex >= 0) sessions[existIndex] = session;
        else sessions.push(session);
        runtime.scheduleDraft = createScheduleDraft();
        notify('Exam session saved successfully.');
        renderConsole();
    };

    window.clearExamScheduleDraft = function clearExamScheduleDraft() {
        runtime.scheduleDraft = createScheduleDraft();
        renderConsole();
    };

    function getExamProtectedSessionKeys(session) {
        return {
            courseId: String(session?.protectedCourseId || `exam-session::${session?.id || ''}`).trim(),
            quizId: String(session?.protectedQuizId || session?.id || '').trim()
        };
    }

    function findExamAttemptEntry(sessionId, studentId) {
        return getAttemptsForSession(sessionId).find(entry => String(getAttemptStudentId(entry)) === String(studentId)) || null;
    }

    window.refreshExamAttempts = async function refreshExamAttempts(sessionId) {
        await loadAttemptsForSession(sessionId, { force: true });
    };

    window.runExamStudentAction = async function runExamStudentAction(sessionId, studentId, action) {
        const session = getSessionById(sessionId);
        if (!session || typeof performProtectedQuizStudentAction !== 'function') return;
        const keys = getExamProtectedSessionKeys(session);
        try {
            await performProtectedQuizStudentAction(keys.courseId, keys.quizId, studentId, action, {
                actorName: getCurrentStaffName()
            });
            await loadAttemptsForSession(sessionId, { force: true });
            notify('Student exam control updated.');
        } catch (error) {
            notify(error?.message || 'Student exam control could not be updated.');
        }
    };

    window.updateExamManualGradeDraft = function updateExamManualGradeDraft(sessionId, studentId, questionId, value) {
        const baseKey = `${sessionId}::${studentId}`;
        const key = questionId ? `${baseKey}::${questionId}` : baseKey;
        runtime.manualScoreDrafts[key] = String(value || '').trim();
    };

    window.saveExamManualGrade = async function saveExamManualGrade(sessionId, studentId) {
        const session = getSessionById(sessionId);
        const entry = findExamAttemptEntry(sessionId, studentId);
        const attempt = entry?.attempt || {};
        if (!session || typeof saveProtectedQuizManualGrade !== 'function') return;
        const keys = getExamProtectedSessionKeys(session);
        const manualScoresByQuestion = {};
        const questionResults = Array.isArray(attempt.questionResults) ? attempt.questionResults.map(result => ({ ...result })) : [];
        const manualResults = questionResults.filter(result => MANUAL_TYPES.has(String(result?.type || '').trim()));
        if (manualResults.length) {
            manualResults.forEach((result, index) => {
                const questionId = String(result.questionId || `manual_${index + 1}`);
                const fieldKey = `${sessionId}::${studentId}::${questionId}`;
                const maxScore = Number(result.manualMax || result.maxScore || 0);
                const raw = Number(runtime.manualScoreDrafts[fieldKey] ?? result.manualScoreAwarded ?? result.scoreAwarded ?? 0);
                const bounded = Number.isFinite(raw) ? Math.max(0, Math.min(maxScore, raw)) : 0;
                manualScoresByQuestion[questionId] = bounded;
                result.manualScoreAwarded = bounded;
                result.scoreAwarded = bounded;
                result.needsManualReview = false;
                result.reviewedAt = new Date().toISOString();
                result.reviewedBy = getCurrentStaffName();
            });
        } else {
            const key = `${sessionId}::${studentId}`;
            const raw = Number(runtime.manualScoreDrafts[key] ?? attempt.manualScoreRaw ?? 0);
            manualScoresByQuestion.manual_total = Number.isFinite(raw) ? Math.max(0, raw) : 0;
        }
        const manualScoreRaw = Object.values(manualScoresByQuestion).reduce((sum, value) => sum + Number(value || 0), 0);
        const finalScoreRaw = Math.max(0, Number(attempt.autoScoreRaw || 0) + manualScoreRaw);
        const responseSummary = {
            ...(attempt.responseSummary || {}),
            needsManualReview: false
        };
        try {
            await saveProtectedQuizManualGrade(keys.courseId, keys.quizId, {
                studentId,
                studentName: entry?.student?.name || attempt.studentName || `Student ${studentId}`,
                autoScoreRaw: attempt.autoScoreRaw || 0,
                manualScoreRaw,
                finalScoreRaw,
                gradebookScore: finalScoreRaw,
                requiresManualReview: false,
                manualScoresByQuestion,
                questionResults,
                responseSummary,
                gradedAt: new Date().toISOString(),
                reviewedBy: getCurrentStaffName()
            });
            Object.keys(runtime.manualScoreDrafts).forEach(key => {
                if (key.startsWith(`${sessionId}::${studentId}`)) delete runtime.manualScoreDrafts[key];
            });
            await loadAttemptsForSession(sessionId, { force: true });
            notify('Manual exam grade saved.');
        } catch (error) {
            notify(error?.message || 'Manual exam grade could not be saved.');
        }
    };

    window.previewStudentExamPortal = function previewStudentExamPortal() {
        window.open('exam-portal.html', '_blank', 'noopener');
    };

    window.createLocalExamTestSession = async function createLocalExamTestSession() {
        const now = new Date();
        const start = new Date(now.getTime() - 5 * 60 * 1000);
        const end = new Date(now.getTime() + 85 * 60 * 1000);
        const faculty = getCurrentFacultyCode();
        const authorName = getCurrentStaffName();
        const author = getCurrentUserSafe();
        const questions = [
            {
                id: makeLocalId('exam_q'),
                type: 'mcq',
                text: 'Which tool is most useful for organizing business data before analysis?',
                options: ['Advanced Excel', 'Photo editor', 'Video player', 'Music library'],
                correctOption: 0,
                score: 1
            },
            {
                id: makeLocalId('exam_q'),
                type: 'mcq',
                text: 'What should a Business Analyst document before recommending a solution?',
                options: ['Only the final grade', 'Current process and requirements', 'Personal preferences only', 'Unrelated policies'],
                correctOption: 1,
                score: 1
            },
            {
                id: makeLocalId('exam_q'),
                type: 'short',
                text: 'In one or two sentences, explain why evidence is important in a career or business recommendation.',
                options: [],
                correctOption: null,
                score: 3
            }
        ];
        const templateId = makeLocalId('exam_template');
        const template = {
            id: templateId,
            title: 'Local Test Computer Exam',
            faculty,
            subjectId: 'ECON-TEST',
            subjectName: 'Local Test Subject',
            variantLabel: 'Variant A',
            instructions: 'Answer each question carefully. This local session is created for anti-cheat portal testing.',
            status: 'approved',
            examType: 'digital',
            durationMinutes: 90,
            passingScore: 50,
            gradingWeight: 30,
            defaultQuestionScore: 1,
            defaultOptionCount: 4,
            questions: clone(questions),
            questionBank: clone(questions),
            variants: [{ id: makeLocalId('exam_variant'), label: 'Variant A', questions: clone(questions) }],
            createdBy: String(author?.id || author?.email || 'local-admin'),
            createdByName: authorName,
            approvedBy: authorName,
            approvedAt: now.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        const student = {
            id: 'admin-testing-econ-student',
            email: 'qa.student.alpha@student.kiu.edu.ge',
            name: 'QA Student Alpha',
            displayName: 'QA Student Alpha',
            groupId: 'local-test-group',
            groupName: 'Local Test Group'
        };
        const session = {
            id: makeLocalId('exam_session'),
            templateId,
            templateSnapshotId: makeLocalId('exam_snapshot'),
            title: template.title,
            subjectId: template.subjectId,
            subjectName: template.subjectName,
            variantLabel: template.variantLabel,
            faculty,
            groupId: student.groupId,
            groupName: student.groupName,
            groupIds: [student.groupId],
            groupNames: [student.groupName],
            cohortKeys: [student.groupId],
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            durationMinutes: 90,
            status: 'scheduled',
            deliveryMode: 'Anti-cheat lab',
            instructions: template.instructions,
            placeLabel: 'KIU Computer Lab',
            roomLabel: 'Lab 301',
            locationLabel: 'KIU Computer Lab - Lab 301',
            observerNames: ['Local Test Observer'],
            observerNamesText: 'Local Test Observer',
            roomCapacity: 30,
            assignedStudentIds: [student.id],
            allowedStudentIds: [student.id],
            assignedStudents: [student],
            templateSnapshot: clone(template),
            createdBy: authorName,
            updatedAt: now.toISOString(),
            publishedAt: now.toISOString(),
            published: true
        };

        try {
            upsertTemplate(template);
            await upsertSession(session);
            runtime.scheduleDraft = createScheduleDraft();
            runtime.activeTab = 'schedule';
            notify('Local test session created for QA Student Alpha.');
            renderConsole();
        } catch (error) {
            notify('Could not create local test session: ' + (error?.message || 'Unknown error'));
        }
    };

    window.toggleExamCohort = function toggleExamCohort(cohortKey, checked) {
        const draft = getScheduleDraft();
        const keys = new Set(draft.selectedCohortKeys || []);
        if (checked) keys.add(cohortKey); else keys.delete(cohortKey);
        draft.selectedCohortKeys = Array.from(keys);
        renderConsole();
    };

    window.selectAllExamCohorts = function selectAllExamCohorts() {
        const draft = getScheduleDraft();
        const template = getTemplateById(draft.templateId);
        if (!template) return;
        const cohorts = buildSubjectAutoCohorts(template.subjectId);
        draft.selectedCohortKeys = cohorts.map(c => c.key);
        renderConsole();
    };

    window.clearExamCohorts = function clearExamCohorts() {
        const draft = getScheduleDraft();
        draft.selectedCohortKeys = [];
        renderConsole();
    };

    window.editExamSession = function editExamSession(sessionId) {
        const sessions = getSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        runtime.scheduleDraft = createScheduleDraft(session);
        runtime.activeTab = 'schedule';
        renderConsole();
    };

    /* â”€â”€ Collision Detection Engine â”€â”€ */
    function detectScheduleCollisions(draft, existingSessions) {
        const hard = [];
        const soft = [];
        if (!draft.startAt || !draft.endAt || !draft.templateId) return { hard, soft };
        const dStart = new Date(draft.startAt).getTime();
        const dEnd = new Date(draft.endAt).getTime();
        if (isNaN(dStart) || isNaN(dEnd)) return { hard, soft };
        const dRoom = String(draft.roomLabel || '').trim().toLowerCase();
        const selectedStudentIds = new Set(getSelectedStudentsForSchedule(draft, getTemplateById(draft.templateId)).map(s => s.id));
        (existingSessions || []).forEach(session => {
            if (session.id === draft.editingSessionId) return;
            const sStart = new Date(session.startAt).getTime();
            const sEnd = new Date(session.endAt).getTime();
            if (isNaN(sStart) || isNaN(sEnd)) return;
            const overlaps = dStart < sEnd && dEnd > sStart;
            if (!overlaps) return;
            /* Hard: Room collision */
            const sRoom = String(getSessionRoomLabel(session) || '').trim().toLowerCase();
            if (dRoom && sRoom && dRoom === sRoom) {
                hard.push(`Room "${draft.roomLabel}" is already booked by "${session.title || session.subjectName}" at this time.`);
            }
            /* Hard: Student collision */
            const sStudents = getAssignedStudentIds(session);
            const conflicts = sStudents.filter(id => selectedStudentIds.has(id));
            if (conflicts.length) {
                hard.push(`${conflicts.length} student(s) already have "${session.title || session.subjectName}" at the same time.`);
            }
            /* Soft: Observer/proctor collision */
            const dObservers = uniqueStrings(String(draft.observerNamesText || '').split(',').map(s => s.trim().toLowerCase()));
            const sObservers = getSessionObserverNames(session).map(n => n.toLowerCase());
            const proctorConflicts = dObservers.filter(n => n && sObservers.includes(n));
            if (proctorConflicts.length) {
                soft.push(`Proctor "${proctorConflicts[0]}" is assigned to "${session.title || session.subjectName}" at the same time.`);
            }
        });
        return { hard, soft };
    }

    /* â”€â”€ Exam PIN Generator â”€â”€ */
    function generateExamPIN(draft) {
        const seed = String(draft.templateId || '') + String(draft.startAt || '') + String(draft.roomLabel || '');
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
        return String(Math.abs(hash) % 10000).padStart(4, '0');
    }

    /* â”€â”€ Room Split Handler â”€â”€ */
    window.splitCohort = function splitCohort(cohortKey) {
        const draft = getScheduleDraft();
        const template = getTemplateById(draft.templateId);
        if (!template) return;
        const cohorts = buildSubjectAutoCohorts(template.subjectId);
        const cohort = cohorts.find(c => c.key === cohortKey);
        if (!cohort) return;
        const keepCount = Math.max(1, runtime.splitStudentCount || parseInt(draft.roomCapacity, 10) || Math.ceil(cohort.students.length / 2));
        const overflowRoom = runtime.splitRoomLabel || `${draft.roomLabel || 'Room'} (Overflow)`;
        const overflowTime = runtime.splitTimeSlot || draft.startAt;
        notify(`Split: ${keepCount} students stay in ${draft.roomLabel || 'current room'}, ${cohort.students.length - keepCount} moved to ${overflowRoom}.`);
        runtime.splitStudentCount = 0;
        runtime.splitRoomLabel = '';
        runtime.splitTimeSlot = '';
        renderConsole();
    };

    /* â”€â”€ Publish / Unpublish Session â”€â”€ */
    window.publishExamSession = function publishExamSession(sessionId) {
        const sessions = getSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        session.published = true;
        session.publishedAt = new Date().toISOString();
        session.publishedBy = getCurrentStaffName();
        notify('Exam session published to students. Timetable updated.');
        renderConsole();
    };

    window.unpublishExamSession = function unpublishExamSession(sessionId) {
        const sessions = getSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        session.published = false;
        notify('Exam session unpublished. Students can no longer see this session.');
        renderConsole();
    };

    /* â”€â”€ CSS: Collision & Split â”€â”€ */
    (function addExtraStyles() {
        const s = document.getElementById('ex2-extra-styles');
        if (s) return;
        const style = document.createElement('style');
        style.id = 'ex2-extra-styles';
        style.textContent = `
            .ex2-collision-list { padding: 12px 16px; border-radius: 14px; margin-top: 10px; font-size: 13px; line-height: 1.6; }
            .ex2-collision-list.hard { border: 1px solid rgba(220,38,38,0.4); background: rgba(220,38,38,0.08); color: #dc2626; }
            .ex2-collision-list.soft { border: 1px solid rgba(214,138,17,0.4); background: rgba(214,138,17,0.08); color: #c47a0a; }
            .ex2-collision-list div { margin-bottom: 4px; }
            .ex2-split-box { margin-top: 12px; padding: 16px; border-radius: 16px; border: 1px dashed rgba(var(--lux-accent-rgb),0.4); background: color-mix(in srgb, rgba(var(--lux-accent-rgb),0.06) 80%, var(--lux-surface)); }
        `;
        document.head.appendChild(style);
    })();

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       QUIZ EXPORT â€” PDF & DOCX
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    function getExportData(templateOrDraft) {
        const d = templateOrDraft || {};
        const bank = d.questionBank || d.questions || [];
        const variants = d.variants || [];
        const totalScore = bank.reduce((s, q) => s + (parseInt(q.score, 10) || 1), 0);
        const subjectLabel = `${d.subjectName || d.subjectId || ''}${d.courseNumber ? ` | ${formatCourseYearLabel(d.courseNumber)}` : ''}${d.courseCode ? ` | No. ${d.courseCode}` : ''}`;
        return {
            title: d.title || d.subjectName || 'Untitled Quiz',
            subject: subjectLabel,
            courseNumber: d.courseNumber || '',
            courseCode: d.courseCode || '',
            type: d.examType === 'paper' ? 'Paper' : 'Digital',
            duration: d.durationMinutes || 90,
            passingScore: d.passingScore || 50,
            instructions: d.instructions || '',
            bank,
            variants,
            totalScore
        };
    }

    function buildQuestionLines(bank) {
        const lines = [];
        bank.forEach((q, qi) => {
            const num = qi + 1;
            lines.push({ type: 'question', text: `Q${num}. ${q.text || '(No text)'}`, score: q.score || 1 });
            if (Array.isArray(q.options)) {
                q.options.forEach((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const isCorrect = Number(q.correctOption) === oi;
                    lines.push({ type: 'option', text: `   ${letter}) ${opt || '(empty)'}`, correct: isCorrect });
                });
            }
            lines.push({ type: 'gap' });
        });
        return lines;
    }

    /* â”€â”€ PDF Export â”€â”€ */
    function exportToPDF(data) {
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            notify('PDF library not loaded. Please check your internet connection.');
            return;
        }
        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 18;
        const usable = pageW - margin * 2;
        let y = 20;
        const lineH = 6;

        function checkPage(need) {
            if (y + need > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        }

        // Header
        doc.setFillColor(30, 58, 95);
        doc.rect(0, 0, pageW, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(data.title, margin, 16);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.subject}  |  ${data.type}  |  ${data.duration} min  |  Pass: ${data.passingScore} pts`, margin, 26);
        doc.text(`Total: ${data.bank.length} questions  Â·  ${data.totalScore} points`, margin, 33);
        y = 48;
        doc.setTextColor(0, 0, 0);

        // Instructions
        if (data.instructions) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Instructions:', margin, y);
            y += lineH;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const instrLines = doc.splitTextToSize(data.instructions, usable);
            checkPage(instrLines.length * 4 + 6);
            doc.text(instrLines, margin, y);
            y += instrLines.length * 4 + 6;
        }

        // Separator
        doc.setDrawColor(200);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        // Questions
        const lines = buildQuestionLines(data.bank);
        lines.forEach(line => {
            if (line.type === 'gap') { y += 3; return; }
            checkPage(lineH + 2);
            if (line.type === 'question') {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                const qLines = doc.splitTextToSize(line.text, usable - 20);
                qLines.forEach(ql => {
                    checkPage(lineH);
                    doc.text(ql, margin, y);
                    y += lineH;
                });
                // Score badge
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100);
                doc.text(`[${line.score} pt${line.score > 1 ? 's' : ''}]`, pageW - margin - 12, y - lineH);
                doc.setTextColor(0);
            } else if (line.type === 'option') {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                if (line.correct) {
                    doc.setTextColor(16, 138, 80);
                    doc.setFont('helvetica', 'bold');
                }
                const oLines = doc.splitTextToSize(line.text, usable - 10);
                oLines.forEach(ol => {
                    checkPage(lineH - 1);
                    doc.text(ol, margin + 6, y);
                    y += lineH - 1;
                });
                if (line.correct) {
                    doc.text(' âœ“', margin + 6 + doc.getTextWidth(oLines[0]) + 1, y - (lineH - 1));
                }
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
            }
        });

        // Variants summary
        if (data.variants.length) {
            checkPage(20);
            y += 6;
            doc.setDrawColor(200);
            doc.line(margin, y, pageW - margin, y);
            y += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Variants (${data.variants.length})`, margin, y);
            y += lineH + 2;
            data.variants.forEach(v => {
                checkPage(lineH);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`${v.label}: ${(v.questionIds || []).length} questions`, margin + 4, y);
                y += lineH;
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}  |  ${data.title}  |  Generated: ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 8);
        }

        const filename = (data.title || 'quiz').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
        doc.save(filename);
        notify(`PDF exported: ${filename}`);
    }

    /* â”€â”€ DOCX Export â”€â”€ */
    function exportToDOCX(data) {
        if (typeof window.docx === 'undefined') {
            notify('DOCX library not loaded. Please check your internet connection.');
            return;
        }
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TableRow, TableCell, Table, WidthType } = window.docx;

        const children = [];

        // Title
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: data.title, bold: true, size: 36, color: '1E3A5F' })]
        }));

        // Meta line
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
                new TextRun({ text: `${data.subject}  |  ${data.type}  |  ${data.duration} min  |  Pass: ${data.passingScore} pts`, size: 20, color: '666666' })
            ]
        }));

        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
                new TextRun({ text: `${data.bank.length} questions  Â·  ${data.totalScore} points`, size: 20, color: '888888' })
            ]
        }));

        // Instructions
        if (data.instructions) {
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: 'Instructions', bold: true, size: 24 })]
            }));
            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text: data.instructions, size: 20, italics: true, color: '444444' })]
            }));
        }

        // Separator
        children.push(new Paragraph({
            spacing: { before: 100, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
            children: []
        }));

        // Questions
        data.bank.forEach((q, qi) => {
            const num = qi + 1;
            children.push(new Paragraph({
                spacing: { before: 200, after: 80 },
                children: [
                    new TextRun({ text: `Q${num}. `, bold: true, size: 22 }),
                    new TextRun({ text: q.text || '(No text)', size: 22 }),
                    new TextRun({ text: `  [${q.score || 1} pt${(q.score || 1) > 1 ? 's' : ''}]`, size: 18, color: '999999' })
                ]
            }));

            if (Array.isArray(q.options)) {
                q.options.forEach((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const isCorrect = Number(q.correctOption) === oi;
                    children.push(new Paragraph({
                        spacing: { after: 40 },
                        indent: { left: 400 },
                        children: [
                            new TextRun({
                                text: `${letter}) ${opt || '(empty)'}`,
                                size: 20,
                                bold: isCorrect,
                                color: isCorrect ? '108A50' : '333333'
                            }),
                            ...(isCorrect ? [new TextRun({ text: '  âœ“ correct', size: 16, bold: true, color: '108A50' })] : [])
                        ]
                    }));
                });
            }
        });

        // Variants
        if (data.variants.length) {
            children.push(new Paragraph({
                spacing: { before: 300, after: 100 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
                children: []
            }));
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 120 },
                children: [new TextRun({ text: `Variants (${data.variants.length})`, bold: true, size: 24 })]
            }));
            data.variants.forEach(v => {
                children.push(new Paragraph({
                    spacing: { after: 60 },
                    indent: { left: 200 },
                    children: [
                        new TextRun({ text: `${v.label}: `, bold: true, size: 20 }),
                        new TextRun({ text: `${(v.questionIds || []).length} questions`, size: 20, color: '666666' })
                    ]
                }));
            });
        }

        // Footer
        children.push(new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 16, color: 'AAAAAA' })]
        }));

        const docFile = new Document({
            sections: [{
                properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
                children
            }]
        });

        const filename = (data.title || 'quiz').replace(/[^a-zA-Z0-9_-]/g, '_') + '.docx';
        Packer.toBlob(docFile).then(blob => {
            if (typeof saveAs === 'function') {
                saveAs(blob, filename);
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            }
            notify(`DOCX exported: ${filename}`);
        }).catch(err => {
            console.error('DOCX export failed:', err);
            notify('DOCX export failed. See console for details.');
        });
    }

    /* â”€â”€ Export from active draft (builder) â”€â”€ */
    window.exportQuizAs = async function exportQuizAs(format) {
        const draft = getTemplateDraft();
        if (!draft) { notify('No quiz draft open.'); return; }
        const data = getExportData(draft);
        if (!data.bank.length) { notify('Add at least one question before exporting.'); return; }
        try {
            await Promise.resolve(window.ensureExamExportLibraries?.(format));
        } catch (error) {
            notify(`Could not load ${String(format || '').toUpperCase()} export tools.`);
            return;
        }
        if (format === 'docx') exportToDOCX(data);
        else exportToPDF(data);
    };

    /* â”€â”€ Export from template list by ID â”€â”€ */
    window.exportQuizById = async function exportQuizById(templateId, format) {
        const template = getTemplateById(templateId);
        if (!template) { notify('Template not found.'); return; }
        const data = getExportData(template);
        if (!data.bank.length) { notify('This quiz has no questions to export.'); return; }
        try {
            await Promise.resolve(window.ensureExamExportLibraries?.(format));
        } catch (error) {
            notify(`Could not load ${String(format || '').toUpperCase()} export tools.`);
            return;
        }
        if (format === 'docx') exportToDOCX(data);
        else exportToPDF(data);
    };

    if (document.getElementById(ROOT_ID)) renderConsole();
})();



