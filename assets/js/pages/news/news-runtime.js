/* News page module: runtime — classic script, shares globals with sibling news/* modules. */
const ROOT_ID = 'portal-news-root';
const PUBLISHER_OVERLAY_ID = 'newsx-publisher-overlay';
const CONFIRM_OVERLAY_ID = 'newsx-confirm-overlay';
const SECTIONS_OVERLAY_ID = 'newsx-sections-overlay';
const ATTACHMENT_VIEWER_OVERLAY_ID = 'newsx-attachment-viewer-overlay';
const POST_DETAIL_OVERLAY_ID = 'newsx-post-detail-overlay';
const NEWS_MAX_ATTACHMENTS = 5;
const NEWS_FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const NEWS_FONT_SIZE_MIN = 8;
const NEWS_FONT_SIZE_MAX = 96;
const NEWS_DEFAULT_TYPOGRAPHY = {
    titleFontSize: 28,
    bodyFontSize: 18,
    excerptFontSize: 15
};
const ROLE_OPTIONS = [
    ['student', 'Students'],
    ['professor', 'Professors'],
    ['ta', 'Teaching Assistants'],
    ['admin', 'Administrators'],
    ['student_service', 'Student Service']
];

const runtime = {
    bootstrapped: false,
    bootstrapAttempted: false,
    bootstrapPromise: null,
    bootstrapPending: false,
    loading: false,
    error: '',
    renderCache: {},
    posts: [],
    sections: [],
    sectionCatalog: [],
    selectedSection: 'all',
    search: '',
    searchTimer: null,
    replyDrafts: {},
    newsReplyTargetByPost: {},
    newsReplyFoldOpen: {},
    newsReplyActiveTab: {},
    feedFilters: {
        priority: 'all',
        pinned: 'all',
        status: 'published',
        dateFrom: '',
        dateTo: ''
    },
    /** null until first paint — then true on ≤920px so filters start collapsed on mobile. */
    headerFiltersCollapsed: null,
    /** null until first paint — then true on ≤920px so section list starts collapsed on mobile. */
    sidebarSectionsCollapsed: null,
    feedFilterTimer: null,
    pendingDeepLinkPostId: '',
    publisherModalOpen: false,
    sectionsModalOpen: false,
    attachmentViewer: {
        open: false,
        postId: '',
        index: 0
    },
    postDetail: {
        open: false,
        postId: ''
    },
    overlayRefreshMode: '',
    sectionsDraft: [],
    sectionsReassignments: {},
    sectionsError: '',
    publisherUi: {
        activeSection: 'message',
        audienceMode: 'everyone',
        scheduleMode: 'immediate'
    },
    compose: {
        title: '',
        sectionLabel: 'Academic Updates',
        body: '',
        excerpt: '',
        priority: 'standard',
        status: 'draft',
        publishAt: '',
        expiresAt: '',
        replyMode: 'both',
        allowReplies: true,
        pinned: false,
        audienceRoles: [],
        audienceFacultyCodes: [],
        courseIds: [],
        programCode: '',
        attachments: [],
        editingPostId: '',
        titleFontSize: NEWS_DEFAULT_TYPOGRAPHY.titleFontSize,
        bodyFontSize: NEWS_DEFAULT_TYPOGRAPHY.bodyFontSize,
        excerptFontSize: NEWS_DEFAULT_TYPOGRAPHY.excerptFontSize
    }
};

function resolveNewsReplyMode(post = {}) {
    const mode = String(post.replyMode || '').trim().toLowerCase();
    if (mode === 'none') return 'none';
    if (['private', 'public', 'both'].includes(mode)) return 'both';
    return post.allowReplies === false ? 'none' : 'both';
}

function getNewsReplyModeLabel(mode = 'both') {
    switch (String(mode || '').trim().toLowerCase()) {
        case 'none': return 'No replies';
        case 'both':
        case 'public':
        case 'private':
            return 'Public + private comments';
        default: return 'Public + private comments';
    }
}

