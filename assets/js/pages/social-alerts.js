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
        displayName,
        renderSocialPageNow,
        withBusy,
        invalidateSocialRenderCache,
        resolvePortalSocialReport,
        markPortalNotificationRead,
        markAlertNotificationAndRefresh,
        removeAlertNotificationAndRefresh,
        removeAlertNotificationsAndRefresh,
        resolveNotificationFromTrigger,
        buildNotificationTargetUrl,
        openNotificationTargetInNewTab
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
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof resolvePortalSocialReport !== 'function'
        || typeof markPortalNotificationRead !== 'function'
        || typeof markAlertNotificationAndRefresh !== 'function'
        || typeof removeAlertNotificationAndRefresh !== 'function'
        || typeof removeAlertNotificationsAndRefresh !== 'function'
        || typeof resolveNotificationFromTrigger !== 'function'
        || typeof buildNotificationTargetUrl !== 'function'
        || typeof openNotificationTargetInNewTab !== 'function'
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

    function formatAlertTime(value) {
        const iso = text(value || '');
        const relative = when(value);
        let fullLabel = relative;
        try {
            const parsed = new Date(iso);
            if (!Number.isNaN(parsed.getTime())) fullLabel = parsed.toLocaleString();
        } catch (error) {}
        return { iso, relative, fullLabel };
    }

    function primaryActionLabel(routePage, routeData) {
        if (routeData?.chatId) return 'Open chat';
        if (routeData?.groupId) return 'Open group';
        if (routePage === 'lms') return 'View grades';
        if (routePage === 'student-service') return 'View ticket';
        if (routePage === 'orders') return 'View order';
        if (routePage === 'social') return 'Open post';
        if (routePage === 'news') return 'Read update';
        return 'Open';
    }

    function renderPillBar(activeFilter, counts) {
        return ALERTS_CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat.id;
            const count = counts[cat.id] || 0;
            const badgeLabel = count > 9 ? '9+' : String(count);
            const ariaLabel = count > 0
                ? `${cat.label}, ${count > 9 ? '9 plus' : count} unread`
                : cat.label;
            const countBadge = count > 0
                ? `<span class="lux-tab-badge home-hover-chip">${escape(badgeLabel)}</span>`
                : '';
            return `<button class="lux-tab-btn lux-tab-btn--icon${isActive ? ' is-active' : ''}" type="button"
                data-action="panel-alerts" data-alerts-filter="${escape(cat.id)}"
                data-category="${escape(cat.id)}"
                aria-selected="${isActive ? 'true' : 'false'}"
                aria-pressed="${isActive ? 'true' : 'false'}"
                aria-label="${escape(ariaLabel)}"
                role="tab">
                <i class="fas ${escape(cat.icon)}" aria-hidden="true"></i>
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
        const notificationKey = text(notification.key || notification.id);
        const time = formatAlertTime(notification.createdAt);
        let actionBtns = '';

        if (routeData.chatId) {
            actionBtns += `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="notification-open-chat" data-chat-id="${escape(text(routeData.chatId))}" data-notification-id="${escape(notificationKey)}"><i class="fas fa-comment-dots" aria-hidden="true"></i><span>Open chat</span></button>`;
        } else if (routeData.groupId) {
            actionBtns += `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="notification-open-group" data-group-id="${escape(text(routeData.groupId))}" data-notification-id="${escape(notificationKey)}"><i class="fas fa-user-group" aria-hidden="true"></i><span>Open group</span></button>`;
        } else {
            actionBtns += `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="notification-follow" data-notification-id="${escape(notificationKey)}"><i class="fas fa-arrow-right" aria-hidden="true"></i><span>${escape(primaryActionLabel(routePage, routeData))}</span></button>`;
        }
        if (!notification.read) {
            actionBtns += `<button class="lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="notification-mark-read" data-notification-id="${escape(notificationKey)}"><i class="fas fa-check" aria-hidden="true"></i><span>Mark read</span></button>`;
        }

        return `
            <article class="sn-alert-card ${notification.read ? '' : 'is-unread'}" data-category="${escape(cat)}" style="--sn-card-accent:${meta.color};--sn-card-accent-rgb:${meta.colorRgb};">
                <div class="sn-alert-card__main">
                    <div class="sn-alert-card-icon" aria-hidden="true">
                        <i class="fas ${escape(catInfo.icon)}"></i>
                    </div>
                    <div class="sn-alert-card__content">
                        <div class="sn-alert-card-head">
                            <strong>${escape(text(notification.title || 'Notification'))}</strong>
                            <span class="sn-alert-card-badge"><i class="fas ${escape(catInfo.icon)}"></i>${escape(catInfo.label)}</span>
                        </div>
                        <p class="sn-alert-card-preview">${escape(text(notification.text || ''))}</p>
                        <div class="sn-alert-card-actions">
                            ${actionBtns}
                        </div>
                    </div>
                </div>
                <aside class="sn-alert-card__aside">
                    <button class="lux-ghost-btn lux-secondary-btn-icon sn-alert-card-dismiss" type="button" data-action="notification-remove" data-notification-id="${escape(notificationKey)}" aria-label="Remove notification"><i class="fas fa-times" aria-hidden="true"></i></button>
                    <time datetime="${escape(time.iso)}" title="${escape(time.fullLabel)}">${escape(time.relative)}</time>
                    ${notification.read ? '' : `<span class="sn-alert-card-dot" aria-label="Unread"></span>`}
                </aside>
            </article>
        `;
    }

    function renderEmptyState(categoryId) {
        const cat = ALERTS_CATEGORIES.find(c => c.id === categoryId) || ALERTS_CATEGORIES[0];
        const meta = CATEGORY_META[categoryId] || CATEGORY_META.all;
        const emptyMessages = {
            all: 'No notifications right now.',
            unread: 'No unread notifications right now.',
            academic: 'Grades, schedule changes, and enrollment updates will appear here.',
            messages: 'Email, chat messages, and call alerts will appear here.',
            social: 'Posts, follows, groups, and event updates will appear here.',
            university: 'Announcements, news, and campus updates will appear here.',
            support: 'Service tickets and moderation alerts will appear here.'
        };
        return `
            <div class="sn-alerts-empty" role="status">
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
        const totalUnread = unreadNotifications();
        const totalAlerts = notifications.length;
        const activeCat = ALERTS_CATEGORIES.find((entry) => entry.id === activeFilter) || ALERTS_CATEGORIES[0];
        const unreadInFilter = activeFilter === 'unread'
            ? totalUnread
            : (counts[activeFilter] || 0);
        const subtitle = activeFilter === 'unread'
            ? (totalUnread ? `${totalUnread} unread notifications` : "You're caught up")
            : activeFilter === 'all'
                ? (totalUnread ? `${totalUnread} unread · ${totalAlerts} total` : `${totalAlerts} alerts · You're caught up`)
                : (counts[activeFilter]
                    ? `${counts[activeFilter]} unread in ${activeCat.label}`
                    : `No unread ${activeCat.label.toLowerCase()} alerts`);

        const markCategory = activeFilter === 'unread' ? 'all' : activeFilter;
        const markLabel = markCategory === 'all'
            ? 'Mark all read'
            : `Mark ${markCategory} read`;
        return `
            <div class="sn-alerts-panel" data-lux-transparency-exempt="1">
                <header class="sn-alerts-header" data-lux-transparency-exempt="1">
                    <div class="sn-alerts-header__toolbar">
                        <div class="sn-alerts-header__title-block">
                            <strong class="sn-alerts-header__title">Filter alerts</strong>
                            <span class="sn-alerts-header__subtitle">${escape(activeCat.label)}${unreadInFilter ? ` · ${unreadInFilter} unread` : ''}</span>
                        </div>
                        <div class="sn-alerts-header__actions">
                            ${visibleNotifications.length ? `
                                <button class="lux-secondary-btn lux-secondary-btn-sm sn-alerts-clear-visible" type="button" data-action="notification-clear-visible">
                                    <i class="fas fa-trash-can"></i>
                                    <span>Clear all</span>
                                </button>
                            ` : ''}
                            ${unreadInFilter > 0 ? `
                                <button class="lux-secondary-btn lux-secondary-btn-sm sn-alerts-mark-read" type="button" data-action="notification-mark-category-read" data-category="${escape(markCategory)}">
                                    <i class="fas fa-check-double"></i>
                                    <span>${escape(markLabel)}</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="sn-alerts-header__filters">
                        <div class="lux-tab-strip lux-tab-strip--segmented sn-alerts-category-filters" role="tablist" aria-label="Filter notifications by category">
                            ${renderPillBar(activeFilter, counts)}
                        </div>
                    </div>
                </header>
                <div class="sn-alerts-list" data-lux-transparency-exempt="1">
                    ${visibleNotifications.length
                        ? visibleNotifications.map(renderNotificationCard).join('')
                        : renderEmptyState(activeFilter)
                    }
                </div>
                ${isAdmin ? `
                    <div class="sn-alerts-moderation">
                        <button class="lux-secondary-btn sn-alerts-mod-toggle" type="button" data-action="alerts-moderation-toggle">
                            <i class="fas fa-shield-halved"></i>
                            <span>Moderation queue</span>
                            <span class="sn-alerts-mod-count">${escape(String(openReports.length))}</span>
                            <i class="fas fa-chevron-down sn-alerts-mod-chevron"></i>
                        </button>
                        <div class="sn-alerts-mod-body" data-bind="alerts-moderation-body">
                            ${openReports.length ? openReports.map((report) => `
                                <article class="sn-alert-card sn-alert-card--report">
                                    <div class="sn-alert-card__main">
                                        <div class="sn-alert-card-icon" aria-hidden="true" style="color:#f43f5e;">
                                            <i class="fas fa-flag"></i>
                                        </div>
                                        <div class="sn-alert-card-body">
                                            <div class="sn-alert-card-head">
                                                <strong>${escape(text(report.targetEntityType || 'content').toUpperCase())}</strong>
                                            </div>
                                            <p class="sn-alert-card-preview">${escape(text(report.reportReason || 'No reason provided.'))}</p>
                                            <textarea class="social-neo-textarea lux-control" rows="2" placeholder="Resolution note (optional)" data-bind="report-resolution-note" data-report-id="${escape(text(report.id))}">${escape(text(state().ui?.reportResolutionNotes?.[text(report.id)] || ''))}</textarea>
                                            <div class="sn-alert-card-actions">
                                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="dismiss">Dismiss</button>
                                                <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="remove">Remove</button>
                                            </div>
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

    function isSocialAlertsClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        if (a === 'report-resolve') return true;
        return a.startsWith('notification-') || a.startsWith('alerts-');
    }

    function handleSocialAlertsClick(action, trigger) {
        if (!isSocialAlertsClickAction(action)) return false;
        if (action === 'report-resolve') {
            const reportId = text(trigger.getAttribute('data-report-id'));
            const note = text(state().ui?.reportResolutionNotes?.[reportId] || '');
            return withBusy(async () => {
                await resolvePortalSocialReport(reportId, trigger.getAttribute('data-report-action') || 'dismiss', note);
                if (state().ui?.reportResolutionNotes) delete state().ui.reportResolutionNotes[reportId];
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('report-resolve');
            });
        }

        if (action === 'notification-mark-read') {
            return withBusy(async () => {
                markAlertNotificationAndRefresh(resolveNotificationFromTrigger(trigger));
            });
        }

        if (action === 'notification-follow') {
            return withBusy(async () => {
                const notification = resolveNotificationFromTrigger(trigger);
                const targetUrl = buildNotificationTargetUrl(notification);
                markAlertNotificationAndRefresh(notification);
                openNotificationTargetInNewTab(targetUrl);
            });
        }

        if (action === 'notification-remove') {
            return withBusy(async () => {
                await removeAlertNotificationAndRefresh(resolveNotificationFromTrigger(trigger));
            });
        }

        if (action === 'notification-clear-visible') {
            return withBusy(async () => {
                const activeFilter = text(state().ui?.alertsFilter || 'all') || 'all';
                const visible = filterNotificationsByView(notificationItems(), activeFilter);
                await removeAlertNotificationsAndRefresh(visible);
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
                const notification = resolveNotificationFromTrigger(trigger);
                const chatId = text(trigger.getAttribute('data-chat-id'));
                markAlertNotificationAndRefresh(notification);
                openNotificationTargetInNewTab(chatId ? `social.html?panel=messages&chatId=${encodeURIComponent(chatId)}` : null);
            });
        }

        if (action === 'notification-open-group') {
            return withBusy(async () => {
                const notification = resolveNotificationFromTrigger(trigger);
                const groupId = text(trigger.getAttribute('data-group-id'));
                markAlertNotificationAndRefresh(notification);
                openNotificationTargetInNewTab(groupId ? `social.html?panel=feed&groupId=${encodeURIComponent(groupId)}` : null);
            });
        }
        return false;
    }

    window.handleSocialAlertsClick = handleSocialAlertsClick;
    window.isSocialAlertsClickAction = isSocialAlertsClickAction;

    function isSocialAlertsInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="report-resolution-note"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialAlertsInput(target, runtime, event) {
        if (!isSocialAlertsInputTarget(target)) return false;
        if (target.matches('[data-bind="report-resolution-note"]')) {
            runtime.ui.reportResolutionNotes = runtime.ui.reportResolutionNotes || {};
            runtime.ui.reportResolutionNotes[text(target.getAttribute('data-report-id'))] = target.value;
        }

        return true;
    }

    function isSocialAlertsChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {
            return false;
        } catch (e) {}
        return false;
    }

    function handleSocialAlertsChange(target, runtime, event) {
        if (!isSocialAlertsChangeTarget(target)) return false;
        return false;

        return true;
    }

    window.handleSocialAlertsInput = handleSocialAlertsInput;
    window.isSocialAlertsInputTarget = isSocialAlertsInputTarget;
    window.handleSocialAlertsChange = handleSocialAlertsChange;
    window.isSocialAlertsChangeTarget = isSocialAlertsChangeTarget;

})();
