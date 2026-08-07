const {
    asArray,
    clone,
    makeId,
    normalizeCode,
    nowIso,
    safeNumber,
    uniqueStrings
} = require('../utils');

function socialText(value) {
    return String(value || '').trim();
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function normalizeSocialVisibility(value, fallback = 'public') {
    const normalized = socialText(value).toLowerCase();
    if (['public', 'private', 'faculty'].includes(normalized)) return normalized;
    return socialText(fallback).toLowerCase() || 'public';
}

function socialIdArray(values) {
    return uniqueStrings(
        asArray(values)
            .map(value => {
                if (value && typeof value === 'object') return socialText(value.id || value.userId || value.value);
                return socialText(value);
            })
            .filter(Boolean)
    );
}

function normalizeProjectStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['idea', 'active', 'review', 'completed', 'draft', 'published'].includes(normalized)) return normalized;
    return 'idea';
}

function normalizeProjectVisibilityMode(value, fallback = 'all_logged_in') {
    const normalized = socialText(value).toLowerCase();
    if ([
        'all_logged_in',
        'students_only',
        'tas_only',
        'professors_only',
        'staff_only',
        'custom'
    ].includes(normalized)) return normalized;
    return fallback;
}

function projectLegacyVisibilityFromMode(mode, fallback = 'public') {
    const normalized = normalizeProjectVisibilityMode(mode, '');
    if (normalized === 'all_logged_in') return 'public';
    if (normalized === 'custom') return 'private';
    return 'faculty';
}

function fallbackProjectVisibilityMode(project = {}) {
    const visibility = normalizeSocialVisibility(project.visibility, 'private');
    if (visibility === 'public') return 'all_logged_in';
    if (visibility === 'faculty') return 'custom';
    return 'custom';
}

function normalizeSafeExternalUrl(value = '') {
    const raw = socialText(value);
    if (!raw) return '';
    if (/^(mailto:|tel:)/i.test(raw)) return raw;
    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch (error) {}
    return '';
}

function normalizePortfolioLinks(values) {
    return asArray(values)
        .map((item) => {
            if (item && typeof item === 'object') {
                const label = socialText(item.label || item.title || item.name || item.url);
                const url = normalizeSafeExternalUrl(item.url || item.href || '');
                if (!url) return null;
                return { label: label || url, url };
            }
            const url = normalizeSafeExternalUrl(item);
            if (!url) return null;
            return { label: url, url };
        })
        .filter(Boolean);
}

function normalizePortfolioMediaItems(values) {
    return asArray(values)
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const cloned = clone(item);
            const storageKey = socialText(cloned.storageKey || cloned.id || '');
            const dataUrl = socialText(cloned.dataUrl || '');
            if (!storageKey && !dataUrl) return null;
            return {
                ...cloned,
                id: socialText(cloned.id || storageKey || makeId('portfolio-media')),
                name: socialText(cloned.name || 'portfolio-file'),
                type: socialText(cloned.type || 'application/octet-stream'),
                storageKey,
                storageBackend: socialText(cloned.storageBackend || (storageKey ? 'bridge' : 'inline')),
                dataUrl
            };
        })
        .filter(Boolean);
}

function normalizeProjectRole(value) {
    const normalized = socialText(value).toLowerCase();
    if (['owner', 'member', 'advisor', 'instructor-viewer'].includes(normalized)) return normalized;
    return 'member';
}

function normalizeTaskStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (normalized === 'backlog') return 'todo';
    if (['todo', 'in-progress', 'blocked', 'done'].includes(normalized)) return normalized;
    return 'todo';
}

function normalizeTaskPriority(value) {
    const normalized = socialText(value).toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(normalized)) return normalized;
    return 'medium';
}

function normalizeTaskPriorityModel(value) {
    const normalized = socialText(value).toLowerCase();
    return normalized === 'matrix' ? 'matrix' : 'manual';
}

function normalizeTaskScore1to5(value, fallback = 3) {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return fallback;
    return Math.max(1, Math.min(5, num));
}

function computeTaskMatrixScore(impact, effort) {
    const i = normalizeTaskScore1to5(impact);
    const e = normalizeTaskScore1to5(effort);
    return i * (6 - e);
}

function computeTaskMatrixBucket(score) {
    const s = Number(score) || 0;
    if (s >= 20) return 'urgent';
    if (s >= 15) return 'high';
    if (s >= 8) return 'medium';
    return 'low';
}

function normalizeTaskBudgetEstimate(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.round(num * 100) / 100;
}

function normalizeTaskTimeEstimate(value) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? Math.round(num * 10) / 10 : 0;
}

function computeTaskPertExpected(optimistic, mostLikely, pessimistic) {
    const o = normalizeTaskTimeEstimate(optimistic);
    const m = normalizeTaskTimeEstimate(mostLikely);
    const p = normalizeTaskTimeEstimate(pessimistic);
    if (o > 0 && m > 0 && p > 0 && o <= m && m <= p) {
        return Math.round(((o + 4 * m + p) / 6) * 10) / 10;
    }
    return m || 0;
}

function syncTaskTimeEstimateFromPert(task) {
    if (!task || typeof task !== 'object') return;
    const o = normalizeTaskTimeEstimate(task.timeOptimistic);
    const m = normalizeTaskTimeEstimate(task.timeMostLikely);
    const p = normalizeTaskTimeEstimate(task.timePessimistic);
    const est = normalizeTaskTimeEstimate(task.timeEstimate);
    // ponytail: legacy single-field estimate → most likely when no PERT trio
    if (m <= 0 && est > 0 && o <= 0 && p <= 0) {
        task.timeMostLikely = est;
    }
    const pert = computeTaskPertExpected(task.timeOptimistic, task.timeMostLikely, task.timePessimistic);
    if (pert > 0) {
        task.timeEstimate = pert;
        return;
    }
    const mostLikely = normalizeTaskTimeEstimate(task.timeMostLikely);
    if (mostLikely > 0) task.timeEstimate = mostLikely;
}

function normalizeTaskTitle(value) {
    return socialText(value || '').slice(0, 120);
}

function normalizeTaskDescription(value) {
    return socialText(value || '').slice(0, 2000);
}

function normalizeTaskTimeUnit(value) {
    return socialText(value).toLowerCase() === 'd' ? 'd' : 'h';
}

function normalizeScheduleStartAt(value) {
    const raw = socialText(value || '');
    if (!raw) return '';
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : '';
}

function normalizeTaskGraphPositions(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const out = {};
    Object.entries(value).forEach(([id, pos]) => {
        const key = socialText(id);
        if (!key || !pos || typeof pos !== 'object') return;
        const x = Math.round(Number(pos.x));
        const y = Math.round(Number(pos.y));
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        out[key] = { x, y };
    });
    return out;
}

function normalizeTaskGraphView(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const minZoom = 0.12;
    const maxZoom = 1.6;
    let zoom = Number(value.zoom);
    if (!Number.isFinite(zoom) || zoom <= 0) zoom = minZoom;
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    const pan = value.pan && typeof value.pan === 'object' ? value.pan : {};
    return {
        zoom: Math.round(zoom * 1000) / 1000,
        pan: {
            x: Math.round(Number(pan.x) || 0),
            y: Math.round(Number(pan.y) || 0)
        }
    };
}

function normalizeTaskGraphGroups(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 40).map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const id = socialText(entry.id);
        if (!id) return null;
        // Order links may target tasks or other packages (grp_*); do not restrict to task ids.
        const blocksIds = socialIdArray(entry.blocksIds || []).filter((linkId) => linkId !== id);
        const dependsOnIds = socialIdArray(entry.dependsOnIds || []).filter((linkId) => linkId !== id);
        return {
            id,
            name: socialText(entry.name || 'Group').slice(0, 80) || 'Group',
            x: Math.round(Number(entry.x) || 0),
            y: Math.round(Number(entry.y) || 0),
            memberTaskIds: socialIdArray(entry.memberTaskIds || []),
            blocksIds,
            dependsOnIds,
            assigneeUserId: socialText(entry.assigneeUserId || ''),
            description: normalizeTaskDescription(entry.description || '')
        };
    }).filter(Boolean);
}

/** Drop a task or package id from group membership and order-link arrays. */
function scrubIdFromTaskGraphGroups(groups, scrubId) {
    const id = socialText(scrubId);
    if (!id) return asArray(groups);
    return asArray(groups).map((group) => {
        if (!group || typeof group !== 'object') return group;
        const memberTaskIds = socialIdArray(group.memberTaskIds).filter((item) => item !== id);
        const blocksIds = socialIdArray(group.blocksIds).filter((item) => item !== id);
        const dependsOnIds = socialIdArray(group.dependsOnIds).filter((item) => item !== id);
        if (
            socialIdArray(group.memberTaskIds).join('|') === memberTaskIds.join('|')
            && socialIdArray(group.blocksIds).join('|') === blocksIds.join('|')
            && socialIdArray(group.dependsOnIds).join('|') === dependsOnIds.join('|')
        ) {
            return group;
        }
        return { ...group, memberTaskIds, blocksIds, dependsOnIds };
    });
}

function getSocialProjectTaskIds(projectId, tasks = []) {
    const normalizedProjectId = socialText(projectId);
    return asArray(tasks)
        .filter(item => socialText(item?.projectId) === normalizedProjectId)
        .map(item => socialText(item?.id))
        .filter(Boolean);
}

function normalizeTaskDependsOn(projectId, taskId, values, tasks = []) {
    const validIds = new Set(getSocialProjectTaskIds(projectId, tasks));
    const normalizedTaskId = socialText(taskId);
    return socialIdArray(values).filter(id => validIds.has(id) && id !== normalizedTaskId);
}

function normalizeBudgetCurrency(value) {
    const normalized = socialText(value).toUpperCase();
    if (['USD', 'GEL'].includes(normalized)) return normalized;
    return '';
}

function normalizeBudgetExpenseStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['draft', 'submitted', 'approved', 'paid', 'rejected'].includes(normalized)) return normalized;
    return 'draft';
}

/** PMI-style 1–5 scale. Legacy low/medium/high maps to 1/3/5. Stores integer 1–5. */
function normalizeProjectRiskScale1to5(value, fallback = 3) {
    const raw = socialText(value).toLowerCase();
    if (raw === 'low') return 1;
    if (raw === 'medium' || raw === 'med') return 3;
    if (raw === 'high') return 5;
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
    const fb = Math.round(Number(fallback));
    return Number.isFinite(fb) && fb >= 1 && fb <= 5 ? fb : 3;
}

