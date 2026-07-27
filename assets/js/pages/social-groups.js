(function initSocialGroupsModule() {
    if (window.__KIU_SOCIAL_GROUPS_MODULE_LOADED) return;

    const hooks = window.__kiuSocialGroupsHooks || {};
    const {
        state,
        text,
        escape,
        isJoinedGroup,
        groupAvatar,
        controlId,
        currentUserId,
        displayName,
        roleLabel,
        accountById,
        avatar,
        accountSubtitle,
        facultyLabel,
        findSocialGroupById,
        activeDialog,
        activeChats,
        groupForChat,
        groupMessageAssets,
        groupNotificationPreference,
        fileUrl,
        isImage,
        presencePill,
        when,
        inviteEligibleGroups,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        setPortalSocialGroupMembership,
        respondPortalSocialGroupMembership,
        openPortalSocialGroupChat,
        setActiveChat,
        invalidateSocialRenderCache,
        reportPortalSocialContent,
        updatePortalSocialGroup,
        removePortalSocialGroupMember,
        searchGroupMessages,
        invitePortalSocialGroupMember,
        joinPortalGroupCall,
        leavePortalGroupCall,
        closeDialog,
        createPortalSocialGroup,
        readFileAsDataUrl,
        chatTitle
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof isJoinedGroup !== 'function'
        || typeof groupAvatar !== 'function'
        || typeof controlId !== 'function'
        || typeof currentUserId !== 'function'
        || typeof displayName !== 'function'
        || typeof roleLabel !== 'function'
        || typeof accountById !== 'function'
        || typeof avatar !== 'function'
        || typeof accountSubtitle !== 'function'
        || typeof facultyLabel !== 'function'
        || typeof findSocialGroupById !== 'function'
        || typeof activeDialog !== 'function'
        || typeof activeChats !== 'function'
        || typeof groupForChat !== 'function'
        || typeof groupMessageAssets !== 'function'
        || typeof groupNotificationPreference !== 'function'
        || typeof fileUrl !== 'function'
        || typeof isImage !== 'function'
        || typeof presencePill !== 'function'
        || typeof when !== 'function'
        || typeof inviteEligibleGroups !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof setPortalSocialGroupMembership !== 'function'
        || typeof respondPortalSocialGroupMembership !== 'function'
        || typeof openPortalSocialGroupChat !== 'function'
        || typeof setActiveChat !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof reportPortalSocialContent !== 'function'
        || typeof updatePortalSocialGroup !== 'function'
        || typeof removePortalSocialGroupMember !== 'function'
        || typeof searchGroupMessages !== 'function'
        || typeof invitePortalSocialGroupMember !== 'function'
        || typeof joinPortalGroupCall !== 'function'
        || typeof leavePortalGroupCall !== 'function'
        || typeof closeDialog !== 'function'
        || typeof createPortalSocialGroup !== 'function'
        || typeof readFileAsDataUrl !== 'function'
        || typeof chatTitle !== 'function'
    ) {
        throw new Error('Social groups hooks are unavailable.');
    }

    window.__KIU_SOCIAL_GROUPS_MODULE_LOADED = true;

    function chatNotificationPreference(chat) {
        try {
            return text(localStorage.getItem(`KIU_SOCIAL_CHAT_NOTIFY_${text(chat?.id)}`) || 'all') || 'all';
        } catch (error) {
            return 'all';
        }
    }

    function setChatNotificationPreference(chatId, value) {
        try {
            localStorage.setItem(`KIU_SOCIAL_CHAT_NOTIFY_${text(chatId)}`, text(value || 'all') || 'all');
        } catch (error) {}
    }

    function managedGroupsForDirectInvite(peerId) {
        const peer = text(peerId);
        if (!peer) return [];
        const groups = Array.isArray(state().social?.groups) ? state().social.groups : [];
        return groups.filter((group) => {
            if (!group?.isManager) return false;
            const memberIds = Array.isArray(group.memberIds) ? group.memberIds : [];
            const pendingIds = Array.isArray(group.pendingMemberIds) ? group.pendingMemberIds : [];
            return !memberIds.some((id) => text(id) === peer) && !pendingIds.some((id) => text(id) === peer);
        });
    }

    function renderGroupsHero(runtime, groups, activeTab, options = {}) {
        const { gridHtml = '' } = options;
        const merged = Boolean(gridHtml);
        const tabs = [
            { tab: 'discover', label: 'Discover', icon: 'fa-compass', helper: 'Browse open communities' },
            { tab: 'joined', label: 'Your groups', icon: 'fa-layer-group', helper: 'Rooms you belong to' },
        ];
        const createCta = `<div class="social-neo-groups-hero-actions">
                <button class="lux-primary-btn social-neo-groups-hero-create-btn" type="button" data-action="group-create-open">
                    <i class="fas fa-plus"></i> ${activeTab === 'joined' ? 'Create Another Group' : 'Create Group'}
                </button>
            </div>`;
        return `
            <section class="social-neo-card social-neo-groups-hero social-neo-community-panel social-neo-community-panel--groups${merged ? ' is-merged' : ''}">
                <div class="social-neo-groups-hero-head">
                    ${createCta}
                </div>
                <div class="social-neo-groups-hero-grid">
                    ${tabs.map((tab) => `
                        <button class="lux-secondary-btn social-neo-groups-hero-tab ${!tab.action && activeTab === tab.tab ? 'is-focused' : ''}" type="button" data-action="${escape(tab.action || 'panel-groups')}" ${tab.action ? '' : `data-groups-tab="${escape(tab.tab)}"`} aria-pressed="${!tab.action && activeTab === tab.tab ? 'true' : 'false'}">
                            <span class="social-neo-groups-hero-tab-icon"><i class="fas ${escape(tab.icon)}"></i></span>
                            <span class="social-neo-groups-hero-tab-copy">
                                <strong>${escape(tab.label)}</strong>
                                <small>${escape(tab.helper)}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
                ${merged ? `
                    <div class="social-neo-groups-hero-divider" aria-hidden="true"></div>
                    <div class="social-neo-groups-hub-body">
                        ${gridHtml}
                    </div>
                ` : ''}
            </section>
        `;
    }

    function renderGroupsPanel() {
        const runtime = state();
        const social = runtime.social || {};
        const groups = Array.isArray(social.groups) ? social.groups : [];
        const activeTab = text(runtime.ui?.groupsTab || 'discover');
        const joinedGroups = groups.filter(isJoinedGroup);
        const discoverGroups = groups;

        const renderGroupCard = (group) => {
            const pendingMembers = Array.isArray(group.pendingMemberIds) ? group.pendingMemberIds : [];
            const memberIds = Array.isArray(group.memberIds) ? group.memberIds : (Array.isArray(group.memberUserIds) ? group.memberUserIds : []);
            const pinnedCount = Array.isArray(group.pinnedPostIds) ? group.pinnedPostIds.length : 0;
            const description = text(group.description || '') || 'No description yet.';
            return `
                <article class="social-neo-card social-neo-group-card">
                    <div class="social-neo-group-card-header">
                        <div class="social-neo-group-card-icon social-neo-group-card-avatar">${groupAvatar(group)}</div>
                        <div class="social-neo-group-card-title">
                            <strong>${escape(text(group.name || 'Group'))}</strong>
                            <span class="social-neo-group-card-meta">
                                <span class="social-neo-pill">${escape(text(group.visibility || 'public'))}</span>
                                <span>${escape(group.memberCount || memberIds.length || 0)} members</span>
                            </span>
                        </div>
                    </div>
                    <p class="social-neo-group-card-desc">${escape(description)}</p>
                    <div class="social-neo-badge-row social-neo-group-card-badges">
                        ${group.isManager ? `<span class="social-neo-pill">Managed by you</span>` : ''}
                        ${pendingMembers.length ? `<span class="social-neo-pill">${escape(pendingMembers.length)} pending</span>` : ''}
                        ${pinnedCount ? `<span class="social-neo-pill">${escape(pinnedCount)} pinned</span>` : ''}
                    </div>
                    <div class="social-neo-group-card-actions">
                        <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="group-detail-open" data-group-id="${escape(text(group.id))}">
                            <i class="fas fa-circle-info"></i> View
                        </button>
                        ${group.membershipState === 'manager' || group.membershipState === 'member'
                            ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="group-chat" data-group-id="${escape(text(group.id))}"><i class="fas fa-comments"></i> Chat</button>`
                            : group.membershipState === 'pending'
                                ? `<span class="social-neo-pill">Pending</span>`
                                : `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="group-join" data-group-id="${escape(text(group.id))}">
                                    <i class="fas fa-plus"></i> ${text(group.visibility) === 'private' ? 'Request' : 'Join'}
                                  </button>`
                        }
                    </div>
                </article>
            `;
        };

        const discoverView = `
            <div class="social-neo-groups-grid">
                ${discoverGroups.length ? discoverGroups.map(renderGroupCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-layer-group"></i>
                        <strong>No groups yet</strong>
                        <span>Create the first group to start a campus community.</span>
                        <div class="lux-glass-dialog-form-actions lux-glass-dialog-form-actions-mt-14">
                            <button class="lux-primary-btn" type="button" data-action="group-create-open">
                                <i class="fas fa-plus-circle"></i> Create Group
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;

        const joinedView = `
            <div class="social-neo-groups-grid">
                ${joinedGroups.length ? joinedGroups.map(renderGroupCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-door-open"></i>
                        <strong>You haven't joined any groups</strong>
                        <span>Discover groups and join conversations.</span>
                        <div class="lux-glass-dialog-form-actions lux-glass-dialog-form-actions-mt-14">
                            <button class="lux-primary-btn" type="button" data-action="group-create-open">
                                <i class="fas fa-plus-circle"></i> Create Group Instead
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;

        const contentView = activeTab === 'joined' ? joinedView : discoverView;
        return `
            <div class="social-neo-stack social-neo-groups-shell social-neo-groups-shell--merged">
                ${renderGroupsHero(runtime, groups, activeTab, { gridHtml: contentView })}
            </div>
        `;
    }

    function buildGroupCreateInviteContext(runtime) {
        const groupNameId = controlId('groupName');
        const groupDescriptionId = controlId('groupDescription');
        const groupVisibilityId = controlId('groupVisibility');
        const groupMaxMembersId = controlId('groupMaxMembers');
        const memberSearchId = controlId('groupMemberSearch');
        const memberFacultyId = controlId('groupMemberFaculty');
        const selectedMemberIds = Array.isArray(runtime.ui?.groupInviteSelectedIds) ? runtime.ui.groupInviteSelectedIds.map((item) => text(item)).filter(Boolean) : [];
        const memberSearch = text(runtime.ui?.groupInviteSearch || '').trim().toLowerCase();
        const facultyFilter = text(runtime.ui?.groupInviteFaculty || 'all') || 'all';
        const allAccounts = Object.values(runtime.accountsById || {})
            .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
            .sort((left, right) => displayName(left).localeCompare(displayName(right)));
        const facultyOptions = ['all', ...new Set(allAccounts
            .map((account) => text(account?.facultyCode || account?.faculty || ''))
            .filter(Boolean)
            .sort())];
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
                roleLabel(account?.role)
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
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="group-creator-member-remove" data-user-id="${escape(text(memberId))}">
                            <i class="fas fa-xmark"></i> Remove
                        </button>
                    </div>
                `;
            }).join('')
            : '<p class="lux-glass-dialog-hint">No invited members selected yet.</p>';
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
                    <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="group-creator-member-add" data-user-id="${escape(text(account.id))}">
                        <i class="fas fa-user-plus"></i> Invite
                    </button>
                </article>
            `).join('')
            : `<p class="lux-glass-dialog-hint">${memberSearch || facultyFilter !== 'all' ? 'No people match the current search or faculty filter.' : 'Start typing or choose a faculty to find people.'}</p>`;
        return {
            groupNameId,
            groupDescriptionId,
            groupVisibilityId,
            groupMaxMembersId,
            memberSearchId,
            memberFacultyId,
            selectedMemberIds,
            candidateAccounts,
            facultyOptions,
            facultyFilter,
            memberSearch,
            selectedMembersMarkup,
            searchResultsMarkup
        };
    }
    function renderGroupCreateInviteSection(runtime, inviteContext) {
        const ctx = inviteContext || buildGroupCreateInviteContext(runtime);
        return `
            <section class="lux-glass-dialog-group-section lux-glass-dialog-group-section--invite">
                <div class="lux-glass-dialog-group-section-head">
                    <strong>Invite members</strong>
                    <span>Optional. Search by name, faculty, or role. Invitations send after the group is created.</span>
                </div>
                <div class="lux-glass-dialog-invite-toolbar">
                    <label class="lux-glass-dialog-field lux-glass-dialog-invite-search-field" for="${escape(ctx.memberSearchId)}">
                        <span class="social-neo-label">Search people</span>
                        <input class="social-neo-input lux-control" id="${escape(ctx.memberSearchId)}" type="search" name="groupMemberSearch" placeholder="Search people to invite..." value="${escape(text(runtime.ui?.groupInviteSearch || ''))}">
                    </label>
                    <label class="lux-glass-dialog-field lux-glass-dialog-invite-faculty-field" for="${escape(ctx.memberFacultyId)}">
                        <span class="social-neo-label">Faculty</span>
                        <select class="social-neo-select lux-control" id="${escape(ctx.memberFacultyId)}" name="groupMemberFaculty" data-lux-picker>
                            ${ctx.facultyOptions.map((faculty) => `<option value="${escape(faculty)}" ${ctx.facultyFilter === faculty ? 'selected' : ''}>${escape(faculty === 'all' ? 'All faculties' : facultyLabel(faculty))}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div class="lux-glass-dialog-invite-columns">
                    <article class="lux-glass-dialog-invite-block">
                        <div class="lux-glass-dialog-invite-block-head">
                            <strong>Selected members</strong>
                            <span>${escape(ctx.selectedMemberIds.length)} invitation${ctx.selectedMemberIds.length === 1 ? '' : 's'} queued.</span>
                        </div>
                        <div class="social-neo-list lux-glass-dialog-invite-list">${ctx.selectedMembersMarkup}</div>
                    </article>
                    <article class="lux-glass-dialog-invite-block">
                        <div class="lux-glass-dialog-invite-block-head">
                            <strong>Search results</strong>
                            <span>${escape(ctx.candidateAccounts.length)} people available.</span>
                        </div>
                        <div class="social-neo-list lux-glass-dialog-invite-list">${ctx.searchResultsMarkup}</div>
                    </article>
                </div>
            </section>
        `;
    }
    function renderGroupCreateDialog(runtime) {
        const ctx = buildGroupCreateInviteContext(runtime);
        const inviteCount = ctx.selectedMemberIds.length;
        const inviteBadge = inviteCount > 0
            ? `<span class="lux-glass-dialog-submit-badge">${escape(String(inviteCount))}</span>`
            : '';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--group-create lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-form="create-group" data-action="noop" data-lux-transparency-exempt="1">
                ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Create group', 'Name your group, set visibility, invite members, then open the group workspace.', { icon: 'fas fa-layer-group' }) : ''}
                <div class="lux-glass-dialog-body lux-glass-dialog-body--group-create">
                    <section class="lux-glass-dialog-group-section">
                        <div class="lux-glass-dialog-group-section-head">
                            <strong>Group details</strong>
                            <span>Name, visibility, and member limits.</span>
                        </div>
                        <label class="lux-glass-dialog-field" for="${escape(ctx.groupNameId)}">
                            <span class="social-neo-label">Group name</span>
                            <input class="social-neo-input lux-control" id="${escape(ctx.groupNameId)}" type="text" name="groupName" placeholder="e.g. MATH 201 Study Circle" value="${escape(text(runtime.ui?.groupName || ''))}" required>
                        </label>
                        <label class="lux-glass-dialog-field" for="${escape(ctx.groupDescriptionId)}">
                            <span class="social-neo-label">Description</span>
                            <textarea class="social-neo-textarea lux-control" id="${escape(ctx.groupDescriptionId)}" rows="3" name="groupDescription" placeholder="What will members collaborate on?">${escape(text(runtime.ui?.groupDescription || ''))}</textarea>
                        </label>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="lux-glass-dialog-field" for="${escape(ctx.groupVisibilityId)}">
                                <span class="social-neo-label">Visibility</span>
                                <select class="social-neo-select lux-control" id="${escape(ctx.groupVisibilityId)}" name="groupVisibility" data-lux-picker>
                                    <option value="public" ${text(runtime.ui?.groupVisibility || 'public') === 'public' ? 'selected' : ''}>Public - Anyone can join</option>
                                    <option value="private" ${text(runtime.ui?.groupVisibility) === 'private' ? 'selected' : ''}>Private - Approval required</option>
                                </select>
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(ctx.groupMaxMembersId)}">
                                <span class="social-neo-label">Max members</span>
                                <input class="social-neo-input lux-control" id="${escape(ctx.groupMaxMembersId)}" type="number" name="groupMaxMembers" min="2" max="100" placeholder="No limit" value="${escape(text(runtime.ui?.groupMaxMembers || ''))}">
                            </label>
                        </div>
                        <input type="hidden" name="groupType" value="standard">
                    </section>
                    ${renderGroupCreateInviteSection(runtime, ctx)}
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit"><i class="fas fa-layer-group"></i> Create Group${inviteBadge}</button>
                </div>
            </form>
        </div>`;
    }
    function renderGroupDetailMemberLine(group, memberId) {
        const account = accountById(memberId) || { id: memberId };
        return `
            <div class="social-neo-item-line">
                <span>${escape(displayName(account))}</span>
                ${group.isManager && text(memberId) !== currentUserId() ? `
                    <button class="lux-ghost-btn" type="button" data-action="group-member-remove" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Remove</button>
                ` : ''}
            </div>
        `;
    }

    /*
     * Group detail popup wireframe
     * +--------------------------------------------------+
     * | [av] Name                              [x]       |
     * | private · N members · role                       |
     * +--------------------------------------------------+
     * | About                                            |
     * | full description (wraps / scrolls)               |
     * +--------------------------------------------------+
     * | Members · Pinned · Pending (mgr) · Visibility    |
     * +--------------------------------------------------+
     * | [Chat/Join] [Leave] [Report] [Close]             |
     * +--------------------------------------------------+
     */    function renderGroupDetailDialog(runtime, dialog = activeDialog()) {
        const group = findSocialGroupById(dialog?.groupId);
        if (!group) return '';
        const pendingMembers = Array.isArray(group.pendingMemberIds) ? group.pendingMemberIds : [];
        const memberIds = Array.isArray(group.memberIds)
            ? group.memberIds
            : (Array.isArray(group.memberUserIds) ? group.memberUserIds : []);
        const pinnedCount = Array.isArray(group.pinnedPostIds) ? group.pinnedPostIds.length : 0;
        const visibility = text(group.visibility || 'public') || 'public';
        const memberCount = Number(group.memberCount || memberIds.length || 0);
        const roleLabel = group.isManager
            ? 'Managed by you'
            : (group.membershipState === 'member' ? 'Member' : group.membershipState === 'pending' ? 'Request pending' : 'Not a member');
        const description = text(group.description || '') || 'No description yet.';
        const primaryAction = group.membershipState === 'manager' || group.membershipState === 'member'
            ? `<button class="lux-primary-btn" type="button" data-action="group-chat" data-group-id="${escape(text(group.id))}"><i class="fas fa-comments"></i> Open chat</button>
               <button class="lux-secondary-btn" type="button" data-action="group-leave-open" data-group-id="${escape(text(group.id))}"><i class="fas fa-sign-out-alt"></i> Leave</button>`
            : group.membershipState === 'pending'
                ? `<span class="social-neo-pill">Request pending</span>`
                : `<button class="lux-primary-btn" type="button" data-action="group-join" data-group-id="${escape(text(group.id))}">
                    <i class="fas fa-plus"></i> ${visibility === 'private' ? 'Request to join' : 'Join group'}
                  </button>`;
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="${escape(text(group.name || 'Group'))}">
            <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--group-detail lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1" data-group-id="${escape(text(group.id))}">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head social-neo-group-detail-head">
                    <div class="social-neo-group-detail-identity">
                        <div class="social-neo-group-card-avatar social-neo-group-detail-avatar">${groupAvatar(group)}</div>
                        <div class="lux-glass-dialog-heading">
                            <strong class="lux-glass-dialog-title">${escape(text(group.name || 'Group'))}</strong>
                            <span class="lux-glass-dialog-subtitle social-neo-group-detail-meta">
                                <span class="social-neo-pill">${escape(visibility)}</span>
                                <span>${escape(String(memberCount))} members</span>
                                <span class="social-neo-pill">${escape(roleLabel)}</span>
                            </span>
                        </div>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body lux-glass-dialog-body--group-detail">
                    <section class="lux-glass-dialog-group-section social-neo-group-detail-section">
                        <div class="lux-glass-dialog-group-section-head">
                            <strong>About</strong>
                            <span>Group description and purpose.</span>
                        </div>
                        <p class="social-neo-group-detail-desc">${escape(description)}</p>
                    </section>
                    <section class="lux-glass-dialog-group-section social-neo-group-detail-section">
                        <div class="lux-glass-dialog-group-section-head">
                            <strong>Members</strong>
                            <span>${escape(String(memberIds.length || memberCount))} active members.</span>
                        </div>
                        <div class="social-neo-list social-neo-group-detail-list">
                            ${memberIds.length
                                ? memberIds.map((memberId) => renderGroupDetailMemberLine(group, memberId)).join('')
                                : '<p class="lux-glass-dialog-hint">No members yet.</p>'}
                        </div>
                    </section>
                    <section class="lux-glass-dialog-group-section social-neo-group-detail-section">
                        <div class="lux-glass-dialog-group-section-head">
                            <strong>Pinned resources</strong>
                            <span>${escape(String(pinnedCount))} pinned updates in this group feed.</span>
                        </div>
                    </section>
                    ${group.isManager ? `
                    <section class="lux-glass-dialog-group-section social-neo-group-detail-section">
                        <div class="lux-glass-dialog-group-section-head">
                            <strong>Manager tools</strong>
                            <span>Visibility and join requests.</span>
                        </div>
                        <div class="social-neo-badge-row">
                            <button class="lux-secondary-btn lux-secondary-btn-sm ${visibility === 'public' ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="group-visibility-set" data-group-id="${escape(text(group.id))}" data-visibility="public">Public</button>
                            <button class="lux-secondary-btn lux-secondary-btn-sm ${visibility === 'private' ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="group-visibility-set" data-group-id="${escape(text(group.id))}" data-visibility="private">Private</button>
                        </div>
                        ${pendingMembers.length ? `
                        <div class="social-neo-group-detail-pending">
                            <span class="social-neo-label">${escape(String(pendingMembers.length))} pending requests</span>
                            <div class="social-neo-list social-neo-group-detail-list">
                                ${pendingMembers.map((memberId) => {
                                    const account = accountById(memberId) || { id: memberId };
                                    return `
                                        <div class="social-neo-item-line">
                                            <span>${escape(displayName(account))}</span>
                                            <div class="social-neo-inline">
                                                <button class="lux-ghost-btn" type="button" data-action="group-approve" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Approve</button>
                                                <button class="lux-ghost-btn" type="button" data-action="group-decline" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Decline</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        ` : '<p class="lux-glass-dialog-hint">No pending join requests.</p>'}
                    </section>
                    ` : ''}
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions social-neo-group-detail-actions">
                    ${primaryAction}
                    <button class="lux-secondary-btn" type="button" data-action="group-report" data-group-id="${escape(text(group.id))}"><i class="fas fa-flag"></i> Report</button>
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Close</button>
                </div>
            </div>
        </div>`;
    }
    function normalizeGroupLeaveToken(value) {
        return String(value || '').trim().toUpperCase();
    }
    function buildGroupLeaveVerification(groupItem) {
        const displayName = String(groupItem?.name || 'GROUP').trim();
        return {
            displayName,
            expectedToken: normalizeGroupLeaveToken(displayName),
        };
    }
    function renderGroupLeaveDialog(groupItem) {
        const leaveStep = Math.min(3, Math.max(1, Number(state().ui?.groupLeaveStep || 1) || 1));
        const verification = buildGroupLeaveVerification(groupItem);
        const currentId = currentUserId();
        const isOwner = text(groupItem.ownerUserId || '') === currentId;
        const memberIds = Array.isArray(groupItem.memberIds) ? groupItem.memberIds.map((item) => text(item)).filter(Boolean) : [];
        const joinMap = groupItem.joinedAtByUser && typeof groupItem.joinedAtByUser === 'object' ? groupItem.joinedAtByUser : {};
        const remainingMembers = memberIds.filter((memberId) => memberId && memberId !== currentId);
        const remainingOrder = [...remainingMembers];
        remainingMembers.sort((left, right) => {
            const leftTime = text(joinMap[left] || '');
            const rightTime = text(joinMap[right] || '');
            const leftMs = Number.isFinite(Date.parse(leftTime)) ? Date.parse(leftTime) : Number.MAX_SAFE_INTEGER;
            const rightMs = Number.isFinite(Date.parse(rightTime)) ? Date.parse(rightTime) : Number.MAX_SAFE_INTEGER;
            if (leftMs !== rightMs) return leftMs - rightMs;
            return remainingOrder.indexOf(left) - remainingOrder.indexOf(right);
        });
        const nextOwnerId = isOwner ? text(remainingMembers[0] || '') : '';
        const nextOwnerName = nextOwnerId ? displayName(accountById(nextOwnerId) || { id: nextOwnerId, displayName: nextOwnerId }) : '';
        const impactCopy = isOwner
            ? (nextOwnerId
                ? `You created this group. When you leave, ownership moves to ${escape(nextOwnerName || 'the next member')} and the group stays active.`
                : 'You created this group. If you leave now, the group stays alive without an owner until someone else joins and takes it over.')
            : 'Chat history, posts, and files stay in the group. Only your membership is removed.';
        const stepBody = leaveStep === 1
            ? `<div class="lux-glass-dialog-preview">
                    <strong class="lux-glass-dialog-preview-title">${escape(text(groupItem.name || 'Group'))}</strong>
                    <div class="social-neo-muted social-neo-muted-mt-6">${escape(`${groupItem.memberCount || 0} members`)}</div>
                </div>
                <div class="lux-glass-dialog-preview">
                    You will lose access to the group chat and updates until you join again.
                </div>`
            : leaveStep === 2
                ? `<div class="lux-glass-dialog-preview ${isOwner ? 'lux-glass-dialog-preview-danger' : ''}">
                    ${impactCopy}
                </div>`
                : `<label class="social-neo-label" for="groupLeaveToken">Step 3 of 3: Type ${escape(verification.expectedToken)} to confirm leaving.</label>
                <input class="social-neo-input lux-control" id="groupLeaveToken" name="groupLeaveToken" type="text" autocomplete="off" placeholder="${escape(verification.displayName)}">`;
        const actions = leaveStep < 3
            ? `<button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="${leaveStep === 1 ? 'dialog-close' : 'group-leave-wizard-prev'}">${leaveStep === 1 ? 'Cancel' : 'Back'}</button>
               <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="button" data-action="group-leave-wizard-next">Next</button>`
            : `<button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="group-leave-wizard-prev">Back</button>
               <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit">Leave group</button>`;
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card" data-form="dialog-group-leave" data-action="noop">
                ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Leave group', 'Complete all three verification steps before leaving.') : ''}
                <div class="social-neo-pages-wizard-steps lux-glass-dialog-group-leave-steps">
                    ${[
                        ['1', 'Review'],
                        ['2', 'Impact'],
                        ['3', 'Confirm'],
                    ].map(([value, label]) => `
                        <span class="social-neo-pages-wizard-step ${Number(value) === leaveStep ? 'is-active' : Number(value) < leaveStep ? 'is-complete' : ''}">
                            <strong>${escape(value)}</strong>
                            <span>${escape(label)}</span>
                        </span>
                    `).join('')}
                </div>
                ${stepBody}
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    ${actions}
                </div>
                <input type="hidden" name="groupId" value="${escape(text(groupItem.id))}">
                <input type="hidden" name="groupChatId" value="${escape(text(groupItem.chatId || ''))}">
                <input type="hidden" name="expectedLeaveToken" value="${escape(verification.expectedToken)}">
            </form>
        </div>`;
    }

    const GROUP_OWNED_DIALOG_KINDS = new Set([
        'group-create',
        'group-detail',
        'group-invite',
        'group-leave',
        'group-panel-media',
        'group-panel-members',
        'group-panel-files',
        'group-panel-links',
        'group-panel-invite',
        'group-panel-settings'
    ]);

    function renderGroupOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!GROUP_OWNED_DIALOG_KINDS.has(kind)) return '';
        if (kind === 'group-create') {
            return renderGroupCreateDialog(runtime || state());
        }
        if (kind === 'group-detail') {
            return renderGroupDetailDialog(runtime || state(), dialog);
        }
        if (kind === 'group-leave') {
            const groupItem = (Array.isArray(state().social?.groups) ? state().social.groups : [])
                .find((item) => text(item.id) === text(dialog.groupId));
            if (!groupItem) return '';
            return renderGroupLeaveDialog(groupItem);
        }
        if (kind === 'group-invite') {
            const groups = inviteEligibleGroups();
            const targetAccount = accountById(dialog.targetUserId) || {
                id: text(dialog.targetUserId || ''),
                displayName: text(dialog.targetUserName || 'this member'),
            };
            const inviteGroupId = controlId('invite-group');
            const inviteNoteId = controlId('invite-note');
            const groupField = groups.length
                ? `<select class="social-neo-select lux-control" id="${escape(inviteGroupId)}" name="inviteGroupId" data-lux-picker>
                        ${groups.map((group) => `<option value="${escape(text(group.id))}" ${text(dialog.groupId || '') === text(group.id) ? 'selected' : ''}>${escape(text(group.name || 'Group'))}</option>`).join('')}
                    </select>`
                : `<div class="social-neo-empty">You are not in any groups you can invite from yet.</div>`;
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card lux-glass-dialog-card--compact lux-glass-dialog-card--form" data-form="dialog-group-invite" data-action="noop">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Invite to group', 'They will get a notification and can accept or decline.', { icon: 'fas fa-envelope-open-text' }) : ''}
                    <div class="lux-glass-dialog-preview lux-glass-dialog-recipient-preview">
                        <div class="social-neo-person social-neo-person-start-gap-12">
                            ${avatar(targetAccount, 'social-neo-avatar-sm')}
                            <div>
                                <strong class="lux-glass-dialog-preview-title">${escape(displayName(targetAccount))}</strong>
                                <div class="social-neo-muted social-neo-muted-mt-6">${escape(accountSubtitle(targetAccount))}</div>
                            </div>
                        </div>
                    </div>
                    <div class="lux-glass-dialog-body">
                        <label class="lux-glass-dialog-field"${groups.length ? ` for="${escape(inviteGroupId)}"` : ''}>
                            <span class="social-neo-label">Group</span>
                            ${groupField}
                            <span class="social-neo-muted social-neo-muted-mt-6">Only groups where you are a member or manager.</span>
                        </label>
                        <label class="lux-glass-dialog-field" for="${escape(inviteNoteId)}">
                            <span class="social-neo-label">Personal message <span class="social-neo-muted">(optional)</span></span>
                            <textarea class="social-neo-textarea lux-control" id="${escape(inviteNoteId)}" name="inviteNote" rows="4" placeholder="Want to join our study group this week?">${escape(text(dialog.note || ''))}</textarea>
                        </label>
                    </div>
                    <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                        <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit" ${groups.length ? '' : 'disabled'}><i class="fas fa-paper-plane" aria-hidden="true"></i> Send invite</button>
                    </div>
                    <input type="hidden" name="targetUserId" value="${escape(text(dialog.targetUserId || ''))}">
                </form>
            </div>`;
        }
        if (kind === 'group-panel-media' || kind === 'group-panel-members' || kind === 'group-panel-files' || kind === 'group-panel-links' || kind === 'group-panel-invite' || kind === 'group-panel-settings') {
            const panelChat = activeChats().find((c) => text(c.id) === text(dialog.chatId));
            const panelGroup = panelChat ? groupForChat(panelChat) : null;
            if (!panelChat) return '';
            const isDirectThread = !panelGroup;
            const panelMemberIds = isDirectThread
                ? (Array.isArray(panelChat.members) ? panelChat.members : [])
                : (Array.isArray(panelGroup.memberIds) ? panelGroup.memberIds : []);
            const panelPendingIds = isDirectThread ? [] : (Array.isArray(panelGroup.pendingMemberIds) ? panelGroup.pendingMemberIds : []);
            const panelAssets = groupMessageAssets(panelChat);
            const panelIsAdmin = isDirectThread ? false : Boolean(panelGroup.isManager);
            const panelCurrentUserId = currentUserId();
            const panelTitle = text(panelGroup?.name || chatTitle(panelChat) || 'Conversation');
            const panelPeerId = isDirectThread
                ? panelMemberIds.find((memberId) => text(memberId) !== panelCurrentUserId) || ''
                : '';
            const panelPeer = panelPeerId ? (accountById(panelPeerId) || { id: panelPeerId }) : null;
            const panelShellOpen = (extraClass = '') => `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                    <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--panel lux-glass-dialog-card lux-glass-dialog-card--social-glass${extraClass ? ` ${extraClass}` : ''}" data-action="noop" data-lux-transparency-exempt="1">`;
            const panelShellClose = `</div>
                </div>`;
            const panelHeroHead = (kicker, title, subtitle) => `<div class="lux-glass-dialog-head social-neo-surveys-hero-head">
                        <div class="social-neo-surveys-hero-copy">
                            <span class="social-neo-section-kicker">${kicker}</span>
                            <h2>${title}</h2>
                            <p>${subtitle}</p>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>`;
            const panelStat = (value, label) => `<article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card"><strong>${value}</strong><span>${label}</span></article>`;
            const formatBytes = (bytes) => {
                const n = Number(bytes || 0);
                if (!n) return '';
                if (n < 1024) return `${n} B`;
                if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
                return `${(n / 1048576).toFixed(1)} MB`;
            };
            if (kind === 'group-panel-media') {
                const mediaCount = panelAssets.media.length;
                const mediaContextLabel = isDirectThread ? 'Conversation' : 'Group';
                const mediaRoleLabel = isDirectThread ? 'Direct' : (panelIsAdmin ? 'Admin' : 'Member');
                return `${panelShellOpen('lux-glass-dialog-card--panel-media')}
                    ${panelHeroHead('Shared media', 'Photos &amp; images', `Media shared in ${escape(panelTitle)}. Tap an item to jump to the message.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(mediaCount)), 'Images')}
                            ${panelStat(escape(panelTitle), mediaContextLabel)}
                            ${panelStat(mediaRoleLabel, 'Your role')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Gallery</strong>
                                <span>${mediaCount ? 'Images shared in this thread.' : 'Nothing shared yet.'}</span>
                            </div>
                            ${mediaCount ? `<div class="lux-glass-dialog-media-grid">${panelAssets.media.map((entry) => {
                            const src = fileUrl(entry.file);
                            const sender = accountById(entry.senderId) || { id: entry.senderId };
                            return `<div class="lux-glass-dialog-media-thumb" data-action="group-thread-search-open" data-chat-id="${escape(text(panelChat.id))}" data-message-id="${escape(text(entry.message?.id || ''))}">
                                ${src ? `<img src="${escape(src)}" alt="${escape(text(entry.file?.name || 'Image'))}">` : '<div class="lux-glass-dialog-media-placeholder"><i class="fas fa-image"></i></div>'}
                                <div class="lux-glass-dialog-media-meta"><span>${escape(displayName(sender))}</span><span>${escape(when(entry.sentAt))}</span></div>
                            </div>`;
                        }).join('')}</div>` : '<div class="social-neo-empty">No shared media yet.</div>'}
                        </section>
                    </div>
                ${panelShellClose}`;
            }
            if (kind === 'group-panel-members') {
                const membersHero = isDirectThread
                    ? panelHeroHead('Conversation members', 'Members', `People in this direct conversation with ${escape(panelTitle)}.`)
                    : panelHeroHead('Group members', 'Members', `People in ${escape(panelTitle)}. View profiles, message, or manage join requests.`);
                const membersSubtitle = isDirectThread
                    ? `${escape(String(panelMemberIds.length))} people in this conversation.`
                    : `${escape(String(panelMemberIds.length))} people currently in this group.`;
                return `${panelShellOpen('lux-glass-dialog-card--panel-members')}
                    ${membersHero}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(panelMemberIds.length)), 'Active')}
                            ${panelStat(escape(String(panelPendingIds.length)), 'Pending')}
                            ${panelStat(isDirectThread ? 'Direct' : (panelIsAdmin ? 'Admin' : 'Member'), 'Your role')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>${isDirectThread ? 'Participants' : 'Active members'}</strong>
                                <span>${membersSubtitle}</span>
                            </div>
                            <div class="lux-glass-dialog-member-list">
                            ${panelMemberIds.map((memberId) => {
                                const member = accountById(memberId) || { id: memberId };
                                const isSelf = text(memberId) === panelCurrentUserId;
                                const isAdmin = !isDirectThread && (text(panelGroup.createdBy) === text(memberId) || text(memberId) === text(panelGroup.managerId || ''));
                                return `<div class="lux-glass-dialog-member-row">
                                    <div class="social-neo-person">
                                        ${avatar(member, 'social-neo-avatar-sm')}
                                        <div class="lux-glass-dialog-member-info">
                                            <strong>${escape(displayName(member))}${isSelf ? ' <span class="social-neo-pill">You</span>' : ''}${isAdmin ? ' <span class="social-neo-pill social-neo-pill-accent">Admin</span>' : ''}</strong>
                                            <span>${escape(accountSubtitle(member))}</span>
                                        </div>
                                    </div>
                                    <div class="social-neo-inline social-neo-inline-gap-6-wrap">
                                        ${presencePill(member)}
                                        <button class="lux-ghost-btn" type="button" data-action="profile-view" data-user-id="${escape(text(memberId))}">Profile</button>
                                        ${!isSelf ? `<button class="lux-ghost-btn" type="button" data-action="directory-message" data-user-id="${escape(text(memberId))}">Message</button>` : ''}
                                        ${panelIsAdmin && !isSelf ? `<button class="lux-ghost-btn lux-ghost-btn lux-btn-danger" type="button" data-action="group-member-remove" data-group-id="${escape(text(panelGroup.id))}" data-member-id="${escape(text(memberId))}">Kick</button>` : ''}
                                    </div>
                                </div>`;
                            }).join('') || '<div class="social-neo-empty">No members found.</div>'}
                            </div>
                        </section>
                        ${!isDirectThread && panelIsAdmin ? `<section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section lux-glass-dialog-member-pending">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Pending requests</strong>
                                <span>${escape(String(panelPendingIds.length))} waiting for approval.</span>
                            </div>
                            ${panelPendingIds.length ? panelPendingIds.map((memberId) => {
                                const member = accountById(memberId) || { id: memberId };
                                return `<div class="lux-glass-dialog-member-row">
                                    <div class="social-neo-person">
                                        ${avatar(member, 'social-neo-avatar-sm')}
                                        <div class="lux-glass-dialog-member-info">
                                            <strong>${escape(displayName(member))}</strong>
                                            <span>${escape(accountSubtitle(member))}</span>
                                        </div>
                                    </div>
                                    <div class="social-neo-inline social-neo-inline-gap-6-wrap">
                                        <button class="lux-ghost-btn" type="button" data-action="group-approve" data-group-id="${escape(text(panelGroup.id))}" data-member-id="${escape(text(memberId))}">Approve</button>
                                        <button class="lux-ghost-btn" type="button" data-action="group-decline" data-group-id="${escape(text(panelGroup.id))}" data-member-id="${escape(text(memberId))}">Decline</button>
                                    </div>
                                </div>`;
                            }).join('') : '<div class="social-neo-empty">No pending requests.</div>'}
                        </section>` : ''}
                    </div>
                ${panelShellClose}`;
            }
            if (kind === 'group-panel-files') {
                const fileFilter = text(runtime.ui?.groupPanelFileFilter?.[text(dialog.chatId)] || 'all');
                const filteredFiles = panelAssets.files.filter((entry) => {
                    if (fileFilter === 'all') return true;
                    const ext = text(entry.file?.name || '').split('.').pop().toLowerCase();
                    const type = text(entry.file?.type || '').toLowerCase();
                    if (fileFilter === 'documents') return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext) || type.includes('document') || type.includes('text') || type.includes('spreadsheet') || type.includes('presentation');
                    if (fileFilter === 'images') return isImage(entry.file);
                    return !['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext) && !isImage(entry.file);
                });
                const fileIcon = (entry) => {
                    const ext = text(entry.file?.name || '').split('.').pop().toLowerCase();
                    if (['pdf'].includes(ext)) return 'fa-file-pdf';
                    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'fa-file-word';
                    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'fa-file-excel';
                    if (['ppt', 'pptx'].includes(ext)) return 'fa-file-powerpoint';
                    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'fa-file-zipper';
                    if (isImage(entry.file)) return 'fa-file-image';
                    return 'fa-file';
                };
                return `${panelShellOpen('lux-glass-dialog-card--panel-files')}
                    ${panelHeroHead('Shared files', 'Files', `Documents and attachments in ${escape(panelTitle)}.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(panelAssets.files.length)), 'Total')}
                            ${panelStat(escape(String(filteredFiles.length)), 'Showing')}
                            ${panelStat(escape(fileFilter === 'all' ? 'All types' : fileFilter.charAt(0).toUpperCase() + fileFilter.slice(1)), 'Filter')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>File library</strong>
                                <span>Filter and open attachments from this chat.</span>
                            </div>
                            <div class="social-neo-inline social-neo-inline-gap-6-wrap social-neo-panel-filter-row">
                            ${['all', 'documents', 'images', 'other'].map((f) => `<button class="social-neo-chip ${fileFilter === f ? 'is-active' : ''}" type="button" data-action="group-panel-file-filter" data-chat-id="${escape(text(dialog.chatId))}" data-filter="${escape(f)}">${escape(f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1))}</button>`).join('')}
                            </div>
                            ${filteredFiles.length ? `<div class="lux-glass-dialog-file-list">${filteredFiles.map((entry) => {
                            const name = text(entry.file?.name || 'File');
                            const href = fileUrl(entry.file);
                            const sender = accountById(entry.senderId) || { id: entry.senderId };
                            const size = formatBytes(entry.file?.size);
                            return `<div class="lux-glass-dialog-file-row">
                                <div class="lux-glass-dialog-file-icon" aria-hidden="true"><i class="fas ${fileIcon(entry)}"></i></div>
                                <div class="lux-glass-dialog-file-info">
                                    <strong>${escape(name)}</strong>
                                    <span>${escape(displayName(sender))}${size ? ` · ${escape(size)}` : ''} · ${escape(when(entry.sentAt))}</span>
                                </div>
                                <div class="social-neo-inline social-neo-inline-gap-6-wrap">
                                    ${href ? `<a class="lux-ghost-btn" href="${escape(href)}" target="_blank" rel="noopener">Open</a>` : ''}
                                    <button class="lux-ghost-btn" type="button" data-action="group-thread-search-open" data-chat-id="${escape(text(panelChat.id))}" data-message-id="${escape(text(entry.message?.id || ''))}">Jump</button>
                                </div>
                            </div>`;
                        }).join('')}</div>` : '<div class="social-neo-empty">No files match this filter.</div>'}
                        </section>
                    </div>
                ${panelShellClose}`;
            }
            if (kind === 'group-panel-links') {
                const linkCount = panelAssets.links.length;
                const linksContextLabel = isDirectThread ? 'Conversation' : 'Group';
                const linksRoleLabel = isDirectThread ? 'Direct' : (panelIsAdmin ? 'Admin' : 'Member');
                return `${panelShellOpen('lux-glass-dialog-card--panel-links')}
                    ${panelHeroHead('Shared links', 'Links', `URLs shared in ${escape(panelTitle)}.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(linkCount)), 'Links')}
                            ${panelStat(escape(panelTitle), linksContextLabel)}
                            ${panelStat(linksRoleLabel, 'Your role')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Link list</strong>
                                <span>${linkCount ? 'Open a link or jump to the original message.' : 'No links have been shared yet.'}</span>
                            </div>
                            ${linkCount ? `<div class="lux-glass-dialog-link-list">${panelAssets.links.map((entry) => {
                            const url = text(entry.url || entry.href || '');
                            const sender = accountById(entry.senderId) || { id: entry.senderId };
                            return `<div class="lux-glass-dialog-link-row">
                                <div class="lux-glass-dialog-link-icon" aria-hidden="true"><i class="fas fa-link"></i></div>
                                <div class="lux-glass-dialog-link-info">
                                    <strong>${escape(text(entry.title || url || 'Link'))}</strong>
                                    <span>${escape(displayName(sender))} · ${escape(when(entry.sentAt))}</span>
                                    ${url ? `<a class="social-neo-muted lux-glass-dialog-link-url" href="${escape(url)}" target="_blank" rel="noopener">${escape(url)}</a>` : ''}
                                </div>
                                <div class="social-neo-inline social-neo-inline-gap-6-wrap">
                                    ${url ? `<a class="lux-ghost-btn" href="${escape(url)}" target="_blank" rel="noopener">Open</a>` : ''}
                                    <button class="lux-ghost-btn" type="button" data-action="group-thread-search-open" data-chat-id="${escape(text(panelChat.id))}" data-message-id="${escape(text(entry.message?.id || ''))}">Jump</button>
                                </div>
                            </div>`;
                        }).join('')}</div>` : '<div class="social-neo-empty">No shared links yet.</div>'}
                        </section>
                    </div>
                ${panelShellClose}`;
            }
            if (kind === 'group-panel-invite') {
                if (isDirectThread) {
                    const inviteGroups = managedGroupsForDirectInvite(panelPeerId);
                    const peerName = panelPeer ? displayName(panelPeer) : panelTitle;
                    return `${panelShellOpen('lux-glass-dialog-card--panel-invite')}
                    ${panelHeroHead('Invite to group', 'Invite', `Add ${escape(peerName)} to one of your groups or start a new group together.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(inviteGroups.length)), 'Groups')}
                            ${panelStat(escape(peerName), 'Person')}
                            ${panelStat('Direct', 'Conversation')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Create a group</strong>
                                <span>Start a new group with ${escape(peerName)} already invited.</span>
                            </div>
                            <button class="lux-primary-btn" type="button" data-action="group-create-with-peer" data-user-id="${escape(text(panelPeerId))}"><i class="fas fa-layer-group"></i> Create group with ${escape(peerName)}</button>
                        </section>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Add to your groups</strong>
                                <span>Invite ${escape(peerName)} to a group you manage.</span>
                            </div>
                            ${inviteGroups.length ? `<div class="lux-glass-dialog-member-list">${inviteGroups.map((group) => `
                                <div class="lux-glass-dialog-member-row">
                                    <div class="social-neo-person">
                                        <div class="social-neo-group-card-icon social-neo-group-card-avatar">${groupAvatar(group)}</div>
                                        <div class="lux-glass-dialog-member-info">
                                            <strong>${escape(text(group.name || 'Group'))}</strong>
                                            <span>${escape(String((Array.isArray(group.memberIds) ? group.memberIds : []).length))} members</span>
                                        </div>
                                    </div>
                                    <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="group-thread-invite-add" data-group-id="${escape(text(group.id))}" data-user-id="${escape(text(panelPeerId))}"><i class="fas fa-user-plus"></i> Invite</button>
                                </div>
                            `).join('')}</div>` : '<div class="social-neo-empty">You do not manage any groups where this person can be invited yet.</div>'}
                        </section>
                    </div>
                ${panelShellClose}`;
                }
                const inviteSearch = text(runtime.ui?.groupThreadInviteSearchByChat?.[text(dialog.chatId)] || '').trim().toLowerCase();
                const inviteFaculty = text(runtime.ui?.groupThreadInviteFacultyByChat?.[text(dialog.chatId)] || 'all') || 'all';
                const memberSet = new Set(panelMemberIds.map((id) => text(id)));
                const pendingSet = new Set(panelPendingIds.map((id) => text(id)));
                const allAccounts = Array.isArray(state().accounts) ? state().accounts : [];
                const facultyOptions = ['all', ...new Set(allAccounts.map((account) => text(account?.facultyCode || account?.faculty || '')).filter(Boolean))];
                const candidates = allAccounts.filter((account) => {
                    const id = text(account?.id);
                    if (!id || memberSet.has(id) || pendingSet.has(id) || id === panelCurrentUserId) return false;
                    if (inviteFaculty !== 'all' && text(account?.facultyCode || account?.faculty || '') !== inviteFaculty) return false;
                    if (!inviteSearch) return true;
                    const haystack = [displayName(account), account?.email, account?.facultyCode, account?.faculty, roleLabel(account?.role)].filter(Boolean).join(' ').toLowerCase();
                    return haystack.includes(inviteSearch);
                }).slice(0, 40);
                return `${panelShellOpen('lux-glass-dialog-card--panel-invite')}
                    ${panelHeroHead('Invite people', 'Invite', `Grow ${escape(panelTitle)} by inviting campus connections.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(panelMemberIds.length)), 'Members')}
                            ${panelStat(escape(String(candidates.length)), 'Matches')}
                            ${panelStat(escape(inviteFaculty === 'all' ? 'All' : facultyLabel(inviteFaculty)), 'Faculty')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Find people</strong>
                                <span>Search by name or filter by faculty, then invite.</span>
                            </div>
                            <div class="social-neo-form-grid-2 social-neo-panel-invite-filters">
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Search people</span>
                                    <input class="social-neo-input lux-control" type="search" data-bind="group-thread-invite-search" data-chat-id="${escape(text(dialog.chatId))}" placeholder="Search people to invite..." value="${escape(text(runtime.ui?.groupThreadInviteSearchByChat?.[text(dialog.chatId)] || ''))}">
                                </label>
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Faculty</span>
                                    <select class="social-neo-select lux-control" data-bind="group-thread-invite-faculty" data-chat-id="${escape(text(dialog.chatId))}" data-lux-picker>
                                        ${facultyOptions.map((faculty) => `<option value="${escape(faculty)}" ${inviteFaculty === faculty ? 'selected' : ''}>${escape(faculty === 'all' ? 'All faculties' : facultyLabel(faculty))}</option>`).join('')}
                                    </select>
                                </label>
                            </div>
                            ${candidates.length ? `<div class="lux-glass-dialog-member-list">${candidates.map((candidate) => `
                            <div class="lux-glass-dialog-member-row">
                                <div class="social-neo-person">
                                    ${avatar(candidate, 'social-neo-avatar-sm')}
                                    <div class="lux-glass-dialog-member-info">
                                        <strong>${escape(displayName(candidate))}</strong>
                                        <span>${escape(accountSubtitle(candidate))}</span>
                                    </div>
                                </div>
                                <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="group-thread-invite-add" data-group-id="${escape(text(panelGroup.id))}" data-user-id="${escape(text(candidate.id))}"><i class="fas fa-user-plus"></i> Invite</button>
                            </div>
                        `).join('')}</div>` : '<div class="social-neo-empty">No invite candidates match the current filters.</div>'}
                        </section>
                    </div>
                ${panelShellClose}`;
            }
            if (kind === 'group-panel-settings') {
                if (isDirectThread) {
                    return `${panelShellOpen('lux-glass-dialog-card--panel-settings')}
                    ${panelHeroHead('Conversation settings', 'Settings', `Notifications and actions for your chat with ${escape(panelTitle)}.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(panelMemberIds.length)), 'Participants')}
                            ${panelStat('Direct', 'Type')}
                            ${panelStat(escape(panelTitle), 'With')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Notifications</strong>
                                <span>Choose what alerts you receive from this conversation.</span>
                            </div>
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Preference</span>
                                <select class="social-neo-select lux-control" data-bind="chat-thread-notify" data-chat-id="${escape(text(panelChat.id))}" data-lux-picker>
                                    <option value="all" ${chatNotificationPreference(panelChat) === 'all' ? 'selected' : ''}>All messages</option>
                                    <option value="mentions" ${chatNotificationPreference(panelChat) === 'mentions' ? 'selected' : ''}>Mentions only</option>
                                    <option value="mute" ${chatNotificationPreference(panelChat) === 'mute' ? 'selected' : ''}>Mute</option>
                                </select>
                            </label>
                        </section>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Profile</strong>
                                <span>Open ${escape(panelTitle)}&rsquo;s campus profile.</span>
                            </div>
                            ${panelPeerId ? `<button class="lux-secondary-btn" type="button" data-action="profile-view" data-user-id="${escape(text(panelPeerId))}"><i class="fas fa-user"></i> View profile</button>` : ''}
                        </section>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Hide conversation</strong>
                                <span>Remove this chat from your inbox without deleting messages.</span>
                            </div>
                            <button class="lux-secondary-btn" type="button" data-action="chat-hide-open" data-chat-id="${escape(text(panelChat.id))}"><i class="fas fa-eye-slash"></i> Hide conversation</button>
                        </section>
                    </div>
                ${panelShellClose}`;
                }
                return `${panelShellOpen('lux-glass-dialog-card--panel-settings')}
                    ${panelHeroHead('Group settings', 'Settings', `Notifications and details for ${escape(panelTitle)}.`)}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            ${panelStat(escape(String(panelMemberIds.length)), 'Members')}
                            ${panelStat(escape(text(panelGroup.visibility || 'public')), 'Visibility')}
                            ${panelStat(panelIsAdmin ? 'Admin' : 'Member', 'Your role')}
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Notifications</strong>
                                <span>Choose what alerts you receive from this group.</span>
                            </div>
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Preference</span>
                                <select class="social-neo-select lux-control" data-bind="group-thread-notify" data-group-id="${escape(text(panelGroup.id))}" data-lux-picker>
                                    <option value="all" ${groupNotificationPreference(panelGroup) === 'all' ? 'selected' : ''}>All messages</option>
                                    <option value="mentions" ${groupNotificationPreference(panelGroup) === 'mentions' ? 'selected' : ''}>Mentions only</option>
                                    <option value="mute" ${groupNotificationPreference(panelGroup) === 'mute' ? 'selected' : ''}>Mute</option>
                                </select>
                            </label>
                        </section>
                        ${panelIsAdmin ? `
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Group details</strong>
                                <span>Name, description, visibility, and branding.</span>
                            </div>
                            <form class="social-neo-stack social-neo-panel-settings-form" data-form="group-settings" data-group-id="${escape(text(panelGroup.id))}" data-chat-id="${escape(text(panelChat.id))}">
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Name</span>
                                    <input class="social-neo-input lux-control" type="text" name="groupName" placeholder="Group name" value="${escape(text(runtime.ui?.groupThreadNameByChat?.[text(panelChat.id)] || panelGroup.name || ''))}">
                                </label>
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Description</span>
                                    <textarea class="social-neo-textarea lux-control" rows="3" name="groupDescription" placeholder="What is this group for?">${escape(text(runtime.ui?.groupThreadDescriptionByChat?.[text(panelChat.id)] || panelGroup.description || ''))}</textarea>
                                </label>
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Visibility</span>
                                    <select class="social-neo-select lux-control" name="groupVisibility" data-lux-picker>
                                        <option value="public" ${text(runtime.ui?.groupThreadVisibilityByChat?.[text(panelChat.id)] || panelGroup.visibility || 'public') === 'public' ? 'selected' : ''}>Public</option>
                                        <option value="private" ${text(runtime.ui?.groupThreadVisibilityByChat?.[text(panelChat.id)] || panelGroup.visibility || '') === 'private' ? 'selected' : ''}>Private</option>
                                    </select>
                                </label>
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Avatar image URL</span>
                                    <input class="social-neo-input lux-control" type="url" name="groupAvatarUrl" placeholder="Avatar image URL" value="${escape(text(runtime.ui?.groupThreadAvatarUrlByChat?.[text(panelChat.id)] || panelGroup.avatarImage || ''))}">
                                </label>
                                <label class="lux-secondary-btn lux-secondary-btn-pointer">
                                    <i class="fas fa-image"></i> Upload avatar
                                    <input name="groupAvatarFile" data-chat-id="${escape(text(panelChat.id))}" type="file" accept="image/*" hidden>
                                </label>
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Banner image URL</span>
                                    <input class="social-neo-input lux-control" type="url" name="groupBannerUrl" placeholder="Banner image URL" value="${escape(text(runtime.ui?.groupThreadBannerUrlByChat?.[text(panelChat.id)] || panelGroup.bannerImage || ''))}">
                                </label>
                                <label class="lux-secondary-btn lux-secondary-btn-pointer">
                                    <i class="fas fa-panorama"></i> Upload banner
                                    <input name="groupBannerFile" data-chat-id="${escape(text(panelChat.id))}" type="file" accept="image/*" hidden>
                                </label>
                                <div class="lux-glass-dialog-actions">
                                    <button class="lux-primary-btn" type="submit">Save group settings</button>
                                </div>
                            </form>
                        </section>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Leave group</strong>
                                <span>Leaving keeps the group available for others.</span>
                            </div>
                            <div class="social-neo-inline social-neo-inline-gap-10-wrap">
                                <span class="social-neo-muted social-neo-flex-spacer">You can rejoin later if the group is public or you are re-invited.</span>
                                <button class="lux-secondary-btn" type="button" data-action="group-leave-open" data-group-id="${escape(text(panelGroup.id))}"><i class="fas fa-sign-out-alt"></i> Leave group</button>
                            </div>
                        </section>
                        ` : ''}
                    </div>
                ${panelShellClose}`;
            }
        }
        return '';
    }

    window.renderGroupsHero = renderGroupsHero;
    window.renderGroupsPanel = renderGroupsPanel;
    window.renderGroupCreateDialog = renderGroupCreateDialog;
    window.renderGroupDetailDialog = renderGroupDetailDialog;
    window.renderGroupLeaveDialog = renderGroupLeaveDialog;
    window.renderGroupOwnedDialog = renderGroupOwnedDialog;
    window.GROUP_OWNED_DIALOG_KINDS = GROUP_OWNED_DIALOG_KINDS;
    window.normalizeGroupLeaveToken = normalizeGroupLeaveToken;

    function isSocialGroupsClickAction(action) {
        const a = text(action || '');
        return Boolean(a) && a.startsWith('group-');
    }

    function handleSocialGroupsClick(action, trigger) {
        if (!isSocialGroupsClickAction(action)) return false;
        if (action === 'group-create-open') {
            setPanel('groups');
            return openDialog('group-create');
        }

        if (action === 'group-create-with-peer') {
            const userId = text(trigger.getAttribute('data-user-id'));
            state().ui.groupInviteSelectedIds = userId ? [userId] : [];
            setPanel('groups');
            return openDialog('group-create');
        }

        if (action === 'group-leave-open') {
            const groupId = text(trigger.getAttribute('data-group-id'));
            return openDialog('group-leave', { groupId });
        }

        if (action === 'group-detail-open') {
            const groupId = text(trigger.getAttribute('data-group-id'));
            if (!groupId || !findSocialGroupById(groupId)) return;
            return openDialog('group-detail', { groupId });
        }

        if (action === 'group-member-search') return renderSocialPageNow('group-member-search');

        if (action === 'group-creator-member-add') {
            state().ui.groupInviteSelectedIds = Array.isArray(state().ui.groupInviteSelectedIds) ? state().ui.groupInviteSelectedIds : [];
            const memberId = text(trigger.getAttribute('data-user-id'));
            if (memberId && !state().ui.groupInviteSelectedIds.includes(memberId)) state().ui.groupInviteSelectedIds.push(memberId);
            return renderSocialPageNow('group-member-add');
        }

        if (action === 'group-creator-member-remove') {
            const memberId = text(trigger.getAttribute('data-user-id'));
            state().ui.groupInviteSelectedIds = (Array.isArray(state().ui.groupInviteSelectedIds) ? state().ui.groupInviteSelectedIds : []).filter((item) => text(item) !== memberId);
            return renderSocialPageNow('group-member-remove');
        }

        if (action === 'group-join') {
            const groupId = trigger.getAttribute('data-group-id');
            return withBusy(async () => {
                await setPortalSocialGroupMembership(groupId, 'join');
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('group-membership');
            });
        }

        if (action === 'group-approve') {
            return withBusy(async () => {
                await respondPortalSocialGroupMembership(trigger.getAttribute('data-group-id'), trigger.getAttribute('data-member-id'), true);
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('group-request');
            });
        }

        if (action === 'group-decline') {
            return withBusy(async () => {
                await respondPortalSocialGroupMembership(trigger.getAttribute('data-group-id'), trigger.getAttribute('data-member-id'), false);
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('group-request');
            });
        }

        if (action === 'group-chat') {
            return withBusy(async () => {
                const chat = await openPortalSocialGroupChat(trigger.getAttribute('data-group-id'));
                if (chat?.id) {
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }

        if (action === 'group-leave-wizard-next') {
            state().ui.groupLeaveStep = Math.min(3, Math.max(1, Number(state().ui?.groupLeaveStep || 1) + 1));
            return renderSocialPageNow('group-leave-wizard-next');
        }

        if (action === 'group-leave-wizard-prev') {
            state().ui.groupLeaveStep = Math.min(3, Math.max(1, Number(state().ui?.groupLeaveStep || 1) - 1));
            return renderSocialPageNow('group-leave-wizard-prev');
        }

        if (action === 'group-report') {
            const groupId = text(trigger.getAttribute('data-group-id'));
            const group = (Array.isArray(state().social?.groups) ? state().social.groups : []).find((item) => text(item.id) === groupId);
            const ownerId = text(group?.ownerUserId || (Array.isArray(group?.adminIds) ? group.adminIds[0] : Array.isArray(group?.managerUserIds) ? group.managerUserIds[0] : ''));
            return withBusy(() => reportPortalSocialContent('group', groupId, 'Reported group content', ownerId));
        }

        if (action === 'group-visibility-set') {
            return withBusy(async () => {
                await updatePortalSocialGroup(trigger.getAttribute('data-group-id'), {
                    visibility: text(trigger.getAttribute('data-visibility') || 'public') || 'public'
                });
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('group-updated');
            });
        }

        if (action === 'group-member-remove') {
            return withBusy(async () => {
                await removePortalSocialGroupMember(
                    trigger.getAttribute('data-group-id'),
                    trigger.getAttribute('data-member-id')
                );
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('group-member-removed');
            });
        }

        if (action === 'group-thread-panel-toggle') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            const panel = text(trigger.getAttribute('data-panel'));
            if (panel === 'search') {
                state().ui.groupThreadPanelByChat = state().ui.groupThreadPanelByChat || {};
                state().ui.groupThreadPanelByChat[chatId] = text(state().ui.groupThreadPanelByChat[chatId]) === 'search' ? '' : 'search';
                if (state().ui.groupThreadPanelByChat[chatId] === 'search') {
                    state().ui.groupThreadSearchIndexByChat = state().ui.groupThreadSearchIndexByChat || {};
                    state().ui.groupThreadSearchIndexByChat[chatId] = 0;
                }
                renderSocialPageNow('group-thread-panel-toggle');
                if (state().ui.groupThreadPanelByChat[chatId] === 'search') {
                    window.requestAnimationFrame(() => {
                        const searchInput = document.querySelector('.social-neo-search-bar-input');
                        if (searchInput) { try { searchInput.focus({ preventScroll: true }); } catch (e) {} }
                    });
                }
                return;
            }
            const dialogChat = activeChats().find((c) => text(c.id) === chatId);
            const dialogGroup = dialogChat ? groupForChat(dialogChat) : null;
            return openDialog(`group-panel-${panel}`, { chatId, groupId: text(dialogGroup?.id || '') });
        }

        if (action === 'group-thread-panel-close') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            state().ui.groupThreadPanelByChat = state().ui.groupThreadPanelByChat || {};
            state().ui.groupThreadPanelByChat[chatId] = '';
            return renderSocialPageNow('group-thread-panel-close');
        }

        if (action === 'group-thread-search-submit' || action === 'group-thread-invite-search') {
            if (action === 'group-thread-search-submit') {
                const chatId = text(trigger.getAttribute('data-chat-id'));
                state().ui.groupThreadSearchIndexByChat = state().ui.groupThreadSearchIndexByChat || {};
                state().ui.groupThreadSearchIndexByChat[chatId] = 0;
                renderSocialPageNow(action);
                window.requestAnimationFrame(() => {
                    const el = document.querySelector('.social-neo-message.is-search-active');
                    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                });
                return;
            }
            return renderSocialPageNow(action);
        }

        if (action === 'group-thread-search-next' || action === 'group-thread-search-prev') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            state().ui.groupThreadSearchIndexByChat = state().ui.groupThreadSearchIndexByChat || {};
            const currentIdx = Number(state().ui.groupThreadSearchIndexByChat[chatId] || 0);
            const chat = activeChats().find((c) => text(c.id) === chatId);
            const query = text(state().ui?.groupThreadSearchByChat?.[chatId] || '');
            const total = chat ? searchGroupMessages(chat, query).length : 0;
            if (total <= 0) return;
            const next = action === 'group-thread-search-next'
                ? (currentIdx + 1) % total
                : (currentIdx - 1 + total) % total;
            state().ui.groupThreadSearchIndexByChat[chatId] = next;
            renderSocialPageNow(action);
            window.requestAnimationFrame(() => {
                const el = document.querySelector('.social-neo-message.is-search-active');
                if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
            return;
        }

        if (action === 'group-thread-search-clear') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            state().ui.groupThreadSearchByChat = state().ui.groupThreadSearchByChat || {};
            state().ui.groupThreadSearchByChat[chatId] = '';
            state().ui.groupThreadSearchIndexByChat = state().ui.groupThreadSearchIndexByChat || {};
            state().ui.groupThreadSearchIndexByChat[chatId] = 0;
            state().ui.groupThreadPanelByChat = state().ui.groupThreadPanelByChat || {};
            state().ui.groupThreadPanelByChat[chatId] = '';
            return renderSocialPageNow('group-thread-search-clear');
        }

        if (action === 'group-panel-file-filter') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            const filter = text(trigger.getAttribute('data-filter') || 'all');
            state().ui.groupPanelFileFilter = state().ui.groupPanelFileFilter || {};
            state().ui.groupPanelFileFilter[chatId] = filter;
            return renderSocialPageNow('group-panel-file-filter');
        }

        if (action === 'group-thread-search-open') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            const messageId = text(trigger.getAttribute('data-message-id'));
            state().ui.groupThreadJumpMessageByChat = state().ui.groupThreadJumpMessageByChat || {};
            state().ui.groupThreadJumpMessageByChat[chatId] = messageId;
            setActiveChat(chatId);
            return renderSocialPageNow('group-thread-search-open');
        }

        if (action === 'group-thread-invite-add') {
            return withBusy(() => invitePortalSocialGroupMember(
                trigger.getAttribute('data-group-id'),
                trigger.getAttribute('data-user-id'),
                ''
            ));
        }

        if (action === 'group-call-join') return withBusy(() => joinPortalGroupCall(trigger.getAttribute('data-chat-id')));

        if (action === 'group-call-leave') return withBusy(() => leavePortalGroupCall(trigger.getAttribute('data-chat-id')));
        return false;
    }

    window.handleSocialGroupsClick = handleSocialGroupsClick;
    window.isSocialGroupsClickAction = isSocialGroupsClickAction;

    window.buildGroupLeaveVerification = buildGroupLeaveVerification;

    function isSocialGroupsSubmitForm(formType) {
        const f = text(formType || '');
        return f === 'create-group' || f === 'group-settings' || f === 'dialog-group-invite' || f === 'dialog-group-leave';
    }

    function handleSocialGroupsSubmit(formType, form, runtime, event) {
        if (!isSocialGroupsSubmitForm(formType)) return false;
        if (formType === 'create-group') {
            return withBusy(async () => {
                const inviteIds = Array.isArray(runtime.ui?.groupInviteSelectedIds) ? runtime.ui.groupInviteSelectedIds.map((item) => text(item)).filter(Boolean) : [];
                const payload = {
                    name: text(form.groupName?.value || runtime.ui?.groupName),
                    description: text(form.groupDescription?.value || runtime.ui?.groupDescription),
                    visibility: text(form.groupVisibility?.value || runtime.ui?.groupVisibility || 'public') || 'public',
                    type: text(form.groupType?.value || 'standard') || 'standard',
                    maxMembers: text(form.groupMaxMembers?.value || runtime.ui?.groupMaxMembers || ''),
                    tags: text(form.groupType?.value || 'standard') === 'study' ? ['study'] : []
                };
                if (!payload.name) throw new Error('Group name is required.');
                const group = await createPortalSocialGroup(payload);
                if (group?.id && inviteIds.length && typeof invitePortalSocialGroupMember === 'function') {
                    for (const memberId of inviteIds) {
                        await invitePortalSocialGroupMember(group.id, memberId, `You were invited to join ${payload.name}.`);
                    }
                }
                runtime.ui.groupName = '';
                runtime.ui.groupDescription = '';
                runtime.ui.groupVisibility = 'public';
                runtime.ui.groupMaxMembers = '';
                runtime.ui.groupInviteSearch = '';
                runtime.ui.groupInviteFaculty = 'all';
                runtime.ui.groupInviteSelectedIds = [];
                runtime.ui.eventsComposerSection = '';
                closeDialog();
                if (group?.id && typeof openPortalSocialGroupChat === 'function') {
                    const chat = await openPortalSocialGroupChat(group.id);
                    if (chat?.id) {
                        setActiveChat(chat.id);
                        setPanel('messages');
                        return;
                    }
                }
                renderSocialPageNow('group-created');
            });
        }

        if (formType === 'group-settings') {
            return withBusy(async () => {
                const chatId = text(form.getAttribute('data-chat-id'));
                const groupId = text(form.getAttribute('data-group-id'));
                const avatarFile = runtime.ui?.groupThreadAvatarFileByChat?.[chatId] || null;
                const bannerFile = runtime.ui?.groupThreadBannerFileByChat?.[chatId] || null;
                const avatarImage = text(form.groupAvatarUrl?.value || runtime.ui?.groupThreadAvatarUrlByChat?.[chatId] || '') || await readFileAsDataUrl(avatarFile);
                const bannerImage = text(form.groupBannerUrl?.value || runtime.ui?.groupThreadBannerUrlByChat?.[chatId] || '') || await readFileAsDataUrl(bannerFile);
                await updatePortalSocialGroup(groupId, {
                    name: text(form.groupName?.value || ''),
                    description: text(form.groupDescription?.value || ''),
                    visibility: text(form.groupVisibility?.value || 'public') || 'public',
                    avatarImage,
                    bannerImage
                });
                runtime.ui.groupThreadAvatarFileByChat = runtime.ui.groupThreadAvatarFileByChat || {};
                runtime.ui.groupThreadBannerFileByChat = runtime.ui.groupThreadBannerFileByChat || {};
                runtime.ui.groupThreadAvatarUrlByChat = runtime.ui.groupThreadAvatarUrlByChat || {};
                runtime.ui.groupThreadBannerUrlByChat = runtime.ui.groupThreadBannerUrlByChat || {};
                runtime.ui.groupThreadNameByChat = runtime.ui.groupThreadNameByChat || {};
                runtime.ui.groupThreadDescriptionByChat = runtime.ui.groupThreadDescriptionByChat || {};
                runtime.ui.groupThreadVisibilityByChat = runtime.ui.groupThreadVisibilityByChat || {};
                runtime.ui.groupThreadAvatarFileByChat[chatId] = null;
                runtime.ui.groupThreadBannerFileByChat[chatId] = null;
                runtime.ui.groupThreadAvatarUrlByChat[chatId] = avatarImage;
                runtime.ui.groupThreadBannerUrlByChat[chatId] = bannerImage;
                runtime.ui.groupThreadNameByChat[chatId] = text(form.groupName?.value || '');
                runtime.ui.groupThreadDescriptionByChat[chatId] = text(form.groupDescription?.value || '');
                runtime.ui.groupThreadVisibilityByChat[chatId] = text(form.groupVisibility?.value || 'public') || 'public';
                renderSocialPageNow('group-settings-saved');
            });
        }

        if (formType === 'dialog-group-invite') {
            return withBusy(async () => {
                if (typeof invitePortalSocialGroupMember !== 'function') throw new Error('Group invitations are unavailable.');
                await invitePortalSocialGroupMember(
                    text(form.inviteGroupId?.value),
                    text(form.targetUserId?.value),
                    text(form.inviteNote?.value)
                );
                closeDialog();
            });
        }

        if (formType === 'dialog-group-leave') {
            return withBusy(async () => {
                const leaveStep = Math.min(3, Math.max(1, Number(state().ui?.groupLeaveStep || 1) || 1));
                if (leaveStep !== 3) throw new Error('Complete all verification steps before leaving the group.');
                const typedToken = normalizeGroupLeaveToken(form.groupLeaveToken?.value);
                const expectedToken = normalizeGroupLeaveToken(form.expectedLeaveToken?.value);
                if (!typedToken || typedToken !== expectedToken) throw new Error('Type the group name exactly to confirm leaving.');
                const groupId = text(form.groupId?.value);
                const groupChatId = text(form.groupChatId?.value);
                await setPortalSocialGroupMembership(groupId, 'leave');
                if (text(state().ui?.activeChatId || '') === groupChatId) {
                    state().ui.activeChatId = '';
                    setPanel('groups');
                    state().ui.groupsTab = 'discover';
                }
                closeDialog();
                renderSocialPageNow('group-left');
            });
        }
        return false;
    }

    window.handleSocialGroupsSubmit = handleSocialGroupsSubmit;
    window.isSocialGroupsSubmitForm = isSocialGroupsSubmitForm;

    function isSocialGroupsInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="group-thread-search"], [data-bind="group-thread-invite-search"]')) return true;
        if (target.closest && target.closest('form[data-form="create-group"], form[data-form="group-settings"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialGroupsInput(target, runtime, event) {
        if (!isSocialGroupsInputTarget(target)) return false;
        if (target.matches('[data-bind="group-thread-search"]')) {
            const searchChatId = text(target.getAttribute('data-chat-id'));
            runtime.ui.groupThreadSearchByChat = runtime.ui.groupThreadSearchByChat || {};
            runtime.ui.groupThreadSearchByChat[searchChatId] = target.value;
            runtime.ui.groupThreadSearchIndexByChat = runtime.ui.groupThreadSearchIndexByChat || {};
            runtime.ui.groupThreadSearchIndexByChat[searchChatId] = 0;
            renderSocialPageNow('group-thread-search-input');
            window.requestAnimationFrame(() => {
                const el = document.querySelector('.social-neo-message.is-search-active');
                if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
        }
        if (target.matches('[data-bind="group-thread-invite-search"]')) {
            runtime.ui.groupThreadInviteSearchByChat = runtime.ui.groupThreadInviteSearchByChat || {};
            runtime.ui.groupThreadInviteSearchByChat[text(target.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('form[data-form="create-group"] [name="groupName"]')) runtime.ui.groupName = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupDescription"]')) runtime.ui.groupDescription = target.value;
        if (target.matches('form[data-form="group-settings"] [name="groupAvatarUrl"]')) {
            runtime.ui.groupThreadAvatarUrlByChat = runtime.ui.groupThreadAvatarUrlByChat || {};
            runtime.ui.groupThreadAvatarUrlByChat[text(target.closest('form')?.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('form[data-form="group-settings"] [name="groupBannerUrl"]')) {
            runtime.ui.groupThreadBannerUrlByChat = runtime.ui.groupThreadBannerUrlByChat || {};
            runtime.ui.groupThreadBannerUrlByChat[text(target.closest('form')?.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('form[data-form="group-settings"] [name="groupName"]')) {
            runtime.ui.groupThreadNameByChat = runtime.ui.groupThreadNameByChat || {};
            runtime.ui.groupThreadNameByChat[text(target.closest('form')?.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('form[data-form="group-settings"] [name="groupDescription"]')) {
            runtime.ui.groupThreadDescriptionByChat = runtime.ui.groupThreadDescriptionByChat || {};
            runtime.ui.groupThreadDescriptionByChat[text(target.closest('form')?.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('form[data-form="create-group"] [name="groupMaxMembers"]')) runtime.ui.groupMaxMembers = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupMemberSearch"]')) {
            runtime.ui.groupInviteSearch = target.value;
            queueGroupInviteSearchRefresh();
            return;
        }
        if (target.matches('form[data-form="create-group"] [name="groupName"]')) runtime.ui.groupName = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupDescription"]')) runtime.ui.groupDescription = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupMaxMembers"]')) runtime.ui.groupMaxMembers = target.value;

        return true;
    }

    function isSocialGroupsChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="group-thread-invite-faculty"], [data-bind="group-thread-notify"], [data-bind="chat-thread-notify"]')) return true;
        if (target.closest && target.closest('form[data-form="create-group"], form[data-form="group-settings"]')) return true;
        if (target.name === 'groupAvatarFile' || target.name === 'groupBannerFile') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialGroupsChange(target, runtime, event) {
        if (!isSocialGroupsChangeTarget(target)) return false;
        if (target.matches('[data-bind="group-thread-invite-faculty"]')) {
            runtime.ui.groupThreadInviteFacultyByChat = runtime.ui.groupThreadInviteFacultyByChat || {};
            runtime.ui.groupThreadInviteFacultyByChat[text(target.getAttribute('data-chat-id'))] = text(target.value || 'all') || 'all';
            renderSocialPageNow('group-thread-invite-faculty');
            return;
        }
        if (target.matches('[data-bind="group-thread-notify"]')) {
            setGroupNotificationPreference(target.getAttribute('data-group-id'), target.value);
            renderSocialPageNow('group-thread-notify');
            return;
        }
        if (target.matches('[data-bind="chat-thread-notify"]')) {
            setChatNotificationPreference(target.getAttribute('data-chat-id'), target.value);
            renderSocialPageNow('chat-thread-notify');
            return;
        }
        if (target.matches('form[data-form="create-group"] [name="groupVisibility"]')) runtime.ui.groupVisibility = text(target.value || 'public') || 'public';
        if (target.matches('form[data-form="group-settings"] [name="groupVisibility"]')) {
            runtime.ui.groupThreadVisibilityByChat = runtime.ui.groupThreadVisibilityByChat || {};
            runtime.ui.groupThreadVisibilityByChat[text(target.closest('form')?.getAttribute('data-chat-id'))] = text(target.value || 'public') || 'public';
        }
        if (target.matches('form[data-form="create-group"] [name="groupMemberFaculty"]')) {
            runtime.ui.groupInviteFaculty = text(target.value || 'all') || 'all';
            renderSocialPageNow('group-member-faculty');
            return;
        }
        if (target.name === 'groupAvatarFile') {
            runtime.ui.groupThreadAvatarFileByChat = runtime.ui.groupThreadAvatarFileByChat || {};
            runtime.ui.groupThreadAvatarFileByChat[text(target.getAttribute('data-chat-id'))] = target.files?.[0] || null;
            renderSocialPageNow('group-avatar-file');
            return;
        }
        if (target.name === 'groupBannerFile') {
            runtime.ui.groupThreadBannerFileByChat = runtime.ui.groupThreadBannerFileByChat || {};
            runtime.ui.groupThreadBannerFileByChat[text(target.getAttribute('data-chat-id'))] = target.files?.[0] || null;
            renderSocialPageNow('group-banner-file');
            return;
        }

        return true;
    }

    window.handleSocialGroupsInput = handleSocialGroupsInput;
    window.isSocialGroupsInputTarget = isSocialGroupsInputTarget;
    window.handleSocialGroupsChange = handleSocialGroupsChange;
    window.isSocialGroupsChangeTarget = isSocialGroupsChangeTarget;

})();
