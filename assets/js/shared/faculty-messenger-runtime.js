/* Faculty portal messenger send/render workspace. Peeled from faculty.js.
 * Load before faculty.js.
 */
(function initWave18Peel() {
    if (window.__KIU_FACULTY_MESSENGER_LOADED) return;
    window.__KIU_FACULTY_MESSENGER_LOADED = true;

    window.__kiuCreateFacultyMessengerApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function sendPortalMessengerMessage(chatId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePortalMessengerState();
    const chat = KIU_STATE.portalMessengerChats?.[chatId];
    if (!chat || !(chat.members || []).includes(String(currentUser.id))) return;
    const input = document.getElementById('portal-messenger-message-input');
    const text = input?.value.trim() || '';
    const file = getPortalMessengerDraftFile(chatId);
    if (!text && !file) return;
    chat.messages = chat.messages || [];
    chat.messages.push({
        id: `portal_msg_${Date.now()}`,
        senderId: String(currentUser.id),
        senderName: cleanupEncodingArtifacts(toEnglishText(currentUser.nameEn || currentUser.name || currentUser.id)),
        senderRole: currentUser.role,
        text,
        file: file ? { ...file } : null,
        sentAt: new Date().toISOString()
    });
    if (input) input.value = '';
    clearPortalMessengerDraftFile(chatId);
    saveState();
    renderPortalMessengerWorkspace();
}
function renderPortalMessengerWorkspace() {
    installPortalCallGlobalListeners();
    const containers = [
        document.getElementById('portal-messenger-container'),
        document.getElementById('student-social-container')
    ].filter(Boolean);
    if (!containers.length) return;
    const currentUser = getCurrentUser();
    if (!currentUser) {
        containers.forEach(container => {
            container.innerHTML = '<div class="portal-msg-empty">Messenger is available after login.</div>';
        });
        return;
    }
    ensurePortalMessengerState();
    const uiState = ensurePortalMessengerUiState();
    const currentUserId = String(currentUser.id);
    const roleFilter = uiState.roleFilter || 'all';
    const search = uiState.search || '';
    const directory = getPortalMessengerUsers().filter(user => {
        if (String(user.id) === currentUserId) return false;
        if (roleFilter !== 'all' && user.role !== roleFilter) return false;
        const haystack = [
            user.displayName,
            user.id,
            user.email,
            user.facultyName,
            user.roleLabel
        ].filter(Boolean).join(' ').toLowerCase();
        return !search.trim() || haystack.includes(search.trim().toLowerCase());
    });
    const chats = getPortalMessengerChatsForUser(currentUserId);
    if (!uiState.activeChatId || !chats.some(chat => chat.id === uiState.activeChatId)) {
        uiState.activeChatId = chats[0]?.id || null;
    }
    const activeChat = uiState.activeChatId ? KIU_STATE.portalMessengerChats[uiState.activeChatId] : null;
    const activeDraft = activeChat ? getPortalMessengerDraftFile(activeChat.id) : null;
    const messengerFaculty = normalizeFacultyCode(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty(), 'ECON');
    const html = `
        <div class="portal-msg-page-shell">
        <div class="portal-msg-page-top">
            <div>
                <div class="portal-msg-page-title">Portal Messenger</div>
                <div class="portal-msg-page-copy">Search students, professors, and teaching assistants, open private chats, and share files inside the portal.</div>
            </div>
            <div class="portal-msg-page-pills">
                <span class="portal-msg-pill is-role">
                    <i class="fas fa-user-shield"></i> ${escapeHtml(getPortalMessengerRoleLabel(currentUser.role))}
                </span>
                <span class="portal-msg-pill">
                    <i class="fas fa-building"></i> ${escapeHtml(getFacultyLabel(messengerFaculty))}
                </span>
            </div>
        </div>
        <div class="portal-msg-shell">
            <div class="portal-msg-panel">
                <div class="portal-msg-panel-title">Find People</div>
                <input type="text" class="portal-msg-search is-compact" value="${escapeHtml(search)}" data-legacy-input="setPortalMessengerSearch(this.value)" placeholder="Search by name, ID, email, faculty...">
                <div class="portal-msg-filter-row">
                    ${[
                        ['all', 'All'],
                        [USER_ROLES.STUDENT, 'Students'],
                        [USER_ROLES.PROFESSOR, 'Professors'],
                        [USER_ROLES.TA, 'TAs']
                    ].map(([value, label]) => `
                        <button type="button" class="portal-msg-chip${roleFilter === value ? ' is-active' : ''}" data-legacy-click="setPortalMessengerRoleFilter('${value}')">
                            ${label}
                        </button>
                    `).join('')}
                </div>
                <div class="portal-msg-list portal-msg-list--capped">
                    ${directory.length ? directory.map(person => `
                        <div class="portal-msg-card">
                            <div class="portal-msg-card-main">
                                <div class="portal-msg-card-title">${escapeHtml(person.displayName)}</div>
                                <div class="portal-msg-card-meta">${escapeHtml(person.roleLabel)} | ${escapeHtml(person.facultyName)}</div>
                                <div class="portal-msg-card-sub">${escapeHtml(person.email || getSafeInstitutionalEmail(person))}</div>
                            </div>
                            <button class="lux-primary-btn portal-msg-inline-btn" data-legacy-click="openPortalDirectChat('${escapeHtml(String(person.id))}')"><i class="fas fa-comments"></i> Message</button>
                        </div>
                    `).join('') : '<div class="portal-msg-empty">No people matched your search.</div>'}
                </div>
            </div>
            <div class="portal-msg-panel">
                <div class="portal-msg-panel-head">
                    <div class="portal-msg-panel-title">Private Chats</div>
                    <div class="portal-msg-panel-meta">${chats.length} active</div>
                </div>
                <div class="portal-msg-list portal-msg-list--capped">
                    ${chats.length ? chats.map(chat => `
                        <button type="button" class="portal-msg-chat-item${uiState.activeChatId === chat.id ? ' is-active' : ''}" data-legacy-click="openPortalMessengerChat('${chat.id}')">
                            <div class="portal-msg-card-main">
                                <div class="portal-msg-card-title">${escapeHtml(getPortalMessengerDisplayNameForChat(chat, currentUserId))}</div>
                                <div class="portal-msg-card-meta">${escapeHtml(getPortalMessengerMessagePreview(chat))}</div>
                            </div>
                        </button>
                    `).join('') : '<div class="portal-msg-empty">Start a private conversation from the directory.</div>'}
                </div>
            </div>
            <div class="portal-msg-panel portal-msg-thread-panel">
                ${activeChat ? `
                    <div class="portal-msg-thread-head">
                        <div>
                            <div class="portal-msg-thread-title">${escapeHtml(getPortalMessengerDisplayNameForChat(activeChat, currentUserId))}</div>
                            <div class="portal-msg-thread-copy">${escapeHtml((activeChat.members || []).map(memberId => {
                                const user = getPortalMessengerUserById(memberId);
                                return user ? `${user.displayName} (${user.roleLabel})` : memberId;
                            }).join(', '))}</div>
                        </div>
                        <div class="portal-msg-thread-badge">Private chat</div>
                    </div>
                    <div class="portal-messenger-chat-log portal-msg-chat-log">
                        ${(activeChat.messages || []).length ? activeChat.messages.map(message => {
                            const mine = String(message.senderId) === currentUserId;
                            return `
                                <div class="portal-msg-bubble-row${mine ? ' is-mine' : ''}">
                                    <div class="portal-msg-bubble-meta">${escapeHtml(message.senderName || message.senderId)} | ${escapeHtml(getPortalMessengerRoleLabel(message.senderRole))} | ${escapeHtml(formatLmsDateTime(message.sentAt))}</div>
                                    <div class="portal-msg-bubble${mine ? ' is-mine' : ''}">
                                        ${message.text ? `<div class="portal-msg-bubble-text">${escapeHtml(message.text)}</div>` : ''}
                                        ${message.file ? `<div class="portal-msg-bubble-file">${mine
                                            ? `<a href="${message.file.dataUrl}" download="${escapeHtml(message.file.name)}"><i class="fas fa-file-download"></i> ${escapeHtml(message.file.name)}</a>`
                                            : getStoredFileDownloadHtml(message.file, message.file.name)}</div>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('') : '<div class="portal-msg-thread-empty-wrap"><div class="portal-msg-thread-empty-title">No messages yet</div><div class="portal-msg-thread-empty-copy">Start the conversation.</div></div>'}
                    </div>
                    <div class="portal-msg-composer-wrap">
                        <div data-legacy-dragover="handlePortalMessengerDragOver(event)" data-legacy-drop="handlePortalMessengerDrop(event, '${activeChat.id}')" class="portal-msg-composer">
                            <textarea id="portal-messenger-message-input" class="portal-msg-textarea is-compact" placeholder="Write a private message..."></textarea>
                            <div class="portal-msg-composer-note">Drag and drop a file here or use the attach button.</div>
                        </div>
                        <div class="portal-msg-composer-footer">
                            <div id="portal-messenger-attachment-label" class="portal-msg-attachment-label">${activeDraft?.name ? `<i class="fas fa-paperclip"></i> ${escapeHtml(activeDraft.name)}` : 'No file selected'}</div>
                            <div class="portal-msg-actions">
                                <button class="lux-secondary-btn portal-msg-inline-btn" data-legacy-click="pickPortalMessengerFile('${activeChat.id}')"><i class="fas fa-paperclip"></i> Attach File</button>
                                <button class="lux-primary-btn portal-msg-inline-btn" data-legacy-click="sendPortalMessengerMessage('${activeChat.id}')"><i class="fas fa-paper-plane"></i> Send</button>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="portal-msg-thread-empty-wrap">
                        <div class="portal-msg-thread-empty-title">No active conversation yet</div>
                        <div class="portal-msg-thread-empty-copy">Search for a student, professor, or teaching assistant and click Message to start chatting.</div>
                    </div>
                `}
            </div>
        </div>
        </div>
    `;
    containers.forEach(container => {
    container.innerHTML = localizeHtmlMarkup(html);
    });
    document.querySelectorAll('.portal-messenger-chat-log').forEach(log => {
        log.scrollTop = log.scrollHeight;
    });
}

        const api = {
            sendPortalMessengerMessage,
            renderPortalMessengerWorkspace,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateFacultyMessengerApi({});
})();

