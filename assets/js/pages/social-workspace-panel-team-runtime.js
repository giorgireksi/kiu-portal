/* Team tab + workload aside helpers. Peeled from social-workspace-panel.js.
 * Load before social-workspace-panel.js. Host installs via deps bag.
 */
(function initSocialWorkspacePanelTeam() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PANEL_TEAM_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PANEL_TEAM_LOADED = true;

    window.__kiuCreateSocialWorkspacePanelTeamApi = function createKiuSocialWorkspacePanelTeamApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('panel team deps required');
        const d = deps;
        void d;

        const renderTeamWorkloadAside = () => {
            const list = Array.isArray(activeProject?.workloadByMember) ? activeProject.workloadByMember.slice(0, 6) : [];
            if (!list.length) return `<div class="social-neo-empty">No assigned workload yet.</div>`;
            const maxHours = Math.max(1, ...list.map((entry) => Number(entry?.hours) || 0));
            return `<div class="social-project-workload-list social-project-team-aside-workload">${list.map((entry) => {
                const account = accountById(entry.userId) || { id: entry.userId };
                const hours = Number(entry?.hours) || 0;
                const width = (hours / maxHours) * 100;
                return `
                    <article class="social-project-workload-item">
                        <div class="social-project-workload-head">
                            <strong>${escape(displayName(account))}</strong>
                            <em>${escape(String(countNum(entry.count)))} open · ${escape(formatProjectScheduleHours(hours))}</em>
                        </div>
                        <div class="social-project-workload-bar"><span style="width:${width}%"></span></div>
                    </article>
                `;
            }).join('')}</div>`;
        };
        const renderTeamTab = () => {
            const workloadList = Array.isArray(activeProject?.workloadByMember) ? activeProject.workloadByMember : [];
            const hasWorkload = workloadList.some((entry) => countNum(entry?.count) > 0);
            const useTeamAside = memberSummaries.length > 3;
            const showInlineWorkload = hasWorkload && !useTeamAside;
            const leaveNote = text(activeProject.role || '') === 'owner'
                ? (nextOwner ? `If you leave now, ownership transfers to ${displayName(nextOwner)}.` : 'If you leave now and nobody remains, this workspace becomes ownerless but stays intact.')
                : 'Leave the team without deleting chat, tasks, or activity history.';
            return `
            <section class="lux-soft-chrome lux-panel social-neo-card social-project-team-shell social-project-team-layout">
                <header class="social-project-team-toolbar">
                    <div class="social-project-team-toolbar-stats">
                        <span class="social-neo-pill"><strong>${escape(String(activeProject?.memberCount || 0))}</strong> members</span>
                        ${facultyMix.map((entry) => `<span class="social-neo-pill">${escape(text(entry.facultyCode || 'Unknown'))} · ${escape(String(entry.count || 0))}</span>`).join('')}
                        ${roleMix.map((entry) => `<span class="social-neo-pill">${escape(roleLabels[text(entry.role)] || text(entry.role))} · ${escape(String(entry.count || 0))}</span>`).join('')}
                        ${pendingMembers.length ? `<span class="social-neo-pill">${escape(String(pendingMembers.length))} pending</span>` : ''}
                    </div>
                    ${activeProject.isManager ? `
                        <div class="social-project-team-toolbar-actions">
                            <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="project-team-invite-toggle"><i class="fas fa-user-plus"></i> Invite</button>
                        </div>
                    ` : ''}
                </header>
                <div class="social-project-team-body${useTeamAside ? ' has-team-aside' : ''}">
                    <main class="social-project-team-main">
                        ${pendingMembers.length ? `
                            <section class="social-project-team-pending">
                                <div class="social-project-team-pending-head">
                                    <strong>Pending invites</strong>
                                    <span class="social-neo-pill">${escape(String(pendingMembers.length))}</span>
                                </div>
                                <div class="social-project-team-rows">${pendingMembers.map((entry) => renderTeamMemberCard(entry, { pending: true })).join('')}</div>
                            </section>
                        ` : ''}
                        <section class="social-project-team-active">
                            <div class="social-project-team-rows">${memberSummaries.length ? memberSummaries.map((entry) => renderTeamMemberCard(entry)).join('') : `<div class="social-neo-empty">No team members yet.</div>`}</div>
                        </section>
                        ${showInlineWorkload ? `
                            <section class="social-project-team-workload-inline">
                                <strong>Workload</strong>
                                ${renderTeamWorkloadAside()}
                            </section>
                        ` : ''}
                    </main>
                    ${useTeamAside ? `
                        <aside class="social-project-team-aside">
                            <div class="social-project-team-aside-block">
                                <strong>Workload</strong>
                                ${renderTeamWorkloadAside()}
                            </div>
                        </aside>
                    ` : ''}
                </div>
                ${activeProject.isManager ? `
                    <details class="social-project-team-invite is-toolbar-driven">
                        <summary class="social-project-team-invite-summary">Invite members</summary>
                        <div class="social-project-team-invite-body">
                            <div class="social-neo-directory-filters">
                                <input class="social-neo-input" type="search" name="projectInviteSearch" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}" placeholder="Search by name, faculty, role, or interests">
                                <select class="social-neo-select" name="projectInviteFaculty" data-lux-picker>
                                    <option value="all" ${inviteFaculty === 'all' ? 'selected' : ''}>All faculties</option>
                                    ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${inviteFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode)}</option>`).join('')}
                                </select>
                            </div>
                            ${scrollList('social-project-scroll-list--invite', `
                            <div class="social-neo-stack social-neo-stack-mt-14">
                                ${filteredInviteCandidates.length ? filteredInviteCandidates.map((account) => `
                                    <article class="lux-soft-chrome lux-panel social-neo-card social-project-invite-row">
                                        <div class="social-neo-person">
                                            ${avatar(account)}
                                            <div>
                                                <strong>${escape(displayName(account))}</strong>
                                                <span>${escape(accountSubtitle(account))}</span>
                                            </div>
                                        </div>
                                        <div class="social-project-team-actions">
                                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="member">Invite member</button>
                                            ${isStaffAccount(account) ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="advisor">Promote to advisor</button>` : ''}
                                            ${isStaffAccount(account) ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="instructor-viewer">Set instructor viewer</button>` : ''}
                                        </div>
                                    </article>
                                `).join('') : `<div class="social-neo-empty">No invite candidates match the current filters.</div>`}
                            </div>
                            `)}
                        </div>
                    </details>
                ` : ''}
                <footer class="social-project-team-footer">
                    <div class="social-project-team-footer-copy">
                        ${nextOwner ? `<span class="social-neo-pill">Next owner: ${escape(displayName(nextOwner))}</span>` : ''}
                        <p class="social-neo-muted">${escape(leaveNote)}</p>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-leave-open" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-sign-out-alt"></i> Leave workspace</button>
                </footer>
            </section>
        `;
        };

        const api = {
            renderTeamWorkloadAside,
            renderTeamTab,
        };
        Object.assign(window, api);
        Object.assign(deps, api);
        return api;
    };
})();

