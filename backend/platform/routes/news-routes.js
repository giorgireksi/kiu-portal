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

    app.get('/api/news/sections', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const viewerUserId = resolveSessionBoundUserId(sessionAccount, request.query?.userId);
        response.json({ ok: true, ...store.listNewsSectionCatalog(viewerUserId) });
    });

    app.put('/api/news/sections', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.saveNewsSectionCatalog(
            (request.body || {}).catalog || [],
            getActorUserId(sessionAccount),
            (request.body || {}).reassignments || {}
        );
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'News sections could not be saved.');
            return;
        }
        broadcastAll({ type: 'news:updated', silent: true, emittedAt: new Date().toISOString() });
        response.json({ ok: true, ...result });
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

    app.post('/api/news/posts/:id/replies/:replyId/react', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.toggleNewsReplyReaction(
            request.params.id,
            request.params.replyId,
            (request.body || {}).reactionType || 'like',
            getActorUserId(sessionAccount)
        );
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Reply reaction could not be updated.');
            return;
        }
        broadcastAll({ type: 'news:updated', emittedAt: new Date().toISOString() });
        response.json({ ok: true, post: result });
    });

    app.delete('/api/news/posts/:id/replies/:replyId', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.deleteNewsReply(request.params.id, request.params.replyId, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Reply could not be deleted.');
            return;
        }
        broadcastAll({ type: 'news:updated', emittedAt: new Date().toISOString() });
        response.json({ ok: true, post: result });
    });

    app.post('/api/news/posts/:id/replies/:replyId/report', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.reportNewsReply(
            request.params.id,
            request.params.replyId,
            getActorUserId(sessionAccount),
            (request.body || {}).reason || ''
        );
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Reply could not be reported.');
            return;
        }
        response.json({ ok: true });
    });
}

module.exports = {
    registerNewsRoutes
};
