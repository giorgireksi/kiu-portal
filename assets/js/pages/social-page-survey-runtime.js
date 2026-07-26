/* Social page survey + contiguous page helpers runtime.
 * Peeled from social-page.js (Wave 12). Load eager before social-page.js.
 */
(function initSocialPageSurveyRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_PAGE_SURVEY_LOADED) return;
    window.__KIU_SOCIAL_PAGE_SURVEY_LOADED = true;

    window.__kiuCreateSocialPageSurveyApi = function createKiuSocialPageSurveyApi(deps = {}) {
        const d = deps;
        function text(...a) {
            const fn = d.text || window.text;
            if (typeof fn !== 'function') throw new Error('Missing dep: text');
            return fn.apply(this, a);
        }
        function state(...a) {
            const fn = d.state || window.state;
            if (typeof fn !== 'function') throw new Error('Missing dep: state');
            return fn.apply(this, a);
        }
        function currentUserId(...a) {
            const fn = d.currentUserId || window.currentUserId;
            if (typeof fn !== 'function') throw new Error('Missing dep: currentUserId');
            return fn.apply(this, a);
        }
        function activeDialog(...a) {
            const fn = d.activeDialog || window.activeDialog;
            if (typeof fn !== 'function') throw new Error('Missing dep: activeDialog');
            return fn.apply(this, a);
        }
        function openDialog(...a) {
            const fn = d.openDialog || window.openDialog;
            if (typeof fn !== 'function') throw new Error('Missing dep: openDialog');
            return fn.apply(this, a);
        }
        function syncSurveyDraftFromForm(...a) {
            const fn = d.syncSurveyDraftFromForm || window.syncSurveyDraftFromForm;
            if (typeof fn !== 'function') throw new Error('Missing dep: syncSurveyDraftFromForm');
            return fn.apply(this, a);
        }
        function ensureSurveyDraftQuestions(...a) {
            const fn = d.ensureSurveyDraftQuestions || window.ensureSurveyDraftQuestions;
            if (typeof fn !== 'function') throw new Error('Missing dep: ensureSurveyDraftQuestions');
            return fn.apply(this, a);
        }
        function domToken(...a) {
            const fn = d.domToken || window.domToken;
            if (typeof fn !== 'function') throw new Error('Missing dep: domToken');
            return fn.apply(this, a);
        }
        function activeMessages(...a) {
            const fn = d.activeMessages || window.activeMessages;
            if (typeof fn !== 'function') throw new Error('Missing dep: activeMessages');
            return fn.apply(this, a);
        }
        function messageLinks(...a) {
            const fn = d.messageLinks || window.messageLinks;
            if (typeof fn !== 'function') throw new Error('Missing dep: messageLinks');
            return fn.apply(this, a);
        }
        function isImage(...a) {
            const fn = d.isImage || window.isImage;
            if (typeof fn !== 'function') throw new Error('Missing dep: isImage');
            return fn.apply(this, a);
        }
        function accountById(...a) {
            const fn = d.accountById || window.accountById;
            if (typeof fn !== 'function') throw new Error('Missing dep: accountById');
            return fn.apply(this, a);
        }
        function when(...a) {
            const fn = d.when || window.when;
            if (typeof fn !== 'function') throw new Error('Missing dep: when');
            return fn.apply(this, a);
        }
        function lostFoundItems(...a) {
            const fn = d.lostFoundItems || window.lostFoundItems;
            if (typeof fn !== 'function') throw new Error('Missing dep: lostFoundItems');
            return fn.apply(this, a);
        }
        function isLostFoundItemExpired(...a) {
            const fn = d.isLostFoundItemExpired || window.isLostFoundItemExpired;
            if (typeof fn !== 'function') throw new Error('Missing dep: isLostFoundItemExpired');
            return fn.apply(this, a);
        }
        function saveLostFoundItems(...a) {
            const fn = d.saveLostFoundItems || window.saveLostFoundItems;
            if (typeof fn !== 'function') throw new Error('Missing dep: saveLostFoundItems');
            return fn.apply(this, a);
        }
        function markPortalNotificationRead(...a) {
            const fn = d.markPortalNotificationRead || window.markPortalNotificationRead;
            if (typeof fn !== 'function') throw new Error('Missing dep: markPortalNotificationRead');
            return fn.apply(this, a);
        }
        function socialScrollLockActive(...a) {
            const fn = d.socialScrollLockActive || window.socialScrollLockActive;
            if (typeof fn !== 'function') throw new Error('Missing dep: socialScrollLockActive');
            return fn.apply(this, a);
        }
        function getSocialCenterScroller(...a) {
            const fn = d.getSocialCenterScroller || window.getSocialCenterScroller;
            if (typeof fn !== 'function') throw new Error('Missing dep: getSocialCenterScroller');
            return fn.apply(this, a);
        }
        function isSocialInboxPanel(...a) {
            const fn = d.isSocialInboxPanel || window.isSocialInboxPanel;
            if (typeof fn !== 'function') throw new Error('Missing dep: isSocialInboxPanel');
            return fn.apply(this, a);
        }
        function interactionAnchorNode(...a) {
            const fn = d.interactionAnchorNode || window.interactionAnchorNode;
            if (typeof fn !== 'function') throw new Error('Missing dep: interactionAnchorNode');
            return fn.apply(this, a);
        }
        function focusRestoreSelector(...a) {
            const fn = d.focusRestoreSelector || window.focusRestoreSelector;
            if (typeof fn !== 'function') throw new Error('Missing dep: focusRestoreSelector');
            return fn.apply(this, a);
        }
        function renderSocialPageNow(...a) {
            const fn = d.renderSocialPageNow || window.renderSocialPageNow;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderSocialPageNow');
            return fn.apply(this, a);
        }
        function centerCanScroll(...a) {
            const fn = d.centerCanScroll || window.centerCanScroll;
            if (typeof fn !== 'function') throw new Error('Missing dep: centerCanScroll');
            return fn.apply(this, a);
        }
        function getSocialCenterScrollBudget(...a) {
            const fn = d.getSocialCenterScrollBudget || window.getSocialCenterScrollBudget;
            if (typeof fn !== 'function') throw new Error('Missing dep: getSocialCenterScrollBudget');
            return fn.apply(this, a);
        }
        function root(...a) {
            const fn = d.root || window.root;
            if (typeof fn !== 'function') throw new Error('Missing dep: root');
            return fn.apply(this, a);
        }
        function normalizeSocialOverlayDialogRegion(...a) {
            const fn = d.normalizeSocialOverlayDialogRegion || window.normalizeSocialOverlayDialogRegion;
            if (typeof fn !== 'function') return undefined;
            return fn.apply(this, a);
        }
        const SOCIAL_OVERLAY_PORTAL_ID = d.SOCIAL_OVERLAY_PORTAL_ID ?? window.SOCIAL_OVERLAY_PORTAL_ID ?? 'kiu-social-overlay-portal';

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

function resolveNotificationFromTrigger(trigger) {
    const notificationRef = text(trigger?.getAttribute?.('data-notification-id') || '');
    if (!notificationRef) return null;
    return notificationItems().find((item) => text(item.key) === notificationRef || text(item.id) === notificationRef) || null;
}

function markAlertNotificationAndRefresh(notification) {
    if (!notification) return;
    const key = text(notification.key || '');
    if (key) markPortalNotificationRead(key);
    renderSocialPageNow('notification-read');
}

function openNotificationTargetInNewTab(url) {
    const targetUrl = text(url || '');
    if (!targetUrl) return;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

async function removeAlertNotificationAndRefresh(notification) {
    if (!notification) return;
    const notificationRef = text(notification.id || notification.key || '');
    if (!notificationRef) return;
    if (typeof removePortalNotification === 'function') {
        try { await removePortalNotification(notificationRef); } catch (error) {}
    }
    renderSocialPageNow('notification-removed');
}

async function removeAlertNotificationsAndRefresh(notifications) {
    const items = Array.isArray(notifications) ? notifications : [];
    for (const notification of items) {
        const notificationRef = text(notification?.id || notification?.key || '');
        if (!notificationRef) continue;
        if (typeof removePortalNotification === 'function') {
            try { await removePortalNotification(notificationRef); } catch (error) {}
        }
    }
    if (items.length) renderSocialPageNow('notification-removed');
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

async function pruneExpiredLostFoundItems(reason = 'lost-found-expired') {
    const current = lostFoundItems().map((item) => normalizeLostFoundItem(item));
    const active = current.filter((item) => !isLostFoundItemExpired(item));
    if (active.length === current.length) return active;
    return saveLostFoundItems(active, reason);
}

function isSurveyAnswerProvided(form, question) {
    const qId = text(question?.id);
    const questionType = text(question?.questionType || 'single_choice');
    if (questionType === 'single_choice') {
        return Boolean(form.querySelector(`input[name="survey-q-${qId}"]:checked`));
    }
    if (questionType === 'multiple_choice') {
        return form.querySelectorAll(`input[name="survey-q-${qId}[]"]:checked`).length > 0;
    }
    if (questionType === 'rating' || questionType === 'yes_no') {
        return Boolean(form.querySelector(`input[name="survey-q-${qId}"]:checked`));
    }
    const input = form.querySelector(`[name="survey-q-${qId}"]`);
    return Boolean(text(input?.value).trim());
}

function rippleSurveySubmitButton(btn, event) {
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const x = event && Number.isFinite(event.clientX)
        ? event.clientX - rect.left
        : rect.width / 2;
    const y = event && Number.isFinite(event.clientY)
        ? event.clientY - rect.top
        : rect.height / 2;
    btn.style.setProperty('--survey-ripple-x', `${x}px`);
    btn.style.setProperty('--survey-ripple-y', `${y}px`);
    btn.classList.remove('is-rippling', 'is-pressing');
    void btn.offsetWidth;
    btn.classList.add('is-rippling', 'is-pressing');
    const clearRipple = () => {
        btn.classList.remove('is-rippling');
        btn.removeEventListener('animationend', onRippleEnd);
    };
    const onRippleEnd = (endEvent) => {
        if (endEvent.target !== btn) return;
        clearRipple();
    };
    btn.addEventListener('animationend', onRippleEnd);
    window.setTimeout(clearRipple, 520);
    window.setTimeout(() => btn.classList.remove('is-pressing'), 240);
}

function rippleSurveyChoiceLabel(label, event) {
    if (!label) return;
    const rect = label.getBoundingClientRect();
    const x = event && Number.isFinite(event.clientX)
        ? event.clientX - rect.left
        : rect.width / 2;
    const y = event && Number.isFinite(event.clientY)
        ? event.clientY - rect.top
        : rect.height / 2;
    label.style.setProperty('--survey-ripple-x', `${x}px`);
    label.style.setProperty('--survey-ripple-y', `${y}px`);
    label.classList.remove('is-rippling');
    void label.offsetWidth;
    label.classList.add('is-rippling');
    const clear = () => {
        label.classList.remove('is-rippling');
        label.removeEventListener('animationend', onEnd);
    };
    const onEnd = (endEvent) => {
        if (endEvent.target !== label) return;
        clear();
    };
    label.addEventListener('animationend', onEnd);
    window.setTimeout(clear, 450);
}

function animateSurveyChoiceInteraction(input) {
    const label = input?.closest?.('.social-neo-survey-take-choice');
    if (!label) return;
    label.classList.remove('is-selecting');
    void label.offsetWidth;
    label.classList.add('is-selecting');
    const clear = () => {
        label.classList.remove('is-selecting');
        label.removeEventListener('animationend', onEnd);
    };
    const onEnd = (endEvent) => {
        if (endEvent.target !== label) return;
        clear();
    };
    label.addEventListener('animationend', onEnd);
    window.setTimeout(clear, 380);
}

function waitForSurveySubmitAnimation(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setSurveySubmitButtonLabel(btn, labelText) {
    const label = btn?.querySelector?.('.social-neo-survey-submit-btn-label');
    if (label) label.textContent = labelText;
}

function setSurveySubmitButtonIcon(btn, iconClass) {
    const icon = btn?.querySelector?.('.social-neo-survey-submit-btn-icon i');
    if (icon) icon.className = `fas ${iconClass}`;
}

function flashSurveySubmitButton(btn, state = 'acting') {
    if (!btn) return;
    btn.classList.remove('is-acting', 'is-success', 'is-error', 'is-submitting');
    void btn.offsetWidth;
    if (state === 'acting') btn.classList.add('is-acting');
    else if (state === 'success') btn.classList.add('is-success');
    else if (state === 'error') btn.classList.add('is-error');
    else if (state === 'submitting') btn.classList.add('is-submitting');
}

function rerenderSurveyCreateDialog() {
    const dialog = activeDialog() || {};
    if (text(dialog.type || '') !== 'survey-create') return;
    const variant = text(dialog.variant || state().ui?.surveysSubTab || 'student') || 'student';
    return openDialog('survey-create', { variant });
}

function patchSurveyCreateQuestionsPanel({ skipSync = false } = {}) {
    if (text(activeDialog()?.type || '') !== 'survey-create') return;
    const form = document.querySelector('form[data-form="survey-create"]');
    if (!form) return rerenderSurveyCreateDialog();
    if (!skipSync) syncSurveyDraftFromForm(form);
    const questionsRoot = form.querySelector('.social-neo-surveys-create-questions');
    if (!questionsRoot) return rerenderSurveyCreateDialog();
    questionsRoot.innerHTML = typeof window.renderSurveyCreateQuestionsMarkup === 'function' ? window.renderSurveyCreateQuestionsMarkup() : '';
    const draft = ensureSurveyDraftQuestions();
    const questionCountStat = form.querySelector('.social-neo-surveys-hero-stats .social-neo-surveys-hero-stat strong');
    if (questionCountStat && typeof window.formatSurveyQuestionCountStat === 'function') questionCountStat.textContent = window.formatSurveyQuestionCountStat(draft);
    if (typeof window.enhanceUniversalPickers === 'function') window.enhanceUniversalPickers(questionsRoot);
}

function captureInteractionState(host) {
    const active = document.activeElement;
    const activeInHost = Boolean(active && host?.contains(active));
    const layoutScrollLock = socialScrollLockActive();
    const centerScroller = getSocialCenterScroller(host);
    const scrollSelectors = layoutScrollLock
        ? [
            '#social-neo-center-region',
            '.social-neo-workspace-nav',
            '.social-neo-thread-messages',
            '.social-neo-messages__thread-scroll',
            '.social-neo-chat-items',
            '.social-neo-chat-list',
            '.sn-alerts-list',
            '.social-neo-stories',
            '.social-neo-events-content',
            '.social-project-scroll-list'
        ]
        : [
            '.social-neo-thread-messages',
            '.social-neo-messages__thread-scroll',
            '.social-neo-chat-items',
            '.social-neo-chat-list',
            '.sn-alerts-list',
            '.social-neo-center',
            '#social-neo-center-region',
            '.social-neo-stories',
            '.social-neo-directory',
            '.social-neo-events-content'
        ];
    const anchorUserId = text(host?.__kiuInteractionAnchorUserId || '');
    let anchorDocY = null;
    let anchorCenterY = null;
    if (anchorUserId) {
        const anchorNode = interactionAnchorNode(host, anchorUserId);
        if (anchorNode) {
            if (layoutScrollLock && centerScroller) {
                const scrollerRect = centerScroller.getBoundingClientRect();
                anchorCenterY = centerScroller.scrollTop + anchorNode.getBoundingClientRect().top - scrollerRect.top;
            } else {
                anchorDocY = (window.scrollY || 0) + anchorNode.getBoundingClientRect().top;
            }
        }
    }
    return {
        windowX: window.scrollX || 0,
        windowY: window.scrollY || 0,
        centerScrollY: centerScroller?.scrollTop || 0,
        activeSelector: activeInHost ? focusRestoreSelector(active) : '',
        selectionStart: activeInHost && typeof active.selectionStart === 'number' ? active.selectionStart : null,
        selectionEnd: activeInHost && typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
        anchorUserId,
        anchorDocY,
        anchorCenterY,
        layoutScrollLock,
        deferWindowScroll: layoutScrollLock || Boolean(anchorUserId),
        scrolls: scrollSelectors.flatMap((selector) => Array.from(host?.querySelectorAll(selector) || []).map((node, index) => ({
            selector,
            index,
            top: node.scrollTop || 0,
            left: node.scrollLeft || 0
        })))
    };
}

function applyCenterScrollRestore(host, snapshot) {
    if (!snapshot?.layoutScrollLock || isSocialInboxPanel(host)) return;
    const scroller = getSocialCenterScroller(host);
    if (!scroller) return;
    let targetTop = Number.isFinite(snapshot.centerScrollY) ? snapshot.centerScrollY : scroller.scrollTop;
    if (snapshot.anchorUserId && Number.isFinite(snapshot.anchorCenterY)) {
        const anchorNode = interactionAnchorNode(host, snapshot.anchorUserId);
        if (anchorNode) {
            const scrollerRect = scroller.getBoundingClientRect();
            const newCenterY = scroller.scrollTop + anchorNode.getBoundingClientRect().top - scrollerRect.top;
            targetTop = Math.max(0, targetTop + (snapshot.anchorCenterY - newCenterY));
        }
    }
    scroller.scrollTop = targetTop;
}

function applyWindowScrollRestore(host, snapshot) {
    if (!snapshot || snapshot.layoutScrollLock) {
        applyCenterScrollRestore(host, snapshot);
        return;
    }
    if (!Number.isFinite(snapshot.windowY)) return;
    let targetY = snapshot.windowY || 0;
    if (snapshot.anchorUserId && Number.isFinite(snapshot.anchorDocY) && host) {
        const anchorNode = interactionAnchorNode(host, snapshot.anchorUserId);
        if (anchorNode) {
            const newDocY = (window.scrollY || 0) + anchorNode.getBoundingClientRect().top;
            targetY = Math.max(0, targetY + (snapshot.anchorDocY - newDocY));
        }
    }
    try { window.scrollTo(snapshot.windowX || 0, targetY); } catch (error) {}
}

function restoreInteractionState(host, snapshot, options = {}) {
    if (!host || !snapshot) return;
    const skipCenterForInbox = isSocialInboxPanel(host);
    if (!options.windowOnly) {
        snapshot.scrolls?.forEach((item) => {
            if ((options.skipCenterScroll || skipCenterForInbox)
                && (item.selector === '#social-neo-center-region' || item.selector === '.social-neo-center')) {
                return;
            }
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
    }
    if (!options.skipWindow) applyWindowScrollRestore(host, snapshot);
}

function clearSocialCenterScrollBounds(host = root()) {
    const center = getSocialCenterScroller(host);
    if (!center) return;
    center.style.removeProperty('max-height');
    center.style.removeProperty('height');
    center.style.removeProperty('min-height');
    center.style.removeProperty('overflow-y');
    delete center.dataset.socialCenterBounded;
}

function measureSocialCenterBottom(center, node) {
    if (!center || !node) return 0;
    const centerTop = center.getBoundingClientRect().top;
    const scrollTop = center.scrollTop || 0;
    const rect = node.getBoundingClientRect();
    return Math.ceil(rect.bottom - centerTop + scrollTop);
}

function getSocialCenterContentExtent(center) {
    if (!center) return 0;
    const bump = (node) => {
        if (!node) return;
        extent = Math.max(extent, measureSocialCenterBottom(center, node), node.scrollHeight || 0, node.offsetHeight || 0);
    };
    let extent = 0;
    bump(center.firstElementChild);
    center.querySelectorAll(
        '[class$="-shell"], [class$="-listings"], [class$="-hub-body"], [class$="-hub-section"], [class$="-layout"], [class$="-grid"], .is-merged, .social-neo-workspace-hub-section, .social-project-card-new, .social-project-row, .social-project-tab-shell, .social-portfolio-feed, #social-project-tab-panel, .social-project-tab-pane, .social-project-overview-columns, .social-project-overview-slot, .social-project-overview-slot__scroll, .social-project-scroll-list, .social-neo-feed-header-card, .social-neo-event-feature, .social-photo-content-stage, .social-photo-grid-tile, .social-neo-survey-listings, .social-neo-survey-card, .social-neo-surveys-hero, .social-neo-groups-hero, .social-neo-lost-found-hero, .social-neo-community-hero, .social-neo-pages-hero, .social-neo-events-hero, .social-neo-workspace-hero, .social-neo-portfolio-hero'
    ).forEach(bump);
    return extent;
}

function getSocialCenterViewportHeight(center, shell) {
    if (!center) return 0;
    const scrollBudget = getSocialCenterScrollBudget(center, shell || center.closest('.social-neo-shell'));
    return center.dataset.socialCenterBounded === '1'
        ? center.clientHeight
        : Math.min(center.clientHeight, scrollBudget || center.clientHeight);
}

function socialCenterHasLiveScrollRoom(center, contentH = 0) {
    if (!center) return false;
    const viewportH = getSocialCenterViewportHeight(center);
    const measured = contentH || getSocialCenterContentScrollHeight(center);
    return measured > center.scrollTop + viewportH + 1
        || center.scrollHeight > center.scrollTop + viewportH + 1;
}

function getSocialCenterContentScrollHeight(center) {
    if (!center) return 0;
    if (center.querySelector('.social-neo-messages') || center.querySelector('.sn-alerts-panel')) return center.clientHeight;
    const contentRoot = center.firstElementChild;
    const directory = center.querySelector('.social-neo-directory');
    const scrollItems = center.querySelectorAll(
        '.social-neo-directory-item, .social-neo-post-card, .social-neo-page-card, .social-neo-community-card, .social-neo-entity-card, .social-neo-event-card, .social-neo-event-feature, .social-neo-group-card, .social-neo-friend-chip, .social-project-card, .social-project-card-new, .social-project-row, .social-project-task-card, .spt-desk-card, .spt-desk-package, .social-project-activity-item, .social-project-detail-hero, .social-project-dashboard-strip, .social-project-overview-columns, .social-project-overview-slot, .social-project-overview-col, .social-project-graph-preview-card, .social-project-my-tasks-card, .social-project-health-card, .social-project-tab-panel, .social-project-tab-shell, .social-project-metric-card, .social-project-ring-card, .social-neo-workspace-hub-section, .social-photo-content-stage, .social-photo-grid-tile, .social-neo-surveys-hero, .social-neo-survey-card, .social-neo-groups-hero, .social-neo-lost-found-hero, .social-neo-portfolio-hero, .social-portfolio-card'
    );
    let itemsHeight = 0;
    let leafExtent = 0;
    let mergedExtent = 0;
    scrollItems.forEach((item) => {
        itemsHeight += item.getBoundingClientRect().height;
        leafExtent = Math.max(leafExtent, measureSocialCenterBottom(center, item));
    });
    center.querySelectorAll('.is-merged, [class$="-listings"], .social-neo-survey-card, .social-project-card-new, .social-project-row').forEach((node) => {
        mergedExtent = Math.max(mergedExtent, measureSocialCenterBottom(center, node));
    });
    const contentBottom = measureSocialCenterBottom(center, contentRoot);
    const directoryExtent = directory
        ? directory.offsetTop + (itemsHeight || directory.offsetHeight)
        : 0;
    const panelShell = center.querySelector('[class$="-shell"], .social-portfolio-feed');
    const panelExtent = getSocialCenterContentExtent(center);
    return Math.max(
        center.scrollHeight || 0,
        contentRoot?.offsetHeight || 0,
        contentRoot?.scrollHeight || 0,
        directory?.scrollHeight || 0,
        directoryExtent,
        contentBottom,
        leafExtent,
        mergedExtent,
        panelShell?.scrollHeight || 0,
        panelShell?.offsetHeight || 0,
        panelExtent
    );
}

function getSocialCenterMaxScroll(center, shell) {
    if (!center) return 0;
    void center.offsetHeight;
    const shellNode = shell || center.closest('.social-neo-shell');
    const contentH = getSocialCenterContentScrollHeight(center);
    const scrollBudget = getSocialCenterScrollBudget(center, shellNode);
    const viewportH = getSocialCenterViewportHeight(center, shellNode);
    let maxScroll = Math.max(0, Math.max(center.scrollHeight, contentH) - viewportH);
    if (maxScroll <= 1 && centerCanScroll(center, shell)) {
        maxScroll = Math.max(
            maxScroll,
            contentH - viewportH,
            contentH - scrollBudget,
            center.scrollHeight - viewportH
        );
    }
    return Math.max(0, maxScroll);
}

function setSocialRegionMarkup(node, markup) {
    if (!node) return;
    if (node.id === 'lux-glass-dialog-region') normalizeSocialOverlayDialogRegion();
    const nextMarkup = String(markup || '');
    if (node.__kiuLastMarkup === nextMarkup) return;
    node.innerHTML = nextMarkup;
    node.__kiuLastMarkup = nextMarkup;
}

function invalidateSocialRenderCache({ center = true } = {}) {
    if (typeof invalidatePortalSocialRenderCache === 'function') {
        invalidatePortalSocialRenderCache({ center });
        return;
    }
    const host = root();
    if (host) host.__kiuLastRenderSignature = '';
    if (center) {
        const centerEl = document.getElementById('social-neo-center-region');
        if (centerEl) delete centerEl.__kiuLastMarkup;
    }
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
    const accessibilityRoots = [host, document.getElementById(SOCIAL_OVERLAY_PORTAL_ID)].filter(Boolean);
    accessibilityRoots.forEach((accessibilityHost) => {
        accessibilityHost.querySelectorAll('.lux-glass-dialog-backdrop').forEach((node) => {
            node.setAttribute('role', 'dialog');
            node.setAttribute('aria-modal', 'true');
            if (!node.getAttribute('aria-label')) {
                node.setAttribute('aria-label', text(node.querySelector('strong')?.textContent || 'Social dialog'));
            }
        });
    });
    host.querySelectorAll('button').forEach((button) => {
        const visibleLabel = text(button.textContent || '');
        if (visibleLabel || button.getAttribute('aria-label')) return;
        const action = text(button.getAttribute('data-action') || 'Action').replace(/[-_]+/g, ' ');
        button.setAttribute('aria-label', action);
    });
}

        const api = {
            messageAnchorId,
            groupMessageAssets,
            searchGroupMessages,
            currentCallParticipants,
            viewerInCall,
            groupNotificationPreference,
            setGroupNotificationPreference,
            notificationItems,
            resolveNotificationFromTrigger,
            markAlertNotificationAndRefresh,
            openNotificationTargetInNewTab,
            removeAlertNotificationAndRefresh,
            removeAlertNotificationsAndRefresh,
            unreadNotifications,
            unreadMessages,
            chatTitle,
            chatPreview,
            chatTime,
            currentCall,
            callForChat,
            pruneExpiredLostFoundItems,
            isSurveyAnswerProvided,
            rippleSurveySubmitButton,
            rippleSurveyChoiceLabel,
            animateSurveyChoiceInteraction,
            waitForSurveySubmitAnimation,
            setSurveySubmitButtonLabel,
            setSurveySubmitButtonIcon,
            flashSurveySubmitButton,
            rerenderSurveyCreateDialog,
            patchSurveyCreateQuestionsPanel,
            captureInteractionState,
            applyCenterScrollRestore,
            applyWindowScrollRestore,
            restoreInteractionState,
            clearSocialCenterScrollBounds,
            measureSocialCenterBottom,
            getSocialCenterContentExtent,
            getSocialCenterViewportHeight,
            socialCenterHasLiveScrollRoom,
            getSocialCenterContentScrollHeight,
            getSocialCenterMaxScroll,
            setSocialRegionMarkup,
            invalidateSocialRenderCache,
            enhanceSocialAccessibility
        };
        Object.assign(window, api);
        return api;
    };
})();
