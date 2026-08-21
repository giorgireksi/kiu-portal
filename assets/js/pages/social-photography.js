(function initSocialPhotographyModule() {
    if (window.__KIU_SOCIAL_PHOTOGRAPHY_MODULE_LOADED
        && typeof window.handleSocialPhotographyClick === 'function'
        && typeof window.renderPhotographyPanel === 'function') {
        return;
    }

    const hooks = window.__kiuSocialPhotographyHooks || {};
    const {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        when,
        avatar,
        displayName,
        accountById,
        accountSubtitle,
        currentFacultyCode,
        photographyPosts,
        relationshipBuckets,
        fileUrl,
        isImage,
        renderCommentNode,
        renderCommentThread,
        renderPostReactionMetrics,
        reactionEmoji,
        reactionLabel,
        postKey,
        isPostSaved,
        controlId,
        setPanel,
        openDialog,
        closeDialog,
        renderSocialPageNow,
        withBusy,
        activeDialog,
        root,
        openPhotographyUploadFilePicker,
        patchPhotographyFollowButtons,
        photographyUploadForm,
        reactToPortalSocialPost,
        refreshPhotographyPanelStage,
        renderPhotographyUploadDialogNow,
        revokePhotographyUploadPreview,
        togglePortalSocialFollow,
        submitSocialPost,
        applyPhotographyUploadFile
    } = hooks;

    function resolvePhotographyHook(name) {
        const bag = window.__kiuSocialPhotographyHooks || {};
        if (typeof bag[name] === 'function') return bag[name];
        if (typeof window[name] === 'function') return window[name];
        return null;
    }

    async function resolvePhotographyUploadFile(draft = {}) {
        if (draft?.file) return draft.file;
        const previewUrl = text(draft.previewObjectUrl || draft.previewUrl || '');
        if (!previewUrl.startsWith('blob:')) return null;
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        const name = text(draft.fileName || 'photo.jpg') || 'photo.jpg';
        const type = text(blob.type || 'image/jpeg') || 'image/jpeg';
        return new File([blob], name, { type });
    }

    if (
        typeof state !== 'function'
        || typeof photographyPosts !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof closeDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof activeDialog !== 'function'
        || typeof root !== 'function'
        || typeof openPhotographyUploadFilePicker !== 'function'
        || typeof patchPhotographyFollowButtons !== 'function'
        || typeof photographyUploadForm !== 'function'
        || typeof reactToPortalSocialPost !== 'function'
        || typeof refreshPhotographyPanelStage !== 'function'
        || typeof renderPhotographyUploadDialogNow !== 'function'
        || typeof revokePhotographyUploadPreview !== 'function'
        || typeof togglePortalSocialFollow !== 'function'
        || typeof applyPhotographyUploadFile !== 'function'
    ) {
        throw new Error('Social photography hooks are unavailable.');
    }

    window.__KIU_SOCIAL_PHOTOGRAPHY_MODULE_LOADED = true;

    function profileFollowerCount() {
        const userId = currentUserId();
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        return relationships.filter((rel) => (
            text(rel?.type).toLowerCase() === 'follow'
            && text(rel?.toType) === 'profile'
            && text(rel?.toId) === userId
        )).length;
    }

    function normalizePhotoTab(raw) {
        const tab = text(raw || 'explore') || 'explore';
        if (tab === 'grid') return 'grid';
        if (tab === 'following') return 'following';
        if (tab === 'pinned') return 'pinned';
        return 'explore';
    }

    function photoPinModel() {
        return window.KiuSocialPinModel || null;
    }

    function renderPhotoPinActions(post) {
        const pinModel = photoPinModel();
        if (!pinModel) return '';
        const postId = typeof postKey === 'function' ? postKey(post) : text(post.id);
        return pinModel.renderModulePinActions('photo', postId, {
            canCuratorPin: pinModel.viewerCanCuratorPin('photo', post),
            showPersonal: false
        });
    }

    function photoTab() {
        return normalizePhotoTab(state().ui?.photographyTab);
    }

    function photoSearch() {
        return text(state().ui?.photographySearch || '').toLowerCase();
    }

    const GRID_THUMB_MAX_PX = 480;
    const photoGridThumbCache = new Map();
    let photoGridHydrateObserver = null;
    let photoGridHydrateQueue = [];
    let photoGridHydrateFrame = 0;

    async function createPhotographyGridThumbUrl(fullSrc) {
        const normalizedSrc = text(fullSrc || '');
        if (!normalizedSrc) return '';
        const cached = photoGridThumbCache.get(normalizedSrc);
        if (cached) return cached instanceof Promise ? cached : cached;

        const pending = (async () => {
            try {
                if (typeof createImageBitmap !== 'function' || typeof fetch !== 'function') {
                    return normalizedSrc;
                }
                const response = await fetch(normalizedSrc);
                if (!response.ok) throw new Error('thumb fetch failed');
                const blob = await response.blob();
                const bitmap = await createImageBitmap(blob, {
                    resizeWidth: GRID_THUMB_MAX_PX,
                    resizeHeight: GRID_THUMB_MAX_PX,
                    resizeQuality: 'medium'
                });
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d', { alpha: false });
                if (!ctx) {
                    bitmap.close?.();
                    return normalizedSrc;
                }
                ctx.drawImage(bitmap, 0, 0);
                bitmap.close?.();
                const thumbBlob = await new Promise((resolve) => {
                    canvas.toBlob(resolve, 'image/jpeg', 0.84);
                });
                if (!thumbBlob) return normalizedSrc;
                return URL.createObjectURL(thumbBlob);
            } catch (error) {
                return normalizedSrc;
            }
        })();

        photoGridThumbCache.set(normalizedSrc, pending);
        const resolved = await pending;
        photoGridThumbCache.set(normalizedSrc, resolved);
        return resolved;
    }

    function schedulePhotographyGridHydrationTick() {
        if (photoGridHydrateFrame) return;
        photoGridHydrateFrame = requestAnimationFrame(() => {
            photoGridHydrateFrame = 0;
            const batch = photoGridHydrateQueue.splice(0, 1);
            batch.forEach((img) => {
                void hydratePhotographyGridImage(img);
            });
            if (photoGridHydrateQueue.length) schedulePhotographyGridHydrationTick();
        });
    }

    async function hydratePhotographyGridImage(img) {
        if (!(img instanceof HTMLImageElement) || img.dataset.photoHydrated === '1') return;
        const fullSrc = text(img.getAttribute('data-photo-src') || '');
        if (!fullSrc) return;
        img.dataset.photoHydrated = '1';
        const thumbSrc = await createPhotographyGridThumbUrl(fullSrc);
        if (!img.isConnected) return;
        img.src = thumbSrc || fullSrc;
        img.removeAttribute('data-photo-src');
    }

    function ensurePhotographyGridHydrator() {
        if (photoGridHydrateObserver) return photoGridHydrateObserver;
        photoGridHydrateObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                if (!(img instanceof HTMLImageElement)) return;
                photoGridHydrateObserver.unobserve(img);
                photoGridHydrateQueue.push(img);
            });
            if (photoGridHydrateQueue.length) schedulePhotographyGridHydrationTick();
        }, { rootMargin: '240px 0px', threshold: 0.01 });
        return photoGridHydrateObserver;
    }

    function bindPhotographyGridImages(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const observer = ensurePhotographyGridHydrator();
        scope.querySelectorAll('.social-photo-grid-tile-img[data-photo-src]:not([data-photo-hydrated="1"])').forEach((img) => {
            observer.observe(img);
        });
    }

    window.bindPhotographyGridImages = bindPhotographyGridImages;

    function showPhotographyGridSkeleton() {
        const stage = document.querySelector('.social-photo-shell .social-photo-content-stage');
        if (!stage) return;
        stage.classList.add('is-loading');
        stage.innerHTML = renderGridSkeleton();
    }

    function postImage(post) {
        const media = (Array.isArray(post?.media) ? post.media : []).find((item) => isImage(item));
        return media || null;
    }

    function postImageSrc(post) {
        const media = postImage(post);
        return media ? fileUrl(media) : '';
    }

    function canRemovePhotographyPost(post) {
        return text(post?.authorUserId) === currentUserId();
    }

    function renderPhotographyOwnerHeadActions(postId) {
        const normalizedPostId = text(postId);
        if (!normalizedPostId) return '';
        return `
            <div class="social-photo-feed-head-actions">
                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="photography-edit-open" data-post-id="${escape(normalizedPostId)}" aria-label="Edit photo" title="Edit photo">
                    <i class="fas fa-pen" aria-hidden="true"></i> Edit
                </button>
                <button class="lux-secondary-btn lux-btn-danger lux-secondary-btn-sm" type="button" data-action="photography-delete-open" data-post-id="${escape(normalizedPostId)}" aria-label="Remove photo" title="Remove photo">
                    <i class="fas fa-trash" aria-hidden="true"></i> Remove
                </button>
            </div>
        `;
    }

    function resolvePhotographyUploadFacultyCode(runtime, form = null) {
        const chrome = window.KiuSocialChromeModel || {};
        const draft = runtime?.ui?.photographyUploadDraft || {};
        const raw = text(draft.facultyCode || form?.photographyFaculty?.value || '')
            || (typeof chrome.socialDefaultCreateFaculty === 'function' ? chrome.socialDefaultCreateFaculty(runtime) : '')
            || (typeof currentFacultyCode === 'function' ? currentFacultyCode() : '');
        if (typeof chrome.socialNormalizeCreateFacultyCode === 'function') {
            return chrome.socialNormalizeCreateFacultyCode(raw, runtime);
        }
        const normalized = typeof chrome.normalizeSocialFacultyCode === 'function'
            ? chrome.normalizeSocialFacultyCode(raw, '')
            : text(raw).toUpperCase();
        return normalized || 'all';
    }

    function isFollowingProfile(userId) {
        const { follows } = relationshipBuckets();
        return follows.some((rel) => text(rel.toType) === 'profile' && text(rel.toId) === text(userId));
    }

    function filterPosts(posts) {
        const query = photoSearch();
        const tab = photoTab();
        const { follows } = relationshipBuckets();
        const followedIds = new Set(
            follows
                .filter((rel) => text(rel.toType) === 'profile')
                .map((rel) => text(rel.toId))
        );
        const chrome = window.KiuSocialChromeModel || {};
        const browseFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
            ? chrome.socialBrowseFacultyValue(state())
            : (text(state()?.ui?.socialBrowseFaculty || 'all') || 'all');
        const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
            ? chrome.socialMatchesBrowseFaculty
            : () => true;

        let items = posts.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (tab === 'pinned') {
            const pinModel = photoPinModel();
            if (!pinModel) return [];
            items = pinModel.partitionPinnedTab('photo', items).all;
            if (query) {
                items = items.filter((post) => {
                    const author = accountById(post.authorUserId);
                    const blob = `${text(post.body)} ${displayName(author)} ${text(post.photoMeta?.location)}`.toLowerCase();
                    return blob.includes(query);
                });
            }
            return items;
        }

        if (browseFaculty && browseFaculty !== 'all') {
            items = items.filter((post) => matchesBrowse(post, browseFaculty));
        }

        if (tab === 'following') {
            items = items.filter((post) => followedIds.has(text(post.authorUserId)));
        }

        if (query) {
            items = items.filter((post) => {
                const author = accountById(post.authorUserId);
                const blob = `${text(post.body)} ${displayName(author)} ${text(post.photoMeta?.location)}`.toLowerCase();
                return blob.includes(query);
            });
        }

        const pinModel = photoPinModel();
        if (pinModel) {
            items = pinModel.sortWithCuratorPins('photo', items, (post) => (typeof postKey === 'function' ? postKey(post) : text(post.id)));
        }

        return items;
    }

    function discoverPhotographers(allPosts) {
        const counts = new Map();
        allPosts.forEach((post) => {
            const id = text(post.authorUserId);
            if (!id) return;
            counts.set(id, (counts.get(id) || 0) + 1);
        });

        const directory = Array.isArray(state().social?.directory) ? state().social.directory : [];
        const seen = new Set();
        const people = [];

        directory.forEach((entry) => {
            const id = text(entry?.id);
            if (!id || id === currentUserId() || !counts.has(id) || seen.has(id)) return;
            seen.add(id);
            people.push({ account: entry, postCount: counts.get(id) || 0, suggested: false });
        });

        counts.forEach((postCount, id) => {
            if (seen.has(id) || id === currentUserId()) return;
            const account = accountById(id);
            if (!account) return;
            people.push({ account, postCount, suggested: false });
        });

        if (people.length) {
            return people
                .sort((a, b) => {
                    const aFollowed = isFollowingProfile(a.account.id) ? 1 : 0;
                    const bFollowed = isFollowingProfile(b.account.id) ? 1 : 0;
                    if (aFollowed !== bFollowed) return aFollowed - bFollowed;
                    return b.postCount - a.postCount;
                })
                .slice(0, 12);
        }

        return directory
            .filter((entry) => {
                const id = text(entry?.id);
                return id && id !== currentUserId();
            })
            .slice(0, 8)
            .map((account) => ({ account, postCount: 0, suggested: true }));
    }

    function renderDiscoverStrip(people) {
        if (!people.length) return '';
        const suggested = people.every((person) => person.suggested);
        return `
            <section class="social-photo-discover-strip">
                ${suggested ? '<p class="social-photo-discover-label social-photo-mono">Campus photographers to follow</p>' : ''}
                <div class="social-photo-discover-track">
                    ${people.map(({ account, postCount, suggested: isSuggested }) => `
                        <article class="social-photo-discover-card">
                            <button class="social-photo-discover-profile" type="button" data-action="photography-view-profile" data-user-id="${escape(text(account.id))}">
                                ${avatar(account, 'social-photo-discover-avatar')}
                                <span class="social-photo-discover-name">${escape(displayName(account))}</span>
                                <span class="social-photo-mono">${isSuggested ? 'New' : `${escape(postCount)} photo${postCount === 1 ? '' : 's'}`}</span>
                            </button>
                            ${text(account.id) !== currentUserId() ? `
                                <button class="${isFollowingProfile(account.id) ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="photography-follow" data-user-id="${escape(text(account.id))}">
                                    ${isFollowingProfile(account.id) ? 'Following' : 'Follow'}
                                </button>
                            ` : ''}
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderGridSkeleton() {
        return `
            <div class="social-photo-grid-skeleton" aria-hidden="true">
                ${Array.from({ length: 9 }, (_, index) => `<span class="social-photo-grid-skeleton-tile" style="--photo-skeleton-i:${index}"></span>`).join('')}
            </div>
        `;
    }

    function renderPhotoFeedCard(post) {
        const author = accountById(post.authorUserId) || { id: post.authorUserId, displayName: post.authorUserId };
        const src = postImageSrc(post);
        const normalizedPostId = typeof postKey === 'function' ? postKey(post) : text(post.id);
        const viewerReaction = text(post.viewerReaction || '');
        const hasViewerReaction = Boolean(viewerReaction);
        const reactionCounts = post?.reactionCounts || {};
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const commentTotal = comments.length + Number(post.replyCount || 0);
        const shareCount = Number(post?.shareCount || 0);
        const saved = typeof isPostSaved === 'function' ? isPostSaved(post.id) : false;
        const caption = text(post.body || '');
        const authorHandle = escape(displayName(author));
        const canRemove = canRemovePhotographyPost(post);
        const reactionPicker = ['like', 'love', 'laugh', 'wow', 'support'].map((reactionType) => `
            <button class="lux-secondary-btn lux-secondary-btn-sm social-neo-post-reaction-btn ${viewerReaction === reactionType ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="post-react" data-post-id="${escape(normalizedPostId)}" data-reaction-type="${escape(reactionType)}" title="${escape(reactionType)}" aria-label="${escape(reactionType)}">
                <span>${typeof reactionEmoji === 'function' ? reactionEmoji(reactionType) : reactionType}</span>
            </button>
        `).join('');

        return `
            <article class="social-neo-card social-neo-post-card social-photo-feed-card home-hover-chip">
                <div class="social-neo-post-head social-photo-feed-head">
                    <button class="social-neo-post-author social-neo-clickable" type="button" data-action="photography-view-profile" data-user-id="${escape(text(author.id))}">
                        ${avatar(author)}
                        <div class="social-neo-post-author-copy">
                            <strong class="social-neo-post-author-name">${authorHandle}</strong>
                            <span class="social-neo-post-author-meta">${escape(when(post.createdAt))}</span>
                        </div>
                    </button>
                    ${text(author.id) !== currentUserId() ? `
                        <button class="${isFollowingProfile(author.id) ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="photography-follow" data-user-id="${escape(text(author.id))}">
                            ${isFollowingProfile(author.id) ? 'Following' : 'Follow'}
                        </button>
                    ` : canRemove ? renderPhotographyOwnerHeadActions(normalizedPostId) : ''}
                </div>
                ${src ? `
                    <button class="social-photo-feed-media" type="button" data-action="photography-open-comments" data-post-id="${escape(normalizedPostId)}" aria-label="View photo and comments">
                        <img src="${escape(src)}" alt="${escape(caption || 'Campus photo')}" loading="lazy">
                    </button>
                ` : ''}
                ${caption ? `
                    <div class="social-photo-feed-editorial">
                        <p class="social-photo-feed-caption">${escape(caption)}</p>
                    </div>
                ` : ''}
                <div class="social-neo-inline-metrics social-neo-post-metrics social-photo-feed-metrics">
                    ${typeof renderPostReactionMetrics === 'function' ? renderPostReactionMetrics(reactionCounts) : ''}
                    ${commentTotal ? `<span class="social-neo-post-metric">${escape(commentTotal)} repl${commentTotal === 1 ? 'y' : 'ies'}</span>` : ''}
                    ${shareCount > 0 ? `<span class="social-neo-post-metric">${escape(shareCount)} share${shareCount !== 1 ? 's' : ''}</span>` : ''}
                </div>
                <div class="social-neo-post-actions social-neo-post-action-row social-photo-feed-actions" role="toolbar" aria-label="Photo actions">
                    <button class="lux-secondary-btn social-neo-post-action-btn ${hasViewerReaction ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="post-react" data-post-id="${escape(normalizedPostId)}" data-reaction-type="${escape(viewerReaction || 'like')}">
                        ${hasViewerReaction && typeof reactionEmoji === 'function' && typeof reactionLabel === 'function'
                            ? `<span>${reactionEmoji(viewerReaction)}</span> ${escape(reactionLabel(viewerReaction))}`
                            : '<span aria-hidden="true">👍</span> Appreciate'}
                    </button>
                    <button class="lux-secondary-btn social-neo-post-action-btn" type="button" data-action="photography-open-comments" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-comment"></i> Comment${commentTotal ? ` (${escape(commentTotal)})` : ''}
                    </button>
                    <button class="lux-secondary-btn social-neo-post-action-btn" type="button" data-action="post-share" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <div class="social-neo-reaction-picker social-photo-feed-reactions" aria-label="Quick reactions">
                        ${reactionPicker}
                    </div>
                    <span class="social-neo-flex-spacer"></span>
                    ${renderPhotoPinActions(post)}
                    <button class="lux-secondary-btn social-neo-post-save-btn ${saved ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="post-save" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-bookmark"></i> ${saved ? 'Saved' : 'Keep'}
                    </button>
                </div>
            </article>
        `;
    }

    function postImageGridSrc(post) {
        return postImageSrc(post);
    }

    function renderPhotoExploreTile(post, index = 0) {
        const src = postImageGridSrc(post);
        if (!src) return '';
        const normalizedPostId = typeof postKey === 'function' ? postKey(post) : text(post.id);
        const author = accountById(post.authorUserId) || { id: post.authorUserId, displayName: post.authorUserId };
        const reactionCounts = post?.reactionCounts || {};
        const likeTotal = Object.values(reactionCounts).reduce((sum, value) => sum + Number(value || 0), 0);

        const caption = text(post.body || 'Campus photo');
        const canRemove = canRemovePhotographyPost(post);
        const fetchPriority = index < 8 ? 'auto' : 'low';
        return `
            <div class="social-photo-grid-tile home-hover-chip">
                <button class="social-photo-grid-tile-open" type="button" data-action="photography-open-comments" data-post-id="${escape(normalizedPostId)}" aria-label="View photo by ${escape(displayName(author))}${caption ? `: ${escape(caption)}` : ''}">
                    <img class="social-photo-grid-tile-img" data-photo-src="${escape(src)}" alt="" loading="lazy" decoding="async" fetchpriority="${fetchPriority}" sizes="(max-width: 720px) 33vw, 240px" onerror="this.hidden=true;this.closest('.social-photo-grid-tile')?.classList.add('is-broken')">
                    <span class="social-photo-grid-tile-fallback" aria-hidden="true"><i class="fas fa-image"></i></span>
                    <span class="social-photo-grid-tile-overlay">
                        <span class="social-photo-grid-tile-author">${escape(displayName(author))}</span>
                        ${likeTotal ? `<span class="social-photo-grid-tile-likes social-photo-mono">${escape(likeTotal)} appreciations</span>` : ''}
                    </span>
                </button>
                ${canRemove ? `
                    <div class="social-photo-grid-tile-actions">
                        <button class="lux-secondary-btn lux-secondary-btn-sm social-photo-grid-tile-edit" type="button" data-action="photography-edit-open" data-post-id="${escape(normalizedPostId)}" aria-label="Edit photo" title="Edit photo">
                            <i class="fas fa-pen" aria-hidden="true"></i>
                        </button>
                        <button class="lux-secondary-btn lux-btn-danger lux-secondary-btn-sm social-photo-grid-tile-remove" type="button" data-action="photography-delete-open" data-post-id="${escape(normalizedPostId)}" aria-label="Remove photo" title="Remove photo">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function renderPhotoExploreGrid(posts) {
        const tiles = posts.map((post, index) => renderPhotoExploreTile(post, index)).filter(Boolean);
        if (!tiles.length) return renderPhotoEmpty('explore');
        return `
            <section class="social-photo-explore-grid" data-lux-transparency-exempt="1" aria-label="Campus photo gallery">
                ${tiles.join('')}
            </section>
        `;
    }

    function renderPhotoFeedList(posts) {
        return `
            <section class="social-photo-feed-list">
                ${posts.map((post) => renderPhotoFeedCard(post)).join('')}
            </section>
        `;
    }

    function renderPhotoEmpty(tab) {
        const emptyCopy = tab === 'following'
            ? { title: 'No photos from people you follow', hint: 'Follow campus photographers above, then their shots will appear here.', cta: '' }
            : tab === 'pinned'
                ? { title: 'No pinned photos yet', hint: 'Highlight campus shots or keep photos you want to revisit.', cta: '' }
            : { title: 'No campus photos yet', hint: 'Share the quad, library, sunset, or any campus moment. Your gallery starts with one photo.', cta: 'Share a photo' };
        return `
            <div class="social-photo-content-stage is-empty">
                <div class="social-neo-empty-hero social-photo-empty">
                    <i class="fas fa-camera-retro"></i>
                    <strong class="social-photo-display">${escape(emptyCopy.title)}</strong>
                    <span>${escape(emptyCopy.hint)}</span>
                    ${emptyCopy.cta ? `<button class="lux-tab-btn lux-tab-btn--icon is-active" type="button" data-action="photography-upload-open">${escape(emptyCopy.cta)}</button>` : ''}
                </div>
            </div>
        `;
    }

    function renderPhotoFeed(posts, tab) {
        if (!posts.length) return renderPhotoEmpty(tab);
        if (tab === 'pinned' && photoPinModel()) {
            const sections = photoPinModel().partitionPinnedTab('photo', posts);
            return `<div class="social-photo-content-stage">${photoPinModel().renderPinnedSections('photo', sections, (post) => renderPhotoFeedCard(post), 'No pinned photos yet.')}</div>`;
        }
        if (tab === 'explore') return `<div class="social-photo-content-stage">${renderPhotoFeedList(posts)}</div>`;
        return `<div class="social-photo-content-stage">${renderPhotoExploreGrid(posts)}</div>`;
    }

    function renderMyProfileTab(posts) {
        const myId = currentUserId();
        const myPosts = posts.filter((post) => text(post.authorUserId) === text(myId));
        if (!myPosts.length) return `
            <div class="social-photo-content-stage is-empty">
                <div class="social-neo-empty-hero social-photo-empty">
                    <i class="fas fa-camera-retro"></i>
                    <strong class="social-photo-display">No photos yet</strong>
                    <span>Share your first campus moment.</span>
                    <button class="lux-tab-btn lux-tab-btn--icon is-active" type="button" data-action="photography-upload-open">Share a photo</button>
                </div>
            </div>
        `;
        return `<div class="social-photo-content-stage">${renderPhotoExploreGrid(myPosts)}</div>`;
    }

    function renderMySavedTab() {
        const savedPosts = Array.isArray(state().social?.savedPosts) ? state().social.savedPosts : [];
        const photoSaved = savedPosts.filter((post) => {
            const media = Array.isArray(post?.media) ? post.media : [];
            return media.some((item) => isImage(item));
        });
        if (!photoSaved.length) return `
            <div class="social-photo-content-stage is-empty">
                <div class="social-neo-empty-hero social-photo-empty">
                    <i class="fas fa-bookmark"></i>
                    <strong class="social-photo-display">No saved photos</strong>
                    <span>Tap the bookmark icon on any photo to save it here.</span>
                </div>
            </div>
        `;
        return `<div class="social-photo-content-stage">${renderPhotoExploreGrid(photoSaved)}</div>`;
    }

    function renderMyTaggedTab() {
        return `
            <div class="social-photo-content-stage is-empty">
                <div class="social-neo-empty-hero social-photo-empty">
                    <i class="fas fa-tags"></i>
                    <strong class="social-photo-display">No tagged photos</strong>
                    <span>Photos you're tagged in will appear here.</span>
                </div>
            </div>
        `;
    }

    function renderMyProfile(allPosts) {
        const user = currentUser();
        const account = user || {};
        const myId = currentUserId();
        const myPosts = allPosts.filter((post) => text(post.authorUserId) === text(myId));
        const savedCount = (Array.isArray(state().social?.savedPosts) ? state().social.savedPosts : [])
            .filter((post) => (Array.isArray(post?.media) ? post.media : []).some((item) => isImage(item))).length;
        const profileTab = text(state().ui?.photographyMyProfileTab || 'posts') || 'posts';

        let content = '';
        if (profileTab === 'saved') content = renderMySavedTab();
        else if (profileTab === 'tagged') content = renderMyTaggedTab();
        else content = renderMyProfileTab(allPosts);

        return `
            <div class="social-photo-shell social-neo-community-panel social-photo-shell--my-profile">
                <button class="lux-ghost-btn social-photo-back social-photo-mono" type="button" data-action="photography-my-profile-close">&larr; Back to Exposé</button>
                <header class="social-neo-card social-photo-my-header social-photo-my-hero">
                    <div class="social-photo-my-head">
                        <span class="social-photo-my-avatar">${avatar(account, 'social-photo-my-avatar-img')}</span>
                        <div class="social-photo-my-info">
                            <h2 class="social-photo-display">${escape(displayName(account))}</h2>
                            <p class="social-photo-mono">${escape(accountSubtitle(account))}</p>
                        </div>
                        <div class="social-photo-my-stats">
                            <article class="social-photo-my-stat">
                                <strong>${myPosts.length}</strong>
                                <span class="social-photo-mono">Posts</span>
                            </article>
                            <article class="social-photo-my-stat">
                                <strong>${savedCount}</strong>
                                <span class="social-photo-mono">Saved</span>
                            </article>
                        </div>
                    </div>
                </header>
                <nav class="social-photo-my-tabs" role="tablist" aria-label="Profile sections">
                    <button class="${profileTab === 'posts' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm social-photo-my-tab${profileTab === 'posts' ? ' is-active' : ''}" type="button" role="tab" data-action="photography-my-profile-tab" data-my-profile-tab="posts">
                        <i class="fas fa-th"></i> Posts
                    </button>
                    <button class="${profileTab === 'saved' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm social-photo-my-tab${profileTab === 'saved' ? ' is-active' : ''}" type="button" role="tab" data-action="photography-my-profile-tab" data-my-profile-tab="saved">
                        <i class="fas fa-bookmark"></i> Saved
                    </button>
                    <button class="${profileTab === 'tagged' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm social-photo-my-tab${profileTab === 'tagged' ? ' is-active' : ''}" type="button" role="tab" data-action="photography-my-profile-tab" data-my-profile-tab="tagged">
                        <i class="fas fa-tags"></i> Tagged
                    </button>
                </nav>
                ${content}
            </div>
        `;
    }

    function renderProfileView(userId, posts) {
        const account = accountById(userId) || { id: userId, displayName: userId };
        const userPosts = posts.filter((post) => text(post.authorUserId) === text(userId));
        const isSelf = text(userId) === currentUserId();
        return `
            <div class="social-photo-profile-shell">
                <button class="lux-ghost-btn social-photo-back social-photo-mono" type="button" data-action="photography-profile-back">&larr; Back</button>
                <header class="social-neo-card social-photo-profile-hero">
                    <div class="social-photo-profile-head">
                        <span class="social-photo-profile-avatar">${avatar(account, 'social-photo-profile-avatar-img')}</span>
                        <div>
                            <h2 class="social-photo-display">${escape(displayName(account))}</h2>
                            <p class="social-photo-mono">${escape(accountSubtitle(account))}</p>
                            <p class="social-photo-mono">${escape(userPosts.length)} photo${userPosts.length === 1 ? '' : 's'}</p>
                        </div>
                        ${isSelf
                            ? `<button class="lux-primary-btn" type="button" data-action="photography-upload-open">Develop a photo</button>`
                            : `<button class="lux-secondary-btn ${isFollowingProfile(userId) ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="photography-follow" data-user-id="${escape(text(userId))}">${isFollowingProfile(userId) ? 'Following' : 'Follow'}</button>`}
                    </div>
                </header>
                ${renderPhotoFeed(userPosts, 'explore')}
            </div>
        `;
    }

    window.renderPhotographyPanel = function renderPhotographyPanel() {
        const runtime = state();
        const allPosts = photographyPosts();

        if (runtime.ui?.photographyMyProfile) return renderMyProfile(allPosts);

        const profileUserId = text(runtime.ui?.photographyProfileUserId || '');
        if (profileUserId) return renderProfileView(profileUserId, allPosts);

        const tab = photoTab();
        const posts = filterPosts(allPosts);
        const discover = discoverPhotographers(allPosts);
        const searchId = controlId ? controlId('photography-search') : 'photography-search';
        const user = currentUser();

        const hasCatalog = allPosts.length > 0;
        const searchMarkup = hasCatalog ? `
            <label class="social-photo-search" for="${escape(searchId)}">
                <i class="fas fa-search" aria-hidden="true"></i>
                <input class="social-neo-input lux-control" id="${escape(searchId)}" type="search" placeholder="Search photos..." value="${escape(text(runtime.ui?.photographySearch || ''))}" data-action="photography-search-input" autocomplete="off">
            </label>
        ` : '';
        const uploadBtnMarkup = user ? `
            <button class="lux-tab-btn lux-tab-btn--icon is-active" type="button" data-action="photography-upload-open" aria-label="Share a photo" title="Share a photo">
                <i class="fas fa-camera" aria-hidden="true"></i>
                <span>Share a photo</span>
            </button>
        ` : '';
        const myProfileBtn = user ? `
            <button class="lux-tab-btn lux-tab-btn--icon" type="button" data-action="photography-my-profile-open" aria-label="My profile" title="My profile">
                ${avatar(user, 'social-neo-avatar-xs')}
            </button>
        ` : '';
        const tabTitles = {
            explore: 'Campus Exposé',
            grid: 'Photo grid',
            following: 'Following feed',
            pinned: 'Pinned photos',
        };
        const tabCopy = {
            explore: 'Discover campus photography from students, clubs, and events.',
            grid: 'Browse the full campus photo grid in a compact layout.',
            following: 'Photos from photographers you follow across campus.',
            pinned: 'Highlighted campus photos and shots you kept.',
        };
        return `
            <div class="social-photo-shell social-neo-community-panel">
                <section class="social-neo-card social-photo-hero">
                    <div class="social-photo-chrome-row">
                        <div class="social-photo-chrome-copy">
                            <h1 class="social-photo-display social-photo-chrome-title">${escape(tabTitles[tab] || tabTitles.explore)}</h1>
                            <p class="social-photo-chrome-subtitle social-neo-muted">${escape(tabCopy[tab] || tabCopy.explore)}</p>
                        </div>
                        <div class="social-photo-chrome-actions">
                            ${(window.renderSocialBrowseFacultyHeroControl || (window.KiuSocialChromeModel || {}).renderSocialBrowseFacultyHeroControl)?.(runtime) || ''}
                            ${uploadBtnMarkup}
                            ${searchMarkup}
                            ${myProfileBtn}
                        </div>
                    </div>
                    <nav class="lux-tab-strip lux-tab-strip--segmented" role="tablist" aria-label="Photo feed tabs">
                        <button class="lux-tab-btn" type="button" role="tab" aria-selected="${tab === 'explore' ? 'true' : 'false'}" data-action="photography-tab" data-photography-tab="explore">Explore</button>
                        <button class="lux-tab-btn" type="button" role="tab" aria-selected="${tab === 'grid' ? 'true' : 'false'}" data-action="photography-tab" data-photography-tab="grid">Grid</button>
                        <button class="lux-tab-btn" type="button" role="tab" aria-selected="${tab === 'following' ? 'true' : 'false'}" data-action="photography-tab" data-photography-tab="following">Following</button>
                        <button class="lux-tab-btn lux-tab-btn--icon" type="button" role="tab" aria-selected="${tab === 'pinned' ? 'true' : 'false'}" data-action="photography-tab" data-photography-tab="pinned"><i class="fas fa-thumbtack" aria-hidden="true"></i> Pinned</button>
                    </nav>
                </section>
                ${tab === 'pinned' ? '' : renderDiscoverStrip(discover)}
                ${renderPhotoFeed(posts, tab)}
            </div>
        `;
    };

    function findPhotographyPost(postId) {
        const normalizedId = text(postId);
        return photographyPosts().find((item) => text(item.id) === normalizedId)
            || (Array.isArray(state().feed) ? state().feed : []).find((item) => text(item.id) === normalizedId)
            || null;
    }

    window.refreshPhotographyFeedStage = function refreshPhotographyFeedStage() {
        const host = document.getElementById('social-neo-center-region');
        const shell = host?.querySelector('.social-photo-shell');
        if (!shell) return false;

        // Profile sub-views have different chrome — fall back to full render.
        if (shell.querySelector('.social-photo-my-profile, .social-photo-profile-view, [data-action="photography-profile-back"]')) {
            return false;
        }

        const tab = photoTab();
        const allPosts = photographyPosts();
        const posts = filterPosts(allPosts);
        const discover = discoverPhotographers(allPosts);

        const tabTitles = {
            explore: 'Campus Exposé',
            grid: 'Photo grid',
            following: 'Following feed'
        };
        const tabCopy = {
            explore: 'Discover campus photography from students, clubs, and events.',
            grid: 'Browse the full campus photo grid in a compact layout.',
            following: 'Photos from photographers you follow across campus.'
        };
        const titleEl = shell.querySelector('.social-photo-chrome-title');
        const subtitleEl = shell.querySelector('.social-photo-chrome-subtitle');
        if (titleEl) titleEl.textContent = tabTitles[tab] || tabTitles.explore;
        if (subtitleEl) subtitleEl.textContent = tabCopy[tab] || tabCopy.explore;

        shell.querySelectorAll('[data-photography-tab]').forEach((btn) => {
            const value = text(btn.getAttribute('data-photography-tab') || '');
            const active = value === tab;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        const nextDiscover = tab === 'pinned' ? '' : renderDiscoverStrip(discover);
        const discoverEl = shell.querySelector('.social-photo-discover-strip');
        if (nextDiscover) {
            if (discoverEl) discoverEl.outerHTML = nextDiscover;
            else {
                const hero = shell.querySelector('.social-photo-hero');
                if (hero) hero.insertAdjacentHTML('afterend', nextDiscover);
            }
        } else if (discoverEl) {
            discoverEl.remove();
        }

        const nextFeed = renderPhotoFeed(posts, tab);
        const stageEl = shell.querySelector('.social-photo-content-stage');
        if (stageEl) {
            const parsed = document.createElement('div');
            parsed.innerHTML = nextFeed;
            const nextStage = parsed.firstElementChild;
            if (nextStage) stageEl.replaceWith(nextStage);
            else stageEl.innerHTML = nextFeed;
        } else {
            shell.insertAdjacentHTML('beforeend', nextFeed);
        }
        const mountedStage = shell.querySelector('.social-photo-content-stage');
        if (mountedStage) mountedStage.classList.remove('is-loading');
        if (tab !== 'explore') bindPhotographyGridImages(mountedStage || shell);
        return true;
    };

    window.renderPhotographyCommentsDialog = function renderPhotographyCommentsDialog(dialog = {}) {
        const postId = text(dialog.postId || '');
        const post = findPhotographyPost(postId);
        if (!post) return '';
        const commentAuthor = typeof currentUser === 'function' ? currentUser() : null;
        const dialogComments = Array.isArray(post.comments) ? post.comments : [];
        const dialogNormalizedPostId = typeof postKey === 'function' ? postKey(post) : text(post.id);
        const dialogCommentDraft = String(state().ui?.commentDraftByPost?.[dialogNormalizedPostId] || '');
        const dialogCommentInputId = controlId ? controlId('commentBody', dialogNormalizedPostId) : `commentBody-${dialogNormalizedPostId}`;
        const dialogCommentTotal = dialogComments.length + Number(post.replyCount || 0);
        const src = postImageSrc(post);
        const caption = text(post.body || '');
        const canRemove = canRemovePhotographyPost(post);
        const threadMarkup = typeof renderCommentThread === 'function'
            ? renderCommentThread(dialogComments, post, 'dialog')
            : '';

        return `
            <div class="lux-glass-dialog-backdrop social-photo-ig-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Comments">
                <div class="social-photo-ig-modal lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="social-photo-ig-modal-body">
                        <div class="social-photo-ig-media-pane">
                            ${src ? `<img src="${escape(src)}" alt="${escape(caption || 'Campus photo')}">` : ''}
                        </div>
                        <div class="social-photo-ig-comments-pane">
                            <div class="social-photo-ig-sheet-handle" aria-hidden="true"></div>
                            <div class="lux-glass-dialog-section-head lux-glass-dialog-head social-photo-ig-comments-head">
                                <div class="lux-glass-dialog-heading">
                                    <strong class="lux-glass-dialog-title">Comments</strong>
                                    <span class="lux-glass-dialog-subtitle social-photo-ig-comments-subtitle">${dialogCommentTotal ? `${dialogCommentTotal} comment${dialogCommentTotal === 1 ? '' : 's'}` : 'No comments yet'}</span>
                                </div>
                                <div class="social-photo-ig-comments-head-actions">
                                    ${canRemove ? `
                                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="photography-edit-open" data-post-id="${escape(dialogNormalizedPostId)}" aria-label="Edit photo" title="Edit photo">
                                            <i class="fas fa-pen" aria-hidden="true"></i> Edit
                                        </button>
                                        <button class="lux-secondary-btn lux-btn-danger lux-secondary-btn-sm" type="button" data-action="photography-delete-open" data-post-id="${escape(dialogNormalizedPostId)}" aria-label="Remove photo" title="Remove photo">
                                            <i class="fas fa-trash" aria-hidden="true"></i> Remove
                                        </button>
                                    ` : ''}
                                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                                </div>
                            </div>
                            <div class="social-photo-ig-comment-scroll">
                                <div class="lux-glass-dialog-comment-thread social-photo-ig-comment-thread" id="lux-glass-dialog-comment-thread">
                                    ${threadMarkup || '<div class="social-neo-empty">No comments yet. Be the first to reply.</div>'}
                                </div>
                            </div>
                            <form class="lux-glass-dialog-comment-compose social-photo-ig-comment-compose" data-form="dialog-comment" data-post-id="${escape(dialogNormalizedPostId)}">
                                ${commentAuthor ? avatar(commentAuthor, 'social-neo-avatar-sm') : ''}
                                <div class="lux-glass-dialog-comment-compose-main">
                                    <div class="social-neo-inline social-neo-comment-compose-row">
                                        <input class="social-neo-input lux-control" id="${escape(dialogCommentInputId)}" type="text" name="commentBody" placeholder="Add a comment..." aria-label="Add a comment" value="${escape(dialogCommentDraft)}" autocomplete="off">
                                        <button class="lux-primary-btn" type="submit">Post</button>
                                    </div>
                                </div>
                                <input type="hidden" name="postId" value="${escape(dialogNormalizedPostId)}">
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    window.renderPhotographyDeleteDialog = function renderPhotographyDeleteDialog(dialog = {}) {
        const postId = text(dialog.postId || '');
        const post = findPhotographyPost(postId);
        if (!post || !canRemovePhotographyPost(post)) return '';
        const src = postImageSrc(post);
        const caption = text(post.body || '');
        const previewTitle = caption || 'Campus photo';
        const previewImage = src
            ? `<div class="social-photo-upload-review"><div class="social-photo-feed-media"><img src="${escape(src)}" alt="${escape(previewTitle)}"></div></div>`
            : '';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card social-neo-delete-confirm lux-glass-dialog-card--social-glass" data-form="dialog-photography-delete" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-delete-confirm-accent" aria-hidden="true"></div>
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <span class="social-neo-delete-confirm-icon-chip home-hover-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                        <div class="social-neo-delete-confirm-title">
                            <strong class="lux-glass-dialog-title">Remove photo</strong>
                            <span class="lux-glass-dialog-subtitle">This permanently deletes your campus photo from Exposé.</span>
                        </div>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-delete-confirm-preview">
                    ${previewImage}
                    <strong class="lux-glass-dialog-preview-title">${escape(previewTitle)}</strong>
                </div>
                <div class="lux-glass-dialog-preview lux-glass-dialog-preview-danger">The photo will be permanently removed for everyone.</div>
                <label class="social-neo-item-line lux-glass-dialog-checkbox-line">
                    <input type="checkbox" name="confirmPhotographyDelete" value="yes">
                    <span class="lux-glass-dialog-checkbox-copy">I understand this photo will be permanently removed from Exposé.</span>
                </label>
                <div class="social-neo-delete-confirm-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-secondary-btn lux-primary-btn lux-btn-danger lux-glass-dialog-submit-btn" type="submit">Remove photo</button>
                </div>
                <input type="hidden" name="postId" value="${escape(postId)}">
            </form>
        </div>`;
    };

    window.renderPhotographyEditDialog = function renderPhotographyEditDialog(dialog = {}) {
        const postId = text(dialog.postId || '');
        const post = findPhotographyPost(postId);
        if (!post || !canRemovePhotographyPost(post)) return '';
        const runtime = state();
        const src = postImageSrc(post);
        const caption = text(post.body || '');
        const location = text(post.photoMeta?.location || '');
        const facultyCode = text(post.photoMeta?.facultyCode || post.audienceFacultyCode || '');
        const previewImage = src
            ? `<div class="social-photo-upload-review"><div class="social-photo-feed-media"><img src="${escape(src)}" alt="${escape(caption || 'Campus photo')}"></div></div>`
            : '';
        const facultySelect = (window.KiuSocialChromeModel || {}).renderSocialBrowseFacultySelect
            ? (window.KiuSocialChromeModel.renderSocialBrowseFacultySelect(runtime, {
                name: 'photographyFaculty',
                includeAll: false,
                required: true,
                value: facultyCode || ((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(runtime) || ''),
                label: 'Faculty'
            }))
            : `<select class="social-neo-select lux-control" name="photographyFaculty" required data-lux-picker><option value="">Select faculty</option></select>`;
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--photography-edit lux-glass-dialog-card--social-glass social-photo-upload-card" data-form="dialog-photography-edit" data-action="noop" data-lux-transparency-exempt="1">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <strong class="lux-glass-dialog-title">Edit photo</strong>
                        <span class="lux-glass-dialog-subtitle">Update the caption, location, and faculty for this Exposé post.</span>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                ${previewImage}
                <label class="social-photo-field social-photo-mono">Caption
                    <textarea class="social-neo-textarea lux-control" name="photographyCaption" rows="3" placeholder="Describe this campus moment...">${escape(caption)}</textarea>
                </label>
                <label class="social-photo-field social-photo-mono">Location
                    <input class="social-neo-input lux-control" type="text" name="photographyLocation" value="${escape(location)}" placeholder="Library quad">
                </label>
                <label class="social-photo-field social-photo-mono">Faculty
                    ${facultySelect}
                </label>
                <div class="lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit">Save changes</button>
                </div>
                <input type="hidden" name="postId" value="${escape(postId)}">
            </form>
        </div>`;
    };

    window.renderPhotographyUploadDialog = function renderPhotographyUploadDialog(dialog = {}) {
        const runtime = state();
        const step = Number(dialog.step || runtime.ui?.photographyUploadStep || 1);
        const draft = runtime.ui?.photographyUploadDraft || {};
        const preview = text(draft.previewUrl || '');
        const hasFile = Boolean(draft.file || text(draft.fileName || ''));
        const stepDots = [1, 2, 3].map((n) => `<span class="social-photo-step-dot ${n <= step ? 'is-on' : ''}"></span>`).join('');

        let body = '';
        if (step === 1) {
            body = `
                <div class="social-photo-upload-step1">
                    <label class="social-photo-upload-dropzone lux-secondary-btn-pointer${hasFile || preview ? ' has-preview' : ''}" data-photography-drop tabindex="0">
                        <input class="social-photo-upload-file-input" type="file" name="photographyUploadFile" accept="image/*" tabindex="-1" aria-hidden="true">
                        <div class="social-photo-viewfinder"></div>
                        ${preview
                            ? `<img src="${escape(preview)}" alt="Preview" class="social-photo-upload-preview">`
                            : hasFile
                                ? `<p class="social-photo-mono">${escape(text(draft.fileName || 'Image selected'))}</p>`
                                : '<p>Drop an image here</p><p class="social-photo-mono">JPG · PNG · WEBP · max 25MB</p>'}
                        <span class="social-photo-upload-choose-btn lux-primary-btn">${hasFile || preview ? 'Replace image' : 'Choose image'}</span>
                    </label>
                </div>
            `;
        } else if (step === 2) {
            body = `
                <label class="social-photo-field social-photo-mono">Caption
                    <textarea class="social-neo-textarea lux-control" name="photographyCaption" rows="3" placeholder="Describe this campus moment...">${escape(text(draft.caption || ''))}</textarea>
                </label>
                <label class="social-photo-field social-photo-mono">Location
                    <input class="social-neo-input lux-control" type="text" name="photographyLocation" value="${escape(text(draft.location || ''))}" placeholder="Library quad">
                </label>
                <label class="social-photo-field social-photo-mono">Faculty
                    ${(window.KiuSocialChromeModel || {}).renderSocialBrowseFacultySelect
                        ? (window.KiuSocialChromeModel.renderSocialBrowseFacultySelect(runtime, {
                            name: 'photographyFaculty',
                            includeAll: false,
                            required: true,
                            value: text(draft.facultyCode || '') || ((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(runtime) || ''),
                            label: 'Faculty'
                        }))
                        : `<select class="social-neo-select lux-control" name="photographyFaculty" required data-lux-picker><option value="">Select faculty</option></select>`}
                </label>
            `;
        } else {
            const reviewFaculty = text(draft.facultyCode || '') || ((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(runtime) || currentFacultyCode());
            body = `
                <div class="social-photo-upload-review">
                    ${preview ? `<div class="social-photo-feed-media"><img src="${escape(preview)}" alt="Review"></div>` : ''}
                    <p class="social-photo-feed-caption">${escape(text(draft.caption || 'No caption'))}</p>
                    <p class="social-photo-mono">Faculty: ${escape(reviewFaculty)} · Audience: Campus</p>
                </div>
            `;
        }

        return `
            <div class="lux-glass-dialog-backdrop social-photo-upload-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--photography-upload lux-glass-dialog-card--social-glass social-photo-upload-card" data-form="photography-upload" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="social-photo-upload-head">
                        <div>
                            <strong class="social-photo-display">${step === 1 ? 'Capture' : step === 2 ? 'Caption' : 'Publish'}</strong>
                            <div class="social-photo-step-dots">${stepDots}</div>
                        </div>
                        <button class="lux-secondary-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    ${body}
                    <div class="social-photo-upload-actions">
                        ${step > 1 ? `<button class="lux-secondary-btn" type="button" data-action="photography-upload-back">Back</button>` : `<button class="lux-secondary-btn" type="button" data-action="dialog-close">Cancel</button>`}
                        ${step < 3
                            ? `<button class="lux-primary-btn" type="button" data-action="photography-upload-next" ${step === 1 && !hasFile ? 'disabled' : ''}>Next</button>`
                            : `<button class="lux-primary-btn" type="submit">Publish</button>`}
                    </div>
                </form>
            </div>
        `;
    };

    function isSocialPhotographyClickAction(action) {
        const a = text(action || '');
        return Boolean(a) && a.startsWith('photography-');
    }

    function handleSocialPhotographyClick(action, trigger) {
        if (!isSocialPhotographyClickAction(action)) return false;
        if (action === 'photography-tab') {
            const rawTab = text(trigger.getAttribute('data-photography-tab') || 'explore') || 'explore';
            const nextTab = rawTab === 'gallery' || rawTab === 'contact' ? 'explore' : rawTab;
            const wasGridTab = photoTab() !== 'explore';
            state().ui.photographyTab = nextTab;
            if (nextTab !== 'explore' && !wasGridTab) showPhotographyGridSkeleton();
            if (refreshPhotographyPanelStage()) return;
            return renderSocialPageNow('photography-tab');
        }

        if (action === 'photography-my-profile-open') {
            state().ui.photographyMyProfile = true;
            state().ui.photographyMyProfileTab = state().ui.photographyMyProfileTab || 'posts';
            return renderSocialPageNow('photography-my-profile');
        }

        if (action === 'photography-my-profile-close') {
            state().ui.photographyMyProfile = false;
            return renderSocialPageNow('photography-my-profile');
        }

        if (action === 'photography-my-profile-tab') {
            state().ui.photographyMyProfileTab = text(trigger.getAttribute('data-my-profile-tab') || 'posts');
            return renderSocialPageNow('photography-my-profile-tab');
        }

        if (action === 'photography-upload-open') {
            setPanel('photography');
            revokePhotographyUploadPreview(state().ui?.photographyUploadDraft);
            state().ui.photographyUploadDraft = {};
            state().ui.photographyUploadStep = 1;
            return openDialog('photography-upload', { step: 1 });
        }

        if (action === 'photography-upload-pick') {
            event.stopPropagation();
            openPhotographyUploadFilePicker();
            return;
        }

        if (action === 'photography-upload-next') {
            const dialog = activeDialog();
            const step = Number(state().ui?.photographyUploadStep || dialog?.step || 1);
            if (step === 1) {
                const draft = state().ui?.photographyUploadDraft || {};
                if (!draft.file && !text(draft.fileName || '')) {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Choose an image before continuing.', 'danger');
                    return;
                }
            }
            if (step === 2) {
                const form = photographyUploadForm();
                state().ui.photographyUploadDraft = state().ui.photographyUploadDraft || {};
                state().ui.photographyUploadDraft.caption = text(form?.photographyCaption?.value || '');
                state().ui.photographyUploadDraft.location = text(form?.photographyLocation?.value || '');
                state().ui.photographyUploadDraft.facultyCode = resolvePhotographyUploadFacultyCode(state(), form);
                if (!state().ui.photographyUploadDraft.facultyCode) {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Faculty is required.', 'danger');
                    return;
                }
            }
            const nextStep = Math.min(3, step + 1);
            state().ui.photographyUploadStep = nextStep;
            state().ui.socialDialog = { type: 'photography-upload', step: nextStep };
            renderPhotographyUploadDialogNow();
            return;
        }

        if (action === 'photography-upload-back') {
            const currentStep = Number(state().ui?.photographyUploadStep || activeDialog()?.step || 1);
            if (currentStep === 2) {
                const form = photographyUploadForm();
                state().ui.photographyUploadDraft = state().ui.photographyUploadDraft || {};
                state().ui.photographyUploadDraft.caption = text(form?.photographyCaption?.value || '');
                state().ui.photographyUploadDraft.location = text(form?.photographyLocation?.value || '');
                state().ui.photographyUploadDraft.facultyCode = text(form?.photographyFaculty?.value || '')
                    || state().ui.photographyUploadDraft.facultyCode
                    || ((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(state()) || '');
            }
            const step = Math.max(1, currentStep - 1);
            state().ui.photographyUploadStep = step;
            state().ui.socialDialog = { type: 'photography-upload', step };
            renderPhotographyUploadDialogNow();
            return;
        }

        if (action === 'photography-open-comments' || action === 'photography-view-photo') {
            const postId = text(trigger.getAttribute('data-post-id'));
            if (!postId) return;
            return openDialog('photography-comments', { postId });
        }

        if (action === 'photography-delete-open') {
            const postId = text(trigger.getAttribute('data-post-id'));
            if (!postId) return;
            const post = findPhotographyPost(postId);
            if (!post || !canRemovePhotographyPost(post)) return;
            return openDialog('photography-delete', { postId });
        }

        if (action === 'photography-edit-open') {
            const postId = text(trigger.getAttribute('data-post-id'));
            if (!postId) return;
            const post = findPhotographyPost(postId);
            if (!post || !canRemovePhotographyPost(post)) return;
            return openDialog('photography-edit', { postId });
        }

        if (action === 'photography-view-profile') {
            state().ui.photographyProfileUserId = text(trigger.getAttribute('data-user-id'));
            setPanel('photography');
            closeDialog();
            return renderSocialPageNow('photography-view-profile');
        }

        if (action === 'photography-profile-back') {
            state().ui.photographyProfileUserId = '';
            return renderSocialPageNow('photography-profile-back');
        }

        if (action === 'photography-appreciate') {
            const postId = text(trigger.getAttribute('data-post-id'));
            return withBusy(() => reactToPortalSocialPost(postId, 'like'));
        }

        if (action === 'photography-share') {
            const postId = text(trigger.getAttribute('data-post-id'));
            return openDialog('post-share', { postId });
        }

        if (action === 'photography-follow') {
            const userId = text(trigger.getAttribute('data-user-id'));
            return withBusy(async () => {
                if (typeof togglePortalSocialFollow !== 'function') return;
                const payload = await togglePortalSocialFollow('profile', userId, { skipBootstrap: true });
                const following = Boolean(payload?.following);
                if (!patchPhotographyFollowButtons(userId, following)) {
                    renderSocialPageNow('photography-follow');
                    return;
                }
                // Following tab membership can change — refresh only the feed stage.
                if (text(state().ui?.photographyTab || '') === 'following') {
                    if (!refreshPhotographyPanelStage()) renderSocialPageNow('photography-follow');
                }
            });
        }
        return false;
    }

    window.handleSocialPhotographyClick = handleSocialPhotographyClick;
    window.isSocialPhotographyClickAction = isSocialPhotographyClickAction;

    function isSocialPhotographySubmitForm(formType) {
        const form = text(formType || '');
        return form === 'photography-upload' || form === 'dialog-photography-delete' || form === 'dialog-photography-edit';
    }

    function refreshPhotographyAfterMutation(reason) {
        const closeDialogFn = resolvePhotographyHook('closeDialog') || closeDialog;
        const invalidate = resolvePhotographyHook('invalidateSocialRenderCache');
        const renderNow = resolvePhotographyHook('renderSocialPageNow') || renderSocialPageNow;
        const patchFlash = resolvePhotographyHook('patchSocialFlash');
        const rootFn = resolvePhotographyHook('root');
        closeDialogFn();
        const host = typeof rootFn === 'function' ? rootFn() : null;
        if (host) host.__kiuLastRenderSignature = '';
        if (typeof invalidate === 'function') invalidate({ center: true });
        const refreshStage = resolvePhotographyHook('refreshPhotographyPanelStage');
        if (typeof refreshStage === 'function' && refreshStage()) {
            if (typeof patchFlash === 'function') patchFlash();
            return;
        }
        renderNow(reason);
        if (typeof patchFlash === 'function') patchFlash();
    }

    function handleSocialPhotographySubmit(formType, form, runtime, event) {
        if (!isSocialPhotographySubmitForm(formType)) return false;
        const busy = resolvePhotographyHook('withBusy') || withBusy;
        if (typeof busy !== 'function') return false;

        if (formType === 'dialog-photography-delete') {
            return busy(async () => {
                if (!form.confirmPhotographyDelete?.checked) throw new Error('Confirm removal before deleting this photo.');
                const postId = text(form.postId?.value);
                if (!postId) throw new Error('Photo could not be removed.');
                const post = findPhotographyPost(postId);
                if (!post || !canRemovePhotographyPost(post)) throw new Error('You can only remove photos you posted.');
                const deletePost = resolvePhotographyHook('deletePortalSocialPost');
                if (typeof deletePost !== 'function') throw new Error('Photo removal is unavailable.');
                await deletePost(postId);
                refreshPhotographyAfterMutation('photography-deleted');
            });
        }

        if (formType === 'dialog-photography-edit') {
            return busy(async () => {
                const postId = text(form.postId?.value);
                if (!postId) throw new Error('Photo could not be updated.');
                const post = findPhotographyPost(postId);
                if (!post || !canRemovePhotographyPost(post)) throw new Error('You can only edit photos you posted.');
                const caption = text(form.photographyCaption?.value || '');
                const location = text(form.photographyLocation?.value || '');
                const facultyCode = resolvePhotographyUploadFacultyCode(state(), form);
                if (!facultyCode) throw new Error('Faculty is required.');
                const updatePost = resolvePhotographyHook('updatePortalSocialPost');
                if (typeof updatePost !== 'function') throw new Error('Photo editing is unavailable.');
                await updatePost(postId, caption, {
                    photoMeta: { location, facultyCode },
                    facultyCode
                });
                refreshPhotographyAfterMutation('photography-edited');
            });
        }

        if (formType !== 'photography-upload') return false;
        return busy(async () => {
            const submitPost = resolvePhotographyHook('submitSocialPost');
            const rootFn = resolvePhotographyHook('root');
            const closeDialogFn = resolvePhotographyHook('closeDialog') || closeDialog;
            const setPanelFn = resolvePhotographyHook('setPanel') || setPanel;
            const renderNow = resolvePhotographyHook('renderSocialPageNow') || renderSocialPageNow;
            const revokePreview = resolvePhotographyHook('revokePhotographyUploadPreview') || revokePhotographyUploadPreview;
            const patchFlash = resolvePhotographyHook('patchSocialFlash');
            const live = state();
            const draft = live.ui?.photographyUploadDraft || {};
            const file = await resolvePhotographyUploadFile(draft);
            const caption = text(draft.caption || form.photographyCaption?.value || '');
            if (!file) throw new Error('Choose an image before publishing.');
            if (typeof submitPost !== 'function') throw new Error('Photo publishing is unavailable.');
            const facultyCode = resolvePhotographyUploadFacultyCode(live, form);
            if (!facultyCode) throw new Error('Faculty is required.');
            const published = await submitPost(caption, {
                postType: 'photo',
                category: 'Photography',
                file,
                fileScope: 'social',
                audienceFacultyCode: facultyCode,
                facultyCode,
                photoMeta: {
                    location: text(draft.location || form.photographyLocation?.value || ''),
                    facultyCode
                }
            });
            if (!published) throw new Error('Photo could not be published.');
            revokePreview(live.ui?.photographyUploadDraft);
            live.ui.photographyUploadDraft = {};
            live.ui.photographyUploadStep = 1;
            live.ui.photographyTab = 'explore';
            closeDialogFn();
            setPanelFn('photography');
            const host = typeof rootFn === 'function' ? rootFn() : null;
            if (host) host.__kiuLastRenderSignature = '';
            const invalidate = resolvePhotographyHook('invalidateSocialRenderCache');
            if (typeof invalidate === 'function') invalidate({ center: true });
            renderNow('photography-upload-submit');
            const refreshStage = resolvePhotographyHook('refreshPhotographyPanelStage');
            if (typeof refreshStage === 'function' && refreshStage()) {
                if (typeof patchFlash === 'function') patchFlash();
                return;
            }
            renderNow('post-created');
            if (typeof patchFlash === 'function') patchFlash();
        });
    }

    window.handleSocialPhotographySubmit = handleSocialPhotographySubmit;
    window.isSocialPhotographySubmitForm = isSocialPhotographySubmitForm;

    function isSocialPhotographyInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-action="photography-search-input"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialPhotographyInput(target, runtime, event) {
        if (!isSocialPhotographyInputTarget(target)) return false;
        if (target.matches('[data-action="photography-search-input"]')) {
            runtime.ui.photographySearch = target.value;
            if (photographySearchTimer) window.clearTimeout(photographySearchTimer);
            photographySearchTimer = window.setTimeout(() => {
                photographySearchTimer = 0;
                if (!refreshPhotographyPanelStage()) renderSocialPageNow('photography-search-input');
            }, 220);
            return;
        }

        return true;
    }

    function isSocialPhotographyChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('input[name="photographyUploadFile"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialPhotographyChange(target, runtime, event) {
        if (!isSocialPhotographyChangeTarget(target)) return false;
        if (target.matches('input[name="photographyUploadFile"]')) {
            event.__kiuSocialChangeHandled = true;
            if (typeof applyPhotographyUploadFile === 'function') {
                applyPhotographyUploadFile(target.files?.[0] || null);
            }
            return true;
        }
        return false;
    }

    window.handleSocialPhotographyInput = handleSocialPhotographyInput;
    window.isSocialPhotographyInputTarget = isSocialPhotographyInputTarget;
    window.handleSocialPhotographyChange = handleSocialPhotographyChange;
    window.isSocialPhotographyChangeTarget = isSocialPhotographyChangeTarget;

})();
