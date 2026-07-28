/* News page module: feed — classic script, shares globals with sibling news/* modules. */
function finishNewsBootstrapRefresh() {
    const root = q(ROOT_ID);
    if (!root) return;

    if (runtime.publisherModalOpen || runtime.sectionsModalOpen) {
        renderNewsModals();
        const shell = ensureNewsWorkspaceShell(root);
        if (shell?.feed) renderNewsFeedRegions(shell.feed);
        if (shell?.sidebar && runtime.sectionsModalOpen) {
            setNewsRegionMarkup(shell.sidebar, 'sidebar', renderSections());
        }
        root.dataset.newsRenderSignature = buildNewsRenderSignature();
        return;
    }

    const shell = ensureNewsWorkspaceShell(root);
    if (!shell?.feed?.querySelector('[data-news-feed-list="1"]')) {
        renderNewsFeedRegions(shell.feed);
        syncNewsFilterMeta();
        root.dataset.newsRenderSignature = buildNewsRenderSignature();
        return;
    }

    const prevSignature = root.dataset.newsRenderSignature || '';
    const nextSignature = buildNewsRenderSignature();
    const prev = splitNewsRenderSignature(prevSignature);
    const next = splitNewsRenderSignature(nextSignature);

    renderNewsFeedRegions(shell.feed);
    syncNewsFilterMeta();

    if (prevSignature === nextSignature) {
        root.dataset.newsRenderSignature = nextSignature;
        return;
    }

    if (prev.section !== next.section || prev.sections !== next.sections) {
        setNewsRegionMarkup(shell.sidebar, 'sidebar', renderSections());
    }

    root.dataset.newsRenderSignature = nextSignature;
    root.dataset.newsReady = 'true';
    document.body.classList.remove('kiu-shell-loading');
}

async function bootstrapNewsWorkspace(force = false) {
    if (runtime.bootstrapPromise) {
        if (force) runtime.bootstrapPending = true;
        return runtime.bootstrapPromise;
    }
    if (runtime.loading || (runtime.bootstrapped && !force)) return Promise.resolve();
    if (runtime.bootstrapAttempted && runtime.error && !force) return Promise.resolve();
    const showBlockingLoader = false;
    runtime.bootstrapAttempted = true;
    runtime.loading = showBlockingLoader;
    runtime.error = '';
    runtime.bootstrapPromise = (async () => {
        await Promise.allSettled([fetchNewsFeed()]);
        runtime.bootstrapped = true;
        if (runtime.posts.length) runtime.error = '';
    })().catch(error => {
        if (!runtime.posts.length) {
            runtime.error = error?.message || 'The News workspace is unavailable right now.';
        }
    }).finally(() => {
        runtime.loading = false;
        runtime.bootstrapPromise = null;
        const chainBootstrap = runtime.bootstrapPending;
        if (chainBootstrap) runtime.bootstrapPending = false;
        if (chainBootstrap) {
            bootstrapNewsWorkspace(true);
            return;
        }
        finishNewsBootstrapRefresh();
        if (runtime.pendingDeepLinkPostId) {
            focusNewsPostCard(runtime.pendingDeepLinkPostId);
            runtime.pendingDeepLinkPostId = '';
        } else {
            applyNewsDeepLinkFocus();
        }
        if (isNewsWorkspaceVisible() && typeof window.markNewsSeen === 'function') {
            window.markNewsSeen(getCurrentUserSafe()?.id);
        }
        if (typeof window.prefetchNewsHomeSnapshot === 'function') {
            const snap = typeof window.getNewsHomeSnapshot === 'function' ? window.getNewsHomeSnapshot() : null;
            const fresh = snap && snap.fetchedAt && (Date.now() - snap.fetchedAt < 45000);
            if (!fresh) window.prefetchNewsHomeSnapshot();
        }
    });
    return runtime.bootstrapPromise;
}

