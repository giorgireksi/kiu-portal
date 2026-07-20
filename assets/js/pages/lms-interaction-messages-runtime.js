/* LMS interaction messages runtime — merged class group chat and roster-scoped 1:1 DMs in the Interaction tab. */

function resolveDefaultLmsInteractionMode() {
    return typeof canManageLmsGroupContent === 'function' && canManageLmsGroupContent()
        ? 'announcements'
        : 'messages';
}

function ensureLmsInteractionUiState() {
    if (!window.__lmsInteractionUi) {
        window.__lmsInteractionUi = {
            mode: resolveDefaultLmsInteractionMode(),
            activeChatId: null,
            search: '',
            composeSearch: '',
            resourceKey: '',
            mobileView: 'rail',
            composeOpen: false
        };
    }
    if (window.__lmsInteractionUi.composeOpen == null) window.__lmsInteractionUi.composeOpen = false;
    if (window.__lmsInteractionUi.composeSearch == null) window.__lmsInteractionUi.composeSearch = '';
    return window.__lmsInteractionUi;
}

function getLmsInteractionMode() {
    return ensureLmsInteractionUiState().mode === 'messages' ? 'messages' : 'announcements';
}

function setLmsInteractionMode(mode, resourceKey = '') {
    const ui = ensureLmsInteractionUiState();
    ui.mode = mode === 'messages' ? 'messages' : 'announcements';
    if (resourceKey) ui.resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (ui.mode === 'announcements') {
        ui.activeChatId = null;
        ui.mobileView = 'rail';
        ui.composeOpen = false;
    } else {
        ui.mobileView = 'rail';
        ui.composeOpen = false;
    }
    if (typeof invalidateLmsInteractionTabCache === 'function') {
        invalidateLmsInteractionTabCache(ui.resourceKey || currentCourseId);
    }
    if (typeof renderLmsInteractionSection === 'function') {
        renderLmsInteractionSection(ui.resourceKey || currentCourseId);
    }
}

function stripLmsInteractionBoundFlags(root = document.getElementById('lms-content-area')) {
    if (!root) return;
    root.querySelectorAll('.lms-interaction-messenger, [data-lms-interaction-region="direct"]').forEach(node => {
        delete node.dataset.lmsInteractionBound;
        delete node.dataset.lmsInteractionModeBound;
    });
    root.querySelectorAll('[data-lms-interaction-message-input], [data-lms-interaction-reply-input], #lms-interaction-announce-input').forEach(node => {
        delete node.dataset.lmsInteractionBound;
        delete node.dataset.lmsInteractionMessageBound;
    });
}

function resolveLmsInteractionResourceKeyFromTarget(target) {
    const section = target?.closest?.('.lms-interaction-messenger[data-lms-interaction-resource]');
    if (section) {
        return resolveCanonicalLmsResourceKey(section.getAttribute('data-lms-interaction-resource') || '');
    }
    const ui = ensureLmsInteractionUiState();
    return resolveCanonicalLmsResourceKey(ui.resourceKey || currentCourseId || '');
}

function getLmsInteractionRoster(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const parsed = parseLmsCourseKey(canonicalKey);
    const domain = getDomain();
    const subjectId = canonicalCourseKey(parsed.courseId);
    const groupId = canonicalCourseKey(parsed.groupId);
    const group = (KIU_STATE.availableGroups?.[subjectId] || KIU_STATE.availableGroups?.[parsed.courseId] || [])
        .find(item => canonicalCourseKey(item?.id) === groupId) || null;
    const students = parsed.courseId && parsed.groupId
        ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId)
        : [];
    const professorUser = resolveUserFromName(domain?.usersById, group?.prof);
    const taUser = resolveUserFromName(domain?.usersById, group?.ta);
    const roster = [];
    const seen = new Set();

    const addMember = (user, roleLabel, tone, fallbackRole = USER_ROLES.STUDENT) => {
        const id = String(user?.id || '').trim();
        if (!id || seen.has(id)) return;
        seen.add(id);
        const displayName = typeof cleanupEncodingArtifacts === 'function'
            ? cleanupEncodingArtifacts(toEnglishText(user?.nameEn || user?.name || user?.email || id))
            : String(user?.nameEn || user?.name || user?.email || id);
        roster.push({
            id,
            displayName,
            roleLabel,
            tone,
            role: user?.role || fallbackRole,
            email: user?.email || ''
        });
    };

    if (professorUser) addMember(professorUser, 'Professor', 'is-professor', USER_ROLES.PROFESSOR);
    if (taUser) addMember(taUser, 'Teaching Assistant', 'is-ta', USER_ROLES.TA);
    students.forEach(student => {
        const studentUser = domain?.usersById?.[student.id] || null;
        addMember(
            studentUser ? { ...studentUser, id: student.id } : { id: student.id, name: student.name },
            'Student',
            'is-student',
            USER_ROLES.STUDENT
        );
    });
    return roster;
}

function getLmsInteractionRosterIds(resourceKey) {
    return new Set(getLmsInteractionRoster(resourceKey).map(member => String(member.id)));
}

function isLmsInteractionRosterMember(resourceKey, userId) {
    return getLmsInteractionRosterIds(resourceKey).has(String(userId || '').trim());
}

function buildLmsInteractionGroupChatId(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    return `lms-group::${canonicalKey}`;
}

function getLmsInteractionGroupChatLabel(resourceKey, ctx = {}) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const parsed = parseLmsCourseKey(canonicalKey);
    const subjectId = canonicalCourseKey(parsed.courseId);
    const groupId = canonicalCourseKey(parsed.groupId);
    const group = (KIU_STATE.availableGroups?.[subjectId] || KIU_STATE.availableGroups?.[parsed.courseId] || [])
        .find(item => canonicalCourseKey(item?.id) === groupId) || ctx?.group || null;
    const groupLabel = String(
        ctx?.groupLabel
        || ctx?.group?.group
        || ctx?.group?.name
        || group?.group
        || group?.name
        || parsed.groupId
        || 'Class'
    ).trim();
    return `${groupLabel} Class Chat`;
}

