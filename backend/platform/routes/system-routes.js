function registerSystemRoutes(app, deps = {}) {
    const {
        buildProductionReadinessStatus,
        detectDownloadPlatformFromRequest,
        enforceRateLimit,
        getAntiCheatDownloadCatalog,
        normalizeDownloadPlatformKey,
        renderAntiCheatDownloadPage,
        resolveAntiCheatDownload,
        resolveRequestedDownloadPlatform,
        sendAntiCheatDownloadFile,
        sendError,
        socialPinApiVersion,
        studentServiceApiManifestVersion
    } = deps;

    app.get('/download', (request, response) => {
        const platformKey = resolveRequestedDownloadPlatform(request);
        const download = resolveAntiCheatDownload(platformKey);
        if (String(request.query.file || '').trim() === '1' || String(request.query.raw || '').trim() === '1') {
            sendAntiCheatDownloadFile(response, download, platformKey);
            return;
        }
        response.type('html').send(renderAntiCheatDownloadPage({
            selectedPlatform: platformKey,
            selectedDownload: download
        }));
    });

    app.get('/download/file', (request, response) => {
        const platformKey = resolveRequestedDownloadPlatform(request);
        const download = resolveAntiCheatDownload(platformKey);
        sendAntiCheatDownloadFile(response, download, platformKey);
    });

    app.get('/download/:platform', (request, response) => {
        const platformKey = normalizeDownloadPlatformKey(request.params.platform || '');
        if (!platformKey) {
            sendError(response, 404, 'Unsupported anti-cheat platform.');
            return;
        }
        const download = resolveAntiCheatDownload(platformKey);
        if (String(request.query.file || '').trim() === '1' || String(request.query.raw || '').trim() === '1') {
            sendAntiCheatDownloadFile(response, download, platformKey);
            return;
        }
        response.type('html').send(renderAntiCheatDownloadPage({
            selectedPlatform: platformKey,
            selectedDownload: download
        }));
    });

    app.get('/download/:platform/file', (request, response) => {
        const platformKey = normalizeDownloadPlatformKey(request.params.platform || '');
        if (!platformKey) {
            sendError(response, 404, 'Unsupported anti-cheat platform.');
            return;
        }
        const download = resolveAntiCheatDownload(platformKey);
        sendAntiCheatDownloadFile(response, download, platformKey);
    });

    app.get('/health', (request, response) => {
        response.json({
            ok: true,
            status: 'ready',
            backend: 'kiu-platform-server',
            studentServiceApiManifestVersion,
            socialPinApiVersion
        });
    });

    app.get('/ready', (request, response) => {
        const readiness = buildProductionReadinessStatus();
        response.status(readiness.productionReady ? 200 : 503).json({
            ok: readiness.productionReady,
            status: readiness.productionReady ? 'ready' : 'degraded'
        });
    });

}

module.exports = {
    registerSystemRoutes
};
