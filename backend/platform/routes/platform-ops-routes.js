function registerPlatformOpsRoutes(app, deps = {}) {
    const {
        backendUrl,
        buildProductionReadinessStatus,
        buildRtcConfig,
        fs,
        getAntiCheatDownloadCatalog,
        getMicrosoftConfig,
        getMicrosoftMailConfig,
        getStore,
        requireActualSessionRole,
        requireSessionAccount,
        uploadsDir
    } = deps;

    app.get('/api/platform/config', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({
            ok: true,
            config: {
                ...store.getRuntimeConfig(),
                antiCheatDownloads: getAntiCheatDownloadCatalog()
            }
        });
    });

    app.get('/api/platform/status', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const store = getStore();
        const microsoftConfig = getMicrosoftConfig();
        const microsoftMailConfig = getMicrosoftMailConfig();
        response.json({
            ok: true,
            status: {
                ...store.getPlatformStatus(),
                backendUrl,
                uploadsReady: fs.existsSync(uploadsDir),
                microsoftReady: microsoftConfig.enabled,
                microsoftMailReady: microsoftMailConfig.enabled,
                turnConfigured: buildRtcConfig().iceServers.some(server => Array.isArray(server.urls) ? server.urls.some(Boolean) : Boolean(server.urls && String(server.urls).startsWith('turn')))
            }
        });
    });

    app.get('/api/platform/readiness', (request, response) => {
        const sessionAccount = requireActualSessionRole(request, response, new Set(['admin']));
        if (!sessionAccount) return;
        const readiness = buildProductionReadinessStatus();
        response.status(readiness.productionReady ? 200 : 503).json({
            ok: readiness.productionReady,
            readiness
        });
    });

    app.get('/api/platform/downloads', (request, response) => {
        response.json({ ok: true, downloads: getAntiCheatDownloadCatalog() });
    });
}

module.exports = {
    registerPlatformOpsRoutes
};