function normalizeProjectRiskLikelihood(value) {
    return normalizeProjectRiskScale1to5(value, 3);
}

function normalizeProjectRiskImpact(value) {
    return normalizeProjectRiskScale1to5(value, 3);
}

function normalizeProjectRiskStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['open', 'watching', 'mitigated', 'closed'].includes(normalized)) return normalized;
    return 'open';
}

function normalizeProjectRiskResponse(value) {
    const normalized = socialText(value).toLowerCase();
    if (['avoid', 'mitigate', 'transfer', 'accept'].includes(normalized)) return normalized;
    return 'mitigate';
}

function normalizeProjectRiskGroupId(project, groupId) {
    const normalizedGroupId = socialText(groupId);
    if (!normalizedGroupId) return '';
    const groups = normalizeTaskGraphGroups(project?.taskGraphGroups);
    return groups.some((group) => socialText(group?.id) === normalizedGroupId) ? normalizedGroupId : '';
}

function normalizeProjectRiskLinkedTaskIds(projectId, values = [], tasks = []) {
    const validIds = new Set(getSocialProjectTaskIds(projectId, tasks));
    return socialIdArray(values).filter((id) => validIds.has(id));
}

function projectRiskExposureScore(likelihood, impact) {
    return normalizeProjectRiskLikelihood(likelihood) * normalizeProjectRiskImpact(impact);
}

/** Bands for product score 1–25 (common 5×5 heat-map style). */
function projectRiskExposureTier(likelihood, impact) {
    const score = projectRiskExposureScore(likelihood, impact);
    if (score >= 15) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
}

function getSocialProjectRecord(projectId) {
    return asArray(this.state.social.projects).find(item => socialText(item?.id) === socialText(projectId)) || null;
}

function getSocialProjectByGroupId(groupId) {
    return asArray(this.state.social.projects).find(item => socialText(item?.groupId) === socialText(groupId)) || null;
}

function getSocialProjectByChatId(chatId) {
    return asArray(this.state.social.projects).find(item => socialText(item?.chatId) === socialText(chatId)) || null;
}

function getSocialProjectMemberRole(project, userId) {
    const normalizedUserId = socialText(userId);
    if (!project || !normalizedUserId) return '';
    const ownerUserId = socialText(project.ownerUserId || '');
    if (ownerUserId === normalizedUserId) return 'owner';
    const memberRolesByUser = project.memberRolesByUser && typeof project.memberRolesByUser === 'object'
        ? project.memberRolesByUser
        : {};
    if (memberRolesByUser[normalizedUserId]) return normalizeProjectRole(memberRolesByUser[normalizedUserId]);
    if (socialText(project.advisorUserId || '') === normalizedUserId) return 'advisor';
    if (socialIdArray(project.instructorViewerIds).includes(normalizedUserId)) return 'instructor-viewer';
    const group = socialText(project.groupId || '') ? this.getSocialGroupRecord(project.groupId) : null;
    const memberIds = group
        ? this.getSocialGroupMemberIds(group)
        : getSocialProjectMemberIds.call(this, project);
    if (memberIds.includes(normalizedUserId)) return 'member';
    return '';
}

function getSocialProjectMemberIds(project) {
    if (!project || typeof project !== 'object') return [];
    const roleMap = project.memberRolesByUser && typeof project.memberRolesByUser === 'object'
        ? project.memberRolesByUser
        : {};
    return uniqueStrings([
        socialText(project.ownerUserId || ''),
        ...Object.keys(roleMap).filter(userId => ['owner', 'member'].includes(normalizeProjectRole(roleMap[userId]))),
        ...socialIdArray(project.memberIds || [])
    ]);
}

function getSocialProjectAdvisorIds(project) {
    if (!project || typeof project !== 'object') return [];
    return uniqueStrings([
        socialText(project.advisorUserId || ''),
        ...socialIdArray(project.instructorViewerIds || [])
    ]);
}

function canManageSocialProject(project, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !project) return false;
    return this.isSocialAdmin(normalizedUserId) || socialText(project.ownerUserId || '') === normalizedUserId;
}

function canViewSocialProject(project, userId) {
    if (!project) return false;
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId) return false;
    if (canManageSocialProject.call(this, project, normalizedUserId)) return true;
    if (getSocialProjectMemberIds.call(this, project).includes(normalizedUserId)) return true;
    if (getSocialProjectAdvisorIds.call(this, project).includes(normalizedUserId)) return true;
    // Faculty oversight: professors, TAs, admins, and student service can always see every project
    // team and its tasks regardless of the team's chosen visibility.
    const oversightRole = socialText(this.getSocialAccount(normalizedUserId)?.role).toLowerCase();
    if (['professor', 'ta', 'admin', 'student_service'].includes(oversightRole)) return true;
    const hiddenUserIds = socialIdArray(project.hiddenUserIds || []);
    if (hiddenUserIds.includes(normalizedUserId)) return false;
    const status = normalizeProjectStatus(project.status || 'draft');
    if (status !== 'published') return false;
    const visibilityMode = normalizeProjectVisibilityMode(
        project.visibilityMode || fallbackProjectVisibilityMode(project),
        'all_logged_in'
    );
    const viewerRole = socialText(this.getSocialAccount(normalizedUserId)?.role).toLowerCase();
    const viewerFacultyCode = normalizeCode(this.getSocialActorFacultyCode(normalizedUserId) || '');
    if (visibilityMode === 'all_logged_in') return true;
    if (visibilityMode === 'students_only') return viewerRole === 'student';
    if (visibilityMode === 'tas_only') return viewerRole === 'ta';
    if (visibilityMode === 'professors_only') return viewerRole === 'professor';
    if (visibilityMode === 'staff_only') {
        return ['professor', 'ta', 'admin', 'student_service'].includes(viewerRole);
    }
    if (visibilityMode === 'custom') {
        const visibleUserIds = socialIdArray(project.visibleUserIds || []);
        if (visibleUserIds.includes(normalizedUserId)) return true;
        const visibleRoles = socialIdArray(project.visibleRoles || []).map((role) => socialText(role).toLowerCase());
        if (visibleRoles.includes(viewerRole)) return true;
        const visibleFacultyCodes = socialIdArray(project.visibleFacultyCodes || []).map((code) => normalizeCode(code || ''));
        if (viewerFacultyCode && visibleFacultyCodes.includes(viewerFacultyCode)) return true;
    }
    const visibility = normalizeSocialVisibility(project.visibility, 'private');
    if (visibility === 'faculty') {
        const faculties = socialIdArray(project.facultyCodes || []).map((code) => normalizeCode(code || ''));
        if (faculties.includes('ALL')) return true;
        return faculties.includes(viewerFacultyCode);
    }
    return false;
}

function canContributeToSocialProject(project, userId) {
    const role = getSocialProjectMemberRole.call(this, project, userId);
    return ['owner', 'member'].includes(role) || this.isSocialAdmin(userId);
}

