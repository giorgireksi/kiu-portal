function registerLmsWhiteboardRoutes(app, deps = {}) {
    const {
        broadcastAll,
        getSessionRole,
        resolveSessionActorAccount,
        getStore,
        requireSessionAccount,
        mergeStaffWhiteboardWorkspace,
        mergeStudentWhiteboardWorkspace,
        mergeStudentWhiteboardOps,
        mergePersonalDashboardWorkspace,
        requireLmsLiveQuizWorkspaceAccess,
        sendError,
        staffRoles,
        stripLmsPersonalBoardScopeKey,
        isLmsPersonalBoardKey,
        assertLmsPersonalBoardReadAccess,
        assertLmsPersonalBoardWriteAccess,
        redactPersonalWorkspaceForStaffViewer,
        redactPersonalWorkspaceForViewer,
        parsePersonalScopeMeta
    } = deps;

    function resolveWhiteboardAccess(request, response, resourceKey, action = 'read') {
        const key = String(resourceKey || '').trim();
        const { scopeKey, isPersonal } = stripLmsPersonalBoardScopeKey(key);
        if (!isPersonal) return requireLmsLiveQuizWorkspaceAccess(request, response, scopeKey, action);

        // A student's personal board is self-service and must remain writable even
        // when the student has no currently active class-session enrollment. Shared
        // viewers still go through the normal course-scope guard below.
        const sessionAccount = requireSessionAccount(request, response);
        if (!sessionAccount) return null;
        const account = typeof resolveSessionActorAccount === 'function'
            ? resolveSessionActorAccount(sessionAccount)
            : (sessionAccount.account || sessionAccount);
        const role = getSessionRole(sessionAccount);
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(key) || { resourceKey: key };
        const access = action === 'write'
            ? assertLmsPersonalBoardWriteAccess(key, account, role, existingWorkspace)
            : assertLmsPersonalBoardReadAccess(key, account, role, existingWorkspace);
        if (access.ok && access.isOwner) return { ...sessionAccount, personalAccess: access };

        const scopedSession = requireLmsLiveQuizWorkspaceAccess(request, response, scopeKey, action);
        if (!scopedSession) return null;
        const scopedAccess = action === 'write'
            ? assertLmsPersonalBoardWriteAccess(key, account, role, existingWorkspace)
            : assertLmsPersonalBoardReadAccess(key, account, role, existingWorkspace);
        if (!scopedAccess.ok) {
            sendError(response, scopedAccess.status, scopedAccess.error);
            return null;
        }
        return { ...scopedSession, personalAccess: scopedAccess };
    }

    function emitWhiteboardUpdate(request, resourceKey) {
        if (isLmsPersonalBoardKey(resourceKey)) return;
        const emittedAt = new Date().toISOString();
        broadcastAll({
            type: 'lms-whiteboard:updated',
            resourceKey,
            reason: String(request.body?.reason || '').trim(),
            emittedAt
        });
        broadcastAll({ type: 'portal:state-upsert', emittedAt });
    }

    function emitWhiteboardSignal(resourceKey, signal = {}, sessionAccount = {}) {
        if (isLmsPersonalBoardKey(resourceKey)) return;
        const emittedAt = new Date().toISOString();
        const actorAccount = typeof resolveSessionActorAccount === 'function'
            ? resolveSessionActorAccount(sessionAccount)
            : (sessionAccount?.account || sessionAccount);
        const userId = String(actorAccount?.id || actorAccount?.userId || '').trim();
        broadcastAll({
            type: 'lms-whiteboard:signal',
            resourceKey,
            signal: {
                ...signal,
                userId: String(signal.userId || userId).trim(),
                emittedAt
            },
            emittedAt
        });
    }

    app.get('/api/lms/whiteboards/:resourceKey', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolveWhiteboardAccess(request, response, resourceKey, 'read');
        if (!sessionAccount) return;
        const store = getStore();
        let workspace = store.getLmsWhiteboardWorkspace(resourceKey) || { resourceKey };
        if (isLmsPersonalBoardKey(resourceKey) && sessionAccount.personalAccess && !sessionAccount.personalAccess.isOwner) {
            const meta = typeof parsePersonalScopeMeta === 'function'
                ? parsePersonalScopeMeta(resourceKey)
                : { groupId: '', sectionType: '' };
            const scope = { groupId: meta.groupId, sectionType: meta.sectionType };
            const shareLevel = sessionAccount.personalAccess.shareLevel
                || sessionAccount.personalAccess.staffShareLevel
                || 'view';
            workspace = typeof redactPersonalWorkspaceForViewer === 'function'
                ? redactPersonalWorkspaceForViewer(workspace, scope, shareLevel)
                : redactPersonalWorkspaceForStaffViewer(workspace, scope);
        }
        response.json({
            ok: true,
            resourceKey,
            workspace
        });
    });

    app.post('/api/lms/whiteboards/:resourceKey/signal', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolveWhiteboardAccess(request, response, resourceKey, 'read');
        if (!sessionAccount) return;
        const signal = request.body?.signal && typeof request.body.signal === 'object'
            ? request.body.signal
            : {};
        const signalType = String(signal.type || signal.signalType || '').trim().toLowerCase();
        if (!['cursor', 'laser', 'viewport'].includes(signalType)) {
            sendError(response, 400, 'Unsupported whiteboard signal type.');
            return;
        }
        if (signalType === 'laser' && !staffRoles.has(getSessionRole(sessionAccount))) {
            sendError(response, 403, 'Only staff can broadcast a laser pointer.');
            return;
        }
        const actorAccount = typeof resolveSessionActorAccount === 'function'
            ? resolveSessionActorAccount(sessionAccount)
            : (sessionAccount.account || sessionAccount);
        emitWhiteboardSignal(resourceKey, {
            type: signalType,
            x: Number(signal.x) || 0,
            y: Number(signal.y) || 0,
            zoom: Number(signal.zoom) || 0,
            panX: Number(signal.panX) || 0,
            panY: Number(signal.panY) || 0,
            displayName: String(signal.displayName || actorAccount?.name || actorAccount?.fullName || '').trim(),
            userId: String(signal.userId || actorAccount?.id || actorAccount?.userId || '').trim()
        }, sessionAccount);
        response.json({ ok: true, resourceKey });
    });

    app.post('/api/lms/whiteboards/:resourceKey/ops', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolveWhiteboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const role = getSessionRole(sessionAccount);
        if (!isLmsPersonalBoardKey(resourceKey) && staffRoles.has(role)) {
            sendError(response, 403, 'Staff should use the full whiteboard sync endpoint.');
            return;
        }
        if (!isLmsPersonalBoardKey(resourceKey) && role !== 'student') {
            sendError(response, 403, 'You are not allowed to update this whiteboard.');
            return;
        }
        const store = getStore();
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { elements: [] };
        const actorAccount = typeof resolveSessionActorAccount === 'function'
            ? resolveSessionActorAccount(sessionAccount)
            : (sessionAccount.account || sessionAccount);
        const merged = mergeStudentWhiteboardOps(existingWorkspace, request.body?.ops || [], actorAccount);
        if (!merged?.workspace) {
            sendError(response, merged?.status || 400, merged?.error || 'Whiteboard update could not be saved.');
            return;
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, merged.workspace);
        emitWhiteboardUpdate(request, resourceKey);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });

    app.post('/api/lms/whiteboards/:resourceKey', (request, response) => {
        const resourceKey = String(request.params.resourceKey || '').trim();
        const sessionAccount = resolveWhiteboardAccess(request, response, resourceKey, 'write');
        if (!sessionAccount) return;
        const store = getStore();
        const workspace = request.body?.workspace && typeof request.body.workspace === 'object' ? request.body.workspace : {};
        const role = getSessionRole(sessionAccount);
        const isStaff = staffRoles.has(role);
        const isStudent = role === 'student';
        const isPersonal = isLmsPersonalBoardKey(resourceKey);
        if (!isStaff && !isStudent) {
            sendError(response, 403, 'You are not allowed to update this whiteboard.');
            return;
        }
        const existingWorkspace = store.getLmsWhiteboardWorkspace(resourceKey) || { elements: [] };
        let workspaceToSave = workspace;
        const actorAccount = typeof resolveSessionActorAccount === 'function'
            ? resolveSessionActorAccount(sessionAccount)
            : (sessionAccount.account || sessionAccount);
        if (isPersonal && typeof mergePersonalDashboardWorkspace === 'function') {
            const merged = mergePersonalDashboardWorkspace(existingWorkspace, workspace, actorAccount, role);
            if (!merged?.workspace) {
                sendError(response, merged?.status || 400, merged?.error || 'Personal workspace update could not be saved.');
                return;
            }
            workspaceToSave = merged.workspace;
        } else if (isStudent) {
            const merged = mergeStudentWhiteboardWorkspace(existingWorkspace, workspace, actorAccount);
            if (!merged?.workspace) {
                sendError(response, merged?.status || 400, merged?.error || 'Whiteboard update could not be saved.');
                return;
            }
            workspaceToSave = merged.workspace;
        } else if (isStaff) {
            workspaceToSave = mergeStaffWhiteboardWorkspace(existingWorkspace, workspace, actorAccount);
        }
        const savedWorkspace = store.saveLmsWhiteboardWorkspace(resourceKey, workspaceToSave);
        emitWhiteboardUpdate(request, resourceKey);
        response.json({
            ok: true,
            resourceKey,
            workspace: savedWorkspace
        });
    });
}

module.exports = {
    registerLmsWhiteboardRoutes
};