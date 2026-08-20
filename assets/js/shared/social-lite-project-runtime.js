/* Social lite project membership/tasks/budget/risks helpers.
 * Peeled from social-runtime-lite.js. Load before social-runtime-lite.js.
 */
(function initSocialLiteProjectRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_LITE_PROJECT_LOADED) return;
    window.__KIU_SOCIAL_LITE_PROJECT_LOADED = true;

    window.__kiuCreateSocialLiteProjectApi = function createKiuSocialLiteProjectApi(deps = {}) {
        const d = deps;
        function __dep(name) {
            return function (...a) {
                const fn = d[name] || window[name];
                if (typeof fn !== 'function') throw new Error('Missing social lite project dep: ' + name);
                return fn.apply(this, a);
            };
        }
        const currentUserId = __dep('currentUserId');
        const text = __dep('text');
        const portalRequest = __dep('portalRequest');
        const hydrateRuntime = __dep('hydrateRuntime');
        const setFlash = __dep('setFlash');
        const runtime = d.runtime || window.__kiuSocialLiteRuntime;

async function inviteProjectMember(projectId, memberId, role = 'member') {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(memberId)) throw new Error('Project invitation could not be sent.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/invite`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            memberId: text(memberId),
            role: text(role || 'member') || 'member'
        })
    });
    await hydrateRuntime(true);
    setFlash('Project invitation sent.', 'success', { skipRender: true });
    return payload?.project || null;
}

async function updateProjectMemberRole(projectId, memberId, role = 'member') {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(memberId)) throw new Error('Project member role could not be updated.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/members/${encodeURIComponent(text(memberId))}`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            role: text(role || 'member') || 'member'
        })
    });
    await hydrateRuntime(true);
    return payload?.project || null;
}

async function removeProjectMember(projectId, memberId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(memberId)) throw new Error('Project member could not be removed.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/members/${encodeURIComponent(text(memberId))}?actorId=${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    return payload?.project || null;
}

async function setProjectMembership(projectId, action = 'leave', userId = '') {
    const actorId = currentUserId();
    const targetUserId = text(userId || actorId);
    if (!actorId || !text(projectId) || !targetUserId) throw new Error('Project membership could not be updated.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/membership`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            userId: targetUserId,
            action: text(action || 'leave') || 'leave'
        })
    });
    await hydrateRuntime(true);
    setFlash(text(action || 'leave') === 'leave' ? 'Workspace left.' : 'Project membership updated.', 'success', { skipRender: true });
    return payload?.project || null;
}

/**
 * @param {object} [options]
 * @param {boolean} [options.silent] - skip hydrate + full-page queueRender (graph quick-add)
 */
async function createProjectTask(projectId, input = {}, options = {}) {
    const actorId = currentUserId();
    const resolvedProjectId = text(projectId || input.projectId);
    if (!actorId || !resolvedProjectId) throw new Error('Project task could not be created.');
    const priorityModel = text(input.priorityModel || 'manual') === 'matrix' ? 'matrix' : 'manual';
    const impactScore = Math.max(1, Math.min(5, Math.round(Number(input.impactScore) || 3)));
    const effortScore = Math.max(1, Math.min(5, Math.round(Number(input.effortScore) || 3)));
    let priority = text(input.priority || 'medium') || 'medium';
    if (priorityModel === 'matrix') {
        const score = impactScore * (6 - effortScore);
        priority = score >= 20 ? 'urgent' : score >= 15 ? 'high' : score >= 8 ? 'medium' : 'low';
    }
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(resolvedProjectId)}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            title: text(input.title),
            description: text(input.description),
            status: text(input.status || 'todo') || 'todo',
            assigneeUserId: text(input.assigneeUserId || ''),
            startAt: text(input.startAt || ''),
            dueAt: text(input.dueAt || ''),
            priority,
            priorityModel,
            impactScore,
            effortScore,
            budgetEstimate: Number.isFinite(Number(input.budgetEstimate)) ? Math.max(0, Math.round(Number(input.budgetEstimate) * 100) / 100) : 0,
            timeEstimate: Number.isFinite(Number(input.timeEstimate)) && Number(input.timeEstimate) > 0 ? Math.round(Number(input.timeEstimate) * 10) / 10 : 0,
            timeOptimistic: Number.isFinite(Number(input.timeOptimistic)) && Number(input.timeOptimistic) > 0 ? Math.round(Number(input.timeOptimistic) * 10) / 10 : 0,
            timeMostLikely: Number.isFinite(Number(input.timeMostLikely)) && Number(input.timeMostLikely) > 0 ? Math.round(Number(input.timeMostLikely) * 10) / 10 : 0,
            timePessimistic: Number.isFinite(Number(input.timePessimistic)) && Number(input.timePessimistic) > 0 ? Math.round(Number(input.timePessimistic) * 10) / 10 : 0,
            timeUnit: text(input.timeUnit).toLowerCase() === 'd' ? 'd' : 'h',
            isMilestone: Boolean(input.isMilestone),
            actualTime: Number.isFinite(Number(input.actualTime)) && Number(input.actualTime) > 0 ? Math.round(Number(input.actualTime) * 10) / 10 : 0,
            actualCost: Number.isFinite(Number(input.actualCost)) ? Math.max(0, Math.round(Number(input.actualCost) * 100) / 100) : 0,
            checklist: Array.isArray(input.checklist) ? input.checklist : [],
            dependsOnTaskIds: Array.isArray(input.dependsOnTaskIds) ? input.dependsOnTaskIds : []
        })
    });
    const task = payload?.task || null;
    if (task) applyProjectTaskLocally(resolvedProjectId, task);
    // Graph quick-add uses silent:true so hydrate does not remount the task map (flicker).
    if (options && options.silent) return task;
    await hydrateRuntime(true);
    return task;
}

