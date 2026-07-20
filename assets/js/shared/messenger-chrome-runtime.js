/* Messenger drag/drop/search/chrome click helpers. Peeled from messenger.js.
 * Load before messenger.js.
 */
(function initWave18Peel() {
    if (window.__KIU_MESSENGER_CHROME_LOADED) return;
    window.__KIU_MESSENGER_CHROME_LOADED = true;

    window.__kiuCreateMessengerChromeApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function handlePortalMessengerDragOver(event) {
    event.preventDefault();
}
function handlePortalMessengerDrop(event, chatId) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    setPortalMessengerDraftFile(chatId, file);
}
function setPortalMessengerSearch(value) {
    ensurePortalMessengerUiState().search = value || '';
    renderPortalMessengerWorkspace();
}
function setPortalMessengerRoleFilter(value) {
    ensurePortalMessengerUiState().roleFilter = value || 'all';
    renderPortalMessengerWorkspace();
}
function setPortalMessengerCompactSearch(value) {
    ensurePortalMessengerUiState().compactSearch = value || '';
    renderPortalMessengerWorkspace();
}
function handlePortalMessengerChromeClick(event) {
    const actionEl = event.target.closest('[data-portal-msg-click]');
    if (!actionEl) return;
    const action = String(actionEl.dataset.portalMsgClick || '').trim();
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    if (action === 'open-direct-chat') {
        openPortalDirectChat(actionEl.dataset.portalMsgUserId || '', actionEl.dataset.portalMsgSource || 'full');
        return;
    }
    if (action === 'open-chat') {
        openPortalMessengerChat(actionEl.dataset.portalMsgChatId || '', actionEl.dataset.portalMsgSource || 'full');
        return;
    }
    if (action === 'toggle-favorite') {
        togglePortalMessengerFavorite(actionEl.dataset.portalMsgChatId || '');
        return;
    }
    if (action === 'set-reply-target') {
        setPortalMessengerReplyTarget(actionEl.dataset.portalMsgChatId || '', actionEl.dataset.portalMsgMessageId || '');
        return;
    }
    if (action === 'remove-message') {
        removePortalMessengerMessage(actionEl.dataset.portalMsgChatId || '', actionEl.dataset.portalMsgMessageId || '');
        return;
    }
    if (action === 'open-call') {
        openPortalMessengerCall(actionEl.dataset.portalMsgChatId || '');
        return;
    }
    if (action === 'toggle-pin') {
        togglePortalMessengerPin(actionEl.dataset.portalMsgChatId || '');
        return;
    }
    if (action === 'remove-chat') {
        removePortalMessengerChat(actionEl.dataset.portalMsgChatId || '');
        return;
    }
    if (action === 'delete-conversation') {
        deletePortalMessengerConversation(actionEl.dataset.portalMsgChatId || '');
        return;
    }
    if (action === 'set-compact-tab') {
        setPortalMessengerCompactTab(actionEl.dataset.portalMsgValue || 'chats');
        return;
    }
    if (action === 'respond-request') {
        respondToPortalMessengerRequest(actionEl.dataset.portalMsgChatId || '', actionEl.dataset.portalMsgAccept === 'true');
        return;
    }
    if (action === 'clear-reply-target') {
        clearPortalMessengerReplyTarget(actionEl.dataset.portalMsgChatId || '');
        renderPortalMessengerWorkspace();
        return;
    }
    if (action === 'pick-file') {
        pickPortalMessengerFile(actionEl.dataset.portalMsgChatId || '');
        return;
    }
    if (action === 'send-message') {
        sendPortalMessengerMessage(actionEl.dataset.portalMsgChatId || '', actionEl.dataset.portalMsgInputId || 'portal-messenger-message-input');
        return;
    }
    if (action === 'close-group-composer') {
        closePortalMessengerGroupComposer();
        return;
    }
    if (action === 'toggle-group-member') {
        togglePortalMessengerGroupMember(actionEl.dataset.portalMsgUserId || '');
        return;
    }
    if (action === 'create-group-chat') {
        createPortalMessengerGroupChat();
        return;
    }
    if (action === 'open-full') {
        openPortalMessengerFullModal();
        return;
    }
    if (action === 'set-role-filter') {
        setPortalMessengerRoleFilter(actionEl.dataset.portalMsgValue || 'all');
        return;
    }
    if (action === 'set-chat-section') {
        setPortalMessengerChatSection(actionEl.dataset.portalMsgValue || 'private');
        return;
    }
    if (action === 'open-group-composer') {
        openPortalMessengerGroupComposer();
        return;
    }
    if (action === 'close-call') {
        closePortalMessengerCall();
        return;
    }
    if (action === 'toggle-mic') {
        togglePortalCallMic();
        return;
    }
    if (action === 'toggle-camera') {
        togglePortalCallCamera();
        return;
    }
    if (action === 'toggle-ptt') {
        togglePortalCallPushToTalk();
        return;
    }
    if (action === 'begin-shortcut-capture') {
        beginPortalCallShortcutCapture();
        return;
    }
    if (action === 'accept-call') {
        acceptPortalMessengerCall();
        return;
    }
    if (action === 'decline-call') {
        declinePortalMessengerCall();
        return;
    }
    if (action === 'open-chat-and-close-call') {
        openPortalMessengerChat(actionEl.dataset.portalMsgChatId || '', actionEl.dataset.portalMsgSource || 'full');
        closePortalMessengerCall();
        return;
    }
    if (action === 'toggle-dock') {
        const forceRaw = actionEl.dataset.portalMsgForceOpen;
        togglePortalMessengerDock(forceRaw === undefined || forceRaw === '' ? null : forceRaw === 'true');
        return;
    }
    if (action === 'close-full') {
        closePortalMessengerFullModal();
        return;
    }
    if (action === 'switch-dock') {
        switchPortalMessengerToDock();
        return;
    }
    if (action === 'queue-lms-session') {
        queueFacultyLmsSession(actionEl.dataset.portalMsgCourseId || '', actionEl.dataset.portalMsgGroupId || '');
    }
}

        const api = {
            handlePortalMessengerDragOver,
            handlePortalMessengerDrop,
            setPortalMessengerSearch,
            setPortalMessengerRoleFilter,
            setPortalMessengerCompactSearch,
            handlePortalMessengerChromeClick,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateMessengerChromeApi({});
})();

