function registerMailRoutes(app, deps = {}) {
    const {
        backEndUrl,
        buildGraphSendAttachments,
        buildMailAuditEvent,
        buildMailPortalRedirect,
        crypto,
        decodeJwtPayload,
        fetchMicrosoftGraphBinary,
        fetchMicrosoftGraphJson,
        fetchMicrosoftMailMessage,
        fetchMicrosoftProfile,
        getBootstrapMailFolderMessages,
        getMicrosoftMailAccess,
        getMicrosoftMailConfig,
        getSessionRole,
        getStore,
        pushEvent,
        normalizeMailReturnTo,
        requireSessionAccount,
        sendError,
        splitMicrosoftScope,
        syncMailboxCacheForUser,
        exchangeMicrosoftAuthorizationCode,
        uniqueStrings
    } = deps;

    function emitMailUpdated(userId) {
        if (typeof pushEvent !== 'function' || !userId) return;
        pushEvent([userId], { type: 'mail:updated', emittedAt: new Date().toISOString() });
    }

    app.get('/api/mail/bootstrap', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const effectiveRole = getSessionRole(sessionAccount);
        const microsoftMailConfig = getMicrosoftMailConfig();
        response.json({
            ok: true,
            mailboxOwnerUserId: actualUserId,
            actualRole: String(sessionAccount.account?.role || '').trim().toLowerCase(),
            effectiveRole,
            outlookConfigured: microsoftMailConfig.enabled === true,
            impersonationNotice: String(sessionAccount.account?.role || '').trim().toLowerCase() === 'admin' && effectiveRole !== 'admin'
                ? 'Email stays connected to your own administrator mailbox while role impersonation is active.'
                : '',
            ...store.createMailBootstrap(actualUserId)
        });
    });

    app.get('/api/mail/connect/start', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const config = getMicrosoftMailConfig();
        if (!config.enabled) {
            sendError(response, 503, 'Outlook mail integration is not configured.');
            return;
        }
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const returnTo = normalizeMailReturnTo(request.query.returnTo || '');
        const oauthState = store.createMailOauthState({
            state: crypto.randomBytes(16).toString('hex'),
            userId: actualUserId,
            returnTo,
            returnPage: 'email'
        });
        if (!oauthState?.state) {
            sendError(response, 500, 'Mail connect session could not be created.');
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

    app.get('/api/mail/connect/callback', (request, response) => {
        const store = getStore();
        const config = getMicrosoftMailConfig();
        const oauthState = store.consumeMailOauthState(request.query.state || '');
        const returnTo = oauthState?.returnTo || '';
        if (!config.enabled) {
            response.redirect(buildMailPortalRedirect(returnTo, {
                mail_status: 'error',
                mail_error: 'Outlook mail integration is not configured.'
            }));
            return;
        }
        if (!oauthState?.userId) {
            response.redirect(buildMailPortalRedirect('', {
                mail_status: 'error',
                mail_error: 'Outlook mailbox connection session is missing or expired.'
            }));
            return;
        }
        const providerError = String(request.query.error || '').trim();
        if (providerError) {
            response.redirect(buildMailPortalRedirect(returnTo, {
                mail_status: 'error',
                mail_error: String(request.query.error_description || providerError).trim() || 'Outlook mailbox connection was cancelled.'
            }));
            return;
        }
        const code = String(request.query.code || '').trim();
        if (!code) {
            response.redirect(buildMailPortalRedirect(returnTo, {
                mail_status: 'error',
                mail_error: 'Outlook mailbox connection did not return an authorization code.'
            }));
            return;
        }
        (async () => {
            try {
                const tokenPayload = await exchangeMicrosoftAuthorizationCode(config, code);
                if (!String(tokenPayload.refresh_token || '').trim()) {
                    response.redirect(buildMailPortalRedirect(returnTo, {
                        mail_status: 'error',
                        mail_error: 'Outlook mailbox consent did not return a refresh token.'
                    }));
                    return;
                }
                const idClaims = decodeJwtPayload(tokenPayload.id_token || '') || {};
                let graphProfile = null;
                try {
                    graphProfile = await fetchMicrosoftProfile({
                        ...config,
                        graphMeEndpoint: `${config.graphBaseUrl}/me?$select=id,displayName,mail,userPrincipalName`
                    }, tokenPayload.access_token);
                } catch (error) {
                    graphProfile = null;
                }
                const mailboxAddress = String(
                    graphProfile?.mail
                    || graphProfile?.userPrincipalName
                    || idClaims.email
                    || idClaims.preferred_username
                    || ''
                ).trim().toLowerCase();
                const mailboxDisplayName = String(graphProfile?.displayName || idClaims.name || '').trim();
                if (!mailboxAddress) {
                    response.redirect(buildMailPortalRedirect(returnTo, {
                        mail_status: 'error',
                        mail_error: 'Outlook mailbox identity details were incomplete.'
                    }));
                    return;
                }
                const beforeConnection = store.getMailConnection(oauthState.userId);
                store.upsertMailConnection(oauthState.userId, {
                    connected: true,
                    refreshToken: String(tokenPayload.refresh_token || '').trim(),
                    mailboxAddress,
                    mailboxDisplayName,
                    microsoftOid: String(graphProfile?.id || idClaims.oid || idClaims.sub || '').trim(),
                    microsoftTenantId: String(idClaims.tid || '').trim(),
                    grantedScopes: splitMicrosoftScope(tokenPayload.scope || config.scope),
                    lastConnectedAt: new Date().toISOString(),
                    lastSyncStatus: 'connected',
                    lastError: ''
                });
                buildMailAuditEvent(
                    oauthState.userId,
                    String(store.getAccountById(oauthState.userId)?.role || '').trim().toLowerCase(),
                    'mailbox-connected',
                    'mailbox-connection',
                    oauthState.userId,
                    {
                        beforeState: beforeConnection,
                        afterState: store.getMailConnection(oauthState.userId)
                    }
                );
                await syncMailboxCacheForUser(
                    oauthState.userId,
                    String(store.getAccountById(oauthState.userId)?.role || '').trim().toLowerCase(),
                    { syncScope: 'initial-connect', limit: 15 }
                ).catch(() => null);
                response.redirect(buildMailPortalRedirect(returnTo, {
                    mail_status: 'connected',
                    mailbox: mailboxAddress
                }));
            } catch (error) {
                response.redirect(buildMailPortalRedirect(returnTo, {
                    mail_status: 'error',
                    mail_error: error?.message || 'Outlook mailbox connection failed.'
                }));
            }
        })().catch(error => {
            response.redirect(buildMailPortalRedirect(returnTo, {
                mail_status: 'error',
                mail_error: error?.message || 'Outlook mailbox connection failed.'
            }));
        });
    });

    app.delete('/api/mail/connection', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const beforeConnection = store.getMailConnection(actualUserId);
        const connection = store.disconnectMailConnection(actualUserId);
        buildMailAuditEvent(actualUserId, String(sessionAccount.account?.role || '').trim().toLowerCase(), 'mailbox-disconnected', 'mailbox-connection', actualUserId, {
            beforeState: beforeConnection,
            afterState: connection
        });
        emitMailUpdated(actualUserId);
        response.json({
            ok: true,
            connection,
            summary: store.getMailSummaryForUser(actualUserId)
        });
    });

    app.post('/api/mail/sync', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const connection = store.getMailConnection(actualUserId);
        if (connection?.connected !== true) {
            response.json({
                ok: true,
                cache: store.getMailCache(actualUserId),
                bootstrap: store.createMailBootstrap(actualUserId)
            });
            return;
        }
        try {
            const cache = await syncMailboxCacheForUser(actualUserId, String(sessionAccount.account?.role || '').trim().toLowerCase(), {
                syncScope: String(request.body?.syncScope || 'manual-refresh').trim() || 'manual-refresh',
                folderKey: String(request.body?.folder || request.body?.folderKey || '').trim(),
                unreadOnly: request.body?.unreadOnly === true,
                search: String(request.body?.search || '').trim(),
                limit: Number(request.body?.limit || 20)
            });
            emitMailUpdated(actualUserId);
            response.json({
                ok: true,
                cache,
                bootstrap: store.createMailBootstrap(actualUserId)
            });
        } catch (error) {
            sendError(response, 502, error?.message || 'Outlook mailbox sync failed.');
        }
    });

    app.get('/api/mail/messages', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        try {
            const folderKey = String(request.query.folder || request.query.folderKey || 'inbox').trim().toLowerCase() || 'inbox';
            const search = String(request.query.search || '').trim();
            const unreadOnly = String(request.query.unread || '').trim() === '1' || String(request.query.unreadOnly || '').trim().toLowerCase() === 'true';
            const limit = Math.min(Math.max(Number(request.query.limit || 20), 1), 50);
            const result = getBootstrapMailFolderMessages(actualUserId, folderKey, {
                limit,
                unreadOnly,
                search
            });
            response.json({
                ok: true,
                folderKey: result.folderKey,
                displayName: result.displayName,
                totalCount: result.totalCount,
                unreadCount: result.unreadCount,
                messages: result.messages,
                summary: store.getMailSummaryForUser(actualUserId)
            });
        } catch (error) {
            sendError(response, 502, error?.message || 'Messages could not be loaded.');
        }
    });

    app.get('/api/mail/messages/:id', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const portalMessage = store.getPortalMailMessage(actualUserId, request.params.id);
        if (portalMessage) {
            response.json({
                ok: true,
                message: {
                    ...portalMessage,
                    attachments: (portalMessage.attachments || []).map(item => ({
                        ...item,
                        downloadUrl: item.storageKey ? `${backEndUrl}/api/files/${encodeURIComponent(String(item.storageKey || '').trim())}` : ''
                    }))
                }
            });
            return;
        }
        try {
            const { config, accessToken } = await getMicrosoftMailAccess(actualUserId);
            const message = await fetchMicrosoftMailMessage(config, accessToken, request.params.id);
            store.saveMailCache(actualUserId, {
                messagesById: {
                    [message.id]: message
                },
                lastSyncedAt: new Date().toISOString()
            });
            response.json({
                ok: true,
                message: {
                    ...message,
                    attachments: (message.attachments || []).map(item => ({
                        ...item,
                        downloadUrl: `${backEndUrl}/api/mail/messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(item.id)}`
                    }))
                }
            });
        } catch (error) {
            sendError(response, 502, error?.message || 'Outlook message could not be loaded.');
        }
    });

    app.get('/api/mail/messages/:id/attachments/:attachmentId', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        try {
            const { config, accessToken } = await getMicrosoftMailAccess(actualUserId);
            const binary = await fetchMicrosoftGraphBinary(
                config,
                accessToken,
                `/me/messages/${encodeURIComponent(String(request.params.id || '').trim())}/attachments/${encodeURIComponent(String(request.params.attachmentId || '').trim())}/$value`,
                { accept: '*/*' }
            );
            response.setHeader('Content-Type', binary.contentType || 'application/octet-stream');
            response.setHeader('Content-Length', binary.contentLength || binary.buffer.length);
            if (binary.contentDisposition) {
                response.setHeader('Content-Disposition', binary.contentDisposition);
            }
            response.end(binary.buffer);
        } catch (error) {
            sendError(response, 502, error?.message || 'Outlook attachment could not be downloaded.');
        }
    });

    app.post('/api/mail/messages/send', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const actorRole = String(sessionAccount.account?.role || '').trim().toLowerCase();
        const to = Array.isArray(request.body?.to) ? request.body.to : String(request.body?.to || '').split(/[;,]/);
        const cc = Array.isArray(request.body?.cc) ? request.body.cc : String(request.body?.cc || '').split(/[;,]/);
        const toAddresses = to.map(item => String(item || '').trim()).filter(Boolean);
        const ccAddresses = cc.map(item => String(item || '').trim()).filter(Boolean);
        const allAddresses = uniqueStrings([...toAddresses, ...ccAddresses]);
        const subject = String(request.body?.subject || '').trim();
        const body = String(request.body?.body || '').trim();
        if (!allAddresses.length || !subject || !body) {
            sendError(response, 400, 'Recipient, subject, and body are required.');
            return;
        }
        const portalAddresses = allAddresses.filter(address => Boolean(store.getRawAccountByEmail(address)));
        const externalAddresses = allAddresses.filter(address => !store.getRawAccountByEmail(address));
        const attachments = Array.isArray(request.body?.attachments) ? request.body.attachments : [];
        const mailboxConnection = store.getMailConnection(actualUserId);
        const outlookConnected = mailboxConnection?.connected === true;
        if (externalAddresses.length && !outlookConnected) {
            sendError(response, 400, 'Connect Outlook before sending to external email addresses.');
            return;
        }
        try {
            let portalDelivery = null;
            if (portalAddresses.length) {
                portalDelivery = store.createPortalMailMessageCopies({
                    senderUserId: actualUserId,
                    to: toAddresses.filter(address => portalAddresses.includes(address)),
                    cc: ccAddresses.filter(address => portalAddresses.includes(address)),
                    subject,
                    body,
                    attachments
                });
                if (portalDelivery?.error) {
                    sendError(response, portalDelivery.status || 400, portalDelivery.error);
                    return;
                }
            }
            const shouldMirrorPortalToOutlook = outlookConnected && portalAddresses.length > 0;
            const shouldSendViaOutlook = outlookConnected && (externalAddresses.length > 0 || shouldMirrorPortalToOutlook);
            let mirroredPortalToOutlook = false;
            let outlookAttachmentCount = 0;
            if (shouldSendViaOutlook) {
                const { config, accessToken } = await getMicrosoftMailAccess(actualUserId);
                const graphAttachments = await buildGraphSendAttachments(attachments, actualUserId);
                outlookAttachmentCount = graphAttachments.length;
                const shouldSendAllAddresses = shouldMirrorPortalToOutlook;
                const toRecipients = toAddresses
                    .filter(address => shouldSendAllAddresses || externalAddresses.includes(address))
                    .map(address => ({ emailAddress: { address } }));
                const ccRecipients = ccAddresses
                    .filter(address => shouldSendAllAddresses || externalAddresses.includes(address))
                    .map(address => ({ emailAddress: { address } }));
                await fetchMicrosoftGraphJson(config, accessToken, '/me/sendMail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: {
                            subject,
                            body: {
                                contentType: 'HTML',
                                content: body
                            },
                            toRecipients,
                            ccRecipients,
                            attachments: graphAttachments
                        },
                        saveToSentItems: true
                    })
                });
                mirroredPortalToOutlook = shouldMirrorPortalToOutlook;
                await syncMailboxCacheForUser(actualUserId, actorRole, {
                    folderKey: 'sentitems',
                    syncScope: 'send-message',
                    limit: 20
                }).catch(() => null);
            }
            buildMailAuditEvent(actualUserId, actorRole, 'message-sent', 'mail-message', `sent:${Date.now()}`, {
                afterState: {
                    subject,
                    toRecipients: toAddresses,
                    ccRecipients: ccAddresses,
                    attachmentCount: attachments.length,
                    portalDeliveryCount: portalDelivery?.messages?.length || 0,
                    mirroredPortalToOutlook,
                    outlookAttachmentCount
                }
            });
            emitMailUpdated(actualUserId);
            response.json({
                ok: true,
                mirroredPortalToOutlook,
                summary: store.getMailSummaryForUser(actualUserId),
                bootstrap: store.createMailBootstrap(actualUserId)
            });
        } catch (error) {
            sendError(response, 502, error?.message || 'Message could not be sent.');
        }
    });

    app.post('/api/mail/messages/:id/reply', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const actorRole = String(sessionAccount.account?.role || '').trim().toLowerCase();
        const comment = String(request.body?.body || request.body?.comment || '').trim();
        if (!comment) {
            sendError(response, 400, 'Reply body is required.');
            return;
        }
        const portalMessage = store.getPortalMailMessage(actualUserId, request.params.id);
        if (portalMessage) {
            const portalReply = store.replyToPortalMailMessage(actualUserId, request.params.id, {
                body: comment,
                attachments: Array.isArray(request.body?.attachments) ? request.body.attachments : []
            });
            if (portalReply?.error) {
                sendError(response, portalReply.status || 400, portalReply.error);
                return;
            }
            let mirroredPortalToOutlook = false;
            try {
                const mailboxConnection = store.getMailConnection(actualUserId);
                const replyAddress = String(portalMessage.from?.address || '').trim();
                if (mailboxConnection?.connected === true && replyAddress) {
                    const { config, accessToken } = await getMicrosoftMailAccess(actualUserId);
                    const graphAttachments = await buildGraphSendAttachments(request.body?.attachments || [], actualUserId);
                    await fetchMicrosoftGraphJson(config, accessToken, '/me/sendMail', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: {
                                subject: /^re:/i.test(String(portalMessage.subject || '').trim()) ? String(portalMessage.subject || '').trim() : `Re: ${String(portalMessage.subject || '(No subject)').trim()}`,
                                body: {
                                    contentType: 'HTML',
                                    content: comment
                                },
                                toRecipients: [{ emailAddress: { address: replyAddress } }],
                                attachments: graphAttachments
                            },
                            saveToSentItems: true
                        })
                    });
                    mirroredPortalToOutlook = true;
                    await syncMailboxCacheForUser(actualUserId, actorRole, {
                        folderKey: 'sentitems',
                        syncScope: 'reply-message',
                        limit: 20
                    }).catch(() => null);
                }
            } catch (error) {}
            buildMailAuditEvent(actualUserId, actorRole, 'reply-sent', 'mail-message', String(request.params.id || '').trim(), {
                afterState: { replyLength: comment.length, portalReply: true, mirroredPortalToOutlook }
            });
            emitMailUpdated(actualUserId);
            response.json({
                ok: true,
                mirroredPortalToOutlook,
                summary: store.getMailSummaryForUser(actualUserId),
                bootstrap: store.createMailBootstrap(actualUserId)
            });
            return;
        }
        try {
            const { config, accessToken } = await getMicrosoftMailAccess(actualUserId);
            await fetchMicrosoftGraphJson(config, accessToken, `/me/messages/${encodeURIComponent(String(request.params.id || '').trim())}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment })
            });
            buildMailAuditEvent(actualUserId, actorRole, 'reply-sent', 'mail-message', String(request.params.id || '').trim(), {
                afterState: { replyLength: comment.length }
            });
            await syncMailboxCacheForUser(actualUserId, actorRole, {
                folderKey: 'sentitems',
                syncScope: 'reply-message',
                limit: 20
            }).catch(() => null);
            emitMailUpdated(actualUserId);
            response.json({ ok: true, summary: store.getMailSummaryForUser(actualUserId) });
        } catch (error) {
            sendError(response, 502, error?.message || 'Outlook reply could not be sent.');
        }
    });

    app.post('/api/mail/messages/:id/read-state', async (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actualUserId = String(sessionAccount.session?.userId || sessionAccount.account?.id || '').trim();
        const isRead = request.body?.isRead === true || String(request.body?.isRead || '').trim().toLowerCase() === 'true';
        const portalMessage = store.setPortalMailReadState(actualUserId, request.params.id, isRead);
        if (portalMessage) {
            emitMailUpdated(actualUserId);
            response.json({
                ok: true,
                message: portalMessage,
                summary: store.getMailSummaryForUser(actualUserId),
                bootstrap: store.createMailBootstrap(actualUserId)
            });
            return;
        }
        try {
            const { config, accessToken } = await getMicrosoftMailAccess(actualUserId);
            await fetchMicrosoftGraphJson(config, accessToken, `/me/messages/${encodeURIComponent(String(request.params.id || '').trim())}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isRead })
            });
            const cache = store.getMailCache(actualUserId) || {};
            const currentMessage = cache?.messagesById?.[String(request.params.id || '').trim()] || null;
            if (currentMessage) {
                store.saveMailCache(actualUserId, {
                    messagesById: {
                        [currentMessage.id]: {
                            ...currentMessage,
                            isRead
                        }
                    },
                    lastSyncedAt: new Date().toISOString()
                });
            }
            await syncMailboxCacheForUser(actualUserId, String(sessionAccount.account?.role || '').trim().toLowerCase(), {
                folderKey: String(request.body?.folder || currentMessage?.folderKey || 'inbox').trim().toLowerCase() || 'inbox',
                syncScope: 'read-state',
                limit: 20
            }).catch(() => null);
            emitMailUpdated(actualUserId);
            response.json({ ok: true, summary: store.getMailSummaryForUser(actualUserId) });
        } catch (error) {
            sendError(response, 502, error?.message || 'Outlook read state could not be updated.');
        }
    });
}

module.exports = {
    registerMailRoutes
};
