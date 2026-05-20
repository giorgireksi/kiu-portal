function registerMicrosoftAuthRoutes(app, deps = {}) {
    const {
        buildMicrosoftPortalRedirect,
        crypto,
        decodeJwtPayload,
        exchangeMicrosoftAuthorizationCode,
        fetchMicrosoftProfile,
        getMicrosoftConfig,
        getStore,
        normalizeMicrosoftReturnTo,
        sendError
    } = deps;

    app.get('/api/portal/microsoft/config', (request, response) => {
        const config = getMicrosoftConfig();
        response.json({
            ok: true,
            enabled: config.enabled,
            tenantId: config.tenantId,
            clientId: config.clientId,
            redirectUri: config.redirectUri,
            scope: config.scope
        });
    });

    app.get('/api/portal/microsoft/start', (request, response) => {
        const store = getStore();
        const config = getMicrosoftConfig();
        if (!config.enabled) {
            sendError(response, 503, 'Microsoft sign-in is not configured.');
            return;
        }
        const returnTo = normalizeMicrosoftReturnTo(request.query.returnTo || '');
        const oauthState = store.createMicrosoftOauthState({
            state: crypto.randomBytes(16).toString('hex'),
            returnTo
        });
        if (!oauthState?.state) {
            sendError(response, 500, 'Microsoft sign-in state could not be created.');
            return;
        }
        const authorizeUrl = new URL(config.authorizeEndpoint);
        authorizeUrl.searchParams.set('client_id', config.clientId);
        authorizeUrl.searchParams.set('response_type', 'code');
        authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
        authorizeUrl.searchParams.set('response_mode', 'query');
        authorizeUrl.searchParams.set('scope', config.scope);
        authorizeUrl.searchParams.set('state', oauthState.state);
        response.json({
            ok: true,
            authorizeUrl: authorizeUrl.toString(),
            returnTo
        });
    });

    app.post('/api/portal/microsoft/complete', (request, response) => {
        const store = getStore();
        const handoff = String(request.body?.handoff || '').trim();
        if (!handoff) {
            sendError(response, 400, 'Microsoft sign-in completion handoff is required.');
            return;
        }
        const completion = store.consumeMicrosoftLoginCompletion(handoff);
        if (!completion?.sessionToken) {
            sendError(response, 404, 'Microsoft sign-in completion is missing or expired.');
            return;
        }
        const session = store.getSession(completion.sessionToken);
        const account = session ? store.getAccountById(session.userId) : null;
        if (!session || !account) {
            sendError(response, 410, 'Microsoft sign-in completion is no longer valid.');
            return;
        }
        response.json({
            ok: true,
            session: store.createClientSessionPayload(session, { includeToken: true }),
            account,
            email: completion.email || ''
        });
    });

    app.get('/api/portal/microsoft/callback', (request, response) => {
        const store = getStore();
        const config = getMicrosoftConfig();
        const oauthState = store.consumeMicrosoftOauthState(request.query.state || '');
        const returnTo = oauthState?.returnTo || '';
        if (!config.enabled) {
            response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                microsoft_status: 'error',
                microsoft_error: 'Microsoft sign-in is not configured.'
            }));
            return;
        }
        if (!oauthState) {
            response.redirect(buildMicrosoftPortalRedirect('', {
                microsoft_status: 'error',
                microsoft_error: 'Microsoft sign-in session is missing or expired.'
            }));
            return;
        }
        const providerError = String(request.query.error || '').trim();
        if (providerError) {
            response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                microsoft_status: 'error',
                microsoft_error: String(request.query.error_description || providerError).trim() || 'Microsoft sign-in was cancelled.'
            }));
            return;
        }
        const code = String(request.query.code || '').trim();
        if (!code) {
            response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                microsoft_status: 'error',
                microsoft_error: 'Microsoft sign-in did not return an authorization code.'
            }));
            return;
        }
        (async () => {
            try {
                const tokenPayload = await exchangeMicrosoftAuthorizationCode(config, code);
                const idClaims = decodeJwtPayload(tokenPayload.id_token || '') || {};
                let graphProfile = null;
                try {
                    graphProfile = await fetchMicrosoftProfile(config, tokenPayload.access_token);
                } catch (error) {
                    graphProfile = null;
                }
                const microsoftEmail = String(
                    graphProfile?.mail
                    || graphProfile?.userPrincipalName
                    || idClaims.email
                    || idClaims.preferred_username
                    || ''
                ).trim().toLowerCase();
                const microsoftIdentity = {
                    oid: String(graphProfile?.id || idClaims.oid || idClaims.sub || '').trim(),
                    tenantId: String(idClaims.tid || '').trim(),
                    email: microsoftEmail,
                    displayName: String(graphProfile?.displayName || idClaims.name || '').trim()
                };
                if (!microsoftIdentity.oid || !microsoftIdentity.email) {
                    response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                        microsoft_status: 'error',
                        microsoft_error: 'Microsoft identity details were incomplete.'
                    }));
                    return;
                }
                const loginResult = store.createSessionByMicrosoftIdentity(microsoftIdentity);
                if (loginResult?.reason === 'unlinked') {
                    response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                        microsoft_status: 'unlinked',
                        microsoft_email: microsoftIdentity.email
                    }));
                    return;
                }
                if (loginResult?.error || !loginResult?.session?.token) {
                    response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                        microsoft_status: 'error',
                        microsoft_error: loginResult?.error || 'Microsoft sign-in could not create a portal session.'
                    }));
                    return;
                }
                const completion = store.createMicrosoftLoginCompletion({
                    handoff: crypto.randomBytes(16).toString('hex'),
                    sessionToken: loginResult.session.token,
                    email: microsoftIdentity.email
                });
                if (!completion?.handoff) {
                    response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                        microsoft_status: 'error',
                        microsoft_error: 'Microsoft sign-in completion could not be created.'
                    }));
                    return;
                }
                response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                    microsoft_status: 'success',
                    microsoft_handoff: completion.handoff,
                    microsoft_email: microsoftIdentity.email
                }));
            } catch (error) {
                response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                    microsoft_status: 'error',
                    microsoft_error: error?.message || 'Microsoft sign-in failed.'
                }));
            }
        })().catch(error => {
            response.redirect(buildMicrosoftPortalRedirect(returnTo, {
                microsoft_status: 'error',
                microsoft_error: error?.message || 'Microsoft sign-in failed.'
            }));
        });
    });
}

module.exports = {
    registerMicrosoftAuthRoutes
};
