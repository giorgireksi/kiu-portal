function registerOrdersRoutes(app, deps = {}) {
    const {
        getActorUserId,
        getActualSessionRole,
        getStore,
        requireSessionAccount,
        sendError,
        pushEvent
    } = deps;

    app.get('/api/orders/recipient-filter-layout', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const facultyCode = String(request.query?.facultyCode || request.query?.faculty || '').trim();
        const recipientRole = String(request.query?.recipientRole || request.query?.role || '').trim();
        const result = store.getOrdersRecipientFilterLayout(facultyCode, recipientRole);
        response.json(result);
    });

    app.post('/api/orders/recipient-filter-layout', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualRole = typeof getActualSessionRole === 'function'
            ? getActualSessionRole(sessionAccount)
            : String(sessionAccount?.session?.actualRole || sessionAccount?.account?.role || '').trim().toLowerCase();
        const result = store.saveOrdersRecipientFilterLayout(
            request.body || {},
            getActorUserId(sessionAccount),
            actualRole
        );
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Recipient Orders filter layout could not be saved.');
            return;
        }
        if (typeof pushEvent === 'function') {
            pushEvent([getActorUserId(sessionAccount)], {
                type: 'orders:updated',
                emittedAt: new Date().toISOString()
            });
        }
        response.json(result);
    });
}

module.exports = {
    registerOrdersRoutes
};
