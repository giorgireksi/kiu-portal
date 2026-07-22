function registerBackgroundGalleryRoutes(app, deps = {}) {
    const {
        getSessionActor,
        getStore,
        isActualAdminSession,
        requireSessionAccount,
        sendError
    } = deps;

    app.get('/api/background-gallery/catalog', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, catalog: store.getBackgroundGalleryCatalog() });
    });

    app.post('/api/background-gallery/catalog', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        if (!isActualAdminSession(sessionAccount)) {
            sendError(response, 403, 'Admin access required.');
            return;
        }
        const actor = getSessionActor(sessionAccount);
        const result = await getStore().addBackgroundGalleryCatalogItem(request.body || {}, actor);
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.delete('/api/background-gallery/catalog/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        if (!isActualAdminSession(sessionAccount)) {
            sendError(response, 403, 'Admin access required.');
            return;
        }
        const actor = getSessionActor(sessionAccount);
        const result = getStore().removeBackgroundGalleryCatalogItem(request.params.id, actor);
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        response.json({ ok: true, ...result });
    });

    app.get('/api/background-gallery/mine', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const actor = getSessionActor(sessionAccount);
        const items = getStore().getBackgroundGalleryUserItems(actor.actorUserId);
        response.json({ ok: true, items });
    });

    app.post('/api/background-gallery/mine', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const actor = getSessionActor(sessionAccount);
        const result = await getStore().addBackgroundGalleryUserItem(actor.actorUserId, request.body || {}, actor);
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        await getStore().flushPendingWrites();
        response.json({ ok: true, ...result });
    });

    app.post('/api/background-gallery/upload', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const actor = getSessionActor(sessionAccount);
            const store = getStore();
            const result = await store.uploadBackgroundGalleryAsset(request.body || {}, actor);
            if (result?.error) {
                sendError(response, result.status || 400, result.error);
                return;
            }
            await store.flushPendingWrites();
            response.json({ ok: true, ...result });
        } catch (error) {
            console.error('[background-gallery/upload] failed:', error);
            sendError(response, 500, error?.message || 'Upload failed.');
        }
    });

    app.post('/api/background-gallery/repair', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        if (!isActualAdminSession(sessionAccount)) {
            sendError(response, 403, 'Admin access required.');
            return;
        }
        const actor = getSessionActor(sessionAccount);
        const store = getStore();
        const userId = String(request.body?.userId || actor.actorUserId || '').trim();
        const items = await store.reconcileOrphanBackgroundGalleryUserFiles(userId, actor);
        await store.flushPendingWrites();
        response.json({ ok: true, items });
    });

    app.delete('/api/background-gallery/mine/:id', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const actor = getSessionActor(sessionAccount);
        const store = getStore();
        const result = await store.removeBackgroundGalleryUserItem(actor.actorUserId, request.params.id, actor);
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        await store.flushPendingWrites();
        response.json({ ok: true, ...result });
    });

    app.post('/api/background-gallery/catalog/promote', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        if (!isActualAdminSession(sessionAccount)) {
            sendError(response, 403, 'Admin access required.');
            return;
        }
        const actor = getSessionActor(sessionAccount);
        const result = await getStore().promoteBackgroundGalleryUserItem(request.body || {}, actor);
        if (result?.error) {
            sendError(response, result.status || 400, result.error);
            return;
        }
        response.json({ ok: true, ...result });
    });
}

module.exports = {
    registerBackgroundGalleryRoutes
};
