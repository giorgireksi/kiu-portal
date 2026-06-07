/* Rebuilt social workspace page.
 * Keeps rendering thin and delegates state/network work to social-runtime-lite.js.
 */

(function initRebuiltSocialPage() {
    if (window.__KIU_SOCIAL_PAGE_REBUILT) return;
    window.__KIU_SOCIAL_PAGE_REBUILT = true;

    const ROOT_ID = 'public-social-root';
    const PANEL_KEY = 'KIU_SOCIAL_ACTIVE_PANEL';
    const CHAT_KEY = 'KIU_SOCIAL_ACTIVE_CHAT';
    const SOCIAL_COMMUNITY_MODULE_URL = 'assets/js/pages/social-community.js?v=20260516-socialcommunity-module1';
    const SOCIAL_ALERTS_MODULE_URL = 'assets/js/pages/social-alerts.js?v=20260604-alertcats1';
    const SOCIAL_LOST_FOUND_MODULE_URL = 'assets/js/pages/social-lost-found.js?v=20260604-lfnative1';
    const SOCIAL_MESSAGES_MODULE_URL = 'assets/js/pages/social-messages.js?v=20260516-socialmessages-module1';
    const SOCIAL_PROFILE_MODULE_URL = 'assets/js/pages/social-profile.js?v=20260516-socialprofile-module1';
    const DIRECTORY_REFRESH_MS = 180;
    const MAX_RENDER_ATTEMPTS = 24;
    const USER_ROLES_FALLBACK = {
        STUDENT: 'student',
        PROFESSOR: 'professor',
        TA: 'ta',
        ADMIN: 'admin',
        STUDENT_SERVICE: 'student_service'
    };

    let bound = false;
    let boundHost = null;
    let lastSocialRoot = null;
    let globalKeydownBound = false;
    let renderAttemptCount = 0;
    let directoryRefreshTimer = 0;
    let lastShellSignature = '';
    let renderDebounceTimer = 0;
    let socialCommunityModulePromise = null;
    let socialAlertsModulePromise = null;
    let socialLostFoundModulePromise = null;
    let socialMessagesModulePromise = null;
    let socialProfileModulePromise = null;
    let socialDesktopModulePrefetchScheduled = false;
    let socialDirectoryPrefetchScheduled = false;
    let socialRouteGuardianBound = false;
    let socialRouteGuardianInterval = 0;
    let hostEventAbort = null;
    const pendingCommentReactions = new Set();

    function isStandaloneSocialRoute() {
        const pathname = String(window.location?.pathname || '').toLowerCase();
        return pathname.endsWith('/social.html') || pathname.endsWith('social.html');
    }

    function socialHostMarkup() {
        return `
            <div id="page-social" class="page-section active-page">
                <div id="public-social-root">
                    <div id="social-neo-root" class="social-neo social-neo-facebook" data-panel="feed">
                        <div id="social-neo-flash-region"></div>
                        <div id="social-neo-topbar-region"></div>
                        <div id="social-neo-command-region"></div>
                        <div class="social-neo-shell">
                            <div class="social-neo-center" id="social-neo-center-region"></div>
                            <div id="social-neo-rail-region"></div>
                        </div>
                        <div id="social-neo-drawer-region"></div>
                        <div id="social-neo-mobile-tab-region"></div>
                        <div id="social-neo-toast-region"></div>
                        <div id="social-neo-dialog-region"></div>
                        <div id="social-neo-story-viewer-region"></div>
                        <div id="social-neo-story-composer-region"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function ensureSocialRouteHost() {
        if (!isStandaloneSocialRoute()) return document.getElementById(ROOT_ID);
        let socialRoot = document.getElementById(ROOT_ID);
        if (socialRoot) return socialRoot;
        const appContent = document.getElementById('app-content');
        if (!appContent) return null;
        appContent.innerHTML = socialHostMarkup();
        socialRoot = document.getElementById(ROOT_ID);
        if (socialRoot) {
            document.body.classList.add('lux-route-social', 'lux-entry-social', 'lux-family-social', 'lux-site-modernized');
            document.body.classList.remove('lux-route-home', 'lux-entry-home', 'lux-home-page', 'kiu-shell-loading');
            document.body.classList.add('lux-unified-shell', 'lux-nonhome-page');
            document.body.dataset.luxPage = 'social';
            document.body.dataset.luxEntry = 'social';
            document.body.dataset.luxFamily = 'social';
            bound = false;
            boundHost = null;
            bindEvents();
        }
        return socialRoot;
    }

    function guardStandaloneSocialRoute() {
        if (!isStandaloneSocialRoute() || socialRouteGuardianBound) return;
        const appContent = document.getElementById('app-content');
        if (!appContent) return;
        socialRouteGuardianBound = true;

        const reconcile = () => {
            const socialRoot = document.getElementById(ROOT_ID);
            if (socialRoot && socialRoot === lastSocialRoot) return;
            if (!socialRoot) {
                lastSocialRoot = null;
                if (!ensureSocialRouteHost()) return;
            }
            lastSocialRoot = document.getElementById(ROOT_ID);
            bound = false;
            boundHost = null;
            bindEvents();
            renderSocialPageNow('social-route-guardian');
        };

        const observer = new MutationObserver(() => reconcile());
        observer.observe(appContent, { childList: true, subtree: true });
        window.setTimeout(reconcile, 200);
        window.setTimeout(reconcile, 800);
        window.setTimeout(reconcile, 2000);
        if (socialRouteGuardianInterval) window.clearInterval(socialRouteGuardianInterval);
        socialRouteGuardianInterval = window.setInterval(() => reconcile(), 500);
        window.setTimeout(() => {
            if (socialRouteGuardianInterval) {
                window.clearInterval(socialRouteGuardianInterval);
                socialRouteGuardianInterval = 0;
            }
        }, 12000);
    }

    function root() {
        return document.getElementById(ROOT_ID) || ensureSocialRouteHost();
    }

    function state() {
        return typeof getPortalSocialRuntimeState === 'function'
            ? (getPortalSocialRuntimeState() || {})
            : { ui: {}, social: {} };
    }

    function currentUser() {
        try {
            if (typeof getCurrentUser === 'function') return getCurrentUser() || window.currentUser || null;
        } catch (error) {}
        return window.currentUser || null;
    }

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function postKey(postOrId) {
        if (postOrId && typeof postOrId === 'object') return text(postOrId.id);
        return text(postOrId);
    }

    function syncCommentDraftFromTarget(target) {
        const commentForm = target?.closest?.('form[data-form="comment"]');
        if (!commentForm || text(target?.name) !== 'commentBody') return;
        const runtime = state();
        const postId = postKey(commentForm.getAttribute('data-post-id'));
        if (!postId) return;
        runtime.ui.commentDraftByPost = runtime.ui.commentDraftByPost || {};
        runtime.ui.commentDraftByPost[postId] = target.value;
    }

    function focusCommentComposeInput(host, postId) {
        const normalizedPostId = postKey(postId);
        if (!host || !normalizedPostId) return null;
        const input = host.querySelector(
            `form[data-form="comment"][data-post-id="${CSS.escape(normalizedPostId)}"] [name="commentBody"]`
        ) || host.querySelector(`#${CSS.escape(controlId('commentBody', normalizedPostId))}`);
        if (input && typeof input.focus === 'function') {
            try {
                input.focus({ preventScroll: false });
                input.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
            } catch (error) {}
        }
        return input;
    }

    function escape(value) {
        try {
            if (typeof escapePortalSocialHtml === 'function') return escapePortalSocialHtml(value);
        } catch (error) {}
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getSafeSocialExternalUrl(value) {
        const raw = text(value);
        if (!raw) return '';
        if (/^(mailto:|tel:)/i.test(raw)) return raw;
        try {
            const parsed = new URL(raw, window.location.href);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.toString();
            }
        } catch (error) {}
        return '';
    }

    function domToken(value) {
        try {
            if (typeof window.toDomToken === 'function') return window.toDomToken(value);
        } catch (error) {}
        return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
    }

    function uniqueStrings(values) {
        return [...new Set((Array.isArray(values) ? values : [values]).map((item) => text(item)).filter(Boolean))];
    }

    function controlId(name, scope = '') {
        return `social-${domToken(scope ? `${name}-${scope}` : name)}`;
    }

    function currentFacultyCode() {
        try {
            if (typeof getCurrentFaculty === 'function') {
                return text(getCurrentFaculty())
                    || text(currentUser()?.facultyCode || currentUser()?.faculty)
                    || text(localStorage.getItem('currentFaculty'))
                    || text(document.body?.dataset?.faculty || document.documentElement?.dataset?.faculty)
                    || 'ECON';
            }
        } catch (error) {}
        return text(currentUser()?.facultyCode || currentUser()?.faculty)
            || text(localStorage.getItem('currentFaculty'))
            || text(document.body?.dataset?.faculty || document.documentElement?.dataset?.faculty)
            || 'ECON';
    }

    function shellIdentitySignature() {
        const role = text(currentUser()?.role || localStorage.getItem('currentUserRole') || 'student');
        return `${role}::${currentFacultyCode()}`;
    }

    function when(value) {
        try {
            if (typeof formatPortalSocialWhen === 'function') return formatPortalSocialWhen(value);
        } catch (error) {}
        return text(value);
    }

    function roleValue(key, fallback) {
        try {
            if (typeof USER_ROLES !== 'undefined' && USER_ROLES && USER_ROLES[key]) return USER_ROLES[key];
        } catch (error) {}
        return USER_ROLES_FALLBACK[key] || fallback;
    }

    function roleLabel(role) {
        const labels = {
            [roleValue('STUDENT', 'student')]: 'Student',
            [roleValue('PROFESSOR', 'professor')]: 'Professor',
            [roleValue('TA', 'ta')]: 'Teaching Assistant',
            [roleValue('ADMIN', 'admin')]: 'Admin',
            [roleValue('STUDENT_SERVICE', 'student_service')]: 'Student Service'
        };
        return labels[text(role).toLowerCase()] || 'Portal User';
    }

    function facultyLabel(code) {
        try {
            if (typeof getFacultyLabel === 'function') return getFacultyLabel(code);
        } catch (error) {}
        return text(code || 'Faculty');
    }

    function accountById(userId) {
        const runtime = state();
        return runtime.accountsById?.[text(userId)] || null;
    }

    function displayName(accountOrId) {
        const account = typeof accountOrId === 'string' ? accountById(accountOrId) : accountOrId;
        return text(
            account?.displayName
            || account?.nameEn
            || account?.name
            || account?.email
            || account?.id
            || 'Portal User'
        );
    }

    function accountSubtitle(account) {
        const faculty = text(account?.facultyCode || account?.faculty || '');
        return `${roleLabel(account?.role)}${faculty ? ` / ${facultyLabel(faculty)}` : ''}`;
    }

    function isAccountOnline(account) {
        return Boolean(account?.online);
    }

    function accountPresenceLabel(account) {
        if (!account) return 'Offline';
        if (isAccountOnline(account)) return 'Online';
        return text(account?.lastSeenAt) ? `Last seen ${when(account.lastSeenAt)}` : 'Offline';
    }

    function presencePill(account) {
        return `<span class="social-neo-pill social-neo-presence-pill ${isAccountOnline(account) ? 'is-online' : 'is-offline'}">${escape(accountPresenceLabel(account))}</span>`;
    }

    function groupMemberPreviewNames(memberIds, limit = 4) {
        return (Array.isArray(memberIds) ? memberIds : [])
            .slice(0, limit)
            .map((memberId) => displayName(accountById(memberId) || { id: memberId }))
            .filter(Boolean);
    }

    function avatarSource(account) {
        try {
            if (typeof resolvePortalSocialAvatarSource === 'function') return resolvePortalSocialAvatarSource(account);
        } catch (error) {}
        return '';
    }

    function avatarFallback(account) {
        try {
            if (typeof resolvePortalSocialAvatarFallback === 'function') return resolvePortalSocialAvatarFallback(account);
        } catch (error) {}
        const base = displayName(account);
        return base.split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('') || 'KI';
    }

    function avatar(account, modifier = '') {
        const src = avatarSource(account);
        const classes = ['social-neo-avatar'];
        if (modifier) classes.push(modifier);
        if (src) {
            return `<span class="${classes.join(' ')}"><img src="${escape(src)}" alt="${escape(displayName(account))}"></span>`;
        }
        return `<span class="${classes.join(' ')} is-fallback">${escape(avatarFallback(account))}</span>`;
    }

    function fileUrl(file) {
        try {
            if (typeof resolvePortalSocialFileUrl === 'function') return resolvePortalSocialFileUrl(file);
        } catch (error) {}
        return text(file?.dataUrl);
    }

    function isImage(file) {
        try {
            if (typeof isPortalSocialImage === 'function') return Boolean(isPortalSocialImage(file));
        } catch (error) {}
        const name = text(file?.name).toLowerCase();
        const type = text(file?.type).toLowerCase();
        return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
    }

    function currentUserId() {
        return text(currentUser()?.id);
    }

    function activeChats() {
        const runtime = state();
        const userId = currentUserId();
        return (Array.isArray(runtime.chats) ? runtime.chats : [])
            .filter((chat) => Array.isArray(chat?.members) && chat.members.some((memberId) => text(memberId) === userId))
            .filter((chat) => !(chat?.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[userId]))
            .sort((left, right) => {
                const leftTime = left?.updatedAt || left?.messages?.[left.messages.length - 1]?.sentAt || left?.createdAt || '';
                const rightTime = right?.updatedAt || right?.messages?.[right.messages.length - 1]?.sentAt || right?.createdAt || '';
                return String(rightTime).localeCompare(String(leftTime));
            });
    }

    function activeChat() {
        const runtime = state();
        const chatId = text(runtime.ui?.activeChatId || '');
        return activeChats().find((chat) => text(chat.id) === chatId) || activeChats()[0] || null;
    }

    function activeMessages(chat) {
        return Array.isArray(chat?.messages) ? chat.messages : [];
    }

    function groupForChat(chat) {
        if (!chat) return null;
        const runtime = state();
        const groupId = text(chat.groupId || '');
        const chatId = text(chat.id || '');
        return (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).find((group) =>
            (groupId && text(group.id) === groupId) || (chatId && text(group.chatId) === chatId)
        ) || null;
    }

    function groupAvatarSource(group) {
        const candidate = text(group?.avatarImage || group?.avatar || '');
        if (!candidate) return '';
        if (/^(data:|blob:|https?:\/\/|file:\/\/|\/)/i.test(candidate)) return candidate;
        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(candidate)) return candidate;
        return '';
    }

    function groupAvatarFallback(group) {
        return text(group?.name || 'Group').split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('') || 'GR';
    }

    function groupAvatar(group, modifier = '') {
        const src = groupAvatarSource(group);
        const classes = ['social-neo-avatar', 'social-neo-group-avatar'];
        if (modifier) classes.push(modifier);
        if (src) {
            return `<span class="${classes.join(' ')}"><img src="${escape(src)}" alt="${escape(text(group?.name || 'Group'))}"></span>`;
        }
        return `<span class="${classes.join(' ')} is-fallback">${escape(groupAvatarFallback(group))}</span>`;
    }

    function groupBanner(group) {
        return text(group?.bannerImage || group?.banner || '');
    }

    function pageAvatarSource(page) {
        const candidate = text(page?.avatarImage || page?.avatar || '');
        if (!candidate) return '';
        if (/^(data:|blob:|https?:\/\/|file:\/\/|\/)/i.test(candidate)) return candidate;
        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(candidate)) return candidate;
        return '';
    }

    function pageAvatarFallback(page) {
        return text(page?.name || 'Page').split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('') || 'PG';
    }

    function pageAvatar(page, modifier = '') {
        const src = pageAvatarSource(page);
        const classes = ['social-neo-avatar', 'social-neo-page-avatar'];
        if (modifier) classes.push(modifier);
        if (src) {
            return `<span class="${classes.join(' ')}"><img src="${escape(src)}" alt="${escape(text(page?.name || 'Page'))}"></span>`;
        }
        return `<span class="${classes.join(' ')} is-fallback">${escape(pageAvatarFallback(page))}</span>`;
    }

    function pageCover(page) {
        return text(page?.coverImage || page?.cover || '');
    }

    function pageTypeLabel(page) {
        const pageType = text(page?.pageType || page?.type || (page?.official ? 'campus' : 'brand'));
        if (pageType === 'campus') return 'Campus Page';
        if (pageType === 'community') return 'Community Page';
        return 'Brand Page';
    }

    function pagePostTypeLabel(post) {
        const postType = text(post?.postType || 'post').toLowerCase();
        if (postType === 'official') return 'Official post';
        if (postType === 'community') return 'Community post';
        return '';
    }

    function extractLinksFromText(value) {
        return uniqueStrings((text(value).match(/https?:\/\/[^\s<>"']+/gi) || []).map((item) => text(item).replace(/[),.;!?]+$/g, ''))).filter(Boolean);
    }

    function messageLinks(message) {
        return Array.isArray(message?.links) ? message.links.map((item) => text(item)).filter(Boolean) : extractLinksFromText(message?.text || '');
    }

    function renderLinkedMessageText(value) {
        const raw = text(value);
        if (!raw) return '';
        return raw
            .split(/(https?:\/\/[^\s<>"']+)/gi)
            .map((part) => /^https?:\/\//i.test(part)
                ? `<a href="${escape(text(part).replace(/[),.;!?]+$/g, ''))}" target="_blank" rel="noopener">${escape(text(part).replace(/[),.;!?]+$/g, ''))}</a>`
                : escape(part))
            .join('');
    }

    function hasSocialCommunityModule() {
        return Boolean(
            window.__KIU_SOCIAL_COMMUNITY_MODULE_LOADED
            && typeof window.renderCommunityPanel === 'function'
            && window.renderCommunityPanel !== renderCommunityPanel
        );
    }

    function ensureSocialCommunityModule() {
        if (hasSocialCommunityModule()) return Promise.resolve(true);
        if (socialCommunityModulePromise) return socialCommunityModulePromise;
        socialCommunityModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_COMMUNITY_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social community module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_COMMUNITY_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social community module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social community module load failed.', error);
            throw error;
        }).finally(() => {
            socialCommunityModulePromise = null;
        });
        return socialCommunityModulePromise;
    }

    function hasSocialAlertsModule() {
        return Boolean(
            window.__KIU_SOCIAL_ALERTS_MODULE_LOADED
            && typeof window.renderAlertsPanel === 'function'
            && window.renderAlertsPanel !== renderAlertsPanel
        );
    }

    function ensureSocialAlertsModule() {
        if (hasSocialAlertsModule()) return Promise.resolve(true);
        if (socialAlertsModulePromise) return socialAlertsModulePromise;
        socialAlertsModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_ALERTS_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social alerts module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_ALERTS_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social alerts module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social alerts module load failed.', error);
            throw error;
        }).finally(() => {
            socialAlertsModulePromise = null;
        });
        return socialAlertsModulePromise;
    }

    function hasSocialLostFoundModule() {
        return Boolean(
            window.__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED
            && typeof window.renderLostFoundPanel === 'function'
            && window.renderLostFoundPanel !== renderLostFoundPanel
        );
    }

    function ensureSocialLostFoundModule() {
        if (hasSocialLostFoundModule()) return Promise.resolve(true);
        if (socialLostFoundModulePromise) return socialLostFoundModulePromise;
        socialLostFoundModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_LOST_FOUND_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social lost-found module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_LOST_FOUND_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social lost-found module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social lost-found module load failed.', error);
            throw error;
        }).finally(() => {
            socialLostFoundModulePromise = null;
        });
        return socialLostFoundModulePromise;
    }

    function hasSocialMessagesModule() {
        return Boolean(
            window.__KIU_SOCIAL_MESSAGES_MODULE_LOADED
            && typeof window.renderMessagesPanel === 'function'
            && window.renderMessagesPanel !== renderMessagesPanel
        );
    }

    function ensureSocialMessagesModule() {
        if (hasSocialMessagesModule()) return Promise.resolve(true);
        if (socialMessagesModulePromise) return socialMessagesModulePromise;
        socialMessagesModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_MESSAGES_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social messages module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_MESSAGES_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social messages module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social messages module load failed.', error);
            throw error;
        }).finally(() => {
            socialMessagesModulePromise = null;
        });
        return socialMessagesModulePromise;
    }

    function hasSocialProfileModule() {
        return Boolean(
            window.__KIU_SOCIAL_PROFILE_MODULE_LOADED
            && typeof window.renderSocialProfilePanel === 'function'
        );
    }

    function ensureSocialProfileModule() {
        if (hasSocialProfileModule()) return Promise.resolve(true);
        if (socialProfileModulePromise) return socialProfileModulePromise;
        window.__kiuSocialProfileHooks = {
            state,
            text,
            currentUserId,
            profileAccount,
            profileCover,
            profilePostCount,
            profileFriendCount,
            profileFollowingCount,
            profileBio,
            avatar,
            displayName,
            roleLabel,
            facultyLabel,
            profilePosts,
            renderPost,
            profileFriends,
            profileFollowingItems,
            savedPostRecords,
            currentSocialProfileSettings,
            renderPortfolioProfileBlock,
            escape
        };
        socialProfileModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_PROFILE_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social profile module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_PROFILE_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social profile module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social profile module load failed.', error);
            throw error;
        }).finally(() => {
            socialProfileModulePromise = null;
        });
        return socialProfileModulePromise;
    }

    function scheduleDeferredDesktopModulePrefetch() {
        if (socialDesktopModulePrefetchScheduled) return;
        if (window.innerWidth <= 1024) return;
        socialDesktopModulePrefetchScheduled = true;
        const runPrefetch = () => {
            ensureSocialCommunityModule()
                .then(() => ensureSocialMessagesModule())
                .catch(() => null);
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => runPrefetch(), { timeout: 3000 });
            return;
        }
        window.setTimeout(runPrefetch, 1200);
    }

    function scheduleDirectoryPrefetch() {
        if (socialDirectoryPrefetchScheduled) return;
        if (typeof loadPortalSocialDirectory !== 'function') return;
        socialDirectoryPrefetchScheduled = true;
        const runPrefetch = () => {
            Promise.resolve(loadPortalSocialDirectory(false)).catch(() => null);
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => runPrefetch(), { timeout: 1800 });
            return;
        }
        window.setTimeout(runPrefetch, 200);
    }

    function resolveSocialRenderPlan(reason, activePanel, runtime) {
        const fullPlan = {
            flash: true,
            topbar: true,
            command: true,
            center: true,
            rail: true,
            drawer: true,
            mobileTab: true,
            toast: true,
            dialog: true,
            storyViewer: true,
            storyComposer: true
        };
        const isMobileViewport = window.innerWidth <= 768;
        const drawerOpen = Boolean(runtime?.ui?.shellDrawerOpen);

        if (!reason || reason === 'boot' || /-module$/.test(reason)) {
            const plan = { ...fullPlan };
            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen && reason !== 'shell-drawer-open') plan.drawer = false;
            return plan;
        }

        if (reason === 'panel' || reason === 'chat') {
            const plan = {
                ...fullPlan,
                flash: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen) plan.drawer = false;
            return plan;
        }

        if (/^dialog-/.test(reason)) {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                rail: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const centerOnlyReasons = new Set([
            'post-save',
            'post-react',
            'post-pin',
            'post-file',
            'feed',
            'feed-error',
            'comment-reply',
            'comment-reply-cancel',
            'comment-react',
            'comment-report',
            'comment-created',
            'profile-tab',
            'profile-edit',
            'profile-cancel',
            'pages-search',
            'events-tab',
            'events-compose-toggle',
            'events-compose-close',
            'group-member-search',
            'portfolio-filter-tag',
            'portfolio-compose-open',
            'portfolio-compose-close',
            'portfolio-compose-reset',
            'portfolio-edit',
            'portfolio-edit-cancel',
            'projects-back',
            'project-tab',
            'project-faculty-toggle',
            'project-selected-add',
            'project-selected-remove',
            'page-profile-tab',
            'page-profile-edit-toggle',
            'page-profile-edit-cancel',
            'lost-found-input',
            'lost-found-scope',
            'lost-found-faculty',
            'group-member-faculty',
            'project-invite-faculty',
            'portfolio-discover-faculty',
            'portfolio-discover-role',
            'project-task-toggle-form',
            'project-task-toggle-my',
            'project-task-quick-add',
            'project-task-search',
            'project-task-filter',
            'project-task-created'
        ]);
        if (centerOnlyReasons.has(reason)) {
            const plan = {
                ...fullPlan,
                flash: false,
                topbar: false,
                command: false,
                rail: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen && reason !== 'shell-drawer-open' && reason !== 'shell-drawer-close') plan.drawer = false;
            return plan;
        }

        const centerAndRailReasons = new Set([
            'chat',
            'chat-hide',
            'message-file',
            'message-sent',
            'group-thread-panel-toggle',
            'group-thread-panel-close',
            'group-thread-search-open',
            'group-thread-invite-faculty',
            'group-thread-notify',
            'thread-jump-latest'
        ]);
        if (centerAndRailReasons.has(reason) && activePanel === 'messages') {
            const plan = {
                ...fullPlan,
                flash: false,
                topbar: false,
                command: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
            if (!isMobileViewport) plan.mobileTab = false;
            return plan;
        }

        const centerAndCommandReasons = new Set([
            'feed-refresh',
            'post-submit'
        ]);
        if (centerAndCommandReasons.has(reason) && activePanel === 'feed') {
            const plan = {
                ...fullPlan,
                flash: false,
                topbar: false,
                rail: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
            if (isMobileViewport) {
                plan.mobileTab = true;
            }
            return plan;
        }

        const plan = { ...fullPlan };
        if (!isMobileViewport) plan.mobileTab = false;
        if (!drawerOpen && reason !== 'shell-drawer-open' && reason !== 'shell-drawer-close') plan.drawer = false;
        return plan;
    }

    function messageAnchorId(chatId, messageId) {
        return `social-message-${domToken(text(chatId))}-${domToken(text(messageId))}`;
    }

    function groupMessageAssets(chat) {
        return activeMessages(chat).reduce((accumulator, message) => {
            const file = message?.file || null;
            const links = messageLinks(message);
            if (file) {
                const entry = { id: text(message.id), file, sentAt: text(message.sentAt), senderId: text(message.senderId), message };
                if (isImage(file)) accumulator.media.push(entry);
                else accumulator.files.push(entry);
            }
            links.forEach((url) => {
                accumulator.links.push({ id: `${text(message.id)}::${url}`, url, sentAt: text(message.sentAt), senderId: text(message.senderId), message });
            });
            return accumulator;
        }, { files: [], media: [], links: [] });
    }

    function searchGroupMessages(chat, query) {
        const needle = text(query).toLowerCase();
        if (!needle) return [];
        return activeMessages(chat).flatMap((message) => {
            const results = [];
            const body = text(message?.text || '');
            const filename = text(message?.file?.name || '');
            const links = messageLinks(message);
            if (body.toLowerCase().includes(needle)) {
                results.push({ type: 'message', message, senderId: text(message?.senderId), sentAt: text(message?.sentAt), match: body });
            }
            if (filename && filename.toLowerCase().includes(needle)) {
                results.push({ type: isImage(message?.file) ? 'media' : 'file', message, senderId: text(message?.senderId), sentAt: text(message?.sentAt), match: filename, file: message.file });
            }
            links.filter((url) => url.toLowerCase().includes(needle)).forEach((url) => {
                results.push({ type: 'link', message, senderId: text(message?.senderId), sentAt: text(message?.sentAt), match: url, url });
            });
            return results;
        }).sort((left, right) => String(right?.sentAt || '').localeCompare(String(left?.sentAt || '')));
    }

    function currentCallParticipants(call) {
        return (Array.isArray(call?.participantIds) ? call.participantIds : Array.isArray(call?.members) ? call.members : [])
            .map((userId) => accountById(userId) || { id: userId, displayName: userId })
            .filter(Boolean);
    }

    function viewerInCall(call) {
        const viewerId = currentUserId();
        return Boolean(viewerId) && (Array.isArray(call?.participantIds) ? call.participantIds : []).some((userId) => text(userId) === viewerId);
    }

    function groupNotificationPreference(group) {
        try {
            return text(localStorage.getItem(`KIU_SOCIAL_GROUP_NOTIFY_${text(group?.id)}`) || 'all') || 'all';
        } catch (error) {
            return 'all';
        }
    }

    function setGroupNotificationPreference(groupId, value) {
        try {
            localStorage.setItem(`KIU_SOCIAL_GROUP_NOTIFY_${text(groupId)}`, text(value || 'all') || 'all');
        } catch (error) {}
    }

    function notificationItems() {
        try {
            if (typeof getPortalNotificationItemsForUser === 'function') return getPortalNotificationItemsForUser(currentUserId()) || [];
        } catch (error) {}
        return [];
    }

    function unreadNotifications() {
        try {
            if (typeof getPortalNotificationUnreadCount === 'function') return Number(getPortalNotificationUnreadCount(currentUserId()) || 0);
        } catch (error) {}
        return 0;
    }

    function unreadMessages(chat) {
        try {
            if (typeof getPortalMessengerUnreadCount === 'function') return Number(getPortalMessengerUnreadCount(chat, currentUserId()) || 0);
        } catch (error) {}
        return 0;
    }

    function chatTitle(chat) {
        try {
            if (typeof getPortalMessengerDisplayNameForChat === 'function') return getPortalMessengerDisplayNameForChat(chat, currentUserId());
        } catch (error) {}
        return text(chat?.name || 'Conversation');
    }

    function chatPreview(chat) {
        try {
            if (typeof getPortalMessengerMessagePreview === 'function') return getPortalMessengerMessagePreview(chat);
        } catch (error) {}
        return 'No messages yet';
    }

    function chatTime(chat) {
        try {
            if (typeof getPortalMessengerChatLastTime === 'function') return getPortalMessengerChatLastTime(chat);
        } catch (error) {}
        return when(chat?.updatedAt || chat?.createdAt);
    }

    function currentCall() {
        const runtime = state();
        const activeCallChatId = text(runtime.ui?.activeCallChatId || '');
        const activeCalls = (Array.isArray(runtime.calls) ? runtime.calls : []).filter((call) =>
            Array.isArray(call?.members) && call.members.some((memberId) => text(memberId) === currentUserId())
        );
        return activeCalls.find((call) => text(call.chatId) === activeCallChatId)
            || activeCalls.find((call) => Boolean(call?.active))
            || null;
    }

    function callForChat(chatId) {
        return (Array.isArray(state().calls) ? state().calls : []).find((call) => text(call?.chatId) === text(chatId)) || null;
    }

    function isIncomingCall(call) {
        return Boolean(call) && text(call?.status) === 'ringing' && text(call?.startedBy) !== currentUserId();
    }

    function isManagedPage(page) {
        return Boolean(page?.isManager);
    }

    function isJoinedGroup(group) {
        return ['manager', 'member'].includes(text(group?.membershipState));
    }

    function pageOrGroupPublic(item) {
        return text(item?.visibility || 'public') === 'public';
    }

    function postingScopeOptions() {
        const runtime = state();
        const userId = currentUserId();
        const options = [{
            type: 'profile',
            id: userId,
            name: 'My profile'
        }];
        (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(isManagedPage).forEach((page) => {
            options.push({ type: 'page', id: text(page.id), name: text(page.name || 'Page') });
        });
        (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).forEach((group) => {
            options.push({ type: 'group', id: text(group.id), name: text(group.name || 'Group') });
        });
        return options;
    }

    function feedScopeOptions() {
        const runtime = state();
        const userId = currentUserId();
        const options = [{
            type: '',
            id: '',
            name: 'All visible posts'
        }, {
            type: 'profile',
            id: userId,
            name: 'My profile posts'
        }];
        (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).forEach((page) => {
            options.push({ type: 'page', id: text(page.id), name: `Page - ${text(page.name || 'Untitled')}` });
        });
        (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter((group) => isJoinedGroup(group) || pageOrGroupPublic(group)).forEach((group) => {
            options.push({ type: 'group', id: text(group.id), name: `Group - ${text(group.name || 'Untitled')}` });
        });
        return options;
    }

    function eventScopeOptions() {
        return postingScopeOptions();
    }

    function relationshipBuckets() {
        const userId = currentUserId();
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        const incoming = [];
        const outgoing = [];
        const connections = [];
        const follows = [];

        relationships.forEach((relationship) => {
            const type = text(relationship?.type).toLowerCase();
            const status = text(relationship?.status).toLowerCase();
            if (type === 'connection-request' && status === 'pending') {
                if (text(relationship.toId) === userId) incoming.push(relationship);
                if (text(relationship.fromId) === userId) outgoing.push(relationship);
                return;
            }
            if (type === 'connection' && status === 'accepted') {
                connections.push(relationship);
                return;
            }
            if (type === 'follow' && text(relationship.fromId) === userId) {
                follows.push(relationship);
            }
        });

        return { incoming, outgoing, connections, follows };
    }

    function activeNavPanels() {
        const runtime = state();
        const social = runtime.social || {};
        const relationships = relationshipBuckets();
        const unreadThreadCount = activeChats().reduce((total, chat) => total + unreadMessages(chat), 0);
        return [{
            id: 'feed',
            label: 'Home',
            helper: 'Live campus feed',
            icon: 'fa-house',
            count: Array.isArray(runtime.feed) ? runtime.feed.length : 0
        }, {
            id: 'community',
            label: 'People',
            helper: 'Directory & connections',
            icon: 'fa-user-group',
            count: relationships.connections.length + relationships.incoming.length
        }, {
            id: 'groups',
            label: 'Groups',
            helper: 'Courses & clubs',
            icon: 'fa-layer-group',
            count: (Array.isArray(social.groups) ? social.groups : []).filter(isJoinedGroup).length
        }, {
            id: 'workspace',
            label: 'Projects',
            helper: 'Team project hubs',
            icon: 'fa-diagram-project',
            count: (Array.isArray(social.projects) ? social.projects : []).filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase())).length
        }, {
            id: 'projects',
            label: 'Portfolio',
            helper: 'Student showcase feed',
            icon: 'fa-briefcase',
            count: Array.isArray(social.projects) ? social.projects.length : 0
        }, {
            id: 'pages',
            label: 'Pages',
            helper: 'Official & followed',
            icon: 'fa-flag',
            count: (Array.isArray(social.pages) ? social.pages : []).filter(p => p?.isFollowing).length
        }, {
            id: 'events',
            label: 'Events',
            helper: "What's happening",
            icon: 'fa-calendar-days',
            count: Array.isArray(social.events) ? social.events.length : 0
        }, {
            id: 'lost-and-found',
            label: 'Lost & Found',
            helper: 'Campus items',
            icon: 'fa-magnifying-glass-location',
            count: lostFoundItems().map((item) => normalizeLostFoundItem(item)).filter((item) => ['open', 'claimed'].includes(item.status)).length
        }, {
            id: 'messages',
            label: 'Messages',
            helper: 'Direct and group chats',
            icon: 'fa-comments',
            count: unreadThreadCount
        }, {
            id: 'alerts',
            label: 'Alerts',
            helper: 'Mentions and notices',
            icon: 'fa-bell',
            count: unreadNotifications()
        }];
    }

    function filterFeedForHome(feed, filterId) {
        const runtime = state();
        const social = runtime.social || {};
        const relationships = relationshipBuckets();
        const connectionIds = new Set(relationships.connections.map((relationship) => text(relationship.fromId) === currentUserId() ? text(relationship.toId) : text(relationship.fromId)));
        const followedPageIds = new Set((Array.isArray(social.pages) ? social.pages : []).filter((page) => page?.isFollowing || isManagedPage(page)).map((page) => text(page.id)));
        const joinedGroupIds = new Set((Array.isArray(social.groups) ? social.groups : []).filter((group) => isJoinedGroup(group) || pageOrGroupPublic(group)).map((group) => text(group.id)));

        if (filterId === 'following') {
            return feed.filter((post) => connectionIds.has(text(post.authorUserId))
                || (text(post.scopeType) === 'page' && followedPageIds.has(text(post.scopeId)))
                || (text(post.scopeType) === 'group' && joinedGroupIds.has(text(post.scopeId))));
        }
        if (filterId === 'groups') return feed.filter((post) => text(post.scopeType) === 'group');
        if (filterId === 'pages') return feed.filter((post) => text(post.scopeType) === 'page');
        if (filterId === 'campus') return feed.filter((post) => !text(post.audience) || text(post.audience) === 'campus');
        return feed;
    }

    function classifyNotification(notification) {
        const nType = String(notification?.type || '').toLowerCase();
        const blob = `${text(notification?.title)} ${text(notification?.text)}`.toLowerCase();
        if (notification?.routeData?.chatId || nType === 'message' || nType === 'chat' || /message|chat|thread|reply/.test(blob)) return 'message';
        if (nType === 'mention' || /mention|tagged|mentioned|@/.test(blob)) return 'mention';
        if (nType === 'call' || /call|video|voice/.test(blob)) return 'call';
        return 'system';
    }

    const ALERTS_CATEGORIES = [
        { id: 'all', label: 'All', icon: 'fa-inbox' },
        { id: 'academic', label: 'Academic', icon: 'fa-graduation-cap' },
        { id: 'messages', label: 'Messages', icon: 'fa-envelope' },
        { id: 'social', label: 'Social', icon: 'fa-users' },
        { id: 'university', label: 'University', icon: 'fa-bullhorn' },
        { id: 'support', label: 'Support', icon: 'fa-headset' }
    ];

    function classifyNotificationCategory(notification) {
        const src = String(notification?.source || '').toLowerCase();
        const nType = String(notification?.type || '').toLowerCase();
        if (notification?.routeData?.chatId || nType === 'message' || nType === 'chat' || nType === 'call') return 'messages';
        if (src === 'social') return 'social';
        if (src === 'mail' || src === 'messenger' || src === 'calls') return 'messages';
        if (src === 'student-service') return 'support';
        if (src === 'news') return 'university';
        if (nType.includes('grade') || nType === 'manual-quiz-grade' || nType === 'grades-published') return 'academic';
        if (nType.includes('schedule')) return 'academic';
        if (nType.includes('enrollment')) return 'academic';
        if (nType.includes('announcement') || nType.includes('order')) return 'university';
        if (src === 'registration') return 'academic';
        return 'university';
    }

    function getCategoryUnreadCounts(notifications) {
        const counts = { all: 0, academic: 0, messages: 0, social: 0, university: 0, support: 0 };
        for (let i = 0; i < notifications.length; i++) {
            if (!notifications[i].read) {
                counts.all++;
                const cat = classifyNotificationCategory(notifications[i]);
                if (counts[cat] !== undefined) counts[cat]++;
            }
        }
        return counts;
    }

    function filterNotificationsByView(notifications, filterId) {
        if (filterId === 'mentions') return notifications.filter((notification) => classifyNotification(notification) === 'mention');
        if (filterId === 'all') return notifications;
        if (filterId === 'academic' || filterId === 'messages' || filterId === 'social' || filterId === 'university' || filterId === 'support') {
            return notifications.filter((notification) => classifyNotificationCategory(notification) === filterId);
        }
        return notifications.filter((notification) => !notification.read);
    }

    function lostFoundItems() {
        const runtime = state();
        return Array.isArray(runtime.social?.lostFoundItems) ? runtime.social.lostFoundItems : [];
    }

    function normalizeLostFoundItem(item = {}) {
        const currentFaculty = currentFacultyCode();
        const status = text(item?.status || 'open').toLowerCase();
        const kind = text(item?.kind || 'lost').toLowerCase() === 'found' ? 'found' : 'lost';
        return {
            id: text(item?.id),
            kind,
            status: ['open', 'claimed', 'resolved', 'archived'].includes(status) ? status : 'open',
            title: text(item?.title || ''),
            description: text(item?.description || ''),
            category: text(item?.category || 'General'),
            locationText: text(item?.locationText || item?.location || ''),
            facultyCode: text(item?.facultyCode || item?.faculty || (text(item?.facultyScope || '') === 'all' ? 'all' : currentFaculty)) || currentFaculty,
            campusScope: text(item?.campusScope || 'faculty') === 'campus' ? 'campus' : (text(item?.facultyCode || item?.faculty || '') === 'all' ? 'campus' : 'faculty'),
            eventDate: text(item?.eventDate || item?.lostAt || item?.foundAt || ''),
            imageUrl: text(item?.imageUrl || item?.photoUrl || ''),
            authorUserId: text(item?.authorUserId || item?.createdById || ''),
            authorName: text(item?.authorName || ''),
            createdAt: text(item?.createdAt || ''),
            updatedAt: text(item?.updatedAt || item?.createdAt || ''),
            resolvedAt: text(item?.resolvedAt || ''),
            resolvedByUserId: text(item?.resolvedByUserId || ''),
            contactChatId: text(item?.contactChatId || ''),
            notes: text(item?.notes || ''),
            relatedPageLinks: Array.isArray(item?.relatedPageLinks) ? item.relatedPageLinks : []
        };
    }

    function lostFoundVisibleItems() {
        const runtime = state();
        const filter = text(runtime.ui?.lostFoundFilter || 'open') || 'open';
        const facultyFilter = text(runtime.ui?.lostFoundBrowseFaculty || runtime.ui?.lostFoundFaculty || 'current') || 'current';
        const search = text(runtime.ui?.lostFoundSearch || '').toLowerCase();
        const facultyCode = currentFacultyCode();
        return lostFoundItems()
            .map((item) => normalizeLostFoundItem(item))
            .filter((item) => {
                if (facultyFilter === 'current') {
                    return text(item.campusScope) === 'campus' || text(item.facultyCode) === facultyCode;
                }
                if (facultyFilter !== 'all' && facultyFilter && text(item.facultyCode) !== facultyFilter) return false;
                return true;
            })
            .filter((item) => {
                if (filter === 'lost') return item.kind === 'lost';
                if (filter === 'found') return item.kind === 'found';
                if (filter === 'resolved') return ['resolved', 'archived'].includes(item.status);
                if (filter === 'open') return ['open', 'claimed'].includes(item.status);
                return true;
            })
            .filter((item) => {
                if (!search) return true;
                const blob = [
                    item.title,
                    item.description,
                    item.category,
                    item.locationText,
                    item.authorName,
                    item.facultyCode
                ].join(' ').toLowerCase();
                return blob.includes(search);
            })
            .sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || '')));
    }

    function lostFoundSuggestionItems(items, draftTitle = '', draftCategory = '', draftLocation = '', excludeId = '') {
        const title = text(draftTitle).toLowerCase();
        const category = text(draftCategory).toLowerCase();
        const location = text(draftLocation).toLowerCase();
        return (Array.isArray(items) ? items : [])
            .filter((item) => item.status !== 'resolved' && item.status !== 'archived')
            .map((item) => normalizeLostFoundItem(item))
            .filter((item) => !text(excludeId) || text(item.id) !== text(excludeId))
            .filter((item) => {
                const blob = `${item.title} ${item.category} ${item.locationText}`.toLowerCase();
                if (!title && !category && !location) return false;
                if (title && blob.includes(title)) return true;
                if (category && text(item.category).toLowerCase() === category) return true;
                if (location && blob.includes(location)) return true;
                return false;
            })
            .slice(0, 3);
    }

    window.__kiuSocialCommunityHooks = window.__kiuSocialCommunityHooks || {};
    Object.assign(window.__kiuSocialCommunityHooks, {
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
        renderRelationshipActions,
        inviteEligibleGroups,
        escape
    });

    window.__kiuSocialLostFoundHooks = window.__kiuSocialLostFoundHooks || {};
    Object.assign(window.__kiuSocialLostFoundHooks, {
        state,
        currentUser,
        text,
        escape,
        currentFacultyCode,
        lostFoundVisibleItems,
        lostFoundItems,
        normalizeLostFoundItem,
        lostFoundSuggestionItems,
        accountById,
        currentUserId,
        avatar,
        displayName,
        facultyLabel,
        when,
        controlId
    });

    window.__kiuSocialAlertsHooks = window.__kiuSocialAlertsHooks || {};
    Object.assign(window.__kiuSocialAlertsHooks, {
        currentUser,
        notificationItems,
        state,
        text,
        filterNotificationsByView,
        classifyNotification,
        classifyNotificationCategory,
        getCategoryUnreadCounts,
        ALERTS_CATEGORIES,
        unreadNotifications,
        escape,
        when,
        roleValue,
        accountById,
        displayName
    });

    window.__kiuSocialMessagesHooks = window.__kiuSocialMessagesHooks || {};
    Object.assign(window.__kiuSocialMessagesHooks, {
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
    });
    async function saveLostFoundItems(nextItems, reason = 'lost-found-save') {
        const runtime = state();
        if (!runtime.social || typeof runtime.social !== 'object') runtime.social = {};
        const normalizedItems = Array.isArray(nextItems) ? nextItems.map((item) => normalizeLostFoundItem(item)) : [];
        runtime.social.lostFoundItems = normalizedItems;
        if (typeof persistPortalSocialStatePatch === 'function') {
            const persisted = await persistPortalSocialStatePatch({ lostFoundItems: normalizedItems }, reason);
            if (Array.isArray(persisted?.lostFoundItems)) {
                runtime.social.lostFoundItems = persisted.lostFoundItems.map((item) => normalizeLostFoundItem(item));
            }
        }
        return runtime.social.lostFoundItems;
    }

    function resetLostFoundDraft() {
        const runtime = state();
        runtime.ui.lostFoundEditId = '';
        runtime.ui.lostFoundComposerOpen = false;
        runtime.ui.lostFoundKind = 'lost';
        runtime.ui.lostFoundStatus = 'open';
        runtime.ui.lostFoundTitle = '';
        runtime.ui.lostFoundDescription = '';
        runtime.ui.lostFoundCategory = '';
        runtime.ui.lostFoundLocation = '';
        runtime.ui.lostFoundDate = '';
        runtime.ui.lostFoundScope = 'current';
        runtime.ui.lostFoundFile = null;
    }

    function renderContextTabs(activePanel) {
        const runtime = state();
        const activeHomeFilter = text(runtime.ui?.homeFeedFilter || 'all') || 'all';
        const activeCommunityTab = text(runtime.ui?.communityTab || 'people') || 'people';
        const activeEventsTab = text(runtime.ui?.eventsSubTab || 'student') || 'student';
        const activeLostFoundFilter = text(runtime.ui?.lostFoundFilter || 'open') || 'open';
        const activeMessagesFilter = text(runtime.ui?.messagesFilter || 'all') || 'all';
        const activeAlertsFilter = text(runtime.ui?.alertsFilter || 'all') || 'all';
        const activeProfileTab = text(runtime.ui?.profileTab || 'posts') || 'posts';

        const tabs = activePanel === 'community'
            ? [{
                action: 'panel-community',
                tab: 'people',
                label: 'People',
                isActive: activeCommunityTab === 'people'
            }, {
                action: 'panel-community',
                tab: 'suggested',
                label: 'Suggested',
                isActive: activeCommunityTab === 'suggested'
            }, {
                action: 'panel-community',
                tab: 'requests',
                label: 'Requests',
                isActive: activeCommunityTab === 'requests'
            }, {
                action: 'panel-community',
                tab: 'connections',
                label: 'Connections',
                isActive: activeCommunityTab === 'connections'
            }, {
                action: 'panel-community',
                tab: 'staff',
                label: 'Staff',
                isActive: activeCommunityTab === 'staff'
            }]
            : activePanel === 'groups'
                ? [{
                    action: 'panel-groups',
                    tab: 'discover',
                    label: 'Discover',
                    isActive: (text(runtime.ui?.groupsTab || 'discover')) === 'discover'
                }, {
                    action: 'panel-groups',
                    tab: 'joined',
                    label: 'Your Groups',
                    isActive: (text(runtime.ui?.groupsTab || 'discover')) === 'joined'
                }, {
                    action: 'panel-groups',
                    tab: 'create',
                    label: 'Create',
                    isActive: (text(runtime.ui?.groupsTab || 'discover')) === 'create'
                }]
            : activePanel === 'pages'
                ? [{
                    action: 'panel-pages',
                    tab: 'discover',
                    label: 'Discover',
                    isActive: (text(runtime.ui?.pagesTab || 'discover')) === 'discover'
                }, {
                    action: 'panel-pages',
                    tab: 'following',
                    label: 'Following',
                    isActive: (text(runtime.ui?.pagesTab || 'discover')) === 'following'
                    }]
            : activePanel === 'events'
            ? [{
                action: 'panel-events',
                tab: 'student',
                label: 'Student',
                isActive: activeEventsTab === 'student'
            }, {
                action: 'panel-events',
                tab: 'university',
                label: 'University',
                isActive: activeEventsTab === 'university'
            }, {
                action: 'panel-events',
                tab: 'studygroups',
                label: 'Study Groups',
                isActive: activeEventsTab === 'studygroups'
            }]
            : activePanel === 'lost-and-found'
                ? [{
                    action: 'panel-lost-and-found',
                    tab: 'open',
                    label: 'Open',
                    isActive: activeLostFoundFilter === 'open'
                }, {
                    action: 'panel-lost-and-found',
                    tab: 'lost',
                    label: 'Lost',
                    isActive: activeLostFoundFilter === 'lost'
                }, {
                    action: 'panel-lost-and-found',
                    tab: 'found',
                    label: 'Found',
                    isActive: activeLostFoundFilter === 'found'
                }, {
                    action: 'panel-lost-and-found',
                    tab: 'resolved',
                    label: 'Resolved',
                    isActive: activeLostFoundFilter === 'resolved'
                }]
                : activePanel === 'messages'
                    ? [{
                        action: 'panel-messages',
                        tab: 'all',
                        label: 'Chats',
                        isActive: activeMessagesFilter === 'all'
                    }, {
                        action: 'panel-messages',
                        tab: 'unread',
                        label: 'Unread',
                        isActive: activeMessagesFilter === 'unread'
                    }, {
                        action: 'panel-alerts',
                        tab: 'unread',
                        label: 'Alerts',
                        isActive: false
                    }]
                    : activePanel === 'alerts'
                        ? [{
                            action: 'panel-messages',
                            tab: 'all',
                            label: 'Messages',
                            isActive: false
                        }]
                        : activePanel === 'profile'
                            ? [{
                                action: 'profile-tab-posts',
                                label: 'Posts',
                                isActive: activeProfileTab === 'posts'
                            }, {
                                action: 'profile-tab-friends',
                                label: 'Friends',
                                isActive: activeProfileTab === 'friends'
              }, {
                  action: 'profile-tab-following',
                  label: 'Following',
                  isActive: activeProfileTab === 'following'
              }, {
                  action: 'profile-tab-saved',
                  label: 'Saved',
                  isActive: activeProfileTab === 'saved'
              }, {
                  action: 'profile-tab-about',
                  label: 'About',
                  isActive: activeProfileTab === 'about'
              }]
                            : [{
                                action: 'panel-feed',
                                tab: 'all',
                                label: 'All',
                                isActive: activeHomeFilter === 'all'
                            }, {
                                action: 'panel-feed',
                                tab: 'following',
                                label: 'Following',
                                isActive: activeHomeFilter === 'following'
                            }, {
                                action: 'panel-feed',
                                tab: 'groups',
                                label: 'Groups',
                                isActive: activeHomeFilter === 'groups'
                            }, {
                                action: 'panel-feed',
                                tab: 'pages',
                                label: 'Pages',
                                isActive: activeHomeFilter === 'pages'
                            }, {
                                action: 'panel-feed',
                                tab: 'campus',
                                label: 'Campus',
                                isActive: activeHomeFilter === 'campus'
                            }];

        return `<div class="social-neo-tabs social-neo-tabs-context social-neo-topbar-tabs">
            ${tabs.map((tab) => {
                const attrs = [tab.action ? `data-action="${escape(tab.action)}"` : ''];
                if (tab.action === 'panel-feed' && tab.tab) attrs.push(`data-home-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-community' && tab.tab) attrs.push(`data-community-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-events' && tab.tab) attrs.push(`data-events-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-lost-and-found' && tab.tab) attrs.push(`data-lost-found-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-messages' && tab.tab) attrs.push(`data-messages-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-alerts' && tab.tab) attrs.push(`data-alerts-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-groups' && tab.tab) attrs.push(`data-groups-tab="${escape(tab.tab)}"`);
                  if (tab.action === 'panel-pages' && tab.tab) attrs.push(`data-pages-tab="${escape(tab.tab)}"`);
                return `<button class="social-neo-tab social-neo-topbar-tab ${tab.isActive ? 'is-active' : ''}" type="button" aria-pressed="${tab.isActive ? 'true' : 'false'}" ${attrs.join(' ')}>${escape(tab.label)}</button>`;
            }).join('')}
        </div>`;
    }

    function connectionStatusFor(targetUserId) {
        const userId = currentUserId();
        const normalizedTargetId = text(targetUserId);
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        const incoming = relationships.find((relationship) =>
            text(relationship?.type).toLowerCase() === 'connection-request'
            && text(relationship?.status).toLowerCase() === 'pending'
            && text(relationship?.fromId) === normalizedTargetId
            && text(relationship?.toId) === userId
        );
        if (incoming) return { state: 'incoming', relationship: incoming };
        const outgoing = relationships.find((relationship) =>
            text(relationship?.type).toLowerCase() === 'connection-request'
            && text(relationship?.status).toLowerCase() === 'pending'
            && text(relationship?.fromId) === userId
            && text(relationship?.toId) === normalizedTargetId
        );
        if (outgoing) return { state: 'outgoing', relationship: outgoing };
        const connection = relationships.find((relationship) =>
            text(relationship?.type).toLowerCase() === 'connection'
            && text(relationship?.status).toLowerCase() === 'accepted'
            && [text(relationship?.fromId), text(relationship?.toId)].includes(userId)
            && [text(relationship?.fromId), text(relationship?.toId)].includes(normalizedTargetId)
        );
        if (connection) return { state: 'connected', relationship: connection };
        return { state: 'none', relationship: null };
    }

    function profileAccount(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return null;
        return accountById(normalizedId);
    }

    function profilePosts(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return [];
        return (Array.isArray(state().feed) ? state().feed : [])
            .filter((post) => text(post.authorUserId) === normalizedId);
    }

    function profileFriends(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return [];
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        const connectionIds = relationships
            .filter((rel) => {
                const type = text(rel.type).toLowerCase();
                const status = text(rel.status).toLowerCase();
                if (type !== 'connection' || status !== 'accepted') return false;
                return [text(rel.fromId), text(rel.toId)].includes(normalizedId);
            })
            .map((rel) => text(rel.fromId) === normalizedId ? text(rel.toId) : text(rel.fromId));
        return connectionIds.map((id) => accountById(id)).filter(Boolean);
    }

    function profileFriendCount(userId) {
        return profileFriends(userId).length;
    }

    function profilePostCount(userId) {
        return profilePosts(userId).length;
    }

    function profileBio(account) {
        return text(account?.bio || '');
    }

    function profileCover(account) {
        return text(account?.coverImage || '');
    }

    function profileEditable(account) {
        return text(account?.id) === currentUserId();
    }

    function profileFollowingItems(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return [];
        const runtime = state();
        const pages = (Array.isArray(runtime.social?.pages) ? runtime.social.pages : [])
            .filter((page) => normalizedId === currentUserId()
                ? Boolean(page?.isFollowing || page?.isManager)
                : text(page?.ownerUserId) === normalizedId || Array.isArray(page?.managerIds) && page.managerIds.some((id) => text(id) === normalizedId))
            .map((page) => ({
                type: 'page',
                id: text(page.id),
                name: text(page.name || 'Page'),
                subtitle: text(page.description || `${page.followerCount || 0} followers`)
            }));
        const groups = (Array.isArray(runtime.social?.groups) ? runtime.social.groups : [])
            .filter((group) => normalizedId === currentUserId()
                ? isJoinedGroup(group)
                : text(group?.ownerUserId) === normalizedId || Array.isArray(group?.managerIds) && group.managerIds.some((id) => text(id) === normalizedId))
            .map((group) => ({
                type: 'group',
                id: text(group.id),
                name: text(group.name || 'Group'),
                subtitle: text(group.description || `${group.memberCount || 0} members`)
            }));
        return [...pages, ...groups];
    }

    function profileFollowingCount(userId) {
        return profileFollowingItems(userId).length;
    }

    function mutualConnectionCount(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        if (!normalizedTargetId || normalizedTargetId === currentUserId()) return 0;
        const mine = new Set(profileFriends(currentUserId()).map((friend) => text(friend?.id)));
        return profileFriends(normalizedTargetId).filter((friend) => mine.has(text(friend?.id))).length;
    }

    function pageParticipantIds(page) {
        return new Set([
            text(page?.ownerUserId),
            ...(Array.isArray(page?.adminIds) ? page.adminIds : []),
            ...(Array.isArray(page?.followerIds) ? page.followerIds : [])
        ].map((value) => text(value)).filter(Boolean));
    }

    function groupParticipantIds(group) {
        return new Set([
            text(group?.ownerUserId),
            ...(Array.isArray(group?.adminIds) ? group.adminIds : []),
            ...(Array.isArray(group?.memberIds) ? group.memberIds : []),
            ...(Array.isArray(group?.memberUserIds) ? group.memberUserIds : [])
        ].map((value) => text(value)).filter(Boolean));
    }

    function sharedGroupsWithUser(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        if (!normalizedTargetId || normalizedTargetId === currentUserId()) return [];
        return (Array.isArray(state().social?.groups) ? state().social.groups : []).filter((group) => {
            const participants = groupParticipantIds(group);
            return participants.has(currentUserId()) && participants.has(normalizedTargetId);
        });
    }

    function sharedPagesWithUser(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        if (!normalizedTargetId || normalizedTargetId === currentUserId()) return [];
        return (Array.isArray(state().social?.pages) ? state().social.pages : []).filter((page) => {
            const participants = pageParticipantIds(page);
            return participants.has(currentUserId()) && participants.has(normalizedTargetId);
        });
    }

    function personLatestPost(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        return (Array.isArray(state().feed) ? state().feed : [])
            .filter((post) => text(post?.authorUserId) === normalizedTargetId)
            .sort((left, right) => String(right?.createdAt || '').localeCompare(String(left?.createdAt || '')))[0] || null;
    }

    function personActivityLabel(targetUserId) {
        const post = personLatestPost(targetUserId);
        if (!post?.createdAt) return 'New to social';
        const timestamp = new Date(post.createdAt).getTime();
        if (!Number.isFinite(timestamp)) return `Last posted ${when(post.createdAt)}`;
        const ageHours = Math.max(0, (Date.now() - timestamp) / 36e5);
        if (ageHours < 24) return 'Active today';
        if (ageHours < 24 * 7) return 'Active this week';
        return `Last posted ${when(post.createdAt)}`;
    }

    function personProfileCompleteness(account) {
        const checks = [
            text(account?.bio),
            text(account?.location),
            text(account?.website),
            Array.isArray(account?.interests) ? account.interests.length : text(account?.interests)
        ];
        const filled = checks.filter((value) => Array.isArray(value) ? value.length : Boolean(text(value))).length;
        return Math.round((filled / checks.length) * 100);
    }

    function isStaffAccount(account) {
        return ['professor', 'ta', 'admin', 'student_service'].includes(text(account?.role).toLowerCase());
    }

    function personRoleBadges(account) {
        const badges = [];
        const role = text(account?.role).toLowerCase();
        if (role === 'professor') badges.push('Professor', 'Verified staff');
        else if (role === 'ta') badges.push('TA', 'Verified staff');
        else if (role === 'admin') badges.push('Admin', 'Verified staff');
        else if (role === 'student_service') badges.push('Student Service', 'Verified staff');
        const managesPage = (Array.isArray(state().social?.pages) ? state().social.pages : []).some((page) => pageParticipantIds(page).has(text(account?.id)) && (text(page?.ownerUserId) === text(account?.id) || (Array.isArray(page?.adminIds) ? page.adminIds : []).some((id) => text(id) === text(account?.id))));
        const managesGroup = (Array.isArray(state().social?.groups) ? state().social.groups : []).some((group) => groupParticipantIds(group).has(text(account?.id)) && (text(group?.ownerUserId) === text(account?.id) || (Array.isArray(group?.adminIds) ? group.adminIds : []).some((id) => text(id) === text(account?.id))));
        if (managesPage || managesGroup) badges.push('Club lead');
        return [...new Set(badges)];
    }

    function personSuggestionScore(account) {
        const sharedGroups = sharedGroupsWithUser(account?.id).length;
        const sharedPages = sharedPagesWithUser(account?.id).length;
        const mutuals = mutualConnectionCount(account?.id);
        const sameFaculty = text(account?.facultyCode || account?.faculty) === currentFacultyCode() ? 1 : 0;
        return (sharedGroups * 6) + (sharedPages * 4) + (mutuals * 3) + sameFaculty;
    }

    function personSuggestionReason(account) {
        const sharedGroups = sharedGroupsWithUser(account?.id);
        if (sharedGroups.length) return `${sharedGroups.length} shared group${sharedGroups.length === 1 ? '' : 's'}`;
        const sharedPages = sharedPagesWithUser(account?.id);
        if (sharedPages.length) return `${sharedPages.length} shared page${sharedPages.length === 1 ? '' : 's'}`;
        const mutuals = mutualConnectionCount(account?.id);
        if (mutuals) return `${mutuals} mutual connection${mutuals === 1 ? '' : 's'}`;
        if (text(account?.facultyCode || account?.faculty) === currentFacultyCode()) return 'Same faculty';
        return 'Campus suggestion';
    }

    function inviteEligibleGroups() {
        return (Array.isArray(state().social?.groups) ? state().social.groups : []).filter((group) => ['manager', 'member'].includes(text(group?.membershipState)));
    }

    function audienceBadge(post) {
        const audience = text(post?.audience || 'campus') || 'campus';
        const labels = {
            campus: 'Campus',
            faculty: 'Faculty',
            connections: 'Connections',
            group: 'Group members',
            page: 'Page followers'
        };
        return labels[audience] || 'Campus';
    }

    function feedReason(post, author) {
        const authorId = text(author?.id || post?.authorUserId);
        if (text(post?.scopeType) === 'group') return `Active in ${text(post?.scopeName || 'group')}`;
        if (text(post?.scopeType) === 'page') return `Update from ${text(post?.scopeName || 'page')}`;
        if (connectionStatusFor(authorId).state === 'connected') return 'From your campus network';
        if (text(author?.facultyCode || author?.faculty) && text(author?.facultyCode || author?.faculty) === currentFacultyCode()) return `Same faculty as you`;
        return `Visible to ${audienceBadge(post).toLowerCase()}`;
    }

    function socialHub() {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!window.KIU_STATE.socialHub) window.KIU_STATE.socialHub = {};
        if (!Array.isArray(window.KIU_STATE.socialHub.savedPosts)) window.KIU_STATE.socialHub.savedPosts = [];
        return window.KIU_STATE.socialHub;
    }

    function savedItems() {
        return (Array.isArray(socialHub().savedPosts) ? socialHub().savedPosts : []).filter((item) => text(item?.userId) === currentUserId());
    }

    function savedPostRecords() {
        return Array.isArray(state().social?.savedPosts) ? state().social.savedPosts : [];
    }

    function currentSocialProfileSettings(userId = currentUserId()) {
        const profile = state().social?.profiles?.[text(userId)] || {};
        return {
            visibility: text(profile.visibility || 'public') || 'public',
            defaultAudience: text(profile.defaultAudience || 'campus') || 'campus',
            digestFrequency: text(profile.digestFrequency || 'daily') || 'daily',
            eventReminderLeadHours: text(profile.eventReminderLeadHours || '24') || '24'
        };
    }

    function isPostSaved(postId) {
        return savedItems().some((item) => text(item?.itemType) === 'post' && text(item?.itemId) === text(postId));
    }

    async function toggleSavedPost(postId) {
        const normalizedId = text(postId);
        if (!normalizedId) return;
        const hub = socialHub();
        const existing = hub.savedPosts.find((item) =>
            text(item?.userId) === currentUserId()
            && text(item?.itemType) === 'post'
            && text(item?.itemId) === normalizedId
        );
        if (existing) {
            hub.savedPosts = hub.savedPosts.filter((item) => text(item?.id) !== text(existing.id));
        } else {
            hub.savedPosts.unshift({
                id: `saved-post-${Date.now()}`,
                userId: currentUserId(),
                itemType: 'post',
                itemId: normalizedId,
                createdAt: new Date().toISOString()
            });
        }
        if (typeof saveState === 'function') {
            try { saveState(); } catch (error) {}
        }
        if (typeof addPortalSocialToast === 'function') {
            addPortalSocialToast({
                type: 'success',
                title: existing ? 'Removed from saved' : 'Saved for later',
                text: existing ? 'The post was removed from your saved list.' : 'The post is now available from saved content.',
                icon: 'fa-bookmark'
            });
        }
        if (typeof loadPortalSavedSocialPosts === 'function') {
            try { await loadPortalSavedSocialPosts(true); } catch (error) {}
        }
        renderSocialPageNow('post-save');
    }

    function reactionEmoji(reactionType) {
        const type = text(reactionType || 'like').toLowerCase();
        if (type === 'love') return '&#10084;&#65039;';
        if (type === 'laugh') return '&#128514;';
        if (type === 'wow') return '&#128558;';
        if (type === 'support') return '&#129309;';
        return '&#128077;';
    }

    function reactionLabel(reactionType) {
        const type = text(reactionType || '').toLowerCase();
        if (!type) return 'Like';
        if (type === 'like') return 'Liked';
        if (type === 'love') return 'Loved';
        if (type === 'laugh') return 'Haha';
        if (type === 'wow') return 'Wow';
        if (type === 'support') return 'Support';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    function renderPostReactionMetrics(reactionCounts = {}) {
        const types = ['like', 'love', 'laugh', 'wow', 'support'];
        const active = types
            .map((type) => [type, Number(reactionCounts[type] || 0)])
            .filter(([, count]) => count > 0)
            .sort((left, right) => right[1] - left[1]);
        const total = active.reduce((sum, [, count]) => sum + count, 0);
        if (!total) return '';
        const icons = active.slice(0, 3).map(([type]) =>
            `<span class="social-neo-reaction-metric-emoji" aria-hidden="true">${reactionEmoji(type)}</span>`
        ).join('');
        return `<span class="social-neo-post-metric social-neo-post-reaction-metric">${icons}<span>${escape(total)}</span></span>`;
    }

    function commentReactionType(comment) {
        const reactions = comment?.reactions && typeof comment.reactions === 'object' ? comment.reactions : {};
        const userId = currentUserId();
        return Object.keys(reactions).find((type) => Array.isArray(reactions[type]) && reactions[type].some((id) => text(id) === userId)) || '';
    }

    function renderCommentNode(comment, post, depth = 0) {
        const normalizedPostId = postKey(post);
        const commentAuthor = accountById(comment.authorUserId) || { id: comment.authorUserId, displayName: comment.authorName || comment.authorUserId };
        const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
        const commentReaction = commentReactionType(comment);
        const reactionCounts = comment?.reactionCounts || {};
        const depthClass = depth ? ` is-reply social-neo-comment-depth-${Math.min(depth, 3)}` : '';
        return `
            <article class="social-neo-comment${depthClass}" data-comment-id="${escape(text(comment.id))}">
                ${avatar(commentAuthor, 'social-neo-avatar-sm')}
                <div class="social-neo-comment-bubble">
                    <div class="social-neo-comment-head">
                        <strong>${escape(displayName(commentAuthor))}</strong>
                        <span>${escape(when(comment.createdAt))}</span>
                    </div>
                    <p>${escape(comment.body || comment.text || '')}</p>
                    <div class="social-neo-comment-actions">
                        ${['like', 'love', 'laugh', 'wow', 'support'].map((reactionType) => `
                            <button class="social-neo-btn social-neo-btn-sm ${commentReaction === reactionType ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="comment-react" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}" data-reaction-type="${escape(reactionType)}">
                                <span>${reactionEmoji(reactionType)}</span> ${escape(text(reactionCounts[reactionType] || 0))}
                            </button>
                        `).join('')}
                        <button class="social-neo-btn social-neo-btn-sm social-neo-btn-ghost" type="button" data-action="comment-reply" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}" data-author-name="${escape(displayName(commentAuthor))}">
                            <i class="fas fa-reply"></i> Reply${replyCount ? ` (${replyCount})` : ''}
                        </button>
                        <button class="social-neo-btn social-neo-btn-sm social-neo-btn-ghost" type="button" data-action="comment-report" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}">
                            <i class="fas fa-flag"></i>
                        </button>
                    </div>
                    ${Array.isArray(comment.replies) && comment.replies.length ? `<div class="social-neo-comment-children">${comment.replies.map((reply) => renderCommentNode(reply, post, depth + 1)).join('')}</div>` : ''}
                </div>
            </article>
        `;
    }

    function renderCommentThread(comments, post) {
        const roots = Array.isArray(comments) ? comments : [];
        if (!roots.length) return '';
        return `<div class="social-neo-comment-list">${roots.map((comment) => renderCommentNode(comment, post, 0)).join('')}</div>`;
    }

    function findCommentInThread(comments, commentId) {
        const normalizedId = text(commentId);
        if (!normalizedId) return null;
        for (const comment of Array.isArray(comments) ? comments : []) {
            if (text(comment?.id) === normalizedId) return comment;
            const replyMatch = findCommentInThread(comment?.replies, normalizedId);
            if (replyMatch) return replyMatch;
        }
        return null;
    }

    function openDialog(type, payload = {}) {
        state().ui.socialDialog = { type, ...payload };
        renderSocialPageNow(`dialog-${type}`);
    }

    function closeDialog() {
        if (state().ui.socialDialog) {
            state().ui.socialDialog = null;
            state().ui.coverImageFile = null;
            renderSocialPageNow('dialog-close');
        }
    }

    function activeDialog() {
        return state().ui.socialDialog || null;
    }

    function readFileAsDataUrl(file) {
        if (!file) return Promise.resolve('');
        if (text(file.dataUrl)) return Promise.resolve(text(file.dataUrl));
        if (typeof readPortalSocialFile === 'function') {
            return Promise.resolve(readPortalSocialFile(file)).then((result) => text(result?.dataUrl || result || ''));
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(text(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
            reader.readAsDataURL(file);
        });
    }

    function setPanel(panel) {
        const runtime = state();
        const normalizedPanel = text(panel).toLowerCase() === 'lost-found' ? 'lost-and-found' : text(panel);
        const nextPanel = ['feed', 'community', 'groups', 'workspace', 'projects', 'pages', 'events', 'lost-and-found', 'messages', 'alerts', 'profile'].includes(normalizedPanel) ? normalizedPanel : 'feed';
        const panelChanged = runtime.ui.activePanel !== nextPanel;
        const drawerChanged = runtime.ui.shellDrawerOpen !== false;
        runtime.ui.activePanel = nextPanel;
        runtime.ui.shellDrawerOpen = false;
        if (runtime.ui.activePanel === 'community') {
            scheduleDirectoryPrefetch();
        }
        try {
            localStorage.setItem(PANEL_KEY, runtime.ui.activePanel);
        } catch (error) {}
        if (!panelChanged && !drawerChanged) {
            return;
        }
        renderSocialPageNow('panel');
    }

    function setActiveChat(chatId) {
        const runtime = state();
        const nextChatId = text(chatId);
        const chatChanged = runtime.ui.activeChatId !== nextChatId;
        runtime.ui.activeChatId = nextChatId;
        try {
            localStorage.setItem(CHAT_KEY, runtime.ui.activeChatId);
        } catch (error) {}
        if (typeof unhidePortalMessengerChatForUser === 'function' && nextChatId) {
            try { unhidePortalMessengerChatForUser(nextChatId, currentUserId()); } catch (error) {}
        }
        if (typeof markPortalChatMessagesRead === 'function' && nextChatId) {
            markPortalChatMessagesRead(nextChatId).catch(() => null);
        }
        if (!chatChanged) return;
        renderSocialPageNow('chat');
    }

    async function focusFeed(scopeType, scopeId) {
        const runtime = state();
        runtime.ui.feedScopeType = text(scopeType);
        runtime.ui.feedScopeId = text(scopeId);
        try {
            await refreshPortalSocialFeed(true);
        } catch (error) {
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Feed could not be refreshed.', 'danger');
        }
        setPanel('feed');
    }

    function focusRestoreSelector(node) {
        if (!node || node === document.body) return '';
        const name = text(node.getAttribute?.('name') || '');
        const bind = text(node.getAttribute?.('data-bind') || '');
        const form = node.closest?.('form[data-form]');
        const formName = text(form?.getAttribute('data-form') || '');
        const postId = postKey(form?.getAttribute('data-post-id') || '');
        if (formName === 'comment' && postId && name === 'commentBody') {
            return `form[data-form="comment"][data-post-id="${CSS.escape(postId)}"] [name="commentBody"]`;
        }
        if (node.id) return `#${CSS.escape(node.id)}`;
        if (formName && name) return `form[data-form="${formName}"] [name="${name}"]`;
        if (bind) return `[data-bind="${bind}"]`;
        if (name) return `[name="${name}"]`;
        return '';
    }

    function captureInteractionState(host) {
        const active = document.activeElement;
        const activeInHost = Boolean(active && host?.contains(active));
        const scrollSelectors = [
            '.social-neo-thread-messages',
            '.social-neo-chat-list',
            '.social-neo-center',
            '.social-neo-rail',
            '.social-neo-stories',
            '.social-neo-directory',
            '.social-neo-events-content'
        ];
        return {
            windowX: window.scrollX || 0,
            windowY: window.scrollY || 0,
            activeSelector: activeInHost ? focusRestoreSelector(active) : '',
            selectionStart: activeInHost && typeof active.selectionStart === 'number' ? active.selectionStart : null,
            selectionEnd: activeInHost && typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
            scrolls: scrollSelectors.flatMap((selector) => Array.from(host?.querySelectorAll(selector) || []).map((node, index) => ({
                selector,
                index,
                top: node.scrollTop || 0,
                left: node.scrollLeft || 0
            })))
        };
    }

    function restoreInteractionState(host, snapshot) {
        if (!host || !snapshot) return;
        snapshot.scrolls?.forEach((item) => {
            const node = host.querySelectorAll(item.selector)?.[item.index];
            if (!node) return;
            node.scrollTop = item.top || 0;
            node.scrollLeft = item.left || 0;
        });
        if (snapshot.activeSelector) {
            const node = host.querySelector(snapshot.activeSelector);
            if (node && typeof node.focus === 'function') {
                try {
                    node.focus({ preventScroll: true });
                    if (typeof node.setSelectionRange === 'function' && snapshot.selectionStart !== null) {
                        node.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd ?? snapshot.selectionStart);
                    }
                } catch (error) {}
            }
        }
        if (Number.isFinite(snapshot.windowY)) {
            try { window.scrollTo(snapshot.windowX || 0, snapshot.windowY || 0); } catch (error) {}
        }
    }

    function ensureSocialShell(host) {
        let rootNode = host.querySelector('#social-neo-root');
        if (rootNode) {
            return {
                root: rootNode,
                flash: rootNode.querySelector('#social-neo-flash-region'),
                topbar: rootNode.querySelector('#social-neo-topbar-region'),
                command: rootNode.querySelector('#social-neo-command-region'),
                workspaceNav: rootNode.querySelector('#social-neo-workspace-nav-region'),
                center: rootNode.querySelector('#social-neo-center-region'),
                rail: rootNode.querySelector('#social-neo-rail-region'),
                drawer: rootNode.querySelector('#social-neo-drawer-region'),
                mobileTab: rootNode.querySelector('#social-neo-mobile-tab-region'),
                toast: rootNode.querySelector('#social-neo-toast-region'),
                dialog: rootNode.querySelector('#social-neo-dialog-region'),
                storyViewer: rootNode.querySelector('#social-neo-story-viewer-region'),
                storyComposer: rootNode.querySelector('#social-neo-story-composer-region')
            };
        }

        host.innerHTML = `
            <div id="social-neo-root" class="social-neo social-neo-facebook">
                <div id="social-neo-flash-region"></div>
                <div id="social-neo-topbar-region"></div>
                <div id="social-neo-command-region"></div>
                <div class="social-neo-shell">
                    <div id="social-neo-workspace-nav-region"></div>
                    <div class="social-neo-center" id="social-neo-center-region"></div>
                    <div id="social-neo-rail-region"></div>
                </div>
                <div id="social-neo-drawer-region"></div>
                <div id="social-neo-mobile-tab-region"></div>
                <div id="social-neo-toast-region"></div>
                <div id="social-neo-dialog-region"></div>
                <div id="social-neo-story-viewer-region"></div>
                <div id="social-neo-story-composer-region"></div>
            </div>
        `;

        rootNode = host.querySelector('#social-neo-root');
        return ensureSocialShell(host);
    }

    function setSocialRegionMarkup(node, markup) {
        if (!node) return;
        const nextMarkup = String(markup || '');
        if (node.__kiuLastMarkup === nextMarkup) return;
        node.innerHTML = nextMarkup;
        node.__kiuLastMarkup = nextMarkup;
    }

    function queueDeferredModuleRender(reason) {
        const host = root();
        if (host) {
            host.__kiuLastRenderSignature = '';
            host.__kiuForceCenterOnly = true;
        }
        renderSocialPageNow(reason);
    }

    function enhanceSocialAccessibility(host) {
        if (!host) return;
        host.setAttribute('aria-live', 'polite');
        host.setAttribute('aria-busy', 'false');
        host.querySelectorAll('.social-neo-section-command').forEach((node) => {
            node.setAttribute('role', 'region');
            if (!node.getAttribute('aria-label')) {
                const title = text(node.querySelector('h2')?.textContent || node.getAttribute('data-section-command') || 'Social section');
                node.setAttribute('aria-label', title);
            }
        });
        host.querySelectorAll('.social-neo-dialog-backdrop').forEach((node) => {
            node.setAttribute('role', 'dialog');
            node.setAttribute('aria-modal', 'true');
            if (!node.getAttribute('aria-label')) {
                node.setAttribute('aria-label', text(node.querySelector('strong')?.textContent || 'Social dialog'));
            }
        });
        host.querySelectorAll('button').forEach((button) => {
            const visibleLabel = text(button.textContent || '');
            if (visibleLabel || button.getAttribute('aria-label')) return;
            const action = text(button.getAttribute('data-action') || 'Action').replace(/[-_]+/g, ' ');
            button.setAttribute('aria-label', action);
        });
    }

    function applyShellIdentity(force = false) {
        const signature = shellIdentitySignature();
        if (!force && signature === lastShellSignature) return;
        lastShellSignature = signature;
        const user = currentUser();
        const role = text(user?.role || localStorage.getItem('currentUserRole') || 'student');
        document.body.classList.remove('role-student', 'role-professor', 'role-ta', 'role-admin', 'role-student_service');
        document.body.classList.add(`role-${role}`);

        const faculty = currentFacultyCode();
        document.body.dataset.faculty = faculty;
        document.documentElement.dataset.faculty = faculty;

        try {
            if (typeof switchFacultyTheme === 'function') {
                switchFacultyTheme(faculty, { refreshDependentViews: false });
            }
        } catch (error) {
            console.warn('[Social] Shell identity sync skipped.', error);
        }
    }

    function revealShell() {
        document.getElementById('social-loading-placeholder')?.remove();
        const socialRoot = root();
        if (socialRoot) socialRoot.style.display = 'block';
        document.documentElement.classList.remove('kiu-shell-loading');
        document.body?.classList.remove('kiu-shell-loading');
        const appContent = document.getElementById('app-content');
        if (appContent) appContent.style.opacity = '1';
    }

    function queueDirectoryRefresh() {
        if (directoryRefreshTimer) window.clearTimeout(directoryRefreshTimer);
        directoryRefreshTimer = window.setTimeout(() => {
            if (typeof loadPortalSocialDirectory !== 'function') return;
            loadPortalSocialDirectory(true).catch((error) => {
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Directory could not be refreshed.', 'danger');
            });
        }, DIRECTORY_REFRESH_MS);
    }

    function bindFileInputs() {
        const host = root();
        if (!host) return;
        const postInput = host.querySelector('input[name="postFile"]');
        if (postInput) postInput.value = '';
        const pagePostInput = host.querySelector('input[name="pagePostFile"]');
        if (pagePostInput) pagePostInput.value = '';
        const messageInput = host.querySelector('input[name="messageFile"]');
        if (messageInput) messageInput.value = '';
        const storyInput = host.querySelector('input[name="storyFile"]');
        if (storyInput) storyInput.value = '';
        const coverInput = host.querySelector('input[name="coverImageFile"]');
        if (coverInput) coverInput.value = '';
        const pageAvatarInput = host.querySelector('input[name="pageAvatarFile"]');
        if (pageAvatarInput) pageAvatarInput.value = '';
        const pageCoverInput = host.querySelector('input[name="pageCoverFile"]');
        if (pageCoverInput) pageCoverInput.value = '';
    }

    function filePreview(file) {
        if (!file) return '';
        if (isImage(file)) {
            const src = fileUrl(file);
            if (src) {
                return `
                    <div class="social-neo-media">
                        <img src="${escape(src)}" alt="${escape(text(file.name || 'Image'))}">
                    </div>
                `;
            }
        }
        const href = fileUrl(file);
        return `
            <div class="social-neo-file">
                <i class="fas fa-paperclip"></i>
                <div>
                    <strong>${escape(text(file.name || 'Attachment'))}</strong>
                    <span>${escape(text(file.type || 'File'))}</span>
                </div>
                ${href ? `<a class="social-neo-link-btn" href="${escape(href)}" target="_blank" rel="noopener">Open</a>` : ''}
            </div>
        `;
    }

    function renderFileChip(file, label = 'Attachment ready') {
        if (!file) return '';
        return `
            <div class="social-neo-draft-file">
                <i class="fas fa-paperclip"></i>
                <span>${escape(text(file.name || label))}</span>
            </div>
        `;
    }

    function renderPost(post) {
        const author = accountById(post.authorUserId) || { id: post.authorUserId, displayName: post.authorUserId };
        const reactionCounts = post?.reactionCounts || {};
        const viewerReaction = text(post.viewerReaction || '');
        const hasViewerReaction = Boolean(viewerReaction);
        const reactionCount = Object.values(reactionCounts).reduce((sum, count) => sum + Number(count || 0), 0);
        const sharedPost = post.sharedPost;
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const runtime = state();
        const normalizedPostId = postKey(post);
        const commentDraft = String(runtime.ui?.commentDraftByPost?.[normalizedPostId] || '');
        const replyTarget = runtime.ui?.commentReplyTargetByPost?.[normalizedPostId] || null;
        const commentInputId = controlId('commentBody', normalizedPostId);
        const shareCount = Number(post?.shareCount || 0);
        const saved = isPostSaved(post.id);
        const scopeBadge = post.scopeType === 'page'
            ? `Page - ${text(post.scopeName || 'Page')}`
            : post.scopeType === 'group'
                ? `Group - ${text(post.scopeName || 'Group')}`
                : 'Profile';
        const pagePostLabel = post.scopeType === 'page' ? pagePostTypeLabel(post) : '';
        const contextLine = `${accountSubtitle(author)} - ${feedReason(post, author)}`;
        const replyLabel = text(replyTarget?.authorName || 'member');
        const commentPlaceholder = replyTarget ? `Reply to @${replyLabel}...` : 'Write a comment...';
        const commentSubmitLabel = replyTarget ? 'Reply' : 'Comment';
        const commentTotal = comments.length + Number(post.replyCount || 0);
        return `
            <article class="social-neo-card social-neo-post-card ${post.isPinned ? 'is-pinned' : ''}">
                <div class="social-neo-post-head">
                    <button class="social-neo-post-author social-neo-clickable" type="button" data-action="profile-view" data-user-id="${escape(text(author.id))}">
                        ${avatar(author)}
                        <div class="social-neo-post-author-copy">
                            <strong class="social-neo-post-author-name">${escape(displayName(author))}</strong>
                            <span class="social-neo-post-author-meta">${escape(contextLine)} - ${escape(when(post.createdAt))}</span>
                        </div>
                    </button>
                    <div class="social-neo-inline social-neo-inline-gap-4 social-neo-inline-post-actions-head social-neo-post-head-actions">
                        <span class="social-neo-pill social-neo-post-scope-badge">${escape(scopeBadge)}</span>
                        ${pagePostLabel ? `<span class="social-neo-pill social-neo-post-page-label">${escape(pagePostLabel)}</span>` : ''}
                        ${post.isPinned ? `<span class="social-neo-pill social-neo-pill-pinned social-neo-post-pinned-pill"><i class="fas fa-thumbtack"></i> Pinned</span>` : ''}
                        ${post.viewerCanManageScope ? `<button class="social-neo-btn social-neo-btn-sm social-neo-btn-ghost social-neo-post-head-action-btn" type="button" data-action="post-pin" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-thumbtack"></i> ${post.isPinned ? 'Unpin' : 'Pin'}</button>` : ''}
                        ${post.viewerCanEdit ? `<button class="social-neo-btn social-neo-btn-sm social-neo-btn-ghost social-neo-post-head-action-btn" type="button" data-action="post-edit" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-pen"></i></button>` : ''}
                        ${post.viewerCanEdit ? `<button class="social-neo-btn social-neo-btn-sm social-neo-btn-ghost social-neo-post-head-action-btn" type="button" data-action="post-delete" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-trash-alt"></i></button>` : ''}
                        <button class="social-neo-btn social-neo-btn-sm social-neo-btn-ghost social-neo-post-head-action-btn" type="button" data-action="post-report" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-ellipsis-h"></i></button>
                    </div>
                </div>
                <div class="social-neo-post-body">${escape(post.body || post.text || '') || '<span class="social-neo-muted">Shared without extra text.</span>'}</div>
                ${(Array.isArray(post.media) ? post.media : []).map((media) => filePreview(media)).join('')}
                ${sharedPost ? `
                    <div class="social-neo-shared">
                        <span class="social-neo-pill">Shared post</span>
                        <strong>${escape(displayName(sharedPost.authorUserId))}</strong>
                        <p>${escape(sharedPost.body || sharedPost.text || 'Original post')}</p>
                    </div>
                ` : ''}
                <div class="social-neo-inline-metrics social-neo-post-metrics">
                    ${renderPostReactionMetrics(reactionCounts)}
                    ${commentTotal ? `<span class="social-neo-post-metric">${escape(commentTotal)} repl${commentTotal === 1 ? 'y' : 'ies'}</span>` : ''}
                    ${shareCount > 0 ? `<span class="social-neo-post-metric">${escape(shareCount)} share${shareCount !== 1 ? 's' : ''}</span>` : ''}
                </div>
                <div class="social-neo-post-actions social-neo-post-action-row">
                    <button class="social-neo-btn social-neo-post-action-btn ${hasViewerReaction ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="post-react" data-post-id="${escape(normalizedPostId)}" data-reaction-type="${escape(viewerReaction || 'like')}">
                        ${hasViewerReaction
                            ? `<span>${reactionEmoji(viewerReaction)}</span> ${escape(reactionLabel(viewerReaction))}`
                            : '<i class="fas fa-thumbs-up"></i> Like'}
                    </button>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-post-action-btn" type="button" data-action="post-focus-comment" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-comment"></i> Comment${post.replyCount ? ` (${escape(text(post.replyCount))})` : ''}
                    </button>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-post-action-btn" type="button" data-action="post-share" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <div class="social-neo-reaction-picker">
                        ${['like', 'love', 'laugh', 'wow', 'support'].map((reactionType) => `
                            <button class="social-neo-btn social-neo-btn-sm social-neo-post-reaction-btn ${post.viewerReaction === reactionType ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="post-react" data-post-id="${escape(normalizedPostId)}" data-reaction-type="${escape(reactionType)}" title="${escape(reactionType)}">
                                <span>${reactionEmoji(reactionType)}</span>
                            </button>
                        `).join('')}
                    </div>
                    <span class="social-neo-flex-spacer"></span>
                    <button class="social-neo-btn social-neo-post-save-btn ${saved ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="post-save" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-bookmark"></i> ${saved ? 'Saved' : 'Save'}
                    </button>
                </div>
                ${renderCommentThread(comments, post)}
                <form class="social-neo-comment-compose" data-form="comment" data-post-id="${escape(normalizedPostId)}">
                    ${avatar(currentUser(), 'social-neo-avatar-sm')}
                    <div class="social-neo-comment-compose-main">
                        ${replyTarget ? `
                            <div class="social-neo-inline social-neo-reply-target">
                                <span class="social-neo-label social-neo-reply-target-label">Replying to @${escape(replyLabel)}</span>
                                <button class="social-neo-link-btn" type="button" data-action="comment-reply-cancel" data-post-id="${escape(normalizedPostId)}">Cancel</button>
                            </div>
                        ` : ''}
                        <div class="social-neo-inline social-neo-comment-compose-row">
                            <input class="social-neo-input" id="${escape(commentInputId)}" type="text" name="commentBody" placeholder="${escape(commentPlaceholder)}" aria-label="${escape(commentPlaceholder)}" value="${escape(commentDraft)}">
                            <button class="social-neo-btn social-neo-btn-primary" type="submit">${commentSubmitLabel}</button>
                        </div>
                    </div>
                </form>
            </article>
        `;
    }

    function renderFeedPanel() {
        const runtime = state();
        const currentScopeType = text(runtime.ui?.activeScopeType || 'profile') || 'profile';
        const currentScopeId = text(runtime.ui?.activeScopeId || currentUserId()) || currentUserId();
        const profileSettings = currentSocialProfileSettings();
        const currentAudience = text(runtime.ui?.composerAudience || profileSettings.defaultAudience || 'campus') || 'campus';
        const scopeOptions = postingScopeOptions();
        const focusOptions = feedScopeOptions();
        const feed = Array.isArray(runtime.feed) ? runtime.feed : [];
        const homeFilter = text(runtime.ui?.homeFeedFilter || 'all') || 'all';
        const visibleFeed = filterFeedForHome(feed, homeFilter);
        const composerScopeId = controlId('composerScope');
        const composerAudienceId = controlId('composerAudience');
        const feedScopeId = controlId('feedScope');
        const composerTextId = controlId('composerText');
        const composerFileId = controlId('postFile');
        const storyAuthors = [];
        const seenIds = {};
        for (let i = 0; i < visibleFeed.length && storyAuthors.length < 12; i++) {
            const aid = text(visibleFeed[i].authorUserId);
            if (!seenIds[aid] && aid !== currentUserId()) {
                seenIds[aid] = true;
                storyAuthors.push(accountById(aid) || { id: aid, displayName: aid, role: 'student' });
            }
        }
        const hasOwnStory = storyAuthors.find((a) => a.id === currentUserId());
        const homeFilterMeta = {
            all: 'Showing the full campus stream.',
            following: 'Prioritising people, pages, and groups you follow.',
            groups: 'Only posts published inside groups.',
            pages: 'Only page posts and official updates.',
            campus: 'Campus-wide posts with open visibility.'
        };
        const storiesStrip = `
            <section class="social-neo-card social-neo-story-card social-neo-story-card-compact social-neo-feed-story-card">
                <div class="social-neo-stories social-neo-feed-story-strip">
                    ${!hasOwnStory ? `
                        <div class="social-neo-story social-neo-feed-story-item" data-action="story-add">
                            <div class="social-neo-story-ring social-neo-feed-story-ring">
                                ${avatar({ id: currentUserId(), displayName: 'You', avatar: currentUser()?.avatar })}
                            </div>
                            <span class="social-neo-feed-story-label">Your Story</span>
                        </div>
                    ` : ''}
                    ${storyAuthors.map((a) => `
                        <div class="social-neo-story social-neo-feed-story-item" data-action="story-view" data-user-id="${escape(text(a.id))}">
                            <div class="social-neo-story-ring social-neo-feed-story-ring">
                                ${avatar(a)}
                            </div>
                            <span class="social-neo-feed-story-label">${escape(displayName(a).split(' ')[0])}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;

        return `
            ${storiesStrip}
            <section class="social-neo-card social-neo-composer-card">
                <div class="social-neo-person social-neo-composer-person">
                    ${avatar(currentUser())}
                    <textarea class="social-neo-textarea social-neo-composer-textarea" id="${escape(composerTextId)}" name="composerText" rows="2" placeholder="What's on your mind, ${escape(displayName(currentUser()).split(' ')[0])}?" data-bind="composer-text">${escape(text(runtime.ui?.composerText || ''))}</textarea>
                </div>
                <div class="social-neo-composer-row">
                    <div class="social-neo-scope-field social-neo-composer-scope-field">
                        <span class="social-neo-label social-neo-composer-scope-label">Posting as</span>
                        <select class="social-neo-select social-neo-composer-scope-select" id="${escape(composerScopeId)}" name="composerScope" data-bind="composer-scope">
                            ${scopeOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${currentScopeType === option.type && currentScopeId === option.id ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="social-neo-scope-field social-neo-composer-audience-field">
                        <span class="social-neo-label social-neo-composer-audience-label">Audience</span>
                        <select class="social-neo-select social-neo-composer-audience-select" id="${escape(composerAudienceId)}" name="composerAudience" data-bind="composer-audience">
                            <option value="campus" ${currentAudience === 'campus' ? 'selected' : ''}>Campus</option>
                            <option value="faculty" ${currentAudience === 'faculty' ? 'selected' : ''}>Faculty</option>
                            <option value="connections" ${currentAudience === 'connections' ? 'selected' : ''}>Connections</option>
                            <option value="group" ${currentAudience === 'group' ? 'selected' : ''}>Group members</option>
                            <option value="page" ${currentAudience === 'page' ? 'selected' : ''}>Page followers</option>
                        </select>
                    </div>
                </div>
                ${renderFileChip(runtime.ui?.composerFile)}
                <div class="social-neo-post-actions social-neo-composer-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-composer-attach-btn" type="button" data-action="composer-attach"><i class="fas fa-image social-neo-action-icon-photo"></i> Photo</button>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-composer-story-btn" type="button" data-action="story-add"><i class="fas fa-circle-plus social-neo-action-icon-story"></i> Story</button>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-composer-event-btn" type="button" data-action="panel-events" data-events-tab="student"><i class="fas fa-calendar-plus social-neo-action-icon-event"></i> Event</button>
                    <span class="social-neo-flex-spacer"></span>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-composer-submit-btn" type="button" data-action="post-submit">
                        <i class="fas fa-paper-plane"></i> Publish
                    </button>
                </div>
                <input id="${escape(composerFileId)}" name="postFile" type="file" hidden>
            </section>
            <section class="social-neo-card social-neo-filter-card social-neo-feed-filter-card">
                <div class="social-neo-section-head social-neo-feed-filter-head">
                    <div class="social-neo-feed-filter-copy">
                        <strong class="social-neo-feed-filter-title">Feed</strong>
                        <span class="social-neo-feed-filter-description">${escape(homeFilterMeta[homeFilter] || homeFilterMeta.all)}</span>
                    </div>
                    <button class="social-neo-link-btn social-neo-feed-filter-refresh" type="button" data-action="feed-refresh"><i class="fas fa-arrows-rotate"></i> Refresh</button>
                </div>
                <div class="social-neo-scope-field social-neo-feed-filter-scope-field">
                    <select class="social-neo-select social-neo-feed-filter-scope-select" id="${escape(feedScopeId)}" name="feedScope" data-bind="feed-scope">
                        ${focusOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${text(runtime.ui?.feedScopeType) === option.type && text(runtime.ui?.feedScopeId) === option.id ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="social-neo-stat-grid social-neo-feed-filter-stats">
                    <div class="social-neo-feed-filter-stat"><strong class="social-neo-feed-filter-stat-value">${escape(visibleFeed.length)}</strong><span class="social-neo-feed-filter-stat-label">Posts</span></div>
                    <div class="social-neo-feed-filter-stat"><strong class="social-neo-feed-filter-stat-value">${escape((Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length)}</strong><span class="social-neo-feed-filter-stat-label">Groups</span></div>
                    <div class="social-neo-feed-filter-stat"><strong class="social-neo-feed-filter-stat-value">${escape((Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter((page) => page?.isFollowing || isManagedPage(page)).length)}</strong><span class="social-neo-feed-filter-stat-label">Pages</span></div>
                </div>
            </section>
            <section class="social-neo-stack">
                ${visibleFeed.length
                    ? visibleFeed.map((post) => renderPost(post)).join('')
                    : `<div class="social-neo-empty">No posts match the current Home filter yet.</div>`}
            </section>
        `;
    }

    function renderRelationshipActions(account) {
        const status = connectionStatusFor(account?.id);
        if (status.state === 'connected') {
            return `
                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                    Message
                </button>
                <span class="social-neo-pill">Friends</span>
            `;
        }
        if (status.state === 'incoming') {
            return `
                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                    Message
                </button>
                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="connection-accept" data-relationship-id="${escape(text(status.relationship?.id))}">
                    Accept friend
                </button>
                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="connection-decline" data-relationship-id="${escape(text(status.relationship?.id))}">
                    Decline
                </button>
            `;
        }
        if (status.state === 'outgoing') {
            return `
                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                    Message
                </button>
                <span class="social-neo-pill">Friend request sent</span>
                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="connection-cancel" data-user-id="${escape(text(account.id))}">
                    Cancel request
                </button>
            `;
        }
        return `
            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="directory-message" data-user-id="${escape(text(account.id))}">
                Message
            </button>
            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="connection-send" data-user-id="${escape(text(account.id))}">
                Add friend
            </button>
        `;
    }

    function renderCommunityPanel() {
        if (hasSocialCommunityModule()) {
            return window.renderCommunityPanel();
        }
        ensureSocialCommunityModule().then(() => queueDeferredModuleRender('community-module')).catch(() => null);
        return `
            <div class="social-neo-stack social-neo-community-layout">
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong><i class="fas fa-user-friends social-neo-section-accent-icon is-purple"></i> Community overview</strong><span>People suggestions, verified staff, and shared-context shortcuts in one place.</span></div>
                    </div>
                    <div class="social-neo-stat-grid">
                        <div><strong>...</strong><span>Profiles</span></div>
                        <div><strong>...</strong><span>Suggested</span></div>
                        <div><strong>...</strong><span>Requests</span></div>
                        <div><strong>...</strong><span>Connections</span></div>
                    </div>
                </section>
                <section class="social-neo-card social-neo-community-panel social-neo-community-panel--directory">
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-user-friends"></i>
                        <strong>Loading Community</strong>
                        <span>Preparing people discovery, requests, and staff shortcuts.</span>
                    </div>
                </section>
            </div>
        `;
    }

    function renderCommunityPanelLegacyContext(account) {
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

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       GROUPS PANEL - Facebook-style group discovery & management
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function renderProjectsWorkspacePanelLegacy() {
        const runtime = state();
        const social = runtime.social || {};
        const projects = Array.isArray(social.projects) ? social.projects : [];
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const activeProjectId = text(runtime.ui?.activeProjectId || '');
        const activeProject = projects.find((project) => text(project?.id) === activeProjectId) || null;
        const activeTab = text(runtime.ui?.projectTab || 'overview') || 'overview';
        const facultyOptions = uniqueStrings([
            currentFacultyCode(),
            ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : []),
            ...directory.map((account) => text(account?.facultyCode || account?.faculty))
        ]).filter(Boolean);
        const projectFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()];
        const roleLabels = {
            owner: 'Owner',
            member: 'Member',
            advisor: 'Advisor',
            'instructor-viewer': 'Instructor viewer'
        };
        const taskColumns = [
            { id: 'backlog', label: 'Backlog' },
            { id: 'todo', label: 'To Do' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'blocked', label: 'Blocked' },
            { id: 'done', label: 'Done' }
        ];
        const advisorCandidates = directory.filter((account) => isStaffAccount(account) || ['professor', 'ta', 'admin'].includes(text(account?.role || '').toLowerCase()));
        const projectInviteSelectedIds = Array.isArray(runtime.ui?.projectInviteSelectedIds) ? runtime.ui.projectInviteSelectedIds : [];
        const inviteSearch = text(runtime.ui?.projectInviteSearch || '').toLowerCase();
        const inviteFaculty = text(runtime.ui?.projectInviteFaculty || 'all') || 'all';
        const selectedProjectMemberIds = uniqueStrings([
            ...(Array.isArray(activeProject?.memberIds) ? activeProject.memberIds : []),
            ...(Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : []),
            text(activeProject?.advisorUserId || ''),
            ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])
        ]);

        const filteredInviteCandidates = directory
            .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
            .filter((account) => !projectInviteSelectedIds.includes(text(account.id)))
            .filter((account) => !selectedProjectMemberIds.includes(text(account.id)))
            .filter((account) => inviteFaculty === 'all' || text(account?.facultyCode || account?.faculty) === inviteFaculty)
            .filter((account) => {
                if (!inviteSearch) return true;
                const blob = `${displayName(account)} ${accountSubtitle(account)} ${text(account?.facultyCode || account?.faculty)} ${Array.isArray(account?.interests) ? account.interests.join(' ') : ''}`.toLowerCase();
                return blob.includes(inviteSearch);
            })
            .slice(0, 18);

        const myProjects = projects.filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase()));
        const featuredProjects = [...projects]
            .sort((left, right) => (right?.activityCount || 0) - (left?.activityCount || 0))
            .slice(0, 6);

        const projectRolePill = (role) => `<span class="social-neo-pill">${escape(roleLabels[text(role).toLowerCase()] || roleLabel(role || 'member'))}</span>`;
        const facultyPills = (codes = []) => (Array.isArray(codes) ? codes : []).map((code) => `<span class="social-neo-pill">${escape(code)}</span>`).join('');
        const skillPills = (skills = []) => (Array.isArray(skills) ? skills : []).map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('');
        const scrollList = (modifier, content) => `<div class="social-project-scroll-list${modifier ? ` ${modifier}` : ''}">${content}</div>`;

        const renderProjectCard = (project) => {
            const owner = accountById(project?.ownerUserId) || { id: project?.ownerUserId };
            const advisors = uniqueStrings([text(project?.advisorUserId || ''), ...(Array.isArray(project?.instructorViewerIds) ? project.instructorViewerIds : [])])
                .map((userId) => accountById(userId) || { id: userId })
                .filter((account) => text(account?.id));
            return `
                <article class="social-neo-card social-project-card">
                    <div class="social-project-card-head">
                        <div>
                            <div class="social-neo-badge-row">
                                <span class="social-neo-pill"><strong>${escape(project?.status || 'idea')}</strong><span>Status</span></span>
                                <span class="social-neo-pill"><strong>${escape(project?.memberCount || 0)}</strong><span>Members</span></span>
                                <span class="social-neo-pill"><strong>${escape(project?.taskCount || 0)}</strong><span>Tasks</span></span>
                            </div>
                            <h3>${escape(text(project?.name || 'Project workspace'))}</h3>
                            <p>${escape(text(project?.summary || project?.description || 'Structured team workspace.'))}</p>
                        </div>
                        <div class="social-neo-inline social-neo-inline-end-gap-8-wrap social-neo-inline-items-start">
                            ${projectRolePill(project?.role || 'member')}
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                                <i class="fas fa-arrow-right"></i> Open workspace
                            </button>
                        </div>
                    </div>
                    <div class="social-neo-inline social-neo-inline-between-gap-12-wrap">
                        <div class="social-neo-person social-neo-person-gap-10">
                            ${avatar(owner, 'social-neo-avatar-sm')}
                            <div>
                                <strong>${escape(displayName(owner))}</strong>
                                <small class="social-neo-muted">Owner</small>
                            </div>
                        </div>
                        <div class="social-neo-badge-row">
                            ${facultyPills(project?.facultyCodes)}
                            ${text(project?.courseTag) ? `<span class="social-neo-pill">${escape(project.courseTag)}</span>` : ''}
                        </div>
                    </div>
                    ${(project?.skillTags || []).length || advisors.length ? `
                        <div class="social-neo-inline social-neo-inline-between-gap-12-wrap social-neo-inline-mt-12">
                            <div class="social-neo-badge-row">${skillPills(project?.skillTags)}</div>
                            ${advisors.length ? `<div class="social-neo-badge-row">${advisors.map((account) => `<span class="social-neo-pill">${escape(displayName(account))}</span>`).join('')}</div>` : ''}
                        </div>
                    ` : ''}
                </article>
            `;
        };

        const renderTeamMemberCard = (userId, role, { pending = false } = {}) => {
            const account = accountById(userId) || { id: userId };
            const canManage = Boolean(activeProject?.isManager);
            return `
                <article class="social-neo-card social-project-team-card">
                    <div class="social-neo-inline social-neo-inline-between-start-wrap">
                        <div class="social-neo-person social-neo-person-start-gap-12">
                            ${avatar(account)}
                            <div>
                                <strong>${escape(displayName(account))}</strong>
                                <div class="social-neo-muted">${escape(accountSubtitle(account))}</div>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                    ${projectRolePill(role)}
                                    <span class="social-neo-pill">${escape(text(account?.facultyCode || account?.faculty || 'Faculty not set'))}</span>
                                    ${pending ? `<span class="social-neo-pill">Invited</span>` : ''}
                                    <span class="social-neo-pill">${escape(text(account?.presenceLabel || 'Offline'))}</span>
                                </div>
                            </div>
                        </div>
                        ${canManage && text(userId) !== text(activeProject?.ownerUserId || '') ? `
                            <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                                ${role !== 'member' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-role" data-project-id="${escape(text(activeProject?.id))}" data-user-id="${escape(text(userId))}" data-role="member">Make member</button>` : ''}
                                ${role !== 'advisor' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-role" data-project-id="${escape(text(activeProject?.id))}" data-user-id="${escape(text(userId))}" data-role="advisor">Make advisor</button>` : ''}
                                ${role !== 'instructor-viewer' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-role" data-project-id="${escape(text(activeProject?.id))}" data-user-id="${escape(text(userId))}" data-role="instructor-viewer">Viewer</button>` : ''}
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-remove" data-project-id="${escape(text(activeProject?.id))}" data-user-id="${escape(text(userId))}">
                                    Remove
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        };

        if (!activeProject) {
            return `
                <div class="social-neo-stack social-projects-shell">
                    <section class="social-neo-card social-projects-hero">
                        <div class="social-projects-hero-copy">
                            <div class="social-neo-badge-row">
                                <span class="social-neo-pill"><strong>${escape(projects.length)}</strong><span>Workspaces</span></span>
                                <span class="social-neo-pill"><strong>${escape(myProjects.length)}</strong><span>Your role</span></span>
                                <span class="social-neo-pill"><strong>4+</strong><span>Recommended team size</span></span>
                            </div>
                            <h2>Project Workspaces</h2>
                            <p>Structured student and faculty project hubs with team roles, task boards, milestones, deliverables, meetings, and a reusable project chat.</p>
                        </div>
                    </section>
                    <section class="social-neo-card social-project-create-card">
                        <div class="social-neo-section-head">
                            <div><strong>Create a project workspace</strong><span>Private by default, built for 4+ member teams, and ready for cross-faculty collaboration.</span></div>
                        </div>
                        <form data-form="create-project" class="social-neo-stack">
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Project title</span><input class="social-neo-input" type="text" name="projectName" value="${escape(text(runtime.ui?.projectName || ''))}" placeholder="Smart irrigation prototype"></label>
                                <label><span class="social-neo-label">Course / module</span><input class="social-neo-input" type="text" name="projectCourseTag" value="${escape(text(runtime.ui?.projectCourseTag || ''))}" placeholder="CS401 Capstone"></label>
                            </div>
                            <label><span class="social-neo-label">One-line summary</span><input class="social-neo-input" type="text" name="projectSummary" value="${escape(text(runtime.ui?.projectSummary || ''))}" placeholder="Cross-faculty automation project for greenhouse monitoring"></label>
                            <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" name="projectDescription" rows="4" placeholder="What is the project, what problem are you solving, and what will the team deliver?">${escape(text(runtime.ui?.projectDescription || ''))}</textarea></label>
                            <div class="social-neo-grid-3">
                                <label><span class="social-neo-label">Status</span><select class="social-neo-select" name="projectStatus">
                                    ${['idea','active','review','completed'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'idea') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                </select></label>
                                <label><span class="social-neo-label">Visibility</span><select class="social-neo-select" name="projectVisibility">
                                    ${['private','faculty','public'].map((visibility) => `<option value="${escape(visibility)}" ${text(runtime.ui?.projectVisibility || 'private') === visibility ? 'selected' : ''}>${escape(visibility)}</option>`).join('')}
                                </select></label>
                                <label><span class="social-neo-label">Advisor</span><select class="social-neo-select" name="projectAdvisorUserId">
                                    <option value="">No advisor yet</option>
                                    ${advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(runtime.ui?.projectAdvisorUserId || '') === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}
                                </select></label>
                            </div>
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Recommended team size</span><input class="social-neo-input" type="number" min="2" name="projectRecommendedTeamSize" value="${escape(text(runtime.ui?.projectRecommendedTeamSize || 4))}"></label>
                                <label><span class="social-neo-label">Minimum team size</span><input class="social-neo-input" type="number" min="2" name="projectMinTeamSize" value="${escape(text(runtime.ui?.projectMinTeamSize || 4))}"></label>
                            </div>
                            <label><span class="social-neo-label">Skills / roles</span><input class="social-neo-input" type="text" name="projectSkillTags" value="${escape(text(runtime.ui?.projectSkillTags || ''))}" placeholder="developer, designer, researcher, analyst"></label>
                            <div>
                                <span class="social-neo-label">Faculties involved</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                    ${facultyOptions.map((facultyCode) => `
                                        <button class="social-neo-btn ${projectFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>
                                    `).join('')}
                                </div>
                            </div>
                            <section class="social-neo-card social-neo-card-pad-16">
                                <div class="social-neo-section-head">
                                    <div><strong>Invite teammates</strong><span>Search people, filter by faculty, and build the initial 4+ member team.</span></div>
                                    <span class="social-neo-pill"><strong>${escape(projectInviteSelectedIds.length)}</strong><span>Selected</span></span>
                                </div>
                                <div class="social-neo-directory-filters">
                                    <input class="social-neo-input" type="search" name="projectInviteSearch" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}" placeholder="Search people by name, faculty, role, or interests">
                                    <select class="social-neo-select" name="projectInviteFaculty">
                                        <option value="all" ${inviteFaculty === 'all' ? 'selected' : ''}>All faculties</option>
                                        ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${inviteFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode)}</option>`).join('')}
                                    </select>
                                </div>
                                ${projectInviteSelectedIds.length ? `
                                    <div class="social-neo-badge-row social-neo-badge-row-10-14">
                                        ${projectInviteSelectedIds.map((userId) => {
                                            const account = accountById(userId) || { id: userId };
                                            return `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-selected-remove" data-user-id="${escape(text(userId))}">${escape(displayName(account))} <i class="fas fa-times"></i></button>`;
                                        }).join('')}
                                    </div>
                                ` : ''}
                                <div class="social-neo-stack">
                                    ${filteredInviteCandidates.length ? filteredInviteCandidates.map((account) => `
                                        <div class="social-neo-card social-neo-card-pad-12">
                                            <div class="social-neo-inline social-neo-inline-between-start-wrap">
                                                <div class="social-neo-person social-neo-person-start-gap-10">
                                                    ${avatar(account, 'social-neo-avatar-sm')}
                                                    <div>
                                                        <strong>${escape(displayName(account))}</strong>
                                                        <div class="social-neo-muted">${escape(accountSubtitle(account))}</div>
                                                        <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                                            <span class="social-neo-pill">${escape(text(account?.facultyCode || account?.faculty || 'Faculty not set'))}</span>
                                                            ${Array.isArray(account?.interests) ? account.interests.slice(0, 2).map((interest) => `<span class="social-neo-pill">${escape(interest)}</span>`).join('') : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-selected-add" data-user-id="${escape(text(account.id))}">
                                                    <i class="fas fa-user-plus"></i> Add
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : `<div class="social-neo-empty">No people matched the current team search.</div>`}
                                </div>
                            </section>
                            <div class="social-neo-inline social-neo-inline-end-gap-10-wrap">
                                <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-diagram-project"></i> Create workspace</button>
                            </div>
                        </form>
                    </section>
                    <section class="social-neo-card">
                        <div class="social-neo-section-head">
                            <div><strong>Your workspaces</strong><span>Projects you own, contribute to, advise, or review.</span></div>
                            <span class="social-neo-pill"><strong>${escape(myProjects.length)}</strong><span>Visible to you</span></span>
                        </div>
                        <div class="social-neo-stack">
                            ${myProjects.length ? myProjects.map(renderProjectCard).join('') : `<div class="social-neo-empty">No project workspaces yet. Create the first one to structure a real team workflow.</div>`}
                        </div>
                    </section>
                    <section class="social-neo-card">
                        <div class="social-neo-section-head">
                            <div><strong>Featured visible workspaces</strong><span>High-activity project hubs already moving.</span></div>
                        </div>
                        <div class="social-neo-grid-2 social-neo-grid-tight">
                            ${featuredProjects.length ? featuredProjects.map(renderProjectCard).join('') : `<div class="social-neo-empty">No visible project workspaces yet.</div>`}
                        </div>
                    </section>
                </div>
            `;
        }

        const owner = accountById(activeProject.ownerUserId) || { id: activeProject.ownerUserId };
        const projectTeamIds = uniqueStrings([
            ...(Array.isArray(activeProject.memberIds) ? activeProject.memberIds : []),
            ...(Array.isArray(activeProject.pendingMemberIds) ? activeProject.pendingMemberIds : [])
        ]);
        const projectTasks = Array.isArray(activeProject.tasks) ? activeProject.tasks : [];
        const projectMilestones = Array.isArray(activeProject.milestones) ? activeProject.milestones : [];
        const projectDeliverables = Array.isArray(activeProject.deliverables) ? activeProject.deliverables : [];
        const projectCheckins = Array.isArray(activeProject.checkins) ? activeProject.checkins : [];
        const projectMeetings = Array.isArray(activeProject.meetings) ? activeProject.meetings : [];
        const projectActivity = Array.isArray(activeProject.activity) ? activeProject.activity : [];
        const pendingTeamIds = Array.isArray(activeProject.pendingMemberIds) ? activeProject.pendingMemberIds : [];

        const tabMarkup = activeTab === 'overview'
            ? `
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong>Workspace overview</strong><span>Project summary, faculties, scope, and advisor context.</span></div>
                    </div>
                    <div class="social-neo-grid-2">
                        <div class="social-neo-stack">
                            <div class="social-neo-card social-neo-card-pad-16">
                                <span class="social-neo-label">Summary</span>
                                <p class="social-project-body-copy social-neo-copy social-neo-copy-mt-8">${escape(text(activeProject.summary || activeProject.description || 'No summary yet.'))}</p>
                            </div>
                            <div class="social-neo-card social-neo-card-pad-16">
                                <span class="social-neo-label">Faculties and skills</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">${facultyPills(activeProject.facultyCodes)} ${skillPills(activeProject.skillTags)}</div>
                            </div>
                            <div class="social-neo-card social-neo-card-pad-16">
                                <span class="social-neo-label">Advisor oversight</span>
                                <div class="social-neo-stack social-neo-stack-mt-10">
                                    ${text(activeProject.advisorUserId) ? `<div class="social-neo-person social-neo-person-gap-10">${avatar(accountById(activeProject.advisorUserId) || { id: activeProject.advisorUserId }, 'social-neo-avatar-sm')}<div><strong>${escape(displayName(accountById(activeProject.advisorUserId) || { id: activeProject.advisorUserId }))}</strong><div class="social-neo-muted">Advisor</div></div></div>` : `<div class="social-neo-empty">No advisor assigned yet.</div>`}
                                    ${(activeProject.instructorViewerIds || []).length ? activeProject.instructorViewerIds.map((userId) => {
                                        const account = accountById(userId) || { id: userId };
                                        return `<div class="social-neo-person social-neo-person-gap-10">${avatar(account, 'social-neo-avatar-sm')}<div><strong>${escape(displayName(account))}</strong><div class="social-neo-muted">Instructor viewer</div></div></div>`;
                                    }).join('') : ''}
                                </div>
                            </div>
                        </div>
                        <div class="social-neo-stack">
                            <div class="social-neo-card social-neo-card-pad-16">
                                <span class="social-neo-label">Workspace stats</span>
                                <div class="social-neo-stat-grid social-neo-grid-mt-10">
                                    <div><strong>${escape(activeProject.memberCount || 0)}</strong><span>Members</span></div>
                                    <div><strong>${escape(activeProject.openTaskCount || 0)}</strong><span>Open tasks</span></div>
                                    <div><strong>${escape(activeProject.milestoneCount || 0)}</strong><span>Milestones</span></div>
                                    <div><strong>${escape(activeProject.deliverableCount || 0)}</strong><span>Deliverables</span></div>
                                </div>
                            </div>
                            ${activeProject.isManager ? `
                                <form data-form="project-settings" data-project-id="${escape(text(activeProject.id))}" class="social-neo-card social-neo-stack social-neo-card-pad-16">
                                    <div class="social-neo-section-head">
                                        <div><strong>Update workspace</strong><span>Adjust status, summary, advisor, and outcome framing.</span></div>
                                    </div>
                                    <label><span class="social-neo-label">Summary</span><input class="social-neo-input" type="text" name="projectSummary" value="${escape(text(activeProject.summary || ''))}"></label>
                                    <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="4" name="projectDescription">${escape(text(activeProject.description || ''))}</textarea></label>
                                    <div class="social-neo-grid-2">
                                        <label><span class="social-neo-label">Status</span><select class="social-neo-select" name="projectStatus">${['idea','active','review','completed'].map((status) => `<option value="${escape(status)}" ${text(activeProject.status) === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}</select></label>
                                        <label><span class="social-neo-label">Advisor</span><select class="social-neo-select" name="projectAdvisorUserId"><option value="">No advisor yet</option>${advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(activeProject.advisorUserId) === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}</select></label>
                                    </div>
                                    <label><span class="social-neo-label">Outcome / showcase summary</span><textarea class="social-neo-textarea" rows="3" name="projectShowcaseSummary">${escape(text(activeProject.showcaseSummary || ''))}</textarea></label>
                                    <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> Publish showcase</button>
                                        <button class="social-neo-btn social-neo-btn-primary" type="submit">Save overview</button>
                                    </div>
                                </form>
                            ` : ''}
                        </div>
                    </div>
                </section>
            `
            : activeTab === 'team'
                ? `
                    <section class="social-neo-card">
                        <div class="social-neo-section-head">
                            <div><strong>Team</strong><span>Roles, invites, faculty mix, and private project membership.</span></div>
                            <span class="social-neo-pill"><strong>${escape(activeProject.memberCount || 0)}</strong><span>Members</span></span>
                        </div>
                        <div class="social-neo-stack">
                            ${renderTeamMemberCard(activeProject.ownerUserId, 'owner')}
                            ${projectTeamIds.filter((userId) => text(userId) !== text(activeProject.ownerUserId)).map((userId) => renderTeamMemberCard(userId, text(activeProject.memberRolesByUser?.[userId] || 'member'), { pending: pendingTeamIds.includes(userId) })).join('') || `<div class="social-neo-empty">No additional team members yet.</div>`}
                            ${text(activeProject.advisorUserId) && !projectTeamIds.includes(text(activeProject.advisorUserId)) && text(activeProject.advisorUserId) !== text(activeProject.ownerUserId) ? renderTeamMemberCard(activeProject.advisorUserId, 'advisor') : ''}
                            ${(activeProject.instructorViewerIds || []).filter((userId) => !projectTeamIds.includes(text(userId)) && text(userId) !== text(activeProject.ownerUserId)).map((userId) => renderTeamMemberCard(userId, 'instructor-viewer')).join('')}
                        </div>
                    </section>
                    ${activeProject.isManager ? `
                        <section class="social-neo-card">
                            <div class="social-neo-section-head">
                                <div><strong>Invite more people</strong><span>Search by name or faculty and add members without breaking the existing group-backed chat.</span></div>
                            </div>
                            <div class="social-neo-directory-filters">
                                <input class="social-neo-input" type="search" name="projectInviteSearch" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}" placeholder="Search students, staff, and collaborators">
                                <select class="social-neo-select" name="projectInviteFaculty">
                                    <option value="all" ${inviteFaculty === 'all' ? 'selected' : ''}>All faculties</option>
                                    ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${inviteFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="social-neo-stack">
                                ${filteredInviteCandidates.length ? filteredInviteCandidates.map((account) => `
                                    <article class="social-neo-card social-neo-card-pad-12">
                                        <div class="social-neo-inline social-neo-inline-between-start-wrap">
                                            <div class="social-neo-person social-neo-person-start-gap-10">
                                                ${avatar(account, 'social-neo-avatar-sm')}
                                                <div>
                                                    <strong>${escape(displayName(account))}</strong>
                                                    <div class="social-neo-muted">${escape(accountSubtitle(account))}</div>
                                                    <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                                        <span class="social-neo-pill">${escape(text(account?.facultyCode || account?.faculty || 'Faculty not set'))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="member">Invite member</button>
                                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="advisor">Invite advisor</button>
                                            </div>
                                        </div>
                                    </article>
                                `).join('') : `<div class="social-neo-empty">No additional people matched the current filters.</div>`}
                            </div>
                        </section>
                    ` : ''}
                `
                : activeTab === 'tasks'
                    ? `
                        ${activeProject.viewerCanContribute ? `
                            <form data-form="project-task-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-card social-neo-stack">
                                <div class="social-neo-section-head">
                                    <div><strong>Add task</strong><span>Assign work, set due dates, and keep the board current.</span></div>
                                </div>
                                <div class="social-neo-grid-2">
                                    <label><span class="social-neo-label">Task title</span><input class="social-neo-input" type="text" name="projectTaskTitle" value="${escape(text(runtime.ui?.projectTaskTitle || ''))}" placeholder="Build sensor dashboard"></label>
                                    <label><span class="social-neo-label">Assignee</span><select class="social-neo-select" name="projectTaskAssigneeId"><option value="">Unassigned</option>${projectTeamIds.map((userId) => `<option value="${escape(text(userId))}" ${text(runtime.ui?.projectTaskAssigneeId || '') === text(userId) ? 'selected' : ''}>${escape(displayName(accountById(userId) || { id: userId }))}</option>`).join('')}</select></label>
                                </div>
                                <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="3" name="projectTaskDescription">${escape(text(runtime.ui?.projectTaskDescription || ''))}</textarea></label>
                                <div class="social-neo-grid-3">
                                    <label><span class="social-neo-label">Due</span><input class="social-neo-input" type="datetime-local" name="projectTaskDueAt" value="${escape(text(runtime.ui?.projectTaskDueAt || ''))}"></label>
                                    <label><span class="social-neo-label">Priority</span><select class="social-neo-select" name="projectTaskPriority">${['low','medium','high','urgent'].map((priority) => `<option value="${escape(priority)}" ${text(runtime.ui?.projectTaskPriority || 'medium') === priority ? 'selected' : ''}>${escape(priority)}</option>`).join('')}</select></label>
                                    <label><span class="social-neo-label">Status</span><select class="social-neo-select" name="projectTaskStatus">${taskColumns.map((column) => `<option value="${escape(column.id)}">${escape(column.label)}</option>`).join('')}</select></label>
                                </div>
                                <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Add task</button></div>
                            </form>
                        ` : ''}
                        <div class="social-project-task-board">
                            ${taskColumns.map((column, index) => `
                                <section class="social-neo-card social-project-task-column">
                                    <div class="social-neo-section-head">
                                        <div><strong>${escape(column.label)}</strong><span>${escape(projectTasks.filter((task) => text(task?.status || 'backlog') === column.id).length)} task(s)</span></div>
                                    </div>
                                    <div class="social-neo-stack">
                                        ${projectTasks.filter((task) => text(task?.status || 'backlog') === column.id).map((task) => `
                                            <article class="social-neo-card social-project-task-card">
                                                <div class="social-project-task-card-head">
                                                    <div>
                                                        <strong>${escape(text(task?.title || 'Task'))}</strong>
                                                        ${text(task?.description) ? `<p>${escape(text(task.description))}</p>` : ''}
                                                    </div>
                                                    <span class="social-neo-pill">${escape(text(task?.priority || 'medium'))}</span>
                                                </div>
                                                <div class="social-neo-badge-row social-neo-badge-row-mt-10">
                                                    ${text(task?.assigneeUserId) ? `<span class="social-neo-pill">${escape(displayName(accountById(task.assigneeUserId) || { id: task.assigneeUserId }))}</span>` : `<span class="social-neo-pill">Unassigned</span>`}
                                                    ${text(task?.dueAt) ? `<span class="social-neo-pill">${escape(when(task.dueAt))}</span>` : ''}
                                                </div>
                                                ${activeProject.viewerCanContribute ? `
                                                    <div class="social-project-task-actions">
                                                        <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                                                            ${index > 0 ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-move" data-project-id="${escape(text(activeProject.id))}" data-task-id="${escape(text(task.id))}" data-status="${escape(taskColumns[index - 1].id)}"><i class="fas fa-arrow-left"></i></button>` : ''}
                                                            ${index < taskColumns.length - 1 ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-move" data-project-id="${escape(text(activeProject.id))}" data-task-id="${escape(text(task.id))}" data-status="${escape(taskColumns[index + 1].id)}"><i class="fas fa-arrow-right"></i></button>` : ''}
                                                        </div>
                                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-delete" data-project-id="${escape(text(activeProject.id))}" data-task-id="${escape(text(task.id))}">Remove</button>
                                                    </div>
                                                ` : ''}
                                            </article>
                                        `).join('') || `<div class="social-neo-empty">No tasks in ${escape(column.label)}.</div>`}
                                    </div>
                                </section>
                            `).join('')}
                        </div>
                    `
                    : activeTab === 'milestones'
                        ? `
                            ${activeProject.viewerCanContribute ? `
                                <form data-form="project-milestone-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-card social-neo-stack">
                                    <div class="social-neo-section-head">
                                        <div><strong>Add milestone</strong><span>Track phases, deadlines, and review gates.</span></div>
                                    </div>
                                    <div class="social-neo-grid-2">
                                        <label><span class="social-neo-label">Title</span><input class="social-neo-input" type="text" name="projectMilestoneTitle" value="${escape(text(runtime.ui?.projectMilestoneTitle || ''))}" placeholder="Prototype review"></label>
                                        <label><span class="social-neo-label">Due</span><input class="social-neo-input" type="datetime-local" name="projectMilestoneDueAt" value="${escape(text(runtime.ui?.projectMilestoneDueAt || ''))}"></label>
                                    </div>
                                    <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="3" name="projectMilestoneDescription">${escape(text(runtime.ui?.projectMilestoneDescription || ''))}</textarea></label>
                                    <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Add milestone</button></div>
                                </form>
                            ` : ''}
                            <section class="social-neo-stack">
                                ${projectMilestones.length ? projectMilestones.map((milestone) => `
                                    <article class="social-neo-card">
                                        <div class="social-neo-inline social-neo-inline-between-start-wrap">
                                            <div>
                                                <strong>${escape(text(milestone?.title || 'Milestone'))}</strong>
                                                ${text(milestone?.description) ? `<p class="social-project-body-copy social-neo-copy social-neo-copy-mt-8">${escape(text(milestone.description))}</p>` : ''}
                                            </div>
                                            <div class="social-neo-badge-row">
                                                ${milestone?.completed ? `<span class="social-neo-pill">Completed</span>` : `<span class="social-neo-pill">Open</span>`}
                                                ${text(milestone?.dueAt) ? `<span class="social-neo-pill">${escape(when(milestone.dueAt))}</span>` : ''}
                                            </div>
                                        </div>
                                        ${activeProject.viewerCanContribute ? `
                                            <div class="social-project-milestone-actions">
                                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-milestone-toggle" data-project-id="${escape(text(activeProject.id))}" data-milestone-id="${escape(text(milestone.id))}" data-completed="${milestone?.completed ? '0' : '1'}">${milestone?.completed ? 'Reopen' : 'Complete'}</button>
                                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-milestone-delete" data-project-id="${escape(text(activeProject.id))}" data-milestone-id="${escape(text(milestone.id))}">Remove</button>
                                            </div>
                                        ` : ''}
                                    </article>
                                `).join('') : `<div class="social-neo-empty">No milestones yet.</div>`}
                            </section>
                        `
                        : activeTab === 'files'
                            ? `
                                ${activeProject.viewerCanContribute ? `
                                    <form data-form="project-deliverable-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-card social-neo-stack">
                                        <div class="social-neo-section-head">
                                            <div><strong>Add deliverable</strong><span>Attach milestone outputs, drafts, submissions, and final packages.</span></div>
                                        </div>
                                        <div class="social-neo-grid-2">
                                            <label><span class="social-neo-label">Title</span><input class="social-neo-input" type="text" name="projectDeliverableTitle" value="${escape(text(runtime.ui?.projectDeliverableTitle || ''))}" placeholder="Proposal draft"></label>
                                            <label><span class="social-neo-label">Version</span><input class="social-neo-input" type="text" name="projectDeliverableVersion" value="${escape(text(runtime.ui?.projectDeliverableVersion || ''))}" placeholder="v1"></label>
                                        </div>
                                        <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="3" name="projectDeliverableDescription">${escape(text(runtime.ui?.projectDeliverableDescription || ''))}</textarea></label>
                                        <label><span class="social-neo-label">Upload file</span><input class="social-neo-input" type="file" name="projectDeliverableFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt,image/*">${renderFileChip(runtime.ui?.projectDeliverableFile, 'Deliverable ready')}</label>
                                        <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Add deliverable</button></div>
                                    </form>
                                ` : ''}
                                <section class="social-neo-stack">
                                    ${projectDeliverables.length ? projectDeliverables.map((deliverable) => `
                                        <article class="social-neo-card social-project-deliverable-card">
                                            <div class="social-project-deliverable-head">
                                                <div>
                                                    <strong>${escape(text(deliverable?.title || 'Deliverable'))}</strong>
                                                    <div class="social-neo-muted">${escape(text(deliverable?.versionLabel || ''))} &middot; ${escape(displayName(accountById(deliverable?.submittedById) || { id: deliverable?.submittedById }))} &middot; ${escape(when(deliverable?.submittedAt))}</div>
                                                    ${text(deliverable?.description) ? `<p class="social-project-body-copy social-neo-copy social-neo-copy-mt-8">${escape(text(deliverable.description))}</p>` : ''}
                                                </div>
                                                <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                                                    ${deliverable?.file?.url ? `<a class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" href="${escape(text(deliverable.file.url))}" target="_blank" rel="noreferrer">Open file</a>` : deliverable?.file?.dataUrl ? `<a class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" href="${escape(text(deliverable.file.dataUrl))}" target="_blank" rel="noreferrer">Open file</a>` : ''}
                                                    ${activeProject.viewerCanContribute ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-deliverable-delete" data-project-id="${escape(text(activeProject.id))}" data-deliverable-id="${escape(text(deliverable.id))}">Remove</button>` : ''}
                                                </div>
                                            </div>
                                        </article>
                                    `).join('') : `<div class="social-neo-empty">No deliverables yet.</div>`}
                                </section>
                            `
                            : activeTab === 'meetings'
                                ? `
                                    ${activeProject.viewerCanContribute ? `
                                        <form data-form="project-meeting-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-card social-neo-stack">
                                            <div class="social-neo-section-head">
                                                <div><strong>Schedule project meeting</strong><span>Meetings reuse the existing event system, scoped to this private workspace.</span></div>
                                            </div>
                                            <div class="social-neo-grid-2">
                                                <label><span class="social-neo-label">Title</span><input class="social-neo-input" type="text" name="meetingTitle" placeholder="Sprint review"></label>
                                                <label><span class="social-neo-label">Location / link</span><input class="social-neo-input" type="text" name="meetingLocation" placeholder="Lab 4 / Zoom"></label>
                                            </div>
                                            <label><span class="social-neo-label">Agenda / notes</span><textarea class="social-neo-textarea" rows="3" name="meetingDescription"></textarea></label>
                                            <div class="social-neo-grid-2">
                                                <label><span class="social-neo-label">Starts</span><input class="social-neo-input" type="datetime-local" name="meetingStartsAt"></label>
                                                <label><span class="social-neo-label">Ends</span><input class="social-neo-input" type="datetime-local" name="meetingEndsAt"></label>
                                            </div>
                                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Schedule meeting</button></div>
                                        </form>
                                    ` : ''}
                                    <section class="social-neo-stack">
                                        ${projectMeetings.length ? projectMeetings.map((meeting) => `
                                            <article class="social-neo-card social-project-meeting-card">
                                                <div class="social-project-meeting-head">
                                                    <div>
                                                        <strong>${escape(text(meeting?.title || 'Meeting'))}</strong>
                                                        <div class="social-neo-muted">${escape(when(meeting?.startsAt))}${text(meeting?.location) ? ` &middot; ${escape(text(meeting.location))}` : ''}</div>
                                                        ${text(meeting?.description) ? `<p class="social-project-body-copy social-neo-copy social-neo-copy-mt-8">${escape(text(meeting.description))}</p>` : ''}
                                                    </div>
                                                    <div class="social-project-meeting-footer">
                                                        ${(() => {
                                                            const safeOnlineLink = getSafeSocialExternalUrl(meeting?.onlineLink);
                                                            return safeOnlineLink ? `<a class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" href="${escape(safeOnlineLink)}" target="_blank" rel="noreferrer">Join link</a>` : '';
                                                        })()}
                                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(activeProject.groupId))}">Open feed</button>
                                                    </div>
                                                </div>
                                            </article>
                                        `).join('') : `<div class="social-neo-empty">No meetings scheduled yet.</div>`}
                                    </section>
                                `
                                : activeTab === 'chat'
                                    ? `
                                        <section class="social-neo-card">
                                            <div class="social-neo-section-head">
                                                <div><strong>Project chat</strong><span>This workspace reuses the existing private group chat for files, calls, and member messaging.</span></div>
                                            </div>
                                            <div class="social-project-chat-launch">
                                                <div>
                                                    <strong>${escape(text(activeProject.name))} workspace chat</strong>
                                                    <div class="social-neo-muted">${escape(activeProject.chatId ? 'Chat is ready for direct messages, files, and calls.' : 'Chat will open from the backing group.')}</div>
                                                </div>
                                                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-open-chat" data-project-id="${escape(text(activeProject.id))}">
                                                    <i class="fas fa-comments"></i> Open chat
                                                </button>
                                            </div>
                                        </section>
                                    `
                                    : activeTab === 'activity'
                                        ? `
                                            <section class="social-neo-stack">
                                                ${projectActivity.length ? projectActivity.map((entry) => {
                                                    const actor = accountById(entry.actorUserId) || { id: entry.actorUserId };
                                                    return `
                                                        <article class="social-neo-card">
                                                            <div class="social-neo-inline social-neo-inline-between-start-wrap">
                                                                <div class="social-neo-person social-neo-person-start-gap-10">
                                                                    ${avatar(actor, 'social-neo-avatar-sm')}
                                                                    <div>
                                                                        <strong>${escape(displayName(actor))}</strong>
                                                                        <div class="social-neo-muted">${escape(text(entry.summary || entry.type || 'Updated the project'))}</div>
                                                                    </div>
                                                                </div>
                                                                <span class="social-neo-pill">${escape(when(entry.createdAt))}</span>
                                                            </div>
                                                        </article>
                                                    `;
                                                }).join('') : `<div class="social-neo-empty">No project activity yet.</div>`}
                                            </section>
                                        `
                                        : activeTab === 'outcome'
                                            ? `
                                                <section class="social-neo-card social-neo-stack">
                                                    <div class="social-neo-section-head">
                                                        <div><strong>Outcome and showcase</strong><span>Prepare the workspace for public presentation after completion.</span></div>
                                                        ${activeProject.showcasePageId ? `<span class="social-neo-pill">Showcase published</span>` : ''}
                                                    </div>
                                                    <div class="social-neo-card social-neo-card-pad-16">
                                                        <span class="social-neo-label">Showcase summary</span>
                                                        <p class="social-project-body-copy social-neo-copy social-neo-copy-mt-8">${escape(text(activeProject.showcaseSummary || 'No showcase summary yet.'))}</p>
                                                    </div>
                                                    <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                                        ${activeProject.showcasePageId ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="panel-pages">Open pages</button>` : ''}
                                                        ${activeProject.isManager ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> ${activeProject.showcasePageId ? 'Republish showcase' : 'Publish showcase'}</button>` : ''}
                                                    </div>
                                                </section>
                                            `
                                            : `
                                                <section class="social-neo-card">
                                                    <div class="social-neo-section-head">
                                                        <div><strong>Weekly check-ins</strong><span>Quick updates on progress, blockers, and next steps.</span></div>
                                                    </div>
                                                    ${activeProject.viewerCanContribute ? `
                                                        <form data-form="project-checkin-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack">
                                                            <div class="social-neo-grid-3">
                                                                <label><span class="social-neo-label">Done</span><textarea class="social-neo-textarea" rows="3" name="projectCheckinDone">${escape(text(runtime.ui?.projectCheckinDone || ''))}</textarea></label>
                                                                <label><span class="social-neo-label">Blockers</span><textarea class="social-neo-textarea" rows="3" name="projectCheckinBlockers">${escape(text(runtime.ui?.projectCheckinBlockers || ''))}</textarea></label>
                                                                <label><span class="social-neo-label">Next steps</span><textarea class="social-neo-textarea" rows="3" name="projectCheckinNextSteps">${escape(text(runtime.ui?.projectCheckinNextSteps || ''))}</textarea></label>
                                                            </div>
                                                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Post check-in</button></div>
                                                        </form>
                                                    ` : ''}
                                                    <div class="social-neo-stack">
                                                        ${projectCheckins.length ? projectCheckins.map((checkin) => {
                                                            const account = accountById(checkin.authorUserId) || { id: checkin.authorUserId };
                                                            return `
                                                                <article class="social-neo-card social-project-checkin-card">
                                                                    <div class="social-neo-inline social-neo-inline-between-start-wrap">
                                                                        <div class="social-neo-person social-neo-person-start-gap-10">
                                                                            ${avatar(account, 'social-neo-avatar-sm')}
                                                                            <div>
                                                                                <strong>${escape(displayName(account))}</strong>
                                                                                <div class="social-neo-muted">${escape(when(checkin.createdAt))}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="social-neo-grid-3 social-neo-grid-mt-12">
                                                                        <div><span class="social-neo-label">Done</span><p>${escape(text(checkin.whatDone || ''))}</p></div>
                                                                        <div><span class="social-neo-label">Blockers</span><p>${escape(text(checkin.blockers || ''))}</p></div>
                                                                        <div><span class="social-neo-label">Next steps</span><p>${escape(text(checkin.nextSteps || ''))}</p></div>
                                                                    </div>
                                                                </article>
                                                            `;
                                                        }).join('') : `<div class="social-neo-empty">No check-ins yet.</div>`}
                                                    </div>
                                                </section>
                                            `;

        return `
            <div class="social-neo-stack social-projects-shell">
                <section class="social-neo-card social-project-detail-hero">
                    <div class="social-project-detail-top">
                        <div class="social-project-detail-copy">
                            <div class="social-neo-inline social-neo-inline-gap-10-wrap">
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="projects-back"><i class="fas fa-arrow-left"></i> Back</button>
                                ${projectRolePill(activeProject.role || 'member')}
                                <span class="social-neo-pill">${escape(text(activeProject.status || 'idea'))}</span>
                            </div>
                            <h2 class="social-project-detail-title">${escape(text(activeProject.name || 'Project workspace'))}</h2>
                            <p class="social-project-detail-summary">${escape(text(activeProject.summary || activeProject.description || ''))}</p>
                            <div class="social-neo-badge-row">
                                ${facultyPills(activeProject.facultyCodes)}
                                ${text(activeProject.courseTag) ? `<span class="social-neo-pill">${escape(activeProject.courseTag)}</span>` : ''}
                                <span class="social-neo-pill"><strong>${escape(activeProject.memberCount || 0)}</strong><span>Members</span></span>
                                <span class="social-neo-pill"><strong>${escape(activeProject.openTaskCount || 0)}</strong><span>Open tasks</span></span>
                            </div>
                        </div>
                        <div class="social-project-detail-actions">
                            <div class="social-neo-person social-neo-person-gap-10">
                                ${avatar(owner)}
                                <div>
                                    <strong>${escape(displayName(owner))}</strong>
                                    <div class="social-neo-muted">Workspace owner</div>
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-open-chat" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-comments"></i> Chat</button>
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="meetings"><i class="fas fa-calendar-days"></i> Meetings</button>
                                ${activeProject.isManager ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> Showcase</button>` : ''}
                            </div>
                        </div>
                    </div>
                </section>

                <section class="social-neo-card">
                    <div class="social-project-tab-row">
                        ${[
                            ['overview', 'Overview'],
                            ['team', 'Team'],
                            ['tasks', 'Tasks'],
                            ['milestones', 'Milestones'],
                            ['files', 'Files & Deliverables'],
                            ['meetings', 'Meetings'],
                            ['chat', 'Chat'],
                            ['checkins', 'Check-ins'],
                            ['activity', 'Activity'],
                            ['outcome', 'Outcome']
                        ].map(([tabId, label]) => `
                            <button class="social-neo-btn ${activeTab === tabId ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="${escape(tabId)}">${escape(label)}</button>
                        `).join('')}
                    </div>
                </section>

                ${tabMarkup}
            </div>
        `;
    }

    function renderProjectsWorkspacePanelClassic() {
        const runtime = state();
        const social = runtime.social || {};
        const projects = Array.isArray(social.projects) ? social.projects : [];
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const activeProjectId = text(runtime.ui?.activeProjectId || '');
        const activeProject = projects.find((project) => text(project?.id) === activeProjectId) || null;
        const activeTab = text(runtime.ui?.projectTab || 'overview') || 'overview';
        const facultyOptions = uniqueStrings([
            currentFacultyCode(),
            ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : []),
            ...directory.map((account) => text(account?.facultyCode || account?.faculty))
        ]).filter(Boolean);
        const projectFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()];
        const roleLabels = {
            owner: 'Owner',
            member: 'Member',
            advisor: 'Advisor',
            'instructor-viewer': 'Instructor viewer'
        };
        const statusMeta = {
            idea: { label: 'Idea', note: 'Still being shaped' },
            active: { label: 'Active', note: 'Execution in progress' },
            review: { label: 'Review', note: 'Preparing for review' },
            completed: { label: 'Completed', note: 'Workspace delivered' }
        };
        const taskColumns = [
            { id: 'backlog', label: 'Backlog', tone: 'slate' },
            { id: 'todo', label: 'To Do', tone: 'blue' },
            { id: 'in-progress', label: 'In Progress', tone: 'orange' },
            { id: 'blocked', label: 'Blocked', tone: 'rose' },
            { id: 'done', label: 'Done', tone: 'emerald' }
        ];
        const advisorCandidates = directory.filter((account) => isStaffAccount(account) || ['professor', 'ta', 'admin'].includes(text(account?.role || '').toLowerCase()));
        const projectInviteSelectedIds = Array.isArray(runtime.ui?.projectInviteSelectedIds) ? runtime.ui.projectInviteSelectedIds : [];
        const inviteSearch = text(runtime.ui?.projectInviteSearch || '').toLowerCase();
        const inviteFaculty = text(runtime.ui?.projectInviteFaculty || 'all') || 'all';
        const selectedProjectMemberIds = uniqueStrings([
            ...(Array.isArray(activeProject?.memberIds) ? activeProject.memberIds : []),
            ...(Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : []),
            text(activeProject?.advisorUserId || ''),
            ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])
        ]);
        const filteredInviteCandidates = directory
            .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
            .filter((account) => !projectInviteSelectedIds.includes(text(account.id)))
            .filter((account) => !selectedProjectMemberIds.includes(text(account.id)))
            .filter((account) => inviteFaculty === 'all' || text(account?.facultyCode || account?.faculty) === inviteFaculty)
            .filter((account) => {
                if (!inviteSearch) return true;
                const blob = `${displayName(account)} ${accountSubtitle(account)} ${text(account?.facultyCode || account?.faculty)} ${Array.isArray(account?.interests) ? account.interests.join(' ') : ''}`.toLowerCase();
                return blob.includes(inviteSearch);
            })
            .slice(0, 18);
        const myProjects = projects.filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase()));
        const featuredProjects = [...projects]
            .sort((left, right) => Number(right?.activityCount || 0) - Number(left?.activityCount || 0))
            .slice(0, 6);
        const countNum = (value) => Number(value || 0);
        const projectRolePill = (role) => `<span class="social-neo-pill">${escape(roleLabels[text(role).toLowerCase()] || roleLabel(role || 'member'))}</span>`;
        const facultyPills = (codes = []) => (Array.isArray(codes) ? codes : []).map((code) => `<span class="social-neo-pill">${escape(code)}</span>`).join('');
        const skillPills = (skills = []) => (Array.isArray(skills) ? skills : []).map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('');
        const scrollList = (modifier, content) => `<div class="social-project-scroll-list${modifier ? ` ${modifier}` : ''}">${content}</div>`;
        const projectToneFromAccent = (accent = '') => {
            const normalized = text(accent).toLowerCase();
            if (normalized === '#3b82f6') return 'blue';
            if (normalized === '#8b5cf6') return 'purple';
            if (normalized === '#14b8a6') return 'teal';
            return 'orange';
        };
        const renderMetricCard = (icon, label, value, note, accent = '#f97316') => `
            <article class="social-project-metric-card" data-project-tone="${projectToneFromAccent(accent)}">
                <span class="social-project-metric-icon"><i class="fas ${escape(icon)}"></i></span>
                <div>
                    <small>${escape(label)}</small>
                    <strong>${escape(String(value))}</strong>
                    <span>${escape(note)}</span>
                </div>
            </article>
        `;
        const renderProgressRing = (value, label, note, accent = '#f97316') => {
            const normalized = Math.max(0, Math.min(100, countNum(value)));
            const circumference = 2 * Math.PI * 42;
            const dash = circumference - ((normalized / 100) * circumference);
            return `
                <article class="social-project-ring-card" data-project-tone="${projectToneFromAccent(accent)}">
                    <svg viewBox="0 0 110 110" aria-hidden="true">
                        <circle cx="55" cy="55" r="42" class="social-project-ring-track"></circle>
                        <circle cx="55" cy="55" r="42" class="social-project-ring-value" stroke-dasharray="${circumference}" stroke-dashoffset="${dash}"></circle>
                    </svg>
                    <div class="social-project-ring-copy">
                        <strong>${escape(String(normalized))}%</strong>
                        <span>${escape(label)}</span>
                        <small>${escape(note)}</small>
                    </div>
                </article>
            `;
        };
        const renderSparkline = (points = []) => {
            const list = Array.isArray(points) && points.length ? points : [{ count: 0, label: '00/00' }];
            const maxValue = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
            const width = 800;
            const height = 96;
            const step = list.length > 1 ? width / (list.length - 1) : width;
            const pts = list.map((entry, index) => {
                const x = Math.round(index * step);
                const y = Math.round(height - ((countNum(entry?.count) / maxValue) * (height - 20)) - 10);
                return { x, y, label: text(entry?.label || ''), count: countNum(entry?.count) };
            });
            const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath = `M${pts[0].x},${height} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${height} Z`;
            return `
                <div class="social-project-sparkline social-project-sparkline--full">
                    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" class="social-project-sparkline-svg">
                        <defs>
                            <linearGradient id="spark-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.28"/>
                                <stop offset="100%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.02"/>
                            </linearGradient>
                        </defs>
                        <path d="${areaPath}" fill="url(#spark-area-gradient)"/>
                        <polyline points="${polyline}" class="social-project-sparkline-line"></polyline>
                        ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" class="social-project-sparkline-dot" opacity="${p.count > 0 ? '1' : '0.3'}"/>`).join('')}
                    </svg>
                    <div class="social-project-sparkline-labels">
                        ${list.map((entry) => `<span>${escape(text(entry?.label || ''))}</span>`).join('')}
                    </div>
                </div>
            `;
        };
        const renderMiniProgressRing = (value, accent = '#f97316', size = 44) => {
            const normalized = Math.max(0, Math.min(100, countNum(value)));
            const r = (size / 2) - 5;
            const circumference = 2 * Math.PI * r;
            const dash = circumference - ((normalized / 100) * circumference);
            const center = size / 2;
            return `
                <svg class="social-project-mini-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
                    <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="rgba(148,163,184,0.2)" stroke-width="4"></circle>
                    <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dash}" transform="rotate(-90 ${center} ${center})"></circle>
                    <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="social-project-mini-ring-text">${escape(String(normalized))}%</text>
                </svg>
            `;
        };
        const renderMiniSparkline = (points = [], width = 200, height = 40) => {
            const list = Array.isArray(points) && points.length ? points : [{ count: 0 }];
            const maxValue = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
            const step = list.length > 1 ? width / (list.length - 1) : width;
            const pts = list.map((entry, index) => {
                const x = Math.round(index * step);
                const y = Math.round(height - ((countNum(entry?.count) / maxValue) * (height - 8)) - 4);
                return { x, y };
            });
            const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath = `M${pts[0].x},${height} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${height} Z`;
            return `
                <svg class="social-project-mini-sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                        <linearGradient id="mini-spark-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.02"/>
                        </linearGradient>
                    </defs>
                    <path d="${areaPath}" fill="url(#mini-spark-grad)"/>
                    <polyline points="${polyline}" fill="none" stroke="var(--sn-proj-accent,#c8822a)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                </svg>
            `;
        };
        const renderHealthIndicator = (project) => {
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const now = Date.now();
            const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
            const overdueMilestones = countNum(project?.milestoneOverdueCount);
            const taskPct = countNum(project?.taskCompletionPercent);
            const activityCount = countNum(project?.activityCount);
            let level = 'good';
            let label = 'On track';
            let icon = 'fa-circle-check';
            const alerts = [];
            if (overdueTasks >= 3 || overdueMilestones >= 2) {
                level = 'critical';
                label = 'Critical';
                icon = 'fa-triangle-exclamation';
            } else if (overdueTasks >= 1 || overdueMilestones >= 1 || taskPct < 30) {
                level = 'needs-attention';
                label = 'Needs attention';
                icon = 'fa-circle-exclamation';
            }
            if (overdueTasks > 0) alerts.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`);
            if (overdueMilestones > 0) alerts.push(`${overdueMilestones} overdue milestone${overdueMilestones > 1 ? 's' : ''}`);
            if (taskPct === 0 && tasks.length > 0) alerts.push('No tasks completed yet');
            if (tasks.length === 0) alerts.push('No tasks created');
            if (project?.milestoneCount === 0) alerts.push('No milestones set');
            const wins = [];
            if (taskPct >= 50) wins.push(`${taskPct}% tasks done`);
            if (activityCount > 0) wins.push(`${activityCount} events this week`);
            if (overdueTasks === 0 && overdueMilestones === 0 && tasks.length > 0) wins.push('No overdue items');
            return `
                <section class="social-neo-card social-project-health-card" data-health="${escape(level)}">
                    <div class="social-neo-section-head">
                        <div><strong>Project health</strong><span>Overall workspace status.</span></div>
                        <span class="social-project-health-badge" data-health="${escape(level)}"><i class="fas ${escape(icon)}"></i> ${escape(label)}</span>
                    </div>
                    <div class="social-project-health-body">
                        ${alerts.length ? `<div class="social-project-health-list">${alerts.map((a) => `<div class="social-project-health-alert"><i class="fas fa-circle-xmark"></i> ${escape(a)}</div>`).join('')}</div>` : ''}
                        ${wins.length ? `<div class="social-project-health-list">${wins.map((w) => `<div class="social-project-health-win"><i class="fas fa-circle-check"></i> ${escape(w)}</div>`).join('')}</div>` : ''}
                        ${!alerts.length && !wins.length ? '<div class="social-neo-muted">Start adding tasks and milestones to see health status.</div>' : ''}
                    </div>
                </section>
            `;
        };
        const renderDeadlineTracker = (project) => {
            const milestones = Array.isArray(project?.milestones) ? project.milestones : [];
            const now = Date.now();
            const upcoming = milestones.filter((m) => m.status !== 'completed' && m.dueAt).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
            const nextMilestone = upcoming.find((m) => new Date(m.dueAt).getTime() >= now) || upcoming[0] || null;
            const overdueMilestones = milestones.filter((m) => m.status !== 'completed' && m.dueAt && new Date(m.dueAt).getTime() < now).length;
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
            const checkins = Array.isArray(project?.checkins) ? project.checkins : [];
            const lastCheckin = checkins.length ? checkins[checkins.length - 1] : null;
            let deadlineHtml = '';
            if (nextMilestone) {
                const daysLeft = Math.ceil((new Date(nextMilestone.dueAt).getTime() - now) / 86400000);
                const isPast = daysLeft < 0;
                const pct = nextMilestone.dueAt ? Math.min(100, Math.max(0, Math.round((1 - Math.abs(daysLeft) / 30) * 100))) : 0;
                deadlineHtml = `
                    <div class="social-project-deadline-next ${isPast ? 'is-overdue' : ''}">
                        <div class="social-project-deadline-title">${escape(text(nextMilestone.title || 'Untitled milestone'))}</div>
                        <div class="social-project-deadline-meta">
                            ${isPast ? `<span class="social-project-deadline-overdue-count">${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue</span>` : `<span>${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining</span>`}
                            <span>${escape(when(nextMilestone.dueAt))}</span>
                        </div>
                        <div class="social-project-deadline-bar"><div class="social-project-deadline-fill ${isPast ? 'is-overdue' : ''}" style="width:${pct}%"></div></div>
                    </div>
                `;
            } else {
                deadlineHtml = '<div class="social-neo-muted">No upcoming deadlines set.</div>';
            }
            return `
                <section class="social-neo-card social-project-deadline-card">
                    <div class="social-neo-section-head">
                        <div><strong>Deadlines</strong><span>What is coming up next.</span></div>
                        ${overdueMilestones > 0 || overdueTasks > 0 ? `<span class="social-neo-pill is-danger">${overdueMilestones + overdueTasks} overdue</span>` : ''}
                    </div>
                    ${deadlineHtml}
                    ${lastCheckin ? `<div class="social-project-deadline-checkin"><i class="fas fa-comment-dots"></i> Last check-in: ${escape(when(lastCheckin.createdAt || ''))}</div>` : ''}
                </section>
            `;
        };
        const renderMyTasks = (project) => {
            const userId = currentUserId();
            const allTasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const myTasks = allTasks.filter((t) => text(t.assigneeUserId) === userId && t.status !== 'done').sort((a, b) => {
                if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
                if (a.dueAt) return -1;
                if (b.dueAt) return 1;
                return 0;
            }).slice(0, 5);
            const toneMap = { 'backlog': 'slate', 'todo': 'blue', 'in-progress': 'orange', 'blocked': 'rose', 'done': 'emerald' };
            const labelMap = { 'backlog': 'Backlog', 'todo': 'To Do', 'in-progress': 'In Progress', 'blocked': 'Blocked', 'done': 'Done' };
            const priorityIcon = { 'low': 'fa-arrow-down', 'medium': 'fa-minus', 'high': 'fa-arrow-up', 'urgent': 'fa-angles-up' };
            return `
                <section class="social-neo-card social-project-my-tasks-card">
                    <div class="social-neo-section-head">
                        <div><strong>My tasks</strong><span>Your assigned work.</span></div>
                        <span class="social-neo-pill">${escape(String(myTasks.length))} open</span>
                    </div>
                    ${myTasks.length ? `<div class="social-project-my-tasks-list">${myTasks.map((task) => {
                        const now = Date.now();
                        const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < now;
                        const tone = toneMap[task.status] || 'slate';
                        return `
                            <div class="social-project-my-task-item ${isOverdue ? 'is-overdue' : ''}">
                                <span class="social-project-status-dot is-${escape(tone)}"></span>
                                <span class="social-project-my-task-title">${escape(text(task.title || ''))}</span>
                                <span class="social-project-status-label">${escape(labelMap[task.status] || task.status)}</span>
                                ${task.priority && task.priority !== 'medium' ? `<span class="social-project-priority-pill" data-priority="${escape(task.priority)}"><i class="fas ${escape(priorityIcon[task.priority] || 'fa-minus')}"></i> ${escape(task.priority)}</span>` : ''}
                                ${task.dueAt ? `<span class="social-project-my-task-due ${isOverdue ? 'is-overdue' : ''}">${escape(when(task.dueAt))}</span>` : ''}
                            </div>
                        `;
                    }).join('')}</div>` : '<div class="social-neo-empty">No tasks assigned to you yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                </section>
            `;
        };
        const renderTeamRoster = (project, members) => {
            const list = Array.isArray(members) ? members.slice(0, 6) : [];
            return `
                <section class="social-neo-card social-project-roster-card">
                    <div class="social-neo-section-head">
                        <div><strong>Team</strong><span>Members and roles.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.memberCount || 0))} members</span>
                    </div>
                    ${list.length ? `<div class="social-project-team-roster">${list.map((member) => {
                        const account = accountById(member.userId) || { id: member.userId };
                        const online = isAccountOnline(account);
                        const roleLabel = text(member.role || 'member');
                        const facultyCode = text(member.facultyCode || account?.facultyCode || account?.faculty || '');
                        return `
                            <div class="social-project-roster-member">
                                <span class="social-project-roster-dot ${online ? 'is-online' : ''}"></span>
                                <div class="social-neo-person">${avatar(account, 'social-neo-avatar-sm')}<div><strong>${escape(displayName(account))}</strong><span>${escape(roleLabel)}${facultyCode ? ` · ${escape(facultyCode)}` : ''}</span></div></div>
                            </div>
                        `;
                    }).join('')}</div>` : '<div class="social-neo-empty">No team members yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="team">View all team →</span></div>
                </section>
            `;
        };
        const renderActivityItem = (entry) => {
            const actor = accountById(entry.actorUserId) || { id: entry.actorUserId };
            return `
                <article class="social-project-activity-item">
                    <div class="social-project-activity-icon"><i class="fas ${escape(activityIconMap[text(entry?.type || '')] || 'fa-clock-rotate-left')}"></i></div>
                    <div class="social-project-activity-body">
                        <div class="social-project-activity-head">
                            <div class="social-neo-person">
                                ${avatar(actor, 'social-neo-avatar-sm')}
                                <div>
                                    <strong>${escape(displayName(actor))}</strong>
                                    <span>${escape(text(entry.summary || entry.type || 'Updated the project'))}</span>
                                </div>
                            </div>
                            <em>${escape(when(entry.createdAt || ''))}</em>
                        </div>
                    </div>
                </article>
            `;
        };
        const renderActivityFeed = (project) => {
            const items = Array.isArray(project?.activity) ? project.activity.slice(0, 5) : [];
            return `
                <section class="social-neo-card social-project-feed-card">
                    <div class="social-neo-section-head">
                        <div><strong>Recent activity</strong><span>Latest workspace changes.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.activityCount || 0))} events</span>
                    </div>
                    ${items.length ? `<div class="social-project-activity-feed">${items.map(renderActivityItem).join('')}</div>` : '<div class="social-neo-empty">No activity recorded yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="activity">View all activity →</span></div>
                </section>
            `;
        };
        const renderRecentFiles = (project) => {
            const deliverables = Array.isArray(project?.deliverables) ? project.deliverables : [];
            const recent = deliverables.slice(-3).reverse();
            return `
                <section class="social-neo-card social-project-files-card">
                    <div class="social-neo-section-head">
                        <div><strong>Recent files</strong><span>Latest deliverables submitted.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.deliverableCount || 0))} total</span>
                    </div>
                    ${recent.length ? `<div class="social-project-recent-files">${recent.map((d) => {
                        const submitter = accountById(d.submittedById) || { id: d.submittedById };
                        const hasFile = d.file?.url || d.file?.dataUrl;
                        return `
                            <div class="social-project-file-item">
                                <div class="social-project-file-icon"><i class="fas fa-file-lines"></i></div>
                                <div class="social-project-file-info">
                                    <strong>${escape(text(d.title || 'Untitled'))}</strong>
                                    <span>${escape(text(d.versionLabel || ''))} · ${escape(displayName(submitter))} · ${escape(when(d.submittedAt || ''))}</span>
                                </div>
                                ${hasFile ? `<a class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" href="${escape(text(d.file.url || d.file.dataUrl))}" target="_blank" rel="noopener"><i class="fas fa-download"></i></a>` : ''}
                            </div>
                        `;
                    }).join('')}</div>` : '<div class="social-neo-empty">No files submitted yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="files">View all files →</span></div>
                </section>
            `;
        };
        const renderNextMeeting = (project) => {
            const meetings = Array.isArray(project?.meetings) ? project.meetings : [];
            const now = Date.now();
            const next = meetings.find((m) => m.startsAt && new Date(m.startsAt).getTime() >= now) || null;
            if (!next) {
                return `
                    <section class="social-neo-card social-project-next-meeting-card">
                        <div class="social-neo-section-head">
                            <div><strong>Next meeting</strong><span>Upcoming scheduled session.</span></div>
                        </div>
                        <div class="social-neo-empty">No upcoming meetings scheduled.</div>
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="meetings">Schedule meeting →</span></div>
                    </section>
                `;
            }
            const startDate = new Date(next.startsAt);
            const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            return `
                <section class="social-neo-card social-project-next-meeting-card">
                    <div class="social-neo-section-head">
                        <div><strong>Next meeting</strong><span>Upcoming scheduled session.</span></div>
                        <span class="social-neo-pill">${escape(dateStr)}</span>
                    </div>
                    <div class="social-project-next-meeting-body">
                        <div class="social-project-next-meeting-title">${escape(text(next.title || 'Untitled meeting'))}</div>
                        <div class="social-project-next-meeting-meta">
                            <span><i class="fas fa-clock"></i> ${escape(timeStr)}</span>
                            ${next.location ? `<span><i class="fas fa-location-dot"></i> ${escape(text(next.location))}</span>` : ''}
                        </div>
                        ${next.description ? `<p class="social-project-next-meeting-desc">${escape(text(next.description))}</p>` : ''}
                        <div class="social-project-next-meeting-actions">
                            ${next.onlineLink ? `<a class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" href="${escape(text(next.onlineLink))}" target="_blank" rel="noopener"><i class="fas fa-video"></i> Join meeting</a>` : ''}
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="meetings"><i class="fas fa-calendar-days"></i> All meetings</button>
                        </div>
                    </div>
                </section>
            `;
        };
        const renderQuickActions = (project) => {
            const isManager = Boolean(project?.isManager || project?.viewerCanContribute);
            return `
                <section class="social-neo-card social-project-quick-actions-card">
                    <div class="social-neo-section-head">
                        <div><strong>Quick actions</strong><span>Common workspace operations.</span></div>
                    </div>
                    <div class="social-project-quick-actions-grid">
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="checkins"><i class="fas fa-comment-dots"></i> Post check-in</button>
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="files"><i class="fas fa-paperclip"></i> Upload file</button>
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-open-chat" data-project-id="${escape(text(project?.id))}"><i class="fas fa-comments"></i> Open chat</button>
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks"><i class="fas fa-list-check"></i> Create task</button>
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="meetings"><i class="fas fa-calendar-plus"></i> Schedule meeting</button>
                        ${isManager ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(project?.id))}"><i class="fas fa-globe"></i> Publish showcase</button>` : ''}
                    </div>
                </section>
            `;
        };
        const renderTaskStatusChart = (project) => {
            const counts = project?.taskStatusCounts || {};
            const total = Math.max(1, countNum(project?.taskCount));
            return `
                <section class="social-neo-card social-project-chart-card">
                    <div class="social-neo-section-head">
                        <div><strong>Task status graph</strong><span>See where work is collecting across the board.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.taskCount || 0))} tasks</span>
                    </div>
                    <div class="social-project-status-chart">
                        <div class="social-project-status-bar">
                            ${taskColumns.map((column) => {
                                const count = countNum(counts?.[column.id]);
                                const width = total ? Math.max(0, (count / total) * 100) : 0;
                                return `<span class="social-project-status-segment is-${escape(column.tone)}" style="width:${width}%"></span>`;
                            }).join('')}
                        </div>
                        <div class="social-project-status-grid">
                            ${taskColumns.map((column) => `
                                <article class="social-project-status-item">
                                    <div>
                                        <span class="social-project-status-dot is-${escape(column.tone)}"></span>
                                        <strong>${escape(column.label)}</strong>
                                    </div>
                                    <span>${escape(String(countNum(counts?.[column.id])))}</span>
                                </article>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `;
        };
        const renderTaskStatusDonut = (project) => {
            const counts = project?.taskStatusCounts || {};
            const total = taskColumns.reduce((sum, column) => sum + countNum(counts?.[column.id]), 0);
            const toneHex = { slate: '#94a3b8', blue: '#3b82f6', orange: '#f97316', rose: '#f43f5e', emerald: '#10b981' };
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            let offset = 0;
            const segments = total > 0 ? taskColumns.map((column) => {
                const count = countNum(counts?.[column.id]);
                if (count <= 0) return '';
                const length = (count / total) * circumference;
                const dash = `${length} ${circumference - length}`;
                const circle = `<circle class="social-project-donut-seg" cx="80" cy="80" r="${radius}" fill="none" stroke="${toneHex[column.tone] || '#94a3b8'}" stroke-width="20" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"></circle>`;
                offset += length;
                return circle;
            }).join('') : `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="20"></circle>`;
            const completion = countNum(project?.taskCompletionPercent);
            return `
                <section class="social-neo-card social-project-chart-card">
                    <div class="social-neo-section-head">
                        <div><strong>Status distribution</strong><span>Share of tasks in each column.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.taskCount || 0))} tasks</span>
                    </div>
                    <div class="social-project-donut-wrap">
                        <svg class="social-project-donut" viewBox="0 0 160 160" role="img" aria-label="Task status distribution">
                            ${segments}
                            <text x="80" y="74" text-anchor="middle" class="social-project-donut-value">${escape(String(completion))}%</text>
                            <text x="80" y="96" text-anchor="middle" class="social-project-donut-label">done</text>
                        </svg>
                        <div class="social-project-donut-legend">
                            ${taskColumns.map((column) => `
                                <span class="social-project-donut-key">
                                    <i class="social-project-status-dot is-${escape(column.tone)}"></i>
                                    ${escape(column.label)}
                                    <em>${escape(String(countNum(counts?.[column.id])))}</em>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `;
        };
        const renderWorkloadChart = (project) => {
            const list = Array.isArray(project?.workloadByMember) ? project.workloadByMember.slice(0, 6) : [];
            const maxCount = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
            return `
                <section class="social-neo-card social-project-chart-card">
                    <div class="social-neo-section-head">
                        <div><strong>Workload by member</strong><span>Open assigned work per teammate.</span></div>
                        <span class="social-neo-pill">${escape(String(list.length))} shown</span>
                    </div>
                    <div class="social-project-workload-list">
                        ${list.length ? list.map((entry) => {
                            const account = accountById(entry.userId) || { id: entry.userId };
                            const width = (countNum(entry.count) / maxCount) * 100;
                            return `
                                <article class="social-project-workload-item">
                                    <div class="social-project-workload-head">
                                        <div class="social-neo-person">
                                            ${avatar(account, 'social-neo-avatar-sm')}
                                            <div>
                                                <strong>${escape(displayName(account))}</strong>
                                                <span>${escape(text(entry.role || 'member'))}</span>
                                            </div>
                                        </div>
                                        <em>${escape(String(countNum(entry.count)))} open</em>
                                    </div>
                                    <div class="social-project-workload-bar"><span style="width:${width}%"></span></div>
                                </article>
                            `;
                        }).join('') : `<div class="social-neo-empty">No assigned workload yet.</div>`}
                    </div>
                </section>
            `;
        };
        const renderProjectCard = (project) => {
            const owner = accountById(project?.ownerUserId) || { id: project?.ownerUserId };
            const status = text(project?.status || 'idea');
            const statusDotClass = status === 'active' ? 'is-active' : status === 'completed' ? 'is-completed' : status === 'review' ? 'is-review' : '';
            const statusLabel = statusMeta[status]?.label || status;
            const taskPercent = countNum(project?.taskCompletionPercent);
            const milestonePercent = countNum(project?.milestoneCompletionPercent);
            const taskCount = countNum(project?.taskCount);
            const completedTasks = countNum(project?.completedTaskCount);
            const milestoneCount = countNum(project?.milestoneCount);
            const completedMilestones = countNum(project?.milestoneCompletedCount);
            const facultyCode = Array.isArray(project?.facultyCodes) ? project.facultyCodes[0] || '' : '';
            return `
                <article class="social-project-card-new" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                    <div class="social-project-card-new-status">
                        <span class="social-project-status-dot ${escape(statusDotClass)}"></span>
                        <span class="social-project-status-label">${escape(statusLabel)}</span>
                    </div>
                    <h3 class="social-project-card-new-title">${escape(text(project?.name || 'Project workspace'))}</h3>
                    <p class="social-project-card-new-summary">${escape(text(project?.summary || project?.description || ''))}</p>
                    <div class="social-project-card-new-progress">
                        <div class="social-project-card-new-progress-row">
                            <span class="social-project-card-new-progress-label">Tasks</span>
                            <div class="social-project-card-new-progress-bar">
                                <div class="social-project-card-new-progress-fill" style="width:${taskPercent}%"></div>
                            </div>
                            <span class="social-project-card-new-progress-value">${taskPercent}% (${completedTasks}/${taskCount})</span>
                        </div>
                        <div class="social-project-card-new-progress-row">
                            <span class="social-project-card-new-progress-label">Milestones</span>
                            <div class="social-project-card-new-progress-bar">
                                <div class="social-project-card-new-progress-fill" style="width:${milestonePercent}%"></div>
                            </div>
                            <span class="social-project-card-new-progress-value">${milestonePercent}% (${completedMilestones}/${milestoneCount})</span>
                        </div>
                    </div>
                    <div class="social-project-card-new-meta">
                        <span>${escape(displayName(owner))} · ${escape(facultyCode)} · ${escape(String(project?.memberCount || 0))} members</span>
                    </div>
                    <div class="social-project-card-new-cta">
                        <span>Open workspace →</span>
                    </div>
                </article>
            `;
        };
        const renderProjectRow = (project) => {
            const status = text(project?.status || 'idea');
            const statusDotClass = status === 'active' ? 'is-active' : status === 'completed' ? 'is-completed' : status === 'review' ? 'is-review' : '';
            const statusLabel = statusMeta[status]?.label || status;
            const taskPercent = countNum(project?.taskCompletionPercent);
            const milestonePercent = countNum(project?.milestoneCompletionPercent);
            const facultyCode = Array.isArray(project?.facultyCodes) ? project.facultyCodes[0] || '' : '';
            return `
                <div class="social-project-row" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                    <div class="social-project-row-status">
                        <span class="social-project-status-dot ${escape(statusDotClass)}"></span>
                        <span class="social-project-status-label">${escape(statusLabel)}</span>
                    </div>
                    <span class="social-project-row-title">${escape(text(project?.name || 'Project workspace'))}</span>
                    <span class="social-project-row-meta">${escape(facultyCode)} · ${escape(String(project?.memberCount || 0))} members</span>
                    <div class="social-project-row-progress">
                        <div class="social-project-row-progress-bar">
                            <div class="social-project-row-progress-fill" style="width:${taskPercent}%"></div>
                        </div>
                        <span class="social-project-row-progress-value">${taskPercent}%</span>
                    </div>
                </div>
            `;
        };
        const renderCreateWorkspaceForm = () => {
            const selectedChips = projectInviteSelectedIds.length
                ? `<div class="drawer-selected-chips">${projectInviteSelectedIds.map((userId) => {
                    const account = accountById(userId) || { id: userId };
                    return `<span class="drawer-chip">${escape(displayName(account))} <button type="button" data-action="project-selected-remove" data-user-id="${escape(text(userId))}"><i class="fas fa-times"></i></button></span>`;
                }).join('')}</div>`
                : '';
            return `
                <form data-form="create-project" class="social-project-drawer-form">
                    <div class="drawer-section">
                        <div class="drawer-section-title">Basic info</div>
                        <div class="social-neo-grid-2">
                            <label><span class="social-neo-label">Title</span><input class="social-neo-input" type="text" name="projectName" value="${escape(text(runtime.ui?.projectName || ''))}" placeholder="Smart irrigation prototype"></label>
                            <label><span class="social-neo-label">Course / module</span><input class="social-neo-input" type="text" name="projectCourseTag" value="${escape(text(runtime.ui?.projectCourseTag || ''))}" placeholder="CS401 Capstone"></label>
                        </div>
                        <label><span class="social-neo-label">Summary</span><input class="social-neo-input" type="text" name="projectSummary" value="${escape(text(runtime.ui?.projectSummary || ''))}" placeholder="Cross-faculty automation project for greenhouse monitoring"></label>
                        <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" name="projectDescription" rows="3" placeholder="What is the project, what problem are you solving, and what will the team deliver?">${escape(text(runtime.ui?.projectDescription || ''))}</textarea></label>
                    </div>
                    <div class="drawer-section">
                        <div class="drawer-section-title">Settings</div>
                        <div class="social-neo-grid-3">
                            <label><span class="social-neo-label">Status</span><select class="social-neo-select" name="projectStatus">${['idea','active','review','completed'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'idea') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}</select></label>
                            <label><span class="social-neo-label">Visibility</span><select class="social-neo-select" name="projectVisibility">${['private','faculty','public'].map((visibility) => `<option value="${escape(visibility)}" ${text(runtime.ui?.projectVisibility || 'private') === visibility ? 'selected' : ''}>${escape(visibility)}</option>`).join('')}</select></label>
                            <label><span class="social-neo-label">Advisor</span><select class="social-neo-select" name="projectAdvisorUserId"><option value="">No advisor yet</option>${advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(runtime.ui?.projectAdvisorUserId || '') === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}</select></label>
                        </div>
                        <div class="social-neo-grid-2">
                            <label><span class="social-neo-label">Recommended team size</span><input class="social-neo-input" type="number" min="2" name="projectRecommendedTeamSize" value="${escape(text(runtime.ui?.projectRecommendedTeamSize || 4))}"></label>
                            <label><span class="social-neo-label">Minimum team size</span><input class="social-neo-input" type="number" min="2" name="projectMinTeamSize" value="${escape(text(runtime.ui?.projectMinTeamSize || 4))}"></label>
                        </div>
                        <label><span class="social-neo-label">Skills / roles</span><input class="social-neo-input" type="text" name="projectSkillTags" value="${escape(text(runtime.ui?.projectSkillTags || ''))}" placeholder="developer, designer, researcher, analyst"></label>
                        <div>
                            <span class="social-neo-label">Faculties involved</span>
                            <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                ${facultyOptions.map((facultyCode) => `<button class="social-neo-btn ${projectFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="drawer-section">
                        <div class="drawer-section-title">Seed the team <span class="drawer-section-count">${escape(String(projectInviteSelectedIds.length))} selected</span></div>
                        <div class="social-neo-directory-filters">
                            <input class="social-neo-input" type="search" name="projectInviteSearch" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}" placeholder="Search by name, faculty, role, or interests">
                            <select class="social-neo-select" name="projectInviteFaculty">
                                <option value="all" ${inviteFaculty === 'all' ? 'selected' : ''}>All faculties</option>
                                ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${inviteFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode)}</option>`).join('')}
                            </select>
                        </div>
                        ${selectedChips}
                        <div class="social-project-scroll-list social-project-scroll-list--invite">
                            <div class="social-neo-stack">
                                ${filteredInviteCandidates.length ? filteredInviteCandidates.map((account) => `
                                    <div class="social-neo-entity-card">
                                        <div class="social-neo-person">
                                            ${avatar(account, 'social-neo-avatar-sm')}
                                            <div>
                                                <strong>${escape(displayName(account))}</strong>
                                                <div class="social-neo-muted">${escape(accountSubtitle(account))}</div>
                                            </div>
                                        </div>
                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-selected-add" data-user-id="${escape(text(account.id))}">
                                            <i class="fas fa-user-plus"></i> Add
                                        </button>
                                    </div>
                                `).join('') : `<div class="social-neo-empty">No people match the current search.</div>`}
                            </div>
                        </div>
                    </div>
                    <div class="drawer-submit">
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-diagram-project"></i> Create workspace</button>
                    </div>
                </form>
            `;
        };

        if (!activeProject) {
            const totalTasks = projects.reduce((sum, project) => sum + countNum(project?.taskCount), 0);
            const totalActivity = projects.reduce((sum, project) => sum + countNum(project?.activityCount), 0);
            return `
                <div class="social-neo-stack social-projects-shell">
                    <div class="social-projects-header">
                        <div>
                            <h2>Project Workspaces</h2>
                            <span class="social-neo-muted">Structured studios for cross-faculty team delivery.</span>
                        </div>
                        <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-create-open">
                            <i class="fas fa-plus"></i> Create workspace
                        </button>
                    </div>
                    <div class="social-projects-stats-bar">
                        <div class="social-projects-stat-item">
                            <span class="social-projects-stat-number">${escape(String(projects.length))}</span>
                            <span class="social-projects-stat-label">Workspaces</span>
                        </div>
                        <div class="social-projects-stat-item">
                            <span class="social-projects-stat-number">${escape(String(myProjects.length))}</span>
                            <span class="social-projects-stat-label">Your roles</span>
                        </div>
                        <div class="social-projects-stat-item">
                            <span class="social-projects-stat-number">${escape(String(totalTasks))}</span>
                            <span class="social-projects-stat-label">Tasks</span>
                        </div>
                        <div class="social-projects-stat-item">
                            <span class="social-projects-stat-number">${escape(String(facultyOptions.length))}</span>
                            <span class="social-projects-stat-label">Faculties</span>
                        </div>
                        <div class="social-projects-stat-item">
                            <span class="social-projects-stat-number">${escape(String(totalActivity))}</span>
                            <span class="social-projects-stat-label">Activity</span>
                        </div>
                    </div>
                    <section class="social-neo-card">
                        <div class="social-neo-section-head">
                            <div><strong>Your workspaces</strong><span>Projects where you already have a role or oversight.</span></div>
                            <span class="social-neo-pill"><strong>${escape(String(myProjects.length))}</strong></span>
                        </div>
                        ${scrollList('social-project-scroll-list--hub', `
                        <div class="social-neo-stack">
                            ${myProjects.length ? myProjects.map(renderProjectCard).join('') : `<div class="social-neo-empty">No workspaces yet. Create your first project studio to start organizing the team.</div>`}
                        </div>
                        `)}
                    </section>
                    <section class="social-neo-card">
                        <div class="social-neo-section-head">
                            <div><strong>Most active studios</strong><span>Workspaces with the strongest project pulse right now.</span></div>
                            <span class="social-neo-pill"><strong>${escape(String(featuredProjects.length))}</strong></span>
                        </div>
                        ${scrollList('social-project-scroll-list--compact', `
                        <div class="social-project-rows">
                            ${featuredProjects.length ? featuredProjects.map(renderProjectRow).join('') : `<div class="social-neo-empty">Project workspaces will appear here once teams start working.</div>`}
                        </div>
                        `)}
                    </section>
                    <div class="social-project-create-drawer" id="project-create-drawer" hidden>
                        <div class="social-project-create-drawer-backdrop" data-action="project-create-close"></div>
                        <div class="social-project-create-drawer-left">
                            <div class="social-project-create-drawer-left-head">
                                <div>
                                    <h2>Project Workspaces</h2>
                                    <span class="social-neo-muted">Your existing studios and active projects.</span>
                                </div>
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-create-close"><i class="fas fa-times"></i></button>
                            </div>
                            ${scrollList('social-project-scroll-list--drawer-left', `
                            <div class="social-neo-stack">
                                ${projects.length ? projects.map(renderProjectCard).join('') : `<div class="social-neo-empty">No workspaces yet.</div>`}
                            </div>
                            `)}
                        </div>
                        <div class="social-project-create-drawer-panel">
                            <div class="social-project-create-drawer-head">
                                <strong>Create workspace</strong>
                            </div>
                            ${renderCreateWorkspaceForm()}
                        </div>
                    </div>
                </div>
            `;
        }

        const owner = accountById(activeProject?.ownerUserId) || { id: activeProject?.ownerUserId };
        const projectTasks = Array.isArray(activeProject?.tasks) ? activeProject.tasks : [];
        const projectMilestones = Array.isArray(activeProject?.milestones) ? activeProject.milestones : [];
        const projectDeliverables = Array.isArray(activeProject?.deliverables) ? activeProject.deliverables : [];
        const projectCheckins = Array.isArray(activeProject?.checkins) ? activeProject.checkins : [];
        const projectActivity = Array.isArray(activeProject?.activity) ? activeProject.activity : [];
        const projectMeetings = Array.isArray(activeProject?.meetings) ? activeProject.meetings : [];
        const memberSummaries = Array.isArray(activeProject?.memberSummaries) ? activeProject.memberSummaries : [];
        const pendingMemberIds = Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : [];
        const pendingMembers = pendingMemberIds.map((userId) => ({ userId, role: text(activeProject?.memberRolesByUser?.[userId] || 'member') || 'member' }));
        const taskCounts = activeProject?.taskStatusCounts || {};
        const deliverableCounts = activeProject?.deliverableReviewCounts || {};
        const advisorAccounts = uniqueStrings([text(activeProject?.advisorUserId || ''), ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])]).filter(Boolean).map((userId) => accountById(userId) || { id: userId });
        const nextOwnerId = text(activeProject?.nextOwnerUserId || '');
        const nextOwner = nextOwnerId ? accountById(nextOwnerId) || { id: nextOwnerId } : null;
        const readinessPercent = Math.round(((countNum(activeProject?.taskCompletionPercent) + countNum(activeProject?.milestoneCompletionPercent) + (projectDeliverables.length ? Math.min(100, Math.round((countNum(deliverableCounts.approved || 0) / projectDeliverables.length) * 100)) : 0)) / 3));
        const healthNote = countNum(taskCounts.blocked) > 0 ? `${countNum(taskCounts.blocked)} blocked tasks need attention` : (countNum(activeProject?.milestoneOverdueCount) > 0 ? `${countNum(activeProject?.milestoneOverdueCount)} overdue milestones` : 'Delivery rhythm looks healthy');
        const renderTeamMemberCard = (entry, options = {}) => {
            const pending = Boolean(options?.pending);
            const account = accountById(entry.userId) || { id: entry.userId };
            const role = text(entry.role || 'member') || 'member';
            return `
                <article class="social-neo-card social-project-team-card">
                    <div class="social-project-team-card-head">
                        <div class="social-neo-person social-neo-person-start-gap-12">
                            ${avatar(account)}
                            <div>
                                <strong>${escape(displayName(account))}</strong>
                                <div class="social-neo-muted">${escape(accountSubtitle(account))}</div>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                    ${projectRolePill(role)}
                                    <span class="social-neo-pill">${escape(text(account?.facultyCode || account?.faculty || entry.facultyCode || 'Faculty not set'))}</span>
                                    <span class="social-neo-pill">${escape(text(account?.presenceLabel || entry.presenceLabel || 'Offline'))}</span>
                                    ${pending ? `<span class="social-neo-pill">Invited</span>` : ''}
                                </div>
                                ${text(entry.joinedAt || '') && !pending ? `<div class="social-neo-muted social-neo-muted-mt-8">Joined ${escape(when(entry.joinedAt))}</div>` : ''}
                            </div>
                        </div>
                        <div class="social-project-team-actions">
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="message-start" data-user-id="${escape(text(account.id))}"><i class="fas fa-paper-plane"></i> Message</button>
                            ${activeProject.isManager && text(entry.userId) !== text(activeProject.ownerUserId || '') ? `
                                ${role !== 'member' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="member">Make member</button>` : ''}
                                ${role !== 'advisor' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="advisor">Promote to advisor</button>` : ''}
                                ${role !== 'instructor-viewer' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="instructor-viewer">Set instructor viewer</button>` : ''}
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-remove" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}">Remove member</button>
                            ` : ''}
                        </div>
                    </div>
                </article>
            `;
        };
        const renderTaskCard = (task, columnId) => {
            const assignee = accountById(task?.assigneeUserId) || { id: task?.assigneeUserId };
            const dueAt = text(task?.dueAt || '');
            const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
            const now = Date.now();
            const isOverdue = Boolean(dueMs && dueMs < now && text(task?.status || '') !== 'done');
            const isToday = Boolean(dueMs && !isOverdue && new Date(dueMs).toDateString() === new Date(now).toDateString());
            const isSoon = Boolean(dueMs && !isOverdue && !isToday && dueMs < now + 7 * 86400000);
            const priority = text(task?.priority || 'medium').toLowerCase() || 'medium';
            const tag = text(task?.tag || task?.category || '');
            const columnIndex = taskColumns.findIndex((c) => c.id === columnId);
            const canMoveLeft = columnIndex > 0;
            const canMoveRight = columnIndex < taskColumns.length - 1;
            return `
                <article class="social-project-task-card ${isOverdue ? 'is-overdue' : ''}" data-priority="${escape(priority)}">
                    <div class="social-project-task-card-head">
                        <strong>${escape(text(task?.title || 'Task'))}</strong>
                        <span class="social-neo-pill social-project-priority-pill" data-priority="${escape(priority)}"><i class="fas fa-flag"></i>${escape(priority)}</span>
                    </div>
                    ${text(task?.description) ? `<p class="social-project-task-desc">${escape(text(task.description))}</p>` : ''}
                    <div class="social-neo-badge-row social-project-task-meta">
                        ${tag ? `<span class="social-neo-pill social-project-task-tag"><i class="fas fa-tag"></i>${escape(tag)}</span>` : ''}
                        ${task?.assigneeUserId ? `<span class="social-neo-pill social-project-task-assignee">${avatar(assignee, 'social-neo-avatar-xs')}${escape(displayName(assignee))}</span>` : '<span class="social-neo-pill social-project-task-assignee is-unassigned"><i class="fas fa-user"></i>Unassigned</span>'}
                        ${dueAt ? `<span class="social-neo-pill social-project-task-due ${isOverdue ? 'is-overdue' : isToday ? 'is-today' : isSoon ? 'is-soon' : ''}"><i class="fas fa-clock"></i>${escape(when(dueAt))}</span>` : ''}
                    </div>
                    <div class="social-project-task-actions">
                        ${canMoveLeft ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Move to ${escape(taskColumns[columnIndex - 1].label)}" data-action="project-task-move" data-project-id="${escape(text(activeProject.id))}" data-task-id="${escape(text(task.id))}" data-status="${escape(taskColumns[columnIndex - 1].id)}"><i class="fas fa-arrow-left"></i></button>` : ''}
                        ${canMoveRight ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Move to ${escape(taskColumns[columnIndex + 1].label)}" data-action="project-task-move" data-project-id="${escape(text(activeProject.id))}" data-task-id="${escape(text(task.id))}" data-status="${escape(taskColumns[columnIndex + 1].id)}"><i class="fas fa-arrow-right"></i></button>` : ''}
                        ${activeProject.viewerCanContribute ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Delete task" data-action="project-task-delete" data-project-id="${escape(text(activeProject.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </article>
            `;
        };
        const renderTaskStatsBar = (tasks) => {
            const total = tasks.length;
            const now = Date.now();
            const overdue = tasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
            const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
            const blocked = tasks.filter((t) => t.status === 'blocked').length;
            const done = tasks.filter((t) => t.status === 'done').length;
            return `
                <div class="social-project-task-stats-bar">
                    <div class="social-project-task-stat"><strong>${escape(String(total))}</strong><span>Total</span></div>
                    <div class="social-project-task-stat ${overdue > 0 ? 'is-danger' : ''}"><strong>${escape(String(overdue))}</strong><span>Overdue</span></div>
                    <div class="social-project-task-stat"><strong>${escape(String(inProgress))}</strong><span>In progress</span></div>
                    <div class="social-project-task-stat"><strong>${escape(String(blocked))}</strong><span>Blocked</span></div>
                    <div class="social-project-task-stat"><strong>${escape(String(done))}</strong><span>Done</span></div>
                </div>
            `;
        };
        const renderTaskSearchBar = () => {
            const searchVal = text(runtime.ui?.projectTaskSearch || '');
            const priorityVal = text(runtime.ui?.projectTaskFilterPriority || 'all');
            const assigneeVal = text(runtime.ui?.projectTaskFilterAssignee || 'all');
            const myOnly = Boolean(runtime.ui?.projectTaskMyOnly);
            return `
                <div class="social-project-task-search">
                    <div class="social-project-task-search-row">
                        <button class="social-neo-btn ${myOnly ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-task-toggle-my"><i class="fas fa-user"></i> My tasks</button>
                        <div class="social-project-task-search-input">
                            <i class="fas fa-search"></i>
                            <input class="social-neo-input" type="search" name="projectTaskSearch" value="${escape(searchVal)}" placeholder="Search tasks...">
                        </div>
                        <select class="social-neo-select social-neo-select-sm" name="projectTaskFilterPriority" data-lux-native>
                            <option value="all" ${priorityVal === 'all' ? 'selected' : ''}>All priorities</option>
                            ${['low','medium','high'].map((p) => `<option value="${escape(p)}" ${priorityVal === p ? 'selected' : ''}>${escape(p)}</option>`).join('')}
                        </select>
                        <select class="social-neo-select social-neo-select-sm" name="projectTaskFilterAssignee" data-lux-native>
                            <option value="all" ${assigneeVal === 'all' ? 'selected' : ''}>All members</option>
                            ${memberSummaries.map((entry) => `<option value="${escape(text(entry.userId))}" ${assigneeVal === text(entry.userId) ? 'selected' : ''}>${escape(displayName(accountById(entry.userId) || { id: entry.userId }))}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;
        };
        const renderColumnQuickAdd = (column) => {
            if (!activeProject.viewerCanContribute) return '';
            return `
                <div class="social-project-task-column-footer">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-project-task-quick-add-btn" type="button" data-action="project-task-quick-add" data-column="${escape(column.id)}">
                        <i class="fas fa-plus"></i> Add task
                    </button>
                </div>
            `;
        };
        const renderMilestoneCard = (milestone) => {
            const dueMs = Number.isFinite(Date.parse(text(milestone?.dueAt || ''))) ? Date.parse(text(milestone?.dueAt || '')) : null;
            const stateLabel = milestone?.completed ? 'completed' : (dueMs && dueMs < Date.now() ? 'overdue' : 'upcoming');
            return `
                <article class="social-project-milestone-item is-${escape(stateLabel)}">
                    <div class="social-project-milestone-marker"></div>
                    <div class="social-project-milestone-body">
                        <div class="social-project-milestone-head">
                            <div>
                                <strong>${escape(text(milestone?.title || 'Milestone'))}</strong>
                                <span>${escape(text(milestone?.description || 'No description yet.'))}</span>
                            </div>
                            <div class="social-neo-badge-row">
                                <span class="social-neo-pill">${escape(stateLabel)}</span>
                                ${text(milestone?.dueAt || '') ? `<span class="social-neo-pill">${escape(when(milestone.dueAt))}</span>` : ''}
                            </div>
                        </div>
                        <div class="social-project-milestone-actions">
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-milestone-toggle" data-project-id="${escape(text(activeProject.id))}" data-milestone-id="${escape(text(milestone.id))}" data-completed="${milestone.completed ? '0' : '1'}">${milestone.completed ? 'Mark pending' : 'Mark complete'}</button>
                            ${activeProject.viewerCanContribute ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-milestone-delete" data-project-id="${escape(text(activeProject.id))}" data-milestone-id="${escape(text(milestone.id))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                        </div>
                    </div>
                </article>
            `;
        };
        const renderDeliverableCard = (deliverable) => {
            const submitter = accountById(deliverable?.submittedById) || { id: deliverable?.submittedById };
            return `
                <article class="social-neo-card social-project-deliverable-card">
                    <div class="social-project-deliverable-head">
                        <div>
                            <strong>${escape(text(deliverable?.title || 'Deliverable'))}</strong>
                            <span>${escape(text(deliverable?.description || 'No submission notes added.'))}</span>
                        </div>
                        <div class="social-neo-badge-row">
                            <span class="social-neo-pill">${escape(text(deliverable?.versionLabel || 'v1'))}</span>
                            <span class="social-neo-pill">${escape(text(deliverable?.reviewStatus || 'draft'))}</span>
                        </div>
                    </div>
                    <div class="social-project-deliverable-meta">
                        <div class="social-neo-person">
                            ${avatar(submitter, 'social-neo-avatar-sm')}
                            <div>
                                <strong>${escape(displayName(submitter))}</strong>
                                <span>${escape(when(deliverable?.submittedAt || deliverable?.createdAt || ''))}</span>
                            </div>
                        </div>
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                            ${deliverable?.file ? `<a class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" href="${escape(deliverable.file.url || '#')}" target="_blank" rel="noreferrer"><i class="fas fa-download"></i> Open file</a>` : ''}
                            ${activeProject.viewerCanContribute ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-deliverable-delete" data-project-id="${escape(text(activeProject.id))}" data-deliverable-id="${escape(text(deliverable.id))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                        </div>
                    </div>
                </article>
            `;
        };
        const activityIconMap = {
            'project-created': 'fa-rocket',
            'project-updated': 'fa-pen',
            'member-invited': 'fa-user-plus',
            'member-role-updated': 'fa-user-shield',
            'member-removed': 'fa-user-minus',
            'member-left': 'fa-door-open',
            'task-created': 'fa-square-plus',
            'task-updated': 'fa-list-check',
            'task-deleted': 'fa-trash',
            'milestone-created': 'fa-flag',
            'milestone-updated': 'fa-flag-checkered',
            'milestone-deleted': 'fa-trash',
            'deliverable-submitted': 'fa-box-archive',
            'deliverable-removed': 'fa-trash',
            'checkin-posted': 'fa-comment-dots',
            'showcase-created': 'fa-globe'
        };
        const renderOverviewTab = () => `
            <section class="social-neo-stack">

                <div class="social-project-ov-row social-project-ov-row--alerts">
                    ${renderHealthIndicator(activeProject)}
                    ${renderTaskStatusDonut(activeProject)}
                </div>

                <div class="social-project-overview-stats-strip">
                    <div class="social-project-overview-stat-ring">
                        ${renderMiniProgressRing(activeProject?.taskCompletionPercent || 0, '#f97316')}
                        <span>Tasks</span>
                    </div>
                    <div class="social-project-overview-stat-ring">
                        ${renderMiniProgressRing(activeProject?.milestoneCompletionPercent || 0, '#3b82f6')}
                        <span>Milestones</span>
                    </div>
                    <div class="social-project-overview-stat">
                        <strong>${escape(String(countNum(activeProject?.deliverableCount)))}</strong>
                        <span>Files</span>
                    </div>
                    <div class="social-project-overview-stat">
                        <strong>${escape(String(countNum(activeProject?.memberCount)))}</strong>
                        <span>Team</span>
                    </div>
                    <div class="social-project-overview-stat-spark">
                        ${renderMiniSparkline(activeProject?.activityBuckets || [], 120, 36)}
                        <div><strong>${escape(String(countNum(activeProject?.activityCount)))}</strong><span>Events</span></div>
                    </div>
                </div>

                <div class="social-project-ov-row social-project-ov-row--b2">
                    ${renderMyTasks(activeProject)}
                    ${renderTeamRoster(activeProject, memberSummaries)}
                </div>

                <div class="social-project-ov-row social-project-ov-row--activity-files">
                    <section class="social-neo-card social-project-feed-card">
                        <div class="social-neo-section-head">
                            <div><strong>Recent activity</strong><span>Latest workspace changes.</span></div>
                            <span class="social-neo-pill">${escape(String(activeProject?.activityCount || 0))} events</span>
                        </div>
                        <div class="social-project-feed-sparkline">
                            ${renderSparkline(activeProject?.activityBuckets || [])}
                        </div>
                        ${(Array.isArray(activeProject?.activity) ? activeProject.activity.slice(0, 5) : []).length ? `<div class="social-project-activity-feed">${(Array.isArray(activeProject?.activity) ? activeProject.activity.slice(0, 5) : []).map(renderActivityItem).join('')}</div>` : '<div class="social-neo-empty">No activity recorded yet.</div>'}
                        <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(activeProject?.id))}" data-project-tab="activity">View all activity →</span></div>
                    </section>
                    ${renderRecentFiles(activeProject)}
                </div>

                <div class="social-project-ov-row social-project-ov-row--b2">
                    ${renderNextMeeting(activeProject)}
                    ${renderQuickActions(activeProject)}
                </div>

                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Workspace brief</strong><span>Scope, faculty mix, and ownership.</span></div>
                        <span class="social-neo-pill">${escape(text(statusMeta[text(activeProject.status || 'idea')]?.label || activeProject.status || 'idea'))}</span>
                    </div>
                    <p class="social-project-body-copy">${escape(text(activeProject.description || activeProject.summary || 'No description added yet.'))}</p>
                    <div class="social-neo-badge-row">
                        ${facultyPills(activeProject.facultyCodes)}
                        ${skillPills(activeProject.skillTags)}
                        ${text(activeProject.courseTag) ? `<span class="social-neo-pill">${escape(activeProject.courseTag)}</span>` : ''}
                    </div>
                    <div class="social-project-people-grid">
                        <article class="social-neo-card social-project-mini-card">
                            <span class="social-neo-label">Owner</span>
                            <div class="social-neo-person">${avatar(owner, 'social-neo-avatar-sm')}<div><strong>${escape(displayName(owner))}</strong><span>${escape(accountSubtitle(owner))}</span></div></div>
                        </article>
                        <article class="social-neo-card social-project-mini-card">
                            <span class="social-neo-label">Advisor / viewers</span>
                            <div class="social-neo-badge-row">
                                ${advisorAccounts.length ? advisorAccounts.map((account) => `<span class="social-neo-pill">${escape(displayName(account))}</span>`).join('') : '<span class="social-neo-muted">No advisor assigned yet.</span>'}
                            </div>
                        </article>
                    </div>
                </section>
            </section>
        `;
        const renderTeamTab = () => `
            <section class="social-neo-stack">
                <div class="social-project-dashboard-grid">
                    <section class="social-neo-card social-project-chart-card">
                        <div class="social-neo-section-head">
                            <div><strong>Faculty composition</strong><span>Who is contributing across faculties.</span></div>
                            <span class="social-neo-pill">${escape(String(activeProject?.memberCount || 0))} members</span>
                        </div>
                        <div class="social-project-composition-list">
                            ${(Array.isArray(activeProject?.facultyMix) ? activeProject.facultyMix : []).length ? activeProject.facultyMix.map((entry) => `<article><strong>${escape(text(entry.facultyCode || 'Unknown'))}</strong><span>${escape(String(entry.count || 0))} members</span></article>`).join('') : `<div class="social-neo-empty">No faculty mix yet.</div>`}
                        </div>
                    </section>
                    <section class="social-neo-card social-project-chart-card">
                        <div class="social-neo-section-head">
                            <div><strong>Role split</strong><span>Owner, member, advisor, and instructor visibility.</span></div>
                        </div>
                        <div class="social-project-composition-list">
                            ${(Array.isArray(activeProject?.roleMix) ? activeProject.roleMix : []).map((entry) => `<article><strong>${escape(roleLabels[text(entry.role)] || text(entry.role))}</strong><span>${escape(String(entry.count || 0))}</span></article>`).join('')}
                        </div>
                    </section>
                    <section class="social-neo-card social-project-chart-card">
                        <div class="social-neo-section-head">
                            <div><strong>Leave workspace</strong><span>Project history is preserved even if you leave.</span></div>
                            ${nextOwner ? `<span class="social-neo-pill">Next owner: ${escape(displayName(nextOwner))}</span>` : ''}
                        </div>
                        <div class="social-project-leave-card">
                            <p>${escape(text(activeProject.role || '') === 'owner' ? (nextOwner ? `If you leave now, ownership transfers to ${displayName(nextOwner)}.` : 'If you leave now and nobody remains, this workspace becomes ownerless but stays intact.') : 'Leave the team without deleting chat, files, tasks, milestones, or activity history.')}</p>
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-leave-open" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-sign-out-alt"></i> Leave workspace</button>
                        </div>
                    </section>
                </div>
                ${activeProject.isManager ? `
                    <section class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Invite member</strong><span>Search people and add members, advisors, or instructor viewers.</span></div>
                            <span class="social-neo-pill">${escape(String(filteredInviteCandidates.length))} candidates</span>
                        </div>
                        <div class="social-neo-directory-filters">
                            <input class="social-neo-input" type="search" name="projectInviteSearch" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}" placeholder="Search by name, faculty, role, or interests">
                            <select class="social-neo-select" name="projectInviteFaculty">
                                <option value="all" ${inviteFaculty === 'all' ? 'selected' : ''}>All faculties</option>
                                ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${inviteFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode)}</option>`).join('')}
                            </select>
                        </div>
                        ${scrollList('social-project-scroll-list--invite', `
                        <div class="social-neo-stack social-neo-stack-mt-14">
                            ${filteredInviteCandidates.length ? filteredInviteCandidates.map((account) => `
                                <article class="social-neo-card social-project-invite-row">
                                    <div class="social-neo-person">
                                        ${avatar(account)}
                                        <div>
                                            <strong>${escape(displayName(account))}</strong>
                                            <span>${escape(accountSubtitle(account))}</span>
                                        </div>
                                    </div>
                                    <div class="social-project-team-actions">
                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="member">Invite member</button>
                                        ${isStaffAccount(account) ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="advisor">Promote to advisor</button>` : ''}
                                        ${isStaffAccount(account) ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="instructor-viewer">Set instructor viewer</button>` : ''}
                                    </div>
                                </article>
                            `).join('') : `<div class="social-neo-empty">No invite candidates match the current filters.</div>`}
                        </div>
                        `)}
                    </section>
                ` : ''}
                ${pendingMembers.length ? `
                    <section class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Pending invites</strong><span>People who have been invited but have not joined yet.</span></div>
                        </div>
                        ${scrollList('social-project-scroll-list--members', `<div class="social-neo-stack">${pendingMembers.map((entry) => renderTeamMemberCard(entry, { pending: true })).join('')}</div>`)}
                    </section>
                ` : ''}
                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Active team</strong><span>${escape(String(activeProject.memberCount || 0))} members with visible role and presence cards.</span></div>
                    </div>
                    ${scrollList('social-project-scroll-list--members', `<div class="social-neo-stack">${memberSummaries.map((entry) => renderTeamMemberCard(entry)).join('')}</div>`)}
                </section>
            </section>
        `;
        const renderTasksTab = () => {
            const formOpen = Boolean(runtime.ui?.projectTaskFormOpen);
            const searchText = text(runtime.ui?.projectTaskSearch || '').toLowerCase();
            const filterPriority = text(runtime.ui?.projectTaskFilterPriority || 'all');
            const filterAssignee = text(runtime.ui?.projectTaskFilterAssignee || 'all');
            const myOnly = Boolean(runtime.ui?.projectTaskMyOnly);
            const userId = currentUserId();
            let filteredTasks = projectTasks;
            if (myOnly) filteredTasks = filteredTasks.filter((t) => text(t.assigneeUserId) === userId);
            if (searchText) filteredTasks = filteredTasks.filter((t) => text(t.title || '').toLowerCase().includes(searchText) || text(t.description || '').toLowerCase().includes(searchText));
            if (filterPriority !== 'all') filteredTasks = filteredTasks.filter((t) => text(t.priority || 'medium').toLowerCase() === filterPriority);
            if (filterAssignee !== 'all') filteredTasks = filteredTasks.filter((t) => text(t.assigneeUserId) === filterAssignee);
            return `
                <section class="social-neo-stack">
                    ${activeProject.viewerCanContribute ? `
                        <article class="social-neo-card social-project-task-form-wrap">
                            <button class="social-project-task-form-toggle" type="button" data-action="project-task-toggle-form">
                                <span><i class="fas fa-plus"></i> Create task</span>
                                <i class="fas fa-chevron-${formOpen ? 'up' : 'down'}"></i>
                            </button>
                            <div class="social-project-task-form-body" ${formOpen ? '' : 'hidden'}>
                                <form data-form="project-task-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack">
                                    <div class="social-neo-grid-2">
                                        <label><span class="social-neo-label">Task title</span><input class="social-neo-input" type="text" name="projectTaskTitle" value="${escape(text(runtime.ui?.projectTaskTitle || ''))}"></label>
                                        <label><span class="social-neo-label">Assignee</span><select class="social-neo-select" name="projectTaskAssigneeId" data-lux-native><option value="">Unassigned</option>${memberSummaries.map((entry) => `<option value="${escape(text(entry.userId))}" ${text(runtime.ui?.projectTaskAssigneeId || '') === text(entry.userId) ? 'selected' : ''}>${escape(displayName(accountById(entry.userId) || { id: entry.userId }))}</option>`).join('')}</select></label>
                                    </div>
                                    <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="3" name="projectTaskDescription">${escape(text(runtime.ui?.projectTaskDescription || ''))}</textarea></label>
                                    <div class="social-neo-grid-3">
                                        <label><span class="social-neo-label">Due date</span><input class="social-neo-input" type="datetime-local" name="projectTaskDueAt" value="${escape(text(runtime.ui?.projectTaskDueAt || ''))}"></label>
                                        <label><span class="social-neo-label">Priority</span><select class="social-neo-select" name="projectTaskPriority" data-lux-native>${['low','medium','high'].map((priority) => `<option value="${escape(priority)}" ${text(runtime.ui?.projectTaskPriority || 'medium') === priority ? 'selected' : ''}>${escape(priority)}</option>`).join('')}</select></label>
                                        <label><span class="social-neo-label">Column</span><select class="social-neo-select" name="projectTaskStatus" data-lux-native>${taskColumns.map((column) => `<option value="${escape(column.id)}">${escape(column.label)}</option>`).join('')}</select></label>
                                    </div>
                                    <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-plus"></i> Create task</button></div>
                                </form>
                            </div>
                        </article>
                    ` : ''}
                    ${renderTaskStatsBar(filteredTasks)}
                    ${renderTaskSearchBar()}
                    <div class="social-project-task-board">
                        ${taskColumns.map((column) => {
                            const columnTasks = filteredTasks.filter((task) => text(task?.status || 'backlog') === column.id);
                            return `
                                <section class="social-project-task-column" data-tone="${escape(column.tone)}">
                                    <div class="social-project-task-column-head">
                                        <div>
                                            <strong>${escape(column.label)}</strong>
                                            <span>${escape(String(columnTasks.length))} ${columnTasks.length === 1 ? 'task' : 'tasks'}</span>
                                        </div>
                                        <em class="social-project-task-column-count is-${escape(column.tone)}">${escape(String(columnTasks.length))}</em>
                                    </div>
                                    ${scrollList('social-project-scroll-list--tasks', `<div class="social-neo-stack">
                                        ${columnTasks.length ? columnTasks.map((task) => renderTaskCard(task, column.id)).join('') : `<div class="social-neo-empty">No tasks in ${escape(column.label.toLowerCase())}.</div>`}
                                    </div>`)}
                                    ${renderColumnQuickAdd(column)}
                                </section>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        };
        const renderMilestonesTab = () => `
            <section class="social-neo-stack">
                ${activeProject.viewerCanContribute ? `
                    <article class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Create milestone</strong><span>Track phases, deadlines, and review checkpoints.</span></div>
                        </div>
                        <form data-form="project-milestone-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack">
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Milestone title</span><input class="social-neo-input" type="text" name="projectMilestoneTitle" value="${escape(text(runtime.ui?.projectMilestoneTitle || ''))}"></label>
                                <label><span class="social-neo-label">Due date</span><input class="social-neo-input" type="datetime-local" name="projectMilestoneDueAt" value="${escape(text(runtime.ui?.projectMilestoneDueAt || ''))}"></label>
                            </div>
                            <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="3" name="projectMilestoneDescription">${escape(text(runtime.ui?.projectMilestoneDescription || ''))}</textarea></label>
                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Add milestone</button></div>
                        </form>
                    </article>
                ` : ''}
                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Milestone timeline</strong><span>Upcoming, overdue, and completed phases in delivery order.</span></div>
                    </div>
                    ${scrollList('social-project-scroll-list--milestones', `<div class="social-project-milestone-list">${projectMilestones.length ? projectMilestones.map((milestone) => renderMilestoneCard(milestone)).join('') : `<div class="social-neo-empty">No milestones yet.</div>`}</div>`)}
                </section>
            </section>
        `;
        const renderDeliverablesTab = () => `
            <section class="social-neo-stack">
                ${activeProject.viewerCanContribute ? `
                    <article class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Submit deliverable</strong><span>Version files and keep the review trail visible to the team.</span></div>
                        </div>
                        <form data-form="project-deliverable-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack">
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Deliverable title</span><input class="social-neo-input" type="text" name="projectDeliverableTitle" value="${escape(text(runtime.ui?.projectDeliverableTitle || ''))}"></label>
                                <label><span class="social-neo-label">Version label</span><input class="social-neo-input" type="text" name="projectDeliverableVersion" value="${escape(text(runtime.ui?.projectDeliverableVersion || ''))}" placeholder="v1.0"></label>
                            </div>
                            <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" rows="3" name="projectDeliverableDescription">${escape(text(runtime.ui?.projectDeliverableDescription || ''))}</textarea></label>
                            <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-block social-neo-btn-pointer">
                                <i class="fas fa-paperclip"></i> Attach file
                                <input type="file" name="projectDeliverableFile" hidden>
                            </label>
                            ${renderFileChip(runtime.ui?.projectDeliverableFile, 'File ready to upload')}
                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Submit deliverable</button></div>
                        </form>
                    </article>
                ` : ''}
                ${scrollList('social-project-scroll-list--deliverables', `<div class="social-project-deliverable-grid">${projectDeliverables.length ? projectDeliverables.map((deliverable) => renderDeliverableCard(deliverable)).join('') : `<div class="social-neo-empty">No deliverables submitted yet.</div>`}</div>`)}
            </section>
        `;
        const renderMeetingsTab = () => `
            <section class="social-neo-stack">
                ${activeProject.viewerCanContribute ? `
                    <article class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Schedule checkpoint</strong><span>Project syncs, advisor reviews, and milestone demos stay linked to this workspace.</span></div>
                        </div>
                        <form data-form="project-meeting-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack">
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Meeting title</span><input class="social-neo-input" type="text" name="meetingTitle" placeholder="Weekly project sync"></label>
                                <label><span class="social-neo-label">Location / link</span><input class="social-neo-input" type="text" name="meetingLocation" placeholder="Room B204 / Zoom"></label>
                            </div>
                            <label><span class="social-neo-label">Agenda</span><textarea class="social-neo-textarea" rows="3" name="meetingDescription" placeholder="Discuss blockers, review milestone, assign next sprint work."></textarea></label>
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Starts</span><input class="social-neo-input" type="datetime-local" name="meetingStartsAt"></label>
                                <label><span class="social-neo-label">Ends</span><input class="social-neo-input" type="datetime-local" name="meetingEndsAt"></label>
                            </div>
                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Schedule meeting</button></div>
                        </form>
                    </article>
                ` : ''}
                ${scrollList('social-project-scroll-list--meetings', `<div class="social-neo-stack">
                    ${projectMeetings.length ? projectMeetings.map((meeting) => `
                        <article class="social-neo-card social-project-meeting-card">
                            <div class="social-project-meeting-head">
                                <div>
                                    <strong>${escape(text(meeting.title || 'Meeting'))}</strong>
                                    <span>${escape(text(meeting.description || 'No agenda yet.'))}</span>
                                </div>
                                <div class="social-neo-badge-row">
                                    <span class="social-neo-pill">${escape(when(meeting.startsAt || ''))}</span>
                                    ${meeting.isOnline ? `<span class="social-neo-pill">Online</span>` : ''}
                                </div>
                            </div>
                            <div class="social-project-meeting-footer">
                                <span>${escape(text(meeting.location || meeting.onlineLink || 'Location to be announced'))}</span>
                                <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                                    ${(() => {
                                        const safeOnlineLink = getSafeSocialExternalUrl(meeting?.onlineLink);
                                        return safeOnlineLink ? `<a class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" href="${escape(safeOnlineLink)}" target="_blank" rel="noreferrer">Join link</a>` : '';
                                    })()}
                                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(activeProject.groupId))}">Open feed</button>
                                </div>
                            </div>
                        </article>
                    `).join('') : `<div class="social-neo-empty">No meetings scheduled yet.</div>`}
                </div>`)}
            </section>
        `;
        const renderChatTab = () => `
            <section class="social-neo-card social-project-rich-panel">
                <div class="social-neo-section-head">
                    <div><strong>Workspace chat</strong><span>This workspace reuses the private backing group chat for files, calls, and member discussion.</span></div>
                </div>
                <div class="social-project-chat-launch">
                    <div>
                        <strong>${escape(text(activeProject.name))} chat room</strong>
                        <div class="social-neo-muted">${escape(activeProject.chatId ? 'Chat is ready for direct messages, files, and calls.' : 'Chat opens from the backing group.')}</div>
                    </div>
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-open-chat" data-project-id="${escape(text(activeProject.id))}">
                        <i class="fas fa-comments"></i> Open chat
                    </button>
                </div>
            </section>
        `;
        const renderCheckinsTab = () => `
            <section class="social-neo-card social-project-rich-panel">
                <div class="social-neo-section-head">
                    <div><strong>Weekly check-ins</strong><span>Capture progress, blockers, and the next step every week.</span></div>
                </div>
                ${activeProject.viewerCanContribute ? `
                    <form data-form="project-checkin-create" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack">
                        <div class="social-neo-grid-3">
                            <label><span class="social-neo-label">Done</span><textarea class="social-neo-textarea" rows="3" name="projectCheckinDone">${escape(text(runtime.ui?.projectCheckinDone || ''))}</textarea></label>
                            <label><span class="social-neo-label">Blockers</span><textarea class="social-neo-textarea" rows="3" name="projectCheckinBlockers">${escape(text(runtime.ui?.projectCheckinBlockers || ''))}</textarea></label>
                            <label><span class="social-neo-label">Next steps</span><textarea class="social-neo-textarea" rows="3" name="projectCheckinNextSteps">${escape(text(runtime.ui?.projectCheckinNextSteps || ''))}</textarea></label>
                        </div>
                        <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit">Post check-in</button></div>
                    </form>
                ` : ''}
                ${scrollList('social-project-scroll-list--checkins', `<div class="social-neo-stack social-neo-stack-mt-14">
                    ${projectCheckins.length ? projectCheckins.map((checkin) => {
                        const account = accountById(checkin.authorUserId) || { id: checkin.authorUserId };
                        return `
                            <article class="social-neo-card social-project-checkin-card">
                                <div class="social-neo-person">
                                    ${avatar(account, 'social-neo-avatar-sm')}
                                    <div>
                                        <strong>${escape(displayName(account))}</strong>
                                        <span>${escape(when(checkin.createdAt || ''))}</span>
                                    </div>
                                </div>
                                <div class="social-neo-grid-3">
                                    <div><span class="social-neo-label">Done</span><p>${escape(text(checkin.whatDone || ''))}</p></div>
                                    <div><span class="social-neo-label">Blockers</span><p>${escape(text(checkin.blockers || ''))}</p></div>
                                    <div><span class="social-neo-label">Next steps</span><p>${escape(text(checkin.nextSteps || ''))}</p></div>
                                </div>
                            </article>
                        `;
                    }).join('') : `<div class="social-neo-empty">No check-ins yet.</div>`}
                </div>`)}
            </section>
        `;
        const renderActivityTab = () => `
            <section class="social-neo-card social-project-rich-panel">
                <div class="social-neo-section-head">
                    <div><strong>Workspace timeline</strong><span>Every material project update, from tasks to showcase publishing.</span></div>
                </div>
                ${scrollList('social-project-scroll-list--activity', `<div class="social-project-activity-list">${projectActivity.length ? projectActivity.map((entry) => renderActivityItem(entry)).join('') : `<div class="social-neo-empty">No project activity yet.</div>`}</div>`)}
            </section>
        `;
        const renderOutcomeTab = () => `
            <section class="social-neo-stack">
                <div class="social-project-dashboard-grid">
                    ${renderProgressRing(readinessPercent, 'Showcase readiness', `${activeProject?.deliverableCount || 0} deliverables linked`, '#f97316')}
                    ${renderMetricCard('fa-circle-check', 'Delivery health', `${countNum(activeProject?.taskCompletionPercent || 0)}%`, healthNote, '#14b8a6')}
                    ${renderMetricCard('fa-globe', 'Showcase', activeProject.showcasePageId ? 'Live' : 'Draft', activeProject.showcasePageId ? 'public page created' : 'not published yet', '#3b82f6')}
                </div>
                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Outcome and showcase</strong><span>Prepare the workspace for public presentation after completion.</span></div>
                        ${activeProject.showcasePageId ? `<span class="social-neo-pill">Showcase published</span>` : ''}
                    </div>
                    <div class="social-project-outcome-grid">
                        <article class="social-neo-card social-project-mini-card">
                            <span class="social-neo-label">Showcase summary</span>
                            <p>${escape(text(activeProject.showcaseSummary || 'No showcase summary yet.'))}</p>
                        </article>
                        <article class="social-neo-card social-project-mini-card">
                            <span class="social-neo-label">Recommended next action</span>
                            <p>${escape(activeProject.showcasePageId ? 'Refresh the showcase page when deliverables change.' : 'Publish a public-facing page once the project is ready to present.')}</p>
                        </article>
                    </div>
                    <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                        ${activeProject.showcasePageId ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="panel-pages">Open pages</button>` : ''}
                        ${activeProject.isManager ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> ${activeProject.showcasePageId ? 'Republish showcase' : 'Publish showcase'}</button>` : ''}
                    </div>
                </section>
            </section>
        `;
        const tabMarkup = activeTab === 'overview'
            ? renderOverviewTab()
            : activeTab === 'team'
                ? renderTeamTab()
                : activeTab === 'tasks'
                    ? renderTasksTab()
                    : activeTab === 'milestones'
                        ? renderMilestonesTab()
                        : activeTab === 'files'
                            ? renderDeliverablesTab()
                            : activeTab === 'meetings'
                                ? renderMeetingsTab()
                                : activeTab === 'chat'
                                    ? renderChatTab()
                                    : activeTab === 'activity'
                                        ? renderActivityTab()
                                        : activeTab === 'outcome'
                                            ? renderOutcomeTab()
                                            : renderCheckinsTab();
        const tabItems = [
            ['overview', 'Overview', 'fa-house', 'Studio summary'],
            ['team', 'Team', 'fa-users', `${activeProject.memberCount || 0} members`],
            ['tasks', 'Tasks', 'fa-list-check', `${activeProject.openTaskCount || 0} open`],
            ['milestones', 'Milestones', 'fa-flag', `${activeProject.milestoneCount || 0} tracked`],
            ['files', 'Deliverables', 'fa-box-archive', `${activeProject.deliverableCount || 0} submitted`],
            ['meetings', 'Meetings', 'fa-calendar-days', `${activeProject.meetingCount || 0} linked`],
            ['chat', 'Chat', 'fa-comments', 'Backed by group chat'],
            ['checkins', 'Check-ins', 'fa-comment-dots', `${activeProject.checkinCount || 0} updates`],
            ['activity', 'Activity', 'fa-wave-square', `${activeProject.activityCount || 0} events`],
            ['outcome', 'Outcome', 'fa-globe', activeProject.showcasePageId ? 'Published' : 'Draft']
        ];
        return `
            <div class="social-neo-stack social-projects-shell">
                <section class="social-neo-card social-project-detail-hero social-project-detail-hero-rich">
                    <div class="social-project-detail-top">
                        <div class="social-project-detail-copy">
                            <div class="social-neo-inline social-neo-inline-gap-10-wrap">
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="projects-back"><i class="fas fa-arrow-left"></i> Back</button>
                                ${projectRolePill(activeProject.role || 'member')}
                                <span class="social-neo-pill">${escape(text(statusMeta[text(activeProject.status || 'idea')]?.label || activeProject.status || 'idea'))}</span>
                                ${activeProject.isOrphaned ? `<span class="social-neo-pill">Ownerless</span>` : ''}
                            </div>
                            <h2>${escape(text(activeProject.name || 'Project workspace'))}</h2>
                            <p>${escape(text(activeProject.summary || activeProject.description || ''))}</p>
                            <div class="social-neo-badge-row">
                                ${facultyPills(activeProject.facultyCodes)}
                                ${skillPills(activeProject.skillTags)}
                                ${text(activeProject.courseTag) ? `<span class="social-neo-pill">${escape(activeProject.courseTag)}</span>` : ''}
                            </div>
                        </div>
                        <div class="social-project-detail-actions">
                            <div class="social-neo-person">
                                ${avatar(owner)}
                                <div>
                                    <strong>${escape(displayName(owner))}</strong>
                                    <span>${escape(activeProject.isOrphaned ? 'No current owner' : 'Workspace owner')}</span>
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-open-chat" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-comments"></i> Chat</button>
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="meetings"><i class="fas fa-calendar-days"></i> Meetings</button>
                                ${activeProject.isManager ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> Showcase</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="social-project-dashboard-strip">
                        ${renderProgressRing(activeProject?.taskCompletionPercent || 0, 'Task completion', `${activeProject?.completedTaskCount || 0} of ${activeProject?.taskCount || 0}`, '#f97316')}
                        ${renderMetricCard('fa-flag', 'Milestones', `${activeProject?.milestoneCompletionPercent || 0}%`, `${activeProject?.milestoneOverdueCount || 0} overdue`, '#3b82f6')}
                        ${renderMetricCard('fa-box-archive', 'Deliverables', activeProject?.deliverableCount || 0, `${countNum(deliverableCounts.review || 0) + countNum(deliverableCounts.approved || 0)} in review`, '#14b8a6')}
                        ${renderMetricCard('fa-users', 'Team mix', activeProject?.memberCount || 0, `${(activeProject?.facultyMix || []).length} faculties`, '#8b5cf6')}
                        <article class="social-project-metric-card social-project-metric-card-wide">
                            <span class="social-project-metric-icon"><i class="fas fa-wave-square"></i></span>
                            <div>
                                <small>Activity pulse</small>
                                <strong>${escape(String(activeProject?.activityCount || 0))}</strong>
                                <span>last 7 days</span>
                            </div>
                            ${renderSparkline(activeProject?.activityBuckets || [])}
                        </article>
                    </div>
                </section>
                <section class="social-neo-card social-project-tab-shell">
                    <div class="social-project-tab-row social-project-tab-row-rich" role="tablist" aria-label="Project sections">
                        ${tabItems.map(([tabId, label, icon, note]) => `
                            <button class="social-project-tab-pill ${activeTab === tabId ? 'is-active' : ''}" type="button" role="tab" aria-selected="${activeTab === tabId ? 'true' : 'false'}" tabindex="${activeTab === tabId ? '0' : '-1'}" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="${escape(tabId)}">
                                <i class="fas ${escape(icon)}"></i>
                                <span>
                                    <strong>${escape(label)}</strong>
                                    <small>${escape(note)}</small>
                                </span>
                            </button>
                        `).join('')}
                    </div>
                </section>
                ${tabMarkup}
            </div>
        `;
    }

    function renderGroupsPanelLegacy() {
        const runtime = state();
        const social = runtime.social || {};
        const groups = Array.isArray(social.groups) ? social.groups : [];
        const activeTab = text(runtime.ui?.groupsTab || 'discover');
        const joinedGroups = groups.filter(isJoinedGroup);
        const discoverGroups = groups;
        const groupNameId = controlId('groupName');
        const groupDescriptionId = controlId('groupDescription');
        const groupVisibilityId = controlId('groupVisibility');

        const renderGroupCard = (group) => `
            <article class="social-neo-card social-neo-group-card">
                <div class="social-neo-group-card-header">
                    <div class="social-neo-group-card-icon"><i class="fas fa-layer-group"></i></div>
                    <div>
                        <strong>${escape(text(group.name || 'Group'))}</strong>
                        <span class="social-neo-group-card-meta">
                            <span class="social-neo-pill">${escape(text(group.visibility || 'public'))}</span>
                            <span>${escape(group.memberCount || 0)} members</span>
                        </span>
                    </div>
                </div>
                <p class="social-neo-group-card-desc">${escape(text(group.description || 'No description yet.'))}</p>
                <div class="social-neo-group-card-actions">
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(group.id))}">
                        <i class="fas fa-stream"></i> Feed
                    </button>
                    ${group.membershipState === 'manager' || group.membershipState === 'member'
                        ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-chat" data-group-id="${escape(text(group.id))}"><i class="fas fa-comments"></i> Chat</button>
                           <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-leave-open" data-group-id="${escape(text(group.id))}"><i class="fas fa-sign-out-alt"></i> Leave</button>`
                        : group.membershipState === 'pending'
                            ? `<span class="social-neo-pill">Request pending</span>`
                            : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-join" data-group-id="${escape(text(group.id))}">
                                <i class="fas fa-plus"></i> ${text(group.visibility) === 'private' ? 'Request' : 'Join'}
                              </button>`
                    }
                </div>
                ${group.isManager && Array.isArray(group.pendingMemberIds) && group.pendingMemberIds.length ? `
                    <div class="social-neo-divider"></div>
                    <span class="social-neo-label">Pending approvals</span>
                    <div class="social-neo-list">
                        ${group.pendingMemberIds.map((memberId) => {
                            const account = accountById(memberId) || { id: memberId };
                            return `
                                <div class="social-neo-item-line">
                                    <span>${escape(displayName(account))}</span>
                                    <div class="social-neo-inline">
                                        <button class="social-neo-link-btn" type="button" data-action="group-approve" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Approve</button>
                                        <button class="social-neo-link-btn" type="button" data-action="group-decline" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Decline</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </article>
        `;

        const discoverView = `
            <div class="social-neo-groups-grid">
                ${discoverGroups.length ? discoverGroups.map(renderGroupCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-layer-group"></i>
                        <strong>No groups yet</strong>
                        <span>Create the first group to start a campus community.</span>
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
                    </div>
                `}
            </div>
        `;

        const createView = `
            <section class="social-neo-card">
                <div class="social-neo-section-head">
                    <div><strong><i class="fas fa-plus-circle social-neo-section-accent-icon is-green"></i> Create New Group</strong></div>
                </div>
                <form class="social-neo-stack" data-form="create-group">
                    <input class="social-neo-input" id="${escape(groupNameId)}" type="text" name="groupName" placeholder="Group name" value="${escape(text(runtime.ui?.groupName || ''))}">
                    <textarea class="social-neo-textarea" id="${escape(groupDescriptionId)}" rows="3" name="groupDescription" placeholder="What will members collaborate on?">${escape(text(runtime.ui?.groupDescription || ''))}</textarea>
                    <select class="social-neo-select" id="${escape(groupVisibilityId)}" name="groupVisibility" data-lux-native data-lux-picker-enhanced="true">
                        <option value="public" ${text(runtime.ui?.groupVisibility || 'public') === 'public' ? 'selected' : ''}>Public - Anyone can join</option>
                        <option value="private" ${text(runtime.ui?.groupVisibility) === 'private' ? 'selected' : ''}>Private - Approval required</option>
                    </select>
                    <div class="social-neo-form-actions">
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-plus"></i> Create Group</button>
                    </div>
                </form>
            </section>
        `;

        return activeTab === 'create' ? createView : activeTab === 'joined' ? joinedView : discoverView;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       PAGES PANEL - Facebook-style page discovery & management
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function renderPagesPanelLegacy() {
        const runtime = state();
        const social = runtime.social || {};
        const pages = Array.isArray(social.pages) ? social.pages : [];
        const activeTab = text(runtime.ui?.pagesTab || 'discover');
        const pageSearch = text(runtime.ui?.pagesSearch || '').toLowerCase();
        const followedPages = pages.filter(p => p?.isFollowing || isManagedPage(p));
        const filteredPages = pages.filter((page) => {
            if (!pageSearch) return true;
            const haystack = [page?.name, page?.description, page?.facultyName]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(pageSearch);
        });
        const filteredFollowedPages = followedPages.filter((page) => {
            if (!pageSearch) return true;
            const haystack = [page?.name, page?.description, page?.facultyName]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(pageSearch);
        });
        const pageNameId = controlId('pageName');
        const pageDescriptionId = controlId('pageDescription');
        const pageVisibilityId = controlId('pageVisibility');
        const pagesSearchId = controlId('pagesSearch');

        const renderPageCard = (page) => `
            <article class="social-neo-card social-neo-page-card">
                <div class="social-neo-page-card-header">
                    <div class="social-neo-page-card-icon"><i class="fas fa-flag"></i></div>
                    <div>
                        <strong>${escape(text(page.name || 'Page'))}</strong>
                        <span class="social-neo-page-card-meta">
                            <span class="social-neo-pill">${escape(text(page.visibility || 'public'))}</span>
                            <span>${escape(page.followerCount || 0)} followers</span>
                        </span>
                    </div>
                </div>
                <p class="social-neo-page-card-desc">${escape(text(page.description || 'No description yet.'))}</p>
                <div class="social-neo-page-card-actions">
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="focus-feed" data-scope-type="page" data-scope-id="${escape(text(page.id))}">
                        <i class="fas fa-stream"></i> View Page
                    </button>
                    <button class="social-neo-btn ${page.isFollowing ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="page-follow" data-page-id="${escape(text(page.id))}">
                        <i class="fas ${page.isFollowing ? 'fa-check' : 'fa-plus'}"></i> ${page.isFollowing ? 'Following' : 'Follow'}
                    </button>
                </div>
            </article>
        `;

        const renderSearchBar = () => `
            <form class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-inline-items-end social-neo-mb-14" data-form="pages-search">
                <label class="social-neo-field-flex-1-220">
                    <span class="social-neo-label">Search pages</span>
                    <input class="social-neo-input" id="${escape(pagesSearchId)}" name="pagesSearch" type="search" placeholder="Search pages to follow..." data-bind="pages-search" value="${escape(text(runtime.ui?.pagesSearch || ''))}">
                </label>
                <button class="social-neo-btn social-neo-btn-primary" type="submit">
                    <i class="fas fa-search"></i> Search
                </button>
            </form>
        `;

        const discoverView = `
            ${renderSearchBar()}
            <div class="social-neo-pages-grid">
                ${filteredPages.length ? filteredPages.map(renderPageCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-flag"></i>
                        <strong>${pageSearch ? 'No pages match your search' : 'No pages yet'}</strong>
                        <span>${pageSearch ? 'Try a different page name, description, or faculty.' : 'Create a page for your lab, club, or office.'}</span>
                    </div>
                `}
            </div>
        `;

        const followingView = `
            ${renderSearchBar()}
            <div class="social-neo-pages-grid">
                ${filteredFollowedPages.length ? filteredFollowedPages.map(renderPageCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-heart"></i>
                        <strong>${pageSearch ? 'No followed pages match your search' : 'Not following any pages'}</strong>
                        <span>${pageSearch ? 'Try a different page name, description, or faculty.' : 'Discover pages to stay updated.'}</span>
                    </div>
                `}
            </div>
        `;

        const createView = `
            <section class="social-neo-card">
                <div class="social-neo-section-head">
                    <div><strong><i class="fas fa-plus-circle social-neo-section-accent-icon is-blue"></i> Create New Page</strong></div>
                </div>
                <form class="social-neo-stack" data-form="create-page">
                    <input class="social-neo-input" id="${escape(pageNameId)}" type="text" name="pageName" placeholder="Page name" value="${escape(text(runtime.ui?.pageName || ''))}">
                    <textarea class="social-neo-textarea" id="${escape(pageDescriptionId)}" rows="3" name="pageDescription" placeholder="What is this page for?">${escape(text(runtime.ui?.pageDescription || ''))}</textarea>
                    <select class="social-neo-select" id="${escape(pageVisibilityId)}" name="pageVisibility" data-lux-native data-lux-picker-enhanced="true">
                        <option value="public" ${text(runtime.ui?.pageVisibility || 'public') === 'public' ? 'selected' : ''}>Public - Visible to everyone</option>
                        <option value="private" ${text(runtime.ui?.pageVisibility) === 'private' ? 'selected' : ''}>Private - By invitation</option>
                    </select>
                    <div class="social-neo-form-actions">
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-plus"></i> Create Page</button>
                    </div>
                </form>
            </section>
        `;

        return activeTab === 'create' ? createView : activeTab === 'following' ? followingView : discoverView;
    }

    function renderEventsPanelLegacy() {
        const runtime = state();
        // Active events sub-tab: 'student' | 'university' | 'studygroups'
        const eventsTab = text(runtime.ui?.eventsSubTab || 'student');
        const allEvents = Array.isArray(runtime.social?.events) ? runtime.social.events : [];
        const userRole = text(currentUser()?.role || 'student');
        const isStaff = ['professor', 'ta', 'admin', 'student_service'].includes(userRole);

        // Separate university (official) events from student events
        const uniEvents = allEvents.filter(e => e.category === 'university' || e.isOfficial);
        const studentEvents = allEvents.filter(e => e.category !== 'university' && !e.isOfficial);
        const studyGroups = Array.isArray(runtime.social?.groups)
            ? runtime.social.groups.filter(g => g.type === 'study' || (g.tags || []).includes('study'))
            : [];

        const scopeOptions = eventScopeOptions();
        const eventTitleId     = controlId('eventTitle');
        const eventDescId      = controlId('eventDescription');
        const eventStartsAtId  = controlId('eventStartsAt');
        const eventEndsAtId    = controlId('eventEndsAt');
        const eventLocationId  = controlId('eventLocation');
        const eventOnlineLinkId= controlId('eventOnlineLink');
        const eventScopeId     = controlId('eventScope');
        const eventJoinModeId  = controlId('eventJoinMode');
        const eventIsOnlineId  = controlId('eventIsOnline');
        const eventCategoryId  = controlId('eventCategory');
        const eventRecurringId = controlId('eventRecurring');
        const eventMaxSeatsId  = controlId('eventMaxSeats');
        const eventImageId     = controlId('eventImage');

        function getEventToneClass(category) {
            const toneMap = {
                academic: 'academic',
                social: 'social',
                career: 'career',
                club: 'club',
                university: 'university',
                study: 'study'
            };
            return toneMap[text(category)] || 'default';
        }

        // Helper: render a time-grouped list of events
        function renderEventList(list) {
            if (!list.length) return '<div class="social-neo-empty">No events here yet.</div>';
            const groups = {};
            list.forEach(item => {
                const dk = item.startsAt
                    ? new Date(item.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    : 'No date';
                if (!groups[dk]) groups[dk] = [];
                groups[dk].push(item);
            });
            return Object.entries(groups).map(([dateLabel, items]) => `
                <div class="social-neo-time-group">
                    <div class="social-neo-time-group-head" data-action="event-time-group-toggle">
                        <strong><i class="fas fa-calendar-day social-neo-time-group-icon"></i>${escape(dateLabel)}</strong>
                        <span>${escape(items.length)} event${items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="social-neo-time-group-body">
                        ${items.map(item => {
                            const toneClass = getEventToneClass(item.category);
                            return `
                            <article class="social-neo-event-card is-${toneClass}">
                                ${item.imageUrl ? `<div class="social-neo-event-img"><img src="${escape(item.imageUrl)}" alt="${escape(item.title)}"></div>` : ''}
                                <div class="social-neo-inline social-neo-inline-between-gap-4-wrap">
                                    <strong>${escape(text(item.title || 'Untitled'))}</strong>
                                    ${item.category ? `<span class="social-neo-pill social-neo-event-category-pill is-${toneClass}">${escape(item.category)}</span>` : ''}
                                </div>
                                <span class="social-neo-event-copy">${escape(text(item.description || ''))}</span>
                                <div class="social-neo-badge-row">
                                    <span class="social-neo-pill"><i class="fas fa-clock social-neo-pill-icon"></i> ${escape(when(item.startsAt))}</span>
                                    ${item.location ? `<span class="social-neo-pill"><i class="fas fa-map-pin social-neo-pill-icon"></i> ${escape(item.location)}</span>` : ''}
                                    ${item.isOnline ? `<span class="social-neo-pill"><i class="fas fa-globe social-neo-pill-icon"></i> Online</span>` : ''}
                                    ${item.maxSeats ? `<span class="social-neo-pill"><i class="fas fa-chair social-neo-pill-icon"></i> ${escape(item.attendeeSummary?.going||0)}/${escape(item.maxSeats)} seats</span>` : ''}
                                    ${item.isRecurring ? `<span class="social-neo-pill"><i class="fas fa-rotate social-neo-pill-icon"></i> Recurring</span>` : ''}
                                </div>
                                <div class="social-neo-inline">
                                    <span class="social-neo-attendee-summary">${escape(item.attendeeSummary?.going||0)} going &middot; ${escape(item.attendeeSummary?.interested||0)} interested</span>
                                    <span class="social-neo-flex-spacer"></span>
                                    <button class="social-neo-btn ${item.viewerRsvpStatus==='going'?'social-neo-btn-primary':'social-neo-btn-ghost'}" type="button" data-action="event-rsvp" data-event-id="${escape(text(item.id))}" data-status="going">Going</button>
                                    <button class="social-neo-btn ${item.viewerRsvpStatus==='interested'?'social-neo-btn-primary':'social-neo-btn-ghost'}" type="button" data-action="event-rsvp" data-event-id="${escape(text(item.id))}" data-status="interested">Interested</button>
                                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="event-rsvp" data-event-id="${escape(text(item.id))}" data-status="declined">Decline</button>
                                </div>
                            </article>`;
                        }).join('')}
                    </div>
                </div>
            `).join('');
        }

        // Student event creation form (all users)
        const studentCreateForm = `
            <section class="social-neo-card">
                <div class="social-neo-section-head">
                    <div><strong>Create Event</strong></div>
                </div>
                <form class="social-neo-stack" data-form="create-event">
                    <input class="social-neo-input" id="${escape(eventTitleId)}" type="text" name="eventTitle" placeholder="Event title" value="${escape(text(runtime.ui?.eventTitle || ''))}">
                    <textarea class="social-neo-textarea" id="${escape(eventDescId)}" rows="3" name="eventDescription" placeholder="What's this event about?">${escape(text(runtime.ui?.eventDescription || ''))}</textarea>

                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label for="${escape(eventStartsAtId)}">
                            <span class="social-neo-label">Starts</span>
                            <input class="social-neo-input" id="${escape(eventStartsAtId)}" type="datetime-local" name="eventStartsAt" value="${escape(text(runtime.ui?.eventStartsAt || ''))}">
                        </label>
                        <label for="${escape(eventEndsAtId)}">
                            <span class="social-neo-label">Ends</span>
                            <input class="social-neo-input" id="${escape(eventEndsAtId)}" type="datetime-local" name="eventEndsAt" value="${escape(text(runtime.ui?.eventEndsAt || ''))}">
                        </label>
                    </div>

                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label for="${escape(eventLocationId)}">
                            <span class="social-neo-label">Location</span>
                            <input class="social-neo-input" id="${escape(eventLocationId)}" type="text" name="eventLocation" placeholder="Library, Room 204, Zoom..." value="${escape(text(runtime.ui?.eventLocation || ''))}">
                        </label>
                        <label for="${escape(eventCategoryId)}">
                            <span class="social-neo-label">Category</span>
                            <select class="social-neo-select" id="${escape(eventCategoryId)}" name="eventCategory" data-lux-native data-lux-picker-enhanced="true">
                                <option value="social" ${text(runtime.ui?.eventCategory||'social')==='social'?'selected':''}>Social</option>
                                <option value="academic" ${text(runtime.ui?.eventCategory)==='academic'?'selected':''}>Academic</option>
                                <option value="club" ${text(runtime.ui?.eventCategory)==='club'?'selected':''}>Club</option>
                                <option value="career" ${text(runtime.ui?.eventCategory)==='career'?'selected':''}>Career</option>
                                <option value="study" ${text(runtime.ui?.eventCategory)==='study'?'selected':''}>Study session</option>
                                <option value="other" ${text(runtime.ui?.eventCategory)==='other'?'selected':''}>Other</option>
                            </select>
                        </label>
                    </div>

                    <div class="social-neo-form-grid social-neo-form-grid-3">
                        <label for="${escape(eventScopeId)}">
                            <span class="social-neo-label">Publish in</span>
                            <select class="social-neo-select" id="${escape(eventScopeId)}" name="eventScope">
                                ${scopeOptions.map(o => `<option value="${escape(`${o.type}:${o.id}`)}" ${text(runtime.ui?.activeScopeType||'profile')===o.type&&text(runtime.ui?.activeScopeId||currentUserId())===o.id?'selected':''}>${escape(o.name)}</option>`).join('')}
                            </select>
                        </label>
                        <label for="${escape(eventJoinModeId)}">
                            <span class="social-neo-label">Join mode</span>
                            <select class="social-neo-select" id="${escape(eventJoinModeId)}" name="eventJoinMode" data-lux-native data-lux-picker-enhanced="true">
                                <option value="open" ${text(runtime.ui?.eventJoinMode||'open')==='open'?'selected':''}>Open to all</option>
                                <option value="member-required" ${text(runtime.ui?.eventJoinMode)==='member-required'?'selected':''}>Members only</option>
                                <option value="invite-only" ${text(runtime.ui?.eventJoinMode)==='invite-only'?'selected':''}>Invite only</option>
                            </select>
                        </label>
                        <label for="${escape(eventMaxSeatsId)}">
                            <span class="social-neo-label">Max seats</span>
                            <input class="social-neo-input" id="${escape(eventMaxSeatsId)}" type="number" name="eventMaxSeats" min="1" placeholder="Unlimited" value="${escape(text(runtime.ui?.eventMaxSeats || ''))}">
                        </label>
                    </div>

                    <div class="social-neo-inline social-neo-inline-gap-14-wrap">
                        <label class="social-neo-checkbox" for="${escape(eventIsOnlineId)}">
                            <input id="${escape(eventIsOnlineId)}" type="checkbox" name="eventIsOnline" ${runtime.ui?.eventIsOnline?'checked':''}>
                            <span>Online event</span>
                        </label>
                        <label class="social-neo-checkbox" for="${escape(eventRecurringId)}">
                            <input id="${escape(eventRecurringId)}" type="checkbox" name="eventRecurring" ${runtime.ui?.eventRecurring?'checked':''}>
                            <span>Recurring weekly</span>
                        </label>
                        ${runtime.ui?.eventIsOnline ? `
                            <input class="social-neo-input social-neo-input-flex-1-160" id="${escape(eventOnlineLinkId)}" type="url" name="eventOnlineLink" placeholder="https://zoom.us/..." value="${escape(text(runtime.ui?.eventOnlineLink || ''))}">
                        ` : ''}
                    </div>

                    <div class="social-neo-inline">
                        <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-pointer">
                            <i class="fas fa-image"></i> Add cover photo
                            <input id="${escape(eventImageId)}" name="eventImage" type="file" accept="image/*" hidden>
                        </label>
                        ${runtime.ui?.eventImageFile ? `<span class="social-neo-draft-file"><i class="fas fa-image"></i> ${escape(runtime.ui.eventImageFile.name)}</span>` : ''}
                        <span class="social-neo-flex-spacer"></span>
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-calendar-plus"></i> Create event</button>
                    </div>
                </form>
            </section>
        `;

        // University-only creation form (staff only)
        const universityCreateForm = isStaff ? `
            <section class="social-neo-card social-neo-section-card--official">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Create official university event</strong>
                        <span>Visible to all students. Marked as official. Only faculty & admin can publish here.</span>
                    </div>
                    <span class="social-neo-pill is-blue">${escape(roleLabel(userRole))}</span>
                </div>
                <form class="social-neo-stack" data-form="create-event">
                    <input type="hidden" name="eventCategory" value="university">
                    <input type="hidden" name="eventIsOfficial" value="true">
                    <input class="social-neo-input" type="text" name="eventTitle" placeholder="Official event title (e.g. Mid-term Review Session)" value="${escape(text(runtime.ui?.eventTitle || ''))}">
                    <textarea class="social-neo-textarea" rows="3" name="eventDescription" placeholder="Full description - students will see this in their feed.">${escape(text(runtime.ui?.eventDescription || ''))}</textarea>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Starts</span>
                            <input class="social-neo-input" type="datetime-local" name="eventStartsAt" value="${escape(text(runtime.ui?.eventStartsAt || ''))}">
                        </label>
                        <label>
                            <span class="social-neo-label">Ends</span>
                            <input class="social-neo-input" type="datetime-local" name="eventEndsAt" value="${escape(text(runtime.ui?.eventEndsAt || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Venue / Room</span>
                            <input class="social-neo-input" type="text" name="eventLocation" placeholder="Auditorium A, Hall 3, Online..." value="${escape(text(runtime.ui?.eventLocation || ''))}">
                        </label>
                        <label>
                            <span class="social-neo-label">Event type</span>
                            <select class="social-neo-select" name="eventJoinMode" data-lux-native data-lux-picker-enhanced="true">
                                <option value="open">Open - all students</option>
                                <option value="member-required">Faculty members only</option>
                                <option value="invite-only">Invite-only</option>
                            </select>
                        </label>
                    </div>
                    <div class="social-neo-inline">
                        <label class="social-neo-checkbox">
                            <input type="checkbox" name="eventIsOnline" ${runtime.ui?.eventIsOnline?'checked':''}>
                            <span>Online / hybrid</span>
                        </label>
                        <label class="social-neo-checkbox">
                            <input type="checkbox" name="eventRecurring" ${runtime.ui?.eventRecurring?'checked':''}>
                            <span>Recurring weekly</span>
                        </label>
                    </div>
                    <div class="social-neo-inline">
                        <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-pointer">
                            <i class="fas fa-image"></i> Add cover photo
                            <input name="eventImage" type="file" accept="image/*" hidden>
                        </label>
                        <span class="social-neo-flex-spacer"></span>
                        <button class="social-neo-btn social-neo-btn-primary is-blue" type="submit"><i class="fas fa-university"></i> Publish official event</button>
                    </div>
                </form>
            </section>
        ` : `
            <section class="social-neo-card">
                <div class="social-neo-empty social-neo-empty-left">
                    <i class="fas fa-university social-neo-empty-left-icon"></i>
                    <strong class="social-neo-empty-left-title">Official university events</strong>
                    <p class="social-neo-empty-left-copy">Only faculty and administrators can publish official university events. They will appear here automatically when published.</p>
                </div>
            </section>
        `;

        // Study groups panel
        const studyGroupsPanel = `
            <section class="social-neo-card">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Form a study group</strong>
                        <span>Create a focused group for a course, topic, or project. Members can schedule sessions and share materials.</span>
                    </div>
                </div>
                <form class="social-neo-stack" data-form="create-group">
                    <input type="hidden" name="groupType" value="study">
                    <input class="social-neo-input" type="text" name="groupName" placeholder="e.g. MATH 201 - Study Circle" value="${escape(text(runtime.ui?.groupName || ''))}">
                    <textarea class="social-neo-textarea" rows="2" name="groupDescription" placeholder="Course or topic, meeting frequency, what you need help with...">${escape(text(runtime.ui?.groupDescription || ''))}</textarea>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Visibility</span>
                            <select class="social-neo-select" name="groupVisibility" data-lux-native data-lux-picker-enhanced="true">
                                <option value="public" ${text(runtime.ui?.groupVisibility||'public')==='public'?'selected':''}>Open - anyone can join</option>
                                <option value="private" ${text(runtime.ui?.groupVisibility)==='private'?'selected':''}>Request to join</option>
                            </select>
                        </label>
                        <label>
                            <span class="social-neo-label">Max members</span>
                            <input class="social-neo-input" type="number" name="groupMaxMembers" min="2" max="100" placeholder="No limit" value="${escape(text(runtime.ui?.groupMaxMembers || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-form-actions">
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-users"></i> Create study group</button>
                    </div>
                </form>
            </section>
            <section class="social-neo-card">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Active study groups</strong>
                        <span>Browse and join study groups forming right now.</span>
                    </div>
                </div>
                <div class="social-neo-list">
                    ${studyGroups.length ? studyGroups.map(g => `
                        <article class="social-neo-entity-card social-neo-entity-card--study">
                            <div>
                                <strong>${escape(text(g.name||'Study Group'))}</strong>
                                <span>${escape(text(g.description||''))}</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-4">
                                    <span class="social-neo-pill"><i class="fas fa-users social-neo-pill-icon"></i> ${escape(g.memberCount||0)} members</span>
                                    <span class="social-neo-pill">${escape(text(g.visibility||'public'))}</span>
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-inline-column-end">
                                ${g.membershipState==='member'||g.membershipState==='manager'
                                    ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-chat" data-group-id="${escape(text(g.id))}">Open chat</button>
                                       <button class="social-neo-link-btn" type="button" data-action="group-leave-open" data-group-id="${escape(text(g.id))}">Leave</button>`
                                    : g.membershipState==='pending'
                                        ? `<span class="social-neo-pill">Pending</span>`
                                        : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-join" data-group-id="${escape(text(g.id))}">${text(g.visibility)==='private'?'Request to join':'Join'}</button>`
                                }
                            </div>
                        </article>
                    `).join('') : `<div class="social-neo-empty">No study groups yet. Be the first to create one!</div>`}
                </div>
            </section>
        `;

        return `
            <div class="social-neo-stack">
                ${eventsTab === 'student' ? `
                    <div class="social-neo-grid-2">
                        <section class="social-neo-card">
                            <div class="social-neo-section-head">
                                <div>
                                    <strong>Student events</strong>
                                    <span>${escape(studentEvents.length)} upcoming &middot; grouped by date</span>
                                </div>
                            </div>
                            <div class="social-neo-stack">${renderEventList(studentEvents)}</div>
                        </section>
                        ${studentCreateForm}
                    </div>
                ` : eventsTab === 'university' ? `
                    <div class="social-neo-grid-2">
                        <section class="social-neo-card">
                            <div class="social-neo-section-head">
                                <div>
                                    <strong>Official university events</strong>
                                    <span>Published by faculty & administration.</span>
                                </div>
                            </div>
                            <div class="social-neo-stack">${renderEventList(uniEvents)}</div>
                        </section>
                        ${universityCreateForm}
                    </div>
                ` : `
                    <div class="social-neo-grid-2">
                        ${studyGroupsPanel}
                    </div>
                `}
            </div>
        `;

    }

    function renderEventsPanel() {
        const runtime = state();
        const eventsTab = text(runtime.ui?.eventsSubTab || 'student');
        const composerSection = text(runtime.ui?.eventsComposerSection || '');
        const composerOpen = composerSection === eventsTab;
        const allEvents = Array.isArray(runtime.social?.events) ? runtime.social.events : [];
        const userRole = text(currentUser()?.role || 'student');
        const isStaff = ['professor', 'ta', 'admin', 'student_service'].includes(userRole);
        const uniEvents = allEvents.filter((entry) => entry.category === 'university' || entry.isOfficial);
        const studentEvents = allEvents.filter((entry) => entry.category !== 'university' && !entry.isOfficial);
        const manageableStudentEvents = studentEvents.filter((entry) => entry?.viewerCanDelete);
        const manageableUniversityEvents = uniEvents.filter((entry) => entry?.viewerCanDelete);
        const studyGroups = Array.isArray(runtime.social?.groups)
            ? runtime.social.groups.filter((group) => group.type === 'study' || (group.tags || []).includes('study'))
            : [];
        const scopeOptions = eventScopeOptions();
        const eventTitleId = controlId('eventTitle');
        const eventDescId = controlId('eventDescription');
        const eventStartsAtId = controlId('eventStartsAt');
        const eventEndsAtId = controlId('eventEndsAt');
        const eventLocationId = controlId('eventLocation');
        const eventOnlineLinkId = controlId('eventOnlineLink');
        const eventScopeId = controlId('eventScope');
        const eventJoinModeId = controlId('eventJoinMode');
        const eventIsOnlineId = controlId('eventIsOnline');
        const eventCategoryId = controlId('eventCategory');
        const eventRecurringId = controlId('eventRecurring');
        const eventMaxSeatsId = controlId('eventMaxSeats');
        const eventImageId = controlId('eventImage');
        const selectedEventScope = text(runtime.ui?.eventScope || `${text(runtime.ui?.activeScopeType || 'profile')}:${text(runtime.ui?.activeScopeId || currentUserId())}`);
        const studentSectionState = eventsTab === 'student' ? 'is-focused' : '';
        const universitySectionState = eventsTab === 'university' ? 'is-focused' : '';
        const studySectionState = eventsTab === 'studygroups' ? 'is-focused' : '';

        function sortEventsByStart(list) {
            return [...list].sort((left, right) => {
                const leftTime = left?.startsAt ? new Date(left.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
                const rightTime = right?.startsAt ? new Date(right.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
                return leftTime - rightTime;
            });
        }

        function groupEventsByDate(list) {
            const groups = new Map();
            sortEventsByStart(list).forEach((item) => {
                const stamp = item?.startsAt ? new Date(item.startsAt) : null;
                const validStamp = stamp && !Number.isNaN(stamp.getTime()) ? stamp : null;
                const key = validStamp ? validStamp.toISOString().slice(0, 10) : 'no-date';
                if (!groups.has(key)) {
                    groups.set(key, {
                        key,
                        label: validStamp
                            ? validStamp.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                            : 'To be announced',
                        items: []
                    });
                }
                groups.get(key).items.push(item);
            });
            return Array.from(groups.values());
        }

        function renderEventFeatureCard(item, tone) {
            const startDate = item?.startsAt ? new Date(item.startsAt) : null;
            const hasStartDate = startDate && !Number.isNaN(startDate.getTime());
            const accent = tone === 'university' ? '#60a5fa' : '#fb7185';
            const categoryLabel = text(item.category || (tone === 'university' ? 'university' : 'social'));
            const goingCount = Number(item?.attendeeSummary?.going || 0);
            const interestedCount = Number(item?.attendeeSummary?.interested || 0);
            const seatSummary = item.maxSeats ? `${goingCount}/${item.maxSeats} seats` : 'Unlimited seats';
            const monthLabel = hasStartDate ? startDate.toLocaleDateString('en-US', { month: 'short' }) : 'TBA';
            const dayLabel = hasStartDate ? startDate.toLocaleDateString('en-US', { day: '2-digit' }) : '--';
            const timeLabel = item?.startsAt ? when(item.startsAt) : 'Time to be announced';
            const endLabel = item?.endsAt ? when(item.endsAt) : '';
            const description = text(item.description || '').trim() || 'Details will be shared in the event thread.';
            const title = text(item.title || 'Untitled event');
            return `
                <article class="social-neo-event-feature social-neo-event-feature--${escape(tone)}">
                    ${item.imageUrl ? `
                        <div class="social-neo-event-feature-cover">
                            <img src="${escape(item.imageUrl)}" alt="${escape(title)}">
                        </div>
                    ` : ''}
                    <div class="social-neo-event-feature-head">
                        <div class="social-neo-event-feature-datebox">
                            <span>${escape(monthLabel)}</span>
                            <strong>${escape(dayLabel)}</strong>
                        </div>
                        <div class="social-neo-event-feature-copy">
                            <div class="social-neo-badge-row social-neo-events-badges">
                                <span class="social-neo-pill social-neo-event-category-pill is-${escape(tone)}">${escape(categoryLabel)}</span>
                                ${item.isOfficial ? '<span class="social-neo-pill">Official</span>' : ''}
                                ${item.isOnline ? '<span class="social-neo-pill">Online</span>' : ''}
                                ${item.isRecurring ? '<span class="social-neo-pill">Recurring</span>' : ''}
                                ${item.maxSeats ? `<span class="social-neo-pill">${escape(seatSummary)}</span>` : ''}
                                ${item.viewerCanDelete ? '<span class="social-neo-pill">You can remove this</span>' : ''}
                            </div>
                            <h3>${escape(title)}</h3>
                            <p>${escape(description)}</p>
                        </div>
                    </div>
                    <div class="social-neo-event-feature-meta">
                        <div class="social-neo-event-feature-meta-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <strong>${escape(timeLabel)}</strong>
                                <span>${escape(endLabel ? `Ends ${endLabel}` : 'Schedule set by organizer')}</span>
                            </div>
                        </div>
                        <div class="social-neo-event-feature-meta-item">
                            <i class="fas ${item.isOnline ? 'fa-globe' : 'fa-map-pin'}"></i>
                            <div>
                                <strong>${escape(text(item.location || (item.isOnline ? 'Online event' : 'Location to be announced')))}</strong>
                                <span>${escape(item.onlineLink ? 'Live link available after opening the event' : 'Shared with attendees')}</span>
                            </div>
                        </div>
                        <div class="social-neo-event-feature-meta-item">
                            <i class="fas fa-users"></i>
                            <div>
                                <strong>${escape(`${goingCount} going`)}${interestedCount ? ` &middot; ${escape(`${interestedCount} interested`)}` : ''}</strong>
                                <span>${escape(item.joinMode === 'invite-only' ? 'Invite only' : item.joinMode === 'member-required' ? 'Members only' : 'Open registration')}</span>
                            </div>
                        </div>
                    </div>
                    <div class="social-neo-event-feature-foot">
                        <div class="social-neo-event-feature-summary">
                            <span>${escape(text(item.scopeName || (tone === 'university' ? 'Campus-wide official listing' : 'Community event feed')))}</span>
                        </div>
                        <div class="social-neo-event-feature-actions">
                            <button class="social-neo-btn ${item.viewerRsvpStatus === 'going' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="event-rsvp" data-event-id="${escape(text(item.id))}" data-status="going">Going</button>
                            <button class="social-neo-btn ${item.viewerRsvpStatus === 'interested' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="event-rsvp" data-event-id="${escape(text(item.id))}" data-status="interested">Interested</button>
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="event-rsvp" data-event-id="${escape(text(item.id))}" data-status="declined">Decline</button>
                            ${item.viewerCanDelete ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-events-delete-btn" type="button" data-action="event-delete-open" data-event-id="${escape(text(item.id))}"><i class="fas fa-trash"></i> Remove event</button>` : ''}
                        </div>
                    </div>
                </article>
            `;
        }

        function renderEventGroups(list, tone, emptyCopy) {
            const groups = groupEventsByDate(list);
            if (!groups.length) return `<div class="social-neo-empty social-neo-events-empty">${escape(emptyCopy)}</div>`;
            return groups.map((group) => `
                <section class="social-neo-event-date-group">
                    <div class="social-neo-event-date-group-head">
                        <div>
                            <strong>${escape(group.label)}</strong>
                            <span>${escape(`${group.items.length} event${group.items.length === 1 ? '' : 's'}`)}</span>
                        </div>
                        <span class="social-neo-pill">${escape(tone === 'university' ? 'Official lane' : 'Student lane')}</span>
                    </div>
                    <div class="social-neo-event-date-group-body">
                        ${group.items.map((item) => renderEventFeatureCard(item, tone)).join('')}
                    </div>
                </section>
            `).join('');
        }

        function renderManagedEventsCard(title, list, emptyCopy) {
            return `
                <section class="social-neo-card social-neo-events-manage-card">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>${escape(title)}</strong>
                            <span>Events you created can be removed from here if they were published by mistake.</span>
                        </div>
                    </div>
                    <div class="social-neo-list">
                        ${list.length ? list.map((item) => `
                            <article class="social-neo-entity-card social-neo-events-manage-item">
                                <div>
                                    <strong>${escape(text(item.title || 'Untitled event'))}</strong>
                                    <span>${escape(item?.startsAt ? when(item.startsAt) : 'Time to be announced')}</span>
                                </div>
                                <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                    <span class="social-neo-pill">${escape(text(item.scopeName || 'Published event'))}</span>
                                    <button class="social-neo-btn social-neo-btn-ghost social-neo-events-delete-btn" type="button" data-action="event-delete-open" data-event-id="${escape(text(item.id))}">
                                        <i class="fas fa-trash"></i> Remove
                                    </button>
                                </div>
                            </article>
                        `).join('') : `<div class="social-neo-empty social-neo-events-empty">${escape(emptyCopy)}</div>`}
                    </div>
                </section>
            `;
        }

        const studentCreateForm = `
            <section class="social-neo-card social-neo-events-create-card social-neo-events-create-card--student">
                <div class="social-neo-events-create-head">
                    <div>
                        <strong>Create student event</strong>
                        <span>Advanced publishing for student-led meetups, sessions, and community activity.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="events-compose-close">
                        <i class="fas fa-xmark"></i> Close
                    </button>
                </div>
                <form class="social-neo-stack" data-form="create-event">
                    <input class="social-neo-input" id="${escape(eventTitleId)}" type="text" name="eventTitle" placeholder="Event title" value="${escape(text(runtime.ui?.eventTitle || ''))}">
                    <textarea class="social-neo-textarea" id="${escape(eventDescId)}" rows="4" name="eventDescription" placeholder="What is happening, who should join, and what should people bring?">${escape(text(runtime.ui?.eventDescription || ''))}</textarea>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label for="${escape(eventStartsAtId)}">
                            <span class="social-neo-label">Starts</span>
                            <input class="social-neo-input" id="${escape(eventStartsAtId)}" type="datetime-local" name="eventStartsAt" value="${escape(text(runtime.ui?.eventStartsAt || ''))}">
                        </label>
                        <label for="${escape(eventEndsAtId)}">
                            <span class="social-neo-label">Ends</span>
                            <input class="social-neo-input" id="${escape(eventEndsAtId)}" type="datetime-local" name="eventEndsAt" value="${escape(text(runtime.ui?.eventEndsAt || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label for="${escape(eventLocationId)}">
                            <span class="social-neo-label">Location</span>
                            <input class="social-neo-input" id="${escape(eventLocationId)}" type="text" name="eventLocation" placeholder="Library, Room 204, Courtyard, Zoom..." value="${escape(text(runtime.ui?.eventLocation || ''))}">
                        </label>
                        <label for="${escape(eventCategoryId)}">
                            <span class="social-neo-label">Category</span>
                            <select class="social-neo-select" id="${escape(eventCategoryId)}" name="eventCategory" data-lux-native data-lux-picker-enhanced="true">
                                <option value="social" ${text(runtime.ui?.eventCategory || 'social') === 'social' ? 'selected' : ''}>Social</option>
                                <option value="academic" ${text(runtime.ui?.eventCategory) === 'academic' ? 'selected' : ''}>Academic</option>
                                <option value="club" ${text(runtime.ui?.eventCategory) === 'club' ? 'selected' : ''}>Club</option>
                                <option value="career" ${text(runtime.ui?.eventCategory) === 'career' ? 'selected' : ''}>Career</option>
                                <option value="study" ${text(runtime.ui?.eventCategory) === 'study' ? 'selected' : ''}>Study session</option>
                                <option value="other" ${text(runtime.ui?.eventCategory) === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </label>
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-3">
                        <label for="${escape(eventScopeId)}">
                            <span class="social-neo-label">Publish in</span>
                            <select class="social-neo-select" id="${escape(eventScopeId)}" name="eventScope">
                                ${scopeOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${selectedEventScope === `${option.type}:${option.id}` ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                            </select>
                        </label>
                        <label for="${escape(eventJoinModeId)}">
                            <span class="social-neo-label">Join mode</span>
                            <select class="social-neo-select" id="${escape(eventJoinModeId)}" name="eventJoinMode" data-lux-native data-lux-picker-enhanced="true">
                                <option value="open" ${text(runtime.ui?.eventJoinMode || 'open') === 'open' ? 'selected' : ''}>Open to all</option>
                                <option value="member-required" ${text(runtime.ui?.eventJoinMode) === 'member-required' ? 'selected' : ''}>Members only</option>
                                <option value="invite-only" ${text(runtime.ui?.eventJoinMode) === 'invite-only' ? 'selected' : ''}>Invite only</option>
                            </select>
                        </label>
                        <label for="${escape(eventMaxSeatsId)}">
                            <span class="social-neo-label">Max seats</span>
                            <input class="social-neo-input" id="${escape(eventMaxSeatsId)}" type="number" name="eventMaxSeats" min="1" placeholder="Unlimited" value="${escape(text(runtime.ui?.eventMaxSeats || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-inline social-neo-events-toggle-row social-neo-inline-gap-14-wrap">
                        <label class="social-neo-checkbox" for="${escape(eventIsOnlineId)}">
                            <input id="${escape(eventIsOnlineId)}" type="checkbox" name="eventIsOnline" ${runtime.ui?.eventIsOnline ? 'checked' : ''}>
                            <span>Online event</span>
                        </label>
                        <label class="social-neo-checkbox" for="${escape(eventRecurringId)}">
                            <input id="${escape(eventRecurringId)}" type="checkbox" name="eventRecurring" ${runtime.ui?.eventRecurring ? 'checked' : ''}>
                            <span>Recurring weekly</span>
                        </label>
                        ${runtime.ui?.eventIsOnline ? `
                            <input class="social-neo-input social-neo-input-flex-1-180" id="${escape(eventOnlineLinkId)}" type="url" name="eventOnlineLink" placeholder="https://zoom.us/..." value="${escape(text(runtime.ui?.eventOnlineLink || ''))}">
                        ` : ''}
                    </div>
                    <div class="social-neo-inline social-neo-events-form-actions">
                        <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-pointer">
                            <i class="fas fa-image"></i> Add cover photo
                            <input id="${escape(eventImageId)}" name="eventImage" type="file" accept="image/*" hidden>
                        </label>
                        ${runtime.ui?.eventImageFile ? `<span class="social-neo-draft-file"><i class="fas fa-image"></i> ${escape(runtime.ui.eventImageFile.name)}</span>` : ''}
                        <span class="social-neo-flex-spacer"></span>
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-calendar-plus"></i> Create student event</button>
                    </div>
                </form>
            </section>
        `;

        const universityCreateForm = isStaff ? `
            <section class="social-neo-card social-neo-events-create-card social-neo-events-create-card--university">
                <div class="social-neo-events-create-head">
                    <div>
                        <strong>Publish official event</strong>
                        <span>Advanced publishing for official notices, faculty sessions, and university-wide programming.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="events-compose-close">
                        <i class="fas fa-xmark"></i> Close
                    </button>
                </div>
                <form class="social-neo-stack" data-form="create-event">
                    <input type="hidden" name="eventCategory" value="university">
                    <input type="hidden" name="eventIsOfficial" value="true">
                    <input class="social-neo-input" type="text" name="eventTitle" placeholder="Official event title" value="${escape(text(runtime.ui?.eventTitle || ''))}">
                    <textarea class="social-neo-textarea" rows="4" name="eventDescription" placeholder="Explain the session, speakers, and what students should expect.">${escape(text(runtime.ui?.eventDescription || ''))}</textarea>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Starts</span>
                            <input class="social-neo-input" type="datetime-local" name="eventStartsAt" value="${escape(text(runtime.ui?.eventStartsAt || ''))}">
                        </label>
                        <label>
                            <span class="social-neo-label">Ends</span>
                            <input class="social-neo-input" type="datetime-local" name="eventEndsAt" value="${escape(text(runtime.ui?.eventEndsAt || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Venue / room</span>
                            <input class="social-neo-input" type="text" name="eventLocation" placeholder="Auditorium A, Hall 3, Online..." value="${escape(text(runtime.ui?.eventLocation || ''))}">
                        </label>
                        <label>
                            <span class="social-neo-label">Access</span>
                            <select class="social-neo-select" name="eventJoinMode" data-lux-native data-lux-picker-enhanced="true">
                                <option value="open" ${text(runtime.ui?.eventJoinMode || 'open') === 'open' ? 'selected' : ''}>Open to all students</option>
                                <option value="member-required" ${text(runtime.ui?.eventJoinMode) === 'member-required' ? 'selected' : ''}>Faculty members only</option>
                                <option value="invite-only" ${text(runtime.ui?.eventJoinMode) === 'invite-only' ? 'selected' : ''}>Invite only</option>
                            </select>
                        </label>
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Publish in</span>
                            <select class="social-neo-select" name="eventScope">
                                ${scopeOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${selectedEventScope === `${option.type}:${option.id}` ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                            </select>
                        </label>
                        <label>
                            <span class="social-neo-label">Max seats</span>
                            <input class="social-neo-input" type="number" name="eventMaxSeats" min="1" placeholder="Unlimited" value="${escape(text(runtime.ui?.eventMaxSeats || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-inline social-neo-events-toggle-row social-neo-inline-gap-14-wrap">
                        <label class="social-neo-checkbox">
                            <input type="checkbox" name="eventIsOnline" ${runtime.ui?.eventIsOnline ? 'checked' : ''}>
                            <span>Online / hybrid</span>
                        </label>
                        <label class="social-neo-checkbox">
                            <input type="checkbox" name="eventRecurring" ${runtime.ui?.eventRecurring ? 'checked' : ''}>
                            <span>Recurring weekly</span>
                        </label>
                        ${runtime.ui?.eventIsOnline ? `
                            <input class="social-neo-input social-neo-input-flex-1-180" type="url" name="eventOnlineLink" placeholder="https://meeting-link.example" value="${escape(text(runtime.ui?.eventOnlineLink || ''))}">
                        ` : ''}
                    </div>
                    <div class="social-neo-inline social-neo-events-form-actions">
                        <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-pointer">
                            <i class="fas fa-image"></i> Add cover photo
                            <input name="eventImage" type="file" accept="image/*" hidden>
                        </label>
                        ${runtime.ui?.eventImageFile ? `<span class="social-neo-draft-file"><i class="fas fa-image"></i> ${escape(runtime.ui.eventImageFile.name)}</span>` : ''}
                        <span class="social-neo-flex-spacer"></span>
                        <button class="social-neo-btn social-neo-btn-primary is-blue" type="submit"><i class="fas fa-university"></i> Publish official event</button>
                    </div>
                </form>
            </section>
        ` : `
            <section class="social-neo-card social-neo-events-create-card social-neo-events-create-card--university">
                <div class="social-neo-events-create-head">
                    <div>
                        <strong>Official events are staff-managed</strong>
                        <span>Faculty and administrators can publish campus-wide events here. Students can still browse the full university calendar.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="events-compose-close">
                        <i class="fas fa-xmark"></i> Close
                    </button>
                </div>
                <div class="social-neo-empty social-neo-events-empty">
                    Official university announcements, exam sessions, and administration-led events will appear here as soon as staff publish them.
                </div>
            </section>
        `;

        const studyGroupCreateForm = `
            <section class="social-neo-card social-neo-events-create-card social-neo-events-create-card--study">
                <div class="social-neo-events-create-head">
                    <div>
                        <strong>Create study group</strong>
                        <span>Open the advanced options only when you are ready to set visibility, capacity, and course focus.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="events-compose-close">
                        <i class="fas fa-xmark"></i> Close
                    </button>
                </div>
                <form class="social-neo-stack" data-form="create-group">
                    <input type="hidden" name="groupType" value="study">
                    <input class="social-neo-input" type="text" name="groupName" placeholder="e.g. MATH 201 - Study Circle" value="${escape(text(runtime.ui?.groupName || ''))}">
                    <textarea class="social-neo-textarea" rows="3" name="groupDescription" placeholder="Course or topic, meeting frequency, and what people should expect.">${escape(text(runtime.ui?.groupDescription || ''))}</textarea>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label>
                            <span class="social-neo-label">Visibility</span>
                            <select class="social-neo-select" name="groupVisibility" data-lux-native data-lux-picker-enhanced="true">
                                <option value="public" ${text(runtime.ui?.groupVisibility || 'public') === 'public' ? 'selected' : ''}>Open - anyone can join</option>
                                <option value="private" ${text(runtime.ui?.groupVisibility) === 'private' ? 'selected' : ''}>Request to join</option>
                            </select>
                        </label>
                        <label>
                            <span class="social-neo-label">Max members</span>
                            <input class="social-neo-input" type="number" name="groupMaxMembers" min="2" max="100" placeholder="No limit" value="${escape(text(runtime.ui?.groupMaxMembers || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-form-actions">
                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-users"></i> Create study group</button>
                    </div>
                </form>
            </section>
        `;

        const studyGroupsListCard = `
            <section class="social-neo-card social-neo-events-list-card">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Active study groups</strong>
                        <span>Browse and join the groups forming right now.</span>
                    </div>
                </div>
                <div class="social-neo-list">
                    ${studyGroups.length ? studyGroups.map((group) => `
                        <article class="social-neo-entity-card social-neo-entity-card--study">
                            <div>
                                <strong>${escape(text(group.name || 'Study Group'))}</strong>
                                <span>${escape(text(group.description || ''))}</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-4">
                                    <span class="social-neo-pill"><i class="fas fa-users social-neo-pill-icon"></i> ${escape(group.memberCount || 0)} members</span>
                                    <span class="social-neo-pill">${escape(text(group.visibility || 'public'))}</span>
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-inline-column-end">
                                ${group.membershipState === 'member' || group.membershipState === 'manager'
                                    ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-chat" data-group-id="${escape(text(group.id))}">Open chat</button>
                                       <button class="social-neo-link-btn" type="button" data-action="group-leave-open" data-group-id="${escape(text(group.id))}">Leave</button>`
                                    : group.membershipState === 'pending'
                                        ? '<span class="social-neo-pill">Pending</span>'
                                        : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-join" data-group-id="${escape(text(group.id))}">${text(group.visibility) === 'private' ? 'Request to join' : 'Join'}</button>`
                                }
                            </div>
                        </article>
                    `).join('') : '<div class="social-neo-empty">No study groups yet. Be the first to create one.</div>'}
                </div>
            </section>
        `;

        const createActionConfig = eventsTab === 'university'
            ? {
                icon: 'fa-university',
                label: isStaff ? 'Publish Official Event' : 'View Publishing Rules',
                helper: isStaff ? 'Advanced official event options' : 'Who can publish here'
            }
            : eventsTab === 'studygroups'
                ? {
                    icon: 'fa-users',
                    label: 'Create Study Group',
                    helper: 'Open advanced study group options'
                }
                : {
                    icon: 'fa-calendar-plus',
                    label: 'Create Student Event',
                    helper: 'Open advanced event options'
                };

        const activeSectionMarkup = eventsTab === 'university'
            ? `
                <section class="social-neo-events-lane social-neo-events-lane--university ${universitySectionState}">
                    <div class="social-neo-events-banner">
                        <div class="social-neo-events-banner-copy">
                            <span class="social-neo-events-kicker">University events</span>
                            <h3>Official sessions, administration announcements, and faculty-led programming.</h3>
                            <p>This lane is calmer and more authoritative so students can identify trusted campus-wide events immediately.</p>
                        </div>
                        <div class="social-neo-events-banner-pills">
                            <span class="social-neo-pill">${escape(`${uniEvents.length} official`)}</span>
                            <span class="social-neo-pill">Cool lane</span>
                            <span class="social-neo-pill">${escape(isStaff ? 'Publishing enabled' : 'Browse only')}</span>
                        </div>
                    </div>
                    ${composerOpen ? `<div class="social-neo-events-compose-shell">${universityCreateForm}</div>` : ''}
                    <div class="social-neo-events-content">
                        ${renderManagedEventsCard('Your official events', manageableUniversityEvents, 'You have not published any removable official events yet.')}
                        <section class="social-neo-card social-neo-events-list-card">
                            <div class="social-neo-section-head">
                                <div>
                                    <strong>Official university calendar</strong>
                                    <span>Faculty and administration notices stay separate from community-driven student activity.</span>
                                </div>
                            </div>
                            <div class="social-neo-stack">${renderEventGroups(uniEvents, 'university', 'No official university events have been published yet.')}</div>
                        </section>
                    </div>
                </section>
            `
            : eventsTab === 'studygroups'
                ? `
                    <section class="social-neo-card social-neo-events-support-card ${studySectionState}">
                        <div class="social-neo-events-support-head">
                            <div>
                                <strong>Study groups</strong>
                                <span>Use this lane for course circles, practice sessions, and small recurring study teams.</span>
                            </div>
                            <div class="social-neo-badge-row">
                                <span class="social-neo-pill">${escape(`${studyGroups.length} active`)}</span>
                                <span class="social-neo-pill">Secondary lane</span>
                            </div>
                        </div>
                        ${composerOpen ? `<div class="social-neo-events-compose-shell">${studyGroupCreateForm}</div>` : ''}
                        <div class="social-neo-events-content">
                            ${studyGroupsListCard}
                        </div>
                    </section>
                `
                : `
                    <section class="social-neo-events-lane social-neo-events-lane--student ${studentSectionState}">
                        <div class="social-neo-events-banner">
                            <div class="social-neo-events-banner-copy">
                                <span class="social-neo-events-kicker">Student events</span>
                                <h3>Community-led sessions, club meetups, and class-driven activity.</h3>
                                <p>Everything students organize for other students lives here, with a cleaner calendar and hidden advanced creation tools.</p>
                            </div>
                            <div class="social-neo-events-banner-pills">
                                <span class="social-neo-pill">${escape(`${studentEvents.length} upcoming`)}</span>
                                <span class="social-neo-pill">Warm lane</span>
                                <span class="social-neo-pill">Open creation</span>
                            </div>
                        </div>
                        ${composerOpen ? `<div class="social-neo-events-compose-shell">${studentCreateForm}</div>` : ''}
                        <div class="social-neo-events-content">
                            ${renderManagedEventsCard('Your student events', manageableStudentEvents, 'You have not created any removable student events yet.')}
                            <section class="social-neo-card social-neo-events-list-card">
                                <div class="social-neo-section-head">
                                    <div>
                                        <strong>Student event calendar</strong>
                                        <span>Grouped by date, with the important details visible before people click anything.</span>
                                    </div>
                                </div>
                                <div class="social-neo-stack">${renderEventGroups(studentEvents, 'student', 'No student events yet. Publish the first community event in this lane.')}</div>
                            </section>
                        </div>
                    </section>
                `;

        return `
            <div class="social-neo-stack social-neo-events-shell">
                <section class="social-neo-card social-neo-events-hero">
                    <div class="social-neo-events-hero-head">
                        <div class="social-neo-events-hero-copy">
                            <div class="social-neo-badge-row">
                                <span class="social-neo-pill">${escape(`${allEvents.length} events`)}</span>
                                <span class="social-neo-pill">${escape(`${studyGroups.length} study groups`)}</span>
                                <span class="social-neo-pill">${escape(isStaff ? 'Staff publisher enabled' : 'Student view')}</span>
                            </div>
                            <h2>Campus events, separated by who they serve</h2>
                            <p>Use the segmented controls below to switch sections, then open advanced creation tools only when you need them.</p>
                        </div>
                        <div class="social-neo-events-hero-actions">
                            <button class="social-neo-btn social-neo-btn-primary social-neo-events-create-trigger ${composerOpen ? 'is-open' : ''}" type="button" data-action="events-compose-toggle">
                                <i class="fas ${escape(createActionConfig.icon)}"></i>
                                <span>${escape(composerOpen ? 'Hide Advanced Options' : createActionConfig.label)}</span>
                            </button>
                            <span>${escape(createActionConfig.helper)}</span>
                        </div>
                    </div>
                    <div class="social-neo-events-hero-grid">
                        <button class="social-neo-events-hero-stat lux-strip-card surface-card ${studentSectionState}" type="button" data-action="events-tab-student">
                            <div class="social-neo-events-hero-stat-icon"><i class="fas fa-calendar-days"></i></div>
                            <div class="social-neo-events-hero-stat-copy">
                                <strong>${escape(studentEvents.length)}</strong>
                                <span>Student events</span>
                                <small>Clubs, meetups, study jams</small>
                            </div>
                        </button>
                        <button class="social-neo-events-hero-stat lux-strip-card surface-card ${universitySectionState}" type="button" data-action="events-tab-university">
                            <div class="social-neo-events-hero-stat-icon"><i class="fas fa-landmark"></i></div>
                            <div class="social-neo-events-hero-stat-copy">
                                <strong>${escape(uniEvents.length)}</strong>
                                <span>University events</span>
                                <small>Official sessions and notices</small>
                            </div>
                        </button>
                        <button class="social-neo-events-hero-stat lux-strip-card surface-card ${studySectionState}" type="button" data-action="events-tab-studygroups">
                            <div class="social-neo-events-hero-stat-icon"><i class="fas fa-users"></i></div>
                            <div class="social-neo-events-hero-stat-copy">
                                <strong>${escape(studyGroups.length)}</strong>
                                <span>Study groups</span>
                                <small>Course circles and practice teams</small>
                            </div>
                        </button>
                    </div>
                </section>
                <div class="social-neo-events-lanes social-neo-events-lanes--single">
                    ${activeSectionMarkup}
                </div>
            </div>
        `;
    }

    function renderLostFoundPanel() {
        if (hasSocialLostFoundModule()) {
            return window.renderLostFoundPanel();
        }
        ensureSocialLostFoundModule().then(() => queueDeferredModuleRender('lost-found-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-magnifying-glass-location"></i>
                    <strong>Loading Lost &amp; Found</strong>
                    <span>Preparing listings, filters, and the item composer.</span>
                </div>
            </section>
        `;
    }

    function renderMessagesPanel() {
        if (hasSocialMessagesModule()) {
            return window.renderMessagesPanel();
        }
        ensureSocialMessagesModule().then(() => queueDeferredModuleRender('messages-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-comments"></i>
                    <strong>Loading Messages</strong>
                    <span>Preparing threads, group rails, and call controls.</span>
                </div>
            </section>
        `;
    }
    function renderAlertsPanelLegacy() {
        const user = currentUser();
        const notifications = notificationItems();
        const reports = Array.isArray(state().social?.reports) ? state().social.reports : [];
        const alertsFilter = text(state().ui?.alertsFilter || 'all') || 'all';
        const visibleNotifications = filterNotificationsByView(notifications, alertsFilter);
        const priorityNotifications = visibleNotifications.filter((notification) => classifyNotification(notification) !== 'system');
        const systemNotifications = visibleNotifications.filter((notification) => classifyNotification(notification) === 'system');
        const openReports = reports.filter((report) => text(report.reportStatus || 'open') === 'open');
        return `
            <div class="social-neo-grid-2">
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong>Moderation Queue</strong></div>
                        <span class="social-neo-pill"><strong>${escape(openReports.length)}</strong><span>Open reports</span></span>
                    </div>
                    <div class="social-neo-list">
                        ${openReports.length ? openReports.map((report) => `
                            <article class="social-neo-alert">
                                <div>
                                    <strong>${escape(text(report.targetEntityType || 'content').toUpperCase())}</strong>
                                    <p>${escape(text(report.reportReason || 'No reason provided.'))}</p>
                                    <div class="social-neo-badge-row">
                                        <span class="social-neo-pill">${escape(text(report.targetEntityType || 'post'))}</span>
                                        <span class="social-neo-pill">${escape(text(report.targetEntityId || ''))}</span>
                                    </div>
                                </div>
                                <div class="social-neo-inline">
                                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="dismiss">Dismiss</button>
                                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="remove">Remove</button>
                                </div>
                            </article>
                        `).join('') : `<div class="social-neo-empty">No open reports.</div>`}
                    </div>
                </section>
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong>Notifications</strong></div>
                        <span class="social-neo-pill"><strong>${escape(visibleNotifications.length)}</strong><span>Total</span></span>
                    </div>
                    <div class="social-neo-list">
                        ${(priorityNotifications.length ? priorityNotifications : systemNotifications).length ? (priorityNotifications.length ? priorityNotifications : systemNotifications).map((notification) => `
                            <article class="social-neo-alert ${notification.read ? '' : 'is-unread'}">
                                <div>
                                    <strong>${escape(text(notification.title || 'Notification'))}</strong>
                                    <p>${escape(text(notification.text || ''))}</p>
                                    <div class="social-neo-badge-row">
                                        <span class="social-neo-pill">${escape(classifyNotification(notification))}</span>
                                        ${notification.read ? '' : `<span class="social-neo-pill">Unread</span>`}
                                    </div>
                                    <span>${escape(when(notification.createdAt))}</span>
                                </div>
                                <div class="social-neo-inline">
                                    ${notification.routeData?.chatId ? `<button class="social-neo-link-btn" type="button" data-action="notification-open-chat" data-chat-id="${escape(text(notification.routeData.chatId))}" data-notification-id="${escape(text(notification.id))}">Open chat</button>` : notification.routeData?.groupId ? `<button class="social-neo-link-btn" type="button" data-action="notification-open-group" data-group-id="${escape(text(notification.routeData.groupId))}" data-notification-id="${escape(text(notification.id))}">Open group</button>` : ''}
                                    ${!notification.read ? `<button class="social-neo-link-btn" type="button" data-action="notification-read" data-notification-id="${escape(text(notification.id))}">Mark read</button>` : ''}
                                </div>
                            </article>
                        `).join('') : `<div class="social-neo-empty">No alerts match the current inbox filter.</div>`}
                        ${priorityNotifications.length && systemNotifications.length ? `
                            <div class="social-neo-divider"></div>
                            <span class="social-neo-label">System and campus notices</span>
                            ${systemNotifications.map((notification) => `
                                <article class="social-neo-alert ${notification.read ? '' : 'is-unread'}">
                                    <div>
                                        <strong>${escape(text(notification.title || 'Notification'))}</strong>
                                        <p>${escape(text(notification.text || ''))}</p>
                                        <span>${escape(when(notification.createdAt))}</span>
                                    </div>
                                    <div class="social-neo-inline">
                                        ${!notification.read ? `<button class="social-neo-link-btn" type="button" data-action="notification-read" data-notification-id="${escape(text(notification.id))}">Mark read</button>` : ''}
                                    </div>
                                </article>
                            `).join('')}
                        ` : ''}
                    </div>
                </section>
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong>Moderation</strong></div>
                    </div>
                    ${text(user?.role) === roleValue('ADMIN', 'admin')
                        ? `<div class="social-neo-list">
                            ${reports.length ? reports.map((report) => `
                                <article class="social-neo-entity-card">
                                    <div>
                                        <strong>${escape(text(report.targetEntityType || 'Item'))} / ${escape(text(report.targetEntityId || 'Unknown'))}</strong>
                                        <span>${escape(text(report.reportReason || 'No reason supplied.'))}</span>
                                        <div class="social-neo-badge-row">
                                            <span class="social-neo-pill">${escape(text(report.reportStatus || 'open'))}</span>
                                            <span class="social-neo-pill">${escape(when(report.createdAt))}</span>
                                        </div>
                                    </div>
                                </article>
                            `).join('') : `<div class="social-neo-empty">No moderation reports.</div>`}
                        </div>`
                        : `<div class="social-neo-empty">Moderation is visible only in admin workspace.</div>`
                    }
                </section>
            </div>
        `;
    }

    function renderGroupsPanel() {
        const runtime = state();
        const social = runtime.social || {};
        const groups = Array.isArray(social.groups) ? social.groups : [];
        const activeTab = text(runtime.ui?.groupsTab || 'discover');
        const joinedGroups = groups.filter(isJoinedGroup);
        const discoverGroups = groups;
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

        const renderMemberLine = (group, memberId) => {
            const account = accountById(memberId) || { id: memberId };
            return `
                <div class="social-neo-item-line">
                    <span>${escape(displayName(account))}</span>
                    ${group.isManager && text(memberId) !== currentUserId() ? `
                        <button class="social-neo-link-btn" type="button" data-action="group-member-remove" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Remove</button>
                    ` : ''}
                </div>
            `;
        };

        const renderGroupCard = (group) => {
            const pendingMembers = Array.isArray(group.pendingMemberIds) ? group.pendingMemberIds : [];
            const memberIds = Array.isArray(group.memberIds) ? group.memberIds : (Array.isArray(group.memberUserIds) ? group.memberUserIds : []);
            const pinnedCount = Array.isArray(group.pinnedPostIds) ? group.pinnedPostIds.length : 0;
            const previewNames = groupMemberPreviewNames(memberIds, 5);
            return `
                <article class="social-neo-card social-neo-group-card">
                    <div class="social-neo-group-card-header">
                        <div class="social-neo-group-card-icon social-neo-group-card-avatar">${groupAvatar(group)}</div>
                        <div>
                            <strong>${escape(text(group.name || 'Group'))}</strong>
                            <span class="social-neo-group-card-meta">
                                <span class="social-neo-pill">${escape(text(group.visibility || 'public'))}</span>
                                <span>${escape(group.memberCount || memberIds.length || 0)} members</span>
                            </span>
                        </div>
                    </div>
                    <p class="social-neo-group-card-desc">${escape(text(group.description || 'No description yet.'))}</p>
                    <div class="social-neo-badge-row">
                        ${group.isManager ? `<span class="social-neo-pill">Managed by you</span>` : ''}
                        ${pendingMembers.length ? `<span class="social-neo-pill">${escape(pendingMembers.length)} pending</span>` : ''}
                        ${pinnedCount ? `<span class="social-neo-pill">${escape(pinnedCount)} pinned posts</span>` : ''}
                        ${previewNames.map((name) => `<span class="social-neo-pill">${escape(name)}</span>`).join('')}
                    </div>
                    <div class="social-neo-group-card-actions">
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(group.id))}">
                            <i class="fas fa-stream"></i> Feed
                        </button>
                        ${group.membershipState === 'manager' || group.membershipState === 'member'
                            ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-chat" data-group-id="${escape(text(group.id))}"><i class="fas fa-comments"></i> Chat</button>
                               <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-leave-open" data-group-id="${escape(text(group.id))}"><i class="fas fa-sign-out-alt"></i> Leave</button>`
                            : group.membershipState === 'pending'
                                ? `<span class="social-neo-pill">Request pending</span>`
                                : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-join" data-group-id="${escape(text(group.id))}">
                                    <i class="fas fa-plus"></i> ${text(group.visibility) === 'private' ? 'Request' : 'Join'}
                                  </button>`
                        }
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="group-report" data-group-id="${escape(text(group.id))}">
                            <i class="fas fa-flag"></i> Report
                        </button>
                    </div>
                    ${group.isManager ? `
                        <div class="social-neo-divider"></div>
                        <span class="social-neo-label">Manager tools</span>
                        <div class="social-neo-badge-row">
                            <button class="social-neo-btn social-neo-btn-sm ${text(group.visibility || 'public') === 'public' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="group-visibility-set" data-group-id="${escape(text(group.id))}" data-visibility="public">Public</button>
                            <button class="social-neo-btn social-neo-btn-sm ${text(group.visibility || 'public') === 'private' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="group-visibility-set" data-group-id="${escape(text(group.id))}" data-visibility="private">Private</button>
                        </div>
                        <div class="social-neo-list">
                            <article class="social-neo-entity-card">
                                <div>
                                    <strong>Members</strong>
                                    <span>${escape(memberIds.length || Number(group.memberCount || 0))} active members</span>
                                </div>
                                <div class="social-neo-stack social-neo-stack-w-100">
                                    ${memberIds.slice(0, 6).map((memberId) => renderMemberLine(group, memberId)).join('') || '<div class="social-neo-empty">No members yet.</div>'}
                                </div>
                            </article>
                            <article class="social-neo-entity-card">
                                <div>
                                    <strong>Pinned resources</strong>
                                    <span>${escape(pinnedCount)} pinned updates in this group feed</span>
                                </div>
                            </article>
                            ${pendingMembers.length ? `
                                <article class="social-neo-entity-card">
                                    <div>
                                        <strong>Pending requests</strong>
                                        <span>${escape(pendingMembers.length)} members waiting for approval</span>
                                    </div>
                                    <div class="social-neo-stack social-neo-stack-w-100">
                                        ${pendingMembers.map((memberId) => {
                                            const account = accountById(memberId) || { id: memberId };
                                            return `
                                                <div class="social-neo-item-line">
                                                    <span>${escape(displayName(account))}</span>
                                                    <div class="social-neo-inline">
                                                        <button class="social-neo-link-btn" type="button" data-action="group-approve" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Approve</button>
                                                        <button class="social-neo-link-btn" type="button" data-action="group-decline" data-group-id="${escape(text(group.id))}" data-member-id="${escape(text(memberId))}">Decline</button>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </article>
                            ` : ''}
                        </div>
                    ` : ''}
                </article>
            `;
        };

        const discoverView = `
            <div class="social-neo-groups-toolbar">
                <div>
                    <strong>Discover groups</strong>
                    <span>Find communities, clubs, and project spaces across campus.</span>
                </div>
                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="panel-groups" data-groups-tab="create">
                    <i class="fas fa-plus"></i> Create Group
                </button>
            </div>
            <div class="social-neo-groups-grid">
                ${discoverGroups.length ? discoverGroups.map(renderGroupCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-layer-group"></i>
                        <strong>No groups yet</strong>
                        <span>Create the first group to start a campus community.</span>
                        <div class="social-neo-form-actions social-neo-form-actions-mt-14">
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="panel-groups" data-groups-tab="create">
                                <i class="fas fa-plus-circle"></i> Create Group
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;

        const joinedView = `
            <div class="social-neo-groups-toolbar">
                <div>
                    <strong>Your groups</strong>
                    <span>Open the rooms you already belong to, then jump straight into chat.</span>
                </div>
                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="panel-groups" data-groups-tab="create">
                    <i class="fas fa-plus"></i> Create Another Group
                </button>
            </div>
            <div class="social-neo-groups-grid">
                ${joinedGroups.length ? joinedGroups.map(renderGroupCard).join('') : `
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-door-open"></i>
                        <strong>You haven't joined any groups</strong>
                        <span>Discover groups and join conversations.</span>
                        <div class="social-neo-form-actions social-neo-form-actions-mt-14">
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="panel-groups" data-groups-tab="create">
                                <i class="fas fa-plus-circle"></i> Create Group Instead
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;

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
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="group-creator-member-remove" data-user-id="${escape(text(memberId))}">
                            <i class="fas fa-xmark"></i> Remove
                        </button>
                    </div>
                `;
            }).join('')
            : '<div class="social-neo-empty">No invited members selected yet.</div>';

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
                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="group-creator-member-add" data-user-id="${escape(text(account.id))}">
                        <i class="fas fa-user-plus"></i> Invite
                    </button>
                </article>
            `).join('')
            : `<div class="social-neo-empty">${memberSearch || facultyFilter !== 'all' ? 'No people match the current search or faculty filter.' : 'Start typing or choose a faculty to find people.'}</div>`;

        const createView = `
            <div class="social-neo-groups-create-layout">
                <section class="social-neo-card social-neo-group-create-main">
                    <div class="social-neo-section-head">
                        <div>
                            <strong><i class="fas fa-plus-circle social-neo-section-accent-icon is-green"></i> Create New Group</strong>
                            <span>Build the group first, choose who to invite, then open the group chat with messages, file uploads, calls, and video calls.</span>
                        </div>
                    </div>
                    <form class="social-neo-stack" data-form="create-group">
                        <input class="social-neo-input" id="${escape(groupNameId)}" type="text" name="groupName" placeholder="Group name" value="${escape(text(runtime.ui?.groupName || ''))}">
                        <textarea class="social-neo-textarea" id="${escape(groupDescriptionId)}" rows="4" name="groupDescription" placeholder="What will members collaborate on?">${escape(text(runtime.ui?.groupDescription || ''))}</textarea>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label for="${escape(groupVisibilityId)}">
                                <span class="social-neo-label">Visibility</span>
                                <select class="social-neo-select" id="${escape(groupVisibilityId)}" name="groupVisibility" data-lux-native data-lux-picker-enhanced="true">
                                    <option value="public" ${text(runtime.ui?.groupVisibility || 'public') === 'public' ? 'selected' : ''}>Public - Anyone can join</option>
                                    <option value="private" ${text(runtime.ui?.groupVisibility) === 'private' ? 'selected' : ''}>Private - Approval required</option>
                                </select>
                            </label>
                            <label for="${escape(groupMaxMembersId)}">
                                <span class="social-neo-label">Max members</span>
                                <input class="social-neo-input" id="${escape(groupMaxMembersId)}" type="number" name="groupMaxMembers" min="2" max="100" placeholder="No limit" value="${escape(text(runtime.ui?.groupMaxMembers || ''))}">
                            </label>
                        </div>
                        <input type="hidden" name="groupType" value="standard">
                        <div class="social-neo-form-actions">
                            <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-layer-group"></i> Create Group</button>
                        </div>
                    </form>
                </section>

                <section class="social-neo-card social-neo-group-create-picker">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Invite members</strong>
                            <span>Search people by name, faculty, or role before you create the group. Invitations will be sent after creation.</span>
                        </div>
                    </div>
                    <div class="social-neo-stack">
                        <div class="social-neo-inline social-neo-inline-items-end social-neo-inline-gap-10-wrap">
                            <label class="social-neo-field-flex-1-260">
                                <span class="social-neo-label">Search people</span>
                                <input class="social-neo-input" id="${escape(memberSearchId)}" type="search" name="groupMemberSearch" placeholder="Search people to invite..." value="${escape(text(runtime.ui?.groupInviteSearch || ''))}">
                            </label>
                            <label class="social-neo-field-fixed-220">
                                <span class="social-neo-label">Faculty</span>
                                <select class="social-neo-select" id="${escape(memberFacultyId)}" name="groupMemberFaculty" data-lux-native data-lux-picker-enhanced="true">
                                    ${facultyOptions.map((faculty) => `<option value="${escape(faculty)}" ${facultyFilter === faculty ? 'selected' : ''}>${escape(faculty === 'all' ? 'All faculties' : facultyLabel(faculty))}</option>`).join('')}
                                </select>
                            </label>
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="group-member-search">
                                <i class="fas fa-search"></i> Search
                            </button>
                        </div>
                        <article class="social-neo-card social-neo-group-create-block">
                            <div class="social-neo-section-head">
                                <div>
                                    <strong>Selected members</strong>
                                    <span>${escape(selectedMemberIds.length)} invitation${selectedMemberIds.length === 1 ? '' : 's'} queued for this group.</span>
                                </div>
                            </div>
                            <div class="social-neo-list">${selectedMembersMarkup}</div>
                        </article>
                        <article class="social-neo-card social-neo-group-create-block">
                            <div class="social-neo-section-head">
                                <div>
                                    <strong>Search results</strong>
                                    <span>${escape(candidateAccounts.length)} people available to invite.</span>
                                </div>
                            </div>
                            <div class="social-neo-list">${searchResultsMarkup}</div>
                        </article>
                    </div>
                </section>
            </div>
        `;

        return activeTab === 'create' ? createView : activeTab === 'joined' ? joinedView : discoverView;
    }

    function renderPagesPanel() {
        const runtime = state();
        const social = runtime.social || {};
        const pages = Array.isArray(social.pages) ? social.pages : [];
        const activeTab = text(runtime.ui?.pagesTab || 'discover');
        const activeProfileId = text(runtime.ui?.activePageProfileId || '');
        const activeProfile = pages.find((page) => text(page?.id) === activeProfileId) || null;
        const pageProfileTab = text(runtime.ui?.pageProfileTab || 'all');
        const pageSearch = text(runtime.ui?.pagesSearch || '').trim().toLowerCase();
        const wizardOpen = Boolean(runtime.ui?.pageWizardOpen);
        const wizardStep = Math.min(5, Math.max(1, Number(runtime.ui?.pageWizardStep || 1)));
        const followedPages = pages.filter((page) => page?.isFollowing || isManagedPage(page));
        const pagesSearchId = controlId('pagesSearch');
        const pageNameId = controlId('pageName');
        const pageDescriptionId = controlId('pageDescription');
        const pageVisibilityId = controlId('pageVisibility');
        const pageCategoryId = controlId('pageCategory');
        const pageTypeId = controlId('pageType');
        const pageAvatarUrlId = controlId('pageAvatarUrl');
        const pageCoverUrlId = controlId('pageCoverUrl');
        const pageTaglineId = controlId('pageTagline');
        const pageAboutId = controlId('pageAbout');
        const pageWebsiteId = controlId('pageWebsite');
        const pageContactEmailId = controlId('pageContactEmail');
        const pageLocationId = controlId('pageLocation');
        const pageActionLabelId = controlId('pageActionLabel');
        const pageActionUrlId = controlId('pageActionUrl');
        const pagePostBodyId = controlId('pagePostBody', activeProfileId || 'new');
        const categories = ['Technology', 'Entertainment', 'Gaming', 'Sports', 'Education', 'Business', 'Community', 'Media', 'Campus'];
        const pageType = text(runtime.ui?.pageType || 'brand') || 'brand';
        const pageVisibility = text(runtime.ui?.pageVisibility || 'public') || 'public';
        const profilePosts = activeProfile
            ? (Array.isArray(runtime.feed) ? runtime.feed : []).filter((post) =>
                text(post?.scopeType) === 'page' && text(post?.scopeId) === text(activeProfile.id))
            : [];

        const normalizeLink = (value) => {
            const raw = text(value);
            if (!raw) return '';
            return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        };
        const followerIdsFor = (page) => Array.isArray(page?.followerIds)
            ? page.followerIds
            : (Array.isArray(page?.followerUserIds) ? page.followerUserIds : []);
        const adminIdsFor = (page) => {
            const ids = Array.isArray(page?.adminIds) ? page.adminIds : (Array.isArray(page?.adminUserIds) ? page.adminUserIds : []);
            return uniqueStrings([...ids, text(page?.ownerUserId || '')].filter(Boolean));
        };
        const pageMatchesSearch = (page) => {
            if (!pageSearch) return true;
            const haystack = [
                page?.name,
                page?.description,
                page?.tagline,
                page?.about,
                page?.category,
                page?.facultyName,
                page?.location
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(pageSearch);
        };
        const filteredPages = pages.filter(pageMatchesSearch);
        const filteredFollowedPages = followedPages.filter(pageMatchesSearch);
        const visiblePages = activeTab === 'following' ? filteredFollowedPages : filteredPages;
        const managedCount = pages.filter((page) => isManagedPage(page)).length;
        const officialCount = pages.filter((page) => Boolean(page?.official) || text(page?.pageType) === 'campus').length;
        const brandCount = pages.filter((page) => !Boolean(page?.official) && text(page?.pageType || 'brand') !== 'campus').length;

        const sortPagePosts = (records, page) => {
            const pinnedIds = new Set(Array.isArray(page?.pinnedPostIds) ? page.pinnedPostIds.map((item) => text(item)) : []);
            return [...records].sort((left, right) => {
                const leftPinned = pinnedIds.has(text(left?.id));
                const rightPinned = pinnedIds.has(text(right?.id));
                if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
                if (pageProfileTab === 'all') {
                    const leftOfficial = text(left?.postType || 'community') === 'official';
                    const rightOfficial = text(right?.postType || 'community') === 'official';
                    if (leftOfficial !== rightOfficial) return leftOfficial ? -1 : 1;
                }
                return new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();
            });
        };

        const filterProfilePosts = (page) => {
            if (!page) return [];
            if (pageProfileTab === 'about') return [];
            const records = profilePosts.filter((post) => {
                if (pageProfileTab === 'official') return text(post?.postType || '') === 'official';
                if (pageProfileTab === 'community') return text(post?.postType || '') === 'community';
                return true;
            });
            return sortPagePosts(records, page);
        };

        const renderPageHero = () => `
            <section class="social-neo-card social-neo-pages-hero">
                <div class="social-neo-pages-hero-copy">
                    <div class="social-neo-badge-row">
                        <span class="social-neo-pill">${escape(pages.length)} pages</span>
                        <span class="social-neo-pill">${escape(managedCount)} managed by you</span>
                        <span class="social-neo-pill">${escape(officialCount)} official</span>
                    </div>
                    <h2>Build pages that feel like real public communities.</h2>
                    <p>Create branded destinations for companies, products, student communities, clubs, or official university teams. Pages get their own cover, follow button, contact details, and a feed with official and community posts.</p>
                </div>
                <div class="social-neo-pages-hero-stats">
                    <article>
                        <strong>${escape(brandCount)}</strong>
                        <span>Brand / community pages</span>
                    </article>
                    <article>
                        <strong>${escape(officialCount)}</strong>
                        <span>Campus / official pages</span>
                    </article>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-pages-create-trigger" type="button" data-action="page-wizard-open">
                        <i class="fas fa-plus"></i> Create Page
                    </button>
                </div>
            </section>
        `;

        const renderSearchBar = () => `
            <form class="social-neo-inline social-neo-pages-toolbar" data-form="pages-search">
                <label class="social-neo-field-flex-1-260">
                    <span class="social-neo-label">Search pages</span>
                    <input class="social-neo-input" id="${escape(pagesSearchId)}" name="pagesSearch" type="search" placeholder="Search pages by name, category, or bio..." data-bind="pages-search" value="${escape(text(runtime.ui?.pagesSearch || ''))}">
                </label>
                <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-search"></i> Search</button>
            </form>
        `;

        const renderPageCard = (page) => {
            const followerIds = followerIdsFor(page);
            const adminIds = adminIdsFor(page);
            const coverSrc = pageCover(page);
            const actionHref = normalizeLink(page?.actionUrl || page?.website || '');
            const pinnedCount = Array.isArray(page?.pinnedPostIds) ? page.pinnedPostIds.length : 0;
            return `
                <article class="social-neo-card social-neo-page-card social-neo-page-card-rich">
                    <div class="social-neo-page-card-cover">
                        ${coverSrc ? `<img src="${escape(coverSrc)}" alt="${escape(text(page?.name || 'Page'))} cover">` : `<div class="social-neo-page-card-cover-fallback"></div>`}
                    </div>
                    <div class="social-neo-page-card-body">
                        <div class="social-neo-page-card-brand">
                            ${pageAvatar(page, 'social-neo-page-card-avatar')}
                            <div>
                                <strong>${escape(text(page?.name || 'Page'))}</strong>
                                <span class="social-neo-page-card-meta">
                                    <span class="social-neo-pill">${escape(pageTypeLabel(page))}</span>
                                    <span class="social-neo-pill">${escape(text(page?.category || 'General'))}</span>
                                    ${page?.official ? '<span class="social-neo-pill">Official</span>' : ''}
                                </span>
                            </div>
                        </div>
                        <p class="social-neo-page-card-desc">${escape(text(page?.tagline || page?.description || 'No tagline yet.'))}</p>
                        <div class="social-neo-badge-row">
                            <span class="social-neo-pill">${escape(page?.followerCount || followerIds.length || 0)} followers</span>
                            ${page?.location ? `<span class="social-neo-pill">${escape(page.location)}</span>` : ''}
                            ${pinnedCount ? `<span class="social-neo-pill">${escape(pinnedCount)} pinned</span>` : ''}
                            ${isManagedPage(page) ? '<span class="social-neo-pill">Managed by you</span>' : ''}
                        </div>
                        <div class="social-neo-page-card-actions">
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-open-profile" data-page-id="${escape(text(page?.id))}">
                                <i class="fas fa-globe"></i> Open Page
                            </button>
                            <button class="social-neo-btn ${page?.isFollowing ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="page-follow" data-page-id="${escape(text(page?.id))}">
                                <i class="fas ${page?.isFollowing ? 'fa-check' : 'fa-plus'}"></i> ${page?.isFollowing ? 'Following' : 'Follow'}
                            </button>
                            ${actionHref ? `<a class="social-neo-btn social-neo-btn-ghost" href="${escape(actionHref)}" target="_blank" rel="noopener"><i class="fas fa-up-right-from-square"></i> ${escape(text(page?.actionLabel || 'Visit'))}</a>` : ''}
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-report" data-page-id="${escape(text(page?.id))}">
                                <i class="fas fa-flag"></i> Report
                            </button>
                        </div>
                        <div class="social-neo-page-card-support">
                            <article class="social-neo-entity-card">
                                <div>
                                    <strong>About</strong>
                                    <span>${escape(text(page?.about || page?.description || 'No profile summary yet.'))}</span>
                                </div>
                            </article>
                            <article class="social-neo-entity-card">
                                <div>
                                    <strong>Managers</strong>
                                    <span>${escape(adminIds.length)} admin${adminIds.length === 1 ? '' : 's'} on this page</span>
                                </div>
                                <div class="social-neo-badge-row">
                                    ${adminIds.slice(0, 4).map((adminId) => `<span class="social-neo-pill">${escape(displayName(accountById(adminId) || { id: adminId }))}</span>`).join('')}
                                </div>
                            </article>
                        </div>
                    </div>
                </article>
            `;
        };

        const renderPageWizard = () => `
            <section class="social-neo-card social-neo-pages-wizard">
                <div class="social-neo-section-head">
                    <div>
                        <strong><i class="fas fa-flag social-neo-section-accent-icon is-blue"></i> Create a new page</strong>
                        <span>Build a public-facing page for a brand, product, club, department, or official campus team.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-wizard-close">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                <div class="social-neo-pages-wizard-steps">
                    ${[
                        ['1', 'Basics'],
                        ['2', 'Branding'],
                        ['3', 'About'],
                        ['4', 'Action'],
                        ['5', 'Preview']
                    ].map(([value, label]) => `
                        <span class="social-neo-pages-wizard-step ${Number(value) === wizardStep ? 'is-active' : Number(value) < wizardStep ? 'is-complete' : ''}">
                            <strong>${escape(value)}</strong>
                            <span>${escape(label)}</span>
                        </span>
                    `).join('')}
                </div>
                <form class="social-neo-stack" data-form="create-page">
                    ${wizardStep === 1 ? `
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label>
                                <span class="social-neo-label">Page name</span>
                                <input class="social-neo-input" id="${escape(pageNameId)}" type="text" name="pageName" placeholder="Apple, Netflix, Fortnite..." value="${escape(text(runtime.ui?.pageName || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Category</span>
                                <select class="social-neo-select" id="${escape(pageCategoryId)}" name="pageCategory" data-lux-native data-lux-picker-enhanced="true">
                                    ${categories.map((category) => `<option value="${escape(category)}" ${text(runtime.ui?.pageCategory || '') === category ? 'selected' : ''}>${escape(category)}</option>`).join('')}
                                </select>
                            </label>
                            <label>
                                <span class="social-neo-label">Page type</span>
                                <select class="social-neo-select" id="${escape(pageTypeId)}" name="pageType" data-lux-native data-lux-picker-enhanced="true">
                                    <option value="brand" ${pageType === 'brand' ? 'selected' : ''}>Brand / product</option>
                                    <option value="community" ${pageType === 'community' ? 'selected' : ''}>Community / fan page</option>
                                    <option value="campus" ${pageType === 'campus' ? 'selected' : ''}>Campus / official</option>
                                </select>
                            </label>
                            <label>
                                <span class="social-neo-label">Visibility</span>
                                <select class="social-neo-select" id="${escape(pageVisibilityId)}" name="pageVisibility" data-lux-native data-lux-picker-enhanced="true">
                                    <option value="public" ${pageVisibility === 'public' ? 'selected' : ''}>Public</option>
                                    <option value="private" ${pageVisibility === 'private' ? 'selected' : ''}>Private</option>
                                </select>
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 2 ? `
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label>
                                <span class="social-neo-label">Avatar image URL</span>
                                <input class="social-neo-input" id="${escape(pageAvatarUrlId)}" type="url" name="pageAvatarUrl" placeholder="https://..." value="${escape(text(runtime.ui?.pageAvatarUrl || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Cover image URL</span>
                                <input class="social-neo-input" id="${escape(pageCoverUrlId)}" type="url" name="pageCoverUrl" placeholder="https://..." value="${escape(text(runtime.ui?.pageCoverUrl || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Upload avatar</span>
                                <input class="social-neo-input" type="file" name="pageAvatarFile" accept="image/*">
                                ${renderFileChip(runtime.ui?.pageAvatarFile, 'Avatar image ready')}
                            </label>
                            <label>
                                <span class="social-neo-label">Upload cover</span>
                                <input class="social-neo-input" type="file" name="pageCoverFile" accept="image/*">
                                ${renderFileChip(runtime.ui?.pageCoverFile, 'Cover image ready')}
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 3 ? `
                        <div class="social-neo-stack">
                            <label>
                                <span class="social-neo-label">Tagline</span>
                                <input class="social-neo-input" id="${escape(pageTaglineId)}" type="text" name="pageTagline" placeholder="Short headline people will remember" value="${escape(text(runtime.ui?.pageTagline || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Short description</span>
                                <textarea class="social-neo-textarea" id="${escape(pageDescriptionId)}" rows="3" name="pageDescription" placeholder="What is this page for?">${escape(text(runtime.ui?.pageDescription || ''))}</textarea>
                            </label>
                            <label>
                                <span class="social-neo-label">About</span>
                                <textarea class="social-neo-textarea" id="${escape(pageAboutId)}" rows="5" name="pageAbout" placeholder="Tell people what this page offers, who runs it, and what they should expect.">${escape(text(runtime.ui?.pageAbout || ''))}</textarea>
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 4 ? `
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label>
                                <span class="social-neo-label">Website</span>
                                <input class="social-neo-input" id="${escape(pageWebsiteId)}" type="url" name="pageWebsite" placeholder="https://example.com" value="${escape(text(runtime.ui?.pageWebsite || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Contact email</span>
                                <input class="social-neo-input" id="${escape(pageContactEmailId)}" type="email" name="pageContactEmail" placeholder="team@example.com" value="${escape(text(runtime.ui?.pageContactEmail || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Location</span>
                                <input class="social-neo-input" id="${escape(pageLocationId)}" type="text" name="pageLocation" placeholder="Cupertino, CA / Online" value="${escape(text(runtime.ui?.pageLocation || ''))}">
                            </label>
                            <label>
                                <span class="social-neo-label">Primary action label</span>
                                <input class="social-neo-input" id="${escape(pageActionLabelId)}" type="text" name="pageActionLabel" placeholder="Visit site / Join beta / Learn more" value="${escape(text(runtime.ui?.pageActionLabel || ''))}">
                            </label>
                            <label class="social-neo-grid-col-span-all">
                                <span class="social-neo-label">Primary action URL</span>
                                <input class="social-neo-input" id="${escape(pageActionUrlId)}" type="url" name="pageActionUrl" placeholder="https://..." value="${escape(text(runtime.ui?.pageActionUrl || ''))}">
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 5 ? `
                        <div class="social-neo-pages-preview">
                            <div class="social-neo-page-preview-cover">
                                ${text(runtime.ui?.pageCoverUrl || '') ? `<img src="${escape(text(runtime.ui?.pageCoverUrl || ''))}" alt="Page cover preview">` : '<div class="social-neo-page-card-cover-fallback"></div>'}
                            </div>
                            <div class="social-neo-page-preview-head">
                                ${pageAvatar({ name: runtime.ui?.pageName, avatarImage: runtime.ui?.pageAvatarUrl }, 'social-neo-page-card-avatar')}
                                <div>
                                    <strong>${escape(text(runtime.ui?.pageName || 'Untitled page'))}</strong>
                                    <span class="social-neo-page-card-meta">
                                        <span class="social-neo-pill">${escape(text(runtime.ui?.pageCategory || categories[0]))}</span>
                                        <span class="social-neo-pill">${escape(pageType === 'campus' ? 'Official page' : pageType === 'community' ? 'Community page' : 'Brand page')}</span>
                                        <span class="social-neo-pill">${escape(pageVisibility)}</span>
                                    </span>
                                </div>
                            </div>
                            <p>${escape(text(runtime.ui?.pageTagline || runtime.ui?.pageDescription || 'Add a tagline to help people understand the page instantly.'))}</p>
                            <div class="social-neo-list">
                                <article class="social-neo-entity-card">
                                    <div>
                                        <strong>About</strong>
                                        <span>${escape(text(runtime.ui?.pageAbout || runtime.ui?.pageDescription || 'No about text yet.'))}</span>
                                    </div>
                                </article>
                                <article class="social-neo-entity-card">
                                    <div>
                                        <strong>Contact and action</strong>
                                        <span>${escape(text(runtime.ui?.pageActionLabel || 'Primary action'))}${text(runtime.ui?.pageActionUrl || runtime.ui?.pageWebsite || '') ? ` - ${escape(text(runtime.ui?.pageActionUrl || runtime.ui?.pageWebsite || ''))}` : ''}</span>
                                    </div>
                                </article>
                            </div>
                        </div>
                    ` : ''}
                    <div class="social-neo-form-actions">
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-wizard-prev" ${wizardStep === 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        ${wizardStep < 5 ? `
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="page-wizard-next">
                                Continue <i class="fas fa-arrow-right"></i>
                            </button>
                        ` : `
                            <button class="social-neo-btn social-neo-btn-primary" type="submit">
                                <i class="fas fa-rocket"></i> Publish Page
                            </button>
                        `}
                    </div>
                </form>
            </section>
        `;

        const renderProfileComposer = (page) => {
            const canPost = Boolean(page?.isManager || page?.isFollowing);
            if (!canPost) {
                return `
                    <article class="social-neo-card social-neo-page-compose-block">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>Join the conversation</strong>
                                <span>Follow this page first if you want to publish a community post.</span>
                            </div>
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="page-follow" data-page-id="${escape(text(page?.id))}">
                                <i class="fas fa-plus"></i> Follow Page
                            </button>
                        </div>
                    </article>
                `;
            }
            const selectedPostType = page?.isManager
                ? text(runtime.ui?.pagePostType || 'official') || 'official'
                : 'community';
            return `
                <article class="social-neo-card social-neo-page-compose-block">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>${page?.isManager ? 'Publish on this page' : 'Share with this community'}</strong>
                            <span>${page?.isManager ? 'Post as the page officially or open a community thread.' : 'Followers can publish community posts to this page feed.'}</span>
                        </div>
                    </div>
                    <form class="social-neo-stack" data-form="page-profile-post" data-page-id="${escape(text(page?.id))}">
                        ${page?.isManager ? `
                            <label>
                                <span class="social-neo-label">Post type</span>
                                <select class="social-neo-select" name="pagePostType" data-lux-native data-lux-picker-enhanced="true">
                                    <option value="official" ${selectedPostType === 'official' ? 'selected' : ''}>Official post</option>
                                    <option value="community" ${selectedPostType === 'community' ? 'selected' : ''}>Community post</option>
                                </select>
                            </label>
                        ` : '<input type="hidden" name="pagePostType" value="community">'}
                        <label>
                            <span class="social-neo-label">Message</span>
                            <textarea class="social-neo-textarea" id="${escape(pagePostBodyId)}" rows="4" name="pagePostBody" placeholder="${escape(page?.isManager ? 'Share an official update, launch note, or announcement...' : 'Share a community thought, reaction, or question...')}">${escape(text(runtime.ui?.pagePostBody || ''))}</textarea>
                        </label>
                        <label>
                            <span class="social-neo-label">Attachment</span>
                            <input class="social-neo-input" type="file" name="pagePostFile" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt">
                            ${renderFileChip(runtime.ui?.pagePostFile, 'Page attachment ready')}
                        </label>
                        <div class="social-neo-form-actions">
                            <button class="social-neo-btn social-neo-btn-primary" type="submit">
                                <i class="fas fa-paper-plane"></i> Publish
                            </button>
                        </div>
                    </form>
                </article>
            `;
        };

        const renderProfileAbout = (page) => {
            const adminIds = adminIdsFor(page);
            const followerIds = followerIdsFor(page);
            const actionHref = normalizeLink(page?.actionUrl || page?.website || '');
            const editMode = Boolean(runtime.ui?.pageProfileEditMode && page?.isManager);
            if (editMode) {
                return `
                    <form class="social-neo-card social-neo-page-about-card social-neo-stack" data-form="update-page-profile" data-page-id="${escape(text(page?.id))}">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>Edit page profile</strong>
                                <span>Update branding, contact details, and the public page summary.</span>
                            </div>
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-profile-edit-cancel">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label><span class="social-neo-label">Page name</span><input class="social-neo-input" type="text" name="pageName" value="${escape(text(runtime.ui?.pageName || page?.name || ''))}"></label>
                            <label><span class="social-neo-label">Category</span><select class="social-neo-select" name="pageCategory" data-lux-native data-lux-picker-enhanced="true">${categories.map((category) => `<option value="${escape(category)}" ${text(runtime.ui?.pageCategory || page?.category || '') === category ? 'selected' : ''}>${escape(category)}</option>`).join('')}</select></label>
                            <label><span class="social-neo-label">Page type</span><select class="social-neo-select" name="pageType" data-lux-native data-lux-picker-enhanced="true"><option value="brand" ${text(runtime.ui?.pageType || page?.pageType || 'brand') === 'brand' ? 'selected' : ''}>Brand / product</option><option value="community" ${text(runtime.ui?.pageType || page?.pageType || 'brand') === 'community' ? 'selected' : ''}>Community / fan page</option><option value="campus" ${text(runtime.ui?.pageType || page?.pageType || 'brand') === 'campus' ? 'selected' : ''}>Campus / official</option></select></label>
                            <label><span class="social-neo-label">Visibility</span><select class="social-neo-select" name="pageVisibility" data-lux-native data-lux-picker-enhanced="true"><option value="public" ${text(runtime.ui?.pageVisibility || page?.visibility || 'public') === 'public' ? 'selected' : ''}>Public</option><option value="private" ${text(runtime.ui?.pageVisibility || page?.visibility || 'public') === 'private' ? 'selected' : ''}>Private</option></select></label>
                            <label><span class="social-neo-label">Avatar image URL</span><input class="social-neo-input" type="url" name="pageAvatarUrl" value="${escape(text(runtime.ui?.pageAvatarUrl || page?.avatarImage || ''))}"></label>
                            <label><span class="social-neo-label">Cover image URL</span><input class="social-neo-input" type="url" name="pageCoverUrl" value="${escape(text(runtime.ui?.pageCoverUrl || page?.coverImage || ''))}"></label>
                            <label><span class="social-neo-label">Upload avatar</span><input class="social-neo-input" type="file" name="pageAvatarFile" accept="image/*">${renderFileChip(runtime.ui?.pageAvatarFile, 'Avatar image ready')}</label>
                            <label><span class="social-neo-label">Upload cover</span><input class="social-neo-input" type="file" name="pageCoverFile" accept="image/*">${renderFileChip(runtime.ui?.pageCoverFile, 'Cover image ready')}</label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">Tagline</span><input class="social-neo-input" type="text" name="pageTagline" value="${escape(text(runtime.ui?.pageTagline || page?.tagline || ''))}"></label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">Short description</span><textarea class="social-neo-textarea" rows="3" name="pageDescription">${escape(text(runtime.ui?.pageDescription || page?.description || ''))}</textarea></label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">About</span><textarea class="social-neo-textarea" rows="5" name="pageAbout">${escape(text(runtime.ui?.pageAbout || page?.about || ''))}</textarea></label>
                            <label><span class="social-neo-label">Website</span><input class="social-neo-input" type="url" name="pageWebsite" value="${escape(text(runtime.ui?.pageWebsite || page?.website || ''))}"></label>
                            <label><span class="social-neo-label">Contact email</span><input class="social-neo-input" type="email" name="pageContactEmail" value="${escape(text(runtime.ui?.pageContactEmail || page?.contactEmail || ''))}"></label>
                            <label><span class="social-neo-label">Location</span><input class="social-neo-input" type="text" name="pageLocation" value="${escape(text(runtime.ui?.pageLocation || page?.location || ''))}"></label>
                            <label><span class="social-neo-label">Primary action label</span><input class="social-neo-input" type="text" name="pageActionLabel" value="${escape(text(runtime.ui?.pageActionLabel || page?.actionLabel || ''))}"></label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">Primary action URL</span><input class="social-neo-input" type="url" name="pageActionUrl" value="${escape(text(runtime.ui?.pageActionUrl || page?.actionUrl || ''))}"></label>
                        </div>
                        <div class="social-neo-form-actions">
                            <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-save"></i> Save Page</button>
                        </div>
                    </form>
                `;
            }
            return `
                <div class="social-neo-page-profile-layout">
                    <article class="social-neo-card social-neo-page-about-card">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>About ${escape(text(page?.name || 'this page'))}</strong>
                                <span>${escape(text(page?.tagline || 'Public profile information and contact details.'))}</span>
                            </div>
                            ${page?.isManager ? `
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-profile-edit-toggle" data-page-id="${escape(text(page?.id))}">
                                    <i class="fas fa-pen"></i> Edit page
                                </button>
                            ` : ''}
                        </div>
                        <div class="social-neo-list">
                            <article class="social-neo-entity-card"><div><strong>About</strong><span>${escape(text(page?.about || page?.description || 'No about text yet.'))}</span></div></article>
                            <article class="social-neo-entity-card"><div><strong>Contact</strong><span>${escape(text(page?.contactEmail || 'No contact email listed.'))}</span></div></article>
                            <article class="social-neo-entity-card"><div><strong>Website</strong><span>${actionHref ? `<a href="${escape(actionHref)}" target="_blank" rel="noopener">${escape(text(page?.website || page?.actionUrl || 'Visit page'))}</a>` : 'No website linked yet.'}</span></div></article>
                            <article class="social-neo-entity-card"><div><strong>Location</strong><span>${escape(text(page?.location || 'No location listed.'))}</span></div></article>
                        </div>
                    </article>
                    <article class="social-neo-card social-neo-page-about-card">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>People on this page</strong>
                                <span>${escape(adminIds.length)} admins and ${escape(page?.followerCount || followerIds.length || 0)} followers.</span>
                            </div>
                        </div>
                        <div class="social-neo-list">
                            <article class="social-neo-entity-card">
                                <div><strong>Admins</strong><span>${escape(adminIds.length)} people manage this page.</span></div>
                                <div class="social-neo-badge-row">${adminIds.map((adminId) => `<span class="social-neo-pill">${escape(displayName(accountById(adminId) || { id: adminId }))}</span>`).join('')}</div>
                            </article>
                            <article class="social-neo-entity-card">
                                <div><strong>Followers</strong><span>${escape(page?.followerCount || followerIds.length || 0)} people follow this page.</span></div>
                                <div class="social-neo-badge-row">${followerIds.slice(0, 10).map((followerId) => `<span class="social-neo-pill">${escape(displayName(accountById(followerId) || { id: followerId }))}</span>`).join('') || '<span class="social-neo-muted">Followers will appear here as the page grows.</span>'}</div>
                            </article>
                        </div>
                    </article>
                </div>
            `;
        };

        const renderPageProfile = (page) => {
            const posts = filterProfilePosts(page);
            const coverSrc = pageCover(page);
            const followerIds = followerIdsFor(page);
            const actionHref = normalizeLink(page?.actionUrl || page?.website || '');
            return `
                <section class="social-neo-pages-shell">
                    <article class="social-neo-card social-neo-page-profile">
                        <div class="social-neo-page-cover">
                            ${coverSrc ? `<img src="${escape(coverSrc)}" alt="${escape(text(page?.name || 'Page'))} cover">` : '<div class="social-neo-page-card-cover-fallback"></div>'}
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-page-profile-back" type="button" data-action="page-profile-back">
                                <i class="fas fa-arrow-left"></i> Back to pages
                            </button>
                        </div>
                        <div class="social-neo-page-profile-header">
                            <div class="social-neo-page-profile-brand">
                                ${pageAvatar(page, 'social-neo-page-profile-avatar')}
                                <div class="social-neo-page-profile-meta">
                                    <h3>${escape(text(page?.name || 'Page'))}</h3>
                                    <div class="social-neo-badge-row">
                                        <span class="social-neo-pill">${escape(pageTypeLabel(page))}</span>
                                        <span class="social-neo-pill">${escape(text(page?.category || 'General'))}</span>
                                        ${page?.official ? '<span class="social-neo-pill">Official</span>' : ''}
                                        ${page?.verified ? '<span class="social-neo-pill">Verified</span>' : ''}
                                        <span class="social-neo-pill">${escape(page?.followerCount || followerIds.length || 0)} followers</span>
                                    </div>
                                    <p>${escape(text(page?.tagline || page?.description || 'No page tagline yet.'))}</p>
                                </div>
                            </div>
                            <div class="social-neo-page-profile-actions">
                                <button class="social-neo-btn ${page?.isFollowing ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" data-action="page-follow" data-page-id="${escape(text(page?.id))}">
                                    <i class="fas ${page?.isFollowing ? 'fa-check' : 'fa-plus'}"></i> ${page?.isFollowing ? 'Following' : 'Follow'}
                                </button>
                                ${actionHref ? `<a class="social-neo-btn social-neo-btn-ghost" href="${escape(actionHref)}" target="_blank" rel="noopener"><i class="fas fa-up-right-from-square"></i> ${escape(text(page?.actionLabel || 'Visit'))}</a>` : ''}
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="page-report" data-page-id="${escape(text(page?.id))}">
                                    <i class="fas fa-flag"></i> Report
                                </button>
                            </div>
                        </div>
                        <div class="social-neo-page-profile-tabs">
                            ${[
                                ['all', 'All'],
                                ['official', 'Official'],
                                ['community', 'Community'],
                                ['about', 'About']
                            ].map(([value, label]) => `
                                <button class="social-neo-page-profile-tab ${pageProfileTab === value ? 'is-active' : ''}" type="button" data-action="page-profile-tab" data-page-profile-tab="${escape(value)}">
                                    ${escape(label)}
                                </button>
                            `).join('')}
                        </div>
                    </article>
                    ${pageProfileTab === 'about' ? renderProfileAbout(page) : `
                        ${(pageProfileTab !== 'official' || page?.isManager) ? renderProfileComposer(page) : ''}
                        <section class="social-neo-stack social-neo-page-feed">
                            ${posts.length ? posts.map((post) => renderPost(post)).join('') : `
                                <div class="social-neo-empty-hero">
                                    <i class="fas fa-comments"></i>
                                    <strong>${pageProfileTab === 'official' ? 'No official posts yet' : pageProfileTab === 'community' ? 'No community posts yet' : 'This page has not posted yet'}</strong>
                                    <span>${pageProfileTab === 'community' ? 'Followers can publish community posts here once they follow the page.' : 'Publish the first post to start the page conversation.'}</span>
                                </div>
                            `}
                        </section>
                    `}
                </section>
            `;
        };

        if (activeProfile) return renderPageProfile(activeProfile);

        return `
            <section class="social-neo-pages-shell">
                ${renderPageHero()}
                ${wizardOpen ? renderPageWizard() : ''}
                ${renderSearchBar()}
                <div class="social-neo-pages-grid">
                    ${visiblePages.length ? visiblePages.map(renderPageCard).join('') : `
                        <div class="social-neo-empty-hero">
                            <i class="fas fa-flag"></i>
                            <strong>${pageSearch ? 'No pages match your search' : activeTab === 'following' ? 'No followed pages yet' : 'No pages yet'}</strong>
                            <span>${pageSearch ? 'Try a different page name, category, or bio.' : activeTab === 'following' ? 'Follow pages to keep their official and community posts close.' : 'Use Create Page to launch the first page in this space.'}</span>
                            <div class="social-neo-form-actions social-neo-inline-end">
                                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="page-wizard-open">
                                    <i class="fas fa-plus"></i> Create Page
                                </button>
                            </div>
                        </div>
                    `}
                </div>
            </section>
        `;
    }

    function renderAlertsPanel() {
        if (hasSocialAlertsModule()) {
            return window.renderAlertsPanel();
        }
        ensureSocialAlertsModule().then(() => queueDeferredModuleRender('alerts-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-bell"></i>
                    <strong>Loading Alerts</strong>
                    <span>Preparing notifications, reminders, and moderation queues.</span>
                </div>
            </section>
        `;
    }

    function portfolioStatus(value, raw = {}) {
        const normalized = text(value).toLowerCase();
        if (normalized === 'published' || normalized === 'draft') return normalized;
        if (raw?.showcasePageId || raw?.showcaseEnabled) return 'published';
        return 'draft';
    }

    function portfolioVisibilityMode(raw = {}) {
        const normalized = text(raw?.visibilityMode || '').toLowerCase();
        if (['all_logged_in', 'students_only', 'tas_only', 'professors_only', 'staff_only', 'custom'].includes(normalized)) {
            return normalized;
        }
        const legacy = text(raw?.visibility || '').toLowerCase();
        if (legacy === 'public') return 'all_logged_in';
        return 'custom';
    }

    function parsePortfolioTextList(value) {
        return uniqueStrings(
            String(value || '')
                .split(/[\n,]/)
                .map((item) => text(item))
                .filter(Boolean)
        );
    }

    function parsePortfolioLinksInput(value) {
        return String(value || '')
            .split('\n')
            .map((line) => text(line))
            .filter(Boolean)
            .map((line) => {
                const parts = line.split('|').map((item) => text(item));
                if (parts.length > 1) {
                    return { label: parts[0] || parts[1], url: parts.slice(1).join(' | ') };
                }
                return { label: line, url: line };
            })
            .filter((item) => text(item.url));
    }

    function serializePortfolioLinks(items = []) {
        return (Array.isArray(items) ? items : [])
            .map((item) => {
                const label = text(item?.label || '');
                const url = text(item?.url || item?.href || '');
                if (!url) return '';
                return label && label !== url ? `${label} | ${url}` : url;
            })
            .filter(Boolean)
            .join('\n');
    }

    function portfolioAudienceLabel(mode) {
        const labels = {
            all_logged_in: 'All logged-in users',
            students_only: 'Students only',
            tas_only: 'TAs only',
            professors_only: 'Professors only',
            staff_only: 'Staff only',
            custom: 'Custom audience'
        };
        return labels[text(mode).toLowerCase()] || 'Custom audience';
    }

    function normalizePortfolioEntry(raw = {}) {
        const ownerUserId = text(raw?.ownerUserId || raw?.authorUserId || '');
        const owner = accountById(ownerUserId) || { id: ownerUserId };
        const facultyCodes = uniqueStrings([
            ...(Array.isArray(raw?.facultyCodes) ? raw.facultyCodes : []),
            ...(Array.isArray(raw?.facultyTags) ? raw.facultyTags : []),
            text(raw?.ownerFacultyCode || owner?.facultyCode || owner?.faculty || '')
        ].filter(Boolean));
        const visibleFacultyCodes = uniqueStrings([
            ...(Array.isArray(raw?.visibleFacultyCodes) ? raw.visibleFacultyCodes : []),
            ...(text(raw?.visibility || '').toLowerCase() === 'faculty' ? facultyCodes : [])
        ].filter(Boolean));
        const mediaItems = (Array.isArray(raw?.mediaItems) ? raw.mediaItems : [])
            .map((item) => item && typeof item === 'object' ? item : null)
            .filter(Boolean);
        const entry = {
            ...raw,
            id: text(raw?.id || ''),
            title: text(raw?.title || raw?.name || 'Portfolio showcase'),
            summary: text(raw?.summary || raw?.description || ''),
            description: text(raw?.description || raw?.summary || ''),
            ownerUserId,
            owner,
            ownerRole: text(owner?.role || raw?.ownerRole || 'student').toLowerCase(),
            ownerFacultyCode: text(raw?.ownerFacultyCode || owner?.facultyCode || owner?.faculty || facultyCodes[0] || ''),
            facultyCodes,
            facultyTags: facultyCodes,
            hashtags: uniqueStrings([...(Array.isArray(raw?.hashtags) ? raw.hashtags : []), ...(Array.isArray(raw?.tags) ? raw.tags : [])]),
            skillTags: uniqueStrings([...(Array.isArray(raw?.skillTags) ? raw.skillTags : []), ...(Array.isArray(raw?.skills) ? raw.skills : [])]),
            mediaItems,
            externalLinks: (Array.isArray(raw?.externalLinks) ? raw.externalLinks : [])
                .map((item) => item && typeof item === 'object' ? { label: text(item.label || item.url), url: text(item.url || '') } : null)
                .filter((item) => text(item?.url)),
            status: portfolioStatus(raw?.status, raw),
            visibilityMode: portfolioVisibilityMode(raw),
            visibleRoles: uniqueStrings(Array.isArray(raw?.visibleRoles) ? raw.visibleRoles.map((item) => text(item).toLowerCase()) : []),
            visibleFacultyCodes,
            visibleUserIds: uniqueStrings(Array.isArray(raw?.visibleUserIds) ? raw.visibleUserIds : []),
            hiddenUserIds: uniqueStrings(Array.isArray(raw?.hiddenUserIds) ? raw.hiddenUserIds : []),
            createdAt: text(raw?.createdAt || ''),
            updatedAt: text(raw?.updatedAt || raw?.createdAt || ''),
            canEdit: text(ownerUserId) === currentUserId() || ['admin', 'student_service'].includes(text(currentUser()?.role || '').toLowerCase())
        };
        return entry;
    }

    function canViewerAccessPortfolioEntry(entry, viewer = currentUser()) {
        const viewerId = text(viewer?.id || '');
        if (!viewerId || !entry) return false;
        if (entry.canEdit) return true;
        if (entry.hiddenUserIds.includes(viewerId)) return false;
        if (entry.status !== 'published') return false;
        const viewerRole = text(viewer?.role || '').toLowerCase();
        const viewerFaculty = text(viewer?.facultyCode || viewer?.faculty || currentFacultyCode() || '');
        if (entry.visibilityMode === 'all_logged_in') return true;
        if (entry.visibilityMode === 'students_only') return viewerRole === 'student';
        if (entry.visibilityMode === 'tas_only') return viewerRole === 'ta';
        if (entry.visibilityMode === 'professors_only') return viewerRole === 'professor';
        if (entry.visibilityMode === 'staff_only') return ['professor', 'ta', 'admin', 'student_service'].includes(viewerRole);
        if (entry.visibleUserIds.includes(viewerId)) return true;
        if (entry.visibleRoles.includes(viewerRole)) return true;
        if (viewerFaculty && entry.visibleFacultyCodes.includes(viewerFaculty)) return true;
        return false;
    }

    function portfolioEntriesForViewer() {
        return (Array.isArray(state().social?.projects) ? state().social.projects : [])
            .map((entry) => normalizePortfolioEntry(entry))
            .filter((entry) => canViewerAccessPortfolioEntry(entry));
    }

    function portfolioMatchesRoleFilter(entry, roleFilter) {
        const filter = text(roleFilter || 'all');
        if (!filter || filter === 'all') return true;
        return text(entry.visibilityMode) === filter;
    }

    function portfolioDraftExists() {
        const runtime = state();
        return Boolean(
            text(runtime.ui?.projectName || '')
            || text(runtime.ui?.projectSummary || '')
            || text(runtime.ui?.projectDescription || '')
            || text(runtime.ui?.projectCourseTag || '')
            || text(runtime.ui?.projectSkillTags || '')
            || text(runtime.ui?.projectHashtags || '')
            || text(runtime.ui?.projectExternalLinks || '')
            || text(runtime.ui?.projectVisibleUserIds || '')
            || text(runtime.ui?.projectHiddenUserIds || '')
            || (Array.isArray(runtime.ui?.projectVisibleRoles) && runtime.ui.projectVisibleRoles.length)
            || (Array.isArray(runtime.ui?.projectVisibleFacultyCodes) && runtime.ui.projectVisibleFacultyCodes.length)
            || (Array.isArray(runtime.ui?.projectMediaItems) && runtime.ui.projectMediaItems.length)
            || runtime.ui?.projectMediaFile
        );
    }

    function setPortfolioComposerOpen(nextOpen) {
        state().ui.projectComposerOpen = Boolean(nextOpen);
    }

    function openPortfolioEditor(entry = null) {
        const runtime = state();
        const normalized = entry ? normalizePortfolioEntry(entry) : null;
        runtime.ui.projectComposerOpen = true;
        runtime.ui.projectEditId = text(normalized?.id || '');
        runtime.ui.projectName = text(normalized?.title || '');
        runtime.ui.projectSummary = text(normalized?.summary || '');
        runtime.ui.projectDescription = text(normalized?.description || '');
        runtime.ui.projectStatus = text(normalized?.status || 'draft') || 'draft';
        runtime.ui.projectVisibility = text(normalized?.visibilityMode || 'all_logged_in') || 'all_logged_in';
        runtime.ui.projectCourseTag = text(normalized?.courseTag || '');
        runtime.ui.projectFacultyCodes = Array.isArray(normalized?.facultyCodes) && normalized.facultyCodes.length ? [...normalized.facultyCodes] : [currentFacultyCode()];
        runtime.ui.projectSkillTags = (normalized?.skillTags || []).join(', ');
        runtime.ui.projectHashtags = (normalized?.hashtags || []).join(', ');
        runtime.ui.projectExternalLinks = serializePortfolioLinks(normalized?.externalLinks || []);
        runtime.ui.projectVisibleRoles = Array.isArray(normalized?.visibleRoles) ? [...normalized.visibleRoles] : [];
        runtime.ui.projectVisibleFacultyCodes = Array.isArray(normalized?.visibleFacultyCodes) ? [...normalized.visibleFacultyCodes] : [];
        runtime.ui.projectVisibleUserIds = (normalized?.visibleUserIds || []).join(', ');
        runtime.ui.projectHiddenUserIds = (normalized?.hiddenUserIds || []).join(', ');
        runtime.ui.projectMediaItems = Array.isArray(normalized?.mediaItems) ? [...normalized.mediaItems] : [];
        runtime.ui.projectMediaFile = null;
    }

    function resetPortfolioEditor() {
        const runtime = state();
        runtime.ui.projectComposerOpen = false;
        runtime.ui.projectEditId = '';
        runtime.ui.projectName = '';
        runtime.ui.projectSummary = '';
        runtime.ui.projectDescription = '';
        runtime.ui.projectStatus = 'draft';
        runtime.ui.projectVisibility = 'all_logged_in';
        runtime.ui.projectCourseTag = '';
        runtime.ui.projectFacultyCodes = [currentFacultyCode()];
        runtime.ui.projectSkillTags = '';
        runtime.ui.projectHashtags = '';
        runtime.ui.projectExternalLinks = '';
        runtime.ui.projectVisibleRoles = [];
        runtime.ui.projectVisibleFacultyCodes = [];
        runtime.ui.projectVisibleUserIds = '';
        runtime.ui.projectHiddenUserIds = '';
        runtime.ui.projectMediaItems = [];
        runtime.ui.projectMediaFile = null;
    }

    function renderPortfolioProfileBlock(userId, { isOwn = false } = {}) {
        const items = portfolioEntriesForViewer()
            .filter((entry) => text(entry.ownerUserId) === text(userId))
            .slice(0, 3);
        if (!items.length && !isOwn) return '';
        return `
            <section class="social-neo-card social-portfolio-profile-block">
                <div class="social-neo-section-head">
                    <div><strong>${isOwn ? 'Your portfolio' : 'Portfolio highlights'}</strong><span>${isOwn ? 'Showcase projects, research, design, and startup work inside campus social.' : 'Visible showcase entries from this profile.'}</span></div>
                    <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                        <span class="social-neo-pill"><strong>${escape(items.length)}</strong><span>Visible</span></span>
                        ${isOwn ? `<button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="profile-portfolio-open"><i class="fas fa-briefcase"></i> Open Portfolio</button>` : ''}
                    </div>
                </div>
                ${items.length ? `
                    <div class="social-portfolio-mini-grid">
                        ${items.map((entry) => `
                            <article class="social-portfolio-mini-card">
                                <div class="social-neo-badge-row">
                                    <span class="social-neo-pill">${escape(portfolioAudienceLabel(entry.visibilityMode))}</span>
                                    <span class="social-neo-pill">${escape(entry.status)}</span>
                                </div>
                                <strong>${escape(entry.title)}</strong>
                                <p>${escape(entry.summary || entry.description || 'Portfolio entry')}</p>
                                <div class="social-neo-inline social-neo-inline-between-gap-8-wrap">
                                    <div class="social-neo-badge-row">${entry.hashtags.slice(0, 2).map((tag) => `<span class="social-neo-pill">#${escape(tag.replace(/^#/, ''))}</span>`).join('')}</div>
                                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-open" data-project-id="${escape(entry.id)}">Open</button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                ` : `<div class="social-neo-empty">Build your first portfolio card to share work, ideas, and startup-ready projects with the university community.</div>`}
            </section>
        `;
    }

    function renderProjectsPanel() {
        const runtime = state();
        const viewer = currentUser();
        const canCreate = text(viewer?.role || '').toLowerCase() === 'student';
        const allEntries = portfolioEntriesForViewer();
        const discoverFaculty = text(runtime.ui?.projectDiscoverFaculty || currentFacultyCode()) || currentFacultyCode();
        const discoverRole = text(runtime.ui?.projectDiscoverRole || 'all') || 'all';
        const discoverSearch = text(runtime.ui?.projectDiscoverSearch || '').toLowerCase();
        const discoverTag = text(runtime.ui?.projectDiscoverTag || '').toLowerCase();
        const openId = text(runtime.ui?.activeProjectId || '');
        const currentFaculty = currentFacultyCode();
        const facultyOptions = uniqueStrings(['all', currentFaculty, ...allEntries.flatMap((entry) => entry.facultyCodes || [])]).filter(Boolean);
        const tagOptions = uniqueStrings(allEntries.flatMap((entry) => entry.hashtags || [])).slice(0, 12);
        const filteredEntries = allEntries.filter((entry) => {
            if (discoverFaculty !== 'all' && !(entry.facultyCodes || []).includes(discoverFaculty)) return false;
            if (!portfolioMatchesRoleFilter(entry, discoverRole)) return false;
            if (discoverTag && !(entry.hashtags || []).some((tag) => text(tag).toLowerCase() === discoverTag.replace(/^#/, ''))) return false;
            if (discoverSearch) {
                const blob = `${entry.title} ${entry.summary} ${entry.description} ${(entry.hashtags || []).join(' ')} ${(entry.skillTags || []).join(' ')} ${displayName(entry.owner)} ${facultyLabel(entry.ownerFacultyCode)}`.toLowerCase();
                if (!blob.includes(discoverSearch)) return false;
            }
            return true;
        });
        const myEntries = allEntries.filter((entry) => text(entry.ownerUserId) === currentUserId());
        const highlightedOpenId = openId && filteredEntries.some((entry) => entry.id === openId) ? openId : '';
        const draftFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
            ? runtime.ui.projectFacultyCodes
            : [currentFaculty];
        const mediaItems = Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [];
        const editing = text(runtime.ui?.projectEditId || '');
        const composerOpen = Boolean(runtime.ui?.projectComposerOpen);
        const hasDraft = Boolean(editing || portfolioDraftExists());
        const customAudienceOpen = text(runtime.ui?.projectVisibility || 'all_logged_in') === 'custom';
        const roleTargets = [
            ['all', 'All audiences'],
            ['all_logged_in', 'All logged-in'],
            ['students_only', 'Students'],
            ['tas_only', 'TAs'],
            ['professors_only', 'Professors'],
            ['staff_only', 'Staff'],
            ['custom', 'Custom']
        ];
        return `
            <div class="social-neo-stack social-portfolio-shell">
                <section class="social-neo-card social-portfolio-hero lux-hero-stage">
                    <div class="social-portfolio-hero-main lux-hero-main">
                        <div class="social-portfolio-hero-copy">
                            <span class="social-neo-eyebrow">Student Portfolio</span>
                            <h2>Present your best work like it belongs in a premium campus showcase</h2>
                            <p>Research, startup concepts, code, design systems, capstones, and independent work all live here in a cleaner, more polished discovery feed.</p>
                        </div>
                        ${canCreate ? `
                            <div class="social-portfolio-hero-actions">
                                <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-compose-open">
                                    <i class="fas fa-plus"></i> ${editing ? 'Continue editing' : hasDraft ? 'Continue draft' : 'Create portfolio entry'}
                                </button>
                                ${hasDraft && !editing ? `<span class="social-neo-pill social-portfolio-draft-pill"><strong>Draft saved</strong><span>Ready to reopen</span></span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="social-portfolio-hero-side lux-hero-side">
                        <div class="social-portfolio-stat-grid">
                            <article class="social-portfolio-stat-tile lux-strip-card surface-card">
                                <strong>${escape(allEntries.filter((entry) => entry.status === 'published').length)}</strong>
                                <span>Published showcases</span>
                            </article>
                            <article class="social-portfolio-stat-tile lux-strip-card surface-card">
                                <strong>${escape(myEntries.length)}</strong>
                                <span>Your entries</span>
                            </article>
                            <article class="social-portfolio-stat-tile lux-strip-card surface-card">
                                <strong>${escape(tagOptions.length)}</strong>
                                <span>Discovery tags</span>
                            </article>
                        </div>
                    </div>
                </section>

                <section class="social-neo-card social-portfolio-toolbar">
                    <div class="social-portfolio-toolbar-head">
                        <div>
                            <strong>Discover talent across campus</strong>
                            <span>Filter by faculty, audience, and tags without losing the social feel of the feed.</span>
                        </div>
                    </div>
                    <div class="social-portfolio-search-row">
                        <label class="social-portfolio-search">
                            <i class="fas fa-search"></i>
                            <input class="social-neo-input" type="search" name="projectDiscoverSearch" value="${escape(text(runtime.ui?.projectDiscoverSearch || ''))}" placeholder="Search projects, skills, hashtags, people, or faculties">
                        </label>
                        <select class="social-neo-select" name="projectDiscoverFaculty">
                            ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${discoverFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode === 'all' ? 'All faculties' : facultyLabel(facultyCode))}</option>`).join('')}
                        </select>
                        <select class="social-neo-select" name="projectDiscoverRole">
                            ${roleTargets.map(([value, label]) => `<option value="${escape(value)}" ${discoverRole === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="social-portfolio-tag-row">
                        <button class="social-neo-btn ${!discoverTag ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="">All tags</button>
                        ${tagOptions.map((tag) => `
                            <button class="social-neo-btn ${discoverTag === text(tag).toLowerCase() ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">
                                #${escape(text(tag).replace(/^#/, ''))}
                            </button>
                        `).join('')}
                    </div>
                </section>

                ${canCreate ? `
                    <section class="social-neo-card social-portfolio-compose-shell ${composerOpen ? 'is-open' : 'is-collapsed'}">
                        <div class="social-portfolio-compose-head">
                            <div class="social-portfolio-compose-copy">
                                <span class="social-portfolio-compose-kicker">${editing ? 'Editing showcase' : 'Create portfolio entry'}</span>
                                <strong>${editing ? 'Refine this entry without leaving the feed' : 'Keep the composer out of the way until you need it'}</strong>
                                <span>${editing ? 'Adjust the story, visuals, and audience from one premium editor.' : 'Open a polished inline editor only when you want to publish something worth showing.'}</span>
                            </div>
                            <div class="social-portfolio-compose-actions">
                                ${composerOpen ? `
                                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="portfolio-compose-close">
                                        <i class="fas fa-chevron-up"></i> Hide
                                    </button>
                                ` : `
                                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-compose-open">
                                        <i class="fas fa-sparkles"></i> ${editing ? 'Continue editing' : hasDraft ? 'Continue draft' : 'Open composer'}
                                    </button>
                                `}
                            </div>
                        </div>
                        ${!composerOpen ? `
                            <div class="social-portfolio-compose-preview">
                                <div class="social-portfolio-compose-preview-grid">
                                    <article class="social-portfolio-compose-preview-card">
                                        <strong>Feed-first</strong>
                                        <span>Your portfolio stays clean and beautiful until you decide to publish.</span>
                                    </article>
                                    <article class="social-portfolio-compose-preview-card">
                                        <strong>${hasDraft ? 'Draft remembered' : 'Audience ready'}</strong>
                                        <span>${hasDraft ? 'You can reopen your unfinished entry instantly.' : 'Choose who sees the work without exposing everything to everyone.'}</span>
                                    </article>
                                    <article class="social-portfolio-compose-preview-card">
                                        <strong>${myEntries.length || 0} entries</strong>
                                        <span>${myEntries.length ? 'Keep building a stronger student-facing portfolio over time.' : 'Start with one strong entry and grow the showcase later.'}</span>
                                    </article>
                                </div>
                            </div>
                        ` : `
                            <form data-form="${editing ? 'project-settings' : 'create-project'}" ${editing ? `data-project-id="${escape(editing)}"` : ''} class="social-neo-stack social-portfolio-composer">
                                <div class="social-portfolio-composer-grid">
                                    <label><span class="social-neo-label">Title</span><input class="social-neo-input" type="text" name="projectName" value="${escape(text(runtime.ui?.projectName || ''))}" placeholder="Sustainable marketplace app"></label>
                                    <label><span class="social-neo-label">Short summary</span><input class="social-neo-input" type="text" name="projectSummary" value="${escape(text(runtime.ui?.projectSummary || ''))}" placeholder="Two-line hook that makes people stop scrolling"></label>
                                </div>
                                <label><span class="social-neo-label">Description</span><textarea class="social-neo-textarea" name="projectDescription" rows="4" placeholder="Explain what you built, why it matters, what stage it is in, and what kind of collaboration or opportunity you want.">${escape(text(runtime.ui?.projectDescription || ''))}</textarea></label>
                                <div class="social-portfolio-composer-grid social-portfolio-composer-grid--triplet">
                                    <label><span class="social-neo-label">Hashtags</span><input class="social-neo-input" type="text" name="projectHashtags" value="${escape(text(runtime.ui?.projectHashtags || ''))}" placeholder="ai, startup, uiux"></label>
                                    <label><span class="social-neo-label">Skill tags</span><input class="social-neo-input" type="text" name="projectSkillTags" value="${escape(text(runtime.ui?.projectSkillTags || ''))}" placeholder="react, branding, research"></label>
                                    <label><span class="social-neo-label">Context</span><input class="social-neo-input" type="text" name="projectCourseTag" value="${escape(text(runtime.ui?.projectCourseTag || ''))}" placeholder="Capstone, thesis, startup, freelance"></label>
                                </div>
                                <label><span class="social-neo-label">External links</span><textarea class="social-neo-textarea" name="projectExternalLinks" rows="3" placeholder="Prototype | https://...&#10;GitHub | https://...">${escape(text(runtime.ui?.projectExternalLinks || ''))}</textarea></label>
                                <div class="social-portfolio-composer-grid social-portfolio-composer-grid--triplet">
                                    <label><span class="social-neo-label">Status</span><select class="social-neo-select" name="projectStatus">${['draft', 'published'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'draft') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}</select></label>
                                    <label><span class="social-neo-label">Audience</span><select class="social-neo-select" name="projectVisibility">${roleTargets.filter(([value]) => value !== 'all').map(([value, label]) => `<option value="${escape(value)}" ${text(runtime.ui?.projectVisibility || 'all_logged_in') === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}</select></label>
                                    <label><span class="social-neo-label">Media upload</span><input class="social-neo-input" type="file" name="projectMediaFile" accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.zip,.fig,.sketch"></label>
                                </div>
                                <div class="social-portfolio-chip-section">
                                    <span class="social-neo-label">Faculty tags</span>
                                    <div class="social-neo-badge-row social-portfolio-chip-row">
                                        ${uniqueStrings([currentFaculty, 'BUS', 'CS', 'LAW', 'MED', 'ARTS', ...facultyOptions.filter((code) => code !== 'all')]).map((facultyCode) => `
                                            <button class="social-neo-btn ${draftFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>
                                        `).join('')}
                                    </div>
                                </div>
                                ${customAudienceOpen ? `
                                    <div class="social-portfolio-audience-panel">
                                        <div class="social-portfolio-audience-grid">
                                            <label><span class="social-neo-label">Custom roles</span><input class="social-neo-input" type="text" name="projectVisibleRolesRaw" value="${escape((runtime.ui?.projectVisibleRoles || []).join(', '))}" placeholder="student, professor, ta"></label>
                                            <label><span class="social-neo-label">Custom faculties</span><input class="social-neo-input" type="text" name="projectVisibleFacultyCodesRaw" value="${escape((runtime.ui?.projectVisibleFacultyCodes || []).join(', '))}" placeholder="BUS, CS, LAW"></label>
                                            <label><span class="social-neo-label">Allowed user IDs</span><input class="social-neo-input" type="text" name="projectVisibleUserIds" value="${escape(text(runtime.ui?.projectVisibleUserIds || ''))}" placeholder="student-001, professor-014"></label>
                                            <label><span class="social-neo-label">Hidden user IDs</span><input class="social-neo-input" type="text" name="projectHiddenUserIds" value="${escape(text(runtime.ui?.projectHiddenUserIds || ''))}" placeholder="Optional direct exclusions"></label>
                                        </div>
                                    </div>
                                ` : ''}
                                ${mediaItems.length ? `
                                    <div class="social-portfolio-media-strip">
                                        ${mediaItems.map((item) => {
                                            const url = fileUrl(item);
                                            if (url && isImage(item)) {
                                                return `<img src="${escape(url)}" alt="${escape(text(item.name || 'Portfolio media'))}">`;
                                            }
                                            return `<span class="social-neo-pill">${escape(text(item.name || 'Uploaded media'))}</span>`;
                                        }).join('')}
                                    </div>
                                ` : ''}
                                <div class="social-portfolio-form-footer">
                                    <div class="social-portfolio-form-state">
                                        ${editing ? `<span class="social-neo-pill"><strong>Edit mode</strong><span>This entry will update in place</span></span>` : hasDraft ? `<span class="social-neo-pill"><strong>Draft active</strong><span>You can hide and reopen anytime</span></span>` : `<span class="social-neo-pill"><strong>Ready</strong><span>Publish when the card feels finished</span></span>`}
                                    </div>
                                    <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="${editing ? 'portfolio-edit-cancel' : 'portfolio-compose-reset'}">${editing ? 'Discard edit' : 'Reset draft'}</button>
                                        <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-briefcase"></i> ${editing ? 'Save portfolio entry' : 'Publish portfolio card'}</button>
                                    </div>
                                </div>
                            </form>
                        `}
                    </section>
                ` : ''}

                <section class="social-portfolio-feed social-project-scroll-list social-project-scroll-list--portfolio">
                    ${filteredEntries.length ? filteredEntries.map((entry, index) => {
                        const owner = entry.owner;
                        const isOpen = highlightedOpenId === entry.id;
                        const mediaPreview = entry.mediaItems[0] || null;
                        const mediaUrl = mediaPreview ? fileUrl(mediaPreview) : '';
                        const featured = index === 0 || (index > 0 && index % 5 === 0);
                        return `
                            <article class="social-neo-post-card social-portfolio-card ${isOpen ? 'is-open' : ''} ${featured ? 'is-featured' : ''}">
                                <div class="social-portfolio-card-head">
                                    <div class="social-neo-person">
                                        ${avatar(owner, 'social-neo-avatar-sm')}
                                        <div>
                                            <strong>${escape(displayName(owner))}</strong>
                                            <div class="social-neo-muted">${escape(roleLabel(owner?.role))} / ${escape(facultyLabel(entry.ownerFacultyCode || currentFaculty))}</div>
                                        </div>
                                    </div>
                                    <div class="social-neo-badge-row">
                                        ${featured ? `<span class="social-neo-pill social-portfolio-featured-pill"><strong>Featured</strong><span>Showcase pick</span></span>` : ''}
                                        <span class="social-neo-pill">${escape(portfolioAudienceLabel(entry.visibilityMode))}</span>
                                        <span class="social-neo-pill">${escape(entry.status === 'published' ? 'Published' : 'Draft')}</span>
                                        <span class="social-neo-pill">${escape(when(entry.updatedAt || entry.createdAt))}</span>
                                    </div>
                                </div>
                                ${mediaUrl && isImage(mediaPreview) ? `<div class="social-portfolio-cover"><img src="${escape(mediaUrl)}" alt="${escape(entry.title)}"></div>` : ''}
                                <div class="social-portfolio-body">
                                    <h3>${escape(entry.title)}</h3>
                                    <p>${escape(isOpen ? (entry.description || entry.summary || 'Portfolio showcase') : (entry.summary || entry.description || 'Portfolio showcase'))}</p>
                                    <div class="social-neo-badge-row">
                                        ${(entry.facultyCodes || []).slice(0, 3).map((facultyCode) => `<span class="social-neo-pill">${escape(facultyLabel(facultyCode))}</span>`).join('')}
                                        ${(entry.skillTags || []).slice(0, 4).map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('')}
                                        ${(entry.hashtags || []).slice(0, 4).map((tag) => `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">#${escape(text(tag).replace(/^#/, ''))}</button>`).join('')}
                                    </div>
                                </div>
                                ${isOpen ? `
                                    <div class="social-portfolio-expanded">
                                        ${(() => {
                                            const safePortfolioLinks = entry.externalLinks.filter((link) => getSafeSocialExternalUrl(link?.url));
                                            return safePortfolioLinks.length ? `
                                            <div class="social-portfolio-links">
                                                ${safePortfolioLinks.map((link) => {
                                                    const safeLinkUrl = getSafeSocialExternalUrl(link?.url);
                                                    return `<a class="social-portfolio-link" href="${escape(safeLinkUrl)}" target="_blank" rel="noopener noreferrer">${escape(link.label || safeLinkUrl)} <i class="fas fa-arrow-up-right-from-square"></i></a>`;
                                                }).join('')}
                                            </div>
                                        ` : '';
                                        })()}
                                        ${entry.mediaItems.length > 1 ? `
                                            <div class="social-portfolio-media-strip">
                                                ${entry.mediaItems.slice(0, 6).map((item) => {
                                                    const url = fileUrl(item);
                                                    if (url && isImage(item)) return `<img src="${escape(url)}" alt="${escape(text(item.name || entry.title))}">`;
                                                    return `<span class="social-neo-pill">${escape(text(item.name || 'Attachment'))}</span>`;
                                                }).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                                <div class="social-portfolio-actions">
                                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="${isOpen ? 'projects-back' : 'project-open'}" data-project-id="${escape(entry.id)}">${isOpen ? 'Hide details' : 'Open entry'}</button>
                                    ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-edit" data-project-id="${escape(entry.id)}"><i class="fas fa-pen"></i> Edit</button>` : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                    ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="portfolio-delete" data-project-id="${escape(entry.id)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                                </div>
                            </article>
                        `;
                    }).join('') : `<div class="social-neo-card"><div class="social-neo-empty">No portfolio entries matched the current filters.</div></div>`}
                </section>
            </div>
        `;
    }

    function renderProfilePageBody() {
        if (typeof window.renderSocialProfilePanel === 'function') {
            return window.renderSocialProfilePanel();
        }
        ensureSocialProfileModule().then(() => queueDeferredModuleRender('profile-module')).catch(() => null);
        return `
            <div class="social-neo-card">
                <div class="social-neo-empty">Loading profile...</div>
            </div>
        `;
    }

    function renderShellPrimaryNav(activePanel) {
        const panels = activeNavPanels();

        return `
            <div class="social-neo-shell-primary-nav" role="tablist" aria-label="Social navigation">
                ${panels.map((panel) => `
                    <button class="social-neo-shell-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                        <span class="social-neo-shell-nav-icon" data-panel-tone="${escape(panel.id)}">
                            <i class="fas ${escape(panel.icon)}"></i>
                        </span>
                        <span class="social-neo-shell-nav-copy">
                            <strong class="social-neo-shell-nav-title">${escape(panel.label)}</strong>
                            <small class="social-neo-shell-nav-helper">${escape(panel.helper)}</small>
                        </span>
                        ${panel.count > 0 ? `<em class="social-neo-shell-nav-count social-neo-shell-nav-count-label">${escape(panel.count)}</em>` : ''}
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderMobileTabBar(activePanel) {
        const panels = activeNavPanels();
        return `
            <nav class="social-neo-mobile-tabbar" aria-label="Social mobile navigation">
                ${panels.map((panel) => `
                    <button class="social-neo-mobile-tab ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                        <span class="social-neo-mobile-tab-icon" data-panel-tone="${escape(panel.id)}">
                            <i class="fas ${escape(panel.icon)}"></i>
                            ${panel.count > 0 ? `<em class="social-neo-mobile-tab-count">${escape(panel.count > 99 ? '99+' : panel.count)}</em>` : ''}
                        </span>
                        <span class="social-neo-mobile-tab-label">${escape(panel.label)}</span>
                    </button>
                `).join('')}
            </nav>
        `;
    }

    function renderShellDrawer(activePanel) {
        const runtime = state();
        const panels = activeNavPanels();
        const user = currentUser() || {};
        const open = Boolean(runtime.ui?.shellDrawerOpen);
        if (!open) return '';
        return `
            <div class="social-neo-shell-drawer-backdrop" data-action="shell-drawer-close"></div>
            <aside class="social-neo-shell-drawer" aria-label="Social navigation drawer">
                <section class="social-neo-card social-neo-shell-drawer-profile social-neo-shell-drawer-profile-card">
                    <div class="social-neo-shell-drawer-head">
                        <button class="social-neo-person social-neo-clickable social-neo-person-start-gap-12 social-neo-shell-drawer-profile-chip" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}">
                            ${avatar(user)}
                            <div class="social-neo-shell-drawer-profile-copy">
                                <strong class="social-neo-shell-drawer-profile-name">${escape(displayName(user))}</strong>
                                <span class="social-neo-shell-drawer-profile-subtitle">${escape(accountSubtitle(user))}</span>
                            </div>
                        </button>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="shell-drawer-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-inline social-neo-inline-gap-4 social-neo-shell-drawer-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-drawer-action-btn" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}"><i class="fas fa-user"></i> Profile</button>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-drawer-action-btn" type="button" data-action="panel-messages"><i class="fas fa-paper-plane"></i> Messages</button>
                    </div>
                </section>
                <section class="social-neo-card social-neo-shell-drawer-nav-card">
                    <div class="social-neo-sidebar-nav social-neo-shell-drawer-nav">
                        ${panels.map((panel) => `
                            <button class="social-neo-side-link social-neo-shell-drawer-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                                <span class="social-neo-side-main social-neo-shell-drawer-nav-main">
                                    <span class="social-neo-side-icon social-neo-shell-drawer-nav-icon" data-panel-tone="${escape(panel.id)}"><i class="fas ${escape(panel.icon)}"></i></span>
                                    <span class="social-neo-side-copy social-neo-shell-drawer-nav-copy">
                                        <strong class="social-neo-shell-drawer-nav-title">${escape(panel.label)}</strong>
                                        <small class="social-neo-shell-drawer-nav-helper">${escape(panel.helper)}</small>
                                    </span>
                                </span>
                                ${panel.count > 0 ? `<em class="social-neo-side-count social-neo-shell-drawer-nav-count">${escape(panel.count)}</em>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </section>
            </aside>
        `;
    }

    function renderShellWorkspaceNav(activePanel) {
        const panels = activeNavPanels();
        return `
            <aside class="social-neo-workspace-nav">
                <section class="social-neo-card social-neo-workspace-nav-card">
                    <div class="social-neo-section-head social-neo-rail-head">
                        <div class="social-neo-rail-head-copy">
                            <strong class="social-neo-rail-title">Social Workspace</strong>
                            <span class="social-neo-rail-copy">Navigate the network by product area.</span>
                        </div>
                    </div>
                    <div class="social-neo-sidebar-nav social-neo-workspace-nav-list">
                        ${panels.map((panel) => `
                            <button class="social-neo-side-link social-neo-workspace-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                                <span class="social-neo-side-main">
                                    <span class="social-neo-side-icon" data-panel-tone="${escape(panel.id)}"><i class="fas ${escape(panel.icon)}"></i></span>
                                    <span class="social-neo-side-copy">
                                        <strong>${escape(panel.label)}</strong>
                                        <small>${escape(panel.helper)}</small>
                                    </span>
                                </span>
                                ${panel.count > 0 ? `<em class="social-neo-side-count">${escape(panel.count > 99 ? '99+' : panel.count)}</em>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </section>
                <section class="social-neo-card social-neo-workspace-nav-card social-neo-workspace-nav-card--actions">
                    <div class="social-neo-section-head social-neo-rail-head">
                        <div class="social-neo-rail-head-copy">
                            <strong class="social-neo-rail-title">Quick Create</strong>
                            <span class="social-neo-rail-copy">Jump straight into publishing flows.</span>
                        </div>
                    </div>
                    <div class="social-neo-workspace-nav-actions">
                        <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="composer-focus"><i class="fas fa-pen-to-square"></i> Publish Post</button>
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="story-add"><i class="fas fa-circle-plus"></i> Add Story</button>
                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="events-compose-toggle"><i class="fas fa-calendar-plus"></i> Create Event</button>
                    </div>
                </section>
            </aside>
        `;
    }

    function renderSectionCommandCenter(activePanel, activeConfig, runtime) {
        const social = runtime.social || {};
        const relationships = relationshipBuckets();
        const feedCount = Array.isArray(runtime.feed) ? runtime.feed.length : 0;
        const groups = Array.isArray(social.groups) ? social.groups : [];
        const pages = Array.isArray(social.pages) ? social.pages : [];
        const events = Array.isArray(social.events) ? social.events : [];
        const projects = Array.isArray(social.projects) ? social.projects : [];
        const chats = activeChats();
        const alerts = notificationItems();
        const lostItems = lostFoundItems().map((item) => normalizeLostFoundItem(item));
        const sectionMeta = {
            feed: {
                tone: 'blue',
                label: 'Live social stream',
                title: 'Publish, discover, and follow campus activity.',
                summary: `${feedCount} posts / ${groups.filter(isJoinedGroup).length} joined groups / ${pages.filter((page) => page?.isFollowing || isManagedPage(page)).length} followed pages`,
                actions: [
                    { label: 'Refresh feed', icon: 'fa-arrows-rotate', action: 'feed-refresh', tone: 'primary' },
                    { label: 'Add story', icon: 'fa-circle-plus', action: 'story-add' },
                    { label: 'Find groups', icon: 'fa-users', action: 'panel-groups', attrs: 'data-groups-tab="discover"' }
                ],
                tasks: [
                    { icon: 'fa-pen-to-square', title: 'Share an update', text: 'Use the composer below with a clear audience before posting.' },
                    { icon: 'fa-bullhorn', title: 'Follow official updates', text: 'Page and faculty posts stay visible in the feed filters.' },
                    { icon: 'fa-bookmark', title: 'Save useful posts', text: 'Keep important campus posts available from your profile.' }
                ]
            },
            community: {
                tone: 'purple',
                label: 'People discovery',
                title: 'Find classmates, staff, and useful campus contacts.',
                summary: `${Array.isArray(runtime.directory) ? runtime.directory.length : 0} people / ${relationships.connections.length} connections / ${relationships.incoming.length} requests`,
                actions: [
                    { label: 'People', icon: 'fa-user-group', action: 'panel-community', attrs: 'data-community-tab="people"', tone: 'primary' },
                    { label: 'Requests', icon: 'fa-user-check', action: 'panel-community', attrs: 'data-community-tab="requests"' },
                    { label: 'Staff', icon: 'fa-chalkboard-user', action: 'panel-community', attrs: 'data-community-tab="staff"' }
                ],
                tasks: [
                    { icon: 'fa-magnifying-glass', title: 'Search by role', text: 'Use filters to find students, professors, TAs, and staff faster.' },
                    { icon: 'fa-handshake', title: 'Manage requests', text: 'Approve or decline connection requests from one clean area.' },
                    { icon: 'fa-paper-plane', title: 'Start a chat', text: 'Open a direct message from every person card.' }
                ]
            },
            groups: {
                tone: 'green',
                label: 'Study communities',
                title: 'Join, create, and manage study groups without confusion.',
                summary: `${groups.length} groups / ${groups.filter(isJoinedGroup).length} joined / ${groups.reduce((sum, group) => sum + (group.memberCount || 0), 0)} members`,
                actions: [
                    { label: 'Discover', icon: 'fa-compass', action: 'panel-groups', attrs: 'data-groups-tab="discover"', tone: 'primary' },
                    { label: 'Your groups', icon: 'fa-layer-group', action: 'panel-groups', attrs: 'data-groups-tab="joined"' },
                    { label: 'Create group', icon: 'fa-plus', action: 'panel-groups', attrs: 'data-groups-tab="create"' }
                ],
                tasks: [
                    { icon: 'fa-users-rectangle', title: 'Group cards', text: 'Each group shows members, privacy, activity, and join status.' },
                    { icon: 'fa-lock', title: 'Clear access state', text: 'Public join, private request, pending, and owner states are separated.' },
                    { icon: 'fa-comments', title: 'Group chat handoff', text: 'Joined groups connect cleanly into the message workspace.' }
                ]
            },
            workspace: {
                tone: 'orange',
                label: 'Project workspaces',
                title: 'Turn student work into organized team execution.',
                summary: `${projects.length} workspaces / ${projects.filter((project) => text(project?.status || '') === 'active').length} active / ${projects.filter((project) => text(project?.visibility || '') === 'public').length} open`,
                actions: [
                    { label: 'New project', icon: 'fa-diagram-project', action: 'panel-workspace', tone: 'primary' },
                    { label: 'My projects', icon: 'fa-table-columns', action: 'panel-workspace' }
                ],
                tasks: [
                    { icon: 'fa-list-check', title: 'Task clarity', text: 'Tasks, milestones, deliverables, and check-ins have separate visual lanes.' },
                    { icon: 'fa-chart-line', title: 'Progress visibility', text: 'Analytics show workload per member and status distribution at a glance.' },
                    { icon: 'fa-user-plus', title: 'Find teammates', text: 'Open projects accept join requests so nobody has to search on Facebook.' }
                ]
            },
            projects: {
                tone: 'orange',
                label: 'Student portfolio',
                title: 'Present completed work as a polished campus showcase.',
                summary: `${projects.length} entries / ${projects.filter((project) => text(project?.status || '') === 'published').length} published`,
                actions: [
                    { label: 'New portfolio entry', icon: 'fa-diagram-project', action: 'portfolio-compose-open', tone: 'primary' },
                    { label: 'Open profile portfolio', icon: 'fa-id-card', action: 'profile-portfolio-open' }
                ],
                tasks: [
                    { icon: 'fa-award', title: 'Portfolio-ready', text: 'Students can present completed work as evidence, not just activity.' },
                    { icon: 'fa-magnifying-glass', title: 'Discovery feed', text: 'Filter showcases by faculty, audience, and tags.' }
                ]
            },
            pages: {
                tone: 'blue',
                label: 'Official and student pages',
                title: 'Follow offices, clubs, labs, and managed campus pages.',
                summary: `${pages.length} pages / ${pages.filter((page) => page?.isFollowing).length} following / ${pages.filter(isManagedPage).length} managed`,
                actions: [
                    { label: 'Discover pages', icon: 'fa-flag', action: 'panel-pages', attrs: 'data-pages-tab="discover"', tone: 'primary' },
                    { label: 'Following', icon: 'fa-star', action: 'panel-pages', attrs: 'data-pages-tab="following"' },
                    { label: 'Create page', icon: 'fa-plus', action: 'page-wizard-open' }
                ],
                tasks: [
                    { icon: 'fa-circle-check', title: 'Trust markers', text: 'Official and managed pages receive stronger identity treatment.' },
                    { icon: 'fa-newspaper', title: 'Page feeds', text: 'Page posts stay separated from personal posts when needed.' },
                    { icon: 'fa-gear', title: 'Manager tools', text: 'Page owners get visible edit and publishing controls.' }
                ]
            },
            events: {
                tone: 'gold',
                label: 'Campus calendar',
                title: 'See what is happening today, this week, and later.',
                summary: `${events.length} events / ${events.filter((event) => text(event?.scope || event?.type || '') === 'university').length} official / ${events.filter((event) => text(event?.scope || event?.type || '') === 'student').length} student`,
                actions: [
                    { label: 'Create event', icon: 'fa-calendar-plus', action: 'events-compose-toggle', tone: 'primary' },
                    { label: 'Student events', icon: 'fa-users', action: 'events-tab-student' },
                    { label: 'University events', icon: 'fa-landmark', action: 'events-tab-university' }
                ],
                tasks: [
                    { icon: 'fa-calendar-day', title: 'Time grouping', text: 'Events are organized by today, upcoming, and category lanes.' },
                    { icon: 'fa-location-dot', title: 'Useful cards', text: 'Date, host, location, online link, and RSVP stay visible.' },
                    { icon: 'fa-bell', title: 'Reminder-ready', text: 'The interface leaves room for reminder and capacity states.' }
                ]
            },
            'lost-and-found': {
                tone: 'violet',
                label: 'Campus recovery board',
                title: 'Report, match, and return lost items with less friction.',
                summary: `${lostItems.length} listings / ${lostItems.filter((item) => item.kind === 'lost').length} lost / ${lostItems.filter((item) => item.kind === 'found').length} found`,
                actions: [
                    { label: 'Post item', icon: 'fa-plus', action: 'lost-found-compose-open', tone: 'primary' },
                    { label: 'Open items', icon: 'fa-magnifying-glass-location', action: 'panel-lost-and-found', attrs: 'data-lost-found-filter="open"' },
                    { label: 'Found items', icon: 'fa-box-open', action: 'panel-lost-and-found', attrs: 'data-lost-found-filter="found"' }
                ],
                tasks: [
                    { icon: 'fa-camera', title: 'Photo-first listings', text: 'Item cards prioritize image, date, location, and status.' },
                    { icon: 'fa-shield-halved', title: 'Safe handoff', text: 'Contact and return actions are separated from public information.' },
                    { icon: 'fa-filter', title: 'Fast filtering', text: 'Kind, status, location, and category remain easy to scan.' }
                ]
            },
            messages: {
                tone: 'teal',
                label: 'Social inbox',
                title: 'Keep direct and group conversations organized.',
                summary: `${chats.length} chats / ${chats.reduce((sum, chat) => sum + unreadMessages(chat), 0)} unread / ${currentCall() ? 'call live' : 'no active call'}`,
                actions: [
                    { label: 'All chats', icon: 'fa-inbox', action: 'panel-messages', attrs: 'data-messages-filter="all"', tone: 'primary' },
                    { label: 'Unread', icon: 'fa-envelope', action: 'panel-messages', attrs: 'data-messages-filter="unread"' },
                    { label: 'Find people', icon: 'fa-user-plus', action: 'panel-community', attrs: 'data-community-tab="people"' }
                ],
                tasks: [
                    { icon: 'fa-comments', title: 'Thread focus', text: 'Inbox, active conversation, and group details are visually separated.' },
                    { icon: 'fa-paperclip', title: 'Shared assets', text: 'Files, media, links, members, and invites have dedicated panels.' },
                    { icon: 'fa-phone-volume', title: 'Call state', text: 'Active call controls stay near the relevant conversation.' }
                ]
            },
            alerts: {
                tone: 'rose',
                label: 'Notification center',
                title: 'Filter notifications by category — academic, messages, social, university, support.',
                summary: `${alerts.length} alerts / ${unreadNotifications()} unread`,
                actions: [
                    { label: 'All', icon: 'fa-inbox', action: 'panel-alerts', attrs: 'data-alerts-filter="all"', tone: 'primary' },
                    { label: 'Academic', icon: 'fa-graduation-cap', action: 'panel-alerts', attrs: 'data-alerts-filter="academic"' },
                    { label: 'Messages', icon: 'fa-envelope', action: 'panel-alerts', attrs: 'data-alerts-filter="messages"' },
                    { label: 'Social', icon: 'fa-users', action: 'panel-alerts', attrs: 'data-alerts-filter="social"' },
                    { label: 'University', icon: 'fa-bullhorn', action: 'panel-alerts', attrs: 'data-alerts-filter="university"' },
                    { label: 'Support', icon: 'fa-headset', action: 'panel-alerts', attrs: 'data-alerts-filter="support"' }
                ],
                tasks: [
                    { icon: 'fa-layer-group', title: 'Category filters', text: 'Academic, Messages, Social, University, Support — find what matters fast.' },
                    { icon: 'fa-check-double', title: 'Mark category read', text: 'Clear a whole category at once with one click.' },
                    { icon: 'fa-bolt', title: 'Actionable cards', text: 'Each notification shows its category, icon, and direct actions.' }
                ]
            },
            profile: {
                tone: 'indigo',
                label: 'Public identity',
                title: 'Show posts, connections, about information, and portfolio proof.',
                summary: `${profilePostCount(text(runtime.ui?.activeProfileUserId || currentUserId()))} posts / ${profileFriendCount(text(runtime.ui?.activeProfileUserId || currentUserId()))} connections / ${profileFollowingCount(text(runtime.ui?.activeProfileUserId || currentUserId()))} following`,
                actions: [
                    { label: 'Edit profile', icon: 'fa-user-pen', action: 'profile-edit', tone: 'primary' },
                    { label: 'Portfolio', icon: 'fa-briefcase', action: 'profile-portfolio-open' },
                    { label: 'Posts', icon: 'fa-newspaper', action: 'profile-tab-posts' }
                ],
                tasks: [
                    { icon: 'fa-id-badge', title: 'Identity hierarchy', text: 'Name, role, faculty, actions, and social proof stay easy to read.' },
                    { icon: 'fa-user-shield', title: 'Visibility awareness', text: 'The interface makes public profile information more intentional.' },
                    { icon: 'fa-award', title: 'Portfolio highlights', text: 'Projects and evidence become visible from the profile path.' }
                ]
            }
        };
        const meta = sectionMeta[activePanel] || sectionMeta.feed;
        const activeAlertsFilter = activePanel === 'alerts' ? (text(runtime.ui?.alertsFilter || 'all') || 'all') : '';
        const actionMarkup = meta.actions.map((item) => {
            const isActive = activePanel === 'alerts' && item.attrs && item.attrs.includes(`data-alerts-filter="${activeAlertsFilter}"`);
            return `<button class="social-neo-section-action ${item.tone === 'primary' && !isActive ? 'is-primary' : ''} ${isActive ? 'is-active' : ''}" type="button" data-action="${escape(item.action)}" ${item.attrs || ''}>
                <i class="fas ${escape(item.icon)}"></i>
                <span>${escape(item.label)}</span>
            </button>`;
        }).join('');
        const metricMarkup = (activeConfig.pills || []).map((pill) => `
            <article class="social-neo-section-metric">
                <strong>${escape(pill.value)}</strong>
                <span>${escape(pill.label)}</span>
            </article>
        `).join('');
        const taskMarkup = meta.tasks.map((item) => `
            <article class="social-neo-section-task">
                <span class="social-neo-section-task-icon"><i class="fas ${escape(item.icon)}"></i></span>
                <span>
                    <strong>${escape(item.title)}</strong>
                    <small>${escape(item.text)}</small>
                </span>
            </article>
        `).join('');
        return `
            <section class="social-neo-section-command social-neo-section-command--${escape(meta.tone)}" data-section-command="${escape(activePanel)}">
                <div class="social-neo-section-command-main">
                    <span class="social-neo-section-kicker">${escape(meta.label)}</span>
                    <h2>${escape(meta.title)}</h2>
                    <p>${escape(meta.summary)}</p>
                    <div class="social-neo-section-actions">${actionMarkup}</div>
                </div>
                <div class="social-neo-section-command-side">
                    <div class="social-neo-section-metrics">${metricMarkup}</div>
                    <div class="social-neo-section-tasks">${taskMarkup}</div>
                </div>
            </section>
        `;
    }

    function renderRail(activePanel) {
        const runtime = state();
        const social = runtime.social || {};
        const relationships = relationshipBuckets();
        const call = currentCall();
        const user = currentUser();
        const featuredPages = (Array.isArray(social.pages) ? social.pages : []).slice(0, 3);
        const featuredGroups = (Array.isArray(social.groups) ? social.groups : []).slice(0, 3);
        const featuredEvents = (Array.isArray(social.events) ? social.events : []).slice(0, 3);
        const alerts = notificationItems().slice(0, 3);
        const suggestedConnections = (Array.isArray(runtime.directory) ? runtime.directory : []).filter((account) => connectionStatusFor(account?.id).state === 'none').slice(0, 3);
        const railMarkup = activePanel === 'community'
            ? `
                <section class="social-neo-card social-neo-rail-card social-neo-rail-card--pending-requests">
                    <div class="social-neo-section-head social-neo-rail-head">
                        <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Pending Requests</strong></div>
                    </div>
                    <div class="social-neo-list social-neo-rail-list">
                        ${relationships.incoming.slice(0, 3).map((relationship) => {
                            const account = accountById(relationship.fromId) || { id: relationship.fromId };
                            return `<article class="social-neo-entity-card social-neo-rail-item">
                                <div class="social-neo-rail-item-copy">
                                    <strong class="social-neo-rail-item-title">${escape(displayName(account))}</strong>
                                    <span class="social-neo-rail-item-meta">${escape(accountSubtitle(account))}</span>
                                </div>
                                <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="connection-accept" data-relationship-id="${escape(text(relationship.id))}">Approve</button>
                            </article>`;
                        }).join('')}
                        ${!relationships.incoming.length ? `<div class="social-neo-empty social-neo-rail-empty">No requests waiting.</div>` : ''}
                    </div>
                </section>
                <section class="social-neo-card social-neo-rail-card social-neo-rail-card--recommended">
                    <div class="social-neo-section-head social-neo-rail-head">
                        <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Recommended</strong></div>
                    </div>
                    <div class="social-neo-list social-neo-rail-list">
                        ${featuredGroups.map((group) => `
                            <article class="social-neo-entity-card social-neo-rail-item">
                                <div class="social-neo-rail-item-copy">
                                    <strong class="social-neo-rail-item-title">${escape(text(group.name || 'Group'))}</strong>
                                    <span class="social-neo-rail-item-meta">${escape(`${group.memberCount || 0} members`)}</span>
                                </div>
                                <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(group.id))}">Open</button>
                            </article>
                        `).join('')}
                        ${featuredPages.map((page) => `
                            <article class="social-neo-entity-card social-neo-rail-item">
                                <div class="social-neo-rail-item-copy">
                                    <strong class="social-neo-rail-item-title">${escape(text(page.name || 'Page'))}</strong>
                                    <span class="social-neo-rail-item-meta">${escape(text(page.description || `${page.followerCount || 0} followers`))}</span>
                                </div>
                                <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="focus-feed" data-scope-type="page" data-scope-id="${escape(text(page.id))}">Open</button>
                            </article>
                        `).join('')}
                        ${!featuredGroups.length && !featuredPages.length ? `<div class="social-neo-empty social-neo-rail-empty">No spaces to recommend yet.</div>` : ''}
                    </div>
                </section>
                <section class="social-neo-card social-neo-rail-card social-neo-rail-card--campus-now">
                    <div class="social-neo-section-head social-neo-rail-head">
                        <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Campus Now</strong></div>
                    </div>
                    <div class="social-neo-list social-neo-rail-list">
                        ${featuredEvents.map((item) => `
                            <article class="social-neo-entity-card social-neo-rail-item">
                                <div class="social-neo-rail-item-copy">
                                    <strong class="social-neo-rail-item-title">${escape(text(item.title || 'Event'))}</strong>
                                    <span class="social-neo-rail-item-meta">${escape(when(item.startsAt))}</span>
                                </div>
                                <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="panel-events">View</button>
                            </article>
                        `).join('')}
                        ${!featuredEvents.length ? `<div class="social-neo-empty social-neo-rail-empty">No live activity scheduled.</div>` : ''}
                    </div>
                </section>
            `
            : activePanel === 'feed'
                ? `
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-card--suggested-people">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">People You May Know</strong></div>
                        </div>
                        <div class="social-neo-list social-neo-rail-list">
                            ${suggestedConnections.map((account) => `
                                <article class="social-neo-directory-item social-neo-rail-directory-item">
                                    <div class="social-neo-person social-neo-rail-person">
                                        ${avatar(account, 'social-neo-avatar-sm')}
                                        <div class="social-neo-rail-person-copy">
                                            <strong class="social-neo-rail-person-name">${escape(displayName(account))}</strong>
                                            <span class="social-neo-rail-person-meta">${escape(accountSubtitle(account))}</span>
                                        </div>
                                    </div>
                                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm social-neo-rail-person-action" type="button" data-action="connection-send" data-user-id="${escape(text(account.id))}"><i class="fas fa-user-plus"></i></button>
                                </article>
                            `).join('')}
                            ${!suggestedConnections.length ? `<div class="social-neo-empty social-neo-rail-empty">No suggestions right now.</div>` : ''}
                        </div>
                    </section>
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-card--active-groups">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Active Groups</strong></div>
                        </div>
                        <div class="social-neo-list social-neo-rail-list">
                            ${featuredGroups.map((group) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(group.name || 'Group'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(`${group.memberCount || 0} members / ${text(group.visibility || 'public')}`)}</span>
                                    </div>
                                    <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(group.id))}">Open</button>
                                </article>
                            `).join('')}
                            ${!featuredGroups.length ? `<div class="social-neo-empty social-neo-rail-empty">No active groups yet.</div>` : ''}
                        </div>
                    </section>
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-card--saved-trending">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Saved & Trending</strong></div>
                        </div>
                        <div class="social-neo-list social-neo-rail-list">
                            ${savedItems().filter((item) => text(item.itemType) === 'post').slice(0, 2).map((item) => {
                                const record = (Array.isArray(runtime.feed) ? runtime.feed : []).find((post) => text(post.id) === text(item.itemId));
                                if (!record) return '';
                                return `
                                    <article class="social-neo-entity-card social-neo-rail-item">
                                        <div class="social-neo-rail-item-copy">
                                            <strong class="social-neo-rail-item-title">Saved post</strong>
                                            <span class="social-neo-rail-item-meta">${escape(text(record.body || record.text || 'Saved social post').slice(0, 90))}</span>
                                        </div>
                                        <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="focus-feed" data-scope-type="${escape(text(record.scopeType || 'profile'))}" data-scope-id="${escape(text(record.scopeId || currentUserId()))}">Open</button>
                                    </article>
                                `;
                            }).join('')}
                            ${featuredEvents.map((item) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(item.title || 'Event'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(when(item.startsAt))}</span>
                                    </div>
                                    <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="panel-events">View</button>
                                </article>
                            `).join('')}
                            ${alerts.slice(0, 1).map((alert) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(alert.title || 'Alert'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(text(alert.text || ''))}</span>
                                    </div>
                                </article>
                            `).join('')}
                            ${!savedItems().length && !featuredEvents.length && !alerts.length ? `<div class="social-neo-empty social-neo-rail-empty">No saved items or live activity yet.</div>` : ''}
                        </div>
                    </section>
                `
                : `
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-card--overview">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Overview</strong></div>
                        </div>
                        <div class="social-neo-stat-grid social-neo-rail-overview-stats">
                            <div class="social-neo-rail-overview-stat"><strong class="social-neo-rail-overview-value">${escape(Array.isArray(runtime.feed) ? runtime.feed.length : 0)}</strong><span class="social-neo-rail-overview-label">Posts</span></div>
                            <div class="social-neo-rail-overview-stat"><strong class="social-neo-rail-overview-value">${escape(Array.isArray(social.pages) ? social.pages.length : 0)}</strong><span class="social-neo-rail-overview-label">Pages</span></div>
                            <div class="social-neo-rail-overview-stat"><strong class="social-neo-rail-overview-value">${escape(Array.isArray(social.groups) ? social.groups.length : 0)}</strong><span class="social-neo-rail-overview-label">Groups</span></div>
                            <div class="social-neo-rail-overview-stat"><strong class="social-neo-rail-overview-value">${escape(Array.isArray(social.events) ? social.events.length : 0)}</strong><span class="social-neo-rail-overview-label">Events</span></div>
                            <div class="social-neo-rail-overview-stat"><strong class="social-neo-rail-overview-value">${escape(relationships.connections.length)}</strong><span class="social-neo-rail-overview-label">Connections</span></div>
                            <div class="social-neo-rail-overview-stat"><strong class="social-neo-rail-overview-value">${escape(unreadNotifications())}</strong><span class="social-neo-rail-overview-label">Unread alerts</span></div>
                        </div>
                    </section>
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-card--pages-groups">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Pages & Groups</strong></div>
                        </div>
                        <div class="social-neo-list social-neo-rail-list">
                            ${featuredPages.map((page) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(page.name || 'Page'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(text(page.description || `${page.followerCount || 0} followers`))}</span>
                                    </div>
                                    <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="focus-feed" data-scope-type="page" data-scope-id="${escape(text(page.id))}">Open</button>
                                </article>
                            `).join('')}
                            ${featuredGroups.map((group) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(group.name || 'Group'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(`${group.memberCount || 0} members / ${text(group.visibility || 'public')}`)}</span>
                                    </div>
                                    <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="focus-feed" data-scope-type="group" data-scope-id="${escape(text(group.id))}">Open</button>
                                </article>
                            `).join('')}
                            ${!featuredPages.length && !featuredGroups.length ? `<div class="social-neo-empty social-neo-rail-empty">No pages or groups yet.</div>` : ''}
                        </div>
                    </section>
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-card--campus-now">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy"><strong class="social-neo-rail-title">Campus Now</strong></div>
                        </div>
                        <div class="social-neo-list social-neo-rail-list">
                            ${featuredEvents.map((item) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(item.title || 'Event'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(when(item.startsAt))}</span>
                                    </div>
                                    <button class="social-neo-link-btn social-neo-rail-item-action" type="button" data-action="panel-events">View</button>
                                </article>
                            `).join('')}
                            ${alerts.map((alert) => `
                                <article class="social-neo-entity-card social-neo-rail-item">
                                    <div class="social-neo-rail-item-copy">
                                        <strong class="social-neo-rail-item-title">${escape(text(alert.title || 'Alert'))}</strong>
                                        <span class="social-neo-rail-item-meta">${escape(text(alert.text || ''))}</span>
                                    </div>
                                </article>
                            `).join('')}
                            ${!featuredEvents.length && !alerts.length ? `<div class="social-neo-empty social-neo-rail-empty">No live activity yet.</div>` : ''}
                        </div>
                    </section>
                `;
        return `
            <aside class="social-neo-rail">
                ${railMarkup}
                ${call ? `
                    <section class="social-neo-card social-neo-rail-card social-neo-rail-call-card">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy social-neo-rail-call-copy">
                                <strong class="social-neo-rail-title social-neo-rail-call-title">Active call</strong>
                                <span class="social-neo-rail-copy social-neo-rail-call-status">${escape(text(state().ui?.callMessage || call.status || 'In progress'))}</span>
                            </div>
                        </div>
                        <div class="social-neo-inline social-neo-rail-call-actions">
                            <button class="social-neo-btn social-neo-btn-primary social-neo-rail-call-open social-neo-rail-call-open-btn" type="button" data-action="panel-messages">Open thread</button>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-rail-call-end social-neo-rail-call-end-btn" type="button" data-action="call-end" data-chat-id="${escape(text(call.chatId))}">End</button>
                        </div>
                    </section>
                ` : ''}
            </aside>
        `;
    }

    function getSocialPanelConfig(activePanel, runtime) {
        return {
            feed: {
                title: 'Campus Home',
                description: 'Posts, updates, groups, and campus activity in one stream.',
                pills: [
                    { label: 'Posts', value: Array.isArray(runtime.feed) ? runtime.feed.length : 0 },
                    { label: 'Following', value: relationshipBuckets().connections.length },
                    { label: 'Joined groups', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length }
                ]
            },
            community: {
                title: 'People',
                description: 'Find classmates, staff, and manage your campus connections.',
                pills: [
                    { label: 'People', value: Array.isArray(runtime.directory) ? runtime.directory.length : 0 },
                    { label: 'Connections', value: relationshipBuckets().connections.length },
                    { label: 'Pending', value: relationshipBuckets().incoming.length + relationshipBuckets().outgoing.length }
                ]
            },
            groups: {
                title: 'Groups',
                description: 'Join communities for courses, clubs, and projects.',
                pills: [
                    { label: 'Groups', value: Array.isArray(runtime.social?.groups) ? runtime.social.groups.length : 0 },
                    { label: 'Joined', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length },
                    { label: 'Members', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).reduce((s,g) => s + (g.memberCount||0), 0) }
                ]
            },
            workspace: {
                title: 'Project Workspaces',
                description: 'Structured team workspaces for cross-faculty projects, tasks, milestones, meetings, and deliverables.',
                pills: [
                    { label: 'Workspaces', value: Array.isArray(runtime.social?.projects) ? runtime.social.projects.length : 0 },
                    { label: 'Active', value: (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).filter((project) => text(project?.status || '') === 'active').length },
                    { label: 'My role', value: roleLabel(currentUser()?.role) },
                    { label: 'Private by default', value: 'On' }
                ]
            },
            projects: {
                title: 'Student Portfolio',
                description: 'A polished public showcase feed where students present research, builds, and capstone work for discovery.',
                pills: [
                    { label: 'Entries', value: Array.isArray(runtime.social?.projects) ? runtime.social.projects.length : 0 },
                    { label: 'Published', value: (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).filter((project) => text(project?.status || '') === 'published').length },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            pages: {
                title: 'Pages',
                description: 'Follow official labs, clubs, offices, and faculty pages.',
                pills: [
                    { label: 'Pages', value: Array.isArray(runtime.social?.pages) ? runtime.social.pages.length : 0 },
                    { label: 'Following', value: (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(p => p?.isFollowing).length },
                    { label: 'Managed', value: (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(isManagedPage).length }
                ]
            },
            events: {
                title: 'Campus Events',
                description: 'Track what is happening now and publish events without turning the section into a form wall.',
                pills: [
                    { label: 'Events', value: Array.isArray(runtime.social?.events) ? runtime.social.events.length : 0 },
                    { label: 'Study groups', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter((group) => group.type === 'study' || (group.tags || []).includes('study')).length },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            'lost-and-found': {
                title: 'Lost & Found',
                description: 'Help students recover lost items and keep campus handoffs organized in one place.',
                pills: [
                    { label: 'Open', value: lostFoundItems().filter((item) => ['open', 'claimed'].includes(normalizeLostFoundItem(item).status)).length },
                    { label: 'Lost', value: lostFoundItems().filter((item) => normalizeLostFoundItem(item).kind === 'lost').length },
                    { label: 'Found', value: lostFoundItems().filter((item) => normalizeLostFoundItem(item).kind === 'found').length },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            messages: {
                title: 'Messages',
                description: 'Keep direct threads and group rooms moving without losing sight of the wider social inbox.',
                pills: [
                    { label: 'Chats', value: activeChats().length },
                    { label: 'Unread', value: activeChats().reduce((total, chat) => total + unreadMessages(chat), 0) },
                    { label: 'Active call', value: currentCall() ? 'Live' : 'Idle' }
                ]
            },
            alerts: {
                title: 'Alerts',
                description: 'Prioritise mentions, notices, and moderation signals in one calm inbox lane.',
                pills: [
                    { label: 'Unread', value: unreadNotifications() },
                    { label: 'Mentions', value: notificationItems().filter((notification) => classifyNotification(notification) === 'mention').length },
                    { label: 'Reports', value: Array.isArray(runtime.social?.reports) ? runtime.social.reports.length : 0 },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            profile: {
                title: 'Profile',
                description: 'Your public social identity, posts, and campus relationships.',
                pills: [
                    { label: 'Posts', value: profilePostCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                    { label: 'Connections', value: profileFriendCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                    { label: 'Following', value: profileFollowingCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                    { label: 'Role', value: roleLabel(profileAccount(text(runtime.ui?.activeProfileUserId || currentUserId()))?.role || currentUser()?.role) }
                ]
            }
        };
    }

    function renderSocialFlashStatus(runtime) {
        const flash = runtime.flash?.message ? `
            <div class="social-neo-flash ${runtime.flash?.tone === 'danger' ? 'is-danger' : runtime.flash?.tone === 'success' ? 'is-success' : ''}">
                ${escape(text(runtime.flash.message))}
            </div>
        ` : '';
        const status = runtime.error ? `
            <div class="social-neo-flash is-danger">
                ${escape(text(runtime.error))} If the page is running from local files, make sure the platform server is available at ${escape(typeof getKiuPortalBackendUrl === 'function' ? getKiuPortalBackendUrl() : 'http://127.0.0.1:48933')}.
            </div>
        ` : '';
        return flash + status;
    }

    function renderSocialTopbarRegion(activePanel, activeConfig, user) {
        return `
            <section class="social-neo-card social-neo-topbar-card">
                <div class="social-neo-topbar-copy">
                    <span class="social-neo-eyebrow social-neo-topbar-eyebrow">Campus Social Network</span>
                    <h1 class="social-neo-topbar-title">${escape(activeConfig.title)}</h1>
                    <p class="social-neo-topbar-description">${escape(activeConfig.description)}</p>
                    <div class="social-neo-badge-row social-neo-badge-row-mt-8 social-neo-topbar-pills">
                        ${activeConfig.pills.map((pill) => `
                            <span class="social-neo-pill social-neo-topbar-pill">
                                <strong class="social-neo-topbar-pill-value">${escape(pill.value)}</strong>
                                <span class="social-neo-topbar-pill-label">${escape(pill.label)}</span>
                            </span>
                        `).join('')}
                    </div>
                    ${renderContextTabs(activePanel)}
                </div>
                <div class="social-neo-shell-topbar-main">
                    <button class="social-neo-shell-profile-chip" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}">
                        ${avatar(user, 'social-neo-avatar-sm')}
                        <span class="social-neo-shell-profile-copy">
                            <strong class="social-neo-shell-profile-name">${escape(displayName(user))}</strong>
                            <small class="social-neo-shell-profile-subtitle">${escape(accountSubtitle(user))}</small>
                        </span>
                    </button>
                    <div class="social-neo-shell-topbar-actions">
                        ${activePanel !== 'messages' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-topbar-action-btn" type="button" data-action="panel-messages"><i class="fas fa-paper-plane"></i> Messages</button>` : ''}
                        ${activePanel !== 'profile' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-topbar-action-btn" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}"><i class="fas fa-user"></i> Profile</button>` : ''}
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-topbar-action-btn" type="button" data-action="shell-drawer-open"><i class="fas fa-bars"></i> Menu</button>
                    </div>
                </div>
            </section>
        `;
    }

    function renderActivePanelMarkup(activePanel) {
        return activePanel === 'community'
            ? renderCommunityPanel()
            : activePanel === 'groups'
                ? renderGroupsPanel()
                : activePanel === 'workspace'
                    ? renderProjectsWorkspacePanelClassic()
                    : activePanel === 'projects'
                        ? renderProjectsPanel()
                    : activePanel === 'pages'
                        ? renderPagesPanel()
                        : activePanel === 'events'
                            ? renderEventsPanel()
                            : activePanel === 'lost-and-found'
                                ? renderLostFoundPanel()
                                : activePanel === 'messages'
                                    ? renderMessagesPanel()
                                    : activePanel === 'alerts'
                                        ? renderAlertsPanel()
                                        : activePanel === 'profile'
                                            ? renderProfilePageBody()
                                            : renderFeedPanel();
    }

    function renderPageBody() {
        const runtime = state();
        const activePanel = text(runtime.ui?.activePanel || 'feed') || 'feed';
        const user = currentUser() || {};
        const panelConfig = getSocialPanelConfig(activePanel, runtime);
        const activeConfig = panelConfig[activePanel] || panelConfig.feed;
        const panelMarkup = renderActivePanelMarkup(activePanel);

        return `
            <div class="social-neo social-neo-facebook" data-role="${escape(text(currentUser()?.role || 'student'))}" data-panel="${escape(activePanel)}">
                ${renderSocialFlashStatus(runtime)}
                ${renderSocialTopbarRegion(activePanel, activeConfig, user)}
                ${renderSectionCommandCenter(activePanel, activeConfig, runtime)}
                <div class="social-neo-shell">
                    ${renderShellWorkspaceNav(activePanel)}
                    <div class="social-neo-center">
                        ${panelMarkup}
                    </div>
                    ${renderRail(activePanel)}
                </div>
                ${renderShellDrawer(activePanel)}
                ${renderMobileTabBar(activePanel)}
                ${renderToastArea()}
                ${renderDialog()}
                ${renderStoryViewer()}
                ${renderStoryComposer()}
            </div>
        `;
    }

    function renderToastArea() {
        const toasts = (typeof getPortalSocialToastItems === 'function' ? getPortalSocialToastItems() : []) || [];
        if (!toasts.length) return '';
        return `<div class="social-neo-toast-container">
            ${toasts.map((toast) => `
                <article class="social-neo-toast ${toast.dismissing ? 'is-dismissing' : ''}" data-action="toast-dismiss" data-toast-id="${escape(toast.id)}">
                    <div class="social-neo-toast-icon"><i class="fas ${escape(toast.icon || 'fa-bell')}"></i></div>
                    <div class="social-neo-toast-content">
                        <div class="social-neo-toast-title">${escape(toast.title)}</div>
                        <div class="social-neo-toast-text">${escape(toast.text)}</div>
                    </div>
                    <button class="social-neo-toast-close" type="button" data-action="toast-dismiss" data-toast-id="${escape(toast.id)}"><i class="fas fa-times"></i></button>
                </article>
            `).join('')}
        </div>`;
    }

    function renderDialog() {
        const dialog = activeDialog();
        if (!dialog) return '';
        const kind = text(dialog.type);
        const post = kind.startsWith('post-')
            ? (Array.isArray(state().feed) ? state().feed : []).find((item) => text(item.id) === text(dialog.postId))
            : null;
        const eventItem = kind === 'event-delete'
            ? (Array.isArray(state().social?.events) ? state().social.events : []).find((item) => text(item.id) === text(dialog.eventId))
            : null;
        const projectItem = kind === 'project-leave'
            ? (Array.isArray(state().social?.projects) ? state().social.projects : []).find((item) => text(item.id) === text(dialog.projectId))
            : null;
        const groupItem = kind === 'group-delete'
            ? (Array.isArray(state().social?.groups) ? state().social.groups : []).find((item) => text(item.id) === text(dialog.groupId))
            : null;
        const dialogChat = ['message-delete', 'chat-hide'].includes(kind)
            ? activeChats().find((item) => text(item.id) === text(dialog.chatId))
            : null;
        const dialogMessage = kind === 'message-delete' && Array.isArray(dialogChat?.messages)
            ? dialogChat.messages.find((item) => text(item.id) === text(dialog.messageId))
            : null;
        if (kind === 'post-edit' && post) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-post-edit" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Edit post</strong><span class="social-neo-dialog-subtitle">Refine the post without leaving the feed.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <textarea class="social-neo-textarea" name="dialogBody" rows="6" placeholder="Update your post...">${escape(text(dialog.body || post.body || post.text || ''))}</textarea>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Save changes</button>
                    </div>
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'post-share' && post) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-post-share" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Share post</strong><span class="social-neo-dialog-subtitle">Add context before it goes back into the stream.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <textarea class="social-neo-textarea" name="dialogNote" rows="4" placeholder="Say something about this...">${escape(text(dialog.note || ''))}</textarea>
                    <div class="social-neo-dialog-preview">${escape(text(post.body || post.text || 'Original post'))}</div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Share now</button>
                    </div>
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'post-report' && post) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-post-report" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Report post</strong><span class="social-neo-dialog-subtitle">Explain what is wrong with this content.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <textarea class="social-neo-textarea" name="dialogReason" rows="4" placeholder="Spam, harassment, misleading information...">${escape(text(dialog.reason || 'Inappropriate or misleading'))}</textarea>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Submit report</button>
                    </div>
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'comment-report') {
            const reportPost = (Array.isArray(state().feed) ? state().feed : []).find((item) => postKey(item) === postKey(dialog.postId));
            const comment = findCommentInThread(reportPost?.comments, dialog.commentId);
            if (!comment) return '';
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-comment-report" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Report comment</strong><span class="social-neo-dialog-subtitle">Explain what is wrong with this comment.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">${escape(text(comment.body || comment.text || 'Comment'))}</div>
                    <textarea class="social-neo-textarea" name="dialogReason" rows="4" placeholder="Spam, harassment, misleading information...">${escape(text(dialog.reason || 'Inappropriate or misleading'))}</textarea>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Submit report</button>
                    </div>
                    <input type="hidden" name="postId" value="${escape(postKey(dialog.postId))}">
                    <input type="hidden" name="commentId" value="${escape(text(dialog.commentId))}">
                    <input type="hidden" name="targetOwnerId" value="${escape(text(comment.authorUserId || ''))}">
                </form>
            </div>`;
        }
        if (kind === 'post-delete' && post) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-post-delete" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Delete post</strong><span class="social-neo-dialog-subtitle">This removes the post from the social feed.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">${escape(text(post.body || post.text || 'This post has no text.'))}</div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Delete post</button>
                    </div>
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'profile-cover') {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-profile-cover" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Update cover photo</strong><span class="social-neo-dialog-subtitle">Paste an image URL or upload a file for your profile banner.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <input class="social-neo-input" name="coverImageUrl" type="url" placeholder="https://..." value="${escape(text(dialog.coverImage || ''))}">
                    ${renderFileChip(state().ui?.coverImageFile, 'Cover image ready')}
                    <div class="social-neo-inline social-neo-quick-actions">
                        <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-pointer">
                            <i class="fas fa-image"></i> Upload image
                            <input name="coverImageFile" type="file" accept="image/*" hidden>
                        </label>
                    </div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Update cover</button>
                    </div>
                </form>
            </div>`;
        }
        if (kind === 'group-invite') {
            const groups = inviteEligibleGroups();
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-group-invite" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Invite to group</strong><span class="social-neo-dialog-subtitle">Send ${escape(text(dialog.targetUserName || 'this member'))} a social invitation.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <select class="social-neo-select" name="inviteGroupId" data-lux-native data-lux-picker-enhanced="true">
                        ${groups.map((group) => `<option value="${escape(text(group.id))}" ${text(dialog.groupId || '') === text(group.id) ? 'selected' : ''}>${escape(text(group.name || 'Group'))}</option>`).join('')}
                    </select>
                    <textarea class="social-neo-textarea" name="inviteNote" rows="4" placeholder="Want to join our study group this week?">${escape(text(dialog.note || ''))}</textarea>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Send invite</button>
                    </div>
                    <input type="hidden" name="targetUserId" value="${escape(text(dialog.targetUserId || ''))}">
                </form>
            </div>`;
        }
        if (kind === 'group-leave' && groupItem) {
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
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-group-leave" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Leave group</strong><span class="social-neo-dialog-subtitle">You will lose access to the group chat and updates until you join again.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">
                        <strong class="social-neo-dialog-preview-title">${escape(text(groupItem.name || 'Group'))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(`${groupItem.memberCount || 0} members`)}</div>
                    </div>
                    <div class="social-neo-dialog-preview">
                        ${isOwner
                            ? (nextOwnerId
                                ? `You created this group. When you leave, ownership moves to ${escape(nextOwnerName || 'the next member')} and the group stays active.`
                                : 'You created this group. If you leave now, the group stays alive without an owner until someone else joins and takes it over.')
                            : 'Chat history, posts, and files stay in the group. Only your membership is removed.'}
                    </div>
                    <label class="social-neo-item-line social-neo-dialog-checkbox-line">
                        <input type="checkbox" name="confirmGroupLeave" value="yes">
                        <span class="social-neo-dialog-checkbox-copy">I want to leave this group.</span>
                    </label>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Leave group</button>
                    </div>
                    <input type="hidden" name="groupId" value="${escape(text(groupItem.id))}">
                    <input type="hidden" name="groupChatId" value="${escape(text(groupItem.chatId || ''))}">
                </form>
            </div>`;
        }
        if (kind === 'project-leave' && projectItem) {
            const currentId = currentUserId();
            const isOwner = text(projectItem.ownerUserId || '') === currentId;
            const nextOwnerId = text(projectItem.nextOwnerUserId || '');
            const nextOwner = nextOwnerId ? accountById(nextOwnerId) || { id: nextOwnerId } : null;
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-project-leave" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Leave workspace</strong><span class="social-neo-dialog-subtitle">This removes you from the team but keeps the workspace history, tasks, files, and chat intact.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">
                        <strong class="social-neo-dialog-preview-title">${escape(text(projectItem.name || 'Project workspace'))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(`${projectItem.memberCount || 0} team members`)}</div>
                    </div>
                    <div class="social-neo-dialog-preview ${isOwner ? 'social-neo-dialog-preview-danger' : ''}">
                        ${isOwner
                            ? (nextOwner
                                ? `You own this workspace. If you leave now, ownership transfers to ${escape(displayName(nextOwner))} and the workspace stays active.`
                                : 'You own this workspace. If you leave now, the workspace stays active but becomes ownerless until someone joins or is assigned later.')
                            : 'Your membership will be removed, but chat history, tasks, milestones, deliverables, and activity remain untouched.'}
                    </div>
                    <label class="social-neo-item-line social-neo-dialog-checkbox-line">
                        <input type="checkbox" name="confirmProjectLeave" value="yes">
                        <span class="social-neo-dialog-checkbox-copy">I understand that I am leaving this workspace.</span>
                    </label>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Leave workspace</button>
                    </div>
                    <input type="hidden" name="projectId" value="${escape(text(projectItem.id))}">
                    <input type="hidden" name="projectChatId" value="${escape(text(projectItem.chatId || projectItem.groupChatId || ''))}">
                </form>
            </div>`;
        }
        if (kind === 'event-delete' && eventItem) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-event-delete" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Delete event</strong><span class="social-neo-dialog-subtitle">This removes the event and its RSVP history.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">
                        <strong class="social-neo-dialog-preview-title">${escape(text(eventItem.title || 'Untitled event'))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(when(eventItem.startsAt || ''))}</div>
                    </div>
                    <div class="social-neo-dialog-preview social-neo-dialog-preview-danger">
                        This will remove the event for everyone and clear its RSVP history.
                    </div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Delete event</button>
                    </div>
                    <input type="hidden" name="eventId" value="${escape(text(eventItem.id))}">
                </form>
            </div>`;
        }
        if (kind === 'message-delete' && dialogChat && dialogMessage) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-message-delete" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Remove message</strong><span class="social-neo-dialog-subtitle">This will delete the message from the chat thread.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">
                        ${escape(text(dialogMessage.text || dialogMessage.file?.name || 'Message attachment'))}
                    </div>
                    <label class="social-neo-item-line social-neo-dialog-checkbox-line">
                        <input type="checkbox" name="confirmMessageDelete" value="yes">
                        <span class="social-neo-dialog-checkbox-copy">Remove this message from the conversation.</span>
                    </label>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Remove message</button>
                    </div>
                    <input type="hidden" name="chatId" value="${escape(text(dialogChat.id))}">
                    <input type="hidden" name="messageId" value="${escape(text(dialogMessage.id))}">
                </form>
            </div>`;
        }
        if (kind === 'chat-hide' && dialogChat) {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-chat-hide" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Hide conversation</strong><span class="social-neo-dialog-subtitle">This only removes the chat from your inbox view.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">
                        <strong class="social-neo-dialog-preview-title">${escape(chatTitle(dialogChat))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(chatPreview(dialogChat))}</div>
                    </div>
                    <div class="social-neo-dialog-preview social-neo-dialog-preview-danger">
                        Chat history will stay saved. This only hides the conversation from your inbox until you open it again or a new message arrives.
                    </div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Hide from inbox</button>
                    </div>
                    <input type="hidden" name="chatId" value="${escape(text(dialogChat.id))}">
                </form>
            </div>`;
        }
        return '';
    }

    function renderStoryViewer() {
        if (!isPortalStoryViewerOpen()) return '';
        const stories = (typeof getPortalSocialStoryItems === 'function' ? getPortalSocialStoryItems() : []) || [];
        const index = typeof getPortalStoryViewerIndex === 'function' ? getPortalStoryViewerIndex() : 0;
        const story = stories[index];
        if (!story) return '';
        return `<div class="social-neo-story-viewer" data-action="story-close-viewer">
            <div class="social-neo-story-progress">
                ${stories.map((_, i) => `<div class="social-neo-story-progress-bar ${i < index ? 'is-watched' : i === index ? 'is-active' : ''}"></div>`).join('')}
            </div>
            <div class="social-neo-story-header" data-action="noop">
                ${avatar(story)}
                <div class="social-neo-story-header-copy">
                    <div class="social-neo-story-author">${escape(story.authorName || 'User')}</div>
                    <div class="social-neo-story-time">${escape(story.createdAt ? formatPortalSocialWhen(story.createdAt) : 'Just now')}</div>
                </div>
                <button class="social-neo-btn social-neo-btn-ghost social-neo-story-close-btn" type="button" data-action="story-close-viewer"><i class="fas fa-times"></i></button>
            </div>
            ${story.mediaUrl ? `<img src="${escape(story.mediaUrl)}" alt="Story" data-action="noop" />` : ''}
            ${story.caption ? `<div data-action="noop" class="social-neo-story-caption">${escape(story.caption)}</div>` : ''}
            <div class="social-neo-story-nav is-prev" data-action="story-prev"></div>
            <div class="social-neo-story-nav is-next" data-action="story-next"></div>
        </div>`;
    }

    function renderStoryComposer() {
        if (!isPortalStoryComposerOpen()) return '';
        return `<div class="social-neo-story-composer" data-action="story-close-composer">
            <form class="social-neo-story-composer-card" data-form="add-story" data-action="noop">
                <h3 class="social-neo-story-composer-title">Add Story</h3>
                <p class="social-neo-story-compose-copy">Share a photo that will be visible for 24 hours.</p>
                <input type="text" class="social-neo-story-composer-input" name="storyCaption" placeholder="Add a caption..." value="${escape(text(state().ui?.storyCaption || ''))}" />
                <input type="text" class="social-neo-story-composer-input" name="storyMediaUrl" placeholder="Image URL..." value="${escape(text(state().ui?.storyMediaUrl || ''))}" />
                ${renderFileChip(state().ui?.storyFile, 'Story image ready')}
                <label class="social-neo-btn social-neo-btn-ghost social-neo-story-upload-btn social-neo-story-upload-shell">
                    <i class="fas fa-image"></i> Upload image
                    <input name="storyFile" type="file" accept="image/*" hidden>
                </label>
                <div class="social-neo-profile-edit-actions social-neo-story-composer-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-story-composer-cancel-btn" type="button" data-action="story-close-composer">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-story-composer-submit-btn" type="submit">Share Story</button>
                </div>
                <p class="social-neo-story-expiry">This story will expire in 24 hours</p>
            </form>
        </div>`;
    }

    function collectCommentReactionFingerprint(comments = [], limit = 12, collected = []) {
        if (!Array.isArray(comments) || collected.length >= limit) return collected;
        comments.forEach((comment) => {
            if (collected.length >= limit) return;
            collected.push([text(comment?.id), JSON.stringify(comment?.reactionCounts || {})]);
            if (Array.isArray(comment?.replies) && comment.replies.length) {
                collectCommentReactionFingerprint(comment.replies, limit, collected);
            }
        });
        return collected;
    }

    function summarizeCommentReactions(comments = []) {
        return JSON.stringify(collectCommentReactionFingerprint(comments).slice(0, 12));
    }

    function buildFeedFingerprint(runtime) {
        const feed = Array.isArray(runtime?.feed) ? runtime.feed : [];
        const feedSlice = feed.slice(0, 24).map((post) => [
            postKey(post),
            text(post?.viewerReaction || ''),
            JSON.stringify(post?.reactionCounts || {}),
            isPostSaved(postKey(post)) ? '1' : '0',
            post?.isPinned ? '1' : '0',
            Number(post?.replyCount || 0),
            Number(post?.shareCount || 0),
            summarizeCommentReactions(post?.comments)
        ].join(':')).join('|');
        const drafts = JSON.stringify(runtime?.ui?.commentDraftByPost || {});
        const replies = JSON.stringify(runtime?.ui?.commentReplyTargetByPost || {});
        return `${feedSlice}::${drafts}::${replies}`;
    }

    function buildSocialRenderSignature(activePanel, runtime) {
        const ui = runtime?.ui || {};
        const dialog = activeDialog();
        return [
            activePanel,
            text(currentUser()?.role || 'student'),
            text(currentUserId() || ''),
            text(typeof currentFacultyCode === 'function' ? currentFacultyCode() : ''),
            text(ui.activeChatId || ''),
            text(ui.homeFeedFilter || ''),
            text(ui.communityTab || ''),
            text(ui.eventsSubTab || ''),
            text(ui.eventsComposerSection || ''),
            text(ui.activeScopeType || ''),
            text(ui.activeScopeId || ''),
            text(ui.eventScope || ''),
            Boolean(ui.eventIsOnline),
            text(ui.eventImageFile?.name || ''),
            text(ui.messagesFilter || ''),
            text(ui.alertsFilter || ''),
            text(ui.activeProfileUserId || ''),
            text(ui.activeProjectId || ''),
            text(ui.projectTab || ''),
            Boolean(ui.projectComposerOpen),
            text(ui.activePageId || ''),
            text(ui.pageWizardStep || ''),
            ui.callOpen ? 'call-open' : 'call-closed',
            text(dialog?.type || ''),
            text(dialog?.postId || dialog?.eventId || dialog?.groupId || dialog?.chatId || ''),
            isPortalStoryViewerOpen() ? 'story-viewer-open' : 'story-viewer-closed',
            isPortalStoryComposerOpen() ? 'story-composer-open' : 'story-composer-closed',
            Boolean(ui.projectTaskFormOpen),
            Boolean(ui.projectTaskMyOnly),
            text(ui.projectTaskSearch || ''),
            text(ui.projectTaskFilterPriority || ''),
            text(ui.projectTaskFilterAssignee || ''),
            text(ui.lostFoundFilter || ''),
            Boolean(ui.lostFoundComposerOpen),
            text(ui.lostFoundEditId || ''),
            text(ui.lostFoundKind || ''),
            text(ui.lostFoundSearch || ''),
            text(ui.lostFoundBrowseFaculty || ''),
            buildFeedFingerprint(runtime)
        ].join('|');
    }

    function renderSocialPageNow(reason = 'manual') {
        clearTimeout(renderDebounceTimer);
        renderDebounceTimer = setTimeout(() => {
            const host = root();
            if (!host) return;
            window.__kiuSocialLiteRenderPage = renderSocialPageNow;
            applyShellIdentity();
            const runtime = state();
            const activePanel = text(runtime.ui?.activePanel || 'feed') || 'feed';
            const activeConfig = (getSocialPanelConfig(activePanel, runtime)[activePanel]) || getSocialPanelConfig('feed', runtime).feed;
            const user = currentUser() || {};
            const shell = ensureSocialShell(host);
            const renderSignature = buildSocialRenderSignature(activePanel, runtime);
            const forceCenterOnly = Boolean(host.__kiuForceCenterOnly);
            host.__kiuForceCenterOnly = false;
            const forceRender = /^(feed|feed-error|hydrate|hydrate-accounts|hydrate-error|social-bootstrap|post-created|dialog-|comment-|post-save|post-pin|post-react|post-submit)/.test(reason);
            if (!forceRender && reason !== 'boot' && !/-module$/.test(reason) && host.__kiuLastRenderSignature === renderSignature) {
                return;
            }
            const renderPlan = resolveSocialRenderPlan(reason, activePanel, runtime);
            if (forceRender && renderPlan.center && shell.center) {
                delete shell.center.__kiuLastMarkup;
            }
            if (forceCenterOnly) {
                renderPlan.flash = false;
                renderPlan.topbar = false;
                renderPlan.command = false;
                renderPlan.rail = false;
                renderPlan.drawer = false;
                renderPlan.mobileTab = false;
                renderPlan.toast = false;
                renderPlan.dialog = false;
                renderPlan.storyViewer = false;
                renderPlan.storyComposer = false;
            }
            const interactionSnapshot = captureInteractionState(host);
            shell.root.dataset.role = text(currentUser()?.role || 'student');
            shell.root.dataset.panel = activePanel;
            if (renderPlan.flash) setSocialRegionMarkup(shell.flash, renderSocialFlashStatus(runtime));
            if (renderPlan.topbar) setSocialRegionMarkup(shell.topbar, renderSocialTopbarRegion(activePanel, activeConfig, user));
            if (renderPlan.command) setSocialRegionMarkup(shell.command, renderSectionCommandCenter(activePanel, activeConfig, runtime));
            setSocialRegionMarkup(shell.workspaceNav, renderShellWorkspaceNav(activePanel));
            if (renderPlan.center) setSocialRegionMarkup(shell.center, renderActivePanelMarkup(activePanel));
            if (renderPlan.rail) setSocialRegionMarkup(shell.rail, renderRail(activePanel));
            if (renderPlan.drawer) setSocialRegionMarkup(shell.drawer, renderShellDrawer(activePanel));
            if (renderPlan.mobileTab) setSocialRegionMarkup(shell.mobileTab, renderMobileTabBar(activePanel));
            if (renderPlan.toast) setSocialRegionMarkup(shell.toast, renderToastArea());
            if (renderPlan.dialog) setSocialRegionMarkup(shell.dialog, renderDialog());
            if (renderPlan.storyViewer) setSocialRegionMarkup(shell.storyViewer, renderStoryViewer());
            if (renderPlan.storyComposer) setSocialRegionMarkup(shell.storyComposer, renderStoryComposer());
            bindFileInputs();
            enhanceSocialAccessibility(host);
            restoreInteractionState(host, interactionSnapshot);
            const focusPostId = postKey(runtime.ui?.commentReplyFocusPostId || '');
            if (focusPostId && /^comment-reply/.test(reason)) {
                focusCommentComposeInput(host, focusPostId);
                delete runtime.ui.commentReplyFocusPostId;
            }
            bindEvents();
            revealShell();
            const transparencyRoots = [
                renderPlan.flash ? shell.flash : null,
                renderPlan.topbar ? shell.topbar : null,
                renderPlan.command ? shell.command : null,
                renderPlan.center ? shell.center : null,
                renderPlan.rail ? shell.rail : null,
                renderPlan.drawer ? shell.drawer : null,
                renderPlan.mobileTab ? shell.mobileTab : null,
                renderPlan.toast ? shell.toast : null,
                renderPlan.dialog ? shell.dialog : null,
                renderPlan.storyViewer ? shell.storyViewer : null,
                renderPlan.storyComposer ? shell.storyComposer : null
            ].filter(Boolean);
            if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                try { window.queueLuxuryTransparencyRefresh(undefined, { roots: transparencyRoots }); } catch (error) {}
            } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
                try { window.refreshLuxuryTransparencySurfaces(undefined, { roots: transparencyRoots }); } catch (error) {}
            }
            if (typeof window.__kiuSocialMobileSync === 'function') {
                try { window.__kiuSocialMobileSync(); } catch (error) {}
            }
            scheduleDeferredDesktopModulePrefetch();
            scheduleDirectoryPrefetch();
            host.__kiuLastRenderSignature = renderSignature;
            if (state().ui?.callOpen) {
                window.requestAnimationFrame(() => {
                    try {
                        if (typeof attachPortalCallLocalPreview === 'function') attachPortalCallLocalPreview();
                        if (typeof attachPortalCallRemotePreview === 'function') attachPortalCallRemotePreview();
                    } catch (error) {
                        console.warn('[Social] Could not attach call previews.', error);
                    }
                });
            }
            const activeChatId = text(state().ui?.activeChatId || '');
            const jumpMessageId = text(state().ui?.groupThreadJumpMessageByChat?.[activeChatId] || '');
            if (activeChatId && jumpMessageId) {
                window.requestAnimationFrame(() => {
                    const node = host.querySelector(`#${messageAnchorId(activeChatId, jumpMessageId)}`);
                    if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
                });
            }
        }, reason === 'boot' || /^(comment-|post-react|post-save|post-pin)/.test(reason) ? 0 : 80);
    }

    async function withBusy(action) {
        try {
            await action();
        } catch (error) {
            console.error('[Social] Action failed:', error);
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Action failed.', 'danger');
        }
    }

    async function handleClick(event) {
        const trigger = event.target.closest('[data-action]');
        if (!trigger || !root()?.contains(trigger)) return;
        const action = text(trigger.getAttribute('data-action'));
        if (!action) return;
        if (action === 'noop') return;
        event.preventDefault();

        if (action === 'panel-feed') {
            const filter = text(trigger.getAttribute('data-home-filter'));
            if (filter) state().ui.homeFeedFilter = filter;
            return setPanel('feed');
        }
        if (action === 'panel-community') {
            const tab = text(trigger.getAttribute('data-community-tab'));
            if (tab) state().ui.communityTab = tab;
            return setPanel('community');
        }
        if (action === 'panel-events') {
            const tab = text(trigger.getAttribute('data-events-tab'));
            if (tab) state().ui.eventsSubTab = tab;
            return setPanel('events');
        }
        if (action === 'panel-lost-found' || action === 'panel-lost-and-found') {
            const filter = text(trigger.getAttribute('data-lost-found-filter'));
            if (filter) state().ui.lostFoundFilter = filter;
            setPanel('lost-and-found');
            renderSocialPageNow('lost-found-filter');
            return;
        }
        if (action === 'panel-groups') {
            const tab = text(trigger.getAttribute('data-groups-tab'));
            if (tab) state().ui.groupsTab = tab;
            return setPanel('groups');
        }
        if (action === 'panel-workspace') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            return setPanel('workspace');
        }
        if (action === 'panel-projects') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            return setPanel('projects');
        }
        if (action === 'profile-portfolio-open') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            return setPanel('projects');
        }
        if (action === 'panel-pages') {
            const tab = text(trigger.getAttribute('data-pages-tab'));
            if (tab) state().ui.pagesTab = tab;
            state().ui.activePageProfileId = '';
            state().ui.pageProfileEditMode = false;
            state().ui.pageWizardOpen = false;
            return setPanel('pages');
        }
        if (action === 'panel-messages') {
            const filter = text(trigger.getAttribute('data-messages-filter'));
            if (filter) state().ui.messagesFilter = filter;
            setPanel('messages');
            const activeChatId = text(state().ui?.activeChatId || '');
            if (activeChatId && typeof markPortalChatMessagesRead === 'function') {
                markPortalChatMessagesRead(activeChatId).catch(() => null);
            }
            return;
        }
        if (action === 'panel-alerts') {
            const filter = text(trigger.getAttribute('data-alerts-filter'));
            if (filter) state().ui.alertsFilter = filter;
            if (typeof refreshPortalNotifications === 'function') {
                return withBusy(async () => {
                    await refreshPortalNotifications(true);
                    setPanel('alerts');
                });
            }
            return setPanel('alerts');
        }
        if (action === 'panel-profile') {
            state().ui.activeProfileUserId = text(trigger.getAttribute('data-user-id') || currentUserId());
            return setPanel('profile');
        }
        if (action === 'lost-found-compose-toggle') {
            const runtime = state();
            const isEditMode = Boolean(text(runtime.ui?.lostFoundEditId || ''));
            const nextOpen = !(Boolean(runtime.ui?.lostFoundComposerOpen) || isEditMode);
            if (!nextOpen) {
                resetLostFoundDraft();
            } else {
                runtime.ui.lostFoundComposerOpen = true;
            }
            renderSocialPageNow('lost-found-compose-toggle');
            return;
        }
        if (action === 'lost-found-compose-open') {
            resetLostFoundDraft();
            state().ui.lostFoundComposerOpen = true;
            renderSocialPageNow('lost-found-compose-open');
            return;
        }
        if (action === 'lost-found-reset') {
            resetLostFoundDraft();
            renderSocialPageNow('lost-found-reset');
            return;
        }
        if (action === 'lost-found-edit') {
            const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === text(trigger.getAttribute('data-item-id')));
            if (!item) return;
            const nextFaculty = item.campusScope === 'campus' ? 'all' : 'current';
            state().ui.lostFoundEditId = text(item.id);
            state().ui.lostFoundKind = item.kind || 'lost';
            state().ui.lostFoundStatus = item.status || 'open';
            state().ui.lostFoundTitle = item.title || '';
            state().ui.lostFoundDescription = item.description || '';
            state().ui.lostFoundCategory = item.category || '';
            state().ui.lostFoundLocation = item.locationText || '';
            state().ui.lostFoundDate = item.eventDate || '';
            state().ui.lostFoundScope = nextFaculty;
            state().ui.lostFoundComposerOpen = true;
            state().ui.lostFoundFile = null;
            setPanel('lost-and-found');
            renderSocialPageNow('lost-found-edit');
            return;
        }
        if (action === 'lost-found-resolve') {
            return withBusy(async () => {
                const itemId = text(trigger.getAttribute('data-item-id'));
                if (!itemId) return;
                const currentId = currentUserId();
                const nextItems = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).map((entry) => {
                    if (text(entry.id) !== itemId) return entry;
                    return {
                        ...entry,
                        status: 'resolved',
                        resolvedAt: new Date().toISOString(),
                        resolvedByUserId: currentId,
                        updatedAt: new Date().toISOString()
                    };
                });
                await saveLostFoundItems(nextItems, 'lost-found-resolved');
                renderSocialPageNow('lost-found-resolve');
            });
        }
        if (action === 'lost-found-delete') {
            return withBusy(async () => {
                const itemId = text(trigger.getAttribute('data-item-id'));
                if (!itemId) return;
                const runtime = state();
                const actorId = currentUserId();
                const actorRole = text(currentUser()?.role || '');
                const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === itemId);
                if (!item) return;
                if (text(item.authorUserId) !== actorId && !['admin', 'student_service'].includes(actorRole)) return;
                const confirmed = typeof window.confirm === 'function'
                    ? window.confirm(`Remove "${item.title || 'this listing'}" from Lost & Found?`)
                    : true;
                if (!confirmed) return;
                const nextItems = lostFoundItems()
                    .map((entry) => normalizeLostFoundItem(entry))
                    .filter((entry) => text(entry.id) !== itemId);
                await saveLostFoundItems(nextItems, 'lost-found-deleted');
                if (text(runtime.ui?.lostFoundEditId || '') === itemId) resetLostFoundDraft();
                renderSocialPageNow('lost-found-delete');
            });
        }
        if (action === 'lost-found-contact') {
            const targetUserId = text(trigger.getAttribute('data-user-id'));
            const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === text(trigger.getAttribute('data-item-id')));
            if (!targetUserId || !item) return;
            const prefill = `About your ${text(item.kind) === 'found' ? 'found' : 'lost'} item "${item.title || 'listing'}": `;
            if (typeof openPortalDirectChat === 'function') {
                Promise.resolve(openPortalDirectChat(targetUserId)).then((chat) => {
                    const chatId = text(chat?.id || '');
                    if (!chatId) return;
                    state().ui.messageDraftByChat = state().ui.messageDraftByChat || {};
                    state().ui.messageDraftByChat[chatId] = prefill;
                    setActiveChat(chatId);
                    setPanel('messages');
                    renderSocialPageNow('lost-found-contact');
                }).catch(() => {
                    setPanel('messages');
                });
            } else {
                setPanel('messages');
            }
            return;
        }
        if (action === 'toast-dismiss') {
            const toastId = trigger.getAttribute('data-toast-id');
            if (typeof dismissPortalSocialToast === 'function') dismissPortalSocialToast(toastId);
            return;
        }
        if (action === 'story-add') {
            if (typeof openPortalStoryComposer === 'function') openPortalStoryComposer();
            return;
        }
        if (action === 'story-view') {
            const userId = trigger.getAttribute('data-user-id');
            if (typeof openPortalStoryViewer === 'function') {
                const stories = (typeof getPortalSocialStoryItems === 'function' ? getPortalSocialStoryItems() : []) || [];
                const index = stories.findIndex((story) => text(story?.authorUserId || story?.userId || story?.authorId) === text(userId));
                openPortalStoryViewer(index >= 0 ? index : 0);
            }
            return;
        }
        if (action === 'story-close-viewer') {
            if (typeof closePortalStoryViewer === 'function') closePortalStoryViewer();
            return;
        }
        if (action === 'story-next') {
            if (typeof nextPortalStory === 'function') nextPortalStory();
            return;
        }
        if (action === 'story-prev') {
            if (typeof prevPortalStory === 'function') prevPortalStory();
            return;
        }
        if (action === 'story-close-composer') {
            if (typeof closePortalStoryComposer === 'function') closePortalStoryComposer();
            return;
        }
if (action === 'profile-tab-posts') { state().ui.profileTab = 'posts'; return renderSocialPageNow('profile-tab'); }
if (action === 'profile-tab-friends') { state().ui.profileTab = 'friends'; return renderSocialPageNow('profile-tab'); }
if (action === 'profile-tab-saved') { state().ui.profileTab = 'saved'; return renderSocialPageNow('profile-tab'); }
if (action === 'profile-tab-about') { state().ui.profileTab = 'about'; return renderSocialPageNow('profile-tab'); }
if (action === 'profile-tab-following') { state().ui.profileTab = 'following'; return renderSocialPageNow('profile-tab'); }
        if (action === 'profile-view') {
            const userId = trigger.getAttribute('data-user-id');
            state().ui.activeProfileUserId = text(userId || currentUserId());
            state().ui.profileTab = 'posts';
            return setPanel('profile');
        }
        if (action === 'profile-edit') { state().ui.editProfileMode = true; return renderSocialPageNow('profile-edit'); }
        if (action === 'profile-edit-cancel') { state().ui.editProfileMode = false; return renderSocialPageNow('profile-cancel'); }
        if (action === 'event-time-group-toggle') {
            event.preventDefault();
            event.target.closest('.social-neo-time-group')?.classList.toggle('is-open');
            return;
        }
        if (action === 'profile-edit-cover') return openDialog('profile-cover', { coverImage: profileCover(profileAccount(currentUserId())) });
        if (action === 'profile-message') {
            return withBusy(async () => {
                const chat = await openPortalDirectChat(trigger.getAttribute('data-user-id'));
                if (chat?.id) { setActiveChat(chat.id); setPanel('messages'); }
            });
        }
        if (action === 'dialog-close') {
            closeDialog();
            return;
        }
        if (action === 'group-leave-open') {
            return openDialog('group-leave', { groupId: text(trigger.getAttribute('data-group-id')) });
        }
        if (action === 'event-delete-open') {
            return openDialog('event-delete', { eventId: text(trigger.getAttribute('data-event-id')) });
        }
        if (action === 'message-delete-open') {
            return openDialog('message-delete', {
                chatId: text(trigger.getAttribute('data-chat-id')),
                messageId: text(trigger.getAttribute('data-message-id'))
            });
        }
        if (action === 'shell-drawer-open') {
            state().ui.shellDrawerOpen = true;
            return renderSocialPageNow('shell-drawer-open');
        }
        if (action === 'shell-drawer-close') {
            state().ui.shellDrawerOpen = false;
            return renderSocialPageNow('shell-drawer-close');
        }
        // Events sub-tab switching
        if (action === 'events-tab-student') {
            state().ui.eventsSubTab = 'student';
            state().ui.eventsComposerSection = '';
            return renderSocialPageNow('events-tab');
        }
        if (action === 'events-tab-university') {
            state().ui.eventsSubTab = 'university';
            state().ui.eventsComposerSection = '';
            return renderSocialPageNow('events-tab');
        }
        if (action === 'events-tab-studygroups') {
            state().ui.eventsSubTab = 'studygroups';
            state().ui.eventsComposerSection = '';
            return renderSocialPageNow('events-tab');
        }
        if (action === 'events-compose-toggle') {
            const activeSection = text(state().ui.eventsSubTab || 'student') || 'student';
            state().ui.eventsComposerSection = text(state().ui.eventsComposerSection || '') === activeSection ? '' : activeSection;
            return renderSocialPageNow('events-compose-toggle');
        }
        if (action === 'events-compose-close') {
            state().ui.eventsComposerSection = '';
            return renderSocialPageNow('events-compose-close');
        }
        if (action === 'feed-refresh') return withBusy(() => refreshPortalSocialFeed(true));
        if (action === 'composer-attach') return root()?.querySelector('input[name="postFile"]')?.click();
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
        if (action === 'directory-message') {
            return withBusy(async () => {
                const chat = await openPortalDirectChat(trigger.getAttribute('data-user-id'));
                if (chat?.id) {
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }
        if (action === 'directory-study-chat') {
            return withBusy(async () => {
                const targetUserId = text(trigger.getAttribute('data-user-id'));
                const account = accountById(targetUserId) || { id: targetUserId };
                const sharedGroup = sharedGroupsWithUser(targetUserId)[0];
                const chat = await openPortalDirectChat(targetUserId);
                if (chat?.id) {
                    state().ui.messageDraftByChat = state().ui.messageDraftByChat || {};
                    state().ui.messageDraftByChat[text(chat.id)] = sharedGroup
                        ? `Want to start a study chat for ${text(sharedGroup.name || 'our shared group')}?`
                        : `Hi ${displayName(account).split(' ')[0]}, want to start a study chat?`;
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }
        if (action === 'person-mention') {
            const userId = text(trigger.getAttribute('data-user-id'));
            const token = userId ? `@${userId}` : '';
            const runtime = state();
            runtime.ui.composerText = [text(runtime.ui?.composerText || ''), token].filter(Boolean).join(' ').trim() + ' ';
            setPanel('feed');
            window.requestAnimationFrame(() => root()?.querySelector('[data-bind="composer-text"]')?.focus());
            return;
        }
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
        if (action === 'connection-send') return withBusy(() => sendPortalSocialConnectionRequest(trigger.getAttribute('data-user-id')));
        if (action === 'connection-accept') return withBusy(() => respondPortalSocialConnectionRequest(trigger.getAttribute('data-relationship-id'), true));
        if (action === 'connection-decline') return withBusy(() => respondPortalSocialConnectionRequest(trigger.getAttribute('data-relationship-id'), false));
        if (action === 'connection-cancel') return withBusy(() => removePortalSocialConnection(trigger.getAttribute('data-user-id')));
        if (action === 'connection-remove') return withBusy(() => removePortalSocialConnection(trigger.getAttribute('data-user-id')));
        if (action === 'group-member-search') return renderSocialPageNow('group-member-search');
        if (action === 'project-open') {
            // Open in whichever section the user is in: the team workspace stays in
            // "Projects" (workspace); the showcase stays in "Portfolio" (projects).
            const currentPanel = text(state().ui?.activePanel || '');
            const targetPanel = currentPanel === 'workspace' ? 'workspace' : 'projects';
            state().ui.activeProjectId = text(trigger.getAttribute('data-project-id'));
            state().ui.projectTab = 'overview';
            state().ui.activePanel = targetPanel;
            state().ui.shellDrawerOpen = false;
            try { localStorage.setItem(PANEL_KEY, targetPanel); } catch (error) {}
            // Force a render: setPanel() skips re-rendering when the panel is
            // unchanged, but activeProjectId changed so we must repaint.
            return renderSocialPageNow('project-open');
        }
        if (action === 'project-create-open') {
            const drawer = document.getElementById('project-create-drawer');
            if (drawer) { drawer.hidden = false; drawer.removeAttribute('hidden'); }
            return;
        }
        if (action === 'project-create-close') {
            const drawer = document.getElementById('project-create-drawer');
            if (drawer) { drawer.hidden = true; drawer.setAttribute('hidden', ''); }
            return;
        }
        if (action === 'portfolio-filter-tag') {
            state().ui.projectDiscoverTag = text(trigger.getAttribute('data-tag') || '').toLowerCase();
            return renderSocialPageNow('portfolio-filter-tag');
        }
        if (action === 'portfolio-compose-open') {
            setPortfolioComposerOpen(true);
            return renderSocialPageNow('portfolio-compose-open');
        }
        if (action === 'portfolio-compose-close') {
            setPortfolioComposerOpen(false);
            return renderSocialPageNow('portfolio-compose-close');
        }
        if (action === 'portfolio-compose-reset') {
            resetPortfolioEditor();
            state().ui.activeProjectId = '';
            return renderSocialPageNow('portfolio-compose-reset');
        }
        if (action === 'portfolio-edit') {
            const projectId = text(trigger.getAttribute('data-project-id'));
            const entry = (Array.isArray(state().social?.projects) ? state().social.projects : []).find((item) => text(item?.id) === projectId);
            if (!entry) return;
            openPortfolioEditor(entry);
            state().ui.activeProjectId = projectId;
            return renderSocialPageNow('portfolio-edit');
        }
        if (action === 'portfolio-edit-cancel') {
            resetPortfolioEditor();
            return renderSocialPageNow('portfolio-edit-cancel');
        }
        if (action === 'portfolio-delete') {
            return withBusy(async () => {
                const projectId = text(trigger.getAttribute('data-project-id'));
                const entry = (Array.isArray(state().social?.projects) ? state().social.projects : []).map((item) => normalizePortfolioEntry(item)).find((item) => item.id === projectId);
                if (!entry) return;
                const confirmed = typeof window.confirm === 'function'
                    ? window.confirm(`Remove "${entry.title}" from Portfolio?`)
                    : true;
                if (!confirmed) return;
                await deletePortalSocialProject(projectId);
                if (text(state().ui?.projectEditId || '') === projectId) resetPortfolioEditor();
                if (text(state().ui?.activeProjectId || '') === projectId) state().ui.activeProjectId = '';
                renderSocialPageNow('portfolio-delete');
            });
        }
        if (action === 'portfolio-contact') {
            const targetUserId = text(trigger.getAttribute('data-user-id'));
            const projectId = text(trigger.getAttribute('data-project-id'));
            const entry = (Array.isArray(state().social?.projects) ? state().social.projects : []).map((item) => normalizePortfolioEntry(item)).find((item) => item.id === projectId);
            if (!targetUserId || !entry || typeof openPortalDirectChat !== 'function') return;
            return withBusy(async () => {
                const chat = await openPortalDirectChat(targetUserId);
                if (chat?.id) {
                    state().ui.messageDraftByChat = state().ui.messageDraftByChat || {};
                    state().ui.messageDraftByChat[text(chat.id)] = `Hi, I saw your portfolio entry "${entry.title}" and would like to connect.`;
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }
        if (action === 'projects-back') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            return renderSocialPageNow('projects-back');
        }
        if (action === 'project-tab') {
            state().ui.activeProjectId = text(trigger.getAttribute('data-project-id') || state().ui.activeProjectId);
            state().ui.projectTab = text(trigger.getAttribute('data-project-tab') || 'overview') || 'overview';
            return renderSocialPageNow('project-tab');
        }
        if (action === 'project-faculty-toggle') {
            const faculty = text(trigger.getAttribute('data-faculty'));
            state().ui.projectFacultyCodes = Array.isArray(state().ui.projectFacultyCodes) ? state().ui.projectFacultyCodes : [currentFacultyCode()];
            if (state().ui.projectFacultyCodes.includes(faculty)) {
                state().ui.projectFacultyCodes = state().ui.projectFacultyCodes.filter((item) => text(item) !== faculty);
            } else {
                state().ui.projectFacultyCodes.push(faculty);
            }
            if (!state().ui.projectFacultyCodes.length) state().ui.projectFacultyCodes = [currentFacultyCode()];
            return renderSocialPageNow('project-faculty-toggle');
        }
        if (action === 'project-selected-add') {
            state().ui.projectInviteSelectedIds = Array.isArray(state().ui.projectInviteSelectedIds) ? state().ui.projectInviteSelectedIds : [];
            const memberId = text(trigger.getAttribute('data-user-id'));
            if (memberId && !state().ui.projectInviteSelectedIds.includes(memberId)) state().ui.projectInviteSelectedIds.push(memberId);
            return renderSocialPageNow('project-selected-add');
        }
        if (action === 'project-selected-remove') {
            const memberId = text(trigger.getAttribute('data-user-id'));
            state().ui.projectInviteSelectedIds = (Array.isArray(state().ui.projectInviteSelectedIds) ? state().ui.projectInviteSelectedIds : []).filter((item) => text(item) !== memberId);
            return renderSocialPageNow('project-selected-remove');
        }
        if (action === 'project-open-chat') {
            return withBusy(async () => {
                const projectId = text(trigger.getAttribute('data-project-id'));
                const project = (Array.isArray(state().social?.projects) ? state().social.projects : []).find((entry) => text(entry?.id) === projectId);
                if (!project?.groupId) throw new Error('Project chat is unavailable.');
                const chat = await openPortalSocialGroupChat(project.groupId);
                if (chat?.id) {
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }
        if (action === 'project-member-invite') {
            return withBusy(() => invitePortalSocialProjectMember(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-user-id'),
                trigger.getAttribute('data-role')
            ));
        }
        if (action === 'project-member-role') {
            return withBusy(() => updatePortalSocialProjectMemberRole(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-user-id'),
                trigger.getAttribute('data-role')
            ));
        }
        if (action === 'project-member-remove') {
            return withBusy(() => removePortalSocialProjectMember(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-user-id')
            ));
        }
        if (action === 'project-task-move') {
            return withBusy(() => updatePortalSocialProjectTask(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-task-id'),
                { status: text(trigger.getAttribute('data-status') || 'backlog') || 'backlog' }
            ));
        }
        if (action === 'project-task-delete') {
            return withBusy(() => deletePortalSocialProjectTask(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-task-id')
            ));
        }
        if (action === 'project-task-toggle-form') {
            state().ui.projectTaskFormOpen = !state().ui.projectTaskFormOpen;
            renderSocialPageNow('project-task-toggle-form');
            return;
        }
        if (action === 'project-task-toggle-my') {
            state().ui.projectTaskMyOnly = !state().ui.projectTaskMyOnly;
            renderSocialPageNow('project-task-toggle-my');
            return;
        }
        if (action === 'project-task-quick-add') {
            state().ui.projectTaskFormOpen = true;
            const column = trigger.getAttribute('data-column') || 'backlog';
            setTimeout(() => {
                const form = document.querySelector('form[data-form="project-task-create"]');
                if (form) {
                    const statusSelect = form.querySelector('[name="projectTaskStatus"]');
                    if (statusSelect) statusSelect.value = column;
                    const titleInput = form.querySelector('[name="projectTaskTitle"]');
                    if (titleInput) titleInput.focus();
                }
            }, 50);
            renderSocialPageNow('project-task-quick-add');
            return;
        }
        if (action === 'project-milestone-toggle') {
            return withBusy(() => updatePortalSocialProjectMilestone(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-milestone-id'),
                { completed: text(trigger.getAttribute('data-completed')) === '1' }
            ));
        }
        if (action === 'project-milestone-delete') {
            return withBusy(() => deletePortalSocialProjectMilestone(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-milestone-id')
            ));
        }
        if (action === 'project-deliverable-delete') {
            return withBusy(() => deletePortalSocialProjectDeliverable(
                trigger.getAttribute('data-project-id'),
                trigger.getAttribute('data-deliverable-id')
            ));
        }
        if (action === 'project-showcase-publish') {
            return withBusy(() => publishPortalSocialProjectShowcase(trigger.getAttribute('data-project-id')));
        }
        if (action === 'project-leave-open') {
            return openDialog('project-leave', { projectId: text(trigger.getAttribute('data-project-id')) });
        }
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
        if (action === 'page-follow') return withBusy(() => togglePortalSocialFollow('page', trigger.getAttribute('data-page-id')));
        if (action === 'group-join') return withBusy(() => setPortalSocialGroupMembership(trigger.getAttribute('data-group-id'), 'join'));
        if (action === 'group-approve') return withBusy(() => respondPortalSocialGroupMembership(trigger.getAttribute('data-group-id'), trigger.getAttribute('data-member-id'), true));
        if (action === 'group-decline') return withBusy(() => respondPortalSocialGroupMembership(trigger.getAttribute('data-group-id'), trigger.getAttribute('data-member-id'), false));
        if (action === 'group-chat') {
            return withBusy(async () => {
                const chat = await openPortalSocialGroupChat(trigger.getAttribute('data-group-id'));
                if (chat?.id) {
                    setActiveChat(chat.id);
                    setPanel('messages');
                }
            });
        }
        if (action === 'focus-feed') return withBusy(() => focusFeed(trigger.getAttribute('data-scope-type'), trigger.getAttribute('data-scope-id')));
        if (action === 'event-rsvp') return withBusy(() => respondPortalSocialEventRsvp(trigger.getAttribute('data-event-id'), trigger.getAttribute('data-status')));
        if (action === 'post-focus-comment') {
            const input = root()?.querySelector(`#${controlId('commentBody', trigger.getAttribute('data-post-id'))}`);
            input?.focus();
            return;
        }
        if (action === 'composer-focus') {
            setPanel('feed');
            window.requestAnimationFrame(() => {
                root()?.querySelector('[data-bind="composer-text"]')?.focus({ preventScroll: false });
                root()?.querySelector('.social-neo-composer-card')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            });
            return;
        }
        if (action === 'post-submit') {
            if (!trigger.closest('.social-neo-composer-card')) {
                setPanel('feed');
                window.requestAnimationFrame(() => {
                    root()?.querySelector('[data-bind="composer-text"]')?.focus({ preventScroll: false });
                    root()?.querySelector('.social-neo-composer-card')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                });
                return;
            }
            const runtime = state();
            const composerTextarea = root()?.querySelector('[data-bind="composer-text"]');
            const body = text(composerTextarea?.value || runtime.ui?.composerText || '');
            const file = runtime.ui?.composerFile || null;
            const scopeType = text(runtime.ui?.activeScopeType || 'profile') || 'profile';
            const scopeId = text(runtime.ui?.activeScopeId || currentUserId()) || currentUserId();
            const scope = postingScopeOptions().find((item) => item.type === scopeType && item.id === scopeId);
            return withBusy(async () => {
                if (!body && !file) throw new Error('Write a post or attach a file first.');
                await submitSocialPost(body, {
                    file,
                    audience: text(runtime.ui?.composerAudience || 'campus') || 'campus',
                    scopeType,
                    scopeId,
                    scopeName: scope?.name || ''
                });
                runtime.ui.composerText = '';
                runtime.ui.composerFile = null;
                renderSocialPageNow('post-submit');
            });
        }
        if (action === 'post-react') {
            const reactionType = text(trigger.getAttribute('data-reaction-type') || 'like') || 'like';
            const postId = trigger.getAttribute('data-post-id');
            return withBusy(async () => {
                await reactToPortalSocialPost(postId, reactionType);
                renderSocialPageNow('post-react');
            });
        }
        if (action === 'post-pin') {
            const postId = trigger.getAttribute('data-post-id');
            return withBusy(async () => {
                await pinPortalSocialPost(postId);
                renderSocialPageNow('post-pin');
            });
        }
        if (action === 'comment-react') {
            if (typeof reactToPortalSocialComment !== 'function') {
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Social runtime not ready.', 'danger');
                return;
            }
            const reactionKey = `${postKey(trigger.getAttribute('data-post-id'))}:${text(trigger.getAttribute('data-comment-id'))}`;
            if (pendingCommentReactions.has(reactionKey)) return;
            pendingCommentReactions.add(reactionKey);
            return withBusy(async () => {
                try {
                    await reactToPortalSocialComment(
                        trigger.getAttribute('data-post-id'),
                        trigger.getAttribute('data-comment-id'),
                        text(trigger.getAttribute('data-reaction-type') || 'like') || 'like'
                    );
                    renderSocialPageNow('comment-react');
                } finally {
                    pendingCommentReactions.delete(reactionKey);
                }
            });
        }
        if (action === 'comment-reply') {
            const postId = postKey(trigger.getAttribute('data-post-id'));
            const commentId = text(trigger.getAttribute('data-comment-id'));
            const authorName = text(trigger.getAttribute('data-author-name') || 'member');
            const runtime = state();
            runtime.ui = runtime.ui || {};
            runtime.ui.commentReplyTargetByPost = runtime.ui.commentReplyTargetByPost || {};
            runtime.ui.commentReplyTargetByPost[postId] = { commentId, authorName };
            runtime.ui.commentReplyFocusPostId = postId;
            renderSocialPageNow('comment-reply');
            return;
        }
        if (action === 'comment-reply-cancel') {
            const postId = postKey(trigger.getAttribute('data-post-id'));
            const runtime = state();
            runtime.ui = runtime.ui || {};
            if (runtime.ui.commentReplyTargetByPost) delete runtime.ui.commentReplyTargetByPost[postId];
            if (postKey(runtime.ui.commentReplyFocusPostId) === postId) delete runtime.ui.commentReplyFocusPostId;
            renderSocialPageNow('comment-reply-cancel');
            return;
        }
        if (action === 'comment-report') {
            return openDialog('comment-report', {
                postId: postKey(trigger.getAttribute('data-post-id')),
                commentId: text(trigger.getAttribute('data-comment-id'))
            });
        }
        if (action === 'post-save') return withBusy(() => toggleSavedPost(trigger.getAttribute('data-post-id')));
        if (action === 'post-delete') return openDialog('post-delete', { postId: trigger.getAttribute('data-post-id') });
        if (action === 'post-edit') {
            const post = (Array.isArray(state().feed) ? state().feed : []).find((item) => text(item.id) === text(trigger.getAttribute('data-post-id')));
            return openDialog('post-edit', { postId: trigger.getAttribute('data-post-id'), body: text(post?.body || post?.text || '') });
        }
        if (action === 'post-share') return openDialog('post-share', { postId: trigger.getAttribute('data-post-id') });
        if (action === 'post-report') return openDialog('post-report', { postId: trigger.getAttribute('data-post-id') });
        if (action === 'report-resolve') {
            const reportId = text(trigger.getAttribute('data-report-id'));
            const note = text(state().ui?.reportResolutionNotes?.[reportId] || '');
            return withBusy(async () => {
                await resolvePortalSocialReport(reportId, trigger.getAttribute('data-report-action') || 'dismiss', note);
                if (state().ui?.reportResolutionNotes) delete state().ui.reportResolutionNotes[reportId];
            });
        }
        if (action === 'page-report') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = (Array.isArray(state().social?.pages) ? state().social.pages : []).find((item) => text(item.id) === pageId);
            const ownerId = text(page?.ownerUserId || (Array.isArray(page?.adminIds) ? page.adminIds[0] : Array.isArray(page?.adminUserIds) ? page.adminUserIds[0] : ''));
            return withBusy(() => reportPortalSocialContent('page', pageId, 'Reported page content', ownerId));
        }
        if (action === 'page-wizard-open') {
            state().ui.activePageProfileId = '';
            state().ui.pageProfileEditMode = false;
            state().ui.pageWizardOpen = true;
            state().ui.pageWizardStep = Number(state().ui?.pageWizardStep || 1) || 1;
            setPanel('pages');
            return renderSocialPageNow('page-wizard-open');
        }
        if (action === 'page-wizard-close') {
            state().ui.pageWizardOpen = false;
            state().ui.pageWizardStep = 1;
            return renderSocialPageNow('page-wizard-close');
        }
        if (action === 'page-wizard-next') {
            state().ui.pageWizardStep = Math.min(5, Math.max(1, Number(state().ui?.pageWizardStep || 1) + 1));
            return renderSocialPageNow('page-wizard-next');
        }
        if (action === 'page-wizard-prev') {
            state().ui.pageWizardStep = Math.min(5, Math.max(1, Number(state().ui?.pageWizardStep || 1) - 1));
            return renderSocialPageNow('page-wizard-prev');
        }
        if (action === 'page-open-profile') {
            return withBusy(async () => {
                const pageId = text(trigger.getAttribute('data-page-id'));
                const page = (Array.isArray(state().social?.pages) ? state().social.pages : []).find((item) => text(item.id) === pageId);
                state().ui.pageWizardOpen = false;
                state().ui.pageProfileEditMode = false;
                state().ui.activePageProfileId = pageId;
                state().ui.pageProfileTab = 'all';
                state().ui.feedScopeType = 'page';
                state().ui.feedScopeId = pageId;
                state().ui.pagePostType = page?.isManager ? 'official' : 'community';
                if (typeof refreshPortalSocialFeed === 'function') await refreshPortalSocialFeed(true);
                setPanel('pages');
                renderSocialPageNow('page-open-profile');
            });
        }
        if (action === 'page-profile-back') {
            state().ui.activePageProfileId = '';
            state().ui.pageProfileEditMode = false;
            state().ui.pageWizardOpen = false;
            return renderSocialPageNow('page-profile-back');
        }
        if (action === 'page-profile-tab') {
            state().ui.pageProfileTab = text(trigger.getAttribute('data-page-profile-tab') || 'all') || 'all';
            return renderSocialPageNow('page-profile-tab');
        }
        if (action === 'page-profile-edit-toggle') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = (Array.isArray(state().social?.pages) ? state().social.pages : []).find((item) => text(item.id) === pageId);
            if (!page) return;
            state().ui.pageProfileEditMode = true;
            state().ui.pageName = text(page.name || '');
            state().ui.pageDescription = text(page.description || '');
            state().ui.pageVisibility = text(page.visibility || 'public') || 'public';
            state().ui.pageType = text(page.pageType || (page.official ? 'campus' : 'brand')) || 'brand';
            state().ui.pageCategory = text(page.category || 'Technology') || 'Technology';
            state().ui.pageTagline = text(page.tagline || '');
            state().ui.pageAbout = text(page.about || '');
            state().ui.pageWebsite = text(page.website || '');
            state().ui.pageContactEmail = text(page.contactEmail || '');
            state().ui.pageLocation = text(page.location || '');
            state().ui.pageActionLabel = text(page.actionLabel || '');
            state().ui.pageActionUrl = text(page.actionUrl || '');
            state().ui.pageAvatarUrl = text(page.avatarImage || '');
            state().ui.pageCoverUrl = text(page.coverImage || '');
            return renderSocialPageNow('page-profile-edit-toggle');
        }
        if (action === 'page-profile-edit-cancel') {
            state().ui.pageProfileEditMode = false;
            return renderSocialPageNow('page-profile-edit-cancel');
        }
        if (action === 'group-report') {
            const groupId = text(trigger.getAttribute('data-group-id'));
            const group = (Array.isArray(state().social?.groups) ? state().social.groups : []).find((item) => text(item.id) === groupId);
            const ownerId = text(group?.ownerUserId || (Array.isArray(group?.adminIds) ? group.adminIds[0] : Array.isArray(group?.managerUserIds) ? group.managerUserIds[0] : ''));
            return withBusy(() => reportPortalSocialContent('group', groupId, 'Reported group content', ownerId));
        }
        if (action === 'page-visibility-set') {
            return withBusy(() => updatePortalSocialPage(trigger.getAttribute('data-page-id'), {
                visibility: text(trigger.getAttribute('data-visibility') || 'public') || 'public'
            }));
        }
        if (action === 'group-visibility-set') {
            return withBusy(() => updatePortalSocialGroup(trigger.getAttribute('data-group-id'), {
                visibility: text(trigger.getAttribute('data-visibility') || 'public') || 'public'
            }));
        }
        if (action === 'group-member-remove') {
            return withBusy(() => removePortalSocialGroupMember(
                trigger.getAttribute('data-group-id'),
                trigger.getAttribute('data-member-id')
            ));
        }
        if (action === 'group-thread-panel-toggle') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            const panel = text(trigger.getAttribute('data-panel'));
            state().ui.groupThreadPanelByChat = state().ui.groupThreadPanelByChat || {};
            state().ui.groupThreadPanelByChat[chatId] = text(state().ui.groupThreadPanelByChat[chatId]) === panel ? '' : panel;
            return renderSocialPageNow('group-thread-panel-toggle');
        }
        if (action === 'group-thread-panel-close') {
            const chatId = text(trigger.getAttribute('data-chat-id'));
            state().ui.groupThreadPanelByChat = state().ui.groupThreadPanelByChat || {};
            state().ui.groupThreadPanelByChat[chatId] = '';
            return renderSocialPageNow('group-thread-panel-close');
        }
        if (action === 'group-thread-search-submit' || action === 'group-thread-invite-search') {
            return renderSocialPageNow(action);
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
        if (action === 'notification-read') {
            return withBusy(async () => {
                const notificationId = text(trigger.getAttribute('data-notification-id'));
                const notification = notificationItems().find((item) => text(item.id) === notificationId || text(item.key) === notificationId);
                await markPortalNotificationRead(notificationId);
                if (notification?.routeData?.chatId) {
                    setActiveChat(text(notification.routeData.chatId));
                    setPanel('messages');
                    return;
                }
                if (notification?.routeData?.groupId) {
                    await focusFeed('group', text(notification.routeData.groupId));
                    return;
                }
                const routePage = text(notification?.routePage || '');
                if (routePage && routePage !== 'social') {
                    if (typeof navigate === 'function') {
                        navigate(routePage);
                        return;
                    }
                    if (routePage.endsWith('.html')) {
                        window.location.assign(routePage);
                        return;
                    }
                    window.location.assign(`${routePage}.html`);
                    return;
                }
                renderSocialPageNow('notification-read');
            });
        }
        if (action === 'notification-mark-category-read') {
            return withBusy(async () => {
                const category = text(trigger.getAttribute('data-category')) || text(state().ui?.alertsFilter || 'all');
                const items = notificationItems();
                const toMark = category === 'all'
                    ? items.filter(n => !n.read)
                    : items.filter(n => !n.read && classifyNotificationCategory(n) === category);
                for (const n of toMark) {
                    try { markPortalNotificationRead(n.key); } catch (err) {}
                }
                renderSocialPageNow('alerts-mark-category-read');
            });
        }
        if (action === 'alerts-moderation-toggle') {
            const body = document.querySelector('[data-bind="alerts-moderation-body"]');
            const chevron = trigger.querySelector('.sn-alerts-mod-chevron');
            if (body) {
                const isOpen = body.classList.toggle('is-open');
                if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
            }
            return;
        }
        if (action === 'notification-open-chat') {
            return withBusy(async () => {
                await markPortalNotificationRead(trigger.getAttribute('data-notification-id'));
                setActiveChat(trigger.getAttribute('data-chat-id'));
                setPanel('messages');
            });
        }
        if (action === 'notification-open-group') {
            return withBusy(async () => {
                await markPortalNotificationRead(trigger.getAttribute('data-notification-id'));
                await focusFeed('group', trigger.getAttribute('data-group-id'));
            });
        }
        if (action === 'group-call-join') return withBusy(() => joinPortalGroupCall(trigger.getAttribute('data-chat-id')));
        if (action === 'group-call-leave') return withBusy(() => leavePortalGroupCall(trigger.getAttribute('data-chat-id')));
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
    }

    async function handleSubmit(event) {
        const form = event.target.closest('form[data-form]');
        if (!form || !root()?.contains(form)) return;
        event.preventDefault();
        const formType = text(form.getAttribute('data-form'));
        const runtime = state();

        if (formType === 'create-page') {
            return withBusy(async () => {
                const avatarImage = text(form.pageAvatarUrl?.value || runtime.ui?.pageAvatarUrl || '') || await readFileAsDataUrl(runtime.ui?.pageAvatarFile || null);
                const coverImage = text(form.pageCoverUrl?.value || runtime.ui?.pageCoverUrl || '') || await readFileAsDataUrl(runtime.ui?.pageCoverFile || null);
                const pageType = text(form.pageType?.value || runtime.ui?.pageType || 'brand') || 'brand';
                const payload = {
                    name: text(form.pageName?.value || runtime.ui?.pageName),
                    description: text(form.pageDescription?.value || runtime.ui?.pageDescription),
                    visibility: text(form.pageVisibility?.value || runtime.ui?.pageVisibility || 'public') || 'public',
                    pageType,
                    category: text(form.pageCategory?.value || runtime.ui?.pageCategory || 'Technology') || 'Technology',
                    tagline: text(form.pageTagline?.value || runtime.ui?.pageTagline || ''),
                    about: text(form.pageAbout?.value || runtime.ui?.pageAbout || runtime.ui?.pageDescription || ''),
                    website: text(form.pageWebsite?.value || runtime.ui?.pageWebsite || ''),
                    contactEmail: text(form.pageContactEmail?.value || runtime.ui?.pageContactEmail || ''),
                    location: text(form.pageLocation?.value || runtime.ui?.pageLocation || ''),
                    actionLabel: text(form.pageActionLabel?.value || runtime.ui?.pageActionLabel || ''),
                    actionUrl: text(form.pageActionUrl?.value || runtime.ui?.pageActionUrl || ''),
                    avatarImage,
                    coverImage,
                    official: pageType === 'campus',
                    verified: pageType === 'campus'
                };
                if (!payload.name) throw new Error('Page name is required.');
                if (!payload.category) throw new Error('Page category is required.');
                if (!payload.description && !payload.about) throw new Error('Add a description or about section for the page.');
                const createdPage = await createPortalSocialPage(payload);
                runtime.ui.pageName = '';
                runtime.ui.pageDescription = '';
                runtime.ui.pageVisibility = 'public';
                runtime.ui.pageType = 'brand';
                runtime.ui.pageCategory = 'Technology';
                runtime.ui.pageTagline = '';
                runtime.ui.pageAbout = '';
                runtime.ui.pageWebsite = '';
                runtime.ui.pageContactEmail = '';
                runtime.ui.pageLocation = '';
                runtime.ui.pageActionLabel = '';
                runtime.ui.pageActionUrl = '';
                runtime.ui.pageAvatarUrl = '';
                runtime.ui.pageCoverUrl = '';
                runtime.ui.pageAvatarFile = null;
                runtime.ui.pageCoverFile = null;
                runtime.ui.pageWizardOpen = false;
                runtime.ui.pageWizardStep = 1;
                runtime.ui.activePageProfileId = text(createdPage?.id || '');
                runtime.ui.pageProfileTab = 'all';
                runtime.ui.feedScopeType = 'page';
                runtime.ui.feedScopeId = text(createdPage?.id || '');
                runtime.ui.pagePostType = createdPage?.isManager ? 'official' : 'community';
                if (typeof refreshPortalSocialFeed === 'function' && createdPage?.id) await refreshPortalSocialFeed(true);
                renderSocialPageNow('page-created');
            });
        }

        if (formType === 'pages-search') {
            runtime.ui.pagesSearch = text(form.pagesSearch?.value || runtime.ui?.pagesSearch || '');
            renderSocialPageNow('pages-search');
            return;
        }

        if (formType === 'update-page-profile') {
            return withBusy(async () => {
                const pageId = text(form.getAttribute('data-page-id'));
                const pageType = text(form.pageType?.value || runtime.ui?.pageType || 'brand') || 'brand';
                const avatarImage = text(form.pageAvatarUrl?.value || runtime.ui?.pageAvatarUrl || '') || await readFileAsDataUrl(runtime.ui?.pageAvatarFile || null);
                const coverImage = text(form.pageCoverUrl?.value || runtime.ui?.pageCoverUrl || '') || await readFileAsDataUrl(runtime.ui?.pageCoverFile || null);
                const payload = {
                    name: text(form.pageName?.value || runtime.ui?.pageName || ''),
                    description: text(form.pageDescription?.value || runtime.ui?.pageDescription || ''),
                    visibility: text(form.pageVisibility?.value || runtime.ui?.pageVisibility || 'public') || 'public',
                    pageType,
                    category: text(form.pageCategory?.value || runtime.ui?.pageCategory || ''),
                    tagline: text(form.pageTagline?.value || runtime.ui?.pageTagline || ''),
                    about: text(form.pageAbout?.value || runtime.ui?.pageAbout || ''),
                    website: text(form.pageWebsite?.value || runtime.ui?.pageWebsite || ''),
                    contactEmail: text(form.pageContactEmail?.value || runtime.ui?.pageContactEmail || ''),
                    location: text(form.pageLocation?.value || runtime.ui?.pageLocation || ''),
                    actionLabel: text(form.pageActionLabel?.value || runtime.ui?.pageActionLabel || ''),
                    actionUrl: text(form.pageActionUrl?.value || runtime.ui?.pageActionUrl || ''),
                    avatarImage,
                    coverImage,
                    official: pageType === 'campus',
                    verified: pageType === 'campus'
                };
                await updatePortalSocialPage(pageId, payload);
                runtime.ui.pageProfileEditMode = false;
                runtime.ui.pageAvatarFile = null;
                runtime.ui.pageCoverFile = null;
                renderSocialPageNow('page-profile-updated');
            });
        }

        if (formType === 'page-profile-post') {
            return withBusy(async () => {
                const pageId = text(form.getAttribute('data-page-id'));
                const page = (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).find((item) => text(item.id) === pageId);
                const body = text(form.pagePostBody?.value || runtime.ui?.pagePostBody || '');
                const file = runtime.ui?.pagePostFile || null;
                if (!body && !file) throw new Error('Write a post or attach a file first.');
                if (typeof submitSocialPost !== 'function') throw new Error('Page post publishing is unavailable.');
                await submitSocialPost(body, {
                    audience: 'page',
                    scopeType: 'page',
                    scopeId: pageId,
                    scopeName: text(page?.name || 'Page'),
                    file,
                    postType: text(form.pagePostType?.value || runtime.ui?.pagePostType || (page?.isManager ? 'official' : 'community')) || 'community'
                });
                runtime.ui.pagePostBody = '';
                runtime.ui.pagePostFile = null;
                if (typeof refreshPortalSocialFeed === 'function') await refreshPortalSocialFeed(true);
                renderSocialPageNow('page-profile-post');
            });
        }

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

        if (formType === 'create-event') {
            return withBusy(async () => {
                const scopeRaw = text(form.eventScope?.value || `${text(runtime.ui?.activeScopeType || 'profile')}:${text(runtime.ui?.activeScopeId || currentUserId())}`);
                const [scopeType, scopeId] = scopeRaw.split(':');
                const scope = eventScopeOptions().find((item) => item.type === text(scopeType) && item.id === text(scopeId));
                const imageUrl = runtime.ui?.eventImageFile ? await readFileAsDataUrl(runtime.ui.eventImageFile) : '';
                const payload = {
                    title: text(form.eventTitle?.value || runtime.ui?.eventTitle),
                    description: text(form.eventDescription?.value || runtime.ui?.eventDescription),
                    startsAt: text(form.eventStartsAt?.value || runtime.ui?.eventStartsAt),
                    endsAt: text(form.eventEndsAt?.value || runtime.ui?.eventEndsAt),
                    location: text(form.eventLocation?.value || runtime.ui?.eventLocation),
                    onlineLink: text(form.eventOnlineLink?.value || runtime.ui?.eventOnlineLink),
                    isOnline: Boolean(form.eventIsOnline?.checked || runtime.ui?.eventIsOnline),
                    joinMode: text(form.eventJoinMode?.value || runtime.ui?.eventJoinMode || 'open') || 'open',
                    category: text(form.eventCategory?.value || runtime.ui?.eventCategory || 'social') || 'social',
                    maxSeats: text(form.eventMaxSeats?.value || runtime.ui?.eventMaxSeats || ''),
                    isRecurring: Boolean(form.eventRecurring?.checked || runtime.ui?.eventRecurring),
                    imageUrl,
                    isOfficial: text(form.eventIsOfficial?.value || '') === 'true',
                    scopeType: text(scopeType || 'profile') || 'profile',
                    scopeId: text(scopeId || currentUserId()) || currentUserId(),
                    scopeName: scope?.name || ''
                };
                if (!payload.title || !payload.startsAt) throw new Error('Event title and start time are required.');
                await createPortalSocialEvent(payload);
                runtime.ui.eventTitle = '';
                runtime.ui.eventDescription = '';
                runtime.ui.eventStartsAt = '';
                runtime.ui.eventEndsAt = '';
                runtime.ui.eventLocation = '';
                runtime.ui.eventOnlineLink = '';
                runtime.ui.eventIsOnline = false;
                runtime.ui.eventJoinMode = 'open';
                runtime.ui.eventCategory = 'social';
                runtime.ui.eventScope = '';
                runtime.ui.eventMaxSeats = '';
                runtime.ui.eventRecurring = false;
                runtime.ui.eventImageFile = null;
                runtime.ui.eventsComposerSection = '';
                renderSocialPageNow('event-created');
            });
        }

        if (formType === 'lost-found-item') {
            return withBusy(async () => {
                const editId = text(runtime.ui?.lostFoundEditId || '');
                const currentItems = lostFoundItems().map((entry) => normalizeLostFoundItem(entry));
                const existing = editId ? currentItems.find((entry) => text(entry.id) === editId) || null : null;
                const actorId = currentUserId();
                const actorRole = text(currentUser()?.role || '');
                if (existing && text(existing.authorUserId) !== actorId && !['admin', 'student_service'].includes(actorRole)) {
                    throw new Error('You can only edit your own listing.');
                }
                const scope = text(form.lostFoundScope?.value || runtime.ui?.lostFoundScope || 'current') || 'current';
                const imageUrl = runtime.ui?.lostFoundFile ? await readFileAsDataUrl(runtime.ui.lostFoundFile) : text(existing?.imageUrl || '');
                const nextStatus = text(form.lostFoundStatus?.value || runtime.ui?.lostFoundStatus || existing?.status || 'open') || 'open';
                const nextItem = normalizeLostFoundItem({
                    ...existing,
                    id: editId || makeId('lf'),
                    kind: text(form.lostFoundKind?.value || runtime.ui?.lostFoundKind || existing?.kind || 'lost') === 'found' ? 'found' : 'lost',
                    status: nextStatus,
                    title: text(form.lostFoundTitle?.value || runtime.ui?.lostFoundTitle || existing?.title || ''),
                    description: text(form.lostFoundDescription?.value || runtime.ui?.lostFoundDescription || existing?.description || ''),
                    category: text(form.lostFoundCategory?.value || runtime.ui?.lostFoundCategory || existing?.category || 'General'),
                    locationText: text(form.lostFoundLocation?.value || runtime.ui?.lostFoundLocation || existing?.locationText || ''),
                    facultyCode: scope === 'all' ? 'all' : currentFacultyCode(),
                    campusScope: scope === 'all' ? 'campus' : 'faculty',
                    eventDate: text(form.lostFoundDate?.value || runtime.ui?.lostFoundDate || existing?.eventDate || ''),
                    imageUrl,
                    authorUserId: text(existing?.authorUserId || actorId),
                    authorName: text(existing?.authorName || displayName(currentUser())),
                    createdAt: text(existing?.createdAt || new Date().toISOString()),
                    updatedAt: new Date().toISOString(),
                    resolvedAt: nextStatus === 'resolved' ? text(existing?.resolvedAt || new Date().toISOString()) : '',
                    resolvedByUserId: nextStatus === 'resolved' ? text(existing?.resolvedByUserId || actorId) : '',
                    contactChatId: text(existing?.contactChatId || ''),
                    notes: text(existing?.notes || '')
                });
                if (!nextItem.title) throw new Error('Listing title is required.');
                const nextItems = editId
                    ? currentItems.map((entry) => text(entry.id) === editId ? nextItem : entry)
                    : [nextItem, ...currentItems];
                await saveLostFoundItems(nextItems, editId ? 'lost-found-updated' : 'lost-found-created');
                resetLostFoundDraft();
                renderSocialPageNow('lost-found-save');
            });
        }

        if (formType === 'comment') {
            return withBusy(async () => {
                const postId = postKey(form.getAttribute('data-post-id'));
                const commentInput = form.querySelector('[name="commentBody"]');
                if (commentInput) syncCommentDraftFromTarget(commentInput);
                runtime.ui.commentDraftByPost = runtime.ui.commentDraftByPost || {};
                const replyTarget = runtime.ui?.commentReplyTargetByPost?.[postId] || null;
                const bodySource = event.target?.name === 'commentBody' ? event.target : commentInput;
                const body = text(bodySource?.value || runtime.ui.commentDraftByPost?.[postId]);
                if (!body) throw new Error('Comment body is required.');
                await commentOnPortalSocialPost(postId, body, {
                    parentCommentId: replyTarget?.commentId || '',
                    replyToCommentId: replyTarget?.commentId || ''
                });
                runtime.ui.commentDraftByPost[postId] = '';
                if (runtime.ui.commentReplyTargetByPost) delete runtime.ui.commentReplyTargetByPost[postId];
                renderSocialPageNow('comment-created');
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

        if (formType === 'create-project') {
            const projectTitleValue = text(form.projectName?.value || runtime.ui?.projectName);
            if (!projectTitleValue) {
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Add a project title before creating the workspace.', 'danger');
                form.projectName?.focus?.();
                return;
            }
            return withBusy(async () => {
                const facultyCodes = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
                    ? runtime.ui.projectFacultyCodes
                    : [currentFacultyCode()];
                const skillTags = text(form.projectSkillTags?.value || runtime.ui?.projectSkillTags || '')
                    .split(',')
                    .map((item) => text(item))
                    .filter(Boolean);
                const hashtags = text(form.projectHashtags?.value || runtime.ui?.projectHashtags || '')
                    .split(',')
                    .map((item) => text(item).replace(/^#/, ''))
                    .filter(Boolean);
                const project = await createPortalSocialProject({
                    title: text(form.projectName?.value || runtime.ui?.projectName),
                    name: text(form.projectName?.value || runtime.ui?.projectName),
                    summary: text(form.projectSummary?.value || runtime.ui?.projectSummary),
                    description: text(form.projectDescription?.value || runtime.ui?.projectDescription),
                    status: text(form.projectStatus?.value || runtime.ui?.projectStatus || 'draft') || 'draft',
                    visibility: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') === 'all_logged_in' ? 'public' : 'private',
                    visibilityMode: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') || 'all_logged_in',
                    courseTag: text(form.projectCourseTag?.value || runtime.ui?.projectCourseTag),
                    facultyCodes,
                    facultyTags: facultyCodes,
                    skillTags,
                    hashtags,
                    externalLinks: parsePortfolioLinksInput(form.projectExternalLinks?.value || runtime.ui?.projectExternalLinks || ''),
                    visibleRoles: parsePortfolioTextList(form.projectVisibleRolesRaw?.value || (runtime.ui?.projectVisibleRoles || []).join(', ')).map((item) => item.toLowerCase()),
                    visibleFacultyCodes: parsePortfolioTextList(form.projectVisibleFacultyCodesRaw?.value || (runtime.ui?.projectVisibleFacultyCodes || []).join(', ')),
                    visibleUserIds: parsePortfolioTextList(form.projectVisibleUserIds?.value || runtime.ui?.projectVisibleUserIds || ''),
                    hiddenUserIds: parsePortfolioTextList(form.projectHiddenUserIds?.value || runtime.ui?.projectHiddenUserIds || ''),
                    mediaItems: Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [],
                    file: runtime.ui?.projectMediaFile || null,
                    advisorUserId: text(form.projectAdvisorUserId?.value || runtime.ui?.projectAdvisorUserId),
                    inviteeIds: Array.isArray(runtime.ui?.projectInviteSelectedIds) ? runtime.ui.projectInviteSelectedIds : [],
                    recommendedTeamSize: Number(form.projectRecommendedTeamSize?.value || runtime.ui?.projectRecommendedTeamSize || 4),
                    minTeamSize: Number(form.projectMinTeamSize?.value || runtime.ui?.projectMinTeamSize || 4)
                });
                resetPortfolioEditor();
                runtime.ui.projectInviteSearch = '';
                runtime.ui.projectInviteFaculty = 'all';
                runtime.ui.projectInviteSelectedIds = [];
                runtime.ui.projectRecommendedTeamSize = 4;
                runtime.ui.projectMinTeamSize = 4;
                runtime.ui.activeProjectId = text(project?.id || '');
                runtime.ui.projectTab = 'overview';
                renderSocialPageNow('project-created');
            });
        }

        if (formType === 'project-settings') {
            return withBusy(async () => {
                const projectId = text(form.getAttribute('data-project-id'));
                await updatePortalSocialProject(projectId, {
                    title: text(form.projectName?.value || runtime.ui?.projectName),
                    name: text(form.projectName?.value || runtime.ui?.projectName),
                    summary: text(form.projectSummary?.value || ''),
                    description: text(form.projectDescription?.value || ''),
                    status: text(form.projectStatus?.value || 'draft') || 'draft',
                    visibility: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') === 'all_logged_in' ? 'public' : 'private',
                    visibilityMode: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') || 'all_logged_in',
                    courseTag: text(form.projectCourseTag?.value || runtime.ui?.projectCourseTag || ''),
                    facultyCodes: Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()],
                    facultyTags: Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()],
                    skillTags: text(form.projectSkillTags?.value || runtime.ui?.projectSkillTags || '').split(',').map((item) => text(item)).filter(Boolean),
                    hashtags: text(form.projectHashtags?.value || runtime.ui?.projectHashtags || '').split(',').map((item) => text(item).replace(/^#/, '')).filter(Boolean),
                    externalLinks: parsePortfolioLinksInput(form.projectExternalLinks?.value || runtime.ui?.projectExternalLinks || ''),
                    visibleRoles: parsePortfolioTextList(form.projectVisibleRolesRaw?.value || (runtime.ui?.projectVisibleRoles || []).join(', ')).map((item) => item.toLowerCase()),
                    visibleFacultyCodes: parsePortfolioTextList(form.projectVisibleFacultyCodesRaw?.value || (runtime.ui?.projectVisibleFacultyCodes || []).join(', ')),
                    visibleUserIds: parsePortfolioTextList(form.projectVisibleUserIds?.value || runtime.ui?.projectVisibleUserIds || ''),
                    hiddenUserIds: parsePortfolioTextList(form.projectHiddenUserIds?.value || runtime.ui?.projectHiddenUserIds || ''),
                    mediaItems: Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [],
                    file: runtime.ui?.projectMediaFile || null
                });
                resetPortfolioEditor();
                renderSocialPageNow('project-settings-saved');
            });
        }

        if (formType === 'project-task-create') {
            return withBusy(async () => {
                await createPortalSocialProjectTask(text(form.getAttribute('data-project-id')), {
                    title: text(form.projectTaskTitle?.value || runtime.ui?.projectTaskTitle),
                    description: text(form.projectTaskDescription?.value || runtime.ui?.projectTaskDescription),
                    assigneeUserId: text(form.projectTaskAssigneeId?.value || runtime.ui?.projectTaskAssigneeId),
                    dueAt: text(form.projectTaskDueAt?.value || runtime.ui?.projectTaskDueAt),
                    priority: text(form.projectTaskPriority?.value || runtime.ui?.projectTaskPriority || 'medium') || 'medium',
                    status: text(form.projectTaskStatus?.value || 'backlog') || 'backlog'
                });
                runtime.ui.projectTaskTitle = '';
                runtime.ui.projectTaskDescription = '';
                runtime.ui.projectTaskAssigneeId = '';
                runtime.ui.projectTaskDueAt = '';
                runtime.ui.projectTaskPriority = 'medium';
                renderSocialPageNow('project-task-created');
            });
        }

        if (formType === 'project-milestone-create') {
            return withBusy(async () => {
                await createPortalSocialProjectMilestone(text(form.getAttribute('data-project-id')), {
                    title: text(form.projectMilestoneTitle?.value || runtime.ui?.projectMilestoneTitle),
                    description: text(form.projectMilestoneDescription?.value || runtime.ui?.projectMilestoneDescription),
                    dueAt: text(form.projectMilestoneDueAt?.value || runtime.ui?.projectMilestoneDueAt)
                });
                runtime.ui.projectMilestoneTitle = '';
                runtime.ui.projectMilestoneDescription = '';
                runtime.ui.projectMilestoneDueAt = '';
                renderSocialPageNow('project-milestone-created');
            });
        }

        if (formType === 'project-deliverable-create') {
            return withBusy(async () => {
                await createPortalSocialProjectDeliverable(text(form.getAttribute('data-project-id')), {
                    title: text(form.projectDeliverableTitle?.value || runtime.ui?.projectDeliverableTitle),
                    description: text(form.projectDeliverableDescription?.value || runtime.ui?.projectDeliverableDescription),
                    versionLabel: text(form.projectDeliverableVersion?.value || runtime.ui?.projectDeliverableVersion),
                    file: runtime.ui?.projectDeliverableFile || null
                });
                runtime.ui.projectDeliverableTitle = '';
                runtime.ui.projectDeliverableDescription = '';
                runtime.ui.projectDeliverableVersion = '';
                runtime.ui.projectDeliverableFile = null;
                renderSocialPageNow('project-deliverable-created');
            });
        }

        if (formType === 'project-checkin-create') {
            return withBusy(async () => {
                await createPortalSocialProjectCheckin(text(form.getAttribute('data-project-id')), {
                    whatDone: text(form.projectCheckinDone?.value || runtime.ui?.projectCheckinDone),
                    blockers: text(form.projectCheckinBlockers?.value || runtime.ui?.projectCheckinBlockers),
                    nextSteps: text(form.projectCheckinNextSteps?.value || runtime.ui?.projectCheckinNextSteps)
                });
                runtime.ui.projectCheckinDone = '';
                runtime.ui.projectCheckinBlockers = '';
                runtime.ui.projectCheckinNextSteps = '';
                renderSocialPageNow('project-checkin-created');
            });
        }

        if (formType === 'project-meeting-create') {
            return withBusy(async () => {
                const projectId = text(form.getAttribute('data-project-id'));
                const project = (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).find((entry) => text(entry?.id) === projectId);
                if (!project?.groupId) throw new Error('Project group scope is unavailable.');
                await createPortalSocialEvent({
                    title: text(form.meetingTitle?.value || ''),
                    description: text(form.meetingDescription?.value || ''),
                    startsAt: text(form.meetingStartsAt?.value || ''),
                    endsAt: text(form.meetingEndsAt?.value || form.meetingStartsAt?.value || ''),
                    location: text(form.meetingLocation?.value || ''),
                    scopeType: 'group',
                    scopeId: text(project.groupId),
                    hostGroupId: text(project.groupId),
                    visibility: 'private',
                    joinMode: 'member-required',
                    category: 'academic',
                    projectId
                });
                renderSocialPageNow('project-meeting-created');
            });
        }

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

        if (formType === 'edit-profile') {
            return withBusy(async () => {
                const payload = {
                    displayName: text(form.profileDisplayName?.value || runtime.ui?.profileDisplayName),
                    bio: text(form.profileBio?.value || runtime.ui?.profileBio),
                    location: text(form.profileLocation?.value || runtime.ui?.profileLocation),
                    website: text(form.profileWebsite?.value || runtime.ui?.profileWebsite),
                    interests: text(form.profileInterests?.value || runtime.ui?.profileInterests),
                    availability: text(form.profileAvailability?.value || runtime.ui?.profileAvailability),
                    officeHours: text(form.profileOfficeHours?.value || runtime.ui?.profileOfficeHours),
                    birthday: text(form.profileBirthday?.value || runtime.ui?.profileBirthday),
                    coverImage: text(runtime.ui?.profileCoverImage || profileCover(profileAccount(currentUserId()))),
                    visibility: text(form.profileVisibility?.value || runtime.ui?.profileVisibility || currentSocialProfileSettings().visibility || 'campus') || 'campus',
                    defaultAudience: text(form.profileDefaultAudience?.value || runtime.ui?.profileDefaultAudience || currentSocialProfileSettings().defaultAudience || 'campus') || 'campus',
                    digestFrequency: text(form.profileDigestFrequency?.value || runtime.ui?.profileDigestFrequency || currentSocialProfileSettings().digestFrequency || 'daily') || 'daily',
                    eventReminderLeadHours: Number(form.profileEventReminderLeadHours?.value || runtime.ui?.profileEventReminderLeadHours || currentSocialProfileSettings().eventReminderLeadHours || 24)
                };
                await updatePortalSocialProfile(payload);
                runtime.ui.editProfileMode = false;
                renderSocialPageNow('profile-saved');
            });
        }

        if (formType === 'add-story') {
            return withBusy(async () => {
                const mediaUrl = text(form.storyMediaUrl?.value || '') || await readFileAsDataUrl(runtime.ui?.storyFile || null);
                const caption = text(form.storyCaption?.value || '');
                if (!mediaUrl) throw new Error('Please provide an image URL.');
                await submitPortalStory({ mediaUrl, caption });
                form.storyMediaUrl.value = '';
                form.storyCaption.value = '';
                runtime.ui.storyFile = null;
                runtime.ui.storyMediaUrl = '';
                runtime.ui.storyCaption = '';
                renderSocialPageNow('story-created');
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

        if (formType === 'dialog-post-edit') {
            return withBusy(async () => {
                await updatePortalSocialPost(text(form.postId?.value), text(form.dialogBody?.value));
                closeDialog();
            });
        }

        if (formType === 'dialog-post-share') {
            return withBusy(async () => {
                await sharePortalSocialPost(text(form.postId?.value), text(form.dialogNote?.value));
                closeDialog();
            });
        }

        if (formType === 'dialog-post-report') {
            return withBusy(async () => {
                await reportSocialPost(text(form.postId?.value), text(form.dialogReason?.value));
                closeDialog();
            });
        }

        if (formType === 'dialog-comment-report') {
            return withBusy(async () => {
                await reportPortalSocialContent(
                    'comment',
                    text(form.commentId?.value),
                    text(form.dialogReason?.value),
                    text(form.targetOwnerId?.value)
                );
                closeDialog();
                renderSocialPageNow('comment-report');
            });
        }

        if (formType === 'dialog-post-delete') {
            return withBusy(async () => {
                await deletePortalSocialPost(text(form.postId?.value));
                closeDialog();
            });
        }

        if (formType === 'dialog-group-leave') {
            return withBusy(async () => {
                const confirmLeave = form.elements?.namedItem ? form.elements.namedItem('confirmGroupLeave') : null;
                if (!confirmLeave || !confirmLeave.checked) throw new Error('Confirm that you want to leave the group.');
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

        if (formType === 'dialog-project-leave') {
            return withBusy(async () => {
                const confirmLeave = form.elements?.namedItem ? form.elements.namedItem('confirmProjectLeave') : null;
                if (!confirmLeave || !confirmLeave.checked) throw new Error('Confirm that you want to leave the workspace.');
                const projectId = text(form.projectId?.value);
                const projectChatId = text(form.projectChatId?.value);
                await setPortalSocialProjectMembership(projectId, 'leave');
                if (text(state().ui?.activeChatId || '') === projectChatId) {
                    state().ui.activeChatId = '';
                    setPanel('workspace');
                }
                if (text(state().ui?.activeProjectId || '') === projectId) {
                    state().ui.activeProjectId = '';
                    state().ui.projectTab = 'overview';
                }
                closeDialog();
                renderSocialPageNow('project-left');
            });
        }

        if (formType === 'dialog-event-delete') {
            return withBusy(async () => {
                await deletePortalSocialEvent(text(form.eventId?.value));
                closeDialog();
            });
        }

        if (formType === 'dialog-message-delete') {
            return withBusy(async () => {
                if (!form.confirmMessageDelete?.checked) throw new Error('Confirm message removal first.');
                await deletePortalChatMessage(text(form.chatId?.value), text(form.messageId?.value));
                closeDialog();
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

        if (formType === 'dialog-profile-cover') {
            return withBusy(async () => {
                const coverImage = text(form.coverImageUrl?.value || '') || await readFileAsDataUrl(runtime.ui?.coverImageFile || null);
                if (!coverImage) throw new Error('Provide an image URL or upload a cover image first.');
                await updatePortalSocialProfile({ coverImage });
                runtime.ui.coverImageFile = null;
                runtime.ui.profileCoverImage = coverImage;
                closeDialog();
            });
        }
    }

    function handleInput(event) {
        const runtime = state();
        const target = event.target;
        if (!target || !root()?.contains(target)) return;

        if (target.matches('[data-bind="composer-text"]')) runtime.ui.composerText = target.value;
        if (target.matches('[data-bind="directory-search"]')) {
            runtime.ui.directorySearch = target.value;
            queueDirectoryRefresh();
        }
        if (target.matches('[data-bind="pages-search"]')) {
            runtime.ui.pagesSearch = target.value;
            renderSocialPageNow('pages-search');
        }
        if (target.matches('[data-bind="group-thread-search"]')) {
            runtime.ui.groupThreadSearchByChat = runtime.ui.groupThreadSearchByChat || {};
            runtime.ui.groupThreadSearchByChat[text(target.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('[data-bind="group-thread-invite-search"]')) {
            runtime.ui.groupThreadInviteSearchByChat = runtime.ui.groupThreadInviteSearchByChat || {};
            runtime.ui.groupThreadInviteSearchByChat[text(target.getAttribute('data-chat-id'))] = target.value;
        }
        if (target.matches('form[data-form="create-project"] [name="projectName"], form[data-form="project-settings"] [name="projectName"]')) runtime.ui.projectName = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectSummary"], form[data-form="project-settings"] [name="projectSummary"]')) runtime.ui.projectSummary = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectDescription"], form[data-form="project-settings"] [name="projectDescription"]')) runtime.ui.projectDescription = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectStatus"], form[data-form="project-settings"] [name="projectStatus"]')) runtime.ui.projectStatus = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectVisibility"], form[data-form="project-settings"] [name="projectVisibility"]')) runtime.ui.projectVisibility = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectCourseTag"], form[data-form="project-settings"] [name="projectCourseTag"]')) runtime.ui.projectCourseTag = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectSkillTags"], form[data-form="project-settings"] [name="projectSkillTags"]')) runtime.ui.projectSkillTags = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectHashtags"], form[data-form="project-settings"] [name="projectHashtags"]')) runtime.ui.projectHashtags = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectExternalLinks"], form[data-form="project-settings"] [name="projectExternalLinks"]')) runtime.ui.projectExternalLinks = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectVisibleRolesRaw"], form[data-form="project-settings"] [name="projectVisibleRolesRaw"]')) runtime.ui.projectVisibleRoles = parsePortfolioTextList(target.value).map((item) => item.toLowerCase());
        if (target.matches('form[data-form="create-project"] [name="projectVisibleFacultyCodesRaw"], form[data-form="project-settings"] [name="projectVisibleFacultyCodesRaw"]')) runtime.ui.projectVisibleFacultyCodes = parsePortfolioTextList(target.value);
        if (target.matches('form[data-form="create-project"] [name="projectVisibleUserIds"], form[data-form="project-settings"] [name="projectVisibleUserIds"]')) runtime.ui.projectVisibleUserIds = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectHiddenUserIds"], form[data-form="project-settings"] [name="projectHiddenUserIds"]')) runtime.ui.projectHiddenUserIds = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectAdvisorUserId"]')) runtime.ui.projectAdvisorUserId = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectInviteSearch"]') || target.matches('[name="projectInviteSearch"]')) runtime.ui.projectInviteSearch = target.value;
        if (target.matches('[name="projectDiscoverSearch"]')) runtime.ui.projectDiscoverSearch = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectRecommendedTeamSize"]')) runtime.ui.projectRecommendedTeamSize = target.value;
        if (target.matches('form[data-form="create-project"] [name="projectMinTeamSize"]')) runtime.ui.projectMinTeamSize = target.value;
        if (target.matches('form[data-form="project-task-create"] [name="projectTaskTitle"]')) runtime.ui.projectTaskTitle = target.value;
        if (target.matches('form[data-form="project-task-create"] [name="projectTaskDescription"]')) runtime.ui.projectTaskDescription = target.value;
        if (target.matches('form[data-form="project-task-create"] [name="projectTaskAssigneeId"]')) runtime.ui.projectTaskAssigneeId = target.value;
        if (target.matches('form[data-form="project-task-create"] [name="projectTaskDueAt"]')) runtime.ui.projectTaskDueAt = target.value;
        if (target.matches('form[data-form="project-task-create"] [name="projectTaskPriority"]')) runtime.ui.projectTaskPriority = target.value;
        if (target.matches('[name="projectTaskSearch"]')) { runtime.ui.projectTaskSearch = target.value; renderSocialPageNow('project-task-search'); }
        if (target.matches('[name="projectTaskFilterPriority"]')) { runtime.ui.projectTaskFilterPriority = target.value; renderSocialPageNow('project-task-filter'); }
        if (target.matches('[name="projectTaskFilterAssignee"]')) { runtime.ui.projectTaskFilterAssignee = target.value; renderSocialPageNow('project-task-filter'); }
        if (target.matches('form[data-form="project-milestone-create"] [name="projectMilestoneTitle"]')) runtime.ui.projectMilestoneTitle = target.value;
        if (target.matches('form[data-form="project-milestone-create"] [name="projectMilestoneDescription"]')) runtime.ui.projectMilestoneDescription = target.value;
        if (target.matches('form[data-form="project-milestone-create"] [name="projectMilestoneDueAt"]')) runtime.ui.projectMilestoneDueAt = target.value;
        if (target.matches('form[data-form="project-deliverable-create"] [name="projectDeliverableTitle"]')) runtime.ui.projectDeliverableTitle = target.value;
        if (target.matches('form[data-form="project-deliverable-create"] [name="projectDeliverableDescription"]')) runtime.ui.projectDeliverableDescription = target.value;
        if (target.matches('form[data-form="project-deliverable-create"] [name="projectDeliverableVersion"]')) runtime.ui.projectDeliverableVersion = target.value;
        if (target.matches('form[data-form="project-checkin-create"] [name="projectCheckinDone"]')) runtime.ui.projectCheckinDone = target.value;
        if (target.matches('form[data-form="project-checkin-create"] [name="projectCheckinBlockers"]')) runtime.ui.projectCheckinBlockers = target.value;
        if (target.matches('form[data-form="project-checkin-create"] [name="projectCheckinNextSteps"]')) runtime.ui.projectCheckinNextSteps = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageName"]')) runtime.ui.pageName = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageDescription"]')) runtime.ui.pageDescription = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageCategory"]')) runtime.ui.pageCategory = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageType"]')) runtime.ui.pageType = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageTagline"]')) runtime.ui.pageTagline = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageAbout"]')) runtime.ui.pageAbout = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageWebsite"]')) runtime.ui.pageWebsite = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageContactEmail"]')) runtime.ui.pageContactEmail = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageLocation"]')) runtime.ui.pageLocation = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageActionLabel"]')) runtime.ui.pageActionLabel = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageActionUrl"]')) runtime.ui.pageActionUrl = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageAvatarUrl"]')) runtime.ui.pageAvatarUrl = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageCoverUrl"]')) runtime.ui.pageCoverUrl = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageName"]')) runtime.ui.pageName = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageDescription"]')) runtime.ui.pageDescription = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageCategory"]')) runtime.ui.pageCategory = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageType"]')) runtime.ui.pageType = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageTagline"]')) runtime.ui.pageTagline = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageAbout"]')) runtime.ui.pageAbout = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageWebsite"]')) runtime.ui.pageWebsite = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageContactEmail"]')) runtime.ui.pageContactEmail = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageLocation"]')) runtime.ui.pageLocation = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageActionLabel"]')) runtime.ui.pageActionLabel = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageActionUrl"]')) runtime.ui.pageActionUrl = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageAvatarUrl"]')) runtime.ui.pageAvatarUrl = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageCoverUrl"]')) runtime.ui.pageCoverUrl = target.value;
        if (target.matches('form[data-form="page-profile-post"] [name="pagePostBody"]')) runtime.ui.pagePostBody = target.value;
        if (target.matches('form[data-form="page-profile-post"] [name="pagePostType"]')) runtime.ui.pagePostType = target.value;
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
        if (target.matches('form[data-form="create-event"] [name="eventTitle"]')) runtime.ui.eventTitle = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventDescription"]')) runtime.ui.eventDescription = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventStartsAt"]')) runtime.ui.eventStartsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventEndsAt"]')) runtime.ui.eventEndsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventLocation"]')) runtime.ui.eventLocation = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventOnlineLink"]')) runtime.ui.eventOnlineLink = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventCategory"]')) runtime.ui.eventCategory = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventMaxSeats"]')) runtime.ui.eventMaxSeats = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupMaxMembers"]')) runtime.ui.groupMaxMembers = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileDisplayName"]')) runtime.ui.profileDisplayName = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileBio"]')) runtime.ui.profileBio = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileLocation"]')) runtime.ui.profileLocation = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileWebsite"]')) runtime.ui.profileWebsite = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileBirthday"]')) runtime.ui.profileBirthday = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileInterests"]')) runtime.ui.profileInterests = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileAvailability"]')) runtime.ui.profileAvailability = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileOfficeHours"]')) runtime.ui.profileOfficeHours = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileVisibility"]')) runtime.ui.profileVisibility = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileDefaultAudience"]')) runtime.ui.profileDefaultAudience = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileDigestFrequency"]')) runtime.ui.profileDigestFrequency = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileEventReminderLeadHours"]')) runtime.ui.profileEventReminderLeadHours = target.value;
        if (target.matches('[data-bind="report-resolution-note"]')) {
            runtime.ui.reportResolutionNotes = runtime.ui.reportResolutionNotes || {};
            runtime.ui.reportResolutionNotes[text(target.getAttribute('data-report-id'))] = target.value;
        }
        if (target.matches('form[data-form="create-group"] [name="groupMemberSearch"]')) runtime.ui.groupInviteSearch = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupName"]')) runtime.ui.groupName = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupDescription"]')) runtime.ui.groupDescription = target.value;
        if (target.matches('form[data-form="create-group"] [name="groupMaxMembers"]')) runtime.ui.groupMaxMembers = target.value;
        if (target.matches('input[name="lostFoundSearch"]')) runtime.ui.lostFoundSearch = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundTitle"]')) runtime.ui.lostFoundTitle = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundDescription"]')) runtime.ui.lostFoundDescription = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundCategory"]')) runtime.ui.lostFoundCategory = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundLocation"]')) runtime.ui.lostFoundLocation = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundDate"]')) runtime.ui.lostFoundDate = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundKind"]')) runtime.ui.lostFoundKind = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundStatus"]')) runtime.ui.lostFoundStatus = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundScope"]')) runtime.ui.lostFoundScope = target.value;
        if (
            target.matches('input[name="lostFoundSearch"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundKind"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundStatus"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundScope"]')
        ) {
            renderSocialPageNow('lost-found-input');
            return;
        }
        if (target.matches('form[data-form="create-event"] [name="eventTitle"]')) runtime.ui.eventTitle = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventDescription"]')) runtime.ui.eventDescription = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventStartsAt"]')) runtime.ui.eventStartsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventEndsAt"]')) runtime.ui.eventEndsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventLocation"]')) runtime.ui.eventLocation = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventOnlineLink"]')) runtime.ui.eventOnlineLink = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventMaxSeats"]')) runtime.ui.eventMaxSeats = target.value;
        if (target.matches('form[data-form="add-story"] [name="storyCaption"]')) runtime.ui.storyCaption = target.value;
        if (target.matches('form[data-form="add-story"] [name="storyMediaUrl"]')) runtime.ui.storyMediaUrl = target.value;

        syncCommentDraftFromTarget(target);

        const messageForm = target.closest('form[data-form="send-message"]');
        if (messageForm && target.name === 'messageBody') {
            runtime.ui.messageDraftByChat = runtime.ui.messageDraftByChat || {};
            runtime.ui.messageDraftByChat[text(messageForm.getAttribute('data-chat-id'))] = target.value;
        }
    }

    function handleChange(event) {
        const runtime = state();
        const target = event.target;
        if (!target || !root()?.contains(target)) return;

        if (target.matches('[data-bind="composer-scope"]')) {
            const [scopeType, scopeId] = text(target.value).split(':');
            runtime.ui.activeScopeType = text(scopeType || 'profile') || 'profile';
            runtime.ui.activeScopeId = text(scopeId || currentUserId()) || currentUserId();
        }
        if (target.matches('[data-bind="composer-audience"]')) runtime.ui.composerAudience = text(target.value || 'campus') || 'campus';
        if (target.matches('[data-bind="feed-scope"]')) {
            const [scopeType, scopeId] = text(target.value).split(':');
            withBusy(() => focusFeed(scopeType, scopeId));
            return;
        }
        if (target.matches('[data-bind="directory-role"]')) {
            runtime.ui.directoryRole = text(target.value || 'all') || 'all';
            queueDirectoryRefresh();
        }
        if (target.matches('[data-bind="group-thread-invite-faculty"]')) {
            runtime.ui.groupThreadInviteFacultyByChat = runtime.ui.groupThreadInviteFacultyByChat || {};
            runtime.ui.groupThreadInviteFacultyByChat[text(target.getAttribute('data-chat-id'))] = text(target.value || 'all') || 'all';
            renderSocialPageNow('group-thread-invite-faculty');
            return;
        }
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundScope"]')) {
            runtime.ui.lostFoundScope = text(target.value || 'current') || 'current';
            renderSocialPageNow('lost-found-scope');
            return;
        }
        if (target.matches('[data-bind="group-thread-notify"]')) {
            setGroupNotificationPreference(target.getAttribute('data-group-id'), target.value);
            renderSocialPageNow('group-thread-notify');
            return;
        }
        if (target.matches('form[data-form="create-page"] [name="pageVisibility"]')) runtime.ui.pageVisibility = text(target.value || 'public') || 'public';
        if (target.matches('form[data-form="create-page"] [name="pageType"]')) runtime.ui.pageType = text(target.value || 'brand') || 'brand';
        if (target.matches('form[data-form="update-page-profile"] [name="pageVisibility"]')) runtime.ui.pageVisibility = text(target.value || 'public') || 'public';
        if (target.matches('form[data-form="update-page-profile"] [name="pageType"]')) runtime.ui.pageType = text(target.value || 'brand') || 'brand';
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
        if (target.matches('form[data-form="create-project"] [name="projectInviteFaculty"]') || target.matches('[name="projectInviteFaculty"]')) {
            runtime.ui.projectInviteFaculty = text(target.value || 'all') || 'all';
            renderSocialPageNow('project-invite-faculty');
            return;
        }
        if (target.matches('select[name="projectDiscoverFaculty"]')) {
            runtime.ui.projectDiscoverFaculty = text(target.value || currentFacultyCode()) || currentFacultyCode();
            renderSocialPageNow('portfolio-discover-faculty');
            return;
        }
        if (target.matches('select[name="projectDiscoverRole"]')) {
            runtime.ui.projectDiscoverRole = text(target.value || 'all') || 'all';
            renderSocialPageNow('portfolio-discover-role');
            return;
        }
        if (target.matches('form[data-form="create-event"] [name="eventScope"]')) runtime.ui.eventScope = text(target.value || '');
        if (target.matches('form[data-form="create-event"] [name="eventJoinMode"]')) runtime.ui.eventJoinMode = text(target.value || 'open') || 'open';
        if (target.matches('form[data-form="create-event"] [name="eventCategory"]')) runtime.ui.eventCategory = text(target.value || 'social') || 'social';
        if (target.matches('form[data-form="create-event"] [name="eventIsOnline"]')) { runtime.ui.eventIsOnline = Boolean(target.checked); renderSocialPageNow('event-online-toggle'); return; }
        if (target.matches('form[data-form="create-event"] [name="eventRecurring"]')) runtime.ui.eventRecurring = Boolean(target.checked);
        if (target.matches('select[name="lostFoundFaculty"]')) {
            runtime.ui.lostFoundBrowseFaculty = text(target.value || 'current') || 'current';
            renderSocialPageNow('lost-found-faculty');
            return;
        }
        if (target.name === 'eventImage') {
            runtime.ui.eventImageFile = target.files?.[0] || null;
            renderSocialPageNow('event-image');
            return;
        }
        if (target.name === 'postFile') {
            runtime.ui.composerFile = target.files?.[0] || null;
            renderSocialPageNow('post-file');
        }
        syncCommentDraftFromTarget(target);
        if (target.name === 'pagePostFile') {
            runtime.ui.pagePostFile = target.files?.[0] || null;
            renderSocialPageNow('page-post-file');
            return;
        }
        if (target.name === 'messageFile') {
            const chat = activeChat();
            if (chat) {
                runtime.ui.messageFileByChat = runtime.ui.messageFileByChat || {};
                runtime.ui.messageFileByChat[text(chat.id)] = target.files?.[0] || null;
                renderSocialPageNow('message-file');
            }
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
        if (target.name === 'storyFile') {
            runtime.ui.storyFile = target.files?.[0] || null;
            renderSocialPageNow('story-file');
            return;
        }
        if (target.name === 'coverImageFile') {
            runtime.ui.coverImageFile = target.files?.[0] || null;
            renderSocialPageNow('cover-image-file');
        }
        if (target.name === 'pageAvatarFile') {
            runtime.ui.pageAvatarFile = target.files?.[0] || null;
            renderSocialPageNow('page-avatar-file');
            return;
        }
        if (target.name === 'pageCoverFile') {
            runtime.ui.pageCoverFile = target.files?.[0] || null;
            renderSocialPageNow('page-cover-file');
            return;
        }
        if (target.name === 'lostFoundFile') {
            runtime.ui.lostFoundFile = target.files?.[0] || null;
            renderSocialPageNow('lost-found-file');
            return;
        }
        if (target.name === 'projectMediaFile') {
            runtime.ui.projectMediaFile = target.files?.[0] || null;
            renderSocialPageNow('portfolio-media-file');
            return;
        }
        if (target.name === 'projectDeliverableFile') {
            runtime.ui.projectDeliverableFile = target.files?.[0] || null;
            renderSocialPageNow('project-deliverable-file');
        }
    }

    function handleGlobalKeydown(event) {
        const host = root();
        if (!host) return;
        const activeTag = String(document.activeElement?.tagName || '').toLowerCase();
        const isTyping = ['input', 'textarea', 'select'].includes(activeTag) || Boolean(document.activeElement?.isContentEditable);
        if (event.key === 'Escape') {
            const runtime = state();
            if (runtime.ui?.socialDialog) {
                event.preventDefault();
                closeDialog();
                return;
            }
            if (runtime.ui?.shellDrawerOpen) {
                event.preventDefault();
                runtime.ui.shellDrawerOpen = false;
                renderSocialPageNow('escape-shell-drawer');
                return;
            }
            if (typeof isPortalStoryViewerOpen === 'function' && isPortalStoryViewerOpen()) {
                event.preventDefault();
                if (typeof closePortalStoryViewer === 'function') closePortalStoryViewer();
                return;
            }
            if (typeof isPortalStoryComposerOpen === 'function' && isPortalStoryComposerOpen()) {
                event.preventDefault();
                if (typeof closePortalStoryComposer === 'function') closePortalStoryComposer();
                return;
            }
        }
        if ((event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'k') {
            event.preventDefault();
            const search = host.querySelector('input[type="search"], input[name="lostFoundSearch"], [data-bind="directory-search"], [data-bind="pages-search"], [name="projectDiscoverSearch"]');
            if (search && typeof search.focus === 'function') search.focus({ preventScroll: false });
            return;
        }
        if (!isTyping && event.key === '/') {
            const search = host.querySelector('input[type="search"], input[name="lostFoundSearch"], [data-bind="directory-search"], [data-bind="pages-search"], [name="projectDiscoverSearch"]');
            if (search && typeof search.focus === 'function') {
                event.preventDefault();
                search.focus({ preventScroll: false });
            }
        }
        if (!isTyping && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
            const focused = document.activeElement;
            if (focused?.getAttribute('role') === 'tab') {
                const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
                const idx = tabs.indexOf(focused);
                if (idx >= 0) {
                    const next = event.key === 'ArrowRight'
                        ? tabs[(idx + 1) % tabs.length]
                        : tabs[(idx - 1 + tabs.length) % tabs.length];
                    if (next) {
                        next.focus();
                        next.click();
                        event.preventDefault();
                    }
                }
            }
        }
    }

    function bindEvents() {
        const host = root();
        if (!host) return;
        if (bound && boundHost === host) return;
        if (hostEventAbort) {
            hostEventAbort.abort();
            hostEventAbort = null;
        }
        hostEventAbort = new AbortController();
        const { signal } = hostEventAbort;
        host.addEventListener('click', handleClick, { signal });
        host.addEventListener('submit', handleSubmit, { signal });
        host.addEventListener('input', handleInput, { signal });
        host.addEventListener('change', handleChange, { signal });
        if (!globalKeydownBound) {
            document.addEventListener('keydown', handleGlobalKeydown);
            globalKeydownBound = true;
        }
        boundHost = host;
        bound = true;
    }

    function renderOrRetry() {
        renderAttemptCount += 1;
        if (typeof getPortalSocialRuntimeState !== 'function') {
            if (renderAttemptCount < MAX_RENDER_ATTEMPTS) {
                window.requestAnimationFrame(renderOrRetry);
            } else {
                revealShell();
            }
            return;
        }
        renderSocialPageNow('boot');
        if (typeof initPalette === 'function') {
            try { initPalette(); } catch (error) {}
        }
    }

    async function boot() {
        ensureSocialRouteHost();
        bindEvents();
        guardStandaloneSocialRoute();
        window.__kiuSocialLiteRenderPage = renderSocialPageNow;
        applyShellIdentity(true);
        const runHydrate = typeof ensurePortalSocialRuntimeLoaded === 'function'
            ? () => Promise.resolve(ensurePortalSocialRuntimeLoaded()).catch(() => null)
            : typeof bootstrapCanonicalSocialRuntime === 'function'
                ? () => Promise.resolve(bootstrapCanonicalSocialRuntime()).catch(() => null)
                : typeof hydratePortalSocialRuntime === 'function'
                    ? () => Promise.resolve(hydratePortalSocialRuntime()).catch(() => null)
                    : null;
        if (runHydrate) await runHydrate();
        window.requestAnimationFrame(renderOrRetry);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { boot().catch(() => null); }, { once: true });
    } else {
        boot().catch(() => null);
    }
})();
