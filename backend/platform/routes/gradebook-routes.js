function registerGradebookRoutes(app, deps = {}) {
    const {
        getSessionActor,
        getStore,
        gradebookFinalizeRoles,
        gradebookPublishRoles,
        gradebookReadRoles,
        gradebookScoreRoles,
        requireGradebookCourseAccess,
        sendError
    } = deps;

    app.get('/api/gradebook/courses/:id', (request, response) => {
        const sessionAccount = requireGradebookCourseAccess(request, response, gradebookReadRoles, request.params.id, 'read');
        if (!sessionAccount) return;
        const store = getStore();
        response.json({ ok: true, gradebook: store.getGradebookCourse(request.params.id) });
    });

    app.post('/api/gradebook/scores', (request, response) => {
        const sessionAccount = requireGradebookCourseAccess(request, response, gradebookScoreRoles, request.body?.courseId, 'score');
        if (!sessionAccount) return;
        const store = getStore();
        const actor = getSessionActor(sessionAccount);
        const gradebook = store.setScore({
            ...(request.body || {}),
            updatedBy: actor.actorUserId,
            actorUserId: actor.actorUserId,
            actorRole: actor.actorRole,
            reason: request.body?.reason || request.body?.note || 'Gradebook score update'
        });
        if (!gradebook) {
            sendError(response, 400, 'Gradebook score could not be saved.');
            return;
        }
        response.json({ ok: true, gradebook });
    });

    app.post('/api/gradebook/publish', (request, response) => {
        const sessionAccount = requireGradebookCourseAccess(request, response, gradebookPublishRoles, request.body?.courseId, 'publish');
        if (!sessionAccount) return;
        const store = getStore();
        const actor = getSessionActor(sessionAccount);
        const gradebook = store.publishGradebook({
            ...(request.body || {}),
            publishedBy: actor.actorUserId,
            actorUserId: actor.actorUserId,
            actorRole: actor.actorRole
        });
        response.json({ ok: true, gradebook });
    });

    app.post('/api/gradebook/finalize', (request, response) => {
        const sessionAccount = requireGradebookCourseAccess(request, response, gradebookFinalizeRoles, request.body?.courseId, 'finalize');
        if (!sessionAccount) return;
        const store = getStore();
        const actor = getSessionActor(sessionAccount);
        const gradebook = store.finalizeGrades({
            ...(request.body || {}),
            finalizedBy: actor.actorUserId,
            actorUserId: actor.actorUserId,
            actorRole: actor.actorRole
        });
        response.json({ ok: true, gradebook });
    });
}

module.exports = {
    registerGradebookRoutes
};
