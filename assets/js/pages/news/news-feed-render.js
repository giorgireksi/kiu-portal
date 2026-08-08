/* News page module: feed — classic script, shares globals with sibling news/* modules. */
function revealNewsShell() {
    if (typeof markPortalShellReady === 'function') {
        markPortalShellReady();
        return;
    }
    if (typeof window.__kiuStartShellReveal === 'function') {
        window.__kiuStartShellReveal({ degraded: true });
        return;
    }
    document.body?.classList.remove('kiu-shell-loading');
}

function finishNewsBootstrapRefresh() {
    const root = q(ROOT_ID);
    if (!root) return;

    if (runtime.publisherModalOpen || runtime.sectionsModalOpen || runtime.attachmentViewer?.open || runtime.postDetail?.open) {
        if (runtime.publisherModalOpen || runtime.sectionsModalOpen) {
            renderNewsModals();
        } else {
            const softReplies = runtime.overlayRefreshMode === 'replies';
            runtime.overlayRefreshMode = '';
            const replyPostId = runtime.postDetail?.open
                ? String(runtime.postDetail.postId || '')
                : String(runtime.attachmentViewer?.postId || '');
            if (softReplies && replyPostId && typeof refreshNewsReplyShells === 'function') {
                // Reply mutations: swap comment shells only so nested scroll stays put.
                refreshNewsReplyShells(replyPostId);
                if (runtime.postDetail?.open) setNewsModalOpen(POST_DETAIL_OVERLAY_ID, true);
                if (runtime.attachmentViewer?.open) setNewsModalOpen(ATTACHMENT_VIEWER_OVERLAY_ID, true);
            } else {
                // Pin/edit/archive and other body chrome: remount (scroll restored in render).
                if (runtime.postDetail?.open) {
                    renderNewsPostDetailPanel();
                    setNewsModalOpen(POST_DETAIL_OVERLAY_ID, true);
                }
                if (runtime.attachmentViewer?.open) {
                    renderNewsAttachmentViewerPanel();
                    setNewsModalOpen(ATTACHMENT_VIEWER_OVERLAY_ID, true);
                }
            }
        }
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
    revealNewsShell();
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
            <span class="newsx-sec-icon"><i class="fas ${getSectionIcon(section)}"></i></span>
            <div class="newsx-grow">
                <div class="newsx-account-name lux-card-title">${escapeHtml(section.label || 'General')}</div>
                <div class="newsx-section-key lux-card-meta lms-route-meta-12">${escapeHtml(section.key || 'general')}</div>
            </div>
            <strong>${escapeHtml(String(section.count || 0))}</strong>
        </button>
    `)).join('');

    const sectionsCollapsed = typeof ensureNewsSidebarSectionsCollapsed === 'function'
        ? ensureNewsSidebarSectionsCollapsed()
        : Boolean(runtime.sidebarSectionsCollapsed);
    const sectionsToggleLabel = sectionsCollapsed ? 'Sections' : 'Hide sections';
    const sectionsToggleIcon = sectionsCollapsed ? 'fas fa-folder-tree' : 'fas fa-chevron-up';

    return `
        <aside class="newsx-sidebar home-hover-chip${sectionsCollapsed ? ' is-collapsed' : ''}" aria-label="News sections">
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
            <button type="button" class="newsx-btn lux-secondary-btn newsx-sections-toggle" data-news-toggle-sections aria-expanded="${sectionsCollapsed ? 'false' : 'true'}" aria-controls="newsx-sections-collapse">
                <i class="${sectionsToggleIcon}" aria-hidden="true"></i>
                <span>${sectionsToggleLabel}</span>
            </button>
            <div class="newsx-sections-collapse${sectionsCollapsed ? ' is-collapsed' : ''}" id="newsx-sections-collapse">
                <p class="newsx-subtle lux-card-copy lms-route-copy">Filter news by category.</p>
                <div class="newsx-divider"></div>
                <div class="newsx-section-list">${buttons}</div>
            </div>
        </aside>
    `;
}

function renderNewsAttachmentGallery(post) {
    const attachments = Array.isArray(post.attachments) ? post.attachments : [];
    if (!attachments.length) return '';
    const postId = String(post.id || '');
    return `
        <div class="newsx-attachment-gallery">
            ${attachments.map((file, index) => {
                const url = resolveNewsAttachmentUrl(file);
                const name = String(file?.name || `Attachment ${index + 1}`);
                if (isNewsImageAttachment(file) && url) {
                    return `<button type="button" class="newsx-attachment-thumb" data-news-open-attachment="${escapeHtml(postId)}" data-news-attachment-index="${escapeHtml(String(index))}" aria-label="View ${escapeHtml(name)}"><img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async"></button>`;
                }
                return `<a class="newsx-attachment-chip home-hover-chip" href="${escapeHtml(url || '#')}" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i> ${escapeHtml(name)}</a>`;
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


function renderPostTile(post) {
    const postId = String(post?.id || '');
    const title = stripNewsTitlePlainText(post.title) || 'Announcement';
    const when = formatDateTime(post.publishedAt || post.updatedAt || post.createdAt);
    const images = getNewsImageAttachmentEntries(post);
    const coverUrl = images.length ? resolveNewsAttachmentUrl(images[0].file) : '';
    const cover = coverUrl
        ? `<div class="newsx-post-tile-cover"><img src="${escapeHtml(coverUrl)}" alt="" loading="lazy" decoding="async"></div>`
        : `<div class="newsx-post-tile-cover newsx-post-tile-cover--empty" aria-hidden="true"><i class="fas fa-newspaper"></i></div>`;
    const pinBadge = post.pinned
        ? '<span class="newsx-post-tile-pin home-hover-chip" title="Pinned"><i class="fas fa-thumbtack" aria-hidden="true"></i></span>'
        : '';
    return `
        <button type="button" class="newsx-post-tile-hit" data-news-open-post="${escapeHtml(postId)}" aria-label="Open ${escapeHtml(title)}">
            ${cover}
            ${pinBadge}
            <div class="newsx-post-tile-copy">
                <h3 class="newsx-post-tile-title">${escapeHtml(title)}</h3>
                <div class="newsx-post-tile-date lux-card-meta">${escapeHtml(when)}</div>
            </div>
        </button>
    `;
}

function renderPostHeader(post, options = {}) {
    const authorName = post.createdByName || 'University';
    const authorInitial = String(authorName).charAt(0).toUpperCase();
    const omitTitle = Boolean(options.omitTitle);
    return `
        <div class="newsx-card-header">
            <div class="newsx-grow">
                <div class="newsx-author-row">
                    <span class="newsx-avatar">${escapeHtml(authorInitial)}</span>
                    <div class="newsx-meta">
                        <strong class="newsx-author-name">${escapeHtml(authorName)}</strong> · ${escapeHtml(formatDateTime(post.publishedAt || post.updatedAt || post.createdAt))}
                    </div>
                </div>
                ${omitTitle ? '' : `<h3 class="newsx-card-title" style="${getNewsTypographyStyle(post, 'titleFontSize')}">${renderNewsTitleHtml(post.title)}</h3>`}
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
    const filtersCollapsed = typeof ensureNewsHeaderFiltersCollapsed === 'function'
        ? ensureNewsHeaderFiltersCollapsed()
        : Boolean(runtime.headerFiltersCollapsed);
    const filterToggleLabel = filtersCollapsed ? 'Filters' : 'Hide filters';
    const filterToggleIcon = filtersCollapsed ? 'fas fa-sliders' : 'fas fa-chevron-up';
    return `
        <section class="newsx-header-bar newsx-filter home-hover-chip${filtersCollapsed ? ' is-collapsed' : ''}" data-lux-picker-scroll-exempt>
            <div class="newsx-header-top">
                <div class="newsx-header-copy">
                    <div class="newsx-kicker"><i class="fas fa-broadcast-tower newsx-icon-leading"></i> University News</div>
                    <h1 class="newsx-title">Campus News</h1>
                </div>
                <div class="newsx-hero-command">
                    <button type="button" class="newsx-btn lux-secondary-btn newsx-filter-toggle" data-news-toggle-filters aria-expanded="${filtersCollapsed ? 'false' : 'true'}" aria-controls="newsx-filter-collapse">
                        <i class="${filterToggleIcon}" aria-hidden="true"></i>
                        <span>${filterToggleLabel}</span>
                    </button>
                    ${manager ? `<button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-open-publisher><i class="fas fa-plus"></i> New Announcement</button>` : ''}
                    <button type="button" class="newsx-btn lux-secondary-btn" data-news-refresh><i class="fas fa-rotate"></i> Refresh</button>
                </div>
            </div>
            <div class="newsx-filter-collapse${filtersCollapsed ? ' is-collapsed' : ''}" id="newsx-filter-collapse">
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
            <div class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-loading-card newsx-post-card--tile home-hover-chip">
                <div class="newsx-post-tile-cover newsx-post-tile-cover--empty" aria-hidden="true"></div>
                <div class="newsx-post-tile-copy">
                    <div class="newsx-loading-line is-70"></div>
                    <div class="newsx-loading-line is-40"></div>
                </div>
            </div>
            <div class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-loading-card newsx-post-card--tile home-hover-chip">
                <div class="newsx-post-tile-cover newsx-post-tile-cover--empty" aria-hidden="true"></div>
                <div class="newsx-post-tile-copy">
                    <div class="newsx-loading-line is-55"></div>
                    <div class="newsx-loading-line is-40"></div>
                </div>
            </div>
            <div class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-loading-card newsx-post-card--tile home-hover-chip">
                <div class="newsx-post-tile-cover newsx-post-tile-cover--empty" aria-hidden="true"></div>
                <div class="newsx-post-tile-copy">
                    <div class="newsx-loading-line is-90"></div>
                    <div class="newsx-loading-line is-40"></div>
                </div>
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
    if (shell && !shell.classList.contains('newsx-post-card--tile')) {
        host.innerHTML = '';
        shell = null;
    }
    if (!shell) {
        host.innerHTML = `
            <article class="surface-card lux-soft-chrome newsx-panel newsx-feed-card newsx-post-card--tile home-hover-chip" data-news-post-shell="1" data-news-post-id="${escapeHtml(postId)}">
                <div data-news-post-tile="1"></div>
            </article>
        `;
        shell = host.querySelector('[data-news-post-shell="1"]');
    }
    return {
        tile: shell?.querySelector('[data-news-post-tile="1"]') || null
    };
}

function renderNewsPostRegions(host, post) {
    const postId = String(post?.id || '');
    const shell = ensureNewsPostShell(host, postId);
    if (!shell?.tile) return;
    setNewsRegionMarkup(shell.tile, `feed-post-tile:${postId}`, renderPostTile(post));
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
            delete runtime.renderCache[`feed-post-tile:${postId}`];
            delete runtime.renderCache[`feed-post-header:${postId}`];
            delete runtime.renderCache[`feed-post-body:${postId}`];
            delete runtime.renderCache[`feed-post-private:${postId}`];
        }
        renderNewsPostRegions(host, post);
        fragment.appendChild(host);
        existingHosts.delete(postId);
    });

    existingHosts.forEach((_host, postId) => {
        delete runtime.renderCache[`feed-post-tile:${postId}`];
        delete runtime.renderCache[`feed-post-header:${postId}`];
        delete runtime.renderCache[`feed-post-body:${postId}`];
        delete runtime.renderCache[`feed-post-private:${postId}`];
    });

    shell.list.replaceChildren(fragment);
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
        revealNewsShell();
        return;
    }

    setNewsRegionMarkup(shell.sidebar, 'sidebar', renderSections());
    setNewsRegionMarkup(shell.header, 'header', renderNewsHeaderBar(currentUser));
    enhanceNewsWorkspacePickers();
    renderNewsFeedRegions(shell.feed);
    renderNewsModals();
    root.dataset.newsReady = 'true';
    root.dataset.newsRenderSignature = renderSignature;
    revealNewsShell();
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

    if (runtime.attachmentViewer?.open) {
        renderNewsAttachmentViewerPanel();
        setNewsModalOpen(ATTACHMENT_VIEWER_OVERLAY_ID, true);
    } else {
        setNewsModalOpen(ATTACHMENT_VIEWER_OVERLAY_ID, false);
        clearNewsRegionMarkup(q('newsx-attachment-viewer-panel'), 'attachment-viewer');
    }

    if (runtime.postDetail?.open) {
        renderNewsPostDetailPanel();
        setNewsModalOpen(POST_DETAIL_OVERLAY_ID, true);
    } else {
        setNewsModalOpen(POST_DETAIL_OVERLAY_ID, false);
        clearNewsRegionMarkup(q('newsx-post-detail-panel'), 'post-detail');
    }
}

function getNewsImageAttachmentEntries(post) {
    return (Array.isArray(post?.attachments) ? post.attachments : [])
        .map((file, index) => ({ file, index }))
        .filter(({ file }) => isNewsImageAttachment(file) && resolveNewsAttachmentUrl(file));
}

function renderNewsAttachmentViewerMarkup(post, attachmentIndex) {
    const images = getNewsImageAttachmentEntries(post);
    if (!images.length) return '';
    let position = images.findIndex((entry) => entry.index === Number(attachmentIndex));
    if (position < 0) position = 0;
    const current = images[position];
    const file = current.file;
    const url = resolveNewsAttachmentUrl(file);
    const name = String(file?.name || `Attachment ${current.index + 1}`);
    const authorName = post.createdByName || 'University';
    const authorInitial = String(authorName).charAt(0).toUpperCase();
    const title = stripNewsTitlePlainText(post.title) || 'Announcement';
    const excerpt = String(post.excerpt || post.body || '').trim();
    const excerptPreview = excerpt.length > 220 ? `${excerpt.slice(0, 220)}…` : excerpt;
    const postId = String(post.id || '');
    const canPrev = images.length > 1;
    const canNext = images.length > 1;
    const filmstrip = images.map((entry, idx) => {
        const thumbUrl = resolveNewsAttachmentUrl(entry.file);
        const thumbName = String(entry.file?.name || `Image ${idx + 1}`);
        const active = idx === position ? ' is-active' : '';
        return `<button type="button" class="newsx-attachment-viewer-film${active}" data-news-attachment-select="${escapeHtml(String(entry.index))}" aria-label="Show ${escapeHtml(thumbName)}" aria-current="${idx === position ? 'true' : 'false'}"><img src="${escapeHtml(thumbUrl)}" alt=""></button>`;
    }).join('');

    return `
        <div class="newsx-attachment-viewer-head">
            <div class="newsx-attachment-viewer-head-copy">
                <div class="newsx-kicker lux-section-kicker">Attachment</div>
                <h2 id="newsx-attachment-viewer-title" class="newsx-headline lux-card-title">${escapeHtml(String(position + 1))} / ${escapeHtml(String(images.length))}</h2>
            </div>
            <div class="newsx-attachment-viewer-head-actions">
                <a class="newsx-btn lux-secondary-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener"><i class="fas fa-up-right-from-square"></i> Open file</a>
                <button type="button" class="newsx-btn lux-secondary-btn" data-news-close-attachment-viewer aria-label="Close attachment viewer"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <div class="newsx-attachment-viewer-layout">
            <div class="newsx-attachment-viewer-stage">
                <button type="button" class="newsx-btn lux-secondary-btn newsx-attachment-viewer-nav" data-news-attachment-prev ${canPrev ? '' : 'disabled'} aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>
                <div class="newsx-attachment-viewer-frame">
                    <img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">
                </div>
                <button type="button" class="newsx-btn lux-secondary-btn newsx-attachment-viewer-nav" data-news-attachment-next ${canNext ? '' : 'disabled'} aria-label="Next image"><i class="fas fa-chevron-right"></i></button>
                <p class="newsx-attachment-viewer-caption lux-card-meta">${escapeHtml(name)}</p>
            </div>
            <aside class="newsx-attachment-viewer-side" aria-label="Announcement details">
                <div class="newsx-attachment-viewer-meta">
                    <div class="newsx-author-row">
                        <span class="newsx-avatar">${escapeHtml(authorInitial)}</span>
                        <div class="newsx-meta lux-card-meta">
                            <strong class="newsx-author-name">${escapeHtml(authorName)}</strong> · ${escapeHtml(formatDateTime(post.publishedAt || post.updatedAt || post.createdAt))}
                        </div>
                    </div>
                    <h3 class="newsx-card-title">${escapeHtml(title)}</h3>
                    ${excerptPreview ? `<p class="newsx-card-excerpt">${escapeHtml(excerptPreview)}</p>` : ''}
                </div>
                <div class="newsx-attachment-viewer-filmstrip" aria-label="Attachments">${filmstrip}</div>
                <div class="newsx-attachment-viewer-replies" data-news-attachment-viewer-replies="1">
                    ${typeof renderPostRepliesBox === 'function' ? renderPostRepliesBox(post) : ''}
                </div>
            </aside>
        </div>
    `;
}

function renderNewsAttachmentViewerPanel() {
    ensureNewsModalShells();
    const panel = q('newsx-attachment-viewer-panel');
    if (!panel || !runtime.attachmentViewer?.open) return;
    const postId = String(runtime.attachmentViewer.postId || '');
    const post = (runtime.posts || []).find((item) => String(item?.id || '') === postId);
    if (!post) {
        closeNewsAttachmentViewer();
        return;
    }
    const images = getNewsImageAttachmentEntries(post);
    if (!images.length) {
        closeNewsAttachmentViewer();
        return;
    }
    let index = Number(runtime.attachmentViewer.index || 0);
    if (!images.some((entry) => entry.index === index)) {
        index = images[0].index;
        runtime.attachmentViewer.index = index;
    }
    setNewsRegionMarkup(panel, 'attachment-viewer', renderNewsAttachmentViewerMarkup(post, index));
    const repliesHost = panel.querySelector('[data-news-attachment-viewer-replies="1"]');
    if (repliesHost && typeof relayoutNewsReplyTrunks === 'function') {
        window.requestAnimationFrame(() => relayoutNewsReplyTrunks(repliesHost));
    }
}

let newsAttachmentViewerCleanup = null;

function closeNewsAttachmentViewer() {
    if (typeof newsAttachmentViewerCleanup === 'function') {
        newsAttachmentViewerCleanup();
        newsAttachmentViewerCleanup = null;
    }
    runtime.attachmentViewer = { open: false, postId: '', index: 0 };
    setNewsModalOpen(ATTACHMENT_VIEWER_OVERLAY_ID, false);
    clearNewsRegionMarkup(q('newsx-attachment-viewer-panel'), 'attachment-viewer');
}

function openNewsAttachmentViewer({ postId = '', index = 0 } = {}) {
    const key = String(postId || '');
    const post = (runtime.posts || []).find((item) => String(item?.id || '') === key);
    if (!post) return;
    const images = getNewsImageAttachmentEntries(post);
    if (!images.length) return;
    let nextIndex = Number(index);
    if (!images.some((entry) => entry.index === nextIndex)) {
        nextIndex = images[0].index;
    }
    runtime.attachmentViewer = { open: true, postId: key, index: nextIndex };
    ensureNewsModalShells();
    renderNewsAttachmentViewerPanel();
    setNewsModalOpen(ATTACHMENT_VIEWER_OVERLAY_ID, true);
    if (typeof newsAttachmentViewerCleanup === 'function') {
        newsAttachmentViewerCleanup();
        newsAttachmentViewerCleanup = null;
    }
    const onKeyDown = (event) => {
        if (!runtime.attachmentViewer?.open) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeNewsAttachmentViewer();
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            stepNewsAttachmentViewer(-1);
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            stepNewsAttachmentViewer(1);
        }
    };
    newsAttachmentViewerCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    window.addEventListener('keydown', onKeyDown);
    q('newsx-attachment-viewer-panel')?.querySelector('[data-news-close-attachment-viewer]')?.focus();
}

