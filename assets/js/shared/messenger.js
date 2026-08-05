/* READABILITY: Messenger — threads, chrome, gradebook bridge hooks, send/receive UI.
 * Sections: Boot | Threads | Chrome | Send | Render
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Boot ---
/* Messenger, notifications, and social shared logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

function ensureLayoutPortalCss() {
    if (typeof document === 'undefined') return;
    if (document.querySelector('link[data-kiu-layout-portal]')) return;
    // Already linked synchronously (bare multi-route pages)
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
        String(l.getAttribute('href') || '').includes('layout-portal.css')
    );
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/css/layout-portal.css?v=20260725-legacypurge2';
    link.setAttribute('data-kiu-layout-portal', '1');
    document.head.appendChild(link);
}


// Portal Messenger V2
function ensurePortalMessengerUiState() {
    window.__portalMessengerUi = window.__portalMessengerUi || {
        activeChatId: null,
        search: '',
        roleFilter: 'all',
        dockOpen: false,
        fullOpen: false,
// --- READABILITY: Threads ---
        compactTab: 'chats',
        compactSearch: '',
        replyTargetByChat: {}
    };
    return window.__portalMessengerUi;
}
function getPortalMessengerDirectory(search = '', roleFilter = 'all') {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const currentUserId = String(currentUser.id);
    const normalizedSearch = String(search || '').trim().toLowerCase();
    if (!normalizedSearch) return [];
    return getPortalMessengerUsers().filter(user => {
        if (String(user.id) === currentUserId) return false;
        if (roleFilter !== 'all' && user.role !== roleFilter) return false;
        const haystack = [
            user.displayName,
            user.id,
            user.email,
            user.facultyName,
            user.roleLabel
        ].filter(Boolean).join(' ').toLowerCase();
        return !normalizedSearch || haystack.includes(normalizedSearch);
    });
}
function ensurePortalMessengerActiveChat(uiState, chats) {
    if (!uiState.activeChatId || !chats.some(chat => chat.id === uiState.activeChatId)) {
        uiState.activeChatId = chats[0]?.id || null;
    }
    return uiState.activeChatId;
}
function getPortalMessengerChatLastTime(chat) {
    const stamp = chat?.messages?.[chat.messages.length - 1]?.sentAt || chat?.createdAt;
    if (!stamp) return '';
    return formatLmsDateTime(stamp);
}
function getPortalMessengerSummary() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    ensurePortalMessengerState();
    const uiState = ensurePortalMessengerUiState();
    const chats = getPortalMessengerChatsForUser(String(currentUser.id));
    ensurePortalMessengerActiveChat(uiState, chats);
    const activeChat = uiState.activeChatId ? KIU_STATE.portalMessengerChats?.[uiState.activeChatId] : null;
    const activeDraft = activeChat ? getPortalMessengerDraftFile(activeChat.id) : null;
    const directory = getPortalMessengerDirectory(uiState.search, uiState.roleFilter);
    const compactDirectory = getPortalMessengerDirectory(uiState.compactSearch, 'all');
    return {
        currentUser,
        uiState,
        chats,
        activeChat,
        activeDraft,
        directory,
        compactDirectory,
        totalChatCount: chats.length
    };
}
function ensurePortalMessengerFileInput() {
    let input = document.getElementById('portal-messenger-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'portal-messenger-file-input';
        input.hidden = true;
        document.body.appendChild(input);
    }
    return input;
}
function setPortalMessengerDraftFile(chatId, file) {
    const reader = new FileReader();
    reader.onload = () => {
        window.__portalMessengerDraftFiles = window.__portalMessengerDraftFiles || {};
        window.__portalMessengerDraftFiles[chatId] = {
            id: `portal_msg_file_${Date.now()}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
            dataUrl: reader.result
        };
// --- READABILITY: Render ---
        renderPortalMessengerWorkspace();
    };
    reader.readAsDataURL(file);
}
function getPortalMessengerDraftFile(chatId) {
    return window.__portalMessengerDraftFiles?.[chatId] || null;
}
function clearPortalMessengerDraftFile(chatId) {
    if (window.__portalMessengerDraftFiles) delete window.__portalMessengerDraftFiles[chatId];
}
function resolvePortalMessengerFileUrl(file) {
    if (!file || typeof file !== 'object') return '';
    if (String(file.storageBackend || '').trim().toLowerCase() === 'bridge'
        && String(file.storageKey || '').trim()
        && typeof getPortalStoredFileUrl === 'function') {
        return getPortalStoredFileUrl(file.storageKey);
    }
    return String(file.dataUrl || '').trim();
}
async function persistPortalMessengerDraftFile(file) {
    if (!file || typeof file !== 'object') return null;
    if (String(file.storageBackend || '').trim().toLowerCase() === 'bridge' && String(file.storageKey || '').trim()) {
        return { ...file, dataUrl: '' };
    }
    if (typeof uploadPortalStoredFile === 'function' && String(file.dataUrl || '').trim()) {
        const uploaded = await uploadPortalStoredFile(file, 'messenger');
        if (uploaded?.storageKey) {
            return {
                id: file.id || `portal_msg_file_${Date.now()}`,
                name: uploaded.name || file.name || 'attachment.bin',
                type: uploaded.type || file.type || 'application/octet-stream',
                size: uploaded.size || file.size || 0,
                storageKey: uploaded.storageKey,
                storageBackend: uploaded.storageBackend || 'bridge',
                dataUrl: ''
            };
        }
    }
    return { ...file };
}
function setPortalMessengerReplyTarget(chatId, messageId) {
    const uiState = ensurePortalMessengerUiState();
    uiState.replyTargetByChat = uiState.replyTargetByChat || {};
    uiState.replyTargetByChat[String(chatId)] = String(messageId || '');
    renderPortalMessengerWorkspace();
}
function getPortalMessengerReplyTarget(chatId) {
    return String(ensurePortalMessengerUiState().replyTargetByChat?.[String(chatId)] || '');
}
function clearPortalMessengerReplyTarget(chatId) {
    const uiState = ensurePortalMessengerUiState();
    if (uiState.replyTargetByChat) delete uiState.replyTargetByChat[String(chatId)];
}
function pickPortalMessengerFile(chatId) {
    const input = ensurePortalMessengerFileInput();
    input.value = '';
    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        setPortalMessengerDraftFile(chatId, file);
    };
    input.click();
}
// --- READABILITY: Chrome ---
function handlePortalMessengerChromeInput(event) {
    const inputEl = event.target.closest('[data-portal-msg-input]');
    if (!inputEl) return;
    const action = String(inputEl.dataset.portalMsgInput || '').trim();
    if (!action) return;
    if (action === 'set-group-name') {
        setPortalMessengerGroupName(inputEl.value);
        return;
    }
    if (action === 'set-group-search') {
        setPortalMessengerGroupSearch(inputEl.value);
        return;
    }
    if (action === 'set-search') {
        setPortalMessengerSearch(inputEl.value);
        return;
    }
    if (action === 'set-compact-search') {
        setPortalMessengerCompactSearch(inputEl.value);
    }
}
function handlePortalMessengerChromeChange(event) {
    const changeEl = event.target.closest('[data-portal-msg-change]');
    if (!changeEl) return;
    const action = String(changeEl.dataset.portalMsgChange || '').trim();
    if (!action) return;
    if (action === 'set-ptt-mode') {
        setPortalCallPttMode(changeEl.value);
        return;
    }
    if (action === 'set-ptt-mouse-button') {
        setPortalCallPttMouseButton(changeEl.value);
    }
}
function handlePortalMessengerChromeDragOver(event) {
    const dropZone = event.target.closest('[data-portal-msg-drop-chat]');
    if (!dropZone) return;
    handlePortalMessengerDragOver(event);
}
function handlePortalMessengerChromeDrop(event) {
    const dropZone = event.target.closest('[data-portal-msg-drop-chat]');
    if (!dropZone) return;
    handlePortalMessengerDrop(event, dropZone.dataset.portalMsgDropChat || '');
}
function bindPortalMessengerDelegates() {
    ensureLayoutPortalCss();
    if (window.__portalMessengerDelegatesBound) return;
    window.__portalMessengerDelegatesBound = true;
    document.addEventListener('click', handlePortalMessengerChromeClick);
    document.addEventListener('input', handlePortalMessengerChromeInput);
    document.addEventListener('change', handlePortalMessengerChromeChange);
    document.addEventListener('dragover', handlePortalMessengerChromeDragOver);
    document.addEventListener('drop', handlePortalMessengerChromeDrop);
}
bindPortalMessengerDelegates();
function openPortalMessengerGroupComposer() {
    const uiState = ensurePortalMessengerUiState();
    uiState.groupComposerOpen = true;
    uiState.groupComposerName = '';
    uiState.groupComposerSearch = '';
    uiState.groupComposerMembers = [];
    renderPortalMessengerWorkspace();
}
function closePortalMessengerGroupComposer() {
    const uiState = ensurePortalMessengerUiState();
    uiState.groupComposerOpen = false;
    uiState.groupComposerName = '';
    uiState.groupComposerSearch = '';
    uiState.groupComposerMembers = [];
    renderPortalMessengerWorkspace();
}
function setPortalMessengerGroupName(value) {
    ensurePortalMessengerUiState().groupComposerName = value || '';
}
function setPortalMessengerGroupSearch(value) {
    ensurePortalMessengerUiState().groupComposerSearch = value || '';
    renderPortalMessengerWorkspace();
}
function togglePortalMessengerGroupMember(userId) {
    const uiState = ensurePortalMessengerUiState();
    const normalizedUserId = String(userId);
    uiState.groupComposerMembers = Array.isArray(uiState.groupComposerMembers) ? uiState.groupComposerMembers : [];
    if (uiState.groupComposerMembers.includes(normalizedUserId)) {
        uiState.groupComposerMembers = uiState.groupComposerMembers.filter(id => id !== normalizedUserId);
    } else {
        uiState.groupComposerMembers = [...uiState.groupComposerMembers, normalizedUserId];
    }
    renderPortalMessengerWorkspace();
}
function getPortalMessengerGroupCandidates(search = '') {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const currentUserId = String(currentUser.id);
    const normalizedSearch = String(search || '').trim().toLowerCase();
    return getPortalMessengerUsers().filter(user => {
        if (String(user.id) === currentUserId) return false;
        if (!normalizedSearch) return true;
        const haystack = [
            user.displayName,
            user.id,
            user.email,
            user.facultyName,
            user.roleLabel
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(normalizedSearch);
    });
}
function createPortalMessengerGroupChat() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const uiState = ensurePortalMessengerUiState();
    const name = String(uiState.groupComposerName || '').trim();
    const selected = (uiState.groupComposerMembers || []).map(String);
    if (!name) {
        alert('Please add a group chat name.');
        return;
    }
    if (!selected.length) {
        alert('Please select at least one person for the group chat.');
        return;
    }
    ensurePortalMessengerState();
    const chatId = buildPortalMessengerGroupChatId();
    KIU_STATE.portalMessengerChats[chatId] = {
        id: chatId,
        type: 'group',
        members: [...new Set([String(currentUser.id), ...selected])],
        name: cleanupEncodingArtifacts(toEnglishText(name)),
        createdBy: String(currentUser.id),
        createdAt: new Date().toISOString(),
        messages: []
    };
    saveState();
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('messaging', 'group-chat-created', 'chat', chatId, {
            afterState: {
                name: cleanupEncodingArtifacts(toEnglishText(name)),
                memberCount: KIU_STATE.portalMessengerChats[chatId]?.members?.length || 0
            }
        });
    }
    uiState.activeChatId = chatId;
    uiState.groupComposerOpen = false;
    uiState.groupComposerName = '';
    uiState.groupComposerSearch = '';
    uiState.groupComposerMembers = [];
    renderPortalMessengerWorkspace();
}
function setPortalMessengerCompactTab(value) {
    ensurePortalMessengerUiState().compactTab = value || 'chats';
    renderPortalMessengerWorkspace();
}
function togglePortalMessengerDock(forceOpen = null) {
    const uiState = ensurePortalMessengerUiState();
    const shouldOpen = forceOpen === null ? !uiState.fullOpen : Boolean(forceOpen);
    if (shouldOpen) openPortalMessengerFullModal();
    else closePortalMessengerFullModal();
}
function openPortalMessengerFullModal() {
    ensurePortalMessengerUiState().fullOpen = true;
    renderPortalMessengerWorkspace();
}
function closePortalMessengerFullModal() {
    ensurePortalMessengerUiState().fullOpen = false;
    renderPortalMessengerWorkspace();
}
function switchPortalMessengerToDock() {
    closePortalMessengerFullModal();
}
function consumePendingSocialMessengerLaunch() {
    const raw = localStorage.getItem('KIU_PENDING_SOCIAL_MESSENGER');
    if (!raw) return;
    let payload = null;
    try {
        payload = JSON.parse(raw);
    } catch (error) {
        payload = null;
    }
    const currentUser = getCurrentUser();
    const targetUserId = String(payload?.targetUserId || '');
    if (!currentUser) {
        localStorage.removeItem('KIU_PENDING_SOCIAL_MESSENGER');
        return;
    }
    if (targetUserId === '__OPEN__') {
        ensurePortalMessengerUiState().fullOpen = true;
        localStorage.removeItem('KIU_PENDING_SOCIAL_MESSENGER');
        return;
    }
    if (!targetUserId || String(currentUser.id) === targetUserId) {
        localStorage.removeItem('KIU_PENDING_SOCIAL_MESSENGER');
        return;
    }
    const chat = ensurePortalMessengerDirectChat(String(currentUser.id), targetUserId);
    unhidePortalMessengerChatForUser(chat.id, currentUser.id);
    const uiState = ensurePortalMessengerUiState();
    uiState.fullOpen = true;
    uiState.activeChatId = chat.id;
    localStorage.removeItem('KIU_PENDING_SOCIAL_MESSENGER');
}
function getCurrentPortalPageId() {
    const activeSectionId = document.querySelector('.page-section.active-page')?.id || '';
    if (activeSectionId) return activeSectionId.replace(/^page-/, '').toLowerCase();
    const pathname = (window.location.pathname || '').split('/').pop().toLowerCase();
    return pathname.replace(/\.html$/, '') || 'home';
}
function normalizeSocialPortalContext(context = {}) {
    const role = String(context?.role || getEffectiveUserRole() || '').toLowerCase();
    let sourcePage = String(context?.sourcePage || '').toLowerCase();
    let returnUrl = String(context?.returnUrl || 'index.html').trim() || 'index.html';
    const pathname = (window.location.pathname || '').split('/').pop().toLowerCase();
    if (!sourcePage) {
        sourcePage = getCurrentPortalPageId();
    }
    if (role === USER_ROLES.ADMIN) {
        if (sourcePage === 'admin-orders' || returnUrl.toLowerCase().startsWith('admin-orders.html') || pathname === 'admin-orders.html') {
            sourcePage = 'orders';
            returnUrl = 'admin-orders.html';
        } else if (sourcePage === 'admin-library' || returnUrl.toLowerCase().startsWith('admin-library.html') || pathname === 'admin-library.html') {
            sourcePage = 'library';
            returnUrl = 'admin-library.html';
        } else if (sourcePage === 'orders' && /^orders\.html/i.test(returnUrl)) {
            returnUrl = 'admin-orders.html';
        } else if (sourcePage === 'library' && /^library\.html/i.test(returnUrl)) {
            returnUrl = 'admin-library.html';
        }
    }
    return {
        ...context,
        sourcePage,
        returnUrl,
        role
    };
}
function rememberSocialPortalContext() {
    const pathname = (window.location.pathname || '').split('/').pop() || 'index.html';
    const normalized = normalizeSocialPortalContext({
        returnUrl: `${pathname}${window.location.search || ''}`,
        sourcePage: getCurrentPortalPageId(),
        role: getEffectiveUserRole(),
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('KIU_SOCIAL_PORTAL_CONTEXT', JSON.stringify(normalized));
}
function clearTemporarySocialNavGlow() {
    document.querySelectorAll('[data-social-return-glow="true"]').forEach(item => {
        item.removeAttribute('data-social-return-glow');
        item.classList.remove('active');
    });
}
function getSocialNavItemForRole(role = getEffectiveUserRole()) {
    if (role === USER_ROLES.ADMIN) return document.querySelector('#admin-nav [data-nav-social]');
    if (role === USER_ROLES.PROFESSOR || role === USER_ROLES.TA) return document.querySelector('#prof-nav [data-nav-social]');
    return document.getElementById('nav-social');
}
function applyTemporarySocialNavGlow(role = getEffectiveUserRole()) {
    clearTemporarySocialNavGlow();
    const navItem = getSocialNavItemForRole(role);
    if (!navItem) return;
    navItem.dataset.socialReturnGlow = 'true';
    navItem.classList.add('active');
}
function consumePendingSocialReturn() {
    const raw = localStorage.getItem('KIU_PENDING_SOCIAL_RETURN');
    if (!raw) return false;
    localStorage.removeItem('KIU_PENDING_SOCIAL_RETURN');
    let payload = null;
    try {
        payload = JSON.parse(raw);
    } catch (error) {
        payload = null;
    }
    const sourcePage = String(payload?.sourcePage || '').toLowerCase();
    const payloadRole = String(payload?.role || '').toLowerCase();
    const effectiveRole = getEffectiveUserRole();
    if (payloadRole && payloadRole !== effectiveRole) {
        return false;
    }
    if (sourcePage && document.getElementById(`page-${sourcePage}`) && sourcePage !== 'social') {
        navigate(sourcePage);
    }
    applyTemporarySocialNavGlow(effectiveRole);
    return true;
}
function resetRoleSwitchViewState() {
    currentCourseId = '';
    currentLmsQuizCourseKey = '';
    clearTemporarySocialNavGlow();
    if (typeof resetLmsLiveQuizRuntimeState === 'function') resetLmsLiveQuizRuntimeState();
    localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
    localStorage.removeItem('KIU_PENDING_SOCIAL_RETURN');
    localStorage.removeItem('KIU_PENDING_ADMIN_PAGE');
}
function openPortalMessengerChat(chatId, source = 'full') {
    const uiState = ensurePortalMessengerUiState();
    const currentUser = getCurrentUser();
    if (currentUser) {
        unhidePortalMessengerChatForUser(chatId, currentUser.id);
        if (typeof markPortalMessengerChatSeen === 'function') markPortalMessengerChatSeen(chatId, currentUser.id);
    }
    uiState.activeChatId = chatId;
    if (source === 'compact') {
        uiState.fullOpen = true;
        uiState.compactTab = 'thread';
    }
    renderPortalMessengerWorkspace();
}
function openPortalDirectChat(userId, source = 'full') {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const chat = ensurePortalMessengerDirectChat(String(currentUser.id), String(userId));
    unhidePortalMessengerChatForUser(chat.id, currentUser.id);
    openPortalMessengerChat(chat.id, source);
}
function getPortalCallEffectiveMicEnabled() {
    const uiState = ensurePortalMessengerUiState();
    const runtime = ensurePortalCallRuntime();
    if (!uiState.callMicEnabled) return false;
    if (!uiState.callPushToTalkEnabled) return true;
    return Boolean(runtime.pushTalking);
}
function syncPortalCallTracks() {
    const uiState = ensurePortalMessengerUiState();
    const runtime = ensurePortalCallRuntime();
    const stream = runtime.stream;
    if (!stream) return;
    stream.getAudioTracks().forEach(track => {
        track.enabled = getPortalCallEffectiveMicEnabled();
    });
    stream.getVideoTracks().forEach(track => {
        track.enabled = Boolean(uiState.callCameraEnabled);
    });
}
async function ensurePortalCallMedia() {
    const runtime = ensurePortalCallRuntime();
    if (runtime.stream) return runtime.stream;
    if (!navigator.mediaDevices?.getUserMedia) return null;
    try {
        runtime.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        syncPortalCallTracks();
        attachPortalCallPreview();
        return runtime.stream;
    } catch (error) {
        console.warn('Portal call media access failed:', error);
        return null;
    }
}
function stopPortalCallMedia() {
    const runtime = ensurePortalCallRuntime();
    if (runtime.stream) {
        runtime.stream.getTracks().forEach(track => track.stop());
        runtime.stream = null;
    }
}
function attachPortalCallPreview() {
    const runtime = ensurePortalCallRuntime();
    const video = document.getElementById('portal-call-local-video');
    if (video) {
        video.srcObject = runtime.stream || null;
        video.muted = true;
        const playPromise = video.play?.();
        if (playPromise?.catch) playPromise.catch(() => {});
    }
}
function getPortalCallMouseButtonLabel(value) {
    return value === 'button5' ? 'Mouse Button 5' : 'Mouse Button 4';
}
function normalizePortalShortcutToken(key) {
    if (!key) return '';
    const lower = String(key).toLowerCase();
    if (lower === 'control') return 'Ctrl';
    if (lower === ' ') return 'Space';
    if (lower === 'escape') return 'Esc';
    if (lower === 'arrowup') return 'Up';
    if (lower === 'arrowdown') return 'Down';
    if (lower === 'arrowleft') return 'Left';
    if (lower === 'arrowright') return 'Right';
    if (lower === 'meta') return 'Meta';
    if (lower.length === 1) return lower.toUpperCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
function parsePortalShortcut(shortcut) {
    return String(shortcut || '')
        .split('+')
        .map(part => part.trim())
        .filter(Boolean);
}
function isPortalShortcutPressed() {
    const uiState = ensurePortalMessengerUiState();
    const runtime = ensurePortalCallRuntime();
    const required = parsePortalShortcut(uiState.callPttShortcut);
    if (!required.length) return false;
    const pressed = Array.from(runtime.pressedKeys || []);
    return required.every(token => pressed.includes(token));
}
function updatePortalPushToTalkState() {
    const uiState = ensurePortalMessengerUiState();
    const runtime = ensurePortalCallRuntime();
    if (!uiState.callPushToTalkEnabled) {
        runtime.pushTalking = false;
    } else if (uiState.callPttMode === 'keyboard') {
        runtime.pushTalking = isPortalShortcutPressed();
    }
    syncPortalCallTracks();
    renderPortalMessengerWorkspace();
}
function beginPortalCallShortcutCapture() {
    const runtime = ensurePortalCallRuntime();
    runtime.captureShortcut = true;
    renderPortalMessengerWorkspace();
}
function setPortalCallPttMode(mode) {
    const uiState = ensurePortalMessengerUiState();
    uiState.callPttMode = mode;
    if (mode !== 'keyboard') {
        ensurePortalCallRuntime().captureShortcut = false;
    }
    updatePortalPushToTalkState();
}
function setPortalCallPttMouseButton(value) {
    ensurePortalMessengerUiState().callPttMouseButton = value;
    renderPortalMessengerWorkspace();
}
function togglePortalCallPushToTalk() {
    const uiState = ensurePortalMessengerUiState();
    uiState.callPushToTalkEnabled = !uiState.callPushToTalkEnabled;
    updatePortalPushToTalkState();
}
function togglePortalCallMic() {
    const uiState = ensurePortalMessengerUiState();
    uiState.callMicEnabled = !uiState.callMicEnabled;
    syncPortalCallTracks();
    renderPortalMessengerWorkspace();
}
function togglePortalCallCamera() {
    const uiState = ensurePortalMessengerUiState();
    uiState.callCameraEnabled = !uiState.callCameraEnabled;
    syncPortalCallTracks();
    renderPortalMessengerWorkspace();
}
async function openPortalMessengerCall(chatId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    if (typeof RTCPeerConnection !== 'function') {
        alert('This browser does not support real browser-based calls.');
        return;
    }
    const remoteUserId = getPortalMessengerPeerUserId(chatId);
    if (!remoteUserId) {
        alert('Real browser calling is available for direct chats only right now.');
        return;
    }
    const uiState = ensurePortalMessengerUiState();
    uiState.activeCallChatId = String(chatId);
    uiState.activeCallRemoteUserId = String(remoteUserId);
    uiState.callOpen = true;
    uiState.fullOpen = true;
    ensurePortalMessengerState();
    KIU_STATE.portalMessengerCalls[String(chatId)] = {
        chatId: String(chatId),
        startedBy: String(currentUser.id),
        startedAt: new Date().toISOString(),
        active: true
    };
    await ensurePortalCallMedia();
    markPortalCallUiState('ringing', 'Calling...');
    await kiuRealtimeFetch('/api/calls/start', {
        method: 'POST',
        body: {
            chatId: String(chatId),
            fromUserId: String(currentUser.id),
            toUserId: String(remoteUserId)
        }
    }).catch(error => {
        console.warn('Portal call start failed:', error);
        markPortalCallUiState('failed', 'Realtime bridge offline');
    });
    saveState();
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('calls', 'call-started', 'call', String(chatId), {
            afterState: {
                chatId: String(chatId),
                startedBy: String(currentUser.id),
                targetUserId: String(remoteUserId)
            }
        });
    }
    renderPortalMessengerWorkspace();
}
function closePortalMessengerCall() {
    const uiState = ensurePortalMessengerUiState();
    const chatId = uiState.activeCallChatId;
    if (chatId && KIU_STATE.portalMessengerCalls?.[String(chatId)]) {
        KIU_STATE.portalMessengerCalls[String(chatId)].active = false;
        KIU_STATE.portalMessengerCalls[String(chatId)].endedAt = new Date().toISOString();
    }
    finalizePortalMessengerCall(true);
}
function installPortalCallGlobalListeners() {
    if (window.__portalCallListenersInstalled) return;
    window.__portalCallListenersInstalled = true;
    document.addEventListener('keydown', event => {
        const runtime = ensurePortalCallRuntime();
        if (runtime.captureShortcut) {
            event.preventDefault();
            const tokens = [];
            if (event.ctrlKey) tokens.push('Ctrl');
            if (event.altKey) tokens.push('Alt');
            if (event.shiftKey) tokens.push('Shift');
            if (event.metaKey) tokens.push('Meta');
            const normalizedKey = normalizePortalShortcutToken(event.key);
            if (normalizedKey && !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(normalizedKey)) tokens.push(normalizedKey);
            if (tokens.length) {
                ensurePortalMessengerUiState().callPttShortcut = [...new Set(tokens)].join('+');
                runtime.captureShortcut = false;
                renderPortalMessengerWorkspace();
            }
            return;
        }
        runtime.pressedKeys.add(normalizePortalShortcutToken(event.key));
        updatePortalPushToTalkState();
    });
    document.addEventListener('keyup', event => {
        const runtime = ensurePortalCallRuntime();
        runtime.pressedKeys.delete(normalizePortalShortcutToken(event.key));
        updatePortalPushToTalkState();
    });
    document.addEventListener('mousedown', event => {
        const uiState = ensurePortalMessengerUiState();
        const runtime = ensurePortalCallRuntime();
        if (!uiState.callPushToTalkEnabled || uiState.callPttMode !== 'mouse') return;
        const wanted = uiState.callPttMouseButton === 'button5' ? 4 : 3;
        if (event.button === wanted) {
            runtime.pushTalking = true;
            syncPortalCallTracks();
            renderPortalMessengerWorkspace();
        }
    });
    document.addEventListener('mouseup', event => {
        const uiState = ensurePortalMessengerUiState();
        const runtime = ensurePortalCallRuntime();
        if (!uiState.callPushToTalkEnabled || uiState.callPttMode !== 'mouse') return;
        const wanted = uiState.callPttMouseButton === 'button5' ? 4 : 3;
        if (event.button === wanted) {
            runtime.pushTalking = false;
            syncPortalCallTracks();
            renderPortalMessengerWorkspace();
        }
    });
}
// --- READABILITY: Send ---
async function sendPortalMessengerMessage(chatId, inputId = 'portal-messenger-message-input') {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePortalMessengerState();
    const chat = KIU_STATE.portalMessengerChats?.[chatId];
    if (!chat || !(chat.members || []).includes(String(currentUser.id))) return;
    const input = document.getElementById(inputId);
    const text = input?.value.trim() || '';
    const file = getPortalMessengerDraftFile(chatId);
    const replyToMessageId = getPortalMessengerReplyTarget(chatId);
    if (!text && !file) return;
    const persistedFile = file ? await persistPortalMessengerDraftFile(file) : null;
    chat.messages = chat.messages || [];
    const message = {
        id: `portal_msg_${Date.now()}`,
        senderId: String(currentUser.id),
        senderName: currentUser.nameEn || currentUser.name || currentUser.id,
        senderRole: currentUser.role,
        text,
        file: persistedFile ? { ...persistedFile } : null,
        sentAt: new Date().toISOString(),
        replyToMessageId: replyToMessageId || '',
        seenBy: [String(currentUser.id)],
        seenAtByUser: { [String(currentUser.id)]: new Date().toISOString() }
    };
    chat.messages.push(message);
    if (chat.type === 'direct') {
        chat.requestStateByUser = chat.requestStateByUser || {};
        const recipientId = (chat.members || []).find(memberId => String(memberId) !== String(currentUser.id));
        if (recipientId && !chat.requestStateByUser[String(recipientId)]) {
            chat.requestStateByUser[String(recipientId)] = 'pending';
            chat.requestStateByUser[String(currentUser.id)] = 'accepted';
        }
    }
    (chat.members || []).forEach(memberId => unhidePortalMessengerChatForUser(chat.id, memberId));
    if (input) input.value = '';
    clearPortalMessengerDraftFile(chatId);
    clearPortalMessengerReplyTarget(chatId);
    saveState();
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('messaging', 'message-sent', 'chat-message', message.id, {
            afterState: {
                chatId: String(chat.id),
                chatType: chat.type || 'direct',
                senderId: String(currentUser.id),
                hasAttachment: Boolean(message.file),
                replyToMessageId: replyToMessageId || ''
            }
        });
    }
    renderPortalMessengerWorkspace();
    kiuRealtimeFetch('/api/messenger/message', {
        method: 'POST',
        body: {
            chatId: String(chat.id),
            type: chat.type || 'direct',
            members: chat.members || [],
            name: chat.name || '',
            createdBy: chat.createdBy || String(currentUser.id),
            createdAt: chat.createdAt || new Date().toISOString(),
            senderId: String(currentUser.id),
            message
        }
    }).then(payload => {
        if (payload?.chat) {
            upsertPortalMessengerChatFromRealtime(payload.chat, true);
            if (typeof renderPortalMessengerWorkspace === 'function') renderPortalMessengerWorkspace();
        }
    }).catch(() => {});
}
function buildPortalMessengerParticipantSummary(chat, currentUserId) {
    return (chat?.members || []).map(memberId => {
        const user = getPortalMessengerUserById(memberId);
        if (!user) return memberId;
        return `${user.displayName} (${user.roleLabel})`;
    }).filter(label => label).join(', ');
}
function buildPortalMessengerDirectoryCards(directory, compact = false) {
    if (!directory.length) {
        return `<div class="portal-msg-empty">${compact ? 'Type a name to find people.' : 'Type a name to find people.'}</div>`;
    }
    return directory.map(person => `
        <div class="portal-msg-card portal-msg-person-card">
            <div class="portal-msg-avatar-chip">${escapeHtml((person.displayName || 'U').slice(0, 1).toUpperCase())}</div>
            <div class="portal-msg-card-main">
                <div class="portal-msg-card-title">${escapeHtml(person.displayName)}</div>
                <div class="portal-msg-card-meta">${escapeHtml(person.roleLabel)} &middot; ${escapeHtml(person.facultyName)}</div>
                <div class="portal-msg-card-sub">${escapeHtml(person.email || getSafeInstitutionalEmail(person))}</div>
            </div>
            <button class="lux-primary-btn portal-msg-inline-btn" data-portal-msg-click="open-direct-chat" data-portal-msg-user-id="${String(person.id)}" data-portal-msg-source="${compact ? 'compact' : 'full'}">
                <i class="fas fa-comments"></i> ${compact ? 'Chat' : 'Message'}
            </button>
        </div>
    `).join('');
}
function buildPortalMessengerChatCards(chats, currentUserId, activeChatId, compact = false) {
    if (!chats.length) {
        return `<div class="portal-msg-empty">${compact ? 'No conversations yet.' : 'Start a private conversation from the directory.'}</div>`;
    }
    return chats.map(chat => {
        const favorite = isPortalMessengerFavorite(chat.id, currentUserId);
        const pinned = typeof isPortalMessengerPinned === 'function' ? isPortalMessengerPinned(chat.id, currentUserId) : false;
        const unread = typeof getPortalMessengerUnreadCount === 'function' ? getPortalMessengerUnreadCount(chat, currentUserId) : 0;
        const pendingRequest = typeof isPortalMessengerRequestPendingForUser === 'function' ? isPortalMessengerRequestPendingForUser(chat, currentUserId) : false;
        return `
            <div class="portal-msg-chat-item ${activeChatId === chat.id ? 'is-active' : ''}" data-portal-msg-click="open-chat" data-portal-msg-chat-id="${chat.id}" data-portal-msg-source="${compact ? 'compact' : 'full'}">
                <div class="portal-msg-avatar-chip">${escapeHtml(getPortalMessengerDisplayNameForChat(chat, currentUserId).slice(0, 1).toUpperCase())}</div>
                <div class="portal-msg-card-main">
                    <div class="portal-msg-card-title-row">
                        <div class="portal-msg-card-title">${escapeHtml(getPortalMessengerDisplayNameForChat(chat, currentUserId))}</div>
                        <div class="portal-msg-card-badges">
                            <span class="portal-msg-mini-badge">${escapeHtml(getPortalMessengerRelationshipLabel(chat, currentUserId))}</span>
                            ${pendingRequest ? `<span class="portal-msg-mini-badge is-request">Request</span>` : ''}
                            ${pinned ? `<span class="portal-msg-mini-badge is-pinned">Pinned</span>` : ''}
                            ${favorite ? `<span class="portal-msg-mini-badge is-favorite">Favorite</span>` : ''}
                            ${unread ? `<span class="portal-msg-mini-badge is-unread">${unread} new</span>` : ''}
                        </div>
                    </div>
                    <div class="portal-msg-card-meta">${escapeHtml(getPortalMessengerMessagePreview(chat))}</div>
                </div>
                <div class="portal-msg-chat-side">
                    <button type="button" class="portal-msg-favorite-btn ${favorite ? 'is-active' : ''}" data-portal-msg-click="toggle-favorite" data-portal-msg-chat-id="${chat.id}" title="${favorite ? 'Remove favorite' : 'Add favorite'}">
                        <span class="portal-msg-favorite-ripple"></span>
                        <i class="fas fa-star"></i>
                    </button>
                    <div class="portal-msg-time">${escapeHtml(getPortalMessengerChatLastTime(chat))}</div>
                </div>
            </div>
        `;
    }).join('');
}
function isPortalMessengerImageFile(file) {
    if (!file || typeof file !== 'object') return false;
    const type = String(file.type || '').toLowerCase();
    const name = String(file.name || '').toLowerCase();
    return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}
function buildPortalMessengerImagePreviewHtml(file, _mine = false, imageClass = 'portal-msg-bubble-image') {
    const resolvedFileUrl = resolvePortalMessengerFileUrl(file);
    if (!resolvedFileUrl || !isPortalMessengerImageFile(file)) return '';
    return `<div class="${escapeHtml(imageClass)}"><a href="${resolvedFileUrl}" target="_blank" rel="noopener"><img src="${resolvedFileUrl}" alt="${escapeHtml(file.name || 'Image')}" loading="lazy"></a></div>`;
}
function buildPortalMessengerMessageList(activeChat, currentUserId) {
    if (!(activeChat?.messages || []).length) {
        return `<div class="portal-msg-empty portal-msg-thread-empty">No messages yet. Start the conversation.</div>`;
    }
    return activeChat.messages.map(message => {
        const mine = String(message.senderId) === String(currentUserId);
        const replyTarget = message.replyToMessageId
            ? (activeChat.messages || []).find(entry => String(entry.id) === String(message.replyToMessageId))
            : null;
        const seenLabel = mine && activeChat.type !== 'group' && ensureArray(message.seenBy).some(id => String(id) !== String(currentUserId))
            ? '<div class="portal-msg-bubble-seen">Seen</div>'
            : '';
        const resolvedFileUrl = resolvePortalMessengerFileUrl(message.file);
        const imageHtml = message.file ? buildPortalMessengerImagePreviewHtml(message.file, mine) : '';
        const videoHtml = !imageHtml && message.file?.type?.startsWith('video/') && resolvedFileUrl
            ? `<div class="portal-msg-video-wrap"><video class="portal-msg-video" controls preload="metadata" src="${resolvedFileUrl}"></video></div>`
            : '';
        const fileHtml = message.file && !imageHtml && !videoHtml
            ? `<div class="portal-msg-bubble-file">${mine
                ? `<a href="${resolvedFileUrl}" download="${escapeHtml(message.file.name)}"><i class="fas fa-file-download"></i> ${escapeHtml(message.file.name)}</a>`
                : getStoredFileDownloadHtml(message.file, message.file.name)}</div>`
            : '';
        return `
            <div class="portal-msg-bubble-row ${mine ? 'is-mine' : ''}">
                <div class="portal-msg-bubble-meta-row">
                    <div class="portal-msg-bubble-meta">${escapeHtml(message.senderName || message.senderId)} &middot; ${escapeHtml(getPortalMessengerRoleLabel(message.senderRole))} &middot; ${escapeHtml(formatLmsDateTime(message.sentAt))}</div>
                    <div class="portal-msg-bubble-meta-actions">
                        <button type="button" class="portal-msg-message-remove" data-portal-msg-click="set-reply-target" data-portal-msg-chat-id="${activeChat.id}" data-portal-msg-message-id="${message.id}" title="Reply to this message">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button type="button" class="portal-msg-message-remove" data-portal-msg-click="remove-message" data-portal-msg-chat-id="${activeChat.id}" data-portal-msg-message-id="${message.id}" title="Remove message for both sides">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="portal-msg-bubble ${mine ? 'is-mine' : ''}">
                    ${replyTarget ? `<div class="portal-msg-bubble-reply"><strong>${escapeHtml(replyTarget.senderName || 'Message')}</strong><div>${escapeHtml((replyTarget.text || replyTarget.file?.name || '').slice(0, 80) || 'Attachment')}</div></div>` : ''}
                    ${message.text ? `<div class="portal-msg-bubble-text">${escapeHtml(message.text)}</div>` : ''}
                    ${imageHtml}
                    ${videoHtml}
                    ${fileHtml}
                    ${seenLabel}
                </div>
            </div>
        `;
    }).join('');
}
function buildPortalMessengerThread(activeChat, currentUserId, activeDraft, inputId, compact = false) {
    if (!activeChat) {
        return `
            <div class="portal-msg-thread-empty-wrap">
                <div class="portal-msg-thread-empty-title">${compact ? 'Choose a conversation' : 'No active conversation yet'}</div>
                <div class="portal-msg-thread-empty-copy">${compact ? 'Pick a recent chat or search for someone to message.' : 'Search for a student, professor, or teaching assistant and click Message to start chatting.'}</div>
            </div>
        `;
    }
    const favorite = isPortalMessengerFavorite(activeChat.id, currentUserId);
    const pinned = typeof isPortalMessengerPinned === 'function' ? isPortalMessengerPinned(activeChat.id, currentUserId) : false;
    const pendingRequest = typeof isPortalMessengerRequestPendingForUser === 'function' ? isPortalMessengerRequestPendingForUser(activeChat, currentUserId) : false;
    const replyTargetId = getPortalMessengerReplyTarget(activeChat.id);
    const replyTarget = replyTargetId ? (activeChat.messages || []).find(message => String(message.id) === replyTargetId) : null;
    const isGroup = activeChat.type === 'group';
    const hideTitle = isGroup ? 'Remove group chat from my list' : 'Remove private chat from my list';
    const deleteTitle = isGroup ? 'Delete group conversation for everyone' : 'Delete conversation for everyone';
    const threadBadge = isGroup ? 'Group chat' : 'Private chat';
    return `
        <div class="portal-msg-thread-head">
            <div>
                <div class="portal-msg-thread-title">${escapeHtml(getPortalMessengerDisplayNameForChat(activeChat, currentUserId))}</div>
                <div class="portal-msg-thread-copy">${escapeHtml(buildPortalMessengerParticipantSummary(activeChat, currentUserId))}</div>
                <div class="portal-msg-thread-labels">
                    <span class="portal-msg-mini-badge">${escapeHtml(getPortalMessengerRelationshipLabel(activeChat, currentUserId))}</span>
                    ${pendingRequest ? `<span class="portal-msg-mini-badge is-request">Message request</span>` : ''}
                    ${pinned ? `<span class="portal-msg-mini-badge is-pinned">Pinned chat</span>` : ''}
                    ${favorite ? `<span class="portal-msg-mini-badge is-favorite">Favorite chat</span>` : ''}
                </div>
            </div>
            <div class="portal-msg-thread-actions">
        <button type="button" class="lux-primary-btn portal-msg-inline-btn" data-portal-msg-click="open-call" data-portal-msg-chat-id="${activeChat.id}"><i class="fas fa-video"></i> ${compact ? 'Call' : 'Video Call'}</button>
                <button type="button" class="portal-msg-favorite-btn ${pinned ? 'is-active' : ''}" data-portal-msg-click="toggle-pin" data-portal-msg-chat-id="${activeChat.id}" title="${pinned ? 'Unpin chat' : 'Pin chat'}">
                    <span class="portal-msg-favorite-ripple"></span>
                    <i class="fas fa-thumbtack"></i>
                </button>
                <button type="button" class="portal-msg-favorite-btn ${favorite ? 'is-active' : ''}" data-portal-msg-click="toggle-favorite" data-portal-msg-chat-id="${activeChat.id}" title="${favorite ? 'Remove favorite' : 'Add favorite'}">
                    <span class="portal-msg-favorite-ripple"></span>
                    <i class="fas fa-star"></i>
                </button>
                ${compact ? '' : `<button type="button" class="portal-msg-remove-btn" data-portal-msg-click="remove-chat" data-portal-msg-chat-id="${activeChat.id}" title="${hideTitle}">
                    <i class="fas fa-eye-slash"></i>
                </button>`}
                ${compact ? '' : `<button type="button" class="portal-msg-remove-btn is-danger" data-portal-msg-click="delete-conversation" data-portal-msg-chat-id="${activeChat.id}" title="${deleteTitle}">
                    <i class="fas fa-trash"></i>
                </button>`}
                ${compact ? `<button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="set-compact-tab" data-portal-msg-value="chats"><i class="fas fa-arrow-left"></i> Back</button>` : `<div class="portal-msg-thread-badge">${threadBadge}</div>`}
            </div>
        </div>
        ${pendingRequest ? `<div class="portal-msg-request-banner"><div>This conversation is waiting for your approval.</div><div class="portal-msg-request-actions"><button type="button" class="lux-primary-btn portal-msg-inline-btn" data-portal-msg-click="respond-request" data-portal-msg-chat-id="${activeChat.id}" data-portal-msg-accept="true">Accept</button><button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="respond-request" data-portal-msg-chat-id="${activeChat.id}" data-portal-msg-accept="false">Decline</button></div></div>` : ''}
        <div class="portal-msg-chat-log">
            ${buildPortalMessengerMessageList(activeChat, currentUserId)}
        </div>
        <div class="portal-msg-composer-wrap">
        ${replyTarget ? `<div class="portal-msg-bubble-reply"><div><strong>Replying to ${escapeHtml(replyTarget.senderName || 'message')}</strong><div>${escapeHtml((replyTarget.text || replyTarget.file?.name || '').slice(0, 100) || 'Attachment')}</div></div><button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="clear-reply-target" data-portal-msg-chat-id="${activeChat.id}">Clear</button></div>` : ''}
            <div class="portal-msg-composer" data-portal-msg-drop-chat="${activeChat.id}">
                <textarea id="${inputId}" placeholder="Write a private message..." class="portal-msg-textarea ${compact ? 'is-compact' : ''}"></textarea>
                <div class="portal-msg-composer-note">Drag and drop a file here or use the attach button.</div>
            </div>
            <div class="portal-msg-composer-footer">
                <div class="portal-msg-attachment-label">${activeDraft?.name ? `<i class="fas fa-paperclip"></i> ${escapeHtml(activeDraft.name)}` : 'No file selected'}</div>
                <div class="portal-msg-actions">
        <button class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="pick-file" data-portal-msg-chat-id="${activeChat.id}"><i class="fas fa-paperclip"></i> Attach</button>
        <button class="lux-primary-btn portal-msg-inline-btn" data-portal-msg-click="send-message" data-portal-msg-chat-id="${activeChat.id}" data-portal-msg-input-id="${inputId}"><i class="fas fa-paper-plane"></i> Send</button>
                </div>
            </div>
        </div>
    `;
}
function buildPortalMessengerGroupComposer(summary) {
    const { uiState } = summary;
    if (!uiState.groupComposerOpen) return '';
    const selectedIds = (uiState.groupComposerMembers || []).map(String);
    const selectedUsers = selectedIds.map(getPortalMessengerUserById).filter(Boolean);
    const candidates = getPortalMessengerGroupCandidates(uiState.groupComposerSearch);
    return `
        <div class="portal-msg-group-overlay">
            <div class="portal-msg-group-backdrop" data-portal-msg-click="close-group-composer"></div>
            <div class="portal-msg-group-modal">
                <div class="portal-msg-group-head">
                    <div>
                        <div class="portal-msg-group-title">New Group Chat</div>
                        <div class="portal-msg-group-copy">Create a shared conversation like Messenger by naming the chat and selecting people.</div>
                    </div>
                    <button type="button" class="portal-msg-ghost-btn" data-portal-msg-click="close-group-composer"><i class="fas fa-times"></i></button>
                </div>
                <div class="portal-msg-group-body">
                    <div class="portal-call-setting">
                        <label>Group Name</label>
                        <input type="text" value="${escapeHtml(uiState.groupComposerName || '')}" data-portal-msg-input="set-group-name" placeholder="e.g. Senior Thesis Team" class="portal-msg-search">
                    </div>
                    <div class="portal-call-setting">
                        <label>Find Members</label>
                        <input type="text" value="${escapeHtml(uiState.groupComposerSearch || '')}" data-portal-msg-input="set-group-search" placeholder="Search by name, role, faculty..." class="portal-msg-search">
                    </div>
                    <div class="portal-msg-group-selected">
                        ${selectedUsers.length ? selectedUsers.map(user => `
                            <button type="button" class="portal-msg-mini-badge is-favorite" data-portal-msg-click="toggle-group-member" data-portal-msg-user-id="${String(user.id)}">${escapeHtml(user.displayName)} <i class="fas fa-times"></i></button>
                        `).join('') : `<div class="portal-msg-empty">No members selected yet.</div>`}
                    </div>
                    <div class="portal-msg-group-list">
                        ${candidates.map(user => {
                            const selected = selectedIds.includes(String(user.id));
                            return `
                                <button type="button" class="portal-msg-group-person ${selected ? 'is-selected' : ''}" data-portal-msg-click="toggle-group-member" data-portal-msg-user-id="${String(user.id)}">
                                    <div class="portal-msg-avatar-chip">${escapeHtml((user.displayName || 'U').slice(0, 1).toUpperCase())}</div>
                                    <div class="portal-msg-card-main">
                                        <div class="portal-msg-card-title">${escapeHtml(user.displayName)}</div>
                                        <div class="portal-msg-card-meta">${escapeHtml(user.roleLabel)} &middot; ${escapeHtml(user.facultyName)}</div>
                                    </div>
                                    <div class="portal-msg-group-check"><i class="fas fa-${selected ? 'check-circle' : 'circle'}"></i></div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="portal-msg-group-foot">
                    <button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="close-group-composer">Cancel</button>
                    <button type="button" class="lux-primary-btn portal-msg-inline-btn" data-portal-msg-click="create-group-chat"><i class="fas fa-users"></i> Create Group</button>
                </div>
            </div>
        </div>
    `;
}
function buildPortalMessengerWorkspaceHtml(summary, context = 'embedded') {
    const { currentUser, uiState, chats, activeChat, activeDraft, directory } = summary;
    const searchPlaceholder = context === 'modal' ? 'Type a student, professor, or TA name...' : 'Type a name to find people...';
    const { privateChats, groupChats } = splitPortalMessengerChats(chats);
    const visibleChats = uiState.chatSection === 'group' ? groupChats : privateChats;
    return `
        <div class="portal-msg-page-shell">
            <div class="portal-msg-page-top">
                <div>
                    <div class="portal-msg-page-title">Portal Messenger</div>
                    <div class="portal-msg-page-copy">Search students, professors, and teaching assistants, then move between quick chats and deeper conversations without leaving the portal.</div>
                </div>
                <div class="portal-msg-page-pills">
                    <span class="portal-msg-pill home-hover-chip is-role"><i class="fas fa-user-shield"></i> ${escapeHtml(getPortalMessengerRoleLabel(currentUser.role))}</span>
                    <span class="portal-msg-pill home-hover-chip"><i class="fas fa-building"></i> ${escapeHtml(getFacultyLabel(normalizeFacultyCode(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty(), 'ECON')))}</span>
                    ${context === 'embedded' ? `<button class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="open-full"><i class="fas fa-expand"></i> Full Chat</button>` : ''}
                </div>
            </div>
            <div class="portal-msg-shell">
                <section class="portal-msg-panel">
                    <div class="portal-msg-panel-head">
                        <div class="portal-msg-panel-title">Find People</div>
                    </div>
                    <input type="text" value="${escapeHtml(uiState.search)}" data-portal-msg-input="set-search" placeholder="${escapeHtml(searchPlaceholder)}" class="portal-msg-search">
                    <div class="portal-msg-filter-row">
                        ${[
                            ['all', 'All'],
                            [USER_ROLES.STUDENT, 'Students'],
                            [USER_ROLES.PROFESSOR, 'Professors'],
                            [USER_ROLES.TA, 'TAs']
                        ].map(([value, label]) => `
                            <button type="button" class="portal-msg-chip home-hover-chip ${uiState.roleFilter === value ? 'is-active' : ''}" data-portal-msg-click="set-role-filter" data-portal-msg-value="${value}">${label}</button>
                        `).join('')}
                    </div>
                    <div class="portal-msg-list portal-msg-list--capped">
                        ${buildPortalMessengerDirectoryCards(directory)}
                    </div>
                </section>
                <section class="portal-msg-panel">
                    <div class="portal-msg-panel-head">
                        <div class="portal-msg-panel-title-row">
                            <div class="portal-msg-panel-title">Chats</div>
                            <div class="portal-msg-toggle-group">
                                <button type="button" class="portal-msg-chip home-hover-chip ${uiState.chatSection !== 'group' ? 'is-active' : ''}" data-portal-msg-click="set-chat-section" data-portal-msg-value="private">Private Chats</button>
                                <button type="button" class="portal-msg-chip home-hover-chip ${uiState.chatSection === 'group' ? 'is-active' : ''}" data-portal-msg-click="set-chat-section" data-portal-msg-value="group">Group Chats</button>
                            </div>
                        </div>
                        <div class="portal-msg-panel-head-actions">
                            <div class="portal-msg-panel-meta">${uiState.chatSection === 'group' ? `${groupChats.length} groups` : `${privateChats.length} active`}</div>
                            ${context === 'modal' ? `<button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="open-group-composer"><i class="fas fa-users"></i> New Group Chat</button>` : ''}
                        </div>
                    </div>
                    <div class="portal-msg-list portal-msg-list--capped">
                        ${buildPortalMessengerChatCards(visibleChats, String(currentUser.id), uiState.activeChatId, false)}
                    </div>
                </section>
                <section class="portal-msg-panel portal-msg-thread-panel">
                    ${buildPortalMessengerThread(activeChat, String(currentUser.id), activeDraft, 'portal-messenger-message-input', false)}
                </section>
            </div>
            ${context === 'modal' ? buildPortalMessengerGroupComposer(summary) : ''}
        </div>
    `;
}
function buildPortalMessengerCompactBody(summary) {
    const { currentUser, uiState, chats, activeChat, activeDraft, compactDirectory } = summary;
    if (uiState.compactTab === 'thread' && uiState.activeChatId && activeChat) {
        return buildPortalMessengerThread(activeChat, String(currentUser.id), activeDraft, 'portal-messenger-compact-input', true);
    }
    return `
        <div class="portal-msg-compact-tabs">
            <button type="button" class="portal-msg-chip home-hover-chip ${uiState.compactTab === 'chats' ? 'is-active' : ''}" data-portal-msg-click="set-compact-tab" data-portal-msg-value="chats">Chats</button>
            <button type="button" class="portal-msg-chip home-hover-chip ${uiState.compactTab === 'people' ? 'is-active' : ''}" data-portal-msg-click="set-compact-tab" data-portal-msg-value="people">People</button>
        </div>
        ${uiState.compactTab === 'people'
            ? `
                <input type="text" value="${escapeHtml(uiState.compactSearch)}" data-portal-msg-input="set-compact-search" placeholder="Search people..." class="portal-msg-search is-compact">
                <div class="portal-msg-list is-compact">
                    ${buildPortalMessengerDirectoryCards(compactDirectory, true)}
                </div>
            `
            : `
                <div class="portal-msg-list is-compact">
                    ${buildPortalMessengerChatCards(chats, String(currentUser.id), uiState.activeChatId, true)}
                </div>
            `
        }
    `;
}
function buildPortalCallWindow(summary) {
    const { currentUser, uiState } = summary;
    if (!uiState.callOpen || !uiState.activeCallChatId) return '';
    const chat = KIU_STATE.portalMessengerChats?.[uiState.activeCallChatId];
    if (!chat) return '';
    const otherId = (chat.members || []).find(memberId => String(memberId) !== String(currentUser.id));
    const otherUser = getPortalMessengerUserById(otherId);
    const runtime = ensurePortalCallRuntime();
    const talking = uiState.callPushToTalkEnabled ? runtime.pushTalking : uiState.callMicEnabled;
    const incoming = uiState.callMode === 'incoming';
    const active = uiState.callMode === 'active';
    const statusText = uiState.callStatusText || (incoming ? 'Incoming call' : active ? 'Connected' : 'Preparing call');
    const hasRemoteVideo = Boolean(runtime.remoteStream);
    return `
        <div class="portal-call-backdrop" data-portal-msg-click="close-call"></div>
        <div class="portal-call-window">
            <div class="portal-call-head">
                <div>
                    <div class="portal-call-title">Video Call</div>
                    <div class="portal-call-copy">${escapeHtml(getPortalMessengerDisplayNameForChat(chat, String(currentUser.id)))} &middot; ${escapeHtml(otherUser?.roleLabel || 'Portal User')}</div>
                </div>
                <div class="portal-call-head-actions">
                    <button type="button" class="portal-msg-ghost-btn" data-portal-msg-click="close-call"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="portal-call-body">
                <div class="portal-call-stage">
                    <div class="portal-call-remote">
                        <video id="portal-call-remote-video" class="portal-call-remote-video" autoplay playsinline></video>
                        <div class="portal-call-remote-avatar${hasRemoteVideo ? ' is-hidden' : ''}">${escapeHtml((otherUser?.displayName || 'U').slice(0, 1).toUpperCase())}</div>
                        <div class="portal-call-remote-name">${escapeHtml(otherUser?.displayName || 'Remote participant')}</div>
                        <div class="portal-call-remote-role">${escapeHtml(otherUser?.roleLabel || 'Portal User')} &middot; ${escapeHtml(otherUser?.facultyName || '')}</div>
                        <div class="portal-call-remote-note">${escapeHtml(statusText)}</div>
                    </div>
                    <div class="portal-call-local-card">
                        <video id="portal-call-local-video" class="portal-call-local-video" autoplay playsinline muted></video>
                        <div class="portal-call-local-badge">You</div>
                        <div class="portal-call-local-status">${uiState.callCameraEnabled ? 'Camera on' : 'Camera off'} &middot; ${getPortalCallEffectiveMicEnabled() ? 'Mic live' : (uiState.callPushToTalkEnabled ? 'Push-to-talk idle' : 'Mic muted')}</div>
                    </div>
                </div>
                <div class="portal-call-side">
                    <div class="portal-call-card">
                        <div class="portal-call-card-title">Call Controls</div>
                        <div class="portal-call-controls">
                            <button type="button" class="portal-call-control ${uiState.callMicEnabled ? 'is-active' : ''}" data-portal-msg-click="toggle-mic"><i class="fas fa-microphone${uiState.callMicEnabled ? '' : '-slash'}"></i> ${uiState.callMicEnabled ? 'Mic On' : 'Mic Off'}</button>
                            <button type="button" class="portal-call-control ${uiState.callCameraEnabled ? 'is-active' : ''}" data-portal-msg-click="toggle-camera"><i class="fas fa-video${uiState.callCameraEnabled ? '' : '-slash'}"></i> ${uiState.callCameraEnabled ? 'Camera On' : 'Camera Off'}</button>
                            <button type="button" class="portal-call-control ${uiState.callPushToTalkEnabled ? 'is-active' : ''}" data-portal-msg-click="toggle-ptt"><i class="fas fa-bullhorn"></i> ${uiState.callPushToTalkEnabled ? 'Push-to-Talk On' : 'Push-to-Talk Off'}</button>
                        </div>
                        <div class="portal-call-status-grid">
                            <div class="portal-call-status-pill ${talking ? 'is-live' : ''}">${talking ? 'Talking live' : 'Silent now'}</div>
                            <div class="portal-call-status-pill">${uiState.callPttMode === 'mouse' ? getPortalCallMouseButtonLabel(uiState.callPttMouseButton) : escapeHtml(uiState.callPttShortcut)}</div>
                        </div>
                    </div>
                    <div class="portal-call-card">
                        <div class="portal-call-card-title">Push-to-Talk Settings</div>
                        <div class="portal-call-setting">
                            <label>Mode</label>
                            <select data-portal-msg-change="set-ptt-mode">
                                <option value="keyboard" ${uiState.callPttMode === 'keyboard' ? 'selected' : ''}>Keyboard Shortcut</option>
                                <option value="mouse" ${uiState.callPttMode === 'mouse' ? 'selected' : ''}>Mouse Side Button</option>
                            </select>
                        </div>
                        ${uiState.callPttMode === 'keyboard' ? `
                            <div class="portal-call-setting">
                                <label>Shortcut</label>
                                <div class="portal-call-shortcut-row">
                                    <div class="portal-call-shortcut-pill">${runtime.captureShortcut ? 'Press your shortcut now...' : escapeHtml(uiState.callPttShortcut)}</div>
                                    <button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="begin-shortcut-capture"><i class="fas fa-keyboard"></i> Set Shortcut</button>
                                </div>
                            </div>
                        ` : `
                            <div class="portal-call-setting">
                                <label>Mouse Button</label>
                                <select data-portal-msg-change="set-ptt-mouse-button">
                                    <option value="button4" ${uiState.callPttMouseButton === 'button4' ? 'selected' : ''}>Mouse Button 4</option>
                                    <option value="button5" ${uiState.callPttMouseButton === 'button5' ? 'selected' : ''}>Mouse Button 5</option>
                                </select>
                            </div>
                        `}
                        <div class="portal-call-helper">Hold your selected shortcut or side mouse button to talk when push-to-talk is enabled.</div>
                    </div>
                    <div class="portal-call-card">
                        <div class="portal-call-card-title">Call Actions</div>
                        <div class="portal-call-actions">
                            ${incoming ? `
                                <button type="button" class="lux-primary-btn portal-msg-inline-btn" data-portal-msg-click="accept-call"><i class="fas fa-phone"></i> Accept</button>
                                <button type="button" class="portal-call-hangup" data-portal-msg-click="decline-call"><i class="fas fa-phone-slash"></i> Decline</button>
                            ` : `
                                <button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-portal-msg-click="open-chat-and-close-call" data-portal-msg-chat-id="${chat.id}" data-portal-msg-source="full"><i class="fas fa-comments"></i> Back to Chat</button>
                                <button type="button" class="portal-call-hangup" data-portal-msg-click="close-call"><i class="fas fa-phone-slash"></i> End Call</button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
function ensurePortalMessengerChrome() {
    ensureLayoutPortalCss();
    if (!document.body) return null;
    let dockRoot = document.getElementById('portal-messenger-chrome');
    if (!dockRoot) {
        dockRoot = document.createElement('div');
        dockRoot.id = 'portal-messenger-chrome';
        dockRoot.hidden = true;
        document.body.appendChild(dockRoot);
    }
    let modalRoot = document.getElementById('portal-messenger-modal-overlay');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'portal-messenger-modal-overlay';
        document.body.appendChild(modalRoot);
    }
    let callRoot = document.getElementById('portal-call-overlay');
    if (!callRoot) {
        callRoot = document.createElement('div');
        callRoot.id = 'portal-call-overlay';
        document.body.appendChild(callRoot);
    }
    return { dockRoot, modalRoot, callRoot };
}
function ensurePortalNotificationChrome() {
    ensureLayoutPortalCss();
    if (!document.body) return null;
    let dockRoot = document.getElementById('portal-notification-chrome');
    if (!dockRoot) {
        dockRoot = document.createElement('div');
        dockRoot.id = 'portal-notification-chrome';
        dockRoot.hidden = true;
        document.body.appendChild(dockRoot);
    }
    let modalRoot = document.getElementById('portal-notification-modal-overlay');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'portal-notification-modal-overlay';
        document.body.appendChild(modalRoot);
    }
    if (!modalRoot.dataset.portalNotifBuilt) {
        modalRoot.dataset.portalNotifBuilt = 'true';
        modalRoot.innerHTML = `
            <div id="portal-notification-modal-backdrop" class="portal-notif-modal-backdrop"></div>
            <div class="portal-notif-modal-window">
                <div class="portal-notif-modal-head">
                    <div>
                        <div class="portal-notif-modal-title">Notification Center</div>
                        <div class="portal-notif-modal-copy">Track real grades, service replies, schedule changes, official orders, and selected social activity in one place.</div>
                    </div>
                    <div class="portal-notif-modal-actions">
                        <button type="button" id="portal-notification-close" class="portal-notif-ghost-btn"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div id="portal-notification-modal-body" class="portal-notif-modal-body"></div>
            </div>
        `;
    }
    if (!modalRoot.dataset.boundNotifications) {
        modalRoot.dataset.boundNotifications = 'true';
        modalRoot.addEventListener('click', handlePortalNotificationChromeClick);
        modalRoot.querySelector('#portal-notification-modal-backdrop')?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            closePortalNotificationFullModal();
        });
        modalRoot.querySelector('#portal-notification-close')?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            closePortalNotificationFullModal();
        });
    }
    if (!document.body.dataset.boundNotificationChromeGlobal) {
        document.body.dataset.boundNotificationChromeGlobal = 'true';
        document.addEventListener('keydown', handlePortalNotificationChromeKeydown);
    }
    return { dockRoot, modalRoot };
}
function ensurePortalNotificationRenderState() {
    window.__portalNotificationRenderState = window.__portalNotificationRenderState || {
        hidden: true,
        fullOpen: null,
        modalHtml: ''
    };
    return window.__portalNotificationRenderState;
}
function handlePortalNotificationChromeClick(event) {
    const actionEl = event.target.closest('[data-notif-action]');
    if (!actionEl) return;
    const action = String(actionEl.dataset.notifAction || '');
    event.preventDefault();
    event.stopPropagation();
    if (action === 'toggle-dock') {
        togglePortalNotificationDock();
        return;
    }
    if (action === 'open-full') {
        openPortalNotificationFullModal();
        return;
    }
    if (action === 'close-full') {
        closePortalNotificationFullModal();
        return;
    }
    if (action === 'switch-dock') {
        switchPortalNotificationToDock();
        return;
    }
    if (action === 'mark-all') {
        markAllPortalNotificationsRead();
        return;
    }
    if (action === 'set-filter') {
        setPortalNotificationFilter(actionEl.dataset.filterValue || 'all');
        return;
    }
    if (action === 'open-item') {
        openPortalNotificationItem(actionEl.dataset.notificationKey || '');
    }
}
function handlePortalNotificationChromeKeydown(event) {
    if (event.key !== 'Escape') return;
    const uiState = typeof ensurePortalNotificationUiState === 'function' ? ensurePortalNotificationUiState() : null;
    if (!uiState?.fullOpen) return;
    closePortalNotificationFullModal();
}
function getPortalNotificationSummary() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    const uiState = ensurePortalNotificationUiState();
    const items = getPortalNotificationItemsForUser(currentUser.id);
    const unreadCount = getPortalNotificationUnreadCount(currentUser.id);
    return { currentUser, uiState, items, unreadCount };
}
function renderPortalNotificationChrome() {
    const roots = ensurePortalNotificationChrome();
    if (!roots) return;
    const { dockRoot, modalRoot } = roots;
    const renderState = ensurePortalNotificationRenderState();
    const summary = getPortalNotificationSummary();
    if (!summary) {
        if (!renderState.hidden) {
            dockRoot.hidden = true;
            modalRoot.querySelector('#portal-notification-modal-body')?.replaceChildren();
            modalRoot.className = 'portal-notif-modal-overlay';
            renderState.hidden = true;
            renderState.modalHtml = '';
            renderState.fullOpen = null;
        }
        return;
    }
    dockRoot.hidden = true;
    if (renderState.hidden) renderState.hidden = false;
    const { uiState } = summary;
    const modalHtml = uiState.fullOpen ? buildPortalNotificationWorkspaceHtml(summary, 'modal') : '';
    if (renderState.fullOpen !== Boolean(uiState.fullOpen)) {
        modalRoot.className = `portal-notif-modal-overlay ${uiState.fullOpen ? 'is-open' : ''}`;
        renderState.fullOpen = Boolean(uiState.fullOpen);
    }
    const modalBody = modalRoot.querySelector('#portal-notification-modal-body');
    if (modalBody && renderState.modalHtml !== modalHtml) {
        modalBody.innerHTML = modalHtml;
        renderState.modalHtml = modalHtml;
    }
}
if (typeof window !== 'undefined') {
    Object.assign(window, {
        renderPortalNotificationChrome
    });
}
function renderPortalMessengerChrome(summary) {
    const roots = ensurePortalMessengerChrome();
    if (!roots) return;
    const { dockRoot, modalRoot, callRoot } = roots;
    const { uiState } = summary;
    dockRoot.hidden = true;
    dockRoot.replaceChildren();
    modalRoot.className = `portal-msg-modal-overlay ${uiState.fullOpen ? 'is-open' : ''}`;
    modalRoot.innerHTML = uiState.fullOpen ? `
        <div class="portal-msg-modal-backdrop" data-portal-msg-click="close-full"></div>
        <div class="portal-msg-modal-window">
            <div class="portal-msg-modal-head">
                <div>
                    <div class="portal-msg-modal-title">Full Messenger</div>
                    <div class="portal-msg-modal-copy">Stay on the current page and manage every private conversation in one place.</div>
                </div>
                <div class="portal-msg-modal-actions">
                    <button type="button" class="portal-msg-ghost-btn" data-portal-msg-click="close-full"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="portal-msg-modal-body">
                ${buildPortalMessengerWorkspaceHtml(summary, 'modal')}
            </div>
        </div>
    ` : '';
    callRoot.className = `portal-call-overlay ${uiState.callOpen ? 'is-open' : ''}`;
    callRoot.innerHTML = uiState.callOpen ? buildPortalCallWindow(summary) : '';
}
function renderPortalMessengerWorkspace() {
    const containers = [
        document.getElementById('portal-messenger-container'),
        document.getElementById('student-social-container')
    ].filter(Boolean);
    const currentUser = getCurrentUser();
    consumePendingSocialMessengerLaunch();
    const roots = ensurePortalMessengerChrome();
    if (!currentUser) {
        containers.forEach(container => {
            container.innerHTML = `<div class="portal-msg-empty">Messenger is available after login.</div>`;
        });
        if (roots) {
            roots.dockRoot.innerHTML = '';
            roots.modalRoot.innerHTML = '';
            roots.modalRoot.className = 'portal-msg-modal-overlay';
            roots.callRoot.innerHTML = '';
            roots.callRoot.className = 'portal-call-overlay';
        }
        renderPortalNotificationChrome();
        return;
    }
    const summary = getPortalMessengerSummary();
    containers.forEach(container => {
        container.innerHTML = buildPortalMessengerWorkspaceHtml(summary, 'embedded');
    });
    renderPortalMessengerChrome(summary);
    renderPortalNotificationChrome();
    attachPortalCallPreview();
    attachPortalCallRemotePreview();
    document.querySelectorAll('.portal-msg-chat-log').forEach(log => {
        log.scrollTop = log.scrollHeight;
    });
}
function refreshStandalonePageContext() {
    const currentUser = getCurrentUser();
    const facultyProfile = getFacultyProfile(getCurrentFaculty());
    if (!currentUser) return;
    const effectiveRole = getEffectiveUserRole();
    ensureOrdersNavLinks();
    ensureFacultyExamsNavLink();
    if (typeof window.syncShellNavVisibility === 'function') {
        window.syncShellNavVisibility(getCurrentPortalPageId(), effectiveRole);
    }
    document.querySelectorAll('.admin-nav-link').forEach(item => {
        item.hidden = effectiveRole !== USER_ROLES.ADMIN;
    });
    if (typeof populateProgramContextControls === 'function') {
        populateProgramContextControls(currentUser, facultyProfile);
    }
    if (typeof renderProfilePageContext === 'function') renderProfilePageContext(currentUser);
    if (typeof renderPersonalDataPageContext === 'function') renderPersonalDataPageContext(currentUser, facultyProfile);
    if ((document.getElementById('student-educational-program-root') || document.getElementById('page-programs')) && typeof renderStudentEducationalProgramPage === 'function') renderStudentEducationalProgramPage();
    if (
        (document.getElementById('page-social') || document.getElementById('public-social-root'))
        && typeof schedulePublicSocialRenderBoost === 'function'
    ) {
        schedulePublicSocialRenderBoost();
    }
    if (typeof renderPortalMessengerWorkspace === 'function') renderPortalMessengerWorkspace();
    if (typeof renderPortalNotificationChrome === 'function') renderPortalNotificationChrome();
    if (document.getElementById('gradebook-roster-selection') && typeof renderGradebookRosterSelection === 'function') renderGradebookRosterSelection();
    if (document.getElementById('admin-orders-root') && typeof renderAdminOrders === 'function') renderAdminOrders();
    if ((document.getElementById('page-orders') || document.getElementById('orders-inbox-root')) && typeof renderOrdersInboxPage === 'function') renderOrdersInboxPage();
}
// Get faculty curriculum from the canonical faculty-profile store.
function ensureFacultyExamsNavLink() {
    const profNav = document.getElementById('prof-nav');
    if (profNav && !profNav.querySelector('[data-nav-exams]')) {
        const navItem = document.createElement('div');
        navItem.className = 'nav-item prof-nav-link';
        navItem.dataset.navExams = 'true';
        navItem.id = 'nav-exams-faculty';
        navItem.setAttribute('onclick', "navigate('exams')");
        navItem.innerHTML = '<i class="fas fa-file-signature portal-nav-icon portal-nav-icon--stacked"></i> Exams';
        profNav.appendChild(navItem);
    }
    const examsNav = profNav?.querySelector('[data-nav-exams]');
    if (examsNav) {
        const examsSection = document.getElementById('page-exams');
        const isActiveSection = examsSection?.classList.contains('active-page');
        const isStandaloneExams = /exams\.html$/i.test(window.location.pathname || '');
        const isExamsPage = Boolean(isActiveSection || isStandaloneExams);
        examsNav.classList.toggle('active', isExamsPage);
    }
}
function syncProfessorNavActiveState() {
    const profNav = document.getElementById('prof-nav');
    if (!profNav) return;
    const pathname = (window.location.pathname || '').split('/').pop().toLowerCase();
    const activeSectionId = document.querySelector('.page-section.active-page')?.id || '';
    const activePage = (activeSectionId.replace(/^page-/, '') || pathname.replace(/\.html$/, '')).toLowerCase();
    let activeKey = 'home';
    if (activePage === 'gradebook') activeKey = 'home';
    else if (['faculty-schedule', 'calendar', 'timetable'].includes(activePage)) activeKey = 'timetable';
    else if (activePage === 'library') activeKey = 'library';
    else if (activePage === 'orders') activeKey = 'orders';
    else if (activePage === 'social') activeKey = 'social';
    else if (activePage === 'exams') activeKey = 'exams';
    profNav.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const selectorMap = {
        home: "[onclick*=\"navigate('home')\"]",
        'timetable': "[onclick*=\"navigate('faculty-schedule')\"],[onclick*=\"navigate('timetable')\"]",
        library: "[onclick*=\"navigate('library')\"]",
        orders: "[data-nav-orders]",
        social: "[data-nav-social]",
        exams: "[data-nav-exams]"
    };
    const activeItem = profNav.querySelector(selectorMap[activeKey] || selectorMap.home);
    if (activeItem) activeItem.classList.add('active');
}
// Count how many students a professor teaches (by checking availableGroups)
function getProfStudentCount(profName) {
    let count = 0;
    for (const cId in KIU_STATE.availableGroups) {
        KIU_STATE.availableGroups[cId].forEach(g => {
            if (g.prof === profName || g.ta === profName) count += (g.registered || 0);
        });
    }
    return count;
}
// Get professor's scheduled groups
function getProfSchedule(profName) {
    const sessions = [];
    for (const cId in KIU_STATE.availableGroups) {
        KIU_STATE.availableGroups[cId].forEach(g => {
            if (g.prof === profName || g.ta === profName) {
                sessions.push({ courseId: cId, ...g });
            }
        });
    }
    return sessions;
}
// Define day order mapping (guard against duplicate declarations)
window.FACULTY_SCHEDULE_DAY_ORDER = window.FACULTY_SCHEDULE_DAY_ORDER || {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 7
    };
function getScheduleDayOrder(dayLabel) {
    const repaired = cleanupEncodingArtifacts(toEnglishText(dayLabel || '')).toLowerCase();
    if (window.FACULTY_SCHEDULE_DAY_ORDER[repaired]) return window.FACULTY_SCHEDULE_DAY_ORDER[repaired];
    const partial = Object.keys(window.FACULTY_SCHEDULE_DAY_ORDER).find(day => repaired.includes(day));
    return partial ? window.FACULTY_SCHEDULE_DAY_ORDER[partial] : 99;
}
function getScheduleDayKey(dayLabel) {
    const repaired = cleanupEncodingArtifacts(toEnglishText(dayLabel || '')).toLowerCase();
    const partial = Object.keys(window.FACULTY_SCHEDULE_DAY_ORDER).find(day => repaired.includes(day));
    return partial || '';
}
function getTodayScheduleDayKey() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}
function getCurrentFacultyScheduleItems() {
    const currentUser = getCurrentUser();
    if (!currentUser || ![USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(currentUser.role)) return [];
    const userName = currentUser.name || currentUser.nameEn || '';
    return getProfSchedule(userName).map(session => {
        const subject = getDomain().subjectsById?.[session.courseId] || KIU_STATE.curriculum.find(item => item.id === session.courseId);
        const duration = parseInt(session.duration || 110, 10) || 110;
        const startTime = normalizeTimeString(session.time || session.startTime || '', 'TBD');
        const endTime = startTime === 'TBD' ? 'TBD' : minutesToTimeString(convertTimeToMinutes(startTime) + duration);
        return {
            ...session,
            subjectName: subject?.name || session.courseId,
            faculty: session.faculty || getFacultyLabel(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty()),
            duration,
            startTime,
            endTime,
            dayOrder: getScheduleDayOrder(session.day),
            startMinutes: convertTimeToMinutes(startTime),
            roleLabel: session.prof === userName ? 'Professor' : (session.ta === userName ? 'Teaching Assistant' : 'Faculty')
        };
    }).sort((a, b) => {
        if (a.dayOrder !== b.dayOrder) return a.dayOrder - b.dayOrder;
        if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
        return String(a.subjectName).localeCompare(String(b.subjectName));
    });
}
function queueFacultyLmsSession(courseId, groupId) {
    if (!courseId || !groupId) return;
    sessionStorage.setItem('KIU_PENDING_LMS_GROUP', JSON.stringify({ courseId, groupId }));
    navigate('lms');
}
function consumePendingLmsGroupOpen(items = null) {
    const raw = sessionStorage.getItem('KIU_PENDING_LMS_GROUP');
    if (!raw) return;
    let pending = null;
    try {
        pending = JSON.parse(raw);
    } catch (error) {
        sessionStorage.removeItem('KIU_PENDING_LMS_GROUP');
        return;
    }
    const list = Array.isArray(items) ? items : [];
    const match = list.find(item => item.courseId === pending?.courseId && item.groupId === pending?.groupId);
    if (!match) return;
    sessionStorage.removeItem('KIU_PENDING_LMS_GROUP');
    openLMSCourse(`${match.courseId}::${match.groupId}`, `${match.subjectName} | ${match.groupName || match.groupId}`);
}
function buildFacultyScheduleCardHtml(item, compact = false) {
    const sizeClass = compact ? 'faculty-schedule-card--compact' : 'faculty-schedule-card--full';
    return `
        <div class="surface-card faculty-schedule-card ${sizeClass}">
            <div class="faculty-schedule-card__body">
                <div class="faculty-schedule-card__head">
                    <div class="faculty-schedule-card__title">${item.subjectName}</div>
                    <span class="faculty-schedule-card__badge">${item.roleLabel}</span>
                </div>
                <div class="faculty-schedule-card__subtitle">Group ${item.name || item.id} &middot; ${item.faculty}</div>
                <div class="faculty-schedule-card__meta">
                    <span class="faculty-schedule-card__meta-item"><i class="fas fa-calendar-day faculty-schedule-card__meta-icon"></i><span>${item.day || 'Day TBD'}</span></span>
                    <span class="faculty-schedule-card__meta-item"><i class="far fa-clock faculty-schedule-card__meta-icon"></i><span>${item.startTime} - ${item.endTime}</span></span>
                    <span class="faculty-schedule-card__meta-item"><i class="fas fa-location-dot faculty-schedule-card__meta-icon"></i><span>${item.room || 'Room TBD'}</span></span>
                </div>
            </div>
            <button class="lux-secondary-btn faculty-schedule-card__action" data-portal-msg-click="queue-lms-session" data-portal-msg-course-id="${item.courseId}" data-portal-msg-group-id="${item.id}">
                <i class="fas fa-book-reader"></i> Open in LMS
            </button>
        </div>
    `;
}
function renderFacultyScheduleWidgets() {
    const preview = document.getElementById('faculty-schedule-preview');
    const empty = document.getElementById('faculty-schedule-preview-empty');
    const helper = document.getElementById('faculty-schedule-preview-helper');
    if (!preview && !empty) return;
    const todayKey = getTodayScheduleDayKey();
    const items = getCurrentFacultyScheduleItems().filter(item => getScheduleDayKey(item.day) === todayKey);
    if (preview) {
        preview.innerHTML = items.slice(0, 4).map(item => buildFacultyScheduleCardHtml(item, true)).join('');
    }
    if (empty) {
        empty.hidden = items.length > 0;
        empty.textContent = 'No sessions scheduled for today.';
    }
    if (helper) {
        helper.textContent = "Only today's sessions from Master Scheduler are shown here for professors and teaching assistants.";
    }
}
function renderFacultySchedulePage() {
    const list = document.getElementById('faculty-schedule-page-list');
    const empty = document.getElementById('faculty-schedule-page-empty');
    if (!list && !empty) return;
    const weekStart = typeof getStoredWeekStart === 'function'
        ? getStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY)
        : getCurrentWeekStartISO();
    const items = typeof getCurrentFacultyScheduleItemsForWeek === 'function'
        ? getCurrentFacultyScheduleItemsForWeek(weekStart)
        : getCurrentFacultyScheduleItems();
    const uniqueDays = new Set(items.map(item => item.day).filter(Boolean));
    const totalHours = items.reduce((sum, item) => {
        const durationMinutes = parseInt(String(item.duration || '0').match(/\d+/)?.[0] || '0', 10);
        return sum + (durationMinutes / 60);
    }, 0);
    const sessionsStat = document.getElementById('faculty-schedule-stat-sessions');
    const daysStat = document.getElementById('faculty-schedule-stat-days');
    const hoursStat = document.getElementById('faculty-schedule-stat-hours');
    if (sessionsStat) sessionsStat.textContent = String(items.length);
    if (daysStat) daysStat.textContent = String(uniqueDays.size);
    if (hoursStat) hoursStat.textContent = `${totalHours.toFixed(1)}h`;
    if (typeof renderScheduleControls === 'function') {
        renderScheduleControls('faculty-schedule-controls', weekStart, items, {
            defaultView: 'sessions',
            roleLabel: 'Faculty schedule'
        });
    }
    if (list) {
        if (typeof renderScheduleSurfaceInto === 'function') {
            renderScheduleSurfaceInto(list, items, {
                weekStart,
                defaultView: 'sessions',
                enableLmsAction: true,
                emptyTitle: 'No sessions assigned for this week',
                emptyMessage: `Nothing is assigned for ${formatWeekRangeLabel(weekStart)} yet.`
            });
        } else {
            list.innerHTML = items.map(item => buildFacultyScheduleCardHtml(item, false)).join('');
        }
    }
    if (empty) empty.hidden = true;
}
function refreshFacultyScheduleUI() {
    renderFacultyScheduleWidgets();
    renderFacultySchedulePage();
}
function normalizeIdentifier(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}
/* Gradebook roster helpers: messenger-gradebook-runtime.js */
