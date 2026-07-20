/* LMS quiz finalize + exam session lifecycle. Peeled from lms.js.
 * Load before lms.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LMS_EXAM_SESSION_LOADED) return;
    window.__KIU_LMS_EXAM_SESSION_LOADED = true;

    window.__kiuCreateLmsExamSessionApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function finalizeLmsQuizSubmission(resourceKey, quiz, submission, studentId, studentName, mode = 'manual-submit') {
    if (!quiz || !submission) return null;
    syncLmsQuizSubmissionVariant(quiz, submission, studentId);
    const activeQuestions = getLmsQuizQuestionsForStudent(quiz, studentId, submission);
    const answers = {};
    activeQuestions.forEach(question => {
        const existingAnswer = submission.draftAnswers?.[question.id] || submission.answers?.[question.id] || {};
        const selectedRaw = existingAnswer.selectedOption;
        const selectedOption = selectedRaw === null || selectedRaw === undefined || selectedRaw === ''
            ? null
            : Number(selectedRaw);
        answers[question.id] = {
            selectedOption: Number.isFinite(selectedOption) ? selectedOption : null,
            text: String(existingAnswer.text || '').trim()
        };
    });
    const evaluation = calculateLmsQuizAutoScore(quiz, answers, studentId, submission);
    const actionTime = new Date().toISOString();
    submission.answers = answers;
    submission.questionResults = buildLmsQuizSubmissionQuestionResults(quiz, answers, studentId, submission);
    submission.responseSummary = buildLmsQuizSubmissionResponseSummary(submission.questionResults);
    submission.submittedAt = submission.submittedAt || actionTime;
    if (mode === 'auto-submit') {
        submission.autoSubmittedAt = actionTime;
    }
    submission.postSubmitLockUntil = new Date(new Date(actionTime).getTime() + LMS_POST_SUBMIT_LOCK_MS).toISOString();
    submission.autoScoreRaw = evaluation.autoScoreRaw;
    submission.requiresManualReview = evaluation.requiresManualReview;
    submission.history = Array.isArray(submission.history) ? submission.history : [];
    submission.history.push({
        action: mode === 'auto-submit' ? 'auto-submitted' : 'submitted',
        updatedAt: actionTime,
        updatedBy: studentName || `Student ${studentId}`
    });
    if (evaluation.requiresManualReview) {
        submission.status = mode === 'auto-submit' ? 'auto-submitted' : 'submitted';
        submission.manualScoresByQuestion = {};
        submission.manualScoreRaw = 0;
        submission.finalScoreRaw = null;
        submission.gradebookScore = null;
        submission.history.push({
            action: 'submitted-pending-review',
            updatedAt: actionTime,
            updatedBy: 'Auto grading',
            note: `Objective score ${evaluation.autoScoreRaw} recorded. Final grade is pending TA / professor review.`,
            autoScoreRaw: evaluation.autoScoreRaw,
            variantLabel: submission.variantLabel || ''
        });
    } else {
        submission.status = 'graded';
        submission.manualScoresByQuestion = {};
        submission.manualScoreRaw = 0;
        submission.finalScoreRaw = evaluation.autoScoreRaw;
        submission.gradedAt = actionTime;
        submission.reviewedAt = actionTime;
        submission.gradedBy = 'Auto grading';
        submission.reviewedBy = 'Auto grading';
        submission.gradebookScore = applyQuizScoreToGradebook(resourceKey, quiz, studentId, submission.finalScoreRaw, 'Auto grading', 'Objective quiz');
        submission.history.push({
            action: 'auto-graded',
            updatedAt: actionTime,
            updatedBy: 'Auto grading',
            variantLabel: submission.variantLabel || ''
        });
    }
    syncProtectedQuizAttemptToBackend(resourceKey, quiz, submission, {
        note: mode === 'auto-submit' ? 'Quiz attempt auto-submitted.' : 'Quiz attempt submitted.',
        submitReason: submission.proctorAutoSubmitReason || (mode === 'auto-submit' ? 'Auto-submitted by quiz protection.' : '')
    }).catch(() => null);
    return submission;
}
function autoSubmitExpiredLmsQuizAttempt(resourceKey, quiz, student) {
    if (!quiz || !student?.id) return false;
    const submission = getLmsQuizSubmission(resourceKey, quiz.id, student.id);
    if (!submission || submission.status !== 'in-progress') return false;
    const effectiveEnd = getLmsQuizEffectiveEndAt(quiz, submission);
    if (!effectiveEnd || effectiveEnd.getTime() > Date.now()) return false;
    finalizeLmsQuizSubmission(resourceKey, quiz, submission, student.id, student.name || `Student ${student.id}`, 'auto-submit');
    return true;
}
function getLmsQuizEffectiveEndAt(quiz, submission = null) {
    const absoluteEnd = quiz?.availableUntil ? new Date(quiz.availableUntil) : null;
    const sessionEnd = submission?.sessionEndsAt ? new Date(submission.sessionEndsAt) : null;
    const relativeEnd = submission?.startedAt && quiz?.durationMinutes
        ? new Date(new Date(submission.startedAt).getTime() + (Math.max(1, parseInt(quiz.durationMinutes, 10) || 20) * 60000))
        : null;
    const candidates = [absoluteEnd, sessionEnd, relativeEnd].filter(value => value instanceof Date && !Number.isNaN(value.getTime()));
    if (!candidates.length) return null;
    return candidates.reduce((earliest, current) => current.getTime() < earliest.getTime() ? current : earliest);
}
function getLmsQuizPostSubmitLockUntil(submission = null) {
    if (!submission || !['submitted', 'auto-submitted', 'graded'].includes(String(submission.status || ''))) return null;
    const explicitLock = submission.postSubmitLockUntil ? new Date(submission.postSubmitLockUntil) : null;
    if (explicitLock instanceof Date && !Number.isNaN(explicitLock.getTime())) {
        return explicitLock;
    }
    const submittedAt = submission.autoSubmittedAt || submission.submittedAt || submission.gradedAt || '';
    const submittedTime = submittedAt ? new Date(submittedAt) : null;
    if (!(submittedTime instanceof Date) || Number.isNaN(submittedTime.getTime())) return null;
    return new Date(submittedTime.getTime() + LMS_POST_SUBMIT_LOCK_MS);
}
function isLmsQuizPostSubmitLocked(submission = null, now = new Date()) {
    const lockUntil = getLmsQuizPostSubmitLockUntil(submission);
    if (!lockUntil) return false;
    return now.getTime() < lockUntil.getTime();
}
function getLmsQuizPostSubmitLockMessage(submission = null, now = new Date()) {
    const lockUntil = getLmsQuizPostSubmitLockUntil(submission);
    if (!lockUntil || now.getTime() >= lockUntil.getTime()) return '';
    return `Quiz access is locked for ${formatCountdownDuration(lockUntil.getTime() - now.getTime())} after submission.`;
}
function getLmsQuizAvailabilityState(quiz, submission = null, now = new Date()) {
    const start = quiz?.availableFrom ? new Date(quiz.availableFrom) : null;
    const effectiveEnd = getLmsQuizEffectiveEndAt(quiz, submission);
    if (getLmsQuizLifecycleStatus(quiz) === 'draft' || !quiz?.isPublished) return 'draft';
    if (submission?.status === 'graded') return 'graded';
    if (submission?.status === 'submitted' || submission?.status === 'auto-submitted') return 'submitted';
    if (getLmsQuizLifecycleStatus(quiz) === 'closed') return 'closed';
    if (effectiveEnd && now.getTime() > effectiveEnd.getTime()) return 'closed';
    if (start && now.getTime() < start.getTime()) return 'upcoming';
    if (submission?.status === 'in-progress') return 'in-progress';
    return 'open';
}
function formatCountdownDuration(ms) {
    const safe = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
function updateLmsExamSessionSummary(sessionId) {
    const session = getExamSessionById(sessionId);
    if (!session) return null;
    const quiz = getLmsQuizById(session.resourceKey, session.quizId);
    const summary = getLmsExamSessionMonitorStats(session, session.resourceKey, quiz);
    session.monitoringSummary = {
        allowedCount: summary.allowedCount,
        presentCount: summary.presentCount,
        blockedCount: summary.blockedCount,
        inProgressCount: summary.inProgressCount,
        submittedCount: summary.submittedCount,
        alertCount: summary.alertCount
    };
    session.updatedAt = new Date().toISOString();
    return session;
}
function startLmsExamSession(sessionId) {
    const session = getExamSessionById(sessionId);
    if (!session) return;
    const quiz = getLmsQuizById(session.resourceKey, session.quizId);
    if (!quiz) {
        alert('The linked exam quiz could not be found.');
        return;
    }
    const now = new Date();
    session.status = 'live';
    session.startedAt = now.toISOString();
    session.endsAt = new Date(now.getTime() + (Math.max(1, Number(session.durationMinutes || quiz.durationMinutes || 20)) * 60000)).toISOString();
    session.updatedAt = session.startedAt;
    quiz.availableFrom = session.startedAt;
    quiz.availableUntil = session.endsAt;
    quiz.status = 'published';
    quiz.isPublished = true;
    quiz.updatedAt = session.startedAt;
    saveLmsQuizWorkspaceRecord(session.resourceKey, quiz);
    const roster = getLmsQuizEligibleStudents(session.resourceKey).filter(student => (session.allowedStudentIds || []).includes(String(student.id)));
    roster.forEach(student => {
        const submission = ensureLmsQuizSubmissionShell(session.resourceKey, session.quizId, student);
        syncLmsQuizExamSessionSubmissionState(session.resourceKey, quiz, submission, student);
    });
    updateLmsExamSessionSummary(sessionId);
    saveState();
}
function closeLmsExamSession(sessionId, reason = 'Exam session closed by staff') {
    const session = getExamSessionById(sessionId);
    if (!session) return;
    const quiz = getLmsQuizById(session.resourceKey, session.quizId);
    const actionTime = new Date().toISOString();
    session.status = 'closed';
    session.endsAt = session.endsAt || actionTime;
    session.updatedAt = actionTime;
    if (quiz) {
        quiz.availableUntil = actionTime;
        quiz.status = 'closed';
        quiz.isPublished = true;
        quiz.updatedAt = actionTime;
        const submissions = ensureLmsQuizSubmissionStore(session.resourceKey, quiz.id);
        Object.values(submissions).forEach(submission => {
            if (String(submission?.status || '') !== 'in-progress') return;
            finalizeLmsQuizSubmission(session.resourceKey, quiz, submission, submission.studentId, submission.studentName || `Student ${submission.studentId}`, 'auto-submit');
            submission.history = Array.isArray(submission.history) ? submission.history : [];
            submission.history.push({
                action: 'exam-session-closed',
                updatedAt: actionTime,
                updatedBy: getSimulatedUserName(),
                note: reason
            });
        });
        saveLmsQuizWorkspaceRecord(session.resourceKey, quiz);
    }
    updateLmsExamSessionSummary(sessionId);
    saveState();
}
function syncLmsQuizWorkspaceLifecycle(resourceKey) {
    if (!resourceKey) return;
    // Ensure quiz state arrays exist for this resource key
    ensureLmsQuizzesForKey(resourceKey);
    // Sync any active exam sessions for quizzes under this key
    ensureLmsQuizzesForKey(resourceKey).forEach(quiz => {
        try { syncLmsExamSessionLifecycle(quiz); } catch (e) { console.warn('Quiz lifecycle sync skipped:', e); }
    });
}
function syncLmsExamSessionLifecycle(quiz) {
    const session = getLmsQuizExamSession(quiz);
    if (!session) return null;
    if (normalizeExamSessionStatus(session.status || 'draft') === 'live' && session.endsAt) {
        const endsAt = new Date(session.endsAt).getTime();
        if (Number.isFinite(endsAt) && Date.now() >= endsAt) {
            closeLmsExamSession(session.id, 'Exam session time expired');
            return getExamSessionById(session.id);
        }
    }
    return session;
}
bindLmsDelegatedMarkupActions();
window.isLmsStudentViewer = isLmsStudentViewer;
window.getLmsStudentSelectedSemester = getLmsStudentSelectedSemester;
window.setLmsStudentSelectedSemester = setLmsStudentSelectedSemester;
window.getStudentLmsEnrolledSubjects = getStudentLmsEnrolledSubjects;
window.getStudentLmsSemesterOptions = getStudentLmsSemesterOptions;
window.openLmsStudentEnrolledSubject = openLmsStudentEnrolledSubject;
window.syncLmsNextSessionContext = syncLmsNextSessionContext;
window.syncLmsCourseContext = syncLmsCourseContext;
window.canPostLmsInteractionAnnouncement = canPostLmsInteractionAnnouncement;
window.isLmsInteractionMessageFromStaff = isLmsInteractionMessageFromStaff;
window.canReplyToLmsInteractionPost = canReplyToLmsInteractionPost;
window.isLmsPersonalBoardKey = isLmsPersonalBoardKey;
window.isLmsPersonalBoardOwner = isLmsPersonalBoardOwner;
window.buildLmsPersonalBoardKey = buildLmsPersonalBoardKey;
window.getLmsPersonalDashboardCourseId = getLmsPersonalDashboardCourseId;

        const api = {
            finalizeLmsQuizSubmission,
            startLmsExamSession,
            closeLmsExamSession,
            syncLmsExamSessionLifecycle,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsExamSessionApi({});
})();

