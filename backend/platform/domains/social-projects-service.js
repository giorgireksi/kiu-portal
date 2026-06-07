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

function normalizePortfolioLinks(values) {
    return asArray(values)
        .map((item) => {
            if (item && typeof item === 'object') {
                const label = socialText(item.label || item.title || item.name || item.url);
                const url = this.normalizeSafeExternalUrl(item.url || item.href || '');
                if (!url) return null;
                return { label: label || url, url };
            }
            const url = this.normalizeSafeExternalUrl(item);
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
    if (['backlog', 'todo', 'in-progress', 'blocked', 'done'].includes(normalized)) return normalized;
    return 'backlog';
}

function normalizeTaskPriority(value) {
    const normalized = socialText(value).toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(normalized)) return normalized;
    return 'medium';
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
    // Faculty oversight: professors, TAs, and admins can always see every project
    // team and its tasks regardless of the team's chosen visibility.
    const oversightRole = socialText(this.getSocialAccount(normalizedUserId)?.role).toLowerCase();
    if (['professor', 'ta', 'admin'].includes(oversightRole)) return true;
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
    const milestoneItems = asArray(this.state.social.projectMilestones)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => {
            const leftMs = Number.isFinite(Date.parse(socialText(left?.dueAt || ''))) ? Date.parse(socialText(left?.dueAt || '')) : Number.MAX_SAFE_INTEGER;
            const rightMs = Number.isFinite(Date.parse(socialText(right?.dueAt || ''))) ? Date.parse(socialText(right?.dueAt || '')) : Number.MAX_SAFE_INTEGER;
            if (leftMs !== rightMs) return leftMs - rightMs;
            return socialCompareNewest(right?.createdAt, left?.createdAt);
        });
    const deliverableItems = asArray(this.state.social.projectDeliverables)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => socialCompareNewest(left?.submittedAt || left?.createdAt, right?.submittedAt || right?.createdAt));
    const checkinItems = asArray(this.state.social.projectCheckins).filter(item => socialText(item?.projectId) === projectId);
    const activityItems = asArray(this.state.social.projectActivities)
        .filter(item => socialText(item?.projectId) === projectId)
        .sort((left, right) => socialCompareNewest(left?.createdAt, right?.createdAt));
    const meetingItems = asArray(this.state.social.events)
        .filter(item => socialText(item?.projectId || item?.hostProjectId) === projectId)
        .map(item => this.decorateSocialEvent(item, viewerUserId))
        .sort((left, right) => socialCompareNewest(left?.startsAt, right?.startsAt));
    const taskStatuses = ['backlog', 'todo', 'in-progress', 'blocked', 'done'];
    const taskStatusCounts = taskStatuses.reduce((accumulator, status) => {
        accumulator[status] = 0;
        return accumulator;
    }, {});
    taskItems.forEach((task) => {
        const status = normalizeTaskStatus(task?.status || 'backlog');
        taskStatusCounts[status] = safeNumber(taskStatusCounts[status], 0) + 1;
    });
    const completedTaskCount = safeNumber(taskStatusCounts.done, 0);
    const openTaskCount = taskItems.length - completedTaskCount;
    const taskCompletionPercent = taskItems.length ? Math.round((completedTaskCount / taskItems.length) * 100) : 0;
    const nowMs = Date.now();
    const milestoneCompletedCount = milestoneItems.filter(item => Boolean(item?.completed)).length;
    const milestoneOpenCount = milestoneItems.length - milestoneCompletedCount;
    const milestoneOverdueCount = milestoneItems.filter((item) => {
        if (Boolean(item?.completed)) return false;
        const dueAt = socialText(item?.dueAt || '');
        if (!dueAt) return false;
        const dueMs = Date.parse(dueAt);
        return Number.isFinite(dueMs) && dueMs < nowMs;
    }).length;
    const milestoneCompletionPercent = milestoneItems.length ? Math.round((milestoneCompletedCount / milestoneItems.length) * 100) : 0;
    const deliverableReviewCounts = deliverableItems.reduce((accumulator, item) => {
        const status = socialText(item?.reviewStatus || 'draft') || 'draft';
        accumulator[status] = safeNumber(accumulator[status], 0) + 1;
        return accumulator;
    }, {});
    const roleOrder = ['owner', 'member', 'advisor', 'instructor-viewer'];
    const roleCounts = roleOrder.reduce((accumulator, role) => {
        accumulator[role] = 0;
        return accumulator;
    }, {});
    const facultyCounts = {};
    const workloadCounts = {};
    const memberSummaries = memberIds.map((userId) => {
        const role = getSocialProjectMemberRole.call(this, normalized, userId) || 'member';
        roleCounts[role] = safeNumber(roleCounts[role], 0) + 1;
        const account = this.getSocialAccount(userId) || {};
        const facultyCode = socialText(account?.facultyCode || account?.faculty || '');
        if (facultyCode) facultyCounts[facultyCode] = safeNumber(facultyCounts[facultyCode], 0) + 1;
        workloadCounts[userId] = 0;
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
        if (!assigneeUserId || normalizeTaskStatus(task?.status || 'backlog') === 'done') return;
        workloadCounts[assigneeUserId] = safeNumber(workloadCounts[assigneeUserId], 0) + 1;
    });
    const workloadByMember = memberSummaries
        .map((entry) => ({
            ...entry,
            count: safeNumber(workloadCounts[entry.userId], 0)
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
        taskCount: taskItems.length,
        openTaskCount,
        completedTaskCount,
        taskStatusCounts,
        taskCompletionPercent,
        milestoneCount: milestoneItems.length,
        milestoneCompletedCount,
        milestoneOpenCount,
        milestoneOverdueCount,
        milestoneCompletionPercent,
        deliverableCount: deliverableItems.length,
        deliverableReviewCounts,
        checkinCount: checkinItems.length,
        activityCount: activityItems.length,
        activityBuckets,
        facultyMix,
        roleMix,
        workloadByMember,
        nextOwnerUserId,
        isOrphaned: !socialText(normalized.ownerUserId || ''),
        meetingCount: meetingItems.length,
        memberSummaries: memberSummaries.sort((left, right) => {
            const leftMs = Number.isFinite(Date.parse(left.joinedAt || '')) ? Date.parse(left.joinedAt || '') : Number.MAX_SAFE_INTEGER;
            const rightMs = Number.isFinite(Date.parse(right.joinedAt || '')) ? Date.parse(right.joinedAt || '') : Number.MAX_SAFE_INTEGER;
            if (leftMs !== rightMs) return leftMs - rightMs;
            return String(left.userId || '').localeCompare(String(right.userId || ''));
        }),
        tasks: taskItems,
        milestones: milestoneItems,
        deliverables: deliverableItems,
        checkins: checkinItems.sort((left, right) => socialCompareNewest(left?.createdAt, right?.createdAt)),
        activity: activityItems,
        meetings: meetingItems,
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
    if (Object.prototype.hasOwnProperty.call(payload, 'recommendedTeamSize')) project.recommendedTeamSize = Math.max(2, safeNumber(payload.recommendedTeamSize, project.recommendedTeamSize || 4));
    if (Object.prototype.hasOwnProperty.call(payload, 'minTeamSize')) project.minTeamSize = Math.max(2, safeNumber(payload.minTeamSize, project.minTeamSize || 4));
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
    this.state.social.projectMilestones = asArray(this.state.social.projectMilestones)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectDeliverables = asArray(this.state.social.projectDeliverables)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectCheckins = asArray(this.state.social.projectCheckins)
        .filter((entry) => socialText(entry?.projectId) !== normalizedProjectId);
    this.state.social.projectActivities = asArray(this.state.social.projectActivities)
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
    const task = {
        id: socialText(payload.id || makeId('task')),
        projectId: socialText(projectId),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        status: normalizeTaskStatus(payload.status || 'backlog'),
        assigneeUserId: socialText(payload.assigneeUserId || ''),
        dueAt: socialText(payload.dueAt || ''),
        priority: normalizeTaskPriority(payload.priority || 'medium'),
        checklist: asArray(payload.checklist).map((item, index) => ({
            id: socialText(item?.id || makeId(`check${index + 1}`)),
            label: socialText(item?.label || item?.title || ''),
            done: Boolean(item?.done)
        })).filter(item => item.label),
        createdById: normalizedActorId,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
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
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) task.title = socialText(payload.title || task.title);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) task.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) task.status = normalizeTaskStatus(payload.status || task.status);
    if (Object.prototype.hasOwnProperty.call(payload, 'assigneeUserId')) task.assigneeUserId = socialText(payload.assigneeUserId || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'dueAt')) task.dueAt = socialText(payload.dueAt || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'priority')) task.priority = normalizeTaskPriority(payload.priority || task.priority);
    if (Object.prototype.hasOwnProperty.call(payload, 'checklist')) {
        task.checklist = asArray(payload.checklist).map((item, index) => ({
            id: socialText(item?.id || makeId(`check${index + 1}`)),
            label: socialText(item?.label || item?.title || ''),
            done: Boolean(item?.done)
        })).filter(item => item.label);
    }
    task.updatedAt = nowIso();
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'task-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated task "${task.title}".`, {
        taskId: task.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-task-updated', 'social-project-task', task.id, beforeState, task);
    return clone(task);
}

