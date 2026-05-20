function registerPortalSupportRoutes(app, deps = {}) {
    const {
        addRouteAuditEvent,
        appOrigin,
        allowedCorsOrigins,
        getActorUserId,
        getSessionAccount,
        getSessionToken,
        getStore,
        getWebPushConfig,
        isActualAdminSession,
        pushEvent,
        registerSseClient,
        requireSessionAccount,
        resolveSessionBoundUserId,
        sendError,
        unregisterSseClient
    } = deps;

    app.get('/api/bootstrap', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.createApplicationBootstrap(getSessionToken(request)) });
    });

    app.get('/api/portal/bootstrap', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, ...store.createApplicationBootstrap(getSessionToken(request)) });
    });

    app.post('/api/portal/state', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const nextState = request.body?.state || {};
        const savedState = store.savePortalState(nextState);
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'portal',
            eventType: 'portal-state-saved',
            entityType: 'portal_state',
            entityId: 'global',
            afterState: {
                keys: Object.keys(savedState?.state && typeof savedState.state === 'object' ? savedState.state : {})
            }
        });
        response.json({ ok: true, saved: true, bootstrapStateKeys: Object.keys(savedState?.state && typeof savedState.state === 'object' ? savedState.state : {}) });
    });

    app.get('/api/me', (request, response) => {
        const store = getStore();
        const active = getSessionAccount(request);
        if (!active) {
            sendError(response, 401, 'Session not found.');
            return;
        }
        response.json({ ok: true, account: active.account, session: store.createClientSessionPayload(active.session) });
    });

    app.get('/api/events', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        if (!userId) {
            sendError(response, 400, 'userId is required.');
            return;
        }
        if (!registerSseClient(userId, response)) {
            sendError(response, 429, 'Too many live event streams are already open for this session.');
            return;
        }
        const origin = String(request.headers.origin || '').trim();
        response.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': origin && allowedCorsOrigins.has(origin) ? origin : appOrigin
        });
        response.write(`data: ${JSON.stringify({ type: 'hello', userId, emittedAt: new Date().toISOString() })}\n\n`);
        const timer = setInterval(() => {
            try {
                response.write(`: ping ${Date.now()}\n\n`);
            } catch (error) {
                clearInterval(timer);
            }
        }, 20000);
        request.on('close', () => {
            clearInterval(timer);
            unregisterSseClient(userId, response);
        });
    });

    app.get('/api/accounts', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const requestedEmail = String(request.query.email || '').trim();
        const requestedId = String(request.query.id || '').trim();
        const actualAdmin = isActualAdminSession(sessionAccount);
        const actorUserId = getActorUserId(sessionAccount);
        const actorEmail = String(sessionAccount.account?.email || '').trim().toLowerCase();
        if (actualAdmin) {
            const result = requestedEmail ? store.getAccountByEmail(requestedEmail) : requestedId ? store.getAccountById(requestedId) : null;
            const listing = store.listAccounts(request.query);
            response.json({ ok: true, account: result, accounts: result ? [result] : listing.items, total: listing.total });
            return;
        }
        const canViewSelf =
            (!requestedEmail && !requestedId)
            || requestedId === actorUserId
            || (requestedEmail && requestedEmail.toLowerCase() === actorEmail);
        if (!canViewSelf) {
            sendError(response, 403, 'You can only access your own account.');
            return;
        }
        const ownAccount = store.getAccountById(actorUserId);
        response.json({ ok: true, account: ownAccount, accounts: ownAccount ? [ownAccount] : [], total: ownAccount ? 1 : 0 });
    });

    app.post('/api/accounts/upsert', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualAdmin = isActualAdminSession(sessionAccount);
        const payload = request.body?.account || request.body || {};
        const payloadId = String(payload?.id || '').trim();
        const payloadEmail = String(payload?.email || '').trim().toLowerCase();
        const actorUserId = getActorUserId(sessionAccount);
        const actorEmail = String(sessionAccount.account?.email || '').trim().toLowerCase();
        if (!actualAdmin && ((payloadId && payloadId !== actorUserId) || (payloadEmail && payloadEmail !== actorEmail))) {
            sendError(response, 403, 'You can only update your own account.');
            return;
        }
        const account = store.upsertAccount(actualAdmin ? payload : {
            id: actorUserId,
            email: actorEmail,
            ...(payload || {})
        });
        if (!account) {
            sendError(response, 400, 'Invalid account payload.');
            return;
        }
        pushEvent([account.id], { type: 'account:upsert', account });
        response.json({ ok: true, account });
    });

    app.get('/api/notifications', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        response.json({ ok: true, ...store.listNotifications(userId, request.query) });
    });

    app.post('/api/notifications/read', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const notification = store.markNotificationRead(request.body?.notificationId, getActorUserId(sessionAccount));
        if (!notification) {
            sendError(response, 404, 'Notification not found.');
            return;
        }
        response.json({ ok: true, notification });
    });

    app.post('/api/notifications/preferences', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const preferences = store.updateNotificationPreferences(getActorUserId(sessionAccount), request.body?.preferences || request.body || {});
        if (!preferences) {
            sendError(response, 400, 'userId is required.');
            return;
        }
        response.json({ ok: true, preferences });
    });

    app.get('/api/push/public-config', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const config = getWebPushConfig();
        response.json({
            ok: true,
            supported: config.enabled,
            publicKey: config.enabled ? config.publicKey : '',
            contact: config.contact,
            generated: Boolean(config.generated)
        });
    });

    app.post('/api/push/subscribe', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const config = getWebPushConfig();
        if (!config.enabled) {
            sendError(response, 503, 'Web push is not configured.');
            return;
        }
        const subscription = store.upsertPushSubscription(getActorUserId(sessionAccount), request.body?.subscription || {}, {
            encoding: request.body?.encoding || '',
            userAgent: request.headers['user-agent'] || ''
        });
        if (!subscription) {
            sendError(response, 400, 'Invalid push subscription payload.');
            return;
        }
        response.json({ ok: true, subscription });
    });

    app.post('/api/push/unsubscribe', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const removed = store.removePushSubscription(getActorUserId(sessionAccount), request.body?.endpoint || '');
        response.json({ ok: true, removed: Boolean(removed) });
    });
}

module.exports = {
    registerPortalSupportRoutes
};
