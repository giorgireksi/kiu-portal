/* READABILITY: Social workspace panel — project desk chrome, tabs, budget/team side panels.
 * Sections: Boot | Desk | Tabs | Budget | Team
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Boot ---
/* Social workspace classic projects/desk panel renderer.
// --- READABILITY: Desk ---
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspacePanelApi(deps).
 */
(function initSocialWorkspacePanel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PANEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PANEL_LOADED = true;

        function createKiuSocialWorkspacePanelApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace panel deps required');
        const {
            PROJECT_TASK_COLUMNS,
            accountById,
            accountSubtitle,
            avatar,
            buildDeskTaskForest,
// --- READABILITY: Tabs ---
            clearProjectTabPaneCache,
            computeProjectSchedule,
            computeProjectTaskGraphGroupRollup,
            countNum,
            currentFacultyCode,
            currentUser,
            currentUserId,
            displayName,
            ensureProjectWorkspaceChat,
            ensureSocialMessagesModule,
            escape,
            filterProjectBoardTasks,
            formatProjectScheduleDate,
            formatProjectScheduleHours,
// --- READABILITY: Budget ---
            formatProjectTaskBudgetEstimate,
            getProjectTaskGraphGroups,
            hasSocialMessagesModule,
            isAccountOnline,
            isStaffAccount,
            normalizeProjectTaskStatusId,
            orderDeskTasksByDependency,
            projectTaskDependsOnIds,
            projectTaskDownstreamIds,
            queueDeferredModuleRender,
            readDeskSavedViews,
            renderDeskTaskTreeForest,
            renderMessagesThreadShell,
            renderProjectPlanVsBaselineStrip,
            renderProjectProgressHoursStrip,
            renderProjectTaskCard,
            renderProjectTaskColumnList,
            renderProjectTaskDeskCard,
            renderProjectWorkspaceNavButtons,
            renderSocialPageNow,
            renderTaskDependencyGraphPreview,
            renderWorkspaceHero,
            resolveDeskTaskReadiness,
            resolveProjectWorkspaceChat,
            resolveTaskScheduleEstimate,
            root,
            setActiveChat,
            socialNeoEmpty,
            socialNeoEmptyHero,
            state,
            taskActivityMs,
            text,
            uniqueStrings,
            when
        } = deps;

        function canViewProjectWorkspaceCard(project) {
            const role = text(project?.role || '').toLowerCase();
            if (['owner', 'member', 'advisor', 'instructor-viewer'].includes(role)) return true;
            return Boolean(isStaffAccount?.(currentUser?.()));
        }

        function renderProjectsWorkspacePanelClassic() {
            const runtime = state();
            const social = runtime.social || {};
            const projects = Array.isArray(social.projects) ? social.projects : [];
            const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
            const activeProjectId = text(runtime.ui?.activeProjectId || '');
            const activeProject = projects.find((project) => text(project?.id) === activeProjectId) || null;
            const activeTabRaw = text(runtime.ui?.projectTab || 'overview') || 'overview';
            const REMOVED_PROJECT_TABS = new Set(['plan', 'milestones', 'meetings', 'files', 'checkins']);
            const activeTab = REMOVED_PROJECT_TABS.has(activeTabRaw) ? 'overview' : activeTabRaw;
            const facultyOptions = uniqueStrings([
                currentFacultyCode(),
                ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : []),
                ...directory.map((account) => text(account?.facultyCode || account?.faculty))
            ]).filter(Boolean);
            const projectFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()];
            const roleLabels = {
                owner: 'Owner',
                member: 'Member',
                advisor: 'Advisor',
                'instructor-viewer': 'Instructor viewer'
            };
            const statusMeta = {
                idea: { label: 'Idea', note: 'Still being shaped' },
                active: { label: 'Active', note: 'Execution in progress' },
                review: { label: 'Review', note: 'Preparing for review' },
                completed: { label: 'Completed', note: 'Workspace delivered' }
            };
            const taskColumns = PROJECT_TASK_COLUMNS;
            const advisorCandidates = directory.filter((account) => isStaffAccount(account) || ['professor', 'ta', 'admin'].includes(text(account?.role || '').toLowerCase()));
            const projectInviteSelectedIds = Array.isArray(runtime.ui?.projectInviteSelectedIds) ? runtime.ui.projectInviteSelectedIds : [];
            const inviteSearch = text(runtime.ui?.projectInviteSearch || '').toLowerCase();
            const inviteFaculty = text(runtime.ui?.projectInviteFaculty || 'all') || 'all';
            const selectedProjectMemberIds = uniqueStrings([
                ...(Array.isArray(activeProject?.memberIds) ? activeProject.memberIds : []),
                ...(Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : []),
                text(activeProject?.advisorUserId || ''),
                ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])
            ]);
            const filteredInviteCandidates = directory
                .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
                .filter((account) => !projectInviteSelectedIds.includes(text(account.id)))
                .filter((account) => !selectedProjectMemberIds.includes(text(account.id)))
                .filter((account) => inviteFaculty === 'all' || text(account?.facultyCode || account?.faculty) === inviteFaculty)
                .filter((account) => {
                    if (!inviteSearch) return true;
                    const blob = `${displayName(account)} ${accountSubtitle(account)} ${text(account?.facultyCode || account?.faculty)} ${Array.isArray(account?.interests) ? account.interests.join(' ') : ''}`.toLowerCase();
                    return blob.includes(inviteSearch);
                })
                .slice(0, 18);
            const myProjects = projects.filter(canViewProjectWorkspaceCard);
            const featuredProjects = [...myProjects]
                .sort((left, right) => Number(right?.activityCount || 0) - Number(left?.activityCount || 0))
                .slice(0, 6);
            const projectRolePill = (role) => `<span class="social-neo-pill home-hover-chip">${escape(roleLabels[text(role).toLowerCase()] || roleLabel(role || 'member'))}</span>`;
            const facultyPills = (codes = []) => (Array.isArray(codes) ? codes : []).map((code) => `<span class="social-neo-pill home-hover-chip">${escape(code)}</span>`).join('');
            const skillPills = (skills = []) => (Array.isArray(skills) ? skills : []).map((skill) => `<span class="social-neo-pill home-hover-chip">${escape(skill)}</span>`).join('');
            const scrollList = (modifier, content) => `<div class="social-project-scroll-list${modifier ? ` ${modifier}` : ''}">${content}</div>`;
            const projectToneFromAccent = (accent = '') => {
                const normalized = text(accent).toLowerCase();
                if (normalized === '#3b82f6') return 'blue';
                if (normalized === '#8b5cf6') return 'purple';
                if (normalized === '#14b8a6') return 'teal';
                return 'orange';
            };
            const renderMetricCard = (icon, label, value, note, accent = '#f97316') => `
                <article class="social-project-metric-card lux-soft-chrome home-hover-chip" data-project-tone="${projectToneFromAccent(accent)}">
                    <span class="social-project-metric-icon"><i class="fas ${escape(icon)}"></i></span>
                    <div>
                        <small>${escape(label)}</small>
                        <strong>${escape(String(value))}</strong>
                        <span>${escape(note)}</span>
                    </div>
                </article>
            `;
            const renderProgressRing = (value, label, note, accent = '#f97316') => {
                const normalized = Math.max(0, Math.min(100, countNum(value)));
                const circumference = 2 * Math.PI * 42;
                const dash = circumference - ((normalized / 100) * circumference);
                return `
                    <article class="social-project-ring-card lux-soft-chrome" data-project-tone="${projectToneFromAccent(accent)}">
                        <svg viewBox="0 0 110 110" aria-hidden="true">
                            <circle cx="55" cy="55" r="42" class="social-project-ring-track"></circle>
                            <circle cx="55" cy="55" r="42" class="social-project-ring-value" stroke-dasharray="${circumference}" stroke-dashoffset="${dash}"></circle>
                        </svg>
                        <div class="social-project-ring-copy">
                            <strong>${escape(String(normalized))}%</strong>
                            <span>${escape(label)}</span>
                            <small>${escape(note)}</small>
                        </div>
                    </article>
                `;
            };
            const renderSparkline = (points = []) => {
                const list = Array.isArray(points) && points.length ? points : [{ count: 0, label: '00/00' }];
                const maxValue = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
                const width = 800;
                const height = 96;
                const step = list.length > 1 ? width / (list.length - 1) : width;
                const pts = list.map((entry, index) => {
                    const x = Math.round(index * step);
                    const y = Math.round(height - ((countNum(entry?.count) / maxValue) * (height - 20)) - 10);
                    return { x, y, count: countNum(entry?.count) };
                });
                const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
                const areaPath = `M${pts[0].x},${height} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${height} Z`;
                return `
                    <div class="social-project-sparkline social-project-sparkline--full">
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" class="social-project-sparkline-svg">
                            <defs>
                                <linearGradient id="spark-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="var(--lux-accent, #7c6cff)" stop-opacity="0.28"/>
                                    <stop offset="100%" stop-color="var(--lux-accent, #7c6cff)" stop-opacity="0.02"/>
                                </linearGradient>
                            </defs>
                            <path d="${areaPath}" fill="url(#spark-area-gradient)"/>
                            <polyline points="${polyline}" class="social-project-sparkline-line"></polyline>
                            ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" class="social-project-sparkline-dot" opacity="${p.count > 0 ? '1' : '0.3'}"/>`).join('')}
                        </svg>
                        <div class="social-project-sparkline-labels">
                            ${list.map((entry) => `<span>${escape(text(entry?.label || ''))}</span>`).join('')}
                        </div>
                    </div>
                `;
            };
            const renderMiniProgressRing = (value, accent = '#f97316', size = 44) => {
                const normalized = Math.max(0, Math.min(100, countNum(value)));
                const r = (size / 2) - 5;
                const circumference = 2 * Math.PI * r;
                const dash = circumference - ((normalized / 100) * circumference);
                const center = size / 2;
                return `
                    <svg class="social-project-mini-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
                        <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="rgba(148,163,184,0.2)" stroke-width="4"></circle>
                        <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dash}" transform="rotate(-90 ${center} ${center})"></circle>
                        <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="social-project-mini-ring-text">${escape(String(normalized))}%</text>
                    </svg>
                `;
            };
            const renderMiniSparkline = (points = [], width = 200, height = 40) => {
                const list = Array.isArray(points) && points.length ? points : [{ count: 0 }];
                const maxValue = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
                const step = list.length > 1 ? width / (list.length - 1) : width;
                const pts = list.map((entry, index) => {
                    const x = Math.round(index * step);
                    const y = Math.round(height - ((countNum(entry?.count) / maxValue) * (height - 8)) - 4);
                    return { x, y, count: countNum(entry?.count) };
                });
                const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
                const areaPath = `M${pts[0].x},${height} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${height} Z`;
                return `
                    <svg class="social-project-mini-sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                            <linearGradient id="mini-spark-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--lux-accent, #7c6cff)" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="var(--lux-accent, #7c6cff)" stop-opacity="0.02"/>
                            </linearGradient>
                        </defs>
                        <path d="${areaPath}" fill="url(#mini-spark-grad)"/>
                        <polyline points="${polyline}" fill="none" stroke="var(--lux-accent, #7c6cff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                    </svg>
                `;
            };
            const renderHealthIndicator = (project) => {
                const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
                const now = Date.now();
                const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
                const taskPct = countNum(project?.taskCompletionPercent);
                const activityCount = countNum(project?.activityCount);
                let level = 'good';
                let label = 'On track';
                let icon = 'fa-circle-check';
                const alerts = [];
                if (overdueTasks >= 3) {
                    level = 'critical';
                    label = 'Critical';
                    icon = 'fa-triangle-exclamation';
                } else if (overdueTasks >= 1 || taskPct < 30) {
                    level = 'needs-attention';
                    label = 'Needs attention';
                    icon = 'fa-circle-exclamation';
                }
                if (overdueTasks > 0) alerts.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`);
                if (taskPct === 0 && tasks.length > 0) alerts.push('No tasks completed yet');
                if (tasks.length === 0) alerts.push('No tasks created');
                const wins = [];
                if (taskPct >= 50) wins.push(`${taskPct}% tasks done`);
                if (activityCount > 0) wins.push(`${activityCount} events this week`);
                if (overdueTasks === 0 && tasks.length > 0) wins.push('No overdue items');
                return `
                    <section class="social-neo-card social-project-health-card" data-health="${escape(level)}">
                        <div class="social-neo-section-head">
                            <div><strong>Project health</strong><span>Overall workspace status.</span></div>
                            <span class="social-project-health-badge home-hover-chip" data-health="${escape(level)}"><i class="fas ${escape(icon)}"></i> ${escape(label)}</span>
                        </div>
                        <div class="social-project-overview-slot__scroll social-project-health-body">
                            ${alerts.length ? `<div class="social-project-health-list">${alerts.map((a) => `<div class="social-project-health-alert"><i class="fas fa-circle-xmark"></i> ${escape(a)}</div>`).join('')}</div>` : ''}
                            ${wins.length ? `<div class="social-project-health-list">${wins.map((w) => `<div class="social-project-health-win"><i class="fas fa-circle-check"></i> ${escape(w)}</div>`).join('')}</div>` : ''}
                            ${!alerts.length && !wins.length ? '<div class="social-neo-muted">Start adding tasks to see health status.</div>' : ''}
                        </div>
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                    </section>
                `;
            };
            const renderMyTasks = (project) => {
                const userId = currentUserId();
                const allTasks = Array.isArray(project?.tasks) ? project.tasks : [];
                const myTasks = allTasks.filter((t) => text(t.assigneeUserId) === userId && t.status !== 'done').sort((a, b) => {
                    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
                    if (a.dueAt) return -1;
                    if (b.dueAt) return 1;
                    return 0;
                }).slice(0, 5);
                const toneMap = { todo: 'blue', 'in-progress': 'orange', blocked: 'rose', done: 'emerald' };
                const labelMap = { todo: 'To Do', 'in-progress': 'In Progress', blocked: 'Blocked', done: 'Done' };
                const priorityIcon = { 'low': 'fa-arrow-down', 'medium': 'fa-minus', 'high': 'fa-arrow-up', 'urgent': 'fa-angles-up' };
                return `
                    <section class="social-neo-card social-project-my-tasks-card">
                        <div class="social-neo-section-head">
                            <div><strong>My tasks</strong><span>Your assigned work.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(myTasks.length))} open</span>
                        </div>
                        ${myTasks.length ? `<div class="social-project-overview-slot__scroll social-project-my-tasks-list">${myTasks.map((task) => {
                            const now = Date.now();
                            const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < now;
                            const tone = toneMap[task.status] || 'slate';
                            return `
                                <div class="social-project-my-task-item is-clickable ${isOverdue ? 'is-overdue' : ''}" role="button" tabindex="0" data-action="project-task-detail-open" data-project-id="${escape(text(project?.id))}" data-task-id="${escape(text(task?.id))}">
                                    <span class="social-project-status-dot is-${escape(tone)}"></span>
                                    <span class="social-project-my-task-title">${escape(text(task.title || ''))}</span>
                                    <span class="social-project-status-label">${escape(labelMap[task.status] || task.status)}</span>
                                    ${task.priority && task.priority !== 'medium' ? `<span class="social-project-priority-pill home-hover-chip" data-priority="${escape(task.priority)}"><i class="fas ${escape(priorityIcon[task.priority] || 'fa-minus')}"></i> ${escape(task.priority)}</span>` : ''}
                                    ${task.dueAt ? `<span class="social-project-my-task-due ${isOverdue ? 'is-overdue' : ''}">${escape(when(task.dueAt))}</span>` : ''}
                                </div>
                            `;
                        }).join('')}</div>` : '<div class="social-neo-empty">No tasks assigned to you yet.</div>'}
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                    </section>
                `;
            };
