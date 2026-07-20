/* Pure LMS quiz helpers (builder draft, scoring, status, anti-cheat normalize).
 * Loaded before lms-quiz-workspace-runtime.js (see LMS_QUIZ_MODULE_URLS).
 * ESM leaf + classic bridge for defer/lazy consumers.
 */
'use strict';

function resolveCanonicalLmsResourceKey(resourceKey) {
    if (typeof window.resolveCanonicalLmsResourceKey === 'function'
        && window.resolveCanonicalLmsResourceKey !== resolveCanonicalLmsResourceKey) {
        return window.resolveCanonicalLmsResourceKey(resourceKey);
    }
    return String(resourceKey || '').trim();
}

function getCurrentUserId() {
    if (typeof window.getCurrentUserId === 'function'
        && window.getCurrentUserId !== getCurrentUserId) {
        return window.getCurrentUserId();
    }
    return '';
}


const LMS_DEFAULT_ANTI_CHEAT_POLICY = {
    processScanning: true,
    clipboardClearing: true,
    focusProtection: true,
    inputBlocking: true,
    kioskMode: true,
    vmDetection: true,
    devToolsProtection: true,
    allowDebugTools: false,
    navigationProtection: true,
    securityDialogs: true,
    violationScreen: true,
    blockedProcesses: [
        'TeamViewer.exe', 'AnyDesk.exe', 'Discord.exe', 'obs64.exe', 'obs32.exe',
        'Zoom.exe', 'Skype.exe', 'Cheat Engine.exe', 'x64dbg.exe', 'Wireshark.exe',
        'SnippingTool.exe', 'ScreenClippingHost.exe'
    ],
    allowedDomains: [],
    heartbeatMs: 2000,
    processScanMs: 1500
};