function ensureLmsInteractionGroupChat(resourceKey) {
    ensurePortalMessengerState();
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const chatId = buildLmsInteractionGroupChatId(canonicalKey);
    const rosterMemberIds = getLmsInteractionRoster(canonicalKey).map(member => String(member.id));
    const existingChat = KIU_STATE.portalMessengerChats?.[chatId] || null;
    let changed = false;

    if (!existingChat) {
        changed = true;
        KIU_STATE.portalMessengerChats[chatId] = {
            id: chatId,
            type: 'group',
            members: rosterMemberIds,
            name: getLmsInteractionGroupChatLabel(canonicalKey),
            lmsResourceKey: canonicalKey,
            createdBy: String(getCurrentUserId?.() || getCurrentUser()?.id || rosterMemberIds[0] || ''),
            createdAt: new Date().toISOString(),
            messages: [],
            requestStateByUser: {}
        };
    } else {
        const nextMembers = [...new Set([
            ...(existingChat.members || []).map(member => String(member)),
            ...rosterMemberIds
        ])];
        const nextName = getLmsInteractionGroupChatLabel(canonicalKey);
        if (JSON.stringify(nextMembers) !== JSON.stringify((existingChat.members || []).map(member => String(member)))) {
            changed = true;
            existingChat.members = nextMembers;
        }
        if (String(existingChat.lmsResourceKey || '') !== canonicalKey) {
            changed = true;
            existingChat.lmsResourceKey = canonicalKey;
        }
        if (String(existingChat.name || '') !== nextName) {
            changed = true;
            existingChat.name = nextName;
        }
        if (existingChat.type !== 'group') {
            changed = true;
            existingChat.type = 'group';
        }
    }

    KIU_STATE.portalMessengerChats[chatId] = typeof normalizePortalMessengerChatRecord === 'function'
        ? normalizePortalMessengerChatRecord(KIU_STATE.portalMessengerChats[chatId])
        : KIU_STATE.portalMessengerChats[chatId];
    if (changed && typeof saveState === 'function') saveState();
    return KIU_STATE.portalMessengerChats[chatId];
}

function getLmsInteractionGroupChat(resourceKey) {
    ensurePortalMessengerState();
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const chatId = buildLmsInteractionGroupChatId(canonicalKey);
    const byId = KIU_STATE.portalMessengerChats?.[chatId] || null;
    if (byId) return byId;
    return Object.values(KIU_STATE.portalMessengerChats || {}).find(chat => isLmsInteractionGroupChat(chat, canonicalKey)) || null;
}

function isLmsInteractionGroupChat(chat, resourceKey) {
    if (!chat || typeof chat !== 'object') return false;
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    return String(chat.id || '') === buildLmsInteractionGroupChatId(canonicalKey)
        || String(chat.lmsResourceKey || '') === canonicalKey;
}

function getLmsInteractionDirectChatsForUser(resourceKey, userId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const rosterIds = getLmsInteractionRosterIds(canonicalKey);
    if (typeof getPortalMessengerChatsForUser !== 'function') return [];
    const scoped = getPortalMessengerChatsForUser(String(userId))
        .filter(chat => chat.type !== 'group')
        .filter(chat => !isLmsInteractionGroupChat(chat, canonicalKey))
        .filter(chat => {
            const otherId = (chat.members || []).find(memberId => String(memberId) !== String(userId));
            return otherId && rosterIds.has(String(otherId));
        });
    return typeof dedupePortalMessengerDirectChats === 'function'
        ? dedupePortalMessengerDirectChats(scoped, userId)
        : scoped;
}

function getLmsInteractionDirectory(resourceKey, search = '') {
    const currentUserId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    const normalizedSearch = String(search || '').trim().toLowerCase();
    return getLmsInteractionRoster(resourceKey)
        .filter(member => String(member.id) !== currentUserId)
        .filter(member => {
            if (!normalizedSearch) return true;
            const haystack = [member.displayName, member.id, member.email, member.roleLabel].join(' ').toLowerCase();
            return haystack.includes(normalizedSearch);
        });
}

function getLmsInteractionChatsForUser(resourceKey, userId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const groupChat = ensureLmsInteractionGroupChat(canonicalKey);
    const directChats = getLmsInteractionDirectChatsForUser(canonicalKey, userId);
    if (!groupChat) return directChats;
    const normalizedUserId = String(userId || '');
    const isMember = (groupChat.members || []).some(memberId => String(memberId) === normalizedUserId);
    if (!isMember) return directChats;
    return [groupChat, ...directChats];
}

function getLmsInteractionMemberById(resourceKey, userId) {
    return getLmsInteractionRoster(resourceKey).find(member => String(member.id) === String(userId || '')) || null;
}

function getLmsInteractionChatPartner(chat, currentUserId) {
    const otherId = (chat?.members || []).find(memberId => String(memberId) !== String(currentUserId));
    return otherId ? String(otherId) : '';
}

function getLmsInteractionDirectStats(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const roster = getLmsInteractionRoster(canonicalKey);
    const userId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    const groupChat = userId ? ensureLmsInteractionGroupChat(canonicalKey) : null;
    const directChats = userId ? getLmsInteractionDirectChatsForUser(canonicalKey, userId) : [];
    const directUnread = directChats.reduce((sum, chat) => {
        if (typeof getPortalMessengerUnreadCount === 'function') {
            return sum + Number(getPortalMessengerUnreadCount(chat, userId) || 0);
        }
        return sum;
    }, 0);
    const groupUnread = groupChat && typeof getPortalMessengerUnreadCount === 'function'
        ? Number(getPortalMessengerUnreadCount(groupChat, userId) || 0)
        : 0;
    return {
        rosterCount: roster.length,
        chatCount: directChats.length,
        groupChatMessages: Array.isArray(groupChat?.messages) ? groupChat.messages.length : 0,
        groupMemberCount: groupChat?.members?.length || roster.length,
        hasGroupChat: Boolean(groupChat),
        directUnread,
        groupUnread,
        unread: directUnread + groupUnread
    };
}

function getLmsInteractionActiveChat(resourceKey) {
    ensurePortalMessengerState();
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const ui = ensureLmsInteractionUiState();
    const userId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    const chats = getLmsInteractionChatsForUser(canonicalKey, userId);
    if (ui.activeChatId && !chats.some(chat => String(chat.id) === String(ui.activeChatId))) {
        const stale = KIU_STATE.portalMessengerChats?.[ui.activeChatId];
        const otherId = (stale?.members || []).find(memberId => String(memberId) !== userId);
        if (otherId && typeof findPortalMessengerDirectChat === 'function') {
            const canonical = findPortalMessengerDirectChat(userId, otherId);
            if (canonical?.id) ui.activeChatId = canonical.id;
        }
    }
    if (ui.activeChatId && chats.some(chat => String(chat.id) === String(ui.activeChatId))) {
        return KIU_STATE.portalMessengerChats?.[ui.activeChatId] || null;
    }
    const groupChat = chats.find(chat => isLmsInteractionGroupChat(chat, canonicalKey)) || null;
    if (groupChat) {
        ui.activeChatId = groupChat.id;
        return groupChat;
    }
    if (chats[0]) {
        ui.activeChatId = chats[0].id;
        return chats[0];
    }
    ui.activeChatId = null;
    return null;
}