// --- READABILITY: Team ---
            const renderTeamRoster = (project, members) => {
                const list = Array.isArray(members) ? members.slice(0, 6) : [];
                return `
                    <section class="social-neo-card social-project-roster-card">
                        <div class="social-neo-section-head">
                            <div><strong>Team</strong><span>Members and roles.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(project?.memberCount || 0))} members</span>
                        </div>
                        ${list.length ? `<div class="social-project-overview-slot__scroll social-project-team-roster">${list.map((member) => {
                            const account = accountById(member.userId) || { id: member.userId };
                            const online = isAccountOnline(account);
                            const roleLabel = text(member.role || 'member');
                            const facultyCode = text(member.facultyCode || account?.facultyCode || account?.faculty || '');
                            return `
                                <div class="social-project-roster-member">
                                    <span class="social-project-roster-dot ${online ? 'is-online' : ''}"></span>
                                    <div class="social-neo-person">${avatar(account, 'social-neo-avatar-sm')}<div><strong>${escape(displayName(account))}</strong><span>${escape(roleLabel)}${facultyCode ? ` · ${escape(facultyCode)}` : ''}</span></div></div>
                                </div>
                            `;
                        }).join('')}</div>` : '<div class="social-neo-empty">No team members yet.</div>'}
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="team">View all team →</span></div>
                    </section>
                `;
            };
            const activityIconMap = {
                'project-created': 'fa-rocket',
                'project-updated': 'fa-pen',
                'member-invited': 'fa-user-plus',
                'member-role-updated': 'fa-user-shield',
                'member-removed': 'fa-user-minus',
                'member-left': 'fa-door-open',
                'task-created': 'fa-square-plus',
                'task-updated': 'fa-list-check',
                'task-deleted': 'fa-trash',
                'milestone-created': 'fa-flag',
                'milestone-updated': 'fa-flag-checkered',
                'milestone-deleted': 'fa-trash',
                'deliverable-submitted': 'fa-box-archive',
                'deliverable-submitted-for-review': 'fa-paper-plane',
                'deliverable-approved': 'fa-check',
                'deliverable-revision-requested': 'fa-rotate-left',
                'deliverable-updated': 'fa-pen',
                'deliverable-removed': 'fa-trash',
                'checkin-posted': 'fa-comment-dots',
                'showcase-created': 'fa-globe'
            };
            const renderActivityItem = (entry) => {
                const actor = accountById(entry.actorUserId) || { id: entry.actorUserId };
                return `
                    <article class="social-project-activity-item">
                        <div class="social-project-activity-icon"><i class="fas ${escape(activityIconMap[text(entry?.type || '')] || 'fa-clock-rotate-left')}"></i></div>
                        <div class="social-project-activity-body">
                            <div class="social-project-activity-head">
                                <div class="social-neo-person">
                                    ${avatar(actor, 'social-neo-avatar-sm')}
                                    <div>
                                        <strong>${escape(displayName(actor))}</strong>
                                        <span>${escape(text(entry.summary || entry.type || 'Updated the project'))}</span>
                                    </div>
                                </div>
                                <em>${escape(when(entry.createdAt || ''))}</em>
                            </div>
                        </div>
                    </article>
                `;
            };
            const renderActivityFeed = (project) => {
                const items = Array.isArray(project?.activity) ? project.activity.slice(0, 5) : [];
                return `
                    <section class="social-neo-card social-project-feed-card">
                        <div class="social-neo-section-head">
                            <div><strong>Recent activity</strong><span>Latest workspace changes.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(project?.activityCount || 0))} events</span>
                        </div>
                        ${items.length ? `<div class="social-project-overview-slot__scroll social-project-activity-feed">${items.map(renderActivityItem).join('')}</div>` : '<div class="social-neo-empty">No activity recorded yet.</div>'}
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="activity">View all activity →</span></div>
                    </section>
                `;
            };
            const renderQuickActions = (project, options = {}) => {
                const compact = Boolean(options?.compact);
                const limit = compact ? Math.max(1, Number(options?.limit) || 4) : 0;
                const isManager = Boolean(project?.isManager || project?.viewerCanContribute);
                const projectId = escape(text(project?.id));
                const actions = [
                    { icon: 'fa-comments', label: 'Open chat', action: 'project-open-chat' },
                    { icon: 'fa-list-check', label: 'Create task', tab: 'tasks' },
                    { icon: 'fa-diagram-project', label: 'Task flow map', action: 'project-task-graph-open' },
                    ...(isManager ? [{ icon: 'fa-globe', label: 'Publish showcase', action: 'project-showcase-publish' }] : []),
                ];
                const renderActionBtn = (entry, extraClass = '') => {
                    const cls = `lux-secondary-btn${extraClass ? ` ${extraClass}` : ''}`;
                    if (entry.action === 'project-open-chat') {
                        return `<button class="${cls}" type="button" data-action="project-open-chat" data-project-id="${projectId}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                    }
                    if (entry.action === 'project-showcase-publish') {
                        return `<button class="${cls}" type="button" data-action="project-showcase-publish" data-project-id="${projectId}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                    }
                    if (entry.action === 'project-task-graph-open') {
                        return `<button class="${cls}" type="button" data-action="project-task-graph-open" data-project-id="${projectId}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                    }
                    return `<button class="${cls}" type="button" data-action="project-tab" data-project-id="${projectId}" data-project-tab="${entry.tab}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                };
                const primary = limit ? actions.slice(0, limit) : actions;
                const overflow = limit ? actions.slice(limit) : [];
                return `
                    <section class="social-neo-card social-project-quick-actions-card${compact ? ' is-compact' : ''}">
                        <div class="social-neo-section-head">
                            <div><strong>Quick actions</strong><span>Common workspace operations.</span></div>
                        </div>
                        <div class="social-project-quick-actions-grid">
                            ${primary.map((entry) => renderActionBtn(entry)).join('')}
                        </div>
                        ${overflow.length ? `
                            <details class="social-project-quick-actions-more">
                                <summary class="social-project-quick-actions-more-trigger"><i class="fas fa-ellipsis"></i> More actions</summary>
                                <div class="social-project-quick-actions-more-menu">
                                    ${overflow.map((entry) => renderActionBtn(entry, 'social-project-quick-actions-more-btn')).join('')}
                                </div>
                            </details>
                        ` : ''}
                    </section>
                `;
            };
            const renderTaskStatusChart = (project) => {
                const counts = project?.taskStatusCounts || {};
                const total = Math.max(1, countNum(project?.taskCount));
                return `
                    <section class="social-neo-card social-project-chart-card">
                        <div class="social-neo-section-head">
                            <div><strong>Task status distribution</strong><span>See where work is collecting across the board.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(project?.taskCount || 0))} tasks</span>
                        </div>
                        <div class="social-project-overview-slot__scroll social-project-status-chart">
                            <div class="social-project-status-bar">
                                ${taskColumns.map((column) => {
                                    const count = countNum(counts?.[column.id]);
                                    const width = total ? Math.max(0, (count / total) * 100) : 0;
                                    return `<span class="social-project-status-segment is-${escape(column.tone)}" style="width:${width}%"></span>`;
                                }).join('')}
                            </div>
                            <div class="social-project-status-grid">
                                ${taskColumns.map((column) => `
                                    <article class="social-project-status-item">
                                        <div>
                                            <span class="social-project-status-dot is-${escape(column.tone)}"></span>
                                            <strong>${escape(column.label)}</strong>
                                        </div>
                                        <span>${escape(String(countNum(counts?.[column.id])))}</span>
                                    </article>
                                `).join('')}
                            </div>
                        </div>
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                    </section>
                `;
            };
            const renderTaskStatusDonut = (project) => {
                const counts = project?.taskStatusCounts || {};
                const total = taskColumns.reduce((sum, column) => sum + countNum(counts?.[column.id]), 0);
                const toneHex = { slate: '#94a3b8', blue: '#3b82f6', orange: '#f97316', rose: '#f43f5e', emerald: '#10b981' };
                const radius = 54;
                const circumference = 2 * Math.PI * radius;
                let offset = 0;
                const segments = total > 0 ? taskColumns.map((column) => {
                    const count = countNum(counts?.[column.id]);
                    if (count <= 0) return '';
                    const length = (count / total) * circumference;
                    const dash = `${length} ${circumference - length}`;
                    const circle = `<circle class="social-project-donut-seg" cx="80" cy="80" r="${radius}" fill="none" stroke="${toneHex[column.tone] || '#94a3b8'}" stroke-width="20" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"></circle>`;
                    offset += length;
                    return circle;
                }).join('') : `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="20"></circle>`;
                const completion = countNum(project?.taskCompletionPercent);
                return `
                    <section class="social-neo-card social-project-chart-card">
                        <div class="social-neo-section-head">
                            <div><strong>Status distribution</strong><span>Share of tasks in each column.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(project?.taskCount || 0))} tasks</span>
                        </div>
                        <div class="social-project-donut-wrap">
                            <svg class="social-project-donut" viewBox="0 0 160 160" role="img" aria-label="Task status distribution">
                                ${segments}
                                <text x="80" y="74" text-anchor="middle" class="social-project-donut-value">${escape(String(completion))}%</text>
                                <text x="80" y="96" text-anchor="middle" class="social-project-donut-label">done</text>
                            </svg>
                            <div class="social-project-donut-legend">
                                ${taskColumns.map((column) => `
                                    <span class="social-project-donut-key">
                                        <i class="social-project-status-dot is-${escape(column.tone)}"></i>
                                        ${escape(column.label)}
                                        <em>${escape(String(countNum(counts?.[column.id])))}</em>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </section>
                `;
            };
            const renderWorkloadChart = (project) => {
                const list = Array.isArray(project?.workloadByMember) ? project.workloadByMember.slice(0, 6) : [];
                const maxHours = Math.max(1, ...list.map((entry) => Number(entry?.hours) || 0));
                return `
                    <section class="social-neo-card social-project-chart-card">
                        <div class="social-neo-section-head">
                            <div><strong>Workload by member</strong><span>Open assigned work per teammate.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(list.length))} shown</span>
                        </div>
                        <div class="social-project-overview-slot__scroll social-project-workload-list">
                            ${list.length ? list.map((entry) => {
                                const account = accountById(entry.userId) || { id: entry.userId };
                                const hours = Number(entry?.hours) || 0;
                                const width = (hours / maxHours) * 100;
                                return `
                                    <article class="social-project-workload-item">
                                        <div class="social-project-workload-head">
                                            <div class="social-neo-person">
                                                ${avatar(account, 'social-neo-avatar-sm')}
                                                <div>
                                                    <strong>${escape(displayName(account))}</strong>
                                                    <span>${escape(text(entry.role || 'member'))}</span>
                                                </div>
                                            </div>
                                            <em>${escape(String(countNum(entry.count)))} open · ${escape(formatProjectScheduleHours(hours))}</em>
                                        </div>
                                        <div class="social-project-workload-bar"><span style="width:${width}%"></span></div>
                                    </article>
                                `;
                            }).join('') : `<div class="social-neo-empty">No assigned workload yet.</div>`}
                        </div>
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="team">View all team →</span></div>
                    </section>
                `;
            };
            const renderProjectCard = (project) => {
                const owner = accountById(project?.ownerUserId) || { id: project?.ownerUserId };
                const status = text(project?.status || 'idea');
                const statusDotClass = status === 'active' ? 'is-active' : status === 'completed' ? 'is-completed' : status === 'review' ? 'is-review' : '';
                const statusLabel = statusMeta[status]?.label || status;
                const taskPercent = countNum(project?.taskCompletionPercent);
                const taskCount = countNum(project?.taskCount);
                const completedTasks = countNum(project?.completedTaskCount);
                const facultyCode = Array.isArray(project?.facultyCodes) ? project.facultyCodes[0] || '' : '';
                const role = text(project?.role || '').toLowerCase();
                const roleLabelText = roleLabels[role] || (role ? roleLabel(role) : '');
                const skillTags = (Array.isArray(project?.skillTags) ? project.skillTags : []).map((tag) => text(tag)).filter(Boolean).slice(0, 3);
                const memberCount = countNum(project?.memberCount);
                const maxMembers = countNum(project?.maxTeamSize || project?.targetTeamSize || project?.maxMembers || 0);
                const capacityLabel = maxMembers > 0 ? `${memberCount}/${maxMembers}` : `${memberCount} members`;
                return `
                    <article class="social-project-card-new home-hover-chip" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                        <div class="social-project-card-new-status">
                            <span class="social-project-status-dot ${escape(statusDotClass)}"></span>
                            <span class="social-project-status-label">${escape(statusLabel)}</span>
                            ${roleLabelText ? `<span class="social-neo-pill home-hover-chip social-project-card-role">${escape(roleLabelText)}</span>` : ''}
                        </div>
                        <h3 class="social-project-card-new-title">${escape(text(project?.name || 'Project workspace'))}</h3>
                        <p class="social-project-card-new-summary">${escape(text(project?.summary || project?.description || ''))}</p>
                        <div class="social-project-card-new-progress">
                            <div class="social-project-card-new-progress-row">
                                <span class="social-project-card-new-progress-label">Tasks</span>
                                <div class="social-project-card-new-progress-bar">
                                    <div class="social-project-card-new-progress-fill" style="width:${taskPercent}%"></div>
                                </div>
                                <span class="social-project-card-new-progress-value">${taskPercent}% (${completedTasks}/${taskCount})</span>
                            </div>
                        </div>
                        ${skillTags.length ? `<div class="social-project-card-new-skills">${skillTags.map((skill) => `<span class="social-neo-pill home-hover-chip">${escape(skill)}</span>`).join('')}</div>` : ''}
                        <div class="social-project-card-new-meta">
                            <span>${escape(displayName(owner))} · ${escape(facultyCode)} · ${escape(capacityLabel)}</span>
                        </div>
                        <div class="social-project-card-new-cta">
                            <span>Open project →</span>
                        </div>
                    </article>
                `;
            };
            const renderProjectRow = (project) => {
                const status = text(project?.status || 'idea');
                const statusDotClass = status === 'active' ? 'is-active' : status === 'completed' ? 'is-completed' : status === 'review' ? 'is-review' : '';
                const statusLabel = statusMeta[status]?.label || status;
                const taskPercent = countNum(project?.taskCompletionPercent);
                const facultyCode = Array.isArray(project?.facultyCodes) ? project.facultyCodes[0] || '' : '';
                const role = text(project?.role || '').toLowerCase();
                const roleLabelText = roleLabels[role] || (role ? roleLabel(role) : '');
                const memberCount = countNum(project?.memberCount);
                const maxMembers = countNum(project?.maxTeamSize || project?.targetTeamSize || project?.maxMembers || 0);
                const capacityLabel = maxMembers > 0 ? `${memberCount}/${maxMembers}` : `${memberCount}`;
                return `
                    <div class="social-project-row home-hover-chip" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                        <div class="social-project-row-status">
                            <span class="social-project-status-dot ${escape(statusDotClass)}"></span>
                            <span class="social-project-status-label">${escape(statusLabel)}</span>
                        </div>
                        <span class="social-project-row-title">${escape(text(project?.name || 'Project workspace'))}</span>
                        <span class="social-project-row-meta">${escape(facultyCode)} · ${escape(capacityLabel)}${roleLabelText ? ` · ${escape(roleLabelText)}` : ''}</span>
                        <div class="social-project-row-progress">
                            <div class="social-project-row-progress-bar">
                                <div class="social-project-row-progress-fill" style="width:${taskPercent}%"></div>
                            </div>
                            <span class="social-project-row-progress-value">${taskPercent}%</span>
                        </div>
                        <span class="social-project-row-cta">Open →</span>
                    </div>
                `;
            };
            if (!activeProject) {
                window.renderProjectWorkspaceTabPanel = null;
                const totalTasks = projects.reduce((sum, project) => sum + countNum(project?.taskCount), 0);
                const totalActivity = projects.reduce((sum, project) => sum + countNum(project?.activityCount), 0);
                const hubScope = text(runtime.ui?.projectHubScope || 'mine') || 'mine';
                const hubStatus = text(runtime.ui?.projectHubStatus || 'all') || 'all';
                const hubViewMode = text(runtime.ui?.projectHubViewMode || 'grid') || 'grid';
                const discoverSearch = text(runtime.ui?.projectDiscoverSearch || '').toLowerCase();
                const chrome = window.KiuSocialChromeModel || {};
                const browseFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
                    ? chrome.socialBrowseFacultyValue(runtime)
                    : (text(runtime.ui?.projectDiscoverFaculty || '') || (hubScope === 'faculty' ? currentFacultyCode() : 'all'));
                const discoverFaculty = browseFaculty;
                const discoverTag = text(runtime.ui?.projectDiscoverTag || '').toLowerCase();
                const currentUser = currentUserId();
                const hubSkillOptions = uniqueStrings(projects.flatMap((project) => Array.isArray(project?.skillTags) ? project.skillTags : [])).slice(0, 16);
                const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
                    ? chrome.socialMatchesBrowseFaculty
                    : (project, facultyCode) => facultyCode === 'all' || (Array.isArray(project?.facultyCodes) ? project.facultyCodes : []).some((code) => text(code) === facultyCode);
                const projectNeedsMyAttention = (project) => {
                    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
                    const now = Date.now();
                    const todayKey = new Date(now).toDateString();
                    return tasks.some((task) => {
                        if (text(task?.assigneeUserId) !== currentUser || text(task?.status || '') === 'done') return false;
                        if (text(task?.status || '') === 'blocked') return true;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        if (!dueMs) return false;
                        if (dueMs < now) return true;
                        return new Date(dueMs).toDateString() === todayKey;
                    });
                };
                const matchesHubSearch = (project) => {
                    if (!discoverSearch) return true;
                    const blob = [
                        text(project?.name || ''),
                        text(project?.summary || ''),
                        text(project?.description || ''),
                        ...(Array.isArray(project?.skillTags) ? project.skillTags : []),
                        ...(Array.isArray(project?.facultyCodes) ? project.facultyCodes : [])
                    ].join(' ').toLowerCase();
                    return blob.includes(discoverSearch);
                };
                const matchesHubFaculty = (project, facultyCode) => matchesBrowse(project, facultyCode);
                let hubProjects = [...projects];
                if (discoverFaculty && discoverFaculty !== 'all') {
                    hubProjects = hubProjects.filter((project) => matchesHubFaculty(project, discoverFaculty));
                }
                if (hubScope === 'mine' || hubScope === 'attention') {
                    hubProjects = hubProjects.filter(canViewProjectWorkspaceCard);
                    if (hubScope === 'attention') hubProjects = hubProjects.filter(projectNeedsMyAttention);
                } else if (hubScope === 'faculty') {
                    // Faculty scope defaults to current faculty when browse is "All faculties"
                    const facultyCode = (discoverFaculty && discoverFaculty !== 'all') ? discoverFaculty : currentFacultyCode();
                    hubProjects = hubProjects.filter((project) => matchesHubFaculty(project, facultyCode));
                }
                const hubScopeBase = hubProjects;
                const hubStatusCounts = {
                    all: hubScopeBase.length,
                    idea: hubScopeBase.filter((p) => text(p?.status) === 'idea').length,
                    active: hubScopeBase.filter((p) => text(p?.status) === 'active').length,
                    review: hubScopeBase.filter((p) => text(p?.status) === 'review').length,
                    completed: hubScopeBase.filter((p) => text(p?.status) === 'completed').length
                };
                // Keep faculty filter scoped to the faculty lane only.
                // Cross-scope carry-over can hide valid projects after account switches.
                if (hubStatus !== 'all') hubProjects = hubProjects.filter((project) => text(project?.status || 'idea') === hubStatus);
                if (discoverTag) {
                    hubProjects = hubProjects.filter((project) => (Array.isArray(project?.skillTags) ? project.skillTags : [])
                        .some((tag) => text(tag).toLowerCase() === discoverTag));
                }
                hubProjects = hubProjects.filter(matchesHubSearch);
                const myWorkItems = myProjects.flatMap((project) => {
                    const projectId = text(project?.id);
                    return (Array.isArray(project?.tasks) ? project.tasks : [])
                        .filter((task) => text(task?.assigneeUserId) === currentUser && text(task?.status || '') !== 'done')
                        .map((task) => {
                            const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                            const overdue = Boolean(dueMs && dueMs < Date.now());
                            return { projectId, project, task, dueMs, overdue };
                        });
                }).sort((left, right) => {
                    if (left.overdue !== right.overdue) return left.overdue ? -1 : 1;
                    if (left.dueMs && right.dueMs) return left.dueMs - right.dueMs;
                    if (left.dueMs) return -1;
                    if (right.dueMs) return 1;
                    return 0;
                }).slice(0, 5);
                const openAssignedCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                    .filter((task) => text(task?.assigneeUserId) === currentUser && text(task?.status || '') !== 'done').length, 0);
                const overdueAssignedCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                    .filter((task) => {
                        if (text(task?.assigneeUserId) !== currentUser || text(task?.status || '') === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs < Date.now());
                    }).length, 0);
                const blockedAssignedCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                    .filter((task) => text(task?.assigneeUserId) === currentUser && text(task?.status || '') === 'blocked').length, 0);
                const dueTodayCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                    .filter((task) => {
                        if (text(task?.assigneeUserId) !== currentUser || text(task?.status || '') === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        if (!dueMs || dueMs < Date.now()) return false;
                        return new Date(dueMs).toDateString() === new Date().toDateString();
                    }).length, 0);
                const attentionTotal = overdueAssignedCount + dueTodayCount + blockedAssignedCount;
                const scopeChips = [
                    ['mine', 'Mine'],
                    ['faculty', 'Faculty'],
                    ['all', 'All'],
                    ['attention', 'Needs attention']
                ];
                const statusPills = [
                    ['all', 'All'],
                    ['idea', 'Idea'],
                    ['active', 'Active'],
                    ['review', 'Review'],
                    ['completed', 'Done']
                ];
                return `
                    <div class="social-neo-stack social-neo-workspace-shell social-neo-workspace-shell--merged">
                        ${renderWorkspaceHero(runtime, projects, {
                            viewMode: 'hub',
                            myProjects,
                            totalTasks,
                            totalActivity,
                            facultyCount: facultyOptions.length,
                            sectionsHtml: `
                                <div class="social-neo-workspace-hub-section social-project-hub-discover lux-soft-chrome">
                                    <div class="social-project-hub-search-row">
                                        <label class="social-project-hub-search">
                                            <i class="fas fa-search"></i>
                                            <input class="lux-control" type="search" name="projectDiscoverSearch" value="${escape(text(runtime.ui?.projectDiscoverSearch || ''))}" placeholder="Search my projects, course, tags…">
                                        </label>
                                    </div>
                                    ${attentionTotal ? `
                                        <div class="social-project-hub-attention lux-soft-chrome home-hover-chip">
                                            <span class="social-project-hub-attention-copy">
                                                <strong>Needs your work</strong>
                                                ${escape(String(overdueAssignedCount))} overdue · ${escape(String(dueTodayCount))} due today · ${escape(String(blockedAssignedCount))} blocked
                                            </span>
                                            <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-hub-scope" data-scope="attention">Show projects →</button>
                                        </div>
                                    ` : ''}
                                    <div class="social-project-hub-scope" role="tablist" aria-label="Project scope">
                                        ${scopeChips.map(([value, label]) => `
                                            <button class="${hubScope === value ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-hub-scope" data-scope="${escape(value)}" aria-pressed="${hubScope === value ? 'true' : 'false'}">${escape(label)}</button>
                                        `).join('')}
                                    </div>
                                    <div class="social-project-hub-filterbar lux-soft-chrome home-hover-chip">
                                        <div class="social-project-hub-filter-group">
                                            <span class="social-project-hub-filter-label">Status</span>
                                            <div class="social-project-hub-filter-pills">
                                                ${statusPills.map(([value, label]) => `
                                                    <button class="${hubStatus === value ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-hub-status" data-status="${escape(value)}">${escape(label)}${value !== 'all' ? ` (${escape(String(hubStatusCounts[value] || 0))})` : ''}</button>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="social-project-hub-filter-group social-project-hub-filter-group--skills">
                                            <span class="social-project-hub-filter-label">Skills</span>
                                            <div class="social-project-hub-filter-pills">
                                                <button class="${!discoverTag ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-hub-skill" data-tag="">All</button>
                                                ${hubSkillOptions.map((skill) => {
                                                    const value = text(skill).toLowerCase();
                                                    return `<button class="${discoverTag === value ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-hub-skill" data-tag="${escape(value)}">${escape(skill)}</button>`;
                                                }).join('')}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="social-project-hub-layout">
                                        <div class="social-project-hub-main">
                                            <div class="social-project-hub-main-head">
                                                <div>
                                                    <strong>My projects</strong>
                                                    <span class="lms-route-meta-12">${escape(String(hubProjects.length))} matching</span>
                                                </div>
                                                <div class="social-project-hub-view-toggle" role="group" aria-label="Hub view mode">
                                                    <button class="${hubViewMode === 'grid' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-hub-view" data-view="grid"><i class="fas fa-th-large"></i> Grid</button>
                                                    <button class="${hubViewMode === 'list' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-hub-view" data-view="list"><i class="fas fa-list"></i> List</button>
                                                </div>
                                            </div>
                                            ${hubProjects.length
                                                ? (hubViewMode === 'list'
                                                    ? `<div class="social-project-rows social-project-hub-list">${hubProjects.map(renderProjectRow).join('')}</div>`
                                                    : `<div class="social-project-hub-grid">${hubProjects.map(renderProjectCard).join('')}<button class="social-project-card-new social-project-hub-cta-tile home-hover-chip" type="button" data-action="project-create-open"><span class="social-project-hub-cta-icon"><i class="fas fa-plus"></i></span><strong>New workspace</strong><span class="social-project-hub-cta-copy">Start a project for your course or team</span></button></div>`)
                                                : `<div class="social-neo-empty">No projects match these filters. Try Mine, or create a group project for your course.</div>`}
                                        </div>
                                        <aside class="social-project-hub-rail">
                                            <section class="social-project-hub-rail-card lux-soft-chrome home-hover-chip">
                                                <div class="social-neo-section-head">
                                                    <div><strong>My Work</strong><span class="lms-route-meta-12">Tasks assigned to you.</span></div>
                                                    <span class="social-neo-pill home-hover-chip">${escape(String(myWorkItems.length))}</span>
                                                </div>
                                                ${myWorkItems.length ? `<div class="social-project-hub-my-work social-project-hub-my-work--roomy">${myWorkItems.map((entry) => {
                                                    const statusId = text(entry.task?.status || 'todo') === 'backlog' ? 'todo' : text(entry.task?.status || 'todo');
                                                    const statusCol = PROJECT_TASK_COLUMNS.find((column) => column.id === statusId);
                                                    return `
                                                    <button class="social-project-hub-my-work-row ${entry.overdue ? 'is-overdue' : ''}" type="button" data-action="project-hub-open-task" data-project-id="${escape(entry.projectId)}" data-task-id="${escape(text(entry.task?.id))}">
                                                        <span class="social-project-hub-my-work-title">${escape(text(entry.task?.title || 'Task'))}</span>
                                                        <span class="social-project-hub-my-work-meta">
                                                            <em>${escape(text(entry.project?.name || 'Project'))}</em>
                                                            ${statusCol ? `<span class="social-neo-pill home-hover-chip">${escape(statusCol.label)}</span>` : ''}
                                                            ${entry.task?.dueAt ? `<span class="${entry.overdue ? 'is-overdue' : ''}">${escape(when(entry.task.dueAt))}</span>` : ''}
                                                            ${entry.overdue ? '<span class="social-project-hub-my-work-flag">Overdue</span>' : ''}
                                                        </span>
                                                    </button>`;
                                                }).join('')}</div>` : `<div class="social-neo-empty">No open tasks assigned to you.</div>`}
                                            </section>
                                            <section class="social-project-hub-rail-card lux-soft-chrome home-hover-chip">
                                                <div class="social-neo-section-head">
                                                    <div><strong>Recently active</strong><span class="lms-route-meta-12">Projects with recent team activity.</span></div>
                                                </div>
                                                ${featuredProjects.length
                                                    ? `<div class="social-project-rows social-project-hub-trending">${featuredProjects.slice(0, 5).map(renderProjectRow).join('')}</div>`
                                                    : `<div class="social-neo-empty">No recent project activity yet.</div>`}
                                            </section>
                                            <section class="social-project-hub-rail-card lux-soft-chrome home-hover-chip">
                                                <div class="social-neo-section-head">
                                                    <div><strong>Your load</strong><span class="lms-route-meta-12">Roles and assigned work.</span></div>
                                                </div>
                                                <div class="social-project-hub-contribution">
                                                    <div class="social-project-hub-contribution-stat lux-soft-chrome home-hover-chip"><strong>${escape(String(myProjects.length))}</strong><span>My projects</span></div>
                                                    <div class="social-project-hub-contribution-stat lux-soft-chrome home-hover-chip"><strong>${escape(String(openAssignedCount))}</strong><span>Open tasks</span></div>
                                                    <div class="social-project-hub-contribution-stat lux-soft-chrome home-hover-chip ${overdueAssignedCount ? 'is-danger' : ''}"><strong>${escape(String(overdueAssignedCount))}</strong><span>Overdue</span></div>
                                                </div>
                                            </section>
                                        </aside>
                                    </div>
                                </div>
                            `
                        })}
                    </div>
                `;
            }

            const owner = accountById(activeProject?.ownerUserId) || { id: activeProject?.ownerUserId };
            const projectTasks = Array.isArray(activeProject?.tasks) ? activeProject.tasks : [];
            const projectActivity = Array.isArray(activeProject?.activity) ? activeProject.activity : [];
            const memberSummaries = Array.isArray(activeProject?.memberSummaries) ? activeProject.memberSummaries : [];
            const pendingMemberIds = Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : [];
            const pendingMembers = pendingMemberIds.map((userId) => ({ userId, role: text(activeProject?.memberRolesByUser?.[userId] || 'member') || 'member' }));
            const taskCounts = activeProject?.taskStatusCounts || {};
            const advisorAccounts = uniqueStrings([text(activeProject?.advisorUserId || ''), ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])]).filter(Boolean).map((userId) => accountById(userId) || { id: userId });
            const nextOwnerId = text(activeProject?.nextOwnerUserId || '');
            const nextOwner = nextOwnerId ? accountById(nextOwnerId) || { id: nextOwnerId } : null;
            const readinessPercent = countNum(activeProject?.taskCompletionPercent);
            const healthNote = countNum(taskCounts.blocked) > 0 ? `${countNum(taskCounts.blocked)} blocked tasks need attention` : 'Delivery rhythm looks healthy';
            const renderTeamMemberCard = (entry, options = {}) => {
                const pending = Boolean(options?.pending);
                const account = accountById(entry.userId) || { id: entry.userId };
                const role = text(entry.role || 'member') || 'member';
                const online = isAccountOnline(account);
                const facultyCode = text(account?.facultyCode || account?.faculty || entry.facultyCode || '');
                const joinedLabel = text(entry.joinedAt || '') && !pending ? `Joined ${when(entry.joinedAt)}` : '';
                return `
                    <article class="social-project-team-row${pending ? ' is-pending' : ''}">
                        <div class="social-project-team-row-main">
                            <span class="social-project-team-row-avatar">
                                ${avatar(account, 'social-neo-avatar-sm')}
                                <span class="social-project-roster-dot ${online ? 'is-online' : ''}" aria-hidden="true"></span>
                            </span>
                            <div class="social-project-team-row-info">
                                <strong>${escape(displayName(account))}</strong>
                                <div class="social-neo-badge-row">
                                    ${projectRolePill(role)}
                                    ${facultyCode ? `<span class="social-neo-pill home-hover-chip">${escape(facultyCode)}</span>` : ''}
                                    ${pending ? `<span class="social-neo-pill home-hover-chip">Invited</span>` : ''}
                                    ${joinedLabel ? `<span class="social-neo-muted">${escape(joinedLabel)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="social-project-team-row-actions">
                            <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="message-start" data-user-id="${escape(text(account.id))}"><i class="fas fa-paper-plane"></i> Message</button>
                            ${activeProject.isManager && text(entry.userId) !== text(activeProject.ownerUserId || '') ? `
                                ${role !== 'member' ? `<button class="lux-secondary-btn lux-secondary-btn-icon lux-secondary-btn-sm" type="button" title="Make member" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="member"><i class="fas fa-user"></i></button>` : ''}
                                ${role !== 'advisor' ? `<button class="lux-secondary-btn lux-secondary-btn-icon lux-secondary-btn-sm" type="button" title="Promote to advisor" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="advisor"><i class="fas fa-user-shield"></i></button>` : ''}
                                ${role !== 'instructor-viewer' ? `<button class="lux-secondary-btn lux-secondary-btn-icon lux-secondary-btn-sm" type="button" title="Set instructor viewer" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="instructor-viewer"><i class="fas fa-chalkboard-user"></i></button>` : ''}
                                <button class="lux-secondary-btn lux-secondary-btn-icon lux-secondary-btn-sm" type="button" title="Remove member" data-action="project-member-remove" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}"><i class="fas fa-user-minus"></i></button>
                            ` : ''}
                        </div>
                    </article>
                `;
            };
            const renderTaskStatsBar = (tasks, options = {}) => {
                const compact = Boolean(options.compact);
                const list = Array.isArray(tasks) ? tasks : [];
                const total = list.length;
                const now = Date.now();
                const overdue = list.filter((t) => normalizeProjectTaskStatusId(t?.status) !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
                const inProgress = list.filter((t) => normalizeProjectTaskStatusId(t?.status) === 'in-progress').length;
                const blocked = list.filter((t) => normalizeProjectTaskStatusId(t?.status) === 'blocked').length;
                const done = list.filter((t) => normalizeProjectTaskStatusId(t?.status) === 'done').length;
                const taskById = options.taskById instanceof Map
                    ? options.taskById
                    : new Map(list.filter((t) => t && text(t?.id)).map((t) => [text(t.id), t]));
                const ready = list.filter((t) => {
                    if (normalizeProjectTaskStatusId(t?.status) === 'done') return false;
                    return resolveDeskTaskReadiness(t, taskById).kind === 'ready';
                }).length;
                const statsClass = compact ? 'social-project-task-stats-inline' : 'social-project-task-stats-bar';
                const stats = `
                        <div class="${statsClass}" role="group" aria-label="Task summary">
                            <div class="social-project-task-stat"><strong>${escape(String(total))}</strong><span>Total</span></div>
                            <div class="social-project-task-stat ${overdue > 0 ? 'is-danger' : ''}"><strong>${escape(String(overdue))}</strong><span>Overdue</span></div>
                            <div class="social-project-task-stat"><strong>${escape(String(inProgress))}</strong><span>Active</span></div>
                            <div class="social-project-task-stat"><strong>${escape(String(blocked))}</strong><span>Blocked</span></div>
                            <div class="social-project-task-stat"><strong>${escape(String(done))}</strong><span>Done</span></div>
                            <div class="social-project-task-stat ${ready > 0 ? 'is-ready' : ''}"><strong>${escape(String(ready))}</strong><span>Ready</span></div>
                        </div>
                `;
                if (compact) return stats;
                return `
                    <section class="social-neo-card social-project-task-stats-card">
                        <div class="social-neo-section-head">
                            <div><strong>Task summary</strong><span>Total, overdue, and status counts.</span></div>
                            <span class="social-neo-pill home-hover-chip">${escape(String(total))} tasks</span>
                        </div>
                        ${stats}
                    </section>
                `;
            };
            const renderTaskSearchBar = () => {
                const searchVal = text(runtime.ui?.projectTaskSearch || '');
                const priorityVal = text(runtime.ui?.projectTaskFilterPriority || 'all');
                const assigneeVal = text(runtime.ui?.projectTaskFilterAssignee || 'all');
                return `
                    <div class="social-project-task-search spt-desk-query" role="search" aria-label="Filter tasks">
                        <div class="spt-desk-query-label">Filters</div>
                        <div class="social-project-task-search-row">
                            <div class="social-project-task-search-input">
                                <i class="fas fa-search" aria-hidden="true"></i>
                                <input class="social-neo-input lux-control" type="search" name="projectTaskSearch" value="${escape(searchVal)}" placeholder="Search tasks…" autocomplete="off">
                            </div>
                            <select class="social-neo-select social-neo-select-sm" name="projectTaskFilterPriority" data-lux-picker aria-label="Priority">
                                <option value="all" ${priorityVal === 'all' ? 'selected' : ''}>Any priority</option>
                                ${['low','medium','high','urgent'].map((p) => `<option value="${escape(p)}" ${priorityVal === p ? 'selected' : ''}>${escape(p)}</option>`).join('')}
                            </select>
                            <select class="social-neo-select social-neo-select-sm" name="projectTaskFilterAssignee" data-lux-picker aria-label="Assignee">
                                <option value="all" ${assigneeVal === 'all' ? 'selected' : ''}>Anyone</option>
                                ${memberSummaries.map((entry) => `<option value="${escape(text(entry.userId))}" ${assigneeVal === text(entry.userId) ? 'selected' : ''}>${escape(displayName(accountById(entry.userId) || { id: entry.userId }))}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                `;
            };


            const renderOverviewTab = () => `
                <section class="social-project-overview-columns social-project-overview-columns--2">
                    <div class="social-project-overview-col social-project-overview-col--work">
                        <div class="social-project-overview-slot social-project-ov-order-1">${renderMyTasks(activeProject)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-2">${renderHealthIndicator(activeProject)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-2b">${renderProjectPlanVsBaselineStrip(activeProject)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-2c">${renderProjectProgressHoursStrip(activeProject)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-3">${renderTaskDependencyGraphPreview(activeProject, runtime)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-6">${renderTaskStatusChart(activeProject)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-11">
                            <details class="social-neo-card social-project-rich-panel social-project-brief-card--trimmed social-project-overview-brief">
                                <summary class="social-project-overview-brief-summary">
                                    <div class="social-neo-section-head">
                                        <div><strong>Workspace brief</strong><span>Project scope and advising.</span></div>
                                        <span class="social-neo-pill home-hover-chip">${escape(text(statusMeta[text(activeProject.status || 'idea')]?.label || activeProject.status || 'idea'))}</span>
                                    </div>
                                    <i class="fas fa-chevron-down social-project-overview-brief-chevron" aria-hidden="true"></i>
                                </summary>
                                <div class="social-project-overview-slot__scroll social-project-overview-brief-body">
                                    <p class="social-project-body-copy">${escape(text(activeProject.description || activeProject.summary || 'No description added yet.'))}</p>
                                    <div class="social-project-brief-advisor">
                                        <span class="social-neo-label">Advisor / viewers</span>
                                        <div class="social-neo-badge-row">
                                            ${advisorAccounts.length ? advisorAccounts.map((account) => `<span class="social-neo-pill home-hover-chip">${escape(displayName(account))}</span>`).join('') : '<span class="social-neo-muted">No advisor assigned yet.</span>'}
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                        <div class="social-project-overview-slot social-project-overview-slot--actions social-project-ov-order-10 social-project-ov-quick-actions-wrap--compact">${renderQuickActions(activeProject, { compact: true, limit: 4 })}</div>
                    </div>
                    <div class="social-project-overview-col social-project-overview-col--team">
                        <div class="social-project-overview-slot social-project-ov-order-4">${renderTeamRoster(activeProject, memberSummaries)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-8">${renderWorkloadChart(activeProject)}</div>
                        <div class="social-project-overview-slot social-project-ov-order-5">${renderActivityFeed(activeProject)}</div>
                    </div>
                </section>
            `;
            const facultyMix = Array.isArray(activeProject?.facultyMix) ? activeProject.facultyMix : [];
            const roleMix = Array.isArray(activeProject?.roleMix) ? activeProject.roleMix : [];
            /* Wave 18: social-workspace-panel-team-runtime.js */
            const __teamApi = typeof window.__kiuCreateSocialWorkspacePanelTeamApi === 'function'
                ? window.__kiuCreateSocialWorkspacePanelTeamApi({
                    escape, text, displayName, avatar, accountById, accountSubtitle, isStaffAccount,
                    countNum, formatProjectScheduleHours,
                    activeProject, runtime, memberSummaries, pendingMembers, nextOwner, roleLabels,
                    facultyMix, roleMix, inviteFaculty, facultyOptions, filteredInviteCandidates,
                    renderTeamMemberCard, scrollList
                }) : null;
            if (!__teamApi) throw new Error('social-workspace-panel-team-runtime.js missing');
            const { renderTeamWorkloadAside, renderTeamTab } = __teamApi;

            const renderTasksTab = () => {
                // Focus rail owns My / Overdue — drop legacy toolbar flags so they cannot ghost-filter.
                if (runtime.ui) {
                    runtime.ui.projectTaskMyOnly = false;
                    runtime.ui.projectTaskFilterOverdue = false;
                }
                const baseFiltered = filterProjectBoardTasks(runtime, projectTasks);
                const rawView = text(runtime.ui?.projectTaskViewMode || 'desk').toLowerCase();
                const taskViewMode = rawView === 'board'
                    ? 'desk'
                    : (['desk', 'list', 'graph'].includes(rawView) ? rawView : 'desk');
                const projectId = text(activeProject.id);
                const canContribute = Boolean(activeProject.viewerCanContribute);
                const userId = currentUserId();
                const nowMs = Date.now();
                const weekMs = nowMs + 7 * 86400000;
                const twoWeekMs = nowMs + 14 * 86400000;
                const timeWindowRaw = text(runtime.ui?.projectTaskTimeWindow || 'all').toLowerCase();
                const timeWindow = ['all', 'week', '2weeks'].includes(timeWindowRaw) ? timeWindowRaw : 'all';
                const normalizeStatus = (task) => {
                    const status = text(task?.status || 'todo') || 'todo';
                    return status === 'backlog' ? 'todo' : status;
                };
                // Default All so tasks never look "missing"; user can switch to Ready.
                const focus = text(runtime.ui?.projectTaskFocus || '') || 'all';
                const projectTaskById = new Map(
                    (Array.isArray(activeProject?.tasks) ? activeProject.tasks : [])
                        .filter((task) => task && text(task?.id))
                        .map((task) => [text(task.id), task])
                );
                const isTaskReadyForDesk = (task) => {
                    if (normalizeStatus(task) === 'done') return false;
                    return resolveDeskTaskReadiness(task, projectTaskById).kind === 'ready';
                };
                const deskSchedule = computeProjectSchedule(activeProject);
                const scheduleByIdEarly = deskSchedule?.byId || {};
                const isDeskCritical = (task) => {
                    if (normalizeStatus(task) === 'done') return false;
                    const row = scheduleByIdEarly[text(task?.id)];
                    return Boolean(row?.isCritical) && Number(row?.durationHours) > 0;
                };
                const applyFocus = (tasks) => {
                    if (focus === 'mine') {
                        const mine = tasks.filter((task) => text(task?.assigneeUserId) === userId && normalizeStatus(task) !== 'done');
                        return [...mine].sort((a, b) => {
                            const ra = isTaskReadyForDesk(a) ? 0 : 1;
                            const rb = isTaskReadyForDesk(b) ? 0 : 1;
                            return ra - rb;
                        });
                    }
                    if (focus === 'overdue') {
                        return tasks.filter((task) => {
                            if (normalizeStatus(task) === 'done') return false;
                            const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                            return Boolean(dueMs && dueMs < nowMs);
                        });
                    }
                    if (focus === 'blocked') {
                        return tasks.filter((task) => normalizeStatus(task) === 'blocked' || resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting');
                    }
                    if (focus === 'ready') {
                        return tasks.filter((task) => isTaskReadyForDesk(task));
                    }
                    if (focus === 'critical') {
                        return tasks.filter((task) => isDeskCritical(task));
                    }
                    if (focus === 'unassigned') {
                        return tasks.filter((task) => normalizeStatus(task) !== 'done' && !text(task?.assigneeUserId));
                    }
                    if (focus === 'week') {
                        return tasks.filter((task) => {
                            if (normalizeStatus(task) === 'done') return false;
                            const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                            return Boolean(dueMs && dueMs >= nowMs && dueMs <= weekMs);
                        });
                    }
                    return tasks;
                };
                            const applyTimeWindow = (tasks) => {
                    if (timeWindow === 'all') return tasks;
                    const endMs = timeWindow === '2weeks' ? twoWeekMs : weekMs;
                    return tasks.filter((task) => {
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        const startMs = Number.isFinite(Date.parse(text(task?.startAt || ''))) ? Date.parse(text(task.startAt)) : null;
                        if (dueMs == null && startMs == null) return true;
                        if (dueMs != null && dueMs < nowMs && normalizeStatus(task) !== 'done') return true;
                        if (dueMs != null && dueMs >= nowMs && dueMs <= endMs) return true;
                        if (startMs != null && startMs >= nowMs && startMs <= endMs) return true;
                        if (startMs != null && startMs < nowMs && normalizeStatus(task) !== 'done') return true;
                        return false;
                    });
                };
                const windowedTasks = applyTimeWindow(baseFiltered);
                const filteredTasks = applyFocus(windowedTasks);

                const focusCounts = {
                    all: windowedTasks.length,
                    mine: windowedTasks.filter((task) => text(task?.assigneeUserId) === userId && normalizeStatus(task) !== 'done').length,
                    ready: windowedTasks.filter((task) => isTaskReadyForDesk(task)).length,
                    critical: windowedTasks.filter((task) => isDeskCritical(task)).length,
                    overdue: windowedTasks.filter((task) => {
                        if (normalizeStatus(task) === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs < nowMs);
                    }).length,
                    blocked: windowedTasks.filter((task) => normalizeStatus(task) === 'blocked' || resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length,
                    unassigned: windowedTasks.filter((task) => normalizeStatus(task) !== 'done' && !text(task?.assigneeUserId)).length,
                    week: windowedTasks.filter((task) => {
                        if (normalizeStatus(task) === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs >= nowMs && dueMs <= weekMs);
                    }).length
                };
                const donePctPlan = (() => {
                    const all = Array.isArray(activeProject?.tasks) ? activeProject.tasks : [];
                    if (!all.length) return 0;
                    const done = all.filter((task) => normalizeStatus(task) === 'done').length;
                    return Math.round((done / all.length) * 100);
                })();
                const viewToggle = `
                    <div class="social-project-task-view-toggle" role="group" aria-label="Task view mode">
                        ${[
                            ['desk', 'Desk', 'fa-layer-group'],
                            ['list', 'List', 'fa-list'],
                            ['graph', 'Map', 'fa-diagram-project']
                        ].map(([mode, label, icon]) => `
                            <button class="lux-secondary-btn ${taskViewMode === mode ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-task-view" data-view="${escape(mode)}" aria-pressed="${taskViewMode === mode ? 'true' : 'false'}">
                                <i class="fas ${escape(icon)}" aria-hidden="true"></i> ${escape(label)}
                            </button>
                        `).join('')}
                    </div>
                `;
                const savedViews = readDeskSavedViews().filter((view) => {
                    const viewProject = text(view.projectId || '');
                    return !viewProject || viewProject === projectId;
                });
                const activeViewId = text(runtime.ui?.projectTaskDeskActiveViewId || '');
                const focusChipDefs = [
                    ['ready', 'Ready', focusCounts.ready],
                    ['mine', 'Mine', focusCounts.mine],
                    ...(focusCounts.critical > 0 ? [['critical', 'Critical', focusCounts.critical]] : []),
                    ['blocked', 'Blocked', focusCounts.blocked],
                    ['overdue', 'Overdue', focusCounts.overdue],
                    ['week', 'Due 7d', focusCounts.week],
                    ['all', 'All', focusCounts.all]
                ];
                const planHealthHtml = `
                    <div class="spt-desk-plan-health" role="group" aria-label="Plan health">
                        <span class="spt-desk-plan-health-kicker">Plan health</span>
                        ${(() => {
                            const deskSched = computeProjectSchedule(activeProject);
                            const endH = Number(deskSched.projectEndHours) || 0;
                            const critN = (deskSched.criticalChain || []).length;
                            const startAt = text(activeProject?.scheduleStartAt || '');
                            const endDate = startAt ? formatProjectScheduleDate(startAt, endH) : '';
                            const line = endH > 0
                                ? `Shortest finish ${formatProjectScheduleHours(endH)}${endDate ? ` · plan end ${endDate}` : ''} · ${critN} critical`
                                : (focusCounts.critical
                                    ? `${focusCounts.critical} critical · add estimates for finish length`
                                    : 'Add estimates + arrows to unlock critical path');
                            return `<p class="spt-desk-plan-health-schedule social-neo-muted" title="From forward / backward pass over dependencies">${escape(line)}</p>`;
                        })()}
                        <div class="spt-desk-plan-health-grid">
                            <button type="button" class="spt-desk-plan-health-card home-hover-chip" data-action="project-task-focus" data-focus="all" title="All tasks">
                                <strong>${donePctPlan}%</strong><span>Done</span>
                            </button>
                            <button type="button" class="spt-desk-plan-health-card home-hover-chip${focusCounts.critical ? ' is-warn' : ''}" data-action="project-task-focus" data-focus="${focusCounts.critical ? 'critical' : 'all'}" title="${focusCounts.critical ? 'Open critical tasks' : 'Add time estimates to unlock critical path'}">
                                <strong>${focusCounts.critical ? focusCounts.critical : '—'}</strong><span>Critical</span>
                            </button>
                            <button type="button" class="spt-desk-plan-health-card home-hover-chip${focusCounts.unassigned ? ' is-warn' : ''}" data-action="project-task-focus" data-focus="unassigned" title="Tasks without an owner">
                                <strong>${focusCounts.unassigned}</strong><span>No owner</span>
                            </button>
                            <button type="button" class="spt-desk-plan-health-card home-hover-chip${focusCounts.overdue ? ' is-danger' : ''}" data-action="project-task-focus" data-focus="overdue" title="Overdue tasks">
                                <strong>${focusCounts.overdue}</strong><span>Overdue</span>
                            </button>
                        </div>
                    </div>
                `;
                const focusStrip = `
                    ${planHealthHtml}
                    <div class="spt-desk-toolbar spt-desk-toolbar--lms">
                        <div class="spt-desk-focus" role="tablist" aria-label="Focus">
                            <div class="spt-desk-focus-track">
                                ${focusChipDefs.map(([id, label, count]) => `
                                    <button type="button" role="tab" aria-selected="${focus === id ? 'true' : 'false'}" class="spt-desk-focus-chip home-hover-chip${focus === id ? ' is-active' : ''}" data-action="project-task-focus" data-focus="${escape(id)}">
                                        <strong>${escape(label)}</strong>
                                        <span>${count}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <details class="spt-desk-more-filters">
                            <summary class="spt-desk-more-filters-sum">Filters</summary>
                            <div class="spt-desk-more-filters-panel">
                                <div class="spt-desk-window" role="group" aria-label="Time window">
                                    <span class="spt-desk-focus-label">Window</span>
                                    <div class="spt-desk-focus-track">
                                        ${[
                                            ['all', 'All'],
                                            ['week', 'This week'],
                                            ['2weeks', '2 weeks']
                                        ].map(([id, label]) => `
                                            <button type="button" class="spt-desk-focus-chip home-hover-chip ${timeWindow === id ? 'is-active' : ''}" data-action="project-task-time-window" data-window="${escape(id)}" aria-pressed="${timeWindow === id ? 'true' : 'false'}">
                                                <strong>${escape(label)}</strong>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="spt-desk-views" aria-label="Saved views">
                                    <span class="spt-desk-focus-label">Views</span>
                                    <div class="spt-desk-views-row">
                                        <select class="social-neo-select social-neo-select-sm spt-desk-views-select" name="projectTaskDeskView" data-lux-picker aria-label="Load saved view">
                                            <option value="">${savedViews.length ? 'Load view…' : 'No saved views'}</option>
                                            ${savedViews.map((view) => `
                                                <option value="${escape(text(view.id))}" ${activeViewId === text(view.id) ? 'selected' : ''}>${escape(text(view.name))}</option>
                                            `).join('')}
                                        </select>
                                        <button type="button" class="spt-desk-views-save" data-action="project-task-desk-view-save" title="Save current focus, window, and filters">Save</button>
                                        ${activeViewId ? `<button type="button" class="spt-desk-views-delete" data-action="project-task-desk-view-delete" data-view-id="${escape(activeViewId)}" title="Delete active view">Delete</button>` : ''}
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                `;
                const deskBody = (() => {
                    const groups = getProjectTaskGraphGroups(runtime, projectId);
                    const collapsed = new Set(
                        (Array.isArray(runtime.ui?.projectTaskDeskCollapsedPackages) ? runtime.ui.projectTaskDeskCollapsedPackages : [])
                            .map((id) => text(id))
                            .filter(Boolean)
                    );
                    const collapsedTree = new Set(
                        (Array.isArray(runtime.ui?.projectTaskDeskCollapsedTreeIds) ? runtime.ui.projectTaskDeskCollapsedTreeIds : [])
                            .map((id) => text(id))
                            .filter(Boolean)
                    );
                    const taskById = new Map(filteredTasks.map((task) => [text(task?.id), task]));
                    const schedule = computeProjectSchedule(activeProject);
                    const scheduleById = schedule?.byId || {};
                    const expandedTaskId = text(runtime.ui?.projectTaskDeskExpandedTaskId || '');
                    const deskLinkState = runtime.ui?.projectTaskDeskLink && typeof runtime.ui.projectTaskDeskLink === 'object'
                        ? runtime.ui.projectTaskDeskLink
                        : null;
                    const deskCardOpts = {
                        allTasks: Array.isArray(activeProject?.tasks) ? activeProject.tasks : projectTasks,
                        taskById: projectTaskById,
                        scheduleById,
                        expandedTaskId,
                        currency: text(activeProject?.budgetCurrency || 'USD') || 'USD',
                        deskLink: deskLinkState,
                        collapsedTree
                    };
                    const placed = new Set();
                    const sections = [];
                    groups.forEach((group) => {
                        const gid = text(group?.id);
                        if (!gid) return;
                        const memberIds = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id)).filter(Boolean);
                        const sectionTasks = memberIds.map((id) => taskById.get(id)).filter(Boolean);
                        sectionTasks.forEach((task) => placed.add(text(task.id)));
                        const roll = computeProjectTaskGraphGroupRollup(group, activeProject);
                        const ordered = orderDeskTasksByDependency(sectionTasks, deskCardOpts.allTasks);
                        const forest = buildDeskTaskForest(sectionTasks, deskCardOpts.allTasks);
                        const readyCount = sectionTasks.filter((task) => isTaskReadyForDesk(task)).length;
                        const waitingCount = sectionTasks.filter((task) => resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length;
                        const criticalCount = sectionTasks.filter((task) => {
                            const row = scheduleById[text(task?.id)];
                            return Boolean(row?.isCritical) && Number(row?.durationHours) > 0 && normalizeStatus(task) !== 'done';
                        }).length;
                        const unassignedCount = sectionTasks.filter((task) => !text(task?.assigneeUserId) && normalizeStatus(task) !== 'done').length;
                        const overdueCount = sectionTasks.filter((task) => {
                            if (normalizeStatus(task) === 'done') return false;
                            const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                            return Boolean(dueMs && dueMs < nowMs);
                        }).length;
                        const blockedStatusCount = sectionTasks.filter((task) => normalizeStatus(task) === 'blocked').length;
                        const riskCount = (Array.isArray(activeProject?.risks) ? activeProject.risks : [])
                            .filter((risk) => text(risk?.groupId || '') === gid).length;
                        sections.push({
                            id: gid,
                            name: text(group?.name || 'Work package'),
                            kind: 'package',
                            tasks: sectionTasks,
                            ordered,
                            forest,
                            pct: Math.max(0, Math.min(100, Number(roll.pctComplete) || 0)),
                            openCount: sectionTasks.filter((task) => normalizeStatus(task) !== 'done').length,
                            readyCount,
                            waitingCount,
                            criticalCount,
                            unassignedCount,
                            overdueCount,
                            blockedStatusCount,
                            riskCount,
                            budget: Number(roll.budget) || 0,
                            currency: text(roll.currency || activeProject?.budgetCurrency || 'USD') || 'USD',
                            hoursTotal: Number(roll.hoursTotal) || 0,
                            hoursDone: Number(roll.hoursDone) || 0,
                            progressMode: text(roll.progressMode || 'count') || 'count',
                            wiredCount: Number(roll.count) || sectionTasks.length,
                            directCount: Number(roll.directCount) || sectionTasks.length
                        });
                    });
                    const ungrouped = filteredTasks.filter((task) => !placed.has(text(task?.id)));
                    const ungroupedOrdered = orderDeskTasksByDependency(ungrouped, deskCardOpts.allTasks);
                    const ungroupedForest = buildDeskTaskForest(ungrouped, deskCardOpts.allTasks);
                    sections.push({
                        id: '__ungrouped__',
                        name: 'Unscoped',
                        kind: 'ungrouped',
                        tasks: ungrouped,
                        ordered: ungroupedOrdered,
                        forest: ungroupedForest,
                        pct: ungrouped.length
                            ? Math.round((ungrouped.filter((task) => normalizeStatus(task) === 'done').length / ungrouped.length) * 100)
                            : 0,
                        openCount: ungrouped.filter((task) => normalizeStatus(task) !== 'done').length,
                        readyCount: ungrouped.filter((task) => isTaskReadyForDesk(task)).length,
                        waitingCount: ungrouped.filter((task) => resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length,
                        criticalCount: ungrouped.filter((task) => {
                            const row = scheduleById[text(task?.id)];
                            return Boolean(row?.isCritical) && Number(row?.durationHours) > 0 && normalizeStatus(task) !== 'done';
                        }).length,
                        unassignedCount: ungrouped.filter((task) => !text(task?.assigneeUserId) && normalizeStatus(task) !== 'done').length,
                        overdueCount: ungrouped.filter((task) => {
                            if (normalizeStatus(task) === 'done') return false;
                            const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                            return Boolean(dueMs && dueMs < nowMs);
                        }).length,
                        blockedStatusCount: ungrouped.filter((task) => normalizeStatus(task) === 'blocked').length,
                        riskCount: 0,
                        budget: 0,
                        currency: text(activeProject?.budgetCurrency || 'USD') || 'USD',
                        hoursTotal: 0,
                        hoursDone: 0,
                        progressMode: 'count',
                        wiredCount: ungrouped.length,
                        directCount: ungrouped.length
                    });
                    const visibleSections = sections.filter((section) => section.tasks.length > 0 || (section.kind === 'package' && groups.length));
                    // taskId → package names (for expand + queue context)
                    const packageNamesByTaskId = new Map();
                    groups.forEach((group) => {
                        const gname = text(group?.name || 'Work package');
                        (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).forEach((tid) => {
                            const id = text(tid);
                            if (!id) return;
                            const list = packageNamesByTaskId.get(id) || [];
                            if (!list.includes(gname)) list.push(gname);
                            packageNamesByTaskId.set(id, list);
                        });
                    });
                    deskCardOpts.packageNamesByTaskId = packageNamesByTaskId;

                    const allOpenFiltered = filteredTasks.filter((task) => normalizeStatus(task) !== 'done');
                    const readyN = allOpenFiltered.filter((task) => isTaskReadyForDesk(task)).length;
                    const waitingN = allOpenFiltered.filter((task) => resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length;
                    const criticalN = allOpenFiltered.filter((task) => {
                        const row = scheduleById[text(task?.id)];
                        return Boolean(row?.isCritical) && Number(row?.durationHours) > 0;
                    }).length;
                    const unassignedN = allOpenFiltered.filter((task) => !text(task?.assigneeUserId)).length;
                    const overdueN = allOpenFiltered.filter((task) => {
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs < nowMs);
                    }).length;
                    const noEstN = allOpenFiltered.filter((task) => {
                        if (task?.isMilestone) return false;
                        const est = resolveTaskScheduleEstimate(task);
                        return !(est && Number(est.estimate) > 0);
                    }).length;
                    const openBudget = allOpenFiltered.reduce((sum, task) => sum + (Number(task?.budgetEstimate) || 0), 0);
                    const openBudgetLabel = openBudget > 0
                        ? formatProjectTaskBudgetEstimate(openBudget, deskCardOpts.currency)
                        : '';
                    // Earliest critical/open due as finish risk signal
                    let finishRiskLabel = '';
                    const dueCandidates = allOpenFiltered
                        .map((task) => {
                            const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                            return dueMs ? { task, dueMs } : null;
                        })
                        .filter(Boolean)
                        .sort((a, b) => a.dueMs - b.dueMs);
                    if (dueCandidates.length) {
                        const top = dueCandidates[0];
                        finishRiskLabel = when(top.task.dueAt);
                    }

                    const deskSummaryHtml = '';

                    const hygieneBits = [];
                    const hygieneHidden = new Set(
                        (Array.isArray(runtime.ui?.projectTaskDeskHygieneHidden) ? runtime.ui.projectTaskDeskHygieneHidden : [])
                            .map((id) => text(id))
                            .filter(Boolean)
                    );
                    const hygieneDismissed = hygieneHidden.has('desk-alert');
                    if (!hygieneDismissed) {
                        if (overdueN > 0) hygieneBits.push(`<button type="button" class="spt-desk-hygiene-pill home-hover-chip is-danger" data-action="project-task-focus" data-focus="overdue"><i class="fas fa-clock" aria-hidden="true"></i>${overdueN} overdue</button>`);
                        if (unassignedN > 0) hygieneBits.push(`<button type="button" class="spt-desk-hygiene-pill home-hover-chip is-warn" data-action="project-task-focus" data-focus="unassigned"><i class="fas fa-user-slash" aria-hidden="true"></i>${unassignedN} unassigned</button>`);
                    }
                    const deskHygieneHtml = (filteredTasks.length && hygieneBits.length) ? `
                        <div class="spt-desk-hygiene-bar spt-desk-hygiene-bar--slim" role="status" aria-label="Needs attention">
                            <span class="spt-desk-hygiene-bar-label"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i></span>
                            <div class="spt-desk-hygiene-bar-pills">${hygieneBits.join('')}</div>
                            <button type="button" class="spt-desk-hygiene-dismiss" data-action="project-task-desk-hygiene-dismiss" data-hygiene-id="desk-alert" title="Dismiss" aria-label="Dismiss">×</button>
                        </div>
                    ` : '';

                    const renderSectionStats = (section) => {
                        const n = section.tasks.length;
                        const open = section.openCount;
                        const done = Math.max(0, n - open);
                        if (!n) return 'Empty';
                        return `${done}/${n} done · ${open} open`;
                    };

                    const emptyReadyHtml = (focus === 'ready' && !filteredTasks.length && (Array.isArray(activeProject?.tasks) ? activeProject.tasks : []).length)
                        ? `<div class="spt-desk-empty-ready" role="status">
                                <strong>Nothing is ready to start</strong>
                                <span>Finish a parent task, or open All / Map to re-link work.</span>
                                <div class="spt-desk-empty-ready-actions">
                                    <button type="button" class="lux-secondary-btn lux-secondary-btn-sm" data-action="project-task-focus" data-focus="all">Show all</button>
                                    <button type="button" class="lux-secondary-btn lux-secondary-btn-sm" data-action="project-task-graph-open" data-project-id="${escape(projectId)}">Open map</button>
                                </div>
                            </div>`
                        : '';
                    return `
                        <div class="spt-desk spt-desk--v2" data-task-desk="1">
                            ${deskSummaryHtml}
                                                    ${emptyReadyHtml}
                            ${deskHygieneHtml}
                            ${(() => {
                                const link = deskLinkState;
                                if (!link || !text(link.taskId) || !canContribute) return '';
                                const linkTask = projectTaskById.get(text(link.taskId))
                                    || (Array.isArray(activeProject?.tasks) ? activeProject.tasks : []).find((t) => text(t?.id) === text(link.taskId));
                                const linkTitle = text(linkTask?.title || 'Task');
                                const role = text(link.role || 'child') || 'child';
                                const copy = role === 'parent'
                                    ? `Connect mode: click <strong>Child</strong> on a task that should wait on “${escape(linkTitle)}”.`
                                    : `Connect mode: click <strong>Parent</strong> on the task that must finish before “${escape(linkTitle)}”.`;
                                return `
                                    <div class="spt-desk-link-banner" role="status">
                                        <div class="spt-desk-link-banner-copy">
                                            <i class="fas fa-link" aria-hidden="true"></i>
                                            <span>${copy}</span>
                                        </div>
                                        <div class="spt-desk-link-banner-actions">
                                            <button type="button" class="lux-secondary-btn lux-secondary-btn-sm" data-action="project-task-desk-link-start" data-project-id="${escape(projectId)}" data-task-id="${escape(text(link.taskId))}" data-role="${role === 'parent' ? 'child' : 'parent'}">Switch: pick ${role === 'parent' ? 'parent' : 'child'} first</button>
                                            <button type="button" class="lux-secondary-btn lux-secondary-btn-sm" data-action="project-task-desk-link-cancel">Cancel</button>
                                        </div>
                                    </div>
                                `;
                            })()}
                            ${visibleSections.map((section) => {
                                const isCollapsed = collapsed.has(section.id);
                                const showBody = !isCollapsed;
                                const ordered = Array.isArray(section.ordered) ? section.ordered : section.tasks.map((task) => ({ task, depth: 0 }));
                                const budgetLabel = section.budget > 0
                                    ? formatProjectTaskBudgetEstimate(section.budget, section.currency)
                                    : '';
                                const hoursLeft = Math.max(0, (Number(section.hoursTotal) || 0) - (Number(section.hoursDone) || 0));
                                const subBits = [];
                                if (section.progressMode === 'hours' && section.hoursTotal > 0) {
                                    subBits.push(`${Math.round(hoursLeft * 10) / 10}h left`);
                                }
                                if (section.unassignedCount) subBits.push(`${section.unassignedCount} unassigned`);
                                if (section.overdueCount) subBits.push(`${section.overdueCount} overdue`);
                                if (section.kind === 'ungrouped') subBits.push('not on a work package');
                                const lastMs = (section.tasks || []).reduce((max, task) => Math.max(max, taskActivityMs(task)), 0);
                                if (lastMs > 0) {
                                    subBits.push(`Updated ${when(new Date(lastMs).toISOString())}`);
                                }
                                // Package health chip
                                let healthId = 'on-track';
                                let healthLabel = 'On track';
                                const openN = Number(section.openCount) || 0;
                                if (section.tasks.length && openN === 0) {
                                    healthId = 'done';
                                    healthLabel = 'Done';
                                } else if (openN > 0 && ((Number(section.waitingCount) || 0) >= Math.ceil(openN / 2) || (Number(section.blockedStatusCount) || 0) >= Math.ceil(openN / 2))) {
                                    healthId = 'blocked';
                                    healthLabel = 'At risk';
                                } else if ((Number(section.criticalCount) || 0) > 0 || (Number(section.overdueCount) || 0) > 0 || (Number(section.riskCount) || 0) > 0) {
                                    healthId = 'at-risk';
                                    healthLabel = 'At risk';
                                }
                                const riskIcon = (section.kind === 'package' && section.riskCount > 0)
                                    ? `<button type="button" class="spt-desk-package-risk-icon" data-action="project-risk-open" data-project-id="${escape(projectId)}" data-group-id="${escape(section.id)}" title="${section.riskCount} risk${section.riskCount === 1 ? '' : 's'}" aria-label="Package risks"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i></button>`
                                    : '';
                                return `
                                    <section class="spt-desk-package lux-soft-chrome is-health-${escape(healthId)} ${section.kind === 'ungrouped' ? 'is-ungrouped' : ''} ${isCollapsed ? 'is-collapsed' : ''} ${section.pct >= 100 && section.tasks.length ? 'is-complete' : ''}" data-package-id="${escape(section.id)}" data-health="${escape(healthId)}">
                                        <header class="spt-desk-package-head">
                                            <button type="button" class="spt-desk-package-toggle" data-action="project-task-desk-toggle-package" data-package-id="${escape(section.id)}" aria-expanded="${showBody ? 'true' : 'false'}" title="${showBody ? 'Collapse' : 'Expand'}">
                                                <i class="fas fa-chevron-${showBody ? 'down' : 'right'}" aria-hidden="true"></i>
                                            </button>
                                            <div class="spt-desk-package-title">
                                                <span class="spt-desk-package-mark" aria-hidden="true"><i class="fas ${section.kind === 'ungrouped' ? 'fa-inbox' : 'fa-layer-group'}"></i></span>
                                                <div class="spt-desk-package-title-copy">
                                                    <div class="spt-desk-package-title-row">
                                                        <strong>${escape(section.name)}</strong>
                                                        <span class="spt-desk-health spt-desk-health--${escape(healthId)}">${escape(healthLabel)}</span>
                                                    </div>
                                                    <span class="spt-desk-package-count">${escape(renderSectionStats(section))}${section.kind === 'ungrouped' ? ' · not in a work package' : ''}</span>
                                                </div>
                                            </div>
                                            <div class="spt-desk-package-side">
                                                ${riskIcon}
                                                ${section.tasks.length ? `<span class="spt-desk-package-pct" title="${section.pct}% complete">${section.pct}%</span>` : ''}
                                                ${canContribute ? `
                                                <button class="spt-desk-add-btn" type="button" data-action="project-task-create-open" data-project-id="${escape(projectId)}" data-package-id="${escape(section.id)}" title="Add task to package">
                                                    <i class="fas fa-plus" aria-hidden="true"></i><span>Add</span>
                                                </button>
                                                ` : ''}
                                            </div>
                                        </header>
                                        ${section.tasks.length ? `<div class="spt-desk-package-progress-line" aria-hidden="true"><i style="width:${section.pct}%"></i></div>` : ''}
                                        ${showBody ? `
                                        <div class="spt-desk-package-body">
                                                                                    <div class="spt-desk-package-grid spt-desk-tree" role="list">
                                                ${(Array.isArray(section.forest) ? section.forest : []).length
                                                    ? renderDeskTaskTreeForest(activeProject, section.forest, { ...deskCardOpts, collapsedTree })
                                                    : '<div class="spt-desk-package-empty">No tasks match this focus in this package.</div>'}
                                            </div>
                                        </div>
                                        ` : ''}
                                    </section>
                                `;
                            }).join('')}
                        </div>
                    `;
                })();

                const listBody = `
                    <div class="social-project-task-list-wrap social-project-task-list-wrap--roomy">
                        ${filteredTasks.length ? `
                            <table class="social-project-task-list-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Task</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Priority</th>
                                        <th scope="col">Assignee</th>
                                        <th scope="col">Due</th>
                                        <th scope="col">Deps</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredTasks.map((task) => {
                                        const statusId = normalizeStatus(task);
                                        const column = PROJECT_TASK_COLUMNS.find((entry) => entry.id === statusId) || PROJECT_TASK_COLUMNS[0];
                                        const priority = text(task?.priority || 'medium').toLowerCase() || 'medium';
                                        const assignee = accountById(task?.assigneeUserId) || { id: task?.assigneeUserId };
                                        const dueAt = text(task?.dueAt || '');
                                        const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
                                        const isOverdue = Boolean(dueMs && dueMs < Date.now() && statusId !== 'done');
                                        const blockedByCount = projectTaskDependsOnIds(task).length;
                                        const blocksCount = projectTaskDownstreamIds(task?.id, projectTasks).length;
                                        return `
                                            <tr class="social-project-task-list-row ${isOverdue ? 'is-overdue' : ''}" data-action="project-task-detail-open" data-project-id="${escape(projectId)}" data-task-id="${escape(text(task.id))}" tabindex="0" role="button" aria-label="Open task ${escape(text(task?.title || 'Task'))}">
                                                <td class="social-project-task-list-title"><strong>${escape(text(task?.title || 'Task'))}</strong></td>
                                                <td><span class="social-neo-pill home-hover-chip">${escape(column.label)}</span></td>
                                                <td><span class="social-neo-pill home-hover-chip social-project-priority-pill" data-priority="${escape(priority)}">${escape(priority)}</span></td>
                                                <td>${task?.assigneeUserId ? escape(displayName(assignee)) : '<span class="social-neo-muted">Unassigned</span>'}</td>
                                                <td class="${isOverdue ? 'is-overdue' : ''}">${dueAt ? escape(when(dueAt)) : '—'}</td>
                                                <td>${blockedByCount || blocksCount
                                                    ? `<button class="social-neo-pill home-hover-chip social-project-task-deps-chip" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}" data-task-id="${escape(text(task.id))}"><i class="fas fa-link"></i> ${escape(String(blockedByCount))}/${escape(String(blocksCount))}</button>`
                                                    : '—'}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        ` : `<div class="social-neo-empty social-project-task-list-empty">No tasks match these filters.</div>`}
                    </div>
                `;
                const graphBody = `
                    <div class="social-project-task-shell-graph social-project-task-shell-graph--main social-project-task-shell-graph--roomy">
                        <div class="social-project-task-graph-preview-toolbar">
                            <div>
                                <strong>Dependency map</strong>
                                <span>See how work connects. Open the full map to rearrange and link.</span>
                            </div>
                            <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}">
                                <i class="fas fa-expand"></i> Open full map
                            </button>
                        </div>
                        ${renderTaskDependencyGraphPreview(activeProject, runtime)}
                    </div>
                `;
                const body = taskViewMode === 'list' ? listBody : (taskViewMode === 'graph' ? graphBody : deskBody);
                return `
                    <section class="social-neo-card social-project-task-shell social-project-task-shell--roomy social-project-task-shell--desk lux-soft-chrome" data-task-view="${escape(taskViewMode)}">
                        <div class="social-project-task-shell-header social-project-task-shell-header--roomy">
                            <div class="social-project-task-shell-heading">
                                <div class="spt-desk-shell-brand">
                                    <strong class="social-project-task-shell-title">Work Desk</strong>
                                    <span class="social-project-task-shell-subtitle">Work packages &amp; next actions</span>
                                </div>
                            </div>
                            <div class="social-project-task-shell-actions">
                                ${viewToggle}
                                ${canContribute ? `
                                    <button class="lux-primary-btn social-project-task-compose-trigger" type="button" data-action="project-task-create-open" data-project-id="${escape(projectId)}">
                                        <i class="fas fa-plus"></i> New task
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        ${taskViewMode === 'graph' ? '' : focusStrip}
                        <div class="social-project-task-shell-filters social-project-task-shell-filters--roomy">
                            ${renderTaskSearchBar()}
                        </div>
                        <div class="social-project-task-shell-body" data-task-body="${escape(taskViewMode)}" data-task-body-root="1">
                            ${body}
                        </div>
                    </section>
                `;
            };

            const renderProjectChatLoading = (title, copy) => `
                <section class="social-neo-card social-project-workspace-chat social-project-workspace-chat--loading lux-soft-chrome home-hover-chip">
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-comments"></i>
                        <strong>${escape(title)}</strong>
                        <span>${escape(copy)}</span>
                    </div>
                </section>
            `;
            const renderChatTab = () => {
                if (!hasSocialMessagesModule()) {
                    ensureSocialMessagesModule()
                        .then(() => {
                            clearProjectTabPaneCache(text(activeProject.id));
                            queueDeferredModuleRender('messages-module');
                        })
                        .catch(() => null);
                    return renderProjectChatLoading('Loading workspace chat', 'Preparing threads, group tools, and call controls.');
                }
                if (!text(activeProject?.groupId || '')) {
                    return `<div class="social-project-workspace-chat">${window.renderMessagesThreadShell(null, { emptyCopy: 'Project chat is unavailable — no linked group.', chrome: 'workspace' })}</div>`;
                }
                const chat = resolveProjectWorkspaceChat(activeProject);
                if (!chat) {
                    const bootstrapKey = text(activeProject.id);
                    if (text(runtime.ui?.__projectChatBootstrapping || '') !== bootstrapKey) {
                        runtime.ui.__projectChatBootstrapping = bootstrapKey;
                        ensureProjectWorkspaceChat(activeProject)
                            .then((opened) => {
                                delete runtime.ui.__projectChatBootstrapping;
                                if (!opened?.id) return;
                                setActiveChat(opened.id);
                                clearProjectTabPaneCache(bootstrapKey);
                                renderSocialPageNow('project-chat-ready');
                            })
                            .catch(() => {
                                delete runtime.ui.__projectChatBootstrapping;
                            });
                    }
                    return renderProjectChatLoading('Preparing workspace chat', 'Opening the backing group chat for this project.');
                }
                if (text(runtime.ui?.activeChatId || '') !== text(chat.id)) {
                    setActiveChat(chat.id);
                }
                return `<div class="social-project-workspace-chat">${window.renderMessagesThreadShell(chat, { chrome: 'workspace' })}</div>`;
            };
            const renderActivityTab = () => `
                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Workspace timeline</strong><span>Every material project update, from tasks to showcase publishing.</span></div>
                    </div>
                    ${scrollList('social-project-scroll-list--activity', `<div class="social-project-activity-list">${projectActivity.length ? projectActivity.map((entry) => renderActivityItem(entry)).join('') : `<div class="social-neo-empty">No project activity yet.</div>`}</div>`)}
                </section>
            `;
            const __budgetApi = typeof window.__kiuCreateSocialWorkspacePanelBudgetApi === 'function'
                ? window.__kiuCreateSocialWorkspacePanelBudgetApi({
                    escape, text, displayName, avatar, accountById, state,
                    ensureSocialMessagesModule, hasSocialMessagesModule,
                    ensureProjectWorkspaceChat, resolveProjectWorkspaceChat,
                    renderMessagesThreadShell, setActiveChat, queueDeferredModuleRender,
                    renderSocialPageNow, currentUserId,
                    activeProject, countNum, renderProgressRing, renderMetricCard, when
                })
                : null;
            if (!__budgetApi) throw new Error('social-workspace-panel-budget-runtime missing');
            const { formatBudgetMoney, renderBudgetTab } = __budgetApi;

            const buildProjectTabMarkup = (tabId) => {
                const tab = text(tabId || activeTab) || 'overview';
                return tab === 'overview'
                    ? renderOverviewTab()
                    : tab === 'team'
                        ? renderTeamTab()
                        : tab === 'tasks'
                            ? renderTasksTab()
                            : tab === 'chat'
                                ? renderChatTab()
                                : tab === 'activity'
                                    ? renderActivityTab()
                                    : tab === 'budget'
                                        ? renderBudgetTab()
                                        : renderOverviewTab();
            };
            window.renderProjectWorkspaceTabPanel = buildProjectTabMarkup;
            const tabMarkup = buildProjectTabMarkup(activeTab);
            const tabItems = [
                ['overview', 'Overview', 'fa-house', 'Studio summary'],
                ['team', 'Team', 'fa-users', `${activeProject.memberCount || 0} members`],
                ['tasks', 'Tasks', 'fa-list-check', `${activeProject.openTaskCount || 0} open`],
                ['chat', 'Chat', 'fa-comments', 'Backed by group chat'],
                ['activity', 'Activity', 'fa-wave-square', `${activeProject.activityCount || 0} events`],
                ['budget', 'Budget', 'fa-wallet', `${countNum(activeProject?.budgetUtilizationPercent)}% used`]
            ];
            const tabMap = Object.fromEntries(tabItems.map(([tabId, label, icon, note]) => [tabId, { label, icon, note }]));
            const renderProjectTabPill = (tabId) => {
                const item = tabMap[tabId];
                if (!item) return '';
                const isActive = activeTab === tabId;
                const activeClass = isActive ? 'is-focused is-active' : '';
                return `
                    <button class="lux-secondary-btn social-project-hero-tab ${activeClass}" type="button" role="tab" aria-selected="${isActive ? 'true' : 'false'}" aria-pressed="${isActive ? 'true' : 'false'}" tabindex="${isActive ? '0' : '-1'}" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="${escape(tabId)}">
                        <span class="social-project-hero-tab-icon"><i class="fas ${escape(item.icon)}" aria-hidden="true"></i></span>
                        <span class="social-project-hero-tab-copy">
                            <strong>${escape(item.label)}</strong>
                            <small>${escape(item.note)}</small>
                        </span>
                    </button>
                `;
            };
            return `
                <div class="social-neo-stack social-projects-shell">
                    <section class="social-neo-card social-project-detail-hero social-project-detail-hero-rich lux-soft-chrome">
                        <div class="social-project-detail-top">
                            <div class="social-project-detail-copy">
                                <div class="social-neo-inline social-neo-inline-gap-10-wrap">
                                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="projects-back"><i class="fas fa-arrow-left"></i> Back</button>
                                    ${projectRolePill(activeProject.role || 'member')}
                                    <span class="social-neo-pill home-hover-chip">${escape(text(statusMeta[text(activeProject.status || 'idea')]?.label || activeProject.status || 'idea'))}</span>
                                    ${activeProject.isOrphaned ? `<span class="social-neo-pill home-hover-chip">Ownerless</span>` : ''}
                                </div>
                                <h2>${escape(text(activeProject.name || 'Project workspace'))}</h2>
                                <p>${escape(text(activeProject.summary || activeProject.description || ''))}</p>
                                <div class="social-neo-badge-row">
                                    ${facultyPills(activeProject.facultyCodes)}
                                    ${skillPills(activeProject.skillTags)}
                                    ${text(activeProject.courseTag) ? `<span class="social-neo-pill home-hover-chip">${escape(activeProject.courseTag)}</span>` : ''}
                                </div>
                            </div>
                            <div class="social-project-detail-actions">
                                <div class="social-neo-person">
                                    ${avatar(owner)}
                                    <div>
                                        <strong>${escape(displayName(owner))}</strong>
                                        <span>${escape(activeProject.isOrphaned ? 'No current owner' : 'Workspace owner')}</span>
                                    </div>
                                </div>
                                <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                    <button class="lux-secondary-btn" type="button" data-action="project-open-chat" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-comments"></i> Chat</button>
                                    <button class="lux-secondary-btn" type="button" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="tasks"><i class="fas fa-list-check"></i> Tasks</button>
                                    ${renderProjectWorkspaceNavButtons(activeProject)}
                                    ${activeProject.isManager ? `<button class="lux-secondary-btn" type="button" data-action="project-settings-open" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-sliders"></i> Settings</button>` : ''}
                                    ${activeProject.isManager ? `<button class="lux-primary-btn" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> Showcase</button>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="social-project-dashboard-strip">
                            ${renderProgressRing(activeProject?.taskCompletionPercent || 0, 'Task completion', `${activeProject?.completedTaskCount || 0} of ${activeProject?.taskCount || 0}`, '#f97316')}
                            ${renderMetricCard('fa-wallet', 'Budget', formatBudgetMoney(activeProject?.budgetSpentTotal || 0, activeProject?.budgetCurrency || 'USD'), `${activeProject?.budgetUtilizationPercent || 0}% of ${formatBudgetMoney(activeProject?.budgetCap || activeProject?.budgetPlannedTotal || 0, activeProject?.budgetCurrency || 'USD')}`, '#f59336')}
                            ${renderMetricCard('fa-users', 'Team mix', activeProject?.memberCount || 0, `${(activeProject?.facultyMix || []).length} faculties`, '#8b5cf6')}
                            <article class="social-project-metric-card social-project-metric-card-wide lux-soft-chrome home-hover-chip">
                                <span class="social-project-metric-icon"><i class="fas fa-wave-square"></i></span>
                                <div>
                                    <small>Activity pulse</small>
                                    <strong>${escape(String(activeProject?.activityCount || 0))}</strong>
                                    <span>last 7 days</span>
                                </div>
                                ${renderSparkline(activeProject?.activityBuckets || [])}
                            </article>
                        </div>
                        <div class="social-project-hero-grid social-project-tab-row social-project-tab-row-rich" role="tablist" aria-label="Project sections">
                            ${tabItems.map(([tabId]) => renderProjectTabPill(tabId)).join('')}
                        </div>
                    </section>
                    <div id="social-project-tab-panel" class="social-project-tab-panel" data-project-tab="${escape(activeTab)}">
                        ${tabMarkup}
                    </div>
                </div>
            `;
        }

        return {
            renderProjectsWorkspacePanelClassic
        };
    }


    window.createKiuSocialWorkspacePanelApi = createKiuSocialWorkspacePanelApi;
})();
