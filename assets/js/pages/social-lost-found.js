(function initSocialLostFoundModule() {
    if (window.__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED) return;
    window.__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED = true;

    const hooks = window.__kiuSocialLostFoundHooks || {};
    const {
        state,
        currentUser,
        text,
        escape,
        lostFoundVisibleItems,
        lostFoundItems,
        normalizeLostFoundItem,
        lostFoundSuggestionItems,
        lostFoundActiveCount,
        lostFoundRecoveredCount,
        accountById,
        currentUserId,
        avatar,
        displayName,
        when,
        controlId,
        renderFileChip,
        setPanel,
        openDialog,
        renderSocialPageNow,
        resetLostFoundDraft,
        openPortalDirectChat,
        setActiveChat,
        closeDialog,
        withBusy,
        readFileAsDataUrl,
        saveLostFoundItems,
        makeId
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof currentUser !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof lostFoundVisibleItems !== 'function'
        || typeof lostFoundItems !== 'function'
        || typeof normalizeLostFoundItem !== 'function'
        || typeof lostFoundSuggestionItems !== 'function'
        || typeof lostFoundActiveCount !== 'function'
        || typeof lostFoundRecoveredCount !== 'function'
        || typeof accountById !== 'function'
        || typeof currentUserId !== 'function'
        || typeof avatar !== 'function'
        || typeof displayName !== 'function'
        || typeof when !== 'function'
        || typeof controlId !== 'function'
        || typeof renderFileChip !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof resetLostFoundDraft !== 'function'
        || typeof openPortalDirectChat !== 'function'
        || typeof setActiveChat !== 'function'
        || typeof closeDialog !== 'function'
        || typeof withBusy !== 'function'
        || typeof readFileAsDataUrl !== 'function'
        || typeof saveLostFoundItems !== 'function'
        || typeof makeId !== 'function'
    ) {
        throw new Error('Social lost-found hooks are unavailable.');
    }

    const LOST_FOUND_DEFAULT_LISTING_DAYS = 90;

    function renderLostFoundHero(runtime, metrics = {}, options = {}) {
        const lostCount = Number(metrics.lost || 0);
        const foundCount = Number(metrics.found || 0);
        const searchValue = text(options.searchValue || '');
        const bodyHtml = text(options.bodyHtml || '');
        const controlIdFn = typeof options.controlId === 'function' ? options.controlId : (name) => text(name);
        const merged = Boolean(bodyHtml);
        const stats = [
            { label: 'Lost items', value: lostCount },
            { label: 'Items found', value: foundCount },
        ];
        const searchId = controlIdFn('lost-found-search');
        const sectionClasses = [
            'social-neo-card',
            'social-neo-lost-found-hero',
            merged ? 'is-merged' : '',
        ].filter(Boolean).join(' ');
        return `
            <section class="${sectionClasses}">
                <div class="social-neo-lost-found-hero-head">
                    <div class="social-neo-lost-found-hero-copy">
                        <span class="social-neo-section-kicker">Campus recovery board</span>
                        <h2>Report, match, and return lost items with less friction</h2>
                        <p>Post missing items, help others recover them, and mark returns when they are found.</p>
                    </div>
                    <div class="social-neo-lost-found-hero-actions">
                        <button class="social-neo-btn social-neo-btn-primary social-neo-lost-found-hero-create-btn" type="button" data-action="lost-found-create-open">
                            <i class="fas fa-plus"></i>
                            <span>Post item</span>
                        </button>
                    </div>
                </div>
                <div class="social-neo-lost-found-hero-stats social-neo-lost-found-hero-stats--dual">
                    ${stats.map((stat) => `
                        <article class="social-neo-lost-found-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                <div class="social-neo-lost-found-hero-toolbar">
                    <label for="${escape(searchId)}">
                        <span class="social-neo-label">Search</span>
                        <input class="social-neo-input" id="${escape(searchId)}" type="search" name="lostFoundSearch" placeholder="Search title, category, location, or author" value="${escape(searchValue)}">
                    </label>
                </div>
                ${merged ? `
                    <div class="social-neo-lost-found-hero-divider" aria-hidden="true"></div>
                    <div class="social-neo-stack social-neo-lf-listings">${bodyHtml}</div>
                ` : ''}
            </section>
        `;
    }


    function defaultLostFoundExpiresAt(baseDate = new Date()) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + LOST_FOUND_DEFAULT_LISTING_DAYS);
        return date.toISOString();
    }

    function toDateTimeLocalValue(iso = '') {
        if (!text(iso)) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function fromDateTimeLocalValue(value = '') {
        if (!text(value)) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString();
    }

    function renderLostFoundActionConfirmDialog(kind, item) {
        if (!item) return '';
        const isDelete = kind === 'lost-found-delete';
        const title = isDelete ? 'Remove listing' : 'Mark as found';
        const subtitle = isDelete
            ? 'This permanently deletes the listing from Lost & Found.'
            : 'This moves the listing to the found counter and removes it from the active lost list.';
        const warning = isDelete
            ? 'The listing will be permanently removed for everyone.'
            : 'The listing will leave the active lost list and count toward items found.';
        const checkboxCopy = isDelete
            ? 'I understand this listing will be permanently removed.'
            : 'I confirm this item was found and returned.';
        const checkboxName = isDelete ? 'confirmLostFoundDelete' : 'confirmLostFoundMarkFound';
        const submitLabel = isDelete ? 'Remove listing' : 'Mark as found';
        const icon = isDelete ? 'fa-trash' : 'fa-circle-check';
        const formType = isDelete ? 'dialog-lost-found-delete' : 'dialog-lost-found-mark-found';
        const submitClass = isDelete ? 'social-neo-btn-danger' : 'social-neo-btn-primary';
        const previewLocation = text(item.locationText) ? `<div class="social-neo-muted social-neo-muted-mt-6"><i class="fas fa-location-dot"></i> ${escape(item.locationText)}</div>` : '';
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
            <form class="social-neo-dialog-card social-neo-delete-confirm" data-form="${formType}" data-action="noop">
                <div class="social-neo-delete-confirm-accent" aria-hidden="true"></div>
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <span class="social-neo-delete-confirm-icon-chip"><i class="fas ${icon}" aria-hidden="true"></i></span>
                        <div class="social-neo-delete-confirm-title">
                            <strong class="social-neo-dialog-title">${escape(title)}</strong>
                            <span class="social-neo-dialog-subtitle">${escape(subtitle)}</span>
                        </div>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-delete-confirm-preview">
                    <strong class="social-neo-dialog-preview-title">${escape(text(item.title || 'Untitled listing'))}</strong>
                    <div class="social-neo-muted social-neo-muted-mt-6">${escape(text(item.category || 'General'))}</div>
                    ${previewLocation}
                </div>
                <div class="social-neo-dialog-preview social-neo-dialog-preview-danger">${escape(warning)}</div>
                <label class="social-neo-item-line social-neo-dialog-checkbox-line">
                    <input type="checkbox" name="${checkboxName}" value="yes">
                    <span class="social-neo-dialog-checkbox-copy">${escape(checkboxCopy)}</span>
                </label>
                <div class="social-neo-delete-confirm-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="social-neo-btn ${submitClass} social-neo-dialog-submit-btn" type="submit">${escape(submitLabel)}</button>
                </div>
                <input type="hidden" name="itemId" value="${escape(text(item.id))}">
            </form>
        </div>`;
    }

    function renderLostFoundCreateDialog(runtime) {
        const allItems = lostFoundItems().map((item) => normalizeLostFoundItem(item));
        const editItem = runtime.ui?.lostFoundEditId ? allItems.find((item) => text(item.id) === text(runtime.ui.lostFoundEditId)) || null : null;
        const defaultExpiresAt = defaultLostFoundExpiresAt();
        const draftExpiresAt = text(runtime.ui?.lostFoundExpiresAt)
            ? fromDateTimeLocalValue(runtime.ui.lostFoundExpiresAt)
            : text(editItem?.expiresAt || defaultExpiresAt);
        const draft = {
            title: text(runtime.ui?.lostFoundTitle || editItem?.title || ''),
            description: text(runtime.ui?.lostFoundDescription || editItem?.description || ''),
            category: text(runtime.ui?.lostFoundCategory || editItem?.category || ''),
            locationText: text(runtime.ui?.lostFoundLocation || editItem?.locationText || ''),
            eventDate: text(runtime.ui?.lostFoundDate || editItem?.eventDate || ''),
            expiresAt: draftExpiresAt,
            file: runtime.ui?.lostFoundFile || null
        };
        const suggestions = lostFoundSuggestionItems(allItems, draft.title, draft.category, draft.locationText, editItem?.id || '');
        const submitLabel = editItem ? 'Update listing' : 'Post item';
        const titleId = controlId('lost-found-title');
        const descriptionId = controlId('lost-found-description');
        const categoryId = controlId('lost-found-category');
        const locationId = controlId('lost-found-location');
        const dateId = controlId('lost-found-date');
        const expiresAtId = controlId('lost-found-expires-at');
        const expiresAtMin = toDateTimeLocalValue(new Date().toISOString());
        const suggestionsMarkup = suggestions.length ? `
            <section class="social-neo-dialog-lost-found-create-section">
                <div class="social-neo-dialog-lost-found-create-section-head">
                    <strong>Similar items</strong>
                    <span>These recent posts look close to your draft and may already help.</span>
                </div>
                <div class="social-neo-list social-neo-dialog-lost-found-suggestions">
                    ${suggestions.slice(0, 3).map((item) => `
                        <article class="social-neo-entity-card">
                            <div>
                                <strong>${escape(text(item.title || 'Untitled listing'))}</strong>
                                <span>${escape(text(item.category || 'General'))} · ${escape(text(item.locationText || 'No location'))}</span>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        ` : '';
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
            <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--lost-found-create social-neo-dialog-card--lms-create" data-form="lost-found-item" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-magnifying-glass-location" aria-hidden="true"></i> ${editItem ? 'Edit listing' : 'Post item'}</strong>
                        <span class="social-neo-dialog-subtitle">${editItem ? 'Update the details and republish the item.' : 'Add a photo, location, and identifying details so campus can help.'}</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--lost-found-create">
                    <section class="social-neo-dialog-lost-found-create-section">
                        <label class="social-neo-dialog-field" for="${escape(categoryId)}">
                            <span class="social-neo-label">Category</span>
                            <input class="social-neo-input" id="${escape(categoryId)}" type="text" name="lostFoundCategory" placeholder="Wallet, laptop, ID card..." value="${escape(draft.category)}">
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(titleId)}">
                            <span class="social-neo-label">Title</span>
                            <input class="social-neo-input" id="${escape(titleId)}" type="text" name="lostFoundTitle" placeholder="Black backpack with silver zipper" value="${escape(draft.title)}" required>
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(descriptionId)}">
                            <span class="social-neo-label">Description</span>
                            <textarea class="social-neo-textarea" id="${escape(descriptionId)}" rows="4" name="lostFoundDescription" placeholder="Add identifying details, contents, and any contact-safe clues.">${escape(draft.description)}</textarea>
                        </label>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="social-neo-dialog-field" for="${escape(locationId)}">
                                <span class="social-neo-label">Last seen at</span>
                                <input class="social-neo-input" id="${escape(locationId)}" type="text" name="lostFoundLocation" placeholder="Main library, 2nd floor" value="${escape(draft.locationText)}">
                            </label>
                            <label class="social-neo-dialog-field" for="${escape(dateId)}">
                                <span class="social-neo-label">Date</span>
                                <input class="social-neo-input" id="${escape(dateId)}" type="date" name="lostFoundDate" value="${escape(draft.eventDate)}">
                            </label>
                        </div>
                        <label class="social-neo-dialog-field" for="${escape(expiresAtId)}">
                            <span class="social-neo-label">Listing ends</span>
                            <input class="social-neo-input" id="${escape(expiresAtId)}" type="datetime-local" name="lostFoundExpiresAt" min="${escape(expiresAtMin)}" value="${escape(toDateTimeLocalValue(draft.expiresAt))}" required>
                            <span class="social-neo-dialog-hint">The listing is removed automatically after this time.</span>
                        </label>
                        <div class="social-neo-inline social-neo-inline-gap-10-wrap">
                            <label class="social-neo-btn social-neo-btn-ghost social-neo-btn-pointer">
                                <i class="fas fa-image"></i> Add photo
                                <input name="lostFoundFile" type="file" accept="image/*" hidden>
                            </label>
                            ${draft.file ? `<span class="social-neo-draft-file"><i class="fas fa-image"></i> ${escape(draft.file.name || 'Image selected')}</span>` : ''}
                        </div>
                    </section>
                    ${suggestionsMarkup}
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit"><i class="fas fa-paper-plane"></i> ${escape(submitLabel)}</button>
                </div>
            </form>
        </div>`;
    }


    window.renderLostFoundActionConfirmDialog = renderLostFoundActionConfirmDialog;
    window.renderLostFoundCreateDialog = renderLostFoundCreateDialog;

    window.renderLostFoundHero = renderLostFoundHero;

    window.renderLostFoundPanel = function renderLostFoundPanel() {
        const runtime = state();
        const user = currentUser() || {};
        const role = text(user?.role || '');
        const isModerator = ['admin', 'student_service'].includes(role);
        const items = lostFoundVisibleItems();

        const renderCard = (item) => {
            const author = accountById(item.authorUserId) || { id: item.authorUserId, displayName: item.authorName || item.authorUserId };
            const isOwn = text(item.authorUserId) === currentUserId();
            const canManage = isOwn || isModerator;
            const canRemove = isOwn || isModerator;
            const canMarkFound = isOwn && item.status === 'lost';
            return `
                <article class="social-neo-card social-neo-entity-card social-neo-lf-card">
                    <div class="social-neo-inline social-neo-inline-between-start-wrap social-neo-lf-card-head">
                        <div class="social-neo-person social-neo-person-start-gap-12 social-neo-lf-card-person">
                            ${avatar(author, 'social-neo-avatar-sm')}
                            <div>
                                <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-lf-card-title-row">
                                    <strong>${escape(text(item.title || 'Untitled listing'))}</strong>
                                    <span class="social-neo-pill">Lost</span>
                                </div>
                                <div class="social-neo-muted social-neo-badge-row-mt-4 social-neo-lf-card-meta">${escape(displayName(author))}</div>
                            </div>
                        </div>
                        <div class="social-neo-inline social-neo-inline-end-gap-8-wrap social-neo-lf-card-summary">
                            <span class="social-neo-pill">${escape(text(item.category || 'General'))}</span>
                            ${text(item.eventDate) ? `<span class="social-neo-pill"><i class="fas fa-calendar"></i> ${escape(when(item.eventDate))}</span>` : ''}
                        </div>
                    </div>
                    <div class="${item.imageUrl ? 'social-neo-grid-2' : 'social-neo-stack'} social-neo-grid-tight social-neo-grid-mt-12 social-neo-lf-card-media-grid ${item.imageUrl ? 'social-neo-lf-card-media-grid-has-media' : 'social-neo-lf-card-media-grid-no-media'}">
                        ${item.imageUrl ? `<div class="social-neo-media social-neo-lf-card-media-frame"><img class="social-neo-lf-card-media-image" src="${escape(item.imageUrl)}" alt="${escape(text(item.title || 'Lost item'))}"></div>` : ''}
                        <div class="social-neo-stack social-neo-lf-card-content ${item.imageUrl ? 'social-neo-lf-card-content-has-media' : 'social-neo-lf-card-content-full'}">
                            <div class="social-neo-muted">${escape(text(item.description || 'No description provided.'))}</div>
                            <div class="social-neo-badge-row">
                                ${text(item.locationText) ? `<span class="social-neo-pill"><i class="fas fa-location-dot"></i> ${escape(item.locationText)}</span>` : ''}
                                ${text(item.expiresAt) ? `<span class="social-neo-pill"><i class="fas fa-hourglass-end"></i> Ends ${escape(when(item.expiresAt))}</span>` : ''}
                                ${text(item.updatedAt) ? `<span class="social-neo-pill"><i class="fas fa-clock"></i> Updated ${escape(when(item.updatedAt))}</span>` : ''}
                            </div>
                            <div class="social-neo-inline social-neo-inline-between-gap-8-wrap social-neo-lf-card-actions">
                                <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-lf-card-actions-main">
                                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="lost-found-contact" data-item-id="${escape(item.id)}" data-user-id="${escape(item.authorUserId)}"><i class="fas fa-comments"></i> Contact</button>
                                    ${canMarkFound ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-mark-found" data-item-id="${escape(item.id)}"><i class="fas fa-circle-check"></i> Mark as found</button>` : ''}
                                </div>
                                <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-lf-card-actions-side">
                                    ${canManage ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-edit" data-item-id="${escape(item.id)}"><i class="fas fa-pen"></i> Edit</button>` : ''}
                                    ${canRemove ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-delete" data-item-id="${escape(item.id)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        };

        const heroMetrics = { lost: lostFoundActiveCount(), found: lostFoundRecoveredCount() };
        const listingsBody = `
            <div class="social-neo-section-head">
                <div>
                    <strong>Lost items</strong>
                    <span>${escape(items.length ? `${items.length} item${items.length === 1 ? '' : 's'} in view` : 'No lost items right now')}</span>
                </div>
            </div>
            ${items.length ? items.map(renderCard).join('') : `
                <div class="social-neo-empty-hero social-neo-lf-empty">
                    <i class="fas fa-magnifying-glass-location"></i>
                    <strong>No lost items right now</strong>
                    <span>Post a missing item and campus can help track it down.</span>
                </div>
            `}
        `;
        const heroOptions = {
            searchValue: text(runtime.ui?.lostFoundSearch || ''),
            controlId,
            bodyHtml: listingsBody
        };

        return `
            <div class="social-neo-stack social-neo-lost-found-shell">
                ${renderLostFoundHero(runtime, heroMetrics, heroOptions)}
            </div>
        `;
    };

    function isSocialLostFoundClickAction(action) {
        const a = text(action || '');
        return Boolean(a) && a.startsWith('lost-found-');
    }

    function handleSocialLostFoundClick(action, trigger) {
        if (!isSocialLostFoundClickAction(action)) return false;
        if (action === 'lost-found-create-open') {
            resetLostFoundDraft();
            state().ui.lostFoundExpiresAt = toDateTimeLocalValue(defaultLostFoundExpiresAt());
            setPanel('lost-and-found');
            return openDialog('lost-found-create');
        }

        if (action === 'lost-found-reset') {
            resetLostFoundDraft();
            renderSocialPageNow('lost-found-reset');
            return;
        }

        if (action === 'lost-found-edit') {
            const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === text(trigger.getAttribute('data-item-id')));
            if (!item || item.status !== 'lost') return;
            state().ui.lostFoundEditId = text(item.id);
            state().ui.lostFoundTitle = item.title || '';
            state().ui.lostFoundDescription = item.description || '';
            state().ui.lostFoundCategory = item.category || '';
            state().ui.lostFoundLocation = item.locationText || '';
            state().ui.lostFoundDate = item.eventDate || '';
            state().ui.lostFoundExpiresAt = toDateTimeLocalValue(item.expiresAt || defaultLostFoundExpiresAt());
            state().ui.lostFoundFile = null;
            setPanel('lost-and-found');
            return openDialog('lost-found-create');
        }

        if (action === 'lost-found-mark-found') {
            const itemId = text(trigger.getAttribute('data-item-id'));
            if (!itemId) return;
            const currentId = currentUserId();
            const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === itemId);
            if (!item || item.status !== 'lost') return;
            if (text(item.authorUserId) !== currentId) return;
            return openDialog('lost-found-mark-found', { itemId });
        }

        if (action === 'lost-found-delete') {
            const itemId = text(trigger.getAttribute('data-item-id'));
            if (!itemId) return;
            const actorId = currentUserId();
            const actorRole = text(currentUser()?.role || '');
            const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === itemId);
            if (!item) return;
            if (text(item.authorUserId) !== actorId && !['admin', 'student_service'].includes(actorRole)) return;
            return openDialog('lost-found-delete', { itemId });
        }

        if (action === 'lost-found-contact') {
            const targetUserId = text(trigger.getAttribute('data-user-id'));
            const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === text(trigger.getAttribute('data-item-id')));
            if (!targetUserId || !item) return;
            const prefill = `About your lost item "${item.title || 'listing'}": `;
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
        return false;
    }

    window.handleSocialLostFoundClick = handleSocialLostFoundClick;
    window.isSocialLostFoundClickAction = isSocialLostFoundClickAction;

    function isSocialLostFoundSubmitForm(formType) {
        const f = text(formType || '');
        return f === 'lost-found-item' || f.startsWith('dialog-lost-found-');
    }

    function handleSocialLostFoundSubmit(formType, form, runtime, event) {
        if (!isSocialLostFoundSubmitForm(formType)) return false;
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
                const imageUrl = runtime.ui?.lostFoundFile ? await readFileAsDataUrl(runtime.ui.lostFoundFile) : text(existing?.imageUrl || '');
                const expiresAt = fromDateTimeLocalValue(form.lostFoundExpiresAt?.value || runtime.ui?.lostFoundExpiresAt || '')
                    || text(existing?.expiresAt || defaultLostFoundExpiresAt());
                if (!expiresAt) throw new Error('Listing end time is required.');
                if (new Date(expiresAt).getTime() <= Date.now()) throw new Error('Listing end time must be in the future.');
                const nextItem = normalizeLostFoundItem({
                    ...existing,
                    id: editId || makeId('lf'),
                    status: text(existing?.status || 'lost') === 'found' ? 'found' : 'lost',
                    title: text(form.lostFoundTitle?.value || runtime.ui?.lostFoundTitle || existing?.title || ''),
                    description: text(form.lostFoundDescription?.value || runtime.ui?.lostFoundDescription || existing?.description || ''),
                    category: text(form.lostFoundCategory?.value || runtime.ui?.lostFoundCategory || existing?.category || 'General'),
                    locationText: text(form.lostFoundLocation?.value || runtime.ui?.lostFoundLocation || existing?.locationText || ''),
                    eventDate: text(form.lostFoundDate?.value || runtime.ui?.lostFoundDate || existing?.eventDate || ''),
                    expiresAt,
                    imageUrl,
                    authorUserId: text(existing?.authorUserId || actorId),
                    authorName: text(existing?.authorName || displayName(currentUser())),
                    createdAt: text(existing?.createdAt || new Date().toISOString()),
                    updatedAt: new Date().toISOString(),
                    foundAt: text(existing?.foundAt || ''),
                    foundByUserId: text(existing?.foundByUserId || ''),
                    contactChatId: text(existing?.contactChatId || ''),
                    notes: text(existing?.notes || '')
                });
                if (!nextItem.title) throw new Error('Listing title is required.');
                const nextItems = editId
                    ? currentItems.map((entry) => text(entry.id) === editId ? nextItem : entry)
                    : [nextItem, ...currentItems];
                await saveLostFoundItems(nextItems, editId ? 'lost-found-updated' : 'lost-found-created');
                resetLostFoundDraft();
                closeDialog();
                renderSocialPageNow('lost-found-save');
            });
        }

        if (formType === 'dialog-lost-found-delete') {
            return withBusy(async () => {
                if (!form.confirmLostFoundDelete?.checked) throw new Error('Confirm removal before deleting this listing.');
                const itemId = text(form.itemId?.value);
                if (!itemId) return;
                const nextItems = lostFoundItems()
                    .map((entry) => normalizeLostFoundItem(entry))
                    .filter((entry) => text(entry.id) !== itemId);
                await saveLostFoundItems(nextItems, 'lost-found-deleted');
                if (text(runtime.ui?.lostFoundEditId || '') === itemId) resetLostFoundDraft();
                closeDialog();
                renderSocialPageNow('lost-found-delete');
            });
        }

        if (formType === 'dialog-lost-found-mark-found') {
            return withBusy(async () => {
                if (!form.confirmLostFoundMarkFound?.checked) throw new Error('Confirm that the item was found before continuing.');
                const itemId = text(form.itemId?.value);
                if (!itemId) return;
                const currentId = currentUserId();
                const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === itemId);
                if (!item || item.status !== 'lost') throw new Error('This listing is no longer active.');
                if (text(item.authorUserId) !== currentId) throw new Error('Only the poster can mark this item as found.');
                const nextItems = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).map((entry) => {
                    if (text(entry.id) !== itemId) return entry;
                    return {
                        ...entry,
                        status: 'found',
                        foundAt: new Date().toISOString(),
                        foundByUserId: currentId,
                        updatedAt: new Date().toISOString()
                    };
                });
                await saveLostFoundItems(nextItems, 'lost-found-marked-found');
                closeDialog();
                renderSocialPageNow('lost-found-mark-found');
            });
        }
        return false;
    }

    window.handleSocialLostFoundSubmit = handleSocialLostFoundSubmit;
    window.isSocialLostFoundSubmitForm = isSocialLostFoundSubmitForm;

    function isSocialLostFoundInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('input[name="lostFoundSearch"]')) return true;
        if (target.closest && target.closest('form[data-form="lost-found-item"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialLostFoundInput(target, runtime, event) {
        if (!isSocialLostFoundInputTarget(target)) return false;
        if (target.matches('input[name="lostFoundSearch"]')) runtime.ui.lostFoundSearch = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundTitle"]')) runtime.ui.lostFoundTitle = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundDescription"]')) runtime.ui.lostFoundDescription = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundCategory"]')) runtime.ui.lostFoundCategory = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundLocation"]')) runtime.ui.lostFoundLocation = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundDate"]')) runtime.ui.lostFoundDate = target.value;
        if (target.matches('form[data-form="lost-found-item"] [name="lostFoundExpiresAt"]')) runtime.ui.lostFoundExpiresAt = target.value;
        if (
            target.matches('input[name="lostFoundSearch"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundTitle"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundDescription"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundCategory"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundLocation"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundDate"]')
            || target.matches('form[data-form="lost-found-item"] [name="lostFoundExpiresAt"]')
        ) {
            renderSocialPageNow('lost-found-input');
            return true;
        }
        return true;
    }

    function isSocialLostFoundChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.name === 'lostFoundFile') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialLostFoundChange(target, runtime, event) {
        if (!isSocialLostFoundChangeTarget(target)) return false;
        if (target.name === 'lostFoundFile') {
            runtime.ui.lostFoundFile = target.files?.[0] || null;
            renderSocialPageNow('lost-found-file');
            return;
        }

        return true;
    }

    window.handleSocialLostFoundInput = handleSocialLostFoundInput;
    window.isSocialLostFoundInputTarget = isSocialLostFoundInputTarget;
    window.handleSocialLostFoundChange = handleSocialLostFoundChange;
    window.isSocialLostFoundChangeTarget = isSocialLostFoundChangeTarget;

})();