function deleteSocialProjectTask(projectId, taskId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const task = asArray(this.state.social.projectTasks).find(item => socialText(item?.id) === socialText(taskId) && socialText(item?.projectId) === socialText(projectId));
    if (!project || !task || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    this.state.social.projectTasks = asArray(this.state.social.projectTasks).filter(item => socialText(item?.id) !== socialText(taskId));
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'task-deleted', `${this.getSocialActorDisplayName(normalizedActorId)} removed task "${task.title}".`, {
        taskId: socialText(taskId)
    });
    this.saveSocialMutation(normalizedActorId, 'project-task-deleted', 'social-project-task', socialText(taskId), task, null);
    return { ok: true, taskId: socialText(taskId) };
}

function createSocialProjectMilestone(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId) || !socialText(payload.title)) return null;
    const milestone = {
        id: socialText(payload.id || makeId('milestone')),
        projectId: socialText(projectId),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        dueAt: socialText(payload.dueAt || ''),
        linkedTaskIds: socialIdArray(payload.linkedTaskIds || []),
        completed: Boolean(payload.completed),
        createdById: normalizedActorId,
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.projectMilestones.unshift(milestone);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'milestone-created', `${this.getSocialActorDisplayName(normalizedActorId)} added milestone "${milestone.title}".`, {
        milestoneId: milestone.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-milestone-created', 'social-project-milestone', milestone.id, null, milestone);
    return clone(milestone);
}

function updateSocialProjectMilestone(projectId, milestoneId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const milestone = asArray(this.state.social.projectMilestones).find(item => socialText(item?.id) === socialText(milestoneId) && socialText(item?.projectId) === socialText(projectId));
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !milestone || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const beforeState = clone(milestone);
    if (Object.prototype.hasOwnProperty.call(payload, 'title')) milestone.title = socialText(payload.title || milestone.title);
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) milestone.description = socialText(payload.description || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'dueAt')) milestone.dueAt = socialText(payload.dueAt || '');
    if (Object.prototype.hasOwnProperty.call(payload, 'linkedTaskIds')) milestone.linkedTaskIds = socialIdArray(payload.linkedTaskIds || []);
    if (Object.prototype.hasOwnProperty.call(payload, 'completed')) milestone.completed = Boolean(payload.completed);
    milestone.updatedAt = nowIso();
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'milestone-updated', `${this.getSocialActorDisplayName(normalizedActorId)} updated milestone "${milestone.title}".`, {
        milestoneId: milestone.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-milestone-updated', 'social-project-milestone', milestone.id, beforeState, milestone);
    return clone(milestone);
}

