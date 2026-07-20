/* Social alerts classification / filter pure helpers.
 * Eager: social.html before social-page.js.
 * ESM leaf: social.html type=module; classic bridge for defer consumers.
 */
'use strict';

function hooks() {
    return window.__kiuSocialAlertsModelHooks || window.__kiuSocialPanelHooks || {};
}

function text(value) {
    const hook = hooks().text;
    if (typeof hook === 'function') return hook(value);
    return String(value == null ? '' : value).trim();
}

const ALERTS_CATEGORIES = [
    { id: 'all', label: 'All', icon: 'fa-inbox' },
    { id: 'academic', label: 'Academic', icon: 'fa-graduation-cap' },
    { id: 'messages', label: 'Messages', icon: 'fa-envelope' },
    { id: 'social', label: 'Social', icon: 'fa-users' },
    { id: 'university', label: 'University', icon: 'fa-bullhorn' },
    { id: 'support', label: 'Support', icon: 'fa-headset' }
];

function classifyNotification(notification) {
    const nType = String(notification?.type || '').toLowerCase();
    const blob = `${text(notification?.title)} ${text(notification?.text)}`.toLowerCase();
    if (notification?.routeData?.chatId || nType === 'message' || nType === 'chat' || /message|chat|thread|reply/.test(blob)) return 'message';
    if (nType === 'mention' || /mention|tagged|mentioned|@/.test(blob)) return 'mention';
    if (nType === 'call' || /call|video|voice/.test(blob)) return 'call';
    return 'system';
}

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

function buildNotificationTargetUrl(notification) {
    if (!notification) return null;
    const routePage = text(notification.routePage || '');
    const routeData = notification.routeData || {};
    if (routeData.chatId) {
        return `social.html?panel=messages&chatId=${encodeURIComponent(text(routeData.chatId))}`;
    }
    if (routeData.groupId) {
        return `social.html?panel=feed&groupId=${encodeURIComponent(text(routeData.groupId))}`;
    }
    if (routeData.eventId) {
        return `social.html?panel=events&eventId=${encodeURIComponent(text(routeData.eventId))}`;
    }
    if (routeData.postId) {
        return `social.html?panel=feed&postId=${encodeURIComponent(text(routeData.postId))}`;
    }
    if (routePage === 'social') {
        const socialRoute = text(routeData.socialRoute || '');
        return socialRoute ? `social.html?${socialRoute}` : 'social.html';
    }
    if (routePage === 'lms' && routeData.courseId && routeData.groupId) {
        return `lms.html?courseId=${encodeURIComponent(text(routeData.courseId))}&groupId=${encodeURIComponent(text(routeData.groupId))}`;
    }
    if (routePage === 'student-service') {
        const ticketId = text(routeData.ticketId || '');
        return ticketId ? `student-service.html?ticketId=${encodeURIComponent(ticketId)}` : 'student-service.html';
    }
    if (routePage === 'orders') {
        const orderId = text(routeData.orderId || '');
        return orderId ? `orders.html?orderId=${encodeURIComponent(orderId)}` : 'orders.html';
    }
    if (routePage === 'news') {
        const postId = text(routeData.postId || '');
        return postId ? `news.html?postId=${encodeURIComponent(postId)}` : 'news.html';
    }
    if (routePage) {
        if (routePage.endsWith('.html')) return routePage;
        return `${routePage}.html`;
    }
    return null;
}


export const socialAlertsModelApi = {
    buildNotificationTargetUrl,
    ALERTS_CATEGORIES,
    classifyNotification,
    classifyNotificationCategory,
    getCategoryUnreadCounts,
    filterNotificationsByView
};

/** Install classic window / Kiu surface (idempotent). */
export function installSocialAlertsModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_ALERTS_MODEL_LOADED) {
        return target?.KiuSocialAlertsModel || socialAlertsModelApi;
    }
    target.__KIU_SOCIAL_ALERTS_MODEL_LOADED = true;
    target.__kiuSocialAlertsModelExports = socialAlertsModelApi;
    target.KiuSocialAlertsModel = socialAlertsModelApi;
    Object.keys(socialAlertsModelApi).forEach((key) => {
        target[key] = socialAlertsModelApi[key];
    });
    return socialAlertsModelApi;
}

// type=module script tag: assign window surface for classic defer consumers
installSocialAlertsModel();

