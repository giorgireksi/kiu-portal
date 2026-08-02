/* READABILITY: Social home feed — posts, comments (via comments-runtime), compose, handlers.
 * Sections: Bag | Hooks | PostCard | Comments | SavedHub | Compose | Click | Submit
 * See docs/human-maintainability.md (H2). */
/* Wave bag: Wave 26 social-feed */
window.KiuSocialFeed = window.KiuSocialFeed || {};
const __kiuFeedApi = window.KiuSocialFeed;
window.__kiuFeedApi = __kiuFeedApi;
function __kiuFeedExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuFeedApi[key] = map[key];
        window[key] = map[key];
    });
}

(function initSocialFeedModule() {
    if (window.__KIU_SOCIAL_FEED_MODULE_LOADED) return;
    window.__KIU_SOCIAL_FEED_MODULE_LOADED = true;

    const hooks = window.__kiuSocialFeedHooks || {};
    const {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        avatar,
        displayName,
        reactionEmoji,
        reactionLabel,
        pagePostTypeLabel,
        feedReason,
        renderPostEntityLinks,
        relationshipBuckets,
        isJoinedGroup,
        feedScopeOptions,
        filterFeedForHome,
        controlId,
        activeDialog,
        renderFileChip,
        postingScopeOptions,
        currentSocialProfileSettings,
        normalizeComposerEntityLinks,
        resolveEntityLinkMeta,
        listAttachableEntities,
        entityLinkIcon,
        postKey,
        accountById,
        accountSubtitle,
        when,
        filePreview,
        renderPostReactionMetrics,
        setPanel,
        openDialog,
        closeDialog,
        renderSocialPageNow,
        withBusy,
        root,
        focusFeed,
        clearPostComposeDraft,
        submitSocialPost,
        isCommentDialog,
        patchPostComposeAttachDialog,
        patchPostComposeDialog,
        scrollSocialCenterElementIntoView,
        refreshPortalSocialFeed,
        reactToPortalSocialPost,
        reactToPortalSocialComment,
        pinPortalSocialPost,
        openPortalStoryComposer,
        closePortalStoryComposer,
        openPortalStoryViewer,
        closePortalStoryViewer,
        nextPortalStory,
        prevPortalStory,
        getPortalSocialStoryItems,
        commentOnPortalSocialPost,
        deletePortalSocialPost,
        invalidateSocialRenderCache,
        readFileAsDataUrl,
        removePortalSocialComment,
        reportPortalSocialContent,
        reportSocialPost,
        restorePreviousDialog,
        setPortalSocialFlash,
        sharePortalSocialPost,
        submitPortalStory,
        syncCommentDraftFromTarget,
        updatePortalSocialPost
    } = hooks;

    const pendingCommentReactions = new Set();

    if (
        typeof state !== 'function'
        || typeof currentUser !== 'function'
        || typeof currentUserId !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof avatar !== 'function'
        || typeof displayName !== 'function'
        || typeof reactionEmoji !== 'function'
        || typeof reactionLabel !== 'function'
        || typeof pagePostTypeLabel !== 'function'
        || typeof feedReason !== 'function'
        || typeof renderPostEntityLinks !== 'function'
        || typeof relationshipBuckets !== 'function'
        || typeof isJoinedGroup !== 'function'
        || typeof feedScopeOptions !== 'function'
        || typeof filterFeedForHome !== 'function'
        || typeof controlId !== 'function'
        || typeof activeDialog !== 'function'
        || typeof renderFileChip !== 'function'
        || typeof postingScopeOptions !== 'function'
        || typeof currentSocialProfileSettings !== 'function'
        || typeof normalizeComposerEntityLinks !== 'function'
        || typeof resolveEntityLinkMeta !== 'function'
        || typeof listAttachableEntities !== 'function'
        || typeof entityLinkIcon !== 'function'
        || typeof postKey !== 'function'
        || typeof accountById !== 'function'
        || typeof accountSubtitle !== 'function'
        || typeof when !== 'function'
        || typeof filePreview !== 'function'
        || typeof renderPostReactionMetrics !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof closeDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof root !== 'function'
        || typeof focusFeed !== 'function'
        || typeof clearPostComposeDraft !== 'function'
        || typeof submitSocialPost !== 'function'
        || typeof isCommentDialog !== 'function'
        || typeof patchPostComposeAttachDialog !== 'function'
        || typeof patchPostComposeDialog !== 'function'
        || typeof scrollSocialCenterElementIntoView !== 'function'
        || typeof refreshPortalSocialFeed !== 'function'
        || typeof reactToPortalSocialPost !== 'function'
        || typeof reactToPortalSocialComment !== 'function'
        || typeof pinPortalSocialPost !== 'function'
        || typeof openPortalStoryComposer !== 'function'
        || typeof closePortalStoryComposer !== 'function'
        || typeof openPortalStoryViewer !== 'function'
        || typeof closePortalStoryViewer !== 'function'
        || typeof nextPortalStory !== 'function'
        || typeof prevPortalStory !== 'function'
        || typeof getPortalSocialStoryItems !== 'function'
        || typeof commentOnPortalSocialPost !== 'function'
        || typeof deletePortalSocialPost !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof readFileAsDataUrl !== 'function'
        || typeof removePortalSocialComment !== 'function'
        || typeof reportPortalSocialContent !== 'function'
        || typeof reportSocialPost !== 'function'
        || typeof restorePreviousDialog !== 'function'
        || typeof setPortalSocialFlash !== 'function'
        || typeof sharePortalSocialPost !== 'function'
        || typeof submitPortalStory !== 'function'
        || typeof syncCommentDraftFromTarget !== 'function'
        || typeof updatePortalSocialPost !== 'function'
    ) {
        throw new Error('Social feed hooks are unavailable.');
    }

    function renderPost(post) {
        const author = accountById(post.authorUserId) || { id: post.authorUserId, displayName: post.authorUserId };
        const reactionCounts = post?.reactionCounts || {};
        const viewerReaction = text(post.viewerReaction || '');
        const hasViewerReaction = Boolean(viewerReaction);
        const reactionCount = Object.values(reactionCounts).reduce((sum, count) => sum + Number(count || 0), 0);
        const sharedPost = post.sharedPost;
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const normalizedPostId = postKey(post);
        const shareCount = Number(post?.shareCount || 0);
        const saved = isPostSaved(post.id);
        const scopeBadge = post.scopeType === 'page'
            ? `Page - ${text(post.scopeName || 'Page')}`
            : post.scopeType === 'group'
                ? `Group - ${text(post.scopeName || 'Group')}`
                : 'Profile';
        const pagePostLabel = post.scopeType === 'page' ? pagePostTypeLabel(post) : '';
        const contextLine = `${accountSubtitle(author)} - ${feedReason(post, author)}`;
        const commentTotal = comments.length + Number(post.replyCount || 0);
        return `
            <article class="social-neo-card social-neo-post-card lux-soft-chrome home-hover-chip ${post.isPinned ? 'is-pinned' : ''}">
                <div class="social-neo-post-head">
                    <button class="social-neo-post-author social-neo-clickable" type="button" data-action="profile-view" data-user-id="${escape(text(author.id))}">
                        ${avatar(author)}
                        <div class="social-neo-post-author-copy">
                            <strong class="social-neo-post-author-name">${escape(displayName(author))}</strong>
                            <span class="social-neo-post-author-meta">${escape(contextLine)} - ${escape(when(post.createdAt))}</span>
                        </div>
                    </button>
                    <div class="social-neo-inline social-neo-inline-gap-4 social-neo-inline-post-actions-head social-neo-post-head-actions">
                        <span class="social-neo-pill home-hover-chip social-neo-post-scope-badge">${escape(scopeBadge)}</span>
                        ${pagePostLabel ? `<span class="social-neo-pill home-hover-chip social-neo-post-page-label">${escape(pagePostLabel)}</span>` : ''}
                        ${post.isPinned ? `<span class="social-neo-pill home-hover-chip social-neo-pill-pinned social-neo-post-pinned-pill"><i class="fas fa-thumbtack"></i> Pinned</span>` : ''}
                        ${post.viewerCanManageScope ? `<button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn social-neo-post-head-action-btn" type="button" data-action="post-pin" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-thumbtack"></i> ${post.isPinned ? 'Unpin' : 'Pin'}</button>` : ''}
                        ${post.viewerCanEdit ? `<button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn social-neo-post-head-action-btn" type="button" data-action="post-edit" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-pen"></i></button>` : ''}
                        ${post.viewerCanEdit ? `<button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn social-neo-post-head-action-btn" type="button" data-action="post-delete" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-trash-alt"></i></button>` : ''}
                        <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn social-neo-post-head-action-btn" type="button" data-action="post-report" data-post-id="${escape(normalizedPostId)}"><i class="fas fa-ellipsis-h"></i></button>
                    </div>
                </div>
                <div class="social-neo-post-body">${escape(post.body || post.text || '') || '<span class="social-neo-muted">Shared without extra text.</span>'}</div>
                ${renderPostEntityLinks(post)}
                ${(Array.isArray(post.media) ? post.media : []).map((media) => filePreview(media)).join('')}
                ${sharedPost ? `
                    <div class="social-neo-shared">
                        <span class="social-neo-pill home-hover-chip">Shared post</span>
                        <strong>${escape(displayName(sharedPost.authorUserId))}</strong>
                        <p>${escape(sharedPost.body || sharedPost.text || 'Original post')}</p>
                    </div>
                ` : ''}
                ${(() => {
                    const reactionMetricHtml = renderPostReactionMetrics(reactionCounts);
                    const commentMetricHtml = commentTotal ? `<span class="social-neo-post-metric">${escape(commentTotal)} repl${commentTotal === 1 ? 'y' : 'ies'}</span>` : '';
                    const shareMetricHtml = shareCount > 0 ? `<span class="social-neo-post-metric">${escape(shareCount)} share${shareCount !== 1 ? 's' : ''}</span>` : '';
                    if (!reactionMetricHtml && !commentMetricHtml && !shareMetricHtml) return '';
                    return `<div class="social-neo-inline-metrics social-neo-post-metrics">${reactionMetricHtml}${commentMetricHtml}${shareMetricHtml}</div>`;
                })()}
                <div class="social-neo-post-actions social-neo-post-action-row">
                    <button class="lux-secondary-btn social-neo-post-action-btn ${hasViewerReaction ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="post-react" data-post-id="${escape(normalizedPostId)}" data-reaction-type="${escape(viewerReaction || 'like')}">
                        ${hasViewerReaction
                            ? `<span>${reactionEmoji(viewerReaction)}</span> ${escape(reactionLabel(viewerReaction))}`
                            : '<i class="fas fa-thumbs-up"></i> Like'}
                    </button>
                    <button class="lux-secondary-btn social-neo-post-action-btn" type="button" data-action="post-focus-comment" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-comment"></i> Comment${post.replyCount ? ` (${escape(text(post.replyCount))})` : ''}
                    </button>
                    <button class="lux-secondary-btn social-neo-post-action-btn" type="button" data-action="post-share" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <div class="social-neo-reaction-picker">
                        ${['like', 'love', 'laugh', 'wow', 'support'].map((reactionType) => `
                            <button class="lux-secondary-btn lux-secondary-btn-sm social-neo-post-reaction-btn ${post.viewerReaction === reactionType ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="post-react" data-post-id="${escape(normalizedPostId)}" data-reaction-type="${escape(reactionType)}" title="${escape(reactionType)}">
                                <span>${reactionEmoji(reactionType)}</span>
                            </button>
                        `).join('')}
                    </div>
                    <span class="social-neo-flex-spacer"></span>
                    <button class="lux-secondary-btn social-neo-post-save-btn ${saved ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="post-save" data-post-id="${escape(normalizedPostId)}">
                        <i class="fas fa-bookmark"></i> ${saved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </article>
        `;
    }

    __kiuFeedExpose({
        renderPost,
    });

    // --- READABILITY: Comments ---
    if (typeof window.createKiuSocialFeedCommentsApi !== 'function') {
        throw new Error('Social feed comments runtime is unavailable.');
    }
    const __feedComments = window.createKiuSocialFeedCommentsApi({
        text,
        escape,
        displayName,
        accountById,
        currentUserId,
        currentUser,
        avatar,
        when,
        postKey,
        state,
        reactionEmoji,
        removePortalSocialComment,
        setPortalSocialFlash
    });
    const {
        commentReactionType,
        renderInlineReplyForm,
        renderCommentReactionButtons,
        renderCommentNode,
        renderCommentThread,
        dialogCommentEl,
        patchCommentReactions,
        patchCommentReactionsByIds,
        openInlineReply,
        closeInlineReply,
        appendReplyNode,
        patchCommentDialogCount,
        deleteCommentInline,
        relayoutCommentTrunks,
        findCommentInThread
    } = __feedComments;
    __kiuFeedExpose({
        commentReactionType,
        renderInlineReplyForm,
        renderCommentReactionButtons,
        renderCommentNode,
        renderCommentThread,
        dialogCommentEl,
        patchCommentReactions,
        patchCommentReactionsByIds,
        openInlineReply,
        closeInlineReply,
        appendReplyNode,
        patchCommentDialogCount,
        deleteCommentInline,
        relayoutCommentTrunks,
        findCommentInThread
    });
    window.__kiuRelayoutCommentTrunks = relayoutCommentTrunks;


    function socialHub() {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!window.KIU_STATE.socialHub) window.KIU_STATE.socialHub = {};
        if (!Array.isArray(window.KIU_STATE.socialHub.savedPosts)) window.KIU_STATE.socialHub.savedPosts = [];
        return window.KIU_STATE.socialHub;
    }

    function savedItems() {
        return (Array.isArray(socialHub().savedPosts) ? socialHub().savedPosts : []).filter((item) => text(item?.userId) === currentUserId());
    }

    function isPostSaved(postId) {
        return savedItems().some((item) => text(item?.itemType) === 'post' && text(item?.itemId) === text(postId));
    }

    async function toggleSavedPost(postId) {
        const normalizedId = text(postId);
        if (!normalizedId) return;
        const hub = socialHub();
        const existing = hub.savedPosts.find((item) =>
            text(item?.userId) === currentUserId()
            && text(item?.itemType) === 'post'
            && text(item?.itemId) === normalizedId
        );
        if (existing) {
            hub.savedPosts = hub.savedPosts.filter((item) => text(item?.id) !== text(existing.id));
        } else {
            hub.savedPosts.unshift({
                id: `saved-post-${Date.now()}`,
                userId: currentUserId(),
                itemType: 'post',
                itemId: normalizedId,
                createdAt: new Date().toISOString()
            });
        }
        if (typeof saveState === 'function') {
            try { saveState(); } catch (error) {}
        }
        if (typeof addPortalSocialToast === 'function') {
            addPortalSocialToast({
                type: 'success',
                title: existing ? 'Removed from saved' : 'Saved for later',
                text: existing ? 'The post was removed from your saved list.' : 'The post is now available from saved content.',
                icon: 'fa-bookmark'
            });
        }
        if (typeof loadPortalSavedSocialPosts === 'function') {
            try { await loadPortalSavedSocialPosts(true); } catch (error) {}
        }
        return !existing;
    }

    function patchPhotographyFeedReactions(postId) {
        const normalizedId = postKey(postId);
        if (!normalizedId) return false;
        const host = root();
        if (!host) return false;
        const card = host.querySelector(`.social-photo-feed-card [data-action="post-react"][data-post-id="${CSS.escape(normalizedId)}"]`)?.closest('.social-photo-feed-card');
        if (!card) return false;
        return patchPostReactions(postId);
    }

    function patchPostSaveButtons(postId) {
        const normalizedId = postKey(postId);
        if (!normalizedId) return false;
        const host = root();
        if (!host) return false;
        const saved = isPostSaved(normalizedId);
        const buttons = host.querySelectorAll(`.social-neo-post-save-btn[data-action="post-save"][data-post-id="${CSS.escape(normalizedId)}"]`);
        if (!buttons.length) return false;
        buttons.forEach((saveBtn) => {
            saveBtn.classList.toggle('lux-primary-btn', saved);
            saveBtn.classList.toggle('lux-secondary-btn', !saved);
            const label = saveBtn.closest('.social-photo-feed-card') ? (saved ? 'Saved' : 'Keep') : (saved ? 'Saved' : 'Save');
            saveBtn.innerHTML = `<i class="fas fa-bookmark"></i> ${label}`;
        });
        return true;
    }

    function patchPhotographyFeedSave(postId) {
        return patchPostSaveButtons(postId);
    }

    function patchPostReactions(postId) {
        const normalizedId = postKey(postId);
        if (!normalizedId) return false;
        const host = root();
        if (!host) return false;
        const card = host.querySelector(`.social-neo-post-card [data-action="post-react"][data-post-id="${CSS.escape(normalizedId)}"]`)?.closest('.social-neo-post-card');
        if (!card) return false;
        const runtime = state();
        const feed = Array.isArray(runtime?.feed) ? runtime.feed : [];
        const post = feed.find((entry) => text(entry?.id) === normalizedId);
        if (!post) return false;
        const viewerReaction = text(post.viewerReaction || '');
        const hasViewerReaction = Boolean(viewerReaction);
        const reactionCounts = post.reactionCounts && typeof post.reactionCounts === 'object' ? post.reactionCounts : {};
        const metricsRegion = card.querySelector('.social-neo-post-metrics');
        if (metricsRegion) {
            const existingMetric = metricsRegion.querySelector('.social-neo-post-reaction-metric');
            const freshMarkup = renderPostReactionMetrics(reactionCounts);
            if (existingMetric) {
                if (freshMarkup) {
                    existingMetric.outerHTML = freshMarkup;
                } else {
                    existingMetric.remove();
                }
            } else if (freshMarkup) {
                metricsRegion.insertAdjacentHTML('afterbegin', freshMarkup);
            }
        }
        const isPhotoCard = card.classList.contains('social-photo-feed-card');
        const mainBtn = card.querySelector(`.social-neo-post-action-btn[data-action="post-react"][data-post-id="${CSS.escape(normalizedId)}"]`);
        if (mainBtn) {
            mainBtn.classList.toggle('lux-primary-btn', hasViewerReaction);
            mainBtn.classList.toggle('lux-secondary-btn', !hasViewerReaction);
            mainBtn.setAttribute('data-reaction-type', viewerReaction || 'like');
            mainBtn.innerHTML = hasViewerReaction
                ? `<span>${reactionEmoji(viewerReaction)}</span> ${escape(reactionLabel(viewerReaction))}`
                : isPhotoCard
                    ? '<span aria-hidden="true">👍</span> Appreciate'
                    : '<i class="fas fa-thumbs-up"></i> Like';
        }
        const picker = card.querySelector('.social-neo-reaction-picker');
        if (picker) {
            picker.querySelectorAll('.social-neo-post-reaction-btn').forEach((btn) => {
                const type = text(btn.getAttribute('data-reaction-type'));
                const isActive = type === viewerReaction;
                btn.classList.toggle('lux-primary-btn', isActive);
                btn.classList.toggle('lux-secondary-btn', !isActive);
            });
        }
        return true;
    }

    __kiuFeedExpose({
        socialHub,
        savedItems,
        isPostSaved,
        toggleSavedPost,
        patchPhotographyFeedReactions,
        patchPostSaveButtons,
        patchPhotographyFeedSave,
        patchPostReactions,
    });

    const POST_COMPOSE_ATTACH_SECTIONS = [
        { id: 'group', label: 'Groups', icon: 'fa-user-group' },
        { id: 'project', label: 'Projects', icon: 'fa-diagram-project' },
        { id: 'portfolio', label: 'Portfolio', icon: 'fa-briefcase' },
        { id: 'page', label: 'Pages', icon: 'fa-flag' },
        { id: 'event', label: 'Events', icon: 'fa-calendar-days' },
        { id: 'survey', label: 'Surveys', icon: 'fa-clipboard-list' },
        { id: 'photo', label: 'Exposé', icon: 'fa-camera-retro' },
        { id: 'lost-found', label: 'Lost & Found', icon: 'fa-magnifying-glass-location' }
    ];
    const POST_COMPOSE_ENTITY_LINK_MAX = 5;

    function renderFeedHero(runtime, activeFilter, metrics = {}, scopeOptions = [], feedScopeId = '') {
        const following = Number(metrics.following || 0);
        const joinedGroups = Number(metrics.joinedGroups || 0);
        const stats = [
            { label: 'Following', value: following },
            { label: 'Joined groups', value: joinedGroups },
        ];
        const scopedFeed = text(runtime.ui?.feedScopeType);
        const tabs = [
            { tab: 'all', label: 'All', icon: 'fa-globe', helper: 'Full campus stream' },
            { tab: 'following', label: 'Following', icon: 'fa-user-check', helper: 'People and pages you follow' },
            { tab: 'groups', label: 'Groups', icon: 'fa-users', helper: 'Group posts only' },
            { tab: 'pages', label: 'Pages', icon: 'fa-flag', helper: 'Official page updates' },
            { tab: 'campus', label: 'Campus', icon: 'fa-landmark', helper: 'Campus-wide visibility' },
            ...(scopedFeed === 'group' || scopedFeed === 'page'
                ? [{ tab: 'pinned', label: 'Pinned', icon: 'fa-thumbtack', helper: 'Pinned posts in this scope' }]
                : []),
        ];
        const scopeMarkup = Array.isArray(scopeOptions) && scopeOptions.length
            ? `
                <div class="social-neo-feed-hero-scope">
                    <div class="social-neo-scope-field social-neo-feed-hero-scope-field">
                        <span class="social-neo-label social-neo-feed-hero-scope-label">Feed focus</span>
                        <select class="social-neo-select social-neo-feed-hero-scope-select" id="${escape(feedScopeId)}" name="feedScope" data-bind="feed-scope" data-lux-picker>
                            ${scopeOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${text(runtime.ui?.feedScopeType) === option.type && text(runtime.ui?.feedScopeId) === option.id ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `
            : '';
        return `
            <div class="social-neo-feed-hero">
                <div class="social-neo-feed-hero-head">
                    <div class="social-neo-feed-hero-actions">
                        ${(window.renderSocialBrowseFacultyHeroControl || (window.KiuSocialChromeModel || {}).renderSocialBrowseFacultyHeroControl)?.(runtime) || ''}
                        <button class="lux-primary-btn social-neo-feed-hero-action-btn" type="button" data-action="feed-refresh">
                            <i class="fas fa-arrows-rotate"></i> Refresh feed
                        </button>
                        <button class="lux-secondary-btn social-neo-feed-hero-action-btn" type="button" data-action="panel-groups" data-groups-tab="discover">
                            <i class="fas fa-users"></i> Find groups
                        </button>
                    </div>
                </div>
                <div class="social-neo-feed-hero-stats home-hover-chip">
                    ${stats.map((stat) => `
                        <article class="social-neo-feed-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                <div class="social-neo-feed-hero-grid home-hover-chip">
                    ${tabs.map((tab) => `
                        <button class="lux-secondary-btn social-neo-feed-hero-tab ${activeFilter === tab.tab ? 'is-focused' : ''}" type="button" data-action="panel-feed" data-home-filter="${escape(tab.tab)}" aria-pressed="${activeFilter === tab.tab ? 'true' : 'false'}">
                            <span class="social-neo-feed-hero-tab-icon"><i class="fas ${escape(tab.icon)}"></i></span>
                            <span class="social-neo-feed-hero-tab-copy">
                                <strong>${escape(tab.label)}</strong>
                                <small>${escape(tab.helper)}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
                ${scopeMarkup}
            </div>
        `;
    }

    function renderFeedPanel() {
        /* ── Resolve runtime state and user context ── */
        const runtime = state();
        const focusOptions = feedScopeOptions();

        /* ── Prepare feed data and apply active filter ── */
        const feed = Array.isArray(runtime.feed) ? runtime.feed : [];
        const homeFilter = text(runtime.ui?.homeFeedFilter || 'all') || 'all';
        const chrome = window.KiuSocialChromeModel || {};
        const browseFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
            ? chrome.socialBrowseFacultyValue(runtime)
            : (text(runtime.ui?.socialBrowseFaculty || 'all') || 'all');
        const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
            ? chrome.socialMatchesBrowseFaculty
            : () => true;
        const visibleFeed = filterFeedForHome(feed, homeFilter).filter((post) => {
            if (matchesBrowse(post, browseFaculty)) return true;
            const author = typeof accountById === 'function' ? accountById(post?.authorUserId) : null;
            return matchesBrowse(author || {}, browseFaculty);
        });

        /* ── Generate stable DOM IDs for form controls ── */
        const feedScopeId = controlId('feedScope');

        /* ── Compute hero card metrics ── */
        const groups = Array.isArray(runtime.social?.groups) ? runtime.social.groups : [];
        const feedHeroMetrics = {
            following: relationshipBuckets().connections.length,
            joinedGroups: groups.filter(isJoinedGroup).length,
        };

        const firstName = displayName(currentUser()).split(' ')[0] || 'there';
        const composerMarkup = `
            <div class="social-neo-feed-composer-zone social-neo-composer-card social-neo-composer-cta-card lux-soft-chrome home-hover-chip">
                <button class="social-neo-composer-cta" type="button" data-action="post-compose-open">
                    ${avatar(currentUser())}
                    <span class="social-neo-composer-cta-copy">What's on your mind, ${escape(firstName)}?</span>
                    <span class="lux-primary-btn social-neo-composer-cta-btn"><i class="fas fa-pen"></i> Create post</span>
                </button>
            </div>
        `;

        /* ── Assemble the feed panel layout ── */
        return `
            <div class="social-neo-feed-shell">
                <section class="social-neo-card social-neo-feed-header-card lux-soft-chrome home-hover-chip">
                    ${renderFeedHero(runtime, homeFilter, feedHeroMetrics, focusOptions, feedScopeId)}
                    <div class="social-neo-feed-header-divider" aria-hidden="true"></div>
                    ${composerMarkup}
                </section>
            <section class="social-neo-stack">
                ${visibleFeed.length
                    ? visibleFeed.map((post) => renderPost(post)).join('')
                    : `<div class="social-neo-empty">No posts match the current Home filter yet.</div>`}
            </section>
            </div>
        `;
    }

    function renderPostComposeShareSection(runtime) {
        const lastSection = text(runtime.ui?.postComposeAttachSection || '') || '';
        const attached = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
        const selectedMarkup = attached.length
            ? attached.map((link) => {
                const meta = resolveEntityLinkMeta(link);
                return `
                    <article class="social-neo-entity-card social-neo-group-creator-member">
                        <div class="social-neo-person">
                            <span class="social-neo-avatar social-neo-avatar-sm is-fallback"><i class="fas ${escape(meta.icon)}" aria-hidden="true"></i></span>
                            <div>
                                <strong>${escape(meta.title)}</strong>
                                <span>${escape(meta.sectionLabel)} · ${escape(meta.subtitle)}</span>
                            </div>
                        </div>
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="post-compose-entity-remove" data-entity-type="${escape(meta.type)}" data-entity-id="${escape(meta.id)}">
                            <i class="fas fa-xmark"></i> Remove
                        </button>
                    </article>
                `;
            }).join('')
            : '<p class="lux-glass-dialog-hint">No campus items attached yet. Pick a section above to browse.</p>';
        return `
            <section class="lux-glass-dialog-group-section lux-glass-dialog-group-section--invite">
                <div class="lux-glass-dialog-section-head">
                    <strong>Share from campus</strong>
                    <span>Optional. Open a section to attach surveys, groups, pages, and more.</span>
                </div>
                <div class="lux-glass-dialog-project-create-faculties">
                    <span class="social-neo-label">Browse</span>
                    <div class="social-neo-badge-row social-neo-badge-row-mt-8 social-neo-post-compose-section-shortcuts" role="group" aria-label="Attach section">
                        ${POST_COMPOSE_ATTACH_SECTIONS.map((entry) => `
                            <button class="lux-secondary-btn ${lastSection === entry.id ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="post-compose-attach-section" data-section="${escape(entry.id)}">
                                <i class="fas ${escape(entry.icon)}" aria-hidden="true"></i> ${escape(entry.label)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="lux-glass-dialog-invite-block social-neo-post-compose-selected">
                    <div class="lux-glass-dialog-invite-block-head">
                        <strong>Selected</strong>
                        <span>${escape(String(attached.length))} item${attached.length === 1 ? '' : 's'} attached.</span>
                    </div>
                    <div class="social-neo-list lux-glass-dialog-invite-list">${selectedMarkup}</div>
                </div>
            </section>
        `;
    }
    function renderPostComposeAttachResultsHtml(runtime) {
        const section = text(runtime.ui?.postComposeAttachSection || 'survey') || 'survey';
        const filter = text(runtime.ui?.postComposeAttachFilter || 'mine') || 'mine';
        const search = text(runtime.ui?.postComposeAttachSearch || '');
        const attached = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
        const attachedKeys = new Set(attached.map((item) => `${item.type}:${item.id}`));
        const remaining = Math.max(0, POST_COMPOSE_ENTITY_LINK_MAX - attached.length);
        const rows = listAttachableEntities(section, filter, search);
        const emptyCopy = filter === 'mine'
            ? 'No creations here yet.'
            : 'Nothing from others matches this filter.';
        if (!rows.length) {
            return `<p class="lux-glass-dialog-hint social-neo-post-compose-attach-empty">${escape(emptyCopy)}</p>`;
        }
        return rows.map((row) => {
            const key = `${row.type}:${row.id}`;
            const alreadyAttached = attachedKeys.has(key);
            const atLimit = !alreadyAttached && remaining <= 0;
            const actionBtn = alreadyAttached
                ? `
                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="post-compose-entity-remove" data-entity-type="${escape(row.type)}" data-entity-id="${escape(row.id)}">
                        <i class="fas fa-check"></i> Attached
                    </button>
                `
                : `
                    <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="post-compose-attach-pick-add" data-entity-type="${escape(row.type)}" data-entity-id="${escape(row.id)}" ${atLimit ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> Add
                    </button>
                `;
            return `
                <article class="social-neo-entity-card social-neo-group-creator-member social-neo-post-compose-attach-card">
                    <div class="social-neo-person">
                        <span class="social-neo-avatar social-neo-avatar-sm is-fallback"><i class="fas ${escape(entityLinkIcon(row.type))}" aria-hidden="true"></i></span>
                        <div>
                            <strong>${escape(row.title)}</strong>
                            <span>${escape(row.subtitle)}</span>
                        </div>
                    </div>
                    ${actionBtn}
                </article>
            `;
        }).join('');
    }

    /** Patch attach picker results only — keep search/focus mounted. */    function renderPostComposeAttachDialog(runtime, dialog = activeDialog()) {
        const sectionId = text(dialog?.section || runtime.ui?.postComposeAttachSection || 'survey') || 'survey';
        const sectionMeta = POST_COMPOSE_ATTACH_SECTIONS.find((entry) => entry.id === sectionId)
            || POST_COMPOSE_ATTACH_SECTIONS.find((entry) => entry.id === 'survey')
            || { id: 'survey', label: 'Surveys', icon: 'fa-clipboard-list' };
        const filter = text(runtime.ui?.postComposeAttachFilter || 'mine') || 'mine';
        const search = text(runtime.ui?.postComposeAttachSearch || '');
        const searchId = controlId('postComposeAttachSearch');
        const attached = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
        const rows = listAttachableEntities(sectionId, filter, search);
        const countBadge = attached.length
            ? `<span class="lux-glass-dialog-submit-badge home-hover-chip">${escape(String(attached.length))}</span>`
            : '';
        return `<div class="lux-glass-dialog-backdrop lux-glass-dialog-backdrop--stacked-child lux-glass-dialog-backdrop--post-compose-attach" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Attach ${escape(sectionMeta.label)}">
            <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--post-compose-attach lux-glass-dialog-card lux-glass-dialog-card--social-glass sn-mat-modal" data-form="post-compose-attach" data-action="noop" data-lux-transparency-exempt="1" data-section="${escape(sectionMeta.id)}">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <strong class="lux-glass-dialog-title"><i class="fas ${escape(sectionMeta.icon)}" aria-hidden="true"></i> Attach · ${escape(sectionMeta.label)}</strong>
                        <span class="lux-glass-dialog-subtitle">Choose items to share on your Home post. Up to ${escape(String(POST_COMPOSE_ENTITY_LINK_MAX))} attachments.</span>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body lux-glass-dialog-body--post-compose-attach">
                    <div class="social-neo-post-compose-attach-toolbar" data-lux-transparency-exempt="1">
                        <div class="social-neo-badge-row" role="group" aria-label="Ownership filter">
                            <button class="lux-secondary-btn ${filter === 'mine' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="post-compose-attach-filter" data-filter="mine">My creations</button>
                            <button class="lux-secondary-btn ${filter === 'others' ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="post-compose-attach-filter" data-filter="others">Others / campus</button>
                        </div>
                        <label class="lux-glass-dialog-field social-neo-post-compose-attach-search" for="${escape(searchId)}">
                            <span class="social-neo-label">Search</span>
                            <input class="social-neo-input lux-control" id="${escape(searchId)}" name="postComposeAttachSearch" type="search" value="${escape(search)}" placeholder="Filter by name…" autocomplete="off">
                        </label>
                    </div>
                    <div class="social-neo-post-compose-attach-meta">
                        <span class="social-neo-post-compose-attach-count">${escape(String(rows.length))} available · ${escape(String(attached.length))} attached</span>
                    </div>
                    <div class="social-neo-list social-neo-post-compose-attach-results" data-lux-transparency-exempt="1">${renderPostComposeAttachResultsHtml(runtime)}</div>
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn social-neo-post-compose-attach-done" type="button" data-action="dialog-close"><i class="fas fa-check"></i> Done${countBadge}</button>
                </div>
            </div>
        </div>`;
    }

    /** Patch compose share/media chrome only — keep backdrop mounted to avoid flicker. */    function renderPostComposeDialog(runtime) {
        const currentScopeType = text(runtime.ui?.activeScopeType || 'profile') || 'profile';
        const currentScopeId = text(runtime.ui?.activeScopeId || currentUserId()) || currentUserId();
        const profileSettings = currentSocialProfileSettings();
        const currentAudience = text(runtime.ui?.composerAudience || profileSettings.defaultAudience || 'campus') || 'campus';
        const scopeOptions = postingScopeOptions();
        const composerTextId = controlId('composerText');
        const composerScopeId = controlId('composerScope');
        const composerAudienceId = controlId('composerAudience');
        const composerFileId = controlId('postFile');
        const firstName = displayName(currentUser()).split(' ')[0] || 'there';
        const entityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
        const attachBadge = entityLinks.length
            ? `<span class="lux-glass-dialog-submit-badge home-hover-chip">${escape(String(entityLinks.length))}</span>`
            : '';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--post-compose lux-glass-dialog-card--project-create lux-glass-dialog-card lux-glass-dialog-card--social-glass sn-mat-modal" data-form="post-compose" data-action="noop" data-lux-transparency-exempt="1">
                ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Create post', 'Write an update, add photos, then attach campus items to share on Home.', { icon: 'fas fa-pen' }) : ''}
                <div class="lux-glass-dialog-body lux-glass-dialog-body--project-create">
                    <section class="lux-glass-dialog-group-section">
                        <div class="lux-glass-dialog-section-head">
                            <strong>Basic info</strong>
                            <span>Message people will see on the Home feed.</span>
                        </div>
                        <label class="lux-glass-dialog-field" for="${escape(composerTextId)}">
                            <span class="social-neo-label">Message</span>
                            <textarea class="social-neo-textarea lux-control" id="${escape(composerTextId)}" name="composerText" rows="3" placeholder="What's on your mind, ${escape(firstName)}?" data-bind="composer-text">${escape(text(runtime.ui?.composerText || ''))}</textarea>
                        </label>
                    </section>
                    <section class="lux-glass-dialog-group-section">
                        <div class="lux-glass-dialog-section-head">
                            <strong>Audience</strong>
                            <span>Choose who you post as and who can see it.</span>
                        </div>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="lux-glass-dialog-field" for="${escape(composerScopeId)}">
                                <span class="social-neo-label">Posting as</span>
                                <select class="social-neo-select lux-control" id="${escape(composerScopeId)}" name="composerScope" data-bind="composer-scope" data-lux-picker>
                                    ${scopeOptions.map((option) => `<option value="${escape(`${option.type}:${option.id}`)}" ${currentScopeType === option.type && currentScopeId === option.id ? 'selected' : ''}>${escape(option.name)}</option>`).join('')}
                                </select>
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(composerAudienceId)}">
                                <span class="social-neo-label">Audience</span>
                                <select class="social-neo-select lux-control" id="${escape(composerAudienceId)}" name="composerAudience" data-bind="composer-audience" data-lux-picker>
                                    <option value="campus" ${currentAudience === 'campus' ? 'selected' : ''}>Campus</option>
                                    <option value="faculty" ${currentAudience === 'faculty' ? 'selected' : ''}>Faculty</option>
                                    <option value="connections" ${currentAudience === 'connections' ? 'selected' : ''}>Connections</option>
                                    <option value="group" ${currentAudience === 'group' ? 'selected' : ''}>Group members</option>
                                    <option value="page" ${currentAudience === 'page' ? 'selected' : ''}>Page followers</option>
                                </select>
                            </label>
                        </div>
                    </section>
                    <section class="lux-glass-dialog-group-section">
                        <div class="lux-glass-dialog-section-head">
                            <strong>Media</strong>
                            <span>Optional photo or story alongside the post.</span>
                        </div>
                        <div class="social-neo-post-compose-file-host">${renderFileChip(runtime.ui?.composerFile)}</div>
                        <div class="lux-glass-dialog-project-create-faculties">
                            <span class="social-neo-label">Attachments</span>
                            <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                <button class="lux-secondary-btn lux-secondary-btn-sm social-neo-composer-attach-btn" type="button" data-action="composer-attach"><i class="fas fa-image"></i> Photo</button>
                            </div>
                        </div>
                        <input id="${escape(composerFileId)}" name="postFile" type="file" accept="image/*" hidden>
                    </section>
                    ${renderPostComposeShareSection(runtime)}
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn" type="submit"><i class="fas fa-paper-plane"></i> Publish${attachBadge}</button>
                </div>
            </form>
        </div>`;
    }

    const FEED_OWNED_DIALOG_KINDS = new Set([
        'post-compose',
        'post-compose-attach',
        'post-edit',
        'post-share',
        'post-report',
        'post-delete',
        'post-comments',
        'comment-report',
        'comment-delete'
    ]);
    const FEED_OWNED_ACTION_DIALOG_CARD_CLASS = 'lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--compact lux-glass-dialog-card lux-glass-dialog-card--social-glass sn-mat-modal';

    function renderPostCommentsDialog(runtime, dialog, post, options = {}) {
        if (!post) return '';
        const stacked = Boolean(options.stacked);
        const commentAuthor = currentUser();
        const dialogComments = Array.isArray(post.comments) ? post.comments : [];
        const dialogNormalizedPostId = postKey(post);
        const dialogCommentDraft = String(runtime.ui?.commentDraftByPost?.[dialogNormalizedPostId] || '');
        const dialogCommentInputId = controlId('commentBody', dialogNormalizedPostId);
        const dialogCommentPlaceholder = 'Write a comment...';
        const dialogCommentSubmitLabel = 'Comment';
        const dialogCommentTotal = dialogComments.length + Number(post.replyCount || 0);
        const dialogPostAuthor = post.authorUserId ? (accountById(post.authorUserId) || { id: post.authorUserId, displayName: post.authorUserId }) : commentAuthor;
        const dialogPostReactionCounts = post?.reactionCounts || {};
        const dialogPostReactionTotal = Object.values(dialogPostReactionCounts).reduce((sum, count) => sum + Number(count || 0), 0);
        const dialogPostMedia = Array.isArray(post.media) ? post.media : [];
        const dialogSharedPost = post.sharedPost;
        const dialogScopeBadge = post.scopeType === 'page'
            ? `Page - ${text(post.scopeName || 'Page')}`
            : post.scopeType === 'group'
                ? `Group - ${text(post.scopeName || 'Group')}`
                : 'Profile';
        const dialogSubtitle = dialogCommentTotal
            ? `${dialogCommentTotal} comment${dialogCommentTotal === 1 ? '' : 's'} on this post.`
            : 'Be the first to reply to this post.';
        const backdropClass = stacked
            ? 'lux-glass-dialog-backdrop lux-glass-dialog-backdrop--comments-anchor'
            : 'lux-glass-dialog-backdrop';
        return `<div class="${backdropClass}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Comments"${stacked ? ' aria-hidden="true"' : ''}>
            <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--comments lux-glass-dialog-card lux-glass-dialog-card--social-glass lux-studio-panel sns-comments-dialog" data-action="noop" data-lux-transparency-exempt="1">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head lux-studio-head social-neo-surveys-hero-head">
                    <div class="social-neo-surveys-hero-copy">
                        <span class="social-neo-section-kicker">Post</span>
                        <h2>Comments</h2>
                        <p class="lux-glass-dialog-comment-subtitle">${escape(dialogSubtitle)}</p>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-surveys-hero-stats social-neo-surveys-hero-stats--triple social-neo-panel-dialog-stats social-neo-dialog-comment-stats">
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(dialogPostReactionTotal))}</strong><span>Reactions</span></article>
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(dialogCommentTotal))}</strong><span>Comments</span></article>
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(dialogScopeBadge)}</strong><span>Scope</span></article>
                </div>
                <div class="lux-glass-dialog-comment-scroll">
                <div class="lux-glass-dialog-comment-preview lux-soft-chrome home-hover-chip">
                    <div class="lux-glass-dialog-comment-post-head">
                        <div class="social-neo-person social-neo-person-start-gap-10">
                            ${avatar(dialogPostAuthor, 'social-neo-avatar-sm')}
                            <div>
                                <strong>${escape(displayName(dialogPostAuthor))}</strong>
                                <span class="social-neo-muted">${escape(accountSubtitle(dialogPostAuthor))} &middot; ${escape(when(post.createdAt))}</span>
                            </div>
                        </div>
                        <span class="social-neo-pill home-hover-chip social-neo-post-scope-badge">${escape(dialogScopeBadge)}</span>
                    </div>
                    ${text(post.body || post.text || '') ? `<div class="lux-glass-dialog-comment-post-body">${escape(text(post.body || post.text || ''))}</div>` : ''}
                    ${dialogPostMedia.map((media) => filePreview(media)).join('')}
                    ${dialogSharedPost ? `
                        <div class="social-neo-shared">
                            <span class="social-neo-pill home-hover-chip">Shared post</span>
                            <strong>${escape(displayName(dialogSharedPost.authorUserId))}</strong>
                            <p>${escape(dialogSharedPost.body || dialogSharedPost.text || 'Original post')}</p>
                        </div>
                    ` : ''}
                    ${(dialogPostReactionTotal || dialogCommentTotal) ? `
                        <div class="lux-glass-dialog-comment-post-metrics">
                            ${renderPostReactionMetrics(dialogPostReactionCounts)}
                            ${dialogCommentTotal ? `<span class="social-neo-post-metric">${escape(dialogCommentTotal)} comment${dialogCommentTotal === 1 ? '' : 's'}</span>` : ''}
                            ${Number(post.shareCount || 0) > 0 ? `<span class="social-neo-post-metric">${escape(post.shareCount)} share${post.shareCount !== 1 ? 's' : ''}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="lux-glass-dialog-comment-thread" id="lux-glass-dialog-comment-thread">
                    ${dialogComments.length ? renderCommentThread(dialogComments, post, 'dialog') : '<div class="social-neo-empty">No comments yet. Be the first to reply.</div>'}
                </div>
                </div>
                <form class="lux-glass-dialog-comment-compose sns-comment-compose lux-soft-chrome home-hover-chip" data-form="dialog-comment" data-post-id="${escape(dialogNormalizedPostId)}">
                    ${avatar(commentAuthor, 'social-neo-avatar-sm')}
                    <div class="lux-glass-dialog-comment-compose-main">
                        <div class="social-neo-inline social-neo-comment-compose-row">
                            <input class="social-neo-input lux-control" id="${escape(dialogCommentInputId)}" type="text" name="commentBody" placeholder="${escape(dialogCommentPlaceholder)}" aria-label="${escape(dialogCommentPlaceholder)}" value="${escape(dialogCommentDraft)}">
                            <button class="lux-primary-btn" type="submit">${dialogCommentSubmitLabel}</button>
                        </div>
                    </div>
                    <input type="hidden" name="postId" value="${escape(dialogNormalizedPostId)}">
                </form>
            </div>
        </div>`;
    }

    function renderCommentDeleteConfirmDialog(runtime, dialog, post, options = {}) {
        const stacked = Boolean(options.stacked);
        const backdropClass = stacked
            ? 'lux-glass-dialog-backdrop lux-glass-dialog-backdrop--stacked-child lux-glass-dialog-backdrop--comment-delete'
            : 'lux-glass-dialog-backdrop';
        if (!post) {
            // eslint-disable-next-line no-console
            console.warn('[comment-delete] post not in feed', { postId: dialog.postId, feedSize: Array.isArray(state().feed) ? state().feed.length : 0 });
            return `<div class="${backdropClass}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Delete comment">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--compact lux-glass-dialog-card--comment-delete lux-glass-dialog-card lux-glass-dialog-card--social-glass social-neo-delete-confirm" data-lux-transparency-exempt="1">
                    <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                        <div class="lux-glass-dialog-heading">
                            <span class="social-neo-delete-confirm-icon-chip home-hover-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                            <div class="social-neo-delete-confirm-title">
                                <strong class="lux-glass-dialog-title">Delete comment</strong>
                                <span class="lux-glass-dialog-subtitle">Post unavailable.</span>
                            </div>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-delete-confirm-preview social-neo-delete-confirm-preview--empty">
                        <p>The post for this comment could not be located. Cancel and refresh.</p>
                    </div>
                    <div class="social-neo-delete-confirm-actions">
                        <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    </div>
                </div>
            </div>`;
        }
        const targetComment = findCommentInThread(post.comments, dialog.commentId);
        const commentAuthor = targetComment
            ? (accountById(targetComment.authorUserId) || { id: targetComment.authorUserId, displayName: targetComment.authorName || targetComment.authorUserId })
            : null;
        const previewText = targetComment
            ? text(targetComment.body || targetComment.text || 'This comment has no text.')
            : 'This comment could not be located. Cancel and try again.';
        const previewAuthor = commentAuthor
            ? `<div class="social-neo-delete-confirm-author">
                    ${avatar(commentAuthor, 'social-neo-avatar-sm')}
                    <div class="social-neo-delete-confirm-author-meta">
                        <strong>${escape(displayName(commentAuthor))}</strong>
                        <span>${escape(when(targetComment.createdAt))}</span>
                    </div>
               </div>`
            : '';
        const debugNote = targetComment
            ? ''
            : `<div class="social-neo-delete-confirm-debug">debug: postId=${escape(text(post.id))} commentId=${escape(text(dialog.commentId))}</div>`;
        if (!targetComment) {
            // eslint-disable-next-line no-console
            console.warn('[comment-delete] comment lookup missed', { postId: post.id, commentId: dialog.commentId, commentCount: Array.isArray(post.comments) ? post.comments.length : 0 });
        }
        return `<div class="${backdropClass}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Delete comment">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--compact lux-glass-dialog-card--comment-delete lux-glass-dialog-card lux-glass-dialog-card--social-glass social-neo-delete-confirm" data-form="dialog-comment-delete" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-delete-confirm-accent" aria-hidden="true"></div>
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <span class="social-neo-delete-confirm-icon-chip home-hover-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                        <div class="social-neo-delete-confirm-title">
                            <strong class="lux-glass-dialog-title">Delete comment</strong>
                            <span class="lux-glass-dialog-subtitle">This cannot be undone.</span>
                        </div>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-delete-confirm-preview">
                    ${previewAuthor}
                    <blockquote class="social-neo-delete-confirm-quote">${escape(previewText)}</blockquote>
                    ${debugNote}
                </div>
                <div class="social-neo-delete-confirm-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-btn-danger lux-glass-dialog-submit-btn" type="submit" ${targetComment ? '' : 'disabled'}>Delete comment</button>
                </div>
                <input type="hidden" name="postId" value="${escape(text(post.id))}">
                <input type="hidden" name="commentId" value="${escape(text(targetComment?.id || dialog.commentId || ''))}">
            </form>
        </div>`;
    }

    function renderFeedOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!FEED_OWNED_DIALOG_KINDS.has(kind)) return '';
        if (kind === 'post-compose') {
            return renderPostComposeDialog(runtime || state());
        }
        if (kind === 'post-compose-attach') {
            return renderPostComposeAttachDialog(runtime || state(), dialog);
        }
        const post = (kind.startsWith('post-') || kind === 'comment-delete' || kind === 'comment-report')
            ? (Array.isArray(state().feed) ? state().feed : []).find((item) => postKey(item) === postKey(dialog.postId))
            : null;
        if (kind === 'post-edit' && post) {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Edit post">
                <form class="${FEED_OWNED_ACTION_DIALOG_CARD_CLASS}" data-form="dialog-post-edit" data-action="noop" data-lux-transparency-exempt="1">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Edit post', 'Refine the post without leaving the feed.') : ''}
                    <textarea class="social-neo-textarea lux-control" name="dialogBody" rows="6" placeholder="Update your post...">${escape(text(dialog.body || post.body || post.text || ''))}</textarea>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Save changes' }) : ''}
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'post-share' && post) {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Share post">
                <form class="${FEED_OWNED_ACTION_DIALOG_CARD_CLASS}" data-form="dialog-post-share" data-action="noop" data-lux-transparency-exempt="1">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Share post', 'Add context before it goes back into the stream.') : ''}
                    <textarea class="social-neo-textarea lux-control" name="dialogNote" rows="4" placeholder="Say something about this...">${escape(text(dialog.note || ''))}</textarea>
                    <div class="lux-glass-dialog-preview">${escape(text(post.body || post.text || 'Original post'))}</div>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Share now' }) : ''}
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'post-report' && post) {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Report post">
                <form class="${FEED_OWNED_ACTION_DIALOG_CARD_CLASS}" data-form="dialog-post-report" data-action="noop" data-lux-transparency-exempt="1">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Report post', 'Explain what is wrong with this content.') : ''}
                    <textarea class="social-neo-textarea lux-control" name="dialogReason" rows="4" placeholder="Spam, harassment, misleading information...">${escape(text(dialog.reason || 'Inappropriate or misleading'))}</textarea>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Submit report' }) : ''}
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'comment-report') {
            const reportPost = (Array.isArray(state().feed) ? state().feed : []).find((item) => postKey(item) === postKey(dialog.postId));
            const comment = findCommentInThread(reportPost?.comments, dialog.commentId);
            if (!comment) return '';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Report comment">
                <form class="${FEED_OWNED_ACTION_DIALOG_CARD_CLASS}" data-form="dialog-comment-report" data-action="noop" data-lux-transparency-exempt="1">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Report comment', 'Explain what is wrong with this comment.') : ''}
                    <div class="lux-glass-dialog-preview">${escape(text(comment.body || comment.text || 'Comment'))}</div>
                    <textarea class="social-neo-textarea lux-control" name="dialogReason" rows="4" placeholder="Spam, harassment, misleading information...">${escape(text(dialog.reason || 'Inappropriate or misleading'))}</textarea>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Submit report' }) : ''}
                    <input type="hidden" name="postId" value="${escape(postKey(dialog.postId))}">
                    <input type="hidden" name="commentId" value="${escape(text(dialog.commentId))}">
                    <input type="hidden" name="targetOwnerId" value="${escape(text(comment.authorUserId || ''))}">
                </form>
            </div>`;
        }
        if (kind === 'comment-delete') {
            const stacked = text(runtime?.ui?.previousDialog?.type || '') === 'post-comments';
            const deleteMarkup = renderCommentDeleteConfirmDialog(runtime, dialog, post, { stacked });
            if (stacked) {
                const parent = runtime?.ui?.previousDialog;
                const parentPost = (Array.isArray(state().feed) ? state().feed : [])
                    .find((item) => postKey(item) === postKey(parent?.postId));
                if (parentPost) {
                    return `<div class="social-comments-dialog-stack">${renderPostCommentsDialog(runtime, parent, parentPost, { stacked: true })}${deleteMarkup}</div>`;
                }
            }
            return deleteMarkup;
        }
        if (kind === 'post-delete' && post) {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Delete post">
                <form class="${FEED_OWNED_ACTION_DIALOG_CARD_CLASS}" data-form="dialog-post-delete" data-action="noop" data-lux-transparency-exempt="1">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Delete post', 'This removes the post from the social feed.') : ''}
                    <div class="lux-glass-dialog-preview">${escape(text(post.body || post.text || 'This post has no text.'))}</div>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Delete post' }) : ''}
                    <input type="hidden" name="postId" value="${escape(text(post.id))}">
                </form>
            </div>`;
        }
        if (kind === 'post-comments' && post) {
            return renderPostCommentsDialog(runtime, dialog, post);
        }
        return '';
    }

    __kiuFeedExpose({
        renderFeedHero,
        renderFeedPanel,
        renderPostComposeShareSection,
        renderPostComposeAttachResultsHtml,
        renderPostComposeAttachDialog,
        renderPostComposeDialog,
        renderFeedOwnedDialog,
        FEED_OWNED_DIALOG_KINDS,
    });

    function isSocialFeedClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        if (a === 'focus-feed' || a === 'feed-refresh') return true;
        return a.startsWith('post-') || a.startsWith('comment-') || a.startsWith('story-');
    }

    function handleSocialFeedClick(action, trigger) {
        if (!isSocialFeedClickAction(action)) return false;
        if (action === 'story-add') {
            if (typeof openPortalStoryComposer === 'function') openPortalStoryComposer();
            return;
        }

        if (action === 'story-view') {
            const userId = trigger.getAttribute('data-user-id');
            if (typeof openPortalStoryViewer === 'function') {
                const stories = (typeof getPortalSocialStoryItems === 'function' ? getPortalSocialStoryItems() : []) || [];
                const index = stories.findIndex((story) => text(story?.authorUserId || story?.userId || story?.authorId) === text(userId));
                openPortalStoryViewer(index >= 0 ? index : 0);
            }
            return;
        }

        if (action === 'story-close-viewer') {
            if (typeof closePortalStoryViewer === 'function') closePortalStoryViewer();
            return;
        }

        if (action === 'story-next') {
            if (typeof nextPortalStory === 'function') nextPortalStory();
            return;
        }

        if (action === 'story-prev') {
            if (typeof prevPortalStory === 'function') prevPortalStory();
            return;
        }

        if (action === 'story-close-composer') {
            if (typeof closePortalStoryComposer === 'function') closePortalStoryComposer();
            return;
        }

        if (action === 'feed-refresh') return withBusy(() => refreshPortalSocialFeed(true));

        if (action === 'post-compose-open') {
            const runtime = state();
            runtime.ui.postComposeAttachSection = text(runtime.ui?.postComposeAttachSection || 'survey') || 'survey';
            runtime.ui.postComposeAttachFilter = text(runtime.ui?.postComposeAttachFilter || 'mine') || 'mine';
            runtime.ui.postComposeAttachSearch = text(runtime.ui?.postComposeAttachSearch || '');
            runtime.ui.composerEntityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
            return openDialog('post-compose', {});
        }

        if (action === 'post-compose-attach-section') {
            const runtime = state();
            if (text(activeDialog()?.type || '') !== 'post-compose') return;
            const requestedSection = text(trigger.getAttribute('data-section') || '').toLowerCase();
            const section = POST_COMPOSE_ATTACH_SECTIONS.some((entry) => entry.id === requestedSection)
                ? requestedSection
                : (text(runtime.ui?.postComposeAttachSection || 'survey') || 'survey');
            const mineRows = listAttachableEntities(section, 'mine', '');
            runtime.ui.postComposeAttachSection = section;
            runtime.ui.postComposeAttachFilter = mineRows.length ? 'mine' : 'others';
            runtime.ui.postComposeAttachSearch = '';
            return openDialog('post-compose-attach', { section });
        }

        if (action === 'post-compose-attach-filter') {
            const runtime = state();
            if (text(activeDialog()?.type || '') !== 'post-compose-attach') return;
            runtime.ui.postComposeAttachFilter = text(trigger.getAttribute('data-filter') || 'mine') || 'mine';
            if (patchPostComposeAttachDialog(runtime)) return;
            return renderSocialPageNow('post-compose-attach-filter');
        }

        if (action === 'post-compose-attach-pick-add') {
            const runtime = state();
            if (text(activeDialog()?.type || '') !== 'post-compose-attach') return;
            const type = text(trigger.getAttribute('data-entity-type') || '').toLowerCase();
            const id = text(trigger.getAttribute('data-entity-id') || '');
            if (!type || !id) return;
            const existing = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
            if (existing.some((item) => item.type === type && item.id === id)) return;
            if (existing.length >= POST_COMPOSE_ENTITY_LINK_MAX) return;
            runtime.ui.composerEntityLinks = normalizeComposerEntityLinks([...existing, { type, id }]);
            if (patchPostComposeAttachDialog(runtime)) return;
            return renderSocialPageNow('post-compose-attach-pick-add');
        }

        if (action === 'post-compose-entity-remove') {
            const runtime = state();
            const dialogType = text(activeDialog()?.type || '');
            if (dialogType !== 'post-compose' && dialogType !== 'post-compose-attach') return;
            const type = text(trigger.getAttribute('data-entity-type') || '').toLowerCase();
            const id = text(trigger.getAttribute('data-entity-id') || '');
            runtime.ui.composerEntityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks)
                .filter((item) => !(item.type === type && item.id === id));
            if (dialogType === 'post-compose-attach') {
                if (patchPostComposeAttachDialog(runtime)) return;
                return renderSocialPageNow('post-compose-entity-remove');
            }
            if (patchPostComposeDialog(runtime)) return;
            return renderSocialPageNow('post-compose-entity-remove');
        }

        if (action === 'focus-feed') return withBusy(() => focusFeed(trigger.getAttribute('data-scope-type'), trigger.getAttribute('data-scope-id')));

        if (action === 'post-focus-comment') {
            return openDialog('post-comments', { postId: trigger.getAttribute('data-post-id') });
        }

        if (action === 'post-submit') {
            if (!trigger.closest('.social-neo-composer-card') && !trigger.closest('form[data-form="post-compose"]')) {
                setPanel('feed');
                window.requestAnimationFrame(() => {
                    const host = root();
                    scrollSocialCenterElementIntoView('.social-neo-composer-cta-card, .social-neo-composer-card', host, 'smooth');
                    host?.querySelector('[data-action="post-compose-open"]')?.focus({ preventScroll: true });
                });
                return;
            }
            const runtime = state();
            const composerTextarea = (trigger.closest('form[data-form="post-compose"]') || root())?.querySelector('[data-bind="composer-text"]');
            const body = text(composerTextarea?.value || runtime.ui?.composerText || '');
            const file = runtime.ui?.composerFile || null;
            const entityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
            const scopeType = text(runtime.ui?.activeScopeType || 'profile') || 'profile';
            const scopeId = text(runtime.ui?.activeScopeId || currentUserId()) || currentUserId();
            const scope = postingScopeOptions().find((item) => item.type === scopeType && item.id === scopeId);
            return withBusy(async () => {
                if (!body && !file && !entityLinks.length) throw new Error('Write a post, attach a file, or attach a campus item first.');
                await submitSocialPost(body, {
                    file,
                    audience: text(runtime.ui?.composerAudience || 'campus') || 'campus',
                    scopeType,
                    scopeId,
                    scopeName: scope?.name || '',
                    entityLinks
                });
                clearPostComposeDraft(runtime);
                if (text(activeDialog()?.type || '') === 'post-compose') closeDialog();
                else renderSocialPageNow('post-submit');
            });
        }

        if (action === 'post-react') {
            const reactionType = text(trigger.getAttribute('data-reaction-type') || 'like') || 'like';
            const postId = trigger.getAttribute('data-post-id');
            return withBusy(async () => {
                await reactToPortalSocialPost(postId, reactionType);
                // reactToPost already patches optimistically; only rebuild if DOM missing.
                if (!patchPostReactions(postId) && !patchPhotographyFeedReactions(postId)) {
                    renderSocialPageNow('post-react');
                }
            });
        }

        if (action === 'post-pin') {
            const postId = trigger.getAttribute('data-post-id');
            return withBusy(async () => {
                await pinPortalSocialPost(postId);
                renderSocialPageNow('post-pin');
            });
        }

        if (action === 'comment-react') {
            if (typeof reactToPortalSocialComment !== 'function') {
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Social runtime not ready.', 'danger');
                return;
            }
            const reactPostId = postKey(trigger.getAttribute('data-post-id'));
            const reactCommentId = text(trigger.getAttribute('data-comment-id'));
            const reactionKey = `${reactPostId}:${reactCommentId}`;
            if (pendingCommentReactions.has(reactionKey)) return;
            pendingCommentReactions.add(reactionKey);
            const inDialog = isCommentDialog();
            return withBusy(async () => {
                try {
                    const updatedPost = await reactToPortalSocialComment(
                        trigger.getAttribute('data-post-id'),
                        trigger.getAttribute('data-comment-id'),
                        text(trigger.getAttribute('data-reaction-type') || 'like') || 'like'
                    );
                    // Surgically swap only this comment's reaction chips — no dialog re-render.
                    if (inDialog && updatedPost) patchCommentReactions(updatedPost, reactCommentId);
                } finally {
                    pendingCommentReactions.delete(reactionKey);
                }
            });
        }

        if (action === 'comment-reply') {
            const postId = postKey(trigger.getAttribute('data-post-id'));
            const commentId = text(trigger.getAttribute('data-comment-id'));
            const authorName = text(trigger.getAttribute('data-author-name') || 'member');
            const runtime = state();
            runtime.ui = runtime.ui || {};
            runtime.ui.commentReplyTargetByPost = runtime.ui.commentReplyTargetByPost || {};
            // Only one open inline composer at a time — collapse any previous target.
            const prevTarget = runtime.ui.commentReplyTargetByPost[postId];
            runtime.ui.commentReplyTargetByPost[postId] = { commentId, authorName };
            runtime.ui.commentReplyFocusPostId = postId;
            if (isCommentDialog()) {
                if (prevTarget && text(prevTarget.commentId) !== commentId) closeInlineReply(prevTarget.commentId);
                const post = (Array.isArray(state().feed) ? state().feed : []).find((item) => postKey(item) === postId);
                openInlineReply(post, commentId, authorName);
            } else {
                renderSocialPageNow('comment-reply');
                window.requestAnimationFrame(() => {
                    const input = document.getElementById(`social-reply-input-${commentId}`);
                    input?.focus?.({ preventScroll: true });
                    input?.scrollIntoView?.({ block: 'nearest' });
                });
            }
            return;
        }

        if (action === 'comment-reply-cancel') {
            const postId = postKey(trigger.getAttribute('data-post-id'));
            const commentId = text(trigger.getAttribute('data-comment-id'));
            const runtime = state();
            runtime.ui = runtime.ui || {};
            if (runtime.ui.commentReplyTargetByPost) delete runtime.ui.commentReplyTargetByPost[postId];
            if (postKey(runtime.ui.commentReplyFocusPostId) === postId) delete runtime.ui.commentReplyFocusPostId;
            if (isCommentDialog()) {
                closeInlineReply(commentId);
            } else {
                renderSocialPageNow('comment-reply-cancel');
            }
            return;
        }

        if (action === 'comment-report') {
            return openDialog('comment-report', {
                postId: postKey(trigger.getAttribute('data-post-id')),
                commentId: text(trigger.getAttribute('data-comment-id'))
            });
        }

        if (action === 'comment-delete') {
            const delPostId = postKey(trigger.getAttribute('data-post-id'));
            const delCommentId = text(trigger.getAttribute('data-comment-id'));
            return openDialog('comment-delete', { postId: delPostId, commentId: delCommentId });
        }

        if (action === 'post-save') {
            const postId = trigger.getAttribute('data-post-id');
            return withBusy(async () => {
                await toggleSavedPost(postId);
                if (!patchPostSaveButtons(postId)) renderSocialPageNow('post-save');
            });
        }

        if (action === 'post-delete') return openDialog('post-delete', { postId: trigger.getAttribute('data-post-id') });

        if (action === 'post-edit') {
            const post = (Array.isArray(state().feed) ? state().feed : []).find((item) => text(item.id) === text(trigger.getAttribute('data-post-id')));
            return openDialog('post-edit', { postId: trigger.getAttribute('data-post-id'), body: text(post?.body || post?.text || '') });
        }

        if (action === 'post-share') return openDialog('post-share', { postId: trigger.getAttribute('data-post-id') });

        if (action === 'post-report') return openDialog('post-report', { postId: trigger.getAttribute('data-post-id') });
        return false;
    }

    __kiuFeedExpose({
        handleSocialFeedClick,
        isSocialFeedClickAction,
    });

    function isSocialFeedSubmitForm(formType) {
        const f = text(formType || '');
        if (!f) return false;
        if (f === 'post-compose' || f === 'comment' || f === 'dialog-comment' || f === 'add-story') return true;
        return f.startsWith('dialog-post-') || f.startsWith('dialog-comment-');
    }

    function handleSocialFeedSubmit(formType, form, runtime, event) {
        if (!isSocialFeedSubmitForm(formType)) return false;
        if (formType === 'post-compose') {
            const body = text(form.composerText?.value || runtime.ui?.composerText || '');
            const file = runtime.ui?.composerFile || null;
            const entityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
            const scopeType = text(runtime.ui?.activeScopeType || 'profile') || 'profile';
            const scopeId = text(runtime.ui?.activeScopeId || currentUserId()) || currentUserId();
            const scope = postingScopeOptions().find((item) => item.type === scopeType && item.id === scopeId);
            return withBusy(async () => {
                if (!body && !file && !entityLinks.length) throw new Error('Write a post, attach a file, or attach a campus item first.');
                if (typeof submitSocialPost !== 'function') throw new Error('Post publishing is unavailable.');
                await submitSocialPost(body, {
                    file,
                    audience: text(runtime.ui?.composerAudience || 'campus') || 'campus',
                    scopeType,
                    scopeId,
                    scopeName: scope?.name || '',
                    entityLinks
                });
                clearPostComposeDraft(runtime);
                closeDialog();
                if (typeof refreshPortalSocialFeed === 'function') await refreshPortalSocialFeed(true);
                renderSocialPageNow('post-submit');
            });
        }

        if (formType === 'comment') {
            return withBusy(async () => {
                const postId = postKey(form.getAttribute('data-post-id'));
                const commentInput = form.querySelector('[name="commentBody"]');
                // Inline reply forms carry their parent id; the top-level box has none.
                const replyCommentId = text(form.getAttribute('data-reply-comment-id'));
                if (!replyCommentId && commentInput) syncCommentDraftFromTarget(commentInput);
                runtime.ui.commentDraftByPost = runtime.ui.commentDraftByPost || {};
                const bodySource = event.target?.name === 'commentBody' ? event.target : commentInput;
                const body = text(bodySource?.value || (replyCommentId ? '' : runtime.ui.commentDraftByPost?.[postId]));
                if (!body) throw new Error('Comment body is required.');
                await commentOnPortalSocialPost(postId, body, {
                    parentCommentId: replyCommentId || '',
                    replyToCommentId: replyCommentId || ''
                });
                if (!replyCommentId) runtime.ui.commentDraftByPost[postId] = '';
                if (runtime.ui.commentReplyTargetByPost) delete runtime.ui.commentReplyTargetByPost[postId];
                renderSocialPageNow('comment-created');
            });
        }

        if (formType === 'dialog-comment') {
            return withBusy(async () => {
                const postId = postKey(form.getAttribute('data-post-id') || form.postId?.value);
                const commentInput = form.querySelector('[name="commentBody"]');
                runtime.ui.commentDraftByPost = runtime.ui.commentDraftByPost || {};
                const replyCommentId = text(form.getAttribute('data-reply-comment-id'));
                // Inline reply: post the nested reply, then surgically append it and
                // collapse the inline composer — no dialog re-render, no flicker.
                if (replyCommentId) {
                    const replyBody = text(commentInput?.value || '');
                    if (!replyBody) throw new Error('Comment body is required.');
                    const updatedReplyPost = await commentOnPortalSocialPost(postId, replyBody, {
                        parentCommentId: replyCommentId,
                        replyToCommentId: replyCommentId,
                        skipRender: true
                    });
                    if (runtime.ui.commentReplyTargetByPost) delete runtime.ui.commentReplyTargetByPost[postId];
                    if (updatedReplyPost) {
                        appendReplyNode(updatedReplyPost, replyCommentId);
                        patchCommentDialogCount(updatedReplyPost);
                    }
                    closeInlineReply(replyCommentId);
                    return;
                }
                const body = text(commentInput?.value || runtime.ui.commentDraftByPost?.[postId]);
                if (!body) throw new Error('Comment body is required.');
                const thread = document.getElementById('lux-glass-dialog-comment-thread');
                const priorIds = new Set(
                    thread
                        ? Array.from(thread.querySelectorAll('[data-comment-id]')).map((n) => String(n.getAttribute('data-comment-id') || ''))
                        : []
                );
                const updatedPost = await commentOnPortalSocialPost(postId, body, {
                    parentCommentId: '',
                    replyToCommentId: '',
                    skipRender: true
                });
                runtime.ui.commentDraftByPost[postId] = '';
                const freshComments = Array.isArray(updatedPost?.comments) ? updatedPost.comments : [];
                const collectIds = (list, out = new Set()) => {
                    for (const c of list) {
                        if (c?.id) out.add(String(c.id));
                        if (Array.isArray(c?.replies) && c.replies.length) collectIds(c.replies, out);
                    }
                    return out;
                };
                const nextIds = collectIds(freshComments);
                if (thread && nextIds.size > priorIds.size) {
                    const emptyNode = thread.querySelector('.social-neo-empty');
                    if (emptyNode) emptyNode.remove();
                    let list = thread.querySelector('.social-neo-comment-list');
                    if (!list) {
                        list = document.createElement('div');
                        list.className = 'social-neo-comment-list';
                        thread.appendChild(list);
                    }
                    const appendNew = (comments, parentEl, depth) => {
                        for (const comment of comments) {
                            if (!comment?.id) continue;
                            const cid = String(comment.id);
                            const existingNode = parentEl.querySelector(`:scope > article[data-comment-id="${CSS.escape(cid)}"]`);
                            if (existingNode) {
                                if (Array.isArray(comment.replies) && comment.replies.length) {
                                    let children = existingNode.querySelector(':scope > .social-neo-comment-children');
                                    if (!children) {
                                        children = document.createElement('div');
                                        children.className = 'social-neo-comment-children';
                                        existingNode.appendChild(children);
                                    }
                                    appendNew(comment.replies, children, depth + 1);
                                }
                                continue;
                            }
                            const holder = document.createElement('div');
                            holder.innerHTML = renderCommentNode(comment, updatedPost, depth, 'dialog');
                            const newNode = holder.firstElementChild;
                            if (newNode) parentEl.appendChild(newNode);
                            if (Array.isArray(comment.replies) && comment.replies.length && newNode) {
                                const children = newNode.querySelector('.social-neo-comment-children');
                                if (children) appendNew(comment.replies, children, depth + 1);
                            }
                        }
                    };
                    appendNew(freshComments, list, 0);
                }
                if (updatedPost) patchCommentDialogCount(updatedPost);
                window.requestAnimationFrame(() => {
                    if (thread) thread.scrollTop = thread.scrollHeight;
                    const freshInput = document.getElementById(controlId('commentBody', postId));
                    if (freshInput) {
                        freshInput.value = '';
                        freshInput.focus?.({ preventScroll: true });
                    }
                });
            });
        }

        if (formType === 'add-story') {
            return withBusy(async () => {
                const mediaUrl = text(form.storyMediaUrl?.value || '') || await readFileAsDataUrl(runtime.ui?.storyFile || null);
                const caption = text(form.storyCaption?.value || '');
                if (!mediaUrl) throw new Error('Please provide an image URL.');
                await submitPortalStory({ mediaUrl, caption });
                form.storyMediaUrl.value = '';
                form.storyCaption.value = '';
                runtime.ui.storyFile = null;
                runtime.ui.storyMediaUrl = '';
                runtime.ui.storyCaption = '';
                renderSocialPageNow('story-created');
            });
        }

        if (formType === 'dialog-post-edit') {
            return withBusy(async () => {
                await updatePortalSocialPost(text(form.postId?.value), text(form.dialogBody?.value));
                closeDialog();
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('post-updated');
            });
        }

        if (formType === 'dialog-post-share') {
            return withBusy(async () => {
                await sharePortalSocialPost(text(form.postId?.value), text(form.dialogNote?.value));
                closeDialog();
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('post-shared');
            });
        }

        if (formType === 'dialog-post-report') {
            return withBusy(async () => {
                await reportSocialPost(text(form.postId?.value), text(form.dialogReason?.value));
                closeDialog();
                renderSocialPageNow('post-report');
            });
        }

        if (formType === 'dialog-comment-report') {
            return withBusy(async () => {
                await reportPortalSocialContent(
                    'comment',
                    text(form.commentId?.value),
                    text(form.dialogReason?.value),
                    text(form.targetOwnerId?.value)
                );
                closeDialog();
                renderSocialPageNow('comment-report');
            });
        }

        if (formType === 'dialog-post-delete') {
            return withBusy(async () => {
                await deletePortalSocialPost(text(form.postId?.value));
                closeDialog();
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('post-deleted');
            });
        }

        if (formType === 'dialog-comment-delete') {
            return withBusy(async () => {
                const postId = postKey(form.postId?.value);
                const commentId = text(form.commentId?.value);
                if (!postId || !commentId) return;
                if (typeof removePortalSocialComment !== 'function') {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Social runtime not ready.', 'danger');
                    return;
                }
                const updatedPost = await removePortalSocialComment(postId, commentId);
                const thread = document.getElementById('lux-glass-dialog-comment-thread');
                const article = thread?.querySelector(`article.social-neo-comment[data-comment-id="${CSS.escape(commentId)}"]`);
                if (article?.parentNode) article.parentNode.removeChild(article);
                if (thread) {
                    const list = thread.querySelector('.social-neo-comment-list');
                    const hasAny = Boolean(list && list.querySelector('article.social-neo-comment'));
                    if (!hasAny && list) {
                        list.remove();
                        if (!thread.querySelector('.social-neo-empty')) {
                            const empty = document.createElement('div');
                            empty.className = 'social-neo-empty';
                            empty.textContent = 'No comments yet. Be the first to reply.';
                            thread.appendChild(empty);
                        }
                    }
                    if (updatedPost) patchCommentDialogCount(updatedPost);
                }
                restorePreviousDialog();
            });
        }
        return false;
    }

    __kiuFeedExpose({
        handleSocialFeedSubmit,
        isSocialFeedSubmitForm,
    });

    function isSocialFeedInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('[data-bind="composer-text"]')) return true;
        if (target.matches('form[data-form="post-compose-attach"] [name="postComposeAttachSearch"]')) return true;
        if (target.matches('form[data-form="add-story"] [name="storyCaption"], form[data-form="add-story"] [name="storyMediaUrl"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialFeedInput(target, runtime, event) {
        if (!isSocialFeedInputTarget(target)) return false;
        if (target.matches('[data-bind="composer-text"]')) runtime.ui.composerText = target.value;
        if (target.matches('form[data-form="post-compose-attach"] [name="postComposeAttachSearch"]')) {
            runtime.ui.postComposeAttachSearch = target.value;
            if (text(activeDialog()?.type || '') === 'post-compose-attach') {
                window.clearTimeout(runtime.ui.__postComposeAttachSearchTimer);
                runtime.ui.__postComposeAttachSearchTimer = window.setTimeout(() => {
                    if (text(activeDialog()?.type || '') !== 'post-compose-attach') return;
                    if (patchPostComposeAttachDialog(runtime)) return;
                    renderSocialPageNow('post-compose-attach-search');
                }, 160);
            }
            return;
        }
        if (target.matches('form[data-form="add-story"] [name="storyCaption"]')) runtime.ui.storyCaption = target.value;
        if (target.matches('form[data-form="add-story"] [name="storyMediaUrl"]')) runtime.ui.storyMediaUrl = target.value;

        return true;
    }

    function isSocialFeedChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('form[data-form="post-compose-attach"] [name="postComposeAttachSearch"]')) return true;
        if (target.matches('[data-bind="composer-scope"], [data-bind="composer-audience"], [data-bind="feed-scope"]')) return true;
        if (target.name === 'postFile' || target.name === 'storyFile') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialFeedChange(target, runtime, event) {
        if (!isSocialFeedChangeTarget(target)) return false;
        if (target.matches('form[data-form="post-compose-attach"] [name="postComposeAttachSearch"]')) {
            runtime.ui.postComposeAttachSearch = text(target.value || '');
            if (text(activeDialog()?.type || '') === 'post-compose-attach') {
                if (patchPostComposeAttachDialog(runtime)) return;
                return renderSocialPageNow('post-compose-attach-search');
            }
            return;
        }
        if (target.matches('[data-bind="composer-scope"]')) {
            const [scopeType, scopeId] = text(target.value).split(':');
            runtime.ui.activeScopeType = text(scopeType || 'profile') || 'profile';
            runtime.ui.activeScopeId = text(scopeId || currentUserId()) || currentUserId();
        }
        if (target.matches('[data-bind="composer-audience"]')) runtime.ui.composerAudience = text(target.value || 'campus') || 'campus';
        if (target.matches('[data-bind="feed-scope"]')) {
            const [scopeType, scopeId] = text(target.value).split(':');
            withBusy(() => focusFeed(scopeType, scopeId));
            return;
        }
        if (target.name === 'postFile') {
            runtime.ui.composerFile = target.files?.[0] || null;
            if (text(activeDialog()?.type || '') === 'post-compose') {
                if (patchPostComposeDialog(runtime)) return;
                renderSocialPageNow('post-compose-file');
                return;
            }
            renderSocialPageNow('post-file');
            return;
        }
        if (target.name === 'storyFile') {
            runtime.ui.storyFile = target.files?.[0] || null;
            renderSocialPageNow('story-file');
            return;
        }

        return true;
    }

    __kiuFeedExpose({
        handleSocialFeedInput,
        isSocialFeedInputTarget,
        handleSocialFeedChange,
        isSocialFeedChangeTarget,
    });

})();
