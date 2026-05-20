(function initStudentServiceServiceModule() {
    if (window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED) return;
    window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED = true;

    function ensureStudentServiceMyTicketsShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-my-tickets-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-student-shell" data-student-service-my-tickets-shell="1">
                    <div data-student-service-my-tickets-summary="1"></div>
                    <div class="student-service-ticket-grid">
                        <div data-student-service-my-tickets-list="1"></div>
                        <div data-student-service-my-tickets-detail="1"></div>
                    </div>
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

    function renderStudentServiceMyTicketsSummaryMarkup(statusCounts) {
        return `
            <section class="student-service-zone student-service-zone-track">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Track</div>
                        <div class="student-service-zone-title">Your open cases, replies, and latest status.</div>
                        <div class="student-service-zone-copy">This view keeps the active thread in the center and makes it easy to continue the conversation.</div>
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-student-tab="get_help"><i class="fas fa-headset"></i> Back to help</button>
                </div>
                <div class="student-service-track-grid">
                    <article class="student-service-track-card"><span>Open</span><strong>${statusCounts.open}</strong></article>
                    <article class="student-service-track-card"><span>In review</span><strong>${statusCounts.review}</strong></article>
                    <article class="student-service-track-card"><span>Waiting student</span><strong>${statusCounts.waitingStudent}</strong></article>
                    <article class="student-service-track-card"><span>Waiting service</span><strong>${statusCounts.waitingService}</strong></article>
                </div>
            </section>
        `;
    }

    function renderStudentServiceMyTicketsListMarkup(ui, ticketFeed, selectedTicket) {
        return `
            <section class="student-service-zone student-service-zone-find">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Search</div>
                        <div class="student-service-zone-title">Find the case you want to continue.</div>
                    </div>
                    <span class="student-service-panel-chip">${ticketFeed.length} ticket${ticketFeed.length === 1 ? '' : 's'}</span>
                </div>
                <div class="student-service-find-bar">
                    <div class="student-service-find-search">
                        <i class="fas fa-search"></i>
                        <input type="search" value="${ssEscape(ui.ticketSearch || '')}" data-student-service-ticket-filter-input="ticketSearch" placeholder="Search your tickets by title, topic, or status">
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-ticket-filter-field="ticketSearch" data-student-service-ticket-filter-value=""><i class="fas fa-eraser"></i> Clear</button>
                </div>
                <div class="student-service-ticket-list">
                    ${ticketFeed.map(ticket => {
                        const tone = getStudentServiceStatusTone(ticket.status);
                        const isSelected = selectedTicket?.id === ticket.id;
                        return `
                            <button type="button" class="student-service-ticket-card${isSelected ? ' is-selected' : ''}" data-student-service-open-ticket="${ssEscape(ticket.id)}">
                                <div class="student-service-ticket-card-top">
                                    <strong>${ssEscape(ticket.title)}</strong>
                                    <span class="student-service-status" style="--student-service-status-bg:${tone.bg}; --student-service-status-text:${tone.text};">${ssEscape(ticket.status)}</span>
                                </div>
                                <div class="student-service-ticket-card-meta">${ssEscape(getStudentServiceSupportArea(ticket.serviceArea).label)} | ${ssEscape(ssFormatDateTime(ticket.updatedAt || ticket.createdAt))}</div>
                                <div class="student-service-ticket-card-copy">${ssEscape(ticket.latestPreview || ticket.message)}</div>
                            </button>
                        `;
                    }).join('') || '<div class="student-service-empty-state">You have not opened any tickets yet.</div>'}
                </div>
            </section>
        `;
    }

    function renderStudentServiceMyTicketsDetailMarkup(selectedTicket) {
        return `
            <section class="student-service-zone student-service-zone-act">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Continue</div>
                        <div class="student-service-zone-title">${ssEscape(selectedTicket?.title || 'Pick a ticket to continue')}</div>
                    </div>
                    ${selectedTicket ? `<span class="student-service-panel-chip">${ssEscape(selectedTicket.status)}</span>` : ''}
                </div>
                ${selectedTicket ? `
                    <div class="student-service-ticket-detail">
                        <div class="student-service-ticket-detail-meta">
                            <span class="student-service-pill">${ssEscape(getStudentServiceSupportArea(selectedTicket.serviceArea).label)}</span>
                            <span class="student-service-pill">Opened ${ssFormatDateTime(selectedTicket.createdAt)}</span>
                            <span class="student-service-pill">Updated ${ssFormatDateTime(selectedTicket.updatedAt)}</span>
                            <span class="student-service-pill">Assignee ${ssEscape(selectedTicket.assignedToName || 'Unassigned')}</span>
                        </div>
                        <div class="student-service-ticket-detail-copy">${ssEscape(selectedTicket.latestPreview || selectedTicket.message)}</div>
                        <div class="student-service-thread-list">
                            ${selectedTicket.thread.map(entry => `
                                <div class="student-service-thread-entry ${entry.authorRole === USER_ROLES.STUDENT ? 'is-student' : 'is-support'}">
                                    <div class="student-service-thread-entry-top">
                                        <strong>${entry.authorRole === USER_ROLES.STUDENT ? ssEscape(selectedTicket.studentName) : ssEscape(entry.authorName)}</strong>
                                        <span>${ssEscape(ssRoleLabel(entry.authorRole))}</span>
                                    </div>
                                    <div class="student-service-thread-entry-time">${ssFormatDateTime(entry.createdAt)}</div>
                                    <div class="student-service-thread-entry-copy">${ssTextBlock(entry.message)}</div>
                                </div>
                            `).join('')}
                        </div>
                        ${selectedTicket.status !== 'Closed' ? `
                            <div class="student-service-thread-reply">
                                <textarea id="student-service-student-reply" rows="4" placeholder="Add more details or reply here."></textarea>
                                <button class="lux-primary-btn" type="button" data-student-service-reply-ticket="true"><i class="fas fa-reply"></i> Reply</button>
                            </div>
                        ` : '<div class="student-service-empty-state">This ticket is closed. Open a new request if you need a new issue reviewed.</div>'}
                    </div>
                ` : `
                    <div class="student-service-empty-state student-service-empty-state-large">
                        Select a ticket on the left to open the full thread.
                    </div>
                `}
            </section>
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
                    <div data-student-service-student-hub-find="1"></div>
                    <div class="student-service-student-grid">
                        <div data-student-service-student-hub-request="1"></div>
                        <div data-student-service-student-hub-track="1"></div>
                    </div>
                </div>
            `));
            shell = container.querySelector('[data-student-service-student-hub-shell="1"]');
        }
        return {
            find: shell?.querySelector('[data-student-service-student-hub-find="1"]') || null,
            request: shell?.querySelector('[data-student-service-student-hub-request="1"]') || null,
            track: shell?.querySelector('[data-student-service-student-hub-track="1"]') || null
        };
    }

    function renderStudentServiceStudentHubFindMarkup(ui, filteredAreas, activeArea, selectedArea, selectedArticle, relatedPages) {
        return `
            <section class="student-service-zone student-service-zone-find">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Rules & guidance</div>
                        <div class="student-service-zone-title">Find the right support topic before opening a private case.</div>
                        <div class="student-service-zone-copy">Browse official guidance, policy notes, and linked pages first. Then send one clear request only when you still need direct help.</div>
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-article-search-clear="true"><i class="fas fa-eraser"></i> Clear search</button>
                </div>
                <div class="student-service-find-bar">
                    <div class="student-service-find-search">
                        <i class="fas fa-search"></i>
                        <input id="student-service-article-search" type="search" value="${ssEscape(ui.articleSearch || '')}" data-student-service-article-search-input="true" placeholder="Search help topics, articles, and guidance">
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-focus-area="${ssEscape(selectedArea.id)}"><i class="fas fa-bullseye"></i> Focus current lane</button>
                </div>
                <div class="student-service-find-grid">
                    ${filteredAreas.map(area => `
                        <button type="button" class="student-service-lane-card${activeArea.id === area.id ? ' is-active' : ''}" data-student-service-focus-area="${ssEscape(area.id)}">
                            <div class="student-service-lane-head">
                                <strong>${ssEscape(area.label)}</strong>
                                <span>${area.openCount} open</span>
                            </div>
                            <div class="student-service-lane-copy">${ssEscape(area.description)}</div>
                            <div class="student-service-lane-foot">
                                <span>${area.articleCount} articles</span>
                                <span>${ssEscape(area.category)}</span>
                            </div>
                        </button>
                    `).join('') || '<div class="student-service-empty-state">No lane matches the current search. Clear the search to see every route.</div>'}
                </div>
                <div class="student-service-article-preview">
                    <div class="student-service-article-preview-head">
                        <div>
                            <div class="student-service-kicker">Featured guidance</div>
                            <div class="student-service-panel-title">${ssEscape(selectedArticle?.title || selectedArea.label)}</div>
                        </div>
                        <span class="student-service-panel-chip">${ssEscape(selectedArticle?.published ? 'Published' : 'Draft')}</span>
                    </div>
                    <div class="student-service-article-preview-copy">${ssEscape(selectedArticle?.summary || selectedArea.nextStep)}</div>
                    <div class="student-service-article-preview-body">${ssTextBlock(selectedArticle?.content || selectedArea.nextStep)}</div>
                    <div class="student-service-action-row">
                        ${relatedPages.length ? relatedPages.map(pageId => `
                            <button type="button" class="lux-secondary-btn" data-student-service-navigate="${ssEscape(pageId)}"><i class="fas fa-arrow-right"></i> ${ssEscape(getStudentServicePageLabel(pageId))}</button>
                        `).join('') : ''}
                        <button type="button" class="lux-primary-btn" data-student-service-student-tab="my_tickets"><i class="fas fa-comments"></i> Track my tickets</button>
                    </div>
                </div>
            </section>
        `;
    }

    function renderStudentServiceStudentHubRequestMarkup(ui, currentUser, selectedArea, draft, relatedPages) {
        return `
            <section class="student-service-zone student-service-zone-act">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Contact Student Service</div>
                        <div class="student-service-zone-title">Start a clear private request in one pass.</div>
                        <div class="student-service-zone-copy">This lane is for personal follow-up, office guidance, and cases that should not be public.</div>
                    </div>
                    <span class="student-service-panel-chip">Auto-filled context</span>
                </div>
                <div class="student-service-request-meta">
                    <span class="student-service-pill">Topic ${ssEscape(selectedArea.label)}</span>
                    <span class="student-service-pill">Faculty ${ssEscape(ssFacultyLabel(currentUser?.facultyCode || currentUser?.faculty || ''))}</span>
                    <span class="student-service-pill">${ssEscape(ssSemesterLabel(currentUser?.semester || ''))}</span>
                </div>
                <div class="student-service-request-form">
                    <input id="student-service-ticket-title" type="text" value="${ssEscape(draft.title)}" data-student-service-draft-ticket-field="title" placeholder="Short title">
                    <textarea id="student-service-ticket-message" rows="7" data-student-service-draft-ticket-field="message" placeholder="Describe what happened, what you expected, and what you need."></textarea>
                    <button type="button" class="lux-secondary-btn" data-student-service-toggle-student-details="true"><i class="fas ${ui.studentDetailsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${ui.studentDetailsExpanded ? 'Hide optional details' : 'Add more details'}</button>
                    ${ui.studentDetailsExpanded ? `
                        <div class="student-service-request-extra">
                            <select id="student-service-ticket-subject" data-student-service-draft-ticket-field="subjectValue">
                                <option value="">Course or subject (optional)</option>
                                ${getStudentServiceSubjectOptions().map(subject => `
                                    <option value="${ssEscape(`${subject.subjectId}::${subject.groupId}`)}"${draft.subjectValue === `${subject.subjectId}::${subject.groupId}` ? ' selected' : ''}>${ssEscape(subject.subjectName)}${subject.groupName ? ` (${ssEscape(subject.groupName)})` : ''}</option>
                                `).join('')}
                            </select>
                            <input id="student-service-ticket-context" type="text" value="${ssEscape(draft.relatedContextLabel)}" data-student-service-draft-ticket-field="relatedContextLabel" placeholder="Where did this happen?">
                        </div>
                    ` : ''}
                    <div class="student-service-action-row">
                        <button class="lux-primary-btn" type="button" data-student-service-submit-ticket="true"><i class="fas fa-paper-plane"></i> Send request</button>
                        ${relatedPages.length ? relatedPages.map(pageId => `
                            <button type="button" class="lux-secondary-btn" data-student-service-navigate="${ssEscape(pageId)}"><i class="fas fa-arrow-right"></i> ${ssEscape(getStudentServicePageLabel(pageId))}</button>
                        `).join('') : ''}
                    </div>
                </div>
            </section>
        `;
    }

    function renderStudentServiceStudentHubTrackMarkup(studentTicketCounts, latestTicket, myTickets) {
        return `
            <section class="student-service-zone student-service-zone-track">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">My tickets</div>
                        <div class="student-service-zone-title">See what is open and what comes next.</div>
                        <div class="student-service-zone-copy">Track private replies, waiting status, and the next ticket thread you need to continue.</div>
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-student-tab="my_tickets"><i class="fas fa-comments"></i> My tickets</button>
                </div>
                <div class="student-service-track-grid">
                    <article class="student-service-track-card">
                        <span>Open</span>
                        <strong>${studentTicketCounts.open}</strong>
                    </article>
                    <article class="student-service-track-card">
                        <span>Waiting</span>
                        <strong>${studentTicketCounts.waitingStudent + studentTicketCounts.waitingService}</strong>
                    </article>
                    <article class="student-service-track-card">
                        <span>Review</span>
                        <strong>${studentTicketCounts.review}</strong>
                    </article>
                    <article class="student-service-track-card">
                        <span>Resolved</span>
                        <strong>${studentTicketCounts.resolved}</strong>
                    </article>
                </div>
                <div class="student-service-track-panel">
                    ${latestTicket ? `
                        <div class="student-service-track-panel-head">
                            <div>
                                <div class="student-service-kicker">Latest case</div>
                                <div class="student-service-panel-title">${ssEscape(latestTicket.title)}</div>
                            </div>
                            <span class="student-service-status" style="--student-service-status-bg:${getStudentServiceStatusTone(latestTicket.status).bg}; --student-service-status-text:${getStudentServiceStatusTone(latestTicket.status).text};">${ssEscape(latestTicket.status)}</span>
                        </div>
                        <div class="student-service-track-panel-copy">${ssEscape(latestTicket.latestPreview || latestTicket.message)}</div>
                        <div class="student-service-track-panel-meta">
                            <span class="student-service-pill">${ssEscape(getStudentServiceSupportArea(latestTicket.serviceArea).label)}</span>
                            <span class="student-service-pill">Updated ${ssFormatDateTime(latestTicket.updatedAt || latestTicket.createdAt)}</span>
                        </div>
                        <button type="button" class="lux-secondary-btn" data-student-service-open-ticket="${ssEscape(latestTicket.id)}"><i class="fas fa-arrow-right"></i> Open thread</button>
                    ` : `
                        <div class="student-service-empty-state">
                            No ticket yet. Your first request will appear here with the next reply and status change.
                        </div>
                    `}
                </div>
                <div class="student-service-track-list">
                    ${myTickets.length ? myTickets.map(ticket => {
                        const tone = getStudentServiceStatusTone(ticket.status);
                        return `
                            <button type="button" class="student-service-ticket-card${ticket.id === latestTicket?.id ? ' is-selected' : ''}" data-student-service-open-ticket="${ssEscape(ticket.id)}">
                                <div class="student-service-ticket-card-top">
                                    <strong>${ssEscape(ticket.title)}</strong>
                                    <span class="student-service-status" style="--student-service-status-bg:${tone.bg}; --student-service-status-text:${tone.text};">${ssEscape(ticket.status)}</span>
                                </div>
                                <div class="student-service-ticket-card-meta">${ssEscape(getStudentServiceSupportArea(ticket.serviceArea).label)} | ${ssEscape(ssFormatDateTime(ticket.updatedAt || ticket.createdAt))}</div>
                                <div class="student-service-ticket-card-copy">${ssEscape(ticket.latestPreview || ticket.message)}</div>
                            </button>
                        `;
                    }).join('') : '<div class="student-service-empty-state">No cases yet. Submit a request and it will show up here.</div>'}
                </div>
            </section>
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
                    <div class="student-service-staff-grid">
                        <div data-student-service-responder-list="1"></div>
                        <div data-student-service-responder-detail="1"></div>
                    </div>
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
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Student Service</div>
                        <div class="student-service-zone-title">Official guidance and private-case boundaries.</div>
                        <div class="student-service-zone-copy">Professors and TAs should answer reusable academic questions in the Q&A lane. Private student cases, finance, and identity-sensitive follow-up stay with Student Service.</div>
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
            <section class="student-service-zone">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Rules & guidance</div>
                        <div class="student-service-zone-title">Review reusable guidance before responding publicly.</div>
                    </div>
                </div>
                <div class="student-service-staff-search">
                    <div class="student-service-find-search">
                        <i class="fas fa-search"></i>
                        <input id="student-service-article-search" type="search" value="${ssEscape(ui.articleSearch || '')}" data-student-service-article-search-input="true" placeholder="Search guidance articles by title or category">
                    </div>
                </div>
                <div class="student-service-inbox-list">
                    ${filteredArticles.map(article => {
                        const isSelected = selectedArticle?.id === article.id;
                        return `
                            <button type="button" class="student-service-ticket-card${isSelected ? ' is-selected' : ''}" data-student-service-open-article="${ssEscape(article.id)}">
                                <div class="student-service-ticket-card-top">
                                    <strong>${ssEscape(article.title)}</strong>
                                    <span class="student-service-status" style="--student-service-status-bg:${article.published ? 'rgba(var(--lux-home-secondary-rgb),0.14)' : 'rgba(var(--lux-home-secondary-rgb),0.10)'}; --student-service-status-text:var(--lux-home-secondary);">${article.published ? 'Published' : 'Draft'}</span>
                                </div>
                                <div class="student-service-ticket-card-meta">${ssEscape(getStudentServiceSupportArea(article.serviceArea).label)} | Audience: ${ssEscape(article.audience)}</div>
                                <div class="student-service-ticket-card-copy">${ssEscape(article.summary)}</div>
                            </button>
                        `;
                    }).join('') || '<div class="student-service-empty-state">No guidance articles match the current filters.</div>'}
                </div>
            </section>
        `;
    }

    function renderStudentServiceResponderDetailMarkup(selectedArticle) {
        return `
            <section class="student-service-zone">
                <div class="student-service-ticket-detail">
                    <div class="student-service-zone-head">
                        <div>
                            <div class="student-service-kicker">Selected guidance</div>
                            <div class="student-service-zone-title">${ssEscape(selectedArticle?.title || 'Select an article to review')}</div>
                        </div>
                    </div>
                    ${selectedArticle ? `
                        <div class="student-service-ticket-detail-meta">
                            <span class="student-service-pill">${ssEscape(getStudentServiceSupportArea(selectedArticle.serviceArea).label)}</span>
                            <span class="student-service-pill">${ssEscape(selectedArticle.audience || 'students')}</span>
                            <span class="student-service-pill">${selectedArticle.published ? 'Published' : 'Draft'}</span>
                        </div>
                        <div class="student-service-ticket-detail-copy">${ssEscape(selectedArticle.summary || '')}</div>
                        <div class="student-service-article-preview-body">${ssTextBlock(selectedArticle.content || '')}</div>
                    ` : '<div class="student-service-empty-state student-service-empty-state-large">Select a guidance article to review the official answer and scope.</div>'}
                </div>
            </section>
        `;
    }

    window.renderStudentServiceStudentHub = function renderStudentServiceStudentHub(container, visibleArticles, visibleTickets) {
        const ui = ensureStudentServiceUiState();
        const draft = getStudentServiceDraftTicket();
        const currentUser = getStudentServiceCurrentUser();
        const activeArea = getStudentServiceSupportArea(ui.activeSupportArea || draft.serviceArea);
        const articleQuery = ui.articleSearch.trim().toLowerCase();
        const visibleStudentTickets = visibleTickets.slice().sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
        const studentTicketCounts = {
            open: visibleStudentTickets.filter(ticket => ticket.status === 'Open').length,
            review: visibleStudentTickets.filter(ticket => ticket.status === 'In Review').length,
            waitingStudent: visibleStudentTickets.filter(ticket => ticket.status === 'Waiting for Student').length,
            waitingService: visibleStudentTickets.filter(ticket => ticket.status === 'Waiting for Service').length,
            resolved: visibleStudentTickets.filter(ticket => ['Resolved', 'Closed'].includes(ticket.status)).length
        };
        const filteredAreas = STUDENT_SERVICE_SUPPORT_AREAS
            .map(area => {
                const areaArticles = getStudentServiceArticlesForArea(visibleArticles, area.id);
                const matches = studentServiceMatchesQuery(articleQuery, [
                    area.label,
                    area.description,
                    area.category,
                    area.nextStep,
                    ...areaArticles.map(article => [article.title, article.summary, article.category].join(' '))
                ]);
                return {
                    ...area,
                    openCount: visibleStudentTickets.filter(ticket => ticket.serviceArea === area.id).length,
                    articleCount: areaArticles.filter(article => article.published).length,
                    matches,
                    articles: areaArticles.filter(article => article.published)
                };
            })
            .filter(area => area.matches)
            .sort((left, right) => {
                if (left.id === activeArea.id) return -1;
                if (right.id === activeArea.id) return 1;
                return right.openCount - left.openCount;
            });
        const selectedArea = filteredAreas.find(area => area.id === activeArea.id) || filteredAreas[0] || {
            ...activeArea,
            openCount: 0,
            articleCount: 0,
            articles: []
        };
        const selectedArticle = ensureSelectedStudentServiceArticle(selectedArea.articles.length ? selectedArea.articles : visibleArticles);
        const myTickets = visibleStudentTickets.slice(0, 4);
        const latestTicket = myTickets[0] || null;
        const relatedPages = (selectedArea.links || [])
            .filter(pageId => typeof canRoleAccessPage !== 'function' || canRoleAccessPage(pageId, USER_ROLES.STUDENT))
            .slice(0, 2);
        const shell = ensureStudentServiceStudentHubShell(container);
        if (!shell) return;
        setStudentServiceMarkup(
            shell.find,
            `student-service-student-hub:find:${ui.articleSearch || ''}:${selectedArea.id}:${selectedArticle?.id || ''}:${filteredAreas.length}`,
            renderStudentServiceStudentHubFindMarkup(ui, filteredAreas, activeArea, selectedArea, selectedArticle, relatedPages)
        );
        setStudentServiceMarkup(
            shell.request,
            `student-service-student-hub:request:${selectedArea.id}:${draft.title || ''}:${draft.subjectValue || ''}:${draft.relatedContextLabel || ''}:${ui.studentDetailsExpanded ? 'open' : 'closed'}`,
            renderStudentServiceStudentHubRequestMarkup(ui, currentUser, selectedArea, draft, relatedPages)
        );
        setStudentServiceMarkup(
            shell.track,
            `student-service-student-hub:track:${latestTicket?.id || ''}:${latestTicket?.updatedAt || ''}:${myTickets.length}`,
            renderStudentServiceStudentHubTrackMarkup(studentTicketCounts, latestTicket, myTickets)
        );
    };

    window.renderStudentServiceMyTicketsHub = function renderStudentServiceMyTicketsHub(container, visibleTickets) {
        const ui = ensureStudentServiceUiState();
        const query = ui.ticketSearch.trim().toLowerCase();
        const ticketFeed = visibleTickets.filter(ticket => !query || [
            ticket.title,
            ticket.serviceArea,
            ticket.status,
            ticket.latestPreview,
            ticket.relatedSubjectName,
            ticket.relatedContextLabel
        ].some(field => String(field || '').toLowerCase().includes(query))).sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
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
            `student-service-my-tickets:list:${ui.ticketSearch || ''}:${selectedTicket?.id || ''}:${ticketFeed.length}`,
            renderStudentServiceMyTicketsListMarkup(ui, ticketFeed, selectedTicket)
        );
        setStudentServiceMarkup(
            shell.detail,
            `student-service-my-tickets:detail:${selectedTicket?.id || ''}:${selectedTicket?.updatedAt || ''}:${selectedTicket?.status || ''}`,
            renderStudentServiceMyTicketsDetailMarkup(selectedTicket)
        );
    };

    window.renderStudentServiceResponderServiceLane = function renderStudentServiceResponderServiceLane(container, visibleArticles) {
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
                    <div class="student-service-staff-grid">
                        <div data-student-service-staff-workbench-primary="1"></div>
                        <div data-student-service-staff-workbench-detail="1"></div>
                    </div>
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

    function renderStudentServiceStaffWorkbenchSummaryMarkup(lane, responderOnly, panel, needsServiceCount, waitingForStudentCount, pendingQuestionsCount, unansweredCount, unassignedCount, resolvedCount) {
        return `
            <section class="student-service-zone student-service-zone-ops">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">${lane === 'qa' ? (responderOnly ? 'Responder desk' : 'Q&A desk') : 'Service desk'}</div>
                        <div class="student-service-zone-title">${lane === 'qa' ? (responderOnly ? 'Answer faculty-scoped public questions.' : 'Moderate and answer public questions.') : 'Work private tickets and publish official guidance.'}</div>
                        <div class="student-service-zone-copy">${lane === 'qa' ? (responderOnly ? 'Professors and TAs can answer academic questions here. Student Service still controls publication and moderation.' : 'This lane focuses only on reusable public answers, moderation, and question quality.') : 'This lane handles private student contact, ticket routing, and official guidance articles.'}</div>
                    </div>
                    ${lane === 'service' && !responderOnly ? `
                        <div class="student-service-panel-switch">
                            <button type="button" data-student-service-panel-switch="tickets" class="${panel === 'tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}"><i class="fas fa-inbox"></i> Tickets</button>
                            <button type="button" data-student-service-panel-switch="articles" class="${panel === 'articles' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}"><i class="fas fa-book-open"></i> Knowledge</button>
                        </div>
                    ` : ''}
                </div>
                <div class="student-service-track-grid student-service-track-grid--desk">
                    ${lane === 'service' && !responderOnly ? `<article class="student-service-track-card"><span>Needs service</span><strong>${needsServiceCount}</strong></article>` : ''}
                    ${lane === 'service' && !responderOnly ? `<article class="student-service-track-card"><span>Waiting student</span><strong>${waitingForStudentCount}</strong></article>` : ''}
                    <article class="student-service-track-card"><span>Pending Q&A</span><strong>${pendingQuestionsCount}</strong></article>
                    <article class="student-service-track-card"><span>Unanswered</span><strong>${unansweredCount}</strong></article>
                    ${lane === 'service' && !responderOnly ? `<article class="student-service-track-card"><span>Unassigned</span><strong>${unassignedCount}</strong></article>` : ''}
                    ${lane === 'service' && !responderOnly ? `<article class="student-service-track-card"><span>Resolved</span><strong>${resolvedCount}</strong></article>` : ''}
                </div>
            </section>
        `;
    }

    function renderStudentServiceStaffWorkbenchPrimaryMarkup(panel, ui, responderOnly, currentUser, visibleTickets, focusTicketList, selectedTicket, filteredQuestions, selectedQuestion, filteredArticles, editorArticle) {
        return `
            <section class="student-service-zone">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">${panel === 'articles' ? 'Knowledge base' : panel === 'qa' ? 'Public Q&A' : 'Inbox'}</div>
                        <div class="student-service-zone-title">${panel === 'articles' ? 'Publish reusable guidance' : panel === 'qa' ? 'Moderate and answer public questions' : 'Work the next useful ticket'}</div>
                    </div>
                    ${panel === 'tickets'
                        ? `<button type="button" class="student-service-mini-action" data-student-service-toggle-advanced-filters="true"><i class="fas ${ui.staffFiltersExpanded ? 'fa-sliders' : 'fa-filter'}"></i> ${ui.staffFiltersExpanded ? 'Hide filters' : 'More filters'}</button>`
                        : panel === 'articles'
                            ? `<button type="button" class="student-service-mini-action" data-student-service-start-new-article="true"><i class="fas fa-plus"></i> New article</button>`
                            : `<button type="button" class="student-service-mini-action" data-student-service-question-filter-field="qaStatus" data-student-service-question-filter-value="${responderOnly ? 'pending_review' : 'all'}"><i class="fas fa-filter"></i> Reset filters</button>`}
                </div>

                ${panel === 'tickets' ? `
                    <div class="student-service-staff-search">
                        <div class="student-service-find-search">
                            <i class="fas fa-search"></i>
                            <input id="student-service-ticket-search" type="search" value="${ssEscape(ui.ticketSearch || '')}" data-student-service-ticket-filter-input="ticketSearch" placeholder="Search title, student, category, status">
                        </div>
                        <div class="student-service-staff-filter-row">
                            <select id="student-service-ticket-status-filter" data-student-service-ticket-filter-input="ticketStatus">
                                ${['all', ...STUDENT_SERVICE_STATUSES].map(status => `<option value="${ssEscape(status)}"${(ui.ticketStatus || 'all') === status ? ' selected' : ''}>${status === 'all' ? 'All statuses' : status}</option>`).join('')}
                            </select>
                            <select id="student-service-ticket-category-filter" data-student-service-ticket-filter-input="ticketCategory">
                                <option value="all"${(ui.ticketCategory || 'all') === 'all' ? ' selected' : ''}>All categories</option>
                                ${STUDENT_SERVICE_CATEGORIES.map(category => `<option value="${ssEscape(category)}"${ui.ticketCategory === category ? ' selected' : ''}>${ssEscape(category)}</option>`).join('')}
                            </select>
                        </div>
                        ${ui.staffFiltersExpanded ? `
                            <div class="student-service-staff-filter-row student-service-staff-filter-row--expanded">
                                <select data-student-service-ticket-filter-input="ticketServiceArea">
                                    <option value="all"${ui.ticketServiceArea === 'all' ? ' selected' : ''}>All topics</option>
                                    ${STUDENT_SERVICE_SUPPORT_AREAS.map(area => `<option value="${ssEscape(area.id)}"${ui.ticketServiceArea === area.id ? ' selected' : ''}>${ssEscape(area.label)}</option>`).join('')}
                                </select>
                                <select data-student-service-ticket-filter-input="ticketAssignee">
                                    <option value="all"${ui.ticketAssignee === 'all' ? ' selected' : ''}>All work</option>
                                    <option value="mine"${ui.ticketAssignee === 'mine' ? ' selected' : ''}>Assigned to me</option>
                                    <option value="unassigned"${ui.ticketAssignee === 'unassigned' ? ' selected' : ''}>Unassigned</option>
                                    <option value="assigned"${ui.ticketAssignee === 'assigned' ? ' selected' : ''}>Assigned only</option>
                                </select>
                                <select data-student-service-ticket-filter-input="ticketFaculty">
                                    <option value="all"${ui.ticketFaculty === 'all' ? ' selected' : ''}>All faculties</option>
                                    ${[...new Set(visibleTickets.map(ticket => normalizeFacultyCode(ticket.faculty || '', '')).filter(Boolean))].map(facultyCode => `<option value="${ssEscape(facultyCode)}"${ui.ticketFaculty === facultyCode ? ' selected' : ''}>${ssEscape(ssFacultyLabel(facultyCode))}</option>`).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                    <div class="student-service-inbox-list">
                        ${focusTicketList.map(ticket => {
                            const tone = getStudentServiceStatusTone(ticket.status);
                            const isSelected = selectedTicket?.id === ticket.id;
                            const area = getStudentServiceSupportArea(ticket.serviceArea);
                            return `
                                <button type="button" class="student-service-ticket-card${isSelected ? ' is-selected' : ''}" data-student-service-open-ticket="${ssEscape(ticket.id)}">
                                    <div class="student-service-ticket-card-top">
                                        <strong>${ssEscape(ticket.title)}</strong>
                                        <span class="student-service-status" style="--student-service-status-bg:${tone.bg}; --student-service-status-text:${tone.text};">${ssEscape(ticket.status)}</span>
                                    </div>
                                    <div class="student-service-ticket-card-meta">${ssEscape(ticket.studentName)} | ${ssEscape(area.label)} | ${ssEscape(ssFormatDateTime(ticket.updatedAt || ticket.createdAt))}</div>
                                    <div class="student-service-ticket-card-copy">${ssEscape(ticket.latestPreview || ticket.message)}</div>
                                </button>
                            `;
                        }).join('') || '<div class="student-service-empty-state">No tickets match the current filters.</div>'}
                    </div>
                ` : panel === 'qa' ? `
                    <div class="student-service-staff-search">
                        <div class="student-service-find-search">
                            <i class="fas fa-search"></i>
                            <input type="search" value="${ssEscape(ui.qaSearch || '')}" data-student-service-question-filter-input="qaSearch" placeholder="Search questions, answers, or categories">
                        </div>
                        <div class="student-service-staff-filter-row">
                            <select data-student-service-question-filter-input="qaStatus">
                                ${[
                                    ['all', 'All statuses'],
                                    ['pending_review', 'Pending review'],
                                    ['published', 'Published'],
                                    ['archived', 'Archived']
                                ].filter(entry => !responderOnly || ['all', 'pending_review', 'published'].includes(entry[0])).map(entry => `
                                    <option value="${entry[0]}"${(ui.qaStatus || (responderOnly ? 'pending_review' : 'all')) === entry[0] ? ' selected' : ''}>${entry[1]}</option>
                                `).join('')}
                            </select>
                            <select data-student-service-question-filter-input="qaCategory">
                                <option value="all"${ui.qaCategory === 'all' ? ' selected' : ''}>All categories</option>
                                ${STUDENT_SERVICE_CATEGORIES.map(category => `<option value="${ssEscape(category)}"${ui.qaCategory === category ? ' selected' : ''}>${ssEscape(category)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="student-service-staff-filter-row">
                            <select data-student-service-question-filter-input="qaFaculty">
                                <option value="${ssEscape(normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '') || 'ALL')}"${(ui.qaFaculty || '') === normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '') ? ' selected' : ''}>Current faculty</option>
                                <option value="ALL"${ui.qaFaculty === 'ALL' ? ' selected' : ''}>All faculties</option>
                            </select>
                        </div>
                    </div>
                    <div class="student-service-inbox-list">
                        ${renderStudentServiceQuestionList(filteredQuestions, { mode: 'staff', selectedQuestionId: selectedQuestion?.id || '' }) || '<div class="student-service-empty-state">No questions match the current filters.</div>'}
                    </div>
                ` : `
                    <div class="student-service-staff-search">
                        <div class="student-service-find-search">
                            <i class="fas fa-search"></i>
                            <input id="student-service-article-search" type="search" value="${ssEscape(ui.articleSearch || '')}" data-student-service-article-search-input="true" placeholder="Search articles by title or category">
                        </div>
                    </div>
                    <div class="student-service-inbox-list">
                        ${filteredArticles.map(article => {
                            const isSelected = (editorArticle?.id || ui.articleEditorId || ui.selectedArticleId) === article.id;
                            return `
                                <button type="button" class="student-service-ticket-card${isSelected ? ' is-selected' : ''}" data-student-service-edit-article="${ssEscape(article.id)}">
                                    <div class="student-service-ticket-card-top">
                                        <strong>${ssEscape(article.title)}</strong>
                                        <span class="student-service-status" style="--student-service-status-bg:${article.published ? 'rgba(var(--lux-home-secondary-rgb),0.14)' : 'rgba(var(--lux-home-secondary-rgb),0.10)'}; --student-service-status-text:var(--lux-home-secondary);">${article.published ? 'Published' : 'Draft'}</span>
                                    </div>
                                    <div class="student-service-ticket-card-meta">${ssEscape(getStudentServiceSupportArea(article.serviceArea).label)} | Audience: ${ssEscape(article.audience)}</div>
                                    <div class="student-service-ticket-card-copy">${ssEscape(article.summary)}</div>
                                </button>
                            `;
                        }).join('') || '<div class="student-service-empty-state">No articles match the current filters.</div>'}
                    </div>
                `}
            </section>
        `;
    }

    function renderStudentServiceStaffWorkbenchDetailMarkup(panel, selectedTicket, selectedQuestion, editorArticle) {
        return `
            <section class="student-service-zone">
                ${panel === 'tickets' ? `
                    ${selectedTicket ? `
                        <div class="student-service-ticket-detail">
                            <div class="student-service-zone-head">
                                <div>
                                    <div class="student-service-kicker">Selected ticket</div>
                                    <div class="student-service-zone-title">${ssEscape(selectedTicket.title)}</div>
                                </div>
                                <span class="student-service-status" style="--student-service-status-bg:${getStudentServiceStatusTone(selectedTicket.status).bg}; --student-service-status-text:${getStudentServiceStatusTone(selectedTicket.status).text};">${ssEscape(selectedTicket.status)}</span>
                            </div>
                            <div class="student-service-ticket-detail-meta">
                                <span class="student-service-pill">${ssEscape(getStudentServiceSupportArea(selectedTicket.serviceArea).label)}</span>
                                <span class="student-service-pill">${ssEscape(selectedTicket.studentName)}</span>
                                <span class="student-service-pill">Updated ${ssFormatDateTime(selectedTicket.updatedAt || selectedTicket.createdAt)}</span>
                                <span class="student-service-pill">Assignee ${ssEscape(selectedTicket.assignedToName || 'Unassigned')}</span>
                            </div>
                            <div class="student-service-ticket-detail-copy">${ssEscape(selectedTicket.latestPreview || selectedTicket.message)}</div>
                            <div class="student-service-ticket-detail-actions">
                                <button type="button" class="lux-secondary-btn" data-student-service-assign-ticket="true"><i class="fas fa-user-check"></i> Assign to Me</button>
                                <select data-student-service-ticket-status-select="true">
                                    ${STUDENT_SERVICE_STATUSES.map(status => `<option value="${ssEscape(status)}"${selectedTicket.status === status ? ' selected' : ''}>${ssEscape(status)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="student-service-thread-list">
                                ${selectedTicket.thread.map(entry => `
                                    <div class="student-service-thread-entry ${entry.authorRole === USER_ROLES.STUDENT ? 'is-student' : 'is-support'}">
                                        <div class="student-service-thread-entry-top">
                                            <strong>${entry.authorRole === USER_ROLES.STUDENT ? ssEscape(selectedTicket.studentName) : ssEscape(entry.authorName)}</strong>
                                            <span>${ssEscape(ssRoleLabel(entry.authorRole))}</span>
                                        </div>
                                        <div class="student-service-thread-entry-time">${ssFormatDateTime(entry.createdAt)}</div>
                                        <div class="student-service-thread-entry-copy">${ssTextBlock(entry.message)}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="student-service-thread-reply">
                                <textarea id="student-service-staff-reply" rows="5" placeholder="Reply to the student here..."></textarea>
                                <button class="lux-primary-btn" type="button" data-student-service-reply-ticket="true"><i class="fas fa-reply"></i> Send Reply</button>
                            </div>
                        </div>
                    ` : '<div class="student-service-empty-state student-service-empty-state-large">Select a ticket from the inbox to review the detail and reply.</div>'}
                ` : panel === 'qa' ? `
                    ${renderStudentServiceQuestionDetail(selectedQuestion, { mode: 'staff' })}
                ` : `
                    <div class="student-service-ticket-detail">
                        <div class="student-service-zone-head">
                            <div>
                                <div class="student-service-kicker">Knowledge editor</div>
                                <div class="student-service-zone-title">${ssEscape(editorArticle?.title || 'Create a new article')}</div>
                            </div>
                        </div>
                        <div class="student-service-ticket-detail-meta">
                            <span class="student-service-pill">${ssEscape(getStudentServiceSupportArea(editorArticle?.serviceArea || 'general').label)}</span>
                            <span class="student-service-pill">${ssEscape(editorArticle?.audience || 'students')}</span>
                            <span class="student-service-pill">${editorArticle?.published ? 'Published' : 'Draft'}</span>
                        </div>
                        <div class="student-service-request-form">
                            <input id="student-service-article-title" type="text" value="${ssEscape(editorArticle?.title || '')}" placeholder="Article title">
                            <div class="student-service-staff-filter-row">
                                <select id="student-service-article-category">
                                    ${STUDENT_SERVICE_CATEGORIES.map(category => `<option value="${ssEscape(category)}"${(editorArticle?.category || 'General Question') === category ? ' selected' : ''}>${ssEscape(category)}</option>`).join('')}
                                </select>
                                <select id="student-service-article-audience">
                                    ${['students', 'staff', 'all'].map(audience => `<option value="${audience}"${(editorArticle?.audience || 'students') === audience ? ' selected' : ''}>Audience: ${audience}</option>`).join('')}
                                </select>
                            </div>
                            <textarea id="student-service-article-summary" rows="3" placeholder="Short summary">${ssEscape(editorArticle?.summary || '')}</textarea>
                            <textarea id="student-service-article-content" rows="10" placeholder="Full article content">${ssEscape(editorArticle?.content || '')}</textarea>
                            <div class="student-service-action-row">
                                <button class="lux-secondary-btn" type="button" data-student-service-save-article="draft"><i class="far fa-save"></i> Save Draft</button>
                                <button class="lux-primary-btn" type="button" data-student-service-save-article="publish"><i class="fas fa-check-circle"></i> Publish Article</button>
                            </div>
                        </div>
                    </div>
                `}
            </section>
        `;
    }

    window.renderStudentServiceStaffWorkbench = function renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options = {}) {
        const ui = ensureStudentServiceUiState();
        const currentUser = getStudentServiceCurrentUser();
        const role = getEffectiveUserRole();
        const canModerate = canCurrentUserModerateStudentService();
        const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canModerate;
        const lane = options.lane === 'qa' ? 'qa' : 'service';
        const visibleQuestions = getStudentServiceVisibleQuestions();
        const filteredQuestions = getStudentServiceFilteredQuestions(visibleQuestions);
        const selectedQuestion = lane === 'qa'
            ? getStudentServiceOpenQuestion(filteredQuestions)
            : getStudentServiceSelectedQuestion(filteredQuestions);
        const filteredTickets = getStudentServiceFilteredStaffTickets(visibleTickets, currentUser);
        const selectedTicket = filteredTickets.length ? ensureSelectedStudentServiceTicket(filteredTickets) : null;
        const filteredArticles = getStudentServiceFilteredArticles(visibleArticles);
        const allArticles = ensureStudentServiceStores().articles;
        const articleQuery = ui.articleSearch.trim().toLowerCase();
        const editorArticle = allArticles.find(article => article.id === ui.articleEditorId)
            || allArticles.find(article => article.id === ui.selectedArticleId)
            || (articleQuery ? null : ensureSelectedStudentServiceArticle(filteredArticles.length ? filteredArticles : visibleArticles));
        const needsServiceCount = visibleTickets.filter(ticket => ['Open', 'In Review', 'Waiting for Service'].includes(ticket.status)).length;
        const waitingForStudentCount = visibleTickets.filter(ticket => ticket.status === 'Waiting for Student').length;
        const unassignedCount = visibleTickets.filter(ticket => !String(ticket.assignedToId || '').trim() && !['Resolved', 'Closed'].includes(ticket.status)).length;
        const resolvedCount = visibleTickets.filter(ticket => ticket.status === 'Resolved').length;
        const pendingQuestionsCount = visibleQuestions.filter(question => question.status === 'pending_review').length;
        const unansweredCount = visibleQuestions.filter(question => !(question.answers || []).some(answer => answer.status === 'published')).length;
        const panel = lane === 'qa'
            ? 'qa'
            : (ui.staffPanel === 'articles' ? 'articles' : 'tickets');
        const focusTicketList = filteredTickets;

        if (lane === 'qa') {
            return window.renderStudentServiceStaffQaFeed(container, {
                filteredQuestions,
                selectedQuestion,
                responderOnly,
                pendingQuestionsCount,
                unansweredCount
            });
        }

        const shell = ensureStudentServiceStaffWorkbenchShell(container);
        if (!shell) return;
        setStudentServiceMarkup(
            shell.summary,
            `student-service-staff-workbench:summary:${panel}:${needsServiceCount}:${pendingQuestionsCount}:${unansweredCount}:${unassignedCount}:${resolvedCount}`,
            renderStudentServiceStaffWorkbenchSummaryMarkup(lane, responderOnly, panel, needsServiceCount, waitingForStudentCount, pendingQuestionsCount, unansweredCount, unassignedCount, resolvedCount)
        );
        setStudentServiceMarkup(
            shell.primary,
            `student-service-staff-workbench:primary:${panel}:${ui.ticketSearch || ''}:${ui.qaSearch || ''}:${ui.articleSearch || ''}:${selectedTicket?.id || ''}:${selectedQuestion?.id || ''}:${editorArticle?.id || ''}:${focusTicketList.length}:${filteredQuestions.length}:${filteredArticles.length}`,
            renderStudentServiceStaffWorkbenchPrimaryMarkup(panel, ui, responderOnly, currentUser, visibleTickets, focusTicketList, selectedTicket, filteredQuestions, selectedQuestion, filteredArticles, editorArticle)
        );
        setStudentServiceMarkup(
            shell.detail,
            `student-service-staff-workbench:detail:${panel}:${selectedTicket?.id || ''}:${selectedTicket?.updatedAt || ''}:${selectedQuestion?.id || ''}:${editorArticle?.id || ''}:${editorArticle?.updatedAt || ''}`,
            renderStudentServiceStaffWorkbenchDetailMarkup(panel, selectedTicket, selectedQuestion, editorArticle)
        );
    };
})();