function getDefaultCompose() {
    return {
        title: '',
        sectionLabel: 'Academic Updates',
        body: '',
        excerpt: '',
        priority: 'standard',
        status: 'draft',
        publishAt: '',
        expiresAt: '',
        replyMode: 'both',
        allowReplies: true,
        pinned: false,
        audienceRoles: [],
        audienceFacultyCodes: [],
        courseIds: [],
        programCode: '',
        attachments: [],
        editingPostId: '',
        titleFontSize: NEWS_DEFAULT_TYPOGRAPHY.titleFontSize,
        bodyFontSize: NEWS_DEFAULT_TYPOGRAPHY.bodyFontSize,
        excerptFontSize: NEWS_DEFAULT_TYPOGRAPHY.excerptFontSize
    };
}

function normalizeNewsFontSize(value, fallback = NEWS_DEFAULT_TYPOGRAPHY.bodyFontSize) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(NEWS_FONT_SIZE_MIN, Math.min(NEWS_FONT_SIZE_MAX, parsed));
}

function isNewsFontSizePreset(px) {
    return NEWS_FONT_SIZE_PRESETS.includes(px);
}

function resolveNewsFontSizeSelectMode(px, field = 'bodyFontSize') {
    const fallback = NEWS_DEFAULT_TYPOGRAPHY[field] || NEWS_DEFAULT_TYPOGRAPHY.bodyFontSize;
    const value = normalizeNewsFontSize(px, fallback);
    if (isNewsFontSizePreset(value)) return { mode: 'preset', value };
    return { mode: 'custom', value };
}

function getNewsTypographyPx(source = {}, field = 'bodyFontSize') {
    const fallback = NEWS_DEFAULT_TYPOGRAPHY[field] || NEWS_DEFAULT_TYPOGRAPHY.bodyFontSize;
    return normalizeNewsFontSize(source?.[field], fallback);
}

function getNewsTypographyStyle(source = {}, field = 'bodyFontSize') {
    return `font-size:${getNewsTypographyPx(source, field)}px`;
}

function toDatetimeLocalValue(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = num => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toISOString();
}

function resolveNewsAttachmentUrl(file) {
    if (!file || typeof file !== 'object') return '';
    if (String(file.storageBackend || '').trim().toLowerCase() === 'bridge'
        && String(file.storageKey || '').trim()
        && typeof getPortalStoredFileUrl === 'function') {
        return getPortalStoredFileUrl(file.storageKey);
    }
    return String(file.dataUrl || file.url || '').trim();
}

function isNewsImageAttachment(file) {
    const mime = String(file?.mimeType || file?.type || '').toLowerCase();
    return mime.startsWith('image/');
}

function normalizeNewsSectionKey(value = '') {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'general';
}

function getNewsSectionCountByKey(key = '') {
    const normalizedKey = normalizeNewsSectionKey(key);
    const section = (runtime.sections || []).find(item => normalizeNewsSectionKey(item?.key) === normalizedKey);
    return Number(section?.count || 0);
}

