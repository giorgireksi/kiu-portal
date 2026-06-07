(function initSocialAlertsModule() {
    if (window.__KIU_SOCIAL_ALERTS_MODULE_LOADED) return;
    window.__KIU_SOCIAL_ALERTS_MODULE_LOADED = true;

    const hooks = window.__kiuSocialAlertsHooks || {};
    const {
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
    } = hooks;

    if (
        typeof currentUser !== 'function'
        || typeof notificationItems !== 'function'
        || typeof state !== 'function'
        || typeof text !== 'function'
        || typeof filterNotificationsByView !== 'function'
        || typeof classifyNotification !== 'function'
        || typeof classifyNotificationCategory !== 'function'
        || typeof getCategoryUnreadCounts !== 'function'
        || !Array.isArray(ALERTS_CATEGORIES)
        || typeof unreadNotifications !== 'function'
        || typeof escape !== 'function'
        || typeof when !== 'function'
        || typeof roleValue !== 'function'
        || typeof accountById !== 'function'
        || typeof displayName !== 'function'
    ) {
        throw new Error('Social alerts hooks are unavailable.');
    }

    const CATEGORY_META = {
        all:        { color: 'var(--sn-accent, #c8822a)',  colorRgb: '200,130,42' },
        academic:   { color: '#f59e0b', colorRgb: '245,158,11' },
        messages:   { color: '#3b82f6', colorRgb: '59,130,246' },
        social:     { color: '#10b981', colorRgb: '16,185,129' },
        university: { color: '#f43f5e', colorRgb: '244,63,94' },
        support:    { color: '#8b5cf6', colorRgb: '139,92,246' }
    };

    function renderPillBar(activeFilter, counts) {
        return ALERTS_CATEGORIES.map(cat => {
            const isActive = activeFilter === cat.id;
            const count = counts[cat.id] || 0;
            const meta = CATEGORY_META[cat.id] || CATEGORY_META.all;
            const activeStyle = isActive
                ? `background:${meta.color};color:#fff;box-shadow:0 4px 14px rgba(${meta.colorRgb},0.35);`
                : '';
            const countBadge = count > 0
                ? `<span class="sn-alerts-pill-count" ${isActive ? '' : `style="background:rgba(${meta.colorRgb},0.15);color:${meta.color};"`}>${escape(String(count))}</span>`
                : '';
            return `<button class="sn-alerts-pill${isActive ? ' is-active' : ''}" type="button"
                data-action="panel-alerts" data-alerts-filter="${escape(cat.id)}"
                style="${activeStyle}"
                aria-selected="${isActive ? 'true' : 'false'}" role="tab">
                <i class="fas ${escape(cat.icon)}"></i>
                <span>${escape(cat.label)}</span>
                ${countBadge}
            </button>`;
        }).join('');
    }

    function renderNotificationCard(notification) {
        const cat = classifyNotificationCategory(notification);
        const meta = CATEGORY_META[cat] || CATEGORY_META.all;
        const catInfo = ALERTS_CATEGORIES.find(c => c.id === cat) || ALERTS_CATEGORIES[0];
        const routePage = text(notification.routePage || '');
        const routeData = notification.routeData || {};
        let actionBtns = '';
        if (routeData.chatId) {
            actionBtns += `<button class="social-neo-link-btn" type="button" data-action="notification-open-chat" data-chat-id="${escape(text(routeData.chatId))}" data-notification-id="${escape(text(notification.id))}">Open chat</button>`;
        } else if (routeData.groupId) {
            actionBtns += `<button class="social-neo-link-btn" type="button" data-action="notification-open-group" data-group-id="${escape(text(routeData.groupId))}" data-notification-id="${escape(text(notification.id))}">Open group</button>`;
        } else if (routePage === 'lms' || routePage === 'student-service' || routePage === 'orders') {
            actionBtns += `<button class="social-neo-link-btn" type="button" data-action="notification-read" data-notification-id="${escape(text(notification.id))}">View</button>`;
        }
        if (!notification.read) {
            actionBtns += `<button class="social-neo-link-btn" type="button" data-action="notification-read" data-notification-id="${escape(text(notification.id))}">Mark read</button>`;
        }
        return `
            <article class="sn-alert-card ${notification.read ? '' : 'is-unread'}" data-category="${escape(cat)}" style="--sn-card-accent:${meta.color};--sn-card-accent-rgb:${meta.colorRgb};">
                <div class="sn-alert-card-icon" aria-hidden="true">
                    <i class="fas ${escape(catInfo.icon)}"></i>
                </div>
                <div class="sn-alert-card-body">
                    <div class="sn-alert-card-head">
                        <strong>${escape(text(notification.title || 'Notification'))}</strong>
                        <span class="sn-alert-card-time">${escape(when(notification.createdAt))}</span>
                    </div>
                    <p>${escape(text(notification.text || ''))}</p>
                    <div class="sn-alert-card-actions">
                        ${actionBtns}
                    </div>
                </div>
                ${notification.read ? '' : `<span class="sn-alert-card-dot" aria-label="Unread"></span>`}
            </article>
        `;
    }

    function renderEmptyState(categoryId) {
        const cat = ALERTS_CATEGORIES.find(c => c.id === categoryId) || ALERTS_CATEGORIES[0];
        const meta = CATEGORY_META[categoryId] || CATEGORY_META.all;
        const emptyMessages = {
            all: 'No notifications right now.',
            academic: 'Grades, schedule changes, and enrollment updates will appear here.',
            messages: 'Email, chat messages, and call alerts will appear here.',
            social: 'Posts, follows, groups, and event updates will appear here.',
            university: 'Announcements, news, and campus updates will appear here.',
            support: 'Service tickets and moderation alerts will appear here.'
        };
        return `
            <div class="sn-alerts-empty">
                <div class="sn-alerts-empty-icon" style="color:${meta.color};">
                    <i class="fas ${escape(cat.icon)}"></i>
                </div>
                <p>${escape(emptyMessages[categoryId] || emptyMessages.all)}</p>
            </div>
        `;
    }

    window.renderAlertsPanel = function renderAlertsPanel() {
        const user = currentUser();
        const notifications = notificationItems();
        const reports = Array.isArray(state().social?.reports) ? state().social.reports : [];
        const activeFilter = text(state().ui?.alertsFilter || 'all') || 'all';
        const counts = getCategoryUnreadCounts(notifications);
        const visibleNotifications = filterNotificationsByView(notifications, activeFilter);
        const openReports = reports.filter((report) => text(report.reportStatus || 'open') === 'open');
        const isAdmin = text(user?.role) === roleValue('ADMIN', 'admin');

        const markLabel = activeFilter === 'all'
            ? 'Mark all read'
            : `Mark ${activeFilter} read`;

        return `
            <div class="sn-alerts-panel">
                ${counts[activeFilter] > 0 ? `
                    <div class="sn-alerts-actions">
                        <button class="sn-alerts-mark-read" type="button" data-action="notification-mark-category-read" data-category="${escape(activeFilter)}">
                            <i class="fas fa-check-double"></i>
                            <span>${escape(markLabel)}</span>
                        </button>
                    </div>
                ` : ''}
                <div class="sn-alerts-list">
                    ${visibleNotifications.length
                        ? visibleNotifications.map(renderNotificationCard).join('')
                        : renderEmptyState(activeFilter)
                    }
                </div>
                ${isAdmin ? `
                    <div class="sn-alerts-moderation">
                        <button class="sn-alerts-mod-toggle" type="button" data-action="alerts-moderation-toggle">
                            <i class="fas fa-shield-halved"></i>
                            <span>Moderation queue</span>
                            <span class="sn-alerts-mod-count">${escape(String(openReports.length))}</span>
                            <i class="fas fa-chevron-down sn-alerts-mod-chevron"></i>
                        </button>
                        <div class="sn-alerts-mod-body" data-bind="alerts-moderation-body">
                            ${openReports.length ? openReports.map((report) => `
                                <article class="sn-alert-card sn-alert-card--report">
                                    <div class="sn-alert-card-icon" aria-hidden="true" style="color:#f43f5e;">
                                        <i class="fas fa-flag"></i>
                                    </div>
                                    <div class="sn-alert-card-body">
                                        <div class="sn-alert-card-head">
                                            <strong>${escape(text(report.targetEntityType || 'content').toUpperCase())}</strong>
                                        </div>
                                        <p>${escape(text(report.reportReason || 'No reason provided.'))}</p>
                                        <textarea class="social-neo-textarea" rows="2" placeholder="Resolution note (optional)" data-bind="report-resolution-note" data-report-id="${escape(text(report.id))}">${escape(text(state().ui?.reportResolutionNotes?.[text(report.id)] || ''))}</textarea>
                                        <div class="sn-alert-card-actions">
                                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="dismiss">Dismiss</button>
                                            <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="remove">Remove</button>
                                        </div>
                                    </div>
                                </article>
                            `).join('') : `<div class="social-neo-empty">No open reports.</div>`}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    };
})();