function decorateSocialProject(project, viewerUserId = '') {
    const normalized = clone(project || {}) || {};
    const projectId = socialText(normalized.id);
    const group = this.getSocialGroupRecord(normalized.groupId);
    const memberIds = group ? this.getSocialGroupMemberIds(group) : getSocialProjectMemberIds.call(this, normalized);
    const pendingMemberIds = group ? this.getSocialGroupPendingIds(group) : socialIdArray(normalized.pendingMemberIds || []);
    const joinedAtByUser = group
        ? this.getSocialGroupJoinMap(group)
        : (normalized.joinedAtByUser && typeof normalized.joinedAtByUser === 'object' ? clone(normalized.joinedAtByUser) : {});
    const advisorIds = getSocialProjectAdvisorIds.call(this, normalized);
    const roleMap = normalized.memberRolesByUser && typeof normalized.memberRolesByUser === 'object'
        ? clone(normalized.memberRolesByUser)
        : {};
    const taskItems = asArray(this.state.social.projectTasks)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => socialCompareNewest(left?.updatedAt || left?.createdAt, right?.updatedAt || right?.createdAt));
    const activityItems = asArray(this.state.social.projectActivities)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => socialCompareNewest(left?.createdAt, right?.createdAt));
    const budgetCategoryItems = asArray(this.state.social.projectBudgetCategories)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => safeNumber(left?.sortOrder, 0) - safeNumber(right?.sortOrder, 0)
            || socialCompareNewest(left?.createdAt, right?.createdAt));
    const budgetExpenseItems = asArray(this.state.social.projectBudgetExpenses)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => socialCompareNewest(left?.incurredAt || left?.createdAt, right?.incurredAt || right?.createdAt));
    const riskItems = asArray(this.state.social.projectRisks)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => {
            const scoreDelta = projectRiskExposureScore(right?.likelihood, right?.impact) - projectRiskExposureScore(left?.likelihood, left?.impact);
            if (scoreDelta !== 0) return scoreDelta;
            return socialCompareNewest(left?.updatedAt || left?.createdAt, right?.updatedAt || right?.createdAt);
        });
    const budgetPlannedTotal = budgetCategoryItems.reduce((sum, item) => sum + Math.max(0, safeNumber(item?.plannedAmount, 0)), 0);
    const budgetSpentTotal = budgetExpenseItems
        .filter(item => ['approved', 'paid'].includes(normalizeBudgetExpenseStatus(item?.status)))
        .reduce((sum, item) => sum + Math.max(0, safeNumber(item?.amount, 0)), 0);
    const budgetPendingTotal = budgetExpenseItems
        .filter(item => normalizeBudgetExpenseStatus(item?.status) === 'submitted')
        .reduce((sum, item) => sum + Math.max(0, safeNumber(item?.amount, 0)), 0);
    const budgetCap = Math.max(0, safeNumber(normalized.budgetCap, 0));
    const budgetBase = budgetCap > 0 ? budgetCap : budgetPlannedTotal;
    const budgetRemaining = budgetBase - budgetSpentTotal;
    const budgetUtilizationPercent = budgetBase > 0 ? Math.min(100, Math.round((budgetSpentTotal / budgetBase) * 100)) : 0;
    const budgetOverCap = budgetCap > 0 && budgetSpentTotal > budgetCap;
    const budgetByCategory = budgetCategoryItems.map((category) => {
        const categoryId = socialText(category?.id);
        const categoryExpenses = budgetExpenseItems.filter((expense) => socialText(expense?.categoryId) === categoryId);
        const planned = Math.max(0, safeNumber(category?.plannedAmount, 0));
        const spent = categoryExpenses
            .filter(item => ['approved', 'paid'].includes(normalizeBudgetExpenseStatus(item?.status)))
            .reduce((sum, item) => sum + Math.max(0, safeNumber(item?.amount, 0)), 0);
        return {
            categoryId,
            title: socialText(category?.title || ''),
            planned,
            spent,
            count: categoryExpenses.length
        };
    });
    const taskStatuses = ['todo', 'in-progress', 'blocked', 'done'];
    const taskStatusCounts = taskStatuses.reduce((accumulator, status) => {
        accumulator[status] = 0;
        return accumulator;
    }, {});
    taskItems.forEach((task) => {
        const status = normalizeTaskStatus(task?.status || 'todo');
        taskStatusCounts[status] = safeNumber(taskStatusCounts[status], 0) + 1;
    });
    const completedTaskCount = safeNumber(taskStatusCounts.done, 0);
    const openTaskCount = taskItems.length - completedTaskCount;
    const taskCompletionPercent = taskItems.length ? Math.round((completedTaskCount / taskItems.length) * 100) : 0;
    const roleOrder = ['owner', 'member', 'advisor', 'instructor-viewer'];
    const roleCounts = roleOrder.reduce((accumulator, role) => {
        accumulator[role] = 0;
        return accumulator;
    }, {});
    const facultyCounts = {};
    const workloadCounts = {};
    const workloadHours = {};
    const memberSummaries = memberIds.map((userId) => {
        const role = getSocialProjectMemberRole.call(this, normalized, userId) || 'member';
        roleCounts[role] = safeNumber(roleCounts[role], 0) + 1;
        const account = this.getSocialAccount(userId) || {};
        const facultyCode = socialText(account?.facultyCode || account?.faculty || '');
        if (facultyCode) facultyCounts[facultyCode] = safeNumber(facultyCounts[facultyCode], 0) + 1;
        workloadCounts[userId] = 0;
        workloadHours[userId] = 0;
        return {
            userId,
            role,
            joinedAt: socialText(joinedAtByUser?.[userId] || ''),
            facultyCode,
            presenceLabel: socialText(account?.presenceLabel || 'Offline') || 'Offline'
        };
    });
    taskItems.forEach((task) => {
        const assigneeUserId = socialText(task?.assigneeUserId || '');
        if (!assigneeUserId || normalizeTaskStatus(task?.status || 'todo') === 'done') return;
        workloadCounts[assigneeUserId] = safeNumber(workloadCounts[assigneeUserId], 0) + 1;
        workloadHours[assigneeUserId] = safeNumber(workloadHours[assigneeUserId], 0) + socialTaskDurationHours(task);
    });
    const workloadByMember = memberSummaries
        .map((entry) => ({
            ...entry,
            count: safeNumber(workloadCounts[entry.userId], 0),
            hours: Math.round(safeNumber(workloadHours[entry.userId], 0) * 10) / 10
        }))
        .sort((left, right) => {
            if (right.count !== left.count) return right.count - left.count;
            return String(left.userId || '').localeCompare(String(right.userId || ''));
        });
    const facultyMix = Object.keys(facultyCounts)
        .map((facultyCode) => ({ facultyCode, count: safeNumber(facultyCounts[facultyCode], 0) }))
        .sort((left, right) => {
            if (right.count !== left.count) return right.count - left.count;
            return String(left.facultyCode || '').localeCompare(String(right.facultyCode || ''));
        });
    const roleMix = roleOrder
        .map((role) => ({ role, count: safeNumber(roleCounts[role], 0) }))
        .filter((entry) => entry.count > 0);
    const nowMs = Date.now();
    const activityBuckets = Array.from({ length: 7 }, (_, index) => {
        const offset = 6 - index;
        const date = new Date(nowMs - (offset * 24 * 60 * 60 * 1000));
        const dayKey = date.toISOString().slice(0, 10);
        const label = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        return { dayKey, label, count: 0 };
    });
    const bucketIndex = new Map(activityBuckets.map((entry, index) => [entry.dayKey, index]));
    activityItems.forEach((entry) => {
        const key = socialText(entry?.createdAt || '').slice(0, 10);
        const index = bucketIndex.get(key);
        if (index === undefined) return;
        activityBuckets[index].count += 1;
    });
    const nextOwnerUserId = socialText(normalized.ownerUserId || '')
        ? this.getNextSocialGroupOwnerId(group || {
            ...normalized,
            memberIds: memberIds.filter(item => item !== socialText(normalized.ownerUserId || '')),
            joinedAtByUser
        }, socialText(normalized.ownerUserId || ''))
        : '';
    return {
        ...normalized,
        id: projectId,
        title: socialText(normalized.title || normalized.name || projectId || 'Portfolio entry'),
        name: socialText(normalized.name || normalized.title || projectId || 'Project workspace'),
        summary: socialText(normalized.summary || normalized.description || ''),
        description: socialText(normalized.description || normalized.summary || ''),
        status: normalizeProjectStatus(normalized.status || 'idea'),
        visibility: normalizeSocialVisibility(normalized.visibility, 'private'),
        visibilityMode: normalizeProjectVisibilityMode(
            normalized.visibilityMode || fallbackProjectVisibilityMode(normalized),
            'all_logged_in'
        ),
        ownerFacultyCode: normalizeCode(normalized.ownerFacultyCode || this.getSocialActorFacultyCode(normalized.ownerUserId || '')),
        facultyCodes: socialIdArray(normalized.facultyCodes || normalized.faculties || []),
        facultyTags: socialIdArray(normalized.facultyTags || []),
        skillTags: socialIdArray(normalized.skillTags || normalized.skills || []),
        hashtags: socialIdArray(normalized.hashtags || normalized.tags || []),
        mediaItems: normalizePortfolioMediaItems.call(this, normalized.mediaItems || []),
        externalLinks: normalizePortfolioLinks.call(this, normalized.externalLinks || normalized.links || []),
        visibleRoles: socialIdArray(normalized.visibleRoles || []).map((role) => socialText(role).toLowerCase()),
        visibleFacultyCodes: socialIdArray(normalized.visibleFacultyCodes || []).map((code) => normalizeCode(code || '')),
        visibleUserIds: socialIdArray(normalized.visibleUserIds || []),
        hiddenUserIds: socialIdArray(normalized.hiddenUserIds || []),
        courseTag: socialText(normalized.courseTag || normalized.courseCode || ''),
        ownerUserId: socialText(normalized.ownerUserId || ''),
        advisorUserId: socialText(normalized.advisorUserId || ''),
        instructorViewerIds: socialIdArray(normalized.instructorViewerIds || []),
        memberIds,
        pendingMemberIds,
        memberRolesByUser: roleMap,
        joinedAtByUser,
        memberCount: memberIds.length,
        pendingCount: pendingMemberIds.length,
        advisorCount: advisorIds.length,
        role: getSocialProjectMemberRole.call(this, normalized, viewerUserId),
        isManager: canManageSocialProject.call(this, normalized, viewerUserId),
        viewerCanContribute: canContributeToSocialProject.call(this, normalized, viewerUserId),
        groupId: socialText(normalized.groupId || ''),
        chatId: socialText(normalized.chatId || group?.chatId || ''),
        groupChatId: socialText(normalized.chatId || group?.chatId || ''),
        recommendedTeamSize: Math.max(2, safeNumber(normalized.recommendedTeamSize, 4)),
        minTeamSize: Math.max(2, safeNumber(normalized.minTeamSize, 4)),
        showcaseEnabled: Boolean(normalized.showcaseEnabled),
        showcasePageId: socialText(normalized.showcasePageId || ''),
        showcaseSummary: socialText(normalized.showcaseSummary || ''),
        scheduleStartAt: normalizeScheduleStartAt(normalized.scheduleStartAt),
        baselineAt: socialText(normalized.baselineAt || ''),
        baselineSnapshot: normalized.baselineSnapshot && typeof normalized.baselineSnapshot === 'object' ? clone(normalized.baselineSnapshot) : null,
        taskGraphPositions: normalizeTaskGraphPositions(normalized.taskGraphPositions),
        taskGraphView: normalizeTaskGraphView(normalized.taskGraphView),
        taskGraphGroups: normalizeTaskGraphGroups(normalized.taskGraphGroups),
        taskGraphUpdatedAt: socialText(normalized.taskGraphUpdatedAt || ''),
        taskCount: taskItems.length,
        openTaskCount,
        completedTaskCount,
        taskStatusCounts,
        taskCompletionPercent,
        activityCount: activityItems.length,
        activityBuckets,
        facultyMix,
        roleMix,
        workloadByMember,
        nextOwnerUserId,
        isOrphaned: !socialText(normalized.ownerUserId || ''),
        memberSummaries: memberSummaries.sort((left, right) => {
            const leftMs = Number.isFinite(Date.parse(left.joinedAt || '')) ? Date.parse(left.joinedAt || '') : Number.MAX_SAFE_INTEGER;
            const rightMs = Number.isFinite(Date.parse(right.joinedAt || '')) ? Date.parse(right.joinedAt || '') : Number.MAX_SAFE_INTEGER;
            if (leftMs !== rightMs) return leftMs - rightMs;
            return String(left.userId || '').localeCompare(String(right.userId || ''));
        }),
        tasks: taskItems,
        activity: activityItems,
        budgetCurrency: normalizeBudgetCurrency(normalized.budgetCurrency || ''),
        budgetCap,
        budgetCategories: budgetCategoryItems,
        budgetExpenses: budgetExpenseItems,
        budgetPlannedTotal,
        budgetSpentTotal,
        budgetPendingTotal,
        budgetRemaining,
        budgetUtilizationPercent,
        budgetOverCap,
        budgetByCategory,
        risks: riskItems,
        riskCount: riskItems.length,
        riskCountByGroupId: riskItems.reduce((accumulator, risk) => {
            const groupKey = socialText(risk?.groupId || '');
            accumulator[groupKey] = safeNumber(accumulator[groupKey], 0) + 1;
            return accumulator;
        }, {}),
        createdAt: socialText(normalized.createdAt || nowIso()),
        updatedAt: socialText(normalized.updatedAt || normalized.createdAt || nowIso())
    };
}