function markLmsInteractionChatRead(chatId) {
    const userId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    const normalizedChatId = String(chatId || '').trim();
    const chat = KIU_STATE.portalMessengerChats?.[normalizedChatId];
    if (!chat || !userId) return;
    let changed = false;
    const now = new Date().toISOString();
    chat.messages = (chat.messages || []).map(message => {
        if (String(message.senderId) === userId) return message;
        const seenBy = Array.isArray(message.seenBy) ? message.seenBy.map(String) : [];
        if (seenBy.includes(userId)) return message;
        changed = true;
        return {
            ...message,
            seenBy: [...seenBy, userId],
            seenAtByUser: { ...(message.seenAtByUser || {}), [userId]: now }
        };
    });
    if (changed && typeof saveState === 'function') saveState();
    if (typeof kiuRealtimeFetch === 'function') {
        kiuRealtimeFetch(`/api/messenger/chats/${encodeURIComponent(normalizedChatId)}/read`, {
            method: 'POST',
            body: {}
        }).catch(() => {});
    }
}

async function openLmsInteractionDirectChat(resourceKey, userId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const normalizedUserId = String(userId || '').trim();
    const currentUserId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    if (!canonicalKey || !normalizedUserId || !currentUserId) return;
    if (!isLmsInteractionRosterMember(canonicalKey, normalizedUserId)) return;
    let chat = typeof findPortalMessengerDirectChat === 'function'
        ? findPortalMessengerDirectChat(currentUserId, normalizedUserId)
        : null;
    if (!chat && typeof kiuRealtimeFetch === 'function') {
        const payload = await kiuRealtimeFetch('/api/messenger/direct', {
            method: 'POST',
            body: { userA: currentUserId, userB: normalizedUserId }
        }).catch(() => null);
        if (payload?.chat && typeof reconcilePortalMessengerDirectChatDuplicates === 'function') {
            chat = reconcilePortalMessengerDirectChatDuplicates(payload.chat, true);
        } else if (payload?.chat && typeof upsertPortalMessengerChatFromRealtime === 'function') {
            chat = upsertPortalMessengerChatFromRealtime(payload.chat, true);
        }
    }
    if (!chat && typeof ensurePortalMessengerDirectChat === 'function') {
        chat = ensurePortalMessengerDirectChat(currentUserId, normalizedUserId);
        if (typeof findPortalMessengerDirectChat === 'function') {
            chat = findPortalMessengerDirectChat(currentUserId, normalizedUserId) || chat;
        }
    }
    const ui = ensureLmsInteractionUiState();
    ui.resourceKey = canonicalKey;
    ui.activeChatId = chat?.id || null;
    ui.mobileView = 'thread';
    ui.composeOpen = false;
    markLmsInteractionChatRead(chat?.id);
    if (typeof invalidateLmsInteractionTabCache === 'function') invalidateLmsInteractionTabCache(canonicalKey);
    updateLmsInteractionMessagesUi(canonicalKey);
}

function openLmsInteractionGroupChat(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentUserId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    if (!canonicalKey || !currentUserId) return;
    if (!isLmsInteractionRosterMember(canonicalKey, currentUserId)) return;
    const chat = ensureLmsInteractionGroupChat(canonicalKey);
    const ui = ensureLmsInteractionUiState();
    ui.resourceKey = canonicalKey;
    ui.activeChatId = chat?.id || null;
    ui.mobileView = 'thread';
    markLmsInteractionChatRead(chat?.id);
    updateLmsInteractionMessagesUi(canonicalKey);
}

function ensureLmsInteractionFileInput() {
    let input = document.getElementById('lms-interaction-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'lms-interaction-file-input';
        input.hidden = true;
        input.accept = 'image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt';
        document.body.appendChild(input);
    }
    return input;
}

function setLmsInteractionDraftFile(chatId, file, resourceKey) {
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
        updateLmsInteractionMessagesUi(resourceKey);
    };
    reader.readAsDataURL(file);
}

function pickLmsInteractionFile(chatId, resourceKey) {
    const input = ensureLmsInteractionFileInput();
    input.value = '';
    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        setLmsInteractionDraftFile(chatId, file, resourceKey);
    };
    input.click();
}

function renderLmsInteractionDirectAttachmentHtml(file) {
    if (!file || typeof file !== 'object') return '';
    const resolvedFileUrl = typeof resolvePortalMessengerFileUrl === 'function'
        ? resolvePortalMessengerFileUrl(file)
        : String(file.dataUrl || '').trim();
    if (!resolvedFileUrl) return '';
    if (typeof isPortalMessengerImageFile === 'function' && isPortalMessengerImageFile(file)) {
        return typeof buildPortalMessengerImagePreviewHtml === 'function'
            ? buildPortalMessengerImagePreviewHtml(file, false, 'lms-interaction-direct__image')
            : '';
    }
    if (file.type?.startsWith('video/')) {
        return `<div class="lms-interaction-direct__video"><video controls preload="metadata" src="${resolvedFileUrl}"></video></div>`;
    }
    const label = escapeHtml(file.name || 'Attachment');
    const downloadHtml = typeof getStoredFileDownloadHtml === 'function'
        ? getStoredFileDownloadHtml(file, label)
        : `<a href="${resolvedFileUrl}" download="${label}"><i class="fas fa-file-download"></i> ${label}</a>`;
    return `<div class="lms-interaction-direct__file">${downloadHtml}</div>`;
}

function getLmsInteractionMessageRoleMeta(resourceKey, message, currentUserId) {
    const senderId = String(message?.senderId || '');
    const member = getLmsInteractionMemberById(resourceKey, senderId);
    const roleLabel = member?.roleLabel
        || (typeof getPortalMessengerRoleLabel === 'function'
            ? getPortalMessengerRoleLabel(message?.senderRole)
            : 'Student');
    const roleTone = member?.tone || 'is-student';
    const senderName = escapeHtml(message?.senderName || senderId || 'Member');
    if (String(senderId) === String(currentUserId)) {
        return 'You';
    }
    return `${senderName} <span class="lms-interaction-direct__bubble-role ${escapeHtml(roleTone)}">${escapeHtml(roleLabel)}</span>`;
}