function renderSections() {
    const buttons = [
        `
            <button type="button" class="newsx-section-btn lux-secondary-btn lux-select-card ${runtime.selectedSection === 'all' ? 'is-active' : ''}" data-news-section="all">
                <span class="newsx-sec-icon"><i class="fas fa-globe"></i></span>
                <div class="newsx-grow">
                    <div class="newsx-account-name lux-card-title">All Updates</div>
                    <div class="newsx-section-key lux-card-meta lms-route-meta-12">All sections</div>
                </div>
                <strong>${escapeHtml(String(runtime.posts.length))}</strong>
            </button>
        `
    ].concat((runtime.sections || []).map(section => `
        <button type="button" class="newsx-section-btn lux-secondary-btn lux-select-card ${runtime.selectedSection === section.key ? 'is-active' : ''}" data-news-section="${escapeHtml(section.key || 'general')}">
            <span class="newsx-sec-icon"><i class="fas ${getSectionIcon(section.key)}"></i></span>
            <div class="newsx-grow">
                <div class="newsx-account-name lux-card-title">${escapeHtml(section.label || 'General')}</div>
                <div class="newsx-section-key lux-card-meta lms-route-meta-12">${escapeHtml(section.key || 'general')}</div>
            </div>
            <strong>${escapeHtml(String(section.count || 0))}</strong>
        </button>
    `)).join('');

    return `
        <aside class="newsx-sidebar home-hover-chip" aria-label="News sections">
            <div class="newsx-sidebar-deco">
                <div class="newsx-sidebar-deco-icon"><i class="fas fa-newspaper"></i></div>
                <div class="newsx-sidebar-deco-copy">
                    <div class="newsx-kicker newsx-kicker-muted lux-section-kicker">News</div>
                    <h2 class="newsx-headline newsx-headline-tight lux-card-title">Sections</h2>
                </div>
                ${canManageNews() ? `
                    <button type="button" class="newsx-btn lux-secondary-btn newsx-sections-manage-btn" data-news-open-sections-manager aria-label="Manage sections" title="Manage sections">
                        <i class="fas fa-sliders"></i>
                    </button>
                ` : ''}
            </div>
            <p class="newsx-subtle lux-card-copy lms-route-copy">Filter news by category.</p>
            <div class="newsx-divider"></div>
            <div class="newsx-section-list">${buttons}</div>
        </aside>
    `;
}

function renderNewsAttachmentGallery(post) {
    const attachments = Array.isArray(post.attachments) ? post.attachments : [];
    if (!attachments.length) return '';
    return `
        <div class="newsx-attachment-gallery">
            ${attachments.map((file, index) => {
                const url = resolveNewsAttachmentUrl(file);
                const name = String(file?.name || `Attachment ${index + 1}`);
                if (isNewsImageAttachment(file) && url) {
                    return `<span class="newsx-attachment-thumb"><img src="${escapeHtml(url)}" alt="${escapeHtml(name)}"></span>`;
                }
                return `<a class="newsx-attachment-chip" href="${escapeHtml(url || '#')}" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i> ${escapeHtml(name)}</a>`;
            }).join('')}
        </div>
    `;
}

function renderMagazineExcerpt(post) {
    const excerpt = String(post.excerpt || post.body || '').trim();
    if (!excerpt) return '';
    const title = stripNewsTitlePlainText(post.title);
    if (title && stripNewsTitlePlainText(excerpt).toLowerCase() === title.toLowerCase()) return '';
    const preview = excerpt.length > 180 ? `${excerpt.slice(0, 180)}…` : excerpt;
    return `<p class="newsx-card-excerpt" style="${getNewsTypographyStyle(post, 'excerptFontSize')}">${escapeHtml(preview)}</p>`;
}


