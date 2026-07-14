(function initPortalSocialLiteRuntime() {
    if (window.__KIU_SOCIAL_RUNTIME_READY) return;

    const PANEL_KEY = 'KIU_SOCIAL_ACTIVE_PANEL';
    const CHAT_KEY = 'KIU_SOCIAL_ACTIVE_CHAT';
    const EVENT_NAME = 'kiu:social-runtime-update';
    const SOCIAL_MUTATION_TIMEOUT_MS = 12000;
    const runtime = window.__kiuSocialLiteRuntime = window.__kiuSocialLiteRuntime || {
        hydrated: false,
        loading: false,
        error: '',
        flash: null,
        accounts: [],
        accountsById: {},
        directory: [],
        social: {
            profiles: {},
            pages: [],
            groups: [],
            projects: [],
            relationships: [],
            events: [],
            rsvps: [],
            reports: [],
            lostFoundItems: [],
            surveys: [],
            surveyResponses: [],
            savedPosts: []
        },
        feed: [],
        notifications: [],
        toasts: [],
        stories: [],
        chats: [],
        calls: [],
        refreshPromise: null,
        socialPromise: null,
        feedPromise: null,
        directoryPromise: null,
        renderQueued: false,
        pendingRenderReason: '',
        bootstrapTimer: null,
        ui: {
            activePanel: '',
            activeChatId: '',
            activeScopeType: 'profile',
            activeScopeId: '',
            feedScopeType: '',
            feedScopeId: '',
            callOpen: false,
            activeCallChatId: '',
            callMode: '',
            activeCallRemoteUserId: '',
            callStatus: '',
            callMessage: '',
            callMicEnabled: true,
            callCameraEnabled: true,
            groupThreadRailOpen: true,
            groupThreadPanelByChat: {},
            groupThreadSearchByChat: {},
            groupThreadInviteSearchByChat: {},
            groupThreadInviteFacultyByChat: {},
            groupThreadJumpMessageByChat: {},
            groupThreadAvatarUrlByChat: {},
            groupThreadBannerUrlByChat: {},
            groupThreadAvatarFileByChat: {},
            groupThreadBannerFileByChat: {},
            activeProjectId: '',
            projectTab: 'overview',
            projectEditId: '',
            projectComposerOpen: false,
            projectDiscoverSearch: '',
            projectDiscoverFaculty: 'all',
            projectDiscoverRole: 'all',
            projectDiscoverTag: '',
            projectName: '',
            projectSummary: '',
            projectDescription: '',
            projectStatus: 'draft',
            projectVisibility: 'all_logged_in',
            projectCourseTag: '',
            projectFacultyCodes: [],
            projectSkillTags: '',
            projectHashtags: '',
            projectExternalLinks: '',
            projectVisibleRoles: [],
            projectVisibleFacultyCodes: [],
            projectVisibleUserIds: '',
            projectHiddenUserIds: '',
            projectMediaItems: [],
            projectMediaFile: null,
            projectAdvisorUserId: '',
            projectInviteSearch: '',
            projectInviteFaculty: 'all',
            projectInviteSelectedIds: [],
            projectRecommendedTeamSize: 4,
            projectMinTeamSize: 4,
            projectTaskTitle: '',
            projectTaskDescription: '',
            projectTaskAssigneeId: '',
            projectTaskStartAt: '',
            projectTaskDueAt: '',
            projectTaskPriority: 'medium',
            projectTaskPriorityModel: 'manual',
            projectTaskImpactScore: '3',
            projectTaskEffortScore: '3',
            projectTaskBudgetEstimate: '',
            projectShowcaseSummary: '',
            composerText: '',
            composerAudience: 'campus',
            composerFile: null,
            pageWizardOpen: false,
            pageWizardStep: 0,
            activePageProfileId: '',
            pageProfileTab: 'all',
            pageProfileEditMode: false,
            pageName: '',
            pageDescription: '',
            pageVisibility: 'public',
            pageType: 'brand',
            pageCategory: '',
            pageTagline: '',
            pageAbout: '',
            pageMembersSearch: '',
            pageMembersFilter: 'all',
            pageWebsite: '',
            pageContactEmail: '',
            pageLocation: '',
            pageActionLabel: 'Learn more',
            pageActionUrl: '',
            pageAvatarUrl: '',
            pageCoverUrl: '',
            pageAvatarFile: null,
            pageCoverFile: null,
            pageOfficial: false,
            pagePostBody: '',
            pagePostType: 'community',
            pagePostFile: null,
            groupName: '',
            groupDescription: '',
            groupVisibility: 'public',
            eventTitle: '',
            eventDescription: '',
            eventStartsAt: '',
            eventEndsAt: '',
            eventLocation: '',
            eventOnlineLink: '',
            eventIsOnline: false,
            eventJoinMode: 'open',
            directorySearch: '',
            directoryRole: 'all',
            commentDraftByPost: {},
            messageDraftByChat: {},
            messageFileByChat: {},
            activeProfileUserId: '',
            profileTab: 'posts',
            editProfileMode: false,
            profileBio: '',
            profileLocation: '',
            profileWebsite: '',
            profileBirthday: '',
            profileCoverFile: null,
        lostFoundSearch: '',
            lostFoundExpiresAt: '',
            lostFoundTitle: '',
            lostFoundDescription: '',
            lostFoundCategory: '',
            lostFoundLocation: '',
            lostFoundDate: '',
            lostFoundEditId: '',
            lostFoundFile: null,
            surveysTab: 'available',
            surveysSearch: '',
            surveyTakingId: '',
            surveyResultsId: '',
            surveyResultsPayload: null,
            surveyDraftQuestions: [],
            surveyDraftScope: '',
            toasts: [],
            storyViewerOpen: false,
            storyViewerIndex: 0,
            storyComposerOpen: false
        }
    };

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function readStore(key, fallback = '') {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function writeStore(key, value) {
        try {
            if (value === null || value === undefined || value === '') localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch (error) {
            return;
        }
    }

    function unique(values) {
        return [...new Set((Array.isArray(values) ? values : []).map(value => text(value)).filter(Boolean))];
    }

    function savedSocialHubItems() {
        const hub = window.KIU_STATE?.socialHub;
        return Array.isArray(hub?.savedPosts) ? hub.savedPosts : [];
    }

    function currentUserSavedPostIds() {
        return unique(
            savedSocialHubItems()
                .filter((item) => text(item?.userId) === currentUserId())
                .filter((item) => text(item?.itemType) === 'post')
                .map((item) => item?.itemId)
        );
    }

    function nowLabel(value) {
        if (!value) return 'Just now';
        if (typeof formatRelativeTime === 'function') {
            try { return formatRelativeTime(value); } catch (error) {}
        }
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            const diffMs = Date.now() - parsed.getTime();
            const absDiff = Math.abs(diffMs);
            const future = diffMs < 0;
            const minute = 60 * 1000;
            const hour = 60 * minute;
            const day = 24 * hour;
            const week = 7 * day;
            if (absDiff < minute) return 'Just now';
            if (absDiff < hour) {
                const mins = Math.floor(absDiff / minute);
                return future ? `in ${mins}m` : `${mins}m ago`;
            }
            if (absDiff < day) {
                const hrs = Math.floor(absDiff / hour);
                return future ? `in ${hrs}h` : `${hrs}h ago`;
            }
            if (absDiff < week) {
                const days = Math.floor(absDiff / day);
                return future ? `in ${days}d` : `${days}d ago`;
            }
            return parsed.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: parsed.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
        }
        return text(value);
    }

    function escapeHtml(value) {
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function currentUser() {
        try {
            if (typeof getCurrentUser === 'function') return getCurrentUser() || window.currentUser || null;
        } catch (error) {}
        return window.currentUser || null;
    }

    function currentUserId() {
        const directId = text(currentUser()?.id);
        if (directId) return directId;
        try {
            if (typeof getCurrentUserId === 'function') {
                const stateId = text(getCurrentUserId());
                if (stateId) return stateId;
            }
        } catch (error) {}
        try {
            const sessionId = text(sessionStorage.getItem('KIU_ACTIVE_SESSION_USER_ID') || '');
            if (sessionId) return sessionId;
        } catch (error) {}
        return '';
    }

    function currentFacultyCode() {
        const user = currentUser();
        return text(user?.facultyCode || user?.faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '') || readStore('currentFaculty', 'ECON')) || 'ECON';
    }

    function ensureCallRuntime() {
        const existing = window.__kiuSocialCallRuntime || {};
        window.__kiuSocialCallRuntime = {
            stream: existing.stream || null,
            remoteStream: existing.remoteStream || null,
            peerConnection: existing.peerConnection || null,
            peerChatId: existing.peerChatId || '',
            peerRemoteUserId: existing.peerRemoteUserId || '',
            pendingIceCandidates: Array.isArray(existing.pendingIceCandidates) ? existing.pendingIceCandidates : []
        };
        return window.__kiuSocialCallRuntime;
    }

    function resolveRemoteUserIdForChat(chatId) {
        const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
        return unique(chat?.members).find((memberId) => memberId && memberId !== currentUserId()) || text(runtime.ui.activeCallRemoteUserId);
    }

    function attachLocalCallPreview() {
        const video = document.getElementById('portal-call-local-video');
        if (!video) return;
        const callRuntime = ensureCallRuntime();
        video.srcObject = callRuntime.stream || null;
        video.muted = true;
        const playPromise = video.play?.();
        if (playPromise?.catch) playPromise.catch(() => null);
    }

    function attachRemoteCallPreview() {
        const video = document.getElementById('portal-call-remote-video');
        if (!video) return;
        const callRuntime = ensureCallRuntime();
        video.srcObject = callRuntime.remoteStream || null;
        const playPromise = video.play?.();
        if (playPromise?.catch) playPromise.catch(() => null);
    }

    function syncCallTracks() {
        const callRuntime = ensureCallRuntime();
        const stream = callRuntime.stream;
        if (!stream) return;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = Boolean(runtime.ui.callMicEnabled);
        });
        stream.getVideoTracks().forEach((track) => {
            track.enabled = Boolean(runtime.ui.callCameraEnabled);
        });
    }

    async function ensureCallMedia() {
        const callRuntime = ensureCallRuntime();
        if (callRuntime.stream) return callRuntime.stream;
        if (!navigator.mediaDevices?.getUserMedia) return null;
        try {
            callRuntime.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            syncCallTracks();
            attachLocalCallPreview();
            return callRuntime.stream;
        } catch (error) {
            console.warn('Portal call media access failed:', error);
            setFlash('Camera or microphone permission was denied.', 'danger', { skipRender: true });
            return null;
        }
    }

    function stopCallMedia() {
        const callRuntime = ensureCallRuntime();
        if (callRuntime.stream) {
            callRuntime.stream.getTracks().forEach((track) => {
                try { track.stop(); } catch (error) {}
            });
            callRuntime.stream = null;
        }
        attachLocalCallPreview();
    }

    function stopRemoteCallMedia() {
        const callRuntime = ensureCallRuntime();
        if (callRuntime.remoteStream) {
            callRuntime.remoteStream.getTracks().forEach((track) => {
                try { track.stop(); } catch (error) {}
            });
            callRuntime.remoteStream = null;
        }
        attachRemoteCallPreview();
    }

    function buildRtcConfiguration() {
        const configured = typeof getPortalRtcConfiguration === 'function' ? getPortalRtcConfiguration() : null;
        if (configured?.iceServers?.length) {
            return { iceServers: configured.iceServers };
        }
        return {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    async function relayCallSignal(chatId, toUserId, signalType, payload) {
        const fromUserId = currentUserId();
        if (!chatId || !toUserId || !fromUserId || !signalType) return false;
        await portalRequest('/api/calls/signal', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chatId),
                fromUserId,
                toUserId: text(toUserId),
                signalType: text(signalType),
                payload: payload || null
            })
        });
        return true;
    }

    async function flushPendingIceCandidates() {
        const callRuntime = ensureCallRuntime();
        const peerConnection = callRuntime.peerConnection;
        if (!peerConnection || !callRuntime.pendingIceCandidates.length) return;
        const candidates = [...callRuntime.pendingIceCandidates];
        callRuntime.pendingIceCandidates = [];
        for (const candidate of candidates) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.warn('Could not add queued ICE candidate:', error);
            }
        }
    }

    function teardownPeerConnection() {
        const callRuntime = ensureCallRuntime();
        if (callRuntime.peerConnection) {
            try { callRuntime.peerConnection.onicecandidate = null; } catch (error) {}
            try { callRuntime.peerConnection.ontrack = null; } catch (error) {}
            try { callRuntime.peerConnection.onconnectionstatechange = null; } catch (error) {}
            try { callRuntime.peerConnection.close(); } catch (error) {}
        }
        callRuntime.peerConnection = null;
        callRuntime.peerChatId = '';
        callRuntime.peerRemoteUserId = '';
        callRuntime.pendingIceCandidates = [];
        stopRemoteCallMedia();
    }

    async function ensurePeerConnection(chatId, remoteUserId) {
        const callRuntime = ensureCallRuntime();
        const normalizedChatId = text(chatId);
        const normalizedRemoteUserId = text(remoteUserId);
        if (
            callRuntime.peerConnection &&
            callRuntime.peerChatId === normalizedChatId &&
            callRuntime.peerRemoteUserId === normalizedRemoteUserId
        ) {
            return callRuntime.peerConnection;
        }

        teardownPeerConnection();
        const peerConnection = new RTCPeerConnection(buildRtcConfiguration());
        callRuntime.peerConnection = peerConnection;
        callRuntime.peerChatId = normalizedChatId;
        callRuntime.peerRemoteUserId = normalizedRemoteUserId;
        callRuntime.pendingIceCandidates = [];

        const stream = await ensureCallMedia();
        if (stream) {
            stream.getTracks().forEach((track) => {
                if (!peerConnection.getSenders().some((sender) => sender.track === track)) {
                    peerConnection.addTrack(track, stream);
                }
            });
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                relayCallSignal(normalizedChatId, normalizedRemoteUserId, 'ice', event.candidate.toJSON ? event.candidate.toJSON() : event.candidate)
                    .catch((error) => console.warn('Portal call signal relay failed:', error));
            }
        };

        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams || [];
            if (!remoteStream) return;
            callRuntime.remoteStream = remoteStream;
            runtime.ui.callMode = 'active';
            runtime.ui.callStatus = 'active';
            runtime.ui.callMessage = 'Video call connected.';
            queueRender('call-remote-track');
            window.requestAnimationFrame(() => attachRemoteCallPreview());
        };

        peerConnection.onconnectionstatechange = () => {
            const state = text(peerConnection.connectionState).toLowerCase();
            if (state === 'connected') {
                runtime.ui.callMode = 'active';
                runtime.ui.callStatus = 'active';
                runtime.ui.callMessage = 'Video call connected.';
            } else if (state === 'connecting') {
                runtime.ui.callMode = 'connecting';
                runtime.ui.callStatus = 'connecting';
                runtime.ui.callMessage = 'Connecting...';
            } else if (['failed', 'disconnected', 'closed'].includes(state)) {
                runtime.ui.callMode = state === 'failed' ? 'failed' : 'ended';
                runtime.ui.callStatus = state;
                runtime.ui.callMessage = state === 'failed' ? 'Video call failed.' : 'Call ended.';
            }
            queueRender('call-connection');
        };

        window.requestAnimationFrame(() => {
            attachLocalCallPreview();
            attachRemoteCallPreview();
        });
        return peerConnection;
    }

    function isFeedRenderReason(reason = '') {
        const normalized = text(reason || '');
        return normalized === 'feed' || normalized === 'feed-error';
    }

    function invalidateSocialFeedRenderCache() {
        invalidateSocialRenderCache({ center: true });
    }

    function invalidateSocialRenderCache({ center = true } = {}) {
        const host = document.getElementById('public-social-root');
        if (host) host.__kiuLastRenderSignature = '';
        if (center) {
            const centerEl = document.getElementById('social-neo-center-region');
            if (centerEl) delete centerEl.__kiuLastMarkup;
        }
    }

    function mergeFeedPost(post) {
        const postId = text(post?.id);
        if (!postId) return;
        const feed = Array.isArray(runtime.feed) ? runtime.feed : [];
        const index = feed.findIndex((entry) => text(entry?.id) === postId);
        if (index >= 0) feed[index] = post;
        else feed.unshift(post);
        runtime.feed = feed;
        invalidateSocialFeedRenderCache();
    }

    function cloneFeedPost(post) {
        try {
            return JSON.parse(JSON.stringify(post));
        } catch (error) {
            return null;
        }
    }

    function findFeedCommentRecord(comments = [], commentId = '') {
        const normalizedId = text(commentId);
        if (!normalizedId) return null;
        const stack = [...(Array.isArray(comments) ? comments : [])];
        while (stack.length) {
            const comment = stack.shift();
            if (!comment || typeof comment !== 'object') continue;
            if (text(comment.id) === normalizedId) return comment;
            if (Array.isArray(comment.replies) && comment.replies.length) {
                stack.push(...comment.replies);
            }
        }
        return null;
    }

    function applyOptimisticCommentReaction(post, commentId, userId, reactionType = 'like') {
        const optimisticPost = cloneFeedPost(post);
        if (!optimisticPost) return null;
        const comment = findFeedCommentRecord(optimisticPost.comments, commentId);
        const normalizedUserId = text(userId);
        const normalizedReactionType = text(reactionType || 'like') || 'like';
        if (!comment || !normalizedUserId) return null;
        comment.reactions = comment.reactions && typeof comment.reactions === 'object' ? comment.reactions : {};
        const reactionTypes = new Set([...Object.keys(comment.reactions), 'like']);
        let existingReactionType = '';
        reactionTypes.forEach((type) => {
            comment.reactions[type] = Array.isArray(comment.reactions[type]) ? [...comment.reactions[type]] : [];
            if (comment.reactions[type].some((id) => text(id) === normalizedUserId)) existingReactionType = type;
        });
        Object.keys(comment.reactions).forEach((type) => {
            comment.reactions[type] = comment.reactions[type].filter((id) => text(id) !== normalizedUserId);
        });
        if (existingReactionType !== normalizedReactionType) {
            comment.reactions[normalizedReactionType] = Array.isArray(comment.reactions[normalizedReactionType])
                ? [...comment.reactions[normalizedReactionType]]
                : [];
            comment.reactions[normalizedReactionType].push(normalizedUserId);
        }
        comment.likes = Array.isArray(comment.reactions.like) ? [...comment.reactions.like] : [];
        comment.reactionCounts = Object.keys(comment.reactions).reduce((accumulator, key) => {
            accumulator[key] = (comment.reactions[key] || []).length;
            return accumulator;
        }, {});
        return optimisticPost;
    }

    function applyOptimisticPostReaction(post, userId, reactionType = 'like') {
        const optimisticPost = cloneFeedPost(post);
        const normalizedUserId = text(userId);
        const normalizedReactionType = text(reactionType || 'like') || 'like';
        if (!optimisticPost || !normalizedUserId) return null;
        optimisticPost.reactions = optimisticPost.reactions && typeof optimisticPost.reactions === 'object' ? optimisticPost.reactions : {};
        const existingReactionType = Object.keys(optimisticPost.reactions).find((type) =>
            (Array.isArray(optimisticPost.reactions[type]) ? optimisticPost.reactions[type] : [])
                .some((id) => text(id) === normalizedUserId)
        ) || '';
        Object.keys(optimisticPost.reactions).forEach((type) => {
            optimisticPost.reactions[type] = (Array.isArray(optimisticPost.reactions[type]) ? optimisticPost.reactions[type] : [])
                .filter((id) => text(id) !== normalizedUserId);
        });
        if (existingReactionType !== normalizedReactionType) {
            optimisticPost.reactions[normalizedReactionType] = Array.isArray(optimisticPost.reactions[normalizedReactionType])
                ? [...optimisticPost.reactions[normalizedReactionType]]
                : [];
            optimisticPost.reactions[normalizedReactionType].push(normalizedUserId);
        }
        optimisticPost.likes = Array.isArray(optimisticPost.reactions.like) ? [...optimisticPost.reactions.like] : [];
        optimisticPost.reactionCounts = Object.keys(optimisticPost.reactions).reduce((accumulator, key) => {
            accumulator[key] = (optimisticPost.reactions[key] || []).length;
            return accumulator;
        }, {});
        optimisticPost.viewerReaction = existingReactionType === normalizedReactionType ? '' : normalizedReactionType;
        return optimisticPost;
    }

    function mutationRequest(path, options = {}) {
        return portalRequest(path, { ...options, timeoutMs: SOCIAL_MUTATION_TIMEOUT_MS });
    }

    function queueRender(reason = 'refresh') {
        const normalized = text(reason || 'refresh') || 'refresh';
        const pendingReason = text(runtime.pendingRenderReason || '');
        if (isFeedRenderReason(normalized) || !isFeedRenderReason(pendingReason)) {
            runtime.pendingRenderReason = normalized;
        }
        if (runtime.renderQueued) return;
        runtime.renderQueued = true;
        window.requestAnimationFrame(() => {
            runtime.renderQueued = false;
            const queuedReason = text(runtime.pendingRenderReason || 'refresh') || 'refresh';
            runtime.pendingRenderReason = '';
            if (typeof window.__kiuSocialLiteRenderPage === 'function') window.__kiuSocialLiteRenderPage(queuedReason);
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { reason: queuedReason } }));
        });
    }

    function setFlash(message, tone = 'info', options = {}) {
        runtime.flash = message ? { message: text(message), tone: text(tone) || 'info' } : null;
        if (!options.skipRender) queueRender('flash');
        if (!message) return;
        window.setTimeout(() => {
            if (runtime.flash?.message === message) {
                runtime.flash = null;
                if (!options.skipRender) queueRender('flash-clear');
            }
        }, 2600);
    }

    async function portalRequest(path, options = {}) {
        const token = typeof getPortalSessionToken === 'function' ? text(getPortalSessionToken()) : '';
        const headers = { ...(options.headers || {}) };
        if (token) headers['X-Portal-Session'] = token;
        if (typeof kiuPortalFetch === 'function') {
            return kiuPortalFetch(path, { ...options, headers });
        }
        const backendUrl = typeof getKiuPortalBackendUrl === 'function' ? getKiuPortalBackendUrl() : 'http://127.0.0.1:48933';
        const response = await fetch(`${text(backendUrl).replace(/\/$/, '')}${path}`, {
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: options.body,
            cache: 'no-store'
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || payload?.message || `Portal request failed (${response.status}).`);
        return payload;
    }

    function mergeAccounts(accounts) {
        (Array.isArray(accounts) ? accounts : []).forEach((account) => {
            const id = text(account?.id);
            if (!id) return;
            runtime.accountsById[id] = account;
        });
        runtime.accounts = Object.values(runtime.accountsById).sort((left, right) =>
            text(left?.displayName || left?.nameEn || left?.name || left?.email)
                .localeCompare(text(right?.displayName || right?.nameEn || right?.name || right?.email), undefined, { sensitivity: 'base' })
        );
    }

    async function fetchAccountsByIds(ids) {
        const targetIds = unique(ids).filter((id) => !runtime.accountsById[id]);
        if (!targetIds.length) return [];
        const query = new URLSearchParams({ ids: targetIds.join(','), limit: String(Math.max(targetIds.length, 10)) });
        const payload = await portalRequest(`/api/admin/accounts?${query.toString()}`);
        const items = Array.isArray(payload?.items) ? payload.items : [];
        mergeAccounts(items);
        return items;
    }

    function collectSocialAccountIds(social) {
        const source = social && typeof social === 'object' ? social : {};
        const ids = [];
        (Array.isArray(source.pages) ? source.pages : []).forEach((page) => {
            ids.push(page?.ownerUserId, ...(Array.isArray(page?.adminIds) ? page.adminIds : []));
        });
        (Array.isArray(source.groups) ? source.groups : []).forEach((group) => {
            ids.push(group?.ownerUserId, ...(Array.isArray(group?.adminIds) ? group.adminIds : []), ...(Array.isArray(group?.memberIds) ? group.memberIds : []), ...(Array.isArray(group?.pendingMemberIds) ? group.pendingMemberIds : []));
        });
        (Array.isArray(source.projects) ? source.projects : []).forEach((project) => {
            ids.push(
                project?.ownerUserId,
                project?.advisorUserId,
                ...(Array.isArray(project?.instructorViewerIds) ? project.instructorViewerIds : []),
                ...(Array.isArray(project?.memberIds) ? project.memberIds : []),
                ...(Array.isArray(project?.pendingMemberIds) ? project.pendingMemberIds : []),
                ...(project?.memberRolesByUser && typeof project.memberRolesByUser === 'object' ? Object.keys(project.memberRolesByUser) : []),
                ...(Array.isArray(project?.tasks) ? project.tasks.map((task) => task?.assigneeUserId) : [])
            );
        });
        (Array.isArray(source.relationships) ? source.relationships : []).forEach((relationship) => {
            ids.push(relationship?.fromId);
            if (text(relationship?.toType).toLowerCase() === 'profile') ids.push(relationship?.toId);
        });
        (Array.isArray(source.events) ? source.events : []).forEach((event) => {
            ids.push(event?.createdById);
            if (text(event?.scopeType).toLowerCase() === 'profile') ids.push(event?.scopeId);
        });
        (Array.isArray(source.rsvps) ? source.rsvps : []).forEach((rsvp) => ids.push(rsvp?.userId));
        return unique(ids);
    }

    function ensureSocialRelationships() {
        if (!runtime.social || typeof runtime.social !== 'object') runtime.social = {};
        if (!Array.isArray(runtime.social.relationships)) runtime.social.relationships = [];
        return runtime.social.relationships;
    }

    function mergeSocialRelationship(relationship) {
        if (!relationship?.id) return;
        const relationships = ensureSocialRelationships();
        const relationshipId = text(relationship.id);
        const index = relationships.findIndex((item) => text(item?.id) === relationshipId);
        if (index >= 0) relationships[index] = { ...relationships[index], ...relationship };
        else relationships.unshift(relationship);
    }

    function removeSocialRelationshipsBetween(userId, targetUserId) {
        const normalizedUserId = text(userId);
        const normalizedTargetUserId = text(targetUserId);
        if (!normalizedUserId || !normalizedTargetUserId) return;
        const relationships = ensureSocialRelationships();
        runtime.social.relationships = relationships.filter((item) => {
            const type = text(item?.type).toLowerCase();
            const fromId = text(item?.fromId);
            const toId = text(item?.toId);
            if (type === 'connection' || type === 'connection-request') {
                return !(
                    (fromId === normalizedUserId && toId === normalizedTargetUserId)
                    || (fromId === normalizedTargetUserId && toId === normalizedUserId)
                );
            }
            return true;
        });
    }

    async function loadSocialState(force = false, options = {}) {
        const user = currentUser();
        if (!user?.id) {
            runtime.social = { profiles: {}, pages: [], groups: [], projects: [], portfolios: [], relationships: [], events: [], rsvps: [], reports: [], lostFoundItems: [], surveys: [], surveyResponses: [], savedPosts: [] };
            return runtime.social;
        }
        if (runtime.socialPromise && !force) return runtime.socialPromise;
        runtime.socialPromise = portalRequest(`/api/social/bootstrap?userId=${encodeURIComponent(text(user.id))}`)
            .then(async (payload) => {
                const social = payload?.social && typeof payload.social === 'object' ? payload.social : {};
                runtime.social = {
                    profiles: social?.profiles && typeof social.profiles === 'object' ? social.profiles : {},
                    pages: Array.isArray(social?.pages) ? social.pages : [],
                    groups: Array.isArray(social?.groups) ? social.groups : [],
                    projects: Array.isArray(social?.projects) ? social.projects : [],
                    portfolios: Array.isArray(social?.portfolios) ? social.portfolios : [],
                    relationships: Array.isArray(social?.relationships) ? social.relationships : [],
                    events: Array.isArray(social?.events)
                        ? social.events.map((event) => ({
                            ...event,
                            viewerCanEdit: Boolean(event?.viewerCanEdit || event?.viewerCanDelete)
                        }))
                        : [],
                    rsvps: Array.isArray(social?.rsvps) ? social.rsvps : [],
                    reports: Array.isArray(social?.reports) ? social.reports : [],
                    lostFoundItems: Array.isArray(social?.lostFoundItems) ? social.lostFoundItems : [],
                    surveys: Array.isArray(social?.surveys) ? social.surveys : [],
                    surveyResponses: Array.isArray(social?.surveyResponses) ? social.surveyResponses : [],
                    savedPosts: []
                };
                await fetchAccountsByIds(collectSocialAccountIds(runtime.social));
                await loadSavedPosts(force);
                const currentProfile = runtime.social.profiles?.[text(user.id)] || {};
                if (!text(runtime.ui?.composerAudience)) {
                    runtime.ui.composerAudience = text(currentProfile.defaultAudience || 'campus') || 'campus';
                }
                if (!options.skipRender) queueRender('social-bootstrap');
                return runtime.social;
            })
            .catch((error) => {
                runtime.error = text(error?.message || 'Social bootstrap could not be loaded.');
                if (!options.skipRender) queueRender('social-bootstrap-error');
                return runtime.social;
            })
            .finally(() => {
                runtime.socialPromise = null;
            });
        return runtime.socialPromise;
    }

    async function loadSavedPosts(force = false) {
        const userId = currentUserId();
        if (!userId) {
            if (runtime.social && typeof runtime.social === 'object') runtime.social.savedPosts = [];
            return [];
        }
        const postIds = currentUserSavedPostIds();
        if (!postIds.length) {
            if (runtime.social && typeof runtime.social === 'object') runtime.social.savedPosts = [];
            return [];
        }
        const currentIds = Array.isArray(runtime.social?.savedPosts)
            ? unique(runtime.social.savedPosts.map((post) => post?.id))
            : [];
        if (!force && currentIds.length === postIds.length && currentIds.every((id) => postIds.includes(id))) {
            return runtime.social.savedPosts;
        }
        const payload = await portalRequest('/api/social/posts/resolve', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                postIds
            })
        });
        const items = Array.isArray(payload?.items) ? payload.items : [];
        if (runtime.social && typeof runtime.social === 'object') runtime.social.savedPosts = items;
        await fetchAccountsByIds(unique([
            ...items.map((post) => post?.authorUserId),
            ...items.flatMap((post) => (Array.isArray(post?.comments) ? post.comments.map((comment) => comment?.authorUserId) : []))
        ]));
        return items;
    }

    async function refreshFeed(force = false) {
        const user = currentUser();
        if (!user?.id) {
            runtime.feed = [];
            return runtime.feed;
        }
        if (runtime.feedPromise && !force) return runtime.feedPromise;
        const query = new URLSearchParams({
            userId: text(user.id),
            limit: '24'
        });
        if (text(runtime.ui.feedScopeType)) query.set('scopeType', text(runtime.ui.feedScopeType));
        if (text(runtime.ui.feedScopeId)) query.set('scopeId', text(runtime.ui.feedScopeId));
        runtime.feedPromise = portalRequest(`/api/social/feed?${query.toString()}`)
            .then(async (payload) => {
                runtime.feed = Array.isArray(payload?.items) ? payload.items : [];
                const relatedIds = unique([
                    ...runtime.feed.map((post) => post?.authorUserId),
                    ...runtime.feed.flatMap((post) => (Array.isArray(post?.comments) ? post.comments.map((comment) => comment?.authorUserId) : []))
                ]);
                await fetchAccountsByIds(relatedIds);
                invalidateSocialFeedRenderCache();
                queueRender('feed');
                return runtime.feed;
            })
            .catch((error) => {
                runtime.error = text(error?.message || 'Feed could not be loaded.');
                invalidateSocialFeedRenderCache();
                queueRender('feed-error');
                return runtime.feed;
            })
            .finally(() => {
                runtime.feedPromise = null;
            });
        return runtime.feedPromise;
    }

    function chatLastMessage(chat) {
        return Array.isArray(chat?.messages) && chat.messages.length ? chat.messages[chat.messages.length - 1] : null;
    }

    function chatTitle(chat, viewerId = currentUserId()) {
        if (text(chat?.name)) return text(chat.name);
        const otherId = (Array.isArray(chat?.members) ? chat.members : []).map((member) => text(member)).find((memberId) => memberId && memberId !== text(viewerId)) || text(chat?.members?.[0]);
        const account = runtime.accountsById[otherId];
        return text(account?.displayName || account?.nameEn || account?.name || account?.email || otherId || 'Conversation');
    }

    function chatPreview(chat) {
        const last = chatLastMessage(chat);
        if (!last) return 'No messages yet';
        if (text(last.text)) return text(last.text);
        if (last.file) return `Shared ${text(last.file.name || 'attachment')}`;
        return 'New activity';
    }

    function chatUnread(chat, viewerId = currentUserId()) {
        return (Array.isArray(chat?.messages) ? chat.messages : []).reduce((count, message) => {
            if (text(message?.senderId) === text(viewerId)) return count;
            const seenBy = Array.isArray(message?.seenBy) ? message.seenBy.map((item) => text(item)) : [];
            return seenBy.includes(text(viewerId)) ? count : count + 1;
        }, 0);
    }

    function visibleChats(userId = currentUserId()) {
        const normalized = text(userId);
        return runtime.chats.filter((chat) =>
            Array.isArray(chat?.members)
            && chat.members.some((member) => text(member) === normalized)
            && !(chat?.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[normalized])
        );
    }

    function ensureActiveChat() {
        const chats = visibleChats();
        const storedChat = text(readStore(CHAT_KEY, ''));
        if (storedChat && chats.some((chat) => text(chat.id) === storedChat)) runtime.ui.activeChatId = storedChat;
        else if (!runtime.ui.activeChatId || !chats.some((chat) => text(chat.id) === text(runtime.ui.activeChatId))) runtime.ui.activeChatId = text(chats[0]?.id);
        writeStore(CHAT_KEY, runtime.ui.activeChatId);
        return runtime.ui.activeChatId;
    }

    async function loadDirectory(force = false) {
        const user = currentUser();
        if (!user?.id) return [];
        if (runtime.directoryPromise && !force) return runtime.directoryPromise;
        const query = new URLSearchParams({
            limit: runtime.ui.directorySearch ? '36' : '24',
            search: runtime.ui.directorySearch || ''
        });
        if (runtime.ui.directoryRole && runtime.ui.directoryRole !== 'all') query.set('role', runtime.ui.directoryRole);
        if (!runtime.ui.directorySearch && user.role !== 'admin') query.set('facultyCode', currentFacultyCode());
        runtime.directoryPromise = portalRequest(`/api/admin/accounts?${query.toString()}`)
            .then((payload) => {
                const items = Array.isArray(payload?.items) ? payload.items : [];
                mergeAccounts(items);
                runtime.directory = items.filter((account) => text(account.id) !== text(user.id));
                queueRender('directory');
                return runtime.directory;
            })
            .catch((error) => {
                runtime.error = text(error?.message || 'Directory could not be loaded.');
                queueRender('directory-error');
                return [];
            })
            .finally(() => {
                runtime.directoryPromise = null;
            });
        return runtime.directoryPromise;
    }

    async function hydrateRuntime(force = false) {
        const user = currentUser();
        if (!user?.id) {
            runtime.loading = false;
            runtime.hydrated = false;
            runtime.error = 'Sign in to open the social workspace.';
            queueRender('auth-required');
            return runtime;
        }
        if (runtime.refreshPromise && !force) return runtime.refreshPromise;
        runtime.loading = true;
        runtime.error = '';
        runtime.ui.activePanel = text(readStore(PANEL_KEY, runtime.ui.activePanel || 'feed')) || 'feed';
        if (runtime.ui.activePanel === 'lost-found') runtime.ui.activePanel = 'lost-and-found';

        runtime.refreshPromise = Promise.all([
            loadSocialState(force),
            refreshFeed(force),
            portalRequest(`/api/notifications?userId=${encodeURIComponent(text(user.id))}&limit=50`),
            portalRequest(`/api/messenger/snapshot?userId=${encodeURIComponent(text(user.id))}`)
        ])
            .then(([socialPayload, feedPayload, notificationPayload, messengerPayload]) => {
                runtime.social = socialPayload && typeof socialPayload === 'object' ? socialPayload : runtime.social;
                runtime.feed = Array.isArray(feedPayload) ? feedPayload : runtime.feed;
                runtime.notifications = Array.isArray(notificationPayload?.items) ? notificationPayload.items : [];
                runtime.stories = Array.isArray(notificationPayload?.stories) ? notificationPayload.stories : [];
                runtime.chats = Array.isArray(messengerPayload?.chats) ? messengerPayload.chats : [];
                runtime.calls = Array.isArray(messengerPayload?.calls) ? messengerPayload.calls : [];
                mergeAccounts(Array.isArray(messengerPayload?.accounts) ? messengerPayload.accounts : []);
                const deferredAccountIds = unique([
                    ...runtime.feed.map((post) => text(post?.authorUserId)),
                    ...collectSocialAccountIds(runtime.social)
                ]);
                ensureActiveChat();
                runtime.loading = false;
                runtime.hydrated = true;
                queueRender('hydrate');
                fetchAccountsByIds(deferredAccountIds)
                    .then((items) => {
                        if (Array.isArray(items) && items.length) queueRender('hydrate-accounts');
                    })
                    .catch(() => null);
                return runtime;
            })
            .catch((error) => {
                runtime.loading = false;
                runtime.hydrated = false;
                runtime.error = text(error?.message || 'Social workspace could not be loaded.');
                queueRender('hydrate-error');
                return runtime;
            })
            .finally(() => {
                runtime.refreshPromise = null;
            });
        return runtime.refreshPromise;
    }

    function notificationsForUser(userId = currentUserId()) {
        const normalized = text(userId);
        return runtime.notifications
            .filter((item) => !normalized || text(item?.recipientUserId) === normalized)
            .map((item) => ({
                key: text(item.id),
                id: text(item.id),
                source: text(item.sourceDomain || 'portal'),
                type: text(item.type || 'general'),
                title: text(item.title || 'Notification'),
                text: text(item.body),
                read: Boolean(item.isRead),
                createdAt: text(item.createdAt),
                routePage: text(item.routePage || 'social'),
                routeData: item.routeData && typeof item.routeData === 'object' ? item.routeData : {}
            }));
    }

    function notificationUnread(userId = currentUserId()) {
        return notificationsForUser(userId).filter((item) => !item.read).length;
    }

    function toastItems() {
        return runtime.toasts || [];
    }

    function addToast(options = {}) {
        const toast = {
            id: options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: options.type || 'info',
            title: text(options.title || 'Notification'),
            text: text(options.text || ''),
            icon: options.icon || 'fa-bell',
            action: options.action || null,
            actionData: options.actionData || null,
            createdAt: Date.now(),
            dismissing: false,
            timeoutId: 0
        };
        runtime.toasts = runtime.toasts || [];
        runtime.toasts.push(toast);
        if (runtime.toasts.length > 4) {
            const dropped = runtime.toasts.slice(0, -4);
            dropped.forEach((item) => {
                if (item?.timeoutId) window.clearTimeout(item.timeoutId);
            });
            runtime.toasts = runtime.toasts.slice(-4);
        }
        queueRender('toast-added');
        if (options.autoDismiss !== false) {
            const duration = Math.max(1000, Number(options.duration) || 5000);
            toast.timeoutId = window.setTimeout(() => dismissToast(toast.id), duration);
        }
        return toast.id;
    }

    function dismissToast(id) {
        const toastId = text(id);
        if (!toastId) return;
        const toast = runtime.toasts?.find((t) => text(t.id) === toastId);
        if (!toast || toast.dismissing) return;
        if (toast.timeoutId) {
            window.clearTimeout(toast.timeoutId);
            toast.timeoutId = 0;
        }
        toast.dismissing = true;
        queueRender('toast-dismiss');
        window.setTimeout(() => {
            runtime.toasts = (runtime.toasts || []).filter((t) => text(t.id) !== toastId);
            queueRender('toast-removed');
        }, 220);
    }

    function clearAllToasts() {
        (runtime.toasts || []).forEach((toast) => {
            if (toast?.timeoutId) window.clearTimeout(toast.timeoutId);
        });
        runtime.toasts = [];
        queueRender('toasts-cleared');
    }

    function storyItems() {
        return (runtime.stories || []).filter((s) => {
            const expiresAt = text(s.expiresAt);
            return !expiresAt || new Date(expiresAt) > new Date();
        }).map((s) => ({
            id: text(s.id),
            authorId: text(s.authorUserId || s.authorId),
            authorName: text(s.authorName),
            authorAvatar: text(s.authorAvatar),
            mediaUrl: text(s.mediaUrl || s.url),
            caption: text(s.caption || s.text),
            createdAt: text(s.createdAt),
            expiresAt: text(s.expiresAt)
        }));
    }

    function storyViewerOpen() {
        return Boolean(runtime.ui.storyViewerOpen);
    }

    function storyViewerIndex() {
        return runtime.ui.storyViewerIndex || 0;
    }

    function openStoryViewer(index = 0) {
        runtime.ui.storyViewerOpen = true;
        runtime.ui.storyViewerIndex = index;
        queueRender('story-viewer');
    }

    function closeStoryViewer() {
        runtime.ui.storyViewerOpen = false;
        runtime.ui.storyViewerIndex = 0;
        queueRender('story-viewer-close');
    }

    function nextStory() {
        const items = storyItems();
        if (runtime.ui.storyViewerIndex < items.length - 1) {
            runtime.ui.storyViewerIndex += 1;
            queueRender('story-next');
        } else {
            closeStoryViewer();
        }
    }

    function prevStory() {
        if (runtime.ui.storyViewerIndex > 0) {
            runtime.ui.storyViewerIndex -= 1;
            queueRender('story-prev');
        }
    }

    function storyComposerOpen() {
        return Boolean(runtime.ui.storyComposerOpen);
    }

    function openStoryComposer() {
        runtime.ui.storyComposerOpen = true;
        queueRender('story-composer');
    }

    function closeStoryComposer() {
        runtime.ui.storyComposerOpen = false;
        queueRender('story-composer-close');
    }

    async function createStory() {
        throw new Error('Stories are not available.');
    }

    async function markStoryViewed(storyId) {
        const story = runtime.stories?.find((s) => text(s.id) === text(storyId));
        if (story) {
            story.viewedBy = story.viewedBy || [];
            if (!story.viewedBy.includes(currentUserId())) {
                story.viewedBy.push(currentUserId());
            }
        }
    }

    async function markNotificationRead(notificationId) {
        const target = runtime.notifications.find((item) => text(item.id) === text(notificationId));
        if (!target) return false;
        target.isRead = true;
        queueRender('notification-read');
        try {
            await portalRequest('/api/notifications/read', {
                method: 'POST',
                body: JSON.stringify({
                    notificationId: text(notificationId),
                    userId: currentUserId()
                })
            });
        } catch (error) {
            return false;
        }
        return true;
    }

    const legacyRemovePortalNotification = typeof window.removePortalNotification === 'function'
        ? window.removePortalNotification.bind(window)
        : null;

    async function removeNotification(notificationRef) {
        const raw = text(notificationRef);
        const id = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
        if (!id) return false;
        runtime.notifications = (runtime.notifications || []).filter((item) => text(item.id) !== id);
        if (legacyRemovePortalNotification) legacyRemovePortalNotification(raw);
        try {
            await portalRequest('/api/notifications/delete', {
                method: 'POST',
                body: JSON.stringify({
                    notificationId: id,
                    userId: currentUserId()
                })
            });
        } catch (error) {
            return false;
        }
        return true;
    }

    function setPanel(panel) {
        runtime.ui.activePanel = ['feed', 'community', 'projects', 'events', 'photography', 'lost-and-found', 'surveys', 'messages', 'alerts', 'profile'].includes(text(panel)) ? text(panel) : 'feed';
        writeStore(PANEL_KEY, runtime.ui.activePanel);
        queueRender('panel');
    }

    async function markChatMessagesRead(chatId) {
        const actorId = currentUserId();
        const normalizedChatId = text(chatId);
        if (!actorId || !normalizedChatId) return null;
        const chat = runtime.chats.find((entry) => text(entry.id) === normalizedChatId);
        if (chat) {
            let changed = false;
            const now = new Date().toISOString();
            chat.messages = (Array.isArray(chat.messages) ? chat.messages : []).map((message) => {
                if (text(message?.senderId) === actorId) return message;
                const seenBy = Array.isArray(message?.seenBy) ? message.seenBy.map((item) => text(item)) : [];
                if (seenBy.includes(actorId)) return message;
                changed = true;
                return {
                    ...message,
                    seenBy: [...seenBy, actorId],
                    seenAtByUser: { ...(message?.seenAtByUser || {}), [actorId]: now }
                };
            });
            if (chat.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[actorId]) {
                delete chat.hiddenByUser[actorId];
                changed = true;
            }
            if (changed) queueRender('chat-read');
        }
        try {
            const payload = await portalRequest(`/api/messenger/chats/${encodeURIComponent(normalizedChatId)}/read`, {
                method: 'POST',
                body: JSON.stringify({ actorId })
            });
            if (payload?.chat) upsertChat(payload.chat, true);
            return payload?.chat || null;
        } catch (error) {
            return null;
        }
    }

    function setActiveChat(chatId) {
        runtime.ui.activeChatId = text(chatId);
        writeStore(CHAT_KEY, runtime.ui.activeChatId);
        markChatMessagesRead(runtime.ui.activeChatId).catch(() => null);
        queueRender('chat');
    }

    function elementVisible(node) {
        if (!node) return false;
        if (node.hidden) return false;
        const style = window.getComputedStyle ? window.getComputedStyle(node) : null;
        if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return false;
        if (node.closest('[hidden], [aria-hidden="true"]')) return false;
        return node.getClientRects ? node.getClientRects().length > 0 : true;
    }

    function socialPageVisible() {
        if (currentStandalonePageId() === 'social') return true;
        const activePage = text(typeof getActivePageId === 'function' ? getActivePageId() : '').toLowerCase();
        if (activePage === 'social') {
            return elementVisible(document.getElementById('page-social')) || elementVisible(document.getElementById('public-social-root'));
        }
        const page = document.getElementById('page-social');
        const root = document.getElementById('public-social-root');
        return elementVisible(page) || elementVisible(root);
    }

    function currentStandalonePageId() {
        try {
            return new URL(window.location.href).pathname.replace(/\\/g, '/').split('/').pop().replace(/\.html$/i, '').toLowerCase();
        } catch (error) {
            return text(window.location.pathname).replace(/\\/g, '/').split('/').pop().replace(/\.html$/i, '').toLowerCase();
        }
    }

    function routeToSocial(panel = 'feed', chatId = '') {
        setPanel(panel);
        if (chatId) setActiveChat(chatId);
        if (socialPageVisible() || currentStandalonePageId() === 'social') {
            queueRender('route-social');
            return;
        }
        try {
            if (window.self !== window.top) {
                queueRender('route-social-frame');
                return;
            }
        } catch (error) {
            queueRender('route-social-frame');
            return;
        }
        if (typeof rememberSocialPortalContext === 'function') {
            try { rememberSocialPortalContext(); } catch (error) {}
        }
        if (typeof navigate === 'function') {
            navigate('social');
            return;
        }
        window.location.assign('social.html');
    }

    async function ensureDirectChat(userA, userB) {
        const left = text(userA);
        const right = text(userB);
        if (!left || !right) return null;
        const existing = runtime.chats.find((chat) => {
            const members = unique(chat?.members);
            return text(chat?.type || 'direct') === 'direct' && members.includes(left) && members.includes(right) && members.length <= 2;
        });
        if (existing) return existing;
        const payload = await portalRequest('/api/messenger/direct', {
            method: 'POST',
            body: JSON.stringify({ userA: left, userB: right })
        });
        if (payload?.chat) {
            runtime.chats = runtime.chats.filter((chat) => text(chat.id) !== text(payload.chat.id));
            runtime.chats.unshift(payload.chat);
            await fetchAccountsByIds(payload.chat.members || []);
            ensureActiveChat();
            queueRender('direct-chat');
        }
        return payload?.chat || null;
    }

    function avatarSource(account) {
        const candidate = text(account?.photo || account?.avatar);
        if (!candidate) return '';
        if (/^(data:|blob:|https?:\/\/|file:\/\/|\/)/i.test(candidate)) return candidate;
        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(candidate)) return candidate;
        return '';
    }

    function avatarFallback(account) {
        const raw = text(account?.avatar);
        if (raw && !avatarSource(account) && raw.length <= 4) return raw.toUpperCase();
        const displayName = text(account?.displayName || account?.nameEn || account?.name || account?.email || account?.id || 'KI');
        return displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'KI';
    }

    function fileUrl(file) {
        if (!file || typeof file !== 'object') return '';
        const storageKey = text(file.storageKey || file.id || '');
        const backend = text(file.storageBackend).toLowerCase();
        if (storageKey && typeof getPortalStoredFileUrl === 'function' && (backend === 'bridge' || backend === '' || !text(file.dataUrl))) {
            const type = text(file.type).toLowerCase();
            const name = text(file.name).toLowerCase();
            const forDisplay = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
            return getPortalStoredFileUrl(storageKey, { inline: forDisplay, forDisplay });
        }
        return text(file.dataUrl);
    }

    function isImageFile(file) {
        const type = text(file?.type).toLowerCase();
        const name = text(file?.name).toLowerCase();
        return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
    }

    async function readFileAsDataUrl(file) {
        if (!(file instanceof Blob)) return '';
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(text(reader.result));
            reader.onerror = () => reject(new Error('Could not read the selected file.'));
            reader.readAsDataURL(file);
        });
    }

    async function openDirectChat(userId) {
        const user = currentUser();
        if (!user?.id || !text(userId)) return null;
        const chat = await ensureDirectChat(text(user.id), text(userId));
        if (!chat) return null;
        routeToSocial('messages', text(chat.id));
        return chat;
    }

    function photographyPosts(feed = runtime.feed) {
        const items = Array.isArray(feed) ? feed : [];
        return items.filter((post) => text(post?.category) === 'Photography'
            && Array.isArray(post?.media)
            && post.media.some((media) => isImageFile(media)));
    }

    async function createPost(body, options = {}) {
        const userId = currentUserId();
        if (!userId) throw new Error('Session required.');
        const media = [];
        const sourceFile = options.file || null;
        if (sourceFile) {
            const fileScope = text(options.fileScope || options.scope || 'social') || 'social';
            if (typeof uploadPortalStoredFile === 'function') {
                const uploaded = await uploadPortalStoredFile(sourceFile, fileScope);
                if (uploaded?.storageKey) media.push(uploaded);
            }
            if (!media.length) {
                const dataUrl = text(sourceFile.dataUrl) || await readFileAsDataUrl(sourceFile);
                if (dataUrl) {
                    media.push({
                        name: text(sourceFile.name || 'photo.jpg') || 'photo.jpg',
                        type: text(sourceFile.type || 'image/jpeg') || 'image/jpeg',
                        dataUrl
                    });
                }
            }
            if (!media.length) throw new Error('Could not attach image to post.');
        }
        const entityLinks = Array.isArray(options.entityLinks)
            ? options.entityLinks
                .map((item) => ({
                    type: text(item?.type || '').toLowerCase(),
                    id: text(item?.id || '')
                }))
                .filter((item) => item.type && item.id)
                .slice(0, 5)
            : [];
        const payload = await portalRequest('/api/social/posts', {
            method: 'POST',
            body: JSON.stringify({
                authorUserId: userId,
                postedById: userId,
                scopeType: text(options.scopeType || 'profile') || 'profile',
                scopeId: text(options.scopeId || userId) || userId,
                scopeName: text(options.scopeName || ''),
                audience: text(options.audience || 'campus') || 'campus',
                postType: text(options.postType || 'post') || 'post',
                category: text(options.category || ''),
                photoMeta: options.photoMeta && typeof options.photoMeta === 'object' ? options.photoMeta : undefined,
                body: text(body),
                media,
                entityLinks,
                linkedSurveyId: text(options.linkedSurveyId || entityLinks.find((item) => item.type === 'survey')?.id || '')
            })
        });
        const created = payload?.post || null;
        if (created) {
            if (sourceFile) {
                const hasImageMedia = Array.isArray(created.media) && created.media.some((item) => isImageFile(item));
                if (!hasImageMedia) throw new Error('Photo published without an image attachment.');
            }
            const existing = Array.isArray(runtime.feed) ? runtime.feed : [];
            runtime.feed = [created, ...existing.filter((item) => text(item?.id) !== text(created.id))];
            await Promise.all([loadSocialState(true), refreshFeed(true)]);
            await fetchAccountsByIds([created.authorUserId]);
            setFlash('Post published.', 'success', { skipRender: true });
            queueRender('post-created');
        }
        return created;
    }

    async function reportSocialContent(targetEntityType, targetEntityId, reason, targetOwnerId = '') {
        const reporterUserId = currentUserId();
        if (!reporterUserId || !text(targetEntityType) || !text(targetEntityId)) return null;
        const payload = await portalRequest('/api/social/reports', {
            method: 'POST',
            body: JSON.stringify({
                reporterUserId,
                targetEntityType: text(targetEntityType),
                targetEntityId: text(targetEntityId),
                targetOwnerId: text(targetOwnerId || ''),
                reportReason: text(reason || 'Inappropriate content')
            })
        });
        const report = payload?.report || null;
        if (report) {
            runtime.social.reports = [report, ...(Array.isArray(runtime.social.reports) ? runtime.social.reports : [])];
        }
        setFlash('Report submitted.', 'success', { skipRender: true });
        return report;
    }

    async function reportPost(postId, reason) {
        return reportSocialContent('post', text(postId), reason);
    }

    async function createPage(input = {}) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest('/api/social/pages', {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ownerUserId: actorId,
                name: text(input.name),
                description: text(input.description),
                visibility: text(input.visibility || 'public') || 'public',
                pageType: text(input.pageType || 'brand') || 'brand',
                category: text(input.category || ''),
                tagline: text(input.tagline || ''),
                about: text(input.about || ''),
                website: text(input.website || ''),
                contactEmail: text(input.contactEmail || ''),
                location: text(input.location || ''),
                actionLabel: text(input.actionLabel || ''),
                actionUrl: text(input.actionUrl || ''),
                avatarImage: text(input.avatarImage || ''),
                coverImage: text(input.coverImage || ''),
                official: Boolean(input.official),
                verified: Boolean(input.verified)
            })
        });
        await loadSocialState(true);
        setFlash('Page created.', 'success', { skipRender: true });
        return payload?.page || null;
    }

    async function createGroup(input = {}) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest('/api/social/groups', {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ownerUserId: actorId,
                name: text(input.name),
                description: text(input.description),
                visibility: text(input.visibility || 'public') || 'public',
                type: text(input.type || 'standard') || 'standard',
                maxMembers: input.maxMembers ? Number(input.maxMembers) : null,
                tags: Array.isArray(input.tags) ? input.tags.map((tag) => text(tag)).filter(Boolean) : []
            })
        });
        await loadSocialState(true);
        setFlash('Group created.', 'success', { skipRender: true });
        return payload?.group || null;
    }

    async function createProject(input = {}) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const mediaItems = Array.isArray(input.mediaItems) ? [...input.mediaItems] : [];
        if (input.file && typeof uploadPortalStoredFile === 'function') {
            const uploaded = await uploadPortalStoredFile(input.file, 'portfolio');
            if (uploaded?.storageKey) mediaItems.push(uploaded);
        } else if (input.file?.dataUrl) {
            mediaItems.push(input.file);
        }
        const payload = await portalRequest('/api/social/projects', {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ownerUserId: actorId,
                title: text(input.title || input.name),
                name: text(input.name),
                summary: text(input.summary),
                description: text(input.description),
                status: text(input.status || 'draft') || 'draft',
                visibility: text(input.visibility || 'public') || 'public',
                visibilityMode: text(input.visibilityMode || 'all_logged_in') || 'all_logged_in',
                courseTag: text(input.courseTag || ''),
                facultyCodes: Array.isArray(input.facultyCodes) ? input.facultyCodes.map((item) => text(item)).filter(Boolean) : [],
                facultyTags: Array.isArray(input.facultyTags) ? input.facultyTags.map((item) => text(item)).filter(Boolean) : [],
                skillTags: Array.isArray(input.skillTags) ? input.skillTags.map((item) => text(item)).filter(Boolean) : [],
                hashtags: Array.isArray(input.hashtags) ? input.hashtags.map((item) => text(item)).filter(Boolean) : [],
                mediaItems,
                externalLinks: Array.isArray(input.externalLinks) ? input.externalLinks : [],
                visibleRoles: Array.isArray(input.visibleRoles) ? input.visibleRoles.map((item) => text(item)).filter(Boolean) : [],
                visibleFacultyCodes: Array.isArray(input.visibleFacultyCodes) ? input.visibleFacultyCodes.map((item) => text(item)).filter(Boolean) : [],
                visibleUserIds: Array.isArray(input.visibleUserIds) ? input.visibleUserIds.map((item) => text(item)).filter(Boolean) : [],
                hiddenUserIds: Array.isArray(input.hiddenUserIds) ? input.hiddenUserIds.map((item) => text(item)).filter(Boolean) : [],
                advisorUserId: text(input.advisorUserId || ''),
                instructorViewerIds: Array.isArray(input.instructorViewerIds) ? input.instructorViewerIds.map((item) => text(item)).filter(Boolean) : [],
                inviteeIds: Array.isArray(input.inviteeIds) ? input.inviteeIds.map((item) => text(item)).filter(Boolean) : [],
                recommendedTeamSize: Number(input.recommendedTeamSize || 4),
                minTeamSize: Number(input.minTeamSize || 4),
                showcaseSummary: text(input.showcaseSummary || '')
            })
        });
        await hydrateRuntime(true);
        setFlash('Project workspace created.', 'success', { skipRender: true });
        return payload?.project || null;
    }

    async function updateProject(projectId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project workspace could not be updated.');
        const mediaItems = Array.isArray(input.mediaItems) ? [...input.mediaItems] : [];
        if (input.file && typeof uploadPortalStoredFile === 'function') {
            const uploaded = await uploadPortalStoredFile(input.file, 'portfolio');
            if (uploaded?.storageKey) mediaItems.push(uploaded);
        } else if (input.file?.dataUrl) {
            mediaItems.push(input.file);
        }
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ...input,
                title: text(input.title || input.name),
                name: text(input.name || input.title),
                status: text(input.status || 'draft') || 'draft',
                visibility: text(input.visibility || 'public') || 'public',
                visibilityMode: text(input.visibilityMode || 'all_logged_in') || 'all_logged_in',
                mediaItems,
                externalLinks: Array.isArray(input.externalLinks) ? input.externalLinks : [],
                visibleRoles: Array.isArray(input.visibleRoles) ? input.visibleRoles.map((item) => text(item)).filter(Boolean) : [],
                visibleFacultyCodes: Array.isArray(input.visibleFacultyCodes) ? input.visibleFacultyCodes.map((item) => text(item)).filter(Boolean) : [],
                visibleUserIds: Array.isArray(input.visibleUserIds) ? input.visibleUserIds.map((item) => text(item)).filter(Boolean) : [],
                hiddenUserIds: Array.isArray(input.hiddenUserIds) ? input.hiddenUserIds.map((item) => text(item)).filter(Boolean) : []
            })
        });
        await hydrateRuntime(true);
        return payload?.project || null;
    }

    async function setProjectBaseline(projectId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project baseline could not be set.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/baseline`, {
            method: 'POST',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        setFlash('Project baseline saved — plan frozen for comparison.', 'success', { skipRender: true });
        return payload?.project || null;
    }

    function applyProjectGraphLocally(projectId, patch = {}) {
        const normalizedProjectId = text(projectId);
        if (!normalizedProjectId || !runtime.social || !patch || typeof patch !== 'object') return null;
        const projects = Array.isArray(runtime.social.projects) ? runtime.social.projects : [];
        const project = projects.find((entry) => text(entry?.id) === normalizedProjectId);
        if (!project) return null;
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphPositions')) {
            project.taskGraphPositions = patch.taskGraphPositions && typeof patch.taskGraphPositions === 'object' ? { ...patch.taskGraphPositions } : {};
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphView')) {
            project.taskGraphView = patch.taskGraphView && typeof patch.taskGraphView === 'object' ? { ...patch.taskGraphView } : null;
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphGroups')) {
            project.taskGraphGroups = Array.isArray(patch.taskGraphGroups) ? patch.taskGraphGroups.map((entry) => ({ ...entry })) : [];
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphUpdatedAt')) {
            project.taskGraphUpdatedAt = text(patch.taskGraphUpdatedAt || '');
        }
        return project;
    }

    async function updateProjectTaskGraph(projectId, patch = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Task map layout could not be updated.');
        const body = { actorId };
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphPositions')) body.taskGraphPositions = patch.taskGraphPositions;
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphView')) body.taskGraphView = patch.taskGraphView;
        if (Object.prototype.hasOwnProperty.call(patch, 'taskGraphGroups')) body.taskGraphGroups = patch.taskGraphGroups;
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/task-graph`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        const project = payload?.project || null;
        if (project) applyProjectGraphLocally(projectId, project);
        return project;
    }

    async function deleteProject(projectId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project workspace could not be deleted.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE'
        });
        await hydrateRuntime(true);
        setFlash('Portfolio entry removed.', 'success', { skipRender: true });
        return payload?.projectId || text(projectId);
    }

    async function inviteProjectMember(projectId, memberId, role = 'member') {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(memberId)) throw new Error('Project invitation could not be sent.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/invite`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                memberId: text(memberId),
                role: text(role || 'member') || 'member'
            })
        });
        await hydrateRuntime(true);
        setFlash('Project invitation sent.', 'success', { skipRender: true });
        return payload?.project || null;
    }

    async function updateProjectMemberRole(projectId, memberId, role = 'member') {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(memberId)) throw new Error('Project member role could not be updated.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/members/${encodeURIComponent(text(memberId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                role: text(role || 'member') || 'member'
            })
        });
        await hydrateRuntime(true);
        return payload?.project || null;
    }

    async function removeProjectMember(projectId, memberId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(memberId)) throw new Error('Project member could not be removed.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/members/${encodeURIComponent(text(memberId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        return payload?.project || null;
    }

    async function setProjectMembership(projectId, action = 'leave', userId = '') {
        const actorId = currentUserId();
        const targetUserId = text(userId || actorId);
        if (!actorId || !text(projectId) || !targetUserId) throw new Error('Project membership could not be updated.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/membership`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                userId: targetUserId,
                action: text(action || 'leave') || 'leave'
            })
        });
        await hydrateRuntime(true);
        setFlash(text(action || 'leave') === 'leave' ? 'Workspace left.' : 'Project membership updated.', 'success', { skipRender: true });
        return payload?.project || null;
    }

    /**
     * @param {object} [options]
     * @param {boolean} [options.silent] - skip hydrate + full-page queueRender (graph quick-add)
     */
    async function createProjectTask(projectId, input = {}, options = {}) {
        const actorId = currentUserId();
        const resolvedProjectId = text(projectId || input.projectId);
        if (!actorId || !resolvedProjectId) throw new Error('Project task could not be created.');
        const priorityModel = text(input.priorityModel || 'manual') === 'matrix' ? 'matrix' : 'manual';
        const impactScore = Math.max(1, Math.min(5, Math.round(Number(input.impactScore) || 3)));
        const effortScore = Math.max(1, Math.min(5, Math.round(Number(input.effortScore) || 3)));
        let priority = text(input.priority || 'medium') || 'medium';
        if (priorityModel === 'matrix') {
            const score = impactScore * (6 - effortScore);
            priority = score >= 20 ? 'urgent' : score >= 15 ? 'high' : score >= 8 ? 'medium' : 'low';
        }
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(resolvedProjectId)}/tasks`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                title: text(input.title),
                description: text(input.description),
                status: text(input.status || 'todo') || 'todo',
                assigneeUserId: text(input.assigneeUserId || ''),
                startAt: text(input.startAt || ''),
                dueAt: text(input.dueAt || ''),
                priority,
                priorityModel,
                impactScore,
                effortScore,
                budgetEstimate: Number.isFinite(Number(input.budgetEstimate)) ? Math.max(0, Math.round(Number(input.budgetEstimate) * 100) / 100) : 0,
                timeEstimate: Number.isFinite(Number(input.timeEstimate)) && Number(input.timeEstimate) > 0 ? Math.round(Number(input.timeEstimate) * 10) / 10 : 0,
                timeOptimistic: Number.isFinite(Number(input.timeOptimistic)) && Number(input.timeOptimistic) > 0 ? Math.round(Number(input.timeOptimistic) * 10) / 10 : 0,
                timeMostLikely: Number.isFinite(Number(input.timeMostLikely)) && Number(input.timeMostLikely) > 0 ? Math.round(Number(input.timeMostLikely) * 10) / 10 : 0,
                timePessimistic: Number.isFinite(Number(input.timePessimistic)) && Number(input.timePessimistic) > 0 ? Math.round(Number(input.timePessimistic) * 10) / 10 : 0,
                timeUnit: text(input.timeUnit).toLowerCase() === 'd' ? 'd' : 'h',
                isMilestone: Boolean(input.isMilestone),
                actualTime: Number.isFinite(Number(input.actualTime)) && Number(input.actualTime) > 0 ? Math.round(Number(input.actualTime) * 10) / 10 : 0,
                actualCost: Number.isFinite(Number(input.actualCost)) ? Math.max(0, Math.round(Number(input.actualCost) * 100) / 100) : 0,
                checklist: Array.isArray(input.checklist) ? input.checklist : [],
                dependsOnTaskIds: Array.isArray(input.dependsOnTaskIds) ? input.dependsOnTaskIds : []
            })
        });
        const task = payload?.task || null;
        if (task) applyProjectTaskLocally(resolvedProjectId, task);
        // Graph quick-add uses silent:true so hydrate does not remount the task map (flicker).
        if (options && options.silent) return task;
        await hydrateRuntime(true);
        return task;
    }

    function applyProjectTaskLocally(projectId, task) {
        const normalizedProjectId = text(projectId);
        const nextTask = task && typeof task === 'object' ? task : null;
        const taskId = text(nextTask?.id);
        if (!normalizedProjectId || !taskId || !runtime.social) return null;
        const projects = Array.isArray(runtime.social.projects) ? runtime.social.projects : [];
        const project = projects.find((entry) => text(entry?.id) === normalizedProjectId);
        if (!project) return null;
        if (!Array.isArray(project.tasks)) project.tasks = [];
        const index = project.tasks.findIndex((entry) => text(entry?.id) === taskId);
        if (index >= 0) {
            project.tasks[index] = { ...project.tasks[index], ...nextTask };
        } else {
            project.tasks.push(nextTask);
        }
        return project.tasks[index >= 0 ? index : project.tasks.length - 1];
    }

    /**
     * @param {object} [options]
     * @param {boolean} [options.silent] - skip hydrate + full-page queueRender (graph live edits)
     */
    async function updateProjectTask(projectId, taskId, input = {}, options = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(taskId)) throw new Error('Project task could not be updated.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/tasks/${encodeURIComponent(text(taskId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ...input
            })
        });
        const task = payload?.task || null;
        if (task) {
            applyProjectTaskLocally(projectId, task);
        } else if (options && options.silent) {
            // Keep local graph state correct even if API omits the task body.
            applyProjectTaskLocally(projectId, { id: text(taskId), ...input });
        }
        // Graph dependency edits use silent:true so hydrate does not remount the task map (flicker).
        if (options && options.silent) return task || { id: text(taskId), ...input };
        await hydrateRuntime(true);
        return task;
    }

    async function deleteProjectTask(projectId, taskId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(taskId)) throw new Error('Project task could not be deleted.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/tasks/${encodeURIComponent(text(taskId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        return payload || null;
    }

    async function createProjectBudgetCategory(projectId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project budget category could not be created.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-categories`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                title: text(input.title || ''),
                description: text(input.description || ''),
                plannedAmount: Number(input.plannedAmount || 0) || 0,
                color: text(input.color || ''),
                sortOrder: Number(input.sortOrder || 0) || 0
            })
        });
        await hydrateRuntime(true);
        return payload?.category || null;
    }

    async function updateProjectBudgetCategory(projectId, categoryId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(categoryId)) throw new Error('Project budget category could not be updated.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-categories/${encodeURIComponent(text(categoryId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                title: text(input.title || ''),
                description: text(input.description || ''),
                plannedAmount: Number(input.plannedAmount || 0) || 0,
                color: text(input.color || ''),
                sortOrder: Number(input.sortOrder || 0) || 0
            })
        });
        await hydrateRuntime(true);
        return payload?.category || null;
    }

    async function deleteProjectBudgetCategory(projectId, categoryId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(categoryId)) throw new Error('Project budget category could not be deleted.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-categories/${encodeURIComponent(text(categoryId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        return payload || null;
    }

    async function createProjectBudgetExpense(projectId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project budget expense could not be created.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-expenses`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                categoryId: text(input.categoryId || ''),
                title: text(input.title || ''),
                description: text(input.description || ''),
                amount: Number(input.amount || 0) || 0,
                currency: text(input.currency || ''),
                status: text(input.status || 'draft') || 'draft',
                incurredAt: text(input.incurredAt || '')
            })
        });
        await hydrateRuntime(true);
        return payload?.expense || null;
    }

    async function updateProjectBudgetExpense(projectId, expenseId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(expenseId)) throw new Error('Project budget expense could not be updated.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-expenses/${encodeURIComponent(text(expenseId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                categoryId: text(input.categoryId || ''),
                title: text(input.title || ''),
                description: text(input.description || ''),
                amount: Number(input.amount || 0) || 0,
                currency: text(input.currency || ''),
                status: text(input.status || ''),
                incurredAt: text(input.incurredAt || '')
            })
        });
        await hydrateRuntime(true);
        return payload?.expense || null;
    }

    async function deleteProjectBudgetExpense(projectId, expenseId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(expenseId)) throw new Error('Project budget expense could not be deleted.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/budget-expenses/${encodeURIComponent(text(expenseId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        return payload || null;
    }

    async function createProjectRisk(projectId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project risk could not be created.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/risks`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                groupId: text(input.groupId || ''),
                title: text(input.title || ''),
                description: text(input.description || ''),
                likelihood: (() => {
                    const raw = text(input.likelihood ?? '3');
                    if (raw === 'low') return 1;
                    if (raw === 'medium' || raw === 'med') return 3;
                    if (raw === 'high') return 5;
                    const n = Math.round(Number(raw));
                    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 3;
                })(),
                impact: (() => {
                    const raw = text(input.impact ?? '3');
                    if (raw === 'low') return 1;
                    if (raw === 'medium' || raw === 'med') return 3;
                    if (raw === 'high') return 5;
                    const n = Math.round(Number(raw));
                    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 3;
                })(),
                status: text(input.status || 'open') || 'open',
                response: text(input.response || 'mitigate') || 'mitigate',
                ownerUserId: text(input.ownerUserId || ''),
                mitigation: text(input.mitigation || ''),
                linkedTaskIds: Array.isArray(input.linkedTaskIds) ? input.linkedTaskIds.map((id) => text(id)).filter(Boolean) : []
            })
        });
        await hydrateRuntime(true);
        return payload?.risk || null;
    }

    async function updateProjectRisk(projectId, riskId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(riskId)) throw new Error('Project risk could not be updated.');
        const body = {
            actorId,
            groupId: text(input.groupId || ''),
            title: text(input.title || ''),
            description: text(input.description || ''),
            likelihood: text(input.likelihood || '') || undefined,
            impact: text(input.impact || '') || undefined,
            status: text(input.status || '') || undefined,
            response: text(input.response || '') || undefined,
            ownerUserId: text(input.ownerUserId || ''),
            mitigation: text(input.mitigation || '')
        };
        if (Array.isArray(input.linkedTaskIds)) {
            body.linkedTaskIds = input.linkedTaskIds.map((id) => text(id)).filter(Boolean);
        }
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/risks/${encodeURIComponent(text(riskId))}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        await hydrateRuntime(true);
        return payload?.risk || null;
    }

    async function deleteProjectRisk(projectId, riskId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId) || !text(riskId)) throw new Error('Project risk could not be deleted.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/risks/${encodeURIComponent(text(riskId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        return payload || null;
    }

    async function publishProjectShowcase(projectId) {
        const actorId = currentUserId();
        if (!actorId || !text(projectId)) throw new Error('Project showcase could not be published.');
        const payload = await portalRequest(`/api/social/projects/${encodeURIComponent(text(projectId))}/showcase`, {
            method: 'POST',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        setFlash('Project showcase published.', 'success', { skipRender: true });
        return payload?.project || null;
    }

    async function setGroupMembership(groupId, action = 'join') {
        const userId = currentUserId();
        if (!userId || !text(groupId)) throw new Error('Group membership action failed.');
        const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/membership`, {
            method: 'POST',
            body: JSON.stringify({
                actorId: userId,
                userId,
                action: text(action || 'join') || 'join'
            })
        });
        await loadSocialState(true);
        if (payload?.group?.chatId) await hydrateRuntime(true);
        else queueRender('group-membership');
        setFlash(action === 'leave' ? 'Group left.' : 'Group membership updated.', 'success', { skipRender: true });
        return payload?.group || null;
    }

    async function respondGroupMembership(groupId, memberId, accept = true) {
        const actorId = currentUserId();
        if (!actorId || !text(groupId) || !text(memberId)) throw new Error('Membership request could not be resolved.');
        const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/membership/${encodeURIComponent(text(memberId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                accept: accept !== false
            })
        });
        await loadSocialState(true);
        if (payload?.group?.chatId) await hydrateRuntime(true);
        else queueRender('group-request');
        setFlash(accept ? 'Membership approved.' : 'Membership declined.', 'success', { skipRender: true });
        return payload?.group || null;
    }

    async function requestConnection(userId) {
        const actorId = currentUserId();
        if (!actorId || !text(userId)) throw new Error('Connection request failed.');
        const payload = await portalRequest('/api/social/relationships/request', {
            method: 'POST',
            body: JSON.stringify({
                fromUserId: actorId,
                toUserId: text(userId)
            })
        });
        const relationship = payload?.relationship || null;
        if (relationship?.id) mergeSocialRelationship(relationship);
        setFlash('Connection request sent.', 'success', { skipRender: true });
        return relationship;
    }

    async function respondConnection(relationshipId, accept = true) {
        const actorId = currentUserId();
        if (!actorId || !text(relationshipId)) throw new Error('Connection request could not be resolved.');
        const payload = await portalRequest(`/api/social/relationships/${encodeURIComponent(text(relationshipId))}/respond`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                accept: accept !== false
            })
        });
        if (payload?.request?.id) mergeSocialRelationship(payload.request);
        if (payload?.connection?.id) mergeSocialRelationship(payload.connection);
        setFlash(accept ? 'Connection accepted.' : 'Connection declined.', 'success', { skipRender: true });
        return payload;
    }

    async function removeConnection(userId) {
        const actorId = currentUserId();
        if (!actorId || !text(userId)) throw new Error('Connection could not be removed.');
        await portalRequest('/api/social/relationships/remove', {
            method: 'POST',
            body: JSON.stringify({
                userId: actorId,
                targetUserId: text(userId)
            })
        });
        removeSocialRelationshipsBetween(actorId, text(userId));
        setFlash('Connection removed.', 'success', { skipRender: true });
        return true;
    }

    async function hideChat(chatId) {
        const actorId = currentUserId();
        if (!actorId || !text(chatId)) throw new Error('Chat could not be hidden.');
        const payload = await portalRequest(`/api/messenger/chats/${encodeURIComponent(text(chatId))}/hide`, {
            method: 'POST',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        setFlash('Chat hidden from inbox.', 'success', { skipRender: true });
        return payload?.chat || null;
    }

    function unhideChatForUser(chatId, userId = currentUserId()) {
        const normalizedChatId = text(chatId);
        const normalizedUserId = text(userId);
        if (!normalizedChatId || !normalizedUserId) return null;
        const chat = runtime.chats.find((entry) => text(entry.id) === normalizedChatId);
        if (!chat || !Array.isArray(chat.members) || !chat.members.some((memberId) => text(memberId) === normalizedUserId)) {
            return null;
        }
        if (chat.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[normalizedUserId]) {
            delete chat.hiddenByUser[normalizedUserId];
            queueRender('chat-unhide');
        }
        return chat;
    }

    async function persistSocialStatePatch(patch = {}, reason = 'social-save') {
        const userId = currentUserId();
        if (!userId) throw new Error('Session required.');
        const payload = await portalRequest('/api/social/state', {
            method: 'POST',
            body: JSON.stringify({
                reason: text(reason || 'social-save') || 'social-save',
                social: patch && typeof patch === 'object' ? patch : {}
            })
        });
        const social = payload?.social && typeof payload.social === 'object' ? payload.social : null;
        if (social) {
            if (Array.isArray(social.lostFoundItems)) runtime.social.lostFoundItems = social.lostFoundItems;
            if (Array.isArray(social.surveys)) runtime.social.surveys = social.surveys;
            if (Array.isArray(social.surveyResponses)) runtime.social.surveyResponses = social.surveyResponses;
            queueRender('social-state-persist');
        }
        return social;
    }

    async function refreshNotifications(force = false) {
        const user = currentUser();
        if (!user?.id) return [];
        if (runtime.notificationsPromise && !force) return runtime.notificationsPromise;
        runtime.notificationsPromise = portalRequest(`/api/notifications?userId=${encodeURIComponent(text(user.id))}&limit=50`)
            .then((payload) => {
                runtime.notifications = Array.isArray(payload?.items) ? payload.items : [];
                runtime.stories = Array.isArray(payload?.stories) ? payload.stories : runtime.stories || [];
                queueRender('notifications-refresh');
                return runtime.notifications;
            })
            .catch(() => runtime.notifications || [])
            .finally(() => {
                runtime.notificationsPromise = null;
            });
        return runtime.notificationsPromise;
    }

    function applyFollowMutationLocally(targetType, targetId, payload = {}) {
        const userId = currentUserId();
        const normalizedType = text(targetType) === 'profile' ? 'profile' : text(targetType);
        const normalizedTargetId = text(targetId);
        if (!userId || !normalizedType || !normalizedTargetId) return;
        if (!runtime.social || typeof runtime.social !== 'object') runtime.social = {};
        if (!Array.isArray(runtime.social.relationships)) runtime.social.relationships = [];
        const nextFollowing = Boolean(payload?.following);
        runtime.social.relationships = runtime.social.relationships.filter((item) => !(
            text(item?.type).toLowerCase() === 'follow'
            && text(item?.fromId) === userId
            && text(item?.toType).toLowerCase() === normalizedType
            && text(item?.toId) === normalizedTargetId
        ));
        if (nextFollowing) {
            const relationship = payload?.relationship && typeof payload.relationship === 'object'
                ? payload.relationship
                : {
                    id: text(makeId?.('rel') || `rel_${Date.now()}`),
                    type: 'follow',
                    fromId: userId,
                    toType: normalizedType,
                    toId: normalizedTargetId,
                    status: 'accepted'
                };
            runtime.social.relationships.unshift(relationship);
        }
        if (normalizedType === 'page' && Array.isArray(runtime.social.pages)) {
            const page = runtime.social.pages.find((entry) => text(entry?.id) === normalizedTargetId);
            if (page) {
                const wasFollowing = Boolean(page.isFollowing);
                page.isFollowing = nextFollowing;
                if (wasFollowing !== nextFollowing) {
                    page.followerCount = Math.max(0, Number(page.followerCount || 0) + (nextFollowing ? 1 : -1));
                }
            }
        }
    }

    async function toggleFollow(targetType, targetId, options = {}) {
        const userId = currentUserId();
        if (!userId || !text(targetType) || !text(targetId)) throw new Error('Follow state could not be updated.');
        const payload = await portalRequest('/api/social/follows/toggle', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                targetType: text(targetType),
                targetId: text(targetId)
            })
        });
        applyFollowMutationLocally(targetType, targetId, payload);
        if (options.skipBootstrap) {
            loadSocialState(true, { skipRender: true }).catch(() => null);
        } else {
            await loadSocialState(true);
        }
        setFlash(payload?.following ? 'Now following.' : 'Follow removed.', 'success', { skipRender: true });
        return payload;
    }

    async function updatePost(postId, body) {
        const actorId = currentUserId();
        if (!actorId || !text(postId)) throw new Error('Post could not be updated.');
        const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}`, {
            method: 'PATCH',
            body: JSON.stringify({
                actorId,
                body: text(body)
            })
        });
        await Promise.all([loadSocialState(true), refreshFeed(true)]);
        setFlash('Post updated.', 'success', { skipRender: true });
        return payload?.post || null;
    }

    async function deletePost(postId) {
        const actorId = currentUserId();
        if (!actorId || !text(postId)) throw new Error('Post could not be deleted.');
        const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await Promise.all([loadSocialState(true), refreshFeed(true)]);
        setFlash('Post deleted.', 'success', { skipRender: true });
        return payload?.ok !== false;
    }

    async function sharePost(postId, note = '') {
        const actorId = currentUserId();
        if (!actorId || !text(postId)) throw new Error('Post could not be shared.');
        const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}/share`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                authorUserId: actorId,
                note: text(note)
            })
        });
        await Promise.all([loadSocialState(true), refreshFeed(true)]);
        setFlash('Post shared.', 'success', { skipRender: true });
        return payload?.post || null;
    }

    async function reactToPost(postId, reactionType = 'like') {
        const userId = currentUserId();
        if (!userId || !text(postId)) throw new Error('Reaction could not be updated.');
        const normalizedPostId = text(postId);
        const normalizedReactionType = text(reactionType || 'like') || 'like';
        const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((entry) => text(entry?.id) === normalizedPostId);
        const rollbackPost = post ? cloneFeedPost(post) : null;
        const optimisticPost = post ? applyOptimisticPostReaction(post, userId, normalizedReactionType) : null;
        const patchOrQueue = (id) => {
            if (typeof window.__kiuSocialPatchPostReactions === 'function' && window.__kiuSocialPatchPostReactions(id)) return;
            queueRender('post-react');
        };
        if (optimisticPost?.id) {
            mergeFeedPost(optimisticPost);
            patchOrQueue(normalizedPostId);
        }
        try {
            const payload = await mutationRequest(`/api/social/posts/${encodeURIComponent(normalizedPostId)}/reactions`, {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    reactionType: normalizedReactionType
                })
            });
            const updatedPost = payload?.post || null;
            if (updatedPost?.id) {
                mergeFeedPost(updatedPost);
                patchOrQueue(normalizedPostId);
            }
            return updatedPost;
        } catch (error) {
            if (rollbackPost?.id) {
                mergeFeedPost(rollbackPost);
                patchOrQueue(normalizedPostId);
            }
            throw error;
        }
    }

    async function reactToComment(postId, commentId, reactionType = 'like') {
        const userId = currentUserId();
        if (!userId || !text(postId) || !text(commentId)) throw new Error('Comment reaction could not be updated.');
        const normalizedPostId = text(postId);
        const normalizedCommentId = text(commentId);
        const normalizedReactionType = text(reactionType || 'like') || 'like';
        const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((entry) => text(entry?.id) === normalizedPostId);
        const rollbackPost = post ? cloneFeedPost(post) : null;
        const optimisticPost = post ? applyOptimisticCommentReaction(post, normalizedCommentId, userId, normalizedReactionType) : null;
        const patchOrQueue = () => {
            // Surgical chip update in open comments dialog — never rebuild the feed/photo card behind.
            if (typeof window.__kiuSocialPatchCommentReactions === 'function'
                && window.__kiuSocialPatchCommentReactions(normalizedPostId, normalizedCommentId)) {
                return;
            }
            queueRender('comment-react');
        };
        if (optimisticPost?.id) {
            mergeFeedPost(optimisticPost);
            patchOrQueue();
        }
        try {
            const payload = await mutationRequest(`/api/social/posts/${encodeURIComponent(normalizedPostId)}/comments/${encodeURIComponent(normalizedCommentId)}/reactions`, {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    reactionType: normalizedReactionType
                })
            });
            const updatedPost = payload?.post || null;
            if (updatedPost?.id) {
                mergeFeedPost(updatedPost);
                patchOrQueue();
            }
            return updatedPost;
        } catch (error) {
            if (rollbackPost?.id) {
                mergeFeedPost(rollbackPost);
                patchOrQueue();
            }
            throw error;
        }
    }

    async function addComment(postId, body, options = {}) {
        const authorUserId = currentUserId();
        if (!authorUserId || !text(postId) || !text(body)) throw new Error('Comment could not be created.');
        const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((p) => text(p.id) === text(postId));
        const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}/comments`, {
            method: 'POST',
            body: JSON.stringify({
                authorUserId,
                body: text(body),
                parentCommentId: text(options.parentCommentId || options.replyToCommentId || ''),
                replyToCommentId: text(options.replyToCommentId || options.parentCommentId || '')
            })
        });
        // No toast for the actor's own comment/reply actions.
        const updatedPost = payload?.post || null;
        if (updatedPost && text(updatedPost.id)) {
            mergeFeedPost(updatedPost);
            if (!options.skipRender) queueRender('comment-created');
        } else {
            await refreshFeed(true);
        }
        return updatedPost;
    }

    async function removeComment(postId, commentId) {
        const authorUserId = currentUserId();
        if (!authorUserId || !text(postId) || !text(commentId)) throw new Error('Comment could not be removed.');
        const payload = await portalRequest(
            `/api/social/posts/${encodeURIComponent(text(postId))}/comments/${encodeURIComponent(text(commentId))}`,
            { method: 'DELETE' }
        );
        const updatedPost = payload?.post || null;
        if (updatedPost && text(updatedPost.id)) {
            mergeFeedPost(updatedPost);
        } else {
            await refreshFeed(true);
        }
        return updatedPost;
    }

    async function resolveSocialReport(reportId, action = 'dismiss', resolutionNote = '') {
        const actorId = currentUserId();
        if (!actorId || !text(reportId)) throw new Error('Report could not be resolved.');
        const payload = await portalRequest(`/api/social/reports/${encodeURIComponent(text(reportId))}/resolve`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                action: text(action || 'dismiss') || 'dismiss',
                resolutionNote: text(resolutionNote || '')
            })
        });
        await loadSocialState(true);
        setFlash('Report updated.', 'success', { skipRender: true });
        return payload?.report || null;
    }

    async function pinSocialPost(postId) {
        const actorId = currentUserId();
        const post = (Array.isArray(runtime.feed) ? runtime.feed : []).find((entry) => text(entry.id) === text(postId));
        if (!actorId || !post) throw new Error('Post pin state could not be updated.');
        const payload = await portalRequest(`/api/social/posts/${encodeURIComponent(text(postId))}/pin`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                scopeType: text(post.scopeType || ''),
                scopeId: text(post.scopeId || '')
            })
        });
        await refreshFeed(true);
        return payload?.post || null;
    }

    async function createEvent(input = {}) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest('/api/social/events', {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                createdById: actorId,
                title: text(input.title),
                description: text(input.description),
                startsAt: text(input.startsAt),
                endsAt: text(input.endsAt || input.startsAt),
                location: text(input.location),
                isOnline: Boolean(input.isOnline),
                onlineLink: text(input.onlineLink),
                joinMode: text(input.joinMode || 'open') || 'open',
                category: text(input.category || 'social') || 'social',
                maxSeats: input.maxSeats ? Number(input.maxSeats) : null,
                isRecurring: Boolean(input.isRecurring),
                imageUrl: text(input.imageUrl),
                isOfficial: Boolean(input.isOfficial),
                scopeType: text(input.scopeType || 'profile') || 'profile',
                scopeId: text(input.scopeId || actorId) || actorId,
                projectId: text(input.projectId || '')
            })
        });
        await loadSocialState(true);
        setFlash('Event created.', 'success', { skipRender: true });
        queueRender('event-created');
        return payload?.event || null;
    }

    async function updateEvent(eventId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(eventId)) throw new Error('Event could not be updated.');
        const body = {
            title: text(input.title),
            description: text(input.description),
            startsAt: text(input.startsAt),
            endsAt: text(input.endsAt || input.startsAt),
            location: text(input.location),
            isOnline: Boolean(input.isOnline),
            onlineLink: text(input.onlineLink),
            joinMode: text(input.joinMode || 'open') || 'open',
            category: text(input.category || 'social') || 'social',
            maxSeats: input.maxSeats ? Number(input.maxSeats) : null,
            isRecurring: Boolean(input.isRecurring),
            isOfficial: Boolean(input.isOfficial),
            scopeType: text(input.scopeType || 'profile') || 'profile',
            scopeId: text(input.scopeId || actorId) || actorId
        };
        if (text(input.imageUrl)) body.imageUrl = text(input.imageUrl);
        const payload = await portalRequest(`/api/social/events/${encodeURIComponent(text(eventId))}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
        await loadSocialState(true);
        setFlash('Event updated.', 'success', { skipRender: true });
        queueRender('event-updated');
        return payload?.event || null;
    }

    async function createSurvey(input = {}) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest('/api/social/surveys', {
            method: 'POST',
            body: JSON.stringify({
                title: text(input.title),
                description: text(input.description),
                closesAt: text(input.closesAt),
                allowAnonymous: Boolean(input.allowAnonymous),
                audience: text(input.audience || 'campus') || 'campus',
                visibility: text(input.visibility || 'public') || 'public',
                scopeType: text(input.scopeType || 'profile') || 'profile',
                scopeId: text(input.scopeId || actorId) || actorId,
                scopeName: text(input.scopeName || ''),
                promoteToFeed: Boolean(input.promoteToFeed),
                resultsVisibility: text(input.resultsVisibility || 'public_after_close') || 'public_after_close',
                isOfficial: Boolean(input.isOfficial),
                questions: Array.isArray(input.questions) ? input.questions : []
            })
        });
        await loadSocialState(true);
        await refreshFeed(true).catch(() => null);
        setFlash('Survey published.', 'success', { skipRender: true });
        return payload?.survey || null;
    }

    async function closeSurvey(surveyId) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}/close`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        await loadSocialState(true);
        setFlash('Survey closed.', 'success', { skipRender: true });
        return payload?.survey || null;
    }

    async function respondSurvey(surveyId, answers = []) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}/respond`, {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
        await loadSocialState(true);
        setFlash('Survey response submitted.', 'success', { skipRender: true });
        return payload?.survey || null;
    }

    async function loadSurveyResults(surveyId) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        const payload = await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}/results`);
        return payload?.results || null;
    }

    async function deleteSurvey(surveyId) {
        const actorId = currentUserId();
        if (!actorId) throw new Error('Session required.');
        await portalRequest(`/api/social/surveys/${encodeURIComponent(text(surveyId))}`, { method: 'DELETE' });
        await loadSocialState(true);
        setFlash('Survey removed.', 'success', { skipRender: true });
        return true;
    }

    function patchEventRsvp(eventId, status) {
        const normalizedId = text(eventId);
        const normalizedStatus = text(status || 'going') || 'going';
        const events = Array.isArray(runtime.social?.events) ? runtime.social.events : [];
        const eventItem = events.find((entry) => text(entry?.id) === normalizedId);
        if (!eventItem) {
            return { eventId: normalizedId, rollback: () => {} };
        }
        const previousStatus = text(eventItem.viewerRsvpStatus);
        const previousSummary = {
            going: Number(eventItem?.attendeeSummary?.going || 0),
            interested: Number(eventItem?.attendeeSummary?.interested || 0)
        };
        if (!eventItem.attendeeSummary || typeof eventItem.attendeeSummary !== 'object') {
            eventItem.attendeeSummary = { going: 0, interested: 0 };
        }
        if (previousStatus === 'going') eventItem.attendeeSummary.going = Math.max(0, eventItem.attendeeSummary.going - 1);
        if (previousStatus === 'interested') eventItem.attendeeSummary.interested = Math.max(0, eventItem.attendeeSummary.interested - 1);
        if (normalizedStatus === 'going') eventItem.attendeeSummary.going = eventItem.attendeeSummary.going + 1;
        if (normalizedStatus === 'interested') eventItem.attendeeSummary.interested = eventItem.attendeeSummary.interested + 1;
        eventItem.viewerRsvpStatus = normalizedStatus;
        return {
            eventId: normalizedId,
            rollback: () => {
                eventItem.viewerRsvpStatus = previousStatus;
                eventItem.attendeeSummary = { ...previousSummary };
            }
        };
    }

    async function respondEventRsvp(eventId, status = 'going') {
        const userId = currentUserId();
        if (!userId || !text(eventId)) throw new Error('RSVP could not be updated.');
        const patch = patchEventRsvp(eventId, status);
        if (typeof window.__kiuSocialPatchEventRsvp === 'function' && window.__kiuSocialPatchEventRsvp(eventId)) {
            // patched inline
        } else {
            queueRender('event-rsvp-optimistic');
        }
        try {
            const payload = await portalRequest(`/api/social/events/${encodeURIComponent(text(eventId))}/rsvp`, {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    status: text(status || 'going') || 'going'
                })
            });
            await loadSocialState(true);
            setFlash('Event response updated.', 'success', { skipRender: true });
            return payload?.event || null;
        } catch (error) {
            patch.rollback();
            if (typeof window.__kiuSocialPatchEventRsvp === 'function') {
                window.__kiuSocialPatchEventRsvp(eventId);
            } else {
                queueRender('event-rsvp-rollback');
            }
            setFlash('Could not save RSVP. Try again.', 'error', { skipRender: true });
            throw error;
        }
    }

    async function openGroupChat(groupId, options = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(groupId)) throw new Error('Group chat is not available.');
        const payload = await portalRequest('/api/social/group-chat', {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                groupId: text(groupId)
            })
        });
        if (payload?.chat) {
            upsertChat(payload.chat, true);
            await loadSocialState(true);
            if (!options?.skipRoute) routeToSocial('messages', text(payload.chat.id));
        }
        return payload?.chat || null;
    }

    async function sendMessage(chatId, textValue, file) {
        const senderId = currentUserId();
        const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
        if (!senderId || !chat) throw new Error('Chat is not available.');
        let preparedFile = null;
        if (file) {
            if (typeof uploadPortalStoredFile === 'function') {
                const uploaded = await uploadPortalStoredFile(file, 'messenger');
                if (uploaded?.storageKey) preparedFile = uploaded;
            } else if (text(file.dataUrl)) {
                preparedFile = file;
            }
        }
        const payload = await portalRequest('/api/messenger/message', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chat.id),
                senderId,
                type: text(chat.type || 'direct') || 'direct',
                members: Array.isArray(chat.members) ? chat.members : [],
                message: {
                    text: text(textValue),
                    file: preparedFile
                }
            })
        });
        if (payload?.chat) upsertChat(payload.chat, true);
        return payload?.chat || null;
    }

    function upsertChat(chat, shouldRender = false) {
        const chatId = text(chat?.id);
        if (!chatId) return null;
        runtime.chats = runtime.chats.filter((entry) => text(entry.id) !== chatId);
        runtime.chats.unshift(chat);
        fetchAccountsByIds(chat.members || []).catch(() => null);
        ensureActiveChat();
        if (shouldRender) queueRender('chat-upsert');
        return chat;
    }

    function upsertCall(call, shouldRender = false) {
        const chatId = text(call?.chatId);
        if (!chatId) return null;
        runtime.calls = runtime.calls.filter((entry) => text(entry.chatId) !== chatId);
        runtime.calls.unshift(call);
        if (shouldRender) queueRender('call-upsert');
        return call;
    }

    async function startCall(chatId) {
        const user = currentUser();
        const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
        if (typeof RTCPeerConnection !== 'function') throw new Error('This browser does not support in-browser video calls.');
        if (!user?.id || !chat) throw new Error('Conversation is not available.');
        const remoteUserId = resolveRemoteUserIdForChat(chatId);
        if (!remoteUserId) throw new Error('A second participant is required.');
        const payload = await portalRequest('/api/calls/start', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chat.id),
                fromUserId: text(user.id),
                toUserId: remoteUserId
            })
        });
        if (payload?.call) {
            runtime.calls = runtime.calls.filter((call) => text(call.chatId) !== text(payload.call.chatId));
            runtime.calls.unshift(payload.call);
            runtime.ui.callOpen = true;
            runtime.ui.activeCallChatId = text(payload.call.chatId);
            runtime.ui.callMode = 'outgoing';
            runtime.ui.activeCallRemoteUserId = remoteUserId;
            runtime.ui.callStatus = 'ringing';
            runtime.ui.callMessage = 'Calling...';
            await ensureCallMedia();
            window.requestAnimationFrame(() => attachLocalCallPreview());
            queueRender('call-start');
        }
        return payload?.call || null;
    }

    async function acceptCall(chatId) {
        const remoteUserId = resolveRemoteUserIdForChat(chatId) || text(runtime.ui.activeCallRemoteUserId);
        const payload = await portalRequest('/api/calls/accept', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chatId),
                fromUserId: currentUserId(),
                toUserId: remoteUserId
            })
        });
        if (payload?.call) {
            runtime.calls = runtime.calls.filter((call) => text(call.chatId) !== text(payload.call.chatId));
            runtime.calls.unshift(payload.call);
            runtime.ui.callOpen = true;
            runtime.ui.activeCallChatId = text(payload.call.chatId);
            runtime.ui.activeCallRemoteUserId = remoteUserId;
            runtime.ui.callMode = 'connecting';
            runtime.ui.callStatus = 'connecting';
            runtime.ui.callMessage = 'Connecting...';
            await ensureCallMedia();
            window.requestAnimationFrame(() => attachLocalCallPreview());
            queueRender('call-accept');
        }
        return payload?.call || null;
    }

    async function declineCall(chatId) {
        const remoteUserId = resolveRemoteUserIdForChat(chatId) || text(runtime.ui.activeCallRemoteUserId);
        const payload = await portalRequest('/api/calls/decline', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chatId),
                fromUserId: currentUserId(),
                toUserId: remoteUserId
            })
        });
        teardownPeerConnection();
        stopCallMedia();
        runtime.ui.callOpen = false;
        runtime.ui.activeCallChatId = '';
        runtime.ui.activeCallRemoteUserId = '';
        runtime.ui.callMode = '';
        runtime.ui.callStatus = 'declined';
        runtime.ui.callMessage = 'Call declined.';
        queueRender('call-decline');
        return payload?.call || null;
    }

    async function endCall(chatId) {
        const remoteUserId = resolveRemoteUserIdForChat(chatId) || text(runtime.ui.activeCallRemoteUserId);
        const payload = await portalRequest('/api/calls/end', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chatId),
                fromUserId: currentUserId(),
                toUserId: remoteUserId
            })
        });
        finalizeCall(false);
        queueRender('call-end');
        return payload?.call || null;
    }

    async function joinGroupCall(chatId) {
        const user = currentUser();
        const chat = runtime.chats.find((entry) => text(entry.id) === text(chatId));
        if (!user?.id || !chat || text(chat.type || '') !== 'group') throw new Error('Group call is not available.');
        const existing = runtime.calls.find((entry) => text(entry.chatId) === text(chatId) && text(entry.mode || '') === 'group' && entry.active !== false);
        const payload = await portalRequest(existing ? '/api/calls/join' : '/api/calls/start', {
            method: 'POST',
            body: JSON.stringify(existing
                ? { chatId: text(chat.id), userId: text(user.id) }
                : { chatId: text(chat.id), fromUserId: text(user.id), mode: 'group' })
        });
        if (payload?.call) {
            upsertCall(payload.call, true);
            runtime.ui.callOpen = true;
            runtime.ui.activeCallChatId = text(payload.call.chatId);
            runtime.ui.callMode = 'group';
            runtime.ui.activeCallRemoteUserId = '';
            runtime.ui.callStatus = 'active';
            runtime.ui.callMessage = 'Group call live.';
            await ensureCallMedia();
            window.requestAnimationFrame(() => attachLocalCallPreview());
        }
        return payload?.call || null;
    }

    async function leaveGroupCall(chatId) {
        const user = currentUser();
        if (!user?.id || !text(chatId)) throw new Error('Group call is not available.');
        const payload = await portalRequest('/api/calls/leave', {
            method: 'POST',
            body: JSON.stringify({
                chatId: text(chatId),
                userId: text(user.id)
            })
        });
        if (payload?.call) upsertCall(payload.call, true);
        teardownPeerConnection();
        stopCallMedia();
        runtime.ui.callOpen = false;
        runtime.ui.activeCallChatId = '';
        runtime.ui.activeCallRemoteUserId = '';
        runtime.ui.callMode = '';
        runtime.ui.callStatus = payload?.call?.active ? 'active' : 'ended';
        runtime.ui.callMessage = payload?.call?.active ? 'You left the group call.' : 'Group call ended.';
        queueRender('group-call-leave');
        return payload?.call || null;
    }

    function renderPublicSocialPage() { queueRender('social-render'); }
    function renderPublicSocialPageNow() { queueRender('social-render-now'); }
    function scheduleRenderBoost() { if (!runtime.hydrated && !runtime.loading) hydrateRuntime().catch(() => null); else queueRender('render-boost'); }
    function scheduleBootstrap(force = false) {
        if (runtime.bootstrapTimer) window.clearTimeout(runtime.bootstrapTimer);
        runtime.bootstrapTimer = window.setTimeout(() => { hydrateRuntime(Boolean(force)).catch(() => null); }, force ? 0 : 80);
    }
    function ensureMessengerUiState() { return runtime.ui; }
    function renderMessengerWorkspace() { queueRender('messenger-render'); }
    function renderNotificationChrome() { queueRender('notification-render'); }
    function openMessengerWorkspace() { routeToSocial('messages', ensureActiveChat()); }
    function openMessengerChat(chatId) { routeToSocial('messages', text(chatId)); }
    function openNotifications() { routeToSocial('alerts'); }
    async function beginOutgoingCall(chatId, remoteUserId = resolveRemoteUserIdForChat(chatId)) {
        if (!text(chatId) || !text(remoteUserId) || typeof RTCPeerConnection !== 'function') return null;
        const peerConnection = await ensurePeerConnection(chatId, remoteUserId);
        runtime.ui.callOpen = true;
        runtime.ui.activeCallChatId = text(chatId);
        runtime.ui.activeCallRemoteUserId = text(remoteUserId);
        runtime.ui.callMode = 'connecting';
        runtime.ui.callStatus = 'connecting';
        runtime.ui.callMessage = 'Connecting...';
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await relayCallSignal(chatId, remoteUserId, 'offer', {
            type: offer.type,
            sdp: offer.sdp
        });
        queueRender('call-connected');
        return true;
    }
    function markCallUi(status, message) {
        const normalized = text(status).toLowerCase();
        runtime.ui.callOpen = ['ringing', 'accepted', 'active', 'connecting', 'incoming'].includes(normalized);
        runtime.ui.callStatus = normalized;
        runtime.ui.callMessage = text(message);
        if (!runtime.ui.callOpen && ['declined', 'failed', 'ended', 'idle', 'closed'].includes(normalized)) {
            teardownPeerConnection();
            stopCallMedia();
            runtime.ui.activeCallChatId = '';
            runtime.ui.activeCallRemoteUserId = '';
        }
        queueRender('call-ui');
    }
    function finalizeCall() {
        teardownPeerConnection();
        stopCallMedia();
        runtime.ui.callOpen = false;
        runtime.ui.activeCallChatId = '';
        runtime.ui.activeCallRemoteUserId = '';
        runtime.ui.callMode = '';
        runtime.ui.callStatus = 'ended';
        runtime.ui.callMessage = 'Call ended.';
        queueRender('call-finished');
    }

    async function handleCallSignalMessage(signal) {
        if (!signal || typeof signal !== 'object' || typeof RTCPeerConnection !== 'function') return;
        const chatId = text(signal.chatId);
        const fromUserId = text(signal.fromUserId);
        const signalType = text(signal.signalType).toLowerCase();
        if (!chatId || !fromUserId || !signalType) return;

        runtime.ui.callOpen = true;
        runtime.ui.activeCallChatId = chatId;
        runtime.ui.activeCallRemoteUserId = fromUserId;

        if (signalType === 'offer') {
            await ensureCallMedia();
            const peerConnection = await ensurePeerConnection(chatId, fromUserId);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload));
            await flushPendingIceCandidates();
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await relayCallSignal(chatId, fromUserId, 'answer', {
                type: answer.type,
                sdp: answer.sdp
            });
            runtime.ui.callMode = 'connecting';
            runtime.ui.callStatus = 'connecting';
            runtime.ui.callMessage = 'Connecting...';
            queueRender('call-offer');
            return;
        }

        const peerConnection = await ensurePeerConnection(chatId, fromUserId);
        if (signalType === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload));
            await flushPendingIceCandidates();
            runtime.ui.callMode = 'connecting';
            runtime.ui.callStatus = 'connecting';
            runtime.ui.callMessage = 'Connecting...';
        } else if (signalType === 'ice' && signal.payload) {
            if (!peerConnection.remoteDescription) {
                ensureCallRuntime().pendingIceCandidates.push(signal.payload);
            } else {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(signal.payload));
                } catch (error) {
                    console.warn('Could not add ICE candidate:', error);
                }
            }
        }
        queueRender('call-signal');
    }

    function toggleCallMic() {
        runtime.ui.callMicEnabled = !runtime.ui.callMicEnabled;
        syncCallTracks();
        queueRender('call-mic');
    }

    function toggleCallCamera() {
        runtime.ui.callCameraEnabled = !runtime.ui.callCameraEnabled;
        syncCallTracks();
        queueRender('call-camera');
    }

    function getProfileById(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return null;
        return runtime.accountsById[normalizedId] || null;
    }

    function getProfileFriendCount(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return 0;
        return runtime.social.relationships.filter((rel) => {
            const type = text(rel.type).toLowerCase();
            const status = text(rel.status).toLowerCase();
            const isConnection = type === 'connection' && status === 'accepted';
            if (!isConnection) return false;
            return [text(rel.fromId), text(rel.toId)].includes(normalizedId);
        }).length;
    }

    async function loadProfileForUser(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return;
        await fetchAccountsByIds([normalizedId]).catch(() => null);
    }

    async function saveProfileEdits(userId, fields) {
        const normalizedId = text(userId);
        if (!normalizedId) return;
        const account = getProfileById(normalizedId);
        if (!account) return;
        const nextAccount = { ...account };
        if (fields.displayName !== undefined) nextAccount.displayName = text(fields.displayName);
        if (fields.bio !== undefined) nextAccount.bio = text(fields.bio);
        if (fields.location !== undefined) nextAccount.location = text(fields.location);
        if (fields.website !== undefined) nextAccount.website = text(fields.website);
        if (fields.birthday !== undefined) nextAccount.birthday = text(fields.birthday);
        if (fields.availability !== undefined) nextAccount.availability = text(fields.availability);
        if (fields.officeHours !== undefined) nextAccount.officeHours = text(fields.officeHours);
        if (fields.coverImage !== undefined) nextAccount.coverImage = text(fields.coverImage);
        if (fields.interests !== undefined) {
            nextAccount.interests = Array.isArray(fields.interests)
                ? fields.interests.map((entry) => text(entry)).filter(Boolean)
                : text(fields.interests).split(',').map((entry) => text(entry)).filter(Boolean);
        }
        await portalRequest('/api/accounts/upsert', {
            method: 'POST',
            body: JSON.stringify({ account: nextAccount })
        });
        await portalRequest(`/api/social/profiles/${encodeURIComponent(normalizedId)}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId: currentUserId() || normalizedId,
                visibility: text(fields.visibility || runtime.social?.profiles?.[normalizedId]?.visibility || 'public'),
                defaultAudience: text(fields.defaultAudience || runtime.social?.profiles?.[normalizedId]?.defaultAudience || 'campus'),
                digestFrequency: text(fields.digestFrequency || runtime.social?.profiles?.[normalizedId]?.digestFrequency || 'daily'),
                eventReminderLeadHours: Number(fields.eventReminderLeadHours || runtime.social?.profiles?.[normalizedId]?.eventReminderLeadHours || 24)
            })
        });
        runtime.accountsById[normalizedId] = nextAccount;
        await loadSocialState(true);
        runtime.ui.profileDisplayName = text(fields.displayName || nextAccount.displayName || '');
        runtime.ui.profileBio = text(fields.bio || '');
        runtime.ui.profileLocation = text(fields.location || '');
        runtime.ui.profileWebsite = text(fields.website || '');
        runtime.ui.profileBirthday = text(fields.birthday || '');
        runtime.ui.profileInterests = Array.isArray(nextAccount.interests) ? nextAccount.interests.join(', ') : text(fields.interests || '');
        runtime.ui.profileAvailability = text(fields.availability || nextAccount.availability || '');
        runtime.ui.profileOfficeHours = text(fields.officeHours || nextAccount.officeHours || '');
        runtime.ui.profileCoverImage = text(fields.coverImage || nextAccount.coverImage || '');
        runtime.ui.profileVisibility = text(fields.visibility || runtime.social?.profiles?.[normalizedId]?.visibility || 'public');
        runtime.ui.profileDefaultAudience = text(fields.defaultAudience || runtime.social?.profiles?.[normalizedId]?.defaultAudience || 'campus');
        runtime.ui.profileDigestFrequency = text(fields.digestFrequency || runtime.social?.profiles?.[normalizedId]?.digestFrequency || 'daily');
        runtime.ui.profileEventReminderLeadHours = text(fields.eventReminderLeadHours || runtime.social?.profiles?.[normalizedId]?.eventReminderLeadHours || '24');
        runtime.ui.editProfileMode = false;
        queueRender('profile-saved');
    }

    async function updateSocialPage(pageId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(pageId)) throw new Error('Page settings could not be updated.');
        const payload = await portalRequest(`/api/social/pages/${encodeURIComponent(text(pageId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ...input
            })
        });
        await loadSocialState(true);
        queueRender('page-updated');
        return payload?.page || null;
    }

    async function updateSocialGroup(groupId, input = {}) {
        const actorId = currentUserId();
        if (!actorId || !text(groupId)) throw new Error('Group settings could not be updated.');
        const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                ...input
            })
        });
        await loadSocialState(true);
        queueRender('group-updated');
        return payload?.group || null;
    }

    async function removeSocialGroupMember(groupId, memberId) {
        const actorId = currentUserId();
        if (!actorId || !text(groupId) || !text(memberId)) throw new Error('Group member could not be removed.');
        const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/members/${encodeURIComponent(text(memberId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await loadSocialState(true);
        queueRender('group-member-removed');
        return payload?.group || null;
    }

    async function deleteSocialGroup(groupId) {
        const actorId = currentUserId();
        if (!actorId || !text(groupId)) throw new Error('Group could not be deleted.');
        const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await hydrateRuntime(true);
        setFlash('Group deleted.', 'success', { skipRender: true });
        return payload || null;
    }

    async function deleteSocialEvent(eventId) {
        const actorId = currentUserId();
        if (!actorId || !text(eventId)) throw new Error('Event could not be deleted.');
        const payload = await portalRequest(`/api/social/events/${encodeURIComponent(text(eventId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        await loadSocialState(true);
        setFlash('Event deleted.', 'success', { skipRender: true });
        queueRender('event-deleted');
        return payload || null;
    }

    async function deleteChatMessage(chatId, messageId) {
        const actorId = currentUserId();
        if (!actorId || !text(chatId) || !text(messageId)) throw new Error('Message could not be removed.');
        const payload = await portalRequest(`/api/messenger/chats/${encodeURIComponent(text(chatId))}/messages/${encodeURIComponent(text(messageId))}?actorId=${encodeURIComponent(actorId)}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId })
        });
        if (payload?.chat) upsertChat(payload.chat, true);
        setFlash('Message removed.', 'success', { skipRender: true });
        return payload?.chat || null;
    }

    async function inviteSocialGroupMember(groupId, memberId, note = '') {
        const actorId = currentUserId();
        if (!actorId || !text(groupId) || !text(memberId)) throw new Error('Group invitation could not be sent.');
        const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/invite`, {
            method: 'POST',
            body: JSON.stringify({
                actorId,
                memberId: text(memberId),
                note: text(note || '')
            })
        });
        await loadSocialState(true);
        queueRender('group-invite-sent');
        return payload || null;
    }

    Object.assign(window, {
        getPortalSocialRuntimeState: () => runtime,
        escapePortalSocialHtml: escapeHtml,
        formatPortalSocialWhen: nowLabel,
        getPortalMessengerChatsForUser: visibleChats,
        getPortalMessengerUnreadCount: chatUnread,
        getPortalMessengerDisplayNameForChat: chatTitle,
        getPortalMessengerMessagePreview: chatPreview,
        getPortalMessengerChatLastTime: (chat) => nowLabel(chatLastMessage(chat)?.sentAt || chat?.updatedAt || chat?.createdAt),
        getPortalNotificationItemsForUser: notificationsForUser,
        getPortalNotificationUnreadCount: notificationUnread,
        markPortalNotificationRead: markNotificationRead,
        removePortalNotification: removeNotification,
        resolvePortalSocialAvatarSource: avatarSource,
        resolvePortalSocialAvatarFallback: avatarFallback,
        resolvePortalSocialFileUrl: fileUrl,
        isPortalSocialImage: isImageFile,
        readPortalSocialFile: readFileAsDataUrl,
        loadPortalSocialState: loadSocialState,
        refreshPortalSocialFeed: refreshFeed,
        hydratePortalSocialRuntime: hydrateRuntime,
        loadPortalSocialDirectory: loadDirectory,
        openPortalDirectChat: openDirectChat,
        submitSocialPost: createPost,
        getPortalPhotographyPosts: photographyPosts,
        createPortalSocialPage: createPage,
        createPortalSocialGroup: createGroup,
        createPortalSocialProject: createProject,
        updatePortalSocialProject: updateProject,
        setPortalSocialProjectBaseline: setProjectBaseline,
        updatePortalSocialProjectTaskGraph: updateProjectTaskGraph,
        deletePortalSocialProject: deleteProject,
        invitePortalSocialProjectMember: inviteProjectMember,
        updatePortalSocialProjectMemberRole: updateProjectMemberRole,
        removePortalSocialProjectMember: removeProjectMember,
        setPortalSocialProjectMembership: setProjectMembership,
        createPortalSocialProjectTask: createProjectTask,
        updatePortalSocialProjectTask: updateProjectTask,
        deletePortalSocialProjectTask: deleteProjectTask,
        createPortalSocialProjectBudgetCategory: createProjectBudgetCategory,
        updatePortalSocialProjectBudgetCategory: updateProjectBudgetCategory,
        deletePortalSocialProjectBudgetCategory: deleteProjectBudgetCategory,
        createPortalSocialProjectBudgetExpense: createProjectBudgetExpense,
        updatePortalSocialProjectBudgetExpense: updateProjectBudgetExpense,
        deletePortalSocialProjectBudgetExpense: deleteProjectBudgetExpense,
        createPortalSocialProjectRisk: createProjectRisk,
        updatePortalSocialProjectRisk: updateProjectRisk,
        deletePortalSocialProjectRisk: deleteProjectRisk,
        publishPortalSocialProjectShowcase: publishProjectShowcase,
        setPortalSocialGroupMembership: setGroupMembership,
        respondPortalSocialGroupMembership: respondGroupMembership,
        sendPortalSocialConnectionRequest: requestConnection,
        respondPortalSocialConnectionRequest: respondConnection,
        removePortalSocialConnection: removeConnection,
        hidePortalMessengerChat: hideChat,
        markPortalChatMessagesRead: markChatMessagesRead,
        refreshPortalNotifications: refreshNotifications,
        persistPortalSocialStatePatch: persistSocialStatePatch,
        togglePortalSocialFollow: toggleFollow,
        updatePortalSocialPost: updatePost,
        deletePortalSocialPost: deletePost,
        sharePortalSocialPost: sharePost,
        reactToPortalSocialPost: reactToPost,
        reactToPortalSocialComment: reactToComment,
        removePortalSocialComment: removeComment,
        commentOnPortalSocialPost: addComment,
        reportPortalSocialContent: reportSocialContent,
        resolvePortalSocialReport: resolveSocialReport,
        pinPortalSocialPost: pinSocialPost,
        loadPortalSavedSocialPosts: loadSavedPosts,
        createPortalSocialEvent: createEvent,
        updatePortalSocialEvent: updateEvent,
        createPortalSocialSurvey: createSurvey,
        closePortalSocialSurvey: closeSurvey,
        respondPortalSocialSurvey: respondSurvey,
        loadPortalSocialSurveyResults: loadSurveyResults,
        deletePortalSocialSurvey: deleteSurvey,
        respondPortalSocialEventRsvp: respondEventRsvp,
        openPortalSocialGroupChat: openGroupChat,
        updatePortalSocialPage: updateSocialPage,
        updatePortalSocialGroup: updateSocialGroup,
        removePortalSocialGroupMember: removeSocialGroupMember,
        deletePortalSocialGroup: deleteSocialGroup,
        deletePortalSocialEvent: deleteSocialEvent,
        invitePortalSocialGroupMember: inviteSocialGroupMember,
        reportSocialPost: reportPost,
        sendPortalMessage: sendMessage,
        deletePortalChatMessage: deleteChatMessage,
        startPortalCall: startCall,
        joinPortalGroupCall: joinGroupCall,
        leavePortalGroupCall: leaveGroupCall,
        acceptPortalCall: acceptCall,
        declinePortalCall: declineCall,
        endPortalCall: endCall,
        upsertPortalMessengerChatFromRealtime: upsertChat,
        unhidePortalMessengerChatForUser: unhideChatForUser,
        ensurePortalMessengerUiState: ensureMessengerUiState,
        renderPortalMessengerWorkspace: renderMessengerWorkspace,
        renderPortalNotificationChrome: renderNotificationChrome,
        renderPublicSocialPage,
        renderPublicSocialPageNow,
        schedulePublicSocialRenderBoost: scheduleRenderBoost,
        schedulePortalSocialBootstrap: scheduleBootstrap,
        bootstrapPortalSocialState: hydrateRuntime,
        persistPortalSocialState: () => hydrateRuntime(true),
        queuePortalSocialSync: () => scheduleBootstrap(true),
        applyPortalSocialState: () => { scheduleBootstrap(true); return true; },
        bootstrapCanonicalSocialRuntime: hydrateRuntime,
        openSocialMessengerWorkspace: openMessengerWorkspace,
        openPortalMessengerFullModal: openMessengerWorkspace,
        openPortalNotificationFullModal: openNotifications,
        openPortalMessengerChat: openMessengerChat,
        beginPortalOutgoingWebRtcCall: beginOutgoingCall,
        markPortalCallUiState: markCallUi,
        finalizePortalMessengerCall: finalizeCall,
        handlePortalCallSignalMessage: handleCallSignalMessage,
        attachPortalCallLocalPreview: attachLocalCallPreview,
        attachPortalCallRemotePreview: attachRemoteCallPreview,
        togglePortalCallMic: toggleCallMic,
        togglePortalCallCamera: toggleCallCamera,
        setPortalSocialFlash: setFlash,
        invalidatePortalSocialRenderCache: invalidateSocialRenderCache,
        getPortalSocialProfileById: getProfileById,
        loadPortalSocialProfileForUser: loadProfileForUser,
        savePortalSocialProfileEdits: saveProfileEdits,
        updatePortalSocialProfile: (fields = {}) => saveProfileEdits(currentUserId(), fields),
        getPortalSocialToastItems: toastItems,
        addPortalSocialToast: addToast,
        dismissPortalSocialToast: dismissToast,
        clearPortalSocialToasts: clearAllToasts,
        getPortalSocialStoryItems: storyItems,
        openPortalStoryViewer: openStoryViewer,
        closePortalStoryViewer: closeStoryViewer,
        nextPortalStory: nextStory,
        prevPortalStory: prevStory,
        openPortalStoryComposer: openStoryComposer,
        closePortalStoryComposer: closeStoryComposer,
        submitPortalStory: createStory,
        isPortalStoryViewerOpen: storyViewerOpen,
        isPortalStoryComposerOpen: storyComposerOpen,
        getPortalStoryViewerIndex: storyViewerIndex
    });

    runtime.ui.activePanel = text(readStore(PANEL_KEY, 'feed')) || 'feed';
    if (runtime.ui.activePanel === 'lost-found') runtime.ui.activePanel = 'lost-and-found';
    runtime.ui.activeChatId = text(readStore(CHAT_KEY, ''));
    window.__KIU_SOCIAL_RUNTIME_READY = true;
    window.__KIU_SOCIAL_CANONICAL_RUNTIME_READY = true;
    window.__KIU_SOCIAL_RUNTIME_LOADED = true;

    if (currentUser()?.id) {
        window.setTimeout(() => {
            hydrateRuntime().catch(() => null);
            loadDirectory().catch(() => null);
        }, 0);
    }
})();
