const {
    asArray,
    clone,
    makeId,
    nowIso,
    safeNumber
} = require('../utils');

const DEFAULT_GRADEBOOK_ASSESSMENT_DEFINITIONS = Object.freeze({
    quiz: { key: 'quiz', aggregateMode: 'sum', maxScore: 10, weightPercent: 10 },
    homework: { key: 'homework', aggregateMode: 'average', maxScore: 100, weightPercent: 10 },
    midterm: { key: 'midterm', aggregateMode: 'sum', maxScore: 100, weightPercent: 30 },
    final: { key: 'final', aggregateMode: 'sum', maxScore: 100, weightPercent: 50 },
    retake: { key: 'retake', aggregateMode: 'sum', maxScore: 100, weightPercent: 50 }
});

function ensureGradebook(courseId) {
    const key = String(courseId || '').trim();
    if (!key) return null;
    this.state.gradebooks[key] = this.state.gradebooks[key] || {
        id: key,
        rosterId: key,
        assessmentDefinitions: {},
        records: {},
        publications: {},
        finalGradesReleased: false,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    Object.entries(DEFAULT_GRADEBOOK_ASSESSMENT_DEFINITIONS).forEach(([definitionKey, defaults]) => {
        this.state.gradebooks[key].assessmentDefinitions[definitionKey] = {
            ...defaults,
            ...(this.state.gradebooks[key].assessmentDefinitions[definitionKey] || {})
        };
    });
    return this.state.gradebooks[key];
}

function canAccessGradebookCourse(courseId, userId, role = '', action = 'read') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedAction = String(action || 'read').trim().toLowerCase();
    if (normalizedRole === 'admin') return true;
    if (!['read', 'score', 'publish', 'finalize'].includes(normalizedAction)) return false;
    if (['publish', 'finalize'].includes(normalizedAction) && normalizedRole !== 'professor') return false;
    if (normalizedRole === 'professor') return this.isCourseTeachingStaff(courseId, userId, normalizedRole);
    if (normalizedRole === 'ta' && ['read', 'score'].includes(normalizedAction)) {
        return this.isCourseTeachingStaff(courseId, userId, normalizedRole);
    }
    return false;
}

function getGradebookAssessmentDefinition(gradebook, criterionKey = '') {
    const normalizedCriterion = String(criterionKey || '').trim().toLowerCase();
    return {
        ...(DEFAULT_GRADEBOOK_ASSESSMENT_DEFINITIONS[normalizedCriterion] || {}),
        ...clone(gradebook?.assessmentDefinitions?.[normalizedCriterion] || {})
    };
}

