function registerStudentServiceRoutes(app, deps = {}) {
    const {
        broadcastAll,
        getActorUserId,
        getStore,
        requireSessionAccount,
        sendError
    } = deps;

    function emitStudentServiceUpdated() {
        broadcastAll({ type: 'student-service:updated', emittedAt: new Date().toISOString() });
    }

    app.get('/api/student-service/bootstrap', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        response.json({
            ok: true,
            studentService: store.getStudentServiceBootstrap(getActorUserId(sessionAccount))
        });
    });

    app.post('/api/student-service/tickets', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.createStudentServiceTicket(request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service ticket could not be created.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ticket: result });
    });

    app.post('/api/student-service/tickets/:id/replies', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.replyStudentServiceTicket(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service reply could not be stored.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ticket: result });
    });

    app.post('/api/student-service/tickets/:id/status', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateStudentServiceTicketStatus(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service ticket status could not be updated.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ticket: result });
    });

    app.post('/api/student-service/tickets/:id/assign', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.assignStudentServiceTicket(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service ticket could not be assigned.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ticket: result });
    });

    app.post('/api/student-service/tickets/:id/internal-notes', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.addStudentServiceInternalNote(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service internal note could not be saved.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ticket: result });
    });

    app.post('/api/student-service/tickets/:id/handoff', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateStudentServiceTicketHandoff(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service handoff could not be updated.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ticket: result });
    });

    app.post('/api/student-service/articles', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.saveStudentServiceArticle(request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service article could not be saved.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, article: result });
    });

    app.post('/api/student-service/questions', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.createStudentServiceQuestion(request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service question could not be created.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/student-service/questions/:id/answers', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.addStudentServiceQuestionAnswer(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service answer could not be added.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, question: result });
    });

    app.post('/api/student-service/questions/:id/feedback', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.setStudentServiceQuestionFeedback(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service feedback could not be saved.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, question: result });
    });

    app.post('/api/student-service/questions/:id/accept-answer', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.acceptStudentServiceAnswer(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service accepted answer could not be updated.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, question: result });
    });

    app.post('/api/student-service/questions/:id/publish', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.publishStudentServiceQuestion(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service question could not be published.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, question: result });
    });

    app.post('/api/student-service/questions/:id/flags', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.updateStudentServiceQuestionFlags(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service question flags could not be updated.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, question: result });
    });

    app.post('/api/student-service/questions/:id/convert-to-ticket', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.convertStudentServiceQuestionToTicket(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service question could not be converted to a ticket.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/student-service/questions/:id/convert-to-article', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.convertStudentServiceQuestionToArticle(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service question could not be converted to an article.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ...result });
    });

    app.post('/api/student-service/questions/:id/merge', (request, response) => {
        const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
        if (!sessionAccount) return;
        const store = getStore();
        const result = store.mergeStudentServiceQuestions(request.params.id, request.body || {}, getActorUserId(sessionAccount));
        if (!result || result?.error) {
            sendError(response, result?.status || 400, result?.error || 'Student Service questions could not be merged.');
            return;
        }
        emitStudentServiceUpdated();
        response.json({ ok: true, ...result });
    });
}

module.exports = {
    registerStudentServiceRoutes
};
