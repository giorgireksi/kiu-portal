function registerMessengerCallsRoutes(app, deps = {}) {
    const {
        getActorUserId,
        getStore,
        pushEvent,
        requireSessionAccount,
        resolveSessionBoundUserId,
        sendError
    } = deps;

    app.get('/api/messenger/snapshot', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        if (!userId) {
            sendError(response, 400, 'userId is required.');
            return;
        }
        const store = getStore();
        response.json({ ok: true, ...store.listMessengerSnapshot(userId) });
    });

    app.post('/api/messenger/direct', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        let chat = store.ensureDirectChat(actorUserId, request.body?.userB);
        if (!chat) {
            sendError(response, 400, 'Both participants are required.');
            return;
        }
        chat = store.unhideChatForUser(chat.id, actorUserId) || chat;
        pushEvent(chat.members, { type: 'chat:upsert', chat });
        response.json({ ok: true, chat });
    });

    app.post('/api/messenger/message', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const chat = store.appendMessage({
            ...(request.body || {}),
            senderId: getActorUserId(sessionAccount)
        });
        if (!chat) {
            sendError(response, 400, 'Invalid message payload.');
            return;
        }
        pushEvent(chat.members, { type: 'chat:upsert', chat });
        response.json({ ok: true, chat });
    });

    app.delete('/api/messenger/chats/:chatId/messages/:messageId', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const chat = store.removeChatMessage(
            request.params.chatId,
            request.params.messageId,
            getActorUserId(sessionAccount)
        );
        if (!chat) {
            sendError(response, 400, 'Message could not be removed.');
            return;
        }
        pushEvent(chat.members, { type: 'chat:upsert', chat });
        response.json({ ok: true, chat });
    });

    app.post('/api/messenger/chats/:chatId/hide', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const chat = store.hideChatForUser(
            request.params.chatId,
            getActorUserId(sessionAccount)
        );
        if (!chat) {
            sendError(response, 400, 'Chat could not be hidden.');
            return;
        }
        pushEvent(chat.members, { type: 'chat:upsert', chat });
        response.json({ ok: true, chat });
    });

    app.post('/api/messenger/chats/:chatId/read', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        let chatId = String(request.params.chatId || '').trim();
        try {
            chatId = decodeURIComponent(chatId);
        } catch (error) {
            chatId = String(request.params.chatId || '').trim();
        }
        const chat = store.markChatMessagesRead(chatId, actorUserId);
        if (!chat) {
            sendError(response, 400, 'Chat could not be marked read.');
            return;
        }
        pushEvent(chat.members, { type: 'chat:upsert', chat });
        response.json({ ok: true, chat });
    });

    app.post('/api/calls/start', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const call = store.startCall({
            ...(request.body || {}),
            fromUserId: actorUserId
        });
        if (!call) {
            sendError(response, 400, 'Call could not be started.');
            return;
        }
        if (String(call.mode || '').trim().toLowerCase() === 'group') {
            pushEvent(call.members, { type: 'portal:state-upsert' });
        } else {
            pushEvent([request.body?.toUserId], { type: 'call:ringing', chatId: call.chatId, fromUserId: actorUserId });
            pushEvent(call.members, { type: 'portal:state-upsert' });
        }
        response.json({ ok: true, call });
    });

    app.post('/api/calls/accept', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const call = store.acceptCall({
            ...(request.body || {}),
            fromUserId: actorUserId
        });
        if (!call) {
            sendError(response, 400, 'Valid call is required.');
            return;
        }
        pushEvent(call.members.filter(memberId => String(memberId || '').trim() !== actorUserId), { type: 'call:accepted', chatId: call.chatId, fromUserId: actorUserId });
        pushEvent(call.members, { type: 'portal:state-upsert' });
        response.json({ ok: true, call });
    });

    app.post('/api/calls/decline', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const call = store.declineCall({
            ...(request.body || {}),
            fromUserId: actorUserId
        });
        if (!call) {
            sendError(response, 400, 'Valid call is required.');
            return;
        }
        pushEvent(call.members.filter(memberId => String(memberId || '').trim() !== actorUserId), { type: 'call:declined', chatId: call.chatId, fromUserId: actorUserId });
        pushEvent(call.members, { type: 'portal:state-upsert' });
        response.json({ ok: true, call });
    });

    app.post('/api/calls/end', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const actorUserId = getActorUserId(sessionAccount);
        const call = store.endCall({
            ...(request.body || {}),
            fromUserId: actorUserId
        });
        if (!call) {
            sendError(response, 400, 'Valid call is required.');
            return;
        }
        pushEvent(call.members, { type: 'call:ended', chatId: call.chatId, fromUserId: actorUserId });
        pushEvent(call.members, { type: 'portal:state-upsert' });
        response.json({ ok: true, call });
    });

    app.post('/api/calls/join', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const call = store.joinCall({
            ...(request.body || {}),
            userId: getActorUserId(sessionAccount)
        });
        if (!call) {
            sendError(response, 400, 'Group call could not be joined.');
            return;
        }
        pushEvent(call.members, { type: 'portal:state-upsert' });
        response.json({ ok: true, call });
    });

    app.post('/api/calls/leave', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const call = store.leaveCall({
            ...(request.body || {}),
            userId: getActorUserId(sessionAccount)
        });
        if (!call) {
            sendError(response, 400, 'Group call could not be updated.');
            return;
        }
        pushEvent(call.members, { type: 'portal:state-upsert' });
        response.json({ ok: true, call });
    });

    app.post('/api/calls/signal', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const signal = {
            chatId: String(request.body?.chatId || '').trim(),
            fromUserId: getActorUserId(sessionAccount),
            toUserId: String(request.body?.toUserId || '').trim(),
            signalType: String(request.body?.signalType || '').trim(),
            payload: request.body?.payload || null
        };
        if (!signal.chatId || !signal.fromUserId || !signal.toUserId || !signal.signalType) {
            sendError(response, 400, 'Incomplete signaling payload.');
            return;
        }
        const chat = store.state.chats[signal.chatId];
        const members = Array.isArray(chat?.members) ? chat.members : [];
        if (!chat || !members.includes(signal.fromUserId) || !members.includes(signal.toUserId)) {
            sendError(response, 403, 'Call signaling is only allowed for chat members.');
            return;
        }
        pushEvent([signal.toUserId], { type: 'call:signal', signal });
        response.json({ ok: true });
    });
}

module.exports = {
    registerMessengerCallsRoutes
};