function createSocialProject(payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const normalizedActorId = socialText(actorId || '');
    const ownerUserId = normalizedActorId;
    const entryTitle = socialText(payload.title || payload.name);
    if (!ownerUserId || !entryTitle) return null;
    const facultyCodes = socialIdArray(payload.facultyCodes || payload.faculties || [this.getSocialActorFacultyCode(ownerUserId)]).filter(Boolean);
    const visibilityMode = normalizeProjectVisibilityMode(
        payload.visibilityMode || fallbackProjectVisibilityMode(payload),
        'all_logged_in'
    );
    const createdAt = socialText(payload.createdAt || nowIso());
    const group = this.createSocialGroup({
        ownerUserId,
        name: socialText(payload.groupName || `${entryTitle} Workspace`),
        description: socialText(payload.description || payload.summary || ''),
        visibility: 'private',
        type: 'project-workspace',
        tags: ['project-workspace', ...socialIdArray(payload.tags || [])],
        avatarImage: socialText(payload.avatarImage || ''),
        bannerImage: socialText(payload.bannerImage || ''),
        createdAt,
        updatedAt: createdAt
    }, actorId || ownerUserId);
    if (!group) return null;
    const chatResult = this.ensureSocialGroupChat(group.id, ownerUserId);
    const project = {
        id: socialText(payload.id || makeId('project')),
        title: entryTitle,
        name: entryTitle,
        summary: socialText(payload.summary || payload.description || ''),
        description: socialText(payload.description || payload.summary || ''),
        status: normalizeProjectStatus(payload.status || 'draft'),
        visibility: normalizeSocialVisibility(payload.visibility || projectLegacyVisibilityFromMode(visibilityMode, 'public'), 'private'),
        visibilityMode,
        ownerFacultyCode: normalizeCode(payload.ownerFacultyCode || this.getSocialActorFacultyCode(ownerUserId)),
        facultyCodes,
        facultyTags: socialIdArray(payload.facultyTags || facultyCodes),
        skillTags: socialIdArray(payload.skillTags || payload.skills || []),
        hashtags: socialIdArray(payload.hashtags || payload.tags || []),
        mediaItems: normalizePortfolioMediaItems.call(this, payload.mediaItems || []),
        externalLinks: normalizePortfolioLinks.call(this, payload.externalLinks || payload.links || []),
        visibleRoles: socialIdArray(payload.visibleRoles || []).map((role) => socialText(role).toLowerCase()),
        visibleFacultyCodes: socialIdArray(payload.visibleFacultyCodes || []).map((code) => normalizeCode(code || '')),
        visibleUserIds: socialIdArray(payload.visibleUserIds || []),
        hiddenUserIds: socialIdArray(payload.hiddenUserIds || []),
        courseTag: socialText(payload.courseTag || payload.courseCode || ''),
        ownerUserId,
        advisorUserId: socialText(payload.advisorUserId || ''),
        instructorViewerIds: socialIdArray(payload.instructorViewerIds || []),
        memberRolesByUser: {
            [ownerUserId]: 'owner'
        },
        groupId: socialText(group.id),
        chatId: socialText(chatResult?.chat?.id || group.chatId || ''),
        recommendedTeamSize: Math.max(2, safeNumber(payload.recommendedTeamSize, 4)),
        minTeamSize: Math.max(2, safeNumber(payload.minTeamSize, 4)),
        showcaseEnabled: Boolean(payload.showcaseEnabled),
        showcasePageId: socialText(payload.showcasePageId || ''),
        showcaseSummary: socialText(payload.showcaseSummary || ''),
        scheduleStartAt: normalizeScheduleStartAt(payload.scheduleStartAt),
        taskGraphPositions: {},
        taskGraphView: null,
        taskGraphGroups: [],
        taskGraphUpdatedAt: '',
        createdByFlow: socialText(payload.createdByFlow || (socialText(this.getSocialAccount(ownerUserId)?.role).toLowerCase() === 'student' ? 'student' : 'teacher')) || 'student',
        createdAt,
        updatedAt: socialText(payload.updatedAt || createdAt)
    };
    this.state.social.projects.unshift(project);
    // Role-based team building:
    //  - Professors / TAs / admins assemble teams directly: picked students are
    //    auto-joined (no invite acceptance needed).
    //  - Students can only invite; invitees stay pending until they accept.
    const creatorRole = socialText(this.getSocialAccount(ownerUserId)?.role).toLowerCase();
    const isTeacherFlow = ['professor', 'ta', 'admin'].includes(creatorRole);
    const inviteIds = socialIdArray(payload.inviteeIds || payload.memberIds || payload.members || []);
    inviteIds.forEach((memberId) => {
        if (!memberId || memberId === ownerUserId) return;
        const desiredRole = normalizeProjectRole(
            payload.memberRolesByUser && typeof payload.memberRolesByUser === 'object'
                ? payload.memberRolesByUser[memberId]
                : 'member'
        );
        if (isTeacherFlow) {
            // Auto-joined: record the role immediately and add to the team group.
            project.memberRolesByUser[memberId] = desiredRole;
            this.setSocialGroupMembership(group.id, memberId, 'join', normalizedActorId || ownerUserId);
            this.createNotification({
                recipientUserId: memberId,
                sourceDomain: 'social',
                type: 'project-team-added',
                title: 'Added to a project team',
                body: `${this.getSocialActorDisplayName(ownerUserId)} added you to the project team ${project.name}.`,
                routePage: 'social',
                routeData: { projectId: socialText(project.id) }
            });
            this.appendSocialProjectActivity(project.id, normalizedActorId || ownerUserId, 'member-added', `${this.getSocialActorDisplayName(ownerUserId)} added ${this.getSocialActorDisplayName(memberId)} to the team.`);
        } else {
            // Invite-only: record the invitee as pending so only invited users can
            // join (they must accept), and notify them.
            const targetGroup = this.getSocialGroupRecord(group.id);
            if (targetGroup) {
                if (!Array.isArray(targetGroup.pendingMemberIds)) targetGroup.pendingMemberIds = [];
                if (!targetGroup.memberIds?.includes(memberId) && !targetGroup.pendingMemberIds.includes(memberId)) {
                    targetGroup.pendingMemberIds.push(memberId);
                    if (!targetGroup.invitedMemberIds) targetGroup.invitedMemberIds = [];
                    if (!targetGroup.invitedMemberIds.includes(memberId)) targetGroup.invitedMemberIds.push(memberId);
                }
            }
            this.inviteSocialGroupMember(group.id, memberId, normalizedActorId || ownerUserId, `You were invited to project workspace ${project.name}.`);
            this.appendSocialProjectActivity(project.id, normalizedActorId || ownerUserId, 'member-invited', `${this.getSocialActorDisplayName(ownerUserId)} invited ${this.getSocialActorDisplayName(memberId)} to the project.`);
        }
    });
    this.appendSocialProjectActivity(project.id, ownerUserId, 'project-created', `${this.getSocialActorDisplayName(ownerUserId)} created the project workspace.`);
    this.saveSocialMutation(normalizedActorId || ownerUserId, 'project-created', 'social-project', project.id, null, project);
    return decorateSocialProject.call(this, project, normalizedActorId || ownerUserId);
}

function updateSocialProject(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    const beforeState = clone(project);
    if (Object.prototype.hasOwnProperty.call(payload, 'name') || Object.prototype.hasOwnProperty.call(payload, 'title')) {
        const nextTitle = socialText(payload.title || payload.name || project.title || project.name);
        project.title = nextTitle;
        project.name = nextTitle || project.name;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'summary')) project.summary = socialText(payload.summary || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) project.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) project.status = normalizeProjectStatus(payload.status || project.status);
    if (Object.prototype.hasOwnProperty.call(payload, 'visibility')) project.visibility = normalizeSocialVisibility(payload.visibility, project.visibility || 'private');
    if (Object.prototype.hasOwnProperty.call(payload, 'visibilityMode')) {
        project.visibilityMode = normalizeProjectVisibilityMode(payload.visibilityMode, project.visibilityMode || 'all_logged_in');
        project.visibility = normalizeSocialVisibility(
            payload.visibility || projectLegacyVisibilityFromMode(project.visibilityMode, project.visibility || 'public'),
            project.visibility || 'private'
        );
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'courseTag')) project.courseTag = socialText(payload.courseTag || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'facultyCodes') || Object.prototype.hasOwnProperty.call(payload, 'faculties')) {
        project.facultyCodes = socialIdArray(payload.facultyCodes || payload.faculties || []);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'ownerFacultyCode')) project.ownerFacultyCode = normalizeCode(payload.ownerFacultyCode || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'facultyTags')) project.facultyTags = socialIdArray(payload.facultyTags || []);
    if (Object.prototype.hasOwnProperty.call(payload, 'skillTags') || Object.prototype.hasOwnProperty.call(payload, 'skills')) {
        project.skillTags = socialIdArray(payload.skillTags || payload.skills || []);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'hashtags') || Object.prototype.hasOwnProperty.call(payload, 'tags')) {
        project.hashtags = socialIdArray(payload.hashtags || payload.tags || []);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'mediaItems')) project.mediaItems = normalizePortfolioMediaItems.call(this, payload.mediaItems || []);
    if (Object.prototype.hasOwnProperty.call(payload, 'externalLinks') || Object.prototype.hasOwnProperty.call(payload, 'links')) {
        project.externalLinks = normalizePortfolioLinks.call(this, payload.externalLinks || payload.links || []);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'visibleRoles')) {
        project.visibleRoles = socialIdArray(payload.visibleRoles || []).map((role) => socialText(role).toLowerCase());
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'visibleFacultyCodes')) {
        project.visibleFacultyCodes = socialIdArray(payload.visibleFacultyCodes || []).map((code) => normalizeCode(code || ''));
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'visibleUserIds')) project.visibleUserIds = socialIdArray(payload.visibleUserIds || []);
    if (Object.prototype.hasOwnProperty.call(payload, 'hiddenUserIds')) project.hiddenUserIds = socialIdArray(payload.hiddenUserIds || []);
    if (Object.prototype.hasOwnProperty.call(payload, 'advisorUserId')) project.advisorUserId = socialText(payload.advisorUserId || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'instructorViewerIds')) project.instructorViewerIds = socialIdArray(payload.instructorViewerIds || []);
    if (Object.prototype.hasOwnProperty.call(payload, 'showcaseEnabled')) project.showcaseEnabled = Boolean(payload.showcaseEnabled);
    if (Object.prototype.hasOwnProperty.call(payload, 'showcaseSummary')) project.showcaseSummary = socialText(payload.showcaseSummary || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'scheduleStartAt')) project.scheduleStartAt = normalizeScheduleStartAt(payload.scheduleStartAt);
    if (Object.prototype.hasOwnProperty.call(payload, 'recommendedTeamSize')) project.recommendedTeamSize = Math.max(2, safeNumber(payload.recommendedTeamSize, project.recommendedTeamSize || 4));
    if (Object.prototype.hasOwnProperty.call(payload, 'minTeamSize')) project.minTeamSize = Math.max(2, safeNumber(payload.minTeamSize, project.minTeamSize || 4));
    if (Object.prototype.hasOwnProperty.call(payload, 'budgetCurrency')) project.budgetCurrency = normalizeBudgetCurrency(payload.budgetCurrency || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'budgetCap')) project.budgetCap = Math.max(0, safeNumber(payload.budgetCap, 0));
    project.updatedAt = nowIso();
    const group = this.getSocialGroupRecord(project.groupId);
    if (group) {
        this.updateSocialGroup(group.id, {
            actorId: normalizedActorId,
            name: `${project.name} Workspace`,
            description: project.description,
            visibility: 'private'
        }, normalizedActorId);
    }
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'project-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated project details.`);
    this.saveSocialMutation(normalizedActorId, 'project-updated', 'social-project', project.id, beforeState, project);
    return decorateSocialProject.call(this, project, normalizedActorId);
}

