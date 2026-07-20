/* Peeled from assets/js/pages/gradebook-model.js. Load before host. */
/* Pattern C: LMS quiz ↔ gradebook mapping helpers. */
(function () {
    if (window.__KIU_GRADEBOOK_QUIZ_MAP_LOADED) return;
    window.__KIU_GRADEBOOK_QUIZ_MAP_LOADED = true;

    window.__kiuCreateGradebookQuizMapApi = function createKiuGradebookQuizMapApi(deps = {}) {
        const d = deps;
        void d;
function parseLmsCourseKeyForGradebook(courseKey) {
    if (typeof parseLmsCourseKey === 'function') {
        return parseLmsCourseKey(courseKey);
    }
    const raw = String(courseKey || '').trim();
    if (!raw.includes('::')) {
        return { courseId: raw, groupId: null, resourceKey: raw, sectionType: '' };
    }
    const [courseId, ...groupParts] = raw.split('::');
    const groupJoined = groupParts.join('::');
    const sectionMatch = groupJoined.match(/^(.*)::(materials|workspace|quiz|monitoring|attendance|calls|concepts|live-quiz)$/i);
    if (sectionMatch) {
        return {
            courseId: courseId || raw,
            groupId: sectionMatch[1] || null,
            resourceKey: raw,
            sectionType: String(sectionMatch[2] || '').toLowerCase()
        };
    }
    return {
        courseId: courseId || raw,
        groupId: groupJoined || null,
        resourceKey: raw,
        sectionType: ''
    };
}

function resolveCanonicalLmsResourceKeyForGradebook(resourceKey) {
    if (typeof resolveCanonicalLmsResourceKey === 'function') {
        return resolveCanonicalLmsResourceKey(resourceKey);
    }
    return String(resourceKey || '').trim();
}

function normalizeLmsQuizAssessmentTypeForGradebook(value = 'quiz') {
    if (typeof normalizeLmsQuizAssessmentType === 'function') {
        return normalizeLmsQuizAssessmentType(value);
    }
    const normalized = String(value || 'quiz').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const aliases = {
        quiz: 'quiz',
        oral: 'oral-quiz',
        oralquiz: 'oral-quiz',
        'oral-quiz': 'oral-quiz',
        midterm: 'midterm',
        'midterm-exam': 'midterm',
        final: 'final',
        'final-exam': 'final',
        retake: 'retake'
    };
    return aliases[normalized] || 'quiz';
}

function getLmsQuizzesForGradebook(resourceKey) {
    if (typeof ensureLmsQuizzesForKey === 'function') {
        return ensureLmsQuizzesForKey(resourceKey);
    }
    const normalizedKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
    const workspace = KIU_STATE.lmsQuizBuilder?.[normalizedKey]
        || KIU_STATE.lmsQuizBuilder?.[String(resourceKey || '').trim()]
        || null;
    if (!workspace || typeof workspace !== 'object') return [];
    return [
        ...(Array.isArray(workspace.drafts) ? workspace.drafts : []),
        ...(Array.isArray(workspace.published) ? workspace.published : []),
        ...(Array.isArray(workspace.closed) ? workspace.closed : [])
    ];
}

function getLmsQuizSubmissionForGradebook(resourceKey, quizId, studentId) {
    if (typeof getLmsQuizSubmission === 'function') {
        return getLmsQuizSubmission(resourceKey, quizId, studentId);
    }
    const normalizedKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
    const workspace = KIU_STATE.lmsQuizBuilder?.[normalizedKey]
        || KIU_STATE.lmsQuizBuilder?.[String(resourceKey || '').trim()]
        || null;
    const store = workspace?.submissions?.[quizId];
    return store && typeof store === 'object' ? (store[String(studentId)] || null) : null;
}

function buildLmsQuizGradebookNoteForGradebook(resourceKey, quiz = {}, noteSuffix = '') {
    if (typeof buildLmsQuizGradebookNote === 'function') {
        return buildLmsQuizGradebookNote(resourceKey, quiz, noteSuffix);
    }
    return [quiz?.title || quiz?.weekLabel || '', noteSuffix || ''].filter(Boolean).join(' - ');
}

function isGradebookLmsQuizRuntimeAvailable() {
    const builder = KIU_STATE.lmsQuizBuilder;
    return Boolean(builder && typeof builder === 'object' && Object.keys(builder).length);
}

function getLmsQuizResourceKeysForCurrentGradebookRoster() {
    if (!isGradebookLmsQuizRuntimeAvailable()) return [];
    const rosterKey = String(currentRosterId || '').trim();
    if (!rosterKey) return [];
    const matches = [];
    Object.keys(KIU_STATE.lmsQuizBuilder || {}).forEach(resourceKey => {
        const parsed = parseLmsCourseKeyForGradebook(resourceKey);
        if (!parsed.courseId || !parsed.groupId) return;
        const enrolledStudents = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
        const candidateRosterKey = resolveGradebookRosterKey(parsed.courseId, parsed.groupId, enrolledStudents);
        if (String(candidateRosterKey) === rosterKey) {
            matches.push(resolveCanonicalLmsResourceKeyForGradebook(resourceKey));
        }
    });
    return [...new Set(matches)];
}

function getLmsQuizResourceKeysForStudentHistory(studentId = '') {
    if (!isGradebookLmsQuizRuntimeAvailable()) return [];
    const normalizedStudentId = String(studentId || '').trim();
    const rosterMatches = getLmsQuizResourceKeysForCurrentGradebookRoster();
    const studentMatches = [];

    Object.keys(KIU_STATE.lmsQuizBuilder || {}).forEach(resourceKey => {
        const normalizedResourceKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
        const workspace = typeof ensureLmsQuizBuilderWorkspace === 'function'
            ? ensureLmsQuizBuilderWorkspace(normalizedResourceKey)
            : (KIU_STATE.lmsQuizBuilder?.[normalizedResourceKey] || KIU_STATE.lmsQuizBuilder?.[resourceKey] || null);
        const hasSubmission = Object.values(workspace?.submissions || {}).some(store =>
            store && typeof store === 'object' && Object.prototype.hasOwnProperty.call(store, normalizedStudentId)
        );
        if (hasSubmission) {
            studentMatches.push(normalizedResourceKey);
        }
    });

    const combined = [...new Set([...rosterMatches, ...studentMatches])];
    if (rosterMatches.length) {
        return combined;
    }
    return studentMatches.length ? [...new Set(studentMatches)] : combined;
}

function buildDisplayAssessmentEntryFromLmsQuiz(resourceKey, quiz, submission, criterion) {
    if (!quiz || !submission) return null;
    const normalizedResourceKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const quizCriterion = normalizeGradebookCriterion(normalizeLmsQuizAssessmentTypeForGradebook(quiz.assessmentType));
    if (quizCriterion !== normalizedCriterion) return null;
    const visibleScore = submission.finalScoreRaw ?? submission.gradebookScore ?? null;
    const history = Array.isArray(submission.history) && submission.history.length
        ? submission.history.map(item => ({
            score: item.finalScoreRaw ?? item.score ?? item.gradebookScore ?? null,
            updatedAt: item.updatedAt || item.timestamp || submission.reviewedAt || submission.submittedAt || quiz.updatedAt || quiz.createdAt,
            updatedBy: item.updatedBy || item.actor || submission.reviewedBy || submission.studentName || 'LMS Quiz',
            action: item.action || item.type || 'submitted'
        }))
        : [{
            score: visibleScore,
            updatedAt: submission.reviewedAt || submission.submittedAt || submission.startedAt || quiz.updatedAt || quiz.createdAt,
            updatedBy: submission.reviewedBy || submission.studentName || 'LMS Quiz',
            action: submission.requiresManualReview && ['submitted', 'auto-submitted'].includes(String(submission.status || ''))
                ? 'submitted'
                : (submission.reviewedAt ? 'scored' : 'submitted')
        }];
    return {
        number: normalizeAssessmentNumber(quiz.assessmentNumber, 1),
        score: visibleScore,
        updatedAt: submission.reviewedAt || submission.submittedAt || submission.startedAt || quiz.updatedAt || quiz.createdAt,
        updatedBy: submission.reviewedBy || submission.studentName || 'LMS Quiz',
        note: buildLmsQuizGradebookNoteForGradebook(
            normalizedResourceKey,
            quiz,
            submission.requiresManualReview && ['submitted', 'auto-submitted'].includes(String(submission.status || ''))
                ? (submission.gradebookScore === null || submission.gradebookScore === undefined ? 'Submitted / waiting for review' : 'Objective part auto-scored / waiting for review')
                : 'Submitted quiz'
        ),
        sourceResourceKey: normalizedResourceKey,
        sourceQuizId: quiz.id,
        sourceAssessmentType: quiz.assessmentType || normalizedCriterion,
        sourceAssessmentNumber: normalizeAssessmentNumber(quiz.assessmentNumber, 1),
        history
    };
}

function getDisplayAssessmentEntries(record, criterion) {
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const baseEntries = getAssessmentEntries(record, normalizedCriterion).map(entry => ({
        ...entry,
        history: Array.isArray(entry.history) ? [...entry.history] : entry.history
    }));
    const mergedEntries = new Map();
    const genericByNumber = new Map();

    baseEntries.forEach(entry => {
        const number = normalizeAssessmentNumber(entry.number, 1);
        const sourceKey = `${String(entry.sourceResourceKey || '').trim()}::${String(entry.sourceQuizId || '').trim()}`;
        const hasLinkedSource = Boolean(String(entry.sourceResourceKey || '').trim() && String(entry.sourceQuizId || '').trim());
        if (hasLinkedSource) {
            mergedEntries.set(sourceKey, entry);
        } else if (!genericByNumber.has(number)) {
            genericByNumber.set(number, entry);
        }
    });

    const studentId = String(record?.id || '').trim();
    if (studentId && isGradebookLmsQuizRuntimeAvailable()) {
        getLmsQuizResourceKeysForStudentHistory(studentId).forEach(resourceKey => {
            getLmsQuizzesForGradebook(resourceKey).forEach(quiz => {
                const submission = getLmsQuizSubmissionForGradebook(resourceKey, quiz.id, studentId);
                if (!submission || submission.status === 'not-started') return;
                const displayEntry = buildDisplayAssessmentEntryFromLmsQuiz(resourceKey, quiz, submission, normalizedCriterion);
                if (!displayEntry) return;
                const sourceKey = `${displayEntry.sourceResourceKey}::${displayEntry.sourceQuizId}`;
                const entryNumber = normalizeAssessmentNumber(displayEntry.number, 1);
                const existingLinked = mergedEntries.get(sourceKey);
                if (existingLinked) {
                    mergedEntries.set(sourceKey, {
                        ...existingLinked,
                        ...displayEntry,
                        history: displayEntry.history?.length ? displayEntry.history : existingLinked.history
                    });
                    return;
                }
                if (genericByNumber.has(entryNumber)) {
                    const genericEntry = genericByNumber.get(entryNumber);
                    genericByNumber.delete(entryNumber);
                    mergedEntries.set(sourceKey, {
                        ...genericEntry,
                        ...displayEntry,
                        history: displayEntry.history?.length ? displayEntry.history : genericEntry.history
                    });
                    return;
                }
                mergedEntries.set(sourceKey, displayEntry);
            });
        });
    }

    const finalEntries = [
        ...genericByNumber.values(),
        ...mergedEntries.values()
    ];
    return sortAssessmentEntries(finalEntries);
}

function getDisplayAssessmentEntryForNumber(record, criterion, number) {
    const targetNumber = normalizeAssessmentNumber(number, 1);
    return getDisplayAssessmentEntries(record, criterion)
        .find(item => normalizeAssessmentNumber(item.number, 1) === targetNumber) || null;
}

        const api = {
            parseLmsCourseKeyForGradebook,
            resolveCanonicalLmsResourceKeyForGradebook,
            normalizeLmsQuizAssessmentTypeForGradebook,
            getLmsQuizzesForGradebook,
            getLmsQuizSubmissionForGradebook,
            buildLmsQuizGradebookNoteForGradebook,
            isGradebookLmsQuizRuntimeAvailable,
            getLmsQuizResourceKeysForCurrentGradebookRoster,
            getLmsQuizResourceKeysForStudentHistory,
            buildDisplayAssessmentEntryFromLmsQuiz,
            getDisplayAssessmentEntries,
            getDisplayAssessmentEntryForNumber,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateGradebookQuizMapApi({});
})();