function ensureNewsModalShells() {
    if (!q(PUBLISHER_OVERLAY_ID)) {
        const publisher = document.createElement('div');
        publisher.id = PUBLISHER_OVERLAY_ID;
        publisher.className = 'modal-overlay newsx-modal-overlay';
        publisher.setAttribute('aria-hidden', 'true');
        publisher.innerHTML = `
            <div id="newsx-publisher-modal" class="modal-content newsx-publisher-modal" role="dialog" aria-modal="true" aria-labelledby="newsx-publisher-title" data-lux-transparency-exempt="1">
                <div id="newsx-publisher-panel"></div>
            </div>
        `;
        document.body.appendChild(publisher);
    }
    if (!q(SECTIONS_OVERLAY_ID)) {
        const sections = document.createElement('div');
        sections.id = SECTIONS_OVERLAY_ID;
        sections.className = 'modal-overlay newsx-modal-overlay';
        sections.setAttribute('aria-hidden', 'true');
        sections.innerHTML = `
            <div id="newsx-sections-modal" class="modal-content newsx-sections-modal" role="dialog" aria-modal="true" aria-labelledby="newsx-sections-title" data-lux-transparency-exempt="1">
                <div id="newsx-sections-panel"></div>
            </div>
        `;
        document.body.appendChild(sections);
    }
    if (!q(ATTACHMENT_VIEWER_OVERLAY_ID)) {
        const viewer = document.createElement('div');
        viewer.id = ATTACHMENT_VIEWER_OVERLAY_ID;
        viewer.className = 'modal-overlay newsx-modal-overlay';
        viewer.setAttribute('aria-hidden', 'true');
        viewer.innerHTML = `
            <div id="newsx-attachment-viewer-modal" class="modal-content newsx-attachment-viewer-modal" role="dialog" aria-modal="true" aria-labelledby="newsx-attachment-viewer-title" data-lux-transparency-exempt="1">
                <div id="newsx-attachment-viewer-panel"></div>
            </div>
        `;
        document.body.appendChild(viewer);
    }
    if (!q(POST_DETAIL_OVERLAY_ID)) {
        const detail = document.createElement('div');
        detail.id = POST_DETAIL_OVERLAY_ID;
        detail.className = 'modal-overlay newsx-modal-overlay';
        detail.setAttribute('aria-hidden', 'true');
        detail.innerHTML = `
            <div id="newsx-post-detail-modal" class="modal-content newsx-post-detail-modal" role="dialog" aria-modal="true" aria-labelledby="newsx-post-detail-title" data-lux-transparency-exempt="1">
                <div id="newsx-post-detail-panel"></div>
            </div>
        `;
        document.body.appendChild(detail);
    }
}