function updateSocialProjectTaskGraph(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const hasPositions = Object.prototype.hasOwnProperty.call(payload, 'taskGraphPositions');
    const hasView = Object.prototype.hasOwnProperty.call(payload, 'taskGraphView');
    const hasGroups = Object.prototype.hasOwnProperty.call(payload, 'taskGraphGroups');
    const recordActivity = payload.recordActivity === true;
    if (!hasPositions && !hasView && !hasGroups) return null;
    const beforeState = clone(project);
    if (hasPositions) project.taskGraphPositions = normalizeTaskGraphPositions(payload.taskGraphPositions);
    if (hasView) project.taskGraphView = normalizeTaskGraphView(payload.taskGraphView);
    if (hasGroups) {
        const previousGroupIds = new Set(
            normalizeTaskGraphGroups(project.taskGraphGroups).map((group) => socialText(group.id)).filter(Boolean)
        );
        const nextGroups = normalizeTaskGraphGroups(payload.taskGraphGroups);
        const nextGroupIds = new Set(nextGroups.map((group) => socialText(group.id)).filter(Boolean));
        const removedGroupIds = Array.from(previousGroupIds).filter((id) => !nextGroupIds.has(id));
        let scrubbedGroups = nextGroups;
        removedGroupIds.forEach((removedId) => {
            scrubbedGroups = scrubIdFromTaskGraphGroups(scrubbedGroups, removedId);
            this.state.social.projectTasks = asArray(this.state.social.projectTasks).map((item) => {
                if (socialText(item?.projectId) !== socialText(projectId)) return item;
                const deps = socialIdArray(item.dependsOnTaskIds);
                if (!deps.includes(removedId)) return item;
                return {
                    ...item,
                    dependsOnTaskIds: deps.filter((depId) => depId !== removedId),
                    updatedAt: nowIso()
                };
            });
        });
        project.taskGraphGroups = scrubbedGroups;
    }
    const capturedAt = nowIso();
    project.taskGraphUpdatedAt = capturedAt;
    project.updatedAt = capturedAt;
    if (recordActivity) {
        this.appendSocialProjectActivity(
            project.id,
            normalizedActorId,
            'project-task-graph-saved',
            `${this.getSocialActorDisplayName(normalizedActorId)} saved meaningful task map changes.`
        );
    }
    this.saveSocialMutation(normalizedActorId, 'project-task-graph-updated', 'social-project', project.id, beforeState, project);
    return decorateSocialProject.call(this, project, normalizedActorId);
}

function deleteSocialProject(projectId, actorId = '') {
    this.ensureSocialProjectCollections();
    const normalizedProjectId = socialText(projectId);
    const normalizedActorId = socialText(actorId);
    const project = getSocialProjectRecord.call(this, normalizedProjectId);
    if (!project || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    const beforeState = clone(project);
    this.state.social.projects = asArray(this.state.social.projects)
        .filter((entry) => socialText(entry?.id) !== normalizedProjectId);
    this.state.social.projectTasks = asArray(this.state.social.projectTasks)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectActivities = asArray(this.state.social.projectActivities)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectBudgetCategories = asArray(this.state.social.projectBudgetCategories)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectBudgetExpenses = asArray(this.state.social.projectBudgetExpenses)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectRisks = asArray(this.state.social.projectRisks)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.events = asArray(this.state.social.events)
        .filter((entry) => socialText(entry?.projectId || entry?.hostProjectId) !== normalizedProjectId);
    if (socialText(project.groupId || '')) {
        this.state.social.groups = asArray(this.state.social.groups)
            .filter((entry) => socialText(entry?.id) !== socialText(project.groupId));
    }
    if (socialText(project.chatId || '')) delete this.state.chats[socialText(project.chatId)];
    this.saveSocialMutation(normalizedActorId, 'project-deleted', 'social-project', normalizedProjectId, beforeState, null);
    return { projectId: normalizedProjectId };
}

function inviteSocialProjectMember(projectId, memberId, role = 'member', actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const normalizedMemberId = socialText(memberId);
    if (!project || !normalizedMemberId || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    const normalizedRole = normalizeProjectRole(role);
    if (!project.memberRolesByUser || typeof project.memberRolesByUser !== 'object') project.memberRolesByUser = {};
    project.memberRolesByUser[normalizedMemberId] = normalizedRole;
    if (normalizedRole === 'advisor') {
        const previousAdvisorId = socialText(project.advisorUserId || '');
        if (previousAdvisorId && previousAdvisorId !== normalizedMemberId) project.memberRolesByUser[previousAdvisorId] = 'member';
        project.advisorUserId = normalizedMemberId;
        project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== normalizedMemberId);
    } else if (normalizedRole === 'instructor-viewer') {
        if (socialText(project.advisorUserId || '') === normalizedMemberId) project.advisorUserId = '';
        project.instructorViewerIds = uniqueStrings([...socialIdArray(project.instructorViewerIds || []), normalizedMemberId]);
    } else {
        if (socialText(project.advisorUserId || '') === normalizedMemberId) project.advisorUserId = '';
        project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== normalizedMemberId);
    }
    project.updatedAt = nowIso();
    // Professors / TAs / admins add members directly (auto-joined); students send
    // an invite the recipient must accept.
    const actorRole = socialText(this.getSocialAccount(normalizedActorId)?.role).toLowerCase();
    const autoJoin = ['professor', 'ta', 'admin'].includes(actorRole);
    let result = null;
    if (autoJoin) {
        result = this.setSocialGroupMembership(project.groupId, normalizedMemberId, 'join', normalizedActorId);
        this.createNotification({
            recipientUserId: normalizedMemberId,
            sourceDomain: 'social',
            type: 'project-team-added',
            title: 'Added to a project team',
            body: `${this.getSocialActorDisplayName(normalizedActorId)} added you to the project team ${project.name}.`,
            routePage: 'social',
            routeData: { projectId: socialText(project.id) }
        });
    } else {
        result = this.inviteSocialGroupMember(project.groupId, normalizedMemberId, normalizedActorId, `You were invited to project workspace ${project.name}.`);
    }
    this.appendSocialProjectActivity(project.id, normalizedActorId, autoJoin ? 'member-added' : 'member-invited', `${this.getSocialActorDisplayName(normalizedActorId)} ${autoJoin ? 'added' : 'invited'} ${this.getSocialActorDisplayName(normalizedMemberId)} ${autoJoin ? 'to' : 'to'} the project.`);
    this.saveSocialMutation(normalizedActorId, autoJoin ? 'project-member-added' : 'project-member-invited', 'social-project', project.id, null, {
        memberId: normalizedMemberId,
        role: project.memberRolesByUser[normalizedMemberId]
    });
    return {
        project: decorateSocialProject.call(this, project, normalizedActorId),
        group: result?.group || this.decorateSocialGroup(this.getSocialGroupRecord(project.groupId), normalizedActorId)
    };
}

function updateSocialProjectMemberRole(projectId, memberId, role = 'member', actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const normalizedMemberId = socialText(memberId);
    if (!project || !normalizedMemberId || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    if (normalizedMemberId === socialText(project.ownerUserId || '')) return decorateSocialProject.call(this, project, normalizedActorId);
    const beforeState = clone(project);
    const normalizedRole = normalizeProjectRole(role);
    if (!project.memberRolesByUser || typeof project.memberRolesByUser !== 'object') project.memberRolesByUser = {};
    project.memberRolesByUser[normalizedMemberId] = normalizedRole;
    if (normalizedRole === 'advisor') {
        const previousAdvisorId = socialText(project.advisorUserId || '');
        if (previousAdvisorId && previousAdvisorId !== normalizedMemberId) project.memberRolesByUser[previousAdvisorId] = 'member';
        project.advisorUserId = normalizedMemberId;
        project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== normalizedMemberId);
    } else if (normalizedRole === 'instructor-viewer') {
        if (socialText(project.advisorUserId || '') === normalizedMemberId) project.advisorUserId = '';
        project.instructorViewerIds = uniqueStrings([...socialIdArray(project.instructorViewerIds || []), normalizedMemberId]);
    } else {
        if (socialText(project.advisorUserId || '') === normalizedMemberId) project.advisorUserId = '';
        project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== normalizedMemberId);
    }
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'member-role-updated', `${this.getSocialActorDisplayName(normalizedActorId)} changed ${this.getSocialActorDisplayName(normalizedMemberId)} to ${project.memberRolesByUser[normalizedMemberId]}.`);
    this.saveSocialMutation(normalizedActorId, 'project-member-role-updated', 'social-project', project.id, beforeState, project);
    return decorateSocialProject.call(this, project, normalizedActorId);
}

