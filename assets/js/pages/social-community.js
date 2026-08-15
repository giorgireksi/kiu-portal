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
        inviteEligibleGroups,
        escape,
        renderCommunityHero,
        openDialog,
        renderSocialPageNow,
        withBusy,
        root,
        invalidateSocialRenderCache,
        rememberInteractionAnchor,
        sendPortalSocialConnectionRequest,
        respondPortalSocialConnectionRequest,
        removePortalSocialConnection,
        queueDirectoryRefresh
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
        || typeof inviteEligibleGroups !== 'function'
        || typeof escape !== 'function'
        || typeof renderCommunityHero !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof root !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof rememberInteractionAnchor !== 'function'
        || typeof sendPortalSocialConnectionRequest !== 'function'
        || typeof respondPortalSocialConnectionRequest !== 'function'
        || typeof removePortalSocialConnection !== 'function'
        || typeof queueDirectoryRefresh !== 'function'
    ) {
        throw new Error('Social community hooks are unavailable.');
    }

    function renderRelationshipActions(account) {
        const status = connectionStatusFor(account?.id);
        if (status.state === 'connected') {
            return `
                <button class="lux-primary-btn" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                    Message
                </button>
                <span class="social-neo-pill home-hover-chip">Friends</span>
            `;
        }
        if (status.state === 'incoming') {
            return `
                <button class="lux-secondary-btn" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                    Message
                </button>
                <button class="lux-primary-btn" type="button" data-action="connection-accept" data-relationship-id="${escape(text(status.relationship?.id))}">
                    Accept friend
                </button>
                <button class="lux-secondary-btn" type="button" data-action="connection-decline" data-relationship-id="${escape(text(status.relationship?.id))}">
                    Decline
                </button>
            `;
        }
        if (status.state === 'outgoing') {
            return `
                <button class="lux-secondary-btn" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                    Message
                </button>
                <span class="social-neo-pill home-hover-chip">Friend request sent</span>
                <button class="lux-secondary-btn" type="button" data-action="connection-cancel" data-user-id="${escape(text(account.id))}">
                    Cancel request
                </button>
            `;
        }
        return `
            <button class="lux-secondary-btn" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                Message
            </button>
            <button class="lux-primary-btn" type="button" data-action="connection-send" data-user-id="${escape(text(account.id))}">
                Add friend
            </button>
        `;
    }

    window.renderRelationshipActions = renderRelationshipActions;

    window.renderCommunityPanel = function renderCommunityPanel() {
        const runtime = state();
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const { incoming, outgoing, connections } = relationshipBuckets();
        const rawCommunityTab = text(runtime.ui?.communityTab || 'people') || 'people';
        const activeCommunityTab = rawCommunityTab === 'suggested' ? 'people' : rawCommunityTab;
        const directorySearchId = controlId('directorySearch');
        const directoryRoleId = controlId('directoryRole');
        const chrome = window.KiuSocialChromeModel || {};
        const browseFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
            ? chrome.socialBrowseFacultyValue(runtime)
            : (text(runtime.ui?.socialBrowseFaculty || 'all') || 'all');
        const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
            ? chrome.socialMatchesBrowseFaculty
            : () => true;
        const matchesPersonFaculty = (account) => matchesBrowse(account, browseFaculty);
        const staff = directory.filter(isStaffAccount).filter(matchesPersonFaculty);
        const connectionAccounts = connections
            .map((relationship) => text(relationship.fromId) === currentUserId() ? text(relationship.toId) : text(relationship.fromId))
            .map((userId) => accountById(userId) || directory.find((entry) => text(entry.id) === userId) || { id: userId })
            .filter(matchesPersonFaculty);
        const peopleDirectory = directory.filter(matchesPersonFaculty);
        const communityStats = {
            profiles: directory.length,
            requests: incoming.length + outgoing.length,
            connections: connectionAccounts.length,
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
                <article class="social-neo-directory-item social-neo-community-card home-hover-chip" data-user-id="${escape(text(account.id))}">
                    <div class="social-neo-person social-neo-person-start-gap-12 social-neo-community-person">
                        ${avatar(account)}
                        <div class="social-neo-field-flex-1-260 social-neo-community-copy">
                            <div class="social-neo-post-head social-neo-inline-items-start social-neo-inline-gap-10-wrap social-neo-community-head">
                                <div class="social-neo-rail-person-copy social-neo-community-heading">
                                    <strong class="social-neo-rail-person-name">${escape(displayName(account))}</strong>
                                    <div class="social-neo-rail-person-meta social-neo-community-subtitle">${escape(accountSubtitle(account))}</div>
                                </div>
                                <span class="social-neo-pill home-hover-chip social-neo-community-completeness">${escape(`${completeness}% complete`)}</span>
                            </div>
                            <div class="social-neo-badge-row social-neo-community-badges">
                                ${badges.map((badge) => `<span class="social-neo-pill home-hover-chip">${escape(badge)}</span>`).join('')}
                                <span class="social-neo-pill home-hover-chip">${escape(personActivityLabel(account?.id))}</span>
                            </div>
                            ${text(account?.bio) ? `<p class="social-neo-copy social-neo-event-copy social-neo-community-bio">${escape(text(account.bio))}</p>` : ''}
                            <div class="social-neo-rail-person-meta social-neo-community-context">${escape(renderSharedContext(account))}</div>
                            ${showSuggestion ? `<div class="social-neo-label social-neo-community-suggestion">${escape(personSuggestionReason(account))}</div>` : ''}
                            ${interests.length ? `
                                <div class="social-neo-badge-row social-neo-community-interests">
                                    ${interests.map((interest) => `<span class="social-neo-pill home-hover-chip">${escape(interest)}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${(showStaffMeta || isStaffAccount(account)) && (text(account?.availability) || text(account?.officeHours) || text(account?.email) || text(account?.location)) ? `
                                <div class="social-neo-badge-row social-neo-community-staff-meta">
                                    ${text(account?.availability) ? `<span class="social-neo-pill home-hover-chip">Availability: ${escape(text(account.availability))}</span>` : ''}
                                    ${text(account?.officeHours) ? `<span class="social-neo-pill home-hover-chip">Office hours: ${escape(text(account.officeHours))}</span>` : ''}
                                    ${text(account?.location) ? `<span class="social-neo-pill home-hover-chip">${escape(text(account.location))}</span>` : ''}
                                    ${text(account?.email) ? `<span class="social-neo-pill home-hover-chip">${escape(text(account.email))}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="social-neo-field-fixed-220 social-neo-stack-end-260 social-neo-community-actions">
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-community-action-row social-neo-community-action-row-primary">
                            ${renderRelationshipActions(account)}
                            ${showConnectionControls ? `<button class="lux-secondary-btn" type="button" data-action="connection-remove" data-user-id="${escape(text(account.id))}">Remove</button>` : ''}
                        </div>
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-community-action-row social-neo-community-action-row-secondary">
                            <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="profile-view" data-user-id="${escape(text(account.id))}">
                                <i class="fas fa-user"></i> View profile
                            </button>
                            ${showInvite ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="person-group-invite" data-user-id="${escape(text(account.id))}">
                                <i class="fas fa-user-plus"></i> Invite to group
                            </button>` : ''}
                        </div>
                    </div>
                </article>
            `;
        };

        const renderRequestBody = () => `
            <div class="social-neo-section-head">
                <div><strong>Connection requests</strong><span>Respond quickly so the network stays active.</span></div>
                <span class="social-neo-pill home-hover-chip"><strong>${escape(incoming.length + outgoing.length)}</strong><span>Total</span></span>
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
        `;

        const renderDirectoryBody = (items, options = {}) => `
            <div class="social-neo-community-hero-toolbar home-hover-chip">
                <div class="social-neo-directory-filters">
                    <input class="social-neo-input lux-control" id="${escape(directorySearchId)}" name="directorySearch" type="search" placeholder="Search people..." data-bind="directory-search" value="${escape(text(runtime.ui?.directorySearch || ''))}">
                    <select class="social-neo-select lux-control" id="${escape(directoryRoleId)}" name="directoryRole" data-bind="directory-role" data-lux-picker>
                        <option value="all" ${text(runtime.ui?.directoryRole || 'all') === 'all' ? 'selected' : ''}>All roles</option>
                        <option value="student" ${text(runtime.ui?.directoryRole) === 'student' ? 'selected' : ''}>Students</option>
                        <option value="professor" ${text(runtime.ui?.directoryRole) === 'professor' ? 'selected' : ''}>Professors</option>
                        <option value="ta" ${text(runtime.ui?.directoryRole) === 'ta' ? 'selected' : ''}>Teaching Assistants</option>
                        <option value="student_service" ${text(runtime.ui?.directoryRole) === 'student_service' ? 'selected' : ''}>Student Service</option>
                    </select>
                </div>
            </div>
            <div class="social-neo-directory">
                ${items.length ? items.map((account) => renderPersonCard(account, options)).join('') : `<div class="social-neo-empty">${escape(options.emptyText || 'No people matched the current filter.')}</div>`}
            </div>
        `;

        let activeBody = '';
        let panelClass = 'social-neo-community-panel--directory';
        if (activeCommunityTab === 'requests') {
            activeBody = renderRequestBody();
            panelClass = 'social-neo-community-panel--requests';
        } else if (activeCommunityTab === 'connections') {
            activeBody = renderDirectoryBody(connectionAccounts, { showSuggestion: true, showConnectionControls: true, emptyText: 'No campus connections yet.' });
            panelClass = 'social-neo-community-panel--connections';
        } else if (activeCommunityTab === 'staff') {
            activeBody = renderDirectoryBody(staff, { showSuggestion: true, showStaffMeta: true, emptyText: 'No staff profiles matched the current filter.' });
            panelClass = 'social-neo-community-panel--staff';
        } else {
            activeBody = renderDirectoryBody(peopleDirectory, { showSuggestion: true, emptyText: 'No people matched the current filter.' });
        }

        return `
            <div class="social-neo-stack social-neo-community-shell">
                ${renderCommunityHero(runtime, activeCommunityTab, communityStats, activeBody, { panelClass })}
            </div>
        `;
    };

    function isSocialCommunityClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        return a.startsWith('connection-') || a.startsWith('person-');
    }

    function handleSocialCommunityClick(action, trigger) {
        if (!isSocialCommunityClickAction(action)) return false;
        if (action === 'person-group-invite') {
            const targetUserId = text(trigger.getAttribute('data-user-id'));
            const targetAccount = accountById(targetUserId) || { id: targetUserId };
            const firstGroup = inviteEligibleGroups()[0];
            return openDialog('group-invite', {
                targetUserId,
                targetUserName: displayName(targetAccount),
                groupId: text(firstGroup?.id || ''),
                note: ''
            });
        }

        if (action === 'connection-send') {
            rememberInteractionAnchor(root(), trigger);
            return withBusy(async () => {
                await sendPortalSocialConnectionRequest(trigger.getAttribute('data-user-id'));
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('connection-send');
            });
        }

        if (action === 'connection-accept') {
            rememberInteractionAnchor(root(), trigger);
            return withBusy(async () => {
                await respondPortalSocialConnectionRequest(trigger.getAttribute('data-relationship-id'), true);
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('connection-accept');
            });
        }

        if (action === 'connection-decline') {
            rememberInteractionAnchor(root(), trigger);
            return withBusy(async () => {
                await respondPortalSocialConnectionRequest(trigger.getAttribute('data-relationship-id'), false);
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('connection-decline');
            });
        }

        if (action === 'connection-cancel') {
            rememberInteractionAnchor(root(), trigger);
            return withBusy(async () => {
                await removePortalSocialConnection(trigger.getAttribute('data-user-id'));
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('connection-cancel');
            });
        }

        if (action === 'connection-remove') {
            rememberInteractionAnchor(root(), trigger);
            return withBusy(async () => {
                await removePortalSocialConnection(trigger.getAttribute('data-user-id'));
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('connection-remove');
            });
        }
        return false;
    }

    window.handleSocialCommunityClick = handleSocialCommunityClick;
    window.isSocialCommunityClickAction = isSocialCommunityClickAction;

    function isSocialCommunityInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="directory-search"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialCommunityInput(target, runtime, event) {
        if (!isSocialCommunityInputTarget(target)) return false;
        if (target.matches('[data-bind="directory-search"]')) {
            runtime.ui.directorySearch = target.value;
            invalidateSocialRenderCache({ center: true });
            renderSocialPageNow('directory-search');
            queueDirectoryRefresh();
        }

        return true;
    }

    function isSocialCommunityChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="directory-role"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialCommunityChange(target, runtime, event) {
        if (!isSocialCommunityChangeTarget(target)) return false;
        if (target.matches('[data-bind="directory-role"]')) {
            runtime.ui.directoryRole = text(target.value || 'all') || 'all';
            invalidateSocialRenderCache({ center: true });
            renderSocialPageNow('directory-role');
            queueDirectoryRefresh();
        }

        return true;
    }

    window.handleSocialCommunityInput = handleSocialCommunityInput;
    window.isSocialCommunityInputTarget = isSocialCommunityInputTarget;
    window.handleSocialCommunityChange = handleSocialCommunityChange;
    window.isSocialCommunityChangeTarget = isSocialCommunityChangeTarget;

})();
