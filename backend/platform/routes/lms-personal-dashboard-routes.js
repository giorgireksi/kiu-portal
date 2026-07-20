function registerLmsPersonalDashboardRoutes(app, deps = {}) {
    const {
        getSessionRole,
        resolveSessionActorAccount,
        getStore,
        mergePersonalDashboardWorkspace,
        savePersonalDashboardSnapshot,
        deletePersonalDashboardSnapshot,
        restorePersonalDashboardSnapshot,
        updatePersonalDashboardSnapshotShare,
        updatePersonalDashboardWorkspaceShare,
        updatePersonalDashboardPeerShares,
        listPersonalDashboardHistory,
        listPersonalDashboardSharedHistory,
        listPersonalDashboardShareStatus,
        listPersonalDashboardSharedWithMe,
        requireLmsLiveQuizWorkspaceAccess,
        sendError,
        stripLmsPersonalBoardScopeKey,
        isLmsPersonalBoardKey,
        isLmsStaffRole
    } = deps;

    function resolvePersonalDashboardAccess(request, response, resourceKey, action = 'read') {
        const key = String(resourceKey || '').trim();
        if (!isLmsPersonalBoardKey(key)) {
            sendError(response, 400, 'Personal dashboard key is required.');
            return null;
        }
        const { scopeKey } = stripLmsPersonalBoardScopeKey(key);
        return requireLmsLiveQuizWorkspaceAccess(request, response, scopeKey, action);
    }

    function actorAccount(sessionAccount) {
        return typeof resolveSessionActorAccount === 'function'
            ? resolveSessionActorAccount(sessionAccount)
            : (sessionAccount?.account || sessionAccount || {});
    }

    function resolvePersonalDashboardHistoryAccess(request, response, courseId = '', options = {}) {
        const normalizedCourseId = String(courseId || '').trim();
        if (!normalizedCourseId) {
            sendError(response, 400, 'Course id is required.');
            return null;
        }
        const groupId = String(options.groupId || '').trim();
        const accessScopeKey = groupId ? `${normalizedCourseId}::${groupId}` : normalizedCourseId;
        return requireLmsLiveQuizWorkspaceAccess(request, response, accessScopeKey, 'read');
    }

    app.get('/api/lms/personal-dashboards/history', (request, response) => {
        const courseId = String(request.query?.courseId || '').trim();
        const groupId = String(request.query?.groupId || '').trim();
        const sectionType = String(request.query?.sectionType || '').trim();
        const studentId = String(request.query?.studentId || '').trim();
        const sessionAccount = resolvePersonalDashboardHistoryAccess(request, response, courseId, { groupId });
        if (!sessionAccount) return;
        const account = actorAccount(sessionAccount);
        const actorId = String(account?.id || account?.userId || '').trim();
        const role = getSessionRole(sessionAccount);
        const listOptions = groupId && sectionType ? { groupId, sectionType } : {};
        let listed;
        if (studentId) {
            if (!isLmsStaffRole(role)) {
                sendError(response, 403, 'Only staff can view another student workspace history.');
                return;
            }
            listed = listPersonalDashboardSharedHistory(getStore(), courseId, studentId, listOptions);
        } else {
            listed = listPersonalDashboardHistory(getStore(), courseId, actorId, listOptions);
        }
        if (!listed?.ok) {
            sendError(response, listed?.status || 400, listed?.error || 'History could not be loaded.');
            return;
        }
        response.json(listed);
    });

    app.get('/api/lms/personal-dashboards/share-status', (request, response) => {
        const courseId = String(request.query?.courseId || '').trim();
        const groupId = String(request.query?.groupId || '').trim();
        const sectionType = String(request.query?.sectionType || '').trim();
        const sessionAccount = resolvePersonalDashboardHistoryAccess(request, response, courseId, { groupId });
        if (!sessionAccount) return;
        const role = getSessionRole(sessionAccount);
        if (!isLmsStaffRole(role)) {
            sendError(response, 403, 'Only staff can view student workspace share status.');
            return;
        }
        const listed = listPersonalDashboardShareStatus(getStore(), courseId, { groupId, sectionType });
        if (!listed?.ok) {
            sendError(response, listed?.status || 400, listed?.error || 'Share status could not be loaded.');
            return;
        }
        response.json(listed);
    });

    app.get('/api/lms/personal-dashboards/shared-with-me', (request, response) => {
        const courseId = String(request.query?.courseId || '').trim();
        const groupId = String(request.query?.groupId || '').trim();
        const sectionType = String(request.query?.sectionType || '').trim();
        const sessionAccount = resolvePersonalDashboardHistoryAccess(request, response, courseId, { groupId });
        if (!sessionAccount) return;
        const account = actorAccount(sessionAccount);
        const actorId = String(account?.id || account?.userId || '').trim();
        if (!actorId || typeof listPersonalDashboardSharedWithMe !== 'function') {
            sendError(response, 400, 'Shared boards could not be loaded.');
            return;
        }
        const listed = listPersonalDashboardSharedWithMe(getStore(), courseId, actorId, { groupId, sectionType });
        if (!listed?.ok) {
            sendError(response, listed?.status || 400, listed?.error || 'Shared boards could not be loaded.');
            return;
        }
        response.json(listed);
    });

    app.patch('/api/lms/personal-dashboards/:resourceKey/share', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolvePersonalDashboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { resourceKey };
        const merged = updatePersonalDashboardWorkspaceShare(
            existingWorkspace,
            request.body || {},
            actorAccount(sessionAccount)
        );
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Workspace sharing could not be updated.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, merged.workspace);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });

    app.patch('/api/lms/personal-dashboards/:resourceKey/snapshots/:snapshotId/share', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const snapshotId = String(request.params.snapshotId || '').trim();
        const sessionAccount = resolvePersonalDashboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { resourceKey };
        const merged = updatePersonalDashboardSnapshotShare(
            existingWorkspace,
            snapshotId,
            request.body || {},
            actorAccount(sessionAccount)
        );
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Snapshot sharing could not be updated.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, merged.workspace);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace,
            snapshot: merged.snapshot
        });
    });

    app.patch('/api/lms/personal-dashboards/:resourceKey/peer-shares', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolvePersonalDashboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        if (typeof updatePersonalDashboardPeerShares !== 'function') {
            sendError(response, 500, 'Peer sharing is unavailable.');
            return;
        }
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { resourceKey };
        const merged = updatePersonalDashboardPeerShares(
            existingWorkspace,
            request.body || {},
            actorAccount(sessionAccount)
        );
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Peer sharing could not be updated.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, merged.workspace);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });

    app.post('/api/lms/personal-dashboards/:resourceKey/snapshots', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolvePersonalDashboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { resourceKey };
        const merged = savePersonalDashboardSnapshot(existingWorkspace, request.body || {}, actorAccount(sessionAccount));
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Snapshot could not be saved.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, merged.workspace);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace,
            snapshot: merged.snapshot
        });
    });

    app.delete('/api/lms/personal-dashboards/:resourceKey/snapshots/:snapshotId', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const snapshotId = String(request.params.snapshotId || '').trim();
        const sessionAccount = resolvePersonalDashboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { resourceKey };
        const merged = deletePersonalDashboardSnapshot(existingWorkspace, snapshotId, actorAccount(sessionAccount));
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Snapshot could not be deleted.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, merged.workspace);
        response.json({ ok: true, resourceKey, workspace: savedWorkspace });
    });

    app.post('/api/lms/personal-dashboards/:resourceKey/snapshots/:snapshotId/restore', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const snapshotId = String(request.params.snapshotId || '').trim();
        const body = request.body && typeof request.body === 'object' ? request.body : {};
        const sourceResourceKey = String(body.sourceResourceKey || resourceKey).trim();
        const targetResourceKey = String(body.targetResourceKey || resourceKey).trim();
        const sessionAccount = resolvePersonalDashboardAccess(request, response, targetResourceKey, 'write');
        if (!sessionAccount) return;
        if (sourceResourceKey !== targetResourceKey) {
            const sourceAccess = resolvePersonalDashboardAccess(request, response, sourceResourceKey, 'read');
            if (!sourceAccess) return;
        }
        const store = getStore();
        const sourceWorkspace = store.getLmsWhiteboardWorkspace(sourceResourceKey) || { resourceKey: sourceResourceKey };
        const targetExisting = store.getLmsWhiteboardWorkspace(targetResourceKey) || { resourceKey: targetResourceKey };
        const merged = restorePersonalDashboardSnapshot(targetExisting, snapshotId, actorAccount(sessionAccount), {
            sourceResourceKey,
            targetResourceKey,
            sourceWorkspace,
            targetWorkspace: targetExisting,
            role: getSessionRole(sessionAccount)
        });
        if (!merged?.workspace) {
            sendError(response, merged?.status || 404, merged?.error || 'Snapshot could not be restored.');
            return;
        }
        const role = getSessionRole(sessionAccount);
        const workspaceToSave = mergePersonalDashboardWorkspace(
            targetExisting,
            merged.workspace,
            actorAccount(sessionAccount),
            role
        );
        if (!workspaceToSave?.workspace) {
            sendError(response, workspaceToSave?.status || 400, workspaceToSave?.error || 'Snapshot restore could not be saved.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(targetResourceKey, workspaceToSave.workspace);
        response.json({
            ok: true,
            resourceKey: targetResourceKey,
            sourceResourceKey,
            workspace: savedWorkspace,
            snapshot: merged.snapshot
        });
    });
}

module.exports = {
    registerLmsPersonalDashboardRoutes
};