function deleteSocialProjectMilestone(projectId, milestoneId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const milestone = asArray(this.state.social.projectMilestones).find(item => socialText(item?.id) === socialText(milestoneId) && socialText(item?.projectId) === socialText(projectId));
    if (!project || !milestone || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    this.state.social.projectMilestones = asArray(this.state.social.projectMilestones).filter(item => socialText(item?.id) !== socialText(milestoneId));
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'milestone-deleted', `${this.getSocialActorDisplayName(normalizedActorId)} removed milestone "${milestone.title}".`, {
        milestoneId: socialText(milestoneId)
    });
    this.saveSocialMutation(normalizedActorId, 'project-milestone-deleted', 'social-project-milestone', socialText(milestoneId), milestone, null);
    return { ok: true, milestoneId: socialText(milestoneId) };
}

function createSocialProjectDeliverable(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId) || !socialText(payload.title)) return null;
    const deliverable = {
        id: socialText(payload.id || makeId('deliverable')),
        projectId: socialText(projectId),
        title: socialText(payload.title),
        description: socialText(payload.description || ''),
        versionLabel: socialText(payload.versionLabel || `v${asArray(this.state.social.projectDeliverables).filter(item => socialText(item?.projectId) === socialText(projectId)).length + 1}`),
        reviewStatus: socialText(payload.reviewStatus || 'draft') || 'draft',
        file: payload.file ? clone(payload.file) : null,
        submittedById: normalizedActorId,
        submittedAt: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.projectDeliverables.unshift(deliverable);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'deliverable-submitted', `${this.getSocialActorDisplayName(normalizedActorId)} submitted deliverable "${deliverable.title}".`, {
        deliverableId: deliverable.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-deliverable-created', 'social-project-deliverable', deliverable.id, null, deliverable);
    return clone(deliverable);
}

function deleteSocialProjectDeliverable(projectId, deliverableId, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId);
    const deliverable = asArray(this.state.social.projectDeliverables).find(item => socialText(item?.id) === socialText(deliverableId) && socialText(item?.projectId) === socialText(projectId));
    if (!project || !deliverable || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    this.state.social.projectDeliverables = asArray(this.state.social.projectDeliverables).filter(item => socialText(item?.id) !== socialText(deliverableId));
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'deliverable-removed', `${this.getSocialActorDisplayName(normalizedActorId)} removed deliverable "${deliverable.title}".`, {
        deliverableId: socialText(deliverableId)
    });
    this.saveSocialMutation(normalizedActorId, 'project-deliverable-deleted', 'social-project-deliverable', socialText(deliverableId), deliverable, null);
    return { ok: true, deliverableId: socialText(deliverableId) };
}