function renderLmsInteractionDirectMessageList(activeChat, currentUserId, resourceKey = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey || ensureLmsInteractionUiState().resourceKey || '');
    const isGroup = isLmsInteractionGroupChat(activeChat, canonicalKey);
    if (!(activeChat?.messages || []).length) {
        const emptyCopy = isGroup
            ? 'Start the class conversation. Everyone in your group can see messages here.'
            : 'Say hello and share files or pictures with your classmate.';
        return `
            <div class="lms-interaction-empty lms-route-empty lms-route-empty--interaction">
                <div class="lms-interaction-empty-icon lms-route-empty-icon"><i class="fas fa-${isGroup ? 'users' : 'comments'}"></i></div>
                <div class="lms-route-empty-title">No messages yet</div>
                <div class="lms-route-empty-copy">${emptyCopy}</div>
            </div>
        `;
    }
    return activeChat.messages.map(message => {
        const mine = String(message.senderId) === String(currentUserId);
        const seenLabel = !isGroup && mine && ensureArray(message.seenBy).some(id => String(id) !== String(currentUserId))
            ? '<div class="lms-interaction-direct__seen">Seen</div>'
            : '';
        const attachmentHtml = message.file ? renderLmsInteractionDirectAttachmentHtml(message.file) : '';
        const senderMeta = isGroup && !mine
            ? getLmsInteractionMessageRoleMeta(canonicalKey, message, currentUserId)
            : (mine ? 'You' : escapeHtml(message.senderName || message.senderId));
        return `
            <article class="lms-interaction-direct__bubble-row ${mine ? 'is-me' : ''} ${isGroup ? 'is-group-message' : ''}">
                <div class="lms-interaction-direct__bubble-meta">
                    ${senderMeta}
                    &middot; ${escapeHtml(formatLmsDateTime(message.sentAt))}
                </div>
                <div class="lms-interaction-direct__bubble ${mine ? 'is-me' : ''}">
                    ${message.text ? `<div class="lms-interaction-direct__bubble-text">${escapeHtml(message.text)}</div>` : ''}
                    ${attachmentHtml}
                    ${seenLabel}
                </div>
            </article>
        `;
    }).join('');
}

function renderLmsInteractionGroupChatCard(resourceKey, groupChat, currentUserId, activeChatId) {
    if (!groupChat) return '';
    const memberCount = (groupChat.members || []).length;
    const title = String(groupChat.name || 'Class Chat').trim() || 'Class Chat';
    const unread = typeof getPortalMessengerUnreadCount === 'function'
        ? Number(getPortalMessengerUnreadCount(groupChat, currentUserId) || 0)
        : 0;
    const lastTime = typeof getPortalMessengerChatLastTime === 'function'
        ? getPortalMessengerChatLastTime(groupChat)
        : '';
    const isActive = String(activeChatId) === String(groupChat.id);
    return `
        <button
            type="button"
            class="lms-interaction-direct__group-chat ${isActive ? 'is-active' : ''}"
            data-lms-interaction-action="open-group-chat"
            data-lms-interaction-chat-id="${escapeHtml(groupChat.id)}"
        >
            <div class="lms-interaction-direct__group-icon" aria-hidden="true"><i class="fas fa-users"></i></div>
            <div class="lms-interaction-direct__chat-main">
                <div class="lms-interaction-direct__chat-title-row">
                    <div class="lms-interaction-direct__chat-title">${escapeHtml(title)}</div>
                    ${unread ? `<span class="lms-interaction-direct__unread">${unread}</span>` : ''}
                </div>
                <div class="lms-interaction-direct__chat-preview">${memberCount} members · everyone in this group</div>
            </div>
            <div class="lms-interaction-direct__chat-time">${escapeHtml(lastTime)}</div>
        </button>
    `;
}

function getLmsInteractionInboxThreads(resourceKey, userId, search = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const directChats = getLmsInteractionDirectChatsForUser(canonicalKey, userId);
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const sorted = [...directChats].sort((a, b) => {
        const aStamp = a.messages?.[a.messages.length - 1]?.sentAt || a.createdAt || '';
        const bStamp = b.messages?.[b.messages.length - 1]?.sentAt || b.createdAt || '';
        return String(bStamp).localeCompare(String(aStamp));
    });
    if (!normalizedSearch) return sorted;
    return sorted.filter(chat => {
        const partnerId = getLmsInteractionChatPartner(chat, userId);
        const partner = getLmsInteractionMemberById(canonicalKey, partnerId);
        const displayName = partner?.displayName || getPortalMessengerDisplayNameForChat(chat, userId);
        const preview = typeof getPortalMessengerMessagePreview === 'function' ? getPortalMessengerMessagePreview(chat) : '';
        const haystack = [displayName, preview, partner?.roleLabel].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(normalizedSearch);
    });
}

function getLmsInteractionMembersForInbox(resourceKey, userId, search = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const directByPartner = new Map();
    getLmsInteractionDirectChatsForUser(canonicalKey, userId).forEach(chat => {
        const partnerId = getLmsInteractionChatPartner(chat, userId);
        if (partnerId) directByPartner.set(String(partnerId), chat);
    });
    return getLmsInteractionRoster(canonicalKey)
        .filter(member => String(member.id) !== String(userId))
        .filter(member => {
            if (!normalizedSearch) return true;
            const haystack = [member.displayName, member.id, member.email, member.roleLabel].join(' ').toLowerCase();
            return haystack.includes(normalizedSearch);
        })
        .map(member => ({
            ...member,
            existingChat: directByPartner.get(String(member.id)) || null
        }));
}

function getLmsInteractionRecentThreads(resourceKey, userId, search = '') {
    return getLmsInteractionInboxThreads(resourceKey, userId, search).filter(chat => {
        const hasMessages = Array.isArray(chat.messages) && chat.messages.length > 0;
        const unread = typeof getPortalMessengerUnreadCount === 'function'
            ? Number(getPortalMessengerUnreadCount(chat, userId) || 0) > 0
            : false;
        return hasMessages || unread;
    });
}

function shouldShowLmsInteractionGroupInInbox(groupChat, resourceKey, search = '') {
    if (!groupChat) return false;
    const normalizedSearch = String(search || '').trim().toLowerCase();
    if (!normalizedSearch) return true;
    const preview = typeof getPortalMessengerMessagePreview === 'function' ? getPortalMessengerMessagePreview(groupChat) : '';
    const haystack = [groupChat.name, preview, 'class chat', 'everyone'].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
}

function renderLmsInteractionMemberRow(member, resourceKey, currentUserId, activeChatId) {
    const unread = member.existingChat && typeof getPortalMessengerUnreadCount === 'function'
        ? Number(getPortalMessengerUnreadCount(member.existingChat, currentUserId) || 0)
        : 0;
    const isActive = member.existingChat && String(activeChatId) === String(member.existingChat.id);
    const initials = String(member.displayName || '?').trim().charAt(0).toUpperCase() || '?';
    const preview = member.existingChat && typeof getPortalMessengerMessagePreview === 'function'
        ? getPortalMessengerMessagePreview(member.existingChat)
        : 'Tap to message';
    return `
        <button
            type="button"
            class="lms-interaction-direct__member-row ${isActive ? 'is-active' : ''}"
            data-lms-interaction-action="open-user"
            data-lms-interaction-user-id="${escapeHtml(member.id)}"
        >
            <div class="lms-interaction-avatar lms-route-avatar ${escapeHtml(member.tone || 'is-student')}" aria-hidden="true">${escapeHtml(initials)}</div>
            <div class="lms-interaction-direct__chat-main">
                <div class="lms-interaction-direct__chat-title-row">
                    <div class="lms-interaction-direct__chat-title">${escapeHtml(member.displayName)}</div>
                    ${unread ? `<span class="lms-interaction-direct__unread">${unread}</span>` : ''}
                </div>
                <div class="lms-interaction-direct__chat-preview">${escapeHtml(member.roleLabel)} · ${escapeHtml(preview)}</div>
            </div>
        </button>
    `;
}

