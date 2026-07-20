function registerAuthMaintenanceRoutes(app, deps = {}) {
    const {
        enforceRateLimit,
        getSessionToken,
        getStore,
        isPortalImpersonationRole = () => false,
        loginRateLimitMax,
        loginRateLimitWindowMs,
        requireActualSessionRole,
        requireSessionAccount,
        getActualActorUserId = (sessionAccount) => sessionAccount?.account?.id,
        resetRateLimitMax,
        resetRateLimitWindowMs,
        sendError
    } = deps;

    function handleLogin(request, response) {
        if (!enforceRateLimit(request, response, 'auth-login', loginRateLimitMax, loginRateLimitWindowMs)) {
            return;
        }
        const store = getStore();
        const result = store.createSessionByCredentials(request.body?.email, request.body?.password);
        if (result?.error) {
            sendError(response, 401, 'Invalid email or password.');
            return;
        }
        response.json({ ok: true, ...result });
    }

    app.post('/api/auth/login', handleLogin);

    app.post('/api/auth/logout', (request, response) => {
        const store = getStore();
        store.logoutSession(getSessionToken(request));
        response.json({ ok: true });
    });

    app.post('/api/session/impersonate-role', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        const nextRole = String(request.body?.role || request.body?.impersonatedRole || '').trim().toLowerCase();
        if (!nextRole || nextRole === 'admin') {
            sendError(response, 400, 'A valid non-admin impersonation role is required.');
            return;
        }
        if (!isPortalImpersonationRole(nextRole)) {
            sendError(response, 400, 'Impersonation role must be student, professor, ta, or student_service.');
            return;
        }
        const userId = String(request.body?.userId || request.body?.impersonatedUserId || '').trim();
        if (!userId) {
            sendError(response, 400, 'userId is required for impersonation.');
            return;
        }
        const session = store.updateSessionImpersonation(getSessionToken(request), nextRole, userId);
        if (!session) {
            sendError(response, 404, 'Admin session not found or impersonation persona is invalid.');
            return;
        }
        response.json({ ok: true, session: store.createClientSessionPayload(session), account: store.getAccountById(session.userId) });
    });

    app.post('/api/auth/activate', (request, response) => {
        const store = getStore();
        const account = store.activateAccount(request.body?.id, request.body?.password);
        if (!account) {
            sendError(response, 400, 'Activation could not be completed.');
            return;
        }
        response.json({ ok: true, account });
    });

    app.post('/api/auth/change-password', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.changePassword(
            getActualActorUserId(sessionAccount),
            request.body?.currentPassword,
            request.body?.newPassword
        );
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        response.json({ ok: true, account: result.account });
    });

    app.post('/api/auth/request-reset', (request, response) => {
        if (!enforceRateLimit(request, response, 'auth-reset-request', resetRateLimitMax, resetRateLimitWindowMs)) {
            return;
        }
        const store = getStore();
        store.requestPasswordReset(request.body?.email);
        response.json({ ok: true });
    });

    app.post('/api/auth/reset-password', (request, response) => {
        const store = getStore();
        const account = store.resetPassword(request.body?.token, request.body?.password);
        if (!account) {
            sendError(response, 400, 'Reset token is invalid or expired.');
            return;
        }
        response.json({ ok: true, account });
    });
}

module.exports = {
    registerAuthMaintenanceRoutes
};
