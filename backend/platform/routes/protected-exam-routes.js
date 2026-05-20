function registerProtectedExamRoutes(app, deps = {}) {
    const {
        enforceRateLimit,
        examPortalAuthRateLimitMax,
        examPortalAuthRateLimitWindowMs,
        getSessionRole,
        getStore,
        requireAntiCheatBrowserRequest,
        requireCourseStaffAccess,
        requireExamPortalSession,
        requireProtectedQuizSession,
        requireSessionAccount,
        sendError
    } = deps;

    app.post('/api/exam-portal/auth', (request, response) => {
        if (!requireAntiCheatBrowserRequest(request, response)) return;
        if (!enforceRateLimit(request, response, 'exam-portal-auth', examPortalAuthRateLimitMax, examPortalAuthRateLimitWindowMs)) return;
        const store = getStore();
        const result = store.createExamPortalSession(request.body || {});
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Exam portal sign-in failed.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.get('/api/exam-portal/sessions', (request, response) => {
        if (!requireAntiCheatBrowserRequest(request, response)) return;
        const portalSession = requireExamPortalSession(request, response, { allowBody: false, allowQuery: false });
        if (!portalSession) return;
        const store = getStore();
        const result = store.listExamPortalVisibleSessions(portalSession.token);
        if (!result) {
            sendError(response, 404, 'Exam sessions were not found.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.get('/api/exam-portal/session/:sessionId', (request, response) => {
        if (!requireAntiCheatBrowserRequest(request, response)) return;
        const portalSession = requireExamPortalSession(request, response, { allowBody: false, allowQuery: false });
        if (!portalSession) return;
        const store = getStore();
        const session = store.getExamPortalSessionSummary(request.params.sessionId, portalSession.token);
        if (!session) {
            sendError(response, 404, 'Exam session was not found.');
            return;
        }
        response.json({ ok: true, session });
    });

    app.post('/api/exam-portal/sessions/:sessionId/launch-ticket', (request, response) => {
        if (!requireAntiCheatBrowserRequest(request, response)) return;
        const portalSession = requireExamPortalSession(request, response, { allowBody: true, allowQuery: false });
        if (!portalSession) return;
        const store = getStore();
        const result = store.createExamPortalLaunchTicket(request.params.sessionId, {
            ...(request.body || {}),
            token: portalSession.token
        });
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Exam launch ticket could not be created.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/sync', (request, response) => {
        const sessionAccount = requireCourseStaffAccess(request, response, request.body?.courseId || request.body?.resourceKey || request.body?.groupKey, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const quiz = store.syncProtectedQuiz(request.body || {});
        if (!quiz) {
            sendError(response, 400, 'Protected quiz could not be synced.');
            return;
        }
        response.json({ ok: true, quiz });
    });

    app.post('/api/protected-quizzes/:quizId/launch-ticket', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.createProtectedQuizLaunchTicket({
            ...(request.body || {}),
            quizId: request.params.quizId,
            actorUserId: sessionAccount.account.id,
            actorRole: getSessionRole(sessionAccount),
            studentName: sessionAccount.account.displayName || sessionAccount.account.nameEn || sessionAccount.account.name || ''
        });
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Protected quiz launch ticket could not be created.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-client/redeem-launch', (request, response) => {
        const store = getStore();
        const result = store.redeemProtectedQuizLaunch(request.body || {});
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Launch ticket could not be redeemed.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.get('/api/protected-quizzes/group/:groupKey/monitor', (request, response) => {
        const sessionAccount = requireCourseStaffAccess(request, response, request.params.groupKey, 'read', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const monitor = store.getProtectedQuizMonitor(request.params.groupKey, request.query.quizId || '');
        if (!monitor) {
            sendError(response, 404, 'Protected quiz monitoring data was not found.');
            return;
        }
        response.json({ ok: true, monitor });
    });

    app.get('/api/protected-quizzes/:quizId/attempts', (request, response) => {
        const courseId = request.query.courseId || request.query.resourceKey || '';
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'read', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const monitor = store.getProtectedQuizMonitor(courseId, request.params.quizId);
        if (!monitor) {
            sendError(response, 404, 'Protected quiz attempts were not found.');
            return;
        }
        response.json({
            ok: true,
            quiz: monitor.quizzes[0] || null,
            attempts: monitor.quizzes[0]?.attempts || []
        });
    });

    app.get('/api/protected-quizzes/:quizId/attempt', (request, response) => {
        const courseId = String(request.query.courseId || request.query.resourceKey || '').trim();
        const sessionState = requireProtectedQuizSession(request, response, courseId, request.params.quizId, { allowBody: false, allowQuery: false });
        if (!sessionState) return;
        response.json({ ok: true, ...sessionState.current });
    });

    app.post('/api/protected-quizzes/:quizId/heartbeat', (request, response) => {
        const courseId = String(request.body?.courseId || request.query.courseId || request.query.resourceKey || '').trim();
        const sessionState = requireProtectedQuizSession(request, response, courseId, request.params.quizId, { allowBody: true, allowQuery: false });
        if (!sessionState) return;
        const store = getStore();
        const result = store.heartbeatProtectedQuiz({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            clientSessionToken: sessionState.clientSessionToken
        });
        if (!result) {
            sendError(response, 400, 'Protected quiz heartbeat could not be recorded.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/events', (request, response) => {
        const courseId = String(request.body?.courseId || request.query.courseId || request.query.resourceKey || '').trim();
        const sessionState = requireProtectedQuizSession(request, response, courseId, request.params.quizId, { allowBody: true, allowQuery: false });
        if (!sessionState) return;
        const store = getStore();
        const result = store.recordProtectedQuizEvent({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            clientSessionToken: sessionState.clientSessionToken,
            studentId: sessionState.current.session.studentId,
            studentName: sessionState.current.session.studentName,
            clientType: sessionState.current.session.clientType,
            securityLevel: sessionState.current.session.securityLevel
        });
        if (!result) {
            sendError(response, 400, 'Protected quiz event could not be recorded.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/submit', (request, response) => {
        const courseId = String(request.body?.courseId || request.query.courseId || request.query.resourceKey || '').trim();
        const sessionState = requireProtectedQuizSession(request, response, courseId, request.params.quizId, { allowBody: true, allowQuery: false });
        if (!sessionState) return;
        const store = getStore();
        const result = store.recordProtectedQuizEvent({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            clientSessionToken: sessionState.clientSessionToken,
            studentId: sessionState.current.session.studentId,
            studentName: sessionState.current.session.studentName,
            clientType: sessionState.current.session.clientType,
            securityLevel: sessionState.current.session.securityLevel,
            event: 'submitted',
            status: String(request.body?.status || 'submitted').trim() || 'submitted',
            details: {
                ...(request.body?.details || {}),
                submitReason: request.body?.submitReason || request.body?.details?.submitReason || ''
            }
        });
        if (!result) {
            sendError(response, 400, 'Protected quiz submission could not be recorded.');
            return;
        }
        response.json({ ok: true, event: result.event, attempt: result.attempt });
    });

    app.post('/api/protected-quizzes/:quizId/students/:studentId/block', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateProtectedQuizAttemptControl({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.params.studentId
        }, 'block');
        if (!result) {
            sendError(response, 400, 'Student could not be blocked for this protected quiz.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/students/:studentId/unblock', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateProtectedQuizAttemptControl({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.params.studentId
        }, 'unblock');
        if (!result) {
            sendError(response, 400, 'Student could not be unblocked for this protected quiz.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/students/:studentId/force-submit', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateProtectedQuizAttemptControl({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.params.studentId
        }, 'force-submit');
        if (!result) {
            sendError(response, 400, 'Student attempt could not be force-submitted.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/students/:studentId/reset-warnings', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateProtectedQuizAttemptControl({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.params.studentId
        }, 'reset-warnings');
        if (!result) {
            sendError(response, 400, 'Student warnings could not be reset.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/students/:studentId/approve-reconnect', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateProtectedQuizAttemptControl({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.params.studentId
        }, 'approve-reconnect');
        if (!result) {
            sendError(response, 400, 'Student reconnect could not be approved.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/students/:studentId/override-status', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateProtectedQuizAttemptControl({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.params.studentId
        }, 'override-status');
        if (!result) {
            sendError(response, 400, 'Student session override status could not be updated.');
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/protected-quizzes/:quizId/manual-grade', (request, response) => {
        const courseId = request.body?.courseId || request.query.courseId || request.query.resourceKey;
        const sessionAccount = requireCourseStaffAccess(request, response, courseId, 'score', new Set(['admin', 'professor', 'ta']));
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.manualGradeProtectedQuiz({
            ...(request.body || {}),
            courseId,
            quizId: request.params.quizId,
            studentId: request.body?.studentId
        });
        if (!result) {
            sendError(response, 400, 'Protected quiz manual grade could not be saved.');
            return;
        }
        response.json({ ok: true, ...result });
    });
}

module.exports = {
    registerProtectedExamRoutes
};
