/* Social chrome / display / draft-state pure helpers.
 * Eager: social.html before social-page.js.
 */
(function initSocialChromeModel() {
    'use strict';
    if (window.__KIU_SOCIAL_CHROME_MODEL_LOADED) return;
    window.__KIU_SOCIAL_CHROME_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialChromeHooks || {};
    }

    function pick(name, fallback) {
        const hook = hooks()[name];
        if (typeof hook === 'function') return hook;
        if (typeof window[name] === 'function' && window[name] !== fallback) return window[name];
        return typeof fallback === 'function' ? fallback : () => fallback;
    }

    function text(value) {
        return pick('text', (v) => String(v == null ? '' : v).trim())(value);
    }

    function state() {
        return pick('state', () => ({ ui: {}, social: {} }))();
    }

    function currentUserId() {
        return pick('currentUserId', () => '')();
    }

    function currentUser() {
        return pick('currentUser', () => null)();
    }

    const USER_ROLES_FALLBACK = {
        STUDENT: 'student',
        PROFESSOR: 'professor',
        TA: 'ta',
        ADMIN: 'admin',
        STUDENT_SERVICE: 'student_service'
    };

    function escape(value) {
        const hook = hooks().escape;
        if (typeof hook === 'function') return hook(value);
        try {
            if (typeof window.escapePortalSocialHtml === 'function') return window.escapePortalSocialHtml(value);
        } catch (error) {}
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toDateTimeLocalValue(value) {
        return pick('toDateTimeLocalValue', () => '')(value);
    }

    function roleValue(key, fallback) {
        const hook = hooks().roleValue;
        if (typeof hook === 'function') return hook(key, fallback);
        try {
            if (typeof window.USER_ROLES !== 'undefined' && window.USER_ROLES && window.USER_ROLES[key]) {
                return window.USER_ROLES[key];
            }
        } catch (error) {}
        return USER_ROLES_FALLBACK[key] || fallback;
    }

    function countNum(value) {
        return Number(value || 0);
    }

    function postKey(postOrId) {
        if (postOrId && typeof postOrId === 'object') return text(postOrId.id);
        return text(postOrId);
    }

    function when(value) {
        try {
            if (typeof window.formatPortalSocialWhen === 'function') return window.formatPortalSocialWhen(value);
        } catch (error) {}
        return text(value);
    }

    function currentFacultyCode() {
        try {
            if (typeof window.getCurrentFaculty === 'function') {
                return text(window.getCurrentFaculty())
                    || text(currentUser()?.facultyCode || currentUser()?.faculty)
                    || text(typeof localStorage !== 'undefined' ? localStorage.getItem('currentFaculty') : '')
                    || text(document.body?.dataset?.faculty || document.documentElement?.dataset?.faculty)
                    || 'ECON';
            }
        } catch (error) {}
        return text(currentUser()?.facultyCode || currentUser()?.faculty)
            || text(typeof localStorage !== 'undefined' ? localStorage.getItem('currentFaculty') : '')
            || text(document.body?.dataset?.faculty || document.documentElement?.dataset?.faculty)
            || 'ECON';
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
        return `<span class="social-neo-pill home-hover-chip social-neo-presence-pill ${isAccountOnline(account) ? 'is-online' : 'is-offline'}">${escape(accountPresenceLabel(account))}</span>`;
    }

    function groupMemberPreviewNames(memberIds, limit = 4) {
        return (Array.isArray(memberIds) ? memberIds : [])
            .slice(0, limit)
            .map((memberId) => displayName(accountById(memberId) || { id: memberId }))
            .filter(Boolean);
    }

    function avatarSource(account) {
        try {
            if (typeof window.resolvePortalSocialAvatarSource === 'function') {
                return window.resolvePortalSocialAvatarSource(account);
            }
        } catch (error) {}
        return '';
    }

    function avatarFallback(account) {
        try {
            if (typeof window.resolvePortalSocialAvatarFallback === 'function') {
                return window.resolvePortalSocialAvatarFallback(account);
            }
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
            if (typeof window.resolvePortalSocialFileUrl === 'function') {
                const resolved = window.resolvePortalSocialFileUrl(file);
                if (resolved) return resolved;
            }
        } catch (error) {}
        const storageKey = text(file?.storageKey || file?.id || '');
        const backend = text(file?.storageBackend).toLowerCase();
        if (storageKey && typeof window.getPortalStoredFileUrl === 'function' && (backend === 'bridge' || backend === '' || !text(file?.dataUrl))) {
            const type = text(file?.type).toLowerCase();
            const name = text(file?.name).toLowerCase();
            const forDisplay = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
            return window.getPortalStoredFileUrl(storageKey, { inline: forDisplay, forDisplay });
        }
        return text(file?.dataUrl);
    }

    function isImage(file) {
        try {
            if (typeof window.isPortalSocialImage === 'function') return Boolean(window.isPortalSocialImage(file));
        } catch (error) {}
        const name = text(file?.name).toLowerCase();
        const type = text(file?.type).toLowerCase();
        return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
    }

    function uniqueStrings(values) {
        return [...new Set((Array.isArray(values) ? values : [values]).map((item) => text(item)).filter(Boolean))];
    }

    function domToken(value) {
        try {
            if (typeof window.toDomToken === 'function') return window.toDomToken(value);
        } catch (error) {}
        return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
    }

    function controlId(name, scope = '') {
        return `social-${domToken(scope ? `${name}-${scope}` : name)}`;
    }

    function makeId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
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
            if (typeof window.getFacultyLabel === 'function') return window.getFacultyLabel(code);
        } catch (error) {}
        return text(code || 'Faculty');
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

    function clearSurveyFlowState(runtime, { keepTakingId = false } = {}) {
        if (!keepTakingId) runtime.ui.surveyTakingId = '';
    }

    function resetLostFoundDraft() {
        const runtime = state();
        runtime.ui.lostFoundEditId = '';
        runtime.ui.lostFoundTitle = '';
        runtime.ui.lostFoundDescription = '';
        runtime.ui.lostFoundCategory = '';
        runtime.ui.lostFoundLocation = '';
        runtime.ui.lostFoundDate = '';
        runtime.ui.lostFoundExpiresAt = '';
        runtime.ui.lostFoundFile = null;
    }

    function clearEventDraft() {
        const ui = state().ui;
        ui.eventEditId = '';
        ui.eventTitle = '';
        ui.eventDescription = '';
        ui.eventStartsAt = '';
        ui.eventEndsAt = '';
        ui.eventLocation = '';
        ui.eventOnlineLink = '';
        ui.eventIsOnline = false;
        ui.eventJoinMode = 'open';
        ui.eventCategory = 'social';
        ui.eventScope = '';
        ui.eventMaxSeats = '';
        ui.eventRecurring = false;
        ui.eventImageFile = null;
        ui.eventImageUrl = '';
    }

    function prefillEventEditDraft(event = {}) {
        const ui = state().ui;
        ui.eventEditId = text(event.id);
        ui.eventTitle = text(event.title || '');
        ui.eventDescription = text(event.description || '');
        ui.eventStartsAt = toDateTimeLocalValue(event.startsAt);
        ui.eventEndsAt = toDateTimeLocalValue(event.endsAt);
        ui.eventLocation = text(event.location || '');
        ui.eventOnlineLink = text(event.onlineLink || '');
        ui.eventIsOnline = Boolean(event.isOnline);
        ui.eventJoinMode = text(event.joinMode || 'open') || 'open';
        ui.eventCategory = text(event.category || 'social') || 'social';
        ui.eventMaxSeats = event.maxSeats || event.capacity ? String(event.maxSeats || event.capacity) : '';
        ui.eventRecurring = Boolean(event.isRecurring);
        ui.eventScope = `${text(event.scopeType || 'profile')}:${text(event.scopeId || currentUserId())}`;
        ui.eventImageFile = null;
        ui.eventImageUrl = text(event.imageUrl || '');
    }

    function eventCanManage(item = {}) {
        const userId = currentUserId();
        if (!userId || !item) return false;
        if (item.viewerCanEdit || item.viewerCanDelete) return true;
        if (text(item.createdById) === userId) return true;
        if (text(item.scopeType) === 'profile' && text(item.scopeId) === userId) return true;
        return false;
    }

    function buildContextTabItems(activePanel, runtime) {
        const ui = runtime?.ui || {};
        const activeHomeFilter = text(ui.homeFeedFilter || 'all') || 'all';
        const activeProfileTab = text(ui.profileTab || 'posts') || 'posts';
        const emptyPanels = new Set([
            'feed', 'community', 'groups', 'workspace', 'projects', 'pages',
            'events', 'lost-and-found', 'messages'
        ]);
        if (activePanel === 'alerts') {
            return [{ action: 'panel-messages', tab: 'all', label: 'Messages', isActive: false }];
        }
        if (activePanel === 'profile') {
            return [
                { action: 'profile-tab-posts', label: 'Posts', isActive: activeProfileTab === 'posts' },
                { action: 'profile-tab-friends', label: 'Friends', isActive: activeProfileTab === 'friends' },
                { action: 'profile-tab-following', label: 'Following', isActive: activeProfileTab === 'following' },
                { action: 'profile-tab-saved', label: 'Saved', isActive: activeProfileTab === 'saved' },
                { action: 'profile-tab-about', label: 'About', isActive: activeProfileTab === 'about' }
            ];
        }
        if (emptyPanels.has(activePanel)) return [];
        return [
            { action: 'panel-feed', tab: 'all', label: 'All', isActive: activeHomeFilter === 'all' },
            { action: 'panel-feed', tab: 'following', label: 'Following', isActive: activeHomeFilter === 'following' },
            { action: 'panel-feed', tab: 'groups', label: 'Groups', isActive: activeHomeFilter === 'groups' },
            { action: 'panel-feed', tab: 'pages', label: 'Pages', isActive: activeHomeFilter === 'pages' },
            { action: 'panel-feed', tab: 'campus', label: 'Campus', isActive: activeHomeFilter === 'campus' }
        ];
    }

    function renderContextTabsMarkup(tabs) {
        if (!tabs.length) return '';
        return `<div class="social-neo-tabs social-neo-tabs-context social-neo-topbar-tabs">
            ${tabs.map((tab) => {
                const attrs = [tab.action ? `data-action="${escape(tab.action)}"` : ''];
                if (tab.action === 'panel-feed' && tab.tab) attrs.push(`data-home-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-community' && tab.tab) attrs.push(`data-community-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-events' && tab.tab) attrs.push(`data-events-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-messages' && tab.tab) attrs.push(`data-messages-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-alerts' && tab.tab) attrs.push(`data-alerts-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-groups' && tab.tab) attrs.push(`data-groups-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-pages' && tab.tab) attrs.push(`data-pages-tab="${escape(tab.tab)}"`);
                return `<button class="social-neo-tab social-neo-topbar-tab ${tab.isActive ? 'is-active' : ''}" type="button" aria-pressed="${tab.isActive ? 'true' : 'false'}" ${attrs.join(' ')}>${escape(tab.label)}</button>`;
            }).join('')}
        </div>`;
    }

    function renderContextTabs(activePanel) {
        return renderContextTabsMarkup(buildContextTabItems(activePanel, state()));
    }

    const api = {
        escape,
        roleValue,
        countNum,
        postKey,
        when,
        currentFacultyCode,
        accountById,
        displayName,
        accountSubtitle,
        isAccountOnline,
        accountPresenceLabel,
        presencePill,
        groupMemberPreviewNames,
        avatarSource,
        avatarFallback,
        avatar,
        fileUrl,
        isImage,
        uniqueStrings,
        domToken,
        controlId,
        makeId,
        getSafeSocialExternalUrl,
        roleLabel,
        facultyLabel,
        isIncomingCall,
        isManagedPage,
        isJoinedGroup,
        pageOrGroupPublic,
        groupAvatarSource,
        groupAvatarFallback,
        groupAvatar,
        groupBanner,
        pageAvatarSource,
        pageAvatarFallback,
        pageAvatar,
        pageCover,
        pageTypeLabel,
        pagePostTypeLabel,
        extractLinksFromText,
        messageLinks,
        clearSurveyFlowState,
        resetLostFoundDraft,
        clearEventDraft,
        prefillEventEditDraft,
        eventCanManage,
        buildContextTabItems,
        renderContextTabsMarkup,
        renderContextTabs
    };

    window.KiuSocialChromeModel = api;
    Object.keys(api).forEach((key) => {
        window[key] = api[key];
    });
})();
