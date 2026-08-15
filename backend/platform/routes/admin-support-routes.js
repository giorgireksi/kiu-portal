function registerAdminSupportRoutes(app, deps = {}) {
    const {
        adminRoles,
        getSessionActor,
        getStore,
        requireActualSessionRole,
        requireSessionAccount,
        sendError
    } = deps;

    app.get('/api/audit/events', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, adminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.listAuditEvents(request.query) });
    });

    app.post('/api/audit/events', (request, response) => {
        // Client annotations are submitted by authenticated users; the GET
        // audit feed remains administrator-only. The session actor is always
        // authoritative, so clients cannot impersonate another auditor.
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const submitted = request.body?.event || request.body || {};
        const actor = getSessionActor(sessionAccount);
        const event = store.addAuditEvent({
            actorUserId: actor.actorUserId,
            actorRole: actor.actorRole,
            eventDomain: 'client-annotation',
            eventType: 'annotation-recorded',
            entityType: 'client_annotation',
            entityId: String(submitted.entityId || submitted.requestId || actor.actorUserId || 'annotation').trim(),
            afterState: {
                annotation: {
                    requestedDomain: String(submitted.eventDomain || submitted.domain || '').trim(),
                    requestedType: String(submitted.eventType || submitted.type || '').trim(),
                    requestedEntityType: String(submitted.entityType || '').trim(),
                    requestedEntityId: String(submitted.entityId || '').trim(),
                    sourceSystem: String(submitted.sourceSystem || 'portal').trim(),
                    beforeState: Object.prototype.hasOwnProperty.call(submitted, 'beforeState') ? submitted.beforeState : null,
                    afterState: Object.prototype.hasOwnProperty.call(submitted, 'afterState') ? submitted.afterState : null,
                    note: String(submitted.note || submitted.message || '').trim()
                }
            },
            sourceSystem: 'client-annotation',
            requestId: String(request.headers['x-request-id'] || '').trim(),
            ipAddress: String(request.headers['x-forwarded-for'] || '').split(',')[0].trim() || String(request.socket?.remoteAddress || request.ip || '').trim()
        });
        response.json({ ok: true, event });
    });

    app.post('/api/admin/holds', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin', 'student_service']));
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, hold: store.upsertHold(request.body || {}) });
    });

    app.post('/api/admin/sections', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin', 'student_service']));
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, section: store.upsertSection(request.body || {}) });
    });

    app.post('/api/admin/import-jobs', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, adminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        const importJob = store.createImportJob({
            ...(request.body || {}),
            requestedByUserId: request.body?.requestedByUserId || getSessionActor(sessionAccount).actorUserId
        });
        response.json({ ok: true, importJob });
    });

    app.get('/api/admin/import-jobs/:id', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, adminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        const importJob = store.getImportJob(request.params.id);
        if (!importJob) {
            sendError(response, 404, 'Import job not found.');
            return;
        }
        response.json({ ok: true, importJob });
    });
}

module.exports = {
    registerAdminSupportRoutes
};
