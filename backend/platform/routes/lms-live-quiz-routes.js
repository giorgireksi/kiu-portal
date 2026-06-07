function registerLmsLiveQuizRoutes(app, deps = {}) {
    const {
        broadcastAll,
        getSessionRole,
        getStore,
        mergeStaffLiveQuizWorkspace,
        mergeStudentLiveQuizJoin,
        mergeStudentLiveQuizAnswer,
        requireLmsLiveQuizWorkspaceAccess,
        sendError,
        staffRoles,
        submitStudentLiveQuizJoin,
        submitStudentLiveQuizAnswer
    } = deps;

    function emitLiveQuizUpdate(request, resourceKey) {
        const emittedAt = new Date().toISOString();
        broadcastAll({
            type: 'lms-live-quiz:updated',
            resourceKey,
            reason: String(request.body?.reason || '').trim(),
            emittedAt
        });
        broadcastAll({ type: 'portal:state-upsert', emittedAt });
    }

    app.get('/api/lms/live-quizzes/:resourceKey', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = requireLmsLiveQuizWorkspaceAccess(request, response, resourceKey, 'read');
        if (!sessionAccount) return;
        const store = getStore();
        response.json({
            ok: true,
            resourceKey,
            workspace: store.getLmsLiveQuizWorkspace(resourceKey)
        });
    });

    app.post('/api/lms/live-quizzes/:resourceKey/answers', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = requireLmsLiveQuizWorkspaceAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const role = getSessionRole(sessionAccount);
        if (role !== 'student') {
            sendError(response, 403, 'Only students can submit live quiz answers on this endpoint.');
            return;
        }
        const store = getStore();
        const existingWorkspace = store.getLmsLiveQuizWorkspace(resourceKey) || { sessions: [] };
        const merged = submitStudentLiveQuizAnswer(existingWorkspace, request.body || {}, sessionAccount);
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Live quiz answer could not be saved.');
            return;
        }
        const savedWorkspace = store.saveLmsLiveQuizWorkspace(resourceKey, merged.workspace);
        emitLiveQuizUpdate(request, resourceKey);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });

    app.post('/api/lms/live-quizzes/:resourceKey/join', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = requireLmsLiveQuizWorkspaceAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const role = getSessionRole(sessionAccount);
        if (role !== 'student') {
            sendError(response, 403, 'Only students can join live quiz sessions on this endpoint.');
            return;
        }
        const store = getStore();
        const existingWorkspace = store.getLmsLiveQuizWorkspace(resourceKey) || { sessions: [] };
        const merged = typeof submitStudentLiveQuizJoin === 'function'
            ? submitStudentLiveQuizJoin(existingWorkspace, request.body || {}, sessionAccount)
            : mergeStudentLiveQuizJoin(existingWorkspace, request.body || {}, sessionAccount);
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Live quiz participation could not be saved.');
            return;
        }
        const savedWorkspace = store.saveLmsLiveQuizWorkspace(resourceKey, merged.workspace);
        emitLiveQuizUpdate(request, resourceKey);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });

    app.post('/api/lms/live-quizzes/:resourceKey', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = requireLmsLiveQuizWorkspaceAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const store = getStore();
        const workspace = request.body?.workspace && typeof request.body.workspace === 'object' ? request.body.workspace : {};
        const role = getSessionRole(sessionAccount);
        const isStaff = staffRoles.has(role);
        const isStudent = role === 'student';
        if (!isStaff && !isStudent) {
            sendError(response, 403, 'You are not allowed to update this live quiz.');
            return;
        }
        const existingWorkspace = store.getLmsLiveQuizWorkspace(resourceKey) || { sessions: [] };
        let workspaceToSave = workspace;
        if (isStudent) {
            const merged = mergeStudentLiveQuizAnswer(existingWorkspace, workspace, sessionAccount);
            if (!merged?.workspace) {
                sendError(response, merged?.status || 400, merged?.error || 'Live quiz answer could not be saved.');
                return;
            }
            workspaceToSave = merged.workspace;
        } else if (isStaff) {
            workspaceToSave = mergeStaffLiveQuizWorkspace(existingWorkspace, workspace);
        }
        const savedWorkspace = store.saveLmsLiveQuizWorkspace(resourceKey, workspaceToSave);
        emitLiveQuizUpdate(request, resourceKey);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });
}

module.exports = {
    registerLmsLiveQuizRoutes
};