function applyProjectTaskLocally(projectId, task) {
    const normalizedProjectId = text(projectId);
    const nextTask = task && typeof task === 'object' ? task : null;
    const taskId = text(nextTask?.id);
    if (!normalizedProjectId || !taskId || !runtime.social) return null;
    const projects = Array.isArray(runtime.social.projects) ? runtime.social.projects : [];
    const project = projects.find((entry) => text(entry?.id) === normalizedProjectId);
    if (!project) return null;
    if (!Array.isArray(project.tasks)) project.tasks = [];
    const index = project.tasks.findIndex((entry) => text(entry?.id) === taskId);
    if (index >= 0) {
        project.tasks[index] = { ...project.tasks[index], ...nextTask };
    } else {
        project.tasks.push(nextTask);
    }
    return project.tasks[index >= 0 ? index : project.tasks.length - 1];
}

/**
 * @param {object} [options]
 * @param {boolean} [options.silent] - skip hydrate + full-page queueRender (graph live edits)
 */
async function updateProjectTask(projectId, taskId, input = {}, options = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(taskId)) throw new Error('Project task could not be updated.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/tasks/${encodeURIComponent(text(taskId))}`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            ...input
        })
    });
    const task = payload?.task || null;
    if (task) {
        applyProjectTaskLocally(projectId, task);
    } else if (options && options.silent) {
        // Keep local graph state correct even if API omits the task body.
        applyProjectTaskLocally(projectId, { id: text(taskId), ...input });
    }
    // Graph dependency edits use silent:true so hydrate does not remount the task map (flicker).
    if (options && options.silent) return task || { id: text(taskId), ...input };
    await hydrateRuntime(true);
    return task;
}

function projectTaskProofItems(projectId, taskId) {
    const project = (Array.isArray(runtime?.social?.projects) ? runtime.social.projects : [])
        .find((entry) => text(entry?.id) === text(projectId));
    const task = (Array.isArray(project?.tasks) ? project.tasks : [])
        .find((entry) => text(entry?.id) === text(taskId));
    return Array.isArray(task?.proofItems) ? task.proofItems.filter((item) => item && typeof item === 'object') : [];
}

function isProjectTaskProofImage(file) {
    if (!file) return false;
    const type = text(file.type || '').toLowerCase();
    const name = text(file.name || '').toLowerCase();
    return /^image\/(jpe?g|png|webp|gif)$/i.test(type)
        || /\.(jpe?g|png|webp|gif)$/i.test(name);
}

