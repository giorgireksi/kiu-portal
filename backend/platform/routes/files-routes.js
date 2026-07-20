function registerFileRoutes(app, deps = {}) {
    const {
        addRouteAuditEvent,
        fs,
        getSessionActor,
        getStore,
        requireSessionAccount,
        sendError
    } = deps;

    app.post('/api/files/upload', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const actor = getSessionActor(sessionAccount);
            const store = getStore();
            const file = store.createFileFromUpload({
                ...(request.body || {}),
                ownerUserId: actor.actorUserId
            });
            if (!file) {
                sendError(response, 400, 'Invalid file payload.');
                return;
            }
            addRouteAuditEvent(request, sessionAccount, {
                eventDomain: 'files',
                eventType: 'file-uploaded',
                entityType: 'file',
                entityId: String(file.id || '').trim(),
                afterState: {
                    id: file.id,
                    name: file.name,
                    ownerUserId: file.ownerUserId,
                    size: file.size,
                    scope: file.scope
                }
            });
            response.json({ ok: true, file });
        } catch (error) {
            console.error('[files/upload] failed:', error);
            sendError(response, 500, error?.message || 'Internal error uploading file.');
        }
    });

    app.get('/api/files/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const actor = getSessionActor(sessionAccount);
        const store = getStore();
        const file = store.getFile(request.params.id);
        if (!file || !file.path || !fs.existsSync(file.path)) {
            sendError(response, 404, 'File not found.');
            return;
        }
        if (!store.canActorAccessStoredFile(file.id, actor.actorUserId, actor.actorRole)) {
            sendError(response, 403, 'You are not allowed to access this file.');
            return;
        }
        const mimeType = String(file.type || 'application/octet-stream').trim() || 'application/octet-stream';
        response.setHeader('Content-Type', mimeType);
        response.setHeader('Content-Length', fs.statSync(file.path).size);
        const queryInline = String(request.query?.inline || '').trim() === '1'
            || String(request.query?.view || '').trim() === '1'
            || String(request.query?.view || '').trim().toLowerCase() === 'inline';
        const isImage = mimeType.toLowerCase().startsWith('image/');
        const inline = queryInline || isImage;
        const safeName = encodeURIComponent(String(file.name || 'download.bin').replace(/"/g, ''));
        response.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`);
        response.setHeader('Cache-Control', 'private, max-age=3600');
        fs.createReadStream(file.path).pipe(response);
    });
}

module.exports = {
    registerFileRoutes
};
