function registerAcademicRoutes(app, deps = {}) {
    const {
        canAccessStudentAcademicRecord,
        getActorUserId,
        getActualSessionRole,
        getStore,
        isActualAdminSession,
        requireCourseStaffAccess,
        requireSessionAccount,
        sendError
    } = deps;

    app.get('/api/catalog/courses', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.listCourses(request.query) });
    });

    app.get('/api/catalog/sections', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.listSections(request.query) });
    });

    app.get('/api/students/:id/eligibility', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        if (!canAccessStudentAcademicRecord(sessionAccount, request.params.id)) {
            sendError(response, 403, 'You are not allowed to view this student eligibility record.');
            return;
        }
        response.json({ ok: true, eligibility: store.getStudentEligibility(request.params.id) });
    });

    app.get('/api/students/:id/enrollments', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        if (!canAccessStudentAcademicRecord(sessionAccount, request.params.id)) {
            sendError(response, 403, 'You are not allowed to view this student enrollment record.');
            return;
        }
        response.json({ ok: true, enrollments: store.getStudentEnrollments(request.params.id) });
    });

    app.post('/api/registration/enroll', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualRole = getActualSessionRole(sessionAccount);
        const actorUserId = getActorUserId(sessionAccount);
        const requestedStudentId = String(request.body?.studentId || '').trim();
        const studentId = actualRole === 'student' ? actorUserId : (requestedStudentId || actorUserId);
        if (!isActualAdminSession(sessionAccount) && !['student', 'student_service'].includes(actualRole)) {
            sendError(response, 403, 'You are not allowed to modify registration.');
            return;
        }
        const result = store.enrollStudent({
            ...(request.body || {}),
            studentId
        });
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/registration/drop', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualRole = getActualSessionRole(sessionAccount);
        const actorUserId = getActorUserId(sessionAccount);
        const requestedStudentId = String(request.body?.studentId || '').trim();
        const studentId = actualRole === 'student' ? actorUserId : (requestedStudentId || actorUserId);
        if (!isActualAdminSession(sessionAccount) && !['student', 'student_service'].includes(actualRole)) {
            sendError(response, 403, 'You are not allowed to modify registration.');
            return;
        }
        const result = store.dropEnrollment({
            ...(request.body || {}),
            studentId
        });
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.get('/api/lms/courses/:id', (request, response) => {
        const sessionAccount = requireCourseStaffAccess(request, response, request.params.id, 'read', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const course = store.getLmsCourse(request.params.id);
        if (!course) {
            sendError(response, 404, 'LMS course not found.');
            return;
        }
        response.json({ ok: true, course });
    });

    app.post('/api/lms/assignments', (request, response) => {
        const sessionAccount = requireCourseStaffAccess(request, response, request.body?.courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, assignment: store.createAssignment(request.body || {}) });
    });

    app.post('/api/lms/materials', (request, response) => {
        const sessionAccount = requireCourseStaffAccess(request, response, request.body?.courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, material: store.createMaterial(request.body || {}) });
    });

    app.post('/api/exam-sessions/sync', (request, response) => {
        const sessionAccount = requireCourseStaffAccess(request, response, request.body?.protectedCourseId || request.body?.courseId || request.body?.resourceKey, 'publish', new Set(['admin', 'professor']));
        if (!sessionAccount) return;
        const store = getStore();
        const examSession = store.syncExamSession(request.body || {});
        if (!examSession) {
            sendError(response, 400, 'Exam session could not be synced.');
            return;
        }
        response.json({ ok: true, session: examSession });
    });
}

module.exports = {
    registerAcademicRoutes
};