function setNewsModalOpen(overlayId, open) {
    const overlay = q(overlayId);
    if (!overlay) return;
    overlay.classList.toggle('active', open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    const anyOpen = Boolean(q(PUBLISHER_OVERLAY_ID)?.classList.contains('active'))
        || Boolean(q(CONFIRM_OVERLAY_ID)?.classList.contains('active'))
        || Boolean(q(SECTIONS_OVERLAY_ID)?.classList.contains('active'))
        || Boolean(q(ATTACHMENT_VIEWER_OVERLAY_ID)?.classList.contains('active'))
        || Boolean(q(POST_DETAIL_OVERLAY_ID)?.classList.contains('active'));
    document.body.classList.toggle('news-modal-open', anyOpen);
}

const newsOverlayDismissPointers = {};

function isNewsOverlayBackdropTarget(target, overlayId) {
    return target instanceof Element && target.id === overlayId;
}

function trackNewsOverlayDismissPointer(event, overlayId) {
    if (isNewsOverlayBackdropTarget(event.target, overlayId)) {
        newsOverlayDismissPointers[overlayId] = event.pointerId;
        return;
    }
    delete newsOverlayDismissPointers[overlayId];
}

function maybeDismissNewsOverlay(event, overlayId, onDismiss) {
    if (newsOverlayDismissPointers[overlayId] === event.pointerId
        && isNewsOverlayBackdropTarget(event.target, overlayId)) {
        onDismiss();
    }
    delete newsOverlayDismissPointers[overlayId];
}

function installNewsOverlayDismissHandlers() {
    if (document.documentElement.dataset.newsOverlayDismissBound === '1') return;
    document.documentElement.dataset.newsOverlayDismissBound = '1';
    document.addEventListener('pointerdown', event => {
        trackNewsOverlayDismissPointer(event, PUBLISHER_OVERLAY_ID);
        trackNewsOverlayDismissPointer(event, CONFIRM_OVERLAY_ID);
        trackNewsOverlayDismissPointer(event, SECTIONS_OVERLAY_ID);
        trackNewsOverlayDismissPointer(event, ATTACHMENT_VIEWER_OVERLAY_ID);
        trackNewsOverlayDismissPointer(event, POST_DETAIL_OVERLAY_ID);
    }, true);
    document.addEventListener('pointerup', event => {
        maybeDismissNewsOverlay(event, PUBLISHER_OVERLAY_ID, () => window.closeNewsPublisherModal());
        maybeDismissNewsOverlay(event, CONFIRM_OVERLAY_ID, closeNewsConfirmModal);
        maybeDismissNewsOverlay(event, SECTIONS_OVERLAY_ID, () => window.closeNewsSectionsManager());
        maybeDismissNewsOverlay(event, ATTACHMENT_VIEWER_OVERLAY_ID, () => window.closeNewsAttachmentViewer?.());
        maybeDismissNewsOverlay(event, POST_DETAIL_OVERLAY_ID, () => window.closeNewsPostDetail?.());
    }, true);
}

let newsConfirmCleanup = null;

function closeNewsConfirmModal() {
    if (typeof newsConfirmCleanup === 'function') {
        newsConfirmCleanup();
        newsConfirmCleanup = null;
    }
    setNewsModalOpen(CONFIRM_OVERLAY_ID, false);
    const panel = q('newsx-confirm-panel');
    if (panel) panel.innerHTML = '';
}

function openNewsConfirmModal(config = {}) {
    closeNewsConfirmModal();
    const {
        title = 'Confirm',
        message = '',
        confirmLabel = 'Confirm',
        danger = false,
        onConfirm
    } = config;
    const panel = q('newsx-confirm-panel');
    if (!panel) return;
    panel.innerHTML = `
        <div class="newsx-confirm-head">
            <h2 class="newsx-confirm-title">${danger ? '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ' : ''}${escapeHtml(title)}</h2>
        </div>
        <p class="newsx-confirm-message">${escapeHtml(message)}</p>
        <div class="newsx-confirm-actions">
            <button type="button" class="newsx-btn lux-secondary-btn" data-news-confirm-cancel>Cancel</button>
            <button type="button" class="newsx-btn ${danger ? 'newsx-confirm-danger lux-secondary-btn' : 'newsx-btn-primary lux-primary-btn'}" data-news-confirm-submit data-lux-button-tone="${danger ? 'danger' : 'primary'}">${escapeHtml(confirmLabel)}</button>
        </div>
    `;
    setNewsModalOpen(CONFIRM_OVERLAY_ID, true);
    const onKeyDown = (event) => {
        if (event.key === 'Escape') closeNewsConfirmModal();
    };
    newsConfirmCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    window.addEventListener('keydown', onKeyDown);
    panel.querySelector('[data-news-confirm-cancel]')?.addEventListener('click', closeNewsConfirmModal);
    panel.querySelector('[data-news-confirm-submit]')?.addEventListener('click', () => {
        if (typeof onConfirm === 'function') onConfirm();
        closeNewsConfirmModal();
    });
    panel.querySelector('[data-news-confirm-submit]')?.focus();
}

function openNewsSectionReassignModal({ sectionLabel = '', sectionKey = '', count = 0, targets = [], onConfirm } = {}) {
    closeNewsConfirmModal();
    const panel = q('newsx-confirm-panel');
    if (!panel || !targets.length) return;
    const noun = count === 1 ? 'announcement' : 'announcements';
    const options = targets.map(target => `
        <option value="${escapeHtml(target.key)}">${escapeHtml(target.label || target.key)}</option>
    `).join('');
    panel.innerHTML = `
        <div class="newsx-confirm-head">
            <h2 class="newsx-confirm-title"><i class="fas fa-right-left" aria-hidden="true"></i> ${escapeHtml('Move announcements')}</h2>
        </div>
        <p class="newsx-confirm-message">${escapeHtml(sectionLabel || sectionKey)} has ${count} ${noun}. Choose where to move them before removing this section.</p>
        <label class="newsx-sections-reassign-field">
            <span class="newsx-meta">Move to</span>
            <select id="news-sections-reassign-target" name="news_sections_reassign_target" class="newsx-select lux-control" data-news-sections-reassign-target>
                ${options}
            </select>
        </label>
        <div class="newsx-confirm-actions">
            <button type="button" class="newsx-btn lux-secondary-btn" data-news-confirm-cancel>Cancel</button>
            <button type="button" class="newsx-btn newsx-confirm-danger lux-secondary-btn" data-news-confirm-submit data-lux-button-tone="danger">Remove section</button>
        </div>
    `;
    setNewsModalOpen(CONFIRM_OVERLAY_ID, true);
    const onKeyDown = (event) => {
        if (event.key === 'Escape') closeNewsConfirmModal();
    };
    newsConfirmCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    window.addEventListener('keydown', onKeyDown);
    panel.querySelector('[data-news-confirm-cancel]')?.addEventListener('click', closeNewsConfirmModal);
    panel.querySelector('[data-news-confirm-submit]')?.addEventListener('click', () => {
        const select = panel.querySelector('[data-news-sections-reassign-target]');
        const toKey = String(select?.value || '').trim();
        if (!toKey) return;
        if (typeof onConfirm === 'function') onConfirm(toKey);
        closeNewsConfirmModal();
    });
    panel.querySelector('[data-news-sections-reassign-target]')?.focus();
}


function renderNewsEmptyState(title, copy = '') {
    return `
        <div class="lux-empty-state newsx-empty">
            <i class="fas fa-newspaper"></i>
            <strong class="lux-empty-state__title">${escapeHtml(title)}</strong>
            ${copy ? `<span class="lux-empty-state__copy">${escapeHtml(copy)}</span>` : ''}
        </div>
    `;
}

function renderNewsErrorState(copy) {
    return `
        <div class="lux-empty-state lux-error-state newsx-error">
            <i class="fas fa-triangle-exclamation"></i>
            <strong class="lux-empty-state__title">News feed unavailable</strong>
            <span class="lux-empty-state__copy">${escapeHtml(copy || 'The News workspace is unavailable right now.')}</span>
        </div>
    `;
}

function q(id) {
    return document.getElementById(id);
}

function setNewsRegionMarkup(element, key, markup) {
    if (!element) return;
    if (runtime.renderCache[key] === markup) return;
    element.innerHTML = markup;
    runtime.renderCache[key] = markup;
}

function clearNewsRegionMarkup(element, key) {
    if (element) element.innerHTML = '';
    delete runtime.renderCache[key];
}

function ensureNewsWorkspaceShell(root) {
    if (!root) return null;
    // Workspace must track opacity slider; only modals stay exempt.
    root.removeAttribute('data-lux-transparency-exempt');
    let shell = root.querySelector('[data-news-shell="1"]');
    const needsContinuousShell = !shell
        || !shell.classList.contains('newsx-shell')
        || root.querySelector('.newsx-feed-shell')
        || root.querySelector('.newsx-layout');
    if (needsContinuousShell) {
        root.innerHTML = `
            <div class="newsx-shell" data-news-shell="1" data-lux-glass-root="1">
                <div id="newsx-sidebar-region"></div>
                <main class="newsx-main">
                    <div id="newsx-header-region"></div>
                    <section id="newsx-feed-region" class="newsx-feed"></section>
                </main>
            </div>
        `;
        shell = root.querySelector('[data-news-shell="1"]');
        runtime.renderCache = {};
    }
    return {
        sidebar: root.querySelector('#newsx-sidebar-region'),
        header: root.querySelector('#newsx-header-region'),
        feed: root.querySelector('#newsx-feed-region')
    };
}

function uniqueStrings(values = []) {
    return [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))];
}

