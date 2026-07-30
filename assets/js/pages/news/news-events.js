/* Wave bag: Wave 26 news-events */
window.KiuNewsEvents = window.KiuNewsEvents || {};
const __kiuNewsEvApi = window.KiuNewsEvents;
window.__kiuNewsEvApi = __kiuNewsEvApi;
function __kiuNewsEvExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuNewsEvApi[key] = map[key];
        window[key] = map[key];
    });
}

/* News page module: events — classic script, shares globals with sibling news/* modules. */
function installNewsWorkspaceDelegates() {
    const root = q(ROOT_ID);
    if (!root || root.dataset.newsDelegatesInstalled === 'true') return;

    root.dataset.newsDelegatesInstalled = 'true';

    const clickSelector = [
        '[data-news-section]',
        '[data-news-refresh]',
        '[data-news-submit-reply]',
        '[data-news-reply-submit]',
        '[data-news-reply-tab]',
        '[data-news-reply-like]',
        '[data-news-reply-reply]',
        '[data-news-reply-delete]',
        '[data-news-reply-report]',
        '[data-news-publish]',
        '[data-news-save-draft]',
        '[data-news-publisher-primary="1"]',
        '[data-news-publisher-section-nav]',
        '[data-news-reset-compose]',
        '[data-news-open-publisher]',
        '[data-news-close-publisher]',
        '[data-news-open-sections-manager]',
        '[data-news-close-sections-manager]',
        '[data-news-sections-save]',
        '[data-news-sections-add]',
        '[data-news-sections-remove]',
        '[data-news-sections-icon-open]',
        '[data-news-sections-icon-pick]',
        '[data-news-edit-post]',
        '[data-news-remove-post]',
        '[data-news-toggle-pin-post]',
        '[data-news-delete-post]',
        '[data-news-remove-attachment]',
        '[data-news-editor-cmd]'
    ].join(',');

    document.addEventListener('click', event => {
        const action = event.target instanceof Element ? event.target.closest(clickSelector) : null;
        if (!action) return;
        if (!root.contains(action) && !action.closest(`#${PUBLISHER_OVERLAY_ID}`) && !action.closest(`#${CONFIRM_OVERLAY_ID}`) && !action.closest(`#${SECTIONS_OVERLAY_ID}`)) return;

        if (action.hasAttribute('data-news-section')) {
            event.preventDefault();
            window.selectNewsSection(action.getAttribute('data-news-section'));
            return;
        }

        if (action.hasAttribute('data-news-refresh')) {
            event.preventDefault();
            window.refreshNewsWorkspace();
            return;
        }

        if (action.hasAttribute('data-news-open-publisher')) {
            event.preventDefault();
            window.openNewsPublisherModal({ mode: 'create' });
            return;
        }

        if (action.hasAttribute('data-news-open-sections-manager')) {
            event.preventDefault();
            window.openNewsSectionsManager();
            return;
        }

        if (action.hasAttribute('data-news-close-sections-manager')) {
            event.preventDefault();
            window.closeNewsSectionsManager();
            return;
        }

        if (action.hasAttribute('data-news-sections-save')) {
            event.preventDefault();
            saveNewsSections();
            return;
        }

        if (action.hasAttribute('data-news-sections-add')) {
            event.preventDefault();
            const input = q('newsx-sections-panel')?.querySelector('[data-news-sections-add-input]');
            const label = String(input?.value || '').trim();
            syncNewsSectionsDraftFromDom();
            if (!label) {
                runtime.sectionsError = 'Enter a section name.';
                renderNewsSectionsModalContent();
                return;
            }
            const key = normalizeNewsSectionKey(label);
            const duplicate = (runtime.sectionsDraft || []).some(entry => {
                const entryKey = entry.key || normalizeNewsSectionKey(entry.label);
                return entryKey === key;
            });
            if (duplicate) {
                runtime.sectionsError = 'That section already exists.';
                renderNewsSectionsModalContent();
                return;
            }
            runtime.sectionsDraft.push({ key: '', label, icon: 'fa-newspaper' });
            runtime.sectionsError = '';
            if (input) input.value = '';
            renderNewsSectionsModalContent();
            return;
        }

        if (action.hasAttribute('data-news-sections-icon-open')) {
            event.preventDefault();
            const index = Number.parseInt(action.getAttribute('data-news-sections-icon-open'), 10);
            if (!Number.isFinite(index) || !runtime.sectionsDraft[index]) return;
            syncNewsSectionsDraftFromDom();
            const entry = runtime.sectionsDraft[index];
            const key = entry.key || normalizeNewsSectionKey(entry.label);
            const currentIcon = normalizeNewsSectionIcon(entry.icon) || getSectionIcon({ key, icon: entry.icon });
            openNewsSectionIconPickerModal({
                sectionLabel: entry.label || key,
                currentIcon,
                excludeIndex: index,
                onPick: (icon) => {
                    if (!runtime.sectionsDraft[index]) return;
                    runtime.sectionsDraft[index].icon = icon;
                    runtime.sectionsError = '';
                    renderNewsSectionsModalContent();
                }
            });
            return;
        }

        if (action.hasAttribute('data-news-sections-remove')) {
            event.preventDefault();
            const index = Number.parseInt(action.getAttribute('data-news-sections-remove'), 10);
            if (!Number.isFinite(index)) return;
            syncNewsSectionsDraftFromDom();
            const entry = runtime.sectionsDraft[index];
            if (!entry) return;
            const sectionKey = entry.key || normalizeNewsSectionKey(entry.label);
            const count = entry.key ? getNewsSectionCountByKey(entry.key) : 0;
            const removeDraftRow = () => {
                runtime.sectionsDraft.splice(index, 1);
                runtime.sectionsError = '';
                delete runtime.renderCache['sections-modal'];
                renderNewsSectionsModalContent();
            };
            if (count <= 0) {
                delete runtime.sectionsReassignments[sectionKey];
                removeDraftRow();
                return;
            }
            const targets = runtime.sectionsDraft
                .map((item, itemIndex) => ({
                    key: item.key || normalizeNewsSectionKey(item.label),
                    label: String(item.label || '').trim(),
                    index: itemIndex
                }))
                .filter(item => item.index !== index && item.label);
            if (!targets.length) {
                runtime.sectionsError = 'Add another section first to move announcements into.';
                renderNewsSectionsModalContent();
                return;
            }
            openNewsSectionReassignModal({
                sectionLabel: entry.label || sectionKey,
                sectionKey,
                count,
                targets,
                onConfirm: (toKey) => {
                    runtime.sectionsReassignments[sectionKey] = toKey;
                    removeDraftRow();
                }
            });
            return;
        }

        if (action.hasAttribute('data-news-close-publisher')) {
            event.preventDefault();
            window.closeNewsPublisherModal();
            return;
        }

        if (action.hasAttribute('data-news-edit-post')) {
            event.preventDefault();
            window.openNewsPublisherModal({ mode: 'edit', postId: action.getAttribute('data-news-edit-post') });
            return;
        }

        if (action.hasAttribute('data-news-remove-post')) {
            event.preventDefault();
            const postId = action.getAttribute('data-news-remove-post');
            openNewsConfirmModal({
                title: 'Remove announcement',
                message: 'Remove this announcement from the feed? It will be archived.',
                confirmLabel: 'Remove',
                danger: true,
                onConfirm: () => window.archiveNewsPost(postId)
            });
            return;
        }

        if (action.hasAttribute('data-news-toggle-pin-post')) {
            event.preventDefault();
            window.toggleNewsPostPin(action.getAttribute('data-news-toggle-pin-post'));
            return;
        }

        if (action.hasAttribute('data-news-delete-post')) {
            event.preventDefault();
            const postId = action.getAttribute('data-news-delete-post');
            openNewsConfirmModal({
                title: 'Delete announcement',
                message: 'Permanently remove this announcement?',
                confirmLabel: 'Delete',
                danger: true,
                onConfirm: () => window.deleteNewsPost(postId)
            });
            return;
        }

        if (action.hasAttribute('data-news-publisher-section-nav')) {
            event.preventDefault();
            window.setNewsPublisherActiveSection(action.getAttribute('data-news-publisher-section-nav'));
            return;
        }

        if (action.hasAttribute('data-news-publisher-primary')) {
            event.preventDefault();
            const primaryAction = action.getAttribute('data-news-publisher-primary-action')
                || resolveNewsPublisherPrimaryAction().action;
            if (primaryAction === 'schedule') window.scheduleNewsPost();
            else window.publishNewsPost();
            return;
        }

        if (action.hasAttribute('data-news-editor-cmd')) {
            event.preventDefault();
            applyNewsEditorCommand(action.getAttribute('data-news-editor-cmd'));
            return;
        }

        if (action.hasAttribute('data-news-remove-attachment')) {
            event.preventDefault();
            window.removeNewsAttachment(action.getAttribute('data-news-remove-attachment'));
            return;
        }

        if (action.hasAttribute('data-news-submit-reply')) {
            event.preventDefault();
            window.submitNewsReply(
                action.getAttribute('data-news-submit-reply'),
                '',
                action.getAttribute('data-news-reply-visibility') || 'private'
            );
            return;
        }

        if (action.hasAttribute('data-news-reply-submit')) {
            event.preventDefault();
            window.submitNewsReply(
                action.getAttribute('data-news-reply-submit'),
                action.getAttribute('data-news-reply-parent') || '',
                action.getAttribute('data-news-reply-visibility') || 'private'
            );
            return;
        }

        if (action.hasAttribute('data-news-reply-tab')) {
            event.preventDefault();
            window.setNewsReplyActiveTab(
                action.getAttribute('data-news-reply-tab'),
                action.getAttribute('data-news-reply-tab-channel') || 'public'
            );
            return;
        }

        if (action.hasAttribute('data-news-reply-like')) {
            event.preventDefault();
            window.toggleNewsReplyLike(action.getAttribute('data-post-id'), action.getAttribute('data-news-reply-like'));
            return;
        }

        if (action.hasAttribute('data-news-reply-reply')) {
            event.preventDefault();
            window.toggleNewsReplyTarget(
                action.getAttribute('data-post-id'),
                action.getAttribute('data-news-reply-reply'),
                action.getAttribute('data-news-reply-visibility') || 'private'
            );
            return;
        }

        if (action.hasAttribute('data-news-reply-delete')) {
            event.preventDefault();
            const postId = action.getAttribute('data-post-id');
            const replyId = action.getAttribute('data-news-reply-delete');
            openNewsConfirmModal({
                title: 'Delete reply',
                message: 'Delete this reply and its responses?',
                confirmLabel: 'Delete',
                danger: true,
                onConfirm: () => window.deleteNewsReply(postId, replyId)
            });
            return;
        }

        if (action.hasAttribute('data-news-reply-report')) {
            event.preventDefault();
            window.reportNewsReply(action.getAttribute('data-post-id'), action.getAttribute('data-news-reply-report'));
            return;
        }

        if (action.hasAttribute('data-news-publish')) {
            event.preventDefault();
            window.publishNewsPost();
            return;
        }

        if (action.hasAttribute('data-news-save-draft')) {
            event.preventDefault();
            window.saveNewsDraft();
            return;
        }

        if (action.hasAttribute('data-news-reset-compose')) {
            event.preventDefault();
            window.resetNewsComposer();
        }
    });

    installNewsOverlayDismissHandlers();

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (q(CONFIRM_OVERLAY_ID)?.classList.contains('active')) {
            closeNewsConfirmModal();
            return;
        }
        if (runtime.publisherModalOpen) window.closeNewsPublisherModal();
    });

    function isNewsDelegatedTarget(target) {
        if (!(target instanceof Element)) return false;
        return Boolean(q(ROOT_ID)?.contains(target))
            || Boolean(target.closest(`#${PUBLISHER_OVERLAY_ID}`))
            || Boolean(target.closest(`#${CONFIRM_OVERLAY_ID}`));
    }

    document.addEventListener('input', event => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
        if (!isNewsDelegatedTarget(target)) return;

        if (target.hasAttribute('data-news-search-input')) {
            window.updateNewsSearch(target.value);
            return;
        }

        if (target.hasAttribute('data-news-reply-input')) {
            window.updateNewsReplyDraft(
                target.getAttribute('data-news-reply-input'),
                target.value,
                target.getAttribute('data-news-reply-parent') || '',
                target.getAttribute('data-news-reply-visibility') || 'private'
            );
            return;
        }

        if (target.hasAttribute('data-news-compose-font-size-mode')) {
            window.syncNewsComposeFontSizeMode(target.getAttribute('data-news-compose-font-size-mode'), target.value);
            return;
        }

        if (target.hasAttribute('data-news-compose-font-size-custom')) {
            window.syncNewsComposeFontSize(target.getAttribute('data-news-compose-font-size-custom'), target.value);
            return;
        }

        if (target.hasAttribute('data-news-compose-field')) {
            const field = target.getAttribute('data-news-compose-field');
            if (field === 'body' || field === 'title') return;
            window.syncNewsComposeField(field, target.value);
        }
    });

    document.addEventListener('change', event => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
        if (!isNewsDelegatedTarget(target)) return;

        if (target.hasAttribute('data-news-feed-filter')) {
            window.updateNewsFeedFilter(target.getAttribute('data-news-feed-filter'), target.value);
            return;
        }

        if (target.hasAttribute('data-news-attach')) {
            window.addNewsAttachments(target.files);
            target.value = '';
            return;
        }

        if (target.hasAttribute('data-news-compose-font-size-mode')) {
            window.syncNewsComposeFontSizeMode(target.getAttribute('data-news-compose-font-size-mode'), target.value);
            return;
        }

        if (target.hasAttribute('data-news-compose-font-size-custom')) {
            window.syncNewsComposeFontSize(target.getAttribute('data-news-compose-font-size-custom'), target.value);
            return;
        }

        if (target.hasAttribute('data-news-editor-style')) {
            applyNewsEditorStyle(target.value);
            return;
        }

        if (target.hasAttribute('data-news-editor-color')) {
            const colorType = target.getAttribute('data-news-editor-color');
            applyNewsEditorCommand(colorType === 'highlight' ? 'highlight' : 'foreColor', target.value);
            return;
        }

        if (target.hasAttribute('data-news-compose-field')) {
            const field = target.getAttribute('data-news-compose-field');
            if (field === 'body' || field === 'title') return;
            window.updateNewsComposeField(field, target.value);
            return;
        }

        if (target.hasAttribute('data-news-audience-role')) {
            window.toggleNewsAudienceRole(target.getAttribute('data-news-audience-role'));
            return;
        }

        if (target.hasAttribute('data-news-audience-faculty')) {
            window.toggleNewsAudienceFaculty(target.getAttribute('data-news-audience-faculty'));
            return;
        }

        if (target.hasAttribute('data-news-audience-mode')) {
            window.setNewsPublisherAudienceMode(target.getAttribute('data-news-audience-mode'));
            return;
        }

        if (target.hasAttribute('data-news-schedule-mode')) {
            window.setNewsPublisherScheduleMode(target.getAttribute('data-news-schedule-mode'));
            return;
        }

        if (target.hasAttribute('data-news-compose-boolean')) {
            window.toggleNewsComposeBoolean(target.getAttribute('data-news-compose-boolean'));
        }
    });
}

