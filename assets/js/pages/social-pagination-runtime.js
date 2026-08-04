/* Optional numbered pagination for repeatable Social collections. */
(function initSocialPaginationRuntime() {
    'use strict';

    if (window.__KIU_SOCIAL_PAGINATION_LOADED) return;
    window.__KIU_SOCIAL_PAGINATION_LOADED = true;

    const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
    const DEFAULT_PAGE_SIZE = 20;
    const MODE_KEY = 'KIU_SOCIAL_PAGINATION_MODE';
    const PAGE_SIZE_KEY = 'KIU_SOCIAL_PAGINATION_PAGE_SIZE';
    const MODE_INFINITE = 'infinite';
    const MODE_PAGES = 'pages';
    const VALID_MODES = new Set([MODE_INFINITE, MODE_PAGES]);
    const VALID_PANELS = new Set([
        'feed', 'community', 'groups', 'workspace', 'projects', 'pages',
        'events', 'surveys', 'research', 'photography', 'lost-and-found',
        'messages', 'alerts', 'profile'
    ]);
    const PANEL_ITEM_SELECTORS = {
        feed: ['.social-neo-post-card'],
        community: ['.social-neo-directory-item'],
        groups: ['.social-neo-group-card'],
        workspace: [
            '.social-project-activity-item',
            '.social-project-my-task-item',
            '.social-project-roster-member',
            '.social-project-task-card',
            '.social-project-row',
            '.social-project-card-new',
            '.social-portfolio-card',
            '.spt-desk-card',
            '.spt-desk-package'
        ],
        projects: [
            '.social-project-activity-item',
            '.social-project-my-task-item',
            '.social-project-roster-member',
            '.social-project-task-card',
            '.social-project-row',
            '.social-project-card-new',
            '.social-portfolio-card',
            '.spt-desk-card',
            '.spt-desk-package'
        ],
        pages: ['.social-neo-page-card-rich'],
        events: [
            '.social-neo-event-feature',
            '.social-neo-events-manage-item',
            '.social-neo-entity-card--study'
        ],
        surveys: ['.social-neo-survey-card'],
        research: ['.social-neo-research-card'],
        photography: ['.social-photo-grid-tile', '.social-photo-feed-card'],
        'lost-and-found': ['.social-neo-lf-card'],
        messages: ['.social-neo-chat-item'],
        alerts: ['.sn-alert-card'],
        profile: ['.social-neo-post-card', '.social-neo-friend-chip']
    };
    const FILTER_STATE_KEYS = [
        'homeFeedFilter',
        'socialBrowseFaculty',
        'communityTab',
        'directorySearch',
        'directoryRole',
        'groupsTab',
        'pagesTab',
        'pagesSearch',
        'eventsStudentFilter',
        'eventsSubTab',
        'eventsTab',
        'surveysTab',
        'surveysSubTab',
        'surveysSearch',
        'photographyMyProfile',
        'photographyProfileUserId',
        'photographySearch',
        'lostFoundTab',
        'lostFoundSearch',
        'researchTab',
        'researchSearch',
        'messagesFilter',
        'projectTab',
        'projectDiscoverSearch',
        'projectDiscoverFaculty',
        'projectDiscoverRole',
        'projectDiscoverTag',
        'projectTaskFilter',
        'projectTaskSearch',
        'projectTaskFilterPriority',
        'projectTaskFilterAssignee',
        'projectTaskMyOnly',
        'projectTaskFilterOverdue',
        'projectTaskFocus',
        'projectTaskTimeWindow',
        'portfolioPanelTab'
    ];

    function runtime() {
        return window.__kiuSocialLiteRuntime || { ui: {} };
    }

    function ui() {
        const value = runtime();
        value.ui = value.ui && typeof value.ui === 'object' ? value.ui : {};
        value.ui.socialPaginationPages = value.ui.socialPaginationPages
            && typeof value.ui.socialPaginationPages === 'object'
            ? value.ui.socialPaginationPages
            : {};
        value.ui.socialPaginationFilters = value.ui.socialPaginationFilters
            && typeof value.ui.socialPaginationFilters === 'object'
            ? value.ui.socialPaginationFilters
            : {};
        return value.ui;
    }

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function escape(value) {
        if (typeof window.escape === 'function') return window.escape(value);
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeMode(value) {
        return VALID_MODES.has(text(value)) ? text(value) : MODE_INFINITE;
    }

    function normalizePanel(value) {
        const panel = text(value);
        return VALID_PANELS.has(panel) ? panel : '';
    }

    function normalizePage(value) {
        const page = Number.parseInt(String(value || ''), 10);
        return Number.isFinite(page) && page > 0 ? page : 1;
    }

    function normalizePageSize(value) {
        const pageSize = Number.parseInt(String(value || ''), 10);
        return PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE;
    }

    function pageSize() {
        const currentUi = ui();
        currentUi.socialPaginationPageSize = normalizePageSize(currentUi.socialPaginationPageSize);
        return currentUi.socialPaginationPageSize;
    }

    function readUrl() {
        try {
            return new URL(window.location.href);
        } catch (error) {
            return null;
        }
    }

    function currentPanel() {
        return normalizePanel(ui().activePanel) || 'feed';
    }

    function filterFingerprint(panel) {
        const currentUi = ui();
        const selected = {};
        FILTER_STATE_KEYS.forEach((key) => {
            if (currentUi[key] !== undefined) selected[key] = currentUi[key];
        });
        if (panel === 'workspace' || panel === 'projects') {
            selected.activeProjectId = currentUi.activeProjectId || '';
            selected.projectTab = currentUi.projectTab || '';
        }
        return `${panel}|${JSON.stringify(selected)}`;
    }

    function pageFor(panel = currentPanel()) {
        return normalizePage(ui().socialPaginationPages[panel]);
    }

    function updateUrl(panel = currentPanel()) {
        const url = readUrl();
        if (!url) return;
        const currentUi = ui();
        url.searchParams.set('socialView', normalizeMode(currentUi.socialPaginationMode));
        url.searchParams.set('socialPanel', panel);
        url.searchParams.set('socialPageSize', String(pageSize()));
        if (normalizeMode(currentUi.socialPaginationMode) === MODE_PAGES) {
            url.searchParams.set('socialPage', String(pageFor(panel)));
        } else {
            url.searchParams.delete('socialPage');
        }
        try {
            window.history.replaceState(window.history.state, '', url);
        } catch (error) {}
    }

    function persistMode(mode) {
        try {
            window.localStorage.setItem(MODE_KEY, mode);
        } catch (error) {}
    }

    function persistPageSize(value) {
        try {
            window.localStorage.setItem(PAGE_SIZE_KEY, String(value));
        } catch (error) {}
    }

    function initializeState() {
        const currentUi = ui();
        let storedMode = '';
        let storedPageSize = '';
        try {
            storedMode = window.localStorage.getItem(MODE_KEY) || '';
            storedPageSize = window.localStorage.getItem(PAGE_SIZE_KEY) || '';
        } catch (error) {}
        currentUi.socialPaginationMode = normalizeMode(storedMode || MODE_INFINITE);
        currentUi.socialPaginationPageSize = normalizePageSize(storedPageSize || DEFAULT_PAGE_SIZE);
        applyUrlState();
        currentUi.socialPaginationFilters[currentPanel()] = filterFingerprint(currentPanel());
    }

    function applyUrlState() {
        const currentUi = ui();
        const url = readUrl();
        const urlMode = url?.searchParams.get('socialView') || '';
        const urlPanel = normalizePanel(url?.searchParams.get('socialPanel'));
        const urlPageSize = url?.searchParams.get('socialPageSize') || '';
        if (VALID_MODES.has(text(urlMode))) currentUi.socialPaginationMode = normalizeMode(urlMode);
        if (PAGE_SIZE_OPTIONS.includes(Number.parseInt(urlPageSize, 10))) {
            currentUi.socialPaginationPageSize = normalizePageSize(urlPageSize);
        }
        if (urlPanel) currentUi.activePanel = urlPanel;
        if (currentUi.socialPaginationMode === MODE_PAGES) {
            const pagePanel = urlPanel || currentPanel();
            currentUi.socialPaginationPages[pagePanel] = normalizePage(url?.searchParams.get('socialPage'));
        }
    }

    function rerender(reason) {
        const render = window.renderSocialPageNow || window.__kiuSocialLiteRenderPage;
        if (typeof render === 'function') render(reason);
    }

    function setMode(nextMode) {
        const currentUi = ui();
        const mode = normalizeMode(nextMode);
        currentUi.socialPaginationMode = mode;
        if (mode === MODE_PAGES) currentUi.socialPaginationPages[currentPanel()] = 1;
        persistMode(mode);
        updateUrl(currentPanel());
        rerender('social-pagination-mode');
    }

    function setPageSize(nextPageSize) {
        const currentUi = ui();
        const next = normalizePageSize(nextPageSize);
        currentUi.socialPaginationPageSize = next;
        currentUi.socialPaginationPages[currentPanel()] = 1;
        persistPageSize(next);
        updateUrl(currentPanel());
        rerender('social-pagination-page-size');
    }

    function setPage(panel, nextPage) {
        const currentUi = ui();
        const normalizedPanel = normalizePanel(panel) || currentPanel();
        currentUi.socialPaginationPages[normalizedPanel] = normalizePage(nextPage);
        currentUi.socialPaginationMode = MODE_PAGES;
        persistMode(MODE_PAGES);
        updateUrl(normalizedPanel);
        rerender('social-pagination-page');
    }

    function syncPanel(panel) {
        const normalizedPanel = normalizePanel(panel) || currentPanel();
        const currentUi = ui();
        const previousFingerprint = currentUi.socialPaginationFilters[normalizedPanel];
        const nextFingerprint = filterFingerprint(normalizedPanel);
        if (previousFingerprint && previousFingerprint !== nextFingerprint) {
            currentUi.socialPaginationPages[normalizedPanel] = 1;
        }
        currentUi.socialPaginationFilters[normalizedPanel] = nextFingerprint;
        currentUi.socialPaginationActivePanel = normalizedPanel;
        updateUrl(normalizedPanel);
    }

    function pageNumbers(totalPages, currentPage) {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
        const numbers = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        return Array.from(numbers)
            .filter((page) => page > 0 && page <= totalPages)
            .sort((left, right) => left - right);
    }

    function renderPageButton(panel, page, currentPage) {
        const active = page === currentPage;
        return `<button type="button" class="lux-secondary-btn social-pagination-page-btn${active ? ' is-active' : ''}" data-action="social-pagination-page" data-social-pagination-section="${escape(panel)}" data-social-pagination-page="${page}" aria-current="${active ? 'page' : 'false'}">${page}</button>`;
    }

    function renderControls(panel, total, currentPage, size = pageSize()) {
        const totalPages = Math.max(1, Math.ceil(total / size));
        const firstItem = total ? ((currentPage - 1) * size) + 1 : 0;
        const lastItem = Math.min(total, currentPage * size);
        const pages = pageNumbers(totalPages, currentPage);
        const pageMarkup = [];
        pages.forEach((page, index) => {
            if (index > 0 && page - pages[index - 1] > 1) {
                pageMarkup.push('<span class="social-pagination-ellipsis" aria-hidden="true">…</span>');
            }
            pageMarkup.push(renderPageButton(panel, page, currentPage));
        });
        return `
            <nav class="social-pagination-controls" data-social-pagination-controls="${escape(panel)}" aria-label="Pages">
                <span class="social-pagination-summary">Showing ${firstItem}-${lastItem} of ${total}</span>
                <div class="social-pagination-pages" role="group" aria-label="Page navigation">
                    <button type="button" class="lux-secondary-btn social-pagination-page-btn" data-action="social-pagination-page" data-social-pagination-section="${escape(panel)}" data-social-pagination-page="${Math.max(1, currentPage - 1)}" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
                    ${pageMarkup.join('')}
                    <button type="button" class="lux-secondary-btn social-pagination-page-btn" data-action="social-pagination-page" data-social-pagination-section="${escape(panel)}" data-social-pagination-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
                </div>
            </nav>
        `;
    }

    function renderModeControl(panel = currentPanel()) {
        const mode = normalizeMode(ui().socialPaginationMode);
        const selectedPageSize = pageSize();
        return `
            <div class="social-pagination-mode-control lux-soft-chrome home-hover-chip" data-social-pagination-mode-control="1">
                <span class="social-pagination-mode-label">View</span>
                <div class="social-pagination-mode-options" role="group" aria-label="Social content loading mode">
                    <button type="button" class="lux-secondary-btn social-pagination-mode-btn${mode === MODE_INFINITE ? ' is-active' : ''}" data-action="social-pagination-mode" data-social-pagination-mode="infinite" aria-pressed="${mode === MODE_INFINITE ? 'true' : 'false'}">Infinite</button>
                    <button type="button" class="lux-secondary-btn social-pagination-mode-btn${mode === MODE_PAGES ? ' is-active' : ''}" data-action="social-pagination-mode" data-social-pagination-mode="pages" aria-pressed="${mode === MODE_PAGES ? 'true' : 'false'}">Pages</button>
                </div>
                <label class="social-pagination-page-size-control">
                    <span class="social-pagination-mode-label">Items per page</span>
                    <select class="lux-control social-pagination-page-size-select" data-action="social-pagination-page-size" aria-label="Items per page">
                        ${PAGE_SIZE_OPTIONS.map((option) => `<option value="${option}"${selectedPageSize === option ? ' selected' : ''}>${option}</option>`).join('')}
                    </select>
                </label>
            </div>
        `;
    }

    function collectionGroups(center, panel) {
        const selectors = PANEL_ITEM_SELECTORS[panel] || [];
        const groups = [];
        selectors.forEach((selector) => {
            center.querySelectorAll(selector).forEach((item) => {
                let parent = item.parentElement;
                let items = [];
                while (parent && parent !== center) {
                    const directItems = Array.from(parent.children).filter((child) => child.matches(selector));
                    const descendantItems = Array.from(parent.querySelectorAll(selector));
                    if (directItems.length >= 2) {
                        items = directItems;
                        break;
                    }
                    if (descendantItems.length >= 2) {
                        items = descendantItems;
                        break;
                    }
                    parent = parent.parentElement;
                }
                if (!parent || items.length < 2) return;
                if (groups.some((group) => group.parent === parent && group.selector === selector)) return;
                const key = `${selector}::${groups.length}`;
                groups.push({ key, parent, selector, items });
            });
        });
        return groups;
    }

    function decorate(center, panel = currentPanel()) {
        if (!center) return;
        center.querySelectorAll('[data-social-pagination-controls]').forEach((node) => node.remove());
        center.querySelectorAll('[data-social-pagination-hidden="1"]').forEach((node) => {
            node.hidden = false;
            node.removeAttribute('data-social-pagination-hidden');
        });
        center.querySelectorAll('[data-social-pagination-group-hidden="1"]').forEach((node) => {
            node.hidden = false;
            node.removeAttribute('data-social-pagination-group-hidden');
        });
        const currentUi = ui();
        if (normalizeMode(currentUi.socialPaginationMode) !== MODE_PAGES) return;
        syncPanel(panel);
        const groups = collectionGroups(center, panel);
        const currentPage = pageFor(panel);
        const size = pageSize();
        groups.forEach(({ parent, items }) => {
            const totalPages = Math.max(1, Math.ceil(items.length / size));
            const safePage = Math.min(currentPage, totalPages);
            if (safePage !== currentPage) currentUi.socialPaginationPages[panel] = safePage;
            const start = (safePage - 1) * size;
            items.forEach((item, index) => {
                const hidden = index < start || index >= start + size;
                item.hidden = hidden;
                if (hidden) item.dataset.socialPaginationHidden = '1';
                else delete item.dataset.socialPaginationHidden;
                const eventGroup = item.closest('.social-neo-event-date-group');
                if (eventGroup && eventGroup !== parent) {
                    eventGroup.hidden = hidden;
                    if (hidden) eventGroup.dataset.socialPaginationGroupHidden = '1';
                    else delete eventGroup.dataset.socialPaginationGroupHidden;
                }
            });
            parent.insertAdjacentHTML('afterend', renderControls(panel, items.length, safePage, size));
        });
        updateUrl(panel);
    }

    function handleAction(action, trigger) {
        if (action === 'social-pagination-mode') {
            setMode(trigger?.getAttribute('data-social-pagination-mode'));
            return true;
        }
        if (action === 'social-pagination-page') {
            setPage(
                trigger?.getAttribute('data-social-pagination-section'),
                trigger?.getAttribute('data-social-pagination-page')
            );
            return true;
        }
        if (action === 'social-pagination-page-size') {
            setPageSize(trigger?.value || trigger?.getAttribute('data-social-pagination-page-size'));
            return true;
        }
        return false;
    }

    initializeState();
    window.addEventListener?.('popstate', () => {
        applyUrlState();
        rerender('social-pagination-url');
    });
    window.KiuSocialPagination = {
        PAGE_SIZE: DEFAULT_PAGE_SIZE,
        PAGE_SIZE_OPTIONS,
        DEFAULT_PAGE_SIZE,
        MODE_INFINITE,
        MODE_PAGES,
        currentMode: () => normalizeMode(ui().socialPaginationMode),
        currentPageSize: pageSize,
        setMode,
        setPageSize,
        setPage,
        syncPanel,
        renderModeControl,
        decorate,
        handleAction
    };
})();