function stepNewsAttachmentViewer(delta = 1) {
    if (!runtime.attachmentViewer?.open) return;
    const post = (runtime.posts || []).find((item) => String(item?.id || '') === String(runtime.attachmentViewer.postId || ''));
    const images = getNewsImageAttachmentEntries(post);
    if (images.length < 2) return;
    let position = images.findIndex((entry) => entry.index === Number(runtime.attachmentViewer.index));
    if (position < 0) position = 0;
    position = (position + Number(delta || 0) + images.length) % images.length;
    runtime.attachmentViewer.index = images[position].index;
    renderNewsAttachmentViewerPanel();
}

function selectNewsAttachmentViewerIndex(index) {
    if (!runtime.attachmentViewer?.open) return;
    const post = (runtime.posts || []).find((item) => String(item?.id || '') === String(runtime.attachmentViewer.postId || ''));
    const images = getNewsImageAttachmentEntries(post);
    const nextIndex = Number(index);
    if (!images.some((entry) => entry.index === nextIndex)) return;
    runtime.attachmentViewer.index = nextIndex;
    renderNewsAttachmentViewerPanel();
}

window.openNewsAttachmentViewer = openNewsAttachmentViewer;
window.closeNewsAttachmentViewer = closeNewsAttachmentViewer;
window.stepNewsAttachmentViewer = stepNewsAttachmentViewer;
window.selectNewsAttachmentViewerIndex = selectNewsAttachmentViewerIndex;

