/* LMS grade-sync helpers extracted from lms.js. */

function getGradebookRosterForQuizResource(resourceKey) {
    const parsed = parseLmsCourseKey(resourceKey);
    if (!parsed.courseId || !parsed.groupId) {
        return { rosterKey: resourceKey, students: [] };
    }
    const state = buildGradebookStudents(parsed.courseId, parsed.groupId);
    KIU_STATE.studentGrades[state.rosterKey] = state.students.map(student => ensureGradeRecordHistories(student));
    return {
        parsed,
        rosterKey: state.rosterKey,
        students: KIU_STATE.studentGrades[state.rosterKey].map(student => ensureGradeRecordHistories(student))
    };
}

function refreshVisibleGradebookRoster(rosterKey) {
    const roster = Array.isArray(KIU_STATE.studentGrades?.[rosterKey])
        ? KIU_STATE.studentGrades[rosterKey].map(student => ensureGradeRecordHistories(student))
        : null;
    if (!roster) return;
    if (String(currentRosterId || '') === String(rosterKey || '')) {
        mockStudents = roster.map(student => ensureGradeRecordHistories(student));
        if (document.getElementById('gradebook-body')) initGradebook();
    }
    if (document.getElementById('study-card-container')) renderStudyCard();
}

function buildLmsQuizGradebookMeta(resourceKey, quiz = {}, overrides = {}) {
    return {
        sourceResourceKey: String(overrides.sourceResourceKey || resourceKey || ''),
        sourceQuizId: String(overrides.sourceQuizId || quiz?.id || ''),
        sourceAssessmentType: String(overrides.sourceAssessmentType || normalizeLmsQuizAssessmentType(quiz?.assessmentType || 'quiz')),
        sourceAssessmentNumber: normalizeAssessmentNumber(overrides.sourceAssessmentNumber || quiz?.assessmentNumber, 1)
    };
}

function buildLmsQuizGradebookNote(resourceKey, quiz = {}, noteSuffix = '') {
    const context = resolveActiveLmsQuizContext(resourceKey) || {};
    return [
        quiz?.title || getLmsQuizDisplayLabel(quiz),
        quiz?.weekLabel || '',
        context.subject?.name || '',
        context.group?.name || context.groupId || '',
        noteSuffix || ''
    ].filter(Boolean).join('  -  ');
}

function syncAssessmentEntryMetaOnRecord(record, criterion, number, meta = {}) {
    const safeRecord = ensureGradeRecordHistories(record);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const existingIndex = entries.findIndex(entry => normalizeAssessmentNumber(entry.number, 1) === targetNumber);
    if (existingIndex < 0) {
        return createAssessmentEntryOnRecord(safeRecord, normalizedCriterion, targetNumber, meta);
    }
    const existingEntry = entries[existingIndex];
    entries[existingIndex] = {
        ...existingEntry,
        note: meta.note || existingEntry.note || '',
        sourceResourceKey: meta.sourceResourceKey || existingEntry.sourceResourceKey || '',
        sourceQuizId: meta.sourceQuizId || existingEntry.sourceQuizId || '',
        sourceAssessmentType: meta.sourceAssessmentType || existingEntry.sourceAssessmentType || '',
        sourceAssessmentNumber: meta.sourceAssessmentNumber || existingEntry.sourceAssessmentNumber || targetNumber
    };
    safeRecord.assessments[normalizedCriterion] = sortAssessmentEntries(entries);
    return syncGradeRecordSummaries(safeRecord);
}

function seedQuizIntoGradebook(resourceKey, quiz) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const rosterState = getGradebookRosterForQuizResource(resourceKey);
    const criterion = getLmsQuizAssessmentMeta(quiz?.assessmentType || 'quiz').key;
    const sourceMeta = buildLmsQuizGradebookMeta(resourceKey, quiz);
    const quizNote = buildLmsQuizGradebookNote(resourceKey, quiz);
    const updatedRoster = (rosterState.students || []).map(student => syncAssessmentEntryMetaOnRecord(student, criterion, quiz?.assessmentNumber, {
        updatedBy: getSimulatedUserName(),
        note: quizNote,
        ...sourceMeta
    }));
    KIU_STATE.studentGrades[rosterState.rosterKey] = updatedRoster.map(student => ensureGradeRecordHistories(student));
    refreshVisibleGradebookRoster(rosterState.rosterKey);
    return rosterState.rosterKey;
}

function convertQuizRawScoreToGradebookScore(quiz, rawScore) {
    const criterionMeta = getGradebookCriterionMeta(getLmsQuizAssessmentMeta(quiz?.assessmentType || 'quiz').key);
    const maxScore = Math.max(1, Number(criterionMeta?.maxScore || 100));
    return Math.max(0, Math.min(maxScore, Math.round(Number(rawScore || 0))));
}

function applyQuizScoreToGradebook(resourceKey, quiz, studentId, rawScore, updatedBy, noteSuffix = '') {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const rosterState = getGradebookRosterForQuizResource(resourceKey);
    const criterion = getLmsQuizAssessmentMeta(quiz?.assessmentType || 'quiz').key;
    const note = buildLmsQuizGradebookNote(resourceKey, quiz, noteSuffix);
    const numericStudentId = String(studentId);
    const gradebookScore = convertQuizRawScoreToGradebookScore(quiz, rawScore);
    const sourceMeta = buildLmsQuizGradebookMeta(resourceKey, quiz);
    const updatedRoster = (rosterState.students || []).map(student => {
        if (String(student.id) !== numericStudentId) return ensureGradeRecordHistories(student);
        return setAssessmentScoreOnRecord(student, criterion, quiz?.assessmentNumber, gradebookScore, {
            updatedBy: updatedBy || getSimulatedUserName(),
            note,
            ...sourceMeta
        });
    });
    KIU_STATE.studentGrades[rosterState.rosterKey] = updatedRoster.map(student => ensureGradeRecordHistories(student));
    refreshVisibleGradebookRoster(rosterState.rosterKey);
    return gradebookScore;
}

function syncLmsQuizRoster(resourceKey, quiz) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const parsed = parseLmsCourseKey(resourceKey);
    if (!parsed.courseId) return;
    const students = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
    seedQuizIntoGradebook(resourceKey, quiz);
    students.forEach(student => {
        const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, student);
        syncLmsQuizSubmissionVariant(quiz, submission, student.id);
    });
}

if (typeof window !== 'undefined') {
    window.applyQuizScoreToGradebook = window.applyQuizScoreToGradebook || applyQuizScoreToGradebook;
}