function removeSocialProjectMember(projectId, memberId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const normalizedMemberId = socialText(memberId);
    if (!project || !normalizedMemberId || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    if (normalizedMemberId === socialText(project.ownerUserId || '')) return null;
    const beforeState = clone(project);
    if (project.memberRolesByUser && typeof project.memberRolesByUser === 'object') {
        delete project.memberRolesByUser[normalizedMemberId];
    }
    if (socialText(project.advisorUserId || '') === normalizedMemberId) project.advisorUserId = '';
    project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== normalizedMemberId);
    project.updatedAt = nowIso();
    this.removeSocialGroupMember(project.groupId, normalizedMemberId, normalizedActorId);
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'member-removed', `${this.getSocialActorDisplayName(normalizedActorId)} removed ${this.getSocialActorDisplayName(normalizedMemberId)} from the project.`);
    this.saveSocialMutation(normalizedActorId, 'project-member-removed', 'social-project', project.id, beforeState, project);
    return decorateSocialProject.call(this, project, normalizedActorId);
}

function setSocialProjectMembership(projectId, userId, action = 'leave', actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedUserId = socialText(userId);
    const normalizedActorId = socialText(actorId || userId);
    const normalizedAction = socialText(action || 'leave') || 'leave';
    if (!project || !normalizedUserId || normalizedAction !== 'leave') return null;
    if (normalizedActorId !== normalizedUserId && !canManageSocialProject.call(this, project, normalizedActorId) && !this.isSocialAdmin(normalizedActorId)) return null;
    const group = this.getSocialGroupRecord(project.groupId);
    const projectRole = getSocialProjectMemberRole.call(this, project, normalizedUserId);
    if (!projectRole && !this.getSocialGroupMemberIds(group).includes(normalizedUserId) && !this.getSocialGroupPendingIds(group).includes(normalizedUserId)) return null;
    const beforeState = clone(project);
    const isOwner = normalizedUserId === socialText(project.ownerUserId || '');
    if (project.memberRolesByUser && typeof project.memberRolesByUser === 'object') {
        delete project.memberRolesByUser[normalizedUserId];
    }
    if (socialText(project.advisorUserId || '') === normalizedUserId) project.advisorUserId = '';
    project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== normalizedUserId);
    let nextOwnerId = '';
    let groupResult = null;
    if (group) {
        nextOwnerId = isOwner ? this.getNextSocialGroupOwnerId(group, normalizedUserId) : '';
        groupResult = this.setSocialGroupMembership(project.groupId, normalizedUserId, 'leave', normalizedActorId || normalizedUserId);
    }
    const refreshedGroup = this.getSocialGroupRecord(project.groupId);
    if (isOwner) {
        project.ownerUserId = socialText(refreshedGroup?.ownerUserId || nextOwnerId || '');
        if (!project.ownerUserId) {
            project.orphanedAt = nowIso();
        } else {
            project.orphanedAt = '';
            if (project.memberRolesByUser && typeof project.memberRolesByUser === 'object') {
                delete project.memberRolesByUser[project.ownerUserId];
            }
            if (socialText(project.advisorUserId || '') === project.ownerUserId) project.advisorUserId = '';
            project.instructorViewerIds = socialIdArray(project.instructorViewerIds || []).filter(item => item !== project.ownerUserId);
            this.createNotification({
                recipientUserId: project.ownerUserId,
                sourceDomain: 'social',
                type: 'project-owner-transferred',
                title: 'Project workspace ownership transferred',
                body: `${this.getSocialActorDisplayName(normalizedUserId)} left ${project.name}. You are now the workspace owner.`,
                routePage: 'social',
                routeData: { projectId: socialText(project.id) }
            });
        }
    }
    project.updatedAt = nowIso();
    const leaveSummary = isOwner
        ? (project.ownerUserId
            ? `${this.getSocialActorDisplayName(normalizedUserId)} left the workspace. Ownership moved to ${this.getSocialActorDisplayName(project.ownerUserId)}.`
            : `${this.getSocialActorDisplayName(normalizedUserId)} left the workspace. The project now has no owner.`)
        : `${this.getSocialActorDisplayName(normalizedUserId)} left the workspace.`;
    this.appendSocialProjectActivity(project.id, normalizedActorId || normalizedUserId, 'member-left', leaveSummary, {
        memberId: normalizedUserId,
        nextOwnerUserId: socialText(project.ownerUserId || '')
    });
    this.saveSocialMutation(normalizedActorId || normalizedUserId, 'project-member-left', 'social-project', project.id, beforeState, project);
    return {
        project: decorateSocialProject.call(this, project, normalizedActorId || normalizedUserId),
        group: groupResult || (refreshedGroup ? this.decorateSocialGroup(refreshedGroup, normalizedActorId || normalizedUserId) : null)
    };
}

function createSocialProjectTask(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId) || !socialText(payload.title)) return null;
    const priorityModel = normalizeTaskPriorityModel(payload.priorityModel || 'manual');
    const impactScore = normalizeTaskScore1to5(payload.impactScore);
    const effortScore = normalizeTaskScore1to5(payload.effortScore);
    const priority = priorityModel === 'matrix'
        ? computeTaskMatrixBucket(computeTaskMatrixScore(impactScore, effortScore))
        : normalizeTaskPriority(payload.priority || 'medium');
    const task = {
        id: socialText(payload.id || makeId('task')),
        projectId: socialText(projectId),
        title: normalizeTaskTitle(payload.title),
        description: normalizeTaskDescription(payload.description || ''),
        status: normalizeTaskStatus(payload.status || 'todo'),
        assigneeUserId: socialText(payload.assigneeUserId || ''),
        startAt: socialText(payload.startAt || ''),
        dueAt: socialText(payload.dueAt || ''),
        priority,
        priorityModel,
        impactScore,
        effortScore,
        budgetEstimate: normalizeTaskBudgetEstimate(payload.budgetEstimate),
        timeEstimate: normalizeTaskTimeEstimate(payload.timeEstimate),
        timeOptimistic: normalizeTaskTimeEstimate(payload.timeOptimistic),
        timeMostLikely: normalizeTaskTimeEstimate(payload.timeMostLikely),
        timePessimistic: normalizeTaskTimeEstimate(payload.timePessimistic),
        timeUnit: normalizeTaskTimeUnit(payload.timeUnit),
        isMilestone: Boolean(payload.isMilestone),
        actualTime: normalizeTaskTimeEstimate(payload.actualTime),
        actualCost: normalizeTaskBudgetEstimate(payload.actualCost),
        checklist: asArray(payload.checklist).map((item, index) => ({
            id: socialText(item?.id || makeId(`check${index + 1}`)),
            label: socialText(item?.label || item?.title || ''),
            done: Boolean(item?.done)
        })).filter(item => item.label),
        dependsOnTaskIds: normalizeTaskDependsOn(
            projectId,
            socialText(payload.id || ''),
            payload.dependsOnTaskIds,
            this.state.social.projectTasks
        ),
        createdById: normalizedActorId,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    syncTaskTimeEstimateFromPert(task);
    this.state.social.projectTasks.unshift(task);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'task-created', `${this.getSocialActorDisplayName(normalizedActorId)} created task "${task.title}".`, {
        taskId: task.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-task-created', 'social-project-task', task.id, null, task);
    return clone(task);
}

function updateSocialProjectTask(projectId, taskId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const task = asArray(this.state.social.projectTasks).find(item => socialText(item?.id) === socialText(taskId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !task || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const beforeState = clone(task);
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) task.title = normalizeTaskTitle(payload.title || task.title);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) task.description = normalizeTaskDescription(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) task.status = normalizeTaskStatus(payload.status || task.status);
    if (Object.prototype.hasOwnProperty.call(payload, 'assigneeUserId')) task.assigneeUserId = socialText(payload.assigneeUserId || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'startAt')) task.startAt = socialText(payload.startAt || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'dueAt')) task.dueAt = socialText(payload.dueAt || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'priority')) task.priority = normalizeTaskPriority(payload.priority || task.priority);
    if (Object.prototype.hasOwnProperty.call(payload, 'priorityModel')) task.priorityModel = normalizeTaskPriorityModel(payload.priorityModel || task.priorityModel);
    if (Object.prototype.hasOwnProperty.call(payload, 'impactScore')) task.impactScore = normalizeTaskScore1to5(payload.impactScore, task.impactScore || 3);
    if (Object.prototype.hasOwnProperty.call(payload, 'effortScore')) task.effortScore = normalizeTaskScore1to5(payload.effortScore, task.effortScore || 3);
    if (Object.prototype.hasOwnProperty.call(payload, 'budgetEstimate')) task.budgetEstimate = normalizeTaskBudgetEstimate(payload.budgetEstimate);
    if (Object.prototype.hasOwnProperty.call(payload, 'timeEstimate')) {
        task.timeEstimate = normalizeTaskTimeEstimate(payload.timeEstimate);
        if (!Object.prototype.hasOwnProperty.call(payload, 'timeOptimistic')
            && !Object.prototype.hasOwnProperty.call(payload, 'timeMostLikely')
            && !Object.prototype.hasOwnProperty.call(payload, 'timePessimistic')) {
            const est = normalizeTaskTimeEstimate(payload.timeEstimate);
            if (est > 0) task.timeMostLikely = est;
        }
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'timeOptimistic')) task.timeOptimistic = normalizeTaskTimeEstimate(payload.timeOptimistic);
    if (Object.prototype.hasOwnProperty.call(payload, 'timeMostLikely')) task.timeMostLikely = normalizeTaskTimeEstimate(payload.timeMostLikely);
    if (Object.prototype.hasOwnProperty.call(payload, 'timePessimistic')) task.timePessimistic = normalizeTaskTimeEstimate(payload.timePessimistic);
    if (Object.prototype.hasOwnProperty.call(payload, 'timeUnit')) task.timeUnit = normalizeTaskTimeUnit(payload.timeUnit);
    if (Object.prototype.hasOwnProperty.call(payload, 'isMilestone')) task.isMilestone = Boolean(payload.isMilestone);
    if (Object.prototype.hasOwnProperty.call(payload, 'actualTime')) task.actualTime = normalizeTaskTimeEstimate(payload.actualTime);
    if (Object.prototype.hasOwnProperty.call(payload, 'actualCost')) task.actualCost = normalizeTaskBudgetEstimate(payload.actualCost);
    if (normalizeTaskPriorityModel(task.priorityModel) === 'matrix') {
        task.priority = computeTaskMatrixBucket(computeTaskMatrixScore(task.impactScore, task.effortScore));
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'checklist')) {
        task.checklist = asArray(payload.checklist).map((item, index) => ({
            id: socialText(item?.id || makeId(`check${index + 1}`)),
            label: socialText(item?.label || item?.title || ''),
            done: Boolean(item?.done)
        })).filter(item => item.label);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'dependsOnTaskIds')) {
        task.dependsOnTaskIds = normalizeTaskDependsOn(
            projectId,
            taskId,
            payload.dependsOnTaskIds,
            this.state.social.projectTasks
        );
    }
    syncTaskTimeEstimateFromPert(task);
    task.updatedAt = nowIso();
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'task-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated task "${task.title}".`, {
        taskId: task.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-task-updated', 'social-project-task', task.id, beforeState, task);
    return clone(task);
}

