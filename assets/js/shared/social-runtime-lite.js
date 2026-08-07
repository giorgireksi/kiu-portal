/* READABILITY: social runtime lite: shared social state and lightweight route helpers. Sections: Purpose | Boundaries | Exports.
--- READABILITY: Purpose ---
Owns the route-facing responsibilities named above.
--- READABILITY: Boundaries ---
Delegates peeled domain behavior through explicit runtime APIs.
--- READABILITY: Exports ---
Publishes only the host/runtime contract consumed by its loader.
*/
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
            researchPublications: [],
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
        lastIdentitySignature: '',
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
            callOverlayMinimized: false,
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
            socialBrowseFaculty: 'all',
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
            pageMembersFacultyFilter: 'all',
            pageMembersRoleFilter: 'all',
            pageAdminPromoteStep: 1,
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
            eventEditorSearch: '',
            eventEditorFaculty: 'all',
            eventEditorSelectedIds: [],
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
            researchTab: 'faculty',
            researchSearch: '',
            researchFormat: 'all',
            researchFaculty: '',
            researchReaderId: '',
            researchPdfViewMode: 'scroll',
            researchPdfZoom: 1,
            researchPdfPage: 1,
            researchDraft: null,
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
        if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
            const shared = window.escapeHtml;
            if (shared !== escapeHtml) return shared(value);
        }
        return String(value == null ? '' : value)
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

    function currentIdentitySignature(user = currentUser()) {
        const userId = text(user?.id || '');
        if (!userId) return '';
        const role = text(user?.role || '').toLowerCase();
        const faculty = text(user?.facultyCode || user?.faculty || '');
        return `${userId}::${role}::${faculty}`;
    }

    function resetWorkspaceDiscoveryUiForIdentityChange() {
        runtime.ui.projectHubScope = 'mine';
        runtime.ui.projectHubStatus = 'all';
        runtime.ui.projectHubViewMode = 'grid';
        runtime.ui.projectDiscoverFaculty = 'all';
        runtime.ui.socialBrowseFaculty = 'all';
        runtime.ui.projectDiscoverSearch = '';
        runtime.ui.projectDiscoverTag = '';
        runtime.ui.activeProjectId = '';
        runtime.ui.projectTab = 'overview';
    }

    function syncRuntimeIdentity(user = currentUser()) {
        const signature = currentIdentitySignature(user);
        const changed = Boolean(signature && runtime.lastIdentitySignature && signature !== runtime.lastIdentitySignature);
        if (changed) {
            resetWorkspaceDiscoveryUiForIdentityChange();
            runtime.feed = [];
            runtime.directory = [];
        }
        if (signature) runtime.lastIdentitySignature = signature;
        return changed;
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
        const resolvedTone = text(tone) || 'info';
        if (message && (resolvedTone === 'success' || resolvedTone === 'info')) return;
        runtime.flash = message ? { message: text(message), tone: resolvedTone } : null;
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
        const payload = await portalRequest(`/api/accounts/directory?${query.toString()}`);
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
            runtime.social = { profiles: {}, pages: [], groups: [], projects: [], portfolios: [], relationships: [], events: [], rsvps: [], reports: [], lostFoundItems: [], surveys: [], surveyResponses: [], researchPublications: [], moduleCuratorPins: {}, userPins: {}, savedPosts: [] };
            return runtime.social;
        }
        const requestUserId = text(user.id);
        if (runtime.socialPromise && !force) return runtime.socialPromise;
        runtime.socialPromise = portalRequest(`/api/social/bootstrap?userId=${encodeURIComponent(text(user.id))}`)
            .then(async (payload) => {
                if (text(currentUserId()) !== requestUserId) return runtime.social;
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
                            viewerCanEdit: Boolean(event?.viewerCanEdit || event?.viewerCanDelete || event?.viewerIsEditor),
                            viewerIsEditor: Boolean(event?.viewerIsEditor)
                        }))
                        : [],
                    rsvps: Array.isArray(social?.rsvps) ? social.rsvps : [],
                    reports: Array.isArray(social?.reports) ? social.reports : [],
                    lostFoundItems: Array.isArray(social?.lostFoundItems) ? social.lostFoundItems : [],
                    surveys: Array.isArray(social?.surveys) ? social.surveys : [],
                    surveyResponses: Array.isArray(social?.surveyResponses) ? social.surveyResponses : [],
                    researchPublications: Array.isArray(social?.researchPublications) ? social.researchPublications : [],
                    moduleCuratorPins: social?.moduleCuratorPins && typeof social.moduleCuratorPins === 'object' ? social.moduleCuratorPins : {},
                    userPins: social?.userPins && typeof social.userPins === 'object' ? social.userPins : {},
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
                if (text(currentUserId()) !== requestUserId) return runtime.social;
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
        const requestUserId = text(user.id);
        if (runtime.feedPromise && !force) return runtime.feedPromise;
        const query = new URLSearchParams({
            userId: text(user.id),
            limit: '24'
        });
        const activePanel = text(runtime.ui?.activePanel || 'feed') || 'feed';
        if (activePanel === 'feed') {
            if (text(runtime.ui.feedScopeType)) query.set('scopeType', text(runtime.ui.feedScopeType));
            if (text(runtime.ui.feedScopeId)) query.set('scopeId', text(runtime.ui.feedScopeId));
        }
        runtime.feedPromise = portalRequest(`/api/social/feed?${query.toString()}`)
            .then(async (payload) => {
                if (text(currentUserId()) !== requestUserId) return runtime.feed;
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
                if (text(currentUserId()) !== requestUserId) return runtime.feed;
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
        const requestUserId = text(user.id);
        if (runtime.directoryPromise && !force) return runtime.directoryPromise;
        const query = new URLSearchParams({
            limit: runtime.ui.directorySearch ? '36' : '24',
            search: runtime.ui.directorySearch || ''
        });
        if (runtime.ui.directoryRole && runtime.ui.directoryRole !== 'all') query.set('role', runtime.ui.directoryRole);
        if (!runtime.ui.directorySearch && user.role !== 'admin') query.set('facultyCode', currentFacultyCode());
        runtime.directoryPromise = portalRequest(`/api/accounts/directory?${query.toString()}`)
            .then((payload) => {
                if (text(currentUserId()) !== requestUserId) return runtime.directory;
                const items = Array.isArray(payload?.items) ? payload.items : [];
                mergeAccounts(items);
                runtime.directory = items.filter((account) => text(account.id) !== text(user.id));
                queueRender('directory');
                return runtime.directory;
            })
            .catch((error) => {
                if (text(currentUserId()) !== requestUserId) return runtime.directory;
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
        const identityChanged = syncRuntimeIdentity(user);
        if (identityChanged) {
            force = true;
            runtime.socialPromise = null;
            runtime.feedPromise = null;
            runtime.directoryPromise = null;
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
                if (typeof window.syncTopbar === 'function') {
                    try { window.syncTopbar(); } catch (error) {}
                }
                const deferredAccountIds = unique([
                    ...runtime.feed.map((post) => text(post?.authorUserId)),
                    ...collectSocialAccountIds(runtime.social),
                    ...runtime.chats.flatMap((chat) => (Array.isArray(chat?.members) ? chat.members : []).map((memberId) => text(memberId)))
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
        if (text(options.type || 'info') === 'success') return '';
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
            const duration = Math.max(1000, Number(options.duration) || 7000);
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
        runtime.ui.activePanel = ['feed', 'community', 'projects', 'research', 'events', 'photography', 'lost-and-found', 'surveys', 'messages', 'alerts', 'profile'].includes(text(panel)) ? text(panel) : 'feed';
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

    function markSocialFileUnavailable(storageKey) {
        const key = text(storageKey);
        if (!key) return;
        const keys = loadUnavailableFileKeys();
        if (keys.has(key)) return;
        keys.add(key);
        persistUnavailableFileKeys();
        invalidateSocialFeedRenderCache();
        queueRender('file-unavailable');
    }

    const UNAVAILABLE_FILES_KEY = 'kiu.social.unavailableFiles';

    function loadUnavailableFileKeys() {
        if (runtime.unavailableFileKeys) return runtime.unavailableFileKeys;
        runtime.unavailableFileKeys = new Set();
        try {
            const raw = sessionStorage.getItem(UNAVAILABLE_FILES_KEY);
            if (!raw) return runtime.unavailableFileKeys;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                parsed.forEach((entry) => {
                    const normalized = text(entry);
                    if (normalized) runtime.unavailableFileKeys.add(normalized);
                });
            }
        } catch (error) {}
        return runtime.unavailableFileKeys;
    }

    function persistUnavailableFileKeys() {
        try {
            const keys = [...loadUnavailableFileKeys()].filter(Boolean);
            if (!keys.length) {
                sessionStorage.removeItem(UNAVAILABLE_FILES_KEY);
                return;
            }
            sessionStorage.setItem(UNAVAILABLE_FILES_KEY, JSON.stringify(keys));
        } catch (error) {}
    }

    function isSocialFileUnavailable(storageKey) {
        const key = text(storageKey);
        return Boolean(key && loadUnavailableFileKeys().has(key));
    }

    function fileUrl(file) {
        if (!file || typeof file !== 'object') return '';
        const preview = text(file.previewDataUrl || file.dataUrl);
        const storageKey = text(file.storageKey || file.id || '');
        const storageMissing = file.storageMissing === true;
        if (storageMissing || isSocialFileUnavailable(storageKey)) return preview;
        const backend = text(file.storageBackend).toLowerCase();
        if (storageKey && typeof getPortalStoredFileUrl === 'function' && (backend === 'bridge' || backend === '' || !preview)) {
            const type = text(file.type).toLowerCase();
            const name = text(file.name).toLowerCase();
            const forDisplay = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
            return getPortalStoredFileUrl(storageKey, { inline: forDisplay, forDisplay });
        }
        return preview;
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

    const EVENT_COVER_TARGET_WIDTH = 1280;
    const EVENT_COVER_TARGET_HEIGHT = 360;
    const EVENT_COVER_SKIP_MAX_BYTES = 1.5 * 1024 * 1024;
    const EVENT_COVER_ASPECT = EVENT_COVER_TARGET_WIDTH / EVENT_COVER_TARGET_HEIGHT;

    function eventCoverCropRect(srcW, srcH) {
        const srcAspect = srcW / srcH;
        if (srcAspect > EVENT_COVER_ASPECT) {
            const cropH = srcH;
            const cropW = Math.round(srcH * EVENT_COVER_ASPECT);
            return {
                cropX: Math.round((srcW - cropW) / 2),
                cropY: 0,
                cropW,
                cropH
            };
        }
        const cropW = srcW;
        const cropH = Math.round(srcW / EVENT_COVER_ASPECT);
        return {
            cropX: 0,
            cropY: Math.round((srcH - cropH) / 2),
            cropW,
            cropH
        };
    }

    function loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('image load failed'));
            };
            img.src = url;
        });
    }

    function eventCoverOutputName(fileName, ext) {
        const base = text(fileName).replace(/\.[^.]+$/, '') || 'event-cover';
        return `${base}.${ext}`;
    }

    async function optimizeEventCoverFile(file) {
        if (!(file instanceof Blob) || !isImageFile(file)) return file;
        try {
            const img = await loadImageFromFile(file);
            const srcW = img.naturalWidth || 0;
            const srcH = img.naturalHeight || 0;
            if (!srcW || !srcH) return file;
            const { cropX, cropY, cropW, cropH } = eventCoverCropRect(srcW, srcH);
            if (cropW <= EVENT_COVER_TARGET_WIDTH
                && cropH <= EVENT_COVER_TARGET_HEIGHT
                && file.size <= EVENT_COVER_SKIP_MAX_BYTES) {
                return file;
            }
            const canvas = document.createElement('canvas');
            canvas.width = EVENT_COVER_TARGET_WIDTH;
            canvas.height = EVENT_COVER_TARGET_HEIGHT;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) return file;
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, EVENT_COVER_TARGET_WIDTH, EVENT_COVER_TARGET_HEIGHT);
            const webpBlob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/webp', 0.85);
            });
            if (webpBlob && webpBlob.type === 'image/webp') {
                return new File([webpBlob], eventCoverOutputName(file.name, 'webp'), { type: 'image/webp' });
            }
            const jpegBlob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.88);
            });
            if (!jpegBlob) return file;
            return new File([jpegBlob], eventCoverOutputName(file.name, 'jpg'), { type: 'image/jpeg' });
        } catch (error) {
            return file;
        }
    }

    async function openDirectChat(userId) {
        const user = currentUser();
        if (!user?.id || !text(userId)) return null;
        const chat = await ensureDirectChat(text(user.id), text(userId));
        if (!chat) return null;
        routeToSocial('messages', text(chat.id));
        return chat;
    }

    /* Feed/page/group/event/survey/post mutations: social-lite-content-runtime.js */
    const __socialLiteContent = typeof window.__kiuCreateSocialLiteContentApi === 'function'
        ? window.__kiuCreateSocialLiteContentApi({
            text, currentUser, currentUserId, portalRequest, hydrateRuntime, setFlash, queueRender,
            loadSocialState, mutationRequest, invalidateSocialRenderCache, invalidateSocialFeedRenderCache,
            mergeFeedPost, cloneFeedPost, findFeedCommentRecord,
            applyOptimisticCommentReaction, applyOptimisticPostReaction,
            ensureDirectChat, ensureCallRuntime, ensureCallMedia, attachLocalCallPreview,
            teardownPeerConnection, stopCallMedia, finalizeCall, resolveRemoteUserIdForChat,
            readFileAsDataUrl, fileUrl, isImageFile, nowLabel,
            makeId: typeof makeId === 'function' ? makeId : (typeof window.makeId === 'function' ? window.makeId : undefined),
            unique, chatTitle, markChatMessagesRead,
            fetchAccountsByIds, refreshFeed, ensureActiveChat, routeToSocial,
            runtime
        })
        : {};
    const {
        photographyPosts,
        createPost,
        reportSocialContent,
        reportPost,
        createPage,
        createGroup,
        createProject,
        updateProject,
        setProjectBaseline,
        applyProjectGraphLocally,
        updateProjectTaskGraph,
        deleteProject,
        setGroupMembership,
        respondGroupMembership,
        requestConnection,
        respondConnection,
        removeConnection,
        hideChat,
        unhideChatForUser,
        persistSocialStatePatch,
        refreshNotifications,
        applyFollowMutationLocally,
        toggleFollow,
        updatePost,
        deletePost,
        sharePost,
        reactToPost,
        reactToComment,
        addComment,
        removeComment,
        resolveSocialReport,
        pinSocialPost,
        createEvent,
        updateEvent,
        createSurvey,
        createResearchPublication,
        toggleResearchSave,
        deleteResearchPublication,
        closeSurvey,
        respondSurvey,
        loadSurveyResults,
        deleteSurvey,
        patchEventRsvp,
        respondEventRsvp,
        openGroupChat,
        sendMessage,
        upsertChat,
        upsertCall,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        joinGroupCall,
        leaveGroupCall,
    } = __socialLiteContent;

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
        runtime.ui.callOverlayMinimized = false;
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

    async function loadProfileForUser(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return;
        await fetchAccountsByIds([normalizedId]).catch(() => null);
    }

    /* Wave 18: social-lite-invite-runtime.js */
    const __w18Deps = {
        text, currentUserId, portalRequest, runtime, getProfileById,
        loadSocialState, hydrateRuntime, queueRender, setFlash, upsertChat
    };
    const __w18PeelApi = typeof window.__kiuCreateSocialLiteInviteApi === 'function'
        ? window.__kiuCreateSocialLiteInviteApi(__w18Deps) : null;
    if (!__w18PeelApi) throw new Error('social-lite-invite-runtime.js missing');
    const { saveProfileEdits, updateSocialPage, updateSocialGroup, removeSocialGroupMember, deleteSocialGroup, deleteSocialEvent, deleteChatMessage, inviteSocialGroupMember } = __w18PeelApi;


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
    optimizePortalSocialEventCoverFile: optimizeEventCoverFile,
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
    togglePortalSocialModulePin: toggleModulePin,
    loadPortalSavedSocialPosts: loadSavedPosts,
    createPortalSocialEvent: createEvent,
    updatePortalSocialEvent: updateEvent,
    createPortalSocialSurvey: createSurvey,
    createPortalSocialResearch: createResearchPublication,
    togglePortalSocialResearchSave: toggleResearchSave,
    deletePortalSocialResearch: deleteResearchPublication,
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
    window.__kiuMarkSocialFileUnavailable = markSocialFileUnavailable;
    window.__kiuIsSocialFileUnavailable = isSocialFileUnavailable;
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
