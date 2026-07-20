/* News page module: api — classic script, shares globals with sibling news/* modules. */
async function fetchNewsFeed() {
    const previousPosts = Array.isArray(runtime.posts) ? runtime.posts : [];
    const previousSections = Array.isArray(runtime.sections) ? runtime.sections : [];
    const previousCatalog = Array.isArray(runtime.sectionCatalog) ? runtime.sectionCatalog : [];
    const currentUser = getCurrentUserSafe();
    if (!currentUser?.id) {
        if (!previousPosts.length) {
            runtime.posts = [];
            runtime.sections = [];
        }
        return;
    }
    const query = new URLSearchParams({
        userId: String(currentUser?.id || ''),
        section: runtime.selectedSection || 'all',
        search: runtime.search || ''
    });
    const filters = runtime.feedFilters || {};
    if (filters.priority && filters.priority !== 'all') query.set('priority', filters.priority);
    if (filters.pinned && filters.pinned !== 'all') query.set('pinned', filters.pinned);
    if (canManageNews() && filters.status && filters.status !== 'all') query.set('status', filters.status);
    if (filters.dateFrom) query.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.set('dateTo', filters.dateTo);
    try {
        const payload = await kiuPortalFetch(`/api/news/feed?${query.toString()}`);
        runtime.posts = Array.isArray(payload?.items) ? payload.items : [];
        runtime.sections = Array.isArray(payload?.sections) ? payload.sections : [];
        runtime.sectionCatalog = Array.isArray(payload?.sectionCatalog) ? payload.sectionCatalog : [];
    } catch (_e) {
        runtime.posts = previousPosts;
        runtime.sections = previousSections.length ? previousSections : [];
        runtime.sectionCatalog = previousCatalog.length ? previousCatalog : [];
    }
}

async function saveNewsSections() {
    if (!canManageNews()) return;
    syncNewsSectionsDraftFromDom();
    const catalog = (runtime.sectionsDraft || [])
        .map(entry => {
            const label = String(entry?.label || '').trim();
            if (!label) return null;
            const payload = { label };
            if (entry.key) payload.key = entry.key;
            return payload;
        })
        .filter(Boolean);
    if (!catalog.length) {
        runtime.sectionsError = 'Add at least one section.';
        renderNewsSectionsModalContent();
        return;
    }
    try {
        const result = await kiuPortalFetch('/api/news/sections', {
            method: 'PUT',
            body: JSON.stringify({
                catalog,
                reassignments: runtime.sectionsReassignments || {}
            })
        });
        runtime.sectionCatalog = Array.isArray(result?.catalog) ? result.catalog : catalog;
        runtime.sections = Array.isArray(result?.sections) ? result.sections : runtime.sections;
        runtime.sectionsError = '';
        runtime.sectionsModalOpen = false;
        runtime.sectionsDraft = [];
        runtime.sectionsReassignments = {};
        renderNewsModals();
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.sectionsError = error?.message || 'Sections could not be saved.';
        renderNewsSectionsModalContent();
    }
}

async function persistNewsAttachments() {
    const attachments = Array.isArray(runtime.compose.attachments) ? runtime.compose.attachments : [];
    if (!attachments.length) return [];
    if (typeof uploadPortalStoredFile !== 'function') return attachments;
    const uploaded = [];
    for (const draft of attachments) {
        if (draft.storageKey) {
            uploaded.push({
                name: draft.name,
                mimeType: draft.mimeType || draft.type,
                storageKey: draft.storageKey,
                storageBackend: draft.storageBackend || 'bridge',
                dataUrl: draft.dataUrl || ''
            });
            continue;
        }
        const stored = await uploadPortalStoredFile(draft, 'news');
        if (stored?.storageKey || stored?.dataUrl) {
            uploaded.push({
                name: stored.name || draft.name,
                mimeType: stored.type || draft.type || draft.mimeType,
                storageKey: stored.storageKey || '',
                storageBackend: stored.storageBackend || 'bridge',
                dataUrl: stored.dataUrl || draft.dataUrl || ''
            });
        }
    }
    return uploaded.slice(0, NEWS_MAX_ATTACHMENTS);
}

function buildNewsPostPayload(status) {
    const compose = runtime.compose;
    return {
        title: compose.title,
        sectionLabel: compose.sectionLabel,
        body: compose.body,
        excerpt: compose.excerpt,
        priority: compose.priority,
        status: status || compose.status || 'draft',
        publishAt: fromDatetimeLocalValue(compose.publishAt) || (status === 'published' ? new Date().toISOString() : ''),
        expiresAt: fromDatetimeLocalValue(compose.expiresAt),
        replyMode: compose.replyMode || (compose.allowReplies === false ? 'none' : 'private'),
        allowReplies: (compose.replyMode || (compose.allowReplies === false ? 'none' : 'private')) !== 'none',
        pinned: compose.pinned,
        audienceRoles: compose.audienceRoles,
        audienceFacultyCodes: compose.audienceFacultyCodes,
        courseIds: uniqueStrings(compose.courseIds || []),
        programCode: String(compose.programCode || '').trim().toUpperCase(),
        attachments: compose.attachments,
        titleFontSize: getNewsTypographyPx(compose, 'titleFontSize'),
        bodyFontSize: getNewsTypographyPx(compose, 'bodyFontSize'),
        excerptFontSize: getNewsTypographyPx(compose, 'excerptFontSize')
    };
}

async function submitNewsPost(status) {
    const actor = getCurrentUserSafe();
    if (!actor?.id) return;
    if (getNewsTitleEditor()) {
        runtime.compose.title = serializeNewsTitleEditor();
    }
    if (getNewsBodyEditor()) {
        runtime.compose.body = serializeNewsBodyEditor();
    }
    if (!stripNewsTitlePlainText(runtime.compose.title) || !String(runtime.compose.body || '').trim()) {
        runtime.error = 'Headline and body are required.';
        if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
        else renderNewsWorkspace();
        return;
    }
    try {
        const attachments = await persistNewsAttachments();
        const payload = {
            ...buildNewsPostPayload(status),
            attachments,
            actorId: actor.id
        };
        const editingId = String(runtime.compose.editingPostId || '').trim();
        let savedPost = null;
        if (editingId) {
            const result = await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(editingId)}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            savedPost = result?.post || null;
        } else {
            const result = await kiuPortalFetch('/api/news/posts', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            savedPost = result?.post || null;
        }
        window.resetNewsComposer({ skipWorkspaceRender: true });
        runtime.publisherModalOpen = false;
        renderNewsModals();
        if (savedPost?.id) {
            const postId = String(savedPost.id);
            runtime.posts = [savedPost, ...runtime.posts.filter(post => String(post?.id || '') !== postId)];
        }
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'The announcement could not be saved.';
        if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
        else renderNewsWorkspace();
    }
}

