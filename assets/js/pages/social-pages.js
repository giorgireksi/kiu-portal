(function initSocialPagesModule() {
    if (window.__KIU_SOCIAL_PAGES_MODULE_LOADED
        && typeof window.handleSocialPagesClick === 'function'
        && typeof window.renderPagesPanel === 'function') {
        return;
    }

    const hooks = window.__kiuSocialPagesHooks || {};
    const {
        state,
        text,
        escape,
        controlId,
        isManagedPage,
        pageAvatar,
        pageCover,
        pageTypeLabel,
        uniqueStrings,
        renderFileChip,
        renderPost,
        getSocialPageRecord,
        buildPageMembersList,
        pageAdminIdsFor,
        pageFollowerIdsFor,
        presencePill,
        accountById,
        accountSubtitle,
        avatar,
        displayName,
        roleLabel,
        currentUserId,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        patchPageFollowState,
        shouldPatchPageComposeBlock,
        patchPageComposeBlock,
        patchSocialFlash,
        togglePortalSocialFollow,
        reportPortalSocialContent,
        invalidateSocialRenderCache,
        refreshPortalSocialFeed,
        updatePortalSocialPage,
        closeDialog,
        createPortalSocialPage,
        readFileAsDataUrl,
        submitSocialPost,
        queuePageMembersSearchRefresh,
        activeDialog
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof controlId !== 'function'
        || typeof isManagedPage !== 'function'
        || typeof pageAvatar !== 'function'
        || typeof pageCover !== 'function'
        || typeof pageTypeLabel !== 'function'
        || typeof uniqueStrings !== 'function'
        || typeof renderFileChip !== 'function'
        || typeof renderPost !== 'function'
        || typeof getSocialPageRecord !== 'function'
        || typeof buildPageMembersList !== 'function'
        || typeof pageAdminIdsFor !== 'function'
        || typeof pageFollowerIdsFor !== 'function'
        || typeof presencePill !== 'function'
        || typeof accountById !== 'function'
        || typeof accountSubtitle !== 'function'
        || typeof avatar !== 'function'
        || typeof displayName !== 'function'
        || typeof roleLabel !== 'function'
        || typeof currentUserId !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof patchPageFollowState !== 'function'
        || typeof shouldPatchPageComposeBlock !== 'function'
        || typeof patchPageComposeBlock !== 'function'
        || typeof patchSocialFlash !== 'function'
        || typeof togglePortalSocialFollow !== 'function'
        || typeof reportPortalSocialContent !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof refreshPortalSocialFeed !== 'function'
        || typeof updatePortalSocialPage !== 'function'
        || typeof closeDialog !== 'function'
        || typeof createPortalSocialPage !== 'function'
        || typeof readFileAsDataUrl !== 'function'
        || typeof submitSocialPost !== 'function'
        || typeof queuePageMembersSearchRefresh !== 'function'
        || typeof activeDialog !== 'function'
    ) {
        throw new Error('Social pages hooks are unavailable.');
    }

    window.__KIU_SOCIAL_PAGES_MODULE_LOADED = true;

    function renderPagesHero(runtime, pages, activeTab, options = {}) {
        const {
            pagesSearchId = '',
            pageSearchValue = '',
            gridMarkup = '',
        } = options;
        const followedCount = pages.filter((page) => page?.isFollowing).length;
        const tabs = [
            {
                tab: 'discover',
                label: 'Discover',
                icon: 'fa-compass',
                helper: pages.length > 0
                    ? `Browse ${pages.length} campus ${pages.length === 1 ? 'page' : 'pages'}`
                    : 'Browse labs, clubs, and offices',
            },
            {
                tab: 'following',
                label: 'Following',
                icon: 'fa-star',
                helper: followedCount > 0
                    ? `${followedCount} ${followedCount === 1 ? 'page' : 'pages'} you follow`
                    : 'Pages you follow will appear here',
                badge: followedCount,
            },
        ];
        return `
            <section class="social-neo-card social-neo-pages-hero home-hover-chip">
                <div class="social-neo-pages-hero-header">
                    <div class="social-neo-pages-hero-head">
                        <div class="social-neo-pages-hero-actions">
                            <button class="lux-primary-btn social-neo-pages-create-trigger" type="button" data-action="page-create-open">
                                <i class="fas fa-plus"></i> Create Page
                            </button>
                        </div>
                    </div>
                    <div class="social-neo-pages-hero-grid home-hover-chip" role="tablist" aria-label="Pages view">
                            ${tabs.map((tab) => `
                                <button class="lux-secondary-btn social-neo-pages-hero-tab ${activeTab === tab.tab ? 'is-focused' : ''}" type="button" role="tab" data-action="panel-pages" data-pages-tab="${escape(tab.tab)}" aria-selected="${activeTab === tab.tab ? 'true' : 'false'}" aria-pressed="${activeTab === tab.tab ? 'true' : 'false'}">
                                    <span class="social-neo-pages-hero-tab-icon"><i class="fas ${escape(tab.icon)}" aria-hidden="true"></i></span>
                                    <span class="social-neo-pages-hero-tab-copy">
                                        <strong>${escape(tab.label)}</strong>
                                        <small>${escape(tab.helper)}</small>
                                    </span>
                                    ${tab.badge > 0 ? `<span class="lux-tab-badge social-neo-tab-badge">${escape(String(tab.badge))}</span>` : ''}
                                </button>
                            `).join('')}
                    </div>
                </div>
                <form class="social-neo-pages-hero-toolbar home-hover-chip" data-form="pages-search" autocomplete="off">
                    <label class="social-neo-field-flex-1-260">
                        <span class="social-neo-label">Search pages</span>
                        <input class="social-neo-input lux-control" id="${escape(pagesSearchId)}" name="pagesSearch" type="search" placeholder="Search pages by name, category, or bio..." data-bind="pages-search" value="${escape(pageSearchValue)}" autocomplete="off">
                    </label>
                    <button class="lux-primary-btn" type="submit"><i class="fas fa-search"></i> Search</button>
                </form>
                <div class="social-neo-pages-grid">
                    ${gridMarkup}
                </div>
            </section>
        `;
    }

    function renderPagesEmptyState(activeTab, pageSearch) {
        const hasSearch = Boolean(pageSearch);
        const icon = hasSearch ? 'fa-magnifying-glass' : activeTab === 'following' ? 'fa-star' : 'fa-flag';
        const title = hasSearch
            ? 'No pages match your search'
            : activeTab === 'following'
                ? 'No followed pages yet'
                : 'No pages yet';
        const copy = hasSearch
            ? 'Try a different page name, category, or bio.'
            : activeTab === 'following'
                ? 'Follow pages to keep their official and community posts close.'
                : 'Use Create Page to launch the first page in this space.';
        const cta = hasSearch
            ? `<div class="lux-glass-dialog-form-actions lux-glass-dialog-form-actions-mt-14">
                <button class="lux-secondary-btn" type="button" data-action="pages-search-clear">
                    <i class="fas fa-times"></i> Clear search
                </button>
            </div>`
            : activeTab === 'following'
                ? `<div class="lux-glass-dialog-form-actions lux-glass-dialog-form-actions-mt-14">
                    <button class="lux-primary-btn" type="button" data-action="panel-pages" data-pages-tab="discover">
                        <i class="fas fa-compass"></i> Browse Discover
                    </button>
                </div>`
                : '';
        return `
            <div class="social-neo-pages-empty-state">
                <i class="fas ${icon}"></i>
                <strong>${escape(title)}</strong>
                <span>${escape(copy)}</span>
                ${cta}
            </div>
        `;
    }

    function renderPageProfileComposer(page, runtime) {
        const canPost = Boolean(page?.isManager || page?.isFollowing);
        if (!canPost) {
            return `
                <article class="social-neo-card social-neo-page-compose-block">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Join the conversation</strong>
                            <span>Follow this page first if you want to publish a community post.</span>
                        </div>
                        <button class="lux-primary-btn" type="button" data-action="page-follow" data-page-id="${escape(text(page?.id))}">
                            <i class="fas fa-plus"></i> Follow Page
                        </button>
                    </div>
                </article>
            `;
        }
        const title = page?.isManager ? 'Publish on this page' : 'Share with this community';
        const subtitle = page?.isManager
            ? 'Post as the page officially or open a community thread.'
            : 'Followers can publish community posts to this page feed.';
        return `
            <article class="social-neo-card social-neo-page-compose-block social-neo-page-compose-cta">
                <div class="social-neo-section-head">
                    <div>
                        <strong>${escape(title)}</strong>
                        <span>${escape(subtitle)}</span>
                    </div>
                    <button class="lux-primary-btn social-neo-page-compose-open-btn" type="button" data-action="page-post-compose-open" data-page-id="${escape(text(page?.id))}">
                        <i class="fas fa-pen"></i> Write post
                    </button>
                </div>
            </article>
        `;
    }

    function renderPagesPanel() {
        const runtime = state();
        const social = runtime.social || {};
        const pages = Array.isArray(social.pages) ? social.pages : [];
        const activeTab = text(runtime.ui?.pagesTab || 'discover');
        const activeProfileId = text(runtime.ui?.activePageProfileId || '');
        const activeProfile = pages.find((page) => text(page?.id) === activeProfileId) || null;
        const pageProfileTab = text(runtime.ui?.pageProfileTab || 'all');
        const pageSearch = text(runtime.ui?.pagesSearch || '').trim().toLowerCase();
        const followedPages = pages.filter((page) => page?.isFollowing || isManagedPage(page));
        const pagesSearchId = controlId('pagesSearch');
        const categories = ['Technology', 'Entertainment', 'Gaming', 'Sports', 'Education', 'Business', 'Community', 'Media', 'Campus'];
        const profilePosts = activeProfile
            ? (Array.isArray(runtime.feed) ? runtime.feed : []).filter((post) =>
                text(post?.scopeType) === 'page' && text(post?.scopeId) === text(activeProfile.id))
            : [];

        const normalizeLink = (value) => {
            const raw = text(value);
            if (!raw) return '';
            return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        };
        const followerIdsFor = (page) => Array.isArray(page?.followerIds)
            ? page.followerIds
            : (Array.isArray(page?.followerUserIds) ? page.followerUserIds : []);
        const adminIdsFor = (page) => {
            const ids = Array.isArray(page?.adminIds) ? page.adminIds : (Array.isArray(page?.adminUserIds) ? page.adminUserIds : []);
            return uniqueStrings([...ids, text(page?.ownerUserId || '')].filter(Boolean));
        };
        const pageMatchesSearch = (page) => {
            if (!pageSearch) return true;
            const haystack = [
                page?.name,
                page?.description,
                page?.tagline,
                page?.about,
                page?.category,
                page?.facultyName,
                page?.location
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(pageSearch);
        };
        const filteredPages = pages.filter(pageMatchesSearch);
        const filteredFollowedPages = followedPages.filter(pageMatchesSearch);
        const visiblePages = activeTab === 'following' ? filteredFollowedPages : filteredPages;
        const sortPagePosts = (records, page) => {
            const pinnedIds = new Set(Array.isArray(page?.pinnedPostIds) ? page.pinnedPostIds.map((item) => text(item)) : []);
            return [...records].sort((left, right) => {
                const leftPinned = pinnedIds.has(text(left?.id));
                const rightPinned = pinnedIds.has(text(right?.id));
                if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
                if (pageProfileTab === 'all') {
                    const leftOfficial = text(left?.postType || 'community') === 'official';
                    const rightOfficial = text(right?.postType || 'community') === 'official';
                    if (leftOfficial !== rightOfficial) return leftOfficial ? -1 : 1;
                }
                return new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();
            });
        };

        const filterProfilePosts = (page) => {
            if (!page) return [];
            if (pageProfileTab === 'about') return [];
            const records = profilePosts.filter((post) => {
                if (pageProfileTab === 'official') return text(post?.postType || '') === 'official';
                if (pageProfileTab === 'community') return text(post?.postType || '') === 'community';
                return true;
            });
            return sortPagePosts(records, page);
        };

        const PAGE_ABOUT_PREVIEW_MAX = 140;
        const pageAboutText = (page) => text(page?.about || page?.description || 'No profile summary yet.');
        const pageAboutNeedsMore = (page) => pageAboutText(page).length > PAGE_ABOUT_PREVIEW_MAX;

        const renderPageCard = (page) => {
            const followerIds = followerIdsFor(page);
            const coverSrc = pageCover(page);
            const actionHref = normalizeLink(page?.actionUrl || page?.website || '');
            const pinnedCount = Array.isArray(page?.pinnedPostIds) ? page.pinnedPostIds.length : 0;
            const aboutText = pageAboutText(page);
            return `
                <article class="social-neo-card social-neo-page-card social-neo-page-card-rich home-hover-chip">
                    <div class="social-neo-page-card-cover">
                        ${coverSrc ? `<img src="${escape(coverSrc)}" alt="${escape(text(page?.name || 'Page'))} cover">` : `<div class="social-neo-page-card-cover-fallback"></div>`}
                    </div>
                    <div class="social-neo-page-card-body">
                        <div class="social-neo-page-card-brand">
                            ${pageAvatar(page, 'social-neo-page-card-avatar')}
                            <div>
                                <strong>${escape(text(page?.name || 'Page'))}</strong>
                                <span class="social-neo-page-card-meta">
                                    <span class="social-neo-pill">${escape(pageTypeLabel(page))}</span>
                                    <span class="social-neo-pill">${escape(text(page?.category || 'General'))}</span>
                                    ${page?.official ? '<span class="social-neo-pill">Official</span>' : ''}
                                </span>
                            </div>
                        </div>
                        <p class="social-neo-page-card-desc">${escape(text(page?.tagline || page?.description || 'No tagline yet.'))}</p>
                        <div class="social-neo-badge-row">
                            <span class="social-neo-pill">${escape(page?.followerCount || followerIds.length || 0)} followers</span>
                            ${page?.location ? `<span class="social-neo-pill">${escape(page.location)}</span>` : ''}
                            ${pinnedCount ? `<span class="social-neo-pill">${escape(pinnedCount)} pinned</span>` : ''}
                            ${isManagedPage(page) ? '<span class="social-neo-pill">Managed by you</span>' : ''}
                        </div>
                        <div class="social-neo-page-card-actions">
                            <button class="lux-secondary-btn" type="button" data-action="page-open-profile" data-page-id="${escape(text(page?.id))}">
                                <i class="fas fa-globe"></i> Open Page
                            </button>
                            <button class="${page?.isFollowing ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="page-follow" data-page-id="${escape(text(page?.id))}">
                                <i class="fas ${page?.isFollowing ? 'fa-check' : 'fa-plus'}"></i> ${page?.isFollowing ? 'Following' : 'Follow'}
                            </button>
                            ${actionHref ? `<a class="lux-secondary-btn" href="${escape(actionHref)}" target="_blank" rel="noopener"><i class="fas fa-up-right-from-square"></i> ${escape(text(page?.actionLabel || 'Visit'))}</a>` : ''}
                            <button class="lux-secondary-btn" type="button" data-action="page-report" data-page-id="${escape(text(page?.id))}">
                                <i class="fas fa-flag"></i> Report
                            </button>
                        </div>
                        <div class="social-neo-page-card-support">
                            <article class="social-neo-entity-card social-neo-page-card-about">
                                <div>
                                    <strong>About</strong>
                                    <span class="social-neo-page-card-about-text">${escape(aboutText)}</span>
                                    ${pageAboutNeedsMore(page) ? `<button class="lux-ghost-btn social-neo-page-card-about-more" type="button" data-action="page-about-more" data-page-id="${escape(text(page?.id))}">More</button>` : ''}
                                </div>
                            </article>
                        </div>
                    </div>
                </article>
            `;
        };

        const renderProfileComposer = (page) => renderPageProfileComposer(page, runtime);

        const renderProfileAbout = (page) => {
            const adminIds = adminIdsFor(page);
            const followerIds = followerIdsFor(page);
            const actionHref = normalizeLink(page?.actionUrl || page?.website || '');
            const editMode = Boolean(runtime.ui?.pageProfileEditMode && page?.isManager);
            if (editMode) {
                return `
                    <form class="social-neo-card social-neo-page-about-card social-neo-stack" data-form="update-page-profile" data-page-id="${escape(text(page?.id))}">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>Edit page profile</strong>
                                <span>Update branding, contact details, and the public page summary.</span>
                            </div>
                            <button class="lux-secondary-btn" type="button" data-action="page-profile-edit-cancel">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label><span class="social-neo-label">Page name</span><input class="social-neo-input lux-control" type="text" name="pageName" value="${escape(text(runtime.ui?.pageName || page?.name || ''))}"></label>
                            <label><span class="social-neo-label">Category</span><select class="social-neo-select lux-control" name="pageCategory" data-lux-picker>${categories.map((category) => `<option value="${escape(category)}" ${text(runtime.ui?.pageCategory || page?.category || '') === category ? 'selected' : ''}>${escape(category)}</option>`).join('')}</select></label>
                            <label><span class="social-neo-label">Page type</span><select class="social-neo-select lux-control" name="pageType" data-lux-picker><option value="brand" ${text(runtime.ui?.pageType || page?.pageType || 'brand') === 'brand' ? 'selected' : ''}>Brand / product</option><option value="community" ${text(runtime.ui?.pageType || page?.pageType || 'brand') === 'community' ? 'selected' : ''}>Community / fan page</option><option value="campus" ${text(runtime.ui?.pageType || page?.pageType || 'brand') === 'campus' ? 'selected' : ''}>Campus / official</option></select></label>
                            <label><span class="social-neo-label">Visibility</span><select class="social-neo-select lux-control" name="pageVisibility" data-lux-picker><option value="public" ${text(runtime.ui?.pageVisibility || page?.visibility || 'public') === 'public' ? 'selected' : ''}>Public</option><option value="private" ${text(runtime.ui?.pageVisibility || page?.visibility || 'public') === 'private' ? 'selected' : ''}>Private</option></select></label>
                            <label><span class="social-neo-label">Avatar image URL</span><input class="social-neo-input lux-control" type="url" name="pageAvatarUrl" value="${escape(text(runtime.ui?.pageAvatarUrl || page?.avatarImage || ''))}"></label>
                            <label><span class="social-neo-label">Cover image URL</span><input class="social-neo-input lux-control" type="url" name="pageCoverUrl" value="${escape(text(runtime.ui?.pageCoverUrl || page?.coverImage || ''))}"></label>
                            <label><span class="social-neo-label">Upload avatar</span><input class="social-neo-input lux-control" type="file" name="pageAvatarFile" accept="image/*">${renderFileChip(runtime.ui?.pageAvatarFile, 'Avatar image ready')}</label>
                            <label><span class="social-neo-label">Upload cover</span><input class="social-neo-input lux-control" type="file" name="pageCoverFile" accept="image/*">${renderFileChip(runtime.ui?.pageCoverFile, 'Cover image ready')}</label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">Tagline</span><input class="social-neo-input lux-control" type="text" name="pageTagline" value="${escape(text(runtime.ui?.pageTagline || page?.tagline || ''))}"></label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">Short description</span><textarea class="social-neo-textarea lux-control" rows="3" name="pageDescription">${escape(text(runtime.ui?.pageDescription || page?.description || ''))}</textarea></label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">About</span><textarea class="social-neo-textarea lux-control" rows="5" name="pageAbout">${escape(text(runtime.ui?.pageAbout || page?.about || ''))}</textarea></label>
                            <label><span class="social-neo-label">Website</span><input class="social-neo-input lux-control" type="url" name="pageWebsite" value="${escape(text(runtime.ui?.pageWebsite || page?.website || ''))}"></label>
                            <label><span class="social-neo-label">Contact email</span><input class="social-neo-input lux-control" type="email" name="pageContactEmail" value="${escape(text(runtime.ui?.pageContactEmail || page?.contactEmail || ''))}"></label>
                            <label><span class="social-neo-label">Location</span><input class="social-neo-input lux-control" type="text" name="pageLocation" value="${escape(text(runtime.ui?.pageLocation || page?.location || ''))}"></label>
                            <label><span class="social-neo-label">Primary action label</span><input class="social-neo-input lux-control" type="text" name="pageActionLabel" value="${escape(text(runtime.ui?.pageActionLabel || page?.actionLabel || ''))}"></label>
                            <label class="social-neo-grid-col-span-all"><span class="social-neo-label">Primary action URL</span><input class="social-neo-input lux-control" type="url" name="pageActionUrl" value="${escape(text(runtime.ui?.pageActionUrl || page?.actionUrl || ''))}"></label>
                        </div>
                        <div class="lux-glass-dialog-form-actions">
                            <button class="lux-primary-btn" type="submit"><i class="fas fa-save"></i> Save Page</button>
                        </div>
                    </form>
                `;
            }
            const aboutText = pageAboutText(page);
            return `
                <div class="social-neo-page-profile-layout">
                    <article class="social-neo-card social-neo-page-about-card">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>About ${escape(text(page?.name || 'this page'))}</strong>
                                <span>${escape(text(page?.tagline || 'Public profile information and contact details.'))}</span>
                            </div>
                            ${page?.isManager ? `
                                <button class="lux-secondary-btn" type="button" data-action="page-profile-edit-toggle" data-page-id="${escape(text(page?.id))}">
                                    <i class="fas fa-pen"></i> Edit page
                                </button>
                            ` : ''}
                        </div>
                        <div class="social-neo-list">
                            <article class="social-neo-entity-card social-neo-page-card-about"><div><strong>About</strong><span class="social-neo-page-card-about-text">${escape(aboutText)}</span>${pageAboutNeedsMore(page) ? `<button class="lux-ghost-btn social-neo-page-card-about-more" type="button" data-action="page-about-more" data-page-id="${escape(text(page?.id))}">More</button>` : ''}</div></article>
                            <article class="social-neo-entity-card"><div><strong>Contact</strong><span>${escape(text(page?.contactEmail || 'No contact email listed.'))}</span></div></article>
                            <article class="social-neo-entity-card"><div><strong>Website</strong><span>${actionHref ? `<a href="${escape(actionHref)}" target="_blank" rel="noopener">${escape(text(page?.website || page?.actionUrl || 'Visit page'))}</a>` : 'No website linked yet.'}</span></div></article>
                            <article class="social-neo-entity-card"><div><strong>Location</strong><span>${escape(text(page?.location || 'No location listed.'))}</span></div></article>
                        </div>
                    </article>
                    <article class="social-neo-card social-neo-page-about-card social-neo-page-people-card">
                        <div class="social-neo-section-head">
                            <div>
                                <strong>People on this page</strong>
                                <span>Admins and followers connected to this page.</span>
                            </div>
                        </div>
                        <div class="social-neo-stat-grid social-neo-page-people-stats">
                            <div><strong>${escape(adminIds.length)}</strong><span>Admins</span></div>
                            <div><strong>${escape(page?.followerCount || followerIds.length || 0)}</strong><span>Followers</span></div>
                        </div>
                        <button class="lux-secondary-btn social-neo-page-people-open" type="button" data-action="page-members-open" data-page-id="${escape(text(page?.id))}">
                            <i class="fas fa-users"></i> View page members
                        </button>
                    </article>
                </div>
            `;
        };

        const renderPageProfile = (page) => {
            const posts = filterProfilePosts(page);
            const coverSrc = pageCover(page);
            const followerIds = followerIdsFor(page);
            const actionHref = normalizeLink(page?.actionUrl || page?.website || '');
            return `
                <section class="social-neo-pages-shell">
                    <article class="social-neo-card social-neo-page-profile">
                        <div class="social-neo-page-cover">
                            ${coverSrc ? `<img src="${escape(coverSrc)}" alt="${escape(text(page?.name || 'Page'))} cover">` : '<div class="social-neo-page-card-cover-fallback"></div>'}
                            <button class="lux-secondary-btn social-neo-page-profile-back" type="button" data-action="page-profile-back">
                                <i class="fas fa-arrow-left"></i> Back to pages
                            </button>
                        </div>
                        <div class="social-neo-page-profile-header">
                            <div class="social-neo-page-profile-brand">
                                ${pageAvatar(page, 'social-neo-page-profile-avatar')}
                                <div class="social-neo-page-profile-meta">
                                    <h3>${escape(text(page?.name || 'Page'))}</h3>
                                    <div class="social-neo-badge-row">
                                        <span class="social-neo-pill">${escape(pageTypeLabel(page))}</span>
                                        <span class="social-neo-pill">${escape(text(page?.category || 'General'))}</span>
                                        ${page?.official ? '<span class="social-neo-pill">Official</span>' : ''}
                                        ${page?.verified ? '<span class="social-neo-pill">Verified</span>' : ''}
                                        <span class="social-neo-pill">${escape(page?.followerCount || followerIds.length || 0)} followers</span>
                                    </div>
                                    <p>${escape(text(page?.tagline || page?.description || 'No page tagline yet.'))}</p>
                                </div>
                            </div>
                            <div class="social-neo-page-profile-actions">
                                <button class="${page?.isFollowing ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="page-follow" data-page-id="${escape(text(page?.id))}">
                                    <i class="fas ${page?.isFollowing ? 'fa-check' : 'fa-plus'}"></i> ${page?.isFollowing ? 'Following' : 'Follow'}
                                </button>
                                ${actionHref ? `<a class="lux-secondary-btn" href="${escape(actionHref)}" target="_blank" rel="noopener"><i class="fas fa-up-right-from-square"></i> ${escape(text(page?.actionLabel || 'Visit'))}</a>` : ''}
                                <button class="lux-secondary-btn" type="button" data-action="page-report" data-page-id="${escape(text(page?.id))}">
                                    <i class="fas fa-flag"></i> Report
                                </button>
                            </div>
                        </div>
                        <div class="social-neo-page-profile-tabs social-neo-page-profile-tab-strip" role="tablist" aria-label="Page sections">
                            ${[
                                ['all', 'All', 'fa-layer-group'],
                                ['official', 'Official', 'fa-certificate'],
                                ['community', 'Community', 'fa-users'],
                                ['about', 'About', 'fa-circle-info']
                            ].map(([value, label, icon]) => `
                                <button class="social-neo-page-profile-tab ${pageProfileTab === value ? 'is-active' : ''}" type="button" role="tab" aria-selected="${pageProfileTab === value ? 'true' : 'false'}" data-action="page-profile-tab" data-page-profile-tab="${escape(value)}">
                                    <i class="fas ${escape(icon)}" aria-hidden="true"></i><span>${escape(label)}</span>
                                </button>
                            `).join('')}
                        </div>
                    </article>
                    ${pageProfileTab === 'about' ? renderProfileAbout(page) : `
                        ${(pageProfileTab !== 'official' || page?.isManager) ? renderProfileComposer(page) : ''}
                        <section class="social-neo-stack social-neo-page-feed">
                            ${posts.length ? posts.map((post) => renderPost(post)).join('') : `
                                <div class="social-neo-empty-hero">
                                    <i class="fas fa-comments"></i>
                                    <strong>${pageProfileTab === 'official' ? 'No official posts yet' : pageProfileTab === 'community' ? 'No community posts yet' : 'This page has not posted yet'}</strong>
                                    <span>${pageProfileTab === 'community' ? 'Followers can publish community posts here once they follow the page.' : 'Publish the first post to start the page conversation.'}</span>
                                </div>
                            `}
                        </section>
                    `}
                </section>
            `;
        };

        if (activeProfile) return renderPageProfile(activeProfile);

        return `
            <section class="social-neo-pages-shell">
                ${renderPagesHero(runtime, pages, activeTab, {
                    pagesSearchId,
                    pageSearchValue: text(runtime.ui?.pagesSearch || ''),
                    gridMarkup: visiblePages.length
                        ? visiblePages.map(renderPageCard).join('')
                        : renderPagesEmptyState(activeTab, pageSearch),
                })}
            </section>
        `;
    }

    function renderPageCreateDialog(runtime) {
        const wizardStep = Math.min(5, Math.max(1, Number(runtime.ui?.pageWizardStep || 1)));
        const pageNameId = controlId('pageName');
        const pageDescriptionId = controlId('pageDescription');
        const pageVisibilityId = controlId('pageVisibility');
        const pageCategoryId = controlId('pageCategory');
        const pageTypeId = controlId('pageType');
        const pageAvatarUrlId = controlId('pageAvatarUrl');
        const pageCoverUrlId = controlId('pageCoverUrl');
        const pageTaglineId = controlId('pageTagline');
        const pageAboutId = controlId('pageAbout');
        const pageWebsiteId = controlId('pageWebsite');
        const pageContactEmailId = controlId('pageContactEmail');
        const pageLocationId = controlId('pageLocation');
        const pageActionLabelId = controlId('pageActionLabel');
        const pageActionUrlId = controlId('pageActionUrl');
        const categories = ['Technology', 'Entertainment', 'Gaming', 'Sports', 'Education', 'Business', 'Community', 'Media', 'Campus'];
        const pageType = text(runtime.ui?.pageType || 'brand') || 'brand';
        const pageVisibility = text(runtime.ui?.pageVisibility || 'public') || 'public';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--page-create lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-form="create-page" data-action="noop" data-lux-transparency-exempt="1">
                ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Create page', 'Build a public-facing page for a brand, product, club, department, or official campus team.', { icon: 'fas fa-flag' }) : ''}
                <div class="lux-glass-dialog-body lux-glass-dialog-body--page-create">
                    <div class="social-neo-pages-wizard-steps lux-glass-dialog-page-create-steps">
                        ${[
                            ['1', 'Basics'],
                            ['2', 'Branding'],
                            ['3', 'About'],
                            ['4', 'Action'],
                            ['5', 'Preview']
                        ].map(([value, label]) => `
                            <span class="social-neo-pages-wizard-step ${Number(value) === wizardStep ? 'is-active' : Number(value) < wizardStep ? 'is-complete' : ''}">
                                <strong>${escape(value)}</strong>
                                <span>${escape(label)}</span>
                            </span>
                        `).join('')}
                    </div>
                    ${wizardStep === 1 ? `
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label class="lux-glass-dialog-field" for="${escape(pageNameId)}">
                                <span class="social-neo-label">Page name</span>
                                <input class="social-neo-input lux-control" id="${escape(pageNameId)}" type="text" name="pageName" placeholder="Apple, Netflix, Fortnite..." value="${escape(text(runtime.ui?.pageName || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageCategoryId)}">
                                <span class="social-neo-label">Category</span>
                                <select class="social-neo-select lux-control" id="${escape(pageCategoryId)}" name="pageCategory" data-lux-picker>
                                    ${categories.map((category) => `<option value="${escape(category)}" ${text(runtime.ui?.pageCategory || '') === category ? 'selected' : ''}>${escape(category)}</option>`).join('')}
                                </select>
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageTypeId)}">
                                <span class="social-neo-label">Page type</span>
                                <select class="social-neo-select lux-control" id="${escape(pageTypeId)}" name="pageType" data-lux-picker>
                                    <option value="brand" ${pageType === 'brand' ? 'selected' : ''}>Brand / product</option>
                                    <option value="community" ${pageType === 'community' ? 'selected' : ''}>Community / fan page</option>
                                    <option value="campus" ${pageType === 'campus' ? 'selected' : ''}>Campus / official</option>
                                </select>
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageVisibilityId)}">
                                <span class="social-neo-label">Visibility</span>
                                <select class="social-neo-select lux-control" id="${escape(pageVisibilityId)}" name="pageVisibility" data-lux-picker>
                                    <option value="public" ${pageVisibility === 'public' ? 'selected' : ''}>Public</option>
                                    <option value="private" ${pageVisibility === 'private' ? 'selected' : ''}>Private</option>
                                </select>
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 2 ? `
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label class="lux-glass-dialog-field" for="${escape(pageAvatarUrlId)}">
                                <span class="social-neo-label">Avatar image URL</span>
                                <input class="social-neo-input lux-control" id="${escape(pageAvatarUrlId)}" type="url" name="pageAvatarUrl" placeholder="https://..." value="${escape(text(runtime.ui?.pageAvatarUrl || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageCoverUrlId)}">
                                <span class="social-neo-label">Cover image URL</span>
                                <input class="social-neo-input lux-control" id="${escape(pageCoverUrlId)}" type="url" name="pageCoverUrl" placeholder="https://..." value="${escape(text(runtime.ui?.pageCoverUrl || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Upload avatar</span>
                                <input class="social-neo-input lux-control" type="file" name="pageAvatarFile" accept="image/*">
                                ${renderFileChip(runtime.ui?.pageAvatarFile, 'Avatar image ready')}
                            </label>
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Upload cover</span>
                                <input class="social-neo-input lux-control" type="file" name="pageCoverFile" accept="image/*">
                                ${renderFileChip(runtime.ui?.pageCoverFile, 'Cover image ready')}
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 3 ? `
                        <div class="social-neo-stack">
                            <label class="lux-glass-dialog-field" for="${escape(pageTaglineId)}">
                                <span class="social-neo-label">Tagline</span>
                                <input class="social-neo-input lux-control" id="${escape(pageTaglineId)}" type="text" name="pageTagline" placeholder="Short headline people will remember" value="${escape(text(runtime.ui?.pageTagline || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageDescriptionId)}">
                                <span class="social-neo-label">Short description</span>
                                <textarea class="social-neo-textarea lux-control" id="${escape(pageDescriptionId)}" rows="3" name="pageDescription" placeholder="What is this page for?">${escape(text(runtime.ui?.pageDescription || ''))}</textarea>
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageAboutId)}">
                                <span class="social-neo-label">About</span>
                                <textarea class="social-neo-textarea lux-control" id="${escape(pageAboutId)}" rows="5" name="pageAbout" placeholder="Tell people what this page offers, who runs it, and what they should expect.">${escape(text(runtime.ui?.pageAbout || ''))}</textarea>
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 4 ? `
                        <div class="social-neo-form-grid social-neo-pages-form-grid">
                            <label class="lux-glass-dialog-field" for="${escape(pageWebsiteId)}">
                                <span class="social-neo-label">Website</span>
                                <input class="social-neo-input lux-control" id="${escape(pageWebsiteId)}" type="url" name="pageWebsite" placeholder="https://example.com" value="${escape(text(runtime.ui?.pageWebsite || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageContactEmailId)}">
                                <span class="social-neo-label">Contact email</span>
                                <input class="social-neo-input lux-control" id="${escape(pageContactEmailId)}" type="email" name="pageContactEmail" placeholder="team@example.com" value="${escape(text(runtime.ui?.pageContactEmail || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageLocationId)}">
                                <span class="social-neo-label">Location</span>
                                <input class="social-neo-input lux-control" id="${escape(pageLocationId)}" type="text" name="pageLocation" placeholder="Cupertino, CA / Online" value="${escape(text(runtime.ui?.pageLocation || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(pageActionLabelId)}">
                                <span class="social-neo-label">Primary action label</span>
                                <input class="social-neo-input lux-control" id="${escape(pageActionLabelId)}" type="text" name="pageActionLabel" placeholder="Visit site / Join beta / Learn more" value="${escape(text(runtime.ui?.pageActionLabel || ''))}">
                            </label>
                            <label class="lux-glass-dialog-field social-neo-grid-col-span-all" for="${escape(pageActionUrlId)}">
                                <span class="social-neo-label">Primary action URL</span>
                                <input class="social-neo-input lux-control" id="${escape(pageActionUrlId)}" type="url" name="pageActionUrl" placeholder="https://..." value="${escape(text(runtime.ui?.pageActionUrl || ''))}">
                            </label>
                        </div>
                    ` : ''}
                    ${wizardStep === 5 ? `
                        <div class="social-neo-pages-preview">
                            <div class="social-neo-page-preview-cover">
                                ${text(runtime.ui?.pageCoverUrl || '') ? `<img src="${escape(text(runtime.ui?.pageCoverUrl || ''))}" alt="Page cover preview">` : '<div class="social-neo-page-card-cover-fallback"></div>'}
                            </div>
                            <div class="social-neo-page-preview-head">
                                ${pageAvatar({ name: runtime.ui?.pageName, avatarImage: runtime.ui?.pageAvatarUrl }, 'social-neo-page-card-avatar')}
                                <div>
                                    <strong>${escape(text(runtime.ui?.pageName || 'Untitled page'))}</strong>
                                    <span class="social-neo-page-card-meta">
                                        <span class="social-neo-pill">${escape(text(runtime.ui?.pageCategory || categories[0]))}</span>
                                        <span class="social-neo-pill">${escape(pageType === 'campus' ? 'Official page' : pageType === 'community' ? 'Community page' : 'Brand page')}</span>
                                        <span class="social-neo-pill">${escape(pageVisibility)}</span>
                                    </span>
                                </div>
                            </div>
                            <p>${escape(text(runtime.ui?.pageTagline || runtime.ui?.pageDescription || 'Add a tagline to help people understand the page instantly.'))}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="page-wizard-prev" ${wizardStep === 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    ${wizardStep < 5 ? `
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="button" data-action="page-wizard-next">
                            Continue <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : `
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit">
                            <i class="fas fa-rocket"></i> Publish Page
                        </button>
                    `}
                </div>
            </form>
        </div>`;
    }
    function renderPagePostComposeDialog(runtime, page) {
        const pagePostBodyId = controlId('pagePostBody', text(page?.id) || 'new');
        const selectedPostType = page?.isManager
            ? text(runtime.ui?.pagePostType || 'official') || 'official'
            : 'community';
        const title = page?.isManager ? 'Publish on this page' : 'Share with this community';
        const subtitle = page?.isManager
            ? 'Post as the page officially or open a community thread.'
            : 'Followers can publish community posts to this page feed.';
        const placeholder = page?.isManager
            ? 'Share an official update, launch note, or announcement...'
            : 'Share a community thought, reaction, or question...';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--page-post lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-form="page-profile-post" data-page-id="${escape(text(page?.id))}" data-action="noop" data-lux-transparency-exempt="1">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <strong class="lux-glass-dialog-title"><i class="fas fa-pen" aria-hidden="true"></i> ${escape(title)}</strong>
                        <span class="lux-glass-dialog-subtitle">${escape(subtitle)}</span>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body lux-glass-dialog-body--page-post">
                    ${page?.isManager ? `
                        <label class="lux-glass-dialog-field">
                            <span class="social-neo-label">Post type</span>
                            <select class="social-neo-select lux-control" name="pagePostType" data-lux-picker>
                                <option value="official" ${selectedPostType === 'official' ? 'selected' : ''}>Official post</option>
                                <option value="community" ${selectedPostType === 'community' ? 'selected' : ''}>Community post</option>
                            </select>
                        </label>
                    ` : '<input type="hidden" name="pagePostType" value="community">'}
                    <label class="lux-glass-dialog-field" for="${escape(pagePostBodyId)}">
                        <span class="social-neo-label">Message</span>
                        <textarea class="social-neo-textarea lux-control" id="${escape(pagePostBodyId)}" rows="4" name="pagePostBody" placeholder="${escape(placeholder)}">${escape(text(runtime.ui?.pagePostBody || ''))}</textarea>
                    </label>
                    <label class="lux-glass-dialog-field">
                        <span class="social-neo-label">Attachment</span>
                        <input class="social-neo-input lux-control" type="file" name="pagePostFile" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt">
                        ${renderFileChip(runtime.ui?.pagePostFile, 'Page attachment ready')}
                    </label>
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit">
                        <i class="fas fa-paper-plane"></i> Publish
                    </button>
                </div>
            </form>
        </div>`;
    }

    const PAGES_OWNED_DIALOG_KINDS = new Set([
        'page-about',
        'page-members',
        'page-create',
        'page-post-compose'
    ]);

    function renderPagesOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!PAGES_OWNED_DIALOG_KINDS.has(kind)) return '';
        if (kind === 'page-create') {
            return renderPageCreateDialog(runtime || state());
        }
        if (kind === 'page-post-compose') {
            const page = dialog.page || getSocialPageRecord(dialog.pageId);
            if (!page) return '';
            return renderPagePostComposeDialog(runtime || state(), page);
        }
        if (kind === 'page-about') {
            const page = dialog.page || getSocialPageRecord(dialog.pageId);
            if (!page) return '';
            const aboutBody = text(page?.about || page?.description || 'No profile summary yet.');
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--compact" data-action="noop">
                    <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                        <div class="lux-glass-dialog-heading">
                            <strong class="lux-glass-dialog-title"><i class="fas fa-circle-info"></i> About ${escape(text(page?.name || 'Page'))}</strong>
                            <span class="lux-glass-dialog-subtitle">Full page description</span>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="lux-glass-dialog-preview social-neo-page-about-dialog-body">${escape(aboutBody)}</div>
                    <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="button" data-action="dialog-close">Close</button>
                    </div>
                </div>
            </div>`;
        }
        if (kind === 'page-members') {
            const page = dialog.page || getSocialPageRecord(dialog.pageId);
            if (!page) return '';
            const membersSearch = text(runtime.ui?.pageMembersSearch || '').trim().toLowerCase();
            const membersFilter = text(runtime.ui?.pageMembersFilter || 'all') || 'all';
            const members = buildPageMembersList(page).filter((member) => {
                if (membersFilter === 'admins' && member.role !== 'admin') return false;
                if (membersFilter === 'followers' && member.role !== 'follower') return false;
                if (!membersSearch) return true;
                const account = accountById(member.id) || { id: member.id };
                const haystack = [displayName(account), account?.email, account?.facultyCode, account?.faculty, roleLabel(account?.role), member.role].filter(Boolean).join(' ').toLowerCase();
                return haystack.includes(membersSearch);
            });
            const adminCount = pageAdminIdsFor(page).length;
            const followerCount = page?.followerCount || pageFollowerIdsFor(page).length || 0;
            const filterChip = (value, label) => `<button class="social-neo-pill social-neo-page-members-filter ${membersFilter === value ? 'is-active' : ''}" type="button" data-action="page-members-filter" data-filter="${escape(value)}">${escape(label)}</button>`;
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--panel lux-glass-dialog-card lux-glass-dialog-card--social-glass lux-glass-dialog-card--panel-members" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="lux-glass-dialog-head social-neo-surveys-hero-head">
                        <div class="social-neo-surveys-hero-copy">
                            <span class="social-neo-section-kicker">Page</span>
                            <h2>Members</h2>
                            <p>Admins and followers of ${escape(text(page?.name || 'this page'))}.</p>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--panel">
                        <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats">
                            <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(adminCount))}</strong><span>Admins</span></article>
                            <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(followerCount))}</strong><span>Followers</span></article>
                            <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(members.length))}</strong><span>Showing</span></article>
                        </div>
                        <section class="lux-glass-dialog-group-section lux-glass-dialog-panel-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Browse members</strong>
                                <span>Search and filter people connected to this page.</span>
                            </div>
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Search members</span>
                                <input class="social-neo-input lux-control" type="search" data-bind="page-members-search" placeholder="Search by name, email, or faculty..." value="${escape(text(runtime.ui?.pageMembersSearch || ''))}">
                            </label>
                            <div class="social-neo-page-members-filters social-neo-panel-filter-row">
                                ${filterChip('all', 'All')}
                                ${filterChip('admins', 'Admins')}
                                ${filterChip('followers', 'Followers')}
                            </div>
                            <div class="lux-glass-dialog-member-list">
                                ${members.length ? members.map((member) => {
                                    const account = accountById(member.id) || { id: member.id };
                                    const isSelf = text(member.id) === text(currentUserId());
                                    const roleLabelText = member.role === 'admin' ? 'Admin' : 'Follower';
                                    return `<div class="lux-glass-dialog-member-row">
                                        <div class="social-neo-person">
                                            ${avatar(account, 'social-neo-avatar-sm')}
                                            <div class="lux-glass-dialog-member-info">
                                                <strong>${escape(displayName(account))} <span class="social-neo-pill ${member.role === 'admin' ? 'social-neo-pill-accent' : ''}">${escape(roleLabelText)}</span></strong>
                                                <span>${escape(accountSubtitle(account))}</span>
                                            </div>
                                        </div>
                                        <div class="social-neo-inline social-neo-inline-gap-6-wrap">
                                            ${presencePill(account)}
                                            <button class="lux-ghost-btn" type="button" data-action="profile-view" data-user-id="${escape(text(member.id))}">Profile</button>
                                            ${!isSelf ? `<button class="lux-ghost-btn" type="button" data-action="directory-message" data-user-id="${escape(text(member.id))}">Message</button>` : ''}
                                        </div>
                                    </div>`;
                                }).join('') : '<div class="social-neo-empty">No members match the current search.</div>'}
                            </div>
                        </section>
                    </div>
                </div>
            </div>`;
        }
        return '';
    }

    window.renderPagesHero = renderPagesHero;
    window.renderPagesEmptyState = renderPagesEmptyState;
    window.renderPageProfileComposer = renderPageProfileComposer;
    window.renderPagesPanel = renderPagesPanel;
    window.renderPageCreateDialog = renderPageCreateDialog;
    window.renderPagePostComposeDialog = renderPagePostComposeDialog;
    window.renderPagesOwnedDialog = renderPagesOwnedDialog;
    window.PAGES_OWNED_DIALOG_KINDS = PAGES_OWNED_DIALOG_KINDS;

    function isSocialPagesClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        if (a === 'pages-search-clear') return true;
        return a.startsWith('page-');
    }

    function handleSocialPagesClick(action, trigger) {
        if (!isSocialPagesClickAction(action)) return false;
        if (action === 'pages-search-clear') {
            state().ui.pagesSearch = '';
            return renderSocialPageNow('pages-search-clear');
        }

        if (action === 'page-members-search') return renderSocialPageNow('page-members-search');

        if (action === 'page-members-filter') {
            state().ui.pageMembersFilter = text(trigger.getAttribute('data-filter') || 'all') || 'all';
            return renderSocialPageNow('page-members-filter');
        }

        if (action === 'page-members-open') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = getSocialPageRecord(pageId);
            if (!page) return;
            state().ui.pageMembersSearch = '';
            state().ui.pageMembersFilter = 'all';
            return openDialog('page-members', { pageId, page });
        }

        if (action === 'page-post-compose-open') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = getSocialPageRecord(pageId);
            if (!page || (!page.isManager && !page.isFollowing)) return;
            return openDialog('page-post-compose', { pageId, page });
        }

        if (action === 'page-follow') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = getSocialPageRecord(pageId);
            if (!page) return;
            const previousFollowing = Boolean(page.isFollowing);
            page.isFollowing = !previousFollowing;
            page.followerCount = Math.max(0, Number(page.followerCount || 0) + (page.isFollowing ? 1 : -1));
            const patched = patchPageFollowState(pageId);
            if (shouldPatchPageComposeBlock(pageId)) patchPageComposeBlock(pageId);
            const revertFollowState = () => {
                page.isFollowing = previousFollowing;
                page.followerCount = Math.max(0, Number(page.followerCount || 0) + (previousFollowing ? 1 : -1));
                patchPageFollowState(pageId);
                if (shouldPatchPageComposeBlock(pageId)) patchPageComposeBlock(pageId);
            };
            togglePortalSocialFollow('page', pageId, { skipBootstrap: true })
                .then(() => {
                    patchPageFollowState(pageId);
                    if (shouldPatchPageComposeBlock(pageId)) patchPageComposeBlock(pageId);
                    patchSocialFlash();
                    if (!patched) {
                    invalidateSocialRenderCache({ center: true });
                    renderSocialPageNow('page-follow');
                }
                })
                .catch((error) => {
                    revertFollowState();
                    patchSocialFlash();
                    console.error('[Social] Action failed:', error);
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Action failed.', 'danger', { skipRender: true });
                    if (!patched) {
                        invalidateSocialRenderCache({ center: true });
                        renderSocialPageNow('page-follow');
                    }
                });
            return;
        }

        if (action === 'page-about-more') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = getSocialPageRecord(pageId);
            if (!page) return;
            return openDialog('page-about', { pageId, page });
        }

        if (action === 'page-report') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = getSocialPageRecord(pageId);
            const ownerId = text(page?.ownerUserId || (Array.isArray(page?.adminIds) ? page.adminIds[0] : Array.isArray(page?.adminUserIds) ? page.adminUserIds[0] : ''));
            reportPortalSocialContent('page', pageId, 'Reported page content', ownerId)
                .then(() => {
                    if (!patchSocialFlash()) renderSocialPageNow('page-report');
                })
                .catch((error) => {
                    console.error('[Social] Action failed:', error);
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Action failed.', 'danger');
                    if (!patchSocialFlash()) renderSocialPageNow('page-report');
                });
            return;
        }

        if (action === 'page-create-open') {
            state().ui.activePageProfileId = '';
            state().ui.pageProfileEditMode = false;
            state().ui.pageWizardStep = Number(state().ui?.pageWizardStep || 1) || 1;
            setPanel('pages');
            return openDialog('page-create');
        }

        if (action === 'page-wizard-next') {
            state().ui.pageWizardStep = Math.min(5, Math.max(1, Number(state().ui?.pageWizardStep || 1) + 1));
            return renderSocialPageNow('page-wizard-next');
        }

        if (action === 'page-wizard-prev') {
            state().ui.pageWizardStep = Math.min(5, Math.max(1, Number(state().ui?.pageWizardStep || 1) - 1));
            return renderSocialPageNow('page-wizard-prev');
        }

        if (action === 'page-open-profile') {
            return withBusy(async () => {
                const pageId = text(trigger.getAttribute('data-page-id'));
                const page = (Array.isArray(state().social?.pages) ? state().social.pages : []).find((item) => text(item.id) === pageId);
                state().ui.pageWizardOpen = false;
                state().ui.pageProfileEditMode = false;
                state().ui.activePageProfileId = pageId;
                state().ui.pageProfileTab = 'all';
                state().ui.feedScopeType = 'page';
                state().ui.feedScopeId = pageId;
                state().ui.pagePostType = page?.isManager ? 'official' : 'community';
                if (typeof refreshPortalSocialFeed === 'function') await refreshPortalSocialFeed(true);
                setPanel('pages');
                renderSocialPageNow('page-open-profile');
            });
        }

        if (action === 'page-profile-back') {
            state().ui.activePageProfileId = '';
            state().ui.pageProfileEditMode = false;
            state().ui.pageWizardOpen = false;
            return renderSocialPageNow('page-profile-back');
        }

        if (action === 'page-profile-tab') {
            state().ui.pageProfileTab = text(trigger.getAttribute('data-page-profile-tab') || 'all') || 'all';
            return renderSocialPageNow('page-profile-tab');
        }

        if (action === 'page-profile-edit-toggle') {
            const pageId = text(trigger.getAttribute('data-page-id'));
            const page = (Array.isArray(state().social?.pages) ? state().social.pages : []).find((item) => text(item.id) === pageId);
            if (!page) return;
            state().ui.pageProfileEditMode = true;
            state().ui.pageName = text(page.name || '');
            state().ui.pageDescription = text(page.description || '');
            state().ui.pageVisibility = text(page.visibility || 'public') || 'public';
            state().ui.pageType = text(page.pageType || (page.official ? 'campus' : 'brand')) || 'brand';
            state().ui.pageCategory = text(page.category || 'Technology') || 'Technology';
            state().ui.pageTagline = text(page.tagline || '');
            state().ui.pageAbout = text(page.about || '');
            state().ui.pageWebsite = text(page.website || '');
            state().ui.pageContactEmail = text(page.contactEmail || '');
            state().ui.pageLocation = text(page.location || '');
            state().ui.pageActionLabel = text(page.actionLabel || '');
            state().ui.pageActionUrl = text(page.actionUrl || '');
            state().ui.pageAvatarUrl = text(page.avatarImage || '');
            state().ui.pageCoverUrl = text(page.coverImage || '');
            return renderSocialPageNow('page-profile-edit-toggle');
        }

        if (action === 'page-profile-edit-cancel') {
            state().ui.pageProfileEditMode = false;
            return renderSocialPageNow('page-profile-edit-cancel');
        }

        if (action === 'page-visibility-set') {
            return withBusy(() => updatePortalSocialPage(trigger.getAttribute('data-page-id'), {
                visibility: text(trigger.getAttribute('data-visibility') || 'public') || 'public'
            }));
        }
        return false;
    }

    window.handleSocialPagesClick = handleSocialPagesClick;
    window.isSocialPagesClickAction = isSocialPagesClickAction;

    function isSocialPagesSubmitForm(formType) {
        const f = text(formType || '');
        return f === 'create-page' || f === 'pages-search' || f === 'update-page-profile' || f === 'page-profile-post';
    }

    function handleSocialPagesSubmit(formType, form, runtime, event) {
        if (!isSocialPagesSubmitForm(formType)) return false;
        if (formType === 'create-page') {
            return withBusy(async () => {
                const avatarImage = text(form.pageAvatarUrl?.value || runtime.ui?.pageAvatarUrl || '') || await readFileAsDataUrl(runtime.ui?.pageAvatarFile || null);
                const coverImage = text(form.pageCoverUrl?.value || runtime.ui?.pageCoverUrl || '') || await readFileAsDataUrl(runtime.ui?.pageCoverFile || null);
                const pageType = text(form.pageType?.value || runtime.ui?.pageType || 'brand') || 'brand';
                const payload = {
                    name: text(form.pageName?.value || runtime.ui?.pageName),
                    description: text(form.pageDescription?.value || runtime.ui?.pageDescription),
                    visibility: text(form.pageVisibility?.value || runtime.ui?.pageVisibility || 'public') || 'public',
                    pageType,
                    category: text(form.pageCategory?.value || runtime.ui?.pageCategory || 'Technology') || 'Technology',
                    tagline: text(form.pageTagline?.value || runtime.ui?.pageTagline || ''),
                    about: text(form.pageAbout?.value || runtime.ui?.pageAbout || runtime.ui?.pageDescription || ''),
                    website: text(form.pageWebsite?.value || runtime.ui?.pageWebsite || ''),
                    contactEmail: text(form.pageContactEmail?.value || runtime.ui?.pageContactEmail || ''),
                    location: text(form.pageLocation?.value || runtime.ui?.pageLocation || ''),
                    actionLabel: text(form.pageActionLabel?.value || runtime.ui?.pageActionLabel || ''),
                    actionUrl: text(form.pageActionUrl?.value || runtime.ui?.pageActionUrl || ''),
                    avatarImage,
                    coverImage,
                    official: pageType === 'campus',
                    verified: pageType === 'campus'
                };
                if (!payload.name) throw new Error('Page name is required.');
                if (!payload.category) throw new Error('Page category is required.');
                if (!payload.description && !payload.about) throw new Error('Add a description or about section for the page.');
                const createdPage = await createPortalSocialPage(payload);
                runtime.ui.pageName = '';
                runtime.ui.pageDescription = '';
                runtime.ui.pageVisibility = 'public';
                runtime.ui.pageType = 'brand';
                runtime.ui.pageCategory = 'Technology';
                runtime.ui.pageTagline = '';
                runtime.ui.pageAbout = '';
                runtime.ui.pageWebsite = '';
                runtime.ui.pageContactEmail = '';
                runtime.ui.pageLocation = '';
                runtime.ui.pageActionLabel = '';
                runtime.ui.pageActionUrl = '';
                runtime.ui.pageAvatarUrl = '';
                runtime.ui.pageCoverUrl = '';
                runtime.ui.pageAvatarFile = null;
                runtime.ui.pageCoverFile = null;
                runtime.ui.pageWizardStep = 1;
                closeDialog();
                runtime.ui.activePageProfileId = text(createdPage?.id || '');
                runtime.ui.pageProfileTab = 'all';
                runtime.ui.feedScopeType = 'page';
                runtime.ui.feedScopeId = text(createdPage?.id || '');
                runtime.ui.pagePostType = createdPage?.isManager ? 'official' : 'community';
                if (typeof refreshPortalSocialFeed === 'function' && createdPage?.id) await refreshPortalSocialFeed(true);
                renderSocialPageNow('page-created');
            });
        }

        if (formType === 'pages-search') {
            runtime.ui.pagesSearch = text(form.pagesSearch?.value || runtime.ui?.pagesSearch || '');
            renderSocialPageNow('pages-search');
            return;
        }

        if (formType === 'update-page-profile') {
            return withBusy(async () => {
                const pageId = text(form.getAttribute('data-page-id'));
                const pageType = text(form.pageType?.value || runtime.ui?.pageType || 'brand') || 'brand';
                const avatarImage = text(form.pageAvatarUrl?.value || runtime.ui?.pageAvatarUrl || '') || await readFileAsDataUrl(runtime.ui?.pageAvatarFile || null);
                const coverImage = text(form.pageCoverUrl?.value || runtime.ui?.pageCoverUrl || '') || await readFileAsDataUrl(runtime.ui?.pageCoverFile || null);
                const payload = {
                    name: text(form.pageName?.value || runtime.ui?.pageName || ''),
                    description: text(form.pageDescription?.value || runtime.ui?.pageDescription || ''),
                    visibility: text(form.pageVisibility?.value || runtime.ui?.pageVisibility || 'public') || 'public',
                    pageType,
                    category: text(form.pageCategory?.value || runtime.ui?.pageCategory || ''),
                    tagline: text(form.pageTagline?.value || runtime.ui?.pageTagline || ''),
                    about: text(form.pageAbout?.value || runtime.ui?.pageAbout || ''),
                    website: text(form.pageWebsite?.value || runtime.ui?.pageWebsite || ''),
                    contactEmail: text(form.pageContactEmail?.value || runtime.ui?.pageContactEmail || ''),
                    location: text(form.pageLocation?.value || runtime.ui?.pageLocation || ''),
                    actionLabel: text(form.pageActionLabel?.value || runtime.ui?.pageActionLabel || ''),
                    actionUrl: text(form.pageActionUrl?.value || runtime.ui?.pageActionUrl || ''),
                    avatarImage,
                    coverImage,
                    official: pageType === 'campus',
                    verified: pageType === 'campus'
                };
                await updatePortalSocialPage(pageId, payload);
                runtime.ui.pageProfileEditMode = false;
                runtime.ui.pageAvatarFile = null;
                runtime.ui.pageCoverFile = null;
                renderSocialPageNow('page-profile-updated');
            });
        }

        if (formType === 'page-profile-post') {
            return withBusy(async () => {
                const pageId = text(form.getAttribute('data-page-id'));
                const page = (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).find((item) => text(item.id) === pageId);
                const body = text(form.pagePostBody?.value || runtime.ui?.pagePostBody || '');
                const file = runtime.ui?.pagePostFile || null;
                if (!body && !file) throw new Error('Write a post or attach a file first.');
                if (typeof submitSocialPost !== 'function') throw new Error('Page post publishing is unavailable.');
                await submitSocialPost(body, {
                    audience: 'page',
                    scopeType: 'page',
                    scopeId: pageId,
                    scopeName: text(page?.name || 'Page'),
                    file,
                    postType: text(form.pagePostType?.value || runtime.ui?.pagePostType || (page?.isManager ? 'official' : 'community')) || 'community'
                });
                runtime.ui.pagePostBody = '';
                runtime.ui.pagePostFile = null;
                closeDialog();
                if (typeof refreshPortalSocialFeed === 'function') await refreshPortalSocialFeed(true);
                renderSocialPageNow('page-profile-post');
            });
        }
        return false;
    }

    window.handleSocialPagesSubmit = handleSocialPagesSubmit;
    window.isSocialPagesSubmitForm = isSocialPagesSubmitForm;

    function isSocialPagesInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="pages-search"], [data-bind="page-members-search"]')) return true;
        if (target.closest && target.closest('form[data-form="create-page"], form[data-form="update-page-profile"], form[data-form="page-profile-post"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialPagesInput(target, runtime, event) {
        if (!isSocialPagesInputTarget(target)) return false;
        if (target.matches('[data-bind="pages-search"]')) {
            runtime.ui.pagesSearch = target.value;
            renderSocialPageNow('pages-search');
        }
        if (target.matches('[data-bind="page-members-search"]')) {
            runtime.ui.pageMembersSearch = target.value;
            if (text(activeDialog()?.type || '') === 'page-members') {
                queuePageMembersSearchRefresh();
                return;
            }
        }
        if (target.matches('form[data-form="create-page"] [name="pageName"]')) runtime.ui.pageName = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageDescription"]')) runtime.ui.pageDescription = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageCategory"]')) runtime.ui.pageCategory = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageType"]')) runtime.ui.pageType = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageTagline"]')) runtime.ui.pageTagline = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageAbout"]')) runtime.ui.pageAbout = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageWebsite"]')) runtime.ui.pageWebsite = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageContactEmail"]')) runtime.ui.pageContactEmail = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageLocation"]')) runtime.ui.pageLocation = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageActionLabel"]')) runtime.ui.pageActionLabel = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageActionUrl"]')) runtime.ui.pageActionUrl = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageAvatarUrl"]')) runtime.ui.pageAvatarUrl = target.value;
        if (target.matches('form[data-form="create-page"] [name="pageCoverUrl"]')) runtime.ui.pageCoverUrl = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageName"]')) runtime.ui.pageName = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageDescription"]')) runtime.ui.pageDescription = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageCategory"]')) runtime.ui.pageCategory = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageType"]')) runtime.ui.pageType = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageTagline"]')) runtime.ui.pageTagline = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageAbout"]')) runtime.ui.pageAbout = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageWebsite"]')) runtime.ui.pageWebsite = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageContactEmail"]')) runtime.ui.pageContactEmail = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageLocation"]')) runtime.ui.pageLocation = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageActionLabel"]')) runtime.ui.pageActionLabel = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageActionUrl"]')) runtime.ui.pageActionUrl = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageAvatarUrl"]')) runtime.ui.pageAvatarUrl = target.value;
        if (target.matches('form[data-form="update-page-profile"] [name="pageCoverUrl"]')) runtime.ui.pageCoverUrl = target.value;
        if (target.matches('form[data-form="page-profile-post"] [name="pagePostBody"]')) runtime.ui.pagePostBody = target.value;

        return true;
    }

    function isSocialPagesChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.closest && target.closest('form[data-form="create-page"], form[data-form="update-page-profile"], form[data-form="page-profile-post"]')) return true;
        if (target.name === 'pagePostFile' || target.name === 'pageAvatarFile' || target.name === 'pageCoverFile') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialPagesChange(target, runtime, event) {
        if (!isSocialPagesChangeTarget(target)) return false;
        if (target.matches('form[data-form="create-page"] [name="pageVisibility"]')) runtime.ui.pageVisibility = text(target.value || 'public') || 'public';
        if (target.matches('form[data-form="create-page"] [name="pageType"]')) runtime.ui.pageType = text(target.value || 'brand') || 'brand';
        if (target.matches('form[data-form="update-page-profile"] [name="pageVisibility"]')) runtime.ui.pageVisibility = text(target.value || 'public') || 'public';
        if (target.matches('form[data-form="update-page-profile"] [name="pageType"]')) runtime.ui.pageType = text(target.value || 'brand') || 'brand';
        if (target.matches('form[data-form="page-profile-post"] [name="pagePostType"]')) {
            runtime.ui.pagePostType = text(target.value || 'official') || 'official';
            renderSocialPageNow('page-post-type');
            return;
        }
        if (target.name === 'pagePostFile') {
            runtime.ui.pagePostFile = target.files?.[0] || null;
            renderSocialPageNow('page-post-file');
            return;
        }
        if (target.name === 'pageAvatarFile') {
            runtime.ui.pageAvatarFile = target.files?.[0] || null;
            renderSocialPageNow('page-avatar-file');
            return;
        }
        if (target.name === 'pageCoverFile') {
            runtime.ui.pageCoverFile = target.files?.[0] || null;
            renderSocialPageNow('page-cover-file');
            return;
        }

        return true;
    }

    window.handleSocialPagesInput = handleSocialPagesInput;
    window.isSocialPagesInputTarget = isSocialPagesInputTarget;
    window.handleSocialPagesChange = handleSocialPagesChange;
    window.isSocialPagesChangeTarget = isSocialPagesChangeTarget;

})();