function renderNewsPostDetailMarkup(post) {
    const postId = String(post?.id || '');
    const title = stripNewsTitlePlainText(post.title) || 'Announcement';
    return `
        <div class="newsx-post-detail-head">
            <div class="newsx-post-detail-head-copy">
                <div class="newsx-kicker lux-section-kicker">Announcement</div>
                <h2 id="newsx-post-detail-title" class="newsx-headline lux-card-title">${escapeHtml(title)}</h2>
            </div>
            <button type="button" class="newsx-btn lux-secondary-btn home-hover-chip" data-news-close-post-detail aria-label="Close announcement"><i class="fas fa-times"></i></button>
        </div>
        <div class="newsx-post-detail-body">
            <div class="newsx-post-detail-scroll lux-scrollbar" data-news-post-detail-scroll="1">
                <article class="newsx-post-card--editorial" data-news-post-detail-shell="1" data-news-post-id="${escapeHtml(postId)}">
                    <div data-news-post-header="1">${renderPostHeader(post, { omitTitle: true })}</div>
                    <div data-news-post-body="1">${renderPostBody(post)}</div>
                    <div data-news-post-replies="1">${typeof renderPostRepliesBox === 'function' ? renderPostRepliesBox(post) : ''}</div>
                </article>
            </div>
            <button type="button" class="newsx-post-detail-scroll-btn lux-secondary-btn home-hover-chip" data-news-post-detail-scroll-btn hidden aria-label="Scroll down">
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
        </div>
    `;
}