async function addProjectTaskProof(projectId, taskId, files, options = {}) {
    const resolvedProjectId = text(projectId);
    const resolvedTaskId = text(taskId);
    const actorId = currentUserId();
    if (!actorId || !resolvedProjectId || !resolvedTaskId) throw new Error('Task proof could not be uploaded.');
    const selectedFiles = Array.from(files || []).filter(Boolean);
    if (!selectedFiles.length) return null;
    const existing = projectTaskProofItems(resolvedProjectId, resolvedTaskId);
    if (existing.length >= 12) throw new Error('This task already has the maximum of 12 proof images.');
    const accepted = selectedFiles.slice(0, 12 - existing.length);
    const next = existing.slice();
    const rejected = [];
    for (const file of accepted) {
        if (!isProjectTaskProofImage(file) || Number(file.size || 0) > 10 * 1024 * 1024) {
            rejected.push(text(file.name || 'Selected file'));
            continue;
        }
        if (typeof window.uploadPortalStoredFile !== 'function') throw new Error('Image storage is unavailable.');
        const uploaded = await window.uploadPortalStoredFile(file, 'project-task-proof');
        if (!uploaded?.storageKey) {
            rejected.push(text(file.name || 'Selected file'));
            continue;
        }
        next.push({
            id: text(uploaded.storageKey),
            storageKey: text(uploaded.storageKey),
            storageBackend: 'bridge',
            name: text(uploaded.name || file.name || 'Proof image'),
            type: text(uploaded.type || file.type || 'image/jpeg').toLowerCase(),
            size: Number(uploaded.size || file.size || 0) || 0,
            uploadedAt: text(uploaded.uploadedAt || new Date().toISOString()),
            uploadedBy: actorId,
            note: '',
            sortOrder: next.length
        });
    }
    if (rejected.length && typeof setFlash === 'function') {
        setFlash(`Skipped: ${rejected.join(', ')}. Use an image up to 10 MB.`, 'danger', { skipRender: true });
    }
    if (next.length === existing.length) return null;
    const task = await updateProjectTask(resolvedProjectId, resolvedTaskId, { proofItems: next }, { silent: true });
    if (!(options && options.silent)) await hydrateRuntime(true);
    return task;
}

async function updateProjectTaskProofNote(projectId, taskId, proofId, note, options = {}) {
    const items = projectTaskProofItems(projectId, taskId);
    const id = text(proofId);
    if (!id || !items.some((item) => text(item.id || item.storageKey) === id)) return null;
    const next = items.map((item) => text(item.id || item.storageKey) === id
        ? { ...item, note: text(note || '').slice(0, 1000) }
        : item);
    const task = await updateProjectTask(projectId, taskId, { proofItems: next }, { silent: true });
    if (!(options && options.silent)) await hydrateRuntime(true);
    return task;
}

async function removeProjectTaskProof(projectId, taskId, proofId, options = {}) {
    const id = text(proofId);
    const next = projectTaskProofItems(projectId, taskId).filter((item) => text(item.id || item.storageKey) !== id);
    if (!id || next.length === projectTaskProofItems(projectId, taskId).length) return null;
    const task = await updateProjectTask(projectId, taskId, { proofItems: next }, { silent: true });
    if (!(options && options.silent)) await hydrateRuntime(true);
    return task;
}

async function deleteProjectTask(projectId, taskId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(taskId)) throw new Error('Project task could not be deleted.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/tasks/${encodeURIComponent(text(taskId))}?actorId=${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    return payload || null;
}

async function createProjectBudgetCategory(projectId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project budget category could not be created.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-categories`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            title: text(input.title || ''),
            description: text(input.description || ''),
            plannedAmount: Number(input.plannedAmount || 0) || 0,
            color: text(input.color || ''),
            sortOrder: Number(input.sortOrder || 0) || 0
        })
    });
    await hydrateRuntime(true);
    return payload?.category || null;
}

async function updateProjectBudgetCategory(projectId, categoryId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(categoryId)) throw new Error('Project budget category could not be updated.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-categories/${encodeURIComponent(text(categoryId))}`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            title: text(input.title || ''),
            description: text(input.description || ''),
            plannedAmount: Number(input.plannedAmount || 0) || 0,
            color: text(input.color || ''),
            sortOrder: Number(input.sortOrder || 0) || 0
        })
    });
    await hydrateRuntime(true);
    return payload?.category || null;
}

async function deleteProjectBudgetCategory(projectId, categoryId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(categoryId)) throw new Error('Project budget category could not be deleted.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-categories/${encodeURIComponent(text(categoryId))}?actorId=${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    return payload || null;
}

async function createProjectBudgetExpense(projectId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project budget expense could not be created.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-expenses`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            categoryId: text(input.categoryId || ''),
            title: text(input.title || ''),
            description: text(input.description || ''),
            amount: Number(input.amount || 0) || 0,
            currency: text(input.currency || ''),
            status: text(input.status || 'draft') || 'draft',
            incurredAt: text(input.incurredAt || '')
        })
    });
    await hydrateRuntime(true);
    return payload?.expense || null;
}

async function updateProjectBudgetExpense(projectId, expenseId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(expenseId)) throw new Error('Project budget expense could not be updated.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-expenses/${encodeURIComponent(text(expenseId))}`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            categoryId: text(input.categoryId || ''),
            title: text(input.title || ''),
            description: text(input.description || ''),
            amount: Number(input.amount || 0) || 0,
            currency: text(input.currency || ''),
            status: text(input.status || ''),
            incurredAt: text(input.incurredAt || '')
        })
    });
    await hydrateRuntime(true);
    return payload?.expense || null;
}