function toFieldToken(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'field';
}

function getCurrentRole() {
    try {
        return String(typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : 'student').trim().toLowerCase() || 'student';
    } catch (error) {
        return 'student';
    }
}

function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function' ? (getCurrentUser() || null) : null;
    } catch (error) {
        return null;
    }
}

function ensureNewsHeaderFiltersCollapsed() {
    if (runtime.headerFiltersCollapsed === null || runtime.headerFiltersCollapsed === undefined) {
        try {
            runtime.headerFiltersCollapsed = window.matchMedia('(max-width: 920px)').matches;
        } catch (error) {
            runtime.headerFiltersCollapsed = false;
        }
    }
    return Boolean(runtime.headerFiltersCollapsed);
}

function ensureNewsSidebarSectionsCollapsed() {
    if (runtime.sidebarSectionsCollapsed === null || runtime.sidebarSectionsCollapsed === undefined) {
        try {
            runtime.sidebarSectionsCollapsed = window.matchMedia('(max-width: 920px)').matches;
        } catch (error) {
            runtime.sidebarSectionsCollapsed = false;
        }
    }
    return Boolean(runtime.sidebarSectionsCollapsed);
}

function canManageNews() {
    return getCurrentRole() === 'admin' || (typeof userHasPortalPrivilege === 'function' && userHasPortalPrivilege('manage_news'));
}