function jsQuote(value) {
    return `'${String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function getAdminQuizTotalScore(quiz = {}) {
    return (Array.isArray(quiz?.questions) ? quiz.questions : []).reduce((sum, question) => {
        const score = Number(question?.score || 0);
        return sum + (Number.isFinite(score) ? score : 0);
    }, 0);
}

function normalizeLmsAntiCheatPolicy(policy = {}) {
    const source = policy && typeof policy === 'object' ? policy : {};
    const merged = { ...LMS_DEFAULT_ANTI_CHEAT_POLICY, ...source };
    const uniqueList = values => Array.from(new Set((Array.isArray(values) ? values : [])
        .map(value => String(value || '').trim())
        .filter(Boolean)));
    const boundedMs = (value, fallback) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(60000, Math.max(1000, Math.round(numeric)));
    };
    return {
        processScanning: merged.processScanning !== false,
        clipboardClearing: merged.clipboardClearing !== false,
        focusProtection: merged.focusProtection !== false,
        inputBlocking: merged.inputBlocking !== false,
        kioskMode: merged.kioskMode !== false,
        vmDetection: merged.vmDetection !== false,
        devToolsProtection: merged.devToolsProtection !== false,
        allowDebugTools: merged.allowDebugTools === true,
        navigationProtection: merged.navigationProtection !== false,
        securityDialogs: merged.securityDialogs !== false,
        violationScreen: merged.violationScreen !== false,
        blockedProcesses: uniqueList(merged.blockedProcesses).length ? uniqueList(merged.blockedProcesses) : [...LMS_DEFAULT_ANTI_CHEAT_POLICY.blockedProcesses],
        allowedDomains: uniqueList(merged.allowedDomains),
        heartbeatMs: boundedMs(merged.heartbeatMs, LMS_DEFAULT_ANTI_CHEAT_POLICY.heartbeatMs),
        processScanMs: boundedMs(merged.processScanMs, LMS_DEFAULT_ANTI_CHEAT_POLICY.processScanMs)
    };
}

function getAssessmentEntryDisplayContext(criterion, entry = {}) {
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const criterionMeta = getGradebookCriterionMeta(normalizedCriterion);
    const entryNumber = normalizeAssessmentNumber(entry?.number, 1);
    const manualTitle = String(entry?.title || entry?.name || '').trim();
    const linked = resolveLmsQuizSourceFromAssessmentEntry(entry);
    if (!linked?.quiz) {
        return {
            title: manualTitle || `${criterionMeta.label} ${entryNumber}`,
            subtitle: '',
            criterionMeta,
            entryNumber,
            linked: null
        };
    }
    const context = resolveActiveLmsQuizContext(linked.resourceKey) || {};
    const quiz = linked.quiz;
    return {
        title: String(quiz.title || '').trim() || manualTitle || `${criterionMeta.label} ${entryNumber}`,
        subtitle: [getLmsQuizDisplayLabel(quiz), quiz.weekLabel, context.subject?.name, context.group?.name].filter(Boolean).join('  -  '),
        criterionMeta,
        entryNumber,
        linked
    };
}

function resolveLmsQuizSourceFromAssessmentEntry(entry = {}) {
    const resourceKey = resolveCanonicalLmsResourceKey(String(entry?.sourceResourceKey || '').trim());
    const quizId = String(entry?.sourceQuizId || '').trim();
    if (!resourceKey || !quizId) return null;
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return null;
    return { resourceKey, quizId, quiz };
}

function normalizeLmsQuizBuilderAllowedStudentIds(studentIds = []) {
    if (!Array.isArray(studentIds)) return [];
    return Array.from(new Set(
        studentIds
            .map(studentId => String(studentId || '').trim())
            .filter(Boolean)
    ));
}

function createLmsQuizBuilderQuestion() {
    return {
        id: makeAdminExamEntityId('lms-question'),
        type: 'mcq',
        text: '',
        score: 1,
        optionCount: 4,
        options: ['', '', '', ''],
        correctOption: 0,
        expectedAnswer: ''
    };
}

function normalizeLmsQuizBuilderDraftState(draft, context) {
    const baseDraft = createLmsQuizBuilderDraft(context);
    const sourceDraft = draft && typeof draft === 'object' ? draft : {};
    const normalizedQuestions = normalizeLmsQuizQuestionList(sourceDraft.questions);
    const questions = normalizedQuestions.length ? normalizedQuestions : [createLmsQuizBuilderQuestion()];
    const variantEnabled = sourceDraft.variantEnabled === true;
    return {
        ...baseDraft,
        ...sourceDraft,
        editingQuizId: sourceDraft.editingQuizId ? String(sourceDraft.editingQuizId) : null,
        title: String(sourceDraft.title || ''),
        subjectId: context?.subject?.id || context?.courseId || String(sourceDraft.subjectId || baseDraft.subjectId || ''),
        subjectName: context?.subject?.name || context?.courseId || String(sourceDraft.subjectName || baseDraft.subjectName || ''),
        groupId: context?.group?.id || context?.groupId || String(sourceDraft.groupId || baseDraft.groupId || ''),
        groupName: context?.group?.name || context?.groupId || String(sourceDraft.groupName || baseDraft.groupName || ''),
        assessmentType: normalizeLmsQuizAssessmentType(sourceDraft.assessmentType || baseDraft.assessmentType),
        assessmentNumber: sourceDraft.assessmentNumber === null || sourceDraft.assessmentNumber === undefined || sourceDraft.assessmentNumber === ''
            ? null
            : normalizeAssessmentNumber(sourceDraft.assessmentNumber, 1),
        weekLabel: String(sourceDraft.weekLabel || context?.weeks?.[0] || baseDraft.weekLabel || 'Week 1'),
        availableFrom: String(sourceDraft.availableFrom || ''),
        availableUntil: String(sourceDraft.availableUntil || ''),
        durationMinutes: Math.max(1, parseInt(sourceDraft.durationMinutes, 10) || baseDraft.durationMinutes || 20),
        instructions: String(sourceDraft.instructions || ''),
        publishMode: String(sourceDraft.publishMode || 'manual'),
        allowedStudentIds: normalizeLmsQuizBuilderAllowedStudentIds(sourceDraft.allowedStudentIds),
        requiresBlueExamNetwork: false,
        attendanceGateEnabled: sourceDraft.attendanceGateEnabled !== false,
        variantEnabled,
        variantCount: Math.min(8, Math.max(1, parseInt(sourceDraft.variantCount, 10) || 3)),
        questionsPerVariant: Math.max(1, parseInt(sourceDraft.questionsPerVariant, 10) || Math.min(questions.length || 1, 10)),
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        questions,
        variants: variantEnabled ? normalizeLmsQuizVariantList(sourceDraft.variants) : []
    };
}

function createLmsQuizBuilderDraft(context) {
    return {
        editingQuizId: null,
        title: '',
        subjectId: context?.subject?.id || context?.courseId || '',
        subjectName: context?.subject?.name || context?.courseId || '',
        groupId: context?.group?.id || context?.groupId || '',
        groupName: context?.group?.name || context?.groupId || '',
        assessmentType: 'quiz',
        assessmentNumber: null,
        weekLabel: context?.weeks?.[0] || 'Week 1',
        availableFrom: '',
        availableUntil: '',
        durationMinutes: 20,
        instructions: '',
        allowedStudentIds: [],
        requiresBlueExamNetwork: false,
        attendanceGateEnabled: true,
        variantEnabled: false,
        variantCount: 3,
        questionsPerVariant: 10,
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        questions: [createLmsQuizBuilderQuestion()],
        variants: []
    };
}

function getLmsQuizStatusToneClass(status) {
    const toneMap = {
        draft: 'is-draft',
        upcoming: 'is-upcoming',
        open: 'is-open',
        'in-progress': 'is-in-progress',
        submitted: 'is-submitted',
        graded: 'is-graded',
        closed: 'is-closed'
    };
    return toneMap[String(status || 'draft')] || 'is-draft';
}

function getLmsQuizStatusBadge(status) {
    const meta = {
        draft: { label: 'Draft', bg: '#f8fafc', color: '#64748b' },
        upcoming: { label: 'Upcoming', bg: '#eff6ff', color: '#1d4ed8' },
        open: { label: 'Open', bg: '#ecfdf5', color: '#047857' },
        'in-progress': { label: 'In Progress', bg: '#fff7ed', color: '#c2410c' },
        submitted: { label: 'Submitted', bg: '#f5f3ff', color: '#7c3aed' },
        graded: { label: 'Graded', bg: '#ecfeff', color: '#0f766e' },
        closed: { label: 'Closed', bg: '#fef2f2', color: '#dc2626' }
    };
    return meta[status] || meta.draft;
}

function buildEmptyLmsStudentQuizFocusState() {
    return {
        active: false,
        resourceKey: '',
        quizId: '',
        studentId: '',
        studentName: '',
        activatedAt: '',
        warningMessage: ''
    };
}

function buildLmsSubmissionDraftKey(resourceKey, assignmentId, userId = getCurrentUserId() || 'student') {
    return `${resolveCanonicalLmsResourceKey(resourceKey)}::${assignmentId}::${userId}`;
}

function validateLmsQuizBeforePublish(quiz) {
    const errors = [];
    if (!String(quiz?.title || '').trim()) errors.push('Quiz title is required.');
    const normalizedWeek = normalizeLmsWeekLabel(quiz?.weekLabel || '');
    if (!normalizedWeek || normalizedWeek === 'No Week / General') errors.push('Select a valid week.');
    const questionSets = quiz?.variantEnabled === true
        ? normalizeLmsQuizVariantList(quiz?.variants).map(variant => ({
            label: variant.label,
            questions: variant.questions || []
        }))
        : [{ label: 'Base quiz', questions: normalizeLmsQuizQuestionList(quiz?.questions) }];
    if (!questionSets.length || !questionSets.some(entry => entry.questions.length)) {
        errors.push(quiz?.variantEnabled === true ? 'Generate quiz variants first.' : 'Add at least one question.');
    }
    questionSets.forEach(questionSet => {
        const questions = questionSet.questions || [];
        if (!questions.length) {
            errors.push(`${questionSet.label} has no questions.`);
            return;
        }
        questions.forEach((question, index) => {
        const label = `Question ${index + 1}`;
        const type = String(question?.type || 'mcq') === 'written' ? 'written' : 'mcq';
        if (!String(question?.text || '').trim()) {
            errors.push(`${questionSet.label} ${label} text is empty.`);
            return;
        }
        if (type === 'mcq') {
            const optionCount = Math.min(6, Math.max(2, parseInt(question?.optionCount, 10) || (question?.options || []).length || 4));
            const options = Array.from({ length: optionCount }, (_, optionIndex) => String(question?.options?.[optionIndex] || '').trim());
            if (options.some(option => !option)) {
                errors.push(`${questionSet.label} ${label} has empty answer options.`);
            }
        }
        });
    });
    return errors;
}


export const lmsQuizModelApi = {
    LMS_DEFAULT_ANTI_CHEAT_POLICY,
    jsQuote,
    getAdminQuizTotalScore,
    normalizeLmsAntiCheatPolicy,
    getAssessmentEntryDisplayContext,
    resolveLmsQuizSourceFromAssessmentEntry,
    normalizeLmsQuizBuilderAllowedStudentIds,
    createLmsQuizBuilderQuestion,
    normalizeLmsQuizBuilderDraftState,
    createLmsQuizBuilderDraft,
    getLmsQuizStatusToneClass,
    getLmsQuizStatusBadge,
    buildEmptyLmsStudentQuizFocusState,
    buildLmsSubmissionDraftKey,
    validateLmsQuizBeforePublish
};

/** Install classic window / Kiu surface (idempotent). */
export function installLmsQuizModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_LMS_QUIZ_MODEL_LOADED) {
        return target?.KiuLmsQuizModel || lmsQuizModelApi;
    }
    target.__KIU_LMS_QUIZ_MODEL_LOADED = true;
    target.__kiuLmsQuizModelExports = lmsQuizModelApi;
    target.KiuLmsQuizModel = lmsQuizModelApi;
    Object.keys(lmsQuizModelApi).forEach((key) => {
        target[key] = lmsQuizModelApi[key];
    });
    return lmsQuizModelApi;
}

installLmsQuizModel();