function socialTaskHasPert(task) {
    const o = normalizeTaskTimeEstimate(task?.timeOptimistic);
    const m = normalizeTaskTimeEstimate(task?.timeMostLikely);
    const p = normalizeTaskTimeEstimate(task?.timePessimistic);
    return o > 0 && m > 0 && p > 0 && o <= m && m <= p;
}

/** Align with client resolveTaskScheduleEstimate: PERT expected → mostLikely → timeEstimate. */
function socialTaskDurationHours(task) {
    if (task?.isMilestone) return 0;
    const unit = normalizeTaskTimeUnit(task?.timeUnit);
    const toHours = (estimate) => (unit === 'd' ? estimate * 8 : estimate);
    if (socialTaskHasPert(task)) {
        return toHours(computeTaskPertExpected(task.timeOptimistic, task.timeMostLikely, task.timePessimistic));
    }
    const mostLikely = normalizeTaskTimeEstimate(task?.timeMostLikely);
    if (mostLikely > 0) return toHours(mostLikely);
    return toHours(normalizeTaskTimeEstimate(task?.timeEstimate));
}

function computeSocialProjectScheduleEndHours(projectId) {
    const project = getSocialProjectRecord.call(this, projectId);
    const tasks = asArray(this.state.social.projectTasks)
        .filter((item) => socialText(item?.projectId) === socialText(projectId) && socialText(item?.id));
    const byId = new Map(tasks.map((t) => [socialText(t.id), t]));
    const taskIds = Array.from(byId.keys());
    const groups = normalizeTaskGraphGroups(project?.taskGraphGroups);
    const groupById = new Map();
    groups.forEach((group) => {
        const gid = socialText(group?.id);
        if (gid) groupById.set(gid, group);
    });
    const groupIds = Array.from(groupById.keys());
    const ids = [...taskIds, ...groupIds];
    const known = new Set(ids);
    const dur = {};
    ids.forEach((id) => {
        if (groupById.has(id)) {
            dur[id] = 0;
            return;
        }
        const task = byId.get(id);
        // Done tasks contribute 0 remaining hours so baseline/end reflects open work.
        if (normalizeTaskStatus(task?.status || 'todo') === 'done') {
            dur[id] = 0;
            return;
        }
        dur[id] = socialTaskDurationHours(task);
    });
    const succ = {};
    const indeg = {};
    ids.forEach((id) => { succ[id] = []; indeg[id] = 0; });
    const link = (from, to) => {
        const a = socialText(from);
        const b = socialText(to);
        if (!a || !b || a === b || !known.has(a) || !known.has(b)) return;
        if (succ[a].includes(b)) return;
        succ[a].push(b);
        indeg[b] += 1;
    };
    // Task depends (task→task or package→task when dep is grp_*).
    taskIds.forEach((tid) => {
        socialIdArray(byId.get(tid)?.dependsOnTaskIds).forEach((dep) => link(dep, tid));
    });
    // Packages: members → package sink; package → blocksIds; dependsOnIds → package.
    groupIds.forEach((gid) => {
        const group = groupById.get(gid);
        socialIdArray(group?.memberTaskIds).forEach((memberId) => link(memberId, gid));
        socialIdArray(group?.blocksIds).forEach((targetId) => link(gid, targetId));
        socialIdArray(group?.dependsOnIds).forEach((predId) => link(predId, gid));
    });
    const ES = {};
    const EF = {};
    const queue = ids.filter((id) => indeg[id] === 0);
    const indegF = { ...indeg };
    queue.forEach((id) => { ES[id] = 0; EF[id] = dur[id]; });
    let head = 0;
    while (head < queue.length) {
        const cur = queue[head++];
        (succ[cur] || []).forEach((nxt) => {
            ES[nxt] = Math.max(ES[nxt] || 0, EF[cur] || 0);
            EF[nxt] = Math.max(EF[nxt] || 0, (ES[nxt] || 0) + (dur[nxt] || 0));
            if (--indegF[nxt] === 0) queue.push(nxt);
        });
    }
    ids.forEach((id) => { if (ES[id] == null) { ES[id] = 0; EF[id] = dur[id] || 0; } });
    return ids.reduce((m, id) => Math.max(m, EF[id] || 0), 0);
}

function setSocialProjectBaseline(projectId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || '');
    if (!project || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    const beforeState = clone(project);
    const taskItems = asArray(this.state.social.projectTasks)
        .filter((item) => socialText(item?.projectId) === socialText(projectId));
    const capturedAt = nowIso();
    project.baselineAt = capturedAt;
    project.baselineSnapshot = {
        scheduleStartAt: normalizeScheduleStartAt(project.scheduleStartAt),
        projectEndHours: computeSocialProjectScheduleEndHours.call(this, projectId),
        capturedById: normalizedActorId,
        capturedAt,
        tasks: taskItems.map((task) => ({
            id: socialText(task.id),
            title: socialText(task.title),
            timeEstimate: normalizeTaskTimeEstimate(task.timeEstimate),
            timeOptimistic: normalizeTaskTimeEstimate(task.timeOptimistic),
            timeMostLikely: normalizeTaskTimeEstimate(task.timeMostLikely),
            timePessimistic: normalizeTaskTimeEstimate(task.timePessimistic),
            timeUnit: normalizeTaskTimeUnit(task.timeUnit),
            budgetEstimate: normalizeTaskBudgetEstimate(task.budgetEstimate),
            startAt: socialText(task.startAt || ''),
            dueAt: socialText(task.dueAt || ''),
            isMilestone: Boolean(task.isMilestone)
        }))
    };
    project.updatedAt = capturedAt;
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'project-baseline-set', `${this.getSocialActorDisplayName(normalizedActorId)} set the project baseline.`);
    this.saveSocialMutation(normalizedActorId, 'project-baseline-set', 'social-project', project.id, beforeState, project);
    return decorateSocialProject.call(this, project, normalizedActorId);
}

function deleteSocialProjectTask(projectId, taskId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const task = asArray(this.state.social.projectTasks).find(item => socialText(item?.id) === socialText(taskId) && socialText(item?.projectId) === socialText(projectId));
    if (!project || !task || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const deletedTaskId = socialText(taskId);
    const remainingTasks = asArray(this.state.social.projectTasks)
        .filter(item => !(socialText(item?.id) === deletedTaskId && socialText(item?.projectId) === socialText(projectId)));
    this.state.social.projectTasks = remainingTasks.map(item => {
        if (socialText(item?.projectId) !== socialText(projectId)) return item;
        const nextDependsOn = normalizeTaskDependsOn(projectId, item.id, item.dependsOnTaskIds, remainingTasks);
        if (socialIdArray(item.dependsOnTaskIds).join('|') === nextDependsOn.join('|')) return item;
        return { ...item, dependsOnTaskIds: nextDependsOn, updatedAt: nowIso() };
    });
    project.taskGraphGroups = scrubIdFromTaskGraphGroups(project.taskGraphGroups, deletedTaskId);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'task-deleted', `${this.getSocialActorDisplayName(normalizedActorId)} removed task "${task.title}".`, {
        taskId: socialText(taskId)
    });
    this.saveSocialMutation(normalizedActorId, 'project-task-deleted', 'social-project-task', socialText(taskId), task, null);
    return { ok: true, taskId: socialText(taskId) };
}

function createSocialProjectBudgetCategory(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId) || !socialText(payload.title)) return null;
    const category = {
        id: socialText(payload.id || makeId('budgetcat')),
        projectId: socialText(projectId),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        plannedAmount: Math.max(0, safeNumber(payload.plannedAmount, 0)),
        color: socialText(payload.color || ''),
        sortOrder: safeNumber(payload.sortOrder, asArray(this.state.social.projectBudgetCategories).filter((item) => socialText(item?.projectId) === socialText(projectId)).length),
        createdById: normalizedActorId,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.projectBudgetCategories.push(category);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'budget-category-created', `${this.getSocialActorDisplayName(normalizedActorId)} added budget category "${category.title}".`, { categoryId: category.id });
    this.saveSocialMutation(normalizedActorId, 'project-budget-category-created', 'social-project-budget-category', category.id, null, category);
    return clone(category);
}

function updateSocialProjectBudgetCategory(projectId, categoryId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const category = asArray(this.state.social.projectBudgetCategories).find((item) => socialText(item?.id) === socialText(categoryId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !category || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const beforeState = clone(category);
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) category.title = socialText(payload.title || category.title);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) category.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'plannedAmount')) category.plannedAmount = Math.max(0, safeNumber(payload.plannedAmount, 0));
    if (Object.prototype.hasOwnProperty.call(payload, 'color')) category.color = socialText(payload.color || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'sortOrder')) category.sortOrder = safeNumber(payload.sortOrder, category.sortOrder);
    category.updatedAt = nowIso();
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'budget-category-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated budget category "${category.title}".`, { categoryId: category.id });
    this.saveSocialMutation(normalizedActorId, 'project-budget-category-updated', 'social-project-budget-category', category.id, beforeState, category);
    return clone(category);
}

