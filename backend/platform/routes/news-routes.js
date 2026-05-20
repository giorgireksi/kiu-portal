function registerNewsRoutes(app, deps = {}) {
    const {
        broadcastAll,
        getActorUserId,
        getStore,
        requireSessionAccount,
        resolveSessionBoundUserId,
        sendError
    } = deps;

    app.get('/api/news/feed', (request, response) => {
        const store = getStore();
        response.json({ ok: true, ...store.listNewsFeed(request.query) });
    });

    app.get('/api/news/privileges', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        response.json({
            ok: true,
            privileges: store.listPrivilegeDefinitions(),
            viewerPrivileges: store.getEffectiveAccountPrivileges(userId)
        });
    });

    app.post('/api/news/posts', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.createNewsPost(request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Invalid news post payload.');
            return;
        }
        broadcastAll({ type: 'news:updated', emittedAt: new Date().toISOString() });
        response.json({ ok: true, post: result });
    });

    app.patch('/api/news/posts/:id', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateNewsPost(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'News post could not be updated.');
            return;
        }
        broadcastAll({ type: 'news:updated', emittedAt: new Date().toISOString() });
        response.json({ ok: true, post: result });
    });

    app.post('/api/news/posts/:id/replies', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.addNewsReply(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Private reply could not be stored.');
            return;
        }
        broadcastAll({ type: 'news:updated', emittedAt: new Date().toISOString() });
        response.json({ ok: true, post: result });
    });
}

module.exports = {
    registerNewsRoutes
};
