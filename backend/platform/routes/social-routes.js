function registerSocialRoutes(app, deps = {}) {
    const {
        addRouteAuditEvent,
        broadcastAll,
        getActorUserId,
        getStore,
        pushEvent,
        requireSessionAccount,
        sendError
    } = deps;

    function emitSocialUpdated() {
        broadcastAll({ type: 'social:state-upsert', emittedAt: new Date().toISOString() });
    }

    app.get('/api/social/bootstrap', (request, response) => {
        const store = getStore();
        response.json({ ok: true, social: store.getSocialBootstrap(String(request.query.userId || '').trim()) });
    });

    app.post('/api/social/state', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorId = getActorUserId(sessionAccount);
        const social = store.upsertSocialState(request.body?.social || request.body || {}, actorId, String(request.body?.reason || 'social-save'));
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'social',
            eventType: 'social-state-saved',
            entityType: 'social_state',
            entityId: 'global',
            afterState: {
                reason: String(request.body?.reason || 'social-save'),
                keys: Object.keys(social && typeof social === 'object' ? social : {})
            }
        });
        emitSocialUpdated();
        response.json({ ok: true, social });
    });

    app.post('/api/social/group-chat', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.ensureSocialGroupChat(request.body?.groupId, actorUserId);
        if (!result) {
            sendError(response, 404, 'Social group not found.');
            return;
        }
        pushEvent(result.chat.members, { type: 'chat:upsert', chat: result.chat });
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.get('/api/social/feed', (request, response) => {
        const store = getStore();
        response.json({ ok: true, ...store.listSocialFeed(request.query) });
    });

    app.post('/api/social/posts/resolve', (request, response) => {
        const store = getStore();
        const items = store.resolveSocialPosts(
            request.body?.postIds || request.body?.ids || [],
            request.body?.userId || request.body?.viewerUserId || ''
        );
        response.json({ ok: true, items, total: items.length });
    });

    app.get('/api/social/events', (request, response) => {
        const store = getStore();
        response.json({ ok: true, ...store.listSocialEvents(request.query) });
    });

    app.get('/api/social/surveys', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const items = store.listSocialSurveys(request.query || {}, actorUserId);
        response.json({ ok: true, items, total: items.length });
    });

    app.get('/api/social/surveys/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const survey = store.getSocialSurvey(request.params.id, actorUserId);
        if (!survey) {
            sendError(response, 404, 'Survey not found.');
            return;
        }
        response.json({ ok: true, survey });
    });

    app.get('/api/social/surveys/:id/results', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const results = store.getSocialSurveyResults(request.params.id, actorUserId);
        if (!results) {
            sendError(response, 403, 'Survey results are not available.');
            return;
        }
        response.json({ ok: true, results });
    });

    app.post('/api/social/surveys', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const survey = store.createSocialSurvey(request.body || {}, actorUserId);
        if (!survey) {
            sendError(response, 400, 'Survey could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, survey });
    });

    app.post('/api/social/surveys/:id/close', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const survey = store.closeSocialSurvey(request.params.id, actorUserId);
        if (!survey) {
            sendError(response, 400, 'Survey could not be closed.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, survey });
    });

    app.post('/api/social/surveys/:id/respond', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const survey = store.submitSocialSurveyResponse(request.params.id, request.body || {}, actorUserId);
        if (!survey) {
            sendError(response, 400, 'Survey response could not be submitted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, survey });
    });

    app.delete('/api/social/surveys/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialSurvey(request.params.id, actorUserId);
        if (!result) {
            sendError(response, 400, 'Survey could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.get('/api/social/research', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const items = store.listSocialResearchPublications(request.query || {}, actorUserId);
        response.json({ ok: true, items, total: items.length });
    });

    app.get('/api/social/research/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const publication = store.getSocialResearchPublication(request.params.id, actorUserId);
        if (!publication) {
            sendError(response, 404, 'Publication not found.');
            return;
        }
        response.json({ ok: true, publication });
    });

    app.post('/api/social/research', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const publication = store.createSocialResearchPublication(request.body || {}, actorUserId);
        if (!publication) {
            sendError(response, 400, 'Publication could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, publication });
    });

    app.patch('/api/social/research/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const publication = store.updateSocialResearchPublication(request.params.id, request.body || {}, actorUserId);
        if (!publication) {
            sendError(response, 400, 'Publication could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, publication });
    });

    app.post('/api/social/research/:id/save', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const publication = store.toggleSocialResearchSave(request.params.id, actorUserId);
        if (!publication) {
            sendError(response, 400, 'Publication could not be saved.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, publication });
    });

    app.delete('/api/social/research/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialResearchPublication(request.params.id, actorUserId);
        if (!result) {
            sendError(response, 400, 'Publication could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/pages', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const page = store.createSocialPage(request.body || {}, actorUserId);
        if (!page) {
            sendError(response, 400, 'Invalid social page payload.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, page });
    });

    app.post('/api/social/pages/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const page = store.updateSocialPage(request.params.id, request.body || {}, actorUserId);
        if (!page) {
            sendError(response, 400, 'Social page could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, page });
    });

    app.post('/api/social/groups', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const group = store.createSocialGroup(request.body || {}, actorUserId);
        if (!group) {
            sendError(response, 400, 'Invalid social group payload.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, group });
    });

    app.post('/api/social/groups/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const group = store.updateSocialGroup(request.params.id, request.body || {}, actorUserId);
        if (!group) {
            sendError(response, 400, 'Social group could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, group });
    });

    app.delete('/api/social/groups/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialGroup(request.params.id, actorUserId);
        if (!result) {
            sendError(response, 400, 'Group could not be deleted.');
            return;
        }
        emitSocialUpdated();
        if (result.chatId) {
            broadcastAll({ type: 'chat:deleted', chatId: result.chatId, emittedAt: new Date().toISOString() });
        }
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/groups/:id/membership', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const group = store.setSocialGroupMembership(
            request.params.id,
            request.body?.userId,
            request.body?.action || 'join',
            actorUserId
        );
        if (!group) {
            sendError(response, 400, 'Group membership could not be updated.');
            return;
        }
        if (group.chatId && store.state.chats[group.chatId]) {
            pushEvent(store.state.chats[group.chatId].members, { type: 'chat:upsert', chat: store.state.chats[group.chatId] });
        }
        emitSocialUpdated();
        response.json({ ok: true, group });
    });

    app.post('/api/social/groups/:id/membership/:memberId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const group = store.respondSocialGroupMembership(
            request.params.id,
            request.params.memberId,
            request.body?.accept !== false,
            actorUserId
        );
        if (!group) {
            sendError(response, 400, 'Group membership request could not be resolved.');
            return;
        }
        if (group.chatId && store.state.chats[group.chatId]) {
            pushEvent(store.state.chats[group.chatId].members, { type: 'chat:upsert', chat: store.state.chats[group.chatId] });
        }
        emitSocialUpdated();
        response.json({ ok: true, group });
    });

    app.delete('/api/social/groups/:id/members/:memberId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const group = store.removeSocialGroupMember(
            request.params.id,
            request.params.memberId,
            actorUserId
        );
        if (!group) {
            sendError(response, 400, 'Group member could not be removed.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, group });
    });

    app.post('/api/social/groups/:id/invite', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.inviteSocialGroupMember(
            request.params.id,
            request.body?.memberId,
            actorUserId,
            request.body?.note || ''
        );
        if (!result) {
            sendError(response, 400, 'Group invitation could not be sent.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.get('/api/social/portfolio/me', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const portfolio = store.getPortfolioForUser(actorUserId, actorUserId);
        response.json({ ok: true, portfolio });
    });

    app.put('/api/social/portfolio/me', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const portfolio = store.savePortfolioForUser(actorUserId, request.body || {}, actorUserId);
            if (!portfolio) {
                sendError(response, 400, 'Portfolio could not be saved.');
                return;
            }
            emitSocialUpdated();
            response.json({ ok: true, portfolio });
        } catch (error) {
            console.error('[social/portfolio] save failed:', error);
            sendError(response, 400, error?.message || 'Portfolio could not be saved.');
        }
    });

    app.post('/api/social/portfolio/me/publish', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const portfolio = store.publishPortfolioForUser(actorUserId, request.body || {}, actorUserId);
            emitSocialUpdated();
            response.json({ ok: true, portfolio });
        } catch (error) {
            console.error('[social/portfolio] publish failed:', error);
            sendError(response, 400, error?.message || 'Portfolio could not be published.');
        }
    });

    app.post('/api/social/portfolio/me/unpublish', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const portfolio = store.unpublishPortfolioForUser(actorUserId, actorUserId);
            emitSocialUpdated();
            response.json({ ok: true, portfolio });
        } catch (error) {
            console.error('[social/portfolio] unpublish failed:', error);
            sendError(response, 400, error?.message || 'Portfolio could not be unpublished.');
        }
    });

    app.post('/api/social/portfolio/me/sections', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const portfolio = store.addCustomPortfolioSection(actorUserId, request.body || {}, actorUserId);
            emitSocialUpdated();
            response.json({ ok: true, portfolio });
        } catch (error) {
            console.error('[social/portfolio] add section failed:', error);
            sendError(response, 400, error?.message || 'Custom section could not be added.');
        }
    });

    app.get('/api/social/portfolio/discover', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const portfolios = store.listDiscoverablePortfolios(actorUserId, {
            q: String(request.query.q || request.query.search || '').trim(),
            faculty: String(request.query.faculty || '').trim(),
            visibility: String(request.query.visibility || request.query.visibilityMode || '').trim()
        });
        response.json({ ok: true, portfolios });
    });

    app.get('/api/social/portfolio/:userId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const portfolio = store.getPortfolioForUser(request.params.userId, actorUserId);
        if (!portfolio?.canView) {
            sendError(response, 404, 'Portfolio not found.');
            return;
        }
        response.json({ ok: true, portfolio });
    });

    app.post('/api/social/projects', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const project = store.createSocialProject(request.body || {}, actorUserId);
            if (!project) {
                sendError(response, 400, 'Project workspace could not be created.');
                return;
            }
            emitSocialUpdated();
            response.json({ ok: true, project });
        } catch (error) {
            console.error('[social/projects] create failed:', error);
            sendError(response, 500, error?.message || 'Internal error creating project.');
        }
    });

    app.post('/api/social/projects/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const project = store.updateSocialProject(request.params.id, request.body || {}, actorUserId);
            if (!project) {
                sendError(response, 400, 'Project workspace could not be updated.');
                return;
            }
            emitSocialUpdated();
            response.json({ ok: true, project });
        } catch (error) {
            console.error('[social/projects] update failed:', error);
            sendError(response, 500, error?.message || 'Internal error updating project.');
        }
    });

    app.post('/api/social/projects/:id/baseline', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const project = store.setSocialProjectBaseline(request.params.id, actorUserId);
            if (!project) {
                sendError(response, 403, 'Project baseline could not be set.');
                return;
            }
            emitSocialUpdated();
            response.json({ ok: true, project });
        } catch (error) {
            console.error('[social/projects] baseline failed:', error);
            sendError(response, 500, error?.message || 'Internal error setting project baseline.');
        }
    });

    app.post('/api/social/projects/:id/task-graph', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        try {
            const store = getStore();
            const actorUserId = getActorUserId(sessionAccount);
            const project = store.updateSocialProjectTaskGraph(request.params.id, request.body || {}, actorUserId);
            if (!project) {
                sendError(response, 403, 'Task map layout could not be updated.');
                return;
            }
            emitSocialUpdated();
            response.json({ ok: true, project });
        } catch (error) {
            console.error('[social/projects] task-graph failed:', error);
            sendError(response, 500, error?.message || 'Internal error updating task map layout.');
        }
    });

    app.delete('/api/social/projects/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProject(request.params.id, actorUserId);
        if (!result) {
            sendError(response, 400, 'Project workspace could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/membership', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.setSocialProjectMembership(
            request.params.id,
            request.body?.userId || request.body?.memberId || actorUserId,
            request.body?.action || 'leave',
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project workspace membership could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/invite', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.inviteSocialProjectMember(
            request.params.id,
            request.body?.memberId,
            request.body?.role || 'member',
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project invitation could not be sent.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/members/:memberId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const project = store.updateSocialProjectMemberRole(
            request.params.id,
            request.params.memberId,
            request.body?.role || 'member',
            actorUserId
        );
        if (!project) {
            sendError(response, 400, 'Project member role could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, project });
    });

    app.delete('/api/social/projects/:id/members/:memberId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const project = store.removeSocialProjectMember(
            request.params.id,
            request.params.memberId,
            actorUserId
        );
        if (!project) {
            sendError(response, 400, 'Project member could not be removed.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, project });
    });

    app.post('/api/social/projects/:id/tasks', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const task = store.createSocialProjectTask(request.params.id, request.body || {}, actorUserId);
        if (!task) {
            sendError(response, 400, 'Project task could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, task });
    });

    app.post('/api/social/projects/:id/tasks/:taskId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const task = store.updateSocialProjectTask(request.params.id, request.params.taskId, request.body || {}, actorUserId);
        if (!task) {
            sendError(response, 400, 'Project task could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, task });
    });

    app.delete('/api/social/projects/:id/tasks/:taskId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProjectTask(
            request.params.id,
            request.params.taskId,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project task could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/budget-categories', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const category = store.createSocialProjectBudgetCategory(request.params.id, request.body || {}, actorUserId);
        if (!category) {
            sendError(response, 400, 'Project budget category could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, category });
    });

    app.post('/api/social/projects/:id/budget-categories/:categoryId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const category = store.updateSocialProjectBudgetCategory(
            request.params.id,
            request.params.categoryId,
            request.body || {},
            actorUserId
        );
        if (!category) {
            sendError(response, 400, 'Project budget category could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, category });
    });

    app.delete('/api/social/projects/:id/budget-categories/:categoryId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProjectBudgetCategory(
            request.params.id,
            request.params.categoryId,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project budget category could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/budget-expenses', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const expense = store.createSocialProjectBudgetExpense(request.params.id, request.body || {}, actorUserId);
        if (!expense) {
            sendError(response, 400, 'Project budget expense could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, expense });
    });

    app.post('/api/social/projects/:id/budget-expenses/:expenseId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const expense = store.updateSocialProjectBudgetExpense(
            request.params.id,
            request.params.expenseId,
            request.body || {},
            actorUserId
        );
        if (!expense) {
            sendError(response, 400, 'Project budget expense could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, expense });
    });

    app.delete('/api/social/projects/:id/budget-expenses/:expenseId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProjectBudgetExpense(
            request.params.id,
            request.params.expenseId,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project budget expense could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/risks', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const risk = store.createSocialProjectRisk(request.params.id, request.body || {}, actorUserId);
        if (!risk) {
            sendError(response, 400, 'Project risk could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, risk });
    });

    app.post('/api/social/projects/:id/risks/:riskId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const risk = store.updateSocialProjectRisk(
            request.params.id,
            request.params.riskId,
            request.body || {},
            actorUserId
        );
        if (!risk) {
            sendError(response, 400, 'Project risk could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, risk });
    });

    app.delete('/api/social/projects/:id/risks/:riskId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProjectRisk(
            request.params.id,
            request.params.riskId,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project risk could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/showcase', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.createSocialProjectShowcasePage(request.params.id, actorUserId);
        if (!result) {
            sendError(response, 400, 'Project showcase could not be published.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/relationships/request', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const relationship = store.sendSocialConnectionRequest(actorUserId, request.body?.toUserId);
        if (!relationship) {
            sendError(response, 400, 'Connection request could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, relationship });
    });

    app.post('/api/social/relationships/:id/respond', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.respondSocialConnectionRequest(request.params.id, actorUserId, request.body?.accept !== false);
        if (!result) {
            sendError(response, 400, 'Connection request could not be resolved.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/relationships/remove', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const removed = store.removeSocialConnection(actorUserId, request.body?.targetUserId);
        if (!removed) {
            sendError(response, 400, 'Connection could not be removed.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true });
    });

    app.post('/api/social/follows/toggle', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.toggleSocialFollow(actorUserId, request.body?.targetType, request.body?.targetId);
        if (!result) {
            sendError(response, 400, 'Follow state could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/posts', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.createSocialPost(request.body || {}, actorUserId);
        if (!post) {
            sendError(response, 400, 'Invalid social post payload.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.patch('/api/social/posts/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.updateSocialPost(request.params.id, request.body || {}, actorUserId);
        if (!post) {
            sendError(response, 400, 'Post could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.delete('/api/social/posts/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const removed = store.deleteSocialPost(request.params.id, actorUserId);
        if (!removed) {
            sendError(response, 400, 'Post could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true });
    });

    app.post('/api/social/posts/:id/share', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.shareSocialPost(request.params.id, request.body || {}, actorUserId);
        if (!post) {
            sendError(response, 400, 'Post could not be shared.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.post('/api/social/posts/:id/reactions', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.toggleSocialReaction(request.params.id, actorUserId, request.body?.reactionType || 'like');
        if (!post) {
            sendError(response, 400, 'Reaction could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.post('/api/social/posts/:id/comments', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.addSocialComment(request.params.id, {
            ...(request.body || {}),
            authorUserId: actorUserId
        });
        if (!post) {
            sendError(response, 400, 'Comment could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.post('/api/social/posts/:id/comments/:commentId/reactions', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.toggleSocialCommentReaction(
            request.params.id,
            request.params.commentId,
            actorUserId,
            request.body?.reactionType || 'like'
        );
        if (!post) {
            sendError(response, 400, 'Comment reaction could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.delete('/api/social/posts/:id/comments/:commentId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.removeSocialComment(request.params.id, request.params.commentId, actorUserId);
        if (!post) {
            sendError(response, 400, 'Comment could not be removed.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.post('/api/social/posts/:id/pin', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const post = store.toggleSocialScopePostPin(
            request.body?.scopeType || request.body?.targetScopeType || request.body?.postScopeType || request.body?.scope || '',
            request.body?.scopeId || request.body?.targetScopeId || request.body?.postScopeId || request.body?.groupId || request.body?.pageId || '',
            request.params.id,
            actorUserId
        );
        if (!post) {
            sendError(response, 400, 'Post pin state could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, post });
    });

    app.post('/api/social/reports', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const report = store.createSocialReport({
            ...(request.body || {}),
            reporterUserId: actorUserId
        });
        response.json({ ok: true, report });
    });

    app.post('/api/social/reports/:id/resolve', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const report = store.resolveSocialReport(request.params.id, request.body || {}, actorUserId);
        if (!report) {
            sendError(response, 400, 'Report could not be resolved.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, report });
    });

    app.post('/api/social/profiles/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const profile = store.upsertSocialProfile(request.params.id, request.body || {}, actorUserId);
        if (!profile) {
            sendError(response, 400, 'Social profile could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, profile });
    });

    app.post('/api/social/events', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const event = store.createSocialEvent(request.body || {}, actorUserId);
        if (!event) {
            sendError(response, 400, 'Event could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, event });
    });

    app.post('/api/social/events/:id/rsvp', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const event = store.respondSocialEventRsvp(request.params.id, actorUserId, request.body?.status || 'going');
        if (!event) {
            sendError(response, 400, 'RSVP could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, event });
    });

    app.patch('/api/social/events/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const event = store.updateSocialEvent(request.params.id, request.body || {}, actorUserId);
        if (!event) {
            sendError(response, 400, 'Event could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, event });
    });

    app.delete('/api/social/events/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialEvent(
            request.params.id,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Event could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });
}

module.exports = {
    registerSocialRoutes
};
