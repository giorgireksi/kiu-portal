function registerLmsLiveQuizRoutes(app, deps = {}) {
    const {
        broadcastAll,
        getSessionRole,
        getStore,
        mergeStudentLiveQuizAnswer,
        requireLmsLiveQuizWorkspaceAccess,
        sendError,
        staffRoles
    } = deps;

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
        let workspaceToSave = workspace;
        if (isStudent) {
            const existingWorkspace = store.getLmsLiveQuizWorkspace(resourceKey) || { sessions: [] };
            const merged = mergeStudentLiveQuizAnswer(existingWorkspace, workspace, sessionAccount);
            if (!merged?.workspace) {
                sendError(response, merged?.status || 400, merged?.error || 'Live quiz answer could not be saved.');
                return;
            }
            workspaceToSave = merged.workspace;
        }
        const savedWorkspace = store.saveLmsLiveQuizWorkspace(resourceKey, workspaceToSave);
        const emittedAt = new Date().toISOString();
        broadcastAll({
            type: 'lms-live-quiz:updated',
            resourceKey,
            reason: String(request.body?.reason || '').trim(),
            emittedAt
        });
        broadcastAll({ type: 'portal:state-upsert', emittedAt });
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