function renderLmsInteractionInboxThreadItem(chat, resourceKey, currentUserId, activeChatId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const partnerId = getLmsInteractionChatPartner(chat, currentUserId);
    const partner = getLmsInteractionMemberById(canonicalKey, partnerId);
    const displayName = partner?.displayName || getPortalMessengerDisplayNameForChat(chat, currentUserId);
    const initials = String(displayName || '?').trim().charAt(0).toUpperCase() || '?';
    const unread = typeof getPortalMessengerUnreadCount === 'function'
        ? Number(getPortalMessengerUnreadCount(chat, currentUserId) || 0)
        : 0;
    const preview = typeof getPortalMessengerMessagePreview === 'function'
        ? getPortalMessengerMessagePreview(chat)
        : 'No messages yet';
    const lastTime = typeof getPortalMessengerChatLastTime === 'function'
        ? getPortalMessengerChatLastTime(chat)
        : '';
    return `
        <button
            type="button"
            class="lms-interaction-direct__chat-item ${String(activeChatId) === String(chat.id) ? 'is-active' : ''}"
            data-lms-interaction-action="open-chat"
            data-lms-interaction-chat-id="${escapeHtml(chat.id)}"
        >
            <div class="lms-interaction-avatar lms-route-avatar ${escapeHtml(partner?.tone || 'is-student')}" aria-hidden="true">${escapeHtml(initials)}</div>
            <div class="lms-interaction-direct__chat-main">
                <div class="lms-interaction-direct__chat-title-row">
                    <div class="lms-interaction-direct__chat-title">${escapeHtml(displayName)}</div>
                    ${unread ? `<span class="lms-interaction-direct__unread">${unread}</span>` : ''}
                </div>
                <div class="lms-interaction-direct__chat-preview">${escapeHtml(preview)}</div>
            </div>
            <div class="lms-interaction-direct__chat-time">${escapeHtml(lastTime)}</div>
        </button>
    `;
}

function renderLmsInteractionInboxMarkup(resourceKey, currentUserId, activeChatId, search = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const groupChat = ensureLmsInteractionGroupChat(canonicalKey);
    const members = getLmsInteractionMembersForInbox(canonicalKey, currentUserId, search);
    const recentChats = getLmsInteractionRecentThreads(canonicalKey, currentUserId, search);
    const showGroup = shouldShowLmsInteractionGroupInInbox(groupChat, canonicalKey, search);
    const groupCard = showGroup
        ? renderLmsInteractionGroupChatCard(canonicalKey, groupChat, currentUserId, activeChatId)
        : '';
    const memberItems = members.map(member => renderLmsInteractionMemberRow(member, canonicalKey, currentUserId, activeChatId)).join('');
    const recentItems = recentChats.map(chat => renderLmsInteractionInboxThreadItem(chat, canonicalKey, currentUserId, activeChatId)).join('');
    if (!groupCard && !memberItems && !recentItems) {
        return `<div class="lms-interaction-direct__empty">No classmates match your search.</div>`;
    }
    const primarySection = groupCard
        ? `<div class="lms-interaction-direct__inbox-section is-primary">${groupCard}</div>`
        : '';
    const membersBody = memberItems
        || `<div class="lms-interaction-direct__empty">No classmates available in this group.</div>`;
    const membersSection = `
        <div class="lms-interaction-direct__inbox-section is-directory">
            <header class="lms-interaction-direct__inbox-section-head">
                <div class="lms-interaction-direct__section-title is-members">Members</div>
            </header>
            <div class="lms-interaction-direct__inbox-section-body">${membersBody}</div>
        </div>
    `;
    const recentSection = recentItems
        ? `<div class="lms-interaction-direct__section-title is-recent">Recent</div>${recentItems}`
        : '';
    return `
        ${primarySection}
        ${membersSection}
        ${recentSection}
    `;
}