function syncNewsPostDetailScrollBtn(scrollEl, btn) {
    if (!scrollEl || !btn) return;
    const overflow = scrollEl.scrollHeight - scrollEl.clientHeight > 24;
    const remaining = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    const atBottom = remaining <= 24;
    const icon = btn.querySelector('i');
    if (!overflow) {
        btn.hidden = true;
        return;
    }
    btn.hidden = false;
    if (atBottom) {
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.dataset.newsScrollDir = 'up';
        if (icon) icon.className = 'fas fa-chevron-up';
    } else {
        btn.setAttribute('aria-label', 'Scroll down');
        btn.dataset.newsScrollDir = 'down';
        if (icon) icon.className = 'fas fa-chevron-down';
    }
}

function bindNewsPostDetailScrollChrome(panel) {
    const scrollEl = panel?.querySelector('[data-news-post-detail-scroll="1"]');
    const btn = panel?.querySelector('[data-news-post-detail-scroll-btn]');
    if (!scrollEl || !btn) return () => {};

    const sync = () => syncNewsPostDetailScrollBtn(scrollEl, btn);
    const onScroll = () => sync();
    const onResize = () => sync();
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    let observer = null;
    if (typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(sync);
        observer.observe(scrollEl);
        const article = scrollEl.firstElementChild;
        if (article) observer.observe(article);
    }
    window.requestAnimationFrame(sync);

    return () => {
        scrollEl.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        observer?.disconnect();
    };
}

