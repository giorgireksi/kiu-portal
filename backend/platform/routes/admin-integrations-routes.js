function registerAdminIntegrationsRoutes(app, deps = {}) {
    const {
        addRouteAuditEvent,
        broadcastAll,
        getActorUserId,
        getStore,
        integrationAdminRoles,
        pushEvent,
        requireActualSessionRole,
        requireSessionAccount,
        sendError
    } = deps;

    app.get('/api/admin/accounts', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.listAccounts(request.query) });
    });

    app.post('/api/admin/accounts', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        const account = store.upsertAccount(request.body || {});
        if (!account) {
            sendError(response, 400, 'Invalid account payload.');
            return;
        }
        pushEvent([account.id], { type: 'account:upsert', account });
        response.json({ ok: true, account });
    });

    app.post('/api/admin/accounts/:id/privileges', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        if (!store.accountHasPrivilege(actorUserId, 'manage_privileges')) {
            sendError(response, 403, 'Only administrators or delegated privilege managers may update privileges.');
            return;
        }
        const result = store.updateAccountPrivileges(request.params.id, request.body || {}, actorUserId);
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Privileges could not be updated.');
            return;
        }
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'accounts',
            eventType: 'account-privileges-updated',
            entityType: 'account',
            entityId: String(result.id || request.params.id || '').trim(),
            afterState: {
                accountId: String(result.id || request.params.id || '').trim(),
                grantedPrivileges: Array.isArray(result.grantedPrivileges) ? result.grantedPrivileges : []
            }
        });
        pushEvent([result.id], { type: 'account:upsert', account: result });
        broadcastAll({ type: 'accounts:privileges-updated', emittedAt: new Date().toISOString() });
        response.json({ ok: true, account: result });
    });

    app.post('/api/admin/reset-platform-state', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        const bootstrap = store.resetPlatformState({
            preserveAdmin: request.body?.preserveAdmin !== false
        });
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'platform',
            eventType: 'platform-state-reset',
            entityType: 'platform_state',
            entityId: 'global',
            afterState: {
                preserveAdmin: request.body?.preserveAdmin !== false,
                accountCount: Array.isArray(bootstrap?.accounts) ? bootstrap.accounts.length : 0
            }
        });
        const emittedAt = new Date().toISOString();
        broadcastAll({ type: 'portal:state-reset', emittedAt });
        broadcastAll({ type: 'portal:state-upsert', emittedAt });
        broadcastAll({ type: 'social:state-upsert', emittedAt });
        response.json({
            ok: true,
            requiresRelogin: true,
            bootstrap
        });
    });

    app.get('/api/admin/people', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, people: Object.values(store.state.people) });
    });

    app.post('/api/admin/people', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        const person = request.body || {};
        const id = String(person.id || '').trim();
        if (!id) {
            sendError(response, 400, 'Person id is required.');
            return;
        }
        store.state.people[id] = { ...(store.state.people[id] || {}), ...person, id, updatedAt: new Date().toISOString() };
        store.save();
        response.json({ ok: true, person: store.state.people[id] });
    });

    app.get('/api/integrations/systems', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, integrationAdminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, systems: store.listIntegrationSystems() });
    });

    app.post('/api/integrations/systems', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, integrationAdminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        const system = store.upsertIntegrationSystem(request.body?.system || request.body || {});
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'integrations',
            eventType: 'system-upserted',
            entityType: 'external_system',
            entityId: String(system?.systemCode || request.body?.systemCode || request.body?.code || '').trim(),
            afterState: system
        });
        response.json({ ok: true, system });
    });

    app.get('/api/integrations/sync-runs', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, integrationAdminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.listSyncRuns(request.query) });
    });

    app.post('/api/integrations/sync-runs', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, integrationAdminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        const syncRun = store.addSyncRun(request.body?.syncRun || request.body || {});
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'integrations',
            eventType: 'sync-run-created',
            entityType: 'sync_run',
            entityId: String(syncRun?.id || '').trim(),
            afterState: syncRun
        });
        response.json({ ok: true, syncRun });
    });

    app.get('/api/integrations/conflicts', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, integrationAdminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.listSyncConflicts(request.query) });
    });

    app.post('/api/integrations/conflicts', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, integrationAdminRoles);
        if (!sessionAccount) return;
        const store = getStore();
        const conflict = store.addSyncConflict(request.body?.conflict || request.body || {});
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'integrations',
            eventType: 'sync-conflict-upserted',
            entityType: 'sync_conflict',
            entityId: String(conflict?.id || '').trim(),
            afterState: conflict
        });
        response.json({ ok: true, conflict });
    });
}

module.exports = {
    registerAdminIntegrationsRoutes
};