function getFacultyOptions() {
    const emptyState = typeof KIU_EMPTY_STATE !== 'undefined' ? KIU_EMPTY_STATE : null;
    const profiles = KIU_STATE?.facultyProfiles || emptyState?.facultyProfiles || {};
    return Object.entries(profiles).map(([code, profile]) => ({
        code: String(code || '').trim().toUpperCase(),
        label: String(profile?.name || code || '').trim()
    }));
}

function formatNewsCourseIdsInput(courseIds = []) {
    return uniqueStrings(courseIds).join(', ');
}

function parseNewsCourseIdsInput(value = '') {
    return uniqueStrings(String(value || '').split(',').map(part => part.trim()).filter(Boolean));
}

function renderNewsBodyHtml(post) {
    const body = String(post?.body || '');
    if (typeof window.renderNewsMarkdownHtml === 'function') {
        return window.renderNewsMarkdownHtml(body);
    }
    return escapeHtml(body);
}

function getNewsSectionSuggestions() {
    const labels = new Set();
    (runtime.sectionCatalog || []).forEach(section => {
        if (section?.label) labels.add(String(section.label));
    });
    (runtime.sections || []).forEach(section => {
        if (section?.label) labels.add(String(section.label));
    });
    return [...labels];
}

function focusNewsPostCard(postId) {
    const normalizedId = String(postId || '').trim();
    if (!normalizedId) return false;
    const root = q(ROOT_ID);
    const escapedId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(normalizedId)
        : normalizedId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const host = root?.querySelector(`[data-news-post-host="1"][data-news-post-id="${escapedId}"]`);
    if (!host) return false;
    host.classList.add('newsx-post-card--focused');
    host.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => host.classList.remove('newsx-post-card--focused'), 3200);
    if (typeof window.openNewsPostDetail === 'function') {
        window.openNewsPostDetail({ postId: normalizedId });
    }
    return true;
}

function applyNewsDeepLinkFocus() {
    const postId = typeof window.resolveNewsDeepLinkPostId === 'function'
        ? window.resolveNewsDeepLinkPostId()
        : '';
    if (!postId) return;
    window.requestAnimationFrame(() => {
        if (!focusNewsPostCard(postId)) {
            runtime.pendingDeepLinkPostId = postId;
        }
    });
}

function formatDateTime(value) {
    if (!value) return 'Unscheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '');
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}


function splitNewsRenderSignature(signature = '') {
    const parts = String(signature || '').split('|');
    return {
        loading: parts[0] || '',
        error: parts[1] || '',
        section: parts[2] || '',
        search: parts[3] || '',
        feedFilters: parts[4] || '',
        sections: parts[5] || '',
        posts: parts[6] || '',
        replyDrafts: parts[7] || ''
    };
}

const NEWS_SECTION_ICON_CHOICES = [
    'fa-graduation-cap', 'fa-university', 'fa-building-columns', 'fa-landmark',
    'fa-book', 'fa-book-open', 'fa-bookmark', 'fa-file-lines',
    'fa-chalkboard', 'fa-chalkboard-user', 'fa-user-graduate', 'fa-users',
    'fa-flask', 'fa-microscope', 'fa-atom', 'fa-laptop-code',
    'fa-calendar-star', 'fa-calendar-days', 'fa-clock', 'fa-bullhorn',
    'fa-newspaper', 'fa-door-open', 'fa-id-card', 'fa-clipboard-list',
    'fa-briefcase', 'fa-handshake', 'fa-globe', 'fa-earth-americas',
    'fa-lightbulb', 'fa-award', 'fa-trophy', 'fa-heart-pulse',
    'fa-stethoscope', 'fa-scale-balanced', 'fa-palette', 'fa-music'
];

function normalizeNewsSectionIcon(value = '') {
    const raw = String(value || '').trim().toLowerCase().replace(/^fas\s+/, '');
    const icon = raw.startsWith('fa-') ? raw : (raw ? `fa-${raw}` : '');
    return NEWS_SECTION_ICON_CHOICES.includes(icon) ? icon : '';
}

