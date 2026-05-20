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
        || typeof unreadNotifications !== 'function'
        || typeof escape !== 'function'
        || typeof when !== 'function'
        || typeof roleValue !== 'function'
        || typeof accountById !== 'function'
        || typeof displayName !== 'function'
    ) {
        throw new Error('Social alerts hooks are unavailable.');
    }

    window.renderAlertsPanel = function renderAlertsPanel() {
        const user = currentUser();
        const notifications = notificationItems();
        const reports = Array.isArray(state().social?.reports) ? state().social.reports : [];
        const alertsFilter = text(state().ui?.alertsFilter || 'unread') || 'unread';
        const visibleNotifications = filterNotificationsByView(notifications, alertsFilter);
        const priorityNotifications = visibleNotifications.filter((notification) => classifyNotification(notification) !== 'system');
        const systemNotifications = visibleNotifications.filter((notification) => classifyNotification(notification) === 'system');
        const openReports = reports.filter((report) => text(report.reportStatus || 'open') === 'open');
        const isAdmin = text(user?.role) === roleValue('ADMIN', 'admin');
        const digest = {
            mentions: notifications.filter((item) => text(item.type) === 'mention' && !item.read).length,
            replies: notifications.filter((item) => text(item.type) === 'comment-reply' && !item.read).length,
            reminders: notifications.filter((item) => text(item.type) === 'event-reminder' && !item.read).length,
            approvals: notifications.filter((item) => text(item.type).includes('approval') && !item.read).length
        };
        return `
            <div class="social-neo-grid-2">
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div><strong>Activity digest</strong></div>
                        <span class="social-neo-pill"><strong>${escape(unreadNotifications())}</strong><span>Unread</span></span>
                    </div>
                    <div class="social-neo-badge-row">
                        <span class="social-neo-pill">${escape(digest.mentions)} mentions</span>
                        <span class="social-neo-pill">${escape(digest.replies)} replies</span>
                        <span class="social-neo-pill">${escape(digest.approvals)} approvals</span>
                        <span class="social-neo-pill">${escape(digest.reminders)} reminders</span>
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
                        <div><strong>${isAdmin ? 'Moderation queue' : 'Social reminders'}</strong></div>
                        <span class="social-neo-pill"><strong>${escape(isAdmin ? openReports.length : digest.reminders)}</strong><span>${isAdmin ? 'Open reports' : 'Pending'}</span></span>
                    </div>
                    ${isAdmin ? `
                        <div class="social-neo-list">
                            ${openReports.length ? openReports.map((report) => `
                                <article class="social-neo-alert">
                                    <div style="width:100%">
                                        <strong>${escape(text(report.targetEntityType || 'content').toUpperCase())}</strong>
                                        <p>${escape(text(report.reportReason || 'No reason provided.'))}</p>
                                        <div class="social-neo-badge-row">
                                            <span class="social-neo-pill">${escape(text(report.targetEntityType || 'post'))}</span>
                                            <span class="social-neo-pill">${escape(text(report.targetEntityId || ''))}</span>
                                        </div>
                                        <textarea class="social-neo-textarea" rows="2" placeholder="Resolution note (optional)" data-bind="report-resolution-note" data-report-id="${escape(text(report.id))}">${escape(text(state().ui?.reportResolutionNotes?.[text(report.id)] || ''))}</textarea>
                                    </div>
                                    <div class="social-neo-inline">
                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="dismiss">Dismiss</button>
                                        <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="report-resolve" data-report-id="${escape(text(report.id))}" data-report-action="remove">Remove</button>
                                    </div>
                                </article>
                            `).join('') : `<div class="social-neo-empty">No open reports.</div>`}
                        </div>
                    ` : `
                        <div class="social-neo-list">
                            <article class="social-neo-entity-card">
                                <div>
                                    <strong>Reply and mention follow-up</strong>
                                    <span>Unread mentions and reply alerts stay here until you clear them.</span>
                                </div>
                            </article>
                            <article class="social-neo-entity-card">
                                <div>
                                    <strong>Event reminders</strong>
                                    <span>Your RSVP reminders are generated from profile reminder settings.</span>
                                </div>
                            </article>
                        </div>
                    `}
                </section>
                ${isAdmin ? `
                    <section class="social-neo-card">
                        <div class="social-neo-section-head">
                            <div><strong>Moderation history</strong></div>
                        </div>
                        <div class="social-neo-list">
                            ${reports.length ? reports.map((report) => `
                                <article class="social-neo-entity-card">
                                    <div>
                                        <strong>${escape(text(report.targetEntityType || 'Item'))} / ${escape(text(report.targetEntityId || 'Unknown'))}</strong>
                                        <span>${escape(text(report.reportReason || 'No reason supplied.'))}</span>
                                        <div class="social-neo-badge-row">
                                            <span class="social-neo-pill">${escape(text(report.reportStatus || 'open'))}</span>
                                            <span class="social-neo-pill">${escape(when(report.createdAt))}</span>
                                            ${report.resolvedAt ? `<span class="social-neo-pill">Resolved ${escape(when(report.resolvedAt))}</span>` : ''}
                                            ${report.resolvedBy ? `<span class="social-neo-pill">By ${escape(displayName(accountById(report.resolvedBy) || { id: report.resolvedBy }))}</span>` : ''}
                                        </div>
                                        ${report.resolutionNote ? `<p>${escape(text(report.resolutionNote))}</p>` : ''}
                                    </div>
                                </article>
                            `).join('') : `<div class="social-neo-empty">No moderation reports.</div>`}
                        </div>
                    </section>
                ` : ''}
            </div>
        `;
    };
})();
