(function initSocialMessagesModule() {
    if (window.__KIU_SOCIAL_MESSAGES_MODULE_LOADED) return;
    window.__KIU_SOCIAL_MESSAGES_MODULE_LOADED = true;

    const hooks = window.__kiuSocialMessagesHooks || {};
    const {
        state,
        activeChats,
        activeMessages,
        text,
        unreadMessages,
        currentCall,
        callForChat,
        controlId,
        groupForChat,
        groupMessageAssets,
        searchGroupMessages,
        currentCallParticipants,
        viewerInCall,
        currentUser,
        currentUserId,
        accountById,
        accountPresenceLabel,
        accountSubtitle,
        displayName,
        avatar,
        when,
        presencePill,
        messageLinks,
        messageAnchorId,
        filePreview,
        renderLinkedMessageText,
        groupAvatar,
        groupBanner,
        groupMemberPreviewNames,
        groupNotificationPreference,
        chatTitle,
        chatPreview,
        chatTime,
        renderFileChip,
        facultyLabel,
        roleLabel,
        isIncomingCall,
        escape
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof activeChats !== 'function'
        || typeof activeMessages !== 'function'
        || typeof text !== 'function'
        || typeof unreadMessages !== 'function'
        || typeof currentCall !== 'function'
        || typeof callForChat !== 'function'
        || typeof controlId !== 'function'
        || typeof groupForChat !== 'function'
        || typeof groupMessageAssets !== 'function'
        || typeof searchGroupMessages !== 'function'
        || typeof currentCallParticipants !== 'function'
        || typeof viewerInCall !== 'function'
        || typeof currentUser !== 'function'
        || typeof currentUserId !== 'function'
        || typeof accountById !== 'function'
        || typeof accountPresenceLabel !== 'function'
        || typeof accountSubtitle !== 'function'
        || typeof displayName !== 'function'
        || typeof avatar !== 'function'
        || typeof when !== 'function'
        || typeof presencePill !== 'function'
        || typeof messageLinks !== 'function'
        || typeof messageAnchorId !== 'function'
        || typeof filePreview !== 'function'
        || typeof renderLinkedMessageText !== 'function'
        || typeof groupAvatar !== 'function'
        || typeof groupBanner !== 'function'
        || typeof groupMemberPreviewNames !== 'function'
        || typeof groupNotificationPreference !== 'function'
        || typeof chatTitle !== 'function'
        || typeof chatPreview !== 'function'
        || typeof chatTime !== 'function'
        || typeof renderFileChip !== 'function'
        || typeof facultyLabel !== 'function'
        || typeof roleLabel !== 'function'
        || typeof isIncomingCall !== 'function'
        || typeof escape !== 'function'
    ) {
        throw new Error('Social messages hooks are unavailable.');
    }

    window.renderMessagesPanel = function renderMessagesPanel() {
        const runtime = state();
        const chats = activeChats();
        const messagesFilter = text(runtime.ui?.messagesFilter || 'all') || 'all';
        const visibleChats = messagesFilter === 'unread' ? chats.filter((entry) => unreadMessages(entry) > 0) : chats;
        const activeChatId = text(runtime.ui?.activeChatId || '');
        const chat = visibleChats.find((entry) => text(entry.id) === activeChatId) || visibleChats[0] || null;
        const call = chat ? callForChat(chat.id) : currentCall();
        const messageDraft = chat ? text(runtime.ui?.messageDraftByChat?.[chat.id] || '') : '';
        const messageFile = chat ? runtime.ui?.messageFileByChat?.[chat.id] || null : null;
        const messageBodyId = controlId('messageBody', text(chat?.id || 'thread'));
        const messageFileId = controlId('messageFile', text(chat?.id || 'thread'));
        const group = groupForChat(chat);
        const isGroupThread = Boolean(chat && text(chat?.type || '') === 'group' && group);
        const railOpen = runtime.ui?.groupThreadRailOpen !== false;
        const activeGroupPanel = chat ? text(runtime.ui?.groupThreadPanelByChat?.[chat.id] || '') : '';
        const assets = isGroupThread ? groupMessageAssets(chat) : { files: [], media: [], links: [] };
        const searchQuery = chat ? text(runtime.ui?.groupThreadSearchByChat?.[chat.id] || '') : '';
        const searchResults = isGroupThread ? searchGroupMessages(chat, searchQuery).slice(0, 18) : [];
        const jumpMessageId = chat ? text(runtime.ui?.groupThreadJumpMessageByChat?.[chat.id] || '') : '';
        const bannerUrl = groupBanner(group);
        const currentParticipants = currentCallParticipants(call);
        const inCurrentCall = viewerInCall(call);
        const inviteSearch = chat ? text(runtime.ui?.groupThreadInviteSearchByChat?.[chat.id] || '').trim().toLowerCase() : '';
        const inviteFaculty = chat ? text(runtime.ui?.groupThreadInviteFacultyByChat?.[chat.id] || 'all') || 'all' : 'all';
        const memberIds = Array.isArray(group?.memberIds) ? group.memberIds : [];
        const pendingMemberIds = Array.isArray(group?.pendingMemberIds) ? group.pendingMemberIds : [];
        const inviteCandidates = isGroupThread
            ? Object.values(runtime.accountsById || {})
                .filter((account) => text(account?.id) && !memberIds.includes(text(account.id)) && !pendingMemberIds.includes(text(account.id)) && text(account.id) !== currentUserId())
                .filter((account) => inviteFaculty === 'all' || text(account?.facultyCode || account?.faculty || '') === inviteFaculty)
                .filter((account) => {
                    if (!inviteSearch) return true;
                    const haystack = [displayName(account), account?.email, account?.facultyCode, account?.faculty, roleLabel(account?.role)].filter(Boolean).join(' ').toLowerCase();
                    return haystack.includes(inviteSearch);
                })
                .slice(0, 8)
            : [];
        const inviteFacultyOptions = isGroupThread
            ? ['all', ...new Set(Object.values(runtime.accountsById || {}).map((account) => text(account?.facultyCode || account?.faculty || '')).filter(Boolean).sort())]
            : ['all'];
        const messageCardHeadClass = 'social-neo-inline social-neo-inline-between-gap-8-wrap social-neo-msg-card-head';
        const messageCardMetaClass = 'social-neo-inline social-neo-inline-gap-8-wrap social-neo-msg-card-meta';
        const messagePanelRowClass = 'social-neo-inline social-neo-inline-items-end social-neo-inline-gap-8-wrap social-neo-msg-panel-row';
        const messagePanelFieldClass = 'social-neo-field-flex-1-220 social-neo-msg-panel-field';
        const messagePanelFixedFieldClass = 'social-neo-field-fixed-220 social-neo-msg-panel-field social-neo-msg-panel-field-fixed';
        const messageUploadTriggerClass = 'social-neo-btn social-neo-btn-ghost social-neo-btn-pointer social-neo-msg-upload-trigger';
        const messageSettingsFooterClass = 'social-neo-inline social-neo-inline-gap-10-wrap social-neo-msg-settings-footer';
        const messageSettingsCopyClass = 'social-neo-muted social-neo-flex-spacer social-neo-msg-settings-copy';
        const messageComposeFormClass = 'social-neo-thread-compose social-neo-msg-compose-form';
        const messageComposeRowClass = 'social-neo-comment-compose social-neo-msg-compose-row';
        const messageComposeInputClass = 'social-neo-input social-neo-input-flex-1-180 social-neo-msg-compose-input';
        const renderChatAvatar = (entry) => {
            const entryGroup = groupForChat(entry);
            if (text(entry?.type || '') === 'group' && entryGroup) return groupAvatar(entryGroup, 'social-neo-avatar-sm');
            return avatar(accountById((Array.isArray(entry?.members) ? entry.members : []).find((memberId) => text(memberId) !== currentUserId()) || '') || { displayName: chatTitle(entry) }, 'social-neo-avatar-sm');
        };
        const renderMessageCard = (message) => {
            const own = text(message.senderId) === currentUserId();
            const sender = accountById(message.senderId) || { id: message.senderId };
            const links = messageLinks(message);
            const seenByOthers = (Array.isArray(message?.seenBy) ? message.seenBy : []).filter((userId) => text(userId) !== text(message.senderId));
            return `
                <article class="social-neo-message ${own ? 'is-own' : ''} ${jumpMessageId === text(message.id) ? 'is-highlighted' : ''}" id="${escape(messageAnchorId(chat.id, message.id))}">
                    <div class="${messageCardHeadClass}">
                        <div class="${messageCardMetaClass}">
                            <strong>${escape(displayName(sender))}</strong>
                            ${presencePill(sender)}
                        </div>
                        ${own ? `<button class="social-neo-link-btn" type="button" data-action="message-delete-open" data-chat-id="${escape(text(chat.id))}" data-message-id="${escape(text(message.id))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                    </div>
                    ${message.text ? `<p>${renderLinkedMessageText(message.text)}</p>` : ''}
                    ${message.file ? filePreview(message.file) : ''}
                    ${links.length ? `<div class="social-neo-link-row">${links.map((url) => `<a class="social-neo-link-btn" href="${escape(url)}" target="_blank" rel="noopener"><i class="fas fa-link"></i> ${escape(url.replace(/^https?:\/\//i, ''))}</a>`).join('')}</div>` : ''}
                    <span>${escape(when(message.sentAt))}${own && seenByOthers.length ? ` • Seen by ${escape(seenByOthers.length)}` : ''}</span>
                </article>
            `;
        };
        const renderGroupCallCard = () => {
            if (!call || text(call.mode || '') !== 'group' || text(call.chatId) !== text(chat?.id)) return '';
            return `
                <div class="social-neo-call-card social-neo-call-card-group">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Group call room</strong>
                            <span>${escape(text(runtime.ui?.callMessage || (call.active ? 'Group call live.' : 'No active call.')))}</span>
                        </div>
                        <div class="social-neo-inline">
                            ${call.active && !inCurrentCall ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-call-join" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-phone-volume"></i> Join</button>` : ''}
                            ${call.active && inCurrentCall ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-call-leave" data-chat-id="${escape(text(chat.id))}">Leave</button>` : ''}
                        </div>
                    </div>
                    <div class="social-neo-badge-row">
                        ${currentParticipants.map((participant) => `<span class="social-neo-pill">${escape(displayName(participant))}</span>`).join('') || '<span class="social-neo-pill">No participants yet</span>'}
                    </div>
                    ${state().ui?.callOpen && text(state().ui?.activeCallChatId) === text(chat.id) ? `
                        <div class="social-neo-call-stage social-neo-call-stage-group">
                            <div class="social-neo-call-video">
                                <video id="portal-call-local-video" autoplay playsinline muted></video>
                                <span>Your camera</span>
                            </div>
                            <div class="social-neo-call-video is-placeholder">
                                <div class="social-neo-call-placeholder">
                                    <i class="fas fa-users"></i>
                                    <span>Participants join this room live</span>
                                </div>
                            </div>
                        </div>
                        <div class="social-neo-inline">
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-mic">${state().ui?.callMicEnabled ? 'Mute mic' : 'Unmute mic'}</button>
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-camera">${state().ui?.callCameraEnabled ? 'Hide camera' : 'Show camera'}</button>
                        </div>
                    ` : ''}
                </div>
            `;
        };
        const renderGroupPanelBody = () => {
            if (!isGroupThread || !activeGroupPanel) return '';
            if (activeGroupPanel === 'search') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Search in conversation</strong><span>Messages, files, and links.</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="${messagePanelRowClass}">
                            <label class="${messagePanelFieldClass}">
                                <span class="social-neo-label">Search</span>
                                <input class="social-neo-input" type="search" data-bind="group-thread-search" data-chat-id="${escape(text(chat.id))}" placeholder="Search this group..." value="${escape(searchQuery)}">
                            </label>
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-thread-search-submit" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-search"></i> Search</button>
                        </div>
                        <div class="social-neo-list">
                            ${searchQuery ? (searchResults.length ? searchResults.map((result) => `
                                <article class="social-neo-entity-card">
                                    <div>
                                        <strong>${escape(result.type === 'link' ? 'Link match' : result.type === 'file' ? 'File match' : result.type === 'media' ? 'Image match' : 'Message match')}</strong>
                                        <span>${escape(displayName(accountById(result.senderId) || { id: result.senderId }))} • ${escape(when(result.sentAt))}</span>
                                    </div>
                                    <div class="social-neo-stack">
                                        <span>${escape(text(result.match || ''))}</span>
                                        <button class="social-neo-link-btn" type="button" data-action="group-thread-search-open" data-chat-id="${escape(text(chat.id))}" data-message-id="${escape(text(result.message?.id || ''))}">Jump to message</button>
                                    </div>
                                </article>
                            `).join('') : '<div class="social-neo-empty">No results match the current search.</div>') : '<div class="social-neo-empty">Search this group to find messages, shared files, and links.</div>'}
                        </div>
                    </section>
                `;
            }
            if (activeGroupPanel === 'media') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Shared media</strong><span>${escape(assets.media.length)} image attachment${assets.media.length === 1 ? '' : 's'}</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="social-neo-list">
                            ${assets.media.length ? assets.media.slice(0, 8).map((entry) => `
                                <article class="social-neo-entity-card">
                                    <div class="social-neo-person">
                                        ${avatar(accountById(entry.senderId) || { id: entry.senderId }, 'social-neo-avatar-sm')}
                                        <div><strong>${escape(text(entry.file?.name || 'Image'))}</strong><span>${escape(when(entry.sentAt))}</span></div>
                                    </div>
                                    ${filePreview(entry.file)}
                                </article>
                            `).join('') : '<div class="social-neo-empty">No shared media yet.</div>'}
                        </div>
                    </section>
                `;
            }
            if (activeGroupPanel === 'files') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Shared files</strong><span>${escape(assets.files.length)} file${assets.files.length === 1 ? '' : 's'}</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="social-neo-list">
                            ${assets.files.length ? assets.files.slice(0, 10).map((entry) => `
                                <article class="social-neo-entity-card">
                                    <div><strong>${escape(text(entry.file?.name || 'Attachment'))}</strong><span>${escape(displayName(accountById(entry.senderId) || { id: entry.senderId }))} • ${escape(when(entry.sentAt))}</span></div>
                                    ${filePreview(entry.file)}
                                </article>
                            `).join('') : '<div class="social-neo-empty">No shared files yet.</div>'}
                        </div>
                    </section>
                `;
            }
            if (activeGroupPanel === 'links') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Shared links</strong><span>${escape(assets.links.length)} link${assets.links.length === 1 ? '' : 's'}</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="social-neo-list">
                            ${assets.links.length ? assets.links.slice(0, 10).map((entry) => `
                                <article class="social-neo-entity-card">
                                    <div><strong>${escape(entry.url.replace(/^https?:\/\//i, ''))}</strong><span>${escape(displayName(accountById(entry.senderId) || { id: entry.senderId }))} • ${escape(when(entry.sentAt))}</span></div>
                                    <div class="social-neo-inline">
                                        <a class="social-neo-link-btn" href="${escape(entry.url)}" target="_blank" rel="noopener">Open link</a>
                                        <button class="social-neo-link-btn" type="button" data-action="group-thread-search-open" data-chat-id="${escape(text(chat.id))}" data-message-id="${escape(text(entry.message?.id || ''))}">Jump</button>
                                    </div>
                                </article>
                            `).join('') : '<div class="social-neo-empty">No links have been shared yet.</div>'}
                        </div>
                    </section>
                `;
            }
            if (activeGroupPanel === 'members') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Members</strong><span>${escape(memberIds.length)} active • ${escape(pendingMemberIds.length)} pending</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="social-neo-list">
                            ${memberIds.map((memberId) => {
                                const member = accountById(memberId) || { id: memberId };
                                return `
                                    <article class="social-neo-entity-card social-neo-group-member-row">
                                        <div class="social-neo-person">
                                            ${avatar(member, 'social-neo-avatar-sm')}
                                            <div><strong>${escape(displayName(member))}</strong><span>${escape(accountSubtitle(member))}</span></div>
                                        </div>
                                        <div class="social-neo-inline">
                                            ${presencePill(member)}
                                            <button class="social-neo-link-btn" type="button" data-action="profile-view" data-user-id="${escape(text(memberId))}">Profile</button>
                                            ${text(memberId) !== currentUserId() ? `<button class="social-neo-link-btn" type="button" data-action="directory-message" data-user-id="${escape(text(memberId))}">Message</button>` : ''}
                                            ${group?.isManager && text(memberId) !== currentUserId() ? `<button class="social-neo-link-btn" type="button" data-action="group-member-remove" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Remove</button>` : ''}
                                        </div>
                                    </article>
                                `;
                            }).join('') || '<div class="social-neo-empty">No members found.</div>'}
                        </div>
                    </section>

                    ${group?.isManager ? `
                        <section class="social-neo-group-thread-section">
                            <div class="social-neo-section-head">
                                <div><strong>Pending requests</strong><span>${escape(pendingMemberIds.length)} waiting for review</span></div>
                            </div>
                            <div class="social-neo-list">
                                ${pendingMemberIds.length ? pendingMemberIds.map((memberId) => {
                                    const member = accountById(memberId) || { id: memberId };
                                    return `
                                        <article class="social-neo-entity-card social-neo-group-member-row">
                                            <div class="social-neo-person">
                                                ${avatar(member, 'social-neo-avatar-sm')}
                                                <div><strong>${escape(displayName(member))}</strong><span>${escape(accountSubtitle(member))}</span></div>
                                            </div>
                                            <div class="social-neo-inline">
                                                <button class="social-neo-link-btn" type="button" data-action="group-approve" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Approve</button>
                                                <button class="social-neo-link-btn" type="button" data-action="group-decline" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Decline</button>
                                            </div>
                                        </article>
                                    `;
                                }).join('') : '<div class="social-neo-empty">No pending requests right now.</div>'}
                            </div>
                        </section>
                    ` : ''}
                `;
            }
            if (activeGroupPanel === 'invite') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Invite people</strong><span>Grow the chat after creation.</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="${messagePanelRowClass}">
                            <label class="${messagePanelFieldClass}">
                                <span class="social-neo-label">Search people</span>
                                <input class="social-neo-input" type="search" data-bind="group-thread-invite-search" data-chat-id="${escape(text(chat.id))}" placeholder="Search people to invite..." value="${escape(text(runtime.ui?.groupThreadInviteSearchByChat?.[chat.id] || ''))}">
                            </label>
                            <label class="${messagePanelFixedFieldClass}">
                                <span class="social-neo-label">Faculty</span>
                                <select class="social-neo-select" data-bind="group-thread-invite-faculty" data-chat-id="${escape(text(chat.id))}">
                                    ${inviteFacultyOptions.map((faculty) => `<option value="${escape(faculty)}" ${inviteFaculty === faculty ? 'selected' : ''}>${escape(faculty === 'all' ? 'All faculties' : facultyLabel(faculty))}</option>`).join('')}
                                </select>
                            </label>
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-thread-invite-search" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-search"></i> Search</button>
                        </div>
                        <div class="social-neo-list">
                            ${inviteCandidates.length ? inviteCandidates.map((candidate) => `
                                <article class="social-neo-entity-card social-neo-group-member-row">
                                    <div class="social-neo-person">
                                        ${avatar(candidate, 'social-neo-avatar-sm')}
                                        <div><strong>${escape(displayName(candidate))}</strong><span>${escape(accountSubtitle(candidate))}</span></div>
                                    </div>
                                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="group-thread-invite-add" data-group-id="${escape(text(group.id))}" data-user-id="${escape(text(candidate.id))}"><i class="fas fa-user-plus"></i> Invite</button>
                                </article>
                            `).join('') : '<div class="social-neo-empty">No invite candidates match the current filters.</div>'}
                        </div>
                    </section>
                `;
            }
            if (activeGroupPanel === 'settings') {
                return `
                    <section class="social-neo-group-thread-section">
                        <div class="social-neo-section-head">
                            <div><strong>Notification settings</strong><span>Local preference for this group.</span></div>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-thread-panel-close" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-times"></i></button>
                        </div>
                        <label class="${messagePanelFieldClass}">
                            <span class="social-neo-label">Notifications</span>
                            <select class="social-neo-select" data-bind="group-thread-notify" data-group-id="${escape(text(group.id))}">
                                <option value="all" ${groupNotificationPreference(group) === 'all' ? 'selected' : ''}>All messages</option>
                                <option value="mentions" ${groupNotificationPreference(group) === 'mentions' ? 'selected' : ''}>Mentions only</option>
                                <option value="mute" ${groupNotificationPreference(group) === 'mute' ? 'selected' : ''}>Mute</option>
                            </select>
                        </label>
                    </section>

                    ${group?.isManager ? `
                        <section class="social-neo-group-thread-section">
                            <div class="social-neo-section-head">
                                <div><strong>Group settings</strong><span>Rename the room and update its visuals.</span></div>
                            </div>
                            <form class="social-neo-stack" data-form="group-settings" data-group-id="${escape(text(group.id))}" data-chat-id="${escape(text(chat.id))}">
                                <input class="social-neo-input" type="text" name="groupName" placeholder="Group name" value="${escape(text(runtime.ui?.groupThreadNameByChat?.[chat.id] || group.name || ''))}">
                                <textarea class="social-neo-textarea" rows="3" name="groupDescription" placeholder="What is this group for?">${escape(text(runtime.ui?.groupThreadDescriptionByChat?.[chat.id] || group.description || ''))}</textarea>
                                <select class="social-neo-select" name="groupVisibility">
                                    <option value="public" ${text(runtime.ui?.groupThreadVisibilityByChat?.[chat.id] || group.visibility || 'public') === 'public' ? 'selected' : ''}>Public</option>
                                    <option value="private" ${text(runtime.ui?.groupThreadVisibilityByChat?.[chat.id] || group.visibility || '') === 'private' ? 'selected' : ''}>Private</option>
                                </select>
                                <input class="social-neo-input" type="url" name="groupAvatarUrl" placeholder="Avatar image URL" value="${escape(text(runtime.ui?.groupThreadAvatarUrlByChat?.[chat.id] || group.avatarImage || ''))}">
                                ${renderFileChip(runtime.ui?.groupThreadAvatarFileByChat?.[chat.id] || null, 'Avatar image ready')}
                                <label class="${messageUploadTriggerClass}">
                                    <i class="fas fa-image"></i> Upload avatar
                                    <input name="groupAvatarFile" data-chat-id="${escape(text(chat.id))}" type="file" accept="image/*" hidden>
                                </label>
                                <input class="social-neo-input" type="url" name="groupBannerUrl" placeholder="Banner image URL" value="${escape(text(runtime.ui?.groupThreadBannerUrlByChat?.[chat.id] || group.bannerImage || ''))}">
                                ${renderFileChip(runtime.ui?.groupThreadBannerFileByChat?.[chat.id] || null, 'Banner image ready')}
                                <label class="${messageUploadTriggerClass}">
                                    <i class="fas fa-panorama"></i> Upload banner
                                    <input name="groupBannerFile" data-chat-id="${escape(text(chat.id))}" type="file" accept="image/*" hidden>
                                </label>
                                <div class="social-neo-form-actions">
                                    <button class="social-neo-btn social-neo-btn-primary" type="submit">Save group settings</button>
                                </div>
                            </form>
                            <div class="social-neo-divider"></div>
                            <div class="${messageSettingsFooterClass}">
                                <span class="${messageSettingsCopyClass}">Leaving keeps the group and its chat history available for the remaining members.</span>
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-leave-open" data-group-id="${escape(text(group.id))}"><i class="fas fa-sign-out-alt"></i> Leave group</button>
                            </div>
                        </section>
                    ` : ''}
                `;
            }
            return '';
        };
        const totalUnread = visibleChats.reduce((total, entry) => total + unreadMessages(entry), 0);
        const inboxSummary = messagesFilter === 'unread'
            ? 'Showing conversations that still need attention.'
            : 'Direct chats and group rooms in one controlled inbox.';

        return `
            <div class="social-neo-messages ${isGroupThread ? 'social-neo-messages-group' : ''} ${railOpen ? 'is-group-rail-open' : 'is-group-rail-closed'}">
                <section class="social-neo-card social-neo-chat-list social-neo-messages__inbox">
                    <div class="social-neo-section-head social-neo-messages__inbox-head">
                        <div class="social-neo-messages__inbox-copy">
                            <strong class="social-neo-messages__section-title">Inbox</strong>
                            <span class="social-neo-messages__section-copy">${escape(inboxSummary)}</span>
                        </div>
                        <span class="social-neo-pill social-neo-messages__count-pill">${escape(totalUnread)} unread</span>
                    </div>
                    <div class="social-neo-badge-row social-neo-messages__status-strip">
                        <span class="social-neo-pill">${escape(visibleChats.length)} threads</span>
                        <span class="social-neo-pill">${escape(chats.length)} total conversations</span>
                        ${call ? '<span class="social-neo-pill">Call active</span>' : ''}
                    </div>
                    <div class="social-neo-section-head social-neo-messages__inbox-toolbar">
                        <div><strong>Inbox view</strong></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="panel-community" data-community-tab="people"><i class="fas fa-search"></i> Find</button>
                    </div>
                    <div class="social-neo-chat-items">
                        ${visibleChats.length ? visibleChats.map((entry) => `
                            <button class="social-neo-chat-item ${chat && text(chat.id) === text(entry.id) ? 'is-active' : ''}" type="button" data-action="chat-open" data-chat-id="${escape(text(entry.id))}">
                                <div class="social-neo-person">
                                    ${renderChatAvatar(entry)}
                                    <div>
                                        <strong>${escape(chatTitle(entry))}</strong>
                                        <span>${escape(chatPreview(entry))}</span>
                                        ${text(entry.type || '') === 'group'
                                            ? `<small>${escape(groupMemberPreviewNames((groupForChat(entry)?.memberIds || entry.members || []), 3).join(', ') || 'Members listed in thread')}</small>`
                                            : `${(() => {
                                                const peer = accountById((Array.isArray(entry.members) ? entry.members : []).find((memberId) => text(memberId) !== currentUserId()) || '');
                                                return peer ? `<small>${escape(accountPresenceLabel(peer))}</small>` : '';
                                            })()}`
                                        }
                                    </div>
                                </div>
                                <div class="social-neo-stack-compact">
                                    <span>${escape(chatTime(entry))}</span>
                                    ${unreadMessages(entry) ? `<span class="social-neo-pill">${escape(unreadMessages(entry))} new</span>` : ''}
                                </div>
                            </button>
                        `).join('') : `<div class="social-neo-empty">No conversations match this inbox view yet.</div>`}
                    </div>
                </section>

                <section class="social-neo-card social-neo-messages__thread-shell">
                    ${chat ? `
                        ${isGroupThread ? `
                            <div class="social-neo-thread-group-hero">
                                ${bannerUrl ? `<img class="social-neo-thread-group-hero-img" src="${escape(bannerUrl)}" alt="${escape(text(group.name || 'Group banner'))}">` : ''}
                                <div class="social-neo-thread-group-hero-overlay"></div>
                                <div class="social-neo-thread-group-hero-content">
                                    ${groupAvatar(group)}
                                    <div>
                                        <strong>${escape(text(group.name || chatTitle(chat)))}</strong>
                                        <span>${escape(text(group.description || 'Group conversation'))}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        <div class="social-neo-thread-head social-neo-messages__thread-head">
                            <div class="social-neo-person">
                                ${isGroupThread
                                    ? groupAvatar(group, 'social-neo-avatar-sm')
                                    : avatar(accountById((Array.isArray(chat.members) ? chat.members : []).find((memberId) => text(memberId) !== currentUserId()) || '') || { displayName: chatTitle(chat) }, 'social-neo-avatar-sm')}
                                <div>
                                    <strong>${escape(chatTitle(chat))}</strong>
                                    <span>${escape(text(chat.type || 'direct') === 'group' ? `${memberIds.length} members in this room` : 'Direct conversation')}</span>
                                    ${text(chat.type || '') !== 'group' ? `${(() => {
                                        const peer = accountById((Array.isArray(chat.members) ? chat.members : []).find((memberId) => text(memberId) !== currentUserId()) || '');
                                        return peer ? `<small>${escape(accountPresenceLabel(peer))}</small>` : '';
                                    })()}` : ''}
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-messages__thread-actions">
                                ${activeMessages(chat).length > 8 ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="thread-jump-latest" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-arrow-down"></i> Latest</button>` : ''}
                                ${isGroupThread
                                    ? `<button class="social-neo-btn ${call && text(call.mode || '') === 'group' && call.active && !inCurrentCall ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="${call && text(call.mode || '') === 'group' && call.active && inCurrentCall ? 'group-call-leave' : 'group-call-join'}" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-video"></i> ${call && text(call.mode || '') === 'group' && call.active ? (inCurrentCall ? 'Leave Call' : 'Join Call') : 'Start Call'}</button>
                                       <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="members"><i class="fas fa-circle-info"></i></button>`
                                    : `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-start" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-video"></i> Call</button>
                                       <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="chat-hide-open" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-eye-slash"></i> Hide from inbox</button>`}
                            </div>
                        </div>
                        ${isGroupThread ? `
                            <div class="social-neo-group-thread-toolbar">
                                <button class="social-neo-btn ${activeGroupPanel === 'search' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="search"><i class="fas fa-search"></i> Search</button>
                                <button class="social-neo-btn ${activeGroupPanel === 'media' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="media"><i class="fas fa-image"></i> Media</button>
                                <button class="social-neo-btn ${activeGroupPanel === 'files' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="files"><i class="fas fa-folder-open"></i> Files</button>
                                <button class="social-neo-btn ${activeGroupPanel === 'links' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="links"><i class="fas fa-link"></i> Links</button>
                                <button class="social-neo-btn ${activeGroupPanel === 'members' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="members"><i class="fas fa-users"></i> Members</button>
                                <button class="social-neo-btn ${activeGroupPanel === 'invite' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="invite"><i class="fas fa-user-plus"></i> Invite</button>
                                <button class="social-neo-btn ${activeGroupPanel === 'settings' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="settings"><i class="fas fa-sliders"></i> Settings</button>
                            </div>
                            <div class="social-neo-group-thread-toolbar-summary">
                                <span class="social-neo-pill">${escape(memberIds.length)} members</span>
                                <span class="social-neo-pill">${escape(assets.files.length)} files</span>
                                <span class="social-neo-pill">${escape(assets.media.length)} media</span>
                                <span class="social-neo-pill">${escape(assets.links.length)} links</span>
                            </div>
                            ${activeGroupPanel ? `<div class="social-neo-group-thread-panel">${renderGroupPanelBody()}</div>` : ''}
                        ` : ''}
                        <div class="social-neo-thread-messages social-neo-messages__thread-stream">
                            ${activeMessages(chat).length ? activeMessages(chat).map(renderMessageCard).join('') : `<div class="social-neo-empty">No messages yet.</div>`}
                        </div>
                        ${isGroupThread ? renderGroupCallCard() : ''}
                        ${!isGroupThread && call && (text(call.chatId) === text(chat.id) || text(state().ui?.activeCallChatId) === text(chat.id)) ? `
                            <div class="social-neo-call-card">
                                <div>
                                    <strong>Call status</strong>
                                    <span>${escape(text(state().ui?.callMessage || call.status || 'Ready'))}</span>
                                </div>
                                <div class="social-neo-call-actions">
                                    ${isIncomingCall(call)
                                        ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="call-accept" data-chat-id="${escape(text(chat.id))}">Accept</button>
                                           <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-decline" data-chat-id="${escape(text(chat.id))}">Decline</button>`
                                        : `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-end" data-chat-id="${escape(text(chat.id))}">End</button>`
                                    }
                                </div>
                                ${state().ui?.callOpen ? `
                                    <div class="social-neo-call-stage">
                                        <div class="social-neo-call-video">
                                            <video id="portal-call-remote-video" autoplay playsinline></video>
                                            <span>Remote video</span>
                                        </div>
                                        <div class="social-neo-call-video">
                                            <video id="portal-call-local-video" autoplay playsinline muted></video>
                                            <span>Local preview</span>
                                        </div>
                                    </div>
                                    <div class="social-neo-inline">
                                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-mic">${state().ui?.callMicEnabled ? 'Mute mic' : 'Unmute mic'}</button>
                                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="call-camera">${state().ui?.callCameraEnabled ? 'Hide camera' : 'Show camera'}</button>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        <form class="${messageComposeFormClass} social-neo-messages__composer" data-form="send-message" data-chat-id="${escape(text(chat.id))}">
                            ${renderFileChip(messageFile)}
                            <div class="${messageComposeRowClass}">
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="message-attach" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-paperclip"></i></button>
                                <input class="${messageComposeInputClass}" id="${escape(messageBodyId)}" name="messageBody" placeholder="Aa" value="${escape(messageDraft)}">
                                <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="submit"><i class="fas fa-paper-plane"></i></button>
                            </div>
                            <input id="${escape(messageFileId)}" name="messageFile" type="file" hidden>
                        </form>
                    ` : `<div class="social-neo-empty">Pick a thread to open the conversation. Alerts stay one tap away from the inbox.</div>`}
                </section>
            </div>
        `;
    }


})();

