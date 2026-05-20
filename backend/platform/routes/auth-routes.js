function registerAuthRoutes(app, deps = {}) {
    const {
        getSessionToken,
        getStore,
        handleLogin,
        requireActualSessionRole,
        sendError
    } = deps;

    app.get('/api/portal/session', (request, response) => {
        const store = getStore();
        const token = getSessionToken(request);
        const session = store.getSession(token);
        if (!session) {
            sendError(response, 404, 'Session not found.');
            return;
        }
        response.json({ ok: true, session: store.createClientSessionPayload(session), account: store.getAccountById(session.userId) });
    });

    app.post('/api/portal/session/login', handleLogin);

    app.post('/api/portal/session/logout', (request, response) => {
        const store = getStore();
        store.logoutSession(getSessionToken(request));
        response.json({ ok: true });
    });

    app.delete('/api/session/impersonate-role', (request, response) => {
        const store = getStore();
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const session = store.clearSessionImpersonation(getSessionToken(request));
        if (!session) {
            sendError(response, 404, 'Admin session not found.');
            return;
        }
        response.json({ ok: true, session: store.createClientSessionPayload(session), account: store.getAccountById(session.userId) });
    });
}

module.exports = {
    registerAuthRoutes
};
