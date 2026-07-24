/* Social workspace project chrome (hero, create/settings dialogs, invite).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceProjectChromeApi(deps).
 */
(function initSocialWorkspaceProjectChrome() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PROJECT_CHROME_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PROJECT_CHROME_LOADED = true;

    function createKiuSocialWorkspaceProjectChromeApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace project-chrome deps required');
        const {
            accountById,
            accountSubtitle,
            avatar,
            controlId,
            currentFacultyCode,
            currentUserId,
            displayName,
            escape,
            facultyLabel,
            isStaffAccount,
            neoActions,
            neoField,
            neoHead,
            neoSection,
            resolveActiveSocialProject,
            roleLabel,
            text,
            toDateTimeLocalValue,
            uniqueStrings
        } = deps;

        function renderWorkspaceHero(runtime, projects, metrics = {}) {
            const viewMode = text(metrics.viewMode || 'hub') || 'hub';
            const myProjects = Array.isArray(metrics.myProjects) ? metrics.myProjects : [];
            const totalTasks = Number(metrics.totalTasks || 0);
            const totalActivity = Number(metrics.totalActivity || 0);
            const facultyCount = Number(metrics.facultyCount || 0);
            const activeCount = projects.filter((project) => text(project?.status || '') === 'active').length;
            const subtitles = {
                hub: 'Browse your studios, track delivery pulse, and spin up a new cross-faculty workspace.',
            };
            const stats = [
                { label: 'Workspaces', value: projects.length },
                { label: 'Active', value: activeCount },
                { label: 'Your roles', value: myProjects.length },
                { label: 'Tasks', value: totalTasks },
                { label: 'Faculties', value: facultyCount },
                { label: 'Activity', value: totalActivity },
            ];
            const sectionsHtml = text(metrics.sectionsHtml || '');
            return `
                <section class="lux-soft-chrome lux-panel social-neo-card social-neo-workspace-hero social-neo-community-panel social-neo-community-panel--workspace">
                    <div class="social-neo-workspace-hero-head">
                        <div class="social-neo-workspace-hero-actions">
                            <button class="social-neo-btn social-neo-btn-primary social-neo-workspace-hero-create-btn" type="button" data-action="project-create-open">
                                <i class="fas fa-plus"></i> Create workspace
                            </button>
                        </div>
                    </div>
                    <div class="social-neo-workspace-hero-stats">
                        ${stats.map((stat) => `
                            <article class="social-neo-workspace-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                                <strong>${escape(String(stat.value))}</strong>
                                <span>${escape(stat.label)}</span>
                            </article>
                        `).join('')}
                    </div>
                    ${sectionsHtml}
                </section>
            `;
        }

        function buildProjectCreateContext(runtime) {
            const social = runtime.social || {};
            const projects = Array.isArray(social.projects) ? social.projects : [];
            const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
            const facultyOptions = uniqueStrings([
                currentFacultyCode(),
                ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : []),
                ...directory.map((account) => text(account?.facultyCode || account?.faculty))
            ]).filter(Boolean);
            const projectFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
                ? runtime.ui.projectFacultyCodes
                : [currentFacultyCode()];
            const advisorCandidates = directory.filter((account) => isStaffAccount(account) || ['professor', 'ta', 'admin'].includes(text(account?.role || '').toLowerCase()));
            return {
                facultyOptions,
                projectFaculties,
                advisorCandidates,
                projectNameId: controlId('projectName'),
                projectCourseTagId: controlId('projectCourseTag'),
                projectSummaryId: controlId('projectSummary'),
                projectDescriptionId: controlId('projectDescription'),
                projectStatusId: controlId('projectStatus'),
                projectVisibilityId: controlId('projectVisibility'),
                projectAdvisorUserId: controlId('projectAdvisorUserId'),
                projectRecommendedTeamSizeId: controlId('projectRecommendedTeamSize'),
                projectMinTeamSizeId: controlId('projectMinTeamSize'),
                projectSkillTagsId: controlId('projectSkillTags'),
                projectInviteSearchId: controlId('projectInviteSearch'),
                projectInviteFacultyId: controlId('projectInviteFaculty')
            };
        }
        function buildProjectCreateInviteContext(runtime, baseContext) {
            const ctx = baseContext || buildProjectCreateContext(runtime);
            const selectedMemberIds = Array.isArray(runtime.ui?.projectInviteSelectedIds)
                ? runtime.ui.projectInviteSelectedIds.map((item) => text(item)).filter(Boolean)
                : [];
            const memberSearch = text(runtime.ui?.projectInviteSearch || '').trim().toLowerCase();
            const facultyFilter = text(runtime.ui?.projectInviteFaculty || 'all') || 'all';
            const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
            const allAccounts = directory
                .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
                .sort((left, right) => displayName(left).localeCompare(displayName(right)));
            const facultyOptions = ['all', ...ctx.facultyOptions];
            const candidateAccounts = allAccounts.filter((account) => {
                const accountId = text(account?.id);
                if (!accountId || selectedMemberIds.includes(accountId)) return false;
                if (facultyFilter !== 'all' && text(account?.facultyCode || account?.faculty || '') !== facultyFilter) return false;
                if (!memberSearch) return true;
                const haystack = [
                    displayName(account),
                    account?.email,
                    account?.facultyCode,
                    account?.faculty,
                    roleLabel(account?.role),
                    ...(Array.isArray(account?.interests) ? account.interests : [])
                ].filter(Boolean).join(' ').toLowerCase();
                return haystack.includes(memberSearch);
            });
            const selectedMembersMarkup = selectedMemberIds.length
                ? selectedMemberIds.map((memberId) => {
                    const account = accountById(memberId) || { id: memberId };
                    return `
                        <div class="social-neo-item-line social-neo-group-creator-member is-selected">
                            <div class="social-neo-person">
                                ${avatar(account, 'social-neo-avatar-sm')}
                                <div>
                                    <strong>${escape(displayName(account))}</strong>
                                    <span>${escape(accountSubtitle(account))}</span>
                                </div>
                            </div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-creator-member-remove" data-user-id="${escape(text(memberId))}">
                                <i class="fas fa-xmark"></i> Remove
                            </button>
                        </div>
                    `;
                }).join('')
                : '<p class="social-neo-dialog-hint">No teammates selected yet.</p>';
            const searchResultsMarkup = candidateAccounts.length
                ? candidateAccounts.slice(0, 12).map((account) => `
                    <article class="social-neo-entity-card social-neo-group-creator-member">
                        <div class="social-neo-person">
                            ${avatar(account, 'social-neo-avatar-sm')}
                            <div>
                                <strong>${escape(displayName(account))}</strong>
                                <span>${escape(accountSubtitle(account))}</span>
                            </div>
                        </div>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="project-creator-member-add" data-user-id="${escape(text(account.id))}">
                            <i class="fas fa-user-plus"></i> Add
                        </button>
                    </article>
                `).join('')
                : `<p class="social-neo-dialog-hint">${memberSearch || facultyFilter !== 'all' ? 'No people match the current search or faculty filter.' : 'Start typing or choose a faculty to find teammates.'}</p>`;
            return {
                ...ctx,
                selectedMemberIds,
                candidateAccounts,
                facultyOptions,
                facultyFilter,
                memberSearch,
                selectedMembersMarkup,
                searchResultsMarkup
            };
        }
        function renderProjectCreateInviteSection(runtime, inviteContext) {
            const ctx = inviteContext || buildProjectCreateInviteContext(runtime);
            return `
                <section class="social-neo-dialog-project-create-section social-neo-dialog-project-create-section--invite">
                    ${neoSection('Seed the team', 'Optional. Invite collaborators before the workspace opens.')}
                    <div class="social-neo-dialog-invite-toolbar">
                        <label class="social-neo-dialog-field social-neo-dialog-invite-search-field" for="${escape(ctx.projectInviteSearchId)}">
                            <span class="social-neo-label">Search people</span>
                            <input class="social-neo-input" id="${escape(ctx.projectInviteSearchId)}" type="search" name="projectInviteSearch" placeholder="Search by name, faculty, role, or interests" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}">
                        </label>
                        <label class="social-neo-dialog-field social-neo-dialog-invite-faculty-field" for="${escape(ctx.projectInviteFacultyId)}">
                            <span class="social-neo-label">Faculty</span>
                            <select class="social-neo-select" id="${escape(ctx.projectInviteFacultyId)}" name="projectInviteFaculty" data-lux-picker>
                                ${ctx.facultyOptions.map((faculty) => `<option value="${escape(faculty)}" ${ctx.facultyFilter === faculty ? 'selected' : ''}>${escape(faculty === 'all' ? 'All faculties' : facultyLabel(faculty))}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <div class="social-neo-dialog-invite-columns">
                        <article class="social-neo-dialog-invite-block">
                            <div class="social-neo-dialog-invite-block-head">
                                <strong>Selected teammates</strong>
                                <span>${escape(ctx.selectedMemberIds.length)} invitation${ctx.selectedMemberIds.length === 1 ? '' : 's'} queued.</span>
                            </div>
                            <div class="social-neo-list social-neo-dialog-invite-list">${ctx.selectedMembersMarkup}</div>
                        </article>
                        <article class="social-neo-dialog-invite-block">
                            <div class="social-neo-dialog-invite-block-head">
                                <strong>Search results</strong>
                                <span>${escape(ctx.candidateAccounts.length)} people available.</span>
                            </div>
                            <div class="social-neo-list social-neo-dialog-invite-list">${ctx.searchResultsMarkup}</div>
                        </article>
                    </div>
                </section>
            `;
        }
        function renderProjectSettingsDialog(runtime, dialog) {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            if (!project || !project.isManager) return '';
            const ctx = buildProjectCreateInviteContext(runtime);
            const advisorCandidates = Array.isArray(ctx.advisorCandidates) ? ctx.advisorCandidates : [];
            const externalLinksText = (Array.isArray(project.externalLinks) ? project.externalLinks : [])
                .map((link) => text(link?.url || ''))
                .filter(Boolean)
                .join('\n');
            const statusOptions = ['idea', 'active', 'review', 'completed'];
            const nameId = controlId('project-settings-name');
            const summaryId = controlId('project-settings-summary');
            const descId = controlId('project-settings-desc');
            const statusId = controlId('project-settings-status');
            const visibilityId = controlId('project-settings-visibility');
            const advisorId = controlId('project-settings-advisor');
            const recommendedId = controlId('project-settings-recommended');
            const minId = controlId('project-settings-min');
            const linksId = controlId('project-settings-links');
            const showcaseId = controlId('project-settings-showcase');
            const scheduleStartId = controlId('project-settings-schedule-start');
            const scheduleStartValue = toDateTimeLocalValue(project.scheduleStartAt || '');
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-task-create social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-form="project-settings" data-project-id="${escape(text(project.id))}" data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHead('Workspace settings', 'Tune status, visibility, advisor, and team size for this project.', { icon: 'fas fa-sliders' })}
                    <div class="social-neo-dialog-body social-neo-dialog-body--project-task-create">
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            ${neoField('Project name', `<input class="social-neo-input" id="${escape(nameId)}" type="text" name="projectName" value="${escape(text(project.name || project.title || ''))}" required>`, { forId: nameId })}
                            <label class="social-neo-dialog-field" for="${escape(statusId)}">
                                <span class="social-neo-label">Status</span>
                                <select class="social-neo-select" id="${escape(statusId)}" name="projectStatus" data-lux-picker>
                                    ${statusOptions.map((status) => `<option value="${escape(status)}" ${text(project.status || 'idea') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                </select>
                            </label>
                        </div>
                        ${neoField('Summary', `<input class="social-neo-input" id="${escape(summaryId)}" type="text" name="projectSummary" value="${escape(text(project.summary || ''))}">`, { forId: summaryId })}
                        ${neoField('Description', `<textarea class="social-neo-textarea" id="${escape(descId)}" rows="3" name="projectDescription">${escape(text(project.description || ''))}</textarea>`, { forId: descId })}
                        <div class="social-neo-form-grid social-neo-form-grid-3">
                            <label class="social-neo-dialog-field" for="${escape(visibilityId)}">
                                <span class="social-neo-label">Visibility</span>
                                <select class="social-neo-select" id="${escape(visibilityId)}" name="projectVisibility" data-lux-picker>
                                    <option value="all_logged_in" ${text(project.visibilityMode || 'all_logged_in') === 'all_logged_in' ? 'selected' : ''}>Public to logged-in</option>
                                    <option value="custom" ${text(project.visibilityMode || '') === 'custom' ? 'selected' : ''}>Team only</option>
                                </select>
                            </label>
                            ${neoField('Recommended team size', `<input class="social-neo-input" id="${escape(recommendedId)}" type="number" min="2" max="20" name="projectRecommendedTeamSize" value="${escape(String(project.recommendedTeamSize || 4))}">`, { forId: recommendedId })}
                            ${neoField('Minimum team size', `<input class="social-neo-input" id="${escape(minId)}" type="number" min="2" max="20" name="projectMinTeamSize" value="${escape(String(project.minTeamSize || 4))}">`, { forId: minId })}
                        </div>
                        <label class="social-neo-dialog-field" for="${escape(advisorId)}">
                            <span class="social-neo-label">Advisor</span>
                            <select class="social-neo-select" id="${escape(advisorId)}" name="projectAdvisorUserId" data-lux-picker>
                                <option value="">No advisor assigned</option>
                                ${advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(project.advisorUserId || '') === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}
                            </select>
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(scheduleStartId)}">
                            <span class="social-neo-label">Project start date</span>
                            <input class="social-neo-input" id="${escape(scheduleStartId)}" type="datetime-local" name="projectScheduleStartAt" value="${escape(scheduleStartValue)}">
                            <span class="social-neo-muted social-neo-copy-mt-8">Used to derive planned finish dates on the task map (8h workday, no weekends).</span>
                        </label>
                        ${neoField('External links', `<textarea class="social-neo-textarea" id="${escape(linksId)}" rows="3" name="projectExternalLinks" placeholder="One URL per line">${escape(externalLinksText)}</textarea>`, { forId: linksId })}
                        ${neoField('Showcase summary', `<textarea class="social-neo-textarea" id="${escape(showcaseId)}" rows="2" name="projectShowcaseSummary" placeholder="Short blurb used when this workspace is showcased.">${escape(text(project.showcaseSummary || ''))}</textarea>`, { forId: showcaseId })}
                    </div>
                    ${neoActions({ cancelLabel: 'Cancel', submitLabel: 'Save settings', submitIcon: 'fas fa-check' })}
                </form>
            </div>`;
        }
        function renderProjectCreateDialog(runtime) {
            const ctx = buildProjectCreateInviteContext(runtime);
            const inviteCount = ctx.selectedMemberIds.length;
            const inviteBadge = inviteCount > 0
                ? `<span class="social-neo-dialog-submit-badge">${escape(String(inviteCount))}</span>`
                : '';
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-create social-neo-dialog-card--lms-create" data-form="create-project" data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHead('Create workspace', 'Create a course group project, invite teammates, then track tasks together.', { icon: 'fas fa-diagram-project' })}
                    <div class="social-neo-dialog-body social-neo-dialog-body--project-create">
                        <section class="social-neo-dialog-project-create-section">
                            ${neoSection('Basic info', 'Title, course context, and what the team will deliver.')}
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                ${neoField('Title', `<input class="social-neo-input" id="${escape(ctx.projectNameId)}" type="text" name="projectName" placeholder="Smart irrigation prototype" value="${escape(text(runtime.ui?.projectName || ''))}" required>`, { forId: ctx.projectNameId })}
                                ${neoField('Course / module', `<input class="social-neo-input" id="${escape(ctx.projectCourseTagId)}" type="text" name="projectCourseTag" placeholder="CS401 Capstone" value="${escape(text(runtime.ui?.projectCourseTag || ''))}">`, { forId: ctx.projectCourseTagId })}
                            </div>
                            ${neoField('Summary', `<input class="social-neo-input" id="${escape(ctx.projectSummaryId)}" type="text" name="projectSummary" placeholder="Cross-faculty automation project for greenhouse monitoring" value="${escape(text(runtime.ui?.projectSummary || ''))}">`, { forId: ctx.projectSummaryId })}
                            ${neoField('Description', `<textarea class="social-neo-textarea" id="${escape(ctx.projectDescriptionId)}" rows="3" name="projectDescription" placeholder="What is the project, what problem are you solving, and what will the team deliver?">${escape(text(runtime.ui?.projectDescription || ''))}</textarea>`, { forId: ctx.projectDescriptionId })}
                        </section>
                        <section class="social-neo-dialog-project-create-section">
                            ${neoSection('Settings', 'Visibility, advisor, team size, and faculties involved.')}
                            <div class="social-neo-form-grid social-neo-form-grid-3">
                                <label class="social-neo-dialog-field" for="${escape(ctx.projectStatusId)}">
                                    <span class="social-neo-label">Status</span>
                                    <select class="social-neo-select" id="${escape(ctx.projectStatusId)}" name="projectStatus" data-lux-picker>
                                        ${['idea', 'active', 'review', 'completed'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'idea') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="social-neo-dialog-field" for="${escape(ctx.projectVisibilityId)}">
                                    <span class="social-neo-label">Visibility</span>
                                    <select class="social-neo-select" id="${escape(ctx.projectVisibilityId)}" name="projectVisibility" data-lux-picker>
                                        ${['private', 'faculty', 'public'].map((visibility) => `<option value="${escape(visibility)}" ${text(runtime.ui?.projectVisibility || 'private') === visibility ? 'selected' : ''}>${escape(visibility)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="social-neo-dialog-field" for="${escape(ctx.projectAdvisorUserId)}">
                                    <span class="social-neo-label">Advisor</span>
                                    <select class="social-neo-select" id="${escape(ctx.projectAdvisorUserId)}" name="projectAdvisorUserId" data-lux-picker>
                                        <option value="">No advisor yet</option>
                                        ${ctx.advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(runtime.ui?.projectAdvisorUserId || '') === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}
                                    </select>
                                </label>
                            </div>
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                ${neoField('Recommended team size', `<input class="social-neo-input" id="${escape(ctx.projectRecommendedTeamSizeId)}" type="number" min="2" name="projectRecommendedTeamSize" value="${escape(text(runtime.ui?.projectRecommendedTeamSize || 4))}">`, { forId: ctx.projectRecommendedTeamSizeId })}
                                ${neoField('Minimum team size', `<input class="social-neo-input" id="${escape(ctx.projectMinTeamSizeId)}" type="number" min="2" name="projectMinTeamSize" value="${escape(text(runtime.ui?.projectMinTeamSize || 4))}">`, { forId: ctx.projectMinTeamSizeId })}
                            </div>
                            ${neoField('Skills / roles', `<input class="social-neo-input" id="${escape(ctx.projectSkillTagsId)}" type="text" name="projectSkillTags" placeholder="developer, designer, researcher, analyst" value="${escape(text(runtime.ui?.projectSkillTags || ''))}">`, { forId: ctx.projectSkillTagsId })}
                            <div class="social-neo-dialog-project-create-faculties">
                                <span class="social-neo-label">Faculties involved</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                    ${ctx.facultyOptions.map((facultyCode) => `<button class="social-neo-btn ${ctx.projectFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>`).join('')}
                                </div>
                            </div>
                        </section>
                        ${renderProjectCreateInviteSection(runtime, ctx)}
                    </div>
                    ${neoActions({
                        submitHtml: `<i class="fas fa-diagram-project"></i> Create workspace${inviteBadge}`,
                        submitIcon: '',
                        submitLabel: 'Create workspace'
                    })}
                </form>
            </div>`;
        }

        return {
            renderWorkspaceHero,
            buildProjectCreateContext,
            buildProjectCreateInviteContext,
            renderProjectCreateInviteSection,
            renderProjectSettingsDialog,
            renderProjectCreateDialog
        };
    }

    window.createKiuSocialWorkspaceProjectChromeApi = createKiuSocialWorkspaceProjectChromeApi;
})();
