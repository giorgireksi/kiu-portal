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
        groupNotificationPreference,
        chatTitle,
        chatPreview,
        chatTime,
        renderFileChip,
        facultyLabel,
        roleLabel,
        isIncomingCall,
        escape,
        unreadNotifications,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        root,
        setActiveChat,
        hidePortalMessengerChat,
        openPortalDirectChat,
        startPortalCall,
        acceptPortalCall,
        declinePortalCall,
        endPortalCall,
        togglePortalCallMic,
        togglePortalCallCamera,
        closeDialog,
        sendPortalMessage,
        deletePortalChatMessage,
        invalidateSocialRenderCache,
        activeChat
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
        || typeof groupNotificationPreference !== 'function'
        || typeof chatTitle !== 'function'
        || typeof chatPreview !== 'function'
        || typeof chatTime !== 'function'
        || typeof renderFileChip !== 'function'
        || typeof facultyLabel !== 'function'
        || typeof roleLabel !== 'function'
        || typeof isIncomingCall !== 'function'
        || typeof escape !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof root !== 'function'
        || typeof setActiveChat !== 'function'
        || typeof hidePortalMessengerChat !== 'function'
        || typeof openPortalDirectChat !== 'function'
        || typeof startPortalCall !== 'function'
        || typeof acceptPortalCall !== 'function'
        || typeof declinePortalCall !== 'function'
        || typeof endPortalCall !== 'function'
        || typeof togglePortalCallMic !== 'function'
        || typeof togglePortalCallCamera !== 'function'
        || typeof closeDialog !== 'function'
        || typeof sendPortalMessage !== 'function'
        || typeof deletePortalChatMessage !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof activeChat !== 'function'
    ) {
        throw new Error('Social messages hooks are unavailable.');
    }

    window.renderMessagesThreadShell = function renderMessagesThreadShell(chat, options = {}) {
        const emptyCopy = text(options?.emptyCopy || '') || 'Pick a thread to open the conversation. Alerts stay one tap away from the inbox.';
        if (!chat) {
            return `<section class="social-neo-messages__thread-shell"><div class="social-neo-empty">${escape(emptyCopy)}</div></section>`;
        }
        const runtime = state();
        const call = callForChat(chat.id) || currentCall();
        const messageDraft = text(runtime.ui?.messageDraftByChat?.[chat.id] || '');
        const messageFile = runtime.ui?.messageFileByChat?.[chat.id] || null;
        const messageBodyId = controlId('messageBody', text(chat.id || 'thread'));
        const messageFileId = controlId('messageFile', text(chat.id || 'thread'));
        const group = groupForChat(chat);
        const isGroupThread = Boolean(text(chat?.type || '') === 'group' && group);
        const activeGroupPanel = text(runtime.ui?.groupThreadPanelByChat?.[chat.id] || '');
        const searchQuery = text(runtime.ui?.groupThreadSearchByChat?.[chat.id] || '');
        const searchResults = isGroupThread ? searchGroupMessages(chat, searchQuery) : [];
        const searchIndex = Number(runtime.ui?.groupThreadSearchIndexByChat?.[chat.id] || 0);
        const searchMatchMessageIds = new Set(searchResults.map((r) => text(r.message?.id || '')));
        const searchActiveMessageId = searchResults.length && searchIndex < searchResults.length ? text(searchResults[searchIndex]?.message?.id || '') : '';
        const jumpMessageId = text(runtime.ui?.groupThreadJumpMessageByChat?.[chat.id] || '');
        const bannerUrl = groupBanner(group);
        const currentParticipants = currentCallParticipants(call);
        const inCurrentCall = viewerInCall(call);
        const memberIds = Array.isArray(group?.memberIds) ? group.memberIds : [];
        const messageCardHeadClass = 'social-neo-inline social-neo-inline-between-gap-8-wrap social-neo-msg-card-head';
        const messageCardMetaClass = 'social-neo-inline social-neo-inline-gap-8-wrap social-neo-msg-card-meta';
        const messageComposeFormClass = 'social-neo-thread-compose social-neo-msg-compose-form';
        const messageComposeRowClass = 'social-neo-comment-compose social-neo-msg-compose-row';
        const messageComposeInputClass = 'social-neo-input social-neo-input-flex-1-180 social-neo-msg-compose-input';
        const truncateText = (value, max = 72) => {
            const raw = text(value);
            if (!raw) return '';
            return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
        };
        const renderMessageCard = (message) => {
            const own = text(message.senderId) === currentUserId();
            const sender = accountById(message.senderId) || { id: message.senderId };
            const links = messageLinks(message);
            const seenByOthers = (Array.isArray(message?.seenBy) ? message.seenBy : []).filter((userId) => text(userId) !== text(message.senderId));
            const isSearchMatch = searchMatchMessageIds.has(text(message.id));
            const isSearchActive = searchActiveMessageId === text(message.id);
            return `
                <article class="social-neo-message ${own ? 'is-own' : ''} ${jumpMessageId === text(message.id) ? 'is-highlighted' : ''} ${isSearchMatch ? 'is-search-match' : ''} ${isSearchActive ? 'is-search-active' : ''}" id="${escape(messageAnchorId(chat.id, message.id))}" data-msg-id="${escape(text(message.id))}">
                    ${isGroupThread ? `
                        <div class="${messageCardHeadClass}">
                            <div class="${messageCardMetaClass}">
                                <strong class="social-neo-message__sender">${escape(displayName(sender))}</strong>
                            </div>
                            ${own ? `<button class="lux-ghost-btn social-neo-message__remove" type="button" data-action="message-delete-open" data-chat-id="${escape(text(chat.id))}" data-message-id="${escape(text(message.id))}" aria-label="Remove message"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    ` : own ? `
                        <div class="${messageCardHeadClass}">
                            <button class="lux-ghost-btn social-neo-message__remove" type="button" data-action="message-delete-open" data-chat-id="${escape(text(chat.id))}" data-message-id="${escape(text(message.id))}" aria-label="Remove message"><i class="fas fa-trash"></i></button>
                        </div>
                    ` : ''}
                    ${message.text ? `<p>${renderLinkedMessageText(message.text)}</p>` : ''}
                    ${message.file ? filePreview(message.file) : ''}
                    ${links.length ? `<div class="social-neo-link-row">${links.map((url) => `<a class="lux-ghost-btn" href="${escape(url)}" target="_blank" rel="noopener"><i class="fas fa-link"></i> ${escape(url.replace(/^https?:\/\//i, ''))}</a>`).join('')}</div>` : ''}
                    <span>${escape(when(message.sentAt))}${own && seenByOthers.length ? ` • Seen by ${escape(seenByOthers.length)}` : ''}</span>
                </article>
            `;
        };
        const renderGroupCallCard = () => {
            if (!call || text(call.mode || '') !== 'group' || text(call.chatId) !== text(chat.id)) return '';
            return `
                <div class="social-neo-call-card social-neo-call-card-group">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Group call room</strong>
                            <span>${escape(text(runtime.ui?.callMessage || (call.active ? 'Group call live.' : 'No active call.')))}</span>
                        </div>
                        <div class="social-neo-inline">
                            ${call.active && !inCurrentCall ? `<button class="lux-primary-btn" type="button" data-action="group-call-join" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-phone-volume"></i> Join</button>` : ''}
                            ${call.active && inCurrentCall ? `<button class="lux-secondary-btn" type="button" data-action="group-call-leave" data-chat-id="${escape(text(chat.id))}">Leave</button>` : ''}
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
                            <button class="lux-secondary-btn" type="button" data-action="call-mic">${state().ui?.callMicEnabled ? 'Mute mic' : 'Unmute mic'}</button>
                            <button class="lux-secondary-btn" type="button" data-action="call-camera">${state().ui?.callCameraEnabled ? 'Hide camera' : 'Show camera'}</button>
                        </div>
                    ` : ''}
                </div>
            `;
        };
        return `
            <section class="social-neo-messages__thread-shell">
                <div class="social-neo-messages__thread-chrome">
                    ${isGroupThread ? `
                        <div class="social-neo-thread-head social-neo-messages__thread-head is-group">
                            ${bannerUrl ? `
                                <div class="social-neo-thread-head__banner" aria-hidden="true">
                                    <img src="${escape(bannerUrl)}" alt="">
                                    <span class="social-neo-thread-head__banner-overlay"></span>
                                </div>
                            ` : ''}
                            <div class="social-neo-thread-head__main">
                                <div class="social-neo-person">
                                    ${groupAvatar(group, 'social-neo-avatar-md')}
                                    <div class="social-neo-thread-head__meta">
                                        <strong>${escape(text(group.name || chatTitle(chat)))}</strong>
                                        <span class="social-neo-thread-head__subtitle">${escape(memberIds.length)} members${group.description ? ` · ${escape(truncateText(group.description))}` : ''}</span>
                                    </div>
                                </div>
                                <div class="social-neo-inline social-neo-messages__thread-actions">
                                    ${activeMessages(chat).length > 8 ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="thread-jump-latest" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-arrow-down"></i></button>` : ''}
                                    <button class="lux-secondary-btn ${call && text(call.mode || '') === 'group' && call.active && !inCurrentCall ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="${call && text(call.mode || '') === 'group' && call.active && inCurrentCall ? 'group-call-leave' : 'group-call-join'}" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-video"></i> ${call && text(call.mode || '') === 'group' && call.active ? (inCurrentCall ? 'Leave' : 'Join') : 'Call'}</button>
                                </div>
                            </div>
                        </div>
                        <div class="social-neo-group-thread-toolbar is-compact" role="toolbar" aria-label="Group thread tools">
                            <button class="lux-secondary-btn ${activeGroupPanel === 'search' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="search" aria-label="Search" title="Search"><i class="fas fa-search"></i></button>
                            <button class="lux-secondary-btn ${activeGroupPanel === 'media' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="media" aria-label="Media" title="Media"><i class="fas fa-image"></i></button>
                            <button class="lux-secondary-btn ${activeGroupPanel === 'members' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="members" aria-label="Members" title="Members"><i class="fas fa-users"></i></button>
                            <button class="lux-secondary-btn ${activeGroupPanel === 'files' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="files" aria-label="Files" title="Files"><i class="fas fa-folder-open"></i></button>
                            <button class="lux-secondary-btn ${activeGroupPanel === 'links' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="links" aria-label="Links" title="Links"><i class="fas fa-link"></i></button>
                            <button class="lux-secondary-btn ${activeGroupPanel === 'invite' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="invite" aria-label="Invite" title="Invite"><i class="fas fa-user-plus"></i></button>
                            <button class="lux-secondary-btn ${activeGroupPanel === 'settings' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="group-thread-panel-toggle" data-chat-id="${escape(text(chat.id))}" data-panel="settings" aria-label="Settings" title="Settings"><i class="fas fa-sliders"></i></button>
                        </div>
                        ${activeGroupPanel === 'search' ? `
                        <div class="social-neo-search-bar" role="search" aria-label="Search in conversation">
                            <i class="fas fa-search social-neo-search-bar-icon" aria-hidden="true"></i>
                            <input class="social-neo-search-bar-input" type="search" data-bind="group-thread-search" data-chat-id="${escape(text(chat.id))}" placeholder="Search messages..." value="${escape(searchQuery)}" autofocus>
                            ${searchQuery && searchResults.length ? `<span class="social-neo-search-bar-counter">${escape(searchIndex + 1)} of ${escape(searchResults.length)}</span>` : searchQuery ? '<span class="social-neo-search-bar-counter social-neo-search-bar-counter-empty">0 results</span>' : ''}
                            ${searchResults.length > 1 ? `
                                <button class="lux-secondary-btn lux-secondary-btn-xs" type="button" data-action="group-thread-search-prev" data-chat-id="${escape(text(chat.id))}" aria-label="Previous match" title="Previous"><i class="fas fa-chevron-up"></i></button>
                                <button class="lux-secondary-btn lux-secondary-btn-xs" type="button" data-action="group-thread-search-next" data-chat-id="${escape(text(chat.id))}" aria-label="Next match" title="Next"><i class="fas fa-chevron-down"></i></button>
                            ` : ''}
                            <button class="lux-secondary-btn lux-secondary-btn-xs" type="button" data-action="group-thread-search-clear" data-chat-id="${escape(text(chat.id))}" aria-label="Close search" title="Close"><i class="fas fa-times"></i></button>
                        </div>
                        ` : ''}
                    ` : `
                        <div class="social-neo-thread-head social-neo-messages__thread-head">
                            <div class="social-neo-person">
                                ${avatar(accountById((Array.isArray(chat.members) ? chat.members : []).find((memberId) => text(memberId) !== currentUserId()) || '') || { displayName: chatTitle(chat) }, 'social-neo-avatar-sm')}
                                <div>
                                    <strong>${escape(chatTitle(chat))}</strong>
                                    <span>${escape('Direct conversation')}</span>
                                    ${(() => {
                                        const peer = accountById((Array.isArray(chat.members) ? chat.members : []).find((memberId) => text(memberId) !== currentUserId()) || '');
                                        return peer ? `<small>${escape(accountPresenceLabel(peer))}</small>` : '';
                                    })()}
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-messages__thread-actions">
                                ${activeMessages(chat).length > 8 ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="thread-jump-latest" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-arrow-down"></i> Latest</button>` : ''}
                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="call-start" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-video"></i> Call</button>
                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="chat-hide-open" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-eye-slash"></i></button>
                            </div>
                        </div>
                    `}
                </div>
                <div class="social-neo-messages__thread-scroll">
                    <div class="social-neo-thread-messages social-neo-messages__thread-stream" data-lux-transparency-exempt="1">
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
                                    ? `<button class="lux-primary-btn" type="button" data-action="call-accept" data-chat-id="${escape(text(chat.id))}">Accept</button>
                                       <button class="lux-secondary-btn" type="button" data-action="call-decline" data-chat-id="${escape(text(chat.id))}">Decline</button>`
                                    : `<button class="lux-secondary-btn" type="button" data-action="call-end" data-chat-id="${escape(text(chat.id))}">End</button>`
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
                                    <button class="lux-secondary-btn" type="button" data-action="call-mic">${state().ui?.callMicEnabled ? 'Mute mic' : 'Unmute mic'}</button>
                                    <button class="lux-secondary-btn" type="button" data-action="call-camera">${state().ui?.callCameraEnabled ? 'Hide camera' : 'Show camera'}</button>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <form class="${messageComposeFormClass} social-neo-messages__composer" data-form="send-message" data-chat-id="${escape(text(chat.id))}">
                    ${renderFileChip(messageFile)}
                    <div class="${messageComposeRowClass}">
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="message-attach" data-chat-id="${escape(text(chat.id))}"><i class="fas fa-paperclip"></i></button>
                        <input class="${messageComposeInputClass}" id="${escape(messageBodyId)}" name="messageBody" placeholder="Aa" value="${escape(messageDraft)}">
                        <button class="lux-primary-btn lux-secondary-btn-sm" type="submit"><i class="fas fa-paper-plane"></i></button>
                    </div>
                    <input id="${escape(messageFileId)}" name="messageFile" type="file" hidden>
                </form>
            </section>
        `;
    };

    window.renderMessagesPanel = function renderMessagesPanel() {
        const runtime = state();
        const chats = activeChats();
        const messagesFilter = text(runtime.ui?.messagesFilter || 'all') || 'all';
        const visibleChats = messagesFilter === 'unread' ? chats.filter((entry) => unreadMessages(entry) > 0) : chats;
        const activeChatId = text(runtime.ui?.activeChatId || '');
        const chat = visibleChats.find((entry) => text(entry.id) === activeChatId) || visibleChats[0] || null;
        const group = groupForChat(chat);
        const isGroupThread = Boolean(chat && text(chat?.type || '') === 'group' && group);
        const railOpen = runtime.ui?.groupThreadRailOpen !== false;
        const renderChatAvatar = (entry) => {
            const entryGroup = groupForChat(entry);
            if (text(entry?.type || '') === 'group' && entryGroup) return groupAvatar(entryGroup, 'social-neo-avatar-sm');
            return avatar(accountById((Array.isArray(entry?.members) ? entry.members : []).find((memberId) => text(memberId) !== currentUserId()) || '') || { displayName: chatTitle(entry) }, 'social-neo-avatar-sm');
        };
        const chatCount = chats.length;
        const totalUnreadAll = chats.reduce((total, entry) => total + unreadMessages(entry), 0);
        const inboxSubtitle = messagesFilter === 'unread'
            ? (totalUnreadAll ? `${totalUnreadAll} unread conversations` : "You're caught up")
            : `${chatCount} conversations`;
        const inboxEmptyTitle = messagesFilter === 'unread' ? "You're caught up" : 'No conversations yet';
        const inboxEmptyCopy = messagesFilter === 'unread'
            ? 'No unread messages right now.'
            : 'Start one from Community.';
        const totalUnreadAlerts = typeof unreadNotifications === 'function' ? unreadNotifications() : 0;
        const alertsBadgeLabel = totalUnreadAlerts > 9 ? '9+' : String(totalUnreadAlerts);
        const alertsAriaLabel = totalUnreadAlerts
            ? `Open alerts, ${totalUnreadAlerts > 9 ? '9 plus' : totalUnreadAlerts} unread`
            : 'Open alerts';
        return `
            <div class="social-neo-messages ${isGroupThread ? 'social-neo-messages-group' : ''} ${railOpen ? 'is-group-rail-open' : 'is-group-rail-closed'}">
                <section class="social-neo-chat-list social-neo-messages__inbox">
                    <header class="social-neo-messages__inbox-header">
                        <div class="social-neo-messages__inbox-toolbar">
                            <div class="social-neo-messages__inbox-title-block">
                                <strong class="social-neo-messages__section-title">Inbox</strong>
                                <span class="social-neo-messages__inbox-subtitle">${escape(inboxSubtitle)}</span>
                            </div>
                            <div class="social-neo-messages__inbox-toolbar-actions">
                                <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn-icon" type="button" aria-label="Find people" data-action="panel-community" data-community-tab="people"><i class="fas fa-search" aria-hidden="true"></i></button>
                                <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn-icon social-neo-messages__inbox-alerts-btn" type="button" data-action="panel-alerts" data-alerts-filter="unread" aria-label="${escape(alertsAriaLabel)}"><i class="fas fa-bell" aria-hidden="true"></i>${totalUnreadAlerts ? `<span class="social-neo-messages__inbox-alerts-badge" aria-hidden="true">${escape(alertsBadgeLabel)}</span>` : ''}</button>
                            </div>
                        </div>
                        <div class="social-neo-messages__inbox-tabs-row">
                            <div class="social-neo-messages__inbox-filters" role="tablist" aria-label="Inbox filters">
                                <button class="social-neo-tab ${messagesFilter === 'all' ? 'is-active' : ''}" type="button" role="tab" aria-selected="${messagesFilter === 'all' ? 'true' : 'false'}" aria-pressed="${messagesFilter === 'all' ? 'true' : 'false'}" data-action="panel-messages" data-messages-filter="all">Chats</button>
                                <button class="social-neo-tab ${messagesFilter === 'unread' ? 'is-active' : ''}" type="button" role="tab" aria-selected="${messagesFilter === 'unread' ? 'true' : 'false'}" aria-pressed="${messagesFilter === 'unread' ? 'true' : 'false'}" data-action="panel-messages" data-messages-filter="unread">Unread${totalUnreadAll ? `<span class="social-neo-tab-badge">${escape(totalUnreadAll > 9 ? '9+' : totalUnreadAll)}</span>` : ''}</button>
                            </div>
                        </div>
                    </header>
                    <div class="social-neo-chat-items" data-lux-transparency-exempt="1">
                        ${visibleChats.length ? visibleChats.map((entry) => {
                            const unreadCount = unreadMessages(entry);
                            const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount);
                            return `
                            <button class="social-neo-chat-item ${chat && text(chat.id) === text(entry.id) ? 'is-active' : ''} ${unreadCount ? 'is-unread' : ''}" type="button" data-action="chat-open" data-chat-id="${escape(text(entry.id))}">
                                <div class="social-neo-person">
                                    ${renderChatAvatar(entry)}
                                    <div>
                                        <strong>${escape(chatTitle(entry))}</strong>
                                        <span>${escape(chatPreview(entry))}</span>
                                        ${text(entry.type || '') === 'group'
                                            ? `<small>${escape((() => {
                                                const ids = groupForChat(entry)?.memberIds || entry.members || [];
                                                const counts = {};
                                                (Array.isArray(ids) ? ids : []).forEach((id) => {
                                                    let label = roleLabel(accountById(id)?.role);
                                                    if (label === 'Teaching Assistant') label = 'TA';
                                                    if (!label || label === 'Portal User') label = 'Other';
                                                    counts[label] = (counts[label] || 0) + 1;
                                                });
                                                const parts = Object.keys(counts).map((label) => {
                                                    const n = counts[label];
                                                    const word = n > 1 && label !== 'TA'
                                                        ? (label === 'Other' ? 'Others' : `${label}s`)
                                                        : label;
                                                    return `${n} ${word}`;
                                                });
                                                return parts.join(' · ') || 'Group chat';
                                            })())}</small>`
                                            : `${(() => {
                                                const peer = accountById((Array.isArray(entry.members) ? entry.members : []).find((memberId) => text(memberId) !== currentUserId()) || '');
                                                return peer ? `<small>${escape(accountPresenceLabel(peer))}</small>` : '';
                                            })()}`
                                        }
                                    </div>
                                </div>
                                <div class="social-neo-chat-item__aside">
                                    <span class="social-neo-chat-item__time">${escape(chatTime(entry))}</span>
                                    ${unreadCount ? `<span class="social-neo-messages__unread-badge" aria-label="${escape(unreadCount)} unread">${escape(unreadLabel)}</span>` : ''}
                                </div>
                            </button>
                        `;
                        }).join('') : `
                            <div class="social-neo-messages__inbox-empty" role="status">
                                <strong class="social-neo-messages__inbox-empty-title">${escape(inboxEmptyTitle)}</strong>
                                <p class="social-neo-messages__inbox-empty-copy">${escape(inboxEmptyCopy)}</p>
                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="panel-community" data-community-tab="people">Find people</button>
                            </div>
                        `}
                    </div>
                </section>

                ${renderMessagesThreadShell(chat)}
            </div>
        `;
    }

    const MESSAGES_OWNED_DIALOG_KINDS = new Set(['message-delete', 'chat-hide']);

    function renderMessagesOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!MESSAGES_OWNED_DIALOG_KINDS.has(kind)) return '';
        const dialogChat = ['message-delete', 'chat-hide'].includes(kind)
            ? activeChats().find((item) => text(item.id) === text(dialog.chatId))
            : null;
        const dialogMessage = kind === 'message-delete' && Array.isArray(dialogChat?.messages)
            ? dialogChat.messages.find((item) => text(item.id) === text(dialog.messageId))
            : null;
        if (kind === 'message-delete') {
            if (!dialogChat || !dialogMessage) return '';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card" data-form="dialog-message-delete" data-action="noop">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Remove message', 'This will delete the message from the chat thread.') : ''}
                    <div class="lux-glass-dialog-preview">
                        ${escape(text(dialogMessage.text || dialogMessage.file?.name || 'Message attachment'))}
                    </div>
                    <label class="social-neo-item-line lux-glass-dialog-checkbox-line">
                        <input type="checkbox" name="confirmMessageDelete" value="yes">
                        <span class="lux-glass-dialog-checkbox-copy">Remove this message from the conversation.</span>
                    </label>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Remove message' }) : ''}
                    <input type="hidden" name="chatId" value="${escape(text(dialogChat.id))}">
                    <input type="hidden" name="messageId" value="${escape(text(dialogMessage.id))}">
                </form>
            </div>`;
        }
        if (kind === 'chat-hide') {
            if (!dialogChat) return '';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card" data-form="dialog-chat-hide" data-action="noop">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Hide conversation', 'This only removes the chat from your inbox view.') : ''}
                    <div class="lux-glass-dialog-preview">
                        <strong class="lux-glass-dialog-preview-title">${escape(chatTitle(dialogChat))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(chatPreview(dialogChat))}</div>
                    </div>
                    <div class="lux-glass-dialog-preview lux-glass-dialog-preview-danger">
                        Chat history will stay saved. This only hides the conversation from your inbox until you open it again or a new message arrives.
                    </div>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Hide from inbox' }) : ''}
                    <input type="hidden" name="chatId" value="${escape(text(dialogChat.id))}">
                </form>
            </div>`;
        }
        return '';
    }

window.renderMessagesOwnedDialog = renderMessagesOwnedDialog;
    window.MESSAGES_OWNED_DIALOG_KINDS = MESSAGES_OWNED_DIALOG_KINDS;

    function isSocialMessagesClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        if (a === 'directory-message' || a === 'message-start') return true;
        return a.startsWith('message-') || a.startsWith('chat-') || a.startsWith('call-') || a.startsWith('thread-');
    }

    function handleSocialMessagesClick(action, trigger) {
        if (!isSocialMessagesClickAction(action)) return false;
        if (action === 'message-delete-open') {
            return openDialog('message-delete', {
                chatId: text(trigger.getAttribute('data-chat-id')),
                messageId: text(trigger.getAttribute('data-message-id'))
            });
        }

        if (action === 'message-attach') return root()?.querySelector('input[name="messageFile"]')?.click();

        if (action === 'chat-open') {
            setActiveChat(trigger.getAttribute('data-chat-id'));
            return setPanel('messages');
        }

        if (action === 'chat-hide-open') {
            return openDialog('chat-hide', {
                chatId: text(trigger.getAttribute('data-chat-id'))
            });
        }

        if (action === 'chat-hide') {
            return withBusy(async () => {
                if (typeof hidePortalMessengerChat !== 'function') throw new Error('Chat hiding is unavailable.');
                const chatId = text(trigger.getAttribute('data-chat-id'));
                await hidePortalMessengerChat(chatId);
                const remainingChats = activeChats().filter((entry) => text(entry.id) !== chatId);
                state().ui.activeChatId = text(remainingChats[0]?.id || '');
                renderSocialPageNow('chat-hide');
            });
        }

        if (action === 'thread-jump-latest') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            const chat = activeChats().find((entry) => text(entry.id) === chatId);
            const lastMessage = Array.isArray(chat?.messages) ? chat.messages[chat.messages.length - 1] : null;
            if (lastMessage) {
                state().ui.groupThreadJumpMessageByChat = state().ui.groupThreadJumpMessageByChat || {};
                state().ui.groupThreadJumpMessageByChat[chatId] = text(lastMessage.id);
            }
            return renderSocialPageNow('thread-jump-latest');
        }

        if (action === 'directory-message' || action === 'message-start') {
            return withBusy(async () => {
                const chat = await openPortalDirectChat(trigger.getAttribute('data-user-id'));
                if (chat?.id) {
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }

        if (action === 'call-start') return withBusy(() => startPortalCall(trigger.getAttribute('data-chat-id')));

        if (action === 'call-accept') return withBusy(() => acceptPortalCall(trigger.getAttribute('data-chat-id')));

        if (action === 'call-decline') return withBusy(() => declinePortalCall(trigger.getAttribute('data-chat-id')));

        if (action === 'call-end') return withBusy(() => endPortalCall(trigger.getAttribute('data-chat-id')));

        if (action === 'call-mic') {
            if (typeof togglePortalCallMic === 'function') togglePortalCallMic();
            return;
        }

        if (action === 'call-camera') {
            if (typeof togglePortalCallCamera === 'function') togglePortalCallCamera();
            return;
        }
        return false;
    }

    window.handleSocialMessagesClick = handleSocialMessagesClick;
    window.isSocialMessagesClickAction = isSocialMessagesClickAction;

    function isSocialMessagesSubmitForm(formType) {
        const f = text(formType || '');
        return f === 'send-message' || f === 'dialog-message-delete' || f === 'dialog-chat-hide';
    }

    function handleSocialMessagesSubmit(formType, form, runtime, event) {
        if (!isSocialMessagesSubmitForm(formType)) return false;
        if (formType === 'send-message') {
            return withBusy(async () => {
                const chatId = text(form.getAttribute('data-chat-id'));
                const body = text(form.messageBody?.value || runtime.ui?.messageDraftByChat?.[chatId]);
                const file = runtime.ui?.messageFileByChat?.[chatId] || null;
                if (!body && !file) throw new Error('Write a message or attach a file first.');
                await sendPortalMessage(chatId, body, file);
                runtime.ui.messageDraftByChat[chatId] = '';
                runtime.ui.messageFileByChat[chatId] = null;
                renderSocialPageNow('message-sent');
            });
        }

        if (formType === 'dialog-message-delete') {
            return withBusy(async () => {
                if (!form.confirmMessageDelete?.checked) throw new Error('Confirm message removal first.');
                await deletePortalChatMessage(text(form.chatId?.value), text(form.messageId?.value));
                closeDialog();
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('message-delete');
            });
        }

        if (formType === 'dialog-chat-hide') {
            return withBusy(async () => {
                if (typeof hidePortalMessengerChat !== 'function') throw new Error('Chat hiding is unavailable.');
                const chatId = text(form.chatId?.value);
                await hidePortalMessengerChat(chatId);
                const remainingChats = activeChats().filter((entry) => text(entry.id) !== chatId);
                state().ui.activeChatId = text(remainingChats[0]?.id || '');
                closeDialog();
                renderSocialPageNow('chat-hide');
            });
        }
        return false;
    }

    window.handleSocialMessagesSubmit = handleSocialMessagesSubmit;
    window.isSocialMessagesSubmitForm = isSocialMessagesSubmitForm;

    function isSocialMessagesInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.closest && target.closest('form[data-form="send-message"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialMessagesInput(target, runtime, event) {
        if (!isSocialMessagesInputTarget(target)) return false;
        const messageForm = target.closest('form[data-form="send-message"]');
        if (messageForm && target.name === 'messageBody') {
            runtime.ui.messageDraftByChat = runtime.ui.messageDraftByChat || {};
            runtime.ui.messageDraftByChat[text(messageForm.getAttribute('data-chat-id'))] = target.value;
        }

        return true;
    }

    function isSocialMessagesChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.name === 'messageFile') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialMessagesChange(target, runtime, event) {
        if (!isSocialMessagesChangeTarget(target)) return false;
        if (target.name === 'messageFile') {
            const form = target.closest('form[data-form="send-message"]');
            const chatId = text(form?.getAttribute('data-chat-id') || '') || text(activeChat()?.id || '');
            if (chatId) {
                runtime.ui.messageFileByChat = runtime.ui.messageFileByChat || {};
                runtime.ui.messageFileByChat[chatId] = target.files?.[0] || null;
                renderSocialPageNow('message-file');
            }
        }

        return true;
    }

    window.handleSocialMessagesInput = handleSocialMessagesInput;
    window.isSocialMessagesInputTarget = isSocialMessagesInputTarget;
    window.handleSocialMessagesChange = handleSocialMessagesChange;
    window.isSocialMessagesChangeTarget = isSocialMessagesChangeTarget;

})();