async function deleteProjectBudgetExpense(projectId, expenseId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(expenseId)) throw new Error('Project budget expense could not be deleted.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-expenses/${encodeURIComponent(text(expenseId))}?actorId=${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    return payload || null;
}

async function createProjectRisk(projectId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project risk could not be created.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/risks`, {
        method: 'POST',
        body: JSON.stringify({
            actorId,
            groupId: text(input.groupId || ''),
            title: text(input.title || ''),
            description: text(input.description || ''),
            likelihood: (() => {
                const raw = text(input.likelihood ?? '3');
                if (raw === 'low') return 1;
                if (raw === 'medium' || raw === 'med') return 3;
                if (raw === 'high') return 5;
                const n = Math.round(Number(raw));
                return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 3;
            })(),
            impact: (() => {
                const raw = text(input.impact ?? '3');
                if (raw === 'low') return 1;
                if (raw === 'medium' || raw === 'med') return 3;
                if (raw === 'high') return 5;
                const n = Math.round(Number(raw));
                return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 3;
            })(),
            status: text(input.status || 'open') || 'open',
            response: text(input.response || 'mitigate') || 'mitigate',
            ownerUserId: text(input.ownerUserId || ''),
            mitigation: text(input.mitigation || ''),
            linkedTaskIds: Array.isArray(input.linkedTaskIds) ? input.linkedTaskIds.map((id) => text(id)).filter(Boolean) : []
        })
    });
    await hydrateRuntime(true);
    return payload?.risk || null;
}

async function updateProjectRisk(projectId, riskId, input = {}) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(riskId)) throw new Error('Project risk could not be updated.');
    const body = {
        actorId,
        groupId: text(input.groupId || ''),
        title: text(input.title || ''),
        description: text(input.description || ''),
        likelihood: text(input.likelihood || '') || undefined,
        impact: text(input.impact || '') || undefined,
        status: text(input.status || '') || undefined,
        response: text(input.response || '') || undefined,
        ownerUserId: text(input.ownerUserId || ''),
        mitigation: text(input.mitigation || '')
    };
    if (Array.isArray(input.linkedTaskIds)) {
        body.linkedTaskIds = input.linkedTaskIds.map((id) => text(id)).filter(Boolean);
    }
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/risks/${encodeURIComponent(text(riskId))}`, {
        method: 'POST',
        body: JSON.stringify(body)
    });
    await hydrateRuntime(true);
    return payload?.risk || null;
}

async function deleteProjectRisk(projectId, riskId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId) || !text(riskId)) throw new Error('Project risk could not be deleted.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/risks/${encodeURIComponent(text(riskId))}?actorId=${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    return payload || null;
}

async function publishProjectShowcase(projectId) {
    const actorId = currentUserId();
    if (!actorId || !text(projectId)) throw new Error('Project showcase could not be published.');
    const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/showcase`, {
        method: 'POST',
        body: JSON.stringify({ actorId })
    });
    await hydrateRuntime(true);
    setFlash('Project showcase published.', 'success', { skipRender: true });
    return payload?.project || null;
}

        const api = {
            inviteProjectMember,
            updateProjectMemberRole,
            removeProjectMember,
            setProjectMembership,
            createProjectTask,
            applyProjectTaskLocally,
            updateProjectTask,
            addProjectTaskProof,
            updateProjectTaskProofNote,
            removeProjectTaskProof,
            addPortalSocialProjectTaskProof: addProjectTaskProof,
            updatePortalSocialProjectTaskProofNote: updateProjectTaskProofNote,
            removePortalSocialProjectTaskProof: removeProjectTaskProof,
            deleteProjectTask,
            createProjectBudgetCategory,
            updateProjectBudgetCategory,
            deleteProjectBudgetCategory,
            createProjectBudgetExpense,
            updateProjectBudgetExpense,
            deleteProjectBudgetExpense,
            createProjectRisk,
            updateProjectRisk,
            deleteProjectRisk,
            publishProjectShowcase,
        };
        Object.assign(window, api);
        return api;
    };
})();