function createSocialProjectCheckin(projectId, payload = {}, actorId = '') {
    this.ensureSocialProjectCollections();
    const project = getSocialProjectRecord.call(this, projectId);
    const normalizedActorId = socialText(actorId || payload.actorId || '');
    if (!project || !canContributeToSocialProject.call(this, project, normalizedActorId)) return null;
    const checkin = {
        id: socialText(payload.id || makeId('checkin')),
        projectId: socialText(projectId),
        authorUserId: normalizedActorId,
        whatDone: socialText(payload.whatDone || payload.done || ''),
        blockers: socialText(payload.blockers || ''),
        nextSteps: socialText(payload.nextSteps || ''),
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.projectCheckins.unshift(checkin);
    project.updatedAt = nowIso();
    this.appendSocialProjectActivity(project.id, normalizedActorId, 'checkin-posted', `${this.getSocialActorDisplayName(normalizedActorId)} posted a weekly check-in.`, {
        checkinId: checkin.id
    });
    this.saveSocialMutation(normalizedActorId, 'project-checkin-created', 'social-project-checkin', checkin.id, null, checkin);
    return clone(checkin);
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
    createSocialProjectCheckin,
    createSocialProjectDeliverable,
    createSocialProjectMilestone,
    createSocialProjectShowcasePage,
    createSocialProjectTask,
    decorateSocialProject,
    deleteSocialProject,
    deleteSocialProjectDeliverable,
    deleteSocialProjectMilestone,
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
    updateSocialProject,
    updateSocialProjectMemberRole,
    updateSocialProjectMilestone,
    updateSocialProjectTask
};