function deleteSocialProjectBudgetCategory(projectId, categoryId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const category = asArray(this.state.social.projectBudgetCategories).find((item) => socialText(item?.id) === socialText(categoryId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId);
    if (!project || !category || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    this.state.social.projectBudgetCategories = asArray(this.state.social.projectBudgetCategories).filter((item) => socialText(item?.id) !== socialText(categoryId));
    // Orphan any expenses tied to the removed category.
    asArray(this.state.social.projectBudgetExpenses).forEach((expense) => {
        if (socialText(expense?.categoryId) === socialText(categoryId)) expense.categoryId = '';
    });
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'budget-category-removed', `${this.getSocialActorDisplayName(normalizedActorId)} removed budget category "${category.title}".`, { categoryId: socialText(categoryId) });
    this.saveSocialMutation(normalizedActorId, 'project-budget-category-deleted', 'social-project-budget-category', socialText(categoryId), category, null);
    return { ok: true, categoryId: socialText(categoryId) };
}

function createSocialProjectBudgetExpense(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId) || !socialText(payload.title)) return null;
    const currency = normalizeBudgetCurrency(payload.currency || project.budgetCurrency || '') || (normalizeBudgetCurrency(project.budgetCurrency || '') || 'USD');
    const expense = {
        id: socialText(payload.id || makeId('budgetexp')),
        projectId: socialText(projectId),
        categoryId: socialText(payload.categoryId || ''),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        amount: Math.max(0, safeNumber(payload.amount, 0)),
        currency,
        status: normalizeBudgetExpenseStatus(payload.status || 'draft'),
        incurredAt: socialText(payload.incurredAt || nowIso()),
        receiptFile: payload.receiptFile ? clone(payload.receiptFile) : null,
        submittedById: normalizedActorId,
        approvedById: socialText(payload.approvedById || ''),
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.projectBudgetExpenses.push(expense);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'budget-expense-created', `${this.getSocialActorDisplayName(normalizedActorId)} logged expense "${expense.title}".`, { expenseId: expense.id });
    this.saveSocialMutation(normalizedActorId, 'project-budget-expense-created', 'social-project-budget-expense', expense.id, null, expense);
    return clone(expense);
}

function updateSocialProjectBudgetExpense(projectId, expenseId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const expense = asArray(this.state.social.projectBudgetExpenses).find((item) => socialText(item?.id) === socialText(expenseId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    const actorRole = getSocialProjectMemberRole.call(this, project, normalizedActorId);
    const canReviewBudget = canManageSocialProject.call(this, project, normalizedActorId) || actorRole === 'advisor';
    if (!project || !expense || (!canContributeToSocialProject.call(this, project, normalizedActorId) && !canReviewBudget)) return null;
    const beforeState = clone(expense);
    const nextStatus = normalizeBudgetExpenseStatus(payload.status || expense.status || 'draft');
    // Only managers/advisors may approve/pay/reject a submitted expense.
    if (!canReviewBudget && ['approved', 'paid', 'rejected'].includes(nextStatus) && nextStatus !== normalizeBudgetExpenseStatus(expense.status)) return null;
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) expense.title = socialText(payload.title || expense.title);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) expense.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'categoryId')) expense.categoryId = socialText(payload.categoryId || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'amount')) expense.amount = Math.max(0, safeNumber(payload.amount, 0));
    if (Object.prototype.hasOwnProperty.call(payload, 'currency')) expense.currency = normalizeBudgetCurrency(payload.currency || '') || expense.currency;
    if (Object.prototype.hasOwnProperty.call(payload, 'incurredAt')) expense.incurredAt = socialText(payload.incurredAt || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'receiptFile')) expense.receiptFile = payload.receiptFile ? clone(payload.receiptFile) : expense.receiptFile;
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
        expense.status = nextStatus;
        if (['approved', 'paid', 'rejected'].includes(nextStatus)) expense.approvedById = normalizedActorId;
    }
    expense.updatedAt = nowIso();
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'budget-expense-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated expense "${expense.title}".`, { expenseId: expense.id });
    this.saveSocialMutation(normalizedActorId, 'project-budget-expense-updated', 'social-project-budget-expense', expense.id, beforeState, expense);
    return clone(expense);
}

function deleteSocialProjectBudgetExpense(projectId, expenseId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const expense = asArray(this.state.social.projectBudgetExpenses).find((item) => socialText(item?.id) === socialText(expenseId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId);
    if (!project || !expense || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    this.state.social.projectBudgetExpenses = asArray(this.state.social.projectBudgetExpenses).filter((item) => socialText(item?.id) !== socialText(expenseId));
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'budget-expense-removed', `${this.getSocialActorDisplayName(normalizedActorId)} removed expense "${expense.title}".`, { expenseId: socialText(expenseId) });
    this.saveSocialMutation(normalizedActorId, 'project-budget-expense-deleted', 'social-project-budget-expense', socialText(expenseId), expense, null);
    return { ok: true, expenseId: socialText(expenseId) };
}

function createSocialProjectRisk(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId) || !socialText(payload.title)) return null;
    const tasks = asArray(this.state.social.projectTasks).filter((item) => socialText(item?.projectId) === socialText(projectId));
    const risk = {
        id: socialText(payload.id || makeId('projrisk')),
        projectId: socialText(projectId),
        groupId: normalizeProjectRiskGroupId(project, payload.groupId),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        likelihood: normalizeProjectRiskLikelihood(payload.likelihood),
        impact: normalizeProjectRiskImpact(payload.impact),
        status: normalizeProjectRiskStatus(payload.status || 'open'),
        response: normalizeProjectRiskResponse(payload.response || 'mitigate'),
        ownerUserId: socialText(payload.ownerUserId || normalizedActorId),
        mitigation: socialText(payload.mitigation || ''),
        linkedTaskIds: normalizeProjectRiskLinkedTaskIds(projectId, payload.linkedTaskIds, tasks),
        createdById: normalizedActorId,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.projectRisks.push(risk);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'project-risk-created', `${this.getSocialActorDisplayName(normalizedActorId)} logged risk "${risk.title}".`, { riskId: risk.id });
    this.saveSocialMutation(normalizedActorId, 'project-risk-created', 'social-project-risk', risk.id, null, risk);
    return clone(risk);
}

function updateSocialProjectRisk(projectId, riskId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const risk = asArray(this.state.social.projectRisks).find((item) => socialText(item?.id) === socialText(riskId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !risk || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const tasks = asArray(this.state.social.projectTasks).filter((item) => socialText(item?.projectId) === socialText(projectId));
    const beforeState = clone(risk);
    if (Object.prototype.hasOwnProperty.call(payload, 'groupId')) risk.groupId = normalizeProjectRiskGroupId(project, payload.groupId);
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) risk.title = socialText(payload.title || risk.title);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) risk.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'likelihood')) risk.likelihood = normalizeProjectRiskLikelihood(payload.likelihood);
    if (Object.prototype.hasOwnProperty.call(payload, 'impact')) risk.impact = normalizeProjectRiskImpact(payload.impact);
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) risk.status = normalizeProjectRiskStatus(payload.status);
    if (Object.prototype.hasOwnProperty.call(payload, 'response')) risk.response = normalizeProjectRiskResponse(payload.response);
    if (Object.prototype.hasOwnProperty.call(payload, 'ownerUserId')) risk.ownerUserId = socialText(payload.ownerUserId || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'mitigation')) risk.mitigation = socialText(payload.mitigation || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'linkedTaskIds')) {
        risk.linkedTaskIds = normalizeProjectRiskLinkedTaskIds(projectId, payload.linkedTaskIds, tasks);
    }
    risk.updatedAt = nowIso();
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'project-risk-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated risk "${risk.title}".`, { riskId: risk.id });
    this.saveSocialMutation(normalizedActorId, 'project-risk-updated', 'social-project-risk', risk.id, beforeState, risk);
    return clone(risk);
}

function deleteSocialProjectRisk(projectId, riskId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const risk = asArray(this.state.social.projectRisks).find((item) => socialText(item?.id) === socialText(riskId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId);
    if (!project || !risk || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    this.state.social.projectRisks = asArray(this.state.social.projectRisks).filter((item) => socialText(item?.id) !== socialText(riskId));
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'project-risk-removed', `${this.getSocialActorDisplayName(normalizedActorId)} removed risk "${risk.title}".`, { riskId: socialText(riskId) });
    this.saveSocialMutation(normalizedActorId, 'project-risk-deleted', 'social-project-risk', socialText(riskId), risk, null);
    return { ok: true, riskId: socialText(riskId) };
}

function createSocialProjectShowcasePage(projectId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    if (!project || !canManageSocialProject.call(this, project, normalizedActorId)) return null;
    if (socialText(project.showcasePageId || '')) {
        return {
            project: decorateSocialProject.call(this, project, normalizedActorId),
            page: this.decorateSocialPage(this.getSocialPageRecord(project.showcasePageId), normalizedActorId)
        };
    }
    const page = this.createSocialPage({
        ownerUserId: normalizedActorId,
        name: `${project.name} Showcase`,
        description: socialText(project.showcaseSummary || project.summary || project.description || ''),
        about: socialText(project.description || project.summary || ''),
        tagline: socialText(project.courseTag || 'Project workspace outcome'),
        category: 'Project Showcase',
        pageType: 'brand',
        official: false,
        verified: false,
        visibility: 'public'
    }, normalizedActorId);
    if (!page) return null;
    const beforeState = clone(project);
    project.showcaseEnabled = true;
    project.showcasePageId = socialText(page.id);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'showcase-created', `${this.getSocialActorDisplayName(normalizedActorId)} published a showcase page.`, {
        pageId: page.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-showcase-created', 'social-project', project.id, beforeState, project);
    return {
        project: decorateSocialProject.call(this, project, normalizedActorId),
        page
    };
}

module.exports = {
    canContributeToSocialProject,
    canManageSocialProject,
    canViewSocialProject,
    createSocialProject,
    createSocialProjectBudgetCategory,
    createSocialProjectBudgetExpense,
    createSocialProjectRisk,
    createSocialProjectShowcasePage,
    createSocialProjectTask,
    decorateSocialProject,
    deleteSocialProject,
    deleteSocialProjectBudgetCategory,
    deleteSocialProjectBudgetExpense,
    deleteSocialProjectRisk,
    deleteSocialProjectTask,
    getSocialProjectAdvisorIds,
    getSocialProjectByChatId,
    getSocialProjectByGroupId,
    getSocialProjectMemberIds,
    getSocialProjectMemberRole,
    getSocialProjectRecord,
    inviteSocialProjectMember,
    removeSocialProjectMember,
    setSocialProjectMembership,
    setSocialProjectBaseline,
    updateSocialProject,
    updateSocialProjectBudgetCategory,
    updateSocialProjectBudgetExpense,
    updateSocialProjectRisk,
    updateSocialProjectMemberRole,
    updateSocialProjectTask,
    updateSocialProjectTaskGraph
};