function renderNewsPostDetailPanel() {
    ensureNewsModalShells();
    const panel = q('newsx-post-detail-panel');
    if (!panel || !runtime.postDetail?.open) return;
    const postId = String(runtime.postDetail.postId || '');
    const post = (runtime.posts || []).find((item) => String(item?.id || '') === postId);
    if (!post) {
        closeNewsPostDetail();
        return;
    }
    const scrollEl = panel.querySelector('[data-news-post-detail-scroll="1"]');
    const scrollTop = scrollEl ? scrollEl.scrollTop : null;
    setNewsRegionMarkup(panel, 'post-detail', renderNewsPostDetailMarkup(post));
    const nextScroll = panel.querySelector('[data-news-post-detail-scroll="1"]');
    if (nextScroll && scrollTop != null) {
        nextScroll.scrollTop = scrollTop;
        window.requestAnimationFrame(() => {
            if (nextScroll.isConnected) nextScroll.scrollTop = scrollTop;
        });
    }
    const repliesHost = panel.querySelector('[data-news-post-replies="1"]');
    if (repliesHost && typeof relayoutNewsReplyTrunks === 'function') {
        window.requestAnimationFrame(() => relayoutNewsReplyTrunks(repliesHost));
    }
    if (typeof newsPostDetailScrollCleanup === 'function') {
        newsPostDetailScrollCleanup();
        newsPostDetailScrollCleanup = null;
    }
    newsPostDetailScrollCleanup = bindNewsPostDetailScrollChrome(panel);
}

