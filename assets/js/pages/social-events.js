(function initSocialEventsModule() {
    if (window.__KIU_SOCIAL_EVENTS_MODULE_LOADED) return;
    window.__KIU_SOCIAL_EVENTS_MODULE_LOADED = true;

    const hooks = window.__kiuSocialEventsHooks || {};
    const {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        when,
        eventCanManage,
        controlId,
        activeDialog,
        eventScopeOptions,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        clearEventDraft,
        prefillEventEditDraft,
        patchEventRsvpButtons,
        respondPortalSocialEventRsvp,
        invalidateSocialRenderCache,
        ensureSocialGroupsModule,
        closeDialog,
        createPortalSocialEvent,
        deletePortalSocialEvent,
        updatePortalSocialEvent,
        fromDateTimeLocalValue,
        readFileAsDataUrl
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof currentUser !== 'function'
        || typeof currentUserId !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof when !== 'function'
        || typeof eventCanManage !== 'function'
        || typeof controlId !== 'function'
        || typeof activeDialog !== 'function'
        || typeof eventScopeOptions !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof clearEventDraft !== 'function'
        || typeof prefillEventEditDraft !== 'function'
        || typeof patchEventRsvpButtons !== 'function'
        || typeof respondPortalSocialEventRsvp !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof ensureSocialGroupsModule !== 'function'
        || typeof closeDialog !== 'function'
        || typeof createPortalSocialEvent !== 'function'
        || typeof deletePortalSocialEvent !== 'function'
        || typeof updatePortalSocialEvent !== 'function'
        || typeof fromDateTimeLocalValue !== 'function'
        || typeof readFileAsDataUrl !== 'function'
    ) {
        throw new Error('Social events hooks are unavailable.');
    }

    function renderEventsHero(runtime, activeTab, metrics = {}, createActionConfig = {}) {
        const totalEvents = Number(metrics.totalEvents || 0);
        const studentEvents = Number(metrics.studentEvents || 0);
        const universityEvents = Number(metrics.universityEvents || 0);
        const studyGroups = Number(metrics.studyGroups || 0);
        const stats = [
            { label: 'Total events', value: totalEvents },
            { label: 'Student', value: studentEvents },
            { label: 'University', value: universityEvents },
            { label: 'Study groups', value: studyGroups },
        ];
        const subtitles = {
            student: 'Community-led sessions, club meetups, and class-driven activity.',
            university: 'Official sessions, administration announcements, and faculty-led programming.',
            studygroups: 'Course circles, practice sessions, and small recurring study teams.',
        };
        const tabs = [
            { tab: 'student', label: 'Student events', icon: 'fa-calendar-days', helper: 'Clubs, meetups, study jams' },
            { tab: 'university', label: 'University events', icon: 'fa-landmark', helper: 'Official sessions and notices' },
            { tab: 'studygroups', label: 'Study groups', icon: 'fa-users', helper: 'Course circles and practice teams' },
        ];
        const hints = [
            { icon: 'fa-calendar-day', title: 'Time grouping', text: 'Events are organized by today, upcoming, and category lanes.' },
            { icon: 'fa-location-dot', title: 'Useful cards', text: 'Date, host, location, online link, and RSVP stay visible.' },
            { icon: 'fa-bell', title: 'Reminder-ready', text: 'The interface leaves room for reminder and capacity states.' },
        ];
        const actionConfig = createActionConfig && typeof createActionConfig === 'object' ? createActionConfig : {};
        const sectionsHtml = text(metrics.sectionsHtml || '');
        const merged = Boolean(sectionsHtml);
        return `
            <section class="social-neo-card social-neo-events-hero${merged ? ' is-merged' : ''}">
                <div class="social-neo-events-hero-head">
                    <div class="social-neo-events-hero-actions">
                        <button class="lux-primary-btn social-neo-events-create-trigger" type="button" data-action="event-create-open">
                            <i class="fas ${escape(text(actionConfig.icon || 'fa-calendar-plus'))}"></i>
                            <span>${escape(text(actionConfig.label || 'Create event'))}</span>
                        </button>
                    </div>
                </div>
                <div class="social-neo-events-hero-stats">
                    ${stats.map((stat) => `
                        <article class="social-neo-events-hero-stat lux-strip-card surface-card">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                <div class="social-neo-events-hero-grid">
                    ${tabs.map((tab) => `
                        <button class="lux-secondary-btn social-neo-events-hero-tab ${activeTab === tab.tab ? 'is-focused' : ''}" type="button" data-action="panel-events" data-events-tab="${escape(tab.tab)}" aria-pressed="${activeTab === tab.tab ? 'true' : 'false'}">
                            <span class="social-neo-events-hero-tab-icon"><i class="fas ${escape(tab.icon)}"></i></span>
                            <span class="social-neo-events-hero-tab-copy">
                                <strong>${escape(tab.label)}</strong>
                                <small>${escape(tab.helper)}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
                ${merged ? `
                    <div class="social-neo-events-hero-divider" aria-hidden="true"></div>
                    ${sectionsHtml}
                ` : ''}
            </section>
        `;
    }

    function renderEventsPanel() {
        const runtime = state();
        const eventsTab = text(runtime.ui?.eventsSubTab || 'student');
        const allEvents = Array.isArray(runtime.social?.events) ? runtime.social.events : [];
        const userRole = text(currentUser()?.role || 'student');
        const isStaff = ['professor', 'ta', 'admin', 'student_service'].includes(userRole);
        const uniEvents = allEvents.filter((entry) => entry.category === 'university' || entry.isOfficial);
        const studentEvents = allEvents.filter((entry) => entry.category !== 'university' && !entry.isOfficial);
        const manageableStudentEvents = studentEvents.filter((entry) => eventCanManage(entry));
        const manageableUniversityEvents = uniEvents.filter((entry) => eventCanManage(entry));
        const studyGroups = Array.isArray(runtime.social?.groups)
            ? runtime.social.groups.filter((group) => group.type === 'study' || (group.tags || []).includes('study'))
            : [];
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

        function eventDateLabel(item) {
            const stamp = item?.startsAt ? new Date(item.startsAt) : null;
            const validStamp = stamp && !Number.isNaN(stamp.getTime()) ? stamp : null;
            return validStamp
                ? validStamp.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                : 'To be announced';
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
            const eventId = text(item.id);
            const scopeLabel = text(item.scopeName || (tone === 'university' ? 'Campus-wide official listing' : 'Community event feed'));
            return `
                <article class="social-neo-event-feature social-neo-event-feature--${escape(tone)}">
                    ${item.imageUrl ? `
                        <div class="social-neo-event-feature-cover">
                            <img src="${escape(item.imageUrl)}" alt="${escape(title)}">
                        </div>
                    ` : ''}
                    <div class="social-neo-event-feature-head">
                        <div class="social-neo-event-feature-head-top">
                            <div class="social-neo-event-feature-datebox">
                                <span>${escape(monthLabel)}</span>
                                <strong>${escape(dayLabel)}</strong>
                            </div>
                            <div class="social-neo-badge-row social-neo-events-badges">
                                <span class="social-neo-pill social-neo-event-category-pill is-${escape(tone)}">${escape(categoryLabel)}</span>
                                ${item.isOfficial ? '<span class="social-neo-pill">Official</span>' : ''}
                                ${item.isOnline ? '<span class="social-neo-pill">Online</span>' : ''}
                                ${item.isRecurring ? '<span class="social-neo-pill">Recurring</span>' : ''}
                                ${item.maxSeats ? `<span class="social-neo-pill">${escape(seatSummary)}</span>` : ''}
                            </div>
                            ${eventCanManage(item) ? `
                                <div class="social-neo-event-feature-head-actions">
                                    <span class="social-neo-pill social-neo-events-owner-pill">You manage this</span>
                                    <button class="lux-secondary-btn social-neo-events-edit-btn social-neo-events-edit-btn--head" type="button" data-action="event-edit-open" data-event-id="${escape(eventId)}"><i class="fas fa-pen"></i> Edit</button>
                                </div>
                            ` : ''}
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
                    <div class="social-neo-event-feature-bar">
                        <div class="social-neo-event-feature-host">
                            <small>Hosted by</small>
                            <strong>${escape(scopeLabel)}</strong>
                        </div>
                        <div class="social-neo-event-feature-actions">
                            <button class="lux-secondary-btn ${item.viewerRsvpStatus === 'going' ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="event-rsvp" data-event-id="${escape(eventId)}" data-status="going">Going</button>
                            <button class="lux-secondary-btn ${item.viewerRsvpStatus === 'interested' ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="event-rsvp" data-event-id="${escape(eventId)}" data-status="interested">Interested</button>
                            <button class="lux-secondary-btn ${item.viewerRsvpStatus === 'declined' ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="event-rsvp" data-event-id="${escape(eventId)}" data-status="declined">Decline</button>
                            ${item.viewerCanDelete ? `<button class="lux-secondary-btn social-neo-events-delete-btn" type="button" data-action="event-delete-open" data-event-id="${escape(eventId)}"><i class="fas fa-trash"></i> Remove event</button>` : ''}
                        </div>
                    </div>
                    <div class="social-neo-event-feature-foot">
                        <div class="lux-scroll-rail social-neo-event-feature-desc-rail" data-lux-scroll-rail data-event-desc-rail="${escape(eventId)}">
                            <div class="lux-scroll-rail__controls social-neo-event-feature-desc-controls" aria-hidden="true">
                                <div class="lux-scroll-rail__dock" role="group" aria-label="Scroll event description">
                                    <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="up" aria-label="Scroll description up"><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
                                    <span class="lux-scroll-rail__spine" aria-hidden="true"></span>
                                    <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="down" aria-label="Scroll description down"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                                </div>
                            </div>
                            <div class="lux-scrollbar lux-scroll-rail__viewport social-neo-event-feature-desc-viewport" aria-label="Event description">
                                <p class="social-neo-event-feature-desc" data-event-desc="${escape(eventId)}">${escape(description)}</p>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }

        function renderEventGroups(list, tone, emptyCopy) {
            const events = sortEventsByStart(list);
            if (!events.length) return `<div class="social-neo-empty social-neo-events-empty">${escape(emptyCopy)}</div>`;
            return events.map((item) => {
                const title = text(item.title || 'Untitled event');
                return `
                <section class="social-neo-event-date-group">
                    <div class="social-neo-event-date-group-head">
                        <div>
                            <strong>${escape(eventDateLabel(item))}</strong>
                            <span>1 event</span>
                            <h3 class="social-neo-event-date-group-title">${escape(title)}</h3>
                        </div>
                        <span class="social-neo-pill">${escape(tone === 'university' ? 'Official lane' : 'Student lane')}</span>
                    </div>
                    <div class="social-neo-event-date-group-body">
                        ${renderEventFeatureCard(item, tone)}
                    </div>
                </section>
            `;
            }).join('');
        }

        function renderManagedEventsCard(title, list, emptyCopy) {
            return `
                <div class="social-neo-events-hub-section social-neo-events-manage-card">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>${escape(title)}</strong>
                            <span>Events you created can be edited or removed from here if details need to change.</span>
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
                                    <button class="lux-primary-btn social-neo-events-edit-btn social-neo-events-edit-btn--manage" type="button" data-action="event-edit-open" data-event-id="${escape(text(item.id))}"><i class="fas fa-pen"></i> Edit</button>
                                    <button class="lux-secondary-btn social-neo-events-delete-btn" type="button" data-action="event-delete-open" data-event-id="${escape(text(item.id))}">
                                        <i class="fas fa-trash"></i> Remove
                                    </button>
                                </div>
                            </article>
                        `).join('') : `<div class="social-neo-empty social-neo-events-empty">${escape(emptyCopy)}</div>`}
                    </div>
                </div>
            `;
        }

        const studyGroupsListCard = `
            <div class="social-neo-events-hub-section social-neo-events-list-card">
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
                                    ? `<button class="lux-primary-btn" type="button" data-action="group-chat" data-group-id="${escape(text(group.id))}">Open chat</button>
                                       <button class="lux-ghost-btn" type="button" data-action="group-leave-open" data-group-id="${escape(text(group.id))}">Leave</button>`
                                    : group.membershipState === 'pending'
                                        ? '<span class="social-neo-pill">Pending</span>'
                                        : `<button class="lux-primary-btn" type="button" data-action="group-join" data-group-id="${escape(text(group.id))}">${text(group.visibility) === 'private' ? 'Request to join' : 'Join'}</button>`
                                }
                            </div>
                        </article>
                    `).join('') : '<div class="social-neo-empty">No study groups yet. Be the first to create one.</div>'}
                </div>
            </div>
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

        const eventHeroMetrics = {
            totalEvents: allEvents.length,
            studentEvents: studentEvents.length,
            universityEvents: uniEvents.length,
            studyGroups: studyGroups.length
        };

        const activeSectionMarkup = eventsTab === 'university'
            ? `
                <div class="social-neo-events-hub-body social-neo-events-lane social-neo-events-lane--university ${universitySectionState}">
                    <div class="social-neo-events-content">
                        ${renderManagedEventsCard('Your official events', manageableUniversityEvents, 'You have not published any removable official events yet.')}
                        <div class="social-neo-events-hub-section social-neo-events-list-card">
                            <div class="social-neo-section-head">
                                <div>
                                    <strong>Official university calendar</strong>
                                    <span>Faculty and administration notices stay separate from community-driven student activity.</span>
                                </div>
                            </div>
                            <div class="social-neo-stack">${renderEventGroups(uniEvents, 'university', 'No official university events have been published yet.')}</div>
                        </div>
                    </div>
                </div>
            `
            : eventsTab === 'studygroups'
                ? `
                    <div class="social-neo-events-hub-body social-neo-events-support-card ${studySectionState}">
                        <div class="social-neo-events-content">
                            ${studyGroupsListCard}
                        </div>
                    </div>
                `
                : `
                    <div class="social-neo-events-hub-body social-neo-events-lane social-neo-events-lane--student ${studentSectionState}">
                        <div class="social-neo-events-content">
                            ${renderManagedEventsCard('Your student events', manageableStudentEvents, 'You have not created any removable student events yet.')}
                            <div class="social-neo-events-hub-section social-neo-events-list-card">
                                <div class="social-neo-section-head">
                                    <div>
                                        <strong>Student event calendar</strong>
                                        <span>Grouped by date, with the important details visible before people click anything.</span>
                                    </div>
                                </div>
                                <div class="social-neo-stack">${renderEventGroups(studentEvents, 'student', 'No student events yet. Publish the first community event in this lane.')}</div>
                            </div>
                        </div>
                    </div>
                `;

        return `
            <div class="social-neo-stack social-neo-events-shell social-neo-events-shell--merged">
                ${renderEventsHero(runtime, eventsTab, {
                    ...eventHeroMetrics,
                    sectionsHtml: activeSectionMarkup
                }, createActionConfig)}
            </div>
        `;
    }

    function renderEventCreateDialog(runtime) {
        const dialog = activeDialog() || {};
        const variant = text(dialog.variant || runtime.ui?.eventsSubTab || 'student') || 'student';
        const userRole = text(currentUser()?.role || 'student');
        const isStaff = ['professor', 'ta', 'admin', 'student_service'].includes(userRole);
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
        const isUniversity = variant === 'university';
        const isEditing = Boolean(text(runtime.ui?.eventEditId || dialog.eventId));
        const title = isEditing
            ? (isUniversity ? 'Edit official event' : 'Edit student event')
            : (isUniversity ? 'Publish official event' : 'Create student event');
        const subtitle = isEditing
            ? 'Update the details students and attendees will see.'
            : (isUniversity
                ? 'Advanced publishing for official notices, faculty sessions, and university-wide programming.'
                : 'Advanced publishing for student-led meetups, sessions, and community activity.');
        const submitLabel = isEditing ? 'Update event' : (isUniversity ? 'Publish official event' : 'Create student event');
        const submitIcon = isEditing ? 'fa-pen' : (isUniversity ? 'fa-university' : 'fa-calendar-plus');
        if (isUniversity && !isStaff) {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--event-create lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-lux-transparency-exempt="1">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Official events', 'Faculty and administrators can publish campus-wide events here.', { icon: 'fas fa-landmark' }) : ''}
                    <p class="lux-glass-dialog-hint">Official university announcements, exam sessions, and administration-led events are published by staff accounts.</p>
                    <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="button" data-action="dialog-close">Got it</button>
                    </div>
                </div>
            </div>`;
        }
        const hiddenFields = isUniversity ? `
            <input type="hidden" name="eventCategory" value="university">
            <input type="hidden" name="eventIsOfficial" value="true">
        ` : '';
        const categoryField = isUniversity ? '' : `
            <label class="lux-glass-dialog-field" for="${escape(eventCategoryId)}">
                <span class="social-neo-label">Category</span>
                <select class="social-neo-select lux-control" id="${escape(eventCategoryId)}" name="eventCategory" data-lux-picker>
                    <option value="social" ${text(runtime.ui?.eventCategory || 'social') === 'social' ? 'selected' : ''}>Social</option>
                    <option value="academic" ${text(runtime.ui?.eventCategory) === 'academic' ? 'selected' : ''}>Academic</option>
                    <option value="club" ${text(runtime.ui?.eventCategory) === 'club' ? 'selected' : ''}>Club</option>
                    <option value="career" ${text(runtime.ui?.eventCategory) === 'career' ? 'selected' : ''}>Career</option>
                    <option value="study" ${text(runtime.ui?.eventCategory) === 'study' ? 'selected' : ''}>Study session</option>
                    <option value="other" ${text(runtime.ui?.eventCategory) === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </label>
        `;
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--event-create lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-form="create-event" data-action="noop" data-lux-transparency-exempt="1">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <strong class="lux-glass-dialog-title"><i class="fas ${isEditing ? 'fa-pen' : (isUniversity ? 'fa-landmark' : 'fa-calendar-plus')}" aria-hidden="true"></i> ${escape(title)}</strong>
                        <span class="lux-glass-dialog-subtitle">${escape(subtitle)}</span>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body lux-glass-dialog-body--event-create">
                    ${hiddenFields}
                    <label class="lux-glass-dialog-field" for="${escape(eventTitleId)}">
                        <span class="social-neo-label">Event title</span>
                        <input class="social-neo-input lux-control" id="${escape(eventTitleId)}" type="text" name="eventTitle" placeholder="${isUniversity ? 'Official event title' : 'Event title'}" value="${escape(text(runtime.ui?.eventTitle || ''))}" required>
                    </label>
                    <label class="lux-glass-dialog-field" for="${escape(eventDescId)}">
                        <span class="social-neo-label">Description</span>
                        <textarea class="social-neo-textarea lux-control" id="${escape(eventDescId)}" rows="4" name="eventDescription" placeholder="${isUniversity ? 'Explain the session, speakers, and what students should expect.' : 'What is happening, who should join, and what should people bring?'}">${escape(text(runtime.ui?.eventDescription || ''))}</textarea>
                    </label>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label class="lux-glass-dialog-field" for="${escape(eventStartsAtId)}">
                            <span class="social-neo-label">Starts</span>
                            <input class="social-neo-input lux-control" id="${escape(eventStartsAtId)}" type="datetime-local" name="eventStartsAt" value="${escape(text(runtime.ui?.eventStartsAt || ''))}" required>
                        </label>
                        <label class="lux-glass-dialog-field" for="${escape(eventEndsAtId)}">
                            <span class="social-neo-label">Ends</span>
                            <input class="social-neo-input lux-control" id="${escape(eventEndsAtId)}" type="datetime-local" name="eventEndsAt" value="${escape(text(runtime.ui?.eventEndsAt || ''))}">
                        </label>
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label class="lux-glass-dialog-field" for="${escape(eventLocationId)}">
                            <span class="social-neo-label">${isUniversity ? 'Venue / room' : 'Location'}</span>
                            <input class="social-neo-input lux-control" id="${escape(eventLocationId)}" type="text" name="eventLocation" placeholder="${isUniversity ? 'Auditorium A, Hall 3, Online...' : 'Library, Room 204, Courtyard, Zoom...'}" value="${escape(text(runtime.ui?.eventLocation || ''))}">
                        </label>
                        ${categoryField}
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-3">
                        <label class="lux-glass-dialog-field" for="${escape(eventScopeId)}">
                            <span class="social-neo-label">Publish in</span>
                            <select class="social-neo-select lux-control" id="${escape(eventScopeId)}" name="eventScope" data-lux-picker>
                                ${scopeOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${selectedEventScope === `${option.type}:${option.id}` ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                            </select>
                        </label>
                        <label class="lux-glass-dialog-field" for="${escape(eventJoinModeId)}">
                            <span class="social-neo-label">${isUniversity ? 'Access' : 'Join mode'}</span>
                            <select class="social-neo-select lux-control" id="${escape(eventJoinModeId)}" name="eventJoinMode" data-lux-picker>
                                <option value="open" ${text(runtime.ui?.eventJoinMode || 'open') === 'open' ? 'selected' : ''}>${isUniversity ? 'Open to all students' : 'Open to all'}</option>
                                <option value="member-required" ${text(runtime.ui?.eventJoinMode) === 'member-required' ? 'selected' : ''}>${isUniversity ? 'Faculty members only' : 'Members only'}</option>
                                <option value="invite-only" ${text(runtime.ui?.eventJoinMode) === 'invite-only' ? 'selected' : ''}>Invite only</option>
                            </select>
                        </label>
                        <label class="lux-glass-dialog-field" for="${escape(eventMaxSeatsId)}">
                            <span class="social-neo-label">Max seats</span>
                            <input class="social-neo-input lux-control" id="${escape(eventMaxSeatsId)}" type="number" name="eventMaxSeats" min="1" placeholder="Unlimited" value="${escape(text(runtime.ui?.eventMaxSeats || ''))}">
                        </label>
                    </div>
                    <div class="lux-checkbox-row social-neo-inline social-neo-events-toggle-row social-neo-inline-gap-14-wrap">
                        <label class="lux-checkbox lux-checkbox--chip social-neo-checkbox" for="${escape(eventIsOnlineId)}">
                            <input id="${escape(eventIsOnlineId)}" type="checkbox" name="eventIsOnline" ${runtime.ui?.eventIsOnline ? 'checked' : ''}>
                            <span>${isUniversity ? 'Online / hybrid' : 'Online event'}</span>
                        </label>
                        <label class="lux-checkbox lux-checkbox--chip social-neo-checkbox" for="${escape(eventRecurringId)}">
                            <input id="${escape(eventRecurringId)}" type="checkbox" name="eventRecurring" ${runtime.ui?.eventRecurring ? 'checked' : ''}>
                            <span>Recurring weekly</span>
                        </label>
                        ${runtime.ui?.eventIsOnline ? `
                            <input class="social-neo-input social-neo-input-flex-1-180" id="${escape(eventOnlineLinkId)}" type="url" name="eventOnlineLink" placeholder="https://zoom.us/..." value="${escape(text(runtime.ui?.eventOnlineLink || ''))}">
                        ` : ''}
                    </div>
                    <div class="social-neo-inline social-neo-events-form-actions">
                        <label class="lux-secondary-btn lux-secondary-btn-pointer">
                            <i class="fas fa-image"></i> Add cover photo
                            <input id="${escape(eventImageId)}" name="eventImage" type="file" accept="image/*" hidden>
                        </label>
                        ${runtime.ui?.eventImageFile ? `<span class="social-neo-draft-file"><i class="fas fa-image"></i> ${escape(runtime.ui.eventImageFile.name)}</span>` : (runtime.ui?.eventImageUrl ? '<span class="social-neo-draft-file"><i class="fas fa-image"></i> Current cover</span>' : '')}
                    </div>
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn ${isUniversity ? 'is-blue' : ''}" type="submit"><i class="fas ${submitIcon}"></i> ${escape(submitLabel)}</button>
                </div>
            </form>
        </div>`;
    }

    const EVENTS_OWNED_DIALOG_KINDS = new Set(['event-create', 'event-delete']);

    function renderEventsOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!EVENTS_OWNED_DIALOG_KINDS.has(kind)) return '';
        if (kind === 'event-create') {
            return renderEventCreateDialog(runtime || state());
        }
        if (kind === 'event-delete') {
            const eventItem = (Array.isArray(state().social?.events) ? state().social.events : [])
                .find((item) => text(item.id) === text(dialog.eventId));
            if (!eventItem) return '';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card" data-form="dialog-event-delete" data-action="noop">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Delete event', 'This removes the event and its RSVP history.') : ''}
                    <div class="lux-glass-dialog-preview">
                        <strong class="lux-glass-dialog-preview-title">${escape(text(eventItem.title || 'Untitled event'))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(when(eventItem.startsAt || ''))}</div>
                    </div>
                    <div class="lux-glass-dialog-preview lux-glass-dialog-preview-danger">
                        This will remove the event for everyone and clear its RSVP history.
                    </div>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Delete event' }) : ''}
                    <input type="hidden" name="eventId" value="${escape(text(eventItem.id))}">
                </form>
            </div>`;
        }
        return '';
    }

    window.renderEventsHero = renderEventsHero;
    window.renderEventsPanel = renderEventsPanel;
    window.renderEventCreateDialog = renderEventCreateDialog;
    window.renderEventsOwnedDialog = renderEventsOwnedDialog;
    window.EVENTS_OWNED_DIALOG_KINDS = EVENTS_OWNED_DIALOG_KINDS;

    function isSocialEventsClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        return a.startsWith('event-') || a.startsWith('events-');
    }

    function handleSocialEventsClick(action, trigger) {
        if (!isSocialEventsClickAction(action)) return false;
        if (action === 'event-time-group-toggle') {
            event.preventDefault();
            event.target.closest('.social-neo-time-group')?.classList.toggle('is-open');
            return;
        }

        if (action === 'event-delete-open') {
            return openDialog('event-delete', { eventId: text(trigger.getAttribute('data-event-id')) });
        }

        if (action === 'event-edit-open') {
            const eventId = text(trigger.getAttribute('data-event-id'));
            if (!eventId) return;
            const runtime = state();
            const events = Array.isArray(runtime.social?.events) ? runtime.social.events : [];
            const event = events.find((entry) => text(entry?.id) === eventId);
            if (!event) return;
            const userId = currentUserId();
            const inManageList = events.some((entry) => text(entry?.id) === eventId && eventCanManage(entry));
            const canEdit = eventCanManage(event)
                || text(event.createdById) === userId
                || (text(event.scopeType) === 'profile' && text(event.scopeId) === userId)
                || inManageList;
            if (!canEdit) return;
            prefillEventEditDraft(event);
            const variant = (text(event.category) === 'university' || event.isOfficial) ? 'university' : 'student';
            setPanel('events');
            return openDialog('event-create', { variant, eventId });
        }

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

        if (action === 'event-create-open') {
            clearEventDraft();
            const activeSection = text(state().ui.eventsSubTab || 'student') || 'student';
            if (activeSection === 'studygroups') {
                setPanel('events');
                return ensureSocialGroupsModule().then(() => openDialog('group-create'));
            }
            setPanel('events');
            return openDialog('event-create', { variant: activeSection });
        }

        if (action === 'event-rsvp') {
            const eventId = trigger.getAttribute('data-event-id');
            return withBusy(async () => {
                await respondPortalSocialEventRsvp(eventId, trigger.getAttribute('data-status'));
                patchEventRsvpButtons(eventId);
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('event-rsvp');
            });
        }
        return false;
    }

    window.handleSocialEventsClick = handleSocialEventsClick;
    window.isSocialEventsClickAction = isSocialEventsClickAction;

    function isSocialEventsSubmitForm(formType) {
        const f = text(formType || '');
        return f === 'create-event' || f === 'dialog-event-delete';
    }

    function handleSocialEventsSubmit(formType, form, runtime, event) {
        if (!isSocialEventsSubmitForm(formType)) return false;
        if (formType === 'create-event') {
            return withBusy(async () => {
                const editId = text(runtime.ui?.eventEditId);
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
                    isOfficial: text(form.eventIsOfficial?.value || '') === 'true',
                    scopeType: text(scopeType || 'profile') || 'profile',
                    scopeId: text(scopeId || currentUserId()) || currentUserId(),
                    scopeName: scope?.name || ''
                };
                if (!payload.title || !payload.startsAt) throw new Error('Event title and start time are required.');
                if (editId) {
                    const updatePayload = { ...payload };
                    if (imageUrl) updatePayload.imageUrl = imageUrl;
                    await updatePortalSocialEvent(editId, updatePayload);
                    clearEventDraft();
                    closeDialog();
                    renderSocialPageNow('event-updated');
                    return;
                }
                payload.imageUrl = imageUrl;
                await createPortalSocialEvent(payload);
                clearEventDraft();
                closeDialog();
                renderSocialPageNow('event-created');
            });
        }

        if (formType === 'dialog-event-delete') {
            return withBusy(async () => {
                await deletePortalSocialEvent(text(form.eventId?.value));
                closeDialog();
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('event-deleted');
            });
        }
        return false;
    }

    window.handleSocialEventsSubmit = handleSocialEventsSubmit;
    window.isSocialEventsSubmitForm = isSocialEventsSubmitForm;

    function isSocialEventsInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.closest && target.closest('form[data-form="create-event"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialEventsInput(target, runtime, event) {
        if (!isSocialEventsInputTarget(target)) return false;
        if (target.matches('form[data-form="create-event"] [name="eventTitle"]')) runtime.ui.eventTitle = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventDescription"]')) runtime.ui.eventDescription = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventStartsAt"]')) runtime.ui.eventStartsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventEndsAt"]')) runtime.ui.eventEndsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventLocation"]')) runtime.ui.eventLocation = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventOnlineLink"]')) runtime.ui.eventOnlineLink = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventCategory"]')) runtime.ui.eventCategory = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventMaxSeats"]')) runtime.ui.eventMaxSeats = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventTitle"]')) runtime.ui.eventTitle = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventDescription"]')) runtime.ui.eventDescription = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventStartsAt"]')) runtime.ui.eventStartsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventEndsAt"]')) runtime.ui.eventEndsAt = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventLocation"]')) runtime.ui.eventLocation = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventOnlineLink"]')) runtime.ui.eventOnlineLink = target.value;
        if (target.matches('form[data-form="create-event"] [name="eventMaxSeats"]')) runtime.ui.eventMaxSeats = target.value;

        return true;
    }

    function isSocialEventsChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.closest && target.closest('form[data-form="create-event"]')) return true;
        if (target.name === 'eventImage') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialEventsChange(target, runtime, event) {
        if (!isSocialEventsChangeTarget(target)) return false;
        if (target.matches('form[data-form="create-event"] [name="eventScope"]')) runtime.ui.eventScope = text(target.value || '');
        if (target.matches('form[data-form="create-event"] [name="eventJoinMode"]')) runtime.ui.eventJoinMode = text(target.value || 'open') || 'open';
        if (target.matches('form[data-form="create-event"] [name="eventCategory"]')) runtime.ui.eventCategory = text(target.value || 'social') || 'social';
        if (target.matches('form[data-form="create-event"] [name="eventIsOnline"]')) {
            runtime.ui.eventIsOnline = Boolean(target.checked);
            renderSocialPageNow(text(activeDialog()?.type || '') === 'event-create' ? 'event-create-input' : 'event-online-toggle');
            return;
        }
        if (target.matches('form[data-form="create-event"] [name="eventRecurring"]')) runtime.ui.eventRecurring = Boolean(target.checked);
        if (target.name === 'eventImage') {
            runtime.ui.eventImageFile = target.files?.[0] || null;
            renderSocialPageNow(text(activeDialog()?.type || '') === 'event-create' ? 'event-create-input' : 'event-image');
            return;
        }

        return true;
    }

    window.handleSocialEventsInput = handleSocialEventsInput;
    window.isSocialEventsInputTarget = isSocialEventsInputTarget;
    window.handleSocialEventsChange = handleSocialEventsChange;
    window.isSocialEventsChangeTarget = isSocialEventsChangeTarget;

})();