__kiuNewsEvExpose({
    renderNewsWorkspace,
});
window.refreshNewsWorkspace = function refreshNewsWorkspace() {
    bootstrapNewsWorkspace(true);
};
window.selectNewsSection = function selectNewsSection(sectionKey) {
    const nextSection = String(sectionKey || 'all');
    if (runtime.selectedSection === nextSection) return;
    runtime.selectedSection = nextSection;
    syncNewsSectionActiveState(nextSection);
    bootstrapNewsWorkspace(true);
};
window.updateNewsSearch = function updateNewsSearch(value) {
    const nextSearch = String(value || '');
    if (runtime.search === nextSearch) return;
    runtime.search = nextSearch;
    runtime.error = '';
    if (runtime.searchTimer) window.clearTimeout(runtime.searchTimer);
    runtime.searchTimer = window.setTimeout(() => {
        runtime.searchTimer = null;
        bootstrapNewsWorkspace(true);
    }, 260);
};
window.openNewsPublisherModal = function openNewsPublisherModal({ mode = 'create', postId = '' } = {}) {
    if (!canManageNews()) return;
    if (mode === 'edit' && postId) {
        const post = runtime.posts.find(item => String(item.id || '') === String(postId));
        if (!post) return;
        runtime.compose = {
            title: post.title || '',
            sectionLabel: post.sectionLabel || 'General',
            body: post.body || '',
            excerpt: post.excerpt || '',
            priority: post.priority || 'standard',
            status: post.status || 'draft',
            publishAt: post.publishAt || '',
            expiresAt: post.expiresAt || '',
            replyMode: resolveNewsReplyMode(post),
            allowReplies: resolveNewsReplyMode(post) !== 'none',
            pinned: Boolean(post.pinned),
            audienceRoles: uniqueStrings(post.audienceRoles || []),
            audienceFacultyCodes: uniqueStrings(post.audienceFacultyCodes || []),
            courseIds: uniqueStrings(post.courseIds || []),
            programCode: String(post.programCode || '').trim().toUpperCase(),
            attachments: Array.isArray(post.attachments) ? post.attachments.map(file => ({ ...file })) : [],
            editingPostId: String(postId),
            titleFontSize: getNewsTypographyPx(post, 'titleFontSize'),
            bodyFontSize: getNewsTypographyPx(post, 'bodyFontSize'),
            excerptFontSize: getNewsTypographyPx(post, 'excerptFontSize')
        };
    } else {
        runtime.compose = getDefaultCompose();
    }
    const ui = ensurePublisherUi();
    ui.activeSection = 'message';
    ui.audienceMode = isPublisherAudienceRestricted() ? 'restricted' : 'everyone';
    const publishAt = String(runtime.compose.publishAt || '').trim();
    const publishMs = publishAt ? new Date(publishAt).getTime() : NaN;
    ui.scheduleMode = (!Number.isNaN(publishMs) && publishMs > Date.now()) ? 'scheduled' : 'immediate';
    runtime.publisherModalOpen = true;
    runtime.error = '';
    renderNewsModals();
    syncNewsFilterErrorRegion();
};
window.setNewsPublisherAudienceMode = function setNewsPublisherAudienceMode(mode) {
    const ui = ensurePublisherUi();
    const next = String(mode || 'everyone').trim() === 'restricted' ? 'restricted' : 'everyone';
    if (ui.audienceMode === next) return;
    ui.audienceMode = next;
    if (next === 'everyone') {
        runtime.compose.audienceRoles = [];
        runtime.compose.audienceFacultyCodes = [];
    }
    syncNewsPublisherAudienceModeUi();
    if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
};
window.setNewsPublisherScheduleMode = function setNewsPublisherScheduleMode(mode) {
    const ui = ensurePublisherUi();
    const next = String(mode || 'immediate').trim() === 'scheduled' ? 'scheduled' : 'immediate';
    if (ui.scheduleMode === next) return;
    ui.scheduleMode = next;
    if (next === 'immediate') runtime.compose.publishAt = '';
    syncNewsPublisherScheduleModeUi();
    if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
};
window.closeNewsPublisherModal = function closeNewsPublisherModal() {
    runtime.publisherModalOpen = false;
    renderNewsModals();
    syncNewsFilterErrorRegion();
};
window.openNewsSectionsManager = function openNewsSectionsManager() {
    if (!canManageNews()) return;
    runtime.sectionsDraft = (runtime.sectionCatalog || []).map(entry => ({
        key: String(entry?.key || ''),
        label: String(entry?.label || ''),
        icon: normalizeNewsSectionIcon(entry?.icon) || getSectionIcon(entry)
    }));
    if (!runtime.sectionsDraft.length) {
        runtime.sectionsDraft = (runtime.sections || [])
            .filter(section => section?.key && section.key !== 'all')
            .map(section => ({
                key: String(section.key || ''),
                label: String(section.label || ''),
                icon: normalizeNewsSectionIcon(section?.icon) || getSectionIcon(section)
            }));
    }
    runtime.sectionsError = '';
    runtime.sectionsReassignments = {};
    runtime.sectionsModalOpen = true;
    delete runtime.renderCache['sections-modal'];
    renderNewsModals();
};
window.closeNewsSectionsManager = function closeNewsSectionsManager() {
    closeNewsConfirmModal();
    runtime.sectionsModalOpen = false;
    runtime.sectionsDraft = [];
    runtime.sectionsReassignments = {};
    runtime.sectionsError = '';
    clearNewsRegionMarkup(q('newsx-sections-panel'), 'sections-modal');
    renderNewsModals();
};
window.updateNewsFeedFilter = function updateNewsFeedFilter(field, value) {
    const key = String(field || '').trim();
    if (!key || !runtime.feedFilters) return;
    const nextValue = String(value || '').trim();
    const unchanged = runtime.feedFilters[key] === nextValue;
    const domPostCount = q(ROOT_ID)?.querySelectorAll('[data-news-post-host="1"]').length ?? 0;
    if (unchanged && runtime.posts.length > 0 && domPostCount === runtime.posts.length) return;
    if (unchanged && runtime.bootstrapPromise) return;
    if (!unchanged) runtime.feedFilters[key] = nextValue;
    runtime.error = '';
    if (runtime.feedFilterTimer) window.clearTimeout(runtime.feedFilterTimer);
    runtime.feedFilterTimer = window.setTimeout(() => {
        runtime.feedFilterTimer = null;
        bootstrapNewsWorkspace(true);
    }, 180);
};
window.addNewsAttachments = function addNewsAttachments(fileList) {
    const files = [...(fileList || [])];
    if (!files.length) return;
    const current = Array.isArray(runtime.compose.attachments) ? runtime.compose.attachments : [];
    const next = current.slice();
    files.forEach((file, index) => {
        if (next.length >= NEWS_MAX_ATTACHMENTS) return;
        const reader = new FileReader();
        reader.onload = () => {
            next.push({
                id: `news_att_${Date.now()}_${index}`,
                name: file.name,
                type: file.type,
                mimeType: file.type,
                size: file.size,
                dataUrl: String(reader.result || '')
            });
            runtime.compose.attachments = next.slice(0, NEWS_MAX_ATTACHMENTS);
            patchNewsPublisherAttachmentRegion();
        };
        reader.readAsDataURL(file);
    });
};
window.removeNewsAttachment = function removeNewsAttachment(attachmentId) {
    const current = Array.isArray(runtime.compose.attachments) ? runtime.compose.attachments : [];
    runtime.compose.attachments = current.filter((file, index) => String(file.id || index) !== String(attachmentId || ''));
    patchNewsPublisherAttachmentRegion();
};
window.syncNewsComposeFontSizeMode = function syncNewsComposeFontSizeMode(field, modeValue) {
    const key = String(field || '').trim();
    if (!key || !Object.prototype.hasOwnProperty.call(NEWS_DEFAULT_TYPOGRAPHY, key)) return;
    if (String(modeValue || '') === 'custom') {
        syncNewsComposeTypographyUi();
        const panel = q('newsx-publisher-panel');
        const customInput = panel?.querySelector(`[data-news-compose-font-size-custom="${key}"]`);
        if (customInput instanceof HTMLInputElement) {
            customInput.hidden = false;
            customInput.focus();
            customInput.select();
        }
        return;
    }
    window.syncNewsComposeFontSize(key, modeValue);
};
window.syncNewsComposeFontSize = function syncNewsComposeFontSize(field, value) {
    const key = String(field || '').trim();
    if (!key || !Object.prototype.hasOwnProperty.call(NEWS_DEFAULT_TYPOGRAPHY, key)) return;
    const next = normalizeNewsFontSize(value, getNewsTypographyPx(runtime.compose, key));
    if (runtime.compose[key] === next) {
        syncNewsComposeTypographyUi();
        return;
    }
    runtime.compose[key] = next;
    syncNewsComposeTypographyUi();
    if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
};
window.syncNewsComposeField = function syncNewsComposeField(field, value) {
    window.updateNewsComposeField(field, value);
};
window.updateNewsComposeField = function updateNewsComposeField(field, value) {
    if (field === 'courseIds') {
        const next = parseNewsCourseIdsInput(value);
        const current = uniqueStrings(runtime.compose.courseIds || []);
        if (current.length === next.length && current.every((item, index) => item === next[index])) return;
        runtime.compose.courseIds = next;
    } else if (field === 'programCode') {
        const next = String(value || '').trim().toUpperCase();
        if (runtime.compose.programCode === next) return;
        runtime.compose.programCode = next;
    } else if (field === 'replyMode') {
        const next = ['none', 'private', 'public', 'both'].includes(String(value || '').trim().toLowerCase())
            ? String(value || '').trim().toLowerCase()
            : 'private';
        if (runtime.compose.replyMode === next) return;
        runtime.compose.replyMode = next;
        runtime.compose.allowReplies = next !== 'none';
    } else if (runtime.compose[field] === value) {
        return;
    } else {
        runtime.compose[field] = value;
    }
    if (runtime.publisherModalOpen) {
        syncNewsPublisherLiveRegions();
        return;
    }
    renderNewsWorkspace();
};
window.toggleNewsComposeBoolean = function toggleNewsComposeBoolean(field) {
    if (typeof runtime.compose[field] !== 'boolean') return;
    runtime.compose[field] = !runtime.compose[field];
    if (runtime.publisherModalOpen) {
        syncNewsPublisherLiveRegions();
        return;
    }
    renderNewsWorkspace();
};
window.toggleNewsAudienceRole = function toggleNewsAudienceRole(roleId) {
    const selected = new Set(uniqueStrings(runtime.compose.audienceRoles || []));
    if (selected.has(roleId)) selected.delete(roleId);
    else selected.add(roleId);
    const nextRoles = [...selected];
    const currentRoles = uniqueStrings(runtime.compose.audienceRoles || []);
    if (currentRoles.length === nextRoles.length && currentRoles.every((value, index) => value === nextRoles[index])) return;
    runtime.compose.audienceRoles = nextRoles;
    ensurePublisherUi().audienceMode = 'restricted';
    if (runtime.publisherModalOpen) {
        syncNewsPublisherAudienceModeUi();
        syncNewsPublisherLiveRegions();
        return;
    }
    renderNewsWorkspace();
};
window.toggleNewsAudienceFaculty = function toggleNewsAudienceFaculty(facultyCode) {
    const selected = new Set(uniqueStrings(runtime.compose.audienceFacultyCodes || []));
    if (selected.has(facultyCode)) selected.delete(facultyCode);
    else selected.add(facultyCode);
    const nextFaculties = [...selected];
    const currentFaculties = uniqueStrings(runtime.compose.audienceFacultyCodes || []);
    if (currentFaculties.length === nextFaculties.length && currentFaculties.every((value, index) => value === nextFaculties[index])) return;
    runtime.compose.audienceFacultyCodes = nextFaculties;
    ensurePublisherUi().audienceMode = 'restricted';
    if (runtime.publisherModalOpen) {
        syncNewsPublisherAudienceModeUi();
        syncNewsPublisherLiveRegions();
        return;
    }
    renderNewsWorkspace();
};
window.resetNewsComposer = function resetNewsComposer(options = {}) {
    runtime.compose = getDefaultCompose();
    runtime.publisherUi = { activeSection: 'message', audienceMode: 'everyone', scheduleMode: 'immediate' };
    if (runtime.publisherModalOpen) renderNewsModals();
    else if (!options.skipWorkspaceRender) renderNewsWorkspace();
};
window.saveNewsDraft = async function saveNewsDraft() {
    runtime.compose.status = 'draft';
    await submitNewsPost('draft');
};
window.scheduleNewsPost = async function scheduleNewsPost() {
    if (!String(runtime.compose.publishAt || '').trim()) {
        runtime.error = 'Set a publish date to schedule this announcement.';
        if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
        else renderNewsWorkspace();
        return;
    }
    runtime.compose.status = 'published';
    await submitNewsPost('published');
};
window.publishNewsPost = async function publishNewsPost() {
    runtime.compose.status = 'published';
    runtime.compose.publishAt = runtime.compose.publishAt || new Date().toISOString();
    await submitNewsPost('published');
};
window.archiveNewsPost = async function archiveNewsPost(postId) {
    const actor = getCurrentUserSafe();
    if (!actor?.id || !postId) return;
    try {
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId))}`, {
            method: 'PATCH',
            body: JSON.stringify({ actorId: actor.id, status: 'archived' })
        });
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'The announcement could not be archived.';
        renderNewsWorkspace();
    }
};
window.toggleNewsPostPin = async function toggleNewsPostPin(postId) {
    const actor = getCurrentUserSafe();
    const post = runtime.posts.find(item => String(item.id || '') === String(postId || ''));
    if (!actor?.id || !post) return;
    try {
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId))}`, {
            method: 'PATCH',
            body: JSON.stringify({ actorId: actor.id, pinned: !post.pinned })
        });
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'Pin state could not be updated.';
        renderNewsWorkspace();
    }
};
window.deleteNewsPost = async function deleteNewsPost(postId) {
    const actor = getCurrentUserSafe();
    if (!actor?.id || !postId) return;
    try {
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId))}`, {
            method: 'PATCH',
            body: JSON.stringify({ actorId: actor.id, status: 'archived', title: '[deleted]' })
        });
        runtime.publisherModalOpen = false;
        window.resetNewsComposer();
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'The announcement could not be deleted.';
        renderNewsWorkspace();
    }
};
window.updateNewsReplyDraft = function updateNewsReplyDraft(postId, value, parentReplyId = '', visibility = 'private') {
    const key = newsReplyDraftKey(postId, parentReplyId, visibility);
    runtime.replyDrafts[key] = String(value || '');
};
window.submitNewsReply = async function submitNewsReply(postId, parentReplyId = '', visibility = 'private') {
    const actor = getCurrentUserSafe();
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const key = newsReplyDraftKey(postId, parentReplyId, channel);
    const body = String(runtime.replyDrafts[key] || '').trim();
    if (!actor?.id || !body) return;
    try {
        const payload = { actorId: actor.id, body, visibility: channel };
        if (parentReplyId) payload.parentReplyId = parentReplyId;
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId || ''))}/replies`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        runtime.replyDrafts[key] = '';
        if (parentReplyId) runtime.newsReplyTargetByPost[newsReplyTargetKey(postId, channel)] = '';
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'The reply could not be sent.';
        renderNewsWorkspace();
    }
};
window.toggleNewsReplyLike = async function toggleNewsReplyLike(postId, replyId) {
    const actor = getCurrentUserSafe();
    if (!actor?.id || !postId || !replyId) return;
    try {
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId))}/replies/${encodeURIComponent(String(replyId))}/react`, {
            method: 'POST',
            body: JSON.stringify({ actorId: actor.id, reactionType: 'like' })
        });
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'The reaction could not be updated.';
        renderNewsWorkspace();
    }
};
window.deleteNewsReply = async function deleteNewsReply(postId, replyId) {
    const actor = getCurrentUserSafe();
    if (!actor?.id || !postId || !replyId) return;
    try {
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId))}/replies/${encodeURIComponent(String(replyId))}`, {
            method: 'DELETE',
            body: JSON.stringify({ actorId: actor.id })
        });
        await bootstrapNewsWorkspace(true);
    } catch (error) {
        runtime.error = error?.message || 'The reply could not be deleted.';
        renderNewsWorkspace();
    }
};
window.reportNewsReply = async function reportNewsReply(postId, replyId) {
    const actor = getCurrentUserSafe();
    if (!actor?.id || !postId || !replyId) return;
    try {
        await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId))}/replies/${encodeURIComponent(String(replyId))}/report`, {
            method: 'POST',
            body: JSON.stringify({ actorId: actor.id, reason: '' })
        });
        runtime.info = 'Reply reported to moderators.';
        renderNewsWorkspace();
    } catch (error) {
        runtime.error = error?.message || 'The reply could not be reported.';
        renderNewsWorkspace();
    }
};
window.toggleNewsReplyTarget = function toggleNewsReplyTarget(postId, replyId = '', visibility = 'private') {
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const targetKey = newsReplyTargetKey(postId, channel);
    const current = String(runtime.newsReplyTargetByPost[targetKey] || '');
    const next = current && current === String(replyId) ? '' : String(replyId);
    runtime.newsReplyTargetByPost[targetKey] = next;
    const post = runtime.posts.find(item => String(item.id || '') === String(postId || ''));
    if (!post) return;
    const host = document.querySelector(`[data-news-post-host="1"][data-news-post-id="${CSS.escape(String(postId || ''))}"]`);
    if (host) {
        renderNewsPostRegions(host, post);
        relayoutNewsReplyTrunks(host);
    }
};
window.setNewsReplyActiveTab = function setNewsReplyActiveTab(postId, channel = 'public') {
    const key = String(postId || '');
    const next = String(channel || 'public').trim().toLowerCase() === 'private' ? 'private' : 'public';
    if (runtime.newsReplyActiveTab[key] === next) return;
    runtime.newsReplyActiveTab[key] = next;
    const post = runtime.posts.find(item => String(item.id || '') === key);
    if (!post) return;
    const host = document.querySelector(`[data-news-post-host="1"][data-news-post-id="${CSS.escape(key)}"]`);
    if (host) {
        renderNewsPostRegions(host, post);
        relayoutNewsReplyTrunks(host);
    }
};
window.addEventListener('kiu:news-updated', () => {
    if (!isNewsWorkspaceVisible()) {
        runtime.bootstrapped = false;
        if (typeof window.prefetchNewsHomeSnapshot === 'function') {
            window.prefetchNewsHomeSnapshot().then(() => {
                if (typeof getActivePageId === 'function' && getActivePageId() === 'home') {
                    window.mountNewsHomeStrip?.();
                }
            });
        }
        return;
    }
    bootstrapNewsWorkspace(true);
});

function initializeNewsWorkspace() {
    if (!q(ROOT_ID)) return;
    installNewsWorkspaceDelegates();
    applyNewsDeepLinkFocus();
    renderNewsWorkspace();
    const root = document.getElementById(ROOT_ID);
    if (root) {
        root.addEventListener('toggle', (event) => {
            const target = event.target;
            if (target && target.classList && target.classList.contains('newsx-reply-fold')) {
                const host = target.closest('[data-news-post-host="1"]');
                const postId = host?.getAttribute('data-news-post-id') || '';
                const channel = String(target.getAttribute('data-news-reply-channel') || 'private').trim().toLowerCase();
                if (postId) runtime.newsReplyFoldOpen[`${postId}|${channel === 'public' ? 'public' : 'private'}`] = target.open;
                window.requestAnimationFrame(() => relayoutNewsReplyTrunks(root));
            }
        }, true);
    }
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => relayoutNewsReplyTrunks(), 120);
    });
}