function getSectionIcon(keyOrSection = '') {
    const section = keyOrSection && typeof keyOrSection === 'object' ? keyOrSection : null;
    const key = normalizeNewsSectionKey(section?.key || keyOrSection);
    const stored = normalizeNewsSectionIcon(section?.icon
        || (runtime.sectionCatalog || []).find(item => normalizeNewsSectionKey(item?.key) === key)?.icon
        || (runtime.sections || []).find(item => normalizeNewsSectionKey(item?.key) === key)?.icon);
    if (stored) return stored;
    const map = {
        'academic-updates': 'fa-graduation-cap',
        'campus-life': 'fa-university',
        'events': 'fa-calendar-star',
        'announcements': 'fa-bullhorn',
        'admissions': 'fa-door-open',
        'research': 'fa-flask'
    };
    return map[key] || 'fa-folder';
}

function collectNewsSectionIconUsage(excludeIndex = -1) {
    const usage = new Map();
    (runtime.sectionsDraft || []).forEach((entry, index) => {
        if (index === excludeIndex) return;
        const key = entry?.key || normalizeNewsSectionKey(entry?.label);
        const icon = normalizeNewsSectionIcon(entry?.icon) || getSectionIcon({ key, icon: entry?.icon });
        if (!icon) return;
        const label = String(entry?.label || key || 'Section').trim() || 'Section';
        const list = usage.get(icon) || [];
        list.push(label);
        usage.set(icon, list);
    });
    return usage;
}

function openNewsSectionIconPickerModal({ sectionLabel = '', currentIcon = '', excludeIndex = -1, onPick } = {}) {
    closeNewsConfirmModal();
    const panel = q('newsx-confirm-panel');
    if (!panel) return;
    const selected = normalizeNewsSectionIcon(currentIcon) || 'fa-newspaper';
    const label = String(sectionLabel || '').trim() || 'this section';
    const usedByIcon = collectNewsSectionIconUsage(excludeIndex);
    const iconGrid = NEWS_SECTION_ICON_CHOICES.map(choice => {
        const usedLabels = usedByIcon.get(choice) || [];
        const isUsed = usedLabels.length > 0;
        const isActive = choice === selected;
        const usedTitle = isUsed ? `Used by ${usedLabels.join(', ')}` : choice;
        const ariaLabel = isUsed ? `${choice} (used by ${usedLabels.join(', ')})` : choice;
        return `
        <button type="button" class="newsx-sections-icon-option${isActive ? ' is-active' : ''}${isUsed ? ' is-used' : ''}" data-news-sections-icon-pick data-icon="${choice}" aria-label="${escapeHtml(ariaLabel)}" title="${escapeHtml(usedTitle)}"${isActive ? ' aria-pressed="true"' : ''}${isUsed ? ' data-news-sections-icon-used="1"' : ''}>
            <i class="fas ${choice}" aria-hidden="true"></i>
        </button>
    `;
    }).join('');
    panel.innerHTML = `
        <div class="newsx-confirm-head">
            <h2 class="newsx-confirm-title"><i class="fas fa-icons" aria-hidden="true"></i> ${escapeHtml('Choose icon')}</h2>
        </div>
        <p class="newsx-confirm-message">${escapeHtml(`Pick an icon for ${label}. Icons already on the list are marked.`)}</p>
        <div class="newsx-sections-icon-picker" role="listbox" aria-label="Section icons">
            <div class="newsx-sections-icon-grid">${iconGrid}</div>
        </div>
        <div class="newsx-confirm-actions">
            <button type="button" class="newsx-btn lux-secondary-btn" data-news-confirm-cancel>Cancel</button>
        </div>
    `;
    setNewsModalOpen(CONFIRM_OVERLAY_ID, true);
    const onKeyDown = (event) => {
        if (event.key === 'Escape') closeNewsConfirmModal();
    };
    newsConfirmCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    window.addEventListener('keydown', onKeyDown);
    panel.querySelector('[data-news-confirm-cancel]')?.addEventListener('click', closeNewsConfirmModal);
    panel.querySelectorAll('[data-news-sections-icon-pick]').forEach(button => {
        button.addEventListener('click', () => {
            const icon = normalizeNewsSectionIcon(button.getAttribute('data-icon'));
            if (!icon) return;
            if (typeof onPick === 'function') onPick(icon);
            closeNewsConfirmModal();
        });
    });
    panel.querySelector('.newsx-sections-icon-option.is-active, [data-news-sections-icon-pick]')?.focus();
}

