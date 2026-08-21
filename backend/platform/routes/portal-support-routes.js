const DIRECTORY_ACCOUNT_FIELDS = [
    'id',
    'email',
    'name',
    'nameEn',
    'displayName',
    'role',
    'faculty',
    'facultyCode',
    'avatar',
    'photo',
    'accountStatus',
    'status',
    'interests',
    'online',
    'lastSeenAt',
    'presenceLabel'
];

function toDirectoryAccount(account) {
    return DIRECTORY_ACCOUNT_FIELDS.reduce((result, field) => {
        if (account && Object.prototype.hasOwnProperty.call(account, field)) {
            result[field] = account[field];
        }
        return result;
    }, {});
}

function registerPortalSupportRoutes(app, deps = {}) {
    const {
        addRouteAuditEvent,
        appOrigin,
        allowedCorsOrigins,
        broadcastAll,
        buildSelfServiceAccountPayload,
        getActorUserId,
        getSessionAccount,
        getSessionRole,
        getSessionToken,
        getStore,
        getWebPushConfig,
        isActualAdminSession,
        isSessionImpersonating,
        pushEvent,
        registerSseClient,
        requireSessionAccount,
        resolveSessionBoundUserId,
        sendError,
        unregisterSseClient
    } = deps;

    app.get('/api/bootstrap', async (request, response) => {
        try {
            const sessionAccount = requireSessionAccount(request, response);
            if (!sessionAccount) return;
            const store = getStore();
            if (!store) {
                sendError(response, 503, 'Platform store is not ready.');
                return;
            }
            response.json({ ok: true, ...store.createApplicationBootstrap(getSessionToken(request)) });
        } catch (error) {
            sendError(response, 500, 'Failed to load portal bootstrap.');
        }
    });

    app.get('/api/portal/bootstrap', async (request, response) => {
        try {
            const sessionAccount = requireSessionAccount(request, response);
            if (!sessionAccount) return;
            const store = getStore();
            if (!store) {
                sendError(response, 503, 'Platform store is not ready.');
                return;
            }
            response.json({ ok: true, ...store.createApplicationBootstrap(getSessionToken(request)) });
        } catch (error) {
            sendError(response, 500, 'Failed to load portal bootstrap.');
        }
    });

    app.get('/api/portal/theme', async (request, response) => {
        try {
            const sessionAccount = requireSessionAccount(request, response);
            if (!sessionAccount) return;
            const store = getStore();
            if (!store) {
                sendError(response, 503, 'Platform store is not ready.');
                return;
            }
            response.json({ ok: true, ...store.createPortalThemeBootstrap(getSessionToken(request)) });
        } catch (error) {
            sendError(response, 500, 'Failed to load portal theme.');
        }
    });

    app.post('/api/portal/state', async (request, response) => {
        try {
            const sessionAccount = requireSessionAccount(request, response);
            if (!sessionAccount) return;
            const store = getStore();
            if (!store) {
                sendError(response, 503, 'Platform store is not ready.');
                return;
            }
            const nextState = request.body?.state || {};
            const allowGlobalWrite = isActualAdminSession(sessionAccount)
                && !(typeof isSessionImpersonating === 'function' && isSessionImpersonating(sessionAccount));
            const actorUserId = getActorUserId(sessionAccount);
            const savedState = store.savePortalState(nextState, {
                actorUserId,
                effectiveRole: typeof getSessionRole === 'function' ? getSessionRole(sessionAccount) : '',
                allowGlobalWrite
            });
            await store.flushPendingWrites();
            // Live-push: notify other open sessions to re-pull the shared state.
            // ponytail: coarse — every save pings all clients; scope to changed shared keys / per-faculty rooms if load matters.
            // sessionToken lets each client ignore its OWN save's echo, breaking the
            // self-re-bootstrap loop that overwrote freshly created records with a
            // stale snapshot (registration/creation data loss). Other tabs/sessions
            // (different token) still re-sync.
            if (typeof broadcastAll === 'function') {
                broadcastAll({
                    type: 'portal:state-upsert',
                    emittedAt: new Date().toISOString(),
                    sessionToken: String(sessionAccount?.token || '').trim()
                });
            }
            if (typeof store.addAuditEvent === 'function') {
                const actorUserId = typeof getActorUserId === 'function' ? getActorUserId(sessionAccount) : '';
                const actorRole = typeof getSessionRole === 'function' ? getSessionRole(sessionAccount) : '';
                store.addAuditEvent({
                    actorUserId,
                    actorRole,
                    eventDomain: 'portal',
                    eventType: 'portal-state-saved',
                    entityType: 'portal_state',
                    entityId: 'global',
                    afterState: {
                        keys: Object.keys(savedState?.state && typeof savedState.state === 'object' ? savedState.state : {})
                    }
                }, { skipPersist: true });
            }
            response.json({ ok: true, saved: true, bootstrapStateKeys: Object.keys(savedState?.state && typeof savedState.state === 'object' ? savedState.state : {}), droppedKeys: Array.isArray(savedState?.droppedKeys) ? savedState.droppedKeys : [] });
        } catch (error) {
            if (Number(error?.statusCode) === 400) {
                sendError(response, 400, error.message || 'Invalid portal state.');
                return;
            }
            sendError(response, 500, 'Failed to save portal state.');
        }
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
            const result = requestedEmail
                ? store.getAccountByEmail(requestedEmail)
                : requestedId
                    ? store.getAccountById(requestedId, { allowDemo: true })
                    : null;
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

    app.get('/api/accounts/directory', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const facultyCode = String(
            sessionAccount.account?.facultyCode
                || sessionAccount.account?.faculty
                || sessionAccount.session?.faculty
                || ''
        ).trim();
        const hasIds = String(request.query?.ids || '').trim().length > 0;
        const requestedScope = String(request.query?.scope || '').trim().toLowerCase();
        const campusScope = requestedScope === 'campus' || requestedScope === 'social';
        const query = {
            ...request.query,
            ...(campusScope || facultyCode || hasIds ? {} : { facultyCode: '__no_faculty_scope__' }),
            ...(campusScope || hasIds ? {} : (facultyCode ? { facultyCode } : {}))
        };
        const listing = String(request.query?.scope || '').trim().toLowerCase() === 'social'
            ? store.listSocialAccounts(query)
            : store.listAccounts(query);
        response.json({
            ok: true,
            ...listing,
            items: listing.items.map(toDirectoryAccount)
        });
    });

    app.post('/api/accounts/upsert', async (request, response) => {
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
        const account = store.upsertAccount(
            actualAdmin ? payload : buildSelfServiceAccountPayload(payload, sessionAccount),
            { allowAccountStatusChange: request.body?.allowAccountStatusChange === true }
        );
        if (!account) {
            sendError(response, 400, 'Invalid account payload.');
            return;
        }
        await store.flushPendingWrites();
        pushEvent([account.id], { type: 'account:upsert', account });
        // Directory/profile edits also update portal.state mirrors in the account
        // service. Tell other sessions to pull the same authoritative snapshot;
        // the originating token is ignored by the browser to avoid self-echo loss.
        const shouldBroadcastPortalState = request.body?.syncPortalState === true;
        if (shouldBroadcastPortalState && typeof broadcastAll === 'function') {
            broadcastAll({
                type: 'portal:state-upsert',
                emittedAt: new Date().toISOString(),
                sessionToken: String(sessionAccount?.token || '').trim()
            });
        }
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

    app.post('/api/notifications/delete', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const deleted = store.deleteNotification(request.body?.notificationId, getActorUserId(sessionAccount));
        if (!deleted) {
            sendError(response, 404, 'Notification not found.');
            return;
        }
        response.json({ ok: true, deleted: true });
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

    app.post('/api/mobile/push/register', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const token = store.upsertMobilePushToken(getActorUserId(sessionAccount), request.body?.token, {
            platform: request.body?.platform || 'android',
            appVersion: request.body?.appVersion || '',
            deviceModel: request.body?.deviceModel || '',
            userAgent: request.headers['user-agent'] || ''
        });
        if (!token) {
            sendError(response, 400, 'Invalid mobile push token.');
            return;
        }
        response.json({ ok: true, token: { id: token.id, platform: token.platform, updatedAt: token.updatedAt } });
    });

    app.post('/api/mobile/push/unregister', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const removed = store.removeMobilePushToken(getActorUserId(sessionAccount), request.body?.token);
        response.json({ ok: true, removed: Boolean(removed) });
    });
}

module.exports = {
    registerPortalSupportRoutes
};
