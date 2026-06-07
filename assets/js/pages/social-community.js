(function initSocialCommunityModule() {
    if (window.__KIU_SOCIAL_COMMUNITY_MODULE_LOADED) return;
    window.__KIU_SOCIAL_COMMUNITY_MODULE_LOADED = true;

    const hooks = window.__kiuSocialCommunityHooks || {};
    const {
        state,
        relationshipBuckets,
        text,
        controlId,
        connectionStatusFor,
        personSuggestionScore,
        isStaffAccount,
        currentUserId,
        accountById,
        sharedGroupsWithUser,
        sharedPagesWithUser,
        mutualConnectionCount,
        currentFacultyCode,
        avatar,
        displayName,
        accountSubtitle,
        personRoleBadges,
        personProfileCompleteness,
        personActivityLabel,
        personSuggestionReason,
        renderRelationshipActions,
        inviteEligibleGroups,
        escape
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof relationshipBuckets !== 'function'
        || typeof text !== 'function'
        || typeof controlId !== 'function'
        || typeof connectionStatusFor !== 'function'
        || typeof personSuggestionScore !== 'function'
        || typeof isStaffAccount !== 'function'
        || typeof currentUserId !== 'function'
        || typeof accountById !== 'function'
        || typeof sharedGroupsWithUser !== 'function'
        || typeof sharedPagesWithUser !== 'function'
        || typeof mutualConnectionCount !== 'function'
        || typeof currentFacultyCode !== 'function'
        || typeof avatar !== 'function'
        || typeof displayName !== 'function'
        || typeof accountSubtitle !== 'function'
        || typeof personRoleBadges !== 'function'
        || typeof personProfileCompleteness !== 'function'
        || typeof personActivityLabel !== 'function'
        || typeof personSuggestionReason !== 'function'
        || typeof renderRelationshipActions !== 'function'
        || typeof inviteEligibleGroups !== 'function'
        || typeof escape !== 'function'
    ) {
        throw new Error('Social community hooks are unavailable.');
    }

    window.renderCommunityPanel = function renderCommunityPanel() {
        const runtime = state();
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const { incoming, outgoing, connections } = relationshipBuckets();
        const activeCommunityTab = text(runtime.ui?.communityTab || 'people') || 'people';
        const directorySearchId = controlId('directorySearch');
        const directoryRoleId = controlId('directoryRole');
        const suggestions = [...directory]
            .filter((account) => connectionStatusFor(account?.id).state === 'none')
            .sort((left, right) => personSuggestionScore(right) - personSuggestionScore(left))
            .slice(0, 18);
        const staff = directory.filter(isStaffAccount);
        const connectionAccounts = connections
            .map((relationship) => text(relationship.fromId) === currentUserId() ? text(relationship.toId) : text(relationship.fromId))
            .map((userId) => accountById(userId) || directory.find((entry) => text(entry.id) === userId) || { id: userId });
        const communityStats = {
            profiles: directory.length,
            suggested: suggestions.length,
            requests: incoming.length + outgoing.length,
            staff: staff.length
        };

        const renderSharedContext = (account) => {
            const sharedGroups = sharedGroupsWithUser(account?.id);
            const sharedPages = sharedPagesWithUser(account?.id);
            const mutuals = mutualConnectionCount(account?.id);
            const items = [];
            if (sharedGroups.length) items.push(`${sharedGroups.length} shared group${sharedGroups.length === 1 ? '' : 's'}`);
            if (sharedPages.length) items.push(`${sharedPages.length} shared page${sharedPages.length === 1 ? '' : 's'}`);
            if (mutuals) items.push(`${mutuals} mutual connection${mutuals === 1 ? '' : 's'}`);
            if (text(account?.facultyCode || account?.faculty) === currentFacultyCode()) items.push('Same faculty');
            return items.length ? items.join(' / ') : 'Campus member';
        };

        const renderPersonCard = (account, { showSuggestion = false, showConnectionControls = false, showStaffMeta = false } = {}) => {
            const interests = Array.isArray(account?.interests) ? account.interests.slice(0, 4) : [];
            const badges = personRoleBadges(account);
            const completeness = personProfileCompleteness(account);
            const showInvite = inviteEligibleGroups().length > 0 && connectionStatusFor(account?.id).state !== 'incoming';
            return `
                <article class="social-neo-card social-neo-directory-item social-neo-card-pad-16 social-neo-community-card">
                    <div class="social-neo-person social-neo-person-start-gap-12 social-neo-community-person">
                        ${avatar(account)}
                        <div class="social-neo-field-flex-1-260 social-neo-community-copy">
                            <div class="social-neo-post-head social-neo-inline-items-start social-neo-inline-gap-10-wrap social-neo-community-head">
                                <div class="social-neo-rail-person-copy social-neo-community-heading">
                                    <strong class="social-neo-rail-person-name">${escape(displayName(account))}</strong>
                                    <div class="social-neo-rail-person-meta social-neo-community-subtitle">${escape(accountSubtitle(account))}</div>
                                </div>
                                <span class="social-neo-pill social-neo-community-completeness">${escape(`${completeness}% complete`)}</span>
                            </div>
                            <div class="social-neo-badge-row social-neo-community-badges">
                                ${badges.map((badge) => `<span class="social-neo-pill">${escape(badge)}</span>`).join('')}
                                <span class="social-neo-pill">${escape(personActivityLabel(account?.id))}</span>
                            </div>
                            ${text(account?.bio) ? `<p class="social-neo-copy social-neo-event-copy social-neo-community-bio">${escape(text(account.bio))}</p>` : ''}
                            <div class="social-neo-rail-person-meta social-neo-community-context">${escape(renderSharedContext(account))}</div>
                            ${showSuggestion ? `<div class="social-neo-label social-neo-community-suggestion">${escape(personSuggestionReason(account))}</div>` : ''}
                            ${interests.length ? `
                                <div class="social-neo-badge-row social-neo-community-interests">
                                    ${interests.map((interest) => `<span class="social-neo-pill">${escape(interest)}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${(showStaffMeta || isStaffAccount(account)) && (text(account?.availability) || text(account?.officeHours) || text(account?.email) || text(account?.location)) ? `
                                <div class="social-neo-badge-row social-neo-community-staff-meta">
                                    ${text(account?.availability) ? `<span class="social-neo-pill">Availability: ${escape(text(account.availability))}</span>` : ''}
                                    ${text(account?.officeHours) ? `<span class="social-neo-pill">Office hours: ${escape(text(account.officeHours))}</span>` : ''}
                                    ${text(account?.location) ? `<span class="social-neo-pill">${escape(text(account.location))}</span>` : ''}
                                    ${text(account?.email) ? `<span class="social-neo-pill">${escape(text(account.email))}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="social-neo-field-fixed-220 social-neo-stack-end-260 social-neo-community-actions">
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-community-action-row social-neo-community-action-row-primary">
                            ${renderRelationshipActions(account)}
                            ${showConnectionControls ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="connection-remove" data-user-id="${escape(text(account.id))}">Remove</button>` : ''}
                        </div>
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-community-action-row social-neo-community-action-row-secondary">
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="profile-view" data-user-id="${escape(text(account.id))}">
                                <i class="fas fa-user"></i> View profile
                            </button>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="person-mention" data-user-id="${escape(text(account.id))}">
                                <i class="fas fa-at"></i> Mention
                            </button>
                            ${showInvite ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="person-group-invite" data-user-id="${escape(text(account.id))}">
                                <i class="fas fa-user-plus"></i> Invite to group
                            </button>` : ''}
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="directory-study-chat" data-user-id="${escape(text(account.id))}">
                                <i class="fas fa-book-open"></i> Study chat
                            </button>
                        </div>
                    </div>
                </article>
            `;
        };

        const renderRequestBoard = () => `
            <section class="social-neo-card">
                <div class="social-neo-section-head">
                    <div><strong>Connection requests</strong><span>Respond quickly so the network stays active.</span></div>
                    <span class="social-neo-pill"><strong>${escape(incoming.length + outgoing.length)}</strong><span>Total</span></span>
                </div>
                <div class="social-neo-grid-2 social-neo-grid-tight">
                    <div>
                        <span class="social-neo-label">Incoming</span>
                        <div class="social-neo-list">
                            ${incoming.length ? incoming.map((relationship) => {
                                const account = accountById(relationship.fromId) || { id: relationship.fromId };
                                return renderPersonCard(account, { showSuggestion: true });
                            }).join('') : `<div class="social-neo-empty">No incoming requests.</div>`}
                        </div>
                    </div>
                    <div>
                        <span class="social-neo-label">Outgoing</span>
                        <div class="social-neo-list">
                            ${outgoing.length ? outgoing.map((relationship) => {
                                const account = accountById(relationship.toId) || { id: relationship.toId };
                                return renderPersonCard(account, { showSuggestion: true });
                            }).join('') : `<div class="social-neo-empty">No outgoing requests.</div>`}
                        </div>
                    </div>
                </div>
            </section>
        `;

        const renderDirectorySection = (title, subtitle, items, options = {}) => `
            <section class="social-neo-card social-neo-community-panel is-featured ${escape(text(options.panelClass || ''))}">
                <div class="social-neo-section-head">
                    <div><strong>${escape(title)}</strong><span>${escape(subtitle)}</span></div>
                    <span class="social-neo-pill"><strong>${escape(items.length)}</strong><span>Profiles</span></span>
                </div>
                <div class="social-neo-directory-filters">
                    <input class="social-neo-input" id="${escape(directorySearchId)}" name="directorySearch" type="search" placeholder="Search people..." data-bind="directory-search" value="${escape(text(runtime.ui?.directorySearch || ''))}">
                    <select class="social-neo-select" id="${escape(directoryRoleId)}" name="directoryRole" data-bind="directory-role">
                        <option value="all" ${text(runtime.ui?.directoryRole || 'all') === 'all' ? 'selected' : ''}>All roles</option>
                        <option value="student" ${text(runtime.ui?.directoryRole) === 'student' ? 'selected' : ''}>Students</option>
                        <option value="professor" ${text(runtime.ui?.directoryRole) === 'professor' ? 'selected' : ''}>Professors</option>
                        <option value="ta" ${text(runtime.ui?.directoryRole) === 'ta' ? 'selected' : ''}>Teaching Assistants</option>
                        <option value="admin" ${text(runtime.ui?.directoryRole) === 'admin' ? 'selected' : ''}>Admins</option>
                    </select>
                </div>
                <div class="social-neo-stat-grid">
                    <div><strong>${escape(communityStats.profiles)}</strong><span>Profiles</span></div>
                    <div><strong>${escape(communityStats.suggested)}</strong><span>Suggested</span></div>
                    <div><strong>${escape(communityStats.staff)}</strong><span>Staff</span></div>
                </div>
                <div class="social-neo-directory">
                    ${items.length ? items.map((account) => renderPersonCard(account, options)).join('') : `<div class="social-neo-empty">${escape(options.emptyText || 'No people matched the current filter.')}</div>`}
                </div>
            </section>
        `;

        const activeView = activeCommunityTab === 'suggested'
            ? renderDirectorySection('Suggested people', 'Shared context, recent activity, and likely connections.', suggestions, { panelClass: 'social-neo-community-panel--suggested', showSuggestion: true, emptyText: 'No suggestions available right now.' })
            : activeCommunityTab === 'requests'
                ? renderRequestBoard()
                : activeCommunityTab === 'connections'
                    ? renderDirectorySection('Connections', 'People already in your campus network.', connectionAccounts, { panelClass: 'social-neo-community-panel--connections', showSuggestion: true, showConnectionControls: true, emptyText: 'No campus connections yet.' })
                    : activeCommunityTab === 'staff'
                        ? renderDirectorySection('Faculty and staff', 'Verified staff accounts with academic context and contact metadata.', staff, { panelClass: 'social-neo-community-panel--staff', showSuggestion: true, showStaffMeta: true, emptyText: 'No staff profiles matched the current filter.' })
                        : renderDirectorySection('People', 'Find classmates, staff, and collaborators with shared context.', directory, { panelClass: 'social-neo-community-panel--directory', showSuggestion: true, emptyText: 'No people matched the current filter.' });

        return `
            <div class="social-neo-stack social-neo-community-layout">
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong><i class="fas fa-user-friends social-neo-community-overview-icon"></i> Community overview</strong><span>People suggestions, verified staff, and shared-context shortcuts in one place.</span></div>
                    </div>
                    <div class="social-neo-stat-grid">
                        <div><strong>${escape(directory.length)}</strong><span>Profiles</span></div>
                        <div><strong>${escape(suggestions.length)}</strong><span>Suggested</span></div>
                        <div><strong>${escape(incoming.length + outgoing.length)}</strong><span>Requests</span></div>
                        <div><strong>${escape(connectionAccounts.length)}</strong><span>Connections</span></div>
                    </div>
                </section>
                ${activeView}
            </div>
        `;
    };
})();
