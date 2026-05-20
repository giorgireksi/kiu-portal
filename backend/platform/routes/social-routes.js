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

    app.post('/api/social/projects', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const project = store.createSocialProject(request.body || {}, actorUserId);
        if (!project) {
            sendError(response, 400, 'Project workspace could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, project });
    });

    app.post('/api/social/projects/:id', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const project = store.updateSocialProject(request.params.id, request.body || {}, actorUserId);
        if (!project) {
            sendError(response, 400, 'Project workspace could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, project });
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

    app.post('/api/social/projects/:id/milestones', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const milestone = store.createSocialProjectMilestone(request.params.id, request.body || {}, actorUserId);
        if (!milestone) {
            sendError(response, 400, 'Project milestone could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, milestone });
    });

    app.post('/api/social/projects/:id/milestones/:milestoneId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const milestone = store.updateSocialProjectMilestone(request.params.id, request.params.milestoneId, request.body || {}, actorUserId);
        if (!milestone) {
            sendError(response, 400, 'Project milestone could not be updated.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, milestone });
    });

    app.delete('/api/social/projects/:id/milestones/:milestoneId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProjectMilestone(
            request.params.id,
            request.params.milestoneId,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project milestone could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/deliverables', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const deliverable = store.createSocialProjectDeliverable(request.params.id, request.body || {}, actorUserId);
        if (!deliverable) {
            sendError(response, 400, 'Project deliverable could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, deliverable });
    });

    app.delete('/api/social/projects/:id/deliverables/:deliverableId', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const result = store.deleteSocialProjectDeliverable(
            request.params.id,
            request.params.deliverableId,
            actorUserId
        );
        if (!result) {
            sendError(response, 400, 'Project deliverable could not be deleted.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/social/projects/:id/checkins', (request, response) => {
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const checkin = store.createSocialProjectCheckin(request.params.id, request.body || {}, actorUserId);
        if (!checkin) {
            sendError(response, 400, 'Project check-in could not be created.');
            return;
        }
        emitSocialUpdated();
        response.json({ ok: true, checkin });
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
