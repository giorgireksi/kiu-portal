/* Peeled from assets/js/app/app.js (Wave 21 portal API/UI stubs). Load before app.js. */
(function initPortalApiStubsRuntime() {
    'use strict';
    if (window.__KIU_PORTAL_API_STUBS_LOADED) return;
    window.__KIU_PORTAL_API_STUBS_LOADED = true;

    window.__kiuCreatePortalApiStubsApi = function createKiuPortalApiStubsApi(deps) {
        void deps;
        const noop = () => null;
        const fallbackPromise = Promise.resolve(null);
        const asyncNoop = () => fallbackPromise;
        const asyncArray = () => Promise.resolve([]);
        const asyncNull = () => Promise.resolve(null);
        const asyncGalleryUploadStub = () => Promise.reject(
            new Error('Gallery upload API not loaded — hard refresh the page.')
        );
        const portalUiNoop = () => null;
        portalUiNoop.__kiuFallback = true;

        const stubs = {
            schedulePortalBackendBootstrap: noop,
            queuePortalStateSync: noop,
            syncPortalBackendImpersonation: asyncNoop,
            fetchPortalPlatformStatus: asyncNull,
            fetchPortalIntegrationSystems: asyncArray,
            fetchPortalSyncRuns: asyncArray,
            fetchPortalSyncConflicts: asyncArray,
            fetchPortalAuditEvents: asyncArray,
            createPortalAuditEvent: asyncNoop,
            createPortalSyncRun: asyncNoop,
            createPortalSyncConflict: asyncNoop,
            recordPortalAudit: asyncNoop,
            recordPortalSyncRun: asyncNoop,
            recordPortalSyncConflict: asyncNoop,
            uploadPortalStoredFile: asyncNull,
            uploadBackgroundGalleryAsset: asyncGalleryUploadStub,
            getPortalStoredFileUrl: () => '',
            getPortalRtcConfiguration: () => null,
            applyPortalSocialState: noop,
            persistPortalSocialState: asyncNull,
            queuePortalSocialSync: noop,
            bootstrapPortalSocialState: asyncNull,
            schedulePortalSocialBootstrap: noop,
            ensurePortalSocialGroupChatRecord: asyncNull,
            renderPortalNotificationChrome: portalUiNoop,
            openPortalNotificationFullModal: portalUiNoop,
            openPortalMessengerFullModal: portalUiNoop,
            openSocialMessengerWorkspace: portalUiNoop
        };

        Object.keys(stubs).forEach(function (key) {
            if (typeof window[key] !== 'function') window[key] = stubs[key];
        });

        if (typeof window.getNotificationSnapshot !== 'function') {
            const fallbackNotificationSnapshot = () => ({ unread: 0, items: [] });
            fallbackNotificationSnapshot.__kiuFallback = true;
            window['getNotificationSnapshot'] = fallbackNotificationSnapshot;
            stubs.getNotificationSnapshot = fallbackNotificationSnapshot;
        }
        if (typeof window.getMessengerSnapshot !== 'function') {
            const fallbackMessengerSnapshot = () => ({ unread: 0, recent: [] });
            fallbackMessengerSnapshot.__kiuFallback = true;
            window['getMessengerSnapshot'] = fallbackMessengerSnapshot;
            stubs.getMessengerSnapshot = fallbackMessengerSnapshot;
        }
        if (typeof window.getPublicSocialDisplayName !== 'function') {
            stubs.getPublicSocialDisplayName = function getPublicSocialDisplayNameFallback(user) {
                if (!user) return 'Portal User';
                const rawName = user.nameEn || user.name || user.email || user.id || 'Portal User';
                if (typeof cleanupEncodingArtifacts === 'function' && typeof toEnglishText === 'function') {
                    return cleanupEncodingArtifacts(toEnglishText(rawName));
                }
                return String(rawName);
            };
            window['getPublicSocialDisplayName'] = stubs.getPublicSocialDisplayName;
        }

        window.KiuPortalApiStubs = Object.assign(window.KiuPortalApiStubs || {}, stubs);
        return stubs;
    };

    window.__kiuCreatePortalApiStubsApi({});
})();
