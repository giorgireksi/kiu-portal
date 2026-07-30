function registerChancelleryRoutes(app, deps = {}) {
    const {
        getActorUserId,
        getActualSessionRole,
        getStore,
        requireSessionAccount,
        sendError
    } = deps;

    app.get('/api/chancellery/document-template', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const facultyCode = String(request.query?.facultyCode || request.query?.faculty || '').trim();
        const result = store.getChancelleryDocumentTemplate(facultyCode);
        response.json(result);
    });

    app.post('/api/chancellery/document-template', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualRole = typeof getActualSessionRole === 'function'
            ? getActualSessionRole(sessionAccount)
            : String(sessionAccount?.session?.actualRole || sessionAccount?.account?.role || '').trim().toLowerCase();
        const result = store.saveChancelleryDocumentTemplate(
            request.body || {},
            getActorUserId(sessionAccount),
            actualRole
        );
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Appeal document could not be saved.');
            return;
        }
        response.json(result);
    });

    // Legacy filter-layout endpoints kept for older clients; layouts are empty (custom filters removed).
    app.get('/api/chancellery/filter-layout', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const facultyCode = String(request.query?.facultyCode || request.query?.faculty || '').trim();
        const recipientRole = String(request.query?.recipientRole || request.query?.role || '').trim();
        const result = store.getChancelleryFilterLayout(facultyCode, recipientRole);
        response.json(result);
    });

    app.post('/api/chancellery/filter-layout', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        sendError(response, 410, 'E-Chancellery custom filters were removed. Use the appeal document template instead.');
    });
}

module.exports = {
    registerChancelleryRoutes
};