let newsPostDetailCleanup = null;
let newsPostDetailScrollCleanup = null;

function closeNewsPostDetail() {
    if (typeof newsPostDetailScrollCleanup === 'function') {
        newsPostDetailScrollCleanup();
        newsPostDetailScrollCleanup = null;
    }
    if (typeof newsPostDetailCleanup === 'function') {
        newsPostDetailCleanup();
        newsPostDetailCleanup = null;
    }
    runtime.postDetail = { open: false, postId: '' };
    setNewsModalOpen(POST_DETAIL_OVERLAY_ID, false);
    clearNewsRegionMarkup(q('newsx-post-detail-panel'), 'post-detail');
}

function openNewsPostDetail({ postId = '' } = {}) {
    const key = String(postId || '');
    const post = (runtime.posts || []).find((item) => String(item?.id || '') === key);
    if (!post) return;
    runtime.postDetail = { open: true, postId: key };
    ensureNewsModalShells();
    renderNewsPostDetailPanel();
    setNewsModalOpen(POST_DETAIL_OVERLAY_ID, true);
    if (typeof newsPostDetailCleanup === 'function') {
        newsPostDetailCleanup();
        newsPostDetailCleanup = null;
    }
    const panel = q('newsx-post-detail-panel');
    const onKeyDown = (event) => {
        if (!runtime.postDetail?.open) return;
        if (runtime.attachmentViewer?.open) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeNewsPostDetail();
        }
    };
    newsPostDetailCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    window.addEventListener('keydown', onKeyDown);
    panel?.querySelector('[data-news-close-post-detail]')?.focus();
}

window.openNewsPostDetail = openNewsPostDetail;
window.closeNewsPostDetail = closeNewsPostDetail;
window.syncNewsPostDetailScrollBtn = syncNewsPostDetailScrollBtn;
