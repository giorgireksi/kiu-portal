(function initSocialLostFoundModule() {
    if (window.__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED) return;
    window.__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED = true;

    const hooks = window.__kiuSocialLostFoundHooks || {};
    const {
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
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof currentUser !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof currentFacultyCode !== 'function'
        || typeof lostFoundVisibleItems !== 'function'
        || typeof lostFoundItems !== 'function'
        || typeof normalizeLostFoundItem !== 'function'
        || typeof lostFoundSuggestionItems !== 'function'
        || typeof accountById !== 'function'
        || typeof currentUserId !== 'function'
        || typeof avatar !== 'function'
        || typeof displayName !== 'function'
        || typeof facultyLabel !== 'function'
        || typeof when !== 'function'
        || typeof controlId !== 'function'
    ) {
        throw new Error('Social lost-found hooks are unavailable.');
    }

    window.renderLostFoundPanel = function renderLostFoundPanel() {
        const runtime = state();
        const user = currentUser() || {};
        const role = text(user?.role || '');
        const isModerator = ['admin', 'student_service'].includes(role);
        const facultyCode = currentFacultyCode();
        const items = lostFoundVisibleItems();
        const allItems = lostFoundItems().map((item) => normalizeLostFoundItem(item));
        const openCount = allItems.filter((item) => ['open', 'claimed'].includes(item.status)).length;
        const lostCount = allItems.filter((item) => item.kind === 'lost').length;
        const foundCount = allItems.filter((item) => item.kind === 'found').length;
        const resolvedCount = allItems.filter((item) => ['resolved', 'archived'].includes(item.status)).length;
        const editItem = runtime.ui?.lostFoundEditId ? allItems.find((item) => text(item.id) === text(runtime.ui.lostFoundEditId)) || null : null;
        const composerOpen = Boolean(runtime.ui?.lostFoundComposerOpen) || Boolean(editItem);
        const browseFaculty = text(runtime.ui?.lostFoundBrowseFaculty || runtime.ui?.lostFoundFaculty || 'current') || 'current';

        const draft = {
            kind: text(runtime.ui?.lostFoundKind || editItem?.kind || 'lost') === 'found' ? 'found' : 'lost',
            status: text(runtime.ui?.lostFoundStatus || editItem?.status || 'open'),
            title: text(runtime.ui?.lostFoundTitle || editItem?.title || ''),
            description: text(runtime.ui?.lostFoundDescription || editItem?.description || ''),
            category: text(runtime.ui?.lostFoundCategory || editItem?.category || ''),
            locationText: text(runtime.ui?.lostFoundLocation || editItem?.locationText || ''),
            eventDate: text(runtime.ui?.lostFoundDate || editItem?.eventDate || ''),
            facultyScope: text(runtime.ui?.lostFoundScope || (editItem?.campusScope === 'campus' ? 'all' : 'current') || 'current'),
            file: runtime.ui?.lostFoundFile || null
        };
        const suggestions = lostFoundSuggestionItems(allItems, draft.title, draft.category, draft.locationText, editItem?.id || '');
        const filteredTitle = {
            all: 'All campus items',
            open: 'Open listings',
            lost: 'Lost items',
            found: 'Found items',
            resolved: 'Resolved items'
        }[text(runtime.ui?.lostFoundFilter || 'open')] || 'Open listings';

        const renderCard = (item) => {
            const author = accountById(item.authorUserId) || { id: item.authorUserId, displayName: item.authorName || item.authorUserId };
            const isOwn = text(item.authorUserId) === currentUserId();
            const canManage = isOwn || isModerator;
            const canRemove = isOwn || isModerator;
            const statusLabel = {
                open: 'Open',
                claimed: 'Claimed',
                resolved: 'Resolved',
                archived: 'Archived'
            }[item.status] || 'Open';
            const kindLabel = item.kind === 'found' ? 'Found' : 'Lost';
            return `
                <article class="social-neo-card social-neo-entity-card">
                    <div class="social-neo-inline" style="justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
                        <div class="social-neo-person" style="gap:12px;align-items:flex-start">
                            ${avatar(author, 'social-neo-avatar-sm')}
                            <div>
                                <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap">
                                    <strong>${escape(text(item.title || 'Untitled listing'))}</strong>
                                    <span class="social-neo-pill">${escape(kindLabel)}</span>
                                    <span class="social-neo-pill">${escape(statusLabel)}</span>
                                </div>
                                <div class="social-neo-muted" style="margin-top:4px">${escape(displayName(author))} · ${escape(text(item.campusScope) === 'campus' ? 'All campus' : facultyLabel(text(item.facultyCode || facultyCode)))}</div>
                            </div>
                        </div>
                        <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap;justify-content:flex-end">
                            <span class="social-neo-pill">${escape(text(item.category || 'General'))}</span>
                            ${text(item.eventDate) ? `<span class="social-neo-pill"><i class="fas fa-calendar"></i> ${escape(when(item.eventDate))}</span>` : ''}
                        </div>
                    </div>
                    <div style="margin-top:12px;display:grid;gap:12px;grid-template-columns:repeat(12,minmax(0,1fr))">
                        ${item.imageUrl ? `<div style="grid-column:span 4"><img src="${escape(item.imageUrl)}" alt="${escape(text(item.title || 'Lost and found item'))}" style="width:100%;height:160px;object-fit:cover;border-radius:18px;border:1px solid rgba(255,255,255,.08)"></div>` : ''}
                        <div style="${item.imageUrl ? 'grid-column:span 8;' : 'grid-column:span 12;'}display:flex;flex-direction:column;gap:12px">
                            <div class="social-neo-muted">${escape(text(item.description || 'No description provided.'))}</div>
                            <div class="social-neo-badge-row">
                                ${text(item.locationText) ? `<span class="social-neo-pill"><i class="fas fa-location-dot"></i> ${escape(item.locationText)}</span>` : ''}
                                <span class="social-neo-pill"><i class="fas fa-graduation-cap"></i> ${escape(text(item.campusScope) === 'campus' ? 'All campus' : facultyLabel(text(item.facultyCode || facultyCode)))}</span>
                                ${text(item.updatedAt) ? `<span class="social-neo-pill"><i class="fas fa-clock"></i> Updated ${escape(when(item.updatedAt))}</span>` : ''}
                            </div>
                            <div class="social-neo-inline" style="justify-content:space-between;gap:8px;flex-wrap:wrap">
                                <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap">
                                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="lost-found-contact" data-item-id="${escape(item.id)}" data-user-id="${escape(item.authorUserId)}"><i class="fas fa-comments"></i> Contact</button>
                                    ${canManage && item.status !== 'resolved' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-resolve" data-item-id="${escape(item.id)}"><i class="fas fa-circle-check"></i> Mark resolved</button>` : ''}
                                </div>
                                <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap">
                                    ${canManage ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-edit" data-item-id="${escape(item.id)}"><i class="fas fa-pen"></i> Edit</button>` : ''}
                                    ${canRemove ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-delete" data-item-id="${escape(item.id)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        };

        const composerLabel = editItem ? 'Edit listing' : 'Post an item';
        const composerToggleLabel = composerOpen ? 'Hide form' : 'Post an item';
        const submitLabel = editItem ? 'Update listing' : 'Post item';
        const facultyOptions = [
            { value: 'current', label: `Current faculty (${facultyLabel(facultyCode)})` },
            { value: 'all', label: 'All campus' }
        ];
        const composerId = controlId('lost-found-title');
        const descriptionId = controlId('lost-found-description');
        const categoryId = controlId('lost-found-category');
        const locationId = controlId('lost-found-location');
        const dateId = controlId('lost-found-date');

        return `
            <div class="social-neo-stack">
                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Lost &amp; Found</strong>
                            <span>Post campus items, search by faculty, and contact owners directly.</span>
                        </div>
                        <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap">
                            <span class="social-neo-pill"><strong>${escape(openCount)}</strong><span>Open</span></span>
                            <span class="social-neo-pill"><strong>${escape(lostCount)}</strong><span>Lost</span></span>
                            <span class="social-neo-pill"><strong>${escape(foundCount)}</strong><span>Found</span></span>
                            <span class="social-neo-pill"><strong>${escape(resolvedCount)}</strong><span>Resolved</span></span>
                        </div>
                    </div>
                    <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap;margin-top:10px">
                        ${['open', 'lost', 'found', 'resolved'].map((filter) => `
                            <button class="social-neo-tab ${text(runtime.ui?.lostFoundFilter || 'open') === filter ? 'is-active' : ''}" type="button" data-action="panel-lost-found" data-lost-found-filter="${escape(filter)}">${escape(filter.charAt(0).toUpperCase() + filter.slice(1))}</button>
                        `).join('')}
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2" style="margin-top:14px">
                        <label for="${escape(controlId('lost-found-search'))}">
                            <span class="social-neo-label">Search</span>
                            <input class="social-neo-input" id="${escape(controlId('lost-found-search'))}" type="search" name="lostFoundSearch" placeholder="Search title, category, location, or author" value="${escape(text(runtime.ui?.lostFoundSearch || ''))}">
                        </label>
                        <label for="${escape(controlId('lost-found-faculty'))}">
                            <span class="social-neo-label">Faculty scope</span>
                            <select class="social-neo-select" id="${escape(controlId('lost-found-faculty'))}" name="lostFoundFaculty">
                                ${facultyOptions.map((option) => `<option value="${escape(option.value)}" ${browseFaculty === option.value ? 'selected' : ''}>${escape(option.label)}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                </section>

                <section class="social-neo-card">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>${escape(composerLabel)}</strong>
                            <span>${escape(editItem ? 'Update the details and republish the item.' : 'Keep this collapsed until you actually need to post a listing.')}</span>
                        </div>
                        <div class="social-neo-inline" style="gap:8px;flex-wrap:wrap">
                            <button class="social-neo-btn ${composerOpen ? 'social-neo-btn-ghost' : 'social-neo-btn-primary'} social-neo-btn-sm" type="button" data-action="lost-found-compose-toggle"><i class="fas ${composerOpen ? 'fa-angle-up' : 'fa-plus'}"></i> ${escape(composerToggleLabel)}</button>
                            ${composerOpen ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="lost-found-reset"><i class="fas fa-xmark"></i> ${escape(editItem ? 'Cancel edit' : 'Clear draft')}</button>` : ''}
                        </div>
                    </div>
                    ${composerOpen ? `
                    <form class="social-neo-stack" data-form="lost-found-item" style="margin-top:14px">
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label for="${escape(controlId('lost-found-kind'))}">
                                <span class="social-neo-label">Type</span>
                                <select class="social-neo-select" id="${escape(controlId('lost-found-kind'))}" name="lostFoundKind">
                                    <option value="lost" ${draft.kind === 'lost' ? 'selected' : ''}>Lost item</option>
                                    <option value="found" ${draft.kind === 'found' ? 'selected' : ''}>Found item</option>
                                </select>
                            </label>
                            <label for="${escape(categoryId)}">
                                <span class="social-neo-label">Category</span>
                                <input class="social-neo-input" id="${escape(categoryId)}" type="text" name="lostFoundCategory" placeholder="Wallet, laptop, ID card..." value="${escape(draft.category)}">
                            </label>
                        </div>
                        <label for="${escape(composerId)}">
                            <span class="social-neo-label">Title</span>
                            <input class="social-neo-input" id="${escape(composerId)}" type="text" name="lostFoundTitle" placeholder="Black backpack with silver zipper" value="${escape(draft.title)}">
                        </label>
                        <label for="${escape(descriptionId)}">
                            <span class="social-neo-label">Description</span>
                            <textarea class="social-neo-textarea" id="${escape(descriptionId)}" rows="4" name="lostFoundDescription" placeholder="Add identifying details, contents, and any contact-safe clues.">${escape(draft.description)}</textarea>
                        </label>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label for="${escape(locationId)}">
                                <span class="social-neo-label">Last seen / found at</span>
                                <input class="social-neo-input" id="${escape(locationId)}" type="text" name="lostFoundLocation" placeholder="Main library, 2nd floor" value="${escape(draft.locationText)}">
                            </label>
                            <label for="${escape(dateId)}">
                                <span class="social-neo-label">Date</span>
                                <input class="social-neo-input" id="${escape(dateId)}" type="date" name="lostFoundDate" value="${escape(draft.eventDate)}">
                            </label>
                        </div>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label>
                                <span class="social-neo-label">Listing status</span>
                                <select class="social-neo-select" name="lostFoundStatus">
                                    <option value="open" ${draft.status === 'open' ? 'selected' : ''}>Open</option>
                                    <option value="claimed" ${draft.status === 'claimed' ? 'selected' : ''}>Claimed</option>
                                    <option value="resolved" ${draft.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                </select>
                            </label>
                            <label>
                                <span class="social-neo-label">Scope</span>
                                <select class="social-neo-select" name="lostFoundScope">
                                    <option value="current" ${draft.facultyScope === 'current' ? 'selected' : ''}>Current faculty</option>
                                    <option value="all" ${draft.facultyScope === 'all' ? 'selected' : ''}>All campus</option>
                                </select>
                            </label>
                        </div>
                        <div class="social-neo-inline" style="gap:10px;flex-wrap:wrap">
                            <label class="social-neo-btn social-neo-btn-ghost" style="cursor:pointer">
                                <i class="fas fa-image"></i> Add photo
                                <input name="lostFoundFile" type="file" accept="image/*" hidden>
                            </label>
                            ${draft.file ? `<span class="social-neo-draft-file"><i class="fas fa-image"></i> ${escape(draft.file.name || 'Image selected')}</span>` : ''}
                            <span style="flex:1"></span>
                            <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-paper-plane"></i> ${escape(submitLabel)}</button>
                        </div>
                    </form>
                    ${suggestions.length ? `
                        <div class="social-neo-stack" style="margin-top:16px">
                            <div class="social-neo-section-head">
                                <div><strong>Similar items</strong><span>These recent posts look close to your draft and may already help.</span></div>
                            </div>
                            <div class="social-neo-stack">
                                ${suggestions.map(renderCard).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ` : `
                    <div class="social-neo-muted" style="margin-top:14px">Open the composer only when you need to post. The list stays compact by default.</div>
                    `}
                </section>

                <section class="social-neo-stack">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>${escape(filteredTitle)}</strong>
                            <span>${escape(items.length ? `${items.length} item${items.length === 1 ? '' : 's'} in view` : 'No matching listings')}</span>
                        </div>
                        <button class="social-neo-link-btn" type="button" data-action="lost-found-compose-open"><i class="fas fa-plus"></i> New item</button>
                    </div>
                    ${items.length ? items.map(renderCard).join('') : `
                        <div class="social-neo-card">
                            <div class="social-neo-empty-hero">
                                <i class="fas fa-magnifying-glass-location"></i>
                                <strong>No items match your filters</strong>
                                <span>Try switching to All campus or posting the item yourself.</span>
                            </div>
                        </div>
                    `}
                </section>
            </div>
        `;
    };
})();