function stripNewsTitlePlainText(value) {
    if (typeof window.stripNewsMarkdownPlainText === 'function') {
        return window.stripNewsMarkdownPlainText(value);
    }
    return String(value || '').trim();
}

function renderNewsTitleHtml(title, fallback = 'University update') {
    const raw = String(title || '').trim();
    if (!raw) return escapeHtml(fallback);
    if (typeof window.renderNewsTitleMarkdownHtml === 'function') {
        return window.renderNewsTitleMarkdownHtml(raw);
    }
    return escapeHtml(raw);
}

function buildNewsRenderSignature() {
    return [
        runtime.loading ? 'loading' : 'idle',
        runtime.error || '',
        runtime.selectedSection || 'all',
        runtime.search || '',
        JSON.stringify(runtime.feedFilters || {}),
        JSON.stringify(runtime.sections || []),
        JSON.stringify((runtime.posts || []).map((post) => ({
            id: post?.id || '',
            pinned: Boolean(post?.pinned),
            privateReplyCount: Number(post?.privateReplyCount || 0),
            publicReplyCount: Number(post?.publicReplyCount || 0),
            replyMode: resolveNewsReplyMode(post),
            updatedAt: post?.updatedAt || post?.publishedAt || post?.createdAt || ''
        }))),
        JSON.stringify(Object.keys(runtime.replyDrafts || {}).sort().map((key) => [key, runtime.replyDrafts[key]]))
    ].join('|');
}

function enhanceNewsWorkspacePickers() {
    const root = q(ROOT_ID);
    if (!root || typeof window.enhanceUniversalPickers !== 'function') return;
    window.enhanceUniversalPickers(root);
}

function syncNewsFilterMeta() {
    const root = q(ROOT_ID);
    const filter = root?.querySelector('.newsx-filter');
    if (!filter) return;
    const meta = filter.querySelector('.newsx-filter-meta');
    if (meta) meta.textContent = `${runtime.posts.length} matching announcements`;
    const shouldShowError = Boolean(runtime.error && !runtime.publisherModalOpen);
    let errorHost = filter.querySelector('.newsx-error');
    if (shouldShowError && !errorHost) {
        filter.insertAdjacentHTML('beforeend', renderNewsErrorState(runtime.error));
    } else if (shouldShowError && errorHost) {
        const copy = errorHost.querySelector('.lux-empty-state__copy');
        if (copy) copy.textContent = runtime.error;
    } else if (!shouldShowError && errorHost) {
        errorHost.remove();
    }
}

function syncNewsFilterErrorRegion() {
    const root = q(ROOT_ID);
    const shell = ensureNewsWorkspaceShell(root);
    if (!shell?.header) return;
    let currentUser = getCurrentUserSafe();
    if (!currentUser?.id) {
        currentUser = { id: 'local-user', displayName: 'Campus User', name: 'User', role: 'student' };
    }
    setNewsRegionMarkup(shell.header, 'header', renderNewsHeaderBar(currentUser));
    enhanceNewsWorkspacePickers();
}

function syncNewsSectionActiveState(sectionKey) {
    const root = q(ROOT_ID);
    if (!root) return;
    const nextSection = String(sectionKey || 'all');
    root.querySelectorAll('[data-news-section]').forEach(button => {
        const key = button.getAttribute('data-news-section') || '';
        button.classList.toggle('is-active', key === nextSection);
    });
}

function isNewsWorkspaceVisible() {
    if (typeof getActivePageId === 'function' && getActivePageId() === 'news') return true;
    const page = document.getElementById('page-news');
    if (!page) return false;
    return page.classList.contains('active-page') || page.style.display !== 'none';
}

function shouldBootstrapNewsWorkspace() {
    if (document.body?.classList?.contains('lux-route-news')) return true;
    return isNewsWorkspaceVisible();
}

