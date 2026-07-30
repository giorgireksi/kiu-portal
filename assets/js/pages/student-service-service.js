(function initStudentServiceServiceModule() {
    const studentHubStub = window.__studentServiceStudentHubStub;
    if (
        window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED
        && typeof window.renderStudentServiceStudentHub === 'function'
        && typeof studentHubStub === 'function'
        && window.renderStudentServiceStudentHub !== studentHubStub
    ) return;
    window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED = true;
    const __kiuSsApi = window.KiuStudentService || (window.KiuStudentService = {});
    window.__kiuSsApi = __kiuSsApi;

    const STUDENT_SERVICE_ROUTE_STATUS_OWNER = Object.freeze({
        ticket: Object.freeze([
            'open',
            'in-review',
            'waiting-student',
            'waiting-service',
            'resolved',
            'closed'
        ]),
        article: Object.freeze([
            'draft',
            'published'
        ])
    });

    function ensureStudentServiceMyTicketsShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-my-tickets-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-student-shell" data-student-service-my-tickets-shell="1">
                    <div data-student-service-my-tickets-summary="1"></div>
                    <section class="student-service-zone student-service-workbench-merged home-hover-chip">
                        <div class="student-service-ticket-grid">
                            <div data-student-service-my-tickets-list="1"></div>
                            <div data-student-service-my-tickets-detail="1"></div>
                        </div>
                    </section>
                </div>
            `));
            shell = container.querySelector('[data-student-service-my-tickets-shell="1"]');
        }
        return {
            summary: shell?.querySelector('[data-student-service-my-tickets-summary="1"]') || null,
            list: shell?.querySelector('[data-student-service-my-tickets-list="1"]') || null,
            detail: shell?.querySelector('[data-student-service-my-tickets-detail="1"]') || null
        };
    }

    function normalizeStudentServiceStatusKey(status, fallback = 'neutral') {
        const normalized = String(status || '').trim().toLowerCase();
        const known = {
            open: 'open',
            'in review': 'in-review',
            'waiting for student': 'waiting-student',
            'waiting for service': 'waiting-service',
            resolved: 'resolved',
            closed: 'closed',
            published: 'published',
            draft: 'draft'
        };
        return known[normalized] || fallback;
    }

    function normalizeStudentServiceStatusScope(scope) {
        return String(scope || '').trim().toLowerCase() === 'article' ? 'article' : 'ticket';
    }

    function resolveStudentServiceStatusOwnerContract(scope, key) {
        const resolvedScope = normalizeStudentServiceStatusScope(scope);
        const normalizedKey = normalizeStudentServiceStatusKey(key, 'neutral');
        const knownKeys = STUDENT_SERVICE_ROUTE_STATUS_OWNER[resolvedScope] || [];
        return {
            scope: resolvedScope,
            key: knownKeys.includes(normalizedKey) ? normalizedKey : 'neutral'
        };
    }

    function renderStudentServiceStatusBadge(label, options = {}) {
        const statusContract = resolveStudentServiceStatusOwnerContract(options.scope || 'ticket', options.key || label);
        const classes = [
            'student-service-status',
            `student-service-status--${statusContract.scope}`,
            `student-service-status--${statusContract.key}`
        ];
        if (options.extraClasses) {
            String(options.extraClasses)
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .forEach((className) => classes.push(className));
        }
        return `
            <span
                class="${classes.join(' ')}"
                data-student-service-status-scope="${statusContract.scope}"
                data-student-service-status-key="${statusContract.key}"
            >${ssEscape(label)}</span>
        `.replace(/\s+/g, ' ').trim();
    }

    function renderStudentServiceMetaRow(items, className = 'student-service-ticket-card-meta') {
        const safeItems = (Array.isArray(items) ? items : [])
            .map((item) => String(item == null ? '' : item).trim())
            .filter(Boolean);
        return `
            <div class="${className}">
                ${safeItems.map((item) => `<span class="${className}-item">${ssEscape(item)}</span>`).join('')}
            </div>
        `;
    }

    function renderStudentServiceEmptyState(message, extraClasses = '') {
        const classes = ['student-service-empty-state'];
        if (extraClasses) {
            String(extraClasses)
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .forEach((className) => classes.push(className));
        }
        return `<div class="${classes.join(' ')}">${ssEscape(message)}</div>`;
    }

    function renderStudentServiceTicketCard({
        id = '',
        action = 'open-ticket',
        title = '',
        statusLabel = '',
        statusKey = '',
        statusScope = 'ticket',
        metaItems = [],
        copy = '',
        selected = false,
        variant = 'ticket',
        hubArea = '',
        showStatus = true
    } = {}) {
        const cardClasses = ['student-service-ticket-card', `student-service-ticket-card--${variant}`];
        if (selected) cardClasses.push('is-selected');
        const hubAreaAttr = hubArea ? ` data-student-service-hub-area="${ssEscape(hubArea)}"` : '';
        const statusBadge = showStatus && statusLabel
            ? renderStudentServiceStatusBadge(statusLabel, {
                key: statusKey,
                scope: statusScope,
                extraClasses: 'student-service-ticket-card-status'
            })
            : '';
        return `
            <button type="button" class="${cardClasses.join(' ')}" data-student-service-${action}="${ssEscape(id)}"${hubAreaAttr}>
                <div class="student-service-ticket-card-head">
                    <strong class="student-service-ticket-card-title">${ssEscape(title)}</strong>
                    ${statusBadge}
                </div>
                ${renderStudentServiceMetaRow(metaItems)}
                <div class="student-service-ticket-card-copy">${ssEscape(copy)}</div>
            </button>
        `;
    }

    function isStudentServiceTicketBubbleMine(entry, mode, currentUser) {
        const viewerId = String(currentUser?.id || '').trim();
        const authorId = String(entry?.authorId || '').trim();
        if (viewerId && authorId) return authorId === viewerId;
        const isStudentAuthor = entry?.authorRole === USER_ROLES.STUDENT;
        return mode === 'student' ? isStudentAuthor : !isStudentAuthor;
    }

    function renderStudentServiceTicketBubble(entry, ticket, options = {}) {
        const mode = options.mode === 'staff' ? 'staff' : 'student';
        const currentUser = options.currentUser || getStudentServiceCurrentUser();
        const isStudent = entry.authorRole === USER_ROLES.STUDENT;
        const authorName = isStudent ? ticket.studentName : entry.authorName;
        const isMine = isStudentServiceTicketBubbleMine(entry, mode, currentUser);
        const attachmentGallery = typeof window.renderStudentServiceAttachmentGalleryMarkup === 'function'
            ? window.renderStudentServiceAttachmentGalleryMarkup(entry.attachments)
            : '';
        const hasContent = Boolean(entry.message) || Boolean(attachmentGallery);
        if (!hasContent) return '';
        return `
            <div class="student-service-ticket-msg-row ${isMine ? 'is-mine' : ''}">
                <div class="student-service-ticket-msg-meta">
                    <span class="student-service-ticket-msg-author">${ssEscape(authorName)}</span>
                    <span class="student-service-ticket-msg-role">${ssEscape(ssRoleLabel(entry.authorRole))}</span>
                    <span class="student-service-ticket-msg-time">${ssEscape(ssFormatDateTime(entry.createdAt))}</span>
                </div>
                <div class="student-service-ticket-msg-bubble ${isMine ? 'is-mine' : ''}">
                    ${entry.message ? `<div class="student-service-ticket-msg-text">${ssTextBlock(entry.message)}</div>` : ''}
                    ${attachmentGallery}
                </div>
            </div>
        `;
    }

    function renderStudentServiceThreadEntry(entry, selectedTicket, options = {}) {
        return renderStudentServiceTicketBubble(entry, selectedTicket, options);
    }

    function renderStudentServiceTicketComposer(mode, options = {}) {
        const suffix = options.inModal ? '-modal' : '';
        const composerId = options.composerId || 'ticket-reply';
        const textareaId = mode === 'student'
            ? `student-service-student-reply${suffix}`
            : `student-service-staff-reply${suffix}`;
        const placeholder = mode === 'student'
            ? 'Add more details or reply here...'
            : 'Write a reply to the student...';
        const buttonLabel = mode === 'student' ? 'Reply' : 'Send';
        const chipsMarkup = typeof window.renderStudentServiceAttachmentPickerMarkup === 'function'
            ? window.renderStudentServiceAttachmentPickerMarkup(composerId, { chipsOnly: true })
            : '';
        return `
            <div class="student-service-ticket-composer student-service-ticket-composer--compact">
                <div class="student-service-ticket-composer-main">
                    <textarea id="${textareaId}" class="lux-control" rows="2" placeholder="${ssEscape(placeholder)}" autocomplete="off"></textarea>
                    <div class="student-service-ticket-composer-toolbar">
                        <button type="button" class="lux-secondary-btn student-service-ticket-composer-attach" data-student-service-attach="${ssEscape(composerId)}" title="Attach files (up to 5)" aria-label="Attach files"><i class="fas fa-paperclip"></i></button>
                        <button class="lux-primary-btn student-service-ticket-composer-send" type="button" data-student-service-reply-ticket="true"><i class="fas fa-paper-plane"></i> ${buttonLabel}</button>
                    </div>
                </div>
                ${chipsMarkup}
            </div>
        `;
    }

    function renderStudentServiceTicketNotesComposeMarkup(options = {}) {
        const suffix = options.inModal ? '-modal' : '';
        const composerId = options.inModal ? 'internal-note-modal' : 'internal-note';
        const pickerMarkup = typeof window.renderStudentServiceAttachmentPickerMarkup === 'function'
            ? window.renderStudentServiceAttachmentPickerMarkup(composerId)
            : '';
        return `
            <textarea id="student-service-internal-note${suffix}" rows="4" placeholder="Add a private staff-only note..." autocomplete="off"></textarea>
            ${pickerMarkup}
            <button type="button" class="lux-secondary-btn" data-student-service-add-internal-note="true"><i class="fas fa-lock"></i> Save internal note</button>
        `;
    }

    function renderStudentServiceTicketNotesSidebar(ticket) {
        return `
            <aside class="student-service-ticket-notes-sidebar">
                <div class="student-service-kicker">Internal notes</div>
                <div class="student-service-internal-notes-list">
                    ${(ticket.internalNotes || []).map(note => renderStudentServiceInternalNoteEntry(note)).join('') || '<div class="student-service-empty-state">No internal notes yet.</div>'}
                </div>
                <div class="student-service-ticket-notes-compose">
                    ${renderStudentServiceTicketNotesComposeMarkup({ inModal: true })}
                </div>
            </aside>
        `;
    }

    function renderStudentServiceTicketNotesAccordion(ticket, options = {}) {
        const isOpen = Boolean(options.open);
        return `
            <div class="student-service-ticket-notes-accordion ${isOpen ? 'is-open' : ''}">
                <button type="button" class="student-service-ticket-notes-accordion-toggle" data-student-service-toggle-internal-notes="true" aria-expanded="${isOpen ? 'true' : 'false'}">
                    <span><i class="fas fa-lock"></i> Internal notes (staff only)</span>
                    <i class="fas fa-chevron-${isOpen ? 'up' : 'down'}"></i>
                </button>
                <div class="student-service-ticket-notes-accordion-body">
                    <div class="student-service-internal-notes-list">
                        ${(ticket.internalNotes || []).map(note => renderStudentServiceInternalNoteEntry(note)).join('') || '<div class="student-service-empty-state">No internal notes yet.</div>'}
                    </div>
                    <div class="student-service-ticket-notes-compose">
                        ${renderStudentServiceTicketNotesComposeMarkup({ inModal: false })}
                    </div>
                </div>
            </div>
        `;
    }

    function renderStudentServiceTicketConversationHeader(ticket, options = {}) {
        const mode = options.mode === 'staff' ? 'staff' : 'student';
        const layout = options.layout === 'modal' ? 'modal' : 'inline';
        const kicker = mode === 'staff'
            ? (layout === 'modal' ? 'Ticket conversation' : 'Selected ticket')
            : (layout === 'modal' ? 'Your ticket' : 'Continue');
        const staffActions = mode === 'staff' ? `
            <div class="student-service-ticket-detail-actions">
                <button type="button" class="lux-secondary-btn" data-student-service-assign-ticket="true"><i class="fas fa-user-check"></i> Assign to Me</button>
                <select data-student-service-ticket-status-select="true" autocomplete="off">
                    ${STUDENT_SERVICE_STATUSES.map(status => `<option value="${ssEscape(status)}"${ticket.status === status ? ' selected' : ''}>${ssEscape(status)}</option>`).join('')}
                </select>
            </div>
        ` : '';
        const expandButton = layout === 'inline' ? `
            <button type="button" class="student-service-mini-action lux-secondary-btn student-service-ticket-expand-btn" data-student-service-open-ticket-fullscreen="true" title="Open fullscreen conversation"><i class="fas fa-expand"></i> Full screen</button>
        ` : '';
        const closeButton = layout === 'modal' ? `
            <button type="button" class="lux-secondary-btn student-service-ticket-thread-modal-close" data-lux-skip-modern-button="true" data-student-service-cancel-ticket-thread-modal="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
        ` : '';
        return `
            <div class="student-service-ticket-conversation-header">
                <div class="lux-panel-head student-service-ticket-conversation-head">
                    <div>
                        <div class="student-service-kicker lux-section-kicker">${kicker}</div>
                        <div class="lux-panel-title lux-page-title">${ssEscape(ticket.title)}</div>
                    </div>
                    <div class="student-service-ticket-conversation-head-actions">
                        ${renderStudentServiceStatusBadge(ticket.status, {
                            key: ticket.status,
                            scope: 'ticket',
                            extraClasses: 'student-service-ticket-detail-status'
                        })}
                        ${expandButton}
                        ${closeButton}
                    </div>
                </div>
                ${staffActions}
            </div>
        `;
    }

    function renderStudentServiceTicketChatLog(ticket, options = {}) {
        const thread = Array.isArray(ticket?.thread) ? ticket.thread : [];
        const bubbles = thread
            .map(entry => renderStudentServiceTicketBubble(entry, ticket, options))
            .filter(Boolean)
            .join('');
        return `
            <div class="student-service-ticket-chat-log lux-scrollbar" data-student-service-ticket-chat-log="1">
                ${bubbles || '<div class="student-service-empty-state student-service-ticket-chat-empty">No messages yet. Start the conversation below.</div>'}
            </div>
        `;
    }

    function renderStudentServiceTicketConversationShell(ticket, options = {}) {
        if (!ticket) return '';
        const mode = options.mode === 'staff' ? 'staff' : 'student';
        const layout = options.layout === 'modal' ? 'modal' : 'inline';
        const currentUser = options.currentUser || getStudentServiceCurrentUser();
        const bubbleOptions = { mode, currentUser };
        const showComposer = ticket.status !== 'Closed';
        const composerMarkup = showComposer
            ? renderStudentServiceTicketComposer(mode, { inModal: layout === 'modal', composerId: 'ticket-reply' })
            : '<div class="student-service-empty-state">This ticket is closed. Open a new request if you need a new issue reviewed.</div>';
        const notesOpen = Boolean(options.notesOpen);
        const notesMarkup = mode === 'staff'
            ? (layout === 'modal'
                ? renderStudentServiceTicketNotesSidebar(ticket)
                : renderStudentServiceTicketNotesAccordion(ticket, { open: notesOpen }))
            : '';
        const layoutClass = layout === 'modal' && mode === 'staff'
            ? 'student-service-ticket-thread-layout--staff-modal'
            : '';
        return `
            <div class="student-service-ticket-conversation ${layout === 'modal' ? 'is-modal' : 'is-inline'} ${layoutClass}" data-student-service-ticket-conversation="1">
                ${renderStudentServiceTicketConversationHeader(ticket, { mode, layout })}
                <div class="student-service-ticket-thread-layout ${layoutClass}">
                    <div class="student-service-ticket-thread-main">
                        ${renderStudentServiceTicketChatLog(ticket, bubbleOptions)}
                        ${showComposer ? `<div class="student-service-ticket-composer-wrap">${composerMarkup}</div>` : composerMarkup}
                    </div>
                    ${notesMarkup}
                </div>
            </div>
        `;
    }

    function renderStudentServiceInternalNoteEntry(note) {
        const attachmentGallery = typeof window.renderStudentServiceAttachmentGalleryMarkup === 'function'
            ? window.renderStudentServiceAttachmentGalleryMarkup(note.attachments)
            : '';
        return `
            <article class="student-service-internal-note-entry">
                <div class="student-service-thread-entry-top">
                    <strong class="student-service-thread-entry-author">${ssEscape(note.authorName || 'Staff')}</strong>
                    <span class="student-service-thread-entry-role">${ssEscape(ssRoleLabel(note.authorRole))}</span>
                </div>
                <div class="student-service-thread-entry-time">${ssFormatDateTime(note.createdAt)}</div>
                ${note.message ? `<div class="student-service-thread-entry-copy-body">${ssTextBlock(note.message)}</div>` : ''}
                ${attachmentGallery}
            </article>
        `;
    }

    function getStudentServiceTicketInboxPreview(ticket = {}) {
        const thread = Array.isArray(ticket.thread) ? ticket.thread : [];
        const lastEntry = thread[thread.length - 1] || null;
        const previewAuthor = lastEntry?.authorRole === USER_ROLES.STUDENT
            ? 'You'
            : (lastEntry?.authorName || 'Student Service');
        const previewText = String(lastEntry?.message || '').trim()
            || (lastEntry?.attachments?.length ? 'Attachment' : '')
            || String(ticket.latestPreview || ticket.message || '').trim()
            || 'No messages yet';
        return {
            author: previewAuthor,
            text: previewText,
            hasAttachments: Boolean(lastEntry?.attachments?.length),
            updatedAt: ticket.updatedAt || ticket.createdAt || lastEntry?.createdAt
        };
    }

    function renderStudentServiceTicketInboxRow(ticket, options = {}) {
        const preview = getStudentServiceTicketInboxPreview(ticket);
        const relativeTime = typeof window.ssFormatRelativeTime === 'function'
            ? window.ssFormatRelativeTime(preview.updatedAt)
            : ssFormatDateTime(preview.updatedAt);
        const rowClasses = ['student-service-ticket-inbox-row'];
        if (options.selected) rowClasses.push('is-selected');
        if (ticket.status === 'Waiting for Student') rowClasses.push('is-action-needed');
        const statusBadge = renderStudentServiceStatusBadge(ticket.status, {
            key: ticket.status,
            scope: 'ticket',
            extraClasses: 'student-service-ticket-inbox-status'
        });
        const attachmentIcon = preview.hasAttachments && preview.text === 'Attachment'
            ? '<i class="fas fa-paperclip" aria-hidden="true"></i> '
            : '';
        return `
            <button type="button" class="${rowClasses.join(' ')}" data-student-service-open-ticket="${ssEscape(ticket.id)}">
                <div class="student-service-ticket-inbox-row-main">
                    <div class="student-service-ticket-inbox-row-head">
                        <strong class="student-service-ticket-inbox-title">${ssEscape(ticket.title)}</strong>
                        ${statusBadge}
                    </div>
                    <div class="student-service-ticket-inbox-preview">
                        <span class="student-service-ticket-inbox-preview-author">${ssEscape(preview.author)}:</span>
                        ${attachmentIcon}<span class="student-service-ticket-inbox-preview-text">${ssEscape(ssClampText(preview.text, 88))}</span>
                    </div>
                    <div class="student-service-ticket-inbox-meta">
                        <span class="student-service-pill home-hover-chip">${ssEscape(getStudentServiceSupportArea(ticket.serviceArea).label)}</span>
                        <span class="student-service-ticket-inbox-time">${ssEscape(relativeTime)}</span>
                    </div>
                </div>
            </button>
        `;
    }

    function renderStudentServiceTicketConversationPlaceholder(options = {}) {
        const hasTickets = Boolean(options.hasTickets);
        const title = hasTickets ? 'Pick a conversation' : 'Start a conversation';
        const copy = hasTickets
            ? 'Choose a thread from the inbox to continue chatting with Student Service.'
            : 'Send your first request and Student Service will reply here in a private thread.';
        const actionMarkup = hasTickets
            ? ''
            : `<button type="button" class="lux-primary-btn" data-student-service-student-tab="get_help"><i class="fas fa-paper-plane"></i> Send a request</button>`;
        return `
            <div class="student-service-ticket-conversation student-service-ticket-conversation-placeholder is-inline" data-student-service-ticket-conversation="1">
                <div class="student-service-ticket-conversation-header">
                    <div class="lux-panel-head student-service-ticket-conversation-head">
                        <div>
                            <div class="student-service-kicker lux-section-kicker">Conversation</div>
                            <div class="lux-panel-title lux-page-title">${ssEscape(title)}</div>
                        </div>
                    </div>
                </div>
                <div class="student-service-ticket-thread-layout">
                    <div class="student-service-ticket-thread-main">
                        <div class="student-service-ticket-chat-log student-service-ticket-chat-log--placeholder">
                            <div class="student-service-empty-state student-service-ticket-chat-empty">${ssEscape(copy)}</div>
                        </div>
                        <div class="student-service-ticket-composer student-service-ticket-composer--compact student-service-ticket-composer--placeholder">
                            <div class="student-service-ticket-composer-main">
                                <textarea rows="2" placeholder="Your replies will appear here once a conversation is open." disabled autocomplete="off"></textarea>
                                <div class="student-service-ticket-composer-toolbar">
                                    ${actionMarkup}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderStudentServiceMyTicketsSummaryMarkup(statusCounts) {
        const waitingCount = statusCounts.waitingStudent + statusCounts.waitingService;
        return `
            <section class="student-service-zone student-service-zone-track student-service-track-compact-inline">
                <div class="student-service-track-compact-inline-copy">
                    <span class="student-service-kicker lux-section-kicker">Track</span>
                    <div class="student-service-track-compact-inline-counts" aria-label="Ticket status counts">
                        <span><strong>${statusCounts.open}</strong> open</span>
                        <span><strong>${waitingCount}</strong> waiting</span>
                        <span><strong>${statusCounts.review}</strong> in review</span>
                    </div>
                </div>
                <button type="button" class="student-service-mini-action lux-secondary-btn" data-student-service-student-tab="get_help"><i class="fas fa-headset"></i> Get help</button>
            </section>
        `;
    }

    function renderStudentServiceMyTicketsListMarkup(ui, ticketFeed, selectedTicket, currentUser, visibleTickets) {
        const filterMarkup = typeof window.renderStudentServiceStudentInboxFiltersMarkup === 'function'
            ? window.renderStudentServiceStudentInboxFiltersMarkup(ui, visibleTickets, currentUser)
            : '';
        const visibleCount = Array.isArray(visibleTickets) ? visibleTickets.length : 0;
        let listBody = '';
        if (!visibleCount) {
            listBody = `
                <div class="student-service-empty-state student-service-empty-state--tickets">No conversations yet.</div>
                <button type="button" class="lux-primary-btn student-service-inbox-empty-cta" data-student-service-student-tab="get_help"><i class="fas fa-paper-plane"></i> Send a request</button>
            `;
        } else if (!ticketFeed.length) {
            listBody = `<div class="student-service-empty-state student-service-empty-state--tickets">No conversations match your search.</div>`;
        } else {
            listBody = ticketFeed.map((ticket) => renderStudentServiceTicketInboxRow(ticket, {
                selected: selectedTicket?.id === ticket.id
            })).join('');
        }
        return `
            <div class="student-service-workbench-column student-service-workbench-column--inbox student-service-zone-find student-service-zone-inbox">
                <div class="lux-panel-head">
                    <div>
                        <div class="student-service-kicker lux-section-kicker">Inbox</div>
                        <div class="lux-panel-title lux-page-title">Your conversations with Student Service</div>
                    </div>
                    <span class="student-service-panel-chip home-hover-chip">${ticketFeed.length} conversation${ticketFeed.length === 1 ? '' : 's'}</span>
                </div>
                ${filterMarkup}
                <div class="student-service-ticket-inbox-list">
                    ${listBody}
                </div>
            </div>
        `;
    }

    function renderStudentServiceMyTicketsDetailMarkup(selectedTicket, options = {}) {
        const hasTickets = Boolean(options.hasTickets);
        return `
            <div class="student-service-workbench-column student-service-workbench-column--detail student-service-zone-act student-service-zone-conversation">
                ${selectedTicket
                    ? `<div class="student-service-ticket-detail">${renderStudentServiceTicketConversationShell(selectedTicket, {
                        mode: 'student',
                        layout: 'inline',
                        currentUser: getStudentServiceCurrentUser()
                    })}</div>`
                    : `<div class="student-service-ticket-detail">${renderStudentServiceTicketConversationPlaceholder({ hasTickets })}</div>`}
            </div>
        `;
    }

    function ensureStudentServiceStudentHubShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-student-hub-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-student-shell" data-student-service-student-hub-shell="1">
                    <div class="student-service-student-grid student-service-student-grid--request-only">
                        <div data-student-service-student-hub-request="1"></div>
                    </div>
                </div>
            `));
            shell = container.querySelector('[data-student-service-student-hub-shell="1"]');
        }
        return {
            request: shell?.querySelector('[data-student-service-student-hub-request="1"]') || null
        };
    }

    function buildStudentServiceGuidanceBrowserContext(visibleArticles, visibleTickets) {
        const ui = ensureStudentServiceUiState();
        const draft = getStudentServiceDraftTicket();
        const activeArea = getStudentServiceSupportArea(ui.activeSupportArea || draft?.serviceArea || 'general');
        const articleQuery = ui.articleSearch.trim().toLowerCase();
        const visibleStudentTickets = visibleTickets.slice().sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
        const filteredArticles = STUDENT_SERVICE_SUPPORT_AREAS
            .flatMap((area) => {
                const areaArticles = getStudentServiceArticlesForArea(visibleArticles, area.id)
                    .filter(article => article.published);
                return areaArticles.map(article => ({
                    ...article,
                    areaId: area.id,
                    areaLabel: area.label,
                    areaCategory: area.category
                }));
            })
            .filter((article) => studentServiceMatchesQuery(articleQuery, [
                article.areaLabel,
                article.areaCategory,
                article.title,
                article.summary,
                article.category
            ]))
            .sort((left, right) => ssParseTime(right.updatedAt || right.createdAt) - ssParseTime(left.updatedAt || left.createdAt));
        const selectedArticleId = String(ui.selectedGuidanceArticleId || '').trim();
        let selectedArticle = selectedArticleId
            ? filteredArticles.find(article => article.id === selectedArticleId) || null
            : null;
        if (!selectedArticle && filteredArticles.length) {
            selectedArticle = filteredArticles[0];
        }
        if (selectedArticle) {
            ui.selectedGuidanceArticleId = selectedArticle.id;
        } else if (!filteredArticles.length) {
            ui.selectedGuidanceArticleId = '';
        }
        const selectedArea = selectedArticle
            ? {
                ...getStudentServiceSupportArea(selectedArticle.areaId),
                articles: getStudentServiceArticlesForArea(visibleArticles, selectedArticle.areaId).filter(article => article.published)
            }
            : {
                ...activeArea,
                articles: []
            };
        return {
            ui,
            draft,
            activeArea,
            filteredArticles,
            selectedArea,
            selectedArticle,
            visibleStudentTickets
        };
    }

    function hasPublishedStudentServiceGuidance(visibleArticles = []) {
        return (visibleArticles || []).some(article => article.published);
    }

    function renderStudentServiceHubArticleListMarkup(filteredArticles, selectedArticle) {
        const articles = Array.isArray(filteredArticles) ? filteredArticles : [];
        return `
            <div class="student-service-inbox-list student-service-find-guidance-list" role="listbox" aria-label="Guidance articles">
                ${articles.length
                    ? articles.map(article => renderStudentServiceTicketCard({
                        id: article.id,
                        action: 'select-hub-article',
                        title: article.title,
                        showStatus: false,
                        metaItems: [
                            article.areaLabel || '',
                            typeof ssFormatDateTime === 'function' ? ssFormatDateTime(article.updatedAt || article.createdAt) : ''
                        ],
                        copy: article.summary || '',
                        selected: selectedArticle?.id === article.id,
                        variant: 'article',
                        hubArea: article.areaId
                    })).join('')
                    : renderStudentServiceEmptyState('No published guidance matches your search yet.', 'student-service-empty-state--detail')}
            </div>
        `;
    }

    function renderStudentServiceHubArticlePreviewMarkup(selectedArea, selectedArticle) {
        if (!selectedArticle) {
            return renderStudentServiceEmptyState(
                'Select a guidance article to review the official answer.',
                'student-service-empty-state-large student-service-empty-state--detail'
            );
        }
        const previewTitle = selectedArticle.title || selectedArea.label;
        const previewSummary = selectedArticle.summary || '';
        const previewBody = selectedArticle.content || '';
        return `
            <div class="student-service-ticket-detail student-service-article-preview" data-student-service-hub-preview="1">
                <div class="lux-panel-head student-service-find-preview-head">
                    <div>
                        <div class="student-service-kicker lux-section-kicker">Selected guidance</div>
                        <div class="lux-panel-title student-service-find-preview-title">${ssEscape(previewTitle)}</div>
                    </div>
                </div>
                <div class="student-service-ticket-detail-meta">
                    <span class="student-service-pill home-hover-chip">${ssEscape(selectedArea.label)}</span>
                    ${selectedArticle?.category ? `<span class="student-service-pill home-hover-chip">${ssEscape(selectedArticle.category)}</span>` : ''}
                </div>
                <div class="student-service-ticket-detail-copy student-service-ticket-detail-copy--summary student-service-article-preview-copy lux-panel-copy">${ssEscape(previewSummary)}</div>
                <div class="lux-page-copy student-service-article-preview-body">${ssTextBlock(previewBody)}</div>
            </div>
        `;
    }

    function renderStudentServiceGuidanceBrowserMarkup(ui, filteredArticles, activeArea, selectedArea, selectedArticle) {
        const articleCount = Array.isArray(filteredArticles) ? filteredArticles.length : 0;
        const articleCountMarkup = articleCount > 0
            ? `<span class="student-service-find-guidance-count">${articleCount} article${articleCount === 1 ? '' : 's'}</span>`
            : '';
        return `
            <div class="student-service-guidance-browser" data-student-service-guidance-browser="1">
                <div class="student-service-find-toolbar student-service-guidance-toolbar">
                    <div class="student-service-find-search">
                        <i class="fas fa-search"></i>
                        <input id="student-service-article-search" type="search" value="${ssEscape(ui.articleSearch || '')}" data-student-service-article-search-input="true" placeholder="Search articles and guidance">
                    </div>
                    <button type="button" class="student-service-mini-action student-service-find-toolbar-clear" data-student-service-article-search-clear="true"><i class="fas fa-eraser"></i> Clear</button>
                </div>
                <div class="student-service-guidance-workspace">
                    <div class="student-service-find-guidance student-service-guidance-pane student-service-guidance-pane--list home-hover-chip lux-soft-chrome" data-student-service-find-guidance="1">
                        <header class="student-service-find-guidance-head student-service-guidance-pane-head">
                            <div>
                                <div class="student-service-kicker lux-section-kicker">Guidance articles</div>
                            </div>
                            ${articleCountMarkup}
                        </header>
                        <div class="student-service-guidance-pane-body">
                            ${renderStudentServiceHubArticleListMarkup(filteredArticles, selectedArticle)}
                        </div>
                    </div>
                    <div class="student-service-find-preview student-service-guidance-pane student-service-guidance-pane--preview home-hover-chip lux-soft-chrome" data-student-service-find-preview="1">
                        <header class="student-service-guidance-pane-head student-service-guidance-pane-head--preview">
                            <div class="student-service-kicker lux-section-kicker">Selected guidance</div>
                        </header>
                        <div class="student-service-guidance-pane-body">
                            ${renderStudentServiceHubArticlePreviewMarkup(selectedArea, selectedArticle)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderStudentServiceStudentHubRequestMarkup(currentUser, selectedArea, draft, ui, visibleTickets, studentTicketCounts) {
        const safeDraft = draft && typeof draft === 'object'
            ? draft
            : { title: '', message: '', serviceArea: 'general', category: 'General Question' };
        const publishedLayout = typeof window.getStudentServicePublishedInboxFilterLayout === 'function'
            ? window.getStudentServicePublishedInboxFilterLayout()
            : null;
        const filterMarkup = typeof window.renderStudentServiceInboxDropdownFiltersMarkup === 'function'
            ? window.renderStudentServiceInboxDropdownFiltersMarkup(ui, visibleTickets, currentUser, { layout: publishedLayout })
            : '';
        return `
            <section class="student-service-zone student-service-zone-act">
                <div class="lux-panel-head">
                    <div>
                        <div class="student-service-kicker lux-section-kicker">Contact Student Service</div>
                        <div class="lux-panel-title lux-page-title">Start a clear private request in one pass.</div>
                        <div class="lux-panel-copy lux-page-copy">This lane is for personal follow-up, office guidance, and cases that should not be public.</div>
                    </div>
                    <div class="lux-panel-head-actions">
                        <button type="button" class="student-service-mini-action lux-secondary-btn student-service-guidance-open-btn" data-student-service-open-guidance-modal="true" aria-haspopup="dialog"><i class="fas fa-book-open"></i> Browse rules & guidance</button>
                    </div>
                </div>
                <div class="student-service-request-form" data-lux-transparency-exempt="1">
                    ${filterMarkup ? `<div class="student-service-request-filters">${filterMarkup}</div>` : ''}
                    <input id="student-service-ticket-title" class="lux-control" type="text" value="${ssEscape(safeDraft.title)}" data-student-service-draft-ticket-field="title" placeholder="Short title" autocomplete="off">
                    <textarea id="student-service-ticket-message" class="lux-control" rows="7" data-student-service-draft-ticket-field="message" placeholder="Describe what happened, what you expected, and what you need." autocomplete="off">${ssEscape(safeDraft.message)}</textarea>
                    ${typeof window.renderStudentServiceAttachmentPickerMarkup === 'function' ? window.renderStudentServiceAttachmentPickerMarkup('ticket-create') : ''}
                    <div class="student-service-action-row">
                        <button class="lux-primary-btn" type="button" data-student-service-submit-ticket="true"><i class="fas fa-paper-plane"></i> Send request</button>
                    </div>
                </div>
                ${renderStudentServiceStudentHubTrackMarkup(studentTicketCounts)}
            </section>
        `;
    }

    function renderStudentServiceStudentHubTrackMarkup(studentTicketCounts) {
        const waitingCount = studentTicketCounts.waitingStudent + studentTicketCounts.waitingService;
        return `
            <div class="student-service-student-hub-track-compact student-service-student-hub-track-compact--zone" data-student-service-student-hub-track="1" role="contentinfo">
                <div class="student-service-student-hub-track-compact-counts" aria-label="Ticket status counts">
                    <span class="student-service-student-hub-track-compact-count"><strong>${studentTicketCounts.open}</strong> open</span>
                    <span class="student-service-student-hub-track-compact-count"><strong>${waitingCount}</strong> waiting</span>
                    <span class="student-service-student-hub-track-compact-count"><strong>${studentTicketCounts.review}</strong> in review</span>
                    <span class="student-service-student-hub-track-compact-count"><strong>${studentTicketCounts.resolved}</strong> resolved</span>
                </div>
                <button type="button" class="student-service-mini-action student-service-student-hub-track-compact-link" data-student-service-student-tab="my_tickets"><i class="fas fa-inbox"></i> My tickets</button>
            </div>
        `;
    }

    function ensureStudentServiceResponderShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-responder-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-staff-shell" data-student-service-responder-shell="1">
                    <div data-student-service-responder-summary="1"></div>
                    <section class="student-service-zone student-service-workbench-merged home-hover-chip">
                        <div class="student-service-staff-grid">
                            <div data-student-service-responder-list="1"></div>
                            <div data-student-service-responder-detail="1"></div>
                        </div>
                    </section>
                </div>
            `));
            shell = container.querySelector('[data-student-service-responder-shell="1"]');
        }
        return {
            summary: shell?.querySelector('[data-student-service-responder-summary="1"]') || null,
            list: shell?.querySelector('[data-student-service-responder-list="1"]') || null,
            detail: shell?.querySelector('[data-student-service-responder-detail="1"]') || null
        };
    }

    function renderStudentServiceResponderSummaryMarkup(visibleArticles, filteredArticles) {
        return `
            <section class="student-service-zone student-service-zone-ops">
                <div class="lux-panel-head">
                    <div>
                        <div class="student-service-kicker">Student Service</div>
                        <div class="lux-panel-title">Official guidance and private-case boundaries.</div>
                        <div class="lux-panel-copy">Professors and TAs should answer reusable academic questions in the Q&A lane. Private student cases, finance, and identity-sensitive follow-up stay with Student Service.</div>
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-lane="qa"><i class="fas fa-comments"></i> Open Q&A lane</button>
                </div>
                <div class="student-service-track-grid">
                    <article class="student-service-track-card"><span>Guidance articles</span><strong>${visibleArticles.length}</strong></article>
                    <article class="student-service-track-card"><span>Visible now</span><strong>${filteredArticles.length}</strong></article>
                    <article class="student-service-track-card"><span>Scope</span><strong>Faculty</strong></article>
                    <article class="student-service-track-card"><span>Queue owner</span><strong>Service</strong></article>
                </div>
            </section>
        `;
    }

    function renderStudentServiceResponderListMarkup(ui, filteredArticles, selectedArticle) {
        return `
            <div class="student-service-workbench-column student-service-workbench-column--inbox">
                <div class="lux-panel-head">
                    <div>
                        <div class="student-service-kicker">Rules & guidance</div>
                        <div class="lux-panel-title">Review reusable guidance before responding publicly.</div>
                    </div>
                </div>
                <div class="student-service-staff-search">
                    <div class="student-service-find-search">
                        <i class="fas fa-search"></i>
                        <input id="student-service-article-search" type="search" value="${ssEscape(ui.articleSearch || '')}" data-student-service-article-search-input="true" placeholder="Search guidance articles by title">
                    </div>
                </div>
                <div class="student-service-inbox-list">
                    ${filteredArticles.map((article) => renderStudentServiceTicketCard({
                        id: article.id,
                        action: 'open-article',
                        title: article.title,
                        statusLabel: article.published ? 'Published' : 'Draft',
                        statusKey: article.published ? 'published' : 'draft',
                        statusScope: 'article',
                        metaItems: [],
                        copy: article.summary,
                        selected: selectedArticle?.id === article.id,
                        variant: 'article'
                    })).join('') || renderStudentServiceEmptyState('No guidance articles match the current filters.', 'student-service-empty-state--tickets')}
                </div>
            </div>
        `;
    }

    function renderStudentServiceResponderDetailMarkup(selectedArticle) {
        return `
            <div class="student-service-workbench-column student-service-workbench-column--detail">
                <div class="student-service-ticket-detail">
                    <div class="lux-panel-head">
                        <div>
                            <div class="student-service-kicker">Selected guidance</div>
                            <div class="lux-panel-title">${ssEscape(selectedArticle?.title || 'Select an article to review')}</div>
                        </div>
                    </div>
                    ${selectedArticle ? `
                        <div class="student-service-ticket-detail-meta">
                            ${renderStudentServiceStatusBadge(selectedArticle.published ? 'Published' : 'Draft', {
                                key: selectedArticle.published ? 'published' : 'draft',
                                scope: 'article',
                                extraClasses: 'student-service-ticket-detail-status'
                            })}
                        </div>
                        <div class="student-service-ticket-detail-copy student-service-ticket-detail-copy--summary">${ssEscape(selectedArticle.summary || '')}</div>
                        <div class="student-service-article-preview-body">${ssTextBlock(selectedArticle.content || '')}</div>
                    ` : renderStudentServiceEmptyState('Select a guidance article to review the official answer and scope.', 'student-service-empty-state-large student-service-empty-state--detail')}
                </div>
            </div>
        `;
    }

    window.buildStudentServiceGuidanceBrowserContext = buildStudentServiceGuidanceBrowserContext;
    window.renderStudentServiceGuidanceBrowserMarkup = renderStudentServiceGuidanceBrowserMarkup;

    __kiuSsApi.renderStudentServiceStudentHub = window.renderStudentServiceStudentHub = function renderStudentServiceStudentHub(container, visibleArticles, visibleTickets) {
        const ui = ensureStudentServiceUiState();
        const draft = getStudentServiceDraftTicket();
        const currentUser = getStudentServiceCurrentUser();
        const visibleStudentTickets = visibleTickets.slice().sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
        const studentTicketCounts = {
            open: visibleStudentTickets.filter(ticket => ticket.status === 'Open').length,
            review: visibleStudentTickets.filter(ticket => ticket.status === 'In Review').length,
            waitingStudent: visibleStudentTickets.filter(ticket => ticket.status === 'Waiting for Student').length,
            waitingService: visibleStudentTickets.filter(ticket => ticket.status === 'Waiting for Service').length,
            resolved: visibleStudentTickets.filter(ticket => ['Resolved', 'Closed'].includes(ticket.status)).length
        };
        const { selectedArea } = buildStudentServiceGuidanceBrowserContext(visibleArticles, visibleTickets);
        const publishedLayout = typeof window.getStudentServicePublishedInboxFilterLayout === 'function'
            ? window.getStudentServicePublishedInboxFilterLayout()
            : null;
        const shell = ensureStudentServiceStudentHubShell(container);
        if (!shell) return;
        const requestMarkupChanged = setStudentServiceMarkup(
            shell.request,
            `student-service-student-hub:request:${selectedArea.id}:${studentTicketCounts.open}:${studentTicketCounts.review}:${studentTicketCounts.waitingStudent}:${studentTicketCounts.waitingService}:${studentTicketCounts.resolved}:${JSON.stringify(ui.customTicketFilters || {})}:${JSON.stringify(publishedLayout?.filters || [])}`,
            renderStudentServiceStudentHubRequestMarkup(currentUser, selectedArea, draft, ui, visibleTickets, studentTicketCounts)
        );
        if (requestMarkupChanged && typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(shell.request);
        }
    };

    __kiuSsApi.renderStudentServiceMyTicketsHub = window.renderStudentServiceMyTicketsHub = function renderStudentServiceMyTicketsHub(container, visibleTickets) {
        const ui = ensureStudentServiceUiState();
        const currentUser = getStudentServiceCurrentUser();
        const ticketFeed = typeof window.getStudentServiceFilteredStudentTickets === 'function'
            ? window.getStudentServiceFilteredStudentTickets(visibleTickets, currentUser)
            : visibleTickets.slice().sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
        const selectedTicket = ticketFeed.length ? ensureSelectedStudentServiceTicket(ticketFeed) : null;
        const statusCounts = {
            open: visibleTickets.filter(ticket => ticket.status === 'Open').length,
            review: visibleTickets.filter(ticket => ticket.status === 'In Review').length,
            waitingStudent: visibleTickets.filter(ticket => ticket.status === 'Waiting for Student').length,
            waitingService: visibleTickets.filter(ticket => ticket.status === 'Waiting for Service').length
        };
        const shell = ensureStudentServiceMyTicketsShell(container);
        if (!shell) return;
        setStudentServiceMarkup(shell.summary, 'student-service-my-tickets:summary', renderStudentServiceMyTicketsSummaryMarkup(statusCounts));
        setStudentServiceMarkup(
            shell.list,
            `student-service-my-tickets:list:${ui.ticketSearch || ''}:${selectedTicket?.id || ''}:${ticketFeed.length}:${visibleTickets.length}`,
            renderStudentServiceMyTicketsListMarkup(ui, ticketFeed, selectedTicket, currentUser, visibleTickets)
        );
        setStudentServiceMarkup(
            shell.detail,
            `student-service-my-tickets:detail:${selectedTicket?.id || ''}:${selectedTicket?.updatedAt || ''}:${selectedTicket?.status || ''}`,
            renderStudentServiceMyTicketsDetailMarkup(selectedTicket, { hasTickets: visibleTickets.length > 0 })
        );
    };

    __kiuSsApi.renderStudentServiceResponderServiceLane = window.renderStudentServiceResponderServiceLane = function renderStudentServiceResponderServiceLane(container, visibleArticles) {
        const ui = ensureStudentServiceUiState();
        const filteredArticles = getStudentServiceFilteredArticles(visibleArticles);
        const selectedArticle = ensureSelectedStudentServiceArticle(filteredArticles.length ? filteredArticles : visibleArticles);
        const shell = ensureStudentServiceResponderShell(container);
        if (!shell) return;
        setStudentServiceMarkup(shell.summary, 'student-service-responder:summary', renderStudentServiceResponderSummaryMarkup(visibleArticles, filteredArticles));
        setStudentServiceMarkup(
            shell.list,
            `student-service-responder:list:${ui.articleSearch || ''}:${selectedArticle?.id || ''}:${filteredArticles.length}`,
            renderStudentServiceResponderListMarkup(ui, filteredArticles, selectedArticle)
        );
        setStudentServiceMarkup(
            shell.detail,
            `student-service-responder:detail:${selectedArticle?.id || ''}:${selectedArticle?.updatedAt || ''}:${selectedArticle?.published ? 'published' : 'draft'}`,
            renderStudentServiceResponderDetailMarkup(selectedArticle)
        );
    };

    function ensureStudentServiceStaffWorkbenchShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-staff-workbench-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-staff-shell" data-student-service-staff-workbench-shell="1">
                    <div data-student-service-staff-workbench-summary="1"></div>
                    <section class="student-service-zone student-service-workbench-merged home-hover-chip">
                        <div class="student-service-staff-grid">
                            <div data-student-service-staff-workbench-primary="1"></div>
                            <div data-student-service-staff-workbench-detail="1"></div>
                        </div>
                    </section>
                </div>
            `));
            shell = container.querySelector('[data-student-service-staff-workbench-shell="1"]');
        }
        return {
            summary: shell?.querySelector('[data-student-service-staff-workbench-summary="1"]') || null,
            primary: shell?.querySelector('[data-student-service-staff-workbench-primary="1"]') || null,
            detail: shell?.querySelector('[data-student-service-staff-workbench-detail="1"]') || null
        };
    }

    function renderStudentServiceStaffWorkbenchSummaryMarkup() {
        return '';
    }

    function renderStudentServiceStaffWorkbenchPrimaryMarkup(panel, ui, responderOnly, currentUser, visibleTickets, focusTicketList, selectedTicket, filteredQuestions, selectedQuestion, filteredArticles, editorArticle, showArticleActions = false) {
        const showDeskModeSwitch = !responderOnly && showArticleActions && panel !== 'qa';
        const deskModeSwitchMarkup = showDeskModeSwitch && typeof window.renderStudentServiceStaffPanelSwitchMarkup === 'function'
            ? window.renderStudentServiceStaffPanelSwitchMarkup(panel)
            : '';
        const articleActionsMarkup = panel === 'articles' && showArticleActions
            ? `<div class="student-service-action-row student-service-action-row--compact">
                <button type="button" class="student-service-mini-action" data-student-service-start-new-article="true"><i class="fas fa-plus"></i> New article</button>
               </div>`
            : '';
        const zoneHeadActionsMarkup = deskModeSwitchMarkup || articleActionsMarkup
            ? `<div class="lux-panel-head-actions">
                ${deskModeSwitchMarkup}
                ${articleActionsMarkup}
            </div>`
            : '';
        return `
            <div class="student-service-workbench-column student-service-workbench-column--inbox">
                <div class="lux-panel-head">
                    <div>
                        <div class="student-service-kicker">${panel === 'articles' ? 'Knowledge base' : panel === 'qa' ? 'Public Q&A' : 'Inbox'}</div>
                        <div class="lux-panel-title">${panel === 'articles' ? 'Publish reusable guidance' : panel === 'qa' ? 'Moderate and answer public questions' : 'Work the next useful ticket'}</div>
                    </div>
                    ${zoneHeadActionsMarkup}
                </div>

                ${panel === 'tickets' ? `
                    ${typeof window.renderStudentServiceInboxFiltersMarkup === 'function'
                        ? window.renderStudentServiceInboxFiltersMarkup(ui, visibleTickets, currentUser)
                        : ''}
                    <div class="student-service-inbox-list">
                        ${focusTicketList.map((ticket) => renderStudentServiceTicketCard({
                            id: ticket.id,
                            action: 'open-ticket',
                            title: ticket.title,
                            statusLabel: ticket.status,
                            statusKey: ticket.status,
                            statusScope: 'ticket',
                            metaItems: [
                                ticket.studentName,
                                getStudentServiceSupportArea(ticket.serviceArea).label,
                                ssFormatDateTime(ticket.updatedAt || ticket.createdAt)
                            ],
                            copy: ticket.latestPreview || ticket.message,
                            selected: selectedTicket?.id === ticket.id
                        })).join('') || renderStudentServiceEmptyState('No tickets match the current filters.', 'student-service-empty-state--tickets')}
                    </div>
                ` : panel === 'qa' ? `
                    <div class="student-service-staff-search">
                        <div class="student-service-find-search">
                            <i class="fas fa-search"></i>
                            <input type="search" value="${ssEscape(ui.qaSearch || '')}" data-student-service-question-filter-input="qaSearch" placeholder="Search questions, answers, or categories">
                        </div>
                    </div>
                    <div class="student-service-inbox-list">
                        ${renderStudentServiceQuestionList(filteredQuestions, { mode: 'staff', selectedQuestionId: selectedQuestion?.id || '' }) || '<div class="student-service-empty-state">No questions match the current filters.</div>'}
                    </div>
                ` : `
                    <div class="student-service-staff-search">
                        <div class="student-service-find-search">
                            <i class="fas fa-search"></i>
                            <input id="student-service-article-search" type="search" value="${ssEscape(ui.articleSearch || '')}" data-student-service-article-search-input="true" placeholder="Search articles by title">
                        </div>
                    </div>
                    <div class="student-service-inbox-list">
                        ${filteredArticles.map((article) => renderStudentServiceTicketCard({
                            id: article.id,
                            action: 'edit-article',
                            title: article.title,
                            statusLabel: article.published ? 'Published' : 'Draft',
                            statusKey: article.published ? 'published' : 'draft',
                            statusScope: 'article',
                            metaItems: [],
                            copy: article.summary,
                            selected: (editorArticle?.id || ui.articleEditorId || ui.selectedArticleId) === article.id,
                            variant: 'article'
                        })).join('') || renderStudentServiceEmptyState('No articles match the current filters.', 'student-service-empty-state--tickets')}
                    </div>
                `}
            </div>
        `;
    }

    function renderStudentServiceStaffWorkbenchDetailMarkup(panel, selectedTicket, selectedQuestion, editorArticle, showArticleActions = false) {
        return `
            <div class="student-service-workbench-column student-service-workbench-column--detail">
                ${panel === 'tickets' ? `
                    ${selectedTicket ? `
                        <div class="student-service-ticket-detail">
                            ${renderStudentServiceTicketConversationShell(selectedTicket, {
                                mode: 'staff',
                                layout: 'inline',
                                notesOpen: Boolean(ensureStudentServiceUiState().detailSections?.internalNotes),
                                currentUser: getStudentServiceCurrentUser()
                            })}
                        </div>
                    ` : renderStudentServiceEmptyState('Select a ticket from the inbox to review the detail and reply.', 'student-service-empty-state-large student-service-empty-state--detail')}
                ` : panel === 'qa' ? `
                    ${renderStudentServiceQuestionDetail(selectedQuestion, { mode: 'staff' })}
                ` : `
                    <div class="student-service-ticket-detail">
                        <div class="lux-panel-head">
                            <div>
                                <div class="student-service-kicker">Knowledge editor</div>
                                <div class="lux-panel-title">${ssEscape(editorArticle?.title || 'Create a new article')}</div>
                            </div>
                        </div>
                        <div class="student-service-ticket-detail-meta">
                            ${renderStudentServiceStatusBadge(editorArticle?.published ? 'Published' : 'Draft', {
                                key: editorArticle?.published ? 'published' : 'draft',
                                scope: 'article',
                                extraClasses: 'student-service-ticket-detail-status'
                            })}
                        </div>
                        <div class="student-service-request-form">
                            <input id="student-service-article-title" class="lux-control" type="text" value="${ssEscape(editorArticle?.title || '')}" placeholder="Article title" autocomplete="off">
                            <textarea id="student-service-article-summary" class="lux-control" rows="3" placeholder="Short summary" autocomplete="off">${ssEscape(editorArticle?.summary || '')}</textarea>
                            <textarea id="student-service-article-content" class="lux-control" rows="10" placeholder="Full article content" autocomplete="off">${ssEscape(editorArticle?.content || '')}</textarea>
                            ${showArticleActions ? `
                            <div class="student-service-action-row">
                                <button class="lux-secondary-btn" type="button" data-student-service-save-article="draft"><i class="far fa-save"></i> Save Draft</button>
                                <button class="lux-primary-btn" type="button" data-student-service-save-article="publish"><i class="fas fa-check-circle"></i> Publish Article</button>
                                ${editorArticle?.id ? `<button class="lux-secondary-btn student-service-danger-btn" type="button" data-student-service-delete-article="${ssEscape(editorArticle.id)}"><i class="fas fa-trash-alt"></i> Remove article</button>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    window.renderStudentServiceTicketConversationShell = renderStudentServiceTicketConversationShell;
    window.renderStudentServiceTicketBubble = renderStudentServiceTicketBubble;
    window.renderStudentServiceTicketConversationHeader = renderStudentServiceTicketConversationHeader;
    window.renderStudentServiceTicketComposer = renderStudentServiceTicketComposer;
    window.renderStudentServiceTicketNotesSidebar = renderStudentServiceTicketNotesSidebar;
    window.renderStudentServiceTicketNotesAccordion = renderStudentServiceTicketNotesAccordion;
    window.isStudentServiceTicketBubbleMine = isStudentServiceTicketBubbleMine;
    window.renderStudentServiceTicketInboxRow = renderStudentServiceTicketInboxRow;
    window.renderStudentServiceTicketConversationPlaceholder = renderStudentServiceTicketConversationPlaceholder;
    window.getStudentServiceTicketInboxPreview = getStudentServiceTicketInboxPreview;

    window.renderStudentServiceStaffWorkbench = function renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options = {}) {
        const ui = ensureStudentServiceUiState();
        const currentUser = getStudentServiceCurrentUser();
        const role = getEffectiveUserRole();
        const canModerate = canCurrentUserModerateStudentService();
        const showArticleActions = typeof window.canShowStudentServiceArticleEditorActions === 'function'
            ? window.canShowStudentServiceArticleEditorActions()
            : canModerate;
        const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canModerate;
        const lane = options.lane === 'qa' ? 'qa' : 'service';
        const visibleQuestions = getStudentServiceVisibleQuestions();
        const filteredQuestions = getStudentServiceFilteredQuestions(visibleQuestions);
        const selectedQuestion = lane === 'qa'
            ? getStudentServiceOpenQuestion(filteredQuestions)
            : null;
        const filteredTickets = getStudentServiceFilteredStaffTickets(visibleTickets, currentUser);
        const selectedTicket = filteredTickets.length ? ensureSelectedStudentServiceTicket(filteredTickets) : null;
        const filteredArticles = getStudentServiceFilteredArticles(visibleArticles);
        const allArticles = ensureStudentServiceStores().articles;
        const articleQuery = ui.articleSearch.trim().toLowerCase();
        const editorArticle = ui.articleDraftMode
            ? null
            : String(ui.articleEditorId || '').trim()
                ? allArticles.find(article => article.id === ui.articleEditorId)
                : String(ui.selectedArticleId || '').trim()
                    ? allArticles.find(article => article.id === ui.selectedArticleId)
                    : (articleQuery ? null : ensureSelectedStudentServiceArticle(filteredArticles.length ? filteredArticles : visibleArticles));
        const needsServiceCount = visibleTickets.filter(ticket => ['Open', 'In Review', 'Waiting for Service'].includes(ticket.status)).length;
        const waitingForStudentCount = visibleTickets.filter(ticket => ticket.status === 'Waiting for Student').length;
        const unassignedCount = visibleTickets.filter(ticket => !String(ticket.assignedToId || '').trim() && !['Resolved', 'Closed'].includes(ticket.status)).length;
        const resolvedCount = visibleTickets.filter(ticket => ticket.status === 'Resolved').length;
        const unansweredCount = visibleQuestions.filter(question => !(question.answers || []).some(answer => answer.status === 'published')).length;
        const panel = lane === 'qa'
            ? 'qa'
            : (ui.staffPanel === 'articles' ? 'articles' : 'tickets');
        const focusTicketList = filteredTickets;

        if (lane === 'qa') {
            const guard = window.__studentServiceStaffQaFeedGuard;
            if (typeof guard === 'function') {
                return guard(container, {
                    filteredQuestions,
                    selectedQuestion,
                    responderOnly,
                    unansweredCount
                });
            }
            return window.renderStudentServiceStaffQaFeed?.(container, {
                filteredQuestions,
                selectedQuestion,
                responderOnly,
                unansweredCount
            });
        }

        const shell = ensureStudentServiceStaffWorkbenchShell(container);
        if (!shell) return;
        setStudentServiceMarkup(
            shell.summary,
            `student-service-staff-workbench:summary:${panel}:${needsServiceCount}:${unansweredCount}:${unassignedCount}:${resolvedCount}`,
            renderStudentServiceStaffWorkbenchSummaryMarkup(lane, responderOnly, panel, needsServiceCount, waitingForStudentCount, unansweredCount, unassignedCount, resolvedCount)
        );
        setStudentServiceMarkup(
            shell.primary,
            `student-service-staff-workbench:primary:${panel}:${ui.ticketSearch || ''}:${ui.qaSearch || ''}:${ui.articleSearch || ''}:${selectedTicket?.id || ''}:${selectedQuestion?.id || ''}:${editorArticle?.id || ''}:${ui.articleDraftMode ? 'new' : ''}:${focusTicketList.length}:${filteredQuestions.length}:${filteredArticles.length}`,
            renderStudentServiceStaffWorkbenchPrimaryMarkup(panel, ui, responderOnly, currentUser, visibleTickets, focusTicketList, selectedTicket, filteredQuestions, selectedQuestion, filteredArticles, editorArticle, showArticleActions)
        );
        setStudentServiceMarkup(
            shell.detail,
            `student-service-staff-workbench:detail:${panel}:${selectedTicket?.id || ''}:${selectedTicket?.updatedAt || ''}:${selectedQuestion?.id || ''}:${editorArticle?.id || ''}:${editorArticle?.updatedAt || ''}:${ui.articleDraftMode ? 'new' : ''}`,
            renderStudentServiceStaffWorkbenchDetailMarkup(panel, selectedTicket, selectedQuestion, editorArticle, showArticleActions)
        );
    };
})();