function renderLmsInteractionRailHead(ui) {
    if (ui.composeOpen) {
        return `
            <div class="lms-interaction-direct__rail-head is-compose">
                <div class="lms-interaction-direct__rail-compose-head">
                    <button
                        type="button"
                        class="lms-interaction-direct__compose-back lux-secondary-btn"
                        data-lms-interaction-action="close-compose"
                        aria-label="Back to conversations"
                    ><i class="fas fa-arrow-left"></i></button>
                    <div class="lms-interaction-direct__compose-title">New message</div>
                    <button
                        type="button"
                        class="lms-interaction-direct__compose-close lux-secondary-btn"
                        data-lms-interaction-action="close-compose"
                        aria-label="Close"
                    ><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    }
    return `
        <div class="lms-interaction-direct__rail-head">
            <div class="lms-interaction-direct__rail-tools">
                <div class="lms-interaction-direct__search-wrap">
                    <input
                        type="search"
                        class="lms-interaction-direct__search"
                        placeholder="Search conversations…"
                        value="${escapeHtml(ui.search || '')}"
                        data-lms-interaction-input="search"
                    >
                </div>
                <button
                    type="button"
                    class="lms-interaction-direct__compose-trigger lux-secondary-btn"
                    data-lms-interaction-action="open-compose"
                ><i class="fas fa-pen"></i><span class="lms-interaction-direct__compose-label">New message</span></button>
            </div>
        </div>
    `;
}

function renderLmsInteractionComposeRail(resourceKey, search = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    return `
        <div class="lms-interaction-direct__compose-sheet" data-lms-interaction-region="compose-rail" role="region" aria-label="New message">
            <div class="lms-interaction-direct__compose-search-wrap">
                <input
                    type="search"
                    class="lms-interaction-direct__compose-search"
                    placeholder="Search classmates…"
                    value="${escapeHtml(search || '')}"
                    data-lms-interaction-input="compose-search"
                >
            </div>
            <div class="lms-interaction-direct__compose-list">
                ${renderLmsInteractionDirectoryMarkup(canonicalKey, search)}
            </div>
        </div>
    `;
}

function renderLmsInteractionChatListMarkup(resourceKey, currentUserId, activeChatId) {
    return renderLmsInteractionInboxMarkup(resourceKey, currentUserId, activeChatId, ensureLmsInteractionUiState().search || '');
}

function renderLmsInteractionDirectoryMarkup(resourceKey, search = '') {
    const directory = getLmsInteractionDirectory(resourceKey, search);
    if (!directory.length) {
        return `<div class="lms-interaction-direct__empty">No classmates match your search.</div>`;
    }
    return directory.map(person => {
        const initials = String(person.displayName || '?').trim().charAt(0).toUpperCase() || '?';
        return `
            <button
                type="button"
                class="lms-interaction-direct__person"
                data-lms-interaction-action="open-user"
                data-lms-interaction-user-id="${escapeHtml(person.id)}"
            >
                <div class="lms-interaction-avatar lms-route-avatar ${escapeHtml(person.tone)}" aria-hidden="true">${escapeHtml(initials)}</div>
                <div class="lms-interaction-direct__person-main">
                    <div class="lms-interaction-direct__person-name">${escapeHtml(person.displayName)}</div>
                    <div class="lms-interaction-direct__person-role">${escapeHtml(person.roleLabel)}</div>
                </div>
                <span class="lms-route-pill">${escapeHtml(person.roleLabel)}</span>
            </button>
        `;
    }).join('');
}

function renderLmsInteractionDirectThreadMarkup(resourceKey, activeChat, currentUserId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!activeChat) {
        return `
            <div class="lms-interaction-direct__thread-empty lms-route-empty lms-route-empty--interaction">
                <div class="lms-route-empty-title">Choose a conversation</div>
                <div class="lms-route-empty-copy">Open class chat for everyone in your group, or select a private message from the left.</div>
            </div>
        `;
    }
    const isGroup = isLmsInteractionGroupChat(activeChat, canonicalKey);
    const partnerId = getLmsInteractionChatPartner(activeChat, currentUserId);
    const partner = getLmsInteractionMemberById(canonicalKey, partnerId);
    const memberCount = (activeChat.members || []).length;
    const displayName = isGroup
        ? (String(activeChat.name || 'Class Chat').trim() || 'Class Chat')
        : (partner?.displayName || getPortalMessengerDisplayNameForChat(activeChat, currentUserId));
    const threadCopy = isGroup
        ? `${memberCount} members · everyone in this group`
        : (partner?.roleLabel || 'Class member');
    const partnerInitial = String(displayName || '?').trim().charAt(0).toUpperCase() || '?';
    const threadAvatar = isGroup
        ? '<div class="lms-interaction-direct__thread-avatar lms-interaction-direct__group-icon" aria-hidden="true"><i class="fas fa-users"></i></div>'
        : `<div class="lms-interaction-direct__thread-avatar lms-interaction-avatar lms-route-avatar ${escapeHtml(partner?.tone || '')}" aria-hidden="true">${escapeHtml(partnerInitial)}</div>`;
    const inputId = `lms-interaction-direct-input-${toDomToken(activeChat.id)}`;
    const draft = typeof getPortalMessengerDraftFile === 'function' ? getPortalMessengerDraftFile(activeChat.id) : null;
    const draftPreview = draft
        ? (typeof isPortalMessengerImageFile === 'function' && isPortalMessengerImageFile(draft) && draft.dataUrl
            ? `<img class="lms-interaction-direct__draft-image" src="${draft.dataUrl}" alt="${escapeHtml(draft.name || 'Draft image')}">`
            : `<span><i class="fas fa-paperclip"></i> ${escapeHtml(draft.name || 'Attachment ready')}</span>`)
        : '';
    const draftClass = draft ? 'lms-interaction-direct__draft' : 'lms-interaction-direct__draft is-empty';
    const messagePlaceholder = isGroup ? 'Message the class…' : 'Write a message…';
    const ui = ensureLmsInteractionUiState();
    const withRail = ui.mobileView !== 'thread';
    const threadHeadRailClass = withRail ? ' lms-interaction-direct__thread-head--with-rail' : '';
    const isLogEmpty = !(activeChat?.messages || []).length;

    return `
        <header class="lms-interaction-direct__thread-head ${isGroup ? 'is-group' : ''}${threadHeadRailClass}">
            <button type="button" class="lms-interaction-direct__back lux-secondary-btn" data-lms-interaction-action="show-rail" aria-label="Back to conversations">
                <i class="fas fa-arrow-left"></i>
            </button>
            ${threadAvatar}
            <div class="lms-interaction-direct__thread-title-wrap">
                <div class="lms-interaction-direct__thread-title">${escapeHtml(displayName)}</div>
                <div class="lms-interaction-direct__thread-copy">${escapeHtml(threadCopy)}</div>
            </div>
        </header>
        <div class="lms-interaction-direct__log${isLogEmpty ? ' lms-interaction-direct__log--empty' : ''}" data-lms-interaction-region="direct-log">
            ${renderLmsInteractionDirectMessageList(activeChat, currentUserId, canonicalKey)}
        </div>
        <div class="lms-interaction-direct__composer" data-lms-interaction-drop-chat="${escapeHtml(activeChat.id)}">
            <div class="lms-interaction-compose-row">
                <button
                    class="lms-interaction-compose-attach lux-secondary-btn"
                    type="button"
                    title="Attach file or picture"
                    data-lms-interaction-action="pick-file"
                    data-lms-interaction-chat-id="${escapeHtml(activeChat.id)}"
                ><i class="fas fa-paperclip"></i></button>
                <input
                    id="${inputId}"
                    class="lms-interaction-compose-input"
                    type="text"
                    placeholder="${messagePlaceholder}"
                    data-lms-interaction-message-input="${escapeHtml(activeChat.id)}"
                >
                <button
                    class="lms-interaction-compose-send"
                    type="button"
                    data-lms-interaction-action="send-message"
                    data-lms-interaction-chat-id="${escapeHtml(activeChat.id)}"
                    data-lms-interaction-input-id="${escapeHtml(inputId)}"
                ><i class="fas fa-paper-plane"></i> Send</button>
            </div>
            <div class="${draftClass}">${draftPreview}</div>
        </div>
    `;
}

function renderLmsInteractionMessagesPane(resourceKey) {
    ensurePortalMessengerState();
    const ui = ensureLmsInteractionUiState();
    ui.resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentUserId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    const activeChat = getLmsInteractionActiveChat(ui.resourceKey);
    if (activeChat?.id) ui.activeChatId = activeChat.id;
    const mobileView = ui.mobileView === 'thread' && activeChat ? 'thread' : 'rail';

    return `
        <div class="lms-interaction-direct ${mobileView === 'thread' ? 'is-thread-view' : 'is-rail-view'} ${ui.composeOpen ? 'is-compose-open' : ''}" data-lms-interaction-region="direct">
            <aside class="lms-interaction-direct__rail" data-lms-interaction-region="direct-rail">
                ${renderLmsInteractionRailHead(ui)}
                <div class="lms-interaction-direct__rail-body">
                    <div class="lms-interaction-direct__inbox" data-lms-interaction-region="direct-inbox">
                        ${renderLmsInteractionInboxMarkup(ui.resourceKey, currentUserId, ui.activeChatId, ui.search)}
                    </div>
                    ${renderLmsInteractionComposeRail(ui.resourceKey, ui.composeSearch || '')}
                </div>
            </aside>
            <div class="lms-interaction-direct__thread" data-lms-interaction-region="direct-thread">
                ${renderLmsInteractionDirectThreadMarkup(ui.resourceKey, activeChat, currentUserId)}
            </div>
        </div>
    `;
}

function scrollLmsInteractionDirectLogToBottom(log) {
    if (!log) return;
    log.scrollTop = log.scrollHeight;
}

function bindLmsInteractionDelegatedEvents(contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea || contentArea.dataset.lmsInteractionDelegatedBound === '1') return;
    contentArea.dataset.lmsInteractionDelegatedBound = '1';

    contentArea.addEventListener('click', event => {
        const modeButton = event.target.closest('[data-lms-interaction-mode]');
        if (modeButton && contentArea.contains(modeButton)) {
            const resourceKey = resolveLmsInteractionResourceKeyFromTarget(modeButton);
            setLmsInteractionMode(modeButton.getAttribute('data-lms-interaction-mode') || 'announcements', resourceKey);
            return;
        }

        const actionEl = event.target.closest('[data-lms-interaction-action]');
        if (!actionEl || !contentArea.contains(actionEl)) return;
        const action = String(actionEl.dataset.lmsInteractionAction || '').trim();
        const canonicalKey = resolveLmsInteractionResourceKeyFromTarget(actionEl);
        const ui = ensureLmsInteractionUiState();

        if (action === 'open-compose') {
            ui.composeOpen = true;
            ui.composeSearch = '';
            ui.mobileView = 'rail';
            updateLmsInteractionMessagesUi(canonicalKey);
            return;
        }
        if (action === 'close-compose') {
            ui.composeOpen = false;
            ui.composeSearch = '';
            updateLmsInteractionMessagesUi(canonicalKey);
            return;
        }
        if (action === 'open-chat' || action === 'open-group-chat') {
            ui.activeChatId = actionEl.dataset.lmsInteractionChatId || null;
            ui.mobileView = 'thread';
            ui.composeOpen = false;
            markLmsInteractionChatRead(ui.activeChatId);
            if (typeof invalidateLmsInteractionTabCache === 'function') invalidateLmsInteractionTabCache(canonicalKey);
            updateLmsInteractionMessagesUi(canonicalKey);
            return;
        }
        if (action === 'open-user') {
            openLmsInteractionDirectChat(canonicalKey, actionEl.dataset.lmsInteractionUserId || '');
            return;
        }
        if (action === 'show-rail') {
            ui.mobileView = 'rail';
            updateLmsInteractionMessagesUi(canonicalKey);
            return;
        }
        if (action === 'pick-file') {
            pickLmsInteractionFile(actionEl.dataset.lmsInteractionChatId || '', canonicalKey);
            return;
        }
        if (action === 'send-message') {
            sendLmsInteractionDirectMessage(
                canonicalKey,
                actionEl.dataset.lmsInteractionChatId || '',
                actionEl.dataset.lmsInteractionInputId || ''
            );
        }
    });

    let interactionSearchDebounceTimer = 0;

    contentArea.addEventListener('input', event => {
        const inputEl = event.target.closest('[data-lms-interaction-input]');
        if (!inputEl || !contentArea.contains(inputEl)) return;
        const inputType = String(inputEl.dataset.lmsInteractionInput || '').trim();
        const ui = ensureLmsInteractionUiState();
        const canonicalKey = resolveLmsInteractionResourceKeyFromTarget(inputEl);
        const currentUserId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');

        if (inputType === 'search') {
            ui.search = inputEl.value || '';
            window.clearTimeout(interactionSearchDebounceTimer);
            interactionSearchDebounceTimer = window.setTimeout(() => {
                interactionSearchDebounceTimer = 0;
                const inbox = contentArea.querySelector('[data-lms-interaction-region="direct-inbox"]');
                if (inbox) {
                    inbox.innerHTML = renderLmsInteractionInboxMarkup(canonicalKey, currentUserId, ui.activeChatId, ui.search);
                }
            }, 180);
            return;
        }
        if (inputType === 'compose-search') {
            ui.composeSearch = inputEl.value || '';
            window.clearTimeout(interactionSearchDebounceTimer);
            interactionSearchDebounceTimer = window.setTimeout(() => {
                interactionSearchDebounceTimer = 0;
                const composeList = contentArea.querySelector('.lms-interaction-direct__compose-list');
                if (composeList) {
                    composeList.innerHTML = renderLmsInteractionDirectoryMarkup(canonicalKey, ui.composeSearch);
                }
            }, 180);
        }
    });

    contentArea.addEventListener('keyup', event => {
        if (event.key !== 'Enter') return;

        const announceInput = event.target.closest('#lms-interaction-announce-input');
        if (announceInput && contentArea.contains(announceInput)) {
            sendLmsInteractionMessage(resolveLmsInteractionResourceKeyFromTarget(announceInput));
            return;
        }

        const replyInput = event.target.closest('[data-lms-interaction-reply-input]');
        if (replyInput && contentArea.contains(replyInput)) {
            sendLmsInteractionReply(
                resolveLmsInteractionResourceKeyFromTarget(replyInput),
                replyInput.getAttribute('data-lms-interaction-reply-input') || ''
            );
            return;
        }

        const messageInput = event.target.closest('[data-lms-interaction-message-input]');
        if (messageInput && contentArea.contains(messageInput)) {
            sendLmsInteractionDirectMessage(
                resolveLmsInteractionResourceKeyFromTarget(messageInput),
                messageInput.getAttribute('data-lms-interaction-message-input') || '',
                messageInput.id
            );
        }
    });

    contentArea.addEventListener('dragover', event => {
        if (event.target.closest('[data-lms-interaction-drop-chat]')) event.preventDefault();
    });

    contentArea.addEventListener('drop', event => {
        const dropZone = event.target.closest('[data-lms-interaction-drop-chat]');
        if (!dropZone || !contentArea.contains(dropZone)) return;
        event.preventDefault();
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        setLmsInteractionDraftFile(
            dropZone.getAttribute('data-lms-interaction-drop-chat') || '',
            file,
            resolveLmsInteractionResourceKeyFromTarget(dropZone)
        );
    });
}

function updateLmsInteractionMessagesUi(resourceKey) {
    const contentArea = document.getElementById('lms-content-area');
    const directRegion = contentArea?.querySelector('[data-lms-interaction-region="direct"]');
    if (!directRegion) return false;
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const ui = ensureLmsInteractionUiState();
    const currentUserId = String(getCurrentUserId?.() || getCurrentUser()?.id || '');
    const activeChat = getLmsInteractionActiveChat(canonicalKey);
    if (activeChat?.id) ui.activeChatId = activeChat.id;

    const log = directRegion.querySelector('[data-lms-interaction-region="direct-log"]');
    const atBottom = log ? log.scrollHeight - log.scrollTop - log.clientHeight < 48 : true;
    const mobileView = ui.mobileView === 'thread' && activeChat ? 'thread' : 'rail';

    directRegion.classList.toggle('is-thread-view', mobileView === 'thread');
    directRegion.classList.toggle('is-rail-view', mobileView === 'rail');
    directRegion.classList.toggle('is-compose-open', Boolean(ui.composeOpen));

    const rail = directRegion.querySelector('[data-lms-interaction-region="direct-rail"]');
    const railHead = rail?.querySelector('.lms-interaction-direct__rail-head');
    if (railHead) {
        railHead.outerHTML = renderLmsInteractionRailHead(ui);
    }

    const inbox = directRegion.querySelector('[data-lms-interaction-region="direct-inbox"]');
    if (inbox) {
        inbox.innerHTML = renderLmsInteractionInboxMarkup(canonicalKey, currentUserId, ui.activeChatId, ui.search);
    }

    const composeRail = directRegion.querySelector('[data-lms-interaction-region="compose-rail"]');
    const composeMarkup = renderLmsInteractionComposeRail(canonicalKey, ui.composeSearch || '');
    if (composeRail) {
        composeRail.outerHTML = composeMarkup;
    } else {
        const railBody = rail?.querySelector('.lms-interaction-direct__rail-body');
        if (railBody) {
            railBody.insertAdjacentHTML('beforeend', composeMarkup);
        }
    }

    const thread = directRegion.querySelector('[data-lms-interaction-region="direct-thread"]');
    if (thread) {
        thread.innerHTML = renderLmsInteractionDirectThreadMarkup(canonicalKey, activeChat, currentUserId);
    }

    const nextLog = directRegion.querySelector('[data-lms-interaction-region="direct-log"]');
    if (atBottom) scrollLmsInteractionDirectLogToBottom(nextLog);
    if (typeof syncLmsInteractionTabCacheFromDom === 'function') {
        syncLmsInteractionTabCacheFromDom(canonicalKey);
    }
    return true;
}

function renderLmsInteractionModeSwitch(mode) {
    return `
        <div class="lms-interaction-mode-switch" role="tablist" aria-label="Interaction mode">
            <button type="button" class="lms-interaction-mode-switch__btn ${mode === 'announcements' ? 'is-active' : ''}" data-lms-interaction-mode="announcements" aria-pressed="${mode === 'announcements'}"><i class="fas fa-bullhorn"></i> Announcements</button>
            <button type="button" class="lms-interaction-mode-switch__btn ${mode === 'messages' ? 'is-active' : ''}" data-lms-interaction-mode="messages" aria-pressed="${mode === 'messages'}"><i class="fas fa-message"></i> Messages</button>
        </div>
    `;
}

function renderLmsInteractionBodyMarkup(resourceKey, mode) {
    if (mode === 'messages') {
        return `
            <div class="lms-interaction-messenger__body">
                ${renderLmsInteractionMessagesPane(resourceKey)}
            </div>
        `;
    }
    return `
        <div class="lms-interaction-messenger__body">
            <div id="lms-interaction-stream" class="lms-interaction-messenger__stream" data-lms-interaction-region="stream">
                ${renderLmsInteractionStreamMarkup(resourceKey)}
            </div>
            <div class="lms-interaction-messenger__composer" data-lms-interaction-region="composer">
                ${renderLmsInteractionComposerMarkup(resourceKey)}
            </div>
        </div>
    `;
}

function getLmsInteractionHeaderCopy(mode) {
    if (mode === 'messages') {
        return 'Class chat and private messages';
    }
    return 'Staff announcements and replies';
}

let lmsInteractionRefreshDebounceTimer = 0;

function refreshLmsInteractionMessagesIfActive() {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || contentArea.dataset.activeLmsTab !== 'interaction') return;
    if (typeof getLmsInteractionMode === 'function' && getLmsInteractionMode() !== 'messages') return;
    const ui = ensureLmsInteractionUiState();
    const resourceKey = ui.resourceKey || currentCourseId || '';
    window.clearTimeout(lmsInteractionRefreshDebounceTimer);
    lmsInteractionRefreshDebounceTimer = window.setTimeout(() => {
        lmsInteractionRefreshDebounceTimer = 0;
        if (typeof updateLmsInteractionMessagesUi === 'function') {
            updateLmsInteractionMessagesUi(resourceKey);
        }
    }, 80);
}

async function sendLmsInteractionDirectMessage(resourceKey, chatId, inputId = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const normalizedChatId = String(chatId || '').trim();
    if (!canonicalKey || !normalizedChatId) return;
    const resolvedInputId = inputId || `lms-interaction-direct-input-${toDomToken(normalizedChatId)}`;
    if (typeof sendPortalMessengerMessage === 'function') {
        await sendPortalMessengerMessage(normalizedChatId, resolvedInputId);
    }
    updateLmsInteractionMessagesUi(canonicalKey);
}

// Public cross-tab / tab-chrome contracts only. Directory getters and internal
// renderers stay file-local (classic script declarations remain callable by
// typeof checks via the global environment without explicit window.* exports).
window.ensureLmsInteractionUiState = ensureLmsInteractionUiState;
window.getLmsInteractionMode = getLmsInteractionMode;
window.setLmsInteractionMode = setLmsInteractionMode;
window.getLmsInteractionDirectStats = getLmsInteractionDirectStats;
window.renderLmsInteractionModeSwitch = renderLmsInteractionModeSwitch;
window.renderLmsInteractionBodyMarkup = renderLmsInteractionBodyMarkup;
window.stripLmsInteractionBoundFlags = stripLmsInteractionBoundFlags;
window.bindLmsInteractionDelegatedEvents = bindLmsInteractionDelegatedEvents;
window.getLmsInteractionHeaderCopy = getLmsInteractionHeaderCopy;
window.refreshLmsInteractionMessagesIfActive = refreshLmsInteractionMessagesIfActive;