function renderPostAdminActions(post) {
    if (!canManageNews()) return '';
    const postId = String(post.id || '');
    return `
        <div class="newsx-admin-actions">
            <button type="button" class="newsx-btn lux-secondary-btn newsx-admin-btn newsx-admin-btn--edit" data-news-edit-post="${escapeHtml(postId)}"><i class="fas fa-pen"></i> Edit</button>
            ${post.status !== 'archived' ? `<button type="button" class="newsx-btn lux-secondary-btn newsx-admin-btn newsx-admin-btn--remove" data-news-remove-post="${escapeHtml(postId)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
            <button type="button" class="newsx-btn lux-secondary-btn newsx-admin-btn newsx-admin-btn--pin${post.pinned ? ' is-active' : ''}" data-news-toggle-pin-post="${escapeHtml(postId)}"><i class="fas fa-thumbtack"></i> ${post.pinned ? 'Unpin' : 'Pin'}</button>
        </div>
    `;
}


function renderPostHeader(post) {
    const authorName = post.createdByName || 'University';
    const authorInitial = String(authorName).charAt(0).toUpperCase();
    return `
        <div class="newsx-card-header">
            <div class="newsx-grow">
                <div class="newsx-author-row">
                    <span class="newsx-avatar">${escapeHtml(authorInitial)}</span>
                    <div class="newsx-meta">
                        <strong class="newsx-author-name">${escapeHtml(authorName)}</strong> · ${escapeHtml(formatDateTime(post.publishedAt || post.updatedAt || post.createdAt))}
                    </div>
                </div>
                <h3 class="newsx-card-title" style="${getNewsTypographyStyle(post, 'titleFontSize')}">${renderNewsTitleHtml(post.title)}</h3>
            </div>
        </div>
    `;
}

function renderPostBody(post) {
    return `
        ${renderMagazineExcerpt(post)}
        <div class="newsx-card-body newsx-card-body--rich" style="${getNewsTypographyStyle(post, 'bodyFontSize')}">${renderNewsBodyHtml(post)}</div>
        ${renderNewsAttachmentGallery(post)}
        ${renderPostAdminActions(post)}
    `;
}


function renderNewsHeaderBar(currentUser) {
    const filters = runtime.feedFilters || {};
    const manager = canManageNews();
    return `
        <section class="newsx-header-bar newsx-filter" data-lux-picker-scroll-exempt>
            <div class="newsx-header-top">
                <div class="newsx-header-copy">
                    <div class="newsx-kicker"><i class="fas fa-broadcast-tower newsx-icon-leading"></i> University News</div>
                    <h1 class="newsx-title">Campus News</h1>
                </div>
                <div class="newsx-hero-command">
                    ${manager ? `<button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-open-publisher><i class="fas fa-plus"></i> New Announcement</button>` : ''}
                    <button type="button" class="newsx-btn lux-secondary-btn" data-news-refresh><i class="fas fa-rotate"></i> Refresh</button>
                </div>
            </div>
            <div class="newsx-filter-grid newsx-filter-grid--extended">
                <input id="news-feed-search" name="news_feed_search" class="newsx-input lux-control" type="text" value="${escapeHtml(runtime.search)}" placeholder="Search by title, body, author, or section..." data-news-search-input>
                <select class="newsx-select lux-control" data-news-feed-filter="priority">
                    <option value="all" ${filters.priority === 'all' ? 'selected' : ''}>All priorities</option>
                    <option value="standard" ${filters.priority === 'standard' ? 'selected' : ''}>Standard</option>
                    <option value="important" ${filters.priority === 'important' ? 'selected' : ''}>Important</option>
                    <option value="critical" ${filters.priority === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
                <select class="newsx-select lux-control" data-news-feed-filter="pinned">
                    <option value="all" ${filters.pinned === 'all' ? 'selected' : ''}>Pinned: All</option>
                    <option value="yes" ${filters.pinned === 'yes' ? 'selected' : ''}>Pinned only</option>
                    <option value="no" ${filters.pinned === 'no' ? 'selected' : ''}>Not pinned</option>
                </select>
                ${manager ? `
                    <select class="newsx-select lux-control" data-news-feed-filter="status">
                        <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All statuses</option>
                        <option value="published" ${filters.status === 'published' ? 'selected' : ''}>Published</option>
                        <option value="draft" ${filters.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="archived" ${filters.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                ` : ''}
                <input class="newsx-input lux-control" type="date" value="${escapeHtml(filters.dateFrom || '')}" data-news-feed-filter="dateFrom" aria-label="Date from">
                <input class="newsx-input lux-control" type="date" value="${escapeHtml(filters.dateTo || '')}" data-news-feed-filter="dateTo" aria-label="Date to">
            </div>
            <div class="newsx-filter-meta">${escapeHtml(String(runtime.posts.length))} matching announcements</div>
            ${runtime.error && !runtime.publisherModalOpen ? renderNewsErrorState(runtime.error) : ''}
        </section>
    `;
}

function ensureNewsFeedShell(container) {
    if (!container) return null;
    let state = container.querySelector('[data-news-feed-state="1"]');
    let list = container.querySelector('[data-news-feed-list="1"]');
    if (!state || !list) {
        container.innerHTML = `
            <div data-news-feed-state="1"></div>
            <div class="newsx-feed-list" data-news-feed-list="1"></div>
        `;
        state = container.querySelector('[data-news-feed-state="1"]');
        list = container.querySelector('[data-news-feed-list="1"]');
    }
    return { state, list };
}

function renderNewsFeedStateMarkup() {
    if (runtime.bootstrapPromise) {
        return '';
    }
    if (runtime.loading && !runtime.posts.length) {
        return `
            <div class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-loading-card">
                <div class="newsx-loading-line is-120"></div>
                <div class="newsx-loading-line is-70"></div>
                <div class="newsx-loading-line is-50"></div>
                <div class="newsx-loading-block"></div>
            </div>
            <div class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-loading-card">
                <div class="newsx-loading-line is-90"></div>
                <div class="newsx-loading-line is-55"></div>
                <div class="newsx-loading-line is-40"></div>
            </div>
        `;
    }
    if (!runtime.posts.length) {
        return renderNewsEmptyState('No announcements matched the current section or search.');
    }
    return '';
}

function ensureNewsPostShell(host, postId) {
    if (!host) return null;
    let shell = host.querySelector('[data-news-post-shell="1"]');
    if (!shell) {
        host.innerHTML = `
            <article class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-post-card--editorial" data-news-post-shell="1" data-news-post-id="${escapeHtml(postId)}">
                <div data-news-post-header="1"></div>
                <div data-news-post-body="1"></div>
                <div data-news-post-replies="1"></div>
            </article>
        `;
        shell = host.querySelector('[data-news-post-shell="1"]');
    }
    return {
        header: shell?.querySelector('[data-news-post-header="1"]') || null,
        body: shell?.querySelector('[data-news-post-body="1"]') || null,
        repliesBox: shell?.querySelector('[data-news-post-replies="1"]') || shell?.querySelector('[data-news-post-private="1"]') || null
    };
}

function renderNewsPostRegions(host, post) {
    const postId = String(post?.id || '');
    const shell = ensureNewsPostShell(host, postId);
    if (!shell) return;
    const openState = collectNewsReplyFoldOpenState(postId, shell.repliesBox);
    setNewsRegionMarkup(shell.header, `feed-post-header:${postId}`, renderPostHeader(post));
    setNewsRegionMarkup(shell.body, `feed-post-body:${postId}`, renderPostBody(post));
    setNewsRegionMarkup(shell.repliesBox, `feed-post-replies:${postId}`, renderPostRepliesBox(post, openState));
    shell.repliesBox?.querySelectorAll('details.newsx-reply-fold[data-news-reply-channel]').forEach((fold) => {
        const channel = String(fold.getAttribute('data-news-reply-channel') || '').trim().toLowerCase();
        if ((channel === 'public' && openState.public) || (channel === 'private' && openState.private)) {
            fold.open = true;
        }
    });
    relayoutNewsReplyTrunks(shell.repliesBox);
}

function renderNewsFeedRegions(container) {
    const shell = ensureNewsFeedShell(container);
    if (!shell) return;

    const stateMarkup = renderNewsFeedStateMarkup();
    setNewsRegionMarkup(shell.state, 'feed-state', stateMarkup);
    if (stateMarkup) {
        const hasCards = shell.list.querySelector('[data-news-post-host="1"]');
        const refetchPending = runtime.bootstrapPromise || runtime.bootstrapPending || runtime.feedFilterTimer;
        if (!(hasCards && refetchPending)) {
            shell.list.replaceChildren();
        }
        return;
    }

    const existingHosts = new Map(
        [...shell.list.querySelectorAll('[data-news-post-host="1"]')].map(node => [String(node.getAttribute('data-news-post-id') || ''), node])
    );
    const nextPostIds = runtime.posts.map(post => String(post?.id || ''));
    const currentPostIds = [...existingHosts.keys()];
    if (
        nextPostIds.length === currentPostIds.length
        && nextPostIds.every((id, index) => id === currentPostIds[index])
    ) {
        runtime.posts.forEach(post => {
            const postId = String(post?.id || '');
            const host = existingHosts.get(postId);
            if (host) renderNewsPostRegions(host, post);
        });
        relayoutNewsReplyTrunks(shell.list);
        return;
    }

    const fragment = document.createDocumentFragment();

    runtime.posts.forEach(post => {
        const postId = String(post?.id || '');
        let host = existingHosts.get(postId);
        if (!host) {
            host = document.createElement('div');
            host.setAttribute('data-news-post-host', '1');
            host.setAttribute('data-news-post-id', postId);
            delete runtime.renderCache[`feed-post-header:${postId}`];
            delete runtime.renderCache[`feed-post-body:${postId}`];
            delete runtime.renderCache[`feed-post-private:${postId}`];
        }
        renderNewsPostRegions(host, post);
        fragment.appendChild(host);
        existingHosts.delete(postId);
    });

    existingHosts.forEach((_host, postId) => {
        delete runtime.renderCache[`feed-post-header:${postId}`];
        delete runtime.renderCache[`feed-post-body:${postId}`];
        delete runtime.renderCache[`feed-post-private:${postId}`];
    });

    shell.list.replaceChildren(fragment);
    relayoutNewsReplyTrunks(shell.list);
}

function renderNewsWorkspace() {
    const root = q(ROOT_ID);
    if (!root) return;

    let currentUser = getCurrentUserSafe();
    if (!currentUser?.id) {
        currentUser = { id: 'local-user', displayName: 'Campus User', name: 'User', role: 'student' };
    }

    if (shouldBootstrapNewsWorkspace() && !runtime.bootstrapped && !runtime.loading && !runtime.bootstrapPromise && !runtime.error) {
        window.setTimeout(() => {
            if (shouldBootstrapNewsWorkspace() && !runtime.bootstrapped && !runtime.bootstrapPromise) {
                bootstrapNewsWorkspace();
            }
        }, 0);
    }
    const shell = ensureNewsWorkspaceShell(root);
    if (!shell) return;
    const renderSignature = buildNewsRenderSignature();
    if (root.dataset.newsRenderSignature === renderSignature) {
        return;
    }

    setNewsRegionMarkup(shell.sidebar, 'sidebar', renderSections());
    setNewsRegionMarkup(shell.header, 'header', renderNewsHeaderBar(currentUser));
    enhanceNewsWorkspacePickers();
    renderNewsFeedRegions(shell.feed);
    renderNewsModals();
    root.dataset.newsReady = 'true';
    root.dataset.newsRenderSignature = renderSignature;
    document.body.classList.remove('kiu-shell-loading');
    if (runtime.pendingDeepLinkPostId) {
        focusNewsPostCard(runtime.pendingDeepLinkPostId);
        runtime.pendingDeepLinkPostId = '';
    }
}

function renderNewsModals() {
    ensureNewsModalShells();
    const publisherPanel = q('newsx-publisher-panel');
    if (runtime.publisherModalOpen && canManageNews()) {
        setNewsRegionMarkup(publisherPanel, 'publisher-modal', renderNewsPublisherModal());
        setNewsModalOpen(PUBLISHER_OVERLAY_ID, true);
        mountNewsTitleEditor({ force: true });
    mountNewsBodyEditor({ force: true });
        syncNewsComposeTypographyUi();
    } else {
        setNewsModalOpen(PUBLISHER_OVERLAY_ID, false);
    }

    const sectionsPanel = q('newsx-sections-panel');
    if (runtime.sectionsModalOpen && canManageNews()) {
        setNewsRegionMarkup(sectionsPanel, 'sections-modal', renderNewsSectionsModal());
        setNewsModalOpen(SECTIONS_OVERLAY_ID, true);
    } else {
        setNewsModalOpen(SECTIONS_OVERLAY_ID, false);
        clearNewsRegionMarkup(sectionsPanel, 'sections-modal');
    }
}