function aggregateGradebookAssessmentEntries(entries = [], mode = 'average') {
    const normalizedMode = String(mode || 'average').trim().toLowerCase();
    const scores = asArray(entries)
        .map(item => safeNumber(item?.score, null))
        .filter(score => Number.isFinite(score));
    if (!scores.length) return 0;
    if (normalizedMode === 'latest') return scores[scores.length - 1];
    if (normalizedMode === 'sum') return scores.reduce((sum, score) => sum + score, 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function computeRecordFinalScore(record, gradebook = null) {
    const activeGradebook = gradebook || { assessmentDefinitions: {} };
    const quizDefinition = getGradebookAssessmentDefinition(activeGradebook, 'quiz');
    const homeworkDefinition = getGradebookAssessmentDefinition(activeGradebook, 'homework');
    const midtermDefinition = getGradebookAssessmentDefinition(activeGradebook, 'midterm');
    const finalDefinition = getGradebookAssessmentDefinition(activeGradebook, 'final');
    const retakeDefinition = getGradebookAssessmentDefinition(activeGradebook, 'retake');
    const toWeightedPercentPoints = (definition, criterionKey) => {
        const weightPercent = safeNumber(definition?.weightPercent, 0);
        if (weightPercent <= 0) return 0;
        const aggregateValue = aggregateGradebookAssessmentEntries(
            record?.assessments?.[criterionKey] || [],
            definition?.aggregateMode || 'average'
        );
        const maxScore = Math.max(1, safeNumber(definition?.maxScore, 100));
        return Math.max(0, Math.min(1, aggregateValue / maxScore)) * weightPercent;
    };
    const finalExamScore = Math.max(
        aggregateGradebookAssessmentEntries(record?.assessments?.final || [], finalDefinition?.aggregateMode || 'sum'),
        aggregateGradebookAssessmentEntries(record?.assessments?.retake || [], retakeDefinition?.aggregateMode || 'sum')
    );
    const finalExamContribution = (() => {
        const weightPercent = safeNumber(finalDefinition?.weightPercent, 0);
        if (weightPercent <= 0) return 0;
        const maxScore = Math.max(1, safeNumber(finalDefinition?.maxScore, 100));
        return Math.max(0, Math.min(1, finalExamScore / maxScore)) * weightPercent;
    })();
    return Math.max(0, Math.min(100, Math.round(
        toWeightedPercentPoints(quizDefinition, 'quiz')
        + toWeightedPercentPoints(homeworkDefinition, 'homework')
        + toWeightedPercentPoints(midtermDefinition, 'midterm')
        + finalExamContribution
    )));
}

function getGradebookCourse(courseId) {
    const gradebook = ensureGradebook.call(this, courseId);
    const enrollments = this.getStudentEnrollmentsByCourse(courseId);
    enrollments.forEach(enrollment => {
        gradebook.records[enrollment.studentId] = gradebook.records[enrollment.studentId] || {
            studentId: enrollment.studentId,
            assessments: {},
            finalScore: 0,
            letterGrade: '',
            history: []
        };
    });
    gradebook.updatedAt = nowIso();
    this.save();
    return {
        ...clone(gradebook),
        course: clone(this.state.courses[courseId] || null),
        roster: enrollments.map(enrollment => ({
            enrollmentId: enrollment.id,
            studentId: enrollment.studentId,
            student: this.getAccountById(enrollment.studentId),
            record: clone(gradebook.records[enrollment.studentId] || {})
        }))
    };
}

function setScore(payload = {}) {
    const courseId = String(payload.courseId || '').trim();
    const studentId = String(payload.studentId || '').trim();
    const criterion = String(payload.criterion || 'quiz').trim().toLowerCase();
    const assessmentNumber = Math.max(1, safeNumber(payload.assessmentNumber, 1));
    const score = safeNumber(payload.score, 0);
    if (!courseId || !studentId) return null;
    if (!this.getStudentEnrollmentsByCourse(courseId).some(enrollment => String(enrollment.studentId || '') === studentId)) return null;
    const gradebook = ensureGradebook.call(this, courseId);
    if (gradebook.finalGradesReleased && payload.serverAllowFinalizedEdit !== true) return null;
    const record = gradebook.records[studentId] = gradebook.records[studentId] || {
        studentId,
        assessments: {},
        finalScore: 0,
        letterGrade: '',
        history: []
    };
    record.assessments[criterion] = Array.isArray(record.assessments[criterion]) ? record.assessments[criterion] : [];
    const existingIndex = record.assessments[criterion].findIndex(item => safeNumber(item.number, 1) === assessmentNumber);
    const beforeEntry = existingIndex >= 0 ? clone(record.assessments[criterion][existingIndex]) : null;
    const entry = {
        number: assessmentNumber,
        score,
        status: String(payload.status || payload.scoreStatus || 'draft').trim().toLowerCase() || 'draft',
        updatedAt: nowIso(),
        updatedBy: String(payload.updatedBy || payload.actorUserId || '').trim(),
        note: String(payload.note || '').trim(),
        reason: String(payload.reason || payload.note || '').trim()
    };
    if (existingIndex >= 0) record.assessments[criterion][existingIndex] = { ...record.assessments[criterion][existingIndex], ...entry };
    else record.assessments[criterion].push(entry);
    const afterEntry = clone(record.assessments[criterion][existingIndex >= 0 ? existingIndex : record.assessments[criterion].length - 1]);
    const historyEvent = {
        id: makeId('grade_evt'),
        criterion,
        assessmentNumber,
        actionType: beforeEntry ? 'score-updated' : 'score-created',
        oldScore: beforeEntry ? safeNumber(beforeEntry.score, null) : null,
        score,
        oldStatus: beforeEntry ? String(beforeEntry.status || '').trim() : '',
        status: entry.status,
        updatedAt: nowIso(),
        updatedBy: String(payload.updatedBy || payload.actorUserId || '').trim(),
        actorRole: String(payload.actorRole || '').trim(),
        note: String(payload.note || '').trim(),
        reason: String(payload.reason || payload.note || '').trim(),
        beforeState: beforeEntry,
        afterState: afterEntry
    };
    record.history.unshift(historyEvent);
    record.finalScore = computeRecordFinalScore.call(this, record, gradebook);
    gradebook.updatedAt = nowIso();
    this.addAuditEvent({
        actorUserId: String(payload.actorUserId || payload.updatedBy || '').trim(),
        actorRole: String(payload.actorRole || '').trim(),
        eventDomain: 'gradebook',
        eventType: historyEvent.actionType,
        entityType: 'score_entry',
        entityId: `${courseId}:${studentId}:${criterion}:${assessmentNumber}`,
        beforeState: beforeEntry,
        afterState: {
            ...afterEntry,
            courseId,
            studentId,
            criterion,
            assessmentNumber
        },
        sourceSystem: 'lms'
    });
    this.save();
    return getGradebookCourse.call(this, courseId);
}

function publishGradebook(payload = {}) {
    const courseId = String(payload.courseId || '').trim();
    const criterion = String(payload.criterion || 'all').trim().toLowerCase();
    const gradebook = ensureGradebook.call(this, courseId);
    gradebook.publications[criterion] = {
        publishedAt: nowIso(),
        publishedBy: String(payload.publishedBy || '').trim()
    };
    Object.values(gradebook.records || {}).forEach(record => {
        Object.entries(record.assessments || {}).forEach(([bucketKey, entries]) => {
            if (criterion !== 'all' && criterion !== bucketKey) return;
            asArray(entries).forEach(entry => {
                entry.status = 'published';
                entry.publishedAt = gradebook.publications[criterion].publishedAt;
                entry.publishedBy = String(payload.publishedBy || payload.actorUserId || '').trim();
            });
        });
    });
    Object.keys(gradebook.records).forEach(studentId => {
        this.createNotification({
            recipientUserId: studentId,
            sourceDomain: 'gradebook',
            type: 'grades-published',
            title: 'Grades published',
            body: `${this.state.courses[courseId]?.name || courseId} grades were published.`,
            routePage: 'study-card',
            routeData: { courseId, criterion }
        });
    });
    this.addAuditEvent({
        actorUserId: String(payload.actorUserId || payload.publishedBy || '').trim(),
        actorRole: String(payload.actorRole || '').trim(),
        eventDomain: 'gradebook',
        eventType: 'grades-published',
        entityType: 'gradebook',
        entityId: `${courseId}:${criterion}`,
        afterState: gradebook.publications[criterion],
        sourceSystem: 'lms'
    });
    this.save();
    return getGradebookCourse.call(this, courseId);
}

function finalizeGrades(payload = {}) {
    const courseId = String(payload.courseId || '').trim();
    const gradebook = ensureGradebook.call(this, courseId);
    const beforeState = {
        finalGradesReleased: Boolean(gradebook.finalGradesReleased),
        updatedAt: gradebook.updatedAt || ''
    };
    gradebook.finalGradesReleased = true;
    gradebook.finalizedAt = nowIso();
    gradebook.finalizedBy = String(payload.finalizedBy || payload.actorUserId || '').trim();
    Object.values(gradebook.records).forEach(record => {
        record.finalScore = computeRecordFinalScore.call(this, record, gradebook);
        Object.values(record.assessments || {}).forEach(entries => {
            asArray(entries).forEach(entry => {
                entry.status = 'finalized';
                entry.finalizedAt = gradebook.finalizedAt;
                entry.finalizedBy = gradebook.finalizedBy;
            });
        });
    });
    this.addAuditEvent({
        actorUserId: String(payload.actorUserId || payload.finalizedBy || '').trim(),
        actorRole: String(payload.actorRole || '').trim(),
        eventDomain: 'gradebook',
        eventType: 'grades-finalized',
        entityType: 'gradebook',
        entityId: courseId,
        beforeState,
        afterState: {
            finalGradesReleased: true,
            finalizedAt: gradebook.finalizedAt,
            finalizedBy: gradebook.finalizedBy
        },
        sourceSystem: 'lms'
    });
    this.save();
    return getGradebookCourse.call(this, courseId);
}

module.exports = {
    aggregateGradebookAssessmentEntries,
    canAccessGradebookCourse,
    computeRecordFinalScore,
    ensureGradebook,
    finalizeGrades,
    getGradebookAssessmentDefinition,
    getGradebookCourse,
    publishGradebook,
    setScore
};
